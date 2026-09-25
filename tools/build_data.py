"""Rebuild site/data/* from the September-2026 re-scrape in /home/claude/scrape2.

Inputs (this folder):
  listing_raw.json   932 posts from /tutorial?page=N   (slug,title,cover,level,type,author,authorSlug,date,excerpt)
  details.json       {slug: {v:views, l:likes, id:postId, t:tags[], w:words, h:hero, d:publishedDate}}
  categories.json    {categoryId: [slug,...]}   from /tutorial-search?categories=ID&page=N
  audience.json      {"education":[slug..], "industry":[slug..]}  from /tutorial-search?post_type=...
Reused from the first capture (/home/claude/scrape):
  taxonomy.json (names / tree), articles.json + products.json (5 full bodies)
"""
import json, re, os
from datetime import datetime
OLD='/home/claude/scrape'
SITE=os.environ.get('SITE_DATA') or os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data')
COVER='https://static.cytron.io/image/cache/tutorial/'

raw=json.load(open('listing_raw.json'))
det=json.load(open('details.json'))
cats=json.load(open('categories.json'))
aud=json.load(open('audience.json'))
tax=json.load(open(f'{OLD}/taxonomy.json'))
articles=json.load(open(f'{OLD}/articles.json'))
products=json.load(open(f'{OLD}/products.json'))

# slug -> [category ids]
slug_cats={}
for cid,slugs in cats.items():
    for s in slugs: slug_cats.setdefault(s,[]).append(int(cid))

# --- prototype overrides (intended taxonomy that the CMS does not hold yet) --------------------------
# A post filed under the key category is NOT shown under the listed categories in the prototype.
# 18 Sep 2026: RDK X5 posts belong only in the RDK X5 section, not in Other Controllers / its children.
EXCLUSIVE={43:[19,20,21,22,23]}
overrides={}
for keep,drop in EXCLUSIVE.items():
    for s,ids in slug_cats.items():
        if keep in ids:
            removed=[i for i in ids if i in drop]
            if removed:
                slug_cats[s]=[i for i in ids if i not in drop]
                overrides[s]={'removed':removed}
                for i in removed: cats[str(i)]=[x for x in cats[str(i)] if x!=s]
json.dump(overrides,open(f'{SITE}/cms-overrides.json','w'),indent=1)
slug_aud={}
for a,slugs in aud.items():
    for s in slugs: slug_aud.setdefault(s,[]).append(a)

# recompute taxonomy counts (parent count = distinct posts in parent or any child, as the live site does)
def count(ids):
    seen=set()
    for i in ids: seen.update(cats.get(str(i),[]))
    return len(seen)
for p in tax['categories']:
    for c in p.get('children',[]): c['count']=count([c['id']])
    p['count']=count([p['id']]+[c['id'] for c in p.get('children',[])])

out=[]
for i,x in enumerate(raw):
    d=x.get('date'); iso=None
    if d:
        try: iso=datetime.strptime(d,'%d %b %Y').strftime('%Y-%m-%d')
        except: pass
    cover=x.get('cover')
    dd=det.get(x['slug'],{})
    hero=dd.get('h')
    if hero and cover and not cover.startswith('http'):
        derived=re.sub(r'-320x180(\.\w+)$',r'\1',COVER.replace('/image/cache/tutorial/','/image/tutorial/')+cover)
        if hero==derived: hero=None
    ex=x.get('excerpt') or ''
    out.append({
      'id':i,'slug':x['slug'],'title':x['title'],'cover':cover,'hero':hero,
      'level':x.get('level'),'type':x.get('type'),'author':x.get('author'),'authorSlug':x.get('authorSlug'),
      'date':d,'iso':iso,'excerpt':(ex.rstrip('.').rstrip()+'…') if ex else '',
      'categories':sorted(slug_cats.get(x['slug'],[])),'audience':slug_aud.get(x['slug'],[]),
      'views':dd.get('v'),'likes':dd.get('l'),'tags':dd.get('t',[]),'words':dd.get('w'),
      'hasBody': x['slug'] in articles
    })
# --- series (the CMS "page tree": a listed parent post with unlisted child pages) -----------------------------
# series_raw.json: {parentSlug|kidSlug: {parent, parentTitle, kids:[{slug,title}], next, prev}} from every article's sidebar
# kids.json:       {kidSlug: {title, author, d, type, level, v, l, id, t, w, h, ex, parent}} from the child pages themselves
series={}
if os.path.exists('series_raw.json') and os.path.exists('kids.json'):
    raw_s=json.load(open('series_raw.json')); kids=json.load(open('kids.json'))
    bys={o['slug']:o for o in out}
    trees={}
    for slug,v in raw_s.items():
        if v.get('parent'): trees.setdefault(v['parent'],v)
    parts=[]
    for pslug,v in trees.items():
        parent=bys.get(pslug)
        if not parent: continue
        order=[pslug]+[k['slug'] for k in v['kids'] if k.get('slug')]
        series[pslug]={'title':parent['title'],'parts':order}
        parent['series']=pslug; parent['part']=0; parent['parts']=len(order)
        for i,k in enumerate(v['kids'],1):
            ks=k.get('slug'); kd=kids.get(ks) or {}
            if not ks or kd.get('missing'): continue
            d=kd.get('d') or parent['date']; iso=None
            if d:
                try: iso=datetime.strptime(d,'%d %b %Y').strftime('%Y-%m-%d')
                except: pass
            hero=kd.get('h') or parent['hero'] or None
            parts.append({'id':1000+len(parts),'slug':ks,'title':kd.get('title') or k['title'],'cover':None,'hero':hero,
              'level':kd.get('level') or parent['level'],'type':kd.get('type') or parent['type'],'author':kd.get('author') or parent['author'],'authorSlug':kd.get('authorSlug') or parent['authorSlug'],
              'date':d,'iso':iso,'excerpt':(kd.get('ex') or '').rstrip('.').rstrip()+('…' if kd.get('ex') else ''),
              'categories':parent['categories'],'audience':parent['audience'],
              'views':kd.get('v'),'likes':kd.get('l'),'tags':kd.get('t') or [],'words':kd.get('w'),'hasBody':False,
              'series':pslug,'part':i,'parts':len(order),'listed':False})
    json.dump(parts,open(f'{SITE}/parts.json','w'),ensure_ascii=False)
    open(f'{SITE}/parts.js','w').write('window.CYTRON_PARTS='+json.dumps(parts,ensure_ascii=False)+';window.CYTRON_SERIES='+json.dumps(series,ensure_ascii=False)+';')
    json.dump(series,open(f'{SITE}/series.json','w'),ensure_ascii=False,indent=1)
    print(len(series),'series;',len(parts),'unlisted part pages')
# --- trending: views gained between two article passes ----------------------------------------------------
# Production should rank by a rolling 30-day view window from the CMS / analytics; the prototype approximates it
# with the difference between the earliest and the latest view snapshots it holds.
TREND_BASE=os.environ.get('TREND_BASE','/home/claude/scrape/details.json'); TREND_FROM=os.environ.get('TREND_FROM','2026-09-15')
TREND_TO=os.environ.get('TREND_TO','2026-09-17')
trend=None
if os.path.exists(TREND_BASE):
    base=json.load(open(TREND_BASE)); n=0
    for o in out:
        b=base.get(o['slug'],{}); bv=b.get('views',b.get('v'))
        if o['views'] is None: o['gain']=None
        elif bv is None: o['gain']=o['views'] if (o['iso'] or '')>=TREND_FROM else None   # published inside the window: all its views count
        else: o['gain']=max(0,o['views']-bv)
        n+=o['gain'] is not None
    days=(datetime.strptime(TREND_TO,'%Y-%m-%d')-datetime.strptime(TREND_FROM,'%Y-%m-%d')).days
    trend={'from':TREND_FROM,'to':TREND_TO,'days':days,'posts':n,'note':'views gained between two article-page snapshots; the live site should use a rolling 30-day window'}
    print('trending window',TREND_FROM,'->',TREND_TO,f'({days} days)',n,'posts with a gain value')
json.dump(out,open(f'{SITE}/tutorials.json','w'),ensure_ascii=False)
open(f'{SITE}/tutorials.js','w').write('window.CYTRON_TUTORIALS='+json.dumps(out,ensure_ascii=False)+';'+(('window.CYTRON_TREND='+json.dumps(trend)+';') if trend else ''))
open(f'{SITE}/taxonomy.js','w').write('window.CYTRON_TAXONOMY='+json.dumps(tax,ensure_ascii=False)+';')
json.dump(tax,open(f'{SITE}/taxonomy.json','w'),ensure_ascii=False,indent=1)
arts={k:{'hero':v['hero'],'body':v['body'],'products':products.get(k,[])} for k,v in articles.items() if not v.get('error')}
open(f'{SITE}/articles.js','w').write('window.CYTRON_ARTICLES='+json.dumps(arts,ensure_ascii=False)+';')
json.dump(arts,open(f'{SITE}/articles.json','w'),ensure_ascii=False)
json.dump(tax,open('taxonomy.json','w'),ensure_ascii=False,indent=1)
print(len(overrides),'prototype overrides (see data/cms-overrides.json);',len(out),'posts;',sum(1 for o in out if o['views'] is not None),'with views;',
      sum(1 for o in out if not o['categories']),'uncategorised;',
      os.path.getsize(f'{SITE}/tutorials.js')//1024,'KB')
