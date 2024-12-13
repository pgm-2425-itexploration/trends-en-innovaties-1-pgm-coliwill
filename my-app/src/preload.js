const { contextBridge, ipcRenderer } = require("electron"); // Import Electron's contextBridge and ipcRenderer modules

// Expose specific API methods to the renderer process in a secure way
contextBridge.exposeInMainWorld("electronAPI", {
  
  // Method to get the list of available screen/window sources
  getSources: async () => {
    try {
      const sources = await ipcRenderer.invoke("get-sources"); // Invoke the 'get-sources' method in the main process
      return sources; // Return the list of sources to the renderer
    } catch (error) {
      console.error("Error in getSources:", error); // Log any errors that occur
      throw error; // Re-throw the error so the caller is aware of the issue
    }
  },
  
  // Method to show a context menu with the provided menu items
  showContextMenu: async (menuItems) => {
    try {
      await ipcRenderer.invoke("show-context-menu", menuItems); // Invoke the 'show-context-menu' method with menu items
    } catch (error) {
      console.error("Error in showContextMenu:", error); // Log any errors that occur
      throw error; // Re-throw the error so the caller is aware of the issue
    }
  },
  
  // Listens for context menu selection events and calls the provided callback with the selected source ID
  onContextMenuSelection: (callback) => {
    ipcRenderer.on("context-menu-selection", (event, sourceId) => {
      callback(sourceId); // Call the provided callback with the ID of the selected source
    });
  },
});
