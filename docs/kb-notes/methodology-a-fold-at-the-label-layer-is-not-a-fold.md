---
title: A fold at the label layer is not a fold — it hides the duplicate instead of resolving it
created: 2026-08-17
updated: 2026-08-17
tags: [methodology, identity, data-quality, eacr, encoding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-normalise-both-sides-of-a-join]]"
  - "[[methodology-validate-a-code-column-by-its-structural-invariant]]"
artifacts:
  - kb/reference/map_college_roster_rules.json
  - statewide_interactive.js
  - tests/eacr_matrix.test.js
---

# A fold at the label layer is not a fold

> **One-sentence summary** — When a display resolver normalises two spellings to
> one label, the duplicate stops being *visible* without ceasing to *exist*, and
> every count taken through that resolver will look correct while the data under
> it is still split.

## Context

Building the CER Adoption Matrix (session 165), the column axis measured **119
colleges** where the committed tripwire in `map_college_roster_rules.json` said
**118**. The extra column was Cañada College, present twice: `Cañada College`
and `CaÃ±ada College` — the same name read as latin-1 and re-encoded as UTF-8.

Both spellings are emitted by the *same generator*, `excel_to_dashboard.py`, on
different paths: the correct one reaches `potential_names` (634 cards), the
mangled one reaches `statewide_prescriptive.js` (26 college-pairs). So the grid
would have rendered two Cañada columns — one holding every one of its
opportunities, the other empty.

## The claim

**The duplicate had been in the payload the whole time, and the count that
should have caught it was taken through the thing that hid it.**

`college_short_names.js` exists to shorten college names for display. Its
`normalize()` folds `Ã±` → `n`, among many other things. So any consumer that
resolved these names for display — which is every consumer that had a reason to
count them — saw 118 distinct *labels* over a 119-row *axis*. The number was
right. The reason was wrong. Nothing was measuring the axis itself.

This generalises past encodings. A display resolver typically folds punctuation,
casing, `Community`/`Junior`, `College`, `of the`, credit/non-credit suffixes —
each fold a place where two genuinely distinct records, or one record entered
twice, can become indistinguishable *after* the resolver and remain distinct
*before* it. Wherever a pipeline has a normalising display layer, "count the
distinct labels" and "count the distinct records" are different questions, and
only one of them is about the data.

### Why the label-layer fold is not merely incomplete but actively wrong here

It resolves the axis while leaving the **cells** keyed on the raw name. That is
the failure mode that produces a plausible, fully-populated screen with the
values on the wrong side of a split: one Cañada column with 26 opportunities and
another, identically labelled, with none. A user cannot see this. It does not
throw. It looks like a college that simply has no data — which is a real state,
and therefore an unfalsifiable one by inspection.

## What to do instead

1. **Fold at the data layer**, in whatever committed artifact already carries
   the rules for this class. Here that was `kb/reference/map_college_roster_rules.json`,
   which already folded MAP's sandbox orgs and its `" Credit"`-suffixed twins —
   the new entry belonged with them, not in the view.
2. **Fold as a SUM, never a pick.** The two Cañada spellings and the two North
   Orange spellings all happen to carry zero adoptions today, so a fold that
   dropped one would be indistinguishable from a correct one — until the day one
   of them articulates something, and that day does not announce itself.
3. **Assert on the axis, not on the labels.** The check that matters is
   `distinct records == distinct labels`; the collision test is cheap and it is
   the only one that can fail while everything looks right.
4. **Escape the mojibake in source.** A file that spells `CaÃ±ada` literally
   invites the next re-encoding to corrupt the very string it is guarding
   against. Write `"CaÃ±ada College"` in JSON and JS, and in the test
   fixture too — otherwise the fixture quietly stops reproducing the bug.
5. **Fix the encoding upstream as well.** The fold is a safety net and stays
   regardless, but a generator emitting two encodings of one name on two paths
   is a defect at source, not a naming variant.

## The adopter-count corollary

The same fold moves a **published number**. A card listing four adopter
spellings where one is a sandbox org and two are one institution has **two**
adopters, not four. This is the identical shape as the earlier finding that
`CA MAP INITIATIVE COLLEGE` published *7 adopters on California Real Estate
Broker License where the truth was 6* — an identity defect surfacing as a
credibility defect in something a college reads.

Counts of institutions must be taken **after** identity resolution, and the
resolution must be the data-layer one.

## Signals that this is happening to you

- A tripwire count matches while a freshly-derived count does not.
- A "distinct names" number is only ever obtained by mapping through a display
  or shortening function.
- One row of a grid is fully populated and a second, similarly-named row is
  empty.
- Two artifacts from one generator disagree about how a name is spelled.
