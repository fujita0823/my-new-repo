"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cleanerAPI", {
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  scanFolder: (rootPath) => ipcRenderer.invoke("scan-folder", rootPath),
  trashItems: (paths) => ipcRenderer.invoke("trash-items", paths),
  showInFolder: (targetPath) => ipcRenderer.invoke("show-in-folder", targetPath),
  onProgress: (callback) => {
    ipcRenderer.on("scan-progress", (_event, item) => callback(item));
  },
});
