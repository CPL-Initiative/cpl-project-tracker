---
title: "Program requirements harvest lessons — archive 2 (S360-S371)"
created: 2026-10-15
updated: 2026-10-15
tags: [lessons, archive, program-requirements, catalog-harvest]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - docs/program_requirements_harvest_lessons.md
  - docs/program_requirements_harvest_lessons_archive.md
---

# Program requirements harvest lessons — archive 2 (S360-S371)

Moved verbatim from `program_requirements_harvest_lessons.md` at the S394 compaction (the lessons doc stood at 110 KB of its
120 KB budget). Earlier sessions are in [`program_requirements_harvest_lessons_archive.md`](program_requirements_harvest_lessons_archive.md).

## S360 SkyLichen, 2026-10-11: COCI's status on every mismatched course, rules 4 and 5, and a delete the connector would not run

*Written by S361 SkyBirch from S360's PRs and memory rows; S360 checkpointed at the context warning (Rule 9a) and left
this section unwritten.*

**The reading flow (#1970).** Sam: *"Have the split screen open automatically when I click in to review. When I choose
Confirm or Save Note close the screens and bring me to the next item to confirm."* The reading room opens the catalog's
window by itself; a verdict in side by side opens the next waiting record in place, catalog with it; with none left, the
screens close. The home-tab flash came from the panes painting before `tabs.js` routed: a guard in the `<head>` of both
HTMLs hides them until it does, and lifts itself after 15 seconds if the script never comes.

**RCCD's recovered programs (#1971, display `f571b009992c`).** Riverside City's re-run with #1967 added 7, Moreno Valley 7,
Norco 6. The re-read no longer files Riverside City 39120 (Building Energy Systems Professional in HVAC Technology,
A.S.), whose page was HVAC Commercial Technology's (AS946, the page 39105 reads; the reader's note said TITLE MISMATCH).

**Most catalog additions are on their own program in COCI, under another status (#1972, display `195fe0c35a2d`).**
Reading the Program Course File under every status, 1,025 of 1,610 catalog-addition entries sit on their program: 715
Inactive, 159 Active, 128 Approved, 23 Deleted. The raw export keeps every status; `assemble()` keeps three, which is why
no reading saw them. Sam's rules 1 to 3 from the Mt. San Antonio sample are built: a chip names the COCI status, COCI's
units fill in where the catalog prints none (labeled *(COCI)*), and a unit difference between the blocks' sum and the
printed total stays on the record (79 programs). Sam also noted (01:40Z): *"RCCD and others publish catalog agenda to
correct errors and late approved courses"*, so an addendum may settle a mismatch before it is the college's to fix.

**Rules 4 and 5 (#1974, record shape 4, extraction v5).** A `recommended` block (minimum null, counts toward nothing) and
`program.careers`, word for word. The scorer adds nothing for a recommended block and reports careers missing from the
text without holding a record back. Careers stay out of the requirements fingerprint, on the server too
(`program_record_fp`; all 1,226 live fingerprints unchanged). Sierra's `ruleOf` had read any unknown rule as "all
required", so a recommended block would have been read to a student as required: her fix ships with the rules, and her
deploy must come before any record with a recommended block is checked.

**Sheet 61 answered, both his own call (01:26Z):** card 1 "rules" (Long Beach City's 379 programs extract once rules 4
and 5 ship), card 2 "remove" (39120). In chat: *"Go Long Beach and remove stale"*, then *"retry and deploy Sierra"*.

**A destructive statement has no working path from a session.** The guarded delete of 39120 timed out three times in
`apply_migration`, the third with Sam's approval given, no migration recorded and nothing in `pg_stat_activity`, while
inserts and updates the same hour applied at once. `execute_sql` refuses it at the repo's Supabase guard. S359's eight
removals went through `apply_migration`; today the same call does not return. The receipt (`kb/receipts/
program_requirement_records_rcc_39120_removed_2026-10-11_s360.sql`) is the paste for Sam's SQL editor.

**A push that touches the extraction script starts the pilot extraction** on the live function, against whatever
version is deployed. Both pushes of the rules branch started one (runs 38103589673 and, after S361's rebase,
38104914021); each was canceled.

## S361 SkyBirch, 2026-10-11: rules 4 and 5 live, 39120 removed, Long Beach City reading, and a program read in two calls

**Shipped.** #1972 (COCI's status, units and unit differences) and #1974 (rules 4 and 5) merged; Sierra (`cpl-chat`,
run 38105455751) and `program-requirements-extract` v5 (run 38105512705) deployed from main, both byte-verified. The
five-program sample (run 38105588567, $0.39) kept every prior block, labels, rules and course counts alike, and added only
what the rules ask: recommended blocks at Cerritos 41982, Irvine Valley 10265 and Mt. San Antonio 42916 (where VOC HEP and
VOC NCLXP moved out of missing_explained), careers where the page prints them. Santa Monica 43767 fails the arithmetic as
it did before (the salon block prints no minimum). Long Beach City's read with extraction started from `claude/s361-lbcc`
(run 38105864413), the card 1 plan: show a sample, then read once.

**39120 is gone, by Sam's hand.** The repo's Supabase guard refuses a `delete` through `execute_sql`, and `apply_migration`
had timed out three times. Sam ran the receipt's guarded delete in the SQL editor as a one-statement paste (a CTE returning
the removed count); the session read back 0 rows, 1,225 live, every row on display build `195fe0c35a2d`. A destructive
data write the session cannot run goes to Sam as that paste, with the read-back the session makes after.

**A path filter compares pushes, not branches.** `program-requirements-extract.yml` runs on a `claude/**` push that
touches its script. Merging main into the checkpoint branch after #1974 carried the script's change in, and the next push
ran the full 22-program pilot ($1.59, run 38105582450, nothing written; it did serve as a full-pilot check of v5: 21 of 22
pass, Santa Monica as before). S360 had canceled two such runs. #1976 adds a guard step: on a push, skip unless the
branch's script differs from main's; its own push proved it (setup and extraction skipped, run 38106437059). KB note:
`methodology-a-path-filter-compares-pushes-not-branches`.

**The smoke's NOCE read failed for ten minutes, not because of the deploy.** Three smoke runs between 02:31Z and 02:43Z
read `college_program_courses` for NOCE as empty (7v); the function answered as anon in 448 ms at 02:45Z, and the smoke
dispatched at 02:47Z passed in full (run 38106291463). One branch run also caught Sierra saying "COCI" after the user's
follow-up used the word; the main run passed that check.

**One reply cannot hold a 316-course record.** Measured over 1,219 filed records: about 54 output tokens per course
(Fine & Applied Arts, 215 courses, 11,200 tokens in 78 s), so Humanities, Philosophy & Arts (316) stops at the 16,000 cap
at all three RCCD colleges (110 s). The gateway ends a request that sends nothing back for 150 s (Mt. San Antonio 24171),
so a larger cap or streaming cannot hold it either. Sam: *"go with splitting the program into two calls"*. #1978
(extraction v6): a program over 240 listed courses, or a single call that runs past the cap or the idle limit, is read in
parts sent at once; each part holds the courses the text names first in its half, every block the section prints, and the
whole closed list (so catalog_addition keeps its meaning); `merge_parts()` aligns blocks by name and rule, drops an entry
whose first code the block already places, orders entries by where the block prints them, and keeps disagreements in
notes. A filed row with no record is no longer kept, so the next read retries it. Not yet deployed.

**The UI pass took Annual Workplan Goals** (#1977): four grey labels below AA in light, the primary chip and the
subsidiary marker unreadable in dark, the table's scroller unreachable by keyboard at 390 px; all pass after, measured on
the HTML the generator writes. The curator-only editing tints and the add form's boxed buttons wait for a later pass.

**The two-call read on real records (S361, after #1978 deployed).** Riverside City 18111 (run 38108461470) and Moreno
Valley 30169 (run 38111056537) each went to the model alone, the rest of the college kept from the same page: two parts,
75 s, $0.50 each. Coverage 295 of 313 and 289 of 296 with every missing course explained, catalog additions all flagged
(the catalog prints HIST where the state file says HIS), no repeated code, and the parts read the same two blocks with no
disagreement to report. The arithmetic stays incomplete: the catalog states the studio allowance in prose ("up to three
units may be from a studio course"), so the block has no minimum, as at Santa Monica 43767.

## S362 SkyAlder, 2026-10-11: Long Beach City's hidden index, 18 wrong-page records removed, noncredit equivalent units

**Long Beach City's first read gave the model the wrong text.** Run 38105864413 ($22.66): 12 of 379 records carry any
block. Every page hides an A-Z course index naming every course and keeps Program Requirements in a hidden tab, so
`best_text()`'s "whichever names more" chose `textContent` for 378 of 379 programs (none at the five colleges before),
and the window opened in the index. 89 empty records passed the machine checks by explaining every course away. Not
loaded. #1980: the visible text at half the courses, else the visible text plus each hidden tab panel read cell by cell
(`innerText+tabs`), `textContent` last; `unchanged()` compares the text a source came from; the scorer fails a record
placing none of its courses. Checked in Chromium on a page built like Long Beach City's before any spend; a 12-program
trial runs first (Sam: *"go ahead with the full Long Beach read after the trial"*). The run's artifact was out of
reach (the proxy refuses the blob host), so the diagnosis came from the records' own notes and `sources.json`. KB note:
`methodology-a-page-can-hide-text-that-names-every-course`.

**RCCD's three Humanities, Philosophy & Arts programs loaded and displayed** (Norco 30109 read in two calls like the
other two: 305 of 316 placed, the studio rule in prose), display build `f1de75baa344` (#1981).

**Sheet 62: 18 records that read another program's page, removed** (Sam: *"remove them"*). Each placed none of its
listed courses (Cerritos 3, Mt. San Antonio 13, Moreno Valley 1, Norco 1; 3 passed as scored). The receipt holds each row
as `to_jsonb(r)::text`: read as JSON, the connector rewrote `0.0` as `0` and the md5 guard would have refused the row.
`apply_migration` ran the guarded delete (S360's had timed out); 1,210 rows live. `places_none` keeps such a record out
of every later load and display build (#1983).

**Noncredit hours as estimated equivalent units.** No state file holds hours: COCI's course list carries UnitValue only
(0 for all but 2 of 11,435 noncredit courses; 847 descriptions name hours in mixed forms), the Program Course File no
units, MIS CB units only. The catalogs print hours for 331 of 395 course entries in the loaded noncredit programs. Sam
chose the lecture rate (*"handy when comparing mirrored courses ... and for funding based on equivalent FTES"*), for
estimating only, and never in Sierra (*"misconstrued as real units"*): hours / 16 rounded down to the half unit keeps his
bands whole (48-54 h = 3.0); the first half unit falls at 56 h where his note said 63. Put to him on Open Asks Sheet 63,
he kept it (*Keep hours / 16*, 16:11Z): one rule at every size. Both pages show it;
Sierra reads named display fields only and a test fails if she names it (#1984, build `2a73f45c9c84`).

## S363 SkyCedar, 2026-10-11: Long Beach City's tab bar sits in a nav, and the full read runs

**The trial that checked the fix found the fix had never fired.** S362's reader (#1980) read a hidden Requirements tab
cell by cell, tested on a page built to look like Long Beach City's. The 12-program trial (run 38139252216, $0.85)
read `textContent` for all 12 programs and 11 records came back empty again, the model reading the course index. The
filed `sources.json` named the field it used for each program, which is what showed it.

**The real page, probed in the runner.** The sandbox cannot reach the college (the proxy refuses the host), so a probe
on its own branch (`claude/s363-lbcc-probe`, run 38146508042, no model calls) loaded four pages through the census
Reader and filed each page's HTML with an account of every tab link and its panel. Every page keeps its tab bar in
`<nav id="tabs">`; the Program Requirements link is a `role=tab` inside it, pointing at a hidden
`#programrequirementstextcontainer` outside the menus. PAGE_JS dropped every link inside a `nav` as a site menu, so
`tabPanels` held only the page's search dialog (a `Close this window` button outside the menus). The course index is
a separate hidden menu, `nav#cl-menu`, naming courses in 120 subjects.

**The fix (#1986, merged on `test`):** a tab of the page's own tab bar (`role=tab`, or a link inside
`[role=tablist]`, `#tabs`, `ul.tabs`) counts wherever it sits; a hidden panel naming no course is left out. Checked in
Chromium against the four pages' own HTML with the probe's hidden elements hidden again: coverage 1.00, 1.00, 1.00,
0.97 on `innerText+tabs` (0.00 on the visible text alone), no index in the model's window. The repo already had a page
reader for exactly this (`kb/_college_page_read.py`, plans in `kb/college_reads/`, `college-page-read.yml`); the probe
script written instead stays on its branch and is not merged.

**Trial 2 (run 38147472758, $0.85):** 11 of 12 programs `innerText+tabs`, all 11 with blocks, 9 passing the machine
checks (trial 1: 1). Architectural Design and Biological Sciences fail arithmetic (a course pair printed with one unit
figure; an area-of-emphasis choice). Engineering A.S. was given the Engineering Technology page, whose tab names none
of its courses, so it fell back to `textContent` and placed none; `places_none` keeps it out of the load and display.
Any program with no page of its own can still win a page through the index this way, at about $0.07 an extraction.

**The full read** (run 38152016534 from `claude/s363-lbcc`, 15:37Z) runs on Sam's go; the trial's 12 records are
kept. The display builder's dated reads gained Long Beach City first: 33 course codes in `map_cr_by_course.json`
(per-course fingerprint 5c7d3a90393e710daa4f686a2f56c917, equal in SQL and over the filed rows) and its registry row.
The display dry run already counts KINPP 23 and five more Kinesiology courses as CPL here.

**Pushes that wake workflows.** A change to `kb/_program_requirements_pilot.py` runs the pilot capture
(`program-requirements-pilot.yml`, page loads only, read-only); a new branch cut from an older branch compares its
paths with the default branch. Check `push.paths` of every workflow before pushing a branch that touches the readers.

**Sign-off at the context warning.** S363 reached 104,467 tokens left before the full read landed, so the load and
display pass to the next session (handoff 364): Sam's go stands, the dated reads are in place, and the read branch
needs `origin/main` merged in first. Sam moved the CPL Queue routine to 05:05Z (10:05 PM PDT) so it fires after the
day's sessions; S363 let go of its check-in, PR watches and the Sheet 63 watch in the sign-off turn.

Memory rows: `sam-full-lbcc-read-if-trial-2-passes-2026-10-11`, `sam-load-display-lbcc-after-full-read-2026-10-11`,
`roep-lbcc-tab-bar-inside-nav-2026-10-11`.

### Moved from the lane (S363 compaction)

**Sam's ruling (Sheet 59 card 1, in chat ~19:45Z 2026-10-10, "RCCD go!", as proposed):** carried out by S358; Long Beach City follows. Memory row `sam-rccd-go-sheet-59-card-1-2026-10-10`.

**Sam's ruling (Sheet 60 card 1, 2026-10-10T23:52Z, "remove"):** the eight rows the Approved re-reads no longer carried are removed (S359, #1968); full rows and the rollback in `kb/receipts/program_requirement_records_eight_dropped_removed_2026-10-10_s359.json`.

## S364 SkyJuniper, 2026-10-11: Long Beach City loaded and displayed, retired-version pointers, and a word in a record's own text

- **The tab reader is slower.** Long Beach City's full read (run 38152016534) captured for 3 h 33 m (S362's reader: 2 h 15 m), extracted in 11.5 minutes, and filed at 19:22Z, 15 minutes inside the old 240-minute limit. The read job now runs up to 360 (Sam: *"go ahead and raise the timeout and re-run if needed"*). Both 12-program trials spent about 55 minutes in capture, so roughly 50 minutes of it does not depend on how many programs are read.
- **What the read gave.** 379 of 391 programs, $20.64, 274 passing the three machine checks; 302 read from `innerText+tabs`. 74 records place none of their listed courses, 73 of them read from `textContent` (no visible requirements and no tab the reader opens); the load left them out (`places_none`). Load run 38168152744 inserted 305, unchecked.
- **A record's own text can block a receipt.** The display build refused its receipt because Long Beach City 37305's careers note says "a reviewer may choose to drop it", and STALL guards the receipt against words the Supabase connector holds. `unstalled()` writes the last letter of such a word as a JSON `\u` escape: jsonb and `json.loads` read it back, so the display and its md5 are unchanged (checked in Postgres). The display job applies over REST, so the guard now only keeps a pasted receipt safe.
- **Retired-version pointers (#1995).** A program in the Program Course File that points at a retired version of a course the college still offers lists that course: placed, no flag, chip kept. The current version is offered when the file gives it a kept status or, on no program there, the Fall 2025 course basic report carries it. 538 course entries in build `344441813b01`.
- **Program records was slow for a signed-in reader (#1993).** Every card and every course table, hidden, was built on each draw (294,000 elements, 3.7 s for 1,210 records); blocks and closed colleges now build on first open.
- **Close-out (#2000).** The S365 handoff and `kb/queue_status.json` were written while the read still ran; the second session corrected both after #1999 (1,486 unchecked, the next step the 74 left out). A test shard that stops mid-run with no ✗ FAILED line and no summary is the runner, not the PR: `suite (4)` did so on #2000 after 71 of 103 files and passed locally in full.

## S365 SkyRowan, 2026-10-11: the per-college split, measured before it was built

The lane's NEXT ④ was to split `cpl_pathways_roep_data.js` per college so CPL Pathways shows every harvested program,
not the pilot's 22. S365 measured the plan on display build `344441813b01` before writing any of it:

- **Size.** All 1,515 records come to 18.2 MB of compact JSON (25.9 MB as the builder writes it, `indent=1`): 2.4 to
  4.0 MB for each large college, about 16 KB a program. Course facts are half of it (8.9 MB), the gaps 16%, the
  catalog record 27%.
- **A shared course table per college saves a third** (18.2 to 12.3 MB), and 1,779 course entries differ between two
  programs at one college, so the facts are not purely per course.
- **Churn.** Every record carries the build stamp, so each display build would rewrite every byte.
- **The gate.** `program_requirement_records` lets anon and authenticated read checked records only
  (`program_requirement_records_read`, `using (checked)`); an allowed reviewer reads all. 29 of 1,515 are checked, at
  six colleges. A file per college on Pages would publish the 1,486 unchecked records past that gate. The pilot's
  file already carries two unchecked of its 22.

The plan was a session's (S353, *"366 KB for 22 records"*), written before the harvest reached 1,515 records; Sam had not
ruled on it. It went to him as Open Asks Sheet 65 card 2, proposing that the tab read a record from the table when a
reader opens it, as the Program Requirements tab already does. The measurement script is a few lines over
`kb/_build_roep_display.py`'s `build()`; the lane file names the card.

## S366 SkyHazel, 2026-10-11: Long Beach City's 74 mostly read another program's page

The lane named the 74 records that place none as waiting on Long Beach City's reading procedure. Read from the
committed `sources.json` and records (no new read), most of them were never on their own page.

- **Why.** `candidates()` admits a page that names enough of a program's listed codes, and Long Beach City's hidden A-Z
  course index puts every code in every page's `textContent` (S362). Every page clears the net at coverage 1.0.
  `page_winners()` then keeps a page for every claimant tied at the top title score, and when the page names none of
  their titles that top is 0: Photography A.A. went to Fashion Design, Film, Floral Design, Fashion Merchandising,
  Administration of Justice, Physical Sciences A.A. and Fashion Design: Assistant Designer; Dance A.A. to five;
  General Education Patterns to five.
- **What the 74 are, by eye.** 11 read their own page and placed none: the reading procedure proper (Physical
  Sciences A.S., the five noncredit Office certificates, CISCO, Automation Technician, SMAW, Athletic Coaching, and
  IGETC on the GE Patterns page). 4 ESL Level 2 and 3 programs read the Level 1 page. About 10 read a page that may be
  the program renamed or a sibling (Engineering on Engineering Technology, Economics on Business Economics). About 49
  read a plainly different program's page.
- **The live data is clean.** `places_none` kept all 74 out of the load. Of the 305 loaded, 301 read
  `innerText+tabs` and one page names under half its program's title (CSU GE-Breadth on LBCC-GE, the right page).
- **The title score is weak where the heading carries the award.** "Computer Science" scores 1.0 on *Computer Aided
  Design - Mechanical - Associate in Science*: *science* comes from the award. A fix in `assign()` should take a page
  reached only through hidden text only when its heading names the program with the award words set aside.
- **What it cannot settle from here.** Whether each of the ~49 has any page in the 2026-27 catalog: the sitemap lists
  2,503 addresses (626 program pages), but the capture keeps only counts, and the sandbox's proxy refuses
  `lbcc-public.courseleaf.com`. A sitemap-only read on the workflow would list the programs COCI calls Active that the
  catalog does not print, which is the college's to settle (its addendum first, Sam's rule).


### S366, later the same day: the second cause, and both fixes (#2012)

- **The own pages hold their requirements in a tab that names under half of COCI's list.** Two page reads with no
  model call (`kb/college_reads/lbcc_own_pages_placed_none.json`, runs 38183849639 and 38184044746). The first read
  opened nothing, because the Program Requirements panel sits behind a `role=tab` link in a `<nav>` outside `<main>`;
  the reader's `expand` now clicks a page's own tabs. The second read printed each panel. Physical Sciences A.S. names
  about 13 of COCI's 35 courses and describes its math and computer choices in words; Microsoft Excel prints COSA 601
  and COSA 618 (90 hours) where COCI lists COSA 615-617; CISCO prints CISCO 250-253 (8 units) of COCI's 13; Athletic
  Coaching prints four KINPP courses on a local Certificate of Accomplishment page against 23. Under the 50% share,
  `best_text()` took whichever text named more, and on this host that is always the hidden index.
- **Fixes (#2012).** `best_text()` reads a page with tab panels from its tabs, whatever share they name; only Long
  Beach City's pages carry tab panels (every other college's 1,219 sources read `innerText`), so no other record
  moves. `candidates()` takes a hidden-text page only when its heading names the program: half the title's words and
  60% of the heading's own words, award words set aside, never a different level; on the 74 it keeps the 10 own
  pages and 6 renamed or sibling pages and turns away 58.
- **What is left is the college's.** Excel's mismatch (catalog COSA 601, 618; COCI 615-617) is a COCI record the
  college has not updated, or a catalog change COCI has not caught: addendum first (Sam's rule), then the college.
- **The sandbox cannot read run artifacts.** The proxy refuses the artifact store's host
  (`productionresultssa5.blob.core.windows.net`), so a page's full captured text is out of reach here; a page read on
  the runner was the workaround. Sam can allow the host in the environment's network settings.

## S367 SkyAspen, 2026-10-11/12: CPL Pathways reads the table, its UI pass, and two answers to one card

**Shipped.** #2015: CPL Pathways lists its catalog records from `program_requirement_records` and reads one record, by college and control number, when a reader opens it (Sam's chat answer to Sheet 65 card 2, *Read from the table*). The table's read policy decides who sees what: the public 29 checked records, a signed-in reviewer all 1,515, unchecked marked; the row's own `checked` wins over the display build's copy. The pilot file is the offline tier and a ladder's source. #2016: the tab's UI pass (controls as underlined words, the Student/College toggle gains `aria-pressed`, four decorative emoji out, the provenance line's doubled word, two sweep seeds for the table states). #2012 (S366's fixes for Long Beach City's 74) merged and the re-read was dispatched (run 38185403454).

**Lessons.**
- **The tab must never wait on the table.** The first build joined the list read before rendering; an existing test that mocks `fetch` and reads the DOM synchronously failed. The shipped shape renders from the file at once and swaps in the table's list when it lands, keeping the reader's pick by identity (`roep:<college>|<control>`), so a slow or failed read costs nothing but the swap.
- **A pick token must move on every pick, not only on record picks.** A slow record read that resolved after the reader switched to a featured map overwrote it; `show()` now bumps the token for every kind. The guard fails without the bump.
- **The sweep aborts every off-origin read, so the table's states are never measured unless seeded.** `cpl-pathways-table` and `-dark` hand the tab a list through its own landing path (`_roepIndexLanded`) and open an unchecked record or a record whose read fails.
- **Reading Long Beach City's records through the table surfaced a label bug the pilot never showed:** the `custom_html` platform label said "college's own catalog pages", so the line read "Long Beach City College's college's ...".
- **A gate fixture must carry every table a tab reads.** `admin_tab.test.js` classified CPL Pathways as "not checked" once the tab read two tables its fixture lacked; the fix was the tables' live gates (`checked | is_allowed_reviewer()`, `true`), not a code change.
- **The check-run listing can stay stale for 15 minutes.** `get_check_runs` showed three shards in progress long after they passed; `get_check_run` by id and `list_workflow_jobs` with `filter: latest` read fresh.

**Two answers to one card.** Sheet 65 card 2 was answered in chat at ~23:16Z (*Read from the table*) and on the sheet at 23:46Z (*Every record, marked*, after eight versions, note: "I want every record to show marked not yet confirmed"). The later answer is his deliberate words but contradicts a direct chat answer, so it is asked on Open Asks Sheet 67 before anything is built; #2015 stands meanwhile. Opening the table's public read would reach College Briefing and Program Requirements' public view too (Sierra filters `checked` itself).

## S368 SkyWillow, 2026-10-12: every record public, Long Beach City's re-read, and two curriQunet misses

**Every record is public (Sam, Open Asks Sheet 67 card 1, *Every record, from the table*; "Apply it" in session).** #2021
marks an unchecked record *Not yet confirmed* on CPL Pathways, Program Requirements and My College (the card's words, his
Sheet 65 words; CPL Pathways had said *Not yet checked*). Sierra filters `checked` herself, so
`tests/sierra_program_courses.test.js` now names her filter as the gate. The policy (`using (true)`) did not apply:
`apply_migration` timed out twice and wrote nothing, so it went to Sam as a paste. The page marks shipped first, so the
public never sees an unmarked draft.

**Long Beach City's re-read (run 38185403454, #2012's fixes):** 367 of 391 found (was 379), 311 pass the machine checks (was
274), coverage failures 25 (was 76), none invented (was 2), $19.13. Four have no page: GED/HiSET Preparation 39500, its
Spanish twin 39497, Barbering 43258 (noncredit, Approved) and 43837 (Active); no addendum on file. Load dispatched as run
38200167207 (305 rows before it).

**Chaffey and San Diego City: both captures found 0 (Sam: *both, capture now*; then *Chaffee next*).** Chaffey (run
38197183697): the walk found catalog 718 and the section Degrees and Certificates, read 40 nodes in 80 calls, listed no
program entry and stopped at its node cap. Its program index nests differently from Riverside City's tablist and linklist.
San Diego City (run 38197175054): the registry's address is a district alias (`/catalog/alias/city26-27/iq/15489`), and the
start page's scripts named no catalog id. Both readers need a runner probe of the catalog's own calls before any
extraction. The capture-first rule saved about $21 of model calls on two reads that would have extracted nothing.

**Pattern:** a capture-only dispatch per college, on its own branch, costs no model calls and answers whether the reader
reaches the catalog. Make it the first step for every new platform variant, not only every new platform.

## S369 SkyLaurel, 2026-10-12: Long Beach City displayed, the policy live, and the curriQunet reader for Chaffey and San Diego City

- **The policy is live.** Sam pasted the read policy (Open Asks Sheet 68 card 1, 11:18Z); read as anon, the public sees all 1,555 rows, 29 checked. `apply_migration` had timed out twice in S368; a paste card with the SQL and one read-back closed it.
- **A re-read can lose a good record, and insert-only keeps it.** Long Beach City's re-read gave Trauma Studies 43802 the department page (places none of nine) and found no page for 46290; the load kept both live rows from run 38152016534. The filing had replaced and deleted their files, so the display build dropped them. Putting the files back makes the repo's copy match the rows; the display test (`every program the page or a college folder files is in the receipt`) then needs a rebuild, so restore before building, not after. Build `05811159eeee` covers 1,554 rows; 38542 (the SMAW page, now 38540's) waits on Sheet 68 card 2.
- **Chaffey's curriQunet differs from Riverside City's three ways** (probes 38202133197, 38202752228): an entry ("Business Administration 2.0 for Transfer - AS-T Degree") holds a *Requirements* child where the curriculum is, beside a blank node kept out of the web view; the award pattern missed "degree", AS-T, and A.S. before a space (a dot then a space is no word boundary); and the walk spent its 80 calls on every program as a section and on Student Classifications and Programs. Fixed: entries may hold children (read up to four visible ones), degree sections first, 400 calls. Capture 38203335820: 193 of 199 found, 152 at full coverage, 9 nodes and 19 calls.
- **The same program twice.** Chaffey lists each program in its index and under its school, two ids, one title: 401 entries, 1,226 loads in 91 minutes. `cq_distinct` reads each title once.
- **San Diego City's start page names no catalog.** The district alias view (and the plain view) draw an empty "Active Catalogs" shell in a headless browser and fetch nothing. The host's `_getCatalogs` lists City 2026-2027 = 69, Mesa 70, Miramar 71; `cq_catalog_from_list` takes the one whose title's words are all in the college's name, in the registry's year. Its programs sit under *Degree Curricula and Certificate Programs* (15604).
- **Smoke 7s** (#2023): a pronoun for the articulation its own sentence names ("no San Gabriel Valley college has set this up yet") is set aside; 7c and 7s share one helper, so S368's "7c handles it" was wrong for both.
- **A worker restart cost six hours of wall clock** (04:35Z to 11:16Z); the 05:05Z routine stood down because this session held the queue. Long runs on a runner kept going and filed on their own.

## S370 SkyHolly, 2026-10-12: 38542 removed, Chaffey read, loaded and displayed, San Diego City extracting

- **Sheet 68 card 2 carried out.** Sam chose *Remove it* (11:20Z). Long Beach City 38542 (Advanced Arc Welding) read the Shielded Metal Arc Welding page the re-read gave to 38540. The row was read as `to_jsonb(r)::text` in a text column (5,664 bytes), written by hand into the receipt and proved by md5 before the delete; `apply_migration` ran the guarded delete on the first try (#2028). It had no filed record and no display row since #2024, so no rebuild followed. A row whose file the re-read removed lives on only in the table: compare live rows with filed records after every re-read, not only before a build.
- **Chaffey, end to end in under 30 minutes** once the read filed (#2027): 193 of 199 found, 181 pass, $10.48; load run 38250333920 inserted 191 and left out two that place none of their courses (04779, 18435); display build `496f2a71470a` applied by run 38251047970, read back as 1,745 of 1,745 rows on the build. The load, display and merge steps need no reader change when the dated reads already carry the college (S369's 99841af).
- **San Diego City's capture found 168 of 191** (88%) with `_getCatalogs` naming catalog 69: 154 at full coverage, 19 with no page (German, the two RN programs, Real Estate, Business Information Worker, the Green Building and Energy Analysis pairs, C++, two General Atomics apprenticeships, Cyber Defense), and four pages each shared by two or three awards of one program. Above the 85% bar, so extraction ran under Sam's 02:50Z go (run 38252422845).
- **A display apply makes the live smoke time out.** The cpl-chat smoke that ran while run 38251047970 wrote 1,745 display rows failed 7l four times on statement timeouts (57014) in `college_program_courses`; the next smoke, with no write beside it, passed 7l. Same family as S276's loader window: read a smoke against what the database was doing.
- **Merge the tracker PR before the vault PR that depends on its lane markers.** Vault #317 (both Sheet 68 cards out of the builder) ran its coverage check against tracker main while #2028 (the lane's marker dropped) was still open, and failed; after #2028 merged, the vault's main run passed. I merged #317 without reading its checks first. The order is tracker merge, then vault push.
- **An insert into `cpl_memory` that times out four times lands when it is short.** The receipt's long form (title, summary, detail) timed out through `execute_sql` and `apply_migration` alike, with nothing in `pg_stat_activity`; a shorter title and summary with no detail landed at once. Two statements, then the log row (`action` takes `create`, not `insert`).

## S371 SkyMaple, 2026-10-12: San Diego City displayed, and the SDCCD host holds two more Leading colleges

**San Diego City is live (#2034).** Display run 38266706124 applied build `0f4e4158a2df`; S371 read back all 1,909 rows on
that build, San Diego City's 164 among them, each placing at least one course (2,515 courses). The page file carries only
the pilot's records (22), by design: CPL Pathways reads the table.

**A registry row can hide a readable college.** The lane said San Diego City and Chaffey were the last Leading colleges on a
platform the read handles. The registry says San Diego Miramar is on `sdccd.curriqunet.com`, and S369's own read of the
host's `_getCatalogs` lists Mesa as catalog 70 while Mesa's row reads `custom_html` (the census filed its page about the
catalog). Measure the remaining colleges from the registry and the host's own list before declaring a platform exhausted.
Sam gave the go for both (*"go ahead with Miramar and Mesa extraction"*); Mesa waits on its registry correction (#2037),
which the `execute_sql` guard holds for Sam.

**A capture-only pass is a check, not a step, once the reader is proven on the host.** S371 canceled Miramar's
capture-only run for a read with extraction: the reader had just read San Diego City on the same host and page shape.

## Moved from the lane (S372)

The outcomes paragraph's run detail, verbatim:

**Outcomes (Sam, 2026-10-04 18:03Z):** grab published course and program outcomes, and compare harvested credential skills with course outcomes. ✅ **Record shape 3 is built (S334, sheet 33 card 4 as proposed):** the extraction function (version 4) keeps each outcome exactly as printed in `program.outcomes` and `course_outcomes`; the scorer's `outcomes` check fails a reworded or empty one. Run 37345734457 (20 of 20 passed, $1.31) and, for Mt. San Antonio, 37350789203 after the capture learned to open a hidden Outcomes tab (#1871): **19 of 20 carry outcomes**, 1 to 11 each. Miramar prints *Learning Outcome(s):*, which S327's count missed; Mt. San Antonio's ECE transfer degree links to an outcomes page instead. `kb/_program_requirements_file.py` files a run: a record a person read keeps its requirements and takes only the outcomes (six of the 20 came back with relabeled blocks), and `reviewed_readings.json` holds each verdict to the requirements it read. The skills comparison waits for the skills file (`kb/reference/industry_credential_skills.json`, not started).

The pilot paragraph, verbatim:

**The pilot (Phase 1): all 20 records pass all four checks.** Five colleges by four shapes (`kb/program_requirements_pilot_sample.json`): an ADT, an A.S./A.A. with a choose block, a certificate with an electives block, a noncredit certificate; each college's use case fills one slot (Cerritos Ironworker A.S. 42158, Mt. San Antonio LVN-to-RN A.S. 08086, Riverside City Culinary Arts 22804, West LA Real Estate Salesperson 37839, Miramar Fire Technology A.S. 05100). **Capture** (`kb/_program_requirements_pilot.py`): accepts a page naming half the courses the Program Course File lists; curriQunet program views fall back to their own PDF export; sources filed under `kb/program_requirements_pilot/sources/`. **Extraction** (the `program-requirements-extract` Edge Function, version 2, structured output, record shape version 2); records under `.../records/`, about $0.05 a program. **Scorer** (`kb/_program_requirements_score.py`): coverage, no unflagged invented course, unit arithmetic (`equal`, `unequal`, `incomplete`, `unstated`). **Sam's reading (10:22Z):** 18 match; both fixes went into the procedure and rerun 37195340082 passed them. Guard `tests/program_requirements_pilot_test.py`. Run-level history: the lessons doc, S323-S324.

## S372 SkyRedwood (2026-10-12): Miramar displayed, Mesa's row applied, the course outline census

- **Miramar** read 38275241459: 146 programs, 124 with a closed list, 110 found and extracted, 105 pass, $9.00 (curriQunet catalog 71 on the SDCCD host, capture 74 minutes). Load 38285338937 inserted 106 and kept the 4 checked pilot records. Display build `427f93eaf03d` read back on all 2,015 rows (31 checked). Not found: 16779, 30512, 30532, 36254.
- **A display job applies in batches.** A read-back 7 minutes in showed 1,911 rows on the new build and 104 Miramar rows with none; the job was still running. Read the build back after the job's own applied-record commit lands.
- **Mesa's registry row** applied 17:06Z as migration `program_source_registry_mesa_catalog_s371` (Sam, Sheet 69 item 1). S371's two attempts had timed out in the tool call; S372 found no lock on the table, read the row back unchanged, and the third apply took. A timeout in the tool call is not proof of a lock: read `pg_locks` before waiting on another job.
- **The course outline census sample** (run 38289193564, 12 colleges, 30 loads) found the catalog hosts it already knew (curriQunet and eLumen catalogs) and one outline system, Cabrillo's Coursedog, behind a sign-in. Six colleges found nothing: homepages seldom link the curriculum committee. The pass now reads each college's sitemap for curriculum pages. A catalog host is not proof of a public outline: a course's outline and its SLOs need a per-platform reader next.
- **A merge of main carries every path-filtered trigger file that changed on main.** Merging main into `claude/s371-miramar-read` re-ran the gallery thumbnail job there (its `.thumbs-run` arrived in the merge's diff). The course outline census workflow skips merge commits for that reason.

## S373 SkyCypress (2026-10-12): Mesa displayed, the course outline fields, and what the outlines show

- **Mesa:** read 38282023973 found 168 of 184 with a list, 162 pass, $14.82; load 38300979155 inserted 166 (18270 and 31695 place none); display build `da4f44a160ca` on all 2,181 rows (#2044). Its nine health programs are missing from the one section the reader walked; find where the catalog lists them before a re-read. Mesa was the first non-pilot college added to the builder's dated reads since S369; the merge of main re-ran the gallery thumbnail job on the branch again (restore main's `tools/first_light_gallery/index.json`).
- **The course outline census, moved from the lane:** **The census** (`kb/_course_outline_census.py`, `course-outline-census.yml`, #2042; pages only, no table write) opens one course's outline on every system host and records `cor_outline` (outline_with_slos, slos, outline, list_only, sign_in, refused, unreached). Run 2 (all 118) met 59 hosts (curriQunet 33, eLumen 20, CourseLeaf CIM 3, CurricUNET 2, Coursedog 1), mostly catalogs. Probe runs 38302465625 and 38303973743: **curriQunet dashboards list public outline reports** (RCCD `Report/Course/GetReport/<id>?reportId=97`; SDCCD, Chaffey, Cuesta `DynamicReports/AllFieldsReportByEntity/<id>?entityType=Course`); RCCD's, SDCCD's and Cuesta's print SLOs, Chaffey's print none; Los Medanos's eLumen catalog course pages print each course's SLOs. RCCD, SDCCD and Chaffey hold seven of the ten loaded colleges. A curriQunet dashboard carries a sign-in form beside the public list, so run 2 read it as sign-in; the census no longer does. Run 5 (all 118, an outline read per host) runs on #2042.
- **A catalog host is no proof of an outline, and a sign-in form is no proof of a closed system.** Run 2 recorded the catalog for most colleges and flagged SLOs on menu items ("Cal Poly SLO" at Cuesta). The probe went one link further and found curriQunet's public outline reports behind the dashboard run 2 had called sign-in. An SLO heading counts only when it starts its own line and has text under it, and the probe reads the whole page (the Reader keeps 6,000 characters).
- **The loaded list, moved from the lane (S373 compaction):** **Loaded:** Cerritos 305, Mt. San Antonio 382, Riverside City 244, Moreno Valley 139, Norco 147, Long Beach City 344 (S364, re-read S368; Advanced Arc Welding 38542 removed on Sam's Open Asks Sheet 68 card 2, *Remove it*, receipt `kb/receipts/program_requirement_records_lbcc_38542_removed_2026-10-12_s370.*`), Chaffey 191 (S370, #2027: 193 of 199 found, six with no page), San Diego City 164 (S370-S371: read 38252422845 found 168 of 191 with a list, $12.67; load 38265697602; 22333, 22352, 22367 and 38732 place none and stay out), San Diego Miramar 110 (S372: read 38275241459 found 110 of 124 with a list, 105 pass, $9.00; load 38285338937 inserted 106 and kept the 4 checked pilot records; not found 16779, 30512, 30532, 36254), San Diego Mesa 166 (S373: read 38282023973 found 168 of 184 with a list, 162 pass, $14.82; load 38300979155 inserted 166; 18270 and 31695 place none and stay out; its nine health programs were not found: 05301, 05344, 05347, 05348, 05349, 22313, 22314, 38642, 38643).
- **Miramar and Mesa, moved from the lane (S373 compaction):** San Diego Miramar and San Diego Mesa (Sam, 2026-10-12: *"go ahead with Miramar and Mesa extraction"*). Both are Leading and on the SDCCD curriQunet host, whose `_getCatalogs` names City 69, Mesa 70, Miramar 71. Both are read, loaded and displayed: Miramar S372, Mesa S373 (its registry row on Sam's Open Asks Sheet 69 item 1, *Apply as a migration*, #2037). Mesa's nine missing programs are all health sciences, and none is among the 199 entries of the one section the reader walked (*Degree Curricula and Certificate Programs*): find where the catalog lists them and file it in Mesa's procedure record before a re-read.
- **Census run 5 (38305389870, all 118, 629 loads), an outline read per host:** outline_with_slos 18 (curriQunet 14: Allan Hancock, Crafton Hills, Cuesta, Feather River, Las Positas, Moreno Valley, Norco, Palomar, Riverside City, the four SDCCD colleges; eLumen 3: Redwoods, Los Medanos, Palo Verde; CurricUNET 1: Chabot); outline with no SLO heading 14 (curriQunet 12, among them Chaffey; eLumen 2: Bakersfield, Columbia); list_only 17 (eLumen 14, curriQunet 2, Hartnell's Coursedog); sign_in 6 (curriQunet: Berkeley City, Butte, Gavilan, Reedley; CourseLeaf CIM: Citrus, Pasadena City); refused 3 (Copper Mountain, Napa Valley, Ohlone); unreached 1 (San Jose City); no system 59.
- **The registry fill (#2047):** `kb/_course_outline_registry_fill.py` writes one UPDATE over a VALUES row a college, guarded on `cor_checked_run is null`, with the note, the SLO flag and the SLO source derived in SQL from the same templates as `fields()`. The repo's Supabase guard refuses an UPDATE through `execute_sql`; the receipt went in through `apply_migration` (the path Sam named on card 1), and an md5 over the eight stored fields equaled the script's. A 33 KB receipt is too large to paste reliably: derive repeated text in SQL and keep each row to its facts. SQLite can test the receipt once the alias and the VALUES column list are rewritten for it (the guard test does this).
- **The RCCD course index (#2046):** discovery run 38312406074 found the dashboard is a public search backed by JSON (`POST /Search/NewSearch`, 25 rows a page, every proposal in every status; a Cloudflare check on the page). The index replays the page's own request from inside the page, 200 rows a page: run 38313849383 read 14,292 rows in 72 pages, kept 2,160 active outlines (no historical proposal, no distance education addendum), and found an outline for 1,605 of the 1,648 courses the three colleges' records name. The 43 without one are mostly codes the district retired (HIS, ECO). A course code needs one spelling before any match: "ADJ B1B" read twice as "ADJ B 1B" until the two-word subject group went, and the guard test caught it.


## S374 SkyJuniper (2026-10-12): the SLO read at RCCD, and why Mesa lost nine programs

- **An outline prints objectives and SLOs under one lead-in.** RCCD's integrated outline (report 97) prints *Course Objectives: Upon successful completion of the course, students should be able to demonstrate the following activities:* and then *Student Learning Outcomes: Upon successful completion of the course, students should be able to demonstrate the following skills:*. The census's line-start rule (`SLO_HEADING`) accepts the lead-in as a heading, so the first text parser read the objectives on all twelve pages of trial 38317539422. `kb/_course_outcomes_read.py` now reads the HTML: the area whose `subTitle` reads Student (or Course) Learning Outcomes, each top-level `<li>` as printed. The text parser stays as the fallback for a host with no such area and takes the SLO heading proper before the lead-in. Test against filed pages, not a fixture you wrote: the trial filed each page's text and HTML (`kb/course_outcomes/trial_38317539422/`), `--reparse` reads them again, and the guard test runs on them.
- **RCCD nests institutional outcomes under an SLO** (*Critical Thinking*, *Communication Skills*, *Information Competency & Technology Literacy*) as a list inside the `<li>`. They are kept as `maps_to`, one list per SLO; the text reader cannot tell them from an SLO.
- **The outline names who offers the course:** *College:* then RIV, MOV, NOR one to a line. The load keeps a row for each college the outline names, and falls back to the colleges whose records name the course.
- **Slice 1 of run 38318152644:** 402 outlines, all 200, all parsed from the HTML, 1,367 SLOs (one to ten a course, median three; 28 courses print one). The longest are the ethnic studies outcomes (ETS 1, ETS 2); the shortest are CAT 844's *Build tables.* and *Create forms.*
- **A merge of main makes a runner's pull slow.** The read workflow's commit step ran `git pull --rebase` on a one-commit checkout; after the branch took a merge of main, the pull fetched main's history and the step ran five minutes. The step now fetches the tip one commit deep, lays the slice's new files on it and pushes, and an artifact keeps the slice if every push fails. The dependency map reads a workflow's push target: write it unquoted (`HEAD:${{ github.ref_name }}`) or the map loses the edge and CI calls it stale.
- **A new table carries its own grants.** `supabase_table_grants_test` failed `course_outcomes` until its SQL granted select to `service_role` (new public tables lose the default grants on 2026-10-30).
- **`apply_migration` timed out six times** (22:45Z to 23:17Z) with nothing reaching the database: no table, no ledger row, no lock, no open transaction, the project healthy, `execute_sql` answering. The DDL waits in `chatbox/supabase_course_outcomes.sql`; the guard refuses DDL through `execute_sql`, so there is no second path from a session.
- **Mesa's nine (#2050).** Seven page reads (`kb/college_reads/mesa_health_programs.json`, runs 38318250175 to 38321027873) walked catalog 70 from the top: 21 sections, programs only under 17540, one tab (All Programs, 18644), one link list (17541) of 200 entries, and all nine in it (17589, 17590, 17626, 17687, 17688, 17700, 17708, 17709, 17727). Each special-admission entry shows six tabs (Summary, Accreditation, Directed Clinical Practice Requirement, Admission Criteria, Requirements, Courses); `cq_children` read the first four visible ones, so the Requirements tab, fifth, was never read and each program scored 0.0. A tab titled Requirements is now read first. The S373 guess (another catalog section) was wrong: walk the tree before assuming where a thing is listed, and read the coverage number a record was filed with (0.0 says no page named a course, which points at the page, not the index).
- **Moved from the lane (S374 compaction):** **Reading** (#1946-#1952): Program records finds a record and Side by side opens it beside its catalog page (`kb/catalog_framing.json`). Sam confirmed the Cerritos sample, 12 of 12. ④ CPL Pathways' UI pass done (#2016). Sheets 38, 39 and 42's rulings (writes, the OSHA issuer name, the outcomes on the 20 live rows) are under *Moved from the lane (S336 compaction)*. The Progress view: every section of the tab collapses (Expand all, Collapse all).

## Moved from the lane (S376 compaction)

The outcomes paragraph's settled parts, verbatim:

✅ **Record shape 3 (S334):** extraction v4 keeps each outcome exactly as printed in `program.outcomes` and `course_outcomes`; the scorer fails a reworded or empty one; 19 of the 20 pilot records carry them. `kb/_program_requirements_file.py` keeps a read record's requirements and takes only outcomes; `reviewed_readings.json` holds each verdict to the requirements it read.

**Sam's Open Asks Sheet 70 (20:40-20:42Z, `sam-sheet-70-rulings-2026-10-12`):** card 1 *Apply as a migration*; card 2 *Record and move on*, note *"And look for other repositories for the outcomes data and record the link and data in prog reqs"*; card 3 *Every course in the loaded records*.

✅ **The registry fields (S373):** migration `program_source_registry_course_outline_2026_10_12` added the eight `cor_*` columns (`cor_slo_source_url` is Sam's other repositories); the weekly census never writes them. Filled on all 118 rows from census run 5 (#2047): public 49, sign_in 6, refused 3, unreached 1, not_found 59; 18 print SLOs.

**The census** (#2042) opens one outline per host; curriQunet dashboards list public outline reports. ✅ **The course index (#2046):** RCCD's dashboard is a public JSON search; 1,605 of the 1,648 courses the RCCD records name have an outline.

## S376 SkyLinden (2026-10-13): three re-reads, SDCCD's SLOs by college, and a trigger file a merge carries

- **The Requirements-tab fix (#2050) paid at all three SDCCD colleges.** Mesa found its nine health programs
  (`not_found` empty), San Diego City three of its 19 (the two nursing degrees, Cyber Defense B.S.), Miramar
  ten aviation programs (Airframe, Powerplant, Pilot Studies and the rest; only 16779 had been counted as not
  found, the other nine were page-claimed). Each loaded unchecked and displayed: build `98becf9fafc7` on
  2,203 rows.
- **A re-read can move a good record to a wrong page.** Miramar 39433 (300-Hour Registered Yoga Teacher) went
  from page 20882 (14 of 14 placed) to 20070 (none). `git diff --name-status` between the base and the
  filing showed one `M` among ten `A`s; the filed record went back before the load and the build. Read the
  diff of every re-read's records, not only its summary.
- **The report titled for the outline is not always the one that prints SLOs.** SDCCD's Course Outline
  Report (493) prints Student Learning Objectives only; its All Fields report (4) prints a Student Learning
  Outcomes section with one entry per college (Group Title City, Mesa, Miramar), each with its own Outcome
  Text list. A college may reuse an objective's words as an SLO (Miramar's HUMA 101), so where a sentence
  prints decides, not its wording. The index reads the report a `.run` names; the reader keeps one block per
  group; the load writes one row per group for the college its title names.
- **A comparison report is titled for the outline too.** SDCCD's Course Outline Comparison Report (43) sat
  ahead of 493 on 1,978 revision rows; the dashboard's own links named only 493. The index lists every
  report by id and title, so the next host's choice is visible in its run.
- **Learn the link form from the host's own page.** SDCCD links reports as
  `DynamicReports/AllFieldsReportByEntity/<CourseId>`, RCCD as `Report/Course/GetReport/<CourseId>`.
- **A merge of main carries trigger files.** Merging main into the San Diego City branch carried #2065's
  index `.run`; the display push after it re-ran the SDCCD index there. The merge-commit check only covers a
  merge at the head. The census, index, outcomes read and load now run only when the pushed trigger file
  differs from main's (#2069, #2066). KB note `methodology-a-trigger-file-must-differ-from-main`.
- **Chaffey's course outcomes are on section syllabi** (its outcomes site); program outcomes are in the
  catalog and CurriQunet. No public course SLO list turned up from a web search.
- **`apply_migration` timed out a seventh time** (04:31Z) with nothing landing; Sam chose to paste the table.

## Moved from the lane (S380 compaction)

The outcomes paragraph's settled parts:

- **RCCD (#2049, S374):** the reader takes the outline's *Student Learning Outcomes* area from the HTML, never the
  Course Objectives RCCD prints first under the same lead-in (trial 38317539422); a nested institutional outcome
  (*Critical Thinking*) is `maps_to`; the *College:* line names RIV, MOV, NOR. Run 38318152644 read all 1,605 in four
  slices: every page 200, all parsed from the HTML. Load run 38392934576 inserted 2,665 rows (one per college the
  outline names), none kept or skipped.
- **SDCCD (#2065, #2066, S376):** the index learns each host's link form from its own dashboard and reads the report
  its `.run` names. SDCCD's *Course Outline Report* (493) prints Student Learning *Objectives* only (trial
  38350133448); its *All Fields* report (4) prints each college's SLOs under its own *Group Title* (trial
  38350787486), so the index reads All Fields: 1,641 of the 1,660 courses City, Mesa and Miramar's records name. A
  comparison report is never read. Read 38351637385 (four slices, checked S380): every page 200, all parsed from the
  HTML, 1,506 courses with outcomes, groups City, Mesa, Miramar only. Load run 38397577646 wrote one row per group:
  2,229 inserted, 135 courses skipped (none printed). The read filed 2,230 groups: one course printed the same
  college's block twice, and the load's key (college, course, report, fingerprint) kept it once.
- **Chaffey (#2073, S380):** its outcomes FAQ (chaffey.edu/outcomes/faq.php) says current course learning outcomes
  are kept in META CurriQunet and printed on each course's syllabus. Its dashboard links two public reports per
  course, *Course Outline* (225) and *Course Outline - PDF* (1225), and no All Fields report (discovery
  38392162605); the PDF prints Course Objectives and no outcomes (read 38394075773). The registry note
  (`kb/receipts/program_source_registry_chaffey_cor_note_2026-10-13_s380.sql`) keeps `cor_slo_source_url` null.
- **The table:** `apply_migration` timed out eight times on `chatbox/supabase_course_outcomes.sql` (S374 to S380)
  with nothing landing; Sam pasted it (Open Asks Sheet 72 card 1). A paste card is the route while the connector is
  down.

## S380 SkyAlder (2026-10-13): course outcomes loaded at six colleges, the eLumen read, and two CourseLeaf misses

- **The table landed by paste.** `apply_migration` timed out an eighth and a ninth time with nothing landing (no
  migration since 23:19Z on 2026-10-12); Sam pasted `chatbox/supabase_course_outcomes.sql`. RCCD loaded (#2049,
  2,665 rows) and SDCCD by college group (#2066, 2,229 rows): 4,894 rows, 16,626 SLOs. Sam asked how to stop
  pasting; the runner-applied migration path (an access token secret, optional approval tap) waits on his answer.
- **Merging main brought a guard the branch predated.** #2049's two outcomes workflows failed #2069's trigger-file
  check after the merge; the gate was ported from #2066. A stacked PR's newer files win an add/add conflict once the
  base's own commits never touched them (check `git log <fork>..<base> -- <files>` first).
- **Chaffey's course outcomes are not public** (#2073): two dashboard reports (225, 1225), both objectives only; the
  FAQ keeps CLOs in META CurriQunet and on syllabi. The registry note waits as a paste.
- **eLumen is a single-page app read through its own calls.** Every view loads one ~4.5 MB publish call (styles, the
  whole side menu, the page) and then settles; the rendered capture ran past 2.5 hours and was canceled. The menu's
  own links load a page through `publish/content/<catalog>,<path>?tenant=<host>`, ~2 KB of HTML with the program's
  heading, learning outcomes and requirements (reads 38392014238, 38413232841, 38413852584). Bakersfield prints
  `AGRIB5`; `code_pattern` already matches the state's `AGRI B5`. Course pages print SLOs where the college shows
  them (Palo Verde yes, Bakersfield no).
- **Coastline found 29 of 159 programs, for two reasons that apply to every CourseLeaf college.** Its program pages
  are addressed `.../business-as/index.html`, and `NOT_PROGRAM_PATH` dropped every `/index.html`, so only subject
  pages were read (their Courses tab lists the subject's courses); and the link-search fallback accepted course
  listings (`course-descriptions/credit-courses/re/`) at coverage 1.0. `dir_form()` and `link_page_ok()` fix both
  (#2074). Earlier CourseLeaf colleges (Cerritos, Mt. San Antonio, Long Beach City) passed through the same link
  search: their link-search records are worth one check for a course-listing source.
- **Next college by tier:** no Leading college is left on a platform the reader handles except eLumen; among
  Advancing CourseLeaf/curriQunet colleges Coastline (984 CPL students) leads, then Southwestern, Fresno City, Cypress.

## S381 SkyRowan (2026-10-13): Bakersfield end to end, Coastline's second miss, Cabrillo's department menu, and the Progress cards

- **Bakersfield, the first eLumen college, read to display in one session.** Read 38414480070 (S380): 231 of 241
  with a list, 207 pass, $13.38. Load 38428412859 inserted 229 (09237 Animal Science A.S. and 09968 Human Services
  A.A. place none of their courses). The builder's two dated reads gained Bakersfield and Coastline (Coastline ahead
  of its load, so two branches would not both edit them); the per-college md5 over code|recs|exhibits|untitled
  matched in SQL and over the filed rows. Display 38430743762 applied build `2121fcc84f86` to all 2,432 rows. Its
  24 arithmetic failures are mostly transfer degrees whose blocks sum above the stated total (Psychology 30593,
  Theatre Arts 32769): the mark of a choose-from-a-list block read as required. Filed on its procedure record v3.
- **A fix that clears the visible failure is not the fix (Coastline).** S380's `dir_form()` left 24 of 159.
  Every Coastline page's h1 is the banner "ACADEMIC CATALOGS", so the hidden-text heading rule refused every
  program page whose requirements sit in a hidden tab; `drop_banner_h1()` reads the title instead (an h1 on half
  the pages read, at least ten). That and `child_pages()` raised it to 32. Read 38437346167 then showed the sitemap
  does list the program pages: the main pass reads them and still refuses most, while the link search takes the same
  page at coverage 1.0. **The capture filed nothing about a refused page**, so each guess cost a 27-minute run;
  `near_miss()` now files, for every not-found program, the page that names it best and the gate that refused it.
  Read a capture's near misses before writing the next fix.
- **A page read is the cheapest test of a theory.** Two loads, no model call, about two minutes on a runner: Cabrillo
  (menu, then one department) and Coastline (the sitemap searched for known program addresses) each answered in one
  read what a capture could not.
- **eLumen menus differ.** Bakersfield's menu links programs (`<catalog>/program/<slug>`); Cabrillo's links
  departments (`2026-2027/department/<slug>`), and each department's content call links its programs at the same
  `program/<slug>` path. `el_department_slugs()` reads them when the menu names no program (#2078). Report keys
  are overwritten by the rendered fallback when the fast read finds nothing: read the job log, not only the report.
- **No course-listing record is live** at the earlier CourseLeaf colleges: Mt. San Antonio's six from
  `adult-continuing-coursesaz/` were removed by S362 on Sheet 62 (handoff 381 priority 4, answered).
- **A stash check can unstage a commit's code.** `git stash` then `git stash pop` without `--index` left the reader
  unstaged, and the commit carried only the dependency map; the run dispatched on it was canceled and the code
  pushed in a second commit. Pop with `--index`, and read `git show --stat HEAD` before dispatching a run on it.
- **The Progress view's counts open their lists** (Sam, 2026-10-13, on his phone; #2077). A call with no answer link
  named a question with nowhere to tap: `scripts/queue_status.py` now refuses one.

## S382 SkyLarch (2026-10-13): Coastline's hidden tab, Cabrillo's totals, and the next eLumen menus

- **A pre-filter must read the text its exact test reads.** Coastline's capture-only run 38438077425 filed a near miss for
  each of 106 not-found programs: 98 were refused by the coarse net, most on their own page. The net read innerText and
  textContent; the program's courses sit in a hidden Requirements tab, and textContent runs each code into the cell before
  it ("Units3BCI C100Introduction"), so no code token had a word boundary. The exact test reads the hidden tab cell by cell
  (`hidden_tabs_text`), which is why the link search, with no net, took Information Technology A.S. at coverage 1.0.
  `page_net()` gives the net the same tab text (f3d8969).
- **A filter that drops "panels naming no course" must know the college's course numbers.** `SUBJECT_TOKEN` wanted digits
  right after the subject, so the Coast district's C-numbered courses (BCI C100) read as no course and the Requirements
  panel was dropped. `C?` added. The next read found 154 of 159 (was 32), 124 pass, $8.52.
- **A page read prints the rendered page, not the capture's view.** Read 38443044852 showed the Overview alone and its
  link list folded the tab link (a fragment) into the page's own address. The near miss now files the capture's own view
  (script error, text sizes, tab panels), so the next miss answers itself.
- **An arithmetic failure can be the catalog's layout.** Cabrillo: 88 of 271 fail arithmetic, 58 with no stated total.
  General Business prints a 60-credit degree total with general education, a 25-credit core and electives of 9-10 (read
  38449079970), and no major total; the record leaves the total blank under the prompt's own rule (never compute one).
  Loaded as read (268; 3 place none).
- **eLumen menus take a third and fourth shape.** Modesto's menu links a Programs A-Z hub; Palo Verde's links award
  categories (adt, associate-of-arts-degrees, certificate-of-achievements); both hubs link `<catalog>/program/<slug>`.
  Santiago Canyon's listing names departments and awards in text with no links (reads 38445240921, 38446053107,
  38447593113). Excerpt keywords that match menu years spend all 24 excerpts; ask for links with `links`.
- **Coastline:** load 38449045399 inserted 140 (14 place none: wrong pages); build `14e436537733`, display run
  38449957832; procedure record v1 (md5 804419067ba6). **Cabrillo:** load 38450067209 inserted 268; display not built.

## S383 SkySpruce (2026-10-13): Cabrillo displayed, the eLumen hubs, and the whole-harvest measure

- **A display build waits for the college before it in the queue.** The builder rewrites every row, so Cabrillo's
  build had to follow Coastline's merge: built on #2074's records, `dc7d157aff73` covers all 2,840 rows (run
  38456098516; procedure v1, md5 442d35fb). Merging main into the Cabrillo branch kept both sides' new test blocks.
- **Hand-filed dated reads are proved twice:** the md5 over `code|recs|exhibits|untitled` (C order) and over each
  code's titles in the read's own order. A re-sort by the shell's collation gave a false mismatch; the read's order
  matched (51b48854..., d71fa73b..., 112 codes).
- **eLumen's fourth menu shape is hubs.** Modesto links Programs A-Z and by Type, Palo Verde its award categories;
  `el_hub_slugs()` reads single-segment pages whose slug names a program list (#2085, 146 checks). Capture-only reads
  of both were dispatched on its branch.
- **The whole harvest, measured (Sam, 2026-10-13; #2084).** Five parts count equally: links 98%, ROEP data 14%
  (2,568 active programs with figures plus 308 filed gaps), COCI comparison 13%, SLOs and PLOs 9% (course SLOs 4,123
  of 89,192 courses on active programs), careers 7% (1,518; records read before the careers field lack it, so
  re-extraction is the lever). About 28%. Records include Approved programs, so the query counts only records that
  are an Active program's. Anon reads checked records only; the checkpoint stamps the block.
- **A `| tail` hides a check's exit code.** `check_generated.sh ... | tail -1 && git commit` committed a stale
  dependency map; read the last line, then commit.

## S384 SkyPoplar (2026-10-13): the 1,000-row cap, the 34 MB read, and loading by college

- **A one-shot PostgREST read stops at 1,000 rows, silently.** The Records view and CPL Pathways' index read
  `program_requirement_records` in one request; with 2,840 rows the response carried `Content-Range: 0-999/*`, so the
  colleges after record 1,000 (ordered by college, control number) never reached either page. Paginate any read that
  can pass 1,000 rows (`docs/kb-notes/methodology-paginate-postgrest-reads.md`, updated this run).
- **The 500 Sam saw was the anon role's 3 s statement_timeout** (`pg_roles.rolconfig`: anon 3 s, authenticated 8 s).
  `postgres_logs` named it: "canceling statement due to statement timeout". The cost was the body, not the query:
  1,000 records are 11.3 MB of JSON (125 ms of DB time as anon, warm), all 2,840 are 34 MB, and a signed-in page read
  everything twice (public read plus reviewer read). Six 3 MB statements at once still timed out after paging.
- **Fix in three steps:** #2088 pages (250 a page, `Prefer: count=exact` on the first, the rest in parallel; a failed
  page fails the read, naming the table); #2089 one read when signed in (the reviewer read is a superset) and one
  retry of a 5xx page; #2090 a light index for every college (about 0.6 MB) and full records by college pick or by
  key (Sam: *"we don't have to load all the colleges and programs at once if we add a multi-select college/district
  drop down filter"*, provided the attention links work without it; his default: open empty, remember the pick).
  Edge logs show each request's `response.headers.content_range`, `response.origin_time` and role: read them after a
  deploy that changes a read.
- **A test that writes into the tree races the suite.** `college_identity_lint_guard.test.js` rebuilt the crosswalk
  into `kb/college_identity/<today>/`, the newest dated directory, which `funding/_build_funding_performance.py`
  reads; `cpl_funding_applied.test.js` read it half-written (JSONDecodeError at char 0) on #2084 twice and #2081 once.
  #2087 sends the rebuild to a temp dir and checks no dated directory appears.
- **Modesto and Palo Verde (capture-only, #2085):** Modesto 189 of 199 found, 163 full coverage; Palo Verde 54 of
  69, 32 full, five noncredit programs at 0 coverage. Extraction waits on Sam (Sheet 77 card 5).
- **The catalog and state file boxes, re-measured for Sheet 77 card 3:** 3,341 boxes on 942 of 2,840 records
  (median 2 a record, 194 records with five or more, one with 97). 1,808 name a course the state file lists and the
  catalog does not print (168 of them a local number beside the course's common course number, e.g. Bakersfield's
  HISTB17A beside HIST C1001); 972 a printed course the file carries under another status; 561 printed courses the
  file does not list. Procedure flags: 214 check not met, 148 no printed total, 76 possible misread.

### Moved from the lane (S384 compaction, verbatim)

✅ **Coastline (#2074, merged S383):** its courses sit in a hidden Requirements tab, numbered with a C; `page_net()`
reads the tab and `SUBJECT_TOKEN` takes the C (154 of 159, 124 pass, $8.52); 140 loaded; procedure v1. ✅ **Cabrillo
(#2078, merged S383):** its menu lists departments, `el_department_slugs()` follows them (271 of 281, 183 pass,
$18.17); 268 loaded; procedure v1 (md5 442d35fb). 88 fail arithmetic, 58 with no stated major total: the page prints
a degree total, a core and electives (lessons S382).

## S385 SkyHazel (2026-10-13): Modesto and Palo Verde end to end, the college's items on one line, and the migrate runner's first two applies

- **Modesto Junior and Palo Verde, read to display.** Extraction (Sam, Sheet 77 card 5): Modesto 189 of 199 found, 159
  pass, $12.03 (run 38477845911); Palo Verde 54 of 69, 29 pass, $4.40 (38477849603), 25 of its 54 failing arithmetic.
  Dated reads gained both (162 and 58 course codes; md5 over code|recs|exhibits|untitled and over titles equal in SQL
  and over the filed rows). Loads 38482987850 (185; 4 place none) and 38482990981 (52; 2 place none). Build
  `2d812b8ce768` on all 3,077 rows, display run 38486049156.
- **A display dispatch applies the build the page file carries, not a new one.** The first dispatch (38484189531)
  re-applied `dc7d157aff73` to the 2,840 older rows and left the 237 new ones empty: no session had run the builder.
  Run `kb/_build_roep_display.py`, commit `cpl_pathways_roep_data.js` and its receipt, then dispatch `step=display`.
  A re-apply of the same build is harmless (its applied record files the same build as "before").
- **A dated-read diff can look like a rewrite.** Inserting a college before others made git's default diff show
  2,981 deletions; `--diff-algorithm=histogram` showed 3,653 additions and the two header lines. Read the diff that
  way before believing an existing row changed.
- **The college's items left the numbered boxes (Sheet 77 card 3, #2093).** 3,353 items on 947 records at 16
  colleges (3,341 *Catalog and state file differ*, 12 *MAP names a second course*) against 438 procedure boxes. The
  view `program_record_college_items` (one row an item, `security_invoker`) counts them in about 70 ms; the MAP team
  queue reads it in pages and opens each college's list on demand.
- **The migrate runner works without a wait** (`supabase-migrate.yml`, #2076): its first two applies (the
  lifecycle policies, #2092; the view, #2093) ran in under a minute each, wrote the ledger row and committed a
  receipt. The receipt commit is the bot's, so CI does not run on it: push a commit of your own on top before
  waiting on `test`.
- **#2090's first live reads were clean:** the light index paged `0-249/2840` then 250-row pages, 106-403 ms each,
  no 400. The first college pick (`college=in.(...)`) waits on a visitor.

### Moved from the lane (S385 compaction, verbatim)

✅ **eLumen (#2072, merged S381):** `el_pages_fast()`: one publish call for the menu, one `publish/content` call a program. Bakersfield loaded 229 (S381; lessons S381). ✅ **Coastline (#2074) and Cabrillo (#2078), merged S383:** 140 and 268 loaded, procedures v1; how each reader was fixed, and Cabrillo's 88 arithmetic failures: lessons S382-S383. ✅ **eLumen hubs (#2085, merged S384):** a menu naming neither programs nor departments links hubs (Modesto `programs`/`bytype`/`adt`; Palo Verde's award categories); `el_hub_slugs()` reads them. Capture-only reads (S384): Modesto 189 of 199 found (163 full coverage; misses Animal Science, Small Animal Vet Tech, three GE patterns), run 38461105673; Palo Verde 54 of 69 (32 full; misses five noncredit programs at 0 coverage, Vocational Nursing, Cal-GETC, Umoja, Cross-Cultural), run 38461110935. ✅ **Sam's go, both (Sheet 77 card 5, 22:26Z):** extraction reads dispatched on `claude/s384-modesto-palo-verde`.

The one-shot record read stopped at PostgREST's 1,000-row cap (Content-Range 0-999/*) and, as anon (statement_timeout 3 s), answered 500; all 2,840 records are 34 MB (`records-view-1000-row-cap-and-anon-timeout-2026-10-13`). #2088 pages every read (CPL Pathways' index too); #2089 reads once when signed in and retries a 5xx page.
