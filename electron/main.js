
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs/promises");

let mainWindow;

const watchlistPath = () =>
  path.join(app.getPath("userData"), "watchlist.json");

// Validate incoming watchlist data.
function validateMovieIds(movieIds) {
  if (!Array.isArray(movieIds) || movieIds.length > 500) {
    throw new Error("Invalid watchlist data");
  }

  const valid = movieIds.every(
    (id) =>
      typeof id === "string" &&
      id.length > 0 &&
      id.length <= 200
  );

  if (!valid) {
    throw new Error("Watchlist contains invalid movie IDs");
  }

  return [...new Set(movieIds)];
}

// Read the saved watchlist from disk.
async function readWatchlist() {
  try {
    const content = await fs.readFile(watchlistPath(), "utf8");
    const movieIds = JSON.parse(content);

    return validateMovieIds(movieIds);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

// Write the watchlist to disk.
async function writeWatchlist(movieIds) {
  const validatedIds = validateMovieIds(movieIds);

  await fs.mkdir(path.dirname(watchlistPath()), {
    recursive: true,
  });

  await fs.writeFile(
    watchlistPath(),
    JSON.stringify(validatedIds, null, 2),
    "utf8"
  );

  return validatedIds;
}

// Only accept IPC requests from our application window.
function verifySender(event) {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);

  if (!senderWindow || senderWindow !== mainWindow) {
    throw new Error("Untrusted IPC sender");
  }

  const url = event.senderFrame?.url ?? "";
  const isDevURL = url.startsWith("http://127.0.0.1:5173/");
  const isPackagedURL = url.startsWith("file://");

  if (!isDevURL && !isPackagedURL) {
    throw new Error("Untrusted renderer URL");
  }
}

// Request-response: renderer asks for the watchlist.
ipcMain.handle("watchlist:get", async (event) => {
  verifySender(event);
  return readWatchlist();
});

// Request-response: renderer asks to save the watchlist.
ipcMain.handle("watchlist:save", async (event, movieIds) => {
  verifySender(event);

  const savedIds = await writeWatchlist(movieIds);

  // Event-based communication: notify the renderer after saving.
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("watchlist:updated", savedIds);
  }

  return savedIds;
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "CineMatch",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://127.0.0.1:5173");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
