---
title: "Program requirements harvest lessons — archive 8 (S687 onward)"
created: 2026-11-22
updated: 2026-11-25
tags: [lessons, archive, program-requirements, catalog-harvest]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - docs/program_requirements_harvest_lessons.md
  - docs/program_requirements_harvest_lessons_archive_7.md
---

# Program requirements harvest lessons — archive 8

Sections moved verbatim from [the lessons doc](program_requirements_harvest_lessons.md) when it neared its budget (S703, S713, S714, S720, S721 and S727 checkpoint compactions).

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

## Moved from the lane (S689 checkpoint, 2026-11-20)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S689 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

**Display build `3361e3aa5b7d` is live, confirmed on its own read** (S687, #3567 `52d85a7e`; 18,380 statements; one college, the gate, the whole build, the closing count, run ids in lessons, *S687*). The confirming read pages by key, never by offset (#3564 `bc0bf6ee`; a page with no new key stops it; **DECIDED** `d-display-keyset-confirm-s687`). The gap census of 2026-11-19 (run 44604899544, `main` `ab6bf57b`): 5,145 left of 20,282, passing 15,044 (`m-census-5145-s687`).

**The reader's page checks (#3514) and the reread waves.** Rules A to C check the pages a record placing no courses was read from (`CPL_READER_PAGE_CHECKS`, on); rule D is off unless the dispatch input `rule_d` sets it. Plan `kb/program_requirements_reread_plan_s683.json`: 444 records at 73 colleges; its per-college ceilings price only the aim rows, and the stop is $40 per college per run (**DECIDED** `d-reads-stop-is-forty-dollars-s685`). Earlier waves and #3547's guard: lessons, *Moved from the lane (S685 checkpoint)*. **Keep-the-better** (#3553, `main` 95f85b1e): a generic CourseLeaf heading passes the own-program test only on the program's own page (`page_is_own`); a live run equal to this run is `posted`; a failing re-read whose live row holds this run goes to a person (the rule as it stood: lessons, *Moved from the lane (S687 checkpoint)*). #3557 (`995d7c41`: a stripped award ending passes only when `slug_awards` names the program's award kind; `award_tail` on the decision row) and #3558 (`741129e5`: with `live_runs`, a run is named whenever a kept or new record is not live at it) are on `main`. **FINDING** `f-reread-drops-files-live-rows-stay-s684` stands.

**S687's posts at nine colleges (#3565 `b63a4ba9`; `m-nine-colleges-posted-s687`; `d-skyline-skipped-compare-page-s687`, `d-feather-palomar-trials-off-wave-s687`):** the paragraph as it stood, lessons, *Moved from the lane (S688 checkpoint)*.

**Rule D (S687, #3569 `3cbf7012`; S688, #3579 `ef16178c`; `d-rule-d-from-committed-previews-s687`, `f-rule-d-cannot-reach-dropped-records-s687`):** `kb/status/program_discontinued.json` holds 9 flagged and 8 not printed; a not-printed program is a candidate for a prior-year read, never a flag. The paragraph as it stood: lessons, *Moved from the lane (S688 checkpoint)*.

**NEXT, in order:** (0) The RCCD pilot (#3438, S671; `d-rccd-pilot-no-blind-force-s671`) stands: never force a re-extraction blind, read the failing pages for free first. (1) Read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); revert a timestamp-only bot commit on a PR head so `test` runs (`d-revert-stamp-commit-for-test-s688`; #3578 stops the First Light one). (2) **Rule D's next step:** a prior-year read (`CAPTURE_PRIOR`) for College of the Desert's 8; after it, `--capture` is no longer needed. COBIx's third point on #3569 is fixed (S688, #3579 `ef16178c`): `committed_not_printed` walks a college's reads newest first, and an older read's mark stands for a control number no newer read covered (`read_covers`: fingerprinted, not found, claimed or challenged); a read filed before fingerprints counts as the whole college. (3) **The reread plan's third ten:** Sierra, Barstow, Pasadena City, Rio Hondo, Los Angeles Harbor, College of San Mateo, College of the Sequoias, Fresno City, Contra Costa and Madera; the stop is $40 per college per run (`d-reads-stop-is-forty-dollars-s685`); space the dispatches out, one pending run per concurrency group (`p-read-dispatches-share-group-s687`, `p-runner-pool-starves-migrate-s683`); a `sources_from` read needs the branch to file that run's preview (`p-sources-from-needs-filed-preview-s687`). (4) **Keep-the-better's follow-ups, a plain session's:** `needs_load` (a record with no live row names `step=load`, never a reread; compare run ids rather than test inequality; print the live read's time beside `receipt_on_branch`; COBIx on #3558); a no-ending address two awards share counts as the program's own only when no other program at the college with the same bare title has another award kind (replay the 292; COBIx on #3557); teach `slug_awards` the endings (`-certificate` 567, `-ca` 204, `-cert` 84, `-for-transfer` 76 of 1,708). (5) **The display:** the keyset confirm is done and build `3361e3aa5b7d` is confirmed; the next build after the next posts, then `harvest-gap-census.yml` on `main` against 5,145. (6) Copper Mountain's catalog address answers 404: find the current one; #3536's `challenged` follow-up. (7) Cheap piles: the narrower A5 with its self-check; the `no_units_printed` wording (9 records); the six `NOTE_PAIR_ON` records to a person; #3508's finding 4; Sierra's reader of `together` (a plain session). (8) Step 11 ([`scheduled_sessions`](reference/scheduled_sessions.md)), outline readers, each on its `claude/slo-*` branch (`p-helper-reads-only-newest-file-s685`). **Reader fixes first, then re-add the trials** (`f-outline-readers-need-header-fixes-s685`): Feather River (`claude/slo-feather_river` 98a47f9a; full read 44535960153, 337 pages; 336 of 2,072 SLOs are the *Learning Outcomes* table header; standing test 24 of 26) and Palomar (`claude/slo-palomar` 78edbf37; trial 44536105509 filed the objectives section and table headers as SLOs). **The index search:** San Diego College of Continuing Education (reindex 44536348461, 0 of 242) and Rio Hondo (discover 44508907581): `search_all` in `kb/_course_outline_index.py` presses Search when no NewSearch request arrives. **CCSF:** COBIx's comment 7015803401 on #3533 gives an anonymous route, `ccsf.curricunet.com` `POST /Search/NewSearch` with clientIds [57] and clientEntityTypeId 150 (1,975 Active courses; report 28 prints SLOs); `route_of` must accept `curricunet.com` and its census row must name that host. Peralta (one code holds up to four colleges' records), Mt. San Antonio (#3537 `258a61d4` merged: the SLO page reader refuses a full read until a 12-page trial is counted by eye into `kb/course_outcomes/mtsac_recall.json` and 90% parse right; an unfiled page counts wrong), Saddleback and Irvine Valley (status words other than *Active*). A plain session adds the standing test to `course-outcomes-load.yml`. (9) Lassen: the structured-fields migration's step 1, Lassen first; 31297, 35106 and 41912 held. (10) Cosumnes River (#3500 `31e039c4` merged: four local degrees pinned to their heading's page; 04602 and 04614 stay as filed): the paid read waits on the named-programs-only `only` input #3500's body describes. (11) #3293, parked as issue #3525: decide in a plain session. (12) #3502's reader changes, cheapest first, with the two changed-page records (figures: lessons, *Moved from the lane (S685 checkpoint)*). (13) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then a PR sets the default on. (14) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (15) The teach-out rule (#3491), after a runner capture. (16) Los Medanos's and Los Angeles Valley's program rules, with a person. (17) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** Cerritos 44984 (`held_for_person`, S687); West Los Angeles 38677 (`held_for_person`); Los Angeles Mission 44849 (no live row); Los Angeles City 32832 (live run 39006380342, `main` files 43212072618); Ventura 45355 and Shasta 18153 (`held_for_person/`, S684). Older lists: lessons, S653, S666 and *Moved from the lane (S684 checkpoint)* and *(S685 checkpoint)*.

## S689 (SkyTern, the CPL Queue routine's 06:12Z conductor night, 2026-11-20): the third ten, Santa Rosa Junior, the page checks' fold, two outline loads

**What happened.** The firing started at 06:13Z with no session live, dispatched `daily-dashboard.yml` on `main` (run
44686461006), restarted the COBIx watcher and declared with draft #3584 at 06:22Z: the first night with an Opus 5.5
conductor (Sam's switch of Nov 19, relayed by COBIx). Lane 1 ran three workers (the reread plan's third ten; the free
page-finding levers at six colleges; the outline readers) with second readers on #3587 and on the outline PRs; lane 2,
the cheap piles, started at 09:18Z once the pages worker signed off. The 06:24Z daily run turned `main` red on data:
four high schools joined `kb/credentials.json` with no issuer tag. Merged, each on a green `test` after its thread was
read: #3589 `41cae8c9` (07:27Z, the four issuer tags), #3588 `3a73ff71` (07:53Z, City College of San Francisco's
CurricUNET route), #3587 `cd9e8451` (08:19Z, the page checks' fold and refusal mark), #3590 `2d3d28b2` (09:37Z, its
follow-ups), #3586 `9d11684a` (09:51Z, the outline readers) and #3591 `d449bb5d` (10:13Z, the wave). Still running at
this writing: Mt. San Antonio's outline read and load, and lane 2's drafts #3592 to #3594, #3596 and #3597 (first review
round at about 10:30Z); #3595 carries the outline files and #3598 the display page file.

**The numbers.**
- **Program records: 79 new, 43 replaced by a better re-read; $12.54 of extraction runs.** The third ten ($8.32;
  replaced and new): Sierra 0 and 1 ($0.09, run 44687646623), Barstow 2 and 12 ($1.64, 44687777798), Pasadena City 0
  and 3 ($0.22, 44688457642), Rio Hondo 1 and 0 ($0.05, 44688858512), Los Angeles Harbor 4 and 2 ($1.24, 44687664966;
  44947 held for a person), College of San Mateo 0 and 0 ($0, 44687781989), College of the Sequoias 1 and 8 ($0.81,
  44688217584), Madera 19 and 8 ($1.97, 44692816081; 39814 restored, its COCI title spelled *Philosphy*), Fresno City 0
  and 14 ($0.76, 44692355661, preview 44687668669; 12 still lack their own page) and Contra Costa 10 and 8 ($1.54,
  44687786167). Live read 44695498920 (07:33:41Z, against `main` 41cae8c9, 1,419 live rows; Sierra 21525's live row is
  run 38675248607 where `main`'s file says 39726642315); 46 record files dropped, none passing, none live.
- **Santa Rosa Junior** (`m-santa-rosa-junior-reread-s689`): capture 44699694768; capture and extract 44701011374 (37
  calls, $4.22); live read 44702529336 (08:27:32Z, against `main` 8f37e3fb); keep-the-better 22 new, 7 kept, 3 restored
  (16986, 32357, 37016), 1 held (37014, no heading); reread 44703039037 (29 posted, 6 of them replacing); load
  44703311509 (23 inserted with 42872, 234 kept). Of its 34 refusals, 22 found their own page and 12 did not (06623,
  19287, 19328, 19329, 21709, 21722, 31378, 37254, 39939 to 39942); 13898 stayed unpaid (a known wrong page); 37016 hit
  `max_tokens`, so `main`'s file stands. Its census gaps went from 41 to 19.
- **Outline rows: 2,550** (`m-feather-river-palomar-outlines-s689`). Feather River: read 44695075698 (1,723 SLOs on 337
  pages), load 44700832207, 336 SLO rows and no objectives (report 485 prints none). Palomar: read 44695267546 (four
  parts, 1,108 pages), load 44708472734, 1,108 SLO rows and 1,106 objective rows.
- **The six free captures** (extract 0; College of the Canyons 44687772295, City College of San Francisco 44687776552,
  Santa Rosa Junior 44687780496, Ohlone 44687785539, San Joaquin Delta 44687789699, Santa Barbara City 44687793666).
  Only Santa Rosa Junior had paid potential (up to 31 certificates, up to $3.45). The leftovers: College of the Canyons'
  97 noncredit programs need a second source; Ohlone's 17 noncredit sit outside the PDF; San Joaquin Delta's codes
  differ (a wording item); Santa Barbara City's 9 noncredit have no page, and 32513 reads the all-awards page. City
  College of San Francisco's free rule D capture (44699726074, `claude/s689-rule-d-ccsf` db42cafd): 27 not printed, 13
  with no own page, 20 not found and unmarked.
- **The display build and the census** (`m-display-build-live-s689`, `m-census-5069-s689`). Build `4c57fd250cce`
  replaces `3361e3aa5b7d`: one college first (Barstow, run 44718082566, 68 of 68); the gate (migrate 44718607626 at
  10:23:23Z: 18,324 rows at `3361e3aa5b7d`, 67 with no display, which are tonight's inserts, and 15 and 16 at two older
  builds; none of 18,490 without a build key); the whole build (44718939233: 18,391 written, 68 current, no errors, done
  10:28:31Z); the closing count (migrate 44719715170 at 10:31:04Z: 18,459 at `4c57fd250cce`, 15 and 16 at the two older
  builds, none of 18,490 without a display or key). The page file rides #3598; the gate and close-read receipts sit on
  `claude/s689-display-gate-read` (d4bc261a) and `claude/s689-display-close-read` (146cd876) for the next wave. The
  census (run 44719996895, `main` fb454129, 10:36Z): 5,069 left of 20,282, 76 fewer than 5,145; passing 15,120 (15,044
  before); collected with gaps 93; `places_none` 396 to 309; `page_not_found` up 10.
- **City College of San Francisco's outlines:** census 44695851118 (`ccsf.curricunet.com`, public, SLOs in report 28),
  index 44696736058 (13,572 rows; 1,417 of the 1,469 wanted have an outline; no names filed).
- **Lane 2 so far:** College of the Desert's prior-year read found none of its 8 readable (runs 44710248023,
  44710824364, 44711286839, 44711759115; `f-desert-prior-catalog-behind-robots-s689`). Lever 2 is not ruling 3: 81
  records name Cal-GETC alone, 34 a combined *GE and electives* line, the rest local or either-or. #3593's dry run
  fills 15 of 22 rows at Berkeley City (14 fail to pass, none pass to fail); the worker's gate recall, 320 right and 10
  wrong, did not reproduce for the second reader (the plain gate fills 696, 61 wrong, of 977; none at Berkeley City), so
  #3593 waits for its `--calgetc-review`. Lever 4 has no PR (19 print no total, 16 one end, 13 short, 12 sum to zero, 5
  over, 3 a term ratio). The first review round (about 10:30Z): #3594 merges (endings recall 895 right and 1 wrong in the
  reader's count); #3592 waits for a self-recall test of `year_pdf_link`; #3596's `needs_load` lists rows a load never
  inserts; #3597 misses Redwoods 22673 (a title naming no award shows nothing when the title is shared); fixes sent.

**Lessons.**
- **A ligature in a PDF heading refused the program's own page** (`f-ligature-refusals-s689`). Santa Rosa Junior prints
  every certificate heading with the fi ligature, so rule A refused 34 programs there on Nov 19, 31 of them
  certificates. The scorer learned the stand-in glyphs in S405; the page checks, written later, matched without them.
  #3587 folds before the match with the scorer's own table, imported (Solano's openings: 21 of 151 read, against 9 with
  the real ligatures alone). The second reader's replay over 4,705 filed PDF windows at 31 colleges: 203 refusals become
  accepts, none wrong; rule D 3, right. Those 31 are the replay's scope: on `main`'s 4,903 windows after #3590 the
  ligature text sits at four colleges (Cañada 30 of 70 windows, College of the Desert 244 of 358, Santa Rosa Junior 106
  of 259, Solano 93 of 151). The note: [`methodology-a-pdf-ligature-hides-a-heading-from-an-exact-match`](kb-notes/methodology-a-pdf-ligature-hides-a-heading-from-an-exact-match.md).
- **A refusal left no record, so the next capture gave the refused page back.** The free captures showed it at City
  College of San Francisco (40 refused programs back on course descriptions, pages 561 to 578 and 643), Santa Rosa
  Junior (34) and Ohlone (7). `refused_filed` keeps such a program marked until a committed record places its courses:
  263 programs at 35 colleges on `main`. A refusal beside the plain picker's own named heading (`plain_named`; Ohlone
  33319 on p.46 and 46035 on p.96) is left out (#3590).
- **A `sources_from` read re-pays the pages the checks refused** (`p-sources-from-repays-refused-pages-s689`). City
  College of San Francisco's preview 44596600042 would have extracted 40 refused programs, 28 on description pages, and
  Santa Rosa Junior 13898 was handed p.435. `stage_sources` now holds a staged page the rules did not accept; Santa Rosa
  Junior paid through a fresh capture and extract.
- **Two review rounds, then ship the verified part** (`d-reader-pages-ship-after-two-rounds-s689`): #3587 merged on the
  verified part, COBIx confirmed the open items (comments 7033947220 and 7033948379), and #3590 closed them within the
  hour (replay against `main`: 0 flips). #3586's second round said merge; its three points went to COBIx (comment
  7035679771).
- **A trial that parses whole pages can pass while the full read fails** (`p-reader-cap-hides-mtsac-results-s689`).
  Mt. San Antonio's course results block sits past 671,000 characters of HTML and the Reader keeps 400,000, so full
  read 44695707506 filed the course listing as every page's SLOs. It was canceled after 2 of 5 parts and `never_load`
  names it; `read_one` now cuts the browser's whole HTML at that length, and a page with no block files none.
  `www.mtsac.edu` refuses the sandbox proxy, so the diagnosis came from the filed pages.
- **An exemption can turn a standing test green on a read nobody can reparse.** Report 485's exemption passed Feather
  River's read 44535960153, which filed no pages; `never_load` in `queue.json` names it, and the new full read loaded.
- **Outline pages can name staff** (`d-ccsf-outline-trial-no-staff-names-s689`, `q-trial-pages-file-staff-names-s689`).
  City College of San Francisco's report 28 names curriculum staff, and 37 trial pages on `main` already file
  originator names. The CCSF trial waits until it files parsed outcomes only (course id, outcome text, report url).
- **Golden West's HTML path filed a header as an outcome** (`f-golden-west-474-header-rows-s689`): of its 568 live SLO
  rows, 474 carry *Course Outcomes* (470 as the first), all from read 41399075269. A guarded update with before-values
  and a reader fix, in the cheap piles or the next session.
- **Copper Mountain's catalog moved** to `cmccd.curriqunet.com` (`f-copper-mountain-catalog-moved-s689`); its registry
  row changes by a plan or the weekly census apply (Sundays). Cosumnes River's `only` input does not exist yet.

## Moved from the lane (S690 checkpoint, 2026-11-20)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S690 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

**Older rulings and notes** (Sheets 23, 25, 26, 29, 32, 33, 50 and 77; the sequence pass; CSU LA later): lessons, the S335, S336, S353, S387, S394 and S422 compactions.

**Measured (2026-10-03):** the Program Course File names every course a program lists (the closed list each record is checked against) but marks none required. Detail: lessons archive, S334.

✅ **Sheets 38, 39 and 42's rulings, the Progress view (S343, #1900, its status file written at step 12) and the older NEXT** (Schedule+ for Spring 2027, the film, the addenda reading agent, SkyView ROEP): lessons, *Moved from the lane (S653 checkpoint)*.

🔨 **Phase 2, a college at a time:** the load, the display and the $40 go: lessons archive 4, *Moved from the lane (S648, Glendale loaded)*.

**Standing decisions of S640 and S641, throughput (S644-S647) and the gap census** (`d-passes-live-stays-equal-only-s644` stands): lessons archive 4, *Moved from the lane (S648 checkpoint)*.

**Display build `4c57fd250cce` is live, confirmed by its closing count** (S689, #3598; 18,459 programs; one college first, Barstow 68 of 68, run 44718082566; the gate 44718607626; the whole build 44718939233, 18,391 written and 68 current, no errors; the closing count 44719715170; `m-display-build-live-s689`). The confirming read pages by key, never by offset (#3564 `bc0bf6ee`; **DECIDED** `d-display-keyset-confirm-s687`). The gap census of 2026-11-20 (run 44719996895, `main` fb454129): 5,069 left of 20,282, passing 15,120; `places_none` 396 to 309 (`m-census-5069-s689`).

**Standing from S645 to S648** (the #3193 rescore, the PDF reader, Desert, Glendale, district profiles): lessons, *Moved from the lane (S680 checkpoint)*.

**Standing from S648 to S651** (Cal-GETC 34, #3244; Sheet 195's rulings; Cosumnes River, #3288; Lassen, #3291; Sam's `sam-three-colleges-rules-first-2026-11-13` and `sam-noncredit-total-hours-2026-11-13`): every DECIDED slug and pitfall, lessons, *Moved from the lane (S652 final refresh)*.

**Catalog-first collection (Sam's go, 2026-11-14; `sam-catalog-first-collection-2026-11-14`, `d-catalog-first-slice-order-s652`):** the paragraph as it stood, lessons, *Moved from the lane (S681 checkpoint)*.

**Slice C, prefix aliases (#3301), and the course-id route (#3312, S653):** `d-prefix-alias-evidence-rule-s652`, `d-crsid-seven-retire-ten-stay-s653` and **PITFALL** `p-mis-codes-carry-record-id-suffix-s652` stand. The paragraph as it stood: lessons, *Moved from the lane (S681 checkpoint)*.

**The course-id rescore at six colleges (#3352, S655)** is done, display build `58b763170559` live: lessons, *Moved from the lane (S668 checkpoint)*.

**A GE-pattern page has one owner (#3324, S654):** every DECIDED slug and the paragraph as it stood, lessons, *Moved from the lane (S670 checkpoint)*.

**Slice A, the no-closed-list lookup (#3300; `ncl_lookup`, default 1) and the page yield (#3408, S668; `d-ncl-page-yield-s668`)** stand; **PITFALL** `p-new-matcher-needs-self-recall-test-s652`; **PROCEDURE** `p-yield-holder-live-row-after-filing-s668`. The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**Slice B** (the completeness base counts catalog-listed Active programs; #3414's `NCL_EXTRACT`, default off; `d-no-list-record-scored-without-state-list-s668`, `d-named-course-minimum-one-s667`): the paragraph as it stood, lessons, *Moved from the lane (S681 checkpoint)*.

**The passing dry run (#3293 closed and parked as issue #3525, branch kept; nothing applied; `d-passing-dry-run-held-for-cobix-s651` stands):** a plain session decides from the issue without COBIx (NEXT (6)). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The display's gaps as structured fields** ([`reference/roep_display_structured_fields_design`](reference/roep_display_structured_fields_design.md), #3296): the paragraph as it stood, `docs/program_requirements_harvest_lessons.md`, *Moved from the lane (S667 checkpoint)*; the structured-fields migration's step 1 is NEXT (6).

**The reader's page checks (#3514, #3587, #3590) and the reread waves.** Rules A to C check the pages a record placing no courses was read from (`CPL_READER_PAGE_CHECKS`, on); rule D is off unless the dispatch input `rule_d` sets it. Since S689 rules A and D read a line with PDF ligatures and the scorer's stand-in glyphs folded (`fold`: the scorer's `_LIGATURES` and `_LIGATURE_SPACED`, imported, never copied; [`methodology-a-pdf-ligature-hides-a-heading-from-an-exact-match`](kb-notes/methodology-a-pdf-ligature-hides-a-heading-from-an-exact-match.md)), and a program a rule refuses stays marked until a committed record places its courses (`refused_filed`; a refusal beside the plain picker's own named heading, `plain_named`, is left out): 263 programs at 35 colleges on `main`. `stage_sources` holds a staged page the rules did not accept, so a refused program is paid for only through a fresh capture and extract, never `sources_from` (**PITFALL** `p-sources-from-repays-refused-pages-s689`). Plan `kb/program_requirements_reread_plan_s683.json`: 444 records at 73 colleges; the third ten posted and loaded in S689 (`m-reread-third-ten-s689`); its per-college ceilings price only the aim rows, and the stop is $40 per college per run (**DECIDED** `d-reads-stop-is-forty-dollars-s685`). Earlier waves and #3547's guard: lessons, *Moved from the lane (S685 checkpoint)*. **Keep-the-better** (#3553, `main` 95f85b1e): a generic CourseLeaf heading passes the own-program test only on the program's own page (`page_is_own`); a live run equal to this run is `posted`; a failing re-read whose live row holds this run goes to a person (the rule as it stood: lessons, *Moved from the lane (S687 checkpoint)*). #3557 (`995d7c41`: a stripped award ending passes only when `slug_awards` names the program's award kind; `award_tail` on the decision row) and #3558 (`741129e5`: with `live_runs`, a run is named whenever a kept or new record is not live at it) are on `main`. **FINDING** `f-reread-drops-files-live-rows-stay-s684` stands.

**NEXT, in order:** (0) The RCCD pilot (#3438, S671; `d-rccd-pilot-no-blind-force-s671`) stands: never force a re-extraction blind, read the failing pages for free first. (1) Read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); revert a timestamp-only bot commit on a PR head so `test` runs (`d-revert-stamp-commit-for-test-s688`). (2) **S689's carry-overs, one follow-up PR after the next wave** (Sam, 2026-11-20, `r-collection-first-sam-2026-11-20`): #3597 (with `main` merged a keep-the-better test fails: #3594's `-ca` answers before the title; accept either evidence) and #3593 (Berkeley City: a second free reconcile, `--calgetc-review` with `--restore`, a self-recall of the next-line reading, then the reread), with the minor findings of #3586 (comment 7035679771), #3590 (7035366834) and #3594 folded in. #3592, #3594, #3596 and #3598 merged. (3) **The reread plan's fourth ten** (rows 46 to 55): Napa Valley, North Orange Continuing Education, Saddleback, Cerro Coso, Mt. San Antonio, Santa Monica, San Diego College of Continuing Education, Bakersfield, Berkeley City (after #3593) and Butte; $40 per college per run, one pending run per concurrency group (`p-read-dispatches-share-group-s687`). (4) **The page checks' lever** (`f-ligature-refusals-s689`): the fold changes rule A only where the filed PDF text prints ligatures or stand-in glyphs, at Cañada, College of the Desert, Santa Rosa Junior and Solano. A free capture at Solano (11 marked) and Cañada (3), then a paid read only where the program's own page is found. Santa Rosa Junior's 12 with no own page and 13898 (a known wrong page) stay as filed; 37014 is held. COBIx's three non-blocking points on #3590 (comment 7035366834) wait for a plain session. (5) **Rule D's prior-year reads** after #3592: City College of San Francisco's 27 not printed; College of the Desert's 8 keep their gap (`f-desert-prior-catalog-behind-robots-s689`). (6) **The display** is done for tonight (above): the next build after the next posts, then the census against 5,069. (7) **Copper Mountain's catalog moved** to `cmccd.curriqunet.com` (`f-copper-mountain-catalog-moved-s689`): its registry row changes by a plan or Sunday's census apply. Cosumnes River's paid read waits on the named-programs-only `only` input. (8) **Cheap piles:** lever 4 (the noncredit hours total, 68; no PR: 19 print no total, 16 one end, 13 short, 12 sum to zero, 5 over, 3 a term ratio); levers 5, 9, 10 and 15 need free page reads first; the six free captures' leftovers (lessons, *S689*); the narrower A5; the `no_units_printed` wording; the six `NOTE_PAIR_ON` records; #3508's finding 4; Sierra's reader of `together`. Los Medanos stays parked (no electives sentence). (9) **Outline readers** (step 11, [`scheduled_sessions`](reference/scheduled_sessions.md)): Mt. San Antonio is loaded (load 44729553938, 1,073 SLO rows); City College of San Francisco's trial files parsed outcomes only (`d-ccsf-outline-trial-no-staff-names-s689`; index 44696736058: 1,417 of 1,469 wanted have an outline); Golden West's 474 header rows (`f-golden-west-474-header-rows-s689`): a guarded update with before-values, and the reader fix; COBIx's three points on #3586 (comment 7035679771); the index search at San Diego College of Continuing Education and Rio Hondo (`search_all` presses Search when no NewSearch request arrives); Peralta (one code holds up to four colleges' records); Saddleback and Irvine Valley (status words other than *Active*); the standing test in `course-outcomes-load.yml`; the staff-names question to a plain session with COBIx (`q-trial-pages-file-staff-names-s689`). (10) Lassen: the structured-fields migration's step 1, Lassen first; 31297, 35106 and 41912 held. (11) #3293, parked as issue #3525: decide in a plain session. (12) #3502's reader changes, cheapest first, with the two changed-page records. (13) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then a PR sets the default on. (14) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (15) The teach-out rule (#3491), after a runner capture. (16) Los Medanos's and Los Angeles Valley's program rules, with a person. (17) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** Los Angeles Harbor 44947 (held, S689); Cerritos 44984 (S687); West Los Angeles 38677; Los Angeles Mission 44849 (no live row); Los Angeles City 32832 (live run 39006380342, `main` files 43212072618); Ventura 45355 and Shasta 18153 (S684). Older lists: lessons, S653, S666, *Moved from the lane (S684 checkpoint)* to *(S689 checkpoint)*.

🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.

## S690 (SkyMerlin, the CPL Queue routine's 11:12Z firing, conductor from 12:13Z, 2026-11-20): City College of San Francisco's outlines, 17,341 printed courses, the fourth ten

**What happened.** The 11:12Z firing found S689 live on #3584 and stood down in one line (11:13Z). At 11:45Z the
account holder answered *"keep going"* in the session, so it waited for S689's sign-off push (handoff 690, about
12:13Z), declared on draft #3599 and took the queue as S690, the same pattern as
`d-firing-waits-for-sign-off-then-takes-queue-s685`. A plain session with Sam ran beside it (the Commons fixes, the
M-ID census, the hunt file, `checkpoint.md`; the split is on #3584, comment 7039601326). A read-only count over the
committed files at 12:22Z (49,558 live cards, singletons included) ranked lane 1 by the M-ID cards each fix would
unblock (`d-mid-ranking-orders-lane-1-s690`): City College of San Francisco's outlines first (2,065 cards improved,
1,020 completed, 1,401 given their first text), the one outline fill runnable that night; the next six (American
River, Southwestern, Glendale, Santa Barbara City, Fullerton, College of the Canyons) have no public outline system
or are blocked, and no committed pipeline fills a missing course description. The plain session's census counts on
another base (15,720 cards); the Commons uses its figures. Workers: `ccsf`, `reread` and `pages`, then `piles` (the
follow-up PR) and `catalogs` (Sam's go of 6:26 AM PT), then `display`. Merged, each on a green `test` after its
thread was read: #3600 `9fc88a07` (13:01Z) and #3601 `46f92c76` (13:48Z); S689 merged its #3584 (`bcc3f8a8`) at about
13:49Z. The wave PR #3604 (`claude/s690-wave`) was open at the checkpoint.

**The numbers.**
- **Program records: 35 new, 129 replaced by a better reread, 6 restored, 3 held for a person**
  (`m-reread-and-pages-posts-s690`). The pages levers ($7.68): Laney 6 new and 26 replaced (extract 44744386009,
  $2.50; reread 44749644504; load 44749904888); Diablo Valley 1 and 27, 18885 restored (44745889555, $2.62;
  44749651187; 44749910559); Orange Coast 4 inserted and 16 replaced (44747523200, $2.56; 44749656796; 44749916015).
  Victor Valley 0 of 26, Mt. San Jacinto 0 of 24 and Southwestern 0 of 24 own pages, so no paid read. Live reads
  44747782378, 44748800216, 44749036108. The reread plan's rows 46 to 55 but Berkeley City ($7.89): Napa Valley 6 and
  24, 3 restored, 3 held (19126, 31158, 36528 in `napa_valley/held_for_person/`; 44739981651, $2.66; 44745380855;
  44745678890); Cerro Coso 4 and 6 (44737711062, $0.82; 44745386733; 44745684280); Santa Monica 5 and 0 (44739378155,
  $0.47; load 44745875952); San Diego College of Continuing Education 8 and 5 (44739577102, $0.69; 44745499130;
  44745881355); Mt. San Antonio 1 and 25, 08086 and 31650 restored because a person had checked their live rows
  (44744647809, $3.25; 44759483220; 44759691077). Saddleback and Bakersfield had nothing to pay. Live reads
  44744830810, 44759070274.
- **Outline rows: 1,416** (`m-ccsf-outlines-loaded-s690`). City College of San Francisco's read 44748015052: 1,417
  pages in two parts, 2,904 and 2,900 SLOs, every page 200, none cut; standing test 26 of 26; load 44767903173, ids
  41769 to 43184, receipt `kb/receipts/course_outcomes_ccsf_44767903173.json`, no objectives (report 28 prints none);
  live count 1,416 confirmed by the conductor.
- **Printed catalog courses: 17,341 at 16 colleges** (`m-printed-catalog-courses-s690`; Sam's go,
  `r-plain-page-read-blocked-catalogs-sam-2026-11-20`), read on the runner by the census Reader for $0:
  `kb/hand_filed_catalogs/courses/<slug>.json.gz` (gzip -9n, 3.9 MB from 29.6 MB, `d-course-rows-gzipped-s690`) with
  `index.json` and a README. North Orange Continuing Education 1,089 (48 subjects, HLTH 167 and PARN 170 among them;
  runs 44756513382, 44757980757), Southwestern 1,692 (44759854547), Cerritos 1,656 (44767159068), Long Beach City
  1,595 (44765123063), Monterey Peninsula 1,137 (44765198579), Clovis 473, Los Angeles City 1,123 and Los Angeles
  Valley 939 (44759950664), East Los Angeles 1,676, Los Angeles Harbor 765 and Los Angeles Southwest 724
  (44762233563), Los Angeles Mission 798, Pierce 414 and Los Angeles Trade-Technical 1,099 (44763620806), West Los
  Angeles 719 (44764775167 and 44763620806), El Camino 1,442 (Sam's copy, 44762315427; its two addenda not read). The
  other four of Sam's copies print two columns, so those colleges were read from their own PDFs. North Orange's
  program capture (44758918611) found nothing to pay. The Reader's plan now caps `capture_lines`, `pdf_page_cap` and
  `pdf_unfolded`, with a test; draft #3603 closed into #3604.

**Stopped or carried over.**
- **City College of San Francisco's rule D prior-year read** of its 27 not printed (`f-ccsf-prior-catalog-refused-s690`):
  `www.ccsf.edu` serves a Cloudflare 403, and the guessed 2025-26 PDF answers 404 (free preview 44738618128). Asked of
  COBIx on #3358 (comment 7040201320); trigger branch `claude/s690-ccsf-prior` left.
- **Golden West's 474 header rows** (`f-golden-west-474-header-rows-s689`): the reader fix and the plan sit on
  `claude/s690-goldenwest-header` (ae5be1d5, no PR). The second reader's verdict after two rounds was do not apply
  (`d-golden-west-stops-after-two-rounds-s690`): (1) the write returns one 263 KB value and the rollback depends on it
  alone; the fix returns each id with an after-fingerprint, joined to the paged before-values. (2) If the corrected
  filed reads merge before the write, a `golden_west` load inserts 486 rows, 476 of them beside a live header; so the
  write goes before the merge, and its rollback reverts the read correction. The count is 476
  (`f-golden-west-476-header-rows-s690`): THEA G210 *Course Outcome* and MUS G111 *Couse Outcomes* are headers too.
  The same shape sits at Coastline (ANTH G190, id 7204), and four Golden West rows open with *Course Objectives* (ELL
  G015N, ART G145, AUTO G004N, ELL G025N). For COBIx and the next session.
- **Batch 2 of the reread plan** (rows 56 to 73) extracted on read branches only, not posted: Cuyamaca ($2.30),
  Moreno Valley, Norco and Fullerton; College of the Canyons' and San Jose City's extracts and San Diego City's and
  San Diego Mesa's previews were running at hand-back. The gate failed at Merced (40072 lost its page), Reedley and
  Sacramento City (8 programs outside the aim list on new pages); nothing was aimed at Chaffey, Mission, Cypress or
  San Joaquin Delta. Solano and Cañada were untouched; Los Angeles Trade-Technical, Los Angeles Southwest and West Los
  Angeles went to the catalogs read.
- **The follow-up PR** (`claude/s690-follow-up`): #3593 and #3597 closed with pointers for the three-PR cap (comments
  7039647197 and 7039648134; `d-carryovers-closed-for-cap-s690`) and fold into it with the minor findings of #3586
  (COBIx, 7035679771), #3590 (7035366834), #3594 and #3601 (the gate checks no host; the fingerprint misses `_ws`,
  `READER_HTML_CAP` and `SLO_HEADING`), the spend file's top-level `updated`, Berkeley City's reconcile and review and
  Glendale's wording measure (no writes). In progress at the checkpoint.

**Lessons.**
- **A recall gate whose hand counts equal the parser's own count checks nothing**
  (`p-recall-gate-counts-parser-output-s690`). #3601's first round was BLOCKING: the gate's hand counts equalled
  `len(parser outcomes)`, and it opened on an empty or 403 trial, since nothing equals nothing. Round two took the
  counts by eye from the trial's job-log SLO excerpt (trial 44744884314, job 136319047157, 12 of 12), bound them to the
  parser's fingerprint (`d5cef493`), and refuses a non-200 page, a page cut at the Reader's cap, an unsourced count and a
  fingerprint mismatch. The note: [`methodology-a-test-must-not-take-its-rule-as-the-truth`](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md), *A recall gate on outline pages*.
- **The runner and the session get different answers from one WAF host** (`f-waf-answers-runner-and-session-apart-s690`).
  The runner got HTTP 200 at `catalog.nocccd.edu` and the four CourseLeaf hosts; the sandbox and the plain session's
  cloud browser got 202 with an AWS WAF check. The committed captures already showed the reader at 200 there (North
  Orange run 43342034608, Southwestern 44529722751; the plain session on #3584, comment 7042730508), and COBIx
  confirmed the route (comment 7042639554). The note:
  [`methodology-a-bot-wall-answers-each-network-on-its-own`](kb-notes/methodology-a-bot-wall-answers-each-network-on-its-own.md).
- **The Library's first check run turned `main` red** (#3600, `d-main-red-check-line-stays-out-s690`). Run 44733588776
  stamped every page's accessibility line, the starter page's included (653864b7): ELL IET's reading text went from
  33,996 to 34,078 characters, past Sierra's `LIBRARY_TEXT_MAX` of 34,000 (`sierra_library` (5) and
  `library_revise_draft` E1 failed), and `buildNewPage` copied the starter's line into new pieces
  (`library_qualify_draft` (1), twice). The reading text now skips the `cpl-library-check` block, and new pieces drop it.
- **A page address that changes case and slashes reads as a new page** (`f-butte-page-addresses-changed-case-s690`).
  Butte's every address moved (`Catalog//iq` to `catalog/iq`), so `unchanged()` would have sent 163 unchanged programs
  to a paid read, about $18, for one aim program. Compare normalized addresses in `unchanged()` and `held()`.
- **Same-page calls at the reread gate** (`d-reread-gate-same-page-calls-s690`): a page one PDF page off, an address
  that differs only by a double slash, and a new edition of the same catalog (College of the Canyons' v2 to v3) count
  as the same page when each moved page's coverage is equal or higher.
- **Two findings for the next Orange Coast and Diablo Valley work.** Orange Coast's 109 live rows hold run 38670927724
  where `main` files 39726645292 (`f-orange-coast-live-rows-older-run-s690`). Shared pathway pages claim 34 programs at
  Orange Coast and Diablo Valley (`o-shared-pages-claim-34-programs-s690`): a possible reader lever, unmeasured.
- **North Orange stays on the outline hunt** (`d-noce-stays-on-outline-hunt-s690`): its catalog reads, but its SLOs sit
  behind CurricUNET; the worker's hunt record was not filed, since the hunt file is the plain session's.

## Moved from the lane (S691 checkpoint, 2026-11-21)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S691 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

🔨 **Sam's rulings of 2026-11-17 (#3461, final; [`sam_rulings`](reference/sam_rulings.md)), carried out in #3478 and applied by run 44224714543 (S679; 243 records; rollback committed, NOT applied: `kb/migrations/2026-11-18_s679_prreq_rescore_rollback.sql`).** The general education open slot stays OFF behind `GE_AREA_SLOT_FILL` until its self-recall run (NEXT (11)). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**Display build `4c57fd250cce` is live, confirmed by its closing count** (S689, #3598; 18,459 programs; `m-display-build-live-s689`; its four runs: lessons, *Moved from the lane (S690 checkpoint)*). The confirming read pages by key, never by offset (**DECIDED** `d-display-keyset-confirm-s687`). The gap census of 2026-11-20 (run 44719996895): 5,069 left of 20,282, passing 15,120 (`m-census-5069-s689`); S690's build and census: NEXT (1).

**The reader's page checks (#3514, #3587, #3590) and the reread waves.** Rules A to C check the pages a record placing no courses was read from (`CPL_READER_PAGE_CHECKS`, on); rule D runs only when the dispatch input `rule_d` sets it. Rules A and D fold PDF ligatures and the scorer's stand-in glyphs before they match (`fold`); a refused program stays marked until a committed record places its courses (`refused_filed`) and is paid for only through a fresh capture and extract (**PITFALL** `p-sources-from-repays-refused-pages-s689`). Plan `kb/program_requirements_reread_plan_s683.json`: 444 records at 73 colleges; the stop is $40 per college per run (**DECIDED** `d-reads-stop-is-forty-dollars-s685`). Keep-the-better (#3553, #3557, #3558) and **FINDING** `f-reread-drops-files-live-rows-stay-s684` stand. **DECIDED** `d-reread-gate-same-page-calls-s690`: a page one PDF page off, an address that differs only by a double slash, and a new edition of the same catalog (College of the Canyons' v2 to v3) count as the same page when each moved page's coverage is equal or higher. The paragraph as it stood: lessons, *Moved from the lane (S690 checkpoint)*.

**S690's posts** (`m-reread-and-pages-posts-s690`): the reread plan's rows 46 to 55 (Napa Valley, Cerro Coso, Santa Monica, San Diego College of Continuing Education, Mt. San Antonio) and the pages levers (Laney, Diablo Valley, Orange Coast): 35 new records, 129 replaced by a better reread, 6 restored and 3 held for a person, for $7.89 and $7.68 of extraction. Saddleback and Bakersfield had nothing to pay; Victor Valley, Mt. San Jacinto and Southwestern found no own page. Run ids: lessons, *S690*.

**Rule D (S687, #3569 `3cbf7012`; S688, #3579 `ef16178c`; `d-rule-d-from-committed-previews-s687`, `f-rule-d-cannot-reach-dropped-records-s687`):** `kb/status/program_discontinued.json` holds 9 flagged and 35 not printed (City College of San Francisco 27, from S689's free rule D capture 44699726074; College of the Desert 8); a not-printed program is a candidate for a prior-year read, never a flag. #3592 opens the prior-year read (`CAPTURE_PRIOR`) on a PDF catalog. The paragraph as it stood: lessons, *Moved from the lane (S689 checkpoint)*.

**NEXT, in order** (Sam's work order of Nov 20 ranks collection by the M-ID cards each fix unblocks, `r-collect-for-mids-work-order-sam-2026-11-20`: outline fills first, program records second, **DECIDED** `d-mid-ranking-orders-lane-1-s690`): (0) Standing: never force a re-extraction blind (`d-rccd-pilot-no-blind-force-s671`); read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); revert a timestamp-only bot commit on a PR head so `test` runs (`d-revert-stamp-commit-for-test-s688`). (1) **Land S690's open work:** the wave PR #3604 (`claude/s690-wave`), the display build and its page-file PR, then `harvest-gap-census.yml` on `main` against 5,069, and the follow-up PR (7). (2) **The printed-course files** (`r-plain-page-read-blocked-catalogs-sam-2026-11-20`, `m-printed-catalog-courses-s690`): 17,341 printed courses at 16 colleges in `kb/hand_filed_catalogs/courses/<slug>.json.gz` with `index.json` (gzip -9n, **DECIDED** `d-course-rows-gzipped-s690`), read on the runner by the census Reader for $0. No committed pipeline yet fills an M-ID card's missing course description from them; the plain session's *no longer offered* catalog factor joins on them (#3584, comment 7042398748). PDF rows are best-effort, each file naming an upper bound of missed courses; El Camino's two 2026 addenda are not read. **Sky can read 2026-27 HTML:** North Orange Continuing Education, Southwestern, Cerritos, Long Beach City, Monterey Peninsula. **Sky can read 2026-27 catalog PDF:** East Los Angeles, Los Angeles City, Los Angeles Harbor, Los Angeles Mission, Los Angeles Southwest, Los Angeles Trade-Technical, Los Angeles Valley, Pierce, West Los Angeles, Clovis. Los Angeles Valley's program park stands; the hunt file is the plain session's. **FINDING** `f-waf-answers-runner-and-session-apart-s690` ([`methodology-a-bot-wall-answers-each-network-on-its-own`](kb-notes/methodology-a-bot-wall-answers-each-network-on-its-own.md)). North Orange's program capture (44758918611) found nothing to pay; its outlines sit behind CurricUNET, so it stays on the outline hunt (**DECIDED** `d-noce-stays-on-outline-hunt-s690`). (3) **Outline readers** (step 11, [`scheduled_sessions`](reference/scheduled_sessions.md)): City College of San Francisco is loaded, outcomes only (`m-ccsf-outlines-loaded-s690`; 1,416 SLO rows, load 44767903173). **Golden West's header rows stopped after two review rounds** (**DECIDED** `d-golden-west-stops-after-two-rounds-s690`; reader fix and plan on `claude/s690-goldenwest-header` ae5be1d5, no PR): the rollback depends on one 263 KB write result, and filed reads corrected before the write would make the next load insert 486 rows, 476 beside a live header, so the write goes first (in full: lessons, *S690*). The rows number 476 (`f-golden-west-476-header-rows-s690`); Coastline ANTH G190 has the same shape. For COBIx and the next session. Then the index search at San Diego College of Continuing Education and Rio Hondo; Peralta (one code holds up to four colleges' records); Saddleback and Irvine Valley (status words other than *Active*); the standing test in `course-outcomes-load.yml`; the staff-names question (`q-trial-pages-file-staff-names-s689`). The next six by the M-ID count (American River, Southwestern, Glendale, Santa Barbara City, Fullerton, College of the Canyons) have no public outline system or are blocked. (4) **The reread plan's rows 56 to 73**, extracted on read branches and NOT posted: Cuyamaca ($2.30), Moreno Valley, Norco, Fullerton; College of the Canyons' and San Jose City's extracts and San Diego City's and San Diego Mesa's previews were running at hand-back. Each goes through keep-the-better, a post and a load. The gate failed at Merced (40072 lost its page), Reedley and Sacramento City (8 programs outside the aim list on new pages); nothing was aimed at Chaffey, Mission, Cypress or San Joaquin Delta. (5) **Butte is held** (`f-butte-page-addresses-changed-case-s690`): every page address changed case and slashes (`Catalog//iq` to `catalog/iq`), so 163 unchanged programs would pay about $18 for one aim program; compare normalized addresses in `unchanged()` and `held()` first. (6) **Solano (11 marked) and Cañada (3):** a free capture where the ligature fold changes what rule A reads (`f-ligature-refusals-s689`), then a paid read only where the own page is found. Santa Rosa Junior's 12 with no own page and 13898 stay as filed; 37014 is held. (7) **The night's one follow-up PR** (`claude/s690-follow-up`), in progress at the checkpoint: #3593 and #3597, closed with pointers for the three-PR cap (**DECIDED** `d-carryovers-closed-for-cap-s690`), fold in, with the minor findings of #3586, #3590, #3594 and #3601, the spend file's top-level `updated`, Berkeley City's reconcile and review, and Glendale's wording measure (no writes); the list in full: lessons, *S690*. (8) **City College of San Francisco's rule D prior-year read** (27 not printed): `www.ccsf.edu` serves a Cloudflare 403 and the guessed 2025-26 PDF answers 404 (`f-ccsf-prior-catalog-refused-s690`); asked of COBIx on #3358 (comment 7040201320). College of the Desert's 8 keep their gap (`f-desert-prior-catalog-behind-robots-s689`). (9) **The pages levers' leftovers:** Victor Valley's sister pages; Diablo Valley's 15 claimed by another page and 9 with none; Laney's cinematography, music and AR/VR print no page; Mt. San Jacinto's 12 noncredit sit outside the credit catalog; Orange Coast's 19 claimed by shared pathway pages; Southwestern's transfer degree and its *2.0* successor share a page. Shared pages claim 34 programs at Orange Coast and Diablo Valley (`o-shared-pages-claim-34-programs-s690`), unmeasured: measure it free first. Orange Coast's 109 live rows hold run 38670927724 where `main` files 39726645292 (`f-orange-coast-live-rows-older-run-s690`): settle which stands before its next load. (10) Copper Mountain's catalog moved to `cmccd.curriqunet.com` (`f-copper-mountain-catalog-moved-s689`); Cosumnes River's paid read waits on the named-programs-only `only` input. (11) **Cheap piles:** lever 4 (the noncredit hours total, 68; 19 print no total, 16 one end, 13 short, 12 sum to zero, 5 over, 3 a term ratio); levers 5, 9, 10 and 15 need free page reads first; S689's free captures' leftovers (lessons, *S689*); the narrower A5; the `no_units_printed` wording; the six `NOTE_PAIR_ON` records; #3508's finding 4; Sierra's reader of `together`. Los Medanos stays parked. (12) Lassen: the structured-fields migration's step 1 ([`reference/roep_display_structured_fields_design`](reference/roep_display_structured_fields_design.md), #3296); 31297, 35106 and 41912 held. (13) #3293, parked as issue #3525 (`d-passing-dry-run-held-for-cobix-s651`): a plain session decides from the issue. (14) #3502's reader changes, cheapest first. (15) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then the default on. (16) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (17) The teach-out rule (#3491), after a runner capture. (18) Los Medanos's and Los Angeles Valley's program rules, with a person. (19) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** Napa Valley 19126, 31158 and 36528 (`napa_valley/held_for_person/`, S690); Los Angeles Harbor 44947; Cerritos 44984; West Los Angeles 38677; Los Angeles Mission 44849 (no live row); Los Angeles City 32832 (live run 39006380342, `main` files 43212072618); Ventura 45355 and Shasta 18153. Older lists: lessons, S653, S666, *Moved from the lane (S684 checkpoint)* to *(S690 checkpoint)*.

## S691 (SkyPetrel, the CPL Queue routine's collection night of 2026-11-21, first command 07:13Z): rows 56 to 73 posted, College of the Canyons' noncredit codes, display e35ae1722a56

**What happened.** No session was live at the start (open PRs #3602 and dependabot's #3383; `main` at 08506fa4, S695's
checkpoint), so the firing declared on draft #3632 at 07:20Z with the college split. S694, a plain session, also signed
as SkyPetrel, so this run always carries its number. Two lanes, never on one college: lane 1 `reread`, `pages` and
`outlines`; lane 2 `piles`. Split changes: `piles` did #3602's update, then ran out of context in its second task, and
`piles2` and `piles3` finished lane 2 (`p-one-concern-per-worker-context-s691`); `reread` handed College of the Canyons
and the wave branch to `canyons`; `outlines` handed its full reads to `outlines2` (Saddleback, then Rio Hondo; running
at the checkpoint); `display` ran the build after the wave merged. Four checkouts ran at once on measured disk
(`d-four-checkouts-on-measured-disk-s691`). Merged, each on a green `test` after its thread was read: #3602 `4bb2276c`
(08:12Z, S690's follow-up), the wave #3634 `f46f65e7`, the follow-up #3633 `b6d52c8e` (10:04Z) and the display page
file #3635 `ca45115f`.

**The numbers.**
- **Program records: 109 new, 201 replaced by a better reread, 24 re-posted, 5 restored, 2 held for a person, for
  $17.70 of extraction** (`m-wave-posts-s691`).
  - The reread plan's rows 56 to 73: Cuyamaca 20 replaced, Moreno Valley 1, Norco 2, Fullerton 3 new, San Jose City 2
    new and 2 replaced, College of the Canyons 7 new and 45 replaced (paid in S690, $9.71; $0 tonight). San Diego City
    and San Diego Mesa had nothing to extract.
  - College of the Canyons' noncredit codes (census lever 3): `kb/_program_requirements_pilot.py` reads a dot inside a
    subject code (NC.BUS 204; 436 patterns, all dotted). Free capture 44881873546; pricing 44886119075 ($21.90
    estimate for 196, of which 103 were old Catalog-v2 records relisted); extract 44886816990 ($12.88 actual); reread
    44887662697; load 44887749460: 91 new, 100 replaced, 2 restored (10298, 43782), 1 held (43388), 1 skipped (45284).
  - College of the Canyons' prefix aliases (lever 8: PSYC to PSYCH, POLS to POLISC, COMM to COMS, from college page
    read 44882193771): reconcile 44887850515, reread 44888246145, 24 re-posted; machine-passing live rows 179 to 194
    of 246.
  - San Joaquin Delta: 1 new (45583) and 18 replaced, $2.18 (extract 44883860902, reread 44885120398, load
    44885390605). Solano: 5 new and 2 replaced, $0.87 (44884569184, 44885303079, 44885504738).
  - Santa Monica (#3633): pins for eleven programs. A timed-out read (44883500729) filed and dropped 46 records and was
    reverted (6ba61a4c); the second read 44885033145 ($1.72) and reread 44885796690 replaced 11, 7 of which now pass
    the machine checks; 21026 restored; 45012 not loaded.
  - Free captures found no own page at Ohlone, Santa Barbara City, Mt. San Antonio and Fresno City; Cañada's two would
    be blind re-extractions; nothing was paid there. West Los Angeles 46261 held ($0.05).
- **Display build `e35ae1722a56`** (#3635, `m-display-build-live-s691`), replacing `ac082e9d96dc`: College of the
  Canyons first 44890523187 (246 of 246), the gate 44890803467, the whole build 44890972799 (18,363 written, 0
  errors), the closing count 44891433372 (18,609 rows at the new build). 32 rows stay at older builds, the same 32 as
  S690. Santa Monica's eleven wait for the next build.
- **The census** 44892712171 (10:10Z, `main` c1700e76; `m-census-4875-s691`): 4,875 left of 20,282, passing 15,314,
  from 4,982 and 15,207.
- **Outline rows:** PENDING (`outlines2` was running at the checkpoint).

**Stopped or carried over.**
- City College of San Francisco's `not_printed_current_or_prior` rule was dropped after its second read: the 2025-26
  extract read 7 of the 27 (`prior.only`), so the other 20 were never put to it (`d-ccsf-20-not-named-s691`).
- City College of San Francisco's Cal-GETC step for 32080, 33652 and 46300: the permission check refused piles2's
  `--calgetc-apply` dry run twice. It was not routed around and waits for a plain session.
- Golden West's before-values file is filed (476 rows, checksum cb441aa1, live read 44881579974; the plan on
  `claude/s690-goldenwest-header` 0995d8b5; `d-golden-west-before-values-filed-s691`). The guarded correction waits on
  a plain session's review.
- The `total_not_printed` gap (Santa Monica 45811 to 45815, 37885; self-recall 1,821 right, 0 wrong) is built in #3633
  and not applied.

**Lessons.**
- **Python 3.12's `sum()` rounds floats differently from 3.11's** (`f-py312-sum-rounds-differently-s691`,
  `d-generated-files-built-with-runner-python-s691`). #3602's `kb/status/commons_data.json`, built on the sandbox's
  3.11, failed CI's 3.12 check on one mean (0.6544 against 0.6543): 3.12 compensates `sum()` over floats. Rebuilt
  under 3.12, it passed; #3633 moved the builder's float sums to `math.fsum`, exact on both. The note:
  [`methodology-a-generated-file-is-built-with-the-runners-python`](kb-notes/methodology-a-generated-file-is-built-with-the-runners-python.md).
- **`would_extract` relists a page the reread gate calls the same** (`f-would-extract-relists-same-page-s691`):
  `filed_from` compares `source_url` literally, so College of the Canyons' 103 Catalog-v2 records were priced as new
  pages, against `d-reread-gate-same-page-calls-s690`. The free pricing run caught the doubled estimate before any
  money moved. The college workflow has no `only` input, so the conductor paid the estimate rather than build tooling
  in a collection run (`d-canyons-nc-read-pays-v2-rereads-s691`), and keep-the-better kept the better record of each.
- **A timed-out read still files** (`f-timed-out-read-still-files-s691`): Santa Monica's 44883500729 timed out, and
  its filing dropped 46 records from the branch; it was reverted before the second read.
- **`main` went red after the census** (run 44893759916 at ca45115f, the `lints` job): #3602 made the census's full build set the spend file's `updated` to the day it writes, but `tests/spend_daily_build_test.py` still pinned it to 2026-11-15, so the first census after it (c1700e76, 10:11Z) failed every head that carries it. The checkpoint branch pins the day's shape and floor instead, as its own commit ([`methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`](kb-notes/methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md)).
- **A PR whose files are disjoint from the last merge's merges on clean** (`d-merge-on-clean-when-files-disjoint-s691`):
  #3635 merged without a second update from `main`, since #3633 touched no file it holds.
- **For the next outline and record work:** `f-sjdelta-apprenticeship-coarse-net-s691` (14594 to 14599 and 37611 at
  coverage 1.0, refused by the coarse net; unmeasured); `f-hond-045-fold-s691` (Rio Hondo's HOND 045 and HOND 045-1
  fold into one code; `outlines2` fixes it); `f-ccsf-outline-gate-stale-on-main-s691` (8c95dee8 on `main` against the
  trial's d5cef493); `f-outline-ranking-s691` (cards improved: Saddleback 1,120, Rio Hondo 871, Irvine Valley 735, San
  Diego College of Continuing Education 191, Golden West 50); `f-still-taught-hand-ins-no-outline-text-s691`.
- **The cheap piles, measured (lane 2):** Santa Monica's 12 lists past their figure (238 statewide) and 16 mixed;
  Glendale's 33 (11 with no record file, 18 unequal); Clovis 42234 needs a p.121 pin and 33431 is a named-gap
  candidate; Lake Tahoe's 13 sit on quarter units with no ruling; the noncredit hours lever's shapes (19 no total, 7
  sum to zero, 2 a single figure against a range, 40 other); 9 College of the Canyons noncredit programs find no page
  (Diné's É).
- **Pitfalls:** `p-clock-guard-guessed-time-s691` (08:20Z written at 08:17Z, refused by the guard);
  `p-shared-git-shallow-lock-s691` (worktrees share `.git`: confirm a merge with `git ls-remote`, never delete the
  lock); `p-actions-log-host-blocked-s691` (read a job's tail with `get_job_logs`);
  `p-one-concern-per-worker-context-s691` (`piles` ran out of context in its second task).
- **What worked:** a free pricing run before paying; second readers caught three real defects; `pr-gate` kept CI reads
  small; the declaration PR was refreshed within each half hour.

## Moved from the lane (S697 checkpoint, 2026-11-21)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S697 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

**S691's posts** (`m-wave-posts-s691`; #3634 `f46f65e7`, #3633 `b6d52c8e`): the reread plan's rows 56 to 73, College of the Canyons' noncredit codes (lever 3) and prefix aliases (lever 8), San Joaquin Delta, Solano and Santa Monica's pinned pages: 109 new records, 201 replaced by a better reread, 24 re-posted, 5 restored, 2 held for a person; $17.70 of extraction. Run ids: lessons, *S691*.

**Decisions of S691** (the conductor's, each reversible; rows in `cpl_memory`): **DECIDED** `d-four-checkouts-on-measured-disk-s691`, `d-canyons-nc-read-pays-v2-rereads-s691` (no `only` input, so the $21.90 estimate was paid, $12.88 actual), `d-ccsf-20-not-named-s691`, `d-generated-files-built-with-runner-python-s691`, `d-merge-on-clean-when-files-disjoint-s691` and `d-golden-west-before-values-filed-s691`.

**NEXT, in order** (Sam's work order of Nov 20 ranks collection by the M-ID cards each fix unblocks, `r-collect-for-mids-work-order-sam-2026-11-20`: outline fills first, program records second, **DECIDED** `d-mid-ranking-orders-lane-1-s690`): (0) Standing: never force a re-extraction blind (`d-rccd-pilot-no-blind-force-s671`); read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); revert a timestamp-only bot commit on a PR head so `test` runs (`d-revert-stamp-commit-for-test-s688`); build a generated file with the runner's Python, 3.12 ([`methodology-a-generated-file-is-built-with-the-runners-python`](kb-notes/methodology-a-generated-file-is-built-with-the-runners-python.md)). (1) **Outline readers** (step 11, [`scheduled_sessions`](reference/scheduled_sessions.md)), ranked by the M-ID cards each improves (`f-outline-ranking-s691`: Saddleback 1,120, Rio Hondo 871, Irvine Valley 735, San Diego College of Continuing Education 191, Golden West 50). S691's `outlines2` read Saddleback, then Rio Hondo, and was running at the checkpoint: land its PR and loads. Rio Hondo's HOND 045 and HOND 045-1 fold into one code (`f-hond-045-fold-s691`; that PR fixes it). City College of San Francisco's recall gate on `main` names fingerprint 8c95dee8 where its trial read d5cef493 (`f-ccsf-outline-gate-stale-on-main-s691`): refresh it before the college's next read. Then Irvine Valley's status words, San Diego College of Continuing Education's index search, Peralta (one code holds up to four colleges' records), the standing test in `course-outcomes-load.yml` and the staff-names question (`q-trial-pages-file-staff-names-s689`). The 12 still-taught courses' hand-ins carry no outline text (`f-still-taught-hand-ins-no-outline-text-s691`). **Golden West's 476 header rows** (`f-golden-west-476-header-rows-s690`; Coastline ANTH G190 has the same shape): the before-values file is filed (checksum cb441aa1, live read 44881579974; plan on `claude/s690-goldenwest-header` 0995d8b5; **DECIDED** `d-golden-west-before-values-filed-s691`), and the guarded correction waits on a plain session's review. (2) **Two reader fixes before the next paid college read:** a timed-out read still files (`f-timed-out-read-still-files-s691`: Santa Monica's 44883500729 filed and dropped 46 records, reverted in 6ba61a4c), so filing should refuse a timed-out run; and `would_extract` relists a page the reread gate calls the same (`f-would-extract-relists-same-page-s691`: `filed_from` compares `source_url` literally, so 103 of College of the Canyons' Catalog-v2 records were priced again), so it should honor `d-reread-gate-same-page-calls-s690`. (3) **City College of San Francisco:** the rule `not_printed_current_or_prior` was dropped after its second read: the 2025-26 extract read 7 of the 27 (`prior.only`), so the other 20 stay unnamed until another source prints them (**DECIDED** `d-ccsf-20-not-named-s691`). Its Cal-GETC step for 32080, 33652 and 46300 (lever 2): the permission check refused the `--calgetc-apply` dry run twice; it was not routed around and is a plain session's. College of the Desert's 8 keep their gap (`f-desert-prior-catalog-behind-robots-s689`). (4) **Program records' open levers:** San Joaquin Delta's apprenticeship programs 14594 to 14599 and 37611 read at coverage 1.0 and the coarse net refuses them (`f-sjdelta-apprenticeship-coarse-net-s691`), unmeasured: measure it free first. College of the Canyons: 9 noncredit programs find no page (Diné's É); 43388 held, 45284 skipped; 194 of 246 live rows pass. Free captures found no own page at Ohlone, Santa Barbara City, Mt. San Antonio and Fresno City; Cañada's two would be blind re-extractions. Merced, Reedley and Sacramento City failed the reread gate; Butte is held (`f-butte-page-addresses-changed-case-s690`: normalize addresses in `unchanged()` and `held()` first). S690's pages leftovers at six colleges (`o-shared-pages-claim-34-programs-s690`, `f-orange-coast-live-rows-older-run-s690`): lessons, *Moved from the lane (S691 checkpoint)*. Copper Mountain's catalog moved to `cmccd.curriqunet.com` (`f-copper-mountain-catalog-moved-s689`); Cosumnes River's paid read waits on a named-programs-only `only` input. (5) **Cheap piles** (free rule work): the `total_not_printed` gap (#3633; Santa Monica 45811 to 45815 and 37885; self-recall 1,821 right, 0 wrong) is built, not applied. Lever 2 (the general education pattern's units, 192): free reads filed at five colleges (`kb/college_reads/*_ge_units_s691.json`). The noncredit hours total (68 at the night's start; 100 in the 10:10Z census, the 32 more all College of the Canyons' new noncredit records): of the 68, 19 print no total, 7 sum to zero, 2 print one figure against a range, 40 other. Santa Monica's eleven pinned programs wait for the next display build; 12 lists run past their printed figure (238 statewide) and 16 are mixed. Glendale's 33: 11 have no record file, 18 read unequal. Clovis 42234 needs a p.121 pin, and 33431 is a named-gap candidate. Lake Tahoe's 13 sit on quarter units with no ruling. Santa Rosa Junior's 12 with no own page and 13898 stay as filed; 37014 is held. S689's older pile items: lessons, *Moved from the lane (S691 checkpoint)*. Los Medanos stays parked. (6) **The printed-course files** (`r-plain-page-read-blocked-catalogs-sam-2026-11-20`, `m-printed-catalog-courses-s690`): 17,341 printed courses at 16 colleges in `kb/hand_filed_catalogs/courses/<slug>.json.gz` with `index.json` (gzip -9n, **DECIDED** `d-course-rows-gzipped-s690`), read on the runner by the census Reader for $0. No committed pipeline yet fills an M-ID card's missing course description from them; the plain session's *no longer offered* catalog factor joins on them (#3584, comment 7042398748). PDF rows are best-effort, each file naming an upper bound of missed courses; El Camino's two 2026 addenda are not read. **Sky can read 2026-27 HTML:** North Orange Continuing Education, Southwestern, Cerritos, Long Beach City, Monterey Peninsula. **Sky can read 2026-27 catalog PDF:** East Los Angeles, Los Angeles City, Los Angeles Harbor, Los Angeles Mission, Los Angeles Southwest, Los Angeles Trade-Technical, Los Angeles Valley, Pierce, West Los Angeles, Clovis. Los Angeles Valley's program park stands; the hunt file is the plain session's. **FINDING** `f-waf-answers-runner-and-session-apart-s690` ([`methodology-a-bot-wall-answers-each-network-on-its-own`](kb-notes/methodology-a-bot-wall-answers-each-network-on-its-own.md)). North Orange's program capture (44758918611) found nothing to pay; its outlines sit behind CurricUNET, so it stays on the outline hunt (**DECIDED** `d-noce-stays-on-outline-hunt-s690`). (7) **The display and the census:** the next build after the next posts, Santa Monica's eleven among them, then `harvest-gap-census.yml` on `main` against 4,875. (8) Lassen: the structured-fields migration's step 1 ([`reference/roep_display_structured_fields_design`](reference/roep_display_structured_fields_design.md), #3296); 31297, 35106 and 41912 held. (9) #3293, parked as issue #3525 (`d-passing-dry-run-held-for-cobix-s651`): a plain session decides from the issue. (10) #3502's reader changes, cheapest first. (11) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then the default on. (12) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (13) The teach-out rule (#3491), after a runner capture. (14) Los Medanos's and Los Angeles Valley's program rules, with a person. (15) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** College of the Canyons 43388 and West Los Angeles 46261 (S691); Napa Valley 19126, 31158 and 36528 (`napa_valley/held_for_person/`, S690); Los Angeles Harbor 44947; Cerritos 44984; West Los Angeles 38677; Los Angeles Mission 44849 (no live row); Los Angeles City 32832 (live run 39006380342, `main` files 43212072618); Ventura 45355 and Shasta 18153. Older lists: lessons, S653, S666, *Moved from the lane (S684 checkpoint)* to *(S691 checkpoint)*.

## S697 (SkyPuffin, the CPL Queue routine's 13:12Z firing of 2026-11-21, first command 13:13Z): Irvine Valley's outlines, Cosumnes River's named read, two named gaps

**What happened.** No session was live at the start (open PRs: dependabot's #3383 only; `main` at 9ee488a7, S691's
checkpoint #3632), so the firing declared on draft #3639 at 13:17Z with the college split. Two lanes, never on one
college: lane 1 `ivc`, `sdce` (after `ivc`'s PR) and `readerfix`, with Cosumnes River's paid read after it; lane 2
`piles`. Split changes: `piles` finished at 14:28Z (#3640) and lane 2's next concern went to a fresh worker, `piles2`
(Glendale and Clovis); `readerfix`'s fix-forward findings went to `followup` (#3644); worker `display` took the night's
display build at 16:17Z. San Diego College of Continuing Education's index search carries to the next night. Merged,
each on a green `test` after its thread was read: #3640 `00e441ce`, #3641 `32b00c99`, #3644 `25a8917a`, #3645
`c85bb975` and #3642 `0695b665`; S691's vault note `samueltlee/CPLBrain#837` merged `c9da8405` under Sam's second
ruling below. In flight at the checkpoint: #3649 (`piles2`) and #3650 (`display`).

**The numbers.**
- **Program records: 7 new, 119 replaced by a better reread (20 of them newly passing), 16 collected with a named gap,
  for $1.16 of extraction** (`m-collection-s697`).
  - #3640 (`piles`): the `total_not_printed` gap on Santa Monica 37885 and 45811 to 45815, a guarded UPDATE, 6 of 6 at
    13:37Z. Rereads 44909976872 Orange Coast, 44909979539 Hartnell, 44909982199 Imperial Valley, 44909985423 Oxnard;
    the nine named programs pass live. Orange Coast's 109 live rows at 38670927724 gave way to `main`'s 39726645292,
    which passes or ties on all 109 and is better on 6; the live read found no live row better
    (`d-orange-coast-main-run-stands-s697`). Cerritos 20504 waits: its run also holds 44984, held for a person
    (`d-cerritos-20504-waits-on-44984-s697`).
  - #3645, Cosumnes River: the free pricing run 44916368634 named exactly the 14 (`would_extract` with `only`); the
    paid read 44917314201 cost $1.16 (about $1.53 estimated): 10 pass, 33053 partial, and 20147, 20193 and 20227 still
    place none. Reread 44917690048 replaced 4 live rows; load 44917693465 inserted 7, since `load_rows` skipped the 28
    records that place none, so the load needed no `only` (`d-load-skips-places-none-s697`). 189 live rows, 10
    passing at the new run. The S680 pin test now expects the pin's page (`f-s680-pin-test-pinned-old-pages-s697`),
    and the Commons data were rebuilt.
  - #3649 (`piles2`, in flight): a new named gap, `total_differs` (the catalog prints a total its own printed units do
    not reach; self-recall 1,843 right, 0 wrong; `f-total-differs-gap-s697`), applied by a guarded UPDATE, 10 of 10 at
    16:38Z: Clovis 33493, 35209, 37352, 42234, 42706, 44551; Glendale 12570, 12574, 19566, 39905. The second reader
    dropped Clovis 33431 (floors over lists). Glendale 02570 was rescored by a repeat step with an `each` guard and
    reread live (run 44915445658); it passes.
- **Reader fixes.** #3641 (`readerfix`): `read_short()` (a short read files nothing), the same-page calls in one
  place, the named-programs `only` input and Butte's address compare; 320 committed records newly read unchanged
  (Butte 163, Cuyamaca 155, College of the Canyons 2). #3644 (`followup`): a killed wave extraction and a timed-out
  prior read file nothing, `named_fragment()`, `EDITION_TOKEN \d{1,2}`, the pinned-page test, kept entries under
  `only=`, and the same-page self-recall test (`m-reader-fixes-s697`).
- **Outline rows: 1,732 at Irvine Valley** (#3642, `m-ivc-outlines-loaded-s697`), read on Saddleback's curriQunet
  host: index 44908824732 (1,199 current outlines, report 198), trial 44911142170 (12 of 12), full read 44913397609
  (868 pages, every one 200). Load 44925768837 on `claude/s697-ivc-load`: 864 SLO rows holding 2,639 SLOs and 868
  objective rows holding 6,695 objectives, confirmed live at 16:41Z. The load drops a line with no letter, 23 lines and
  2 rows statewide (HLTH 7 and KNES 64 at Irvine Valley), at the load rather than the parser, so no recall gate stales
  (`d-outline-load-strips-letterless-lines-s697`). The push of the receipt's closing count re-ran the load
  (44926139513): 0 inserted, 1,732 kept.
- **CRE: about 1,837** (7 records at 15 each, plus 1,732 outline rows).
- **Display build `9d9244ee7496`** (#3650, in flight) replacing `e35ae1722a56` (18,616 records): held until the named
  gaps' apply so two writes never ran on one table at once (`d-display-held-for-gaps-apply-s697`); Santa Monica first
  44925708471 (230 of 230), the gate read 16:42:55Z (only Santa Monica's 230 moved), then the whole build.

**Stopped or carried over.**
- #3644's second reader left four findings for the next night's one follow-up (two rounds reached;
  `f-followup-four-left-s697`): a test for the own-run filter in `kb/_program_reread_keep_better.py` (about L631-633;
  a None run stamp at `kb/_program_requirements_college.py` about L7815); `named_fragment` reads any `=` as viewer
  parameters (`#/program?id=1` against `id=2`, `#nameddest=`); `EDITION_TOKEN` still joins `catalog-v24` and `-v25`;
  a capture-only prior read with no PDF page now ends red (College of the Desert's preview 44711759115).
- Clovis's 19 (`f-clovis-19-left-s697`): Business 33432, 33433, 33487, 33491 and Social Science 33492 start or are cut
  at a page break (a pin and a paid reread); 14 read pairs or "any course from List A" wrongly.
- Glendale's 28 (`f-glendale-28-left-s697`): 11 with no record file need a paid extraction (40846, 40847, 21302,
  38973, 24377, 24327, 37070, 36599, 36601, 11155, 21303); of the 17 left, 8 language records take a list "If 20 units
  have not been reached" (a scorer kind), 18639 prints EIGHTEEN, 32607, 36416 and 12503 read pairs wrongly, and 44488,
  45068, 18640 and 30813 fail coverage.
- Cosumnes River's 20147, 20193 and 20227 need their own page, and 33053 a page-break pin.
- Glendale 02570 and the ten `total_differs` records wait for the next display build; the census against 4,875 waits
  for #3650.

**Sam's rulings this run, relayed by COBIx** (#3358, comment 7064588752, about 7:04 AM PT): (1) *"a block is a block
regardless of whose it is to clear."* Every blocked job goes on Needs you, under Collect as *Stuck: waiting on a fix*,
with who clears it and since when, ranked with everything else, Sky's own blocks included
(`r-a-block-is-a-block-sam-2026-11-21`). (2) Vault-note drafts in `samueltlee/CPLBrain` merge on their own once their
checks pass; a vault note goes to Sam only when it changes or adds one of his rulings, said in one line
(`r-vault-notes-merge-on-checks-sam-2026-11-21`). Recorded in [`sam_rulings`](reference/sam_rulings.md),
[`conductor_mode`](reference/conductor_mode.md) (*Recording and Sam*) and
[`scheduled_sessions`](reference/scheduled_sessions.md).

**Lessons.**
- **`check_generated.sh` said current while the Commons data were stale** (`p-check-generated-misses-commons-data-s697`).
  After a records change, `tests/commons_data_status_build_test.py` found `kb/status/commons_data.json` and the college
  sidecars stale; `check_generated.sh` runs neither Commons builder. Run `kb/_build_commons_data_status.py` under 3.12,
  then its test.
- **Every records PR rebuilds the Commons files, so two of them conflict** (`p-commons-files-conflict-between-prs-s697`).
  Merge one, merge `main` into the next, take `main`'s side of the conflicted Commons files and rerun both builders,
  `kb/_build_commons_status.py` and `kb/_build_commons_data_status.py`, under 3.12. The note:
  [`methodology-chain-prs-when-every-merge-conflicts-a-generated-file`](kb-notes/methodology-chain-prs-when-every-merge-conflicts-a-generated-file.md).
- **A bot receipt head runs no `test`** (`p-bot-receipt-head-runs-no-test-s697`). The Irvine Valley load branch's head
  was the runner's receipt commit, and `test` does not run on it. Push a real change (here the receipt's closing live
  count), never an empty commit; the load branch merged into the checkpoint #3639
  (`d-ivc-load-receipt-rides-checkpoint-s697`).
- **A test that pins a college's pages fails when a pin moves them** (`f-s680-pin-test-pinned-old-pages-s697`): #3645
  failed lints on the S680 test that pinned Cosumnes River's old pages; it now expects the pin's page (`3c85e208`).
- **Both guarded UPDATEs ran in compact form** (`d-named-gaps-compact-apply-s697`): the same guards on the run, the
  before checks and no person's check, with the result equal to each plan's `after_checks`, so each plan's rollback
  applies unchanged; #3640's receipt says so in its `applied` field.
- **What worked:** a free pricing run with `only` named exactly the 14 before any money moved; a second reader on every
  change to shared reader code (#3641, #3642, #3644, #3649); one write per table at a time; COBIx's relay acted on
  inside the run.

## Moved from the lane (S703 checkpoint, 2026-11-22)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S703 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

**Display build `e35ae1722a56` is live, confirmed by its closing count** (S691, #3635 `ca45115f`; it replaced `ac082e9d96dc`; 18,609 rows at the build; `m-display-build-live-s691`; its four runs: lessons, *S691*). 32 rows stay at older builds, the same 32 as S690. The confirming read pages by key, never by offset (**DECIDED** `d-display-keyset-confirm-s687`). The gap census of 2026-11-21 (run 44892712171, `main` c1700e76): 4,875 left of 20,282, passing 15,314, from 4,982 and 15,207 (`m-census-4875-s691`). **S697's build `9d9244ee7496`** (#3650, in flight at the checkpoint; held until the named gaps' apply, **DECIDED** `d-display-held-for-gaps-apply-s697`): Santa Monica first 44925708471 (230 of 230), the gate read 16:42:55Z (only Santa Monica's 230 moved), then the whole build.

**S697's posts** (`m-collection-s697`; #3640 `00e441ce`, #3645 `c85bb975`; #3649 in flight): 7 new records (Cosumnes River), 119 replaced by a better reread (Orange Coast 109, Hartnell 2, Imperial Valley 2, Oxnard 1, Cosumnes River 4, Glendale 1), 20 of them newly passing, and 16 collected with a named gap; $1.16 of extraction. Irvine Valley's outlines: 1,732 rows (#3642 `0695b665`, load 44925768837, `m-ivc-outlines-loaded-s697`). Run ids: lessons, *S697*.

**Decisions of S697** (the conductor's, each reversible; rows in `cpl_memory`): **DECIDED** `d-orange-coast-main-run-stands-s697` (`main`'s 39726645292 passes or ties on all 109 rows), `d-named-gaps-compact-apply-s697` (each plan's rollback applies unchanged), `d-cerritos-20504-waits-on-44984-s697`, `d-load-skips-places-none-s697`, `d-outline-load-strips-letterless-lines-s697` (at the load, so no recall gate stales), `d-display-held-for-gaps-apply-s697`, `d-vault-note-merged-under-ruling-s697` and `d-ivc-load-receipt-rides-checkpoint-s697`.

**Rule D (S687, #3569 `3cbf7012`; S688, #3579 `ef16178c`; `d-rule-d-from-committed-previews-s687`, `f-rule-d-cannot-reach-dropped-records-s687`):** `kb/status/program_discontinued.json` holds 16 flagged, each printed only in the prior year's catalog (City College of San Francisco's 7 among them), and 28 not printed (City College of San Francisco 20, College of the Desert 8); a not-printed program is a candidate for a prior-year read, never a flag. #3592 opens the prior-year read (`CAPTURE_PRIOR`) on a PDF catalog. The paragraph as it stood: lessons, *Moved from the lane (S691 checkpoint)*.

**NEXT, in order** (Sam's work order of Nov 20 ranks collection by the M-ID cards each fix unblocks, `r-collect-for-mids-work-order-sam-2026-11-20`: outline fills first, program records second, **DECIDED** `d-mid-ranking-orders-lane-1-s690`; every block is listed until the Commons shows it, `r-a-block-is-a-block-sam-2026-11-21`): (0) Standing: never force a re-extraction blind (`d-rccd-pilot-no-blind-force-s671`); read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); revert a timestamp-only bot commit on a PR head so `test` runs (`d-revert-stamp-commit-for-test-s688`), and on a bot receipt head push a real change, never an empty commit (`p-bot-receipt-head-runs-no-test-s697`); build a generated file with the runner's Python, 3.12 ([`methodology-a-generated-file-is-built-with-the-runners-python`](kb-notes/methodology-a-generated-file-is-built-with-the-runners-python.md)); after a records change run `kb/_build_commons_status.py`, `kb/_build_commons_data_status.py` and `tests/commons_data_status_build_test.py`, which `check_generated.sh` does not (`p-check-generated-misses-commons-data-s697`, `p-commons-files-conflict-between-prs-s697`). (1) **Outline readers** (step 11, [`scheduled_sessions`](reference/scheduled_sessions.md)), by the M-ID cards each improves (`f-outline-ranking-s691`): Saddleback, Rio Hondo and Irvine Valley are loaded. Next San Diego College of Continuing Education's index search (191 cards), then Peralta (one code holds up to four colleges' records). City College of San Francisco's recall gate on `main` names 8c95dee8 where its trial read d5cef493 (`f-ccsf-outline-gate-stale-on-main-s691`): refresh it before the college's next read. Then the standing test in `course-outcomes-load.yml` and the staff-names question (`q-trial-pages-file-staff-names-s689`). The 12 still-taught courses' hand-ins carry no outline text (`f-still-taught-hand-ins-no-outline-text-s691`). **Golden West's 476 header rows** (`f-golden-west-476-header-rows-s690`; Coastline ANTH G190 has the same shape): the before-values file is filed (checksum cb441aa1; plan on `claude/s690-goldenwest-header` 0995d8b5; `d-golden-west-before-values-filed-s691`); the guarded correction waits on a plain session's review. (2) **The next night's one follow-up** (#3644's second reader, two rounds reached; `f-followup-four-left-s697`): a test for the own-run filter in `kb/_program_reread_keep_better.py` (about L631-633; a None run stamp at `kb/_program_requirements_college.py` about L7815); `named_fragment` reads any `=` as viewer parameters (`#/program?id=1` against `id=2`, `#nameddest=`); `EDITION_TOKEN` still joins `catalog-v24` and `-v25`; a capture-only prior read with no PDF page now ends red (College of the Desert's preview 44711759115). (3) **City College of San Francisco:** 20 not printed stay unnamed (`d-ccsf-20-not-named-s691`). Its Cal-GETC step for 32080, 33652 and 46300: the permission check refused the `--calgetc-apply` dry run twice; not routed around, a plain session's, and a block on the list. College of the Desert's 8 keep their gap (`f-desert-prior-catalog-behind-robots-s689`). (4) **Program records' open levers:** Clovis's 19 (`f-clovis-19-left-s697`): Business 33432, 33433, 33487, 33491 and Social Science 33492 start or are cut at a page break (a pin and a paid reread); 14 read pairs or "any course from List A" wrongly. Glendale (`f-glendale-28-left-s697`): 11 with no record file need a paid extraction (40846, 40847, 21302, 38973, 24377, 24327, 37070, 36599, 36601, 11155, 21303); of 17 left, 8 language records take a list "If 20 units have not been reached" (a scorer kind), 18639 prints EIGHTEEN, 32607, 36416 and 12503 read pairs wrongly, 44488, 45068, 18640 and 30813 fail coverage. Cosumnes River's 20147, 20193 and 20227 need their own page, 33053 a page-break pin. Cerritos 20504 waits on 44984, held for a person (`d-cerritos-20504-waits-on-44984-s697`). Butte's address compare landed (#3641; 163 of its records now read unchanged), so its read can run. San Joaquin Delta's apprenticeship programs (`f-sjdelta-apprenticeship-coarse-net-s691`): measure free first. Copper Mountain's catalog moved (`f-copper-mountain-catalog-moved-s689`). S691's other leftovers (College of the Canyons' 9 with no page, the colleges with no own page, the reread gate's three failures, S690's pages): lessons, *Moved from the lane (S697 checkpoint)*. (5) **Cheap piles** (free rule work): the named gaps `total_not_printed` (#3640, 6) and `total_differs` (#3649, 10; self-recall 1,843 right, 0 wrong; `f-total-differs-gap-s697`) are applied. Lever 2 (the general education pattern's units, 192): free reads filed at five colleges (`kb/college_reads/*_ge_units_s691.json`). The noncredit hours total (100), Santa Monica's lists past their figure and Lake Tahoe's quarter units: lessons, *S691*. Santa Rosa Junior's 12 with no own page and 13898 stay as filed; 37014 is held. Los Medanos stays parked. (6) **The printed-course files** (`r-plain-page-read-blocked-catalogs-sam-2026-11-20`, `m-printed-catalog-courses-s690`): 17,341 printed courses at 16 colleges in `kb/hand_filed_catalogs/courses/<slug>.json.gz` with `index.json` (**DECIDED** `d-course-rows-gzipped-s690`), read on the runner for $0; no committed pipeline yet fills an M-ID card's missing description from them. **Sky can read 2026-27 HTML:** North Orange Continuing Education, Southwestern, Cerritos, Long Beach City, Monterey Peninsula. **Sky can read 2026-27 catalog PDF:** East Los Angeles, Los Angeles City, Los Angeles Harbor, Los Angeles Mission, Los Angeles Southwest, Los Angeles Trade-Technical, Los Angeles Valley, Pierce, West Los Angeles, Clovis. The rest of the item: lessons, *Moved from the lane (S697 checkpoint)*. (7) **The display and the census:** #3650's build, then `harvest-gap-census.yml` on `main` against 4,875; Glendale 02570 and the ten `total_differs` records wait for the build after it. (8) Lassen: the structured-fields migration's step 1 ([`reference/roep_display_structured_fields_design`](reference/roep_display_structured_fields_design.md), #3296); 31297, 35106 and 41912 held. (9) #3293, parked as issue #3525 (`d-passing-dry-run-held-for-cobix-s651`): a plain session decides from the issue. (10) #3502's reader changes, cheapest first. (11) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then the default on. (12) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (13) The teach-out rule (#3491), after a runner capture. (14) Los Medanos's and Los Angeles Valley's program rules, with a person. (15) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** College of the Canyons 43388 and West Los Angeles 46261 (S691); Napa Valley 19126, 31158 and 36528 (`napa_valley/held_for_person/`, S690); Los Angeles Harbor 44947; Cerritos 44984; West Los Angeles 38677; Los Angeles Mission 44849 (no live row); Los Angeles City 32832 (live run 39006380342, `main` files 43212072618); Ventura 45355 and Shasta 18153. Older lists: lessons, S653, S666, *Moved from the lane (S684 checkpoint)* to *(S697 checkpoint)*.

## S703 (SkyDovekie, the CPL Queue routine's collection run of 2026-11-22, from about 11:03Z): four named gaps, San Diego College of Continuing Education's outlines, Peralta's read

**What happened.** The 10:12Z firing stood down: S701 (Sam's plain session) was live and its open PR named no
side-session scope. S701 signed off at 11:00Z. At about 11:03Z Sam said, live: *"/coord and keep going. I will be
starting another session but don't let that stop the queue."* The run declared on draft #3674 at 11:08Z with the college
split, beside Sam's plain session S702 (#3673; one writer per file: S702 kept the Subjects and Commons page files, this
run the harvest files). Two lanes, never on one college: lane 1 `outlines`, `pins` and `glendale`, then `levers`,
`peralta` and `followup`; lane 2 `piles`, then `piles2`; worker `display` after the merges. The split changes are in
handoff 704. Merged, each on a green `test` after its thread was read: #3676 `d8b5e4ee`, #3678 `5dbc743d`, #3679
`94406494`, #3677 `50e4bc1d`, #3681 `40b9a2f6`, #3685 `be37ec75`. In flight at the checkpoint: #3686 (`levers`), #3675
(`glendale`), #3683 (`followup`), #3684 (`peralta`) and the display build.

**The numbers.**
- **Named gaps, each a guarded UPDATE through `supabase-migrate.yml`** (Sam, 2026-11-17: collect with gaps noted):
  - #3678: `ge_units_not_read`, 131 rows at 29 colleges (migrate 45019924640, returned 131, none skipped). The second
    read held 21 that print a general education figure, which the free `ge_units_steps` lever passes
    (`d-ge-gap-only-where-no-figure-s703`).
  - #3679: `hours_total_not_read` 32, `hours_total_differs` 11, `hours_within_printed_range` 7, 50 rows at 11 colleges
    (migrate 45023631381). The second read held 19: eight a reread or reconcile wording passes free, ten read without
    the program section, and Reedley 42457 as a rounding question (`d-hours-gaps-hold-misreads-s703`).
  - #3681: Clovis 33433 `total_not_printed` and 33491 `total_differs` under the existing rules (migrate 45024254789, 2
    of 2; `d-clovis-two-gaps-existing-rules-s703`).
  - #3685: `lists_past_their_figure`, 17 rows at 9 colleges (migrate 45030559364). The second read held 12 more, 29 in
    all: notes that name the course or list making up the difference (`d-lists-gap-holds-claim-false-s703`) and sums
    inside a printed range (`d-lists-gap-holds-range-sums-s703`). Santa Rosa Junior's 27 are cut-off or incomplete
    reads, not this shape.
- **Program records.** #3681: Cosumnes River 20147, 20193, 20227 and 33053 and Clovis 33433, 33487 and 33491 pinned to
  their own pages (free reads 45016537664 and 45017083685), paid reads 45018951701 ($0.36) and 45018954283 ($0.23),
  rereads 45021161151 and 45022017976, load 45022641854: 3 new, 4 replaced, 5 passing. Clovis Management 33487 is the
  standalone degree (`d-clovis-management-is-the-standalone-degree-s703`); 33432 and 33492 waited on a `through` pin
  field (`d-clovis-through-pin-to-followup-s703`). In flight: #3686, Ohlone 2 (load 45026280729, $0.14) and San
  Joaquin Delta 6 (load 45029460149, $0.36, through per-college prefix aliases IND, ELE and MEC with an A- prefix,
  `d-sjdelta-prefix-alias-stopgap-s703`), and 141 filed as named gaps in `no_record_s703.json` at Ohlone, San Joaquin
  Delta, Mt. San Antonio, Santa Barbara City and Orange Coast (`d-levers-paid-under-5-delegated-s703`: $5 a college
  per run after free pricing). #3675: Glendale's 11 with no record file filed as named gaps
  (`d-glendale-own-pages-filed-as-gaps-s703`), 38973's OBT re-prefixed as STV by a per-college alias
  (`d-glendale-obt-stv-prefix-alias-s703`), Butte 39882 (page moved; $0.05, load 45026794241, 1 inserted, live and
  passing). #3683: Clovis 33492 passes ($0.15, read 45033577888; reread 45034008640, load 45034109582); 33432 reads at
  coverage 0.933 with no total printed. Extraction tonight: $1.29 before Glendale 38973's fresh read 45030485543.
- **Outlines.** #3676: a recall count binds to its own trial's parser. City College of San Francisco's gate refreshed by
  free trial 45018845370, 12 of 12 on parser 2629a09a (`d-ccsf-gate-refresh-by-free-trial-s703`). San Diego College of
  Continuing Education: index 45016944119 (199 of 228 codes hold an outline), trial 45017581874 (12 of 12), full read
  45018663453 (199 pages, all 200), load 45021318423 on `claude/s703-sdcce-load`: 198 objective rows, 1,860 objectives,
  198 courses, confirmed live (`d-sdcce-load-objectives-only-s703`; its 6 SLO rows read field labels). HMID 535 keeps
  its 11 Legacy Data objectives, its only copy (`d-legacy-objectives-kept-when-only-copy-s703`). The load's receipt
  rides the checkpoint #3674; `kb/course_outcomes/.load` there stays at `main`'s value, so no push re-runs it.
- **Peralta** (#3684): index 45025388165 (2,201 codes, 376 shared by two to four colleges); per-college rows, a
  section parser, the page's printed college, an outcomes-only host (`d-lan-outcomes-only-host-s703`) and a per-host
  fingerprint, lan 27934ff7 and the others 2629a09a (`d-lan-parse-parts-in-lan-fingerprint-only-s703`). Trial
  45030224450 counted 11 of 12; full read 45031089800 (1,869 pages in 5 parts) queued 14:07Z, part 1 filed 14:38Z.

**Stopped or carried over.** Peralta's load is the next session's: a dry run, then `.load` with `host=lan` and
`slugs=laney,merritt,college_of_alameda,berkeley_city`. The next follow-up's minors and the blocks: handoff 704 and the
lane's NEXT (2). The display build and the census against 4,839 ran after the merges.

**Lessons.**
- **A self-recall whose held answer comes from the rule's own fields measures nothing**
  (`p-self-recall-reads-rule-fields-s703`). #3678's and #3679's self-recalls read 1,685 and 3,297 right with 0 wrong,
  and the second reader still found records the gap mislabeled, 21 on #3678 and 18 on #3679. The fix is a claim check
  on the record's own notes, boundary readings (the sum at each end of a printed range) and a precision count against
  hand-held records. #3685 began with all three; its second reader still held 12 more, and its precision count flags 28 of
  the 29 hand-held. Note:
  [`methodology-a-test-must-not-take-its-rule-as-the-truth`](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md),
  *A named gap's self-recall*.
- **A `sources_from` paid read refuses a pinned program refused before** (`p-sources-from-refuses-pinned-refused-s703`;
  Ohlone 45025818053). Read fresh. Glendale 38973's staged read met the same refusal
  (`p-sources-from-repays-refused-pages-s689`).
- **A push whose head is a merge commit starts no page read** (`p-merge-head-push-starts-no-read-s703`). Dispatch by
  plan name.
- **A reader change that moves the global parser fingerprint stales every host's gate**
  (`p-global-fingerprint-stales-every-gate-s703`). Make the fingerprint per host.
- **Peralta's 5-page shape trial filed pages that print an Originator's name**, because `lan.curriqunet.com` was not
  outcomes-only (`p-lan-not-outcomes-only-filed-names-s703`). One fresh commit and a force-with-lease on the `claude/*`
  branch scrubbed the branch; the 30-day artifact `course-outcomes-45026998155-part1` still holds the pages, and the old
  commits stay fetchable by sha until GitHub prunes them. Deleting the artifact is a person's. No name goes in any
  document.
- **Records PRs merge one at a time** (`p-records-prs-merge-one-at-a-time-s703`): each rebuilds
  `commons_data.json`, so each merge sends the next back to merge `main`, a CI cycle of about 25 minutes.
- **A `test` check appears only after `lints` finishes** (`p-test-check-after-lints-s703`): a head with no `test` yet is
  pending, never green.
- **What worked:** a second reader on every named gap before its apply; free pricing with `only` before each paid read
  ($1.29 of extraction in all); a fresh free trial to refresh a stale gate; per-college prefix aliases as a
  stopgap; the run went on beside Sam's plain session with one writer per file.

## Moved from the lane (S713 checkpoint, 2026-11-23)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S713 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

**Display build `9d9244ee7496` is live, confirmed by its closing count** (S697, #3650 `ede8cdd4`; 18,616 records; the same 32 rows at older builds). The confirming read pages by key, never by offset (**DECIDED** `d-display-keyset-confirm-s687`). The census of 2026-11-21 (44927819145): 4,839 left of 20,282, passing 15,443. S703's build and census: handoff 704.

**S703's posts** (`m-collection-s703`; #3678 `5dbc743d`, #3679 `94406494`, #3681 `40b9a2f6`, #3685 `be37ec75`; #3675, #3683 and #3686 in flight at the checkpoint): named gaps applied, `ge_units_not_read` 131 at 29 colleges, the hours gaps 50 at 11 (32 not read, 11 differ, 7 within a range), Clovis 33433 and 33491, and `lists_past_their_figure` 17 at 9; the second reads held 21, 19 and 29 records by key. Pins at Cosumnes River and Clovis: 3 new, 4 replaced, 5 passing ($0.59). In flight: #3686 (Ohlone 2 and San Joaquin Delta 6 loaded, $0.50), #3675 (Butte 39882, $0.05) and #3683 (Clovis 33492, $0.15). San Diego College of Continuing Education's outlines: 198 objective rows holding 1,860 objectives (#3677 `50e4bc1d`, load 45021318423, `m-sdcce-outlines-loaded-s703`). Run ids: lessons, *S703*.

**Decisions of S703** (the conductor's, each reversible; rows in `cpl_memory`): **DECIDED** `d-glendale-own-pages-filed-as-gaps-s703`, `d-glendale-obt-stv-prefix-alias-s703`, `d-ge-gap-only-where-no-figure-s703`, `d-hours-gaps-hold-misreads-s703`, `d-ccsf-gate-refresh-by-free-trial-s703`, `d-clovis-through-pin-to-followup-s703`, `d-clovis-management-is-the-standalone-degree-s703`, `d-clovis-two-gaps-existing-rules-s703`, `d-legacy-objectives-kept-when-only-copy-s703`, `d-sdcce-load-objectives-only-s703`, `d-levers-paid-under-5-delegated-s703`, `d-lan-parse-parts-in-lan-fingerprint-only-s703`, `d-lan-outcomes-only-host-s703`, `d-lists-gap-holds-claim-false-s703`, `d-lists-gap-holds-range-sums-s703` and `d-sjdelta-prefix-alias-stopgap-s703`. S697's decisions stand: the paragraph as it stood, lessons, *Moved from the lane (S703 checkpoint)*.

**NEXT, in order** (Sam's work order of Nov 20 ranks collection by the M-ID cards each fix unblocks, `r-collect-for-mids-work-order-sam-2026-11-20`: outline fills first, program records second, **DECIDED** `d-mid-ranking-orders-lane-1-s690`; every block is listed until the Commons shows it, `r-a-block-is-a-block-sam-2026-11-21`): (0) Standing: never force a re-extraction blind (`d-rccd-pilot-no-blind-force-s671`); read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); revert a timestamp-only bot commit on a PR head (`d-revert-stamp-commit-for-test-s688`); on a bot receipt head push a real change, never an empty commit (`p-bot-receipt-head-runs-no-test-s697`); build a generated file with Python 3.12 ([`methodology-a-generated-file-is-built-with-the-runners-python`](kb-notes/methodology-a-generated-file-is-built-with-the-runners-python.md)); after a records change run both Commons builders and `tests/commons_data_status_build_test.py`, which `check_generated.sh` does not (`p-check-generated-misses-commons-data-s697`, `p-commons-files-conflict-between-prs-s697`); merge records PRs one at a time (`p-records-prs-merge-one-at-a-time-s703`); a new rule's self-recall holds answers its own fields did not supply: a claim check on the record's notes, boundary readings and a precision count (`p-self-recall-reads-rule-fields-s703`, [`methodology-a-test-must-not-take-its-rule-as-the-truth`](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md)); a merge-commit head starts no page read, so dispatch by plan name (`p-merge-head-push-starts-no-read-s703`); `test` appears only after `lints` (`p-test-check-after-lints-s703`). (1) **Outline readers** (step 11, [`scheduled_sessions`](reference/scheduled_sessions.md)), by the M-ID cards each improves (`f-outline-ranking-s691`): Saddleback, Rio Hondo, Irvine Valley and San Diego College of Continuing Education are loaded (SDCCE objectives only; its 6 SLO rows read field labels, the Commons shows them as outcomes, and they go to the follow-up). **Peralta's load is next** (#3684; lessons, *S703*): once full read 45031089800 (1,869 pages in 5 parts) lands, a dry run, then `.load` with `host=lan` and `slugs=laney,merritt,college_of_alameda,berkeley_city`; its 4 parse minors go to the follow-up. **For a person:** delete the 30-day artifact `course-outcomes-45026998155-part1`, whose shape-trial pages print an Originator's name (`p-lan-not-outcomes-only-filed-names-s703`). City College of San Francisco's gate is fresh (trial 45018845370, 12 of 12 on parser 2629a09a), so its next read can run. Then the standing test in `course-outcomes-load.yml` and the staff-names question (`q-trial-pages-file-staff-names-s689`). The 12 still-taught courses' hand-ins carry no outline text (`f-still-taught-hand-ins-no-outline-text-s691`). **Golden West's 476 header rows** (`f-golden-west-476-header-rows-s690`, `d-golden-west-before-values-filed-s691`; plan on `claude/s690-goldenwest-header` 0995d8b5): the guarded correction waits on a plain session's review. (2) **The night's one follow-up:** #3683 (S697's four findings, the `through` pin field, the named-gaps tag; its second reader said merge, three minors fixed) lands first. The next follow-up takes: SDCCE's 6 SLO-label rows; Peralta's 4 parse minors; the lists gap's state-file notes (Los Angeles Harbor 44271, Los Angeles Trade-Technical 44345 and 45670); Orange Coast 03997, 08668 and 12159; the hours reconcile eight (Laney 38970, 39365, 39366, 39368 and 43451; De Anza 41176; Mendocino 43158; Coastline 42718); Mt. San Antonio 43777 and 43999 (capture reach); Glendale's data-names-the-program lever; the coarse-net hyphen (`f-sjdelta-apprenticeship-coarse-net-s691`); the `sources_from` pinned refusal (`p-sources-from-refuses-pinned-refused-s703`); the `through` window's `until` field. (3) **City College of San Francisco:** 20 not printed stay unnamed (`d-ccsf-20-not-named-s691`); its Cal-GETC dry run for 32080, 33652 and 46300 was refused twice by the permission check, not routed around, a plain session's and a block; its 53 page-finding programs and 28 wording rules wait for a later run. College of the Desert's 8 keep their gap (`f-desert-prior-catalog-behind-robots-s689`). (4) **Program records' open levers:** Clovis: 33433 and 33491 carry named gaps, 33487 and 33492 pass, 33432 reads at coverage 0.933 with no total printed; the 14 that read pairs or "any course from List A" wrongly go to lane 2's wording rules. Glendale: the 11 with no record file are filed as named gaps (#3675); 38973's staged read was refused (`p-sources-from-repays-refused-pages-s689`) and its fresh read 45030485543 was in flight; the other 17 as `f-glendale-28-left-s697` lists them. The page-finding levers (#3686): Ohlone 2 and San Joaquin Delta 6 loaded, 141 filed as named gaps in `no_record_s703.json` at Ohlone, San Joaquin Delta, Mt. San Antonio, Santa Barbara City and Orange Coast. Cerritos 20504 waits on 44984 (`d-cerritos-20504-waits-on-44984-s697`). Copper Mountain's catalog moved (`f-copper-mountain-catalog-moved-s689`). (5) **Cheap piles** (free rule work): `total_not_printed`, `total_differs`, `ge_units_not_read`, the three hours gaps and `lists_past_their_figure` are applied. Held by key: 21 that print a general education figure (the free `ge_units_steps` lever passes them), 19 hours records (the reconcile eight, ten read without the program section, Reedley 42457's rounding) and 29 lists records. Next: the wording rules at Glendale (28), Clovis (14) and City College of San Francisco (28), each with a claim check and a precision count. Santa Rosa Junior's 27 are cut-off or incomplete reads; its 12 with no own page and 13898 stay as filed; 37014 is held. Lake Tahoe's 13 sit on quarter units with no ruling. Los Medanos stays parked. (6) **The printed-course files** (`m-printed-catalog-courses-s690`, **DECIDED** `d-course-rows-gzipped-s690`): 17,341 printed courses at 16 colleges, read on the runner for $0; no committed pipeline yet fills an M-ID card's missing description from them. Which colleges Sky can read in 2026-27 HTML or PDF, and the rest of the item: lessons, *Moved from the lane (S703 checkpoint)*. (7) **The display and the census:** S703's build, then `harvest-gap-census.yml` on `main` against 4,839; the next build after #3675, #3683 and #3686 merge. (8) Lassen: the structured-fields migration's step 1 ([`reference/roep_display_structured_fields_design`](reference/roep_display_structured_fields_design.md), #3296); 31297, 35106 and 41912 held. (9) #3293, parked as issue #3525 (`d-passing-dry-run-held-for-cobix-s651`): a plain session decides from the issue. (10) #3502's reader changes, cheapest first. (11) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then the default on. (12) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (13) The teach-out rule (#3491), after a runner capture. (14) Los Medanos's and Los Angeles Valley's program rules, with a person. (15) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** the artifact above (S703); College of the Canyons 43388 and West Los Angeles 46261 (S691); Napa Valley 19126, 31158 and 36528 (`napa_valley/held_for_person/`, S690); Los Angeles Harbor 44947; Cerritos 44984; West Los Angeles 38677; Los Angeles Mission 44849 (no live row); Los Angeles City 32832 (live run 39006380342, `main` files 43212072618); Ventura 45355 and Shasta 18153. Older lists: lessons, S653, S666, *Moved from the lane (S684 checkpoint)* to *(S703 checkpoint)*.

## S713 (SkyKittiwake, the CPL Queue routine's 06:12Z collection run of 2026-11-23): S703's four PRs landed, Peralta's outlines, three lane-2 applies, display da3198af6b98

**What happened.** The 06:12Z firing found no session live: S703's four PRs (#3684, #3675, #3683, #3686) open, the
newest updated 16:26Z on 11-22, and `main` quiet since #3702 at 02:40Z. Handoff 704 named this session SkyKittiwake,
Session 704, but Sam's plain sessions had taken 705 to 712, so the run took S713 and wrote handoff 714
(`d-routine-takes-next-free-number-s713`). It declared on draft #3704 at 06:20Z with the college split. Two lanes, never
on one college: lane 1 `peralta` (Peralta's load, then City College of San Francisco whole) and `land` (S703's records
PRs, one at a time), then `display`; lane 2 `piles` (Santa Rosa Junior, Santa Monica, three general education steps),
then `piles2` (Glendale, Clovis). The split changes are in handoff 714. Merged, each on a green `test` after its thread
was read: #3686 `9b8480e3`, #3675 `706c0154`, #3684 `e0fa378d`, #3705 `1d8b5cfd`, #3683 `0f5b849e`, #3708 `02c44ae4`.
Then, after the checkpoint's documents: #3707 `7a67b1de`, #3709 `9f529482` (Glendale and Clovis, one PR) and #3710
`62309028`, each applied or loaded and confirmed live first. Nothing waited on Sam; he gave no ruling tonight.

**The numbers.**
- **Outlines.**
  - Peralta (#3684): the dry run of read 45031089800 (3,738 rows) filed label lines as outcomes, so a load-time clean at
    the `lan` folder went first (`d-peralta-load-cleans-labels-first-s713`): a leading ": ", the SCANS framework run
    (its heading, Competency, Skill and Scans lines), a bare "Part N" heading, and placeholder lines (None, N/A, a lone
    letter); after the second reader, also 12 curriculum-system notes ("Won't delete", "duplicate to be removed"). The
    filed read stays as read, and no parser fingerprint or recall gate moved. Load 45127831747: 3,731 rows inserted, 7
    placeholder blocks skipped (Laney 663 SLO and 663 objective rows, Merritt 463 and 465, College of Alameda 365 and
    368, Berkeley City 372 and 372), confirmed live; rollback by college and read run.
  - City College of San Francisco: read 45128775065 in four parts (parser 2629a09a; part 1, 355 pages and 1,436 SLOs,
    no objectives printed). Its dry run counted 1,419 SLO rows, 1,416 carrying the fingerprints of S690's live rows;
    load 45148533372 inserted 3 (CS 160B, VMD 192, CS 155P), kept 1,416 and skipped 1.
- **Program records, lane 2, no paid read**, each with a claim check, boundary readings and a precision count before
  its second read:
  - #3705, Santa Rosa Junior: a code that prints its common course number in parentheses ("PSYC 1000 (PSYC C1000)",
    the same subject only) keys as that number where the state's file lists it, so 15243, 16965, 21729, 30840 and
    40890 pass. The `section_cut_off` named gap (the reader's note says the requirements continue on a page the read
    did not hold, and the units fall short or cannot be added), gated to two colleges, takes 10. The second reader held
    06566 and 32298 (`d-srjc-cut-off-holds-two-s713`) and added the confirm guard. Migrate 45131380266, 15 of 15 live.
    Santa Monica's 26 moved none: 6 wait on a free page-text step, 17 on a reread, 3 on a person.
  - #3707, three general education steps on the 11 of S703's 21 general education holds outside lane 1's colleges
    (`d-ge-steps-three-colleges-s713`): Las Positas's two LPC-GE steps read "Additional General Education and
    Elective(s)"; Antelope Valley fills "Completion of General Education requirements, plus electives as needed to reach
    60 units" as a local degree's general education units, only where that figure is the degree total less the major's
    total; College of Marin takes 22 to 34 where the page prints College of Marin GE (minimum 22) and Cal-GETC (minimum
    34). Free reconcile runs 45127792228, 45133183717 and 45135695869. Eight move from failing to passing (Las Positas
    01032, 09214, 36235, 38886; Antelope Valley 36852, 40870, 43686, 43722); migrate 45147953792, 8 of 8 live. Las
    Positas 01037 is held (`d-ge-01037-held-double-count-s713`); 09227 and 39295 still fail, so they took no row
    (`d-plan-rows-change-a-verdict-s713`); 18813 took the step, places none of its courses and was never loaded.
    College of Marin moved nothing: its program URLs changed form, and the moved-page guard reads no text it did not
    extract from. Antelope Valley 43028 and De Anza 45499 go to a person.
  - Glendale (`claude/s713-piles2`): of the 28 census records, the 11 with no record file stay #3675's named gaps. Of
    the 17 left, 13 pass: a list headed "If 20 units have not been reached in the required core" or "IF ANY REQUIRED
    COURSES WERE SUBSTITUTED" stands in for one core course (9); a list heading that ends in a figure in words fills the
    program to it (2); Glendale's `course_renumbers` name PSYC 104 for the file's PSYCH 104 (2). The reader's three
    latent minors were fixed first, the 13 after-images unchanged (`d-glendale-minors-before-apply-s713`). Migrate
    45148301846, 13 of 13 live. Held: 32607, 36416, 44488, 45068.
  - Clovis (in #3709; migrate 45152118403, 6 of 6 live): a lecture and its lab as one option (`lab_pairs`: 42235, 33508), a list
    that also takes an earlier list's leftovers (`also_from`: 35535, 33502), two renumbers (33486, 45957). Six rows
    planned, checks only; 11 held. Elsewhere `lab_pairs` moves 10 records, none written: 7 pass at their next load,
    Santa Ana 31887 stays failing, San Diego City 17972 and 17976 are not exact.
- **City College of San Francisco's 53 page-finding programs:** 46 named gaps (18 credit and 27 noncredit not printed
  under their own title, and 24263, whose only page is 40432's) plus Cal-GETC 45768 under the census's existing
  `ge_pattern_certificate` gap (`d-ccsf-45768-existing-gap-s713`), 47 in `no_record_s713.json`. Seven own pages pinned
  (capture 45131492116): 17954 read for $0.17 (45132633405) and held (coverage 0.753; its lists add to 4.0-13.0
  against the printed 18.0); 09178, 17952, 31602, 36964 and 42318 held for a list or wording rule (shares 0 to 0.333
  against the state's list). One PR with the outline read (`d-ccsf-one-pr-s713`).
- **The display build `da3198af6b98`** (#3708): gate 45144424595 at Cosumnes River (192 at the build, none elsewhere,
  no row without a build key), then the whole build 45146020705: 18,628 rows at the build and the same 32 at older
  builds (16 at 0874a3a15f22, 15 at bef8ef819af7, 1 at 4c57fd250cce), 18,660; 12 added (San Joaquin Delta 6, Cosumnes
  River 3, Ohlone 2, Butte 1), 232 changed at 50 colleges.
- **Canceled:** the page read #3675's merge push started (45128802291, rereading #3686's 11 plans), as redundant
  (`d-cancel-merge-push-page-read-s713`).

**Stopped or carried over.** Every PR landed; the census ran on `main` after #3710; the next display build carries the
27 records applied after tonight's: handoff 714. The minors: the lane's NEXT (2).

**Lessons.**
- **A compact pre-read** (`p-compact-preread-by-md5-s713`). #3705's committed pre-read carries 72 KB of before-values.
  Hashing them on a local Postgres 16 (`pg_ctlcluster 16 main`) and comparing `md5(record::text)` live cut the read to
  2 KB and matched 15 of 15. #3707's and Glendale's ran the same way, the functions they call recreated locally from
  `pg_get_functiondef`.
- **Workers share the shallow clone's object store** (`p-shared-shallow-clone-reshallows-s713`): one worker's `--depth`
  fetch shortened another's history mid-build. Fetch with `--shallow-since` or `--deepen`. S691's
  `p-shared-git-shallow-lock-s691` is the same store's lock.
- **A prior confirm can mark a row checked at apply** (`p-confirm-verdict-marks-checked-at-apply-s713`): a confirm
  verdict whose fingerprint matches the new record marks it checked as the apply writes it, and the rollback then skips
  that row. The pre-read counts `confirm_matches` (and, on a full-row rewrite, the confirms carried from the old record,
  Sheet 82 card 1), and the apply aborts above 0.
- **The claim check reads today's capture** (`p-claim-check-reads-current-capture-s713`): `sources.json`, never the
  read behind the record, so it cannot fail a one- or two-page read or a sentence that names no page. Each receipt says
  so.
- **A bot receipt head gets its `test` from a dispatch** (`p-bot-receipt-head-dispatch-js-tests-s713`): `js-tests.yml`
  dispatched on `claude/s713-display` ran `test` on #3708's head `946b03ea` (run 45148367921, green at 09:50Z), with no
  empty commit.
- **A plan writes only what changes a verdict** (`d-plan-rows-change-a-verdict-s713`); an existing gap that fits is
  filed (`d-ccsf-45768-existing-gap-s713`); a college whose work spans two branches goes in one PR, one merge cycle in
  place of two (`d-ccsf-one-pr-s713`).
- **What worked:** free rule work first, 42 records and 47 named gaps for $0.17 of extraction; a second reader on every
  plan before its apply; one writer per table (#3707's apply waited for the display build).
