---
title: "Discipline cross-listing — nest, alias or carry two homes — lane state"
created: 2026-09-22
updated: 2026-09-29
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
| 3 | re-mint the mis-prefixed ETHS identities | the 31: **ruled** (open-asks card 1, 2026-09-22), ✅ **applied** 2026-09-28 (S296), `kb_curation` re-keyed · the 43 beyond them: **ruled** (sheet 3 card 3, 2026-09-29), ✅ **applied in git** 2026-09-29 (S302); their `kb_curation` re-key runs after the merge · the 42 merged ones stay on their ids (the same ruling). Detail below |
| 4 | alias Kinesiology / Physical Education | open — **smaller than the sheet implied**, see below |
| 5 | nest the specializations on the vocabulary | open |
| 6 | cross-list kind C through `xdisc` | open — waits on 1, 5, 7 |
| 7 | one primary for counting | ✅ recorded here |
| 8 | a cross-list never re-mints | ✅ recorded here |
| 9 | the orphan-parent worklist | ✅ **landed** #1655 — `kb/orphan_parent_worklist.json` |
| 10 | who may add a cross-list | **ruled: sessions first** (open-asks sheet card 2, 2026-09-22) — sessions write under a cohort receipt; curators after Governance maps a surface, Rule 10(a3). The curator surface goes through Governance together with the `cpl_occupation_match` queue (Sam, 2026-09-27, open-asks card 6) |
| 11 | KIN/PE/ATHL C-ID and CCN fallout | ✅ **landed** #1654 — [`reference-kin-pe-athl-identifier-fallout`](../../kb-notes/reference-kin-pe-athl-identifier-fallout.md) |
| 12 | the first sitting: 50 from kind C | open — waits on 1 through 7 |

⚠️ **Sam pressed Complete with NOTHING individually ruled** — `ruled: 0,
as_proposed: 12, through: null`. Under opt-out the twelve proposals are handed
over and none of them is a ruling. Items 3 and 10 went on to the standing
open-asks sheet, where both are ruled (below).

## ⚠️ Item 4 is one map entry, not 107 rows

The identifier-fallout analysis found that **zero rows carry
`disc == "Physical Education"`** — all 1,177 disciplined rows in that space read
Kinesiology. The pairing that makes Kinesiology/Physical Education the dataset's
commonest lives entirely in `subject_discipline_map.json`, where the local code
`PE` maps to Physical Education across 234 rows. The fold has already happened
where it counts.

## The defect kind D: `ES` read as Ethnic Studies

`ES` maps to Ethnic Studies and appears on 82 rows, but at many colleges it
means **Exercise Science**. Both senses are genuinely present (*Introduction to
Racial and Ethnic Groups* carries `ES` too), so the code cannot be resolved
without reading the title.

Item 2's gate stops future mints from repeating it, and item 3's two re-mints
moved 71 existing ids off ETHS (below). Two groups keep the prefix: the three
stand-alones held for want of a second signal, and the 42 ids merged under
Kinesiology-family parents, which Sam ruled stay on their ids.

## Items 3 and 10 are ruled

Items **3** and **10** were cards 1 and 2 of [the 2026-09-22 open-asks sheet](https://claude.ai/artifact/FTEhLfMxhRfv4YH6DGSPhn).
Sam completed it that day with his last input on card 18, and under his
high-water rule (*"the last item showing some sort of input is an indicator that
everything prior to it is good to go as is"*) both stand as proposed: re-mint the
31 under the playbook, and sessions write cross-lists under a cohort receipt until
Governance maps a curator surface. Read from the sheet's store on 2026-09-27; the
lane recorded neither for five days, which kept both on the standing sheet.

## Item 3: what the re-mint moved

`kb/_eths_remint.py` routes each row by its members' title under the KIN/PE
pass-2 rules (adapted to PEDS, intercollegiate to ATHL, the rest to KINE),
requires a second signal beside the title (a kinesiology member code, a 0835 TOP
corroborating, or a child already merged under KINE/ATHL/PEDS; ES never counts),
and allocates keep-number, then gap-fill. Each ruling pins its ids (`RULED`,
`RULED_43`); V0 re-measures them, counting a moved id by its stamp, and
`--apply` admits the two ruled scopes and nothing else.

**The 31** (Sam, 2026-09-22) moved on 2026-09-28: 26 to KINE, 4 to ATHL, 1 to
PEDS, with 61 merge pointers, 23 curation keys, one articulation, two identities
keys and one CR/NC mirror following them; the fresh read of the 90 live
`kb_curation` rows matched the overlay (md5 on both sides). KINE's band 1 held
995 of 999 numbers, so 22 of the new ids opened **continuation band 2**
(`KINE M2001`–`M2022`, Sam's card 11, 2026-09-03). Two notes ride that receipt:
M1135's curated title says *Adapted* where its members' title does not (it
routes KINE), and M1220 is also listed as PSY 121 at Cuyamaca, a cross-list for
item 6.

**The 43** (Sam, 2026-09-29, sheet 3 card 3, *remint*: re-mint them the way the
31 moved, and the 42 merged ones stay). The card's 31 counted corroborated rows
only; the same defect reached 40 ETHS stand-alones and 3 corroborated rows the
title list missed. 40 moved on 2026-09-29 (S302), receipt
`kb/eths_remint_out/2026-09-29/standalone+missed/`: 32 to KINE, 7 to ATHL, 1 to
PEDS. The 37 stand-alones gap-filled in band 1's stand-alone codes
(`KINE M12OH`–`M12UM`, `ATHL M11FJ`–`M11FP`, `PEDS M10EO`); 31 of those codes
belonged to ids an earlier re-mint moved away, a reuse the prefix fold made 71
times and the 31 once. The 3 corroborated rows continue band 2
(`KINE M2023`–`M2025`), and 3 curation keys, 3 merge pointers, 1 identities key
and 1 CR/NC mirror followed them. The fresh read of the 7 live `kb_curation`
rows matched the overlay (md5 `4c8cf052` on both sides, nothing on a new id, no
pending merge confirm); fold-verify still reads its 7 held rows and
`subject_collision_signal` holds at 113. Three hold with no second signal beside
the title: `ETHS M10LH` *Beginning Fitness for the Newcomer* and `ETHS M10PP`
*Individualized Sports Conditioning* (both carry the Ethnic Studies TOP 2203.00)
and `ETHS M90AB` *Exercise for Developmentally Disabled* (TOP 1222.00).

Three routes follow the pass-2 rule (the title routes, TOP only corroborates)
and may look odd to a curator: Grossmont's *Advanced Techniques and Strategies
of …* family splits between ATHL (six titles say *Intercollegiate*) and KINE
(Baseball, Football, Softball, Water Polo); *Athletic Competition* carries the
intercollegiate TOP 0835.50 and lands on KINE beside *Concepts of
Intercollegiate Athletic Competition* on ATHL; and *Technical Analysis and
Theory of Football - Defense* lands on KINE while its Offense twin sits merged
under `ATHL M1320`.

## Next

1. **The 43's `kb_curation` re-key, after the merge and before the next cron's
   curation sync:** dispatch `supabase-rekey.yml` with
   `alias_map_path=kb/eths_remint_out/2026-09-29/standalone+missed/alias_map.json`,
   read `kb_curation` back (0 rows on the 40 old ids; 4 rows on
   `KINE M2023`–`M2025` and 3 `merge_into` pointers at them), then dispatch
   `daily-dashboard.yml`.
2. Items 5 and 4 — both vocabulary edits, and 5 is what item 6 sits on.
3. Item 6, then the item-12 sitting at 50 rows from kind C.
