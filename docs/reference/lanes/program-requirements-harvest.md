---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-10-12
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

**Measured (2026-10-03):** the Program Course File marks no course required and gives no unit total, but names every course a program lists (the closed list each record is checked against); 115 colleges award active credit programs. Detail: the lessons doc, *Moved from the lane (S334 compaction)*.

**The pilot (Phase 1): all 20 records pass all four checks** (Cerritos, Mt. San Antonio, Riverside City, West LA, Miramar; Sam read them, 18 matched and both fixes went in). Capture `kb/_program_requirements_pilot.py`, extraction the `program-requirements-extract` Edge Function, scorer `kb/_program_requirements_score.py`; guard `tests/program_requirements_pilot_test.py`. Detail: the lessons doc, *Moved from the lane (S372)*.

**The sequence pass (S325, PR #1847):** `kb/_program_sequence_ppm.py` on its own
workflow (`program-sequence-ppm.yml`, so a change never reruns the capture's 20
reads) enters a college's Program Mapper from the college's own pages, follows
the link into the mapper, and accepts a page naming half the program's listed
courses and at least two terms. **Run 1 (37197332656):** Miramar's own mapper page links `san-diego-miramar.programmapper.com`, which answered all seven requests **403 Forbidden**. None of the 20 captured catalog pages prints a
term sequence.

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

**Sam's ruling (2026-10-04, 11:1xZ, in chat):** *"No need for governance at this
point. Everything is public record and we can mark the tab and contents as beta
draft."* The harvest's tab shows its records without a Governance pass, marked
**Beta draft** (vault braindump
`braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). Then:
*"Integrate Sierra in the tab design."*

**The tab is in COBI** (Beta draft, #1860, Reference & Curation): `program_requirements.js` ports the approved mock-up ([v3](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), Sam: *"mock up looks good"*) and reads `program_source_registry` and `program_requirement_records` live. Four views: Catalogs, Program records (the four checks; the display build's CPL figure), Sequences, and Procedures (each college's procedure record). Sierra docks at the top (sheet 38 card 5; Sam: *"Sierra at the top"*): a collapsible Sierra AI section mounts the CPL Assistant (`CPL_CHAT.mountInto(host, "program-requirements")`); `cpl-chat` reads the surface as unscoped until `KNOWN_SURFACES` names it (a deploy). Cerritos's Ironworker A.S. reads 0 MAP credit recs (its credit is exhibit articulation, in CER).

**Catalog addenda (Sam, 2026-10-04: *"We need to track this in our schema and have our agents aware."*).** The census records each addendum, supplement or errata link for the current or prior catalog year in `census_evidence -> 'addenda'` and writes `program_source_addenda` after the registry on apply (one row per college and url; status listed, read, applied, gone, not an addendum; `programs_changed` for the reading agent; public read, writes through a security-invoker function). Only a complete read (homepage and catalog page answered, own address) marks an addendum gone. **79 listed at 52 colleges, none read** (measured 2026-10-07); the census applies Sundays at 10:29 (next 2026-10-11). Sam, 2026-10-11: *"RCCD and others publish catalog agenda to correct errors and late approved courses"*, so a catalog-and-COCI mismatch is read against the college's addendum before it goes to the college (Moreno Valley, Norco and Cerritos list one; none read). Next: the reading agent, then Sierra cites "the 2026-27 catalog as amended by the addendum of <date>". Detail: the lessons doc, S325-S327.

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

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04 18:03Z):** grab published course and program outcomes, and compare harvested credential skills with course outcomes. ✅ **Record shape 3 (S334):** extraction v4 keeps each outcome exactly as printed in `program.outcomes` and `course_outcomes`; the scorer fails a reworded or empty one; 19 of the 20 pilot records carry them. `kb/_program_requirements_file.py` keeps a read record's requirements and takes only outcomes; `reviewed_readings.json` holds each verdict to the requirements it read. 🔨 **Course outlines (Sam, 2026-10-12, `sam-capture-cor-system-link-2026-10-12`):** capture each college's course outline of record system link (eLumen, CurriQunet, Coursedog, CourseLeaf, WebCMS) so the harvest reads course SLOs, for the skills match and for faculty assessment of CPL. `cms_public_view` holds 49 of 118, the census's first CMS link (catalogs, one Chabot outline, a Coursedog sign-in). `kb/_course_outline_census.py` (#2042, pages only, no table write) finds the system, its access and whether it prints SLOs; its 12-college sample found only catalog hosts plus Cabrillo's Coursedog (sign-in), so it now reads each sitemap for curriculum pages; run 2 reads all 118. Sheet 70 (XH8PbTs4mCyZ8kVfRh1S3D) holds the three calls: registry fields by migration, sign-in systems recorded with no request, articulated courses' SLOs first. The skills comparison waits for `kb/reference/industry_credential_skills.json` (not started).

**CSU LA:** later, after the CCC procedure settles (Sam, sheet 33 card 3; lessons, S336 compaction).

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings** (writes, the OSHA issuer name, the outcomes on the 20 live rows): the lessons doc, *Moved from the lane (S336 compaction)*. ✅ **The Progress view (S343, #1900):** the tab's first view, from the mock-up Sam approved (*"The mockup looks good to go"*). `MILESTONES` and `PARTS` at its top are definitions; the tables are read live; what anon cannot read comes from **`kb/queue_status.json`**, written at every checkpoint (step 12, `scripts/queue_status.py`), never from a widened policy. Every section of the tab collapses (Expand all, Collapse all). Detail: lessons S343. **NEXT:** ① Re-read Schedule+ for Spring 2027 once its IWAP sections post. ② The film: re-render when a ladder line it shows changes. ③ The addenda reading agent after the 2026-10-11 apply; Miramar's map (`read: 1`); Butte's ROE definitions; widen past the pilot: 19 of 118 colleges hold a procedure record (S344's seven; S345's twelve from the map reads), and the next college gets one as its first read lands. Maps: 3 of 32 read, 24 mapper hosts refused; Mt. San Antonio's own pages publish a sequence per program (lessons S345). Refresh the builder's two dated reads when the harvest adds a college. Later (Sam, ~20:02Z): every program with ROEP in a SkyView view ([skyview lane](skyview-ccr-interface.md)).

**Sheet 50 and the maps it settled (S346-S347):** the lessons doc, *Moved from the lane (S353 compaction)*.

🔨 **Phase 2, a college at a time: ten colleges read and loaded, every new record unchecked until read.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` reads a CourseLeaf catalog by its sitemap and a curriQunet catalog by its own JSON (`cq_index`, `cq_page`; a catalog id from the host's `_getCatalogs` when the start page names none); `assign()` gives a page to the programs whose award and title it names most fully. A push reads only on `[read]`/`[extract]`; a dispatch runs `step=read`, `load` or `display`. The load is insert-only and commits a receipt naming every inserted key, which is the rollback; a record placing none of its listed courses (another program's page) stays out of the load and the display build. **Loaded:** Cerritos 305, Mt. San Antonio 382, Riverside City 244, Moreno Valley 139, Norco 147, Long Beach City 344 (S364, re-read S368; Advanced Arc Welding 38542 removed on Sam's Open Asks Sheet 68 card 2, *Remove it*, receipt `kb/receipts/program_requirement_records_lbcc_38542_removed_2026-10-12_s370.*`), Chaffey 191 (S370, #2027: 193 of 199 found, six with no page), San Diego City 164 (S370-S371: read 38252422845 found 168 of 191 with a list, $12.67; load 38265697602; 22333, 22352, 22367 and 38732 place none and stay out), San Diego Miramar 110 (S372: read 38275241459 found 110 of 124 with a list, 105 pass, $9.00; load 38285338937 inserted 106 and kept the 4 checked pilot records; not found 16779, 30512, 30532, 36254), San Diego Mesa 166 (S373: read 38282023973 found 168 of 184 with a list, 162 pass, $14.82; load 38300979155 inserted 166; 18270 and 31695 place none and stay out; its nine health programs were not found: 05301, 05344, 05347, 05348, 05349, 22313, 22314, 38642, 38643). **Reading** (#1946-#1952): Program records finds a record and Side by side opens it beside its catalog page (`kb/catalog_framing.json`). Sam confirmed the Cerritos sample, 12 of 12. **Display:** each build applies through the display job, which files each row's prior build (the rollback); Sam's standing go (2026-10-10) covers a build that follows a load. Build `da4f44a160ca` holds all 2,181 live rows (31 checked; Mesa's 166 read back under it, S373, display run 38301926763). A program pointing at a retired version of a course the college still offers lists it, placed, no flag (Sam, 2026-10-11, Cerritos 02226). A college must be in the builder's dated reads (`kb/program_requirements_pilot/`, `registry_read.json` and `map_cr_by_course.json`) before its display is built; Mesa was the first non-pilot college added since S369. **NEXT:** ① San Diego Miramar and San Diego Mesa (Sam, 2026-10-12: *"go ahead with Miramar and Mesa extraction"*). Both are Leading and on the SDCCD curriQunet host, whose `_getCatalogs` names City 69, Mesa 70, Miramar 71. Both are read, loaded and displayed: Miramar S372, Mesa S373 (its registry row on Sam's Open Asks Sheet 69 item 1, *Apply as a migration*, #2037). Mesa's nine missing programs are all health sciences, and none is among the 199 entries of the one section the reader walked (*Degree Curricula and Certificate Programs*): find where the catalog lists them and file it in Mesa's procedure record before a re-read. The other unread Leading colleges sit on eLumen (Bakersfield, Cabrillo, Modesto, Palo Verde, Santiago Canyon), Coursedog (Merced), a PDF (West LA) or custom pages: a reader for eLumen is the next platform. ② A mismatch goes past the college's addendum first (Sam, below). ③ Noncredit hours show estimated equivalent units on Program Requirements and CPL Pathways only, never Sierra: hours / 16 rounded down to the half unit (Sam, Sheet 63 card 1; #1984). ④ CPL Pathways reads its catalog records from `program_requirement_records` when opened (#2015, Sam's *Read from the table*); the pilot file is the offline tier. UI pass done (#2016). ✅ **Every record is public (Sam, Open Asks Sheet 67, 2026-10-12, *Every record, from the table*; on Sheet 65: "I want every record to show marked not yet confirmed").** The table's public read opens to every row; CPL Pathways, Program Requirements and My College mark an unchecked record *Not yet confirmed*, and Sierra reads checked rows only. Recorded in `kb/governance_surface_map.json`. Live since Sam pasted the policy (Open Asks Sheet 68 card 1, *Pasted*, 2026-10-12 11:18Z). History: lessons, S353-S370.

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1).** Confirm or Needs a fix writes `program_record_verdicts` through `program_record_verdict_add`; a trigger keeps a person's reading across a reload. Detail: lessons doc, *Moved from the lane (S356 compaction)*.

