/* ===========================================================================
   CPL Fact Sheet — "⬇ Word" export (standalone, dependency-free)
   ---------------------------------------------------------------------------
   Serializes the LIVE <main> DOM into a Word-compatible HTML document (.doc
   with the mso namespace headers Word emits for "Save as Web Page, Filtered"),
   so the export reflects exactly what the visitor sees — live KPI numbers, the
   Supabase Curate overrides (added/edited/hidden boxes + images), and the
   statewide rec wedges — with NO build step and NO 334KB docx library, true to
   this page's standalone ethos.

   Why DOM-to-.doc, not docx@8: the content already lives in the rendered HTML;
   re-authoring it as docx primitives would duplicate ~700 lines AND wouldn't
   reflect live data / Curate edits unless we re-walked the DOM anyway. Word
   opens mso-HTML .doc natively. (A "true editable .docx" is a possible follow-up.)

   Clone-not-mutate: we operate on a deep clone of <main>; the on-screen page is
   never touched. Chrome (TOC, curate controls, the live chip, hidden boxes) is
   stripped; collapsibles are expanded; the statewide CSS-grid pseudo-table is
   rebuilt as a real <table> (Word renders tables well, grids poorly); images are
   rewritten to absolute URLs (Word can't resolve ./img/ from a Blob).
   =========================================================================== */
(function () {
  'use strict';

  function abs(u) { try { return new URL(u, document.baseURI).href; } catch (e) { return u || ''; } }
  function strip(root, sel) {
    var n = root.querySelectorAll(sel);
    for (var i = 0; i < n.length; i++) if (n[i].parentNode) n[i].parentNode.removeChild(n[i]);
  }
  function txt(el, sel) { var e = el.querySelector(sel); return e ? (e.textContent || '').trim() : ''; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  // Rebuild the statewide .sw-grid (CSS pseudo-table) as a real <table> so Word
  // keeps the column structure. Each program area becomes a header row + a row
  // holding its exhibit list; the total row is preserved.
  function swGridToTable(clone) {
    var grid = clone.querySelector('.sw-grid');
    if (!grid) return;
    var heads = ['Program area', 'Exhibits', 'Credit recs', 'Adoptions', 'Could adopt'];
    var html = '<table class="data sw-tbl"><thead><tr>';
    heads.forEach(function (h, i) { html += '<th' + (i ? ' class="num"' : '') + '>' + esc(h) + '</th>'; });
    html += '</tr></thead><tbody>';
    var dets = grid.querySelectorAll('details[data-sector]');
    for (var d = 0; d < dets.length; d++) {
      var det = dets[d];
      var name = txt(det, 'summary .sw-sec') || det.getAttribute('data-sector') || '';
      function col(c) { var e = det.querySelector('summary .sw-col[data-col="' + c + '"]'); return e ? (e.textContent || '').trim() : ''; }
      html += '<tr><th scope="row">' + esc(name) + '</th><td class="num">' + esc(col('ex')) +
        '</td><td class="num">' + esc(col('rec')) + '</td><td class="num">' + esc(col('adopt')) +
        '</td><td class="num">' + esc(col('could')) + '</td></tr>';
      var ul = det.querySelector('.sw-list');
      if (ul) html += '<tr><td colspan="5" class="sw-tbl-list">' + ul.innerHTML + '</td></tr>';
    }
    var tot = grid.querySelector('.sw-total');
    if (tot) {
      function tcol(c) { var e = tot.querySelector('.sw-col[data-tcol="' + c + '"], .sw-col[data-bind]'); return e ? (e.textContent || '').trim() : ''; }
      var tName = txt(tot, '.sw-sec') || 'Total';
      var cols = tot.querySelectorAll('.sw-col');
      var vals = [];
      for (var v = 0; v < cols.length; v++) vals.push((cols[v].textContent || '').trim());
      html += '<tr class="total"><th scope="row">' + esc(tName) + '</th>';
      for (var k = 0; k < 4; k++) html += '<td class="num">' + esc(vals[k] || '') + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    grid.parentNode.replaceChild(wrap.firstChild, grid);
  }

  // The print-like CSS subset baked into the .doc <head>. Grid layouts are
  // flattened to block stacks (Word's CSS-grid support is poor); colors are set
  // explicitly (print-color-adjust is irrelevant in Word).
  function docCss() {
    return '' +
      'body{font-family:Cambria,Georgia,serif;color:#1C1C1A;font-size:11pt;line-height:1.4;}' +
      'h1{color:#002F6D;font-size:20pt;margin:0 0 2pt;}' +
      'h2{color:#002F6D;font-size:15pt;border-bottom:1.5pt solid #002F6D;padding-bottom:2pt;margin:16pt 0 6pt;}' +
      'h3{color:#1C1C1A;font-size:12.5pt;margin:12pt 0 4pt;}' +
      'h4{color:#002F6D;font-size:11pt;margin:8pt 0 3pt;}' +
      // Card titles are h3.h-sub on the page (level follows the outline, look stays
      // card-sized) — the export must not suddenly promote them to full h3.
      'h3.h-sub{color:#002F6D;font-size:11pt;margin:8pt 0 3pt;}' +
      'a{color:#002F6D;}' +
      '.eyebrow{font-family:Calibri,sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:9pt;color:#7A5B00;font-weight:bold;}' +
      '.sub{color:#5C5C55;font-size:9.5pt;margin-bottom:6pt;}' +
      '.lede{color:#3A3A36;}' +
      '.kpi-grid,.stat-grid,.res-grid,.team-grid,.cols-2{display:block;}' +
      '.kpi,.stat,.card,.res,.person,.strategy,.note{display:block;border:0.75pt solid #c9c6bd;border-radius:6pt;' +
        'padding:6pt 9pt;margin:6pt 0;font-family:Calibri,sans-serif;}' +
      '.note{background:#F7F5F1;border-left:3pt solid #E3B341;font-size:10pt;color:#3A3A36;}' +
      '.kpi-label{font-size:9pt;font-weight:bold;text-transform:uppercase;color:#5C5C55;}' +
      '.kpi-value{font-size:16pt;font-weight:bold;color:#002F6D;}' +
      '.kpi.savings .kpi-value{color:#2C601A;}' +
      '.kpi-sub,.kpi-fn,.bd .note{font-size:8.5pt;color:#69695F;}' +
      '.bd{display:block;font-size:9.5pt;border-top:0.5pt dotted #ccc;padding:2pt 0;}' +
      '.bd-label{color:#5C5C55;} .bd-val{font-weight:bold;}' +
      '.stat .big{font-size:15pt;font-weight:bold;color:#002F6D;} .stat.green .big{color:#2C601A;}' +
      '.stat .cap{font-size:9.5pt;color:#5C5C55;}' +
      '.res a.res-title{font-weight:bold;color:#002F6D;} .res .res-desc{font-size:9pt;color:#5C5C55;}' +
      '.person .pn{font-weight:bold;} .person .pr{font-size:9pt;color:#5C5C55;} .person .pe{font-size:8.5pt;}' +
      '.strategy{border-top:3pt solid #E3B341;}' +
      'table.data{width:100%;border-collapse:collapse;font-family:Calibri,sans-serif;font-size:9.5pt;}' +
      'table.data th,table.data td{border:0.5pt solid #c9c6bd;padding:4pt 6pt;text-align:left;vertical-align:top;}' +
      'table.data thead th{background:#002F6D;color:#ffffff;}' +
      'table.data td.num,table.data th.num{text-align:right;}' +
      'table.data tr.total td,table.data tr.total th{font-weight:bold;background:#ECE9E2;}' +
      '.sw-tbl-list{font-size:8.5pt;color:#5C5C55;} .sw-tbl-list ul{margin:0;padding-left:14pt;}' +
      '.sw-rec-list{margin:2pt 0 4pt 12pt;font-size:8.5pt;color:#5C5C55;}' +
      'figure{margin:8pt 0;text-align:center;} figure img{max-width:100%;height:auto;}' +
      'figcaption{font-size:8.5pt;color:#5C5C55;text-align:left;margin-top:3pt;}' +
      'ul,ol{margin:4pt 0 6pt;} li{margin:1.5pt 0;}' +
      '.foot{font-size:8.5pt;color:#5C5C55;margin-top:14pt;border-top:0.5pt solid #ccc;padding-top:6pt;}';
  }

  function asOf() {
    // Prefer the live "data current as of …" label; else the chip; else today.
    var lbl = document.querySelector('[data-bind="as_of_label"]');
    var t = lbl ? (lbl.textContent || '') : '';
    var m = /as of (.+)$/i.exec(t.trim());
    return m ? m[1] : '';
  }
  function stamp() {
    try { return new Date().toISOString().slice(0, 10); } catch (e) { return 'export'; }
  }

  // Build the full Word document HTML string from the live DOM (clone-not-mutate).
  function buildDoc() {
    var main = document.querySelector('main');
    if (!main) return null;
    var clone = main.cloneNode(true);

    // Strip chrome / non-content.
    strip(clone, '.no-print, #contents, script, style');
    strip(clone, '.fs-del, .fs-add, .fs-add-img, .fs-imgbar, .fs-dock, #btn-curate, #live-chip, .actionbar');
    strip(clone, '.sw-rec-tg');                 // the rec-wedge toggle buttons (lists stay, shown)
    strip(clone, '.fs-ov-hidden');              // reviewer-hidden boxes / sections don't belong in the doc
    strip(clone, '.fs-withheld');               // source-level withheld sections (the .fs-withheld utility)
                                                //   — remove BEFORE the [hidden] un-hide below, else they'd reappear

    // Expand everything for a flat printed document.
    var col = clone.querySelectorAll('.collapsed');
    for (var i = 0; i < col.length; i++) col[i].classList.remove('collapsed');
    var hid = clone.querySelectorAll('[hidden]');
    for (var h = 0; h < hid.length; h++) hid[h].removeAttribute('hidden');
    var dets = clone.querySelectorAll('details');
    for (var d = 0; d < dets.length; d++) dets[d].setAttribute('open', '');

    // Statewide pseudo-table → real table (after un-hiding its lists).
    swGridToTable(clone);

    // Absolute image URLs; clamp any oversized inline width.
    var imgs = clone.querySelectorAll('img');
    for (var g = 0; g < imgs.length; g++) {
      imgs[g].setAttribute('src', abs(imgs[g].getAttribute('src')));
      var w = parseInt(imgs[g].getAttribute('width') || '0', 10);
      if (w > 620) imgs[g].setAttribute('width', '620');
      imgs[g].removeAttribute('loading'); imgs[g].removeAttribute('referrerpolicy');
    }
    // Drop curate outline/drag attrs that Word would choke on.
    var fsk = clone.querySelectorAll('[data-fsk]');
    for (var f = 0; f < fsk.length; f++) {
      fsk[f].removeAttribute('draggable');
      fsk[f].classList.remove('fs-curatable', 'fs-editable', 'fs-movable', 'fs-imgblock', 'fs-tableblock', 'fs-target');
    }

    var ao = asOf();
    var head =
      '<div class="eyebrow">California Community Colleges</div>' +
      '<h1>Credit for Prior Learning (CPL) Fact Sheet</h1>' +
      '<div class="sub">Public &amp; Journalist Fact Sheet' + (ao ? ' &nbsp;·&nbsp; data current as of ' + esc(ao) : '') +
        ' &nbsp;·&nbsp; map.rccd.edu</div>';

    var body = '<div class="WordSection1">' + head + clone.innerHTML + '</div>';
    var doc =
      '﻿<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
        'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8">' +
      '<title>California CPL Fact Sheet</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>' +
        '<w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->' +
      '<style>@page WordSection1{size:8.5in 11.0in;margin:0.4in 0.4in 0.4in 0.4in;}' +
        'div.WordSection1{page:WordSection1;}' + docCss() + '</style></head>' +
      '<body>' + body + '</body></html>';
    return { html: doc, filename: 'California_CPL_Fact_Sheet_' + stamp() + '.doc' };
  }

  function download() {
    var out = buildDoc();
    if (!out) { window.alert('Nothing to export.'); return; }
    try {
      var blob = new Blob([out.html], { type: 'application/msword' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = out.filename; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () { if (a.parentNode) a.remove(); URL.revokeObjectURL(url); }, 1500);
    } catch (e) {
      if (window.console && console.warn) console.warn('[fact-sheet] Word export failed:', e && e.message);
      window.alert('Sorry — the Word download could not be created in this browser.');
    }
  }

  function wire() {
    var btn = document.getElementById('btn-word');
    if (btn) btn.addEventListener('click', download);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  // Test / inspection surface.
  window.CPL_FACTSHEET_WORD = { buildDoc: buildDoc, download: download, _abs: abs, _swGridToTable: swGridToTable };
})();
