/**
 * Tutorial Category Cleanup — backend.
 *
 * A Google Sheet is the database; this script exposes it as a tiny JSON API
 * that the GitHub Pages dashboard reads and writes.
 *
 * Setup is in ../README.md. In short: create a Sheet, Extensions > Apps Script,
 * paste this file, change SECRET below, Deploy > New deployment > Web app,
 * "Execute as: Me", "Who has access: Anyone", copy the /exec URL into config.js.
 */

/** Must match `token` in config.js. Change it to something only your team knows. */
var SECRET = 'change-me';

/** Sheet tab that holds the rows. Created automatically on first write. */
var TAB = 'progress';

var HEADERS = ['id', 'slug', 'title', 'status', 'owner', 'note', 'applied', 'ts', 'updatedAt'];

/* -------------------------------------------------------------------------- */

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB);
  if (!sh) {
    sh = ss.insertSheet(TAB);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowsToObjects_(values) {
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var v = values[i];
    if (!v[0]) continue;
    var applied = [];
    if (v[6]) {
      try { applied = JSON.parse(v[6]); }
      catch (e) { applied = String(v[6]).split(';').map(function (s) { return s.trim(); }).filter(String); }
    }
    out.push({
      id: String(v[0]), slug: String(v[1] || ''), title: String(v[2] || ''),
      status: String(v[3] || ''), owner: String(v[4] || ''), note: String(v[5] || ''),
      applied: applied, ts: Number(v[7] || 0)
    });
  }
  return out;
}

/* ------------------------------------------------------------------ read -- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (SECRET && p.token !== SECRET) return json_({ error: 'bad token' });

  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return json_({ rows: [], serverTime: Date.now() });

  var values = sh.getRange(1, 1, last, HEADERS.length).getValues();
  var rows = rowsToObjects_(values);

  // ?since=<ms> returns only rows touched after that moment — cheaper payload
  // for the dashboard's routine polling.
  var since = Number(p.since || 0);
  if (since) rows = rows.filter(function (r) { return r.ts > since; });

  return json_({ rows: rows, serverTime: Date.now() });
}

/* ----------------------------------------------------------------- write -- */

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ error: 'bad json' }); }

  if (SECRET && body.token !== SECRET) return json_({ error: 'bad token' });
  if (!body.id) return json_({ error: 'missing id' });

  // One writer at a time, so two people saving at once cannot interleave.
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (err) { return json_({ error: 'busy, try again' }); }

  try {
    var sh = sheet_();
    var last = sh.getLastRow();
    var ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
    var rowIndex = -1;
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(body.id)) { rowIndex = i + 2; break; }
    }

    var applied = Array.isArray(body.applied) ? body.applied : [];
    var ts = Number(body.ts) || Date.now();
    var record = [
      String(body.id), String(body.slug || ''), String(body.title || ''),
      String(body.status || ''), String(body.owner || ''), String(body.note || ''),
      JSON.stringify(applied), ts, new Date()
    ];

    if (rowIndex === -1) {
      sh.appendRow(record);
    } else {
      // Ignore a write that is older than what the sheet already has.
      var existingTs = Number(sh.getRange(rowIndex, 8).getValue() || 0);
      if (ts < existingTs) return json_({ ok: true, skipped: 'stale' });
      sh.getRange(rowIndex, 1, 1, HEADERS.length).setValues([record]);
    }
    return json_({ ok: true, id: body.id, ts: ts });
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
