---
title: "Session 639 handoff (from SkyTamarind, S638)"
created: 2026-11-11
updated: 2026-11-11
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyQuail (Session 639)

Written by SkyTamarind (S638) at a full checkpoint, about 22:30Z 2026-11-11. Sam drove and made S638 a conductor.
Facts here were checked against `origin/main`, the PRs and the #3111 thread at 22:00Z; a fact marked *as reported*
came from a worker and was not re-read.

## If you are the scheduled session (06:12Z, the CPL Queue routine)

**Safe to run unattended, in this order** (each under Rule 10 and the playbook's dispatch rules): the credential family
plan by a route with a receipt (item 1 below says how); the result of ASE plan phase 1's commit run (43109363928,
dispatched 22:09Z; the live dry run read 5 write, 9 replace, 11 retire, 0 held; 0 rows under `cer-s638@bot` at 22:14Z
while it ran); phase 2 (`kb/cer_decisions_out/2026-11-11-2`, dry run then commit); the nightly fold's result; the five
"standards" folds on a small scope first; phase 3 (`-3`); the subject batch; De Anza's `step=load`; the answer to
COBIx's 21:52Z reply on #3111. Then the rest of *Open work* below.
**Waits for Sam:** the six held titles, the Pierce question to MAP/ITPI, Cloudflare Web Analytics on public pages,
whether to set targets, the student-facing wording on a match, the "ASE Certificate Bundles" rename batch approval,
and anything on the `CLAUDE.md` hold list. An Open Asks sheet carrying these is owed and not built: build it from
`CPLBrain/decision-sheets/`, publish under a fresh `SHEET_ID`, and keep building the rest while it waits.

## At the start

Read `cpl_memory` first (Rule 8; tags `cer-procedures`, `exhibits`, `program-requirements`, `commons`). Check all three
repos are attached and that this is the highest-numbered handoff. Then `list_sessions` and the routine's trigger
(`docs/reference/scheduled_sessions.md`, *At the start*).

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

The playbook: `docs/reference/conductor_mode.md`. Read it before the first brief. In short:

- **Start:** the `cpl_memory` query, the three-repo check, `list_sessions` and the trigger, then a disposition and a
  subscription for each open PR, and a ledger (PR, branch, worker, state) you carry in your handoff. No worker from
  S638 survives; brief a fresh one per open branch from its PR.
- **Checkpoint:** say the context number to Sam at the warning line (110,000 left); run `/checkpoint` by commit count.
  A worker may write the documents; you keep the Supabase and remote-tool steps (10 and 12).
- **Sign-off:** unsubscribe every PR, delete every scheduled check-in, name each here, then the one opening line.

The first ten minutes:

1. Read #3110 and #3111 to the last comment.
2. Check `main` is green (it was at 22:15Z, after #3120) and which PRs are open.
3. `df -h /home/user` and `git worktree list`; remove stale worktrees under `.claude/worktrees/` (4.4 GB each).
4. Run the context meter: `python3 kb/_context_budget.py`.
5. Hand out the first three concerns from *Open work* below, one worker each.

## Conductor settings

Copied from `docs/reference/conductor_mode.md`, *Settings (Sam, 2026-11-11)*:

- Ultracode on.
- The conductor at medium effort.
- Workers on Opus 5.5 (`model: opus` in each Agent call).
- A worker building anything that writes shared data or changes an apply runs at high effort (`effort: "high"` on
  that worker; Sam asked for it). Other workers at the default.
- A review workflow uses at most 9 agents in all, readers and second readers together; drop the second reader on
  minor findings first.

## What shipped (S638), all merged

- **#3115** the Folds view reads "Saved, waiting for apply" or "Applied".
- **#3109** De Anza on its 2026-2027 catalog: packed course codes gated to De Anza, GE ranges with the 90 as a
  minimum, 205 of 221 records pass; two rereads replaced 197 live rows (receipts
  `kb/receipts/program_requirement_records_college_reread_de_anza_43078628422.json` and `..._43078634551.json`);
  extraction $17.15 of Sam's standing $40.
- **#3116** a fold records its issuer decision as one `issuer_resolution` row (`cred-fold-s638@bot`); one resolver,
  `effective_issuer` (`kb/fold_issuer.py`, `issuer_resolution.js`); rules 1, 2, 2b, 3; one-pass apply; undo. Its
  guarded writes and undo have run only against a test double.
- **#3118** ASE MIL1 to MIL8 titles (`kb/cert_naming.py`), MIL and A6/A7/T6/T7 in automotive; the applier's
  `reviewed_at` guard; three ASE plans under `kb/cer_decisions_out/2026-11-11-s638*`.
- **#3119** the exhibit subject fill (`kb/_exhibit_subject_fill.py`), its Commons card and worklist.

**Live data written:** the subject fill's first run (run 43104720166, 21:41Z), 747 `subj_override` plus 747
`subj_source` rows under `exhibit-subject-s638@bot` (undo: the cohort delete); De Anza's 197 rows. Nothing else.

**Also merged after the checkpoint opened:** #3120 (65b0aec2): the ASE plan folders are now
`kb/cer_decisions_out/2026-11-11`, `-2`, `-3`, and `tests/exhibit_progress.test.js` is fixed; `main` is green. #3117
(88f6d19c, 22:13Z): a credential family is a field (`kb/reference/credential_families.json`, `kb/_family_tag_plan.py`).
Every S638 feature PR is merged. **Open:** this checkpoint's PR, #3121.

## Open work, in order (from the lanes' NEXT lines)

1. **`cer-procedures`:** the family plan first (`kb/receipts/credential_family_2026-11-11_s638/plan.sql`, convert 25, hold 6, not
   run): it is 47 KB in one transaction opening with `create temp table _family_skip`, and the Supabase guard on a
   session's `execute_sql` blocks schema words, so never paste it there. Regenerate it from a fresh live read of the 61
   rows (`kb/_family_tag_plan.py --rows`), carry it by a route with a receipt (a small apply workflow in the
   `cer-decision-apply.yml` shape, or a generator that needs no temp table), and confirm with one count of
   `credential-family-s638@bot` rows;
   then read ASE phase 1's commit (run 43109363928) and its receipt; phase 2 (`-2`), dry run then commit; the next
   nightly fold; `cred-rename-apply.yml` for the five "standards" folds, the first live use of
   #3116 (small scope first, per the playbook), then `daily-dashboard.yml`; ASE plan phase 3 (`-3`); build the owed decision sheet; the rename batch proposing "ASE Certificate Bundles: A4 + A5" titles
   for Sam's one approval; the 362 credentials still without a subject as one batch (the worklist,
   `kb/exhibit_subject_out/worklist.json`; S638's conductor counted 371); the hourly trigger for the fold apply; the
   issuer registry; H and N verification, then the trainer move; the 181. Lane:
   `docs/reference/lanes/cer-procedures.md`.
2. **`program-requirements-harvest`, De Anza:** `step=load` for the 24 absent programs; about 15 older rows (Sheet 118
   card 1); 16 records still failing; display. Then Orange Coast 72, Los Angeles City 67, Victor Valley 60.
3. **The Commons plan (#3111):** COBIx accepted all seven of Sky's changes at 21:52Z (issuecomment-6807911596) with
   guards on 2, 5, 6 and 7 (the ASE slice behind Sam's go; identity signals a named, versioned list; articulations give
   recall only, scored on held-out articulations; a fixed stratified monthly audit). Answer whether Sky accepts the
   guards; then he posts the v2 Agreed final. Sam's one ruling COBIx holds verbatim: three levels, not stars ("3 is
   simpler", 1:38 PM PT). Everything else he relayed stays `proposed`.
4. **`commons`:** the path mock's NEXT (Teach a rule on every reference, the Course auditor's confidence count).
5. **Carried untouched from handoff 638 item 5:** American River's 23 programs; `library` NEXT 0; `csm-workspace` NEXT
   0 and 1; #2894 (Sam's to review); CPLBrain#758.
6. `governance-team-enablement`: conductor mode is recorded; no other move.

## Decisions to honor (all in `cpl_memory`)

- `sam-ic-exhibits-go-to-cert-title-2026-11-11`, `sam-bundle-family-is-a-field-2026-11-11` ("A, C as recommended").
- `sam-ase-mil-certs-and-cx-to-standards-2026-11-11`: ASE MIL3 is the Military Tactical Wheeled Vehicle (TWV) Drive
  Train certification; exhibits with ASE MIL in the title take ASE's official titles.
- `sam-emptied-titles-settle-without-him-2026-11-11` ("can you and cobex fix the one thin you're bringing back to me
  without bringing it back to me:)"; "so the hvac mil should be in auto not hvac subj").
- `sam-complete-ecosystem-crash-through-action-2026-11-11`, `sam-the-only-failure-is-not-moving-forward-2026-11-11`:
  a complete canonical ecosystem, even imperfect; act, crash, learn, fix, launch again.
- `sam-web-search-on-anomalies-2026-11-11`: try a web search when an anomaly or unknown arises.
- Every exhibit gets a Common SUBJ, filled as automatically as possible (commons lane, DECIDED).
- `sam-old-or-unused-is-not-a-crime-2026-11-11`: relayed by COBIx, not confirmed in session.
- `sam-conductor-mode-settings-2026-11-11`: the conductor settings block above.
- Session call `d-issuer-resolution-row-s638`. Merge on reversible, run a plan once its receipt can undo it, fix
  forward (Sam, mid-session), read with Rule 10 as the playbook states it.
- **Held for Sam:** four ASE Master titles; Advanced Electrical and Electronic Systems; ASE Certification (any A1-A8);
  the Pierce question to MAP/ITPI; Cloudflare Web Analytics on public pages; whether to set targets; the
  student-facing wording on a match. None is on a sheet yet (see *Not refreshed*).

## Not refreshed at this checkpoint

The pipeline view (no roadmap row, auditor count or re-mint moved); `kb/README.md` and `README.md` (no structure or
surface change they describe); step 10's new rows (the conductor wrote the session's rows); the course, cr and subjects
run logs (untouched); a decision sheet (cards are owed for the held items above; the conductor publishes).

## Patterns that worked

- Independent readers, then a second reader refuting each finding: caught 14+8+8 on #3116, 9+5 on #3117, and a
  blocker on #3109 that green CI missed.
- One web search before an ask to Sam.

## Safety patterns to honor

- `git add`, then `CPL_VAULT_ROOT=/home/user/CPLBrain bash scripts/check_generated.sh`, read its last line, commit.
- A PR that changes a builder of a committed file runs the builder
  (`docs/kb-notes/methodology-a-pr-that-changes-a-builder-runs-the-builder.md`).
- `cer-decision-apply.yml` accepts plan folders named `<date>` or `<date>-<2-9>` only.
- Never an empty commit to restart CI; wait for the `test` roll-up.
- `cpl_memory.summary` is capped at 400 characters and `kind` is required. `CLAUDE.md` is at its byte budget.

## Let go

At sign-off S638 dropped its watches on #3117 and #3120 (both merged) and deleted its scheduled check-ins. It holds no watch and no
check-in. Subscribe to #3121 yourself if it is still open.

Greetings, you are SkyQuail (Session 639), see SkyTamarind's handoff — `docs/session_639_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_639_handoff.md) — let's keep rolling with our queue.
