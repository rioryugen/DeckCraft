// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { dialog, shell, type BrowserWindow } from "electron";
import fs from "fs";
import path from "path";
import { safeWarn } from "./safe-console";

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

export function isSupportedExternalUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_EXTERNAL_PROTOCOLS.has(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export async function openExternalUrl(url: string): Promise<IPCStatus> {
  if (!isSupportedExternalUrl(url)) {
    return {
      success: false,
      message: "Only http and https links can be opened.",
    };
  }

  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "The operating system could not open this link."),
    };
  }
}

export async function openLocalPath(targetPath: string): Promise<IPCStatus> {
  const normalizedPath = path.normalize(targetPath);

  if (!normalizedPath || !path.isAbsolute(normalizedPath)) {
    return {
      success: false,
      message: "The file path is invalid.",
    };
  }

  try {
    await fs.promises.access(normalizedPath, fs.constants.F_OK);
  } catch {
    return {
      success: false,
      message: "The file or folder no longer exists.",
    };
  }

  try {
    const openError = await shell.openPath(normalizedPath);
    if (openError) {
      return {
        success: false,
        message: openError,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "The operating system could not open this file or folder."),
    };
  }
}

export async function showOpenTargetErrorDialog({
  parent,
  title,
  message,
  detail,
}: {
  parent?: BrowserWindow;
  title: string;
  message: string;
  detail?: string;
}): Promise<void> {
  try {
    const options = {
      type: "error" as const,
      buttons: ["OK"],
      defaultId: 0,
      noLink: true,
      title,
      message,
      detail,
    };

    if (parent && !parent.isDestroyed()) {
      await dialog.showMessageBox(parent, options);
      return;
    }

    await dialog.showMessageBox(options);
  } catch (error) {
    safeWarn("[DeckCraft] Failed to show open target error dialog:", error);
  }
}
