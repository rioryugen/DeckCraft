// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { dialog } from "electron";
import path from "path";
import { openLocalPath, showOpenTargetErrorDialog } from "./open-target";
import { safeError } from "./safe-console";

export async function showFileDownloadedDialog(filePath: string): Promise<boolean> {
  try {
    const { response } = await dialog.showMessageBox({
      type: "question",
      buttons: ["Open File", "Open Folder", "Cancel"],
      defaultId: 0,
      title: "File Downloaded",
      message: "What would you like to do?",
    });

    let targetPath: string | undefined;
    let targetLabel: "file" | "folder" | undefined;

    if (response === 0) {
      targetPath = filePath;
      targetLabel = "file";
    } else if (response === 1) {
      targetPath = path.dirname(filePath);
      targetLabel = "folder";
    }

    if (targetPath && targetLabel) {
      const result = await openLocalPath(targetPath);
      if (!result.success) {
        await showOpenTargetErrorDialog({
          title: `Could Not Open ${targetLabel === "file" ? "File" : "Folder"}`,
          message: `The exported file was saved, but DeckCraft could not open the ${targetLabel}.`,
          detail: `${result.message || "No application is registered to open this item."}\n\nSaved location:\n${filePath}`,
        });
      }
    }

    return true;
  } catch (error) {
    safeError("Error handling downloaded file:", error);
    return false;
  }
}
