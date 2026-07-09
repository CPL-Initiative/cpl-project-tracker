---
title: Lean custom GitHub Pages deploy — scope + served-path manifest
date: 2026-06-29
session: 84 (SkyScribe)
tags: [cobi, github-pages, deploy, infra, scope]
artifacts:
  - .github/workflows/pages.yml
  - .nojekyll
related:
  - docs/project_lifecycle_lessons.md
---

# Lean custom GitHub Pages deploy

## Why

The repo grew to ~553 MB; ~357 MB of it is **internal `kb/` staging + provenance +
dry-run alias maps + build inputs** the browser never fetches. Publishing all of
it on every push was wasteful (and previously hung the default Jekyll build —
fixed first with `.nojekyll`, PR #601). This replaces "Deploy from a branch" with
a **custom Pages Actions workflow** that publishes only the browser-served files.

**Result (validated against the committed file list):** the published site goes
from ~553 MB → **~192 MB (−357 MB, ~65% smaller)**, with **0 served files dropped**
(all 54 root `*.js`, every lazy asset, every served `kb/*.json`, `fact-sheet/`,
`kb-portal/`, `exports/`, `reports/`, `tmc/source_pdfs/` kept).

## The one manual step (Sam) — DONE 2026-06-29

**Settings → Pages → Source = "GitHub Actions"** (there is no API for this). Until
it's flipped, the `.nojekyll` "Deploy from a branch" build keeps the site live, so
merging `pages.yml` is zero-risk. Once flipped, `pages.yml` is the deployer.

## How `pages.yml` works

- **`git archive HEAD | tar -x`** into `_site` — exports only committed files (no
  `.git`, `node_modules`, or gitignored junk like `*.full.json`).
- **`rm`** the internal-only paths (default-INCLUDE, explicit-remove — so a *new*
  served file is never accidentally dropped). Removed: `docs/ tests/
  tools/ archive/ chatbox/ funding/ reflections/ nudges/ news/ scripts/ .github/
  tmc/source_data/`, root `*.xlsx`/`*.bak`, `kb/reference/*.xlsx`, the big
  `kb/coci_minted_*.json` / `kb/cid_articulation_joins.json` staging + curated
  anchors/lexicons (generator INPUTS, baked into the served `unified_courses_*.js`),
  the audit `*.md`/`*.full.json` (only `latest.json` is served), and the
  `kb/*_out` / `*_dryrun` / `*_apply` / `subj4_*` / `*_fold` re-mint output dirs.
- **Served-path ASSERTION** — fails the build loudly if any known browser-served
  path is missing from `_site`, so an over-aggressive prune can never silently
  ship a broken site. This is the real safety net behind the exclude list.
- **`actions/upload-pages-artifact` + `actions/deploy-pages`**.

## Trigger model (all three load-bearing)

| Trigger | Covers |
|---|---|
| `push: [main]` | human / PR merges (real token → DO fire workflows) |
| `workflow_run: ["Daily CPL Dashboard"]` | the daily cron pushes with `GITHUB_TOKEN`, which by design does **not** fire `push` workflows — so we redeploy when the cron workflow completes |
| `workflow_dispatch` | manual |

The `workflow_run` trigger is the critical one: without it, the daily regen would
update `main` but never redeploy Pages → a silently stale site.

## How the served list was derived

A verification workflow fanned out parallel readers over every reference lens
(static HTML `<script>`/`<img>`/CSS, dynamic `fetch()`/lazy `loadScript()`, the
standalone sub-pages, a directory inventory + the cron `git add` list), synthesized
an include/exclude manifest, then **adversarially verified each excluded glob**
against the served surface (grep every served HTML/JS for any reference). 10 globs
confirmed `safe_to_exclude` (no served reference); the served `kb/*.json` keep-list
was enumerated explicitly. A local classifier re-checked the prune against all 923
committed files: **0 served files dropped**.

## Rollback

Flip Settings → Pages → Source back to "Deploy from a branch" (main / root). The
`.nojekyll` keeps that path fast. `pages.yml` then no-ops (its `deploy-pages` step
needs the Actions source).

## Follow-up (optional)

If the published payload should shrink further, the lazy `unified_courses_*.js`
(~110 MB across details/standalone/members/member_desc) are the next target — but
they ARE browser-fetched (CCR lazy loads), so that needs a real change (e.g. gzip
at rest + a fetch shim, or moving them to a CDN/Release asset), not an exclude.
