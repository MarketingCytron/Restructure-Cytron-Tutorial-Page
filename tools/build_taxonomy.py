"""Write /home/claude/scrape/taxonomy.json (names + tree, live sidebar order). Retired ids: 9 rero→AI, 20 Teensy→Raspberry Pi Pico, 31 Robot Kits→Raspberry Pi Zero (ids were reused by the CMS).
Counts are filled in by build_data.py from categories.json."""
import json
TREE = [  # (id, name, [children])  — order and names exactly as the live #categoryDropdown lists them (23 Sep 2026)
 (1, 'Arduino Ecosystem', []),
 (2, 'Raspberry Pi', [(20, 'Raspberry Pi Pico'), (31, 'Raspberry Pi Zero'), (3, 'RP2040')]),
 (27, 'Raspberry Pi in Industry', []),
 (4, 'micro:bit', [(5, 'EDU:BIT'), (6, 'REKA:BIT'), (30, 'SUMO:BIT'), (44, 'ZOOM:BIT')]),
 (7, 'Robotics', [(8, 'Motor Driver'), (29, 'Sumo Robot'), (32, 'Soccer Robot'), (33, 'Battle Robot'), (34, 'Line Following Robot')]),
 (13, 'Wireless & IoT', [(14, 'LoRa'), (15, 'ESP32'), (42, 'Maker ESP32')]),
 (9, 'Artificial Intelligence (AI)', []),
 (11, 'NVIDIA AI', [(12, 'Jetson Nano'), (35, 'Jetson Orin Nano'), (36, 'Jetson Orin NX')]),
 (43, 'RDK X5', []),
 (28, 'Industry', [(41, 'LoRaWAN'), (37, 'IRIV Pi Control'), (38, 'IRIV IOC'), (40, 'IRIV EdgeAI'), (39, 'IRIV SmartHub')]),
 (10, '3D Modelling', []),
 (19, 'Other Controllers', [(21, 'Makers'), (22, 'PIC Microcontroller'), (23, 'Python for MCU')]),
 (16, 'Components', [(17, 'Sensor'), (18, 'DIY')]),
 (24, 'Miscellaneous', [(25, 'News'), (26, 'Seminars & Workshop')]),
]
cats = json.load(open('categories.json'))
out = []
for pid, name, kids in TREE:
    n = len(set(cats.get(str(pid), [])) | {s for k, _ in kids for s in cats.get(str(k), [])})
    out.append({'id': pid, 'name': name, 'children': [{'id': k, 'name': kn, 'parent': pid, 'count': 0} for k, kn in kids], 'count': 0})
tax = json.load(open('/home/claude/scrape/taxonomy.json'))
tax['categories'] = out
json.dump(tax, open('/home/claude/scrape/taxonomy.json', 'w'), ensure_ascii=False, indent=1)
print([c['name'] for c in out])
