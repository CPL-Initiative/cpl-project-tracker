---
title: A test file is a memory budget, and the process boundary is the only allocator
created: 2026-08-20
updated: 2026-08-20
tags: [methodology, testing, jsdom, memory, ci, test-infra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
artifacts:
  - tests/lib/cpl_funding_harness.js
  - tests/run.js
---

# A test file is a memory budget, and the process boundary is the only allocator

> **One-sentence summary** — a jsdom window that has rendered something is never
> reclaimed for the rest of its process no matter what the test does with it, so
> the peak memory of a suite is set by *how many windows the largest FILE builds*
> — which makes splitting the file the fix and every in-file tidy-up a placebo.

## Context

`tests/cpl_funding.test.js` reached 2,955 lines and 61 jsdom windows in one
process. On 2026-08-20 it stopped fitting: PR #1268 went red not on an assertion
but on a V8 heap-limit abort, against a per-child cap that had already been
raised from 8,192 MB to 12,288 MB. Two fixes were tried on the assumption that
the *test* was holding the windows — closing stale windows, and memoising a hot
function — and neither moved the curve. This note records what the retention
actually is, because the wrong model sent a session down two dead ends and would
have sent the next one down the same two.

## The claim

**1. It is not "jsdom windows are unreclaimable". jsdom collects fine.** Fifteen
windows that are constructed but never booted cost 57 MB *in total*. Fifteen that
are booted cost 705 MB — ~44 MB each, retained for the life of the process. The
mass is what rendering leaves behind, not the window.

**2. `close()` does nothing, and neither does any other in-file discipline.**
Twenty iterations with `window.close()` and twenty without produce the same
curve to one decimal place. Nulling the reference does not help; nor does
scoping the block; nor does wrapping each block in an IIFE; nor does awaiting a
microtask or a full event-loop turn between blocks.

**3. Heap snapshots name two retainers, and neither is reachable from the test.**
While the file's top-level frame is still running, every window is rooted from
**`(Stack roots)`** — the frame's own live registers, which are not cleared as
one sibling block after another exits. Wrap each block in an IIFE and that root
goes away; the DOM is then rooted from **`(Micro tasks)`** — a
`PromiseFulfillReactionJobTask` holding the consumer's `onDOMContentLoad`
closure, sitting on a queue that a single long synchronous test file never
drains. Remove one root and the other holds.

**4. Therefore the process boundary is the allocator.** The only event that
reclaims a booted window is the process exiting. A runner that gives each file
its own child (ours does) already provides that; what it cannot do is help a
file that builds sixty windows before it exits. **Peak memory is a property of
the largest file, and the only lever is how many windows that file has.**

**5. So budget in windows, not lines.** Ours: ~44 MB per booted window over a
~40 MB floor. Past ~15 windows in one file, start a new suite. A 2,900-line file
of pure static assertions is fine; a 300-line file that boots forty windows is
not.

## How we got here

Measured, in this order, each step narrowing the claim:

| Probe | Result |
|---|---|
| 20 booted windows, reference dropped, explicit `global.gc()` | 44.8 MB retained each, linear |
| same, with `window.close()` | identical to one decimal place |
| 15 windows constructed but **not** booted | 57 MB total — collected |
| booted inside a loop, measured after the frame returned | collected (1 of 15 alive) |
| booted in 20 sibling top-level blocks, measured in-frame | 20 of 20 alive, 925 MB |
| same but each block an IIFE | still 925 MB |
| `await null` / `await setImmediate` between blocks | still 925 MB |
| heap snapshot, in-frame | `Window <- (Stack roots)` |
| heap snapshot, IIFE variant | `DocumentImpl <- onDOMContentLoad closure <- PromiseFulfillReactionJobTask <- (Micro tasks)` |

The loop probe is the trap worth naming: it collects, because its frame returns
before the measurement. A probe shaped like a loop cannot reproduce a file shaped
like sixty sibling blocks, and "I could not reproduce the leak" is the wrong
conclusion to draw from it.

The repair was the split: nine suites, the same 575 assertions, peak RSS
**8,642 MB → 2,393 MB** and wall clock 462 s → 333 s (they also parallelise, which
one file cannot). Shared setup and the jsdom helpers moved to
`tests/lib/cpl_funding_harness.js`, which carries the budget where the next
person adding a window will read it.

## When this applies (and when it doesn't)

Applies to any jsdom (or headless-browser) suite where each case builds a fresh
document and the runner gives each FILE a process. It is about rendered DOM, not
about jsdom per se — an unrendered window is cheap.

It does **not** apply to a suite whose cases share one window, and it is not an
argument for splitting files in general: splitting a file that holds no windows
buys nothing and costs navigability. Raising the heap cap is legitimate as
headroom — it is what keeps an unrelated change from going red — but it is
never the fix, because the growth is linear and the next few hundred megabytes
re-arms it.

One corollary worth stating separately: **a heap-limit abort is not a test
failure and does not print like one.** The child exits 134 (or dies on SIGABRT)
having printed no FAIL line, which reads exactly like a silent assertion failure
until you know to look. `tests/run.js` now names the file and says "out of
memory" in the end-of-log summary for precisely this reason.

## See also

- `tests/lib/cpl_funding_harness.js` — the harness, and the budget in situ
- `tests/run.js` — per-child cap and the OOM-aware failure summary
- `[[docs/cpl_funding_lessons]]` — the workstream story
- PR `#1268` — where it surfaced; PR for the split follows it

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
