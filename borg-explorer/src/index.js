const { app, BrowserWindow, dialog, ipcMain, BrowserView } = require('electron');
const path = require('path');
const borg = require('./lib/borg');

var indexIsMostRecentWindowOpened = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  indexIsMostRecentWindowOpened = true;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  /*if (process.platform !== 'darwin') {
    app.quit();
  }*/
  if (!indexIsMostRecentWindowOpened) {
    createWindow();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('show-open-dialog', function (event, options) {
  dialog.showOpenDialog(options).then(function (filePaths) {
    event.sender.send('open-dialog-result', filePaths);
  });
});

ipcMain.on('open-database', (event, database_path, passphrase) => {
  // Check database, transition to main window
  borg.checkRepository(database_path, passphrase)
    .then(function (output) {
      const listingWindow = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: true,
          contextIsolation: false,
        },
      })
      
      listingWindow.loadFile(path.join(__dirname, 'listing.html'));
      listingWindow.webContents.openDevTools();

      // Create a BrowserView for the file listing
      /*const listingView = new BrowserView();
      listingWindow.setBrowserView(listingView);
      listingView.setBounds({ x: 0, y: 150, width: 700, height: 400});
      listingView.setAutoResize({ width: true, height: true })
      listingView.webContents.loadFile(path.join(__dirname, 'file-listing.html'));*/

      // Send archive path and passphrase
      listingWindow.webContents.on('did-finish-load', () => {
        const listingWindowData = {
          path: database_path,
          passphrase: passphrase,
        };
        listingWindow.webContents.send('open-archive', JSON.stringify(listingWindowData));
      });
      
      // Close main window
      event.sender.close();

      indexIsMostRecentWindowOpened = false;
    })
    .catch(function (error) {
      event.sender.send('error-message', error);
    });
})

ipcMain.on('close-listing', (event) => {
  event.sender.close();
})

ipcMain.on('list-repository', (event, path, passphrase) => {
  borg.getRepositoryArchiveList(path, passphrase)
    .then(function (output) {
      event.sender.send('list-repository-result', output);
    });
})

ipcMain.on('list-archive', (event, path, passphrase, archive, archivePath) => {
  borg.getArchiveFileList(path, passphrase, archive, archivePath)
    .then(function (output) {
      event.sender.send('list-archive-result', output);
    });
});