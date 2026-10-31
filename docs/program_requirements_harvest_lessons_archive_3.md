---
title: "Program requirements harvest lessons — archive 3 (S399-S415)"
created: 2026-10-22
updated: 2026-10-30
tags: [lessons, archive, program-requirements, catalog-harvest]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - docs/program_requirements_harvest_lessons.md
  - docs/program_requirements_harvest_lessons_archive_2.md
---

# Program requirements harvest lessons — archive 3 (S399-S405)

Moved verbatim from `program_requirements_harvest_lessons.md` at the S447 compaction (the lessons doc stood at 126 KB of its
120 KB budget). The last section holds S452-S459 text moved from the lane at S474; S409-S411 follow it, moved at S526, then S495-S500, moved at S533. Earlier sessions are in [`program_requirements_harvest_lessons_archive_2.md`](program_requirements_harvest_lessons_archive_2.md).

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

## S424 SkyBuckthorn (2026-10-19): the verdict rows worked, Taft's four wrong pages settled, the Jev sitting's selection

- **A check that holds no record back is not a failure to ask about.** S421's Cañada sitting asked Jev about 22
  records; five failed only the careers check, which the scorer reports beside the checks and leaves out of its `pass`
  (as `program_record_machine_pass` does), and the verdicts could only read "unverified". `failing()` in
  `kb/_jev_harvest.py` now reads the five checks the scorer's gate reads (#2256). The next Cañada sitting asks about 17.
- **Two certificate rules in the scorer (#2256), each from an owner_differs row at San Joaquin Delta.** A certificate
  with no degree total whose `ge_units` make the printed total exact passes with them named (`ge_included`; 05630,
  "Minimum Units Required: 51" over a 35-unit major and 16 GE units). One whose page says electives make up its total
  passes a short sum with the fill named (`electives_fill_degree`; 11970, "Complete elective units to meet the minimum
  60 unit requirement for this certificate"), under the degree check's guard that a text naming no electives keeps it
  failing. Both records rescore equal locally; the rules take effect on their next rescore.
- **A second capture that reads the same 168 pages rules out a missed page.** Taft's Administrative Services II (30284)
  took the General Business A.S. page at title 0.0 in both captures (runs 39126711681, 39252972758), while the group
  page's children (college-page-read 39252547290) are absolute links beneath its path that `child_pages()` returns
  locally. The cause was in the codes, not the pages: the state's file lists BUSN 550 Business Mathematics and BUSN 555
  Office Procedures, the catalog prints BUSN 1050 and 1055 (same titles, 3.00 units), and the General Business page won
  on the old codes in its "previous versions of required computer courses" note. Taft's `course_renumbers` maps the two
  pairs, cited (Merced's pattern, S423); the capture-only read then named 30284 moving to its own page (run 39256247313).
- **An award the catalog no longer lists is the college's to settle, and a loaded row that reads a sibling's text is
  removed, not re-read.** Taft's 2026-2027 index (college-page-read 39250246074) lists Cal-GETC alone: no CSU GE-Breadth
  (38661), no IGETC (38662), and no Speech Language Pathology Aide (46186) or Assistant (46198). 38661's loaded row is
  the Cal-GETC certificate's section under the wrong number (45358 holds the Cal-GETC record from its own page); its
  removal follows the S411 Hartnell receipt, and waits on Sam: the session's auto-mode classifier refused to write the
  delete migration file, twice, so the row stands until a session with the permission (or Sam) files it.
- **Left as read, with the reason in the verdicts file:** Delta's 07304, 16764 and 45621 are the model's reading of a
  choice, a waivable block and an area minimum (the second reader's to re-read), 22244 a non-course requirement line,
  44197 a repeat count the record shape has no field for, 19752 Delta's page assignment (the GE page handed the model).

## S423 SkyLaurel (2026-10-19): Merced's renumbered courses, the Knowledge Base portal's UI pass

- **Read the page before naming a cause.** Merced's eight near misses (coverage 0.08-0.18) and ten page-claimed
  programs looked like a reader fault. Two free page reads (college-page-read 39229076688, 39234806863) showed the
  catalog printing MECH12, MECH22A ... where the state's file lists AGMA 2, AGMA 11 ..., ANSC and AGBS for AGAS and
  AGAB, LAND for AGEH, CPSC-17 and -18 for DRON 10 and 11: the same title and units for every course, the numbers not
  derivable from each other. The college renumbered after the file was written.
- **A cited map, never a title rule (Fable, asked once).** `course_renumbers` in `kb/program_requirements_reconcile.json`
  maps the catalog's code to the file's for one college, each pair in `course_renumbers_cited` with its title and units.
  A title match alone is weaker evidence than a prefix swap (colleges reuse titles across levels); a general rule would
  relabel courses statewide with no receipt. The capture looks for the listed course by its printed code, the scorer
  renames on its own copy, and a pair retires once the file lists the printed code. Held out: Agriculture Systems
  44160 (AGT-701 to 705 at 0 credits against AGAT 51 to 55 at 2-3 units), since the units disagree.
- **A printed code needs its subject spaced from its number.** `code_pattern("CPSC17")` reads the letters C-P-S then
  `C17` and never matches the page's `CPSC-17`; Drone Technology stayed below the gate and Equine read ANSC-14 missing
  (0.917) until `course_renumbers()` handed the capture `CPSC 17`.
- **The account keeps the catalog's own list** (`coursedog.catalog`, 188 programs), so a program read from no page is
  checked against what the catalog offers: Biological Science A.S. and International Studies A.A. are not in it.
- **What stays unread at Merced, the college's to settle:** Small Business Entrepreneurship (two awards), HVAC
  Technician and Engineering print revised, shorter lists than the file keeps; Child Development A.A.'s Requisites tab
  prints no courses; Communication Studies AA-T prints the 2.0 pattern (6 of 15 listed).
- **Counts:** reads 39230479383, 39235509270 and 39239492986, 154 to 163 of 172 found, 125 to 134 passing, $0.55 in
  extraction; loads 39239250159 and 39243215660 inserted 9; display build 93edc84cde30.
- **The UI pass reached a frame's contents (#2254).** The Knowledge Base tab passed the cobi sweep on its shell; the
  portal inside the iframe (`kb-portal/`) had never been measured and said "MAP Initiative" in its header. Three
  seeded targets now measure it. A sweep that passes a tab built around an iframe has measured only the shell.

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

## Moved from the lane (S474 compaction)

Moved verbatim from `docs/reference/lanes/program-requirements-harvest.md` on 2026-10-25 (S474), when the lane stood at
26.8 KB of its 20 KB budget. Out of session order here: these are S452-S459.

**S457:** the S456 wave landed (#2381: Hartnell 31591 inserted, 03537, 03585, 21450 and 31592 re-read on their own tabs; Sierra 37810 and 38749 inserted; display build 14291ca32973, applied on `main` by run 39990555422, whose applied record committed though the run ended in failure). Sierra's two ESL noncredit certificates (38991, 44028) had lost the English as a Second Language page to their sibling 38990, which took it on coverage alone with no section matched: the catalog spells the department out ("English as a Second Language Intermediate-High Oral Skills" then "Noncredit Certificate of Competency", page read 39990920770) and `with_acronyms` read a run of four-letter-or-longer words only; it now skips a short function word between the spelled words (#2385: found 111 of 125, page-claimed 11; load 39995144054, reread 39995147379, display build d45e5d0fcf78, apply run 39999773855 on `main`, which wrote 17,529 of 17,530 and ended in failure on Victor Valley 20545's filed record, whose row S456 removed; #2391 removes the file, S458). Sierra's 11 still page-claimed are the college's (15307, 31226, 32010, 07963, 21537) and drifted titles. Hartnell's arithmetic failures by `why` after the wave (31 of 94): 7 noncredit hours-measured records whose courses carry no units, 1 degree whose eleven List A blocks name no minimum (17912), 3 missing a figure (03570 Local GE unfilled, 03571, 11803), 18 sums against a stated total, 6 of them widened by ABT 99 (Occupational Cooperative Work Experience Education) at 1-8 units from the vendor's `creditHours` (page read 40000266982: the tab prints no per-program figure). The scorer's new `meets` reading passes a program total, or an electives-filled degree total, that the low end meets exactly with a choice or a variable-unit course carrying the high end past it (Sheet 81 card 1's reading of a degree's span); measured over the filed records 258 program totals and 9 degrees read so (738 under any-inside-the-span); `kb/_program_requirements_rescore.py` rescores program totals too and 267 records are rescored in #2387 (draft) with the guarded UPDATE and its rollback in `kb/receipts/program_requirement_records_rescore_2026-10-23_s457.json`; the live apply is Sheet 119 card 9. The vendor's `courses/search` answer carries `lectureHours` and `labHours` per course (ENGM 620: lecture 80-90, lab 48-54), the opening for the seven noncredit records: a `course_hours` field in `cd_pages` and a reconcile kind for `measure: hours` are next; the page reader prints 1,500 characters of each fetched body (`NETWORK_BODY`), which hid ABT 99's own entry. **S456:** a Coursedog tab's code names its award (`cd_code_kind`; a tab whose code names another award is no candidate, as the PDF route's `pdf_code_match` has it): Hartnell's site read had filed 7 of 96 records from a sibling's tab (Biology A.S. 03537 from "Biology for Transfer Degree (AS-T) - AST.BIO", Administration of Justice A.S. 03585, Psychology A.A. 18353, Spanish A.A. 19518, Agriculture Production A.S. 12331 from CT.AGRP, two certificates from A.S. tabs). Reconcile capture 39966331452: Biology and Administration of Justice A.S. read their own AS tabs, both certificates and Agriculture Production's certificate 31591 their own CT tabs, Psychology, Spanish and Agriculture Production A.S. no page (the catalog prints none); found 94 of 105, 60 pass (59); the 4 extracted and landed in the S456 wave (#2381, S457). A second Cal-GETC step (`awards: associate`) fills a local degree whose own tab names the pattern: 08871 passes, 17924 and 33851 fail elsewhere. Sierra: a department page heads a noncredit program's section (`SECTION_AWARD["noncredit"]`, "Entrepreneurship for Makers" then "Noncredit Certificate of Completion", page read 39964750956): free capture 39967799242 found 109 of 125 (107), page-claimed 13 (15), Entrepreneurship for Makers 37810 and Construction Fundamentals 38749 extracted and landed (#2381); the two ESL noncredit landed in S457 (#2385, below). Of the 15, Interdisciplinary Entrepreneurship 15307 (the catalog heads "Innovation and Entrepreneurship, AA or AS (formerly Business Entrepreneurship)" and COCI's list, BUS 28, BUS 95, IT 60, matches no section) and the Mathematics and Physics A.S.-T (31226, 32010; the catalog prints only the 2.0 transfer degrees) are the college's to settle in COCI. Hartnell's 37 arithmetic failures by `why`: 8 a GE pattern without units, 9 a required course without units (7 noncredit programs whose courses carry 0 credit hours), 2 no total (the two certificates on A.S. tabs), 18 sums against a stated total. **S455:** Hartnell's reconcile steps set Cal-GETC 34 and Local GE 23 (S454) and now price a course the Requirements tab lists without units from the tab's own `courses/search` answer (`course_units`, skipping 0-hour noncredit courses and hours-measured programs): reconcile 39949570443, 59 of 96 pass the machine checks. Sierra reads "AA or AS" for both degrees (S454) and a short title word as the initials of the heading's words ("IT" for Information Technology, `with_acronyms`): 107 found of 125 with a closed list, 15 page-claimed (capture 39949602062). Sierra's IT: Business Information Worker (07963, 21537) is not in its 2026-2027 catalog: the college's to retire in COCI. **S453:** San Mateo landed with display build 2ab793e383e1 (#2372); measured against programs with a closed list (`with_closed_list`), only Canyons (noncredit, explained), Calbright and Sierra sat under 80 percent. **S452:** Long Beach City loaded (7 inserted, 4 replaced) with display build 504ae8333118 (17,510 programs); free captures moved nothing at East LA (137 of 234) or Marin (89 of 155) and one program at San Mateo (61 of 98, its Administration of Justice A.S.-T, extracted for the next wave); Cañada is hand-filed (its robots.txt refuses). S447-S451 (Mt. San Jacinto, Santa Barbara City, Palo Verde's Acalog catalog, Cypress, Berkeley City's Multimedia Arts, Victor Valley, Hartnell by its Coursedog site, Ohlone): lessons S447-S451.

✅ **Sheet 115 card 1 carried out (Sam, 2026-10-23 12:23Z: remove; S456):** the 16 of the S449 list's 25 still live and left out of build b0a96907bf83 (10 page-claimed and replaced, the 6 placing none) and Victor Valley's Nursing Licensure 20545 left the live table through `supabase-migrate.yml` (run 39968114807, removed 17; every row's before-values and the rollback in `kb/receipts/program_requirement_records_older_build_removed_2026-10-23_s456.json`); Sierra's IT: Cybersecurity 11965 and 21557 were re-extracted and stay. No display rebuild: the build already left the rows out. ✅ **Sam's standing rule (Open Asks Sheet 118 card 1, 18:44Z 2026-10-23, his own call: *standing*):** the older-build rows each wave leaves behind are removed at each wave with a before-values receipt by the S456 method, no card. Today's six (Hartnell's Psychology A.A. 18353, Spanish A.A. 19518 and Agriculture Production A.S. 12331, left out of build 14291ca32973; Long Beach City 43802 and 46290, whose filed records place none of their listed courses; Palo Verde 04436) left the live table in S459 by the S456 method: read live with md5 at ~21:09Z, removed by `supabase-migrate.yml` run 40025041285 (#2394; the rows as read and the rollback in `kb/receipts/program_requirement_records_older_build_removed_2026-10-23_s459.json`); the push went through in its own command. Cards 2 and 3 there *keep*, his own call: Hartnell's Local GE at 23 (S454) and Cal-GETC 34 on a local degree whose own tab names it (S456; the pilot guard reads it since S457). Sam ruled **narrow** on the scorer's `meets` reading (Open Asks Sheet 120 card 1, 2026-10-23 ~20:02Z, his own call). S457's change never reached #2387 (its container died at the context line); S459 rebuilt the reading from the PR body and the lessons' counts, found the same 258 program totals and 9 electives-filled degrees, applied the 239 that pass (28 of the 258 keep a failing degree check, record shape 6) by run 40024250589 (`kb/receipts/program_requirement_records_rescore_2026-10-23_s457.json`; the complete count read 13,173 from 12,970), and built display e021a2824548 on #2387 without Victor Valley's 20545 file.

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

## S444 SkyBlueOak (2026-10-21/22): the page-claimed sweep, department pages, two-line headings, Program Mapper

- **Golden West and Imperial Valley loaded** under the section-per-award rule (#2331). Golden West: extraction
  39688079435, 135 extracted for $8.72, 102 passing; load 39691321331 inserted 79, kept 50, skipped 6. Imperial Valley:
  free capture first (found 84 → 131, page_claimed 49 → 8), extraction 39691376155, 131 for $8.02 (an extraction run
  re-extracts every found program, never only the new ones), 109 passing; load 39694352034 inserted 42, kept 83,
  skipped 6 as another program's page. Display build 4bcc9b504482 (16,917 → 17,038 records). Foothill (#2326) merged
  after a main merge started its CI.
- **A general education page as a program's only candidate means the program's own page never reached the reader.**
  121 of 648 page-claimed statewide named only a GE page (Sierra 47, MiraCosta 43, nine colleges with 1 to 6). The fix
  was never at the GE page.
- **A department or discipline page names no program in its path.** Sierra (`/departments/psychology/`, no sitemap,
  its index fallback read 3 pages) and MiraCosta (`/disciplines/psychology/`) print each award in a Degrees tab;
  `PROGRAM_PATH` kept neither (page read 39698876304). Where the link search had reached a MiraCosta discipline page,
  coverage was 1.0. Now a candidate (the department index itself is not).
- **A department page holds many awards, and its heading spans two short lines.** Sierra: the title, then "AS Degree"
  (no periods); MiraCosta: "Certificate of Achievement", then the title (page read 39704788066, from each department's
  PDF, which prints every tab). `section_award()` reads two adjacent short lines; the award pattern still tests one
  line alone, so an anchored "AS Degree" holds. Captures: Sierra 35 → 81 found, page_claimed 47 → 36; MiraCosta 29 →
  68, page_claimed 43 → 82: its discipline pages (Horticulture 11 claimants, Computer Studies 17) still give one
  claimant the page. Next look: the text the capture keeps from MiraCosta's hidden tabs (`textContent` may run the two
  heading lines together). Sierra extraction 39709837031: 81 for $7.28, 57 passing.
- **One college per page-read plan.** `college_page_read_test` (lints) holds a plan to one college's domain; a plan
  reading two colleges' PDFs failed CI until split.
- **Program Mapper (Sam, 2026-10-21, pasted programmapper.org/ppm-schools; non-CCCs set aside).** 63 community colleges;
  the registry held a map host for 26. A guarded UPDATE through `supabase-migrate.yml` (the repo's guard holds an
  UPDATE from the session) wrote `sequence_host` and `sequence_note` on the 37 empty rows (run 39689748697, #2330); the
  census never writes those fields. Six list a second host for a mapper that refused the reader (Cañada, Canyons, Las
  Positas, LA Harbor, LA Mission, Oxnard): not written, since asking it retries a refusal another way. Every mapper
  host reached so far answers 403; the list names each college's account manager, so one request to the vendor could
  open the maps for all 63. That ask is Sam's.
- **Blocked catalogs, on Sam's ask:** the Procedures view's closed card says *Catalog blocked (robots.txt), read from a
  hand-filed copy* or *needs a hand-filed copy*, with a Show filter and two glance counts (#2328). Eight catalogs block
  the reader; all eight read from Sam's hand-filed copies. The Catalogs view now names a 404 address.

### Moved from the lane (S444 compaction)

**S440 (#2306):** Santa Monica, Irvine Valley and West LA loaded (a PDF may wait 2,400 s). **S442 (two runs):** Reedley 196 of 200 found, 159 loaded; a number led by a campus letter (the Ventura district's ANCT M01A) now keeps its Requirements tab (#2309), so Moorpark, Oxnard and Ventura re-read, 100, 86 and 121 passing. **S443 (#2322):** a page heading a section per award now serves each sibling: Foothill 116 → 144 found, 97 passing, 29 loaded; Golden West 81 → 95 on capture (extraction next); Palomar unchanged (its own reader look); 842 page-claimed statewide is the next sweep (lessons S443).

## S443 SkyToyon (2026-10-21): a page heading a section per award serves each sibling; Foothill loaded

- **Page-claimed was 842 programs statewide** (Palomar 103, Foothill 73, Imperial Valley 49, Sierra 47, Golden West 43).
  Foothill prints a program's A.A. and its certificates as sections of one page under the banner h1, so the label named
  no award and `page_winners()` gave the page to one claimant. `section_award()` (#2322) reads a short line naming the
  award and every title word, or, for an A.A./A.S., Foothill's generic "Associate Degree Requirements" beside its
  Award Type(s) line ("AA = Associate in Arts Degree"); when two or more awards head sections and the label names none,
  each award's fullest-named claimant keeps the page. The extraction already reads by award (`section_heading`).
- **Read the page before you trust a capture.** The first cut matched nothing on Foothill (run 39654813908): the degree
  heading carries neither award nor title, and a page read joins short lines with " · ". A free page read (run
  39657323731) showed both; the second capture moved Foothill from 116 to 144 found.
- **A hub page lists degrees it does not hold.** Golden West's Physics page lists "Computer Science, Associate in
  Science Degree", and Computer Science A.S. took it at 67% coverage, the physics it requires (page read 39666262949).
  Guard: a section on a page whose label does not name the program at least halfway needs 80% of its listed courses.
  Golden West then read 81 → 95 found, page_claimed 43 → 29 (run 39667910648).
- **Palomar did not move** (224 found, 103 claimed, run 39661015658): its pages print awards another way. Reader work.
- **Foothill:** extraction 39671107254 re-extracted all 144 for $11.85 (97 passing, from 73; no earlier record lost its
  pass, 2 gained, 22 of 28 new pass); load 39675671980 inserted 29 and kept 97 (receipt
  `kb/receipts/program_requirement_records_college_foothill_39675671980.json`, rollback inside); display build
  33f68a1257d9 (16,917 records).
- **Pipe hides a failure:** `check_generated.sh | tail` returned 0 on a stale dependency map; run it bare.

## S442 SkyManzanita (2026-10-21): six colleges captured again, Reedley loaded, CPL Pathways' college line

- **A free capture first says whether a reader improved.** The live list of thin colleges (active COCI programs
  against records, under 60%) named Sierra, MiraCosta, Reedley, Golden West, Foothill and Oxnard, each read once
  between 2026-10-15 and 10-17. A capture-only read of each (`extract=0`, one branch a college,
  `claude/harvest-<college>-s442`) writes `capture_preview.json` and leaves `capture.json` alone, so compare the
  preview with main's capture. Reedley's curriQunet read went from 36 of 200 programs with a closed list found to 196;
  the five CourseLeaf colleges captured exactly as before (Sierra still reads 3 pages and falls back to the index;
  Foothill 73 and Golden West 43 programs claimed by another program's page; MiraCosta 89 not found). Their gaps are
  reader work, never a re-run.
- **Reedley:** extraction run 39616074283, 196 extracted, 167 passing the machine checks, $11.18 under the $40 go;
  load 39622476849 inserted 159 and kept 36 (receipt `kb/receipts/program_requirement_records_college_reedley_39622476849.json`,
  its rollback inside); display build bf781cf0cd22 on the branch, display job dispatched.
- **The thin list on 2026-10-21 (~14:00Z):** no records at Diablo Valley, Santiago Canyon, North Orange Continuing
  Education and San Jose City (parked for the reader); under 30% at MiraCosta, Sierra, Reedley (before its load),
  Skyline and Golden West; Skyline's ceiling is COCI itself (a closed course list for 58 of 144 programs);
  Canyons' missing 100 are noncredit programs its credit catalog does not carry.
- **The name on screen is CPL Pathways (Sam, 2026-10-21: "Let's use 'CPL Pathways' for now").** No rendered string
  says ROEP or catalog harvest (`tests/cpl_pathways_college_status.test.js` g); code identifiers keep `roep`.
- **CPL Pathways' college line (Sam's ask, #2312):** complete counts an active COCI program passing the three machine
  checks; SLOs cover the courses the state's Program Course File lists for the college's programs; a disagreement is a
  record failing the courses or off-list check, and the Records view gained that filter so the count opens exactly
  what it counted.

## Moved from the lane (S495 compaction)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, 2026-10-27, to bring the lane under its 20,000-byte budget (`oversized_doc`).

- From Phase 2: ✅ Modesto and Palo Verde's dated reads, loads and build (S385, #2094): lessons. Palo Verde's noncredit pages and its pages that print the degree total with general education (S386): lessons. Sheet 81's rulings, the 3,797-row build and Palo Verde's year-behind catalog: lessons, *Moved from the lane (S398 compaction)*. Sheet 78's carry-out, record shape 5, the re-read path, the Palo Verde, Cabrillo and Southwestern re-reads (S389): lessons, *Moved from the lane (S392 compaction)*.
- From the catalog sweep: **S423-S424 (a renumbered course: a college's `course_renumbers` in `kb/program_requirements_reconcile.json` maps a catalog code to the state file's where both print the same title and units, each pair cited; Taft's BUSN 550/555; the four wrong-page rows; a Jev sitting asks only about the gating checks):** lessons S423-S424 and *Moved from the lane (S449 compaction)*. Merced's last nine are the college's to settle in COCI (lessons S423); Taft 30284 reads its own page since build e0407fdcb54b; Orange Coast 10278 passes.

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

## Moved from the lessons doc (S505 compaction)

## S445 SkyCurrant (2026-10-22): a shared page per heading, MiraCosta's degree lists, Palomar's "Cert. Achievement"

- **Read the capture's own text before changing a reader.** No capture keeps the text it read, so a page read with
  `"capture_view": true` (#2336) runs the pilot's `PAGE_JS` and prints innerText plus the hidden tab panels line for
  line, a run of blank lines as one "(blank)"; since #2341 it also prints each tab panel the capture leaves out. The
  first view (39718674469) showed MiraCosta's certificates headed exactly as the two-line rule expects: the text was
  sound and the fault was in the sharing.
- **A shared page goes to each section heading's claimant (#2337).** `page_winners()` grouped sections by award kind
  and kept the claimant the page HEADING named most fully, so a discipline page heading six certificates kept one
  (Horticulture went to the A.A. sharing "Horticulture"; 15 of 16 claimants read no page). `section_match()` now
  records the heading each claimant reads (of several, the one whose own words its title names most fully,
  `heading_fit()`) and each heading keeps its fullest-named claimant. Free captures: MiraCosta 68 to 122 found,
  Foothill 144 to 185, Citrus 148 to 178, Sierra 81 to 92, Orange Coast 242 to 277; Palomar unchanged.
- **A loser's fallback must name it.** Sierra's first capture on the new rule put Mathematics A.S.-T, after it lost
  eleven pages, on the Nursing page at 0.50. A program that lost a page now takes a later one only when the page
  names it at least halfway, carries 80% of its courses, or heads its section.
- **MiraCosta's degrees are certificates plus general education.** Its Degrees tab lists each degree by title and
  says "Students may earn one of the above-named associate degrees by completing a certificate of achievement and
  the general education courses" (Computer Studies: "its respective certificate of achievement requirements"). A
  listed degree reads its certificate's section; the tab names no course, so `hidden_tabs_text()` keeps it only for
  that sentence. A listed line that IS the title outranks a two-line pair that only contains its words
  ("Associate in Arts Degrees" + "Child Development Associate Teacher" had taken Child Development Teacher's).
  "Cybersecurity" heads Cyber Security; a transfer degree's heading spans "Associate in Arts Degree" then
  "Psychology for Transfer" (#2342).
- **Palomar heads a degree-and-certificate page "Accounting - A.S. Degree Major/Cert. Achievement".** `AWARD_WORDS`
  read the A.S. and not the abbreviated certificate: 63 A.S. kept `-AS-CA` pages, 2 certificates did, and 60 of
  its 82 page-claimed certificates had their own page among the ones they lost (#2339). The other 22 never had
  their own page as a candidate.
- **Extraction re-extracts every found program** (confirmed: MiraCosta 119 for $10.02, Foothill 185 for $14.82,
  Citrus 175 for $11.56, Sierra 92 for $8.48, Orange Coast 274 for $19.44). Passing: MiraCosta 41 to 80, Foothill
  97 to 138, Citrus 122 to 145, Sierra 57 to 66, Orange Coast 138 to 189. Loads inserted 185 (49, 43, 26, 12, 55);
  display build 82d6298a0c67 (17,116 to 17,302 rows).
- **A GE page as a candidate costs extraction, not data.** 69 filed sources statewide read a GE page, about a dozen
  of them GE certificates; live, 16 loaded records come from one, 15 of them GE certificates. The load's
  other-program's-page rule keeps the majors out.
- **The handoff's page-claimed counts can be stale.** It named Ventura and Moorpark 39 and Oxnard 31; main's
  captures said 5, 1 and 10 (S442's re-reads). Tally `capture.json` across colleges before choosing the next.
- **`check_generated.sh | tail` hid a stale dependency map again** (S443's lesson); run it bare, every push.
- **MiraCosta, after #2342 (capture 39734514856):** 119 to 142 found, page-claimed 31 to 8. **Palomar, after #2339 (capture 39731740658):** 224 to 282 found, 103 to 45 (23 A.S., 21 certificates and 1 A.A. remain; 22 of those certificates never had their own page as a candidate).

### Moved from the lane (S445 compaction)

**S444:** Golden West (79) and Imperial Valley (42) loaded; department pages are candidates, a section heading may span two lines (Sierra 35 → 81 found, MiraCosta 29 → 68, its discipline pages still lose siblings); 37 Program Mapper hosts recorded (#2330).


## Moved from the main lessons (S523 compaction)

## S446 SkyMadrone (2026-10-22, the CPL Queue routine): a degree-and-certificate address, 91 records, the page-claimed that remain

- **A degree-and-certificate address names both awards (#2345).** Grossmont addresses a degree and its certificate
  on one page (`law-enforcement-as-certificate-achievement`, `arabic-aa-certificate-achievement`). The capture view
  (page read 39750446541) shows one list under "Associate Degree Major Requirements", then "Certificate of
  Achievement" and "Any student who chooses to complete only the courses required for the above major qualifies for a
  Certificate of Achievement". `SLUG_AWARD` read the certificate alone, so the A.S. scored no award on its own page
  and lost it. `SLUG_DEGREE_CERT` and `slug_awards()` read both awards. Grossmont's free capture went from 139 found
  and 15 page-claimed to 144 and 10. Main's captures held the shape at two colleges: Grossmont 9 and Pasadena City 7.
- **Palomar's 45 that remain have no catalog entry of their own.** Its curriQunet catalog lists 235 entries for 342
  programs in the state file. The pages they lost belong to siblings, and the titles drifted ("Web Design and
  Development" is now Web Front End Design; "Fashion: Buying and Management" sits under Fashion Merchandising), or
  the program is no longer listed. Reading no page is right for them, and no reader change applies.
- **The new rules did not move three of the four colleges named next.** Free captures under #2337 and #2339:
  Mt. San Jacinto 99 to 100 found and 25 to 24 page-claimed (its losers fall back to the general education or C-ID
  chart page because their own page was never found, 28 not found); Santa Barbara City 249 to 248 and 20 to 21 (its
  Administration of Justice pages were never captured). Neither is a sharing fault. Saddleback's capture was still
  running at the checkpoint.
- **Loads and rereads.** Palomar 282 found (from 224), 254 passing (from 196), $18.76; 62 inserted, 1 replaced by
  the reread. MiraCosta 142 (from 119), 98 passing (from 80), $11.96; 21 inserted, the reread replaced none (the
  extraction re-wrote only its 21 new records). Grossmont 144 (from 139), 97 passing (from 93), $10.61; 5 inserted.
  Pasadena City, the other college main's captures named with the shape: 296 to 297 found, 238 to 242 passing,
  $20.91; eight programs moved to their own degree-and-certificate page (Dental Assisting A.S. had read a sibling's),
  3 inserted, 5 replaced by the reread. Build 1b3616641146 (the first three, 17,390 rows) applied on the wave branch
  (run 39757574337); build 0ad3c75bfa19 (17,393 rows) supersedes it and applies on `main` after #2346 merges.
  Receipts are under `kb/receipts/`.
- **A display job's Applied record cannot carry a PR to merge.** The bot's commit becomes the head, and its test run
  stops at `action_required`, so no test has run on that head. Run `step=display` on `main` after the merge (the
  S420 order) whenever main has not moved, rather than holding the PR for a base merge that is not there.
- **A capture-only run's push can lag the run's "completed" state by a minute.** Read the branch head again before
  concluding that a run filed nothing.
- **The UI pass, CPL opportunity visual (#2344):** the page painted no `h1` until a college loaded, and at 360px the
  picker's longest college name widened `main`'s grid track past the viewport (`minmax(0, 1fr)` now). A dark target
  joined `a11y.config.js`.

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

## S415 SkyRedbud (2026-10-18): a printed degree floor (San Joaquin Delta), Cal-GETC's 34 (Taft), build 48cb66f19cff

- **Read the page before calling a rescore right or wrong.** Delta's 28 new arithmetic failures (S414) were the
  scorer reading "Minimum Degree Units Required: 60" as an exact total: an 18-unit major and GE 27-34 came short, and
  Nursing's 59.5 plus GE ran past 77.5. A four-page read (college-page-read 39122473643) showed the floor and the
  page's advice to double-count major courses toward GE. Four loads settled what the records alone could not.
- **A floor alone makes up a short sum.** The first step set `electives_fill_degree` from the floor's words, and the
  scorer's guard ("the record says electives fill the degree total, but the catalog text names no electives") failed
  15 records whose pages name none. `degree_verdict()`'s minimum branch now passes a short sum on
  `degree_total_minimum` alone, with `fill` naming the units; Delta's steps set only the floor. One record elsewhere
  reads differently on its next rescore: Orange Coast 10278 (37 + GE 18 under its minimum of 60).
- **A reconcile files what it set, and a later step never clears it.** The first run's `electives_fill_degree: true`
  stayed in the filed records, so the second run changed nothing for the 15. Reverting both filing commits and
  reconciling again from the clean records gave 154 passing (from 152), none lost; reread 39130341466 replaced 71.
- **Taft: Cal-GETC is the statewide 34.** Ten transfer degrees add up their major and name Cal-GETC with no units;
  Taft's own Cal-GETC page prints none (read 39122581817). Fable, asked once, chose a Taft step citing the figure
  over loosening the scorer (which would stop the degree check catching real misreads) or leaving the flag (which
  would never clear). The step cites Monterey Peninsula's GE page; 24 to 34 passing, reread 39128567443 replaced 17.
  Its card is on the sheet for Sam.
- **A reconcile step's pattern needs `\s+`.** The first Taft run matched nothing: the capture's text is innerText,
  and Taft's titles carry non-breaking spaces. The same words with `\s+` matched all ten. When a reconcile reports
  "0 filed records changed" and no unread pages, suspect the pattern's spacing first.
- **`gh run view --log` is refused here** (the log host answers 403); `get_job_logs` with `return_content` returns
  it, saved to a file when long. Parse its `logs_content` field.

## S500 SkyBlackberry (2026-10-27, the CPL Queue routine, beside Sam's own S500): Delta 22244 passes on a unit_line step (200 of 203)

- **A second reading made the same choice.** `force=22244` (run 40517095981, $0.05) left out "Associate Degree Math
  Requirement: Units 4" again and said so in its notes, as run 39217405432 had: the reader will not record a line with
  no course as a block. So a re-extract of a misread that the reader's notes already name is wasted; write the step.
- **unit_line** (a new reconcile kind) adds a printed requirement line with units and no course as a choose_units
  block of its figure with no courses, only where no block carries the label and the record's sum falls short of its
  printed total by exactly that figure. Run locally against every filed Delta record with the line injected at 3, 4
  and 5 units, it fired on 22244 alone; the five other Delta records whose notes name the phrase already pass. That
  test made a college-wide step safe where S499 feared one. Reconcile 40523400149 changed 22244 alone, 19 to 23
  against 23.
- The step changes blocks, so it joins the kinds the carry-basis test sets aside (`program_requirements_college_test`).

## S499 SkyCloudberry (2026-10-27, the CPL Queue routine): Delta Cal-GETC 45621 passes (199 of 203)

- **The same certificate, the same shape, at a second college.** Delta's Cal-GETC 45621 read 29-40 against 34 for the
  reason Hartnell's 45096 did (S495): the page prints one minimum over each area's sub-areas, and the record kept each
  sub-area as its own block with no figure. Page read 40497591551 gave the words ("Area 5 - Physical and Biological
  Sciences / Complete a minimum of 7 semester units with at least one course each from 5A ... and 5B ..."), and
  Hartnell's `pool_areas` step took a Delta pattern with no code change. Reconcile 40498068817 moved 45621 alone, 34-35
  against the floor of 34; reread 40502212690 replaced one row.
- **Pool only the areas whose sub-areas are choices.** Area 1 prints the same words over 1A, 1B and 1C, but 1C is one
  required course (rule `all`, which the step never pools), and pooling 1A and 1B alone would have counted Area 1 as
  9 plus 1C's 3. Each of Area 1's sub-areas picks one course, so they already sum to the area's 9-10. The pattern names
  Areas 3 and 5 only. Test a step against the record locally (`reconcile()`, then `program_units()`) before dispatching.
- **The four left at Delta are extraction misreads, each named in the Jev verdicts** (`kb/jev_harvest_verdicts/`):
  07304 records the elective list once more beside the three Areas that already include it; 16764 counts a block a piano
  examination can waive; 22244 leaves out "Associate Degree Math Requirement: Units 4", a non-course line that brings
  19 to the page's 23 (05612's reader recorded the same line as a choose_units block of 4 with no courses); and 19752 was
  handed the GE page. The phrase means different things elsewhere at Delta (an "or" alternative inside an area, a line
  outside the stated total), so a college-wide step would misfire. Each needs a second reading of its own page.
- **A page read's install step can hang.** Run 40496307093 sat in the Playwright install for 13 minutes; a canceled
  run and a fresh dispatch finished in two (40497591551).

## S498 SkyBearberry (2026-10-27, the CPL Queue routine): RN 03570 summed, Delta 44197 passes (198 of 203)

- **RN 03570 needed no new page read.** S485's page read 40279150362 already printed the whole AS.NRN tab, prerequisite
  list included, and every prerequisite course carries vendor units on another Hartnell record (BIO5 4, BIO6 3, BIO6L 2,
  BIO27 4, CHM22 4, ENGLC1000 3 or 1000E 4, the math choice 3 to 6, PSY25 or NRN70 3, ANT2 and SOC1 3 each,
  COMMC1000 or COM3 3, Local GE Area 6 at 3). Read Fable's way (S488), the prerequisites sum to about 35-42. The 36.5
  required NRN units bring the total to about 71.5-78.5, against the 60 the tab prints. So the build would replace an
  *incomplete* status with an *unequal* one (the catalog's 60 understates the program). That gives a better reason and
  no pass, so it was not built this run. Read a log the earlier runs left before you load the college's site again.
- **Delta 44197: a repeat count can come with its own printed sum.** Page read 40479703275 shows the words "Students
  are required to enroll four times in CAT 69V for a total of 16 units" beside "Units: 1-4". Four times the range
  would read 4-16, and the narrow `meets` reading would still fail at 43-55. So the `repeat` step takes an optional
  `total` group and keeps it as `units_total`, which the scorer reads in place of the range times n. It also reads a
  count written as a word. The record sums to 55, the page's "Minimum Units Required: 55". The printed units stay.
- **Delta's capture puts a no-break space between subject and number** ("in\u00a0CAT 69V"). Reconcile 40480236607
  moved nothing on a pattern written with a plain space. Reconcile 40484963062, with `\s` between every word, moved
  44197 alone, to 55 against 55 (equal). Write an Acalog pattern with `\s`, never a literal space. The first run also
  rescored 05630 (a certificate total that counts GE, `ge_included` 16) and 11970 (`fill` 18.5) to pass, under
  readings the scorer gained after S424, so Delta reads 198 of 203. Reread 40489395464 posted 44197 and a second
  reread (`force=40480236607`) posted the two rescores. Display build 20241d4a9117 applies on `main` after the merge.

## S497 SkyCrowberry (2026-10-27, the CPL Queue routine): Music 43887's repeat counts

- **A repeat count is a field, never a doubled figure.** The `repeat` step gives a course `times: n` and a list
  `repeats: true` with `minimum: n`; the record keeps each course's printed units, and only the scorer multiplies.
  A repeating list counts n of its least course for the low end and n of its largest for the high end. No other
  record carried either field, so no other score moved. Delta 44197 (S424) is the same gap and can take the step.
- **The pattern matched the live capture on the first dispatch** (reconcile 40466933762): "If MUS 11 is chosen, it
  must be taken for 2 semesters" and the block name "2 semesters of any of the following Courses". The run re-filed
  all 58 records again; 43887 alone moved, so the rest returned to main and the summary moved 82 to 83 by hand.
- **RN 03570 cannot take Fable's reading yet:** its record holds the four semesters and the recommended success
  courses, and no prerequisite list, so the reading needs a page read of the tab's prerequisite words first.

## S496 SkyLingonberry (2026-10-27, the CPL Queue routine): 45096 lands

- **Reconcile 40452134609 (free) moved 45096 alone in substance:** 34-35 against 34, arith equal, the units of all 163
  courses as before. The other 57 re-filed records changed only bookkeeping (`ge_overlap`, the `reconciled` log), and the
  capture flapped (43821 fell to a near miss, two Coursedog code pairs swapped order), so capture, sources and those
  records returned to main and the summary moved 81 to 82 by hand. Reread 40460714483 replaced one row; read back
  `total` 34, arithmetic `equal`.
- **A re-filed capture can lose a program the last one found.** Restore the summary from main and edit the counts,
  never take the run's summary whole.

## S495 SkySalmonberry (2026-10-27): Hartnell CalGETC 45096's area totals, the step

- **The page read named the shape; the stored record named the blocks.** Page read 40375734212 prints "Area 3: Arts and
  Humanities / A total of 6 semester units is required. Two courses required: one from Area 3A (Arts) and one from Area
  3B (Humanities)." and "Area 5 ... A total of 7"; the record (read through the Supabase MCP) keeps "Area 3: Arts and
  Humanities - Area 3A (Arts)", 3B, "Area 5A: Physical Science", 5B and 5C as figureless choose_courses blocks, so one
  `block_pattern` has to match both namings: `(?:Area {area}: [^\n]*? - )?Area {area}[A-Z]\b`.
- **`pool_areas` finished (S491's WIP):** each area's sub-areas become one choice of the printed total, named for the
  area (`{title}`), each sub-area kept in floors with its rule, a course under two sub-areas listed once (5C's laboratory
  list repeats 5A's and 5B's); 9 + 3 + 6 + 6 + 7 + 3 = 34. The text pattern reads a capture joined by newline or space.
  Eight checks in `tests/program_requirements_reconcile_test.py`; the confirm-carry check excludes `pool_areas` as it
  does `pool_lists` (a joined block's confirm does not carry).
- **Next:** the reconcile dispatched on the branch (extract 0) checks the pattern on `out/sources/45096.json`; then, as
  S489 did, restore any re-filed record that changed only bookkeeping, reread, and merge.

## S489 SkySnowberry (2026-10-26, the CPL Queue routine): lists with floors under one total

- **One printed total over lists that carry their own figures is still one choice.** Liberal Arts: Pathway to Health
  Sciences A.A. 17924 read List A: Biology (3), List B: Chemistry (4) and List C (10-11) as three blocks, 17-18 against
  18. The tab prints "Complete a total of 18 units from List A, List B, and List C" (page read 40306415059, S488).
  `pool_lists` gains `with_floors`: the lists become one 18-unit choice, each list's figure stays in the block's
  `floors`, a course listed in two of the lists is listed once (List C repeats A's and B's courses, which `repeated`
  would fail inside one block), and the step never fires where the floors sum past the total. `block_pattern` (a regex on
  the list name) stands in for `block_prefix` where the lists share no prefix.
- **The floors are kept, not scored.** The scorer sums the block's 18. A floor is a rule on which courses, like 17912's
  two-disciplines condition, and the record holds it so a curator and the display can still read it.
- Reconcile 40314109801 (free) moved 17924 alone (18 of 18; degree 60 with Cal-GETC 34 and 8 elective units). The other
  55 re-filed records changed only the `ge_overlap` flag or score bookkeeping and were restored before reread
  40318170598, which replaced one row (before-values in its receipt). Hartnell 80 to 81 of 94. Display build 19d2397e8004.
- **Still waiting on a reader change:** CalGETC 45096 (area totals over sub-areas, 5C's lab counted again) and Music
  43887 (repeat counts; the record shape has no repeat field). The 45096 step needs the tab's captured text for its
  pattern; read it from the reconcile run's `out/sources/45096.json` artifact first.

## S488 SkyThimbleberry (2026-10-26, the CPL Queue routine): Hartnell's last eight failing tabs, read

- **Every Hartnell failure has now been read against its tab** (page read 40306415059, eight tabs, free;
  plan `kb/college_reads/hartnell_unread_failures.json`). No reader change shipped; each failure sorts into one of three
  kinds.
- **The narrow `meets` class, as Sam ruled (Sheet 119 card 9, Sheet 120 card 1).** Agriculture Production 31591 (24-35
  against 27) and Sustainable Crop Management 43119 (25-33 against 27) carry ABT99 at 1-8 units; Technical Support 41819
  (15-16 against 16) carries "CIS57 OR BUS43". The printed total lies inside the range and the low end falls short, as
  for Biology 03537 and Engineering 33851. They stay failing.
- **A vendor gap stays incomplete.** Agriculture A.S. 11803's Sustainable Crop emphasis requires ABT41, which the tab
  prints with no title and the vendor with no units (as ABT82, ABT160 and MFGT75 elsewhere). Vocational Nursing 03571's
  HES120 reads "Any AHA BLS for Health Care Professional course is acceptable": no Hartnell figure exists.
- **Three wait on a reader change, each named by the page's words.** Liberal Arts: Pathway to Health Sciences 17924
  prints "Complete a total of 18 units from List A, List B, and List C" over list floors of 3, 4 and "10-11": one figure
  over lists that carry their own, which `pool_lists` (figureless lists only) does not reach. CalGETC 45096 prints each
  area's total ("A total of 6 semester units is required", "A total of 7") over sub-area blocks (3A, 3B; 5A, 5B, 5C) that
  the record sums separately, 5C's lab counted again. Music 43887 prints two repeat counts, "If MUS 11 is chosen, it must
  be taken for 2 semesters" and "2 semesters of any of the following Courses"; with both, it reads 19.5-20 against 19.5.
  The record shape has no repeat field (Delta 44197, S424, is the same gap).
- **A renumber map is college-wide, so read every tab that lists the course first.** Technical Support's tab prints
  CIS50, CIS59, CIS53 and CIS57 where the state's file lists CSS 50, CSS 169, CSS 53 and CSS 57 (same titles and units),
  so its coverage reads 0.2. But Hartnell's other passing records read CSS codes from their own tabs (31592, 31593, 43809),
  and `course_renumbers` would make the capture look for CIS on those pages too. No map was written.
- **Fable's advice on the two definition calls (asked once).** Respiratory Care B.S. 44537: compare its 40 upper-division
  units only against an upper-division figure the page prints; with only the 120 (which includes the admitting A.S.),
  keep it incomplete with that reason, and never sum the A.S. record into it (the two name different GE patterns, and the
  elective gap would read as a mismatch). RN 03570: read the prerequisite list as blocks priced from each course's own
  vendor units and Area 6 at the Local GE table's figure, label the GE "partial pattern", count a course once, and report
  the sum beside 60 with any gap standing; a course with no found units keeps it incomplete. Not yet built.
- **The display apply ran past an hour.** `step=display` run 40297886199 (build 767a48c10e89, dispatched 09:13Z) was still
  in its apply step at 10:26Z against a 120-minute timeout; S486's took about 25 minutes.

## S487 SkyHuckleberry (2026-10-26, the CPL Queue routine): Hartnell's pooled subject lists

- **One figure over several lists is one choice.** General Studies: Arts and Humanities A.A. 17912 (AA.GAH) read its
  eleven "List A: <subject>" lists as eleven `choose_units` blocks with no units. The tab prints "For the 18 units
  required, select courses in List A from at least two disciplines; from one of the disciplines select at least two
  courses." over a Completion requirement whose lists each say "Complete ANY of the following Courses" (page read
  40291523425). Its sibling Social and Behavioral Sciences 17911 prints the same words and was read as one 18-unit block,
  so the extraction, and nothing on the page, split 17912. A `pool_lists` reconcile step joins two or more figureless
  lists sharing `block_prefix` into one block of the page's figure, and never where `total_units` names another.
  Reconcile 40292405207 (free) moved 17912 alone (18 of 18 in the major, 60 with Local GE 23 and electives); 56
  bookkeeping-only records were restored, and reread 40294638373 replaced one row (before-values in its receipt).
  Hartnell 79 to 80 of 94. Display build 767a48c10e89.
- **The two-disciplines condition has no field.** It rules which courses count, never how many units; the record keeps the
  courses and the scorer checks the units.
- **A step that changes blocks needs no carry-basis change.** The basis keeps every block, so a confirm of the split
  record does not carry and the curator sees the pooled list (the college test now names `pool_lists` beside
  `course_units` and `course_hours`).
- **Read a sibling before writing a reader change.** The passing sibling showed the reading the page supports; the page
  read confirmed it before any code.

## S486 SkyQuince (2026-10-26, the CPL Queue routine): Hartnell's double-count words read as the overlap

- **A page's own words carry a ruling past the case it was made on.** Sheet 82 card 2 allowed the overlap for transfer
  degrees because Cal-GETC was the case in front of Sam; Hartnell's tabs state the same rule for local degrees ("Students
  can double-count required courses and courses for General Education."). The reconcile `set` step records it as
  `ge_overlap: true` (the kind already took a boolean, `degree_total_minimum`), and `degree_verdict` reads it beside
  `transfer_degree`. Reconcile 40285320209 (free) and reread 40287110123: Vocational Nursing 39248 (80-89 against 63),
  Addiction Studies 19718 (63 against 60) and Agricultural Mechatronics 43809 (70-79 against 60) pass; Hartnell 76 to 79.
- **A new reconcile field joins the confirm carry basis.** `tests/program_requirements_college_test.py` requires every field
  a step fills to be one `program_record_carry_basis` leaves out, so the function changed with the step (supabase-migrate
  run 40285298395); otherwise a confirmed record would lose its confirm on the next reread for a flag alone.
- **The transfer tabs print the same words**, so the step re-filed 52 transfer records with the flag and no verdict change.
  As in S484, every record whose verdict stood was restored before `step=reread`, which then posted three.
- **The display build needs openpyxl** (`python3 -m pip install openpyxl`; the bare `pip` here installs to another
  interpreter). Build 8052e240575a changed only the build stamp in `cpl_pathways_roep_data.js`.
