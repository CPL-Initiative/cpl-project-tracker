// Funding priority-metric producer (funding/_build_funding_performance.py) —
// run against a SYNTHETIC CustomReport fixture (no real student data) and
// assert the ratified-ADR behaviors:
//  (a) P2/P3 distinct-student counting (dup rows dedupe; sid-less rows count
//      individually; zero-credit rows ignored);
//  (b) exclusions — Test Student / Potential Student rows + MAP test colleges
//      (fork ③: "documented" means actual records);
//  (c) small-cell suppression (<5 → null + *_suppressed, never the number);
//  (d) the college-name join (MAP canonical/alias → funding workbook name via
//      kb/college_short_names.json) + the unmatched bucket;
//  (e) statewide counts computed independently (cross-college dedupe by
//      student id) — deliberately NOT the sum of per-college cells;
//  (f) workflow wiring — the daily run invokes the producer and publishes the
//      artifact (the "built but never committed" failure mode);
//  (g) if the committed artifact exists, it passes the standing PII screens
//      (no small cells, no out-of-domain emails).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_performance.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── synthetic fixture ────────────────────────────────────────────────────────
const COLS = ["College", "Transcribed Credits", "MAP Internal StudentID",
  "Potential Student", "Test Student"];
const rows = [
  ["College of Alameda", "7.5", "S1", "no", "no"],   // p2+p3
  ["College of Alameda", "7.5", "S1", "no", "no"],   // duplicate row → dedupe
  ["College of Alameda", "3",   "S2", "no", "no"],   // p3 only
  ["College of Alameda", "9",   "S3", "no", "yes"],  // Test Student → excluded
  ["College of Alameda", "9",   "S4", "yes", "no"],  // Potential Student → excluded
  ["Ventura College", "6", "V1", "no", "no"],
  ["Ventura College", "6", "V2", "no", "no"],
  ["Ventura College", "6", "V3", "no", "no"],
  ["Ventura College", "6", "V4", "no", "no"],
  ["Ventura College", "6", "V5", "no", "no"],
  ["Ventura College", "6", "V6", "no", "no"],
  ["Ventura College", "8", "S1", "no", "no"],        // SAME student as Alameda → statewide dedupe
  ["Ventura College", "6", "",   "no", "no"],        // sid-less → counts as its own student
  ["Ventura College", "0", "V9", "no", "no"],        // zero credits → ignored
  ["RivTest City College", "9", "T1", "no", "no"],   // test college → excluded
  ["Mystery University", "12", "M1", "no", "no"],    // unresolvable name → unmatched
];
const fixture = [{
  viewName: "View_StudentAggregatedValues_APIDataset",
  generatedAt: "2026-06-11T08:00:00",
  dataCount: rows.length,
  columnName: COLS,
  columnValue: rows,
}];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cplfundperf-"));
const inPath = path.join(tmp, "CustomReport_fixture.json");
const outPath = path.join(tmp, "out.js");
fs.writeFileSync(inPath, JSON.stringify(fixture));

const run = spawnSync("python3",
  ["funding/_build_funding_performance.py", inPath, "--out", outPath],
  { encoding: "utf8" });
check("producer runs cleanly on the fixture", run.status === 0);
if (run.status !== 0) console.error(run.stdout, run.stderr);

let P = null;
try {
  const src = fs.readFileSync(outPath, "utf8");
  P = JSON.parse(src.match(/window\.CPL_FUNDING_PERF = (\{[\s\S]*\});\s*$/)[1]);
} catch (e) { /* assertions below fail visibly */ }

check("artifact parses (window.CPL_FUNDING_PERF)", !!P);
if (P) {
  const ala = P.colleges["Alameda"], ven = P.colleges["Ventura"];
  check("name join: 'College of Alameda' lands on funding name 'Alameda'", !!ala);
  check("name join: 'Ventura College' lands on 'Ventura'", !!ven);
  check("small cells suppress (Alameda p2=1 → null + flag, number never baked)",
    ala && ala.p2 === null && ala.p2_suppressed === true &&
    ala.p3 === null && ala.p3_suppressed === true);
  check("dedupe + sid-less + shared-student counting (Ventura p2=p3=8)",
    ven && ven.p2 === 8 && ven.p3 === 8);
  check("test college excluded entirely",
    !P.colleges["RivTest City College"] && !P.unmatched["RivTest City College"]);
  check("unresolvable college lands in unmatched (suppressed)",
    P.unmatched["Mystery University"] && P.unmatched["Mystery University"].p2 === null);
  check("statewide dedupes the cross-college student (p2=9, p3=10 — not the cell sum)",
    P.statewide.p2 === 9 && P.statewide.p3 === 10);
  check("as_of carries the report date", P.as_of === "2026-06-11");
  check("suppress_below = 5 (ratified ADR)", P.suppress_below === 5);
}

// Graceful no-input behavior: exits 0, touches nothing.
const run2 = spawnSync("python3",
  ["funding/_build_funding_performance.py", path.join(tmp, "missing.json"), "--out", path.join(tmp, "never.js")],
  { encoding: "utf8" });
check("missing input exits 0 without writing", run2.status === 0 && !fs.existsSync(path.join(tmp, "never.js")));

// ── workflow wiring ─────────────────────────────────────────────────────────
const wf = fs.readFileSync(".github/workflows/daily-dashboard.yml", "utf8");
check("daily workflow invokes the producer", wf.indexOf("funding/_build_funding_performance.py") !== -1);
check("daily workflow publishes cpl_funding_performance.js", /git add[^\n]*cpl_funding_performance\.js|cpl_funding_performance\.js[^\n]*\|\| true/.test(wf));

// ── committed-artifact screens (skip until the first cron publishes it) ─────
if (fs.existsSync("cpl_funding_performance.js")) {
  const src = fs.readFileSync("cpl_funding_performance.js", "utf8");
  const live = JSON.parse(src.match(/window\.CPL_FUNDING_PERF = (\{[\s\S]*\});\s*$/)[1]);
  const cells = [];
  Object.values(live.colleges).concat(Object.values(live.unmatched || {})).forEach((r) => {
    cells.push(r.p2, r.p3);
  });
  check("committed artifact: no small cell 1-4 baked",
    cells.every((v) => v === null || v === 0 || v >= live.suppress_below));
  const emails = src.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
  check("committed artifact: no emails", emails.length === 0);
} else {
  check("committed artifact not yet published (first cron pending) — screens skipped", true);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
