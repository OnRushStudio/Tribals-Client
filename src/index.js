require('v8-compile-cache');

const { app, BrowserWindow, protocol, ipcMain, dialog, clipboard } = require('electron');
app.startedAt = Date.now();
const path = require('path');
var downloadPath = path.normalize(`${app.getPath('appData')}\\vengeclient\\userscript\\`);

const shortcuts = require('electron-localshortcut');

//auto update
const { autoUpdater } = require("electron-updater")
let updateLoaded = false;
let updateNow = false;


//Settings
const Store = require('electron-store');
Store.initRenderer();
const settings = new Store({
    defaults: {
        'UncapFPS': true,
        'Game Capture': false,
        'Accelerated Canvas': false,
        'remove-useless': true,
        'helpful-flag': true,
        'flag-limit-increase': true,
        'low latency': false,
        'exp-flag': false,
        'gpu-rasterization': true,
        'Fullscreen': true
    }
});

//swapper_func
const swapper = require('./modules/swapper.js');

//exit
ipcMain.on('exit', () => {
    app.exit();
});
//launch Args (thanks to CreepyCats)
const launchArgs = require('./modules/launchArgs.js');
launchArgs.pushArguments()


app.allowRendererProcessReuse = true;
//main Client Code
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: `Tribals Client`,
        backgroundColor: '#202020',
        icon: __dirname + "/icon.png",
        webPreferences: {
            preload: __dirname + '/preload.js',
            nodeIntegration: false,
        }
    });
    win.removeMenu();
    win.maximize();
    win.setFullScreen(settings.get('Fullscreen'));

    win.loadURL('https://tribals.io')
        .catch((error) => console.log(error))

    win.on('page-title-updated', (e) => {
        e.preventDefault();
    });
    win.webContents.on('will-prevent-unload', (event) => event.preventDefault())

    win.webContents.on('unresponsive', () => {
        console.log('Client is unresponsive...')
        win.webContents.forcefullyCrashRenderer()
        win.webContents.reload()
    })

    win.webContents.on('render-process-gone', () => {
        console.log('Client\'s renderer is gone...')
        win.webContents.forcefullyCrashRenderer()
        win.webContents.reload()
    })

    //Shortcuts
    shortcuts.register(win, "F4", () => win.loadURL('https://tribals.io/'));
    shortcuts.register(win, "F5", () => win.reload());
    shortcuts.register(win, "F6", () => { if (clipboard.readText().includes("tribals.io")) { win.loadURL(clipboard.readText()) } })
    shortcuts.register(win, 'F11', () => { win.fullScreen = !win.fullScreen; settings.set('Fullscreen', win.fullScreen) });
    shortcuts.register(win, "F12", () => win.webContents.toggleDevTools());
    shortcuts.register(win, "Escape", () => win.webContents.executeJavaScript('setTimeout(() => {document.exitPointerLock()}, "200");', true));


    //Auto Update
    autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', () => {

        const options = {
            title: "Client Update",
            buttons: ["Now", "Later"],
            message: "Client Update available, do you want to install it now or after the next restart?",
            icon: __dirname + "/icon.ico"
        }
        dialog.showMessageBox(options).then((result) => {
            if (result.response === 0) {
                updateNow = true;
                if (updateLoaded) {
                    autoUpdater.quitAndInstall();
                }
            }
        });

    });

    autoUpdater.on('update-downloaded', () => {
        updateLoaded = true;
        if (updateNow) {
            autoUpdater.quitAndInstall(true, true);
        }
    });

    swapper.replaceResources(win, app);
    swapper.initStyles(win, app);
    swapper.runScripts(win, app)
}

app.whenReady().then(() => {
    protocol.registerFileProtocol('swap', (request, callback) => {
        callback({
            path: path.normalize(request.url.replace(/^swap:/, ''))
        });
    });

    createWindow()
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

})

app.on('window-all-closed', () => {
    app.quit()
})
