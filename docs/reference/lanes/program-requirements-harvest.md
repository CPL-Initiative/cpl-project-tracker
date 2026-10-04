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

**The registry after the S322 apply (2026-10-03, run 37157737048)** carried 112 of
118 catalog addresses and 95 years, 91 of them 2026-27; Sam's six addresses bring it
to 118. Platforms: CourseLeaf 29, curriQunet 27, eLumen 19, PDF 16, custom HTML 15,
SmartCatalog, Coursedog and Acalog 2 each. Formats: 81 HTML per program, 16 single
PDFs, 5 PDFs by section. Mapper links at 11 colleges, program-map pages at 15.
- Six colleges the census cannot reach (the four Los Rios homepages answer 404; De
  Anza and City College of San Francisco serve Cloudflare challenges) carry
  addresses Sam approved (S326, `best_method` person, `corrected_by` set).
- Cerro Coso's catalog PDF is disallowed by robots.txt; the census never loads it.
- Los Angeles City, Palo Verde, Santiago Canyon and Evergreen Valley still name
  2025-26 (no 2026-27 catalog found, October 2026); about 23 rows carry no year.
- A site that fails one read keeps its address. San Diego College of Continuing
  Education stays on the district's catalogs page: no link there names it.

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
- **Sam's check (the fourth bar), 2026-10-04 10:22Z:** 18 match the catalog; both
  fixes went into the procedure, not the records (the scorer's `repeated` check;
  prompt v3 reads "one of the following sequences" as one option group), and rerun
  37195340082 passed both (receipt `kb/program_requirements_pilot/review_2026-10-04.json`).
  **All 20 pilot records pass all four checks.**
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
Mapper" link leads to `san-diego-miramar.programmapper.com`: seven requests, all
**403 Forbidden**. None of the 20 captured catalog pages prints a
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

**The tab (mock-up, First Light):**
[Program Requirements Harvest](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f)
v3, approved (Sam, 2026-10-04: *"mock up looks good"*). Three views (Catalogs,
Pilot records, Sequences), Sierra docked beside them. Each course shows the MAP
credit recommendations its college articulated to it (`map_college_cr_unit`
counts by course code). Porting it means
`CPL_CHAT.mountInto(host, "program-requirements")` and the surface added to
`KNOWN_SURFACES` in `cpl-chat` (a deploy). Cerritos's Ironworker A.S. reads 0
there: its credit is exhibit-to-course articulation in CER, not credit-rec rows.

**The probe (run 37198225537, 2026-10-04):** all 17 mapper hosts reached answered
403; five college pages only link to one; Irvine Valley's "All Program Maps" page (`ivc.edu/node/3220`) answered,
and Santa Monica's answered on run 37209313523. The refusal is the mapper
service's, not the colleges'.

**Catalog addenda (S325, PR #1848).** Sam, 2026-10-04: *"colleges are often
publishing catalog addendum to correct errors and add late changes to the
official catalog. We need to track this in our schema and have our agents
aware."* The census scored addendum links down so none could win the catalog
slot, and then dropped them. `addendum_links()` now records each addendum,
supplement or errata link on the homepage, a catalog index or the catalog page,
for the current or prior catalog year, in `census_evidence -> 'addenda'` (job log
on a branch; the registry's evidence on the weekly apply, through the existing
write function). `addendum_start_year()` dates a link from the years its words or
file name carry (the rules and their cases are in the module and its guard).
Older years, archives, schedules' and calendars' addenda, a sibling's and
reader-service copies stay out. **Measured: 79 addenda at 52 of 118 colleges**
(2026-27: 19; 2025-26: 42; no year named: 18) in the dry run at #1848's head
(37200460417); the offline replay had read 78 (41 for 2025-26).
- **The table is live (Sam's "Go", sheet 29 card 5; S326):** `program_source_addenda`,
  one row per (college, url), the catalog year it amends, a status (listed, read,
  applied, gone, not an addendum), `programs_changed` for the reading agent, history
  by trigger, public read. The write function `program_source_addenda_apply()` is
  security invoker, and the privilege close is pasted (sheet 31): public roles read
  only. Checked live in two self-rolling-back blocks: a partial read marks nothing
  gone, a complete read does, and an addendum that returns comes back `read` if an
  agent read it, else `listed`.
- **The census writes it** (`apply_addenda()` after the registry, apply mode only):
  each college's addenda with `complete` true only when the homepage and the
  catalog page both answered and the address is this read's own; a partial read
  adds what it saw and marks nothing gone. ⚠️ **The table is empty until the next
  apply:** today's Sunday 10:29 schedule did not fire (no scheduled run on the
  list), so the first rows land 2026-10-11, or on a hand dispatch with `mode:
  apply` on `main`.
- **Next (the plan):** a reading agent files which programs each addendum changes;
  a record names the addenda it was checked against, and Sierra cites "the
  2026-27 catalog as amended by the addendum of <date>".

**Sam's sheet 29 (2026-10-04, 11:54-12:00Z, all five his own calls):** (2) guard
lifted: six catalog addresses corrected through the migration path, each prior row
in the history table; (3) the record note above; (4) **yes**: Sierra may say
"required", name each choose block and give the printed total for a program whose
record passed all four checks, citing the catalog and its year; every other program
keeps "lists". `program_requirement_records` holds the 20 pilot records; in Sierra since 15:33Z (deploy 37213391271), smokes 7l and
7q green; (5) the addenda table.

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
pilot records; Miramar prints ECON C2001/C2002 where the file lists ECON 120/121).
**The map names the pick inside a choice**; the catalog keeps the rule. Mock-up:
[CPL Pathways ROEP](https://claude.ai/artifact/8hkej9jHsmLRX6cZYxrXbM) (the
Ironworker A.S. reads 31.5 of 34-38 units through CPL, the hand-built map's figure).
CPL Pathways today: three hand-built maps, no sequence data.

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

**Sheet 31 done** (Sam pasted it, 2026-10-04 16:5xZ): the three memory rows S320 and S321 held are written, and both new tables are closed to public writes; his read-back matched.

**NEXT:** one builder writes each program's display facts (CPL in three kinds,
the figures, the gaps, the map status) to a `display` column Sierra reads and to
`cpl_pathways_roep_data.js`; Sierra wired to them (Sam: *"make sure she's wired to
understand all the included data and considerations"*); then the program view's By
requirement / By term layouts, the Ironworker A.S. section reading its record, and
a public page in the student view; read the two open maps (Irvine Valley, Santa
Monica) and measure how often a slot inside a choice names a course; port the
harvest tab with a Procedures view (each college's reading steps and their cost);
the addenda reading agent; Miramar's map on its own pages (`read: 1`); Butte's ROE
definitions; widen past the pilot.