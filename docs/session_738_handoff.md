---
title: "Session 738 handoff (from SkyWhimbrel, S737, Sam's plain session of 2026-11-26: the Honors redraw, CI from 10 to 8 minutes)"
created: 2026-11-26
updated: 2026-11-26
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_742_handoff.md
---

**Routing.** This handoff is for Sam's next plain session and carries the main queue (handoff 734's, worked here).
Handoff 732 stays the CPL Queue routine's. SkyBrant (S736) ran beside this session on the Library items and the ACCT
re-point (#3867, merged); its own handoff, if it writes one, is `docs/session_737_handoff.md` and covers those. Take the
next free session number when you start (738 or above) and say so in your handoff; the moniker stays yours.

# You are SkyTurnstone, Sam's next plain session

From SkyWhimbrel (S737), Sam's plain session of 2026-11-26 (01:13Z to about 03:50Z). A **light checkpoint**: two lanes
moved (`commons`: the Honors step-4 redraw and the mock's NEXT closed; the test-speed lessons), no Rule 10 data write
beyond the `cpl_memory` rows (receipt `kb/receipts/cpl_memory_s737_rows_2026-11-26.sql`). Skipped: step 2 (no KB
structure change), step 3 (no user-facing surface), step 5 (no note crossed the bar; the trace method is a pitfall row),
step 7 (the pipeline did not move); step 12 refreshed `kb/status/course.json` only.

## Open with the standing block

1. **COBIx:** Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]` only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head (**suite 1-6 and lints 1-6** since #3873); no dependency-map
   rebuild inside a PR; no full rerun when the input fingerprints match. Never open a PR on a branch that holds another
   open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** #3874 (the docs-only lint skip), then this checkpoint's PR. Dependabot's #3383 stays.

## Sam's words this run

- *"Sounds good--keep rockin it!"*, on the plan: item 1a, then a Commons lane item. No ruling beyond that.

## What shipped

- **#3870** (`dc7683a8`): `kb/_honors_of_s653_dryrun.py --redraw` draws step 4's plan into `kb/honors_mints_out/<date>/`,
  no SQL, with every pair that left, arrived or changed action against the applied 2026-11-15 plan; `--plan` refuses
  while step 2's receipt stands (it had been rewriting the applied migration). One pair left (FTVM M10AS/M10AF, both
  retired by #3853, row deleted live); 128 mints. Live read: 379 step-2 rows plus step 1's 2. Guard
  `tests/honors_mints_redraw_test.py`. **DECIDED** `d-honors-redraw-own-folder-s737`.
- **#3873** (`17f4ead5`): `tests/durations.json` re-measured (597 of 714 files known; `csm_workspace` 84 s in the
  table, 459 s on CI); **six lint shards**, steps heaviest first on the slower of two runs. The check went 10.3 to
  7.7 min. **DECIDED** `d-ci-six-lint-shards-s737`.
- **#3874** (open, draft): on a docs-only diff, 35 heavy lint steps that read no docs file skip (strace-traced; list
  `tests/lints_docs_only_skip.json`, guard `tests/lints_docs_only_skip_test.py`). **PITFALL**
  `p-trace-reads-not-grep-paths-s737`.
- Read, no build: the commons lane's NEXT from the 2026-11-20 mock is met by the front page as rebuilt 11-21 to 11-23
  (`f-commons-order-mock-met-s737`); the lane line now says so.

## After the checkpoint: the lightning round (S737, 04:00Z to 05:10Z)

- **#3876** (`0cffe447`): a state-list label `TITLE (CODE)` titles its code (San Jose City College's 80); untitled codes
  608 to 558. **#3877** (`09ee4706`): `#commons/subjects/rapid`, one untitled code at a time, a best guess, one
  example course, phone thumb bar, swipes, Undo; guesses and COBI's verdicts in `kb/status/subject_title_guesses.json`
  (four batches, web-checked; a second reader each; 139 disagreements reconciled: 420 accept, 31 change, 107 not a
  subject code). Only a reviewer's Accept saves.
- **Sam's words:** *"Can you judge the lightning round first? I can then go over your judgments in the early morning
  and see how everyone did."* The batches compete (*"the one to make the most mistakes caught by Sam will have to ask
  the other agents for tips"*); `batch` names each guess's writer. **RULED**
  `r-dept-and-program-titles-pose-as-subject-titles-sam-2026-11-26`.

## Read in order

1. `docs/reference/lanes/common-subjects-reference.md`, "The stray codes and the title hunt".
2. `docs/reference/lanes/commons.md`, the Honors paragraph (step 2 applied, step 4 reads the redraw).
3. `docs/test_suite_speed_lessons.md`, S737, before touching CI.

## Open work, in order

0. **Score Sam's lightning round** once he has worked it: read his `subject_decision` saves since 2026-11-26T05:10Z
   against `kb/status/subject_title_guesses.json`; per `batch`, count an edit (saved title differs from `guess`) or a
   skip; the same for COBI's `judged.title`. Tell the four batches who lost (they ask the others for tips) and report
   COBI's own score. #3874 merged (the docs-only lint skip).
0a. **The bad splits** (`f-bad-code-splits-in-state-list-s737`): 107 codes are a prefix glued to a course number or a
   legacy label (Chabot PEAC/HEAG/ATHL, Cerro Coso +C, Porterville +P, Glendale AD ST, LACCD OLD ADL, Allan Hancock's
   35). Fix where the state-list code is read, not by titling; the `judged.title` of each names the real code.
0b. **The reversed label** `PSYCH (PSYCHOLOGY)` at San Jose City: `kb/_build_local_subject_titles.py` reads only
   `TITLE (CODE)`; add `CODE (TITLE)`.
1. **The 35 held and the 50 under 90** (common-subjects-reference NEXT): file their common subjects (Sam's picks,
   `kb/subject_title_hunt/20261125_stray_codes_a_person_picks.md`, or courses moved in the Local subjects sidebar),
   then rerun `kb/_stray_code_rescore.py` and the dry run for the rest. Waits on Sam's picks.
1b. **COBIx's CSV format:** new subject-title CSVs carry a 0-100 `title_confidence` (`kb/subject_title_hunt/README.md`);
   tell COBIx when Sam resumes check-ins.
2. **The rest of the common-subjects NEXT:** after #3867's ACCT dry run (S736), its apply waits on the four codes being
   re-filed under Accounting (gate G1); then the other folded local codes; ECONMT and Electricity's adult-education codes.
3. **Commons lane NEXT** (handoff 731's items): step 4's remaining Needs you items; step 3's Courses mount; Gather's
   nightly combining; Subjects, CRs and Exhibits on the anchor pattern; ESL after 2026-11-29; the Honors minors before
   the mints (commons lane, Honors paragraph: HUMA M10OI into M1110, LIBR M10CJ).
Beside the queue: **program-requirements-harvest** is the CPL Queue routine's (handoff 732); **implementation-funding**
waits on the team (its NEXT: the public funding page's phone layout); the Library items are SkyBrant's (handoff 735).

## Patterns that worked

- `pr-gate` for every merge check; a subagent to read six job logs instead of pulling them into the conductor.
- Measure before rebalancing: the job-step JSON gives every step's seconds; a step's sum equals its job's time.
- `strace -f -e trace=openat` in a scratch worktree answers "what does this step read" exactly.

## Pitfalls

- A dry-run tool for an applied step keeps writing that step's SQL unless it refuses: check for its receipt.
- A lint step's time varies 20 to 30% by runner; balance on the slower of two runs, not one.
- `CLAUDE.md` is over its budget (65 KB of 60 KB): do not add to it.

## Safety

- Rule 10: bulk writes insert-only under a cohort email, with a committed receipt.
- Person-settled wins: a save in the Commons is terminal.

## Let go

At sign-off: #3870 and #3873 merged and unsubscribed with their check-ins canceled; #3874 stays watched with one
check-in (04:30Z) until it merges, then both drop; no artifact watch; no COBIx watcher.

Spend: not available; 2026-11-26T01:13Z to 2026-11-26T05:15Z.

Opening line: *Greetings, you are SkyTurnstone (Session 738), see SkyWhimbrel's handoff — `docs/session_738_handoff.md` — let's keep rolling with our queue.*
