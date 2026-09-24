/* /current — behaviour mirror of the live listing + detail pages.
   Everything renders client-side from ../data/*.js so the whole prototype is static. */
(function () {
  const { T, TAX, ARTICLES, esc, qs, qsAll, catById, bySlug, filter, sort, paginate, LEVEL_COLORS } = window.CY;
  const ROOT = document.documentElement.getAttribute('data-root') || '.';

  /* ---------- shared chrome ---------- */
  const ICON = {
    gear: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    user: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    cart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 2h2.6l1.2 3H21a1 1 0 0 1 .96 1.27l-2.2 8A1 1 0 0 1 18.8 15H8.1l-.6 1.5H19v2H6a1 1 0 0 1-.93-1.37L6.4 13.9 3.9 4H3z"/></svg>',
    chevron: '<svg class="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>',
    bot: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="16" height="11" rx="3"/><circle cx="9" cy="13.5" r="1.3" fill="currentColor"/><circle cx="15" cy="13.5" r="1.3" fill="currentColor"/><path d="M12 8V4M9 4h6"/></svg>',
    chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v11H8l-4 4z"/></svg>'
  };

  function header() {
    return `
<header class="context-store">
  <div class="header-top-wrapper"><div class="container header-top">
    <nav class="context-menu"><a href="https://my.cytron.io/">Store</a><a href="https://my.cytron.io/raspberry-pi-for-industry">Industry</a><a class="selected" href="${ROOT}/index.html">Education</a></nav>
    <div class="system-menu">
      <a href="#" title="Personalize Your Content" onclick="return false">${ICON.gear}</a>
      <a href="#" onclick="return false"><img src="https://static.cytron.io/image/catalog/flags/malaysia.png" alt="Malaysia"><span class="caret"></span></a>
      <a href="#" onclick="return false">${ICON.user}</a>
    </div>
  </div></div>
  <div class="header-bottom-wrapper"><div class="container header-bottom">
    <div class="logo"><a href="https://my.cytron.io/"><img src="https://static.cytron.io/image/catalog/logo/cytron-technologies-200x100.png" alt="Cytron Technologies"></a></div>
    <nav class="main-menu">
      <a href="${ROOT}/index.html">Tutorials</a>
      <div class="dropdown"><a class="menu-link">Resource Hubs</a><div class="dropdown-menu">${['EDU:BIT', 'ZOOM:BIT', 'REKA:BIT RBT Project Kit', 'rero:micro', 'PikaBot', 'EDU PICO'].map(x => `<div class="dropdown-item"><a href="#" onclick="return false">${x}</a></div>`).join('')}</div></div>
      <div class="dropdown"><a class="menu-link">Educational Programs</a><div class="dropdown-menu">${['RAC2026 Competition', 'EDU:BIT Certification Program', 'ZOOM:BIT Certification Program', 'EDU PICO Certification Program'].map(x => `<div class="dropdown-item"><a href="#" onclick="return false">${x}</a></div>`).join('')}</div></div>
      <div class="dropdown"><a class="menu-link">Community</a><div class="dropdown-menu">${['micro:bit', 'Arduino/Maker Boards', 'Raspberry Pi', '3D Printing', 'Nvidia Jetson'].map(x => `<div class="dropdown-item"><a href="#" onclick="return false">${x}</a></div>`).join('')}</div></div>
    </nav>
    <div class="header-search-cart">
      <form class="header-search" action="${ROOT}/index.html" method="get"><input type="text" name="q" placeholder="Search tutorials" maxlength="50" autocomplete="off" value="${esc(qs('q', ''))}"><button type="submit" aria-label="Search">${ICON.search}</button></form>
      <div class="header-cart">${ICON.cart}</div>
    </div>
  </div></div>
</header>`;
  }

  function footer() {
    const cols = [
      ['SUPPORT', ['Request for Warranty/Return', 'Request for Quotation', 'Raspberry Pi Design Partner', 'Register as Teacher', 'Register as Student', 'Register as Training Partner', 'Contact Us']],
      ['ABOUT', ['About Us', 'Delivery Information', 'Return Policy', 'Cytron Membership', 'Payment Options', 'CytronCash', 'My Coupons', 'Privacy Policy', 'Terms & Conditions', 'Site Map', 'Careers at Cytron']],
      ['RESOURCES', ['Training Partners', 'Discontinued Items', 'FAQs', 'How to shop at Cytron', '1 to 1 Replacement Warranty']]
    ];
    return `
<footer>
  <div class="container">
    <div class="footer-cols">
      ${cols.map(([h, ls]) => `<div><h3>${h}</h3><ul>${ls.map(l => `<li><a href="#" onclick="return false">${l}</a></li>`).join('')}</ul></div>`).join('')}
      <div><h3>FOLLOW US</h3><ul class="footer-social">${['Facebook', 'Youtube', 'Telegram', 'Github', 'Instagram', 'TikTok', 'Twitter'].map(l => `<li><a href="#" onclick="return false"><i></i>${l}</a></li>`).join('')}</ul></div>
    </div>
    <div class="footer-contact">
      <div class="flags">${['globe', 'malaysia', 'singapore', 'thailand', 'vietnam'].map(f => `<img src="https://static.cytron.io/image/catalog/flags/${f}.png" alt="${f}">`).join('')}</div>
      <div class="contacts"><a href="mailto:sales@cytron.io">✉ sales@cytron.io</a><a href="#" onclick="return false">WhatsApp +604-548 0668</a></div>
    </div>
  </div>
  <div class="footer-copy"><div class="container">© 2004 - 2026 Cytron Technologies Sdn Bhd (200601035804). All Rights Reserved.</div></div>
</footer>
<div class="floaters"><span>${ICON.bot}</span><span>${ICON.chat}</span></div>`;
  }

  function levelBadge(t) {
    if (!t.level) return '';
    return `<div class="label-post-level" style="background:${LEVEL_COLORS[t.level] || '#27ae60'}">${esc(t.level)}</div>`;
  }

  function card(t) {
    const href = `${ROOT}/tutorial.html?slug=${encodeURIComponent(t.slug)}`;
    return `
<div class="tutorial-card">
  <div class="card-image"><a href="${href}">${t.cover ? `<img loading="lazy" src="${esc(t.cover)}" alt="${esc(t.title)}" title="${esc(t.title)}">` : ''}</a>${levelBadge(t)}</div>
  <div class="card-content">
    <h4 class="card-title"><a href="${href}">${esc(t.title)}</a></h4>
    <div class="card-details">
      <p class="card-author">${esc(t.type || 'Uncategorized')} by <a href="#" onclick="return false">${esc(t.author || '')}</a><br>${esc(t.date || '')}</p>
      <p class="card-description">${esc(t.excerpt || '')}</p>
    </div>
  </div>
</div>`;
  }

  /* Live-site pagination: 1..7 window, then ">" and ">|" */
  function pager(p, buildHref) {
    if (p.pages <= 1) return `<div class="row pagination"><div></div><div class="results">Showing ${p.from} to ${p.to} of ${p.total} (${p.pages} Pages)</div></div>`;
    let start = Math.max(1, Math.min(p.page - 3, p.pages - 6)), end = Math.min(p.pages, start + 6);
    let li = '';
    if (p.page > 1) li += `<li><a href="${buildHref(1)}">|&lt;</a></li><li><a href="${buildHref(p.page - 1)}">&lt;</a></li>`;
    for (let i = start; i <= end; i++) li += i === p.page ? `<li class="active"><span>${i}</span></li>` : `<li><a href="${buildHref(i)}">${i}</a></li>`;
    if (p.page < p.pages) li += `<li><a href="${buildHref(p.page + 1)}">&gt;</a></li><li><a href="${buildHref(p.pages)}">&gt;|</a></li>`;
    return `<div class="row pagination"><div class="links"><ul>${li}</ul></div><div class="results">Showing ${p.from} to ${p.to} of ${p.total} (${p.pages} Pages)</div></div>`;
  }

  /* ---------- sidebar (filters) ---------- */
  function sidebar(state) {
    const catOpts = TAX.categories.map(c =>
      `<div class="multi-select-option"><input type="checkbox" id="c-${c.id}" value="${c.id}" ${state.categories.includes(c.id) ? 'checked' : ''}><label for="c-${c.id}">${esc(c.name)}</label></div>` +
      (c.children || []).map(ch => `<div class="multi-select-option child"><input type="checkbox" id="cc-${ch.id}" value="${ch.id}" ${state.categories.includes(ch.id) ? 'checked' : ''}><label for="cc-${ch.id}">${esc(ch.name)}</label></div>`).join('')
    ).join('');
    const types = [['T', 'Tutorial'], ['P', 'Project'], ['R', 'Protip'], ['education', 'Education'], ['industry', 'Industry']];
    const typeOpts = types.map(([v, n]) => `<div class="multi-select-option"><input type="checkbox" id="t-${v}" value="${v}" ${state.types.includes(v) ? 'checked' : ''}><label for="t-${v}">${n}</label></div>`).join('');
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const selCats = state.categories.map(id => catById[id]?.name).filter(Boolean);
    const selTypes = state.types.map(v => types.find(t => t[0] === v)?.[1]).filter(Boolean);
    return `
<div id="column-right" class="col-sm-3 hidden-xs side-column">
  <div class="blog_categories"><div id="blogsearch" class="search">
    <h4>Search</h4>
    <div class="input-group"><input type="text" id="input-search" placeholder="Keywords" value="${esc(state.q)}"></div>
    <div class="multi-select-wrapper">
      <button type="button" class="dropdown-button" data-toggle="#categoryDropdown"><span class="dropdown-text ${selCats.length ? 'selected' : ''}" id="categoryDropdownText">${selCats.length ? esc(selCats.join(', ')) : 'All Categories'}</span>${ICON.chevron}</button>
      <div class="multi-select-dropdown" id="categoryDropdown">${catOpts}</div>
    </div>
    <div class="multi-select-wrapper">
      <button type="button" class="dropdown-button" data-toggle="#topicDropdown"><span class="dropdown-text ${selTypes.length ? 'selected' : ''}" id="topicDropdownText">${selTypes.length ? esc(selTypes.join(', ')) : 'All Post Types / Topics'}</span>${ICON.chevron}</button>
      <div class="multi-select-dropdown" id="topicDropdown">${typeOpts}</div>
    </div>
    <select name="project_level" id="project_level"><option value="">All Skill Levels</option>${levels.map(l => `<option ${state.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <label class="checkbox"><input type="checkbox" id="include_content" ${state.includeContent ? 'checked' : ''}> Search in tutorial contents</label>
    <input type="button" value="Search" id="button-search" class="btn btn-secondary">
    <div class="search-criteria" id="search-criteria"></div>
  </div></div>
</div>`;
  }

  function readState() {
    return {
      q: qs('q', ''),
      categories: qsAll('categories').map(Number).filter(Boolean),
      types: qsAll('post_type'),
      level: qs('project_level', ''),
      includeContent: qs('include_content', 'true') !== 'false',
      page: parseInt(qs('page', '1'), 10) || 1,
      sort: qs('sort', 'latest')
    };
  }

  function buildQuery(state, overrides) {
    const s = { ...state, ...(overrides || {}) };
    const p = new URLSearchParams();
    if (s.q) p.set('q', s.q);
    if (s.categories.length) p.set('categories', s.categories.join(','));
    if (s.types.length) p.set('post_type', s.types.join(','));
    if (s.level) p.set('project_level', s.level);
    if (!s.includeContent) p.set('include_content', 'false');
    if (s.page > 1) p.set('page', s.page);
    const str = p.toString();
    return `${ROOT}/index.html${str ? '?' + str : ''}`;
  }

  function applyFilters(state) {
    const typeMap = { T: 'Tutorial', P: 'Project', R: 'Protip' };
    const types = state.types.filter(t => typeMap[t]).map(t => typeMap[t]);
    const audience = state.types.filter(t => t === 'education' || t === 'industry');
    return sort(filter({ q: state.q, categories: state.categories, types, levels: state.level ? [state.level] : [], audience, searchTags: state.includeContent }), 'latest');
  }

  /* ---------- listing page ---------- */
  function renderListing() {
    const state = readState();
    const isSearch = state.q || state.categories.length || state.types.length || state.level;
    const list = applyFilters(state);
    const p = paginate(list, state.page, 15);
    document.title = isSearch ? 'Tutorials' : 'Tutorials for Digital Makers';
    const crumbs = `<ul class="breadcrumb"><li><a href="https://my.cytron.io/">Home</a></li><li><a href="${ROOT}/index.html">Tutorials</a></li>${isSearch ? '<li><a href="#">Search</a></li>' : ''}</ul>`;
    document.getElementById('app').innerHTML = header() + `
<div class="container">
  ${crumbs}
  <div class="row eblog">
    <div class="col-sm-9">
      <div class="tutorials-bar"><div class="title">Tutorials</div><select id="sort-by" aria-label="Sort by"><option value="">— Sort By —</option><option value="latest" ${state.sort === 'latest' && qs('sort') ? 'selected' : ''}>Latest</option></select></div>
      <div class="tutorial-grid">${p.items.map(card).join('') || '<p style="grid-column:1/-1;padding:30px 0;color:#777">No tutorials matched your search.</p>'}</div>
      ${pager(p, n => buildQuery(state, { page: n }))}
    </div>
    ${sidebar(state)}
  </div>
</div>` + footer();
    wireSidebar(state);
    document.getElementById('sort-by').addEventListener('change', e => { if (e.target.value) location.href = buildQuery(state, { page: 1 }) + (buildQuery(state, { page: 1 }).includes('?') ? '&' : '?') + 'sort=latest'; });
  }

  function wireSidebar(state) {
    document.querySelectorAll('.dropdown-button').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const dd = document.querySelector(btn.dataset.toggle);
        document.querySelectorAll('.multi-select-dropdown').forEach(d => { if (d !== dd) d.classList.remove('open'); });
        dd.classList.toggle('open');
      });
    });
    document.addEventListener('click', e => { if (!e.target.closest('.multi-select-wrapper')) document.querySelectorAll('.multi-select-dropdown').forEach(d => d.classList.remove('open')); });
    const updateText = (ddSel, textSel, def) => {
      const names = [...document.querySelectorAll(`${ddSel} input:checked`)].map(i => i.nextElementSibling.textContent);
      const el = document.querySelector(textSel); el.textContent = names.length ? names.join(', ') : def; el.classList.toggle('selected', !!names.length);
    };
    document.querySelector('#categoryDropdown').addEventListener('change', () => updateText('#categoryDropdown', '#categoryDropdownText', 'All Categories'));
    document.querySelector('#topicDropdown').addEventListener('change', () => updateText('#topicDropdown', '#topicDropdownText', 'All Post Types / Topics'));
    const go = () => {
      const s = {
        q: document.getElementById('input-search').value.trim(),
        categories: [...document.querySelectorAll('#categoryDropdown input:checked')].map(i => +i.value),
        types: [...document.querySelectorAll('#topicDropdown input:checked')].map(i => i.value),
        level: document.getElementById('project_level').value,
        includeContent: document.getElementById('include_content').checked,
        page: 1
      };
      location.href = buildQuery(s);
    };
    document.getElementById('button-search').addEventListener('click', go);
    document.getElementById('input-search').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    // criteria chips (live site shows these after a search)
    const chips = [];
    if (state.q) chips.push(['q', `"${state.q}"`]);
    state.categories.forEach(id => chips.push(['c' + id, catById[id]?.name || id]));
    state.types.forEach(t => chips.push(['t' + t, ({ T: 'Tutorial', P: 'Project', R: 'Protip', education: 'Education', industry: 'Industry' })[t] || t]));
    if (state.level) chips.push(['l', state.level]);
    document.getElementById('search-criteria').innerHTML = chips.map(([k, label]) => `<span class="search-criterion"><span>${esc(label)}</span><button data-k="${k}" title="Remove">×</button></span>`).join('');
    document.querySelectorAll('.search-criterion button').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k; const s = { ...state, page: 1 };
      if (k === 'q') s.q = ''; else if (k === 'l') s.level = ''; else if (k[0] === 'c') s.categories = s.categories.filter(id => 'c' + id !== k); else if (k[0] === 't') s.types = s.types.filter(t => 't' + t !== k);
      location.href = buildQuery(s);
    }));
  }

  /* ---------- detail page ---------- */
  function renderDetail() {
    const slug = qs('slug', '');
    const t = bySlug[slug];
    const app = document.getElementById('app');
    if (!t) { app.innerHTML = header() + `<div class="container"><p style="padding:40px 0">Tutorial not found. <a href="${ROOT}/index.html">Back to tutorials</a></p></div>` + footer(); return; }
    document.title = t.title;
    const art = ARTICLES[slug];
    const S = window.CY.seriesOf(t); const pos = S ? S.parts.indexOf(t) : -1;   // the live "page tree": prev/next stay inside the series
    const idx = T.indexOf(t); // T is in "latest first" order as scraped
    const newer = S ? S.parts[pos + 1] : T[idx - 1], older = S ? S.parts[pos - 1] : T[idx + 1];
    const link = x => x ? `<a href="${ROOT}/tutorial.html?slug=${encodeURIComponent(x.slug)}"><small>${x === newer ? (S ? 'Next ›' : '‹ Newer') : (S ? '‹ Previous' : 'Older ›')}</small>${esc(x.title)}</a>` : '<span></span>';
    const tree = S ? `<div class="blog_categories page-tree"><h4><a href="${ROOT}/tutorial.html?slug=${encodeURIComponent(S.parts[0].slug)}">${esc(S.title)}</a></h4><ul class="tree">${S.parts.slice(1).map(p => `<li class="${p === t ? 'active' : ''}"><a href="${ROOT}/tutorial.html?slug=${encodeURIComponent(p.slug)}">▸ <span>${esc(p.title)}</span></a></li>`).join('')}</ul></div>` : '';
    const products = (art && art.products && art.products.length) ? `
<h2>Hardware Components</h2>
<div class="product-grid">${art.products.map(p => `<div class="product-thumb">${p.stock ? `<span class="label-outofstock">${esc(p.stock)}</span>` : ''}<a href="${esc(p.url)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(p.img)}" alt="${esc(p.name)}"></a><h4 class="name"><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a></h4><p class="price">${esc(p.price)}${p.oldPrice ? `<span class="price-old">${esc(p.oldPrice)}</span>` : ''}</p><div class="qty">${esc(p.qty || '')}</div><a class="btn-atc" href="#" onclick="return false">Add to Cart</a></div>`).join('')}</div><hr>` : '';
    const body = art ? art.body : `
<div class="not-mirrored"><strong>Article body not mirrored.</strong> Only five sample articles carry their full text in this prototype (to keep it light). Every other card has its real title, cover, author, date, level, categories, tags and view count.<br>Read the original: <a href="https://my.cytron.io/tutorial/${esc(slug)}" target="_blank" rel="noopener">my.cytron.io/tutorial/${esc(slug)}</a></div>
<h2>Introduction</h2><p>${esc(t.excerpt || '')}</p>`;
    app.innerHTML = header() + `
<div class="container">
  <ul class="breadcrumb"><li><a href="https://my.cytron.io/">Home</a></li><li><a href="${ROOT}/index.html">Tutorials</a></li><li><a href="#">${esc(t.title)}</a></li></ul>
  <div class="row">
    <div class="col-sm-9 post-col">
      <div class="openthumb"><img src="${esc((art && art.hero) || t.hero || t.cover || '')}" alt="${esc(t.title)}"></div>
      <h1>${esc(t.title)}</h1>
      <div class="blog-info">
        <ul>
          <li title="Author">👤 <a href="#" onclick="return false">${esc(t.author || '')}</a></li>
          <li title="Published Date">📅 <span>${esc(t.date || '')}</span></li>
          <li title="Post Type">▦ <span>${esc(t.type || '')}</span></li>
          ${t.level ? `<li title="Project Level">◔ <span>${esc(t.level)}</span></li>` : ''}
          ${t.views != null ? `<li title="View Count">👁 <span>${t.views}</span></li>` : ''}
        </ul>
        <ul class="blog-action"><li>♡ <span>${t.likes ?? 0}</span></li><li>🔖</li><li>↗</li></ul>
      </div>
      <div class="post_content"><div id="blog-description">${body}</div></div>
      <div class="post-page-nav">${link(older)}${link(newer)}</div>
      ${products}
    </div>
    <div class="col-sm-3 side-column">
      ${tree}
      <div class="search tags"><h4>Tags</h4><ul>${(t.tags || []).map(tag => `<li><a href="${ROOT}/index.html?q=${encodeURIComponent(tag)}">${esc(tag)}</a></li>`).join('') || '<li style="color:#999;font-size:13px">No tags</li>'}</ul></div>
    </div>
  </div>
</div>` + footer();
  }

  window.CURRENT = { renderListing, renderDetail };
})();
