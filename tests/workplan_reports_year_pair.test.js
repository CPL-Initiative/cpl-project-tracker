// The printed reports name the right goal figures (S649) — jsdom + docx test.
//
// Guards two faults, each against the failure mode of the wrong year's figure
// printed:
//  (A) the "2030 Goal ... Stretch" subtitle and the "2030 Stretch" row print the
//      2029-30 stretch (kpi_stretch_2930), never the 2028-29 one. Both differed
//      in CPL_Data.js (22,000 against 40,000) and both docx reports printed the
//      2028-29 figure.
//  (B) every year's cell prints that year's own Current over that year's Goal
//      (kpi_current_<year>: the Annual Goals tab's figure, Sam's ruling
//      sam-annual-goals-every-year-editable-2026-10-19), never one figure beside
//      every year. The summary column and the Custom Report prompt name the fiscal
//      year CPL_DATA.workplan_fy says. A blank year prints the dash; kpi_metric
//      stands in for this year only in a data file with no kpi_current_* key.
//
// The fixture's workplan_fy (2027-28) is deliberately not today's fiscal year,
// so a module that stops reading workplan_fy (and falls back to the date) fails.
//
// Covers master_report.js (rendered with the local docx.min.js, the XML read
// back), generate_reports.js (run end to end in a scratch dir over a fixture
// CPL_Data.js, with `docx` resolved to the same local build) and
// report_generator.js (the prompt, built from the modal's own selection).
// Fixtures only: no figure the cron rewrites.
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

const D = "—";
// ── Fixture (this fiscal year: 2027-28) ──
// 3.9: a Current in three years, a stale kpi_metric (9,999) the old code printed
// beside every year, and two different late stretches.
const P39 = {
  id: "3.9", name: "Futuro Behavioral Healthcare Project",
  activity: "Activity 3: Students Served", status: "In Progress", pct: 40, desc: "",
  lead: "", update: "", update_date: "", budget: "", budget_source: "",
  kpi_metric: "9,999", kpi_unit: "students",
  kpi_goal_2526: "1,000", kpi_goal_2627: "2,000", kpi_goal_2728: "3,000", kpi_goal_2829: "4,000", kpi_goal_2930: "5,000",
  kpi_stretch_2526: "1,500", kpi_stretch_2627: "2,500", kpi_stretch_2728: "3,500", kpi_stretch_2829: "22,000", kpi_stretch_2930: "40,000",
  kpi_current_2526: "1,100", kpi_current_2627: "1,900", kpi_current_2728: "2,700", kpi_current_2829: "", kpi_current_2930: "",
};
// 2.1: a Current for 2025-26 only, equal to its kpi_metric. This year is blank on
// the tab, so the report prints the dash, never last year's 288 under 27-28.
const P21 = {
  id: "2.1", name: "Statewide Credit Recommendations",
  activity: "Activity 2: Faculty Workgroups & Credit Recommendations", status: "On Track", pct: 60, desc: "",
  lead: "", update: "", update_date: "", budget: "", budget_source: "",
  kpi_metric: "288", kpi_unit: "recommendations",
  kpi_goal_2526: "200", kpi_goal_2627: "400", kpi_goal_2728: "600", kpi_goal_2829: "800", kpi_goal_2930: "1,000",
  kpi_stretch_2728: "650", kpi_stretch_2829: "2,200", kpi_stretch_2930: "2,800",
  kpi_current_2526: "288", kpi_current_2627: "", kpi_current_2728: "", kpi_current_2829: "", kpi_current_2930: "",
};
// 2.4: a data file written before the generator carried kpi_current_* at all;
// kpi_metric stands in for this year only.
const P24 = {
  id: "2.4", name: "Older Data File Row",
  activity: "Activity 2: Faculty Workgroups & Credit Recommendations", status: "On Track", pct: 10, desc: "",
  lead: "", update: "", update_date: "", budget: "", budget_source: "",
  kpi_metric: "55", kpi_unit: "",
  kpi_goal_2526: "10", kpi_goal_2627: "20", kpi_goal_2728: "30", kpi_goal_2829: "40", kpi_goal_2930: "50",
};
const DATA = {
  last_updated: "November 14, 2026",
  workplan_fy: "2027-28",
  kpis: {},
  live_updates: {},
  update_log: {},
  activity_kpis: [
    { activity_id: "Activity 2", activity_name: "Activity 2: Faculty Workgroups & Credit Recommendations", kpis: [] },
    { activity_id: "Activity 3", activity_name: "Activity 3: Students Served", kpis: [] },
  ],
  projects: [P21, P24, P39],
};

// What the report must say, and what it said before (or would say if it read
// the wrong year, the wrong stretch, or kpi_metric where the tab shows a blank).
const RIGHT = ["2030 Goal: 5,000  Stretch: 40,000", "1,100/1,000", "1,900/2,000", "2,700/3,000", D + "/4,000",
  D + "/5,000", "288/200", D + "/400", D + "/600", "55/30", D + "/10"];
const WRONG = ["Stretch: 22,000", "9,999/", "288/600", "288/400", "1,900/3,000", "55/10", "55/20"];

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
    M.yearPair(P39, "2526", "2728") === "1,100/1,000" && M.yearPair(P39, "2728", "2728") === "2,700/3,000"
    && M.yearPair(P39, "2829", "2728") === D + "/4,000");
  check("master: this year blank on the tab prints the dash, never last year's figure",
    M.yearPair(P21, "2728", "2728") === D + "/600" && M.yearPair(P21, "2526", "2728") === "288/200");
  check("master: kpi_metric stands in only when the row carries no kpi_current_* key",
    M.yearPair(P24, "2728", "2728") === "55/30" && M.yearPair(P24, "2526", "2728") === D + "/10");
  check("master: workplan_fy '2027-28' reads as '2728'", M.fySuffix("2027-28") === "2728");
  check("master: with no workplan_fy, July 1 starts the year (Nov 2026 -> 2627, Mar 2026 -> 2526)",
    M.fySuffix("", new Date(2026, 10, 14)) === "2627" && M.fySuffix("", new Date(2026, 2, 1)) === "2526");
  check("master: the fiscal year is clamped to the ladder (2031 -> 2930)",
    M.fySuffix("", new Date(2031, 8, 1)) === "2930");

  const model = M.buildReportModel(w.CPL_DATA, ["3.9", "2.1", "2.4"], { updates: {}, raci: {} });
  check("master: the model carries the data file's fiscal year (2728)", model.fy === "2728");
  w.docx = require(DOCX_LIB);
  let mText = "";
  try { mText = docxText(Buffer.from(await w.docx.Packer.toBuffer(M.renderDocx(model)))); } catch (e) { mText = ""; }
  check("master docx: renders and reads back", mText.length > 200);
  RIGHT.forEach(function (s) { check("master docx prints " + JSON.stringify(s), mText.indexOf(s) >= 0); });
  WRONG.forEach(function (s) { check("master docx never prints " + JSON.stringify(s), mText.indexOf(s) < 0); });
  check("master docx: the summary column is headed with the data file's fiscal year (27-28)",
    /\|2030 Goal\|27-28\|Current\|/.test(mText));

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
  check("daily master docx: the summary column is headed with the data file's fiscal year (27-28)",
    /\|2030 Goal\|27-28\|Current\|/.test(gText));
  check("mini report 3.9: the 2030 Stretch row is the 2029-30 stretch",
    /\|2030 Stretch\|40,000\|/.test(mini) && mini.indexOf("22,000") < 0);
  check("mini report 3.9: KPI Current is the data file's fiscal year's Current",
    mini.indexOf("|KPI Current|2,700 students|") >= 0);
  check("mini report 3.9: each year row is that year's pair",
    mini.indexOf("|25-26|1,100/1,000|") >= 0 && mini.indexOf("|27-28|2,700/3,000|") >= 0
    && mini.indexOf("|29-30|" + D + "/5,000") >= 0 && mini.indexOf("9,999") < 0);

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
  // The selection the modal builds from CPL_DATA (every project checked).
  w2.openReportModal();
  const sel = RG.getSelectedData();
  check("prompt: the selection reads the data file's fiscal year", sel && sel.workplanFy === "2027-28");
  const prompt = RG.buildPrompt(Object.assign({ activityUpdates: [] }, sel));
  check("prompt: 3.9 sends this fiscal year's goal, stretch and current",
    prompt.indexOf("Goal 27-28: 3,000 | Stretch: 3,500 | Current 27-28: 2,700") >= 0);
  check("prompt: 2.1's blank year is sent as N/A, never last year's 288",
    prompt.indexOf("Goal 27-28: 600 | Stretch: 650 | Current 27-28: N/A") >= 0);
  check("prompt: a row with no kpi_current_* key falls back to kpi_metric",
    prompt.indexOf("Goal 27-28: 30 | Stretch: N/A | Current 27-28: 55") >= 0);
  check("prompt: no other year's pair is sent as this year's",
    prompt.indexOf("Goal 25-26") < 0 && prompt.indexOf("Goal 26-27") < 0);
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
