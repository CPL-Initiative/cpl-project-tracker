---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-10-03
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

🔨 **Phase 0 (the census) built and merged (S320, #1836); the registry is live
and seeded, the first dry run was still reading at checkpoint.** Sam's three
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

**The census** (`kb/_program_source_census.py`,
`.github/workflows/program-source-census.yml`): Playwright Chromium on a
runner reads each homepage, scores catalog links (a library catalog, an old
year, an archive or an addendum lose), follows one hop to Academics or
Programs pages when the homepage names no catalog, then probes
`catalog.<domain>`. It fingerprints the platform from the page's URL, then its
assets, then its text (a text-only hit is noted), reads the academic year, and
picks up Program Mapper and program-map links and curriculum-system links.
robots.txt first for every host; 4 s between loads; at most 6 pages a college;
the user agent names `CPLInitiativeCatalogCensus` and the dashboard URL.
- A branch push is a dry run (job log only). Apply runs only on `main`: weekly
  (Sundays 10:29 UTC) or a hand dispatch with mode apply. A newer run queues
  behind a running pass.
- Governance: the cadence is dismissed in `kb/governance_surface_map.json`
  with its reason until Phase 1 names the person who owns the outcome.
- Guard: `tests/program_source_census_test.py` (pure half, no browser).

**Sam's rulings (2026-10-03):** build our own best version now; the Butte
College Tech Center's COCI ROE fields are a parallel track, never a gate
(*"working on that end is often a slog or dead end"*); start from use cases and
test against real catalog pages; a per-college source registry kept current by
agents; a per-college tab; an agent per college that the college and the MAP
team own and train. S320: "Go" on the registry table as described (its
history, its one write path, a public read); "Approved" on the push that adds
the weekly apply.

**Sam's calls, ruled (sheet 23, 2026-10-03 15:05Z, "As proposed", his own pick):** the catalog of the
academic year wins on disagreement (CMS and COCI values kept and shown); pilot at Cerritos, Mt. San Antonio,
Miramar, Riverside City and a census-picked PDF-catalog college; a named MAP team member checks the 20-program
sample, with articulation officers invited; sequencing in the pilot only from Miramar's PPM map; yes to reading
college websites from GitHub runners on a slow schedule that names the CPL Initiative; model calls through a
Supabase Edge Function; nothing public until a college's records pass all four checks, first public use through
Governance; the Tech Center asked for ROE field definitions when convenient. Still to name when Phase 1 reaches
them: Riverside City's program, the person who checks the sample, and who contacts the Tech Center.

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
  every one); runners do. CourseLeaf (Cerritos, Foothill) and curriQunet (San
  Diego) blocked plain reads in July (`docs/cpl_pathways_lessons.md`).
- `cpl-news.yml` is the worked pattern for an agentic harvest: a scheduled
  workflow calls an Edge Function that holds the Anthropic key. The census uses
  no model yet.

**First reads (2026-10-03).** The full dry run in one job (run 37133680797)
died after 45 minutes with no log. An 8-college dry run on `main` (run
37136549708) read all eight in 2 minutes: curriQunet at Allan Hancock and eLumen
at Antelope Valley, both 2026-27; Barstow's 2026-27 catalog as one PDF through
its index page; a Program Mapper link at Bakersfield; American River's homepage
answered 404 to the browser. At Bakersfield, Berkeley City and Butte the census
stopped at the college's own catalog page while the vendor catalog sat one link
away (Cabrillo's only vendor link was a Coursedog login). The census now
follows that vendor link one hop (never a login), and the pass runs as four
parallel slices, each with its own log.

**NEXT:** read the four-slice dry run from the branch push that carries the
vendor hop; fix what it shows; merge; then dispatch `program-source-census.yml`
on `main` with mode apply and read the registry back: catalog URL coverage, the
platform mix, the blocked and 404 counts, the PDF-catalog candidates for the
pilot's fifth college. If many rows land `unknown`, a model pass through an
Edge Function (call 6) picks among the census's own candidate links. Then Phase
1, the pilot: five colleges, four program shapes each, scored on course
coverage, no invented courses, unit arithmetic, and agreement with a person.
