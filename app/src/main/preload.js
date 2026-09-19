'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deckAPI', {
  getState: () => ipcRenderer.invoke('get-state'),
  getPorts: () => ipcRenderer.invoke('get-ports'),
  connect: (path) => ipcRenderer.invoke('connect', path),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  updateButton: (idx, patch) => ipcRenderer.invoke('update-button', idx, patch),
  resetButton: (idx) => ipcRenderer.invoke('reset-button', idx),
  testAction: (idx) => ipcRenderer.invoke('test-action', idx),

  minimize: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window-maximize-toggle'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  onState: (cb) => ipcRenderer.on('state', (_e, v) => cb(v)),
  onLog: (cb) => ipcRenderer.on('log', (_e, line) => cb(line)),
  onDeviceStatus: (cb) => ipcRenderer.on('device-status', (_e, s) => cb(s)),
  onWindowMaximized: (cb) => ipcRenderer.on('window-maximized', (_e, isMax) => cb(isMax)),
});