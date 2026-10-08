---
title: Session 346 handoff — Sam's three asks from the harvest tab, then card 4 and the maps
date: 2026-10-08
session: 345 (SkyLantern)
tags: [handoff, program-requirements-harvest, cpl-pathways, roep, decision-sheets]
status: current
---

# You are Session 346

Your moniker is **SkyCairn**. SkyLantern (S345, `session_01TdCLUUrvNopovd2XJAzCkp`) was a Sam-driven session. Sam opened
it with S344's moniker; the CPL Queue routine had already run S344 that morning, so S345 worked from handoff 345.
**The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) reads `enabled: false` since 16:33Z on 2026-10-08**, about
when Sam opened S345. It is Sam's to turn back on; if a routine run starts you, follow
`docs/reference/scheduled_sessions.md`.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`). S345 let go of everything at sign-off (end of this file).
2. **No sheet is open.** [Open Asks Sheet 50](https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr) was answered in full
   (17:15-17:18Z) and its rulings are in both lanes and `cpl_memory` (`sam-sheet50-rulings-2026-10-08`). The next ask
   gets Sheet 51, under a fresh `SHEET_ID`, with a NEEDS SAM on its lane; the Progress view links each call to its card.
3. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `cpl-pathways`, `decision-sheets`. Read
   `sam-sheet50-rulings-2026-10-08`, `sam-calls-link-from-the-tab-2026-10-08`,
   `sam-cpl-pathways-college-selector-2026-10-08` and `mtsac-gps-sequences-by-local-code-2026-10-08`.
4. **Library briefs:** `cpl_library` rows with status `requested` (none on 2026-10-08).

## Priority 1: Sam's mock-up, flags and confirm on the Program records view

Sam, sheet 50 cards 1-2: *"Would it be more clear to add a note or flag to the items where there is a question or
mismatch and a way to confirm or curate from the tab?"* Mock it up as a Claude artifact on First Light, from the two
unchecked records: Irvine Valley Art A.A. 10265 (ARTH 25 and 26 printed where the state's file lists ARTH C1100 and
C1200; ARTH 4, 25, 26, 28 printed and off the state's list) and Santa Monica Barbering A.S. 43767 (COSM 11C printed as
Salon Management, which is COSM 64; COSM 95D missing from Salon Experience). Each flag on its block, naming its owner
(the college, or our reading procedure) and its draft for the college; the record carries **Confirm** and **Needs a
fix** (with a note). Confirming writes `program_requirement_records.checked` from the tab: a new write surface, so the
mock-up names the write path (a guarded function with history, a signed-in reviewer) and goes to Sam as a Sheet 51 card
before anything is built (Rule 10 a3; his 2026-10-04 ruling that the tab needs no Governance pass covers the read view).
Both records stay unchecked until then.

## Priority 2: card 4, then Mt. San Antonio's two maps

Sheet 50 card 4, as proposed: a map passes when the listed courses it names outnumber its off-list ones, and each
off-list course shows as the college's recommendation outside the program. Build: `accepts()` in
`kb/_program_map_parse.py` (and its test), mark off-list items in `record()`, carry the mark through
`kb/_build_roep_display.py` `term_map()` and CPL Pathways' read map (`roepReadMap`, words, no glyph), rebuild
`mtsac_03086`. Then file the Early Childhood Education map (local S0401, the state's 33876; run 37812133411 printed it:
seven terms, all 12 listed CHLD courses): source `sequences/sources/mtsac_gps_s0401.json` in the shape of
`mtsac_gps_n0486.json`, closed list from `sources/mtsac_33876.json`, a `PROGRAMS` entry. Both are checked programs, so
the regenerated page data rides the PR and the live display write waits for a go on Sheet 51.

## Priority 3: CPL Pathways, a college selector (Sam)

*"need to maybe have another selector that allows to narrow the current pathways selector to a college selected... for
other purposes, we'll want to first select a college and then the pathways they offer."* In `cpl_pathways.js`
`buildSelector()`: a College select before the pathway select (All colleges first, then every college the items name,
sorted), which rebuilds the pathway options to that college's featured, directory and catalog-record items and keeps the
groups; All colleges is today's view. Label both, keep the choice in the URL hash only as a bare token if at all, add the
jsdom test and the a11y target, and show Sam the result (a mock-up first if the layout changes).

## Priority 4: the refused colleges' own pages; then the addenda

24 of 32 published maps sit on refused mapper hosts. A refused map counts as settled once the college's procedure names
the other routes tried (sheet 50 card 5, built). So for each refused college: one web search for its own program maps or
suggested sequences, a read plan only where a page off the mapper host turns up, and a procedure v2 recording the
routes tried either way. Los Rios: one `mapmaker.losrios.edu/Maps/<id>/PublishedPdf` read. Las Positas: one Pathway
Student Success Team page. The addenda reading agent follows the 2026-10-11 census apply.

## What shipped (S345)

- **#1908 (merged, squash 83e8663):** map plans for sixteen colleges in four reads; the registry's map columns for
  twelve colleges (17:00:03Z); twelve v1 procedures (17:03:10Z), so 19 of 118 colleges hold one; Mt. San Antonio's page
  shape in the map parser; the Progress view's links on each call and its read-found maps. Receipts `kb/receipts/*s345*`.
- **Vault #273:** Open Asks Sheet 50 and its retirement.
- **This checkpoint's PR:** the maps milestone counts settled maps (card 5), the lanes, lessons S345, the memory rows.

## Decisions Sam made this run

- The tab links each call to its sheet card and to where the item is seen (*"If you can embed the links on the tab, it
  would be fantastic"*). Sheet sources stay in the vault; the tab links the published sheet (*"No, your plan sounds good
  to me"*).
- Sheet 50: cards 1-2 follow up (the mock-up above), card 3 pasted (the Library record at version 50), cards 4 and 5 as
  proposed.
- CPL Pathways gets a college-first selector (Priority 3).
- *"checkpoint and we'll move to next session to continue the work, which is looking fabulous, BTW!!!"*

## Waiting on Sam

Nothing on a sheet. Outside one: connect the Microsoft 365 connector (RCCD account) so a session can confirm his 16
SharePoint copies; drop the Summit v2 MP4s into the SharePoint Drafts folder; the CPL Queue routine is off.

## Patterns that worked

- **Search first, then one plan per college, pushed in batches.** A push reads only the plans its last commit changes,
  and the workflow holds one run plus one pending.
- **Match a college's published sequence by the local code its catalog prints in the program's title** (lessons S345 3).
- **Write many procedure records in one `select ... union all`** through `program_source_procedure_set`.
- **Answer a sheet's Complete comment in its thread, then resolve it**; execute the verdicts the same turn.

## Safety patterns

- A call on the Progress view is a card on a sheet, and its lane carries the NEEDS SAM.
- `apply_migration` on `cpl_library` times out (four of four); send that table's writes as a paste card.
- Run `bash scripts/check_generated.sh` without a pipe: `| tail` hides its exit status.
- `cpl_memory.summary` holds at most 400 characters; Sam's full words go in `detail`.
- Filing an accepted map for a checked program changes its display: the live write needs a go.

## What S345 let go of at sign-off

PR subscriptions: CPL-Initiative/cpl-project-tracker#1908 (merged), this checkpoint's PR and samueltlee/CPLBrain#273
(state named in the sign-off message; subscribe to any still open). Check-ins: none pending. Artifact watch: Open Asks
Sheet 50's, turned off.
