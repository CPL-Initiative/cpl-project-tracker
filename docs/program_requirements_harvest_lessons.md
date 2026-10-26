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

## S372-S385: moved to the archive (S403 compaction)

Verbatim in [`program_requirements_harvest_lessons_archive_2.md`](program_requirements_harvest_lessons_archive_2.md): Miramar and Mesa displayed, the course outline census, the SLO reads, three re-reads, the eLumen read, Bakersfield, Coastline and Cabrillo end to end, the 1,000-row cap, loading by college, and Modesto and Palo Verde.

## S386-S388: moved to the archive (S413 compaction)

Verbatim in [`program_requirements_harvest_lessons_archive_2.md`](program_requirements_harvest_lessons_archive_2.md): Palo Verde's noncredit programs and the courses it prints under another subject, the course SLOs from catalog pages, the eight addenda and Palo Verde's catalog year, three colleges' course SLOs loaded, the addenda reading agent, and the Common CR Reference UI pass.

## S389-S393: moved to the archive (S419 compaction)

Record shape 5 and the re-read path, San Joaquin Delta's Acalog capture and catalog year, Sheet 81 and Sheet 82 carried
out, the degree check and the reconcile pass, Cerritos's reconcile steps: verbatim in
`docs/program_requirements_harvest_lessons_archive_2.md`.

## S394-S398: moved to the archive (S424 compaction)

Extraction v10 and the catalog sweep's waves 1 to 4 (CourseLeaf, curriQunet and Acalog colleges), Orange Coast and
Monterey Peninsula's reconcile steps, Santa Ana's titles, wave 4's display build and its two limits, Sheet 84: verbatim in
`docs/program_requirements_harvest_lessons_archive_2.md`.

## S399-S403: moved to the archive (S447 compaction)

Wave 5 (ten curriQunet colleges) and its second half, Butte parked, the five reader faults read from the hosts' own
outlines, eLumen links written whole, the whole-catalog PDF reader and its wave, East LA and the PDF reader merge, with
the lane text those sessions retired: verbatim in `docs/program_requirements_harvest_lessons_archive_3.md`.

## S404-S405: moved to the archive (S467 compaction)

Own-HTML catalogs through the sitemap road and College of San Mateo (S404), then the year scope, Sheet 88's
colleges, ligatures and the hand-filed step (S405), with the lane text those sessions retired: verbatim in
`docs/program_requirements_harvest_lessons_archive_3.md`.

## S406-S407: moved to the archive (S486 compaction)

The hand-filed catalogs read from Sam's release copies (S406), then catalog steps for own-HTML PDF colleges, the heading preference and the migrate path (S407), with the lane text S406 retired: verbatim in
`docs/program_requirements_harvest_lessons_archive_3.md`.

## S408 SkyAgave (2026-10-17): a run of numbers after one subject, a list marker at a line's end, the eight-college wave

- **A run of numbers after one subject (#2206).** Glendale's 2025-2026 PDF prints "ACCTG 101, 102; BUSAD 101, 106, 120;
  CS/IS 100 or 101". `find_codes` matched a code only where its subject stood beside the number, so a program page named a
  third to a half of its list, and course descriptions ("WELD 121 is the first...") outscored it. The capture-only read
  found 190 of 267 with 117 picks at 50-80% coverage (run 39057600516); on the new finder, 258 found and 180 at full
  coverage (run 39062348929). A number the run's words make a figure ("and 3 units", "or 3 years") ends the run; a
  three-digit number may carry one space per digit ("B IOL 1 42, 50"); a subject may carry a slash (CS/IS). The filed
  fixtures find all they found; Mt. San Antonio 33876 also finds CHLD 67L ("CHLD 67 & 67L"), pinned in the test.
- **A list marker at a line's end (#2207).** Ohlone's chapter 7 PDF prints an outcome's number at the end of its first
  line ("...deposit receipts, escrows, 2." then "and financing."); 125 of 146 records failed the outcomes check (run
  39061732843). The scorer reads the text once more with such markers dropped. A `step=reconcile` (no model call)
  rescored the filed records: outcome failures 125 to 8, machine passes 8 to 117 (run 39063337090).
- **The session cannot reach a run's artifact or a college host.** Both proxies refuse (`productionresultssa19.blob...`,
  `glendale.edu`), so a PDF's text comes from a page-read plan: keywords loose enough for spaced capitals
  (`B\s?U\s?S\s?A\s?D\s{0,3}16[2359]`) print the pages naming them (runs 39061888500, 39062425296).
- **A year on a catalog step reaches loaded rows only through a forced re-extraction.** East LA's step v2 carries
  2026-2027 (migrate run 39062042558); `step=reread` posts only the newest run's records, so all 120 were forced
  (`force=` the filed control numbers, $10.74), then reread (120 replaced) and loaded (13 new; 4 place none).
- **Glendale's catalog prints no units per course.** 161 of 258 records read arithmetic incomplete and 25 invented (a
  2025-2026 catalog against the state's current list); 220 loaded, 38 place none. The display fills units from COCI.
- **Loads (all unchecked):** Desert 323 ($28.43), CCSF 41 reread + 2 ($23.72 forced), LA Southwest 84 ($6.00),
  Grossmont 136 ($10.28), Ohlone 134 ($10.02), East LA 120 + 13, Glendale 220 ($19.80), Pasadena 290 ($20.86).
- **The wave (#2208): build `f949e7c0ea35`, 15,336 programs at 108 colleges** (from 13,851 at 100). The registry read
  had drifted on 16 rows, not only the six S407 changed: ten carried the 2026-10-04 census, three of them with more
  (Mt. San Antonio's Guided Pathways sequence, Miramar's address without `/iq/20891`, West LA's mapper refusal). Compare
  every row's md5 to live at a wave, not only the added colleges'.
- **Merging college branches with `-X theirs` can revert shared files.** Branches cut from an older code base carried an
  older `kb/dependency_map.json`; diff the code and generated files against `main` after the merges and restore. Push
  merges alone: a push mixing a merge that changed `kb/migrations/.apply` with a later plain commit would fire the
  migrate gate.
- **Desert's online catalog** (`catalog.collegeofthedesert.edu`, 2026-2027) is the college's own HTML: no vendor marker,
  no data calls, its Programs of Study an unlinked table (page read 39066043761). It holds the year the PDF read loaded.
- **The UI pass's next view, Exhibit Adoption, measured and deferred.** Four faults (run at S408): `.cv-synth` 4.27:1
  light and `.cv-ccc` 4.05:1 dark, and no focus ring on `#sw-search` and `#sw-handout`. The `sw-*` control styles sit in
  the generator's exhibit CSS block (`index.html`, the `MAP Articulation Analysis Cards` markers), so fixes inject from
  `statewide_interactive.js`'s `CV_STYLE`; the 🏛 beside "Statewide CCC standard" is an emoji and goes; ⚙ is the design
  system's suggested-accent glyph.

## Moved from the lane (S408 compaction)

- S406-S407's sweep line: build `fec9782a4dbc` (13,851 at 100) added the eight hand-filed colleges (Cerro Coso 52,
  Porterville 76, Folsom Lake 104, De Anza 210, Sacramento City 182, Cosumnes River 182, CCSF 294, American River 327);
  S407 read LA Trade Tech, LA Mission and Desert through catalog steps and applied Sheets 90-91's registry corrections
  (Cuesta, the six hand-filed rows, Grossmont, Ohlone, Cañada, Pasadena, Glendale, LA Southwest) through the runner.

## S411 SkySotol (2026-10-18): Hartnell by its code headings, the reconcile trap, Merced and SmartCatalog mapped

- **`d6cc1fde7ea3` applied:** 15,647 written (run 39084444048, its applied record on `main`).
- **Coursedog's PDF heads each program "Title - CODE"** (`Biology - AS.BIO`; a hyphen form, `AAT-SOC`; a code on the
  next line, `- \nAST.ADJ`; two headings run into one line by pypdf, `... - NCCT.BCL Workforce and Academic Readiness -
  NCCT.WAR`). The prefix names the award (AA, AS, AAT, AST, CT, NCCT, BS). `pdf_code_assign()` reads them where a
  catalog heads half its listed programs so, gives each code to the programs whose title it names most fully
  (`page_winners()`'s rule: ties share, Communication Studies and Communication Studies 2.0 both A.A.-T; Public Health
  Science loses Public Health's), and leaves a program no heading names unread. The headings' titles drop "for
  transfer" before matching, or every A.A.-T reads at half its own words. `LEVEL` reads "Level -1".
- **Hartnell, measured on the PDF locally** (the vendor's S3 bucket answers the session; `app.coursedog.com` does not):
  of the 33 left out, 8 read from their own heading and 24 from none. **The PDF does not print 31 of Hartnell's 105
  listed programs** (Kinesiology, Addiction Studies, the General Studies emphases, Agriculture Production, Small Farm,
  CalGETC, and others). Among the 68 loaded, 14 moved from a sibling award's page to their own (Digital Arts CoA had
  read the A.A.'s page; the two Early Childhood Education degrees were swapped). The runner's capture matched to the
  program (run 39089852947: 74 by code, 23 to extract). Extraction run 39090050931, $2.05; load 39090337524 (8
  inserted), reread 39090450992 (14 replaced). Network and Security A.S. stays out: the catalog renumbered CIS 50-55
  as CSS50-55, and COCI still lists CIS.
- **Four loaded rows read another program's page and no heading names them** (Psychology A.A. and Spanish A.A. from
  their A.A.-T's page; IGETC from the Cal-GETC lists; Public Health Science from Public Health's). Spanish A.A.'s own
  section prints no requirements, so its new record places none. Removed under a receipt holding each row whole
  (Sheet 68's procedure; Sam's "remove" rulings on wrong-page rows and his 2026-10-17 go), through
  `supabase-migrate.yml` (run 39090450880, 4 removed): the repo's guard holds a delete sent by `execute_sql`.
- **The reconcile trap.** A reconcile run files its fresh `sources.json` beside the records it did not move, so a later
  extraction read compared the moved pages with themselves and kept the old records: 127 filed records stood on another
  page than their source names (Los Angeles City 69, Pierce 43, Santa Rosa 11). `filed_from()` keeps a record only when
  it was extracted from the page its source reads. **Test a reader change with a capture-only read** (`extract=0`):
  its preview's `would_extract` names each moved program, and it replaces nothing.
- **Build `182e810e207d`: 15,651 programs at 111 colleges.** Every filed registry row equal to live.
- **Merced (Coursedog on catalog.mccd.edu).** A page read may keep a named vendor host's data calls (`network_hosts`):
  the program search names the school `merced_colleague_ethos`, catalogId `QTM2GIg9kimBOfyC8Dbb`, 191 programs coded
  by TOP and award (`05000.AA`, Accounting (AA)). The vendor's `pdf-reports/catalogs/<catalogId>` answers 404: no
  whole-catalog PDF. No sitemap. A program page opens on its overview tab; its Requisites tab
  (`/programs/05000.AA/requisites-ojrrt`) prints the list whole, with credits (`ACTG04A Financial Accounting (Total
  Credits 4.0 - 4.0)`), and each page offers its own PDF.
- **SmartCatalog (Crafton Hills, Taft): index, then a subject or group page, then the program.** Crafton's Credit
  Programs lists 41 subjects (`accounting-acct`); each subject lists its programs under "In this section"; the program
  page prints its required courses, units and total (`BUSAD 053 Business Computations 3.00 ... Total Credit Hours:
  21.00`). Taft's Degrees and Certificates lists each program as "Title: Award"; an entry may be a group (Welding
  Technology lists its A.S. and five certificates) or the program itself. A page read skips a page it already read, so a
  plan never names a page another page's follow reaches.

## Moved from the lane (S411 compaction)

From the Records view paragraph, verbatim:

**The index reads stored columns (S405; Sam, 2026-10-17: *"Prog Req tab in COBI loads very slow--we need to find a way to optimize it as we continue to grow it to the full CCC catalog"*).** Each Range page is an OFFSET, which evaluates every skipped row; three paths into `display` and the signed-in `requirements_fp` made the last public page of 11,969 take 9.4 s (anon's limit 3 s) and a signed-in pass 16 s more, growing with the square of the table. Four STORED generated columns (`idx_fp`, `idx_display_arithmetic`, `idx_display_reviewer`, `idx_display_here`; `chatbox/supabase_program_requirement_records_index_columns_2026_10_17_s405.sql`) take the same page to 22 ms, and the index reads 1,000-row pages four at a time. Guard: `tests/program_requirements.test.js` (6e).

## S410 SkyYucca (2026-10-18): Cañada by its hand-filed copy, Hartnell through a file step, build d6cc1fde7ea3

- **`ffd6929a4f90` applied:** 15,517 written (run 39078224767, its applied record on `main`).
- **Cañada (hand-filed):** Sam posted the 2026-2027 Catalog Rights edition and the 10/12/26 addendum to `catalog-files`
  (Sheet 92 card 1). `kb/hand_filed_catalogs/ca_ada.json` cites the college's own addresses from page read 39075421421;
  the pin step fixed both hashes (run 39080648854). `slug_of()` keeps ASCII letters only, so Cañada's slug is `ca_ada`.
  73 of 75 found, $5.34, 47 passing; **62 loaded** (run 39082147619). The 11 left out are mostly business certificates
  on the shared pages 148-154 and two picks on the course availability table (pages 121, 127).
- **Hartnell (Coursedog PDF):** the catalog page fetches its PDF by script and links none, so a step that follows a
  link had nothing to follow. #2213: a PDF step may name its `file`; the read loads no page for it. The code finder
  already read the unspaced codes (`ABT90`, `STATC1000`); a test pins it. Procedure record v2 (execute_sql through
  `program_source_procedure_set`, receipt in `kb/receipts/`). 101 of 105 found in one load, $8.03, 8 passing (the lists
  print no units, so 88 are arithmetic incomplete); **68 loaded** (run 39082687082). The 33 left out: the picker took
  the course-set reference pages at the back (413-424) or a sibling option's page; several Computer Science and
  Information Systems options share one COCI title, and the extractor rightly refused. Coursedog prints each program's
  code (`AS.CISC`) in its heading: a pick by that code is the fix.
- **Dated reads:** a registry row's md5 is over the ten columns in their fixed order. Filed rows keep the order they
  were written in, and some put `catalog_url` before `catalog_year`, so a hash in file order reads 23 rows as drifted
  that are equal to live. All 111 equal in column order. **Build `d6cc1fde7ea3`: 15,647 programs at 111 colleges.**
- **A record file keeps its insertion order.** Re-dumping `registry_read.json` sorted turned a two-college addition
  into a 22,000-line diff; load, append and dump with the file's own indent.

## S409 SkyOcotillo (2026-10-17): Cuesta's wave, Cañada's robots-refused PDF, the Coursedog and SmartCatalog hosts

- **`f949e7c0ea35` applied:** 15,336 written (run 39066977901, its applied record on `main`).
- **Cuesta (#2210): 181 loaded unchecked** (run 39074969343; 183 of 198 found and extracted for $10.93, 161 passing, 2
  placing no listed course). Dated reads: registry md5 34bf89f9; MAP's 17 course codes by counts 8dd02db8 and titles
  7185f52a, in SQL and over the filed rows. Every other registry row re-read and equal live (108 of 108), so S408's
  drift check found nothing new. The read's SQL had stopped naming S408's five colleges; it names them and Cuesta now.
  **Build `ffd6929a4f90`, 15,517 programs at 109 colleges**, apply run 39078224767 dispatched from `main` at 23:14Z.
- **Cañada's 2026-2027 catalog sits behind the refusal.** Three free page reads (39066951859, 39075017243,
  39075421421) walked canadacollege.edu: the schedule page, the Catalog Archives (each recent year is a Catalog Rights
  page), and the Catalog Rights page, which links the 2026-2027 Catalog Rights PDF and the 10/12/26 addendum at
  `catalog.canadacollege.edu/current/_pdf-books/`. `/current/` is the path robots.txt refuses, so no procedure step can
  follow it. Sheet 92 card 1 asks Sam for `catalog-files` copies.
- **Coursedog (Hartnell, run 39077713662; Merced, 39077970234).** The catalog page's scripts fetch the program list
  from `app.coursedog.com/api/v1/cm/<school>/programs/search/$filters?catalogId=...` (Hartnell 100 programs, codes such
  as `AA.ADD`, `AST.AGR`) and a **whole-catalog PDF** from `pdf-reports/catalogs/<catalogId>`, stored on the vendor's
  public bucket (`coursedog-pdfs-public-prod.s3...`; Hartnell's 427 pages, generated 2026-08-21). The PDF prints each
  program as "Title - CODE", its type and degree, outcomes, "Complete ALL of the following Courses:" and "Complete at
  least 3 of the following courses:" with "• ABT90 - Soil Science" lines, and "Total Required Credits · 60". Course
  codes print **unspaced** (`ABT90`, `STATC1000`, `ART12A`) and the lists print no units, so the code finder needs that
  form and the units come from COCI. Merced (`catalog.mccd.edu`, 191 programs at `/programs/<code>`) is a custom domain:
  the page read's network capture keeps only the page's own registrable domain, so it showed none of the
  `app.coursedog.com` calls. Its PDF needs a read that prints vendor calls too.
- **SmartCatalog (Crafton Hills, run 39077713662).** The catalog front page links Credit Programs and Noncredit
  Certificates; Credit Programs lists one page per subject ("Accounting (ACCT)", 40 of them). No sitemap (404).
  Run 39077970234 followed two subject pages and read Taft's front page, but `get_job_logs` returns only a log's tail and
  the proxy refuses the log archive host: re-read those with a plan of their own.
- **The Exhibit Adoption UI pass (#2211)** shipped; its record is in the UI ledger. A `transition: all` on a control
  hid a focus ring that existed (noted in `/a11y-pass`).

## 2026-10-18 — Session 412 (SkyJoshua)

- `182e810e207d` applied: 15,651 written (run 39093644832, 67 minutes; the last apply took 61).
- Crafton Hills by the SmartCatalog walk: 229 pages, 64 of 79 listed programs found, all 64 extracted ($4.68),
  40 pass the machine checks (run 39093935031); load dispatched behind Taft's capture-only read.
- **A newer pending run in a concurrency group cancels the older pending one.** With one run active on `main`,
  dispatch the next only once the active one has started the queue's previous pending run; Taft's read was
  queued only after Crafton's had started, and Crafton's load only after Taft's started.

## S413 SkyPinyon (2026-10-18): Taft loaded, the slashed subject, build 3f93779f0115

- **The wave that turned `lints` green.** `tests/roep_display_test.py` counts every full-college record filed and loaded
  against the newest display receipt, so a college loaded without its display build holds `lints`, and with it `test`,
  red on `main` and on every PR. S412's #2219 could not go green alone; #2220 carried it plus the wave's build
  (`3a5ed5d7bcf3`, 15,770 programs at 113 colleges, applied in run 39103566945). A load and its display build belong in
  one PR, or the build follows the load before anything else merges.
- **Taft by the SmartCatalog walk:** 58 of 63 listed programs found (the capture-only read, run 39097700126), all
  extracted for $4.14 (run 39100858309), 24 passing the machine checks, loaded (run 39101990026). 34 fail arithmetic:
  most read the page's 60-unit degree total as the major's units (stated 60 beside 18 to 35 computed), the Palo Verde
  shape. A reread with the degree reading is the candidate.
- **A slashed course subject hid ten programs from their own pages.** Crafton Hills prints `CNA/N 621`, `MATH/N 600`,
  `KIN/D 130A`. The exact test read the slash (S408), but the coarse net that decides which pages reach it read
  `N 621`, so a page placing every listed course at coverage 1.0 was turned away. `CODE_TOKEN_4` adds the slash reading
  to the net's union, which can only admit a page, never refuse one. The state's file sometimes drops the slash
  (`ESLN601` for `ESL/N 601`, `CNAN626`), so the net reads both forms. A capture-only read measured it before any
  extraction: 64 found became 74 with the 64 filed kept unchanged (run 39103866118), then 76 with the slash-free form.
- **The scorer had the same blind spot.** Acute Care Nursing Assistant and Home Health Aide each counted one course
  twice, missing as `CNAN633` and invented as `CNA/N 633`. `listed_key()` maps a placed code to the listed code it names
  once the slash is set aside, for coverage, invented and the closed list's units. A scan of every filed record found 36
  with the same misreading: De Anza 15, Glendale 14, Los Angeles Trade-Technical 5, Crafton Hills 2. A filed record's
  coverage cannot be rescored without the run's page text and closed list, so the Crafton two were re-extracted with
  `force=43604,43611` (run 39108198761) and the rest wait on their college's next read.
- **Cancel a run that checked out the branch before the fix it needs.** A dispatch checks out the branch's head when it
  starts; a fix pushed after that does not reach it. The 07:29 run (on `eefd4235`) was canceled and one run on
  `f5c93856` both forced the two records and extracted Foundations under the fixed scorer.
- **Crafton Hills, end to end:** 76 of 79 listed programs hold records, 51 passing (was 64 and 40), $5.37 in all;
  Japanese is unfound (no page names it). The load (run 39109666980) inserted 12 and kept 64. Build `3f93779f0115`:
  15,782 programs at 113 colleges (#2222).
- **Cañada's 11 need a reader change, not a reread.** Its capture-only read (run 39103943654) found 73 of 75 and the same
  pages for every record, so nothing would extract; the business certificates sharing pages 148-154 and the two on the
  course availability table stay out until the PDF reader assigns those pages differently.

## Moved from the lane (S413 compaction)

**Outcomes (Sam, 2026-10-04 18:03Z):** grab published course and program outcomes, and compare harvested credential skills with course outcomes. 🔨 **Course outlines (Sam, 2026-10-12, `sam-capture-cor-system-link-2026-10-12`):** capture each college's course outline of record system link so the harvest reads course SLOs, for the skills match and for faculty assessment of CPL. Record shape 3, Sheet 70's rulings, the registry's `cor_*` fields, the census, the index and how each host prints its SLOs: lessons, *Moved from the lane (S376 compaction)* and *(S380 compaction)*. ✅ **`course_outcomes` is live** (Sam pasted `chatbox/supabase_course_outcomes.sql`, Open Asks Sheet 72 card 1; public read, insert-only `course_outcomes_load()` on the service role, a receipt per load). **Loaded, nine colleges, 7,450 courses, 20,891 SLOs** (live read, S388; by college: lessons, S398 compaction). `catalog=<slug>` in `kb/course_outcomes/.run` picks either form; each load is insert-only with a receipt naming its rollback. COBI shows the SLOs on Program records' course rows and in COCI Lookup (#2116, Sam 2026-10-14). The skills comparison waits for `kb/reference/industry_credential_skills.json` (not started).

## S414 SkyChamise (2026-10-18): the Coursedog reader (Merced), the slash rescoring, a second slash shape

- **A reconcile run rescores filed records for free.** `step=reconcile` (extract 0) captures the pages again and
  rescores each filed record whose page it read, so a scorer fix needs no model call. Glendale 37 to 43 passing (14
  replaced), De Anza 12 replaced, Los Angeles Trade Technical 5. A rescored record carries the reconcile run as its
  `extracted_run`, and `step=reread` posts only the newest run's records: **reread before any extraction on the same
  branch**, or the rescored records sit behind the newer run. Los Angeles Trade Technical's five had to be re-extracted
  with `force=` for $0.66 after its six new programs were extracted first.
- **A reconcile also rescores against everything the scorer learned since.** San Joaquin Delta's (run 39116289105)
  fixed its two target records and rescored 204 others under the degree-total check that arrived after its read: 152 to
  126 passing, 28 new arithmetic failures. Read a reconcile's summary before its reread; Delta is held.
- **A second slash shape:** Crafton Hills prints `THART/S 124X2` and the state's file stores `THART124X2`, the letters
  after the slash dropped. `listed_key()` tries that reading only when the slash-free one finds none, so `CNA/N 633`
  still reads as `CNAN633` where both are listed. A scan of every filed record found it at Crafton Hills (2) and San
  Joaquin Delta (2) only.
- **The Coursedog reader.** Merced's page POSTs `app.coursedog.com/api/v1/cm/<school>/programs/search/$filters` for 20
  programs at a time. Repeating the call from the browser context with only its content type answered **401** (run
  39114886505): the page's own call carries headers the replay lacked. A Playwright route that rewrites the page's call
  as it leaves (`limit=250`) and a response listener read all 191 at once; any further page is asked with every header
  the page sent (`all_headers()`). Each program's Requisites tab shares one template suffix (`requisites-ojrrt`), so the
  reader learns it from the first program's overview and loads the rest directly (181 of 188). The page's title names
  only the code, so the heading the matcher reads is the program's name plus its award in words (`(AA)` as *associate in
  arts*, `(CT)` as *certificate of achievement*). Capture-only 154 of 172 found, 95 at coverage 1.0 (run 39115547722);
  extraction $9.14, 125 of 154 passing (run 39117489616); 153 loaded (run 39119871201). Ten programs lost their pages to
  a sibling award naming the same list (Child Development A.A. to its certificates), eight found none (Diesel and
  Mechanized Agriculture print few listed codes).
- **Build `7e4a2a9c5ba7`: 15,946 programs at 114 colleges** (#2224).

## S415 SkyRedbud (2026-10-18): a printed degree floor (San Joaquin Delta), Cal-GETC's 34 (Taft), build 48cb66f19cff

- **Read the page before calling a rescore right or wrong.** Delta's 28 new arithmetic failures (S414) were the
  scorer reading "Minimum Degree Units Required: 60" as an exact total: an 18-unit major and GE 27-34 came short, and
  Nursing's 59.5 plus GE ran past 77.5. A four-page read (college-page-read 39122473643) showed the floor and the
  page's advice to double-count major courses toward GE. Four loads settled what the records alone could not.
- **A floor alone makes up a short sum.** The first step set `electives_fill_degree` from the floor's words, and the
  scorer's guard ("the record says electives fill the degree total, but the catalog text names no electives") failed
  15 records whose pages name none. `degree_verdict()`'s minimum branch now passes a short sum on
  `degree_total_minimum` alone, with `fill` naming the units; Delta's steps set only the floor. One record elsewhere
  reads differently on its next rescore: Orange Coast 10278 (37 + GE 18 under its minimum of 60).
- **A reconcile files what it set, and a later step never clears it.** The first run's `electives_fill_degree: true`
  stayed in the filed records, so the second run changed nothing for the 15. Reverting both filing commits and
  reconciling again from the clean records gave 154 passing (from 152), none lost; reread 39130341466 replaced 71.
- **Taft: Cal-GETC is the statewide 34.** Ten transfer degrees add up their major and name Cal-GETC with no units;
  Taft's own Cal-GETC page prints none (read 39122581817). Fable, asked once, chose a Taft step citing the figure
  over loosening the scorer (which would stop the degree check catching real misreads) or leaving the flag (which
  would never clear). The step cites Monterey Peninsula's GE page; 24 to 34 passing, reread 39128567443 replaced 17.
  Its card is on the sheet for Sam.
- **A reconcile step's pattern needs `\s+`.** The first Taft run matched nothing: the capture's text is innerText,
  and Taft's titles carry non-breaking spaces. The same words with `\s+` matched all ten. When a reconcile reports
  "0 filed records changed" and no unread pages, suspect the pattern's spacing first.
- **`gh run view --log` is refused here** (the log host answers 403); `get_job_logs` with `return_content` returns
  it, saved to a file when long. Parse its `logs_content` field.

## S419 SkyCottonwood (2026-10-18): Cañada's eleven, read from the catalog's own words

- **The eleven were extracted, not unfound.** `summary.json`: found 73, extracted 73, failed.coverage 11; the load kept 62.
  Each empty record's model note says the text held a sibling's section ("The provided text (catalog pp. 148-151)
  contains the AS Business Assistant degree but not the Certificate of Achievement"). The lane had read the 11 as
  unfound for two sessions; the records said otherwise. Read the records before naming a cause.
- **Read the pages before touching the picker.** A page-read plan (`kb/college_reads/canada_shared_pdf_sections.json`)
  printed the pages naming the sections' headings from the hand-filed copy (the census Reader fetches the GitHub
  attachment; the college's `/current/` is robots-refused). The first read's patterns allowed one space after the
  award's letters and the text carries two ("AS  Business Assistant"), so it printed two pages (run 39159401511);
  the second printed eleven (39159883287). Then the picker itself ran over the printed pages, before and after the
  change, for each program with its COCI list (`coci_program_courses`): four certificates moved to their own headings
  on the printed pages alone, and the tests were written from the catalog's text verbatim.
- **Three shapes, three readings** (`pdf_heading`, `_pdf_pick`). The award's letters before the title: p147's own
  legend reads "AS  Associate in Science Degree Program", "AS-T  Associate in Science Degree for Transfer", "CA  Certificate
  of Achievement", "CS  Certificate of Specialization: Not Transcript"; `AWARD_WORDS` read "AA-T" and "AS-T" and no bare
  "CA", "AS" or "AA", so a certificate's page and the A.S. page naming the same courses scored alike and the earlier
  page won (`PDF_AWARD_PREFIX`, at a line's start before a capitalized word; "As the student" names none). A title
  wrapped onto a short next line ("CA  Human Relations in the" / "Workplace", p155; "CA  Technical (Apparel Industry" /
  "Oriented)", p188): a next line of at most `PDF_WRAP_CHARS` (40) counts toward the title. A heading page whose list
  opens the next page ("AS-T  Mathematics 2.0" p215/216, "AA  Ethnic Studies" p183/184): the heading page named no
  listed code, so the course availability table that did (p127, p95) was read; a clean heading page now leads the run
  when the next page names listed codes, and the coverage test reads both.
- **Three stay out for COCI's reasons.** 05700 Business Administration A.S. lists one course, CIS 118; 05711 Theater
  Arts A.A. lists DRAM 300.1; 20440 Technical (Apparel Industry Orientation) lists FASH 195. Each is a one-course closed
  list the printed section never names, so the picker took the page that did (the course availability table, the
  Computer Science certificates). A COCI comparison finding, not the reader's. 20440's catalog title also says
  "Oriented" where COCI says "Orientation"; a stem would match where a word does not, and was left alone.
- **Political Science A.A.-T (32833)** names 4 of its 9 listed codes on its own page (p229) and 5 on the description
  pages the picker took (337-338); the list may continue on p230, which no read printed. The capture-only run tells.
- **The capture-only run is the verification** (`program-requirements-college.yml`, `extract=0`, on the branch; run
  39160718966): its `would_extract` names the programs whose page moved, before a model call is spent.

## S420 SkyTanoak (2026-10-19): Cañada's re-read landed, a Jev sitting over the failing records, the second reader ruled

- **The reader change paid as predicted.** `step=read` with `extract=1` on `claude/s420-canada` (run 39190086831) kept
  47 records filed from the same page and re-extracted the 26 whose page moved, for about $1.85 (21 of the 26 passing);
  `reread` replaced 17 rows and `load` inserted 8. Cañada's filed set holds 73 of its 75 listed programs: 56 pass, 17
  fail arithmetic, 3 fail coverage (COCI lists one course the printed section never names), 2 are unfound (Elementary
  Teacher Education A.A.-T, Cloud Computing). The headline moved from 11,621 to 11,630 complete.
- **A data PR carries its display build or lints fail.** `tests/roep_display_test.py` reads the committed display
  receipt against the branch's record folders: the Cañada PR failed it (run 39191885428) until `kb/_build_roep_display.py`
  ran on the branch and its two outputs were committed (build 3aa52b4afcb6). One display build per wave, on the branch;
  `step=display` on main applies it after the merge (run 39194711397).
- **The tail needs a different instrument** (Sam's question of ~02:33Z: is this the most effective way to the
  systemwide dataset?). The body of the corpus read at a college an hour; S419 spent a session on eleven records. Two
  judgment layers now sit over the failing records, both ranking and suggesting, neither writing: `kb/_jev_harvest.py`
  (a typed cause and owner per record, uncalibrated until a person's verdicts set a gate; `typesafe-smoke.yml` input
  `harvest=<college>`, the runner capturing the college first so Jev sees the page text), and the second reader Sam ruled
  on Sheet 97 at 03:11Z (Build with Grok; waits on the `XAI_API_KEY` secret; `xai-smoke.yml` proves it). KB note:
  `docs/kb-notes/methodology-a-harvests-tail-needs-a-different-instrument.md`.
- **Dispatch the runner's steps one at a time**: a second pending dispatch in the same concurrency group cancels the
  first (`actions-newer-pending-cancels-older-pending-2026-10-18`). Read, reread, load each waited for the one before.

### Moved from the lane (S420 compaction)

**The code finder reads a run of numbers after one subject** ("BUSAD 101, 106, 120") and a kerned three-digit number
(#2206); **the code net and the scorer read a slashed subject** (`CNA/N 621`, and the slash-free `CNAN626` the state's
file sometimes stores, #2222; the scorer also reads `THART/S 124X2` as the state's `THART124X2`, S414). **The scorer has
six readings of catalog text** (flat, the line-end hyphen two ways, the spaced hyphen, stand-in ligature glyphs, a list
marker at a line's end, #2207). **Cañada's eleven (S419):** the 11 records the load left out placed no listed course;
the catalog heads each section with the award's letters ("CA  Business Assistant"), wraps a long title onto a short next
line, and opens a list on the page after its heading, and `pdf_heading()`/`_pdf_pick()` read all three
(`PDF_AWARD_PREFIX`, `PDF_WRAP_CHARS`; 276 checks). Three stayed out because COCI lists one course the printed section
never names (Business Administration A.S., Theater Arts A.A., Technical (Apparel Industry Orientation)): a COCI
comparison finding. Its capture-only read (S413, run 39103943654) had found the same pages, the business certificates
sharing pages 148-154 and two on the course availability table.


## S421 SkyTupelo (2026-10-19): the second reader built, three Jev sittings read, Cañada's Cal-GETC step and the six-row rollback

- **The second reader is one dispatch away (#2246).** `program-requirements-extract` version 11 takes `provider`
  (`anthropic` or `xai`): the same system prompt, user message and record schema go to xAI's chat endpoint with the
  schema as `response_format`, the model is `XAI_MODEL` or the body's, never a guess, and the key is scrubbed from any
  error. `kb/_second_reader.py` reads a college's failing records only from the capture's page when it is the page the
  first reading came from (the S403 guard), scores the second reading with the one scorer and compares on
  `requirements_md5`; `second-reader.yml` captures, reads and uploads the comparison. The key is a function secret, per
  Sam's call 6 on sheet 23: the repo secret `xai-smoke.yml` reads only proves the key, and at 04:05Z it was unset.
- **Jev's cause is reliable; its owner is not.** Three sittings (Cañada 22, Taft 24, Delta 49 rows; no errors; seconds
  each after the free capture) and a session's verdicts beside every row in `kb/jev_harvest_verdicts/`. Where the
  record's own notes settle it, Jev's cause held on 16 of 16 at Cañada and 15 of 21 at Taft (Delta: cause held on 17 of 49 (12 agree, 5 owner differs), and 29 of the 32 misses are one shape: Delta prints every total as a floor and the record's sum is a range whose low end meets it, so a scorer floor rule for the program total clears them).
  Its misses have a shape: `excerpt_cut` where the text belongs to another program, `record_right_check_misfires` where
  the extraction dropped a total the page prints. The owner leans wrong the same way everywhere: the scorer or the
  extraction for a figure a college's procedure step supplies, or a page the reader cut. Read the owner as a hint.
- **A verdicts file turns a sitting into a worklist.** Grouping the rows by cause found one fix for five Cañada rows
  (Cal-GETC's units) and one for two Taft rows (the local GE pattern). The record's notes quote the page, so a session
  settles most rows without the page; the rest say what the page would need to show.
- **A reconcile step for a transfer-only figure must say so.** The first Cañada run set Cal-GETC's 34 on 26 records:
  twenty transfer degrees and six local A.A./A.S. whose captured page spans the sibling transfer section (Earth Science
  A.S. 30427 then failed at 64 past 60). `awards_match` gained `transfer`; `tests/program_requirements_reconcile_test.py`
  pins it. Cañada's step cites Cañada's own GE page ("California General Education Transfer Curriculum (Cal-GETC) - 34
  units minimum", page 79 of the hand-filed PDF) where Taft's cites Monterey Peninsula's.
- **A cancel does not beat a reread already posting.** The reread dispatched on the wrong fills was canceled at
  checkout by the clock, yet its receipt landed: 26 rows replaced. The receipt's before-images were the rollback:
  a fresh live read (all six exactly as the write left them), the receipt's own SQL cut to the six, through
  `supabase-migrate.yml` because the Supabase guard holds an UPDATE from `execute_sql`, a rollback receipt beside the
  original (`kb/receipts/program_requirement_records_rollback_ca_ada_six_local_2026-10-19_s421.*`), verified live.
  Dispatch a reread only after the filed records are what they should be.
- **A PDF page read needs a span and the page after.** Keying on Cal-GETC spent the 14-page cap on the front matter;
  keying on headings printed the heading pages, and every requirement block sits on the page after its heading.
  `pdf_span` and `pdf_after` in the plan (three checks in `tests/college_page_read_test.py`). The catalog's own
  wording came on the third read: "Completion of Cal-GETC (California General Education Transfer Curriculum)" closes
  every Cal-GETC transfer block; Environmental Science AS-T prints CSU-GE for STEM 33 or IGETC for STEM 31 instead.
- **Runs this session:** Cañada reconcile 39200870107 (reverted), reread 39201778849 (its receipt the rollback's source),
  migrate 39202436931, reconcile 39202270482 (20 transfer records), reread 39203273818 (20 posted, 20 replaced), display
  build 3d92deb7a816 (#2247; `step=display` on main run 39204942046), sittings 39197675380, 39204968617, 39206690775.
  Cañada's failing records: 22 before, 17 after. Headline 11,630 to 11,635 complete.

### Moved from the lane (S421 compaction)

**A PDF catalog step may name its file** (`file` in place of `follow`, #2213), for a catalog page whose scripts fetch the PDF (Coursedog). **A Coursedog PDF is read by its "Title - CODE" headings** (`Biology - AS.BIO`; `pdf_code_assign()`, #2216): a program no heading names reads from no page. **A kept record must come from its source's page** (`filed_from()`, #2216): a reconcile run files fresh sources beside records it did not move, so test a reader change with a capture-only read (`extract=0`), never a reconcile. **A page read may keep a named vendor host's data calls** (`network_hosts`, #2216).

**The readers:** CourseLeaf's sitemap road, which also reads an own-HTML catalog (`custom_html`) kept to its registry address's year segment (`year_scope()`); the curriQunet, eLumen and Acalog readers; the Coursedog reader (S414: the page's own program search call, its limit rewritten by a route, then each program's Requisites tab); and the whole-catalog PDF reader, which a procedure catalog step points at the PDF a catalog page links, carrying the file's year (#2202), and which prefers a clean heading or the control number (#2203).

**Parked for the reader:** Diablo Valley, Santiago Canyon, Sierra, Foothill, San Jose City, MiraCosta, Orange Coast's 27 empty records, Reedley, Palomar, Ventura and Oxnard, and CCSF's 53 skipped records (lessons S407).

## S422 SkyWillow (2026-10-19): San Joaquin Delta's three scorer readings, Taft's two GE patterns, Sierra Training's UI pass

- **A verdicts file names the fix, and one fix can clear a college.** S421's reading of Delta's sitting said 29 of 32 misses
  were one shape. Three scorer readings, each from the page's own words, took Delta's live rows from 154 to 195 of 202
  passing (#2250): the program total read as a floor (`total_units_minimum`, set by a reconcile step on "Minimum Units
  Required: N" and "Minimum Major Units Required: N", passing a sum whose low end meets it and nothing else), a
  per-college `prefix_aliases` map (ANTH, ENGL, ARTH and COMM printed where the state file keeps ANTHR, ENG, ART and COM
  ST; the scorer renames on its own copy, and never a code the file lists as printed), and a noncredit page printing only
  "Total Contact Hours: N" (equal, `total_only`, only when every hours figure on the page is that total). The eight left
  are the extraction's: 07304's double-counted electives, 16764's waivable piano block, 22244's unrecorded math, 45621's
  area minimums, 11970's course-less GE areas, 19752's GE page, and 05630 and 44197 (a certificate total that counts GE;
  a course taken four times).
- **A new status string breaks consumers; a flag does not.** `program_record_machine_pass` (SQL), the tab, CPL Pathways
  and the display build accept only `equal` and `unstated`. A new pass shape is `equal` plus a flag (`minimum`,
  `within`, `total_only`), the way the degree check already does it.
- **A new record field reaches the confirm-carry basis.** `program_record_carry_basis` strips the figures a reconcile
  sets, so a person's confirm survives a reread; `tests/program_requirements_college_test.py` fails when a reconcile
  field is missing from it. The basis change went live through `supabase-migrate.yml` after checking the live function
  bodies matched the file (md5 of `prosrc`).
- **Two reconciles in a row leave two run stamps; reread posts one.** Each reconcile stamps the records it changes with
  its run, and `step=reread` posted only the newest run's seven. `reread --extracted-run` (the workflow's `force` input on
  a reread) posts a named run; the function's guards still decide each row (195 replaced, 0 held). Better: put every
  scorer change on the branch before the first reconcile. A reconcile checks out its dispatch commit, so a later push
  needs a later run; cancel and redispatch while the capture is young.
- **Taft's catalog prints two local GE patterns.** Three free page reads: the GE philosophy page states "General
  Education Requirements (27 units – one course from each category)", and the Other Associate Degrees page says the CTE
  degrees, Energy Technology and Occupational Safety and Health among them, "follow the local general education pattern of
  only 18 units". No page words the 60 as a minimum, and neither A.S. page names a GE figure. With 18 the sums are 36 and
  53 against 60; only Title 5's floor and unnamed electives would pass them, which is also what a dropped block looks
  like (Fable's advice: cite the catalog's word for a floor or leave the record failing). No step was built (#2249); the
  27 and 18 are a catalog disagreement for the college.
- **The UI pass's sweep had never seen Sierra Training** (#2251): the signed-out cobi route paints the First Light
  greeting over a sign-in note. A reviewer seed with synthetic rows for the six reads measures the tab; it was clean
  before and after the conversion to underlined words.
- **Runs this session:** Taft page reads 39215793482, 39216772779, 39217374801; Delta reconcile 39216608232 (canceled:
  checked out before the alias commit), 39217405432, 39220195737; migrate 39216602991; reread 39223153428, 39223682919;
  display build 5da99b0af549. No model spend.

### Moved from the lane (S422 compaction)

**Sam's sheet 29 (2026-10-04):** Sierra says "required", names each choose block and gives the printed total for a checked program, citing the catalog and its year (live, smokes 7l and 7q).

**Sam's sheet 32 (2026-10-04):** a program shows "up to" plus the recommended path's figure, each course carries CPL in three kinds (articulated here, could adopt, for consideration), and catalog-and-state-file differences go to the college as drafts on the harvest tab and My College while the MAP team sends. Verbatim: lessons, *Moved from the lane (S386 compaction)*.

## S442, the routine's run beside Sam's SkyManzanita (2026-10-21): the Ventura district's campus letter

- **Two sessions ran as S442 on one queue.** The routine's 11:15Z firing found no open PR newer than 10-19 and no
  `list_sessions`, and Sam opened SkyManzanita by hand about the same hour. Both worked the harvest's thin list; both
  read Oxnard's host within the hour, and each display job wrote its own build (bf781cf0cd22 for Reedley, 8d733f684f83
  for the three Ventura colleges) over the same rows in the same window, leaving a mix. A build from `main` after both
  merged, applied once, settled it. A session with no `list_sessions` reads `main`'s commits again before each
  display dispatch, not only at the start.
- **The old reader's capture and the new one disagree on Oxnard:** SkyManzanita's free capture read it "exactly as
  before" (reader work); with the campus-letter fix it found 120 of 132 (94 before).

- **A tab the filter cannot read as naming a course is dropped before any check sees it.** Moorpark's Animal Care and
  Training A.S. took its own page at title 1.0 yet read 0 of 42 listed courses. Page read 39595155181 printed only the
  Overview; with `"expand": true` (39595760314) the REQUIREMENTS tab printed `ANCT M01A`, `ANCT M09` ... The Ventura
  district letters each number by campus (M, and R and V at Oxnard and Ventura). `SUBJECT_TOKEN` took a number to start
  with a digit or Coastline's C, so `hidden_tabs_text` dropped the panel as the search dialog, and the capture fell
  back to textContent, where each code runs into its title (`ANCT M01AAnimal`) and no pattern ends. Any one letter may
  now lead (#2309; guard in `tests/program_requirements_pilot_test.py`, failing without the fix).
- **Moorpark after the fix:** capture-only 39596973339 found 144 of 145 (99 before; 106 at coverage 1.0, 57 before),
  one page claimed (39 before). Extraction 39600815599: 144 extracted, 100 passing (31), $10.40. Load 39605787602
  inserted 83 and kept 52; reread 39606457885 replaced 1. Display build c45da149b72b, 16,606 rows.
- **Golden West's re-read with today's reader (39591103370) found the same 81 pages as S395.** Its gap is the catalog's
  shape: 43 programs' only pages are department pages (Automotive Technology's nine certificates, Accounting's three)
  or the General Education page, and 29 have no course list in the state's file. A reader change there is a
  department-page reader, not a code fix.
- **Read the thin list for a shared cause before a college's own.** Moorpark (34%), Oxnard (49%) and Ventura (55%)
  sat on one host and one numbering habit; one fix reaches all three.

## S440 SkyChaparral (2026-10-21): three colleges no list named, Santa Monica's 40-minute PDF, Taft 38661 gone

- **List the thin colleges live before picking the next one.** The parked list named eleven colleges; a live read of
  active COCI programs against records (under 60%) found three more with almost nothing filed and no note saying why:
  Santa Monica (1 of 254), Irvine Valley (1 of 166) and West LA (4 of 233), each holding only its pilot rows. None
  had ever been read by the college pipeline.
- **One run waits per branch.** `program-requirements-college.yml` groups runs by ref with cancel-in-progress off, so
  a second queued run replaces the first pending one: three dispatches in a row ran the first, canceled the second
  (Santa Monica, run 39527753004) and queued the third. Queue the next run only when nothing is pending.
- **A dispatch checks out the commit the branch held when it was sent.** A display dispatch sent in the same breath
  as a build commit (the commit failed on a staged path) was pinned to the old build (run 39553230693, canceled
  before it started). Push, confirm the head, then dispatch.
- **A slow PDF is a wait, not a refusal.** Santa Monica's catalog link answered 200 and its 472-page, 14.5 MB PDF did
  not finish in 600 s (run 39536186746). A page read (39538245162) showed the HTML catalog links no page per
  program. Sam raised the ceiling to 2,400 s (`CATALOG_PDF_WAIT_MAX_S`, guard in `tests/program_requirements_pilot_test.py`)
  and the procedure record names 2,400 (`program_source_procedure_set`, receipt
  `kb/receipts/program_source_procedure_smc_pdf_wait_2026-10-21_s440.sql`); the rerun (39548766337) found 239 of 240.
- **A removed row takes its filed record with it.** Build 5f9939404fcf still carried Taft 38661 from
  `kb/program_requirements_college/taft/records/`, and its display job (39548756872) wrote 16,301 rows and reported
  38661 missing. Removing the file and rebuilding (772abb3ddebe) clears it, as Hartnell's re-read did.
- **Taft 38661 (Sheet 98 card 1):** the auto-mode classifier refused the receipt and delete file twice, with and
  without Sam's go, so Sam ran the guarded delete himself (md5 6b5e44f66a545875fe54b89c8a9d5469, unchecked, no
  verdicts). No copy of the row is committed.
- **Counts:** West LA 214 of 228 found, 214 extracted, 173 passing, $14.97, load 39539613701 inserted 195 and kept 4;
  Irvine Valley 144 of 146 found (curriQunet, 78 minutes of capture), 122 passing, $11.02, load 39548442445 inserted
  143 and kept 1. Both were already in the dated reads (pilot colleges).

*S424 and S423 moved verbatim to `program_requirements_harvest_lessons_archive_3.md` (S455).*

## Moved from the lane (S423 compaction)

**Cañada (S419-S421, #2241, #2244, #2247):** the picker reads the catalog's three heading shapes; 73 of 75 listed programs filed; its reconcile step sets Cal-GETC's 34 on transfer degrees only, cited from the catalog's own GE page (lessons S421); 17 records fail a machine check; display build 3d92deb7a816 applied on `main`. **A reconcile step for a figure a local degree never carries reads transfer degrees only (`awards: transfer`, S421):** a local degree's captured page can span the sibling transfer section. **Verify a reader change on the catalog's own words before any dispatch** (`kb/college_reads/`; a PDF plan takes `pdf_span` and `pdf_after`, S421). **San Joaquin Delta (S422, #2250):** the program total is a floor (`total_units_minimum`), its catalog's subject prefixes alias the state file's (`prefix_aliases`), and a noncredit page printing only its total hours passes as `total_only`; 195 of 202 live rows pass (154 before); the 8 left are the extraction's. **Taft's local degrees (S422, #2249):** the catalog prints a 27-unit local GE pattern and an 18-unit one for CTE degrees, and no page words the 60 as a floor, so no step; 16725 and 36928 stay failing.

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

## S486 SkyQuince (2026-10-26, the CPL Queue routine): Hartnell's double-count words read as the overlap

- **A page's own words carry a ruling past the case it was made on.** Sheet 82 card 2 allowed the overlap for transfer
  degrees because Cal-GETC was the case in front of Sam; Hartnell's tabs state the same rule for local degrees ("Students
  can double-count required courses and courses for General Education."). The reconcile `set` step records it as
  `ge_overlap: true` (the kind already took a boolean, `degree_total_minimum`), and `degree_verdict` reads it beside
  `transfer_degree`. Reconcile 40285320209 (free) and reread 40287110123: Vocational Nursing 39248 (80-89 against 63),
  Addiction Studies 19718 (63 against 60) and Agricultural Mechatronics 43809 (70-79 against 60) pass; Hartnell 76 to 79.
- **A new reconcile field joins the confirm carry basis.** `tests/program_requirements_college_test.py` requires every field
  a step fills to be one `program_record_carry_basis` leaves out, so the function changed with the step (supabase-migrate
  run 40285298395); otherwise a confirmed record would lose its confirm on the next reread for a flag alone.
- **The transfer tabs print the same words**, so the step re-filed 52 transfer records with the flag and no verdict change.
  As in S484, every record whose verdict stood was restored before `step=reread`, which then posted three.
- **The display build needs openpyxl** (`python3 -m pip install openpyxl`; the bare `pip` here installs to another
  interpreter). Build 8052e240575a changed only the build stamp in `cpl_pathways_roep_data.js`.

## S485 SkyElderberry (2026-10-26, the CPL Queue routine): Hartnell's last hours and its degree failures, read

- **Where a vendor gives no figure, the record stays incomplete.** Page read 40278795148 (`network_find` on the codes):
  TAC326, BUS690 and BUS699 carry only `creditHours` 0 and `billingHours` 0 under `credits`, no `lectureHours` or
  `labHours`. The `contactHours` the answer prints belong to the instructional methods (lecture 18, lab 108 a term), not
  to a course. Subtracting the other courses from the tab's total would make the check pass by construction, so neither
  44161 (630) nor 44574 (432) is filled.
- **The page reader's live run status lags.** `list_workflow_jobs` showed checkout "in progress" for twelve minutes on a
  run that finished in a minute and a half; the logs answer 404 until the API catches up. Read the logs again rather
  than wait on the step list.
- **Hartnell's degree failures are structure, not misreadings** (page read 40279150362, three tabs). Both nursing tabs
  print "Students can double-count required courses and courses for General Education.": the overlap Sam allowed for
  transfer degrees (Sheet 82 card 2), stated by the page for a local degree. Vocational Nursing 39248 (80-89 against 63)
  passes once the scorer reads it. RN 03570 names no whole Local GE pattern: its general education is the prerequisite
  list plus "Local GE - Area 6". B.S. Respiratory Care 44537 prints 120, which includes the A.S. a student holds to be
  admitted. General Studies 17912 splits one 18-unit choice into eleven subject lists. No change shipped: one record
  passes on the overlap step, and the step rides Hartnell's next reconcile.

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

## S446 SkyMadrone (2026-10-22, the CPL Queue routine): a degree-and-certificate address, 91 records, the page-claimed that remain

- **A degree-and-certificate address names both awards (#2345).** Grossmont addresses a degree and its certificate
  on one page (`law-enforcement-as-certificate-achievement`, `arabic-aa-certificate-achievement`). The capture view
  (page read 39750446541) shows one list under "Associate Degree Major Requirements", then "Certificate of
  Achievement" and "Any student who chooses to complete only the courses required for the above major qualifies for a
  Certificate of Achievement". `SLUG_AWARD` read the certificate alone, so the A.S. scored no award on its own page
  and lost it. `SLUG_DEGREE_CERT` and `slug_awards()` read both awards. Grossmont's free capture went from 139 found
  and 15 page-claimed to 144 and 10. Main's captures held the shape at two colleges: Grossmont 9 and Pasadena City 7.
- **Palomar's 45 that remain have no catalog entry of their own.** Its curriQunet catalog lists 235 entries for 342
  programs in the state file. The pages they lost belong to siblings, and the titles drifted ("Web Design and
  Development" is now Web Front End Design; "Fashion: Buying and Management" sits under Fashion Merchandising), or
  the program is no longer listed. Reading no page is right for them, and no reader change applies.
- **The new rules did not move three of the four colleges named next.** Free captures under #2337 and #2339:
  Mt. San Jacinto 99 to 100 found and 25 to 24 page-claimed (its losers fall back to the general education or C-ID
  chart page because their own page was never found, 28 not found); Santa Barbara City 249 to 248 and 20 to 21 (its
  Administration of Justice pages were never captured). Neither is a sharing fault. Saddleback's capture was still
  running at the checkpoint.
- **Loads and rereads.** Palomar 282 found (from 224), 254 passing (from 196), $18.76; 62 inserted, 1 replaced by
  the reread. MiraCosta 142 (from 119), 98 passing (from 80), $11.96; 21 inserted, the reread replaced none (the
  extraction re-wrote only its 21 new records). Grossmont 144 (from 139), 97 passing (from 93), $10.61; 5 inserted.
  Pasadena City, the other college main's captures named with the shape: 296 to 297 found, 238 to 242 passing,
  $20.91; eight programs moved to their own degree-and-certificate page (Dental Assisting A.S. had read a sibling's),
  3 inserted, 5 replaced by the reread. Build 1b3616641146 (the first three, 17,390 rows) applied on the wave branch
  (run 39757574337); build 0ad3c75bfa19 (17,393 rows) supersedes it and applies on `main` after #2346 merges.
  Receipts are under `kb/receipts/`.
- **A display job's Applied record cannot carry a PR to merge.** The bot's commit becomes the head, and its test run
  stops at `action_required`, so no test has run on that head. Run `step=display` on `main` after the merge (the
  S420 order) whenever main has not moved, rather than holding the PR for a base merge that is not there.
- **A capture-only run's push can lag the run's "completed" state by a minute.** Read the branch head again before
  concluding that a run filed nothing.
- **The UI pass, CPL opportunity visual (#2344):** the page painted no `h1` until a college loaded, and at 360px the
  picker's longest college name widened `main`'s grid track past the viewport (`minmax(0, 1fr)` now). A dark target
  joined `a11y.config.js`.

## S445 SkyCurrant (2026-10-22): a shared page per heading, MiraCosta's degree lists, Palomar's "Cert. Achievement"

- **Read the capture's own text before changing a reader.** No capture keeps the text it read, so a page read with
  `"capture_view": true` (#2336) runs the pilot's `PAGE_JS` and prints innerText plus the hidden tab panels line for
  line, a run of blank lines as one "(blank)"; since #2341 it also prints each tab panel the capture leaves out. The
  first view (39718674469) showed MiraCosta's certificates headed exactly as the two-line rule expects: the text was
  sound and the fault was in the sharing.
- **A shared page goes to each section heading's claimant (#2337).** `page_winners()` grouped sections by award kind
  and kept the claimant the page HEADING named most fully, so a discipline page heading six certificates kept one
  (Horticulture went to the A.A. sharing "Horticulture"; 15 of 16 claimants read no page). `section_match()` now
  records the heading each claimant reads (of several, the one whose own words its title names most fully,
  `heading_fit()`) and each heading keeps its fullest-named claimant. Free captures: MiraCosta 68 to 122 found,
  Foothill 144 to 185, Citrus 148 to 178, Sierra 81 to 92, Orange Coast 242 to 277; Palomar unchanged.
- **A loser's fallback must name it.** Sierra's first capture on the new rule put Mathematics A.S.-T, after it lost
  eleven pages, on the Nursing page at 0.50. A program that lost a page now takes a later one only when the page
  names it at least halfway, carries 80% of its courses, or heads its section.
- **MiraCosta's degrees are certificates plus general education.** Its Degrees tab lists each degree by title and
  says "Students may earn one of the above-named associate degrees by completing a certificate of achievement and
  the general education courses" (Computer Studies: "its respective certificate of achievement requirements"). A
  listed degree reads its certificate's section; the tab names no course, so `hidden_tabs_text()` keeps it only for
  that sentence. A listed line that IS the title outranks a two-line pair that only contains its words
  ("Associate in Arts Degrees" + "Child Development Associate Teacher" had taken Child Development Teacher's).
  "Cybersecurity" heads Cyber Security; a transfer degree's heading spans "Associate in Arts Degree" then
  "Psychology for Transfer" (#2342).
- **Palomar heads a degree-and-certificate page "Accounting - A.S. Degree Major/Cert. Achievement".** `AWARD_WORDS`
  read the A.S. and not the abbreviated certificate: 63 A.S. kept `-AS-CA` pages, 2 certificates did, and 60 of
  its 82 page-claimed certificates had their own page among the ones they lost (#2339). The other 22 never had
  their own page as a candidate.
- **Extraction re-extracts every found program** (confirmed: MiraCosta 119 for $10.02, Foothill 185 for $14.82,
  Citrus 175 for $11.56, Sierra 92 for $8.48, Orange Coast 274 for $19.44). Passing: MiraCosta 41 to 80, Foothill
  97 to 138, Citrus 122 to 145, Sierra 57 to 66, Orange Coast 138 to 189. Loads inserted 185 (49, 43, 26, 12, 55);
  display build 82d6298a0c67 (17,116 to 17,302 rows).
- **A GE page as a candidate costs extraction, not data.** 69 filed sources statewide read a GE page, about a dozen
  of them GE certificates; live, 16 loaded records come from one, 15 of them GE certificates. The load's
  other-program's-page rule keeps the majors out.
- **The handoff's page-claimed counts can be stale.** It named Ventura and Moorpark 39 and Oxnard 31; main's
  captures said 5, 1 and 10 (S442's re-reads). Tally `capture.json` across colleges before choosing the next.
- **`check_generated.sh | tail` hid a stale dependency map again** (S443's lesson); run it bare, every push.
- **MiraCosta, after #2342 (capture 39734514856):** 119 to 142 found, page-claimed 31 to 8. **Palomar, after #2339 (capture 39731740658):** 224 to 282 found, 103 to 45 (23 A.S., 21 certificates and 1 A.A. remain; 22 of those certificates never had their own page as a candidate).

### Moved from the lane (S445 compaction)

**S444:** Golden West (79) and Imperial Valley (42) loaded; department pages are candidates, a section heading may span two lines (Sierra 35 → 81 found, MiraCosta 29 → 68, its discipline pages still lose siblings); 37 Program Mapper hosts recorded (#2330).

## S444 SkyBlueOak (2026-10-21/22): the page-claimed sweep, department pages, two-line headings, Program Mapper

- **Golden West and Imperial Valley loaded** under the section-per-award rule (#2331). Golden West: extraction
  39688079435, 135 extracted for $8.72, 102 passing; load 39691321331 inserted 79, kept 50, skipped 6. Imperial Valley:
  free capture first (found 84 → 131, page_claimed 49 → 8), extraction 39691376155, 131 for $8.02 (an extraction run
  re-extracts every found program, never only the new ones), 109 passing; load 39694352034 inserted 42, kept 83,
  skipped 6 as another program's page. Display build 4bcc9b504482 (16,917 → 17,038 records). Foothill (#2326) merged
  after a main merge started its CI.
- **A general education page as a program's only candidate means the program's own page never reached the reader.**
  121 of 648 page-claimed statewide named only a GE page (Sierra 47, MiraCosta 43, nine colleges with 1 to 6). The fix
  was never at the GE page.
- **A department or discipline page names no program in its path.** Sierra (`/departments/psychology/`, no sitemap,
  its index fallback read 3 pages) and MiraCosta (`/disciplines/psychology/`) print each award in a Degrees tab;
  `PROGRAM_PATH` kept neither (page read 39698876304). Where the link search had reached a MiraCosta discipline page,
  coverage was 1.0. Now a candidate (the department index itself is not).
- **A department page holds many awards, and its heading spans two short lines.** Sierra: the title, then "AS Degree"
  (no periods); MiraCosta: "Certificate of Achievement", then the title (page read 39704788066, from each department's
  PDF, which prints every tab). `section_award()` reads two adjacent short lines; the award pattern still tests one
  line alone, so an anchored "AS Degree" holds. Captures: Sierra 35 → 81 found, page_claimed 47 → 36; MiraCosta 29 →
  68, page_claimed 43 → 82: its discipline pages (Horticulture 11 claimants, Computer Studies 17) still give one
  claimant the page. Next look: the text the capture keeps from MiraCosta's hidden tabs (`textContent` may run the two
  heading lines together). Sierra extraction 39709837031: 81 for $7.28, 57 passing.
- **One college per page-read plan.** `college_page_read_test` (lints) holds a plan to one college's domain; a plan
  reading two colleges' PDFs failed CI until split.
- **Program Mapper (Sam, 2026-10-21, pasted programmapper.org/ppm-schools; non-CCCs set aside).** 63 community colleges;
  the registry held a map host for 26. A guarded UPDATE through `supabase-migrate.yml` (the repo's guard holds an
  UPDATE from the session) wrote `sequence_host` and `sequence_note` on the 37 empty rows (run 39689748697, #2330); the
  census never writes those fields. Six list a second host for a mapper that refused the reader (Cañada, Canyons, Las
  Positas, LA Harbor, LA Mission, Oxnard): not written, since asking it retries a refusal another way. Every mapper
  host reached so far answers 403; the list names each college's account manager, so one request to the vendor could
  open the maps for all 63. That ask is Sam's.
- **Blocked catalogs, on Sam's ask:** the Procedures view's closed card says *Catalog blocked (robots.txt), read from a
  hand-filed copy* or *needs a hand-filed copy*, with a Show filter and two glance counts (#2328). Eight catalogs block
  the reader; all eight read from Sam's hand-filed copies. The Catalogs view now names a 404 address.

### Moved from the lane (S444 compaction)

**S440 (#2306):** Santa Monica, Irvine Valley and West LA loaded (a PDF may wait 2,400 s). **S442 (two runs):** Reedley 196 of 200 found, 159 loaded; a number led by a campus letter (the Ventura district's ANCT M01A) now keeps its Requirements tab (#2309), so Moorpark, Oxnard and Ventura re-read, 100, 86 and 121 passing. **S443 (#2322):** a page heading a section per award now serves each sibling: Foothill 116 → 144 found, 97 passing, 29 loaded; Golden West 81 → 95 on capture (extraction next); Palomar unchanged (its own reader look); 842 page-claimed statewide is the next sweep (lessons S443).

## S443 SkyToyon (2026-10-21): a page heading a section per award serves each sibling; Foothill loaded

- **Page-claimed was 842 programs statewide** (Palomar 103, Foothill 73, Imperial Valley 49, Sierra 47, Golden West 43).
  Foothill prints a program's A.A. and its certificates as sections of one page under the banner h1, so the label named
  no award and `page_winners()` gave the page to one claimant. `section_award()` (#2322) reads a short line naming the
  award and every title word, or, for an A.A./A.S., Foothill's generic "Associate Degree Requirements" beside its
  Award Type(s) line ("AA = Associate in Arts Degree"); when two or more awards head sections and the label names none,
  each award's fullest-named claimant keeps the page. The extraction already reads by award (`section_heading`).
- **Read the page before you trust a capture.** The first cut matched nothing on Foothill (run 39654813908): the degree
  heading carries neither award nor title, and a page read joins short lines with " · ". A free page read (run
  39657323731) showed both; the second capture moved Foothill from 116 to 144 found.
- **A hub page lists degrees it does not hold.** Golden West's Physics page lists "Computer Science, Associate in
  Science Degree", and Computer Science A.S. took it at 67% coverage, the physics it requires (page read 39666262949).
  Guard: a section on a page whose label does not name the program at least halfway needs 80% of its listed courses.
  Golden West then read 81 → 95 found, page_claimed 43 → 29 (run 39667910648).
- **Palomar did not move** (224 found, 103 claimed, run 39661015658): its pages print awards another way. Reader work.
- **Foothill:** extraction 39671107254 re-extracted all 144 for $11.85 (97 passing, from 73; no earlier record lost its
  pass, 2 gained, 22 of 28 new pass); load 39675671980 inserted 29 and kept 97 (receipt
  `kb/receipts/program_requirement_records_college_foothill_39675671980.json`, rollback inside); display build
  33f68a1257d9 (16,917 records).
- **Pipe hides a failure:** `check_generated.sh | tail` returned 0 on a stale dependency map; run it bare.

## S442 SkyManzanita (2026-10-21): six colleges captured again, Reedley loaded, CPL Pathways' college line

- **A free capture first says whether a reader improved.** The live list of thin colleges (active COCI programs
  against records, under 60%) named Sierra, MiraCosta, Reedley, Golden West, Foothill and Oxnard, each read once
  between 2026-10-15 and 10-17. A capture-only read of each (`extract=0`, one branch a college,
  `claude/harvest-<college>-s442`) writes `capture_preview.json` and leaves `capture.json` alone, so compare the
  preview with main's capture. Reedley's curriQunet read went from 36 of 200 programs with a closed list found to 196;
  the five CourseLeaf colleges captured exactly as before (Sierra still reads 3 pages and falls back to the index;
  Foothill 73 and Golden West 43 programs claimed by another program's page; MiraCosta 89 not found). Their gaps are
  reader work, never a re-run.
- **Reedley:** extraction run 39616074283, 196 extracted, 167 passing the machine checks, $11.18 under the $40 go;
  load 39622476849 inserted 159 and kept 36 (receipt `kb/receipts/program_requirement_records_college_reedley_39622476849.json`,
  its rollback inside); display build bf781cf0cd22 on the branch, display job dispatched.
- **The thin list on 2026-10-21 (~14:00Z):** no records at Diablo Valley, Santiago Canyon, North Orange Continuing
  Education and San Jose City (parked for the reader); under 30% at MiraCosta, Sierra, Reedley (before its load),
  Skyline and Golden West; Skyline's ceiling is COCI itself (a closed course list for 58 of 144 programs);
  Canyons' missing 100 are noncredit programs its credit catalog does not carry.
- **The name on screen is CPL Pathways (Sam, 2026-10-21: "Let's use 'CPL Pathways' for now").** No rendered string
  says ROEP or catalog harvest (`tests/cpl_pathways_college_status.test.js` g); code identifiers keep `roep`.
- **CPL Pathways' college line (Sam's ask, #2312):** complete counts an active COCI program passing the three machine
  checks; SLOs cover the courses the state's Program Course File lists for the college's programs; a disagreement is a
  record failing the courses or off-list check, and the Records view gained that filter so the count opens exactly
  what it counted.
