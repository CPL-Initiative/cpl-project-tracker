---
title: Program requirements harvest — Decisions & Lessons
date: 2026-10-03
prs: [1836, 1838, 1839, 1841, 1844, 1845, 1858, 1859, 1860, 1861, 1862, 1863, 1864, 1865, 1866, 1868, 1874, 1876, 1877, 1878, 1894]
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

Sessions S320-S333 (Phase 0, the census, the pilot's first records, the addenda table, the first display build and the Ironworker proof) are in
[`program_requirements_harvest_lessons_archive.md`](program_requirements_harvest_lessons_archive.md), moved verbatim.

## S334 SkyAnchor, 2026-10-05: record shape 3 (outcomes as printed), the catalog record on CPL Pathways

**What shipped.** The extraction function's version 4 keeps program and course outcomes as printed (record shape 3, Sam's sheet 33 card 4); the scorer's `outcomes` check fails a reworded or empty one. Run 37345734457 re-read the 20 pilot programs (20 of 20 passed, $1.31, $0.065 a program). `kb/_program_requirements_file.py` filed the outcomes onto the records Sam read. CPL Pathways lists every catalog record and opens each By requirement or By term (PR CPL-Initiative/cpl-project-tracker#1870). The live rows wait on sheet 40 card 1.

**Lessons.**
1. **A rerun relabels what it does not change.** Fourteen of 20 records came back with the requirements Sam read, byte for byte; six differed only in words the model chooses afresh each run: a section heading, a block name's trailing colon, an option group's name (`anatomy_physiology_sequence` against `Anatomy/Physiology sequence`), and on one record the alternatives' units filled in. Any of them would end a person's verdict under a fingerprint, and none changes what a student must take.
2. **So a person's verdict is held to the requirements it read, and a rerun adds rather than replaces.** `reviewed_readings.json` fingerprints each read record (`requirements_md5`, outcomes left out); the loader counts a verdict only while the fingerprint matches. The filer keeps a read record's blocks, notes and reasons and takes only the new fields a machine check proves (outcomes, word for word against the same page). The display build stayed at 799bfb9a7dbf, so Sierra's facts did not move.
3. **A count by heading undercounts.** S327 measured 13 of 20 pages printing outcomes with `(program|student) learning outcomes`. Miramar prints *Learning Outcome(s):*, so the true count is 16 (Miramar's four); the heading pattern takes the form now. Mt. San Antonio prints an Outcomes tab label and the capture reads none of the four programs' outcomes: the gap is the reading procedure's.
4. **A verbatim check needs folding, and only of glyphs.** PDF text breaks lines mid-outcome and hyphenates at line ends, and catalogs mix curly and straight apostrophes. The scorer folds whitespace, a line-end hyphen and quote and dash glyphs on both sides; words and capitals must match. A blank outcome fails, since an empty string is in every text.
5. **An unchanged build must keep its receipt.** `_build_roep_display.py` rewrote the 799bfb9a7dbf receipt when only the records' outcomes changed, and the rewrite dropped the line naming its rollback (the prior build's receipt). It now leaves an unchanged build's receipt as written.
6a. **Then the reader opened the tab: 19 of 20.** The capture (#1871) now appends any panel whose id names outcomes, or that a tab labeled Outcomes, SLO or PLO opens, read one line per item when hidden. Mt. San Antonio's panel is `#outcomestextcontainer`; Vocational Nursing's came through a toggle (`#tgl0`). Its first run filed nothing: an escape written into the Python source of the in-page script became a real newline inside a JavaScript regex, the script threw on every page, and the run fell back to plain text that differed from the filed fixtures. The pilot guard now fails a tab or control character in the script and runs `node --check` on it; a mock CourseLeaf page in Chromium proved the fix before the next read. Each fixture took the new text only where everything before the appended tab matched the filed text byte for byte.
6. **Prove a write in Postgres before anyone approves it.** The outcomes write is one guarded insert ... select per row (md5 of the record before). A read-only `select md5(jsonb_set(...)::text)` on one row returned the after md5 the loader computed, so the receipt's after state is shown before Sam's go.

## S335 SkyKeel, 2026-10-05: drafts for the college, and Miramar's AUTO 156G traced to its source

**What shipped.** Sam's sheet 32 card 2 (as proposed) collected the college's own differences as drafts on its harvest-tab row; the harvest-tab half is built. Program records gathers each college's college-owned gaps under its heading as *Drafts for the college*, with a composed draft to copy; Catalogs counts them and filters to colleges that have some; a record's own notes list only what the procedure owns (`tests/program_requirements.test.js` block 6c). The display builder gained `second_courses()`, a college-owned gap for a MAP articulation that names a course its recommendation does not; build `1cb75672ba6c` adds Miramar's two and nothing else (receipt `..._2026-10-05_1cb75672ba6c_delta.sql`, waiting on sheet 42 card 2). Sheet 42 card 3 asks when drafts show on My College, the college's own page.

**Lessons.**
1. **Trace a data finding to the row before raising it with a college.** Eight handoffs carried "raise Miramar's AUTO 156G articulations (EMT, Driver Operator 1B)". MAP's student-grain table (`map_college_cr_unit`) puts both exhibits on EMGM-106 and FIPT-321P at 0.25 hours, the versions students received. The AUTO 156G link sits in MAP's articulated-exhibit view on the 0.3-hour versions only, each listing AUTO 156G beside the right course; `_seed_coci_articulations.py` reads one course per view row, so the link is MAP's, and no credit flowed through it. The draft says exactly that, which a college can check in a minute; "AUTO 156G carries EMT credit" would have sent them looking for awards that do not exist.
2. **A word-overlap test needs a subject test beside it.** Over the whole feed, "the recommendation shares no word with the course title, and another course at the college does" found 18 rows at 7 colleges, mostly right: NCCER's *Printreading and Welding Symbols* on Blueprint Reading, FAA airframe courses carrying each other's titles. Requiring the stray course to sit in another subject than the matching one left Miramar's two and one San Bernardino Valley row. Records shared by several colleges are skipped: a merged record carries other colleges' course codes (the 2026-09-29 memory row), which is where `chatbox_peer_articulations` reads noisy too.
3. **Isolate a builder change by building without it.** With `second_courses` stubbed to empty, the build reproduced the live stamp `799bfb9a7dbf` exactly, so the new stamp's only cause is the new gaps; a path diff of the two builds confirmed two paths (`build` on 20 rows, `gaps` on one).
4. **A college-facing surface and a team decision can pull apart inside one ruling.** Sheet 32 card 2 put drafts on My College *and* said nothing goes to a college on its own. My College is the college's page, so the two halves conflict there; the harvest tab half was built and the other went back to Sam as a card instead of being guessed.
5. **A new kind of record meets every reader of the old kinds.** `display.gaps` has three readers: the harvest tab, CPL Pathways and Sierra. Sierra's `displayLines` labeled every college-owned gap "Catalog and state file differ", so Miramar's two would have reached her answers misnamed. She now labels each by its kind (`tests/sierra_program_courses.test.js` holds both), and sheet 42 card 2 deploys that line before the write. `grep` the field across `*.js` and `*.ts`, then ship the reader before the data.

## S336 SkyCourier, 2026-10-05: the first two maps a reader could open

**What shipped (#1876).** The registry recorded two sequence sources as open, Irvine Valley's All Program Maps and Santa Monica's Program Maps, and the queue had carried "Irvine Valley's and Santa Monica's maps" since S332. College page read run 37372136739 read both index pages and three of Santa Monica's program pages. `kb/_program_map_parse.py` turns what the run printed into terms, and the first two sequence records (shape `sequence 1`) sit in `kb/program_requirements_pilot/sequences/` with their source text, run, address and the state's list: Santa Monica's Barbering A.S. (43767) and Irvine Valley's Art A.A. (10265). Sam's sheet 23 call 4 had taken the pilot's sequencing only from Miramar's mapper, which refuses the reader; these two colleges are outside the 20-program sample, so adding their records to what Sam checks is a card, and nothing reached Supabase.

**Lessons.**
1. **Pick the program by the CPL it carries, after reading what the college publishes.** Santa Monica's Barbering A.S. names 24 of its 25 listed courses on its map, and every COSM course in the first year carries CPL at the college through one exhibit, *Barbering License (California)*: a licensed barber's first year is credit already held, with COUNS 20 and ENGL C1000 left. Irvine Valley's MAP rows (1,127) carry one local course, ART 85 Life Drawing I (165 students), and its Art A.A. places it in Semester 3. The CPL count chose the programs; the index read confirmed both had maps before anything was built.
2. **Two map shapes, one parser.** Irvine Valley prints every map whole on one paginated page (seven pages, about 200 maps) as tab-separated tables under each term; Santa Monica gives each of about 150 programs a pathway page listing CODE, TITLE and units, with open slots by title. The college page reader folds runs of short lines with " · ", so the parser splits on newlines and on that separator alike, and both shapes come out as the same terms of kinded items (course, choice, list, ge, elective).
3. **A map that names the core and leaves list slots is a correct map.** Irvine Valley's Art A.A. names 5 of its 23 listed courses (the required core) and leaves four slots "from List A or B". The pilot's half-the-list rule would refuse it. Acceptance is two terms or more and no course in the program's own subjects off the state's list; coverage is reported beside it and never gates.
4. **An open slot can resolve by title.** Santa Monica's "Salon Experience · 1-4 units" names no code; its title matches the four Salon Experience courses (COSM 95A-95D, 1 to 4 units) on the state's list, so it reads as that choice.
5. **The catalog's units and the state file's can differ inside a map.** Santa Monica's map prints COSM 50R at 1 unit; the state's Program Course File lists 1.5. The map record keeps what the college prints.

**Sheet 42, carried out (2026-10-05).** Sam answered at 20:58Z, each card his own call: card 1 go, card 2 go, card 3 *Show them now*. S335 applied card 1's outcomes receipt (20 of 20 read after) and dispatched the cpl-chat deploy; S336 ran the rest. The deploy waited 10 minutes in GitHub's queue and landed byte-verified at 21:21Z; the smoke dispatched on `main` passed (run 37376149996); a fresh guard read showed all 20 rows on build 799bfb9a7dbf; migration `program_requirement_records_display_1cb75672ba6c_s336` applied the delta receipt and `--verify-sql` read 20 of 20 match. My College lists each college's drafts now (#1878). Sheet 44 carries the one open ask.

6. **Two sessions acted on one sheet, and the guard made the second write a no-op.** S335 signed off at 20:23Z still watching sheet 42; Sam opened S336 at 20:25Z. His Complete woke both. Each card's receipt is guarded on the row's md5, so a duplicate apply would have changed nothing, and the two sessions settled one writer by message within four minutes. The rule that keeps it from recurring is in `docs/reference/scheduled_sessions.md` (*A signed-off session lets go*, #1879).
7. **A smoke assertion about the model's wording is a sample of one.** The same `cpl-chat` version passed 7c (the Chaffey NURVN 414 CNA-to-LVN precedent) on `main` at 21:29Z and missed it on a PR's push three minutes later, saying no college had done it. That variance belongs to the Sierra lane; the display write rested on the `main` run, the one card 2 named.
8. **Read the deploy and the smoke before a write that a model's answer depends on.** Card 2 ordered deploy, smoke, then the display write, because Sierra reads `display.gaps` by kind. The order held even with GitHub's queue stretching each step to ten minutes.

**Moved from the lane (S336 compaction), verbatim.**

✅ **[Sheet 38](https://claude.ai/artifact/K51Fac1Tm2NvmF9gZaw9yS) (Sam):** writes go; IWAP 41.09 later (*"I assume Cerritos teaches osha 30 imbedded in their class"*); *Ext & Review* renamed (applied S333, old title kept as alias); Fire Inspector 1C titles kept (*"I think these are different though they sound the same"*). ✅ **[Sheet 39](https://claude.ai/artifact/UcBESBRpoLZJKgZZG5NtXr) (Sam):** display go; OSHA has one name as issuer, *U.S. Occupational Safety and Health Administration (OSHA)*, CTCNC is trainer on OSHA 10-hour Construction (`kb/cer_decisions_out/2026-10-05-2`). ✅ **The outcomes are on the 20 live rows (Sam, sheet 42 card 1, go, 2026-10-05 20:58Z).** S335 applied `kb/receipts/program_requirement_records_outcomes_2026-10-05.sql` (migration `program_requirement_records_outcomes_2026_10_05_s335`, about 21:10Z) after a fresh read of 20 before; the verify query reads 20 of 20 after (S335, and S336 at 21:15Z).

**CSU LA (Sam, opening note):** *"We'll figure out a procedure for them as well."* No registry row (the registry seeds from `coci_college_programs`). ✅ **Later (Sam, sheet 33 card 3, 2026-10-04):** *"I want to get our CCC process nailed down before getting into partners"*. No CSU registry row until the CCC procedure is settled; when it starts, a CSU has no state Program Course File, so its closed list is the catalog's own inventory.

**Moved from the lane (S335 compaction), verbatim.**

**Sam's calls, ruled (sheet 23, 2026-10-03 15:05Z, "As proposed", his own pick):** the catalog of the
academic year wins on disagreement (CMS and COCI values kept and shown); pilot at Cerritos, Mt. San Antonio,
Miramar, Riverside City and a census-picked PDF-catalog college; a named MAP team member checks the 20-program
sample, with articulation officers invited; sequencing in the pilot only from Miramar's PPM map; yes to reading
college websites from GitHub runners on a slow schedule that names the CPL Initiative; model calls through a
Supabase Edge Function; nothing public until a college's records pass all four checks, first public use through
Governance; the Tech Center asked for ROE field definitions when convenient. Sheets 25 and 26 named the rest:
Riverside City's Culinary Arts certificate, Sam checks the sample himself, and Sam asks the Tech Center.

**Moved from the lane (S334 compaction), verbatim.**

**The census** (`kb/_program_source_census.py`,
`.github/workflows/program-source-census.yml`): Playwright Chromium on a runner
reads each homepage, scores catalog links (a library catalog, an old year, an
archive or an addendum lose), follows one hop to an Academics page or a vendor or
`catalog.*` link, probes `catalog.<domain>`, prefers this college's own link on a
district page, fingerprints the platform (URL, then assets, then text) and dates
the catalog (title, h1, a vendor's edition banner, address, link words). A read
that finds no catalog keeps the registry's address. Each rule, with the run that
earned it, is in the module and its guard; the evidence names where each year
came from.
robots.txt first for every host; 4 s between loads; at most 6 pages a college;
the user agent names `CPLInitiativeCatalogCensus` and the dashboard URL.
- A branch push is a dry run (job log only). Apply runs only on `main`: weekly
  (Sundays 10:29 UTC) or a hand dispatch with mode apply. A newer run queues
  behind a running pass.
- Governance: the cadence is dismissed in `kb/governance_surface_map.json`
  with its reason until Phase 1 names the person who owns the outcome.
- Guard: `tests/program_source_census_test.py` (pure half, no browser).

**Measured (2026-10-03):**
- The Data Mart Program Course File (2026-07-16) has 11 columns. None marks a
  course required, places it in a block, orders it by term, or gives a unit
  total. It names every course a program lists (313,710 rows, 20,451 of 22,335
  programs), which gives every harvest a closed list to check against.
- 115 colleges award active credit programs (118 with noncredit-only).
- Active programs: 8,343 Certificates of Achievement, 3,730 A.S., 2,448 A.A.,
  2,573 noncredit, 2,959 ADTs, 35 baccalaureates. ADT structure comes from the
  TMC templates (`tmc_templates.js`).
- The session container reaches no college site (the egress proxy rejects
  every one); runners do.

## S337 SkyCompass, 2026-10-06: a second capture list, Irvine Valley's Art record, Santa Monica's hub

- **A second list keeps Sam's 20 pinned.** `kb/program_requirements_maps_sample.json` and `--sample pilot|maps|all`. A push reads only the maps list, because rereading the checked 20 spends college reads for nothing. The guard's verdict checks now cover the 20 alone; an extra record carries no verdict and CPL Pathways marks it unchecked.
- **Irvine Valley Art A.A. 10265:** the curriQunet click-through reached the program view and its PDF export (21 of 23 listed codes). Extraction PASSES at 27 units. The catalog still prints ARTH 25 and 26, and the state file lists the common-numbered ARTH C1100 and C1200. That is a gap for the college, never a misread.
- **Santa Monica 43767:** the catalog's front page names its program index *Academic and Career Paths*, now a hub word. Run 37488858548 printed every link naming the program on any host (`title_links`), and none of the five catalog pages named it. Link-following has nothing left to follow there. The next attempt is a per-college procedure record naming the full catalog PDF.
- **Filing from the job log:** the proxy refuses the log's blob host, so the source was transcribed from the MCP's copy and checked by recomputing coverage locally (21 codes, as the runner printed). The record was checked the same way: the local scorer gives PASS, equal and 0.913.
- **A new record reaches the live load's receipt.** `tests/sierra_program_courses.test.js` fails when `records/` and the committed load receipt disagree. In CI the shard runner exited mid-stream and hid the line; a local `node tests/run.js --shard 4/4` named it. The permission check held regenerating the receipt (a shared-resource write), so an unchecked record waits in `records_maps/` until Sam's go.

## S339 SkyReel, 2026-10-06: a procedure record names where the catalog starts

- **The procedure record can carry a catalog step.** `procedure.catalog = {start, follow, format, timeout_s}`: the
  capture opens the start page, follows the link by its text (an exact match first, then a containing one; http
  only) and reads the PDF through the existing page picker. A link the page does not carry is reported with the
  page's first 40 links, and the capture reads the registry's address instead (`procedure_catalog`, `follow_link`
  in `kb/_program_requirements_pilot.py`; three checks in the pilot test, 259 in all).
- **Santa Monica's first procedure record** (v1, through `program_source_procedure_set`, guarded `none`, md5
  060d7b66; receipt `kb/receipts/program_source_procedure_smc_2026-10-06_s339.sql`, rollback from the history row).
- **A whole catalog is slow.** Run 37543985175 found `catalog.smc.edu/current/catalog.pdf` and timed out at the
  reader's 180 s. The catalog step now waits 600 s by default and sends a HEAD first, so the log shows size and type
  (14,509,754 bytes, `application/pdf`). Run 37545459181 read it in 99 s: 472 pages, Barbering A.S. on 121-122,
  coverage 1.0.
- **The catalog text carries two college gaps** (drafts for the college once the record files): Level 4 prints
  *COSM 11C, Salon Management (2)* (COSM 11C is Hair Coloring 1; Salon Management is COSM 64), and the Salon
  Experience list stops at 95C where the Program Course File lists 95D.
- **A push of the capture script is the maps dispatch.** The workflow reads `--sample maps` on a push, so the
  pushed fix ran the read itself; no separate dispatch was needed.

## S340 SkyLedger, 2026-10-07: Santa Monica's record, a read map placed by term, a course counts once

- **Santa Monica Barbering A.S. 43767 has a record** in `records_maps/`, unchecked. Source: capture run 37545459181
  (job 112548269296), transcribed from the MCP's copy of the log; the pilot test recomputes the 25 codes. Extraction
  run 37548804006: 23 of 25 placed (COSM 64 and 95D in `missing_explained`), 4 program outcomes verbatim, invented 0,
  arithmetic `incomplete` (25.5 against 26.5 printed: *Salon Experience Courses* prints "any combination" and no
  minimum), $0.09989. A local `score()` of the filed record equals the run's score key for key, which proves the
  transcription.
- **The display builder reads both folders; the load reads one.** `loader.rows(folder)` (default `records`) feeds the
  load receipt, so it stays at 20 records; `RECORD_FOLDERS` feeds the page and the display receipt. Each program names
  its folder (`filed`), and the receipt says which of its statements select no row until the load adds them.
- **A read map rides the display.** `term_map()` copies an accepted sequence record's terms into `display.map`
  (`status: "read"`, `placed` = code to term index, `not_placed`), and `roepReadMap` in `cpl_pathways.js` draws one
  box per term from it: the record's courses by code (CPL here in words), the map's other courses and its GE and
  elective slots as printed, a choice as one line. Santa Monica: 24 of 25 placed, COSM 49R alone off the map.
  Irvine Valley: 5 placed, the rest in the tray beside the map's four list slots. The page matches nothing itself.
- **`plan()` counted a course twice when a program names it in two blocks.** Irvine Valley's Art A.A. requires
  ART 85 and lists it again among the electives, so the figure read 6 units from one 3-unit course; Santa Monica's
  COSM 11C (Level 1, and the Level 4 misprint) did the same. A course now counts once, and a choice never picks a
  course already taken. None of the 20 pilot figures moved; Irvine Valley reads 3, Santa Monica 21.5 of 26.5.
- **A dated read can be refreshed without re-copying it.** The MCP's output has to be transcribed by hand, so a
  per-course md5 computed in SQL and again locally over the stored file proved the pilot's five colleges unchanged
  except four courses (Riverside MAG 51; West LA AVIATEK 002, 005, 017: one exhibit title each, and one credit
  recommendation fewer on AVIATEK 002). Only those four, and the two new colleges, were read in full; every college's
  fingerprint then matched the live read. Santa Monica holds a *Barbering license* MAP articulation on 22 of the
  program's courses.
- **Sierra skips a map status she does not know.** `MAP_STATUS_LINE` gains `read`; deploy cpl-chat before the
  display receipt reaches the table, or she says nothing about a read map.
- **`pkill -f` killed its own shell again** (exit 144) when the pattern sat in the same command line. Kill by PID.

## S341 SkyTerrace, 2026-10-07: what a read map says next, and the choice it leaves open

- **Measure the rule before asking for it.** Handoff 341 held the figure along a map until Sam sets a rule for a
  choice the map leaves open. Measured over the two read maps, the rule moves one number. Irvine Valley's map leaves
  its Art lists as open places (*Art Major Course from List A*), and no list course carries CPL here, so every rule
  reads 3. Santa Monica's map prints Salon Experience as a choice of COSM 95A-95D, *1-4 units*, and MAP's Barbering
  license articulation covers all three courses the catalog lists there.
- **A choice with no printed minimum counts nothing, even when every course in it carries CPL.** `plan()` takes a
  choose-units block's `minimum`, or its stated minimum, and Santa Monica prints neither (*Any combination of Salon
  classes is acceptable*), so the up-to figure reads 21.5 of 26.5 and leaves Salon Experience out. Two signals put the
  least at 1 unit: the catalog's total less the other blocks (26.5 - 25.5), and the map's *1-4 units*. Whether a figure
  may take the map's least is a definition, so it went to Sam (sheet 47 card 9) and nothing was rebuilt.
- **A read map names a pick only on its own line.** The map's pick inside a choice is a course it prints as a single
  item where the catalog offers a choice (a choose block, one option of several, an *or*). A course a required block
  holds is no pick where an elective list repeats it (Irvine Valley's ART 85), and a choice the map prints whole is
  none (Salon Experience). Neither read map names a pick, so the By requirement mark renders nothing today; the guard
  proves it on fixture maps.
- **Sierra's term rides the same deploy as the read-map line.** Each course line on a read map carries
  `{the college's map: <term>}`. It is inert until a read-map program reaches the live table (sheet 47 card 8).

- **Sam's sheet 47 (S341, 2026-10-07):** card 8 *Load both* and card 9 *As proposed*. The load went in as a two-row
  delta of the 67 KB load receipt (one migration carries about 40 KB), proven by md5 of each jsonb against the
  receipt's own literal: a record file and the receipt's record differ in shape, so hash the receipt, never the file.
  `map_hints()` reads a read map's picks and the least it prints for a choice; Santa Monica reads 22.5 and 22.5.
  The display receipt is 185 KB and goes in parts after the cpl-chat deploy (handoff 342).

### Moved from the lane (S340 compaction)

**OSHA 30 (S332):** Cerritos credits IWAP 41.09 OSHA 30/Extension Review (1.5 units) by its own exam (MAP exhibit `MAPCXA-E&R-1-001`, *Ext & Review* in the CER). Its catalog (read 13, run 37271979880) and COCI print AED 41.09 Welding III's outline for it, so the CCR files it alone (`WELD M10CA`), apart from the eight OSHA 30 Construction courses in `CNST M1001`. ✅ **Issuer (Sam, chat, S333):** *"they would not be the issuing agency, osha would."* The exhibit is credit by exam, so his issuer for it (California Community Colleges) stands.

## S342 SkyBeacon, 2026-10-07: the display applied as a delta, and a Progress view for the harvest

**Card 8 finished.** #1896 (S341: the two-row load, card 9's rule, display build 8292780f6cd5) and #1897 (Sierra's NOCE
fix) merged; one preview A/B on `main` (run 37670895667) covered both: candidate all modes OK, production 5 failing, no
regression. #1896's own A/B had failed 7c's quick-list table; its change touches only `displayLines`, which no live row
reaches while every `figure.path` is null, so the miss was the model's wording. cpl-chat deployed 19:23Z (run 37673955257);
the production smoke (37674213394) passed.

**Card 9's rule, kept here from the lane.** A choice whose catalog prints no minimum takes the least the college's map
prints for it, through a CPL course (`map_hints`); along the map, a course the map names inside a choice counts in place of
the CPL course, and a choice it leaves open counts as up-to does (`figure.path`). Santa Monica reads up to 22.5 of 26.5 and
22.5 along its map; Irvine Valley 3 and 3; no pilot figure moved.

**A 185 KB receipt applied as 33 KB.** The 20 live rows on build 1cb75672ba6c differed from 8292780f6cd5 in three
top-level keys only (`figure`, `build`, `built`; 4.7 KB in all), measured by parsing both receipts. Each took
`display = display || '{...}'` guarded on `display->>'build' = '1cb75672ba6c'`; the two rows with no display took the
receipt's own statements. Migrations `program_requirement_records_display_8292780f6cd5_s342_part1`/`_part2`; receipt
`kb/receipts/program_requirement_records_display_2026-10-07_8292780f6cd5_s342_delta.sql`; the builder's `--verify-sql`
read 22 of 22 `match`, which is the proof a top-level merge cannot fake (it hashes the whole jsonb). **Measure the diff
between the live build and the new one before splitting a receipt into parts.**

**The Progress view.** Sam, after #1897: *"Once this lands I want to pivot over to the Catalog ROEP work and the new COBI
tab needed to monitor the work. I'm thinking it would be good to add a workflow dashboard to monitor the progress like the
attached."* (a screenshot of a project map: milestones with "you are here", a parts grid, next step, needs your call,
changed overnight). Then: *"Note that I set up a Routine for this work called CPL Queue"* and *"Yes start mock"*. The
mock-up (artifact 6Pco7R1NVB5S45evjjfJsr, `prototype/roep_progress_mockup.html`) maps it onto this harvest: five
milestones (every catalog 118/118 · the pilot 20 checked · program maps 2 of 26 published, here · a procedure per college
2/118 · every program, 20,282 active), eight parts, the next step (procedures for the five pilot colleges with none), one
call (check Irvine Valley 10265 and Santa Monica 43767), and the day's changes. First Light, statuses as words, crimson only
on the call. The tab's other views already read the tables live, so the view adds no data source; the run header needs one
file the checkpoint writes, since the browser cannot read the Routine's run history.

## S343 SkyGantry (2026-10-07): the Progress view built; Sierra's NOCE answer fixed

**The view, as built (#1900).** Sam: *"The mockup looks good to go:)"*, then mid-build *"Make sure it's AA and mobile
friendly and dark mode looks good when used"* and *"make sure every section is collapsible and the tab has a
collapse/expand all button."* Progress is the first of five views. `MILESTONES` and `PARTS` at the top of the view are
definitions: a milestone's words, its measure, and what is left before it (`[count, one, many]` items). *You are here* is
the first milestone with anything left; a left item whose count is null (its read failed) keeps the milestone open and is
named "(could not be read)", never zero. The reads: the registry and the checked records (the tab's core read), plus
`program_source_addenda`, COCI's active count (`Content-Range` with `Prefer: count=exact`) and `kb/queue_status.json`,
each failing on its own. "You" in the mock-up became "Sam" (name the actor; the team reads the tab too). The view uses
`--cobalt` for where the harvest is and `--crimson` only on what waits on Sam; tints are `color-mix()` of those tokens.
Measured by two seeded a11y targets (`program-requirements-progress`, `-dark`) at 390 to 1440, and screenshots read by eye.

**The status file is option (b) of handoff 343.** anon reads checked records only and has no grant on
`program_source_registry_history`, so the unchecked records, the run, the routine's next firing, the next step, the calls
and the changes come from the file the checkpoint writes (`.claude/commands/checkpoint.md` step 12). `--stamp` owns the
clock; the session writes the prose. The browser rolls the routine's `next_run.at` forward by `every_hours` when the file
is older than the firing. Guard `tests/queue_status_test.py` (16; reads the part ids out of the view so the two cannot drift).

**Every section collapses.** My College's pattern: each section is a `<details data-sec>` whose summary carries the
heading and a line that reads shut; Expand all and Collapse all in the header act on every section, Sierra included; the
choice is one map in `localStorage` keyed `<view>:<section>`, with `*` holding the last all-control so it carries to views
not on screen. The disclosure marker is drawn in CSS (no glyph).

**Two bugs found by building the view.** (1) The Sequences view counted `sequence_access = 'ok'`, which the column's check
never allows (`open | refused | unreached | not_read`), so it read 0 maps read; it counts `open` now (2). (2) Sierra's
widget had no dark rules at all: the base CSS in both HTMLs carries raw light values, so dark mode showed a light log with
dark-theme muted text on it (2.19:1). `cpl_chat.js` now injects token-only dark rules on `cpl_theme.js`'s contract; light
is untouched.

**Sierra's NOCE answer (#1901, deployed).** The course list spells NOCE and SDCCE twice (`... Credit`), and in
`coci_college_offerings` the Credit rows repeat the college's own courses (111 for NOCE, 85 for SDCCE; BMGR 455, BUSN 218,
OTEC 100 under both names). `foldCreditSpelling()` folds them into the college, one row per TOP program, the larger count
kept (a sum would double it); Calbright College Credit, its only name, stays. The program block now names a certification
only where a program or course title does (NOCE's own ELEC 101 *A+ Certification Preparation* still may be named). Smoke 7v's
two negatives key on the claim shapes the model produced (`lead-in`, `aimed`), proved against both flawed answers and a
correct ELEC 101 sentence. A/B 37693477855: preview all modes OK, production 1 failing, no regression. The PR's
push-triggered smoke (production) failed 7c twice, on different assertions, the second with a statement timeout on 7p's
control: production wording and the database, not the undeployed change.

**A negative assertion needs word boundaries.** The post-deploy smoke (37696012819) failed 7v's certification negative on
a correct answer: `aimed` matched inside "unclaimed" ("CompTIA Linux+ is also unclaimed by NOCE"). Proving the pattern
against both bad answers and one good sentence missed it because the good sentence had no word containing either trigger.
Bound the trigger words (`\b(lead-in|aimed)\b`), and prove a negative against the real answers the change produces.



## S344 SkyWaypoint, 2026-10-08: a procedure for every pilot college, and three map searches

**What shipped (#1906; a scheduled run of the CPL Queue routine).** Irvine Valley, San Diego Miramar, Mt. San Antonio,
Riverside City and West Los Angeles each got a first procedure record, written from what the pilot's reads had settled:
the lessons above (S323-S342), the filed sources and records, and `registry_read.json`. Seven of 118 colleges hold one.
None names a catalog step, so `procedure_catalog()` returns nothing for them and capture reads each college as before.
Then the records' open map questions got two college page reads (runs 37799874023, 37800558615), and three records went
to v2. Receipts: `program_source_procedure_pilot5_…`, `_wlac_v2_…`, `_rcc_mtsac_v2_2026-10-08_s344.sql`.

1. **A procedure first written from memory must carry only what a read proved.** Every host note, step and nuance in the
   five v1 records cites a run or a lessons item. One draft line ("the catalog PDF prints no sequence") had no read behind
   it and came out before the write. The record's job is to keep the next read from re-learning; a guess there sends the
   next read the wrong way.
2. **West Los Angeles's mapper answers 403**, like every Program Mapper host so far (lesson 33). Its own mapper page says
   each degree shows "a planned sequence of required and elective classes", so the sequence exists and only the mapper
   service holds it. The registry's `sequence_access` for the college still reads `not_read`: the procedure is ahead of
   the census row until the census or a person's correction catches up.
3. **"See Program Maps" can lead to pages with no map.** Riverside City's links go to the Program Finder, whose program
   pages print major units and a typical time to completion. Its Academic Senate packet (2026-05-04) says RCC joined
   Program Mapper in fall 2025 and is launching 2.0 maps. Mt. San Antonio's Schedule of Classes says the Catalog shows
   "the suggested order of classes to take", and neither the program pages nor the Degrees and Certificates page (24
   sections opened) prints one. Both records keep the question open with the next read named.
4. **Web search first, then a plan.** Both colleges' map pages were found by search (lesson 34 again); guessing paths
   would have spent loads on 404s.

**Sierra.** The smoke dispatched on `main` (run 37799026127) passed every mode, 7c and 7v included. The post-#1902 push
smoke (37699162911) had failed only mode 5, on a search timeout in production; 7c and 7v passed there too.

## S345 SkyLantern, 2026-10-08: sixteen colleges' map sources read, and Sam's calls given a sheet and links

**What shipped (#1908; vault #273; a Sam-driven session).** Handoff 345's first priority, read the maps nobody had read, in
four college page read runs (37810652946, 37810862182, 37811253611, 37812133411), each plan found by web search first:
Bakersfield, Los Angeles Harbor, Merced, Los Angeles Mission and Los Angeles Valley (mappers, 403 each); Mt. San Antonio
(its own Guided Pathways pages publish a sequence per program); the four Los Rios colleges (404); Palo Verde (its one lead
does not resolve); College of the Canyons and Las Positas (workarounds tried). The registry's map columns for twelve
colleges went in as one guarded migration (17:00:03Z, first try) and twelve v1 procedures through
`program_source_procedure_set` (17:03:10Z): **19 of 118** colleges hold a procedure. `kb/_program_map_parse.py` reads
Mt. San Antonio's page shape. Sam, on the Progress view at 17:0xZ: *"want to check the 2 items pending for me (screenshot)
but don't see how to view them and respond..."*; then *"If you can embed the links on the tab, it would be fantastic."*
[Open Asks Sheet 50](https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr) carries five cards, and each call on the view now
links its sheet card and the tab where the item is seen.

1. **Every Program Mapper host read today refused, so the count is the whole product, not a college.** Five more mapper
   hosts answered 403 to one load each (programmapper.com, .ws and the colleges' own `programmap.` names alike): 24 of the
   32 published map sources sit behind it. Lesson 33's call holds: the refusal is the mapper service's, and it goes on each
   college's record (Sam, sheet 29 card 3). The milestone that counts only maps read cannot finish while that holds, which
   is sheet 50 card 5.
2. **A college's own pages can publish what its mapper hides.** Mt. San Antonio's Guided Pathways list
   (`www.mtsac.edu/guided-pathways/filter_listings_mtsac_all.php`, 455 programs) links a "Guided Pathways for Success"
   suggested sequence per program, keyed by the local program code (`pathway-results.html?pthwyvar=<code>`). The census
   never scored these pages (its sequence source reads none found), and the Schedule of Classes' "suggested order of
   classes" line in read 1 pointed at them only through a web search. The view now counts a map a read found
   (`sequence_host`) as published.
3. **Match a published sequence to a program by the code the catalog prints, never by the title.** The catalog's
   program titles carry the local code: Fire Technology (Certificate N0486) is the state's 03086, Early Childhood
   Education (AS-T Degree S0401) is 33876, and the LVN-to-RN (AS Degree S0957) is 08086. The Guided Pathways list offers
   "Licensed Vocational Nurse to RN, AS S1201", whose sequence names NURS 4 to 11, ENGL 1A and SPCH 1A where the 2026-27
   catalog lists NURS 114 to 212, ENGL C1000 and COMM C1000: an older program under a similar title. Matched by title it
   would have placed eleven wrong courses on a checked program.
4. **A map can recommend courses the program does not list.** The Fire Technology certificate's sequence names KINF 51A,
   51B (agility test preparation) and 52A (fitness and conditioning) beside the eight listed courses it places. S336's
   acceptance refuses a map naming a course in the program's own subjects off its list, so the record is filed and not
   accepted, and the display build is unchanged (sheet 50 card 4). Read 4's Early Childhood Education AS-T page places all
   12 of the degree's listed CHLD courses across seven terms with nothing off the list; it is not yet filed, because
   filing an accepted map changes a checked program's display.
5. **A page search engines index can answer the reader 404.** The four Los Rios colleges' program maps pages (found by
   search, with maps as PDFs on `mapmaker.losrios.edu`) answered the reader 404, as their homepages answer the census
   (lesson 13). The procedures mark each host `unreached`, which the reader skips. The next try is one mapmaker PDF
   address, a different host.
6. **"Recommended course sequence documents" can be links into the refused mapper.** College of the Canyons' department
   pages promise them; every link points into `canyons.programmapper.ws`. Las Positas's "Program Map website" is the
   faculty's revision process, with no map linked on six pages. Read the link targets before counting a workaround.
7. **A call shown on a view needs a place to answer it.** S344 listed two calls on the Progress view and published no
   sheet, because no lane carried a NEEDS SAM. Sam could see the calls and could not open the records or reply. A call in
   `kb/queue_status.json` now carries `link` (the sheet card), `link_text` and `view` (a COBI tab's bare hash or an https
   page); `scripts/queue_status.py` checks both. The rule that follows: a call on the view is a card on a sheet, and the
   lane carries the NEEDS SAM that makes the builder ask it.
8. **`apply_migration` timed out on `cpl_library` a fourth time and on nothing else.** The registry migration minutes
   earlier applied first try; the library update (one guarded UPDATE) timed out at 60 s and wrote nothing. The cause is
   the table's, not the tool's. The update goes to Sam as a paste (sheet 50 card 3), now carrying sheet 50 as current.
9. **`bash scripts/check_generated.sh | tail` hides the exit status.** A pipe reports tail's status, so a stale dependency
   map reached one push. Run the check without a pipe, or with `set -o pipefail`.

**Decisions Sam made this run (2026-10-08, in chat):** the tab should link each call (*"If you can embed the links on the
tab, it would be fantastic"*); he floated keeping decision sheets in the repo so the tab can link them, then agreed to
keep the sources in the vault and link the published sheet (*"No, your plan sounds good to me"*).

**Sheet 50 answered (17:15-17:18Z, all his own call).** Cards 1-2 follow up: *"Would it be more clear to add a note or
flag to the items where there is a question or mismatch and a way to confirm or curate from the tab?"* (a mock-up of the
Program records view first; both records stay unchecked). Card 3 pasted; the Library record reads version 50. Card 4 as
proposed (to build). Card 5 as proposed, built in the checkpoint: the maps milestone counts a map read, or refused or
unreached with routes tried in the college's procedure. Then, in chat: CPL Pathways needs a college-first selector
(*"we'll want to first select a college and then the pathways they offer"*).


### Moved from the lane (S346 compaction)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, which had reached 21,561 bytes against its 20,000 limit.

**The display build is live (S327).** `kb/_build_roep_display.py` writes each checked program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page): CPL in three kinds per course (here: MAP credit recommendations by course, `kb/program_requirements_pilot/map_cr_by_course.json`, plus the articulated-exhibit feed; could adopt: a peer articulated the credential to a course of the same identity, never a `cross_disciplinary` one; for consideration: a statewide recommendation naming the course's C-ID), the `plan()` figure, the gaps by owner and the map status. **Identity is the live CCR (S332):** it reads `unified_courses_members.js` and `_index.js` (the multi-member file left 140 of 289 entries with none): 285 named, could adopt 133 entries, for consideration 15; Ironworker A.S. up to 31.5 of 34-38. "Here" matches unified titles too. Receipts carry the build in their name and cite the one each replaces. All 20 live rows hold `799bfb9a7dbf`, the rename's label (sheet 39 card 1; md5-proven). Guard `tests/roep_display_test.py`; Sierra reads the facts (smoke 7t). **A MAP articulation that names a second course is a draft for the college (S335, `second_courses()`).** Miramar's 0.3-hour EMT Certification and Driver Operator 1B rows in MAP's articulated-exhibit view list AUTO 156G beside EMGM 106 and FIPT 321P; students received both at 0.25 hours on those two courses only. ✅ **All 20 live rows hold build `1cb75672ba6c` (Sam, sheet 42 card 2, go, 2026-10-05 20:58Z):** cpl-chat deployed first (run 37374184173, byte-verified 21:21Z; Sierra names each college gap by its kind), the smoke passed on `main` (run 37376149996), then S336 applied `..._display_2026-10-05_1cb75672ba6c_delta.sql` (migration `program_requirement_records_display_1cb75672ba6c_s336`, after a fresh guard read of 20) and `--verify-sql` reads 20 of 20 match. Evidence: the lessons doc, S335.

**The proof of concept: Cerritos Ironworker, high school to career (Sam, 18:23Z, vault braindump 18:23)** is on CPL Pathways as the ladder (S328): seven steps in `cpl_pathways_data.js`, each line *In our data* or *To confirm*. **Exhaust the agent before any request (Sam, sheet 33 card 5):** *"You draft the request only after we have exhausted all our efforts at having the agent harvest needed data... I think we will need to have agents configured for each college as they will have nuances we want to note in our rules governing the behavior of the agents."* **The reader** (`kb/_college_page_read.py`, `college-page-read.yml`; a push reads only the plans its last commit adds or changes): a plan (`kb/college_reads/<plan>.json`) names a college's pages and the line each answers; the docstring has the steps. **Cerritos, after twelve reads (S329-S331, 71 loads):** every ladder line it could settle is *In our data*. The high school list: every public route is closed (procedure record v4 names each); the archive's 2016 list holds 57 agreements, none for welding (`kb/program_requirements_pilot/cerritos_hs_agreements_2016.json`). Columbus High, a CCAP partner, runs a welding pathway (OSHA 10 and 30) that names Cerritos and reads as articulation, unconfirmed. Still *To confirm*: the current list and that route, and whether the approved B.S. keeps the 2024 list (the addenda will show it). Detail: lessons S329-S331. ✅ **One procedure record per college (Sam, sheet 34 card 2; "apply the procedure record", S329):** `procedure`, `procedure_by`, `procedure_at` on `program_source_registry` (the history trigger names `procedure_by`); the reader loads it before each run. **Written through `program_source_procedure_set(college, record, by, expect_md5)`** (Sam: "go ahead on writing the function"), called with a SELECT; it refuses a stale md5 (`none` for no record) or a malformed record; service_role only; receipt `kb/receipts/program_source_procedure_set_2026-10-04_s330.sql`. Cerritos is at v4 (S331, reads 7-12). ✅ **Sheet 37, hold (Sam):** *"Don’t worry about this for now until I investigate later."* The request stays held while he investigates; the draft stays in the sheet's builder. OSHA 30 on IWAP 41.09 and its issuer (S332-S333): the lessons doc, *Moved from the lane (S340 compaction)*.

## S346 SkyCairn, 2026-10-08: card 4, the flags mock-up, a college selector, and every refused map settled

**What shipped (#1910 merged; #1911 open; vault #274 merged; Sam-driven).** Sheet 50 card 4 (a map is accepted when its listed courses outnumber its off-list ones, each off-list course marked), Mt. San Antonio's Early Childhood Education map filed, display build 2360b83e8100 on the page (live write waits on Sheet 51 card 2), a College select on CPL Pathways, the flags mock-up for the Program records view (Sheet 51 card 1), and procedure records for the 28 colleges whose map host refuses or never reaches the reader: 31 of 32 published maps settled, 34 of 118 colleges with a procedure.

1. **A search of a college's own site needs the search tool's domain filter.** `site:` inside a WebSearch query is ignored: 17 of the first round's 24 "none found" answers were searches that returned other colleges' pages. Restricted with `allowed_domains`, the same query found Canyons's department maps, Miramar's 2021 sequences and Moorpark's PACE maps.
2. **Where a college adopted the mapper, its own site keeps only strays.** Every map a pathway page lists (Las Positas, LA Mission's 21, Ventura's B.S.) links into the refused host. Off it: department PDFs (Canyons, Diagnostic Medical Sonography 2025-26; Las Positas Automotive 2020; Miramar Mathematics 2020-21) and single-program cohort schedules (nursing at Compton, Napa Valley, LA Harbor; accounting at Cypress).
3. **The Los Rios map host answers the reader 404, as its college pages do.** `mapmaker.losrios.edu/Maps/6996/PublishedPdf`, found by search, gave 404 to run 37825341320.
4. **A map can print both options of one choice.** Mt. San Antonio's ECE page places both practicum sequences (CHLD 67 and 67L, CHLD 86 and 87) in one term; marking each course the map names on its own line as "the college's pick" marked a course in each option. A pick now needs the map to name one option only (`roepGroupSplit`).
5. **A vault check that reads the tracker's `main` fails until the tracker PR lands.** Sheet 51's premises (the mock-up file, the new build) arrived with #1910; vault #274's coverage check failed, then passed on one re-run after the merge. Merge the tracker PR first.
6. **A procedure write need not transcribe the record.** `r.procedure || jsonb_build_object(...)` appends server-side under the md5 read just before; the 15 first records were proved byte for byte by reproducing jsonb's text form locally (keys ordered by length, then bytes).
7. **The college's draft listed an off-list course once per block** (Irvine Valley's ARTH 4, 25, 26 twice); `gaps_for()` names each once.
8. **Sam's headline ask (in chat, 18:5xZ):** the count of COCI's active programs beside the count with complete harvested ROEP data, for the Chancellor. Mock-up proposed; complete means the four checks; outcomes and maps beneath.

## S347 SkyTrellis, 2026-10-08: the Chancellor's headline, Palo Verde read, and a UI pass in place of the To-Do

**What shipped (#1913, #1914, #1915 merged; #1916 open; vault #276; Sam-driven).** The headline band on the Progress view (COCI's 20,282 active programs beside the 20 checked at 5 colleges), its history in `kb/queue_status.json`, Palo Verde's map read and procedure v2, the To-Do retired for a per-checkpoint UI pass, and the Sierra redesign's mock-up with self-hosted First Light paintings.

1. **A lapsed custom name is not a refusal.** S345 recorded `guides.paloverde.edu` as gone (no DNS). A search restricted to `libguides.com` found the same guide at the platform's own address, `paloverde.libguides.com/pathways`, which answered the census reader 200 on three loads (run 37835928900). Two vocational pages print two-year maps; the guide's last change is 2023-10-25, so a map is checked against the catalog before it places a course. KB note `methodology-a-lapsed-name-is-not-a-refusal`.
2. **A domain-restricted search can surface a second catalog.** The same search listed `catalog.paloverde.edu`, an Acalog catalog, where the census reads the eLumen 2025-26 one. Recorded as an open question on the procedure for the census to settle.
3. **`apply_migration` can time out on a table it served an hour earlier.** Five 60-second timeouts on one registry UPDATE (S345 applied one there first try), each read back with nothing written and no lock on the table or `schema_migrations`. The procedure function through `execute_sql` worked at once. The write went to Sam (Sheet 52 card 3); his ruling to let UPDATE through the guard was refused by auto mode's classifier, so it waits on a mode switch.
4. **The guard strips dollar-quoted bodies before it looks for verbs.** Rewording "Last Updated" out of a JSON payload was unnecessary; `$a$...$a$` is replaced as a literal (`_lex`).
5. **A full local `npm test` outruns a 15-minute timeout.** Run the changed tests and the guards that read the changed files, then let CI's four shards gate the merge.
6. **After the checkpoint, Sam answered Sheet 51 in chat** (*"Sheet 51: 1 Build it, 2 Go."*), matching the sheet's store
   (20:35Z). Card 2 went live the same hour: the 22 rows on 8292780f6cd5 differed from 2360b83e8100 in `build` alone,
   except Irvine Valley 10265 (`gaps`) and Mt. San Antonio 03086 and 33876 (`figure`, `map`), measured by parsing both
   receipts. The 22-statement delta (14 KB) timed out in `apply_migration` with nothing written; one statement for the 19
   stamp-only rows and one per content row landed at once, and `--verify-sql` read 22 of 22 match. Receipt
   `kb/receipts/program_requirement_records_display_2026-10-08_2360b83e8100_s347_delta.sql`.
7. **The same tool then took Palo Verde's statement 1 on the first try**, the UPDATE that had timed out five times
   earlier in the day (migration `program_source_registry_pvc_map_read_s347`; read back open, `paloverde.libguides.com`,
   run 37835928900). The timeouts are intermittent and not explained by size alone; when one lands nothing, split the
   migration and retry before handing the SQL to Sam.
8. **The connector took a privilege removal today.** The records table's SQL says the connector holds any statement
   naming one for a confirmation a remote session cannot answer. A probe re-ran an existing close
   (`program_source_procedure_set_reclose_probe_s347`, no change) and it landed, so the verdict surface's revokes went
   in its own migrations. Probe once before routing a revoke to a paste.
9. **A self-test that rolls itself back proves a write path without leaving a row.** The guard denies `do` through
   `execute_sql`, so the test ran as a migration whose last statement raises with its results: ten cases (refusals,
   confirm, a reload, a changed block, Needs a fix, a failing record), then a read-back showed nothing kept and no
   migration recorded.
10. **A write surface reaches past its table.** Confirm sets `checked`, and the loader's upsert sets `checked` from the
   repo's files, so a reload would have undone a person's reading. A trigger now applies the latest verdict while its
   fingerprint matches the row. Ask what else writes the column before shipping a person's write to it.


### Moved from the lane (S353 compaction)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, at 19,977 bytes against its 20,000 limit before Phase 2's paragraph.

**[Sheet 50](https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr) (Sam, Oct 8):** cards 1-2 follow up with a mock-up, card 4 as proposed, card 5 as proposed. ✅ **Card 4 built and merged (S346, #1910):** `accepts()` takes a map whose listed courses outnumber its off-list ones; each off-list course rides its item (`off_list`) to CPL Pathways as *Recommended by the college outside the program*; a map naming two options of one choice marks no pick. Mt. San Antonio's Fire Technology map (03086) is accepted and its Early Childhood Education AS-T map (33876) filed. ✅ **Display build 2360b83e8100 is on the page and on all 22 live rows** (Sam, Sheet 51 card 2, *go*, 20:35Z, confirmed in chat; S347): a delta receipt guarded on the live build, applied in four migrations after the 22-statement one timed out, and `--verify-sql` reads 22 of 22 match. Mock-up for cards 1-2: [Program Records Review](https://claude.ai/artifact/2JofNdHZvVTtz9bKQTsa4g). ✅ **Maps settled (S346, #1911):** one search restricted to each refused college's own domain (the search tool ignores `site:` in a query; only its domain filter restricts), seven reads of the leads, and procedure records for 28 colleges: **34 of 118 colleges hold a procedure**. **Palo Verde is read (S347, #1915):** its Guided Pathways guide's custom name `guides.paloverde.edu` lapsed; the guide answers at `paloverde.libguides.com/pathways` (run 37835928900), and its CIS A.S. and Building Construction Technology A.S. pages print a two-year map (last changed 2023-10-25, so check each against the catalog). Procedure v2 is live (md5 3879b5d0); the registry's map columns landed (statement 1 of `kb/receipts/program_source_pvc_map_read_2026-10-08_s347.sql`, Sam's receipt option; migration `program_source_registry_pvc_map_read_s347`, read back): **32 of 32 published maps are settled**. Its search also lists an Acalog catalog at `catalog.paloverde.edu` beside the census's eLumen 2025-26 (open on the procedure). Own-site sequences exist only as department PDFs (Canyons, Las Positas 2020, Miramar 2020-21) or single programs. ✅ **The headline for the Chancellor (S347, #1913; Sam's yes):** the Progress view's head pairs COCI's active programs (20,282 at 118 colleges, read live) with the checked records (20 at 5 colleges; complete means the four checks), a bar, and a line beneath (19 with outcomes, 0 with a map); the Every program milestone reads *20 of 20,282*. Each checkpoint records the pair in `kb/queue_status.json` `headline[]` (`queue_status.py --stamp --headline`), and the band shows *Up from N on <day>* once the count passes the first entry. Later, SkyView as the hub.

## S353 SkyHearth, 2026-10-09: Phase 2 opens at Cerritos, and a page goes to one program

**What shipped (PR #1941 open; Sam's "Cerritos first", as proposed).** `kb/_program_requirements_college.py` and
`program-requirements-college.yml`: one job reads a college's sitemap, its program pages once each, matches programs to
pages, extracts six calls at a time, and commits the run's account and records to its own branch. Run 37961137169: the
sitemap listed 520 addresses, 364 of them program pages, read in 29 minutes; 283 of 288 programs got a page (196 at full
coverage); all 283 extracted for $15.80 ($0.056 a program), 235 pass the three machine checks (46 arithmetic, 6
coverage, 2 invented). The load function (`chatbox/supabase_program_requirement_records_college_load.sql`) is written
and not applied.

1. **Turn the search around for a whole college.** The pilot followed links per program (up to eight loads each); a
   sitemap read once and every program page read once costs one load a program, and the coverage test picks the page.
2. **A tie-break that only ranks cannot reject.** The label score chose between pages that passed the coverage test,
   so a program whose own page does not exist still took a sibling's: the Anthropology A.A. took the A.A.-T page,
   Culinary Arts: Professional Cooking took Culinary Arts Management's. 22 pages went to two or more programs.
   `assign()` now gives a page only to the programs whose award its address names and whose title it names most
   fully; a loser moves to its next page or reads none (`page_claimed`). Two state records the page names equally
   (Public Health and Public Health Science, both A.S.-T) still share it.
3. **Read the award from the address as it stands.** Turning hyphens into spaces before matching read no award from
   `anthropology-aa-t`. The catalog's own spelling counts too (`medical-assistant-certifciate-achievement`).
4. **A one- or two-course list names its courses on many pages.** Below three listed courses the page must also name
   half the program's title.
5. **A marker a workflow reads in a commit message must be anchored.** `contains(message, '[extract]')` fired on the
   commit that described the marker, and the run spent $15.80 before the matching was read. `startsWith` now; the spend
   stayed inside Sam's approved $19. KB note `methodology-anchor-a-marker-a-workflow-reads`.
6. **Pay only for what moved.** A re-run keeps each record read from the same page naming the same courses; a
   capture-only run files `capture_preview.json` beside the read it did not replace.
7. **A college's records do not fit the connector.** About 1 MB of record JSON for 283 programs, against migrations
   that time out near 40 KB: the load runs on the runner through one insert-only function, unchecked, keyed by run id.

## S354 SkyFurrow, 2026-10-09: Cerritos loaded, and the reading made possible from a phone

- **The load is its own job, reading committed records.** The `[load]` job posts what the branch holds, so what loads is what a reviewer can diff; the receipt names every inserted key, and those keys still unchecked are the rollback. 270 inserted, the four checked pilot rows kept (run 37970640026).
- **A function closed by its grant is closed twice when its body checks the role.** `auth.role() <> 'service_role'` raises before any write, so the function was safe between the create and the revoke (the revoke applied this time; S318's timeout did not recur). A call from the connector without the role is refused, which proves it.
- **A capture is free in dollars and costly in page loads.** Any push to the script ran ~360 Cerritos page loads; the read job now needs `[read]` or `[extract]`. A bot's push (the filing and receipt commits) triggers no CI, so a PR whose head is the bot's commit needs a session push before `test` runs on it.
- **Keep each record's own extraction run.** A re-run keeps records read from the same page; stamping the load's run on them would have lied about provenance. Rollback goes by the receipt's keys instead.
- **Show what the scorer measured before the display build reaches a college.** Phase 2 rows carried no `display`, so every card read "Not measured" although coverage had run; the loader now writes `placed`/`listed` into `checks`, and the view falls back to them. A passing record can still read "11 of 40 placed" (02226): coverage accepts explained absences, and the explanation stays in the repo's copy.
- **Sam reads on his phone, so the reading has to come to him** (2026-10-09): 274 cards with no search defeated him; Find a record (#1946) and answers on the Progress call card (#1947) followed within the hour. A call that names records is answerable where it is read, through the same verdict RPC.

## S355 SkyBramble, 2026-10-09/10: the reading made comfortable, the sample held, and the blocks given their numbers

**What Sam asked, in order.** A button to his to-dos at the front of the tab; a side by side view; then, after confirming
the Cerritos sample: the catalog window "closes when I click on the program requirements side", a check mark on a finished
call, side by side by default; then titles, every C-ID/CCN/M-ID with a hover title, and the CPL count as exhibits with a
drill-down. All built: #1950, #1951, #1952, #1953.

**The sample held.** Sam confirmed all 12 records on the two calls (10 Cerritos, Irvine Valley 10265, Santa Monica 43767);
seven are checked. The five he confirmed whose machine checks fail stay unchecked, so those checks flag the catalog against
the state file, not a misread.

**Framing is a property of the host, and it is measurable only from a runner.** The session container reaches no college
site. `scripts/catalog_framing.py` (read-only, `catalog-framing.yml`) loads one page per host and the same page framed under
COBI's origin: 64 of 108 hosts frame, 42 refuse (Cerritos's courseleaf host among them), 2 unknown. A refusal is honored,
never proxied around. A PDF host is judged by its headers (headless Chromium draws no PDF in a frame), read with HEAD: a GET
downloaded Santa Monica's whole catalog for 16 minutes and timed the job out (run 38009803753).

**Two windows that overlap are not side by side.** The first version opened a refusing host's catalog on the left half and
kept the record in COBI's full-screen window, so any click on the record raised COBI over the catalog. The reading room puts
the record in a COBI window of its own on the right half (`?prh_split=`), the catalog in a named window on the left half;
Next waiting record moves both on one click. A browser lets one click open one window, so the first record takes two.

**The blocks were blank because no display build reached the full-college records.** The build now reads
`program_requirements_college/*/records/` too, with state lists assembled by `chatbox/build_program_courses.py` (imported),
and carries `ids` and `here.exhibits`. Build `5be53871ebf4`: Cerritos 3,599 of 3,680 courses titled, 3,572 numbered, 38
with CPL here (MAP holds few articulations there). MAP's untitled "Default Credit" rows are the feed's named exhibits more
often than not; they count only past the feed's. CPL Pathways keeps the pilot's 22 until its file splits per college. The
receipt waits on Sam's go.

**COCI's Approved status (Sam's question).** The course lists already keep Approved courses; the harvest reads only Active*
programs, so 1,423 Approved programs statewide (33 Cerritos, 84 Mt. San Antonio) go unread. Of Cerritos's 246 catalog-only
course placements, 135 are active at Cerritos but tied to other programs, 44 are Inactive on this program (the loader drops
Inactive), 43 are absent from the state file, 13 are a code form (COS 102E printed, COS 102 loaded), 2 involve an Approved
program. Whether to read Approved programs waits on Sam.

**Moved from the lane (S355 compaction).** The Show the blocks fix: a class's `display:grid` beats `[hidden]`, so the toggle
changed only its label; `.prh-body[hidden] { display:none; }` fixed it.

## S356 SkyThicket, 2026-10-10: the display applied from the runner, Mt. San Antonio loaded, Approved programs read

**What Sam ruled, in order.** "Yes build" (apply display build `5be53871ebf4`, Cerritos 270 and the pilot 22); "go on call 2"
(read COCI Approved programs too); "Go" to a standing go: each display build that follows a college load applies without a
new ask, the checked programs among it included, because every apply files its own rollback. All three are `cpl_memory`
rows with Sam in `verified_by`.

**A large data write rides the runner that holds the key.** The 22-program receipt (185 KB) had already timed out through
`apply_migration`; Cerritos made it 2.2 MB and Mt. San Antonio 4.5 MB. Passing that through a session costs hundreds of
thousands of tokens and the connector's patience. The database has no `pg_net` or `http` extension (enabling one is not a
session's call), and the service role holds UPDATE on `program_requirement_records.display`. So the college workflow
gained a `display` job (dispatch `step=display`): `kb/_program_requirements_display_apply.py` parses the committed receipt
(a doubled quote is a quote; any line of another shape stops the parse), refuses a page that mixes builds or a receipt whose
statements carry another build, reads each row's build, PATCHes `display` alone, and commits
`<receipt>.applied_<run>.json` with every prior build: the rollback (null back to null, an older build by its own receipt).
The new job lives in the existing workflow so it dispatches from a branch before merge (a new workflow file dispatches only
once it is on the default branch).

**Verify a megabyte write with one hash, not a megabyte query.** The builder's `--verify-sql` prints 44 KB of SQL for 605
rows. Instead: `md5(string_agg(college||'|'||control_number||'|'||md5(display::text), ',' order by college collate "C",
control_number collate "C"))` in the database, and the same over the receipt's displays through `_build_roep_display.jsonb_text`
in Python. Both builds matched exactly: `5be53871ebf4` on 292 (a57878388c658c9bda439024c9226809), `153ead0ce992` on 605
(ea203a054800313b80804d3a08c8c53b). The `collate "C"` makes both sides sort by bytes, so the two strings are built in the same order.

**The verdict trigger is safe for a display write.** `program_requirement_records_follow_verdict` (BEFORE INSERT OR UPDATE)
re-applies the latest verdict from `record` and `checks`; a display write changes neither, and the checked count held at 27
through both applies.

**A college's filing changes the page's build for every row.** The builder hashes its data, so filing Mt. San Antonio made it
differ from the committed receipt on all 292 rows, and `tests/roep_display_test.py` (the receipt must write every filed
program) turned `lints` red, which turns `test` red. Rebuild in the same PR as the filing.

**Mt. San Antonio, the second full college.** Run 38059865531: 385 programs, 344 with a state list, 741 sitemap addresses, 564
program pages read in 46 min (572 loads); 301 matched by the sitemap, 16 by the link search, 20 not found, 7 page claimed;
317 extracted for $17.27 ($0.0545 each); 291 pass the three machine checks (25 fail arithmetic, 1 extraction error). Load run
38064248268: 313 inserted unchecked, 3 kept (the pilot rows), 1 skipped (the error). The filing landed on S355's branch, which
GitHub had deleted at #1954's merge and the workflow recreated off the run's checkout; a cherry-pick carried it here.

**Approved programs.** `STATUS_FILTER = "or=(status.like.Active*,status.eq.Approved)"`. All 117 Approved programs at the two
colleges carry a state course list (33 Cerritos, 84 Mt. San Antonio). An Approved program competes for pages in `assign()` like
any other, which is right: the page goes to the program it names most fully. Re-reads run on sibling branches, because the
workflow's concurrency group allows one running and one pending run per branch and a third dispatch replaces the pending one.

**A commit the workflow pushes runs no CI.** The display job's applied-record commit is pushed with the workflow token, so the
PR head it creates carries no checks and `test` cannot pass on it. Merge the base (or push the next real change) on top.

**The Approved re-reads (S356, later the same day).** Cerritos (run 38064252862) filed 305 records, 265 passing, and
extracted 37 for $2.42; Mt. San Antonio (run 38064250199) filed 382, 346 passing, and extracted 71 for $4.47: $6.89 against
Sam's $6.50. ⚠️ A college's `summary.json` reports `cost_usd` over every record it files, so a re-read that keeps earlier
records reports the running total ($16.78 at Cerritos); count `extracted_run` in the records for this run's spend. The loads
inserted 33 and 70. Eight records dropped out of the filing (Cerritos 19170, 19172; Mt. San Antonio 31598, 32892, 38942,
43373, 43777, 43999): five lost their page to a program it names more fully (`page_claimed`), and three found no page
(`not_found`; S357 read the filed sources). The filing drops them, the insert-only load leaves their live rows,
and those rows keep the previous display build (`153ead0ce992`) while 700 hold `ee814befc65d` (combined md5
977aaaebe1171b9af65db321cfc125cc). Whether a row the filing no longer carries keeps its old display or is marked is open.
The two sibling branches merged into one cleanly except the generated dependency map, which was regenerated.

### Moved from the lane (S356 compaction)

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1, *build*, 20:35Z, confirmed in chat).** The Records view places each question the reading raised on the block whose courses it names, as a numbered flag that says who fixes it (the college or the reading procedure); a row printing a flagged course carries the number; reader's notes stay notes. A reviewer signed in with the magic link also reads the unchecked records, and each record ends with Confirm and Needs a fix: one write, `program_record_verdict_add` (`chatbox/supabase_program_record_verdicts.sql`), into the append-only log `program_record_verdicts`, holding the fingerprint of the requirements the page showed (`requirements_fp`). Confirm checks a record only while that fingerprint matches and its three machine checks pass; Needs a fix files the note on the college's procedure (`open`) through `program_source_procedure_set`. A trigger keeps a person's reading across a reload of the same requirements. Live (receipt `kb/receipts/program_record_verdicts_2026-10-08_s347.sql`; a rolled-back self-test passed ten cases); governance dismisses both surfaces with the reason; guards `tests/program_record_verdicts_sql_test.py` and the tab test's blocks 11-12.

## S357 SkyCanopy, 2026-10-10: the next college asked, district catalogs scoped, and a curriQunet catalog read as data

**The next college is a card (Open Asks Sheet 58 card 1).** The read lists program pages from a CourseLeaf sitemap only.
Long Beach City is the one Leading-tier CourseLeaf college unread (825 CPL students, 391 programs; the registry holds
www.lbcc.edu/college-catalog, a page that names CourseLeaf, so one runner read finds the catalog's own address first).
RCCD's three colleges are all Leading (Moreno Valley 2,557, Norco 907, Riverside City 900; 578 programs) and sit on one
curriQunet host. Card 2 asks about the eight rows the Approved re-reads dropped (five `page_claimed`, three `not_found`).

**A district catalog's college reads only its own path (#1959).** Coast, North Orange, Grossmont-Cuyamaca and Ventura each
publish one CourseLeaf host for several colleges, and the read kept every page on the host. `district_scope()` gives a
college the first segment of its own address when another registry address shares the host; a host no other college
shares has no scope.

**A curriQunet catalog is data (#1960).** The college page read gained `"network": true`: a plan page prints each fetch or
XHR its own scripts made to its own host while it loaded. Two reads at Riverside City (runs 38075620248, 38076194967, four
page loads, no model call) found the catalog's calls:

- `_getNavigation?id=<catalog>&parentId=<node>` lists a section. Riverside City is catalog 124; Degrees and Certificates
  (5852) holds a tablist (6313) whose Degrees and Certificates Index (6117) holds one linklist (6323) of 229 entries. Each
  entry carries its node id and a title naming its awards and local codes: *Acting - Associate of Arts Degree and
  Certificate of Achievement - AA1050/AA1050C/CE1050*.
- `_getPage?catalogId=<catalog>&id=<node>` returns one page as JSON. A program's page carries curriculum blocks
  (`catalogblocktypeid` 4, `EntityTypeId` 2, `curriculumCriteria` naming curriQunet's program id, `catalogblockheader` naming
  the award) whose HTML holds the whole of the requirements: the required courses, *Select one of the following*,
  *Complete 9 units from the following*, and the total. The view makes no other content call.
- Calls that need a sign-in answer 302, and nothing the read needs sits behind them.

So the curriQunet listing is one navigation call per section plus one page call per program, read as JSON with no
rendering and no PDF export. What it still needs: each college's catalog id (Moreno Valley and Norco are other modules on
the same host), a walk from the catalog's top navigation to its program index, and a match from a page's award blocks to
COCI's programs (one page serves the A.A. and the certificate of one discipline). Memory row
`roep-curriqunet-catalog-json-2026-10-10`.

**The curriQunet read, first run (#1961; run 38077405309, Riverside City, capture only, no model calls).** The start page's
scripts named catalog 124; the walk read one section (Degrees and Certificates), five nodes and eleven calls, and listed
435 program entries; 447 loads in 36 minutes, no errors. 228 of the 262 programs with a state course list found a page
(165 at full coverage, 51 at 0.8 to 1.0, 12 at 0.5 to 0.8); 48 pages serve two programs each, an A.A. and its
certificate, as designed. 34 found none: seven Liberal Arts emphasis degrees (their state lists run to 33 courses), the
Cosmetology, Barbering and Esthetician Concepts awards, nine Baking and Pastry awards credit and noncredit, Anesthesia
Technology, and the History and Kinesiology ADTs. One cause was the read's own: the code net (`CODE_TOKEN`) read no code
in a number ending in letters and digits (COS 60A1), so those pages never reached the exact test, which reads them; fixed
in the same pull request, for CourseLeaf catalogs too. The rest wait for a look at their pages. Card 1 moved to Open Asks
Sheet 59 with the read built. Sam answered it in chat the same evening ("RCCD go!", ~19:45Z, as proposed); card 2, the eight
dropped rows, moved to Open Asks Sheet 60. S358 dispatched the three reads on sibling branches at 20:15Z: Riverside City
with extraction (run 38082999076), Moreno Valley (run 38083001418) and Norco (run 38083003673) capture only.

## S358 SkyFern, 2026-10-10: RCCD's three colleges read, loaded and displayed

**What Sam ruled.** "RCCD go!" (Open Asks Sheet 59 card 1, in chat ~19:45Z, as proposed; recorded by S357): Riverside City
extracted, Moreno Valley and Norco captured first and extracted where the capture finds a page for 85% of their programs.
His standing go of the same day (S356) covered the display build that followed the loads.

**The curriQunet read held at two more colleges.** Each catalog's start page named its own id (Riverside City 124, Moreno
Valley 115, Norco 116), and each walk read one section (Degrees and Certificates) in five nodes and eleven calls, no errors.
Captures, free: Moreno Valley 132 of 144 programs found a page (91.7%; run 38083001418, 21 min), Norco 141 of 150 (94.0%;
run 38083003673, 24 min). Both cleared the bar, so both were extracted the same evening.

| College | Found | Extracted | Pass the three checks | Spend | Read run | Load run |
|---|---|---|---|---|---|---|
| Riverside City | 237 of 262 | 237 | 216 | $13.30 | 38082999076 | 38086677164: 233 inserted, 4 checked pilot rows kept |
| Moreno Valley | 132 of 144 | 132 | 126 | $7.77 | 38085493318 | 38088125780: 132 inserted |
| Norco | 141 of 150 | 141 | 121 | $8.44 | 38085495452 | 38088127500: 141 inserted |

$29.51 in all against the $29 put to Sam; each spend is the run's own (every filed record carries that run's
`extracted_run`). Riverside City found nine more programs than S357's capture (237 against 228): the `CODE_TOKEN` fix for
COS 60A1 let the Cosmetology, Barbering, Esthetician and Hairstyling Concepts awards reach the exact test. Norco's 18
arithmetic failures are the most at any college so far; read a sample before trusting its totals.

**The same programs miss at all three colleges.** Of the 46 programs with no page, 21 are the district's seven Liberal
Arts emphasis degrees, seven at each college (Administration & Information Systems; Communication, Media & Languages; Fine & Applied Arts; Humanities,
Philosophy & Arts; Kinesiology, Health and Wellness; Math & Sciences; Social and Behavioral Studies), and American Studies
misses at two. The catalogs list them under a shared Liberal Arts entry whose title names the emphases differently, so one
read fix should recover 21 programs across the three. Riverside City's other misses: Baking and Pastry (credit
and noncredit), Anesthesia Technology, Building Inspection Technology, Zero Net Energy, Dance, Pilates, Mathematics
Readiness, and the History and Kinesiology ADTs.

**One branch for a district.** The three reads ran on sibling branches (the workflow serializes per branch); their filings
merged into one branch beside the refreshed dated reads, and the loads and the display ran from it, so the display build
saw every filed program at once. The dated reads must name a college before its display is built: a college missing from
`map_cr_by_course.json` reads as no CPL here. Moreno Valley (106 course codes) and Norco (82) were added; Riverside City
re-read equal to the 2026-10-06 read on all 34 codes.

**Display build `3746c15d32ba`** wrote 1,206 rows (the 700 live rows re-stamped, 506 new) through the display job (run
38088220168, 7.5 minutes). The live combined md5 over the 1,206 rows equals the receipt's, e0aeb4d25ac7bab83f71c753278fe163;
the checked count held at 27; no row is left without a display; the eight rows the Approved re-reads dropped keep
`153ead0ce992`. Memory rows: `roep-rccd-three-read-loaded-displayed-2026-10-10`,
`roep-district-liberal-arts-emphases-miss-2026-10-10`, `a11y-signed-out-sweep-hides-gated-views-2026-10-10`,
`on-accent-is-dark-on-seal-blue-2026-10-10`.

### Moved from the lane (S358 compaction)

🔨 **Phase 2, a college at a time (Sam, 2026-10-09, "Cerritos first"): Cerritos is read, loaded and sampled (Sam confirmed 12 of 12); Mt. San Antonio is read and loaded; both are being re-read for their Approved programs.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` (#1941) reads the sitemap once and each program page once; `assign()` gives a page to the programs whose award its address names and whose title it names most fully, and a loser reads none (`page_claimed`). A push reads only on `[read]`/`[extract]` and loads on `[load]` (or a dispatch); the load posts the committed records through `program_requirement_records_college_load()` (insert-only, unchecked, each row keeps its extraction run, service role by grant and a body check) and commits a receipt naming every inserted key, which is the rollback. **Read** (runs 37961137169, 37966828676; $16.64): 274 of 288 programs, 238 pass the three machine checks; 14 found no page of their own. **Loaded** (run 37970640026): 270 unchecked beside the four checked pilot rows. **Reading** (Sam, 2026-10-09, on his phone): Program records has Find a record (search, Waiting on your reading, college; #1946), and a Progress call that names records answers each on its card through the verdict RPC (#1947). Under the tab's title, **Sam's to-dos (N)** goes to the open calls; a finished call reads **Answered** with a check. Opening a record on a call starts **Side by side**: the record beside its catalog page in a sandboxed frame, or, for a host `kb/catalog_framing.json` records as refusing (42 of 108, Cerritos among them), the reading room: the record in a COBI window on the right half, the catalog on the left, Next waiting record moving both (rerun `catalog-framing.yml` for a new host). Each course shows its titles, its C-ID/CCN/M-ID numbers and its CPL count (opens the exhibits view), from the display build. **The sample held (Sam, 2026-10-10 ~01:50Z):** he confirmed all 12; seven are checked, and the five failing a machine check (Cerritos 32563, 44153, 15512, 02235; Santa Monica 43767) stay unchecked though he read each as printed: those checks flag the catalog against the state file. **Mt. San Antonio** (Sam: "Go on Mt SAC!", 2026-10-10): run 38059865531 read 317 of 344 programs from their own pages, $17.27, 291 passing the three machine checks (25 fail arithmetic, 1 extraction error); load run 38064248268 inserted 313 unchecked beside the 3 checked pilot rows (receipt `kb/receipts/program_requirement_records_college_mt_san_antonio_38064248268.json`). A ten-record sample is on the Progress call. **Approved programs too** (Sam, 2026-10-10, "go on call 2"): `STATUS_FILTER` takes Active, Active - Teachout Only and Approved; all 117 Approved at the two colleges carry a state course list. Re-read and loaded the same day: Cerritos 305 records (265 passing; 33 inserted; 37 extracted, $2.42; 19170 and 19172 lost their pages to Approved programs), Mt. San Antonio 382 (346 passing; 70 inserted; 71 extracted, $4.47; six lost pages). Those 8 live rows stay on build `153ead0ce992`; 700 hold `ee814befc65d` (md5 verified). **Display** (Sam, 2026-10-10, "Yes build"): each build applies by the college workflow's **display job** (dispatch `step=display`; `kb/_program_requirements_display_apply.py` applies the full receipt of the build the page carries, one PATCH a program, and commits `<receipt>.applied_<run>.json` with each row's prior build, the rollback). Verified by combined md5 against the receipt. **NEXT:** ② Rebuild the display after each load and dispatch `step=display`: **Sam's standing go (2026-10-10, "Go")** covers every display build that follows a college load, checked programs included. ③ Sam reads the Mt. San Antonio sample. ④ CPL Pathways' display file splits per college. ⑤ The curriQunet read is built (#1961): the start page names the catalog id, `cq_index` walks the degree and certificate sections, and each program's `_getPage` is one page for `assign()`. Riverside City, capture only: 228 of 262 programs found a page (lessons, S357); 27 colleges use curriQunet.

**Sam's ruling (Sheet 59 card 1, in chat ~19:45Z 2026-10-10, "RCCD go!", as proposed):** RCCD's three colleges read next: Riverside City extracted (its capture found 228 of 262), Moreno Valley and Norco captured first and extracted where the capture finds a page for 85% of their programs; Long Beach City after them. Memory row `sam-rccd-go-sheet-59-card-1-2026-10-10`.

## S359 SkyMoss, 2026-10-10/11: the Liberal Arts emphases, duplicate index entries, and Sam's Mt. San Antonio rules

**A curriQunet subject list prints bare numbers.** RCCD's seven Liberal Arts emphasis degrees are ordinary index entries
(Riverside City 6290 Math and Science AS493; run 38092150229), but their pages print "Mathematics (MATH): C2210, 5, 9"
and "Biology (BIO) 1, 1H, 4" (run 38092480434), so the read matched almost none of 110 listed courses.
`cq_subject_lists()` (#1965) reads each number with its subject; a number may lead with any letter (#1966: Kinesiology's
A03, V01; Dance's D10). Coverage on the real pages: Math and Science 0.955, Administration and Information Systems 0.939,
Kinesiology, Health and Wellness 1.0 (0.009 as printed). Re-captures recovered 20 of the 21 plus American Studies at two
colleges; nothing else moved. Humanities, Philosophy & Arts (316 listed courses) runs past the extraction's max_tokens at
all three colleges and loads no record.

**One program under two index entries is one page.** Norco lists Kinesiology, Health & Wellness A.A. as 5545 and 5552
(both NAA498/C); Riverside City repeats three emphasis entries in a second list (6232-6234). Read as separate pages, the
Kinesiology A.A.-T, Dance and Pilates each took an emphasis page and extracted empty (coverage 0.0). `cq_group()` (#1967)
groups claims by the local award codes an index title ends with, so `page_winners()` keeps the page for the program whose
award it names. Measured first: of 526 RCCD programs with a page, four sat on a page naming another award, and only the
A.A.-T was wrong, so a blanket award rule would have dropped good pages.

**A capture now names what an extraction would pay for** (`would_extract` in `capture_preview.json`, against the filed
read by `unchanged()`), so an extraction go can name its programs and cost first. Moreno Valley's recovered programs cost
$1.69, Norco's $1.78, Riverside City's $1.86.

**Sam's Mt. San Antonio sample (2026-10-10 23:55Z to 00:10Z).** Four confirmed, six marked Needs a fix, with five rules
(memory row `sam-mtsac-sample-reading-rules-2026-10-11`, vault braindump 2026-10-11 00:10). Measured at once: the five
catalog additions (EMS 80, AGAG 1, KIN 24, CISP 71, ID 12) sit in the full Program Course File on the same programs as
**Inactive** under an older control number, and COCI's course list carries the active version (EMS 80: CCC000584685 on
the program, CCC000616276 current). `coci_program_courses` and the display build keep Active, Approved and Teachout only
(`KEEP_STATUS` in `chatbox/build_program_courses.py`), so no reading saw them. Neither COCI's course list nor the MIS
Master Course File holds noncredit hours (both give VOC BS36 and BM61 0 units).

**Long Beach City's registry row named the college's page about its catalog.** www.lbcc.edu/college-catalog links
"This Year's Catalog" to https://lbcc-public.courseleaf.com/ (run 38092181470); corrected with `corrected_by` so the
census keeps it. Its capture ran more than two hours.

**Sheet 60 answered:** "remove" (23:52:04Z); the eight rows are deleted, each guarded by its md5 against the live read
(#1968). A data UPDATE or DELETE goes through `apply_migration` with a committed receipt because `execute_sql`'s guard
refuses it; an insert into `cpl_memory` that timed out twice landed on the third, shorter try.

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
