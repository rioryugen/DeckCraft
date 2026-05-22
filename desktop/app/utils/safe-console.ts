// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { format } from "util";

type WritableStream = NodeJS.WriteStream & {
  closed?: boolean;
  destroyed?: boolean;
  writable?: boolean;
  writableEnded?: boolean;
  writableFinished?: boolean;
};

let installed = false;
const originalConsoleError = console.error.bind(console);

export function isIgnorablePipeError(error: unknown): boolean {
  const err = error as NodeJS.ErrnoException | undefined;
  const code = typeof err?.code === "string" ? err.code : "";
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    code === "EPIPE" ||
    code === "ERR_STREAM_DESTROYED" ||
    code === "ERR_STREAM_WRITE_AFTER_END" ||
    /broken pipe/i.test(message) ||
    /write after end/i.test(message) ||
    /stream has been destroyed/i.test(message)
  );
}

function isWritable(stream: WritableStream): boolean {
  return (
    stream.writable !== false &&
    !stream.closed &&
    !stream.destroyed &&
    !stream.writableEnded &&
    !stream.writableFinished
  );
}

function reportUnexpectedStreamError(error: unknown): void {
  if (isIgnorablePipeError(error)) {
    return;
  }

  try {
    originalConsoleError("[SafeConsole] stdout/stderr stream error:", error);
  } catch {
    /* If the console itself is unavailable, there is nowhere useful to report this. */
  }
}

function writeToStream(stream: WritableStream, text: string): boolean {
  if (!isWritable(stream)) {
    return false;
  }

  try {
    return stream.write(text, (error?: Error | null) => {
      if (error) {
        reportUnexpectedStreamError(error);
      }
    });
  } catch (error) {
    reportUnexpectedStreamError(error);
    return false;
  }
}

export function safeStdoutWrite(text: string): boolean {
  return writeToStream(process.stdout, text);
}

export function safeStderrWrite(text: string): boolean {
  return writeToStream(process.stderr, text);
}

export function safeLog(...args: unknown[]): void {
  safeStdoutWrite(`${format(...args)}\n`);
}

export function safeWarn(...args: unknown[]): void {
  safeStderrWrite(`${format(...args)}\n`);
}

export function safeError(...args: unknown[]): void {
  safeStderrWrite(`${format(...args)}\n`);
}

export function installSafeConsole(): void {
  if (installed) {
    return;
  }
  installed = true;

  process.stdout.on("error", reportUnexpectedStreamError);
  process.stderr.on("error", reportUnexpectedStreamError);

  console.log = safeLog;
  console.warn = safeWarn;
  console.error = safeError;
}
