'use strict';
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const BAUD = 115200;

class SerialManager extends require('events').EventEmitter {
  constructor() {
    super();
    this.port = null;
    this.parser = null;
    this.connected = false;
    this.pendingAck = null;
  }

  async listPorts() {
    try {
      return await SerialPort.list();
    } catch (e) {
      return [];
    }
  }

  async findDeck() {
    const ports = await this.listPorts();
    return ports.length > 0 ? ports[0].path : null;
  }

  connect(path) {
    this.close();
    return new Promise((resolve, reject) => {
      const port = new SerialPort({ path, baudRate: BAUD, autoOpen: false });
      port.open((err) => {
        if (err) { reject(err); return; }
        this.port = port;
        this.connected = true;
        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.parser = parser;
        parser.on('data', (line) => this._onData(String(line).trim()));
        port.on('close', () => {
          this.connected = false;
          this.emit('disconnect');
        });
        port.on('error', (e) => this.emit('error', e.message));
        this.emit('connect', path);
        resolve(path);
      });
    });
  }

  _onData(line) {
    if (line.startsWith('BTN:')) {
      const idx = parseInt(line.slice(4), 10);
      if (idx >= 0 && idx <= 5) this.emit('button', idx);
      return;
    }
    if (line === 'RDY') {
      this.emit('ready');
      return;
    }
    if (line === 'OK' || line.startsWith('ERR:')) {
      if (this.pendingAck) {
        const { resolve, reject, timer } = this.pendingAck;
        clearTimeout(timer);
        this.pendingAck = null;
        if (line === 'OK') resolve();
        else reject(new Error(line));
      }
      return;
    }
    this.emit('line', line);
  }

  write(text) {
    if (this.port && this.port.isOpen) {
      this.port.write(text + '\r\n');
    }
  }

  command(cmd, timeoutMs = 1000) {
    if (!this.connected) {
      return Promise.reject(new Error('No device connected'));
    }
    return new Promise((resolve, reject) => {
      if (this.pendingAck) {
        this.pendingAck.reject(new Error('overlapped command'));
      }
      const timer = setTimeout(() => {
        if (this.pendingAck) {
          this.pendingAck = null;
          reject(new Error('timeout waiting for ack'));
        }
      }, timeoutMs);
      this.pendingAck = { resolve, reject, timer };
      this.write(cmd);
    });
  }

  setButtonDisplay(idx, icon, label) {
    if (icon === undefined || icon === null) icon = -1;
    const safeLabel = String(label || '').replace(/\|/g, '').replace(/[\r\n]/g, '');
    return this.command(`SET|${idx}|${icon}|${safeLabel.substring(0, 33)}`);
  }

  clearButtonDisplay(idx) {
    return this.command(`CLEAR|${idx}`);
  }

  ping() {
    return this.command('PING');
  }

  close() {
    if (this.port) {
      try { this.port.close(); } catch (e) { }
      this.port = null;
      this.connected = false;
      this.pendingAck = null;
    }
  }
}

module.exports = { SerialManager };