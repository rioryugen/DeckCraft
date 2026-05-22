// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { app, session } from "electron";
import fs from "fs";
import path from "path";
import { addMainBreadcrumb, captureMainException } from "../sentry/main";
import { safeError, safeLog, safeWarn } from "./safe-console";

export type ChromiumCacheRecoveryStatus = {
  mode: "auto" | "force" | "off";
  status: "pending-session-clear" | "completed" | "failed" | "skipped";
  recoveryKey: string;
  appVersion: string;
  electronVersion: string;
  quarantined: string[];
  removedStaleDirectories: number;
  errors: string[];
  reason?: string;
};

const RECOVERY_KEY = "shared-dictionary-cache-v1";
const SENTINEL_FILE = "chromium-cache-recovery.json";

function getRecoveryMode(): ChromiumCacheRecoveryStatus["mode"] {
  const raw = process.env.DeckCraft_CHROMIUM_CACHE_RECOVERY?.trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(raw ?? "")) {
    return "off";
  }
  if (raw === "force") {
    return "force";
  }
  return "auto";
}

function getSentinelPath(userDataDir: string): string {
  return path.join(userDataDir, SENTINEL_FILE);
}

function readSentinel(userDataDir: string): Record<string, unknown> | undefined {
  try {
    const raw = fs.readFileSync(getSentinelPath(userDataDir), "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function writeSentinel(userDataDir: string, status: ChromiumCacheRecoveryStatus): void {
  const payload = {
    recoveryKey: status.recoveryKey,
    appVersion: status.appVersion,
    electronVersion: status.electronVersion,
    completedAt: new Date().toISOString(),
    quarantined: status.quarantined,
    removedStaleDirectories: status.removedStaleDirectories,
  };
  fs.writeFileSync(getSentinelPath(userDataDir), `${JSON.stringify(payload, null, 2)}\n`);
}

function shouldRunRecovery(
  mode: ChromiumCacheRecoveryStatus["mode"],
  userDataDir: string,
  appVersion: string,
  electronVersion: string,
): boolean {
  if (mode === "force") {
    return true;
  }
  if (mode === "off") {
    return false;
  }

  const sentinel = readSentinel(userDataDir);
  return !(
    sentinel?.recoveryKey === RECOVERY_KEY &&
    sentinel?.appVersion === appVersion &&
    sentinel?.electronVersion === electronVersion
  );
}

function uniqueQuarantinePath(quarantineRoot: string, label: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  let candidate = path.join(quarantineRoot, `${label}-${timestamp}`);
  let suffix = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(quarantineRoot, `${label}-${timestamp}-${suffix}`);
    suffix += 1;
  }
  return candidate;
}

function quarantineIfPresent(
  source: string,
  quarantineRoot: string,
  label: string,
  status: ChromiumCacheRecoveryStatus,
): void {
  if (!fs.existsSync(source)) {
    return;
  }

  try {
    fs.mkdirSync(quarantineRoot, { recursive: true });
    fs.renameSync(source, uniqueQuarantinePath(quarantineRoot, label));
    status.quarantined.push(label);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    status.errors.push(`${label}: ${message}`);
  }
}

function removeOldDirectories(dir: string, status: ChromiumCacheRecoveryStatus): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("old_")) {
        fs.rmSync(path.join(dir, entry.name), { recursive: true, force: true });
        status.removedStaleDirectories += 1;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    status.errors.push(`old-cache-cleanup: ${message}`);
  }
}

export function prepareChromiumCacheRecovery(
  cacheDir: string,
  userDataDir: string,
): ChromiumCacheRecoveryStatus {
  const mode = getRecoveryMode();
  const appVersion = app.getVersion();
  const electronVersion = process.versions.electron ?? "unknown";
  const status: ChromiumCacheRecoveryStatus = {
    mode,
    status: "pending-session-clear",
    recoveryKey: RECOVERY_KEY,
    appVersion,
    electronVersion,
    quarantined: [],
    removedStaleDirectories: 0,
    errors: [],
  };

  if (mode === "off") {
    status.status = "skipped";
    status.reason = "disabled-by-env";
    return status;
  }

  if (!shouldRunRecovery(mode, userDataDir, appVersion, electronVersion)) {
    status.status = "skipped";
    status.reason = "already-completed";
    return status;
  }

  removeOldDirectories(cacheDir, status);
  removeOldDirectories(path.join(userDataDir, "GPUCache"), status);

  const quarantineRoot = path.join(userDataDir, "Recovered Chromium Cache");
  quarantineIfPresent(
    path.join(userDataDir, "Shared Dictionary"),
    quarantineRoot,
    "Shared Dictionary",
    status,
  );

  if (status.errors.length > 0) {
    status.status = "failed";
    safeWarn("[DeckCraft] Chromium cache recovery finished with errors:", status);
    return status;
  }

  safeLog("[DeckCraft] Chromium cache recovery prepared:", {
    mode: status.mode,
    quarantined: status.quarantined,
    removedStaleDirectories: status.removedStaleDirectories,
  });
  return status;
}

export async function finishChromiumCacheRecovery(
  userDataDir: string,
  status: ChromiumCacheRecoveryStatus,
): Promise<ChromiumCacheRecoveryStatus> {
  if (status.status === "skipped") {
    addMainBreadcrumb("cache-recovery", "electron.chromium_cache_recovery.skipped", {
      reason: status.reason,
      mode: status.mode,
    });
    return status;
  }

  try {
    const defaultSession = session.defaultSession;
    const skippedSessionClears: string[] = [];

    if (typeof defaultSession.clearSharedDictionaryCache === "function") {
      await defaultSession.clearSharedDictionaryCache();
    } else {
      skippedSessionClears.push("shared-dictionary-cache");
    }

    if (typeof defaultSession.clearCodeCaches === "function") {
      await defaultSession.clearCodeCaches({ urls: [] });
    } else {
      skippedSessionClears.push("code-cache");
    }

    await defaultSession.clearCache();
    writeSentinel(userDataDir, status);
    status.status = "completed";
    addMainBreadcrumb("cache-recovery", "electron.chromium_cache_recovery.completed", {
      mode: status.mode,
      quarantined: status.quarantined,
      removedStaleDirectories: status.removedStaleDirectories,
      skippedSessionClears,
    });
  } catch (error) {
    status.status = "failed";
    const message = error instanceof Error ? error.message : String(error);
    status.errors.push(`session-clear: ${message}`);
    safeError("[DeckCraft] Chromium cache recovery failed:", error);
    captureMainException(error, {
      area: "chromium-cache-recovery",
      mode: status.mode,
      quarantined: status.quarantined,
      removedStaleDirectories: status.removedStaleDirectories,
    });
  }

  return status;
}
