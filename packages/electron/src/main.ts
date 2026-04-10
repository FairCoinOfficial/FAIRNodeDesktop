import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElectronHandlers } from "./server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await win.loadFile(path.join(__dirname, "../../ui/dist/index.html"));

  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(async () => {
  const handlers = await createElectronHandlers(app);
  handlers.register(ipcMain);
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
