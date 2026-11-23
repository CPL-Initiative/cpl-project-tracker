---
title: "Program requirements harvest lessons — archive 8 (S687 onward)"
created: 2026-11-22
updated: 2026-11-22
tags: [lessons, archive, program-requirements, catalog-harvest]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - docs/program_requirements_harvest_lessons.md
  - docs/program_requirements_harvest_lessons_archive_7.md
---

# Program requirements harvest lessons — archive 8

Sections moved verbatim from [the lessons doc](program_requirements_harvest_lessons.md) when it neared its budget (S703 checkpoint compaction).

## Moved from the lane (S687 checkpoint, 2026-11-19)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S687 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

**The unblocker step (Sam, 2026-11-18 about 10:43 AM PT, relayed by COBIx on #3510, comment 6988133754):** before a document goes on Sam's hand-fetch list, the session tries the college's other public routes: its HTML catalog index pages, and a plain browser-like page read when the curl reader is blocked. A college read that way is marked *Sky can read 2026-27 HTML*. Never script around a WAF or a bot check, and never ignore robots.txt. The procedure: [`scheduled_sessions`](reference/scheduled_sessions.md) step 12; a refused read still follows [`blocked_sources`](reference/blocked_sources.md). #3536 stops the reader at a WAF challenge and a challenged robots.txt (follow-up: JSON calls should file `challenged`). Southwestern read in S685 (run 44529722751, $2.56, 6 new).

**Open:** #3557 (head 4bfff633; COBIx's rule: an address whose award ending was stripped passes only when `slug_awards` names the program's award kind, and `award_tail` on the decision row; replay 43 to 43) and #3558 (head 34229779; with `live_runs`, a run is named whenever a kept or new record is not live at that run, `p-second-pass-run-never-named-s685`). The second pass of the 43 runs on #3558's head, the second ten's posts on #3557's; counts in handoff 686.

**Course objectives, collected with every SLO read (Sam, 2026-11-02; `sam-data-collection-six-asks-2026-11-13`):** filed as `course_outcomes.kind` `objective`, one host at a time, never replacing an SLO row; the `objectives_reread_plan` has no step left since Golden West (S680). **PITFALL:** an objectives `.load` is written by hand. The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](reference/scheduled_sessions.md), pages only, no cost; De Anza and College of Marin held. **Next:** the day's full read and preparation run, as `--next` names them; S684's outline steps are NEXT (6). **PITFALL** `p-outcome-load-without-standing-test-s681` stands (the standing test before `.load`). The paragraph as it stood, with S683's Chabot load: lessons, *Moved from the lane (S684 checkpoint)*.

**The display apply runs live (#3190, #3204):** `step=display` writes the whole build the page carries, `display_college` one college; `d-display-first-run-one-college-s645`, `d-merge-is-publication-spot-check-first-s645` and `d-display-missing-threshold-s644` stand. The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**No display receipt is committed (S680, #3495):** a session commits the page alone; `step=display` stores the receipt in the private bucket `cpl-receipts` ([repo-size](reference/lanes/repo-size.md)). The paragraph as it stood: lessons, *Moved from the lane (S684 checkpoint)*.

**Cheap piles (S680 to S685; Sam, relayed by COBIx on #3358: *"my priority is completion and will find the funding to make it happen"*).** Two lanes, never on one college; collect with gaps. S683's two applies (#3497's 99 named-gap rows, #3508's 14 A4 rows), `d-note-pair-off-s683` and S684's #3548 (2 rows, apply 44515993146): lessons, *Moved from the lane (S685 checkpoint)*. Undo newest first: #3548's rollback, then the 99-row plan's, then S680's. S685 labeled none.

**Keep-the-better (#3553, `main` 95f85b1e):** a generic CourseLeaf heading (*REQUIREMENTS*, *Course List*, *Major Requirements*, *Requirements*) passes the own-program test only where the committed files show the page is the program's own (`page_is_own`: the address's last segment, or the capture's page title, h1 or `heading_named`, naming every title word and no other award); a live run equal to this run is `posted` and never dispatched again; a failing re-read whose live row holds this run goes to a person. Its replay of 412 decisions flipped 43, none the other way (**DECIDED** `d-keep-better-ship-verified-43-s685`; **FINDING** `f-generic-heading-cost-43-rereads-s685`).

## S687 (SkyPipit, Sam's session of 2026-11-19, started by hand at 17:56Z): nine colleges posted, display 3361e3aa5b7d confirmed, rule D

**What happened.** Sam started the session by hand with handoff 687's opening line and, at about 18:21Z, said *"keep
rolling, merge them when green"*. The run posted and loaded S685's nine-college reread, landed it with S685's second
pass and three outline index files as one wave (#3565), fixed the display apply's confirming read (#3564), ran display
build `3361e3aa5b7d` to a confirmed state (#3567), ran the gap census, and taught the discontinued check to read rule
D's marks from committed previews (#3569). Every PR merged on a green `test` after its thread was read.

**The posts (#3565 `b63a4ba9`; `m-nine-colleges-posted-s687`).**
- The live read went through the migrate runner: runs 44582982949 and 44583388525, read at 18:02:52Z, 1,555 live rows.
  The second read added `gone` to `scripts/reread_live_compare_sql.py`, so `live_runs` is exact, and limited `chk` to
  the batch.
- Keep-the-better ran against `main` 6aed4111 with `--checked`; then `step=reread` with each run pinned, then
  `step=load`. Every receipt's error is null.
- Replaced / inserted: American River 104/18, Modesto Junior 13/2, Woodland Community 15/1, Cerritos 15/0, Imperial
  Valley 7/0, Yuba 6/4, Southwestern 4/16, Grossmont 0/1, MiraCosta 0/3. Total 164 replaced, 45 inserted.
- Cerritos 44984 went to `held_for_person`: its live run 37961137169 differs from `main`'s file, 38064252862. Cerritos
  02202, a checked row, was restored.
- No decision rested on a generic heading, so COBIx's `award_tail` list from #3557 is empty for this batch.
- The wave also carried S685's second pass (the 43), the Feather River, Palomar and San Diego College of Continuing
  Education outline index files and `queue.json` rows (no load), and S684's and S685's trigger-branch receipts and SQL,
  only the files `main` lacked. Every `.apply` and `.run` trigger-file change was left out.
- Left out on purpose (`d-feather-palomar-trials-off-wave-s687`): Feather River's full read
  `kb/course_outcomes/frc/read_44535960153_p1of1.json` and both trials (44534888428, 44536105509). They fail the
  standing test's check 4 (SLOs filed with no objectives; `f-outline-readers-need-header-fixes-s685`) and stay on their
  `claude/slo-*` branches until the reader fixes land.
- **Skyline skipped** (`d-skyline-skipped-compare-page-s687`): its paid read (`claude/reread-skyline-s687`, run
  44586737073) filed only a capture-only preview; both candidates (30882 Mathematics, 45698 Engineering) point at
  `_compare.new.programs.php`, a page that compares many programs, so nothing was posted. Copper Mountain is untouched;
  its catalog address still answers 404.

**The display (#3564 `bc0bf6ee`, #3567 `52d85a7e`).**
- S685's confirming read, paged by limit and offset, answered HTTP 500. #3564 pages it by key, never by offset, as COBIx suspected
  on #3556; a page with no new key stops the read, and the check is collation-independent (COBIx's second review on
  #3564; `d-display-keyset-confirm-s687`).
- Build `3361e3aa5b7d`, 18,380 statements, in four steps: one college, Imperial Valley (run 44600185371, 125 of 125,
  confirmed); the gate (migrate run 44600769857); the whole build (run 44601141904: 18,255 written, 125 already current,
  0 errors, state `confirmed` from its own read, in under 4 minutes); the closing count (migrate run 44602140198: 18,380
  rows at the new build, 15 at `bef8ef819af7`, 16 at `0874a3a15f22`, none without a display or a build key). The first
  full build to confirm on its own read (`m-display-3361e3aa5b7d-confirmed-s687`).
- The census (run 44604899544, `main` `ab6bf57b`): 5,145 left against 5,203 (58 fewer); passing 15,044 of 20,282, up
  from 14,986 (`m-census-5145-s687`).

**Rule D (#3569 `3cbf7012`; `d-rule-d-from-committed-previews-s687`).**
- `kb/_program_discontinued.py` gains `committed_not_printed`, which reads rule D's marks from the committed capture
  files; only each college's newest read by run counts (COBIx's hunch on #3569). A capture-only preview with
  `rule_d=1` is enough, so the three reads cost nothing.
- College of the Desert (run 44596615241): 8 programs not printed in the 2026-2027 catalog: 31538 Reserve Police
  Officer, 35969 Advanced First Aid and Safety CPR/AED, 36308 Family Child Care, 36768 and 36769 Business Information
  Worker (Office Professional, Office Manager), 38979 Basic Peace Officer, 38980 Automotive Introductions, 40197
  Emergency Medical Responder Intermediate. 20 others have no own page.
- City College of San Francisco (run 44596600042): none in scope, because no CCSF record places none.
- Santa Rosa Junior (run 44610950917): 2 read, both no own page, 0 not printed. Its preview is on `claude/rule-d-s687`
  and not on `main`, which is harmless since it carries no mark.
- `kb/status/program_discontinued.json`: 9 flagged, 8 not printed. The not-printed are candidates for a prior-year read
  (`CAPTURE_PRIOR`), never flags.
- **Follow-up** (COBIx's third point on #3569): a scoped newer read (`limit` or `force`) would drop an older read's marks
  for programs it never read. Keep the older mark for control numbers the newer read did not cover.
- **FINDING** `f-rule-d-cannot-reach-dropped-records-s687`: rule D reads only committed records that place none, so the
  programs whose files S683's filing dropped while their live rows stayed are out of its reach (CCSF's 20 no-page
  programs).

**Lessons.**
- **A confirming read pages by key** (`d-display-keyset-confirm-s687`). An offset page over a table being written can
  skip or repeat rows and runs slow at depth; S685's offset-paged read answered 500 and left the record `unconfirmed`. Keyed,
  the whole 18,380-row confirm finished inside the run.
- **A test fake must follow the reader's paging** (`p-fake-table-ignores-keyset-s687`). A store test's fake table
  answered on `offset=`; once the reader paged by key it returned the same page forever and `lints` hung 55 minutes
  (run 44585137180, canceled).
- **One pending run per concurrency group** (`p-read-dispatches-share-group-s687`). Three reads dispatched on one branch;
  the middle one (Santa Rosa, run 44596607977) was canceled by the third. Space the dispatches out.
- **A `sources_from` read needs its preview filed** (`p-sources-from-needs-filed-preview-s687`): the workflow refuses it
  unless the branch files that run's preview.
- **Commit straight after `git add`** (`p-stash-unstaged-commit-s687`). A `git stash` and `pop` between them left the
  code half of #3569's first commit unstaged; COBIx caught it.
- **The sandbox cannot download run artifacts** (`p-artifact-host-blocked-s687`): the blob host is blocked, so a
  session reads a run through its committed receipt or its log.

## Moved from the lane (S688 checkpoint, 2026-11-20)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S688 checkpoint; the lane keeps a one-line pointer to each.

**S687's posts at nine colleges (#3565 `b63a4ba9`; `m-nine-colleges-posted-s687`):** 164 rows replaced and 45 inserted, every receipt's error null; the live read through the migrate runner, keep-the-better with `--checked`, then `step=reread` with each run pinned and `step=load`. Cerritos 44984 went to `held_for_person`. Skyline skipped (**DECIDED** `d-skyline-skipped-compare-page-s687`: both candidates point at `_compare.new.programs.php`, a page comparing many programs). Feather River's full read and the Feather River and Palomar trials stay on their `claude/slo-*` branches (**DECIDED** `d-feather-palomar-trials-off-wave-s687`). Per college: lessons, *S687*.

**Rule D (S687, #3569 `3cbf7012`; **DECIDED** `d-rule-d-from-committed-previews-s687`):** `kb/_program_discontinued.py` `committed_not_printed` reads rule D's marks from the committed capture files, each college's newest read by run only. Run at College of the Desert (8 not printed in the 2026-2027 catalog, 20 with no own page), City College of San Francisco (none in scope) and Santa Rosa Junior (2, no own page); `kb/status/program_discontinued.json` holds 9 flagged and 8 not printed, and a not-printed program is a candidate for a prior-year read (`CAPTURE_PRIOR`), never a flag. **FINDING** `f-rule-d-cannot-reach-dropped-records-s687`: rule D reads only committed records that place none, so programs whose files S683's filing dropped while their live rows stayed (CCSF's 20 no-page programs) are out of its reach. Runs and control numbers: lessons, *S687*.

## S688 (SkyLinnet, Sam's session of 2026-11-19, started 23:40Z with handoff 688's opening line): the merge queue, five merged

**What happened.** Sam pasted handoff 688's opening line and gave no other direction. The run applied S687's 15 memory
rows, worked the merge queue to five squash merges on a green `test` (each thread read first), and merged a sixth at
sign-off (#3577, the Library check that binds the url it checked). The COBIx watcher ran all session, re-armed every 30 minutes.

**The memory apply (`m-s687-rows-applied-s688`).** supabase-migrate run 44639823760 from the trigger branch
`claude/s688-memory-apply` (never merges) applied `kb/migrations/2026-11-19_s687_cpl_memory_rows.sql`; all 15 slugs
returned. The receipt, `kb/migrations/receipts/migration_s687_cpl_memory_rows_44639823760.json`, is on that branch.

**The merges (`m-s688-five-merged`).**
- #3500 `31e039c4`: Cosumnes River's four local degrees pinned to their heading's page (04602 and 04614 stay as filed).
  The paid read still waits on the named-programs-only `only` input #3500's body describes.
- #3529 `3e3bb837`: flagged cards leave the confidence scorer and its apply. COBIx's point 4 there: after the update,
  take `--expect` from the dry run's own count, never the 2859 the PR body printed.
- #3578 `f6f67759`: `first-light-art.yml` puts back a report whose only change is `_generated`; its own run on the
  branch made no commit-back.
- #3537 `258a61d4`: the Mt. San Antonio SLO page reader. COBIx (comment 7026617916): an unfiled page in
  `mtsac_recall.json` raised instead of counting; it now counts wrong as "page not filed" (test 9/9; COBIx verified in
  7026674586). Next: a 12-page trial, counted by eye into `mtsac_recall.json`.
- #3579 `ef16178c`: rule D's `committed_not_printed` walks a college's reads newest first, and an older read's mark
  stands for control numbers no newer scoped read covered (`read_covers`); a read filed before fingerprints counts as
  the whole college. `program_discontinued_test` 26/26; the status file is unchanged (9 flagged, 8 not printed).
- Order (**DECIDED** `d-oldest-finished-among-finished-s688`): "the oldest finished first" was read as the oldest among
  the PRs that are finished, so #3578 and #3579 merged while an older PR still waited on its tests.

**The bot commits (`p-bot-commit-leaves-head-untested-s688`, `d-revert-stamp-commit-for-test-s688`).** On #3500 and
#3529, the update from `main` carried #3571's `first_light.js`, so `first-light-art.yml` ran on the branch and committed
a timestamp-only `tools/first_light_verify.json` with the skip tag onto the PR head. A commit pushed with the built-in
token or the skip tag starts no workflow, so the head had no `test` run and the doctrine-level gate could not be met.
Each was reverted by a human push that restored the exact tree `test` had passed on. #3578 removes the cause: the
workflow puts back a report whose only change is its own stamp.

**The skip tag in a human message (`p-skip-tag-in-commit-message-s688`).** The first revert message on #3500 quoted the
bot commit's subject, tag and all, and GitHub skipped that push too: it honors the tag anywhere in the head commit's
message, quoted or not. The commit was reworded and pushed with `--force-with-lease`. In a commit message, call it the
skip tag.

**The stash slip, again (`p-stash-unstaged-commit-s687`, a repeat).** On #3579 the code file was staged, then stashed
and popped to prove the test fails without it; the pop restored it unstaged, and commit 49bdf050 carried only the test
and the lane. The stop hook caught it and aeb4d529 added the code. S687 wrote this rule a day earlier. The rule as it
reads is right; the failure is doing the stash at all once a file is staged. Prove a test fails without the fix in a
scratch worktree or with `git show HEAD:<file>` into a scratch path, never by stashing the working tree after `git add`.

**At sign-off.** #3577 merged at `45af74fd` (squash, `test` green on ec29c995; COBIx's #3572 comment 7023899407: after
a url move, a Public press relisted on the old url's pass). SQL proof 69/69, `library_publishing_model` 60/60,
`public_library` 138/138. Its two migrations were applying from the trigger branch `claude/s688-library-gate-apply`
(never merges): `library_check_binds_url` (commit f3354f83), then `s688_library_memory_rows` (commit ea5bd537, row
`d-library-check-binds-url-s688`). Its lane edit landed with the PR.

**Lessons.**
- **A commit-back that skips CI moves a PR head past its checked commit.** With `test` as a doctrine-level gate, that
  blocks the merge rather than slipping past it, which is the gate working. Fix the producer so a no-change report makes
  no commit; until then, revert to the tested tree with a human push.
- **Never quote the skip tag in a human commit message.** Describe it in words.
- **An update from `main` can start a branch-scoped workflow.** A PR that touches nothing of First Light's still runs
  `first-light-art.yml` when the merge brings in a changed watched path; read the head's commits after every update.
