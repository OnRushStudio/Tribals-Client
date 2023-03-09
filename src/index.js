require('v8-compile-cache');

const { app, BrowserWindow, globalShortcut, protocol, ipcMain, dialog, clipboard } = require('electron');
app.startedAt = Date.now();
const path = require('path');

const shortcuts = require('electron-localshortcut');

//auto update
const { autoUpdater } = require("electron-updater")
let updateLoaded = false;
let updateNow = false;


//Discord RPC
const DiscordRPC = require('discord-rpc');
const clientId = '727533470594760785';
const RPC = new DiscordRPC.Client({ transport: 'ipc' });
DiscordRPC.register(clientId);
const rpc_script = require('./rpc.js');

//swapper_func
const swapper = require('./swapper.js');


//Performance
app.commandLine.appendSwitch("force_high_performance_gpu");
app.commandLine.appendSwitch("in-process-gpu");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("smooth-scrolling");
app.commandLine.appendSwitch("force-high-performance-gpu");
app.commandLine.appendSwitch("disable-breakpad");
app.commandLine.appendSwitch("disable-component-update");
app.commandLine.appendSwitch("disable-print-preview");
app.commandLine.appendSwitch("disable-metrics");
app.commandLine.appendSwitch("disable-metrics-repo");
app.commandLine.appendSwitch("enable-javascript-harmony");
app.commandLine.appendSwitch("enable-future-v8-vm-features");
app.commandLine.appendSwitch("enable-webgl2-compute-context");
app.commandLine.appendSwitch("disable-hang-monitor");
app.commandLine.appendSwitch("no-referrers");
app.commandLine.appendSwitch("renderer-process-limit", 100);
app.commandLine.appendSwitch("max-active-webgl-contexts", 100);
app.commandLine.appendSwitch("enable-quic");
app.commandLine.appendSwitch("high-dpi-support", 1);
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("disable-2d-canvas-clip-aa");
app.commandLine.appendSwitch("disable-bundled-ppapi-flash");
app.commandLine.appendSwitch("disable-logging");
app.commandLine.appendSwitch("disable-web-security");
app.commandLine.appendSwitch("webrtc-max-cpu-consumption-percentage=100");
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100')


//Uncap FPS
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('disable-gpu-vsync');


//acceleratedCanvas
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');

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
    win.setFullScreen(false);

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
    shortcuts.register(win, 'F11', () => { win.fullScreen = !win.fullScreen; /*settings.set('Fullscreen', win.fullScreen)*/ });
    shortcuts.register(win, "F12", () => win.webContents.toggleDevTools());
    shortcuts.register(win, "Escape", () => win.webContents.executeJavaScript('document.exitPointerLock()', true));


    //Auto Update
    autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', () => {

        const options = {
            title: "Client Update",
            buttons: ["Now", "Later"],
            message: "Client Update available, do you want to install it now or after the next restart?",
            icon: __dirname + "/icon.png"
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

    //Swapper
    win.webContents.on('dom-ready', () => {
        swapper.runScripts(win, app);
        swapper.replaceResources(win, app);
    })

    //Discord RPC
    ipcMain.on('loadRPC', (event, data) => {
        // rpc_script.runRPC(RPC, data);
    });
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

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

RPC.login({ clientId }).catch(console.error);