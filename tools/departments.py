"""Route every tutorial to the department that owns it.

Precedence — first match wins, because a post can carry signals for several:
  1. Industry   — IRIV, Milesight and anything industrial. An industrial post is Industry's
                  even when it runs on a Raspberry Pi, because the Pi is incidental to it.
  2. Education  — Cytron's own maker / education hardware. Beats Commerce so that a Maker UNO
                  post is Education's rather than Arduino's, and EDU PICO is Education's
                  rather than Raspberry Pi's.
  3. Commerce   — third-party silicon Cytron resells: Raspberry Pi, NVIDIA, Arduino, RDK X5,
                  3D printers, generic ESP32 and components.
  4. Unassigned — no clear signal. Left for a human to route; not a guess.

Categories are stronger evidence than keywords, so they are checked first within each tier.
"""
import re

# ---------------------------------------------------------------- category ids
IND_CATS = {28, 41, 37, 38, 40, 39, 45, 27}            # Industry + children, Raspberry Pi in Industry
EDU_CATS = {4, 5, 6, 30, 44,                            # micro:bit family
            21, 42,                                     # Makers, Maker ESP32
            29, 32, 33, 34,                             # Sumo / Soccer / Battle / Line Following robots
            8,                                          # Motor Driver (Cytron's own boards)
            26}                                         # Seminars & Workshop
COM_CATS = {2, 20, 31, 3,                               # Raspberry Pi family
            11, 12, 35, 36,                             # NVIDIA Jetson
            43,                                         # RDK X5
            1,                                          # Arduino Ecosystem
            22,                                         # PIC Microcontroller
            10}                                         # 3D Modelling (Creality / Ender / Cura)

# ---------------------------------------------------------------- keywords
IND_KW = ['iriv', 'milesight', 'industrial', 'industry 4', 'plc', 'modbus', 'scada', 'rs485',
          'rs232', 'teltonika', 'edgebox', 'smart factory', 'thin client', 'din rail',
          'power meter', 'codesys', 'nexoprima', 'hrdc', 'predictive maintenance', 'shrdc']
EDU_KW = ['edu pico', 'edupico', 'edu:bit', 'edubit', 'reka:bit', 'rekabit', 'sumo:bit', 'sumobit',
          'zoom:bit', 'zoombit', 'motion:bit', 'motionbit', 'motion bit', 'beetle:bit', 'beetlebit',
          'maker uno', 'maker nano', 'maker pi', 'maker drive', 'maker line', 'maker feather',
          'maker phat', 'maker soil', 'maker mini sumo', 'cytron maker', 'robo pico', 'robo base',
          'robo esp32', 'robo uno', 'robo grip', 'robo soccer', 'bocobot', 'motion 2350',
          'urc10', 'mddrc', 'md10', 'md13', 'mdds', 'mdd3a', 'smartdriveduo', 'imd16',
          'micro:bit', 'microbit', 'makecode', 'rbt', 'stem', 'ojanbot', 'ojan bot', 'rainbot',
          'workshop', 'sumo robot', 'robot battle', 'line following', 'soccer robot']
COM_KW = ['raspberry pi', 'raspberrypi', 'rpi', 'pi 4', 'pi 5', 'pi zero', 'pi pico', 'pico w',
          'rp2040', 'compute module', 'cm4', 'cm5', 'jetson', 'orin', 'nvidia', 'jetpack',
          'rdk x5', 'rdk', 'arduino', 'atmega', 'teensy', 'stm32', 'esp32', 'esp8266', 'nodemcu',
          'huskylens', 'yahboom', 'seeed', 'recomputer', 'creality', 'ender', '3d print',
          'tinkercad', 'cura', 'fusion 360', 'blender', 'wavego', 'arducam', 'hailo']

DEPTS = ['Industry', 'Education', 'Commerce', 'Unassigned']


def _hit(words, text):
    for w in words:
        if re.search(r'(?<![a-z0-9])' + re.escape(w) + r'(?![a-z0-9])', text):
            return w
    return None


def route(cat_ids, title, tags, excerpt):
    """Return (department, why) for one post."""
    ids = set(cat_ids)
    strong = (title + ' ' + ' '.join(tags)).lower()
    weak = (excerpt or '').lower()

    hit = ids & IND_CATS
    if hit: return 'Industry', 'filed under ' + _first(hit)
    hit = ids & EDU_CATS
    if hit: return 'Education', 'filed under ' + _first(hit)
    hit = ids & COM_CATS
    if hit: return 'Commerce', 'filed under ' + _first(hit)

    for dept, kws in (('Industry', IND_KW), ('Education', EDU_KW), ('Commerce', COM_KW)):
        w = _hit(kws, strong)
        if w: return dept, f'title/tag mentions {w}'
    for dept, kws in (('Industry', IND_KW), ('Education', EDU_KW), ('Commerce', COM_KW)):
        w = _hit(kws, weak)
        if w: return dept, f'excerpt mentions {w}'
    return 'Unassigned', 'no department signal'


_NAMES = {}
def set_names(d): _NAMES.update(d)
def _first(ids): return _NAMES.get(sorted(ids)[0], str(sorted(ids)[0]))
