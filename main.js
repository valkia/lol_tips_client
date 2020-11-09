const isDev = require('electron-is-dev');
//const config = require('./src/src/native/config');
// Modules to control application life and create native browser window
const {
    app,
    globalShortcut,
    ipcMain,
    Menu,
    screen,
    BrowserWindow,
    clipboard,
    nativeImage
} = require('electron')

// 保证函数只执行一次
let isRuned = false
// 截图时会出现截图界面，如下就是保存截图窗口的数组
const $windows = []
// 判断是否为快捷键退出，其他的退出方式都不被允许
let isClose = false
module.exports = mainWindow => {
    if (isRuned) {
        return
    }
    isRuned = true
}

// 解决提示ERR_CERT_AUTHORITY_INVALID的问题
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('ignore-connections-limit', 'op.gg');

const path = require('path')

// const ignoreSystemScale = config.get(`ignoreSystemScale`);
// if (ignoreSystemScale) {
app.commandLine.appendSwitch('high-dpi-support', 1);
app.commandLine.appendSwitch('force-device-scale-factor', 1);
//}

let mainWindow = null;
let popupWindow = null;

const webPreferences = {
    nodeIntegration: true,
    webSecurity: false,
    allowRunningInsecureContent: true,
    zoomFactor: 1,
};

const createMainWindow = async () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences,
        title: 'lol符文助手',

    })

    // and load the index.html of the app.
    //mainWindow.loadFile('dist/index.html')
    mainWindow.loadURL('http://localhost:8080/#/display');

    mainWindow.webContents.openDevTools();
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

//符文弹出层
const createPopupWindow = async () => {
    const [mX, mY] = mainWindow.getPosition();
    const curDisplay = screen.getDisplayNearestPoint({
        x: mX,
        y: mY,
    });

    // TODO: remember window size & position
    const popup = new BrowserWindow({
        show: false,
        frame: true,
        skipTaskbar: true,
        resizable: isDev || ignoreSystemScale,
        fullscreenable: false,
        alwaysOnTop: !isDev,
        width: isDev ? 900 : 400,
        height: 600,
        x: isDev ? curDisplay.bounds.width / 2 : curDisplay.bounds.width - 500 - 140,
        y: curDisplay.bounds.height / 2,
        webPreferences,
    });
    popup.webContents.openDevTools();
    // popup.on(`ready-to-show`, () => {
    //   popup.show();
    // });

    popup.on('closed', () => {
        popupWindow = undefined;
    });

    await popup.loadURL(
        isDev
            ? `http://127.0.0.1:8080/#/showDetail`
            : `file://${path.join(__dirname, 'build/popup.html')}`,
    );

    return popup;
};

function registerMainListeners() {
    ipcMain.on(`broadcast`, (ev, data) => {
        ev.sender.send(data.channel, data);
    });

    ipcMain.on(`show-popup`, async (ev, data) => {
        if (!popupWindow) {
            popupWindow = await createPopupWindow();
        }

        popupWindow.show();
        /*if (!popupWindow.isVisible()) {
            popupWindow.show();
        }*/

        popupWindow.webContents.send(`for-popup`, {
            championId: data.championId,
            position: data.position,
        });
    });

    ipcMain.on(`hide-popup`, async () => {
        if (popupWindow) {
            const isVisible = popupWindow.isVisible();
            if (isVisible) {
                popupWindow.hide();
            }
        }
    });

    ipcMain.on(`toggle-main-window`, () => {
        toggleMainWindow();
    });

    ipcMain.on(`restart-app`, () => {
        app.relaunch();
        app.exit();
    });
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(init)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function init() {
    console.log(`ChampR starting...`);

    Menu.setApplicationMenu(null);
    registerMainListeners();
    //registerUpdater();

    // const locale = `zh-CN`;
    // const sysLang = config.get(`appLang`);
    // if (!sysLang || ![`en-US`, `zh-CN`].includes(locale)) {
    //   config.set(`appLang`, `zh-CN`);
    // }
    // console.log(`locale: ${sysLang}, sys lang: ${sysLang}`);

    createMainWindow();
    createPopupWindow();

    //  centerWindow({
    //   window: mainWindow,
    //   animated: true,
    // });

    // await makeTray();
    // const userId = await getMachineId();
    // console.log(`userId: ${userId}`);

    // await checkUpdates();
}
