/* nav_overlay.js — the side menu's curator arrangement (window.CPL_NAV_OVERLAY).
 *
 * Sam, 2026-08-14: "I want to make the COBI side menu items rearrangeable by
 * drag and drop from a single place where I can manage the org where they
 * appear, hierarchy, naming, visibility, and access."
 *
 * The menu used to live in three places, all code: order and grouping in
 * nav_groups.js, site mapping in cobi_orgs.js, labels in the markup. This module
 * is the single overlay all three now consult, backed by the public.cobi_nav
 * table (chatbox/supabase_cobi_nav.sql).
 *
 * ── THE RULE THAT MATTERS MOST ───────────────────────────────────────────────
 * The overlay NEVER gates the menu's existence. The page builds its nav from
 * code and paints it; this applies on top when and if it arrives. The nav is the
 * entry point for every visitor including anonymous ones, so a nav that fails
 * closed is a site with no navigation. Offline, blocked, RLS-broken, table
 * dropped — every one of those has to land on today's menu, not a blank rail.
 *
 * ── THE PROTECTED SET LIVES HERE, NOT IN THE TABLE ───────────────────────────
 * `admin` cannot be hidden and cannot lose its pin, and it is lifted out of a
 * hidden group rather than disappearing with it. The guarantee cannot live in
 * the table, because the table is the thing being guarded: one row hiding the
 * Admin tab would remove the only surface that can un-hide it, from every
 * browser at once, with nothing to deploy in between. Same shape as
 * PROTECTED_RULE_KEYS in cpl-chat.
 *
 * ⚠ EVERYTHING HERE IS DISPLAY. `hidden` and `orgs` change who SEES a menu item.
 * They do not protect the data behind it — RLS does, and the Admin tab shows
 * both side by side so the two cannot be confused.
 *
 * Tests: tests/nav_overlay.test.js
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var REST = SUPABASE_URL + "/rest/v1";
  var CACHE_KEY = "cplNavOverlay.v1";

  /* Tabs the overlay may not remove from reach.
   * `admin` is the manager itself — hiding it is a one-way door.
   * `dashboard` is the home pane every deep link falls back to. */
  var PROTECTED = { admin: true, dashboard: true };

  var rows = null;        // null = not loaded (or load failed) → pure code defaults
  var loaded = false;
  var listeners = [];

  function isArr(a) { return Object.prototype.toString.call(a) === "[object Array]"; }

  /* Accept only rows we understand. A malformed row must be dropped rather than
   * allowed to throw somewhere downstream — a TypeError inside the nav build
   * would take out the whole rail, which is the exact failure this module exists
   * to make impossible. */
  function sanitize(list) {
    if (!isArr(list)) return null;
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r || (r.kind !== "tab" && r.kind !== "group")) continue;
      if (typeof r.key !== "string" || !r.key) continue;
      out.push({
        kind: r.kind,
        key: r.key,
        label: (typeof r.label === "string" && r.label.trim()) ? r.label.trim() : null,
        parent: (typeof r.parent === "string" && r.parent) ? r.parent : null,
        sort_order: (typeof r.sort_order === "number" && isFinite(r.sort_order)) ? r.sort_order : null,
        hidden: r.hidden === true,
        orgs: isArr(r.orgs) ? r.orgs.filter(function (o) { return typeof o === "string" && o; }) : null,
        pinned: r.pinned === true,
        updated_by: typeof r.updated_by === "string" ? r.updated_by : null,
        updated_at: typeof r.updated_at === "string" ? r.updated_at : null,
      });
    }
    return out;
  }

  function readCache() {
    try { return sanitize(JSON.parse(localStorage.getItem(CACHE_KEY) || "null")); }
    catch (e) { return null; }
  }
  function writeCache(list) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(list || [])); } catch (e) { /* private mode */ }
  }

  function get(kind, key) {
    if (!rows) return null;
    for (var i = 0; i < rows.length; i++) if (rows[i].kind === kind && rows[i].key === key) return rows[i];
    return null;
  }

  /* ── plan() — the whole arrangement, as a pure function ─────────────────────
   *
   * codeGroups : [{id, label, tabs:[tabId, …]}]  the nav_groups.js defaults
   * presentTabs: [tabId, …]                      tabs actually in the DOM, in
   *                                              document order
   *
   * Returns { groups:[{id,label,tabs:[…]}], top:[tabId,…], hidden:[tabId,…] }.
   *
   * Pure and side-effect free so the tests can hammer it — the DOM half is a
   * thin renderer over this, which is the only way the ordering rules are
   * checkable at all.
   */
  function plan(codeGroups, presentTabs) {
    codeGroups = isArr(codeGroups) ? codeGroups : [];
    presentTabs = isArr(presentTabs) ? presentTabs : [];

    var present = {};
    presentTabs.forEach(function (t, i) { present[t] = i; });

    // Where each tab sits by default, and in what order.
    var codeParent = {}, codeIndex = {};
    codeGroups.forEach(function (g, gi) {
      (g.tabs || []).forEach(function (t, ti) {
        codeParent[t] = g.id;
        codeIndex[t] = ti;
      });
      codeIndex["__group__" + g.id] = gi;
    });

    var groupIds = {};
    codeGroups.forEach(function (g) { groupIds[g.id] = true; });

    // ── Groups, in their effective order ──
    var groups = codeGroups.map(function (g) {
      var o = get("group", g.id);
      return {
        id: g.id,
        label: (o && o.label) || g.label,
        hidden: !!(o && o.hidden),
        order: (o && o.sort_order != null) ? o.sort_order : codeIndex["__group__" + g.id],
        tabs: [],
      };
    });
    stableSort(groups, function (a, b) { return a.order - b.order; });

    var byId = {};
    groups.forEach(function (g) { byId[g.id] = g; });

    // ── Tabs into their containers ──
    var top = [], hidden = [];
    presentTabs.forEach(function (t) {
      var o = get("tab", t);
      var prot = !!PROTECTED[t];

      // A protected tab can never be hidden — not directly, and (below) not by
      // hiding the group it sits in either.
      var isHidden = !!(o && o.hidden) && !prot;

      var parent = o && o.parent != null ? o.parent : (codeParent[t] || null);
      // A parent naming a group that no longer exists degrades to top level
      // rather than making the tab vanish. Groups live in code; the overlay can
      // outlive a rename.
      if (parent && !groupIds[parent]) parent = null;

      var grp = parent ? byId[parent] : null;
      // Lifting a protected tab OUT of a hidden group, rather than letting it
      // disappear with the group, is the second half of the lockout guard —
      // otherwise Admin could be hidden indirectly by hiding whatever contains it.
      if (grp && grp.hidden) {
        if (prot) grp = null;
        else isHidden = true;
      }

      var entry = {
        tab: t,
        hidden: isHidden,
        order: (o && o.sort_order != null) ? o.sort_order
          : (parent && codeParent[t] === parent ? codeIndex[t] : present[t]),
        // Tie-break. Two rows CAN share a sort_order — the editor always writes
        // 0..n-1, but a hand-written SQL fix-up need not — and falling through
        // to insertion order would resolve the tie by DOM order, which is not
        // the shipped order and reads as random. Resolve to the shipped
        // position instead, so a tie is at worst a no-op.
        tie: codeIndex[t] != null ? codeIndex[t] : present[t],
      };
      if (isHidden) hidden.push(t);
      if (grp) grp.tabs.push(entry);
      else top.push(entry);
    });

    function byOrder(a, b) { return (a.order - b.order) || (a.tie - b.tie); }
    groups.forEach(function (g) { stableSort(g.tabs, byOrder); });
    stableSort(top, byOrder);

    function names(list) {
      return list.filter(function (e) { return !e.hidden; }).map(function (e) { return e.tab; });
    }
    function entries(list) {
      return list.map(function (e) { return { tab: e.tab, hidden: e.hidden }; });
    }

    return {
      // What the rail renders: visible items only, as plain ids.
      groups: groups.filter(function (g) { return !g.hidden; })
        .map(function (g) { return { id: g.id, label: g.label, tabs: names(g.tabs) }; }),
      top: names(top),
      hidden: hidden,
      // What the Admin editor renders. Same placement, computed once — the
      // editor MUST show hidden items in position or there is no way to unhide
      // one, and re-deriving placement there would be a second implementation
      // free to drift from the one the menu actually uses.
      all: {
        groups: groups.map(function (g) {
          return { id: g.id, label: g.label, hidden: g.hidden, tabs: entries(g.tabs) };
        }),
        top: entries(top),
      },
    };
  }

  // Array.prototype.sort is only guaranteed stable in modern engines; ties here
  // decide menu order, so do it explicitly rather than depend on the runtime.
  function stableSort(arr, cmp) {
    var idx = arr.map(function (v, i) { return [v, i]; });
    idx.sort(function (a, b) { return cmp(a[0], b[0]) || (a[1] - b[1]); });
    for (var i = 0; i < arr.length; i++) arr[i] = idx[i][0];
    return arr;
  }

  // ── Per-tab lookups for cobi_orgs.js ──
  function labelFor(tab) { var o = get("tab", tab); return (o && o.label) || null; }
  function orgsFor(tab) {
    var o = get("tab", tab);
    return (o && o.orgs && o.orgs.length) ? o.orgs : null;
  }
  function isPinned(tab) {
    if (PROTECTED[tab] && tab === "admin") return true;   // Admin manages the sites; it cannot be filtered out BY one
    var o = get("tab", tab);
    return !!(o && o.pinned);
  }
  function isHidden(tab) {
    if (PROTECTED[tab]) return false;
    var o = get("tab", tab);
    return !!(o && o.hidden);
  }

  function notify() {
    listeners.slice().forEach(function (fn) {
      try { fn(); } catch (e) { /* one bad listener must not stop the others */ }
    });
  }

  /* Load order: the cache is applied SYNCHRONOUSLY if present, so a returning
   * visitor's arranged menu paints in one go instead of visibly reflowing. The
   * network read always wins and self-corrects a stale cache on the same load.
   * A failed fetch leaves whatever we had — cache, or pure code defaults. */
  function load() {
    var cached = readCache();
    if (cached && cached.length) { rows = cached; notify(); }
    return fetch(REST + "/cobi_nav?select=kind,key,label,parent,sort_order,hidden,orgs,pinned,updated_by,updated_at", {
      headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON },
    }).then(function (r) {
      if (!r.ok) throw new Error("nav overlay " + r.status);
      return r.json();
    }).then(function (list) {
      var clean = sanitize(list);
      if (clean == null) throw new Error("nav overlay: unexpected shape");
      rows = clean;
      loaded = true;
      writeCache(clean);
      notify();
      return clean;
    }).catch(function () {
      // Deliberately silent and deliberately non-fatal. The menu is already on
      // screen from code defaults; there is nothing for a visitor to do about
      // this, and an error here must never look like a broken site.
      loaded = true;
      return null;
    });
  }

  window.CPL_NAV_OVERLAY = {
    load: load,
    plan: plan,
    labelFor: labelFor,
    orgsFor: orgsFor,
    isPinned: isPinned,
    isHidden: isHidden,
    PROTECTED: PROTECTED,
    rows: function () { return rows; },
    isLoaded: function () { return loaded; },
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); },
    // Admin writes through here so the cache and every listener stay in step
    // with what was just saved, without a page reload.
    _set: function (list) { rows = sanitize(list) || []; writeCache(rows); notify(); },
    _sanitize: sanitize,
    _clearCache: function () { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} },
  };

  load();
})();
