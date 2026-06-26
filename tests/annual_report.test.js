// Annual Report tab (annual_report.js) — jsdom test.
//
// Guards: (a) Rule 4 + nav button / pane / boot wiring; (b) the module
// assembles the 6-section report from window.CPL_DATA (Exec Summary, Vision
// 2030 & Goals, Activity Progress, Statewide Impact, Spotlights, Looking
// Ahead); (c) live KPI values flow into the draft; (d) the markdown→HTML
// preview renders headings/bold/bullets; (e) editing the textarea updates the
// preview; (f) the AI button is disabled with no proxy; Word/Print present;
// (g) the failure mode — no CPL_DATA.kpis renders a message, no throw.
//
// Run from repo root: `npm test` (or `node tests/annual_report.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav button present", /data-tab="annual-report" role="tab"[^>]*>Annual Report</.test(cpl));
check("tab pane present", /id="tab-annual-report" data-tab="annual-report"/.test(cpl));
check("mount div present", /id="annual-report-root"/.test(cpl));
check("lazy boot wiring present",
  /onActivate\('annual-report'/.test(cpl) &&
  /loadScript\('annual_report\.js', 'CPL_ANNUAL_REPORT'/.test(cpl));

// ── Part B — behavior, loaded into jsdom ──
const SRC = fs.readFileSync("annual_report.js", "utf8");

const DATA = {
  last_updated: "June 26, 2026",
  data_as_of: "June 26, 2026",
  kpis: {
    cumulative_students: { value: "48,132", label: "Cumulative CPL Students" },
    credit_recommendations: { value: "12,527", label: "Credit Recommendations",
      breakdowns: [{ label: "CCC Collaborative", value: "1,304", note: "statewide" },
                   { label: "Local", value: "11,223" }] },
    transcripted_units: { value: "99k", label: "Transcripted Units" },
    estimated_savings: { value: "$58M", label: "Estimated Savings" },
    active_colleges: { value: "116", label: "Active Colleges" },
  },
  vision2030: {
    goals: [
      { id: "Goal 1", name: "Expand Equitable Access", target: "250,000 by 2030", progress: 19, current: "48,132 students" },
      { id: "Goal 2", name: "Unified System", target: "CPL embedded", progress: 55, current: "MAP at 116 colleges" },
      { id: "Goal 3", name: "Sustainable Policies", target: "Faculty-driven", progress: 60, current: "AB 123 chaptered" },
    ],
  },
  activity_kpis: [
    { activity_id: "Activity 1", activity_name: "Activity 1: Build AI-Enhanced CPL Infrastructure",
      kpis: [{ id: "1.1", name: "MAP Platform Development", status: "On Track", pct: 70,
               update: "50+ dev tickets completed", goal_2627: "9", unit: "features" }] },
    { activity_id: "Activity 4", activity_name: "Activity 4: Coordinate Sprints",
      kpis: [{ id: "4.1", name: "Sprints", status: "On Track", pct: 50, update: "Veteran Sprint underway" }] },
  ],
  projects: [
    { id: "4.1.1", name: "Veteran Sprint", desc: "JST credit translation for veterans.", lead: "Crystal Nasio", budget: "$500,000" },
    { id: "5.1", name: "29 Palms Military Base Demonstration", desc: "Base CPL demonstration project.", lead: "Sam Lee" },
  ],
};

function makeDom(data, proxy) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body><div id='annual-report-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (proxy) w.CPL_REPORT_PROXY_URL = proxy;
  if (data) w.CPL_DATA = data;
  w.eval(SRC);
  return dom;
}

(function () {
  const dom = makeDom(DATA);
  const T = dom.window.CPL_ANNUAL_REPORT;
  check("module exposes CPL_ANNUAL_REPORT", !!T && typeof T.boot === "function");

  let threw = false;
  try { T.boot(); } catch (e) { threw = true; }
  check("boot() does not throw", !threw);

  const doc = dom.window.document;
  const md = T._assemble(DATA);

  // (b) all six sections assemble.
  ["## Executive Summary", "## Vision 2030 & Goals", "## Activity Progress",
   "## Statewide Impact", "## Spotlights", "## Looking Ahead"].forEach(function (h) {
    check("section present: " + h, md.indexOf(h) >= 0);
  });

  // (c) live KPI values flow into the draft.
  check("exec summary carries a live KPI value (48,132)", /48,132/.test(md));
  check("statewide impact carries the CCC-collaborative split (1,304)", /1,304/.test(md));
  check("vision section carries a goal target (250,000)", /250,000/.test(md));
  check("activity section carries a sub-activity update", /50\+ dev tickets/.test(md));
  check("spotlight pulls the Veteran Sprint project", /Veteran Sprint/.test(md) && /JST credit/.test(md));

  // (d) markdown → HTML preview.
  const html = T._mdToHtml("## Head\n\n**bold** text\n\n- one\n- two");
  check("mdToHtml renders ## as <h2>", /<h2>Head<\/h2>/.test(html));
  check("mdToHtml renders **x** as <strong>", /<strong>bold<\/strong>/.test(html));
  check("mdToHtml renders - bullets as <li>", /<li>one<\/li>/.test(html) && /<ul>/.test(html));

  // (d2) the rendered tab shows a preview with an <h2>.
  check("preview rendered into the tab", !!doc.querySelector(".car-preview h2"));
  const ta = doc.querySelector(".car-edit");
  check("editable textarea present + prefilled", !!ta && /Executive Summary/.test(ta.value));

  // (e) editing the textarea updates the preview live.
  if (ta) {
    ta.value = "## Brand New Section\n\nhello";
    ta.dispatchEvent(new dom.window.Event("input"));
    check("editing the textarea updates the preview",
      /Brand New Section/.test(doc.querySelector(".car-preview").innerHTML));
  }

  // (f) toolbar: AI disabled with no proxy; Word + Print present.
  const btns = Array.prototype.map.call(doc.querySelectorAll(".car-btn"), function (b) { return b.textContent; });
  const aiBtn = Array.prototype.filter.call(doc.querySelectorAll(".car-btn"), function (b) { return /AI polish/.test(b.textContent); })[0];
  check("AI polish button disabled when no proxy configured", !!aiBtn && aiBtn.disabled);
  check("Word + Print + Rebuild buttons present",
    btns.some(function (t) { return /Word/.test(t); }) &&
    btns.some(function (t) { return /Print/.test(t); }) &&
    btns.some(function (t) { return /Rebuild/.test(t); }));

  // (f2) AI button enabled when a proxy IS configured.
  const dom2 = makeDom(DATA, "https://cpl-proxy.example.workers.dev");
  dom2.window.CPL_ANNUAL_REPORT.boot();
  const ai2 = Array.prototype.filter.call(dom2.window.document.querySelectorAll(".car-btn"), function (b) { return /AI polish/.test(b.textContent); })[0];
  check("AI polish button enabled when proxy configured", !!ai2 && !ai2.disabled);

  // (g) failure mode: no kpis → graceful message, no throw.
  const dom3 = makeDom({ projects: [] });
  let threw3 = false;
  try { dom3.window.CPL_ANNUAL_REPORT.boot(); } catch (e) { threw3 = true; }
  check("no-data boot does not throw", !threw3);
  check("no-data renders a graceful message", /still loading|Dashboard tab/.test(dom3.window.document.body.textContent));

  let failed = 0;
  for (const [name, ok] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + name);
    if (!ok) failed++;
  }
  console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
  process.exit(failed === 0 ? 0 : 1);
})();
