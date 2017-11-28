const { electron, app, BrowserWindow } = require('electron');
const AppMenu = require('./menu');
const AppTray = require('./tray');

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        resizable: false,
        fullscreenable: true,
        icon: path.join(__dirname, '/../assets/icons/png/128x128.png')
    });

    mainWindow.setResizable(false);
    mainWindow.setFullScreenable(true);

    // Load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
    });

    const isDevMode = process.execPath.match(/[\\/]electron/);

    // and load the index.html of the app.
    mainWindow.loadURL(startUrl);

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });

    const appMenu = new AppMenu();
    appMenu.setMenu({
        tabs: []
    });

    if (isDevMode) {
        appMenu.appendMenuItem({
            label: 'Developer Panel',
            submenu: [{
                label: 'Toggle Developer Tools',
                accelerator: (function () {
                    if (process.platform == 'darwin')
                        return 'Alt+Command+I';
                    else
                        return 'Ctrl+Shift+I';
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow)
                        focusedWindow.toggleDevTools();
                }
            }]
        });
    }
    appMenu.initMenu();

    mainWindow.webContents.on('did-finish-load', function() {
        const appInfo = {
            name: app.getName(),
            version: app.getVersion()
        }
        mainWindow.webContents.send('app-info', appInfo);
    });

    let trayIconSrc = path.join(__dirname, '/../assets/icons/tray_icon.png')
    if (process.platform === 'darwin') {
        trayIconSrc = path.join(__dirname, '/../assets/icons/tray_icon@2x.png')
    } else if (process.platform === 'win32') {
        trayIconSrc = path.join(__dirname, '/../assets/icons/tray_icon.ico')
    }

    const tray = new AppTray({
        src: trayIconSrc,
        isDev: isDevMode,
        mainWindow
    })
    tray.show()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});