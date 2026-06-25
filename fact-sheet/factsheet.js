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

  function load() {
    wirePrint();

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
