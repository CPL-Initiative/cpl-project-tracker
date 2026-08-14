/* cobi_orgs.js — COBI site-switcher / org layer (window.CPL_ORGS)
 *
 * The pilot org layer for the CO platform (Sam, 2026-07-14): COBI is the
 * umbrella; each "site" (org/area) is a metadata-scoped VIEW of the one app —
 * NOT a separate deployment (matches docs/co_platform_strategy.md's "one
 * platform, org as a dimension, not a repo/site per org").
 *
 * v1 = presentation only, NO GATING (Sam: "a dropdown to choose from existing
 * sites … no gating out folks for now … still pilot"):
 *   - a compact site-switcher <select> injected into the masthead,
 *   - a per-site identity tag on the COBI wordmark (reuses cobi_brand.js's
 *     gold .cobi-num superscript — CPL → "CPL", C&I → "C&I"),
 *   - the nav rail filtered to the active site's tabs (others hidden; empty
 *     nav groups hidden). Filtering is cosmetic — deep-links still resolve
 *     (no gating). Per-site CURATION isolation (a per-area team phrase) is a
 *     separate, careful Supabase step, deliberately NOT done here.
 *
 * Shareable: ?org=<id> deep-links straight into a site's view (Sam links
 * colleagues to the C&I site). Per-browser choice persists in localStorage.
 *
 * STATIC — NOT a daily-cron artifact. Runtime-injected (kpi_cards/cobi_brand
 * pattern), so the daily regen of the masthead/nav can never strand it. Only
 * the <script> tag is mirrored in BOTH HTMLs (Rule 4); everything else is here.
 * Loads AFTER nav_groups.js + cobi_brand.js so it re-asserts last.
 * Tests: tests/cobi_orgs.test.js
 */
(function () {
  "use strict";

  var STORE_KEY = "cplOrg.v1";

  // The Division sits above the areas (Sam's "Divisions → areas" model). Left
  // unset until Sam names it; when set it shows under the switcher. Areas are
  // added here on the fly (CPL, C&I today; CIP/CCN next).
  var DIVISION = null; // e.g. "Educational Services & Support"

  var ORGS = [
    // tabs:null → show ALL tabs (the flagship, unchanged for CPL/default users)
    { id: "cpl", label: "CPL", tag: "CPL", full: "CPL Initiative", tabs: null, home: "dashboard" },
    { id: "ci",  label: "C&I", tag: "C&I", full: "Curriculum & Instruction",
      tabs: ["our-process", "tmc-builder"], home: "our-process" },
    { id: "cip", label: "CIP", tag: "CIP", full: "TOP-to-CIP Transition",
      tabs: ["cip-crosswalk", "coci-lookup"], home: "cip-crosswalk" },
    // GR — Government Relations. LISTED in the switcher like any other site
    // (Sam, 2026-07-19: "GR should appear in the dropdown always"). Selecting
    // the GR site is open; its CONTENT is what's gated. The gr-priorities tab is
    // EXCLUSIVE (below) so it shows ONLY under the GR site, never in the default
    // CPL nav — and gr_priorities.js renders a lock screen until the MAP-team GR
    // phrase is entered (server-side RLS on gr_content; a wrong/rotated phrase
    // gets zero rows back). So: pick GR freely; view/curate only with the phrase.
    { id: "gr", label: "GR", tag: "GR", full: "Government Relations",
      tabs: ["gr-priorities"], home: "gr-priorities" },
    // FIN — Finance. Contracts is EXCLUSIVE (below) so vendor payment terms
    // never appear in the default CPL nav; Budget and Implementation Funding are
    // ALSO listed here, which does not move them — the org layer is a filtered
    // VIEW, so both stay exactly where they are in the CPL site too. Sam,
    // 2026-08-12: FIN should be a real Finance site on day one, not a one-tab site.
    { id: "fin", label: "FIN", tag: "FIN", full: "Finance",
      tabs: ["contracts", "budget", "implementation-funding"], home: "contracts" },
  ];

  // Tabs that must NOT appear in the default "show everything" view — they
  // surface only when their own org is active (sensitive / gated areas). This
  // keeps even the tab's existence out of the public/default nav.
  var EXCLUSIVE = ["gr-priorities", "contracts"];

  // Tabs that survive the per-site nav filter — visible under EVERY site, not
  // just the default CPL view.
  //
  // Sam, 2026-08-14: "should the Admin tab be at the top level so I can manage
  // all the orgs?" Yes, and being ungrouped is only the cosmetic half. The
  // functional half is HERE: applyNav() hides any tab missing from the active
  // site's `tabs` list, so without this, switching to GR to fix GR's menu would
  // make the Admin tab vanish out from under you — the one moment you need it
  // most.
  //
  // A list rather than adding "admin" to all six ORGS entries, because that
  // fails silently in exactly the wrong direction: a site added later would
  // quietly have no Admin tab, and nobody would notice until they switched to it.
  var ALWAYS = ["admin"];

  function orgById(id) {
    for (var i = 0; i < ORGS.length; i++) if (ORGS[i].id === id) return ORGS[i];
    return null;
  }
  var current = ORGS[0];

  function paramOrg() {
    try {
      var m = /[?&]org=([^&#]+)/.exec(location.search || "");
      return m ? decodeURIComponent(m[1]).toLowerCase() : null;
    } catch (e) { return null; }
  }
  function stored() { try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; } }
  function store(id) { try { localStorage.setItem(STORE_KEY, id); } catch (e) { /* ignore */ } }

  function ensureCss() {
    if (document.getElementById("cobi-orgs-css")) return;
    var st = document.createElement("style");
    st.id = "cobi-orgs-css";
    st.textContent =
      ".cobi-orgswitch{display:inline-flex;align-items:center;gap:7px;margin-left:14px;font-family:inherit;}" +
      ".cobi-orgswitch-lbl{font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted,#8a8a86);}" +
      ".cobi-orgswitch-sel{font-size:.82rem;font-weight:700;color:var(--text-strong,#243b53);" +
        "background:var(--surface-2,rgba(20,20,30,0.05));border:1px solid var(--border,#cdd5dd);" +
        "border-radius:6px;padding:3px 8px;cursor:pointer;font-family:inherit;line-height:1.35;}" +
      ".cobi-orgswitch-sel:hover{border-color:var(--seal-blue,#00356B);}" +
      ".cobi-orgswitch-sel:focus-visible{outline:2px solid var(--seal-blue,#00356B);outline-offset:1px;}" +
      "@media (max-width:640px){.cobi-orgswitch-lbl{display:none;}.cobi-orgswitch{margin-left:8px;}}";
    document.head.appendChild(st);
  }

  function injectSwitcher() {
    var brand = document.querySelector(".header .cobi-brand");
    if (!brand || brand.querySelector(".cobi-orgswitch")) return;
    var wrap = document.createElement("div");
    wrap.className = "cobi-orgswitch";
    var lbl = document.createElement("span");
    lbl.className = "cobi-orgswitch-lbl";
    lbl.textContent = DIVISION || "Site";
    var sel = document.createElement("select");
    sel.className = "cobi-orgswitch-sel";
    sel.setAttribute("aria-label", "Choose COBI site");
    ORGS.forEach(function (o) {
      // `unlisted` orgs are reachable via ?org= but kept OUT of the switcher —
      // shown only when they ARE the current selection. (No org uses this today;
      // GR is a normal listed site whose CONTENT is phrase-gated, not its entry.)
      if (o.unlisted && o.id !== current.id) return;
      var op = document.createElement("option");
      op.value = o.id;
      op.textContent = o.label;
      op.title = o.full;
      sel.appendChild(op);
    });
    sel.value = current.id;
    sel.addEventListener("change", function () { setOrg(sel.value, { navigate: true }); });
    wrap.appendChild(lbl);
    wrap.appendChild(sel);
    brand.appendChild(wrap);
  }

  // The identity tag = cobi_brand.js's gold superscript on the wordmark.
  function setTag(org) {
    var h1 = document.querySelector(".header h1");
    if (!h1) return;
    var sup = h1.querySelector(".cobi-num");
    if (!sup) {
      sup = document.createElement("span");
      sup.className = "cobi-num";
      h1.appendChild(sup);
    }
    sup.textContent = org.tag;
    sup.setAttribute("aria-label", org.full);
  }

  function applyNav(org) {
    var nav = document.querySelector("nav.cpl-tabs");
    if (!nav) return;
    var allow = org.tabs; // null → show everything
    var btns = nav.querySelectorAll(".cpl-tab[data-tab]");
    Array.prototype.forEach.call(btns, function (b) {
      var t = b.getAttribute("data-tab");
      // The curator overlay (nav_overlay.js / public.cobi_nav) can re-map a tab
      // to an explicit set of sites, or pin it to all of them. Absent — not
      // loaded, failed, or simply never edited — every lookup returns null and
      // this is exactly the code behaviour it replaced.
      var ov = window.CPL_NAV_OVERLAY;
      var ovOrgs = ov ? ov.orgsFor(t) : null;
      var pinned = (ALWAYS.indexOf(t) !== -1) || (ov ? ov.isPinned(t) : false);

      // Default view (no overlay orgs, allow=null): show everything EXCEPT EXCLUSIVE tabs.
      // An org view: show only that org's tabs (which may include an EXCLUSIVE one).
      // Pinned tabs ignore both rules — they manage the sites, so they cannot be
      // filtered out BY a site.
      var show = pinned ||
        (ovOrgs ? (ovOrgs.indexOf(org.id) !== -1)
                : (allow ? (allow.indexOf(t) !== -1) : (EXCLUSIVE.indexOf(t) === -1)));
      // A tab the curator hid from the menu stays hidden under every site.
      // Checked last so it cannot be undone by a pin.
      if (ov && ov.isHidden(t)) show = false;
      b.style.display = show ? "" : "none";
      b.setAttribute("data-org-hidden", show ? "0" : "1");
    });
    // Hide a nav group whose members are now all hidden; show it otherwise.
    var groups = nav.querySelectorAll(".cpl-nav-group");
    Array.prototype.forEach.call(groups, function (g) {
      var members = g.querySelectorAll(".cpl-tab[data-tab]");
      var anyVisible = Array.prototype.some.call(members, function (m) {
        return m.getAttribute("data-org-hidden") !== "1";
      });
      g.style.display = (members.length && !anyVisible) ? "none" : "";
    });
  }

  function setOrg(id, opts) {
    var org = orgById(id) || ORGS[0];
    current = org;
    store(org.id);
    // Keep the URL shareable: ?org=ci for a subsite, cleaned for the default.
    try {
      var url = new URL(location.href);
      if (org.id === ORGS[0].id) url.searchParams.delete("org");
      else url.searchParams.set("org", org.id);
      history.replaceState(null, "", url.toString());
    } catch (e) { /* ignore */ }
    setTag(org);
    applyNav(org);
    var sel = document.querySelector(".cobi-orgswitch-sel");
    if (sel && sel.value !== org.id) sel.value = org.id;
    if (opts && opts.navigate && org.home && window.CPL_TABS && window.CPL_TABS.navigate) {
      window.CPL_TABS.navigate(org.home);
    }
  }

  function resolveInitial() {
    var p = paramOrg();
    if (p && orgById(p)) return p;
    var s = stored();
    if (s && orgById(s)) return s;
    return ORGS[0].id;
  }

  var inited = false;
  function init() {
    ensureCss();
    var fromParam = paramOrg();
    current = orgById(resolveInitial()) || ORGS[0];
    injectSwitcher();
    setTag(current);
    applyNav(current);
    // A shared ?org=<area> link with no explicit #tab: land on that area's home
    // (its default tab, e.g. Dashboard, is hidden in the org view, so don't strand
    // the visitor on a blank pane). Skipped for the flagship CPL default.
    if (fromParam && orgById(fromParam) && current.id !== ORGS[0].id && current.home &&
        !location.hash && window.CPL_TABS && typeof window.CPL_TABS.navigate === "function") {
      window.CPL_TABS.navigate(current.home);
    }
    if (inited) return;
    inited = true;
    // Re-assert after nav_groups.js builds the groups + cobi_brand.js adds its
    // superscript (both may run in the same tick); belt-and-suspenders.
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () { setTag(current); applyNav(current); });
    }
    window.addEventListener("cpl-tab-activated", function () { applyNav(current); });
  }

  window.CPL_ORGS = {
    init: init, setOrg: setOrg, ORGS: ORGS,
    EXCLUSIVE: EXCLUSIVE, ALWAYS: ALWAYS,
    current: function () { return current; },
    _applyNav: function () { applyNav(current); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
