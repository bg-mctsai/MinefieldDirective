const { app, BrowserWindow } = require("electron");
const path = require("path");

const DEV_URL = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: "#0b1220",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const loadBuilt = () => {
    win.loadFile(path.join(__dirname, "dist-renderer", "index.html"));
  };

  if (app.isPackaged) {
    loadBuilt();
  } else if (process.env.NODE_ENV === "production") {
    loadBuilt();
  } else {
    win.loadURL(DEV_URL);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
