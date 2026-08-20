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
// jsdom-heavy files (e.g. cpl_funding.test.js spins up ~60 windows in a loop;
// jsdom's per-window vm contexts are not reclaimable mid-run) can exceed Node's
// default old-space cap and OOM. Give each child a generous, uniform ceiling.
// Files run sequentially (spawnSync blocks), so only one child holds memory at
// a time; the cap only permits growth, it does not reserve, so small files are
// unaffected.
//
// RAISED 8192 -> 12288 on 2026-08-20, because 8 GB had stopped being generous.
// The "~4GB" in the old note was long out of date. Measured on `main`, with
// nothing from any branch: cpl_funding.test.js reaches 7,740 MB by assertion
// 525 of 575 — 94.5% of the old cap — and at that margin it is NOT
// deterministic. Two runs of the identical tree at the identical cap, minutes
// apart: one finished 575/575, the other died on "Ineffective mark-compacts
// near heap limit". Green CI on this file has been partly luck for a while,
// and the next few hundred MB anyone added was going to make it a permanent
// red for reasons unrelated to their change (which is exactly how it
// surfaced — see PR #1268).
//
// 12 GB on a 16 GB runner leaves room for the OS and the runner agent. This
// buys headroom; it does not fix the file. The real fix is to SPLIT
// cpl_funding.test.js — 2,900 lines and ~60 jsdom windows in one process — or
// to find why those windows stay unreclaimable (window.close() alone does not
// do it, which is its own finding). Both are their own piece of work.
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
