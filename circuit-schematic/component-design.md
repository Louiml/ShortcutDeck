# Component design

Layout, power budget, I2C addressing, and firmware RAM strategy for the
ShortcutDeck.

## Physical layout

A 2 by 3 grid of buttons, each with an OLED above it.

```
ShortcutDeck case
  OLED0 OLED1 OLED2       row 1 OLEDs
  B0    B1    B2          row 1 buttons
  OLED3 OLED4 OLED5       row 2 OLEDs
  B3    B4    B5          row 2 buttons
```

The Arduino, or a small perfboard with the TCA9548A, sits in the bottom of the
enclosure. A USB-B hole in the back routes the cable out.

## Power

| Load                     | Current          |
|--------------------------|------------------|
| 6 SSD1306                | about 120mA      |
| 6 buttons plus resistors | under 1mA       |
| Arduino board            | about 50mA idle  |
| TCA9548A                 | about 0.1mA      |
| Total                    | about 170-200mA  |

That sits well below the Uno 500mA USB budget, so no external supply is needed.

Do not put anything else on the 5V rail that draws over 300mA total. If you add
LED backlights, budget them separately. All I2C lines stay on the 5V bus with a
shared ground.

## I2C multiplexer

The mux takes over the main bus and fans out to eight channels. We use 0 through
5.

- Main bus: Uno A4/A5 to TCA9548A SDA/SCL.
- The mux answers at 0x70 with A0, A1, and A2 grounded.
- The firmware writes one byte to the mux. Bit n set to 1 selects channel n.
- To update OLED 3, write 0x08 (channel 3) to address 0x70, then talk to the
  SSD1306 at 0x3C.
- All six OLEDs keep address 0x3C. The mux isolates each channel, so repeated
  addresses across different channels work.

Selecting channel n means calling `Wire.write(1 << n)` to address 0x70.

## Firmware RAM

The Uno has 2KB of SRAM. A full SSD1306 framebuffer is 1KB (128x64x1 bit). Six
of them would be 6KB, which will not fit. The firmware reuses one shared buffer
and cycles it across the channels, refreshing each OLED in its own time slice.

```
loop:
  for channel in 0..5:
    mux.select(channel)
    oled.drawBuffer(shared_buffer)   one reused 1KB buffer
    oled.display()
```

Because the labels and icons are static, the refresh rate does not matter. Total
RAM stays under 2KB: one 1KB buffer plus six short label strings.

If you move to an ESP32 (520KB RAM) or Mega (8KB), you can keep six independent
framebuffers and render icons or images freely.

## Icon and label rendering

Each OLED is 128 by 64 pixels.

- Row 1, pixels 0-24, holds the icon. Either a large character or a small bitmap
  glyph.
- Row 2, pixels 26-64, holds up to three lines of wrapped label text.

The firmware stores a label string and an icon per button. If the user supplies
an emoji, the default bitmap font cannot render it, since there is no unicode
glyph. The app instead picks from a set of built-in glyph bitmaps or a plain
character. See the GUI notes.

The firmware ships 24 by 24 mono glyphs for play, folder, globe, terminal, gear,
and heart, selected by index 0 through 5. The app maps the user choice to that
index and sends it over serial.

## Serial protocol summary

See `arduino/PROTOCOL.md` for the full reference. Messages are ASCII and ended
by a newline.

| Direction | Format                        | Purpose                     |
|-----------|-------------------------------|-----------------------------|
| Arduino to PC | `BTN:<0-5>`              | Button pressed              |
| Arduino to PC | `RDY`                     | Firmware ready on boot      |
| Arduino to PC | `OK` / `ERR:<reason>`     | Command acknowledgement     |
| PC to Arduino | `SET|<idx>|<icon>|<label>` | Configure OLED label/icon  |
| PC to Arduino | `CLEAR|<idx>`            | Blank an OLED               |
| PC to Arduino | `PING`                    | Liveness check, replies OK  |

Labels are plain text. `<icon>` is an integer glyph index 0-5, or -1 for none.