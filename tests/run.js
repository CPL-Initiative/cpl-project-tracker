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
const { spawn } = require("child_process");

// Peak RSS measured 2026-08-28 by polling VmHWM per child, because the cap has
// to come from what the files actually use rather than from the core count —
// memory is what binds here, not CPU. What the numbers showed:
//
//   cpl_funding_render        3,825 MB   <- a single outlier
//   cpl_funding_lane_switch   2,147 MB
//   cpl_funding_cpl_ftes      2,064 MB
//   cpl_funding_equity        1,927 MB
//   admin_tab                   258 MB   <- a typical file
//
// The first model here was `N x worst-file`, which said 3 concurrent needed
// 11.5 GB and forced the cap down to 2. That was wrong: only ONE file is 3.8 GB
// and the rest of the heavy family sits near 2.1 GB, so the real worst case is
// "one outlier plus (N-1) heavy" — 9.9 GB at N=4, on a 16 GB runner.
const TYPICAL_HEAVY_MB = 2200;   // the cpl_funding_* family, minus the outlier
const OUTLIER_EXTRA_MB = 1700;   // what the one 3.8 GB file costs above that

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
// child a generous, uniform ceiling. ⚠️ Files ran SEQUENTIALLY when this was
// written, so only one child held memory at a time; since 2026-08-28 up to
// CONCURRENCY children run at once, so the relevant budget is now
// CONCURRENCY x peak-RSS against the runner's RAM, not one file's peak. The cap
// only permits growth, it does not reserve, so small files are unaffected.
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

// ─── execution ────────────────────────────────────────────────────────────
// Files run CONCURRENTLY, each still in its own process. The isolation is not
// new — it is what this runner has always done, and it is what makes running
// them at the same time safe: the only thing that reclaims a jsdom window is
// the process ending, so one file can never leak into another.
//
// Why it was worth doing (measured 2026-08-28, every file timed individually):
// the suite is 280 files / 1,245s, and `cpl_funding_*` is 28 of those files and
// 967s of that time — 78%. So "serialize the heavy family, parallelize the
// rest" is bounded at 967s no matter how many workers you add; the heavy files
// have to run alongside each other or nothing improves. That makes MEMORY the
// gating constraint rather than scheduling, which is why the cap below is
// chosen from measured peak RSS and not from the core count.
//
// EXECUTION is parallel; BOOKKEEPING below is untouched — it still walks
// `files` in alphabetical order, prints each file's output as one unbroken
// block, and applies the check-ledger exactly as before. The log a human reads
// and the exit status are identical to the serial runner's.
const os = require("os");
// Concurrency limiting lives in tests/lib/limiter.js so it can be tested —
// run.js executes the suite on load, so nothing can require it. A limiter that
// leaks a slot runs unbounded (an OOM); one that fails to release deadlocks (a
// hung job with no output). See that file for why it is a limiter, not a pool.
const { makeLimiter } = require("./lib/limiter.js");
const CONCURRENCY = (() => {
  const raw = process.env.TEST_CONCURRENCY;
  if (raw) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  // Derived, not guessed. An OOM'd child reads as a TEST FAILURE, so trading a
  // slow green for an intermittent red is strictly worse than being slow — and
  // this repo has been there: the 12 GB cap exists because a funding file hit
  // 7,740 MB and "green CI on that file had been partly luck".
  //
  // Budget against the RAM the machine actually has, keeping 25% back for the
  // OS, this parent, and the fact that a peak is a measurement rather than a
  // promise; then reserve the outlier's extra so one 3.8 GB file in the mix is
  // always covered. A 16 GB runner yields 4; a smaller machine degrades to 2 or
  // 1 on its own rather than dying. Override with TEST_CONCURRENCY.
  const usableMB = (os.totalmem() / (1024 * 1024)) * 0.75 - OUTLIER_EXTRA_MB;
  const byMemory = Math.floor(usableMB / TYPICAL_HEAVY_MB);
  return Math.max(1, Math.min(byMemory, os.cpus().length, 4));
})();

// ⚠️ Children write to a temp FILE, not a pipe, and this is not a detail.
//
// `console.log` to a PIPE is asynchronous in Node, so a script that ends in
// `process.exit()` discards whatever is still sitting in its stdout buffer. The
// old `spawnSync` runner never saw this: the parent was blocked, so the OS pipe
// filled, and the child blocked on write instead of getting ahead. Draining the
// pipe from an async parent removes that back-pressure — the child races ahead,
// buffers, and exits with output still unwritten.
//
// It cost a real failure before it was understood. In the first full parallel
// run `cip_crosswalk.test.js` reported 178 of its 354 assertions and the
// check-ledger called it "178 checks ran, floor is 354 — 176 stopped running".
// The assertions had all run; only the report of them was cut off. Four copies
// run concurrently WITH THEIR OUTPUT REDIRECTED TO FILES all printed 354/354,
// which is what isolated the pipe as the cause rather than contention.
//
// Writes to a file descriptor are synchronous, so `process.exit()` cannot
// truncate them. That restores exactly the completeness the serial runner had.
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;
const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "cpl-tests-"));

function cleanupTmp() {
  try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch (e) { /* best effort */ }
}

function runOne(f) {
  return new Promise((resolve) => {
    const logPath = path.join(tmpdir, f.replace(/[^\w.-]/g, "_") + ".log");
    const fd = fs.openSync(logPath, "w");
    const child = spawn("node", ["--max-old-space-size=12288", path.join(dir, f)],
      { stdio: ["ignore", fd, fd] });
    const finish = (status, signal) => {
      try { fs.closeSync(fd); } catch (e) { /* already closed */ }
      let out = "";
      try {
        const size = fs.statSync(logPath).size;
        if (size > MAX_OUTPUT_BYTES) {
          const buf = Buffer.alloc(MAX_OUTPUT_BYTES);
          const h = fs.openSync(logPath, "r");
          fs.readSync(h, buf, 0, MAX_OUTPUT_BYTES, 0);
          fs.closeSync(h);
          out = buf.toString("utf8") +
            "\n[runner: output exceeded " + (MAX_OUTPUT_BYTES / 1048576) +
            " MB and was truncated]\n";
        } else {
          out = fs.readFileSync(logPath, "utf8");
        }
      } catch (err) {
        out = "[runner: could not read this file's output — " + err.message + "]";
      }
      try { fs.unlinkSync(logPath); } catch (e) { /* best effort */ }
      resolve({ out, status, signal });
    };
    child.on("error", (err) => finish(1, null));
    child.on("close", (status, signal) => finish(status, signal));
  });
}

async function main() {
const limit = makeLimiter(Math.max(1, Math.min(CONCURRENCY, files.length)));
const pending = {};
for (const f of files) pending[f] = limit(() => runOne(f));

for (const f of files) {
  console.log("\n──────── " + f + " ────────");
  const r = await pending[f];
  const out = r.out;
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
  cleanupTmp();
  console.log("\n════════════════════════════════════");
  console.log("Check floor written: " + p);
  console.log("  " + floored + " of " + files.length + " file(s) floored; " +
    (files.length - floored) + " print no readable count.");
  console.log("  Review the diff before committing — a LOWER floor is a check that stopped running.");
  process.exit(failed === 0 ? 0 : 1);
}

cleanupTmp();
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

}

main();
