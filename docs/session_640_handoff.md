---
title: "Session 640 handoff (from SkyQuail, S639)"
created: 2026-11-12
updated: 2026-11-12
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyHeron (Session 640)

Written by SkyQuail (S639) at a full checkpoint, about 01:45Z 2026-11-12. Sam drove; SkyQuail was the conductor, with
COBIx (`cobi-cto`) on #3110 and #3111. Facts here were checked against `origin/main` at 01:28Z (`29871490`), the
receipts and the lane files; a fact marked *as reported* came from the conductor's summary and was not re-read.

## First: is `main` green?

At 01:30Z `main` was red: 2 of 30 checks in `tests/credential_family_test.py` fail since the rename apply
(`da9f2f90`), because they read committed titles and expect the pre-rename state. PR #3132 fixed the tests (three files) and merged
at 02:02Z (`08fe27eb`); the conductor confirmed `test` green on its head. **Check whether that PR merged and `main` is green** (`get_check_runs` on
`main`'s head, `test`). If not, the fix is yours before anything else, and the harvest side session holds its merges
until it lands. Then dispatch `daily-dashboard.yml`: the two new family tags and the Sheet 181 renames are not on the
published files yet (`kb/credentials.json` reads 23 `family` values; 25 are live).

## If you are the scheduled session (06:12Z, the CPL Queue routine)

**Safe to run unattended, in this order,** each under Rule 10 and the playbook's dispatch rules: the two steps above;
the five "standards" folds (Open work 1); ASE plan phase 3. **Waits for Sam:** a guarded delete of Sierra's ghost rows,
the coverage notes to Malone and to MAP/ITPI (his send), analytics on public pages (his go), and anything on the
`CLAUDE.md` hold list. Put the ghost-row delete on the next sheet as a conductor's decision that waits for his go.

## At the start

Read `cpl_memory` first (Rule 8; tags `cer-procedures`, `exhibits`, `commons`, `program-requirements`). Check all three
repos are attached and that this is the highest-numbered handoff. Then `list_sessions`: the harvest side session (below)
may still be live; agree one writer with it.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

The playbook is `docs/reference/conductor_mode.md`; read it, *What went wrong in S639* included, before the first
brief. Two S639 rulings shape the job: a ruling COBIx relays is confirmed (`sam-cobix-relay-confirms-2026-11-11`: "ask
forgiveness, not permission"; "Forward motion is good motion."), and the decision sheet carries your decisions, never
asks (`sam-sheet-carries-conductor-decisions-2026-11-11`). First ten minutes: read #3110 and #3111 to the last comment;
`df -h /home/user` and `git worktree list` (remove a worktree only once its PR merged); `python3 kb/_context_budget.py`.

## Conductor settings

Copied from `docs/reference/conductor_mode.md`, *Settings (Sam, 2026-11-11)*; Sam's latest change was 2026-11-11:

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

## Ledger (PR, branch, worker, state) at 01:45Z

| PR | Branch | Worker | State |
|---|---|---|---|
| #3132 | `claude/family-test-after-rename-s639` | S639 worker (finished) | fixes the 2 red checks and a test that overwrote `kb/credentials.json`; open at 01:50Z, merged 02:02Z (`08fe27eb`); `main` green |
| this checkpoint | `claude/checkpoint-s639` | S639 worker | draft; merge clear of any daily or apply run |
| #3129 | `claude/session-639-handoff-djil98` | harvest side session | draft; the side handoff `docs/harvest_side_handoff_s639.md` |
| #3102 | `claude/slo-shasta` | none | untouched |
| #2894 | `claude/cobix-inbox` | none | Sam's to review |
| CPLBrain (no PR) | `claude/hopeful-dirac-ee6q7s` | none | holds Sheet 181's source and this session's note |

No S639 worker survives. Brief a fresh one per open branch from its PR.

**The harvest side session.** Sam opened a second session from iOS at 00:33Z (`session_01Rvwe2U4mgii4KEm8yFXoRg`). It
runs `program-requirements-harvest` with its own handoff and #3129 and holds merges until `main` is green; its
branches `claude/harvest-{orange-coast,los-angeles-city,victor-valley,american-river}-s639` are its workers'. One
writer, agreed at 00:44Z: the conductor keeps `kb_curation`, every cer, rename and family apply, the `cer-procedures`,
`commons` and governance lanes, `CLAUDE.md` and `conductor_mode.md`.

## What shipped (S639), all merged

- **#3122** the family apply workflow (`credential-family-apply.yml`); review found the undo read the INSERT's echo
  and the gate compared a count; fixed (it gates on the set's hash).
- **#3123** the emptied-title guard (`fold_issuer.hold_emptied_folds`), `reinstates` in `kb/_cer_decision_apply.py`,
  receipts filed from a fresh read, and `load_plan` refusing a plan that retires a person's saved row other than a
  `reviewed_marker`.
- **#3124** the playbook and lanes: S639's rulings and lessons. **#3126** JS tests run on `main` after the nightly
  and the daily.
- **#3127** Sheet 181's renames as a ruled plan (`kb/cred_rename_plans/2026-11-12_sheet181.json`, the `only_plan`
  input); review found the rename stranded family tags and the undo read the echo; fixed.

**Live data written, each confirmed by a count:** De Anza `step=load` (run 43113795725: 24 inserted, 197 kept);
the family tags (24 at 23:38Z, set `038293de0093`; 2 more at 01:28Z, set `3a4d0f3d969b`; 25 live under
`credential-family-s638@bot`); the restore (`kb/cer_decisions_out/2026-11-11-4`, run 43129235942, 13 rows back);
the Sheet 181 rename apply (`da9f2f90`, 22 renames and 2 merges, 73 `kb_curation` steps, 0 failed). Detail and each
undo: `docs/reference/lanes/cer-procedures.md`. The 23:42Z daily run lost its push to a rebase conflict with the #3123
merge (*as reported*); a fresh run committed at 00:28Z (`fd248e82`).

## Decisions to honor (all in `cpl_memory`)

- `sam-cobix-relay-confirms-2026-11-11`, `sam-sheet-carries-conductor-decisions-2026-11-11` (above).
- `d-sheet-181-replies-2026-11-11`: Open Asks Sheet 181 (https://claude.ai/artifact/M3YaDrpkT7HhH8rYRnvkjx, current,
  answered 22:55Z): cards 1 to 7 as decided, all carried out; card 10, Sam's own call, "Go when built" for the ASE
  student-facing slice; analytics on public pages still waits for his go.
- `sam-pierce-drop-was-its-own-cleanup-2026-11-11` (relayed by COBIx): Pierce is closed, no note to ITPI.
- The conductor's calls: *ASE Master Automobile Technician (A1–A8) or L3* keeps its own title and *ASE Bundle — A6 or
  T6 + L3* stays unrenamed, both left for a person; 13 rows restored, not 12.
- From S638, still standing: every exhibit gets a Common SUBJ; a complete ecosystem, even imperfect; a web search on an
  anomaly before an ask.

## Open work, in order (from the lanes' NEXT lines)

1. **`cer-procedures`** (`docs/reference/lanes/cer-procedures.md`, NEXT): `main` green and the daily run (above); the
   five "standards" folds through `cred-rename-apply.yml` on their own small scope (run `kb/_cred_rename_dryrun.py
   --only-plan` locally first, read the dry run's `issuer_preview`, and check `held_emptied` so the restored rows stay
   inert); ASE plan phase 3 (`kb/cer_decisions_out/2026-11-11-3`); the retired names as aliases to where their exhibits
   went (`kb/credential_aliases.py` reads only applied rename snapshots, never `credential_retires`); Sierra's ghost
   rows (a delete, so a sheet card); the Exhibits list showing a kept fold row as "Saved" where "Family set" is true;
   the 362 credentials without a subject; the hourly trigger for the fold apply; the issuer registry; H and N
   verification and the trainer move; the 181.
2. **`commons`:** the ASE student-facing slice (Sam's go; Commons plan v2 Agreed final, #3111 comment 6808952144; the
   Request CPL Review state is a data gap); then the path mock's NEXT.
3. **`governance-team-enablement`:** S639's lessons 1, 2 and 4 from the red-main morning (#3111): regenerate in CI for
   a changed builder; failures first seen on `main`; queue time.
4. **`program-requirements-harvest`:** the side session's (Orange Coast 72, Los Angeles City 67, Victor Valley 60,
   American River's 23, De Anza's tail). Read its side handoff; do not take its files.
5. **Waiting on Sam's send or go:** coverage notes to Malone and to MAP/ITPI; analytics on public pages.
6. Carried untouched: `library` NEXT 0; `csm-workspace` NEXT 0 and 1; #3102; #2894 (Sam's); CPLBrain#758.

## Not refreshed at this checkpoint

The pipeline view (it tracks M-ID identity work; no roadmap row, auditor count or M-ID re-mint moved); `README.md`
(no surface changed); step 10's `cpl_memory` rows and step 12's headline, harvest measure and trigger read (the
conductor runs them); the course, cr and subjects run logs (untouched); a new decision sheet (Sheet 181 is answered;
the next carries the ghost-row delete).

## Patterns that worked

- Readers, then a second reader refuting each finding, on every apply: they caught the echo-read undo three times.
- A local `--only-plan` dry run before a dispatch with no dry-run-only mode.
- One count after each write before telling COBIx or Sam it landed.

## Safety patterns to honor

- `git add`, then `CPL_VAULT_ROOT=/home/user/CPLBrain bash scripts/check_generated.sh`, read its last line, commit.
- A review of an apply runs the suite against the post-apply data
  (`docs/kb-notes/methodology-a-pr-that-changes-a-builder-runs-the-builder.md`).
- Merge a PR touching generated `kb/` files only when no daily, cer, rename or family run is in flight.
- Never an empty commit to restart CI. `cpl_memory.summary` is capped at 400 characters. `CLAUDE.md` is at its budget.

## Let go

At sign-off S639 drops every PR subscription and scheduled check-in it holds and names each in its last message; this
handoff was written before that turn, so read the conductor's sign-off message for the list.

Greetings, you are SkyHeron (Session 640), see SkyQuail's handoff — `docs/session_640_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_640_handoff.md) — let's keep rolling with our queue.
