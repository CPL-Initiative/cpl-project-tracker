// Minimal test runner — runs every tests/*.test.js in its own child process
// and exits non-zero if any fail. Each test file is a standalone script that
// prints PASS/FAIL lines and exits 0 (all passed) or 1 (any failed).
//
//   npm test            # all tests
//   node tests/run.js   # same
//
// Adding a test = drop a `tests/<name>.test.js` that exits non-zero on failure.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter((f) => f.endsWith(".test.js"))
  .sort();

if (!files.length) {
  console.log("No tests found in tests/.");
  process.exit(0);
}

let failed = 0;
// Name the files that failed, in the SUMMARY at the end (2026-08-20).
// "1 of 231 test file(s) FAILED" says nothing about which one, and the runner
// prints every file's output inline — so on CI, where only the tail of a
// ~400k-character log is retrievable, finding the failure meant inferring it by
// elimination. Recording the exit status matters as much as the name: a child
// killed by an out-of-memory abort exits 134 having printed no FAIL line at
// all, which reads exactly like a silent assertion failure until you know to
// look for it.
const failures = [];
// jsdom-heavy files can exceed Node's default old-space cap and OOM. Give each
// child a generous, uniform ceiling. Files run sequentially (spawnSync blocks),
// so only one child holds memory at a time; the cap only permits growth, it does
// not reserve, so small files are unaffected.
//
// RAISED 8192 -> 12288 on 2026-08-20, because 8 GB had stopped being generous:
// cpl_funding.test.js reached 7,740 MB by assertion 525 of 575, and at that
// margin it was NOT deterministic — two runs of the identical tree at the
// identical cap, minutes apart, one finished and one died on "Ineffective
// mark-compacts near heap limit". Green CI on that file had been partly luck,
// and the next few hundred MB anyone added was going to turn it into a
// permanent red for reasons unrelated to their change (which is exactly how it
// surfaced — see PR #1268).
//
// The cap is HEADROOM, not the fix. The fix landed the same day: that file was
// split into nine suites (cpl_funding_shell/render/rollup/equity/scenarios/
// earning/rate/rural/pool), peak 8,642 MB -> 2,393 MB, same 575 assertions.
// Why splitting is the ONLY fix, measured rather than assumed: a booted funding
// window retains ~44 MB and is never released for the rest of the run, and
// nothing inside the file can release it — window.close() is a no-op here, and
// heap snapshots show the windows rooted first from "(Stack roots)" (the
// suite's own still-running top-level frame) and then, once that root is
// removed, from "(Micro tasks)" (a promise reaction holding boot()'s
// onDOMContentLoad closure, on a queue a long synchronous script never drains).
// The only thing that reclaims a window is the PROCESS ENDING — which is what
// this runner already gives every file. So peak memory is set by the number of
// windows in the LARGEST file, and the lever is how many windows that file has.
// Budget when adding: ~44 MB per booted window over a ~40 MB floor; past ~15
// windows, start a new suite. Details: tests/lib/cpl_funding_harness.js and
// docs/kb-notes/methodology-a-test-file-is-a-memory-budget.md.
// Exit status answers "did anything fail?". It does not answer "did everything
// RUN?" — and a check that stops registering is invisible to it, because a
// missing check subtracts from BOTH sides of the ratio and every run still
// reads "all passed". That gap is this repo's most-repeated lesson (four
// `cpl_memory` rows, three test harnesses, none of it enforced), so the runner
// now also reads the count each file reports about itself and compares it with
// a recorded floor. See tests/lib/check_ledger.js for the measurement.
const ledgerLib = require("./lib/check_ledger.js");
const UPDATE = process.argv.includes("--update-floor");
const ledger = ledgerLib.loadLedger();
const observedCounts = {};
const dropped = [];
const unfloored = [];
const unparsed = [];

for (const f of files) {
  console.log("\n──────── " + f + " ────────");
  // Captured rather than inherited so the summary line can be read back. The
  // child's output is written straight through, so the log is unchanged.
  const r = spawnSync("node", ["--max-old-space-size=12288", path.join(dir, f)],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "") + (r.stderr || "");
  process.stdout.write(out);
  if (r.status !== 0) {
    failed++;
    // A V8 heap-limit abort surfaces EITHER as exit 134 or as SIGABRT
    // depending on how the child died — say "out of memory" for both, because
    // that hint is the whole point of printing the status.
    const oom = r.status === 134 || r.signal === "SIGABRT";
    failures.push(f + (r.signal ? " — killed by " + r.signal : " — exit " + r.status) +
      (oom ? " (out of memory — raise the cap or make the file hold less)" : ""));
    console.log("──────── ✗ FAILED: " + f + " ────────");
  }

  const observed = ledgerLib.reportedTotal(out);
  observedCounts[f] = observed;
  // A file that already failed is not also judged on its count: a file that
  // exits 1 usually stops early, so its total is a consequence of the failure,
  // not a second defect. Reporting both would double-count one problem.
  if (r.status === 0) {
    const v = ledgerLib.classify(f, observed, ledger);
    if (v.state === "dropped" || v.state === "lost-count") {
      failed++;
      const detail = v.state === "lost-count"
        ? "printed no readable check count (it used to report " + v.floor + ")"
        : "ran " + v.observed + " checks, floor is " + v.floor +
          " — " + (v.floor - v.observed) + " check(s) stopped running";
      dropped.push(f + " — " + detail);
      failures.push(f + " — " + detail);
      console.log("──────── ✗ FAILED: " + f + " (check count fell) ────────");
    } else if (v.state === "unfloored") {
      unfloored.push(f);
    } else if (v.state === "unparsed") {
      unparsed.push(f);
    }
  }
}

if (UPDATE) {
  // Deliberate re-baseline. A file that prints no readable count is stored as
  // null rather than omitted, so the unprotected set stays countable.
  const next = {};
  for (const f of files) next[f] = observedCounts[f];
  const p = ledgerLib.writeLedger(next, "Re-baselined by `npm run test:floor`.");
  const floored = files.filter((f) => next[f] !== null).length;
  console.log("\n════════════════════════════════════");
  console.log("Check floor written: " + p);
  console.log("  " + floored + " of " + files.length + " file(s) floored; " +
    (files.length - floored) + " print no readable count.");
  console.log("  Review the diff before committing — a LOWER floor is a check that stopped running.");
  process.exit(failed === 0 ? 0 : 1);
}

console.log("\n════════════════════════════════════");
console.log(failed === 0
  ? `All ${files.length} test file(s) passed.`
  : `${failed} of ${files.length} test file(s) FAILED:`);
failures.forEach((f) => console.log("  ✗ " + f));
if (dropped.length) {
  console.log("\n" + dropped.length + " file(s) ran FEWER checks than recorded. A check that stops");
  console.log("registering can never fail, so this is a rule that silently stopped being");
  console.log("enforced. Find why it stopped; if the drop is intended (a test was removed or");
  console.log("merged), re-baseline with `npm run test:floor` so the diff shows the loss.");
}
if (unfloored.length) {
  console.log("\n" + unfloored.length + " file(s) have no recorded floor yet (not a failure) — " +
    "run `npm run test:floor`:");
  unfloored.slice(0, 10).forEach((f) => console.log("  · " + f));
  if (unfloored.length > 10) console.log("  · …and " + (unfloored.length - 10) + " more");
}
if (unparsed.length) {
  console.log("\n" + unparsed.length + " file(s) print no readable check count, so their checks are " +
    "NOT protected against silently disappearing. Printing a final " +
    "`N/M checks passed` line brings a file under the floor.");
}
process.exit(failed === 0 ? 0 : 1);
