---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-14
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

🔨 **Phase 0 (the census) built (S320, #1836; reader corrections S321-S322),
and the registry filled by apply on `main`.** Sam's three
statements that opened the lane are verbatim in the vault:
`CPLBrain/03-professional/braindumps/braindump-2026-10-03-1433-program-requirements-from-local-catalogs.md`.
The plan is a Claude Doc Sam edits and comments on:
[Program Requirements Harvest Plan](https://claude.ai/code/artifact/77ae8cb2-443b-45e3-b287-594c9c9b8744).

**The registry** (`kb/supabase_program_source_registry.sql`, four migrations applied live 2026-10-03): one row per college, a history table, one write path (`program_source_census_apply`, service role only), anon SELECT. Columns and Sam's 2026-10-03 rulings: lessons, S419.

**The census** (`kb/_program_source_census.py`, `program-source-census.yml`): reads each college's homepage on a runner, scores and dates its catalog link, applies weekly on `main` (Sundays 10:29 UTC). Its rules, politeness limits and governance note: lessons archive, S334. Guard: `tests/program_source_census_test.py`.

**Older rulings and notes** (Sheets 23, 25, 26, 29, 32, 33, 50 and 77; the sequence pass; CSU LA later): lessons, the S335, S336, S353, S387, S394 and S422 compactions.

**Measured (2026-10-03):** the Program Course File names every course a program lists (the closed list each record is checked against) but marks none required. Detail: lessons archive, S334.

**The pilot (Phase 1): all 20 records pass all four checks** (Cerritos, Mt. San Antonio, Riverside City, West LA, Miramar; Sam read them, 18 matched and both fixes went in). Capture `kb/_program_requirements_pilot.py`, extraction the `program-requirements-extract` Edge Function, scorer `kb/_program_requirements_score.py`; guard `tests/program_requirements_pilot_test.py`. Detail: lessons, S372.

**A refusal is on the college's record (Sam, sheet 29 card 3, revised 2026-10-17; `sam-sheet-29-revised-refusal-workarounds-2026-10-17`).** ⚠️ **Automated reads still name the CPL Initiative in the user agent and still respect blocks and robots.txt.** The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**Sam's ruling (2026-10-04, 11:1xZ, in chat):** *"No need for governance at this
point. Everything is public record and we can mark the tab and contents as beta
draft."* The harvest's tab shows its records without a Governance pass, marked
**Beta draft** (vault braindump
`braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). Then:
*"Integrate Sierra in the tab design."*

**The tab is in COBI** (Beta draft, #1860, Reference & Curation): `program_requirements.js` ports the approved mock-up ([v3](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), Sam: *"mock up looks good"*) and reads `program_source_registry` and `program_requirement_records` live. Five views: Progress, Catalogs, Sequences, Procedures (each college's procedure record) and the List; no Sierra (Sam, 2026-10-14, guard `(4b)`). Two early notes (the unscoped surface, Cerritos's Ironworker): lessons, *Moved from the lane (S542 compaction)*.

**The List (2026-11-01, `#program-requirements/list`):** one row per active COCI program (20,282), read only, and the workspace: a program's side panel carries its record's card and drafts the message to the college; program records retired into it (SkyLoquat, 2026-11-04). Guards `tests/program_requirements_list.test.js`, `tests/program_requirements_list_panel.test.js`, `tests/program_requirements_list_record_port.test.js` and `tests/program_requirements.test.js`. The paragraph as it stood: lessons, *Moved from the lane (S639 side session)*.

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, S394.

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z):** every record shows, checked or not, each marked; no record is edited by hand. The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills, in `course_outcomes`, read nightly (below); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413).

**Course objectives, collected with every SLO read (Sam, 2026-11-02; `sam-data-collection-six-asks-2026-11-13`):** filed as `course_outcomes.kind` `objective` (`kb/_objectives_by_system.py`; guard `tests/course_outcomes_objectives_standing_test.py`). **DECIDED** `d-objectives-reread-order-s649` (one host at a time, never replacing an SLO row; [plan](../../../kb/course_outcomes/objectives_reread_plan.json)), `d-contra-costa-commented-objectives-unread-s649`, `d-chaffey-objectives-only-read-next-s649`, `d-rccd-objectives-loaded-s649`, `d-sdccd-objectives-loaded-s651`. De Anza and Marin held. **PITFALL:** an objectives `.load` is written by hand. As it stood: lessons, *Moved from the lane (S652 checkpoint)*. **NEXT:** sac, laspositas, Coastline, Golden West.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), pages only, no cost; De Anza and College of Marin held. The paragraph as it stood: lessons, *Moved from the lane (S647, Sheet 191)*. **Next:** the day's full read and preparation run, as `--next` names them.

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings, the Progress view (S343, #1900, its status file written at step 12) and the older NEXT** (Schedule+ for Spring 2027, the film, the addenda reading agent, SkyView ROEP): lessons, *Moved from the lane (S653 checkpoint)*.

🔨 **Phase 2, a college at a time:** the load, the display and the $40 go: lessons archive 4, *Moved from the lane (S648, Glendale loaded)*.

🔨 **The reconcile pass (S392; `sam-reconcile-pass-after-harvest-2026-10-14`):** `kb/_program_requirements_reconcile.py` applies each college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call). The paragraph as it stood: lessons, *Moved from the lane (S647)*.

**Parked, displayed or standing as filed earlier** (Los Angeles Valley and Los Medanos parked; eleven colleges, Monterey Peninsula to Butte; Redwoods and De Anza open, their NEXT is (8) below; a choose-courses list's printed units are its floor, Sheet 144 card 2): lessons, *Moved from the lane (S644)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**

**The numbered handoff carries the lane** ([`session_654_handoff`](../../session_654_handoff.md)). **DECIDED (Sam, 7:13 PM PT 2026-11-11, relayed by COBIx on #3110; `sam-harvest-next-steps-tonight-2026-11-11`):** "Yes, pick them up tonight." Decisions that stand: `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`.
**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
**Standing decisions of S640 and S641, throughput (S644-S647) and the gap census** (`d-passes-live-stays-equal-only-s644` stands): lessons archive 4, *Moved from the lane (S648 checkpoint)*.
**A wave** (`program-requirements-wave.yml`, #3191): up to eight colleges on distinct hosts, one branch, one PR, one filing job, no table written (lessons, *Running a wave*). **DECIDED** `d-wave-one-branch-hard-stop-s644`, `d-wave-price-rate-floor-s644`.
**The display apply runs live (#3190, #3204).** `step=display` writes the whole committed build; `display_college` runs one college. First runs and live counts: lessons, *Running a display, one college first (S645)*. **DECIDED (`d-display-first-run-one-college-s645`):** a new apply's first live run goes out on one college, the whole build after its record is confirmed. **DECIDED (`d-merge-is-publication-spot-check-first-s645`):** merging a college PR publishes its display build, so COBIx's five-record spot-check comes before the merge. `d-display-missing-threshold-s644` stands.
**Standing from S645 to S648** (the #3193 rescore, the PDF reader, Desert #3240, Glendale #3202, district profiles #3198; COBIx: run 43421133593's artifact must never be reposted for Desert 10195): every DECIDED slug and the paragraph as it stood, lessons, *Moved from the lane (S653 checkpoint)*.
**Headline:** the run log, `kb/status/program-requirements.json`. Sam's rulings of 2026-11-13 stand (the display go at every college, Cal-GETC 34, the 503 change, and `sam-headline-counts-own-list-2026-11-13`): the paragraph as it stood, lessons, *Moved from the lane (S648 checkpoint)*. The 503 change is merged and deployed (#3227); its post-deploy checks: lessons, *Moved from the lane (S649 final refresh)*.
**Standing from S648 to S651** (Cal-GETC 34, #3244; Sheet 195's rulings; Cosumnes River, #3288; Lassen, #3291; Sam's `sam-three-colleges-rules-first-2026-11-13` and `sam-noncredit-total-hours-2026-11-13`): every DECIDED slug and pitfall, lessons, *Moved from the lane (S652 final refresh)*.

**Catalog-first collection (Sam's go, "Nov 14, 2026, about 4:55 AM PT", relayed by COBIx on #3299; `sam-catalog-first-collection-2026-11-14`):** *"nothing stops the collection bus from rolling."* His four steps: start from the published catalog; compare back to COCI; take one second look in the catalog by title and award; if the program is still not found, flag it "on COCI, not listed in the catalog" and move on, never in Still to pass. **DECIDED** `d-catalog-first-slice-order-s652`: three slices, C, then A, then B. Slice B moves a public figure, so it waits on Sam's go and the conductor's four guards (#3299, comment 6877610924): each not-listed records its basis; the headline shows both bases side by side; a chipped program with awards in the last three years says so on the chip; `page_claimed` and `not_found` on closed-list programs stay in Still to pass until the second look has run for that college.

**Slice C, prefix aliases (#3301 `c6e0b893`), and the course-id route (#3312 `b00fca4f`, S653).** `d-prefix-alias-evidence-rule-s652` stands (17 pairs at 13 colleges, each on its own committed evidence). `kb/_course_id_route.py` takes a course's prefix from the Program Course File's course id before the prefix aliases (`with_course_ids`; `printed_also`, so the capture counts both forms; tag `matched_by course_id`). **DECIDED** `d-crsid-seven-retire-ten-stay-s653`: 7 pairs retire (American River BMET and SWCD; Barstow CDEV; CCSF COMM; Diablo Valley BIOL; Riverside City HIST; Santiago Canyon PASV) and 10 stay; Crafton Hills, Moreno Valley and Norco keep theirs (COCI carries HIS, never HIST). On filed records 8 fail to pass (Desert 35461, 36094, 45210; De Anza 46313; Diablo Valley 37558; Glendale 19366; LA Harbor 17778; Mt. San Antonio 18236) and 0 pass to fail; not yet rescored into the table. The retirement rests on filed records: at the next reread of American River and Santiago Canyon, check for BMET and PASV codes that show up as invented. **PITFALL** `p-mis-codes-carry-record-id-suffix-s652`: ENGL304-2507 reads as ENGL 304.

**Six colleges rescored from their filed pages under the aliases (live `program_requirement_records`; displays not run).** Riverside City (S652, draft #3305): live 230 of 244; its display waits on COBIx's spot-check of 32938, 42719, 43897, 44155, 44469 (#3299, comment 6879661422). S653's five, each with a receipt `kb/receipts/program_requirement_records_college_reread_<college>_<run>.json` on its branch (before-values and a guarded rollback), as reconcile run, reread run, rows replaced, passing: Merced #3317 43609965348, 43619524339, 28, 141 to 144 of 163; Moreno Valley #3318 43609968396, 43620214071, 139, 132 to 134 of 140; Norco #3319 43609971090, 43620771120, 147, 128 to 130 of 148; San Bernardino Valley #3320 43609973859, 43621313931, 9, 161 to 162 of 225; Diablo Valley #3321 43609976980, 43621848307, 19, 197 to 198 of 214. Merced's summary of 134 was an old extraction's; 141 is right (`merced-summary-stale-s653`). **DECIDED** `d-rescore-five-after-crsid-merge-s653`: the five ran on main's code before #3312, so after COBIx's spot-check (asked on #3299, comment 6881825340) and one display rebuild, one rescore on the course-id route's code gives every filed score one code version (66 scores change, one status: Diablo Valley 37558). **PITFALL** `p-sources-from-wants-the-capture-run-s653`: `sources_from` takes the run that captured the pages (Moreno Valley 38111056537), never the day's reconcile run; the guard refused it. Never reread from `claude/riverside-city-prefix-rescore-s652`.

**Riverside City's missing pages: the S646 claim rule, not `cq_distinct` (S653; `cq-distinct-not-the-riverside-fault-s653`).** #3311 (`8b6caff8`) gives a curriQunet program its title and award as identity and records twin ids; a capture on that code cleared `cq_distinct`. The fault is the S646 rule at `candidates()`, which skipped each transfer degree's own GE-pattern page. **#3324** (`claude/ge-pattern-page-claim-s653`, head `9a23c75d`, three reader rounds): `ge_page_owner`. **DECIDED** `d-ge-page-one-owner-s653`: a GE-pattern page has one owner, settled by title words both ways, award, version and a printed control number; a tie refuses. 88 filed claims allowed, 52 refused; 82 claims move at six colleges (Riverside City 36, Moreno Valley 27, LA Trade-Tech 7, Norco 6, Pierce 4, LA Valley 2). Until #3324 merges and one free Riverside City capture off `main` confirms it, curriQunet colleges rescore from filed pages only. **PITFALL** `p-diagnosis-flipped-three-times-s653`: instrument the code and run it before fixing. **PITFALL** `p-snapshot-test-pins-the-rule-s653` ([note](../../kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md)): #3324's first `GE_ALLOWED` pinned the rule's own output.

**Slice A, the no-closed-list lookup (#3300 merged `7e248b76`; runs in every capture, `ncl_lookup` default 1).** Its rules as built (`d-ncl-lookup-not-listed-needs-catalog-list-s652`) and the census: lessons, *Moved from the lane (S653 checkpoint)*. **PITFALL** `p-new-matcher-needs-self-recall-test-s652` ([note](../../kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test.md)). **Skyline, the first capture on merged code** (`skyline-ncl-first-merged-capture-s653`; branch `claude/skyline-ncl-capture-s653`, run 43619276697): 52 `found` and 34 `not_matched` of 86 no-closed-list programs; two records on `main` are wrong: 46296 filed on `dance-aa.php` and 32337 on the Advanced Engine page. **DECIDED** `d-skyline-estimate-5-20-s653`: the estimate is about $5.20 (52 x $0.08 floor x 1.25); nothing extracts a found program until slice B; the 23 empty-heading pages get a spot-check first; COBIx is asked (#3299, comment 6881980522) whether an empty h1 is `not_matched` or stays `found` with named courses required (the conductor leans to the second). **#3328** (ready, head `7fcca2b3`): a catalog's header fragment is never a program page (2 of 27,439 URLs, Skyline `_program-headers`; releases English A.A. 05825).

**The extraction gate (S653).** **DECIDED** `d-extraction-gate-every-run-s653`: the $40 estimate gate and hard stop run on every paid extraction, fresh or restaged: #3327 (ready, head `5b53d902`; the college workflow and `program-requirements-extract.yml`) and #3330 (stacked on #3327, retarget to `main`; `second-reader.yml`). Three model callers stay ungated until Sam gives a figure: `cer-classify` (`cer-procedures.yml`), `cpl-news-harvest` (`cpl-news.yml`) and `cpl-chat` (`sierra-ask.yml`, `cpl-chat-preview-ab.yml`, about 66 billed answers a run). The separate $40 for SLOs, PLOs and objectives appears only in text; the outcomes reader calls no model.

**Slice B** (the completeness base counts catalog-listed Active programs; COCI-only rows get a chip). **RULED (Sam, Sheet 197 card 4, 14:38Z 2026-11-14):** *"go"*, with the four guards; the lookup runs at each college first, the empty-heading rule after COBIx answers.

**The passing dry run (draft #3293, head `cb60a1b0`; nothing applied; `d-passing-dry-run-held-for-cobix-s651` stands):** COBIx has not reviewed it; it folds in after slice A's first captures, then one migration and one rescore. The paragraph with the electives-fill census (#3297): lessons, *Moved from the lane (S653 checkpoint)*.

**The display's gaps as structured fields** ([`reference/roep_display_structured_fields_design`](../roep_display_structured_fields_design.md), #3296, #3303; writes only `program_requirement_records.display`): **DECIDED** `d-lassen-stale-note-known-defect-s652`. The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**NEXT, in order:** (1) #3324 merges; then one free Riverside City capture off `main` to confirm; then curriQunet colleges may capture again. (2) COBIx's spot-checks (#3299): merge #3305 and #3317 to #3321, one display rebuild, one rescore on the course-id route. (3) #3328, #3327 then #3330 (retargeted), on a green `test`. (4) Slice B (above). (5) Skyline: fix records 46296 and 32337. (6) The three ungated model callers: Sam's figure. (7) #3293 after slice A; Cosumnes River's seven follow it. (8) Allan Hancock on #3284 (`index=kb/course_outline_index/index_43566318943.json`, `slugs=allan_hancock`, `trial=12`) and objectives sac, due 2026-11-15 (the second session pushes both at about 00:10Z); then laspositas, Coastline, Golden West. (9) Lassen: a capture pinned to main's pages for 31132, 33263, 33729, 33730 and 42300, then the `set` step with a per-record hold; the structured-fields migration's step 1, Lassen first. (10) Los Medanos, Monterey Peninsula and Los Angeles Valley, their rules first, with a person. (11) The standing list (Cerro Coso 40922 and Grossmont 46141 held, Chaffey, RCCD, Glendale, Desert 10195, De Anza, Redwoods and the rest): the S652 NEXT line, lessons, *Moved from the lane (S653 checkpoint)*.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.
**Slice A's mechanics (#3300):** `ncl_lookup` in `kb/_program_requirements_college.py`; census `kb/_harvest_ncl_lookup_census.py`; flag `ncl_lookup` (default `1`).

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.
