---
title: A check that never registers can never fail
created: 2026-08-15
updated: 2026-08-15
tags: [methodology, testing, verification, detectors]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-commit-the-test-harness]]"
  - "[[methodology-judge-a-detector-by-what-it-prints]]"
artifacts:
  - tests/admin_tab.test.js
  - tests/run.js
---

# A check that never registers can never fail

> **One-sentence summary** — a test harness that collects results on a timer, or
> that lets a block die silently, reports a pass total that is partly a
> measurement of how busy the machine was; assert on the harness itself, because
> the missing checks are invisible in exactly the way a green run is.

## Context

`tests/admin_tab.test.js` ran its blocks as async IIFEs and printed its summary
from a fixed `setTimeout(…, 1400)`. Three consecutive runs against **identical
source** reported **116, 122 and 123 checks**. Nothing was red. Nothing looked
wrong. Up to seven checks simply never made it into the results array before the
summary fired. Found 2026-08-15 while verifying an unrelated Admin-tab change —
see [`docs/admin_tab_lessons.md`](../admin_tab_lessons.md).

## The claim

**A test count is itself a measurement, and it must be deterministic before any
pass/fail figure derived from it means anything.** Two failure modes produce
checks that cannot fail, and both are silent:

1. **Timer-collected results.** The summary runs before slower blocks finish.
   The checks that lost the race are not failures — they are absences, and an
   absence subtracts from the denominator as well as the numerator, so
   `123/123` and `116/116` both read as "everything passed."

2. **A block that throws.** In an async IIFE the rejection is unhandled; the
   block contributes nothing and the run still says "all passed." A vanished
   block is indistinguishable from a block that had nothing to say.

This is the same shape as the detector failures this repo keeps finding — *it
reports clean because it never ran* — one level up. The usual defence, "print
what the detector found, never trust its count," does not help here, because the
thing being counted is the checks themselves.

### What to do

- **Await every block explicitly.** Register each async block's promise and
  summarise from `Promise.allSettled`, not from a timer. Delay-based collection
  is a race the moment a block does real work.
- **Turn a rejected block into a named failed check.** `allSettled` gives you the
  rejections; emit one check per rejection with the error message in its name, so
  a dead block appears in the output rather than in the gap.
- **Make a missing helper one failed check, not a thrown suite.** A probe against
  a function the build does not export yet should evaluate to false, not take
  every later block down with it — otherwise a pre-fix verification run crashes
  and reports nothing, which is the least useful possible answer.
- **Watch the total, not just the ratio.** If the denominator moves between runs
  on unchanged source, stop and fix the harness before trusting any result from
  it — including results you have already acted on.

### Why it earned its keep immediately

Within the hour, the fixed harness surfaced
`async block 11 ran to completion — Cannot read properties of undefined (reading 'id')`
during a pre-change verification. Under the old harness that block would have
contributed zero checks and the run would have looked clean.

## Caveats

- Deterministic ≠ correct. A check can still be **vacuous** — the same run
  included a fixture that appended a duplicate row where the lookup returns the
  *first* match, so the assertion passed while proving nothing about the change.
  This note fixes counting, not fixture quality.
- Node exits when the event loop drains, so a genuinely hung block will hang the
  run rather than vanish. That is the correct trade: a visible hang beats an
  invisible absence.
