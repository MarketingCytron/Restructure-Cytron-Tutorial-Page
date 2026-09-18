# Tutorial Category Cleanup — dashboard

A progress board for the Cytron tutorial category clean-up: all 932 tutorials, with the category
problems found in the 16 Sep 2026 audit (re-checked against the CMS on 17 Sep), and a place for the
content team to record what they fixed.

Runs as a static site on GitHub Pages. A Google Sheet, exposed through Apps Script, holds the
progress so everyone sees the same board.

---

## Files

| File | What it is | Edit it? |
|---|---|---|
| `index.html` | Page structure | Yes |
| `styles.css` | All styling, light and dark, as CSS custom properties on `:root` | Yes |
| `app.js` | Board logic — filters, rendering, sync | Yes |
| `config.js` | **The only file you must edit.** Backend URL, shared token, poll interval | Yes |
| `data/tutorials.json` | The 932 tutorials and their findings | Regenerated, don't hand-edit |
| `apps-script/Code.gs` | The backend, pasted into Apps Script | Yes |

---

## Setup (about five minutes)

### 1. Create the Sheet and the backend

1. Create a new Google Sheet. Name it something like **Tutorial Cleanup Progress**.
2. **Extensions → Apps Script**. Delete the placeholder `myFunction`.
3. Paste the whole of `apps-script/Code.gs`.
4. Change `var SECRET = 'change-me';` to a word only your team knows.
5. **Deploy → New deployment → Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
6. Authorise when prompted, then copy the web app URL. It ends in `/exec`.

> "Anyone" is required. With "Anyone with a Google account", the browser is redirected to a Google
> sign-in page that a `fetch()` from another domain cannot follow, and the board shows as offline.
> Read **Who can write** below before you accept that.

### 2. Point the dashboard at it

In `config.js`:

```js
apiUrl: "https://script.google.com/macros/s/AKfycb...../exec",
token:  "the same word you put in SECRET",
```

### 3. Publish

Commit this folder into the repo and enable GitHub Pages if it isn't already
(**Settings → Pages → Deploy from a branch**). The board lands at:

```
https://marketingcytron.github.io/Restructure-Cytron-Tutorial-Page/dashboard/
```

Open it. The indicator top-right should read **live**.

### Running it locally

Open `index.html` directly from disk and it will fail to load `data/tutorials.json` — browsers block
`fetch` on `file://`. Serve the folder instead:

```bash
cd dashboard && python3 -m http.server
# then http://localhost:8000/
```

---

## Who can write

Be clear-eyed about this before the team relies on it.

The Apps Script URL and the token both sit in `config.js`, which is public on GitHub Pages. The token
stops a passer-by who stumbles on the URL; it does not stop anyone who views the page source. In
practice that means: **anyone who reads the page can write to the Sheet.**

For an internal progress board this is usually an acceptable trade, because:

- The Sheet keeps full version history (**File → Version history**), so any mess is revertible.
- Nothing confidential is stored — post titles, statuses, and names.
- The URL is not linked from anywhere public.

If that is not acceptable, the options are:

- **Make the repo private.** GitHub Pages on a private repo needs a paid plan, but the source stops
  being public.
- **Move the backend to Firebase or Supabase** and restrict writes by domain or signed-in user.
- **Keep the board on claude.ai**, where only signed-in members of the Cytron organisation can open it.

---

## How it stays in sync

- The board pulls the Sheet every `pollSeconds` (default 15), and only while the tab is visible.
- A change saves about 0.4 s after you stop clicking or typing. A failed save retries every 5 s and
  the indicator says so — nothing is silently lost.
- Each save writes **one row**, so two people working on different tutorials never collide. Two people
  editing the *same* tutorial: the later timestamp wins, and the older write is discarded server-side.
- Apps Script allows roughly 20,000 executions a day on Workspace accounts. At a 15-second poll that
  is about 240 per person per hour, so five people with the board open all day sits inside the quota.
  If you start hitting it, raise `pollSeconds`.

---

## Regenerating the tutorial data

`data/tutorials.json` is the 17 Sep 2026 re-scrape plus the category findings from the 16 Sep audit,
re-checked against what the CMS holds now. After more of the CMS is fixed and the site is re-scraped,
run `tools/build_dashboard.py <old data/tutorials.json> <new data/tutorials.json>` from the repo root
(it reads `data/tutorials.json` of the mirror) and commit the new file — the board picks it up on the
next load. The script keeps every earlier finding, drops suggestions that have since been applied
(noted in `reason` as "✓ applied in CMS since the 15 Sep audit"), and re-flags a category that was
removed although the title or tags still call for it.

Progress is keyed on `id`, the first 10 hex characters of `sha1(slug)`. This survives regeneration
and re-ordering. **A tutorial whose slug changes gets a new id and loses its recorded progress**, so
if slugs are being rewritten, export the CSV first.

### Row format

`data/tutorials.json` is `{generated, source, fields, cats, rows}`. Each row is an array in the order
given by `fields`:

```
id, title, slug, prio, current, add, quest, reason, type, level, date, views, tags
```

`prio` is the priority band: `0` no change needed · `1` uncategorised · `2` missing category ·
`4` review only.

---

## Priority bands

| Band | Count | Meaning |
|---|---|---|
| Uncategorised | 47 | No category at all — invisible in every section of the tutorial page |
| Missing category | 442 | The title or tags name a board the post is not filed under |
| Review only | 37 | An assigned category with no keyword support — skim, don't bulk-action |
| No change needed | 406 | Clean; excluded from the progress meter |

Counts as of the 17 Sep 2026 re-scrape (16 Sep audit: 41 / 437 / 36 / 416).

The suggestions come from keyword rules over each post's title, tags and excerpt. Article bodies were
not read, and 139 posts carry no tags at all. Every row is a candidate for a human decision, not an
instruction.
