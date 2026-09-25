# Restructure Cytron Tutorial Page

A working prototype for redesigning **https://my.cytron.io/tutorial**.

The live page is mirrored as a static site (`/current`), and the redesign (`/new-c`) is built beside it
on the same real data — all **933 tutorials**, their categories, tags and view counts — so the two can be
compared page for page and handed to IT as a concrete reference.

**The redesign — `/new-c`** (kept as "Option C"): board chips under the header, a featured slider + Latest Posts
hero, an instant filter bar (search · level · type · platform · sort, URL-backed, bottom sheet on phones), one row
of four posts per platform, rich cards with Like/Bookmark on hover, and an article layout with a sticky rail
(TOC, hardware list, tags, more in platform). White ground, soft shadows, sentence-case Barlow Condensed headings.

**Education / Industry (23 Sep 2026).** Like the live site, the redesign asks first-time visitors *"What type of
project are you working on?"* — Education, Industry / Enterprise, or continue as guest — once, on the home page. On the
live site that choice only changes the store; here it scopes the tutorial page. **Industry** shows only the posts in the
live site's *Industry* topic (`post_type=industry`, 119 posts today), **arranged by hardware** — an *Industrial Workshops*
showcase band first, a *Success stories* section (the my.cytron.io/success-stories view inside the Industry scope), then the Industry category's sub-categories (IRIV Pi Control, IRIV EdgeAI, IRIV SmartHub, LoRaWAN,
IRIV IOC) as chips and rows, then Raspberry Pi in Industry, then a catch-all row; the slider, Latest Posts, Trending, search and category pages all
work inside that set, and empty sections disappear. **Education** shows only the Education topic (814 posts) — industry posts and the Industry / Raspberry Pi in Industry
platforms are removed from rows, chips, filters and search. Guest shows the whole archive. The choice is
remembered in the browser (and carried between pages even when the files are opened from disk) and can be switched
any time from the Education / Industry toggle in the header. For demos: `new-c/index.html?mode=reset` shows the popup
again, `?mode=industry` / `?mode=education` forces a view.

**Series (24 Sep 2026).** The CMS lets a post carry child pages — a "page tree" shown in the live article sidebar
with Previous / Next — and those child pages are **not in the tutorial listing**. Scanning every article found **85
series with 466 child pages** (e.g. *Getting Started with MDDRC5* → Board Layout → Operation → Firmware & Programming;
*Getting Started with Robo ESP32* has 24 parts). They are captured in `data/parts.js|json` + `data/series.json` and
inherit their parent's categories. The redesign shows a "Series · n parts" badge on parent cards, a *Step-by-step
series* strip on the home page (`category.html?series=1` lists them all), and on every series page an *In this series*
panel with numbered parts plus Part n ‹ › navigation. The `/current` mirror shows the same page tree the live site does.
The Excel export gains Series / Part / In listing columns and 466 extra rows for the child pages.

Two earlier explorations — Option A (hub + filter bar) and Option B (Random-Nerd-Tutorials style) — were merged
into C and removed from the repo on 23 Sep 2026; they remain in the git history (`git log -- new new-b`) and are
described in `docs/redesign-notes.md`.

## Open it

- **`index.html`** — compare view: Current and the redesign side by side, switch desktop / tablet / phone, and
  jump between listing, search, article and category pages.
- `current/index.html` — mirror of today's listing page. `current/tutorial.html?slug=…` — article.
- `new-c/index.html` — redesign home. `new-c/category.html?id=13` — platform page (`?q=` search, no `id` for all). `new-c/tutorial.html?slug=…` — article.
- `dashboard/` — the category clean-up progress board (see its own README).

Serve the folder with any static server (or enable GitHub Pages on this repo). Opening `index.html`
directly from disk also works because the data ships as `.js` files.

## Docs

| File | What it is |
|---|---|
| [`docs/tutorial-page-audit.md`](docs/tutorial-page-audit.md) | Current-state audit: page anatomy, full taxonomy, 13 prioritised problems |
| [`docs/redesign-notes.md`](docs/redesign-notes.md) | What the redesign changes and why, how A and B were merged into it, design tokens, behaviour to carry into the real build, repo layout |
| [`data/cytron-tutorials-export.xlsx`](data/cytron-tutorials-export.xlsx) | Every tutorial as a spreadsheet (title, description, date, category, views, likes, author, type, level, link, tags) |

## Headline findings

1. **Mobile has no filtering.** The whole search/filter sidebar is `hidden-xs` — phone users can only page through 62 pages.
2. **Mobile header is broken** — nav items overlap the logo and search bar at 375px.
3. **No `<h1>` on the listing page**, and no per-category landing pages — poor SEO surface for 933 posts.
4. **"Sort By" has one option** (Latest), so the front page is always the newest 15 and the archive's depth is invisible.
5. **Categories are named by product, not by task** — and several sub-categories are nearly empty (IRIV IOC 0, Battle Robot 1, ZOOM:BIT 1, Raspberry Pi Pico 1, Raspberry Pi Zero 1).

## Data snapshot (23 Sep 2026)

| Platform | Posts | Platform | Posts |
|---|---|---|---|
| Raspberry Pi | 317 | Robotics | 89 |
| Arduino Ecosystem | 170 | 3D Modelling | 78 |
| Wireless & IoT | 160 | Raspberry Pi in Industry *(new)* | 76 |
| Other Controllers | 122 | NVIDIA AI | 44 |
| Components | 110 | Miscellaneous | 41 |
| Industry | 93 | RDK X5 *(new)* | 12 |
| micro:bit | 89 | Artificial Intelligence (AI) *(new)* | 1 |

701 Tutorials · 110 Protips · 74 Projects · 43 Success Stories · 5 Uncategorized. 30 posts have no category.

**933 posts** (first capture 15 Sep 2026: 930). Listing and category membership re-read 23 Sep 2026; view counts
are from the 17 Sep article pass except for the five posts published or re-published since. The live taxonomy
has been reworked in the CMS between 17 and 23 Sep: new top-level **RDK X5**, **Raspberry Pi in Industry** and
**Artificial Intelligence (AI)**; new sub-categories **Raspberry Pi Pico**, **Raspberry Pi Zero**, **RP2040**
(renamed), **ZOOM:BIT** and **Jetson Orin Nano**; **Robot Kits merged into Robotics**; Teensy and rero deleted.
The redesign picks the tree up from `data/taxonomy.json`; the per-platform copy (chip label, ref, blurb) and the
row order live in the `PLATFORM` map and `ORDER` list at the top of `new-c/newc.js`.

**Prototype override:** RDK X5 posts are shown only in the RDK X5 section. Three of them are still also filed under
Other Controllers / PIC Microcontroller in the CMS; the prototype hides those memberships (`data/cms-overrides.json`,
rule in `tools/build_data.py`) and the clean-up dashboard flags them for removal. The Excel export reports the CMS as is.

**`data/cytron-tutorials-export.xlsx`** — the same data as a spreadsheet: one row per tutorial with title,
description, publish date, category / sub-category, views, likes, author, type, level, link, series / part,
tags and audience, plus Summary and Notes sheets (1,399 rows: 933 listed posts + 466 series child pages).
Bookmark and thumbs-up/down counts are not shown publicly by the site and are not exported. The team-editable copy
lives in Google Sheets (`cytron-tutorials-export`, Cytron Drive) — regenerating this file does not touch that sheet.

## Status

| Stage | State |
|---|---|
| Current-state audit | Done |
| Data capture (933 posts + 466 series pages, categories, tags, views) — refreshed 24 Sep | Done |
| `/current` mirror (listing + article) | Done |
| `/new-c` redesign (A + B merged; the only option kept from 23 Sep) | Done — being refined |
| Category clean-up (separate task) | Review sheet done; awaiting CMS approval |
| Excel export of all tutorials (`data/cytron-tutorials-export.xlsx`) | Done |
| Refine `/new-c` with IT | Next |
