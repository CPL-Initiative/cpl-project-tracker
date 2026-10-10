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

Sessions S320-S326 (Phase 0, the census, the pilot's first records, the addenda table) are in
[`program_requirements_harvest_lessons_archive.md`](program_requirements_harvest_lessons_archive.md), moved verbatim.

## S327 SkyAmend, 2026-10-04: one build for the page and Sierra, CSU LA counted, outcomes, and the Ironworker proof

**What shipped.** `kb/_build_roep_display.py` writes each checked program's display facts once, under one build stamp, to `cpl_pathways_roep_data.js` and `program_requirement_records.display`; Sierra quotes them (PR CPL-Initiative/cpl-project-tracker#1854). All 20 rows live at build `bbbbfb611f15`, each row's md5 matching the receipt.

**Lessons.**
1. **One build, two readers, or two answers.** The page and Sierra read two outputs of one run, and the guard holds them byte-equal and recomputes the figure from the page's own data. A mutation of one figure fails three checks. A session that let Sierra compute "up to" herself would have shipped a second answer.
2. **The connector holds a bare UPDATE and writes nothing** (two 60 s timeouts, one of them a single 3.5 KB row). The load's form passes: an `insert ... select` of the row being updated, `on conflict ... do update set display = excluded.display`. Selecting the row means the statement can never add a program. About 40 KB is the most one migration carried; 104 KB went in five parts and a restamp.
3. **Prove the table holds the build with a fingerprint.** `--verify-sql` computes `md5(display::text)` in Python (jsonb prints keys shortest first, then bytewise, with `, ` and `: `), and one read-only query says match, differs or missing per row.
4. **A course key has three spellings.** `IWAP 40.5` / `40.50` (lesson 23), Riverside's `ADJ-1` against MAP's `ADJ 1`, and West LA's `ANATOMY 001` against the state file's `ANATOMY 1`. Without the last, 16 West LA courses lost their title and identity. `ck()` reads a hyphen as a space and drops leading zeros, keeping a zero after the decimal point.
5. **A cross-disciplinary identity makes false leads.** `WEXP M1001` (Work Experience Education, one outline under 717 subjects) offered "Police Work Experience" as a lead for Cerritos's community health worker work experience. The minted record's `cross_disciplinary` flag now stops could-adopt across it.
6. **"For consideration" reads zero on the pilot, for two measured reasons.** None of the 384 CER titles without an articulation, and none of the 1,165 IT/AI catalog credentials, names a course identity. The 24 statewide C-ID recommendations share no C-ID with the pilot's 27, and Riverside's AJ courses carry no C-ID in our data at all. Sam's answer (18:03Z) widens the source: compare harvested credential skills with course outcomes.
7. **The capture already holds outcomes.** 13 of 20 captured pilot pages print program or student learning outcomes (Cerritos, Riverside, West LA all four; Mt. SAC one; Miramar none).
8. **MAP data shows through, as it should.** Miramar's AUTO 156G carries an EMT Certification and a Driver Operator 1B articulation in MAP's own feed. The display reports MAP. Raising it with the college is a CPL clean-up item.
9. **Two different questions both start "who counts CSU LA".** Participation (MAP's 116) and the system (California's community colleges) need two counts named for what they count. Nothing in the pipeline errors on an unresolved name, so a wrong sentence is the only signal (sheet 33 cards 1-2).

**Moved from the lane (S327 compaction), verbatim.**

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

**The proof of concept: Cerritos Ironworker, high school to career (Sam, 18:23Z, vault braindump 18:23).** The rungs: HS dual enrollment and CTE articulation (Cx), noncredit, adult ed and ROP; Cerritos certificates and stackable ones; the A.S.; the B.S.; internships and employment. Researched S327 (VERIFIED in our data unless marked LEAD, a search snippet; the proxy blocks cerritos.edu, DIR and the union sites): Certificates 36002 Reinforcing (34 units) and 36003 Structural (38) are each one complete A.S. major option; the A.S.'s 31.5 CPL units are all credit by exam on the core and the Reinforcing option (the Structural option and IWAP 40.10 carry none); the hand-built map's *27-29 major units* is stale against the 2026-27 catalog's 34-38. Entry: noncredit Pre-Apprenticeship 24102 (AED 36.02-36.04, 80.01; LEAD: apprentices only), AED 36.05 basic welding, 26 noncredit AED 40.01-41.10 copies of the IWAP courses with no CPL link (Santa Ana's MAPCXN exhibit is the model), OSHA-10 (AED 90.05); LEAD: Downey USD's Columbus HS welding pathway into WELD 100 through CCAP; MC3 is articulated at Laney and Cabrillo only. MAP holds no high school, ROP, adult school or noncredit CPL for Cerritos. B.S.: LEAD, approved by the CO February 2026 (EdSource), not in COCI; course list, admission rule and first cohort unconfirmed. Apprenticeship: LEAD, Local 433 JATC (48 months) and Local 416; related-instruction hours conflict (480 vs 700+). Career (COE 2024-29): structural iron 47-2221 $35-37/hr median, LA 130 and OC 80 openings a year; first-line supervisors 47-1011 $43-48/hr, 1,810 openings a year across LA and OC. **NEEDS SAM** (sheet 33 card 5): who at Cerritos confirms the B.S., the high school list, the noncredit courses and the hours.

**The S327 research behind the proof of concept** (two agents, read-only; the proxy blocked cerritos.edu, DIR, regionalcte.org and the union sites, so web facts are search snippets marked LEAD):
- Upper rungs. VERIFIED (COCI load 20260716): 36002 and 36003 nest exactly in the A.S. LEAD (EdSource, 2026-02-20): the CO approved the B.S. in February 2026 under AB 927. Cerritos's 2026 State of the College calls it the college's second bachelor's degree. LEAD (regionalcte.org): upper-division topic areas only, a GE gate, online delivery. The admission rule (A.S. or GE only) and the fall 2027 start are unconfirmed. LEAD (DIR snippet): Local 433 JATC, 48 months, $19.50/hr start, La Palma training center; Local 416 JATC in Norwalk. VERIFIED: COE 2024-29 occupation demand, `kb/reference/coe_occupation_demand_2024_2029.json`.
- Entry rungs. VERIFIED: Pre-Apprenticeship 24102 (AED 36.02-36.04, 80.01); AED 36.05 basic welding; 26 AED 40.01-41.10 noncredit copies of the IWAP courses; OSHA-10 in AED 90.05 and ELAP 90.22; HSE and GED preparation; no Cerritos high school, ROP or adult school CPL in MAP; MC3 articulated at Laney and Cabrillo. LEAD: Downey USD Columbus HS welding through CCAP (WELD 100, and WELD 60, likely now WELD 160); Norwalk-La Mirada Adult School welding; Southeast ROP welding; LAUSD Harbor and LBCC MC3. Next: a human browser pull of Cerritos's EPP articulation list, the Pre-Apprenticeship catalog page and `2026_Welding_Roadmap_ua.pdf`.

## S328 SkyLadder, 2026-10-04: sheets 33-34 carried out, the statement applied, the ladder on CPL Pathways

- **#1854 shipped.** A/B 37225759463 clean (preview all modes OK; 7l and the CPL-figure mode fixed), deploy 37227471803, production smoke 37227589712 ALL MODES OK including 7t.
- **Sheets 33 and 34 answered in one evening** (#1855). The statement Sam confirmed, with two edits: *The CPL Initiative serves California's 116 community colleges, two noncredit campuses, and partner programs such as LAUNCH and Futuro Health. Cal State LA is the first CSU campus on MAP. Adult education, ROP and not-for-credit programs join later.* "Datasets", never "scrape", in reader-facing text.
- **One list, four readers** (#1856): `kb/non_ccc_institutions.json` feeds the funding model, the Active Colleges card, Sierra (a copy held equal by test) and, by copy, the KB letter tool (CPL-Initiative/cpl-knowledge-base#25). MAP's 116 and the system's 116 are two sets that share a number; a count read straight from MAP's datasets would call a CSU campus a community college the day it turned active.
- **The ladder port** (#1857): a step map of buttons, never `#hash` links, because the dashboard routes tabs on `location.hash`; derived steps read the display build, so the page and Sierra cannot disagree.
- **A/B 37229352499: 7c regressed** (the quick-list table must start in the first 1,800 characters). It failed the same way on 2026-10-03 with no related change. The run's artifact cannot be downloaded from the sandbox (egress policy), so the prose could not be read; one re-run judges it. Deploy only on a grid with no regressions.
- **Moved here from the lane (budget):**
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

## S329 SkyRunner, 2026-10-04: three runner reads at Cerritos, the procedure record, scheduled sessions

- **Sierra's statement shipped.** A/B 37230411476 clean (production itself failed 7c with no change, so the S328 7c regression was flake). Run 37231799184 deployed it at 20:21Z; a second session working the same handoff, this one, redeployed the same code at 20:27Z (37232150199). Smoke 37231826035 ALL MODES OK, 7u included. Sam closed the other session; one session at a time is now written rule for scheduled sessions.
- **The college page read** (`kb/_college_page_read.py`, `college-page-read.yml`, #1858): a plan names a college's pages and the line each answers; the census's Reader loads them from a runner; the job log carries the text. Three fixes came from reading its own output. (1) The GitHub MCP returns at most 5,000 log lines; read 1 printed 5,826 and lost the Field Ironwork page, so the reader now takes a page's main region and folds runs of short lines (read 2: 15 pages in 1,752 lines). (2) Excerpt slots fill in page order, so a broad keyword ("high school") spent all 24 on the AED page before AED 40-41; read 3 narrowed the plan's keywords. (3) Some answers sit behind a form (Schedule+) or off the college's domain (Statewide Career Pathways): the reader prints a page's forms and its matching links on any host, without following them. A push reads only the plans its last commit adds or changes.
- **What Cerritos's own pages settled.** Classroom hours: the 2026-27 IWAP course descriptions give each course's contact hours, so the Reinforcing track's 16 courses carry 878 (622 lecture, 256 laboratory) and the Structural track's 898 (677 and 221); the "480 or 700+" conflict came from secondary sources. The apprenticeship runs four years. The B.S.: Cerritos's Field Ironwork page opens it to graduates in Spring 2027 (the B.S. map said Fall 2027); the regional consortium's record (recommended June 2024) holds the proposed list, 23 courses and 60 units, IWAP 301-310 and 401-410 with COMM 320, PSYC 210 and PSYCH 410, and a GE-pattern admission rule after two years of prerequisites; its course table renders only in a browser, which is why S327's agents saw topic areas. Noncredit: all 26 AED 40.01-41.10 are in the catalog; the Pre-Apprenticeship certificate (188 hours) admits registered apprentices only. High school: WELD 60 is now WELD 160; Downey Unified's June 2023 board presentation maps Columbus High's welding pathway to WELD 160 and WELD 100. `hsarticulation.cerritos.edu` has no DNS record.
- **Still To confirm:** whether the approved B.S. keeps the 2024 list; the AED courses' sections this term (Schedule+: POST `/schedule/courses.cgi`, Terms 1269 and 1273, Depts AED and IWAP); how high school credit is granted (Cerritos publishes its agreements through Statewide Career Pathways).
- **The procedure record.** Sam: "apply the procedure record". The migration (three columns and the history trigger) landed; Cerritos's guarded UPDATE timed out twice at the connector with nothing written, as S327 found for a bare UPDATE. Sheet 35 carries it to paste. The record names hosts and offices only, since anon reads the registry.
- **Scheduled sessions.** Sam asked for sessions that start the next one; the permission check refused that twice ("Create Unsafe Agents"), so Sam created a routine himself (`docs/reference/scheduled_sessions.md`). An authorization written in a handoff or a sheet did not carry into the permission check three times this run; Sam's words in session cleared the two that a person may clear.

## S330 SkyRoutine, 2026-10-04: the form step, Cerritos reads 4 and 5, Statewide Career Pathways gone

- **The reader submits a form** (#1859). A plan's page may name `submit`: the form by the end of its action, the fields to set (each name maps to the values left checked or selected; other boxes of that name clear), and a pattern for the submit button. robots.txt for the action first, then the census delay; the log prints the fields sent, the button and every button on the form. A local Chromium mock passed it, and the first real read still matched nothing: the mock had a *Search Classes* button and Schedule+ has none. Its only submits are `ViewDepartments` (twice) and `ViewDivisions`, so the plan's guessed pattern fell through to no submitter and the CGI answered "No classes matched your criteria." Read 5 named `^ViewDepartments$`. **Do not guess a button's words: the first read prints them, and the next plan names one.** The mock proved the mechanism and could not prove the site.
- **Schedule+ (read 5, Closed/Open/Wait List).** Fall 2026: 22 IWAP courses (IWAP 40.05 through 41.08); no AED 40.01-41.10 and none of the Pre-Apprenticeship certificate's AED 36.02-36.04 or 80.01; AED 90.05 OSHA-10 runs. Spring 2027: AED sections, no IWAP yet. The Start Months boxes default to Fall's; the Spring spec clears them.
- **Statewide Career Pathways is gone.** `statewidepathways.org`, where Cerritos's Technology page says its agreements are public, redirects over https and http to a domain-for-sale page (read 4). Web search still returns its old http addresses. The procedure record marks it `gone`, which the reader now skips beside refused and unreached. Any college that names the site as its public list points at the same dead address; worth a check when the harvest widens.
- **The high school route, from Cerritos's own documents.** The 2026-27 catalog's EPP page: Credit by Exam for an articulated high school, ROP or adult school course, residency waived; CCAP dual enrollment is the other route. The petition: the Cerritos application, the agreement's requirements, filed with EPP within two years, up to 30 units, and a link back to the EPP page for the agreements. The list itself has no public source, so sheet 36 card 2 carries a drafted request (Sam's rule, sheet 33 card 5: draft only after the agent is exhausted). AP 4050 answers 404.
- **The Chancellor's Office lists the B.S.** among approved programs, *Field Ironworker Supervision (coming soon)*; read from the session container, which reaches cccco.edu but not cerritos.edu.
- **The procedure record, version 2.** The connector held the guarded UPDATE again (60 s, nothing written, read back); sheet 36 card 1 carries it to paste, guarded on version 1's md5 so a later edit is never overwritten.
- **The Ironworker film, draft v1** (`prototype/ironworker_video/`): the funding film's engine forked, nine scenes, only *In our data* lines. Fable advised on the storyboard (the scheduled-session doc's rule for a judgment with nothing to score against); the advice and the four places it was corrected against our data are in the film's README. The lesson worth keeping: **an advisor working from a fact list still asserts what the list does not say.** Fable joined Columbus High's mapping to Cerritos's Credit by Exam route ("Credit by Exam, B or better: 3.5 units") and called 34-38 units "nearly a whole degree"; each reads naturally and each states something the ladder marks To confirm or does not hold. Check every on-screen line against its ladder line, not against the brief.
- **Read 6 and the write function.** The Internet Archive holds no capture of `hsarticulation.cerritos.edu` but kept Statewide Career Pathways: a 2016 capture links `showagreements.php`, and 2014-2015 captures hold agreement lists by template; after 2021 the domain served a gambling site, so a capture's date decides whether it counts. With Sam's connector tools all on Always allow, a bare UPDATE still waited 60 s and wrote nothing (the hold sits with Supabase's server), so Sam approved `program_source_procedure_set()`: a reviewed function called with a SELECT, guarded on the md5 of the record as read. Its first call, with a wrong md5, refused at once and wrote nothing; its second wrote Cerritos's v3 with no paste.

## S331 SkyForge, 2026-10-05: the harvest tab in COBI, the reader opens and lists, Cerritos's high school list by other routes

- **The Program Requirements tab** (Beta draft, #1860) ports the approved mock-up into COBI under Reference & Curation. It reads `program_source_registry` and `program_requirement_records` live (anon SELECT), so there is no snapshot to go stale; a failed read names the table and paints no count. Four views: Catalogs, Program records (the four checks; a record passes only when all four hold), Sequences, and **Procedures**, which shows each college's reading procedure. That view is where Sam's rule lands: a misread changes the procedure, never the record. Sierra is one link to the CPL Assistant (the mock-up's v3 design), so no `cpl-chat` deploy. The Admin tab's surface scan finds a read only in the `REST + "/<table>"` idiom; a helper that hides the table name reads as "touches no data", so the module keeps the literal form.
- **The reader opens collapsed sections and lists table rows.** `expand` clicks every collapsed toggle that stays on the page (a button, or a link to a fragment; never a link to another address, which would be a load outside robots.txt and the delay) and reads a panel still not shown by textContent. In Chromium, innerText of a `display:none` element returns its textContent, so "not shown" is tested with `getClientRects()`, never with an empty innerText. `rows` prints every table row whose text matches, with its links, and skips a layout row that wraps a whole table.
- **A search result is a lead, not a source.** Three addresses web search returned for Cerritos's list were dead: `hsarticulation.cerritos.edu` (no DNS), `cerritos.ctecourseconnect.com` (no DNS, no archive capture) and `/epp/Articulation_List.htm` (404). Each cost one load and one line on the procedure record, and each is now marked so no read repeats it.
- **Cerritos's high school list, reads 7-12.** CATEMA's directory lists 30 California colleges; Cerritos is not one (Rio Hondo is the nearest). Cerritos's CCAP page, opened, names Downey Unified's Downey, Warren and Columbus high schools as CCAP partners. BoardDocs bars readers in robots.txt and DualEnroll (CourseMaven) is a sign-in page; the reader stops at both. The Internet Archive's 2016-03-14 capture of Statewide Career Pathways' full list is the last public list: 57 Cerritos agreements with 27 schools and ROPs, mostly Project Lead The Way engineering, automotive and culinary, none for welding and none with Columbus High (`kb/program_requirements_pilot/cerritos_hs_agreements_2016.json`, dated). Downey High's 2023 post says the welding pathway "will be equivalent to" WELD 100, which is articulation wording. Columbus High's own CTE Welding page (read 12) runs Welding and Materials Joining I and a Capstone, awards OSHA 10 General Industry and OSHA 30 Construction certifications, and names Cerritos as its partner college; no page states the route, and Downey teachers teach the courses, so articulation through Credit by Exam is the likely one. The procedure record (v4, composed in SQL from the stored v3 so nothing unchanged was retyped; dry run first, then `program_source_procedure_set` on v3's md5) names every route and what it answered. Open-asks sheet 37 asks Sam whether to send the held request, its draft revised for what the reads found.
- **OSHA 30 sits on both sides of the pathway.** Columbus High's capstone awards OSHA 30 Construction, and the Ironworker A.S. lists IWAP 41.09 OSHA 30/Extension Review (1.5 units). Whether that certification carries CPL toward IWAP 41.09 is a question for the CPL-in-three-kinds build (for consideration), not yet asked of the data.

## S332 SkyBridge, 2026-10-05: the display's identity source, OSHA 30 on IWAP 41.09, sheets 37-38

**The display read identity from a subset.** `kb/_build_roep_display.py` took each course's identity from
`kb/coci_minted_memberships.json`, which holds only identities with two or more members. Every stand-alone
course and every C-ID or CCN identity read as none: 140 of the pilot's 289 course entries. It now reads the
live CCR (`unified_courses_members.js` and `_index.js`, by control number, else college and code); a course
under several ids (1,066 control numbers carry a C-ID and its CCN id) shows the strongest and could adopt
reads across all. Build `81691460ba18`: identities 149 to 285, could adopt 53 to 133, for consideration 0 to
15. The S327 finding "for consideration reads zero on the pilot" came from the gap and is superseded.
"Already here" now compares each MAP title's unified CER title too (Riverside CIS-27 holds "CompTIA
Security+ (CIS-27)"). #1861.

**Measuring the old rows through Node lost the floats.** A verify built from the page file loaded through
Node read 17 of 20 live rows as different: JavaScript prints `0.0` as `0`. Built from the receipt's own SQL in
Python, all 20 matched. Prove a rollback from the receipt, never from the page.

**OSHA 30 and IWAP 41.09.** Cerritos credits IWAP 41.09 OSHA 30/Extension Review (1.5 units) by its own exam
(exhibit `MAPCXA-E&R-1-001`). Read 13 (run 37271979880) found Cerritos's catalog and COCI both print AED 41.09
Welding III's outline for it, so the CCR files it alone (`WELD M10CA`), apart from the eight OSHA 30
Construction courses in `CNST M1001`. Sam (sheet 38 card 2, later): *"I assume Cerritos teaches osha 30
imbedded in their class."* A plan reading only a college's catalog on its vendor host failed the plan check;
`tests/college_page_read_test.py` now accepts one college's catalog subdomain (#1862).

**The write path.** The repo guard denied the display upsert through `execute_sql` (as designed); the
auto-mode check then denied re-routing it through `apply_migration` as a bypass. On Sam's go (sheet 38 card 1)
six migrations wrote the build, all 20 rows matching the receipt. Then *"Add apply migrations to allow list"*
(#1864): the sheet and the receipt are the whole gate. Memory rows go through `execute_sql`'s `cpl_memory`
carve-out (no prompt); this run used `apply_migration` for them and cost two prompts. The first memory
receipt lost every apostrophe (Python joined adjacent string literals) and ran past the 400-character summary
check; both were caught before the write.

**Sheet rulings.** Sheet 37: hold the Cerritos request. Sheet 38: writes go; IWAP 41.09 later; *Ext & Review*
renamed *Ironworker Apprenticeship — OSHA 30/Extension Review* (plan `kb/cer_decisions_out/2026-10-05`, runs
on `main` after #1863); both Fire Inspector 1C titles kept (*"I think these are different though they sound
the same"*); Sierra docked, then *"Sierra at the top"* (#1863).

## S333 SkyHarbor, 2026-10-05: the rename lands, the display follows it, OSHA has one name as issuer

**The rename ran on main.** `cer-decision-apply.yml` dry-run (1 to write, 0 held, as S332 read it), commit at
15:10Z, then `cred-rename-apply.yml` at 15:18Z: `credentials.json` carries *Ironworker Apprenticeship — OSHA
30/Extension Review*, Sam's issuer row (California Community Colleges) re-keyed with it, the fulfilled title
override deleted, *Ext & Review* in the alias map, and the three derived files rebuilt (the 2026-10-01 gap is
closed in the workflow).

**The display build after it changed two paths.** `799bfb9a7dbf` against `81691460ba18`: a JSON diff of the
two receipts found `build` on all 20 rows and the one IWAP 41.09 label on Cerritos 42158, nothing else. So the
write (sheet 39 card 1, Sam: go) was two guarded `jsonb_set` updates through `apply_migration`, conditioned
on the before-values, in place of the 159 KB upsert; before, all 20 rows matched the old build's md5s (built
from its receipt with the builder's `jsonb_text`); after, all 20 matched `--verify-sql`. Receipt
`kb/receipts/program_requirement_records_display_2026-10-05_799bfb9a7dbf_delta.sql`; rollback is the old
build's receipt. A verify query typed from a truncated listing produced four false "differs"; build the query
from the file, never retype md5s.

**Sam on OSHA as issuer (chat):** *"If so, they would not be the issuing agency, osha would."* Card 2 of
sheet 38 had asked what IWAP 41.09 teaches (its CCR filing), not who issues it; the exhibit is Cerritos's
credit by exam, so his July issuer for it stands. His rule went onto sheet 39 card 2: the CER named OSHA three
ways across 13 entries and named a trainer (CTCNC) as the OSHA 10-hour Construction entry's issuer.

**The card named a mechanism that could not work.** `kb/_apply_credential_review.py` and
`kb/_fold_unclassified.py` only ever add an issuer to `credentials.json` (fill when empty, append when absent
under any spelling, never overwrite). Override rows alone would have appended OSHA beside Department of Labor
on both OSHA cards and beside CTCNC on the construction entry, and done nothing on the Agriculture pair (the
new spelling contains the old). The fix, sent to Sam in the sheet's thread before any write: edit the file's
first records directly (#1868) and change the five curator rows the sync reads, by guarded update
(`kb/cer_decisions_out/2026-10-05-2`, 16:28Z, all five read back). Three of the five were triage assignments
(`_UNCLASSIFIED::`), the true source of *U.S. Department of Labor*; the card had named only two of his rows.
Detail: [`methodology-an-additive-sync-cannot-carry-a-correction`](kb-notes/methodology-an-additive-sync-cannot-carry-a-correction.md).

**The applier's replace path.** `kb/_cer_decision_apply.py` takes the agency fields and `_UNCLASSIFIED::`
issuer assignments, and a row carrying `replaces: {value, reviewer_email}` is a guarded update that changes only
while the live row still holds exactly that; anything else holds the plan. The receipt keeps the before-value,
reviewer and date; `--rollback` restores them. `tests/cer_decision_apply_test.py` 29/29.

**Small things.** `tests/run.js` ignores file arguments and runs the whole suite; run one jsdom file with
`node tests/<file>.test.js`. `pkill -f` on a pattern that appears in your own shell's command line kills the
shell. A stash pushed with a pathspec carried the staged display files onto another branch; restore them by
name.


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

### Moved from the lane (S356 compaction)

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1, *build*, 20:35Z, confirmed in chat).** The Records view places each question the reading raised on the block whose courses it names, as a numbered flag that says who fixes it (the college or the reading procedure); a row printing a flagged course carries the number; reader's notes stay notes. A reviewer signed in with the magic link also reads the unchecked records, and each record ends with Confirm and Needs a fix: one write, `program_record_verdict_add` (`chatbox/supabase_program_record_verdicts.sql`), into the append-only log `program_record_verdicts`, holding the fingerprint of the requirements the page showed (`requirements_fp`). Confirm checks a record only while that fingerprint matches and its three machine checks pass; Needs a fix files the note on the college's procedure (`open`) through `program_source_procedure_set`. A trigger keeps a person's reading across a reload of the same requirements. Live (receipt `kb/receipts/program_record_verdicts_2026-10-08_s347.sql`; a rolled-back self-test passed ten cases); governance dismisses both surfaces with the reason; guards `tests/program_record_verdicts_sql_test.py` and the tab test's blocks 11-12.
