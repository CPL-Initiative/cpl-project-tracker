---
title: Playbook — purge committed PII from git history (CustomReport_latest.json)
created: 2026-06-01
updated: 2026-06-01
tags: [playbook, security, pii, git-history, incident-response, rule-5-override]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/reference-codebase-audit-2026-06-01]]"
artifacts:
  - .gitignore
  - fetch_custom_report.py
  - .github/workflows/daily-dashboard.yml
---

# Playbook — purge committed PII from git history

> **One-sentence summary** — the forward-stop (PR #227) removed `CustomReport_latest.json` from `main`'s tree and stopped re-committing it, but the **student/staff PII still lives in historical commits** on this public repo; this is the deliberate, coordinated `git filter-repo` + force-push procedure to remove it, executed by **Sam** (it overrides Rule 5).

## Context

`CustomReport_latest.json` (85 MB) was committed to the public repo and re-committed daily, exposing ~48k student names (≈30k IDs, ≈22.8k birthdates) + staff contacts (Session 26 audit SEC-10). **PR #227 stopped all FUTURE exposure** (gitignore + `git rm --cached` + dropped the workflow `git add` + trimmed the fetch). What remains is the **8 historical commits** that still carry the file. Removing those requires rewriting history and **force-pushing `main`** — which Rule 5 normally forbids (Pages serves from `main`), so this is a one-time, authorized, maintenance-window operation. Sam chose "prep now, you force-push" (2026-06-01).

**Scope (audited):** only `CustomReport_latest.json` was ever committed — no dated `CustomReport_YYYY-MM-DD.json` variants. It appears in **8 commits**; `.git` is ~176 MB (the blobs dominate; the purge will shrink it substantially).

## Pre-flight checklist

1. **Confirm the forward-stop is merged** (PR #227 on `main`) — otherwise the next daily run re-commits the file and undoes the purge. ✅ (merged 2026-06-01).
2. **Pause the daily cron during the purge** to avoid a race (two writers to `main`, CLAUDE.md Rule 6): in GitHub → Actions → "Daily Dashboard" → **Disable workflow** for the duration (re-enable after). The job is idempotent, so a missed run is safe (backfill `kpi_history` per Rule 3 if a day is skipped).
3. **Full backup first** — keep a mirror clone you do NOT rewrite, in case rollback is needed:
   `git clone --mirror https://github.com/CPL-Initiative/cpl-project-tracker.git cpl-backup.git`
4. **Check for forks** (org → repo → Forks). Forks retain the old history independently; the PII persists there until each fork owner re-syncs or deletes. Note any.
5. **Warn collaborators** — after the force-push, every existing clone/branch has divergent history and must re-clone (or hard-reset). Open PRs based on pre-rewrite commits will show wrong diffs and likely need to be re-created.
6. **Install the tool**: `pip install git-filter-repo` (the maintained successor to `filter-branch`/BFG; do NOT use `filter-branch` — slow + footgun-prone).

## The purge (`git filter-repo`)

`git filter-repo` requires a **fresh clone** (it refuses to run on a repo with a configured remote, by design):

```bash
git clone https://github.com/CPL-Initiative/cpl-project-tracker.git cpl-purge
cd cpl-purge

# Remove the file from ALL commits, all branches, all tags.
# Use the glob form to also catch any dated variant if one ever slipped in.
git filter-repo --invert-paths --path CustomReport_latest.json --path-glob 'CustomReport_*.json'

# Verify it's gone from every commit (should print nothing):
git log --all --oneline -- CustomReport_latest.json
# Confirm the repo shrank:
du -sh .git
```

`filter-repo` rewrites every commit (dropping the blob) → **all commit SHAs after the first touch change**, and it **removes the `origin` remote** as a safety measure.

## Force-push to `main` (Rule 5 override)

```bash
git remote add origin https://github.com/CPL-Initiative/cpl-project-tracker.git
git push --force origin main
# If other branches/tags should also be cleaned (e.g. long-lived branches):
git push --force --all origin
git push --force --tags origin
```

Pages will redeploy from the rewritten `main`. ⚠ This is **irreversible on the remote** once pushed (that's what the mirror backup is for).

## Post-purge

1. **Re-clone everywhere** — the session container, Sam's local, the Obsidian vault clone (`scripts/sync-vault-clones.ps1` fast-forward-pulls, which will FAIL on diverged history → it'll skip/log; do a fresh clone there). Any other working copy must re-clone.
2. **GitHub caches unreachable objects** — the blob may still be reachable via old commit SHAs on `raw.githubusercontent.com` and the commit/PR UI for a while. **Open a GitHub Support request** ("we force-removed sensitive data from history; please purge cached views + the unreachable objects") to expedite; GitHub can also break the `?` cached blob URLs.
3. **Forks** — ask any fork owners to delete/re-sync (the PII persists in forks until they do).
4. **Re-enable the daily workflow** (un-pause from pre-flight step 2). Confirm the next run commits cleanly **without** `CustomReport_latest.json` (the forward-stop guarantees this).
5. **Verify the public surface 404s the file**:
   - `https://cpl-initiative.github.io/cpl-project-tracker/CustomReport_latest.json` → 404
   - `https://raw.githubusercontent.com/CPL-Initiative/cpl-project-tracker/main/CustomReport_latest.json` → 404

## Risks / caveats

- **All commit SHAs change** → any external reference to a commit hash (links, notes) breaks.
- **Open PRs** based on pre-rewrite history get confused diffs — re-create them from fresh branches.
- **Forks + existing clones** retain the PII until re-synced/deleted (out of our direct control).
- The exposure already happened (the window from first commit → purge). The data is **student PII (names/DOB/IDs) — it cannot be "rotated."** Document the exposure window + datasets for any required incident/FERPA notification; this is Sam's institutional call.

## Why Rule 5 is overridden here

Rule 5 ("never force-push `main`") exists because Pages serves from `main` and the daily cron pushes there concurrently. For this **one-time, coordinated, cron-paused, backed-up** purge of an active PII exposure, the override is the lesser harm and is explicitly authorized. Re-lock Rule 5 immediately after.

## See also

- PR `#227` — the forward-stop (gitignore + untrack + payload trim)
- `[[docs/kb-notes/reference-codebase-audit-2026-06-01]]` — SEC-10, where this was found
- `git filter-repo` docs: https://github.com/newren/git-filter-repo
