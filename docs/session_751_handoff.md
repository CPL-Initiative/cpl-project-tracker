---
title: "Session 751 handoff (from SkySandpiper, S750, the CPL Queue routine's collection run of 2026-11-28, from 13:12Z)"
created: 2026-11-28
updated: 2026-11-28
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Conductor model: Fable 5.2 (claude-fable-5-2), as this run's header reports, matching the routine's form.
get_session is not among this run's tools, so the header is the only readout.**

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write, never this file.
**Numbering.** Handoff 749 (S748 SkyStilt) named SkySandpiper for the routine's next session, to take the next free
number. Sam's plain session in flight at the start carries S749 on its PRs (#3948, #3949) and will write 750, so this
run is S750 and writes 751.

*(Declaration, written at 13:16Z before any worker started; the sections after the log are written at the checkpoint.)*

## The start (13:12Z firing, 2026-11-28)

- Brief: COBIx's on #3358 (comment 6894464154, Fri Nov 27, written 6:45 PM PT, `main` at `205e6cae`); it predates
  S748, so handoff 749's *Open work* and the lane's NEXT lead where the two differ.
- One writer: no `list_sessions`, `get_trigger` or `get_session` here. Open PRs at 13:13Z: Sam's S749 drafts #3949
  (common-subject picks, 13:12Z) and #3948 (CIP taxonomy, 13:06Z), a plain session on subjects and CIP, which never
  stands the queue down; COBIx's #3937, #3926 and #3917 (subject titles, Sam's or COBIx's); dependabot's #3383.
  None is a queue session's. S748's checkpoint #3940 merged at 12:22Z. This run leaves all six.
- Step 0: not the night's first firing; the daily dashboard ran (`25706b02`, 06:26Z).
- No pause line (handoff 749). Three repos attached. `check_hooks_live.py`: ROOT LIVE.
- Rule 8's memory read: S748's 13 rows and S749's four; nothing since on the harvest.
- Census on `main` (46141774235, 11:55Z): 15,698 of 20,282 pass, 3,888 have no passing record, 696 are collected with
  a named gap.
- **Spend aim:** about $200 for this run, no new worker after about $150 (S748 spent about $184 of today's $750, and
  Sam's plain sessions are unmetered).

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college. Workers run Fable 5.2 at high effort; plan
readers Sonnet; shared-code readers Fable 5.2. No Opus worker is planned. The conductor alone dispatches paid reads,
rereads, loads and `.apply`, and holds every Supabase call.

- **Lane 1 (collection):**
  - `found`: the found-pages change, round 2 (lane NEXT (3)), then the one-program probe (Skyline 05809) and the read
    of the found pages. Colleges: Skyline, Allan Hancock, San Mateo, Diablo Valley, San Joaquin Delta, Gavilan,
    Glendale, Cabrillo, Coastline, Feather River, Napa Valley, Lemoore. Saddleback's one and West Valley's one stay out
    (not tonight).
  - `display`: the display build carrying S748's 41 records (NEXT (2)), gate college Glendale, then the census on
    `main`. It runs first, before any apply.
- **Lane 2 (cheap piles, one worker):** `piles`: the coverage-omits records to assign under
  `state_course_not_on_page` (NEXT (6)) at Cerritos 02235, Citrus 02333, Marin 46242, Foothill 11827 and 43194, Irvine
  Valley 44922, Madera 39810, Palomar 08929 and 22528; the census reading college-named gap files (NEXT (4), code
  only); College of the Canyons 37868's failed read, its log (NEXT (7)); discontinued flags, units rules and retired
  courses over its colleges; at its land, the Spend line's builders and the Commons page counts. Colleges: Cerritos,
  Citrus, Marin, Foothill, Irvine Valley, Madera, Palomar, College of the Canyons.
- **Not tonight:** Diablo Valley 39775 (the college is lane 1's tonight); Porterville 33085 (the 06773 guard first);
  Porterville; Saddleback; West Valley 35588, Southwestern and Pasadena City; Antelope Valley and Mission; College of
  the Desert (robots.txt); Los Medanos; Solano 43134 and Santa Monica 43767 (a person's); the six records the Blocks
  table of handoff 749 leaves to a person; Cosumnes River's `set` step and the reader changes of NEXT (8), if the run
  has room after the found pages.

## Split changes during the run

- 13:16Z: the declaration pushed; `found`, `display` and `piles` started on Fable 5.2 at high effort.
- 13:33Z: `display` stop 1, its last (`claude/s750-display`, `52b8a23a`): build `366c5bbc7b2d`, 18,754 statements (two
  programs gain a display: San Bernardino Valley 31858, Coastline 43057), the build code unchanged. The conductor's
  baseline (13:34Z): `229a759101f7` 18,751, older builds 32, none 2. The Glendale step dispatched on the branch.
- 13:37Z: the Glendale step 46150062374 green. The gate (14:58Z): `366c5bbc7b2d` 242 at Glendale, `229a759101f7`
  18,509, older builds 32, none 2, as the worker's count foretold.
- 14:57Z: `piles` stop 1 (`claude/s750-piles`, `8d83103e`): plan s750a, `state_course_not_on_page` (coverage true, no
  gap) at eight records: Cerritos 02235; Citrus 02333; Marin 46242; Foothill 11827, 43194; Irvine Valley 44922;
  Palomar 08929, 22528; each agrees with a free page read (46149637666, 46150287204). Dropped for a person: Madera
  39810 (its page heads the core "41-47 units" over 39.5 units of courses, so the page counts the course it omits).
  College of the Canyons 37868: run 46121986278 stopped at the price step, $0, nothing filed; staging holds 37868 as
  `not_found` (its source carries neither `page_check` nor `pinned`); a fresh free capture comes first. s750a to a
  Sonnet second reader; `piles` goes on to the Canyons capture, the census change and the land's builders.
- 14:59Z: the whole display build dispatched on `claude/s750-display`.
- 15:05Z: the whole display build 46157422439 green. The closing count (15:16Z): `366c5bbc7b2d` 18,753, `229a759101f7`
  none, older builds 32, none without a build. The display land opened as draft #3953 (`claude/s750-display`).
- 15:15Z: `piles`' second report, its last (`claude/s750-piles`, `bf617f75`): the free Canyons capture 46157462134
  (`claude/s750-piles-coc`) still reads 37868 as `not_found` (rule B then A), so it needs a `pdf_pages` pin for page 78
  before another capture and a paid read of about $0.10; the census change redone in its own commit (`0919feab`: the 78
  stay in the gap, labeled `college_named`; pass 15,698, none 3,888, named gap 696 before and after; seven mutations
  red); the Commons builders rebuilt (`bf617f75`), to land after s750a's apply.
- 15:20Z: s750a's reader (Sonnet): APPLY (the eight pages' printed rows exclude the state's course and each stated
  total is met without it; none has Madera's shape; eight mutations of its own turn the test red; MINOR: a later
  reconcile rescores coverage false again, so the plan reruns after one). The conductor's pre-read: 8 of 8 on run,
  record and checks, none checked, but one matching confirm: Cerritos 02235 carries Sam's confirm verdict of 2026-10-15
  (verdict 36) on the live record. A person-settled record stays untouched (`d-cerritos-02235-person-confirmed-s750`):
  `piles` narrows the plan to seven; no second reader round for a row removed.
- 15:22Z: `found` stop 1 (`claude/s750-found`, `21f0f3ee`): the extract function v13 reads an empty closed list only
  beside `no_closed_list: true` (the runner declares it for `catalog_lookup` sources only); `score()` sets coverage
  false at zero listed courses with gap `no_state_course_list` (1,523 passing records rescored against an empty list:
  0 pass); the opt-in only asks, and the capture files found pages at a college only where its own recall is at least
  0.8 over at least 30 tested with none wrong. Recall on filed pages, with an oracle chosen on course codes while the
  rule reads title and award: eleven colleges clear; Glendale does not (8 right of 165; its filed rows name programs
  by code). S748's Skyline capture filed 0 of 55, by inference because Skyline serves each page as `.php` and `.xml`.
  Six free captures running (Skyline 46155715421, Allan Hancock 46155901281, San Mateo 46157242032, Diablo Valley
  46157353221, San Joaquin Delta 46157465447, Gavilan 46157620485). The function deploys from `main`
  (`cpl-chat-deploy.yml`), so the land comes first. To a Fable 5.2 second reader.
- 15:34Z: the found-pages reader (Fable 5.2): GO WITH (land and deploy; before the paid probe, fix one MAJOR and see a
  free Skyline capture file pages). Not refuted: 3,163 filed records rescore the same on both trees and 22,357 filed
  sources stage the same; zero listed fails every pass path; only `[]` beside `true` reads; 0 false finds of 1,453 with
  each subject's own page removed; four guards removed turn 12 checks red. MAJOR: the display build's
  `no_state_list()` reads `coverage.basis` alone, so a no-list record would reach CPL Pathways as "0 of 0 placed".
  Of consequence: a found-page record stays "no passing record" (`coverage_fails`) until a `no_state_course_list` rule
  in `kb/_program_named_gaps.py` writes the gap and `collected_with_gaps` admits it. `found` fixes the MAJOR, merges
  `main`, reads the six captures and dispatches the five held free ones.
