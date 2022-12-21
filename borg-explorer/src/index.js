const { app, BrowserWindow, dialog, ipcMain, BrowserView, Menu } = require('electron');
const path = require('path');
const borg = require('./lib/borg');
const config = require('./lib/config');

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

const createPreferencesWindow = () => {
  const preferencesWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  preferencesWindow.loadFile(path.join(__dirname, 'preferences.html'));
  //preferencesWindow.webContents.openDevTools();
}

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

app.on('quit', () => {
  // On quit, cleanup temp files
  try {
    borg.cleanTempDirectory();
  } catch (err) {
    // Pop up alert that temp directory couldn't be cleaned
    dialog.showErrorBox('Error cleaning temp directory', 'Error cleaning temp directory: ' + err + '\n\nYou may want to manually delete the temp directory: ' + borg.getTempDirectory());
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

function getMenu() {
  return [
    { label: "Borg Explorer", submenu: [
      { label: "About Borg Explorer", role: "about"},
      { type: "separator" },
      { label: "Preferences", accelerator: "Command+,", click: createPreferencesWindow },
      { type: "separator" },
      { label: "Quit", accelerator: "Command+Q", click: function() { app.quit() } },
    ]},
    { label: "File", submenu: [
      { label: "Open Database", accelerator: "Command+O", click: createWindow },
      { type: "separator" },
      { label: "Copy", accelerator: "Command+C", role: "copy"},
      { label: "Paste", accelerator: "Command+V", role: "paste"},
      { type: "separator" },
      { label: "Close Window", accelerator: "Command+W", click: function() { BrowserWindow.getFocusedWindow().close() } },
    ]},
    { label: "Edit", submenu: [
      { label: "Undo", accelerator: "Command+Z", role: "undo"},
      { label: "Redo", accelerator: "Shift+Command+Z", role: "redo"},
      { type: "separator" },
      { label: "Cut", accelerator: "Command+X", role: "cut"},
      { label: "Copy", accelerator: "Command+C", role: "copy"},
      { label: "Paste", accelerator: "Command+V", role: "paste"},
      { label: "Select All", accelerator: "Command+A", role: "selectAll"},
    ]},
  ]
}

Menu.setApplicationMenu(Menu.buildFromTemplate(getMenu()));

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
      //listingWindow.webContents.openDevTools();

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
  // TODO: Deprecate for 'close-window'
  event.sender.close();
})
ipcMain.on('close-window', (event) => {
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

ipcMain.on('list-archive-stream', (event, path, passphrase, archive, archivePath) => {
  const onData = (data) => {
    event.sender.send('list-archive-stream-data', data);
  };
  const onEnd = () => {
    event.sender.send('list-archive-stream-end');
  };

  borg.getArchiveFileListStream(path, passphrase, archive, archivePath, onData, onEnd)
    .catch(function (error) {
      event.sender.send('list-archive-stream-error', error);
    });
});

ipcMain.on('extract-display-image', (event, path, passphrase, archive, archivePath) => {
  borg.extractTempFile(path, passphrase, archive, archivePath)
    .then(function (output) {
      event.sender.send('extract-display-image-result', output);
    });
});

ipcMain.on('extract-display-text', (event, path, passphrase, archive, archivePath) => {
  borg.extractTempFile(path, passphrase, archive, archivePath)
    .then(function (output) {
      event.sender.send('extract-display-text-result', output);
    });
});

ipcMain.on('open-extract-dialogue', (event, repoPath, repoPassphrase, archiveName, archivePath) => {
  // Create a new window with extract.html
  const extractWindow = new BrowserWindow({
    width: 600,
    height: 350,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  extractWindow.loadFile(path.join(__dirname, 'extract.html'));
  //extractWindow.webContents.openDevTools();

  // Send info
  extractWindow.webContents.on('did-finish-load', () => {
    const extractWindowData = {
      repoPath: repoPath,
      repoPassphrase: repoPassphrase,
      archiveName: archiveName,
      archivePath: archivePath,
    };
    extractWindow.webContents.send('set-info', JSON.stringify(extractWindowData));
  });
});

ipcMain.on('extract', (event, repoPath, repoPass, archiveName, archivePath, destination) => {
  borg.extract(repoPath, repoPass, archiveName, archivePath, destination)
    .then(function () {
      //event.sender.send('extract-finished');
      // Close extract window
      event.sender.close();
    })
    .catch(function (error) {
      event.sender.send('error-message', error);
    });
});

/* Config Functions */
ipcMain.on('get-config', (event) => {
  event.sender.send('get-config-result', config.getConfig());
});

ipcMain.on('set-config', (event, newConfig) => {
  config.setConfig(newConfig);
  event.sender.send('set-config-result', config.getConfig());
});

ipcMain.on('get-config-item', (event, item) => {
  event.sender.send('get-config-item-result', item, config.getConfigSetting(item));
});

ipcMain.on('set-config-item', (event, item, value) => {
  config.setConfigSetting(item, value);
  event.sender.send('set-config-item-result', item, config.getConfigSetting(item));
});