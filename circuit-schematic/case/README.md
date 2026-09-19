# Case design

Parametric OpenSCAD source: `deck_case.scad`

This renders a 2 by 3, two-piece snap-together enclosure.

- The top plate holds the six OLED windows and the six button bezels.
- The bottom base forms the cavity that holds the Arduino Uno, the TCA9548A
  breakout, and a rear USB opening.

## Files

| File                    | Description                                    |
|-------------------------|------------------------------------------------|
| `deck_case.scad`        | Parametric source. Adjust the constants at the top. |
| `deck_case_top.stl`     | Pre-rendered top plate. Open in a slicer.      |
| `deck_case_bottom.stl`  | Pre-rendered bottom base.                      |

Ready-to-print STLs are included. To re-render after changing the source, use
the commands below. Adjust the OpenSCAD path if it is not in Program Files.

## Generating the STL files

You need [OpenSCAD](https://openscad.org/). Run this to export the parts:

```powershell
& "C:\Program Files\OpenSCAD\openscad.exe" deck_case.scad -D "part=0" -o deck_case_top.stl
& "C:\Program Files\OpenSCAD\openscad.exe" deck_case.scad -D "part=1" -o deck_case_bottom.stl
```

On macOS or Linux, adjust the path: `openscad deck_case.scad -D part=0 -o ...`.

## Print settings

- Material: PLA or PETG.
- Layer height: 0.2 mm.
- Infill: about 20%, with three or more top and bottom walls.
- Brim: recommended on the bottom base so the tall cavity walls stick.
- Orientation: print the top plate face down, floor up.

## Dimensions

| Item                    | Value                  |
|-------------------------|------------------------|
| OLED breakout board     | 27 by 27 by 9 mm recess|
| Visible OLED glass      | 22 by 12 mm window     |
| Tactile button          | 12 mm diameter hole    |
| Button pitch, X         | 36 mm                  |
| Row pitch, Y            | 42 mm                  |
| Case wall               | 2.5 mm                 |
| Case height             | 16 mm                  |
| USB-B port opening      | 13 by 8 mm, rear wall  |

## Assembly

1. Drop each OLED in its top-plate recess, glass facing up. Tack it with a dab
   of hot glue or an M2 screw through the screw bosses.
2. Snip or place the tactile buttons so they stick through the 12 mm holes.
3. Wire everything to the Arduino (see `schematic.md`) and drop the Uno into the
   bottom cavity with its USB-B port lined up with the rear-wall opening, so the
   cable plugs in from outside.
4. Route the USB cable through the rear opening. Run six wires, SDA, SCL, 5V,
   GND, and VCC separately. Bussed headers are easier.
5. Snap the top over the bottom and secure the corners with M2 screws.