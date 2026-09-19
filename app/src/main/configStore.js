'use strict';
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const NUM_BUTTONS = 6;

function defaultConfig() {
  const buttons = [];
  for (let i = 0; i < NUM_BUTTONS; i++) {
    buttons.push({
      label: `Button ${i + 1}`,
      icon: -1,
      action: 'none',
      target: '',
      script: '-- Returns: log lines via deck.print()\nprint("Hello from Lua!")\n',
    });
  }
  return { version: 1, buttons };
}

class ConfigStore {
  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'shortcutdeck-config.json');
    this.config = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        const base = defaultConfig();
        for (let i = 0; i < NUM_BUTTONS; i++) {
          const b = raw.buttons && raw.buttons[i];
          if (b) {
            base.buttons[i] = { ...base.buttons[i], ...b };
          }
        }
        base.version = raw.version || 1;
        return base;
      }
    } catch (e) {
      console.warn('Config load failed, using defaults:', e.message);
    }
    return defaultConfig();
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.config, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Config save failed:', e.message);
      return false;
    }
  }

  getButton(i) {
    return this.config.buttons[i];
  }

  setButton(i, patch) {
    this.config.buttons[i] = { ...this.config.buttons[i], ...patch };
    this.save();
  }

  getAll() {
    return this.config.buttons;
  }
}

module.exports = { ConfigStore, NUM_BUTTONS, defaultConfig };