---
title: "Data dictionary: every Commons data dashboard dataset, its owner, procedure and planned improvement"
created: 2026-11-13
updated: 2026-11-13
tags: [reference, commons, data-sources, data-dictionary, procedures, cobix]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[data_sources]]"
  - "[[commons]]"
---

# Data dictionary

**Why this exists (Sam, 2026-11-13, relayed by COBIx on #3220):** *"We should have in our plan documentation (data
element dictionary) for each dataset and the procedures currently used to procure or connect to the data and the
planned procedural improvements for efficiency and accuracy and who owns the data."* He asked in the same message for
an API connection checklist, with CCCStart as a priority API, and for the JST authorization funnel.

Every dataset on the Commons data dashboard (#3215, `#commons/data`): what it is, who owns it, its key elements, how we
get it today, and how we plan to get it faster and more accurately. The register in [`data_sources`](data_sources.md)
keeps each source's stage and its four-step entry; this file keeps the elements, owners, procedures and improvements.
The two link both ways.

**Student-level data never enters COBI.** Student records (CCCStart, JST) land in MAP under FERPA, the student's
consent, a data-sharing agreement and least-privilege fields (Sam, 2026-11-08). COBI shows connection status and
counts only. Owners are named by organization or role, never by contact details.

**How to read a claim.** The draft is COBIx's (#3220, 2026-11-13). Sky checked each claim it could against the repo
(table names against the `chatbox/*.sql` and `kb/*.sql` schemas and `kb/dependency_map.json`, workflows against
`.github/workflows/`, counts against the committed files); the **Evidence in the repo** line names what was checked.
*To confirm* is the draft's own mark: not verified, and never promoted to fact without a source. A claim marked
*(COBIx, 2026-11-13; not verified in the repo)* rests on a source outside the repo (the CCCCO report, vendor release
notes, a live table) that a session could not check. Where the repo disagreed with the draft, the repo's figure is
written and the draft's is named beside it.

**The dashboard reads this file.** `kb/_build_commons_data_status.py` parses every `###` entry under *The datasets*
(its labeled lines) into the `dictionary` key of `kb/status/commons_data.json`, and the checklist table below into the
`apis` key, so this file is the one source and `tests/commons_data_status_build_test.py` fails when the two disagree.
Keep each label on one line, spelled as it is here. An API status counts only with evidence in the repo: each
backticked path in the Evidence cell must exist (a `path::text` item must also contain the text), or the builder
reports the status as `unverified`.

Groups: **Harvested** (we read it from public pages), **Connected** (a file or sync from the holder), **Planned** (not
connected). Stages are the register's: Found, Assessed, Asked, Connected, Scheduled.

## The datasets

### Program requirements

- **Group:** Harvested
- **Stage:** Connected
- **Purpose:** What a student must complete for each Active program (courses, blocks, units), read from the college's own catalog, so CPL Pathways can show real requirements.
- **Owner / steward:** The college (catalog owner: curriculum office). COBI holds a read copy; COCI (CCCCO) is the program list of record.
- **Grain:** One row per college and program control number (latest read).
- **Refresh:** Harvest waves by college; reread on a new catalog year or a failed check. No fixed schedule.
- **How we procure or connect today:** A catalog reader per platform (CourseLeaf, Acalog, PDF and others) in GitHub Actions; filed to `kb/program_requirements_college/<slug>/`, loaded to `program_requirement_records`. The live counts per college (Active, Teachout and Approved apart) come from `kb/_commons_data_live.py` in the census workflow.
- **Access and terms:** Public catalog pages; respect robots rules and firewall refusals, and never retry a refusal another way (Sam, Sheet 29 card 3; `blocked_sources`).
- **Planned improvements:** One matrix run per wave with per-college receipts; v2 automatic reread after verify; spot-check 5 records per college; platform readers before PDF extraction.
- **Confidence method:** Strong = 5 of 5 spot-checked records agree; partial = one differs, or an unreachable page; limited = machine checks only, or 2 or more differ (display held). The builder's `confidence()` holds the rule.
- **Evidence in the repo:** `chatbox/supabase_program_requirement_records.sql`, `.github/workflows/program-requirements-wave.yml`, `kb/program_requirements_college/`, `kb/spot_checks/`, `docs/reference/blocked_sources.md`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `college` | text | College name as in COCI | PK part |
| `control_number` | text | COCI program control number | PK part; joins `coci_college_programs` |
| `program_title`, `award`, `catalog_year` | text | Title, award type, the catalog year read |  |
| `record` | jsonb | {program, blocks} as filed: courses, choices, unit rules |  |
| `checks` | jsonb | {coverage, invented, arithmetic, reviewer}; passing = coverage true, invented true, arithmetic equal or unstated |  |
| `total_min`, `total_max`, `measure` | numeric, text | Unit or hour totals |  |
| `checked`, `checked_by`, `checked_at` | bool, text, timestamptz | A person's confirmation (`checked_by` names the person; the live export counts `checked` and never reads the name) |  |
| `source_url`, `extracted_run`, `loaded_at` | text, bigint, timestamptz | Provenance: page read, Actions run, load time |  |

### Course SLOs

- **Group:** Harvested
- **Stage:** Scheduled
- **Purpose:** Course student learning outcomes as printed, for outcomes-first matching of CPL and courses.
- **Owner / steward:** The college (SLO coordinator, curriculum office). Systems: eLumen, CurriQunet/Meta, Coursedog and others.
- **Grain:** One row per college, course, source page and outcome block.
- **Refresh:** The nightly SLO read (step 11 of the scheduled sessions), colleges picked by `scripts/next_slo_colleges.py`; `kb/course_outcomes/queue.json` skips the none, held and parser colleges.
- **How we procure or connect today:** The course-outline reader writes `kb/course_outcomes/<slug>/read_<run>_pNofM.json`, and `course_outcomes_load()` loads it (insert-only, service role).
- **Access and terms:** Public outline pages only; a system behind a sign-in is a college ask.
- **Planned improvements:** Parser fixes for the parser colleges; feed derived descriptions (#3219); spot-check outcomes against the outline.
- **Confidence method:** Limited until a person spot-checks outcomes; a machine read with fingerprints.
- **Evidence in the repo:** `chatbox/supabase_course_outcomes.sql`, `kb/migrations/2026-11-05_course_outcomes_kind.sql`, `kb/_course_outcomes_load.py`, `.github/workflows/course-outcomes-read.yml`, `.github/workflows/course-outcomes-load.yml`, `scripts/next_slo_colleges.py`, `kb/course_outcomes/queue.json`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `college`, `course_code` | text | College and subject plus number | natural key; joins COCI by college, subject and number |
| `course_title`, `heading`, `lead` | text | As printed |  |
| `outcomes` | jsonb array | Each outcome's text, exactly as printed |  |
| `kind` | text | `slo` or `objective` (the loader; default `slo`) | part of the unique key |
| `fingerprint` | text (md5) | Hash of the outcome block | unique with college, course, source_url and kind |
| `source_url`, `source_kind`, `source_system` | text | Outline or catalog page and system |  |
| `read_run`, `loaded_at` | bigint, timestamptz | Provenance; the newest read_run is current |  |

### Program PLOs

- **Group:** Harvested
- **Stage:** Connected
- **Purpose:** Program learning outcomes, read with the program record.
- **Owner / steward:** The college (curriculum office).
- **Grain:** Per program.
- **Refresh:** With each program requirements read.
- **How we procure or connect today:** The same catalog reader as program requirements; the outcomes sit inside the record.
- **Access and terms:** Public catalog pages.
- **Planned improvements:** A separate PLO completeness check; spot-check with the program record.
- **Confidence method:** Limited (no PLO spot-check yet).
- **Evidence in the repo:** `chatbox/supabase_program_requirement_records.sql`, `kb/program_requirements_college/`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `record.program.outcomes` | jsonb array | PLO text inside `program_requirement_records.record` | row key college and control_number |

### Course objectives

- **Group:** Harvested
- **Stage:** Connected
- **Purpose:** Course objectives from the course outline (COR), the second input to outcomes matching and derived descriptions.
- **Owner / steward:** The college (curriculum office).
- **Grain:** Per course outline block.
- **Refresh:** After a college's SLO read lands.
- **How we procure or connect today:** The course-outline reader; `kb/_course_outcomes_load.py` adds them with kind `objective`.
- **Access and terms:** Public outline pages.
- **Planned improvements:** Read objectives in the same pass as SLOs; per-college parser status in `queue.json`.
- **Confidence method:** Limited.
- **Evidence in the repo:** `kb/_course_outcomes_load.py`, `kb/migrations/2026-11-05_course_outcomes_kind.sql`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `course_outcomes` (kind `objective`) | jsonb | Same table and keys as SLOs | college, course_code, fingerprint |

### Course descriptions

- **Group:** Connected
- **Stage:** Connected
- **Purpose:** The catalog description of every course; filled from SLOs and objectives when missing or unreliable (#3219).
- **Owner / steward:** CCCCO (COCI, the Chancellor's Office Curriculum Inventory); each college's curriculum office enters the content. A vendor operates COCI for the CO (*to confirm*).
- **Grain:** One row per COCI course (141,738 rows).
- **Refresh:** A snapshot by hand when a new COCI extract arrives; no schedule.
- **How we procure or connect today:** The COCI course list export saved to `kb/reference/coci_course_list.xlsx`; WestEd holds the current COCI (the partner exchange). The snapshot's date is May 21, 2026, from the committed export itself (its sheet is named "20260521 Course List from MAP C", and the file was created and saved that day). The register's WestEd entry calls our COCI copy July's, which may be another copy; the conflict stays open (*to confirm*).
- **Access and terms:** COCI public search; bulk export from the CO or WestEd.
- **Planned improvements:** A scheduled COCI pull (API *to confirm*); dedupe double-listed institutions; type untyped rows from MIS; derived descriptions with provenance (#3219).
- **Confidence method:** Limited: mechanical checks only; a one-off wrong-course description is not caught yet.
- **Evidence in the repo:** `kb/reference/coci_course_list.xlsx`, `docs/reference/data_sources.md`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `College` | text | COCI college name (some institutions listed twice with " Credit") |  |
| `CourseControlNumber` | text | CCC000nnnnnn | joins MIS `CB_CONTROL_NUMBER` |
| `Subject`, `Course_Number` | text | Course code | join to outcomes |
| `CourseTitle` | text | Title |  |
| `UnitValue` | numeric | Units |  |
| `CreditType`, `Non_Credit_Category` | text | Credit or noncredit funding type (often blank) |  |
| `TopCode`, `CIDNumber`, `CommonCourseNumber` | text | TOP code, C-ID, CCN |  |
| `CatalogDescription` | text | Description; classified ok, thin, empty, placeholder, title copy, very short or copied mismatch (#3219) |  |

### CPL / MAP

- **Group:** Connected
- **Stage:** Scheduled
- **Purpose:** CPL exhibits and articulations each college has adopted in MAP (Mapping Articulated Pathways).
- **Owner / steward:** MAP (RCCD / InfoTech), the system of record for CPL; colleges enter exhibits.
- **Grain:** One row per college and exhibit.
- **Refresh:** Nightly, from the daily MAP pull; the promote fails closed on a short pull.
- **How we procure or connect today:** The daily build fetches the MAP CustomReport with the MAP API key (`scripts/daily_build.sh`, run by `daily-dashboard.yml`); `chatbox/sync_chatbox_exhibits.py` stages it in `stg_chatbox_exhibits`, and `chatbox_exhibits_promote()` replaces `chatbox_exhibits` in one transaction.
- **Access and terms:** Partner sync; exhibit catalog rows only, no student data (student CPL stays in MAP).
- **Planned improvements:** Define the CPL completeness denominator (Sam); match exhibits to COBI courses on every target course.
- **Confidence method:** Partial: MAP is the record; counts are a sync, not a harvest.
- **Evidence in the repo:** `scripts/daily_build.sh`, `.github/workflows/daily-dashboard.yml`, `chatbox/sync_chatbox_exhibits.py`, `kb/migrations/2026-11-12_chatbox_exhibits_refresh.sql`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `college`, `exhibit_title` | text | College and exhibit | PK |
| `exhibit_id` | text | MAP exhibit id (for example MAPCBEA-0-1-001) |  |
| `cpl_type`, `collaborative_type`, `discipline`, `top_code` | text | Classification |  |
| `rec_count`, `sample_credit_recs` | int, text[] | Credit recommendations |  |
| `courses`, `sample_courses` | text[] | Target courses |  |
| `learning_mode` | text | MAP CPL Mode of Learning (the noncredit flag) |  |
| `synced_at` | timestamptz | Last sync |  |

### Catalog source

- **Group:** Harvested
- **Stage:** Scheduled
- **Purpose:** Where each college's catalog, curriculum view and program maps live, and whether we may read them.
- **Owner / steward:** COBI (the registry), describing college-owned sites.
- **Grain:** One row per college; history in `program_source_registry_history`.
- **Refresh:** The program-source census runs weekly (Sundays, 10:29 UTC) and by hand; the scouting files (`kb/harvest_scouting/`) add a wave's reading.
- **How we procure or connect today:** The census workflow writes `program_source_registry` through its definer function; the live export reads whether a catalog link, a curriculum view and a sequence source are held, as counts.
- **Access and terms:** Public pages.
- **Planned improvements:** Flag changed catalog years automatically. The draft's "census on a schedule" is already true: the census runs weekly.
- **Confidence method:** Partial (a census row).
- **Evidence in the repo:** `kb/supabase_program_source_registry.sql`, `kb/_program_source_census.py`, `.github/workflows/program-source-census.yml::cron: '29 10 * * 0'`, `kb/harvest_scouting/`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `college` | text | COCI college name | PK |
| `mis_college_code` | text | MIS college code | joins MIS |
| `catalog_url`, `catalog_year`, `catalog_platform`, `catalog_format` | text | Catalog home and platform |  |
| `cms_public_view` | text | Public curriculum-system URL |  |
| `sequence_source`, `sequence_url` | text | ppm, program_map_page, none_found or unknown |  |
| `access_status`, `access_notes` | text | ok, blocked, robots_disallow, unreachable or not_found |  |
| `census_run_id`, `census_checked_at`, `census_evidence` | text, timestamptz, jsonb | Census provenance |  |
| `corrected_by`, `corrected_at`, `correction_note` | text, timestamptz, text | A person's correction (`corrected_by` names the person; the live export never reads it) |  |

### Program Pathways Mapper (PPM)

- **Group:** Harvested
- **Stage:** Assessed
- **Purpose:** Term-by-term program maps: a second reading of program requirements and course sequence.
- **Owner / steward:** The Foundation for California Community Colleges (host) with Concentric Sky (vendor); each college curates its maps.
- **Grain:** Per program map.
- **Refresh:** By hand per program (4 accepted maps at 3 colleges: Irvine Valley 1, Mt. San Antonio 2, Santa Monica 1).
- **How we procure or connect today:** Read from the colleges' own map pages; mapper hosts answer 403 to automated reading (lesson 33).
- **Access and terms:** No public PPM data API found; the Common Cloud report says PPM's database is being integrated into Common Cloud *(COBIx, 2026-11-13; not verified in the repo)*.
- **Planned improvements:** Ask the Foundation and Concentric Sky for an export or read access (the October 17 note, not recorded as sent); or receive maps through Common Cloud.
- **Confidence method:** Limited.
- **Evidence in the repo:** `kb/program_requirements_pilot/sequences/`, `kb/college_reads/`, `docs/program_requirements_harvest_lessons_archive.md::lesson 33`, `docs/reference/data_sources.md::### PPM, the Program Pathways Mapper`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `sequence_source`, `sequence_url` | text | Registry status and mapper link | college |
| `sequences/<slug>_<control>.json` | json | Accepted term map: terms, courses, read_on | college and program control number |
| `college_reads/*_program_maps.json` | json | Mapper host and read notes |  |

### COMIS / MIS data

- **Group:** Connected
- **Stage:** Connected
- **Purpose:** What each college reports to the Chancellor's Office each term (courses CB, sections XB, students SB, awards SP and more). COBI uses course basics only.
- **Owner / steward:** The CCCCO Management Information Systems (MIS) unit; districts submit through COMIS.
- **Grain:** One row per college, course and term (109,898 Fall 2025 course rows in the committed file; the draft said 109,418).
- **Refresh:** Termly submission by districts; our copy is one Fall 2025 file.
- **How we procure or connect today:** The CB file supplied to the team (`kb/reference/cb_course_basic_fall2025.csv`); Appendix A codes from the MIS Data Element Dictionary (Sam, 2026-08-08; `kb/reference/mis_district_college_codes.json`). Public aggregates: the MIS Data Mart (datamart.cccco.edu).
- **Access and terms:** Course data is not student data; student-level files (SB, SX) need an agreement and fall under the student-detail ADR. COBI takes course elements only.
- **Planned improvements:** A scheduled termly CB pull; add XB sections for "offered now"; Common Cloud's real-time feed could replace the lag (the MIS and 320 go/no-go at the end of FY 2026-27, *(COBIx, 2026-11-13; not verified in the repo)*).
- **Confidence method:** Partial: an authoritative CO file, joined by control number (72.7% of COCI rows match a Fall 2025 CB row, since COCI includes courses not offered that term; *(COBIx, 2026-11-13; not verified in the repo)*).
- **Evidence in the repo:** `kb/reference/cb_course_basic_fall2025.csv`, `kb/reference/mis_district_college_codes.json`, `docs/reference/data_sources.md::### MIS`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `CB_COLLEGE_ID` | char(3) | MIS college code (Appendix A) | joins `mis_district_college_codes.json` |
| `CB_TERM_ID` | char(3) | Term (257 = Fall 2025) |  |
| `CB_CONTROL_NUMBER` | text | COCI course control number | joins COCI `CourseControlNumber` |
| `CB_COURSE_ID`, `CB_TITLE` | text | Course code and abbreviated title (never join on titles) |  |
| `CB_TOP_CODE` | char(6) | TOP code |  |
| `CB_CREDIT_STATUS` | char(1) | D degree-applicable credit, C non-degree-applicable credit, N noncredit |  |
| `CB_TRANSFER_STATUS` | char(1) | A = UC and CSU, B = CSU, C = not transferable |  |
| `CB_UNITS_MAXIMUM`, `CB_UNITS_MINIMUM` | numeric | Units |  |
| `CB_NONCREDIT_CATEGORY`, `CB_FUNDING_CATEGORY` | char(1) | Noncredit category, funding |  |
| `CB_PROGRAM_STATUS` | char(1) | 1 = part of a program, 2 = standalone |  |
| `CB_SAM_CODE`, `CB_BASIC_SKILLS_STATUS`, `CB_GENERAL_EDUCATION_STATUS` and others | char(1) | Other CB elements per the MIS Data Element Dictionary |  |

### COE labor market data

- **Group:** Connected
- **Stage:** Connected
- **Purpose:** Regional occupational demand aligned to each college's programs, to show which CPL opportunities serve local jobs.
- **Owner / steward:** The Centers of Excellence for Labor Market Research (COE, coeccc.net), funded by the CCCCO; the underlying data comes from Lightcast, BLS and EDD, and CO MIS supply.
- **Grain:** Region and occupation (9 regions, 4,869 rows); a cross per college and occupation.
- **Refresh:** COE publishes annually (its lookup now shows 2025-2030 *(COBIx, 2026-11-13; not verified in the repo)*); our file is 2024-2029, supplied September 16, 2026; the cross was built September 30, 2026.
- **How we procure or connect today:** The COE "Lookup: Occupational Demand" export, supplied by the team, in `kb/reference/coe_occupation_demand_2024_2029.json`; `kb/_build_regional_cpl_opportunity.py` writes `kb/regional_cpl_out/2026-09-30-*/crosswalk.json`.
- **Access and terms:** Public COE data tools; reuse terms *to confirm* (Lightcast-licensed fields may restrict redistribution).
- **Planned improvements:** Refresh to 2025-2030; add COE supply by TOP; use COE's TOP-CIP-SOC crosswalk; per-college matches reviewed by a person.
- **Confidence method:** Limited: matcher candidates, not confirmed.
- **Evidence in the repo:** `kb/reference/coe_occupation_demand_2024_2029.json`, `kb/_build_regional_cpl_opportunity.py`, `kb/regional_cpl_out/`, `kb/reference/swp_region_roster.json`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `region_code`, `region` | text | One of 9 COE (Strong Workforce) regions | joins `swp_region_roster.json` |
| `soc`, `title` | text | SOC occupation code and title | joins programs through a TOP-CIP-SOC crosswalk |
| `education` | text | Typical entry education |  |
| `jobs_2024`, `pct_change`, `annual_openings` | numeric | Demand 2024-2029 |  |
| `median_hourly`, `median_annual` | numeric | Wages |  |
| `per_college: adopt_now, already, build, n_programs` | int | Our regional cross per college | college |

### ASSIST articulation

- **Group:** Planned
- **Stage:** Assessed
- **Purpose:** Course-to-course articulation to UC and CSU, plus UC and CSU transferability and GE lists; a second signal for common courses and the CSU-transferable flag in program requirements.
- **Owner / steward:** ASSIST (intersegmental; governed by EMOC and TAC, hosted with the UC Office of the President, *to confirm*). Articulation officers enter agreements.
- **Grain:** Course, receiving institution and year (agreements); course and list (transferability).
- **Refresh:** Agreements publish yearly; transferability lists update by term (*to confirm*).
- **How we procure or connect today:** Not yet. Three committed program records quote assist.org text (the draft counted 7 records, likely in the live table); the C-ID approvals (28,070, `kb/reference/cid_articulations.json`) are a related but different source.
- **Access and terms:** The API needs an API key from ASSIST (institutional requestors first; public access expected in 2026-27 *(COBIx, 2026-11-13; not verified in the repo)*); the Terms of Use and EULA govern reuse.
- **Planned improvements:** Request an institutional key through a sponsoring college or the CO; start with transferability extracts; read a sample to measure the second-signal yield.
- **Confidence method:** Not connected.
- **Evidence in the repo:** `kb/reference/cid_articulations.json`, `docs/reference/data_sources.md::### ASSIST`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `Institution-Code`, `Course-Prefix`, `Course-Number`, `Beginning-Term` | text | Course identity in extract files (tilde-delimited) | join to COCI subject and number |
| UC and CSU transferable course lists | extract | Transferability by course |  |
| IGETC, Cal-GETC and CSU-GE applicable lists | extract | GE applicability |  |
| `publishedAgreementId` | GUID | Agreement id (API) |  |
| `publishedArticulations` | json | Articulations on an agreement (API) |  |

### Common Cloud Data Platform

- **Group:** Planned
- **Stage:** Assessed
- **Purpose:** The CCCCO's shared real-time data lake: enrollment from districts, with planned integrations for program mapping, articulation and CPL data.
- **Owner / steward:** The CCCCO AI Strategy and Digital Transformation Division; build partners Ellucian and Invoke Learning; districts supply data.
- **Grain:** *To confirm* (student, section, term).
- **Refresh:** About every 5 minutes for onboarded colleges (the report).
- **How we procure or connect today:** Not yet. 23 colleges onboarded (the CCCCO Common Cloud legislative report under AB 102, January 28, 2026); the report does not list which *(COBIx, 2026-11-13; not verified in the repo)*.
- **Access and terms:** District participation agreements; role-based access; APIs and onboarding guides are outputs due through FY 2027-28. Any COBI use would be course- and program-level, never student-level.
- **Planned improvements:** Ask the division whether COBI or MAP can be an integration under Deliverable 4 (articulation and CPL data are named success measures); follow the Amicus Consilii synthesis.
- **Confidence method:** Not connected.
- **Evidence in the repo:** `docs/reference/data_sources.md::### Common Cloud Data Platform`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| Real-time enrollment | *to confirm* | Sections and enrollments refreshed about every 5 minutes | college, district |
| Lakes (Figure 4) | - | Ellucian institution and Aggregated Insights lakes; the Unified Invoke lake and the institution InvokeClarity lakes; sources Banner, Colleague, DegreeWorks, PeopleSoft, third-party data, existing MIS and 320 files | the four lake entries below |
| MIS and 320 files | *to confirm* | Generated through the MIS regulatory manager (not fully delivered) |  |
| PPM database | *to confirm* | Program maps being integrated |  |
| Documented APIs, data contracts, critical data element catalog | *to confirm* | Deliverables 1, 4 and 5 |  |

### CCCStart (formerly CCCApply): student ID and info layer

- **Group:** Planned
- **Stage:** Found
- **Purpose:** The target student ID and info layer for CPL records in MAP, pulled directly from a CCCStart API, replacing today's paths: parsing the student from the JST, importing from Credit for Being You, manual entry and batch upload. Also the application metadata: field definitions, the military JST opt-in, supplemental questions, each college's cutover date. A priority API (Sam, 2026-11-13).
- **Owner / steward:** CCCCO (the Reimagine Apply initiative); operated by the CCC Technology Center (steward *to confirm*). Students own their application data; each college is the FERPA custodian of its student records.
- **Grain:** Per student application (the student layer, in MAP); per field (metadata); per college (cutover).
- **Refresh:** Event-driven on application submit (the target); waves July 2026 to June 2027; CCCApply off after July 1, 2027 *(COBIx, 2026-11-13; not verified in the repo)*.
- **How we procure or connect today:** Not yet. Today's student-ID paths into MAP: JST parsing, Credit for Being You import, manual entry by college staff, batch upload. The API would remove re-keying, JST parse errors, duplicate or inconsistent MAP Student IDs, and batch lag.
- **Access and terms:** Student data: FERPA; a data-sharing agreement with the CO and colleges; consent (the student's CCCStart authorization); least-privilege fields; role-based access; audit logging. Student-level records land in MAP, never COBI (Sam, 2026-11-08); COBI shows only connection status and counts.
- **Planned improvements:** Ask the CO and the Technology Center for a CCCStart API or event feed for MAP (ID match, the military and JST opt-in); confirm the steward; get the CCCStart data dictionary; record each college's cutover date.
- **Confidence method:** Not connected.
- **Evidence in the repo:** `docs/reference/data_sources.md::### CCCStart`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| Student identifier (CCCID, OpenCCC ID) | *to confirm* | Systemwide student ID from the OpenCCC account | joins the MAP student record; never stored in COBI |
| Name, date of birth, contact | *to confirm* | Identity fields, the least-privilege subset only | match key in MAP |
| College applied to, term, application date | *to confirm* | Which college's record to attach |  |
| Military status and JST authorization opt-in | flag | Military-connected applicants authorize JST ordering (CCCApply Standard Application Data Dictionary, page 164) |  |
| Approved Supplemental Question List | *to confirm* | Questions colleges may add (pending release) |  |
| College cutover wave and date | date | When a college moved to CCCStart (CCSF September 22, Fullerton September 30, 2026, *(COBIx, 2026-11-13; not verified in the repo)*) | college |

### JST authorizations

- **Group:** Planned
- **Stage:** Asked
- **Purpose:** Find every military-connected student who authorized the college to request their Joint Services Transcript, request it, receive it, and apply CPL, so veterans get credit for their ACE recommendations. Colleges often do not know the option exists or where the list is. A priority API (Sam, 2026-11-13).
- **Owner / steward:** The field: CCCCO (CCCApply and CCCStart, operated by the CCC Technology Center; CCCStart steward *to confirm*). The transcript: the U.S. Department of Defense JST office (jst.doded.mil). The records: the college (FERPA custodian); CPL decisions in MAP.
- **Grain:** Per student (in the college SIS and MAP only); COBI shows per-college counts only.
- **Refresh:** The target: event-driven on application submit; counts nightly.
- **How we procure or connect today:** By hand: staff must know the field exists, run a CCCApply Report Center report (or query the SIS staging table) for opt-in = T, request each JST through the JST site (institutional request mechanics *to confirm*), wait for the transcript; then an evaluator reviews it for ACE recommendations and faculty decide CPL in MAP. Many colleges never pull the list. In June 2026 the CPL Initiative asked RAD for the opted-in students; the request now waits on the CO General Counsel's procedural OK (the register's JST entry).
- **Access and terms:** Student data: FERPA; the student's authorization governs the JST request; a data-sharing agreement for any feed; least-privilege fields (ID, college, opt-in, military status); role-based access; an audit log. Student-level records go to MAP, never COBI.
- **Planned improvements:** The top ask: an authorized-student feed per college from CCCStart, then a system-level JST request and receipt path into MAP per college, then an evaluator queue; publish a one-page "where to find your list" guide for colleges; add CCCStart's field here once it is published.
- **Confidence method:** Not connected. The field name `military_jst_optin` is from the public CCCApply v6.21 and SuperGlue v5.2.2 release notes *(COBIx, 2026-11-13; not verified in the repo)*; the CCCStart field is *to confirm*.
- **Evidence in the repo:** `docs/reference/data_sources.md::### Joint Services Transcripts through jst.mil`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| `military_jst_optin` | string(1), T or F, nullable | CCCApply field: T = the student allows the college to obtain their JST, F = does not. Shown only to Active Duty, Veteran, Active Reserve and National Guard applicants (CCCApply v6.21, August 7, 2025, requested by MAP with the CO) | student application; delivered through the SuperGlue 5.2.2 College Adaptor |
| `SZRAPLY.MILITARY_JST_OPTIN` (Banner), `XCTC.MILITARY.JST.OPTIN` (Colleague) | string(1) | Where the field lands in SIS staging | student |
| CCCStart equivalent field | *to confirm* | Name and delivery path in CCCStart, not yet published |  |
| Per-college metric: authorized students | count | Students with opt-in = T | college and term |
| JSTs requested, received | count | Requests sent to the JST office and transcripts received | college and term |
| CPL applied | count | Students with JST-based CPL posted (from MAP) | college and term |

### Ellucian Insights Data Lake (institution)

- **Group:** Planned
- **Stage:** Found
- **Purpose:** Each district's own lake on the Ellucian track: SIS and degree-audit data (Banner, Colleague, DegreeWorks) plus third-party data; feeds Insights Reporting and the district dashboard.
- **Owner / steward:** The district (data owner); built by Ellucian for the Common Cloud (the CCCCO AI Strategy and Digital Transformation Division).
- **Grain:** *To confirm*.
- **Refresh:** Near real time for onboarded districts (the report: about every 5 minutes).
- **How we procure or connect today:** Not yet.
- **Access and terms:** A district participation agreement; role-based access. COBI would ask only for course, section and program-level data, never student records.
- **Planned improvements:** Ask whether a course, section and program view (offered now, enrollment counts, DegreeWorks program requirement rules) can be shared to COBI per district.
- **Confidence method:** Not connected. A college's track is inferred from its SIS (Banner or Colleague to Ellucian), *to confirm*.
- **Evidence in the repo:** `docs/reference/data_sources.md::### Common Cloud: the Ellucian Insights lake`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| Banner, Colleague and DegreeWorks extracts | *to confirm* | Student, section, enrollment and degree-audit data | district and section (*to confirm*) |
| Third-party data (E) | *to confirm* | Other campus tools |  |
| MIS and 320 file generation | *to confirm* | Generate MIS and 320 files if needed; not fully delivered (Figure 5) |  |

### Ellucian Aggregated Insights Data Lake

- **Group:** Planned
- **Stage:** Found
- **Purpose:** Aggregates the Ellucian-track institution lakes and feeds the Unified Invoke Data Lake.
- **Owner / steward:** CCCCO (Common Cloud); built by Ellucian.
- **Grain:** *To confirm*.
- **Refresh:** *To confirm*.
- **How we procure or connect today:** Not yet.
- **Access and terms:** Through the Common Cloud team.
- **Planned improvements:** Prefer the unified lake for statewide reads; use this one only if the unified lake lacks Ellucian-track fields.
- **Confidence method:** Not connected.
- **Evidence in the repo:** `docs/reference/data_sources.md::### Common Cloud: the Ellucian Aggregated Insights lake`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| Aggregated institution data | *to confirm* | Cross-district Ellucian-track data | *to confirm* |

### Unified Invoke Data Lake (statewide)

- **Group:** Planned
- **Stage:** Found
- **Purpose:** The statewide lake that combines both tracks; powers the Chancellor's Office Unified Analytics, the Chancellor's Dashboard (real-time enrollment by region, program, demographics, services).
- **Owner / steward:** The CCCCO AI Strategy and Digital Transformation Division; built by Invoke Learning.
- **Grain:** *To confirm* (program and term aggregates on the dashboard).
- **Refresh:** About every 5 minutes (the report).
- **How we procure or connect today:** Not yet. The Chancellor's Dashboard is complete for the initial cohort (23 colleges onboarded) *(COBIx, 2026-11-13; not verified in the repo)*.
- **Access and terms:** CCCCO role-based access; data contracts per Deliverable 4. The natural place to connect COBI and MAP (program mapping, articulation and CPL data are named success measures).
- **Planned improvements:** Propose COBI's program requirements, course descriptions, CPL exhibits and PPM maps as an inbound integration; take program-level enrollment back for the completion view.
- **Confidence method:** Not connected.
- **Evidence in the repo:** `docs/reference/data_sources.md::### Common Cloud: the Unified Invoke lake`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| Real-time enrollment | *to confirm* | Enrollment trends; disaggregation by region, program, demographics, services | college, program, term |
| Documented APIs and data onboarding guides | *to confirm* | Deliverable 1 outputs (through FY 2027-28) |  |
| Critical data element catalog | *to confirm* | Deliverable 5 output |  |

### InvokeClarity Data Lake (institution)

- **Group:** Planned
- **Stage:** Found
- **Purpose:** Each district's own lake on the Invoke track: Oracle PeopleSoft data, third-party data, and existing MIS and 320 files; feeds the district dashboard.
- **Owner / steward:** The district (data owner); built by Invoke Learning for the Common Cloud.
- **Grain:** *To confirm*.
- **Refresh:** Near real time for onboarded districts (*to confirm*).
- **How we procure or connect today:** Not yet.
- **Access and terms:** A district participation agreement; role-based access; course and program level only for COBI.
- **Planned improvements:** Pilot with LACCD (PeopleSoft, #3198) for sections offered now and program enrollment.
- **Confidence method:** Not connected. A college's track is inferred from its SIS (PeopleSoft to Invoke), *to confirm*.
- **Evidence in the repo:** `docs/reference/data_sources.md::### Common Cloud: the InvokeClarity lake`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| PeopleSoft extracts | *to confirm* | Student, section, enrollment data | district (*to confirm*) |
| Existing MIS and 320 files | files | Loaded as history |  |
| Third-party data (I) | *to confirm* | Other campus tools |  |

### CVC offerings

- **Group:** Planned
- **Stage:** Assessed
- **Purpose:** Which courses run online, and the exchange's course equivalencies.
- **Owner / steward:** The California Virtual Campus (Foothill-De Anza CCD, *to confirm*).
- **Grain:** Course and term.
- **Refresh:** *To confirm*.
- **How we procure or connect today:** Not yet; parked (#3217).
- **Access and terms:** No public offerings feed found.
- **Planned improvements:** Sam raises a feed with CVC leadership.
- **Confidence method:** Not connected.
- **Evidence in the repo:** `docs/reference/data_sources.md::### CVC, the California Virtual Campus`.

| Field | Type | Definition | Key / join |
|---|---|---|---|
| Course offered online, term | *to confirm* | From the CVC exchange | college and course |

## API connection checklist

One row per API. Status is one of connected, in progress, planned or not needed, and changes only with a record in
the repo (a run, a key, a meeting note); the builder reads a row whose Evidence is missing as `unverified`, never
`connected`. Per college (the dashboard's college panel, a later slice): SIS, curriculum system, catalog, MAP and PPM,
each with needed (yes, no or unknown, with why), its status, and what the API would remove. Unknown stays unknown.

| API | Holder | Needed | Status | Priority | Evidence | Note |
|---|---|---|---|---|---|---|
| MAP CustomReport API | MAP (RCCD / InfoTech) | yes | connected |  | `scripts/daily_build.sh::Fetch CustomReport from MAP API` `.github/workflows/daily-dashboard.yml` `chatbox/sync_chatbox_exhibits.py` | The daily pull with the MAP API key; feeds `chatbox_exhibits` nightly. |
| JST authorization feed and the JST request and receipt path | CCCCO and the CCC Technology Center (feed); the DoD JST office (transcripts) | yes | planned | priority | `docs/reference/data_sources.md::### Joint Services Transcripts through jst.mil` | With CCCStart: authorized students per college (`military_jst_optin` = T), JSTs requested and received, loaded to MAP. Waits on the CO General Counsel. |
| CCCStart API: student ID and info layer (for MAP) | CCCCO Reimagine Apply; the CCC Technology Center operates (steward to confirm) | yes | planned | priority | `docs/reference/data_sources.md::### CCCStart` | Replaces JST parsing, Credit for Being You import, manual entry and batch upload; FERPA, a data-sharing agreement, consent and least-privilege fields; lands in MAP, never COBI. |
| COCI course and program export | CCCCO (COCI) | yes | planned |  | `kb/reference/coci_course_list.xlsx` `docs/reference/data_sources.md::### WestEd` | Today a hand-saved snapshot; WestEd holds the current copy. |
| COMIS / MIS course and section files (CB, XB) | CCCCO MIS unit | yes | planned |  | `kb/reference/cb_course_basic_fall2025.csv` `docs/reference/data_sources.md::### MIS` | Today one Fall 2025 CB file; course level only. |
| Common Cloud: Unified Invoke Data Lake | CCCCO AI Strategy and Digital Transformation; Invoke Learning | yes | planned |  | `docs/reference/data_sources.md::### Common Cloud: the Unified Invoke lake` | Documented APIs are a Deliverable 1 output through FY 2027-28. |
| Common Cloud: Ellucian Insights lake (district) | Districts; Ellucian | yes | planned |  | `docs/reference/data_sources.md::### Common Cloud: the Ellucian Insights lake` | Banner, Colleague and DegreeWorks districts. |
| Common Cloud: Ellucian Aggregated Insights lake | CCCCO; Ellucian | yes | planned |  | `docs/reference/data_sources.md::### Common Cloud: the Ellucian Aggregated Insights lake` | Feeds the unified lake. |
| Common Cloud: InvokeClarity lake (district) | Districts; Invoke Learning | yes | planned |  | `docs/reference/data_sources.md::### Common Cloud: the InvokeClarity lake` | PeopleSoft districts (an LACCD pilot candidate, #3198). |
| ASSIST API | ASSIST (intersegmental) | yes | planned |  | `docs/reference/data_sources.md::### ASSIST` | An institutional API key is needed; not requested yet. |
| Program Pathways Mapper export or API | The Foundation for CCC; Concentric Sky | yes | planned |  | `docs/reference/data_sources.md::### PPM, the Program Pathways Mapper` | Access note drafted October 17, 2026; not recorded as sent. Mapper hosts refuse automated reading. |
| CVC offerings and exchange feed | California Virtual Campus | yes | planned |  | `docs/reference/data_sources.md::### CVC, the California Virtual Campus` | Parked (#3217). |
| COE labor market data export | Centers of Excellence | yes | planned |  | `kb/reference/coe_occupation_demand_2024_2029.json` `docs/reference/data_sources.md::### COE labor market data` | Today a hand export (2024-2029); COE now shows 2025-2030. |
| Curriculum system APIs (eLumen, CurriQunet/Meta, Coursedog) | Colleges; vendors | yes | planned |  |  | Would replace outline page reading and sign-in walls for course outlines, SLOs and objectives. No plan is recorded in the repo yet. |
| Catalog platform APIs (CourseLeaf, Acalog, others) | Colleges; vendors | yes | planned |  |  | Today public catalog pages are read; an API helps where pages block readers or catalogs are PDFs. No plan is recorded in the repo yet. |
