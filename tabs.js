// Sidebar tab router + rail auth badge + hamburger toggle.
//
// Replaces the inline tab-router that used to live at the bottom of
// CPL_Dashboard.html and the hardcoded VALID_TABS whitelist that caused
// PRs #117 and #118 (curator tabs added but never reached because the
// router wasn't updated). VALID_TABS is now DERIVED from the rendered
// nav so adding a tab is purely:
//   1) drop a <button class="cpl-tab" data-tab="..."> in the rail,
//   2) drop a <div class="cpl-tab-pane" data-tab="..."> in the main column,
//   3) ship the script.
//
// Exposes window.CPL_TABS.activate(tab) so other modules (quickstart.js)
// can route without touching location.hash directly.
(function () {
  function navButtons() {
    return Array.prototype.slice.call(
      document.querySelectorAll('nav.cpl-tabs .cpl-tab[data-tab]')
    );
  }
  function validTabs() {
    return navButtons().map(function (b) { return b.getAttribute('data-tab'); });
  }
  function parseHash() {
    var h = (location.hash || '').replace(/^#/, '');
    var parts = h.split('/');
    return { tab: parts[0] || '', section: parts[1] || '' };
  }
  function fromHash() {
    var p = parseHash();
    var valid = validTabs();
    return (p.tab && valid.indexOf(p.tab) !== -1) ? p.tab : (valid[0] || 'dashboard');
  }
  function activate(tabName, opts) {
    var valid = validTabs();
    if (!tabName || valid.indexOf(tabName) === -1) tabName = valid[0] || 'dashboard';
    navButtons().forEach(function (b) {
      var on = b.getAttribute('data-tab') === tabName;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var activePane = null;
    document.querySelectorAll('.cpl-tab-pane').forEach(function (p) {
      var on = p.getAttribute('data-tab') === tabName;
      p.classList.toggle('active', on);
      if (on) activePane = p;
    });
    // Render the section TOC under the active rail item BEFORE the scroll
    // happens, so the TOC click handlers are wired by the time a sub-section
    // hash lands here.
    renderSectionToc(activePane, tabName);
    // Section scroll: if the hash carries a section slug AND the pane
    // declares it, scroll to that section instead of jumping to top.
    var sectionSlug = (opts && opts.section) || '';
    var sectionEl = sectionSlug ? sectionElementBySlug(activePane, sectionSlug) : null;
    if (sectionEl) {
      // Defer one frame so the pane's display:block has applied + layout has
      // settled before we measure scroll offsets.
      requestAnimationFrame(function () { sectionEl.scrollIntoView({ behavior: 'instant' in window ? 'instant' : 'auto', block: 'start' }); });
      setActiveTocItem(sectionSlug);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    }
    setupScrollSpy(activePane);
    // Mobile: close the slide-over after picking a tab.
    closeRail();
    // Refresh auth badge — sign-in state may have changed since last render.
    renderRailAuth();
  }
  function navigate(tabName, sectionSlug) {
    var hash = (tabName === 'dashboard' && !sectionSlug)
      ? '' : ('#' + tabName + (sectionSlug ? '/' + sectionSlug : ''));
    if (hash) location.hash = hash;
    else history.replaceState(null, '', location.pathname + location.search);
    activate(tabName, { section: sectionSlug || '' });
  }

  // -- Section TOC + scroll-spy (PR-Sidebar-B) --------------------------
  // Each tab pane optionally declares its sub-sections via a JSON
  // data-sections attribute: [{"slug","id","label"}, …]. When the tab is
  // active, those sections render as a nested <ul> under the active rail
  // item; clicking a TOC item smooth-scrolls + updates the URL hash to
  // "#<tab>/<slug>"; an IntersectionObserver highlights whichever section
  // is currently in view.
  var _scrollSpyObserver = null;
  function readSections(pane) {
    if (!pane) return [];
    var raw = pane.getAttribute('data-sections');
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch (e) { return []; }
  }
  function sectionElementBySlug(pane, slug) {
    var defs = readSections(pane);
    for (var i = 0; i < defs.length; i++) {
      if (defs[i].slug === slug) {
        return document.getElementById(defs[i].id);
      }
    }
    return null;
  }
  function renderSectionToc(pane, tabName) {
    // Tear down any TOC from the previously-active tab.
    document.querySelectorAll('.cpl-sidebar-toc').forEach(function (el) { el.remove(); });
    var defs = readSections(pane);
    if (!defs.length) return;
    var navBtn = document.querySelector('nav.cpl-tabs .cpl-tab[data-tab="' + tabName + '"]');
    if (!navBtn) return;
    var ul = document.createElement('ul');
    ul.className = 'cpl-sidebar-toc';
    defs.forEach(function (def) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + tabName + '/' + def.slug;
      a.textContent = def.label;
      a.setAttribute('data-section-slug', def.slug);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        navigate(tabName, def.slug);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    // Insert AFTER the active rail button so the TOC nests visually under it.
    navBtn.parentNode.insertBefore(ul, navBtn.nextSibling);
  }
  function setActiveTocItem(slug) {
    document.querySelectorAll('.cpl-sidebar-toc a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-section-slug') === slug);
    });
  }
  function setupScrollSpy(pane) {
    if (_scrollSpyObserver) { _scrollSpyObserver.disconnect(); _scrollSpyObserver = null; }
    if (!('IntersectionObserver' in window)) return;
    var defs = readSections(pane);
    if (!defs.length) return;
    var slugByEl = {};
    var elements = [];
    defs.forEach(function (def) {
      var el = document.getElementById(def.id);
      if (el) { slugByEl[def.id] = def.slug; elements.push(el); }
    });
    if (!elements.length) return;
    // rootMargin biases the "active" band toward the top of the viewport
    // (header at ≈0, want the section currently being read, not the next one
    // peeking in at the bottom).
    var visible = {};
    _scrollSpyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });
      // Pick the topmost visible section as active.
      var bestEl = null, bestTop = Infinity;
      elements.forEach(function (el) {
        if (!visible[el.id]) return;
        var top = el.getBoundingClientRect().top;
        if (top < bestTop) { bestTop = top; bestEl = el; }
      });
      if (bestEl) setActiveTocItem(slugByEl[bestEl.id]);
    }, { rootMargin: '-80px 0px -55% 0px', threshold: 0 });
    elements.forEach(function (el) { _scrollSpyObserver.observe(el); });
  }

  // -- Rail auth badge --------------------------------------------------
  // Read-only "signed in as X" / "not signed in" indicator in the sidebar
  // footer. Reads sessionStorage.cpl_sb (the session shape persisted by all
  // three curator tabs — see unified_courses.js persistToken). Same-tab
  // sign-in/out won't fire a storage event, so we also re-render on focus
  // and on every tab activation; that covers all the natural moments.
  function readSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem('cpl_sb') || 'null');
      if (s && typeof s.access_token === 'string') return s;
    } catch (e) {}
    return null;
  }
  function renderRailAuth() {
    var el = document.getElementById('cpl-rail-auth');
    if (!el) return;
    var s = readSession();
    if (s) {
      el.innerHTML = '';
      var row = document.createElement('div');
      row.className = 'cpl-rail-auth-on';
      row.textContent = '✓ signed in';
      el.appendChild(row);
      if (s.email) {
        var em = document.createElement('span');
        em.className = 'cpl-rail-auth-email';
        em.textContent = s.email;
        el.appendChild(em);
      }
    } else {
      el.innerHTML = '';
      var off = document.createElement('div');
      off.className = 'cpl-rail-auth-off';
      off.textContent = '— not signed in';
      el.appendChild(off);
      var hint = document.createElement('span');
      hint.className = 'cpl-rail-auth-email';
      hint.textContent = 'use a curator tab to sign in';
      el.appendChild(hint);
    }
  }

  // -- Hamburger / slide-over -------------------------------------------
  function openRail() { document.body.classList.add('cpl-rail-open'); }
  function closeRail() { document.body.classList.remove('cpl-rail-open'); }
  function toggleRail() { document.body.classList.toggle('cpl-rail-open'); }
  function wireHamburger() {
    var btn = document.getElementById('cpl-hamburger');
    if (btn) btn.addEventListener('click', toggleRail);
    // Click outside the rail closes it (the overlay pseudo-element captures
    // clicks on body in the narrow-screen state).
    document.addEventListener('click', function (e) {
      if (!document.body.classList.contains('cpl-rail-open')) return;
      var rail = document.querySelector('.cpl-sidebar');
      var hbg = document.getElementById('cpl-hamburger');
      if (rail && (rail.contains(e.target) || (hbg && hbg.contains(e.target)))) return;
      closeRail();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeRail();
    });
  }

  // -- Wire it all up ---------------------------------------------------
  function init() {
    navButtons().forEach(function (btn) {
      btn.addEventListener('click', function () {
        navigate(btn.getAttribute('data-tab'));
      });
    });
    // The sidebar brand link is not a .cpl-tab (it's the rail header), but it
    // carries data-tab="dashboard" so clicking the brand returns home.
    document.querySelectorAll('.cpl-sidebar-brand a[data-tab]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        navigate(a.getAttribute('data-tab'));
      });
    });
    window.addEventListener('hashchange', function () {
      var p = parseHash();
      activate(fromHash(), { section: p.section });
    });
    window.addEventListener('storage', function (e) {
      if (!e.key || e.key === 'cpl_sb') renderRailAuth();
    });
    window.addEventListener('focus', renderRailAuth);
    window.addEventListener('cpl-auth-change', renderRailAuth);
    wireHamburger();
    var p0 = parseHash();
    activate(fromHash(), { section: p0.section });
    renderRailAuth();
  }

  window.CPL_TABS = {
    activate: activate,
    navigate: navigate,
    valid: validTabs,
    openRail: openRail,
    closeRail: closeRail,
    renderRailAuth: renderRailAuth
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
