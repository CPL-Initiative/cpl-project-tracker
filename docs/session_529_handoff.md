---
title: "Session 529 handoff: Glendale's unequal sums read against their pages; Sheet 143 asks which number a printed list counts"
date: 2026-10-30
session: 528 (SkyMulberry, Sam's session)
tags: [handoff, program-requirements, glendale, decision-sheet]
status: current
---

# You are Session 529

Your moniker is **SkyKiwiberry**. Session 528 (SkyMulberry) was a session Sam opened by hand at 12:00Z on 2026-10-30, Summit day, after the 11:12Z firing (S527) had merged #2578. This is a **full checkpoint**: the run wrote a data receipt (one Glendale reread) and published a decision sheet. It skipped `kb/README.md`, `README.md` and the pipeline view (none moved), and no KB note crossed the bar. S527 kept working with Sam in parallel and merged #2581 (the stopping rule; Glendale parked) at 13:16Z; this handoff follows its handoff 528.

## What shipped (PR #2579, open: draft until `test` passes)

- **Of Glendale's 46 unequal records, 29 price every course.** Two free page reads (41054044039, 41055644846) put 15 of them in the catalog's words. Photography, Digital Content Specialist and Biotechnology add up as the catalog prints them (faithful records, no step). The language pairs' elective applies only "if 20 units have not been reached". Details: lessons *S528*.
- **Foreign Languages 39406 was a misread, now fixed in shape:** `force=39406` (41055650373) extracted its two printed lists (10 units from one language, 8-10 from another); reread 41057000899 replaced the one row (receipt `kb/receipts/program_requirement_records_college_reread_glendale_community_41057000899.json`, read back live). It still sums 12-20, because the scorer adds a choose-courses list's courses.
- **`kb/_block_total_reading_measure.py`** measures, with no write, what changes if a list's printed units count instead: 218 unequal and 27 incomplete would pass statewide, 44 passing would fail; the narrower reading 91 and 30.
- **[Open Asks Sheet 143](https://claude.ai/artifact/LYq7MAnGSyX8ymKDu7BXRo)** (`SHEET_ID` `2026-10-30-open-asks-143`, published 12:52Z, store empty at publish, current): card 1 an address without github.io (carried from 142), card 2 which number a printed list counts (proposed: the printed units, after reading the 44 against their pages). The builder card is `harvest_card_143()` in the vault, with its fixture.

## Open work, in order

0. **If you are the night's first firing, dispatch the dashboard run** (scheduled_sessions step 0). Then **read `queue_todo_done`** (step 5): a to-do Sam marked done is your first item.
1. **Sam ruled Sheet 143 at 12:58Z, both his own call:** card 2 *printed* (a choose-courses list's printed units count, statewide), card 1 *later* (carried to Sheet 144, built, not published). Carry out card 2 as proposed: read the 44 records that would stop passing (`python3 kb/_block_total_reading_measure.py` names them) against their pages, then change `block_units` in `kb/_program_requirements_score.py` with a guard test, rescore, and apply with a receipt. Land #2579, CPLBrain#554 (after it) and #2582 (the Fact Sheet) if still open: `test` green on the newest head, then squash-merge.
2. **Glendale is parked** (Sam's stopping rule, S527, #2581): its to-do `glendale-parked-2026-10-30` names what restarts it. Do no Glendale work unless that to-do is marked done; S528's reads of its unequal pages (lessons *S528*) stand ready for that day.
3. **The next largest gap: Los Angeles Valley College**, 114 of 204 passing (then Monterey Peninsula, Las Positas, De Anza). Run the unpriced-codes query, sort the unequal by whether every course is priced (lessons *S528*), and read one failing record against its page before any step. Two sessions under 3% each parks a college.
4. **Sierra and the funding data (Sam, 10-30, held for his go):** she reads the funding FAQ and the vault note's max awards, never an institution's conditions, JST figure or Funds Qualified So Far. S528's proposal: `scripts/funding_sierra_note.js` writes one section per institution with those (the public page's own figures; `cpl_funding_performance.js` `vet_jst`, the anon participation and coordinator reads), and the vault's funding-note workflow re-indexes it. The internal tab's reviewer-only data stays out of her shared corpus unless a card rules otherwise.
5. **Sam's Quick Adopt ask (Sierra lane):** links for courses not yet approved; a Sierra deploy, after the Summit unless he says sooner.
6. **Carryover:** Sierra's first-text latency (22 s on the Bakersfield turn); `credential_alignment_for_college` as the next slow read; the college short-name editor and the public page's Contents (after the Summit); the lints' checkout time (about 2 min a job).

## Sam's decisions this run

Sheet 143 (12:58Z): card 1 *later*, card 2 *printed*. He also noted that from his phone he cannot see the scheduled sessions, which is why his greeting named Session 526 after S526 and S527 had run.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S528*, *S527*), `docs/reference/lanes/program-requirements-harvest.md`.

## Lessons to honor

- **Sort the unequal by whether every course is priced before reading any page.** The priced ones are the reading's; the rest are a units step.
- **A record that sums to its courses against a different printed total may be the catalog's arithmetic** (Photography: "18 units" over 27). Read the page before any `force=`.
- **A page read prints about 25 pages;** keep the span under that.

## Let go

S528 drops its subscription to #2579 and its check-ins at sign-off; the artifact watch on Sheet 143 is named here for the next session to take up. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires again at 13:12Z.
