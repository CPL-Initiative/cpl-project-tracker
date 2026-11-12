---
title: "Session 641 handoff (from SkyHeron, S640)"
created: 2026-11-12
updated: 2026-11-12
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyOtter (Session 641)

Written by SkyHeron (S640, the conductor) at a full checkpoint, about 05:40Z 2026-11-12. Sam opened S640 by hand from
iOS at 03:44Z with handoff 640's line and the harvest side handoff; he typed nothing after, and his two rulings
reached the session relayed by COBIx (`cobi-cto`) on #3110. SkyHeron conducted both lanes, so **this numbered handoff
carries the harvest lane again; `docs/harvest_side_handoff_s639.md` is history.** Facts were read from `origin/main`
(`138779a4`), the receipts and the lane files; a fact marked *as reported* came from a worker and was not re-read.

## First: is `main` green?

[TO FILL: `test` on `main`'s head at sign-off.] One known red outside every workflow: `tests/partner_crosswalk_test.py`
check 4 fails on `main` on five titles and nothing runs it (Open work 4). The daily run committed at 05:24Z
(`138779a4`) and carried the standards titles onto the published files.

## If you are the scheduled session (the CPL Queue routine)

Draft #3139 declared the whole queue as S640's scope, so firings stood down while it was live. [TO FILL: #3139 merged
at …, or still open.] **Safe to run unattended, in this order,** each under Rule 10 and the playbook: Open work 1 to
4 and 6 to 8. **Waits for Sam:** the guarded delete of Sierra's ghost rows (Sheet 182, *Waits for my send or go*);
the coverage notes to Malone and to MAP/ITPI (his send) and analytics on public pages (his go), both as handoff 640
listed them; anything on the `CLAUDE.md` hold list. Routine step 11 reads Shasta's SLO trial (#3102, run 43157883293
filed part 1 at 05:06Z): half or more parsed moves Shasta to read.

## At the start

Read `cpl_memory` first (Rule 8; tags `cer-procedures`, `exhibits`, `program-requirements`, `conductor`). Check all
three repos are attached and that this is the highest-numbered handoff. `list_sessions`, then read #3110 to its last
comment: COBIx had not answered the conductor's 04:44Z note by sign-off [TO FILL: COBIx's reply, if any].
`df -h /home/user` (5.2 GB free at 05:20Z) and `git worktree list`.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S640, and what worked* included.

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

## Ledger (PR, branch, state) at sign-off

| PR or branch | State | Next |
|---|---|---|
| #3139 `claude/sweet-albattani-pgj5y3` | S640's PR, this checkpoint | [TO FILL] |
| #3140 `claude/rename-apply-repoint-s640` | head `a633abd0`, `lints` red; round three: 2 standing (an out-of-order undo strands values; a re-point only in `kb_curation` writes no receipt) and 6 others; round four with the worker [TO FILL] | a last narrow review, merge |
| #3143 `claude/standards-folds-plan-2-s640` | draft, head `b7447569`, review running [TO FILL] | Open work 2 |
| #3135 `claude/harvest-pdf-reader-s639` | head `b3675082`, 415 checks pass (*as reported*); the five earlier proofs are stale | Open work 6 |
| `claude/harvest-pdf-baseline-s640` (no PR) | `main` at `dd50e246`, for same-day baselines: Sacramento City filed (43159025892), College of the Desert dispatched 05:17Z | American River, Los Angeles Valley; delete when #3135 merges |
| #3136 `claude/harvest-rio-hondo-s639` | reconcile 43154073220 capturing at 05:16Z; live 245 of 288 [TO FILL] | Open work 5 |
| #3102 `claude/slo-shasta` | the trial above | routine step 11 |
| #2894 `claude/cobix-inbox` | Sam's to review | untouched |
| CPLBrain `claude/sweet-albattani-pgj5y3` (no PR) | S640's session note, wiki touch, braindump, Sheet 182's source | a PR when Sam wants one |

No S640 worker survives a new session. Brief a fresh one per open branch from its PR.

## What shipped (S640), each squash-merged on a green `test`

- **#3131** Victor Valley, `4214bea2`: noncredit hours, `meets_top`, Cal-GETC 34 to 42, EMS tabs; 136 of 168 live.
- **#3137** West Valley, `a664b105`: Cal-GETC 34 from printed areas; 120 of 133 live.
- **#3141** the credential watch for 2026-11-12, `464345a5`: no catalog change among 7,726; skills on 20 credentials
  (rows 177 to 197); Snowflake unreadable; no material event.
- **#3138** Berkeley City, `dd50e246`: 18 GE units and the electives rule; 48 of 89 live.
- **#3142** the standards plan, `cc327236`: three renames and one merge, then applied (below).

## Live data written, each with its undo

- **The standards apply** (`cred-rename-apply.yml` `only_plan=standards-2026-11-12`, 05:12Z; `99d4ff32`; receipt
  `kb/cred_rename_out/2026-11-12-2/`): 3 renames, 1 merge; `kb_curation` 13 steps, 0 failed (7 of Sam's fulfilled
  approval rows deleted with their before-rows kept, 2 bot subject rows superseded, 4 moved), one `issuer_resolution`
  insert (`cred-fold-s638@bot`). Count at 05:16:42Z: 0 on the old keys, 5 on the targets, the 6 held rows untouched.
  Undo: `kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-12-2` (`--supabase-plan`).
- **Rereads:** West Valley 43146197347 (34 replaced) and Berkeley City 43147379414 (16 replaced); each receipt
  under `kb/receipts/program_requirement_records_college_reread_*` holds the values before.
- **`cpl_memory`:** Sam's two relayed rulings (`kb/receipts/cpl_memory_s640_relayed_rulings_2026-11-12.sql`) and
  this checkpoint's rows (`kb/receipts/cpl_memory_s640_checkpoint_2026-11-12.sql` [TO FILL: slugs returned]); each
  file's ROLLBACK comment deletes its author's rows.

## Decisions to honor

- **Sam, relayed by COBIx (#3110, comment 6813256997):** the conductor model and settings above
  (`sam-conductor-model-fable-5-2-2026-11-11`); "Yes, pick them up tonight." for the harvest's Next 1 to 4
  (`sam-harvest-next-steps-tonight-2026-11-11`).
- **The S640 conductor's, each on Open Asks Sheet 182 for Sam to revise** [TO FILL: Sheet 182's link]:
  `d-standards-plan-four-entries-s640`, `d-rename-apply-drops-fulfilled-approvals-s640`,
  `d-standards-second-plan-s640`, `d-rename-apply-one-repoint-path-s640` (pending until #3140 merges),
  `d-pdf-reader-design-calls-s640`. The lanes carry each as a DECIDED line.
- Standing from S638 and S639: a relayed ruling is confirmed; the sheet carries decisions, never asks; Sheet 181's
  rulings (`d-sheet-181-replies-2026-11-11`); every exhibit gets a Common SUBJ; a web search on an anomaly before an ask.

## Open work, in order (from the lanes' NEXT lines)

1. **`cer-procedures`:** #3140, a last narrow review of round four, then merge; the first apply after it re-points
   what the 2026-10-01, 2026-11-06, 2026-11-12 and 2026-11-12-2 applies left (dry run: 33 changes, 13 held).
2. **`cer-procedures`:** #3143, merge on a green `test`, a fresh live read, `kb/_cred_rename_dryrun.py --only-plan
   standards-2-2026-11-12` locally, dispatch `only_plan=standards-2-2026-11-12`, count, daily run. Read where the
   fold builder stamps `decided_at` first: the first apply's `issuer_resolution` row carries 01:28:50Z.
3. **`cer-procedures`:** ASE plan phase 3 (`kb/cer_decisions_out/2026-11-11-3`): re-read (20:15Z Nov 11 is stale),
   `dry-run`, read the summary line, `commit`.
4. **`cer-procedures`:** the retired names as aliases (`kb/credential_aliases.py`), with the five titles
   `tests/partner_crosswalk_test.py` check 4 fails on.
5. **`program-requirements-harvest`:** Rio Hondo: when 43154073220 files, merge `main`, measure against `main`, check
   the capture answered its pages, reread, count, merge.
6. **`program-requirements-harvest`:** #3135: fresh capture-only reads on its branch (`step=read`, `extract=0`, force
   empty), one at a time, for American River, Los Angeles City, Sacramento City, Los Angeles Valley and College of the
   Desert, against the same-day baselines; a review; merge. Then the paid re-extractions (American River, Los Angeles
   City's records read past their heading, Victor Valley's four EMS certificates), each capture-priced, $40 a college.
7. **`governance-team-enablement`:** COBIx's findings 7 to 9 as one workflow PR with S639's lessons 1, 2 and 4, and a
   workflow that runs `tests/partner_crosswalk_test.py`.
8. **`commons`:** the ASE student-facing slice (Sam's go, Sheet 181 card 10).
9. **`program-requirements-harvest`:** San Bernardino Valley, Grossmont, East Los Angeles
   (`docs/harvest_wave3_diagnoses_s639.md`); De Anza's tail and the display build.
10. **Waits for Sam:** Sierra's ghost rows (`cer-procedures` NEXT (5), Sheet 182); the coverage notes; analytics.
11. Carried untouched: `cer-procedures` NEXT (6) to (12); two Library revise requests (`dsp-credit-starting-points`,
    `iaca-mvpmcjyl`); `library` NEXT 0; `csm-workspace` NEXT 0 and 1; #2894; CPLBrain#758.

## Not refreshed at this checkpoint

The pipeline view (it tracks M-ID identity work; no roadmap row, auditor count or M-ID re-mint moved); `README.md`
and `kb/README.md` (no surface or KB structure changed); `CLAUDE.md` (no lane's state changed); the course, cr and
subjects run logs (untouched). [TO FILL: step 10's rows and step 12's headline, harvest measure and trigger read, as
the conductor ran them.]

## Patterns that worked, and safety lessons

- A review's context in a scratchpad file with a one-line `context` argument; `get_check_runs` with `perPage` 1 or 2;
  `list_workflow_runs` filtered to `status: in_progress, branch: main` before any merge touching generated `kb/` files.
- Readers by dimension, then a second reader on each finding.
- Read `date -u` before writing a time. Check a capture's pages answered before reading its measure. A proof needs a
  same-day baseline (`docs/kb-notes/methodology-a-proof-run-needs-a-same-day-baseline.md`). A new write goes inside
  the existing apply and its receipt.
- `git add`, then `CPL_VAULT_ROOT=/home/user/CPLBrain bash scripts/check_generated.sh`, read its last line, commit.
  Never an empty commit. `cpl_memory.summary` is capped at 400 characters. `CLAUDE.md` is at its budget.

## Let go

At sign-off S640 drops its PR subscriptions (#3139, #3140, #3143; #3141 and #3142 ended on merge), its scheduled
check-in (05:35Z), and any artifact watch on Sheet 182, and names each in its last message. The worktrees under
`/home/user/wt/` (`harvest`, `rename-apply`, `standards-plan`, `pdf-reader`) are lost with the container; every
branch is pushed.

Greetings, you are SkyOtter (Session 641), see SkyHeron's handoff — `docs/session_641_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_641_handoff.md) — let's keep rolling with our queue.
