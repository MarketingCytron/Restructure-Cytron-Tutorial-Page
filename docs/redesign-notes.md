# Redesign notes — Cytron Tutorial Page

Companion to `tutorial-page-audit.md`. This explains what the `/new` prototype changes, why, and
how the prototype is built so IT can lift the pieces into the live system.

## What's in this repo

```
index.html                 Compare view: current vs new, side by side, desktop / tablet / phone
current/                   Faithful static mirror of my.cytron.io/tutorial (Sep 2026)
  index.html               Listing + sidebar filters + pagination  (?q= &categories= &post_type= &project_level= &page=)
  tutorial.html            Article template                        (?slug=)
new/                       Proposed redesign
  index.html               Hub + results                           (?q= &cat= &type= &level= &aud= &sort= &page=)
  category.html            Platform landing page                   (?id=  [&cat=child-id])
  tutorial.html            Article template                        (?slug=)
  new.css                  Design tokens at the top (:root), then components
shared/data.js             Filtering, sorting, pagination — shared by both versions
data/
  tutorials.js / .json     All 930 posts scraped from the live site (title, slug, cover, author, date,
                           type, level, categories, audience, tags, views, likes, word count, has-video)
  taxonomy.js / .json      Category tree with IDs and counts, post types, levels
  articles.js / .json      Full HTML body + hardware list for 5 sample articles
docs/                      Audit, these notes, screenshots
```

Everything is plain HTML + CSS + vanilla JS with no build step. Open `index.html` from a local
web server or GitHub Pages (data files are plain `.js`, so double-clicking `index.html` also works).

Images are hot-linked from `static.cytron.io`; Google Fonts are used for the new typography.

## Data note

Category membership was captured from the live `/tutorial-search?categories=N` endpoint, so every
count in the prototype is real. 41 posts have no category on the live site. There are no posts
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

## Design system (for IT)

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
