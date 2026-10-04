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
Governance; the Tech Center asked for ROE field definitions when convenient. Sheets 25 and 26 named the rest:
Riverside City's Culinary Arts certificate, Sam checks the sample himself, and Sam asks the Tech Center.

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

**The registry after the S322 apply (2026-10-03, run 37157737048, four
slices)** carried 112 of 118 catalog addresses and 95 years, 91 of them 2026-27;
Sam's six addresses (below) bring it to 118. Platforms:
CourseLeaf 29, curriQunet 27, eLumen 19, PDF 16, custom HTML 15, SmartCatalog,
Coursedog and Acalog 2 each. Formats: 81 HTML per program, 16 single PDFs, 5
PDFs by section. Program Pathways Mapper links at 11 colleges, program-map
pages at 15; a public curriculum-system view at 50.
- Six colleges the census cannot reach (the four Los Rios homepages answer 404;
  De Anza and City College of San Francisco serve Cloudflare challenges) carry
  addresses Sam approved, entered 2026-10-04 (S326, `best_method` person,
  `corrected_by` set, so the census files its own reading beside them).
- Cerro Coso's catalog PDF is disallowed by robots.txt; the address is recorded
  and the census never loads it.
- 2025-26 years: Los Angeles City, Palo Verde, Santiago Canyon and Evergreen
  Valley name 2025-26 on their own catalog pages, and a web search found no
  2026-27 catalog for them (October 2026); the weekly read moves them when they
  publish. About 23 rows with an address carry no year, most on custom college
  pages, an Acalog list or a PDF whose address names none.
- A site that fails one read keeps its address (three did in the S322 apply:
  Los Angeles Mission, Los Angeles Valley, Santa Monica).
- The Los Angeles district's sites refused the runner (403) during that apply;
  the pilot still read West Los Angeles's catalog PDF (below).
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

**The sequence pass (S325, PR #1847):** `kb/_program_sequence_ppm.py` on its own
workflow (`program-sequence-ppm.yml`, so a change never reruns the capture's 20
reads) enters a college's Program Mapper from the college's own pages, follows
the link into the mapper, and accepts a page naming half the program's listed
courses and at least two terms. **Run 1 (37197332656, 2026-10-04):** a web search
found Miramar's own mapper page (`sdmiramar.edu/program-mapper`, with deep links
`?pg=/academics/interest-clusters/<id>/programs/<id>`), and its "View Program
Mapper" link leads to `san-diego-miramar.programmapper.com`, which answered all
seven requests **403 Forbidden**. None of the 20 captured catalog pages prints a
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
Verde's address is a homepage `#`), **1 open** (Irvine Valley's own maps page),
**1 unreached** (Santa Monica timed out). Receipt:
`kb/receipts/program_source_registry_sequence_access_2026-10-04_s326.sql`; the
history trigger now names `sequence_checked_run`. The reader reads them: it never
requests a host on record as refused, follows the college's own links to the
program's map, pathway, roadmap or sequence (a page or a PDF), and the probe asks
each recorded host's front page once a run, flagging `OPENED: file it` when one
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

**The tab (mock-up, First Light):**
[Program Requirements Harvest](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f)
v2. Three views (Catalogs, Pilot records, Sequences) and Sierra docked beside
them, scoped to a program by "Ask Sierra about this program". Each course shows
how many MAP credit recommendations its college has articulated to it (counts of
`map_college_cr_unit.credit_rec` by course code, never a student figure); 14 of 20
programs hold one. Porting it means `CPL_CHAT.mountInto(host,
"program-requirements")` with `setScope` / `setSuggestions`, and the surface added
to `KNOWN_SURFACES` in `cpl-chat` (a deploy). ⚠️ Cerritos's Field Ironworker A.S.
reads 0: its apprenticeship credit lives in the hand-built CPL Pathways map, not in
MAP's credit recommendations.

**The probe (run 37198225537, 2026-10-04):** of the 24 sequence sources the census
filed, **all 17 mapper hosts reached answered 403** (`*.programmapper.ws|.com|.org`,
`programmap.<domain>`, `pm.hartnell.edu`, `mypath.contracosta.edu`,
`jaguarspot.sjcc.edu`); five college pages only link to a mapper host
(Bakersfield, LA Harbor, Merced, West Los Angeles; Palo Verde's address is its
homepage); Santa Monica timed out; **Irvine Valley's "All Program Maps" page
(`ivc.edu/node/3220`) answered**. The refusal is the mapper service's, not
Miramar's.

**Catalog addenda (S325, PR #1848).** Sam, 2026-10-04: *"colleges are often
publishing catalog addendum to correct errors and add late changes to the
official catalog. We need to track this in our schema and have our agents
aware."* The census scored addendum links down so none could win the catalog
slot, and then dropped them. `addendum_links()` now records each addendum,
supplement or errata link on the homepage, a catalog index or the catalog page,
for the current or prior catalog year, in `census_evidence -> 'addenda'` (job log
on a branch; the registry's evidence on the weekly apply, through the existing
write function). `addendum_start_year()` dates a link from every year its words
or file name carry: a pair (2026-27), a span (2023-2025 amends its last year), a
two-digit path pair (/24-25/), a single year (a fall term or month starts the
year, any other ends it); an upload folder's year never counts. Left out: older
years, archives, class-schedule and important-dates addenda, calendars,
"Supplemental Instruction", a sibling college's addendum, and reader-service
copies. **Measured (run 37199538519, replayed offline with the final filter): 78
addenda at 52 of 118 colleges** (2026-27: 19; 2025-26: 41; no year named: 18).
The raw read found 136 at 58; every one of the 57 dropped was older, a schedule's,
a calendar's or a proxy copy.
- **The table is live (Sam's "Go", sheet 29 card 5, 12:00Z; S326):**
  `program_source_addenda`, one row per (college, url), the catalog year it amends,
  a status (listed, read, applied, gone, not an addendum), `programs_changed` for
  the reading agent, history by trigger, public read. Part A (create-only) is
  applied as migrations `program_source_addenda_create_2026_10_04` and
  `program_source_addenda_return_keeps_read_2026_10_04`; the full file timed out at
  60 s on the connector's confirmation for its revokes and wrote nothing. The write
  function `program_source_addenda_apply()` is **security invoker**, so row-level
  security alone keeps anon and authenticated out of every write until **Part B**
  (`kb/receipts/program_source_addenda_close_2026-10-04_s326.sql`, Sam pastes it)
  removes their default privileges. Checked live in two self-rolling-back blocks:
  new, seen again, a partial read marks nothing gone, a complete read does, and an
  addendum that returns comes back `read` if an agent read it, else `listed`.
- **The census writes it** (`apply_addenda()` after the registry, apply mode only):
  each college's addenda with `complete` true only when the homepage and the
  catalog page both answered and the address is this read's own; a partial read
  adds what it saw and marks nothing gone. ⚠️ **The table is empty until the next
  apply:** today's Sunday 10:29 schedule did not fire (no scheduled run on the
  list), so the first rows land 2026-10-11, or on a hand dispatch with `mode:
  apply` on `main`.
- **Agents aware (the plan):** the census lists addenda; a reading agent reads
  each listed addendum, files which programs it changes, and marks it read; a
  program record carries the addenda it was checked against, and a record whose
  college has an unread addendum for its catalog year is flagged; Sierra cites
  "the 2026-27 catalog as amended by the addendum of <date>".

**Sam's sheet 29 (2026-10-04, 11:54-12:00Z, all five his own calls):** (2) *Guard
lifted: run it*: S326 ran the six catalog addresses through the migration path
(`program_source_registry_corrections_2026_10_03_s321`); six rows corrected, each
with its prior row in the history table. (3) the record note above. (4) **yes**:
Sierra may say "required", name each choose block and give the total for a program
whose record passed all four checks, citing the catalog and its year; every other
program keeps "lists". Built next behind the A/B preview and a smoke (it needs the
records in a table Sierra reads; today they are repo files). (5) the addenda table
above.

**NEEDS SAM (open-asks sheet 30):** paste three files in the SQL editor:
`kb/receipts/cpl_memory_2026-10-03_s320.sql` and `..._s321.sql` (his call on
sheet 29: later; three rows name a word the connector stalls on) and
`kb/receipts/program_source_addenda_close_2026-10-04_s326.sql` (the addenda
table's privilege close).

**NEXT:** Sierra's "required" for checked records (sheet 29 card 4); Sam's
reaction to the tab mock-up, then the port into COBI (a static tab plus the
Sierra surface); the addenda reading agent once the table has rows; a sequence
read that looks for Miramar's map on its own pages (`read: 1`); the Butte College Tech
Center's ROE field definitions (Sam asks them, the pilot's records being done);
then the harvest widens past the pilot.
