# ShortcutDeck: requirements

A 6-button shortcut controller built on an Arduino Uno R3. Each button has its
own OLED label, customized from a cross-platform Electron app on the PC. Button
presses travel over USB serial to the PC, where a background app launches
apps, files, URLs, or runs user-written Lua scripts.

## Hardware

### Bill of materials

| # | Component            | Qty | Notes                                                        | Est. cost |
|---|----------------------|-----|--------------------------------------------------------------|-----------|
| 1 | Arduino Uno R3       | 1   | ATmega328P, 5V logic, 22 digital IO, 6 analog.               | ~$25      |
| 2 | SSD1306 OLED 0.96"   | 6   | I2C, address 0x3C. One per button.                           | ~$3 each  |
| 3 | TCA9548A I2C MUX     | 1   | 8-channel I2C multiplexer. Selects which OLED to talk to.    | ~$6       |
| 4 | Tactile push button  | 6   | 4-pin momentary switch, 12mm.                                | ~$0.20    |
| 5 | Resistor 10k ohm     | 6   | Pull-down for each button.                                   | ~$0.50    |
| 6 | Breadboard (830 pt)  | 1   | For prototyping. Optional if you solder to perfboard.        | ~$4       |
| 7 | Jumper wires M-M     | 1   | 20+ pieces, breadboard friendly.                             | ~$6       |
| 8 | USB A-B cable        | 1   | Connects Uno to PC. Also supplies power and serial.           | ~$3       |
| 9 | 3D-printed case      | 1   | Optional enclosure. See `circuit-schematic/case/`.            | filament  |

Total comes to about $60 to $75. You can start with a breadboard and a single
OLED to test the firmware before building all six.

### Power

- Uno USB provides 5V at 500mA (negotiated). All I2C devices are 3.3/5V tolerant.
- Each SSD1306 OLED draws roughly 15 to 25mA (20 to 30mA with backlight on).
  6 OLEDs worst case is about 120 to 150mA. That fits in the Uno USB budget.
- 6 buttons plus 6 pull-downs draw sub-milliamp, effectively nothing.
- Total draw is about 150 to 200mA. Safe on USB and on the Uno 5V regulator.

## Software and tools

| Tool              | Purpose                                          |
|-------------------|--------------------------------------------------|
| Arduino IDE 1.8+  | Build and flash `ShortcutDeck.ino`              |
| or Arduino CLI    | Command-line build and flash                     |
| Node.js 18+       | Run the Electron app and install dependencies    |
| npm               | Install `electron`, `serialport`, `fengari`      |
| Git               | Version control                                  |
| CH340 driver*     | USB serial driver if you use a clone Uno        |

*Original Arduino boards run an onboard ATmega16U2 and need no driver. Chinese
clones often use a CH340 chip and need the CH340 driver on Windows.

### Arduino libraries (Library Manager)

| Library                | Purpose                          |
|------------------------|----------------------------------|
| Adafruit SSD1306       | SSD1306 OLED driver              |
| Adafruit GFX           | Graphics and text primitives for OLED |

The project cycles its own I2C channels instead of using the Adafruit
multiplexer library, to keep RAM low on the Uno's 2KB. See
`arduino/PROTOCOL.md` for details.

## I2C addressing

| Device                  | Address | Bus                          |
|-------------------------|---------|------------------------------|
| TCA9548A multiplexer    | 0x70 (configurable via A0-A2) | Main bus from Uno |
| Each SSD1306 OLED       | 0x3C (all) | One of mux channels 0-5 |

All six OLEDs share address 0x3C because each sits on its own mux channel. You
do not need to solder address jumpers.

## System requirements

- Windows 10/11, macOS 11+, or Linux (X11/Wayland).
- Node.js 18+ is needed to run the app in development. Packaged Electron builds
  bundle Node, so end users do not need it.

## Functional requirements

1. Six physical buttons, each with an OLED showing its label and icon.
2. A button press sends `BTN:<index>` over USB serial.
3. The GUI app customizes each button:
   - Label text shown on the OLED.
   - Icon or emoji shown on the OLED.
   - Action type of launch (app/file/URL) or run a Lua script.
4. The app listens for button presses and triggers the configured action.
5. Lua scripts run in a sandboxed interpreter (fengari) with a small host API
   (open, exec, print). Scripts cannot reach the filesystem or network unless
   the bridge provides it.
6. The app saves config locally and pushes labels and icons to the Arduino, so
   the OLED labels survive restarts when the app runs.

## Out of scope for v1

- Audio routing or volume control. Could be added later as an action type.
- Multi-page button banks. The firmware only supports 6 buttons.
- Higher-resolution RGB LCDs. Would need an ESP32 or Mega.
- Hot-swapping pages over serial. Possible future feature.

## File map

```
ShortcutDeck/
|-- requirements.md
|-- circuit-schematic/
|   |-- wiring-diagram.md
|   |-- schematic.md
|   |-- component-design.md
|   +-- case/
|-- arduino/
|   |-- ShortcutDeck/ShortcutDeck.ino
|   +-- PROTOCOL.md
+-- app/
    +-- src/
        |-- main/
        +-- renderer/
```