---
title: "Program requirements harvest lessons — archive 4 (S419 onward)"
created: 2026-11-08
updated: 2026-11-08
tags: [lessons, archive, program-requirements, catalog-harvest]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - docs/program_requirements_harvest_lessons.md
  - docs/program_requirements_harvest_lessons_archive_3.md
---

# Program requirements harvest lessons — archive 4

Sections moved verbatim from `docs/program_requirements_harvest_lessons.md` to keep it under its budget.

## Moved from the lane (S419 compaction)

**Crafton Hills and Taft (S412-S413)** read by the SmartCatalog walk (index, then a subject or group page, then the program page): Crafton 76 of 79 found and loaded, 51 passing the machine checks, Japanese unfound; Taft 58 of 63, 24 passing (most arithmetic failures read the page's 60-unit degree total as the major's). **Merced (S414):** 154 of 172 found, 153 loaded, 125 passing ($9.14). **The slash rescoring (S414)** replaced Glendale's 14, De Anza's 12, Los Angeles Trade Technical's 5 and Crafton Hills' 2 by free reconcile runs. **A printed degree floor (S415):** Delta's steps read "Minimum Degree Units Required: 60" as `degree_total_minimum`, and the scorer lets a floor alone make up a short sum (152 to 154 passing, 71 reread); Taft's step sets a transfer degree's Cal-GETC to the statewide 34 (24 to 34 passing, 17 reread; Fable's option A; kept: Sam's Open Asks Sheet 94 card 4, 13:43Z).

**The registry** (`kb/supabase_program_source_registry.sql`, applied live
2026-10-03 as four migrations):
- `program_source_registry`: one row per college in `coci_college_programs`
 (118: 115 with credit programs, the two continuing-education colleges,
 Calbright), keyed by the catalog-data college name, seeded with an https
 homepage from the CEO list. Calbright College Credit has no `map_colleges` id.
 Columns follow the plan's registry table: catalog URL and year, platform,
 format, CMS public view, sequence source and URL, best method, access status
 and notes, trust evidence (Phase 1), the census's evidence and run id, and
 `corrected_by` / `corrected_at` / `correction_note` for a person.
- `program_source_registry_history`: a trigger files every prior row on UPDATE
 or DELETE, naming the census run or the person. A run rolls back from it.
- `program_source_census_apply(run_id, rows)`: the census's only write. A row
 with `corrected_by` set keeps its values; the census files its reading in
 `census_evidence.census_values` and sets `census_disagrees`. Service role
 only. anon and authenticated hold SELECT on the registry and nothing else
 on either table.

**Sam's rulings (2026-10-03):** build our own best version now; the Butte
College Tech Center's COCI ROE fields are a parallel track, never a gate
(*"working on that end is often a slog or dead end"*); start from use cases and
test against real catalog pages; a per-college source registry kept current by
agents; a per-college tab; an agent per college that the college and the MAP
team own and train. S320: "Go" on the registry table as described (its
history, its one write path, a public read); "Approved" on the push that adds
the weekly apply.

## S484 SkyToyon (2026-10-26, the CPL Queue routine): Hartnell's noncredit course hours

- **A Coursedog course carries its noncredit hours under `credits`, as ranges.** Page read 40273805437 (two
  noncredit Requirements tabs, `network_find`): ENGM620 `lectureHours` 80-90 and `labHours` 48-54, ENGM622
  `lectureHours` 64-72 and an empty `labHours`, beside `academicProgressHours` and `financialAidHours`, which are not
  contact hours. The tab's "Non Credit - Total hours · 216" is the sum of the tops (90 + 54 + 72); the bottoms sum to a
  shorter term. So the `course_hours` reconcile kind fills each course of a record measured in hours with the top of
  lecture plus lab, citing the call, and never touches a units record.
- **Reconcile run 40274398240 (free):** six of Hartnell's eight hours records now read `equal` (43607, 43609, 43610,
  43776 at 216; 43608 at 144; 40261 at 108). Two stay incomplete because the answer gives no lecture or lab hours for
  TAC326 (Theatre Performance 44161, 630) and BUS690 and BUS699 (Workforce and Academic Readiness 44574, 432). NEXT:
  a page read with `network_find` on those codes, to see which field carries their hours.
- **A reconcile run re-files every record a step notes, not only the ones it changed.** Seven Hartnell unit records
  came back with only their score bookkeeping changed (the `rescored` marker and the `meets` reason); they were restored
  from the prior commit before `step=reread`, which posts only records stamped with the newest run.
- **The page reader prints 1,500 characters of a body.** A plan's `network_find` now prints the stretch around each
  string it names (six places a string, 600 characters a side), which is how a long vendor answer is read.

## S459 SkyBuckeye (2026-10-23, Sam's session): the meets reading rebuilt and applied; the six rows removed

- **A measured count verifies a rebuild.** S457's scorer change, rescore and receipt died with its container; the PR body
  and lessons S457 kept the rule and its counts (258 program totals, 9 electives-filled degrees, 738 under the wide
  reading). The rebuild was accepted when its own count matched: 258 and 9, Hartnell 7. KB note
  `methodology-a-measured-count-verifies-a-rebuild`.
- **Shape 6 keeps a failing record failing.** 28 of the 258 program totals carry a degree check that still fails
  (`arithmetic.degree`), so their major's meets reading changes nothing the live row says; the rescorer skips them and
  239 moved to equal (run 40024250589; 238 by the proxy count of rows whose check reads equal while the applied display
  still reads unequal). `program_verdict()` now holds the exact, floor and meets readings in one place for the scorer and
  the rescorer.
- **A display build on the branch, the apply on `main`.** `kb/_build_roep_display.py` ran in about two minutes over
  18,550 records (openpyxl present); its receipt names 17,529 programs, Victor Valley 20545 gone with its file.
- **The S456 method, one step per command.** The six rows read in one query whose answer the harness saved to a file
  (101,836 characters); a script checked each `md5(row_text)` and wrote the receipt and the guarded delete; the push went
  through alone (run 40025041285). The filed records placing none (Long Beach City) stay, as S456 left Citrus 11244's.

## S458 SkyLarkspur (2026-10-23, Sam's session): the display apply's one missing row; the six rows read, not removed

- **A display apply fails on a filed record whose live row left.** Victor Valley's Nursing Licensure 20545 left the
  table in S456 (Sheet 115 card 1), but `kb/program_requirements_college/victor_valley/records/20545.json` stayed and
  kept entering every build: runs 39990555422 (17,527 of 17,528) and 39999773855 (17,529 of 17,530) each wrote all but
  that statement and ended in failure on `missing ["Victor Valley College|20545"]`, errors none. The applies did their
  work; the exit code said otherwise. A removal takes the filed record with the row (#2391).
- **The standing rule's six rows were read, not removed.** All six (Hartnell 18353, 19518, 12331; Long Beach City
  43802, 46290; Palo Verde 04436) read live at 19:09Z as `to_jsonb(r)::text` with md5, unchecked, no verdict, their
  builds b0a96907bf83, 25fe751ccd0a and be2635ed5b73, and none in build d45e5d0fcf78. The command that wrote the
  receipt, removed the file and pushed was refused by the session's permission check as one action, and the scratch
  copy of the rows died with the container. Sam then set the harvest aside for the entity visuals; the next wave
  repeats the S456 method one step at a time.
- **A bot's receipt commit on a PR head starts no `test`;** merging `main` into the branch is a session commit that
  does, and the migrate gate skips a merge commit, so the receipt does not re-apply (#2389, #2390).

### Moved from the lane (S607): Siskiyous, Palomar and Coalinga, as they stood

**Siskiyous (S594-S596, #2877): 66 of 73 passing on the current eLumen reader** (73 of 77 found; was 42 of 65). Extraction 42354853403 ($4.86), load 42359009832 (8 inserted), reread 42359184639 (65 replaced; receipt with before-values), display build 6c1c41f71db3, merged (#2877). Display applied on `main` (run 42360530754: 17,555 of 17,558, 0 errors, the 3 missing Monterey Peninsula rows the table no longer holds; record `9c11f641`). The 7 failing are arithmetic; read them before a reconcile.
**Palomar (S599-S600, #2887): 282 of 342 found; Chemistry A.S. 05201 reread** (load 42376077805 kept 281, reread 42376267731 replaced 05201 with before-values). Displayed: apply 42377748161, 0 errors.
**Coalinga (S599-S600, #2882): 55 of 62 found, 45 passing, displayed.** Display apply 42372728141 on `main` wrote 17,557 of 17,560 with 0 errors (the 3 missing are the Monterey Peninsula rows the table no longer holds; record `64577367`). Its 7 not found and 10 failing stand as filed.
