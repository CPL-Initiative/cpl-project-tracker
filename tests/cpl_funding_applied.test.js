// Applied Credits (`pa` / `pa_u`) in the funding actuals producer
// (funding/_build_funding_performance.py), added 2026-08-01 per Sam.
//
// WHY THIS METRIC EXISTS. MAP's credit funnel is eligible -> APPLIED ->
// transcribed. P1 was scored on ELIGIBLE, which is wrong twice over:
//   1. Eligible is inflated upstream and we cannot fix it — ACE JST exhibits
//      repeat a credit recommendation under every skill level, so a USMC
//      veteran's eligibility multiplies (map_data_quality 10ad9e0a, high/open).
//      Our own arithmetic is sound; the SOURCE figure is the inflated one.
//   2. Eligible measures OPPORTUNITY, not performance — 98 of 102 colleges
//      clear an eligible-based target, median 42x.
// Applying credit is an action the college takes, once per student, so it
// carries neither problem.
//
// THE FAILURE MODE THIS FILE GUARDS. `pa` must be OMITTED — not emitted as
// zeros — when the pull carries no "Applied Credits" column. earnFraction()
// reads a present-but-zero cell as "feed published, this college posted
// nothing" and pays $0; a column we never asked for would therefore zero out
// every college in the state. Absent keys are the honest shape for absent data.
// (Same family as docs/kb-notes/methodology-a-default-payout-masks-the-gap-
// beneath-it.md, in the opposite direction: here the silent default is $0, not
// a full advance.)
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_applied.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cplfundapplied-"));

function build(columnName, columnValue, extraReports) {
  const inPath = path.join(tmp, "in-" + Math.random().toString(36).slice(2) + ".json");
  const outPath = inPath.replace(/\.json$/, ".js");
  fs.writeFileSync(inPath, JSON.stringify([{
    viewName: "View_StudentAggregatedValues_APIDataset",
    generatedAt: "2026-08-01T08:00:00",
    dataCount: columnValue.length,
    columnName: columnValue.length ? columnName : columnName,
    columnValue: columnValue,
  }].concat(extraReports || [])));
  const run = spawnSync("python3",
    ["funding/_build_funding_performance.py", inPath, "--out", outPath],
    { encoding: "utf8" });
  if (run.status !== 0) { console.error(run.stdout, run.stderr); return { run: run, P: null }; }
  let P = null;
  try {
    P = JSON.parse(fs.readFileSync(outPath, "utf8")
      .match(/window\.CPL_FUNDING_PERF = (\{[\s\S]*\});\s*$/)[1]);
  } catch (e) { /* assertions fail visibly */ }
  return { run: run, P: P };
}

// ── A. Applied Credits PRESENT ───────────────────────────────────────────────
const COLS_A = ["College", "Transcribed Credits", "MAP Internal StudentID",
  "Potential Student", "Test Student", "Eligible Credits", "Applied Credits"];
const rowsA = [
  // Alameda: 6 distinct applied students (clears the <5 suppression floor).
  //   A1 eligible 30 / applied 12 / transcribed 3  -> pe, pa, p3
  //   A1 duplicate row                             -> deduped, units counted ONCE
  ["College of Alameda", "3", "A1", "no", "no", "30", "12"],
  ["College of Alameda", "3", "A1", "no", "no", "30", "12"],
  ["College of Alameda", "0", "A2", "no", "no", "20", "8"],   // eligible+applied, not transcribed
  ["College of Alameda", "0", "A3", "no", "no", "20", "8"],
  ["College of Alameda", "0", "A4", "no", "no", "20", "8"],
  ["College of Alameda", "0", "A5", "no", "no", "20", "8"],
  ["College of Alameda", "0", "A6", "no", "no", "20", "8"],
  ["College of Alameda", "0", "A7", "no", "no", "40", "0"],   // eligible ONLY -> pe, not pa
  ["College of Alameda", "9", "A8", "no", "yes", "9", "9"],   // Test Student -> excluded
  ["College of Alameda", "9", "A9", "yes", "no", "9", "9"],   // Potential -> pp lane, not pa
  // Ventura: 2 applied students -> below SUPPRESS_BELOW, must null out.
  ["Ventura College", "0", "V1", "no", "no", "10", "5"],
  ["Ventura College", "0", "V2", "no", "no", "10", "5"],
];
const A = build(COLS_A, rowsA);
check("A: producer runs cleanly with Applied Credits present", A.P !== null);

if (A.P) {
  const al = A.P.colleges["Alameda"] || {};
  const ven = A.P.colleges["Ventura"] || {};
  check("A: pa counts distinct students with applied > 0 (A1-A6 = 6)", al.pa === 6);
  check("A: pa_u sums applied units over exactly those students (12 + 8x5 = 52)",
    Math.abs((al.pa_u || 0) - 52) < 0.01);
  check("A: a duplicate row does not double-count pa_u", (al.pa_u || 0) < 60);
  check("A: eligible-only student counts in pe but NOT pa (pe 7 > pa 6)",
    al.pe === 7 && al.pa === 6);
  check("A: Test Student excluded from pa", al.pa === 6);
  check("A: Potential Student routed to pp, not pa", al.pa === 6 && (A.P.statewide.pp || 0) >= 1);
  check("A: pa is <5-suppressed like the other real-student metrics",
    ven.pa === null && ven.pa_suppressed === true);
  check("A: a suppressed pa nulls its unit sum too (privacy keys off the COUNT)",
    ven.pa_u === null && ven.pa_u_suppressed === true);
  check("A: statewide carries pa and pa_u", typeof A.P.statewide.pa === "number"
    && typeof A.P.statewide.pa_u === "number");
  check("A: statewide pa_u is the plain sum of per-college sums (52 + 10)",
    Math.abs((A.P.statewide.pa_u || 0) - 62) < 0.01);
  check("A: the funnel orders correctly at statewide grain (eligible >= applied >= transcribed)",
    A.P.statewide.pe_u >= A.P.statewide.pa_u && A.P.statewide.pa_u >= A.P.statewide.p3_u);
  check("A: basis string documents PA", /PA = any APPLIED CPL units/.test(A.P.basis || ""));
}

// ── B. Applied Credits ABSENT — the load-bearing case ────────────────────────
// Same rows, minus the Applied column. `pa` must be ENTIRELY ABSENT, never 0.
const COLS_B = COLS_A.slice(0, 6);
const rowsB = rowsA.map((r) => r.slice(0, 6));
const B = build(COLS_B, rowsB);
check("B: producer still runs cleanly without an Applied Credits column", B.P !== null);

if (B.P) {
  const al = B.P.colleges["Alameda"] || {};
  check("B: pa key is ABSENT, not 0 — a present zero would pay every college $0",
    !("pa" in al));
  check("B: pa_u key is ABSENT too", !("pa_u" in al));
  check("B: statewide omits pa / pa_u", !("pa" in B.P.statewide) && !("pa_u" in B.P.statewide));
  // p3 is legitimately `null` here (one transcribed student, <5 suppression) —
  // assert the KEY is still produced, not that it holds a number.
  check("B: the existing metrics are untouched by the pa addition",
    al.pe === 7 && Math.abs(al.pe_u - 170) < 0.01 && "p3" in al && "pp" in al);
  check("B: the run says so out loud rather than failing silently",
    /Applied Credits' not in this pull/.test(B.run.stdout || ""));
}

// ── C. the unit cross-check covers pa_u when it exists ───────────────────────
// MAP publishes its own per-college Applied total, so our sum gets the same
// independent verification the other two units already have.
const XVIEW = {
  viewName: "View_CreditDistributionByCollege_APIDataset",
  generatedAt: "2026-08-01T08:00:00",
  dataCount: 1,
  columnName: ["College", "Eligible Credits", "Transcribed Credits", "Applied Credits"],
  // BOTH funding colleges must appear — `ours` sums every college we resolved,
  // so a partial MAP fixture would read as a real grain gap.
  columnValue: [["College of Alameda", "190", "3", "52"],
                ["Ventura College", "20", "0", "10"]],
};
const C = build(COLS_A, rowsA, [XVIEW]);
check("C: producer runs with the cross-check view present", C.P !== null);
if (C.P && C.P.unit_crosscheck) {
  const xc = C.P.unit_crosscheck;
  check("C: cross-check reports pa_u alongside pe_u and p3_u",
    "pa_u" in (xc.ours || {}) && "pa_u" in (xc.map || {}));
  check("C: our pa_u matches MAP's published Applied total on the fixture",
    Math.abs((xc.ratio || {}).pa_u - 1) < 0.001);
} else {
  check("C: cross-check emitted", false);
}

// D. absent-column run must not emit a pa_u cross-check key either.
const D = build(COLS_B, rowsB, [XVIEW]);
if (D.P && D.P.unit_crosscheck) {
  check("D: cross-check omits pa_u when we produced none",
    !("pa_u" in (D.P.unit_crosscheck.ours || {})));
} else {
  check("D: cross-check emitted on the absent-column run", false);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
