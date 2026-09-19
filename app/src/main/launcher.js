'use strict';
const { spawn, exec } = require('child_process');
const path = require('path');

function switchShellCommand(platform) {
  switch (platform) {
    case 'win32': return { cmd: 'cmd', args: ['/c', 'start', ''] };
    case 'darwin': return { cmd: 'open', args: [] };
    default: return { cmd: 'xdg-open', args: [] };
  }
}

async function openDefault(target) {
  target = target.trim();
  if (!target) throw new Error('empty target');

  if (process.platform === 'win32') {
    return await new Promise((resolve, reject) => {
      const child = spawn('cmd', ['/c', 'start', '', target], {
        detached: true, stdio: 'ignore', shell: false,
      });
      child.on('error', reject);
      child.on('close', () => resolve('opened'));
      child.unref();
    });
  }
  const { cmd, args } = switchShellCommand(process.platform);
  return await new Promise((resolve, reject) => {
    const child = spawn(cmd, [...args, target], {
      detached: true, stdio: 'ignore',
    });
    child.on('error', reject);
    child.on('close', () => resolve('opened'));
    child.unref();
  });
}

function resolveTarget(raw, platform) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\/[^\s]+$/i.test(trimmed)) return trimmed;
  return trimmed;
}

module.exports = { openDefault, resolveTarget, switchShellCommand };