'use strict';
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = require('fengari');
const { openDefault } = require('./launcher');
const { execFile } = require('child_process');

const LUA_OK = lua.LUA_OK;

const SAFE_GLOBALS = [
  'print', 'tostring', 'tonumber', 'type', 'pairs', 'ipairs', 'next',
  'select', 'pcall', 'xpcall', 'unpack', 'rawget', 'rawset', 'error',
  'table', 'string', 'math', 'os'
];

class LuaRunner {
  constructor(log) {
    this.log = log;
  }

  run(source, deckApi) {
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    const output = [];

    const envIdx = lua.lua_gettop(L) + 1;
    lua.lua_newtable(L);

    for (const name of SAFE_GLOBALS) {
      lua.lua_getglobal(L, to_luastring(name));
      lua.lua_setfield(L, envIdx, to_luastring(name));
    }

    lua.lua_getfield(L, envIdx, to_luastring('os'));
    if (!lua.lua_isnil(L, -1)) {
      const osIdx = lua.lua_gettop(L);
      for (const bad of ['execute', 'exit', 'remove', 'rename', 'tmpname', 'setlocale', 'getenv', 'difftime', 'time']) {
        lua.lua_pushnil(L);
        lua.lua_setfield(L, osIdx, to_luastring(bad));
      }
      lua.lua_pop(L, 1);
    }

    lua.lua_newtable(L);
    const deckIdx = lua.lua_gettop(L);

    lua.lua_pushcfunction(L, (L2) => {
      const n = lua.lua_gettop(L2);
      const parts = [];
      for (let i = 1; i <= n; i++) {
        if (lua.lua_isstring(L2, i)) parts.push(to_jsstring(lua.lua_tostring(L2, i)));
        else if (lua.lua_isnumber(L2, i)) parts.push(String(lua.lua_tonumber(L2, i)));
        else if (lua.lua_isboolean(L2, i)) parts.push(lua.lua_toboolean(L2, i) ? 'true' : 'false');
        else if (lua.lua_isnil(L2, i)) parts.push('nil');
        else parts.push('<table>');
      }
      const line = parts.join(' ');
      output.push(line);
      if (deckApi && deckApi.onPrint) deckApi.onPrint(line);
      return 0;
    });
    lua.lua_setfield(L, deckIdx, to_luastring('print'));

    lua.lua_pushcfunction(L, () => {
      const t = lua.lua_isstring(L, 1)
        ? to_jsstring(lua.lua_tostring(L, 1)).trim()
        : '';
      openDefault(t).catch((e) => {
        if (deckApi && deckApi.onError) deckApi.onError('deck.open: ' + e.message);
      });
      return 0;
    });
    lua.lua_setfield(L, deckIdx, to_luastring('open'));

    lua.lua_pushcfunction(L, (L2) => {
      const cmd = lua.lua_isstring(L2, 1)
        ? to_jsstring(lua.lua_tostring(L2, 1)).trim()
        : '';
      if (cmd) {
        const shell = process.platform === 'win32' ? 'cmd' : 'sh';
        const args = process.platform === 'win32' ? ['/c', cmd] : ['-c', cmd];
        execFile(shell, args, { timeout: 15000 }, (err, stdout, stderr) => {
          const code = err ? (err.code === undefined ? 1 : err.code) : 0;
          const summary = { code: code || 0, stdout: String(stdout || ''), stderr: String(stderr || '') };
          if (stdout) output.push(String(stdout).trimEnd());
          if (deckApi && deckApi.onExec) deckApi.onExec(summary);
        });
      }
      return 0;
    });
    lua.lua_setfield(L, deckIdx, to_luastring('exec'));

    lua.lua_pushvalue(L, deckIdx);
    lua.lua_setfield(L, envIdx, to_luastring('deck'));

    const loadStatus = lauxlib.luaL_loadstring(L, to_luastring(String(source || '')));
    if (loadStatus !== LUA_OK) {
      const msg = to_jsstring(lua.lua_tostring(L, -1));
      lua.lua_close(L);
      return { output, error: 'Load error: ' + msg };
    }

    lua.lua_pushvalue(L, envIdx);
    lua.lua_setupvalue(L, -2, 1);
    const callStatus = lua.lua_pcall(L, 0, 0, 0);
    if (callStatus !== LUA_OK) {
      const msg = to_jsstring(lua.lua_tostring(L, -1));
      lua.lua_close(L);
      return { output, error: 'Runtime error: ' + msg };
    }

    lua.lua_close(L);
    return { output, error: undefined };
  }
}

function createRunner(log) {
  return new LuaRunner(log);
}

module.exports = { createRunner, LuaRunner };