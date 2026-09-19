# Wiring diagram

Pin-by-pin wiring table for the ShortcutDeck.

## Uno to TCA9548A (main I2C bus)

| Uno pin      | Function  | TCA9548A pin | Notes                                      |
|--------------|-----------|--------------|--------------------------------------------|
| A5 (SCL) D19 | I2C clock | SCL          | Connect A5 to SCL. Pull-ups live on the mux board. |
| A4 (SDA) D18 | I2C data  | SDA          | Connect A4 to SDA.                         |
| 5V           | Power     | VCC          | 5V supply to the mux and OLEDs.            |
| GND          | Ground    | GND          | Shared ground.                             |

The TCA9548A breakout board usually carries onboard pull-up resistors for SDA
and SCL. If you use a bare chip, add two 4.7k ohm pull-ups, one from SDA to VCC
and one from SCL to VCC. Do not add duplicate pull-ups on each OLED branch.

## TCA9548A to 6 OLEDs

Each OLED has its own mux channel. They all share the same wiring.

| Channel   | OLED   | Button | Connection                                     |
|-----------|--------|--------|-------------------------------------------------|
| SD0 / SC0 | OLED 0 | Button 0 | VCC to VCC, GND to GND, SDA to SD0, SCL to SC0 |
| SD1 / SC1 | OLED 1 | Button 1 | VCC to VCC, GND to GND, SDA to SD1, SCL to SC1 |
| SD2 / SC2 | OLED 2 | Button 2 | VCC to VCC, GND to GND, SDA to SD2, SCL to SC2 |
| SD3 / SC3 | OLED 3 | Button 3 | VCC to VCC, GND to GND, SDA to SD3, SCL to SC3 |
| SD4 / SC4 | OLED 4 | Button 4 | VCC to VCC, GND to GND, SDA to SD4, SCL to SC4 |
| SD5 / SC5 | OLED 5 | Button 5 | VCC to VCC, GND to GND, SDA to SD5, SCL to SC5 |

Per OLED pin (SSD1306 breakout):

| OLED pin | Connect to                              |
|----------|-----------------------------------------|
| VCC      | 5V, the shared bus line                 |
| GND      | GND, shared                             |
| SDA      | That channel's SDx pin on TCA9548A      |
| SCL      | That channel's SCx pin on TCA9548A      |

## Uno to 6 buttons (10k ohm pull-down)

Each button uses a digital input plus an external 10k ohm pull-down, so the pin
reads LOW normally and HIGH only while pressed.

| Button | Uno digital pin | One leg to | Other leg to | 10k ohm pull-down  |
|--------|-----------------|------------|--------------|--------------------|
| 0      | D2              | VCC (5V)   | D2           | D2 to GND          |
| 1      | D3              | VCC (5V)   | D3           | D3 to GND          |
| 2      | D4              | VCC (5V)   | D4           | D4 to GND          |
| 3      | D5              | VCC (5V)   | D5           | D5 to GND          |
| 4      | D6              | VCC (5V)   | D6           | D6 to GND          |
| 5      | D7              | VCC (5V)   | D7           | D7 to GND          |

For a 4-pin tactile switch, the two legs on one side are connected internally.
Use one leg of side A for 5V and one leg of side B for the digital pin. The 10k
ohm resistor connects the digital pin to GND.

### Shared 5V rail

All six buttons can share one 5V bus line from the Uno 5V pin instead of six
separate wires back to the board. Route 5V to the left legs of all buttons, and
each right leg to its digital pin plus pull-down to GND.

## Uno pin map

```
        D2  -> Button 0
        D3  -> Button 1
        D4  -> Button 2
        D5  -> Button 3
        D6  -> Button 4
        D7  -> Button 5
        A4 (D18) = SDA  -> I2C data
        A5 (D19) = SCL  -> I2C clock
        5V             -> OLEDs, buttons, mux
        GND            -> ground rail
```

The firmware uses A4/D18 as SDA and A5/D19 as SCL for I2C.