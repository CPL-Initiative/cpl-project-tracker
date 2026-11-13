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

## S457: moved to the archive (S640 compaction)

Verbatim in [`program_requirements_harvest_lessons_archive_4.md`](program_requirements_harvest_lessons_archive_4.md), *S457 SkyColumbine*.

## S447-S456: moved to archive 4 (S641 compaction)

Sections S456 SkyYarrow through *Moved from the lane (S447 compaction)*, verbatim, in [`program_requirements_harvest_lessons_archive_4`](program_requirements_harvest_lessons_archive_4.md), *Moved from the lessons (S641 compaction)*.

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

## S584-S598: moved to archive 4 (S645 compaction)

S584 SkyMinkowski; S593 SkyTadpole; S594-S595; S596 SkyPinwheel; S598 SkyAndromeda, with their *Moved from the lane (S584)* and *(S598)* sections: [archive 4](program_requirements_harvest_lessons_archive_4.md), *Moved from the lessons (S645 compaction)*.

## S636 SkyAntennae (2026-11-11, Sam's session on handoff 636): Butte, 87 to 138 of 165

- **The shared cause, listed live first.** Butte passed 87 of 164 with no reconcile steps; 72 of its 77 failures were degrees that named a pattern and the degree's total with no units for the pattern. Glendale is parked and De Anza waits on Sam's two GE sheets, so Butte was the next largest gap.
- **The degree pages print no figure; the catalog's General Education section prints both.** Each page prints `GE Pattern(s): Butte Local, Cal-GETC` (or Cal-GETC alone) and a term map, `Map (Butte GE)` or `Map (Cal-GETC)`, whose lines read `Area 1A Choice (See GE Guide)` (page read 42957477366, `kb/college_reads/butte_ge_units.json`). The guides: *Complete a minimum of 21 semester units of general education* (Local; seven areas, one 3-unit course each) and *Complete a minimum of 34 semester units* (Cal-GETC) (page read 42961405888, `butte_ge_guides.json`). No figure is summed and none is cited from another college.
- **Reaching a section three levels down took five free reads.** The rendered view of a section address redirects to the catalog's first page. The way in: `_getNavigation?id=<catalog>&navigationtypeId=1` read as a plain page gives the top nodes; `_getNavigation?id=<catalog>&parentId=<node>` each level below; then `cq_view` on `.../iq/<root>/<list>/<item>` joins the item's tabs and prints them whole. A `_getPage` read prints only its first 3,000 characters. Plans: `butte_ge_section`, `butte_local_ge`, `butte_local_ge_guide`, `butte_ge_guides`.
- **Four steps (DECIDED, `cpl_memory` `d-butte-ge-units-own-words-s636`).** `ge_units` 34 on transfer degrees and 21 on local ones; `electives_fill_degree` from the map's *Only necessary if the 60 units needed to graduate have not been completed*; `ge_overlap` on a local degree from *Meets Area 4.* beside a course of the major. The overlap step rests on the map's area notes, where Hartnell and Las Positas had a double-count sentence. The local graduation requirement's 2 units stay out: the guide exempts many programs and lets its courses double count with a GE area.
- **A reconcile that changes nothing: read the guard before the steps.** Run 42962429245 changed 0 of 165. Butte's registry address had become `.../Catalog//iq/25371`, so the capture spelled every entry `/Catalog//iq/...` where the filed records say `/catalog/iq/...`, and the moved-page guard held every record out. `same_address` folds letter case and a doubled slash; `own_heading_kept` still asks the fresh text for the record's own heading (check in `tests/program_requirements_pilot_test.py`).
- **Runs.** Reconcile 42973457189: 88 changed, 135 pass. Eight degrees held only the map's text, so each pattern also reads the map's title; reconcile 42985449223: 8 more changed, 138 pass. The simulation on the filed records had said 145: it could not see which records lacked the `GE Pattern(s)` line. A reread posts one run's records, so two were dispatched (the first with `force=42973457189`).
- **Live and displayed.** Rereads 42998334970 (84 replaced) and 42998339612 (8 replaced), 0 errors, no row checked by a person; receipts `kb/receipts/program_requirement_records_college_reread_butte_<run>.json` hold the before-values. Live: 138 of 164 pass. Display build 052fb9eac1b5 on `main`'s records, applied by run 42999415016: 17,557 of 17,560 written, 0 errors (the job reads *failure* on the 3 Monterey Peninsula rows the table no longer holds: 03653, 22098, 39361).
- **The 27 left.** 25 read `unequal` (16 local A.S., 9 transfer): the sum lands inside the map's printed range without meeting either end, where the record carries the map's elective units as a requirement. One A.S. lists a prerequisite with no units (14583); one certificate names no total (39882).
- **Each capture of Butte takes about 93 minutes** (1,171 loads at the polite delay). A reconcile cannot reuse the last capture's text; a step that could would save the wait on a pattern fix.

## S636, second stretch (2026-11-11): COBIx's backlog (#3096), the blocked-source procedure, Redwoods' CR-GE

- **A source another reader found is verified from a runner before anything rests on it.** Two free reads confirmed COBIx's finds: Redwoods' 2026-27 CRGE sheet (*CRGE Units Required 21*, *Minimum Degree Units for Associate 60*; read 43013608134) and De Anza's 2026-27 eLumen catalog.
- **A rendered eLumen program page keeps its requirements behind a toggle** the page reader does not open (run 43014508848). Read the content address the capture reads instead: `api-prod.elumenapp.com/catalog/sites/publish/content/<catalog>,program,<slug>?tenant=<host>` (run 43015726456).
- **Redwoods' local steps.** The pages print the total only in the title, `A.S. Degree ( 60.0 Credits )`, and no general education line. Three steps: `ge_units` 21 keyed on the title; `degree_total_minimum` where the title prints 60.0 (the sheet calls the 60 a minimum); `ge_overlap` on Forestry's *can be double counted for GE requirements*. 53 to 59 of 73.
- **A college-level `awards` gate can hold a new step out.** Redwoods' entry read `transfer`, so reconcile 43016437012 changed none; it now reads `associate`, each step keeping its own gate. Read the entry's top level before a dispatch.
- **The Los Rios 404 is keyed to the census user agent.** The hand-filed-copy user agent, which also names the CPL Initiative, gets the file at the college's own address (COBIx, #3096). The colleges recompiled their catalogs on 2026-11-06, so the copies pinned on 2026-10-17 are the earlier edition.
- **A registry row a person corrected** (De Anza, Sam's go of 2026-10-17) is changed only by saying so on the row, and the session's permission check refused the apply: it waits on Sam.

## S637 (SkyPorpoise, 2026-11-11): De Anza's packed course codes, and the runners' DNS

- **Read the capture's near-miss reason before the diagnosis.** Handoff 637 said the reader "does not yet find the
  program pages". `capture_preview.json` said otherwise: 242 of 243 programs had a page found by title and award, each
  `coarse net: the page's code tokens name 0 of N listed courses`. Every miss shared one cause.
- **An eLumen publish call is the page before its script runs.** De Anza's feed writes
  `<td class="fix-code">ACCTD001A</td>` (subject, campus letter, four characters of number: `D01AH`, `D090.`, `D018.`);
  the page's script shows `ACCT 1A`, `ACCT 1AH`, `ACCT 90`, `BUS 18` (page read 43044618275 shows both).
  `el_fix_codes` rewrites only a fix-code cell in that packed shape; a code printed with its space is left alone
  (`tests/program_requirements_college_test.py`, the De Anza block).
- **A run can fail before its own work.** On 2026-11-11 the runners could not resolve Ubuntu's archive;
  `playwright install --with-deps` spent ten minutes in DNS timeouts and exited 100 (page read 43040340552 twice,
  capture 43046657326). The image already holds Chromium's libraries. `scripts/install_browser.sh` (#3112) installs
  the browser alone, launches it once and fetches packages only if it will not start; thirteen workflows call it and
  `tests/browser_install_single_source_test.py` fails one that writes the line itself.
- **A page read costs nothing and settles a hypothesis in six minutes.** A push that adds a plan under
  `kb/college_reads/` runs it; a dispatch names the plan. Hand the log to a subagent with the exact lines wanted.

## Moved from the lane (S639 side session)

The lane paragraphs the S639 side session retired, verbatim as they stood on 2026-11-12 (relative links re-pointed from `docs/reference/lanes/` to this folder). The lane keeps a one-line pointer to each.

Hartnell 83 of 94 and Delta 200 of 203: lessons, *Moved from the lane (S530 compaction)*.
**Glendale (S505, S523-S528; its 2025-26 PDF):** 115 of 226 loaded records pass (S527, from 110). Every course is priced from its own
description (`units_file`; lessons S523, S526), the C-numbers from the runner's parse (S527). Prose totals and the IT Technician pair: lessons S524-S526; the catalog's own sums: S528.
**PARKED (S527, the stopping rule; Sam, 2026-10-30):** two sessions under 3% each. The to-do `glendale-parked-2026-10-30` names what restarts it: [`scheduled_sessions`](reference/scheduled_sessions.md).
✅ **Sam, Sheet 144 card 2 *floor* (17:50Z 2026-10-30, his own call):** a choose-courses list's printed units are its floor, never its ceiling (`block_units`; `block_units_summed` keeps the reading before it). The S529 rescore and its live apply (Sheet 146 card 2): lessons, *Moved from the lane (S542 compaction)*. NEXT: the display build.
**Los Angeles Valley (S530-S534; its 2026-27 PDF): parked at 202 of 215** (`lavc-parked-2026-10-31`, the stopping rule). Its steps and the 13 left: lessons S530-S534.

**Monterey Peninsula: 184 of 197, every program found; its failing records wait for the outlier pass** (Sam, 2026-11-06: *"keep going to get everything you can and we'll handle the outliers afterward"*; S594). Lessons, *(S592)*.

**Mt. San Jacinto: 116 of 152 found, merged (#2838);** its 36 gaps stand as the catalog prints them (recheck Chemistry A.S.-T 40010 with the next catalog edit). Detail: lessons, *Moved from the lane (S595)*.

**Ohlone (S593, #2841): 146 of 179 found; every gap is the college's own** (lessons, *Moved from the lane (S596)*).

**Siskiyous, Palomar and Coalinga: loaded and displayed;** their paragraphs as they stood: lessons, *Moved from the lane (S607)*.

**Columbia (S605-S608, #2917): 78 of 82 passing (was 31), free, displayed.** Two steps from its own words: Cal-GETC 34 on transfer degrees, and GE 21-34 with the 60 as a floor on a page naming CC-GE. The 4 left are single misreads, left as filed. Runs and receipts: lessons S605-S608.

**De Anza (128 of 212 passing on its 2025-26 records; S636-S637, #3109):** on its 2026-2027 eLumen catalog (Sam, 2026-11-11: *go de anza*; registry corrected, the hand-filed PDF retired). Packed codes: lessons, S637. Extraction 43056325121: 132 of 221 pass ($17.15). S638: `packed_codes` (De Anza only, campus letter D) and `ge_units` at the printed ranges (local 29-41, Cal-GETC 45-58; read 43062313447), the 90 a floor. Reconcile 43072075772: 205 of 221 pass. Rereads 43078628422 and 43078634551 replaced 197 rows; 16 still fail. NEXT: `step=load` for the 24 absent; 15 older rows (Sheet 118 card 1); display.

**Las Positas (S630-S634; #3056, #3085): 181 of 193 passing** (145 before), displayed. Sam's *count* (Sheet 180 card 4: LPC-GE summed, A.A. 28 and A.S. 22), the two flags and the twelve local degrees that stand as filed: lessons, *Moved from the lane (S636)* and *(S633)*.

**College of Alameda (S617-S619, S634; #2956, #2960, #3086): 35 of 59 passing** (was 29), displayed. Sam's *count* (Sheet 180 card 2: `semester_sum`) and Chassis 09009 as filed: lessons, *Moved from the lane (S636)* and *(S630)*.

**Butte (S636, #3100): 138 of 164 live rows passing, displayed** (was 87), on the catalog's own totals (Local 21, Cal-GETC 34; `d-butte-ge-units-own-words-s636`). The 27 left and the runs: lessons, S636. NEXT: Redwoods' reread and display, De Anza on Sam's word, then the next largest gap, live. **A refused read follows [`blocked_sources`](reference/blocked_sources.md) before any card.**

**The List (2026-11-01, `#program-requirements/list`):** the Catalog Commons' shared List (`commons_list.js`), one row per active COCI program (20,282), read only; its columns, the control-number join and the timing at 20,282 rows: lessons, *Moved from the lane (S542 compaction)*. Guard `tests/program_requirements_list.test.js`. **The List is the workspace (2026-11-04, the List norms):** the engine's line of the requirements row in `kb/status/commons.json` (its issues set Fail a machine check and Not read yet), the Progress view's opened page folded behind *Hide the summary* (prefix `prl-pg-`), and a program's side panel: its record's checks in words, its courses block by block with title, units and the CPL on record at the college, and COCI's words folded; a light record is read once from the panel. Guard `tests/program_requirements_list_panel.test.js`. **Program records retired into the List (SkyLoquat, 2026-11-04, PR 3 of 3, after #2769 and #2771):** the panel carries the record's card (the checks in full, the flags, the chips, the CPL dialog, Your reading) and drafts the message to the college (*Draft the message to …*, reading the college's records once; Catalogs' drafts count opens the List on the college); side by side draws the full card. An older `view: "records"` address still opens the List. Guards `tests/program_requirements_list_record_port.test.js` and `tests/program_requirements.test.js`, whose card checks read side by side.

**Course objectives too (Sam, 2026-11-02, S551):** *"Since we are grabbing leaning outcomes, we should grab course objectives and store them as well. They are often richer descriptions of course content than any other element of the COR and we will need this when we star solving for the edge cases of the common course reference."* **Built (S584):** the reader files objectives as `course_outcomes.kind` `objective`; detail: lessons, *Moved from the lane (S590)*. **NEXT:** (4) the ten loaded colleges read once more for objectives (runner minutes only, no model call), most exhibit articulations first, one host at a time, after Mission's read; a full read files no page text, so it cannot be a reparse.

## S639 side session (2026-11-12): a shared cause measured live, nine colleges in hand, a reader fault found the expensive way

- **How the session came about.** Sam opened a second session on handoff 639 from iOS at 00:33Z while the S639 conductor (SkyQuail) was working. The two agreed one writer by message at 00:44Z. This session took the harvest lane as a declared side session and wrote a side handoff, [`harvest_side_handoff_s639`](harvest_side_handoff_s639.md), never a numbered one (the numbered handoff is 640, the conductor's).
- **List the thin colleges live and name the shared cause before assigning work.** Live at 01:20Z: 17,580 rows, 14,963 pass; 1,522 read `unequal`, 932 `incomplete`. The `incomplete` degrees at Orange Coast 50, Rio Hondo 30, Grossmont 27, West Valley 27, East Los Angeles 23, American River 23, Los Angeles City 22, Berkeley City 21 and others share Butte's cause: a degree names a general education pattern and prints no units for it. Naming it first let one worker take three colleges on one method, and sent Victor Valley (43 certificates `incomplete`, a different cause) to its own worker. Headline at 01:26Z: 20,282 active programs, 13,779 complete, 114 colleges.
- **Los Angeles City (#3130): the step reads only the record's own heading, and the capture must keep that heading.** Every degree heading prints *Major Units: 39  T otal Units: Minimum of 60* above *(State Code: ...)* (pypdf splits "Total"); the front matter prints *Completion of 18-27 units in the LACCD General Education Plan* (page read 43134671935). Two `set` steps, gated local, scoped from the record's heading to its State Code line. `only_with: degree_total` is new on `set` steps: without it a record read from *PROGRAM REQUIREMENTS* (Cinema Production 02729) takes the next program's 60. The worker ran all 18,296 other colleges' filed records through old and new code: none differed. The PDF cut lost headings printed above the State Code line, so a college-gated capture change, `heading_above_code`, keeps them; the second review found no record taking a neighbor's heading or total, though the walk pulls a previous program's course lines into the title (21609, 02750, 08237). Reconciles 43136137275 and 43138495821: 25 moved to passing, none regressed. Rereads 43141074738 (27 replaced) and 43142129065 (29 replaced), none held, no error: 181 of 223 live (156 before). #3130 squash-merged at 02:49Z (64f736b0) on a green `test`. Decision `d-lacc-heading-minimum-60-s639`.
- **A test that reads the record a run just filed breaks when the run files.** The second review of #3130 found the head failing three checks in `tests/program_requirements_reconcile_test.py` because they read the folder's live record rather than a fixture. Pin a fixture.
- **Orange Coast (#3133): a capital letter and a stale extraction.** 64 of 72 live failures still carried the S395 extraction, read before the S396 steps. The page read 43134559539 showed four wordings the old patterns missed: *Up to 21* (the capital U), the A.A.'s *Up to 27*, Cal-GETC *up to 34*, and an exact *OCC AS General Education 1 21* beside *Total Units 84*. Ten steps; the degree total is read only from a `Total Units` line directly after the GE or electives line, so a sequence tab's *Total Units 60-61* and a prerequisite list's *9.5* are never taken. The electives flag reads local degrees only: on 32231, 32804 and 35503 it would turn a passing transfer degree's span into a failure. Simulated 194 to 202 on the nine read pages, ceiling 234 of 274 filed; reconcile 43136182950 moved 29 to passing, none regressed (223 of 274 filed), and reread 43142833449 replaced 51, none held. Decision `d-occ-up-to-ge-maximum-s639`. Review: no wrong record; one nit, no test held the adjacency guard (closed). #3130's merge then left #3133 in conflict on the same reconcile file: PRs that each add to the end of one shared file merge one at a time, each merging `main` after the one before.
- **Measure a scorer reading's reach at every college before deciding it, and narrow it to the cause you can state.** Victor Valley's noncredit certificates print *Total Certificate Hours: 96.0 - 108.0* and each course's hours in its description (read 43134526902); the course hours add up to exactly the top. Built wide (sum equals the top of any printed hours range), the reading reached 29 records in three shapes: Victor Valley 23, Laney 4 with a labeled minimum, De Anza 2 with an optional course carried as required. Only one shape has a cause we can state: a range whose low end is eight ninths of the top is one total over a 16-week and an 18-week term. Narrowed to that (within 0.05, single-figure course hours, the sum exactly the top), it reaches 22, all Victor Valley; 45880 (256-280, 0.914) stays unequal. Sam's narrow `meets` for unit totals (Sheet 120 card 1) is unchanged. Decision `d-hours-meets-top-term-length-s639`, told to Sam in chat at about 01:50Z and 02:05Z as the session's call for him to revise.
- **Every scorer caller, not only the score.** The review at 587882fc confirmed that only `score()` passes a record to `program_verdict`; the three rescorers call it without one, so the new verdict cannot move a filed score there. It also found that the reading accepted a block's stated total for its courses, that the Cal-GETC step reached about 20 transfer degrees beyond 31788 and 44287, and that `tabs_with_prose` touched six pages, not four. All eight findings were fixed (1f6e110b2) and the reach stayed 22.
- **A free capture before any paid read on a new edition.** Handoff 637 priced American River's 23 reworded programs at about $1.50. Run 43134279776 (`step=read`, `extract=1`, the 23 forced) cost $12.99: the 2026-11-06 edition is four pages shorter, and `unchanged()` compares the source address with its `#page=N`, so all 154 moved programs went back to the model. 16 records improved and 30 that passed now fail (22 because the PDF picker took a line of a department's opening award list as the heading, 4 a window cut, 4 reading variance); 17 of the 23 forced went from passing to failing. Nothing was loaded or reread. A capture-only run (`extract=0`) reports `would_extract` and would have shown the 154 for nothing. The conductor followed the estimate without that run.
- **The reader fix (#3135).** `text_sha` fingerprints a program's window with the `[page N]` marks and page-stepped running headers removed; `moved_unchanged()` keeps a record whose fingerprint, codes and coverage match, cites the new page and keeps `page_moved_from`. A record filed before the change has no fingerprint, so the saving starts with the second edition after an extraction. The list-page rule passes over a best line sitting among three or more award titles, only on a page naming none of the program's courses. An offline replay of filed `pdf.picks[].opens` found such picks at American River (33 on `main`, 86 in the run), Sacramento City 24, Cosumnes River 15, Folsom Lake 8, and 0 at the other 20 PDF colleges (4,500 picks).
- **A catalog that prints Cal-GETC by area and no total.** Rio Hondo (#3136; reads 43137946308, 43138694150, 43139467468) and West Valley (#3137; reads 43138048261, 43139111307) print each area's units and no total sentence. The workers stopped at no step. The lane conductor then decided *count*, the sum of the college's own printed areas, 34, extending Sam's *count* on Sheet 180 cards 2 and 4 (`d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`; simulated 276 of 288, and West Valley about 116 of 133 after the review; its first estimate was 120). The review (three readers and a refuter) found no wrong record and five minor findings, among them that Berkeley City 16645 must not be re-posted with the combined line's 21. Berkeley City (#3138) prints *at least 18 units in general education* and an electives sentence on its Associate Degree Requirements tab (read 43140339800): local degrees 35 to 49 of 89 simulated; its Cal-GETC tab prints no units, so its 21 transfer degrees wait.
- **A push to a branch while its run is in flight collides with the run's filing commit.** A reconcile commits its filed records to the branch it ran on. Victor Valley's fix waited unpushed until run 43139057384 filed, and Orange Coast's nit waited on 43136182950. Records a pre-fix run files outside the fixed scope are restored to `main`'s version.
- **A reread's receipt commit leaves the PR head with no checks**, because a push from the workflow token starts no workflow. The next real push follows it so the `test` check runs on the head that merges.
- **An apply that writes a dated folder leaves the dependency map stale for every open PR.** `kb/dependency_map.json` lists the files the generators write, so a dated folder an apply commits to `main` changes it; each open branch then reads stale in `scripts/check_generated.sh` until it merges `main` and regenerates the map (#3135 carries such a regeneration, line numbers only). The same apply, the conductor's credential rename, turned `main` red from 00:54Z to 02:02Z on `tests/credential_family_test.py` (fixed by #3132), and the conductor asked that no merge changing generated `kb/` files land until its next daily-dashboard run commits.
- **One PR per wave, or PRs opened only when ready.** Each PR a worker opens subscribes the conductor's session, and each subscription notice costs about 8,000 tokens of context: nine PRs took this session from 16% to 86% of its window in two and a half hours. A side session with many colleges opens one PR per wave, or has workers push branches and opens a PR only when a branch is ready to merge.
- **Costs of a side session.** Four worker checkouts at 4.4 GB each left about 5.4 GB free, so no fifth. Worker checkouts live under `.claude/worktrees/` in the session's container and are lost with it; a worker does not survive a container restart and is briefed again from its PR body and the side handoff's ledger.
- **Runs on one ref queue.** Dispatches on the same ref wait behind each other, and a third pending run cancels the second, so the PDF reader's capture-only proofs go one at a time.
- **Diagnosed, not started.** San Bernardino Valley (146 of 200 live, 179 simulated), Grossmont (99 of 140, 121) and East Los Angeles (92 of 133, 109): causes, words, steps and read plans in [`harvest_wave3_diagnoses_s639`](harvest_wave3_diagnoses_s639.md). Two scorer readings, one writer: a noncredit *Total Hours N-M* with no colon, and the electives flag honored where a step files the catalog's own sentence (Grossmont's *Complete transferable units as needed to reach 60* prints no word *elective*). The two diagnoses name the new field differently (`electives_fill_words`, `electives_line_printed`); the writer picks one.
- **The night's result (one live count, 03:05Z).** Three colleges live: Los Angeles City 181 of 223 (156 before, #3130 merged 02:49Z), Orange Coast 217 of 259 (187 before, #3133 merged 03:04Z), Victor Valley 136 of 168 (108 before; reread on head 17d69398 after the worker restored 20 out-of-scope transfer degrees, #3131 not merged). Statewide 15,046 of 17,581 rows pass, 83 more than 14,963 of 17,580 at 01:20Z. The tab opt-in moved only the four EMS certificates (38353, 38366, 38502, 38503), which still need a paid re-extraction. Rio Hondo, West Valley and Berkeley City have reconciled but not reread.

## Moved from the lane (S640)

The S639 side session's block, verbatim as it stood at 05:25Z 2026-11-12, before S640 merged West Valley and Berkeley City.

**The S639 side session (2026-11-12, beside the S639 conductor; handoff [`harvest_side_handoff_s639`](../../harvest_side_handoff_s639.md)).** Live at 03:05Z: 15,046 of 17,581 rows pass (01:20Z: 14,963 of 17,580). The shared cause at about a dozen colleges: a degree names a GE pattern with no units. Before any merge, no `daily-dashboard` run in flight (cron 06:17, 09:17, 12:17 UTC). Lessons, *S639 side session*.
**Los Angeles City (#3130, merged 02:49Z): 181 of 223 live** (156 before). **DECIDED (`d-lacc-heading-minimum-60-s639`):** a local degree's heading *Total Units: Minimum of 60* is a floor, and general education is the printed 18-27 (pages 59-60 quoted); `only_with` on both steps; `heading_above_code` (this college only) keeps a heading above the State Code line. Rereads 43141074738 (27 replaced) and 43142129065 (29), none held. NEXT: a paid re-extraction of the records read past their heading, on #3135's reader once it merges.
**Orange Coast (#3133, merged 03:04Z): 217 of 259 live** (187 before); done this pass. **DECIDED (`d-occ-up-to-ge-maximum-s639`):** a printed *Up to 21* (A.S.), *Up to 27* (A.A.) or Cal-GETC *up to 34* is that pattern's maximum, and an exact 21 stands as printed. Reconcile 43136182950 (29 more pass, none regressed), reread 43142833449 (51 replaced, none held).
**Victor Valley (#3131, merged 04:20Z by S640): 136 of 168 live** (108 before). **DECIDED (`d-hours-meets-top-term-length-s639`, the session's call for Sam to revise; Sheet 120 card 1 unchanged):** an hours program passes when its printed range's low end is eight ninths of the top and its single-figure course hours sum to exactly the top: 22 records, all Victor Valley. Reread on head 17d69398 (02:59Z), the 20 out-of-scope transfer degrees restored first; the eight review fixes pushed, not re-reviewed. NEXT: the reread's receipt; merge `main`; `test` green; merge. The four EMS certificates (38353, 38366, 38502, 38503) need a paid re-extraction. 37006 and 38352 stay as read (Sheet 85).
**American River:** read 43134279776 ($12.99) rewrote 154 records on the renumbered edition (16 better, 30 now fail); not loaded, branch kept. NEXT: re-extract on #3135's reader after its proofs and review.
**The PDF reader (#3135):** `text_sha` keeps a program whose page moved and whose text did not, with no model call; the list-page rule skips a department's award list. Proofs filed for American River and Los Angeles City, not yet read. NEXT: Sacramento City, Los Angeles Valley, College of the Desert one at a time; previews judged against the PR's pass marks; review; merge; then the paid reads.
**Rio Hondo (#3136) and West Valley (#3137):** each catalog prints Cal-GETC's units by area and no total. **DECIDED (`d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`; the lane conductor's call for Sam to revise, extending his *count* on Sheet 180 cards 2 and 4):** transfer degrees take the sum of the college's own printed areas, 34. Steps written; simulated 276 of 288, West Valley about 116 of 133 (the review). **Berkeley City (#3138):** local degrees take *at least 18 units in general education* and the electives rule, 35 to 49 of 89 simulated; its 21 transfer degrees wait (its Cal-GETC tab prints no units). Reconciles dispatched 02:28Z to 02:34Z (West Valley's filed 02:50Z); review: no wrong record, five minor findings being fixed. NEXT, one at a time: the worker's push and result, a reread, merge `main`, merge.
**San Bernardino Valley, Grossmont, East Los Angeles:** diagnosed, not started ([`harvest_wave3_diagnoses_s639`](../../harvest_wave3_diagnoses_s639.md)). They need two scorer readings, one writer, each measured at every college first: a noncredit *Total Hours N-M*, and the electives flag where a step files the catalog's own sentence.

## S640 (SkyHeron, the conductor, 2026-11-12): three colleges merged, a partial capture, and a proof against a stale baseline

- **Sam's go, relayed by COBIx (7:13 PM PT 2026-11-11, #3110 comment 6813256997): "Yes, pick them up tonight."** The conductor took the side handoff's Next 1 to 4 (`sam-harvest-next-steps-tonight-2026-11-11`).
- **Three merges, each on a green `test`, each confirmed by a live count.** Victor Valley (#3131, `4214bea2`, about 04:20Z): a review of its three unreviewed commits (two readers, three second readers) found no wrong record and no wrong logic; three test gaps and two wording items were folded in first; 136 of 168. West Valley (#3137, `a664b105`, about 04:35Z): reread 43146197347 posted 34, replaced 34, none held; 120 of 133. Berkeley City (#3138, `dd50e246`, 04:53Z): reread 43147379414 posted 16, replaced 16, none held, and 16645 was never re-posted; 48 of 89. The PR measured 47 by `score.pass`; the live count reads the machine checks, which 37936 passes.
- **A capture that meets HTTP 503s files a partial read as if complete.** Rio Hondo's reconcile 43142240927 met 40 503s, read 34 of 328 pages and found 33 of 301 programs, so it measured 245 to 249 of 288 where the PR simulated 276. The reconcile measured against almost no fresh text and said nothing. A capture should refuse to file below a floor of pages answered. A fresh reconcile (43154073220) was dispatched at 04:19Z.
- **A proof is only as good as its baseline.** Three of #3135's five capture proofs compared against reads `main` filed on 2026-10-17, before the reader changed, so 37 and 50 pick changes were reader drift, not the PR. A proof run needs a same-day baseline by `main`'s reader: a scratch copy of `main` (`claude/harvest-pdf-baseline-s640`, no PR) files it, and is deleted when the PR merges. KB note: [`methodology-a-proof-run-needs-a-same-day-baseline`](kb-notes/methodology-a-proof-run-needs-a-same-day-baseline.md).
- **The PDF reader's design calls** (the conductor, after the review; `d-pdf-reader-design-calls-s640`): a paid read never makes a passing record worse; the list rule never lowers coverage; a bare number is a page number only when proven. The review had found a fingerprint that dropped bare unit figures.
- **The numbered handoff carries the lane again.** With one conductor holding the harvest and the CER lanes, the side handoff stopped; [`session_641_handoff`](session_641_handoff.md) carries the harvest's state.

## Moved from the lane (S641)

The S640 and S641 block, verbatim as it stood at about 11:50Z 2026-11-12, before #3135 merged into the lane's text; then the Redwoods, CPL Pathways, outcomes, refusal and light-index paragraphs, verbatim, trimmed to fit the lane's budget.

**S640 held the lane (SkyHeron, the conductor, 2026-11-12); this lane's handoff is the numbered one again, [`session_641_handoff`](../../session_641_handoff.md). The side handoff [`harvest_side_handoff_s639`](../../harvest_side_handoff_s639.md) is history.** **DECIDED (Sam, 7:13 PM PT 2026-11-11, relayed by COBIx on #3110; `sam-harvest-next-steps-tonight-2026-11-11`):** "Yes, pick them up tonight." The queue took the side handoff's Next 1 to 4. The S639 side session's block: lessons, *Moved from the lane (S640)*.
**Merged in S640, each on a green `test`, live by one count:** Victor Valley (#3131, `4214bea2`): 136 of 168. West Valley (#3137, `a664b105`; reread 43146197347 posted 34, replaced 34, none held): 120 of 133. Berkeley City (#3138, `dd50e246`; reread 43147379414 posted 16, replaced 16, none held; 16645 never re-posted): 48 of 89 (37936 passes the machine checks, which the live count reads). Earlier decisions stand: `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`.
**Rio Hondo (#3136): 276 of 288 live** (245 before; counted on `program_requirement_records` at 07:08Z, 34 rows on run 43154073220 and 4 on 43142240927). Reconcile 43154073220 answered all 328 of 328 catalog entries and found 288 of 301 programs; 3 child pages answered HTTP 503 (`_getPage` 24556 to 24558). The first reconcile, 43142240927, read only 34 pages, and its 4 changed records (32398, 32449, 32506, 32591) carry its run. The Cal-GETC step (ge_units 34) changed 34 records: 31 now pass and 3 still read unequal (30917, 36175, 37727). 4 more were rescored with no change. No record that passed fails. The 276 equals the PR's simulation. Rereads: 43169716051 posted run 43154073220's 34 and replaced 34, none held (`kb/receipts/program_requirement_records_college_reread_rio_hondo_43169716051.json`); 43170940640 (`force=43142240927`) posted 4 and replaced 4 (`kb/receipts/program_requirement_records_college_reread_rio_hondo_43170940640.json`). Each receipt holds the before-values, the rollback. NEXT: merge on a green `test`.
**The PDF reader (#3135; code head `d5aa09db`, `main` merged at `50b4c758`; open, not merged):** the list-page rule skips a department's award list. `text_sha` fingerprints each window; a record extracted on this reader carries it (`source_sha`), and a later edition that only moves the program keeps the record with no model call (`moved_unchanged`). No filed record carries one yet, so every preview shows `kept_moved` 0, and the saving starts at each program's next extraction: the first read after merge still sends the renumbered programs to the model. A capture never stamps a record it did not extract, because the address rule's "unchanged" does not prove the text unchanged (S641 review, call 5, left as code).
**DECIDED (the S640 conductor; `d-pdf-reader-design-calls-s640`):** the list rule never lowers coverage; a bare number is a page number only when proven.
**DECIDED (the S641 conductor, 2026-11-12):** equal coverage holds a passing record, fingerprint or not. A passing record's text changing at equal coverage is a refresh question, answered by a catalog-year rule (a new catalog year reads every record once), never by the per-run fingerprint: the fingerprint moves on unchanged text (a window one page wider, another line wrap, a header under the step test, a PDF-to-HTML move), and a kept record would be paid for again each run.
**DECIDED (the S641 conductor, the second review):** (1) a hold protects only a passing record; a failing or absent record is always read (American River 39057, filed 0 of 16 from page 169, is now read from 153 to 155 at 1.0). (2a) a passing record whose new window covers no more than the window it was extracted from is held: less is `held_worse_window`, equal is `held_no_gain` (12181 at 0.929, 20119 at 1.0), more from a list opening is `held_opens_on_list`. (2b) after any read, a new record that passes less than the filed one is not filed: a filed record that passes in full (`score.pass` and the live test) is replaced only by a read that passes in full, and one that passes only the live test only by a read that passes it too (`kept_passing`); the filed record stays, and the program goes to `kept_passing.json` with both scores for a person. `force` overrides both. (3) "passing" is the live table's test, coverage and invented and arithmetic equal, in one function (`passes_live`, `kb/_program_requirements_score.py`). (4) window coverage is compared only with window coverage (`source_coverage`, else the filed source's coverage when it names the record's page); with neither, nothing is held and 2b is the guard. Every Los Angeles City record cites a page its `sources.json` does not, so none of its 88 passing records is held before the read.

Each proof compares a same-day baseline by `main`'s reader (branch `claude/harvest-pdf-baseline-s640`) with a capture by this branch's reader, both `step=read`, `extract=0`. "Worse" counts passing filed records `main`'s reader would move to a lower-coverage window. The last four columns recompute each capture's preview under the S641 rules (kept by address, then held or read).

| College | Baseline / capture | Pages | Picks changed (up / same / down) | Passing made worse (baseline / capture) | Kept | Held: worse / no gain / list | Read |
|---|---|---|---|---|---|---|---|
| Sacramento City | 43159025892 / 43161357260 | 701 of 701 | 25 (4 / 21 / 0) | 5 / 0 | 160 | 2 / 22 / 0 | 20 |
| American River | 43162420332 / 43168246175 | 994 of 994 | 37 (2 / 35 / 0) | 12 / 0 | 243 | 10 / 82 / 0 | 33 |
| Los Angeles City | 43168250532 / 43169039127 | 367 of 367 | 0 | 0 / 0 | 105 | 0 / 0 / 0 | 145 |
| Los Angeles Valley | 43163880495 / 43170944468 | 346 of 346 | 0 | 0 / 0 | 221 | 0 / 0 / 0 | 2 |
| College of the Desert | 43160342510 / 43162424214, 43173033722 | 476 / **0**, **0** | not evidence | not evidence | | | |

Before S641's rules the previews read 38, 114, 143 and 2. College of the Desert's two captures (05:38Z and 07:10Z) never got the catalog: each asked for the PDF the baseline read at 05:19Z (200 OK, 21,123,131 bytes in 261 s) and hit the 900 s fetch limit. The branch does not change the fetch code. Neither is evidence, and the empty preview is removed from the branch. A held passing record keeps the page its filed source cites, so on a renumbered edition its citation stays the old page until it is read again.
**Known costs (S641 review, call 6; no code):** a footer pypdf merges into a content line, or a date stamp in a footer, changes the fingerprint and costs a re-read; a bare unit figure equal to its page number plus the catalog's offset on a page's first or last line (about 20 or less) can be dropped from the fingerprint; lettered furniture (a running header with no number) is dropped by its shape alone. **College of the Desert stays unproven:** this branch's reader has never read its catalog. NEXT: a later session dispatches a fresh baseline (`main`'s reader, `claude/harvest-pdf-baseline-s640`) and a capture (this reader) back to back, alone on its host, both `step=read`, `extract=0`, and fills its row before any paid read of the college; #3135 merges without it. Then delete the baseline branch, then the paid reads. Design item, not built: the catalog-year rule (a new catalog year reads every record once).
**After #3135 merges (paid, each capture-priced first, $40 a college):** American River re-extracted on the new reader (run 43134279776's records stay unloaded); Los Angeles City's records read past their heading; Victor Valley's four EMS certificates (38353, 38366, 38502, 38503). 37006 and 38352 stay as read (Sheet 85).

**Redwoods (S608-S609, S636; #2918, #3105): 59 of 73 passing on the branch** (was 53). COBIx found the college's 2026-27 CRGE sheet (#3096): *CRGE Units Required 21*, *Minimum Degree Units for Associate 60*. **DECIDED (S636, `d-redwoods-crge-21-s636`):** local degrees take 21; a title printing 60.0 is a floor; the page's double-count sentence sets the overlap. Reconcile 43018781168 (18 changed); the reread and display follow. 01831 and 08393 keep their totals.

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z):** *"we use the
new tab based on mockup to manage the ongoing process to harvest program ROE and
Pathway data and CPL Pathways to show it graphically to the colleges and public...
My goal is to not need to curate or manually adjust and instead to adjust
college-based procedures to arrive at accurate catalog ROEP dataset"* (vault
braindump, 2026-10-04 17:20). The
harvest tab runs the reading; CPL Pathways shows every record, checked or not, each
marked (Sierra's "required" stays on the checked gate). No record is edited by
hand: a misread is filed against the college's reading procedure; a place where the
catalog and the state's Program Course File disagree goes to the college (10 of 20
pilot records).
**The map names the pick inside a choice**; the catalog keeps the rule. Mock-up:
[CPL Pathways ROEP](https://claude.ai/artifact/8hkej9jHsmLRX6cZYxrXbM). ✅ **Ported (S334):** the pathway selector lists every catalog record (Beta draft) (its two views: lessons, *Moved from the lane (S542 compaction)*). Guard `tests/cpl_pathways_roep_view.test.js`; a11y targets `cpl-pathways-roep` and `-dark`.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills. `course_outcomes` holds 10,311 rows at thirteen colleges (Santa Ana 2026-11-03, S559; Las Positas 2026-11-04, S567; Columbia 2026-11-05, S578); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413). **The SLO read nightly in the CPL queue, to build** (Sam, 2026-11-01, in chat: *"yes to SLO hints and the nightly harvest"*): the colleges that articulate the most exhibits first; `course-outcomes-read.yml` and `-load.yml` are dispatch-only today.

**A refusal is on the college's record (Sam, sheet 29 card 3, revised 2026-10-17):** `program_source_registry` carries `sequence_host`, `sequence_access`, `sequence_note`, `sequence_checked_run`, and `access_status` for the catalog. ⚠️ **Automated reads still name the CPL Initiative in the user agent and still respect blocks and robots.txt.** Since Sam's rulings of 2026-10-17 (`cpl_memory` `sam-sheet-29-revised-refusal-workarounds-2026-10-17`), a person may fetch a public file by hand for the pipeline (the hand-filed step, `kb/hand_filed_catalogs/`), and the CO may ask a college or vendor for access (the access-note drafts in `CPLBrain/04-projects/cpl-initiative/20261017_Catalog_Reader_Access_Notes_Draft_1.md`; Sam sends them). Detail and the 25 colleges filed: lessons, *Moved from the lane (S386 compaction)*.

✅ **A light index, full records by key or by college** (S384, Sam 2026-10-13, `cpl_memory` `sam-records-load-by-college-filter-2026-10-13`; the cap, the anon timeout and #2088-#2090, #2121: lessons, S385 and S542 compactions). **The index reads stored columns** (S405, guard `tests/program_requirements.test.js` 6e; lessons, S411). The Records view's college sections and its CIP batch read retired with it (SkyLoquat, 2026-11-04); the List's CIP Sector reads COCI's own CIP.

## Moved from the lane (S641, late)

**Known costs (no code):** a footer pypdf merges into a content line, or a date stamp in a footer, changes the fingerprint and costs a re-read; a bare unit figure equal to its page number plus the catalog's offset on a page's first or last line can be dropped from the fingerprint; lettered furniture is dropped by its shape alone. The proof table (four colleges, baseline against capture): lessons, *Moved from the lane (S641)*.

## S641 (SkyOtter, two firings, 2026-11-12): the PDF reader merged, four colleges in flight, and a narrowing taken back out

- **The first firing (06:12Z) merged Rio Hondo (#3136, 276 of 288) and moved Shasta to a full read; the second (10:12Z, the conductor) merged #3135, #3145 and #3102.** The first firing wrote no handoff; its record is `main` and its note on #3110 (comment 6817896225).
- **#3135 merged (`1ebee603`) after every rule was checked by mutation.** One untested rule got a test (`pdf_furniture`'s bare number); the reader's test file runs 426 checks (as reported).
- **A worker's narrowing beyond its brief bought recurring spend.** It narrowed call 2a so equal coverage read again when the fingerprint changed. A second reader showed why that pays every run: a kept record keeps its old `source_sha`, and the fingerprint moves on unchanged text, so the same record reads again each time. The narrowing came back out. **DECIDED (the S641 conductor):** equal coverage holds a passing record; a text change at equal coverage is a catalog-year question, a design item in the lane's NEXT. One reader on a worker's delta is cheap, and here it paid.
- **`kept_passing` let a weaker read replace a full pass.** A read passing `passes_live` but failing `score.pass` replaced a record that passed both. It now keeps a filed record that passes in full unless the new read also passes in full.
- **The planner's corrections to the lane:** the lane still said #3135 was open; "`main`'s reader" for the baseline now lives only on the baseline branch; `capture_preview.json` on `main` for American River and Los Angeles City predates the new rules; the S639 side handoff's `ref main` for a paid run would push records straight to `main`; `force` adds programs and never limits a run; `fetch_copy`'s docstring contradicts Sam's #3096 ruling.
- **College of the Desert's 21 MB catalog ran past the 900 s fetch limit twice;** the limit is 2,400 s (`program_source_procedure_set`, md5-guarded, receipt `kb/receipts/program_source_procedure_desert_timeout_s641_2026-11-12.sql`). The baseline filed at `919373d6`: 476 pages, 51 to extract, 307 kept.
- **De Anza's SLO trial is held** (#3145): 12 pages asked, all HTTP 200, 11 empty; the 2026-27 eLumen catalog does not answer the older course codes. **Shasta's full read loaded** (#3102): 775 of 775 outlines, 1,549 rows counted live.
- **A verifier read each paid read's records against `main`'s before the load** and caught American River 11566: it passed both ways but fell from 15 of 20 courses placed to 9 of 20, equal on arithmetic only through a 24-unit fill. #3154 made `kept_passing` keep a passing record against a read that covers less (`covers_less`). Whether a larger arithmetic fill at equal coverage should also keep the filed record is open.
- **Paid reads (S641):** American River 33 programs $3.13, 0 pass to fail; Los Angeles City 145 programs $11.38, 0 pass to fail. `summary.json`'s `cost_usd` sums every filed record's own cost, older runs included; a run's cost is its stamped records plus its `kept_passing.json` entries.
- **College of the Desert failed a third time** with the 2,400 s limit: the host was unreachable after 1,016 s, so the fault is reaching the host, and the limit was not the cause. It goes by `blocked_sources.md`.

## Moved from the lane (S643)

- **American River (#3156, merged `04d692bf`):** paid run 43212067552, 33 programs, $3.13; 17 fail to pass, 0 pass to fail; 11566 held back by restoring `main`'s copy. Reread 43216104949 (16 replaced) and load 43217624238 (8 inserted), receipts on `main`.
- **Victor Valley (#3161, merged `e8784638` 21:27Z; displayed by run 43310473532):** the four EMS certificates (38353, 38366, 38502, 38503), forced in paid read 43215222441 (about $0.15), each fail to pass: same courses and full coverage as `main`'s, now with each course's units and a total that adds (8, 10, 15.5, 16.5). Reread 43224797980: 4 replaced, receipt on the branch. The run dropped `records/38852.json` (Irrigation and Water Management, a wrong-page record placing 0 of 13, never loaded); the cause is unread. `summary.json` 140 of 176 extracted passing; live 140 of 168 at 13:20Z. The display build on the branch (`8fbbcfb7a9c0`) changes only those four rows.

## Running a wave (S644)

A wave reads up to eight colleges in one dispatch of `program-requirements-wave.yml` and files them to one branch with one table (`kb/_program_requirements_wave.py`; guard `tests/program_requirements_wave_test.py`). Each college is read by `kb/_program_requirements_college.py`, step by step, as the college workflow reads one. The wave writes no table.

1. **Choose the colleges** as `program_source_registry` names them, each on its own catalog host. The plan job refuses a wave of more than eight, a college named twice, a name the registry does not hold, and two colleges on one host: the catalog's address, the procedure record's catalog step and its named file, a hand-filed copy's `copy_url`, and the vendor host every eLumen (`api-prod.elumenapp.com`) or Coursedog (`app.coursedog.com`) college reads.
2. **Create the branch** `claude/harvest-wave-<wave>` off `main` and dispatch there with `colleges`, `extract`, `limit_usd` and `wave`. The workflow refuses `main` and any other branch name, and a `limit_usd` above 40 (Sam's standing go, `sam-extraction-standing-go-40-per-college-2026-10-14`).
3. **A free trial first** (`extract` `0`, the default): each college captures and prices. The price is `would_extract` times the college's rate, plus 25%. The rate is the mean cost of its filed records with a positive `cost_usd`, errored calls included, and never below 0.08, so a small sample can raise the rate and never lower it (0.08 when no record is priced): `summary.json`'s `cost_per_program` counts calls with no price as programs at $0 and reads low. With `extract` `1`, a college extracts only when the run is its first attempt, its capture answered at least 90% of the pages it listed, it has something to extract, and the price is within the limit. `pages_listed` and `pages_answered` in `capture.json` count every listing call that failed (a nested sitemap, an index, hub, menu, department or child call, a search page) as a page listed and not answered, so a 503 on a listing request holds the capture (the S640 partial capture). The price step files a provisional row first, so a job that stops still shows what it was allowed to spend.
   **The hard stop.** An estimate always has holes, so the wave passes its limit to the extraction as a ceiling (`--ceiling-usd`; the college workflow sets none, so its dispatches are unchanged). The run's actual cost is summed as each call comes back, and once it reaches the limit no further program is sent; a program not sent keeps its filed record and its `sources.json` entry (none when it had none), so the next run sends it, and the row reads `held: reached the limit, N programs not sent`, with the real cost. The calls already in flight finish, so a run can pass the limit by at most six programs' reads, about $0.50 at the harvest's usual $0.06 to $0.08 a program (more for a long program read in parts). A call that carries usage and no price (a fallback model the table does not price) counts toward the stop at the most expensive model's price, and the row and the table show it apart: "$X plus N unpriced calls".
   **An extracting wave runs once.** A re-run keeps the run id and its first commit, and would pay again for what the first attempt read, so the plan and price steps refuse any attempt above 1 with `extract` `1`: dispatch a new wave. The read and file jobs check out the branch's head, so a wave after a wave counts what the first one filed as kept.
4. **Read the one table**, `kb/program_requirements_wave/<wave>.md` (the `.json` beside it names each control number). Each row: would extract, price, extracted, this run's cost (its fresh records plus `kept_passing`, read from the run's own `out/` folder, so a file step that did not finish still shows it; *up to* the price for a job that stopped after pricing), fail to pass, pass to fail (a passing record on `main` that fails or is absent), lost coverage (a passing record placing a smaller share), kept, new, pages answered, and the verdict. **ready**: extracted, no pass to fail, no lost coverage. **captured**: a whole capture, nothing extracted. **held**: a partial capture, a price over the limit, or a pass to fail or lost coverage, for a person to read. **failed**: a step did not finish. A held college's folder is filed so it can be read; one whose file step did not finish keeps the branch's.
5. **Then, for each ready college,** the college workflow on the wave branch: `step=reread college=<name>`, then the display as before. Rereads for different colleges may run together: a load or reread groups by its college, while a read, reconcile or display stays one at a time on the branch. Each job uploads only the receipts it wrote (`kb/receipts/*<run>*`, artifact `receipts-<run>-<attempt>`) before its push, and an upload that fails never fails the job (the push is the gate); a push that fails ten times fails the job loudly, and that artifact is committed by hand before anything else. The wave's own filing push works the same way: on its tenth failure it names the `wave-filed-<run>-<attempt>-<college>` artifacts (kept 90 days), committed by hand before any new wave. The attempt is in each name because a re-run keeps the run id; the filing takes, for each college, the latest attempt that extracted, else the latest, so a capture-only re-run never displaces the paid records. Before the wave's PR merges, a held college's folder is fixed or restored to `main`'s (`git checkout origin/main -- kb/program_requirements_college/<slug>`).

## Moved from the lane (S644)

Verbatim from the lane as it stood before the S644 checkpoint; Los Angeles City's 22 absent records loaded in S644 (run 43333288596), which settles the old NEXT (2), and #3193 took up the wave 3 scorer readings.

**Merged in S640 and S641:** Los Angeles City 203 of 223 (#3155, `adeb83ac`), American River 300 of 335 (#3156, `04d692bf`), Victor Valley 136 of 168, West Valley 120 of 133, Berkeley City 48 of 89, Rio Hondo 276 of 288 (lessons, *Moved from the lane (S641)*).
**The PDF reader (#3135, merged `1ebee603`, S641):** the list-page rule skips a department's award list; `text_sha` fingerprints each window, and a later edition that only moves a program keeps its record with no model call (`moved_unchanged`), from each program's next extraction on. A capture never stamps a record it did not extract.
**The S641 paid reads** (branches off `main` at `17d5ac54`; a verifier read each against `main`'s records before any load). A run's cost is its stamped records plus `kept_passing.json`; `summary.json` `cost_usd` includes older runs.
- **American River (#3156) and Victor Valley (#3161):** done; moved verbatim to the lessons, *Moved from the lane (S643)*.
- **Los Angeles City (#3155, merged `adeb83ac`):** paid run 43212072618, 145 programs, $11.38; 39 fail to pass, 0 pass to fail, none lost coverage; `kept_passing.json` kept 02748, 40593, 40596. Reread 43216110417: 117 replaced, 22 absent (receipt on `main`).
- **College of the Desert stays unread and unproven:** the baseline (`claude/harvest-pdf-baseline-s640`, `919373d6`) read the PDF (476 pages, 51 to extract), and the capture on the new reader (43212020852, `claude/harvest-desert-proof-s641`) found the host unreachable after 1,016 s with the 2,400 s limit in force (receipt `kb/receipts/program_source_procedure_desert_timeout_s641_2026-11-12.sql`): a third failure. Both branches can go (Sam or GitHub deletes them).
**The display run reports missing keys (S643):** run 43310473532 wrote 17,573 of 17,598 statements of build `8fbbcfb7a9c0`, Victor Valley's four included, and exited 1 on 25 *missing*: a display statement whose key matches no `program_requirement_records` row. They are Monterey Peninsula 03653, 22098 and 39361 (missing on every run since 2026-11-09; the table no longer holds them) and Los Angeles City's 22 absent records. **NEXT, in order:** (1) one live read confirms the four carry `8fbbcfb7a9c0` (query: handoff 644). (2) Los Angeles City: whether `step=load` runs for the 22 absent records (18 pass); it would also insert IGETC (19842) and Cal-GETC (44946) as program records, both failing. Until the 22 load or leave the build, and the three Monterey statements leave it, every display run exits 1. (3) College of the Desert by [`blocked_sources`](../blocked_sources.md): the college's other hosts, the publisher's copy, an archive copy, then a comment that mentions `cobi-cto`. (4) Design item, not built: the catalog-year rule.
**San Bernardino Valley, Grossmont, East Los Angeles:** diagnosed, not started ([`harvest_wave3_diagnoses_s639`](../../harvest_wave3_diagnoses_s639.md)). NEXT (5): two scorer readings, one writer, each measured at every college first: a noncredit *Total Hours N-M*, and the electives flag where a step files the catalog's own sentence. NEXT (6): De Anza's tail and the display build.
**DECIDED (the S641 conductor, the second review):** (1) a hold protects only a passing record. (2a) a passing record whose new window covers no more than its extraction window is held (`held_worse_window`, `held_no_gain`; more from a list opening is `held_opens_on_list`). (2b) after any read, a passing record is replaced only by a read that passes at least as well and covers at least as much (`kept_reason`, `kb/_program_requirements_college.py`, #3135 and #3154): a filed record that passes in full (`score.pass` and the live test) stays unless the new read also passes in full (`passes_less`), one that passes only the live test stays unless the new read passes it too, and a read at the same grade or better that places a smaller share of the listed courses (`score.coverage.share`) is `covers_less`; equal coverage replaces. Kept programs go to `kept_passing.json` with both scores; `force` overrides. Found on American River 11566 (15 of 20 placed to 9 of 20). **Open, not ruled:** whether a larger arithmetic fill at equal coverage should keep the filed record; the guard ignores it. (3) "passing" is `passes_live` (`kb/_program_requirements_score.py`). (4) window coverage is compared only with window coverage.
**Parked or displayed earlier:** Hartnell 83 of 94, Delta 200 of 203, Glendale 115 of 226 (parked, `glendale-parked-2026-10-30`), Los Angeles Valley 202 of 215 (parked, `lavc-parked-2026-10-31`); a choose-courses list's printed units are its floor (Sheet 144 card 2): lessons, *Moved from the lane (S639 side session)*.
**Displayed or standing as filed:** Monterey Peninsula 184 of 197, Mt. San Jacinto 116 of 152, Ohlone 146 of 179, Siskiyous, Palomar, Coalinga, Columbia 78 of 82, Las Positas 181 of 193, College of Alameda 35 of 59, Butte 138 of 164: lessons, *Moved from the lane (S639 side session)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**
**Los Medanos (S599-S602, #2889): 44 of 83 passing; parked** until an electives sentence in its own words: lessons, *Moved from the lane (S633)*.
**Redwoods (#2918, #3105): 59 of 73 passing on the branch;** local degrees take CRGE's 21 (`d-redwoods-crge-21-s636`). NEXT: the reread and display. The paragraph as it stood: lessons, *Moved from the lane (S641)*.
**De Anza (S636-S638, #3109): 205 of 221 passing on its 2026-2027 eLumen catalog.** NEXT: the 24 rows with no display; the 15 rows on 2025-2026 removed by the S456 method (Sheet 118 card 1); the display build after this wave's rereads.

From the catalog sweep paragraph: **No record (4):** North Orange Continuing Education, San Jose City, Diablo Valley, Santiago Canyon.

## S644 (SkyWren, the conductor, 2026-11-12 to 13): throughput, a census of the gap, and a wave runner

Sam opened the session at about 23:53Z 2026-11-12, verbatim: *"I want to continue progress on our commons harvesting. we are making great progress but we need to increase our throughput."* Facts below were checked against `origin/main` (`6e8b267d`) and the open PRs at about 01:45Z; a figure marked *as reported* came from the conductor's notes and was not re-read.

**The gap census (#3189, `6b9296d2`).** `kb/_harvest_gap_census.py` on `harvest-gap-census.yml` gives every active program without a passing record one cause and one lever, and proposes the next wave one college per catalog host (`kb/status/harvest_gap_census.{json,md}`). Live at 00:24Z 2026-11-13 (*as reported*): universe 20,282 Active, 13,524 passing by the strict test, 6,758 without. Causes: no closed list 1,604; units unequal 1,207; page not found 940; places none 729; college never read 701; units incomplete 610; no figure stated 423; parked 322; coverage 206; other 16. Teachout (630) and Approved (1,423) programs are outside the universe. The committed snapshot reads committed records only (universe 21,574, passing 14,645) and so does not match the live figures.

**Two passing rules.** The tab counts a record whose arithmetic is equal or unstated as passing; `passes_live`, the kept-passing guard, is equal only on purpose (S641). From committed records: 15,183 of 18,545 by the tab's rule, 14,645 by `passes_live`; 75 pass on the tab while the scorer's own unstated test fails (*as reported*). The conductor first proposed widening `passes_live` and reversed it within the hour, once the test pinned to it was read: a decision that changes a pinned test reverses someone's earlier decision.

**The wave runner (#3191, `6e8b267d`).** Up to eight colleges on distinct hosts in one dispatch, a price gate, a hard stop on actual cost at the limit, verification against `main`, one filing job; version 1 writes no table. Three review rounds plus COBIx's artifact-name finding. The price rate rule was wrong twice before review settled max(0.08, the mean of filed records with a positive cost). The procedure is the section *Running a wave (S644)* above. The first free trial (run 43343741511, branch `claude/harvest-wave-s644trial`) was in progress at 01:42Z.

**The display apply (#3190, `66945e6a`).** Paged before-read, eight parallel writes, the applied record filed from a confirming read, the rollback naming every row sent a write, and a missing key fatal only above max(1% of statements, 30 keys), after S643's Victor Valley run failed on 25 missing keys. Not yet run live.

**Loads (each insert-only, its receipt the rollback).** Los Angeles City `step=load` run 43333288596 at 23:59Z: 22 rows, 18 pass, receipt on `main` (`a0afb88c`), IGETC 19842 and Cal-GETC 44946 included as Active COCI programs there. Santiago Canyon's first read: paid run 43339249633 ($16.98, 222 extracted, 148 pass the machine checks), load 43342030025 at 01:05Z, 192 rows, all unchecked, 149 pass by the tab's rule; receipt on `claude/harvest-santiago-canyon-s644` (#3194). North Orange Continuing Education: paid run 43342034608 ($3.66, 82 extracted, 77 pass), load at 01:22Z, 78 rows, 77 pass; receipt on `claude/harvest-noce-s644` (no PR yet). Model spend this session $20.64, each college under $40 (*as reported*).

**No closed list (#3192, `docs/harvest_no_closed_list_diagnosis_s644.md`).** Of 1,604: 1,274 absent from the Program Course File (half carry the pre-2010 placeholder date), 269 with every listed course retired (146 of 155 noncredit), 36 pending only, 25 retired; 746 local degrees, 375 certificates of 18 or more units, 101 colleges. No join bug, and a refresh fills few. The conductor's decision: read them and check each against the college's own active course list as a separate grade outside the headline; whether that grade counts is Sam's (Sheet 187 card B).

**The scorer (#3193, open at the checkpoint).** The electives sentence a step files, GE steps (ELAC 41097, Pierce 08330), and a noncredit hours reading with no colon, gated to San Bernardino Valley and Coalinga with positive evidence in the record's own section after three review rounds on a free-text regex that still passed constructed pages. A right record on a multi-program page may fail (accepted). A migration is prepared and not applied (`kb/migrations/2026-11-13_s644_carry_basis_electives_fill_words.sql`); the live rescore is a separate reviewed step.

**Dated reads on a runner (#3197, open).** A first-read college's PR cannot go green until the committed display build covers every filed program (`tests/roep_display_test.py`), and the build needs `registry_read.json` and `map_cr_by_course.json` refreshed for the college; a runner job now refreshes them.

**Two new colleges' shapes.** Diablo Valley (#3195): programs listed on www.dvc.edu/academics/explore-our-programs (77 areas, `?page=0..5`), each linking `dvc.elumenapp.com/catalog/DVC2026-2027Catalog/program,<slug>`; about 250 of 260 reachable (an estimate). San Jose City (#3196): 1,294 of 1,529 `coci_program_courses` rows carry "Name (SUBJ) NUM", and no other college carries any (live, *as reported*); `file_code()` reads the form.

**COBIx.** Sam relayed through COBIx his go for COBIx's offers (4:55 PM PT) and for the specialist bots (5:07 PM PT): source scouting, the five-record spot-check after each wave, blast-radius ranking, and the SLO lane after the first paid wave; two read-only bots, a source scout and a wave checker, with the contract on #3111 comment 6840743191 (`kb/harvest_scouting/<wave>.json`, `kb/program_requirements_wave/<wave>.check.json`, the sample drawn by the wave's filing job). Not built at the checkpoint.

**Lessons.** A new workflow file cannot be dispatched until it is on `main`: merge first, then trial on a branch. A regex reading of free catalog text took three review rounds and still passed constructed pages; gating it per college with positive evidence ended it, so do that first. A first-read college PR cannot go green without the display build, so plan the dated reads and the build as part of the read. `get_job_logs` returns the runner's cleanup as its tail; reproduce a lint failure locally.

## Moved from the lane (S645)

Verbatim from the lane as it stood before the S645 checkpoint; the display apply ran live, the #3193 rescore ran at six colleges, and Diablo Valley and San Jose City loaded in S645, which settles the old NEXT (2) to (4).

**The numbered handoff carries the lane** ([`session_645_handoff`](../../session_645_handoff.md)). **DECIDED (Sam, 7:13 PM PT 2026-11-11, relayed by COBIx on #3110; `sam-harvest-next-steps-tonight-2026-11-11`):** "Yes, pick them up tonight." Decisions that stand: `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`.
**DECIDED (the S640 conductor; `d-pdf-reader-design-calls-s640`):** the list rule never lowers coverage; a bare number is a page number only when proven.
**DECIDED (the S641 conductor, 2026-11-12):** equal coverage holds a passing record, fingerprint or not. A text change at equal coverage is answered by a catalog-year rule (a new catalog year reads every record once), never by the per-run fingerprint, which moves on unchanged text and would pay for the same record every run.
**DECIDED (the S641 conductor, the second review; the kept-passing guard):** a passing record is replaced only by a read that passes at least as well and covers at least as much (`kept_reason`, `kept_passing.json`; `force` overrides); "passing" is `passes_live`, equal only on purpose. The rules as written: lessons, *Moved from the lane (S644)*.
**Known costs of the fingerprint, and the proof table:** lessons, *Moved from the lane (S641)*. The PDF reader's merge note, the S641 paid reads, S643's display-run NEXT and the wave 3 diagnoses: lessons, *Moved from the lane (S644)*.
**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
🔨 **Throughput (S644; Sam, 23:53Z 2026-11-12: *"we need to increase our throughput"*).** Record: lessons, *S644*.
**The gap census** (`kb/_harvest_gap_census.py`, `harvest-gap-census.yml`, #3189) gives each active program without a passing record one cause and one lever. Live 00:24Z 2026-11-13: 20,282 active, 13,524 pass, 6,758 do not; the largest causes no closed list 1,604, units unequal 1,207, page not found 940. **DECIDED (`d-passes-live-stays-equal-only-s644`):** `passes_live`, the kept-passing guard, stays equal only (S641); the tab, the census and the headline count equal or unstated (`counts_passing_on_tab`, #3193, merged): 15,183 of 18,545 committed records against 14,645.
**A wave** (`program-requirements-wave.yml`, #3191): up to eight colleges on distinct hosts, one branch, one PR, one filing job, no table written; how: lessons, *Running a wave (S644)*. **DECIDED (`d-wave-one-branch-hard-stop-s644`, COBIx agreed):** $40 a college on the estimate and by a hard stop on actual cost; a re-run never extracts. **DECIDED (`d-wave-price-rate-floor-s644`):** the rate is max(0.08, the mean of filed records with a positive cost). First free trial (43343741511, $0): Feather River and Palo Verde captured whole, Copper Mountain held.
**The display apply (#3190, not yet run live):** paged before-read, eight parallel writes, the record filed from a confirming read. **DECIDED (`d-display-missing-threshold-s644`):** a missing key is listed, fatal only above max(1% of statements, 30); the rollback names every row sent a write.
**Loaded in S644** (insert-only, each receipt the rollback): Los Angeles City's 22 absent records, 18 pass (**DECIDED** `d-lacc-22-absent-loaded-s644`: IGETC 19842 and Cal-GETC 44946 included, both Active there); Santiago Canyon 192 rows, 149 pass (receipt on #3194's branch); North Orange Continuing Education 78 rows, 77 pass (receipt on `claude/harvest-noce-s644`).
**DECIDED (`d-no-closed-list-separate-grade-s644`):** the 1,604 programs with no closed list (#3192: no join bug) are read and checked against the college's own active course list as a separate grade outside the headline. **DECIDED (`d-hours-reading-gated-sbv-coalinga-s644`):** #3193's no-colon hours reading reads only at San Bernardino Valley and Coalinga, with positive evidence in the record's own section. **DECIDED (`d-dated-reads-runner-job-s644`):** a college PR's dated reads refresh in a runner job (#3197, merged); plan them and the display build as part of a first read. **DECIDED (`d-cobix-offers-specialist-bots-s644`, Sam's go relayed by COBIx):** COBIx scouts sources, spot-checks five records after each wave and ranks by blast radius; two read-only bots (source scout, wave checker), not built.
**Sam (relayed by COBIx, #3111 6840755612):** the new apply's first live run waits for his explicit go; after it the 2026-10-10 go covers a display after a load that passed its checks. **DECIDED (`d-santiago-canyon-display-held-s644`):** Santiago Canyon's display is held: its PDF prints the control number after each program, so a transfer degree is filed under the preceding local degree (COBIx, #3194 6841001207); its 192 live rows stay. **Headline, live 02:24Z 2026-11-13:** 14,196 of 20,282 active programs complete by the tab's rule, at 116 colleges (two new tonight). **Waits for Sam ([Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA), current):** the first display run's go; 4, does the course-list grade count in the headline; 5, a statewide Cal-GETC of 34 units (93 more programs pass).
**NEXT, in order:** (1) The PDF control-number finding (`claude/harvest-pdf-control-number-s644`, unfinished): agreement of heading and filed program at every PDF college, the reader fix (bind a window by its printed number), a failing reason for a heading of another award type, Santiago Canyon's reread. (2) North Orange alone (`claude/harvest-noce-ship-s644`), its display on Sam's go. (3) #3196 on green, then San Jose City's free capture; Diablo Valley's capture (`claude/harvest-diablo-valley-read-s644`), price, paid read. (4) #3193's rescore as a reviewed step. (5) Feather River and Palo Verde paid in a new wave; Copper Mountain's empty capture. (5) COBIx's scout file and #3198 to answer; the sample in the filing job; census follow-ups. (6) College of the Desert by [`blocked_sources`](../blocked_sources.md); the catalog-year rule; De Anza's tail; Redwoods' reread.

From the catalog sweep paragraph: **No record (2):** Diablo Valley (#3195) and San Jose City (#3196); Santiago Canyon and North Orange Continuing Education were read and loaded in S644 (Throughput, above).

From the Phase 2 paragraph: S644 asks him whether it still stands ([Sheet 187](https://claude.ai/artifact/BbNrMfhrjxCx1hNhT9ACnA) card 3, current).

From the lane's standing decisions, verbatim (S645):

**DECIDED (the S640 conductor; `d-pdf-reader-design-calls-s640`):** the list rule never lowers coverage; a bare number is a page number only when proven.
**DECIDED (the S641 conductor, 2026-11-12):** equal coverage holds a passing record, fingerprint or not. A text change at equal coverage is answered by a catalog-year rule (a new catalog year reads every record once), never by the per-run fingerprint, which moves on unchanged text and would pay for the same record every run.
**DECIDED (the S641 conductor, the second review; the kept-passing guard):** a passing record is replaced only by a read that passes at least as well and covers at least as much (`kept_reason`, `kept_passing.json`; `force` overrides); "passing" is `passes_live`, equal only on purpose. The rules as written: lessons, *Moved from the lane (S644)*.

Glendale's line as first written at the S645 checkpoint: **Glendale unparked (Sam, 6:33 PM PT 2026-11-12, `sam-glendale-unpark-2026-11-12`):** it reads its 2026-27 Coursedog catalog (`glendale_peoplesoft_direct`). **DECIDED (`d-glendale-registry-coursedog-s645`):** registry row and procedure record v1 written 02:52Z (md5 `47c9a5f92f56e985aaadbf2be9a2a236`, was none); receipt and rollback on #3202. The first capture listed 261 programs and read none; a diagnostic and a transfer-degree code fix (`f02dcb9e`) went out with a second capture.

Three closing paragraphs of the lane, verbatim (S645):

**The second reader, Grok** (Sheet 97 card 1; built S421, #2246) waits on the xAI billing moving to the RCCD district card and two Edge Function secrets only Sam sets: lessons, *Moved from the lane (S530 compaction)*.

✅ **A light index, full records by key or by college** (S384; the index reads stored columns, S405, guard `tests/program_requirements.test.js` 6e): lessons, *Moved from the lane (S641)*.

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1).** Confirm or Needs a fix writes `program_record_verdicts` through `program_record_verdict_add`; a trigger keeps a person's reading across a reload. Detail: lessons doc, *Moved from the lane (S356 compaction)*.

## Running a display, one college first (S645)

`step=display` on `program-requirements-college.yml` applies the build that `cpl_pathways_roep_data.js` carries on the dispatch ref, and it writes every statement in that build: the skip test is the build stamp, so a row whose content did not change is still written when its stamp moves. Before #3204 the step ignored `college`, so a first live run could only go out on the whole build (17,676 statements at 115 colleges for `38a0fd8ed41f`).

1. **One college first.** Dispatch on `main` with `step=display display_college="<name>"` (#3204). The job runs `kb/_build_roep_display.py --apply --college <name>` and files `kb/receipts/program_requirement_records_display_<date>_<build>.applied_<run>_<college-slug>.json`. Confirm live with one SELECT grouped by `display->>'build'`: the college's count at the new build, nothing else moved. S645: run 43358665534, North Orange Continuing Education, 78 of 78 written in under two minutes.
2. **The count gate.** The whole build goes out only after the live count matches the scoped record (78 at `38a0fd8ed41f`), because the job stays green with up to max(1% of statements, 30) missing keys (`d-display-missing-threshold-s644`) and so cannot be the gate itself. Before it: no row with a display lacking a build key, and the receipts of every build still live on `main`.
3. **The whole build.** Leave `display_college` empty. S645: run 43358971128, 17,595 planned and written, 78 already current, 3 missing (Monterey Peninsula 03653, 22098, 39361), 0 errors, 5 min 36 s. Leave about an hour clear of the daily runs (06:17, 09:17, 12:17 UTC); a serial apply once took 69 minutes.
4. **The rollback.** Each applied record names every row sent a write and its prior build: rows that had no display go back to null by a guarded update over the keys it lists, and the rest return by dispatching `step=display` on a ref carrying the prior build (`8fbbcfb7a9c0` for S645's run).
5. **Post** the record, the receipt and the minutes on #3111 (Sam's ruling, `sam-first-display-run-explicit-go-2026-11-12`).

Merging a college PR publishes its display build: the page reads `cpl_pathways_roep_data.js` from `main` through Pages. COBIx's five-record spot-check therefore comes before the merge (`d-merge-is-publication-spot-check-first-s645`).

## S645 (SkyFinch, the conductor, 2026-11-13): the first live display runs, the rescore, two first reads

Sam opened S645 at 02:31Z 2026-11-13 with handoff 645's line. Through COBIx (#3111 comment 6842097699, COBIx chat 6:33 PM PT 2026-11-12) he gave his go for the first live display run and for unparking Glendale; on #3198 he ruled 72 districts plus Calbright and three SIS pilots (Los Angeles CCD, Citrus, Riverside CCD). In session he wrote one line, verbatim: *"FYI got an sql approve request you should have with for already"* (`execute_sql` was on the allow list; `docs/reference/approval_prompt_hooks.md`).

**Merged on a green `test`:** #3196 (`048d3fc7`, San Jose City's stored course codes), #3200 (`f74434c7`, North Orange Continuing Education; the fix was a `COLLEGE_NAMES` entry in `kb/_build_commons_status.py`), #3204 (`867a46f6`, the `display_college` input).

**The display, live.** The scoped run and the whole build, above. Live at 03:40Z: 17,673 rows at `38a0fd8ed41f` (115 colleges), 280 with no display (Santiago Canyon 192, held; Diablo Valley 88, loaded tonight), 16 at `0874a3a15f22`.

**The #3193 rescore at six colleges.** Each college on its own `claude/harvest-rescore-<slug>-s645` branch: `step=reconcile extract=0`, then a compare gate (`compare(load_records(main), load_records(branch))` in `kb/_program_requirements_wave.py`), then `step=reread extract=0 force=<the reconcile run>`. The gate found no pass to fail or lost coverage and restored three record files from `main` (Solano 38591; ELAC 08252, 02430). Live at 03:44Z: 126 replaced (Coalinga 5, Grossmont 30, Pierce 17, Solano 18, San Bernardino Valley 27, ELAC 29); passing on the tab Coalinga 45 to 49, ELAC 92 to 103, Grossmont 99 to 123, Pierce 162 to 163, San Bernardino Valley 146 to 161, Solano 112 to 119, 62 in all. The reconcile path has no kept-passing guard, which is why the gate runs before the reread. The migration `kb/migrations/2026-11-13_s644_carry_basis_electives_fill_words.sql` was not applied: the push of its `.apply` change was refused by the auto-mode permission check, and no verdict row exists at the six, so it changes nothing for these rereads. #3207 carries the six branches and a display build (`1efcc13ee048`).

**First reads.** Diablo Valley: paid read 43353452924, 90 extracted, 81 pass the machine checks, $5.63, 115 not found; load 43357065225 inserted 88 (08013, 41233 place none of their courses); #3205. Its first dated reads failed at verify because the branch's Cuesta predated #3200's refresh; merging `main` fixed it. San Jose City: free capture 125 programs, 84 to extract; paid read 43357106423, 84 extracted, 50 pass, $6.63; load inserted 77 of 84; #3206. Spend $12.26, each college under $40.

**Glendale.** Registry row and procedure record v1 written 02:52Z (md5 `47c9a5f92f56e985aaadbf2be9a2a236`, was none), receipt on #3202. The first capture (run 43355259728) listed 261 and read none: no overview named a Requisites or Requirements tab. A diagnostic and a transfer-degree code fix (`f02dcb9e`) went out with a second capture.

**The PDF reader (#3201).** Two review rounds (23 findings, then 17) replaced the detector-driven design. The conductor's decisions 13 and 14: gate the reading per college by its own evidence (Santiago Canyon's proof capture, run 43360377086: 182 programs print the number after, 0 before; ELAC's proof matched `main`'s reader on all 143 picks); in a uniform catalog bind by the number line alone; refuse only when the block's first strict heading names another listed program; a number that does not print is `not_found`; never drop a filed record. A title test in the first rebuild refused 17 passing records, 16 of them right.

**Lessons.** A `--check` on a committed snapshot couples every college PR to one generated file; write it from a dispatch-only job, as the gap census does. A title test refuses right blocks in a catalog whose number lines all vote one way. The display step writes the whole build, so a first live run needs a one-college input. A dated-reads job fails its verify unless the branch carries `main`'s latest refresh. A wave over colleges whose records are all filed extracts nothing. Merging a college PR publishes its build.

## Moved from the lane (S646)

Verbatim from the lane as it stood before the S646 checkpoint; #3201 merged, Diablo Valley's listing read and loaded, and Glendale's challenge rules were built in S646, which settles the old NEXT (1), (3) and part of (4).

**Loaded in S645** (insert-only, each receipt the rollback): Diablo Valley 88 of 90 (08013, 41233 place none of their courses; #3205, build `3ad0a842ce11`); San Jose City 77 of 84 (#3206). Both unchecked, both wait on COBIx's spot-check before merge. **DECIDED (`d-dv-sjcc-loaded-s645`).** Diablo Valley's listing: #3208.

**The PDF reader (#3201, draft, rebuilt):** Santiago Canyon's PDF prints the control number after each program. **DECIDED (`d-pdf-reader-number-line-design-s645`, decisions 13 and 14):** the reading is gated per college by its own evidence (Santiago Canyon 182 after, 0 before); in a gated catalog with uniform votes the number line alone binds a block, refused only when its first strict heading names another listed program; a number that does not print is `not_found`; a filed record stays on file whether forced or not, and the account names it; the snapshot is written by `harvest-gap-census.yml`, with no `--check`.

**DECIDED (`d-santiago-canyon-display-held-s644`):** Santiago Canyon's display stays held (#3194); its 192 live rows stay.

**Glendale unparked (Sam, 6:33 PM PT 2026-11-12, `sam-glendale-unpark-2026-11-12`):** it reads its 2026-27 Coursedog catalog. **DECIDED (`d-glendale-registry-coursedog-s645`):** registry row and procedure record v1 written 02:52Z; receipt and rollback on #3202. Its first capture listed 261 programs and read none; a fix (`f02dcb9e`) went out with a second capture.

**NEXT, in order:** (1) #3201 (head `44f7101a`, decision 15 building): one reader on it, a Santiago Canyon free capture on its proof branch, merge on green, `main` into #3194's branch, a capture, the paid reread forcing 29 numbers ($5 to $7). (2) COBIx's spot-checks of #3205, #3206, #3207, then each merges on green, later ones rebuilding. (3) #3208 (Diablo Valley's slash-form links): read its capture, review, merge, a paid read within $40. (4) Glendale (#3202): its second capture's diagnostic, the reader fix, a paid read within $40. (5) The migration, on Sam's go. (6) COBIx's district files, the phase 0 builder; the CMS probe (#3198). (7) The wave's fixed-rule sample; census follow-ups; Copper Mountain. (8) College of the Desert by [`blocked_sources`](../blocked_sources.md); the catalog-year rule; De Anza; Redwoods.

**The #3193 rescore, live at six colleges (#3207, draft).** 126 rows replaced (Coalinga 5, Grossmont 30, Pierce 17, Solano 18, San Bernardino Valley 27, ELAC 29), 62 fail to pass, none pass to fail; receipts with before-values on the rescore branches. **DECIDED (`d-rescore-six-colleges-live-s645`):** the gate restored three record files from `main` before the reread (Solano 38591; ELAC 08252, 02430); the rereads ran without the migration, since no verdict row exists at the six. The migration `kb/migrations/2026-11-13_s644_carry_basis_electives_fill_words.sql` waits for Sam ([Sheet 188](https://claude.ai/artifact/QmQVY3yBfeL8dXqQUFouCZ), current): the push of its `.apply` change was refused by the permission check.

**The display apply runs live (#3190, #3204).** `step=display` writes the whole committed build; the `display_college` input runs one college (`--apply --college`). First live run 43358665534 on `main`, North Orange Continuing Education alone: 78 of 78 written. Whole build 43358971128: 17,595 written, 3 missing (Monterey Peninsula 03653, 22098, 39361), 0 errors; live 03:40Z: 17,673 rows at build `38a0fd8ed41f`, 115 colleges. Applied records in `kb/receipts/`, each the rollback. How: lessons, *Running a display, one college first (S645)*. **DECIDED (`d-display-first-run-one-college-s645`):** a new apply's first live run goes out on one college, the whole build after its record is confirmed. **DECIDED (`d-merge-is-publication-spot-check-first-s645`):** merging a college PR publishes its display build (`cpl_pathways_roep_data.js` to Pages), so COBIx's five-record spot-check comes before the merge. `d-display-missing-threshold-s644` stands.

**Sam's go (relayed by COBIx, #3111 6842097699; `sam-first-display-run-go-2026-11-12`):** given for the first run; after it the 2026-10-10 go covers a display after a load that passed its checks, each run posting its record, receipt and minutes on #3111.

**Parked or displayed earlier** (Glendale and Los Angeles Valley parked; a choose-courses list's printed units are its floor, Sheet 144 card 2): lessons, *Moved from the lane (S644)*.

**Displayed or standing as filed** (eleven colleges, Monterey Peninsula to Butte): lessons, *Moved from the lane (S644)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**

**Los Medanos** (parked), **Redwoods** and **De Anza** (open; their NEXT is Throughput's (6)): lessons, *Moved from the lane (S644)*.

**Standing decisions of S640 and S641** (the list rule never lowers coverage, `d-pdf-reader-design-calls-s640`; equal coverage holds a passing record; the kept-passing guard, `passes_live` equal only): lessons, *Moved from the lane (S645)*.

**Known costs of the fingerprint, and the proof table:** lessons, *Moved from the lane (S641)*. The PDF reader's merge note, the S641 paid reads, S643's display-run NEXT and the wave 3 diagnoses: lessons, *Moved from the lane (S644)*.

From the wave line (S645): Wave s645a: Feather River and Palo Verde had nothing to extract (all filed); Copper Mountain held again.

From the catalog sweep paragraph (S646): **Every credit college now holds records;** Diablo Valley and San Jose City loaded in S645 (above).

## S646 (SkyOriole, the conductor, 2026-11-13): the PDF reader merged, Diablo Valley to 213, Glendale read slowly

The night's first firing of the CPL Queue routine (06:12Z), on handoff 646; Sam was not in session and no sheet carried a reply.

**Merged on a green `test`:** #3208 (`4c79f88d`, Diablo Valley's slash-form award links; 214 of 244 found), #3201 (`e1f52690`, the PDF reader, its number-line binding gated to Santiago Canyon).

**The PDF reader's fourth round.** The round 4 reader found two majors in decision 15: a refused block was filed as an empty read page, so `file_run` dropped the old record; and the own-heading test was a token subset, so "Art History, AA" read as "Art, AA"'s heading. Decision 16(a) files a refused block under its own method `refused` (no text, no coverage, listed in `refused_passing`). Decision 17 makes an own heading the full title with the same award by normalized equality, a wrapped heading of two or three lines allowed with end-of-line hyphens rejoined. Decision 16(b) had `file_run` keep any filed record a bound read did not replace, at every college; the second reader showed it kept a dropped program's stale record displayed and loaded under the new catalog year, stopped a reread clearing a wrong record and stopped a person's force. Decision 18 removed it: `file_run` describes one read, and `extract`'s existing carry-forward protects the PDF route, proven end to end by a test. Final proof run 43381048821 on the proof branch: 204 bound (195 to 208 expected), 12 refused, 14 not found, 7 `refused_passing`, 3 `forced_unbound` (37073 and 42990 low coverage; 11909 a heading not its own), and 26 of 26 long-title refusals recovered by the wrapped-heading match. Follow-ups, minor and all refusals but the first: "Commercial." + "Music, AA" counts as Commercial Music's own heading; "Pre-" + "Engineering, AS" misses Pre-Engineering; "Spanish, AAT" and "Fire Technology, Certificate" fail to match.

**Diablo Valley.** Paid read 43379378196 on the new listing: 214 found, 214 extracted, 197 pass, 22 fail (arithmetic 12, coverage 6, invented 4), 11 not found; $13.85 ($0.0647 a program). The compare found 0 of 81 previously passing worse. Load 43384856022: 125 inserted, 88 kept, 1 skipped (08013); live 213 at 07:28Z (was 88). Insert-only; the receipt's rollback is a delete limited to `checked = false`. `step=reread` 43386030975 replaced none (125 kept). Display build `90ef35707409` on #3205 (replacing `3ad0a842ce11`, never applied), not applied: it waits on COBIx's spot-check (01476, 01493, 16919, 30737, 39367), the merge, then `step=display display_college="Diablo Valley College"`.

**Glendale (#3202).** The Coursedog catalog answers a bot-check page under load. The conductor's rules: a challenge page is answer kind `challenge`, a refusal never passed; a program whose own page was challenged reads `page_challenged`; `route=challenged` rereads only refused codes at 12 s and `route=slow` reads the whole catalog at 12 s, each stopping at the first challenge, and a stopped read is never extracted; a GE pattern page (CALGETC) is a candidate only for that pattern's own program; two different Active programs never share a page on a title tie (the page goes to the program its heading names; Coursedog tab only; no other college's winner changed), while an Active record beside its Teachout Only record still shares; `extract` carries a `page_challenged` or stopped program's filed record forward, at every college. `page_claimed` and `not_found` are not carried in code: `kb/_program_requirements_compare.py --college <name> [--base <sha>]` lists passing-on-main records absent or failing on the branch, and the conductor reads it before any load. Free reread 43379067418 (`route=challenged`): 34 asked, 34 read, no challenge. The first `route=slow` paid dispatch crashed before filing (UnboundLocalError, $0): the tests called `_cd_read` directly and never ran `capture()`; they now run `capture()` per route. A free reread cannot feed a paid read, since no capture keeps page text. The second `route=slow extract=1` went out about 07:15Z on `727d15e4` (about 1 h 45 m of loading, estimate $7 to $14, ceiling about $24): PENDING.

**Santiago Canyon (#3194).** Free capture 43386345303 on its branch: 204 bound, matching the proof. Paid read dispatched 07:45Z (about 67 programs, about $5.13), filed `6fe85ba1`: PENDING.

**Lessons.** A guard added at a step every college shares changes every college: gate it, or read why the pinned test exists (S644's lesson, a third time). A new route's tests run it through `capture()`, and the reader is briefed before the paid dispatch. A bot-check page is a refusal the reader records and never passes. The filing step describes one read; carrying a record forward is `extract`'s job.
