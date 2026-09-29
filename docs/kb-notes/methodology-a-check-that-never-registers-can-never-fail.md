---
title: A check that never registers can never fail
created: 2026-08-15
updated: 2026-08-21
tags: [methodology, testing, verification, detectors]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-commit-the-test-harness]]"
  - "[[methodology-judge-a-detector-by-what-it-prints]]"
artifacts:
  - tests/lib/check_ledger.js
  - tests/check_floor.json
  - tests/admin_tab.test.js
  - tests/nav_groups.test.js
  - tests/eacr_a11y.test.js
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
reports clean because it never ran* — one level up. The usual defense, "print
what the detector found, never trust its count," does not help here, because the
thing being counted is the checks themselves.

### What to do

- **Await every block explicitly.** Register each async block's promise and
  summarize from `Promise.allSettled`, not from a timer. Delay-based collection
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


---

## Update 2026-08-16 — `val()` guards the CHECK; the DRIVER is the other half

Third harness in three days, and this one is the sharper form. Handoff 161
predicted the recurrence and prescribed the fix — *"`val()` is in
`admin_tab.test.js` and `nav_groups.test.js`; the next harness will need it too"*
— so `tests/eacr_a11y.test.js` was written **with** `val()` from the first line.

It printed **zero checks** on its first pre-fix run anyway.

**`val()` wraps check expressions. The failure was in an imperative driver.** An
a11y suite does not only read the DOM, it *operates* the UI — clicks a tab,
presses a key, expands a list:

```js
key(more(), "Enter");          // more() is null on the pre-fix source
                               // → dispatchEvent on null → the file dies
```

The throw happened between checks, not inside one, so no `val()` was in its path.
Everything after it never registered, and a run that reports nothing is
indistinguishable from a run that passes — the exact failure this note exists to
prevent, reached by a route the note did not cover.

### The rule, restated

**Every element a test DRIVES must be null-safe, not just every value it reads.**
A missing element must fail its own check and let the file continue; it must
never take the run down.

```js
function key(el, k) { if (!el || !el.dispatchEvent) return false; /* … */ return true; }
function click(el)  { if (!el || !el.dispatchEvent) return false; /* … */ return true; }
function focus(el)  { if (el && el.focus) el.focus(); }
```

And wrap the entry point, so a throw anywhere becomes a *visible failed check*
rather than silence:

```js
setTimeout(function () {
  try { run(); }
  catch (e) { check("the harness ran to completion (it threw: " + e.message + ")", false); report(); }
}, 80);
```

Also add a check that the thing you are about to drive **exists** (`"there are
tabs to navigate"`). It reads as redundant on a healthy build; it is the check
that fires first on a broken one, and it tells you *which* driver died.

### The meta-lesson

**A fix to one harness is not a fix to the practice, and neither is a warning in
a handoff.** The prescription was written down, read, and followed — and the trap
still landed, because it had been recorded at the wrong altitude ("use `val()`")
rather than as the principle ("nothing between checks may throw"). Prefer
recording the principle; the mechanism is an example of it.


---

## Update 2026-08-21 — the rule finally has a consumer

This note has said *"watch the total, not just the ratio"* since 2026-08-15.
**Nothing watched it**, and the trap recurred in two more harnesses (08-15
`nav_groups`, 08-16 `eacr_a11y`) before anyone noticed the instruction had no
reader. Which is the note's own meta-lesson arriving one level up: recording the
principle was not enough either.

`tests/run.js` judged a file by **exit status alone** — a complete answer to
*"did anything fail?"* and no answer at all to *"did everything run?"*.

Measured on real repo code rather than argued: skipping one block of
`college_identity_variants.test.js` (12 checks, green) produces

```
college_identity_variants.test.js: 10/10 checks passed      exit 0
```

Two checks gone, count self-consistent, whole run reported green.

**The fix is a floor, not a fixed expectation.** `tests/check_floor.json` records
the count each file reports about itself; `tests/run.js` fails a file that
reports **fewer**. Deliberately *not* failed: a file with more checks (adding
tests stays free), a file absent from the ledger, or one printing no parseable
count — those are reported and counted, because a guard that fires on correct
behavior gets muted
([`a-guard-that-fails-on-truth-gets-muted`](methodology-a-guard-that-fails-on-truth-gets-muted.md)).

At the first baseline: **241 of 247 files floored, ~7,500 checks under guard.**

Two things this note did not previously say, both learned building it:

- ⚠️ **Never baseline against a moving tree.** Two ledgers were generated while
  the working tree was still being edited, and both recorded broken states as
  floors — `sierra_geo_ranking.test.js` was floored at **1** when its true count
  is 50. A floor set too low is safe but useless, which makes it the quiet
  failure mode.
- ⚠️ **The `.then()` blocks must be COLLECTED, not timed.** A block whose checks
  register inside a promise lands after the summary unless something awaits it.
  Awaiting an explicit list of block promises is the fix; a `setTimeout` is the
  bug this note opened with.

Full reasoning and the two sibling tiers (test → shared helper → lookup):
[`methodology-index-the-doctrine-to-the-file`](methodology-index-the-doctrine-to-the-file.md).
