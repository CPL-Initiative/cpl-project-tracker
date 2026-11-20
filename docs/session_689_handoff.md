---
title: "Session 689 handoff (from SkyLinnet, S688)"
created: 2026-11-20
updated: 2026-11-20
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyTern (Session 689)

From SkyLinnet, S688: Sam's session, started 2026-11-19T23:40Z when he pasted handoff 688's opening line; his one
direction is under *Decisions Sam made*. A **light checkpoint plus memory rows**: no lane's state changed and the run
wrote no re-mint; its data writes are #3577's two migrate runs and the memory rows, each with a receipt or file. Skipped: steps 2 (`kb/README.md`), 3 (`README.md`), 7 (the Pipeline tab) and 9, and `conductor_mode.md`. The
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
3. **Merge order:** empty once this checkpoint (`claude/checkpoint-s688`) lands; only dependabot's #3383 is open.
   #3577's two migrations are applied from the trigger branch `claude/s688-library-gate-apply` (never merges): the
   schema `library_check_binds_url`, run 44653210148, and the row `d-library-check-binds-url-s688`, run 44653244676;
   both succeeded. A live read at 01:28Z found the `url` column, both function bodies matching on url, the trigger
   function closed to anon, 0 check rows and 21 listed pieces unchanged.

## What shipped (squash-merged on `main`, `test` green on each head, each thread read)

- S687's 15 memory rows applied: supabase-migrate run 44639823760 from `claude/s688-memory-apply` (never merges).
- **#3500 `31e039c4`** Cosumnes River pins. **#3529 `3e3bb837`** flagged cards leave the confidence scorer.
  **#3578 `f6f67759`** First Light puts back a timestamp-only report. **#3537 `258a61d4`** Mt. San Antonio's SLO
  reader (an unfiled page counts wrong). **#3579 `ef16178c`** rule D keeps an older read's mark where a newer scoped
  read did not reach. **#3577 `45af74fd`** (merged at sign-off, `test` green on ec29c995): a Library check binds the
  url it checked, so a Public press after a url move no longer relists on the old url's pass (COBIx on #3572).
  **#3581 `ac093582`** Library part 2, after a second reader's two rounds, a third-round design change (the pass line
  binds to the page's content hash) and four COBIx rounds; migrations applied from `claude/s688-library-part2-apply`
  (never merges): `library_check_after_page_change` (run 44673522564), then the part-2 memory rows (eight, run
  44673553384). A live read at 04:24Z found `page_changed_at` and its trigger, the eight rows (Sam's verified), 21
  listed pieces unchanged and 0 check rows before the first real run.

## Read in order

This file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S688*; the new section of
[`playbook-runner-as-external-api-proxy`](kb-notes/playbook-runner-as-external-api-proxy.md) (a commit-back that skips
CI); the [`commons`](reference/lanes/commons.md) lane's confidence-scorer and Needs you paragraphs.

## Open work, from the lanes' NEXT lines

0. **library (#3560) comes first** (Sam, Nov 19, 3:49 PM PT, relayed by COBIx on #3560, comment 7025524965: *"move
   library fix to first in line"*, ready for Ashley). Steps 1 and 2 are done: #3577 (the url gap) and **#3581
   `ac093582`, part 2** (the check on publish, one `cpl_library_checks` row per page with its url, listing on a pass
   only after the reports are pushed, the footer line bound to a sha256 of the page's own content, and the tab's
   url-aware pre-check), both merged and applied. **Watch the first real check run** (the 06:41Z schedule of
   `library-publish.yml`, or a Publish now): its plan checks every Library page that has no proof yet, so it is
   larger than later runs. A good run adds one check row per page (`created_by` names the run and attempt), commits
   `library/<slug>/accessibility/*`, and restamps every page's line; a legacy listing that fails keeps its listing
   and shows its findings on the card. Next: **part 4**, Add existing (Ashley's flyers made outside COBI), Publish
   all, and redraft and republish; then **part 3**, the progress bar; and COBIx's rule-based pass for the under-10
   leftovers in `chatbox/supabase/functions/library-revise-draft/cobi_data.mjs` (brief of Nov 19, section 4, item 1).
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
5. **common-cr-reference:** the exact match from issue #3523 against the 2026-11-18 counts, in a plain session.

## For Sam

Nothing waits on Sam. COBIx relayed on #3560 (comment 7025524965) that he cleared
[Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) and switched the CPL Queue conductor to Opus.

## Decisions Sam made

- **The 21 legacy listings stay** (Nov 19, 7:32 PM PT, relayed by COBIx on #3581, comment 7029505105): the pieces
  listed today stay on the Public Library as "Not yet certified" while their findings are fixed, even when their
  first check fails. Only those; anything new, and any version or url change, lists only on a pass. Row
  `r-library-legacy-listings-stay-sam-2026-11-19` (verified); `sam_rulings.md`. This reversed the session's option (b).
- **The Library comes first** (Nov 19, 3:49 PM PT, relayed by COBIx on #3560): parts 2 and 4 of #3560 lead the open
  work. **A new version or url takes a piece off the Public Library until it passes** (3:42 PM PT, relayed there):
  this confirms `d-library-new-page-unlists-s687`, so Sam's Nov 19 item 9 stays set aside.
- **Session SQL needs no ask** (Sam, 2026-11-20 about 01:20Z, verbatim): *"You have sql with and don't need to ping for
  allows With Auth"*. Row `r-sql-needs-no-ask-sam-2026-11-20`, verified. Rule 10 still governs each write.

## Decisions (the session's, reversible; `cpl_memory`, proposed)

`d-oldest-finished-among-finished-s688`, `d-revert-stamp-commit-for-test-s688`. The seven rows in
`kb/migrations/2026-11-20_s688_cpl_memory_rows.sql` (rollback beside it) were applied with `execute_sql` at 01:28Z
under Sam's word above; all seven returned.

## Patterns that worked

- Reading the head's commits after each update from `main` caught the bot commits before a merge.
- Merging a finished younger PR while an older one waited on `test` kept the queue moving.

## Safety patterns to honor

All of 687's. New: `p-skip-tag-in-commit-message-s688` (never quote the skip tag in a commit message, it skips CI for
that push) and `p-bot-commit-leaves-head-untested-s688` (revert a timestamp-only bot commit with a human push).
`p-stash-unstaged-commit-s687` fired again: never stash after `git add`.

## Let go

Dropped in the sign-off turn: the COBIx watcher (re-armed every 30 minutes) and every check-in. PR subscriptions: none
held (#3577, #3580 and #3581 merged). Artifact watches: none. The vault note is a draft PR on CPLBrain (#829).

Spend: $79.01 (Opus 5.5 $79.01); collection $4.69, infrastructure $74.32; 2026-11-19T23:40Z to 2026-11-20T04:20Z.

Opening line: *Greetings, you are SkyTern (Session 689), see SkyLinnet's handoff — `docs/session_689_handoff.md` — let's keep rolling with our queue.*
