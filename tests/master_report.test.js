// Master Report modal + client-side generator (master_report.js) — jsdom test.
//
// Guards:
//  (a) the filter-bar "Master Report" affordance is a MODAL BUTTON that
//      lazy-loads master_report.js (not the old bare download link), with the
//      daily pre-built docx kept as the fallback;
//  (b) the modal builds the same Activities & Projects checkbox tree as the
//      Custom Report from window.CPL_DATA (D.* helper rows excluded), with
//      working Select All / Clear All;
//  (c) buildReportModel overlays the LIVE data: newest item_updates body/date
//      per project, activity-level updates, and the RACI lead
//      (Responsible → Accountable), while an empty overlay keeps the baked
//      creation-era fields;
//  (d) selection filters the model (partial flag + only chosen projects);
//  (e) renderDocx builds a packable Word document from the model with the
//      real docx.min.js (the local UMD copy — never CDN).
//
// Run from repo root: `npm test` (or `node tests/master_report.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants ──
const df = fs.readFileSync("dashboard_filters.js", "utf8");
// Session 97: the filter-bar button was retired — the Master Report is now a
// Report-Type option inside the Custom Report modal (report_generator.js),
// which lazy-loads this module and keeps the pre-built docx as the fallback.
check("filter bar: retired Master Report button stays out of dashboard_filters", !/masterReportBtn/.test(df));
const rg = fs.readFileSync("report_generator.js", "utf8");
check("custom report modal: lazy-loads master_report.js via CPL_TABS.loadScript", /loadScript\('master_report\.js', 'CPL_MASTER_REPORT'/.test(rg));
check("custom report modal: drives buildReportModel with the modal's selection", /M\.buildReportModel\(window\.CPL_DATA, pids, live\)/.test(rg));
check("custom report modal: pre-built docx kept as the fallback", /reports\/CPL_Master_Report\.docx/.test(rg));

const SRC = fs.readFileSync("master_report.js", "utf8");
check("master_report.js loads the LOCAL docx.min.js (never a CDN URL)",
  /s\.src = 'docx\.min\.js'/.test(SRC) && !/s\.src = ['"]https?:/.test(SRC));

// ── Fixtures ──
const DATA = {
  last_updated: "July 2, 2026",
  kpis: {
    cumulative_students: { value: "43,321" },
    eligible_units: { value: "601,204" },
    credit_recommendations: { value: "1,241" },
    active_colleges: { value: 88 },
    veteran_sprint: { value: "33,904" },
    estimated_savings: { value: "$46M" },
    twenty_year_impact: { value: "$1.3B" },
  },
  live_updates: {},
  // activity_kpis carries the STORE Activity labels (workplan_goals.name). Here
  // Activity 1's label is deliberately DIFFERENT from every projects[].activity
  // below, so the guard asserts the report title follows the store rename.
  activity_kpis: [
    { activity_id: "Activity 1", activity_name: "Activity 1: RENAMED Infrastructure", kpis: [] },
    { activity_id: "Activity 2", activity_name: "Activity 2: Faculty Workgroups & Credit Recommendations", kpis: [] },
  ],
  projects: [
    { id: "1.1", name: "MAP Platform Development", activity: "Activity 1: AI-Enhanced CPL Infrastructure", status: "On Track", pct: 80, desc: "Platform work", lead: "Old Lead", update: "creation-era update", update_date: "2026-04-01", budget: "$1M", budget_source: "CPL", kpi_metric: "5", kpi_goal_2526: "4", workplan_notes: "wp notes" },
    { id: "5.2", name: "AI Certification-to-Course Matching", activity: "Activity 1: AI-Enhanced CPL Infrastructure", status: "In Progress", pct: 40, desc: "", lead: "", update: "", update_date: "", budget: "", budget_source: "", kpi_metric: "" },
    { id: "2.1", name: "Statewide Credit Recommendations", activity: "Activity 2: Faculty Workgroups & Credit Recommendations", status: "Goal Met", pct: 100, desc: "Recs", lead: "", update: "", update_date: "", budget: "$2M", budget_source: "CPL", kpi_metric: "1,241" },
    { id: "D.1", name: "hidden helper row", activity: "Activity 1: AI-Enhanced CPL Infrastructure", status: "", pct: 0 },
  ],
};

const UPDATE_ROWS = [
  { item_type: "project", item_id: "1.1", body: "Newest live 1.1 update", author: "map@rccd.edu", created_at: "2026-07-01T12:00:00Z" },
  { item_type: "activity", item_id: "1", body: "Activity 1 rolling status", author: "map@rccd.edu", created_at: "2026-06-30T09:00:00Z" },
  { item_type: "project", item_id: "1.1", body: "Older 1.1 update", author: "map@rccd.edu", created_at: "2026-06-20T08:00:00Z" },
];
const RACI_ROWS = [
  { item_type: "project", item_id: "1.1", raci: { R: [{ name: "Malone Dunlavy", email: "m@x.edu" }] } },
  { item_type: "project", item_id: "2.1", raci: { A: [{ name: "Acc Only", email: "a@x.edu" }] } },
];

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_DATA = JSON.parse(JSON.stringify(DATA));
  w.fetch = function (url) {
    if (/item_updates/.test(url)) {
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve(opts.updates || []); } });
    }
    if (/item_raci/.test(url)) {
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve(opts.raci || []); } });
    }
    return Promise.resolve({ ok: false, json: function () { return Promise.resolve([]); } });
  };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

(async function () {
  const w = makeWin({ updates: UPDATE_ROWS, raci: RACI_ROWS });
  const API = w.CPL_MASTER_REPORT;
  check("module exposes CPL_MASTER_REPORT with open()", !!API && typeof API.open === "function");

  // (b) modal: checkbox tree from CPL_DATA
  API.open();
  const doc = w.document;
  const modal = doc.getElementById("masterReportModal");
  check("open() shows the modal", modal && modal.style.display === "block");
  const actCbs = doc.querySelectorAll(".mrpt-activity-cb");
  const projCbs = doc.querySelectorAll(".mrpt-project-cb");
  check("modal renders one checkbox per activity (2)", actCbs.length === 2);
  check("modal renders one checkbox per project (3 — D.* excluded)", projCbs.length === 3);
  check("modal lists the 5.x project cards too", !!doc.querySelector('.mrpt-project-cb[data-pid="5.2"]'));
  check("modal excludes D.* helper rows", !doc.querySelector('.mrpt-project-cb[data-pid="D.1"]'));
  check("all checkboxes start checked", Array.prototype.every.call(projCbs, function (cb) { return cb.checked; }));

  // Select All / Clear All + activity toggle
  const clearBtn = doc.querySelector('.mrpt-sel-btn[data-action="none"]');
  clearBtn.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("Clear All unchecks every project", API._selectedPids().length === 0);
  const allBtn = doc.querySelector('.mrpt-sel-btn[data-action="all"]');
  allBtn.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("Select All re-checks every project", API._selectedPids().length === 3);
  const act1 = doc.querySelector('.mrpt-activity-cb[data-activity="1"]');
  act1.checked = false;
  act1.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("unchecking an activity unchecks its projects", API._selectedPids().join(",") === "2.1");

  // (c) live overlay in buildReportModel
  const live = {
    updates: API.latestByKey(UPDATE_ROWS),
    raci: API.raciByKey(RACI_ROWS),
  };
  check("latestByKey keeps the newest 1.1 row", live.updates["project:1.1"].body === "Newest live 1.1 update");
  const model = API.buildReportModel(w.CPL_DATA, ["1.1", "2.1"], live);
  const act1Model = model.activities.filter(function (a) { return /Activity 1/.test(a.name); })[0];
  const p11 = act1Model.projects[0];
  check("model: live update body overrides the creation-era update", p11.update === "Newest live 1.1 update");
  check("model: live update date is the created_at date part", p11.update_date === "2026-07-01");
  check("model: RACI Responsible becomes the lead", p11.lead === "Malone Dunlavy");
  const act2Model = model.activities.filter(function (a) { return /Activity 2/.test(a.name); })[0];
  check("model: Accountable is the lead fallback when no Responsible", act2Model.projects[0].lead === "Acc Only");
  check("model: activity-level update attached", act1Model.update && act1Model.update.body === "Activity 1 rolling status");
  // Guards the buildActivityDesc key-join fix: the report Activity title must come
  // from the STORE (activity_kpis.activity_name), NOT the stale projects.activity
  // group label. The mock renames Activity 1 only in activity_kpis; before the fix
  // the lookup missed (keyed by the full label) and info was {} → title fell back
  // to projects.activity, so a rename never reached the report.
  check("model: Activity title flows from the store rename (not projects.activity)",
    act1Model.info && act1Model.info.title === "Activity 1: RENAMED Infrastructure");

  // (d) selection filtering
  check("model: only selected projects included", model.selectedCount === 2 && !model.activities.some(function (a) {
    return a.projects.some(function (p) { return p.id === "5.2"; });
  }));
  check("model: partial flag set when a project is left out", model.partial === true);
  const fullModel = API.buildReportModel(w.CPL_DATA, ["1.1", "5.2", "2.1"], { updates: {}, raci: {} });
  check("model: empty overlay keeps the baked creation-era update", (function () {
    const a1 = fullModel.activities.filter(function (a) { return /Activity 1/.test(a.name); })[0];
    const p = a1.projects.filter(function (x) { return x.id === "1.1"; })[0];
    return p.update === "creation-era update" && p.lead === "Old Lead" && fullModel.partial === false;
  })());
  check("model: kpis flattened ({value} unwrapped)", fullModel.kpis.cumulative_students === "43,321");

  // (e) renderDocx with the real local docx UMD build → a packable document
  w.docx = require("../docx.min.js");
  let doc1 = null, threw = false;
  try { doc1 = API.renderDocx(model); } catch (e) { threw = true; }
  check("renderDocx builds a Document without throwing", !threw && !!doc1);
  let packed = null;
  try { packed = await w.docx.Packer.toBuffer(doc1); } catch (e) { packed = null; }
  check("Packer produces a real .docx buffer (>10KB)", !!packed && packed.length > 10000);

  // fetchLiveOverlay: unreachable Supabase → falls back to CPL_DATA.live_updates
  const w2 = makeWin({ updates: [], raci: [] });
  w2.CPL_DATA.live_updates = { "project:1.1": { body: "build-time folded", date: "2026-07-01" } };
  const overlay = await w2.CPL_MASTER_REPORT.fetchLiveOverlay();
  check("fetchLiveOverlay falls back to CPL_DATA.live_updates", overlay.updates["project:1.1"].body === "build-time folded");

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
