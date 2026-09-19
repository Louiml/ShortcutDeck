#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <stdarg.h>
#include <string.h>
#include <stdlib.h>

#define NUM_BUTTONS    6
#define NUM_OLEDS      6
const uint8_t BTN_PINS[NUM_BUTTONS] = {2, 3, 4, 5, 6, 7};

#define MUX_ADDR       0x70
#define OLED_ADDR      0x3C
#define SCREEN_W       128
#define SCREEN_H       64
#define DEBOUNCE_MS    25
#define LONG_MS        500

#define BUF_H          64

Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);

static const uint16_t GLYPH_PLAY[16] = {
    0x0010,0x0030,0x0070,0x00F0,0x01F0,0x03F0,0x07F0,0x0FF0,
    0x01F0,0x03F0,0x0070,0x00F0,0x01F0,0x0030,0x0070,0x0010
};
static const uint16_t GLYPH_FOLDER[16] = {
    0x01FF,0x0200,0x0200,0x03FF,0x0400,0x0800,0x0800,0x0800,
    0x0800,0x0800,0x0800,0x0800,0x0800,0x0800,0x0FFF,0x0000
};
static const uint16_t GLYPH_GLOBE[16] = {
    0x0000,0x07E0,0x0FF0,0x1FF8,0x3FFC,0x7FFE,0x7E7E,0xFE7F,
    0xFE7F,0x7E7E,0x7FFE,0x3FFC,0x1FF8,0x0FF0,0x07E0,0x0000
};
static const uint16_t GLYPH_TERM[16] = {
    0x0000,0x1FFF,0x3FFF,0x3FFF,0x3F00,0x3F00,0x3F00,0x3F00,
    0x3F00,0x3F00,0x3F00,0x3F00,0x3F00,0x3F00,0x3FFF,0x0000
};
static const uint16_t GLYPH_GEAR[16] = {
    0x03C0,0x0660,0x1E78,0x3FFC,0x3FFC,0x7FFE,0x7FFE,0x7FFE,
    0x7FFE,0x7FFE,0x7FFE,0x3FFC,0x3FFC,0x1E78,0x0660,0x03C0
};
static const uint16_t GLYPH_HEART[16] = {
    0x0000,0x0E70,0x1FF8,0x3FFC,0x3FFC,0x3FFC,0x3FFC,0x3FFC,
    0x1FF8,0x1FF8,0x0FF0,0x07E0,0x03C0,0x0180,0x0000,0x0000
};
static const uint16_t* GLYPHS[6] = {
    GLYPH_PLAY, GLYPH_FOLDER, GLYPH_GLOBE,
    GLYPH_TERM, GLYPH_GEAR,   GLYPH_HEART
};

struct ButtonCfg {
    int8_t  icon;
    char    label[34];
};
static ButtonCfg cfg[NUM_BUTTONS];

static bool     lastState[NUM_BUTTONS];
static uint32_t lastDebounce[NUM_BUTTONS];

static char rxBuf[96];
static uint8_t rxLen;

static void muxSelect(uint8_t ch) {
    Wire.beginTransmission(MUX_ADDR);
    Wire.write(1 << ch);
    Wire.endTransmission();
}

static void renderOled(uint8_t ch) {
    muxSelect(ch);
    display.clearDisplay();

    int8_t icon = cfg[ch].icon;
    if (icon >= 0 && icon < 6) {
        int x = (SCREEN_W - 16) / 2;
        display.fillRect(x - 4, 4, 24, 24, SSD1306_BLACK);
        for (uint8_t row = 0; row < 16; row++) {
            uint16_t bits = GLYPHS[icon][row];
            for (uint8_t b = 0; b < 16; b++) {
                if (bits & (1 << b)) {
                    display.drawPixel(x + b, 4 + row, SSD1306_WHITE);
                }
            }
        }
    }

    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    char *label = cfg[ch].label;
    if (label[0] == '\0') {
        display.setCursor(0, 52);
        display.println("-");
    } else {
        display.setCursor(0, 38);
        int line1len = 0;
        for (const char *p = label; *p && line1len < 16; p++) {
            line1len++;
        }
        char line1[17], line2[17];
        memcpy(line1, label, line1len);
        line1[line1len] = '\0';
        int i = line1len;
        int l2 = 0;
        while (label[i] && l2 < 16) { line2[l2++] = label[i++]; }
        line2[l2] = '\0';
        int cx1 = (SCREEN_W - line1len * 6) / 2;
        display.setCursor(cx1 > 0 ? cx1 : 0, 38);
        display.print(line1);
        if (l2 > 0) {
            int cx2 = (SCREEN_W - l2 * 6) / 2;
            display.setCursor(cx2 > 0 ? cx2 : 0, 52);
            display.print(line2);
        }
    }

    display.display();
}

static void renderAll() {
    for (uint8_t i = 0; i < NUM_OLEDS; i++) renderOled(i);
}

static void sendLine(const char *fmt, ...) {
    char tmp[96];
    va_list args;
    va_start(args, fmt);
    vsnprintf(tmp, sizeof(tmp), fmt, args);
    va_end(args);
    Serial.print(tmp);
    Serial.print("\r\n");
}

static void handleLine(char *line) {
    char *tok = strtok(line, "|");
    if (!tok) { sendLine("ERR:empty"); return; }

    if (strcmp(tok, "PING") == 0) {
        sendLine("OK");
    } else if (strcmp(tok, "CLEAR") == 0) {
        char *idxS = strtok(NULL, "|");
        if (!idxS) { sendLine("ERR:argc"); return; }
        int idx = atoi(idxS);
        if (idx < 0 || idx >= NUM_BUTTONS) { sendLine("ERR:idx"); return; }
        cfg[idx].icon = -1;
        cfg[idx].label[0] = '\0';
        renderOled((uint8_t)idx);
        sendLine("OK");
    } else if (strcmp(tok, "SET") == 0) {
        char *idxS = strtok(NULL, "|");
        char *iconS = strtok(NULL, "|");
        char *label = strtok(NULL, "");
        if (!idxS || !iconS) { sendLine("ERR:argc"); return; }
        int idx = atoi(idxS);
        if (idx < 0 || idx >= NUM_BUTTONS) { sendLine("ERR:idx"); return; }
        int icon = atoi(iconS);
        cfg[idx].icon = (icon < 0 || icon >= 6) ? -1 : icon;
        if (label) {
            size_t n = strlen(label);
            while (n > 0 && (label[n-1]=='\n'||label[n-1]=='\r'||label[n-1]==' ')) {
                label[--n] = '\0';
            }
            if (n >= sizeof(cfg[idx].label)) n = sizeof(cfg[idx].label) - 1;
            memcpy(cfg[idx].label, label, n);
            cfg[idx].label[n] = '\0';
        } else {
            cfg[idx].label[0] = '\0';
        }
        renderOled((uint8_t)idx);
        sendLine("OK");
    } else {
        sendLine("ERR:cmd");
    }
}

static void pollSerial() {
    while (Serial.available()) {
        char c = Serial.read();
        if (c == '\n' || c == '\r') {
            if (rxLen > 0) {
                rxBuf[rxLen] = '\0';
                handleLine(rxBuf);
                rxLen = 0;
            }
            continue;
        }
        if (rxLen < sizeof(rxBuf) - 1) {
            rxBuf[rxLen++] = c;
        } else {
            rxLen = 0;
        }
    }
}

static void pollButtons() {
    for (uint8_t i = 0; i < NUM_BUTTONS; i++) {
        bool reading = digitalRead(BTN_PINS[i]) == HIGH;
        if (reading != lastState[i]) {
            lastDebounce[i] = millis();
            lastState[i] = reading;
        }
        if (reading && lastState[i] && (millis() - lastDebounce[i] >= DEBOUNCE_MS)) {
            static uint32_t lastSent[NUM_BUTTONS];
            if (millis() - lastSent[i] > 50) {
                lastSent[i] = millis();
                sendLine("BTN:%d", i);
            }
            delay(1);
        }
    }
}

void setup() {
    memset(&cfg, 0, sizeof(cfg));
    for (uint8_t i = 0; i < NUM_BUTTONS; i++) {
        cfg[i].icon = -1;
        cfg[i].label[0] = '\0';
        pinMode(BTN_PINS[i], INPUT);
        lastState[i] = false;
        lastDebounce[i] = 0;
    }

    Serial.begin(115200);
    delay(200);
    sendLine("RDY");

    Wire.begin();
    Wire.setClock(400000);

    for (uint8_t i = 0; i < NUM_OLEDS; i++) {
        muxSelect(i);
        if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
            sendLine("ERR:oled%d", i);
        }
        display.clearDisplay();
    }
    renderAll();
}

void loop() {
    pollSerial();
    pollButtons();
}