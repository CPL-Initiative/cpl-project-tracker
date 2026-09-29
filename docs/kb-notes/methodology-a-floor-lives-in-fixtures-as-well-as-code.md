---
title: A floor lives in test fixtures as well as in code
created: 2026-09-03
updated: 2026-09-03
tags: [methodology, testing, privacy, funding, small-cell-suppression]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[adr-funding-counts-mask-under-10-units-carry-the-money]]"
  - "[[methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads]]"
artifacts:
  - funding/_build_funding_performance.py
  - tests/cpl_funding_applied.test.js
  - tests/cpl_funding_performance.test.js
  - tests/cpl_funding_row_legibility.test.js
  - tests/suppression_floor.test.js
  - tests/check_floor.json
---

# A floor lives in test fixtures as well as in code

> **One-sentence summary** — A threshold you change in one constant is also
> encoded in every fixture sized to sit on one side of it, in every label typed
> beside it, and in every source regex that names the function which prints it;
> when the constant moves, sweep those three places and run the whole suite,
> not the suites you edited.

## Context

On 2026-09-03 the funding artifact's small-cell floor rose from 5 to 10 at
Sam's ruling (see the ADR). The builder change was small and every Python
suite that drives the builder had been re-pinned deliberately and passed. The
full `npm test` then failed four jsdom suites the builder suites never see.
Workstream story: `docs/cpl_funding_lessons.md` §2026-09-02 → 03 and
`docs/map_custom_reports_lessons.md` §(h).

## The claim

A floor is not one number in one file. It is encoded in at least three other
places, none of which mention the constant:

1. **Fixtures sized to the old floor.** A test that wants a visible count
   builds a college of six or eight students because six is above five. Raise
   the floor and the same fixture is masked; a test that wants a masked count
   and a visible neighbor may now have two masked cells or, worse, one.
   Complementary masking then does exactly what the ruling asks — it hides the
   smallest visible college beside a lone masked one — and a join assertion
   turns into a suppression assertion without any code being wrong.
2. **Labels typed beside the threshold.** The public-dollar rule printed
   `"<1000"` in its CSV twin. The repo's floor lint exists to catch a typed
   mask; it did, and the label is built from the constant now.
3. **Source regexes that name a function.** A test guarding a *branch*
   (`showFig ? "held " + fmtMoney(held) : …`) had pinned the formatter's name,
   so swapping `fmtMoney` for the public-coarse `earnedMoney` failed a check
   whose own comment said it guards the branch, not the wording.

The corollary: **the suites you edited are not the suites the change touches.**
Every suite that drives the builder with a fixture, or reads the consumer's
source, is in scope for a floor change.

## How we got here

PR #1439. Four of 295 test files failed on the full run: `cpl_funding_applied`
(fixture of 6 applied students; the "a suppressed count nulls its unit sum"
check also inverted, because units are never masked now), `cpl_funding_performance`
(fixtures of 5–8 across five colleges; a lone masked college pulled Barstow's
10 into a complementary mask), `cpl_funding_row_legibility` (the formatter name
in a branch regex) and `suppression_floor` (the typed `"<1000"`). Each fix was
mechanical once seen: fixtures of 10 or more with a **second** small college so
no cell is lone, the units-kept assertion flipped, the regex widened to either
formatter, the label derived from `PUBLIC_MONEY_FLOOR`, and
`tests/check_floor.json` re-recorded for the new and raised check counts.

## When this applies (and when it doesn't)

Any threshold that decides what a test can see: suppression floors, minimum
cohort sizes, rounding steps, date cutoffs. It does not apply to a constant no
fixture is sized against, and it says nothing about whether the new floor is
right — that is the ADR's job. The repo's own guard against a typed mask
(`tests/suppression_floor.test.js`) covers only the two consumers it names;
fixtures and source regexes have no lint, so the sweep is a habit.

## See also

- `docs/kb-notes/adr-funding-counts-mask-under-10-units-carry-the-money.md`
- `docs/kb-notes/methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads.md`
- `cpl_memory` row `a-suppression-floor-lives-in-test-fixtures-as-well-as-code`
