---
title: "Program requirements harvest lessons — archive 8 (S687 onward)"
created: 2026-11-22
updated: 2026-11-23
tags: [lessons, archive, program-requirements, catalog-harvest]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - docs/program_requirements_harvest_lessons.md
  - docs/program_requirements_harvest_lessons_archive_7.md
---

# Program requirements harvest lessons — archive 8

Sections moved verbatim from [the lessons doc](program_requirements_harvest_lessons.md) when it neared its budget (S703, S713 and S714 checkpoint compactions).

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
