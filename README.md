# Restructure Cytron Tutorial Page

A working prototype for redesigning **https://my.cytron.io/tutorial**.

The live page is mirrored as a static site (`/current`), and the proposed redesign is built beside it
(`/new`) on the same real data — all **930 tutorials**, their categories, tags and view counts — so
the two can be compared page for page and handed to IT as a concrete reference.

## Open it

- **`index.html`** — compare view: current vs new, side by side, switchable between desktop / tablet / phone,
  with a page picker (listing, search, article, category).
- `current/index.html` — mirror of today's listing page. `current/tutorial.html?slug=…` — article.
- `new/index.html` — redesigned hub. `new/category.html?id=13` — platform page. `new/tutorial.html?slug=…` — article.

Serve the folder with any static server (or enable GitHub Pages on this repo). Opening `index.html`
directly from disk also works because the data ships as `.js` files.

## Docs

| File | What it is |
|---|---|
| [`docs/tutorial-page-audit.md`](docs/tutorial-page-audit.md) | Current-state audit: page anatomy, full taxonomy, 13 prioritised problems |
| [`docs/redesign-notes.md`](docs/redesign-notes.md) | What `/new` changes and why, the design tokens, behaviour to carry into the real build, repo layout |

## Headline findings

1. **Mobile has no filtering.** The whole search/filter sidebar is `hidden-xs` — phone users can only page through 62 pages.
2. **Mobile header is broken** — nav items overlap the logo and search bar at 375px.
3. **No `<h1>` on the listing page**, and no per-category landing pages — poor SEO surface for 930 posts.
4. **"Sort By" has one option** (Latest), so the front page is always the newest 15 and the archive's depth is invisible.
5. **Categories are named by product, not by task** — and several sub-categories are nearly empty (rero 0, IRIV IOC 0, Teensy 1, Battle Robot 1).

## Data snapshot (15 Sep 2026)

| Platform | Posts | Platform | Posts |
|---|---|---|---|
| Raspberry Pi | 315 | Industry | 93 |
| Arduino Ecosystem | 172 | micro:bit | 89 |
| Wireless & IoT | 157 | 3D Modelling | 78 |
| Other Controllers | 130 | Robotics | 75 |
| Components | 110 | NVIDIA AI | 44 |
| Miscellaneous | 42 | Robot Kits | 34 |

698 Tutorials · 110 Protips · 74 Projects · 43 Success Stories. 633 Beginner · 174 Intermediate · 45 Advanced · 78 unrated.

## Status

| Stage | State |
|---|---|
| Current-state audit | Done |
| Data capture (930 posts, categories, tags, views) | Done |
| `/current` mirror (listing + article) | Done |
| `/new` redesign (hub, category pages, article) | Done — v1 for review |
| Review with IT / iterate | Next |
