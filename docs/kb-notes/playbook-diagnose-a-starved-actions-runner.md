---
title: Diagnose a stalled GitHub Actions repo — check runner_id before anything else
created: 2026-08-06
updated: 2026-08-06
tags: [playbook, github-actions, ci, troubleshooting]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[playbook-github-pages-manual-redeploy]]"
artifacts:
  - .github/workflows/pages.yml
---

# Diagnose a stalled GitHub Actions repo — check `runner_id` before anything else

> **One-sentence summary** — when every workflow fails at the same duration, the
> jobs never ran: read the job record's `runner_id` first, because a starved
> queue looks exactly like broken code until you do.

## Context

On 2026-08-06 every workflow in `cpl-project-tracker` began failing at ~15
minutes — JS tests, CodeQL, Secret scan, the daily dashboard. A Pages run wedged
in `waiting`. Then pushes stopped creating runs at all. Roughly two hours went
into three successive wrong hypotheses before the actual tell was read.

## The claim

**A uniform failure duration across unrelated workflows is not a code
signature — it is a timer.** The job record says so directly:

```
runner_id: 0 · runner_name: "" · started_at == created_at · conclusion: cancelled
```

`runner_id: 0` means **no runner was ever assigned**. The job sat in the queue
for GitHub's ~15-minute allocation timeout and was canceled. There are no logs
because no step executed — which is also why `get_job_logs` returns *"No failed
jobs found"* on a run whose conclusion is `failure`.

### The diagnostic order that would have saved two hours

1. **`runner_id` on the job record.** `0` ⇒ starvation. Stop; nothing in the
   repo is at fault. Non-zero ⇒ a real failure, read the logs.
2. **Do any non-runner checks pass?** Secret scanning is a GitHub-hosted
   service, not an Actions job. Secret scan ✅ in 3m while every runner job dies
   at 15m is starvation, conclusively.
3. **Compare against a commit that predates your changes.** A run failing the
   same way on an older SHA exonerates the current work immediately.
4. **Only then** consider billing, environment protection rules, or config.

### Wrong turns worth naming

- **"A required-reviewer rule was added."** The run *said* "waiting for
  github-pages deployment approval" — but the environment had no such rule. A
  wedged run can report a gate that does not exist; verify the config rather
  than trusting the message.
- **"Actions minutes are exhausted."** Check repo **visibility** first: public
  repos get free, unlimited standard hosted runners, so billing cannot be the
  cause regardless of what the billing page shows.

## The one repo-side lever

A run stuck in `waiting` holds its `concurrency` group forever when
`cancel-in-progress: false`, and it may be uncancellable (502 via API, 500 via
UI). **Renaming the concurrency group** puts new runs in a group the wedged run
is not a member of, preserving serialization among runs that can actually
execute. That is a legitimate route around a wedged run — but it does nothing
for starvation, so establish which you have first.

## Confirmed by the incident, after the fact

GitHub's status page published an **Incident with Actions** for this window
(first update 17:40 UTC, still open at 20:34) naming both halves precisely:

> *"We have narrowed the remaining impact to **runners that are stuck retrying
> jobs that are no longer available**. Both GitHub-hosted and self-hosted runners
> are affected."*

> *"**Webhook triggers are currently throttled** … we are processing
> approximately 15% of webhooks, so **many events such as pushes and pull
> requests are not triggering workflow runs**."*

That is the two-stage escalation observed from the outside — first jobs never
getting a runner (`runner_id: 0`, killed at the allocation timeout), then pushes
not creating runs at all. **The job record told us this two hours before the
status page did.** Checking githubstatus.com is worth doing, but it is a
*confirmation* step: the incident was already three hours old and unpublished
when the symptoms started, so do not treat a clean status page as evidence that
the problem is yours.

## When this applies (and when it doesn't)

Applies to any sudden repo-wide CI stall. Does not apply to a single workflow
failing while others pass — that is a real failure; read the logs.

## See also

- `[[playbook-github-pages-manual-redeploy]]` — never `rerun_failed_jobs` on Pages
- PR `#1013` — the concurrency-group rename

---

*Authoring check: durable · reusable · distilled · self-contained.*
