// Admin tab (Session 156) — jsdom test.
//
// Sam, 2026-08-14: "I want to make the COBI side menu items rearrangeable by
// drag and drop from a single place where I can manage the org where they
// appear, hierarchy, naming, visibility, and access via either team phrase or
// magic link." Then, mid-build: "should the Admin tab be at the top level so I
// can manage all the orgs?"
//
// WHAT THIS GUARDS, and each one is a way the tab could lie about safety.
//
// (a) ADMIN SURVIVES THE PER-SITE NAV FILTER. Sam's question has a functional
//     half he did not ask about: applyNav() hides any tab missing from the
//     active site's `tabs` list, so without cobi_orgs.js ALWAYS, switching to GR
//     to fix GR's menu would make Admin vanish out from under you.
//
// (b) RLS-ON-WITH-NO-READ-POLICY IS THE MOST LOCKED-DOWN STATE, NOT THE LEAST.
//     `select_gate` comes back NULL for both "no policy at all" and, if anyone
//     ever simplifies the RPC, for a missing lookup. Treating NULL as "open"
//     would report the ten most protected tables in the system as the most
//     exposed — precisely backwards, and reassuring in the wrong direction.
//
// (c) A TAB REPORTS ITS WEAKEST TABLE, NOT ITS STRONGEST. A tab reading one
//     reviewer-only table and one public table is as exposed as the public one.
//
// (d) UNMAPPED IS NOT "NOTHING TO PROTECT". Five tabs are rendered by the page
//     itself or by modules shared across tabs, so the scan cannot attribute
//     their data. That must render as UNKNOWN — the `waitingBreakdown()`
//     lesson: an absent measurement must never render as an achievement.
//
// (e) An empty RPC result means NOT A REVIEWER (the table set is known
//     non-empty), and a failed read is a THIRD state that never reads as
//     "nothing is protected".
//
// Run from repo root: `npm test` (or `node tests/admin_tab.test.js`).

const fs = require("fs");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const ADMIN_SRC = fs.readFileSync("admin.js", "utf8");
const SURFACE_SRC = fs.readFileSync("cobi_admin_surface.js", "utf8");
const ORGS_SRC = fs.readFileSync("cobi_orgs.js", "utf8");
const OVERLAY_SRC = fs.readFileSync("nav_overlay.js", "utf8");
const NAVGROUPS_SRC = fs.readFileSync("nav_groups.js", "utf8");
const CPL = fs.readFileSync("CPL_Dashboard.html", "utf8");
const IDX = fs.readFileSync("index.html", "utf8");

// ── Static invariants ───────────────────────────────────────────────────────
check("Rule 4: CPL_Dashboard.html === index.html", CPL === IDX);
check("the Admin nav button exists", /data-tab="admin"/.test(CPL));
check("the Admin pane exists with its root", /id="tab-admin"/.test(CPL) && /id="admin-root"/.test(CPL));
check("the Admin boot chain-loads the surface map BEFORE admin.js",
  CPL.indexOf("loadScript('cobi_admin_surface.js'") < CPL.indexOf("loadScript('admin.js'") &&
  /onActivate\('admin'/.test(CPL));
check("Admin is TOP-LEVEL — not listed in any nav_groups group",
  !/'admin'/.test(fs.readFileSync("nav_groups.js", "utf8").match(/var GROUPS = \[[\s\S]*?\n  \];/)[0]));
check("admin.js carries no service key", ADMIN_SRC.indexOf("service_role") === -1);
check("admin.js CSS uses design tokens, not raw hex",
  /var\(--navy-primary/.test(ADMIN_SRC) && !/#[0-9a-f]{6}[^)]*;/i.test(ADMIN_SRC.split("ensureCss")[1].split("].join")[0].replace(/var\([^)]*\)/g, "")));

// The generated surface map is COPIED from the repo; a stale copy on this tab
// is a stale claim about what is protected.
(function () {
  let ok = false;
  try { execFileSync("python3", ["kb/_build_cobi_admin_surface.py", "--check"], { stdio: "pipe" }); ok = true; }
  catch (e) { /* stale */ }
  check("cobi_admin_surface.js is in sync with the repo"
    + (ok ? "" : " — run: python3 kb/_build_cobi_admin_surface.py"), ok);
})();

// ── (a) Admin survives the per-site nav filter ──────────────────────────────
(function () {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="header"><div class="cobi-brand"><div class="cobi-brandtext"><h1>COBI</h1></div></div></div>
    <nav class="cpl-tabs">
      <button class="cpl-tab active" data-tab="dashboard">Dashboard</button>
      <button class="cpl-tab" data-tab="admin">Admin</button>
      <button class="cpl-tab" data-tab="gr-priorities">GR Priorities</button>
      <button class="cpl-tab" data-tab="contracts">Contracts</button>
      <button class="cpl-tab" data-tab="our-process">Our Process</button>
    </nav></body></html>`, { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  const el = w.document.createElement("script"); el.textContent = ORGS_SRC;
  w.document.body.appendChild(el);
  const O = w.CPL_ORGS;
  const btn = (t) => w.document.querySelector(`.cpl-tab[data-tab="${t}"]`);
  const visible = (t) => btn(t).getAttribute("data-org-hidden") !== "1";

  check("cobi_orgs exposes ALWAYS", Array.isArray(O.ALWAYS) && O.ALWAYS.indexOf("admin") !== -1);
  let survived = [];
  O.ORGS.forEach((o) => {
    O.setOrg(o.id, {});
    if (visible("admin")) survived.push(o.id);
  });
  check(`Admin stays visible under EVERY site (${survived.length}/${O.ORGS.length})`,
    survived.length === O.ORGS.length);

  // The filter must still work for everything else, or ALWAYS has been applied
  // too broadly and every site now shows every tab.
  O.setOrg("gr", {});
  check("switching to GR still hides the tabs GR does not list",
    !visible("our-process") && visible("gr-priorities"));
  O.setOrg("cpl", {});
  check("the default CPL view still hides EXCLUSIVE tabs", !visible("contracts") && !visible("gr-priorities"));
})();

// ── jsdom harness for the tab itself ────────────────────────────────────────
function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="cpl-tabs">
      <button class="cpl-tab" data-tab="dashboard">Dashboard</button>
      <button class="cpl-tab" data-tab="admin">Admin</button>
      <div class="cpl-nav-group"><button class="cpl-nav-group-head">Sierra &amp; Team Tools ▾</button>
        <div class="cpl-nav-group-body">
          <button class="cpl-tab" data-tab="sierra-training">Sierra Training</button>
          <button class="cpl-tab" data-tab="team-phrases">Team Phrases</button>
          <button class="cpl-tab" data-tab="memory">Memory</button>
        </div></div>
      <button class="cpl-tab" data-tab="activities-projects">Activities</button>
      <button class="cpl-tab" data-tab="cpl-pathways">Pathways</button>
    </nav>
    <div id="admin-root"></div></body></html>`,
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.jwt !== false) {
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({
      access_token: "aaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc",
      email: "sam@x",
    }));
  }
  w.__fetches = [];
  w.fetch = function (url, init) {
    w.__fetches.push({ url: String(url), init: init || {} });
    if (/cobi_rls_gates/.test(String(url))) {
      if (opts.gatesFail) return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.gates || DEFAULT_GATES) });
    }
    if (/cobi_nav/.test(String(url))) {
      if (init && init.method === "POST") {
        const rows = opts.saveEmpty ? [] : JSON.parse(init.body);
        return Promise.resolve({ ok: true, json: () => Promise.resolve(rows) });
      }
      if (init && init.method === "DELETE") {
        return Promise.resolve({ ok: !opts.deleteFails, status: opts.deleteFails ? 500 : 200,
          json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.nav || []) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  };
  [OVERLAY_SRC, NAVGROUPS_SRC, ORGS_SRC, SURFACE_SRC, ADMIN_SRC].forEach((src) => {
    const el = w.document.createElement("script"); el.textContent = src;
    w.document.body.appendChild(el);
  });
  return w;
}

const DEFAULT_GATES = [
  { tbl: "sierra_guidance", rls_enabled: true, select_gate: "(is_allowed_reviewer() OR team_pass_ok())", policy_count: 3 },
  { tbl: "sierra_feedback", rls_enabled: true, select_gate: "(is_allowed_reviewer() OR team_pass_ok())", policy_count: 2 },
  { tbl: "sierra_rules", rls_enabled: true, select_gate: "is_allowed_reviewer()", policy_count: 3 },
  { tbl: "sierra_turn_review", rls_enabled: true, select_gate: "(is_allowed_reviewer() OR team_pass_ok())", policy_count: 3 },
  { tbl: "chat_interactions", rls_enabled: true, select_gate: "(is_allowed_reviewer() OR team_pass_ok())", policy_count: 1 },
  { tbl: "sierra_rules_log", rls_enabled: true, select_gate: "is_allowed_reviewer()", policy_count: 2 },
  { tbl: "team_access", rls_enabled: true, select_gate: "is_allowed_reviewer()", policy_count: 2 },
  { tbl: "cpl_memory", rls_enabled: true, select_gate: "(is_allowed_reviewer() OR team_pass_ok())", policy_count: 3 },
  { tbl: "cpl_memory_log", rls_enabled: true, select_gate: "(is_allowed_reviewer() OR team_pass_ok())", policy_count: 2 },
  { tbl: "cpl_adoption_interest", rls_enabled: true, select_gate: "(is_allowed_reviewer() OR team_pass_ok())", policy_count: 2 },
  { tbl: "chatbox_exhibits", rls_enabled: true, select_gate: null, policy_count: 0 },
  { tbl: "kpi_snapshots_statewide", rls_enabled: true, select_gate: null, policy_count: 0 },
  { tbl: "chatbox_credentials", rls_enabled: true, select_gate: "true", policy_count: 1 },
  { tbl: "cpl_contracts", rls_enabled: true, select_gate: "(is_allowed_reviewer() OR fin_pass_ok())", policy_count: 4 },
  { tbl: "gr_content", rls_enabled: true, select_gate: "(gr_pass_ok() OR is_allowed_reviewer())", policy_count: 3 },
  { tbl: "legacy_open", kind: "table", rls_enabled: false, select_gate: null, policy_count: 0 },
  { tbl: "map_contact_gaps", kind: "view", rls_enabled: false, select_gate: null, policy_count: 0 },
  { tbl: "map_credential_student_rollup", kind: "matview", rls_enabled: false, select_gate: null, policy_count: 0 },
];

// ── (b) classification ──────────────────────────────────────────────────────
(function () {
  const w = makeWin();
  const api = w.CPL_ADMIN_TAB;
  const c = (row) => api._classify(row).id;
  check("RLS off is reported as open to anyone",
    c({ rls_enabled: false, select_gate: null }) === "open");
  check("RLS ON with NO read policy is SERVER-ONLY, not open",
    c({ rls_enabled: true, select_gate: null }) === "server");
  check("an empty-string gate is also server-only, not open",
    c({ rls_enabled: true, select_gate: "" }) === "server");
  check("a `true` policy is reported as readable by anyone",
    c({ rls_enabled: true, select_gate: "true" }) === "public");
  check("team phrase is recognised", c({ rls_enabled: true, select_gate: "(is_allowed_reviewer() OR team_pass_ok())" }) === "team");
  check("the Finance phrase is distinguished from the team phrase",
    c({ rls_enabled: true, select_gate: "(is_allowed_reviewer() OR fin_pass_ok())" }) === "fin");
  check("the GR phrase is distinguished too",
    c({ rls_enabled: true, select_gate: "(gr_pass_ok() OR is_allowed_reviewer())" }) === "gr");
  check("reviewer-only is distinguished from team-phrase",
    c({ rls_enabled: true, select_gate: "is_allowed_reviewer()" }) === "reviewer");
  check("a missing row is NOT MAPPED, never open", c(null) === "unknown");
  // A view reports rls_enabled=false, so the open branch would swallow it and
  // lose the REASON — which is the part a reviewer needs to act on.
  check("a VIEW is called out as having no rules of its own, not merely 'open'",
    c({ kind: "view", rls_enabled: false, select_gate: null }) === "view");
  check("a MATVIEW is treated the same (Postgres cannot give it RLS at all)",
    c({ kind: "matview", rls_enabled: false, select_gate: null }) === "view");
  check("a view ranks as exposed, so a tab reading one cannot report as protected",
    api._gateById("view").rank < api._gateById("team").rank);
  // Ordering is what makes the weakest-link rule work.
  check("server-only outranks reviewer, which outranks team, which outranks public",
    api._gateById("server").rank > api._gateById("reviewer").rank &&
    api._gateById("reviewer").rank > api._gateById("team").rank &&
    api._gateById("team").rank > api._gateById("public").rank);
})();

// ── (c) weakest link, and (d) unmapped ──────────────────────────────────────
(async function () {
  const w = makeWin();
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  api.render(root);

  const st = api._tabGate("sierra-training");
  check("a tab's gate is computed from its real tables", st.measured && st.tables.length > 0);
  check("sierra-training reports the TEAM phrase, not reviewer-only — its weakest table wins",
    st.gate && st.gate.id === "team");

  const tp = api._tabGate("team-phrases");
  check("team-phrases reports reviewer-only", tp.gate && tp.gate.id === "reviewer");

  const un = api._tabGate("activities-projects");
  check("an unmapped tab is UNKNOWN, not 'no data'", !un.measured && un.gate.id === "unknown");
  check("the table renders unmapped tabs as 'Not mapped'", /Not mapped/.test(root.innerHTML));
  check("the page states unmapped is not a clean bill of health",
    /not none/.test(root.innerHTML));

  // The whole reason both halves share a table.
  check("the page says hiding a menu item is not a security setting",
    /Hiding a menu item is not a security setting/.test(root.innerHTML));
  check("the security column is labelled as the only real control",
    /Actually protected by/.test(root.innerHTML) && /Shown on \(display\)/.test(root.innerHTML));
  check("the arrange section renders with drag targets",
    root.querySelectorAll("[data-drop-container]").length > 1 &&
    root.querySelectorAll("[data-drag^='tab:']").length > 0);
  check("the arrange section says these are DISPLAY settings, not protection",
    /These are display settings/.test(root.innerHTML));
  check("nothing is written until Save", /Nothing changes for anyone until you press/.test(root.innerHTML));
  check("the menu inventory is read from the live nav, not a carried list",
    root.innerHTML.indexOf("Sierra Training") !== -1 && root.innerHTML.indexOf("sierra-training") !== -1);
  check("Admin reports itself as shown on every site", /Every site/.test(root.innerHTML));
})();

// ── (e) the three non-ok states ─────────────────────────────────────────────
(async function () {
  {
    const w = makeWin({ jwt: false });
    const api = w.CPL_ADMIN_TAB;
    const root = w.document.getElementById("admin-root");
    await api._loadGates(); api.render(root);
    check("no magic-link session lands on signedout", api._state.loadState === "signedout");
    check("signed-out copy says the team phrase does NOT open Admin",
      /team phrase does not open Admin/.test(root.innerHTML));
    check("Admin never sends the team phrase header",
      !("x-team-pass" in api._authHeaders()));
  }
  {
    const w = makeWin({ gates: [] });
    const api = w.CPL_ADMIN_TAB;
    const root = w.document.getElementById("admin-root");
    await api._loadGates(); api.render(root);
    check("an empty RPC result means NOT A REVIEWER (the table set is known non-empty)",
      api._state.loadState === "notreviewer");
    check("the closed door says the system IS protected", /closed door, not an empty system/.test(root.innerHTML));
  }
  {
    const w = makeWin({ gatesFail: true });
    const api = w.CPL_ADMIN_TAB;
    const root = w.document.getElementById("admin-root");
    await api._loadGates(); api.render(root);
    check("a failed read is its own state", api._state.loadState === "error");
    check("a failed read never reads as 'nothing is protected'",
      /does <b>not<\/b> mean nothing is protected/.test(root.innerHTML));
  }
})();

// ── XSS ─────────────────────────────────────────────────────────────────────
(async function () {
  const w = makeWin({
    gates: DEFAULT_GATES.concat([{ tbl: "<img src=x onerror=alert(1)>", rls_enabled: true, select_gate: "true", policy_count: 1 }]),
  });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  // A hostile nav label is the realistic vector — the inventory is read from the DOM.
  const b = w.document.querySelector('.cpl-tab[data-tab="cpl-pathways"]');
  b.textContent = '<img src=y onerror=alert(2)>';
  await api._loadGates(); api.render(root);
  check("a nav label renders escaped", !root.querySelector("img"));
})();


// ── Arrange: the drag-and-drop model ────────────────────────────────────────
// Exercised through the pure model rather than synthetic HTML5 drag events,
// which jsdom does not implement. The DOM handlers are a thin shell over these.
(async function () {
  const w = makeWin({ nav: [] });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);

  const d = api._ensureDraft();
  check("the draft has a Top level container first", d && d.containers[0].isTop);
  check("the draft contains every tab in the nav",
    d.containers.reduce((a, c) => a + c.tabs.length, 0) === api._navItems().length);

  // Reorder within a container. Dropping onto the item at index 2 places the
  // dragged tab immediately BEFORE that item — the usual drop-on-item semantic,
  // and the one the DOM handler computes an index for.
  const top = d.containers[0];
  const firstTab = top.tabs[0].tab;
  const landedOn = top.tabs[2] ? top.tabs[2].tab : null;
  api._moveTab(d, firstTab, "__top__", 2);
  const order = top.tabs.map((t) => t.tab);
  check("a tab dropped onto another lands immediately before it",
    order[0] !== firstTab && (landedOn === null ||
      order.indexOf(firstTab) === order.indexOf(landedOn) - 1));

  // Move between containers.
  const grp = d.containers.filter((c) => !c.isTop)[0];
  api._moveTab(d, "sierra-training", grp.id, 0);
  check("a tab can be moved into another group",
    grp.tabs.length && grp.tabs[0].tab === "sierra-training");

  // The lockout guard, enforced at the point of the drag.
  const before = JSON.stringify(d.containers.map((c) => c.tabs.map((t) => t.tab)));
  const moved = api._moveTab(d, "admin", grp.id, 0);
  check("Admin REFUSES to be dragged into a group", moved === false);
  check("a refused drag leaves the arrangement untouched",
    JSON.stringify(d.containers.map((c) => c.tabs.map((t) => t.tab))) === before);
  check("Dashboard refuses too", api._moveTab(d, "dashboard", grp.id, 0) === false);

  // Groups reorder; Top level does not.
  const gid = d.containers[2].id;
  api._moveContainer(d, gid, 1);
  check("a group can be moved", d.containers[1].id === gid);
  check("Top level cannot be moved out of first place",
    api._moveContainer(d, "__top__", 3) === false && d.containers[0].isTop);

  // Rows: every item written, contiguously.
  const rows = api._draftRows(d);
  const tabRows = rows.filter((r) => r.kind === "tab");
  check("every tab gets a row — a partial write would leave order half-defined",
    tabRows.length === api._navItems().length);
  check("every group gets a row", rows.filter((r) => r.kind === "group").length === d.containers.length - 1);
  const topRows = tabRows.filter((r) => r.parent === null).map((r) => r.sort_order);
  check("sort orders inside a container are 0..n-1 with no gaps",
    topRows.every((v, i) => v === i));
  check("a top-level tab writes parent null, a grouped tab writes its group",
    tabRows.filter((r) => r.key === "sierra-training")[0].parent === grp.id);
  check("the write records who arranged it", tabRows[0].updated_by === "sam@x");
})();

// ── Arrange: saving ─────────────────────────────────────────────────────────
(async function () {
  {
    const w = makeWin({ nav: [] });
    const api = w.CPL_ADMIN_TAB;
    const root = w.document.getElementById("admin-root");
    await api._loadGates();
    await new Promise((r) => setTimeout(r, 20));
    api.render(root);
    api._ensureDraft();
    await api._saveDraft(root);
    const post = w.__fetches.filter((f) => /cobi_nav/.test(f.url) && f.init.method === "POST")[0];
    check("saving UPSERTs the whole arrangement in one request",
      post && post.init.headers["Prefer"] === "resolution=merge-duplicates,return=representation");
    check("the save is confirmed only after the rows come back",
      /Saved\. The menu updated for everyone/.test(root.innerHTML));
    check("a successful save pushes straight into the live overlay",
      (w.CPL_NAV_OVERLAY.rows() || []).length > 0);
  }
  {
    // The recurring failure: a policy-filtered write answers 200 + EMPTY body.
    const w = makeWin({ nav: [], saveEmpty: true });
    const api = w.CPL_ADMIN_TAB;
    const root = w.document.getElementById("admin-root");
    await api._loadGates();
    await new Promise((r) => setTimeout(r, 20));
    api.render(root);
    api._ensureDraft();
    api._state.dirty = true;
    await api._saveDraft(root);
    check("a write that touched NO row is reported as a failure",
      /Could not save/.test(root.innerHTML) && /isn.t a reviewer|not saved/.test(root.innerHTML));
    check("a failed save KEEPS the arrangement rather than discarding it",
      api._state.draft !== null && api._state.dirty === true);
    check("a failed save leaves the live menu untouched",
      (w.CPL_NAV_OVERLAY.rows() || []).length === 0);
  }
})();

// ── Arrange: hidden items stay editable, and carry their gate ───────────────
(async function () {
  const w = makeWin({ nav: [{ kind: "tab", key: "sierra-training", hidden: true }] });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);
  check("a hidden tab is still shown in the editor so it can be unhidden",
    /data-hide="sierra-training"/.test(root.innerHTML));
  check("Admin offers no hide control at all", !/data-hide="admin"/.test(root.innerHTML));
  check("Admin explains why it is locked rather than just omitting the control",
    /one-way door/.test(root.innerHTML));
})();

// The teaching moment: the person reaching for "hide" is exactly the one who
// needs telling that hiding is not protecting. Needs a tab whose data really is
// public, so the fixture makes cpl-pathways' table public-read.
(async function () {
  const w = makeWin({
    nav: [],
    gates: DEFAULT_GATES.map((g) => (g.tbl === "cpl_adoption_interest"
      ? { tbl: g.tbl, kind: "table", rls_enabled: true, select_gate: "true", policy_count: 1 } : g)),
  });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);
  check("an item whose data is readable by anyone says so IN the arrange view",
    /Hiding this menu item does NOT change that/.test(root.innerHTML));
})();


// ── A save must ROUND-TRIP what it did not touch ────────────────────────────
// The draft is rebuilt from plan(), which carries placement only. Seeding it
// from placement alone would blank every label, site list and pin the moment
// anyone dragged something else and pressed Save — a silent, total loss of the
// arrangement, caused by an unrelated edit.
(async function () {
  const w = makeWin({
    nav: [
      { kind: "tab", key: "sierra-training", label: "Teach Sierra", orgs: ["cpl", "gr"], pinned: true },
      { kind: "tab", key: "team-phrases", label: "Decisions" },
    ],
  });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);

  const d = api._ensureDraft();
  const st = api._findTab(d, "sierra-training");
  check("the draft picks up an existing custom label", st.item.label === "Teach Sierra");
  check("the draft picks up an existing site list",
    (st.item.orgs || []).join(",") === "cpl,gr");
  check("the draft picks up an existing pin", st.item.pinned === true);

  // Now drag something UNRELATED and save.
  api._moveTab(d, "cpl-pathways", "__top__", 0);
  const rows = api._draftRows(d);
  const saved = rows.filter((r) => r.kind === "tab" && r.key === "sierra-training")[0];
  check("an unrelated drag does NOT blank another tab's label", saved.label === "Teach Sierra");
  check("an unrelated drag does NOT blank another tab's site list",
    (saved.orgs || []).join(",") === "cpl,gr");
  check("an unrelated drag does NOT blank another tab's pin", saved.pinned === true);
  const gov = rows.filter((r) => r.kind === "tab" && r.key === "team-phrases")[0];
  check("a second customised tab survives too", gov.label === "Decisions");
  const untouched = rows.filter((r) => r.kind === "tab" && r.key === "cpl-pathways")[0];
  check("a tab that was never customised still writes a null label", untouched.label === null);
})();


// ── The audience picker, and the warning that has to sit ON it ──────────────
(async function () {
  const w = makeWin({ nav: [] });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);

  // Arrange leads the page — it was shipped last, two screens down, and Sam's
  // first report was that he could not find it.
  check("Arrange is the FIRST section on the tab",
    root.innerHTML.indexOf("Arrange the menu") < root.innerHTML.indexOf("Every menu item"));

  api._openRuleEditNoop = null;
  api._state.editKey = "tab:sierra-training";
  api.render(root);
  check("the editor offers an audience picker", !!root.querySelector('[data-aud="sierra-training"]'));
  check("the picker is worded as SHOW IN MENU, never as access",
    /Show in menu to/.test(root.innerHTML) && !/who can access/i.test(root.innerHTML));
  check("Dashboard gets NO picker — a public visitor must always have a home", (function () {
    api._state.editKey = "tab:dashboard"; api.render(root);
    return !root.querySelector('[data-aud="dashboard"]');
  })());
  check("Admin DOES get one — signing in brings it back, so it is recoverable", (function () {
    api._state.editKey = "tab:admin"; api.render(root);
    return !!root.querySelector('[data-aud="admin"]');
  })());

  // The teaching moment, on the control rather than only in the header.
  const w2 = makeWin({
    nav: [{ kind: "tab", key: "cpl-pathways", audience: "magic_link" }],
    gates: DEFAULT_GATES.map((g) => (g.tbl === "cpl_adoption_interest"
      ? { tbl: g.tbl, kind: "table", rls_enabled: true, select_gate: "true", policy_count: 1 } : g)),
  });
  const api2 = w2.CPL_ADMIN_TAB;
  const root2 = w2.document.getElementById("admin-root");
  await api2._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api2._state.editKey = "tab:cpl-pathways";
  api2.render(root2);
  check("narrowing the audience of a PUBLIC-data tab warns that nothing is protected",
    /still <b>readable by anyone<\/b>/.test(root2.innerHTML));
  // Close the editor first — an open editor REPLACES the row, so the chip is
  // deliberately absent while you are editing that item.
  api2._state.editKey = null; api2.render(root2);
  check("the restricted item carries a chip in the list too",
    /adm-g-aud/.test(root2.innerHTML) && /Magic-link sign-in only/.test(root2.innerHTML));

  // Round-trip: the audience survives an unrelated drag + save.
  const d = api2._ensureDraft();
  check("the draft picks up the saved audience",
    api2._findTab(d, "cpl-pathways").item.audience === "magic_link");
  api2._moveTab(d, "sierra-training", "__top__", 0);
  const rows = api2._draftRows(d);
  check("an unrelated drag does not blank the audience",
    rows.filter((r) => r.kind === "tab" && r.key === "cpl-pathways")[0].audience === "magic_link");
  check("an untouched tab writes the default audience",
    rows.filter((r) => r.kind === "tab" && r.key === "sierra-training")[0].audience === "everyone");
})();

setTimeout(function () {
  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "  ok   " : "  FAIL ") + n); if (ok) pass++; });
  console.log(`\nadmin_tab.test.js: ${pass}/${results.length} checks passed`);
  if (pass !== results.length) process.exit(1);
}, 1400);
