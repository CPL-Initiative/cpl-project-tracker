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
// Evaluate a probe that may throw (a helper this build does not export yet)
// as a plain false. A thrown check must fail ITSELF, not silence the block
// it sits in — that is how a pre-fix verification run reports nothing.
function val(fn) { try { return fn(); } catch (e) { return undefined; } }

/* Every async block registers here so the summary can WAIT for it.
 *
 * The summary used to fire on a fixed 1400ms timer while blocks were still
 * running, so the total drifted between runs (116, 122 and 123 checks on the
 * same source, observed 2026-08-15). A check that never registers can never
 * fail — which is the same shape as the detectors this repo keeps catching:
 * it reports clean because it never ran, and the count is what hides it. */
const BLOCKS = [];

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
        // A real PostgREST rejection: non-2xx, and the reason lives in the BODY.
        if (opts.saveHttp) {
          return Promise.resolve({
            ok: false, status: opts.saveHttp.status,
            text: () => Promise.resolve(opts.saveHttp.body || ""),
            json: () => Promise.reject(new Error("no json")),
          });
        }
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
  check("the table renders unchecked tabs as 'Not checked'", /Not checked/.test(root.innerHTML));
  check("the page states unmapped is not a clean bill of health",
    /not nobody/.test(root.innerHTML));

  // The whole reason both halves share a table.
  check("the page says taking an item off the menu does not lock it",
    /Taking something off the menu does not lock it/.test(root.innerHTML));
  check("the security column is labelled as the only real control",
    /Who can read it/.test(root.innerHTML) && /<th title="Which sites show it/.test(root.innerHTML));
  check("the arrange section renders with drag targets",
    root.querySelectorAll("[data-drop-container]").length > 1 &&
    root.querySelectorAll("[data-drag^='tab:']").length > 0);
  check("the arrange section says these are DISPLAY settings, not protection",
    /see in the menu<\/b>/.test(root.innerHTML));
  check("nothing is written until Save", /Nothing changes for anyone until you press Save/.test(root.innerHTML));
  check("the menu inventory is read from the live nav, not a carried list",
    root.innerHTML.indexOf("Sierra Training") !== -1 && root.innerHTML.indexOf("sierra-training") !== -1);
  check("Admin reports itself as shown on every site", /Every site/.test(root.innerHTML));
})();

// ── (e) the three non-ok states ─────────────────────────────────────────────
BLOCKS.push((async function () {
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
})());

// ── XSS ─────────────────────────────────────────────────────────────────────
BLOCKS.push((async function () {
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
})());


// ── Arrange: the drag-and-drop model ────────────────────────────────────────
// Exercised through the pure model rather than synthetic HTML5 drag events,
// which jsdom does not implement. The DOM handlers are a thin shell over these.
BLOCKS.push((async function () {
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

  /* The lockout guard, enforced at the point of the drag — and it is now
   * GROUP_LOCKED, which holds dashboard alone.
   *
   * Admin used to be barred from every category on the theory that a category
   * can be hidden. It cannot actually take Admin with it: plan() lifts a
   * protected tab OUT of a hidden group (asserted in nav_overlay.test.js,
   * "Admin is LIFTED OUT of a hidden group rather than vanishing with it"), so
   * the door was already sealed one layer down and the drag ban was a second
   * belt that cost Sam the arrangement he wanted. */
  const moved = api._moveTab(d, "admin", grp.id, 0);
  check("Admin CAN be dragged into a category", moved === true);
  check("and it actually lands there", grp.tabs.some((t) => t.tab === "admin"));
  check("Admin keeps its pin to every site while in a category",
    val(() => api._findTab(d, "admin").item.pinned) !== undefined);

  const before = JSON.stringify(d.containers.map((c) => c.tabs.map((t) => t.tab)));
  check("Dashboard still REFUSES — it is where every unmatched link lands",
    api._moveTab(d, "dashboard", grp.id, 0) === false);
  check("that refused drag leaves the arrangement untouched",
    JSON.stringify(d.containers.map((c) => c.tabs.map((t) => t.tab))) === before);
  // Move Admin back so the rest of the block sees the arrangement it expects.
  api._moveTab(d, "admin", "__top__", 0);

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
})());

// ── Arrange: saving ─────────────────────────────────────────────────────────
BLOCKS.push((async function () {
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
})());

// ── The save PAYLOAD, which is where it actually broke (Sky158) ─────────────
//
// Every save 400'd for two days and the table stayed empty while the tab looked
// finished. Nothing above catches it, because each row is individually valid and
// the mock accepts any body: the defect only exists across the ARRAY. A bulk
// POST is one statement over the UNION of the array's keys, so a key present on
// tab rows and absent from group rows is still in the insert list — and every
// group row supplies NULL for it. `audience` is NOT NULL, so Postgres rejected
// the batch (23502) and PostgREST returned 400.
//
// Asserted as UNIFORMITY rather than "has audience": the next column added for
// tabs would otherwise reintroduce exactly this, and pass.
BLOCKS.push((async function () {
  const w = makeWin({ nav: [] });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);
  const d = api._ensureDraft();
  const rows = api._draftRows(d);
  const groups = rows.filter((r) => r.kind === "group");

  check("the payload actually contains group rows (else this proves nothing)", groups.length > 0);

  const shape = (r) => Object.keys(r).sort().join(",");
  const shapes = [...new Set(rows.map(shape))];
  check("EVERY row in a bulk save carries the identical key set",
    shapes.length === 1);

  check("no row omits `audience` — the NOT NULL column that rejected the batch",
    rows.every((r) => Object.prototype.hasOwnProperty.call(r, "audience")));
  check("no row sends a NULL audience", rows.every((r) => r.audience != null));
  check("a group writes the default audience, since audience is resolved per tab",
    groups.every((r) => r.audience === "everyone"));

  // The other half: the failure has to be diagnosable from what it prints.
  {
    const w2 = makeWin({
      nav: [],
      saveHttp: { status: 400, body: JSON.stringify({ code: "23502",
        message: 'null value in column "audience" violates not-null constraint' }) },
    });
    const api2 = w2.CPL_ADMIN_TAB;
    const root2 = w2.document.getElementById("admin-root");
    await api2._loadGates();
    await new Promise((r) => setTimeout(r, 20));
    api2.render(root2);
    api2._ensureDraft();
    api2._state.dirty = true;
    await api2._saveDraft(root2);
    check("a rejected save reports the SERVER's reason, not just the status",
      /violates not-null constraint/.test(root2.innerHTML));
    // Sam was told to renew a sign-in that was never the problem, which sends a
    // curator round a loop no valid session can escape.
    check("a 400 does NOT blame the reviewer sign-in",
      !/renew your reviewer sign-in/.test(root2.innerHTML));
    check("a 400 says the page is at fault so it gets reported instead of retried",
      /fault in the page/.test(root2.innerHTML));
    check("a rejected save still keeps the arrangement", api2._state.draft !== null);
  }
  {
    const w3 = makeWin({ nav: [], saveHttp: { status: 401, body: "" } });
    const api3 = w3.CPL_ADMIN_TAB;
    const root3 = w3.document.getElementById("admin-root");
    await api3._loadGates();
    await new Promise((r) => setTimeout(r, 20));
    api3.render(root3);
    api3._ensureDraft();
    api3._state.dirty = true;
    await api3._saveDraft(root3);
    check("a 401 DOES still point at the sign-in", /renew your reviewer sign-in/.test(root3.innerHTML));
  }
})());

// ── The audience control says what it DOES, unconditionally (Sky158) ────────
//
// Sam: "some say it will hide the menu item and most others don't mention that.
// I wasn't trying to hide it… just noting that they need a team phrase." The ⚠
// renders only for public-read/unmapped tabs, so on most items the word "hides"
// never appeared — while the hiding applies to every one of them.
BLOCKS.push((async function () {
  // Already narrowed, on a tab whose data is NOT public-read — so the ⚠ stays
  // silent and this is exactly the majority case Sam described.
  const w = makeWin({ nav: [{ kind: "tab", key: "sierra-training", audience: "signed_in" }] });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);
  api._ensureDraft();
  api._state.editKey = "tab:sierra-training";
  api.render(root);
  api._state.editKey = "vis:sierra-training";
  api.render(root);
  check("the ladder is open on a tab whose data is NOT public (else no proof)",
    /data-visset="sierra-training"/.test(root.innerHTML) && !/adm-audwarn/.test(root.innerHTML));
  check("the picker states it REMOVES the item from the menu, with no ⚠ present",
    /Nobody sees it in the menu, including you/.test(root.innerHTML));
  check("and names the alternative for 'they just need a phrase'",
    /leave this on <b>Everyone<\/b>/.test(root.innerHTML));
})());

// ── Arrange: hidden items stay editable, and carry their gate ───────────────
BLOCKS.push((async function () {
  const w = makeWin({ nav: [{ kind: "tab", key: "sierra-training", hidden: true }] });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);
  check("a hidden tab is still shown in the editor so it can be unhidden",
    /data-vis="sierra-training"/.test(root.innerHTML));
  check("a hidden item's control READS as hidden rather than needing to be guessed",
    /Seen by: Nobody/.test(root.innerHTML));
  // Admin keeps a visibility control — it may carry an audience rule, which is
  // recoverable — but "nobody" must not be on the ladder at all. An option that
  // cannot be honoured must not be offered.
  check("Admin still has a visibility control", /data-vis="admin"/.test(root.innerHTML));
  check("Admin's ladder does NOT offer 'nobody'",
    val(() => api._rungsFor("admin").every((r) => r.id !== "nobody")));
  check("Dashboard has no visibility control at all — it is the fallback home",
    !/data-vis="dashboard"/.test(root.innerHTML) && val(() => api._rungsFor("dashboard").length) === 0);
  check("Dashboard explains why it is locked rather than just omitting the control",
    /it has to stay findable/.test(root.innerHTML));
})());

// ── The ladder is ONE control over two columns ──────────────────────────────
// `hidden` and `audience` stay separate in the table (plan() treats them
// differently — an audience rule is per-viewer and recoverable, `hidden` is
// neither), so the merge lives entirely in rungOf/applyRung. These guard the
// translation, which is the only place the two can be got wrong.
(function () {
  const w = makeWin();
  const api = w.CPL_ADMIN_TAB;
  // Absent helpers are ONE failed check, not a thrown suite: a crash here would
  // take every later block down with it and report nothing about them.
  if (typeof api._rungOf !== "function" || typeof api._applyRung !== "function") {
    check("the visibility ladder helpers are exported", false);
    return;
  }
  const item = { tab: "sierra-training", hidden: false, audience: "everyone" };
  check("a plain item reads as Everyone", api._rungOf(item).id === "everyone");
  api._applyRung(item, "magic_link");
  check("picking a rung sets the audience and leaves it visible",
    item.audience === "magic_link" && item.hidden === false);
  check("and reads back as that rung", api._rungOf(item).id === "magic_link");
  api._applyRung(item, "nobody");
  check("'nobody' sets hidden", item.hidden === true);
  check("hidden OUTRANKS the audience when reading the rung", api._rungOf(item).id === "nobody");
  // The reason `hidden` does not clear `audience`: un-hiding would otherwise
  // silently widen a magic-link-only item to everyone, which is the one
  // direction of drift nobody would notice.
  check("'nobody' PRESERVES the audience underneath it", item.audience === "magic_link");
  api._applyRung(item, "everyone");
  check("moving off 'nobody' un-hides", item.hidden === false && item.audience === "everyone");
})();

// The teaching moment: the person reaching for "hide" is exactly the one who
// needs telling that hiding is not protecting. Needs a tab whose data really is
// public, so the fixture makes cpl-pathways' table public-read.
BLOCKS.push((async function () {
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
    /Changing who sees the menu item does not change this/.test(root.innerHTML));

  /* EVERY item carries its measured gate, not only the alarming ones.
   *
   * The chip used to render for open/public/view alone, so a properly protected
   * tab showed nothing — indistinguishable from a tab nobody had looked at, and
   * the same asymmetry that hid the audience note on most items. Sam asked for
   * the method to be noted per item; measured beats hand-typed. */
  const items = Array.from(root.querySelectorAll(".adm-item"));
  const chipless = items.filter((el) => !el.querySelector("[class*='adm-g-']"));
  check(`every menu item carries a protection chip (${items.length - chipless.length}/${items.length})`,
    items.length > 3 && chipless.length === 0);
  check("a reviewer-only tab is chipped as such, not left blank",
    ["team", "reviewer"].indexOf(val(() => api._rowGate("sierra-training").id)) !== -1);
  check("the chip names the DATA's protection, not the menu's",
    /Who can read the data behind this page/.test(root.innerHTML));
})());

// ── A failed gate read is not 35 findings ───────────────────────────────────
// The trap in chipping every row: with no measurement, classify() returns
// unknown for every table, so the rail would report "Not mapped" on every item
// at once — indistinguishable from a real finding that nothing on the site is
// mapped. The reason the answer is missing has to be IN the chip.
BLOCKS.push((async function () {
  const w = makeWin({ gatesFail: true });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);
  check("a failed gate read leaves the state as error, not ok", api._state.loadState === "error");
  check("a mapped tab chips UNREAD, never 'Not mapped', when the read failed",
    val(() => api._rowGate("sierra-training").id) === "unread");
  check("the unread chip says the measurement is missing, not that the tab is",
    /not a finding about this page/.test(val(() => api._gateById("unread").hint) || ""));
  /* Today this branch is DEFENSIVE, not reached: render() short-circuits the
   * whole tab on a failed gate read, so no row is drawn to carry a chip. It is
   * kept — and tested — because the alternative is that the day anyone lets the
   * arrange view render without a gate measurement (a partial read, or an
   * editor that works offline), 35 rows quietly claim "Not mapped". Asserting
   * the short-circuit here too, so a change to it fails LOUDLY rather than
   * silently activating the branch. */
  check("a failed read still shows the reason instead of the menu editor",
    !/adm-item/.test(root.innerHTML) && /Could not read the database rules/.test(root.innerHTML));
  // A tab genuinely absent from the surface map is still reported as unmapped —
  // the structural answer does not depend on the live read.
  check("an unmapped tab still reads as Not checked even so",
    val(() => api._rowGate("no-such-tab").id) === "unknown");
})());


// ── A save must ROUND-TRIP what it did not touch ────────────────────────────
// The draft is rebuilt from plan(), which carries placement only. Seeding it
// from placement alone would blank every label, site list and pin the moment
// anyone dragged something else and pressed Save — a silent, total loss of the
// arrangement, caused by an unrelated edit.
BLOCKS.push((async function () {
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
})());


// ── The audience picker, and the warning that has to sit ON it ──────────────
BLOCKS.push((async function () {
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
  /* The picker is reached from the ROW now, not from ✏️. Sam pressed the hide
   * affordance expecting it to ask who — two controls for one question is what
   * let an audience be narrowed by someone who meant only to annotate. */
  api._state.editKey = "tab:sierra-training";
  api.render(root);
  check("the ✏️ editor no longer carries a second audience control",
    !root.querySelector('[data-aud="sierra-training"]') && !root.querySelector("[data-visset]"));
  check("but it points at where the control moved to",
    /button on the row/.test(root.innerHTML));

  api._state.editKey = "vis:sierra-training";
  api.render(root);
  check("the ladder offers every rung", (function () {
    const vals = Array.from(root.querySelectorAll("[data-visset]")).map((e) => e.value);
    return ["everyone", "signed_in", "magic_link", "nobody"].every((v) => vals.indexOf(v) !== -1);
  })());
  check("the picker is worded as SHOW IN MENU, never as access",
    /Who sees .* in the menu\?/.test(root.innerHTML) && !/who can access/i.test(root.innerHTML));
  check("Dashboard gets NO picker — a public visitor must always have a home", (function () {
    api._state.editKey = "vis:dashboard"; api.render(root);
    return !root.querySelector('[data-visset="dashboard"]');
  })());
  check("Admin DOES get one — signing in brings it back, so it is recoverable", (function () {
    api._state.editKey = "vis:admin"; api.render(root);
    return !!root.querySelector('[data-visset="admin"]');
  })());
  check("but Admin's ladder omits the one rung that is NOT recoverable", (function () {
    const vals = Array.from(root.querySelectorAll('[data-visset="admin"]')).map((e) => e.value);
    return vals.length === 3 && vals.indexOf("nobody") === -1;
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
  api2._state.editKey = "vis:cpl-pathways";
  api2.render(root2);
  check("narrowing the audience of a PUBLIC-data tab warns that nothing is protected",
    /still be <b>read by anyone<\/b>/.test(root2.innerHTML));
  // Close the editor first — an open editor REPLACES the row, so the chip is
  // deliberately absent while you are editing that item.
  api2._state.editKey = null; api2.render(root2);
  check("the restricted item states its rung on the row itself",
    /Seen by: Magic link/.test(root2.innerHTML));
  check("and the row still carries the DATA's protection alongside it",
    /adm-g-open|adm-g-public/.test(root2.innerHTML));

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
})());

// ── Curator-created categories ──────────────────────────────────────────────
// Until now a group had to exist in nav_groups.js, and a tab parented to an
// unknown group SILENTLY degraded to top level — which is exactly what a
// curator-made group would have looked like, so the failure was invisible.
BLOCKS.push((async function () {
  const w = makeWin({ nav: [] });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);

  check("the tab offers a way to add a category", !!root.querySelector("[data-addcat]"));

  const d = api._ensureDraft();
  const before = d.containers.length;
  check("a category with no name is REFUSED", val(() => api._addCategory(d, "   ")) == null
    && d.containers.length === before);

  const made = val(() => api._addCategory(d, "Ashley's Tools"));
  check("a named category is created", !!made && d.containers.length === before + 1);
  check("its key is derived from the name, slugged", made && made.id === "ashley-s-tools");
  check("it is marked as curator-made", made && made.custom === true);

  // A key collision would merge two categories into one row on the next load,
  // and a key matching a SHIPPED group would silently take that group over.
  const twin = val(() => api._addCategory(d, "Ashley's Tools"));
  check("a second category with the same name gets a DISTINCT key",
    twin && twin.id !== made.id);
  const codeIds = val(() => api._codeGroupIds()) || {};
  const firstCode = Object.keys(codeIds)[0];
  check("a category named after a SHIPPED group does not take it over", (function () {
    if (!firstCode) return false;
    const clash = api._addCategory(d, firstCode);
    return clash && clash.id !== firstCode;
  })());

  // The overlay has to build a heading for it, or the tabs dragged in fall to
  // the top level and it looks like they went missing.
  const rows = api._draftRows(d);
  const groupRow = rows.filter((r) => r.kind === "group" && r.key === made.id)[0];
  check("the new category is written as a group row", !!groupRow);
  check("and carries its name", groupRow && groupRow.label === "Ashley's Tools");
  check("group rows still match tab rows key-for-key (the 400 that ate every save)",
    (function () {
      const keys = rows.map((r) => Object.keys(r).sort().join("|"));
      return keys.length > 1 && keys.every((k) => k === keys[0]);
    })());

  // plan() must now BUILD the group, not degrade its members to top level.
  const ov = w.CPL_NAV_OVERLAY;
  // Replace, do not append: get() returns the FIRST matching row, so a second
  // cpl-pathways row would be shadowed by the one draftRows already wrote and
  // this would test nothing.
  ov._set(rows.filter((r) => !(r.kind === "tab" && r.key === "cpl-pathways")).concat([{
    kind: "tab", key: "cpl-pathways", parent: made.id, sort_order: 0,
    hidden: false, audience: "everyone", label: null, orgs: null, pinned: false,
  }]));
  const plan = ov.plan(w.CPL_NAV_GROUPS.GROUPS, ["dashboard", "admin", "cpl-pathways", "sierra-training"]);
  const built = plan.all.groups.filter((g) => g.id === made.id)[0];
  check("plan() builds the curator's category", !!built && built.label === "Ashley's Tools");
  check("a tab parented to it lands INSIDE it, not at top level",
    !!built && built.tabs.some((t) => t.tab === "cpl-pathways")
    && !plan.all.top.some((t) => t.tab === "cpl-pathways"));
  check("and the rail renders it with its member",
    plan.groups.filter((g) => g.id === made.id).some((g) => g.tabs.indexOf("cpl-pathways") !== -1));

  // A group the overlay cannot name is dropped, so a blank one would take its
  // tabs down with it. Guarded by falling the label back to the key.
  const d2 = api._buildDraft();
  const c2 = api._addCategory(d2, "Temp");
  c2.label = "   ";
  const r2 = api._draftRows(d2).filter((r) => r.kind === "group" && r.key === c2.id)[0];
  check("a curator category renamed to BLANK still saves a label",
    !!r2 && !!r2.label && r2.label === c2.id);
  const shipped = api._draftRows(d2).filter((r) => r.kind === "group" && r.key === firstCode)[0];
  check("a SHIPPED group may still write a null label — it falls back to the code",
    !shipped || shipped.label === null || typeof shipped.label === "string");
})());

// ── Removing a category is a DELETE, not an omission ────────────────────────
// The save is an upsert, so a row simply left out of the payload stays in the
// table and the category returns on the next load, out of position.
BLOCKS.push((async function () {
  const w = makeWin({
    nav: [
      { kind: "group", key: "my-cat", label: "My Category", sort_order: 9 },
      { kind: "tab", key: "cpl-pathways", parent: "my-cat", sort_order: 0 },
    ],
  });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);

  const d = api._ensureDraft();
  const cat = d.containers.filter((c) => c.id === "my-cat")[0];
  check("an existing overlay-only category is rebuilt as a container", !!cat);
  check("and is recognised as curator-made", cat && cat.custom === true);
  check("a SHIPPED group is NOT offered for removal",
    !/data-gdel="funding"/.test(root.innerHTML));
  check("a NON-EMPTY category is not offered for removal either",
    !/data-gdel="my-cat"/.test(root.innerHTML));

  api._moveTab(d, "cpl-pathways", "__top__", 0);
  api.render(root);
  check("once emptied, it CAN be removed", /data-gdel="my-cat"/.test(root.innerHTML));
  check("nothing is queued for deletion while it is still in the draft",
    (val(() => api._removedGroupKeys(d)) || []).indexOf("my-cat") === -1);

  d.containers = d.containers.filter((c) => c.id !== "my-cat");
  check("removing it from the draft queues an explicit DELETE",
    (val(() => api._removedGroupKeys(d)) || []).indexOf("my-cat") !== -1);

  await api._saveDraft(root);
  const del = w.__fetches.filter((f) => (f.init.method === "DELETE") && /cobi_nav/.test(f.url));
  check("the save issues that DELETE", del.length === 1 && /my-cat/.test(del[0].url));
  check("scoped to groups, so a TAB of the same key is never deleted",
    del.length === 1 && /kind=eq\.group/.test(del[0].url));
  check("and the DELETE goes before the upsert", (function () {
    const iDel = w.__fetches.findIndex((f) => f.init.method === "DELETE" && /cobi_nav/.test(f.url));
    const iPost = w.__fetches.findIndex((f) => f.init.method === "POST" && /cobi_nav/.test(f.url));
    return iDel !== -1 && iPost !== -1 && iDel < iPost;
  })());
})());

// A failed delete must ABORT the save. Writing the arrangement anyway leaves
// the category behind, and it reappears on the next load out of the position
// the curator last saw — which reads as the save having partly worked.
BLOCKS.push((async function () {
  const w = makeWin({
    nav: [{ kind: "group", key: "my-cat", label: "My Category", sort_order: 9 }],
    deleteFails: true,
  });
  const api = w.CPL_ADMIN_TAB;
  const root = w.document.getElementById("admin-root");
  await api._loadGates();
  await new Promise((r) => setTimeout(r, 20));
  api.render(root);
  const d = api._ensureDraft();
  d.containers = d.containers.filter((c) => c.id !== "my-cat");
  api._state.dirty = true;
  await api._saveDraft(root);
  check("a failed category delete does NOT go on to write the arrangement",
    w.__fetches.filter((f) => f.init.method === "POST" && /cobi_nav/.test(f.url)).length === 0);
  check("it reports a failure rather than success",
    !!api._state.saveMsg && api._state.saveMsg.ok === false);
  check("and keeps the draft so nothing typed is lost", !!api._state.draft);
})());

Promise.allSettled(BLOCKS).then(function (settled) {
  // A block that threw is reported as a failed check rather than simply
  // contributing nothing — a vanished block is indistinguishable from a block
  // that had nothing to say.
  settled.forEach(function (r, i) {
    if (r.status === "rejected") {
      check("async block " + i + " ran to completion — " + ((r.reason && r.reason.message) || r.reason), false);
    }
  });
  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "  ok   " : "  FAIL ") + n); if (ok) pass++; });
  console.log(`\nadmin_tab.test.js: ${pass}/${results.length} checks passed`);
  if (pass !== results.length) process.exit(1);
});
