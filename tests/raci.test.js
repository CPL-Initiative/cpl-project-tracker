// Team & RACI tab (raci.js) — jsdom test.
//
// Guards: (a) Rule 4 (both HTMLs identical) + nav button / pane / boot wiring;
// (b) the matrix builds the 4 Activities + their projects from window.CPL_DATA,
//     grouping projects by workplan_activity (so a `5.x` id lands under its true
//     Activity, not a phantom Activity 5); (c) a stored RACI assignment renders
//     as a member chip; (d) the failure mode — a project with a null/blank
//     activity must render without throwing; (e) the directory view lists members.
//
// Run from repo root: `npm test` (or `node tests/raci.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav button present", /data-tab="raci" role="tab"[^>]*>Team &amp; RACI</.test(cpl));
check("tab pane present", /id="tab-raci" data-tab="raci"/.test(cpl));
check("mount div present", /id="raci-root"/.test(cpl));
check("lazy boot wiring present",
  /onActivate\('raci'/.test(cpl) && /loadScript\('raci\.js', 'CPL_RACI_TAB'/.test(cpl));

// ── Part B — behavior, loaded into jsdom ──
const SRC = fs.readFileSync("raci.js", "utf8");

function makeDom(members, raciRows, opts) {
  opts = opts || {};
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  dom._writes = [];
  if (opts.session) w.sessionStorage.setItem("cpl_sb", JSON.stringify(opts.session));
  // Mock the items source + Supabase REST.
  w.CPL_DATA = {
    activity_kpis: [
      { activity_id: "Activity 1", activity_name: "Build AI-Enhanced CPL Infrastructure",
        kpis: [{ id: "1.1", name: "MAP Platform Development" }] },
      { activity_id: "Activity 4", activity_name: "Sprints, Projects & Partnerships",
        kpis: [{ id: "4.1", name: "Sprints" }] },
    ],
    projects: [
      { id: "1.1", name: "MAP Platform Development", activity: "Activity 1: Build AI-Enhanced CPL Infrastructure" },
      { id: "4.1", name: "Sprints and Projects", activity: "Activity 4: Sprints, Projects & Partnerships" },
      { id: "4.1.1", name: "Veteran Sprint", activity: "Activity 4: Sprints, Projects & Partnerships" }, // nests under 4.1
      { id: "3.2", name: "CPL Units Transcription", activity: "Activity 3: Build Robust CPL Data Infrastructure" },
      { id: "5.1", name: "AI-Ready California Demonstration", activity: "Activity 4: Sprints, Projects & Partnerships" },
      { id: "9.9", name: "Orphan no activity", activity: "" }, // failure-mode guard
    ],
  };
  w.fetch = function (url, init) {
    const method = (init && init.method) || "GET";
    // Token refresh endpoint — return a renewed session.
    if (/\/auth\/v1\/token\?grant_type=refresh_token/.test(url)) {
      dom._refreshes = (dom._refreshes || 0) + 1;
      return Promise.resolve({ ok: true, status: 200, json: function () {
        return Promise.resolve({ access_token: "new.aaa.bbb", refresh_token: "r2", expires_in: 3600 }); } });
    }
    if (method !== "GET") {
      let parsed = null; try { parsed = JSON.parse((init && init.body) || "null"); } catch (e) {}
      const auth = (init && init.headers && init.headers.Authorization) || "";
      dom._writes.push({ url: url, method: method, body: parsed, auth: auth });
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } });
    }
    // Deep-copy so each jsdom instance owns its rows (the same MEMBERS/RACI_ROWS
    // arrays are passed to several doms; without a copy, one dom's optimistic
    // mutation — e.g. clear-all setting nudge=false — would leak into the others).
    let body = [];
    if (/team_members/.test(url)) body = JSON.parse(JSON.stringify(members || []));
    else if (/item_raci/.test(url)) body = JSON.parse(JSON.stringify(raciRows || []));
    return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(body); } });
  };
  w.eval(SRC);
  return dom;
}

const MEMBERS = [
  { name: "Crystal Nasio", email: "crystal.nasio@rccd.edu", role: "Ops" },
  { name: "Terence Nelson", email: "terence.nelson@rccd.edu", role: "Pathways" },
];
const RACI_ROWS = [
  { item_type: "project", item_id: "1.1", raci: { R: [{ name: "Crystal Nasio", email: "crystal.nasio@rccd.edu" }], A: [], C: [], I: [] } },
  { item_type: "activity", item_id: "4", raci: { R: [], A: [{ name: "Terence Nelson", email: "terence.nelson@rccd.edu" }], C: [], I: [] } },
];

(async function () {
  const dom = makeDom(MEMBERS, RACI_ROWS);
  const T = dom.window.CPL_RACI_TAB;
  check("module exposes CPL_RACI_TAB", !!T && typeof T.boot === "function");

  let threw = false;
  try { T.boot(); } catch (e) { threw = true; }
  check("boot() does not throw", !threw);
  // let the mocked fetch promises resolve
  await new Promise((r) => setTimeout(r, 30));

  const doc = dom.window.document;
  const rows = doc.querySelectorAll(".raci-table tr");
  // header + 4 activities + 3 placed projects (orphan 9.9 falls under Activity 9 group? no — only ACTIVITIES 1-4 emit groups)
  check("matrix renders activity rows", doc.querySelectorAll(".raci-row-act").length === 4);
  check("5.1 placed under an Activity (grouped by workplan_activity)",
    /AI-Ready California/.test(doc.body.innerHTML));
  check("orphan project with blank activity did not crash render", rows.length > 4);

  // (c) stored RACI assignment shows as a chip
  check("RACI chip rendered for an assigned member", /raci-chip/.test(doc.body.innerHTML)
    && /Crystal Nasio/.test(doc.body.innerHTML));

  // (f) 3-tier hierarchy: Activity → sub-activity → project (Session 76 — SkyTrek).
  check("sub-activity row tagged + styled (4.1 from activity_kpis)",
    !!doc.querySelector('.raci-row-sub[data-raci-key="project:4.1"]') &&
    /sub-activity/.test(doc.body.innerHTML));
  check("project nests under its sub-activity (4.1.1 at depth 2)",
    (doc.querySelector('[data-raci-key="project:4.1.1"]') || {}).getAttribute &&
    doc.querySelector('[data-raci-key="project:4.1.1"]').getAttribute("data-depth") === "2");
  check("a 5.x project nests directly under its Activity (depth 1)",
    doc.querySelector('[data-raci-key="project:5.1"]').getAttribute("data-depth") === "1");

  // (g) hierarchical scope filter + search.
  const fsel = doc.querySelector(".raci-filter-sel");
  const fq = doc.querySelector(".raci-filter-q");
  // Scope assertions read the MATRIX TABLE text, not body (the dropdown <option>
  // labels now contain sub-activity names, which would false-match on body).
  const mtext = () => { const t = doc.querySelector(".raci-table"); return t ? t.textContent : ""; };
  check("filter bar present (scope dropdown + search)", !!fsel && !!fq);
  check("dropdown exposes sub-activities as options (optgroup)",
    !!doc.querySelector('option[value="sub:4.1"]') && !!doc.querySelector('optgroup'));
  if (fsel) {
    // Scope to Activity 1 → only Activity 1's subtree.
    fsel.value = "act:1";
    fsel.dispatchEvent(new dom.window.Event("change"));
    check("Activity scope narrows to one Activity header",
      doc.querySelectorAll(".raci-row-act").length === 1);
    check("Activity-1 scope keeps its sub-activity (MAP Platform), drops others",
      /MAP Platform/.test(mtext()) && !/CPL Units Transcription/.test(mtext()));
    // Scope to a single SUB-ACTIVITY → it + its child project + its Activity header.
    fsel.value = "sub:4.1"; fsel.dispatchEvent(new dom.window.Event("change"));
    check("sub-activity scope shows the sub + its child project",
      /Sprints and Projects/.test(mtext()) && /Veteran Sprint/.test(mtext()));
    check("sub-activity scope excludes sibling 5.x project + other Activities",
      !/AI-Ready California/.test(mtext()) && !/MAP Platform/.test(mtext()));
    // Back to all, search by project name → match + ancestor chain.
    fsel.value = "all"; fsel.dispatchEvent(new dom.window.Event("change"));
    fq.value = "transcription"; fq.dispatchEvent(new dom.window.Event("input"));
    check("search surfaces the matching project + its Activity header",
      /CPL Units Transcription/.test(mtext()) && !/MAP Platform/.test(mtext()));
    check("a no-match search shows the empty-state row", (function () {
      fq.value = "zzzznomatch"; fq.dispatchEvent(new dom.window.Event("input"));
      return /No Activities or Projects match/.test(mtext());
    })());
    // Reset for the directory-view checks below.
    const clr = doc.querySelector(".raci-filter-clear");
    if (clr) clr.click();
  }

  // (g) per-card deep-link focus (Session 76 — SkyTrek). A card sets
  // sessionStorage cpl_raci_focus then navigates to #raci; a cpl-tab-activated
  // event must consume it, switch to the matrix, and flash the target row.
  check("matrix rows carry a data-raci-key", !!doc.querySelector('[data-raci-key="project:3.2"]'));
  dom.window.sessionStorage.setItem("cpl_raci_focus", "project:3.2");
  dom.window.dispatchEvent(new dom.window.CustomEvent("cpl-tab-activated", { detail: { tab: "raci" } }));
  check("deep-link focus flashes the target row",
    !!doc.querySelector('[data-raci-key="project:3.2"].raci-row-focus'));
  check("deep-link focus consumes the sessionStorage key",
    dom.window.sessionStorage.getItem("cpl_raci_focus") === null);
  check("a non-raci tab activation is ignored", (function () {
    dom.window.sessionStorage.setItem("cpl_raci_focus", "activity:1");
    dom.window.dispatchEvent(new dom.window.CustomEvent("cpl-tab-activated", { detail: { tab: "budget" } }));
    return dom.window.sessionStorage.getItem("cpl_raci_focus") === "activity:1";
  })());
  dom.window.sessionStorage.removeItem("cpl_raci_focus");

  // (e) directory view: switch via the toggle, assert members + the
  // "Nudge for Updates" opt-in column render.
  const toggles = doc.querySelectorAll(".raci-tg");
  let dirBtn = null;
  toggles.forEach(function (b) { if (/Directory/.test(b.textContent)) dirBtn = b; });
  check("directory toggle present", !!dirBtn);
  if (dirBtn) dirBtn.click();
  check("directory lists a member", /Terence Nelson/.test(doc.body.innerHTML));
  check("'Nudge for Updates' column header present", !!doc.querySelector(".raci-th-nudge")
    && /Nudge for Updates/.test(doc.body.innerHTML));
  check("per-member nudge checkbox rendered", doc.querySelectorAll(".raci-nudge-cb").length >= 1);

  // ── (h) Copy-RACI (Session 77 — StarPort): copy one row's R/A/C/I to others ──
  // Anonymous viewer: no ⧉ copy affordance.
  const anon = makeDom(MEMBERS, RACI_ROWS);
  anon.window.CPL_RACI_TAB.boot();
  await new Promise((r) => setTimeout(r, 30));
  check("anon: no ⧉ copy button", anon.window.document.querySelectorAll(".raci-copy-btn").length === 0);

  // Signed-in reviewer: copy button on POPULATED rows only.
  const signed = makeDom(MEMBERS, RACI_ROWS, { session: { access_token: "aaa.bbb.ccc" } });
  signed.window.CPL_RACI_TAB.boot();
  await new Promise((r) => setTimeout(r, 30));
  const sdoc = signed.window.document;
  check("signed-in: ⧉ copy button on a populated row (1.1)",
    !!sdoc.querySelector('[data-raci-key="project:1.1"] .raci-copy-btn'));
  check("signed-in: NO copy button on an empty row (3.2)",
    !sdoc.querySelector('[data-raci-key="project:3.2"] .raci-copy-btn'));

  // Click copy on 1.1 → modal opens with a target list.
  sdoc.querySelector('[data-raci-key="project:1.1"] .raci-copy-btn').click();
  check("copy modal opens", !!sdoc.getElementById("raciOverlay") && !!sdoc.querySelector(".raci-copy-list"));
  const pick = sdoc.querySelector('.raci-copy-pick[data-search^="3.2 "]');
  check("copy modal lists target rows", !!pick);
  if (pick) {
    const cb = pick.querySelector("input");
    cb.checked = true; cb.dispatchEvent(new signed.window.Event("change"));
    const goBtn = Array.from(sdoc.querySelectorAll(".raci-btn-go"))
      .filter((b) => /Copy to/.test(b.textContent))[0];
    check("Copy button enables + counts the selection",
      goBtn && !goBtn.disabled && /Copy to 1 row/.test(goBtn.textContent));
    goBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    const w = signed._writes.filter((x) => /item_raci/.test(x.url) && x.body && x.body.item_id === "3.2");
    check("Copy POSTs the source RACI to the target key (3.2)",
      w.length === 1 && w[0].body.item_type === "project" &&
      w[0].body.raci && Array.isArray(w[0].body.raci.R) &&
      w[0].body.raci.R.length === 1 && w[0].body.raci.R[0].name === "Crystal Nasio");
  }

  // ── (i) Manual nudge button (Session 77 — StarPort): mailto draft to opted-in ──
  check("anon: no nudge button on the matrix", !anon.window.document.querySelector(".raci-filter-nudge"));
  check("signed-in: 📣 nudge button on the matrix", !!sdoc.querySelector(".raci-filter-nudge"));
  const href = signed.window.CPL_RACI_TAB._nudgeHref();
  check("nudge href is a mailto to the opted-in members (both, default-on)",
    /^mailto:/.test(href) &&
    /crystal\.nasio%40rccd\.edu/.test(href) && /terence\.nelson%40rccd\.edu/.test(href));
  check("nudge href carries a subject + dashboard link",
    /subject=/.test(href) && /%23raci/.test(href));

  // ── (j) Check-all / clear-all on the Team Directory nudge column ──
  const sdir = makeDom(MEMBERS, RACI_ROWS, { session: { access_token: "aaa.bbb.ccc" } });
  sdir.window.CPL_RACI_TAB.boot();
  await new Promise((r) => setTimeout(r, 30));
  const ddoc = sdir.window.document;
  let dirToggle = null;
  ddoc.querySelectorAll(".raci-tg").forEach(function (b) { if (/Directory/.test(b.textContent)) dirToggle = b; });
  if (dirToggle) dirToggle.click();
  const allCb = ddoc.querySelector(".raci-nudge-all");
  check("directory: check-all master checkbox in the nudge header", !!allCb);
  check("check-all reflects all-on by default (both members default-on)", !!allCb && allCb.checked === true);
  if (allCb) {
    allCb.checked = false; allCb.dispatchEvent(new sdir.window.Event("change"));
    await new Promise((r) => setTimeout(r, 30));
    const clears = sdir._writes.filter((x) => /team_members/.test(x.url) && x.method === "PATCH" && x.body && x.body.nudge === false);
    check("clear-all PATCHes every member's nudge to false", clears.length === 2);
  }

  // ── (k) Nudge accountability: last_nudged_at stamp + response status ──
  // Firing the nudge stamps last_nudged_at on the recipients.
  try { sdoc.querySelector(".raci-filter-nudge").click(); } catch (e) {}
  await new Promise((r) => setTimeout(r, 30));
  const stamps = signed._writes.filter((x) => /team_members/.test(x.url) && x.method === "PATCH" && x.body && x.body.last_nudged_at);
  check("firing the nudge stamps last_nudged_at on recipients", stamps.length >= 1);

  // Directory status columns: overdue (nudged, no response) vs responded (✓).
  const DAY = 86400000;
  const MEMBERS_TS = [
    { id: 11, name: "Quiet Quentin", email: "q@x.edu", role: "Lead",
      last_nudged_at: new Date(Date.now() - 10 * DAY).toISOString() },                 // overdue
    { id: 12, name: "Responsive Rita", email: "r@x.edu", role: "Lead",
      last_nudged_at: new Date(Date.now() - 3 * DAY).toISOString(),
      last_response_at: new Date(Date.now() - 1 * DAY).toISOString() },                // responded
  ];
  const sts = makeDom(MEMBERS_TS, [], { session: { access_token: "aaa.bbb.ccc" } });
  sts.window.CPL_RACI_TAB.boot();
  await new Promise((r) => setTimeout(r, 30));
  const tdoc = sts.window.document;
  let tTog = null;
  tdoc.querySelectorAll(".raci-tg").forEach(function (b) { if (/Directory/.test(b.textContent)) tTog = b; });
  if (tTog) tTog.click();
  check("directory has Last-nudged + Status columns",
    /Last nudged/.test(tdoc.body.textContent) && /Status/.test(tdoc.body.textContent));
  const statusCells = tdoc.querySelectorAll(".raci-status-cell");
  check("overdue member (nudged 10d, no response) flagged", !!tdoc.querySelector(".raci-st-overdue"));
  check("responded member shows ✓", !!tdoc.querySelector(".raci-st-ok") && /responded/.test(tdoc.body.textContent));
  // Clicking the overdue member's status cell records a response (PATCH last_response_at).
  if (statusCells.length) {
    statusCells[0].click();
    await new Promise((r) => setTimeout(r, 30));
    const resp = sts._writes.filter((x) => /team_members/.test(x.url) && x.method === "PATCH" && x.body && x.body.last_response_at);
    check("clicking Status records a response (PATCH last_response_at)", resp.length >= 1);
  }

  // ── (l) Expired-token auto-refresh on write (the "saves don't persist" bug) ──
  // A session whose access token is expired but carries a refresh_token must
  // renew before a write, so the save lands with a fresh Bearer (not a dead 401).
  const expired = makeDom(MEMBERS_TS, [],
    { session: { access_token: "old.aa.bb", refresh_token: "r1", email: "map@rccd.edu", exp: Date.now() - 1000 } });
  expired.window.CPL_RACI_TAB.boot();
  await new Promise((r) => setTimeout(r, 30));
  const edoc = expired.window.document;
  let eTog = null;
  edoc.querySelectorAll(".raci-tg").forEach(function (b) { if (/Directory/.test(b.textContent)) eTog = b; });
  if (eTog) eTog.click();
  const eStatus = edoc.querySelector(".raci-status-cell");
  if (eStatus) {
    eStatus.click();
    await new Promise((r) => setTimeout(r, 40));
    check("expired token triggers a refresh before the write", (expired._refreshes || 0) >= 1);
    const fresh = expired._writes.filter((x) => /team_members/.test(x.url) && x.method === "PATCH" && x.auth === "Bearer new.aaa.bbb");
    check("the write lands with the refreshed Bearer token", fresh.length >= 1);
  }

  // ── (m) Update composer (Phase 1 of the braindump→CC-polish epic) ──
  check("matrix rows carry a 📝 update button", !!sdoc.querySelector('[data-raci-key="project:1.1"] .raci-upd-btn'));
  check("item summary pulls the card name", /MAP Platform Development/.test(signed.window.CPL_RACI_TAB._itemSummary({ type: "project", id: "1.1", name: "x", isActivity: false })));
  // Open the composer for 1.1 and post an update.
  sdoc.querySelector('[data-raci-key="project:1.1"] .raci-upd-btn').click();
  check("update composer opens with the card summary", !!sdoc.getElementById("raciOverlay") && !!sdoc.querySelector(".raci-upd-summary"));
  const uta = sdoc.querySelector(".raci-upd-ta");
  check("signed-in reviewer sees the braindump box", !!uta);
  if (uta) {
    uta.value = "shipped the portal; 3 colleges onboarded";
    const saveBtn = Array.from(sdoc.querySelectorAll(".raci-btn-go")).filter((b) => /Save update/.test(b.textContent))[0];
    check("composer has a Save button", !!saveBtn);
    if (saveBtn) {
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 30));
      const posted = signed._writes.filter((x) => /item_updates/.test(x.url) && x.method === "POST" && x.body && x.body.body === "shipped the portal; 3 colleges onboarded");
      check("Save POSTs the update to item_updates with the item key",
        posted.length === 1 && posted[0].body.item_type === "project" && posted[0].body.item_id === "1.1");
    }
  }

  // Deep-link: ?update / sessionStorage cpl_update_focus opens the composer.
  const dl = makeDom(MEMBERS, RACI_ROWS, { session: { access_token: "aaa.bbb.ccc" } });
  dl.window.CPL_RACI_TAB.boot();
  await new Promise((r) => setTimeout(r, 30));
  dl.window.sessionStorage.setItem("cpl_update_focus", "project:3.2");
  dl.window.dispatchEvent(new dl.window.CustomEvent("cpl-tab-activated", { detail: { tab: "raci" } }));
  check("update deep-link opens the composer for the target item",
    !!dl.window.document.getElementById("raciOverlay") && /CPL Units Transcription/.test(dl.window.document.body.textContent));
  check("update deep-link consumes the sessionStorage key",
    dl.window.sessionStorage.getItem("cpl_update_focus") === null);

  let failed = 0;
  for (const [name, ok] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + name);
    if (!ok) failed++;
  }
  console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
  process.exit(failed === 0 ? 0 : 1);
})();
