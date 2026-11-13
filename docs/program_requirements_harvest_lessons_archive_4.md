---
title: "Program requirements harvest lessons — archive 4 (S419 onward)"
created: 2026-11-08
updated: 2026-11-12
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

### Moved from the lane (S584)

**Golden West loaded (S547, 2026-11-02):** read 41399075269 (two parts), load 41412025040, **568 rows inserted**, 75 skipped, receipt `kb/receipts/course_outcomes_cccd_41412025040.json` (#2684). Santa Ana's course index landed (#2685). **Its trial (S549, run 41436124244, #2691) parsed 12 of 12 after a reader fix:** report 267 prints the SLO heading alone in its section, and `groups_from_html` returned an empty list there instead of handing off to the text reader; `LEAD` now takes *At the conclusion of*. The 72 earlier filed pages parse unchanged. **Santa Ana loaded (S559, 2026-11-03):** read 41589637097 (four parts), load 41602658602, **1,366 rows inserted**, 7 skipped, receipt `kb/receipts/course_outcomes_sac_41602658602.json` (#2716). **Las Positas loaded (S567, 2026-11-04):** trial 41595084107 parsed 12 of 12; read 41784805869 (three parts), load 41797959686, **505 rows inserted**, 271 skipped, receipt `kb/receipts/course_outcomes_laspositas_41797959686.json` (#2717). **Columbia loaded (S578, 2026-11-05):** trial 41784829925 parsed 12 of 12; read 41979319035 (two parts, both filed in about 30 minutes), load 41984104664, **422 rows inserted**, 0 skipped, receipt `kb/receipts/course_outcomes_gocolumbia_41984104664.json` (#2754).

## S536 SkySugarberry (2026-11-01, 05:12Z firing) and S537 SkyMayberry (10:12Z): Monterey Peninsula 176 to 183 of 197, on `and_units`

- **Page read 41276213077** (plan `kb/college_reads/mpc_unequal_medical.json`): the medical family (03635, 09978, 09979,
  22059, 22083) sums one unit over its printed totals because CourseLeaf prints "CSIS 50 · & 50L MS Office Applications ·
  and MS Office Applications Lab 3", the lecture and lab as one row, and the reading listed CSIS 50L on its own with no
  units, which the scorer priced again from the state file.
- **New reconcile kind `and_units`:** a course the page prints joined to the row above by "&", listed by the reading as
  its own entry with no units, takes 0. Gated on the page printing the two codes joined, the course before it carrying a
  figure, and the reading having given it no units. Guard in `program_requirements_pilot_test`.
- **Reconcile and reread** (41276977991, 41278868382, reread 41280847881, receipt committed): live 176 to **183 of 197**
  (read back 10:55Z by S537). S536 moved 7 of 197, 3.6%: above the stopping rule's 3%, so the college stays open.
- **S536 stopped at 06:27Z with its PR open and no handoff.** Its bot commits never ran CI (`action_required`), and the
  lints then failed on `roep_display_test`: new records filed on the branch need a display build in the same PR
  (`kb/_build_roep_display.py`, build 119388125e9f). S537 merged main into the branch, built, and merged #2635.
  **Lesson: a session's last act before any long wait is the handoff,** even a short one, so a firing that finds the
  PR stale knows what it was doing.
- **Left (14):** coverage 42989, 43858, 44876; incomplete 22049, 33584, 45271; unequal Nursing 03633 (against 72),
  Accounting 22052 (against 35), transfer degrees 32033, 37243, 41831, ASL 39266, and noncredit hours 39202, 45242.

## S535 SkyGooseberry (2026-10-31, the CPL Queue routine, 10:12Z firing): Monterey Peninsula, 110 to 176 passing on three steps

- **Grouped the 87 failing live records by shape before any read:** 25 offer WORK 99, 98 or 97 as an alternative with
  no units (the state file holds 0.5 for the variable-unit WORK 99, so the low end fell 0.5 to 1.5 under the printed
  total); 24 transfer degrees named Cal-GETC with no units; 13 local degrees summed the major and the GE span past 60.
- **Page read 41192128530** (plan `mpc_work_ge_words`, five pages, no model call): CourseLeaf prints "WORK 96
  Professional and Essential Skills 2 · or WORK 99 Career-Focused Work Experience · or WORK 98 ... · Total Units 17",
  units on the group's first row only; Automotive Maintenance adds "2.0 Units of WORK 99 are required". The transfer
  pages print "Complete Cal-GETC pattern and electives, if needed, for a total of 60 transferable units", so the S396
  step keyed on "Certified completion of ... Cal-GETC" never matched the 2026-27 catalog. Local degrees print
  "electives, if needed, for a total of 60 degree-applicable units".
- **Three steps.** New reconcile kind **`or_units`**: an alternative printed as its own "or CODE" row with no units takes
  its parent's units (never one the reading priced, never a parent without units). A second Cal-GETC `set` step on the
  2026-27 words (transfer only). A `degree_total_minimum` set on "electives, if needed, for a total of 60" (Fable
  advised the floor: "if needed" is the minimum construction in other words, Title 5 section 55063; the risk, a major
  whose own units pass 60, does not occur in the thirteen). The college's steps had read associate degrees only; each
  degree step now names its awards, so `or_units` reaches certificates. Guards in `program_requirements_pilot_test`;
  the carry-basis guard in `program_requirements_college_test` lists `or_units` as a block-level kind.
- **Reconcile 41192567009** (free) changed 119 filed records; **reread 41194846700** posted 125, receipt committed.
  **Live: 110 to 176 of 197** (read back 11:02Z). Display build 598ff64220dd on the branch.
- **Left (21):** coverage 42989, 43858, 44876; incomplete 22049 (Horticulture certificate), 33584 (Spanish AA-T), 45271
  (Workforce Skills noncredit); unequal by a unit or two in the medical family (03635, 09978, 09979, 22059, 22083 print a
  total one under the sum), 22052 Accounting (33.5-34 against 35), Nursing 03633 (57.5-63 against 72), the transfer
  degrees 32033, 33586, 37243, 41831, ASL 39266, Nutrition 39463, and two noncredit hours records (39202, 45242).
- **Lesson: a step keyed on last year's words goes quiet when the catalog is rewritten.** The S396 Cal-GETC step cited
  the 2025-26 wording; the reread under the 2026-27 catalog left 24 degrees incomplete with the step in place. When a
  college's step stops firing, page-read one record before writing a new reader.

## S534 SkyChokeberry (2026-10-31, the CPL Queue routine, 09:12Z firing): a list that fills the major, 198 to 202 passing; Los Angeles Valley parks

- **Page read 41188051977** (plans `lavc_unequal_sums`, `lavc_incomplete`, keyed on "State Code NNNNN"): 9 of the 12
  unequal headings and 2 of the 5 incomplete printed. Respiratory Therapy 21899, Political Science 32851, Spanish 32853
  and Business Administration 2.0 35427 print their state code elsewhere or not at all on the heading page.
- **A list that fills the major to the printed total.** Economics A.A. 02984 closes with "COMPLETE 1 COURSE FROM THE
  FOLLOWING FOR A MINIMUM OF 18 UNITS", French A.A. 02965 with "3-5 UNITS CHOSEN FROM THE FOLLOWING FOR A MINIMUM OF 18
  UNITS", Geology A.S. 08560 with "COMPLETE 7–14 UNITS FROM THE FOLLOWING COURSES TO COMPLETE 36 TOTAL UNITS". The
  sum's low end fell short (16, 14, 29) because nothing told the scorer a student keeps taking courses until the total.
  New reconcile kind **`fill_to`**: `block_pattern`'s n marks the list `fills_to`, only where n equals the record's own
  printed total (Kinesiology 32854's "FOR A MINIMUM OF 3 UNITS" is one list's floor); the scorer reads neither end of the
  sum below it. Its `range_pattern` keeps French's "COMPLETE 3-4 COURSES" top as `maximum`, which the scorer's high end takes.
- **Fire Technology A.S. 02981 printed "T otal Minimum Units: 60"** (a split word in the PDF's text), so the three GE
  steps keyed on `Total\s+Minimum` missed it and the degree read incomplete. They read `T\s?otal` now.
- **Reconcile 41188677929** (free) rescored exactly the four: 02984 18-21 equal, 02965 18-25 meets, 08560 36-43 meets,
  02981 19-23 equal. Reread 41189100032 posts them. **Live: 198 to 202 of 215.**
- **The stopping rule parks Los Angeles Valley** (S533 moved 2, S534 4; both under 3% of 215). Its call
  `lavc-parked-2026-10-31` is in the status file. **Left (13):** 8 unequal (21899 prints 74 over its own 62; 30699
  read the 2.0 page; 32410 and 35526 and 43774 point a list at "any course not used in LIST A"; 33593, 33629; STEM
  41492 and 41493 print 18-21 over lists that sum 15-21) and 4 incomplete (32117's List C is "Any course from LIST A or
  LIST B not already used"; 32851, 32853, 35427 unread). **Next college: Monterey Peninsula, 87 failing of 197** (Glendale, 105, is parked; failing means not equal or unstated, or a coverage or invented check failing).
- **Lesson: read the list's own heading for a fill.** A sum short of the printed total by a varying amount, while the
  degree adds up, is often a closing list worded "for a minimum of N" or "to complete N total units".

## S533 SkyNannyberry (2026-10-31, the CPL Queue routine, 07:12Z firing; finished by the 08:12Z firing): Music's repeatable lists, 196 to 198 passing

- **Two arithmetic failures were one missed repeat.** Music A.A. 02962 and Commercial Music A.A. 08545 print
  "COMPLETE n COURSES FROM THE FOLLOWING: (COURSES MAY BE REPEATED)". The reading kept each list's count and took each
  ensemble once, so the high end fell short (33-33.5, 35-35.5). The `repeat` step's `block_pattern` now also takes a
  block whose minimum already equals its n, and Los Angeles Valley gets the step. Rescored, 33-35 and 35-36, the totals
  the catalog prints. Music A.A.-T 33615 is unchanged. Guard in `program_requirements_pilot_test`.
- **Reconcile 41179958796, reread 41180348558:** 2 replaced, both pass the machine checks (read back 08:20Z: coverage,
  invented and arithmetic `equal`). **Live: 196 to 198 of 215.** Display build 8603831048ac carries them.
- **The 07:12Z firing stopped after the reread** (its last push 07:24Z, no handoff). The 08:12Z firing found the PR idle
  50 minutes, built the display and the checkpoint on its own branch, and closed #2606 with a pointer. Bot pushes to a
  PR branch leave `test` at `action_required`; a session's own push is what runs CI.
- **Left at LA Valley (17 failing, read live 08:22Z):** 12 unequal (02965, 02984, 08560, 21899, 30699, 32410, 33593,
  33629, 35526, 41492, 41493, 43774; 30699 read the 2.0 page, Anthropology 32410's lists repeat, Respiratory Therapy
  21899 prints 74) and 5 incomplete (02981, 32117, 32851, 32853, 35427).

## S532 SkyHackberry (2026-10-31, the CPL Queue routine): Los Angeles Valley's T & M, 186 to 196 passing

- **The ten Engineering and Manufacturing coverage failures were one prefix.** Each record placed every course its page
  prints; the missing ones were the shop courses the catalog prints as "T & M 027" through "T & M 032", which the state's
  file keeps as TM027 through TM032 (same numbers, units blank in the file). Read from the live records and
  `coci_program_courses`, no page read needed: the records came from their own State Code headings (run 41141747238).
- **`prefix_aliases {"T & M": "TM"}`** on the college's reconcile entry. A local rescore of the filed records with the
  alias passed all ten on coverage and invented before any dispatch. Guard in `program_requirements_pilot_test`.
- **Reconcile 41172599271** (free) rescored exactly those ten, all passing; **reread 41172998050** replaced 10 rows;
  receipt committed. **Live: 186 to 196 of 215 passing, no coverage failure left** (read back 05:35Z). Display build
  97f8cb5d3f44 carries them; its `step=display` runs on `main` after the merge.
- **Lesson: before reading a coverage failure's page, diff the record's codes against the state's list.** When every
  missing course has a printed twin under another prefix, it is an alias, and the live tables prove it.
- **Left at LA Valley (19 failing):** 12 program sums that fail while the degree adds up. Two shapes so far: 30699
  Communication Studies read the 2.0 degree's page (43774's), and Anthropology 32410's lists B and C repeat list A's
  courses (a multi-column read). Then 5 incomplete and Respiratory Therapy 21899 (prints 74). Outside the load, 8 still
  place none.

## S531 SkyOlallieberry (2026-10-30, Sam's session): Los Angeles Valley's "State Code", 167 to 186 passing

- **Page read 41140057846** (PDF pp54-67, no model call): LA Valley heads every program "(Program Code 061220, State
  Code 45216)". The state code is the control number. `pdf_control_number` read only East LA's "Academic Plan
  E013343D" shape, so 74 of the catalog's 225 picks printed a number it did not see.
- **Why the Media Arts family failed:** each certificate's title matches its degree's heading, so the certificate
  took the degree's page (or the family's p62) and extracted no course. Counting "State Code" lifts printed numbers
  from 151 of 225 picks to 214 (capture-only run 41141053219), and the bonus moves each program to its own page:
  the Media Arts certificates to pp66-69, Physics A.S.-T 32740 from the front matter (p48) to p149, the Engineering
  and Manufacturing family to its own headings. Guard in `program_requirements_college_test`.
- **Extraction 41141747238** re-extracted the 78 programs whose page moved, for $5.37: 19 failing records pass, 41
  passing ones still pass, and three regressed. Two hit an HTTP 503 BOOT_ERROR from the extraction function
  (02944, 02950) and Marketing 21876 read p83 and placed none; their earlier files stand, so the reread skipped them.
  Commercial Music 11546 and 31765 left the capture as unproven (their page prints neither the number nor the
  title); both placed none before.
- **Reread 41142694138** replaced 62 rows; **load 41142935133** inserted the 11 that had placed none and stayed out.
  **Live: 167 of 204 to 186 of 215 passing**, read back 23:14Z. Display build f8c94ef23142 carries them.
- **Lesson: a catalog that prints the control number gives the page finder an exact key.** Before tuning title
  matching for look-alike programs, page-read one of their pages and look for the number in its heading.
- **Lesson: compare the re-extracted verdicts before a reread posts them.** A full read re-extracts every program
  whose page moved, passing ones too; a regressed record's restored file keeps its old run, so the reread skips it.
- **Left at LA Valley (29 failing live, 8 outside the load):** the Engineering and Manufacturing family's coverage
  (10, now read from their own headings; not yet read against the page), 12 program sums that fail while the degree
  adds up, 5 incomplete, 2 unequal (Respiratory Therapy 21899 prints 74). Outside the load, 8 still place none
  (Post-Production and Screenwriting, IGETC, Spanish, Computerized Bookkeeping, UCTP Physics).

## S530 SkyBuffaloberry (2026-10-30, Sam's session): Los Angeles Valley's degrees, the 60 a floor, the GE plans' units

- **All 67 failing degrees added their major up equal and failed at the degree.** 38 summed the major alone against
  the 60; 29 named "Any GE (LACCD GE Plan or Cal-GETC)" and no units for it. The record's own major sub-check sorted
  them with no page read (S529's lesson held). The 47 noncredit certificates already pass as *unstated*.
- **Page read 41113266504** (two plans, one load, no model call): every degree page ends "Major Units: 34 Total
  Minimum Units: 60". The Associate Degree Programs page (printed p30) prints "LACCD GE Plan 27 18+, Cal-GETC 34 18+"
  and "The total number of units required for an Associate Degree is 60, regardless of which GE Plan is chosen"; the
  LACCD plan's page sets 27 as a minimum and bars it from transfer degrees. A continuation page (printed p82: Banking
  and Finance, Management, Marketing) prints no GE footnote, so the steps key on the "Total Minimum Units: 60" line.
- **The steps** (`kb/program_requirements_reconcile.json`): a transfer degree takes Cal-GETC's 34, a local degree the
  plans' span 27-34, and the 60 is a floor (`degree_total_minimum`). A set step fills only an empty field and a floor
  never fails a record, so the steps can only promote. Guards in `program_requirements_pilot_test`.
- **The moved-page guard held 20 of them out.** Reconcile 41114987325 moved 38 (27 incomplete, 11 unequal); the rest
  kept their run, because the capture now starts a degree one page early, on the Programs Offered table naming it
  (Banking: filed p84, fresh pp83-86), and S403's guard compares page addresses. `own_heading_kept`
  (`kb/_program_requirements_college.py`) keeps such a record when the file is the same, the record places a course,
  and the fresh text prints its own heading. Reconcile 41117814733 moved 18 more.
- **Two rereads for two runs.** A reread posts one extraction run's records (the newest, or `force=<run>`): 41118547883
  posted the second run's 23, 41118901581 the first run's 72; receipts committed. **Live: 114 to 167 of 204 passing**
  (read back 20:00Z). The rescore under the current scorer also carries the floor reading (Sheet 144 card 2) to LA
  Valley's rows; S529's statewide receipt names two of them, and its old-verdict guard skips them when it runs.
- **Left at LA Valley (37 failing live):** 9 degrees whose fresh capture moved to another page (the Media Arts family
  to p62) or print a total other than 60 (Physics 63-65, Respiratory Therapy 74); 17 filed records the capture never
  found (no blocks, among them the Media Arts certificates on pp64-66); 4 records with no course; the transfer degrees
  that fail on their program sum.
- **Lesson: a guard on page numbers stands in for "this text is about this record".** When the page drifts inside the
  same file, test the content: the record's own heading.

## S529 SkyKiwiberry (2026-10-30, Sam's session): the 44 that "printed" unpasses, read from their own records

- **Sam ruled Sheet 143 card 2 *printed* (12:58Z).** The card's next step was to read the 44 records the reading would
  unpass before changing the scorer. Their own records answered most of it, with no page read: each block's printed
  name sits beside its `stated` figure and its courses.
- **Few are catalog slips.** Most lists print their smallest figure over courses that run past it, inside a program
  total that carries the top: Taft 44611 "List B: Select one" prints 3 over courses of 3-4, total 18-19; College of the
  Desert 32369 "Select 2 courses (6 units)" over 6-7, total 18-19. The printed figure in place of the courses drops the
  top the program's own total carries, and a faithful record fails. Eight print a minimum ("6 units minimum", Contra
  Costa's "4 units minimum"). Six carry a figure that is not the list's units: Chabot 30828 List A "12" over a
  two-course 6, Chaffey 31891 "39" (the list's whole pool), Long Beach 33390's core "12" over 6, Merritt 22011 "6" over a
  choose-one of 3, Santa Monica 37452's core "9" over 6, Palomar 05162 "3" over "select up to one".
- **The floor reading.** The printed units as the list's floor, never its ceiling (max of each end; the printed figure
  itself when the courses cannot be added): 176 unequal and 28 incomplete pass, 13 that pass today fail (9 colleges),
  mostly the six misread figures above. `python3 kb/_block_total_reading_measure.py --floor`. It differs from what Sam
  ruled, so it is Open Asks Sheet 144 card 2 and the scorer is unchanged.
- **Applying any reading needs more than the rescore script.** `kb/_program_requirements_rescore.py` re-reads how a
  record's stored sum meets its printed total and never re-adds the blocks, so a `block_units` change needs a recompute
  of each record's `computed` before the guarded UPDATE, in both directions (13 live rows demote).
- **Sam ruled *floor* (Sheet 144 card 2, 17:50Z).** Built the same hour: `block_units` floors, and
  `kb/_program_requirements_floor_rescore.py` re-adds each record's blocks both ways and moves only a record whose
  filed status agrees with the summed reading (one did not: Butte 31000 is filed `incomplete` on its closed list's
  units). 206 moved; 14 that would pass stay failing on their degree check. The guard denied the live UPDATE, so
  the apply is Open Asks Sheet 145 card 2.
- **Lesson: read a record's own block names before reading its page.** The extractor keeps the list's printed words;
  they sorted 44 records into three kinds at no cost.

## S528 SkyMulberry (2026-10-30, Sam's session): Glendale's unequal sums against their pages; which number a printed list counts

- **Of Glendale's 46 unequal records, 29 price every course** (a query of each record's placed courses with no units). The
  other 17 carry unpriced courses (CS/IS 187, ETH S 102 and 124, PSYCH 131, ACCTG 155-156, ABSE 186-187, CABOT 206-208 and
  others), so their gap is a missing price, item 3's work.
- **Two free page reads** (41054044039, pp73-84, `glendale_unequal_pages_73_84`; 41055644846, pp67-91 printed of the
  67-123 span, `glendale_unequal_pages_67_123`) put five kinds of gap in the catalog's words:
  - **The catalog's own arithmetic, faithful records, no step:** Photography A.S./certificate 02575 and 21318 ("requires
    18 units" over eight required and one of four, all 3.0, so 27; the page's Digital Photography (21) and A.A. (18)
    beside it add up); Digital Content Specialist 42738 and 35029 ("requires 23 units", seven 3.0 courses, 21);
    Biotechnology 41767 and 41776 (BIOL 50 is 1-4 units and the record carries 1; the page prints "(3-4 units)" over two
    4.0 courses).
  - **A conditional elective:** the French, Italian, Japanese and Spanish pairs print "If 20 units have not been reached in
    the required core, select one" (3 units). The core is 20, so the elective adds nothing; 18-20 is the family's shared
    wording. The scorer has no rule for a condition, and none is worth one for eight records.
  - **A misread, fixed:** Foreign Languages 39406 flattened "2 courses from one language (10 units) and 2 or more from a
    different language (8-10 units)" into one choose-4 block. `force=39406` (41055650373, one model call) extracted two
    blocks with those figures; reread 41057000899 replaced the one row (receipt
    `kb/receipts/program_requirement_records_college_reread_glendale_community_41057000899.json`, read back live). It still
    sums 12-20: the next point.
  - **A printed block figure the scorer does not read:** `block_units` takes a choose-courses block's printed units only
    when a course is unpriced, so a list with a 3-unit course among 5-unit ones (Armenian 125-127, Spanish 131) or 1-unit
    piano workshops in "Select one course (2 units)" (Music A.S. 02572, 21315) carries the low end under the page.
- **Measured statewide, no write** (`kb/_block_total_reading_measure.py`, the filed records): the printed figure standing
  in moves 218 unequal and 27 incomplete to equal (59 colleges) and 44 equal to unequal (26), mostly lists that print a
  floor ("Select one course (4 units minimum)", Contra Costa 46301). Only where the courses can make it and the list says
  no "minimum": 91 gain, 30 lose. Sam ruled the scorer's last reading narrow (Sheet 120), so this is Open Asks Sheet 143
  card 2, held for him.
- **A page read prints about 25 pages.** The 67-123 span printed through p91; Civil Engineering (p100), Advanced ESL
  (p102) and the transfer degrees (pp116-123) are still unread. Keep a span under 25 pages.
- **Lesson: sort the unequal by whether every course is priced before reading any page.** The priced ones are the
  reading's; the rest are a units step.

## S527 SkyLoganberry (2026-10-30, the CPL Queue routine): the state's C-numbers name no code in their body

- **Glendale's C-numbered descriptions print no code after the units.** "C1000 · INTRODUCTION TO STATISTICS · 4.0 Units ·
  (Previously MATH 136) · This course is an introduction ..." gives the parser no code to key or guard on, and its
  number pattern took three digits at most. The unpriced-codes query (S526's lesson) put them first: STAT C1000 on 15
  records, ENGL 101 on 13, PSYC C1000 on 11, ENGL 104 on 11.
- **A page read's " · " is the reader folding short lines.** The first read (41047695384) keyed on "C1000 · " and matched no
  page; the PDF text has a line break there. The second (41048183449) matched the number alone on its line.
- **Let the runner parse its own read.** A plan with `"parse_units": true` makes `college-page-read.yml` run
  `kb/_description_units.py` over the read and print the result, with each C-numbered description it cannot key
  (`unkeyed`: page, number, title, units, the old number its note prints, the footer naming the department). Run
  41048730638 printed all eleven in eleven lines, where the log was 900. The session keyed each under the prefix the
  department and the records give (COMM, ENGL, POLS, PSYC, STAT) and aliased each old number to it (MATH 136+ takes
  STAT C1000E's 5.0, ENGL 101 takes ENGL C1000's 4.0), with the words in the units file.
- **Result:** reconcile 41049220135 (free) filled 118 course units on 47 records and changed nothing else (checked field
  by field); five records passed and none lost a pass. Reread 41050126747 replaced the 47 rows (receipt
  `kb/receipts/program_requirement_records_college_reread_glendale_community_41050126747.json`, read back live). Glendale live: **115 equal (from 110), 65 incomplete, 46 unequal**.

- **Sam's stopping rule (2026-10-30, after S527 explained Glendale's cost):** *"I want to automate everything but not at
  all costs..."*, then *"good to go with 3"*. A college is parked once two sessions in a row each move fewer than 3% of its
  programs to passing; a to-do on the Progress view names what restarts it, and Mark done (`queue_todo_done`) reaches the
  next scheduled session first. The session first proposed 1% and then measured that 1% would not park Glendale (5 of 226
  is 2.2% a session); it set 3% on his intent. Glendale is parked at 115 of 226.

## S526 SkyJostaberry (2026-10-30, the CPL Queue routine): the description parser missed 70 courses; IT Technician's totals are the catalog's

- **IT Technician II and III are faithful records of a catalog whose totals run one unit high.** Page read 41025920825
  prints II's ten courses "to a total of 32" and III's thirteen "to a total of 42"; each course's own description, and
  the state's file, give BUSAD 204 1.0 units, so II sums 31. III sums 38 plus CS/IS 187, which the catalog prints no
  description for (page read 41039652111) and the state's file prices at 3.0: 41. Both stay *unequal*, and the gap is
  the catalog's own arithmetic. No step should close it.
- **Unix-Linux 19366 prints no total** (page 114: three required courses, then "select one or more" of six), so it
  stays incomplete by the catalog's own words.
- **The S523 description parser missed 70 codes in four shapes.** A renumbered course prints its old number between
  the units and its code ("3.0 Units · (Previously MEDIA 103) · F T V M 1 3 2"); a title starting with a digit
  ("2-D FOUNDATIONS", "4TH AXIS MACHINING"); a title carrying "+", a curly apostrophe or an accented letter ("PROGRAMMING
  IN C/C++", "CHILDREN'S LITERATURE", "(ANTIQUITY - 1750)"). `kb/_description_units.py` now steps over the note and
  takes any title without a lower-case letter; the code the body names after the units still guards each match.
  A reparse of S523's nine logs plus run 41039652111 priced 59 more codes and changed none of the 1,278; the 11 old
  numbers the notes print (MEDIA 101, 103, 107, 110, 112, 213; STV 61-64, 66) take the new code's units, since records
  still place them. Guard: `program_requirements_pilot_test`.
- **Result:** reconcile 41040709338 (free) filled 114 course units on 57 records and changed nothing else (checked
  record by record); reread 41041428504 replaced the 57 rows (receipt
  `kb/receipts/program_requirement_records_college_reread_glendale_community_41041428504.json`, read back live: 57
  rows on run 41040709338). Glendale live: **110 equal (from 105), 67 incomplete, 49 unequal**; five passed from
  incomplete, two moved incomplete to unequal, none lost a pass.
- **Lesson: a parser's misses show as the unpriced codes in the live records, not in its own count.** S523's 1,278
  looked complete; a query of the courses still carrying no units named ART 130 on 15 records, and each miss pointed at
  a shape. Run that query after any units step.

## S525 SkyTayberry (2026-10-30, the CPL Queue routine): S524's prose totals were borrowed; the scope starts at the heading

- **All 8 of S524's prose totals were the first program's on the page.** Page read 41025920825 (`glendale_unequal_sums`,
  pages 79-114, free) printed the pages: Computer Support Technician (p97) prints no total and took IT Technician II's
  32; the Advanced ESL Business and Health pair (p101) print none and took 21; Grip and Lighting (p106), an 8-to-16-unit
  certificate, took 18-20. S524's `before` cut the page at its first list, which belongs to the page's first program.
- **The fix:** the fill reads from the record's own `section_heading` (letters and digits only, case kept, so the PDF's
  letter-spaced "ADV ANCED ESL ... PAT H WAY" matches and a description's mixed-case title does not) to the first list
  after it; a heading the page does not print fills nothing. Guard: `program_requirements_pilot_test` (the page-97 shape).
- **The rollback:** the 8 filed records restored from 59938a29; the live rows through `supabase-migrate.yml` running
  S524's own receipt rollback (receipt `program_requirement_records_glendale_prose_total_rollback_s525`). Back to
  incomplete with no total, which is the truth for the four read.
- **The read also names real gaps, for a later reconcile or re-extraction:** IT Technician II prints 10 courses "to a
  total of 32" and the record sums 31 (BUSAD 204 reads 1 unit); IT Technician III prints 13 courses to 42, the record
  sums 38 with CS/IS 187 unpriced. Grip and Lighting's FTVM 132 and 137 carry no units. Unix-Linux's heading prints as
  "UNIX/LINUX", which the plan's keyword missed.
- **Lesson: verify a fill's figures against the page before the reread, not the count.** S524 checked which records
  changed; none of the 8 was compared with its own page, and a borrowed figure looks like a found one.
- **Reconcile 41028129478 with the fixed step filled nothing:** no empty-total record's own section prints a prose
  total, so the 33 with none stay incomplete for want of a printed figure, not a reading.

## S524 SkyCranberry (2026-10-30, the CPL Queue routine): Glendale's prose totals, 8 records from incomplete to unequal

- **Glendale prints a program's total as prose ahead of its list:** "must complete all required core courses for a
  total of 19 - 21 units", "totaling 17-18 units", "for a minimum of 9 units" (page read 40690480267). A `fill` step on
  `total_units` names `before` (`Required Courses|Coursework required|Select`), and its pattern reads only the words
  ahead of that match: a program printing no total runs on into the next program's paragraph on the same page.
- **A record placing no course takes no prose total.** The first reconcile (41020193189) gave four not-found records
  (45396, 45397, 30032, 02587) the total of the program beside them; the step now skips a record with no placed course,
  and the filing was reverted before the second reconcile (41021155698). None of the four is loaded.
- **Result:** 8 loaded records took a total (reread 41021975265, receipt committed, read back live); all 8 sum short of
  it, so none passes. Computer Support Technician sums 22 against 32, Unix-Linux 14 against 20, the Advanced ESL pair
  16 against 21: the gaps are courses the reading left out, a page read each. 33 loaded records still name no total;
  their pages print none ahead of the list (Liberal Arts, Machinist, the Physical Sciences). No model call.

## Moved from the lane (S524 compaction)

Hartnell: RN 03570 read Fable's way sums to about
71.5-78.5 against its tab's 60 (S498): the build would trade *incomplete* for *unequal*, so it waits.

**San Joaquin Delta 200 of 203 (S500):** Cal-GETC 45621 passes on a `pool_areas` step over Areas 3 and 5 (S499), and
Architectural Drafting 22244 on a `unit_line` step that adds its printed math line (lessons S500). The three left (07304, 16764, 19752) are extraction misreads, each needing its own page read (lessons S499).

## S523 and S505 (Glendale): moved to archive 3 (S584 compaction)

## Moved from the lane (S542 compaction)

Moved verbatim from `docs/reference/lanes/program-requirements-harvest.md` on 2026-11-01 (S542 SkyTriangulum), when the List line put the lane 910 bytes over its 20,000-byte budget.

**The List (2026-11-01, `#program-requirements/list`):** the tab's sixth view is the Catalog Commons' shared List (`commons_list.js`; Sam: *"I want one now for each of our Catalog Commons groups"*): one row per active program in COCI (`coci_programs_data.js`, 20,282, the headline's universe) with its college as the live table names it, its award, CIP family (the program's CIP; TOP only as a finder word and in that drawer, Rule 7), COCI's units, and from the index whether the harvest holds its record, the machine checks and the issues they name; each filter word carries its count. A record joins by control number (unique among active programs). Read only: a row's Record drawer opens the record in Program records. At 20,282 rows in Chromium a sort or filter takes 35 to 75 ms, a header press painted about 0.2 to 0.5 s (the 400 rows drawn). Guard `tests/program_requirements_list.test.js`; a11y `program-requirements-list` and `-dark`.

**A reconcile step for a figure a local degree never carries reads transfer degrees only (`awards: transfer`, S421):** a local degree's captured page can span the sibling transfer section; where the code-kind gate makes a tab one program's (Hartnell), a second step with `awards: associate` reads the local degree's own tab (S456, Sheet 117 card 3).

Also moved (history): The status file no longer carries the `unchecked` list (3.5 MB to 4 KB); the headline history records `complete` (`queue_status.py --headline-sql`).

Also moved (2026-11-01, for the nightly SLO read's lane line):

From the Progress view paragraph: **Whole harvest** (Sam, 2026-10-13): five parts, confirm left out; `queue_status.py --harvest` stamps it. **Complete (S415, Sam's ask of 2026-10-18 that the headline "doesn't seem quite right"):** an active COCI program whose record passes the three machine checks (`program_record_machine_pass`), counted live from the index against COCI's active programs read by key; it had meant a person's check, which stood at 32 after Sam's 2026-10-17 "trusting your procedures". The 32 stay on the pilot milestone; Sierra quotes every complete record since Sheet 95 card 2 (S416, [sierra lane](sierra-retrieval-corpus.md)).

From the Records view paragraph: #2090: a light index for every college (about 0.6 MB), full records only for the colleges the filters reach (S390, #2121, Sam 2026-10-14: District, College, SWP Region and CIP Sector dropdowns; the tab opens on Progress and carries no Sierra window), and every attention link (deep link, call cards, Next waiting, the Progress counts) loading its record on demand with nothing picked.

From the Phase 2 paragraph: Procedure records come from `kb/_program_source_procedure_v1.py` (#2146); an existing record gets a v2 merged in SQL.

From the tab paragraph: `cpl-chat` reads the surface as unscoped until `KNOWN_SURFACES` names it (a deploy). Cerritos's Ironworker A.S. reads 0 MAP credit recs (its credit is exhibit articulation, in CER).

From the CPL Pathways port (each record the selector lists): each opens By requirement (tiles, an option fork, CPL in three kinds in words, the checks, the outcomes, the gaps read-only) or By term (the map's status, every course in the tray), for the College or Student or public viewer.

From the Progress view's NEXT: Maps: 3 of 32 read, 24 mapper hosts refused (lessons S345).

From Sheet 144 card 2's paragraph: S529 rescored the filed records (`kb/_program_requirements_floor_rescore.py`): 161 unequal and 28 incomplete to equal, 12 equal and 5 incomplete to unequal; 14 left failing on their degree check. ✅ **Applied live (Sheet 146 card 2, *pasted*, 20:30Z):** Sam ran the receipt's `apply_one` (12 equal to unequal, 27 and 160 to equal, 5 incomplete to unequal); Los Angeles Valley's reread had moved the other two; all 206 read back (S530).

## S547 SkyCartwheel (2026-11-02): Golden West's SLO load

- **A trigger file that matches main's runs nothing.** Golden West's `.load` (`host=cccd`) was the same line main held
  from Coastline's load, so the gate would have skipped it. A second line (`run=2026-11-02 golden_west`) changed the file;
  the loader reads only `host=`. Load 41412025040 inserted 568 rows, skipped 75, kept none.
- **A runner's commit to a PR starts no checks.** After the load committed its receipt, #2684's head had no `test` run.
  Restoring `.load` to main's text was the session's own commit with content, which started `test` and skipped the load.

## S549 SkySunflower (2026-11-02, the 11:12Z firing): Santa Ana's trial, a reader that returned empty

- **A reader that finds the heading and nothing under it should hand off, not answer.** Santa Ana's report 267 prints
  *Student Learning Outcomes* as an h3 in a section of its own; the outcomes sit in plain fields in the next section.
  `groups_from_html` (written for SDCCD's grouped report) found the h3, found no group list, and returned `[]`, which
  `parse_page` reads as an answer: 12 of 12 pages came back `none` while every page printed its list. It now returns
  None when the page holds no `iq-data-list` at all, and the text reader reads the list. Checked first against the 72
  pages earlier trials filed: none changed. Then `--reparse` on the trial: 12 of 12, 36 outcomes.
- **A trial that parses none is a reader question before it is a verdict.** The filed `.txt` showed the list in four
  lines; a `none` verdict there would have parked a 216-articulation college for good.
- **Read "once a UTC day" against the day the last run was made, not the session's.** Handoff 549 said *Step 11 on the
  new UTC day*; this session fired at 11:12Z on the same day as the index (#2685, 06:18Z) and ran the trial anyway.
  Cost: one 5-minute run on a host already idle. The full read waits for 2026-11-03.

## S559 SkyAndromeda (2026-11-03, the 08:12Z firing): Santa Ana loaded, Las Positas's trial passes

- **Santa Ana's load:** `.load` = `host=sac` (the helper's `--college santa_ana` prints it; the file on main read
  `host=cccd`), load run 41602658602, 1,366 inserted, 7 skipped, receipt on the branch in about five minutes.
- **The receipt commit started no `test` again,** and marking the PR ready did not start one either. Restoring
  `.load` to main's text (S547's pattern) is the session commit that gives CI a head.
- **Las Positas's trial read 12 of 12** (4 to 7 outcomes a course), so it moves to a full read; the quota (one full read,
  one preparation run per UTC day) held it to 2026-11-04.
- **A worktree for the SLO branch** keeps the main checkout on the session's own branch; `git worktree add` on this
  repo takes about two minutes.

## S567 SkyWhirlpool (2026-11-04, the 08:12Z firing): Las Positas loaded

- **Las Positas's load:** the three slices of read 41784805869 were filed by 08:03Z; `.load` = `host=laspositas`, load
  run 41797959686, **505 inserted**, 271 skipped, receipt on the branch in about two minutes. `course_outcomes` now
  holds 9,889 rows at twelve colleges.
- **Run the queue helper on main, and the branch's own college on its branch.** Handoff 567 listed Santa Ana at *read*;
  on main it is *done* (S559's receipt). An SLO branch cut before a load merged reads that college as unloaded.
- **Merging main into an SLO branch conflicts on `.run`.** Take main's `.run` and `.load` after the load, so the merge
  push starts no new read or load and CI gets a head.

## Moved from the lane (S562, 2026-11-03; the lane passed its 20,000-byte budget)

The catalog sweep paragraph, verbatim as the lane carried it:

🔨 **The catalog sweep (S394-S414; Sam's aim of 2026-10-14: every catalog, then curated audit sweeps).** One branch per college, never two on one host; a wave branch merges the loaded ones, their dated reads and one display build. A free capture-only read (`extract=0`) comes first wherever a host's shape is new to the reader, and a free page read of the host's own outline (`kb/college_reads/`) before any reader change; the session reaches neither college hosts nor run artifacts, so a PDF's text comes from a page read. **Dispatch every read with `college=`** (lessons S402). Extraction runs under the $40 go. **The readers** (CourseLeaf, curriQunet, eLumen, Acalog, Coursedog, the whole-catalog PDF): lessons, *Moved from the lane (S421 compaction)*. The code finder's, the code net's and the scorer's readings of catalog text (#2206, #2207, #2222, S414): lessons, *Moved from the lane (S420 compaction)*. **A reconcile rescores a record only on the page it was extracted from, or on a fresh capture of the same file that prints the record's own heading** (`own_heading_kept`, S530). **The hand-filed step** (Sam's ruling 2, 2026-10-17): `kb/hand_filed_catalogs/` and its README. **Reader invariants** (a PDF step naming its file, Coursedog's heading reads, a kept record from its source's page, a page read's vendor hosts; #2213, #2216): lessons, *Moved from the lane (S421 compaction)*. **Sam's go of 2026-10-17 (`sam-trust-procedures-no-per-item-approval-2026-10-17`):** harvest calls proceed on their procedures without a card, and a write the Supabase guard holds goes through `supabase-migrate.yml` (`kb/migrations/.apply`), never to Sam as a paste. **Each wave's colleges, counts and the per-college rescoring history: lessons S406-S415** (moved from the lane, S419). **No record (4):** North Orange Continuing Education, San Jose City (CourseLeaf), Diablo Valley, Santiago Canyon (eLumen). **S452-S457** (the waves, Hartnell's and Sierra's readings, the `meets` reading): lessons archive 3, *Moved from the lane (S474 compaction)*. **A Coursedog catalog reads from its site by default** (`route=pdf` keeps the PDF step for one run, S451). **`step=display` applies the committed build; it never builds one.** Run `kb/_build_roep_display.py` on the wave branch first (needs `openpyxl`), commit its two outputs, then apply on `main` after the merge (S452). ✅ **Sam's standing rule (Open Asks Sheet 118 card 1, 2026-10-23):** the older-build rows each wave leaves behind are removed at each wave with a before-values receipt by the S456 method, no card. Sheet 118 cards 2 and 3 *keep* (Hartnell's Local GE at 23; Cal-GETC 34 on a local degree whose own tab names it). Sam ruled **narrow** on the scorer's `meets` reading (Sheet 120 card 1). Sheet 115 card 1, the S456 and S459 removals and the S459 rescore: lessons archive 3, *Moved from the lane (S474 compaction)*. Display build e021a2824548's apply (S459) and Hartnell's thirteen still failing (S488): lessons, *Moved from the lane (S530 compaction)*. The two S448 offers wait on Sam's word. **Later (Sam, Sheet 112 card 1, 2026-10-22 11:16Z, his own call):** no note goes to Program Mapper's vendor for the 63 colleges' maps for now (`cpl_memory` `sam-sheet-112-program-mapper-later-2026-10-22`). **List the thin colleges live, and look for a shared cause, first** (S442). On screen the reference is **CPL Pathways** (Sam, 2026-10-21). **Parked for the reader** (nine colleges and two record sets; Ventura and Oxnard read in S442): lessons, *Moved from the lane (S421 compaction)*. **A reconcile step for a figure a local degree never carries reads transfer degrees only** (`awards: transfer`, S421): lessons, *Moved from the lane (S542 compaction)*. **Verify a reader change on the catalog's own words before any dispatch** (`kb/college_reads/`; a PDF plan takes `pdf_span` and `pdf_after`, S421). **A renumbered course** maps through `course_renumbers` (S423-S424): lessons archive 3, *Moved from the lane (S495 compaction)*.

## S590 SkyLeoTriplet (2026-11-06, the 09:12Z firing): Monterey Peninsula's six unequal records read back

- **Page read 42046379839** (#2809, plan `kb/college_reads/mpc_unequal_left.json`) against the filed records, scored
  locally with `coci_program_courses`' units as the closed list (the filed record keeps no closed list or page text, so
  `score()` needs the state file's units from the table). Each record fails for its own reason:
  - Global Studies AA-T 37243: the major passes (meets, 21-31 against 21-25); the degree fails at 55-65 against 60. The
    transfer page prints the local degrees' words, "electives, if needed, for a total of 60 transferable units". **Step:**
    `set degree_total_minimum`, `awards: transfer`. Fable advised it: Ed. Code 66746 caps what a college may require,
    not what a student's choices total; the low end (55) shows the degree completable in 60; the major's own check keeps
    the range mismatch visible. Measured on the filed records: it moves 37243 alone.
  - Business - Accounting 22052: "Select one of the following: 2 · WORK 96 · or WORK 99 ...", the figure on the heading
    line, so `or_units` had no parent figure and the state file priced the group at 0.5-1. **Step:** `or_units` with
    `parent_from_block` gives a one-course "all" block's single stated figure to the course first. Guard in
    `tests/program_requirements_reconcile_test.py`. At this college it reaches 22052 (11997's two such blocks add up).
  - ASL AA 39266: "SIGN 2B 5-6 · or SIGN 10 · & SIGN 20", a joined pair as one alternative; the reading lists two
    alternatives, so the low end prices SIGN 10 alone (21 against 23). Reader or scorer work.
  - Hospitality AS-T 41831: List B's "Any List A course not already selected" was dropped, so its cheapest pair is 7
    against the catalog's 6. Reader work.
  - Nursing AS 03633: the Humanities and Ethnic Studies lines (3 each) were not kept; 57.5-63 against 72. Reader work or
    a re-extraction.
  - Anthropology AA-T 32033: List C says "minimum of two units"; the catalog's own 23 counts List C at 4. The reading
    follows the words: leave it unequal.
- **The first reconcile was canceled** (42194283816) so one capture carries both steps (42195216637).
- **Lesson: a group's figure can sit on the heading line or on the first row.** CourseLeaf prints both shapes in one
  catalog; `or_units` read only the second. Look at where the figure sits before writing a step for "no units".

## Moved from the lane (S590)

From *Course objectives too*, verbatim:

**Built (S584, 2026-11-05):** `kb/_course_outcomes_read.py` files each page's first Course Objectives section with items (`objectives`, `objectives_heading`, `objectives_lead`, `objectives_fingerprint`; SDCCD's All Fields report from its own Objective Text fields, which its text breaks across lines). `--reparse` on the nine filed trials: objectives on RCCD 12 of 12, SDCCD 12 of 12 in both reports (the same lists), Coast 9 of 12, Santa Ana 12 of 12, Las Positas 12 of 12; the eLumen trials (Cabrillo, Modesto, Columbia) print none; every SLO field read unchanged. Storage: `course_outcomes.kind` (`slo` default, `objective`), its key `(college, course_code, source_url, kind, fingerprint)` and the load reading `kind`, applied live (`s584_course_outcomes_kind`; rollback beside it); the load posts objectives as their own rows for the same colleges, and every SLO reader filters `kind=eq.slo`. Every step 11 read now carries both.

## S591 SkySombrero (2026-11-06, the 10:12Z firing): Monterey Peninsula reread and parked; Mission's SLOs loaded

- **Reconcile 42195216637 moved one record:** Global Studies AA-T 37243 (183 to 184). Business - Accounting 22052 still
  fails after `parent_from_block`; the reconcile rescored it on its own page and the sum stayed short. Read it again
  only when the college restarts.
- **Reread 42201297009** replaced 33 rows (30 pass the machine checks); receipt
  `kb/receipts/program_requirement_records_college_reread_monterey_peninsula_42201297009.json` holds the before-values.
  Display build 04dec589445a on the branch, then `step=display`.
- **Parked under the stopping rule:** S584 moved 0 and S590 1, both under 6 of 197. Call
  `monterey-peninsula-parked-2026-11-06` in the status file.
- **Lesson: read Sam's answers to the parked calls before choosing the next college.** On 2026-11-02 he unparked
  Glendale and LA Valley with *"handle the discrepancies after all data is harvested"*. The next college is one with
  records missing, so the order is coverage first: on `with_closed_list`, Mt. San Jacinto finds 115 of 152 (76%), the
  lowest after Canyons and Calbright, whose gaps S442 and S453 explained. The four colleges with no record stay as the
  lane names them.
- **The display builder needs `openpyxl`** (`chatbox/build_program_courses.py` reads the state's program course file);
  a fresh container lacks it. `python3 -m pip install openpyxl`, about 10 s.
- **SLOs: Mission College loaded** (load 42201380786): 693 inserted, 66 skipped, receipt
  `kb/receipts/course_outcomes_mission_42201380786.json` with its delete. The bot's receipt commit starts no `test`
  run, so update the branch from `main` to get one before the merge.

## S592 SkyCoddington (2026-11-06): Monterey Peninsula merged; Mt. San Jacinto rechecked

- **Read the lessons before taking a college the handoff names.** Handoff 592 named Mt. San Jacinto on coverage; lessons
  S448 had already read its 37 gaps as the catalog's own (revised degrees, no own pages). A three-load page read
  (42209254899, `kb/college_reads/msjc_recheck_s592.json`) checked the two "being revised" transfer degrees two weeks on:
  Public Health A.S.-T 39455 now prints its Requirements (23-24 units, Cal-GETC 34, total 60); Chemistry A.S.-T 40010
  still prints only the revision notice. A notice that says *expected to be available shortly* is worth one recheck.
- **Mt. San Jacinto:** free capture 42209857182 found 116 of 152 (115); extraction 42212319155 read 39455 alone for
  $0.10 (97 of 116 pass); load 42217163675 inserted 1, kept 112 (receipt with its delete); display build 7b1f3658a888
  (17,550 records). The 14 page-claimed and 22 not found stand as the catalog prints them.
- **Monterey Peninsula's display apply** (run 42202162492, 67 minutes) wrote 17,546 of 17,549 with 0 errors and ended in
  failure on 3 rows the table no longer holds, as S457's apply did; the applied record committed, so #2809 merged.
- **Next by `with_closed_list` coverage**, from each college's `summary.json`, after Canyons, Calbright and Mt. San
  Jacinto: Ohlone 146 of 179 (82%), Siskiyous 65 of 77, Palomar 282 of 331, Coalinga 53 of 62. Read Ohlone's S451 lessons
  first.

## S457 SkyColumbine (2026-10-23, Sam's session): the S456 wave, Sierra's ESL acronym, the low-end-meets reading

- **A guard that encodes a session's caution yields to a proceeded card.** #2380 was red on "Hartnell: a local degree
  never takes Cal-GETC's 34" (S421's caution, written when a local degree's page could span its transfer sibling's
  section). Sheet 117 card 3 had already proceeded on the second step, the tabs print the set in the catalog's own
  words, and the code-kind gate removes the caution's premise, so the guard was rewritten to the new rule rather than
  the step dropped. A branch that files a load without its build fails `tests/roep_display_test.py` by design, so the
  Hartnell branch merged through the wave PR (#2381) and never on its own.
- **A heading can spell an acronym out with function words between the spelled words.** `with_acronyms` read a run of
  four-letter-or-longer words only, so "English as a Second Language" never read as ESL and the two ESL noncredit
  certificates lost the department page to the sibling that took it on coverage alone (`label.section` null; with one
  section among the claimants, `page_winners()` keeps the coverage winner). The run now skips `a an as and of for the in
  to on` between the spelled words; "intro to" still never reads as IT. Running the capture's gates on the page dict
  built from the `capture_view` log (lessons S456) named the gate in one run; a fixture needs at least `SMALL_LIST`
  listed courses printed on the page, or the label gate refuses it before the section is read, and a candidate's
  section sits under its `label`.
- **A variable-unit course widens a sum past a printed total.** ABT 99 sits in six Hartnell records at 1-8 units from
  the vendor's `creditHours`; the Requirements tab prints no figure for it in the program (page read 40000266982), and
  the vendor's own "Total Required Credits" is a precise figure, not a floor. The doctrine passed only a floor the low
  end meets (S422). The new `meets` reading passes a program total, or an electives-filled degree total, that the low
  end meets exactly with the high end carried past it by a choice or a variable-unit course, as Sheet 81 card 1 reads
  a degree's span. **Measure the blast radius before proposing a scoring rule:** 258 program totals and 9 degrees
  statewide read so, 738 under any total inside the span (Mt. San Jacinto 04395 reads 9-24 against 18, the kind a wide
  rule would hide). The rescorer (`kb/_program_requirements_rescore.py`) now covers program totals and its `--check`
  guards both; the receipt carries the guarded UPDATE and rollback. The session's permission check refused the live
  apply, and a permission-check denial is on Sam's hold list: Sheet 119 card 9, #2387 a draft until his reply.
- **The vendor's course data carries hours.** Each `courses/search` entry carries `credits.creditHours`,
  `billingHours`, `lectureHours {min,max}` and `labHours {min,max}` (ENGM 620: lecture 80-90, lab 48-54), so the
  seven hours-measured noncredit records can be priced from it (a `course_hours` field in `cd_pages`, a reconcile
  kind for `measure: hours`). The page reader prints 1,500 characters of each fetched body (`NETWORK_BODY`), which hid
  ABT 99's and ENGM 622's entries: a plan that needs one course's entry needs a longer print or a filter.
- **A display apply can commit its applied record and still end in failure.** Run 39990555422 (build 14291ca32973)
  committed its applied record to `main` at 18:20Z and concluded failure after 87 minutes; the second apply (run
  39999773855, build d45e5d0fcf78) queued behind it. The failure's cause was not read this run (the log's tail shows
  only cleanup); read the job's middle before trusting the apply's row counts.
- **The Rule 8 memory read, the handoff and the open PRs together told the state in one pass:** S456's comment on
  #2384 said which PR merged on green and which waited on what; nothing had to be re-derived.

## Moved from the lessons (S641 compaction)

Sections S456 through *Moved from the lane (S447 compaction)*, verbatim, as they stood on 2026-11-12.

## S456 SkyYarrow (2026-10-23, Sam's session): card 1 carried out, a Coursedog tab's code names its award, a noncredit section

- **A bulk delete's before-values receipt reads the rows outside the session's context.** Sheet 115 card 1's 17 rows
  run to 779 KB of `to_jsonb(r)::text`; the migrate runner records at most 4,000 characters of a response, and a row
  retyped by a model is no receipt. The rows were read through the Supabase MCP in queries whose answers exceed the
  tool-result cap, which the harness saves to a file instead of the context; a script parsed each file, checked every
  `md5(row_text)` against Postgres's `row_md5`, and wrote the receipt and the md5-guarded delete
  (`kb/receipts/program_requirement_records_older_build_removed_2026-10-23_s456.{json,sql}`). The apply (run
  39968114807) returned `removed 17`; a live count of the keys reads 0; the table holds 17,530. Victor Valley's
  second department-list row (Irrigation and Water Management 38852) was already gone; Sierra 11965 and 21557 were
  re-extracted by S455 and stay. No display rebuild: the build already left the rows out.
- **A Coursedog tab's code names its award.** Hartnell's site read filed 7 of 96 records from a tab whose code names
  another award: `label_score` reads "associate in science for transfer" as naming an A.S., so Biology A.S. 03537
  shared "Biology for Transfer Degree (AS-T) - AST.BIO" with the A.S.-T. `cd_page` keeps the code's kind
  (`cd_code_kind`, the letters `PDF_CODE_AWARD` already reads; a prefix at Hartnell, a suffix at Merced) and
  `candidates()` turns the tab away, as `pdf_code_match` does; an award the codes cannot name reads as before. The
  capture (39966331452): Biology and Administration of Justice A.S. read their own AS tabs, both certificates and
  Agriculture Production's certificate their own CT tabs, and Psychology A.A., Spanish A.A. and Agriculture
  Production A.S. read no page, which is right (S411 found the PDF prints none). Found 96 to 94, passing 59 to 60.
- **A local degree may name Cal-GETC on its own tab.** With the gate, a Hartnell tab is one program's, so the
  transfer-only restriction on the Cal-GETC step (S421's caution about a page spanning the sibling section) no longer
  protects anything there; a second step, `awards: associate`, fills the figure where the tab prints the pattern.
  Three records changed: Computer Science A.S. 08871 passes; Engineering A.S. 33851 now reads 70-87 against the
  printed 71 and 17924 17-18 against 18, failures of the blocks, not the pattern. Proceeded on the recommendation;
  Sheet 117 card 3.
- **A department page heads a noncredit program's section.** `SECTION_AWARD` had no noncredit pattern, so
  `section_match()` read no section for Sierra's Entrepreneurship for Makers 37810 though `candidates()` took the
  Business page at coverage 1.0, and `page_winners()` gave the page to the credit awards. The pattern
  (`\bnoncredit\b|certificate of (?:completion|competency)`) reads "Entrepreneurship for Makers" then "Noncredit
  Certificate of Completion". Free capture 39967799242: found 107 to 109, page-claimed 15 to 13; 37810 and
  Construction Fundamentals 38749 to extract; the two ESL noncredit (38991, 44028) still read no page.
- **Run the capture's gates on a page read before changing the reader.** A `capture_view` log is the capture's own
  text, so a page dict built from it (`body` and `content` the text, `codes` from `page_net`) runs
  `C.candidates()`, `label_score()` and `section_match()` locally and names the gate that refuses the page; the
  closed list comes from `coci_program_courses` through the Supabase MCP, since the sandbox cannot reach the
  database. One run found the missing section pattern in a minute where the first reading of the log did not.
- **A renamed program prints its old name under the new heading.** Sierra heads "Innovation and Entrepreneurship,
  AA or AS Degree (formerly Business Entrepreneurship)" and its certificate "(formerly Interdisciplinary
  Entrepreneurship)"; COCI's Interdisciplinary Entrepreneurship A.S. 15307 lists BUS 28, BUS 95 and IT 60, which no
  section lists. The Mathematics and Physics A.S.-T (31226, 32010) lost their pages to the "2.0" transfer degrees
  the catalog prints alone (45833, 46074). Reading no page is right for all three; the college's to settle in COCI.
- **Hartnell's 37 arithmetic failures by `why`:** 8 name a GE pattern without units (the wrong-tab rows above, and
  three own-tab local degrees naming Cal-GETC), 9 list a required course without units (7 noncredit programs whose
  courses carry 0 credit hours, so the hours-measured record wants hours the vendor's `creditHours` cannot give;
  HES 120 and the ABT courses the vendor did not price), 2 name no total (the two certificates on A.S. tabs), 18
  sum against a stated total. Counting first kept a course-units fix from being written for a tab-assignment fault.

## S455 SkyMonkeyflower (2026-10-23, the CPL Queue routine): Hartnell's course units from the vendor, Sierra's IT

- **A Coursedog tab's course data is now a source field.** `cd_pages` listens for the `courses/search` POST each
  Requirements tab makes as it loads and keeps `{code: [min, max]}` of `credits.creditHours` as the source's
  `course_units` (with the call's address). A reconcile kind, `course_units`, fills a course or alternative the
  record lists without units, and its note names the call. Hartnell's procedure takes the step.
- **A noncredit course carries 0 credit hours.** The first reconcile (run 39946676559) wrote 0 units into Hartnell's
  hours-measured noncredit programs (BUS 650: "the blocks sum to 0.0; the catalog states 216"). That filed run was
  reverted; the step now skips a 0-hour course and any record whose measure is not units. Reconcile 39949570443: 86
  records priced, none at 0; 59 pass the machine checks (44 before), arithmetic failures 51 to 37.
- **The carry basis keeps every block,** so a curator's confirm of a record does not carry across a course_units
  fill. That is the cautious result; the college test's carry check exempts the kind and says so.
- **A short title word may abbreviate the heading's words.** The state names Sierra's "IT: Cybersecurity"; the IT
  department page heads "Information Technology—Cybersecurity" then "AA or AS Degree" (page read 39946962141,
  capture view). `with_acronyms` collapses a run of words (each four letters or more, so "intro to" never reads as
  IT) whose initials spell a 2-4 letter title word. Free capture 39949602062: found 105 to 107 of 125, page-claimed
  17 to 15, the two Cybersecurity awards to extract.
- **IT: Business Information Worker (07963, 21537) is not in Sierra's 2026-2027 catalog.** The IT page lists Cloud
  Computing, Cybersecurity, Data Analytics, IT Technician and Network Technician. Those two are the college's to
  retire in COCI, never a reader gap.

## S454 SkyBlazingStar (2026-10-23, the CPL Queue routine): Hartnell's GE units, Sierra's "AA or AS", the vendor's course units

- **Hartnell's arithmetic failures were mostly GE, not course units.** Of the 85 records failing arithmetic after S451,
  41 degrees failed only because the record names its GE pattern without units (28 Cal-GETC, 13 Local GE); about 22
  lack a course's units. Count the `why` of each failure before choosing a fix (`score.arithmetic.why` in the records).
- **Hartnell's reconcile steps** (`kb/program_requirements_reconcile.json`): transfer degrees set Cal-GETC to the
  statewide 34 (Taft's step, Sheet 94 card 4 kept it); local degrees set Local GE to 23, the sum of the seven areas the
  catalog PDF prints on pages 58-59 (Area 1 6 units, Areas 2-6 3 each, Area 7 2; read 39931207783), no total printed,
  as Monterey's 24 is a sum. Reconcile run 39931703521 changed 50 records, 32 more now equal; reread 39933892215
  replaced 50, 34 pass the machine checks (receipt with before-values under `kb/receipts/`).
- **A Coursedog tab's own scripts carry the course units.** Page read 39930495321 (`network`, `network_hosts:
  ["app.coursedog.com"]`): the Requirements tab POSTs `api/v1/cm/hartnell_colleague/courses/search/$filters?catalogId=...`
  and each course carries `credits.creditHours.min` (ADJ1: 3); it also GETs the Cal-GETC requisite set with each area's
  credits. The tab's course lines are not links (read 39924074351). NEXT for the ~22 records lacking a course's units:
  have `cd_pages` keep that answer per page (a code to units map) and a reconcile kind fill an empty course unit from
  it, citing the call.
- **Sierra heads one section for two degrees "AA or AS".** Fire Technology's department page prints "Fire Technology"
  then "AA or AS" (page read 39930677707, the capture view in the log; a read without `capture_view` prints only the
  visible tab and found no heading, run 39931100230). `SECTION_AWARD` now reads that line for both the A.A. and the
  A.S. Free capture 39931621162: found 92 to 105 of 125 with a closed list, page-claimed 25 to 17, not found 8 to 3;
  13 programs to extract (Fire Technology, Computer Science, Photography, IT Technician, Graphic Design, Psychology
  AA-T and the five Administration of Justice degrees).
- **A long page-read log comes whole through `get_job_logs` with a large `tail_lines`:** the tool saves an oversize
  answer to a file the session can grep, so `capture_view` on a 49,000-character page is readable.

## S453 SkyFiddleneck (2026-10-23, the CPL Queue routine): San Mateo landed, the thin list re-measured, Hartnell's course pages

- **San Mateo landed.** S452's branch (load 39917453080, 1 inserted, 55 kept; reread 39917922958) merged with display
  build 2ab793e383e1 (#2372); `step=display` on `main` dispatched after the merge, queued behind Long Beach City's
  504ae8333118 apply (run 39917479288).
- **A thin college is measured against the programs with a closed list.** Records against `capture.json`'s
  `programs` called Skyline thin (53 of 144, 37%), but 86 of its programs have no course list in the state's file
  (`by_method.no_closed_list`), so it found 53 of 58 (91%). On `with_closed_list` only Canyons (160 of 264; its
  missing 100 are noncredit programs its credit catalog does not carry, S442), Calbright (12 of 19) and Sierra (92 of
  125, 25 page-claimed, CourseLeaf reader work) sit under 80 percent. No shared cause remains to fix by a re-run.
- **Hartnell's course units:** page read plan `kb/college_reads/hartnell_course_units.json` (branch
  `claude/hartnell-course-units-read-s453`) loads one Requirements tab and follows its `/courses/` links to see
  whether a course page prints units (run 39924074351, still running at checkpoint; its job log is the answer, and S454 reads it before any reconcile code).

## S452 SkyPoppy (2026-10-23, the CPL Queue routine): Long Beach City landed, three free captures, a display step that built nothing

- **Long Beach City landed.** Its extraction (run 39891611701, started 02:48Z on `claude/harvest-long-beach-city-s449`)
  filed at 06:00Z after about 3 h 12 m. Load 39910674748: 368 records, 349 posted, 7 inserted, 342 kept. Reread
  39910973351: 11 posted, 4 replaced. Display build 504ae8333118 (17,510 programs, from 17,505) on
  `claude/harvest-wave-s452` (#2370).
- **`step=display` applies the committed build; it never builds one.** Dispatched on the wave branch before the
  builder ran, it re-applied 25fe751ccd0a, already live from the 04:56Z run on `main` (run 39911664916, 6,940
  written, no change). The order is the S420 one: `python3 kb/_build_roep_display.py` on the branch (about 90 s;
  it needs `openpyxl`, which the sandbox lacks until `python3 -m pip install openpyxl`), commit
  `cpl_pathways_roep_data.js` and the new `.sql.gz`, merge, then `step=display` on `main`.
- **Free captures, measured against main.** East LA 137 of 234 on both (three programs' PDF page numbers moved,
  coverage the same): nothing to extract. Marin 89 of 155 on both, `would_extract` empty. San Mateo 61 of 98
  (from 60): Administration of Justice A.S.-T (31224) is new, extracted on `claude/harvest-san-mateo-s452`
  (one program, well under $1); its load, reread and display ride the next wave. Cañada was skipped: its registry
  row records a robots.txt refusal and its records come from the hand-filed copy.
- **UI pass, Funding model page (#2369).** `npm run a11y funding-model` passed at all 9 widths; the page is
  light-only by design and reads no shared dataset. The `#live-status` line painted `var(--ink-2,#5b544c)`, an
  undefined token's raw-hex fallback; it now reads `var(--text-muted)`.

## S451 (2026-10-23): Hartnell by its site, the S449 queue landed, one display build

Sam opened S451 with the harvest queue ("keep going with the Commons PR harvest"); the Sheet 115 session (S450) had
published the sheet and stopped. No decision from Sam this run; Sheet 115 card 1 had no reply, so the 25 older-build
rows stand.

- **Hartnell's vendor-hosted Coursedog catalog names the tab Requirements, and the site now reads 96 of 112.** Page read
  39853502958 (S449) showed the tab link (`/programs/AA.ADD/requirements-ipyf8`) where Merced's catalog says Requisites;
  page read 39891644835 showed the tab as the capture reads it: one course a line (`ADJ1: Introduction to
  Administration of Justice`, `STATC1000: Introduction to Statistics`), no credits on the line, one "Total Required
  Credits 60" at the foot, and a transfer degree's letters written `(AS-T)`. `CD_REQUISITES` knows either name,
  `CD_TOTAL` trusts either total line for the direct read, and `cd_award_words` reads the hyphen. The free site read
  (run 39892327918) listed 100, read 99 program pages (98 direct; `AA.SPA`, Spanish, missed) and found 96 of 112 where
  the PDF found 73 (S410), page-claimed 8, not found 1 (High School Equivalency Preparation, noncredit). **So a Coursedog
  catalog reads from its site by default** (`prefer_site`), and `route=pdf` keeps the PDF procedure step for one run;
  Hartnell's procedure record still names the PDF step, set aside, not rewritten. Extraction 39895340003: 96 for $6.46,
  10 passing the machine checks, 85 failing arithmetic because the tab prints no course units; the display builder
  fills a course's units from the state's file (`units_from_state_file`), so the records place their courses and show
  units. Load 39897654311: 24 inserted, 70 kept, 2 placing none. NEXT: a reconcile step that reads each course's units
  from the catalog's course pages, so Hartnell's arithmetic check can pass.
- **The S449 free captures, measured against main before any spend** (found / page-claimed / not found, main's in
  parentheses): Berkeley City 90 / 6 / 1 (67 / 3 / 27), every one of the 23 regained a Multimedia Arts program, so
  `cq_pages` on the current reader does read the Requirements child; Mt. San Antonio 397 / 11 / 20 (382 / 11 / 35),
  16 new pages (noncredit ESL, HSE and vocational programs on `adult-basic-education/` and `esl/` pages, Administration
  of Justice AS-T, Dance Teacher), 12 moved, 12 changed, 1 newly page-claimed (CIS Professional in Excel and Access);
  Long Beach City 368 / 15 / 2 (367 / 14 / 4), 4 new, 4 moved (the Administration of Justice pages), 3 newly
  page-claimed (two Computer Support Specialist awards, Business Information Worker, each keeping its loaded record);
  Victor Valley 176 / 9 / 16 (178 / 7 / 16), nothing moved, the two department-list losses S449 explained. A preview's
  `found` is a count and its `would_extract` list is the measure of what an extraction sends.
- **An extraction sends only what moved; the summary's `cost_usd` sums the kept records' stored costs too.** Mt. San
  Antonio's extraction (39891607837) kept 357 records filed from the same page and sent 40 (the log's line), in 95
  seconds, yet its summary reads 397 extracted and $22.47: the kept records carry their 2026-10-15 costs. Read the
  job log's `kept N records ...; M to extract` line for the spend, never the summary.
- **Berkeley City extracted all 90 ($5.81), 34 passing; load 39895334688 inserted 23 and kept 66 (1 placing none);
  reread 39895712663 replaced 66.** 56 fail arithmetic: a curriQunet Requirements tab prints codes without a total the
  record can reconcile, as at the other curriQunet colleges.
- **Palo Verde on its Acalog catalog:** load 39891599387 inserted 15 and kept 51 (the catalog moved, so every page
  moved); reread 39891946981 replaced 51; 38 of 66 pass. **Cypress:** load 39891601778 inserted 17, kept 251, 6
  placing none (the HVAC and Administration of Justice programs on department pages); reread 39891949270 replaced 1.
- **The builder's dated registry read was five days behind the census.** The 2026-10-18 census had moved every row's
  `census_run_id` and six catalogs (Palo Verde to Acalog; Miramar, Merritt, Berkeley City and Butte an `/iq/` tail;
  College of the Desert from a custom page to CourseLeaf 2026-2027), and S444's mapper hosts sat on 37 rows. Re-read
  through the Supabase MCP, all 114 rows, before the build. Four registry colleges hold no records and stay out of the
  read (Diablo Valley, North Orange Continuing Education, San Jose City, Santiago Canyon).
- **Mt. San Antonio:** extraction 39891607837 sent 40 (357 kept); load 39898177865 inserted 15, kept 368, 14 placing
  none (the regained noncredit ESL, HSE and vocational programs read `adult-basic-education/` and `esl/` department
  pages that list no course of theirs, so the load leaves them out); reread 39898856949 replaced 15, held 1. Long
  Beach City's extraction (39891611701) was still running at the wave; it joins the next.
- **Display build 25fe751ccd0a** covers Palo Verde, Cypress, Berkeley City, Hartnell and Mt. San Antonio: 17505 programs
  (17,414 in be2635ed5b73). A PR that loads records without a build fails `tests/roep_display_test.py` (#2366, closed
  into the wave PR for that reason): a college's load and its build travel together.
- **#2365:** the page reader's `cq_view` and three S449 plans, merged on test green. **#2367**, the wave, merged on
  test green after two lint rounds: a course outcomes test pinned Palo Verde's eLumen address (now Modesto Junior,
  and Palo Verde's Acalog catalog is asserted refused), and the dependency map's line numbers had moved.

## S449 SkyBuckwheat (2026-10-22): the queue after S448, Palo Verde's new catalog, a reader view for curriQunet

Sam opened S449 with the standard line and said nothing more in session; the funding side session and a second
side session (Scenario 4) ran beside it, one writer per file.

- **Read the catalog as the capture reads it, for curriQunet too.** S447's rendered view of a Berkeley City iq
  address showed the Summary tab alone, because the catalog draws its other tabs from JSON on a click. The page
  reader's `cq_view` (a plan page with `cq_catalog`) now makes the capture's own calls through `cq_json`,
  `cq_children` and `cq_page`, and prints the entry's navigation record, the child pages read and the joined text
  with the coarse net's codes (page read 39849599506). The three credit Multimedia Arts certificates print every
  code the state lists on a Requirements tab (Digital Photography 15 of 15, Animation Level I 13 of 13, Motion
  Graphics 16 of 16, as `MM/DI 011`, `MM/AN 003A`, `MMART 197`); the noncredit twin prints `MM/DI 510`-`550`.
  Main's capture of 2026-10-16 read Animation Level I's own page at 1 of 13, so it never read the Requirements
  child. The entries sit under an untitled, hidden node (39968) inside section 39966, and `cq_pages` reads an
  entry's children only when its navigation record says `haschildbodynavs`. The free capture on the current
  reader (run 39853098819) is the test; its preview is on `claude/harvest-berkeley-city-s449`.
- **Mt. San Jacinto's remaining gaps are the catalog's.** The capture view (page read 39849099432) of
  `chemistry-ast` and `public-health-a.s.-t` shows Overview and Career Exploration alone: "The Chemistry, A.S.-T
  is being revised [and] is not available to new students in the 2026-2027 academic year"; "The Public Health,
  A.S.-T is currently being revised and is expected to be available shortly." The sitemap lists no own page for
  Musical Theater (the theater-arts department prints Technical Theater and Theatre Arts), the office
  administration certificates, Environmental Studies A.S., Mathematics A.S. or Culinary Arts & Hospitality A.A.;
  Advanced Audio Technology reads the catalog's Audio Production. Five other MSJC transfer degrees with dotted
  award slugs (`geology-a.s.-t`, `journalism-a.a.-t`) were found, so the slug reader needs no change. No reader
  change; the 15 page-claimed and 22 not found stand.
- **Palo Verde moved to an Acalog catalog, 2026-2027.** The census had moved its registry row from
  `pvc.elumenapp.com` (2025-2026) to `catalog.paloverde.edu`; a free capture (run 39850074235) found 66 of 68
  from 54, every program on a `preview_program.php` page, 13 gaining a page (Communication Studies 2.0, Alcohol
  and Drug Studies A.A., the two Anthropology awards, the noncredit certificates). Extraction of all 66 runs
  under the $40 go (run 39852997888); load, reread and display follow.
- **A free capture under the S443-S447 rules at five colleges last captured 2026-10-10 to 10-15** (branches
  `claude/harvest-<college>-s449`): Cypress 260 to 274 found (run 39848037321; HVAC and Administration of
  Justice programs on department pages; 18 extracted, run 39853370754); Victor Valley 178 to 176 (below);
  Mt. San Antonio and Long Beach City still capturing at the checkpoint.
- **A department's course list is not a program's page, and the heading rules now refuse it.** Victor Valley's
  Nursing Licensure certificate had read `degrees-certificates/nursing/` at 0.867 and Irrigation and Water
  Management `agriculture-natural-resources/` at 0.769 (main's capture, 2026-10-15); the capture view (page read
  39853165646) shows both pages print the department's course descriptions and a PROGRAMS tab the capture leaves
  out, and the agriculture department lists no Irrigation and Water Management award at all. Under the
  section-heading rules each page goes to a program a heading names, so both are page-claimed now: a correction,
  not a loss. Their loaded records read a course list; they belong with the 25 below.
- **Hartnell by its site: 0 of 105.** S411 had measured that the PDF prints 79 program codes where the site's
  search lists 100, so the reader gained `route=site` (a dispatch input; `prefer_site()`; the procedure step
  stands). The run (39850594534) listed 100 programs and loaded each program's page, but found a Requisites link
  on none (`requisites_suffix` null, 60 missed): the vendor-hosted catalog names the tab otherwise or draws the
  requirements from a data call. Page read 39853502958 prints two program pages' tab links and data calls.
- **Ohlone's 15 low-coverage credit programs are not in the 2026-2027 guide under the state's lists.** The
  guide's Associate in Arts in Art names about 18 ART courses where the state's Fine Arts A.A. lists 72 (art,
  music and theater); its Computer Science A.S. (CS-102, CS-113, CS-116) is the near-miss page of the state's
  Computer Studies A.A. (CNET 160A, CS 101, CS 146); page reads 39850460662 and 39853324740. The college's to
  settle in COCI. The 18 noncredit certificates are on the college's noncredit web page (`/noncredit`), which
  the chapter PDF does not carry. A keyword that the guide prints on earlier pages fills the fourteen-page cap
  before the pages wanted: name the course codes the state lists, as the guide prints them, with `pdf_span`.
- **Twenty-five live rows carry an older display build.** 19 are rows whose program is page-claimed in the
  latest capture and whose filed record the newer extraction replaced (Sierra 11, Oxnard 2, MiraCosta 2,
  Foothill, Orange Coast, Palomar, Ventura); 6 are filed records that place none of their listed courses
  (Citrus 11244, Grossmont 32879, Moorpark 39413 and 45352, Orange Coast 22394, Santa Barbara City 32629), which
  the builder leaves out under Sheet 62 card 1. Removing live rows is Sam's: Sheet 115 card 1.
- **The Canonical SUBJ4 scope note is a paragraph** (#2360): its handbook link measured 15 px as a control inside
  a div; as prose the engine reads it as an inline text link, which WCAG 2.2 exempts.

## Moved from the lane (S449 compaction)

**RULED (Sam, Open Asks Sheet 97 card 1, 2026-10-19 03:11Z, his own call: Build with Grok; `cpl_memory` `sam-sheet-97-second-reader-grok-2026-10-19`; https://claude.ai/artifact/1eWaN6UmVnKaJhGYTqQtfN):** a second reader, xAI's Grok, over the records that fail a machine check: the same text read by a second model, both readings scored by the scorer, agreement evidence and disagreement a known issue carrying both; first the 93 failing records at Cañada, Taft and San Joaquin Delta; public catalog text only. **Built (S421, #2246):** the function's version 11 takes `provider` (`anthropic` or `xai`; the same prompt, message and schema), `kb/_second_reader.py` reads a college's failing records from the page the first reading came from and scores both readings (`agree` · `second_passes` · `both_fail_same_checks` · `disagree`), and `second-reader.yml` runs it and uploads the comparison; nothing is written. **Waits on** two secrets only Sam sets on the Edge Function (`XAI_API_KEY`, `XAI_MODEL`; Sam's call 6, sheet 23: no model key in GitHub) and one deploy (`cpl-chat-deploy.yml`, `program-requirements-extract`; live is v10 of 2026-10-15). Then dispatch `second-reader.yml` with `college=Cañada College`. **Jev's sittings (S420-S421):** lessons, *Moved from the lane (S447 compaction)*.

**S424 (#2256, #2258; Taft's renumbered BUSN 550/555; the four wrong-page rows; a Jev sitting asks only about the gating checks):** lessons S424. **A renumbered course (Merced, S423, #2253):** a college's `course_renumbers` (`kb/program_requirements_reconcile.json`) maps a catalog code to the state file's where both print the same title and units, each pair cited; the capture looks for the listed course by its printed code and the scorer reads it as the listed one, never where the file lists the printed code. Fable's advice: lessons S423. **NEXT:** Merced's last nine (each the college's to settle in COCI; the list is in lessons S423); Taft 30284 is on its own page in build e0407fdcb54b (its two footnote courses without units are a second-reader row); ✅ Sheet 98 card 1: Sam deleted Taft 38661 on 2026-10-21 (lessons S440). Card 2 *later*: **the second reader waits on the xAI API billing moving to the RCCD district card** (Sam, 2026-10-20), so the model rows wait (steps: lessons S424; `cpl_memory` `sam-sheet-98-rulings-2026-10-19`); Orange Coast 10278 passes (read live 2026-10-21).

## S447 SkyBrittlebush (2026-10-22): an Administration of Justice address, a hyphenated code, Mt. San Jacinto and Santa Barbara City

- **Read the sitemap before calling a program's page missing.** Both colleges' sitemaps (page read 39770285975)
  list every missing program's own page: Mt. San Jacinto's `administration-justice-as`, `anthropology-aat`,
  `history-aat`, `kinesiology-aat`; Santa Barbara City's seven `/justice-studies/administration-justice-*` pages.
  The capture read the sitemap and dropped them itself, so the fault was the reader's filter, not the finding.
- **`/administration` in `NOT_PROGRAM_PATH` dropped every Administration of Justice program (#2349).** The pattern
  was meant for the college's administrators section and matched any address beginning with the word. Only a
  whole `/administration/` segment is dropped now.
- **A hyphen joins subject and number at Mt. San Jacinto (#2349).** The catalog prints `ANTH-102` and
  `ANTH-C1001L`; `SUBJECT_TOKEN` read only a space, so every Requirements tab read as naming no course and was
  dropped, while the Program Map tab (a sample sequence that mentions `ANTH 105` once in prose) was kept. 85 of 99
  found programs had read the whole hidden page (textContent), and the transfer degrees lost their pages to the
  general education pages. The capture view (page read 39773199040) showed it in one read.
- **A transfer degree whose state list is far wider than its page loses on coverage.** Santa Barbara City's
  Philosophy AA-T and Film, Television, and Electronic Media AS-T keep their Requirements tabs, but the state's file
  lists 130 and 193 courses (the whole CSU humanities list), so their own pages name too small a share. No reader
  change was made; it is the coverage gate, worth a rule only if it recurs.
- **A plan reads one college.** `tests/college_page_read_test.py` fails a plan whose pages span two college
  domains; split the capture view by college before committing it.
- **Mt. San Jacinto, after #2349:** free capture 39775680177 found 115 (from 99), page-claimed 25 to 15, not found 28
  to 22 (17 gained their page; Musical Theater A.A. lost its department page). Extraction 39779328144: 115 for
  $9.18, 93 passing (from 74). Load 39782892386: 18 inserted, 94 kept, 3 placing none.
- **Santa Barbara City, after #2349:** free capture 39775686975 found 254 (from 249), page-claimed 20 to 15 (six
  Administration of Justice programs gained their pages; Physics A.S. lost one and keeps its loaded record).
  Extraction 39782741424 re-extracted all 254 for $18.39, 210 passing (from 206); load 39788639887: 6 inserted, 241
  kept, 7 placing none; reread 39789668568 replaced 8. Mt. San Jacinto's reread 39785231446 replaced 85.
- **Display build be2635ed5b73** covers both colleges (17,414 statements in its receipt, against 17,391 for
  0ad3c75bfa19 by the same count).
- **Berkeley City's 27 unfound are all Multimedia Arts (page reads on `claude/s447-berkeley-city-read`, runs 39786898807,
  39787382470, 39789714704, 39791941728, 39793778941).** The catalog lists the credit certificates (Digital Photography
  40048, Animation Level I 40037, Motion Graphics 40043) beside noncredit Certificates of Completion, and the capture
  read them: Animation Level I's own page named 1 of its 13 listed courses. The noncredit Requirements tabs print
  `MM/DI 504A`, `MMART 505A`, `MM/DI 515A`, `MM/DI 550`; the state's file lists the credit certificates with `MMDI005`,
  `MMDI015A`, `MM/DI 22`, `MMART 197`. A rendered view shows only the Summary tab (Requirements loads on a click), so
  a credit page's codes need its Requirements node read through `_getNavigation` then `_getPage`. Not yet read.
- **Saddleback's free capture (39748152661) moved nothing:** 314 found and 26 page-claimed against main's 321 and
  19, with six pages lost to ECONNRESET; the seven newly page-claimed were never loaded. No extraction.
- **Display build 0ad3c75bfa19 applied on main** (run 39766423451, 78 minutes; S446's build).

## Moved from the lane (S447 compaction)

**Jev's sittings (S420-S421):** `kb/_jev_harvest.py` via `typesafe-smoke.yml` `harvest=<college>`; run for Cañada (22 rows), Taft (24) and San Joaquin Delta (49), no errors, the whole sitting in seconds after the free capture. A session's verdicts beside each row are in `kb/jev_harvest_verdicts/<slug>.json` (Cañada: cause held on 16 of 16 settled; Taft: 15 of 21; Delta: 17 of 49, and the floor rule built from its misses cleared 41, S422). Jev's cause is reliable; its owner leans wrong the same way everywhere, naming the scorer or the extraction for a figure a procedure step supplies or a page the reader cut. No gate is set: these are a session's verdicts, not Sam's, and `GATES` takes precision 1.00 on a person's.

## Moved from the lessons (S645 compaction)

Verbatim from `docs/program_requirements_harvest_lessons.md`, moved at the S645 checkpoint to keep it under its budget.

### S584 SkyMinkowski (2026-11-05, the CPL Queue routine, 14:12Z firing): course objectives read and stored

- **The build Sam asked for on 2026-11-02** (*"we should grab course objectives and store them as well"*): the reader's
  `objectives_of` takes the first Course Objectives heading with items under it, the lead-in, and each line to the next
  section. Hosts print it four ways: "Course Objectives:" (RCCD, Las Positas), "Course Objectives" (Santa Ana, Coast),
  "STUDENT LEARNING OBJECTIVES:" (SDCCD's outline report) and "Student Learning Objectives" with an "Objective Text"
  label before each item (SDCCD's All Fields report).
- **Two boundary faults found on the filed pages, both fixed before any load:** SDCCD's outline report ran on into
  "Section II" and "1. COURSE OUTLINE AND SCOPE:" (146 items on one page), and its All Fields report into "Disciplines"
  and "Condition"; the outcomes' STOP list misses the plural "Disciplines" because of its word boundary. `OBJ_STOP` names
  them. The All Fields page text breaks a long field across lines (CISC 106 read 27 items against 25), so that report's
  items come from its Objective Text fields; the two SDCCD reports then agree course for course.
- **Las Positas prints the heading again in its DE section with nothing under it;** the first heading with items wins.
- **Reparse of the nine filed trials:** every SLO field unchanged; objectives on RCCD, SDCCD (both), Santa Ana and Las
  Positas 12 of 12, Coast 9 of 12, the eLumen trials none.
- **Storage:** `course_outcomes.kind`, applied live through the MCP before the readers' `kind=eq.slo` filters merged
  (a filter on a missing column answers 400, and an objective row posted to the old function would have landed as an
  SLO row). Rollback: `kb/migrations/2026-11-05_course_outcomes_kind_rollback.sql`.
- **Lesson: a new row kind in a shared table needs every reader filtered in the same PR.** Five readers took every row
  as an SLO (the Program Requirements dialog and index, CPL Pathways' two counts, the COCI lookup, the exhibit SLO
  neighbors, the queue status count); the dependency map found them.
- **Monterey Peninsula:** a free page read of the six unequal records left (`kb/college_reads/mpc_unequal_left.json`,
  #2809), for the next session to read back before any step.

### Moved from the lane (S584): moved to archive 4 (S619 compaction)

The section as it stood is in `docs/program_requirements_harvest_lessons_archive_4.md`, verbatim.

### Moved from the lane (S592): Monterey Peninsula's paragraph, as it stood

**Monterey Peninsula (S535-S536; its 2026-27 CourseLeaf site): 183 of 197 passing**. Its steps: MPC GE 24-34, Cal-GETC 34 (both years' words), the 60 a floor ("electives, if needed"), `or_units`, `and_units` (a lab printed joined to its lecture, "CSIS 50 · & 50L", takes 0). The 14 left: lessons S536. S536 moved 7 (3.6%), so one more session under 3% parks it. **RULED (Sam, Open Asks Sheet 159 card 1, 22:51Z 2026-11-02, his own call: "keep"):** the 60 stays a floor, as S535 read it. **S590 (#2809):** the six unequal records read back (page read 42046379839); two steps on the catalog's words: the floor for transfer degrees too (Global Studies 37243; Fable advised) and `or_units` `parent_from_block` (Accounting 22052's "Select one of the following: 2 · WORK 96 · or WORK 99"). Reconcile 42195216637 dispatched. The other four need reader work or stay as printed: ASL 39266 (an `&`-joined alternative pair), Hospitality 41831 ("Any List A course not already selected" dropped), Nursing 03633 (Humanities and Ethnic Studies lines not kept), Anthropology 32033 (the catalog's own 23 counts List C at 4: leave). **S591:** reconcile 42195216637 moved Global Studies 37243 (183 to 184; Accounting 22052 still fails), reread 42201297009 replaced 33 rows (receipt `kb/receipts/program_requirement_records_college_reread_monterey_peninsula_42201297009.json`), display build 04dec589445a. **PARKED (S591, the stopping rule):** S584 moved 0 and S590 1, both under 6 of 197; `monterey-peninsula-parked-2026-11-06` names what turns it on (the three reader items, its 2027-28 catalog, or Sam's word). Sam unparked Glendale and LA Valley on 2026-11-02 with *"handle the discrepancies after all data is harvested"*, so the sweep's next college is one with missing records, not the next largest discrepancy count. #2809 merged (S592) after display build 04dec589445a applied 17,546 of 17,549 (3 rows gone, 0 errors).

### S593 SkyTadpole (2026-11-06, the CPL Queue routine, 13:12Z firing): #2838 merged; Ohlone's noncredit gaps placed

- **#2838 merged** (`3699b20d`) after the `step=display` apply (run 42217856222) committed its record: 17,547 of 17,550,
  0 errors, the 3 missing being Monterey Peninsula rows the table no longer holds (S592's note). The bot's applied-record
  push starts no `test`; updating the branch from `main` and marking it ready did, green in 13 minutes.
- **Ohlone's 18 noncredit gaps are the college's own.** Three free page reads (`kb/college_reads/ohlone_noncredit_s593.json`;
  42225429355, 42227635069, 42228515615; four loads): `/noncredit` links a Noncredit Certificates page; that page links 18
  program pages, and the noncredit program list (`/academics?field_degrees_certificates_tid=1186`, alphabetical, page 1
  runs A to S) names 20. Neither names Customer Service, Business Support Specialist, Entrepreneurial Business, DRE Exam
  Preparation, Effective Job Search, Math Foundations or Community Mental Health Preparation. The one missing program the
  site still links, Computer Aided Design Skills 38975, answers 403 with a sign-in page: an unpublished page, never read.
  With S451's 15 credit programs, all 33 of Ohlone's gaps are programs COCI lists that the college does not publish.
- **Check what a page links before reading what it says.** The certificates page's own text named only departments; its
  links named the programs. A plan's `links` pattern is the cheap half of a page read.

### S594-S595 (2026-11-07, the CPL Queue routine, 06:12Z and 08:12Z firings): Siskiyous re-read

- **A reader upgrade is worth a free re-capture before a page read.** S594 re-ran Siskiyous' capture (42346303670) on
  the current eLumen reader (`publish/content`, a 230-page walk): 73 of 77 found against 65 on run 38979399672. The 8
  new are Accounting COA 19374 (page-claimed before) and seven noncredit programs the old walk never reached.
- **`would_extract` with `kept: 0` means every page's text changed**, not that every program is new: the reader's text
  differs from the filed sources, so the extraction sends all 73 (about $5). Cheaper than splitting the run, and it puts
  the 65 old records on the same reader as the 8 new.
- **S594 stopped before its checkpoint** (#2874 open at 06:24Z, one commit, green). S595 merged it and wrote handoff 595;
  a firing that finds a green, quiet queue PR with no handoff merges it and carries its items.

### Moved from the lane (S595): Mt. San Jacinto's paragraph, as it stood

**Mt. San Jacinto (S592-S593, #2838 merged): 116 of 152 found.** Its gaps are the catalog's own (lessons S448); Public Health A.S.-T 39455 was read and loaded, display build 7b1f3658a888 applied by run 42217856222 (17,547 of 17,550, 0 errors; the 3 missing are Monterey's rows already gone). The other 35 stand as the catalog prints them (recheck Chemistry A.S.-T 40010 with the next catalog edit).

### S596 SkyPinwheel (2026-11-07, the CPL Queue routine, 09:12Z firing): Siskiyous loaded and reread; Palomar re-captured

- **A load after a re-extraction keeps the old rows; the reread replaces them.** Siskiyous' load (42359009832) inserted the
  8 new programs and kept the 65 already live, which still carried the old reader's records (42 passing). The reread
  (42359184639) replaced all 65 from extraction 42354853403, so the college went from 42 to 66 passing (about 31% of 77,
  far above the stopping rule's 3%). Whenever `would_extract` sends programs already loaded, follow the load with
  `step=reread`.
- **A merge of `main` into an SLO branch conflicts on `.load` and `.run`.** Keep the branch's lines (Mission's #2800 put its
  own on main) and begin the commit message with *Merge*: the read and load gates skip a head commit whose message starts
  that way, so the load does not run twice.
- **Palomar's free capture** (42359155179) runs on the curriQunet reader as it stands after S447 and S531; its last capture
  was 2026-10-22.

### Moved from the lane (S596): Ohlone's paragraph, as it stood

**Ohlone (S593, #2841): 146 of 179 found; every gap is the college's own.** S451 placed the 15 credit gaps (programs the 2026-2027 guide no longer prints under the state's lists). Page reads 42225429355, 42227635069 and 42228515615 placed the 18 noncredit ones: the college's noncredit certificates page and its program list (A to S) name none of them, and the one it still has a page for, Computer Aided Design Skills 38975, answers 403 behind a sign-in. All 33 are the college's to settle in COCI; no paid read. Its open work is the 29 extracted records failing a machine check (arithmetic 18, coverage 13, outcomes 8, invented 1). Its failing records wait for the outlier pass (Sam's Nov 2 ruling).

### S598 SkyAndromeda (2026-11-07, the CPL Queue routine, 11:12Z firing): Palomar re-captured, Coalinga extracting, Los Medanos captured

- **Check a capture's host errors before extracting from it.** Palomar's capture 42359155179 found 8 fewer programs than
  the filed read, and the 8 matched the 8 entries in `curriqunet.errors` (seven 60 s timeouts and a 503). A read files
  its new record set in place of the old one, so extracting there would have traded seven passing records for one better
  Chemistry page. A free re-capture costs runner minutes only; compare `found` and the lost control numbers first.
- **Pick the next college by pass share and reader age.** The lowest pass shares on a reader since upgraded (eLumen:
  Los Medanos 30%, Columbia 37%, Redwoods 50%) are the free re-captures most likely to pay, as Siskiyous' did.

### Moved from the lane (S598): the Progress view, as it stood

✅ **The Progress view (S343, #1900):** the tab's first view, from the mock-up Sam approved (*"The mockup looks good to go"*). `MILESTONES` and `PARTS` at its top are definitions; the tables are read live; what anon cannot read comes from **`kb/status/program-requirements.json`** (`kb/queue_status.json` until S418), written at every checkpoint (step 12, `scripts/queue_status.py`), never from a widened policy. **The view is drawn by the Commons' shared module `commons_progress.js` since S419** (the Commons' step 1; [commons lane](commons.md)): this tab keeps its definitions (`MILESTONES`, `PARTS`, `WHOLE`, `HEADLINE`, `PROGRESS`) and its live reads, and lends the module its sections and count controls. Detail: lessons S343. Every count opens what it totals; a card waiting on Sam links where he answers (#2077); a call in `kb/queue_status.json` must carry its answer link (`link`, `view` or `records`) and may name its card (`part`). *Whole harvest* and *Complete*: lessons, *Moved from the lane (S542 compaction)*. A status-file note replaces its card's live foot, so delete one the moment it stops being true.

### S600 SkyWhirlpool (2026-11-07, the CPL Queue routine's 13:12Z firing)

- **Coalinga displayed.** Apply 42372728141 on `main`: 17,557 of 17,560, 0 errors (the 3 missing are the Monterey
  Peninsula rows the table no longer holds). It ran about an hour; a display apply is not quick.
- **Palomar: a re-extracted program that was already loaded needs `step=reread`, never only `step=load`.** Load
  42376077805 inserted 0 and kept 281 (the load never replaces a row); reread 42376267731 replaced 05201 with its
  before-values. Display build 598157545f29 (#2887).
- **Los Medanos: read the failures by shape before paying for anything.** Of 54 failing, about 37 share one shape (the
  degree's 60 and a GE pattern, no GE units), so the fix is a reconcile step, never a re-extraction. A four-page free
  read (`kb/college_reads/los_medanos_ge_totals.json`, run 42376216539) gave the words: each transfer page prints
  *"Completion of California General Education Transfer Curriculum (Cal-GETC)"* with no figure, so the step sets 34 on
  transfer degrees only, citing the statewide 34 as Cañada's and Hartnell's steps do. The local A.A./A.S. pages print
  neither GE units nor an electives sentence, so they wait on a read of LMC's GE page. Reconcile 42376691800
  moved 29 to 44 passing at no model cost; reread 42377887155 replaced 27 rows (#2889).
- **The builder needs `openpyxl`** (`chatbox/build_program_courses.py`); a fresh container lacks it. Install it with
  `python3 -m pip install openpyxl`. A bare `pip` may install it for another Python.

### S602 SkySombrero (2026-11-07, Sam's session)

- **Palomar and Los Medanos displayed:** applies 42377748161 and 42379928561, each 17,557 of 17,560, 0 errors (the 3
  Monterey Peninsula rows the table no longer holds).
- **Find a page the catalog never linked by reading its hubs.** No GE URL was on file for LMC. Pass 1 (run
  42396753803) read the eLumen front page with `links` shown and `follow` on GE words, which found
  `26-27/requirements`; pass 2 (42397034327) read that hub and followed its topics: `asdegreereq` (local GE *"at least
  24 units"*), `gradreq` (no electives rule) and `calgetc` (the areas, no total; they add to 36 with Area 5 printed
  at 9). Two free runs, four and six loads.
- **A GE figure alone does not pass a degree whose blocks fall short.** Accounting A.S. 01528 computes 23 against
  60; GE 24 leaves it unequal. Cerritos's `electives_fill_degree` came from its own *"electives as needed"*; LMC prints
  no such sentence, so its local degrees are parked rather than given an invented step.
- **Citing another college's statement of a statewide figure is the house pattern.** Taft, Hartnell and LMC cite
  Monterey Peninsula's page for Cal-GETC's 34; LMC's own page prints no total, so the citation stands.

### S604 SkySculptor (2026-11-08, the CPL Queue routine's 06:12Z firing)

- **SLOs: Contra Costa loaded.** Load 42454133971: 492 inserted, 39 skipped, receipt
  `kb/receipts/course_outcomes_ccc_42454133971.json` with its delete (#2873). The bot's receipt commit started no `test`;
  a `Merge main into ...` commit pushed from the session did, and the read and load gates skip it by its message.
- **Cuesta's index landed** (42434939730), so the helper moves it to a trial. A trial is a preparation run, and the
  index already used 2026-11-08 UTC's one, so the trial waits for 2026-11-09 on #2910.
- **A free re-capture pays only when the pages changed.** Columbia's capture 42454382707 (`extract=0`) found 82 of 83
  with `would_extract.kept` 82 and `programs` 0: every page reads as filed, so its 37% pass share sits in the records and
  their reconcile steps, never in the capture. Read its failures by shape before anything else (the Los Medanos method).
- **Redwoods the same:** capture 42455994350 found 73 of 79 with `kept` 73 and `programs` 0. Both of S598's free
  re-capture candidates read as filed; the next pass on either is its failures by shape, then a reconcile step from the
  catalog's own words. Los Medanos was the third candidate and is done (S600 to S602).

### S605 SkySextans (2026-11-08, the CPL Queue routine's 08:12Z firing)

- **Columbia's 51 arithmetic failures in the committed records (the summary says 52), by shape:** 47 sum their major correctly and fail the degree check as `incomplete` only
  because the record names a GE pattern with no units: 26 local degrees name *CC-GE or Cal-GETC*, 21 transfer degrees
  name Cal-GETC. The other four are single arithmetic misreads (12023, 32444, 38891, 45075). So Columbia's pass share turns on two `set` steps, never an extraction: Cal-GETC 34 on `awards: transfer` (the
  house citation, Monterey Peninsula's GE page) and CC-GE's units on local degrees, cited from Columbia's own catalog.
- **The page read is filed:** `kb/college_reads/columbia_ge_units.json` (free, no model call) on #2915, to find how the
  pages word CC-GE and its units. The step waits on that read's log.

### S606 SkyFornax (2026-11-08, the CPL Queue routine's 09:12Z firing)

- **Columbia's page read (42462494860) answered for transfer degrees only.** AA-T pages print *"including completion
  of: 1. The California General Education Transfer Curriculum (Cal-GETC) Pattern"*. The Cal-GETC page prints no total,
  so a step sets the statewide 34 on `awards: transfer` (reconcile 42466476925). The `follow` pattern never loaded
  `ge/cc-pattern`, which the page listed as a link: check that list before you conclude a catalog prints no figure.

### S607 SkyBode (2026-11-08, the CPL Queue routine's 10:12Z firing)

- **Columbia's transfer step landed: 31 to 52 of 82 passing.** Reconcile 42466476925 moved exactly the 21 transfer
  degrees it reached; reread 42470609423 replaced 23 rows with before-values
  (`kb/receipts/program_requirement_records_college_reread_columbia_42470609423.json`); display build `15f40f7d1781`,
  applied by run 42470928680.
- **The CC-GE page prints Columbia's own figure.** Page read 42470655341 (`kb/college_reads/columbia_ccge_pattern.json`):
  *"To satisfy the CC-GE Pattern, complete 21 semester units of general education coursework"*. The Associate Degree
  Requirements page (`requirements/aa/as`, all 27 local degrees) prints *"complete one of the following General Education
  (GE) Patterns: Columbia College General Education (CC-GE) Pattern ... Cal-GETC Pattern"* and *"STEP 4: Complete a
  minimum of 60 degree-applicable semester units"*. So two `set` steps on a program page naming the CC-GE pattern:
  `ge_units` 21 to 34 (Monterey Peninsula's *MPC GE or Cal-GETC* reading) and `degree_total_minimum` (San Joaquin Delta's
  floor: a floor alone needs no electives sentence). This is where Columbia differs from Los Medanos, whose pages print
  no floor and no electives rule, so its local degrees stay parked.
- **The college gate overrides a step's.** Columbia's entry carried `awards: transfer` at the college level, which
  `reconcile()` checks before any step, so a local-degree step under it never runs. The gate moved to `associate` and
  the Cal-GETC step keeps its own `transfer`.
- **Simulate a step on the filed records before dispatching.** `reconcile()` over each failing record with a text that
  names the pattern, then `degree_check` on its computed sum: 28 of 30 failing degree checks pass (the two left are
  certificates, 12023 and 45075). General Science 38891 still fails its own program check (0-39 against 18), so it
  stays failing.
- **The floor's one risk, checked.** Five local degrees run past 60 at the low end with CC-GE's 21 (Culinary Arts 07580
  at 43 + 21, Automotive Service Technician 07577 at 44, Baking and Pastry 07583, Foodservice Management 06833,
  Ecological Forestry 12031). Each major passes its own program check, so the sum is the catalog's and *a minimum of
  60* is met; no misread hides under the floor (Fable's caveat at Monterey Peninsula, S535).

### S608 SkyCondor (2026-11-08, the CPL Queue routine's 12:12Z firing)

- **Columbia's local-degree steps landed: 52 to 78 of 82**, as simulated. Reconcile 42471133430, reread 42479331475
  (27 replaced, before-values), display build `437d468743b9`. The 4 left are single misreads, filed as read.
- **A display apply reports `failure` on the 3 missing Monterey Peninsula rows.** Run 42470928680 wrote 17,557 of 17,560
  with 0 errors and the job still ended red. Read the applied record (`written`, `missing`, `errors`) before calling
  a display run failed; the 3 rows are the ones the table no longer holds (S592's note).
- **Redwoods reads like Columbia.** Of its 35 failures, 14 transfer degrees name CalGETC with no units and fail as
  `incomplete`, and 8 local degrees name the 60 and no GE (`unequal`). The rest are single misreads and 7 coverage
  failures. Page read 42479757804 (`kb/college_reads/redwoods_ge_units.json`) found the transfer
  pages' *"including the CalGETC General Education requirements"*; a Cal-GETC 34 step (simulated, 14 of 14 pass) runs in
  reconcile 42480098144 on #2918.
- **An eLumen GE page can render no text to the reader.** Redwoods' `grad5` (Cal-GETC) loaded with status 200 and only
  its menu, so the statewide 34 keeps the house citation. Try the page's Print link (`api-prod.elumenapp.com`) for `grad4`.
- **Merge `main` into a college branch before its display build** (S609): #2918 predated #2917, and its build would
  have reverted Columbia's display. **Never `git stash` between `git add` and the commit**: the pop restores the tree,
  not the index, so the commit carried the receipt without the page's new stamp (run 42489271385 canceled).

### S613 SkyCometa (2026-11-09, Sam's session): Redwoods' CR-GE page is empty

- **An eLumen catalog page loads in two steps, and the second can be empty.** The page fetches
  `catalog/sites/publish/<year>,<page>` (2.9 MB, mostly styling) whose `html` says *Loading* and names a `contentUrl`
  (`catalog/sites/publish/content/<year>,<page>`). The headless browser never fetched it (read 42539434482). Read the
  content address directly: Redwoods' `grad4` (CR-GE) returned its heading alone, 60 characters, and `grad2` its opening
  paragraph (read 42540109133). So the catalog prints no CR-GE units, and the 8 local degrees stand as filed.
- **`network_find` searches every response, the interface-text bundle included:** its six places a word went to
  eLumen's 200 KB `i18n` strings before the page's own data. Name strings the bundle cannot hold, or read the content
  address.
- **A `follow` pattern matches link text too:** `print` followed *ART 44 - Introduction To Printmaking*.

The S607 block of Siskiyous, Palomar and Coalinga as they stood moved to `docs/program_requirements_harvest_lessons_archive_4.md` (S609).

### S618 SkyPinwheel (2026-11-09, the CPL Queue routine's 10:12Z firing): Alameda's description total, Orange Coast's load

- **A curriQunet page's description sits above the course table, and the table's header is the boundary.** Every
  Alameda page reads title, description, then `SUBJECT # / TITLE / UNITS`, then the lists. A total printed in prose
  (*for a total of 41 units*) is ahead of the header; a choice's own figure (*listed for a total of 4 units*) is a block
  heading under it. A lookahead `(?=[\s\S]*?SUBJECT\s*#)` in the step's pattern scopes the fill with no new code: the
  `before` scope needs `section_heading`, and Alameda's Dental record names a block heading there, which sits below the
  description.
- **Simulate a step on the page read's own text, from the job log.** The page read files nothing: its text is in the job
  log only (`get_job_logs`, tail about 330 lines for the last two pages; the blob URL behind it is refused by the proxy).
- **Not every incomplete record has a missed total.** Chassis 09009 already read its *61-64*; its semesters (48) plus the
  printed *General Education and Electives required 19.00- 22.00* make 67-70, so no GE step makes it add up.
- **An SLO load's receipt arrives as a bot commit, whose `test` waits as `action_required`,** and ready-for-review
  starts none (`js-tests.yml` takes `pull_request`'s default types). A branch cut before the last checkpoint also
  conflicts on the lane file, and a conflicting PR runs no `pull_request` checks. Merge `main` in and commit the lane
  line onto the SLO branch: a real change, and `test` runs on the head.

### S619 SkyTadpole (2026-11-09, the CPL Queue routine's 11:12Z firing): simulate on the capture's text

- **A page read through `cq_view` is not the text a reconcile step sees when the capture took another page.** Check the
  record's source in `sources.json` first: Alameda's Dental 19837 was captured as `sitemap_page` / `innerText` (3,671
  characters, description cut), while the page read printed the catalog JSON (6,312). The step matched the read and
  nothing in the run (42600854055). Compare `text_chars` with the read's `chars` before dispatching a reconcile.


### Moved from the lane (S630): College of Alameda as it stood

**College of Alameda (S617-S619, #2956, #2960): 29 of 59 passing (was 25) (`program_record_machine_pass`), among the lowest shares of the credit colleges with 40 or more records.** 16 failures carry no program total and read `incomplete`; 9 lay their courses out by semester (FIRST to FOURTH SEMESTER, each block stated, rule all), so the blocks sum with no total to check. Page read `kb/college_reads/alameda_program_totals.json` (five entries through the capture's JSON, catalog 10507) (run 42585679798) answered: Chassis and Drivetrain A.S. 09009 prints *"General Education and Electives 19.00- 22.00"* and *"Total units required for A.S. Degree: 61-64"* below its semesters, so the extraction missed a printed total; the Diesel Mechanics certificate 19827 prints its four semester subtotals and no total; Dental Assisting 19837 prints *"for a total of 41 units"* in its description beside blocks of 32 and 9; Communication Studies 41483 prints *"Select 18 units from the following courses: 18.00"*. **S618's reconcile step did not reach Dental (S619):** a `fill` of `total_units` from *for a total of N units* ahead of `SUBJECT #` was simulated on the page read's text (the catalog JSON, 6,312 characters), but the capture reads Alameda's rendered page (`sitemap_page`, `innerText`, 3,671 characters), whose description is cut (the record's own note: *Text begins mid-sentence*). Reconcile run 42600854055 changed no record by the step; it rescored 01118 and 45292 under the current scorer (`unequal` to `incomplete` against the degree, both still failing). S619 removed the inert step and merged the filed run. A total printed only in the description reaches the scorer when the capture prefers the curriQunet JSON text for this host, a capture change tested across the curriQunet colleges first. Chassis 09009 already holds its *61-64*; its local GE pattern carries no units, and the page prints *General Education and Electives required 19.00- 22.00* over 48 units of semesters (67-70 against 61-64), so no GE step passes it. Communication Studies 41483's one list (*Select 18 units*) and the semester layouts print no total. **NEEDS SAM (Open Asks Sheet 177 card 2, 2026-11-09):** the open question, a definitional one: whether a semester layout with no printed total counts as adding up when each semester's courses equal its printed subtotal (6 records: 01113, 01114, 09012, 19827, 19831, 19832). The scorer's rule is a printed total, never a computed one, so this is a card for Sam, not a reconcile step. **The transfer degrees (S619, #2960):** page read 42609117444 (`kb/college_reads/alameda_transfer_ge.json`) found each AA-T/AS-T table ending *General Education (Cal-GETC) and Elective Units* (40-42) above *Total Units 60.00*, so a reconcile step sets Cal-GETC's 34 on transfer degrees only (the Redwoods pattern). Simulated with the scorer: 42964 `equal` (overlap), 33032 and 32765 `equal` with 7-8 units of electives. Mathematics A.S. 01129 is local and stays out. Reconcile 42610498785 (no model call): **29 of 59 passing** (was 25); 32503, 33032, 42964 and 45292 pass; 31145, 32714 and 37047 took the step and still fail their major's own sum, as before; 32765 did not take it (its captured text may lack the line). Reread 42612577841: 7 replaced, 0 errors (receipt with rollback). Display build c4bc9799a305, apply run 42613918046. NEXT: merge #2960 when the apply's receipt shows 0 errors.

### S630 SkyCartwheel (2026-11-10, the CPL Queue routine's 12:12Z firing): Las Positas

- **`cq_view` takes a three-part iq address only** (`.../iq/<root>/<section>/<node>`). Las Positas's entries are
  five-part (`/iq/102/105/137/1672/1677`), so the first read (42814990033) reached nothing in one second. Its capture
  reads the rendered page (`innerText`), so the plain render (42815817415) answered all six.
- **A curriQunet degree page can print GE and electives as one figure** (*Additional General Education and Elective
  Units 36.0 · Total: 60.0*). It closes the sum, but it is not GE alone: a local degree's GE units still need the
  college's own GE pattern page.

**S631 (SkyMayall, 2026-11-10): the display build's page file is a sample.** After Las Positas's reread, the rebuilt
`cpl_pathways_roep_data.js` changed only its build stamp and the 22 sample programs' daily inputs, and named no Las
Positas program. A college's display facts live in the build's SQL receipt, which `step=display` applies; the page
file's diff is no test of whether a college was built. Also: a page-read plan that touches both the college's site and
its curriQunet catalog must declare `curriqunet.com` in `outside_hosts` with its reason.

### Moved from the lane (S633): Los Medanos and Las Positas as they stood

**Los Medanos (S599-S600, #2889): 44 of 83 passing (was 29), free.** About 37 of the 54 failing named the degree's 60 and a GE pattern with no units. Page read 42376216539 gave the transfer pages' words; a reconcile step sets Cal-GETC 34 on transfer degrees only. Reconcile 42376691800, reread 42377887155 (27 replaced, before-values), display build a19682c0630e. Detail: lessons S600. Displayed: apply 42379928561, 0 errors. **GE page read (S602, `kb/college_reads/los_medanos_ge_page.json`):** `26-27/asdegreereq` prints *"at least 24 units"* for the local pattern; `gradreq` prints no electives rule; `calgetc` prints no total, so the MPC citation of the statewide 34 stands (as for Taft, Hartnell). GE 24 alone passes no local degree (Accounting A.S. 01528 computes 23 against 60). **Parked:** the local degrees wait on an electives sentence in LMC's own words.

**Las Positas (S630-S631, #3056): 145 of 193 passing** (116 before). A reconcile step sets Cal-GETC's 34 on transfer degrees only (the Alameda pattern), on the ADT pages' sentence *"including both of the following: The California General Education Transfer Curriculum (Cal-GETC)"* (page read 42815817415, `kb/college_reads/las_positas_ge_units.json`). Reconcile run 42816943064 changed 40 records; reread 42823942266 replaced 40 rows (38 pass; receipt `kb/receipts/program_requirement_records_college_reread_las_positas_42823942266.json` holds the before-values); display build 46aae217691c applied by run 42825327646. The 47 local degrees print one combined *Additional General Education and Elective Units* figure above *"Total: 60.0"* (Administration of Justice A.A. 36.0), so it never stands as `ge_units`. Page read 42825317081 (`kb/college_reads/las_positas_lpc_ge.json`) found the LPC-GE page (`lpcarticulation/lpcge.php`) prints only a link, *2026-2027 Las Positas College General Education (LPC-GE)*; the AA and AS GE pages list archives to 2024-25. NEXT: The 2026-27 LPC-GE page (`lpcarticulation/lpc-ge/lpc-ge-2026-2027.php`, read 42827288689) prints units per area and no total: Area 1 6, Areas 2 to 6 3 each, Area 7 Kinesiology 1, Areas 8 Health and 9 American Institutions 3 each *"Not required for AS degrees"*; summed, A.A. 28 and A.S. 22. A `ge_units` set from that sum is a computed figure, the same question as Alameda's semester layouts (Sheet 178 card 2), so it waits on Sam's answer there. **NEEDS SAM (Open Asks Sheet 179 card 4):** may a reconcile step set a local GE pattern's units from its printed per-area units (A.A. 28, A.S. 22), when the pattern prints no total? #3056 merged (S633) once display run 42825327646 committed its applied record (17,557 of 17,560 written, 0 errors; the 3 missing are Monterey Peninsula's rows the table no longer holds).

### S633 SkySilverDollar (2026-11-10, Sam's session): Las Positas merged, De Anza's card, the lost premise

- **A display apply that ends red can be a success.** Run 42825327646 failed after 82 minutes and still wrote 17,557 of
  17,560 rows, 0 errors; its applied record committed. The 3 missing are Monterey Peninsula's rows the table no longer
  holds, as in S592 and S608. Read `written`, `missing` and `errors` in the applied record before calling it failed.
- **A runner's push starts no CI.** #3056's last commit came from the workflow token, so the PR showed no check runs at all.
  A session push (here a merge of `main`) starts `test`; mark the PR ready and merge on it.
- **Moving a paragraph can close a card by accident.** S630 moved Alameda's paragraph to the lessons and kept the marker
  but not the six record ids, and Sheet 178 card 2's premise check reads both, so the builder refused the next sheet as
  if Sam had ruled. The lane names the ids again (#3074). When a lane line carries a card's marker, keep what the card's
  premise check reads with it (`p_*_open` in the vault builder).
- **De Anza waits on a person, not a read.** #3044's reads showed the catalog links two separate GE sheets and prints no
  pattern units; deanza.edu refuses the reader, so the ask is Sam hand-filing them (Sheet 179 card 5). #3044 merged with
  its lane text so the card's premise is on `main`.

### S634 SkyBackward (2026-11-10, Sam's session): Sheet 180's two harvest rulings carried out

- **A summed figure is set with the page's own words beside it.** Las Positas's local degrees took LPC-GE's 28 (A.A.)
  and 22 (A.S.) only together with two flags the same page states: *Double counting courses in GE and the major is
  permissible* (`ge_overlap`) and *Elective units must be degree applicable* (`electives_fill_degree`). GE alone would
  have left Chemistry A.S. at 67 against 61 and Administration of Justice A.A. at 52 against 60. Award kinds `local`,
  `local_aa`, `local_as` keep a transfer degree out. 181 of 193 pass (145 before); eight local degrees whose captured
  page lacks the combined line still read incomplete.
- **The page's exact words came from an earlier read's job log.** Run 42815817415 had already read two local pages
  whole; reading its log back gave the sentences for the patterns, with no new load of the college's site.
- **A computed total is narrow by construction.** `semester_sum` fills `total_units` only where the record holds no
  program or degree total, every semester block adds to its own printed subtotal, and no other block asks for units.
  That left Chassis 09009 (a printed degree total) as filed and took exactly the six records the ruling named.
- **Every reconcile step carries a `field`.** `tests/program_requirements_college_test.py` reads `st["field"]` on every
  step in the file; a new kind that needs none still names the field it writes.
- **One display build after several colleges' rereads.** Alameda's PR merged with its reread; the build ran once on
  Las Positas's branch after `main` came in, so two branches never carried competing builds. Do not run the build with
  a merge conflict open: resolve and commit first.
- **The college workflow's filing step rebases and retries**, so a session push to the branch during a run is safe.


### Moved from the lane (S636): the nightly SLO read, Redwoods, Las Positas, Alameda and De Anza, as they stood

**The nightly SLO read (Sam, 2026-11-01: *"yes to SLO hints and the nightly harvest"*):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), most exhibit articulations first (`scripts/next_slo_colleges.py`); a host that prints none gets a verdict in `kb/course_outcomes/queue.json`. Pages only, no model call, so no cost. Loads so far (Golden West, Santa Ana, Las Positas, Columbia, with runs and receipts): lessons archive 4, *Moved from the lane (S584)*. Since then Mission (S591), Lake Tahoe (S596, 435 rows) and **Contra Costa (S604, load 42454133971: 492 inserted, 39 skipped; receipt `kb/receipts/course_outcomes_ccc_42454133971.json`; #2873)** are loaded, and **Orange Coast (S617 read 42585338847, 4 parts on host cccd; S618 load 42599803011: 3,035 inserted, 568 kept, 143 skipped; receipt `kb/receipts/course_outcomes_cccd_42599803011.json`; #2955)**. **Cuesta's trial (run 42573515439, #2910) first parsed 0 of 12 pages**, though all 12 print a *Student Learning Outcomes* block: another section of Cuesta's All Fields outline holds an `iq-data-list`, so `groups_from_html` took it for SDCCD's grouped report and returned no groups. S616 sends any SLO section without a data list of its own to the text reader, and reads Cuesta's objectives from the lines labeled `Objective ` alone (the methods and content between them were read as objectives, up to 199 a page). The 156 pages filed by every trial reparse unchanged but Cuesta's; Cuesta now parses 12 of 12 (60 outcomes) and stands at *read*. Guard: check 20 of `tests/course_outcomes_read_test.py`. **Orange Coast's full read** (`catalog=orange_coast`, 4 parts, host cccd) took 2026-11-09's one full read (S617, #2955): pull the branch, `--all`, and write `.load` once every slice is filed. **Cuesta is loaded (S626 read 42768224688, 2 parts, 677 of 679 pages parsed; S628 load 42781504144: 1,356 inserted, 2 skipped; receipt `kb/receipts/course_outcomes_cuesta_42781504144.json`; #3037).** Lemoore prints none (S627 verdict, #3038). **Next:** the day's full read and preparation run, as `--next` names them, on the first firing of 2026-11-11 UTC.

**Redwoods (S608-S609, #2918): 53 of 73 passing, displayed** (was 38). Reconcile 42480098144 ran a Cal-GETC 34 step on the 14 transfer degrees, on Redwoods' own words (page read 42479757804). Reread 42488814337 (24 replaced, before-values), display build d3cfafe64e93 on `main`'s records, apply 42489393040 (17,557 of 17,560, 0 errors; the 3 Monterey Peninsula rows). The 8 local degrees name the 60 and no GE (`unequal`) and stand as filed: the catalog prints no CR-GE units (S613, reads 42538790768, 42539434482, 42540109133; `kb/college_reads/redwoods_crge_units.json`). eLumen's `grad4` content address returns its heading alone (60 characters) and `grad2` its opening paragraph. NEXT, only if a source turns up: the CR-GE pattern as a program in eLumen's program list, or a counselor sheet.

**Las Positas (S630-S634; #3056, #3085): 181 of 193 passing** (145 before). **RULED and done (Sam, Open Asks Sheet 180 card 4, 19:35Z 2026-11-10: count):** the local degrees take LPC-GE's units summed from the areas its 2026-27 page prints, A.A. 28 and A.S. 22, and each record's note says the figure is summed. **DECIDED (S634):** the same pages' words set two flags, `ge_overlap` (*Double counting courses in GE and the major is permissible*) and `electives_fill_degree` (*Elective units must be degree applicable*); award kinds `local`, `local_aa`, `local_as`. Reconcile 42892238131, reread 42899948939 (52 replaced, 0 errors; receipt `kb/receipts/program_requirement_records_college_reread_las_positas_42899948939.json` holds the before-values), display build 29e68f1d8dd2 (it carries Alameda's six), applied by run 42900864858 (17,557 of 17,560 written, 0 errors; the 3 Monterey Peninsula rows). Twelve local degrees still fail: eight read incomplete because their captured page lacks the combined line, four fail their major's own sum; they stand as filed. Cal-GETC 34 on transfer degrees and the earlier runs: lessons, *Moved from the lane (S633)*.

**College of Alameda (S617-S619, S634; #2956, #2960, #3086): 35 of 59 passing** (was 29). **RULED and done (Sam, Open Asks Sheet 180 card 2, 19:35Z 2026-11-10: count):** a `semester_sum` reconcile step gives a semester layout the sum of its printed subtotals as `total_units`, marked `total_units_summed`, only where the record holds no printed total; the six records (01113, 01114, 09012, 19827, 19831, 19832) pass. **DECIDED (S634):** Chassis 09009 prints a degree total and stays as filed. Reconcile 42892493763, reread 42896121924 (6 replaced, 0 errors; receipt `kb/receipts/program_requirement_records_college_reread_college_of_alameda_42896121924.json` holds the before-values). The earlier reads and the Cal-GETC step: lessons, *Moved from the lane (S630)*. Display build 29e68f1d8dd2 carries these six (Las Positas's branch, #3085).

**De Anza (128 of 212 passing; S627-S628, #3044):** 73 of its 84 failures are degrees that read `incomplete` for want of GE units. Its 2025-2026 catalog (Sam's hand-filed copy; deanza.edu answers the reader 403) prints *90 quarter units* and *one of the GE patterns* on every degree page, and on page 39 only links two separate sheets (*General Education/Breadth Requirements for AA/AS Degree*, *CSU General Education/Breadth Requirements*) and `deanza.edu/articulation/ge-requirements` (run 42783023601). No figure in the catalog gives a pattern's units. **RULED (Sam, Open Asks Sheet 180 card 5, 19:36Z 2026-11-10, his own call: file):** he posts a hand-filed copy of the two GE sheets (*General Education/Breadth Requirements for AA/AS Degree* and *CSU General Education/Breadth Requirements*) (the hand-filed step, #2199), then a `ge_units` `set` step on De Anza's own words; until then De Anza waits and the sweep moves to the next largest gap.

## Moved from the lessons (S647 compaction)

### S636 SkyAntennae (2026-11-11, Sam's session on handoff 636): Butte, 87 to 138 of 165

- **The shared cause, listed live first.** Butte passed 87 of 164 with no reconcile steps; 72 of its 77 failures were degrees that named a pattern and the degree's total with no units for the pattern. Glendale is parked and De Anza waits on Sam's two GE sheets, so Butte was the next largest gap.
- **The degree pages print no figure; the catalog's General Education section prints both.** Each page prints `GE Pattern(s): Butte Local, Cal-GETC` (or Cal-GETC alone) and a term map, `Map (Butte GE)` or `Map (Cal-GETC)`, whose lines read `Area 1A Choice (See GE Guide)` (page read 42957477366, `kb/college_reads/butte_ge_units.json`). The guides: *Complete a minimum of 21 semester units of general education* (Local; seven areas, one 3-unit course each) and *Complete a minimum of 34 semester units* (Cal-GETC) (page read 42961405888, `butte_ge_guides.json`). No figure is summed and none is cited from another college.
- **Reaching a section three levels down took five free reads.** The rendered view of a section address redirects to the catalog's first page. The way in: `_getNavigation?id=<catalog>&navigationtypeId=1` read as a plain page gives the top nodes; `_getNavigation?id=<catalog>&parentId=<node>` each level below; then `cq_view` on `.../iq/<root>/<list>/<item>` joins the item's tabs and prints them whole. A `_getPage` read prints only its first 3,000 characters. Plans: `butte_ge_section`, `butte_local_ge`, `butte_local_ge_guide`, `butte_ge_guides`.
- **Four steps (DECIDED, `cpl_memory` `d-butte-ge-units-own-words-s636`).** `ge_units` 34 on transfer degrees and 21 on local ones; `electives_fill_degree` from the map's *Only necessary if the 60 units needed to graduate have not been completed*; `ge_overlap` on a local degree from *Meets Area 4.* beside a course of the major. The overlap step rests on the map's area notes, where Hartnell and Las Positas had a double-count sentence. The local graduation requirement's 2 units stay out: the guide exempts many programs and lets its courses double count with a GE area.
- **A reconcile that changes nothing: read the guard before the steps.** Run 42962429245 changed 0 of 165. Butte's registry address had become `.../Catalog//iq/25371`, so the capture spelled every entry `/Catalog//iq/...` where the filed records say `/catalog/iq/...`, and the moved-page guard held every record out. `same_address` folds letter case and a doubled slash; `own_heading_kept` still asks the fresh text for the record's own heading (check in `tests/program_requirements_pilot_test.py`).
- **Runs.** Reconcile 42973457189: 88 changed, 135 pass. Eight degrees held only the map's text, so each pattern also reads the map's title; reconcile 42985449223: 8 more changed, 138 pass. The simulation on the filed records had said 145: it could not see which records lacked the `GE Pattern(s)` line. A reread posts one run's records, so two were dispatched (the first with `force=42973457189`).
- **Live and displayed.** Rereads 42998334970 (84 replaced) and 42998339612 (8 replaced), 0 errors, no row checked by a person; receipts `kb/receipts/program_requirement_records_college_reread_butte_<run>.json` hold the before-values. Live: 138 of 164 pass. Display build 052fb9eac1b5 on `main`'s records, applied by run 42999415016: 17,557 of 17,560 written, 0 errors (the job reads *failure* on the 3 Monterey Peninsula rows the table no longer holds: 03653, 22098, 39361).
- **The 27 left.** 25 read `unequal` (16 local A.S., 9 transfer): the sum lands inside the map's printed range without meeting either end, where the record carries the map's elective units as a requirement. One A.S. lists a prerequisite with no units (14583); one certificate names no total (39882).
- **Each capture of Butte takes about 93 minutes** (1,171 loads at the polite delay). A reconcile cannot reuse the last capture's text; a step that could would save the wait on a pattern fix.

### S636, second stretch (2026-11-11): COBIx's backlog (#3096), the blocked-source procedure, Redwoods' CR-GE

- **A source another reader found is verified from a runner before anything rests on it.** Two free reads confirmed COBIx's finds: Redwoods' 2026-27 CRGE sheet (*CRGE Units Required 21*, *Minimum Degree Units for Associate 60*; read 43013608134) and De Anza's 2026-27 eLumen catalog.
- **A rendered eLumen program page keeps its requirements behind a toggle** the page reader does not open (run 43014508848). Read the content address the capture reads instead: `api-prod.elumenapp.com/catalog/sites/publish/content/<catalog>,program,<slug>?tenant=<host>` (run 43015726456).
- **Redwoods' local steps.** The pages print the total only in the title, `A.S. Degree ( 60.0 Credits )`, and no general education line. Three steps: `ge_units` 21 keyed on the title; `degree_total_minimum` where the title prints 60.0 (the sheet calls the 60 a minimum); `ge_overlap` on Forestry's *can be double counted for GE requirements*. 53 to 59 of 73.
- **A college-level `awards` gate can hold a new step out.** Redwoods' entry read `transfer`, so reconcile 43016437012 changed none; it now reads `associate`, each step keeping its own gate. Read the entry's top level before a dispatch.
- **The Los Rios 404 is keyed to the census user agent.** The hand-filed-copy user agent, which also names the CPL Initiative, gets the file at the college's own address (COBIx, #3096). The colleges recompiled their catalogs on 2026-11-06, so the copies pinned on 2026-10-17 are the earlier edition.
- **A registry row a person corrected** (De Anza, Sam's go of 2026-10-17) is changed only by saying so on the row, and the session's permission check refused the apply: it waits on Sam.

## Moved from the lane (S648 checkpoint)

Verbatim from the lane, 2026-11-13.

**Standing decisions of S640 and S641** (the list rule never lowers coverage, `d-pdf-reader-design-calls-s640`; equal coverage holds a passing record; the kept-passing guard, `passes_live` equal only), the fingerprint's known costs and the proof table: lessons, *Moved from the lane (S645)* and *(S641)*.

🔨 **Throughput (S644-S647; Sam, 23:53Z 2026-11-12: *"we need to increase our throughput"*).** Records: lessons, *S644* to *S647*.

**The gap census** (#3189) gives each active program without a passing record one cause and one lever. **DECIDED (`d-passes-live-stays-equal-only-s644`):** `passes_live` stays equal only; the tab, the census and the headline count equal or unstated (`counts_passing_on_tab`).

## Moved from the lane (S648, Glendale loaded)

**Glendale (#3202, draft, head `2a0e4631`, loading).** **DECIDED (`d-keep-passing-record-no-read-s647`):** a filed record that passes is never deleted by a read that produced no record for its program. **DECIDED (`d-glendale-tab-control-number-s648`):** the reader keeps each Coursedog tab's control number, and that number decides the tab's owner (NCHSD's data names 31597); a tab stays shared only for "2.0" successors whose title adds numbers alone; owners file merges per tab; a hold restores `main`'s copy and never deletes or replaces a passing record; the load skips 12571 and 37070 (failing on `main`). **DECIDED (`d-glendale-load-plan-s648`):** the load plan is measured against a live read of the table, never against the filed records: main files 260 records, 34 of which place no course and were never live; the live read (about 20:00Z, *as reported*) held 226 rows, 0 checked, 121 passing. Plan `kb/program_requirements_college/glendale_community/load_plan_s648.json` (on the branch): `step=load` inserts 31 (26 pass; 02570, 02587, 24010, 30813, 45068 fail); `step=reread force=43415972509` replaces 139; `step=reread force=43497305929` replaces 4; 83 live rows untouched (68 identical, 15 with no branch record, among them 19577 teach-out, 24377 and 37070, failing 2025-26 PDF reads). Expected after: 257 live, 174 on the two runs, 182 passing. A second reader found the load's hold guard failed open (the file step dropped the hold list from `summary.json`); fixed on the branch, the load derives refused tabs itself, test added. Reads: free 43472166835 (261 of 261 pages, 242 programs, 220 tabs with a control number); paid 43497305929 (73 calls, 0 failed, $5.12 on a $7.30 estimate, the deployed 503 caller check's first real use): 31597 and 42263 pass; 02603, 18639, 18640 fail; 18638, 21305, 37960 keep their passing 2025-26 records; 24377's branch record removed (its only passing read was NCGOC3, whose data names 24327). **The load ran** (run 43498802104; its receipt on the branch, `2a0e4631`, records 31 inserted); the two rereads, the display build, COBIx's spot-check (31597, 42263, 02603, 18639, 18640; asked on #3202) and the merge follow. **Read the table first:** `select count(*), count(*) filter (where extracted_run in (43415972509, 43497305929)), count(*) filter (where public.program_record_machine_pass(checks)) from program_requirement_records where college='Glendale Community College'`. The paragraph as it stood: lessons, *Moved from the lane (S647, Sheet 191)*.

🔨 **Phase 2, a college at a time: 114 colleges hold records (15,946; S414), every new record unchecked until read.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` (its readers: the catalog sweep, below); `assign()` gives a page to the programs whose award and title it names most fully. A push reads only on `[read]`/`[extract]`; a dispatch runs `step=read`, `load` or `display`. The load is insert-only and commits a receipt naming every inserted key, which is the rollback; a record placing none of its listed courses (another program's page) stays out of the load and the display build. **Display:** each build applies through the display job, which files each row's prior build (the rollback); Sam's standing go of 2026-10-10, confirmed 2026-11-13, covers a build that follows a load, at every college. **Extraction runs with no card up to $40 a college** (`sam-extraction-standing-go-40-per-college-2026-10-14`); above $40 it is a card. The display job applies the build `cpl_pathways_roep_data.js` carries: run `kb/_build_roep_display.py` and commit its outputs first (lessons S385). A program pointing at a retired version of a course the college still offers lists it, placed, no flag (Sam, 2026-10-11). A college must be in the builder's dated reads (`kb/program_requirements_pilot/`, `registry_read.json`, `map_cr_by_course.json`) before its display is built; S385-S398 reads and rulings: lessons archive 3, *(S495 compaction)*.
