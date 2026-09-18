# Restructure Cytron Tutorial Page

A working prototype for redesigning **https://my.cytron.io/tutorial**.

The live page is mirrored as a static site (`/current`), and three redesign options are built beside it
on the same real data — all **932 tutorials**, their categories, tags and view counts — so they can be
compared page for page and handed to IT as a concrete reference.

- **Option A — `/new`**: hub page with a sticky filter bar and a "browse by platform" shelf; Barlow Condensed + IBM Plex.
- **Option B — `/new-b`**: Random-Nerd-Tutorials model — board chips, featured slider, one row of four posts per platform; plain Helvetica on white.
- **Option C — `/new-c`** *(preferred direction)*: A and B merged — B's board chips, featured + latest hero and per-platform rows, on top of A's instant filter bar, platform tiles, rich cards and article rail; white ground, soft shadows, sentence-case Barlow Condensed headings.

## Open it

- **`index.html`** — compare view: pick any two of Current / A / B / C for the left and right panes,
  switch desktop / tablet / phone, and jump between listing, search, article and category pages.
- `current/index.html` — mirror of today's listing page. `current/tutorial.html?slug=…` — article.
- `new/index.html` — Option A hub. `new/category.html?id=13` — platform page. `new/tutorial.html?slug=…` — article.
- `new-c/index.html` — Option C home. `new-c/category.html?id=13` — platform page (`?q=` search, no `id` for all). `new-c/tutorial.html?slug=…` — article.
- `new-b/index.html` — Option B home. `new-b/category.html?id=13` — platform page (also `?q=` for search, no `id` for all posts). `new-b/tutorial.html?slug=…` — article.

Serve the folder with any static server (or enable GitHub Pages on this repo). Opening `index.html`
directly from disk also works because the data ships as `.js` files.

## Docs

| File | What it is |
|---|---|
| [`docs/tutorial-page-audit.md`](docs/tutorial-page-audit.md) | Current-state audit: page anatomy, full taxonomy, 13 prioritised problems |
| [`docs/redesign-notes.md`](docs/redesign-notes.md) | Option A vs Option B, what each changes and why, design tokens, behaviour to carry into the real build, repo layout |
| [`data/cytron-tutorials-export.xlsx`](data/cytron-tutorials-export.xlsx) | Every tutorial as a spreadsheet (title, description, date, category, views, likes, author, type, level, link, tags) |

## Headline findings

1. **Mobile has no filtering.** The whole search/filter sidebar is `hidden-xs` — phone users can only page through 62 pages.
2. **Mobile header is broken** — nav items overlap the logo and search bar at 375px.
3. **No `<h1>` on the listing page**, and no per-category landing pages — poor SEO surface for 932 posts.
4. **"Sort By" has one option** (Latest), so the front page is always the newest 15 and the archive's depth is invisible.
5. **Categories are named by product, not by task** — and several sub-categories are nearly empty (rero 0, IRIV IOC 0, Teensy 1, Battle Robot 1, ZOOM:BIT 1).

## Data snapshot (17 Sep 2026)

| Platform | Posts | Platform | Posts |
|---|---|---|---|
| Raspberry Pi | 315 | Industry | 93 |
| Arduino Ecosystem | 169 | micro:bit | 89 |
| Wireless & IoT | 158 | Robotics *(now includes the former Robot Kits)* | 89 |
| Other Controllers | 126 | 3D Modelling | 78 |
| Components | 110 | NVIDIA AI | 44 |
| Miscellaneous | 42 | **RDK X5** *(new, 18 Sep)* | 12 |

700 Tutorials · 110 Protips · 74 Projects · 43 Success Stories · 5 Uncategorized. 634 Beginner · 175 Intermediate · 45 Advanced · 78 unrated. 37 posts have no category.

Refreshed 17 Sep 2026 from the live site (first capture 15 Sep 2026): two new posts
(*Build a Robot Sumo 500g R/C with MDDRC5*, *ESP32 IoT Gate using Blynk*), four re-published getting-started
guides, one author correction, 14 category re-assignments (the ESP32 getting-started series moved to Maker ESP32)
and fresh view counts for all 932 articles. On 18 Sep the live taxonomy changed: a new top-level category **RDK X5** (id 43, 12 posts) with its own row,
chip and category page in every option; a new **ZOOM:BIT** sub-category under micro:bit (id 44); and **Robot Kits
merged into Robotics** — Sumo, Soccer, Battle and Line Following Robot are now Robotics sub-categories and the
Robot Kits section is gone (12 platforms).

**Prototype override:** RDK X5 posts are shown only in the RDK X5 section. Three of them are still also filed under
Other Controllers / PIC Microcontroller in the CMS; the prototype hides those memberships (`data/cms-overrides.json`,
rule in `tools/build_data.py`) and the clean-up dashboard flags them for removal. The Excel export reports the CMS as is.

**`data/cytron-tutorials-export.xlsx`** — the same data as a spreadsheet: one row per tutorial with title,
description, publish date, category / sub-category, views, likes, author, type, level, link, tags and audience,
plus Summary and Notes sheets. Bookmark and thumbs-up/down counts are not shown publicly by the site, so those
columns are marked "n/a – not public".

## Status

| Stage | State |
|---|---|
| Current-state audit | Done |
| Data capture (932 posts, categories, tags, views) — refreshed 17 Sep | Done |
| `/current` mirror (listing + article) | Done |
| `/new` Option A (hub, category pages, article) | Done — v1 for review |
| `/new-b` Option B (RNT-style home, category, article) | Done — v1 for review |
| `/new-c` Option C (A + B merged, modern surface) | Done — current preferred direction |
| Category clean-up (separate task) | Review sheet done; awaiting CMS approval |
| Excel export of all tutorials (`data/cytron-tutorials-export.xlsx`) | Done |
| Refine Option C with IT | Next |
