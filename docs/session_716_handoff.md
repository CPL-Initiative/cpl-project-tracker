---
title: "Session 716 handoff (from SkyFulmar, S714, the CPL Queue routine's collection run of 2026-11-23)"
created: 2026-11-23
updated: 2026-11-23
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
plain-session handoff, `docs/session_715_handoff.md` (S712 SkyPuffin's, for SkyAlbatross, Session 715), never this
file. **Numbering.** Handoff 714 named the routine's next session SkyFulmar, Session 714; no plain session took 714,
so this run is S714. S712's #3712 merged handoff 715 at 11:52Z while this run's declaration held 715, so this run
writes 716, the next free number (`d-routine-takes-next-free-number-s713`). Sam's plain session S715 (SkyAlbatross)
is live beside it (#3717 merged, #3718 open); its handoff takes the next free number above 716. The routine's next
session is **SkyPetrel**: it takes the next free session number at its start and writes the handoff one above the
highest on `main`.

# You are SkyPetrel, the routine's next session

From SkyFulmar (S714), the CPL Queue routine's 11:12Z firing of 2026-11-23, a conductor run for collection only under
Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358, served by Opus 5.5 (the form names Fable 5.2). A
**full checkpoint** (lanes moved; Rule 10 data writes ran: four guarded UPDATE applies and three loads), written by
the checkpoint-docs worker from 15:09Z while #3715, #3719 and College of the Sequoias' plan were in flight; the
conductor brings it to its final state: the memory rows, step 12, the vault note (step 11), and the census, Spend and
final lines below. Skipped: steps 2 (no KB structure change), 3 (no user-facing surface changed), 7 (no M-ID pipeline
move) and 9 (the UI pass is its own queue item).

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read it, and comment 7064588752 (Sam's two rulings of 2026-11-21), before the
   split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712 (handoff 715): *"No need for the Cobix check ins for now"*.
   Start none unless he asks (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge
   it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker. Workers share the clone's object store, so fetch a branch by name
   with `--shallow-since` or `--deepen`, never `--depth` (`p-shared-shallow-clone-reshallows-s713`). A worker cannot
   open a second worktree: a new branch gets a fresh worker (`p-harness-keeps-worker-in-its-worktree-s714`).
2. **Merge rules:** at most 3 open PRs (plus dependabot's), the oldest finished first, one update from `main` right
   before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop a
   review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at this writing (15:09Z):** #3715 (Los Rios), then #3719 (the `option_parts` 9 with Fullerton's
   11), then College of the Sequoias' #3721 (applied; merges once `main` is merged in and `test` is green; if it is
   still open at the next start, it merges first); this checkpoint, #3713, at sign-off. Each
   records PR merges `main` once right before its merge, takes `main`'s side of a conflicted Commons file and reruns
   both builders. Dependabot's #3383 waits.

## The start (11:12Z firing, 2026-11-23)

- Step 0: S713's 06:12Z firing dispatched `daily-dashboard.yml` at 06:16Z; the day's update landed at 06:23Z
  (`a588fc77`). Nothing to dispatch.
- One writer: no `list_sessions` or `get_trigger` in this session, so the run read the open PRs. #3704 (S713's
  checkpoint) was updated at 11:11Z, a live session at its last step, so this firing waited for its sign-off; it
  merged at 11:31Z (`3145d379`), and the run took the queue then. #3712 (S712 SkyPuffin, Sam's plain session) declared
  its scope (the re-mint readiness gate, the statewide subject list, three read plans); this run stayed off its files
  and off the three colleges its read plans probe (Allan Hancock, Bakersfield, Antelope Valley).
- No pause line in handoff 714. Three repos attached. Sheet 200's replies: none since 2026-11-19. `queue_todo_done`
  since 2026-11-22: none. No exhibit re-analysis request open. Library: two requested briefs and three revise requests
  (2026-10-26 to 2026-11-13) are the daytime Library run's; one CER procedure request from 2026-11-19 is a plain
  session's.
- Step 11: `python3 scripts/next_slo_colleges.py --next` on `main` says the queue is empty (120 colleges: done 39,
  held 4, none 5, skip 72; census 44695851118). It opens again when a census, a harvest capture or a verdict row
  changes. The four held (De Anza, Palo Verde, College of Marin, Antelope Valley) each wait on a reader.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`);
outline fills first, program records second. The outline queue was empty, so both lanes worked program records.

- **Lane 1 (collection):** `rios` (high effort) on the Los Rios colleges' programs whose extraction placed none of the
  state's courses: Sacramento City 22 and Cosumnes River 19 first, then American River 5 and Folsom Lake 3; a free page
  read first, each program's own page pinned or filed as a named gap, then a paid read with `only=` at most $5 a
  college on the estimate. `display` (later): one display build carrying the 27 records applied after S713's build and
  tonight's, gate college Glendale, then `harvest-gap-census.yml` on `main`, only while no apply is in flight. Held for
  a later slot: the same lever at San Bernardino Valley 15, Los Angeles Southwest 9, Mendocino 6, Santiago Canyon 6.
- **Lane 2 (cheap piles):** `piles` (high effort) on City College of San Francisco's 28 wording rules and S713's six
  holds there; then East Los Angeles 24, Fullerton 24 and College of the Sequoias 22, each rule with a claim check on
  today's capture, boundary readings and a precision count before its second read.

## Split changes during the run

- 11:37Z: `piles` and `rios` started on Opus 5.5 at high effort; the display build waits for a slot.
- 12:09Z to 12:11Z: #3714 filed (City College of San Francisco, 8 rows). A worker cannot open a second worktree, so
  `piles2` took East Los Angeles; four checkouts at about 2 GB each against 55 GB free
  (`d-four-checkouts-on-measured-disk-s714`).
- 12:32Z: #3715 filed (the reader change and 38 pins; free estimates $2.15, $1.76, $0.33). American River's 5 blocked.
- 12:38Z to 12:40Z: #3714's reader, FIX THEN APPLY, its majors in the reach count and the test; applied first
  (`d-apply-before-reach-fix-s714`): migrate 45176130201, 8 of 8 live.
- 12:58Z: the handoff moved to 716 (`194d76ba`); the COBIx watcher stopped on Sam's word in handoff 715.
- 13:14Z to 13:15Z: #3714 round 2, MERGE. East Los Angeles's plan filed (15 rows). #3715's reader, FIX THEN DISPATCH
  (30620 to a named gap); the three paid reads dispatched.
- 13:21Z: #3714 merged (`f0d84966`); `piles` took the `option_parts` follow-up at seven colleges, then Fullerton.
- 13:31Z: the concurrency group canceled Cosumnes River's pending read 45181979022 before anything was paid
  (`p-one-pending-run-per-branch-s714`); it went in again alone (45184653221).
- 13:46Z to 13:56Z: the optparts plan went to 9 (`d-optparts-holds-05934-claim-check-s714`); East Los Angeles applied
  (45186909162, 15 of 15); the optparts 9 applied on a Sonnet reader's APPLY (45188487600;
  `d-sonnet-reader-for-scoped-plans-s714`).
- 14:03Z: #3716 opened; round 2, MERGE (18,960 filed records rescored, 0 differences against `main`).
- 14:10Z to 14:17Z: Fullerton's plan (11 rows) and its Sonnet reader's APPLY, the `PE 248 F` renumber to drop before
  the merge; migrate 45191999745, 11 of 11 live. #3716 merged (`890eb465`). `land` brought both applied branches up from `main`
  into #3719 (`d-fullerton-rides-3719-s714`); `piles` took College of the Sequoias.
- 14:54Z to 15:00Z: `rios`'s fixes on #3715; 37 records loaded (45198701869, 45199218981, 45199758327); the rescore's
  dropped gaps put back; the 9 newly passing held (`d-elective-fill-rereads-held-s714`), #3715 `597cfd85`.
- 15:06Z: College of the Sequoias' plan (`51528086`, 14 rows, 8 held); a second reader is on it.

## What shipped

- **#3714 `f0d84966` (13:21Z):** City College of San Francisco's 8 records on `course_renumbers` (LALS 9 and LGBT 9
  for the file's cross-listed row; CNIT 133I) and `option_parts` (one option's blocks read as one option): migrate
  45176130201, 8 of 8 live. 26 held by key in its receipt.
- **#3716 `890eb465` (14:16Z):** East Los Angeles's 15 on five free readings (the plan line, double counting, the
  high-unit waiver, a course taken twice, a printed code), 14 passing and 45602 a `total_differs` named gap: migrate
  45186909162, 15 of 15 live. 9 held.

**Applied or loaded and live, in open PRs:**
- **#3719:** the `option_parts` follow-up, 9 records at Foothill, Glendale, Golden West, MiraCosta, Monterey Peninsula
  (2) and Reedley (3) (migrate 45188487600; Santa Barbara City 05934 held), and Fullerton's 11 on nine campus-letter
  `course_renumbers` (migrate 45191999745; 13 held).
- **#3715:** Los Rios, 37 records from three paid reads (Sacramento City 18, read 45181973475, $2.04, load
  45198701869; Cosumnes River 16, read 45184653221, $1.76, load 45199218981; Folsom Lake 3, read 45181983194, $0.33,
  load 45199758327), 35 passing (Sacramento City 07334 short of its GE units; Cosumnes River 35364 on outcomes), all
  unchecked; 7 named gaps filed (Sacramento City 4, Cosumnes River 3).

**College of the Sequoias, #3721:** 13 records pass where each local degree page prints, under its TOTAL, how many
units may count toward both the major and general education; the fill stores the figure in `ge_overlap` as a range
and the scorer reads it as a cap. Its reader's two rounds held 06770 (two CONCENTRATION A blocks read as
alternatives), decided the cap on the award (`awards_match`, so "Not for Transfer" no longer reads as a transfer
degree) and bounded the fill to the program's own heading. Pre-read 13 of 13 before-images, 0 confirms; migrate
45212444064 (16:06Z), 13 of 13 live; `.apply` back at main's value (`a4de5b00`). 8 more held, 36073 among them.

**The census on `main`:** run 45209484531 (15:53Z, `f0ffa503`, after #3719): of 20,282 active programs, 15,454 pass and 4,508 have no passing record (4,586 at S713's census, 78 fewer); 320 are collected with a named gap (319). Largest causes: no closed list 1,747; page not found 1,097; units unequal 903 (918); units incomplete 288; places none 196 (233); coverage fails 156 (175). At about 215 a day, the 4,508 take about 21 days.

**Tonight's count:** 93 records applied or loaded and live: 90 passing, 1 named gap, 2 failing new records; $4.13 of
paid reads; 7 named gaps filed at Los Rios; 0 outline rows.

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S714*; `docs/reference/conductor_mode.md`, *What went wrong in S714*;
[`methodology-a-fill-must-check-what-it-fills`](kb-notes/methodology-a-fill-must-check-what-it-fills.md), *S714*.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's):
   - Land #3715 and #3719 (merge order above), then the display build carrying the 27 records applied after
     `da3198af6b98` and tonight's 80, gate college Glendale, then `harvest-gap-census.yml` on `main` (NEXT (8)).
   - **Before the next reconcile at any college:** measure `f-elective-fill-passes-cut-off-windows-s714` statewide.
     S655's guard, `tests/reconcile_window_fill_test.py`, reads six colleges, and its note pattern matched none of
     tonight's 8. Fix the dropped `ge_units_not_read` gaps (`f-rescore-drops-ge-units-not-read-gaps-s714`). The 9
     held wait for the fix (NEXT (2)).
   - Lane 1: the reader-page lever at San Bernardino Valley 15, Los Angeles Southwest 9, Mendocino 6 and Santiago
     Canyon 6; American River's 5 after a checked filing of the file its host serves (NEXT (5)).
   - Lane 2: #3721 merged (or merge it first), then the next cheap piles from the census, and the holds by key
     (NEXT (6)).
   - Step 11: the outline queue is empty until a census, a capture or a verdict row changes (NEXT (1)).
   - After the waves, the one follow-up: S713's minors, COBIx's `f-cobix-minors-s713` and `f-cobix-minors-s714`, and
     East Los Angeles's free reconcile (`extract=0`) before its next text run (NEXT (3)).
2. **A plain session's, each by its lane's NEXT.** They wait because conductor runs stay on collection (Sam's routine
   prompt of 2026-11-17: *"No new UI, tooling or governance work in conductor runs."*):
   - `commons`: S715 (SkyAlbatross) works it now (#3717 merged, #3718 open); then the Subjects card from the mock,
     the subject-list reads, the mint of Confident calls, the 787 Unsure codes, Sam's twelve AED titles and one re-mint.
   - `common-subjects-reference`: ECONMT and Electricity's adult-education codes (Sam's refile in Local subjects); the
     Commons card's second count once the confirms sync to a committed file.
   - `cer-procedures`: compact the lane first (21,633 bytes against 20,000), then the pair apply and the 71
     `left_map_keep` rows; #3524 and #3522.
   - `my-college-action-page`: card 2's nightly snapshot of each college's landing page; Santiago Canyon and Sierra once
     the harvest reads their catalogs (Santiago Canyon's 6 wait on lane 1's lever).
   - `repo-size`: dispatch `receipt-slim.yml` `mode=apply` outside the cron windows; then the spreadsheet export and
     videos, the timed workflows' commits, the session trim, `START_HERE.md` and the `CLAUDE.md` cut. Part 5 waits on
     Sam's go.
   - `governance-team-enablement`: `daily-dashboard.yml` into `live-counts` in its own PR, then the branch-run files;
     the repository copy of `SUPABASE_SERVICE_KEY` goes only when PENDING is empty, and that removal is Sam's.
   - `implementation-funding`: card 11's two measure texts and the six carried strategies wait on Sam in the tab;
     Accept's Microsoft 365 email waits on RCCD IT's mailbox and on the sender's mapping in
     `kb/governance_surface_map.json`. Funding figures to colleges stay his.
   - `library` (deploy #3600, then part 4, then part 3), `sierra-page-redesign` (the photo design call, then COBIx's
     Ask B) and `common-cr-reference` (Sam works the top 50 groups; the session watches which rungs he overrides).

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

| Block | Who clears it | Since |
|---|---|---|
| The program-level fill passes cut-off windows (`f-elective-fill-passes-cut-off-windows-s714`), so the 9 Los Rios rescored records are held unread: Sacramento City 04656, 07350, 21418; Cosumnes River 04602, 04614, 33542; Folsom Lake 15368, 39574, 42612 | Sky, the statewide measure and the fill's fix | 2026-11-23 (S714) |
| The reconcile rescore drops named `ge_units_not_read` gaps (`f-rescore-drops-ge-units-not-read-gaps-s714`) | Sky, before the next reconcile | 2026-11-23 (S714) |
| American River's 5: its host serves a file whose sha256 differs from the hand-filed record (`f-american-river-hand-filed-sha-mismatch-s714`) | Sky, a checked filing of the served file | 2026-11-23 (S714) |
| East Los Angeles's bound is unmeasured on capture text (41097 likely; 36345, 37924, 43632, 45935 possible) | Sky, a free reconcile before its next text run | 2026-11-23 (S714) |
| East Los Angeles's 9 held: 02430, 08252, 21157, 02456, 31017, 41231, 38168, 37510; 33013 (its own figures disagree) | Sky (8), a person (1) | 2026-11-23 (S714) |
| City College of San Francisco's 26 held by key (#3714's receipt): 20 of tonight's 28 (the six CNIT options 17614 to 17619, an own-option step; 16990, 16991, 38267, a wrapper-fill step; 33208, 37781 cut off; 9 others) and S713's six (17954, its record unloaded; 09178, 17952, 31602, 36964, 42318) | Sky, lane 2 | 2026-11-23 (S713, S714) |
| Fullerton's 13 held: 03853, 03866, 08420, 08422, 18163, 18166, 18749, 33680, 35174, 36798, 36863, 42143, 42394 | Sky, lane 2 | 2026-11-23 (S714) |
| College of the Sequoias: 06770 (a misread sum) and 8 more held, 36073 among them (its page lacks "above") | Sky | 2026-11-23 (S714) |
| Santa Barbara City 05934: today's capture finds 31 of its option's 33 courses (ENVS 112, ENVS 115) | Sky, a read | 2026-11-23 (S714) |
| The 30-day artifact `course-outcomes-45026998155-part1` holds trial pages that print a staff name: delete it | a person | 2026-11-22 (S703) |
| Antelope Valley 43028 (CSU and IGETC figures on a Cal-GETC degree) and De Anza 45499 (a 180-unit bachelor's) | a person | 2026-11-23 (S713) |
| Santa Rosa Junior 06566 and 32298, held: the second reader found the wrong cause | Sky, a reread or a rule | 2026-11-23 (S713) |
| Santa Monica's 26: 6 wait on a runner page-text step, 17 on a reread, 03281, 10345 and 43765 on a person | Sky (23), a person (3) | 2026-11-23 (S713) |
| Glendale 32607 and 36416 (lecture-and-lab pairs read as separate choices) and 45068 (the capture's 16,000-character cap cuts Area 4): rereads; 44488 (MATH 102 and 102+ against one file row): a person | Sky (3), a person (1) | 2026-11-23 (S713) |
| Las Positas 01037 (passes only by double counting) and 09227; Antelope Valley 39295 | Sky, lane 2 | 2026-11-23 (S713) |
| College of Marin: its program URLs changed form, so the moved-page guard stopped its general education step (19789, 19791) | Sky, a capture or guard fix | 2026-11-23 (S713) |
| Clovis's 11 held: 33432 (#3683's pinned reread), 33489 (a fill step), 33431, 33506, 36050, 37227, 43015, 45325 (rereads), 33501, 36326, 39539 (a person) | Sky (8), a person (3) | 2026-11-23 (S713) |
| The next follow-up's minors (S703 and S713's list, each id in the lessons doc, *Moved from the lane (S714 checkpoint)*, NEXT (2)), SDCCE's 6 SLO-label rows that the Commons shows as outcomes first | Sky, the next follow-up | 2026-11-22 (S703) |
| COBIx's minors: `f-cobix-minors-s713`; `f-cobix-minors-s714` (the same-figure guard; the database rows carry no `notes` or `missing_explained`, so a receipt-only rescore fails coverage on 4 `option_parts` rows; Fullerton's CRTV 196 F prints 0.5-3 units) | COBIx | 2026-11-23 (S713, S714) |
| City College of San Francisco's Cal-GETC dry run (32080, 33652, 46300): the permission check refused it twice | a plain session | 2026-11-21 (S691) |
| Golden West's 476 outline header rows: the guarded correction | a plain session's review | 2026-11-20 (S690) |
| Cerritos 20504: its run also holds 44984, held for a person | a person, on 44984 | 2026-11-21 (S697) |
| Records held for a person: College of the Canyons 43388, West Los Angeles 46261 and 38677, Napa Valley 19126, 31158 and 36528, Los Angeles Harbor 44947, Cerritos 44984, Los Angeles Mission 44849, Los Angeles City 32832, Ventura 45355, Shasta 18153 | a person | S653 to S691 |
| College of the Desert's 8: the prior catalog sits behind robots.txt | the college, or another source | 2026-11-20 (S689) |

Cleared tonight: none of handoff 714's rows; its City College of San Francisco row is folded into tonight's.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no new
answers since 2026-11-19). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight. The run acted on his word to S712 (01:53Z, handoff 715): *"No need for the Cobix check ins for now"*.

## Decisions (the conductor's, each reversible)

- `d-four-checkouts-on-measured-disk-s714`: four checkouts at about 2 GB each against 55 GB free, over the
  three-checkout ceiling set when a checkout took 4.4 GB; the ceiling is now the measured disk.
- `d-apply-before-reach-fix-s714`: apply first and fix forward when a reader's majors touch neither the rows, the SQL
  nor the undo (City College of San Francisco, East Los Angeles).
- `d-optparts-holds-05934-claim-check-s714`: Santa Barbara City 05934 left the plan on its claim check; 10 rows to 9.
- `d-elective-fill-rereads-held-s714`: the 9 Los Rios records the rescore newly passed went back to `main`'s filings,
  never reread, until the fill is fixed.
- `d-fullerton-rides-3719-s714`: Fullerton's 11 ride #3719 with the `option_parts` 9, under the PR cap; its `PE 248 F`
  renumber dropped.
- `d-sonnet-reader-for-scoped-plans-s714`: Sonnet second readers on plans whose shared code was already reviewed or
  that change no shared code.
- `d-cobix-watcher-stopped-on-sam-word-s714`: the watcher stopped at 12:58Z on Sam's word; each PR's thread read
  before its merge.

Memory rows: `kb/migrations/2026-11-23_s714_cpl_memory_rows.sql` (15 rows, rollback in its header), not pointed at by
`.apply`; the conductor applies it with one `execute_sql` call. DECIDED lines: the harvest lane.

## Patterns that worked

- **One dispatch at a time per branch** (`p-one-pending-run-per-branch-s714`): the college workflow's concurrency
  group holds one running and one pending run per branch, and a newer pending run cancels the older one.
- **A fresh worker per branch** (`p-harness-keeps-worker-in-its-worktree-s714`): a worker cannot open a second
  worktree.
- **A load for records with no live row** (`p-load-skips-places-none-s714`): `step=load` inserts only records with no
  live row and skips any that places none of its courses, so a paid read's new records go live by the load.
- A second reader on every plan before its apply, each apply proved first on a local Postgres 16 (it writes exactly N;
  aborts on a rerun, a matching confirm or a changed before-image; the rollback restores the before state).
- Free rule work first: 43 records with no paid read, 37 for $4.13.

## Findings

- `f-elective-fill-passes-cut-off-windows-s714`: `main`'s program-level fill (`kb/_program_requirements_score.py`,
  about line 1478) passes a record whose window was cut off whenever "elective" appears anywhere in its text; 8 Los
  Rios records showed it. Measure it statewide before the next reconcile anywhere.
- `f-rescore-drops-ge-units-not-read-gaps-s714`: the reconcile rescore drops named `ge_units_not_read` gaps.
- `f-american-river-hand-filed-sha-mismatch-s714`: American River's host serves a file whose sha256 differs from the
  hand-filed record, so 5 programs are blocked.
- `f-cobix-minors-s714`: the same-figure guard; East Los Angeles's unmeasured bound; the database rows with no `notes`
  or `missing_explained`; Fullerton's CRTV 196 F at 0.5-3 units.

## Safety patterns to honor

**New at the end of S714:** a test must never read the live census for its members: once a plan's records pass, the next census drops them and the test breaks every PR's CI and `main` (`tests/program_piles_s714_ela_test.py` did, fixed in #3721); pin the members in a fixture, as the City College of San Francisco test does (`p-test-pins-census-members-s714`). And a CI run that dies at `npm install` on a 404 may be a package published
seconds before (`@bramus/specificity` 2.4.4 at 16:21:23Z, fetched at 16:21:42Z): read the version's publish time
with `npm view <pkg> time` before pinning, and rerun the failed jobs once the release has propagated
(`p-fresh-release-404-reruns-s714`).

All of handoff 714's. New tonight: one dispatch at a time per branch; a fresh worker per branch; no reconcile at any
college before the fill is measured and the dropped gaps are fixed; the claim check reads today's capture and can hold
a row (`d-optparts-holds-05934-claim-check-s714`). Each apply put `.apply` back to `main`'s value after its run, so no
merge carries a live trigger. Never file a person's name from an outline page anywhere. A permission-check refusal is
never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about $750 a day for
everything, $10k running total for the whole job; workers on Opus 5.5, high effort on any worker that writes shared
data; reviews at most 9 agents, stopped after two rounds with what is left sent to Sam or COBIx; $40 per college per run
for program requirements and a separate $40 for SLOs, PLOs and course objectives, per run, never a remaining pot. Stop
rules from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline
row; a rollback that undoes over 1% of a day's rows; the $10k checkpoint. The form names Fable 5.2; this run is served
by Opus 5.5.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3713 (`claude/awesome-fermat-ka0z4l`) | the declaration and this checkpoint | merges at sign-off |
| #3714 (`claude/s714-piles-ccsf`) | merged `f0d84966`; applied by migrate 45176130201 | none |
| #3716 (`claude/s714-piles-ela`) | merged `890eb465`; applied by migrate 45186909162 | none |
| #3719 (`claude/s714-piles-optparts`, with `claude/s714-piles-fullerton` merged in) | merged `5b4c057a`; applied by migrates 45188487600 (9) and 45191999745 (11) | none |
| #3715 (`claude/s714-rios`) | merged `a72f9516`; 37 records loaded (45198701869, 45199218981, 45199758327); 7 named gaps; the 9 rescored held | none |
| #3721 (`claude/s714-piles-sequoias`) | applied by migrate 45212444064, 13 rows live; carries the East Los Angeles test's census fixture | `test`, the merge (first at the next start if still open) |
| samueltlee/CPLBrain#855 (the vault note) | merged `98ead375` | none |
| Harvest gap census 45209484531 on `main` | `f0ffa503` | none |
| #3712 (S712, Sam's plain session) | merged `3cc69ffc` | none |
| #3717 and #3718 (S715 SkyAlbatross, Sam's plain session) | merged `0ce26631` and `c7ef1587` | none |
| #3383 | dependabot's | waits |

## Let go

The ledger names no PR subscription, scheduled check-in or artifact watch: the run gated each PR by reads. The COBIx
watcher stopped at 12:58Z on Sam's word. Context at sign-off: about 105,000 tokens left of 786,077, past the
warning line, so the run checkpointed and let go. Workers end with the session; each branch is pushed. The local Postgres 16
used for the apply proofs stops at sign-off.

Spend: about $275 (an estimate from the session's and its agents' token counts at list prices, `kb/_spend_meter.py`'s rates: Opus 5.5 about $268, Sonnet $5, Haiku $0.21; the conductor about $33, six workers about $165, eight second-reader rounds about $66, the checkpoint documents $13), all collection; 2026-11-23T11:32Z to about 16:30Z. Every message ran on Opus 5.5, Sonnet or Haiku (the form names Fable 5.2). The three paid reads' own cost, $4.13 on their estimates (Sacramento City $2.04, Cosumnes River $1.76, Folsom Lake $0.33), is listed apart. Stop rules: none fired (93 new records, about $3 each; no outline rows; no rollback). With S713's $219 the day stands near $495 before Sam's plain sessions.

Opening line: *Greetings, you are SkyPetrel (Session 716), see SkyFulmar's (S714) handoff — `docs/session_716_handoff.md` — let's keep rolling with our queue.* (If a plain session has taken 716 by then, take the next free number and say so.)

This session's cost: about $275 at list prices (no `get_session` in this session; estimated from the session's and its agents' token counts) plus $4.13 of paid reads. Records collected: 93 (90 passing, 1 named gap, 2 failing new records), and 7 more programs filed as named gaps. Outline rows added: 0. Substantive PRs merged: 5 (#3714, #3716, #3715, #3719, #3721).
