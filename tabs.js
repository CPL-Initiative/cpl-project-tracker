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
  function fromHash() {
    var h = (location.hash || '').replace(/^#/, '');
    // Strip any sub-path (e.g. "#dashboard/section") — sidebar-B will use this.
    var tab = h.split('/')[0];
    var valid = validTabs();
    return (tab && valid.indexOf(tab) !== -1) ? tab : (valid[0] || 'dashboard');
  }
  function activate(tabName) {
    var valid = validTabs();
    if (!tabName || valid.indexOf(tabName) === -1) tabName = valid[0] || 'dashboard';
    navButtons().forEach(function (b) {
      var on = b.getAttribute('data-tab') === tabName;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.cpl-tab-pane').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-tab') === tabName);
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    // Mobile: close the slide-over after picking a tab.
    closeRail();
    // Refresh auth badge — sign-in state may have changed since last render.
    renderRailAuth();
  }
  function navigate(tabName) {
    if (tabName === 'dashboard') {
      history.replaceState(null, '', location.pathname + location.search);
    } else {
      location.hash = tabName;
    }
    activate(tabName);
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
    window.addEventListener('hashchange', function () { activate(fromHash()); });
    window.addEventListener('storage', function (e) {
      if (!e.key || e.key === 'cpl_sb') renderRailAuth();
    });
    window.addEventListener('focus', renderRailAuth);
    window.addEventListener('cpl-auth-change', renderRailAuth);
    wireHamburger();
    activate(fromHash());
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
