"use strict";

const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const { scan } = require("./scanner");

function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("pick-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "Steamライブラリのルートフォルダを選択(steamappsフォルダを含む場所)",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle("scan-folder", async (event, rootPath) => {
  return scan(rootPath, {
    onEntry: (item) => {
      event.sender.send("scan-progress", item);
    },
  });
});

ipcMain.handle("trash-items", async (_event, paths) => {
  const errors = [];
  for (const p of paths) {
    try {
      await shell.trashItem(p);
    } catch (err) {
      errors.push({ path: p, message: String(err) });
    }
  }
  return { errors };
});

ipcMain.handle("show-in-folder", async (_event, targetPath) => {
  shell.showItemInFolder(targetPath);
});
