"""Apply a category re-scrape (scrape/catixN.json + state.pids) onto site/data/*.

catix maps category id -> list of indices into the pids array; a pid is sha1(slug)[:10].
Writes the refreshed site/data/tutorials.json + taxonomy.json (+ .js mirrors) so the
dashboard build sees the CMS as it stands now.

Usage: python3 tools/apply_scrape.py scrape/catix2.json scrape/state2.json
"""
import json, hashlib, sys, os

CATIX, STATE = sys.argv[1], sys.argv[2]
SITE = os.environ.get('SITE_DATA') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'data')

# names the user changed in the CMS since the mirror was built
RENAME_IDS = {3: 'RP2040/Pico'}

pids = json.load(open(STATE))['pids']
catix = json.load(open(CATIX))
T = json.load(open(f'{SITE}/tutorials.json'))
tax = json.load(open(f'{SITE}/taxonomy.json'))

by_pid = {hashlib.sha1(t['slug'].encode()).hexdigest()[:10]: t for t in T}
assert all(p in by_pid for p in pids), 'pid list does not match the mirror'

newcats = {p: [] for p in pids}
for cid, idxs in catix.items():
    for i in idxs:
        newcats[pids[i]].append(int(cid))

changed = []
for p, ids in newcats.items():
    t = by_pid[p]
    ids = sorted(ids)
    if t['categories'] != ids:
        changed.append((t['slug'], t['categories'], ids))
        t['categories'] = ids

# names + counts
cats_of = {str(cid): [by_pid[pids[i]]['slug'] for i in idxs] for cid, idxs in catix.items()}
def count(ids):
    seen = set()
    for i in ids: seen.update(cats_of.get(str(i), []))
    return len(seen)
renamed = []
for pc in tax['categories']:
    for ch in pc.get('children', []):
        if ch['id'] in RENAME_IDS and ch['name'] != RENAME_IDS[ch['id']]:
            renamed.append((ch['name'], RENAME_IDS[ch['id']])); ch['name'] = RENAME_IDS[ch['id']]
        ch['count'] = count([ch['id']])
    if pc['id'] in RENAME_IDS and pc['name'] != RENAME_IDS[pc['id']]:
        renamed.append((pc['name'], RENAME_IDS[pc['id']])); pc['name'] = RENAME_IDS[pc['id']]
    pc['count'] = count([pc['id']] + [c['id'] for c in pc.get('children', [])])

json.dump(T, open(f'{SITE}/tutorials.json', 'w'), ensure_ascii=False)
json.dump(tax, open(f'{SITE}/taxonomy.json', 'w'), ensure_ascii=False, indent=1)
open(f'{SITE}/taxonomy.js', 'w').write('window.CYTRON_TAXONOMY=' + json.dumps(tax, ensure_ascii=False) + ';')
src = open(f'{SITE}/tutorials.js').read()
i, j = src.index('window.CYTRON_TUTORIALS=') + len('window.CYTRON_TUTORIALS='), src.index(';window.CYTRON_TREND=') if ';window.CYTRON_TREND=' in src else None
open(f'{SITE}/tutorials.js', 'w').write('window.CYTRON_TUTORIALS=' + json.dumps(T, ensure_ascii=False) + (src[j:] if j else ';'))

print('renamed:', renamed)
print(len(changed), 'posts changed categories')
print('uncategorised:', sum(1 for t in T if not t['categories']))
for s, a, b in changed[:40]:
    print(' ', s, a, '->', b)
