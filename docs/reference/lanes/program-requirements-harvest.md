---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-10-17
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
 - "[[CLAUDE]]"
 - "[[docs/reference/lanes/sierra-retrieval-corpus]]"
 - "[[docs/program_requirements_harvest_lessons]]"
---

# Program requirements harvest

**What this lane is:** for every active program at the 115 credit colleges, a
record of how its courses count toward the award (required, choose N courses or
units from a list, open elective), the program total, the catalog year and the
source, plus the recommended term sequence where a college publishes one. From
it: which courses a learner qualifies for through CPL, and the units saved.

## Status

🔨 **Phase 0 (the census) built (S320, #1836; reader corrections S321-S322),
and the registry filled by apply on `main`.** Sam's three
statements that opened the lane are verbatim in the vault:
`CPLBrain/03-professional/braindumps/braindump-2026-10-03-1433-program-requirements-from-local-catalogs.md`.
The plan is a Claude Doc Sam edits and comments on:
[Program Requirements Harvest Plan](https://claude.ai/code/artifact/77ae8cb2-443b-45e3-b287-594c9c9b8744).

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

**The census** (`kb/_program_source_census.py`, `program-source-census.yml`): reads each college's homepage on a runner, scores and dates its catalog link, applies weekly on `main` (Sundays 10:29 UTC). Its rules, politeness limits and governance note: the lessons doc, *Moved from the lane (S334 compaction)*. Guard: `tests/program_source_census_test.py`.

**Sam's rulings (2026-10-03):** build our own best version now; the Butte
College Tech Center's COCI ROE fields are a parallel track, never a gate
(*"working on that end is often a slog or dead end"*); start from use cases and
test against real catalog pages; a per-college source registry kept current by
agents; a per-college tab; an agent per college that the college and the MAP
team own and train. S320: "Go" on the registry table as described (its
history, its one write path, a public read); "Approved" on the push that adds
the weekly apply.

**Sam's sheet 23, 25 and 26 rulings** (the pilot's shape, who checks it, runners reading slowly): the lessons doc, *Moved from the lane (S335 compaction)*.

**Measured (2026-10-03):** the Program Course File names every course a program lists (the closed list each record is checked against) but marks none required. Detail: lessons, *Moved from the lane (S334 compaction)*.

**The pilot (Phase 1): all 20 records pass all four checks** (Cerritos, Mt. San Antonio, Riverside City, West LA, Miramar; Sam read them, 18 matched and both fixes went in). Capture `kb/_program_requirements_pilot.py`, extraction the `program-requirements-extract` Edge Function, scorer `kb/_program_requirements_score.py`; guard `tests/program_requirements_pilot_test.py`. Detail: the lessons doc, *Moved from the lane (S372)*.

**The sequence pass (S325) and a refused mapper host:** lessons, *Moved from the lane (S394 compaction)*.

**A refusal is on the college's record (Sam, sheet 29 card 3):** the agent notes the limitation and keeps looking, and asks no one for access; `program_source_registry` carries `sequence_host`, `sequence_access`, `sequence_note`, `sequence_checked_run`. ⚠️ **A workaround is another public source, never the same refused host under another name**: the reader keeps the census user agent that names the CPL Initiative. Detail and the 25 colleges filed: lessons, *Moved from the lane (S386 compaction)*.

**Sam's ruling (2026-10-04, 11:1xZ, in chat):** *"No need for governance at this
point. Everything is public record and we can mark the tab and contents as beta
draft."* The harvest's tab shows its records without a Governance pass, marked
**Beta draft** (vault braindump
`braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). Then:
*"Integrate Sierra in the tab design."*

**The tab is in COBI** (Beta draft, #1860, Reference & Curation): `program_requirements.js` ports the approved mock-up ([v3](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), Sam: *"mock up looks good"*) and reads `program_source_registry` and `program_requirement_records` live. Four views: Catalogs, Program records (the four checks; the display build's CPL figure), Sequences, and Procedures (each college's procedure record). Sierra docks at the top (sheet 38 card 5; Sam: *"Sierra at the top"*): a collapsible Sierra AI section mounts the CPL Assistant (`CPL_CHAT.mountInto(host, "program-requirements")`); `cpl-chat` reads the surface as unscoped until `KNOWN_SURFACES` names it (a deploy). Cerritos's Ironworker A.S. reads 0 MAP credit recs (its credit is exhibit articulation, in CER).

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, *Moved from the lane (S394 compaction)*.

**Sam's sheet 29 (2026-10-04):** Sierra says "required", names each choose block and gives the printed total for a checked program, citing the catalog and its year (live, smokes 7l and 7q).

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
[CPL Pathways ROEP](https://claude.ai/artifact/8hkej9jHsmLRX6cZYxrXbM). ✅ **Ported (S334):** the pathway selector lists every catalog record (Beta draft); each opens By requirement (tiles, an option fork, CPL in three kinds in words, the checks, the outcomes, the gaps read-only) or By term (the map's status, every course in the tray), for the College or Student or public viewer. Guard `tests/cpl_pathways_roep_view.test.js`; a11y targets `cpl-pathways-roep` and `-dark`.

**Sam's sheet 32 (2026-10-04):** a program shows "up to" plus the recommended path's figure, each course carries CPL in three kinds (articulated here, could adopt, for consideration), and catalog-and-state-file differences go to the college as drafts on the harvest tab and My College while the MAP team sends. Verbatim: lessons, *Moved from the lane (S386 compaction)*.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04 18:03Z):** grab published course and program outcomes, and compare harvested credential skills with course outcomes. 🔨 **Course outlines (Sam, 2026-10-12, `sam-capture-cor-system-link-2026-10-12`):** capture each college's course outline of record system link so the harvest reads course SLOs, for the skills match and for faculty assessment of CPL. Record shape 3, Sheet 70's rulings, the registry's `cor_*` fields, the census, the index and how each host prints its SLOs: lessons, *Moved from the lane (S376 compaction)* and *(S380 compaction)*. ✅ **`course_outcomes` is live** (Sam pasted `chatbox/supabase_course_outcomes.sql`, Open Asks Sheet 72 card 1; public read, insert-only `course_outcomes_load()` on the service role, a receipt per load). **Loaded, nine colleges, 7,450 courses, 20,891 SLOs** (live read, S388; by college: lessons, S398 compaction). `catalog=<slug>` in `kb/course_outcomes/.run` picks either form; each load is insert-only with a receipt naming its rollback. COBI shows the SLOs on Program records' course rows and in COCI Lookup (#2116, Sam 2026-10-14). The skills comparison waits for `kb/reference/industry_credential_skills.json` (not started).

**CSU LA:** later, after the CCC procedure settles (Sam, sheet 33 card 3; lessons, S336 compaction).

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings:** lessons, *Moved from the lane (S336 compaction)*. ✅ **The Progress view (S343, #1900):** the tab's first view, from the mock-up Sam approved (*"The mockup looks good to go"*). `MILESTONES` and `PARTS` at its top are definitions; the tables are read live; what anon cannot read comes from **`kb/queue_status.json`**, written at every checkpoint (step 12, `scripts/queue_status.py`), never from a widened policy. Detail: lessons S343. Every count opens what it totals; a card waiting on Sam links where he answers (#2077); a call in `kb/queue_status.json` must carry its answer link (`link`, `view` or `records`) and may name its card (`part`). **Whole harvest** (Sam, 2026-10-13): five parts, confirm left out; `queue_status.py --harvest` stamps it. **NEXT:** ① Re-read Schedule+ for Spring 2027 once its IWAP sections post. ② The film: re-render when a ladder line it shows changes. ③ The addenda reading agent after the 2026-10-11 apply; Miramar's map (`read: 1`); Butte's ROE definitions; every loaded college holds a procedure record (S395). Maps: 3 of 32 read, 24 mapper hosts refused (lessons S345). Refresh the builder's two dated reads when the harvest adds a college. Later (Sam, ~20:02Z): every program with ROEP in a SkyView view ([skyview lane](skyview-ccr-interface.md)).

**Sheet 50 and the maps it settled (S346-S347):** the lessons doc, *Moved from the lane (S353 compaction)*.

🔨 **Phase 2, a college at a time: eighty-four colleges hold records (11,742, 32 checked; S403), every new record unchecked until read.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` reads a CourseLeaf catalog by its sitemap, a whole-catalog PDF once with each program's run of pages (S403), and a curriQunet catalog by its own JSON (`cq_index`, `cq_page`; a catalog id from the host's `_getCatalogs` when the start page names none); `assign()` gives a page to the programs whose award and title it names most fully. A push reads only on `[read]`/`[extract]`; a dispatch runs `step=read`, `load` or `display`. The load is insert-only and commits a receipt naming every inserted key, which is the rollback; a record placing none of its listed courses (another program's page) stays out of the load and the display build. **Loaded:** the newest wave is the catalog sweep's, below; the earlier waves' names and counts: lessons, *Moved from the lane (S399 compaction)* and S401. Procedure records come from `kb/_program_source_procedure_v1.py` (#2146); an existing record gets a v2 merged in SQL. **Display:** each build applies through the display job, which files each row's prior build (the rollback); Sam's standing go (2026-10-10) covers a build that follows a load. **Extraction runs with no card up to $40 a college** (Sam, 2026-10-14, S393; `sam-extraction-standing-go-40-per-college-2026-10-14`); above $40 it is a card. The display job applies the build `cpl_pathways_roep_data.js` carries: run `kb/_build_roep_display.py` and commit its two outputs before dispatching (lessons S385). A program pointing at a retired version of a course the college still offers lists it, placed, no flag (Sam, 2026-10-11, Cerritos 02226). A college must be in the builder's dated reads (`kb/program_requirements_pilot/`, `registry_read.json` and `map_cr_by_course.json`) before its display is built; ✅ Modesto and Palo Verde's dated reads, loads and build (S385, #2094): lessons. Palo Verde's noncredit pages and its pages that print the degree total with general education (S386): lessons. Sheet 81's rulings, the 3,797-row build and Palo Verde's year-behind catalog: lessons, *Moved from the lane (S398 compaction)*. Sheet 78's carry-out, record shape 5, the re-read path, the Palo Verde, Cabrillo and Southwestern re-reads (S389): lessons, *Moved from the lane (S392 compaction)*. 

🔨 **The reconcile pass (S392; Sam, 2026-10-14: "a secondary search of the catalog text to see if we can reconcile after the initial PR harvest", each catalog's own steps; `cpl_memory` `sam-reconcile-pass-after-harvest-2026-10-14`).** `kb/_program_requirements_reconcile.py` applies a college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call); each change names the words it came from. Orange Coast's and Monterey Peninsula's steps, Cabrillo's and Cerritos's, and Sheet 85's rulings on them (Sam, 2026-10-16, `sam-sheet-85-rulings-2026-10-16`; Victor Valley 37006 and 38352 stay as read, unchecked, shown and flagged): lessons, *Moved from the lane (S402 compaction)*.

🔨 **The catalog sweep (S394-S403; Sam's aim of 2026-10-14: every catalog, then curated audit sweeps).** One branch per college, never two on one host; a wave branch merges the loaded ones, their dated reads and one display build. A free capture-only read (`extract=0`) comes first wherever a host's shape is new to the reader, and a free page read of the host's own outline (`kb/college_reads/`) before any reader change. **Dispatch every read with `college=`:** a push names no college, and the read and load jobs stop at their first step (lessons S402). Extraction runs under the $40 go (waves 1-5 about $510; the eLumen wave $41.06; S402 $13.57; the PDF wave $149.41 for fifteen). **The PDF reader (S403; #2189, merged with East LA's in #2192, build `726bde512dfa`, 11,862 programs):** a registry row naming one PDF file, or a procedure record whose catalog step is a PDF, is read whole, once. A page qualifies for a program when it carries every title word outside its contents lines or prints the program's control number; the highest-scoring page (listed codes, +5 for a heading naming title and award, +10 for the control number) whose run covers the list wins, and the text opens at the heading while that keeps every listed code (lessons S403, the merge). Sixteen PDF colleges loaded unchecked (the list: lessons S403). **Cerro Coso's robots.txt disallows its catalog PDF** (run 39005930970): on its record, never retried under another name. **The outcomes check on PDF text was the spaced line-break hyphen** (*"tech - nicians"*): with the scorer's fourth reading, reconcile runs took LA City's failures from 145 to 12 and Pierce's from 85 to 15, and the rereads replaced 156 and 94 rows (39018615618, 39018617236). **A reconcile never rescores a record on a page other than the one it was extracted from** (S403): 29 LA City and 20 Pierce rows were, before that guard. **Own-HTML catalogs (S404, #2194)** take the generic sitemap road: College of San Mateo loaded 55 unchecked (60 of 64 found, $4.98, build `928577b30f0f`); Display build `928577b30f0f` applied (run 39030423266, 12:24Z); Skyline's extraction is run 39029362587. Los Rios's four hosts serve the reader 404 and stay unread (lessons S404). **What is left: 33 colleges hold no record.** By the catalog: 19 print their own HTML (the census's 18 plus West Valley), CCSF publishes a PDF by section, and four publish one PDF the registry now names (Copper Mountain, San Diego Continuing Education, Porterville, Solano; Sheet 88), Cerro Coso refuses, Crafton Hills and Taft run SmartCatalog, Hartnell and Merced Coursedog, North Orange Continuing Education and San Jose City CourseLeaf, Diablo Valley and Santiago Canyon eLumen. ✅ **Five registry rows corrected (Sam, Open Asks Sheet 88 card 1, 2026-10-17; applied S405, `kb/receipts/program_source_registry_sheet88_five_catalogs_2026-10-17_s405.sql`):** Copper Mountain, San Diego Continuing Education, Porterville and Solano now name their 2026-2027 catalog PDFs (`single_pdf`, read by the PDF reader as they stand); West Valley names its own HTML catalog (`custom_html`, the generic sitemap road). ✅ **The 49 rows rescored on a moved page are restored** (Sam pasted the S403 undo, Sheet 88 card 2; read back 2026-10-17: LA City 96 on run 39006380342 and 127 on 39018419466, Pierce 99 on 39006383070 and 74 on 39018421038). **Parked for the reader:** Diablo Valley (0 of 244: its hubs grid departments by award, run 38999074345), Santiago Canyon (its eLumen host serves 2025-2026; the harvest reads the current catalog, Palo Verde S387; a narrower page read must show its Catalog Archives and printer PDF links), Sierra, Foothill, San Jose City, MiraCosta, Orange Coast's 27 empty records, Reedley, Palomar, Ventura and Oxnard (lessons, S399 compaction). **NEXT:** Skyline's read, then Cañada and the other own-HTML catalogs that answer the reader, and the four corrected PDFs and West Valley; procedure records for LA City, Pierce and San Mateo.

🔨 **The Records view loads by college (S384; Sam, 2026-10-13, `cpl_memory` `sam-records-load-by-college-filter-2026-10-13`).** The cap, the anon timeout and #2088-#2089: lessons, *Moved from the lane (S385 compaction)*. #2090: a light index for every college (about 0.6 MB), full records only for the colleges the filters reach (S390, #2121, Sam 2026-10-14: District, College, SWP Region and CIP Sector dropdowns; the tab opens on Progress and carries no Sierra window), and every attention link (deep link, call cards, Next waiting, the Progress counts) loading its record on demand with nothing picked. **The index reads stored columns (S405; Sam, 2026-10-17: *"Prog Req tab in COBI loads very slow--we need to find a way to optimize it as we continue to grow it to the full CCC catalog"*).** Each Range page is an OFFSET, which evaluates every skipped row; three paths into `display` and the signed-in `requirements_fp` made the last public page of 11,969 take 9.4 s (anon's limit 3 s) and a signed-in pass 16 s more, growing with the square of the table. Four STORED generated columns (`idx_fp`, `idx_display_arithmetic`, `idx_display_reviewer`, `idx_display_here`; `chatbox/supabase_program_requirement_records_index_columns_2026_10_17_s405.sql`) take the same page to 22 ms, and the index reads 1,000-row pages four at a time. Guard: `tests/program_requirements.test.js` (6e). **NEXT:** read the CIP filter's first live batches (`coci_college_programs`, 150 a read) in `edge_logs`.

Sheet 77 card 3 (the college's items on one line, #2093, #2097): lessons, *Moved from the lane (S387 compaction)*.

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1).** Confirm or Needs a fix writes `program_record_verdicts` through `program_record_verdict_add`; a trigger keeps a person's reading across a reload. Detail: lessons doc, *Moved from the lane (S356 compaction)*.

