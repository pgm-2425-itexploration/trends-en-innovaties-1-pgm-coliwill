const { app, BrowserWindow, ipcMain, desktopCapturer, Menu } = require('electron');
const path = require('path');

// Function to create the main application window
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800, // Set the width of the window to 800 pixels
    height: 600, // Set the height of the window to 600 pixels
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Specify the path to the preload script
      contextIsolation: true, // Isolate context to improve security
      enableRemoteModule: false, // Disable remote module for security reasons
      nodeIntegration: false, // Prevent node.js integration in the renderer process
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html')); // Load the HTML file into the window

  mainWindow.webContents.openDevTools(); // Open developer tools for debugging
};

// Handle the 'get-sources' IPC call from the renderer process
ipcMain.handle('get-sources', async (event) => {
  try {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] }); // Get available screen and window sources
    return sources; // Return the sources to the renderer process
  } catch (error) {
    console.error('Error fetching sources:', error); // Log any errors that occur
    throw error; // Re-throw the error to propagate it to the renderer process
  }
});

// Handle the 'show-context-menu' IPC call from the renderer process
ipcMain.handle('show-context-menu', (event, menuItems) => {
  const menu = Menu.buildFromTemplate(
    menuItems.map((item) => ({
      label: item.label, // Label for the context menu item
      click: () => {
        event.sender.send('context-menu-selection', item.id); // Send back the selection to the renderer process
      },
    }))
  );
  menu.popup(BrowserWindow.fromWebContents(event.sender)); // Show the context menu at the cursor position
});

// When the Electron application is ready, create the main window
app.whenReady().then(createWindow);

// Quit the application when all windows are closed, unless on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { // macOS typically keeps apps running even when windows are closed
    app.quit(); // Quit the app if not on macOS
  }
});

// Recreate the window if the app is activated (for macOS behavior)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) { // If no windows are open, recreate one
    createWindow(); // Create a new main window
  }
});
