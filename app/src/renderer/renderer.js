'use strict';

const ICONS = [
  { id: -1, label: '—', icon: null, glyph: '' },
  { id: 0,  label: 'Play', icon: '▶', glyph: '▶' },
  { id: 1,  label: 'Folder', icon: '📁', glyph: '▶' },
  { id: 2,  label: 'Globe', icon: '🌐', glyph: '●' },
  { id: 3,  label: 'Terminal', icon: '>_', glyph: '>_' },
  { id: 4,  label: 'Gear', icon: '⚙', glyph: '⚙' },
  { id: 5,  label: 'Heart', icon: '♥', glyph: '♥' },
];

const NUM = 6;
let state = { buttons: [], connected: false };
let currentPort = null;

const $ = (id) => document.getElementById(id);

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.add('hidden'), 3200);
}

function onLog(line) {
  const el = $('log');
  el.textContent += line + '\n';
  el.scrollTop = el.scrollHeight;
  if (el.textContent.length > 6000) {
    el.textContent = el.textContent.slice(-4000);
  }
}

function setDeviceStatus(connected) {
  const badge = $('deviceStatus');
  badge.className = 'badge ' + (connected ? 'badge-on' : 'badge-off');
  badge.textContent = connected ? 'Device connected' : 'No device';
  $('connectBtn').textContent = connected ? 'Disconnect' : 'Connect';
  state.connected = connected;
}

function buildCards() {
  const grid = $('buttonGrid');
  grid.innerHTML = '';
  for (let i = 0; i < NUM; i++) {
    grid.appendChild(buildCard(i));
  }
}

function buildCard(idx) {
  const btn = state.buttons[idx] || {};
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.idx = idx;

  const head = document.createElement('div');
  head.className = 'card-head';
  const idxLbl = document.createElement('span');
  idxLbl.className = 'card-index';
  idxLbl.textContent = 'BUTTON ' + (idx + 1);
  head.appendChild(idxLbl);
  const testBtn = document.createElement('button');
  testBtn.className = 'btn secondary';
  testBtn.textContent = 'Test';
  testBtn.title = 'Run this button action now';
  testBtn.addEventListener('click', () => window.deckAPI.testAction(idx));
  head.appendChild(testBtn);
  card.appendChild(head);

  const prev = document.createElement('div');
  prev.className = 'oled-preview';
  const iconEl = document.createElement('span');
  iconEl.className = 'icon';
  const labelEl = document.createElement('span');
  labelEl.className = 'label';
  prev.appendChild(iconEl);
  prev.appendChild(labelEl);
  card.appendChild(prev);

  const updatePreview = () => {
    const b = state.buttons[idx];
    const iconMeta = ICONS.find((c) => c.id === (b.icon == null ? -1 : b.icon)) || ICONS[0];
    iconEl.textContent = iconMeta.id === -1 ? '' : iconMeta.glyph;
    labelEl.textContent = b.label || '';
    prev.classList.toggle('empty', !(b.label || iconMeta.id !== -1));
  };

  const labelField = document.createElement('div');
  labelField.className = 'field';
  const labelTag = document.createElement('label');
  labelTag.textContent = 'Button label';
  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.maxLength = 33;
  labelInput.value = btn.label || '';
  labelInput.addEventListener('input', () => {
    state.buttons[idx].label = labelInput.value;
    updatePreview();
  });
  labelField.appendChild(labelTag);
  labelField.appendChild(labelInput);
  card.appendChild(labelField);

  const iconField = document.createElement('div');
  iconField.className = 'field';
  const iconTag = document.createElement('label');
  iconTag.textContent = 'Display icon';
  const iconRow = document.createElement('div');
  iconRow.className = 'icon-row';
  ICONS.forEach((meta) => {
    const chip = document.createElement('div');
    chip.className = 'icon-chip' + (meta.id === (btn.icon === undefined ? -1 : btn.icon) ? ' active' : '');
    chip.textContent = meta.id === -1 ? '—' : meta.glyph;
    chip.title = meta.label;
    chip.addEventListener('click', () => {
      state.buttons[idx].icon = meta.id;
      iconRow.querySelectorAll('.icon-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      updatePreview();
    });
    iconRow.appendChild(chip);
  });
  iconField.appendChild(iconTag);
  iconField.appendChild(iconRow);
  card.appendChild(iconField);

  const actionRow = document.createElement('div');
  actionRow.className = 'action-row';
  const mkAction = (value, text) => {
    const el = document.createElement('div');
    el.className = 'radio-action' + ((btn.action || 'none') === value ? ' selected' : '');
    el.textContent = text;
    el.addEventListener('click', () => {
      state.buttons[idx].action = value;
      actionRow.querySelectorAll('.radio-action').forEach((c) => c.classList.remove('selected'));
      el.classList.add('selected');
      syncActionFields(idx);
    });
    actionRow.appendChild(el);
  };
  mkAction('none', 'None');
  mkAction('launch', 'Launch');
  mkAction('lua', 'Lua');
  card.appendChild(actionRow);

  const launchField = document.createElement('div');
  launchField.className = 'field';
  launchField.style.display = (btn.action || 'none') === 'launch' ? '' : 'none';
  const launchTag = document.createElement('label');
  launchTag.textContent = 'App / file / folder / URL';
  const launchInput = document.createElement('input');
  launchInput.type = 'text';
  launchInput.placeholder = 'e.g. C:\\Program Files\\App\\app.exe  or  https://...';
  launchInput.value = btn.target || '';
  launchInput.addEventListener('input', () => {
    state.buttons[idx].target = launchInput.value;
  });
  launchField.appendChild(launchTag);
  launchField.appendChild(launchInput);
  card.appendChild(launchField);

  const luaField = document.createElement('div');
  luaField.className = 'field';
  luaField.style.display = (btn.action || 'none') === 'lua' ? '' : 'none';
  const luaTag = document.createElement('label');
  luaTag.textContent = 'Lua script (runs on your PC)';
  const luaArea = document.createElement('textarea');
  luaArea.className = 'script-editor';
  luaArea.value = btn.script || '';
  luaArea.spellcheck = false;
  luaArea.addEventListener('input', () => {
    state.buttons[idx].script = luaArea.value;
  });
  luaField.appendChild(luaTag);
  luaField.appendChild(luaArea);
  card.appendChild(luaField);

  const syncActionFields = () => {
    const a = state.buttons[idx].action || 'none';
    launchField.style.display = a === 'launch' ? '' : 'none';
    luaField.style.display = a === 'lua' ? '' : 'none';
  };
  card.syncActionFields = syncActionFields;

  updatePreview();
  return card;
}

async function saveAll() {
  for (let i = 0; i < NUM; i++) {
    await window.deckAPI.updateButton(i, { ...state.buttons[i] });
  }
  toast('Config saved & pushed to device');
}

async function refreshPorts() {
  const ports = await window.deckAPI.getPorts();
  const sel = $('portSelect');
  sel.innerHTML = '';
  if (!ports.length) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = 'No serial ports found';
    sel.appendChild(o);
    sel.disabled = true;
    $('connectBtn').disabled = true;
    return;
  }
  sel.disabled = false;
  $('connectBtn').disabled = false;
  const isArduino = (p) => /arduino|ch340|usb/gi.test((p.manufacturer || '') + ' ' + (p.friendlyName || ''));
  const preferred = ports.find((p) => isArduino(p)) || ports[0];
  ports.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = p.path;
    o.textContent = p.path + (p.manufacturer ? ' — ' + p.manufacturer : '');
    sel.appendChild(o);
    if (i === 0) sel.value = p.path;
  });
  if (preferred) sel.value = preferred.path;
  currentPort = sel.value;
}

async function toggleConnect() {
  if (state.connected) {
    await window.deckAPI.disconnect();
    setDeviceStatus(false);
    return;
  }
  const port = currentPort || $('portSelect').value;
  if (!port) { toast('No serial port selected'); return; }
  const res = await window.deckAPI.connect(port);
  if (res.ok) {
    toast('Connecting to ' + port + '…');
  } else {
    toast('Connect failed: ' + res.error);
  }
}

async function refreshState() {
  state = await window.deckAPI.getState();
  setDeviceStatus(state.connected);
}

function init() {
  $('connectBtn').addEventListener('click', toggleConnect);
  $('portSelect').addEventListener('change', (e) => { currentPort = e.target.value; });

  $('tbMinimize').addEventListener('click', () => window.deckAPI.minimize());
  $('tbMaximize').addEventListener('click', () => window.deckAPI.toggleMaximize());
  $('tbClose').addEventListener('click', () => window.deckAPI.close());
  window.deckAPI.onWindowMaximized((isMax) => {
    $('tbMaximize').innerHTML = isMax ? '&#x2750;' : '&#x25A1;';
    $('tbMaximize').title = isMax ? 'Restore' : 'Maximize';
  });
  window.deckAPI.isMaximized().then((isMax) => {
    $('tbMaximize').innerHTML = isMax ? '&#x2750;' : '&#x25A1;';
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.textContent = 'Save & Apply to Deck';
  saveBtn.addEventListener('click', saveAll);
  const side = document.querySelector('.side');
  const panel = document.createElement('div');
  panel.style.display = 'flex';
  panel.style.gap = '8px';
  const resetAllBtn = document.createElement('button');
  resetAllBtn.className = 'btn secondary';
  resetAllBtn.textContent = 'Reset All';
  resetAllBtn.addEventListener('click', async () => {
    for (let i = 0; i < NUM; i++) await window.deckAPI.resetButton(i);
    await refreshState();
    buildCards();
    toast('All buttons reset');
  });
  panel.appendChild(saveBtn);
  panel.appendChild(resetAllBtn);
  side.prepend(panel);

  window.deckAPI.onState((s) => {
    state = s;
    setDeviceStatus(s.connected);
    buildCards();
  });
  window.deckAPI.onLog(onLog);
  window.deckAPI.onDeviceStatus((s) => setDeviceStatus(s === 'connected'));

  refreshState().then(buildCards);
  refreshPorts();
}

window.addEventListener('DOMContentLoaded', init);