"""Excel export of every tutorial on my.cytron.io/tutorial (from site/data/tutorials.json)."""
import json, sys
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

import os
SITE=os.environ.get('SITE_DATA') or os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data')
OUT=sys.argv[1] if len(sys.argv)>1 else '/home/claude/site/data/cytron-tutorials-export.xlsx'
T=json.load(open(f'{SITE}/tutorials.json'))
TAX=json.load(open(f'{SITE}/taxonomy.json'))
det=json.load(open(os.environ.get('DETAILS') or '/home/claude/scrape2/details.json')) if os.path.exists(os.environ.get('DETAILS') or '/home/claude/scrape2/details.json') else {}
# the spreadsheet reports what the CMS holds, so undo the prototype-only overrides
OVR=json.load(open(f'{SITE}/cms-overrides.json'))
for t in T:
    if t['slug'] in OVR: t['categories']=sorted(set(t['categories'])|set(OVR[t['slug']]['removed']))
SNAP=datetime.now().strftime('%d %b %Y')
# series: parent posts are in the listing; their child pages are not, so they are appended as extra rows
PARTS=json.load(open(f'{SITE}/parts.json')) if __import__('os').path.exists(f'{SITE}/parts.json') else []
SERIES=json.load(open(f'{SITE}/series.json')) if __import__('os').path.exists(f'{SITE}/series.json') else {}
for t in PARTS: t['_part']=True
T=T+PARTS
def series_cols(t):
    if not t.get('series') or t['series'] not in SERIES: return '',''
    return SERIES[t['series']]['title'], f"{t['part']+1} of {t['parts']}"

parent={}; name={}
for p in TAX['categories']:
    name[p['id']]=p['name']
    for c in p.get('children',[]):
        name[c['id']]=c['name']; parent[c['id']]=p['id']

def split_cats(ids):
    parents=[]; subs=[]
    for i in ids:
        if i in parent:
            subs.append(name[i])
            if name[parent[i]] not in parents: parents.append(name[parent[i]])
        else:
            if name.get(i) and name[i] not in parents: parents.append(name[i])
    return ', '.join(parents), ', '.join(subs)

# Bookmark / Thumbs Up / Thumbs Down were dropped on 24 Sep 2026: the site never shows those counters publicly.
HEAD=['Tutorial','Description','Publish Date','Category','Views','Like',
      'Authors','Type','Level','Sub-category','Link','Series','Part','In listing','Tags','Audience','Post ID','Word count']

wb=Workbook()
ws=wb.active; ws.title='Tutorials'
ws.append(HEAD)
for t in T:
    cat,sub=split_cats(t['categories'])
    d=det.get(t['slug'],{})
    pub=datetime.strptime(t['iso'],'%Y-%m-%d') if t.get('iso') else None
    ws.append([
        t['title'],
        (t.get('excerpt') or '').replace('…','...'),
        pub,
        cat,
        t.get('views'),
        t.get('likes'),
        t.get('author') or '',
        t.get('type') or '',
        t.get('level') or '',
        sub,
        f"https://my.cytron.io/tutorial/{t['slug']}",
        *series_cols(t),
        'No – series page' if t.get('_part') else 'Yes',
        ', '.join(t.get('tags') or []),
        ', '.join(a.capitalize() for a in (t.get('audience') or [])),
        d.get('id'),
        t.get('words'),
    ])
n=len(T)+1
# styling
hdr_fill=PatternFill('solid',fgColor='10233A'); white=Font(name='Arial',bold=True,color='FFFFFF',size=10)
thin=Side(style='thin',color='DCE4EA')
for c in ws[1]:
    c.font=white; c.fill=hdr_fill; c.alignment=Alignment(vertical='center',wrap_text=True)
for row in ws.iter_rows(min_row=2,max_row=n):
    for c in row:
        c.font=Font(name='Arial',size=10); c.border=Border(bottom=thin)
        c.alignment=Alignment(vertical='top',wrap_text=(c.column in (1,2,12,15)))
    row[2].number_format='DD MMM YYYY'
    row[4].number_format='#,##0'; row[5].number_format='#,##0'
    row[10].hyperlink=row[10].value; row[10].font=Font(name='Arial',size=10,color='087FA8',underline='single')
widths=[46,60,13,22,9,7,24,14,12,24,58,34,9,14,40,20,8,10]
for i,w in enumerate(widths,1): ws.column_dimensions[get_column_letter(i)].width=w
ws.row_dimensions[1].height=30
ws.freeze_panes='B2'
ws.auto_filter.ref=f"A1:{get_column_letter(len(HEAD))}{n}"

# --- Summary sheet ---
s=wb.create_sheet('Summary')
bold=Font(name='Arial',bold=True,size=10); norm=Font(name='Arial',size=10)
def put(r,c,v,f=norm):
    cell=s.cell(row=r,column=c,value=v); cell.font=f; return cell
put(1,1,'Cytron Tutorials export',Font(name='Arial',bold=True,size=14))
put(2,1,f'Snapshot of https://my.cytron.io/tutorial taken {SNAP} — {len(T)-len(PARTS)} listed posts + {len(PARTS)} series pages not in the listing = {len(T)} rows.')
r=4
put(r,1,'Posts by type',bold); r+=1
from collections import Counter
for k,v in Counter(t['type'] or '(none)' for t in T).most_common(): put(r,1,k); put(r,2,v); r+=1
r+=1; put(r,1,'Posts by level',bold); r+=1
for k,v in Counter(t['level'] or '(not set)' for t in T).most_common(): put(r,1,k); put(r,2,v); r+=1
r+=1; put(r,1,'Posts by category (parent; a post can sit in several)',bold); r+=1
for p in sorted(TAX['categories'],key=lambda p:-p['count']):
    put(r,1,p['name']); put(r,2,p['count']); r+=1
    for c in sorted(p.get('children',[]),key=lambda c:-c['count']):
        put(r,1,'    '+c['name']); put(r,2,c['count']); r+=1
put(r,1,'(no category)'); put(r,2,sum(1 for t in T if not t['categories'])); r+=2
put(r,1,'Top 10 authors',bold); r+=1
for k,v in Counter(t['author'] or '(none)' for t in T).most_common(10): put(r,1,k); put(r,2,v); r+=1
r+=1; put(r,1,'Totals',bold); r+=1
put(r,1,'Total views'); put(r,2,sum(t['views'] or 0 for t in T)); s.cell(row=r,column=2).number_format='#,##0'; r+=1
put(r,1,'Total likes'); put(r,2,sum(t['likes'] or 0 for t in T)); r+=1
s.column_dimensions['A'].width=48; s.column_dimensions['B'].width=12

# --- Notes sheet ---
nt=wb.create_sheet('Notes')
notes=[
 ('Source',f'Every row was read from the public pages of https://my.cytron.io on {SNAP}: the listing (/tutorial?page=N), each article page (/tutorial/slug) and the category search (/tutorial-search?categories=ID).'),
 ('Tutorial','Post title as shown on the card and article H1.'),
 ('Description','The short description shown on the listing card (the site truncates it with "..."). The full article body is not exported.'),
 ('Publish Date','"Published Date" from the article meta row. Sort/filter works as a real Excel date.'),
 ('Category / Sub-category','The site has a two-level taxonomy. "Category" lists the parent(s) (e.g. Wireless & IoT); "Sub-category" lists the child(ren) (e.g. ESP32, Maker ESP32). A post can belong to several. Blank = the post has no category assigned on the live site.'),
 ('Views','"View Count" from the article meta row at the time of the snapshot.'),
 ('Like','Public like counter shown next to the Like button on the article page.'),
 ('Bookmark / Thumbs Up / Thumbs Down','Not included (removed 24 Sep 2026). The buttons exist on every article but the site never displays these counters to visitors, so they cannot be read from the public pages. IT can export them from the eblog tables (bookmark / vote-helpful) if ever needed.'),
 ('Authors','Author name from the article meta row / card ("Tutorial by …").'),
 ('Type','Post type: Tutorial, Project, Protip, Success Stories, Uncategorized.'),
 ('Level','Project level badge: Beginner, Intermediate, Advanced (no post is tagged Expert; blank = not set).'),
 ('Link','Direct URL of the article.'),
 ('Series / Part / In listing','The CMS lets a post carry child pages (shown as a "page tree" in the article sidebar with Previous/Next). The parent is a normal listed tutorial; its child pages are NOT in the tutorial listing and are only reachable from the parent. "Series" is the parent title, "Part" the position (parent = 1), "In listing" says whether the row is a listed post (Yes) or a child page (No – series page). Child pages inherit the parent\'s categories in this sheet.'),
 ('Tags / Audience / Post ID / Word count','Extra columns not requested but captured while scraping: tags from the article sidebar, Education/Industry audience flag from the post_type filter, the internal post id, and an approximate body word count.'),
 ('Assumption','The requested column list contained "Category" twice; it is interpreted as parent Category (column D) and Sub-category (column J).'),
]
put=lambda r,c,v,f=norm: (lambda cell: (setattr(cell,'font',f), setattr(cell,'alignment',Alignment(wrap_text=True,vertical='top')), cell)[-1])(nt.cell(row=r,column=c,value=v))
put(1,1,'Field',bold); put(1,2,'Meaning / how it was collected',bold)
for i,(k,v) in enumerate(notes,2): put(i,1,k,bold); put(i,2,v)
nt.column_dimensions['A'].width=34; nt.column_dimensions['B'].width=110

wb.save(OUT)
print('wrote',OUT,len(T),'rows')
