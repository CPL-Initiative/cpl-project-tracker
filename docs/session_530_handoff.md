---
title: "Session 530 handoff: the Fact Sheet's labels and Request Quick Adopt, the vault indexers' race behind Sierra's Cabrillo miss, Sheet 144 asks for the printed units as a floor"
date: 2026-10-30
session: 529 (SkyKiwiberry, Sam's session; updated 18:15Z after Sheet 144's answer)
tags: [handoff, fact-sheet, sierra, vault-index, program-requirements, decision-sheet]
status: current
---

# You are Session 530

Your moniker is **SkyBuffaloberry**. Session 529 (SkyKiwiberry) was Sam's session, opened at 15:27Z on 2026-10-30, Summit day, from handoff 529. This is a **light checkpoint**: lanes moved (EACR, Sierra corpus, the harvest), no roadmap row moved, and no re-mint or Rule 10 data receipt was written. It skipped `kb/README.md`, `README.md`, the pipeline view and a KB note (none crossed the bar).

## What shipped

- **cpl-project-tracker#2585** (open at checkpoint, `test` running; merge on green):
  - **A. Fact Sheet Curate edits the Contents labels and the held-back prose; links and section headings stay out of reach.** Each Contents link is a text-only block keyed by its href. The `#progress` lede and `#statewide-exhibits`' own prose are now editable. A box save keeps every link's address (`lockLinks`) and refuses one that adds or drops a link. Guard `tests/factsheet_edit_labels_links.test.js`.
  - **B. Request Quick Adopt on each statewide credit recommendation.** The generator records each authoritative rec's exhibits (`eids`). `fact-sheet/_build_statewide_recs.py` keeps the first one the verified file lists. The renderer takes the address from `map_links.js` (`CPL_MAP_LINKS.url`). Today 277 of 419 recs carry an ID, from credentials with a single exhibit; the rest follow once the daily run carries `eids`. The workbook and Sierra's MAP LINKS line now say Request Quick Adopt needs no sign-in.
  - **C. Sierra and a named college's funding section.** The funding note heads each institution by its full name. cpl-chat reads a named college's section by heading for a funding question, live at the next deploy.
- **samueltlee/CPLBrain#556** (merged): the vault's two indexers share one concurrency group. Unchanged files are skipped before embedding, and a document's checksum is written after its sections. This was the cause of Sierra's Cabrillo miss: 47 of 118 sections had survived a race. The index was rebuilt at 16:03Z (187 of 187), and live Sierra then answered the Cabrillo question correctly (`sierra-ask.yml` run 41088491453).
- **[Open Asks Sheet 144](https://claude.ai/artifact/GdPHNqvw8bEkiemyf51qzV)** (`2026-10-30-open-asks-144`, published 16:24Z, store empty at publish, current; CPLBrain#557, #558):
  - Card 1 is the address card, carried.
  - Card 2 asks about the printed units as each list's floor. The 44 records his *printed* ruling would unpass were mostly faithful: the list prints the low end of a range the program total carries. The floor reading passes 176 failing and 28 incomplete records and fails 13. The ruled reading passes 218 and 27 and fails 44.

## Open work, in order

0. **If you are the night's first firing, dispatch the dashboard run** (scheduled_sessions step 0). Then **read `queue_todo_done`** (step 5).
1. **Land #2585** if still open: `test` green on the newest head, then squash-merge. Then **dispatch `daily-dashboard.yml`** so `statewide_data.js` carries `eids` and `fact-sheet/statewide_recs.js` rebuilds, and check that the recs with an `id` rise past 277.
2. **Sam ruled Sheet 144 at 17:50Z** (both his own call): card 1 *later*, card 2 *floor*. S529 built *floor* after this handoff was first written: `block_units` floors a choose-courses list at its printed units (`block_units_summed` keeps the reading before it; guard checks in `tests/program_requirements_pilot_test.py`). `kb/_program_requirements_floor_rescore.py` rescored 206 filed records (161 unequal and 28 incomplete to equal, 12 equal and 5 incomplete to unequal). **The live rows are not moved:** the repo's Supabase guard denied the UPDATE. **Read [Open Asks Sheet 145](https://claude.ai/artifact/AcUTgzPhosmbn3tN8WSbd7)'s `replies` first** (card 1 the address, carried; card 2 the apply). On *migrate*, commit the receipt's `apply_one` (`kb/receipts/program_requirement_records_floor_rescore_2026-10-30_s529.json`) through `kb/migrations/.apply` and read back the four counts; on *pasted*, read the live rows back. Then dispatch the display build. Six of the 12 that now fail are misread list figures (lessons S529); a reread of each is cheaper than any rule.
2b. **Sam's ask at 17:5xZ: exhibits listed with no credit recommendation should leave the Fact Sheet's statewide lists.** S529 measured it: 19 of the 132 hand-typed list entries show none. Two are CCC exhibits MAP holds with no recommendation (NCCER CORE, DLPT Russian). Eight are Carpenters apprenticeship crafts under their old titles, and their recommendations sit under MAP's current ones ("Carpenters Apprenticeship — Acoustical Installer"). Nine don't match any title in the data (OSHA 10 and 30 with experience, Advanced GTAW, AWS SysOps, Cisco CyberOps, HRCM 001, Carpentry, Hardwood Floor Layer, Modular Installer). The proposed fix is to draw each program area's list and counts from `fact-sheet/statewide_catalog.json` (164 exhibits, 154 with recommendations, rebuilt daily), showing only exhibits that carry one. Proceed if Sam said go in chat.
3. **Glendale is parked** (to-do `glendale-parked-2026-10-30`). **The next college is Los Angeles Valley**, 114 of 204 passing. Run the unpriced-codes query, sort the unequal by whether every course is priced, and read each record's own block names before any page (lessons S529).
4. **A cpl-chat deploy is held for Sam's go.** It carries the named-college funding read (#2585), the Request Quick Adopt wording, and #2571's smoke change. Run the preview A/B first.
5. **Sierra and the funding data (Sam, 10-30, held for his go):** her funding note is whole again. The internal tab's reviewer-only data stays out of her corpus unless a card rules otherwise.
6. **Carryover:** the rest of the public-views MAP-link sweep (`college_cpl_workbook.js` and `statewide_interactive.js` still build the address themselves); Sierra's first-text latency; `credential_alignment_for_college`; the college short-name editor and the public page's Contents; the lints' checkout time.

## Sam's decisions this run

None new. His asks of 14:20Z and 14:25Z (handoff 529) are built. His Sheet 143 card 2 ruling (*printed*) is carried to Sheet 144 card 2 as a measured alternative, not acted on.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S529*), `docs/reference/lanes/program-requirements-harvest.md`, `docs/reference/lanes/sierra-retrieval-corpus.md` (*A named college's funding section*).

## Lessons to honor

- **Measure the index before blaming retrieval.** Count `cpl_document_sections` per document and read `max(chunk_index)`; a gap is a write race or a cut-off run.
- **Read a record's own block names before its page.** They sorted 44 records into three kinds at no cost.
- **Don't print a receipt to the terminal.** One rescore receipt cost about 15k tokens of context.

## Let go

S529 drops its subscription to #2585 at sign-off and holds no check-ins. Sheet 144's artifact watch is named here for the next session to take up. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires on its schedule.
