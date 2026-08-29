---
title: "Measure the distribution before you pick a parallel strategy"
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, testing, ci, performance, measurement]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - tests/run.js
  - .github/workflows/js-tests.yml
related:
  - "[[methodology-a-test-file-is-a-memory-budget]]"
  - "[[methodology-commit-the-test-harness]]"
---

# Measure the distribution before you pick a parallel strategy

`npm test` had grown past 20 minutes. Three plausible strategies were on the
table before anything was measured, and **the measurement killed the one that
sounded most sensible.**

## What the numbers said

Every file timed individually (2026-08-28):

| | |
|---|---:|
| whole suite | **280 files, 1,245s** |
| `cpl_funding_*` | **28 files, 967s — 78%** |
| everything else | 252 files, 277s |
| slowest single file | `cpl_funding_render`, **122.9s** |
| median file | ≈1.1s |

## The strategy that measurement killed

The obvious plan was *"serialize the memory-heavy family, parallelize
everything else"* — it sounds safe, and it keeps the known memory hogs apart.
**It is worthless here.** With the heavy family serialized the wall clock is
bounded at 967s **no matter how many workers you add**:

```
N=2  -> max(967, 277/1) = 967s      N=4  -> max(967, 277/3) = 967s
N=3  -> max(967, 277/2) = 967s      N=6  -> max(967, 277/5) = 967s
```

The heavy files ARE the suite. They have to run alongside each other or nothing
improves — which turns the question from *scheduling* into *memory*, and that is
a question with a measurable answer.

## `N × worst-file` is the wrong memory model

Peak RSS, polled per child:

| file | peak |
|---|---:|
| `cpl_funding_render` | **3,825 MB** ← a single outlier |
| `cpl_funding_lane_switch` | 2,147 MB |
| `cpl_funding_cpl_ftes` | 2,064 MB |
| `cpl_funding_equity` | 1,927 MB |
| `admin_tab` | 258 MB ← a typical file |

Modeling three concurrent as `3 × 3,825 = 11.5 GB` forced the cap down to 2 —
a 2× win instead of a 4× one. But **only one file is 3.8 GB**; the rest of the
heavy family sits near 2.1 GB. Running the three heaviest together and polling
the combined total gave **6,187 MB**, not the 8,036 MB sum of their individual
peaks — because *peaks do not coincide*. The honest model is "one outlier plus
(N−1) heavy", and it is the one worth encoding.

## A static proxy has to be validated, not assumed

The runner's own comment documents the memory model — *"~44 MB per booted
window… peak memory is set by the number of windows in the largest file"* — so
counting window boots in the source looked like a free, rot-proof way to
classify heavy files. Checked against the timings: **2 correct, 23 missed, 4
false alarms.** `cpl_session.test.js` boots 33 windows and finishes in 2.1s.

Window count predicts **memory**; it does not predict **time**. They are
different axes, and the file that dominates one need not dominate the other. A
proxy you have not scored against the thing it stands in for is a guess with a
citation.

## The bug that only a full end-to-end run could find

The parallel runner passed every targeted check and then failed the first full
run: `cip_crosswalk.test.js` reported **178 of its 354 assertions**, and the
check-ledger called it *"176 checks stopped running"* — the signal that is
supposed to mean a rule was silently disabled. Every assertion had in fact run.
Only the report of them was cut off.

**`console.log` to a PIPE is asynchronous in Node, so a script ending in
`process.exit()` discards whatever is still buffered.** The serial `spawnSync`
runner never saw this: the parent was blocked, the OS pipe filled, and the child
blocked on write instead of getting ahead. An async parent drains the pipe,
removes that back-pressure, and the child races ahead and exits with output
unwritten. Measured directly — a child printing 20,000 lines then calling
`process.exit(0)`:

| capture | lines received |
|---|---:|
| pipe | **3,179 / 20,000** |
| file descriptor | 20,000 / 20,000 |

Writes to a file descriptor are synchronous, so `process.exit()` cannot truncate
them. Children write to a temp file now.

Two things worth carrying:

- **The failure pointed at the wrong thing.** It looked exactly like a test file
  that had quietly stopped enforcing 176 rules — the most alarming signal this
  suite has. Running the file alone gave 354/354, and running four copies
  concurrently *with output redirected to files* also gave 354/354, which is
  what isolated the pipe rather than contention.
- **Targeted tests could not have caught it.** The limiter's own suite was
  green, the concurrency was correct, and the memory was fine. It needed the
  real suite, at real width, with real output volume.

## What to keep

- **Time the units before choosing a strategy.** One `for` loop with a
  millisecond stamp is minutes of work and it eliminated a design.
- **A skew this extreme changes the question.** When 10% of the units are 78% of
  the cost, "parallelize the cheap ones" is not an optimization.
- **Measure the combination, not the sum of the parts** — for memory,
  contention, or anything else where the parts do not peak together.
- **Prefer degrading to failing.** The pool is sized from the machine's actual
  RAM, so a smaller box drops to 2 or 1 on its own. An OOM'd child reads as a
  *test failure*, and trading a slow green for an intermittent red is strictly
  worse than being slow.
