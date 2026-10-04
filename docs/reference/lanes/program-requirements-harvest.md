---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-10-04
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
full reads (S321, #1839) and two more (S322, #1841: a catalog's own banner
names its year), and the registry filled by apply on `main`.** Sam's three
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
menus. Two links on one host that name different years put the newer first.
It fingerprints the platform from the page's URL, then its assets, then its
text (a text-only hit is noted), and picks up Program Mapper, program-map and
curriculum-system links. The year comes from the page's title, then its h1,
then a vendor catalog's own edition banner, then the address, the link's
words, and a curriQunet `/alias/` name (the only place two-digit years are
read). The banner counts only on a page the address or assets place on
CourseLeaf, curriQunet, eLumen, Coursedog or SmartCatalog, only beside
"catalog" or "edition", never when its phrase names an archive or a previous
catalog or "coming soon" follows, and it never lowers a year the address or
the link named. A read that finds no catalog keeps the registry's address and
says so in the notes. Each catalog page's evidence names where its year came
from, the banner's words, and the year its opening words name.
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

**The registry after the S322 apply (2026-10-03, run 37157737048, four
slices).** 112 of 118 colleges carry a catalog address and 95 a year, 91 of
them 2026-27 (the first apply, run 37142060932, gave 112, 77 and 71). Three
branch reads confirmed the reader before it ran (runs 37154900912,
37156161286, 37157042439), each compared row by row with the last, and no
college lost an address or a year, or moved to an older year. Platforms:
CourseLeaf 29, curriQunet 27, eLumen 19, PDF 16, custom HTML 15, SmartCatalog,
Coursedog and Acalog 2 each. Formats: 81 HTML per program, 16 single PDFs, 5
PDFs by section. Program Pathways Mapper links at 11 colleges, program-map
pages at 15; a public curriculum-system view at 50.
- Six colleges the census cannot reach (no address): the four Los Rios colleges
  (American River, Cosumnes River, Folsom Lake, Sacramento City: the homepage
  answers 404) and De Anza and City College of San Francisco (Cloudflare
  challenges). No `catalog.<domain>` host resolves for them. A web search found
  each address; they wait on a person's entry (below).
- Cerro Coso's catalog PDF is disallowed by robots.txt; the address is recorded
  and the census never loads it.
- 2025-26 years: Los Angeles City, Palo Verde, Santiago Canyon and Evergreen
  Valley name 2025-26 on their own catalog pages, and a web search found no
  2026-27 catalog for them (October 2026); the weekly read moves them when they
  publish. About 23 rows with an address carry no year, most on custom college
  pages, an Acalog list or a PDF whose address names none.
- A site that fails one read keeps its address. In the S322 apply three did:
  Los Angeles Mission and Los Angeles Valley answered 403 at the homepage (the
  branch reads reached both), and Santa Monica's homepage showed no catalog
  link. Without the guard the registry would hold 109 addresses. Columbia had
  timed out the same way in one branch read.
- ⚠️ The Los Angeles district's sites refused the runner (403) during the
  apply. West Los Angeles, the pilot's PDF college, is a district college: a
  pilot read of its catalog PDF may meet the same refusal, and the census
  never works around one.
- San Diego College of Continuing Education stays on the district's catalogs
  page: no link on it names the college.

**The pilot (Phase 1): all 20 records pass the three automatic bars (S324,
PR #1845); the fourth bar, Sam's reading, is on his review sheet.** The 20
programs are five colleges by four shapes (`kb/program_requirements_pilot_sample.json`):
an ADT, an A.S./A.A. with a choose block, a certificate with an electives block,
a noncredit certificate. Each college's fixed use case fills one slot: Cerritos
Ironworker A.S. (42158), Mt. San Antonio LVN-to-RN A.S. (08086), Riverside City
Culinary Arts certificate (22804, Sam's pick), West Los Angeles Real Estate
Salesperson certificate (37839), Miramar Fire Technology A.S. (05100, the PPM
sequence program, in the noncredit slot because Miramar offers no noncredit
programs). The other picks lead their shape on MAP CPL articulations at that
college.
- **Capture** (`kb/_program_requirements_pilot.py`,
  `program-requirements-pilot.yml`): starts at the registry's catalog address
  and accepts a page only when it names half the courses the Program Course File
  lists for the program; follows links on the catalog's own host, clicks through
  curriQunet's navigation, reads a PDF catalog whole. On a curriQunet program view
  whose text names too few courses it reads the view's own "Export Page as PDF"
  (`Catalog/Export?id=71&outlineId=<view>`, robots first) and keeps the export
  from its top; among items that tie on the title's words it clicks the one that
  begins with the title. Writes nothing. **20 of 20 found**: run 4
  (37166814546) for Cerritos, Mt. San Antonio, Riverside City and West Los
  Angeles; run 8 (37173160158) for Miramar, all four at coverage 1.0. Filed byte
  for byte under `kb/program_requirements_pilot/sources/`.
- **Extraction** (`kb/_program_requirements_extract.py`,
  `program-requirements-extract.yml`, the `program-requirements-extract` Edge
  Function, **deployed version 2**, Claude Opus 5.5 at effort high, structured
  output): reads only the fixtures, never a college site. **Record shape
  version 2**: `program.measure` (units or hours), `block.option_group` (one of
  several whole blocks), `block.stated` (a block total the catalog prints),
  `units_max` (a range beside a course), alternatives as objects carrying their
  own units and `catalog_addition`. Run 2 (37171952080) passed **16 of 16** at
  $0.8535 ($0.053 a program); run 3 (37173589029, only Miramar) passed **4 of 4**
  at $0.2762. The records are filed under `kb/program_requirements_pilot/records/`.
- **The scorer** (`kb/_program_requirements_score.py`): coverage, no unflagged
  invented course, unit arithmetic. Arithmetic is `equal`, `unequal`,
  `incomplete` or `unstated`; `unstated` (Mt. San Antonio Vocational Nursing,
  which prints no hours, units or total) passes only when the record carries no
  figure, the closed list stores no units, and the catalog text names no hours or
  units. 19 records are `equal`.
- **Sam's check (the fourth bar), 2026-10-04 10:22Z:** all 20 cards his own call:
  18 match the catalog, and two fixes (receipt
  `kb/program_requirements_pilot/review_2026-10-04.json`). Both are carried out:
  the scorer's `repeated` check refuses a course twice in one block (Mt. San
  Antonio Fire listed FIRE 86 twice), and prompt v3 (Edge Function version 3)
  reads "one of the following sequences" as whole sequences in one option group
  (Mt. San Antonio LVN-to-RN). The rerun (37195340082, $0.1377) passed both, and
  the two records are filed. **All 20 pilot records now pass all four checks.**
- **Guard:** `tests/program_requirements_pilot_test.py` (165 checks): every
  fixture re-read with today's matcher, every filed record re-scored with today's
  scorer.

**Sam's calls on sheets 25 and 26 (2026-10-03, 22:57Z and 23:01Z, his own
picks):** Riverside City's program is the Culinary Arts certificate; Sam
himself checks the 20-program sample; Sam asks the Butte College Tech Center
for its ROE field definitions after the pilot's first records; the six catalog
addresses go in as given ("go"); the memory receipts wait for later.

**NEEDS SAM (open-asks sheet 27):** (1) paste the two memory receipts
(`kb/receipts/cpl_memory_2026-10-03_s320.sql`, `..._s321.sql`) in the SQL editor
when convenient (his call: later): three rows name a stall word, and the
connector's confirmation never reached him when S322 ran them; (2) the six
catalog addresses: he said "go", and the repo's Supabase guard refused the
session's UPDATE to the shared registry (Rule 10), so he pastes
`kb/receipts/program_source_registry_corrections_2026-10-03_s321.sql` in the SQL
editor or lifts the guard for one run.

**NEXT:** Phase 1's last pieces: the Miramar PPM sequence (the Program Mapper
hosts answered 403 or did not resolve) and the Butte College Tech Center's ROE
field definitions (Sam asks them); then the harvest widens past the pilot.
