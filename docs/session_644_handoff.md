---
title: "Session 644 handoff (from SkyLark, S643)"
created: 2026-11-12
updated: 2026-11-12
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyWren (Session 644)

Written for SkyLark (S643, the conductor; Fable 5.2 at medium effort, Opus workers; session
`01Rvwe2YCKxdVk7Nko4fCC4Z`) by a documents worker at a full checkpoint, about 22:20Z 2026-11-12. Sam opened S643 at
20:17Z with the 643 handoff's opening line and no other direction, and said nothing in session after it, so this
session carries no new verbatim ruling of his. The Funding Follow-up Dashboard session (`01Rvwe2VQ2q2fGFTgyYerM8J`) was
live the whole time on the funding and csm-workspace files; SkyLark sent it a coordination note at 20:30Z, and it
reported the red `main`. Facts were read from `origin/main` (`b25ac4e4`), the receipts and the lane files; a fact marked
*as reported* came from the conductor's brief and was not re-read.

## First things

1. **The Victor Valley display run failed only on its missing count** (*After the checkpoint*). Decide the 22 Los
   Angeles City keys (`program-requirements-harvest` NEXT 2) before the next display run, or it fails the same way.
2. **Did the first real daily run after #3180 publish?** The 06:17 UTC run on 2026-11-13: read its log for
   `Daily push rebased over a changed input` or `Daily push conflicted`, the rebuild's minutes, and whether its push
   landed (`governance-team-enablement` NEXT 1). Then `get_check_runs` on `main`'s head, `test`.
3. **Read COBIx before any merge.** #3110, #3111, #2962 and #3153 to their last comment, every issue or PR COBIx touched
   today (`commenter:cobi-cto updated:>=<today>`), then each PR's own comments, last page included. He had not commented
   on any S643 PR by 22:05Z; the conductor posted on #3110, #2962 and #3153.
4. Rule 8's `cpl_memory` query (tags `first-light`, `commons`, `mid-reclustering`, `cer-procedures`, `library`,
   `governance-team-enablement`, `program-requirements`, `conductor`), the three-repo check, the highest-numbered
   handoff, `list_sessions` if you hold it. `df -h /home/user` and `git worktree list`. Fetch branches by name with
   `--depth 50`, never a bare `git fetch origin`.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: Open work 1, 3 (the views only, never an
Apply), 5, 6, 7 and 8. **Waits for Sam, never merged or run by a session:** the deploy of `docket-process` and
`library-publish-now`; the GitHub Actions pull-request setting; #3159 (his gallery marks); the six re-clustering cases
and the Honors question; the coverage notes to Malone and MAP/ITPI (his send); analytics on public pages (his go);
anything on the `CLAUDE.md` hold list. #2894 is his. **[Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt)** is current (Version 1, published about 22:35Z,
a fresh store, `replies` empty at publish); cards 4, 5 and 6 wait. It supersedes [Sheet 185](https://claude.ai/artifact/2PwwdsMScgRHsRirkZGDJc) except 185's card 8
(#3159), which still waits there. Its source is on CPLBrain#769 (draft).

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S643, and what worked* included.

## Conductor settings

Copied from `docs/reference/conductor_mode.md`, *Settings (Sam, 2026-11-11)*; Sam's latest change was 2026-11-11:

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx (Sam, 2026-11-11, relayed by COBIx on #3110;
  `cpl_memory` `sam-conductor-model-fable-5-2-2026-11-11`). The routine's form sets the model and ultracode; medium
  effort lives in its prompt.
- Ultracode on.
- The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`).
- A worker building anything that writes shared data or changes an apply runs at **high** effort: the conductor passes
  `effort: "high"` on that worker (Sam asked for it, which is what the Agent tool requires). Other workers run at the
  default.
- A review workflow uses **at most 9 agents in all**, readers and second readers together. Drop the second reader on
  minor findings first.
- **Cost limits** (relayed by COBIx on #3111, comment 6808460886; confirmed by the S639 relay ruling): $40 per
  college per run, on the estimate, for program-requirements extraction, and a separate $40 per college for SLOs, PLOs
  and course objectives. The limit is per run and never a remaining pot. Paid runs go through the conductor.

Every brief that adds a test file says: its floor goes in `tests/check_floor.json`, run the tests touching your files
plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, and let CI run the rest. A brief that adds
a migration says: it applies on the push of the `.apply` change, before any merge.

## Ledger (PR, branch, state) at sign-off

| PR or branch | State | Next |
|---|---|---|
| this checkpoint's PR `claude/checkpoint-s643` | draft | merge on a green `test` |
| CPLBrain draft PR on `claude/skylark-session-643-6ycsl5` (head `69a7a9bd`; Sheet 185's branch merged in) | draft | Sheet 186 published from it ([Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt), current); merge it; `/home/user/CPLBrain` is behind it: pull before writing |
| #3159 `claude/first-light-apply-marks-s642` | merged `be7dcb88` 22:28Z by Sam | done |
| #2894 `claude/cobix-inbox` | Sam's | untouched |
| `claude/harvest-desert-proof-s641`, `-pdf-baseline-s640` | S641's | per the harvest lane |

No S643 worker survives a new session. Brief a fresh one per open branch from its PR diff and this ledger.

## What shipped (S643): eight PRs, each squash-merged on a green `test`

- **#3178** `c44fdb73` (20:42Z) the red `main` fixed: `tests/exhibits_related_actions.test.js` read a held card that
  had left `kb/exhibits_review.json`; each real-data block now runs only while its card is held.
- **#3182** `3189c403` (21:05Z) re-clustering Step 1 on COBIx's four points: a district guard on splits and merges,
  two reach columns, cases by reach, a subject-code check, a non-zero exit on a zero-row read.
- **#3180** `f2864716` (21:05Z) the daily run rebuilds once when a clean rebase changes a build input; a failed input
  rebuild publishes the first build. Two readers, six minor findings fixed. Run only in a scratch repo so far.
- **#3179** `8992e627` (21:16Z) returned titles acknowledged (`kb/returned_titles_acknowledged.json`), a lint warning,
  `#exhibits/renamed`; scorecard review list 12, unacknowledged 0.
- **#3161** `e8784638` (21:27Z) Victor Valley's four EMS certificates, with the lane and the `fetch_copy` docstring.
  The display run 43310473532 (`program-requirements-college.yml`, step=display, extract=0) was dispatched 21:27Z and
  still in progress at 22:14Z: **not confirmed**.
- **#3184** `1ee58637` (21:43Z) `docket-process` gets the shared-queue check, `_shared/group_queue.mjs`. Merged,
  **not deployed**.
- **#3181** `b25ac4e4` (22:01Z) First Light editing, phase B part 1: marks, the Apply request, their tables, policies
  and tab controls. Four readers: five major findings, then three more, all fixed with tests (`sierra-page-redesign`).
- **#3183** `e19440b5` (about 22:14Z, no comments on its thread) First Light's Apply: `first-light-apply.yml`, an
  hourly look that opens the one PR, and `tools/first_light_apply.mjs`.

## Live data written, each with its undo

- **Migration `s643_first_light_marks`:** applied on the branch push at 21:31Z (run 43310349633), verified by the
  conductor at 21:33Z: anon no grant; authenticated INSERT and SELECT behind `is_allowed_reviewer`; the stamp functions
  service_role only; ids identity ALWAYS; 0 rows. Receipt `kb/receipts/migration_s643_first_light_marks_43310349633.json`;
  rollback `kb/migrations/2026-11-12_first_light_marks_rollback.sql`.
- **`cpl_memory`:** seven rows by `SkyLark (S643)` (six decisions and one pitfall), run about 22:10Z, all seven slugs
  returned (*as reported*). Receipt `kb/receipts/cpl_memory_s643_rows_2026-11-12.sql`, rollback in its header.

## Decisions to honor

**Sam's:** none new in S643. The standing ones are in the 643 handoff and `cpl_memory`.

**The conductor's** (each a `cpl_memory` row, a DECIDED line in its lane, and a card on [Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt), current, for Sam to revise):
1. First Light marks are spent only by a merged Apply (`d-first-light-marks-spent-by-merged-apply-s643`).
2. `first_light_marks` and `first_light_apply_requests` applied and verified (`d-first-light-marks-tables-applied-s643`).
3. The daily run rebuilds once when a clean rebase changes a build input (`d-daily-rebuild-on-changed-input-s643`).
4. Returned titles are an acknowledged list with a lint warning (`d-returned-titles-acknowledged-list-s643`).
5. Re-clustering: one district is one voice; cases chosen by reach (`d-reclustering-district-guard-s643`).
6. `docket-process` and `library-publish-now` share one queue check; the deploy waits for Sam
   (`d-docket-shared-queue-check-s643`).
7. The pitfall: a test that reads a held card from the live file fails `main` when a reviewer rules
   (`p-test-pinned-to-live-held-card-s643`).

## Waits for Sam (on [Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt), current, except #3159)

1. **"deploy"** for `docket-process` and `library-publish-now`: a production deploy is on the hold list and no standing
   authorization is recorded. `cpl-chat-deploy.yml`, `confirm=DEPLOY`, one function per dispatch; whether `_shared`
   bundles is unproven until the first deploy.
2. **Whether the repository lets GitHub Actions create pull requests.** Without it First Light's Apply cannot open its PR.
3. **#3159**, his gallery marks (still [Sheet 185](https://claude.ai/artifact/2PwwdsMScgRHsRirkZGDJc) card 8; 185 is otherwise superseded by Sheet 186).
4. **The six re-clustering cases** in `kb/status/mid_outcomes_compare_2026-11-12.md`: AJ 160; FIRE 130 X with FIRE
   M1274; REAL M1038 with M1040; MATH M1036 with M1044; MUS 130; BUSI M1228; and the Honors question (one M-ID, or two
   with a declared equivalence). Sheet 185 card 9's six are superseded.

By 22:35Z Sam had not said "deploy" and had not answered the Actions setting.

## Open work, in order (from the lanes' NEXT lines)

1. **`governance-team-enablement` NEXT (1):** the first real daily run after #3180 (*First things* 1).
2. **`sierra-page-redesign` NEXT:** read the first hourly run of `first-light-apply.yml` (its gate should exit in
   seconds with no pending request); the three views read `hero_photos.json`; the first real Apply once Sam confirms
   the setting.
3. **`commons` re-clustering NEXT:** price the model pass (a statewide read is outside the $40 limits; the price goes to
   Sam first); a potential-CPL column from an aggregate the runner reads; the Merced read for AGAB M1002 and Canyons
   inside the SLO $40.
4. **`cer-procedures` NEXT (5a) follow-ups:** the 38 official names (a web search each); Sam's read of the 30 Carpenters
   and 10 AUTO cards (`kb/status/cer_proposals_in_use_2026-11-12.md`); COBIx's open point (`cbeCard` reads ids only);
   confirm the next nightly rebuild of `kb/exhibits_review.json` runs clean.
5. **`program-requirements-harvest` NEXT:** (1) confirm display run 43310473532 committed Victor Valley's build; (2) Los
   Angeles City's `step=load` for the 22 absent records; (3) College of the Desert by `blocked_sources`; (4) the
   catalog-year rule, a design item; (5) and (6) wave 3 and De Anza's tail.
6. **`governance-team-enablement` NEXT (2) and (3):** which of the 21 workflows that push from their own groups should
   share one; the run-health file's scheduled writer. And the resolver test skips `.claude/worktrees/`.
7. **`commons` NEXT (1):** the ASE slice's public copy on the Credential Catalog; then CompTIA, AWS, NCCER, military.
8. **`cer-procedures` NEXT (1):** the apply side of read-time resolution; the Fact Sheet's categories in their own PR;
   (5)'s 148 ghosts with no recorded rename have no search alias.
9. Carried untouched: `cer-procedures` NEXT (6) to (12); `library` NEXT 0 (his List publicly and the funding dashboard
   link) and `iaca-mvpmcjyl`; `csm-workspace` NEXT 0 and 1 and `implementation-funding`'s NEXT (the Funding Follow-up Dashboard session's lanes);
   `sierra-retrieval-corpus` NEXT (#3185 worked it, not S643); #2894; CPLBrain#758.

## Not refreshed / left to the conductor

The documents worker did not make any Supabase call, publish anything, dispatch, merge or subscribe. Left to the
conductor: step 10's rows (already run; receipt copied unchanged); step 12's headline and harvest SQL and the routine's
`get_trigger`, so `kb/status/program-requirements.json` was not stamped; merging this PR (the conductor published
[Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) at about 22:35Z; its link is in `CLAUDE.md`'s standing-sheet line); confirming the display run and the 06:17Z daily run.
Refreshed: the six lane files, `conductor_mode.md`, `docs/governance_lessons.md`, one KB note (a third instance),
`docs/INDEX.md` and the catalog, the `exhibit` and `course` run logs, the docs audit and its `--apply` stamp, the vault
note, Sheet 186's source and the wiki touch, and `CLAUDE.md`'s standing-sheet line. Not touched: the pipeline view (no roadmap
row, auditor count or re-mint moved), `kb/README.md`, `README.md`, the `cr` and `subjects` run logs.
Wiki candidates, written in the vault's wiki touch: the First Light marks tables; the daily run's rebuild on a changed
input; the acknowledged returned titles.

## Patterns and lessons

- A test pinned to live data fails `main` when a person acts: pin the rule to a fixture (KB note
  `methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`, third instance).
- `supabase-migrate.yml` applies on the PUSH of a `.apply` change to a `claude/**` branch, never on merge; the
  receipt-commit head gets no `test` run. The worker stopped and asked; brief the next one so.
- `grep` on `tests/check_floor.json` prints a 10,000-token `_note`: always `cut -c1-200`.
- A stacked PR conflicts after its base squash-merges: merge `main`, take `main`'s copy of the base's files. Six
  first-round PRs each conflicted once on `tests/check_floor.json` and the dependency map.
- A completed worker's notification repeats its report. Deleting a check-in that covered two PRs dropped one; re-arm.
- The Agent tool's worktree isolation fails when the shell has reset to `/home/user`: `cd` into the tracker first.
- Disk: 4.4 GB a worktree; 6.2 GB free with four on 252 GB. Cap at four and remove each at merge.
- The container restarted at about 22:20Z and stopped the documents worker mid-checkpoint. Its unpushed commit and
  staged files survived in its worktree, and its vault commit had already been pushed. Push each repo as soon as it
  has a coherent commit.
- Worked: one combined finding list per PR after all readers report; a second reader briefed to refute the fixes.

## Let go

State at the checkpoint, which the sign-off turn confirms: subscriptions on #3178, #3179, #3180, #3181, #3182, #3161,
#3183 and #3184 dropped at merge; this checkpoint's PR stays subscribed until its merge. No
check-in pending. The artifact watch on Sheet 186 (arming at publish) is dropped at sign-off.

## After the checkpoint

- #3186 (this checkpoint) merged as `eb71c277` on a green `test`; CPLBrain#769 merged as `bd54c271`. CPLBrain#765
  is still open though its content merged through #769: close it with a pointer (SkyWren, or Sam).
- Sam merged #3159 himself at 22:28Z (`be7dcb88`), so Sheet 185 card 8 is settled and nothing on Sheet 185 waits.
- **Victor Valley's display run 43310473532** (step=display, extract=0) concluded FAILURE at 22:40Z after 69 minutes:
  `written 17573 of 17598; missing 25; errors 0`, exit 1, then its applied record was pushed (`6703f4ff`,
  `kb/receipts/program_requirement_records_display_2026-10-23_8fbbcfb7a9c0.applied_43310473532.json`). In
  `kb/_program_requirements_display_apply.py`, *missing* is a display statement whose key (college, control number)
  matches no row in `program_requirement_records`; nothing is written for it, and any missing key exits 1. The 25:
  Monterey Peninsula 03653, 22098 and 39361 (missing on every display run since 2026-11-09, rows the table no longer
  holds) and 22 Los Angeles City records: 02726, 02754, 02767, 10771, 19842, 21611, 21613, 24016, 33120, 38856, 38859,
  40139, 40644, 40888, 40889, 41000, 41527, 44022, 44705, 44946, 46374, 46526, the 22 its reread left absent, with
  IGETC (19842) and Cal-GETC (44946) among them. Victor Valley's four (38353, 38366, 38502, 38503) were read and
  written. The rows that hold the new build can be confirmed by one read:
  `select display->>'build' as build, count(*) from program_requirement_records where college = 'Victor Valley College'
  and control_number in ('38353','38366','38502','38503') group by 1;` (expect `8fbbcfb7a9c0`, 4).

Greetings, you are SkyWren (Session 644), see SkyLark's handoff — `docs/session_644_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_644_handoff.md) — let's keep rolling with our queue.
