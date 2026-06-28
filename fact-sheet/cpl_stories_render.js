/* Fact Sheet — render 4 RANDOM "My CPL Story" cards into #cpl-stories-grid from
   window.CPL_STORIES (fact-sheet/cpl_stories.js, sourced from map.rccd.edu/
   cplstories/ by the runner-as-proxy tools/source_cpl_stories.mjs).

   Self-contained, READ-ONLY, escapes all text (the data is external, treat it as
   untrusted). Missing / empty data → the whole "More stories" block hides itself,
   so the section's intro + featured story + "See all ↗" link still render. */
(function () {
  'use strict';
  var PICK = 4;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function trunc(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
  }
  function pick(arr, n) {
    var a = arr.slice(), out = [];
    for (var i = 0; i < n && a.length; i++) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
    return out;
  }
  function safeImg(u) { u = String(u || ''); return /^https:\/\//.test(u) ? u : ''; }

  function injectCss() {
    if (document.getElementById('cpl-stories-css')) return;
    var css = ''
      + '.cpl-stories-more{margin-top:20px;}'
      + '.cpl-stories-h{margin:0 0 10px;font-size:1.02rem;color:var(--ink,#1a1a2e);}'
      + '.cpl-stories-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;}'
      + '.cpl-story-card{display:flex;flex-direction:column;border:1px solid var(--border-strong,#d9d4c8);'
        + 'border-radius:10px;overflow:hidden;background:var(--surface,#fff);}'
      + '.cpl-story-photo{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;'
        + 'background:var(--surface-muted,#f0ede6);}'
      + '.cpl-story-body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px;}'
      + '.cpl-story-name{font-weight:700;font-size:.95rem;color:var(--ink,#1a1a2e);}'
      + '.cpl-story-path{font-size:.76rem;color:var(--muted,#555);font-style:italic;}'
      + '.cpl-story-quote{font-size:.84rem;line-height:1.42;color:var(--muted,#555);}'
      + '.cpl-stories-all{margin:13px 0 0;font-size:.9rem;}'
      + '@media print{.cpl-stories-grid{grid-template-columns:repeat(2,1fr);}'
        + '.cpl-story-card{break-inside:avoid;}}';
    var st = document.createElement('style');
    st.id = 'cpl-stories-css';
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
  }

  function render() {
    var grid = document.getElementById('cpl-stories-grid');
    if (!grid) return;
    var data = window.CPL_STORIES;
    var stories = (data && Array.isArray(data.stories)) ? data.stories.filter(function (s) { return s && s.name; }) : [];
    var wrap = grid.closest ? grid.closest('.cpl-stories-more') : null;
    if (!stories.length) { if (wrap) wrap.style.display = 'none'; return; }
    if (wrap) wrap.style.display = '';
    injectCss();
    grid.innerHTML = '';
    pick(stories, PICK).forEach(function (s) {
      var card = document.createElement('div');
      card.className = 'cpl-story-card';
      var img = safeImg(s.img), html = '';
      if (img) html += '<img class="cpl-story-photo" loading="lazy" referrerpolicy="no-referrer" '
        + 'alt="' + esc(s.name) + '" src="' + esc(img) + '" onerror="this.style.display=\'none\'">';
      html += '<div class="cpl-story-body"><div class="cpl-story-name">' + esc(s.name) + '</div>';
      if (s.pathway) html += '<div class="cpl-story-path">' + esc(trunc(s.pathway, 64)) + '</div>';
      if (s.quote) html += '<div class="cpl-story-quote">“' + esc(trunc(s.quote, 160)) + '”</div>';
      html += '</div>';
      card.innerHTML = html;
      grid.appendChild(card);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();

  // Test/inspection surface.
  window.CPL_STORIES_RENDER = { render: render, _pick: pick, _esc: esc, _trunc: trunc, _safeImg: safeImg };
})();
