// CineMatch's secure bridge to desktop functionality.
// We'll expose specific APIs here only when the app needs them.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cinematch", {
  // Request-response: retrieve the saved watchlist.
  getWatchlist: () => ipcRenderer.invoke("watchlist:get"),

  // Request-response: save updated watchlist IDs.
  saveWatchlist: (movieIds) =>
    ipcRenderer.invoke("watchlist:save", movieIds),

  // Event-based communication: listen for changes from main.
  onWatchlistUpdated: (callback) => {
    if (typeof callback !== "function") {
      throw new TypeError("Callback must be a function");
    }

    const listener = (_event, movieIds) => callback(movieIds);

    ipcRenderer.on("watchlist:updated", listener);

    // Return a cleanup function to remove the listener.
    return () => {
      ipcRenderer.removeListener("watchlist:updated", listener);
    };
  },
});
