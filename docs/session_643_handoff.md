---
title: "Session 643 handoff (from SkyKestrel, S642)"
created: 2026-11-12
updated: 2026-11-12
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyLark (Session 643)

Written by SkyKestrel (S642, the conductor; session `01Rvwe2XyXXS6P7ZCAqiG4va`) at a full checkpoint, about 15:00Z
2026-11-12. Sam opened S642 by hand at 12:24Z: conductor; read COBIx on #3153 and act; build, review and run the
ghost-row delete he answered on Sheet 183 card 6 ("delete", 12:17Z); then the queue. He then drove live, the Exhibits
side panel first. The S641 routine firing (`01Rvwe2VStEWM8QUudeduFpw`) was still open and held the harvest; S642 sent
it a coordination note at 12:33Z, had no reply, and left the harvest to it (it merged #3149, #3154, #3155, #3156).
Facts were read from `origin/main` (`bc43d130`), the receipts and the lane files; a fact marked *as reported* came from
the conductor's record and was not re-read.

## First things

1. **Is `main` green?** `get_check_runs` on `main`'s head, `test`. At this checkpoint the head was `bc43d130` (#3166)
   plus this checkpoint's PR. A red `test` after a daily commit is the first thing to fix.
2. **Read COBIx before any merge.** #3110, #3111, #2962 and #3153 to their last comment, and every issue or PR COBIx
   touched today (`commenter:cobi-cto updated:>=<today>`); then each PR's own comments, last page included, before
   merging it. S642 merged and ran #3158 without reading his 13:13Z note on that PR (*Patterns and lessons*).
3. Rule 8's `cpl_memory` query (tags `cer-procedures`, `sierra`, `first-light`, `commons`, `conductor`,
   `governance-team-enablement`, `program-requirements`), the three-repo check, the highest-numbered handoff,
   `list_sessions` if you hold it. `df -h /home/user` and `git worktree list`. Fetch branches by name with
   `--depth 50`, never a bare `git fetch origin`.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: merge #3165 on a green `test` once its thread
is read and COBIx's anon-key finding is fixed on the head; review and merge the classifier PR (Open work 2); then Open
work 4 onward. **Waits for Sam, never merged or run by a session:** #3159 (his gallery marks applied; his to review and
merge, COBIx's brief); the six re-clustering cases in `kb/status/mid_outcomes_compare_2026-11-12.md` (on #3165's
branch until it merges) want his rulings; the coverage notes to Malone and to MAP/ITPI (his send); analytics on public
pages (his go); anything on the `CLAUDE.md` hold list. #2894 is his. LATE: Open Asks Sheet 185 link and whether it is
current. Routine step 11: the next SLO college is the one `scripts/next_slo_colleges.py --next` names.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S642, and what worked* included; *Start* step 6 now
says to read every thread COBIx touched today and each PR's own comments before merging it.

## Conductor settings

Copied from `docs/reference/conductor_mode.md`, *Settings (Sam, 2026-11-11)*; Sam's latest change was 2026-11-11:

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx (Sam, 2026-11-11, relayed by COBIx on #3110;
  `cpl_memory` `sam-conductor-model-fable-5-2-2026-11-11`). The routine's form sets the model and ultracode; medium
  effort lives in its prompt.
- Ultracode on.
- The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`).
- A worker building anything that writes shared data or changes an apply runs at high effort: the conductor passes
  `effort: "high"` on that worker (Sam asked for it, which is what the Agent tool requires). Other workers run at the
  default.
- A review workflow uses at most 9 agents in all, readers and second readers together. Drop the second reader on
  minor findings first.
- Cost limits (relayed by COBIx on #3111, comment 6808460886; confirmed by the S639 relay ruling): $40 per college per
  run, on the estimate, for program-requirements extraction, and a separate $40 per college for SLOs, PLOs and course
  objectives. The limit is per run and never a remaining pot. Paid runs go through the conductor.

Every brief that adds a test file says: its floor goes in `tests/check_floor.json`, run the tests touching your files
plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, and let CI run the rest.

## Ledger (PR, branch, state) at sign-off

| PR or branch | State | Next |
|---|---|---|
| #3159 `claude/first-light-apply-marks-s642` | draft, head `27b5e0bb`, green `test` (*as reported*) | Sam's to review and merge |
| #3165 `claude/mid-reclustering-step1-s642` | open; a worker fixing COBIx's anon-key finding and merging `main` | LATE: merged or not, and its sha |
| `claude/cer-proposal-titles-in-use-s642` | classifier worker, no PR at 14:50Z | LATE: PR number and the Proposed-card counts |
| First Light phase B | design on #3153 (comment 6826461825), waiting for COBIx's read | build at a quiet firing |
| this checkpoint's PR `claude/checkpoint-s642` | open | merge on a green `test` |
| #3157, #3158, #3160, #3162, #3164, #3166 | merged (below) | done |
| #2894 `claude/cobix-inbox` | Sam's | untouched |
| `claude/harvest-victor-valley-s641`, `-desert-proof-s641`, `-pdf-baseline-s640` | S641's | per the harvest lane |

No S642 worker survives a new session. Brief a fresh one per open branch from its PR diff and this ledger.

## What shipped (S642), each squash-merged on a green `test`

- **#3157** `f754ef7d` Exhibits Review: *Course details* opens a card's aligned course in the side panel.
- **#3158** `58e6a41f` Sierra: a guarded, receipted delete of ghost rows in `chatbox_credentials`
  (`kb/_chatbox_ghost_delete.py` plan, apply, undo; `chatbox-ghost-delete.yml`, dispatch only); the sync adds retired
  names to successors' `raw_variants` and prints a ghost count. Four reviewers; two major faults fixed before merge.
- **#3164** `00399798` the `cer-procedures` lane: the delete DECIDED, NEXT (5) done, (5a) added.
- **#3162** `67cc1a2b` the First Light tab, phase A, read only: `#first-light` (paintings, photos, sierra), under
  Sierra & Team Tools; `library/photos/hero_photos.json` the one hero list, with a drift test.
- **#3160** `77fb96ae` Exhibits Review: the statewide or most-used title of the card's issuer named on the card; related
  titles changed from the side panel through the rename batch's own rows; Edit back clears both rows.
- **#3166** `bc43d130` the delete's follow-up (COBIx's two findings): an absent case-only successor holds; the plan
  refuses a before-row under the disclosure floor of 10.

## Live data written, each with its undo

- **`chatbox_credentials`:** 230 ghost rows deleted 13:46Z (plan 13:37Z: live 2,949, reference 2,719, ghosts 230,
  none held; live 2,719 after, by a fresh count in `applied.json`). Before it, a `credential-catalog-sync` run
  (dispatched 13:23Z, *as reported*) added retired names to successors. Receipt and undo:
  `kb/receipts/chatbox_ghost_delete_2026-11-12T13-37-23Z/` (`chatbox-ghost-delete.yml` `mode=undo`, `plan_dir` that
  directory).
- **`cobi_nav`:** one row (`tab`, `first-light`, audience `magic_link`, `menu-s642@bot`), 14:29Z (*as reported*).
  Receipt and rollback `kb/receipts/cobi_nav_first_light_magic_link_2026-11-12_s642.sql`.
- **`cpl_memory`:** five rows by `SkyKestrel (S642)`, `kb/receipts/cpl_memory_s642_rows_2026-11-12.sql` (the two
  re-clustering rows added at this checkpoint); the checkpoint's eleven,
  `kb/receipts/cpl_memory_s642_checkpoint_2026-11-12.sql`. Rollback in each header, by author and slug. LATE: whether
  the checkpoint's eleven slugs returned.

## Decisions to honor

**Sam's, verbatim** (each a `cpl_memory` row):
- "also think about how you could apply this to your intelligence moving forward...being able to suggest the best
  canonical title based on what's in use..." (`sam-classifier-suggests-title-in-use-2026-11-12`).
- "The MID title works well for cx because those are single course exhibits...but many if not most industry certs like
  Firefighter 1, POST, Real Estate Sales, Comptia Network+ have several CRs and need a non-course based canonical title
  that best aligns with the official name of the cert or license or training program..."
  (`sam-cert-title-official-name-not-mid-2026-11-12`).
- "no images on sierra for now so not impacted." (`sam-sierra-no-images-for-now-2026-11-12`).
- "I would like to be able to change all those needing it to firefighter 1 in the sidebar." and "yes and i need to be
  able to use this title on the sidebar candidates that need it:)" (`sam-side-panel-change-related-titles-2026-11-12`).
- Relayed by COBIx, #3111 comment 6825682304: "yes! make sure this work is in our moonshot plan and properly
  prioritized in it. ... let's get sky in the game on this" (`sam-outcomes-first-mid-clustering-in-plan-2026-11-12`);
  #2962 comment 6825683021: "yes, let's roll!" (`sam-mid-reclustering-step-1-go-2026-11-12`).
- Sheet 183 (12:17Z): cards 1 to 5 fine as proposed; card 6 "delete" (`d-sheet-183-replies-2026-11-12`).

**The conductor's seven** (each a `cpl_memory` row and a card on LATE: Sheet 185, for Sam to revise):
1. The sync carries retired names before any ghost delete; apply holds a ghost until its successors carry it
   (`d-ghost-delete-sync-carries-names-first-s642`).
2. The 230 deleted on a plan of 7.8%; receipt above (`d-ghost-delete-230-on-plan-s642`).
3. Side-panel folds reuse the rename batch's rows; no new row kind; Edit back clears both
   (`d-side-panel-folds-reuse-rename-rows-s642`).
4. The alignment line needs the same issuer; names none when several statewide titles compete without a 3x lead
   (`d-alignment-line-same-issuer-s642`).
5. The First Light tab shipped read-only first; editing designed on #3153 (`d-first-light-tab-read-only-first-s642`).
6. Re-clustering Step 1 under priorities 2, 3 and 7, agreed with COBIx; a model pass priced first
   (`d-reclustering-placement-s642`).
7. The delete receipt's small-cell floor is the ADR's k = 10 (`d-ghost-delete-small-cell-k10-s642`).

Standing: a relayed ruling is confirmed; the sheet carries decisions, never asks; the $40 limits above.

## Open work, in order (from the lanes' NEXT lines)

1. **`commons` re-clustering NEXT (1):** #3165 on a green `test`, thread read. Then (2) Sam's six rulings, (3) price
   the model pass.
2. **`cer-procedures` NEXT (5a), in build:** the classifier proposes a title in use (statewide, then most used, same
   issuer) and never an M-ID course title on an industry certification; its report counts the Proposed cards it
   changes; review, then merge.
3. **`sierra-page-redesign` NEXT:** (1) #3159 waits on Sam; (2) First Light phase B once COBIx reads the design, then
   the three pages read `hero_photos.json`.
4. **`program-requirements-harvest` NEXT** (S641's lane; re-read it, it still lists (1)): (1) is done on `main` (#3155
   `adeb83ac`, #3156 `04d692bf`); (2) Victor Valley: verify the four against `main`'s, reread, count, PR; (3) Los
   Angeles City's `step=load` call for the 22 absent records (18 pass), which would also insert IGETC (19842) and
   Cal-GETC (44946), both failing; (4) College of the Desert by `docs/reference/blocked_sources.md`; (5) fix
   `fetch_copy`'s docstring (contradicts Sam's #3096 ruling); (6) the catalog-year rule, a design item.
5. **`governance-team-enablement` NEXT:** (1) the first daily log carrying `Daily push conflicted`; (2) which build
   inputs force a rebuild on a clean rebase; (3) which of the 21 workflows that push from their own groups should
   share one; (4) the run-health file's scheduled writer; and the resolver test skips `.claude/worktrees/`.
6. **`commons` NEXT (1):** the ASE slice's public copy on the Credential Catalog; then CompTIA, AWS, NCCER, military.
7. **`cer-procedures` NEXT (1):** the apply side of read-time resolution (#3140's old-title count, its dashboard job,
   the newest-first undo guard); the Fact Sheet's categories in their own PR. (5) left: the 148 ghosts with no
   recorded rename have no search alias.
8. Carried untouched: `program-requirements-harvest` wave 3 (San Bernardino Valley, Grossmont, East Los Angeles) and
   De Anza's tail; `cer-procedures` NEXT (6) to (12); `library` NEXT 0 and `iaca-mvpmcjyl`; `csm-workspace` NEXT 0 and
   1; #2894; CPLBrain#758.

## Not refreshed at this checkpoint

The pipeline view (no roadmap row, auditor count or M-ID re-mint moved); `CLAUDE.md` (no lane's state changed; at its
budget); `kb/README.md` (no KB structure changed on `main`); the cr and subjects run logs (untouched). Left to the
conductor, who holds the tools: step 10's rows (drafted, not run), step 12's headline and harvest SQL and
`get_trigger`, the decision sheet build (Sheet 185), the vault session note (step 11) and the `--apply` stamp's commit
if it changes after this PR. Wiki candidates for `/wiki-ingest`: Sierra's ghost rows deleted; the First Light tab and
`hero_photos.json`; the classifier's title-in-use rule.

## Patterns and lessons

- Read a PR's own thread before merging it, and every thread COBIx touched today (`conductor_mode.md`, *Start* 6).
- A ledger kept at its threshold fails every PR that adds a test (KB note
  `docs/kb-notes/methodology-a-ledger-at-its-line-fails-every-pr-that-adds-a-test.md`; 376 of 625 floored, 60.2%).
- A plan receipt read by keys and counts, then a 12-row sample of the risky class, before an apply.
- One worker per concern, each opening its own PR; readers by dimension, one second reader on a delete; one
  `send_later` per wait; remove a worktree at merge.
- `scripts/check_generated.sh` local false alarms: *open-asks sheet coverage* (until the sheet is rebuilt) and
  *credential title resolver, one copy* (worker worktrees). `cpl_memory.summary` is capped at 400 characters.
  `actions_get get_workflow_run` by id beats `list_workflow_runs` and a log tail.

## Let go

At 14:50Z S642 held PR subscriptions on #3159 and #3165 and one check-in, `trig_01AwBesBKkTmv3crqhnipw56` (14:52Z,
merge #3165); the subscriptions on #3157, #3158, #3160, #3162, #3164 and #3166 ended at merge. No artifact watch.
LATE: the sign-off turn's unsubscribes and the check-in's deletion, each confirmed.

Greetings, you are SkyLark (Session 643), see SkyKestrel's handoff — `docs/session_643_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_643_handoff.md) — let's keep rolling with our queue.
