"""Regenerate dashboard/data/tutorials.json for the category clean-up board.

Usage:  python3 tools/build_dashboard.py dashboard/data/tutorials.json dashboard/data/tutorials.json
        (reads the mirror's data/tutorials.json, data/taxonomy.json and data/cms-overrides.json)

Keeps the 16 Sep audit findings (suggested / questionable categories) per post, re-evaluated against
the categories the CMS holds now, and adds findings for posts that are new or whose categories changed.
"""
import json, re, hashlib, sys, collections
from datetime import date
import departments as DEPT   # tools/departments.py
OLD = sys.argv[1]            # existing dashboard/data/tutorials.json
OUT = sys.argv[2]
import os
SITE = os.environ.get('SITE_DATA') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')   # the mirror's data folder

old = json.load(open(OLD))
F = {k: i for i, k in enumerate(old['fields'])}
# The category list follows the mirror's taxonomy (data/taxonomy.json), i.e. the live site as last scraped,
# so categories created, renamed, re-parented or merged in the CMS flow through automatically.
TAX = json.load(open(f'{SITE}/taxonomy.json'))
CATS = []
for pc in TAX['categories']:
    CATS.append({'id': pc['id'], 'name': pc['name'], 'parent': 0})
    for ch in pc.get('children', []):
        CATS.append({'id': ch['id'], 'name': ch['name'], 'parent': pc['id']})
# names used in earlier findings that no longer exist on the site -> their replacement
RENAME = {'Edu:bit': 'EDU:BIT', 'Reka:bit': 'REKA:BIT', 'Robot Kits': 'Robotics',   # Robot Kits merged into Robotics, 18 Sep 2026
          'RP2040/PICO': 'RP2040/Pico', 'RP2040': 'RP2040/Pico',                      # renamed 23 Sep, renamed again 28 Sep 2026
          'Raspberry Pi Pico': 'RP2040/Pico',                                         # 28 Sep 2026: Pico merged into RP2040/Pico (id 20 emptied, kept for re-use)
          'Raspberry Pi Zero': 'Raspberry Pi'}                                        # 28 Sep 2026: Zero folded into Raspberry Pi (id 31 emptied, kept for re-use)
# 29 Sep 2026: id 19 was briefly renamed 'Cytron Brand' and changed back the same day — no mapping needed.
# 'Raspberry Pi Pico' is gone as a NAME (id 20 now reads EDU PICO), which is exactly why this
# pipeline keys on names and never on ids. Only id 31 is still a live-but-empty category.
EMPTIED = {'Raspberry Pi Zero'}
# curated categories: membership is an editorial choice, so no keyword support is not a finding
# 'Maker ESP32' is a migration target, not a keyword match: ESP32 tutorials are being revamped
# onto Maker ESP32 hardware, so the label is put on deliberately and means the hardware is
# changing. Never question it, and never ask for plain ESP32 back. (6 Oct 2026)
CURATED = {'Raspberry Pi in Industry', 'Artificial Intelligence (AI)', 'Industrial Workshop',
           'Maker ESP32'}
# a post filed here is deliberately NOT also filed there: do not re-suggest the listed categories
EXCLUSIVE_SUGGEST = {'Industrial Workshop': {'IRIV Pi Control', 'IRIV EdgeAI', 'Seminars & Workshop', 'Miscellaneous'},
                     'RDK X5': {'Other Controllers', 'Makers', 'PIC Microcontroller', 'Python for MCU', 'RP2040/Pico'},
                     'EDU PICO': {'RP2040/Pico'},   # one board, one shelf (29 Sep decision)
                     'Maker ESP32': {'ESP32'}}      # the migration replaces ESP32, it does not join it
SUGGEST_BEATS = {'EDU PICO': {'RP2040/Pico'}}
def rn(name): return RENAME.get(name, name)
NAME = {c['id']: c['name'] for c in CATS}
ID = {c['name']: c['id'] for c in CATS}
PARENT = {c['name']: NAME[c['parent']] for c in CATS if c['parent']}
DEPT.set_names(NAME)
T = json.load(open(f'{SITE}/tutorials.json'))
# the board tracks the CMS, so put back the categories the prototype hides and flag them for removal
OVR = json.load(open(f'{SITE}/cms-overrides.json'))

# --- keyword rules reconstructed from the audit's own reason strings -------------------------
rules = collections.defaultdict(set)
for r in old['rows']:
    for seg in r[F['reason']].split(' ; '):
        m = re.match(r'\+(.+?) — (?:title/tag|excerpt) mentions (.+)$', seg)
        if m:
            for k in m.group(2).split(','): rules[rn(m.group(1))].add(k.strip())
rules['Maker ESP32'].add('maker esp32')
rules['Motor Driver'].add('mddrc5'); rules['Motor Driver'].add('mddrc10')
rules['Sumo Robot'].add('robot sumo')
rules['RDK X5'].update(['rdk x5', 'rdk x50', 'rdk'])
rules['ZOOM:BIT'].update(['zoom:bit', 'zoombit', 'zoom bit']); rules['Robotics'].discard('zoombit')
rules['RP2040/Pico'].update(['raspberry pi pico', 'pi pico', 'rp2040', 'pico w'])
rules['Raspberry Pi'].update(['raspberry pi zero', 'pi zero'])   # Zero posts now sit in Raspberry Pi itself
rules['EDU PICO'].update(['edu pico', 'edupico'])
rules['Jetson Orin Nano'].update(['jetson orin nano', 'orin nano']); rules['Jetson Orin NX'].update(['jetson orin nx', 'orin nx'])
rules['Industrial Workshop'].update(['iriv picontrol workshop', 'iriv edgeai workshop', 'industrial workshop'])
# The audit's rules were built from post titles, so whole vocabularies were missing and perfectly
# correct categories were being doubted — "All You Need to Know About Cura Tree Support" was flagged
# for sitting in 3D Modelling. (6 Oct 2026)
rules['3D Modelling'].update(['cura', 'ender', 'creality', 'stl', 'g-code', 'gcode', 'filament',
    'pla', 'abs', 'petg', 'tpu', 'resin', 'slicer', 'slicing', '3d print', '3d printing', '3d printer',
    'tinkercad', 'fusion 360', 'blender', 'nozzle', 'extruder', 'bed leveling', 'bed levelling',
    'infill', 'overhang', 'stringing', 'raft', 'brim', 'prusa', 'octoprint', 'thingiverse'])
rules['Sensor'].update(['dht11', 'dht22', 'ds18b20', 'bme280', 'bmp280', 'sht40', 'sht31', 'mq2', 'mq-2',
    'mq135', 'hc-sr04', 'ultrasonic', 'pir', 'ldr', 'apds9960', 'mpu6050', 'tcs34725', 'ina219',
    'load cell', 'hx711', 'thermocouple', 'max6675', 'flow sensor', 'soil moisture', 'gesture',
    'proximity', 'accelerometer', 'gyroscope', 'photoresistor', 'thermistor', 'lidar', 'tof'])
rules = {c: ks for c, ks in rules.items() if c in ID and c not in EMPTIED}

def kw_hits(cat, text):
    return sorted(k for k in rules.get(cat, ()) if re.search(r'(?<![a-z0-9])' + re.escape(k) + r'(?![a-z0-9])', text))


# ---------------------------------------------------------------- house rule (29 Sep 2026)
# "At least one category, at most two. If a post already has one, do not add another unless
#  what it has is wrong."  A parent and its child count as ONE place, because the CMS ticks the
#  parent automatically — Raspberry Pi > EDU PICO is one shelf, not two.
# Two shelves is the ideal, but it is NOT enforced: a post already carrying three is left alone.
# Only a wrong category earns an edit. (6 Oct 2026)
MAX_PLACES = 2
PLACE = {c['name']: (NAME[c['parent']] if c['parent'] else c['name']) for c in CATS}
# these are not hardware, so they do not make a 3D-printing post "electronic"
NOT_HARDWARE = {'3D Modelling', 'Miscellaneous', 'News', 'Seminars & Workshop',
                'Artificial Intelligence (AI)'}

def places(names): return {PLACE[n] for n in names if n in PLACE}

def strength(name, tt, ex):
    """2 = named in the title or tags, 1 = only in the excerpt, 0 = no keyword support."""
    if kw_hits(name, tt): return 2
    if kw_hits(name, ex): return 1
    return 0

def place_strength(place, cur, tt, ex):
    return max([strength(n, tt, ex) for n in cur if PLACE.get(n) == place] or [0])

def split(s): return [x for x in s.split(', ') if x]
def by_id(names): return sorted(set(names), key=lambda n: ID[n])
def pid(slug): return hashlib.sha1(slug.encode()).hexdigest()[:10]

oldrow = {r[F['slug']]: r for r in old['rows']}
# categories the audit never saw (created since): their keyword rules run over every post
seen = set()
for r in old['rows']:
    for k in ('current', 'add', 'quest'): seen.update(rn(x) for x in split(r[F[k]]))
NEW_CATS = [c for c in ID if c not in seen and c in rules]
# categories that absorbed a merge on 28 Sep: their rules must run over every post, not just the
# posts that happened to carry a suggestion for one of the merged-away names
MERGED = [c for c in ('RP2040/Pico',) if c in rules]
NEW_CATS += [c for c in MERGED if c not in NEW_CATS]
NOTE = {c: '(category created after the 16 Sep audit)' for c in NEW_CATS}
NOTE.update({c: '(Raspberry Pi Pico and RP2040 merged into it on 28 Sep)' for c in MERGED})
assert all(pid(s) == r[F['id']] for s, r in oldrow.items()), 'id scheme changed'


def trim_to_one_place(add, tt, ex):
    """Keep the best shelf out of a suggestion list, parent and child together.
    If two shelves are equally well supported, keep both and let a human choose — guessing on
    category id order picked Raspberry Pi over Robotics for a robot controller."""
    if not add: return [], None
    sc = {pl: max(strength(n, tt, ex) for n in add if PLACE.get(n) == pl) for pl in places(add)}
    top = max(sc.values())
    win = sorted([pl for pl, v in sc.items() if v == top], key=lambda pl: ID.get(pl, 999))
    note = ('%d shelves fit equally well (%s) — pick one' % (len(win), ', '.join(win))) if len(win) > 1 else None
    return [c for c in add if PLACE.get(c) in win], note

def evaluate(t, prev):
    removed = [NAME[i] for i in OVR.get(t['slug'], {}).get('removed', []) if i in NAME]
    cur = by_id([NAME[i] for i in t['categories'] if i in NAME] + removed)
    tt = (t['title'] + ' ' + ' '.join(t['tags'])).lower()
    ex = (t.get('excerpt') or '').lower()
    segs = {}                      # category -> reason segment
    add, quest, applied_since = [], [], []
    if prev:
        pcur, pquest = ([rn(x) for x in split(prev[F[k]]) if rn(x) in ID] for k in ('current', 'quest'))
        padd_raw = split(prev[F['add']])
        padd = [rn(x) for x in padd_raw if x not in RENAME and rn(x) in ID]
        for seg in prev[F['reason']].split(' ; '):
            if seg.startswith('✓ applied'):                       # carry the "applied since audit" note forward
                applied_since += [rn(x) for x in seg.split(': ', 1)[1].split(', ') if rn(x) in cur and rn(x) not in applied_since]
                continue
            m = re.match(r'([+?])(.+?) — (.*)$', seg)
            if not m or m.group(2) in RENAME: continue          # segments about a merged/renamed category are re-derived below
            c = m.group(2)
            if c not in ID: continue
            for a, b in RENAME.items(): seg = seg.replace(f'parent of {a}', f'parent of {b}')
            segs[c] = seg
        pquest = [c for c in pquest if c not in CURATED]         # a category that later became curated
        pquest = [c for c in pquest if not kw_hits(c, tt) and not kw_hits(c, ex)]   # rules may have improved
        for c in pquest:                                         # renamed review-only categories keep their segment
            if c not in segs: segs[c] = f'?{c} — no keyword support in title, excerpt or tags'
        if any(x in RENAME for x in padd_raw):                   # a suggestion pointed at a merged/renamed category: re-run the keyword rules
            for c in rules:
                if c in cur or c in padd: continue
                h = kw_hits(c, tt); where = 'title/tag'
                if not h: h = kw_hits(c, ex); where = 'excerpt'
                if h: padd.append(c); segs[c] = f'+{c} — {where} mentions {", ".join(h)}'
        for c in NEW_CATS:                                       # new categories: apply their rules everywhere
            if c in cur or c in padd: continue
            h = kw_hits(c, tt); where = 'title/tag'
            if not h: h = kw_hits(c, ex); where = 'excerpt'
            if h: padd.append(c); segs[c] = f'+{c} — {where} mentions {", ".join(h)} {NOTE[c]}'
        # suggestions still open
        for c in padd:
            if c in cur:
                if c not in applied_since: applied_since.append(c)
            elif c not in add: add.append(c)
        # questionable categories still present
        # Re-check a carried-over doubt against the CURRENT rules. Without this a category stays
        # doubted for ever, even after the keyword that justifies it has been added — which is how
        # the Cura and Ender posts kept getting flagged for sitting in 3D Modelling.
        quest = [c for c in pquest if c in cur and c not in CURATED
                 and not kw_hits(c, tt) and not kw_hits(c, ex)]
        # categories removed since the audit: re-check whether keywords still ask for them
        for c in pcur:
            if c not in cur and c not in add:
                h = kw_hits(c, tt)
                if h:
                    add.append(c); segs[c] = f'+{c} — title/tag mentions {", ".join(h)} (was assigned at the 15 Sep audit, removed since)'
                elif c in PARENT and PARENT[c] not in cur and PARENT[c] not in add:
                    pass
        # categories added since the audit with no keyword support
        for c in cur:
            if c not in pcur and c not in quest and c not in CURATED and not kw_hits(c, tt) and not kw_hits(c, ex):
                child_ok = any(PARENT.get(k) == c for k in cur if kw_hits(k, tt) or kw_hits(k, ex))
                if not child_ok:
                    quest.append(c); segs[c] = f'?{c} — no keyword support in title, excerpt or tags (added since the 15 Sep audit)'
    else:
        # new post: run the keyword rules
        for c in rules:
            if c in cur: continue
            h = kw_hits(c, tt)
            if h: add.append(c); segs[c] = f'+{c} — title/tag mentions {", ".join(h)}'
            else:
                h = kw_hits(c, ex)
                if h: add.append(c); segs[c] = f'+{c} — excerpt mentions {", ".join(h)}'
        for c in cur:
            if c not in CURATED and not kw_hits(c, tt) and not kw_hits(c, ex) and not any(PARENT.get(k) == c for k in cur):
                quest.append(c); segs[c] = f'?{c} — no keyword support in title, excerpt or tags'
    for c in removed:                 # intended taxonomy: these should come off in the CMS
        if c not in quest: quest.append(c)
        segs[c] = f'?{c} — remove in CMS: RDK X5 posts belong only in RDK X5 (the prototype already hides it here)'
    # parents of suggested children
    for c in list(add):
        p = PARENT.get(c)
        if p and p not in cur and p not in add:
            add.append(p); segs[p] = f'+{p} — parent of {c}'
    for k, drop in EXCLUSIVE_SUGGEST.items():
        if k in cur: add = [c for c in add if c not in drop]
    # One board, one shelf: where two sibling categories both fit, the more specific one wins
    # even before anyone has filed the post — otherwise every EDU PICO post asks for RP2040/Pico too.
    for k, drop in SUGGEST_BEATS.items():
        if k in cur or k in add: add = [c for c in add if c not in drop]
    add = by_id(add); quest = by_id(quest)
    keep = set(add) | set(quest)
    def segkey(c):
        sg = segs[c]
        kind = 2 if sg.startswith('?') else 1 if ' — excerpt mentions' in sg else 0
        return (kind, c)
    reason = ' ; '.join(segs[c] for c in sorted((c for c in keep if c in segs), key=segkey))
    if applied_since:
        reason = (reason + ' ; ' if reason else '') + '✓ applied in CMS since the 15 Sep audit: ' + ', '.join(applied_since)
    # ---- house rule: at least one place, at most two -------------------------------------
    drop, notes = [], []

    # 3D Modelling is for pure 3D work. If the post also sits on a hardware shelf, it comes off.
    if '3D Modelling' in cur and (places(cur) - NOT_HARDWARE):
        drop.append('3D Modelling')
        notes.append('-3D Modelling — the post also covers electronics, so it is not pure 3D work')

    kept = [c for c in cur if c not in drop]
    have = places(kept)

    if have:
        # It already has a shelf. Nothing gets added — unless every shelf it has looks wrong.
        all_wrong = have and all(p in {PLACE.get(q) for q in quest} for p in have)
        if not all_wrong:
            add = []
        else:
            add, tie = trim_to_one_place(add, tt, ex)
            notes.append('the category it has looks wrong, so a replacement is suggested')
            if tie: notes.append(tie)

        # 6 Oct 2026: extra categories are acceptable. A post sitting on three or four shelves is
        # not a problem worth anyone's afternoon — only a WRONG category is. So nothing is
        # removed for being "one too many"; see MAX_PLACES above.
    else:
        # Nothing at all (or only a shelf we are removing): give it exactly one.
        add, tie = trim_to_one_place(add, tt, ex)
        if tie: notes.append(tie)

    quest = [c for c in quest if c in kept and c not in drop]
    drop = by_id(drop)
    # Strip "+X" segments for anything no longer being suggested, so the reason matches the ask.
    keepseg = []
    for seg in reason.split(' ; '):
        m2 = re.match(r'\+(.+?) — ', seg)
        if m2 and m2.group(1) not in add: continue
        keepseg.append(seg)
    reason = ' ; '.join([x for x in keepseg if x])
    if notes:
        reason = (reason + ' ; ' if reason else '') + ' ; '.join(notes)

    prio = 1 if not kept else 2 if (drop or add) else 4 if quest else 0
    return cur, add, quest, reason, prio, drop

rows = []
changes = collections.Counter()
for t in T:
    prev = oldrow.get(t['slug'])
    cur, add, quest, reason, prio, drop = evaluate(t, prev)
    if prev is None: changes['new post'] += 1
    elif prev[F['prio']] != prio: changes[f'{prev[F["prio"]]}->{prio}'] += 1
    dept, _why = DEPT.route(t['categories'], t['title'], t['tags'], t.get('excerpt'))
    rows.append([pid(t['slug']), t['title'], t['slug'], prio, ', '.join(cur), ', '.join(add), ', '.join(quest),
                 reason, t['type'] or '', t['level'] or '', t['iso'] or '', t['views'] or 0, ', '.join(t['tags']),
                 dept, ', '.join(drop)])
# same order as before: priority band (1,2,4,0), then views desc
order = {1: 0, 2: 1, 4: 2, 0: 3}
rows.sort(key=lambda r: (order[r[3]], -r[11]))
out = {'generated': date.today().isoformat(),
       'source': f'data/tutorials.json ({len(rows)} posts; listing and categories re-read {date.today().strftime("%-d %b %Y")}, views from 17 Sep 2026; findings from the 16 Sep audit re-checked against the CMS)',
       'fields': [f for f in old['fields'] if f not in ('dept', 'drop')] + ['dept', 'drop'], 'cats': CATS,
       'depts': DEPT.DEPTS, 'rows': rows}
json.dump(out, open(OUT, 'w'), ensure_ascii=False)
print('new categories ruled everywhere:', NEW_CATS)
bands = collections.Counter(r[3] for r in rows)
print('rows', len(rows), 'bands', dict(bands), 'need fix', sum(v for k, v in bands.items() if k), 'changes', dict(changes))
print('departments', dict(collections.Counter(r[13] for r in rows)))
print('posts with something to remove:', sum(1 for r in rows if r[14]))
print('posts to add a first category :', sum(1 for r in rows if r[5]))
gone = [s for s in oldrow if s not in {t['slug'] for t in T}]
print('slugs gone:', gone)
