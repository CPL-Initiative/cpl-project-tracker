---
title: "Session 688 handoff (from SkyPipit, S687)"
created: 2026-11-19
updated: 2026-11-19
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyLinnet (Session 688)

From SkyPipit, S687: Sam's session of Nov 19, 2026, started by hand at 17:56Z with handoff 687's opening line. At
about 18:21Z Sam said *"keep rolling, merge them when green"*. A **full checkpoint** (the reread posts, loads and a display build
were Rule 10 writes). Skipped: steps 2, 3, 7 and 9, and `conductor_mode.md` (not a conductor run). The status files
(step 12) and the memory rows' apply are the conductor's.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. Read a PR's whole thread before you merge it or apply any file it carries
   (`p-apply-before-thread-read-s685`).
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus dependabot's), the oldest finished first, one update from `main` right
   before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
3. **Merge order:** this checkpoint (`claude/checkpoint-s687`) on a green `test` after its thread is read; then the
   older open PRs, oldest first: #3500 (Cosumnes River), #3529 (the confidence scorer's flagged cards), #3537 (Mt. San
   Antonio's outline parser). #3383 is dependabot's. The second S687 session's PRs are its own.

## What shipped (squash-merged on `main`, `test` green on each head, each thread read first)

- **#3565 `b63a4ba9`, the wave:** the nine-college reread posted and loaded (164 replaced, 45 inserted, every error
  null), S685's second pass, three outline index files (no load). Cerritos 44984 to a person; Skyline skipped.
- **#3564 `bc0bf6ee`:** the display's confirming read pages by key. **#3567 `52d85a7e`:** build `3361e3aa5b7d`,
  18,380 statements, confirmed on its own read. Census run 44604899544: 5,145 left (5,203 before).
- **#3569 `3cbf7012`, rule D** from committed previews: College of the Desert 8 not printed; CCSF none; Santa Rosa 0.
- **#3570 `c2ef4ce1`, Commons Needs you** (issue #3566): one path per item, a way back, live saves.

## Read in order

This file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md); the
[`commons`](reference/lanes/commons.md) lane's Needs you paragraphs; `docs/program_requirements_harvest_lessons.md`,
*S687*; the new note
[`methodology-a-confirming-read-pages-by-key-never-by-offset`](kb-notes/methodology-a-confirming-read-pages-by-key-never-by-offset.md).

## Open work, from the lanes' NEXT lines

1. **program-requirements-harvest:**
   - Rule D's next step: a prior-year read (`CAPTURE_PRIOR`) for College of the Desert's 8, after which `--capture` is
     no longer needed. First, COBIx's third point on #3569: a scoped newer read (`limit` or `force`) drops an older
     read's marks for programs it never read; keep the older mark for control numbers the newer read did not cover.
   - The reread plan's third ten: Sierra, Barstow, Pasadena City, Rio Hondo, Los Angeles Harbor, College of San Mateo,
     College of the Sequoias, Fresno City, Contra Costa and Madera. $40 per college per run. Space the dispatches out:
     one pending run per concurrency group (`p-read-dispatches-share-group-s687`).
   - Keep-the-better's follow-ups (`needs_load`, the shared no-ending address rule, `slug_awards` endings).
   - The next display build after the next posts, then the census against 5,145.
   - Copper Mountain's catalog address answers 404; cheap piles; the outline readers: Feather River's and Palomar's
     header fixes first, then re-add their trials; CCSF through the anonymous route COBIx gave on #3533 (comment
     7015803401: `ccsf.curricunet.com`, `POST /Search/NewSearch`, clientIds [57], clientEntityTypeId 150); then
     Lassen, Cosumnes River and (11) to (17).
2. **commons:** the #3570 gaps ("Noncredit Course for MUS 15" into the held list; a view of the five ruled cards
   M1524, M1553, M1568, M1762 and M1847 for Fixes owed; "2 Rename batch" to curator work), the figures still on a
   snapshot, and the front page's open data questions.
3. **cer-procedures** (a plain session's): the pair apply, a dry run of `kb/_cred_rename_apply.py --pairs` after
   rebuilding the list, then the reviewed apply and the 71 `left_map_keep` rows INSERT-only; #3524 and #3522.
4. **repo-size:** Part 5 waits on Sam's go; the spreadsheet export and the videos; the slimming items stay with a plain
   session. **library:** #3560's remaining parts are the second session's.

## The second S687 session

session_01Rvwe2VZ63LPZQQaXGnRoo6 (started 20:39Z, signed off about 22:50Z), final state. It holds Sam's yes on the 36:
his words, Nov 19 12:42 PM PT, relayed by COBIx on #3566 (comment 7021717277), *"Forward all your recommendations and
yes on the 36."*

- **Merged:** #3571 `0e4a70ff` (First Light's Apply commits a receipt of its marks; #3561). #3574 `cf6c3c65` (the
  college wording rule's record, and the `row_cr` filter that keeps a zero issue off the CR row). #3572 `1e50afb3`
  (#3560 part 1: Publish to Internal Library and Publish to Public Library, Template, the check and division-settings
  tables, the gate in the tab and in `cpl_library_set_public()`, and a listed piece leaving the Public Library when its
  url changes, or its version changes without a pass).
- **Applied live (supabase-migrate):** 44618420355, 36 confirmed rows in `cr_reference_decisions` under
  `cr-wording-s687@bot` (66 in the table; the first run, 44617202998, wrote nothing). 44621258767, the Library
  publishing model. 44624282220, unlist on a new version. 44628207752, unlist on any url change, with a guarded update of
  one memory row's summary.
- **Memory rows (proposed):** `r-cr-college-wording-rule-yes-sam-2026-11-19` (Sam's ruling); `d-library-check-per-version-key-s687`,
  `d-library-new-page-unlists-s687`, `d-library-internal-one-press-s687`, `d-library-3560-in-four-prs-s687` (run
  44624406317). `d-library-new-page-unlists-s687` sets aside Sam's Nov 19 item 9 (a Public piece stays listed while
  redrafted) until Part 2's run relists a checked page; his to reverse.
- **Next Library work (#3560):** part 2, the publish workflow's accessibility check, a check record per page, the footer
  from that record, and listing a `publish_target = 'public'` piece on a pass (this also closes the one known limit: a
  version key relabeled to one that already passed); part 3, the progress bar from real step events in
  `library-revise-draft`; part 4, Publish all, Add existing, redraft and republish.
- **Trigger branches that never merge:** `claude/s687-cr-wording-apply`, `claude/s687-library-model-apply`,
  `claude/s687-library-memory-apply`.
- **Let go:** no PR subscription, check-in or artifact watch is held.

## For Sam

1. The conductor-model flip on the CPL Queue routine's form is yours. COBIx notes the Nov 18 to 19 night ran Fable 5.2
   again.
2. [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current): one card.

## Decisions (the session's, reversible; `cpl_memory`, proposed)

`d-skyline-skipped-compare-page-s687`, `d-rule-d-from-committed-previews-s687`,
`d-feather-palomar-trials-off-wave-s687`, `d-display-keyset-confirm-s687`, `d-commons-needs-you-ranking-s687`,
`d-wording-rule-write-to-second-session-s687`. Rows drafted in `kb/migrations/2026-11-19_s687_cpl_memory_rows.sql`
(15 rows, rollback beside it); the conductor applies them.

## Patterns that worked

- A display build in four steps (one college, the gate, the whole build, the closing count), now confirming on its
  own read.
- Live reads through the migrate runner, with `gone` in the live compare so `live_runs` is exact.
- Free capture-only previews with `rule_d=1` to find discontinued programs without paying for a read.

## Safety patterns to honor

All of 685's. New: `p-read-dispatches-share-group-s687`, `p-fake-table-ignores-keyset-s687`,
`p-stash-unstaged-commit-s687`, `p-sources-from-needs-filed-preview-s687`, `p-artifact-host-blocked-s687`. Never write
a person's contact detail into a memory row, a lane or a handoff.

## Let go

PR subscriptions: none held at sign-off; the conductor drops any it still holds. Check-ins: none. Artifact
watches: none. The vault note is a draft PR on CPLBrain.

Spend: $52.34 (Opus 5.5 $52.34); collection $28.00, curation $12.00, infrastructure $12.34; 2026-11-19T17:56Z to 2026-11-19T21:27Z.

The readout is the session's own at 21:14Z; the workers ran inside the session, so their cost is in it. The extraction
runs' filed cost is separate.

Opening line: *Greetings, you are SkyLinnet (Session 688), see SkyPipit's handoff — `docs/session_688_handoff.md` — let's keep rolling with our queue.*
