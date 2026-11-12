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
