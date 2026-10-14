---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-10-14
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

**The sequence pass (S325, PR #1847):** `kb/_program_sequence_ppm.py` on its own
workflow (`program-sequence-ppm.yml`, so a change never reruns the capture's 20
reads) enters a college's Program Mapper from the college's own pages, follows
the link into the mapper, and accepts a page naming half the program's listed
courses and at least two terms. **Run 1 (37197332656):** Miramar's own mapper page links `san-diego-miramar.programmapper.com`, which answered all seven requests **403 Forbidden**. None of the 20 captured catalog pages prints a
term sequence.

**A refusal is on the college's record (Sam, sheet 29 card 3):** the agent notes the limitation and keeps looking, and asks no one for access; `program_source_registry` carries `sequence_host`, `sequence_access`, `sequence_note`, `sequence_checked_run`. ⚠️ **A workaround is another public source, never the same refused host under another name**: the reader keeps the census user agent that names the CPL Initiative. Detail and the 25 colleges filed: lessons, *Moved from the lane (S386 compaction)*.

**Sam's ruling (2026-10-04, 11:1xZ, in chat):** *"No need for governance at this
point. Everything is public record and we can mark the tab and contents as beta
draft."* The harvest's tab shows its records without a Governance pass, marked
**Beta draft** (vault braindump
`braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). Then:
*"Integrate Sierra in the tab design."*

**The tab is in COBI** (Beta draft, #1860, Reference & Curation): `program_requirements.js` ports the approved mock-up ([v3](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), Sam: *"mock up looks good"*) and reads `program_source_registry` and `program_requirement_records` live. Four views: Catalogs, Program records (the four checks; the display build's CPL figure), Sequences, and Procedures (each college's procedure record). Sierra docks at the top (sheet 38 card 5; Sam: *"Sierra at the top"*): a collapsible Sierra AI section mounts the CPL Assistant (`CPL_CHAT.mountInto(host, "program-requirements")`); `cpl-chat` reads the surface as unscoped until `KNOWN_SURFACES` names it (a deploy). Cerritos's Ironworker A.S. reads 0 MAP credit recs (its credit is exhibit articulation, in CER).

**Catalog addenda (Sam, 2026-10-04: *"We need to track this in our schema and have our agents aware."*).** The census records each addendum, supplement or errata link for the current or prior catalog year in `census_evidence -> 'addenda'` and writes `program_source_addenda` after the registry on apply (one row per college and url; status listed, read, applied, gone, not an addendum; `programs_changed` for the reading agent; public read, writes through a security-invoker function). Only a complete read marks an addendum gone. **79 listed at 52 colleges** (apply of 2026-10-11). ✅ **The eight amending loaded colleges read (S387, #2102):** an online catalog's addendum is a changelog of edits its pages already carry (Norco's PDS-809 and Cerritos's EDT 110 already read as changed), so it explains a catalog-and-COCI mismatch rather than correcting the record; Miramar's "addendum" is the whole 2025-26 catalog. **NEXT:** the reading agent files `programs_changed` with each change's date (a write function, same pattern as the census's). Detail: the lessons doc, S325-S327.

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

**Outcomes (Sam, 2026-10-04 18:03Z):** grab published course and program outcomes, and compare harvested credential skills with course outcomes. 🔨 **Course outlines (Sam, 2026-10-12, `sam-capture-cor-system-link-2026-10-12`):** capture each college's course outline of record system link so the harvest reads course SLOs, for the skills match and for faculty assessment of CPL. Record shape 3, Sheet 70's rulings, the registry's `cor_*` fields, the census, the index and how each host prints its SLOs: lessons, *Moved from the lane (S376 compaction)* and *(S380 compaction)*. ✅ **`course_outcomes` is live** (Sam pasted `chatbox/supabase_course_outcomes.sql`, Open Asks Sheet 72 card 1; public read, insert-only `course_outcomes_load()` on the service role, a receipt per load). **Loaded, nine colleges, 7,450 courses, 20,891 SLOs** (live read, S388): RCCD (#2049: Riverside City 1,174, Norco 817, Moreno Valley 674), SDCCD (#2066: San Diego City 588, Mesa 1,026, Miramar 615), and from catalog course pages addressed by code: Cabrillo 1,124 and Modesto Junior 910 on eLumen (#2103), Coastline 522 from the Coast district's outlines of record (#2105; 28 common course numbers answer 404 there). `catalog=<slug>` in `kb/course_outcomes/.run` picks either form; each load is insert-only with a receipt naming its rollback. **Chaffey** (#2073): neither public report prints course outcomes. Cerritos, Long Beach City and Mt. San Antonio print none on their CourseLeaf pages (#2101). **Palo Verde held:** its loaded records are 2025-26 and its 2026-27 catalog is Acalog (the Acalog reader comes first). The skills comparison waits for `kb/reference/industry_credential_skills.json` (not started).

**CSU LA:** later, after the CCC procedure settles (Sam, sheet 33 card 3; lessons, S336 compaction).

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings:** lessons, *Moved from the lane (S336 compaction)*. ✅ **The Progress view (S343, #1900):** the tab's first view, from the mock-up Sam approved (*"The mockup looks good to go"*). `MILESTONES` and `PARTS` at its top are definitions; the tables are read live; what anon cannot read comes from **`kb/queue_status.json`**, written at every checkpoint (step 12, `scripts/queue_status.py`), never from a widened policy. Detail: lessons S343. Every count opens what it totals; a card waiting on Sam links where he answers (#2077); a call in `kb/queue_status.json` must carry its answer link (`link`, `view` or `records`) and may name its card (`part`). **Whole harvest** (Sam, 2026-10-13): five parts, confirm left out; `queue_status.py --harvest` stamps it. **NEXT:** ① Re-read Schedule+ for Spring 2027 once its IWAP sections post. ② The film: re-render when a ladder line it shows changes. ③ The addenda reading agent after the 2026-10-11 apply; Miramar's map (`read: 1`); Butte's ROE definitions; widen past the pilot: 19 of 118 colleges hold a procedure record (S344's seven; S345's twelve from the map reads), and the next college gets one as its first read lands. Maps: 3 of 32 read, 24 mapper hosts refused (lessons S345). Refresh the builder's two dated reads when the harvest adds a college. Later (Sam, ~20:02Z): every program with ROEP in a SkyView view ([skyview lane](skyview-ccr-interface.md)).

**Sheet 50 and the maps it settled (S346-S347):** the lessons doc, *Moved from the lane (S353 compaction)*.

🔨 **Phase 2, a college at a time: fifteen colleges read and loaded, every new record unchecked until read.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` reads a CourseLeaf catalog by its sitemap and a curriQunet catalog by its own JSON (`cq_index`, `cq_page`; a catalog id from the host's `_getCatalogs` when the start page names none); `assign()` gives a page to the programs whose award and title it names most fully. A push reads only on `[read]`/`[extract]`; a dispatch runs `step=read`, `load` or `display`. The load is insert-only and commits a receipt naming every inserted key, which is the rollback; a record placing none of its listed courses (another program's page) stays out of the load and the display build. **Loaded:** Cerritos 305, Mt. San Antonio 382, Riverside City 244, Moreno Valley 139, Norco 147, Long Beach City 344, Chaffey 191, San Diego City 167, San Diego Miramar 120, San Diego Mesa 175, Bakersfield 229 (eLumen, S381), Coastline 140, Cabrillo 268 (S382), Modesto Junior 185 and Palo Verde 52 (S385) (each college's read, load and the records it left out: lessons, S364-S373). **Display:** each build applies through the display job, which files each row's prior build (the rollback); Sam's standing go (2026-10-10) covers a build that follows a load. Build `2d812b8ce768` holds all 3,077 rows (31 checked; display run 38486049156, S385; re-applying `dc7d157aff73`'s receipt rolls it back). The display job applies the build `cpl_pathways_roep_data.js` carries: run `kb/_build_roep_display.py` and commit its two outputs before dispatching (lessons S385). A program pointing at a retired version of a course the college still offers lists it, placed, no flag (Sam, 2026-10-11, Cerritos 02226). A college must be in the builder's dated reads (`kb/program_requirements_pilot/`, `registry_read.json` and `map_cr_by_course.json`) before its display is built; Mesa was the first non-pilot college added since S369. Earlier reader fixes and capture reads: lessons (S385 compaction). ✅ **Loaded and displayed (S385, #2094):** dated reads gained both (162 and 58 course codes, md5s in `_read_by`); load 38482987850 inserted Modesto's 185 (4 place none), load 38482990981 Palo Verde's 52 (2 place none); build `2d812b8ce768`. ✅ **Palo Verde's noncredit pages read (S386, run 38491285062):** the reader works; the catalog and the state file name the courses differently. High School Equivalency prints NBE031-NBE034 where the Program Course File lists GED031-GED034 (same numbers and titles); Developing Capable Youth's page is a 2021-22 credit version (CHD120, CHD227) where the file lists the noncredit NBE 120 and 227; Child Care and Arts - Early Childhood Education have no page. Each is the college's to correct; Modesto (v1) and Palo Verde (v3) now hold procedure records (receipts `kb/receipts/program_source_procedure_*_s386.sql`). Counting a course printed under another subject, same number and title, as the listed one is not built: of 257 same-number pairs on loaded records, COCI's titles agree for 32 (four colleges; HIS→HIST at the RCCD colleges among them), differ for 91, and are missing for 129, so the title test needs the catalog's printed title (lessons S386). ✅ **Palo Verde's no-total pages read (S386, run 38497793717):** each prints the degree total with general education, as Cabrillo's do. Automotive Technology A.S. prints *Total 64 - 68* = a 24-unit core, 6 units of electives and *CalGETC 34 - 38*; Psychology AA-T prints *Total 60* = a 19-21-unit major, CalGETC 34-38 and transferable electives. The extraction leaves the major total blank (its rule: never compute one), so 79 records at the two colleges fail arithmetic, and the display, CPL Pathways and Sierra all say the catalog prints no program total, which these pages contradict. ⚠️ **Palo Verde's records are a year behind (S387):** its catalog page lists the 2026-27 catalog at `catalog.paloverde.edu` (Acalog); the census took the 2025-26 eLumen one. #2104 fixed the pick (applies Sunday). Re-reading needs an Acalog reader (El Camino and San Joaquin Delta use it too). ✅ **Southwestern and Fresno City captured (S386, capture only, no model calls):** Southwestern (CourseLeaf, run 38495332618) found a page for 220 of 233 programs with a course list, 167 at full coverage; Fresno City (curriQunet, run 38495335905) 237 of 251, 199 at full coverage, five of its six misses noncredit. Previews on `claude/s386-southwestern` and `claude/s386-fresno-city`. **NEEDS SAM:** extraction of Southwestern and Fresno City (about $29 in model calls; load unchecked and display under the standing go). **NEEDS SAM:** whether a record carries the degree total and its general education block, so arithmetic checks against what the page prints (re-read the 79 records, about $6), or only the wording changes. Santiago Canyon's listing has no links.

🔨 **The Records view loads by college (S384; Sam, 2026-10-13, `cpl_memory` `sam-records-load-by-college-filter-2026-10-13`).** The cap, the anon timeout and #2088-#2089: lessons, *Moved from the lane (S385 compaction)*. #2090 (merged S385, deployed 22:45Z): a light index for every college (about 0.6 MB), full records only for the colleges a multi-select college/district picker names (it opens empty and remembers the last pick, Sam's default), and every attention link (deep link, call cards, Next waiting, the Progress counts) loading its record on demand with nothing picked. ✅ **First live reads clean** (22:50Z; lessons S385). **NEXT:** the first college pick (`college=in.(...)`, quoted) has not been sent live; read it in `edge_logs` after one.

Sheet 77 card 3 (the college's items on one line, #2093, #2097): lessons, *Moved from the lane (S387 compaction)*.

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1).** Confirm or Needs a fix writes `program_record_verdicts` through `program_record_verdict_add`; a trigger keeps a person's reading across a reload. Detail: lessons doc, *Moved from the lane (S356 compaction)*.

