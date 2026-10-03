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

🔨 **Phase 0 (the census) built (S320, #1836), its reader corrected over four
full reads (S321, #1839), and the registry filled by the first apply (S321,
run 37142060932).** Sam's three
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
`catalog.<domain>`, also when the homepage itself fails. From a college page
that names a vendor only in its text, or names no year and no vendor, it
follows the vendor or `catalog.*` link one hop, never a login, change log,
archive or library link, and never onto an older year than the page it left.
On a district page it takes the link naming this college's own words and
refuses one naming a sibling's (every college's name reaches each slice). A
page listing two or more year-named catalogs is an index; the choice drops
addenda and siblings. Link text falls back to `textContent` for hidden
menus. Two-digit years are read only in a curriQunet `/alias/` name. It fingerprints the platform from the page's URL, then its
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

**The registry after the first apply (2026-10-03, run 37142060932, four
slices, 118 history rows).** 112 of 118 colleges carry a catalog address, 77 a
year, 71 of them 2026-27; 111 sites let the browser in. The last dry read (run
37141321117) gave 112, 78 and 71 (one page's title sets its year late); the
first (run 37137334059) gave 109, 67 and 61, and no college reads worse now.
Platforms: CourseLeaf 29, curriQunet 27, eLumen 19, PDF 16, custom HTML 15,
SmartCatalog, Coursedog and Acalog 2 each. Formats: 81 HTML per program, 16
single PDFs, 5 PDFs by section. Program Pathways Mapper links at 11 colleges,
program-map pages at 15; a public curriculum-system view at 50.
- Six colleges the census cannot reach (no address): the four Los Rios colleges
  (American River, Cosumnes River, Folsom Lake, Sacramento City: the homepage
  answers 404) and De Anza and City College of San Francisco (Cloudflare
  challenges). No `catalog.<domain>` host resolves for them. A web search found
  each address; they wait on a person's entry (below).
- Cerro Coso's catalog PDF is disallowed by robots.txt; the address is recorded
  and the census never loads it.
- Years to check (2025-26): Cuyamaca, Evergreen Valley, Los Angeles City,
  Madera, Palo Verde, San Diego City (its own homepage links `city25-26`) and
  Santiago Canyon. 34 rows with an address carry no year.
- San Diego College of Continuing Education stays on the district's catalogs
  page: no link on it names the college.
- The pilot's single-PDF candidates: Barstow, Clovis, Lassen, Mendocino, Shasta,
  Woodland, Yuba, College of the Canyons, Compton and five Los Angeles district
  colleges (City, Harbor, Pierce, Valley, West); Canyons, Harbor, Valley and West
  also publish Program Mapper maps.

**NEEDS SAM (open-asks sheet 24):** (1) paste the two memory receipts
(`kb/receipts/cpl_memory_2026-10-03_s320.sql`, `..._s321.sql`); (2) enter the six
catalog addresses in `kb/receipts/program_source_registry_corrections_2026-10-03_s321.sql`,
the registry's correction path (`corrected_by`), which the census then keeps.

**NEXT:** read the registry back after Sam's corrections; the weekly apply
runs Sundays 10:29 UTC and keeps a corrected row as entered. Check the seven 2025-26 years. If many
rows stay without a year or `unknown`, a model pass through an Edge Function
(call 6) picks among the census's own candidate links. Then Phase 1, the pilot:
five colleges, four program shapes each, scored on course coverage, no invented
courses, unit arithmetic, and agreement with a person; the fifth college comes
from the PDF list above.
