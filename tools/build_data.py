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
SITE='/home/claude/site/data'
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
json.dump(out,open(f'{SITE}/tutorials.json','w'),ensure_ascii=False)
open(f'{SITE}/tutorials.js','w').write('window.CYTRON_TUTORIALS='+json.dumps(out,ensure_ascii=False)+';')
open(f'{SITE}/taxonomy.js','w').write('window.CYTRON_TAXONOMY='+json.dumps(tax,ensure_ascii=False)+';')
json.dump(tax,open(f'{SITE}/taxonomy.json','w'),ensure_ascii=False,indent=1)
arts={k:{'hero':v['hero'],'body':v['body'],'products':products.get(k,[])} for k,v in articles.items() if not v.get('error')}
open(f'{SITE}/articles.js','w').write('window.CYTRON_ARTICLES='+json.dumps(arts,ensure_ascii=False)+';')
json.dump(arts,open(f'{SITE}/articles.json','w'),ensure_ascii=False)
json.dump(tax,open('taxonomy.json','w'),ensure_ascii=False,indent=1)
print(len(out),'posts;',sum(1 for o in out if o['views'] is not None),'with views;',
      sum(1 for o in out if not o['categories']),'uncategorised;',
      os.path.getsize(f'{SITE}/tutorials.js')//1024,'KB')
