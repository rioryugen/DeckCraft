// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";
import "./sentry";

contextBridge.exposeInMainWorld("setupInstaller", {
  getStatus: () => ipcRenderer.invoke("setup:get-status"),

  installLibreOffice: () => ipcRenderer.invoke("lo:start-install"),
  installImageMagick: () => ipcRenderer.invoke("setup:install-imagemagick"),
  checkImageMagick: () => ipcRenderer.invoke("setup:check-imagemagick"),

  done: () => ipcRenderer.send("setup:done"),

  onLibreOfficeProgress: (
    cb: (data: { phase: string; percent?: number; message?: string }) => void
  ) => {
    const listener = (_event: IpcRendererEvent, data: { phase: string; percent?: number; message?: string }) =>
      cb(data);
    ipcRenderer.on("lo:progress", listener);
    return () => ipcRenderer.removeListener("lo:progress", listener);
  },
  onLibreOfficeLog: (cb: (data: { level: string; text: string }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { level: string; text: string }) => cb(data);
    ipcRenderer.on("lo:log", listener);
    return () => ipcRenderer.removeListener("lo:log", listener);
  },

  onImageMagickProgress: (
    cb: (data: { phase: string; percent?: number; message?: string }) => void
  ) => {
    const listener = (_event: IpcRendererEvent, data: { phase: string; percent?: number; message?: string }) =>
      cb(data);
    ipcRenderer.on("setup:imagemagick-progress", listener);
    return () => ipcRenderer.removeListener("setup:imagemagick-progress", listener);
  },
  onImageMagickLog: (cb: (data: { level: string; text: string }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { level: string; text: string }) => cb(data);
    ipcRenderer.on("setup:imagemagick-log", listener);
    return () => ipcRenderer.removeListener("setup:imagemagick-log", listener);
  },
});
