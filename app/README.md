# ShortcutDeck companion app

A cross-platform desktop app that works with the Arduino ShortcutDeck firmware.

## Features

- Configure all six buttons from one GUI.
  - Label shown on the button's OLED.
  - Icon (5 built-in glyphs, or none).
  - Action of none, launch (app, file, folder, or URL), or a Lua script.
- When the Arduino is connected, labels and icons push to the OLEDs automatically.
- Button presses arrive over USB serial and trigger the configured action.
- Lua scripts run sandboxed (via fengari) with a safe `deck` API.
- Config is saved locally and restored on each launch.

## Requirements

- Node.js 18+ for development.
- A CH340 driver if you use a clone Uno. Originals need none.

## Install and run

```
cd app
npm install
npm start
```

On some Linux systems the `serialport` native module needs build tools. `npm
install` usually fetches a prebuilt binary. If not, install `build-essential`
and `python3` and retry.

## Tests

```
npm test
```

This runs the Lua sandbox smoke test.

## Project layout

```
app/
|-- package.json
+-- src/
    |-- main/
    |   |-- main.js            Electron main process, IPC, wiring
    |   |-- configStore.js     persists button config to userData
    |   |-- serialManager.js   USB serial to the Arduino
    |   |-- luaRunner.js       sandboxed Lua execution (fengari)
    |   |-- launcher.js        cross-platform open and launch
    |   +-- test-lua.js        Lua sandbox smoke test
    +-- renderer/
        |-- index.html         GUI markup
        |-- style.css          GUI styling, dark theme
        +-- renderer.js        GUI logic and IPC calls
```

## Usage

1. Flash the Arduino. See `../arduino/ShortcutDeck/ShortcutDeck.ino`.
2. Plug in the Uno and launch the app.
3. In the Connect bar, pick the serial port and press Connect.
4. On connect, the current config pushes to the OLEDs (RDY handshake).
5. Edit any button card, then press Save & Apply to Deck.
6. Press a physical button. The app runs its action and logs it in the side
   panel.

## Lua scripting

Write Lua in any button with action set to Lua. The API:

```lua
deck.print("anything", 1, true)   -- log a line in the app log
deck.open("https://youtube.com")  -- open via the OS default handler
deck.exec("taskmgr.exe")          -- run a shell command, async
```

Sandbox restrictions:

- No `io`, `os.execute`, `os.exit`, filesystem, or network access.
- Only a curated global set is available: `table`, `string`, `math`, `os`
  (minus unsafe functions), `pairs`, `ipairs`, `pcall`, `error`, and so on.
- Scripts run on every button press.

## Notes

- Serial baud is fixed at 115200, matching the firmware.
- Labels cannot contain the pipe character. It is the protocol field separator.
- If you change the Lua code to reach the filesystem, you are expanding the
  sandbox. Keep it locked down.