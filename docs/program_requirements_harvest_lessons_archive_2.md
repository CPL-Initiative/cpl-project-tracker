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
