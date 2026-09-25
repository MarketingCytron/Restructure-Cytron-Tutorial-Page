/* Shared data helpers for both the /current mirror and the /new redesign.
   Data is loaded from ../data/*.js so the prototype works from file:// as well as a web server. */
(function () {
  const COVER = 'https://static.cytron.io/image/cache/tutorial/';
  const T = (window.CYTRON_TUTORIALS || []).map(t => {
    if (t.cover && !/^https?:/.test(t.cover)) t.cover = COVER + t.cover;
    if (!t.hero && t.cover && t.cover.startsWith(COVER)) t.hero = t.cover.replace('/image/cache/tutorial/', '/image/tutorial/').replace(/-320x180(\.\w+)$/, '$1');
    return t;
  });
  const TAX = window.CYTRON_TAXONOMY || { categories: [], postTypes: [], levels: [] };
  const ARTICLES = window.CYTRON_ARTICLES || {};

  const catById = {};
  TAX.categories.forEach(c => { catById[c.id] = { ...c, parentId: null }; (c.children || []).forEach(ch => { catById[ch.id] = { ...ch, parentId: c.id }; }); });

  // Series: the CMS "page tree" — a listed parent post with unlisted child pages (PARTS). Parts are not in T
  // (they are not in the live listing either) but are addressable by slug and carry their parent's categories.
  const PARTS = (window.CYTRON_PARTS || []).map(t => { if (t.hero && !t.cover) t.cover = t.hero; return t; });
  const SERIES = window.CYTRON_SERIES || {};
  const TREND = window.CYTRON_TREND || null;   // {from,to,days} of the view-gain window behind t.gain (see tools/build_data.py)
  const bySlug = {};
  T.forEach(t => { bySlug[t.slug] = t; });
  PARTS.forEach(t => { bySlug[t.slug] = t; });
  function seriesOf(t) { const key = t && t.series; if (!key || !SERIES[key]) return null; const s = SERIES[key]; return { key, title: s.title, parts: s.parts.map(slug => bySlug[slug]).filter(Boolean) }; }

  const TYPE_CODES = { T: 'Tutorial', P: 'Project', R: 'Protip', S: 'Success Stories', U: 'Uncategorized' };
  const LEVEL_COLORS = { Beginner: '#27ae60', Intermediate: '#f1c40f', Advanced: '#e67e22', Expert: '#c0392b' };

  function qs(name, def) { const v = new URLSearchParams(location.search).get(name); return v === null ? def : v; }
  function qsAll(name) { return new URLSearchParams(location.search).getAll(name).flatMap(v => v.split(',')).filter(Boolean); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtNum(n) { return n == null ? '' : n.toLocaleString('en-US'); }
  function catName(id) { return catById[id] ? catById[id].name : ''; }
  function catPath(id) { const c = catById[id]; if (!c) return ''; return c.parentId ? catById[c.parentId].name + ' › ' + c.name : c.name; }
  function readTime(words) { if (!words) return null; return Math.max(1, Math.round(words / 200)) + ' min read'; }

  /* Filtering used by both versions */
  function filter(opts) {
    opts = opts || {};
    const q = (opts.q || '').trim().toLowerCase();
    const cats = (opts.categories || []).map(Number).filter(Boolean);
    const types = opts.types || [];
    const levels = opts.levels || [];
    const aud = opts.audience || [];
    // include children when a parent is selected
    const catSet = new Set();
    cats.forEach(id => { catSet.add(id); const c = TAX.categories.find(x => x.id === id); if (c) (c.children || []).forEach(ch => catSet.add(ch.id)); });
    return T.filter(t => {
      if (q) {
        const hay = (t.title + ' ' + (t.excerpt || '') + ' ' + (opts.searchTags !== false ? (t.tags || []).join(' ') : '') + ' ' + (t.author || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (catSet.size && !t.categories.some(c => catSet.has(c))) return false;
      if (types.length && !types.includes(t.type)) return false;
      if (levels.length && !levels.includes(t.level || 'Unrated')) return false;
      if (aud.length && !t.audience.some(a => aud.includes(a))) return false;
      return true;
    });
  }

  function sort(list, mode) {
    const l = list.slice();
    switch (mode) {
      case 'popular': return l.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'trending': return l.sort((a, b) => (b.gain || 0) - (a.gain || 0) || (b.views || 0) - (a.views || 0));
      case 'liked': return l.sort((a, b) => (b.likes || 0) - (a.likes || 0) || (b.views || 0) - (a.views || 0));
      case 'oldest': return l.sort((a, b) => (a.iso || '').localeCompare(b.iso || ''));
      case 'az': return l.sort((a, b) => a.title.localeCompare(b.title));
      case 'easy': { const r = { Beginner: 0, Intermediate: 1, Advanced: 2, Expert: 3 }; return l.sort((a, b) => (r[a.level] ?? 9) - (r[b.level] ?? 9) || (b.iso || '').localeCompare(a.iso || '')); }
      case 'latest': default: return l.sort((a, b) => (b.iso || '').localeCompare(a.iso || '') || a.id - b.id); // id order = live-site order
    }
  }

  function paginate(list, page, per) {
    per = per || 15; const pages = Math.max(1, Math.ceil(list.length / per)); page = Math.min(Math.max(1, page || 1), pages);
    return { items: list.slice((page - 1) * per, page * per), page, pages, total: list.length, from: list.length ? (page - 1) * per + 1 : 0, to: Math.min(page * per, list.length), per };
  }

  window.CY = { T, PARTS, SERIES, TREND, seriesOf, TAX, ARTICLES, catById, bySlug, TYPE_CODES, LEVEL_COLORS, qs, qsAll, esc, fmtNum, catName, catPath, readTime, filter, sort, paginate };
})();
