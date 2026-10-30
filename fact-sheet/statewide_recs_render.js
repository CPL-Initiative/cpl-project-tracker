/* Fact Sheet — the "consumer wedge": under each statewide exhibit <li> in
   #statewide-exhibits, surface its AUTHORITATIVE statewide credit recommendations
   (course title — units, with the C-ID when known) as a small collapsible list.

   Data: window.CPL_STATEWIDE_RECS (fact-sheet/statewide_recs.js, built by
   fact-sheet/_build_statewide_recs.py from statewide_data.js — recs collected
   from raw `Collaborative Type == "CCC"` rows only, the one MAP-published
   statewide exhibit per credential). Keyed by the exact exhibit title, which is
   the text of each <li class? no> inside a `.sw-list`.

   A rec that carries `id` (the MAP exhibit that publishes it, listed on MAP's
   CPL Opportunities page) gets a Request Quick Adopt link to that exhibit's
   card. Sam, 2026-10-30: Request Quick Adopt needs no MAP sign-in and asks a
   college initiator to adopt; Quick Adopt needs one and starts the approval
   queue. The address comes from map_links.js (CPL_MAP_LINKS.url), the one
   builder; without it, no link.

   Each program area's list comes from the daily statewide catalog
   (fact-sheet/statewide_catalog.json, built from MAP's data by
   _build_statewide_catalog.py) and shows only the exhibits that carry at least
   one credit recommendation (Sam, 2026-10-30: "Exhibits need at least one credit
   recommendation to show here"); the area's Exhibits figure and the total follow
   the list. The list typed into index.html stands in until the catalog loads, and
   stays when it cannot.

   Self-contained, READ-ONLY (no Supabase, no auth), escapes all text, idempotent
   (re-running never double-appends). The Curate overlay (factsheet_edit.js)
   edits only this section's own prose, never the exhibit lists, so this never
   collides with an edit. Exhibits with no statewide rec simply get no wedge. */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Normalize an exhibit title for matching: trim + collapse internal whitespace +
  // lowercase. (The <li> text and the data keys are the same authored strings, but
  // be tolerant of stray whitespace / case.)
  function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase(); }

  function unitLabel(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    return u + ' ' + (u === '1' || u === '1.0' ? 'unit' : 'units');
  }

  // De-dupe recs by (title, units, cid) — the source can repeat a course across
  // adopting colleges.
  function dedupe(recs) {
    var seen = {}, out = [];
    (recs || []).forEach(function (r) {
      if (!r) return;
      var k = norm(r.t) + '|' + String(r.u || '') + '|' + String(r.cid || '');
      if (seen[k]) return;
      seen[k] = 1; out.push(r);
    });
    return out;
  }

  // Build the normalized-title → recs lookup from CPL_STATEWIDE_RECS.
  function buildIndex(data) {
    var idx = {};
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(function (title) {
        var recs = dedupe(data[title]);
        if (recs.length) idx[norm(title)] = recs;
      });
    }
    return idx;
  }

  // Request Quick Adopt for one rec, or '' when it carries no listed exhibit.
  function adoptLinkHtml(r) {
    var ml = window.CPL_MAP_LINKS, id = String((r && r.id) || '').trim();
    if (!id || !ml || typeof ml.url !== 'function') return '';
    return ' <a class="sw-rec-adopt" href="' + esc(ml.url(id)) + '" target="_blank" rel="noopener">'
      + 'Request Quick Adopt<span class="sw-rec-sr"> for ' + esc(r.t) + ' in MAP, exhibit ' + esc(id)
      + ' (opens in a new tab)</span></a>';
  }

  function recListHtml(recs) {
    var items = recs.map(function (r) {
      var cid = String(r.cid || '').trim();
      var bits = '';
      if (cid) bits += '<span class="sw-rec-cid">' + esc(cid) + '</span> ';
      bits += '<span class="sw-rec-t">' + esc(r.t) + '</span>';
      var ul = unitLabel(r.u);
      if (ul) bits += ' <span class="sw-rec-u">— ' + esc(ul) + '</span>';
      bits += adoptLinkHtml(r);
      return '<li>' + bits + '</li>';
    }).join('');
    return '<ul class="sw-rec-list" hidden>' + items + '</ul>';
  }

  function injectCss() {
    if (document.getElementById('sw-rec-css')) return;
    var css = ''
      + '.sw-rec{display:block;margin:3px 0 2px;}'
      // Controls are underlined words (Sam, 2026-10-09): underlined at rest, no caret (S436 UI pass).
      + '.sw-rec-tg{font:inherit;font-size:.78rem;font-weight:600;color:var(--cobalt);background:none;border:0;'
        + 'padding:1px 0;min-height:24px;cursor:pointer;display:inline-flex;align-items:center;'
        + 'text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;}'
      + '.sw-rec-tg:hover{text-decoration-thickness:2px;}'
      + '.sw-rec-list{list-style:none;margin:4px 0 6px;padding:6px 0 4px 14px;'
        + 'border-left:2px solid var(--border-strong);}'
      + '.sw-rec-list li{margin:2px 0;font-size:.8rem;line-height:1.4;color:var(--muted);}'
      + '.sw-rec-cid{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.02em;'
        + 'color:var(--ink);background:var(--surface-muted);'
        + 'border:1px solid var(--border-strong);border-radius:4px;padding:0 4px;margin-right:2px;}'
      + '.sw-rec-t{color:var(--ink);}'
      + '.sw-rec-u{color:var(--muted);white-space:nowrap;}'
      // A control is an underlined word, 24px tall (Sam, 2026-10-09). position:relative
      // keeps the screen-reader span inside the link.
      + '.sw-rec-adopt{position:relative;display:inline-flex;align-items:center;min-height:24px;'
        + 'margin-left:4px;font-size:.76rem;font-weight:600;color:var(--cobalt);white-space:nowrap;'
        + 'text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;}'
      + '.sw-rec-adopt:hover{text-decoration-thickness:2px;}'
      + '.sw-rec-adopt:focus-visible{outline:2px solid var(--cobalt);outline-offset:2px;}'
      + '.sw-rec-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;'
        + 'clip:rect(0 0 0 0);white-space:nowrap;border:0;}'
      // Print: show every rec list (collapsed-on-screen detail is irrelevant on paper).
      + '@media print{.sw-rec-list{display:block!important;}.sw-rec-tg,.sw-rec-adopt{display:none;}}';
    var st = document.createElement('style');
    st.id = 'sw-rec-css';
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
  }

  // Rebuild each program area's list from the catalog: the exhibits with at least
  // one recommendation line, in the catalog's order. An area the catalog omits, or
  // one where none carries a line, keeps its baked list. Returns the areas rebuilt.
  function applyCatalog(cat) {
    var section = document.getElementById('statewide-exhibits');
    if (!section || !cat || !Array.isArray(cat.sectors)) return 0;
    var by = {};
    cat.sectors.forEach(function (sec) { if (sec && sec.sector) by[sec.sector] = sec; });
    var dets = section.querySelectorAll('details[data-sector]'), done = 0, total = 0;
    Array.prototype.forEach.call(dets, function (det) {
      var sec = by[det.getAttribute('data-sector')], ul = det.querySelector('ul.sw-list');
      var items = sec ? (sec.items || []).filter(function (it) { return it && it.title && (it.lines || []).length; }) : [];
      if (!ul || !items.length) {
        total += ul ? ul.children.length : 0;
        return;
      }
      ul.innerHTML = items.map(function (it) { return '<li>' + esc(it.title) + '</li>'; }).join('');
      det.setAttribute('data-listed', String(items.length));
      var col = det.querySelector('summary .sw-col[data-col="ex"]');
      if (col) col.textContent = String(items.length);
      var sum = det.querySelector('summary');
      var lab = sum && sum.getAttribute('aria-label');
      if (lab) sum.setAttribute('aria-label', lab.replace(/: [\d,]+ statewide exhibits/, ': ' + items.length + ' statewide exhibits'));
      total += items.length;
      done++;
    });
    var tot = section.querySelector('.sw-total');
    var tcol = tot && tot.querySelector('.sw-col[data-tcol="ex"]');
    if (done && tcol) { tcol.textContent = total.toLocaleString('en-US'); tot.setAttribute('data-listed', String(total)); }
    return done;
  }

  function loadCatalog() {
    if (typeof fetch !== 'function') return;
    fetch('./statewide_catalog.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cat) { if (applyCatalog(cat)) render(); })
      .catch(function () {});
  }

  function render() {
    var idx = buildIndex(window.CPL_STATEWIDE_RECS);
    var section = document.getElementById('statewide-exhibits');
    if (!section || !Object.keys(idx).length) return;
    injectCss();
    var lis = section.querySelectorAll('ul.sw-list > li');
    Array.prototype.forEach.call(lis, function (li) {
      if (li.getAttribute('data-sw-rec') === '1') return;          // idempotent
      // The exhibit title is the li's own text BEFORE we append anything.
      var title = (li.textContent || '').trim();
      var recs = idx[norm(title)];
      if (!recs) return;
      li.setAttribute('data-sw-rec', '1');
      var n = recs.length;
      var wrap = document.createElement('span');
      wrap.className = 'sw-rec';
      wrap.innerHTML =
        '<button type="button" class="sw-rec-tg" aria-expanded="false">'
          + n + ' statewide credit rec' + (n === 1 ? '' : 's')
        + '</button>'
        + recListHtml(recs);
      var btn = wrap.querySelector('.sw-rec-tg');
      var list = wrap.querySelector('.sw-rec-list');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (open) list.setAttribute('hidden', ''); else list.removeAttribute('hidden');
      });
      li.appendChild(wrap);
    });
  }

  function boot() { render(); loadCatalog(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Test / inspection surface.
  window.CPL_STATEWIDE_RECS_RENDER = {
    render: render, applyCatalog: applyCatalog, _buildIndex: buildIndex, _dedupe: dedupe, _adoptLinkHtml: adoptLinkHtml,
    _norm: norm, _esc: esc, _unitLabel: unitLabel
  };
})();
