// Funding priority-metric producer (funding/_build_funding_performance.py) —
// run against a SYNTHETIC CustomReport fixture (no real student data) and
// assert the ratified-ADR behaviors:
//  (a) P2/P3 distinct-student counting (dup rows dedupe; sid-less rows count
//      individually; zero-credit rows ignored);
//  (b) exclusions — Test Student / Potential Student rows + MAP test colleges
//      (fork ③: "documented" means actual records);
//  (c) small-cell suppression (<10 → null + *_suppressed, never the number;
//      the floor rose 5 → 10 on 2026-09-03, Sam's under-10 ruling, and a lone
//      masked college drags the smallest visible one down with it);
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
  "Potential Student", "Test Student", "Eligible Credits"];
const rows = [
  ["College of Alameda", "7.5", "S1", "no", "no", "0"],   // p2+p3
  ["College of Alameda", "7.5", "S1", "no", "no", "0"],   // duplicate row → dedupe
  ["College of Alameda", "3",   "S2", "no", "no", "0"],   // p3 only
  ["College of Alameda", "9",   "S3", "no", "yes", "0"],  // Test Student → excluded
  ["College of Alameda", "9",   "S4", "yes", "no", "0"],  // Potential Student → excluded
  ...Array.from({ length: 10 }, (_, i) =>
    ["Ventura College", "6", "V" + (i + 1), "no", "no", "0"]),   // V1..V10 clear the floor of 10
  ["Ventura College", "8", "S1", "no", "no", "0"],        // SAME student as Alameda → statewide dedupe
  ["Ventura College", "6", "",   "no", "no", "0"],        // sid-less → counts as its own student
  ["Ventura College", "0", "V99", "no", "no", "0"],       // zero credits → ignored
  // A SECOND masked college beside Alameda: with exactly one masked cell per
  // metric the builder also masks the smallest visible college (complementary
  // masking), which would take a suffix-join college below and turn a join
  // assertion into a suppression one.
  ["Bakersfield College", "6", "K1", "no", "no", "0"],
  ["Bakersfield College", "6", "K2", "no", "no", "0"],
  ["RivTest City College", "9", "T1", "no", "no", "0"],   // test college → excluded
  ["Mystery University", "12", "M1", "no", "no", "0"],    // unresolvable name → unmatched
  // Noncredit FEEDER campuses (F1 = eligible headcount; not funding colleges).
  ...Array.from({ length: 10 }, (_, i) =>
    ["North Orange Continuing Education", "0", "F" + (i + 1), "no", "no", String(2 + (i % 5))]),  // NOCE eligible, F1..F10
  ["North Orange Continuing Education", "0", "F5", "no", "no", "2"],   // dup → dedupe
  ["North Orange Continuing Education", "9", "FP", "yes", "no", "3"],  // Potential → excluded from F1
  ["Calbright College", "0", "C1", "no", "no", "3"],                    // Calbright pe=2 → suppressed
  ["Calbright College", "0", "C2", "no", "no", "3"],
  // Institutional-suffix variance, in BOTH directions (2026-07-31). MAP and the
  // funding workbook disagree on "X College" vs "X Community College", so a
  // single canonical spelling per college matched neither reliably and 4 real
  // colleges were landing in `unmatched` — reading as "posted nothing" once
  // front-load removed the Year-2 advance that had been masking it.
  //   workbook "Barstow College"                <- MAP "Barstow Community College"
  //   workbook "Lassen Community College"       <- MAP "Lassen College"
  ...Array.from({ length: 10 }, (_, i) =>
    ["Barstow Community College", "6", "B" + i, "no", "no", "3"]),
  ...Array.from({ length: 10 }, (_, i) =>
    ["Lassen College", "6", "L" + i, "no", "no", "3"]),
  // The workbook name is "LA Swest" but the short-names entry's `short` is
  // "LA Southwest" (the CAPS form is "LA SWEST") — matching on `short` alone
  // skipped the entry outright, so this college could never join.
  ...Array.from({ length: 10 }, (_, i) =>
    ["Los Angeles Southwest College", "6", "W" + i, "no", "no", "3"]),
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
  check("dedupe + sid-less + shared-student counting (Ventura p2=p3=12)",
    ven && ven.p2 === 12 && ven.p3 === 12);
  check("a second masked college (Bakersfield p3=2) keeps Alameda from being the lone masked cell",
    P.colleges["Bakersfield"] && P.colleges["Bakersfield"].p3 === null &&
    P.colleges["Bakersfield"].p3_suppressed === true && !ven.p3_complementary);
  check("test college excluded entirely",
    !P.colleges["RivTest City College"] && !P.unmatched["RivTest City College"]);
  check("unresolvable college lands in unmatched (suppressed)",
    P.unmatched["Mystery University"] && P.unmatched["Mystery University"].p2 === null);
  // Statewide is computed independently (union of student ids), NOT the sum of
  // the per-college cells — S1 appears at both Alameda and Ventura and must be
  // counted once. Alameda S1 (1) + Ventura V1..V10 + sid-less (11) + Barstow /
  // Lassen / LA Swest (30) + Bakersfield (2) + Mystery (1) = 45; p3 adds S2.
  check("statewide dedupes the cross-college student (p2=45, p3=46 — not the cell sum)",
    P.statewide.p2 === 45 && P.statewide.p3 === 46);
  check("as_of carries the report date", P.as_of === "2026-06-11");
  check("suppress_below = 10 (Sam's under-10 ruling, 2026-09-03; ADR adr-funding-counts-mask-under-10-units-carry-the-money)",
    P.suppress_below === 10);
  // F1 — noncredit feeder eligible headcount, keyed by feeder short name.
  check("feeder F1: NOCE eligible headcount = 10 (distinct; dup deduped, Potential excluded)",
    P.feeders && P.feeders["NOCE"] && P.feeders["NOCE"].pe === 10);
  check("feeder F1: a small feeder cell (<10) suppresses (Calbright pe=2 → null + flag)",
    P.feeders["Calbright"] && P.feeders["Calbright"].pe === null && P.feeders["Calbright"].pe_suppressed === true);
  check("feeder campuses do NOT leak into the unmatched bucket",
    !P.unmatched["North Orange Continuing Education"] && !P.unmatched["Calbright College"]);
  // ── suffix-tolerant college join (2026-07-31) ────────────────────────────
  check("join: MAP 'Barstow Community College' -> workbook 'Barstow College'",
    !!P.colleges["Barstow"] && P.colleges["Barstow"].p3 === 10);
  check("join: MAP 'Lassen College' -> workbook 'Lassen Community College' (other direction)",
    !!P.colleges["Lassen"] && P.colleges["Lassen"].p3 === 10);
  check("join: MAP 'Los Angeles Southwest College' -> workbook 'LA Swest' (via short_caps)",
    !!P.colleges["LA Swest"] && P.colleges["LA Swest"].p3 === 10);
  check("join: none of the suffix variants leak into unmatched",
    !P.unmatched["Barstow Community College"] && !P.unmatched["Lassen College"] &&
    !P.unmatched["Los Angeles Southwest College"]);
  // The fallback must ADD matches without inventing them: a genuinely unknown
  // institution still has to land in unmatched.
  check("join: a genuinely unknown name is still NOT force-matched",
    !P.colleges["Mystery University"] && !!P.unmatched["Mystery University"]);
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
  check("committed artifact: no count under its own floor baked",
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
