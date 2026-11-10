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

## S409-S411: moved to the archive (S526 compaction)

Hartnell by its code headings, Cañada by its hand-filed copy, Cuesta's wave: [archive 3](program_requirements_harvest_lessons_archive_3.md).

## S495-S500: moved to the archive (S533 compaction)

Hartnell CalGETC 45096's area totals and its landing, Music 43887's repeat counts, RN 03570 summed, Delta 44197, 45621 and 22244 (198 to 200 of 203): [archive 3](program_requirements_harvest_lessons_archive_3.md).

## S412-S415: moved to the archive (S530 compaction)

Crafton Hills's walk and the pending-run rule, Taft's slashed subject, Merced's Coursedog reader and the slash rescoring, San Joaquin Delta's printed degree floor and Taft's Cal-GETC 34: verbatim in [archive 3](program_requirements_harvest_lessons_archive_3.md).

## Moved from the lane (S413 compaction)

**Outcomes (Sam, 2026-10-04 18:03Z):** grab published course and program outcomes, and compare harvested credential skills with course outcomes. 🔨 **Course outlines (Sam, 2026-10-12, `sam-capture-cor-system-link-2026-10-12`):** capture each college's course outline of record system link so the harvest reads course SLOs, for the skills match and for faculty assessment of CPL. Record shape 3, Sheet 70's rulings, the registry's `cor_*` fields, the census, the index and how each host prints its SLOs: lessons, *Moved from the lane (S376 compaction)* and *(S380 compaction)*. ✅ **`course_outcomes` is live** (Sam pasted `chatbox/supabase_course_outcomes.sql`, Open Asks Sheet 72 card 1; public read, insert-only `course_outcomes_load()` on the service role, a receipt per load). **Loaded, nine colleges, 7,450 courses, 20,891 SLOs** (live read, S388; by college: lessons, S398 compaction). `catalog=<slug>` in `kb/course_outcomes/.run` picks either form; each load is insert-only with a receipt naming its rollback. COBI shows the SLOs on Program records' course rows and in COCI Lookup (#2116, Sam 2026-10-14). The skills comparison waits for `kb/reference/industry_credential_skills.json` (not started).

## S419: moved to the archive (S549 compaction)

Cañada's eleven, read from the catalog's own words: verbatim in
`docs/program_requirements_harvest_lessons_archive_3.md`.

## S420: moved to the archive (S562 compaction)

Cañada's re-read, a Jev sitting over the failing records, the second reader ruled: verbatim in `docs/program_requirements_harvest_lessons_archive_3.md`.

## S421: moved to the archive (S590 compaction)

The second reader built, three Jev sittings, Cañada's Cal-GETC step and the six-row rollback: verbatim in `docs/program_requirements_harvest_lessons_archive_3.md`.

## S422: moved to the archive (S592 compaction)

The section, verbatim: `program_requirements_harvest_lessons_archive_3.md`, *S422 SkyWillow*.

## S442 (the Ventura district's campus letter): moved to the archive (S596 compaction)

Verbatim in `docs/program_requirements_harvest_lessons_archive_3.md`.

## S440: moved to the archive (S598 compaction)

Three colleges no list named, Santa Monica's 40-minute PDF, Taft 38661 gone: verbatim in
`docs/program_requirements_harvest_lessons_archive_3.md`.

## Moved from the lane (S423 compaction)

**Cañada (S419-S421, #2241, #2244, #2247):** the picker reads the catalog's three heading shapes; 73 of 75 listed programs filed; its reconcile step sets Cal-GETC's 34 on transfer degrees only, cited from the catalog's own GE page (lessons S421); 17 records fail a machine check; display build 3d92deb7a816 applied on `main`. **A reconcile step for a figure a local degree never carries reads transfer degrees only (`awards: transfer`, S421):** a local degree's captured page can span the sibling transfer section. **Verify a reader change on the catalog's own words before any dispatch** (`kb/college_reads/`; a PDF plan takes `pdf_span` and `pdf_after`, S421). **San Joaquin Delta (S422, #2250):** the program total is a floor (`total_units_minimum`), its catalog's subject prefixes alias the state file's (`prefix_aliases`), and a noncredit page printing only its total hours passes as `total_only`; 195 of 202 live rows pass (154 before); the 8 left are the extraction's. **Taft's local degrees (S422, #2249):** the catalog prints a 27-unit local GE pattern and an 18-unit one for CTE degrees, and no page words the 60 as a floor, so no step; 16725 and 36928 stay failing.

## Moved from the lane (S419 compaction): moved to the archive (S604 compaction)

Verbatim in `docs/program_requirements_harvest_lessons_archive_4.md`.

## S486-S489: moved to the archive (S535 compaction)

Hartnell's double-count words, its pooled subject lists, its last eight failing tabs and the lists with floors under one total: verbatim in [archive 3](program_requirements_harvest_lessons_archive_3.md).

## S485: moved to the archive (S602 compaction)

Verbatim in `docs/program_requirements_harvest_lessons_archive_3.md`.

## S458, S459 and S484: moved to the archive (S607 compaction)

Verbatim in `docs/program_requirements_harvest_lessons_archive_4.md`.

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

## Moved from the lane (S530 compaction)

**Hartnell 83 of 94 (S496-S497):** CalGETC 45096 passes on `pool_areas`.
Music 43887 passes on the `repeat` step (S497): a course the tab says is taken n times carries `times`, a list of
"n semesters of any of" carries `repeats`, and the scorer counts both; 19.5-20 against 19.5, meets (lessons S497). Hartnell RN 03570 waits (lessons, *Moved from the lane (S524 compaction)*).
Delta 200 of 203: lessons, *Moved from the lane (S524 compaction)*.

**The second reader, Grok (Sam, Open Asks Sheet 97 card 1, 2026-10-19; built S421, #2246: `provider` on the function, `kb/_second_reader.py`, `second-reader.yml`, nothing written) waits on the xAI API billing moving to the RCCD district card (Sam, 2026-10-20) and the two Edge Function secrets only Sam sets; then one deploy and `second-reader.yml` with `college=Cañada College`. The ruling, the design and Jev's sittings: lessons, *Moved from the lane (S449 compaction)*.
**Display build e021a2824548 is applied on `main` (S459: #2387 merged, `step=display` run 40027395883, 22:46Z: 17,529 statements written, none missing, no errors; the applied record committed by the run).** **Hartnell (S484-S489; lessons S484-S489):** passing rose to 81 of 94 after the `course_hours`, `ge_overlap` (#2462) and `pool_lists` (#2463; `with_floors`, #2465) steps (kept, Sheet 131 cards 3-4). **Still failing, all thirteen read (S488):** the narrow `meets` class (03537, 33851, 31591, 43119, 41819) stays as Sam ruled; a vendor gap (ABT41 in Agriculture A.S. 11803, HES120 in Vocational Nursing 03571, beside 44161 and 44574) stays incomplete; CalGETC 45096 and Music 43887 have since passed (below). Fable's advice on RN 03570 and Respiratory Care 44537 is in lessons S488. CSS/CIS codes are mixed across Hartnell's tabs, so no college-wide renumber.

## S584 SkyMinkowski (2026-11-05, the CPL Queue routine, 14:12Z firing): course objectives read and stored

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

## S593 SkyTadpole (2026-11-06, the CPL Queue routine, 13:12Z firing): #2838 merged; Ohlone's noncredit gaps placed

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

## S594-S595 (2026-11-07, the CPL Queue routine, 06:12Z and 08:12Z firings): Siskiyous re-read

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

## S596 SkyPinwheel (2026-11-07, the CPL Queue routine, 09:12Z firing): Siskiyous loaded and reread; Palomar re-captured

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

## S598 SkyAndromeda (2026-11-07, the CPL Queue routine, 11:12Z firing): Palomar re-captured, Coalinga extracting, Los Medanos captured

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

