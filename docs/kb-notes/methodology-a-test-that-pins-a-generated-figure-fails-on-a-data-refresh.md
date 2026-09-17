---
title: A test that pins a figure from a regenerated artifact fails on a data refresh, not on a defect
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, testing, funding, daily-pipeline]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/implementation-funding]]"
  - "[[docs/kb-notes/methodology-a-ban-is-only-as-wide-as-the-files-it-opens]]"
artifacts:
  - tests/cpl_funding_measure_picker.test.js
  - tests/cpl_funding_metric_pin.test.js
  - cpl_funding_performance.js (regenerated daily)
---

# A test that pins a figure from a regenerated artifact fails on a data refresh, not on a defect

> **One-sentence summary** — When an assertion hard-codes a number that a
> scheduled job recomputes, the test stops describing the code and starts
> describing yesterday's data, and it goes red on a day nobody touched the
> repository.

## What happened

On 2026-09-16 `main` went red on `test` with no code change behind it. Three
assertions across two funding suites:

| Assertion | Pinned | After the daily run |
|---|---|---|
| `cpl_funding_measure_picker` `4c` | `826.8 CPL FTES` | `pac_u` 24,804.45 → 24,847.45 units = **828.2** |
| `cpl_funding_metric_pin` `7b` | "at most the **3** `pp_u` carriers" | **4** — Modesto, Moreno Valley, Solano, West LA |
| `cpl_funding_metric_pin` `7b2` | `25 units` | `pp_u` 25 → **63.5**, printed as 64 |

All three read `cpl_funding_performance.js`, which the daily dashboard workflow
rewrites. Three consecutive `Daily dashboard update` commits regenerated it; the
statewide measures moved by ordinary amounts, and the assertions moved with
nothing.

## Why it cost more than a red check

A session working an unrelated crosswalk PR hit the failure on its own branch,
reproduced it against `origin/main` in a worktree, established that its diff
touched no funding file, wrote the finding up on its PR and stood down — the
correct call, and roughly an hour of work that existed only because the tests
lied about what was broken. Red `main` also taxes every PR opened until it is
fixed, because the first thing any session must do with a red check is prove it
is not theirs.

A bisect settled the attribution: both suites are green at `d906cf2` (before
the funding explainer merge) and green at `4a00bd9` (the merge itself), and red
only after the cron commits. The code was never wrong.

## The rule

**An expectation may not be a literal copy of a number some other process
computes.** Derive it from the same artifact the code reads, at test time.

This is the same principle the surrounding file already applied to its *option
set* — `cpl_funding_measure_picker` rebuilds `METRIC_SOURCES` out of the
consumer "rather than a copy that can drift from it" — extended from the shape
of the data to its values.

## Deriving without making the test vacuous

The obvious objection is real: if the expectation is computed from the same data
the code reads, what is left to fail? The answer is that the test must still
name **which** value is correct, and prove it can tell the difference:

```js
const chosen = statewideFtes(window, "pac_u");   // what the card must now read
const rival  = statewideFtes(window, "ppa_u");   // the measure it moved OFF
check("…the counselor measure's own statewide figure, not the origin measure's",
  chosen !== rival &&                 // ⚠️ the check can discriminate at all
  rx(chosen + " CPL FTES").test(after) &&
  !rx(rival + " CPL FTES").test(after));
```

Three properties make this a guard rather than a tautology:

1. **The expectation is keyed to a specific source.** Reading the wrong measure
   still fails, because the wrong measure's number is different.
2. **The rival is asserted absent**, not merely unmentioned.
3. **`chosen !== rival` is asserted explicitly.** If the two lanes ever produced
   the same figure the comparison would pass no matter what the code read, and a
   check that cannot fail must say so out loud rather than wait to be trusted.

For a *count* rather than a figure, the same shape applies with a structural
comparison instead of a literal: `7b` now asserts the non-zero column equals the
`pp_u` carrier count derived from the artifact, **and** that the portal lane is
several times thinner than the applied lane — which is the actual claim ("the
prose landed on the thin lane"), stated in a form the daily run cannot move.

## Verifying the rewrite

Deriving an expectation is exactly the kind of change that can quietly turn a
guard into a decoration, so each one was mutated against the defect it exists
for:

- Neuter the measure picker's write path → `4c` fails by name (along with 4b,
  4e, 5a, 5c, 5d).
- Point the portal prose rule at the applied lane → `7b` and `7b2` fail by name
  (along with 1a, 3b, 7a, 7d).

⚠️ One earlier mutation attempt passed and was **not** evidence the guard was
weak: forcing `earnFraction`'s statewide lookup to a fixed key left the card's
figure unchanged, because that particular number is rendered from a different
path. A mutation that does not move the thing under test proves nothing in
either direction — check that the mutation actually changed the output before
concluding anything from a green run.

## Where else to look

Any assertion naming a number that the daily workflow regenerates. The funding
suites are the dense case because the performance artifact is rebuilt every day,
but the same shape exists wherever a test pins a KPI, a college count, a row
total or a percentage that a pipeline recomputes. The tell is a literal with a
decimal point and a unit in an assertion's name.
