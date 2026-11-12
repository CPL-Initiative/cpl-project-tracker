---
title: "Session 642 handoff (from SkyOtter, S641)"
created: 2026-11-12
updated: 2026-11-12
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyKestrel (Session 642)

Written by SkyOtter (S641, two firings; the second was the conductor) at a full checkpoint, about 12:10Z 2026-11-12.
**The first firing** (the 06:12Z routine firing, session `01Rvwe2YRHaDAm69etRjXcPp`) merged four PRs and applied ASE
plan phase 3, then stopped at 09:15Z with no handoff, no `cpl_memory` rows and no session note; its own account is its
note on #3110 (07:48Z, comment 6817896225) and the lane DECIDED lines it committed. **The second firing** (10:12Z,
session `01Rvwe2VStEWM8QUudeduFpw`, the conductor) found every channel silent for 87 minutes, took the queue at 10:42Z
under draft PR #3149 and wrote this handoff for both. Facts were read from `origin/main` (`d02a3f86`), the receipts and
the lane files; a fact marked *as reported* came from a worker and was not re-read.

## First: is `main` green?

Confirm it first: `get_check_runs` on `main`'s head, `test`. The conductor dispatched `daily-dashboard.yml` on `main`
at about 11:46Z as #3150's proof run. LATE: the proof run's result (run id, whether it committed, and whether its log
shows `Daily push conflicted`). Then confirm the next scheduled rung (12:17Z) committed and `test` is green after it.
A red `test` after a daily commit is the first thing to fix; `git revert` of #3150 returns the old workflow.

## If you are the scheduled session (the CPL Queue routine)

This checkpoint is on #3149 (`claude/practical-meitner-vwvfnj`), whose body declared the whole queue as S641's scope.
LATE: whether the conductor merged #3149; if it did not, merge it on a green `test` once no dashboard or apply run is in
flight, before other work. **Safe to run unattended, in this order,** each under Rule 10 and the playbook: Open work 1
to 8. **Waits for Sam:** the guarded delete of Sierra's ghost rows (Sheet 184 card 11, *Waits for my send or go*,
restated from [Sheet 183](https://claude.ai/artifact/TPL2JPJk4uoiAxeQzFYXuo) card 6; read both sheets' `replies`
stores first); the coverage notes to Malone and to MAP/ITPI (his send); analytics on public pages (his go); anything on
the `CLAUDE.md` hold list. LATE: Sheet 184's published link. Routine step 11: today's full SLO read was Shasta's
(#3102), so the next college is the one `scripts/next_slo_colleges.py --next` names.

## At the start

Read `cpl_memory` first (Rule 8; tags `program-requirements`, `pdf-reader`, `cer-procedures`, `governance-team-enablement`,
`conductor`). Check all three repos are attached and that this is the highest-numbered handoff. `list_sessions` if you
hold it; S641's second firing did not, and read the open PRs, `main`'s commits, the runs, #3110 and `cpl_memory`
instead (`docs/reference/scheduled_sessions.md`, *A session that stopped without a handoff*). `df -h /home/user` and
`git worktree list`. Fetch branches by name with `--depth 50`, never a bare `git fetch origin` (302 branches, over a
gigabyte).

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S641, and what worked* included.

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
| #3149 `claude/practical-meitner-vwvfnj` | S641's PR, this checkpoint | LATE: merged or open |
| #3152 the ASE student-facing slice | LATE: merged (sha) or open | merge on a green `test` if open |
| `claude/harvest-american-river-s641` (no PR) | paid read dispatched about 11:47Z | Open work 1 |
| `claude/harvest-la-city-s641` (no PR) | paid read dispatched about 11:47Z | Open work 1 |
| `claude/harvest-victor-valley-s641` (no PR) | capture with `force` dispatched 11:29Z; paid step follows | Open work 1 |
| `claude/harvest-desert-proof-s641` (no PR) | College of the Desert capture dispatched about 11:46Z | Open work 2 |
| `claude/harvest-pdf-baseline-s640` (no PR) | Desert's baseline filed `919373d6` | Sam or GitHub deletes it after Open work 2 |
| #2894 `claude/cobix-inbox` | Sam's to review | untouched |
| CPLBrain `claude/determined-mayer-vwvfnj` (no PR) | the vault source fix `0e4b1091`, Sheet 184's source and build, the session note | a PR when Sam wants one |

LATE: each paid read's result (run id, records filed, actual cost) and the Desert capture's result.
No S641 worker survives a new session. Brief a fresh one per open branch from its run and the lane.

## What shipped (S641), each squash-merged on a green `test`

**The first firing:**
- **#3146** UI pass: Sierra, light and dark.
- **#3136** Rio Hondo, `b7572942`: Cal-GETC's 34 from the printed areas; 276 of 288 live.
- **#3148** credential titles resolved at read time, `49f5e4ed`; retired names as search aliases; #3140 closed.
- **#3147** apply workflows, `50b4c758`: the daily's group off its stand-down rungs, plan names fail fast, the
  crosswalk test in CI.

**The second firing (the conductor):**
- **#3145** De Anza's SLO trial, `fc293a40`: 12 pages, 11 empty; held.
- **#3135** the PDF reader, `1ebee603`: every rule checked by mutation (*as reported*), one new test, the `kept_passing`
  fix, the 2a narrowing taken back out; 426 checks (*as reported*).
- **#3151** Library, `fb2d35b3`: DSP Credit Starting Points Version 3 public; the 25px target floor.
- **#3102** Shasta SLO, `17d5ac54`: 775 of 775 outlines, 1,549 rows loaded.
- **#3150** the daily run rebuilds a lost push inside the job, `d02a3f86`: `scripts/daily_build.sh`, 88 checks
  (*as reported*); five readers over two rounds.

## Live data written, each with its undo

- **ASE plan phase 3** (first firing, 06:30Z): five `kb_curation` `unified_title_assignment` rows under `cer-s638@bot`,
  read back 5; receipt `kb/cer_decisions_out/2026-11-11-3/applied_2026-11-12T06-30-30Z.json` (`8fb7712d`); undo by
  that cohort's rows in the receipt.
- **`course_outcomes`**: Shasta's 1,549 rows (ids 16891 to 18439, counted live); undo is the receipt's delete by id,
  `kb/receipts/course_outcomes_shasta_43203623517.json`.
- **`cpl_library` `dsp-credit-starting-points`**: guarded UPDATE at 11:16:56Z (version `3`, a fourth `versions` entry);
  receipt and rollback `kb/receipts/cpl_library_dsp_v3_public_s641_2026-11-12.sql`.
- **`program_source_registry` College of the Desert**: `catalog.timeout_s` 900 to 2400 (md5-guarded); receipt and
  rollback `kb/receipts/program_source_procedure_desert_timeout_s641_2026-11-12.sql`.
- **`cpl_memory`**: thirteen rows, `kb/receipts/cpl_memory_s641_checkpoint_2026-11-12.sql`; its ROLLBACK comment
  deletes them by author. LATE: whether all thirteen slugs returned.
- **Paid reads**: LATE: each run's actual cost and the records it filed (none loads before a receipt names its keys).

## Decisions to honor

Each is a `cpl_memory` row and a card on Open Asks Sheet 184 for Sam to revise (LATE: its link):
- **The second firing:** `d-stopped-session-queue-takeover-s641`, `d-pdf-reader-equal-coverage-holds-s641`,
  `d-kept-passing-protects-full-pass-s641`, `d-daily-rebuild-one-build-script-s641`, `d-dsp-v3-public-25px-floor-s641`,
  `d-de-anza-slo-held-s641`, `d-desert-fetch-limit-2400-s641`, `d-paid-reads-arc-lacc-s641`.
- **The first firing:** `d-credential-title-read-time-resolution-s641` (D1 to D3), `d-lost-push-rebuilt-in-job-s641`,
  `d-cer-procedures-own-group-s641`.
- **Sam's:** his Revise and remediate on `dsp-credit-starting-points` (2026-11-11 15:30Z, approved 15:31Z); his go on
  the ASE slice (Sheet 181 card 10, "Go when built"); the $40 limits above. Sheet 183's cards 1 to 5 stay answerable on
  183. Standing from S638 to S640: a relayed ruling is confirmed; the sheet carries decisions, never asks.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest` NEXT (1):** the three college branches in flight. For each: read the run's result,
   then load or reread on its branch, count live, merge `main`, merge on a green `test`.
2. **`program-requirements-harvest` NEXT (2):** College of the Desert: compare the capture with the baseline
   (`919373d6`) and file its row in the lessons' proof table; then the baseline branch can go; then the paid read.
3. **`governance-team-enablement` NEXT (1):** read #3150's proof run and the first daily log carrying `Daily push
   conflicted`: the rebuild's minutes, and whether its push landed.
4. **`commons` NEXT (1):** if #3152 is open, merge `main` (expect `kb/dependency_map.json`), rebuild it, merge on a
   green `test`. Then the slice's next parts: the Request CPL Review state (a table first, through Rule 10 a3), the
   public copy, the versioned signal list.
5. **`cer-procedures` NEXT (1):** the apply side of read-time resolution: #3140's old-title count as a report, its
   dashboard job and newest-first undo guard; the Fact Sheet's categories in their own PR.
6. **`program-requirements-harvest` NEXT (3):** fix `fetch_copy`'s docstring (it contradicts Sam's #3096 ruling).
7. **`governance-team-enablement` NEXT (2) and (3):** a rule for which build inputs force a rebuild on a clean rebase;
   which of the 21 workflows that push from their own groups should share one.
8. **`program-requirements-harvest` NEXT (5) and (6):** San Bernardino Valley, Grossmont, East Los Angeles
   (`docs/harvest_wave3_diagnoses_s639.md`); then De Anza's tail and the display build.
9. **Waits for Sam:** Sierra's ghost rows (`cer-procedures` NEXT (5), Sheet 184 card 11); the coverage notes; analytics.
10. Carried untouched: `program-requirements-harvest` NEXT (4) (the catalog-year rule, a design item);
    `cer-procedures` NEXT (6) to (12); `governance-team-enablement` NEXT (4); `library` NEXT 0 and `iaca-mvpmcjyl`;
    `csm-workspace` NEXT 0 and 1; #2894; CPLBrain#758.

## Not refreshed at this checkpoint

The pipeline view (no roadmap row, auditor count or M-ID re-mint moved); `README.md` (the Commons tab gained the ASE
view, and README lists no Commons views) and `kb/README.md` (no KB structure changed); `CLAUDE.md` (no lane's state
changed); the course, cr and subjects run logs (untouched). Step 10's rows and step 12's headline, harvest measure and
`next_run` are the conductor's (Supabase and `get_trigger`). LATE: whether the conductor ran them and the headline pair.

## Patterns that worked, and safety lessons

- A stopped session's queue: read every channel, watch the remote, open a draft PR before any other write.
- Replace a design after one round when it imitates something it should call (#3150; KB note
  `docs/kb-notes/methodology-a-rebuild-runs-the-same-build-script.md`).
- One second reader on a worker's change beyond its brief (the 2a narrowing would have paid every run).
- A target at exactly a size threshold fails at fractional zoom (KB note
  `docs/kb-notes/methodology-a-target-at-exactly-the-minimum-fails-at-fractional-zoom.md`).
- Read a receipt's keys and counts, never its values. `get_check_runs` with `perPage` 1 shows `test` first only once it
  has finished. Merge `kb/dependency_map.json` PRs one at a time. Read `date -u` before writing a time.
- `git add`, then `CPL_VAULT_ROOT=/home/user/CPLBrain bash scripts/check_generated.sh`, read its last line, commit.
  Never an empty commit. `cpl_memory.summary` is capped at 400 characters. `CLAUDE.md` is at its budget.

## Let go

LATE: the PR subscriptions S641 dropped at sign-off (#3149, #3152 and any other), the watch publishing Sheet 184
created, and any scheduled check-in deleted, each named. The worktrees under `/home/user/wt/` are lost with the
container; every branch is pushed.

Greetings, you are SkyKestrel (Session 642), see SkyOtter's handoff — `docs/session_642_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_642_handoff.md) — let's keep rolling with our queue.
