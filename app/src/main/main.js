'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { ConfigStore } = require('./configStore');
const { SerialManager } = require('./serialManager');
const { createRunner } = require('./luaRunner');
const { openDefault, resolveTarget } = require('./launcher');

let win = null;
const config = new ConfigStore();
const serial = new SerialManager();
const log = (msg) => {
  const line = new Date().toLocaleTimeString() + '  ' + msg;
  if (win && !win.isDestroyed()) {
    win.webContents.send('log', line);
  }
};

const runner = createRunner(log);

function runLuaForButton(idx) {
  const btn = config.getButton(idx);
  const output = runner.run(btn.script, {
    onPrint: (line) => log(`BTN${idx}[lua] ${line}`),
    onError: (msg) => log(`BTN${idx}[lua] ERR ${msg}`),
    onExec: (r) => log(`BTN${idx}[exec] code=${r.code}`),
  });
  if (output.error) log(`BTN${idx}[lua] ${output.error}`);
  return output;
}

function executeAction(idx) {
  const btn = config.getButton(idx);
  log(`Button ${idx + 1} pressed -> ${btn.action}`);
  switch (btn.action) {
    case 'launch': {
      const target = resolveTarget(btn.target, process.platform);
      openDefault(target || '')
        .then(() => log(`BTN${idx} opened: ${target}`))
        .catch((e) => log(`BTN${idx} open failed: ${e.message}`));
      break;
    }
    case 'lua':
      runLuaForButton(idx);
      break;
    default:
      log(`BTN${idx} has no action configured`);
  }
}

serial.on('button', (idx) => executeAction(idx));
serial.on('ready', () => {
  log('Arduino ready. Pushing current config to displays...');
  pushAllDisplays();
  win && win.webContents.send('device-status', 'connected');
});
serial.on('line', (l) => log('deck < ' + l));
serial.on('error', (m) => log('serial: ' + m));
serial.on('disconnect', () => {
  log('Disconnected from Arduino.');
  win && win.webContents.send('device-status', 'disconnected');
});

function pushAllDisplays() {
  for (let i = 0; i < 6; i++) {
    const btn = config.getButton(i);
    serial.setButtonDisplay(i, btn.icon, btn.label).catch((e) => log(e.message));
  }
}

function sendFullState() {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('state', {
    buttons: config.getAll(),
    connected: serial.connected,
  });
}

ipcMain.handle('get-state', () => ({ buttons: config.getAll(), connected: serial.connected }));
ipcMain.handle('get-ports', async () => {
  const ports = await serial.listPorts();
  return ports.map((p) => ({ path: p.path, ...p }));
});
ipcMain.handle('connect', async (e, portPath) => {
  try {
    await serial.connect(portPath);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
ipcMain.handle('disconnect', async () => {
  serial.close();
  return { ok: true };
});
ipcMain.handle('update-button', (e, idx, patch) => {
  config.setButton(idx, patch);
  const btn = config.getButton(idx);
  if (serial.connected) {
    serial.setButtonDisplay(idx, btn.icon, btn.label).catch((m) => log(m.message));
  }
  return { ok: true };
});
ipcMain.handle('reset-button', (e, idx) => {
  const defaults = require('./configStore').defaultConfig().buttons[idx];
  config.setButton(idx, { ...defaults });
  return { ok: true };
});
ipcMain.handle('test-action', (e, idx) => {
  executeAction(idx);
  return { ok: true };
});

function createWindow() {
  win = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#111418',
    title: 'ShortcutDeck',
    icon: path.join(__dirname, '..', 'renderer', 'logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  const emitMaximized = () => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('window-maximized', win.isMaximized());
    }
  };
  win.on('maximize', emitMaximized);
  win.on('unmaximize', emitMaximized);

  win.webContents.once('did-finish-load', sendFullState);
}

ipcMain.handle('window-minimize', () => { win && win.minimize(); return true; });
ipcMain.handle('window-maximize-toggle', () => {
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
    return win.isMaximized();
  }
  return false;
});
ipcMain.handle('window-close', () => { win && win.close(); return true; });
ipcMain.handle('window-is-maximized', () => (win ? win.isMaximized() : false));

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.shortcutdeck.app');
  } else if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(require('electron').nativeImage.createFromPath(
      path.join(__dirname, '..', 'renderer', 'logo.png')));
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  serial.close();
  if (process.platform !== 'darwin') app.quit();
});

module.exports = { executeAction, pushAllDisplays };