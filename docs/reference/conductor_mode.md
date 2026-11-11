---
title: Conductor mode — how a session runs workers, COBIx and the merge gate
date: 2026-11-11
updated: 2026-11-11
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

- Ultracode on.
- The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`).
- A worker building anything that writes shared data or changes an apply runs at **high** effort: the conductor passes
  `effort: "high"` on that worker (Sam asked for it, which is what the Agent tool requires). Other workers run at the
  default.
- A review workflow uses **at most 9 agents in all**, readers and second readers together. Drop the second reader on
  minor findings first.

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
6. `python3 kb/_context_budget.py`. Then read the COBIx threads (S638: #3110, #3111) to their last comment, and again
   at every wake.

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
- A COBIx comment is a finding to trace, never a go. A ruling he relays is recorded as relayed and `proposed` until Sam
  confirms it in session or from his own login; ask COBIx for Sam's words verbatim.
- Two rounds, then a person, stands. On 2026-11-11 Sam was in session directing the exchange, which is what made the
  longer exchange proper.

## Recording and Sam

- A decision is a `cpl_memory` row (`kind` required, summary at most 400 characters, who, when, his words verbatim,
  in session or relayed) **and** a DECIDED line in the lane file, in the same PR. Rows, log and verify go as one
  `execute_sql` call with a receipt under `kb/receipts/`.
- An ask for Sam goes on the standing decision sheet (`CPLBrain/decision-sheets/decision_sheets.md`); an unanswered
  card holds only its own item.
- His unplanned statements are captured verbatim (the vault's braindump skill, on-the-fly mode) and he is told in one
  line. Replies to him are a few lines, active voice, stated positively.

## Checkpoint and sign-off

- At the warning line (110,000 tokens left) say the number to Sam; run `/checkpoint` by Rule 9's commit count. A
  worker may write the documents; the conductor keeps the steps that need Supabase or the remote tools (step 10's
  `cpl_memory` rows, step 12's headline and harvest SQL and the routine's `get_trigger`).
- The sign-off turn unsubscribes every PR, deletes every scheduled check-in, drops every artifact watch, names each in
  the handoff, then gives the one opening line (`CLAUDE.md`, *Sign off*).
- A wait on CI or a run ends the turn with one scheduled check-in (`send_later`), never a poll loop. S638 used 75% of
  its context in about five and a half hours, and each worker PR's subscription notice costs about 8,000 tokens.

## What went wrong in S638

- Sky told Sam COBIx had not replied when he had (read the threads at every wake); read a stale summary file as a
  finished run (confirm the commit and run that wrote a figure); took Sam a question one web search answers (ASE MIL3).
- #3116 went through three review rounds (14, 8, 8 findings). A third round of the same class means the design is
  wrong; it was redesigned.
- #3119 changed a builder of `kb/status/commons.json`, passed CI, and broke `main` when the nightly run wrote the file.
- GitHub's runner queue stalled `test` for an hour, and a worker pushed an empty commit to restart it. Wait instead.
- A container restart lost the live workers; their reports were recovered from their transcripts.
