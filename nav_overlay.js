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

  /* Tabs the AUDIENCE filter may not touch — a shorter list than PROTECTED, and
   * the difference is whether the viewer can get themselves back.
   *
   * `hidden` is irrecoverable from the browser: nothing the viewer does brings
   * the item back, so both protected tabs ignore it. An audience rule IS
   * recoverable — sign in and the item returns — so `admin` may carry one. Only
   * `dashboard` is locked, because it is where every deep link falls back to and
   * a public visitor arriving at a site with no home has nowhere to go. */
  var AUDIENCE_LOCKED = { dashboard: true };

  /* Tabs that may not be put inside a category — the THIRD list, and the
   * shortest, because it guards the narrowest thing.
   *
   * Being in a category was treated as equivalent to being hideable, so both
   * protected tabs were barred from one. That is stricter than the guarantee
   * needs: plan() below already LIFTS a protected tab out of a hidden group
   * rather than letting it disappear with it, so Admin inside a category that
   * someone hides reappears at the top level — visible, and undoable from the
   * tab itself. The door is already sealed one layer down.
   *
   * `dashboard` stays barred, and for a different reason than hiding: it is
   * where every deep link falls back to, and a fallback that can be one click
   * inside a collapsed heading is a worse landing place than a pinned row.
   *
   * Sam, 2026-08-15: "I added a category called Settings… seems it would make
   * sense to have Admin be over this and separate out Admin from where the
   * Dashboard lives." */
  var GROUP_LOCKED = { dashboard: true };

  /* What the current viewer holds. Ordered, so a rule is a floor rather than an
   * exact match: a magic-link holder satisfies `signed_in` too.
   *
   * Read defensively and INDEPENDENTLY. Storage access throws in some private
   * modes, and catching per credential rather than around the whole function
   * matters: a localStorage failure must not also revoke a magic-link session
   * that lives in sessionStorage. There is no network here, so there is no
   * "unknown" state to fall back from — absent is absent. */
  var AUDIENCE_RANK = { everyone: 0, signed_in: 1, magic_link: 2 };
  var PHRASE_KEYS = ["cpl_team_pass", "cpl_gr_pass", "cpl_fin_pass"];

  function hasMagicLink() {
    try {
      var s = JSON.parse(sessionStorage.getItem("cpl_sb") || "null");
      var t = s && s.access_token;
      return typeof t === "string" && t.split(".").length === 3 && t.length > 40;
    } catch (e) { return false; }
  }
  function hasPhrase() {
    for (var i = 0; i < PHRASE_KEYS.length; i++) {
      try { if (localStorage.getItem(PHRASE_KEYS[i])) return true; }
      catch (e) { /* this key is unreadable; the others may not be */ }
    }
    return false;
  }
  function viewerRank() {
    if (hasMagicLink()) return AUDIENCE_RANK.magic_link;
    if (hasPhrase()) return AUDIENCE_RANK.signed_in;
    return AUDIENCE_RANK.everyone;
  }

  /* Does the viewer clear this tab's audience floor?
   *
   * ⚠ DISPLAY ONLY. A false here removes the item from the MENU. The pane still
   * exists, the deep link still routes, and the data behind it is exactly as
   * protected as its RLS policies make it. */
  function audienceAllows(tab) {
    if (AUDIENCE_LOCKED[tab]) return true;
    var o = get("tab", tab);
    var need = AUDIENCE_RANK[(o && o.audience) || "everyone"];
    if (need == null) return true;   // an unknown value must never hide anything
    return viewerRank() >= need;
  }

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
        // An unrecognised value degrades to 'everyone'. A typo must never hide a
        // menu item from everybody — the failure has to land on the harmless side.
        audience: (r.audience === "signed_in" || r.audience === "magic_link") ? r.audience : "everyone",
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
        codeGroup: true,
        tabs: [],
      };
    });

    /* Categories the CURATOR created, which exist only in the overlay.
     *
     * Until now a group had to be in nav_groups.js, so "+ Add category" was
     * impossible and — worse — a tab parented to an unknown group silently
     * degraded to top level, which is exactly what a curator-made group would
     * have looked like.
     *
     * They are appended AFTER the code groups before sorting, so a row with no
     * sort_order lands at the end rather than jumping the shipped menu. A group
     * needs a LABEL to exist: `sanitize` nulls a blank one, and a heading with
     * no name is not something the curator can find again to fix or delete. */
    var codeCount = groups.length;
    (rows || []).forEach(function (r) {
      if (r.kind !== "group" || groupIds[r.key] || !r.label) return;
      groupIds[r.key] = true;
      groups.push({
        id: r.key,
        label: r.label,
        hidden: !!r.hidden,
        order: r.sort_order != null ? r.sort_order : codeCount + groups.length,
        codeGroup: false,
        tabs: [],
      });
    });
    stableSort(groups, function (a, b) { return a.order - b.order; });

    var byId = {};
    groups.forEach(function (g) { byId[g.id] = g; });

    // ── Tabs into their containers ──
    var top = [], hidden = [], audienceHidden = [];
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
      // Tracked SEPARATELY from `hidden`, not folded into it. They mean
      // different things to the editor: a hidden item is crossed out and offers
      // "show again", whereas an audience-filtered one is not hidden at all —
      // it is simply not for this viewer, and rendering it as hidden would tell
      // a curator their menu is disabled when it is working exactly as set.
      if (!isHidden && !audienceAllows(t)) audienceHidden.push(t);
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
      return list.map(function (e) {
        var o = get("tab", e.tab);
        return {
          tab: e.tab, hidden: e.hidden,
          audience: (o && o.audience) || "everyone",
          audienceHidden: audienceHidden.indexOf(e.tab) !== -1,
        };
      });
    }

    return {
      /* What the rail renders: visible items only, as plain ids.
       *
       * EMPTY groups are kept here on purpose — `makeGroup` in nav_groups.js
       * already returns null for a group with no members, so the rail never
       * draws a heading over empty space, and filtering here as well would
       * only remove the editor's drop targets. A curator-created category is
       * empty the moment it is made and still has to be draggable-into. */
      groups: groups.filter(function (g) { return !g.hidden; })
        .map(function (g) { return { id: g.id, label: g.label, tabs: names(g.tabs) }; }),
      top: names(top),
      hidden: hidden,
      audienceHidden: audienceHidden,
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
  /* The single question every consumer should ask: should this button be off the
   * menu right now, for any reason? nav_groups.js and cobi_orgs.js both call
   * this rather than combining the two rules themselves — they run at different
   * moments and a duplicated `||` is exactly how they would drift apart. */
  function isMenuHidden(tab) {
    return isHidden(tab) || !audienceAllows(tab);
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
    /* ⚠ EVERY COLUMN sanitize() READS MUST BE IN THIS LIST.
     *
     * `audience` was missing from 2026-08-14 (when the column shipped) to
     * 2026-08-15. PostgREST returns only what is selected, so `r.audience` was
     * always undefined, sanitize() defaulted it to "everyone", and the result
     * was worse than a broken filter — it was a SILENT one, wrong in three
     * places at once:
     *   1. audienceAllows() always returned true, so the rule never hid anything
     *      from anybody. A curator setting "magic link only" changed nothing.
     *   2. The Admin editor hydrates its draft from these rows, so it displayed
     *      "Everyone" for every tab — agreeing with itself, and with nothing.
     *   3. A save writes the whole row back, so ANY edit erased every audience
     *      in the table. Sam lost nine of them in one drag.
     *
     * An explicit select list is a SECOND schema that has to be maintained in
     * step with the first, and nothing failed when it drifted. The test
     * `nav_overlay.test.js` now derives the required columns from sanitize()
     * itself and asserts they are all here, so the next column cannot repeat it.
     * Do not "simplify" this to select=* either — the point is that the two
     * lists are checked against each other, not that one of them is long. */
    return fetch(REST + "/cobi_nav?select=kind,key,label,parent,sort_order,hidden,orgs,pinned,audience,updated_by,updated_at", {
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

  /* Re-evaluate when the viewer's credentials change.
   *
   * An audience rule is the only part of this module that depends on WHO is
   * looking, so it is the only part that can go stale without the table
   * changing. A magic-link sign-in always arrives with a full page load (the
   * redirect comes back to this page), so the case that actually needs handling
   * is the team phrase, which unlocks in place.
   *
   * `cpl-team-pass-unlocked` is team_phrase.js's own announcement. The `storage`
   * event covers signing in or out in ANOTHER tab, which would otherwise leave
   * this one showing a menu for credentials it no longer has. Both just re-run
   * the listeners; nothing is re-fetched, because the arrangement has not changed
   * — only who it is being evaluated for. */
  var lastRank = null;
  function recheckViewer() {
    var r = viewerRank();
    if (r === lastRank) return;   // nothing to do, and a needless rebuild loses group open/closed state
    lastRank = r;
    notify();
  }
  try {
    lastRank = viewerRank();
    window.addEventListener("cpl-team-pass-unlocked", recheckViewer);
    window.addEventListener("storage", recheckViewer);
    window.addEventListener("cpl-tab-activated", recheckViewer);
  } catch (e) { /* a missing listener costs the live refresh, never the menu */ }

  window.CPL_NAV_OVERLAY = {
    load: load,
    recheckViewer: recheckViewer,
    plan: plan,
    labelFor: labelFor,
    orgsFor: orgsFor,
    isPinned: isPinned,
    isHidden: isHidden,
    isMenuHidden: isMenuHidden,
    audienceAllows: audienceAllows,
    viewerRank: viewerRank,
    AUDIENCE_RANK: AUDIENCE_RANK,
    AUDIENCE_LOCKED: AUDIENCE_LOCKED,
    GROUP_LOCKED: GROUP_LOCKED,
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
