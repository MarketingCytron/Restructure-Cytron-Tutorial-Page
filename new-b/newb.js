/* /new-b — Option B (Random-Nerd-Tutorials-style). Static, client-rendered from ../data/*.js.
   Pages: index.html (hub), category.html?id=N, tutorial.html?slug=S */
(function () {
  const { T, TAX, ARTICLES, esc, qs, qsAll, catById, bySlug, filter, sort, paginate, fmtNum, readTime } = window.CY;
  const ROOT = document.documentElement.getAttribute('data-root') || '.';
  const LIVE = 'https://my.cytron.io';
  const PER = 24;

  /* Board chips shown in the row under the header: parent id → short label. Order = archive size. */
  const CHIPS = [[2, 'Raspberry Pi'], [1, 'Arduino'], [13, 'ESP32 & IoT'], [19, 'Maker boards'], [16, 'Sensors'], [28, 'Industry'], [4, 'micro:bit'], [10, '3D printing'], [7, 'Robotics'], [11, 'NVIDIA AI'], [31, 'Robot kits']];
  const SECTION_TITLE = { 2: 'Raspberry Pi Projects', 1: 'Arduino Projects', 13: 'ESP32 & IoT Projects', 19: 'Maker Board Projects', 16: 'Sensor & Component Guides', 28: 'Industrial Guides', 4: 'micro:bit Projects', 10: '3D Printing Guides', 7: 'Robotics Guides', 11: 'NVIDIA Jetson Projects', 31: 'Robot Kit Guides', 24: 'News & Events' };
  const BLURB = { 2: 'Raspberry Pi single-board computers, Pico microcontrollers, cameras, HATs and edge AI.', 1: 'Arduino boards, Maker UNO, Maker Nano and the classic getting-started projects.', 13: 'ESP32, Maker ESP32, LoRa, MQTT dashboards and cloud services.', 19: 'Maker boards, Teensy, PIC and Python for microcontrollers.', 16: 'Sensors, modules and DIY electronics fundamentals.', 28: 'IRIV industrial controllers, LoRaWAN and factory-floor monitoring.', 4: 'micro:bit and Cytron’s classroom kits — EDU:BIT, REKA:BIT and SUMO:BIT.', 10: 'Designing enclosures, mounts and parts for your builds.', 7: 'Motor drivers, rero and the mechanics of making things move.', 11: 'Jetson Nano and Orin NX — computer vision and AI at the edge.', 31: 'Sumo, soccer, line-following and battle robot kits.', 24: 'News, seminars and workshops.' };
  const TYPE_LABEL = { Tutorial: 'Tutorial', Project: 'Project', Protip: 'Protip', 'Success Stories': 'Success story' };
  const HAS_VIEWS = T.some(t => t.views != null);
  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    burger: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };
  const latest = list => sort(list, 'latest');
  const inCat = id => filter({ categories: [id] });
  const href = t => `${ROOT}/tutorial.html?slug=${encodeURIComponent(t.slug)}`;
  const catHref = (id, sub) => `${ROOT}/category.html?id=${id}${sub ? '&cat=' + sub : ''}`;

  /* ---------- chrome ---------- */
  function header(activeCat) {
    const dd = (label, items) => `<details><summary>${label}</summary><div>${items.map(x => `<a href="#" onclick="return false">${x}</a>`).join('')}</div></details>`;
    return `
<div class="bar"><div class="wrap">
  <a class="logo" href="${ROOT}/index.html"><img src="https://static.cytron.io/image/catalog/logo/cytron-technologies-200x100.png" alt="Cytron Technologies"><span>Tutorials</span></a>
  <nav aria-label="Primary">
    ${dd('Resource Hubs', ['EDU:BIT', 'ZOOM:BIT', 'REKA:BIT RBT Project Kit', 'rero:micro', 'PikaBot', 'EDU PICO'])}
    ${dd('Programs', ['RAC2026 Competition', 'EDU:BIT Certification', 'ZOOM:BIT Certification', 'EDU PICO Certification'])}
    ${dd('Community', ['micro:bit', 'Arduino/Maker Boards', 'Raspberry Pi', '3D Printing', 'Nvidia Jetson'])}
    <a href="${LIVE}/">Store</a>
    <form class="search" action="${ROOT}/category.html" method="get" role="search" data-search><input type="search" name="q" placeholder="Search tutorials" aria-label="Search tutorials"><button type="button" aria-label="Search" data-search-toggle>${I.search}</button></form>
  </nav>
  <button class="burger" aria-label="Menu" data-burger>${I.burger}</button>
</div>
<details class="mnav" data-mnav><summary>Menu</summary><div class="wrap">
  <form action="${ROOT}/category.html" method="get" role="search"><input type="search" name="q" placeholder="Search tutorials" aria-label="Search tutorials"><button type="submit">Go</button></form>
  <a href="${ROOT}/index.html">Home</a>${CHIPS.map(([id, l]) => `<a href="${catHref(id)}">${l}</a>`).join('')}<a href="${LIVE}/">Store</a>
</div></details></div>
<div class="boards"><div class="wrap"><ul>
  <li><a class="${activeCat === 'home' ? 'on' : ''}" href="${ROOT}/index.html">Home</a></li>
  ${CHIPS.map(([id, l]) => `<li><a class="${activeCat === id ? 'on' : ''}" href="${catHref(id)}">${l}</a></li>`).join('')}
  <li><a class="${activeCat === 'all' ? 'on' : ''}" href="${ROOT}/category.html">All ${fmtNum(T.length)}</a></li>
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
    ${col('Follow', ['Facebook', 'YouTube', 'Telegram', 'GitHub', 'Instagram', 'TikTok'])}
  </div>
  <div class="base"><span>© 2004 – 2026 Cytron Technologies Sdn Bhd (200601035804)</span><span><a href="mailto:sales@cytron.io">sales@cytron.io</a> · WhatsApp +604-548 0668</span></div>
</div></footer>`;
  }
  function wireChrome() {
    const b = document.querySelector('[data-burger]'), m = document.querySelector('[data-mnav]');
    if (b && m) b.addEventListener('click', () => { m.open = !m.open; });
    const sf = document.querySelector('[data-search]');
    if (sf) { const inp = sf.querySelector('input'); sf.querySelector('[data-search-toggle]').addEventListener('click', () => { if (sf.classList.contains('open') && inp.value.trim()) sf.submit(); else { sf.classList.add('open'); inp.focus(); } }); inp.addEventListener('blur', () => { if (!inp.value) sf.classList.remove('open'); }); }
    document.addEventListener('click', e => { document.querySelectorAll('.bar nav details[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }); });
  }

  /* ---------- pieces ---------- */
  function post(t, opts) {
    opts = opts || {};
    return `<article class="post"><a class="thumb" href="${href(t)}" tabindex="-1" aria-hidden="true">${t.cover ? `<img loading="lazy" src="${esc(t.cover)}" alt="">` : ''}${t.level ? `<span class="lvl ${t.level}">${esc(t.level)}</span>` : ''}</a><h3><a href="${href(t)}">${esc(t.title)}</a></h3>${opts.meta ? `<div class="meta">${esc(t.date || '')}${t.views != null ? ' · ' + fmtNum(t.views) + ' views' : ''}${t.type && t.type !== 'Tutorial' ? ' · ' + esc(TYPE_LABEL[t.type] || t.type) : ''}</div>` : ''}${opts.excerpt ? `<p class="ex">${esc(t.excerpt || '')}</p>` : ''}</article>`;
  }
  function section(id, n) {
    const list = inCat(id); if (!list.length) return '';
    const items = latest(list).slice(0, n || 4);
    const kids = (catById[id].children || []).map(ch => ({ ch, n: filter({ categories: [ch.id] }).length })).filter(x => x.n >= 3);
    return `<section class="sec"><div class="wrap">
  <div class="sec-head"><div><h2>${esc(SECTION_TITLE[id] || catById[id].name)}</h2>${kids.length ? `<div class="sub">${kids.map(k => `<a href="${catHref(id, k.ch.id)}">${esc(k.ch.name)} (${k.n})</a>`).join('')}</div>` : ''}</div><a class="viewall" href="${catHref(id)}">View All ${fmtNum(list.length)} »</a></div>
  <div class="grid4">${items.map(t => post(t)).join('')}</div>
  <hr class="sep">
</div></section>`;
  }
  function slider() {
    // RNT leads with "Getting Started" guides — Cytron has plenty. Prefer the most-viewed ones with a hero image.
    let pool = T.filter(t => /getting started|get started|beginner'?s guide|introduction to/i.test(t.title) && t.hero);
    pool = (HAS_VIEWS ? sort(pool, 'popular') : latest(pool)).slice(0, 5);
    if (pool.length < 3) pool = latest(T.filter(t => t.hero)).slice(0, 5);
    return `<div class="slider" data-slider>
  ${pool.map((t, i) => `<div class="slide ${i === 0 ? 'on' : ''}"><img src="${esc(t.hero || t.cover)}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}"><div class="cap"><small>${esc(t.level || 'Guide')} · ${esc(TYPE_LABEL[t.type] || t.type || '')}</small><b>${esc(t.title)}</b><a class="more" href="${href(t)}">Read More »</a></div></div>`).join('')}
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
    auto();
  }

  /* ---------- home ---------- */
  function renderHome() {
    const app = document.getElementById('app');
    const recent = latest(T).slice(0, 5);
    const years = T.map(t => t.iso).filter(Boolean).sort();
    const order = [2, 1, 13, 19, 16, 28, 4, 10, 7, 11, 31, 24];
    app.innerHTML = header('home') + `
<div class="wrap hero">
  ${slider()}
  <div class="latest"><h2>Latest Posts</h2><ul>${recent.map(t => `<li>${t.cover ? `<img loading="lazy" src="${esc(t.cover)}" alt="">` : '<span></span>'}<a href="${href(t)}">${esc(t.title)}</a></li>`).join('')}</ul></div>
</div>
<h1 class="sr-only">Cytron Tutorials — ${fmtNum(T.length)} electronics and digital-making guides</h1>
${order.map(id => section(id)).join('')}
<section class="band"><div class="wrap">
  <h2>Learning kits with their own resource hubs</h2>
  <p class="lead">Each Cytron classroom kit has a dedicated hub with lesson plans, downloads and certification.</p>
  <div class="hubs">${[['EDU:BIT', 'micro:bit starter kit'], ['ZOOM:BIT', 'micro:bit robot car'], ['REKA:BIT', 'RBT project kit'], ['rero:micro', 'Modular robot'], ['PikaBot', 'Line-following robot'], ['EDU PICO', 'Raspberry Pi Pico kit']].map(([n, d]) => `<a class="hub" href="#" onclick="return false"><b>${n}</b><span>${d}</span></a>`).join('')}</div>
  <div class="programs">${['RAC2026 Competition', 'EDU:BIT Certification Program', 'ZOOM:BIT Certification Program', 'EDU PICO Certification Program'].map(p => `<a href="#" onclick="return false">${p}</a>`).join('')}</div>
</div></section>
<div class="wrap stats"><div><b>${fmtNum(T.length)}</b><span>tutorials</span></div><div><b>${TAX.categories.length}</b><span>platforms</span></div><div><b>${fmtNum(T.reduce((a, t) => a + (t.views || 0), 0))}</b><span>reads</span></div><div><b>${years.length ? years[0].slice(0, 4) : ''}</b><span>first post</span></div></div>` + footer();
    document.title = 'Cytron Tutorials | Learn Raspberry Pi, Arduino, ESP32, micro:bit and more';
    wireChrome(); wireSlider();
  }

  /* ---------- category / listing ---------- */
  function renderCategory() {
    const id = parseInt(qs('id', ''), 10) || null;
    const c = id ? TAX.categories.find(x => x.id === id) : null;
    const app = document.getElementById('app');
    const s = { q: qs('q', ''), sub: parseInt(qs('cat', ''), 10) || null, level: qs('level', ''), type: qs('type', ''), sort: qs('sort', 'latest'), page: parseInt(qs('page', '1'), 10) || 1 };
    const draw = (keepFocus) => {
      const scoped = s.sub ? [s.sub] : (id ? [id] : []);
      let list = filter({ q: s.q, categories: scoped, levels: s.level ? [s.level] : [], types: s.type ? [s.type] : [] });
      list = sort(list, s.sort);
      const p = paginate(list, s.page, PER);
      const params = new URLSearchParams(); if (id) params.set('id', id); if (s.sub) params.set('cat', s.sub); if (s.q) params.set('q', s.q); if (s.level) params.set('level', s.level); if (s.type) params.set('type', s.type); if (s.sort !== 'latest') params.set('sort', s.sort); if (p.page > 1) params.set('page', p.page);
      history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : ''));
      const all = id ? inCat(id) : T;
      const kids = c ? (c.children || []).map(ch => ({ ch, n: filter({ categories: [ch.id] }).length })).filter(x => x.n > 0) : [];
      const title = c ? (s.sub ? catById[s.sub].name : (SECTION_TITLE[id] || c.name)) : (s.q ? `Search: “${s.q}”` : 'All Tutorials');
      const focusPos = keepFocus ? document.querySelector('[data-q]')?.selectionStart : null;
      const pages = []; const win = new Set([1, p.pages, p.page - 1, p.page, p.page + 1].filter(i => i >= 1 && i <= p.pages)); let last = 0;
      [...win].sort((a, b) => a - b).forEach(i => { if (i - last > 1) pages.push('<span>…</span>'); pages.push(i === p.page ? `<b>${i}</b>` : `<a href="#" data-page="${i}">${i}</a>`); last = i; });
      app.innerHTML = header(id || 'all') + `
<div class="wrap">
  <div class="crumbs"><a href="${ROOT}/index.html">Home</a>${c ? `<span><a href="${catHref(id)}">${esc(c.name)}</a></span>` : ''}${s.sub ? `<span>${esc(catById[s.sub].name)}</span>` : ''}</div>
  <div class="page-head"><h1>${esc(title)}</h1><p>${c ? esc(BLURB[id] || '') + ' ' : ''}${fmtNum(all.length)} posts${c ? ' in this section' : ' in the archive'}.</p></div>
  <div class="toolbar">
    <input type="search" placeholder="${c ? 'Search in ' + esc(c.name) : 'Search all tutorials'}" value="${esc(s.q)}" data-q aria-label="Search">
    <select data-level aria-label="Skill level"><option value="">All levels</option>${['Beginner', 'Intermediate', 'Advanced'].map(l => `<option ${s.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <select data-type aria-label="Post type"><option value="">All types</option>${['Tutorial', 'Project', 'Protip', 'Success Stories'].map(t => `<option value="${t}" ${s.type === t ? 'selected' : ''}>${TYPE_LABEL[t]}</option>`).join('')}</select>
    <select data-sort aria-label="Sort"><option value="latest" ${s.sort === 'latest' ? 'selected' : ''}>Latest</option>${HAS_VIEWS ? `<option value="popular" ${s.sort === 'popular' ? 'selected' : ''}>Most viewed</option>` : ''}<option value="oldest" ${s.sort === 'oldest' ? 'selected' : ''}>Oldest</option><option value="az" ${s.sort === 'az' ? 'selected' : ''}>A – Z</option></select>
    <span class="n">${fmtNum(p.total)} result${p.total === 1 ? '' : 's'}</span>
    ${kids.length ? `<div class="subs"><a class="${!s.sub ? 'on' : ''}" href="#" data-sub="">All ${all.length}</a>${kids.map(k => `<a class="${s.sub === k.ch.id ? 'on' : ''}" href="#" data-sub="${k.ch.id}">${esc(k.ch.name)} ${k.n}</a>`).join('')}</div>` : ''}
  </div>
  <div class="twocol">
    <div>
      <div class="grid3">${p.items.map(t => post(t, { meta: true, excerpt: true })).join('') || `<div class="empty" style="grid-column:1/-1"><h3>Nothing matches yet</h3><p>Try a different word or clear the filters.</p></div>`}</div>
      ${p.pages > 1 ? `<nav class="pager" aria-label="Pagination">${p.page > 1 ? `<a href="#" data-page="${p.page - 1}">‹</a>` : ''}${pages.join('')}${p.page < p.pages ? `<a href="#" data-page="${p.page + 1}">›</a>` : ''}<span class="info">Showing ${p.from}–${p.to} of ${fmtNum(p.total)}</span></nav>` : ''}
    </div>
    <aside class="side">
      ${HAS_VIEWS ? `<h3>Most viewed${c ? ' here' : ''}</h3><div class="box"><ul>${sort(all, 'popular').slice(0, 5).map(t => `<li><a href="${href(t)}">${esc(t.title)}</a><small>${fmtNum(t.views)} views</small></li>`).join('')}</ul></div>` : ''}
      <h3>Browse by board</h3><div class="box"><ul class="cats">${TAX.categories.map(x => ({ x, n: inCat(x.id).length })).sort((a, b) => b.n - a.n).map(({ x, n }) => `<li><a href="${catHref(x.id)}">${esc(x.name)}</a><span>${n}</span></li>`).join('')}</ul></div>
    </aside>
  </div>
</div>` + footer();
      document.title = `${title} · Cytron Tutorials`;
      wireChrome();
      let tm; const q = document.querySelector('[data-q]');
      q.addEventListener('input', e => { clearTimeout(tm); tm = setTimeout(() => { s.q = e.target.value.trim(); s.page = 1; draw(true); }, 220); });
      document.querySelector('[data-level]').addEventListener('change', e => { s.level = e.target.value; s.page = 1; draw(); });
      document.querySelector('[data-type]').addEventListener('change', e => { s.type = e.target.value; s.page = 1; draw(); });
      document.querySelector('[data-sort]').addEventListener('change', e => { s.sort = e.target.value; s.page = 1; draw(); });
      document.querySelectorAll('[data-sub]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); s.sub = a.dataset.sub ? +a.dataset.sub : null; s.page = 1; draw(); }));
      document.querySelectorAll('[data-page]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); s.page = +a.dataset.page; draw(); document.querySelector('.toolbar').scrollIntoView(); }));
      if (keepFocus) { q.focus(); try { q.setSelectionRange(focusPos, focusPos); } catch (e) { } }
    };
    draw();
  }

  /* ---------- article ---------- */
  function fixLinks(html) {
    return html.replace(/href="\/tutorial\/([^"#?]+)"/g, (m, slug) => `href="${ROOT}/tutorial.html?slug=${slug}"`).replace(/href="\/(?!\/)/g, `href="${LIVE}/`).replace(/src="\/(?!\/)/g, `src="${LIVE}/`).replace(/ style="text-align:\s*justify;?"/g, '').replace(/<p>(\s|&nbsp;)*<\/p>/g, '');
  }
  function renderDetail() {
    const slug = qs('slug', ''); const t = bySlug[slug]; const app = document.getElementById('app');
    if (!t) { app.innerHTML = header() + `<div class="wrap" style="padding:40px 20px"><h1>Tutorial not found</h1><p><a href="${ROOT}/index.html">Back to home</a></p></div>` + footer(); wireChrome(); return; }
    const art = ARTICLES[slug];
    const parentId = t.categories.map(id => catById[id]?.parentId || id).find(Boolean);
    const parent = parentId ? catById[parentId] : null;
    const sub = t.categories.map(id => catById[id]).find(c => c && c.parentId);
    const idx = T.indexOf(t); const newer = T[idx - 1], older = T[idx + 1];
    const body = art ? fixLinks(art.body) : `<div class="notice"><strong>Body not mirrored in this prototype.</strong> Five sample articles carry their full text; every other post has its real title, cover, author, level, categories, tags and view count. <a href="${LIVE}/tutorial/${esc(slug)}" target="_blank" rel="noopener">Read the original on my.cytron.io ↗</a></div><h2>Introduction</h2><p>${esc(t.excerpt || '')}</p>`;
    const related = sort(T.filter(x => x !== t && parent && x.categories.some(id => id === parent.id || catById[id]?.parentId === parent.id)), HAS_VIEWS ? 'popular' : 'latest').slice(0, 4);
    app.innerHTML = header(parent ? parent.id : null) + `
<div class="wrap">
  <div class="crumbs"><a href="${ROOT}/index.html">Home</a>${parent ? `<span><a href="${catHref(parent.id)}">${esc(parent.name)}</a></span>` : ''}${sub ? `<span><a href="${catHref(parent.id, sub.id)}">${esc(sub.name)}</a></span>` : ''}</div>
  <div class="twocol" style="padding-top:10px">
    <article class="article">
      <h1>${esc(t.title)}</h1>
      <div class="meta"><span>By <b>${esc(t.author || '')}</b></span><span>${esc(t.date || '')}</span><span>${esc(TYPE_LABEL[t.type] || t.type || '')}</span>${t.level ? `<span class="lvl ${t.level}">${esc(t.level)}</span>` : ''}${t.views != null ? `<span>${fmtNum(t.views)} views</span>` : ''}${t.words ? `<span>${readTime(t.words)}</span>` : ''}</div>
      ${(art && art.hero) || t.hero ? `<img class="hero-img" src="${esc((art && art.hero) || t.hero)}" alt="">` : ''}
      <div class="prose">${body}</div>
      ${(t.tags || []).length ? `<div class="tags" style="margin-top:26px">${t.tags.map(tag => `<a href="${ROOT}/category.html?q=${encodeURIComponent(tag)}">${esc(tag)}</a>`).join('')}</div>` : ''}
      <div class="prevnext">${older ? `<a href="${href(older)}"><small>‹ Older</small>${esc(older.title)}</a>` : '<span></span>'}${newer ? `<a class="next" href="${href(newer)}"><small>Newer ›</small>${esc(newer.title)}</a>` : ''}</div>
    </article>
    <aside class="side">
      ${art && art.products && art.products.length ? `<h3>Parts used</h3><div class="box"><ul class="hw">${art.products.map(p => `<li><img loading="lazy" src="${esc(p.img)}" alt=""><div><a class="n" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a><div class="p">${esc(p.price)} · ${esc((p.qty || '').replace('x ', '×'))}${p.stock ? ' · ' + esc(p.stock) : ''}</div></div></li>`).join('')}</ul><a class="btn-accent" href="${LIVE}/" target="_blank" rel="noopener">Add all to cart</a></div>` : ''}
      <h3>Latest posts</h3><div class="box"><ul>${latest(T).filter(x => x !== t).slice(0, 5).map(x => `<li><a href="${href(x)}">${esc(x.title)}</a><small>${esc(x.date || '')}</small></li>`).join('')}</ul></div>
      ${parent ? `<h3>More in ${esc(parent.name)}</h3><div class="box"><ul>${sort(inCat(parent.id).filter(x => x !== t), 'popular').slice(0, 5).map(x => `<li><a href="${href(x)}">${esc(x.title)}</a>${x.views != null ? `<small>${fmtNum(x.views)} views</small>` : ''}</li>`).join('')}</ul><a class="viewall" style="display:block;text-align:center;margin-top:10px" href="${catHref(parent.id)}">View All »</a></div>` : ''}
    </aside>
  </div>
  ${related.length ? `<section class="related"><h2>Related ${esc(parent.name)} guides</h2><div class="grid4">${related.map(x => post(x)).join('')}</div></section>` : ''}
</div>` + footer();
    document.title = `${t.title} | Cytron Tutorials`;
    wireChrome();
  }

  window.NEWB = { renderHome, renderCategory, renderDetail };
})();
