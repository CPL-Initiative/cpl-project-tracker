---
title: Troubleshooting — dashboard, Pages, scrape, and the stop-hook false positives
created: 2026-08-19
updated: 2026-08-19
tags: [reference, troubleshooting, dashboard, pages, cron, scrape, stop-hook]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
---

<!-- Moved out of CLAUDE.md on 2026-08-19 (Session 171, SkyLoad) — same
     pare-down as pipeline_reference / kb_build_status / mid_lifecycle. It is
     symptom-triggered reference: you go looking for it when something is
     broken, so it does not need to be resident in every session's context.
     5,302 bytes of tax on every run, for a page nobody reads until they need it. -->

## Troubleshooting

### Dashboard not updating
1. Check the GitHub Actions run — Actions tab in GitHub
2. Check `live_metrics.json` → `scraped_at` timestamp
3. Check if commit was pushed (`git log origin/main -5`)
4. If browser shows stale content, hard-refresh (Ctrl/Cmd+Shift+R)

### Pages deploy failed / site still stale after a merge
1. The merge landed on `main` but Pages didn't publish → check the **"Deploy
   Pages (lean)"** (`pages.yml`) run for that commit (Actions tab).
2. A transient Pages **503** (`No server is currently available` / `is
   githubstatus.com reporting a Pages outage`) fails ONLY the final deploy step —
   the lean-site assembly + served-path assertion passed, so the build is fine.
3. Fix = re-deploy by **dispatching a FRESH run**:
   `mcp__github__actions_run_trigger run_workflow pages.yml ref main`. Do **NOT**
   `rerun_failed_jobs` — re-running the job re-runs the upload step, leaving TWO
   `github-pages` artifacts → `deploy-pages` fails with *"Multiple artifacts named
   github-pages"*. Playbook: [`docs/kb-notes/playbook-github-pages-manual-redeploy.md`](docs/kb-notes/playbook-github-pages-manual-redeploy.md).

### Scrape returning errors
1. Test: `https://cpl-proxy.slee-548.workers.dev/scrape?secret=CPL_SCRAPE_2026`
2. `Invalid or missing secret` → check `SCRAPE_SECRET` in Cloudflare dashboard
3. `CPL API returned 502` → CCCCO Dashboard may be down
4. `ALL COLLEGES row not found` → API response structure may have changed

### KPI values stale but date updated
- Pipeline updates the "Updated" date but only refreshes KPIs if
  `live_metrics.json` has newer data
- Check `live_metrics.json` → `scraped_at`
- If old, the scrape step failed — test the worker endpoint directly

### "Duplicate sections" / HTML growing on every run
- You've likely removed or broken the idempotency guard in
  `excel_to_dashboard.py`. Verify the strip block anchored on the
  `/* ═══ MAP Articulation Analysis Cards ═══ */` start/end markers (plus the
  legacy "MAP Exhibit Analysis Cards" pattern) still runs before re-injection.
  (There is no `EXHIBIT_CSS_MARKER` symbol in the code — don't grep for it.)

### `kpi_history.json` 1d delta shows stale comparison
- Check for date gaps in the JSON. If yesterday is missing, backfill with
  `"_interpolated": true`.

### Stop hook demands an amend on a `noreply@github.com` commit (REMOTE sessions)

**Do NOT amend. That commit is GitHub's own squash-merge, it is on `main`, and
amending it rewrites `main` — Rule 5.** The nag is a false positive.

**Why it recurs in Claude-Code-on-the-web sessions (diagnosed 2026-07-30, three
times in one session before the cause was found):** the repo ships an improved
hook at [`scripts/stop-hook-git-check.sh`](scripts/stop-hook-git-check.sh) that
excludes `noreply@github.com` (squash-merges) and
`github-actions[bot]@users.noreply.github.com` (the daily cron, #939). CLAUDE.md's
install step is `cp scripts/stop-hook-git-check.sh ~/.claude/` — **and that works
on Sam's local machine, but NOT in the remote sandbox.** The harness *re-provisions
its own copy* of `~/.claude/stop-hook-git-check.sh` (together with
`session-start-git-identity.sh`, `stop-hook-reply-gate.py`,
`user-prompt-submit-reply-reminder.py` and `launcher-settings.json` — all get the
same fresh mtime), silently reverting the repo version mid-session.

So in a remote session:
- Copying the repo hook clears the nag **until the next re-provision**, then it
  returns. Don't keep re-copying and don't treat it as newly broken.
- Check with `grep -c 'noreply@github.com' ~/.claude/stop-hook-git-check.sh` —
  `0` means the harness copy is active (the repo copy has 5).
- The correct response is always: **verify the flagged commit's committer is
  `noreply@github.com` (or the cron bot) and that it is an ancestor of
  `origin/main`, then ignore it.** `git log -1 --format='%h %ce %s' <sha>`.

**Variant — "There are N unpushed commit(s) on branch `claude/...`" (added
Session 128, 2026-08-08, after it fired twice in one session).** Same root cause,
different message, and **the answer is still: do not push.** After a squash-merge
GitHub **auto-deletes the head branch** (Sam's toggle ②), so a session that then
runs `git reset --hard origin/main` is left on a local branch whose remote is
*gone* — and the hook reads "local has commits the remote doesn't" as unpushed
work. The commit is the squash-merge itself, already on `main`. Pushing would
recreate a merged branch for nothing.

Confirm in one command, all local except the last:

```bash
git log -1 --format='%h %ce %s' HEAD                  # committer = noreply@github.com
git log origin/main..HEAD --oneline | wc -l           # 0 = nothing unpushed
git merge-base --is-ancestor HEAD origin/main && echo published
git ls-remote --heads origin <branch> | wc -l         # 0 = auto-deleted at merge
```

`git branch --unset-upstream` clears the stale tracking ref and quiets it until
the next merge. ⚠️ Wrap any networked git call in `timeout` — `git fetch --prune`
hung for the full 2-minute limit in this sandbox at least once.

### docx library errors
- Local `docx.min.js` is v8.0.4 UMD, 334KB. CDN versions were unreliable — do
  **not** switch back to CDN. To refresh the local copy:
  `npm pack docx@8.0.4`, extract, copy `umd/docx.min.js`.
