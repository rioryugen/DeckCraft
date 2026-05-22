// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import type { ChildProcess } from "child_process";
import type { BrowserWindow, WebContents } from "electron";

type DestroyableStream = {
  destroyed?: boolean;
  destroy?: (error?: Error) => void;
  end?: () => void;
};

export function hasLiveWebContents(win: BrowserWindow | null | undefined): win is BrowserWindow {
  return Boolean(win && !win.isDestroyed() && !win.webContents.isDestroyed());
}

export function safeSendToWebContents(
  wc: WebContents | null | undefined,
  channel: string,
  payload: unknown,
): boolean {
  try {
    if (!wc || wc.isDestroyed()) {
      return false;
    }
    wc.send(channel, payload);
    return true;
  } catch {
    return false;
  }
}

export function safeCloseWindow(win: BrowserWindow | null | undefined, destroy = false): void {
  try {
    if (!win || win.isDestroyed()) {
      return;
    }
    if (destroy) {
      win.destroy();
    } else {
      win.close();
    }
  } catch {
    /* Window/native handle may already be tearing down. */
  }
}

export function isChildProcessAlive(child: ChildProcess | null | undefined): child is ChildProcess {
  return Boolean(
    child &&
      child.pid &&
      child.exitCode === null &&
      child.signalCode === null &&
      !child.killed,
  );
}

export function waitForChildClose(
  child: ChildProcess,
  timeoutMs = 5_000,
): Promise<boolean> {
  if (!isChildProcessAlive(child)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (closed: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      child.removeListener("close", onClose);
      child.removeListener("error", onError);
      resolve(closed);
    };

    const onClose = () => finish(true);
    const onError = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);

    child.once("close", onClose);
    child.once("error", onError);
  });
}

export function destroyChildProcessStdio(child: ChildProcess): void {
  const streams: Array<DestroyableStream | null | undefined> = [
    child.stdin,
    child.stdout,
    child.stderr,
  ];

  for (const stream of streams) {
    try {
      if (!stream || stream.destroyed) {
        continue;
      }
      if (typeof stream.end === "function") {
        stream.end();
      }
      if (typeof stream.destroy === "function") {
        stream.destroy();
      }
    } catch {
      /* Ignore stream teardown races during app shutdown. */
    }
  }
}

export async function terminateChildProcess(
  child: ChildProcess,
  name: string,
  killProcessTree: (pid: number, signal: NodeJS.Signals) => Promise<unknown>,
  options: {
    gracefulSignal?: NodeJS.Signals;
    forceSignal?: NodeJS.Signals;
    gracefulTimeoutMs?: number;
  } = {},
): Promise<void> {
  const gracefulSignal = options.gracefulSignal ?? "SIGTERM";
  const forceSignal = options.forceSignal ?? "SIGKILL";
  const gracefulTimeoutMs = options.gracefulTimeoutMs ?? 5_000;

  if (!isChildProcessAlive(child) || !child.pid) {
    destroyChildProcessStdio(child);
    return;
  }

  try {
    await killProcessTree(child.pid, gracefulSignal);
  } catch {
    /* Process may have already exited between the alive check and kill request. */
  }

  const closed = await waitForChildClose(child, gracefulTimeoutMs);
  if (!closed && isChildProcessAlive(child) && child.pid) {
    try {
      await killProcessTree(child.pid, forceSignal);
    } catch {
      /* Best-effort forced shutdown. */
    }
    await waitForChildClose(child, 2_000);
  }

  destroyChildProcessStdio(child);
}

