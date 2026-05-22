// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

/**
 * IPC handlers for the unified setup installer (LibreOffice + ImageMagick).
 * - setup:get-status — which dependencies are missing
 */

import { ipcMain, WebContents } from "electron";
import fs from "fs";
import path from "path";
import os from "os";
import { ChildProcess, spawn, spawnSync } from "child_process";
import * as https from "https";
import * as http from "http";
import { IncomingMessage } from "http";
import { getSetupStatus } from "../utils/setup-dependencies";
import {
  getImageMagickBinaryPath,
  getImageMagickDownloadUrl,
  getImageMagickManualInstallCommands,
  getWindowsImageMagickInstallDir,
  isImageMagickInstalled,
} from "../utils/imagemagick-check";
import { destroyChildProcessStdio, safeSendToWebContents, terminateChildProcess } from "../utils/lifecycle";
import { killProcess } from "../utils";

const activeSetupInstallProcesses = new Set<ChildProcess>();
const activeSetupDownloadAborters = new Set<() => void>();

export async function stopActiveSetupInstallProcesses(): Promise<void> {
  const aborters = Array.from(activeSetupDownloadAborters);
  activeSetupDownloadAborters.clear();
  for (const abort of aborters) {
    try {
      abort();
    } catch {
      /* Best-effort cancellation. */
    }
  }

  const processes = Array.from(activeSetupInstallProcesses);
  activeSetupInstallProcesses.clear();
  await Promise.all(
    processes.map((process) =>
      terminateChildProcess(process, "Setup install", killProcess).catch(() => {}),
    ),
  );
}

function sendImageMagickProgress(
  wc: WebContents,
  phase: "downloading" | "installing" | "done" | "error",
  percent?: number,
  message?: string
) {
  safeSendToWebContents(wc, "setup:imagemagick-progress", { phase, percent, message });
}

function sendImageMagickLog(wc: WebContents, level: string, text: string) {
  safeSendToWebContents(wc, "setup:imagemagick-log", { level, text });
}

function commandExists(command: string, versionArgs: string[] = ["--version"]): boolean {
  const result = spawnSync(command, versionArgs, {
    stdio: "pipe",
    windowsHide: true,
  });
  return result.status === 0;
}

function resolveBrewCommand(): string | null {
  if (commandExists("brew")) {
    return "brew";
  }

  const candidates = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveLinuxEscalationCommand(): string | null {
  if (commandExists("pkexec", ["--version"])) return "pkexec";
  if (commandExists("sudo", ["-V"])) return "sudo";
  return null;
}

function logManualImageMagickCommands(wc: WebContents) {
  for (const line of getImageMagickManualInstallCommands()) {
    const level = line.endsWith(":") ? "info" : "cmd";
    sendImageMagickLog(wc, level, line);
  }
}

const MAX_DOWNLOAD_REDIRECTS = 5;
const MIN_IMAGEMAGICK_INSTALLER_SIZE_BYTES = 5 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  if (kb >= 1) return `${kb.toFixed(0)} KB`;
  return `${bytes} B`;
}

function escapePowerShellSingleQuoted(value: string): string {
  return value.replace(/'/g, "''");
}

function getFilenameFromUrl(url: string, fallback: string): string {
  try {
    const parsed = new URL(url);
    const name = path.basename(parsed.pathname);
    return name || fallback;
  } catch {
    return fallback;
  }
}

function downloadFileWithProgress(
  wc: WebContents,
  url: string,
  destinationPath: string
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
      activeSetupDownloadAborters.delete(abortDownload);
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
        fs.unlink(destinationPath, () => {});
        reject(error);
      });
    };

    const abortDownload = () => {
      fail(new Error("ImageMagick download was cancelled."));
    };
    activeSetupDownloadAborters.add(abortDownload);

    const requestDownload = (requestUrl: string, redirects: number) => {
      if (settled) {
        return;
      }
      const requester = requestUrl.startsWith("https") ? https.get : http.get;
      sendImageMagickLog(wc, "cmd", `GET ${requestUrl}`);

      currentRequest = requester(requestUrl, (res: IncomingMessage) => {
        currentResponse = res;
        const statusCode = res.statusCode ?? 0;
        if (
          [301, 302, 303, 307, 308].includes(statusCode) &&
          res.headers.location
        ) {
          res.resume();
          if (redirects >= MAX_DOWNLOAD_REDIRECTS) {
            fail(new Error("Too many redirects while downloading installer."));
            return;
          }
          const redirectUrl = new URL(res.headers.location, requestUrl).toString();
          sendImageMagickLog(wc, "info", `Redirecting to ${redirectUrl}`);
          requestDownload(redirectUrl, redirects + 1);
          return;
        }

        if (statusCode !== 200) {
          res.resume();
          fail(new Error(`Download failed with HTTP ${statusCode}.`));
          return;
        }

        const totalBytes = Number.parseInt(
          String(res.headers["content-length"] ?? "0"),
          10
        );
        let downloadedBytes = 0;

        const file = fs.createWriteStream(destinationPath);
        currentFile = file;

        res.on("data", (chunk: Buffer) => {
          if (settled) {
            return;
          }
          downloadedBytes += chunk.length;
          const percent =
            totalBytes > 0
              ? Math.min(99, Math.floor((downloadedBytes / totalBytes) * 100))
              : undefined;
          const sizeLabel =
            totalBytes > 0
              ? `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`
              : `${formatBytes(downloadedBytes)} downloaded`;
          sendImageMagickProgress(wc, "downloading", percent, sizeLabel);
        });

        res.pipe(file);

        file.on("finish", () => {
          file.close(() => {
            if (settled) {
              return;
            }
            if (downloadedBytes < MIN_IMAGEMAGICK_INSTALLER_SIZE_BYTES) {
              fail(
                new Error(
                  `Downloaded file is too small (${formatBytes(downloadedBytes)}).`
                )
              );
              return;
            }

            sendImageMagickLog(
              wc,
              "ok",
              `Download complete (${formatBytes(downloadedBytes)}).`
            );
            finish(resolve);
          });
        });

        file.on("error", (err) => {
          fail(err);
        });
      }).on("error", (err) => {
        fail(err);
      });
    };

    requestDownload(url, 0);
  });
}

async function runWindowsExecutableInstaller(
  wc: WebContents,
  installerPath: string,
  installerArgs: string[]
): Promise<void> {
  const escapedInstallerPath = escapePowerShellSingleQuoted(installerPath);
  const argList = installerArgs
    .map((arg) => `'${escapePowerShellSingleQuoted(arg)}'`)
    .join(", ");

  const runViaPowerShell = async (runAsAdmin: boolean) => {
    const verb = runAsAdmin ? " -Verb RunAs" : "";
    const script = `$p = Start-Process -FilePath '${escapedInstallerPath}' -ArgumentList ${argList}${verb} -Wait -PassThru; if ($p) { exit $p.ExitCode } else { exit 1 }`;
    await runInstallCommand(wc, "powershell", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      script,
    ]);
  };

  try {
    sendImageMagickLog(wc, "info", "Running installer in user mode...");
    await runViaPowerShell(false);
  } catch {
    sendImageMagickLog(
      wc,
      "warn",
      "User-mode install failed. Retrying with administrator rights..."
    );
    await runViaPowerShell(true);
  }
}

function runInstallCommand(
  wc: WebContents,
  command: string,
  args: string[]
): Promise<void> {
  sendImageMagickLog(wc, "info", `Running: ${command} ${args.join(" ")}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: process.platform === "win32",
    });
    activeSetupInstallProcesses.add(child);

    const onStdoutData = (data: Buffer) => {
      const text = String(data).trim();
      if (text) sendImageMagickLog(wc, "info", text);
    };
    const onStderrData = (data: Buffer) => {
      const text = String(data).trim();
      if (text) {
        sendImageMagickLog(
          wc,
          text.toLowerCase().includes("error") ? "error" : "info",
          text
        );
      }
    };

    let settled = false;
    const cleanup = () => {
      child.stdout?.removeListener("data", onStdoutData);
      child.stderr?.removeListener("data", onStderrData);
      child.removeListener("error", onError);
      child.removeListener("close", onClose);
      activeSetupInstallProcesses.delete(child);
    };
    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      destroyChildProcessStdio(child);
      callback();
    };
    const onError = (error: Error) => finish(() => reject(error));
    const onClose = (code: number | null, signal: NodeJS.Signals | null) => {
      if (code === 0) {
        finish(resolve);
        return;
      }
      finish(() =>
        reject(
          new Error(
            `${command} exited with code ${code ?? "unknown"}${signal ? ` signal ${signal}` : ""}`,
          ),
        ),
      );
    };

    child.stdout?.on("data", onStdoutData);
    child.stderr?.on("data", onStderrData);
    child.once("error", onError);
    child.once("close", onClose);
  });
}

export function setupSetupInstallHandlers() {
  ipcMain.handle("setup:get-status", () => {
    return (
      getSetupStatus() ?? {
        needsLibreOffice: false,
        needsImageMagick: false,
      }
    );
  });

  ipcMain.handle(
    "setup:install-imagemagick",
    async (event): Promise<{ ok: boolean; error?: string }> => {
      const wc = event.sender;
      const onDestroyed = () => {
        void stopActiveSetupInstallProcesses();
      };
      wc.once("destroyed", onDestroyed);
      try {
        sendImageMagickProgress(
          wc,
          "installing",
          undefined,
          "Installing ImageMagick..."
        );

        if (process.platform === "linux") {
          if (commandExists("apt-get")) {
            const escalator = resolveLinuxEscalationCommand();
            if (!escalator) {
              throw new Error(
                "Neither pkexec nor sudo is available to run apt-get install."
              );
            }

            await runInstallCommand(wc, escalator, [
              "apt-get",
              "update",
            ]);
            await runInstallCommand(wc, escalator, [
              "apt-get",
              "install",
              "-y",
              "imagemagick",
            ]);
          } else {
            throw new Error(
              "apt-get is unavailable. Install ImageMagick manually using your package manager."
            );
          }
        } else if (process.platform === "darwin") {
          let brewCommand = resolveBrewCommand();
          if (!brewCommand) {
            sendImageMagickLog(
              wc,
              "info",
              "Homebrew not found. Installing Homebrew first..."
            );
            const installHomebrewCommand =
              'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
            await runInstallCommand(wc, "/bin/bash", ["-c", installHomebrewCommand]);
            brewCommand = resolveBrewCommand();
          }

          if (!brewCommand) {
            throw new Error(
              "Homebrew installation completed, but brew was not found on PATH."
            );
          }

          await runInstallCommand(wc, brewCommand, ["install", "imagemagick"]);
        } else if (process.platform === "win32") {
          const installerUrl = getImageMagickDownloadUrl();
          const installerFilename = getFilenameFromUrl(
            installerUrl,
            "ImageMagick-installer.exe"
          );
          const installerPath = path.join(os.tmpdir(), installerFilename);
          const installDir = getWindowsImageMagickInstallDir();

          fs.mkdirSync(installDir, { recursive: true });

          sendImageMagickLog(
            wc,
            "info",
            `Downloading ImageMagick installer (${installerFilename})...`
          );
          sendImageMagickLog(wc, "cmd", `Install directory: ${installDir}`);
          sendImageMagickProgress(wc, "downloading", 0, "Connecting...");

          await downloadFileWithProgress(wc, installerUrl, installerPath);

          sendImageMagickProgress(
            wc,
            "installing",
            undefined,
            "Running installer..."
          );

          await runWindowsExecutableInstaller(wc, installerPath, [
            "/SP-",
            "/VERYSILENT",
            "/SUPPRESSMSGBOXES",
            "/NORESTART",
            `/DIR=${installDir}`,
          ]);

          fs.unlink(installerPath, () => {});
          sendImageMagickLog(wc, "ok", "ImageMagick installer completed.");
        } else {
          throw new Error(
            "Unsupported platform for automatic install. Use manual install from the official download page."
          );
        }

        if (!isImageMagickInstalled()) {
          throw new Error(
            "ImageMagick installation command finished, but the binary was not detected."
          );
        }

        sendImageMagickLog(
          wc,
          "ok",
          `ImageMagick detected at ${getImageMagickBinaryPath()}`
        );

        sendImageMagickProgress(wc, "done", 100, "ImageMagick install finished");
        return { ok: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "ImageMagick install failed";
        sendImageMagickLog(wc, "error", message);
        logManualImageMagickCommands(wc);
        const downloadUrl = getImageMagickDownloadUrl();
        sendImageMagickLog(
          wc,
          "info",
          `Manual install URL: ${downloadUrl}`
        );
        sendImageMagickProgress(
          wc,
          "error",
          undefined,
          "Finish manual installation, then click Retry."
        );
        return { ok: false, error: message };
      } finally {
        wc.removeListener("destroyed", onDestroyed);
      }
    }
  );

  ipcMain.handle(
    "setup:check-imagemagick",
    async (event): Promise<{ ok: boolean; error?: string }> => {
      const wc = event.sender;
      const installed = isImageMagickInstalled();
      if (installed) {
        sendImageMagickProgress(wc, "done", 100, "ImageMagick detected");
        sendImageMagickLog(
          wc,
          "ok",
          `ImageMagick is installed and ready (${getImageMagickBinaryPath()}).`
        );
        return { ok: true };
      }
      const message =
        "ImageMagick is not detected yet. Install it, then click Retry.";
      sendImageMagickProgress(wc, "error", undefined, message);
      sendImageMagickLog(wc, "error", message);
      return { ok: false, error: message };
    }
  );
}
