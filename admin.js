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
    // ── Arrange (drag and drop) ──
    // `draft` is the working arrangement. It is built from the live nav + the
    // overlay and mutated locally; nothing reaches the database until Save, so
    // a mis-drag costs a click on Discard rather than everyone's menu.
    draft: null,         // {containers:[{id,label,isTop,hidden,tabs:[…]}]}
    dirty: false,
    saving: false,
    saveMsg: null,
    editKey: null,       // "tab:<id>" | "group:<id>" open for rename / sites
    dragKey: null,
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
    { id: "open",     rank: 0, label: "Anyone",            short: "Anyone",        hint: "Readable by anyone who loads the page. Correct for published reference data; wrong for anything about a person." },
    { id: "public",   rank: 1, label: "Anyone",            short: "Anyone",        hint: "A policy exists but it allows everyone to read. Same practical exposure as no policy." },
    { id: "team",     rank: 2, label: "Team phrase",       short: "Team phrase",   hint: "The shared team phrase, or a reviewer sign-in. Anyone the phrase has been passed to." },
    { id: "gr",       rank: 3, label: "GR phrase",         short: "GR phrase",     hint: "The Government Relations phrase, or a reviewer sign-in." },
    { id: "fin",      rank: 3, label: "Finance phrase",    short: "Finance phrase", hint: "The Finance phrase, or a reviewer sign-in." },
    { id: "reviewer", rank: 4, label: "Reviewer only",     short: "Reviewer",      hint: "A magic-link sign-in from an address on the reviewer list. The team phrase does NOT open these." },
    { id: "server",   rank: 5, label: "Server only",       short: "Server only",   hint: "RLS is on with no read policy at all, so nothing can read it through the public API — only a server holding the service key." },
    // A view has NO row-level security of its own. Unless it is security_invoker
    // it runs with its owner's rights and bypasses the RLS on its source tables
    // entirely, so it is ranked with the open cases rather than inheriting the
    // comfort of whatever it selects from. CLAUDE.md already carries this as a
    // standing warning about map_credential_student_rollup.
    { id: "view",     rank: 0, label: "A view — no rules of its own", short: "View — no rules", hint: "Views and materialised views cannot carry row-level security. Unless it was created security_invoker it runs with its owner's rights and BYPASSES the protection on the tables underneath. Worth checking who holds the grant." },
    { id: "unknown",  rank: -1, label: "Not mapped",       short: "Not mapped",    hint: "This tab's data surface has not been mapped, so its gate is UNKNOWN — not 'none'. Treat it as unverified rather than safe." },
    /* Two states that are NOT findings about a tab, and must never be rendered
     * as one. `nodata` is a tab that reads nothing at all; `unread` is every tab
     * at once, because the gate measurement itself did not come back.
     *
     * Without `unread`, a failed or signed-out gate read classifies every table
     * as unknown and the row chips would report "Not mapped" 35 times over —
     * indistinguishable from a genuine finding that nothing on the site is
     * mapped. The reason the answer is missing belongs in the chip. */
    { id: "nodata",   rank: 9, label: "No data of its own", short: "No data",     hint: "This tab reads no Supabase table and calls no stored function — it renders content that ships with the page. There is nothing here for database rules to protect." },
    { id: "unread",   rank: -1, label: "Protection unread", short: "Unread",      hint: "The live protection check has not returned, so this is not a finding about this tab — nothing was measured. See the note at the top of the protection section for why." },
  ];
  /* ── Visibility: ONE ladder, not two controls ───────────────────────────────
   *
   * `hidden` and `audience` were separate affordances — an 👁 toggle on the row
   * and a select buried in the ✏️ editor — but they are rungs of a single
   * question: who sees this in the menu? Everyone → signed-in → magic-link only
   * → nobody. Sam, 2026-08-14, having pressed 👁: he expected it to ASK which,
   * and the two-control split is also what let him narrow an audience while
   * meaning only to annotate one.
   *
   * The storage stays two columns because they mean different things to plan()
   * (an audience rule is per-viewer and recoverable; `hidden` is neither), so
   * the merge is at the CONTROL, not in the table. rungOf/applyRung are the only
   * places that translate, and `hidden` deliberately leaves `audience` intact so
   * un-hiding restores the rung the item had rather than silently widening it to
   * everyone. */
  var RUNGS = [
    { id: "everyone",   icon: "👁", short: "Everyone",   label: "Everyone",
      note: "Anyone who loads the site sees it in the menu." },
    { id: "signed_in",  icon: "👥", short: "Signed-in",  label: "Signed-in people (team phrase or magic link)",
      note: "Taken out of the menu for anyone who has not entered a team phrase or signed in." },
    { id: "magic_link", icon: "🔑", short: "Magic link", label: "Magic-link sign-in only",
      note: "Taken out of the menu for everyone except magic-link sign-ins. The team phrase does not reveal it." },
    { id: "nobody",     icon: "🙈", short: "Hidden",     label: "Nobody — take it out of the menu",
      note: "Removed from the menu for everyone, including you. The page still opens for anyone holding the "
        + "link, and the data behind it is unchanged." },
  ];
  function rungById(id) {
    for (var i = 0; i < RUNGS.length; i++) if (RUNGS[i].id === id) return RUNGS[i];
    return RUNGS[0];
  }
  function rungOf(item) {
    if (!item) return RUNGS[0];
    if (item.hidden) return rungById("nobody");
    return rungById(item.audience || "everyone");
  }
  function applyRung(item, id) {
    if (!item) return;
    if (id === "nobody") { item.hidden = true; return; }
    item.hidden = false;
    item.audience = id;
  }
  /* Which rungs this tab may take. Protection is enforced HERE as well as in the
   * overlay and the drag — an option that cannot be honoured must not be offered,
   * or the control lies about what it will do. */
  function rungsFor(tab) {
    var ov = window.CPL_NAV_OVERLAY;
    if (ov.AUDIENCE_LOCKED[tab] && ov.PROTECTED[tab]) return [];
    return RUNGS.filter(function (r) {
      if (r.id === "nobody") return !ov.PROTECTED[tab];
      if (r.id !== "everyone") return !ov.AUDIENCE_LOCKED[tab];
      return true;
    });
  }

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

  /* The gate as a menu ROW should state it — every row, not only the alarming
   * ones. Until now the chip rendered for `open`/`public`/`view` alone, so a
   * properly protected tab showed nothing and read as unexamined: the same
   * "only the bad case is labelled" asymmetry that made the audience note
   * invisible on most items. Sam asked for the method to be noted on each item,
   * and this is measured rather than hand-typed.
   *
   * `tabGate` keeps its null-means-no-data contract — the summary and the table
   * below both depend on it — so the two states that are NOT findings about a
   * tab are resolved here, at the point of display, and never counted as gates.
   */
  function rowGate(tab) {
    var g = tabGate(tab);
    // Structural unknowns first: both are known from the static surface scan,
    // so they stand whether or not the live gate read came back.
    if (!g.measured || g.rpcOnly) return gateById("unknown");
    if (!g.gate) return gateById("nodata");
    // Only now can a missing measurement be the reason. Reporting "Not mapped"
    // here would turn one failed RPC into 35 findings.
    if (!state.gates) return gateById("unread");
    return g.gate;
  }

  /* ── The arrangement editor's model ────────────────────────────────────────
   *
   * Built from the SAME plan() the menu itself renders through, so the editor
   * cannot show an arrangement the rail would lay out differently. Hidden items
   * are included in position and marked — without them there is no way to
   * unhide anything, which is the obvious trap in a "hide" affordance.
   *
   * "Top level" is modelled as a container like any other so a drag into it
   * needs no special case; it is pinned first because that is where it renders.
   */
  function buildDraft() {
    var ov = window.CPL_NAV_OVERLAY;
    var groups = (window.CPL_NAV_GROUPS && window.CPL_NAV_GROUPS.GROUPS) || [];
    var present = navItems().map(function (it) { return it.tab; });
    if (!ov || typeof ov.plan !== "function") return null;
    var p = ov.plan(groups, present);

    /* plan() carries only placement — {tab, hidden}. The draft has to carry the
     * whole row, because saveDraft() writes EVERY field for EVERY tab: seeding
     * from placement alone would silently blank every label, site list and pin
     * the moment anyone dragged anything and pressed Save. Read them back off
     * the overlay rows here so a save round-trips what it did not touch. */
    var rows = ov.rows() || [];
    function rowFor(tab) {
      for (var i = 0; i < rows.length; i++) if (rows[i].kind === "tab" && rows[i].key === tab) return rows[i];
      return null;
    }
    function hydrate(e) {
      var r = rowFor(e.tab);
      return {
        tab: e.tab,
        hidden: e.hidden,
        label: r && r.label != null ? r.label : null,
        orgs: r && r.orgs && r.orgs.length ? r.orgs.slice() : null,
        pinned: !!(r && r.pinned),
        audience: (r && r.audience) || "everyone",
      };
    }

    var containers = [{
      id: "__top__", label: "Top level", isTop: true, hidden: false,
      tabs: p.all.top.map(hydrate),
    }];
    p.all.groups.forEach(function (g) {
      containers.push({
        id: g.id, label: g.label, isTop: false, hidden: g.hidden,
        tabs: g.tabs.map(hydrate),
      });
    });
    return { containers: containers };
  }

  function ensureDraft() {
    if (!state.draft) state.draft = buildDraft();
    return state.draft;
  }

  function findTab(draft, tab) {
    for (var i = 0; i < draft.containers.length; i++) {
      var c = draft.containers[i];
      for (var j = 0; j < c.tabs.length; j++) if (c.tabs[j].tab === tab) return { ci: i, ti: j, c: c, item: c.tabs[j] };
    }
    return null;
  }

  /* Move `tab` to `containerId` at `index`. Pure over the draft so the tests can
   * exercise reordering without synthesising HTML5 drag events, which jsdom does
   * not implement — the DOM handlers are a thin shell over this. */
  function moveTab(draft, tab, containerId, index) {
    var found = findTab(draft, tab);
    if (!found) return false;
    var target = null;
    for (var i = 0; i < draft.containers.length; i++) if (draft.containers[i].id === containerId) target = draft.containers[i];
    if (!target) return false;
    // A protected tab may be reordered and renamed but never buried in a group
    // that can be hidden — the lockout guard, enforced at the point of the drag
    // as well as at render, so the UI never accepts a move it would silently undo.
    if (window.CPL_NAV_OVERLAY.PROTECTED[tab] && !target.isTop) return false;
    found.c.tabs.splice(found.ti, 1);
    if (found.c === target && found.ti < index) index--;
    index = Math.max(0, Math.min(index, target.tabs.length));
    target.tabs.splice(index, 0, found.item);
    return true;
  }

  function moveContainer(draft, id, index) {
    var from = -1;
    for (var i = 0; i < draft.containers.length; i++) if (draft.containers[i].id === id) from = i;
    // Top level never moves: it is the container everything else is positioned
    // against, and it holds the protected tabs.
    if (from <= 0 || index <= 0) return false;
    var c = draft.containers.splice(from, 1)[0];
    if (from < index) index--;
    draft.containers.splice(Math.max(1, Math.min(index, draft.containers.length)), 0, c);
    return true;
  }

  /* Turn the draft into cobi_nav rows.
   *
   * Writes a row for EVERY tab and group rather than only the changed ones. The
   * alternative — diffing against code defaults and writing the difference — is
   * where this would go wrong quietly: `sort_order` is only meaningful relative
   * to its neighbours, so a partial write leaves a container half-explicit and
   * half-implicit, and the resulting order depends on values nobody chose.
   */
  /* ONE row shape for both kinds, and the uniformity is the whole point.
   *
   * `audience` is NOT NULL in cobi_nav. Group rows used to omit the key entirely
   * while tab rows carried it — and a bulk POST is a single statement over the
   * UNION of the array's keys, so the column was in the insert list and every
   * group row supplied NULL for it. Postgres rejected the batch (23502), which
   * PostgREST returns as 400, and since every save contains at least one group,
   * EVERY save failed. The table stayed empty for two days while the tab looked
   * finished, because the shape is only wrong on the wire: each row is valid on
   * its own, and jsdom's fetch mock accepts anything.
   *
   * Building both kinds through one function means a column added for tabs
   * tomorrow cannot quietly reintroduce it. */
  function navRow(o) {
    return {
      kind: o.kind,
      key: o.key,
      label: o.label != null ? o.label : null,
      parent: o.parent != null ? o.parent : null,
      sort_order: o.sort_order,
      hidden: !!o.hidden,
      orgs: (o.orgs && o.orgs.length) ? o.orgs.slice() : null,
      pinned: !!o.pinned,
      // A group has no audience of its own — the overlay resolves audience per
      // TAB — but the column is NOT NULL, so it is written as the default
      // rather than left for PostgREST to fill with NULL.
      audience: o.audience || "everyone",
      updated_by: o.updated_by,
      updated_at: o.updated_at,
    };
  }

  function draftRows(draft) {
    var rows = [];
    var who = (getSession() && getSession().email) || "(reviewer)";
    var now = new Date().toISOString();
    draft.containers.forEach(function (c, ci) {
      if (!c.isTop) {
        rows.push(navRow({
          kind: "group", key: c.id, label: c.label || null, parent: null,
          sort_order: ci, hidden: !!c.hidden, orgs: null, pinned: false,
          updated_by: who, updated_at: now,
        }));
      }
      c.tabs.forEach(function (t, ti) {
        rows.push(navRow({
          kind: "tab", key: t.tab,
          label: t.label,
          parent: c.isTop ? null : c.id,
          sort_order: ti,
          hidden: t.hidden,
          orgs: t.orgs,
          pinned: t.pinned,
          audience: t.audience,
          updated_by: who, updated_at: now,
        }));
      });
    });
    return rows;
  }

  /* A status code is not a diagnosis. PostgREST puts the actual reason in the
   * body — this bug's body said `null value in column "audience" ... violates
   * not-null constraint`, which names it on sight — and discarding it is what
   * left a curator staring at a bare "save 400" that reads like an expired
   * sign-in. Always carry the body into the message, and keep `status` so the
   * advice can tell an auth failure from a malformed write. */
  function httpFail(r, what) {
    function fail(detail) {
      var e = new Error(what + " " + r.status + (detail ? " — " + detail : ""));
      e.status = r.status;
      throw e;
    }
    if (!r || typeof r.text !== "function") fail("");
    return r.text().then(function (body) {
      var detail = (body || "").slice(0, 300);
      try {
        var j = JSON.parse(body);
        detail = j.message || j.details || j.hint || detail;
      } catch (e) { /* not JSON — the raw text is still better than nothing */ }
      fail(detail);
    }, function () { fail(""); });
  }

  function saveDraft(root) {
    if (state.saving || !state.draft) return Promise.resolve();
    state.saving = true; state.saveMsg = null; render(root);
    var rows = draftRows(state.draft);
    var h = authHeaders();
    h["Content-Type"] = "application/json";
    h["Prefer"] = "resolution=merge-duplicates,return=representation";
    return fetch(REST + "/cobi_nav", { method: "POST", headers: h, body: JSON.stringify(rows) })
      .then(function (r) {
        if (!r.ok) return httpFail(r, "save");
        return r.json();
      })
      .then(function (saved) {
        // A policy-filtered write answers 200 with an EMPTY body, so "ok" is not
        // proof it wrote. No rows back = FAILURE, and the draft is kept.
        if (!Array.isArray(saved) || !saved.length) {
          var e = new Error("not saved — your sign-in isn’t a reviewer");
          e.authish = true;
          throw e;
        }
        window.CPL_NAV_OVERLAY._set(saved);   // repaints the live rail immediately
        state.dirty = false; state.saving = false;
        state.saveMsg = { ok: true, text: "✓ Saved. The menu updated for everyone." };
        render(root);
      })
      .catch(function (e) {
        state.saving = false;
        // Only 401/403 (and a policy-filtered empty write) are sign-in problems.
        // Telling someone to sign in again when the REQUEST is malformed sends
        // them round a loop that can never succeed however valid their session.
        var authish = !!(e && (e.authish || e.status === 401 || e.status === 403));
        state.saveMsg = { ok: false, text: "Could not save — " + ((e && e.message) || "unknown error")
          + ". Your arrangement is still here" + (authish
            ? "; renew your reviewer sign-in and press Save again."
            : ", and nothing changed for anyone. This one is a fault in the page, not your sign-in — "
              + "send that message to a session and it can be fixed.") };
        render(root);
      });
  }

  /* Reset EVERYTHING to how the menu ships. A delete rather than writing the
   * defaults back: an empty table is what "exactly as shipped" means here, and
   * cobi_nav has a delete policy precisely so this can be honest. (sierra_rules
   * deliberately has none — there, the record of what was tried is worth more
   * than a clean slate; here the code IS the record.) */
  function resetAll(root) {
    if (state.saving) return Promise.resolve();
    if (!confirm("Put the whole menu back to how it ships?\n\n"
      + "Every rename, reorder, grouping and site change is removed, for everyone. "
      + "The change history is kept.")) return Promise.resolve();
    state.saving = true; state.saveMsg = null; render(root);
    return fetch(REST + "/cobi_nav?kind=in.(tab,group)", { method: "DELETE", headers: authHeaders() })
      .then(function (r) {
        if (!r.ok) return httpFail(r, "reset");
        window.CPL_NAV_OVERLAY._set([]);
        state.draft = null; state.dirty = false; state.saving = false;
        state.saveMsg = { ok: true, text: "✓ The menu is back to how it ships." };
        render(root);
      })
      .catch(function (e) {
        state.saving = false;
        state.saveMsg = { ok: false, text: "Could not reset — " + ((e && e.message) || "unknown error") + "." };
        render(root);
      });
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
      // The shared reviewer sign-in mounts here. Left-aligned and narrowed so
      // the form reads as a form inside the centred explanatory block.
      ".adm-signin { max-width:340px; margin:14px auto 0; text-align:left; }",
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
      // Neither a pass nor a fail: two states that are not findings about a tab.
      ".adm-g-nodata, .adm-g-unread, .adm-g-unknown { color: var(--text-muted); background: var(--surface-muted); }",
      ".adm-vis { white-space:nowrap; }",
      ".adm-visrow { flex-direction:column; align-items:stretch; gap:4px; }",
      ".adm-vistitle { font-size:.82rem; color: var(--text-strong); margin-bottom:2px; }",
      ".adm-visopt { display:block; padding:5px 8px; border:1px solid var(--border-soft, #d8d8d8); border-radius:6px; cursor:pointer; }",
      ".adm-visopt.on { border-color: var(--navy-primary); background: var(--surface-muted); }",
      ".adm-visname { font-size:.82rem; font-weight:600; color: var(--text-strong); }",
      ".adm-visnote { display:block; font-size:.74rem; color: var(--text-muted); margin-left:1.35rem; }",
      ".adm-g-unknown { color: var(--text-muted); background: var(--surface-muted); font-style:italic; }",
      ".adm-note { font-size:.76rem; color: var(--text-muted); border-left:3px solid var(--border-strong); padding:4px 10px; margin:14px 0 0; }",
      ".adm-soon { border:1px dashed var(--border-strong); border-radius:8px; background: var(--surface-subtle); padding:12px 14px; margin:14px 0 0; font-size:.84rem; color: var(--text-body); }",
      ".adm-soon b { color: var(--navy-primary); }",
      // ── Arrange (drag and drop) ──
      ".adm-arrange { display:flex; flex-wrap:wrap; gap:12px; align-items:flex-start; }",
      ".adm-col { flex:1 1 320px; min-width:280px; border:1px solid var(--border); border-radius:8px; background: var(--surface-opaque); }",
      ".adm-col-head { display:flex; align-items:center; gap:8px; padding:7px 10px; border-bottom:1px solid var(--border); background: var(--surface-subtle); border-radius:8px 8px 0 0; }",
      ".adm-col-head .t { font-size:.8rem; font-weight:700; color: var(--navy-primary); flex:1; }",
      ".adm-col-body { padding:6px; min-height:44px; }",
      // The drop target has to be obvious while a drag is in flight, or the
      // whole interaction is guesswork.
      ".adm-col.over { border-color: var(--seal-blue); box-shadow: 0 0 0 2px var(--brand-soft, rgba(29,78,216,.12)); }",
      ".adm-item { display:flex; align-items:center; gap:8px; padding:5px 8px; margin:0 0 4px; border:1px solid var(--border); border-radius:6px; background: var(--surface-subtle); font-size:.8rem; cursor:grab; }",
      ".adm-item:last-child { margin-bottom:0; }",
      ".adm-item.dragging { opacity:.45; }",
      ".adm-item .grip { color: var(--text-muted); font-size:.8rem; cursor:grab; user-select:none; }",
      ".adm-item .nm { flex:1; color: var(--text-strong); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }",
      ".adm-item .mini { border:none; background:none; cursor:pointer; color: var(--text-muted); font-size:.78rem; padding:1px 4px; border-radius:4px; }",
      ".adm-item .mini:hover { background: var(--surface-muted); color: var(--text-strong); }",
      ".adm-item.hid { opacity:.55; }",
      ".adm-item.hid .nm { text-decoration: line-through; }",
      ".adm-item.prot { border-left:3px solid var(--mustard, #d9a800); }",
      ".adm-drop { height:6px; margin:-2px 0 2px; border-radius:3px; }",
      ".adm-drop.on { background: var(--seal-blue); }",
      ".adm-editrow { display:flex; flex-wrap:wrap; gap:6px; align-items:center; padding:6px 8px; margin:0 0 4px; border:1px solid var(--seal-blue); border-radius:6px; background: var(--surface-opaque); }",
      ".adm-editrow input[type=text] { flex:1 1 150px; padding:4px 8px; border:1px solid var(--border-strong); border-radius:5px; font-size:.8rem; background: var(--surface-opaque); color: var(--text-body); }",
      ".adm-sitepick { display:flex; flex-wrap:wrap; gap:4px; }",
      ".adm-sitepick label { font-size:.72rem; display:inline-flex; align-items:center; gap:3px; border:1px solid var(--border); border-radius:10px; padding:1px 7px; cursor:pointer; }",
      ".adm-sitepick label.on { background: var(--surface-muted); border-color: var(--seal-blue); color: var(--text-strong); }",
      ".adm-btnrow { display:flex; gap:6px; flex-wrap:wrap; margin:10px 0 0; align-items:center; }",
      ".adm-btn { background: var(--surface-subtle); border:1px solid var(--border-strong); border-radius:5px; padding:4px 11px; cursor:pointer; color: var(--text-body); font-size:.78rem; }",
      ".adm-btn:hover { background: var(--surface-muted); }",
      ".adm-btn[disabled] { opacity:.5; cursor:default; }",
      ".adm-btn-primary { background: var(--seal-blue); color:#fff; border-color: var(--seal-blue); font-weight:600; }",
      ".adm-btn-primary:hover { background: var(--navy-secondary, #1c3d5a); }",
      ".adm-dirty { font-size:.78rem; color: var(--brick, #8c2f22); font-weight:600; }",
      ".adm-g-aud { color: var(--navy-primary); background: var(--surface-muted); font-weight:600; }",
      ".adm-audnote { flex:1 1 100%; font-size:.75rem; color: var(--text-muted); margin-top:2px; }",
      ".adm-audwarn { flex:1 1 100%; font-size:.75rem; color: var(--text-body); background: var(--mustard-fill, #f2dca0); border-radius:6px; padding:5px 9px; margin-top:2px; }",
      ".adm-select { padding:3px 7px; border:1px solid var(--border-strong); border-radius:5px; font-size:.76rem; background: var(--surface-opaque); color: var(--text-body); }",
      ".adm-saved { font-size:.78rem; color: var(--hunter, #2c601a); font-weight:600; }",
    ].join("\n");
    document.head.appendChild(el);
  }

  // ── Arrange section ──
  function itemHtml(t, cid) {
    var ov = window.CPL_NAV_OVERLAY;
    var prot = !!ov.PROTECTED[t.tab];
    var nav = navItems().filter(function (n) { return n.tab === t.tab; })[0];
    var name = t.label != null ? t.label : (nav ? nav.label : t.tab);
    if (state.editKey === "tab:" + t.tab) return itemEditor(t, cid, name);
    if (state.editKey === "vis:" + t.tab) return visEditor(t, cid, name);

    var h = '<div class="adm-item' + (t.hidden ? " hid" : "") + (prot ? " prot" : "") + '"'
      + ' draggable="true" data-drag="tab:' + esc(t.tab) + '" data-cid="' + esc(cid) + '">'
      + '<span class="grip" title="Drag to reorder, or into another group.">⠿</span>'
      + '<span class="nm" title="' + esc(t.tab) + '">' + esc(name) + "</span>";
    if (t.orgs && t.orgs.length) {
      h += '<span class="adm-g" title="Shown only on: ' + esc(t.orgs.join(", ")) + '">'
        + t.orgs.length + " site" + (t.orgs.length === 1 ? "" : "s") + "</span>";
    }
    if (t.pinned || (prot && t.tab === "admin")) {
      h += '<span class="adm-g" title="Shown on every site — it cannot be filtered out by one.">📌</span>';
    }
    /* Protection, on every row. Two different questions sit next to each other
     * here, so each chip says which one it answers: the visibility button is
     * who SEES the menu item, this chip is what protects the DATA. Someone
     * reaching for "hide" is exactly the person who needs to be told the two
     * are not the same. */
    var rg = rowGate(t.tab);
    h += '<span class="adm-g adm-g-' + rg.id + '" title="What protects the data behind this tab: '
      + esc(rg.hint) + ' Changing who sees the menu item does NOT change this.">'
      + esc(rg.short || rg.label) + "</span>";
    h += '<button class="mini" data-edit="tab:' + esc(t.tab) + '" title="Rename, or choose which sites show it.">✏️</button>';

    // ONE control for who sees it — see the RUNGS note. It states the current
    // rung rather than an icon alone, because an icon-only toggle is what made
    // "hide" look like an annotation.
    var rung = rungOf(t);
    var choices = rungsFor(t.tab);
    if (!choices.length) {
      h += '<span class="mini" title="This item cannot be hidden, moved into a group, or narrowed to an '
        + 'audience. Admin is the only place to undo a change here, and Dashboard is where every deep link '
        + 'falls back to — hiding either would be a one-way door.">🔒 Always shown</span>';
    } else {
      h += '<button class="mini adm-vis" data-vis="' + esc(t.tab) + '" title="Who sees this in the menu: '
        + esc(rung.label) + ". " + esc(rung.note) + ' Click to change.">'
        + esc(rung.icon) + " " + esc(rung.short) + "</button>";
    }
    return h + "</div>";
  }

  /* The visibility ladder, opened from the row rather than buried in ✏️ — the
   * hide affordance now ASKS who, which is what pressing it implied all along. */
  function visEditor(t, cid, name) {
    var cur = rungOf(t).id;
    var choices = rungsFor(t.tab);
    var h = '<div class="adm-editrow adm-visrow" data-cid="' + esc(cid) + '">'
      + '<div class="adm-vistitle">Who sees <b>' + esc(name) + "</b> in the menu?</div>";
    choices.forEach(function (r) {
      h += '<label class="adm-visopt' + (cur === r.id ? " on" : "") + '">'
        + '<input type="radio" name="vis-' + esc(t.tab) + '" data-visset="' + esc(t.tab)
        + '" value="' + esc(r.id) + '"' + (cur === r.id ? " checked" : "") + "> "
        + '<span class="adm-visname">' + esc(r.icon) + " " + esc(r.label) + "</span>"
        + '<span class="adm-visnote">' + esc(r.note) + "</span></label>";
    });
    // The consequence, stated whatever is chosen — it used to appear only inside
    // the ⚠, which fires on public-read tabs alone, so on most items the word
    // "hides" never appeared while it applied to all of them.
    h += '<div class="adm-audnote">This is a <b>filter on the menu</b>, not a note. To simply tell people a '
      + "team phrase is needed to curate, leave this on <b>Everyone</b>: the tab already says so when they "
      + "open it, and stays findable meanwhile.</div>";
    h += '<button class="adm-btn" data-editdone>Done</button>';

    // Placed on the control, because narrowing the audience of a tab whose data
    // anyone can read is the moment someone comes to believe they protected it.
    if (cur !== "everyone") {
      var rg = rowGate(t.tab);
      if (rg.id === "open" || rg.id === "public" || rg.id === "view") {
        h += '<div class="adm-audwarn">⚠ This takes the item out of the menu, but the data behind it is still '
          + "<b>readable by anyone</b> who opens the page directly. To actually restrict it, its database "
          + "rules have to change — see the protection column below.</div>";
      } else if (rg.id === "unknown" || rg.id === "unread") {
        h += '<div class="adm-audwarn">⚠ This changes the menu only. What protects the data behind it '
          + "has not been measured, so treat it as unverified rather than restricted.</div>";
      }
    }
    return h + "</div>";
  }

  function itemEditor(t, cid, name) {
    var orgs = (window.CPL_ORGS && window.CPL_ORGS.ORGS) || [];
    var chosen = t.orgs || [];
    var h = '<div class="adm-editrow" data-cid="' + esc(cid) + '">'
      + '<input type="text" data-label-for="' + esc(t.tab) + '" maxlength="60" value="' + esc(name) + '" '
      + 'aria-label="Menu label">'
      + '<div class="adm-sitepick" title="Which sites show this item. Choose none to leave it on the default '
      + 'behaviour for its site.">';
    orgs.forEach(function (o) {
      var on = chosen.indexOf(o.id) !== -1;
      h += '<label class="' + (on ? "on" : "") + '"><input type="checkbox" data-site="' + esc(o.id)
        + '" data-site-tab="' + esc(t.tab) + '"' + (on ? " checked" : "") + "> " + esc(o.label) + "</label>";
    });
    h += "</div>"
      + '<label class="adm-check" title="Show on every site, ignoring the list above."><input type="checkbox" '
      + 'data-pin="' + esc(t.tab) + '"' + (t.pinned ? " checked" : "") + "> 📌 every site</label>";

    /* Who sees it is NOT here any more — it is the one visibility ladder on the
     * row (see RUNGS). Two controls for one question is what let an audience be
     * narrowed by someone who meant only to annotate, so this editor is now
     * naming and placement alone. The pointer stays because the control moved. */
    var rung = rungOf(t);
    if (rungsFor(t.tab).length) {
      h += '<div class="adm-audnote">Who sees this in the menu is set with the <b>' + esc(rung.icon) + " "
        + esc(rung.short) + "</b> button on the row — currently <b>" + esc(rung.label) + "</b>.</div>";
    }
    h += '<button class="adm-btn" data-editdone>Done</button>';
    h += "</div>";
    return h;
  }

  function renderArrange() {
    var d = ensureDraft();
    var h = "<h3>Arrange the menu</h3>";
    if (!d) {
      return h + '<div class="adm-empty">The menu could not be read for editing. The menu itself is '
        + "unaffected — this is the editor, not the rail.</div>";
    }
    h += '<p class="adm-intro">Drag an item to reorder it, or into another group. Drag a group heading to '
      + "move the whole group. Nothing changes for anyone until you press <b>Save</b>. "
      + "<b>These are display settings</b> — hiding an item removes it from the menu, it does not protect "
      + "what is behind it.</p>";

    h += '<div class="adm-arrange">';
    d.containers.forEach(function (c, ci) {
      h += '<div class="adm-col" data-drop-container="' + esc(c.id) + '">'
        + '<div class="adm-col-head"' + (c.isTop ? "" : ' draggable="true" data-drag="group:' + esc(c.id) + '"') + ">"
        + (c.isTop ? "" : '<span class="grip" title="Drag to move the whole group.">⠿</span>')
        + '<span class="t">' + esc(c.label) + "</span>";
      if (c.isTop) {
        h += '<span class="sub" title="Items here sit above the groups, with no heading. Admin and Dashboard '
          + 'stay here so they can always be reached.">always first</span>';
      } else {
        h += '<button class="mini" data-edit="group:' + esc(c.id) + '" title="Rename this group.">✏️</button>'
          + '<button class="mini" data-ghide="' + esc(c.id) + '" title="'
          + (c.hidden ? "Show this group again." : "Hide this group and everything in it from the menu.") + '">'
          + (c.hidden ? "🙈" : "👁") + "</button>";
      }
      h += "</div>";
      if (state.editKey === "group:" + c.id) {
        h += '<div class="adm-editrow"><input type="text" data-glabel-for="' + esc(c.id) + '" maxlength="60" '
          + 'value="' + esc(c.label) + '" aria-label="Group name">'
          + '<button class="adm-btn" data-editdone>Done</button></div>';
      }
      h += '<div class="adm-col-body' + (c.hidden ? " hid" : "") + '">';
      if (!c.tabs.length) {
        h += '<div class="sub" style="padding:6px 4px">Empty — drag something here.</div>';
      }
      c.tabs.forEach(function (t) { h += itemHtml(t, c.id); });
      h += "</div></div>";
    });
    h += "</div>";

    h += '<div class="adm-btnrow">'
      + '<button class="adm-btn adm-btn-primary" data-save' + (state.saving || !state.dirty ? " disabled" : "") + ">"
      + (state.saving ? "Saving…" : "💾 Save the menu") + "</button>"
      + '<button class="adm-btn" data-discard' + (state.dirty ? "" : " disabled") + ">Discard changes</button>"
      + '<button class="adm-btn" data-resetall' + (state.saving ? " disabled" : "") + ' title="Removes every '
      + 'customisation and puts the menu back to how it ships.">↩ Reset to how it ships</button>';
    if (state.dirty) h += '<span class="adm-dirty">Unsaved changes — nobody sees them yet.</span>';
    if (state.saveMsg) {
      h += '<span class="' + (state.saveMsg.ok ? "adm-saved" : "adm-dirty") + '">' + esc(state.saveMsg.text) + "</span>";
    }
    h += "</div>";
    h += '<p class="adm-note">Saving changes the menu for <b>everyone</b>, immediately — there is nothing to '
      + "deploy. If the menu ever fails to load its arrangement, it falls back to exactly how it ships, so a "
      + "bad save can never leave anyone without a menu. Every change is logged.</p>";
    return h;
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
      // Sign in RIGHT HERE. This used to read "Sign in with a magic link on the
      // Team & RACI tab … then re-open this tab" — and RACI's magic-link box had
      // been removed, leaving its signIn() with no caller, so the instruction
      // could not be followed at all (Sam, 2026-08-14). Sending someone to
      // another tab for a credential is the same bounce team_phrase_header.js
      // was built to end; the same control also sits in the About menu, so it is
      // reachable from every tab, not only this one.
      h += '<div class="adm-empty"><b>Admin needs a personal sign-in.</b><br>The shared '
        + "team phrase does not open Admin — someone who could re-scope what other phrase holders see would be "
        + "a wider power than the phrase is meant to carry. Sign in below, or from "
        + "<b>ℹ About</b> in the header.<div class=\"adm-signin\"></div></div></div>";
      root.innerHTML = h;
      // Mount the SHARED control (reviewer_signin.js) rather than re-implementing
      // a second sign-in box that could drift from it.
      try {
        var host = root.querySelector(".adm-signin");
        if (host && window.CPL_REVIEWER_SIGNIN) {
          window.CPL_REVIEWER_SIGNIN.mountInto(host, { title: "Sign in", returnTab: "admin" });
        }
      } catch (e) { /* the message above still stands on its own */ }
      return;
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

    // ── Section 1: arrange the menu ──
    // FIRST on the page, deliberately. It was shipped last, below a 36-row table
    // and the protections table, and Sam's immediate report was "can't see how to
    // drag and drop" — correctly, because it was two screens down. The tab's
    // PRIMARY action belongs above its reference material; the inventory is what
    // you consult, this is what you came to do.
    h += renderArrange();

    // ── Section 2: the menu inventory ──
    h += "<h3>Every menu item, and what protects it</h3>";
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

    // ── Section 3: what the gates mean ──
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

    wireArrange(root);
  }

  function wireArrange(root) {
    var d = state.draft;
    if (!d) return;
    function touch() { state.dirty = true; state.saveMsg = null; }

    // ── Drag and drop ──
    // HTML5 DnD, with the payload also held in state: dataTransfer is
    // unreadable during dragover in several browsers, and the drop target has to
    // know whether it is accepting a tab or a group before the drop lands.
    root.querySelectorAll("[data-drag]").forEach(function (el) {
      el.addEventListener("dragstart", function (e) {
        state.dragKey = el.getAttribute("data-drag");
        el.classList.add("dragging");
        try { e.dataTransfer.setData("text/plain", state.dragKey); e.dataTransfer.effectAllowed = "move"; } catch (x) {}
      });
      el.addEventListener("dragend", function () {
        state.dragKey = null;
        el.classList.remove("dragging");
      });
    });

    root.querySelectorAll("[data-drop-container]").forEach(function (col) {
      col.addEventListener("dragover", function (e) {
        if (!state.dragKey) return;
        e.preventDefault();
        try { e.dataTransfer.dropEffect = "move"; } catch (x) {}
        col.classList.add("over");
      });
      col.addEventListener("dragleave", function () { col.classList.remove("over"); });
      col.addEventListener("drop", function (e) {
        e.preventDefault();
        col.classList.remove("over");
        var key = state.dragKey || (function () { try { return e.dataTransfer.getData("text/plain"); } catch (x) { return null; } })();
        if (!key) return;
        var cid = col.getAttribute("data-drop-container");

        if (key.indexOf("group:") === 0) {
          // A group dropped onto a container moves it to that container's slot.
          var gid = key.slice(6);
          var idx = 0;
          d.containers.forEach(function (c, i) { if (c.id === cid) idx = i; });
          if (moveContainer(d, gid, idx)) touch();
          render(root);
          return;
        }
        var tab = key.slice(4);
        // Drop position = the item it was dropped on, else the end.
        var body = col.querySelector(".adm-col-body");
        var index = body ? body.querySelectorAll("[data-drag^='tab:']").length : 0;
        var over = e.target && e.target.closest ? e.target.closest("[data-drag^='tab:']") : null;
        if (over) {
          var siblings = body ? Array.prototype.slice.call(body.querySelectorAll("[data-drag^='tab:']")) : [];
          index = Math.max(0, siblings.indexOf(over));
        }
        if (moveTab(d, tab, cid, index)) touch();
        else if (window.CPL_NAV_OVERLAY.PROTECTED[tab]) {
          alert("“" + tab + "” has to stay at the top level.\n\nAdmin is the only place to undo a menu change, "
            + "and Dashboard is where every deep link falls back to — putting either inside a group that could "
            + "be hidden would be a one-way door.");
        }
        render(root);
      });
    });

    // ── Per-item controls ──
    // Opening the ladder is NOT a change: pressing the visibility button used to
    // toggle `hidden` on the spot, which is the behaviour Sam read as an
    // annotation. It now asks, and nothing is dirty until a rung is picked.
    root.querySelectorAll("[data-vis]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.editKey = "vis:" + b.getAttribute("data-vis");
        render(root);
      });
    });
    root.querySelectorAll("[data-visset]").forEach(function (r) {
      r.addEventListener("change", function () {
        var f = findTab(d, r.getAttribute("data-visset"));
        if (!f || !r.checked) return;
        // Re-check the protection list at the point of the write. The editor
        // only offers permitted rungs, but this is the half that runs — and the
        // overlay guards the same rule again below it.
        var allowed = rungsFor(f.item.tab).some(function (x) { return x.id === r.value; });
        if (!allowed) return;
        applyRung(f.item, r.value);
        touch(); render(root);
      });
    });
    root.querySelectorAll("[data-ghide]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-ghide");
        d.containers.forEach(function (c) { if (c.id === id) c.hidden = !c.hidden; });
        touch(); render(root);
      });
    });
    root.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { state.editKey = b.getAttribute("data-edit"); render(root); });
    });
    var done = root.querySelector("[data-editdone]");
    if (done) done.addEventListener("click", function () { state.editKey = null; render(root); });

    var lbl = root.querySelector("[data-label-for]");
    if (lbl) lbl.addEventListener("input", function () {
      var f = findTab(d, lbl.getAttribute("data-label-for"));
      if (!f) return;
      f.item.label = lbl.value;
      touch();
    });
    var glbl = root.querySelector("[data-glabel-for]");
    if (glbl) glbl.addEventListener("input", function () {
      var id = glbl.getAttribute("data-glabel-for");
      d.containers.forEach(function (c) { if (c.id === id) c.label = glbl.value; });
      touch();
    });
    root.querySelectorAll("[data-site]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var f = findTab(d, cb.getAttribute("data-site-tab"));
        if (!f) return;
        var list = (f.item.orgs || []).slice();
        var id = cb.getAttribute("data-site");
        var at = list.indexOf(id);
        if (cb.checked && at === -1) list.push(id);
        if (!cb.checked && at !== -1) list.splice(at, 1);
        f.item.orgs = list.length ? list : null;
        touch(); render(root);
      });
    });
    root.querySelectorAll("[data-pin]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var f = findTab(d, cb.getAttribute("data-pin"));
        if (!f) return;
        f.item.pinned = cb.checked;
        touch(); render(root);
      });
    });

    // ── Save / discard / reset ──
    var save = root.querySelector("[data-save]");
    if (save) save.addEventListener("click", function () { saveDraft(root); });
    var disc = root.querySelector("[data-discard]");
    if (disc) disc.addEventListener("click", function () {
      state.draft = null; state.dirty = false; state.saveMsg = null; state.editKey = null;
      render(root);
    });
    var reset = root.querySelector("[data-resetall]");
    if (reset) reset.addEventListener("click", function () { resetAll(root); });
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
    _rowGate: rowGate,
    _rungOf: rungOf,
    _applyRung: applyRung,
    _rungsFor: rungsFor,
    _RUNGS: RUNGS,
    _navItems: navItems,
    _sitesFor: sitesFor,
    _loadGates: loadGates,
    _authHeaders: authHeaders,
    _GATES: GATES,
    // arrange (drag and drop)
    _buildDraft: buildDraft,
    _ensureDraft: ensureDraft,
    _moveTab: moveTab,
    _moveContainer: moveContainer,
    _findTab: findTab,
    _draftRows: draftRows,
    _saveDraft: saveDraft,
    _resetAll: resetAll,
  };

  window.addEventListener("cpl-tab-activated", function (e) {
    if (e && e.detail && e.detail.tab === "admin") activate();
  });
})();
