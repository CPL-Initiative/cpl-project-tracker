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
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  };
  [ORGS_SRC, SURFACE_SRC, ADMIN_SRC].forEach((src) => {
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
  check("what is NOT built is stated plainly rather than implied",
    /Not built yet: rearranging the menu/.test(root.innerHTML));
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

setTimeout(function () {
  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "  ok   " : "  FAIL ") + n); if (ok) pass++; });
  console.log(`\nadmin_tab.test.js: ${pass}/${results.length} checks passed`);
  if (pass !== results.length) process.exit(1);
}, 300);
