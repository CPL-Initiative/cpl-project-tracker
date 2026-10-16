---
title: Program requirements harvest — Decisions & Lessons
date: 2026-10-03
prs: [2101, 2102, 2103, 2104, 2105, 2049, 2050, 2012, 2015, 2016, 1836, 1838, 1839, 1841, 1844, 1845, 1858, 1859, 1860, 1861, 1862, 1863, 1864, 1865, 1866, 1868, 1874, 1876, 1877, 1878, 1894]
tags: [program-requirements, catalog-harvest, census, supabase, playwright, governance, lessons]
artifacts:
  - kb/_program_source_census.py
  - kb/supabase_program_source_registry.sql
  - .github/workflows/program-source-census.yml
  - tests/program_source_census_test.py
  - kb/governance_surface_map.json
related:
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/cpl_pathways_lessons]]"
---

# Program requirements harvest — Decisions & Lessons

The lane's current state lives in
[`docs/reference/lanes/program-requirements-harvest.md`](reference/lanes/program-requirements-harvest.md).
This doc keeps what each session learned, once, in order.

Sessions S320-S347 (Phase 0, the census, the pilot's first records, the addenda table, the first display build, the Ironworker proof, the maps and the Progress view) are in
[`program_requirements_harvest_lessons_archive.md`](program_requirements_harvest_lessons_archive.md), moved verbatim.

## S353-S359: moved to the archive (S389 compaction)

The sections for S353 SkyHearth through S359 SkyMoss moved verbatim to `docs/program_requirements_harvest_lessons_archive.md`.

## S360-S371: moved to the archive (S394 compaction)

Verbatim in [`program_requirements_harvest_lessons_archive_2.md`](program_requirements_harvest_lessons_archive_2.md): rules 4 and 5, Long Beach City's hidden index and full read, the per-college split, every record public, the curriQunet reader for Chaffey and San Diego City, and the SDCCD host.

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

## S386 SkyElm (2026-10-14): Palo Verde's noncredit programs, and courses printed under another subject

- **The reader was right; the catalog names the courses differently.** One college page read (run 38491285062, three
  loads) of the noncredit hub and the two pages the titles named. High School Equivalency 43203 prints NBE031-NBE034,
  144 hours each, total 576 (its header says 288.0 Units); the Program Course File lists GED031-GED034, the same
  numbers and titles, and neither set is in COCI's course list. Developing Capable Youth 45472's page is a 2021-22
  credit Certificate of Career Preparation (CHD120, 2 units; CHD227, 1 unit); the file lists the noncredit mirrors NBE
  120 and NBE 227 (0 units, in COCI). Child Care 45471 and Arts - Early Childhood Education 45473 have no page: the
  noncredit hub lists two ESL certificates and High School Equivalency. Each difference is the college's.
- **The run's page text cannot reach a session.** The extraction run's artifact holds every page, but its download
  host (`*.blob.core.windows.net`) is refused by the container's proxy; a college page read on a runner is the way to
  see a page.
- **Same number, another subject: measured, not built.** On loaded records, 257 pairs pair a listed course missing
  from the text with a printed course off the list of the same number. COCI's course list titles both for 128 of them:
  32 agree (Riverside City HIS→HIST, and three more colleges), 5 are near, 91 differ (Long Beach's GE lists: ANAT 1
  against ASL 1). For the other 129 one code has no COCI title (Norco's HIST 1), so a title test needs the catalog's
  printed title, which a record does not carry. Each such course reaches the college as two items today; only Palo
  Verde's 43203 lost its record over it.
- **21 of Palo Verde's 25 arithmetic failures name no total;** the other 4 sum to another figure (three Fire Science
  certificates, Child Development-Teacher). No page has been read for the 21 yet.
- **Modesto and Palo Verde had no procedure record for their catalog reads.** S386 wrote Modesto v1 and Palo Verde
  v3 (v2's maps kept byte for byte by composing on the stored record in SQL); receipts
  `kb/receipts/program_source_procedure_modesto_junior_v1_2026-10-14_s386.sql` and `..._palo_verde_v3_...`.
- **Palo Verde prints the degree total with general education, as Cabrillo does** (college page read 38497793717, two
  pages). Automotive Technology A.S.: header *64.0 - 68.0 Units*, *Total 64 - 68* = core 24 + electives 6 + *CalGETC
  34 - 38*. Psychology AA-T: *Total 60* = major 19-21 + CalGETC 34-38, the rest transferable electives. No major total
  is printed, so the extraction leaves it blank and 79 records at the two colleges fail arithmetic. The display's
  *"The catalog prints no program total"* (and Sierra's and CPL Pathways' same words) is wrong for these pages; the
  wording waits on how the record carries the figure (Open Asks Sheet 78).
- **Southwestern and Fresno City capture cleanly.** Southwestern (CourseLeaf sitemap, 451 loads, 36 min): 220 of 233
  found, 167 full coverage, 10 no page (two Administration of Justice options, Forensic Studies, three environmental
  and safety programs, Kinesiology AA-T at 21 of 60 codes, Yoga Teacher Training, a noncredit Family Child Care). Fresno
  City (curriQunet JSON, 474 loads, 38 min): 237 of 251, 199 full coverage, 6 no page (five noncredit). Both above
  Sheet 59's 85% bar; extraction waits on Sam (Sheet 78).

### Moved from the lane (S386 compaction, verbatim)

**A refusal is on the college's record (Sam, sheet 29 card 3, 2026-10-04 11:59Z):**
*"Note this in the record for the college. Rather than ask permission, we will
make the agent aware of the limitation and to continue to look for solutions or
workarounds."* So no access request goes to Miramar or the mapper's operator.
`program_source_registry` carries four columns the census never writes
(`sequence_host`, `sequence_access` open/refused/unreached/not_read,
`sequence_note`, `sequence_checked_run`), filled S326 for 25 colleges from the two
runs' evidence: **18 refused** (Miramar's mapper and the probe's 17), **5 not read**
(Bakersfield, LA Harbor, Merced and West LA link to a mapper not yet read; Palo
Verde's address is a homepage `#`), **2 open** (Irvine Valley's and Santa Monica's
own maps pages; Santa Monica timed out in the morning probe and answered in run
37209313523, filed by `..._2026-10-04b_s326.sql`). Receipt:
`kb/receipts/program_source_registry_sequence_access_2026-10-04_s326.sql`. The reader reads them: it never
requests a host on record as refused, follows the college's own links to the
program's map, pathway, roadmap or sequence (a page or a PDF), and the probe asks
each recorded host's front page once a run, flagging `CHANGED: file it` when a refused host or an unreached page now
answers. ⚠️ **"Workaround" means another public source, never the same refused
host under another name:** the reader keeps the census user agent that names the
CPL Initiative (Sam's call 5 on sheet 23), so it never retries a refusal in
disguise. The program read still needs the dispatch input `read: 1`.

**Sam's sheet 32 (2026-10-04 17:33Z, both his own calls, as proposed):** (1) a
program shows "up to" (the CPL course taken in every choice, the option with more
CPL) plus the recommended path's figure where a map is read, and *"continue to
include any CPL that the college might adopt for the courses on the pathway. And
think about how we can include any certs we know of that haven't yet been
articulated in the system for consideration. This is the reason we're adding all
those potential certs to the CER and ECRA"*: each course carries CPL in three
kinds, articulated here, could adopt (the same course articulated elsewhere), and
for consideration (a CER/EACR cert whose recommendation points at the course,
not yet articulated); (2) catalog-and-state-file differences collect as drafts
on the college's harvest-tab row and My College to-dos; the MAP team sends.
✅ **The harvest-tab half is built (S335):** Program records lists each college's own gaps under its heading as *Drafts for the college*, with a draft to copy; Catalogs counts and filters them. 28 live at the five pilot colleges (Miramar's two second-course drafts since 2026-10-05 21:45Z). ✅ **The My College half (Sam, sheet 42 card 3, 2026-10-05 20:58Z, his own call: *Show them now*):** My College lists each college's drafts now, under *Your program records, for review*, marked *For review* and *Beta draft*, right after *Start here* (S336, #1878). It reads the registry by `college_id`, then the college's records; a gap the reading procedure owns never reaches the college's page. The MAP team still decides when to send each one.
- **Two colleges capture at once on two branches.** A capture-only read is a dispatch of
  `program-requirements-college.yml` (`extract 0`, `step read`) on a branch cut from main; the concurrency group is
  per ref and the hosts differ, so Southwestern and Fresno City read side by side in about 37 minutes and each filed
  `capture_preview.json` to its own branch. Extraction then runs on the same branch after Sam's go.

## S387 SkyMagnolia (2026-10-14): course SLOs from catalog pages, the eight addenda, and Palo Verde's catalog year

- **eLumen prints each course's SLOs on its catalog course page** (college page read 38504338656): the program read's
  `publish/content` call at `<catalog>,course,<code in lower case, no space>` (Cabrillo `astro3`, Modesto `ag115`, Palo
  Verde `acc101`), the address a program page links. Each college has its own template inside the Learning Outcomes
  accordion: Modesto a label `SLO:` over an `<ol>`; Cabrillo a lead-in label over a table, one outcome a row, numbered in
  its text. The text reader read none of Modesto's and took Cabrillo's next *Toggle* as an outcome; the box parser reads
  24 of 24 trial pages exactly (trials 38505894485, 38506174617). eLumen rows load as `source_kind = catalog` (#2103).
- **The Coast district serves outlines of record by code** (`catalog.cccd.edu/courses/acct-c116/`): an `<h3>Course Level
  Student Learning Outcome(s)</h3>` then the list, then Course Objectives. Nine of 12 trial pages parse exactly (trial
  38508460207); the three common course numbers (ARTH C1100, HIST C1001, POLS C1000) answer 404 there. Filed under
  `cccd`; `catalog=<slug>` in `.run` reads either form (#2105).
- **CourseLeaf course entries print no SLOs** at Cerritos, Long Beach City and Mt. San Antonio; `/search/` is disallowed by
  robots.txt at all four loaded CourseLeaf hosts (#2101). Course pages: Cerritos
  `/degrees-certificates-courses/course-descriptions/<subj>/`, Long Beach `/course-descriptions/<subj>/`, Mt. SAC
  `/programs/coursesaz/<subj>/`.
- **An online catalog's addendum is a changelog of edits its pages already carry** (read 38504437775, #2102). eLumen
  dates each change and flags the page; Cerritos, Norco and Moreno Valley list new and revised programs and courses. Two
  checked against loaded records were already in the pages read: Norco's Successful Career Transitions (PDS-809 out of the
  required block, 33 hours to 21) and Cerritos's EDT 110 (2 units to 3). Miramar's "addendum" is the whole 549-page
  2025-26 catalog with an errata table on page 2.
- **Palo Verde's catalog of record was a year behind** (read 38506078868): its catalog page lists *2026-2027 Catalog* at
  `catalog.paloverde.edu` (Acalog) above *2025-2026 Catalog* on eLumen. `vendor_catalog_link` gives a vendor host two
  points, more than a newer year's margin. The first fix passed its test and failed the dry run (38506794465): the live
  page links eLumen in its own HTML, so it reads as eLumen, and the guard required a plain page; the fixture had no HTML.
  The second follows the newest catalog a yearless page lists whatever the page's platform (dry run 38508144436: Palo
  Verde alone moves; #2104). Its 52 loaded records stay 2025-26 until an Acalog reader re-reads them.
- **A census push runs its own full dry run**: a hand dispatch on the same branch queues a duplicate (cancel it).

### Moved from the lane (S387 compaction, verbatim)

✅ **Sheet 77 card 3, built and merged (S385, #2093; Sam, *Build it*, 22:25Z):** numbered boxes are the reading procedure's alone. A record's college items (*Catalog and state file differ*, *MAP names a second course*) sit on one line in its head, *For the college*, that opens to the list; course rows carry no number for them (the quiet COCI chip and *Printed in the catalog* stay). The MAP team queue gains *Program record items for the colleges to correct*: a count a college, each a closed line that reads its list when opened, from the view `program_record_college_items` (`chatbox/supabase_program_record_college_items.sql`). My College's list is unchanged (it reads the same gaps from the table). Counts: lessons S385. ✅ Applied by `supabase-migrate.yml` run 38482375985 and read back (lessons S385). ✅ **My College reads the view too (S386, #2097):** one row an item, read a page at a time (Cerritos 577 rows, where every record's display was about 4 MB).

## S388 SkyBuckeye (2026-10-14, the CPL Queue routine): three colleges' course SLOs loaded, the addenda reading agent, the Common CR Reference UI pass

- **Course outcomes at nine colleges** (live read: 7,450 courses, 20,891 SLOs). Cabrillo 1,124 (read 38507187621, load
  38515664600), Modesto Junior 910 (read 38515689944, load 38521527453) and Coastline 522 (read 38508963773, load
  38523415414). Every eLumen page answered 200; the 16 and 14 courses with no outcomes print none. Coastline's 28 misses
  are common course numbers the district's outline host answers 404 for. #2103 merged; #2105 merges on its `test`.
- **A handoff's trigger line can name a key the branch does not read.** Handoff 388 said `catalog=modesto_junior`; the
  `catalog=` key lives on #2105, and #2103's workflow reads `elumen=`. The first push would have read nothing; it was
  canceled and re-pushed. Read the branch's workflow before pushing a trigger file it parses.
- **A stacked branch's conflicts resolve by ancestry.** #2105 carried #2103's parser commit (f827ece), and `main`'s
  copies of the three code files equaled that commit's, so #2105's side was a strict superset: take it for code and
  `.run`, regenerate the dependency map, never pick sides on a generated file.
- **A receipt at a PR's head leaves `test` unreported.** `js-tests.yml` runs on `pull_request` and `main` pushes; the
  bot's receipt commit gets `action_required` runs. Put a real commit of yours on top (a merge of `main`, or the lane
  edit the PR's state calls for), then read `test` on that head.
- **The addenda reading agent (#2107):** `program_source_addenda_read(run_id, rows)` moves an addendum from listed to
  read and files `programs_changed`, `published_on` and `effective_term`; service_role only, never a corrected row,
  history under the run id. Applied by `supabase-migrate.yml` run 38516806015. The eight S387 reads are filed from
  `kb/addenda_reads/read_38504437775.json`: 42 program and 20 course changes, each with scope, kind, change and date;
  COCI control numbers where the program is in the snapshot (new ones are not). Receipt
  `kb/receipts/program_source_addenda_read_2026-10-14_s388.sql` (8 read, 0 skipped). Cabrillo's addendum prints none.
  Palo Verde's 2026-27 addendum changes four courses and no program; its 2025-26 one prints five programs in full.
- **Common CR Reference UI pass (#2108):** CSV control 19px tall, rank 3.55:1; every control now an underlined cobalt
  word, the rank on `--text-muted`; clean in light and dark (light failures 7 to 6 across 40 routes).
- **Local `main` can be a week stale in a fresh container:** a `git pull -q` on `main` failed silently and the first UI
  pass measured 2026-10-07 code. Branch from `origin/main` after a fetch.

**NEXT.** The Acalog reader once Sunday's census apply moves Palo Verde's registry row; then Palo Verde's records re-read
from 2026-27 and its course outcomes. The other 71 listed addenda wait for the reader to reach their colleges.

## S389 SkyPersimmon (2026-10-14): record shape 5, the re-read path, Southwestern loaded, and an Acalog reader

**Sam's rulings this run.** Open Asks Sheet 78 (11:18Z): card 1 *Extract both* (Southwestern and Fresno City), card 2 *Record both figures*. In chat (~12:55Z): *"go ahead with Palo Verde's 19 now too"*. The greeting named S388, which the CPL Queue routine had already run; this session took S389 from handoff 389.

- **Record shape 5 (#2110).** `program.degree_total`, `program.ge_units` and `program.electives_fill_degree`, each as printed. With no major total, the scorer adds blocks, open electives and general education against the degree total (`against: "degree"`); with electives filling the rest, both ends must fit under the total and `fill` names their units. Extraction function v7 and Sierra deployed from main (runs 38563081939, 38563093048).
- **The re-read path (#2111).** `program_requirement_records_college_reread()` replaces a row only while unchecked, unread by a person and from an earlier run; the receipt holds every before-value. Applied by supabase-migrate (run 38560296996). `force=incomplete` re-extracts the incomplete records that place a course; `step=reread` posts the newest run's records.
- **Palo Verde's 19 (#2114):** run 38567765687, $1.47, the same pages; replaced by run 38569469816. 11 equal against the degree total; 8 unequal: five transfer degrees print *Total 60* and no elective line (the major and CalGETC come to 52-59), two sum past 60 (courses counted for both the major and CalGETC), and Automotive 04436 recorded a 34-35 major total its 37-38 blocks miss.
- **Cabrillo's 55 (#2115):** run 38565227455, $6.13, the same pages; replaced by run 38570011602. 13 equal, 42 unequal. Most of the 42 read 57-60 against 60: a major whose choices run (18-21) with general electives printed as a range that takes up the rest; the record keeps `open_elective_units` as one number. The page adds up; the record lost the electives' range. Two questions for Sam (Sheet 79): count a degree total inside the computed span as adding up, and count a transfer degree's 60 as filled by the electives the statute provides when the page prints none.
- **Southwestern (#2115):** run 38563578596, 220 extracted, $13.77, 162 pass; load 38570038760 inserted 190 (30 place none). Dated reads gain Southwestern (3 MAP codes) and Fresno City (2). Display build `361c9f120c6f`. Fresno City's run 38563582873 was still extracting at the checkpoint.
- **An Acalog reader (#2112, open).** El Camino: catoid 13, no site map, six program menus; 124 of 135 programs with a list found a page, 94 at full coverage (run 38565658064). Two fixes on the way: read the catalog over the scheme its own links use (El Camino serves http only; an https load of every menu was *unreachable*), and report each menu's title, links and a sample. San Joaquin Delta's capture dispatched.
- **COCI Lookup UI pass (#2113).** Dark mode failed three ways (CSV control 1.29:1, chips 1.2:1, six filters with no focus ring); controls became underlined words, chips paint no fill.

**What went wrong.**
- **The pilot extraction ran on a push.** #2110 changed `kb/_program_requirements_extract.py`, the S361 guard (the script differs from main's) let the whole pilot run against function v6: 20 programs, about $1.6 nobody asked for (run 38560251804; it wrote nothing). A push now also needs a commit message starting with `[extract]`.
- **Card 2 cost $7.60 against Sam's "about $6".** Cabrillo's pages are long: $0.11 a program, not $0.07.
- **A generated file goes stale after any code commit,** not only the first: #2112's lints went red on the second Acalog commit. Run `scripts/check_generated.sh` before every push.
- **Restacking a branch:** `git rebase onto` replays the old base commit; use `git rebase --onto <new> <old>`.

**Patterns that worked.** Verify a re-read by diffing each record's `source_url`, coverage and arithmetic against main before posting it. One display build after several loads. A capture-only run with diagnostics in the report (each menu's title, links and a sample) turned two failed Acalog runs into fixes without a page-read plan.

## S390 SkySaguaro (2026-10-14): San Joaquin Delta's Acalog capture

- **San Joaquin Delta captures through the Acalog reader** (run 38569401921, capture only, 250 loads, 25 min): catoid 14,
  no site map (404), three program menus. 203 of 233 programs with a list found a page, 125 at full coverage, 58 at
  0.8-1.0, 20 at 0.5-0.8; 24 found none and 6 lost their page to a fuller program. On 15 of the 24 the best page
  names none of the listed courses: six apprenticeship options, the two psychiatric technician programs, three
  digital media certificates and four newer programs (45193-45195, 45583). Above Sheet 59's 85% bar.
- **Its registry row names no catalog year, and the reader reads none from the page.** Extraction stamps
  `catalog_year` from the registry, so Delta's records would carry none. Read the year from the catalog's own page into
  the capture report before Delta extracts. El Camino's row names 2026-2027.

## S390 SkySaguaro (2026-10-14): Southwestern and Fresno City to display, the SLO links, the Records filters

**Sam's rulings this run.** In chat: the harvested SLOs need *"a link to them on each course listing"*; *"no scrub needed"* and
*"my email is fine to have public"* (the tabled line); and the Program requirements tab loses its Sierra window, opens on
Progress, and filters Records with dropdowns, adding CIP Sectors and SWP Regions (`cpl_memory` rows of 2026-10-14).

- **#2115 merged:** Southwestern's procedure record v1 (receipt `program_source_procedure_southwestern_v1_2026-10-14_s390.sql`).
- **Fresno City (#2120):** load 38584860918 inserted 211 (26 place none); display build `04872c826890` applied to all 3,478 rows
  (run 38591098013); procedure record v1. A `step=display` dispatch applies the build the page already carries and builds
  nothing: build with `kb/_build_roep_display.py` first. A canceled re-apply of the old build wrote identical values.
- **SLO links (#2116):** the records print codes without a space (`PSYCH35`) and the outlines with one (`PSYCH 35`); joined on
  a key without spaces or hyphens, 7,018 of 8,352 record courses find outcomes, against 4,141 on the exact code.
- **The Records filters (#2121):** every record's control number is in `coci_college_programs`; 3,306 of 3,478 carry a CIP.
  `map_colleges.swp_region` names nine regions. A full re-render on a late read wipes the view's status line; add the late
  filter in place instead.
- **Main went red on PII (#2117):** the 14:38Z daily run baked a reviewer's email into the tabled line; `pii_guard` failed
  every PR's merge ref. The generator and the live render now print the date only.
- **A test that reports on a fixed timer under-counts on a loaded runner** (`nav_groups_overlay`, 30 of 31): report on
  `Promise.all` of its blocks (in #2116).

**NEXT.** El Camino's extraction waits on Sheet 79 card 3; San Joaquin Delta needs its catalog year read before it extracts.

## S391 SkyJuniper (2026-10-14): San Joaquin Delta's catalog year

- **An Acalog page names its catalog in a menu, and the year is in that option's words.** Every Acalog page carries a select of
  the college's catalogs, current and archived, each option's value its catoid. Run 38615275825 read Delta's: nine catalogs, the
  current one (catoid 14) *Summer 2026 - Summer 2027 College Catalog*, the rest *2025-2026 San Joaquin Delta College Catalog
  [ARCHIVED CATALOG]* and older. Read the option for the catoid being read, never the newest year the menu lists.
- **The census's year reader takes adjacent pairs only** (*2026-2027*, *2026-27*). A catalog named by its terms reads as nothing
  there, so the first run filed no year. The Acalog picker also reads two years a word or two apart, the second the first plus one;
  the census reader is unchanged. Re-run 38619208635 filed 2026-2027.
- **The registry row still names no year.** The capture fills it in memory where the registry names none, so the records and the
  capture report carry it; a registry year that differs from the page's is reported, never overwritten.
- **Delta's page is out of the session's reach** (the proxy refuses `catalog.deltacollege.edu`), and a run's artifact downloads from
  a host the proxy also refuses. Read a page through a capture-only dispatch and the report it files on the branch.

**Moved from the lane (S391 compaction),** verbatim: The re-read path (S389): `program_requirement_records_college_reread()` replaces a row only while it is unchecked, no person has read it and an earlier run read it, and returns the before-values the receipt files (`kb/receipts/program_requirement_records_college_reread_<slug>_<run>.json`, the rollback); a read dispatched with `force=incomplete` extracts those records again though their pages are unchanged, and `step=reread` posts the newest run's records.

**NEXT.** San Joaquin Delta's extraction is an ask (about $12 to $22 for 203 programs); El Camino's is Sheet 79 card 3, carried.

## Moved from the lane (S392 compaction)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, Phase 2 paragraph:

✅ **Sheet 78 (Sam, 2026-10-14 11:18Z) carried out:** Southwestern (#2115) and Fresno City (#2120) extracted, loaded unchecked and displayed; the 79 re-read under record shape 5. 🔨 **Record shape 5 (S389):** `program.degree_total` and `program.ge_units` keep what a page prints for the degree and its general education, `program.electives_fill_degree` says electives make up the rest with no figure; with no major total the scorer adds the blocks, open electives and general education against the degree total (`against: "degree"`; with electives filling, every end must fit and `fill` names their units). The display, CPL Pathways and Sierra name the degree total instead of saying the catalog prints none. Extraction function version 7 deploys from `main`. The re-read path (S389, #2111): a newer read replaces a record only while unchecked and unread by a person, with before-values in its receipt (lessons S389; `force=incomplete`, `step=reread`). ✅ **Palo Verde's 19 re-read (S389; Sam, ~12:55Z: *"go ahead with Palo Verde's 19 now too"*):** run 38567765687 ($1.47, the same pages, coverage unchanged), replaced by run 38569469816 (19 of 19; receipt `kb/receipts/program_requirement_records_college_reread_palo_verde_38569469816.json`). 11 now equal against the degree total; 8 unequal (why: lessons S389). The 2026-27 Acalog read replaces all 52 rows the same way. ✅ **Cabrillo's 55 re-read and replaced (S389):** read 38565227455 ($6.13, the same pages), re-read 38570011602 (55 of 55, receipt beside Palo Verde's). 13 equal against the degree total; 42 unequal (mostly 57-60 against 60: open electives printed as a range, kept as one number; lessons S389). ✅ **Southwestern loaded (S389, card 1):** run 38563578596 ($13.77, 220 extracted, 162 pass), load 38570038760 inserted 190 (30 place none). Five of the 79 place none of their courses and stay out. Santiago Canyon's listing has no links.

## S392 SkyTamarack (2026-10-14): Sheet 81 carried out, the degree check, the reconcile pass, El Camino and San Joaquin Delta

**Sam's rulings and words this run.** Open Asks Sheet 81 (20:22Z, all his own call): count, adt, extract, public, extract. In
session, after confirming Cabrillo Astronomy (06326) and marking Biology (06328) Needs a fix: the confirm step is a probe for
procedure gaps that retires as they close; a reconcile pass searches the catalog text again after the harvest; each catalog's
procedure carries its own steps; and "Highlight the mismatches in units in the summary row" (`cpl_memory` rows of 2026-10-14).

- **Sheet 81 cards 1 and 2 (#2127).** `degree_verdict()`: a degree total inside the computed span adds up (`within`); a transfer
  degree with no electives on its record is filled by transferable electives (`transfer`, `fill`; Ed. Code 66746(a)).
  `kb/_program_requirements_rescore.py` re-reads only how the filed sum meets the printed total, because the closed list and page
  text stay with the run. 35 rescored (one more than the sheet counted: Cabrillo AS-T 35651). The live `checks` moved through
  `supabase-migrate.yml`: the repo's Supabase guard blocks a session's UPDATE, and the committed-file runner is the reviewed path.
- **A runner's commit starts no CI.** The migrate job's receipt commit left #2127's head with no `test` run; a real follow-up
  commit (the receipt's applied block) started it.
- **The degree check (#2129, record shape 6, extraction v8).** About 1,560 associate degrees, 77 with a degree total: most records
  were read before v7. Every Cabrillo degree page says "at least 30 units in the major", and the reading took it for the major
  total. A page printing both totals now checks both; `degree_elective_units` keeps a degree's own electives; the **Major only**
  gap marks 1,487 records. El Camino's v7 records read the degree total on 52 of 53 degrees, so v7's wording works.
- **The summary row (#2128).** A units mismatch is a red word chip for either total, never the bare status; the For the college
  summary takes the alert color; an equal degree check names "60 units for the degree" (it printed "Equal,  units").
- **The reconcile pass (#2130).** Cabrillo's requirements tree prints "Complete the following number of credits: 60 · Cabrillo
  College General Education 24", the major, and "General electives: any transferable or degree applicable course. 6" (page reads
  38633618089, 38642988914). The first run (38639316727) changed 36 records: 7 now add up; 4 that passed against the major now
  miss the degree (two transfer degrees whose major and Cal-GETC overlap past 60, Sheet 82 card 2; Theatre Arts and Physics,
  whose reading dropped a Recommended Major Electives block). Re-read 38643400229 posted 35, none held.
- **The re-read held every row a person had read**, while the Records view promised a rerun would fix it. It now holds a checked
  row only (migrate 38639286293).
- **El Camino and San Joaquin Delta (#2131):** 117 and 202 loaded unchecked; display build `0a22233cf694`, 3,797 rows.

**What went wrong.** An amend after a push that had in fact landed forked the Delta branch (`check_generated.sh` prints its
regenerate hint without failing, so a `&&` chain does not stop). A test fixture for "never overwrites" had a genuinely empty
field. The first count of degree chips searched the receipt's JSON in the wrong key order (it sorts keys).

**Patterns that worked.** Measure the blast radius live before answering a question about one record. Read the page on a runner
before writing a reconcile pattern. Diff every reconciled record's check against main before posting it.

## S393 SkySycamore (2026-10-14): Sheet 82 carried out, Cerritos's reconcile steps, an overnight schedule and a $40 go

**Sam's rulings and words this run.** Sheet 82 (22:14Z, both his own call): *carry* and *overlap*. In session (~23:03Z),
on the CPL Queue routine: *"set it and limit is $40 per college"* (`cpl_memory` `sam-extraction-standing-go-40-per-college-2026-10-14`):
a college's extraction runs with no card up to $40, and the overnight schedule (hourly 10:12 PM to 6:12 AM Pacific) is his to
set in the Routines form, because the platform refuses an agent's edit to a routine it did not create. And (~23:20Z, an idea
for later): a weekly routine per district to keep the data fresh (`sam-weekly-refresh-per-district-idea-2026-10-14`; S393
recommended a page fingerprint in the census instead, so only changed colleges are re-read).

- **Card 2, overlap (#2136).** `degree_verdict()` passes a transfer degree whose sum runs past its printed total (`overlap`).
  The rescore found exactly the ten the card counted (Cabrillo 8, Palo Verde 2); the live rows moved through
  `supabase-migrate.yml` (run 38652994360; receipt `kb/receipts/program_requirement_records_rescore_2026-10-14_s393.json`).
- **Card 1, carry (#2136).** The re-read function carries a confirm when the row's latest verdict is a confirm of the record
  it replaces and the new record has the same `program_record_carry_basis` (every block and every other program field, as
  jsonb). The basis leaves out the totals and the degree's figures, which are every field a reconcile step writes; a test
  reads `kb/program_requirements_reconcile.json` and fails when a step writes a field the basis keeps. The carried row is a
  confirm in the reviewer's name naming the verdict it carries; the receipt's rollback restores the row unchecked and
  deletes the carried rows. Astronomy 06326 (replaced before the carry existed) was carried once by a guarded file (verdict
  35); it reads checked.
- **Astronomy needed the major total in the basis's exclusions.** Its rerun changed `degree_total` and `ge_units` and cleared
  `total_units` (the misread "at least 30 units in the major"). "Only the degree's figures" read literally would not have
  carried the card's own case. Proceeded on the recommendation; Sheet 83 asks Sam to keep or narrow it.
- **A local Postgres proved the SQL before the live apply.** The container has Postgres 16 (`/usr/lib/postgresql/16/bin`;
  initdb as the postgres user in a directory it owns, not the scratchpad, whose permissions reset). Stubs for `auth.role()`,
  the roles and the two tables, then both chatbox files load as written. Seven carry cases, the rollback, and Astronomy's
  one-time file against its real records (it carries once; a second apply refuses). The md5 of `jsonb::text` reads `3` and
  `3.0` as different values; jsonb equality reads them as one, so the basis compares jsonb.
- **Display build b87c61607e71** after the rescore, applied from `main` (Sam's standing go of 2026-10-10).
- **Cerritos (the most Major only records, 148 of 148).** Its degree pages print the major's own total and *"Complete a
  minimum of 60 units to include (1) the above major requirements, (2) the General Education requirements, and (3) electives
  as needed"* (college-page-read 38654411937). The GE units are on the catalog's CGEC page (*"CGEC, which is 24-28 units, is
  intended to meet the GE requirements"*; site map read 38655666139, page read 38656043692): Areas 1 to 7 carry 24 units,
  Area 8 three and Area 9 one, and a major of 32 units or more skips Areas 8 and 9. New: a `set` reconcile step (a figure the
  catalog prints once for every degree on its own page, cited from both pages) and `degree_total_minimum` (the 60 is a floor:
  a sum past it meets it, electives make up a sum short of it). Without the floor, every large Cerritos major (Automotive 42-43
  + GE 24-28 = 66-71) would trade Major only for a false Check not met.

- **Extraction v8 failed every call (#2138, v9 deployed).** The API refuses a schema with more than 16 union-typed parameters (*"Schemas contains too many parameters with union types (17 ...)"*); v8's `degree_elective_units` took v7's 15 to 17, so no extraction succeeded after its deploy. Found re-extracting Cabrillo 06350 and 06378 (run 38656003434, both filed with record null; that branch stays unmerged). v9 makes each span one nullable object and returns a null span as `{min: null, max: null}`; `tests/program_requirements_extract_schema_test.py` counts the unions from the source (v8: 17).
- **Cerritos reconciled (#2139).** Reconcile 38656800189 (no model call) changed 93 records: Major only 148 to 56 (34 transfer degrees, 22 AA/AS left); no record moved from pass to fail. Re-read 38661017876 replaced 89, held 3 checked rows (02201, 02203, 02213 keep their earlier live record), and carried one confirm (02235 Photography, unchecked: another check fails), the carry's first live run. Display build `45fdd29240cb`.

**What went wrong.** A `&&` chain after `check_generated.sh` pushed a stale catalog once more; read its output before pushing.
(S394 correction: the script exits 1 when anything is stale. A pipe through `tail` hides that exit, as S383 found.) The builder of the open-asks sheet rewrites the current sheet's file when run with any argument,
`--help` included; restore it with `git checkout`.

**Patterns that worked.** Measure the class before building for one record (Major only per college, then the page). Read the
page, then its catalog's site map, then the page the site map names: three runner reads, no model call. Test SQL on a local
Postgres before the migrate job.

## S394 SkyMadrone (2026-10-15): extraction v10, the catalog sweep's first two waves, and two reader fixes

**Sam's words this run.** None new: Sheet 83's store held no reply, so its cards 2 and 3 stand as S393 proceeded.

- **Extraction v10 (#2141, deployed run 38670811265).** Under v9 Cabrillo's Theatre Arts 06350 and Physics 06378 read
  their Recommended Major Electives block and also put its units in `open_elective_units`, because the block's list ends
  "or any transferable or degree applicable course" (18 + 18 + 18 + 24 = 78 against 60). Units a block holds never go in
  `open_elective_units` too. Re-extract 38670925488 ($0.17): both read 60 of 60; re-read 38674737585 replaced both.
- **The catalog sweep (#2143, #2144), Sam's standing go of up to $40 a college.** Eight colleges loaded unchecked:
  Santa Barbara City 242, Orange Coast 206, Foothill 97, Sierra 25, Fullerton 311, Citrus 144, Victor Valley 169,
  Monterey Peninsula 197 (extraction $103.83 in all; Fullerton the most, $23.09 over two reads; Cabrillo's two records $0.17). Display builds
  `ad2f574f892c` (4,367 rows) and `99dcfd1eed24` (5,188), each applied from `main` after merge, one after the other.
- **One branch per college, one PR per batch.** Each college reads on its own `claude/s394-<college>` branch, so the
  runs go in parallel (the workflow's concurrency group is per ref); never two on one catalog host at once. A wave branch
  merges the loaded colleges, adds the dated reads, and carries one display build. A display build rewrites every row,
  so the second waits for the first's apply.
- **NOCCCD's campus letter (#2144).** Fullerton found 13 of 326 programs. Its pages and the state's file both write
  `HORT 001 F`, the campus letter its own word (college-page-read 38674811444); the net read `HORT 001` and
  `code_pattern()` fell to the letters `HORTF`. Both now read the letter as the code's suffix, spaced or joined. Only
  Fullerton (4,993) and Cypress (4,099) write codes this way. The re-read found 313. The leading-letter shape at De Anza
  and others is a two-letter subject (`C S 1A`), not a campus prefix: left alone.
- **curriQunet walk cap 400 to 1200 (#2144).** Santa Ana nests programs under department pages; its walk stopped at the
  cap with 27 of 359 reached. Re-capture 38674963853 runs at the new cap; not loaded this run.
- **Diablo Valley is parked.** Four reads (38670917323, 38672223676, 38672391389): its eLumen catalog names no program
  anywhere; it points to www.dvc.edu/programs. It needs a program list from eLumen's data or the college's site.
- **Read before extracting where the reader is new.** A free capture-only read showed DVC's 0 and Santa Ana's 27 before
  any spend. On a CourseLeaf host the readers already handle, read and extract together: a miss costs only the pages
  found (Fullerton's first $0.88).
- **The dated reads, verified.** Each college's MAP read is checked by the two md5s (counts in C order, titles in the
  read's order) computed in SQL against the filed rows; Fullerton 057fed7f/11d31a76, Monterey Peninsula eb85fce8/1794bde6.
- **The UI pass, GR Priorities (#2142).** The gated tab had only ever been measured as its lock. A seeded target
  (`gr-priorities-gr`, `-dark`, synthetic rows) found the accent as `--seal-blue` (a fill that stays dark: 1.2-1.3:1 in
  dark), boxed controls, sub-24px links and centered prose.

**What went wrong.** `check_generated.sh | tail -4 && git commit` pushed a stale dependency map once more (#2141); the
fix-up commit followed. A push that changes `kb/_program_requirements_pilot.py` also starts the pilot's capture
(read-only, free, no commit), so it costs runner time only.

**Patterns that worked.** Read the page the reader missed, on a runner, before touching the reader. Measure a code shape
across the state's file before changing the shared normalizer. Batch colleges per PR, display builds in sequence.

## S395 SkyHawthorn (2026-10-15): the catalog sweep's wave 3, wave 2's procedure records, Santa Ana's titles, and staff email off the public page

**Sam's words this run.** None: Open Asks Sheet 83's store held no reply, so its cards stand.

- **Wave 3 (#2149):** eleven CourseLeaf colleges read and extracted in parallel, one branch and one host each ($92.92); ten
  loaded unchecked, 1,132 records (Cypress 251, San Bernardino Valley 200, Cuyamaca 179, Sequoias 118, Mt. San Jacinto 94,
  Napa Valley 94, Evergreen Valley 74, Moorpark 54, Golden West 50, MiraCosta 18). San Jose City found 8 of 90 and none
  passed: read, not loaded. Display build `515c9d71e086` (6,320 rows), applied from `main` (run 38761398479).
- **Dated reads, filed by hand and checked:** MAP's course codes for six colleges, each college's rows matched to SQL by an md5
  of the counts and an md5 of the titles (Cypress f23dc34b/09bded16, San Bernardino Valley f18f1313/4e38c8e4, Napa Valley
  46024a39/1cb28039). The md5 check caught nothing this time; it is what makes a hand transcription of 158 rows safe.
- **The procedure-record generator (#2146).** S394's eight records came from code never committed. `kb/_program_source_procedure_v1.py`
  builds a record from each read's `capture.json` and `summary.json` at the run's own filing commit, so a college read twice
  (Fullerton: 13 found, then 313 after the campus-letter fix) shows both reads. Run on the same files it reproduced S394's
  Orange Coast and Sierra records exactly. A row that already holds a record (Cypress, Moorpark, Napa Valley: S346's program-map
  records) gets a v2 merged in SQL (`procedure || jsonb_build_object(...)`), so nothing of v1 is retyped.
- **Santa Ana (#2148).** At the 1,200-call cap the walk finished (837 calls) and still found 27 entries. Page read 38749570529:
  Instructional Programs > department > entry, entries titled "Accounting: A.S. Degree". `cq_is_program` wanted " - " before
  the award, so those were walked as departments. It now also reads an award after the last colon.
- **Staff email on the public dashboard (#2147).** The 2026-10-15 daily run shipped two progress notes Sam wrote from
  his cccco.edu account, address and all, into `CPL_Data.js`; `pii_guard.test.js` then failed on `main` and every PR. Nothing read the public map's
  `author` (the reports and RACI read Supabase), so `load_item_updates()` no longer selects or ships it. Ported into each open
  PR rather than waiting on the fix to merge.
- **Reconcile, what the pages say.** Monterey Peninsula: degree pages print "Additional Requirements 39-42" (GE and electives
  together) and no GE units; the GE page's Cal-GETC tab says "satisfies the 34 units", its MPC GE tab lists areas (9, 3, 6, 6,
  7 ...) with no total. Orange Coast: the REQUIREMENTS tab prints "Total Major Units 35", "OCC AS General Education Up to 21"
  and "Total Minimum Degree Units - OCC AS GE 60"; 27 of its 35 "no total" records hold no blocks and stayed out of the load.
  Victor Valley: AUTO 82.0 prints with no title and no units, and each page's Total Units agrees without it (a catalog gap;
  correcting it needs a step that touches course units, not yet a reconcile kind). Reads 38749721270, 38752570705,
  38756364740, 38759288106.

**What went wrong.** An unfiltered `list_workflow_runs` returned eleven runs' full commit messages (about 10,000 tokens):
filter by branch and `perPage` 1. Three reads in a row to reach MPC's GE units: open tabs (`"expand": true`) on the first read
of a CourseLeaf page.

**Patterns that worked.** One branch per college let eleven reads run at once with no host read twice. Port a CI fix into every
open PR the moment it exists. Merge in SQL rather than retype a record the database already holds.

## S396 SkyJacaranda (2026-10-16): wave 4 read and partly loaded, Orange Coast and Monterey Peninsula's reconcile steps, Santa Ana's reader merged

**Sam's words this run.** One, near the end: the CPL Queue routine fires around 10 PM Pacific, "so hoping it can start after you finish up". The session checkpointed then and handed the runs still in flight to the next.

- **#2151 and #2148 merged.** #2148's head was the bot's filing commit, which runs no `test`; a merge of `main` on top gave it one (green), and the three dashboard artifacts took `main`'s copies, since the branch's only change to them was #2147's author removal.
- **Wave 4, nine colleges at once, one branch and one host each** (about $175 under the $40 go). Loaded unchecked: Ventura 101 of 131 (30 placed none of their courses), Oxnard 64 of 94, Reedley 36, Palomar 220 of 224, Chabot (233 read, 201 passing; load dispatched). curriQunet did well where its index was whole: Palomar 224 of 331 found and 196 passing, Chabot 233 of 244 and 201. Reedley's index held 40 entries in 2 sections, so it found 36 of 200: parked for a page read.
- **The dated reads went in ahead of the loads, all nine at once.** Registry columns matched by one md5 over ten columns (8cad0f35); MAP's course codes by three md5s a college (counts, titles, exhibits by source): Santa Ana 83, Reedley 24, Ventura 4, Allan Hancock 3, Oxnard 2; Rio Hondo, Palomar, Saddleback and Chabot name none. Writing the rows in the read's own pipe form and parsing them made the 83-row check exact on the first pass.
- **Orange Coast's steps.** The Requirements tab's textContent prints "Total Major Units36 - 37 OCC AS General Education 1,2up to 21 Transferable electives as needed to satisfy unit requirementsvaries Total Minimum Degree Units - OCC AS GE60" (read 38752570705; the filed text carries tabs between label and figure). Five steps; GE is `{min: null, max: 21}`, which the scorer reads as 21. Reconcile 38843379313 changed 11 of the 41 records that lacked GE units (six now pass), and reread 38847265701 replaced them. The other thirty keep the gap: their captured text is the page's visible text, which lacks the hidden tab.
- **Monterey Peninsula's steps.** Read 5 (38843693844) opened a transfer degree page: "Certified completion of the California General Education Transfer Curriculum (Cal-GETC) pattern". A local degree's GE is 24 to 34 (the GE page's eight areas, each "Select three units", and Cal-GETC's 34); a transfer degree's 34. The 24 is a sum the catalog does not print, so it is a card. Its reconcile run was still capturing at sign-off.
- **Victor Valley's AUTO 82.0** prints with no units on two certificates whose totals agree without it; a card, since the fix is a new step kind for two records.

**What went wrong.** Job logs cost the run about a third of its context: the college page reads print whole pages, and a log tail of 75 to 120 lines ran 15,000 to 40,000 tokens. Read a page read's answer from its excerpts by asking a narrower plan, and poll runs with `git ls-remote` (a filing or receipt commit is the signal), never `list_workflow_runs`, whose rows carry each commit's whole message. A worker restart mid-run cost nothing: the state was all on branches.

**Patterns that worked.** Dispatching every independent read in one turn, then working the reconcile steps while they ran. A reread waits behind a reconcile on the same branch (the workflow queues per branch); the filing step rebases when the branch moved, so pushing during a run is safe.

## S397 SkyCatalpa (2026-10-16): Allan Hancock loaded, Monterey Peninsula reread, wave 4's display build, Sheet 84

**Sam's words this run.** None: the CPL Queue routine started the session at 05:12Z, and Open Asks Sheet 83's store held no reply.

- **Allan Hancock's read** (38843474519): 156 of 226 programs found, 136 passing, $12.41. Loaded unchecked, 153 of 156 (run 38854805185).
- **Monterey Peninsula's reconcile** (38844053281) filed after S396 signed off: 52 records changed, arithmetic failures 117 to 89. Reread 38854802315 replaced the unchecked rows.
- **Wave 4's display build `66b50c86891e`** on PR #2157, which carries all of #2156 (closed as superseded) plus Chabot, Allan Hancock and both rereads. The builder needs `openpyxl` (`chatbox/build_program_courses.py`); install it with `python3 -m pip`, since a bare `pip` may install for another interpreter.
- **Open Asks Sheet 84** built from S396's cards and published (https://claude.ai/artifact/AqQsUUEmSKRWkLntcbAhFz).

**What went wrong.** One unfiltered `list_workflow_runs` returned a page of whole commit messages again, the cost S395 and S396 both recorded: filter by branch with `perPage` 1, or poll `git ls-remote`. A branch made from a wave branch lacks `main`'s latest checkpoint; merge `main` before writing the next.

**Patterns that worked.** Taking the wave branch onto the session's own branch and opening one PR let the display build ship while three reads ran on; the stragglers get their own build.

## Moved from the lane (S394 compaction)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`:

**The sequence pass (S325, PR #1847):** `kb/_program_sequence_ppm.py` on its own
workflow (`program-sequence-ppm.yml`, so a change never reruns the capture's 20
reads) enters a college's Program Mapper from the college's own pages, follows
the link into the mapper, and accepts a page naming half the program's listed
courses and at least two terms. **Run 1 (37197332656):** Miramar's own mapper page links `san-diego-miramar.programmapper.com`, which answered all seven requests **403 Forbidden**. None of the 20 captured catalog pages prints a
term sequence.

**Catalog addenda (Sam, 2026-10-04: *"We need to track this in our schema and have our agents aware."*).** The census records each addendum, supplement or errata link for the current or prior catalog year in `census_evidence -> 'addenda'` and writes `program_source_addenda` after the registry on apply (one row per college and url; status listed, read, applied, gone, not an addendum; `programs_changed` for the reading agent; public read, writes through a security-invoker function). Only a complete read marks an addendum gone. **79 listed at 52 colleges** (apply of 2026-10-11). ✅ **The eight amending loaded colleges read (S387, #2102):** an online catalog's addendum is a changelog of edits its pages already carry (Norco's PDS-809 and Cerritos's EDT 110 already read as changed), so it explains a catalog-and-COCI mismatch rather than correcting the record; Miramar's "addendum" is the whole 2025-26 catalog. ✅ **The reading agent files them (S388, #2107):** `program_source_addenda_read()` (service_role only, never a corrected row, history under the run id) moved the eight to `read` with `programs_changed` (42 program and 20 course changes, each with scope, kind and date) from `kb/addenda_reads/`. **NEXT:** the other 71 as the reader reaches their colleges. Detail: lessons S325-S327, S388.

## Moved from the lane (S393 compaction)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`:

✅ **San Joaquin Delta's catalog year (S391):** read from its catalog menu where the registry names none; run 38619208635 filed 2026-2027. Extracted, loaded and displayed (Sam, Sheet 81 card 5; S392).

## Moved from the lane (S398 compaction)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, Phase 2, when the lane passed its 20,000-byte budget.

- Build `0a22233cf694` holds all 3,797 rows (display run 38639117185, S392; its applied record is the rollback): 1,487 associate degrees holding the major only carry the **Major only** gap (#2129), 14 degree-total misses the units chip with the degree's figures (#2128).

- ⚠️ **Palo Verde's records are a year behind (S387):** its catalog page lists the 2026-27 catalog at `catalog.paloverde.edu` (Acalog); the census took the 2025-26 eLumen one. #2104 fixed the pick (applies 2026-10-18); the Acalog reader (#2112) then reads all 52.

- ✅ **Open Asks Sheet 81 (Sam, 2026-10-14 20:22Z, all five his own call; `sam-sheet-81-rulings-2026-10-14`):** card 1 *count*: a degree total inside the span the blocks, general education and open electives allow adds up (`within`); card 2 *adt*: a transfer degree printing its total and no electives is filled by transferable electives (`transfer`, `fill`; Ed. Code 66746(a)). `degree_verdict()` in the scorer holds both; `kb/_program_requirements_rescore.py` applied them to the filed records (35: Cabrillo 29 within and 1 transfer, 35651; Palo Verde 2 within and 3 transfer) and the live rows' `checks.arithmetic` moved through `supabase-migrate.yml` (receipt `kb/receipts/program_requirement_records_rescore_2026-10-14_s392.json`, its rollback inside). ✅ Card 3 El Camino and card 5 San Joaquin Delta: extracted ($8.08, $13.42), loaded unchecked (117, 202) and displayed (S392).
- ✅ **Sheet 82 (Sam, 22:14Z; `sam-sheet-82-rulings-2026-10-14`):** a confirm carries over a rerun that changes only degree figures (*carry*); a transfer degree whose major and general education overlap past its total adds up (*overlap*). ✅ Both built (S393, #2136; lessons S393). 🔨 **Cerritos's steps (S393, #2139):** a minimum of 60 (`degree_total_minimum`), CGEC 24-28 by a `set` step, electives as needed; Major only 148 to 56, re-read live; Merged and applied (build `45fdd29240cb`). ✅ Extraction v10 (#2141, S394): units a block holds never count twice; Cabrillo 06350 and 06378 read 60 of 60.
- **Reconcile, read:** Orange Coast's REQUIREMENTS tab prints "Total Major Units", "OCC AS General Education Up to 21" and "Total Minimum Degree Units - OCC AS GE 60"; Monterey Peninsula's GE page states Cal-GETC as 34, MPC GE by area with no total; Victor Valley's AUTO 82.0 prints no units; its totals agree without it.
- Course outcomes loaded by college (S388): RCCD (#2049: Riverside City 1,174, Norco 817, Moreno Valley 674), SDCCD (#2066: San Diego City 588, Mesa 1,026, Miramar 615), and from catalog course pages addressed by code: Cabrillo 1,124 and Modesto Junior 910 on eLumen (#2103), Coastline 522 from the Coast district's outlines of record (#2105; 28 common course numbers answer 404 there).
- **Chaffey** (#2073): neither public report prints course outcomes. Cerritos, Long Beach City and Mt. San Antonio print none on their CourseLeaf pages (#2101). **Palo Verde held** for its 2026-27 Acalog catalog (reader merged, #2112).

## S398 (SkyLinden, 2026-10-16): wave 4 finished, and two limits the display build was about to meet

- **A display apply that times out files no rollback.** S397 dispatched build `66b50c86891e`'s apply at 05:45Z (run 38857449086). At one GET and one PATCH a program it was canceled at the job's 30-minute limit after 6,875 of 7,125 programs, and `kb/_program_requirements_display_apply.py` writes its applied record only when the loop ends, so none was filed. Nothing said so: the handoff named the dispatch, and the next session found it only because the re-run (38909267523) read 6,875 rows as already holding the build. The rows it wrote go back by re-applying `515c9d71e086`'s receipt to its keys and setting the rest to null. #2159 raised the limit to 120 minutes (about 30,000 programs at the measured 0.22 s a program; 6,320 had taken 14 minutes the day before, so the pace varies by a factor of 1.6). Build `fa8ee2a84935` (8,070) then applied in about 36 minutes (run 38915019105).
- **A receipt is a file, and GitHub refuses one over 100 MB.** Each program's display is about 9 KB of SQL; `fa8ee2a84935`'s receipt was 72.7 MB. #2159 writes new receipts gzipped (mtime 0, so one build gzips to the same bytes; 8.1 MB for the same build) and the display job reads either form. `zcat` reads one by hand; an earlier build's plain `.sql` stays its rollback.
- **Procedure records:** `kb/_program_source_procedure_v1.py --merge` writes the v2 that merges onto a row's own record, the shape S395 wrapped by hand. A curriQunet page is counted "from the catalog's own index" (the host serves no sitemap). Wave 4's nine are applied (#2161).
- **What the wave-4 reads left open:** Palomar lost 103 of 331 programs' pages to a sibling award (the Foothill pattern); Ventura and Oxnard each keep 30 records out of the load (no listed course placed); Saddleback 19 and Santa Ana 8 pages claimed by a sibling; Reedley's index held 40 entries for 200 programs.
