# Redesign notes — Cytron Tutorial Page

Companion to `tutorial-page-audit.md`. This explains what the two redesign prototypes change, why,
and how they are built so IT can lift the pieces into the live system.

There are **two options**, built on the same data and the same shared filtering code:

| | Option A — `/new` | Option B — `/new-b` |
|---|---|---|
| Model | Hub page: hero, sticky filter bar, "browse by platform" shelf, one big filterable grid | Random-Nerd-Tutorials model: board chips under the header, featured slider + latest list, then one 4-card row **per platform** with "View All" |
| Look | Cytron cyan/orange on a cool grey ground; Barlow Condensed headings, IBM Plex body | Plain Helvetica 18px on white, dark navy header bar, one link colour (Cytron cyan, darkened) |
| Discovery | Filter first: level / type / platform apply instantly | Scan first: every platform visible on the homepage; filters live on the category page |
| Category page | Dark hero, sub-category chips, filter bar, grid | Title + toolbar (search · level · type · sort · sub-chips), 3-col grid, right sidebar (most viewed, browse by board) |
| Article | Article card + sticky rail (TOC, hardware, tags) | Wide article + sidebar (parts used, latest, more in platform) + related row |
| Best for | Visitors who know what they want and want to narrow fast | Visitors browsing by board — mirrors how most maker sites are organised, so it feels familiar |

Both fix every problem in the audit table below; they differ in *how* the archive is presented,
not in *whether* the fixes are present.

### Option C — `/new-c` — the merge (current preferred direction)

After reviewing A and B side by side, the decision was to combine them. Option C takes:

| From A | From B | New in C |
|---|---|---|
| Sticky filter bar (search · level · type · platform · sort), instant apply, removable chips, URL state, bottom sheet on phones | Board chip row under the header (with counts) | White ground `#F7F9FB`, 16px radii, layered shadows instead of hard borders |
| Platform tile grid with live counts and sub-category chips (lightened: white tiles, cyan edge) | Featured guide + Latest list hero | Translucent sticky header; chips and controls as pills |
| Rich card: type · platform › sub · title · excerpt · author · date · views · read time | One row of four per platform with "View all n →" (top 6 platforms on the home page; the rest via tiles) | Sentence-case Barlow Condensed headings (A used all-caps) |
| Article layout with sticky rail: on-page TOC, hardware list, tags | Category page sidebar (most viewed here, browse by platform) and article rail extras (more in platform) | Kits & programs band restyled as a navy panel with a cyan glow |
| "Most viewed" strip (now ranked 1–5) | Light category hero with sub-category pills | Hover lift on cards/tiles; `prefers-reduced-motion` respected |

Behaviour: the home page collapses to a results grid as soon as any filter or search is active (hero,
tiles and rows hide), and returns when filters are cleared — so the same URL serves both browsing and
searching. Category pages carry the same filter bar scoped to that platform, with sub-category pills
that write `&cat=` to the URL.

## What's in this repo

```
index.html                 Compare view: any two of current / A / B / C side by side, desktop / tablet / phone
current/                   Faithful static mirror of my.cytron.io/tutorial (Sep 2026)
  index.html               Listing + sidebar filters + pagination  (?q= &categories= &post_type= &project_level= &page=)
  tutorial.html            Article template                        (?slug=)
new/                       Option A (hub + filter bar)
  index.html               Hub + results                           (?q= &cat= &type= &level= &aud= &sort= &page=)
  category.html            Platform landing page                   (?id=  [&cat=child-id])
  tutorial.html            Article template                        (?slug=)
  new.css                  Design tokens at the top (:root), then components
new-c/                     Option C — A + B merged (preferred)
  index.html               Chips, featured + latest, filter bar, tiles, most viewed, 6 platform rows, kits band
  category.html            Platform / search / all listing with sidebar  (?id= [&cat=] [&q=] [&level=] [&type=] [&aud=] [&sort=] [&page=])
  tutorial.html            Article + rail (TOC, hardware, tags, more in platform) + related row
  newc.css                 Tokens in :root — the design system to hand to IT
new-b/                     Option B (Random-Nerd-Tutorials style)
  index.html               Board chips, featured slider, Latest Posts, 12 platform rows
  category.html            Platform / search / all-posts listing   (?id= [&cat=] [&q=] [&level=] [&type=] [&sort=] [&page=])
  tutorial.html            Article template                         (?slug=)
  newb.css                 Tokens in :root; plain type scale
shared/data.js             Filtering, sorting, pagination — shared by both versions
data/
  tutorials.js / .json     All 932 posts scraped from the live site (title, slug, cover, author, date,
                           type, level, categories, audience, tags, views, likes, word count, has-video)
  taxonomy.js / .json      Category tree with IDs and counts, post types, levels
  articles.js / .json      Full HTML body + hardware list for 5 sample articles
  cytron-tutorials-export.xlsx  Spreadsheet export of every post (Tutorials · Summary · Notes sheets)
docs/                      Audit and these notes
```

Everything is plain HTML + CSS + vanilla JS with no build step. Open `index.html` from a local
web server or GitHub Pages (data files are plain `.js`, so double-clicking `index.html` also works).

Images are hot-linked from `static.cytron.io`; Google Fonts are used for the new typography.

## Data note

Category membership was captured from the live `/tutorial-search?categories=N` endpoint, so every
count in the prototype is real (refreshed 17 Sep 2026). 47 posts have no category on the live site. There are no posts
tagged "Expert"; 78 have no skill level.

Only five articles carry their full body text (one per template variant). Every other article
page shows the real metadata and links back to the original.

## The problems the redesign fixes (from the audit)

| # | Problem on the live page | What `/new` does |
|---|---|---|
| 1 | Filter sidebar is `hidden-xs` — **phones have no search or filters** | Filter bar is sticky and present at every width. On phones it collapses to search + a **Filters** bottom sheet. |
| 2 | Mobile header overlaps the logo | Header collapses to a hamburger with search inside; no overflow. |
| 3 | No `<h1>` on the listing | `<h1>Tutorials for digital makers</h1>`, per-platform `<h1>` on category pages. |
| 4 | 930 posts, 62 pages, sequential paging is the only route in | **Browse by platform** shelf with live counts; category landing pages; sub-category chips. |
| 5 | Filters apply only after clicking "Search"; no chips, no URL state | Filters apply instantly, show as removable chips with a result count, and are reflected in the URL (shareable, back-button safe). |
| 6 | "Sort By" has one option | Latest · Most viewed · Most liked · Easiest first · Oldest · A–Z. View counts come from the article pages. |
| 7 | Categories are product-named and deep | Platform tiles carry short blurbs and surface the sub-categories that have ≥3 posts; near-empty ones (rero 0, IRIV IOC 0, Teensy 1, Battle Robot 1) are folded away instead of listed. |
| 8 | Fixed 430px card with empty space | Card height follows content; 2-line excerpt clamp keeps rows even. |
| 9 | Justified text | Left-aligned throughout, including inside article bodies. |
| 10 | Cards show no category/tags | Card shows type, platform › sub-category (linked), views and read time. |
| 11 | Front page is 15 same-day ESP32 posts | Hub + "Most viewed" strip show the depth of the archive before the latest grid. |
| 12 | "Success Stories" not in the type filter | Added as a type. |
| 13 | Dead sidebar column on scroll | No sidebar on listing pages; article pages get a sticky rail with on-page TOC, hardware list, tags. |

## Option B specifics

- **Board chips** (`CHIPS` in `newb.js`): the 11 platforms with meaningful volume, in archive-size order, plus Home and All.
  Miscellaneous is not a chip; it appears as the last homepage row ("News & Events").
- **Featured slider**: the five most-viewed posts whose title contains "Getting Started" / "Beginner's guide" / "Introduction to" — RNT leads
  with getting-started guides, and Cytron has plenty. Auto-advances every 6s, stops under `prefers-reduced-motion`.
- **Latest Posts**: newest five across the archive.
- **Platform rows**: 4 latest posts per platform, sub-categories with ≥3 posts listed under the heading, "View All *n* »" to the category page.
  Twelve rows is long, but that *is* the RNT pattern — the page is meant to be scanned, not read.
- **Resources band**: the six kit hubs and four programs — the equivalent of RNT's courses/eBooks block.
- **Category page** carries the audit's mobile fix: the toolbar (search, level, type, sort) is always present, so phones can filter.
- **Typography**: Helvetica/Arial only, 18px/27px body, 36px section headings at weight 600 — matched to RNT's measured values.
  Links use `#087FA8` (Cytron cyan darkened to pass 4.5:1 on white); brand cyan `#0DA9DD` is the hover.

## Design system — Option A (for IT)

Defined once in `new/new.css` under `:root`:

- **Colour** — `--ink #10233A` (deep navy text; cooler than the current #333 and pairs with the brand cyan),
  `--cyan #0DA9DD` (brand primary, unchanged), `--orange #FF5516` (brand accent — reserved for the primary
  action), `--paper #F5F8FA` page ground, `--line #DCE4EA`. Level colours stay semantic
  (green / amber / orange) and gain an Expert red.
- **Type** — *Barlow Condensed 700* for headings (echoes the condensed caps already used on Cytron cover
  art), *IBM Plex Sans* for body, *IBM Plex Mono* for counts, refs and meta. All Google Fonts, all with
  system fallbacks.
- **Signature element** — the "board shelf": platform tiles styled like PCB silkscreen labels (navy
  board, thin cyan keep-out border, three-letter ref, condensed name, mono count). It is the only
  decorative risk on the page; everything else stays quiet.
- **Radii / shadow** — 12px cards, 8px controls, one soft shadow token.
- Keyboard focus is visible everywhere; `prefers-reduced-motion` disables transitions.

## Behaviour worth carrying into the real build

- Search matches title, excerpt, tags and author; 220ms debounce.
- Selecting a parent category includes its children.
- Pagination shows 18 per page with a 1 … n window; `page` is in the URL.
- Category pages are the SEO surface: one URL per platform (`/category?id=13`, which in production
  would be `/tutorial/wireless-iot`), with sub-category filters that keep the URL shareable.
- Article page: TOC generated from `<h2>`s; hardware list rendered from structured product data
  (name, image, price, qty, stock); "More in {platform}" pulls the three most-viewed in the same platform.

## Not in scope of the prototype

Login, bookmarking, likes, cart, the personalisation modal and the store header dropdowns are
static placeholders. Author pages and tag pages link to a search instead.
