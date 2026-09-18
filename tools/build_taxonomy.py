"""Write /home/claude/scrape/taxonomy.json (names + tree, live sidebar order as of 18 Sep 2026).
Counts are filled in by build_data.py from categories.json."""
import json
TREE = [  # (id, name, [children])  — order and names exactly as the live #categoryDropdown lists them
 (43, 'RDK X5', []),
 (1, 'Arduino Ecosystem', []),
 (2, 'Raspberry Pi', [(3, 'RP2040/PICO')]),
 (4, 'micro:bit', [(5, 'EDU:BIT'), (6, 'REKA:BIT'), (30, 'SUMO:BIT'), (44, 'ZOOM:BIT')]),
 (31, 'Robot Kits', []),            # merged into Robotics on 18 Sep 2026; dropped below when it has no posts
 (7, 'Robotics', [(8, 'Motor Driver'), (29, 'Sumo Robot'), (32, 'Soccer Robot'), (33, 'Battle Robot'), (34, 'Line Following Robot'), (9, 'rero')]),
 (10, '3D Modelling', []),
 (11, 'NVIDIA AI', [(36, 'Jetson Orin NX'), (12, 'Jetson Nano')]),
 (13, 'Wireless & IoT', [(14, 'LoRa'), (15, 'ESP32'), (42, 'Maker ESP32')]),
 (28, 'Industry', [(37, 'IRIV Pi Control'), (41, 'LoRaWAN'), (38, 'IRIV IOC'), (39, 'IRIV SmartHub'), (40, 'IRIV EdgeAI')]),
 (16, 'Components', [(17, 'Sensor'), (18, 'DIY')]),
 (19, 'Other Controllers', [(20, 'Teensy'), (21, 'Makers'), (22, 'PIC Microcontroller'), (23, 'Python for MCU')]),
 (24, 'Miscellaneous', [(25, 'News'), (26, 'Seminars & Workshop')]),
]
cats = json.load(open('categories.json'))
out = []
for pid, name, kids in TREE:
    n = len(set(cats.get(str(pid), [])) | {s for k, _ in kids for s in cats.get(str(k), [])})
    if pid == 31 and n == 0:
        continue   # empty after the merge: not a section any more
    out.append({'id': pid, 'name': name, 'children': [{'id': k, 'name': kn, 'parent': pid, 'count': 0} for k, kn in kids], 'count': 0})
tax = json.load(open('/home/claude/scrape/taxonomy.json'))
tax['categories'] = out
json.dump(tax, open('/home/claude/scrape/taxonomy.json', 'w'), ensure_ascii=False, indent=1)
print([c['name'] for c in out])
