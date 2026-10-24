// Session 97 — Custom Report upgrades + filter-bar slim-down guards.
//
// Guards:
//  (a) Elevation: bands map 0→30,000 ft to detail guidance; buildPrompt honors
//      the elevation (Altitude block + high-altitude structure swap);
//  (b) Audience-dynamic titles: every audience carries a distinct title, the
//      prompt forbids the model writing its own title, and the docx title/
//      filename derive from it;
//  (c) MAP naming rule rides every report prompt (never "Military Articulation
//      Platform" outside history; never "MAP Initiative");
//  (d) Master Report consolidation: the modal has the Report Type toggle and
//      dashboard_filters.js no longer injects the retired Master Report /
//      Attach Doc bar buttons;
//  (e) Progress bar replaces the "Generating..." label; model is an
//      unversioned alias (retired-model playbook).
//
// Run from repo root: `npm test` (or `node tests/report_session97.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const rgSrc = fs.readFileSync("report_generator.js", "utf8");
const writerSrc = fs.readFileSync("cpl_writer.js", "utf8");   // static in both HTMLs before the generator
const dfSrc = fs.readFileSync("dashboard_filters.js", "utf8");

// ── Part A — source-pinned invariants ──
check("the model is the writer's: this file names no model and drafts through W.draft under W.system",
  !/claude-[a-z0-9-]+/.test(rgSrc) && /W\.draft\(/.test(rgSrc) && /W\.system\(/.test(rgSrc) && !/CPL_REPORT_PROXY_URL/.test(rgSrc) && !/api\.anthropic\.com/.test(rgSrc));
check("no 'Generating...' button label remains", rgSrc.indexOf("'Generating...'") === -1);
check("dashboard_filters no longer injects the Master Report bar button",
  dfSrc.indexOf("masterReportBtn") === -1);
check("dashboard_filters no longer injects the bar-level Attach Doc button",
  dfSrc.indexOf("attachDocBtn'") === -1 && dfSrc.indexOf('&#128206; Attach Doc') === -1);
const crSrc = fs.readFileSync("college_report_generator.js", "utf8");
check("the college report's model is the writer's: it names no model and drafts through W.draft under W.system",
  !/claude-[a-z0-9-]+/.test(crSrc) && /W\.draft\(/.test(crSrc) && /W\.system\(/.test(crSrc) && !/CPL_REPORT_PROXY_URL/.test(crSrc) && !/api\.anthropic\.com/.test(crSrc));
check("annual report polish composes its system prompt through the writer, which carries the naming rule",
  /W\.system\(/.test(fs.readFileSync("annual_report.js", "utf8")) && /Mapping Articulated Pathways \(MAP\)/.test(writerSrc));
check("master_report docx footer says CPL Initiative (not MAP Initiative)",
  fs.readFileSync("master_report.js", "utf8").indexOf("|  CPL Initiative") >= 0);
check("generate_reports docx footer says CPL Initiative (not MAP Initiative)",
  fs.readFileSync("generate_reports.js", "utf8").indexOf("|  CPL Initiative") >= 0);

// ── Part B — functional (jsdom) ──
const DATA = {
  last_updated: "July 3, 2026",
  kpis: {},
  projects: [
    { id: "1.1", name: "MAP Platform Development", activity: "Activity 1: AI-Enhanced CPL Infrastructure", status: "On Track", pct: 80, desc: "Platform", lead: "L", update: "u", update_date: "2026-07-01" },
  ],
};

function makeWin() {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='filterButtons'></div></body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_DATA = JSON.parse(JSON.stringify(DATA));
  w.fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve([]); } }); };
  const wr = w.document.createElement("script");   // the writer first, as the page loads it
  wr.textContent = writerSrc;
  w.document.body.appendChild(wr);
  const el = w.document.createElement("script");
  el.textContent = rgSrc;
  w.document.body.appendChild(el);
  return w;
}

(function () {
  const w = makeWin();
  const API = w.CPL_CUSTOM_REPORT;
  check("api exposes elevation helpers", typeof API.elevationBand === "function" && Array.isArray(API.ELEVATION_BANDS));

  // (a) elevation bands
  check("0 ft = Ground level", API.elevationBand(0).name === "Ground level");
  check("15,000 ft = Cruising altitude", API.elevationBand(15000).name === "Cruising altitude");
  check("30,000 ft = top band", API.elevationBand(30000).name === "30,000 ft");
  check("guidance carries a word target", /Target length: .*words/.test(API.elevationGuidance(10000)));

  // (b+c) prompt content by elevation
  const base = {
    projects: w.CPL_DATA.projects, activityUpdates: [],
    audience: { label: "Test", title: "Legislative Report", guide: "Test audience." },
    kpis: {}, lastUpdated: "x",
  };
  const low = API.buildPrompt(Object.assign({}, base, { elevation: 0 }));
  check("sea-level prompt carries the Altitude block", low.indexOf("## Altitude") >= 0 && low.indexOf("Ground level") >= 0);
  check("sea-level prompt keeps per-project structure", low.indexOf("Project Highlights") >= 0);
  const high = API.buildPrompt(Object.assign({}, base, { elevation: 30000 }));
  check("30k prompt swaps to Highlights-by-Activity structure",
    high.indexOf("Highlights by Activity") >= 0 && high.indexOf("Project Highlights") === -1);
  check("prompt forbids a model-written title + names the template title",
    high.indexOf('do NOT write a document title') >= 0 && high.indexOf('Legislative Report') >= 0);
  const sys = API.buildSystem();
  check("the system prompt carries the writer's MAP naming rule and house voice; the prompt carries the audience's guidance",
    sys.indexOf("Mapping Articulated Pathways (MAP) platform") >= 0 && sys.indexOf('never call it the "MAP Initiative"') >= 0
    && /house voice/.test(sys) && /professional report/.test(sys) && high.indexOf("Test audience.") >= 0 && high.indexOf("Military Articulation") === -1);
  check("the six report audiences come from the writer, each with a title and guidance",
    API.AUDIENCES === w.CPL_WRITER.REPORT_AUDIENCES && API.AUDIENCES.length === 6 && API.AUDIENCES.every(function (a) { return a.id && a.label && a.title && a.guide; }));

  // (b) audience titles are distinct + complete
  const titles = API.AUDIENCES.map(function (a) { return a.title; });
  check("every audience has a title", titles.every(Boolean));
  check("audience titles are distinct", new Set(titles).size === titles.length);
  check("legislators → Legislative Report",
    API.AUDIENCES.find(function (a) { return a.id === "legislators"; }).title === "Legislative Report");

  // (d+e) modal: report-type toggle, elevation slider, progress bar
  w.openReportModal();
  const doc = w.document;
  check("modal has the Report Type radios (custom+master)",
    doc.querySelectorAll('input[name="reportType"]').length === 2);
  check("modal has the elevation slider (0..30000)",
    !!doc.getElementById("reportElevation")
    && doc.getElementById("reportElevation").getAttribute("max") === "30000");
  check("modal has the progress bar", !!doc.getElementById("reportProgressBar"));
  // master mode hides the narrative-only rows
  const masterRadio = doc.querySelector('input[name="reportType"][value="master"]');
  masterRadio.checked = true;
  masterRadio.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("master mode hides audience + elevation rows",
    doc.getElementById("reportAudienceRow").style.display === "none"
    && doc.getElementById("reportElevationRow").style.display === "none");
  check("master mode relabels the Generate button",
    doc.getElementById("reportGenBtn").textContent === "Generate Master Report");
})();

// ── Part C — the college report drafts through the writer (S461) ──
(function () {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  [writerSrc, crSrc].forEach(function (src) {   // the writer first, as the page loads it
    const el = w.document.createElement("script");
    el.textContent = src;
    w.document.body.appendChild(el);
  });
  const W = w.CPL_WRITER, CR = w.CPL_COLLEGE_REPORT;
  check("college report: the API is exposed", CR && typeof CR.buildSystem === "function" && typeof CR.buildPrompt === "function");
  check("college report: the audiences are the writer's six report audiences", CR.AUDIENCES === W.REPORT_AUDIENCES && CR.AUDIENCES.length === 6);
  const sys = CR.buildSystem();
  check("college report: the system prompt carries the naming rule (c) and the house voice",
    sys.indexOf(W.NAMING_RULE) >= 0 && sys.indexOf(W.HOUSE_VOICE) >= 0 && /Mapping Articulated Pathways \(MAP\) platform/.test(sys));
  const bench = { statewide: { count: 2 }, tiers: { Leading: { count: 1 } } };
  const sel = { colleges: [{ college: "Riverside City College", district: "Riverside", tier: "Leading", students: 10 }], audience: CR.AUDIENCES[1] };
  const prompt = CR.buildPrompt(sel, bench);
  check("college report: the prompt carries the audience's guide and keeps no copy of the naming rule",
    prompt.indexOf(CR.AUDIENCES[1].guide) >= 0 && !/Military Articulation Platform/.test(prompt) && prompt.indexOf("undefined\n") === -1);
  check("college report: a single college titles its update", /Riverside City College CPL Update/.test(prompt));
})();

// ── report ──
let failed = 0;
results.forEach(function (r) {
  console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
  if (!r[1]) failed++;
});
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
