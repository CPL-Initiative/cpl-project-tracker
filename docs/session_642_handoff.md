---
title: "Session 642 handoff (from SkyOtter, S641)"
created: 2026-11-12
updated: 2026-11-12
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_645_handoff.md
---

# You are SkyKestrel (Session 642)

**S642 is already running.** Sam opened SkyKestrel by hand at 12:24Z as the conductor (session
`01Rvwe2XyXXS6P7ZCAqiG4va`), and it sent a coordination note at 12:33Z; S641 had no `send_message` and replied on #3149
(comment 6823731014). Agreed, one writer per file: S642 holds `exhibits.js` (a Course details control,
`claude/exhibits-course-details-s642`), the guarded delete of Sierra's ghost rows (`claude/chatbox-ghost-delete-s642`;
Sam answered Sheet 183 card 6 "delete" at 12:17Z, `d-sheet-183-replies-2026-11-12`), COBIx's #3153 First Light marks
(`claude/first-light-apply-marks-s642`), and the `cer-procedures` lane's Held for Sam line and NEXT 5 once #3149 merges.
S642 left the harvest lane to S641 until its sign-off, so the harvest items below are handed to S642 or the next
firing. This file stays the record of S641.

Written by SkyOtter (S641, two firings; the second was the conductor) at a full checkpoint, about 12:10Z 2026-11-12.
**The first firing** (the 06:12Z routine firing, session `01Rvwe2YRHaDAm69etRjXcPp`) merged four PRs and applied ASE
plan phase 3, then stopped at 09:15Z with no handoff, no `cpl_memory` rows and no session note; its own account is its
note on #3110 (07:48Z, comment 6817896225) and the lane DECIDED lines it committed. **The second firing** (10:12Z,
session `01Rvwe2VStEWM8QUudeduFpw`, the conductor) found every channel silent for 87 minutes, took the queue at 10:42Z
under draft PR #3149 and wrote this handoff for both. Facts were read from `origin/main` (`d02a3f86`), the receipts and
the lane files; a fact marked *as reported* came from a worker and was not re-read.

## First: is `main` green?

Confirm it first: `get_check_runs` on `main`'s head, `test`. #3150's proof run (`daily-dashboard.yml` dispatched on
`main` after the merge) committed `f01d4055` at 11:54Z, eight minutes later: the one-script build ran on a real run and
published. Its conflict path has run only in the test's scratch repo. `main` since holds #3152 (`ed886d36`) and #3154
(`68ab33eb`); confirm `test` is green on the head and that the next scheduled rung committed.
A red `test` after a daily commit is the first thing to fix; `git revert` of #3150 returns the old workflow.

## If you are the scheduled session (the CPL Queue routine)

This checkpoint is on #3149 (`claude/practical-meitner-vwvfnj`), whose body declared the whole queue as S641's scope.
The conductor merges it on a green `test` at sign-off; if it is still open, merge it that way once no dashboard or apply
run is in flight, before other work. **Safe to run unattended, in this order,** each under Rule 10 and the playbook: Open work 1
to 8. **Sam answered** the guarded delete of Sierra's ghost rows on
[Sheet 183](https://claude.ai/artifact/TPL2JPJk4uoiAxeQzFYXuo) card 6 ("delete", 12:17Z); S642 carries it, and Sheet
184's card 11 is answered there. **Waits for Sam:** the coverage notes to Malone and to MAP/ITPI (his send); analytics on public pages (his go); anything on
the `CLAUDE.md` hold list. [Open Asks Sheet 184](https://claude.ai/artifact/TEccSGNBCjPXNStdpE6qFy) is current (its store empty at 12:12Z). Routine step 11: today's full SLO read was Shasta's
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
| #3149 `claude/practical-meitner-vwvfnj` | S641's PR, this checkpoint | merge on a green `test` |
| #3156 American River (`claude/harvest-american-river-s641`) | open; paid read, reread and load done on the branch; a worker getting `test` green | Open work 1 |
| #3155 Los Angeles City (`claude/harvest-la-city-s641`) | open; `test` failed on its first head, a worker fixing it | Open work 1 |
| `claude/harvest-victor-valley-s641` (no PR) | paid read dispatched about 12:10Z, not filed at 12:34Z | Open work 2 |
| `claude/harvest-desert-proof-s641` (no PR) | the failed capture's preview | can be deleted |
| `claude/harvest-pdf-baseline-s640` (no PR) | no longer needed | can be deleted (Sam or GitHub) |
| #3152, #3154, #3150 | merged (`ed886d36`, `68ab33eb`, `d02a3f86`) | done |
| #2894 `claude/cobix-inbox` | Sam's to review | untouched |
| CPLBrain `claude/determined-mayer-vwvfnj` (no PR) | the vault source fix `0e4b1091`, Sheet 184's source and build, the session note | needs a PR |

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
  (*as reported*); five readers over two rounds; proof run committed `f01d4055`.
- **#3152** the ASE student-facing slice, `ed886d36`: `#commons/ase`, read-only; its test floored in
  `tests/check_floor.json`.
- **#3154** `kept_passing` keeps a passing record against a read that covers less, `68ab33eb`; 434 reader checks
  (*as reported*), found by the paid-read verifier on American River 11566.

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
  deletes them by author. All thirteen slugs returned; the file matches what ran.
- **American River** (on its branch, #3156): paid run 43212067552, $3.13; reread 43216104949 (16 replaced) and load
  43217624238 (8 inserted), each receipt on the branch holding its rollback. Live 292 of 327 passing at 12:24Z.
- **Los Angeles City** (on its branch, #3155): paid run 43212072618, $11.38; reread 43216110417 (117 replaced, 22
  absent), receipt on the branch. Live 203 of 223 at 12:24Z.

## Decisions to honor

Each is a `cpl_memory` row and a card on [Open Asks Sheet 184](https://claude.ai/artifact/TEccSGNBCjPXNStdpE6qFy) for Sam to revise:
- **The second firing:** `d-stopped-session-queue-takeover-s641`, `d-pdf-reader-equal-coverage-holds-s641`,
  `d-kept-passing-protects-full-pass-s641`, `d-daily-rebuild-one-build-script-s641`, `d-dsp-v3-public-25px-floor-s641`,
  `d-de-anza-slo-held-s641`, `d-desert-fetch-limit-2400-s641`, `d-paid-reads-arc-lacc-s641`; and the lane's DECIDED
  line with #3154: a passing record is replaced only by a read that passes at least as well and covers at least as much.
- **The first firing:** `d-credential-title-read-time-resolution-s641` (D1 to D3), `d-lost-push-rebuilt-in-job-s641`,
  `d-cer-procedures-own-group-s641`.
- **Sam's:** his Revise and remediate on `dsp-credit-starting-points` (2026-11-11 15:30Z, approved 15:31Z); his go on
  the ASE slice (Sheet 181 card 10, "Go when built"); the $40 limits above. Sheet 183's cards 1 to 5 stay answerable on
  183. Standing from S638 to S640: a relayed ruling is confirmed; the sheet carries decisions, never asks.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest` NEXT (1):** merge #3155 (Los Angeles City) and #3156 (American River) on a green
   `test`.
2. **`program-requirements-harvest` NEXT (2):** Victor Valley's paid read (38353, 38366, 38502, 38503): verify the four
   against `main`'s records, reread, count (136 of 168 before), open its PR.
3. **`program-requirements-harvest` NEXT (3):** Los Angeles City's load call: `step=load` for the 22 absent records
   (18 pass) would also insert IGETC (19842) and Cal-GETC (44946) as program records, both failing.
4. **`program-requirements-harvest` NEXT (4):** College of the Desert by `docs/reference/blocked_sources.md` (other
   hosts, the publisher's copy, an archive copy, then a comment that mentions `cobi-cto`); three captures failed, the
   last unreachable after 1,016 s. Open, not ruled: whether a larger arithmetic fill at equal coverage
   keeps the filed record.
5. **`governance-team-enablement` NEXT (1):** the first daily log carrying `Daily push conflicted`: the rebuild's
   minutes, and whether its push landed (the proof run published; the conflict path has not run for real).
6. **`commons` NEXT (1):** the ASE slice's public copy on the Credential Catalog; then CompTIA, the American Welding
   Society, NCCER, military.
7. **`cer-procedures` NEXT (1):** the apply side of read-time resolution: #3140's old-title count as a report, its
   dashboard job and newest-first undo guard; the Fact Sheet's categories in their own PR.
8. **`program-requirements-harvest` NEXT (5):** fix `fetch_copy`'s docstring (it contradicts Sam's #3096 ruling).
9. **`governance-team-enablement` NEXT (2) and (3):** a rule for which build inputs force a rebuild on a clean rebase;
   which of the 21 workflows that push from their own groups should share one.
10. **`program-requirements-harvest` NEXT (7) and (8):** San Bernardino Valley, Grossmont, East Los Angeles
   (`docs/harvest_wave3_diagnoses_s639.md`); then De Anza's tail and the display build.
11. **Held by S642:** Sierra's ghost rows (answered "delete"), `exhibits.js`, #3153. **Waits for Sam:** the coverage
   notes; analytics.
12. Carried untouched: `program-requirements-harvest` NEXT (6) (the catalog-year rule, a design item);
    `cer-procedures` NEXT (6) to (12); `governance-team-enablement` NEXT (4); `library` NEXT 0 and `iaca-mvpmcjyl`;
    `csm-workspace` NEXT 0 and 1; #2894; CPLBrain#758.

## Not refreshed at this checkpoint

The pipeline view (no roadmap row, auditor count or M-ID re-mint moved); `README.md` (the Commons tab gained the ASE
view, and README lists no Commons views) and `kb/README.md` (no KB structure changed); `CLAUDE.md` (no lane's state
changed); the course, cr and subjects run logs (untouched). Step 10's rows and step 12's headline, harvest measure and
`next_run` ran: headline at 12:34:44Z 20,282 active programs, 13,963 complete, 114 colleges; the harvest measure; the
next firing 13:12Z by the routine's schedule (`get_trigger` was not among the tools).

## Patterns that worked, and safety lessons

- A stopped session's queue: read every channel, watch the remote, open a draft PR before any other write.
- Replace a design after one round when it imitates something it should call (#3150; KB note
  `docs/kb-notes/methodology-a-rebuild-runs-the-same-build-script.md`).
- One second reader on a worker's change beyond its brief (the 2a narrowing would have paid every run).
- A verifier compares a paid read's records with `main`'s before the load (it caught 11566). A new test file needs
  its floor in `tests/check_floor.json`.
- A target at exactly a size threshold fails at fractional zoom (KB note
  `docs/kb-notes/methodology-a-target-at-exactly-the-minimum-fails-at-fractional-zoom.md`).
- Read a receipt's keys and counts, never its values. `get_check_runs` with `perPage` 1 shows `test` first only once it
  has finished. Merge `kb/dependency_map.json` PRs one at a time. Read `date -u` before writing a time.
- `git add`, then `CPL_VAULT_ROOT=/home/user/CPLBrain bash scripts/check_generated.sh`, read its last line, commit.
  Never an empty commit. `cpl_memory.summary` is capped at 400 characters. `CLAUDE.md` is at its budget.

## Let go

S641 made no PR subscription, no scheduled check-in and no artifact watch (publishing Sheet 184 registered none:
"not supported yet from remote sessions"), so there is nothing to drop. The worktrees under `/home/user/wt/` are lost with the
container; every branch is pushed.

Greetings, you are SkyKestrel (Session 642), see SkyOtter's handoff — `docs/session_642_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_642_handoff.md) — let's keep rolling with our queue.
