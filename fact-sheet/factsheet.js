/* ===========================================================================
   CPL Fact Sheet — live data binding
   ---------------------------------------------------------------------------
   This standalone page renders fully from baked HTML (so it is readable with
   JS disabled or the feed unreachable). On load it fetches the same
   live_metrics.json that COBI/the daily cron publishes, and overwrites the
   six headline KPIs + their Military/Workforce/Apprentice breakdowns with the
   current systemwide numbers. No build step, no server — the page is the
   "routine": open it (data refreshes), then Print / Save as PDF.
   =========================================================================== */
(function () {
  'use strict';

  // The date the baked-in fallback numbers were captured (used only if the
  // live feed can't be reached). Keep in step with the values in index.html.
  var SNAPSHOT_DATE = '2026-06-25';

  // live_metrics.json sits one level up, served from the same GitHub Pages
  // origin as this page (…/cpl-project-tracker/fact-sheet/ → …/live_metrics.json).
  var METRICS_URL = '../live_metrics.json';
  // Snapshot tier — the exhibit/recommendation counts the COBI cards show,
  // emitted daily by excel_to_dashboard.py (NOT in live_metrics.json).
  var SNAPSHOT_URL = '../fact_sheet_metrics.json';

  // metric title (UPPER) -> bind-key prefix
  var TITLE_KEY = {
    'STUDENTS SERVED': 'students',
    'ELIGIBLE UNITS': 'eligible',
    'TRANSCRIBED UNITS': 'transcribed',
    'SAVINGS': 'savings',
    '20-YEAR IMPACT': 'impact',
    'ACTIVE COLLEGES': 'colleges'
  };
  // breakdown label (lower) -> bind-key suffix
  var BD_KEY = {
    'military': 'military',
    'workforce/other': 'workforce',
    'workforce': 'workforce',
    'apprentice': 'apprentice',
    'leading colleges': 'leading',
    'leading': 'leading',
    'advancing colleges': 'advancing',
    'advancing': 'advancing',
    'inactive colleges': 'inactive',
    'inactive': 'inactive'
  };

  function $(sel, root) { return (root || document).querySelector(sel); }

  function formatDate(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function apply(values) {
    var nodes = document.querySelectorAll('[data-bind]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-bind');
      if (Object.prototype.hasOwnProperty.call(values, key) && values[key] != null && values[key] !== '') {
        nodes[i].textContent = values[key];
      }
    }
  }

  function dateValues(asOf, iso) {
    return {
      'as_of_label': 'data current as of ' + asOf,
      'as_of_inline': 'as of ' + asOf,
      'as_of_inline2': '(as of ' + asOf + ')',
      'as_of_iso': iso || asOf
    };
  }

  function setChip(state, text) {
    var chip = $('#live-chip');
    var txt = $('#live-chip-text');
    if (txt) txt.textContent = text;
    if (chip) chip.classList.toggle('stale', state === 'stale');
  }

  function buildValues(data) {
    var values = {};
    var metrics = (data && data.metrics) || [];
    for (var i = 0; i < metrics.length; i++) {
      var m = metrics[i];
      var key = TITLE_KEY[String(m.title || '').trim().toUpperCase()];
      if (!key) continue;
      if (m.value != null && m.value !== '') values[key + '.total'] = String(m.value);
      var bds = m.breakdowns || [];
      for (var j = 0; j < bds.length; j++) {
        var sk = BD_KEY[String(bds[j].label || '').trim().toLowerCase()];
        if (sk && bds[j].value != null && bds[j].value !== '') values[key + '.' + sk] = String(bds[j].value);
      }
    }
    return values;
  }

  function wirePrint() {
    var btn = $('#btn-print');
    if (btn) btn.addEventListener('click', function () { window.print(); });
  }

  function num(n) { var v = Number(n); return isNaN(v) ? String(n) : v.toLocaleString('en-US'); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function setCol(det, col, val) {
    var c = det.querySelector('summary .sw-col[data-col="' + col + '"]');
    if (c && val != null) c.textContent = num(val);
  }
  // The statewide grid is a CSS pseudo-table — a screen reader reading a <summary>
  // hears bare numbers with no column meaning. Give each <summary> a full-sentence
  // aria-label built from its current cell values (WCAG 1.3.1). Re-run after the
  // live snapshot updates the cells so the spoken label never goes stale.
  function colText(det, col) {
    var c = det.querySelector('summary .sw-col[data-col="' + col + '"]');
    return c ? (c.textContent || '').trim() : '';
  }
  function labelSectors() {
    var dets = document.querySelectorAll('details[data-sector]');
    for (var i = 0; i < dets.length; i++) {
      var det = dets[i], summary = det.querySelector('summary');
      if (!summary) continue;
      var secEl = summary.querySelector('.sw-sec');
      var name = secEl ? (secEl.textContent || '').trim() : (det.getAttribute('data-sector') || 'Program area');
      summary.setAttribute('aria-label', name + ': ' + colText(det, 'ex') + ' statewide exhibits, ' +
        colText(det, 'rec') + ' credit recommendations, ' + colText(det, 'adopt') + ' adoptions, ' +
        colText(det, 'could') + ' colleges could adopt');
    }
  }
  function setTCol(tot, col, val) {
    var c = tot.querySelector('.sw-col[data-tcol="' + col + '"]');
    if (c && val != null) c.textContent = num(val);
  }

  // Bind the snapshot tier (the 5 exhibit/recommendation KPI cards + the
  // Statewide Exhibits per-sector table) from fact_sheet_metrics.json. Same
  // source COBI's headline cards use, so they never diverge. Baked HTML stands
  // in if the file is absent.
  function loadSnapshot() {
    fetch(SNAPSHOT_URL, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var cr = d.credit_recommendations || {}, me = d.map_exhibits || {},
            sw = d.statewide_exhibits || {}, ac = d.articulating_colleges || {},
            vs = d.veteran_sprint || {};
        apply({
          'cr.total': cr.total, 'cr.ccc': cr.ccc, 'cr.local': cr.local,
          'me.total': me.total, 'me.ccc': me.ccc, 'me.local': me.local, 'me.orig': me.originating_colleges,
          'sw.total': sw.total, 'sw.program_areas': sw.program_areas, 'sw.distinct_recs': sw.distinct_credit_recs,
          'sw.adoptions': sw.adoptions, 'sw.adopting': sw.adopting_colleges, 'sw.could_total': sw.could_adopt_total,
          'ac.total': ac.total, 'ac.orig': ac.originating, 'ac.adopting_ccc': ac.adopting_ccc,
          'vs.star': vs.star_colleges, 'vs.basic': vs.basic_training_colleges
        });
        var bt = $('#cr-by-type');
        if (bt && cr.by_type && cr.by_type.length) bt.textContent = 'By type — ' + cr.by_type.join(' · ');

        // Per-sector columns inside each collapsible header + the total row.
        var sectors = sw.by_sector || [];
        if (sectors.length) {
          var bySec = {}, te = 0, tr = 0, ta = 0;
          sectors.forEach(function (s) {
            bySec[s.sector] = s;
            te += (+s.exhibits || 0); tr += (+s.credit_recs || 0); ta += (+s.adoptions || 0);
          });
          var dets = document.querySelectorAll('details[data-sector]');
          for (var j = 0; j < dets.length; j++) {
            var s2 = bySec[dets[j].getAttribute('data-sector')];
            if (!s2) continue;
            setCol(dets[j], 'ex', s2.exhibits); setCol(dets[j], 'rec', s2.credit_recs);
            setCol(dets[j], 'adopt', s2.adoptions); setCol(dets[j], 'could', s2.could_adopt);
          }
          var tot = $('.sw-total');
          if (tot) { setTCol(tot, 'ex', te); setTCol(tot, 'rec', tr); setTCol(tot, 'adopt', ta); }
          labelSectors();   // refresh the per-sector screen-reader labels with live values
        }
      })
      .catch(function (err) {
        if (window.console && console.warn) console.warn('[fact-sheet] snapshot metrics unavailable:', err && err.message);
      });
  }

  // Make every content section (those with an <h2>) collapsible. Expanded by
  // default; print forces all open (see factsheet.css @media print).
  function setupCollapse() {
    var secs = document.querySelectorAll('main > section');
    for (var i = 0; i < secs.length; i++) {
      (function (sec) {
        var h = sec.querySelector('h2');
        if (!h || h.parentNode !== sec) return;
        h.classList.add('sec-toggle');
        h.setAttribute('role', 'button');
        h.setAttribute('tabindex', '0');
        h.setAttribute('aria-expanded', 'true');
        function toggle() {
          var collapsed = sec.classList.toggle('collapsed');
          h.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        }
        h.addEventListener('click', toggle);
        h.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
      })(secs[i]);
    }
    var btn = $('#btn-collapse-all');
    if (btn) btn.addEventListener('click', function () {
      var anyOpen = !!document.querySelector('main > section:not(.collapsed) > h2.sec-toggle');
      var s = document.querySelectorAll('main > section');
      for (var k = 0; k < s.length; k++) {
        var th = s[k].querySelector('h2.sec-toggle');
        if (th && th.parentNode === s[k]) {
          s[k].classList.toggle('collapsed', anyOpen);
          th.setAttribute('aria-expanded', anyOpen ? 'false' : 'true');
        }
      }
      btn.textContent = anyOpen ? '⊞ Expand all' : '⊟ Collapse all';
    });
  }

  // Expand every <details> (the statewide sector lists) for print/PDF, restore after.
  function setupPrintExpand() {
    var opened = [];
    function expand() {
      opened = [];
      var nodes = document.querySelectorAll('details:not([open])');
      for (var i = 0; i < nodes.length; i++) { nodes[i].open = true; opened.push(nodes[i]); }
    }
    function restore() {
      for (var i = 0; i < opened.length; i++) { opened[i].open = false; }
      opened = [];
    }
    window.addEventListener('beforeprint', expand);
    window.addEventListener('afterprint', restore);
    if (window.matchMedia) {
      var mq = window.matchMedia('print');
      if (mq.addEventListener) mq.addEventListener('change', function (e) { e.matches ? expand() : restore(); });
    }
  }

  /* A horizontally scrolling container can be dragged with a mouse but is
     UNREACHABLE by keyboard unless it is focusable (WCAG 2.1.1 Keyboard). The
     funding table is 674px wide and lives in `.tbl-wrap{overflow-x:auto}`,
     which is why it does not push the page sideways — and also why a keyboard
     user could not see its right-hand columns at all.

     Focusable ONLY while it actually overflows: on a wide screen the same
     element would otherwise be a tab stop that does nothing, which is its own
     small failure. Re-checked on resize, because which state it is in depends
     on the viewport. The accessible name comes from the table's own <caption>
     so it is never invented here, and the "(scrollable)" suffix tells a screen
     reader user what the region is FOR — a region with a name but no purpose is
     just another thing to tab past. Applied to every .tbl-wrap, so a
     reviewer-added table inherits it. */
  function setupScrollRegions() {
    var wraps = document.querySelectorAll('.tbl-wrap');
    if (!wraps.length) return;
    function sync() {
      for (var i = 0; i < wraps.length; i++) {
        var w = wraps[i];
        if (w.scrollWidth > w.clientWidth + 1) {
          if (!w.getAttribute('aria-label')) {
            var cap = w.querySelector('caption');
            var name = cap ? (cap.textContent || '').replace(/\s+/g, ' ').trim() : '';
            w.setAttribute('aria-label', (name || 'Data table') + ' (scrollable)');
          }
          w.setAttribute('role', 'region');
          w.setAttribute('tabindex', '0');
        } else {
          w.removeAttribute('tabindex');
          w.removeAttribute('role');
        }
      }
    }
    sync();
    window.addEventListener('resize', sync);
  }

  function load() {
    wirePrint();
    setupPrintExpand();
    setupCollapse();
    setupScrollRegions();
    labelSectors();   // baked-value labels first; loadSnapshot() refreshes them live
    loadSnapshot();

    fetch(METRICS_URL, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var values = buildValues(data);
        var asOf = formatDate(data && data.scraped_at);
        if (asOf) {
          var dv = dateValues(asOf, data.scraped_at);
          for (var k in dv) { if (Object.prototype.hasOwnProperty.call(dv, k)) values[k] = dv[k]; }
        }
        apply(values);
        setChip('live', asOf ? ('Live · updated ' + asOf) : 'Live data');
      })
      .catch(function (err) {
        // Feed unreachable — keep the baked snapshot values, just label them honestly.
        var asOf = formatDate(SNAPSHOT_DATE) || 'a recent date';
        apply(dateValues(asOf, SNAPSHOT_DATE));
        setChip('stale', 'Snapshot · ' + asOf);
        if (window.console && console.warn) console.warn('[fact-sheet] live metrics unavailable:', err && err.message);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
