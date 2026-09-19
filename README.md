# ShortcutDeck

A 6-button shortcut controller built on an Arduino Uno R3. Each button has its
own OLED label. A cross-platform Electron app on your PC customizes each button
to launch an app, file, or URL, or run a Lua script.

```
 OLED0  OLED1  OLED2         Arduino Uno R3
 [B0]   [B1]   [B2]   -+     +- TCA9548A (6x OLED I2C)
 OLED3  OLED4  OLED5   +USB- +-- 6x tactile buttons D2..D7
 [B3]   [B4]   [B5]   -+     +-- USB serial (115200)

 Electron companion app on your PC
 (GUI config + Lua sandbox + app launching)
```

## Repository layout

| Path                  | Purpose                                          |
|-----------------------|--------------------------------------------------|
| `requirements.md`     | Bill of materials, tools, system requirements     |
| `circuit-schematic/`  | Wiring, schematic, component design, 3D case      |
| `arduino/`            | Firmware and serial protocol                      |
| `app/`                | Electron companion app                           |

## Quick start

### 1. Electronics

Follow `circuit-schematic/wiring-diagram.md` to wire the Uno, TCA9548A, six
OLEDs, and six buttons. See `schematic.md` and `component-design.md` for layout,
power, and I2C addressing.

### 2. Firmware

Install the Adafruit SSD1306 and Adafruit GFX libraries. Open
`arduino/ShortcutDeck/ShortcutDeck.ino`, pick your port and board, and upload.
The deck sends `RDY` over serial at 115200 once it is up.

### 3. Companion app

```
cd app
npm install
npm start
```

Connect the deck, then edit and save button config. See `app/README.md`.

## Documentation

- `requirements.md` describes what to buy and install.
- `arduino/PROTOCOL.md` documents the serial protocol.
- `app/README.md` covers running the app, Lua scripting, and testing.

## License

MIT.