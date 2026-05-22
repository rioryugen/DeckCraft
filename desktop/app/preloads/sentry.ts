// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import * as Sentry from '@sentry/electron/renderer';

let isSentryInitialized = false;

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return !['0', 'false', 'no', 'off'].includes(value.trim().toLowerCase());
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

export function initRendererSentry(): void {
  if (isSentryInitialized) {
    return;
  }

  const dsn = '';
  const isEnabled = parseBoolean(process.env.SENTRY_ENABLED, true);

  if (!isEnabled) {
    return;
  }

  const enableTracing = parseBoolean(process.env.SENTRY_ENABLE_TRACING, true);
  const enableReplay = parseBoolean(process.env.SENTRY_ENABLE_REPLAY, false);
  const enableFeedback = parseBoolean(process.env.SENTRY_ENABLE_FEEDBACK, false);

  const integrations: any[] = [];
  if (enableTracing) {
    integrations.push(Sentry.browserTracingIntegration());
  }
  if (enableReplay) {
    integrations.push(Sentry.replayIntegration());
  }
  if (enableFeedback) {
    integrations.push(
      Sentry.feedbackIntegration({
        colorScheme: 'system',
      }),
    );
  }

  Sentry.init({
    dsn,
    enableLogs: parseBoolean(process.env.SENTRY_ENABLE_LOGS, true),
    sendDefaultPii: parseBoolean(process.env.SENTRY_SEND_DEFAULT_PII, false),
    tracesSampleRate: enableTracing
      ? parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 1.0)
      : undefined,
    replaysSessionSampleRate: enableReplay
      ? parseSampleRate(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE, 0.1)
      : undefined,
    replaysOnErrorSampleRate: enableReplay
      ? parseSampleRate(process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, 1.0)
      : undefined,
    integrations,
  });

  isSentryInitialized = true;
  Sentry.setTag('process.type', 'renderer');
}

initRendererSentry();
