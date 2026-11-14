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

- **The allowlist (S649, #3104).** Sam on #3104: *"yes to all recommendations"*.
  `pages.yml` exports from the commit only the paths marked `publish` in
  `.github/pages_allowlist.txt` (`git --literal-pathspecs archive HEAD -- <paths>`),
  and fails, naming each, if a listed path is not in the commit. A new file or
  folder stays off the site until it gets a line, and `tests/pages_allowlist.test.js`
  fails until it does. The `withhold` lines record the internal paths below; they
  are the old prune's patterns, and the deploy never reads them.
- **Before S649** the deploy exported every committed file and then ran `rm` on
  the internal-only paths (default-include, explicit-remove). Withheld: `docs/ tests/
  tools/ archive/ chatbox/ funding/ reflections/ nudges/ news/ scripts/ .github/
  tmc/source_data/`, root `*.xlsx`/`*.bak`, `kb/reference/*.xlsx`, the big
  `kb/coci_minted_*.json` / `kb/cid_articulation_joins.json` staging + curated
  anchors/lexicons (generator INPUTS, baked into the served `unified_courses_*.js`),
  the audit `*.md`/`*.full.json` (only `latest.json` is served), and the
  `kb/*_out` / `*_dryrun` / `*_apply` / `subj4_*` / `*_fold` re-mint output dirs.
- **Served-path ASSERTION** — fails the build loudly if any known browser-served
  path is missing from `_site`, so a missing publish line can never silently
  ship a broken site; the allowlist test checks the same list at PR time.
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

The allowlist: `git revert` its squash commit on `main`. That restores the export-then-prune
step, and the next `pages.yml` run (the revert's own push) redeploys the old way.

The whole custom deploy: flip Settings → Pages → Source back to "Deploy from a branch" (main / root). The
`.nojekyll` keeps that path fast. `pages.yml` then no-ops (its `deploy-pages` step
needs the Actions source).

## Follow-up (optional)

If the published payload should shrink further, the lazy `unified_courses_*.js`
(~110 MB across details/standalone/members/member_desc) are the next target — but
they ARE browser-fetched (CCR lazy loads), so that needs a real change (e.g. gzip
at rest + a fetch shim, or moving them to a CDN/Release asset), not an exclude.
