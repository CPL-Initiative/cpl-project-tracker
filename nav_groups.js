/*
 * COBI — Sidebar nav groups (Session 97, Sam: "look critically at the sidebar
 * menu and revise and arrange for simplicity of navigation and logical
 * hierarchy — nothing gets lost but the top layer is not overwhelming").
 *
 * Runtime-wraps the flat rail buttons into labeled, collapsible groups — the
 * kpi_cards.js pattern: NO template restructuring, so the daily regen can't
 * disturb it and tabs.js keeps deriving VALID_TABS from the same buttons
 * (they stay in the DOM under nav.cpl-tabs; querySelectorAll finds hidden
 * elements). A tab NOT listed in GROUPS below stays top-level and visible —
 * future tabs degrade gracefully instead of disappearing.
 *
 * Behavior:
 *  - Dashboard stays pinned top-level (never grouped).
 *  - Group headers toggle open/collapsed; per-browser persistence in
 *    localStorage (cplNavGroups.v1).
 *  - The active tab's group force-opens on every activation (hash deep-links
 *    and Where To jumps always land visible).
 *  - External launchers (.cpl-tab-external, no data-tab) collect under
 *    "Share" at the bottom.
 *
 * STATIC — NOT a daily-cron artifact. <script>-loaded in BOTH HTMLs (Rule 4).
 */
(function () {
  'use strict';

  var STORE_KEY = 'cplNavGroups.v1';

  // Order here = display order. Tabs within a group keep this listed order.
  var GROUPS = [
    { id: 'workplan', label: 'Workplan', tabs: ['activities-projects', 'workplan-goals', 'raci', 'annual-report'] },
    { id: 'funding', label: 'Funding', tabs: ['budget', 'implementation-funding'] },
    { id: 'strategy', label: 'Strategy & Impact', tabs: ['vision-2030', 'military-partnerships', 'cpl-news'] },
    { id: 'reference', label: 'Reference & Curation', tabs: ['unified-courses', 'canonical-subj4', 'coci-lookup', 'credential-reference', 'exhibit-adoption', 'tmc-builder', 'pipeline', 'our-process'] },
    { id: 'sierra', label: 'Sierra & Team Tools', tabs: ['chatbot', 'sierra-training', 'map-users', 'knowledge-base', 'letters'] },
  ];
  // Groups open by default on a first visit (the daily-driver lane).
  var DEFAULT_OPEN = { workplan: true };

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {}; }
    catch (e) { return {}; }
  }
  function saveState(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function isOpen(state, gid) {
    return (gid in state) ? !!state[gid] : !!DEFAULT_OPEN[gid];
  }

  function ensureCss() {
    if (document.getElementById('cpl-nav-groups-css')) return;
    var st = document.createElement('style');
    st.id = 'cpl-nav-groups-css';
    st.textContent =
      '.cpl-nav-group{margin:0.15rem 0;}' +
      '.cpl-nav-group-head{display:flex;align-items:center;justify-content:space-between;width:100%;' +
        'background:none;border:none;cursor:pointer;padding:0.45rem 0.9rem 0.3rem 0.85rem;' +
        'font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;' +
        'color:#8a8a86;font-family:inherit;transition:color 0.12s;}' +
      '.cpl-nav-group-head:hover{color:var(--text-strong,#333);}' +
      '.cpl-nav-group-head .cpl-nav-caret{font-size:0.62rem;transition:transform 0.15s;}' +
      '.cpl-nav-group.collapsed .cpl-nav-caret{transform:rotate(-90deg);}' +
      '.cpl-nav-group.collapsed .cpl-nav-group-body{display:none;}' +
      '.cpl-nav-group .cpl-sidebar .cpl-tab{padding-left:1.2rem;}' +
      '.cpl-sidebar .cpl-nav-group-body .cpl-tab{padding-left:1.25rem;}';
    document.head.appendChild(st);
  }

  function build() {
    var nav = document.querySelector('nav.cpl-tabs');
    if (!nav || nav.getAttribute('data-nav-grouped') === '1') return;

    // Index the existing buttons/anchors by data-tab (or external flag).
    var byTab = {};
    var externals = [];
    Array.prototype.slice.call(nav.children).forEach(function (el) {
      var tab = el.getAttribute && el.getAttribute('data-tab');
      if (tab) byTab[tab] = el;
      else if (el.classList && el.classList.contains('cpl-tab-external')) externals.push(el);
    });

    var state = loadState();

    function makeGroup(gid, label, members) {
      if (!members.length) return null;
      var wrap = document.createElement('div');
      wrap.className = 'cpl-nav-group';
      wrap.setAttribute('data-nav-group', gid);
      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'cpl-nav-group-head';
      head.setAttribute('aria-expanded', 'true');
      head.innerHTML = '<span>' + label + '</span><span class="cpl-nav-caret">&#9660;</span>';
      var body = document.createElement('div');
      body.className = 'cpl-nav-group-body';
      members.forEach(function (el) { body.appendChild(el); });
      wrap.appendChild(head);
      wrap.appendChild(body);
      function apply(open) {
        wrap.classList.toggle('collapsed', !open);
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      apply(isOpen(state, gid));
      head.addEventListener('click', function () {
        var open = wrap.classList.contains('collapsed'); // toggling open
        apply(open);
        var s = loadState();
        s[gid] = open;
        saveState(s);
      });
      return wrap;
    }

    GROUPS.forEach(function (g) {
      var members = g.tabs.map(function (t) { return byTab[t]; }).filter(Boolean);
      var grp = makeGroup(g.id, g.label, members);
      if (grp) nav.appendChild(grp);
    });
    // External launchers → "Share" group (open by default; tiny).
    if (externals.length) {
      var shareState = ('share' in state) ? !!state.share : true;
      var share = makeGroup('share', 'Share', externals);
      if (share) {
        share.classList.toggle('collapsed', !shareState);
        nav.appendChild(share);
      }
    }
    // Anything unlisted (e.g. a future tab) stays where it was — top-level.

    nav.setAttribute('data-nav-grouped', '1');
    openGroupForTab(currentTab());
  }

  function currentTab() {
    var active = document.querySelector('nav.cpl-tabs .cpl-tab.active[data-tab]');
    return active ? active.getAttribute('data-tab') : null;
  }

  // The active tab must always be visible — force-open its group (without
  // persisting, so a deep link doesn't permanently rewrite the user's layout).
  function openGroupForTab(tab) {
    if (!tab) return;
    var btn = document.querySelector('nav.cpl-tabs .cpl-tab[data-tab="' + tab + '"]');
    if (!btn) return;
    var grp = btn.closest ? btn.closest('.cpl-nav-group') : null;
    if (grp && grp.classList.contains('collapsed')) {
      grp.classList.remove('collapsed');
      var head = grp.querySelector('.cpl-nav-group-head');
      if (head) head.setAttribute('aria-expanded', 'true');
    }
  }

  function init() {
    ensureCss();
    build();
    window.addEventListener('cpl-tab-activated', function (e) {
      if (e && e.detail && e.detail.tab) openGroupForTab(e.detail.tab);
    });
  }

  var api = { build: build, openGroupForTab: openGroupForTab, GROUPS: GROUPS };
  if (typeof window !== 'undefined') window.CPL_NAV_GROUPS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
