// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { app } from "electron";
import * as Sentry from "@sentry/electron/main";

let isSentryInitialized = false;

type MainSentryRuntimeContext = {
  profileHash?: string;
  cacheRecoveryStatus?: string;
  cacheRecoveryMode?: string;
};

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

function parseSampleRate(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }

  return Math.max(0, Math.min(1, parsed));
}

function getEnvironment(): string {
  if (process.env.SENTRY_ENVIRONMENT) {
    return process.env.SENTRY_ENVIRONMENT;
  }

  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  return app.isPackaged ? "production" : "development";
}

function getRelease(): string {
  if (process.env.SENTRY_RELEASE) {
    return process.env.SENTRY_RELEASE;
  }

  return `DeckCraft-electron@${app.getVersion()}`;
}

export function initMainSentry(): void {
  if (isSentryInitialized) {
    return;
  }

  const dsn = "";
  const isEnabled = parseBoolean(process.env.SENTRY_ENABLED, true);

  if (!isEnabled) {
    return;
  }

  const tracesSampleRate = parseSampleRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE,
    app.isPackaged ? 0.2 : 1.0,
  );

  try {
    Sentry.init({
      dsn,
      enabled: true,
      release: getRelease(),
      environment: getEnvironment(),
      debug: parseBoolean(process.env.SENTRY_DEBUG, false),
      sendDefaultPii: parseBoolean(process.env.SENTRY_SEND_DEFAULT_PII, false),
      enableLogs: parseBoolean(process.env.SENTRY_ENABLE_LOGS, true),
      tracesSampleRate,
      integrations: [Sentry.startupTracingIntegration()],
    });

    isSentryInitialized = true;
    Sentry.setTag("process.type", "main");
    Sentry.setTag("electron.version", process.versions.electron ?? "unknown");
    Sentry.setTag("chromium.version", process.versions.chrome ?? "unknown");
    Sentry.setTag("node.version", process.versions.node ?? "unknown");
    Sentry.setTag("os.platform", process.platform);
    Sentry.setTag("os.arch", process.arch);
    Sentry.setContext("runtime", {
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron ?? "unknown",
      chromiumVersion: process.versions.chrome ?? "unknown",
      nodeVersion: process.versions.node ?? "unknown",
      platform: process.platform,
      arch: process.arch,
      packaged: app.isPackaged,
    });
    console.log("[Sentry] Initialized in Electron main process.");
  } catch (error) {
    console.error("[Sentry] Failed to initialize in Electron main process:", error);
  }
}

export function setMainSentryRuntimeContext(context: MainSentryRuntimeContext): void {
  if (!isSentryInitialized) {
    return;
  }

  try {
    if (context.profileHash) {
      Sentry.setTag("profile.hash", context.profileHash);
    }
    if (context.cacheRecoveryStatus) {
      Sentry.setTag("cache_recovery.status", context.cacheRecoveryStatus);
    }
    if (context.cacheRecoveryMode) {
      Sentry.setTag("cache_recovery.mode", context.cacheRecoveryMode);
    }
    Sentry.setContext("DeckCraft", {
      profileHash: context.profileHash,
      cacheRecoveryStatus: context.cacheRecoveryStatus,
      cacheRecoveryMode: context.cacheRecoveryMode,
    });
  } catch {
    /* ignore context failures */
  }
}

export function captureMainException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!isSentryInitialized) {
    return;
  }

  try {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext("DeckCraft", context);
      }
      Sentry.captureException(error);
    });
  } catch {
    /* ignore capture failures */
  }
}

export function addMainBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!isSentryInitialized) {
    return;
  }

  try {
    Sentry.addBreadcrumb({
      category,
      message,
      level: "info",
      data,
    });
  } catch {
    /* ignore breadcrumb failures */
  }
}
