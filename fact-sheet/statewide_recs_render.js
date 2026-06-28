/* Fact Sheet — the "consumer wedge": under each statewide exhibit <li> in
   #statewide-exhibits, surface its AUTHORITATIVE statewide credit recommendations
   (course title — units, with the C-ID when known) as a small collapsible list.

   Data: window.CPL_STATEWIDE_RECS (fact-sheet/statewide_recs.js, built by
   fact-sheet/_build_statewide_recs.py from statewide_data.js — recs collected
   from raw `Collaborative Type == "CCC"` rows only, the one MAP-published
   statewide exhibit per credential). Keyed by the exact exhibit title, which is
   the text of each <li class? no> inside a `.sw-list`.

   Self-contained, READ-ONLY (no Supabase, no auth), escapes all text, idempotent
   (re-running never double-appends). #statewide-exhibits is EXCLUDED from the
   Curate overlay (factsheet_edit.js), so this never collides with an edit.
   Exhibits with no statewide rec simply get no wedge. */
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

  function recListHtml(recs) {
    var items = recs.map(function (r) {
      var cid = String(r.cid || '').trim();
      var bits = '';
      if (cid) bits += '<span class="sw-rec-cid">' + esc(cid) + '</span> ';
      bits += '<span class="sw-rec-t">' + esc(r.t) + '</span>';
      var ul = unitLabel(r.u);
      if (ul) bits += ' <span class="sw-rec-u">— ' + esc(ul) + '</span>';
      return '<li>' + bits + '</li>';
    }).join('');
    return '<ul class="sw-rec-list" hidden>' + items + '</ul>';
  }

  function injectCss() {
    if (document.getElementById('sw-rec-css')) return;
    var css = ''
      + '.sw-rec{display:block;margin:3px 0 2px;}'
      + '.sw-rec-tg{font:inherit;font-size:.78rem;color:var(--accent,#1c5d99);background:none;border:0;'
        + 'padding:1px 0;cursor:pointer;display:inline-flex;align-items:center;gap:4px;}'
      + '.sw-rec-tg:hover{text-decoration:underline;}'
      + '.sw-rec-tg .sw-rec-ar{font-size:.7rem;transition:transform .12s;}'
      + '.sw-rec-tg[aria-expanded="true"] .sw-rec-ar{transform:rotate(90deg);}'
      + '.sw-rec-list{list-style:none;margin:4px 0 6px;padding:6px 0 4px 14px;'
        + 'border-left:2px solid var(--border-strong,#d9d4c8);}'
      + '.sw-rec-list li{margin:2px 0;font-size:.8rem;line-height:1.4;color:var(--muted,#555);}'
      + '.sw-rec-cid{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.02em;'
        + 'color:var(--ink,#1a1a2e);background:var(--surface-muted,#f0ede6);'
        + 'border:1px solid var(--border-strong,#d9d4c8);border-radius:4px;padding:0 4px;margin-right:2px;}'
      + '.sw-rec-t{color:var(--ink,#1a1a2e);}'
      + '.sw-rec-u{color:var(--muted,#555);white-space:nowrap;}'
      // Print: show every rec list (collapsed-on-screen detail is irrelevant on paper).
      + '@media print{.sw-rec-list{display:block!important;}.sw-rec-tg{display:none;}}';
    var st = document.createElement('style');
    st.id = 'sw-rec-css';
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
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
          + '<span class="sw-rec-ar">▸</span>'
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();

  // Test / inspection surface.
  window.CPL_STATEWIDE_RECS_RENDER = {
    render: render, _buildIndex: buildIndex, _dedupe: dedupe,
    _norm: norm, _esc: esc, _unitLabel: unitLabel
  };
})();
