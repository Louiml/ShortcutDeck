# Schematic

ASCII schematic of the ShortcutDeck electrical design.

## Block diagram

```
 Arduino Uno R3  - USB serial -  PC (Electron app)
                 |                receives BTN:n presses
                 |                sends OLED config
                 |
   I2C (SDA=A4, SCL=A5), 5V, GND
    |
    +-- 6 buttons (pull-downs) on D2..D7
    |
    +-- TCA9548A mux, channels 0-5
            |  |  |  |  |  |
          OLED0..5, one per channel, address 0x3C
```

## Full schematic

```
             ARDUINO UNO
                 5V ----+-----------------> 5V rail (OLEDs, buttons, mux)
                 GND ---+-----------------> GND rail
             A4 (SDA) --+->  TCA9548A.SDA
             A5 (SCL) --+->  TCA9548A.SCL
             D2 -> BTN0, pull-down -> GND
             D3 -> BTN1, pull-down -> GND
             D4 -> BTN2, pull-down -> GND
             D5 -> BTN3, pull-down -> GND
             D6 -> BTN4, pull-down -> GND
             D7 -> BTN5, pull-down -> GND

   TCA9548A:
     VCC GND SDA SCL  from Uno
     SD0 SC0 <-> OLED0 (0x3C)
     SD1 SC1 <-> OLED1 (0x3C)
     SD2 SC2 <-> OLED2 (0x3C)
     SD3 SC3 <-> OLED3 (0x3C)
     SD4 SC4 <-> OLED4 (0x3C)
     SD5 SC5 <-> OLED5 (0x3C)

   All six OLEDs share VCC and GND. Each OLED's SDA and SCL connect to one
   TCA9548A output pair, so they can all keep the default address 0x3C.
```

## Netlist

```
Net 5V:
   Uno.5V  -> TCA9548A.VCC, OLED0..5.VCC, BTN0..5.A

Net GND:
   Uno.GND -> TCA9548A.GND, OLED0..5.GND
            -> R0..R5 (10k pull-downs) -> BTN0..5 + D2..D7

Net I2C:
   Uno.A4 (SDA) -> TCA9548A.SDA
   Uno.A5 (SCL) -> TCA9548A.SCL

Net channel n (n = 0..5):
   TCA9548A.SDn -> OLEDn.SDA
   TCA9548A.SCn -> OLEDn.SCL

Net buttons:
   Uno.D2 -> R0 (to GND) + BTN0
   ... one per button, D3..D7 map to BTN1..BTN5
```

## Notes

Pull-ups. The TCA9548A breakout has onboard 4.7k ohm pull-ups on SDA and SCL.
If you use a bare mux chip, add your own. Each OLED branch adds none, so only
the main bus carries pull-ups.

Polarity. Some OLED modules run on 3.3V only. If yours is 5V tolerant it works
on the Uno. Most SSD1306 breakout boards accept 3.3V to 5V.

Addresses. The mux sits at 0x70 with A0, A1, and A2 all low. The OLEDs all sit
at 0x3C.

Reset. If your OLED has an RST pin, tie it high (5V) or leave it unconnected
when the module does not use it.