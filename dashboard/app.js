/* Tutorial Category Cleanup — GitHub Pages build.
   Storage layer talks to an Apps Script web app backed by a Google Sheet.
   Everything else is the same board as the claude.ai version. */
(function () {
  "use strict";

  var BUILD = '20261006a';   // keep in step with the ?v= in index.html
  var CFG = window.DASHBOARD_CONFIG || {};
  var F = {id:0,title:1,slug:2,prio:3,current:4,add:5,quest:6,reason:7,type:8,level:9,date:10,views:11,tags:12,dept:13,drop:14};
  var BAND = {1:{key:'p1',label:'No category'},2:{key:'p2',label:'Needs an edit'},
              4:{key:'p4',label:'Check only'},0:{key:'p0',label:'No change needed'}};
  var STATUS = [['todo','To do'],['doing','In progress'],['done','Done'],['skip','Skipped']];
  /* The four routed by tools/departments.py, plus anything added in config.js.
     A department set here is an override: it wins over the routed value and is
     saved to the sheet, so it survives every rebuild of data/tutorials.json. */
  var BASE_DEPTS = ['Industry','Education','Commerce','Unassigned'];
  var DEPTS = BASE_DEPTS.concat((CFG.extraDepartments||[]).filter(function(d){
    return BASE_DEPTS.indexOf(d) < 0; }));
  var DEPT_CLASS = {Industry:'d-ind', Education:'d-edu', Commerce:'d-com', Unassigned:'d-una'};
  function deptClass(d){ return DEPT_CLASS[d] || 'd-oth'; }
  function cssId(d){ return String(d).replace(/[^A-Za-z0-9_-]/g, '_'); }

  var ROWS = [], CATS = [], byId = Object.create(null), SOURCE = '';
  var state = Object.create(null);
  var pending = Object.create(null), timers = Object.create(null);
  var online = false, writable = false, lastSync = 0;
  var view = {band:'all', dept:'all', q:'', status:'', owner:'', sort:'prio', showDone:false};
  var shown = 60, openId = null;

  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function rec(id){ return state[id] || null; }
  function statusOf(r){ var s=rec(r[F.id]); if (s && s.status) return s.status; return r[F.prio]===0?'clean':'todo'; }
  function labelOf(st){ if (st==='clean') return 'No change';
    for (var i=0;i<STATUS.length;i++) if (STATUS[i][0]===st) return STATUS[i][1]; return st; }
  function splitCats(s){ return s ? s.split(', ').filter(Boolean) : []; }
  /* Done and Skipped are both "dealt with": they drop out of the lists and the counts. */
  function finished(r){ var st=statusOf(r); return st==='done' || st==='skip'; }
  function autoDept(r){ return r[F.dept] || 'Unassigned'; }
  /* The department that counts: a human's override if there is one, else the routed guess. */
  function deptOf(r){ var s=rec(r[F.id]); return (s && s.dept) ? s.dept : autoDept(r); }
  function deptOverridden(r){ var s=rec(r[F.id]); return !!(s && s.dept && s.dept !== autoDept(r)); }
  /* The ticked categories. null means "nobody has touched this row", which is why an
     empty array must stay an empty array — unticking everything is a real answer. */
  /* What the post should end up with: what it has, minus what the house rule takes off,
     plus what is suggested. This is what the chips are pre-ticked to. */
  function suggestedCats(r){
    var off = splitCats(r[F.drop]);
    return splitCats(r[F.current]).filter(function(c){ return off.indexOf(c)<0; })
           .concat(splitCats(r[F.add]));
  }
  function appliedCats(r){ var s=rec(r[F.id]); return (s && s.applied) ? s.applied : suggestedCats(r); }
  function catsTouched(r){ var s=rec(r[F.id]); return !!(s && s.applied); }
  function tutorialUrl(slug){ return (CFG.tutorialUrl||'{slug}').replace('{slug}', encodeURIComponent(slug)); }
  function setLive(cls, txt){ var n=el('live'); n.className='livedot '+cls; el('liveTxt').textContent=txt; }

  /* Copy to clipboard, with a fallback for the contexts where the async API is unavailable
     (an http origin, or the page opened straight off disk). */
  function copyText(text, btn){
    function done(ok){
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = ok ? 'copied' : 'press Ctrl+C';
      btn.classList.add(ok ? 'ok' : 'warn');
      setTimeout(function(){ btn.textContent = old; btn.classList.remove('ok','warn'); }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ legacy(); });
    } else legacy();
    function legacy(){
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly','');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove(); done(ok);
    }
  }

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
                       applied: row.applied || null, dept: row.dept||'', ts: row.ts||0};
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
             status:body.status, owner:body.owner, note:body.note, applied:body.applied,
             dept:body.dept, ts:body.ts})
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
                applied:prev.applied||null, dept:prev.dept||'', ts:Date.now()};
    for (var k in patch) next[k] = patch[k];
    state[id] = next; pending[id] = next;
    render(); refreshOwners();
    clearTimeout(timers[id]);
    timers[id] = setTimeout(function(){ flush(id); }, 400);
  }

  /* -------------------------------------------------------------- summary */

  function summarise(){
    var need=0, done=0, doing=0, skip=0, bands={0:0,1:0,2:0,4:0}, left=0;
    for (var i=0;i<ROWS.length;i++){
      var r=ROWS[i], st=statusOf(r);
      // The chips count what is still OUTSTANDING. Mark a row Done and it leaves its band
      // straight away, so "Uncategorised 18" drops to 17 without waiting for a re-scrape.
      if (!finished(r)) left++;
      if (view.showDone || !finished(r)) bands[r[F.prio]] = (bands[r[F.prio]]||0)+1;
      if (r[F.prio]===0) continue;
      need++;
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
    el('cAll').textContent = view.showDone ? ROWS.length : left;
    el('c1').textContent = bands[1]; el('c2').textContent = bands[2];
    el('c4').textContent = bands[4]; el('c0').textContent = bands[0];
    var dn = {}; DEPTS.forEach(function(d){ dn[d]=0; });
    for (var j=0;j<ROWS.length;j++){ var dd = deptOf(ROWS[j]);
      if (ROWS[j][F.prio] && (view.showDone || !finished(ROWS[j]))) dn[dd] = (dn[dd]||0)+1; }
    DEPTS.forEach(function(d){ var n = el('dc-'+cssId(d)); if (n) n.textContent = dn[d]||0; });
    var da = el('dc-all'); if (da) da.textContent = DEPTS.reduce(function(a,d){return a+(dn[d]||0);},0);
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
      // Finished rows leave the board, unless you asked to see them — either with the
      // "Show finished" toggle or by filtering the status down to Done / Skipped.
      if (!view.showDone && view.status!=='done' && view.status!=='skip' && finished(r)) return false;
      if (view.band!=='all' && r[F.prio]!==Number(view.band)) return false;
      if (view.dept!=='all' && deptOf(r)!==view.dept) return false;
      if (view.status && statusOf(r)!==view.status) return false;
      if (view.owner){ var s=rec(r[F.id]); if (!s || s.owner!==view.owner) return false; }
      if (q){
        var hay = (r[F.title]+' '+r[F.slug]+' '+r[F.tags]+' '+r[F.current]+' '+r[F.add]+' '+deptOf(r)).toLowerCase();
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
    var cur = r[F.current] || '(none)';
    var line;
    if (catsTouched(r)) line = '<b>Ticked:</b> ' + esc(s.applied.join(', ') || '(none)');
    else {
      line = '<b>'+esc(cur)+'</b>';
      if (r[F.add])  line += ' <span class="sep">→ add</span> <span class="add">'+esc(r[F.add])+'</span>';
      if (r[F.drop]) line += ' <span class="sep">→ remove</span> <span class="drop">'+esc(r[F.drop])+'</span>';
      if (r[F.quest]) line += ' <span class="quest">· check '+esc(r[F.quest])+'</span>';
    }
    var dep = deptOf(r);

    return '<article class="row '+band+(openId===id?' open':'')+'" data-id="'+id+'">'
      // A div, not a button: the title inside has to be selectable so it can be dragged over
      // and copied into the admin. role/tabindex/keydown put the keyboard behaviour back.
      + '<div class="rhead" data-act="toggle" role="button" tabindex="0" aria-expanded="'+(openId===id)+'">'
        + '<span class="stripe"></span>'
        + '<span class="pillcell"><span class="pill s-'+st+'">'+esc(labelOf(st))+'</span></span>'
        + '<span class="rmain"><span class="titlerow"><span class="rtitle">'+esc(r[F.title])+'</span>'
          + '<button class="copybtn" data-act="copytitle" title="Copy this title">copy</button></span>'
          + '<span class="rmeta">'+esc(r[F.type])+(r[F.level]?' <span class="sep">·</span> '+esc(r[F.level]):'')
          + ' <span class="sep">·</span> '+esc(r[F.date])+'</span>'
          + '<span class="catline">'+line+'</span></span>'
        + '<span class="rright">'
          + '<span class="dept-tag '+deptClass(dep)+(deptOverridden(r)?' set':'')+'" title="'
            + (deptOverridden(r) ? 'Set by hand · auto-routed to '+esc(autoDept(r)) : 'Auto-routed') + '">'
            + esc(dep) + (deptOverridden(r)?'<i class="pin">●</i>':'') + '</span>'
          + (s.owner?'<span class="owner-tag">'+esc(s.owner)+'</span>':'')
          + '<span class="views">'+Number(r[F.views]).toLocaleString()+' views</span>'
          + (s.note?'<span class="views">note</span>':'')
        + '</span>'
      + '</div>'
      + (openId===id ? editorHTML(r) : '')
      + '</article>';
  }

  function editorHTML(r){
    var id=r[F.id], s=rec(id)||{}, st=statusOf(r);
    var applied = appliedCats(r);
    var sug = suggestedCats(r), curCats = splitCats(r[F.current]), dropCats = splitCats(r[F.drop]);
    function chip(c){
      var on = applied.indexOf(c.name)>=0;
      var off = dropCats.indexOf(c.name)>=0;
      var mark = off ? ' off' : (curCats.indexOf(c.name)>=0 ? ' on-cms' : (sug.indexOf(c.name)>=0 ? ' sug' : ''));
      var why = off ? 'House rule says take this one off'
              : (curCats.indexOf(c.name)>=0 ? 'Already on the post in the CMS'
              : (sug.indexOf(c.name)>=0 ? 'Suggested by the keyword rules' : ''));
      return '<button class="cat'+(c.parent?' child':'')+mark+'" data-act="cat" data-cat="'+esc(c.name)+'"'
        + (why?' title="'+why+'"':'') + ' aria-pressed="'+on+'">'+esc(c.name)+'</button>';
    }
    // One wrapping group per top-level category, so the picker reads like the CMS tree
    // instead of one long flat run of 45 chips.
    var groups = [], g = null;
    CATS.forEach(function(c){
      if (!c.parent){ g = [c]; groups.push(g); }
      else if (g) g.push(c);
    });
    var chips = groups.map(function(grp){
      return '<div class="catgrp">' + grp.map(chip).join('') + '</div>';
    }).join('');
    var sbtns = STATUS.map(function(p){
      return '<button class="sbtn v-'+p[0]+'" data-act="status" data-v="'+p[0]+'" aria-pressed="'+(st===p[0])+'">'+p[1]+'</button>';
    }).join('');
    var dep = deptOf(r);
    var dbtns = DEPTS.map(function(d){
      return '<button class="dbtn '+deptClass(d)+'" data-act="dept" data-v="'+esc(d)+'" aria-pressed="'
        + (dep===d) + '">'+esc(d)+'</button>';
    }).join('');
    return '<div class="editor">'
      + (r[F.reason] ? '<div class="reasonbox"><strong>Why it is flagged:</strong> '+esc(r[F.reason])+'</div>'
                     : '<div class="reasonbox">Nothing flagged — title, excerpt and tags all agree with the categories on it.</div>')
      + '<div class="ed-grid">'
        + '<div class="field"><label>Status</label><div class="statusrow">'+sbtns+'</div></div>'
        + '<div class="field"><label>Who is on it</label>'
          + '<input type="text" data-act="owner" list="ownerList" value="'+esc(s.owner||'')+'" placeholder="Name or initials"'+(writable?'':' disabled')+'></div>'
      + '</div>'
      + '<div class="field"><label>Department</label><div class="statusrow">'+dbtns+'</div>'
        + '<p class="hint">' + (deptOverridden(r)
            ? 'Set by hand. Auto-routing said <b>'+esc(autoDept(r))+'</b> — '
              + '<button class="linkbtn" data-act="deptauto">put it back</button>.'
            : 'Auto-routed from its categories, title and tags. Click any department to overrule it — '
              + 'your choice is saved and survives every rebuild.') + '</p></div>'
      + '<div class="field"><label>Categories to apply in the CMS</label><div class="cats">'+chips+'</div>'
        + '<p class="hint">Solid = already on the post · dashed = suggested. Tick what it should end up with, '
          + 'then copy that into the admin. '
          + (catsTouched(r) ? '<button class="linkbtn" data-act="catreset">reset to the suggestion</button>' : '')
          + '</p></div>'
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
    if (act==='copytitle'){
      ev.preventDefault(); ev.stopPropagation();
      copyText((byId[id]||[])[F.title]||'', t);
      return;
    }
    if (act==='toggle'){
      // Finishing a drag-selection over the title still fires a click; don't treat that as a tap.
      var sel = window.getSelection && window.getSelection();
      if (sel && String(sel).length > 1 && art.contains(sel.anchorNode)) return;
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
      var r = byId[id];
      var list = appliedCats(r).slice();
      var name = t.dataset.cat, i = list.indexOf(name);
      if (i>=0) list.splice(i,1); else list.push(name);
      // Keep the tree order so the list always reads the way the CMS picker does.
      var order = {}; CATS.forEach(function(c,ix){ order[c.name]=ix; });
      list.sort(function(a,b){ return (order[a]==null?1e9:order[a]) - (order[b]==null?1e9:order[b]); });
      save(id, {applied:list});
      return;
    }
    if (act==='catreset'){ save(id, {applied:null}); return; }
    if (act==='dept'){
      // Clicking the department it is already on clears the override.
      var v = t.dataset.v;
      save(id, {dept: deptOf(byId[id])===v ? '' : v});
      return;
    }
    if (act==='deptauto'){ save(id, {dept:''}); return; }
  });

  /* .rhead is a div now, so Enter / Space have to be wired up by hand. */
  document.addEventListener('keydown', function(ev){
    if (ev.key!=='Enter' && ev.key!==' ') return;
    var t = ev.target;
    if (!t.dataset || t.dataset.act!=='toggle') return;
    ev.preventDefault();
    t.click();
  });

  document.addEventListener('input', function(ev){
    var t = ev.target;
    if (!t.dataset || (t.dataset.act!=='owner' && t.dataset.act!=='note')) return;
    var art = t.closest('.row'); if (!art) return;
    var id = art.dataset.id;
    var prev = state[id] || {};
    var next = {status:prev.status||'', owner:prev.owner||'', note:prev.note||'',
                applied:prev.applied||null, dept:prev.dept||'', ts:Date.now()};
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
  /* Built here rather than in the HTML so an extra department added to config.js
     gets a filter chip without anyone touching index.html. */
  (function buildDeptChips(){
    var host = el('deptChips'); if (!host) return;
    host.innerHTML = '<button class="chip" data-dept="all" aria-pressed="true">All <span class="n" id="dc-all"></span></button>'
      + DEPTS.map(function(d){
          return '<button class="chip" data-dept="'+esc(d)+'" aria-pressed="false"><i class="dotc '
            + deptClass(d)+'"></i>'+esc(d)+' <span class="n" id="dc-'+cssId(d)+'"></span></button>';
        }).join('');
  })();
  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-dept]'), function(b){
    b.addEventListener('click', function(){
      view.dept = b.dataset.dept; shown = 60;
      Array.prototype.forEach.call(document.querySelectorAll('.chip[data-dept]'), function(o){
        o.setAttribute('aria-pressed', String(o===b)); });
      render();
    });
  });
  el('q').addEventListener('input', function(){ view.q=this.value; shown=60; render(); });
  el('fStatus').addEventListener('change', function(){ view.status=this.value; shown=60; render(); });
  el('fOwner').addEventListener('change', function(){ view.owner=this.value; shown=60; render(); });
  el('fSort').addEventListener('change', function(){ view.sort=this.value; shown=60; render(); });
  el('btnMore').addEventListener('click', function(){ shown+=120; render(); });
  el('btnShowDone').addEventListener('click', function(){
    view.showDone = !view.showDone; shown = 60;
    this.setAttribute('aria-pressed', String(view.showDone));
    this.textContent = view.showDone ? 'Hide finished' : 'Show finished';
    render();
  });

  el('btnCsv').addEventListener('click', function(){
    var head = ['Slug','Title','Department','Dept set by','Auto-routed dept','Priority','Status','Owner',
                'Current categories','Add','Remove','Check','Ticked categories','Note','Reason','Views','URL'];
    function q(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
    var lines = [head.map(q).join(',')];
    filtered().forEach(function(r){
      var s = rec(r[F.id])||{};
      lines.push([r[F.slug], r[F.title], deptOf(r), deptOverridden(r)?'hand':'auto', autoDept(r),
        (BAND[r[F.prio]]||{}).label||'', labelOf(statusOf(r)),
        s.owner||'', r[F.current], r[F.add], r[F.drop], r[F.quest],
        catsTouched(r) ? s.applied.join('; ') : '', s.note||'', r[F.reason],
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

  fetch('data/tutorials.json?v=' + BUILD)
    .then(function(r){ if (!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(payload){
      ROWS = payload.rows; CATS = payload.cats; SOURCE = payload.source || '';
      ROWS.forEach(function(r){ byId[r[F.id]] = r; });
      el('foot').innerHTML = 'Generated ' + esc(payload.generated||'') + ' from ' + esc(SOURCE) + '. '
        + 'Suggestions come from keyword rules over each post’s title, tags and excerpt — article bodies '
        + 'were not read, and 139 posts carry no tags, so treat every row as a candidate for a human decision.'
        + ' <span class="build">build ' + BUILD + '</span>';
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
