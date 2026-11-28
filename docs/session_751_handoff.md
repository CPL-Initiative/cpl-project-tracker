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
run is S750 and writes 751. The routine's next session is **SkyDowitcher**, to take the next free number at its start.

*(Declaration, written at 13:16Z before any worker started; the sections after the log were written at the checkpoint.)*

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (comment 6894464154, Fri Nov 27, 6:45 PM PT, at this writing),
   and comment 7064588752 (Sam's two rulings of 2026-11-21), before the split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712: *"No need for the Cobix check ins for now"*
   (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone. Fetch a branch by name; a worker's push counts once `git ls-remote` shows its head
   (`p-worker-push-proved-by-ls-remote-s731`). Fetch `main` by name first (`p-shared-clone-origin-main-stale-s739`).
   The harness pins each worker to its own worktree (`f-harness-pins-worker-to-worktree-s748`).
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop
   a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at sign-off:** the display land #3953 has merged (`91bffc66`, confirmed on `origin/main`); s750a's
   land (`claude/s750-piles` with the apply's receipt) merges once the apply's migrate closes green; #3954, the
   found-pages code, off for every college, merges if its `test` is green; this checkpoint, #3950, merges last, with
   one update from `main` right before its merge. **Pending at this writing:** the apply's result, the land's PR and
   #3954's merge (the Ledger). Open beside them: Sam's S749 draft #3955 (a re-mint dry run), COBIx's #3951, #3926 and
   #3917 (Sam's or COBIx's) and dependabot's #3383, which waits.

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
- 15:50Z: `found` stop 2, its last (`claude/s750-found`, `f654050f`, `main` merged): the display hold-back fixed (the
  build stamp and its 18,754 statements unchanged). **No paid read is available:** the five captures that came back
  filed no found page, because each college's live recall counted a wrong answer (Skyline 42 tested, 35 right, 1 wrong;
  San Mateo 55, 47, 3; Diablo Valley 200, 189, 2; San Joaquin Delta 204, 197, 1; Gavilan 81, 72, 2) and the gate asks
  for none. Of the nine wrongs, four look like the oracle's error (a passing record read from another award's page: San
  Mateo 05745, 10927, 33393; Diablo Valley 12908), two are the lookup taking an older catalog version (Skyline 39394,
  Diablo Valley 12142), three are unread (Gavilan 21292, 30577; San Joaquin Delta 22252). The `.php`/`.xml` inference
  is untested. Free captures still out: Allan Hancock 46155901281, Cabrillo 46161446837, Coastline 46161449846,
  Feather River 46161452860, Napa Valley 46161456023, Lemoore 46161458595. The conductor holds the gate as it stands
  (`d-found-pages-gate-held-s750`): the code lands off for every college as draft #3954, with no deploy and no probe.
- 15:55Z: `piles`' third report (`claude/s750-piles`, `127c2575`): s750a at seven rows, Cerritos 02235 named as a
  person's. #3953 (`test` green on `e46b6bc8`, thread empty) merged, `91bffc66`, confirmed on `origin/main`. The clean
  pre-read: 7 of 7 on run, record and checks, none checked, no matching confirm. The apply pushed on
  `claude/s750-apply` (`4415bc40`).

## What shipped

In all: **7 records collected, pending the apply's result** (plan s750a turns coverage true at seven records; migrate
46161770404 was in progress at this writing), no outline rows, no paid read ($0 of reads; page reads and captures free).
The display build `366c5bbc7b2d` carried S748's 41 records to the page. A **full checkpoint** (a Rule 10 data write and
a display build ran); it skipped step 2 (`kb/README.md`: the build code is unchanged), step 3 (`README.md`: no
user-facing surface changed), step 5 (no KB note cleared the bar: the gate question is still open) and step 7 (the
Pipeline tab: no roadmap row, auditor count or re-mint moved). The census at the start is in *The start* above; **the
closing census is pending** (`harvest-gap-census.yml` on `main`, after s750a's land).

**Merged.**
- **#3953, the display land** (`claude/s750-display`, merged `91bffc66`, confirmed on `origin/main`; `test` green on
  `e46b6bc8`, thread empty): build `366c5bbc7b2d`, 18,754 statements, the build code unchanged.

**Open at this writing.**
- **#3954, the found-pages code, round 2** (`claude/s750-found`, `f654050f`, draft): off for every college, no deploy,
  no probe. It merges at sign-off if `test` is green.
- **s750a's land** (not yet a PR): `claude/s750-piles` (`127c2575`: the plan, the census change `0919feab`, the Commons
  builders) with the apply's receipt from `claude/s750-apply` (`4415bc40`), then the census on `main`.

**Live.**
- The display build: 18,753 records at `366c5bbc7b2d`, 32 at three older builds, none without a build (15:16Z).
- Plan s750a, **pending**: Citrus 02333; Marin 46242; Foothill 11827, 43194; Irvine Valley 44922; Palomar 08929, 22528
  read coverage true under `state_course_not_on_page`, all passing, no named gap filed.

## Read in order

1. This file's *Open work*, then `docs/reference/lanes/program-requirements-harvest.md`, *S750's posts* and *NEXT*.
2. `docs/program_requirements_harvest_lessons.md`, *S750* (the gate held, the lessons, the readers' MAJORs and MINORs).
3. `docs/reference/conductor_mode.md`, *Back for collection only*, and COBIx's newest brief on #3358.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's), by the lane's NEXT:
   - First, close what this run left pending: s750a's migrate result, its land, #3954's merge, then
     `harvest-gap-census.yml` on `main` (NEXT (2) and (4)).
   - NEXT (3): **the found pages, the gate question.** Read the nine wrongs (four look like the oracle's error, two are
     an older catalog version, three are unread; the log at 15:50Z); decide, under a Fable second reader, whether a
     wrong that is the oracle's error counts against the "none wrong" gate; then a free capture that files pages, the
     deploy (`cpl-chat-deploy.yml`, from `main`), the one-program paid probe (Skyline 05809), and a
     `no_state_course_list` rule in `kb/_program_named_gaps.py` with `collected_with_gaps` admitting it where
     `coverage.no_list` is the sole reason, the record is from its own page, places at least one course and adds to a
     printed total. Then 194 programs at 14 colleges for about $19. Six free captures were still out at the close
     (the Ledger).
   - NEXT (5): Cosumnes River's `set` step (`claude/s748-keys-crc`, `6a4fe94a`; a test pins the college free of it).
     Not reached.
   - NEXT (6): the coverage-omits records left: Diablo Valley 39775; Porterville 33085 (the 06773 guard first). s748c
     and s750a rerun after any reconcile that rescores their records.
   - NEXT (7): College of the Canyons 37868: a `pdf_pages` pin for page 78, a free capture, then a paid read of about
     $0.10.
   - NEXT (8): reader changes, not reached: Reedley 30465, Los Angeles Pierce 19181, Grossmont 21402, Mt. San Antonio
     43777 and 43999, Sierra's `or_units` step (40181, 31922, 31923).
   - NEXT (9): the follow-up PR, not reached: the Porterville 06773 guard first, then the minors, old and new (lessons,
     *S748* and *S750*, *Readers' MAJORs and MINORs*).
   - NEXT (10) and (11): the older holds and queue. Step 11: the outline queue is empty until a census, a capture or a
     verdict row changes (NEXT (1)).
   - **For a person, added:** Cerritos 02235 (confirmed by Sam on 2026-10-15; coverage still reads false); Madera 39810
     (the page counts the course it omits). The six of handoff 749 stand.
2. **`common-subjects-reference`** (a plain session's; conductor runs stay on collection): its NEXT (S744) in the
   lane, with `commons`, which Sam's plain sessions hold (S749 filed his Nov 28 alignment, #3952). Not worked here.
3. **A plain session's, each by its lane's NEXT:** `implementation-funding` (27,661 bytes against 20,000: compact
   first); `cer-procedures` (21,633: compact first); the rest as handoff 748 lists them.

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

Handoff 743's table and handoff 749's rows stand in every row this run did not clear; the rows below changed.

| Block | Who clears it | Since |
|---|---|---|
| The found pages: the "none wrong" gate held every college on live recall; nine wrongs to read (#3954, `f654050f`) | Sky, a Fable second reader, then the free capture, the deploy and the paid probe | 2026-11-28 (S750) |
| A found-page record stays "no passing record" until a `no_state_course_list` rule writes its gap | Sky, with the gate decision | 2026-11-28 (S750) |
| College of the Canyons 37868: needs a `pdf_pages` pin for page 78 | Sky, the pin, a free capture, a paid read of about $0.10 | 2026-11-28 (S748, restated S750) |
| Diablo Valley 39775; Porterville 33085 (coverage-omits records left to assign) | Sky, a guarded plan; Porterville after the 06773 guard | 2026-11-28 (S748) |
| Cosumnes River's `set` step (`claude/s748-keys-crc`, `6a4fe94a`): a test pins the college free of it | Sky, with a second reader | 2026-11-28 (S748) |
| Reedley 30465; Los Angeles Pierce 19181; Grossmont 21402; Mt. San Antonio 43777, 43999; Sierra 40181, 31922, 31923 | Sky, reader changes with second readers | 2026-11-27 (S742) to 2026-11-28 (S748) |
| Cerritos 02235 (Sam's confirm stands; coverage reads false); Madera 39810 | a person | 2026-11-28 (S750) |
| San Jose City 22225; Allan Hancock 19928; Sierra 33639; Reedley 20762; East Los Angeles 31017; Sierra 21525 | a person | 2026-11-28 (S748) |
| The follow-up PR: the Porterville 06773 guard, then the minors from S748's and S750's readers | Sky, the follow-up | 2026-11-28 (S748) |

Cleared this run: the display build for S748's 41 records; the census reading college-named gap files, redone
(`0919feab`; it lands with s750a); the found-pages code's three round-2 fixes and the display hold-back; seven of the
eleven coverage-omits records (pending the apply's result).

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current). Every call
this run was the conductor's, recorded below and reversible. Two more records wait on a person's look: Cerritos 02235
and Madera 39810.

## Decisions Sam made

None this run. Sam's words in this session: none. The run acted on his routine prompt of 2026-11-17, his
collect-with-gaps ruling of the same day (`sam-collect-with-gaps-2026-11-17`), his work order of 2026-11-20 and his
cost rules of 2026-11-25. His confirm verdict of 2026-10-15 on Cerritos 02235 (verdict 36) was found standing on the
live record and left untouched.

## Decisions (the conductor's, each reversible)

- `d-cerritos-02235-person-confirmed-s750`: the pre-read found Sam's confirm on the live record; the plan narrowed to
  seven. A plan's pre-read expectation is not proof without a live read.
- `d-found-pages-gate-held-s750`: the "none wrong" gate held every college on live recall; the conductor did not loosen
  a gate its reader had just passed. The code lands off, with no deploy and no probe.
- `d-madera-39810-for-a-person-s750`: the page counts the course it omits, so the reading does not apply.
- `d-canyons-37868-needs-pin-s750`: a `pdf_pages` pin for page 78, a free capture, then a paid read of about $0.10.

Memory rows: `kb/migrations/2026-11-28_s750_cpl_memory_rows.sql` (8 rows, all proposed, INSERT-only with
`ON CONFLICT DO NOTHING`, rollback in its header), drafted by the checkpoint-docs worker, applied by the conductor.

## Patterns that worked

- **The display build first, before any apply:** one worker, the Glendale step as the gate, the count foretold, then
  the whole build and its land.
- **Plan, second reader, the conductor's live pre-read, one apply** on `claude/s750-apply`: the pre-read caught a
  person's confirm the plan and its reader could not see (`p-preread-catches-person-confirm-s750`).
- **A reader's GO WITH carried out in order:** the MAJOR fixed and the free capture read before any paid probe; the
  captures then showed there was nothing to probe, at $0.
- **A free capture on a sibling branch per college** (`claude/s750-found-*`, `claude/s750-piles-coc`).

## Findings

- `f-found-pages-live-recall-counts-wrongs-s750`: recall on filed pages cleared eleven colleges; live recall at the
  capture cleared none of five, and four of the nine wrongs look like the oracle's error.
- `f-display-no-list-holdback-s750`: the display's `no_state_list()` read `coverage.basis` alone; fixed in `f654050f`.
- `p-preread-catches-person-confirm-s750`: see *Patterns*.
- Worker commit trailers name Opus 5.5 because `.claude/agents/worker.md` says so; the workers ran Fable 5.2.

## Safety patterns to honor

All of handoff 743's and 749's. New this run: a live pre-read looks for a person's confirm on every record a plan
names, and a person-settled row leaves the plan; a gate a second reader just passed is not loosened in the same run;
the extract function deploys from `main`, so a function change lands before any read that needs it; a no-list record
never reaches CPL Pathways. Never file a person's name from an outline page anywhere. A permission-check refusal is
never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Back for collection only*; review rounds as his ruling of 2026-11-20 sets them). Settings block (Sam, 2026-11-11, his
latest change; the block copied from `docs/reference/conductor_mode.md`):

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx; the routine's form sets the model and ultracode;
  medium effort lives in its prompt. This run Fable 5.2 served the conductor, as the form names.
- Ultracode on. The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`); this run no Opus worker ran: `found`, `display` and
  `piles` ran Fable 5.2 at high effort, s750a's plan reader ran Sonnet, the found-pages reader ran Fable 5.2, pr-gate
  ran Haiku twice, and the checkpoint-docs worker ran Fable 5.2.
- A worker building anything that writes shared data or changes an apply runs at **high** effort.
- A review workflow uses **at most 9 agents in all**, readers and second readers together.
- **Cost limits:** $40 per college per run, on the estimate, for program-requirements extraction, and a separate $40 per
  college for SLOs, PLOs and course objectives; per run, never a remaining pot. Paid runs go through the conductor.

Also: two lanes, never on one college; about $750 a day for everything, $10k running total for the whole job; stop rules
from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline row; a
rollback that undoes over 1% of a day's rows; the $10k checkpoint. This run aimed at about $200, with no new worker after
about $150.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3950 (`claude/nice-maxwell-smmt1u`) | the declaration, the log and this checkpoint (draft, docs only) | merges last, after one update from `main` |
| #3953 (`claude/s750-display`) | merged `91bffc66`; the branch is gone | none |
| #3954 (`claude/s750-found`, `f654050f`) | draft: the found-pages code, off for every college, no deploy, no probe | merges at sign-off if `test` is green (pending); then NEXT (3) |
| `claude/s750-apply` (`4415bc40`) | s750a's apply pushed; migrate 46161770404 in progress at this writing | pending: its result, `.apply` restored, the receipt into the land |
| `claude/s750-piles` (`127c2575`) | plan s750a at seven rows, the census change `0919feab`, the Commons builders | pending: the land PR with the apply's receipt, then `harvest-gap-census.yml` on `main` |
| `claude/s750-piles-coc` | College of the Canyons' free capture 46157462134: 37868 still `not_found` | NEXT (7): the pin first |
| `claude/s750-found-*` siblings | free captures read: Skyline 46155715421, San Mateo 46157242032, Diablo Valley 46157353221, San Joaquin Delta 46157465447, Gavilan 46157620485 (none filed a found page) | NEXT (3): the nine wrongs |
| `claude/s750-found-*` siblings, still out at the close | Allan Hancock 46155901281, Cabrillo 46161446837, Coastline 46161449846, Feather River 46161452860, Napa Valley 46161456023, Lemoore 46161458595 | read each with NEXT (3) |
| `claude/s748-readers-found`, `-found-skyline` | superseded by `claude/s750-found` | none |
| `claude/s748-keys-crc` (`6a4fe94a`) | Cosumnes River's `set` step, parked | NEXT (5) |
| `claude/s748-paid-sjcc`, `claude/s748-post-sierra` | San Jose City 22225 and Sierra 21525, each a person's look | a person |
| Harvest gap census on `main` | 46141774235 (11:55Z): 15,698 pass, 3,888 without, 696 with a named gap | pending: a run after s750a's land |
| #3955 | Sam's S749 draft (a re-mint dry run) | Sam's plain session's |
| #3951, #3926, #3917 | COBIx's (common-subject alignment files; subject titles) | Sam's or COBIx's |
| #3383 | dependabot's | waits |

## Let go

The ledger the conductor gave this checkpoint names no PR subscription, check-in or artifact watch: no `subscribe_pr_activity` subscription
on #3950, #3953 or #3954, no COBIx watcher (stopped by Sam, `d-cobix-watcher-stopped-on-sam-word-s714`) and no
scheduled wake, so none is to drop. Workers end with the session; each branch is pushed. The vault note for this run:
`CPLBrain/07-session-notes/2026-11-28-s750-skysandpiper-collection.md`, on `claude/youthful-bardeen-smmt1u`, draft samueltlee/CPLBrain#882, which merges on its own.

Spend: $80.38 estimate (Fable 5.2 $77.93, Sonnet 5.5 $2.31, Haiku 5.5 $0.14); collection $80.38; 2026-11-28T13:12Z to 2026-11-28T15:58Z.
(A token-count estimate at the repo's list prices (`kb/_spend_meter.py`'s table), measured from this session's and its agents' transcripts at 15:58Z, with Fable 5.2 priced at the Opus 5.5 rate as S739 to S748 did, since the table names no Fable rate; Sonnet at the table's Sonnet rate and Haiku at $1 and $5 per million tokens; get_session is not among this run's tools. The checkpoint's last steps and the sign-off after 15:58Z are not in it. No paid read ran.)

Opening line: *Greetings, you are SkyDowitcher (the next free session number at your start; the routine takes it), see SkySandpiper's (S750) handoff — `docs/session_751_handoff.md` — let's keep rolling with our queue.*

Conductor model: Fable 5.2 (claude-fable-5-2), as the run header reports and the form names; session cost about $80.38 (a token-count estimate at 15:58Z; get_session is not available here); 7 records collected, pending the apply's result (all passing coverage, no named gap filed); 0 outline rows added; 1 substantive PR merged (#3953 `91bffc66`, confirmed on `origin/main`), with #3954 and s750a's land pending at this writing, not counting this checkpoint.
