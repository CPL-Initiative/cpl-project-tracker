---
title: Test suite speed — lessons
created: 2026-08-29
updated: 2026-08-29
tags: [lessons, testing, ci, performance, runner]
artifacts:
  - tests/run.js
  - tests/lib/limiter.js
  - tests/limiter.test.js
  - tests/runner_capture.test.js
  - .github/workflows/js-tests.yml
related:
  - "[[methodology-measure-the-distribution-before-you-pick-a-parallel-strategy]]"
  - "[[methodology-a-test-file-is-a-memory-budget]]"
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# Test suite speed — lessons

## 2026-08-29 — Session 206 (SkyCrush): 20.7 min → 6.9 min, and three symptoms that named the wrong thing

Sam: *"Is there anything I can safely do about the npm test? Takes so long now
that the code has grown."* **`npm test` 1,245s → 395s locally, and 20.7 min →
6 min 55 s in CI including `npm install`.** PR #1384. Nothing skipped, no
assertion changed.

### What was learned

**Measure the distribution before choosing a strategy.** Timing every file
individually took one loop and killed the design that sounded safest:
`cpl_funding_*` is **28 files and 967s of 1,245s — 78%**, so *"serialize the
heavy family, parallelize the rest"* is bounded at 967s no matter how many
workers you add. The heavy files ARE the suite. That turned the question from
scheduling into memory, which is a question with a measurable answer.

**`N × worst-file` is the wrong memory model.** Peak RSS: `cpl_funding_render`
**3,825 MB** (a lone outlier), the rest of the family ~2,100 MB, a typical file
258 MB. Modeling three concurrent as 11.5 GB forced the cap to 2. Running the
three heaviest together measured **6,187 MB** — peaks do not coincide. The cap
now derives from `os.totalmem()`.

**A static proxy must be scored before it is trusted.** The runner's own comment
documents *"~44 MB per booted window"*, so counting window boots looked like a
free heavy-file classifier. Checked against the timings: **2 correct, 23 missed,
4 false alarms** (`cpl_session.test.js` boots 33 windows in 2.1s). Window count
predicts memory, not time.

**The free win was in `npm install`, not the tests.** `playwright` is a RUNTIME
dependency but nothing under `tests/` requires it — only the browser-check
scripts, which are deliberately outside `npm test`. CI downloaded three browsers
on every run for a suite that never launches one.

### ⚠️ Three symptoms that named the wrong thing

Every one was found by running the **real suite end to end**; targeted tests
were green throughout.

1. **Pipes truncate.** `console.log` to a pipe is asynchronous, so a child ending
   in `process.exit()` discards whatever is still buffered. `spawnSync` never saw
   it — the parent was blocked, the OS pipe filled, and the child blocked on
   write rather than getting ahead. Measured: a child printing 20,000 lines then
   exiting delivered **3,179 lines through a pipe and 20,000 through a file
   descriptor.** It surfaced as `cip_crosswalk.test.js` reporting 178 of 354
   assertions, which the check-ledger called *"176 checks stopped running"* — the
   signal that means a rule was silently disabled. Every assertion had run.
2. **`node --check` parses; it does not resolve references.** A rewrite deleted
   the limiter's `require`, `--check` stayed green, and the runner died at
   startup having run **zero** tests.
3. **A hand-listed dependency set in a test fixture.** `check_ledger.test.js`
   copies the runner into a temp dir with a named list of `lib/` files, which did
   not include the new `lib/limiter.js`. `MODULE_NOT_FOUND` surfaced as four
   failing ledger assertions. It copies the whole directory now.

### ⚠️ Two design points that are load-bearing

- **It is a limiter, not a worker pool.** Every file gets its promise up front so
  the reporting loop awaits them in alphabetical order and the log streams in the
  serial runner's sequence. A pool would have held ~6 minutes of output, emitted
  it in one burst, and printed **nothing at all** if the job hung.
- **An unresolved promise does not keep Node alive.** The limiter's own test
  originally **exited 0** on a deadlock — a silent pass for the exact bug it
  exists to catch. Every wait is time-bounded and the check total is asserted.

### Current state

`tests/run.js` runs concurrently, width derived from measured RSS and the
machine's RAM (4 on a 16 GB runner, degrading to 2 or 1), overridable with
`TEST_CONCURRENCY`, and it prints its chosen width — a slow CI run was otherwise
indistinguishable from a serial one. `tests/limiter.test.js` 9 checks,
`tests/runner_capture.test.js` 6, check floor re-baselined 277 → 282 with nothing
lowered.

### Next concrete step

**Split `cpl_funding_render.test.js`.** At 3,825 MB against ~2,100 MB for the
rest of the family it alone forces the conservative cap; splitting it would let
the width rise on every machine. The repo has precedent — `cpl_funding.test.js`
was split into nine suites for memory, peak 8,642 → 2,393 MB. Secondary: seven
files still print no readable check count and are unprotected by the ledger.
