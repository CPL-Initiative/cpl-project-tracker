/* admin.js — COBI Admin: the menu, and what actually protects it.
 *
 * WHY THIS TAB EXISTS
 * -------------------
 * Sam, 2026-08-14: "I want to make the COBI side menu items rearrangeable by
 * drag and drop from a single place where I can manage the org where they
 * appear, hierarchy, naming, visibility, and access via either team phrase or
 * magic link. It's getting busy and needs to be organized better." And:
 * "perhaps the COBI menu items should be part of an Admin tab."
 *
 * THE TRAP, WHICH THIS TAB IS BUILT AROUND
 * ----------------------------------------
 * The word in that request that will hurt someone is ACCESS. A nav setting is a
 * DISPLAY control. Hiding a menu item does not protect the data behind it — RLS
 * does. A manager UI with an access dropdown actively invites the opposite
 * belief, and someone acting on it would "secure" a tab by unticking a box while
 * every row behind it stayed readable to anyone holding the anon key.
 *
 * So the two halves are shown TOGETHER, and the distinction is structural rather
 * than a tooltip insisting on it: the left columns are what people SEE, the
 * right column is what actually STOPS them, read live from the database. You
 * cannot look at a row here without seeing both.
 *
 * MEASURED AT LOAD, NEVER CARRIED
 * -------------------------------
 *   * label / group / order  -> the live nav DOM
 *   * which sites show a tab -> window.CPL_ORGS
 *   * what gates each table  -> the cobi_rls_gates() RPC, live
 *   * tab -> tables          -> cobi_admin_surface.js (generated; the only part
 *                               a browser cannot work out for itself)
 * A carried list goes stale silently, and on this tab a stale list would be a
 * false claim about safety.
 *
 * GATING: reviewer magic-link only. A phrase holder able to re-scope what other
 * phrase holders see is the unresolved site-phrase superset problem one level
 * up, and worse. Deliberately NOT merged with Team Phrases, which stays its own
 * tab: that one is visible-to-all with reviewer-only contents, and folding a
 * rotation surface into a management surface would hide it from the people who
 * need to know it exists.
 *
 * Tests: tests/admin_tab.test.js
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var REST = SUPABASE_URL + "/rest/v1";

  var state = {
    loadState: "idle",   // idle|loading|ok|notreviewer|error|signedout
    error: null,
    gates: null,         // table -> {select_gate, write_gates, rls_enabled}
    q: "",               // filter box
    showAll: false,      // include tabs with no data surface
  };

  // ── Auth ──
  function isValidJwt(t) { return typeof t === "string" && t.split(".").length === 3 && t.length > 40; }
  function getSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem("cpl_sb") || "null");
      if (s && isValidJwt(s.access_token)) return { access_token: s.access_token, email: s.email || "(reviewer)" };
    } catch (e) {}
    return null;
  }
  // NOTE: deliberately does NOT fall back to the team phrase, unlike the other
  // team tabs. The phrase cannot open this surface, so accepting it here would
  // only produce a confident-looking page that fails on every read.
  function authHeaders() {
    var s = getSession();
    return {
      apikey: SUPABASE_ANON,
      Authorization: "Bearer " + ((s && s.access_token) || SUPABASE_ANON),
    };
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── Gate classification ───────────────────────────────────────────────────
   * Turns a Postgres boolean expression into the thing a human needs to know.
   * Ordered most-open first so `rank` doubles as "how exposed is this", which is
   * what lets a tab report its WEAKEST link rather than its strongest — a tab is
   * only as protected as its most open table, and reporting the strongest gate
   * would flatter every mixed tab on the page. */
  var GATES = [
    { id: "open",     rank: 0, label: "Anyone",            hint: "Readable by anyone who loads the page. Correct for published reference data; wrong for anything about a person." },
    { id: "public",   rank: 1, label: "Anyone",            hint: "A policy exists but it allows everyone to read. Same practical exposure as no policy." },
    { id: "team",     rank: 2, label: "Team phrase",       hint: "The shared team phrase, or a reviewer sign-in. Anyone the phrase has been passed to." },
    { id: "gr",       rank: 3, label: "GR phrase",         hint: "The Government Relations phrase, or a reviewer sign-in." },
    { id: "fin",      rank: 3, label: "Finance phrase",    hint: "The Finance phrase, or a reviewer sign-in." },
    { id: "reviewer", rank: 4, label: "Reviewer only",     hint: "A magic-link sign-in from an address on the reviewer list. The team phrase does NOT open these." },
    { id: "server",   rank: 5, label: "Server only",       hint: "RLS is on with no read policy at all, so nothing can read it through the public API — only a server holding the service key." },
    // A view has NO row-level security of its own. Unless it is security_invoker
    // it runs with its owner's rights and bypasses the RLS on its source tables
    // entirely, so it is ranked with the open cases rather than inheriting the
    // comfort of whatever it selects from. CLAUDE.md already carries this as a
    // standing warning about map_credential_student_rollup.
    { id: "view",     rank: 0, label: "A view — no rules of its own", hint: "Views and materialised views cannot carry row-level security. Unless it was created security_invoker it runs with its owner's rights and BYPASSES the protection on the tables underneath. Worth checking who holds the grant." },
    { id: "unknown",  rank: -1, label: "Not mapped",       hint: "This tab's data surface has not been mapped, so its gate is UNKNOWN — not 'none'. Treat it as unverified rather than safe." },
  ];
  function gateById(id) {
    for (var i = 0; i < GATES.length; i++) if (GATES[i].id === id) return GATES[i];
    return GATES[GATES.length - 1];
  }
  function classify(row) {
    if (!row) return gateById("unknown");
    // Checked BEFORE rls_enabled: a view always reports rls_enabled=false, so
    // the open branch would swallow it and lose the reason it is open.
    if (row.kind === "view" || row.kind === "matview") return gateById("view");
    if (!row.rls_enabled) return gateById("open");
    var q = row.select_gate;
    // NULL select_gate with RLS on is a DIFFERENT state from an expression: it
    // means no read policy exists at all, so PostgREST returns nothing to
    // anybody. Collapsing the two would report the most locked-down tables in
    // the system as the most exposed.
    if (q == null || q === "") return gateById("server");
    if (/\btrue\b/.test(q)) return gateById("public");
    if (/fin_pass_ok/.test(q)) return gateById("fin");
    if (/gr_pass_ok/.test(q)) return gateById("gr");
    if (/team_pass_ok/.test(q)) return gateById("team");
    if (/is_allowed_reviewer/.test(q)) return gateById("reviewer");
    return gateById("unknown");
  }

  // ── Live measurements ──
  function surface() {
    var s = window.COBI_ADMIN_SURFACE;
    return (s && s.tabs) ? s : { tabs: {}, unmeasured: [] };
  }

  /* Read the nav rail as it actually is. Not a list in this file: the nav is
   * regenerated daily and edited by other modules, so anything hand-kept here
   * would describe a menu that no longer exists. */
  function navItems() {
    var out = [];
    var nav = document.querySelector("nav.cpl-tabs");
    if (!nav) return out;
    var btns = nav.querySelectorAll(".cpl-tab[data-tab]");
    Array.prototype.forEach.call(btns, function (b, i) {
      var group = b.closest ? b.closest(".cpl-nav-group") : null;
      var head = group ? group.querySelector(".cpl-nav-group-head") : null;
      var label = (b.textContent || "").trim();
      out.push({
        tab: b.getAttribute("data-tab"),
        label: label,
        order: i,
        group: head ? (head.textContent || "").replace(/[▾▸]/g, "").trim() : "",
        hiddenNow: b.getAttribute("data-org-hidden") === "1",
      });
    });
    return out;
  }

  /* Which sites show a tab. Computed from CPL_ORGS rather than restated, so the
   * answer cannot drift from the filter that actually runs. */
  function sitesFor(tab) {
    var O = window.CPL_ORGS;
    if (!O || !O.ORGS) return null;
    var always = (O.ALWAYS || []).indexOf(tab) !== -1;
    var exclusive = (O.EXCLUSIVE || []).indexOf(tab) !== -1;
    var out = [];
    O.ORGS.forEach(function (o) {
      var shown = always || (o.tabs ? o.tabs.indexOf(tab) !== -1 : !exclusive);
      if (shown) out.push(o.label);
    });
    return { sites: out, always: always, exclusive: exclusive, total: O.ORGS.length };
  }

  function loadGates() {
    if (!getSession()) {
      state.loadState = "signedout";
      return Promise.resolve();
    }
    state.loadState = "loading";
    // Content-Type + an explicit empty argument object: PostgREST can answer a
    // bodyless POST with 415, which would surface here as "could not check" —
    // an honest message for a failure that never needed to happen.
    var h = authHeaders();
    h["Content-Type"] = "application/json";
    return fetch(REST + "/rpc/cobi_rls_gates", { method: "POST", headers: h, body: "{}" })
      .then(function (r) {
        if (!r.ok) throw new Error("gates " + r.status);
        return r.json();
      })
      .then(function (rows) {
        // The database always has tables, so an empty result is not "no tables"
        // — it is the RLS gate filtering a non-reviewer to zero rows. That
        // inference is only safe BECAUSE the set is known non-empty; the same
        // reasoning is wrong on sierra_rules, which is seeded empty on purpose.
        if (!Array.isArray(rows) || rows.length === 0) { state.loadState = "notreviewer"; state.gates = null; return; }
        var m = {};
        rows.forEach(function (r) { if (r && r.tbl) m[r.tbl] = r; });
        state.gates = m;
        state.loadState = "ok";
      })
      .catch(function (e) {
        // A failed read is never rendered as "nothing is protected".
        state.loadState = "error";
        state.error = (e && e.message) || "read failed";
        state.gates = null;
      });
  }

  /* The weakest gate across a tab's tables — see the ordering note on GATES.
   *
   * A tab that calls only STORED FUNCTIONS (RPCs) and no tables directly is NOT
   * a tab with nothing to protect. cpl_chat is the clearest case: Sierra reaches
   * most of the corpus through RPCs, so treating "no table references" as "no
   * data" would file the widest data surface in the app under nothing-to-see.
   * An RPC's own gate lives inside its body (security definer), which this page
   * does not read — so the honest answer is UNKNOWN with the reason stated,
   * never a blank. */
  function tabGate(tab) {
    var s = surface().tabs[tab];
    if (!s || !s.measured) return { gate: gateById("unknown"), tables: [], rpcs: [], measured: false };
    var tables = (s.reads || []).concat(s.writes || []);
    var rpcs = s.rpcs || [];
    if (!tables.length && rpcs.length) {
      return { gate: gateById("unknown"), tables: [], rpcs: rpcs, measured: true, rpcOnly: true };
    }
    if (!tables.length) return { gate: null, tables: [], rpcs: [], measured: true };
    var worst = null;
    tables.forEach(function (t) {
      var g = classify(state.gates ? state.gates[t] : null);
      if (!worst || g.rank < worst.rank) worst = g;
    });
    return { gate: worst, tables: tables, rpcs: rpcs, measured: true };
  }

  // ── CSS (var(--token) only) ──
  var CSS_ID = "cobi-admin-css";
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var el = document.createElement("style");
    el.id = CSS_ID;
    el.textContent = [
      ".adm { max-width: 1150px; margin: 0 auto; color: var(--text-body); }",
      ".adm h2 { color: var(--navy-primary); margin: 16px 0 4px; }",
      ".adm h3 { color: var(--navy-primary); margin: 22px 0 8px; font-size: 1.02rem; }",
      ".adm-intro { color: var(--text-muted); max-width: 900px; margin: 0 0 12px; font-size: .92rem; }",
      ".adm-chip { display:inline-block; margin-left:8px; background: var(--mustard-fill, #f2dca0); color: var(--text-strong, #4a3a00); font-size:.62rem; font-weight:700; letter-spacing:.08em; padding:2px 8px; border-radius:10px; text-transform:uppercase; vertical-align:middle; }",
      ".adm-warn { font-size:.85rem; color: var(--text-body); background: var(--mustard-fill, #f2dca0); border-radius:8px; padding:10px 13px; max-width:900px; margin:0 0 14px; }",
      ".adm-empty { border:1px dashed var(--border-strong); border-radius:8px; background: var(--surface-subtle); color: var(--text-muted); padding:26px; text-align:center; }",
      ".adm-stat { display:flex; flex-wrap:wrap; gap:10px; margin:0 0 14px; }",
      ".adm-stat .box { flex:1 1 130px; border:1px solid var(--border); border-radius:8px; background: var(--surface-subtle); padding:10px 12px; cursor:help; }",
      ".adm-stat .box .n { font-size:1.4rem; font-weight:700; color: var(--navy-primary); }",
      ".adm-stat .box .l { font-size:.7rem; color: var(--text-muted); text-transform:uppercase; letter-spacing:.05em; }",
      ".adm-toolbar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:0 0 10px; }",
      ".adm-input { padding:6px 10px; border:1px solid var(--border-strong); border-radius:6px; font-size:.82rem; background: var(--surface-opaque); color: var(--text-body); min-width:220px; }",
      ".adm-check { font-size:.82rem; color: var(--text-body); display:flex; align-items:center; gap:5px; }",
      ".adm-count { font-size:.8rem; color: var(--text-muted); margin-left:auto; }",
      // table-layout:fixed + an explicit colgroup — auto layout has silently
      // parked columns past the wrapper's right edge here before (the CCR).
      ".adm-tablewrap { overflow-x:auto; border:1px solid var(--border); border-radius:8px; }",
      ".adm-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:.82rem; }",
      ".adm-table th { text-align:left; background: var(--surface-subtle); color: var(--text-muted); font-size:.68rem; text-transform:uppercase; letter-spacing:.05em; padding:7px 9px; border-bottom:1px solid var(--border); }",
      ".adm-table td { padding:6px 9px; border-bottom:1px solid var(--border); vertical-align:top; }",
      ".adm-table tr:last-child td { border-bottom:none; }",
      ".adm-table .nm { font-weight:600; color: var(--text-strong); }",
      ".adm-table .sub { font-size:.72rem; color: var(--text-muted); }",
      ".adm-trunc { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }",
      // The security column is the point of the table; it must not read as one
      // more attribute among the display ones.
      ".adm-table .gatecol { border-left:3px solid var(--navy-secondary, #1c3d5a); }",
      ".adm-g { font-size:.7rem; border-radius:10px; padding:1px 8px; white-space:nowrap; cursor:help; background: var(--surface-muted); color: var(--text-muted); }",
      ".adm-g-open, .adm-g-public { color: var(--brick, #8c2f22); background: rgba(140,47,34,.10); font-weight:700; }",
      ".adm-g-team, .adm-g-gr, .adm-g-fin { color: var(--text-strong, #4a3a00); background: var(--mustard-fill, #f2dca0); }",
      ".adm-g-reviewer, .adm-g-server { color: var(--hunter, #2c601a); background: rgba(44,96,26,.10); font-weight:700; }",
      ".adm-g-unknown { color: var(--text-muted); background: var(--surface-muted); font-style:italic; }",
      ".adm-note { font-size:.76rem; color: var(--text-muted); border-left:3px solid var(--border-strong); padding:4px 10px; margin:14px 0 0; }",
      ".adm-soon { border:1px dashed var(--border-strong); border-radius:8px; background: var(--surface-subtle); padding:12px 14px; margin:14px 0 0; font-size:.84rem; color: var(--text-body); }",
      ".adm-soon b { color: var(--navy-primary); }",
    ].join("\n");
    document.head.appendChild(el);
  }

  // ── Render ──
  function render(root) {
    ensureCss();
    var h = '<div class="adm">';
    h += '<h2>Admin <span class="adm-chip">Reviewer only</span></h2>';
    h += '<p class="adm-intro">One place to see every item in the COBI side menu — what it is called, '
      + "where it sits, which sites show it — and, beside it, what actually protects the data behind it.</p>";

    // Said once, plainly, at the top. This is the whole reason the two halves
    // share a table rather than living on separate screens.
    h += '<div class="adm-warn">⚠ <b>Hiding a menu item is not a security setting.</b> The menu controls what '
      + "people <i>see</i>. What stops someone reading the data is the database's own rules, and those are in "
      + "the last column — read live, not described here. A tab can be hidden from every site and still have "
      + "every row behind it readable by anyone.</div>";

    if (state.loadState === "loading") { h += '<div class="adm-empty">Loading…</div></div>'; root.innerHTML = h; return; }
    if (state.loadState === "signedout") {
      h += '<div class="adm-empty"><b>Admin needs a personal sign-in.</b><br>Sign in with a magic link on the '
        + "<b>Team &amp; RACI</b> tab using an address on the reviewer list, then re-open this tab. The shared "
        + "team phrase does not open Admin — someone who could re-scope what other phrase holders see would be "
        + "a wider power than the phrase is meant to carry.</div></div>";
      root.innerHTML = h; return;
    }
    if (state.loadState === "notreviewer") {
      h += '<div class="adm-empty"><b>Signed in, but not as a reviewer.</b><br>Your address is not on the '
        + "reviewer list, so the database returns nothing here. This is a closed door, not an empty system — "
        + "the menu and its protections are all in place. Ask an existing reviewer to add you.</div></div>";
      root.innerHTML = h; return;
    }
    if (state.loadState === "error") {
      h += '<div class="adm-empty">Could not read the database rules (' + esc(state.error) + "). "
        + "This does <b>not</b> mean nothing is protected — it means this page could not check. Re-open the "
        + "tab to try again.</div></div>";
      root.innerHTML = h; return;
    }

    var items = navItems();
    var surf = surface();

    // ── Summary ──
    var counts = {};
    var unmapped = 0;
    items.forEach(function (it) {
      var g = tabGate(it.tab);
      if (!g.measured) { unmapped++; return; }
      if (!g.gate) return;                       // measured, touches no data
      counts[g.gate.id] = (counts[g.gate.id] || 0) + 1;
    });
    var tableCount = state.gates ? Object.keys(state.gates).length : 0;
    var openTables = 0, serverTables = 0;
    if (state.gates) {
      Object.keys(state.gates).forEach(function (t) {
        var c = classify(state.gates[t]);
        if (c.id === "open" || c.id === "public") openTables++;
        if (c.id === "server") serverTables++;
      });
    }
    h += '<div class="adm-stat">'
      + '<div class="box" title="Every item in the side menu right now, read from the menu itself."><div class="n">'
      + items.length + '</div><div class="l">Menu items</div></div>'
      + '<div class="box" title="Sites in the Site dropdown. A menu item can appear in several."><div class="n">'
      + ((window.CPL_ORGS && window.CPL_ORGS.ORGS) ? window.CPL_ORGS.ORGS.length : "?") + '</div><div class="l">Sites</div></div>'
      + '<div class="box" title="Tables in the database, with the rules that gate them read live."><div class="n">'
      + tableCount + '</div><div class="l">Tables</div></div>'
      + '<div class="box" title="Tables anyone loading the page can read. Correct for published reference data — worth a look for anything else."><div class="n">'
      + openTables + '</div><div class="l">Readable by anyone</div></div>'
      + '<div class="box" title="Tables with row-level security on and no read rule at all, so only a server holding the service key can read them."><div class="n">'
      + serverTables + '</div><div class="l">Server only</div></div>'
      + '<div class="box" title="Menu items whose data surface has not been mapped. Their protection is UNKNOWN, not none."><div class="n">'
      + unmapped + '</div><div class="l">Not mapped</div></div>'
      + "</div>";

    // ── Section 1: the menu ──
    h += "<h3>Menu items</h3>";
    var q = state.q.trim().toLowerCase();
    var rows = items.filter(function (it) {
      if (q && (it.label + " " + it.tab + " " + it.group).toLowerCase().indexOf(q) === -1) return false;
      if (!state.showAll) {
        var g = tabGate(it.tab);
        // Default view hides tabs that touch no data AND are fully mapped —
        // there is nothing to say about them here. Anything unmapped, or
        // reaching data through a function, STAYS visible: "we don't know" is
        // the row worth looking at, and hiding it is the false clean bill.
        if (g.measured && !g.gate && !g.rpcOnly) return false;
      }
      return true;
    });
    h += '<div class="adm-toolbar">'
      + '<input class="adm-input" data-q placeholder="Filter by name, group or id" value="' + esc(state.q) + '">'
      + '<label class="adm-check" title="Also list menu items that touch no stored data at all — static pages and '
      + 'built-in reports. They are hidden by default because there is nothing to protect.">'
      + '<input type="checkbox" data-showall' + (state.showAll ? " checked" : "") + "> include items with no stored data</label>"
      + '<span class="adm-count">' + rows.length + " of " + items.length + "</span>"
      + "</div>";

    h += '<div class="adm-tablewrap"><table class="adm-table">'
      + "<colgroup><col style=\"width:24%\"><col style=\"width:17%\"><col style=\"width:22%\">"
      + "<col style=\"width:16%\"><col style=\"width:21%\"></colgroup>"
      + "<thead><tr>"
      + '<th title="The label as it appears in the side menu, read from the menu itself.">Menu item</th>'
      + '<th title="The heading it sits under in the side menu. Blank means it sits at the top level.">Group</th>'
      + '<th title="Which sites in the Site dropdown show it. This is DISPLAY only.">Shown on (display)</th>'
      + '<th title="How many database tables this item reads or writes.">Data</th>'
      + '<th class="gatecol" title="What actually stops someone reading that data, read live from the database. '
      + 'This is the only column on this table that is a security control.">Actually protected by</th>'
      + "</tr></thead><tbody>";

    if (!rows.length) {
      h += '<tr><td colspan="5" class="sub">Nothing matches that filter.</td></tr>';
    }
    rows.forEach(function (it) {
      var g = tabGate(it.tab);
      var st = sitesFor(it.tab);
      var siteTxt = st
        ? (st.always ? "Every site" : (st.sites.length ? st.sites.join(", ") : "None"))
        : "unknown";
      var siteTitle = st
        ? (st.always
            ? "Pinned to every site — it manages them, so it cannot be filtered out by one."
            : (st.exclusive
                ? "Kept out of the default view; appears only under its own site."
                : st.sites.length + " of " + st.total + " sites"))
        : "";
      var gate = g.gate;
      var gateTxt, gateCls, gateTitle;
      if (g.rpcOnly) {
        gateTxt = "Via functions"; gateCls = "unknown";
        gateTitle = "This item reaches data through stored database functions (" + g.rpcs.join(", ")
          + ") rather than tables directly. Each function carries its own rules inside it, which this "
          + "page does not read — so its protection is UNKNOWN here, not none.";
      } else if (!g.measured) {
        gateTxt = "Not mapped"; gateCls = "unknown"; gateTitle = gateById("unknown").hint;
      } else if (!gate) {
        gateTxt = "No stored data"; gateCls = "unknown";
        gateTitle = "This item does not read or write any database table — it is a static page or a built-in report.";
      } else {
        gateTxt = gate.label; gateCls = gate.id;
        gateTitle = gate.hint + (g.tables.length > 1
          ? "\n\nShown for the LEAST protected of its " + g.tables.length + " tables: " + g.tables.join(", ")
          : "\n\nTable: " + g.tables.join(", "));
      }
      h += "<tr>"
        + '<td><span class="nm adm-trunc" title="' + esc(it.label) + '">' + esc(it.label) + "</span>"
        + '<span class="sub adm-trunc">' + esc(it.tab) + "</span></td>"
        + '<td><span class="adm-trunc sub" title="' + esc(it.group || "Top level") + '">'
        + esc(it.group || "— top level —") + "</span></td>"
        + '<td><span class="adm-trunc" title="' + esc(siteTitle) + '">' + esc(siteTxt) + "</span></td>"
        + '<td><span class="sub">' + (g.measured
            ? (g.tables.length
                ? g.tables.length + " table" + (g.tables.length === 1 ? "" : "s")
                : (g.rpcs.length ? g.rpcs.length + " function" + (g.rpcs.length === 1 ? "" : "s") : "none"))
            : "unknown") + "</span></td>"
        + '<td class="gatecol"><span class="adm-g adm-g-' + gateCls + '" title="' + esc(gateTitle) + '">'
        + esc(gateTxt) + "</span></td>"
        + "</tr>";
    });
    h += "</tbody></table></div>";

    if (unmapped) {
      h += '<p class="adm-note"><b>' + unmapped + " menu item" + (unmapped === 1 ? " is" : "s are")
        + " not mapped.</b> Those are rendered by the page itself, or by modules shared across several tabs, "
        + "so the automatic scan cannot say which data belongs to which tab. Their protection is <b>unknown</b>, "
        + "not none — do not read a blank there as a clean bill of health.</p>";
    }

    // ── Section 2: what the gates mean ──
    h += "<h3>What the protections mean</h3>";
    h += '<div class="adm-tablewrap"><table class="adm-table">'
      + "<colgroup><col style=\"width:20%\"><col style=\"width:12%\"><col style=\"width:68%\"></colgroup>"
      + "<thead><tr><th>Protection</th><th>Tables</th><th>What it means</th></tr></thead><tbody>";
    var seen = {};
    GATES.forEach(function (gt) {
      if (gt.id === "unknown" || seen[gt.label + gt.id]) return;
      var n = 0;
      if (state.gates) {
        Object.keys(state.gates).forEach(function (t) { if (classify(state.gates[t]).id === gt.id) n++; });
      }
      if (!n) return;
      h += "<tr><td><span class=\"adm-g adm-g-" + gt.id + '">' + esc(gt.label) + "</span></td>"
        + '<td class="sub">' + n + "</td>"
        + '<td class="sub">' + esc(gt.hint) + "</td></tr>";
    });
    h += "</tbody></table></div>";

    // ── What is not built yet, said plainly ──
    h += '<div class="adm-soon"><b>Not built yet: rearranging the menu.</b> Reordering, renaming and moving '
      + "items between sites needs the menu itself to become data — today the order lives in "
      + "<code>nav_groups.js</code>, the site mapping in <code>cobi_orgs.js</code>, and the labels in the page "
      + "markup, so there is nothing here for a drag to write to. Making it editable changes what "
      + "<i>every</i> visitor sees, so it is its own change rather than a quiet extension of this one. "
      + "This page is the inventory it will be built on.</div>";

    h += '<p class="adm-note">Admin is pinned to every site, because it manages them — it cannot be filtered '
      + "out by the site you are trying to fix. The team phrases themselves stay on their own <b>Team Phrases</b> "
      + "tab: that one is visible to everyone with its contents held to a reviewer, so folding it in here would "
      + "hide the existence of the phrases from the people who most need to know they exist.</p>";

    h += "</div>";
    root.innerHTML = h;
    wire(root);
  }

  function wire(root) {
    var q = root.querySelector("[data-q]");
    if (q) q.addEventListener("input", function () {
      state.q = q.value;
      render(root);
      // Re-focus and restore the caret: render() rewrites innerHTML, so without
      // this the box loses focus on the first keystroke and the filter is
      // unusable.
      var again = root.querySelector("[data-q]");
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
    var all = root.querySelector("[data-showall]");
    if (all) all.addEventListener("change", function () { state.showAll = all.checked; render(root); });
  }

  function activate() {
    var root = document.getElementById("admin-root");
    if (!root) return;
    if (state.loadState === "ok") { render(root); return; }
    render(root);
    loadGates().then(function () { render(root); });
  }

  window.CPL_ADMIN_TAB = {
    activate: activate,
    render: render,
    _state: state,
    _classify: classify,
    _gateById: gateById,
    _tabGate: tabGate,
    _navItems: navItems,
    _sitesFor: sitesFor,
    _loadGates: loadGates,
    _authHeaders: authHeaders,
    _GATES: GATES,
  };

  window.addEventListener("cpl-tab-activated", function (e) {
    if (e && e.detail && e.detail.tab === "admin") activate();
  });
})();
