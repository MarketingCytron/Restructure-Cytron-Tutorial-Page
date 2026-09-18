/* /new — Cytron Tutorials redesign. Static, client-rendered from ../data/*.js.
   Pages: index.html (hub + results), category.html?id=N, tutorial.html?slug=S */
(function () {
  const { T, TAX, ARTICLES, esc, qs, qsAll, catById, bySlug, filter, sort, paginate, fmtNum, readTime } = window.CY;
  const ROOT = document.documentElement.getAttribute('data-root') || '.';
  const PER = 18;
  const LIVE = 'https://my.cytron.io';

  /* Platform copy + silkscreen-style refs (abbreviations, not sequence numbers) */
  const PLATFORM = {
    1: { ref: 'ARD', blurb: 'Arduino boards, Maker UNO, Maker Nano and the classic getting-started projects.' },
    2: { ref: 'RPI', blurb: 'Raspberry Pi single-board computers, Pico microcontrollers, cameras, HATs and edge AI.' },
    4: { ref: 'MBT', blurb: 'micro:bit and Cytron’s classroom kits — EDU:BIT, ZOOM:BIT, REKA:BIT and SUMO:BIT.' },
    7: { ref: 'ROB', blurb: 'Motor drivers, sumo, soccer, line-following and battle robots — the mechanics of making things move.' },
    10: { ref: '3DM', blurb: '3D modelling and printing: designing enclosures, mounts and parts.' },
    11: { ref: 'NVA', blurb: 'NVIDIA Jetson Nano and Orin NX — computer vision and AI at the edge.' },
    13: { ref: 'IOT', blurb: 'Wireless and IoT: ESP32, Maker ESP32, LoRa, MQTT dashboards and cloud services.' },
    28: { ref: 'IND', blurb: 'Industrial controllers from the IRIV family, LoRaWAN and factory-floor monitoring.' },
    16: { ref: 'CMP', blurb: 'Sensors, modules and DIY electronics fundamentals.' },
    19: { ref: 'MCU', blurb: 'Other controllers: Maker boards, Teensy, PIC and Python for microcontrollers.' },
    43: { ref: 'RDK', blurb: 'D-Robotics RDK X5 AI board — ROS, computer vision and edge-AI robot builds.' },
    24: { ref: 'MSC', blurb: 'News, seminars and workshops.' }
  };
  const TYPE_LABEL = { Tutorial: 'Tutorial', Project: 'Project', Protip: 'Protip', 'Success Stories': 'Success story', Uncategorized: 'Post' };
  const SORTS = [['latest', 'Latest'], ['popular', 'Most viewed'], ['liked', 'Most liked'], ['easy', 'Easiest first'], ['oldest', 'Oldest'], ['az', 'A – Z']];
  const HAS_VIEWS = T.some(t => t.views != null);

  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    cart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    burger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5h18M6 12h12M10 19h4"/></svg>'
  };

  /* ---------- state ---------- */
  function readState(fixed) {
    const s = {
      q: qs('q', ''),
      cats: qsAll('cat').map(Number).filter(Boolean),
      types: qsAll('type'),
      levels: qsAll('level'),
      aud: qsAll('aud'),
      sort: qs('sort', 'latest'),
      page: parseInt(qs('page', '1'), 10) || 1
    };
    return Object.assign(s, fixed || {});
  }
  function toQuery(s, page) {
    const p = new URLSearchParams();
    if (s.q) p.set('q', s.q);
    if (s.cats.length && !s.fixedCat) p.set('cat', s.cats.join(','));
    if (s.types.length) p.set('type', s.types.join(','));
    if (s.levels.length) p.set('level', s.levels.join(','));
    if (s.aud.length) p.set('aud', s.aud.join(','));
    if (s.sort && s.sort !== 'latest') p.set('sort', s.sort);
    const pg = page == null ? s.page : page; if (pg > 1) p.set('page', pg);
    if (s.fixedCat) p.set('id', s.fixedCat);
    return p.toString();
  }
  function isFiltering(s) { return !!(s.q || (s.cats.length && !s.fixedCat) || s.types.length || s.levels.length || s.aud.length); }
  function run(s) {
    const list = filter({ q: s.q, categories: s.cats, types: s.types, levels: s.levels, audience: s.aud });
    return sort(list, s.sort);
  }
  function countIn(list, pred) { return list.reduce((n, t) => n + (pred(t) ? 1 : 0), 0); }

  /* ---------- chrome ---------- */
  function header(active) {
    const dd = (label, items) => `<details><summary>${label}</summary><div>${items.map(x => `<a href="#" onclick="return false">${x}</a>`).join('')}</div></details>`;
    return `
<div class="top-strip"><div class="wrap">
  <nav><a href="${LIVE}/">Store</a><a href="${LIVE}/raspberry-pi-for-industry">Industry</a><a class="on" href="${ROOT}/index.html">Education</a></nav>
  <div class="util"><span class="txt">Ship to</span><img src="https://static.cytron.io/image/catalog/flags/malaysia.png" alt="Malaysia"><span class="txt">Malaysia</span>${I.user}</div>
</div></div>
<header class="site-head"><div class="wrap">
  <a class="logo" href="${ROOT}/index.html"><img src="https://static.cytron.io/image/catalog/logo/cytron-technologies-200x100.png" alt="Cytron Technologies"></a>
  <nav class="main" aria-label="Primary">
    <a class="${active === 'tutorials' ? 'on' : ''}" href="${ROOT}/index.html">Tutorials</a>
    ${dd('Resource Hubs', ['EDU:BIT', 'ZOOM:BIT', 'REKA:BIT RBT Project Kit', 'rero:micro', 'PikaBot', 'EDU PICO'])}
    ${dd('Educational Programs', ['RAC2026 Competition', 'EDU:BIT Certification Program', 'ZOOM:BIT Certification Program', 'EDU PICO Certification Program'])}
    ${dd('Community', ['micro:bit', 'Arduino/Maker Boards', 'Raspberry Pi', '3D Printing', 'Nvidia Jetson'])}
  </nav>
  <form class="search" action="${ROOT}/index.html" method="get" role="search"><input type="search" name="q" placeholder="Search 932 tutorials" aria-label="Search tutorials" value="${esc(qs('q', ''))}"><button type="submit" aria-label="Search">${I.search}</button></form>
  <a class="cart" href="${LIVE}/" aria-label="Cart">${I.cart}</a>
  <button class="burger" aria-label="Menu" aria-expanded="false" data-burger>${I.burger}</button>
  <details class="mobile-nav" data-mnav>
    <summary class="sr-only">Menu</summary>
    <form class="msearch" action="${ROOT}/index.html" method="get" role="search"><input type="search" name="q" placeholder="Search tutorials" aria-label="Search tutorials"><button type="submit" aria-label="Search">${I.search}</button></form>
    <a href="${ROOT}/index.html">Tutorials</a><a href="#" onclick="return false">Resource Hubs</a><a href="#" onclick="return false">Educational Programs</a><a href="#" onclick="return false">Community</a><a href="${LIVE}/">Store</a>
  </details>
</div></header>`;
  }
  function footer() {
    const col = (h, ls) => `<div><h3>${h}</h3><ul>${ls.map(l => `<li><a href="#" onclick="return false">${l}</a></li>`).join('')}</ul></div>`;
    return `
<footer><div class="wrap">
  <div class="cols">
    <div class="brand"><img src="https://static.cytron.io/image/catalog/logo/cytron-technologies-200x100.png" alt="Cytron"><p>Simplified tutorials for electronic and digital making — from your first blink to edge AI.</p></div>
    ${col('Support', ['Warranty / Return', 'Request for Quotation', 'Register as Teacher', 'Register as Student', 'Contact Us'])}
    ${col('About', ['About Us', 'Delivery Information', 'Return Policy', 'Cytron Membership', 'Careers at Cytron'])}
    ${col('Resources', ['Training Partners', 'Discontinued Items', 'FAQs', 'How to shop at Cytron'])}
    ${col('Follow', ['Facebook', 'YouTube', 'Telegram', 'GitHub', 'Instagram', 'TikTok'])}
  </div>
  <div class="base"><span>© 2004 – 2026 Cytron Technologies Sdn Bhd (200601035804)</span><span><a href="mailto:sales@cytron.io">sales@cytron.io</a> · WhatsApp +604-548 0668</span></div>
</div></footer>`;
  }
  function wireHeader() {
    const b = document.querySelector('[data-burger]'), m = document.querySelector('[data-mnav]');
    if (b && m) b.addEventListener('click', () => { m.open = !m.open; b.setAttribute('aria-expanded', String(m.open)); });
    document.addEventListener('click', e => { document.querySelectorAll('nav.main details[open], .fsel[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }); });
  }

  /* ---------- cards ---------- */
  function primaryCat(t) { const c = t.categories.find(id => catById[id] && catById[id].parentId) || t.categories[0]; return c ? catById[c] : null; }
  function card(t) {
    const href = `${ROOT}/tutorial.html?slug=${encodeURIComponent(t.slug)}`;
    const pc = primaryCat(t);
    const nums = [t.views != null ? `${fmtNum(t.views)} views` : '', t.words ? readTime(t.words) : ''].filter(Boolean);
    return `
<article class="card">
  <a class="cover" href="${href}" tabindex="-1" aria-hidden="true">${t.cover ? `<img loading="lazy" src="${esc(t.cover)}" alt="">` : ''}${t.level ? `<span class="lvl ${t.level}">${esc(t.level)}</span>` : ''}${t.video ? '<span class="video">▶ video</span>' : ''}</a>
  <div class="body">
    <div class="kind"><span class="type">${esc(TYPE_LABEL[t.type] || t.type || 'Post')}</span>${pc ? `<a class="cat" href="${ROOT}/category.html?id=${pc.parentId || pc.id}${pc.parentId ? '&cat=' + pc.id : ''}">${esc(pc.parentId ? catById[pc.parentId].name + ' · ' + pc.name : pc.name)}</a>` : ''}</div>
    <h3><a href="${href}">${esc(t.title)}</a></h3>
    <p class="ex">${esc(t.excerpt || '')}</p>
    <div class="meta"><span><b>${esc(t.author || '')}</b> · ${esc(t.date || '')}</span><span class="nums">${nums.map(esc).join('<span aria-hidden="true">·</span>')}</span></div>
  </div>
</article>`;
  }
  function mini(t) {
    return `<a class="mini" href="${ROOT}/tutorial.html?slug=${encodeURIComponent(t.slug)}">${t.cover ? `<img loading="lazy" src="${esc(t.cover)}" alt="">` : ''}<span class="t">${esc(t.title)}</span><span class="v">${fmtNum(t.views)} views · ${esc(t.level || '')}</span></a>`;
  }

  /* ---------- filter bar ---------- */
  function filterbar(s, list, opts) {
    opts = opts || {};
    const all = filter({}); // for counts
    const catCounts = id => countIn(all, t => t.categories.includes(id));
    const cats = TAX.categories.filter(c => !s.fixedCat || c.id === s.fixedCat).map(c => {
      const kids = (c.children || []).filter(ch => catCounts(ch.id) > 0);
      return (s.fixedCat ? '' : `<label><input type="checkbox" name="cat" value="${c.id}" ${s.cats.includes(c.id) ? 'checked' : ''}> ${esc(c.name)}<span class="cnt">${catCounts(c.id)}</span></label>`) +
        kids.map(ch => `<label class="${s.fixedCat ? '' : 'child'}"><input type="checkbox" name="cat" value="${ch.id}" ${s.cats.includes(ch.id) ? 'checked' : ''}> ${esc(ch.name)}<span class="cnt">${catCounts(ch.id)}</span></label>`).join('');
    }).join('');
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Unrated'].map(l => `<label><input type="checkbox" name="level" value="${l}" ${s.levels.includes(l) ? 'checked' : ''}><span class="dot" style="background:var(--lvl-${l === 'Unrated' ? 'none' : l.toLowerCase()})"></span>${l}<span class="cnt">${countIn(all, t => (t.level || 'Unrated') === l)}</span></label>`).join('');
    const types = ['Tutorial', 'Project', 'Protip', 'Success Stories'].map(ty => `<label><input type="checkbox" name="type" value="${ty}" ${s.types.includes(ty) ? 'checked' : ''}> ${TYPE_LABEL[ty]}<span class="cnt">${countIn(all, t => t.type === ty)}</span></label>`).join('') +
      `<hr style="border:0;border-top:1px solid var(--line-2);margin:6px 0">` +
      ['education', 'industry'].map(a => `<label><input type="checkbox" name="aud" value="${a}" ${s.aud.includes(a) ? 'checked' : ''}> For ${a}<span class="cnt">${countIn(all, t => t.audience.includes(a))}</span></label>`).join('');
    const n = k => s[k].length ? `<span class="n">${s[k].length}</span>` : '';
    const active = s.levels.length + s.types.length + s.aud.length + (s.fixedCat ? 0 : s.cats.length);
    return `
<div class="filterbar" data-filterbar><div class="wrap">
  <label class="q"><span class="sr-only">Search</span><input type="search" name="q" placeholder="${s.fixedCat ? 'Search in ' + esc(catById[s.fixedCat].name) : 'Search by title, tag or author'}" value="${esc(s.q)}" data-q>${I.search}</label>
  <details class="fsel"><summary>Level ${n('levels')}</summary><div>${levels}</div></details>
  <details class="fsel"><summary>Type ${n('types')}</summary><div>${types}</div></details>
  ${opts.hideCat ? '' : `<details class="fsel"><summary>${s.fixedCat ? 'Sub-category' : 'Platform'} ${n('cats')}</summary><div>${cats}</div></details>`}
  <button class="more" type="button" data-open-sheet>${I.filter} Filters ${active ? `<span class="n">${active}</span>` : ''}</button>
  <div class="sort"><label for="sort" class="eyebrow">Sort</label><select id="sort" data-sort>${SORTS.filter(([v]) => HAS_VIEWS || (v !== 'popular' && v !== 'liked')).map(([v, l]) => `<option value="${v}" ${s.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
  <div class="applied" data-applied>${appliedChips(s, list)}</div>
</div></div>
<div class="sheet" data-sheet><div>
  <h3>Filters <button type="button" aria-label="Close" data-close-sheet>×</button></h3>
  <h4>Level</h4><div class="opts">${levels}</div>
  <h4>Type</h4><div class="opts">${types.replace(/<hr[^>]*>/, '')}</div>
  ${opts.hideCat ? '' : `<h4>${s.fixedCat ? 'Sub-category' : 'Platform'}</h4><div class="opts">${cats}</div>`}
  <div class="actions"><button type="button" class="btn btn-ghost" data-clear>Clear all</button><button type="button" class="btn btn-primary" data-close-sheet>Show results</button></div>
</div></div>`;
  }
  function appliedChips(s, list) {
    const chips = [];
    if (s.q) chips.push(['q', '', `“${s.q}”`]);
    if (!s.fixedCat) s.cats.forEach(id => chips.push(['cat', id, catById[id]?.name])); else s.cats.forEach(id => chips.push(['cat', id, catById[id]?.name]));
    s.levels.forEach(l => chips.push(['level', l, l]));
    s.types.forEach(t => chips.push(['type', t, TYPE_LABEL[t] || t]));
    s.aud.forEach(a => chips.push(['aud', a, 'For ' + a]));
    if (!chips.length) return '';
    return `<span class="count">${fmtNum(list.length)} result${list.length === 1 ? '' : 's'}</span>` + chips.map(([k, v, label]) => `<span class="chip">${esc(label)}<button type="button" aria-label="Remove ${esc(label)}" data-rm="${k}" data-v="${esc(v)}">×</button></span>`).join('') + `<button type="button" class="clear" data-clear>Clear all</button>`;
  }

  /* Instant apply: re-render the results region and update the URL without a reload */
  function wireFilters(s, rerender) {
    const root = document;
    const collect = () => {
      const pick = name => [...new Set([...root.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value))];
      s.cats = s.fixedCat ? pick('cat').map(Number) : pick('cat').map(Number);
      s.levels = pick('level'); s.types = pick('type'); s.aud = pick('aud');
      s.page = 1; rerender();
    };
    root.querySelectorAll('.fsel input, .sheet input').forEach(i => i.addEventListener('change', e => {
      // keep desktop + sheet copies in sync
      root.querySelectorAll(`input[name="${e.target.name}"][value="${e.target.value}"]`).forEach(o => { o.checked = e.target.checked; });
      collect();
    }));
    let tm; root.querySelector('[data-q]').addEventListener('input', e => { clearTimeout(tm); tm = setTimeout(() => { s.q = e.target.value.trim(); s.page = 1; rerender(true); }, 220); });
    root.querySelector('[data-q]').addEventListener('keydown', e => { if (e.key === 'Enter') { s.q = e.target.value.trim(); s.page = 1; rerender(); } });
    root.querySelector('[data-sort]').addEventListener('change', e => { s.sort = e.target.value; s.page = 1; rerender(); });
    root.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', () => { s.q = ''; s.cats = []; s.levels = []; s.types = []; s.aud = []; s.page = 1; rerender(); }));
    root.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.rm, v = b.dataset.v;
      if (k === 'q') s.q = ''; else if (k === 'cat') s.cats = s.cats.filter(x => String(x) !== v); else s[k + 's' === 'auds' ? 'aud' : k + 's'] = s[k + 's' === 'auds' ? 'aud' : k + 's'].filter(x => x !== v);
      s.page = 1; rerender();
    }));
    const sheet = root.querySelector('[data-sheet]');
    root.querySelectorAll('[data-open-sheet]').forEach(b => b.addEventListener('click', () => { sheet.setAttribute('open', ''); document.body.style.overflow = 'hidden'; }));
    root.querySelectorAll('[data-close-sheet]').forEach(b => b.addEventListener('click', () => { sheet.removeAttribute('open'); document.body.style.overflow = ''; }));
    sheet.addEventListener('click', e => { if (e.target === sheet) { sheet.removeAttribute('open'); document.body.style.overflow = ''; } });
    root.querySelectorAll('.pager a[data-page]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); s.page = +a.dataset.page; rerender(); document.querySelector('[data-results]')?.scrollIntoView({ block: 'start' }); }));
  }

  function pager(p) {
    if (p.pages <= 1) return `<div class="pager"><span class="info">${p.total ? `Showing ${p.from}–${p.to} of ${fmtNum(p.total)}` : ''}</span></div>`;
    const items = []; const push = (i) => items.push(i === p.page ? `<li class="on"><span aria-current="page">${i}</span></li>` : `<li><a href="?${toQuery(window.__S, i)}" data-page="${i}">${i}</a></li>`);
    const win = new Set([1, 2, p.pages - 1, p.pages, p.page - 1, p.page, p.page + 1].filter(i => i >= 1 && i <= p.pages));
    let last = 0; [...win].sort((a, b) => a - b).forEach(i => { if (i - last > 1) items.push('<li class="gap"><span>…</span></li>'); push(i); last = i; });
    return `<nav class="pager" aria-label="Pagination"><ul>${p.page > 1 ? `<li><a href="?${toQuery(window.__S, p.page - 1)}" data-page="${p.page - 1}">‹ Prev</a></li>` : ''}${items.join('')}${p.page < p.pages ? `<li><a href="?${toQuery(window.__S, p.page + 1)}" data-page="${p.page + 1}">Next ›</a></li>` : ''}</ul><span class="info">Showing ${p.from}–${p.to} of ${fmtNum(p.total)} · ${p.pages} pages</span></nav>`;
  }

  function resultsBlock(s, list, title) {
    const p = paginate(list, s.page, PER);
    return `
<section class="results" data-results><div class="wrap">
  <div class="results-head"><h2>${title}</h2><span class="n">${fmtNum(p.total)} ${p.total === 1 ? 'post' : 'posts'}${s.sort !== 'latest' ? ' · ' + SORTS.find(x => x[0] === s.sort)[1].toLowerCase() : ''}</span></div>
  <div class="grid">${p.items.map(card).join('') || `<div class="empty"><h3>Nothing matches those filters yet</h3><p>Try removing one, or <a href="${ROOT}/index.html">browse by platform</a>.</p></div>`}</div>
  ${pager(p)}
</div></section>`;
  }

  /* ---------- home ---------- */
  function shelf() {
    const all = filter({});
    const rows = TAX.categories.map(c => ({ c, n: countIn(all, t => t.categories.includes(c.id)) })).sort((a, b) => b.n - a.n);
    const tiles = rows.map(({ c, n }, i) => {
      const kids = (c.children || []).map(ch => ({ ch, n: countIn(all, t => t.categories.includes(ch.id)) })).filter(x => x.n >= 3).slice(0, 3);
      const cls = i < 3 ? 'big' : (i >= rows.length - 3 ? 'big small' : '');
      return `<a class="tile ${cls}" href="${ROOT}/category.html?id=${c.id}"><span class="ref">${PLATFORM[c.id]?.ref || 'CAT'}</span><span class="name">${esc(c.name)}</span><span class="cnt"><b>${n}</b> ${n === 1 ? 'post' : 'posts'}</span>${kids.length ? `<span class="subs">${kids.map(k => `<span>${esc(k.ch.name)} ${k.n}</span>`).join('')}</span>` : ''}</a>`;
    }).join('');
    return `<section class="shelf"><div class="wrap"><div class="shelf-head"><h2>Browse by platform</h2><p>Start from the board or kit you have in your hands.</p></div><div class="tiles">${tiles}</div></div></section>`;
  }
  function popularStrip() {
    if (!HAS_VIEWS) return '';
    const top = sort(T.filter(t => t.type !== 'Success Stories'), 'popular').slice(0, 5);
    return `<section class="strip"><div class="wrap"><h2>Most viewed <small>all time</small></h2><div class="row">${top.map(mini).join('')}</div></div></section>`;
  }
  function renderHome() {
    const s = window.__S = readState();
    const app = document.getElementById('app');
    const years = T.map(t => t.iso).filter(Boolean).sort();
    const draw = (keepFocus) => {
      const list = run(s);
      const f = isFiltering(s);
      history.replaceState(null, '', location.pathname + (toQuery(s) ? '?' + toQuery(s) : ''));
      const focusPos = keepFocus ? document.querySelector('[data-q]')?.selectionStart : null;
      app.innerHTML = header('tutorials') + `
<section class="hero"><div class="wrap">
  <div><p class="eyebrow">Cytron · Education</p><h1>Tutorials for <em>digital makers</em></h1><p>Step-by-step builds for Maker boards, micro:bit, Raspberry Pi, robots and edge AI. Pick a board, pick a level, start making.</p></div>
  <div class="stats"><span><b>${fmtNum(T.length)}</b>tutorials</span><span><b>${TAX.categories.length}</b>platforms</span><span><b>${years.length ? years[0].slice(0, 4) : ''}–${years.length ? years[years.length - 1].slice(0, 4) : ''}</b>archive</span></div>
</div></section>` +
        filterbar(s, list) +
        (f ? '' : shelf() + popularStrip()) +
        resultsBlock(s, list, f ? 'Results' : 'Latest tutorials') + footer();
      document.title = f ? `Search · Tutorials · Cytron` : 'Tutorials for Digital Makers · Cytron';
      wireHeader(); wireFilters(s, draw);
      if (keepFocus) { const q = document.querySelector('[data-q]'); q.focus(); try { q.setSelectionRange(focusPos, focusPos); } catch (e) { } }
    };
    draw();
  }

  /* ---------- category ---------- */
  function renderCategory() {
    const id = parseInt(qs('id', ''), 10);
    const c = TAX.categories.find(x => x.id === id);
    const app = document.getElementById('app');
    if (!c) { app.innerHTML = header('tutorials') + `<div class="wrap" style="padding:40px 20px"><h1>Platform not found</h1><p><a href="${ROOT}/index.html">Back to all tutorials</a></p></div>` + footer(); wireHeader(); return; }
    const s = window.__S = readState({ fixedCat: id });
    // scope: always include parent (and its children); sub-category chips narrow via s.cats
    const draw = (keepFocus) => {
      const scoped = s.cats.length ? s.cats : [id];
      const list = sort(filter({ q: s.q, categories: scoped, types: s.types, levels: s.levels, audience: s.aud }), s.sort);
      history.replaceState(null, '', location.pathname + '?' + toQuery(s));
      const all = filter({ categories: [id] });
      const kids = (c.children || []).map(ch => ({ ch, n: countIn(all, t => t.categories.includes(ch.id)) })).filter(x => x.n > 0);
      const focusPos = keepFocus ? document.querySelector('[data-q]')?.selectionStart : null;
      app.innerHTML = header('tutorials') + `
<section class="cat-hero"><div class="wrap">
  <ul class="crumbs"><li><a href="${ROOT}/index.html">Tutorials</a></li><li>${esc(c.name)}</li></ul>
  <span class="ref">${PLATFORM[id]?.ref || 'CAT'} · PLATFORM</span>
  <h1>${esc(c.name)}</h1>
  <p>${esc(PLATFORM[id]?.blurb || '')} <span class="mono">${fmtNum(all.length)} posts.</span></p>
  ${kids.length ? `<div class="subs"><a class="${!s.cats.length ? 'on' : ''}" href="?id=${id}" data-sub="">All<small>${all.length}</small></a>${kids.map(k => `<a class="${s.cats.includes(k.ch.id) ? 'on' : ''}" href="?id=${id}&cat=${k.ch.id}" data-sub="${k.ch.id}">${esc(k.ch.name)}<small>${k.n}</small></a>`).join('')}</div>` : ''}
</div></section>` +
        filterbar(s, list, { hideCat: true }) +
        resultsBlock(s, list, s.cats.length ? esc(s.cats.map(x => catById[x]?.name).join(', ')) : 'All ' + esc(c.name)) + footer();
      document.title = `${c.name} tutorials · Cytron`;
      wireHeader(); wireFilters(s, draw);
      document.querySelectorAll('[data-sub]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); s.cats = a.dataset.sub ? [+a.dataset.sub] : []; s.page = 1; draw(); }));
      if (keepFocus) { const q = document.querySelector('[data-q]'); q.focus(); try { q.setSelectionRange(focusPos, focusPos); } catch (e) { } }
    };
    draw();
  }

  /* ---------- detail ---------- */
  function fixLinks(html) {
    return html
      .replace(/href="\/tutorial\/([^"#?]+)"/g, (m, slug) => `href="${ROOT}/tutorial.html?slug=${slug}"`)
      .replace(/href="\/(?!\/)/g, `href="${LIVE}/`)
      .replace(/src="\/(?!\/)/g, `src="${LIVE}/`)
      .replace(/ style="text-align:\s*justify;?"/g, '')
      .replace(/<p>(\s|&nbsp;)*<\/p>/g, '');
  }
  function renderDetail() {
    const slug = qs('slug', ''); const t = bySlug[slug]; const app = document.getElementById('app');
    if (!t) { app.innerHTML = header('tutorials') + `<div class="wrap" style="padding:40px 20px"><h1>Tutorial not found</h1><p><a href="${ROOT}/index.html">Back to all tutorials</a></p></div>` + footer(); wireHeader(); return; }
    document.title = `${t.title} · Cytron Tutorials`;
    const art = ARTICLES[slug];
    const pc = primaryCat(t); const parent = pc ? (pc.parentId ? catById[pc.parentId] : pc) : null;
    const idx = T.indexOf(t); const newer = T[idx - 1], older = T[idx + 1];
    let body = art ? fixLinks(art.body) : `<div class="notice"><strong>Body not mirrored in this prototype.</strong> Five sample articles carry their full text; every other post has its real title, cover, author, level, categories, tags and view count. <a href="${LIVE}/tutorial/${esc(slug)}" target="_blank" rel="noopener">Read the original on my.cytron.io ↗</a></div><h2>Introduction</h2><p>${esc(t.excerpt || '')}</p>`;
    // heading ids for TOC
    const toc = []; body = body.replace(/<h2>(.*?)<\/h2>/g, (m, txt) => { const id = 'h-' + toc.length + '-' + txt.replace(/<[^>]+>/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); toc.push([id, txt.replace(/<[^>]+>/g, '')]); return `<h2 id="${id}">${txt}</h2>`; });
    const related = sort(T.filter(x => x !== t && parent && x.categories.some(id => id === parent.id || catById[id]?.parentId === parent.id)), HAS_VIEWS ? 'popular' : 'latest').slice(0, 3);
    const hw = art && art.products && art.products.length ? `<div class="panel"><h4>Hardware you'll need</h4><ul class="hw">${art.products.map(p => `<li><img loading="lazy" src="${esc(p.img)}" alt=""><div><a class="n" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a><div class="p">${esc(p.price)}${p.oldPrice ? `<s>${esc(p.oldPrice)}</s>` : ''} · ${esc((p.qty || '').replace('x ', '×'))}${p.stock ? ` · ${esc(p.stock)}` : ''}</div></div></li>`).join('')}</ul><a class="btn btn-primary" style="width:100%;margin-top:14px" href="${LIVE}/" target="_blank" rel="noopener">Add all to cart</a></div>` : '';
    app.innerHTML = header('tutorials') + `
<div class="wrap"><ul class="crumbs"><li><a href="${ROOT}/index.html">Tutorials</a></li>${parent ? `<li><a href="${ROOT}/category.html?id=${parent.id}">${esc(parent.name)}</a></li>` : ''}${pc && pc.parentId ? `<li><a href="${ROOT}/category.html?id=${parent.id}&cat=${pc.id}">${esc(pc.name)}</a></li>` : ''}<li>${esc(t.title)}</li></ul></div>
<div class="wrap article-wrap">
  <article class="article">
    <div class="kind"><span class="type">${esc(TYPE_LABEL[t.type] || t.type || 'Post')}</span>${t.level ? `<span class="lvl ${t.level}">${esc(t.level)}</span>` : ''}</div>
    <h1>${esc(t.title)}</h1>
    <div class="byline"><span>By <b>${esc(t.author || '')}</b></span><span>${esc(t.date || '')}</span><span class="nums">${t.views != null ? `<span>${fmtNum(t.views)} views</span>` : ''}${t.likes != null ? `<span>♥ ${t.likes}</span>` : ''}${t.words ? `<span>${readTime(t.words)}</span>` : ''}</span></div>
    ${(art && art.hero) || t.hero ? `<img class="hero-img" src="${esc((art && art.hero) || t.hero)}" alt="">` : ''}
    <div class="prose">${body}</div>
    <div class="prevnext">${older ? `<a href="${ROOT}/tutorial.html?slug=${encodeURIComponent(older.slug)}"><small>‹ Older</small>${esc(older.title)}</a>` : '<span></span>'}${newer ? `<a class="next" href="${ROOT}/tutorial.html?slug=${encodeURIComponent(newer.slug)}"><small>Newer ›</small>${esc(newer.title)}</a>` : ''}</div>
  </article>
  <aside class="rail">
    ${toc.length > 1 ? `<div class="panel"><h4>On this page</h4><ul class="toc">${toc.map(([id, txt]) => `<li><a href="#${id}">${txt}</a></li>`).join('')}</ul></div>` : ''}
    ${hw}
    ${(t.tags || []).length ? `<div class="panel"><h4>Tags</h4><div class="tagrow">${t.tags.map(tag => `<a href="${ROOT}/index.html?q=${encodeURIComponent(tag)}">${esc(tag)}</a>`).join('')}</div></div>` : ''}
    <div class="panel"><h4>Share</h4><div class="tagrow"><a href="#" onclick="return false">Copy link</a><a href="#" onclick="return false">WhatsApp</a><a href="#" onclick="return false">Telegram</a><a href="#" onclick="return false">Facebook</a></div></div>
  </aside>
</div>
${related.length ? `<section class="related"><div class="wrap"><h2>More in ${esc(parent.name)}</h2><div class="grid">${related.map(card).join('')}</div></div></section>` : ''}` + footer();
    wireHeader();
  }

  window.NEW = { renderHome, renderCategory, renderDetail };
})();
