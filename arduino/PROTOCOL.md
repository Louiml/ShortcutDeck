# ShortcutDeck serial protocol

The Arduino and the Electron app talk over the Uno USB serial at 115200 baud.
Every message is ASCII text ended by a newline. A carriage return is ignored.

## Arduino to PC

| Message        | Example   | Meaning                                   |
|----------------|-----------|-------------------------------------------|
| `RDY`          | `RDY`     | Firmware booted, serial port is up        |
| `BTN:<index>`  | `BTN:3`   | Button index (0-5) was pressed            |
| `OK`           | `OK`      | Command processed successfully            |
| `ERR:<reason>` | `ERR:idx` | Command rejected (idx, cmd, argc, ...)   |

`ERR` reasons:

| Reason  | Meaning                                  |
|---------|------------------------------------------|
| `empty` | empty line received                      |
| `cmd`   | unknown command keyword                  |
| `argc`  | missing fields                           |
| `idx`   | button index out of range (0-5)          |
| `oledN` | display N failed to initialise           |

## PC to Arduino

The app sends commands. The Arduino replies `OK` or `ERR:<reason>`.

| Command                    | Example             | Meaning                              |
|----------------------------|---------------------|--------------------------------------|
| `SET|<idx>|<icon>|<label>` | `SET|2|1|My Folder` | Set button idx label and icon        |
| `CLEAR|<idx>`              | `CLEAR|4`           | Blank button idx (no icon or label)  |
| `PING`                     | `PING`              | Liveness check                       |

### `SET` field details

- `<idx>` is a button index, an integer 0-5.
- `<icon>` is a glyph index, an integer 0-5. The mapping is:

  | Icon | Glyph   |
  |------|---------|
  | 0    | Play    |
  | 1    | Folder  |
  | 2    | Globe   |
  | 3    | Terminal|
  | 4    | Gear    |
  | 5    | Heart   |

  Use -1 for no icon.
- `<label>` is the rest of the line, up to 33 characters, shown on the OLED.
  Trailing whitespace and newlines are stripped. The label wraps to two centered
  lines on the display.

Labels may contain spaces but never the pipe character. Fields are separated by
a literal pipe, so do not put `|` in a label.

### Example exchange

```
PC -> A:  SET|0|0|YouTube
A -> PC:  OK
PC -> A:  SET|5|-1|Notes
A -> PC:  OK
A -> PC:  BTN:0        user pressed button 0
...
A -> PC:  BTN:5
PC -> A:  PING
A -> PC:  OK
```

## Notes

- Baud is fixed at 115200 in `ShortcutDeck.ino`.
- The Arduino sends `RDY` about 200 ms after boot. The app should wait for it
  before pushing config.
- Messages are small and line-buffered, so no length-prefix framing is needed.