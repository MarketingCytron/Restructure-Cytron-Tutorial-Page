"""Regenerate dashboard/data/tutorials.json for the category clean-up board.

Usage:  python3 tools/build_dashboard.py dashboard/data/tutorials.json dashboard/data/tutorials.json
        (reads the mirror's data/tutorials.json for the current categories)

Keeps the 16 Sep audit findings (suggested / questionable categories) per post, re-evaluated against
the categories the CMS holds now, and adds findings for posts that are new or whose categories changed.
"""
import json, re, hashlib, sys, collections
from datetime import date
OLD = sys.argv[1]            # existing dashboard/data/tutorials.json
OUT = sys.argv[2]
import os
SITE = os.environ.get('SITE_DATA') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')   # the mirror's data folder

old = json.load(open(OLD))
F = {k: i for i, k in enumerate(old['fields'])}
CATS = old['cats']
NAME = {c['id']: c['name'] for c in CATS}
ID = {c['name']: c['id'] for c in CATS}
PARENT = {c['name']: NAME[c['parent']] for c in CATS if c['parent']}
T = json.load(open(f'{SITE}/tutorials.json'))

# --- keyword rules reconstructed from the audit's own reason strings -------------------------
rules = collections.defaultdict(set)
for r in old['rows']:
    for seg in r[F['reason']].split(' ; '):
        m = re.match(r'\+(.+?) — (?:title/tag|excerpt) mentions (.+)$', seg)
        if m:
            for k in m.group(2).split(','): rules[m.group(1)].add(k.strip())
rules['Maker ESP32'].add('maker esp32')
rules['Motor Driver'].add('mddrc5'); rules['Motor Driver'].add('mddrc10')
rules['Sumo Robot'].add('robot sumo')

def kw_hits(cat, text):
    return sorted(k for k in rules.get(cat, ()) if re.search(r'(?<![a-z0-9])' + re.escape(k) + r'(?![a-z0-9])', text))

def split(s): return [x for x in s.split(', ') if x]
def by_id(names): return sorted(set(names), key=lambda n: ID[n])
def pid(slug): return hashlib.sha1(slug.encode()).hexdigest()[:10]

oldrow = {r[F['slug']]: r for r in old['rows']}
assert all(pid(s) == r[F['id']] for s, r in oldrow.items()), 'id scheme changed'

def evaluate(t, prev):
    cur = by_id([NAME[i] for i in t['categories'] if i in NAME])
    tt = (t['title'] + ' ' + ' '.join(t['tags'])).lower()
    ex = (t.get('excerpt') or '').lower()
    segs = {}                      # category -> reason segment
    add, quest, applied_since = [], [], []
    if prev:
        pcur, padd, pquest = split(prev[F['current']]), split(prev[F['add']]), split(prev[F['quest']])
        for seg in prev[F['reason']].split(' ; '):
            m = re.match(r'[+?](.+?) — ', seg)
            if m: segs[m.group(1)] = seg
        # suggestions still open
        for c in padd:
            if c in cur: applied_since.append(c)
            else: add.append(c)
        # questionable categories still present
        quest = [c for c in pquest if c in cur]
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
            if c not in pcur and c not in quest and not kw_hits(c, tt) and not kw_hits(c, ex):
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
            if not kw_hits(c, tt) and not kw_hits(c, ex) and not any(PARENT.get(k) == c for k in cur):
                quest.append(c); segs[c] = f'?{c} — no keyword support in title, excerpt or tags'
    # parents of suggested children
    for c in list(add):
        p = PARENT.get(c)
        if p and p not in cur and p not in add:
            add.append(p); segs[p] = f'+{p} — parent of {c}'
    add = by_id(add); quest = by_id(quest)
    keep = set(add) | set(quest)
    def segkey(c):
        sg = segs[c]
        kind = 2 if sg.startswith('?') else 1 if ' — excerpt mentions' in sg else 0
        return (kind, c)
    reason = ' ; '.join(segs[c] for c in sorted((c for c in keep if c in segs), key=segkey))
    if applied_since:
        reason = (reason + ' ; ' if reason else '') + '✓ applied in CMS since the 15 Sep audit: ' + ', '.join(applied_since)
    prio = 1 if not cur else 2 if add else 4 if quest else 0
    return cur, add, quest, reason, prio

rows = []
changes = collections.Counter()
for t in T:
    prev = oldrow.get(t['slug'])
    cur, add, quest, reason, prio = evaluate(t, prev)
    if prev is None: changes['new post'] += 1
    elif prev[F['prio']] != prio: changes[f'{prev[F["prio"]]}->{prio}'] += 1
    rows.append([pid(t['slug']), t['title'], t['slug'], prio, ', '.join(cur), ', '.join(add), ', '.join(quest),
                 reason, t['type'] or '', t['level'] or '', t['iso'] or '', t['views'] or 0, ', '.join(t['tags'])])
# same order as before: priority band (1,2,4,0), then views desc
order = {1: 0, 2: 1, 4: 2, 0: 3}
rows.sort(key=lambda r: (order[r[3]], -r[11]))
out = {'generated': date.today().isoformat(),
       'source': f'data/tutorials.json ({len(rows)} posts, re-scraped 17 Sep 2026; findings from the 16 Sep audit re-checked against the CMS)',
       'fields': old['fields'], 'cats': CATS, 'rows': rows}
json.dump(out, open(OUT, 'w'), ensure_ascii=False)
bands = collections.Counter(r[3] for r in rows)
print('rows', len(rows), 'bands', dict(bands), 'need fix', sum(v for k, v in bands.items() if k), 'changes', dict(changes))
gone = [s for s in oldrow if s not in {t['slug'] for t in T}]
print('slugs gone:', gone)
