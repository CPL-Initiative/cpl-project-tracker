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

**The pilot (Phase 1): all 20 records pass all four checks.** Five colleges by four shapes (`kb/program_requirements_pilot_sample.json`): an ADT, an A.S./A.A. with a choose block, a certificate with an electives block, a noncredit certificate; each college's use case fills one slot (Cerritos Ironworker A.S. 42158, Mt. San Antonio LVN-to-RN A.S. 08086, Riverside City Culinary Arts 22804, West LA Real Estate Salesperson 37839, Miramar Fire Technology A.S. 05100). **Capture** (`kb/_program_requirements_pilot.py`): accepts a page naming half the courses the Program Course File lists; curriQunet program views fall back to their own PDF export; sources filed under `kb/program_requirements_pilot/sources/`. **Extraction** (the `program-requirements-extract` Edge Function, version 2, Claude Opus 5.5, structured output, record shape version 2: `measure`, `option_group`, `stated`, `units_max`, alternatives with their own units and `catalog_addition`); records under `.../records/`, about $0.05 a program. **Scorer** (`kb/_program_requirements_score.py`): coverage, no unflagged invented course, unit arithmetic (`equal`, `unequal`, `incomplete`, `unstated`). **Sam's reading (10:22Z):** 18 match; both fixes went into the procedure and rerun 37195340082 passed them. Guard `tests/program_requirements_pilot_test.py`. Run-level history: the lessons doc, S323-S324.

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

**Catalog addenda (Sam, 2026-10-04: *"We need to track this in our schema and have our agents aware."*).** The census records each addendum, supplement or errata link for the current or prior catalog year in `census_evidence -> 'addenda'` and writes `program_source_addenda` after the registry on apply (one row per college and url; status listed, read, applied, gone, not an addendum; `programs_changed` for the reading agent; public read, writes through a security-invoker function). Only a complete read (homepage and catalog page answered, own address) marks an addendum gone. ⚠️ **Empty until the next apply** (Sunday 10:29 schedule, next 2026-10-11, or a hand dispatch with `mode: apply` on `main`); the S325 dry run measured 79 addenda at 52 colleges. Next: the reading agent, then Sierra cites "the 2026-27 catalog as amended by the addendum of <date>". Detail: the lessons doc, S325-S327.

**Sam's sheet 29 (2026-10-04, all five his own calls):** (2) guard lifted for the six catalog addresses; (3) the record note above; (4) **yes**: Sierra says "required", names each choose block and gives the printed total for a checked program, citing the catalog and its year (live since 15:33Z, smokes 7l and 7q); (5) the addenda table.

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

**The display build is live (S327).** `kb/_build_roep_display.py` writes each checked program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page): CPL in three kinds per course (here: MAP credit recommendations by course, a dated read in `kb/program_requirements_pilot/map_cr_by_course.json` with its query beside it, plus the articulated-exhibit feed; could adopt: another college articulated the credential to a course of the same live-membership identity, never across a `cross_disciplinary` one; for consideration: a statewide recommendation naming the course's C-ID, zero on the pilot), the mock-up's `plan()` figure, the gaps by owner and the registry's map status (`registry_read.json`). Build `bbbbfb611f15`: all 20 rows match the receipt (`--verify-sql`). A bare UPDATE is held by the connector, so the receipt uses the load's insert-on-conflict form. Figures: Ironworker A.S. up to 31.5 of 34-38 units; Riverside Administration of Justice 18 of 18-19; Miramar Fire Technology 22.5 of 25.5; Riverside Cyber Defense and West LA Network & Security 21 each. Guard `tests/roep_display_test.py`. Sierra reads the facts (her CATALOG REQUIREMENTS lines, smoke 7r). MAP data to raise with Miramar: its AUTO 156G (Engine and Related Systems) carries an EMT Certification and a Driver Operator 1B articulation.

**Outcomes (Sam, 2026-10-04 18:03Z, vault braindump 18:03):** add an element that grabs published course and program outcomes (CMSs, newer COCI courses, catalog listings), and a process comparing harvested credential skills with course outcomes for alignment indicators. Measured: 13 of the 20 captured pilot pages print program or student learning outcomes (Cerritos, Riverside, West LA all four; Mt. SAC one; Miramar none). COCI course outcomes are not in our data; the skills file (`kb/reference/industry_credential_skills.json`) is not started. **NEEDS SAM** (sheet 33 card 4): record shape v3 with outcomes as printed.

**CSU LA (Sam, opening note):** *"We'll figure out a procedure for them as well."* No registry row (the registry seeds from `coci_college_programs`). **NEEDS SAM** (sheet 33 card 3): now or after the Ironworker proof; a CSU has no state Program Course File, so its closed list is the catalog's own inventory.

**The proof of concept: Cerritos Ironworker, high school to career (Sam, 18:23Z, vault braindump 18:23).** Rungs: HS dual enrollment and CTE articulation (Cx), noncredit, adult ed and ROP; Cerritos and stackable certificates; the A.S.; the B.S.; internships and employment. In our data: Certificates 36002 Reinforcing (34 units) and 36003 Structural (38) are each one complete A.S. major option; the A.S.'s 31.5 CPL units are all credit by exam on the core and the Reinforcing option (the Structural option and IWAP 40.10 carry none); the hand-built map's *27-29 major units* is stale against 34-38; noncredit Pre-Apprenticeship 24102 and 26 noncredit AED 40-41 copies of the IWAP courses have no CPL link; MAP holds no high school, ROP, adult school or noncredit CPL for Cerritos. The B.S. (approved February 2026), the high school pathway and the apprenticeship hours rest on search snippets. Full research, VERIFIED vs LEAD: the lessons doc, S327. **NEEDS SAM** (sheet 33 card 5): who at Cerritos confirms them.

**NEXT:** ① Ship #1854: A/B, merge, deploy cpl-chat, smoke 7r. ② **The Ironworker proof** (Sam's 18:23Z note): a First Light mock-up of the whole ladder on CPL Pathways, the Ironworker A.S. section reading `cpl_pathways_roep_data.js` (fixes the stale 27-29), the two certificates as checked records, and a noncredit-to-credit CPL lead for AED 40-41 (Santa Ana's MAPCXN model). ③ Sheet 33's rulings (CSU LA, outcomes). ④ The program view's By requirement / By term layouts and the harvest tab port with a Procedures view (fix its Ironworker row first: it reads 0 MAP credit recs). ⑤ Read Irvine Valley's and Santa Monica's maps; the addenda reading agent; Miramar's map on its own pages (`read: 1`); Butte's ROE definitions; widen past the pilot. Refresh the builder's two dated reads (`map_cr_by_course.json`, `registry_read.json`) when the harvest adds a college; rebuild, apply the receipt as migrations, `--verify-sql`.