/* /new-c — Option C: A + B merged. Static, client-rendered from ../data/*.js.
   Pages: index.html (home), category.html?id=N, tutorial.html?slug=S */
(function () {
  const { T, TAX, ARTICLES, esc, qs, qsAll, catById, bySlug, filter, sort, paginate, fmtNum, readTime } = window.CY;
  const ROOT = document.documentElement.getAttribute('data-root') || '.';
  const LIVE = 'https://my.cytron.io';
  const PER = 20;
  const HAS_VIEWS = T.some(t => t.views != null);

  const PLATFORM = {
    2: { ref: 'RPI', chip: 'Raspberry Pi', title: 'Raspberry Pi', blurb: 'Raspberry Pi single-board computers, Pico microcontrollers, cameras, HATs and edge AI.' },
    1: { ref: 'ARD', chip: 'Arduino', title: 'Arduino', blurb: 'Arduino boards, Maker UNO, Maker Nano and the classic getting-started projects.' },
    13: { ref: 'IOT', chip: 'ESP32 & IoT', title: 'ESP32 & IoT', blurb: 'ESP32, Maker ESP32, LoRa, MQTT dashboards and cloud services.' },
    19: { ref: 'MCU', chip: 'Maker boards', title: 'Maker boards', blurb: 'Maker boards, Teensy, PIC and Python for microcontrollers.' },
    16: { ref: 'CMP', chip: 'Sensors', title: 'Sensors & components', blurb: 'Sensors, modules and DIY electronics fundamentals.' },
    28: { ref: 'IND', chip: 'Industry', title: 'Industry', blurb: 'IRIV industrial controllers, LoRaWAN and factory-floor monitoring.' },
    4: { ref: 'MBT', chip: 'micro:bit', title: 'micro:bit', blurb: 'micro:bit and Cytron’s classroom kits — EDU:BIT, REKA:BIT and SUMO:BIT.' },
    10: { ref: '3DM', chip: '3D printing', title: '3D printing', blurb: 'Designing enclosures, mounts and parts for your builds.' },
    7: { ref: 'ROB', chip: 'Robotics', title: 'Robotics', blurb: 'Motor drivers, rero and the mechanics of making things move.' },
    11: { ref: 'NVA', chip: 'NVIDIA AI', title: 'NVIDIA Jetson', blurb: 'Jetson Nano and Orin NX — computer vision and AI at the edge.' },
    31: { ref: 'RBK', chip: 'Robot kits', title: 'Robot kits', blurb: 'Sumo, soccer, line-following and battle robot kits.' },
    43: { ref: 'RDK', chip: 'RDK X5', title: 'RDK X5', blurb: 'D-Robotics RDK X5 AI board — ROS, computer vision and edge-AI robot builds.' },
    24: { ref: 'MSC', chip: 'News', title: 'News & events', blurb: 'News, seminars and workshops.' }
  };
  const ORDER = [2, 1, 13, 19, 16, 28, 4, 10, 7, 11, 31, 43, 24];
  const HOME_ROWS = ORDER; // one row per platform on the home page, like Option B (archive-size order)
  const TYPE_LABEL = { Tutorial: 'Tutorial', Project: 'Project', Protip: 'Protip', 'Success Stories': 'Success story', Uncategorized: 'Post' };
  const SORTS = [['latest', 'Latest'], ['popular', 'Most viewed'], ['liked', 'Most liked'], ['easy', 'Easiest first'], ['oldest', 'Oldest'], ['az', 'A – Z']];
  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    burger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
    cart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
    heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    bookmark: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>'
  };
  const latest = l => sort(l, 'latest');
  const inCat = id => filter({ categories: [id] });
  const countIn = (list, p) => list.reduce((n, t) => n + (p(t) ? 1 : 0), 0);
  const href = t => `${ROOT}/tutorial.html?slug=${encodeURIComponent(t.slug)}`;
  const catHref = (id, sub) => `${ROOT}/category.html?id=${id}${sub ? '&cat=' + sub : ''}`;
  function primaryCat(t) { const c = t.categories.find(id => catById[id] && catById[id].parentId) || t.categories[0]; return c ? catById[c] : null; }

  /* ---------- chrome ---------- */
  function header(active) {
    const dd = (label, items) => `<details><summary>${label}</summary><div>${items.map(x => `<a href="#" onclick="return false">${x}</a>`).join('')}</div></details>`;
    return `
<header class="head"><div class="wrap">
  <a class="logo" href="${ROOT}/index.html"><img src="https://static.cytron.io/image/catalog/logo/cytron-technologies-200x100.png" alt="Cytron Technologies"></a>
  <nav class="main" aria-label="Primary">
    <a class="${active === 'home' ? 'on' : ''}" href="${ROOT}/index.html">Tutorials</a>
    ${dd('Resource Hubs', ['EDU:BIT', 'ZOOM:BIT', 'REKA:BIT RBT Project Kit', 'rero:micro', 'PikaBot', 'EDU PICO'])}
    ${dd('Programs', ['RAC2026 Competition', 'EDU:BIT Certification', 'ZOOM:BIT Certification', 'EDU PICO Certification'])}
    ${dd('Community', ['micro:bit', 'Arduino/Maker Boards', 'Raspberry Pi', '3D Printing', 'Nvidia Jetson'])}
  </nav>
  <form class="search" action="${ROOT}/category.html" method="get" role="search"><input type="search" name="q" placeholder="Search ${fmtNum(T.length)} tutorials" aria-label="Search tutorials" value="${esc(qs('q', ''))}"><button type="submit" aria-label="Search">${I.search}</button></form>
  <a class="store" href="${LIVE}/">${I.cart} Store</a>
  <button class="burger" aria-label="Menu" aria-expanded="false" data-burger>${I.burger}</button>
  <details class="mnav" data-mnav><summary>Menu</summary>
    <form class="msearch" action="${ROOT}/category.html" method="get" role="search"><input type="search" name="q" placeholder="Search tutorials" aria-label="Search tutorials"><button type="submit" aria-label="Search">${I.search}</button></form>
    <a href="${ROOT}/index.html">Tutorials</a>${ORDER.slice(0, 8).map(id => `<a href="${catHref(id)}">${PLATFORM[id].chip}</a>`).join('')}<a href="${ROOT}/category.html">All tutorials</a><a href="${LIVE}/">Store</a>
  </details>
</div></header>
<div class="boards"><div class="wrap"><ul>
  <li><a class="${active === 'home' ? 'on' : ''}" href="${ROOT}/index.html">Home</a></li>
  ${ORDER.filter(id => id !== 24).map(id => `<li><a class="${active === id ? 'on' : ''}" href="${catHref(id)}">${PLATFORM[id].chip}<span class="n">${inCat(id).length}</span></a></li>`).join('')}
  <li><a class="${active === 'all' ? 'on' : ''}" href="${ROOT}/category.html">All<span class="n">${fmtNum(T.length)}</span></a></li>
</ul></div></div>`;
  }
  function footer() {
    const col = (h, ls) => `<div><h3>${h}</h3><ul>${ls.map(l => `<li><a href="#" onclick="return false">${l}</a></li>`).join('')}</ul></div>`;
    return `
<footer><div class="wrap">
  <div class="cols">
    <div class="brand"><img src="https://static.cytron.io/image/catalog/logo/cytron-technologies-200x100.png" alt="Cytron"><p>Simplified tutorials for electronic and digital making — ${fmtNum(T.length)} step-by-step guides since 2010.</p></div>
    ${col('Support', ['Warranty / Return', 'Request for Quotation', 'Register as Teacher', 'Register as Student', 'Contact Us'])}
    ${col('About', ['About Us', 'Delivery Information', 'Return Policy', 'Cytron Membership', 'Careers'])}
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

  /* quick actions on card thumbnails (prototype state: page only) */
  const liked = new Set(), saved = new Set();
  document.addEventListener('click', e => {
    const l = e.target.closest('[data-qlike]'), b = e.target.closest('[data-qbookmark]');
    if (l) { e.preventDefault(); const id = +l.dataset.qlike, on = !liked.has(id); on ? liked.add(id) : liked.delete(id); l.setAttribute('aria-pressed', String(on)); const base = T[id]?.likes ?? 0; l.querySelector('span').textContent = base + (on ? 1 : 0); }
    if (b) { e.preventDefault(); const id = +b.dataset.qbookmark, on = !saved.has(id); on ? saved.add(id) : saved.delete(id); b.setAttribute('aria-pressed', String(on)); }
  });

  /* ---------- pieces ---------- */
  function card(t) {
    const pc = primaryCat(t);
    const nums = [t.views != null ? `${fmtNum(t.views)} views` : '', t.words ? readTime(t.words) : ''].filter(Boolean);
    return `<article class="card">
  <div class="cover"><a href="${href(t)}" tabindex="-1" aria-hidden="true">${t.cover ? `<img loading="lazy" src="${esc(t.cover)}" alt="">` : ''}</a>${t.level ? `<span class="lvl ${t.level}">${esc(t.level)}</span>` : ''}
    <div class="quick"><button type="button" class="qa" data-qlike="${t.id}" aria-pressed="${liked.has(t.id)}" aria-label="Like ${esc(t.title)}">${I.heart}<span>${(t.likes ?? 0) + (liked.has(t.id) ? 1 : 0)}</span></button><button type="button" class="qa" data-qbookmark="${t.id}" aria-pressed="${saved.has(t.id)}" aria-label="Bookmark ${esc(t.title)}">${I.bookmark}</button></div>
  </div>
  <div class="body">
    <div class="kind"><span class="type">${esc(TYPE_LABEL[t.type] || t.type || 'Post')}</span>${pc ? `<a class="cat" href="${catHref(pc.parentId || pc.id, pc.parentId ? pc.id : null)}">${esc(pc.parentId ? catById[pc.parentId].name + ' · ' + pc.name : pc.name)}</a>` : ''}</div>
    <h3><a href="${href(t)}">${esc(t.title)}</a></h3>
    <p class="ex">${esc(t.excerpt || '')}</p>
    <div class="meta"><span><b>${esc(t.author || '')}</b> · ${esc(t.date || '')}</span><span class="nums">${nums.map(esc).join('<span aria-hidden="true">·</span>')}</span></div>
  </div>
</article>`;
  }
  function mini(t, i) {
    return `<a class="mini" href="${href(t)}">${t.cover ? `<img loading="lazy" src="${esc(t.cover)}" alt="">` : ''}${i != null ? `<span class="rank">${i + 1}</span>` : ''}<span class="t">${esc(t.title)}</span><span class="v">${fmtNum(t.views)} views · ${esc(t.level || 'Unrated')}</span></a>`;
  }
  function tiles() {
    const rows = ORDER.map(id => ({ id, n: inCat(id).length })).filter(x => x.n);
    return `<div class="tiles">${rows.map(({ id, n }, i) => {
      const kids = (catById[id].children || []).map(ch => ({ ch, n: inCat(ch.id).length })).filter(x => x.n >= 3).slice(0, 3);
      return `<a class="tile ${i < 2 || i >= rows.length - 2 ? 'big' : ''}" href="${catHref(id)}"><span class="ref">${PLATFORM[id].ref}</span><span class="name">${esc(PLATFORM[id].title)}</span><span class="cnt"><b>${n}</b> ${n === 1 ? 'post' : 'posts'}</span>${kids.length ? `<span class="subs">${kids.map(k => `<span>${esc(k.ch.name)} ${k.n}</span>`).join('')}</span>` : ''}</a>`;
    }).join('')}</div>`;
  }
  function platformRow(id) {
    const list = inCat(id); if (!list.length) return '';
    const kids = (catById[id].children || []).map(ch => ({ ch, n: inCat(ch.id).length })).filter(x => x.n >= 3);
    return `<section class="sec"><div class="wrap">
  <div class="sec-head"><div><h2>${esc(PLATFORM[id].title)}</h2><p>${esc(PLATFORM[id].blurb)}</p>${kids.length ? `<div class="sub">${kids.map(k => `<a href="${catHref(id, k.ch.id)}">${esc(k.ch.name)} · ${k.n}</a>`).join('')}</div>` : ''}</div><a class="viewall" href="${catHref(id)}">View all ${fmtNum(list.length)} →</a></div>
  <div class="grid">${latest(list).slice(0, 4).map(card).join('')}</div>
</div></section>`;
  }
  function featured() {
    // B's slider: five most-viewed "getting started" guides, auto-rotating, with Read More »
    let pool = T.filter(t => /getting started|get started|beginner'?s guide|introduction to/i.test(t.title) && (t.hero || t.cover));
    pool = (HAS_VIEWS ? sort(pool, 'popular') : latest(pool)).slice(0, 5);
    if (pool.length < 3) pool = latest(T.filter(t => t.hero || t.cover)).slice(0, 5);
    return `<div class="featured slider" data-slider aria-roledescription="carousel">
  ${pool.map((t, i) => { const pc = primaryCat(t); return `<div class="slide ${i === 0 ? 'on' : ''}" role="group" aria-label="${i + 1} of ${pool.length}"><img src="${esc(t.hero || t.cover)}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}">${t.level ? `<span class="lvl ${t.level}">${esc(t.level)}</span>` : ''}<div class="cap"><span class="eyebrow">Featured guide${pc ? ` · ${esc(pc.parentId ? catById[pc.parentId].name : pc.name)}` : ''}${t.views != null ? ` · ${fmtNum(t.views)} views` : ''}</span><h2><a href="${href(t)}">${esc(t.title)}</a></h2><p>${esc(t.excerpt || '')}</p><a class="btn" href="${href(t)}">Read More »</a></div></div>`; }).join('')}
  <button class="arrow prev" aria-label="Previous" data-prev>‹</button><button class="arrow next" aria-label="Next" data-next>›</button>
  <div class="dots">${pool.map((_, i) => `<button aria-label="Slide ${i + 1}" class="${i === 0 ? 'on' : ''}" data-dot="${i}"></button>`).join('')}</div>
</div>`;
  }
  function wireSlider() {
    const s = document.querySelector('[data-slider]'); if (!s) return;
    const slides = [...s.querySelectorAll('.slide')], dots = [...s.querySelectorAll('[data-dot]')]; let i = 0, tm;
    const go = n => { i = (n + slides.length) % slides.length; slides.forEach((x, k) => x.classList.toggle('on', k === i)); dots.forEach((x, k) => x.classList.toggle('on', k === i)); };
    const auto = () => { clearInterval(tm); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) tm = setInterval(() => go(i + 1), 6000); };
    s.querySelector('[data-prev]').addEventListener('click', () => { go(i - 1); auto(); });
    s.querySelector('[data-next]').addEventListener('click', () => { go(i + 1); auto(); });
    dots.forEach(d => d.addEventListener('click', () => { go(+d.dataset.dot); auto(); }));
    s.addEventListener('mouseenter', () => clearInterval(tm)); s.addEventListener('mouseleave', auto);
    s.addEventListener('focusin', () => clearInterval(tm)); s.addEventListener('focusout', auto);
    auto();
  }
  function latestPanel() {
    return `<div class="latest"><div class="lh"><h2>Latest Posts</h2><a href="${ROOT}/category.html">All tutorials →</a></div><ul>${latest(T).slice(0, 5).map(t => `<li>${t.cover ? `<img loading="lazy" src="${esc(t.cover)}" alt="">` : '<span></span>'}<div><a class="t" href="${href(t)}">${esc(t.title)}</a><div class="m">${esc(t.date || '')}${t.level ? ' · ' + esc(t.level) : ''}</div></div></li>`).join('')}</ul></div>`;
  }
  function popularStrip() {
    if (!HAS_VIEWS) return '';
    const top = sort(T.filter(t => t.type !== 'Success Stories'), 'popular').slice(0, 5);
    return `<section class="sec strip"><div class="wrap"><div class="sec-head"><div><h2>Most viewed</h2><p>All-time favourites across the archive.</p></div><a class="viewall" href="${ROOT}/category.html?sort=popular">See ranking →</a></div><div class="row">${top.map(mini).join('')}</div></div></section>`;
  }
  function band() {
    return `<section class="band"><div class="wrap"><div class="band-inner">
  <h2>Learning kits with their own hubs</h2><p>Each Cytron classroom kit has a dedicated resource hub with lesson plans, downloads and certification.</p>
  <div class="hubs">${[['EDU:BIT', 'micro:bit starter kit'], ['ZOOM:BIT', 'micro:bit robot car'], ['REKA:BIT', 'RBT project kit'], ['rero:micro', 'Modular robot'], ['PikaBot', 'Line-following robot'], ['EDU PICO', 'Raspberry Pi Pico kit']].map(([n, d]) => `<a class="hub" href="#" onclick="return false"><b>${n}</b><span>${d}</span></a>`).join('')}</div>
  <div class="programs">${['RAC2026 Competition', 'EDU:BIT Certification', 'ZOOM:BIT Certification', 'EDU PICO Certification'].map(p => `<a href="#" onclick="return false">${p}</a>`).join('')}</div>
</div></div></section>`;
  }

  /* ---------- filter bar (A) ---------- */
  function readState(fixed) {
    return Object.assign({ q: qs('q', ''), cats: qsAll('cat').map(Number).filter(Boolean), types: qsAll('type'), levels: qsAll('level'), aud: qsAll('aud'), sort: qs('sort', 'latest'), page: parseInt(qs('page', '1'), 10) || 1 }, fixed || {});
  }
  function toQuery(s, page) {
    const p = new URLSearchParams();
    if (s.fixedCat) p.set('id', s.fixedCat);
    if (s.q) p.set('q', s.q);
    if (s.cats.length) p.set('cat', s.cats.join(','));
    if (s.types.length) p.set('type', s.types.join(','));
    if (s.levels.length) p.set('level', s.levels.join(','));
    if (s.aud.length) p.set('aud', s.aud.join(','));
    if (s.sort && s.sort !== 'latest') p.set('sort', s.sort);
    const pg = page == null ? s.page : page; if (pg > 1) p.set('page', pg);
    return p.toString();
  }
  const isFiltering = s => !!(s.q || s.cats.length || s.types.length || s.levels.length || s.aud.length);
  function run(s) {
    const scoped = s.cats.length ? s.cats : (s.fixedCat ? [s.fixedCat] : []);
    return sort(filter({ q: s.q, categories: scoped, types: s.types, levels: s.levels, audience: s.aud }), s.sort);
  }
  function filterbar(s, list) {
    const all = s.fixedCat ? inCat(s.fixedCat) : T;
    const cc = id => countIn(all, t => t.categories.includes(id));
    const cats = (s.fixedCat ? TAX.categories.filter(c => c.id === s.fixedCat) : TAX.categories).map(c => {
      const kids = (c.children || []).filter(ch => cc(ch.id) > 0);
      return (s.fixedCat ? '' : `<label><input type="checkbox" name="cat" value="${c.id}" ${s.cats.includes(c.id) ? 'checked' : ''}> ${esc(c.name)}<span class="cnt">${cc(c.id)}</span></label>`) +
        kids.map(ch => `<label class="${s.fixedCat ? '' : 'child'}"><input type="checkbox" name="cat" value="${ch.id}" ${s.cats.includes(ch.id) ? 'checked' : ''}> ${esc(ch.name)}<span class="cnt">${cc(ch.id)}</span></label>`).join('');
    }).join('');
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Unrated'].map(l => `<label><input type="checkbox" name="level" value="${l}" ${s.levels.includes(l) ? 'checked' : ''}><span class="dot" style="background:var(--lvl-${l === 'Unrated' ? 'none' : l.toLowerCase()})"></span>${l}<span class="cnt">${countIn(all, t => (t.level || 'Unrated') === l)}</span></label>`).join('');
    const types = ['Tutorial', 'Project', 'Protip', 'Success Stories'].map(ty => `<label><input type="checkbox" name="type" value="${ty}" ${s.types.includes(ty) ? 'checked' : ''}> ${TYPE_LABEL[ty]}<span class="cnt">${countIn(all, t => t.type === ty)}</span></label>`).join('') +
      `<hr style="border:0;border-top:1px solid var(--line-2);margin:6px 0">` + ['education', 'industry'].map(a => `<label><input type="checkbox" name="aud" value="${a}" ${s.aud.includes(a) ? 'checked' : ''}> For ${a}<span class="cnt">${countIn(all, t => t.audience.includes(a))}</span></label>`).join('');
    const n = k => s[k].length ? `<span class="n">${s[k].length}</span>` : '';
    const active = s.levels.length + s.types.length + s.aud.length + s.cats.length;
    const hasCatKids = !s.fixedCat || (catById[s.fixedCat].children || []).some(ch => cc(ch.id) > 0);
    return `
<div class="filterbar" data-filterbar><div class="wrap">
  <label class="q"><span class="sr-only">Search</span><input type="search" placeholder="${s.fixedCat ? 'Search in ' + esc(catById[s.fixedCat].name) : 'Search by title, tag or author'}" value="${esc(s.q)}" data-q>${I.search}</label>
  <details class="fsel"><summary>Level ${n('levels')}</summary><div>${levels}</div></details>
  <details class="fsel"><summary>Type ${n('types')}</summary><div>${types}</div></details>
  ${hasCatKids ? `<details class="fsel"><summary>${s.fixedCat ? 'Sub-category' : 'Platform'} ${n('cats')}</summary><div>${cats}</div></details>` : ''}
  <button class="more" type="button" data-open-sheet>${I.filter} Filters ${active ? `<span class="n">${active}</span>` : ''}</button>
  <div class="sort"><label for="sort" class="eyebrow">Sort</label><select id="sort" data-sort>${SORTS.filter(([v]) => HAS_VIEWS || (v !== 'popular' && v !== 'liked')).map(([v, l]) => `<option value="${v}" ${s.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
  <div class="applied" data-applied>${chips(s, list)}</div>
</div></div>
<div class="sheet" data-sheet><div>
  <h3>Filters <button type="button" aria-label="Close" data-close-sheet>×</button></h3>
  <h4>Level</h4><div class="opts">${levels}</div>
  <h4>Type</h4><div class="opts">${types.replace(/<hr[^>]*>/, '')}</div>
  ${hasCatKids ? `<h4>${s.fixedCat ? 'Sub-category' : 'Platform'}</h4><div class="opts">${cats}</div>` : ''}
  <div class="actions"><button type="button" class="btn btn-ghost" data-clear>Clear all</button><button type="button" class="btn btn-primary" data-close-sheet>Show results</button></div>
</div></div>`;
  }
  function chips(s, list) {
    const c = [];
    if (s.q) c.push(['q', '', `“${s.q}”`]);
    s.cats.forEach(id => c.push(['cat', id, catById[id]?.name]));
    s.levels.forEach(l => c.push(['level', l, l]));
    s.types.forEach(t => c.push(['type', t, TYPE_LABEL[t] || t]));
    s.aud.forEach(a => c.push(['aud', a, 'For ' + a]));
    if (!c.length) return '';
    return `<span class="count">${fmtNum(list.length)} result${list.length === 1 ? '' : 's'}</span>` + c.map(([k, v, label]) => `<span class="chip">${esc(label)}<button type="button" aria-label="Remove ${esc(label)}" data-rm="${k}" data-v="${esc(v)}">×</button></span>`).join('') + `<button type="button" class="clear" data-clear>Clear all</button>`;
  }
  function wireFilters(s, rerender) {
    const R = document;
    const collect = () => {
      const pick = name => [...new Set([...R.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value))];
      s.cats = pick('cat').map(Number); s.levels = pick('level'); s.types = pick('type'); s.aud = pick('aud'); s.page = 1; rerender();
    };
    R.querySelectorAll('.fsel input, .sheet input').forEach(i => i.addEventListener('change', e => { R.querySelectorAll(`input[name="${e.target.name}"][value="${e.target.value}"]`).forEach(o => { o.checked = e.target.checked; }); collect(); }));
    let tm; const q = R.querySelector('[data-q]');
    q.addEventListener('input', e => { clearTimeout(tm); tm = setTimeout(() => { s.q = e.target.value.trim(); s.page = 1; rerender(true); }, 220); });
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { s.q = e.target.value.trim(); s.page = 1; rerender(); } });
    R.querySelector('[data-sort]').addEventListener('change', e => { s.sort = e.target.value; s.page = 1; rerender(); });
    R.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', () => { s.q = ''; s.cats = []; s.levels = []; s.types = []; s.aud = []; s.page = 1; rerender(); }));
    R.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.rm, v = b.dataset.v;
      if (k === 'q') s.q = ''; else if (k === 'cat') s.cats = s.cats.filter(x => String(x) !== v); else { const key = k === 'aud' ? 'aud' : k + 's'; s[key] = s[key].filter(x => x !== v); }
      s.page = 1; rerender();
    }));
    const sheet = R.querySelector('[data-sheet]');
    R.querySelectorAll('[data-open-sheet]').forEach(b => b.addEventListener('click', () => { sheet.setAttribute('open', ''); document.body.style.overflow = 'hidden'; }));
    R.querySelectorAll('[data-close-sheet]').forEach(b => b.addEventListener('click', () => { sheet.removeAttribute('open'); document.body.style.overflow = ''; }));
    sheet.addEventListener('click', e => { if (e.target === sheet) { sheet.removeAttribute('open'); document.body.style.overflow = ''; } });
    R.querySelectorAll('.pager a[data-page]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); s.page = +a.dataset.page; rerender(); R.querySelector('[data-results]')?.scrollIntoView({ block: 'start' }); }));
    R.querySelectorAll('[data-sub]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); s.cats = a.dataset.sub ? [+a.dataset.sub] : []; s.page = 1; rerender(); }));
  }
  function pager(s, p) {
    if (p.pages <= 1) return `<div class="pager"><span class="info">${p.total ? `Showing ${p.from}–${p.to} of ${fmtNum(p.total)}` : ''}</span></div>`;
    const items = []; const push = i => items.push(i === p.page ? `<li class="on"><span aria-current="page">${i}</span></li>` : `<li><a href="?${toQuery(s, i)}" data-page="${i}">${i}</a></li>`);
    const win = new Set([1, 2, p.pages - 1, p.pages, p.page - 1, p.page, p.page + 1].filter(i => i >= 1 && i <= p.pages)); let last = 0;
    [...win].sort((a, b) => a - b).forEach(i => { if (i - last > 1) items.push('<li class="gap"><span>…</span></li>'); push(i); last = i; });
    return `<nav class="pager" aria-label="Pagination"><ul>${p.page > 1 ? `<li><a href="?${toQuery(s, p.page - 1)}" data-page="${p.page - 1}">‹ Prev</a></li>` : ''}${items.join('')}${p.page < p.pages ? `<li><a href="?${toQuery(s, p.page + 1)}" data-page="${p.page + 1}">Next ›</a></li>` : ''}</ul><span class="info">Showing ${p.from}–${p.to} of ${fmtNum(p.total)} · ${p.pages} pages</span></nav>`;
  }
  function resultsBlock(s, list, title, three) {
    const p = paginate(list, s.page, PER);
    return `<section class="results" data-results><div class="wrap">
  <div class="results-head"><h2>${title}</h2><span class="n">${fmtNum(p.total)} ${p.total === 1 ? 'post' : 'posts'}${s.sort !== 'latest' ? ' · ' + SORTS.find(x => x[0] === s.sort)[1].toLowerCase() : ''}</span></div>
  <div class="grid ${three ? 'three' : ''}">${p.items.map(card).join('') || `<div class="empty"><h3>Nothing matches those filters yet</h3><p>Try removing one, or <a href="${ROOT}/index.html">browse by platform</a>.</p></div>`}</div>
  ${pager(s, p)}
</div></section>`;
  }

  /* ---------- home ---------- */
  function renderHome() {
    const s = readState(); const app = document.getElementById('app');
    const draw = (keepFocus) => {
      const list = run(s); const f = isFiltering(s);
      history.replaceState(null, '', location.pathname + (toQuery(s) ? '?' + toQuery(s) : ''));
      const pos = keepFocus ? document.querySelector('[data-q]')?.selectionStart : null;
      app.innerHTML = header('home') + `
${f ? `<h1 class="sr-only">Cytron Tutorials — ${fmtNum(T.length)} electronics and digital-making guides</h1>` : `<section class="intro"><div class="wrap"><p class="eyebrow">Cytron</p><h1>Tutorials for <em>digital makers</em></h1><p class="lead">Step-by-step builds for Maker boards, micro:bit, Raspberry Pi, robots and edge AI. Pick a board, pick a level, start making.</p></div></section>`}
${f ? '' : `<section class="hero"><div class="wrap"><div class="hero-grid">${featured()}${latestPanel()}</div>
</div></section>`}` +
        filterbar(s, list) +
        (f ? resultsBlock(s, list, 'Results') :
          popularStrip() +
          HOME_ROWS.map(platformRow).join('') +
          band() +
          `<div style="height:30px"></div>`) + footer();
      document.title = f ? 'Search · Cytron Tutorials' : 'Cytron Tutorials — Learn Raspberry Pi, Arduino, ESP32, micro:bit and more';
      wireHeader(); wireFilters(s, draw); wireSlider();
      if (keepFocus) { const q = document.querySelector('[data-q]'); q.focus(); try { q.setSelectionRange(pos, pos); } catch (e) { } }
    };
    draw();
  }

  /* ---------- category / all / search ---------- */
  function renderCategory() {
    const id = parseInt(qs('id', ''), 10) || null; const c = id ? TAX.categories.find(x => x.id === id) : null;
    const app = document.getElementById('app');
    const s = readState(c ? { fixedCat: id } : {});
    const draw = (keepFocus) => {
      const list = run(s);
      history.replaceState(null, '', location.pathname + (toQuery(s) ? '?' + toQuery(s) : ''));
      const all = c ? inCat(id) : T;
      const kids = c ? (c.children || []).map(ch => ({ ch, n: inCat(ch.id).length })).filter(x => x.n > 0) : [];
      const title = c ? (s.cats.length === 1 ? catById[s.cats[0]].name : PLATFORM[id]?.title || c.name) : (s.q ? `Search: “${s.q}”` : 'All tutorials');
      const pos = keepFocus ? document.querySelector('[data-q]')?.selectionStart : null;
      app.innerHTML = header(c ? id : 'all') + `
<section class="cat-hero"><div class="wrap">
  <ul class="crumbs"><li><a href="${ROOT}/index.html">Tutorials</a></li>${c ? `<li>${esc(c.name)}</li>` : `<li>${s.q ? 'Search' : 'All'}</li>`}</ul>
  ${c ? `<span class="ref">${PLATFORM[id]?.ref || 'CAT'} · PLATFORM</span>` : ''}
  <h1>${esc(c ? PLATFORM[id]?.title || c.name : (s.q ? `“${s.q}”` : 'All tutorials'))}</h1>
  <p>${c ? esc(PLATFORM[id]?.blurb || '') + ' ' : ''}<span class="mono">${fmtNum(all.length)} posts${c ? ' in this platform' : ' in the archive'}.</span></p>
  ${kids.length ? `<div class="subs"><a class="${!s.cats.length ? 'on' : ''}" href="?id=${id}" data-sub="">All<small>${all.length}</small></a>${kids.map(k => `<a class="${s.cats.includes(k.ch.id) ? 'on' : ''}" href="?id=${id}&cat=${k.ch.id}" data-sub="${k.ch.id}">${esc(k.ch.name)}<small>${k.n}</small></a>`).join('')}</div>` : ''}
</div></section>` +
        filterbar(s, list) +
        `<div class="wrap twocol">
  <div>${resultsBlock(s, list, esc(title), true).replace('<div class="wrap">', '<div>')}</div>
  <aside class="side">
    ${HAS_VIEWS ? `<div class="panel"><h4>Most viewed${c ? ' here' : ''}</h4><ul>${sort(all, 'popular').slice(0, 5).map(t => `<li><a href="${href(t)}">${esc(t.title)}</a><small>${fmtNum(t.views)} views</small></li>`).join('')}</ul></div>` : ''}
    <div class="panel"><h4>Browse by platform</h4><ul class="cats">${ORDER.map(x => ({ x, n: inCat(x).length })).filter(o => o.n).map(({ x, n }) => `<li><a href="${catHref(x)}" ${x === id ? 'style="color:var(--cyan-ink)"' : ''}>${esc(PLATFORM[x].title)}</a><span>${n}</span></li>`).join('')}</ul></div>
  </aside>
</div>` + footer();
      document.title = `${title} · Cytron Tutorials`;
      wireHeader(); wireFilters(s, draw);
      if (keepFocus) { const q = document.querySelector('[data-q]'); q.focus(); try { q.setSelectionRange(pos, pos); } catch (e) { } }
    };
    draw();
  }

  /* ---------- article ---------- */
  function fixLinks(html) {
    return html.replace(/href="\/tutorial\/([^"#?]+)"/g, (m, slug) => `href="${ROOT}/tutorial.html?slug=${slug}"`).replace(/href="\/(?!\/)/g, `href="${LIVE}/`).replace(/src="\/(?!\/)/g, `src="${LIVE}/`).replace(/ style="text-align:\s*justify;?"/g, '').replace(/<p>(\s|&nbsp;)*<\/p>/g, '');
  }
  function renderDetail() {
    const slug = qs('slug', ''); const t = bySlug[slug]; const app = document.getElementById('app');
    if (!t) { app.innerHTML = header() + `<div class="wrap" style="padding:40px 24px"><h1>Tutorial not found</h1><p><a href="${ROOT}/index.html">Back to tutorials</a></p></div>` + footer(); wireHeader(); return; }
    document.title = `${t.title} · Cytron Tutorials`;
    const art = ARTICLES[slug]; const pc = primaryCat(t); const parent = pc ? (pc.parentId ? catById[pc.parentId] : pc) : null;
    const idx = T.indexOf(t); const newer = T[idx - 1], older = T[idx + 1];
    let body = art ? fixLinks(art.body) : `<div class="notice"><strong>Body not mirrored in this prototype.</strong> Five sample articles carry their full text; every other post has its real title, cover, author, level, categories, tags and view count. <a href="${LIVE}/tutorial/${esc(slug)}" target="_blank" rel="noopener">Read the original on my.cytron.io ↗</a></div><h2>Introduction</h2><p>${esc(t.excerpt || '')}</p>`;
    const toc = []; body = body.replace(/<h2>(.*?)<\/h2>/g, (m, txt) => { const id = 'h-' + toc.length + '-' + txt.replace(/<[^>]+>/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); toc.push([id, txt.replace(/<[^>]+>/g, '')]); return `<h2 id="${id}">${txt}</h2>`; });
    const related = parent ? sort(T.filter(x => x !== t && x.categories.some(id => id === parent.id || catById[id]?.parentId === parent.id)), HAS_VIEWS ? 'popular' : 'latest').slice(0, 4) : [];
    app.innerHTML = header(parent ? parent.id : null) + `
<div class="wrap"><ul class="crumbs"><li><a href="${ROOT}/index.html">Tutorials</a></li>${parent ? `<li><a href="${catHref(parent.id)}">${esc(parent.name)}</a></li>` : ''}${pc && pc.parentId ? `<li><a href="${catHref(parent.id, pc.id)}">${esc(pc.name)}</a></li>` : ''}<li>${esc(t.title)}</li></ul></div>
<div class="wrap article-wrap">
  <article class="article">
    <div class="kind"><span class="type">${esc(TYPE_LABEL[t.type] || t.type || 'Post')}</span>${t.level ? `<span class="lvl ${t.level}">${esc(t.level)}</span>` : ''}</div>
    <h1>${esc(t.title)}</h1>
    <div class="byline"><span>By <b>${esc(t.author || '')}</b></span><span>${esc(t.date || '')}</span>${t.views != null ? `<span class="mono">${fmtNum(t.views)} views</span>` : ''}${t.words ? `<span class="mono">${readTime(t.words)}</span>` : ''}
      <div class="actions"><button type="button" class="act" data-like aria-pressed="false" aria-label="Like">${I.heart}<span data-like-n>${t.likes ?? 0}</span></button><button type="button" class="act" data-bookmark aria-pressed="false" aria-label="Bookmark">${I.bookmark}</button><button type="button" class="act" data-share aria-label="Share">${I.share}<span class="tip" data-share-tip hidden>Link copied</span></button></div></div>
    ${(art && art.hero) || t.hero ? `<img class="hero-img" src="${esc((art && art.hero) || t.hero)}" alt="">` : ''}
    <div class="prose">${body}</div>
    <div class="prevnext">${older ? `<a href="${href(older)}"><small>‹ Older</small>${esc(older.title)}</a>` : '<span></span>'}${newer ? `<a class="next" href="${href(newer)}"><small>Newer ›</small>${esc(newer.title)}</a>` : ''}</div>
  </article>
  <aside class="side">
    ${toc.length > 1 ? `<div class="panel"><h4>On this page</h4><ul class="toc">${toc.map(([id, txt]) => `<li><a href="#${id}">${txt}</a></li>`).join('')}</ul></div>` : ''}
    ${art && art.products && art.products.length ? `<div class="panel"><h4>Hardware you'll need</h4><ul class="hw">${art.products.map(p => `<li><img loading="lazy" src="${esc(p.img)}" alt=""><div><a class="n" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a><div class="p">${esc(p.price)}${p.oldPrice ? `<s>${esc(p.oldPrice)}</s>` : ''} · ${esc((p.qty || '').replace('x ', '×'))}${p.stock ? ` · ${esc(p.stock)}` : ''}</div></div></li>`).join('')}</ul><a class="btn btn-primary" style="width:100%;margin-top:14px" href="${LIVE}/" target="_blank" rel="noopener">Add all to cart</a></div>` : ''}
    ${(t.tags || []).length ? `<div class="panel"><h4>Tags</h4><div class="tagrow">${t.tags.map(tag => `<a href="${ROOT}/category.html?q=${encodeURIComponent(tag)}">${esc(tag)}</a>`).join('')}</div></div>` : ''}
    ${parent ? `<div class="panel"><h4>More in ${esc(parent.name)}</h4><ul>${sort(inCat(parent.id).filter(x => x !== t), HAS_VIEWS ? 'popular' : 'latest').slice(0, 5).map(x => `<li><a href="${href(x)}">${esc(x.title)}</a>${x.views != null ? `<small>${fmtNum(x.views)} views</small>` : ''}</li>`).join('')}</ul><a class="viewall" style="margin-top:14px;width:100%;justify-content:center" href="${catHref(parent.id)}">View all →</a></div>` : ''}
  </aside>
</div>
${related.length ? `<section class="related"><div class="wrap"><h2>Related in ${esc(parent.name)}</h2><div class="grid">${related.map(card).join('')}</div></div></section>` : ''}` + footer();
    wireHeader();
    // article actions (prototype: state lives in the page only)
    const like = app.querySelector('[data-like]'), n = app.querySelector('[data-like-n]');
    like.addEventListener('click', () => { const on = like.getAttribute('aria-pressed') !== 'true'; like.setAttribute('aria-pressed', String(on)); n.textContent = (t.likes ?? 0) + (on ? 1 : 0); });
    const bm = app.querySelector('[data-bookmark]');
    bm.addEventListener('click', () => { bm.setAttribute('aria-pressed', String(bm.getAttribute('aria-pressed') !== 'true')); });
    const sh = app.querySelector('[data-share]'), tip = app.querySelector('[data-share-tip]');
    sh.addEventListener('click', async () => { const url = `${LIVE}/tutorial/${slug}`; try { if (navigator.share) { await navigator.share({ title: t.title, url }); return; } await navigator.clipboard.writeText(url); } catch (e) { } tip.hidden = false; setTimeout(() => { tip.hidden = true; }, 1600); });
  }

  window.NEWC = { renderHome, renderCategory, renderDetail };
})();
