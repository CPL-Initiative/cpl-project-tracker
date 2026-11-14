// The printed reports name the right goal figures (S649) — jsdom + docx test.
//
// Guards two faults, each against the failure mode of the wrong year's figure
// printed:
//  (A) the "2030 Goal ... Stretch" subtitle and the "2030 Stretch" row print the
//      2029-30 stretch (kpi_stretch_2930), never the 2028-29 one. Both differed
//      in CPL_Data.js (22,000 against 40,000) and both docx reports printed the
//      2028-29 figure.
//  (B) every year's cell prints that year's own Current over that year's Goal
//      (kpi_current_<year>, Sam's ruling sam-annual-goals-every-year-editable-
//      2026-10-19), never one figure (kpi_metric) beside every year; the summary
//      column and the Custom Report prompt name this fiscal year
//      (CPL_DATA.workplan_fy), and this year falls back to kpi_metric so a row
//      with no per-year Current (a live row before the build stamps it) never
//      goes blank.
//
// Covers master_report.js (rendered with the local docx.min.js, the XML read
// back), generate_reports.js (run end to end in a scratch dir over a fixture
// CPL_Data.js, with `docx` resolved to the same local build) and
// report_generator.js (the prompt). Fixtures only: no figure the cron rewrites.
//
// Run from repo root: `npm test` (or `node tests/workplan_reports_year_pair.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const ROOT = path.resolve(__dirname, "..");
const DOCX_LIB = path.join(ROOT, "docx.min.js");

// The text of every <w:t> run in a .docx buffer, joined with "|".
function docxText(buf) {
  const py = "import sys,zipfile,io,re\n"
    + "z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))\n"
    + "x=z.read('word/document.xml').decode('utf-8')\n"
    + "print('|'.join(re.findall(r'<w:t(?:\\s[^>]*)?>([^<]*)</w:t>', x)))\n";
  const r = spawnSync("python3", ["-c", py], { input: buf, maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout.toString("utf8").replace(/&amp;/g, "&") : "";
}

// ── Fixture ──
// 3.9: a per-year Current for 2025-26 and 2026-27, a stale single kpi_metric
// (9,999) the old code printed beside every year, and two different stretches.
// 2.1: no per-year Current at all, so this fiscal year falls back to kpi_metric.
const P39 = {
  id: "3.9", name: "Futuro Behavioral Healthcare Project",
  activity: "Activity 3: Students Served", status: "In Progress", pct: 40, desc: "",
  lead: "", update: "", update_date: "", budget: "", budget_source: "",
  kpi_metric: "9,999", kpi_unit: "students",
  kpi_goal_2526: "1,000", kpi_goal_2627: "2,000", kpi_goal_2728: "3,000", kpi_goal_2829: "4,000", kpi_goal_2930: "5,000",
  kpi_stretch_2526: "1,500", kpi_stretch_2627: "2,500", kpi_stretch_2728: "3,500", kpi_stretch_2829: "22,000", kpi_stretch_2930: "40,000",
  kpi_current_2526: "1,100", kpi_current_2627: "1,900", kpi_current_2728: "", kpi_current_2829: "", kpi_current_2930: "",
};
const P21 = {
  id: "2.1", name: "Statewide Credit Recommendations",
  activity: "Activity 2: Faculty Workgroups & Credit Recommendations", status: "On Track", pct: 60, desc: "",
  lead: "", update: "", update_date: "", budget: "", budget_source: "",
  kpi_metric: "288", kpi_unit: "recommendations",
  kpi_goal_2526: "200", kpi_goal_2627: "400", kpi_goal_2728: "600", kpi_goal_2829: "800", kpi_goal_2930: "1,000",
  kpi_stretch_2829: "2,200", kpi_stretch_2930: "2,800",
  kpi_current_2526: "", kpi_current_2627: "", kpi_current_2728: "", kpi_current_2829: "", kpi_current_2930: "",
};
const DATA = {
  last_updated: "November 14, 2026",
  workplan_fy: "2026-27",
  kpis: {},
  live_updates: {},
  update_log: {},
  activity_kpis: [
    { activity_id: "Activity 2", activity_name: "Activity 2: Faculty Workgroups & Credit Recommendations", kpis: [] },
    { activity_id: "Activity 3", activity_name: "Activity 3: Students Served", kpis: [] },
  ],
  projects: [P21, P39],
};

// What the report must say, and what it said before.
const RIGHT = ["2030 Goal: 5,000  Stretch: 40,000", "1,100/1,000", "1,900/2,000", "—/3,000", "—/5,000", "288/400", "—/200"];
const WRONG = ["Stretch: 22,000", "9,999/1,000", "9,999/3,000", "288/200", "288/1,000"];

(async function () {
  // ── master_report.js (browser module) ──
  const SRC = fs.readFileSync(path.join(ROOT, "master_report.js"), "utf8");
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_DATA = JSON.parse(JSON.stringify(DATA));
  w.fetch = function () { return Promise.resolve({ ok: false, json: function () { return Promise.resolve([]); } }); };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  const M = w.CPL_MASTER_REPORT;

  check("master: the subtitle names the 2029-30 stretch (40,000), not 2028-29 (22,000)",
    M.goalSubtitle(P39) === "2030 Goal: 5,000  Stretch: 40,000");
  check("master: each year pairs its own Current with its own Goal",
    M.yearPair(P39, "2526", "2627") === "1,100/1,000" && M.yearPair(P39, "2627", "2627") === "1,900/2,000"
    && M.yearPair(P39, "2728", "2627") === "—/3,000");
  check("master: this fiscal year falls back to kpi_metric when no per-year Current is set",
    M.yearPair(P21, "2627", "2627") === "288/400" && M.yearPair(P21, "2526", "2627") === "—/200");
  check("master: workplan_fy '2026-27' reads as '2627'", M.fySuffix("2026-27") === "2627");
  check("master: with no workplan_fy, July 1 starts the year (Nov 2026 -> 2627, Mar 2026 -> 2526)",
    M.fySuffix("", new Date(2026, 10, 14)) === "2627" && M.fySuffix("", new Date(2026, 2, 1)) === "2526");
  check("master: the fiscal year is clamped to the ladder (2031 -> 2930)",
    M.fySuffix("", new Date(2031, 8, 1)) === "2930");

  const model = M.buildReportModel(w.CPL_DATA, ["3.9", "2.1"], { updates: {}, raci: {} });
  check("master: the model carries the fiscal year", model.fy === "2627");
  w.docx = require(DOCX_LIB);
  let mText = "";
  try { mText = docxText(Buffer.from(await w.docx.Packer.toBuffer(M.renderDocx(model)))); } catch (e) { mText = ""; }
  check("master docx: renders and reads back", mText.length > 200);
  RIGHT.forEach(function (s) { check("master docx prints " + JSON.stringify(s), mText.indexOf(s) >= 0); });
  WRONG.forEach(function (s) { check("master docx never prints " + JSON.stringify(s), mText.indexOf(s) < 0); });
  check("master docx: the summary column is headed with this fiscal year (26-27)",
    /\|2030 Goal\|26-27\|Current\|/.test(mText));

  // ── generate_reports.js (daily build) — run in a scratch dir ──
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wp-year-pair-"));
  let gText = "", mini = "";
  try {
    fs.copyFileSync(path.join(ROOT, "generate_reports.js"), path.join(tmp, "generate_reports.js"));
    fs.writeFileSync(path.join(tmp, "CPL_Data.js"), "window.CPL_DATA = " + JSON.stringify(DATA) + ";\n");
    fs.mkdirSync(path.join(tmp, "node_modules", "docx"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "node_modules", "docx", "index.js"),
      "module.exports = require(" + JSON.stringify(DOCX_LIB) + ");\n");
    const run = spawnSync(process.execPath, ["generate_reports.js"], { cwd: tmp, encoding: "utf8" });
    check("generate_reports.js runs over the fixture", run.status === 0);
    const master = path.join(tmp, "reports", "CPL_Master_Report.docx");
    const p39 = path.join(tmp, "reports", "projects", "3.9_Report.docx");
    gText = fs.existsSync(master) ? docxText(fs.readFileSync(master)) : "";
    mini = fs.existsSync(p39) ? docxText(fs.readFileSync(p39)) : "";
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  check("daily master docx: renders and reads back", gText.length > 200);
  RIGHT.forEach(function (s) { check("daily master docx prints " + JSON.stringify(s), gText.indexOf(s) >= 0); });
  WRONG.forEach(function (s) { check("daily master docx never prints " + JSON.stringify(s), gText.indexOf(s) < 0); });
  check("daily master docx: the summary column is headed with this fiscal year (26-27)",
    /\|2030 Goal\|26-27\|Current\|/.test(gText));
  check("mini report 3.9: the 2030 Stretch row is the 2029-30 stretch",
    /\|2030 Stretch\|40,000\|/.test(mini) && mini.indexOf("22,000") < 0);
  check("mini report 3.9: KPI Current is this fiscal year's Current",
    mini.indexOf("|KPI Current|1,900 students|") >= 0);
  check("mini report 3.9: each year row is that year's pair",
    mini.indexOf("|25-26|1,100/1,000|") >= 0 && mini.indexOf("|26-27|1,900/2,000|") >= 0
    && mini.indexOf("|29-30|—/5,000") >= 0 && mini.indexOf("9,999") < 0);

  // ── report_generator.js (Custom Report prompt) ──
  const rgSrc = fs.readFileSync(path.join(ROOT, "report_generator.js"), "utf8");
  const writerSrc = fs.readFileSync(path.join(ROOT, "cpl_writer.js"), "utf8");
  const dom2 = new JSDOM("<!doctype html><html><head></head><body></body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w2 = dom2.window;
  w2.CPL_DATA = JSON.parse(JSON.stringify(DATA));
  w2.fetch = function () { return Promise.resolve({ ok: false, json: function () { return Promise.resolve([]); } }); };
  [writerSrc, rgSrc].forEach(function (s) {
    const e = w2.document.createElement("script"); e.textContent = s; w2.document.body.appendChild(e);
  });
  const RG = w2.CPL_CUSTOM_REPORT;
  const prompt = RG.buildPrompt({
    projects: [P39, P21], activityUpdates: [], audience: { label: "Test", prompt: "Test audience." },
    kpis: {}, lastUpdated: "November 14, 2026", workplanFy: "2026-27",
  });
  check("prompt: 3.9 sends this fiscal year's goal, stretch and current",
    prompt.indexOf("Goal 26-27: 2,000 | Stretch: 2,500 | Current 26-27: 1,900") >= 0);
  check("prompt: 2.1 falls back to kpi_metric for this year's current",
    prompt.indexOf("Goal 26-27: 400 | Stretch: N/A | Current 26-27: 288") >= 0);
  check("prompt: no 2025-26 pair is sent as this year's",
    prompt.indexOf("Goal 25-26") < 0);
  check("fiscalYearPair: with no workplan_fy, today's fiscal year (Nov 2026 -> 26-27)",
    RG.fiscalYearPair(P39, "", new Date(2026, 10, 14)).year === "26-27");

  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
