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

## First thing: carry out Sam's eighteen verdicts

Sam answered the whole sheet at 12:39Z on 2026-09-29
([XzQMks96QszUDAyXADP3Ag](https://claude.ai/artifact/XzQMks96QszUDAyXADP3Ag), `replies/done`
`through: "18"`, all eighteen his own call; 14 and 15 hold no stored reply and stand as proposed under
the high-water rule). **Re-read the store at execution:** it is live.
- **1 leave** (the funding tab review's last three sections) · **2 keep** (the explainer's footer
  whole) · **3 remint** (ETHS beyond the 31, under the playbook) · **4 demonstrated** (Current Total's
  label) · **5 use** (the thank-you wording) · **7 write** (the two saved texts: a guarded UPDATE with a
  receipt of the before-values, Rule 10 a2; he flipped it from "self").
- ⚠️ **6: no chip, a note that changes the premise.** Sam, verbatim: *"The explainer is wrong. Colleges
  will be funded for FTES that meet the priority outcomes. The full outcomes-based funding is available
  within the two-year window once minimum conditions are met."* Rewrite the explainer's Step two note and
  table heading to say that, check the tab's reserve wording against it, and show him the public text
  before it ships.
- **8 placement** (ask Jev where a CCR course belongs) · **9 course** (pair CCRR wordings by shared
  course identity, behind the course-count guard) · **10 store** (a CER decisions store; Governance
  first, DR-07) · **11** fix AUTB, then the 15 · **12** keep Sierra, show only My College where CPL
  Assistant is hidden.
- **13** name the 87 groups by topic and range (re-measure card 9 after) · **14** retire the rung-4
  units screen.
- **15** make 16 and 17, then bring draft 4 back · **16** re-read Timing with its first two sentences
  swapped · **17** add the Sample College sentence (on the card) · **18** keep the pacing choices.

Each verdict lands with its lane marker in the same PR. Cards 4-6, 8-11 and 13-17 rest on measured
premises: the builder refuses to build as their work lands, so drop each card then, under a fresh
`SHEET_ID`, and publish the next sheet only if anything is left waiting on him.

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
