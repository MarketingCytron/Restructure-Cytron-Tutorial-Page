# Uncategorised clean-up — admin click list

Decisions made 29 Sep 2026. 15 of the 18 uncategorised posts are settled below.
The CMS always co-assigns the parent with a child, so "Robotics > Battle Robot" means **both** boxes ticked.

---

## Step 0 — one taxonomy change first

**Rename category id 20, `Raspberry Pi Pico` → `EDU PICO`.**

It is already an empty child of Raspberry Pi, so nothing has to be created or re-parented. Do this
before the seven EDU PICO posts below, otherwise the category won't be in the picker.

That leaves `Raspberry Pi Zero` (id 31) as the one remaining empty slot to reuse.

⚠ **Third reuse of this id.** Id 20 was Teensy, then Raspberry Pi Pico, now EDU PICO. Nothing downstream
may be keyed on category id — the dashboard is keyed on name, which is why this is safe there.

---

## The 15 posts

| # | Post | Views | Tick these |
|---|---|---|---|
| 1 | Getting Started with MOTION 2350 Pro using CircuitPython | 4,273 | Robotics |
| 2 | Node-RED on CM4 Maker Board: Displaying Thermocouple Sensor Data | 3,416 | Raspberry Pi |
| 3 | Create Alarm Clock With Neopixel using EDU PICO | 1,327 | Raspberry Pi › **EDU PICO** |
| 4 | Robot Battle RC Mode with HotRC | 969 | Robotics › Battle Robot · micro:bit › SUMO:BIT † |
| 5 | 4 Wheel Robot Battle with SUMO:BIT | 913 | Robotics › Battle Robot · micro:bit › SUMO:BIT |
| 6 | How to Use AI Properly with this PROMPT | 542 | Artificial Intelligence (AI) |
| 7 | Conveyor Belt Control without Code using iMD16 | 420 | Robotics › Motor Driver |
| 8 | SUMO:BIT Autonomous Mode (DIP) | 417 | Robotics · micro:bit › SUMO:BIT |
| 9 | Create a Flappy Bird game in EDU PICO V2 with skin feel | 362 | Raspberry Pi › **EDU PICO** |
| 10 | EDU PICO V2 Wireless Communication System | 339 | Raspberry Pi › **EDU PICO** |
| 11 | Build a Gesture Snake game inside EDU PICO V2 | 304 | Raspberry Pi › **EDU PICO** |
| 12 | Smart Microphone Alert System Using EDU PICO V2 | 281 | Raspberry Pi › **EDU PICO** |
| 13 | DIY SpaceShip Game in EDU PICO V2 with Audio Effect | 266 | Raspberry Pi › **EDU PICO** |
| 14 | Color Based Water pH System Using EDU PICO V2 | 265 | Raspberry Pi › **EDU PICO** |
| 15 | Chapter 1: Setting Up Beetle:Bit with Huskylens 2 | 135 | Robotics |

† Its slug is `SUMO:BIT_RC_Mode_with_HOT_RC` and it's tagged SUMO:BIT — so under the rule you just set
it takes the SUMO:BIT pair as well. Drop that half if you'd rather keep it purely a Robot Battle post.

**URLs**

```
https://my.cytron.io/tutorial/getting-started-with-motion-2350-pro-cp
https://my.cytron.io/tutorial/node-red-on-cm4-maker-board-displaying-thermocouple-sensor-data
https://my.cytron.io/tutorial/alarmclock_neopixel_edupico
https://my.cytron.io/tutorial/SUMO:BIT_RC_Mode_with_HOT_RC
https://my.cytron.io/tutorial/4-wheel-robot-battle-with-sumobit
https://my.cytron.io/tutorial/how-to-use-ai-with-this-prompt
https://my.cytron.io/tutorial/imd16-conveyor-belt-control-without-code
https://my.cytron.io/tutorial/SUMO:BIT_Autonomous_Mode_(DIP)
https://my.cytron.io/tutorial/create-a-flappy-bird-game-in-edu-pico-v2-with-skin-feel
https://my.cytron.io/tutorial/edu-pico-v2-wireless-communication-system
https://my.cytron.io/tutorial/build-a-gesture-snake-game-inside-edu-pico-v2
https://my.cytron.io/tutorial/smart-microphone-alert-system-using-edu-pico-v2
https://my.cytron.io/tutorial/diy-spaceship-game-in-edu-pico-v2-with-audio-effec
https://my.cytron.io/tutorial/color-based-water-ph-system-using-edu-pico-v2
https://my.cytron.io/tutorial/chapter-1-setting-up-beetlebit-with-huskylens-2
```

---

## Still to decide — 3 posts

| Post | Views | The problem |
|---|---|---|
| ZOOM:BIT with Robo Grip Mini | 487 | `micro:bit › ZOOM:BIT` exists (1 post). Same shape as the SUMO:BIT call: Robotics + micro:bit › ZOOM:BIT? |
| OpenRouter vs Hermes Agent vs OpenClaw | 249 | Software agents, no hardware at all. `Artificial Intelligence (AI)` is the only fit, and it is about to become a software-topic category rather than a hardware one. |
| Getting Started with Arduino UNO Q | 0 | Published 28 Sep. `Arduino Ecosystem` is obvious — confirming it's not deliberately unpublished. |

---

## Knock-on work these decisions create

Filing the 15 above makes six already-filed posts inconsistent with the new rules. Worth doing in the
same sitting while the rules are fresh.

**EDU PICO — 10 posts currently filed as plain `Raspberry Pi`, add `EDU PICO`:**

| Post | Views |
|---|---|
| AI HuskyLens With EDU PICO V2 : Step-by-Step Guide | 19,488 |
| Data Logging with Timestamp Using EDU PICO | 4,483 |
| Creating Animation on OLED Display with EDU PICO | 4,270 |
| Control Servo using Potentiometer With EDU PICO | 3,293 |
| Obsidian Block With RGB LEDs Using EDU PICO | 2,899 |
| DIY Music Player with Gestures using EDU PICO | 2,758 |
| Car Speed Detection Simulation System Using EDU PICO | 2,258 |
| Control keyboard with gesture (APDS9960) using EDU PICO | 2,042 |
| Microblocks with EDU PICO : CircuitPython Installation | 1,704 |
| How to make Smart USB Relay Using EDU PICO | 1,463 |

These 10 were on the 111-post `RP2040/Pico` list. **Give them `EDU PICO` instead, not both** — one board,
one shelf. That drops the RP2040/Pico job from 111 to ~101.

**Battle Robot — 3 posts that belong in the category but aren't in it:**

| Post | Views | Currently |
|---|---|---|
| 2 Wheel Robot Battle with SUMO:BIT | 2,184 | micro:bit, SUMO:BIT — add Robotics › Battle Robot |
| Battle Robot with URC10 | 1,234 | Robotics — add Battle Robot |
| Basic Robot Battle with Robo ESP32 | 1,023 | Robotics — add Battle Robot |

That takes Battle Robot from 1 post to 6.

**Three loose ends the decisions expose:**

- *Getting Started with iMD16 (No Code Setup)* (425) is filed **Raspberry Pi**. You just sent the iMD16
  conveyor post to Motor Driver, and its twin *MD10-POT Conveyor Belt Control* is already there. This one
  looks misfiled — it's a motor driver, not a Pi tutorial.
- *Joystick Pairing with SUMO:BIT and Motion 2350 Pro* (139) is filed **Components** only. Under today's
  rules: Robotics + micro:bit › SUMO:BIT.
- *Getting started with Soccer Robot using SUMO:BIT* (1,535) is filed **micro:bit** only. Add SUMO:BIT,
  and Robotics › Soccer Robot.
