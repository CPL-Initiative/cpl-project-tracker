---
title: A test that only fails under load is racing a timer the product owns
created: 2026-09-06
updated: 2026-09-06
tags: [methodology, testing, jsdom, flake, ci]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration]]"
  - "[[methodology-a-check-that-never-registers-can-never-fail]]"
artifacts:
  - tests/ccr_skyview_search_show.test.js
  - prototype/ccr_atlas_v1.html
---

# A test that only fails under load is racing a timer the product owns

A test that passes locally, passes standalone, passed on CI an hour ago on the
same bytes, and fails on CI now is not telling you it is unreliable. It is
telling you there is a **deadline in the product** that your test finishes
inside of when the machine is idle and misses when it is not.

## The shape

The tell is the combination, not any one part:

- green standalone, green in a full local suite, green on CI on identical
  content shortly before;
- the diff on the red run touches nothing the test loads;
- `exit 1` from the child, not `exit 134` or `SIGABRT` (which would be memory);
- the failing checks are **adjacent**, all in one block, not scattered.

Adjacency is the strongest signal. A memory or infrastructure problem does not
pick three consecutive assertions out of 116.

## Reproduce it by loading the box, not by re-running

A re-run tests the same conditions again and mostly comes back green, which
teaches you nothing and spends the one re-run you get. Run the file **many
times concurrently** instead — the contention is the variable you are missing:

```bash
for round in 1 2 3; do
  for i in $(seq 8); do
    ( node tests/<file>.test.js > rep_${round}_$i.log 2>&1; echo $? > rep_${round}_$i.code ) &
  done
  wait
done
grep -h "^FAIL" rep_*.log | sort | uniq -c
```

Measured on `ccr_skyview_search_show.test.js` (2026-09-06): **7 of 24 runs
failed**, three at 113/116 and four at 114/116, and the `uniq -c` named the
three failing checks immediately. That is a diagnosis in one command, against a
CI log this environment could not even read — `get_job_logs` caps its window at
roughly the last minute of a nine-minute run, and the full-log blob is refused
by egress policy.

## The cause is usually a deliberate delay you forgot the product has

Here it was one line, and it is correct product behavior:

```js
gqEl.addEventListener("blur", function(){ setTimeout(closeSug, 120); });
```

The suggestion list closes 120ms after the search box loses focus, so clicking
elsewhere dismisses it. The test focused that box in an earlier section; a later
section clicked a row, a move control and a destination, each of which blurs it
and **schedules that close**. The harness's `tick()` is `setTimeout(r, 0)` — one
macrotask. On an idle machine the remaining assertions finish inside 120ms. On a
loaded runner the timer lands in the middle of them.

⚠️ **The product was right and the test was wrong.** The instinct on a red check
is to look for a bug in the code under test; here the code under test was doing
exactly what it was asked to. The fix is to let the pending deadline land before
the block that cares, and to write the mechanism down beside it:

```js
// The page closes the list 120ms after blur (deliberate). Earlier sections
// blur the box, scheduling it. tick() is ONE macrotask, so an idle machine
// finishes inside the window and a loaded one does not.
await new Promise((r) => setTimeout(r, 200));
```

**Verify in both directions under the same contention.** Before: 7 of 24 failed.
After: 24 of 24 passed at 116/116. A fix for an intermittent failure that is only
observed once is not observed at all.

## Why a bare `tick()` invites this

`await tick()` reads like "let the page settle" and means "yield one macrotask".
Those are the same thing only when nothing in flight needs two. Anything that
crosses a `.then()` into a `setTimeout`, any debounce, any deliberate delay, and
one tick is a coin flip whose bias is the machine's current load. When a block
depends on state that a *timer* controls rather than a synchronous handler, wait
for the timer, not for a turn.

## Do not stop at "flake"

"Flake" is a description of the evidence — green here, red there — and it is
never a root cause. It is legitimate to say it while you are still excluding
things, and it is not a place to stop: an unexplained intermittent failure is a
guard that fires on truth some fraction of the time, and
`methodology-a-guard-that-fails-on-truth-gets-muted` says what happens to those.
