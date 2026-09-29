---
title: Session 302 handoff — eighteen asks on one sheet, the unit range on three surfaces, draft 3 of the video
date: 2026-09-29
session: 301 (SkyShuttle)
tags: [handoff, decision-sheet, unit-range, funding-video, implementation-funding, common-cr-reference]
status: current
---

# You are Session 302

Your moniker is **SkyWeft**. SkyShuttle (S301) took the queue from
[`session_301_handoff.md`](session_301_handoff.md).

## First thing: Sam's answers on the eighteen-card sheet

The standing sheet is [XzQMks96QszUDAyXADP3Ag](https://claude.ai/artifact/XzQMks96QszUDAyXADP3Ag)
(`SHEET_ID` `2026-09-29-open-asks-3`). Read its `replies` and `replies/done` and its comment threads
before anything else, and apply the high-water rule (`decision_sheets`).
- **Cards 1–7** are S300's seven, still unreviewed: Sam pressed Complete on
  [QiaDezD2AN6XDzctUCSCfw](https://claude.ai/artifact/QiaDezD2AN6XDzctUCSCfw) with no card touched, and
  **a reply on that sheet's thread still counts** for them. Card 7 is a guarded UPDATE with a receipt of
  the before-values (Rule 10 a2).
- **Cards 8–11:** a Jev next step per reference (the [`common-cr-reference`](reference/lanes/common-cr-reference.md)
  lane's NEEDS SAM section; counts from `python3 kb/_jev_next_steps.py`). **Card 12:** Sierra Training's
  Try it in buttons.
- **Cards 13–14:** name a CR group whose wordings award different units by topic and range
  (*Engine Performance (2–5 units)*; renaming moves the typesafe trial's grouping by `canonical`, so
  re-measure card 9 after), and retire the rung-4 units screen that holds 30 groups.
- **Cards 15–18:** draft 3 of the narrated video (sent to Sam in chat), the Timing line that trails
  its words by 7.6 s (re-read the scene with its first two sentences swapped), Sample College's target
  shown and never spoken (a drafted sentence is on the card), and the pacing choices.

Sheet 2 ([9Wikhf54XyJgWXDEw5AK7G](https://claude.ai/artifact/9Wikhf54XyJgWXDEw5AK7G)) held no replies
when sheet 3 replaced it; read its store too, in case. Carry out each verdict with its lane marker in
the same PR. Cards 4–6, 8–11 and 13–17 rest on measured premises: the builder refuses to build once
their work lands, so remove each card then, under a fresh `SHEET_ID`.

## What shipped (S301)

- **#1735–#1740** (the first half): fresh CER and CSR scans with two CSR rules fixed, the funding
  brief's minimum conditions and the public percentage, the Jev sheet, SkyView on a phone, the audit.
- **#1741:** narrated draft 2, each reveal cued to the word that names it.
- **#1742:** the public Fact Sheet and Sierra's statewide lines show a unit range (EMT 6–7).
- **#1743:** Unified Courses Units read the members each row displays (2,358 merged rows printed "—"
  or one figure); the export writes the range; the over-merge ⚠ on a wide spread is gone.
- **#1744:** the CR Reference says *2–5 units* where it said *units vary*.
- **#1745:** the video's seventh scene says minimum conditions in picture and voice; the MP4s
  re-versioned (`_v2`, `Narrated_Draft_3`) and the explainer's two links moved with them.
- **#1746:** the funding tab's four targets under 24px, 22 dead CSS rules, two dead check scripts
  (merge it on a green `test` if S301 did not).
- **#1747:** sheet 3 (merge it on a green `test` if S301 did not).

## The unit range: what is left

Sam's rule (2026-09-27, `mid_lifecycle`): a merge or mint that joins differing units shows the range.

| Surface | State |
|---|---|
| Fact Sheet + Sierra statewide lines | ✅ #1742 |
| Unified Courses table, detail, .xlsx | ✅ #1743 (19 locked official anchors still print "—" by design) |
| Common CR Reference | ✅ stats line #1744; the names wait on card 13 |
| SkyView label, tooltip, card, outline | one `u` (`kb/_build_ccr_universe.py` `point_of`); emit low and high, check the label at phone width |
| EACR | one line per unit value (`statewide_interactive.js` `typicalAward`) |
| Common Exhibit Reference, dashboard card | the modal wording (`credential_reference.js`, `excel_to_dashboard.py` ~L6352) |
| Sierra `local_set` | one recommendation once per unit value (edge function) |

## Then: the queue

The verdicts above · the unit range's remaining four rows (To-Do `s301-fable-unit-range-rest`) ·
governance for the write surfaces, measured S301: a CER decisions store maps to **DR-07** (its
`maintained_in` gains the table); the cross-list curator surface sits on **DR-25** (the edge) or
**DR-04** (course identity), to decide when it is designed; the `cpl_occupation_match` verdict queue
has no row and needs one on **DR-23**'s shape when its design exists · the ETHS answer (card 3) ·
ESL monthly after 2026-10-28 · the funding lane's ③, now only "the who-moves caveat", which no text
matched.

## Waiting on Sam

The eighteen cards. GR rows #2, #10 and #16. The SQL To-Do's other half.

## Read in order

1. This file. 2. [`common_cr_reference_lessons`](common_cr_reference_lessons.md), the two S301
sections. 3. [`decision_sheets`](reference/decision_sheets.md), the high-water rule.

## Patterns that worked

- **Measure a display against what the row displays**, then fix the fold that lost the range.
- **Run the export into a scratch directory** (`UC_OUT_DIR`) and diff it row by row against the
  committed artifact: 1,431 scalars changed and no other field did.
- **A worktree in the scratchpad per parallel branch**, so a long test run never has files switched
  under it.

## Safety patterns

- ⚠️ **Mutation checks with `python3 -B`:** a same-length edit within one second reuses the stale `.pyc`.
- ⚠️ **No time cap on the funding suites:** one file takes over two minutes, and a capped loop reports
  false failures.
- **Retiring an alarm: search for its glyph as well as its words;** a test pinned the ⚠ itself.
- **Before changing a field's shape, list every consumer,** including parsers that read it as a number.

## Carryover

Not refreshed: `kb/README.md` and `README.md` (no structure change), the Pipeline tab (the pipeline
did not move).
