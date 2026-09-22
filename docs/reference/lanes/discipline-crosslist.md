---
title: "Discipline cross-listing — nest, alias or carry two homes — lane state"
created: 2026-09-22
updated: 2026-09-22
tags: [reference, roadmap-lane]
kb-status: internal
related:
  - "[[CLAUDE]]"
obsidian-folder: cpl-project-tracker/reference/lanes
---

# Discipline cross-listing — nest, alias or carry two homes

**What this lane is:** what to do about the courses whose member colleges
disagree about which MQ discipline they belong to — nest them, alias the
vocabulary, or let a course carry more than one home.

Sam opened it on 2026-09-22, reading the calibration of his own 26 title-rung
rulings:

> The pattern show real variability and uncertainty in the field--we somehow
> need to use this process to get everything properly nested OR just cross list
> the heck out of the misfits and live to tell another day:)

**Decision sheet:** https://claude.ai/artifact/BizNPAbrucq6hWARVzTQBp — twelve
items, generator `kb/_build_crosslist_decision_sheet.py` (every count recomputed
at build time, so the sheet moves with the data).

## ⭐ THE FRAME — the 1,210 are four problems, not one (item 1)

Measured across 16,480 unified course rows, resolving each row's member subject
codes through `kb/reference/subject_discipline_map.json`: **1,210 rows (7.3%)**
have members landing on more than one MQ discipline. 10,136 (62%) land on one,
and 5,134 (31%) on none — those last are the discipline-**blank** worklist's
population, never this lane's.

| kind | rows | what it is | treatment |
|---|---|---|---|
| **D** | 400 (33%) | a 1-2 character subject code is one of the signals | a DEFECT — gate it, do not cross-list |
| **C** | 535 (44%) | candidate genuine dual home | cross-list through `xdisc` |
| **B** | 168 (14%) | a specialization inside its parent | nest the VOCABULARY |
| **A** | 107 (9%) | one discipline under two official CO names | alias to one form |

Both exits Sam named are right, for different kinds. A single ruling over all
1,210 would record *Advanced Golf* as an Ethnic Studies course with a second
home rather than as the mapping error it is.

⚠️ **The classification is provisional.** A and B are named from pair lists in
the generator; C is the remainder. Re-derive before trusting a per-kind count.

## ⭐ ONE DISCIPLINE STAYS PRIMARY, FOR COUNTING (item 7)

`disc` is the one primary; `xdisc` serves display and search. This is the shape
Rule 7 already uses for TOP — **gate identity on one signal, keep the second for
display** — and it is what lets a cross-list ship without touching a counting
surface.

The blast radius if it did not hold: `unified_courses_data.js` feeds the
`unified-courses` tab and ten scripts, among them `kb/_build_ccr_sky.py`,
`kb/_build_ccr_atlas_extract.py`, `kb/_build_discipline_blanks_worklist.py`,
`kb/_esl_ladder_relevel_dryrun.py` and `kb/_merge_candidate_queue.py`. A course
carrying two disciplines with no primary makes every discipline count ambiguous
at once.

## ⭐ A CROSS-LIST NEVER TRIGGERS A RE-MINT (item 8)

An M-ID's prefix follows its PRIMARY discipline's canonical SUBJ4. Adding
`xdisc` leaves the identifier alone; only a change of PRIMARY enters the
[re-mint playbook](../../coursecontrolnumber_remint.md).

Keeping those apart is what makes a cross-list pass affordable across hundreds
of rows: **a cross-list is reversible and a re-nest is a re-mint.** 59 of the
1,210 already carry a C-ID rather than an M-ID, so a renumbering there reaches
outside our own staging layer.

## The field already exists

`xdisc` carries **9 rows** today and works. *Work Experience Education* carries
**105 disciplines** because it genuinely is taught in all of them, and
*Undergraduate Research Experience* carries 10 — the extreme case is already
handled. `cross_listing_group` sits on the CCR seed (`kb/common_courses.json`).

## Item state

| # | item | state |
|---|---|---|
| 1 | the four-kind frame | ✅ recorded here |
| 2 | a 1-2 char subject code never decides a discipline | ✅ **landed** #1653 — `discipline_for_modal()` + `mint_token()` in `kb/_seed_coci_minted_mids.py`, `tests/mid_short_code_gate_test.py` |
| 3 | re-mint the 31 mis-prefixed ETHS identities | ⛔ **NEEDS SAM** — changes stored data under the playbook |
| 4 | alias Kinesiology / Physical Education | open — **smaller than the sheet implied**, see below |
| 5 | nest the specializations on the vocabulary | open |
| 6 | cross-list kind C through `xdisc` | open — waits on 1, 5, 7 |
| 7 | one primary for counting | ✅ recorded here |
| 8 | a cross-list never re-mints | ✅ recorded here |
| 9 | the orphan-parent worklist | ✅ **landed** #1655 — `kb/orphan_parent_worklist.json` |
| 10 | who may add a cross-list | ⛔ **NEEDS SAM** — a new write surface, Rule 10(a3) routes it through Governance |
| 11 | KIN/PE/ATHL C-ID and CCN fallout | ✅ **landed** #1654 — [`reference-kin-pe-athl-identifier-fallout`](../../kb-notes/reference-kin-pe-athl-identifier-fallout.md) |
| 12 | the first sitting: 50 from kind C | open — waits on 1 through 7 |

⚠️ **Sam pressed Complete with NOTHING individually ruled** — `ruled: 0,
as_proposed: 12, through: null`. Under opt-out the twelve proposals are handed
over and none of them is a ruling, which is why 3 and 10 are held: one changes
stored data, the other is a decision-rights change.

## ⚠️ Item 4 is one map entry, not 107 rows

The identifier-fallout analysis found that **zero rows carry
`disc == "Physical Education"`** — all 1,177 disciplined rows in that space read
Kinesiology. The pairing that makes Kinesiology/Physical Education the dataset's
commonest lives entirely in `subject_discipline_map.json`, where the local code
`PE` maps to Physical Education across 234 rows. The fold has already happened
where it counts.

## ⚠️ The defect kind D is concrete, and partly unrepaired

`ES` maps to Ethnic Studies and appears on 82 rows, but at many colleges it
means **Exercise Science**. 31 of the 226 ETHS-prefixed M-IDs are physical
activity courses — *Advanced Fencing*, *Swimming for Nonswimmers*,
*Intercollegiate Track*, *Advanced Golf*. Two read `subj=['PE']`, so the prefix
disagrees with the row's own mapping. Both senses are genuinely present
(*Introduction to Racial and Ethnic Groups* carries `ES` too), so the code
cannot be resolved without reading the title.

Item 2's gate stops FUTURE mints from repeating it. **The existing 31 stay wrong
until item 3 is ruled.**

## Next

1. Sam's word on 3 and 10.
2. Items 5 and 4 — both vocabulary edits, and 5 is what item 6 sits on.
3. Item 6, then the item-12 sitting at 50 rows from kind C.
