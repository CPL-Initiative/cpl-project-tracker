---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-10-08
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

**The pilot (Phase 1): all 20 records pass all four checks.** Five colleges by four shapes (`kb/program_requirements_pilot_sample.json`): an ADT, an A.S./A.A. with a choose block, a certificate with an electives block, a noncredit certificate; each college's use case fills one slot (Cerritos Ironworker A.S. 42158, Mt. San Antonio LVN-to-RN A.S. 08086, Riverside City Culinary Arts 22804, West LA Real Estate Salesperson 37839, Miramar Fire Technology A.S. 05100). **Capture** (`kb/_program_requirements_pilot.py`): accepts a page naming half the courses the Program Course File lists; curriQunet program views fall back to their own PDF export; sources filed under `kb/program_requirements_pilot/sources/`. **Extraction** (the `program-requirements-extract` Edge Function, version 2, structured output, record shape version 2); records under `.../records/`, about $0.05 a program. **Scorer** (`kb/_program_requirements_score.py`): coverage, no unflagged invented course, unit arithmetic (`equal`, `unequal`, `incomplete`, `unstated`). **Sam's reading (10:22Z):** 18 match; both fixes went into the procedure and rerun 37195340082 passed them. Guard `tests/program_requirements_pilot_test.py`. Run-level history: the lessons doc, S323-S324.

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

**Catalog addenda (Sam, 2026-10-04: *"We need to track this in our schema and have our agents aware."*).** The census records each addendum, supplement or errata link for the current or prior catalog year in `census_evidence -> 'addenda'` and writes `program_source_addenda` after the registry on apply (one row per college and url; status listed, read, applied, gone, not an addendum; `programs_changed` for the reading agent; public read, writes through a security-invoker function). Only a complete read (homepage and catalog page answered, own address) marks an addendum gone. **79 listed at 52 colleges, none read** (measured 2026-10-07); the census applies Sundays at 10:29 (next 2026-10-11). Next: the reading agent, then Sierra cites "the 2026-27 catalog as amended by the addendum of <date>". Detail: the lessons doc, S325-S327.

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

**The display build is live (S327).** `kb/_build_roep_display.py` writes each checked program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page): CPL in three kinds per course (here: MAP credit recommendations by course, `kb/program_requirements_pilot/map_cr_by_course.json`, plus the articulated-exhibit feed; could adopt: a peer articulated the credential to a course of the same identity, never a `cross_disciplinary` one; for consideration: a statewide recommendation naming the course's C-ID), the `plan()` figure, the gaps by owner and the map status. **Identity is the live CCR (S332):** it reads `unified_courses_members.js` and `_index.js` (the multi-member file left 140 of 289 entries with none): 285 named, could adopt 133 entries, for consideration 15; Ironworker A.S. up to 31.5 of 34-38. "Here" matches unified titles too. Receipts carry the build in their name and cite the one each replaces. All 20 live rows hold `799bfb9a7dbf`, the rename's label (sheet 39 card 1; md5-proven). Guard `tests/roep_display_test.py`; Sierra reads the facts (smoke 7t). **A MAP articulation that names a second course is a draft for the college (S335, `second_courses()`).** Miramar's 0.3-hour EMT Certification and Driver Operator 1B rows in MAP's articulated-exhibit view list AUTO 156G beside EMGM 106 and FIPT 321P; students received both at 0.25 hours on those two courses only. ✅ **All 20 live rows hold build `1cb75672ba6c` (Sam, sheet 42 card 2, go, 2026-10-05 20:58Z):** cpl-chat deployed first (run 37374184173, byte-verified 21:21Z; Sierra names each college gap by its kind), the smoke passed on `main` (run 37376149996), then S336 applied `..._display_2026-10-05_1cb75672ba6c_delta.sql` (migration `program_requirement_records_display_1cb75672ba6c_s336`, after a fresh guard read of 20) and `--verify-sql` reads 20 of 20 match. Evidence: the lessons doc, S335.

**Outcomes (Sam, 2026-10-04 18:03Z):** grab published course and program outcomes, and compare harvested credential skills with course outcomes. ✅ **Record shape 3 is built (S334, sheet 33 card 4 as proposed):** the extraction function (version 4) keeps each outcome exactly as printed in `program.outcomes` and `course_outcomes`; the scorer's `outcomes` check fails a reworded or empty one. Run 37345734457 (20 of 20 passed, $1.31) and, for Mt. San Antonio, 37350789203 after the capture learned to open a hidden Outcomes tab (#1871): **19 of 20 carry outcomes**, 1 to 11 each. Miramar prints *Learning Outcome(s):*, which S327's count missed; Mt. San Antonio's ECE transfer degree links to an outcomes page instead. `kb/_program_requirements_file.py` files a run: a record a person read keeps its requirements and takes only the outcomes (six of the 20 came back with relabeled blocks), and `reviewed_readings.json` holds each verdict to the requirements it read. The skills comparison waits for the skills file (`kb/reference/industry_credential_skills.json`, not started).

**CSU LA:** later, after the CCC procedure settles (Sam, sheet 33 card 3; lessons, S336 compaction).

**The proof of concept: Cerritos Ironworker, high school to career (Sam, 18:23Z, vault braindump 18:23)** is on CPL Pathways as the ladder (S328): seven steps in `cpl_pathways_data.js`, each line *In our data* or *To confirm*. **Exhaust the agent before any request (Sam, sheet 33 card 5):** *"You draft the request only after we have exhausted all our efforts at having the agent harvest needed data... I think we will need to have agents configured for each college as they will have nuances we want to note in our rules governing the behavior of the agents."* **The reader** (`kb/_college_page_read.py`, `college-page-read.yml`; a push reads only the plans its last commit adds or changes): a plan (`kb/college_reads/<plan>.json`) names a college's pages and the line each answers; the docstring has the steps. **Cerritos, after twelve reads (S329-S331, 71 loads):** every ladder line it could settle is *In our data*. The high school list: every public route is closed (procedure record v4 names each); the archive's 2016 list holds 57 agreements, none for welding (`kb/program_requirements_pilot/cerritos_hs_agreements_2016.json`). Columbus High, a CCAP partner, runs a welding pathway (OSHA 10 and 30) that names Cerritos and reads as articulation, unconfirmed. Still *To confirm*: the current list and that route, and whether the approved B.S. keeps the 2024 list (the addenda will show it). Detail: lessons S329-S331. ✅ **One procedure record per college (Sam, sheet 34 card 2; "apply the procedure record", S329):** `procedure`, `procedure_by`, `procedure_at` on `program_source_registry` (the history trigger names `procedure_by`); the reader loads it before each run. **Written through `program_source_procedure_set(college, record, by, expect_md5)`** (Sam: "go ahead on writing the function"), called with a SELECT; it refuses a stale md5 (`none` for no record) or a malformed record; service_role only; receipt `kb/receipts/program_source_procedure_set_2026-10-04_s330.sql`. Cerritos is at v4 (S331, reads 7-12). ✅ **Sheet 37, hold (Sam):** *"Don’t worry about this for now until I investigate later."* The request stays held while he investigates; the draft stays in the sheet's builder. OSHA 30 on IWAP 41.09 and its issuer (S332-S333): the lessons doc, *Moved from the lane (S340 compaction)*.

✅ **Sheets 38, 39 and 42's rulings** (writes, the OSHA issuer name, the outcomes on the 20 live rows): the lessons doc, *Moved from the lane (S336 compaction)*. ✅ **The Progress view (S343, #1900):** the tab's first view, from the mock-up Sam approved (*"The mockup looks good to go"*). `MILESTONES` and `PARTS` at its top are definitions; the tables are read live; what anon cannot read comes from **`kb/queue_status.json`**, written at every checkpoint (step 12, `scripts/queue_status.py`), never from a widened policy. Every section of the tab collapses (Expand all, Collapse all). Detail: lessons S343. **NEXT:** ① Re-read Schedule+ for Spring 2027 once its IWAP sections post. ② The film: re-render when a ladder line it shows changes. ③ ✅ **22 records live, 20 checked; display build 8292780f6cd5 on all 22** (S342: cpl-chat deployed first, `--verify-sql` 22 of 22 match). Irvine Valley Art A.A. 10265 and Santa Monica Barbering A.S. 43767 (sheet 47 cards 7-9) stay unchecked until Sam reads them; Sierra quotes neither until then. Card 9's rule, the figures and the apply: lessons S341-S342. ④ The addenda reading agent after the 2026-10-11 apply; Miramar's map (`read: 1`); Butte's ROE definitions; widen past the pilot: every pilot college has a procedure record now (7 of 118, S344; v1 from the pilot's reads, West LA v2 after its mapper answered 403), and the next college gets one as its first read lands. Refresh the builder's two dated reads when the harvest adds a college; rebuild, apply on Sam's go, `--verify-sql`. Later (Sam, ~20:02Z): every program with ROEP in a SkyView view ([skyview lane](skyview-ccr-interface.md)).

**NEEDS SAM — four calls on [Open Asks Sheet 50](https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr) (S345):** cards 1-2 check Irvine Valley 10265 and Santa Monica 43767; card 4 Mt. San Antonio's Fire Technology map (KINF 51A, 51B, 52A off its list); card 5 whether a refused map counts as settled for the milestone.
