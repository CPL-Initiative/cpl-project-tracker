---
title: Lean custom GitHub Pages deploy for a large static repo (with a cron-safe trigger)
created: 2026-06-29
updated: 2026-06-29
tags: [playbook, github-pages, github-actions, deploy, infra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[pages_lean_deploy_scope]]"
artifacts:
  - .github/workflows/pages.yml
  - .nojekyll
---

# Lean custom GitHub Pages deploy for a large static repo

> **Summary** — when a static-site repo grows large, the default "Deploy from a
> branch" Jekyll build slows/hangs and publishes hundreds of MB of internal data
> the browser never fetches. Switch to a custom Actions workflow that `git archive`s
> the repo, prunes the internal-only paths, **asserts every browser-served path
> survives**, then `upload-pages-artifact` + `deploy-pages`. Trigger it on `push`
> **and `workflow_run`** (the cron link) **and `workflow_dispatch`**.

## Context

The COBI repo reached ~553 MB (generated `unified_courses_*.js`, `kb/` minted
staging, dry-run alias maps, `.xlsx` build inputs). The default Pages Jekyll build
hung on it (PR #601 added `.nojekyll` to unstick), and even succeeding it published
the whole repo. PR #602 replaced it with a custom workflow that ships only what the
browser fetches (~192 MB, −65%).

## The claim

### 1. Build step: default-include, explicit-remove, then ASSERT
- `git archive HEAD | tar -x -C _site` — exports only committed files (no `.git`,
  `node_modules`, or gitignored artifacts). Cleaner than `rsync` (no exclude soup)
  and portable.
- `rm -rf`/`rm -f` only the paths **proven internal** (verify each by grepping the
  served HTML + every browser-loaded JS for any reference). Default-include means a
  *new* served file is never silently dropped.
- A **served-path assertion** lists every must-exist file/dir and `exit 1`s if any
  is missing. This is the real safety net: an over-aggressive prune fails the deploy
  loudly instead of shipping a 404'ing site. Validate the prune offline against
  `git ls-files` first (assert 0 served files dropped).

### 2. Triggers — `workflow_run` is load-bearing for a cron-published site
A custom Pages workflow triggered only by `push` will **not** redeploy after the
daily cron commits, because **a push made with the default `GITHUB_TOKEN` does not
trigger further workflow runs** (GitHub's recursion guard). So the site silently
goes stale. Fix: also trigger on
```yaml
on:
  push: { branches: [main] }
  workflow_run: { workflows: ["<the cron workflow name>"], types: [completed] }
  workflow_dispatch:
```
`push` covers human/PR merges (real token → fires); `workflow_run` fires when the
cron workflow *completes* regardless of the push token; `workflow_dispatch` is
manual. Standard Pages job: `permissions: {pages: write, id-token: write}`,
`environment: github-pages`, `concurrency: {group: pages}`.

### 3. The one manual step
Repo **Settings → Pages → Source must be "GitHub Actions"** (no API for it). Until
flipped, the `.nojekyll` "Deploy from a branch" path keeps the site live, so merging
the workflow is zero-risk. Rollback = flip Source back to branch.

## How we got here

PR #601 (`.nojekyll`) → PR #602 (custom `pages.yml`). The `workflow_run` necessity
was caught by reading the cron's push step (`git push` with the checkout's
`GITHUB_TOKEN`) before shipping; the `workflow_run`→deploy path was then verified
green in the live Actions log. The exclude list was validated three ways: an offline
`git ls-files` classifier (0 served dropped), the live assertion, and an adversarial
per-glob verify.

## Gotchas
- `*.xlsx` is NOT uniformly safe to drop — root workbooks are build inputs, but
  `exports/*.xlsx` are user downloads. Scope the rm (`rm -f _site/*.xlsx`, not a
  recursive glob) and keep `exports/`.
- Published-site soft limit is ~1 GB; `.nojekyll` removes the *processing* cost but
  the artifact upload still scales with size — pruning helps both.
