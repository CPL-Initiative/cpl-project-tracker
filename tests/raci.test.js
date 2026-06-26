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

function makeDom(members, raciRows) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
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
  w.fetch = function (url) {
    let body = [];
    if (/team_members/.test(url)) body = members;
    else if (/item_raci/.test(url)) body = raciRows;
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

  let failed = 0;
  for (const [name, ok] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + name);
    if (!ok) failed++;
  }
  console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
  process.exit(failed === 0 ? 0 : 1);
})();
