// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";
import "./sentry";

contextBridge.exposeInMainWorld("loInstaller", {
  startInstall: () => ipcRenderer.invoke("lo:start-install"),
  skip: () => ipcRenderer.send("lo:skip"),
  onProgress: (cb: (data: { phase: string; percent?: number; message?: string }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { phase: string; percent?: number; message?: string }) =>
      cb(data);
    ipcRenderer.on("lo:progress", listener);
    return () => ipcRenderer.removeListener("lo:progress", listener);
  },
  onLog: (cb: (data: { level: string; text: string }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { level: string; text: string }) => cb(data);
    ipcRenderer.on("lo:log", listener);
    return () => ipcRenderer.removeListener("lo:log", listener);
  },
});
