---
title: "Session 704 handoff (from SkyDovekie, S703, the CPL Queue routine's 10:12Z firing of 2026-11-22) — DRAFT, the declaration"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is the CPL Queue routine's. A plain session Sam opens follows `docs/session_702_handoff.md`
(SkyMurre's, S701) or the newer plain handoff that session writes. **Numbered 704, not 703:** Sam's next plain session
(SkyRazorbill, S702, named by handoff 702) writes `docs/session_703_handoff.md`, so this run takes S703 and the moniker
SkyDovekie, and its handoff takes 704.

**DRAFT.** This file is the run's declaration and its college split, written before any worker started. The
checkpoint rewrites it.

## The start

The 10:12Z firing found S701 (Sam's plain session) live: it pushed #3671 at 10:12:50Z, with no declared side-session
scope, so the firing stood down. S701 signed off at 11:00Z (checkpoint #3672, `main` 660218c6). At about 11:03Z Sam
said, live: *"/coord and keep going. I will be starting another session but don't let that stop the queue."* This run
proceeds as the routine's conductor, beside the plain session he starts.

No `list_sessions`, `get_trigger`, `get_session` or `set_session_tags` in this session; no peer in `ListAgents`.
Open PRs at 11:04Z: dependabot's #3383 only. `daily-dashboard.yml` ran on 2026-11-22 (`e547f007`, 06:22Z); the Pages
deploys after #3669 and #3670 succeeded, so the brief's failed deploy (run 44973859667) is superseded. No pause line.
Three repos attached. No `queue_todo_done` row since 2026-11-21. Hooks: `LIVE (root)`, merge-read and clock guards
yes. Disk: 58 GB free.

## Scope (for /coord: the plain session reads this)

Collection only, under handoff 699's NEXT and the COBIx brief of 2026-11-21 on #3358. Files: the program-requirements
harvest's readers and records (`kb/_program_requirements_*.py`, `kb/college_reads/`, `kb/program_requirements/`,
`kb/receipts/`), the outline readers and their gates, `kb/status/program-requirements.json`, the harvest lane and
lessons, and the Commons data files a records change rebuilds (`kb/_build_commons_status.py`,
`kb/_build_commons_data_status.py` outputs). Shared ground: `program_requirement_records` and the outline tables
through their workflows; no cron change, no public page, no public KB. **One writer per file:** the plain session keeps
the Subjects and Commons page files (`commons_subjects.js`, `kb/*subject*`, `lanes/commons.md`); this run keeps the
harvest files. On a conflicted Commons data file, take `main`'s side and rerun both builders
(`p-commons-files-conflict-between-prs-s697`).

## The college split (written before any worker started, 11:08Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when its
lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`). Ordered by Sam's work order
(`r-collect-for-mids-work-order-sam-2026-11-20`): outline fills first, program records second.

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `outlines`:** City College of San Francisco's outline recall gate refreshed on `main` (8c95dee8 against the
  trial's d5cef493, `f-ccsf-outline-gate-stale-on-main-s691`), then San Diego College of Continuing Education's
  outline index search (191 cards), a 12-page trial with its recall file, and the full read. The conductor dispatches
  the paid read and the load. Colleges: City College of San Francisco (the gate only), San Diego College of Continuing
  Education.
- **Worker `pins`:** Clovis Business 33432, 33433, 33487, 33491 and Social Science 33492 (a page-break pin and a
  reread), and Cosumnes River 20147, 20193 and 20227 (their own page) and 33053 (a pin). Free pricing with `only`
  first; the conductor runs each paid read under $40 per college. Colleges: Clovis, Cosumnes River.
- **Worker `glendale`:** Glendale's 11 with no record file (40846, 40847, 21302, 38973, 24377, 24327, 37070, 36599,
  36601, 11155, 21303), then Butte's read now that its address compare landed (#3641). Free pricing first; paid reads
  under $40 per college. Colleges: Glendale, Butte.

**Lane 2, the cheap piles (one Opus 5.5 worker, high effort, free rule work).**

- **Worker `piles`:** lever 2, the general education pattern's units rule (192 statewide), and lever 3, the noncredit
  hours total (100), applied at every college except the lane 1 colleges above while they are in flight; the
  catalog-wording rules at Santa Monica (30) and Santa Rosa Junior (27). Each new matcher runs its self-recall test
  first. Colleges: every college the two rules touch, less City College of San Francisco, San Diego College of
  Continuing Education, Clovis, Cosumnes River, Glendale and Butte.

**The conductor's own:** the merges, the paid-run checks against the caps, the display build once after the posts,
`harvest-gap-census.yml` against 4,839, the Spend line and the checkpoint.

**Held to a later slot in this run:** the free page-finding levers (Ohlone 36, San Joaquin Delta 30, Mt. San Antonio
28, Santa Barbara City 28, Orange Coast 27, then City College of San Francisco 53) go to a fresh lane 1 worker when a
checkout frees; Glendale's 28, Clovis's 14 and City College of San Francisco's 28 wording rules go to lane 2 after
lane 1 signs off at those colleges. Each move is written here before it starts.

## Split changes during the run

- 11:25Z: `glendale` found all 11 Glendale programs `not_found` with no text, so `only=` refuses them before any model
  call. Six have an own page whose coverage is low; five have none. **DECIDED** `d-glendale-own-pages-filed-as-gaps-s703`:
  no change to the shared `_ranked`/`candidates` tonight (the coverage bar would still stop the six); the 11 are
  filed as named gaps in #3675, and the data-names-the-program lever goes to the night's one follow-up.
- 11:28Z: `piles` lever 2 (`ge_units_not_read`, 152 records at 35 colleges, self-recall 1,685 right and 0 wrong) is
  PR #3678; a second reader reads it from `/home/user/rd3678` before the guarded UPDATE runs. `piles` moved on to lever
  3 (the noncredit hours total) on `claude/s703-piles-nc-hours`.
- 11:33Z: Glendale 38973's state list is a re-prefix (OBT printed as STV): **DECIDED**
  `d-glendale-obt-stv-prefix-alias-s703`, a per-college alias in Glendale's reconcile entry (#3675).
- 11:38Z: the second reader on #3678 found 21 of the 152 print a general education figure (the free `ge_units_steps`
  lever passes them) and that the self-recall reads the fields the rule reads. **DECIDED**
  `d-ge-gap-only-where-no-figure-s703`: hold the 21 by key; the gap applies only where the notes say no units are
  printed, or are silent and the page text shows no figure; a precision count is committed. The reader moved to
  #3679 (lever 3, 70 records) from `/home/user/rd3679`. The run holds six open PRs against the cap of three, so
  `piles` builds the wording rules on a local branch and opens no PR until the count drops.
- 11:44Z: City College of San Francisco's gate cannot be refreshed by code (the trial saved no pages): **DECIDED**
  `d-ccsf-gate-refresh-by-free-trial-s703`, a free 12-page trial on `main`'s parser and a recount by `outlines`, no
  staff name filed. San Diego College of Continuing Education: index 45016944119 (199 of 228 codes have an outline),
  trial 45017581874 at 12 of 12 after two load-side fixes, full read 45018663453 (free, 199 pages); the load waits
  on a second reader of the `_course_outcomes_load.py` change.
- 11:48Z: #3676 merged (`d8b5e4ee`, the recall-refusal test), files disjoint from #3673's (`d-merge-on-clean-when-files-disjoint-s691`).
- 11:46Z: paid reads dispatched on `claude/s703-pins`: Cosumnes River 45018951701 ($0.36 actual) and Clovis 45018954283
  ($0.23 actual). **DECIDED** `d-clovis-through-pin-to-followup-s703`: Clovis 33432 and 33492 wait on a `through`
  pin field in the night's follow-up (a shared reader change); `d-clovis-management-is-the-standalone-degree-s703`.
- 11:55Z: round two of the second read passed #3678 (131 rows) and #3679 (50 rows after holding 19). The second
  reader held #3677's load: its fix dropped HMID 535's 11 real objectives. **DECIDED**
  `d-legacy-objectives-kept-when-only-copy-s703`; fixed on #3677, only the two target rows change across 144 reads.
- 12:02Z: #3678 applied by supabase-migrate 45019924640 (returned 131, none skipped); live: 131 rows at 29 colleges
  hold `ge_units_not_read`.
- 12:13Z: **DECIDED** `d-sdcce-load-objectives-only-s703`: San Diego College of Continuing Education loads objectives
  only (198 rows, 1,860 objectives); its 6 SLO rows read field labels and go to the follow-up. Load 45021318423 on
  `claude/s703-sdcce-load` finished 12:17Z. Cosumnes River reread 45021161151 done; Clovis reread 45022017976 running.
  Butte's capture (45016561973) runs about 91 minutes, as its last did.
- 12:31Z: Cosumnes River load 45022641854 done: 3 new, 4 replaced at the two colleges, 5 of 7 passing.
- 12:38Z: #3678 merged (`5dbc743d`). 12:44Z: #3679 applied by supabase-migrate 45023631381; live: 32, 11 and 7, 50 rows
  at 11 colleges. **DECIDED** `d-clovis-two-gaps-existing-rules-s703`: Clovis 33433 and 33491 take the existing
  `total_not_printed` and `total_differs` gaps without a new second read.
- 12:50Z: the free page-finding levers moved to a fresh lane 1 worker, `levers`: Ohlone, San Joaquin Delta, Mt. San
  Antonio, Santa Barbara City and Orange Coast (lane 2 has nothing in flight at Orange Coast; #3678's 11 there stay).
  City College of San Francisco's 53 stay for a later run. `piles` signs off after #3679's closing commit; the
  wording rule (`claude/s703-piles-wording`, 49 rows) goes to a fresh lane 2 worker once #3679 merges.
- 12:50Z: Clovis 33433 and 33491 applied by supabase-migrate 45024254789 (2 of 2; live `total_not_printed` 40 and
  `total_differs` 50). 12:52Z: San Diego College of Continuing Education's load confirmed live, 198 rows, 1,860
  objectives, 198 courses.
- 13:00Z: Butte 39882 (page moved) read at $0.05 on `claude/s703-butte` (Glendale 38973's pricing holds the other
  branch's concurrency group), reread, load 45026794241. Peralta (worker `peralta`, the four Peralta colleges) started
  12:55Z: index 45025388165 (2,201 codes; 376 shared by two to four colleges), shape trial 45026998155; its reader change
  for shared codes waits on #3677 and a second reader. The night's one follow-up went to worker `followup`
  (`claude/s703-followup`: S697's four, the `through` pin field, the named-gaps tag).
- 13:15Z: **DECIDED** `d-levers-paid-under-5-delegated-s703`: `levers` dispatches paid reads to $5 a college per run
  after free pricing. Ohlone: 2 of 36 found and loaded (45026280729, 2 inserted, $0.14); 34 filed as named gaps.
  San Joaquin Delta: six apprenticeship pages bound by per-college prefix aliases; 24 filed as gaps; pricing running.
- 13:18Z: #3679 merged (`94406494`). `piles2` took the wording rule with both of tonight's second-read fixes
  (a claim check, boundary readings and a precision measure). #3677 merged `main` (54b754e9); #3681 waits behind it.
