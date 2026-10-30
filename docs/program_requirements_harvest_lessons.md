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

## S442-S444: moved to the archive (S489 compaction)

Verbatim in [`program_requirements_harvest_lessons_archive_3.md`](program_requirements_harvest_lessons_archive_3.md): a page heading a section per award serving each sibling, Foothill loaded, six colleges captured again, Reedley, CPL Pathways' college line, the page-claimed sweep, department pages, two-line headings and Program Mapper.

## S408: moved to the archive (S498 compaction)

A run of numbers after one subject, a list marker at a line's end, the eight-college wave, and the lane text S408 retired: verbatim in [`program_requirements_harvest_lessons_archive_3.md`](program_requirements_harvest_lessons_archive_3.md).

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

## S489 SkySnowberry (2026-10-26, the CPL Queue routine): lists with floors under one total

- **One printed total over lists that carry their own figures is still one choice.** Liberal Arts: Pathway to Health
  Sciences A.A. 17924 read List A: Biology (3), List B: Chemistry (4) and List C (10-11) as three blocks, 17-18 against
  18. The tab prints "Complete a total of 18 units from List A, List B, and List C" (page read 40306415059, S488).
  `pool_lists` gains `with_floors`: the lists become one 18-unit choice, each list's figure stays in the block's
  `floors`, a course listed in two of the lists is listed once (List C repeats A's and B's courses, which `repeated`
  would fail inside one block), and the step never fires where the floors sum past the total. `block_pattern` (a regex on
  the list name) stands in for `block_prefix` where the lists share no prefix.
- **The floors are kept, not scored.** The scorer sums the block's 18. A floor is a rule on which courses, like 17912's
  two-disciplines condition, and the record holds it so a curator and the display can still read it.
- Reconcile 40314109801 (free) moved 17924 alone (18 of 18; degree 60 with Cal-GETC 34 and 8 elective units). The other
  55 re-filed records changed only the `ge_overlap` flag or score bookkeeping and were restored before reread
  40318170598, which replaced one row (before-values in its receipt). Hartnell 80 to 81 of 94. Display build 19d2397e8004.
- **Still waiting on a reader change:** CalGETC 45096 (area totals over sub-areas, 5C's lab counted again) and Music
  43887 (repeat counts; the record shape has no repeat field). The 45096 step needs the tab's captured text for its
  pattern; read it from the reconcile run's `out/sources/45096.json` artifact first.

## S488 SkyThimbleberry (2026-10-26, the CPL Queue routine): Hartnell's last eight failing tabs, read

- **Every Hartnell failure has now been read against its tab** (page read 40306415059, eight tabs, free;
  plan `kb/college_reads/hartnell_unread_failures.json`). No reader change shipped; each failure sorts into one of three
  kinds.
- **The narrow `meets` class, as Sam ruled (Sheet 119 card 9, Sheet 120 card 1).** Agriculture Production 31591 (24-35
  against 27) and Sustainable Crop Management 43119 (25-33 against 27) carry ABT99 at 1-8 units; Technical Support 41819
  (15-16 against 16) carries "CIS57 OR BUS43". The printed total lies inside the range and the low end falls short, as
  for Biology 03537 and Engineering 33851. They stay failing.
- **A vendor gap stays incomplete.** Agriculture A.S. 11803's Sustainable Crop emphasis requires ABT41, which the tab
  prints with no title and the vendor with no units (as ABT82, ABT160 and MFGT75 elsewhere). Vocational Nursing 03571's
  HES120 reads "Any AHA BLS for Health Care Professional course is acceptable": no Hartnell figure exists.
- **Three wait on a reader change, each named by the page's words.** Liberal Arts: Pathway to Health Sciences 17924
  prints "Complete a total of 18 units from List A, List B, and List C" over list floors of 3, 4 and "10-11": one figure
  over lists that carry their own, which `pool_lists` (figureless lists only) does not reach. CalGETC 45096 prints each
  area's total ("A total of 6 semester units is required", "A total of 7") over sub-area blocks (3A, 3B; 5A, 5B, 5C) that
  the record sums separately, 5C's lab counted again. Music 43887 prints two repeat counts, "If MUS 11 is chosen, it must
  be taken for 2 semesters" and "2 semesters of any of the following Courses"; with both, it reads 19.5-20 against 19.5.
  The record shape has no repeat field (Delta 44197, S424, is the same gap).
- **A renumber map is college-wide, so read every tab that lists the course first.** Technical Support's tab prints
  CIS50, CIS59, CIS53 and CIS57 where the state's file lists CSS 50, CSS 169, CSS 53 and CSS 57 (same titles and units),
  so its coverage reads 0.2. But Hartnell's other passing records read CSS codes from their own tabs (31592, 31593, 43809),
  and `course_renumbers` would make the capture look for CIS on those pages too. No map was written.
- **Fable's advice on the two definition calls (asked once).** Respiratory Care B.S. 44537: compare its 40 upper-division
  units only against an upper-division figure the page prints; with only the 120 (which includes the admitting A.S.),
  keep it incomplete with that reason, and never sum the A.S. record into it (the two name different GE patterns, and the
  elective gap would read as a mismatch). RN 03570: read the prerequisite list as blocks priced from each course's own
  vendor units and Area 6 at the Local GE table's figure, label the GE "partial pattern", count a course once, and report
  the sum beside 60 with any gap standing; a course with no found units keeps it incomplete. Not yet built.
- **The display apply ran past an hour.** `step=display` run 40297886199 (build 767a48c10e89, dispatched 09:13Z) was still
  in its apply step at 10:26Z against a 120-minute timeout; S486's took about 25 minutes.

## S487 SkyHuckleberry (2026-10-26, the CPL Queue routine): Hartnell's pooled subject lists

- **One figure over several lists is one choice.** General Studies: Arts and Humanities A.A. 17912 (AA.GAH) read its
  eleven "List A: <subject>" lists as eleven `choose_units` blocks with no units. The tab prints "For the 18 units
  required, select courses in List A from at least two disciplines; from one of the disciplines select at least two
  courses." over a Completion requirement whose lists each say "Complete ANY of the following Courses" (page read
  40291523425). Its sibling Social and Behavioral Sciences 17911 prints the same words and was read as one 18-unit block,
  so the extraction, and nothing on the page, split 17912. A `pool_lists` reconcile step joins two or more figureless
  lists sharing `block_prefix` into one block of the page's figure, and never where `total_units` names another.
  Reconcile 40292405207 (free) moved 17912 alone (18 of 18 in the major, 60 with Local GE 23 and electives); 56
  bookkeeping-only records were restored, and reread 40294638373 replaced one row (before-values in its receipt).
  Hartnell 79 to 80 of 94. Display build 767a48c10e89.
- **The two-disciplines condition has no field.** It rules which courses count, never how many units; the record keeps the
  courses and the scorer checks the units.
- **A step that changes blocks needs no carry-basis change.** The basis keeps every block, so a confirm of the split
  record does not carry and the curator sees the pooled list (the college test now names `pool_lists` beside
  `course_units` and `course_hours`).
- **Read a sibling before writing a reader change.** The passing sibling showed the reading the page supports; the page
  read confirmed it before any code.

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

## Moved to archive 3 (S505 compaction)

S445 SkyCurrant (a shared page per heading, MiraCosta's degree lists, Palomar's "Cert. Achievement") and the S445
lane compaction (S444) are verbatim in `program_requirements_harvest_lessons_archive_3.md`, and S446 SkyMadrone
(a degree-and-certificate address, 91 records) since the S523 compaction.

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

## S523 SkyBarberry (2026-10-30, the CPL Queue routine): Glendale 80 to 105 passing, every course priced from its own description

- **The state's file was never the whole list.** It leaves 51 Glendale credit courses unpriced, but the filed records
  place 738 more codes it does not list for their program at all (CABOT 102, ART 130, ESL 151, NS 214). Pricing only the
  51 lifted 80 to 91 (reconcile 41009271854). Pricing every description lifted it to 105 (reconcile 41012563119).
- **Read the whole description section in windows, then parse it locally.** The page read prints at most 14 PDF pages
  whole, so fifteen plans (`kb/college_reads/glendale_course_desc_01..15`, keyword `Units`) cover pages 98-307, three per
  push (about 3,500 log lines a job, inside get_job_logs' 5,000). Descriptions start at page 128; windows 1-2 held
  program pages. `kb/_description_units.py` parses the saved logs: a description prints "NUM · TITLE · N Units", then a
  body naming the course, sometimes letter-spaced ("B I O L 2 9 8"), and the body's code is the key (ACCTG 121's title
  changed; its code did not). 1,234 codes, plus 44 under the entry's prefix aliases and renumbers.
- **Anchor a log parser on the fixed token and look backward.** A title pattern with nested quantifiers hung for minutes
  on a 370,000-character log; matching each "· N Units" and reading the 160 characters before it runs in under a second.
- **A plan file under `kb/college_reads/` is a read.** A push reads every plan its last commit adds, so a derived map
  kept there would run as one. The map lives at `kb/program_requirements_units/glendale_community.json`; the step names it
  as `units_file` (#2574). Only one run waits per concurrency group: a second push while one waits cancels the first, so
  push the next batch only after the waiting run has started (part b's first push was canceled this way).
- **Left at Glendale (155 failing arithmetic):** 71 records name no program total, the largest cause now; 48 sum unequal
  to the printed total (36 before: pricing exposed sums that were hidden as incomplete); about 34 still lack a course's
  units (13 of the original 51, ART 144-255, AT 138, NS 213, PE 217, POLS 110, THTR 192-193 and others, print no
  description in this catalog). No model call this session.

## S505 SkyBoysenberry (2026-10-28): Glendale 45 to 80 passing of its filed records, on its catalog's own words

- **List the thin colleges live first (S442), and it named Glendale:** 220 loaded, 65 of 296 active programs passing,
  the largest gap at a loaded college. 114 records failed arithmetic alone, as incomplete, and 54 failed outcomes.
- **Three free page reads gave every fix its words** (`kb/college_reads/glendale_program_totals`,
  `glendale_prefix_titles`, `glendale_theatre_program_pages`; runs 40690480267, 40692306069, 40701293232). The program
  pages print the old prefixes and numbers (PSYCH 170, T ART 101, ENGL 101); the course descriptions print the state's
  (PSYC 170 Sports Psychology, THTR 101, "C1000 · ... · (Previously ENGL 101)"). Glendale's reconcile entry files
  PSYCH and TART as prefix aliases and ENGL 101, ENGL 104 and POL S 101 as renumbers. ART for ARTH stays out: no read
  printed an ARTH description, and ART is a live Glendale prefix.
- **The capture now looks for a listed course under an aliased prefix (4a925a33).** `with_renumbers` set `printed` for
  renumbers only, so a program page printing TART codes named none of the THTR list and the THTR descriptions won the
  page: three Theatre records read course descriptions. The page picker moved them to their program pages (88, 114,
  123) and found two programs never filed (Theatre Arts: General 11176, Sociology 30813). A listed prefix that only
  begins with an alias's (ARTH under ART) is never rewritten; guarded in `program_requirements_pilot_test`.
- **The outcome scorer's no-space reading now joins line-end hyphens and fires on letter-spaced lines and spaced
  semicolons (4e53790c).** Glendale's PDF prints "Fulﬁ ll requirements for transfer to a col-\nlege", "b e  a b l e
  t o" and "occupations ;". The reading only adds; outcome failures went 54 to 0 on the reconcile (run 40711704988).
- **The Edge Function's BOOT_ERROR (HTTP 503) is transient and leaves a record empty.** Three of 27 failed on run
  40704760867, two again on the forced retry; the third forcing filed all (runs 40707595210, 40710163463). Check every
  record's `error` after an extraction before any reread, and force the empty ones.
- **A reread posts the newest run only,** so records filed by earlier runs on the branch need `force=<run>` each
  (40704760867, 40710163463, 40707595210 after the reconcile's own).
- **Left at Glendale:** 180 records fail arithmetic. Most are courses the state's file lists with no units (63 courses,
  unspaced codes such as BIOL298, ACCTG101); their units print only in the course descriptions ("3.0 Units"), so a
  reader step that takes a course's units from its description is next. Biotechnology 41767 sums 25-27 against its
  printed 28-30, the catalog's own disagreement. Cost: $2.64 + about $0.40 in forced retries.

## S500 SkyBlackberry (2026-10-27, the CPL Queue routine, beside Sam's own S500): Delta 22244 passes on a unit_line step (200 of 203)

- **A second reading made the same choice.** `force=22244` (run 40517095981, $0.05) left out "Associate Degree Math
  Requirement: Units 4" again and said so in its notes, as run 39217405432 had: the reader will not record a line with
  no course as a block. So a re-extract of a misread that the reader's notes already name is wasted; write the step.
- **unit_line** (a new reconcile kind) adds a printed requirement line with units and no course as a choose_units
  block of its figure with no courses, only where no block carries the label and the record's sum falls short of its
  printed total by exactly that figure. Run locally against every filed Delta record with the line injected at 3, 4
  and 5 units, it fired on 22244 alone; the five other Delta records whose notes name the phrase already pass. That
  test made a college-wide step safe where S499 feared one. Reconcile 40523400149 changed 22244 alone, 19 to 23
  against 23.
- The step changes blocks, so it joins the kinds the carry-basis test sets aside (`program_requirements_college_test`).

## S499 SkyCloudberry (2026-10-27, the CPL Queue routine): Delta Cal-GETC 45621 passes (199 of 203)

- **The same certificate, the same shape, at a second college.** Delta's Cal-GETC 45621 read 29-40 against 34 for the
  reason Hartnell's 45096 did (S495): the page prints one minimum over each area's sub-areas, and the record kept each
  sub-area as its own block with no figure. Page read 40497591551 gave the words ("Area 5 - Physical and Biological
  Sciences / Complete a minimum of 7 semester units with at least one course each from 5A ... and 5B ..."), and
  Hartnell's `pool_areas` step took a Delta pattern with no code change. Reconcile 40498068817 moved 45621 alone, 34-35
  against the floor of 34; reread 40502212690 replaced one row.
- **Pool only the areas whose sub-areas are choices.** Area 1 prints the same words over 1A, 1B and 1C, but 1C is one
  required course (rule `all`, which the step never pools), and pooling 1A and 1B alone would have counted Area 1 as
  9 plus 1C's 3. Each of Area 1's sub-areas picks one course, so they already sum to the area's 9-10. The pattern names
  Areas 3 and 5 only. Test a step against the record locally (`reconcile()`, then `program_units()`) before dispatching.
- **The four left at Delta are extraction misreads, each named in the Jev verdicts** (`kb/jev_harvest_verdicts/`):
  07304 records the elective list once more beside the three Areas that already include it; 16764 counts a block a piano
  examination can waive; 22244 leaves out "Associate Degree Math Requirement: Units 4", a non-course line that brings
  19 to the page's 23 (05612's reader recorded the same line as a choose_units block of 4 with no courses); and 19752 was
  handed the GE page. The phrase means different things elsewhere at Delta (an "or" alternative inside an area, a line
  outside the stated total), so a college-wide step would misfire. Each needs a second reading of its own page.
- **A page read's install step can hang.** Run 40496307093 sat in the Playwright install for 13 minutes; a canceled
  run and a fresh dispatch finished in two (40497591551).

## S498 SkyBearberry (2026-10-27, the CPL Queue routine): RN 03570 summed, Delta 44197 passes (198 of 203)

- **RN 03570 needed no new page read.** S485's page read 40279150362 already printed the whole AS.NRN tab, prerequisite
  list included, and every prerequisite course carries vendor units on another Hartnell record (BIO5 4, BIO6 3, BIO6L 2,
  BIO27 4, CHM22 4, ENGLC1000 3 or 1000E 4, the math choice 3 to 6, PSY25 or NRN70 3, ANT2 and SOC1 3 each,
  COMMC1000 or COM3 3, Local GE Area 6 at 3). Read Fable's way (S488), the prerequisites sum to about 35-42. The 36.5
  required NRN units bring the total to about 71.5-78.5, against the 60 the tab prints. So the build would replace an
  *incomplete* status with an *unequal* one (the catalog's 60 understates the program). That gives a better reason and
  no pass, so it was not built this run. Read a log the earlier runs left before you load the college's site again.
- **Delta 44197: a repeat count can come with its own printed sum.** Page read 40479703275 shows the words "Students
  are required to enroll four times in CAT 69V for a total of 16 units" beside "Units: 1-4". Four times the range
  would read 4-16, and the narrow `meets` reading would still fail at 43-55. So the `repeat` step takes an optional
  `total` group and keeps it as `units_total`, which the scorer reads in place of the range times n. It also reads a
  count written as a word. The record sums to 55, the page's "Minimum Units Required: 55". The printed units stay.
- **Delta's capture puts a no-break space between subject and number** ("in\u00a0CAT 69V"). Reconcile 40480236607
  moved nothing on a pattern written with a plain space. Reconcile 40484963062, with `\s` between every word, moved
  44197 alone, to 55 against 55 (equal). Write an Acalog pattern with `\s`, never a literal space. The first run also
  rescored 05630 (a certificate total that counts GE, `ge_included` 16) and 11970 (`fill` 18.5) to pass, under
  readings the scorer gained after S424, so Delta reads 198 of 203. Reread 40489395464 posted 44197 and a second
  reread (`force=40480236607`) posted the two rescores. Display build 20241d4a9117 applies on `main` after the merge.

## S497 SkyCrowberry (2026-10-27, the CPL Queue routine): Music 43887's repeat counts

- **A repeat count is a field, never a doubled figure.** The `repeat` step gives a course `times: n` and a list
  `repeats: true` with `minimum: n`; the record keeps each course's printed units, and only the scorer multiplies.
  A repeating list counts n of its least course for the low end and n of its largest for the high end. No other
  record carried either field, so no other score moved. Delta 44197 (S424) is the same gap and can take the step.
- **The pattern matched the live capture on the first dispatch** (reconcile 40466933762): "If MUS 11 is chosen, it
  must be taken for 2 semesters" and the block name "2 semesters of any of the following Courses". The run re-filed
  all 58 records again; 43887 alone moved, so the rest returned to main and the summary moved 82 to 83 by hand.
- **RN 03570 cannot take Fable's reading yet:** its record holds the four semesters and the recommended success
  courses, and no prerequisite list, so the reading needs a page read of the tab's prerequisite words first.

## S496 SkyLingonberry (2026-10-27, the CPL Queue routine): 45096 lands

- **Reconcile 40452134609 (free) moved 45096 alone in substance:** 34-35 against 34, arith equal, the units of all 163
  courses as before. The other 57 re-filed records changed only bookkeeping (`ge_overlap`, the `reconciled` log), and the
  capture flapped (43821 fell to a near miss, two Coursedog code pairs swapped order), so capture, sources and those
  records returned to main and the summary moved 81 to 82 by hand. Reread 40460714483 replaced one row; read back
  `total` 34, arithmetic `equal`.
- **A re-filed capture can lose a program the last one found.** Restore the summary from main and edit the counts,
  never take the run's summary whole.

## S495 SkySalmonberry (2026-10-27): Hartnell CalGETC 45096's area totals, the step

- **The page read named the shape; the stored record named the blocks.** Page read 40375734212 prints "Area 3: Arts and
  Humanities / A total of 6 semester units is required. Two courses required: one from Area 3A (Arts) and one from Area
  3B (Humanities)." and "Area 5 ... A total of 7"; the record (read through the Supabase MCP) keeps "Area 3: Arts and
  Humanities - Area 3A (Arts)", 3B, "Area 5A: Physical Science", 5B and 5C as figureless choose_courses blocks, so one
  `block_pattern` has to match both namings: `(?:Area {area}: [^\n]*? - )?Area {area}[A-Z]\b`.
- **`pool_areas` finished (S491's WIP):** each area's sub-areas become one choice of the printed total, named for the
  area (`{title}`), each sub-area kept in floors with its rule, a course under two sub-areas listed once (5C's laboratory
  list repeats 5A's and 5B's); 9 + 3 + 6 + 6 + 7 + 3 = 34. The text pattern reads a capture joined by newline or space.
  Eight checks in `tests/program_requirements_reconcile_test.py`; the confirm-carry check excludes `pool_areas` as it
  does `pool_lists` (a joined block's confirm does not carry).
- **Next:** the reconcile dispatched on the branch (extract 0) checks the pattern on `out/sources/45096.json`; then, as
  S489 did, restore any re-filed record that changed only bookkeeping, reread, and merge.
