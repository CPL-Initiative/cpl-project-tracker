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
for (const f of files) {
  console.log("\n──────── " + f + " ────────");
  const r = spawnSync("node", ["--max-old-space-size=12288", path.join(dir, f)], { stdio: "inherit" });
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
}

console.log("\n════════════════════════════════════");
console.log(failed === 0
  ? `All ${files.length} test file(s) passed.`
  : `${failed} of ${files.length} test file(s) FAILED:`);
failures.forEach((f) => console.log("  ✗ " + f));
process.exit(failed === 0 ? 0 : 1);
