---
title: GitHub scheduled-workflow reliability — diagnosing a missed cron + the backstop-cron fix
created: 2026-06-01
updated: 2026-06-22
tags: [playbook, github-actions, cron, scheduling, daily-dashboard, ops, resilience]
kb-status: published
kb-type: playbook
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - .github/workflows/daily-dashboard.yml
  - kpi_history.json
---

# GitHub scheduled-workflow reliability

> **One-sentence summary** — GitHub's `schedule` (cron) trigger is *best-effort*:
> it routinely delays runs by hours and occasionally drops one entirely with **no
> failed run and nothing queued**; diagnose by elimination, fix with a backstop
> cron + the Rule-3 backfill.

## Context

The daily dashboard didn't run on 2026-06-01 — "nothing failed, nothing queued."
This is a recurring class of confusion ("did *we* break it?"). It's almost never
your code; it's GitHub's scheduler. This note captures the diagnosis and the fix
so the next occurrence is a 2-minute confirm, not a re-investigation.

## The claim

**A scheduled GitHub Actions workflow can silently not-run.** GitHub documents
the `schedule` event as best-effort: it "can be delayed during periods of high
load," and under very high load **queued runs are dropped** — leaving no failed
run, nothing queued, and no error. Symptoms: the last successful run is from a
prior day; the run-history timestamps show the cron firing **hours late every
day** (ours targets 10:17 UTC but fires 11:46–13:35 UTC); a fully-dropped day
leaves a gap.

### Diagnose by elimination (rule out *your* code first)

1. **Did the workflow FILE change?** `git log -- .github/workflows/<wf>.yml`. If
   the file is byte-identical to the last green run, scheduling isn't the file's
   fault. (Cron firing is GitHub-side; a broken *step* yields a **failed** run,
   never a no-show.)
2. **Does the pipeline still run?** Run the workflow's main command locally
   (`python excel_to_dashboard.py`) → exit 0 means your code didn't crash it.
3. **Is the workflow disabled?** GitHub auto-disables a scheduled workflow only
   after **60 days of repo inactivity**, and shows a **yellow banner** in the
   Actions UI. Active repo + no yellow banner → not disabled.
4. **Is Actions itself working?** If other workflows (PR CI) ran today, Actions
   is healthy → the issue is specific to the `schedule` trigger.

If 1–4 all clear, the verdict is: **GitHub dropped/over-delayed the scheduled
run.** Not your code.

### Fix

- **Immediate:** manually `workflow_dispatch` ("Run workflow") to fill today.
- **Recurring:** add a **backstop cron** a few hours after the primary:
  ```yaml
  on:
    schedule:
      - cron: '17 10 * * *'   # primary
      - cron: '17 14 * * *'   # backstop — catches a dropped/over-delayed primary
  ```
  Safe **only if the job is idempotent** — ours is: `concurrency` serializes the
  two, the daily snapshot/`kpi_history` overwrites the same-day entry, and a
  `git diff --cached --quiet → "No changes to commit"` guard makes a redundant
  backstop run a no-op. Two crons ≠ a guarantee (both ride the same best-effort
  scheduler) but materially raise the odds one fires.
- **Data-gap safety net:** if a day is fully missed, backfill an interpolated
  entry (CPL's Rule 3: `kpi_history.json` must have no date gaps, or the trend
  card's "1d" delta silently falls back). Precedent: the `2026-04-18` interpolated
  entry.

## When this applies (and when it doesn't)

- **Applies** to any GitHub Actions `schedule:` workflow, especially on free/
  public runners. The chronic *delay* is inherent; the backstop mitigates the
  *drop*, not the delay.
- **Doesn't fix precision.** If a run must happen at an exact time, GitHub cron
  is the wrong tool — drive `workflow_dispatch` from an external scheduler
  (cron-job.org, a tiny Lambda, etc.). Overkill for a daily dashboard.
- **Idempotency is the prerequisite** for a backstop. A non-idempotent job
  (appends, non-overwriting writes, side effects) would double-apply — fix
  idempotency first.

## See also

- `.github/workflows/daily-dashboard.yml` (the cron ladder); CLAUDE.md §6.
- PR #216 (backstop cron); the 2026-06-01 investigation.

## Update — 2026-06-22 (Session 68): schedule EARLY + a transient-failure lesson

Two refinements after the dashboard was "spotty" again (PRs #485, #486):

**1. Measure the delay, then schedule for buffer (not just redundancy).** Pulled ~25
runs via `actions_list(list_workflow_runs)` and parsed `created_at` vs the `:17` cron
target: the primary was firing **+1.75 to +4h late, every day** — and *every* recent
day actually ran. So the problem was **delay, not drops**. You can't shrink GitHub's
delay, so **schedule EARLY** for buffer and let later crons catch an over-delayed one.
The two-cron setup became a **3-cron ladder ~3h apart**: `17 6` / `17 9` / `17 12 * * *`
UTC (≈11 PM / 2 AM / 5 AM PT) — the primary now lands overnight even after a 4h slip;
the last backstop is the pre-workday net. Keep `:17` (never `:00`); never 00:00 UTC.

**2. A daily pipeline also dies from a *transient* error in an unguarded step — audit
every external call to be non-fatal + retried.** The actual cause of a failed run was
a one-off `URLError: [SSL: UNEXPECTED_EOF_WHILE_READING]` reaching Supabase in
`kb/_apply_curation.py` — the **one** Supabase call in step 3 with no `|| echo` guard
(its three siblings were already non-fatal). A momentary blip aborted the *entire*
publish. Fix = two layers: a **retry** in the fetch (transient TLS/network self-heals
within the run, 4 tries, backoff) **and** a **non-fatal `::warning::` guard** (a
persistent outage falls back to the committed overlay — the generator already tolerates
Supabase being down). It's safe to skip because the script **fetches before it writes**,
so a failed fetch leaves the last-good file untouched. **Lesson:** in a daily pipeline,
the publish must survive any single source hiccup — make every external call non-fatal,
retry the transient ones, and verify each step has a committed fallback.
