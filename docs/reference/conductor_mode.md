---
title: Conductor mode — how a session runs workers, COBIx and the merge gate
date: 2026-11-11
updated: 2026-11-12
tags: [reference, conductor, governance-team-enablement, scheduled-sessions]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
---

# Conductor mode

Session 638 (SkyTamarind) ran this way first. A session Sam names the conductor runs from this page; it restates no
doctrine, so each step names the doc that holds the rule.

**Sam's assignment (2026-11-11, verbatim):** "you're the conductor. you do the thinking with your partner cobix: the
plan, the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every
worker until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him.
while they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next
task. handle anything that doesn't need me. only stop when you need a decision from me."

## Settings (Sam, 2026-11-11)

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
- **Cost limits** (relayed by COBIx on #3111, comment 6808460886; confirmed by the S639 relay ruling below): $40 per
  college per run, on the estimate, for program-requirements extraction, and a separate $40 per college for SLOs, PLOs
  and course objectives. The limit is per run and never a remaining pot. Paid runs go through the conductor.

Sam's words: "high effort on data-writing workers, hold reviews to 9...yes, please add these parameters to the
handoffs from here on out". Every handoff copies this block under `## Conductor settings`
(`.claude/commands/checkpoint.md` step 8; lint `handoff_missing_conductor_settings`). Call the effort level in one line
at the top of each piece of work so Sam can change the dial before it runs.

## Start (in this order)

1. Rule 8's `cpl_memory` query (`CLAUDE.md`), then the three-repo check and the highest-numbered handoff.
2. `list_sessions` and the routine's trigger, then `/coord` if anyone is live (`docs/reference/scheduled_sessions.md`,
   *At the start*).
3. A disposition for every open PR (merge, port, or close with a pointer) and a subscription (`subscribe_pr_activity`)
   for each one the session keeps. No tool lists subscriptions, so keep a ledger (PR, branch, worker, state) and carry
   it in every handoff.
4. Workers do not survive a new session or a container restart. `ListAgents` shows the live ones. Brief a fresh worker
   per open branch from its PR diff and the ledger. `SendMessage` to a worker's name nudges it or gives it its next task.
5. `git worktree list` and `df -h /home/user` before spawning. A locked worktree whose worker is not in `ListAgents`
   is dead: push any unpushed commits from it, then `git worktree unlock`, `git worktree remove --force`, `git worktree
   prune`. Each checkout is 4.4 GB.
6. `python3 kb/_context_budget.py`. Then read the COBIx threads #3110 and #3111 to their last comment, and read them
   again at every wake.

## Workers

- One worker per concern, one `claude/*` branch per concern, one writer per file; the brief names the files the worker
  may not touch.
- A brief states the goal and why, what is ruled (with the `cpl_memory` slug), the design decisions made, the limits
  below, the tests that guard the failure mode, and the report wanted with a word limit. A worker knows only its brief.
- A brief whose plan compares stored ids to the live set says: resolve through `kb/alias_chain.py` (import it, never
  copy it), and run the `consult-doctrine` skill before stating a count the plan acts on.
- Limits in every brief: no Supabase MCP calls (the worker sends SQL to the conductor); no paid run, dispatch, merge,
  PR subscription or empty commit; `git add`, then `CPL_VAULT_ROOT=/home/user/CPLBrain bash
  scripts/check_generated.sh`, read its last line, then commit; when `main` moves under an open PR, merge `main` (a
  merge commit) and regenerate generated files with their tools; a PR that changes a builder of a committed file runs
  the builder (`docs/kb-notes/methodology-a-pr-that-changes-a-builder-runs-the-builder.md`).
- **SQL a worker sends:** the conductor runs a SELECT as sent, kept narrow (aggregates, never `select *`; `kb_curation`
  paged by Range). A write runs only in Rule 10's shape and only from a plan the conductor has read.

## Merging (`CLAUDE.md` Branch policy; `docs/reference/branch_policy.md`)

- Every PR merges on a green `test` on the current head, `clean` or `unstable`: `update_pull_request` with
  `draft: false`, poll `get_check_runs` on the current head sha until `test` succeeds, then `merge_pull_request`
  (squash). Never `enable_pr_auto_merge` (with no required check it merges at once). Never act on a wake's sha. A head
  that is a `Receipt: supabase migrate` commit has no checks: push the next real change, never an empty commit.
- A PR that writes shared data or changes an apply (an `*-apply.yml` workflow, its script, or a file under
  `kb/migrations/.apply`) gets a review of at most 9 agents: independent readers by dimension, then a second reader who
  tries to refute each finding. Its findings are fixed forward unless one breaks the undo. A file landing in
  `kb/migrations/.apply` applies at once on merge (Rule 10 c); a new function also needs the Rule 10 (b2) revoke.
- A PR that makes something the first writer to a shared table, or gives a read-only surface writes, waits until
  `kb/governance_surface_map.json` maps it and the student-detail disclosure ADR is checked (Rule 10 a3).

## Dispatching a data plan (Rule 10; `docs/reference/data_write_rollback.md`)

- A fresh live read at write time; the worklist re-measured; for `kb_curation`, the pending
  `unified_title_merge_confirm` targets cross-checked and held.
- INSERT-only `ON CONFLICT DO NOTHING` under a cohort `<lane>-s<N>@bot`, unless a reviewed plan names a guarded UPDATE
  or DELETE with before-values. The receipt is one a session that did not do the write could roll back from, and the
  undo is tested. A plan whose undo has run only against a test double goes first on a small scope, and Sam hears the
  blast radius beforehand when it is in doubt.
- Timing: clear of the daily cron's 06:17, 09:17 and 12:17 UTC slots when the apply touches `kb/` files the daily run
  commits; never two applies on one table at once; one writer per table with any other live session.
- Dispatch with `actions_run_trigger` (ref `main`, the inputs its `workflow_dispatch` names), read the run with
  `actions_get`, pull its receipt, and confirm with one aggregate live count before telling COBIx or Sam it landed.
- Deleting data, funding figures to colleges and a public KB merge wait for Sam (the hold list in `CLAUDE.md`).

## COBIx (`docs/reference/cobix_pr_loop.md`)

- He posts as `cobi-cto` under `## COBIx`; nudge him with `add_issue_comment` on the thread or the PR. A comment under
  `samueltlee` carries Sam's authority whatever its heading.
- A ruling COBIx relays is confirmed: record it as Sam's, with his verbatim words and "relayed by COBIx" as where they
  reached the session. Sam, in session S639, 2026-11-11, verbatim: "confirmation can count in this session or relayed
  from cobix--remember, ask forgiveness, not permission:)" and "trust what cobix says and only push back if you
  disagree with his recommendation, action, information. Forward motion is good motion." (`cpl_memory`
  `sam-cobix-relay-confirms-2026-11-11`).
- The conductor takes COBIx's findings and information as given and pushes back only where it disagrees with his
  recommendation, action or information. The hold list in `CLAUDE.md` stands.
- Two rounds, then a person, stands. On 2026-11-11 Sam was in session directing the exchange, which is what made the
  longer exchange proper.

## Recording and Sam

- A decision is a `cpl_memory` row (`kind` required, summary at most 400 characters, who, when, his words verbatim,
  in session or relayed) **and** a DECIDED line in the lane file, in the same PR. Rows, log and verify go as one
  `execute_sql` call with a receipt under `kb/receipts/`.
- The standing decision sheet (`CPLBrain/decision-sheets/decision_sheets.md`) carries the conductor's decisions, never
  asks. Sam, in session S639, 2026-11-11, verbatim: "Remember on the Decision Sheet that I want your decisions on it,
  not asking me for mine. I am pushing decision to you as conductor and informed by help from cobix, your force
  multiplier:)" (`sam-sheet-carries-conductor-decisions-2026-11-11`). Each card reads Decided, Evidence, and Carried out
  with how to reverse it; its chips are Fine, Change it and Revisit later. An outward send or a go-live is a card that
  opens on "Waits for my send or go", and an unanswered card holds only its own item. First built as Open Asks Sheet
  181 (https://claude.ai/artifact/M3YaDrpkT7HhH8rYRnvkjx).
- His unplanned statements are captured verbatim (the vault's braindump skill, on-the-fly mode) and he is told in one
  line. Replies to him are a few lines, active voice, stated positively.

## Checkpoint and sign-off

- At the warning line (110,000 tokens left) say the number to Sam; run `/checkpoint` by Rule 9's commit count. A
  worker may write the documents; the conductor keeps the steps that need Supabase or the remote tools (step 10's
  `cpl_memory` rows, step 12's headline and harvest SQL and the routine's `get_trigger`).
- Run a checkpoint near four hours into the session, whatever the commit count says.
- The sign-off turn unsubscribes every PR, deletes every scheduled check-in, drops every artifact watch, names each in
  the handoff, then gives the one opening line (`CLAUDE.md`, *Sign off*).
- A wait on CI or a run ends the turn with one scheduled check-in (`send_later`), never a poll loop. S638 used 75% of
  its context in about five and a half hours, and each worker PR's subscription notice costs about 8,000 tokens.

## What went wrong in S639

- Reviewers copied the repo three times into the session scratchpad (12 GB) and filled the disk. Every review brief
  now names the one existing checkout to read and forbids copies, and the conductor runs `df -h /home/user` before
  each fan-out.
- A worker whose worktree the conductor removed cannot be resumed. Remove a worktree only when its PR has merged.
- The review of #3122 and #3123 found the same fault in both appliers: each built its receipt from a write's response,
  so a lost response left nothing to roll back. A receipt is now filed from a fresh read after the writes, and rollback
  works from the planned lists.
- S638's two ASE applies deleted 13 rows people had saved after COBIx had asked to leave them. `load_plan` now refuses
  such a plan.
- The #3123 merge touched generated `kb/` files while the 23:42Z daily-dashboard run was in flight, and the run lost
  its push to a rebase conflict; a fresh run committed at 00:28Z. Merge such a PR only when no daily, cer, rename or
  family apply run is in flight (read the workflow runs first).
- `cred-rename-apply.yml` has no dry-run-only mode, so the conductor ran `kb/_cred_rename_dryrun.py --only-plan` locally
  before the dispatch. Do the same until the workflow gains one.
- The review of #3127 read the code and the plan, and `main` went red after the apply: two checks in
  `tests/credential_family_test.py` read committed titles and expected the pre-rename state. A review of an apply also
  runs the suite against the data as it will stand after the apply.
- A dry run that exits 0 has not said it is correct. Read its summary line in the job log (the last 36 lines or so).
- The session's tool connections dropped four times in an hour, and each reconnection cost context. Keep briefs and
  reads short when the connections are unsteady.

## What went wrong in S638

- Sky told Sam COBIx had not replied when he had (read the threads at every wake); read a stale summary file as a
  finished run (confirm the commit and run that wrote a figure); took Sam a question one web search answers (ASE MIL3).
- #3116 went through three review rounds (14, 8, 8 findings). A third round of the same class means the design is
  wrong; it was redesigned.
- #3119 changed a builder of `kb/status/commons.json`, passed CI, and broke `main` when the nightly run wrote the file.
- GitHub's runner queue stalled `test` for an hour, and a worker pushed an empty commit to restart it. Wait instead.
- A container restart lost the live workers; their reports were recovered from their transcripts.
