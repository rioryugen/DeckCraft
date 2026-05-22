// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { ipcMain, WebContents } from "electron";
import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import { IncomingMessage } from "http";
import * as path from "path";
import { LIBREOFFICE_DOWNLOAD_URLS, LIBREOFFICE_VERSION } from "../utils/libreoffice-urls";
import { getLinuxInstallCommand } from "../utils/libreoffice-check";
import { getTempDir } from "../utils/constants";
import { destroyChildProcessStdio, safeSendToWebContents, terminateChildProcess } from "../utils/lifecycle";
import { killProcess } from "../utils";

const activeLibreOfficeInstallProcesses = new Set<ChildProcess>();
const activeLibreOfficeDownloadAborters = new Set<() => void>();

function trackLibreOfficeChild(child: ChildProcess): () => void {
  activeLibreOfficeInstallProcesses.add(child);
  return () => {
    child.stdout?.removeAllListeners("data");
    child.stderr?.removeAllListeners("data");
    child.removeAllListeners("error");
    child.removeAllListeners("close");
    activeLibreOfficeInstallProcesses.delete(child);
    destroyChildProcessStdio(child);
  };
}

export async function stopActiveLibreOfficeInstallProcesses(): Promise<void> {
  const aborters = Array.from(activeLibreOfficeDownloadAborters);
  activeLibreOfficeDownloadAborters.clear();
  for (const abort of aborters) {
    try {
      abort();
    } catch {
      /* Best-effort cancellation. */
    }
  }

  const processes = Array.from(activeLibreOfficeInstallProcesses);
  activeLibreOfficeInstallProcesses.clear();
  await Promise.all(
    processes.map((process) =>
      terminateChildProcess(process, "LibreOffice install", killProcess).catch(() => {}),
    ),
  );
}

// ---------------------------------------------------------------------------
// IPC helpers
// ---------------------------------------------------------------------------

function sendProgress(
  wc: WebContents,
  phase: "downloading" | "installing" | "done" | "error",
  percent?: number,
  message?: string
) {
  safeSendToWebContents(wc, "lo:progress", { phase, percent, message });
}

function sendLog(
  wc: WebContents,
  level: "info" | "warn" | "error" | "ok" | "cmd",
  text: string
) {
  // Split multi-line output into individual log entries
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  for (const line of lines) {
    safeSendToWebContents(wc, "lo:log", { level, text: line });
  }
}

// ---------------------------------------------------------------------------
// Download with progress
// ---------------------------------------------------------------------------

/** Minimum expected size (bytes). LibreOffice installers are ~280–350 MB; HTML/redirect pages are ~30 KB. */
const MIN_INSTALLER_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Known approximate installer sizes used as fallback when the download server
 * does not send a Content-Length header (e.g. some CDN mirrors strip it).
 * These are intentionally conservative estimates so the progress bar never
 * jumps backward if the actual file is slightly smaller.
 */
const KNOWN_INSTALLER_SIZES = {
  win64:    370 * 1024 * 1024, // ~350–360 MB MSI
  macX64:   400 * 1024 * 1024, // ~370–390 MB DMG
  macArm64: 400 * 1024 * 1024, // ~370–390 MB DMG
};

function downloadWithProgress(
  url: string,
  dest: string,
  filename: string,
  wc: WebContents,
  minSizeBytes: number = MIN_INSTALLER_SIZE_BYTES,
  knownTotalBytes?: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let currentRequest: http.ClientRequest | null = null;
    let currentResponse: IncomingMessage | null = null;
    let currentFile: fs.WriteStream | null = null;

    const cleanup = () => {
      currentResponse?.removeAllListeners("data");
      currentFile?.removeAllListeners("finish");
      currentFile?.removeAllListeners("error");
      currentRequest?.removeAllListeners("error");
      activeLibreOfficeDownloadAborters.delete(abortDownload);
    };

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback();
    };

    const fail = (error: Error) => {
      finish(() => {
        try {
          currentRequest?.on("error", () => {});
          currentRequest?.destroy();
        } catch {
          /* ignore */
        }
        try {
          currentResponse?.destroy();
        } catch {
          /* ignore */
        }
        try {
          currentFile?.destroy();
        } catch {
          /* ignore */
        }
        fs.unlink(dest, () => {});
        reject(error);
      });
    };

    const abortDownload = () => {
      fail(new Error("LibreOffice download was cancelled."));
    };
    activeLibreOfficeDownloadAborters.add(abortDownload);

    const fmtBytes = (bytes: number) => {
      if (bytes <= 0) return "0 B";
      const mb = bytes / 1024 / 1024;
      if (mb >= 1) return `${mb.toFixed(1)} MB`;
      const kb = bytes / 1024;
      return kb >= 1 ? `${kb.toFixed(0)} KB` : `${bytes} B`;
    };

    const fmtSpeed = (bytesPerSec: number) => {
      const mbps = bytesPerSec / 1024 / 1024;
      return mbps >= 1 ? `${mbps.toFixed(1)} MB/s` : `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    };

    const fmtEta = (seconds: number) => {
      if (seconds <= 0 || !isFinite(seconds)) return "";
      if (seconds < 60) return `~${Math.ceil(seconds)}s left`;
      return `~${Math.ceil(seconds / 60)}m left`;
    };

    sendLog(wc, "cmd", `GET ${url}`);
    sendLog(wc, "info", `Connecting to ${new URL(url).hostname}…`);

    const doRequest = (requestUrl: string) => {
      if (settled) {
        return;
      }
      const requester = requestUrl.startsWith("https") ? https.get : http.get;
      currentRequest = requester(requestUrl, (res: IncomingMessage) => {
        currentResponse = res;
        if (
          (res.statusCode === 301 || res.statusCode === 302) &&
          res.headers.location
        ) {
          res.resume();
          sendLog(wc, "info", `HTTP ${res.statusCode} → Redirecting to ${res.headers.location}`);
          doRequest(res.headers.location);
          return;
        }

        if (res.statusCode !== 200) {
          res.resume();
          fail(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }

        const contentLength = parseInt(res.headers["content-length"] ?? "0", 10);
        // Use Content-Length when available; fall back to the caller-supplied
        // known size so the progress bar shows something meaningful even when
        // the CDN mirror omits the header.
        const totalBytes = contentLength > 0 ? contentLength : (knownTotalBytes ?? 0);
        sendLog(wc, "ok", `HTTP 200 OK — ${totalBytes > 0 ? fmtBytes(totalBytes) : "size unknown"}`);
        sendLog(wc, "info", `Saving to: ${dest}`);
        sendLog(wc, "info", `Starting download of ${filename}…`);

        let downloaded = 0;
        const startTime = Date.now();
        let lastLogTime = startTime;
        // Log interval: every 2 seconds or every 5% — whichever fires first
        const LOG_INTERVAL_MS = 2000;
        let lastLoggedPct = 0;

        const file = fs.createWriteStream(dest);
        currentFile = file;

        res.on("data", (chunk: Buffer) => {
          if (settled) {
            return;
          }
          downloaded += chunk.length;
          const now = Date.now();
          const elapsedMs = now - startTime;
          // Cap at 99 while still downloading so 100% only fires on completion
          const percent = totalBytes > 0 ? Math.min(Math.floor((downloaded / totalBytes) * 100), 99) : 0;
          const sizeLabel = totalBytes > 0
            ? `${fmtBytes(downloaded)} / ${fmtBytes(totalBytes)}`
            : fmtBytes(downloaded);

          // Update the progress bar UI on every chunk
          sendProgress(wc, "downloading", percent, `${filename}|${sizeLabel}`);

          // Log every 2 s OR every 5% progress
          const pctBucket = Math.floor(percent / 5) * 5;
          const timeSinceLastLog = now - lastLogTime;
          if (
            (timeSinceLastLog >= LOG_INTERVAL_MS || pctBucket > lastLoggedPct)
            && elapsedMs > 0
          ) {
            lastLogTime = now;
            lastLoggedPct = pctBucket;
            const speed = downloaded / (elapsedMs / 1000);
            const remaining = totalBytes > 0 ? (totalBytes - downloaded) / speed : 0;
            const etaStr = totalBytes > 0 ? `  ${fmtEta(remaining)}` : "";
            const pctStr = totalBytes > 0 ? `${percent}%  ` : "";
            sendLog(
              wc,
              "info",
              `${pctStr}${fmtBytes(downloaded)} downloaded  @ ${fmtSpeed(speed)}${etaStr}`
            );
          }
        });

        res.pipe(file);
        file.on("finish", () =>
          file.close(() => {
            if (settled) {
              return;
            }
            const elapsedSec = (Date.now() - startTime) / 1000;
            const avgSpeed = downloaded / elapsedSec;
            sendLog(wc, "ok", `Download complete — ${fmtBytes(downloaded)} in ${elapsedSec.toFixed(1)}s (avg ${fmtSpeed(avgSpeed)})`);
            if (downloaded < minSizeBytes) {
              fail(
                new Error(
                  `Download failed: received ${fmtBytes(downloaded)} (expected > 50 MB). The server may have returned an HTML page instead of the installer.`
                )
              );
              return;
            }
            finish(resolve);
          })
        );
        file.on("error", (err) => {
          fail(err);
        });
      }).on("error", (err) => {
        fail(err);
      });
    };

    doRequest(url);
  });
}

// ---------------------------------------------------------------------------
// Platform installers
// ---------------------------------------------------------------------------

async function installWindows(wc: WebContents): Promise<void> {
  const url = LIBREOFFICE_DOWNLOAD_URLS.win64;
  const filename = `LibreOffice_${LIBREOFFICE_VERSION}_Win_x86-64.msi`;
  const dest = path.join(getTempDir(), filename);

  sendProgress(wc, "downloading", 0, `${filename}|`);
  await downloadWithProgress(url, dest, filename, wc, MIN_INSTALLER_SIZE_BYTES, KNOWN_INSTALLER_SIZES.win64);

  sendProgress(wc, "installing");
  sendLog(wc, "info", "Requesting administrator rights (UAC prompt may appear)…");
  sendLog(wc, "cmd", `Running: msiexec /i "${filename}" /qn /norestart`);

  await new Promise<void>((resolve, reject) => {
    // Run msiexec elevated via PowerShell; error 1603 often means installer needs admin rights
    const destEscaped = dest.replace(/'/g, "''");
    const ps = `$p = Start-Process -FilePath "msiexec" -ArgumentList "/i", '${destEscaped}', "/qn", "/norestart" -Verb RunAs -Wait -PassThru; if ($p) { exit $p.ExitCode } else { exit 1 }`;
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const cleanupChild = trackLibreOfficeChild(child);
    child.stdout?.on("data", (d: Buffer) => sendLog(wc, "info", d.toString()));
    child.stderr?.on("data", (d: Buffer) => sendLog(wc, "warn", d.toString()));
    child.once("close", (code) => {
      cleanupChild();
      fs.unlink(dest, () => {});
      if (code === 0 || code === 3010) {
        sendLog(wc, "ok", `msiexec exited with code ${code} (success)`);
        resolve();
      } else {
        const hint =
          code === 1603
            ? " — Try closing other apps, freeing disk space, or install LibreOffice manually from libreoffice.org"
            : code === 1
              ? " — Did you cancel the administrator prompt?"
              : "";
        reject(new Error(`msiexec exited with code ${code}${hint}`));
      }
    });
    child.once("error", (err) => {
      cleanupChild();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function installMac(wc: WebContents): Promise<void> {
  const brewPaths = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"];
  const brew = brewPaths.find((p) => fs.existsSync(p));

  if (brew) {
    sendProgress(wc, "installing");
    sendLog(wc, "cmd", `Running: ${brew} install --cask libreoffice`);

    await new Promise<void>((resolve, reject) => {
      const child = spawn(brew, ["install", "--cask", "libreoffice"], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      const cleanupChild = trackLibreOfficeChild(child);
      child.stdout?.on("data", (d: Buffer) => sendLog(wc, "info", d.toString()));
      child.stderr?.on("data", (d: Buffer) => {
        const text = d.toString();
        // brew writes normal output to stderr too
        sendLog(wc, text.toLowerCase().includes("error") ? "error" : "info", text);
      });
      child.once("close", (code) => {
        cleanupChild();
        if (code === 0) {
          sendLog(wc, "ok", "Homebrew install succeeded");
          resolve();
        } else {
          reject(new Error(`brew exit ${code}`));
        }
      });
      child.once("error", (error) => {
        cleanupChild();
        reject(error);
      });
    });
    return;
  }

  // Fallback: download DMG
  const isArm64 = process.arch === "arm64";
  const url = isArm64
    ? LIBREOFFICE_DOWNLOAD_URLS.macArm64
    : LIBREOFFICE_DOWNLOAD_URLS.macX64;
  const filename = `LibreOffice_${LIBREOFFICE_VERSION}_MacOS_${isArm64 ? "aarch64" : "x86-64"}.dmg`;
  const tempDir = getTempDir();
  const dmgPath = path.join(tempDir, filename);
  const mountPoint = path.join(tempDir, "LibreOfficeMount");

  sendProgress(wc, "downloading", 0, `${filename}|`);
  await downloadWithProgress(
    url, dmgPath, filename, wc,
    MIN_INSTALLER_SIZE_BYTES,
    isArm64 ? KNOWN_INSTALLER_SIZES.macArm64 : KNOWN_INSTALLER_SIZES.macX64
  );

  sendProgress(wc, "installing");
  fs.mkdirSync(mountPoint, { recursive: true });

  sendLog(wc, "cmd", `Mounting DMG at ${mountPoint}`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "hdiutil",
      ["attach", dmgPath, "-nobrowse", "-quiet", "-mountpoint", mountPoint],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    const cleanupChild = trackLibreOfficeChild(child);
    child.stdout?.on("data", (d: Buffer) => sendLog(wc, "info", d.toString()));
    child.stderr?.on("data", (d: Buffer) => sendLog(wc, "warn", d.toString()));
    child.once("close", (code) => {
      cleanupChild();
      code === 0 ? resolve() : reject(new Error("hdiutil attach failed"));
    });
    child.once("error", (error) => {
      cleanupChild();
      reject(error);
    });
  });

  try {
    const entries = fs.readdirSync(mountPoint);
    const bundle = entries.find((e) => /^LibreOffice[\s\d.]*\.app$/i.test(e));
    if (!bundle) throw new Error("LibreOffice.app not found in DMG");

    const src = path.join(mountPoint, bundle);
    const applicationsDir = path.join(process.env.HOME ?? "", "Applications");
    const dest = path.join(applicationsDir, bundle);
    fs.mkdirSync(applicationsDir, { recursive: true });
    sendLog(wc, "cmd", `Copying ${bundle} to ~/Applications…`);
    fs.cpSync(src, dest, { recursive: true });
    sendLog(wc, "ok", `Installed to ~/Applications/${bundle}`);
  } finally {
    sendLog(wc, "info", "Unmounting DMG…");
    const detachChild = spawn("hdiutil", ["detach", mountPoint, "-quiet"], { stdio: "ignore" });
    const cleanupDetachChild = trackLibreOfficeChild(detachChild);
    detachChild.once("close", cleanupDetachChild);
    detachChild.once("error", cleanupDetachChild);
    fs.unlink(dmgPath, () => {});
    try { fs.rmdirSync(mountPoint); } catch { /* ignore */ }
  }
}

async function installLinux(wc: WebContents): Promise<void> {
  const installCmd = getLinuxInstallCommand();
  if (!installCmd) {
    throw new Error(
      "Unsupported Linux distribution. Please install LibreOffice manually:\n  sudo apt install libreoffice"
    );
  }

  const isApt = installCmd.cmd === "apt" || installCmd.cmd === "apt-get";

  if (isApt) {
    // apt-get supports APT::Status-Fd which writes machine-readable progress
    // lines to the specified file descriptor.  We route them to stdout (fd=1)
    // so the piped child.stdout stream delivers them without mixing with the
    // regular log output that apt sends to stderr.
    //
    // Status line formats:
    //   dlstatus:<id>:<percent>:<message>   — download progress
    //   pmstatus:<pkg>:<percent>:<message>  — dpkg install progress
    sendProgress(wc, "downloading", 0, "libreoffice|Resolving packages…");
    sendLog(wc, "cmd", "Running: pkexec apt-get install -y libreoffice");
    sendLog(wc, "info", "A system dialog will prompt for your password…");

    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        "pkexec",
        ["apt-get", "install", "-y", "-o", "APT::Status-Fd=1", "libreoffice"],
        { stdio: ["ignore", "pipe", "pipe"] }
      );
      const cleanupChild = trackLibreOfficeChild(child);

      let stdoutBuf = "";

      child.stdout?.on("data", (d: Buffer) => {
        stdoutBuf += d.toString();
        const lines = stdoutBuf.split("\n");
        stdoutBuf = lines.pop() ?? ""; // keep any incomplete trailing line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("dlstatus:")) {
            // dlstatus:<numeric-id>:<percent>:<human-readable-msg>
            const parts = trimmed.split(":");
            const pct = parseFloat(parts[2] ?? "0");
            if (!isNaN(pct)) {
              const msg = parts.slice(3).join(":").trim() || "Downloading packages…";
              sendProgress(wc, "downloading", Math.min(Math.floor(pct), 99), `libreoffice|${msg}`);
            }
          } else if (trimmed.startsWith("pmstatus:")) {
            // pmstatus:<pkg-name>:<percent>:<human-readable-msg>
            const parts = trimmed.split(":");
            const pct = parseFloat(parts[2] ?? "0");
            if (!isNaN(pct)) {
              sendProgress(wc, "installing", Math.min(Math.floor(pct), 99));
            }
          } else {
            sendLog(wc, "info", trimmed);
          }
        }
      });

      child.stderr?.on("data", (d: Buffer) => {
        const text = d.toString();
        sendLog(wc, text.toLowerCase().includes("error") ? "error" : "info", text);
      });

      child.once("close", (code) => {
        cleanupChild();
        if (code === 0) {
          sendLog(wc, "ok", "apt-get exited successfully");
          resolve();
        } else {
          reject(new Error(`apt-get exited with code ${code}`));
        }
      });
      child.once("error", (error) => {
        cleanupChild();
        reject(error);
      });
    });
    return;
  }

  // For dnf, pacman, zypper — use a simple regex to extract any percentage
  // printed to stdout so we can at least animate the progress bar forward.
  sendProgress(wc, "installing");
  const fullCmd = `pkexec ${installCmd.cmd} ${installCmd.args.join(" ")}`;
  sendLog(wc, "cmd", `Running: ${fullCmd}`);
  sendLog(wc, "info", "A system dialog will prompt for your password…");

  const pctRegex = /(\d+)\s*%/;

  await new Promise<void>((resolve, reject) => {
    const child = spawn("pkexec", [installCmd.cmd, ...installCmd.args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const cleanupChild = trackLibreOfficeChild(child);

    child.stdout?.on("data", (d: Buffer) => {
      const text = d.toString();
      const match = pctRegex.exec(text);
      if (match) {
        const pct = parseInt(match[1], 10);
        if (pct >= 0 && pct <= 100) {
          sendProgress(wc, "installing", pct);
        }
      }
      sendLog(wc, "info", text);
    });

    child.stderr?.on("data", (d: Buffer) => {
      const text = d.toString();
      sendLog(wc, text.toLowerCase().includes("error") ? "error" : "info", text);
    });

    child.once("close", (code) => {
      cleanupChild();
      if (code === 0) {
        sendLog(wc, "ok", `${installCmd.cmd} exited successfully`);
        resolve();
      } else {
        reject(new Error(`${installCmd.cmd} exited with code ${code}`));
      }
    });
    child.once("error", (error) => {
      cleanupChild();
      reject(error);
    });
  });
}

// ---------------------------------------------------------------------------
// IPC registration
// ---------------------------------------------------------------------------

export function setupLibreOfficeInstallHandlers() {
  ipcMain.handle("lo:start-install", async (event) => {
    const wc = event.sender;
    const onDestroyed = () => {
      void stopActiveLibreOfficeInstallProcesses();
    };
    wc.once("destroyed", onDestroyed);
    try {
      const platform = process.platform;
      sendLog(wc, "info", `Platform: ${platform} (${process.arch})`);
      if (platform === "win32") {
        await installWindows(wc);
      } else if (platform === "darwin") {
        await installMac(wc);
      } else {
        await installLinux(wc);
      }
      sendProgress(wc, "done");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. You can install LibreOffice manually later.";
      sendLog(wc, "error", message);
      sendProgress(wc, "error", undefined, message);
    } finally {
      wc.removeListener("destroyed", onDestroyed);
    }
  });
}
