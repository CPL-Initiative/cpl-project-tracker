---
title: "Session 701 handoff (from SkyGuillemot, S700, Sam's plain session of 2026-11-21 to 22: Subjects recommendations, the course panel, the noncredit catalogs and the draft noncredit title list)"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows
`docs/session_699_handoff.md`, never this file.

# You are SkyMurre (Session 701)

From SkyGuillemot (S700), Sam's plain session of 2026-11-21T23:17Z to about 2026-11-22T02:05Z, on Fable 5.2. A
**light checkpoint**: the Commons lane took its paragraph inside the PRs, no Roadmap row moved, and the run wrote no
re-mint or data receipt (the memory rows aside). The checkpoint moved five older Commons paragraphs and the long
Subjects record verbatim to `docs/roadmap_archive.md` (*Moved from lanes/commons.md (S700 checkpoint)*), so the lane
is under 20,000 bytes. Skipped: steps 2 and 3 (no KB or README surface), 4 (no retired text needs a lessons home),
5 (no new KB note), 7 (the pipeline did not move), 9 (its own queue item) and, in 12,
`kb/status/program-requirements.json` (the routine's run log). `kb/status/subjects.json` is restamped.

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read it, and comment 7064588752 (Sam's two rulings of 2026-11-21). **Then
   read issue #3655 whole**, the Subjects brief; this session's status comment is 7071038844.
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background, and read its output
   yourself every few turns: it wakes no one and stops at the two-hour background limit. Act on each new
   `<!-- cobix -->` comment. This session ran it twice; one poll at the end found no new COBIx comment.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints
   match. COBIx reviews do not gate a merge (`r-cobix-review-never-gates-merge-sam-2026-11-21`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the
   next wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves
   the M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** #3660, #3661 and #3662 are merged. This checkpoint's PR merges at sign-off. Dependabot's #3383
   waits.

## What shipped (squash-merged, `test` green on each head)

- **#3660 `c39cad85`:** the 21 subject pages the four CourseLeaf indexes link at their own addresses, read and filed
  (`kb/_file_missed_subject_pages.py`; 493 courses: Cerritos 47, Long Beach City 47, Monterey Peninsula 71,
  Southwestern 328). `kb/_build_local_subject_recommendations.py` files `kb/status/local_subject_recommendations.json`:
  a recommended local title for each row with no heading and a common code for each credit row with none, each level
  measured on the titled codes with the answer left out, shown beside the row. 108 web searches filed in
  `kb/reference/subject_web_searches.json`. A local title drops the parenthetical that repeats its code.
- **#3661 `4dcecd8f`:** the course panel. A local code opens that college's courses, credit and noncredit apart, at
  `#commons/subjects/<college>/<code>`; `kb/_build_subject_courses.py` files `kb/status/subject_courses/<slug>.json`.
- **#3662 `89c821d0`:** SDCCE (392 courses, 44 headings), Santa Ana School of Continuing Education (263, 29) and
  Mt. San Antonio noncredit (477, 8) filed by a worker (`kb/_file_noncredit_catalogs.py`). The draft noncredit subject
  title list (`kb/_build_noncredit_subject_titles.py`, `kb/status/noncredit_subject_titles.json`, view
  `#commons/subjects/noncredit`): 129 headings, 114 titles, 7 in two or more programs, 78 under a category with a
  common code, 9 under one with none, 27 with no noncredit course in COCI. The list opens on All subjects with a Credit
  and Noncredit filter. ATH is KINE.

The page's totals: `kb/status/local_subject_titles.json` `totals` (on 2026-11-22: 19 colleges, 18,966 courses, 1,948
pairs, 1,412 titled) and `kb/status/local_subject_recommendations.json` `totals` and `common_code.sams_30` (23 agree,
5 diverge: ASAM, AFRS, NAIS, AP, ACLR; none for BCOT and WGS).

## Decisions Sam made (in session)

1. **2026-11-21:** *"Dept labels can be helpful for our edge case recommendations"*
   (`r-dept-labels-help-edge-recommendations-sam-2026-11-21`): a department or program label a search found is kept
   and read as weaker evidence.
2. **2026-11-22:** *"ATHL can be in kine. It's for competitive athletic sports as distinguished from PE activity
   courses"* (`r-athletics-under-kine-sam-2026-11-22`): ATH is KINE and ATHL is no common code; this revises his ATH
   to ATHL decision of 2026-11-21.
3. **2026-11-22, on Sky's recommended save path:** *"Fine."* (`r-subject-save-path-kb-curation-sam-2026-11-22`):
   Subjects saves go to `kb_curation`, one inserted row per decision keyed by college, local code and band
   (`SUBJ:cerritos|ATH|credit`), the reviewer's own sign-in, Take it back removes it, and a person's save wins over the
   catalog, the subject map and any recommendation. The subject map stays the statewide default by PR; noncredit rows
   wait on the title list.
4. **2026-11-22:** *"Yes, view inside subjects"*; *"And should be able to see all subjects on one list"*
   (`r-noncredit-is-a-view-inside-subjects-sam-2026-11-22`): no separate noncredit surface.

## Decisions the session made (each his to revise)

`d-subject-recommendation-levels-measured-s700`, `d-local-title-drops-code-parenthetical-s700`. Facts and pitfalls:
`f-subject-recommendations-measured-s700`, `f-sams-30-cerritos-scored-s700` (written before ATH moved; the lane holds
the current 23 and 5), `f-missed-subject-pages-filed-s700`, `f-subject-web-searches-filed-s700`,
`f-noncredit-catalogs-filed-s700`, `f-subject-course-panel-s700`, `p-read-plan-under-5000-lines-s700`. The 13 rows
are in `kb/migrations/2026-11-21_s700_cpl_memory_rows.sql`, rollback beside it; the session applied them.

## Open work, from the lanes' NEXT lines

1. **`commons`, the Subjects page (#3655), in order:** (1) Edit and Save on the approved `kb_curation` path, with its
   line in `kb/governance_surface_map.json` and the privacy check of Rule 10 (a3), then Sam's 29 standing Cerritos
   decisions and ATH as KINE filed with a rollback receipt; (2) Sam settles the draft noncredit title list (which
   headings fold further; a code or none for Citizenship, Health and Safety, substantial disabilities and Workforce
   Preparation), then the smaller programs' on-hold rows lined up by their own COCI category and the hold lifted;
   (3) the Credit and Noncredit filter showing the COCI category and noncredit MQ discipline on noncredit rows; (4) the
   credit catalogs of Santa Ana and Mt. San Antonio filed (their credit codes read Not read yet, 96 and 136); (5) the
   8 pages a web search found on a college's catalog read; (6) the code spellings the searches surfaced as sibling
   codes; (7) the stale Common SUBJ in the state list's M-ID column replaced by the identity file's; (8) the
   common-code list with the noncredit MQ disciplines.
2. **`commons`, the rest:** the hand-over box's 503 on `handover-try-link`, then its seven later steps; a per-college
   credential count for the College Data Collection card; `commons_handover_summary()` carrying the term our reader
   names; the pile mint's 168 other tutoring titles, then *Propose a new M-ID*; Jev as the second stage; the three
   Collect cards from Sam's locked mock.
3. **`cer-procedures`:** the pair apply (rebuild the list if its inputs moved, dry run, then the reviewed apply, then
   the 71 `left_map_keep` rows); #3524 and #3522 in a plain session; `_fold_unclassified.py` stops writing a high
   school as issuer. The lane is 20,344 bytes: compact it when you next touch it.
4. **`repo-size`:** dispatch `receipt-slim.yml` (`mode=apply`) outside the cron windows; the spreadsheet export and the
   videos out of the tree; the timed workflows' commits capped; the session trim with COBIx; `START_HERE.md` and the
   `CLAUDE.md` cut. Part 5 waits on Sam's go.
5. **`common-subjects-reference`:** ECONMT and Electricity's adult-education codes, Sam's refile in Local subjects;
   the Commons card's second count needs the person confirms synced to a committed file; the two ENVR merge
   candidates wait for a faculty reviewer.
6. **`library`:** deploy #3600, then part 4 (Publish all, Add existing, redraft and republish), then part 3.
7. **`program-requirements-harvest`** is the routine's (handoff 699).

## Not answered by Sam

- The draft noncredit subject title list (above): on no reply the hold stands and the list stays a draft.
- The TBA figures on the College Data Collection card, and the Plan card's phases (handoff 698).

## Pitfalls from this run

- **A page-read log reads back at most 5,000 lines,** whatever `tail_lines` asks: size a plan by printed lines and
  push one plan per commit, waiting for its run (a third queued run cancels the second).
- **A small job log comes back inline and costs context,** so a helper fetches logs.
- **A test pins the daily build's step count** (`tests/apply_concurrency_test.py`, now 51): a new `step` in
  `scripts/daily_build.sh` moves it.
- **`npm run a11y -- commons-subjects commons-subjects-dark`** runs the Subjects routes in about two minutes and
  caught a 24px target-size fault on two-letter codes.
- **The permission check refused a local preview server;** the a11y sweep's `--shots` is the way to see a view.
- **A worker in its own worktree pushes to the session's branch:** `git stash -u && git pull --ff-only && git stash
  pop` before building on it.
- **`cpl_memory.kind` takes `fact`, not `finding`,** and a Sam ruling is kind `decision`.

## Let go

Dropped: the PR subscriptions on #3660, #3661 and #3662 at their merges. Two one-shot check-ins fired and are spent.
No artifact is watched. The checkpoint PR's watch drops at its merge.

Spend: not available; 2026-11-21T23:17Z to 2026-11-22T02:05Z.

The work was the Subjects recommendations, the course panel and the noncredit catalogs, by one session with one
worker (the noncredit catalogs), two web-search helpers, one issue-digest helper and `pr-gate` reads.

Opening line: *Greetings, you are SkyMurre (Session 701), see SkyGuillemot's handoff — `docs/session_701_handoff.md` — let's keep rolling with our queue.*
