# Cytron Tutorial Page — Current-State Audit

URL: https://my.cytron.io/tutorial
Audited: 15 Sep 2026 (desktop + mobile 375px, via live browser)

---

## 1. What the page is

- `<title>`: "Tutorials for Digital Makers"
- meta description: "Simplified tutorial for electronic and digital making projects"
- Breadcrumb: Home » Tutorials
- **930 posts across 62 pages, 15 per page.**

## 2. Page anatomy

**Global chrome (site-wide, not page-specific)**

- Top strip: Store / Industry / **Education** (audience switcher, Education active)
- Utility icons: settings, country flag (International, Singapore, Malaysia, Thailand, Vietnam), account
- Main bar: Cytron logo · Tutorials · Resource Hubs ▾ · Educational Programs ▾ · Community ▾ · "Search tutorials" box · cart
  - Resource Hubs: EDU:BIT, ZOOM:BIT, REKA:BIT RBT Project Kit, rero:micro, PikaBot, EDU PICO
  - Educational Programs: RAC2026 Competition, EDU:BIT Certification, ZOOM:BIT Certification, EDU PICO Certification
  - Community: micro:bit, Arduino/Maker Boards, Raspberry Pi, 3D Printing, Nvidia Jetson
- Floating widgets bottom-right: support/chat bubbles
- Modal on load: "Welcome! Let's Personalize Your Cytron Experience" → Education / Industry-Enterprise
- Footer: SUPPORT / ABOUT / RESOURCES / FOLLOW US columns + country flags + contact

**Main column (~75% width)**

- Grey bar: "Tutorials" label (left) + "— Sort By —" select (right)
- 3-column card grid
- Numeric pagination: 1 2 3 4 5 6 7 >> >| + "Showing 1 to 15 of 930 (62 Pages)"

**Right sidebar — "Search" panel (`col-sm-3 hidden-xs side-column`)**

1. Keywords text input
2. "All Categories" multi-select (custom checkbox dropdown)
3. "All Post Types / Topics" multi-select
4. "All Skill Levels" `<select name="project_level">`
5. ☑ "Search in tutorial contents" (checked by default)
6. Orange "Search" button

## 3. Card anatomy

Each card shows, top to bottom:

- Skill-level badge overlaid on image (green "Beginner")
- Cover image (custom title-card artwork, e.g. "SMART DASHBOARD WITH MAKER ESP32")
- Title (up to 2 lines)
- Short cyan divider rule
- "Tutorial by {author}" — post type + linked author name
- Date (e.g. 14 Sep 2026)
- Justified 2-line excerpt truncated with "…"

Not shown on cards: category, tags, read time, view count, difficulty beyond the badge.

## 4. Taxonomy (the real information architecture)

**Categories** (two-level, from the multi-select):

| Parent | Children |
|---|---|
| Arduino Ecosystem | — |
| Raspberry Pi | RP2040/PICO |
| micro:bit | Edu:bit, Reka:bit, SUMO:BIT |
| Robot Kits | Battle Robot, Line Following Robot, Soccer Robot, Sumo Robot |
| Robotics | Motor Driver, rero |
| 3D Modelling | — |
| NVIDIA AI | Jetson Orin NX, Jetson Nano |
| Wireless & IoT | LoRa, ESP32, Maker ESP32 |
| Industry | IRIV Pi Control, LoRaWAN, IRIV IOC, IRIV SmartHub, IRIV EdgeAI |
| Components | Sensor, DIY |
| Other Controllers | Teensy, Makers, PIC Microcontroller, Python for MCU |
| Miscellaneous | News, Seminars & Workshop |

**Post Types / Topics:** Tutorial (T), Project (P), Protip (R), Education, Industry
(the listing also surfaces "Success Stories" as a post-type label — not present in this filter)

**Skill Levels:** Beginner, Intermediate, Advanced, Expert

**Sort By:** only one option — "Latest"

## 5. Detail-page template (well structured already)

`/tutorial/{slug}` — e.g. ESP32 Smart Home Dashboard:

- H1 title, then meta row: author · date · post type · skill level · view count (3526)
- Actions: like, bookmark, share
- Right sidebar: Tags only (ESP32, Maker ESP32, Smart Home, IoT, Web Server, DHT11, Arduino)
- Body H2s: Introduction → Disclaimer / Safety Notes → Prerequisites → Objectives → List of Components / BOM → System Diagram & Wiring → Software Setup → Sample Code (+ Key Code Explanation) → Testing & Validation (+ Expected Results) → Demo / Results → Troubleshooting & Extra Tips → **Hardware Components** (product cross-sell)
- ~9,400 characters

This template is consistent and good. The problem is discovery, not the articles.

## 6. Problems found

### Critical

1. **Mobile has no filtering at all.** The entire Search sidebar carries `hidden-xs` — on phones there is no keyword box, no category filter, no post-type filter, no skill-level filter. A mobile user's only option is paging through 62 pages of 15 cards.
2. **Mobile header is broken.** Nav items ("Tutorials", "Resource", "Programs", "Education") overflow and overlap the logo and search bar at 375px.
3. **No H1 on the listing page.** The only H1-level content is a modal H2. Bad for SEO on a 930-post content hub.

### High

4. **930 posts, 62 pages, no way in except sequential paging.** No landing sections, no "browse by board/kit", no featured or popular rows. Pagination jumps only 1–7 then ">>|".
5. **Filters are hidden behind a button.** Nothing is applied until "Search" is clicked; no filter chips, no result count feedback, no URL state, no "clear filters".
6. **"Sort By" has exactly one option ("Latest").** Currently a dead control — no popular/most-viewed/oldest/difficulty sort, even though view counts exist on detail pages.
7. **Category taxonomy is deep and product-named, not task-named.** 12 parents × up to 5 children. A beginner searching "how do I blink an LED" has no entry point; they must already know "Maker ESP32" sits under "Wireless & IoT".

### Medium

8. **Cards waste vertical space** — a large empty block sits under the 2-line excerpt on both desktop and mobile.
9. **Justified text** in excerpts creates ragged inter-word gaps, especially on mobile.
10. **Cards hide their own metadata** — no category or tags on the card, so users can't see or click through to related content from the grid.
11. **Listing front page is monotonous** — all 15 current cards are Beginner ESP32 posts by the same few authors, because the only sort is by date. Depth of the archive is invisible.
12. **Post-type vocabulary is inconsistent** — filter offers Tutorial / Project / Protip / Education / Industry, but cards display "Success Stories".
13. Right sidebar ends early, leaving a large dead white column for most of the scroll.

## 7. What's working (keep)

- Cover-image artwork is strong, branded and consistent — good visual scanning.
- Skill-level badge on the card is genuinely useful.
- Detail-page template (BOM, wiring, safety, troubleshooting, hardware cross-sell) is thorough and consistent.
- Author attribution with linked profiles.
- Taxonomy itself is rich — the raw material for much better navigation already exists.
- 36 of 47 images lazy-load.

## 8. Suggested direction (to discuss)

- Move filters out of the hidden sidebar into a persistent, always-visible filter bar that works at every breakpoint; apply instantly; reflect state in the URL.
- Add a hub-style top section: browse by board/kit (Maker ESP32, micro:bit, Raspberry Pi, REKA:BIT…), by skill level, by project type.
- Add real sort options (popular / most viewed / newest / difficulty).
- Add category + tags to the cards; tighten card height.
- Fix the mobile header overlap.
- Add an H1 and per-category landing pages for SEO across 930 posts.
