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

## S399 SkyRowan (2026-10-16): wave 5, ten curriQunet colleges; two reader faults found before any spend

**Sam's words this run.** Open Asks Sheet 85, all his own call at 17:51Z: cards 2, 3, 5 and 6 kept; card 4, *"Leave both as read and showing and flag rather than send to college for follow up"* (Victor Valley 37006 and 38352 stay unchecked, shown, flagged incomplete by the arithmetic check); `cpl_memory` `sam-sheet-85-rulings-2026-10-16`.

- **Wave 5, ten curriQunet colleges from the census's unread list, each on its own subdomain and branch** (`claude/s399-<college>`, dispatched with `step=read`, `extract=1`; $37.87 in all). Loaded unchecked (#2168): College of Alameda 59, Feather River 44, Imperial Valley 83, Laney 150, Las Positas 20, Madera 98. Merritt read whole (81 of 81, 68 passing, $6.13) after 105 minutes and was loading at sign-off. Build `9c74da80bad7` (8,524 programs) dispatched from `main` at 18:34Z.
- **Two reader faults, both caught at no cost because extraction only spends on found pages.** Berkeley City and Butte: the start page asks `_getNavigation?id=0` first, an empty placeholder, and `cq_catalog_id` took the first id heard. Gavilan: the alias start page lists active catalogs and fetches nothing, and its `_getCatalogs` title "Gavilan College Catalog 2026-2027" failed the every-title-word-in-the-name test on "Catalog". #2167: skip 0; set "catalog" aside like the year. A free page read (`kb/college_reads/<college>_curriqunet_catalogs.json`, `network: true` on the start page plus `_getCatalogs`) showed both in one run (38942920358); a subagent read its log and returned the ids, which kept the network bodies out of the session's context.
- **Dated reads for six colleges in one pass.** One SQL per file, each row checked by md5 against the filed JSON before writing. The committed query's shape (`map_cr_by_course.sql`) aggregated fine, but a fingerprint computed over a lateral join to the titles repeats each code once per title: count codes and hash counts in one CTE, titles in another.
- **Las Positas** read 158 index nodes and found 20 of 201 programs; two ECONNRESETs cut the walk. A reread, not a reader change.

**What went wrong.** #2167 went up without `check_generated.sh` (the dependency map indexes the reader file) and its `lints` failed once. The rule is the last step before every push, including a two-function fix. A `git fetch --prune` of every remote branch hung for minutes; fetch the one branch you need.

**Patterns that worked.** Read the host's own list before touching the reader. Merge the wave branch while three colleges reread, so the display build ships and the stragglers take the next one.

## Moved from the lane (S399 compaction)

**Loaded:** Cerritos 305, Mt. San Antonio 382, Riverside City 244, Moreno Valley 139, Norco 147, Long Beach City 344, Chaffey 191, San Diego City 167, San Diego Miramar 120, San Diego Mesa 175, Bakersfield 229 (eLumen, S381), Coastline 140, Cabrillo 268 (S382), Modesto Junior 185 and Palo Verde 52 (S385), Southwestern 190 (S389), Fresno City 211 (S390, #2120), El Camino 117 and San Joaquin Delta 202 (S392, the Acalog reader; Sam, Open Asks Sheet 81 cards 3 and 5), and the catalog sweep (S394, #2143, #2144): Santa Barbara City 242, Orange Coast 206, Foothill 97, Sierra 25, Fullerton 311, Citrus 144, Victor Valley 169, Monterey Peninsula 197; wave 3 (S395, #2149): Cypress 251, San Bernardino Valley 200, Cuyamaca 179, Sequoias 118, Mt. San Jacinto 94, Napa Valley 94, Evergreen Valley 74, Moorpark 54, Golden West 50, MiraCosta 18; wave 4 (S396-S398; #2157, build `66b50c86891e`; #2158, build `fa8ee2a84935`): Ventura 101, Oxnard 64, Reedley 36, Palomar 220, Chabot 231, Allan Hancock 153, Santa Ana 346, Rio Hondo 288, Saddleback 311. 

🔨 **The catalog sweep (S394-S395; Sam's aim of 2026-10-14: every catalog, then curated audit sweeps).** One branch per college, never two on one host; a wave branch merges the loaded ones, their dated reads and one display build. Extraction runs under the $40 go (S394 $103.83, S395 $92.92, S396 about $175 across nine colleges). **Parked for the reader:** Diablo Valley (no program list in its eLumen catalog), Sierra (sitemap 404), Foothill (73 programs lost their page to a sibling award), San Jose City (8 of 90 found, none passing), MiraCosta (29 of 161), Orange Coast's 27 empty records, Reedley (36 of 200: its curriQunet index held 40 entries in 2 sections; 34 programs lost their page to a sibling and 130 matched none; a page read first). **Santa Ana:** titles put the award after a colon ("Accounting: A.S. Degree"), which #2148 reads (merged S396); its capture found 345 of 359, so it is extracting with the other curriQunet colleges. **Wave 4 (S396-S398), done.** Nine colleges loaded unchecked (curriQunet unless named): Ventura and Oxnard (CourseLeaf) 101 and 64, Reedley 36, Palomar 220, Chabot 231, Allan Hancock 153, Santa Ana 346 (347 of 359 found, $22.03), Rio Hondo 288 (292 of 301, $18.94), Saddleback 311 (321 of 353, $25.88); Orange Coast's and Monterey Peninsula's reconciles and rereads. Build `66b50c86891e` (7,125 rows) applied by run 38909267523 (S398) after S397's run 38857449086 was canceled at the display job's then 30-minute limit with 6,875 written and no applied record (those rows go back by re-applying `515c9d71e086`'s receipt to its keys, null for the rest); build `fa8ee2a84935` (8,070 rows, #2158) applied from `main` in S398. **The display job now has 120 minutes and new receipts are gzipped** (#2159): at 0.22 s a program the apply of 8,070 runs about 30 minutes, and a plain receipt (about 9 KB a program, 72.7 MB at 8,070) would have passed GitHub's 100 MB file limit near 11,000 programs. Procedure records (S398): Allan Hancock, Chabot and Palomar v1; Ventura, Oxnard and Reedley v2 merged onto S346's record (`kb/_program_source_procedure_v1.py --merge`); Santa Ana, Rio Hondo and Saddleback follow `fa8ee2a84935`'s apply. **Open from the reads:** Palomar lost 103 of 331 programs' pages to a sibling award; Ventura and Oxnard each keep 30 records out of the load (no listed course placed). **NEXT:** procedure records for the three, then the next wave from the census's unread catalogs.

## S400 SkyBirch (2026-10-16): wave 5's second half, nine procedure records, Butte parked

- **The three in-flight items from S399 had all landed by session start:** `9c74da80bad7`'s display apply (run 38948259433), Merritt's load, and the Berkeley City and Gavilan rereads under #2167. Butte's reread ran 89 minutes (1,156 loads).
- **#2170: Merritt 81, Berkeley City 66, Gavilan 101 loaded unchecked; build `9237d2cbf931`, 8,772 programs,** applied by run 38964970724 (about 40 minutes). The dated reads matched in SQL and over the filed rows: registry md5 over the ten columns (`concat_ws('|')`, nulls skipped), and `map_cr_by_course` in two CTEs, counts (`code|recs|exhibits|untitled`, codes in C order) and titles (`code#title#source#recs`, in the read's order). Merritt 25 course codes, Berkeley City 3, Gavilan 3, Butte none.
- **Handoff 400's procedure item for Santa Ana, Rio Hondo and Saddleback was stale:** S398 applied theirs (#2161). Read the registry's procedure md5s before writing; that read also showed Imperial Valley, Madera and Las Positas already held earlier records (hosts, steps, open, nuances, requests), so theirs went in as `--merge` v2 and v3 (#2172). A merge concatenates arrays, so the row's `open` must be an array first or the new questions are nulled; all three were.
- **Nine procedure records applied this run** (#2172, #2174): Alameda, Feather River, Laney, Merritt, Berkeley City, Gavilan v1; Imperial Valley, Madera v2; Las Positas v3, with a host note naming its ECONNRESETs.
- **Butte: 19 of 168 found.** The curriQunet walk read 542 nodes in three sections and recognized 18 program entries; `cq_is_program` wants a "Name: award word" title. The sandbox's proxy refuses `butte.curriqunet.com`, so the next step is a page read with `network: true` on a runner. The 19 loaded unchecked (run 38965262431), and Butte's dated reads ride the next build (registry md5 69f90a0e).
- **Smoke on a harvest PR.** `cpl-chat-smoke` can run on a data-only branch whose push carries earlier `chatbox/` commits; it tests production. Its 7l failure led to #2173 (the Sierra lessons doc has the story).


## Moved from the lane (S401 compaction)

- **Wave 5, as the lane carried it at S400.** Ten curriQunet colleges. Six loaded unchecked in S399 (#2168, build `9c74da80bad7`, applied run 38948259433): Alameda 59, Feather River 44, Imperial Valley 83, Laney 150, Las Positas 20, Madera 98. Merritt (81 of 81 found, 68 passing), Berkeley City (67 of 99, 21) and Gavilan (106 of 135, 77) loaded in S400 (#2170, build `9237d2cbf931`, 8,772 programs, applied run 38964970724). Berkeley City and Gavilan found nothing until #2167 skipped a start page's `_getNavigation?id=0` and set the word "Catalog" aside in a host's list title. Butte's 19 of 168 loaded unchecked (run 38965262431). Procedure records: Alameda, Feather River and Laney v1; Imperial Valley and Madera v2; Las Positas v3 (S400); Santa Ana, Rio Hondo and Saddleback (S398, #2161).

## S401 SkyManzanita (2026-10-16): five reader faults read from the hosts' own outlines, the eLumen wave loaded

- **Read the host's outline before fixing its reader.** Every short read this run had one cause, and a free page read (`kb/college_reads/<college>_*_nav.json` or `_elumen_menu.json`, JSON calls or `links` patterns, no model call) named it in one or two rounds. A subagent read each job log and returned the titles, which kept 100-KB bodies out of the session.
- **The handoff's cause can be wrong.** Las Positas's 20 of 201 was put down to two ECONNRESETs. The retry (#2177) shipped and the reread still found 20, with no failed call. Its outline (page read 38982439886) showed the real cause: entries titled "Liberal Arts & Sciences: Mathematics and Science, Associate of Arts (AA)", the award after the last comma; only the 20 with a colon in the name were taken, and 112 programs then pointed at those 20 pages. #2182 reads the comma form. The retry stays: Butte's walk lost three calls to resets.
- **Butte titles each program twice** (page reads 38977301962, 38977912351): "AS Degree in Automotive Technology" under Programs by Subject, "Automotive Technology (AS Degree)" under Programs by Communities of Interest. Each subject's navigation is a link-list wrapper (text null) one level above the entries. #2178 reads both forms and folds them into one key, so each program is read once.
- **eLumen menus differ by college, and the fast read stopped at the first source that named a program.** Lake Tahoe's menu links 16 transfer degrees beside its departments (`2026-2027/department/program-art`): 16 of 83 found. Marin's menu links about 100 subject pages one segment under `current` (`current/aj`), each linking its programs (`current/program/<slug>`): 0 found. Los Medanos's start page is the Art department, and its department list (`26-27/degrees`) appears only in the menu opened around `26-27/courses`, since a publish call carries the menu around its own page and a content call carries none: 7 of 97. #2179 takes every menu source and walks the menu's pages when the list falls short of 80% of the closed lists; #2183 reads a hub's own full call when its content names nothing, takes hub-like pages first and follows department paths two segments down.
- **The eLumen wave** (#2181): capture-only reads first ($0), then extraction for the six that found most programs, $41.06 in all. Antelope Valley 182 (195 of 197 found), Columbia 82 (82 of 82), Contra Costa 88 (97 of 105; it lists programs by 53 department pages, unlike Diablo Valley), Lemoore 68, Redwoods 68, Siskiyous 65 (the rendered fallback); 32 records place no listed course and stay out. Dated reads matched by md5 in SQL and over the filed rows (registry: Antelope Valley 8765ae4e, Columbia 60751923, Contra Costa f16007e8, Lemoore da326884, Redwoods ec09761c, Siskiyous 516919e9; map_cr_by_course in `_read_by`). Build `d4ac5009f5aa`, 9,325 programs.
- **Every subscription costs context.** Each PR subscription delivers two notices of about 5,000 tokens each. Six PRs in one session spent about 60,000 tokens on notices alone; fold reader fixes into fewer PRs where they do not need to land apart.
- **After the checkpoint (S401 sign-off).** #2179's walk worked where the menu names subjects or departments: Lake Tahoe 78 of 83 (was 16), Marin 89 of 94 (was 0; 108 subject pages walked, 143 program pages). It did not reach Los Medanos's department list under #2183 either (7 of 97, run 38986123746): the next step is the capture's own walk account, then a page read of `courses`'s full call.

## Moved from the lane (S402 compaction)

- **The reconcile pass, as the lane carried it at S401.** **The reconcile pass (S392; Sam, 2026-10-14: "a secondary search of the catalog text to see if we can reconcile after the initial PR harvest", each catalog's own steps; `cpl_memory` `sam-reconcile-pass-after-harvest-2026-10-14`).** `kb/_program_requirements_reconcile.py` applies a college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call); each change names the words it came from. Cabrillo's first run (38639316727) and the re-read that holds only a checked row (#2130): lessons S392; Sheet 82's carry and overlap, Cerritos's steps and extraction v10: lessons, *Moved from the lane (S398 compaction)*. **Orange Coast and Monterey Peninsula's steps (S396):** Orange Coast reads its Requirements tab's "Total Minimum Degree Units - OCC AS GE 60" as a minimum, "OCC AS General Education up to 21" as GE of at most 21 (min unstated) and its electives as making up the rest; reconcile 38843379313 changed 11 records (six now pass; about thirty keep the gap because their captured text lacks the tab's totals), reread 38847265701 replaced them. Monterey Peninsula: a local degree's GE is 24 to 34 (MPC GE's eight areas of three units, a sum the catalog does not print, and Cal-GETC's 34), a transfer degree's 34; its reconcile run 38844053281 was still capturing at the S396 sign-off, so its reread waits. **Sam ruled (Open Asks Sheet 85, 2026-10-16 17:50-17:51Z, each his own call; `cpl_memory` `sam-sheet-85-rulings-2026-10-16`):** the carry across a changed major total and general electives stays (card 2, keep); Cerritos's 60 reads as a minimum (card 3, keep); Orange Coast's "up to 21" reads as at most 21 (card 5, keep); Monterey Peninsula's local GE reads 24 to 34 (card 6, keep). Victor Valley 37006 and 38352 (card 4, his words: *"Leave both as read and showing and flag rather than send to college for follow up"*) stay as read, unchecked and shown, flagged by the arithmetic check as incomplete for the MAP team; no draft goes to the college and no step is built.

## S402 SkyToyon (2026-10-17): two waves, eLumen links written whole, and a push that read Cerritos

- **Two waves loaded.** #2186: Lake Tahoe 78, Marin 89, Butte 164 (150 beside its first load's 14; reread 38996807357 replaced 8), Las Positas 193 (173 beside its 20; reread 38996809146 replaced 1); build `40d138a9f533`, 9,829 programs, applied by run 38998203877. #2187: Los Medanos 83 and Mission 105 (three place none of their courses); build `7c13e42917c5`, 10,017 programs. Extraction this session $13.57 (Los Medanos $6.01, Mission $7.56). Sixty-nine colleges now hold records.
- **Test the handoff's stated cause, again.** Handoff 402 put Los Medanos's 7 of 97 down to `courses` never being read through its full call. A subagent's read of S401's page-read logs showed the walk already took `courses` as a hub: its menu text is "Program Requirements, Courses, and Student Learning Outcomes". The raw full call (page read 38997368468) showed the cause: the page's own topic list writes `href="https://lmc.elumenapp.com/catalog/26-27/degrees#mainContent"`, whole with the host and a fragment, while the menu writes `href="26-27/courses"`. The four eLumen link patterns took only relative and `/catalog/` links ending at the quote. #2187 takes a link whole on the catalog's own host, with a query or a fragment, and never another host's. Los Medanos then found 83 of 97 (walk: 83 pages, 3 full calls, 112 programs) and Mission 108 of 113 (its menu named none; the walk found 120).
- **A push names no college.** Both jobs of `program-requirements-college.yml` fell back to Cerritos when no college was given, and a push gives none: the `[read]` push on Los Medanos's branch read and filed Cerritos (run 38997845641, capture only, $0). An `[extract]` push on any college branch would have paid for Cerritos's extraction. Since #2187 both jobs stop at their first step when no college is named. Dispatch every read with `college=`.
- **A capture-only read files `capture_preview.json`.** `capture.json` and `summary.json` come from a read with extraction, so a poll of a capture-only run reads the preview.
- **The page reader prints at most 40 matching links.** A broad pattern spends the cap on the first 40 links: Santiago Canyon's `catalog/(?!catalog/)` matched every `catalog/catalog/<page>` link and hid its Catalog Archives and printer PDF links twice (runs 38998089408, 39001293722). Narrow a pattern by the names wanted (`\.pdf|archive|2026|printer`).
- **Where the remaining catalogs live** (page reads 38997632871, 38998089408, 39001293722). Copper Mountain: a PDF on cmccd.edu, with curriQunet only for outlines. San Diego Continuing Education: a PDF on sdccd.edu; the district's curriQunet host lists City 69, Mesa 70 and Miramar 71 only. Porterville: a PDF with two addenda; its eLumen catalog stops at 2021-2022. Solano: a PDF; eLumen serves outlines. West Valley: its own HTML catalog (westvalley.edu/catalog, a PDF copy at catalog.pdf); eLumen serves outlines. Mission's `24-25` slug serves the 2026-2027 catalog, so its row stands. Santiago Canyon's eLumen host serves 2025-2026 only. The five wrong rows are Open Asks Sheet 87 card 1.
- **Diablo Valley stays at 0 of 244** under #2187 (run 38999074345): the fast read finds no program link and the rendered fallback reads 147 pages and finds none. Its hubs grid departments by award (S394).
- **The procedure generator takes one load receipt.** Butte (two loads and a reread) and Las Positas (a v4 merge that must not repeat the read v3 records) were patched by hand before applying; a repeatable `--load-receipt`, a `--reread-receipt`, and a `--merge` that skips runs the row already records would remove the hand step.
- **`list_workflow_jobs` on a JS-tests run returns about 13,000 tokens** (the lints job lists 96 steps). `get_check_runs` on the PR names `test` and its conclusion for a fraction of it.

## S403 SkyYarrow (2026-10-17): a whole-catalog PDF reader, and the PDF wave

- **The college reader reads a whole-catalog PDF** (#2189). A registry row whose format is `single_pdf` and whose address ends in `.pdf` is fetched once (robots and the census delay, as every read) and each program gets the run of pages that carries all of its title words and names most of its listed courses, then the pages after it while they still name them. The title-word gate exists because a catalog's course descriptions name a one-subject program's codes page after page, often more of them than the program page does. pdfminer reads the file again only when pypdf's text accepts fewer than half the programs; in this wave pypdf served all fifteen. A source's address is the PDF with `#page=N`, and it records every page read and the extractor.
- **Cerro Coso's robots.txt disallows its catalog PDF** (run 39005930970: `robots_disallow`, zero loads). A refusal is on the college's record: no other name for the same file is tried. Its catalog needs another public source.
- **The wave: fifteen colleges, capture-only first ($0), then extraction under the $40 go, $149.41 in all.** Found of those with a course list: Clovis 115 of 121, Barstow 71/76, Calbright College Credit 12/19, Compton 81/86, Lassen 64/73, Mendocino 118/123, Woodland 65/65, Canyons 160/264 (its 100 noncredit programs are not in the credit catalog), Los Angeles City 251/258, Harbor 118/121, Pierce 194/196, Shasta 124/137, Valley 225/232, Santa Rosa 268/279, Yuba 93/94. Costs: Clovis $8.34, Barstow $4.68, Calbright $0.50, Compton $5.84, Lassen $4.54, Mendocino $7.40, Woodland $4.70, Canyons $13.55, Los Angeles City $19.27, Harbor $8.94, Pierce $15.01, Shasta $11.12, Valley $15.60, Santa Rosa $22.48, Yuba $7.44.
- **A shared page is usually real in a PDF.** Clovis's 30 shared pages are mostly a certificate and the degree it sits inside, printed together; the extraction is told the program's title and award. A few pairs (Wastewater Treatment beside American Sign Language) deserve a look when a person reads the college.
- **The outcomes check fails on PDF text it passed on HTML.** Los Angeles City 145 of 251 and Pierce 85 of 194 fail it ("not in the catalog text as printed"), where no HTML college failed it. Most likely pypdf's spacing (words split or run together) defeats the word-for-word match; the source text rides only in the run artifact, so the cause is unconfirmed. Next: print one failing outcome beside its PDF text on a runner, and if spacing is the cause, add a spacing-free reading to `_readings()` in the scorer. The check flags; it gates nothing (records load unchecked).
- **Fifteen branches at once, one college each.** Each ran capture-only, extract and load on its own branch (`claude/s403-<college>`); the wave PR merges them. GitHub keeps one pending run per concurrency group, so a second dispatch on one branch would replace a queued one.

## S403 SkyYarrow, the 06:12Z session (2026-10-17): East LA, the first PDF college on a second reader

- **The college pass reads a whole-catalog PDF** (#2190). `pdf_records()` reads the file once (`read_pdf`, robots first) and gives each program the page that names the most listed codes, worth `PDF_HEADING_BONUS` (5) more when a line of 120 characters or fewer names the whole title and an award word. The run continues while later pages name listed codes, up to three pages, and the text opens on that heading line. The bonus exists because a catalog PDF's course descriptions name a program's codes too, and because a certificate printed after its A.S. names the same list. pdfminer gets a turn only for a program pypdf's text cannot place. A procedure's catalog step (`format: pdf`) is followed as in the pilot. The source URL carries `#page=N`.
- **Read the registry's `access_notes` and `access_status` before choosing a college.** Cerro Coso was the one registry row naming a single PDF, so it went first. The capture-only read (run 39009464974) stopped at robots.txt: `access: robots_disallow`, 0 loads. The census had already filed `access_status robots_disallow` with *"Catalog page: robots_disallow"*. That refusal is on the college's record, and no workaround on the same host is allowed (sheet 29 card 3), so Cerro Coso waits for another public source.
- **No other PDF college is ready for the reader.** Six rows are `pdf_by_section` (City College of San Francisco is behind a Cloudflare 403; LA Mission's sequence host is refused), and the four PDF catalogs found in S402 wait on Sheet 87's correction. Writing a procedure catalog step for those four would get around Sam's pending ruling, so they stay held. Page reads (run 39009644813) list the PDF links on the catalog pages of East LA, Glendale, LA Southwest, Pasadena and Santiago Canyon.
- **East LA, the first PDF college: 120 loaded unchecked (run 39012416324), build `b153d6b70ef8`, 10,137 programs.** A procedure catalog step points at the 2026-2027 PDF (521 pages, 11.3 MB; `kb/receipts/program_source_procedure_elac_2026-10-17_s403.sql`). It took three free capture-only reads to get the page choices right:
  - Run 39009846775: 141 of 147 placed, but 33 went to the online-course lists (pages 30-41) and the C-ID list (page 54), which name many codes and no program. Contents lines with dot leaders also counted as headings.
  - Run 39010291816 filed each pick's opening and showed the cause. East LA prints the state control number in every heading (*"Basic Police Academy Preparation (Academic Plan E013343D)"*). pypdf also runs each heading into its paragraph, so the 120-character line test named only 26 headings.
  - Run 39010864052: once the printed control number is worth 10 codes and a heading is read from its line's opening, 116 of 141 picks print the number. `pdf_unproven()` then keeps out a pick that names neither the number nor the title and award, wherever the catalog prints numbers for at least half its picks. That left 120.
- **The scorer did not read a spaced line-break hyphen.** Extraction (run 39011319511, $8.53, $0.071 a program) passed 24 of 120. 82 records failed the outcomes check because the PDF prints *"tech - nicians"*, and `_readings` undid only *"tech- nicians"*. With the fourth reading, a reconcile run (39012077282, no model call) passed 82 of 120. A reconcile run now rescores every record whose page it reads again, so a scorer fix reaches filed records for free. The 34 left fail arithmetic only, about the rate at Butte and Mission.
- **The four other single-PDF catalogs found in S402 are Sheet 87's.** LA Southwest posts a 2026-27 *draft* (its link has no text), Glendale says its 2026-27 catalog is *coming soon* (the current PDF is 2025-2026), Pasadena's 2026-2027 link is not a PDF, and `sccollege.edu/academics/catalog/` is a 404 (page read 39009644813).

## S403 SkyYarrow, the merge (2026-10-17, the 08:12Z session): one PDF reader from two

- **Two routine firings both ran as S403 and each wrote a whole-catalog PDF reader** (#2189 merged at 06:45Z; #2190 held). Neither tagged itself, and the session tools could not list sessions, so the 06:12Z firing did not see the 05:12Z one until its checkpoint. The 08:12Z session read both PRs' comments, found both idle about 50 minutes, and took the one writer's role the 06:12Z comment left for "the next session".
- **The merged reader is #2189's, with the East LA signals folded in** (`_pdf_pick()` in `kb/_program_requirements_college.py`). A page qualifies for a program when it carries every title word outside its contents (dot-leader) lines, or prints the program's control number. Among those, the score is the listed codes it names, plus 5 for a heading naming title and award, plus 10 for the printed control number. The text opens at the control-number line, else at the heading. `pdf_unproven()` drops a pick in a catalog that prints control numbers when the pick names neither. A procedure record whose catalog step is a PDF reads through `capture_pdf()` too (`reads_as_pdf()`), and its step follows only links to a PDF. pdfminer reads the whole file again only when pypdf's text accepts fewer than half (#2189's rule; #2190's per-program retry is gone).
- **The first merge lost programs, and the reconcile runs showed it before any load.** A reconcile run re-reads the PDF with the current reader, so it tests the reader for free. On the first merged reader LA City found 217 of 251 and Pierce 76 of 194 (runs 39017360234, 39017362180). Three causes, each fixed with a test:
  - Pierce prints control numbers away from the program's own page, so the +10 bonus took picks to pages naming too few listed codes. Now the highest-scoring page whose run covers the list wins, and a bare control number gives way.
  - `pdf_unproven()` dropped 28 title-gated picks at LA City for lacking title and award on one heading line. A page that passed the title gate is proof enough; only a pick the pilot's picker made on codes alone is dropped.
  - Pierce prints the control number and the heading words below the course list, so cutting the text at that line left 80 accepted programs no codes. The cut now holds only while it keeps every listed code the page names.
  - After the fixes, LA City finds 241 and Pierce 191 (runs 39018024270, 39018025943). A program the new reader misses keeps its filed record.
- **The spaced line-break hyphen was the PDF outcomes failure.** Machine checks passed at LA City went from 49 to 148 of 251, with outcomes failures from 145 to 12. At Pierce, 76 to 141 of 194, with outcomes failures from 85 to 15. No model call.
- **A rescore must carry the run, or the reread keeps the old checks.** The first rereads (39018310349, 39018312320) replaced 0 rows: the rescore left `extracted_run` as it was, and `program_requirement_records_college_reread()` keeps an equal run. A rescored record now carries the reconcile run, as a reconciled one does. Rereads 39018615618 and 39018617236 replaced 156 rows at LA City and 94 at Pierce, each with a rollback receipt.
- **The other thirteen #2189 colleges have not been rescored.** The same reconcile then reread, one college per branch, is free. Clovis, Canyons, Santa Rosa and Valley are the largest.


## S404 SkyBuckeye (2026-10-17, the 10:12Z session): own-HTML catalogs through the sitemap road, College of San Mateo

- **The handoff pointed at Los Rios; the record pointed away.** Handoff 404 named American River, Folsom Lake and
  Sacramento City as the first own-HTML shape. All four Los Rios hosts have answered the reader 404 since 2026-10-08
  (census again on 10-11), and each procedure says the reader never works around it. The San Mateo district's catalogs
  (`catalog.collegeofsanmateo.edu/current/`, `catalog.skylinecollege.edu/current/`) answer and file 2026-2027, so the
  session started there. Read the registry row's `access_status` before taking a handoff's pick.
- **The reader already existed; the gate refused it (#2194).** `capture()` sent only CourseLeaf, curriQunet, eLumen and
  Acalog onward. The CourseLeaf branch is no CourseLeaf code at all: the sitemap, program-looking paths
  (`PROGRAM_PATH`), each page's children and the link search. Letting `custom_html` through it was one line. Try a
  free capture-only run on the generic path before writing a host reader.
- **College of San Mateo, end to end on the generic path.** Capture 39024297472: a 1,165-page sitemap, 195 program
  paths, 238 pages read in 23 minutes, 60 of the 64 programs that list courses (55 sitemap, 5 link search). Extraction
  39025870196: $4.98 ($0.083 a program), 51 of 60 passing; 5 fail coverage, 8 arithmetic. Load 39027691727: 55
  inserted unchecked, 5 skipped. Display build `928577b30f0f`. Not found: Addiction Studies A.A. (its page names 2 of
  14 listed codes) and International Business A.S. and certificate (5 of 13, 0 of 10): the pages print the courses in a
  form the net does not read, a page read's question for the next pass. Three pages each serve two or three programs
  (Biology, Business Administration 2.0, the Cal-GETC option); check those records' awards before a person confirms.
- **Skyline's capture ran past an hour** (run 39024299478, same commit). The same reader on a sister host took three
  times San Mateo's time: read its capture report (sitemap size, child pages) before extracting.
- **The MAP Data Quality UI pass (#2193)** is in `ui_pass_lessons.md`'s ledger line: a tab's private light and dark
  palettes shadow the global tokens and drift; the fix is role names over First Light's tokens, never new hex.

**Patterns that worked.** A capture-only run on two sister hosts in parallel, one branch each, while a UI pass ran in
the session. Proving a seeded a11y target by running it on the old file (it must fail) before trusting a clean report.

## Moved from the lane (S404 compaction)

- The other thirteen PDF-wave colleges were reconciled on the merged reader and not reread: their pages had no hyphen
  fault, and the moved picks only lowered their checks (S403).
- Loaded unchecked in the PDF wave: Clovis 100, Barstow 56, Calbright College Credit 11, Compton 73, Lassen 59,
  Mendocino 93, Woodland 64, Canyons 148, Los Angeles City 223, Harbor 107, Pierce 173, Valley 204, Santa Rosa 222,
  Shasta 103, Yuba 89; East Los Angeles 120 (run 39012416324).
- **Skyline's sitemap is the catalog's whole history** (capture 39024299478, 78 minutes): 48,034 pages, 3,927 on
  program paths, so the read stopped at 900 pages and still found 54 of 58, 19 of them by link search. The registry's
  address is `/current/`; a sitemap page outside it is another year's catalog. The next reader change: keep sitemap
  pages under the start address's path when the host serves more than one year.

## S405 SkyCholla (2026-10-17, the 12:12Z firing): the year scope, Sheet 88's colleges, ligatures and the hand-filed step

- **An own-HTML catalog keeps to its own year (#S405 wave).** Skyline's capture took 40 of 62 picks from `/1718/`,
  `/1819/` and `/1920/`. `year_scope()` scopes a `custom_html` read (sitemap, child pages, link search) through the
  registry address's year segment (`current`, `2026-2027`, `1718`); an address naming no year keeps the whole host.
  Skyline's next capture listed 466 program pages instead of 3,927 and ran 42 minutes instead of 78. The S404 run was
  canceled before its extraction spent anything on the old years.
- **A 401 from the extraction function is its caller probe, not the key.** `program-requirements-extract` answers 401
  whenever its probe of `allowed_reviewers` fails (12 s timeout). At 13:04Z 29 calls in one minute failed that way,
  mid-run, after Coalinga's run at 12:38Z had none (`function_edge_logs`). Re-run with `force=incomplete`.
- **Coalinga** (own HTML, `/catalog/2026-2027/`): 53 of 62 found in six minutes through the catalog's index, $3.34,
  42 passing, 52 loaded. **West Valley** (Sheet 88, own HTML): 134 of 142 through its index, $11.19, 90 passing, 133
  loaded. **Copper Mountain** (Sheet 88, PDF): 48 of 48, $3.84, 32 passing, 46 loaded. **San Diego Continuing
  Education** (PDF): 109 of 120, $4.95, 89 passing, 90 loaded (19 placed none of their listed courses and stayed out).
  **Solano** (PDF): 162 of 163, $13.17, 144 loaded. **Porterville's robots.txt disallows its catalog PDF**: on its
  record, with Cerro Coso's.
- **Solano's PDF prints ligatures as stand-in glyphs with a space beside them** (*"IntroducƟ on"*, *"draŌ  landscape
  plan"*, *"Iden Ɵ ﬁ caƟ on"*: Ɵ ti, Ʃ tt, Ō ft, and the Unicode fi, fl, ff, ffi, ffl), found by a page read of the PDF
  (39036135577) after 135 of 162 records failed the outcomes check. Which space is the word's own cannot be told
  (*"draŌ  landscape"* against *"aŌ er"*), so text carrying one gets a fifth reading in `_readings()`: ligatures spelled
  out and every space dropped, compared with the outcome's letters, spaces dropped too. A free reconcile took Solano's
  outcomes failures from 135 to 25 and its passes from 7 to 83.
- **Santa Rosa had the same glyphs.** A free reconcile on the ligature reading took its outcomes failures from 38 to
  1 and its passes from 147 to 180 (run 39037637820); the reread replaced 37 rows (39038350065) and Solano's 135
  (39037608756). Skyline's rerun extracted all 53 ($3.83, 37 passing) and loaded 42.
- **Three more registry rows name a page about the catalog** (page reads 39032643761, 39035702276): Grossmont (the
  cover image; `catalog.gcccd.edu/grossmont/`), Ohlone (the landing page; chapter 7 of a PDF catalog), Cañada (its
  schedule page; `catalog.canadacollege.edu/current/` refuses the reader in robots.txt). Open Asks Sheet 89 card 1.
- **The hand-filed catalog step** (Sam's ruling 2 on the refusing hosts, 2026-10-17): `kb/hand_filed_catalogs/` holds a
  PDF a person fetched and a provenance record (who, when, from where, sha256). The capture reads it in place of a
  download, refuses it when the hash differs, and stamps the provenance on the report and each record. Steps in the
  folder's README. The seven waiting: De Anza, CCSF, American River, Cosumnes River, Folsom Lake, Sacramento City, Cerro
  Coso; Porterville and Cañada joined them this run.
- **The display build needs the dated reads.** A college missing from `registry_read.json` and
  `map_cr_by_course.json` builds with no registry row and no MAP credit recommendations; San Mateo went out that way in
  `928577b30f0f`. This wave adds all seven, each matched by md5.

**Patterns that worked.** Ten branches, one a college, captured in parallel while the session fixed what the first
reports showed. A page read of the PDF around one failing outcome named the fault in one load.

## Moved from the lane (S405 compaction)

- Extraction spend by wave: waves 1-5 about $510; the eLumen wave $41.06; S402 $13.57; the PDF wave $149.41 for
  fifteen; S405 $40.32 for six colleges plus Skyline's two runs ($1.29, $3.83).
- The PDF reader (S403; #2189, merged with East LA's in #2192, build `726bde512dfa`, 11,862 programs): a page qualifies
  for a program when it carries every title word outside its contents lines or prints the program's control number; the
  highest-scoring page (listed codes, +5 for a heading naming title and award, +10 for the control number) whose run
  covers the list wins, and the text opens at the heading while that keeps every listed code.
- The spaced-hyphen reconciles took LA City's outcomes failures from 145 to 12 and Pierce's from 85 to 15; the rereads
  replaced 156 and 94 rows (39018615618, 39018617236). 29 LA City and 20 Pierce rows had been rescored on a moved page
  before the guard; Sam pasted the undo (Sheet 88 card 2), read back 2026-10-17: LA City 96 on run 39006380342 and 127
  on 39018419466, Pierce 99 on 39006383070 and 74 on 39018421038.
- Sheet 88 card 1 (Sam, 2026-10-17, applied by the hand-opened S405,
  `kb/receipts/program_source_registry_sheet88_five_catalogs_2026-10-17_s405.sql`): Copper Mountain, San Diego Continuing
  Education, Porterville and Solano to their 2026-2027 PDFs; West Valley to its own HTML catalog.
- College of San Mateo loaded 55 unchecked (S404, 60 of 64 found, $4.98, build `928577b30f0f`, applied 12:24Z by run
  39030423266).
- Parked detail: Diablo Valley found 0 of 244 (its hubs grid departments by award, run 38999074345); Santiago
  Canyon's eLumen host serves 2025-2026, and a narrower page read must show its Catalog Archives and printer PDF links.

## S406 SkyIronwood (2026-10-17, hand-opened): the hand-filed catalogs, read from Sam's release copies

- **A hand-filed copy is read from where the person posted it (#2199).** Sam posted eight refused colleges' catalog
  PDFs (and Porterville's two and De Anza's one addendum) into the `catalog-files` release's text, where GitHub files
  them as attachments. The session's proxy refuses GitHub's attachment host (403, "sessions are bound to their
  configured repositories"); a runner fetches them. So a record names `copy_url` in place of a committed file, and the
  read job's first step, `pin`, writes the copy's sha256, size and run the first time a runner fetches it. A pinned
  hash never changes. The PDFs stay out of git and off the Pages site (CCSF's is 920 pages, American River's 998).
- **The eight read almost whole.** Capture-only reads ($0) found Porterville 82 of 85 listed programs, Cerro Coso 65
  of 74, Folsom Lake 107 of 108, De Anza 227 of 243 (its 2025-2026 catalog), Cosumnes River 217 of 219, Sacramento
  City 204 of 207, CCSF 349 of 371 and American River 368 of 368, each in under eight minutes: one download, no page
  loads. The four Los Rios colleges print one compiled catalog each, so the PDF reader needed nothing new.
- **Extraction and loads** (each under the $40 go; $131.00 in all): Cerro Coso $4.87, 52 loaded; Porterville $6.13,
  76; Folsom Lake $9.43, 104; De Anza $19.66, 210; Sacramento City $18.50, 182; Cosumnes River $18.96, 182; CCSF
  $23.60, 294; American River $29.85, 327 (07230 took a Cloudflare 502 from the extraction gateway, then
  re-extracted alone with `force=07230` and loaded). Records placing none of their listed courses stay out of the load: 13, 6, 3, 17, 22,
  35, 55 and 41; 1,427 loaded in all. CCSF's 55 (16%) is the highest share of the sweep. Four read at random are
  wrong-page picks the extraction caught and reported as not found (Physics 2.0 drew course descriptions, pages
  795-797; Editorial Management and Design drew the Journalism degrees page), so the title gate still admits a
  one-subject program's course pages in a large catalog. Nothing false loaded; the reader item stays open.
- **The arithmetic check fails on a degree with a local GE pattern whose units the page does not state**
  (`incomplete`): Cerro Coso 38 of 65. It is the known shape (record shape 5), not a reading fault.
- **The registry rows wait on Sam (Open Asks Sheet 90 card 2).** The Supabase guard holds an UPDATE for a person, so
  the six rows his addresses approved are a paste card. The reads do not wait on them: a hand-filed record is read
  whatever the row names, and each record carries the copy's address and year.
- **Cuesta's catalog is on curriQunet** (page reads 39046661339, 39046881195, 39047849634): the home page's Catalog
  link names the class-search page the census filed; the catalog page links `cuesta.curriqunet.com/catalog/iq/29951`,
  "Cuesta College Catalog 2026-2027", which answered the reader 200. Sheet 90 card 3.

**Patterns that worked.** One branch per college cut from the code branch before it merged, so the eight captures
ran while #2199's tests did. A Supabase result too large for the context lands in a file: parse it there and check
it against a fingerprint computed in the same query, with nothing retyped.

## Moved from the lane (S406 compaction)

- Build `c111c9b05ca0` (S405): 12,424 programs at 92 colleges, adding Coalinga 52, Skyline 42, West Valley 133, Copper
  Mountain 46, San Diego Continuing Education 90 and Solano 144, with their dated reads and San Mateo's.
- Sheet 89 card 1's detail (S405): Grossmont's row names the catalog's cover image, and its catalog page links
  `catalog.gcccd.edu/grossmont/`, the district CourseLeaf host Cuyamaca reads; Ohlone's names its landing page, and
  its 2026-2027 catalog is PDF chapters, chapter 7 the curriculum guides; Cañada's names its schedule page, and its
  online catalog `catalog.canadacollege.edu/current/` refuses the reader in robots.txt.
- The refusing hosts before S406: De Anza and CCSF (Cloudflare 403), American River, Cosumnes River, Folsom Lake and
  Sacramento City (404), Cerro Coso and Porterville (robots.txt on the PDF). All eight now read from Sam's copies.

## S407 SkyMesquite (2026-10-17): catalog steps for own-HTML PDF colleges, the heading preference, the migrate path

- **A row naming the catalog's page reads through a procedure catalog step.** LA Trade Tech and LA Mission name their
  catalog pages; each page links its 2026-2027 PDF by words (`2026-2027 LATTC Catalog.pdf`, `2026/2027 Catalog | PDF`),
  so a catalog step follows that link, as East LA's does, and the row stays as filed. Capture-only reads found 172 of 188
  and 128 of 140; extraction $13.55 and $8.92; loads 158 and 125 unchecked. College of the Desert the same way (358 of
  365 found in a 476-page PDF; its page calls the online catalog the most current, an open question on its record).
- **A catalog step carries its file's year (#2202).** Rows naming a page name no year, so East LA's 120 records loaded
  with none. `procedure_catalog()` passes a step's `catalog_year`, and `capture()` uses it when the row names none.
- **The heading preference (#2203).** Among pages whose run covers the list: a clean heading (title and award on a line
  naming no listed code) or the printed control number first, then a page that is not course descriptions (two or more
  `CODE - Title (units)` entry lines), then the rest. A transfer degree's award words include a bare "transfer", which
  every course line printing "Transfer: CSU, UC" carried, so course descriptions read as ADT headings. Free reconciles:
  CCSF moved 44 picks, 43 onto named headings (Japanese AA from page 111 to 178); LA City 3 of 241. It recovers only 2 of
  CCSF's 55 skipped: about half are noncredit programs that fall to the codes-only picker, the rest have no other page
  covering their list. East LA's comparison mixed reader versions (its filed capture predates S403's merge).
- **A forced re-extract after a reconcile must name its programs.** A reconcile files the new picks, so the next read
  sees no change and extracts nothing (CCSF run 39055842443 kept 349). Pass `force=<control numbers>`.
- **A held write goes through the runner, not to Sam.** The Supabase guard holds a session's UPDATE; S406 and S407 put
  pastes on Sheets 90-91, and Sam (~18:10Z) pointed back to `supabase-migrate.yml`, built 2026-10-13 for exactly this.
  One committed file per trigger, each statement keeping its receipt's guard, ending with a read-back; the receipt is
  committed by the runner. Two applied this run, 13 rows.
- **Procedure records written:** San Mateo, Coalinga, Copper Mountain, San Diego Continuing Education, Skyline, Solano,
  Cerro Coso, CCSF, De Anza, Porterville (v1); the four Los Rios (v3 merges); LA Trade Tech, LA Mission, Desert (catalog
  steps). A receipt built from a reconcile or a forced single-program run needs its step text corrected by hand (Solano,
  American River): the builder labels every filed read as a full extraction.

**Patterns that worked.** Page reads of the catalog pages before any capture (two runs named all six catalogs). Dated
reads checked against fingerprints computed in SQL, counts and titles both.

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
