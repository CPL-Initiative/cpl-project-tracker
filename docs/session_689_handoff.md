---
title: "Session 689 handoff (from SkyLinnet, S688)"
created: 2026-11-20
updated: 2026-11-20
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyTern (Session 689)

From SkyLinnet, S688: Sam's session, started 2026-11-19T23:40Z when he pasted handoff 688's opening line, with no
other direction. A **light checkpoint plus memory rows**: no lane's state changed and the run wrote no re-mint or data
receipt. Skipped: steps 2 (`kb/README.md`), 3 (`README.md`), 7 (the Pipeline tab) and 9, and `conductor_mode.md`. The
status files (step 12) and every apply are the conductor's.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. Read a PR's whole thread before you merge it or apply any file it carries
   (`p-apply-before-thread-read-s685`).
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first (the oldest among the
   finished ones, `d-oldest-finished-among-finished-s688`), one update from `main` right before its merge, no
   dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
3. **Merge order:** (1) **#3577**, the Library check binds the url it checked (worker branch
   `claude/library-gate-url-s688`; COBIx's #3572 comment 7023899407). **If #3577 is merged and applied** (`git log
   origin/main` names it, and the two migrate runs below have receipts), skip to (2). Otherwise read its thread, merge
   on a green `test`, then apply in order `kb/migrations/2026-11-19_library_check_binds_url.sql` and
   `kb/migrations/2026-11-19_s688_library_memory_rows.sql` (row `d-library-check-binds-url-s688`). (2) This checkpoint
   (`claude/checkpoint-s688`). #3383 is dependabot's.

## What shipped (squash-merged on `main`, `test` green on each head, each thread read)

- S687's 15 memory rows applied: supabase-migrate run 44639823760 from `claude/s688-memory-apply` (never merges).
- **#3500 `31e039c4`** Cosumnes River pins. **#3529 `3e3bb837`** flagged cards leave the confidence scorer.
  **#3578 `f6f67759`** First Light puts back a timestamp-only report. **#3537 `258a61d4`** Mt. San Antonio's SLO
  reader (an unfiled page counts wrong). **#3579 `ef16178c`** rule D keeps an older read's mark where a newer scoped
  read did not reach.

## Read in order

This file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S688*; the new section of
[`playbook-runner-as-external-api-proxy`](kb-notes/playbook-runner-as-external-api-proxy.md) (a commit-back that skips
CI); the [`commons`](reference/lanes/commons.md) lane's confidence-scorer and Needs you paragraphs.

## Open work, from the lanes' NEXT lines

1. **program-requirements-harvest:** rule D's prior-year read (`CAPTURE_PRIOR`) for College of the Desert's 8, now
   unblocked by #3579; the reread plan's third ten (Sierra, Barstow, Pasadena City, Rio Hondo, Los Angeles Harbor,
   College of San Mateo, College of the Sequoias, Fresno City, Contra Costa, Madera; $40 per college per run, one
   pending run per concurrency group); keep-the-better's follow-ups (`needs_load`, the shared no-ending address rule,
   `slug_awards` endings); the next display build after the next posts, then the census against 5,145; Copper
   Mountain's 404 address; the outline readers (Feather River's and Palomar's header fixes, then their trials; CCSF by
   the `ccsf.curricunet.com` route; Mt. San Antonio's 12-page trial counted by eye into `mtsac_recall.json`); Cosumnes
   River's paid read after the named-programs-only `only` input.
2. **commons:** the confidence apply, a dry run of `kb/_ccr_confidence_apply.py --rule G --fill-members`, then
   `--apply --expect` with that dry run's own count (never 2859); the #3570 gaps ("Noncredit Course for MUS 15" into
   the held list, a view of M1524, M1553, M1568, M1762 and M1847 for Fixes owed, "2 Rename batch" to curator work).
3. **cer-procedures:** the pair apply (rebuild the list, dry run `--pairs`, the reviewed apply, the 71
   `left_map_keep` rows INSERT-only); #3524 and #3522 in a plain session.
4. **repo-size:** Part 5 waits on Sam's go; the spreadsheet export and the videos; the slimming items in a plain
   session.
5. **library (#3560):** parts 2 to 4. Part 2 must write `url` on every check row, and the tab's pre-check in
   `library.js` still looks at the version key alone.
6. **common-cr-reference:** the exact match from issue #3523 against the 2026-11-18 counts, in a plain session.

## For Sam

1. The conductor-model flip on the CPL Queue routine's form is yours.
2. [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current): one card.

## Decisions (the session's, reversible; `cpl_memory`, proposed)

`d-oldest-finished-among-finished-s688`, `d-revert-stamp-commit-for-test-s688`. Rows drafted in
`kb/migrations/2026-11-20_s688_cpl_memory_rows.sql` (6 rows, rollback beside it); the conductor applies them.

## Patterns that worked

- Reading the head's commits after each update from `main` caught the bot commits before a merge.
- Merging a finished younger PR while an older one waited on `test` kept the queue moving.

## Safety patterns to honor

All of 687's. New: `p-skip-tag-in-commit-message-s688` (never quote the skip tag in a commit message, it skips CI for
that push) and `p-bot-commit-leaves-head-untested-s688` (revert a timestamp-only bot commit with a human push).
`p-stash-unstaged-commit-s687` fired again: never stash after `git add`.

## Let go

The conductor drops, in the sign-off turn: the PR subscription on #3577 and the COBIx watcher (re-armed every 30
minutes). Check-ins: none. Artifact watches: none. The vault note is a draft PR on CPLBrain.

Spend: $12.69 (Opus 5.5 $12.69); collection $4.69, infrastructure $8.00; 2026-11-19T23:40Z to 2026-11-20T01:22Z.

Opening line: *Greetings, you are SkyTern (Session 689), see SkyLinnet's handoff — `docs/session_689_handoff.md` — let's keep rolling with our queue.*
