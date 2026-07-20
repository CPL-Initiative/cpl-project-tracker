---
title: Manually re-deploy GitHub Pages — dispatch a fresh run, never rerun_failed_jobs
created: 2026-07-20
updated: 2026-07-20
tags: [playbook, github-pages, ci, deploy, ops]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cip_crosswalk_lessons]]"
artifacts:
  - .github/workflows/pages.yml
---

# Manually re-deploy GitHub Pages — dispatch a fresh run, never rerun_failed_jobs

> **One-sentence summary** — when the "Deploy Pages (lean)" run fails on a transient
> Pages outage and the site is stale, re-deploy by **dispatching a fresh `pages.yml`
> run** (`run_workflow`), NOT by re-running the failed job — re-running duplicates the
> `github-pages` artifact and the deploy fails a second way.

## Context

The dashboard publishes via `.github/workflows/pages.yml` ("Deploy Pages (lean)"),
which fires on push to `main`, on a `workflow_run` completion, and on
`workflow_dispatch`. It assembles a lean `_site`, asserts every browser-served path
is present, uploads a `github-pages` artifact, then calls `actions/deploy-pages`.

GitHub Pages' **deploy API** occasionally 503s independently of your code. When it
does, only the final "Deploy to GitHub Pages" step fails — the assembly and
served-path assertion already passed — so **the build is fine and the merge is on
`main`, but the site never updated** (users keep seeing the old version after a hard
refresh). The log reads:

```
##[error]Creating Pages deployment failed
HttpError: No server is currently available to service your request...
Error: Failed to create deployment (status: 503)... is githubstatus.com reporting a
Pages outage? Please re-run the deployment at a later time.
```

## The trap: rerun_failed_jobs duplicates the artifact

The obvious "re-run the deployment" is **`rerun_failed_jobs`** — and it's wrong here.
The workflow is a single `deploy` job whose steps include **"Upload Pages artifact."**
Re-running the job re-runs that upload, so the run now has **two** artifacts named
`github-pages`, and `actions/deploy-pages` refuses:

```
Error: Multiple artifacts named "github-pages" were unexpectedly found for this
workflow run. Artifact count is 2.
```

You've traded a transient failure for a deterministic one.

## The fix: dispatch a fresh run

`pages.yml` carries a `workflow_dispatch:` trigger. A fresh run has its own run id and
its own single artifact, so it deploys cleanly (once the outage clears):

```
mcp__github__actions_run_trigger  method=run_workflow  workflow_id=pages.yml  ref=main
```

It checks out `main` HEAD (`git archive HEAD`), so it publishes exactly what's merged.
Then poll the newest `pages.yml` run to `conclusion: success` (webhooks don't deliver
CI success — you must poll via the MCP github tools, not `curl`).

## Rules of thumb

- **Transient deploy-step 503 → dispatch fresh, don't rerun the job.** Reserve
  `rerun_failed_jobs` for workflows that DON'T upload a named artifact (or where a
  duplicate is harmless).
- **A green merge with a stale site = look at the deploy workflow, not the code.** The
  merge gates (TruffleHog, js-tests) are separate from the Pages deploy; a deploy
  failure won't block the merge, so the site can silently lag.
- **The same outage can hit any GitHub API call** — this session's PR creation 503'd
  twice in the same window before succeeding on retry. Retry with backoff.
