/* Tutorial Category Cleanup — GitHub Pages build.
   Storage layer talks to an Apps Script web app backed by a Google Sheet.
   Everything else is the same board as the claude.ai version. */
(function () {
  "use strict";

  var CFG = window.DASHBOARD_CONFIG || {};
  var F = {id:0,title:1,slug:2,prio:3,current:4,add:5,quest:6,reason:7,type:8,level:9,date:10,views:11,tags:12};
  var BAND = {1:{key:'p1',label:'Uncategorised'},2:{key:'p2',label:'Missing category'},
              4:{key:'p4',label:'Review only'},0:{key:'p0',label:'No change needed'}};
  var STATUS = [['todo','To do'],['doing','In progress'],['done','Done'],['skip','Skipped']];

  var ROWS = [], CATS = [], byId = Object.create(null), SOURCE = '';
  var state = Object.create(null);
  var pending = Object.create(null), timers = Object.create(null);
  var online = false, writable = false, lastSync = 0;
  var view = {band:'all', q:'', status:'', owner:'', sort:'prio'};
  var shown = 60, openId = null;

  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function rec(id){ return state[id] || null; }
  function statusOf(r){ var s=rec(r[F.id]); if (s && s.status) return s.status; return r[F.prio]===0?'clean':'todo'; }
  function labelOf(st){ if (st==='clean') return 'No change';
    for (var i=0;i<STATUS.length;i++) if (STATUS[i][0]===st) return STATUS[i][1]; return st; }
  function splitCats(s){ return s ? s.split(', ').filter(Boolean) : []; }
  function tutorialUrl(slug){ return (CFG.tutorialUrl||'{slug}').replace('{slug}', encodeURIComponent(slug)); }
  function setLive(cls, txt){ var n=el('live'); n.className='livedot '+cls; el('liveTxt').textContent=txt; }

  /* ------------------------------------------------------------------ API */

  function apiGet(){
    if (!CFG.apiUrl) return Promise.reject({reason:'unconfigured'});
    var u = CFG.apiUrl + '?token=' + encodeURIComponent(CFG.token||'') + '&t=' + Date.now();
    return fetch(u, {method:'GET'})
      .then(function(r){ if (!r.ok) throw {reason:'http', status:r.status}; return r.json(); })
      .then(function(j){ if (j && j.error) throw {reason:'api', message:j.error}; return j; });
  }

  /* Sent as text/plain on purpose: it keeps the request "simple" so the browser
     does not send a CORS preflight, which Apps Script cannot answer. */
  function apiPost(body){
    if (!CFG.apiUrl) return Promise.reject({reason:'unconfigured'});
    return fetch(CFG.apiUrl, {
      method: 'POST',
      headers: {'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(Object.assign({token: CFG.token||''}, body))
    }).then(function(r){ if (!r.ok) throw {reason:'http', status:r.status}; return r.json(); })
      .then(function(j){ if (j && j.error) throw {reason:'api', message:j.error}; return j; });
  }

  function absorb(rows){
    var changed = false;
    (rows||[]).forEach(function(row){
      if (!row || !row.id) return;
      if (pending[row.id]) return;               // never clobber an unsent local edit
      var cur = state[row.id];
      if (cur && cur.ts >= (row.ts||0)) return;
      state[row.id] = {status:row.status||'', owner:row.owner||'', note:row.note||'',
                       applied: row.applied||[], ts: row.ts||0};
      changed = true;
    });
    return changed;
  }

  function pull(){
    if (!CFG.apiUrl) return;
    apiGet().then(function(j){
      online = true; writable = true;
      if (absorb(j.rows)) { refreshOwners(); render(); } else { summarise(); }
      lastSync = Date.now();
      setLive('on','live · synced ' + new Date(lastSync).toLocaleTimeString());
    }).catch(function(e){
      online = false;
      setLive('off', e && e.reason==='unconfigured' ? 'no backend — read only' : 'offline — retrying');
    });
  }

  function flush(id){
    var body = pending[id]; if (!body) return;
    apiPost({action:'save', id:id, slug:(byId[id]||[])[F.slug]||'', title:(byId[id]||[])[F.title]||'',
             status:body.status, owner:body.owner, note:body.note, applied:body.applied, ts:body.ts})
      .then(function(){
        if (pending[id] && pending[id].ts === body.ts) delete pending[id];
        setLive('on','live · saved ' + new Date().toLocaleTimeString());
      })
      .catch(function(e){
        setLive('off','not saved — ' + (e && (e.message||e.reason) || 'error') + ' · will retry');
        setTimeout(function(){ flush(id); }, 5000);
      });
  }

  function save(id, patch){
    var prev = state[id] || {};
    var next = {status:prev.status||'', owner:prev.owner||'', note:prev.note||'',
                applied:prev.applied||[], ts:Date.now()};
    for (var k in patch) next[k] = patch[k];
    state[id] = next; pending[id] = next;
    render(); refreshOwners();
    clearTimeout(timers[id]);
    timers[id] = setTimeout(function(){ flush(id); }, 400);
  }

  /* -------------------------------------------------------------- summary */

  function summarise(){
    var need=0, done=0, doing=0, skip=0, bands={0:0,1:0,2:0,4:0};
    for (var i=0;i<ROWS.length;i++){
      var r=ROWS[i]; bands[r[F.prio]] = (bands[r[F.prio]]||0)+1;
      if (r[F.prio]===0) continue;
      need++;
      var st=statusOf(r);
      if (st==='done') done++; else if (st==='doing') doing++; else if (st==='skip') skip++;
    }
    el('mDone').textContent = done;
    el('mNeed').textContent = need;
    el('mRest').textContent = (doing||skip) ? '· '+doing+' in progress · '+skip+' skipped' : '';
    if (need){
      el('bDone').style.width = (done/need*100)+'%';
      el('bDoing').style.width = (doing/need*100)+'%';
      el('bSkip').style.width = (skip/need*100)+'%';
    }
    el('cAll').textContent = ROWS.length;
    el('c1').textContent = bands[1]; el('c2').textContent = bands[2];
    el('c4').textContent = bands[4]; el('c0').textContent = bands[0];
  }

  function refreshOwners(){
    var seen={}, list=[];
    for (var k in state){ var o=state[k] && state[k].owner; if (o && !seen[o]){ seen[o]=1; list.push(o); } }
    list.sort();
    var sel=el('fOwner'), cur=sel.value;
    sel.innerHTML = '<option value="">Anyone</option>' + list.map(function(o){
      return '<option value="'+esc(o)+'">'+esc(o)+'</option>'; }).join('');
    if (list.indexOf(cur)>=0) sel.value = cur;
    el('ownerList').innerHTML = list.map(function(o){ return '<option value="'+esc(o)+'"></option>'; }).join('');
  }

  /* --------------------------------------------------------------- filter */

  function filtered(){
    var q = view.q.trim().toLowerCase();
    var out = ROWS.filter(function(r){
      if (view.band!=='all' && r[F.prio]!==Number(view.band)) return false;
      if (view.status && statusOf(r)!==view.status) return false;
      if (view.owner){ var s=rec(r[F.id]); if (!s || s.owner!==view.owner) return false; }
      if (q){
        var hay = (r[F.title]+' '+r[F.slug]+' '+r[F.tags]+' '+r[F.current]+' '+r[F.add]).toLowerCase();
        if (hay.indexOf(q)<0) return false;
      }
      return true;
    });
    if (view.sort==='views') out.sort(function(a,b){ return b[F.views]-a[F.views]; });
    else if (view.sort==='title') out.sort(function(a,b){ return a[F.title].localeCompare(b[F.title]); });
    else if (view.sort==='recent') out.sort(function(a,b){
      return ((rec(b[F.id])||{}).ts||0) - ((rec(a[F.id])||{}).ts||0); });
    return out;
  }

  /* --------------------------------------------------------------- render */

  function rowHTML(r){
    var id=r[F.id], st=statusOf(r), s=rec(id)||{};
    var band = BAND[r[F.prio]] ? BAND[r[F.prio]].key : 'p0';
    var applied = (s.applied && s.applied.length) ? s.applied : null;
    var cur = r[F.current] || '(none)';
    var line;
    if (applied) line = '<b>Applied:</b> ' + esc(applied.join(', '));
    else if (r[F.add]) line = '<b>'+esc(cur)+'</b> <span class="sep">→ add</span> <span class="add">'+esc(r[F.add])+'</span>';
    else line = '<b>'+esc(cur)+'</b>';
    if (r[F.quest] && !applied) line += ' <span class="quest">· check '+esc(r[F.quest])+'</span>';

    return '<article class="row '+band+(openId===id?' open':'')+'" data-id="'+id+'">'
      + '<button class="rhead" data-act="toggle" aria-expanded="'+(openId===id)+'">'
        + '<span class="stripe"></span>'
        + '<span class="pillcell"><span class="pill s-'+st+'">'+esc(labelOf(st))+'</span></span>'
        + '<span class="rmain"><span class="rtitle">'+esc(r[F.title])+'</span>'
          + '<span class="rmeta">'+esc(r[F.type])+(r[F.level]?' <span class="sep">·</span> '+esc(r[F.level]):'')
          + ' <span class="sep">·</span> '+esc(r[F.date])+'</span>'
          + '<span class="catline">'+line+'</span></span>'
        + '<span class="rright">'
          + (s.owner?'<span class="owner-tag">'+esc(s.owner)+'</span>':'')
          + '<span class="views">'+Number(r[F.views]).toLocaleString()+' views</span>'
          + (s.note?'<span class="views">note</span>':'')
        + '</span>'
      + '</button>'
      + (openId===id ? editorHTML(r) : '')
      + '</article>';
  }

  function editorHTML(r){
    var id=r[F.id], s=rec(id)||{}, st=statusOf(r);
    var applied = (s.applied && s.applied.length) ? s.applied
                  : splitCats(r[F.current]).concat(splitCats(r[F.add]));
    var chips = CATS.map(function(c){
      var on = applied.indexOf(c.name)>=0;
      return '<button class="cat'+(c.parent?' child':'')+'" data-act="cat" data-cat="'+esc(c.name)+'" aria-pressed="'+on+'">'+esc(c.name)+'</button>';
    }).join('');
    var sbtns = STATUS.map(function(p){
      return '<button class="sbtn v-'+p[0]+'" data-act="status" data-v="'+p[0]+'" aria-pressed="'+(st===p[0])+'">'+p[1]+'</button>';
    }).join('');
    return '<div class="editor">'
      + (r[F.reason] ? '<div class="reasonbox"><strong>Why it is flagged:</strong> '+esc(r[F.reason])+'</div>'
                     : '<div class="reasonbox">Nothing flagged — title, excerpt and tags all agree with the categories on it.</div>')
      + '<div class="ed-grid">'
        + '<div class="field"><label>Status</label><div class="statusrow">'+sbtns+'</div></div>'
        + '<div class="field"><label>Who is on it</label>'
          + '<input type="text" data-act="owner" list="ownerList" value="'+esc(s.owner||'')+'" placeholder="Name or initials"'+(writable?'':' disabled')+'></div>'
      + '</div>'
      + '<div class="field"><label>Categories applied in the CMS</label><div class="cats">'+chips+'</div></div>'
      + '<div class="field"><label>Note</label>'
        + (writable ? '<textarea data-act="note" placeholder="Anything the next person should know">'+esc(s.note||'')+'</textarea>'
                    : (s.note ? '<p class="note-ro">'+esc(s.note)+'</p>' : '<p class="note-ro">No note.</p>'))
      + '</div>'
      + '<div class="edfoot">'
        + '<a class="linkout" href="'+esc(tutorialUrl(r[F.slug]))+'" target="_blank" rel="noopener">Open tutorial ↗</a>'
        + '<span>'+esc(r[F.slug])+'</span>'
        + (s.ts?'<span>updated '+new Date(s.ts).toLocaleString()+'</span>':'')
      + '</div></div>';
  }

  function render(){
    var rows = filtered(), slice = rows.slice(0, shown);
    el('list').innerHTML = slice.length ? slice.map(rowHTML).join('')
      : '<div class="empty">Nothing matches those filters.</div>';
    el('count').textContent = rows.length + (rows.length===1?' tutorial':' tutorials')
      + (rows.length>slice.length ? ' · showing '+slice.length : '');
    el('btnMore').hidden = rows.length<=slice.length;
    summarise();
  }

  /* --------------------------------------------------------------- events */

  document.addEventListener('click', function(ev){
    var t = ev.target.closest && ev.target.closest('[data-act]'); if (!t) return;
    var art = t.closest('.row'); var id = art && art.dataset.id;
    var act = t.dataset.act;
    if (act==='toggle'){
      openId = (openId===id ? null : id); render();
      if (openId){ var n=document.querySelector('.row[data-id="'+id+'"]'); if (n) n.scrollIntoView({block:'nearest'}); }
      return;
    }
    if (!writable) return;
    if (act==='status'){
      var v=t.dataset.v, curv=(rec(id)||{}).status;
      save(id, {status: curv===v ? '' : v});
      return;
    }
    if (act==='cat'){
      var r = byId[id], s = rec(id) || {};
      var list = (s.applied && s.applied.length) ? s.applied.slice()
                 : splitCats(r[F.current]).concat(splitCats(r[F.add]));
      var name = t.dataset.cat, i = list.indexOf(name);
      if (i>=0) list.splice(i,1); else list.push(name);
      save(id, {applied:list});
      return;
    }
  });

  document.addEventListener('input', function(ev){
    var t = ev.target;
    if (!t.dataset || (t.dataset.act!=='owner' && t.dataset.act!=='note')) return;
    var art = t.closest('.row'); if (!art) return;
    var id = art.dataset.id;
    var prev = state[id] || {};
    var next = {status:prev.status||'', owner:prev.owner||'', note:prev.note||'',
                applied:prev.applied||[], ts:Date.now()};
    next[t.dataset.act] = t.value;
    state[id] = next; pending[id] = next;
    clearTimeout(timers[id]);
    timers[id] = setTimeout(function(){ flush(id); refreshOwners(); }, 700);
  });

  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-band]'), function(b){
    b.addEventListener('click', function(){
      view.band = b.dataset.band; shown = 60;
      Array.prototype.forEach.call(document.querySelectorAll('.chip[data-band]'), function(o){
        o.setAttribute('aria-pressed', String(o===b)); });
      render();
    });
  });
  el('q').addEventListener('input', function(){ view.q=this.value; shown=60; render(); });
  el('fStatus').addEventListener('change', function(){ view.status=this.value; shown=60; render(); });
  el('fOwner').addEventListener('change', function(){ view.owner=this.value; shown=60; render(); });
  el('fSort').addEventListener('change', function(){ view.sort=this.value; shown=60; render(); });
  el('btnMore').addEventListener('click', function(){ shown+=120; render(); });

  el('btnCsv').addEventListener('click', function(){
    var head = ['Slug','Title','Priority','Status','Owner','Current categories','Suggested additions',
                'Applied categories','Note','Reason','Views','URL'];
    function q(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
    var lines = [head.map(q).join(',')];
    filtered().forEach(function(r){
      var s = rec(r[F.id])||{};
      lines.push([r[F.slug], r[F.title], (BAND[r[F.prio]]||{}).label||'', labelOf(statusOf(r)),
        s.owner||'', r[F.current], r[F.add], (s.applied||[]).join('; '), s.note||'', r[F.reason],
        r[F.views], tutorialUrl(r[F.slug])].map(q).join(','));
    });
    var blob = new Blob(['﻿'+lines.join('\r\n')], {type:'text/csv;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cytron-tutorial-progress.csv';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });

  /* ----------------------------------------------------------------- boot */

  function showSetup(msg){
    var n = el('setup'); n.hidden = false; n.innerHTML = msg;
  }

  fetch('data/tutorials.json')
    .then(function(r){ if (!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(payload){
      ROWS = payload.rows; CATS = payload.cats; SOURCE = payload.source || '';
      ROWS.forEach(function(r){ byId[r[F.id]] = r; });
      el('foot').innerHTML = 'Generated ' + esc(payload.generated||'') + ' from ' + esc(SOURCE) + '. '
        + 'Suggestions come from keyword rules over each post’s title, tags and excerpt — article bodies '
        + 'were not read, and 139 posts carry no tags, so treat every row as a candidate for a human decision.';
      render();

      if (!CFG.apiUrl){
        writable = false;
        setLive('off','no backend — read only');
        showSetup('<span><b>Read-only.</b> No backend is configured, so nothing you change here is saved. '
          + 'Set <code>apiUrl</code> in <code>config.js</code> to your Apps Script web app URL — see '
          + '<code>README.md</code> for the five-minute setup.</span>');
        return;
      }
      pull();
      setInterval(function(){
        if (document.visibilityState === 'visible') pull();
      }, Math.max(10, Number(CFG.pollSeconds)||15) * 1000);
      document.addEventListener('visibilitychange', function(){
        if (document.visibilityState === 'visible' && Date.now()-lastSync > 10000) pull();
      });
    })
    .catch(function(e){
      el('list').innerHTML = '<div class="empty">Could not load <code>data/tutorials.json</code> ('
        + esc(e.message||e) + ').<br>If you opened this file directly from disk, run a local server instead: '
        + '<code>python3 -m http.server</code> in this folder, then open http://localhost:8000/</div>';
      setLive('off','no data');
    });
})();
