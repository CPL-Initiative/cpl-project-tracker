---
title: Playbook — Auto-sync vault-side repo clones via Windows Task Scheduler
created: 2026-05-27
updated: 2026-05-27
tags: [playbook, obsidian-target, vault-wiring, windows, automation, knowledge-base]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/adr-obsidian-vault-via-clone]]"
artifacts:
  - scripts/sync-vault-clones.ps1
---

# Playbook — Auto-sync vault-side repo clones via Windows Task Scheduler

> **One-sentence summary** — A scheduled task on the curator's machine
> runs `scripts/sync-vault-clones.ps1` every N minutes, fast-forward-pulling
> `cpl-project-tracker` and `cpl-knowledge-base` so checkpoint commits flow
> into Obsidian without manual `git pull`.

## Why this exists

The repo clones at
`C:\Users\samuel.lee\Documents\Claude\Projects\CPLBrain\COG-second-brain\cpl-project-tracker\`
and `...\cpl-knowledge-base\` are what Obsidian indexes. New commits land on
`origin/main` whenever a session opens + merges PRs (and the daily cron
commits its regenerated artifacts at 10:17 UTC). Without a sync mechanism,
Sam has to remember `git pull` in two folders to see new content. With this
playbook, the pulls happen on a schedule, no human in the loop.

## What the script does (and explicitly does NOT do)

The script (`scripts/sync-vault-clones.ps1`) is **strictly safe**:

| Behavior | Yes / No |
|---|---|
| `git fetch origin main` | ✓ |
| `git pull --ff-only` if behind | ✓ |
| Log a one-liner per repo to `.vault-sync.log` | ✓ |
| Auto-merge on conflict | **NO** |
| Auto-rebase | **NO** |
| Force-push or force-pull | **NO** |
| Touch a repo with uncommitted local work | **NO — skips with warning** |
| Push back to origin from the vault clone | **NO** |

If you've made local edits in the vault clone (rare — most edits happen
in `Documents\GitHub\` or via session PRs), the script bails on that repo
with a "SKIP — uncommitted change(s)" log entry. Same if the vault clone
has diverged (ahead AND behind origin). Neither situation gets clobbered.

## One-time setup

### Step 1 — Verify the script is in place

After the next `git pull` of `cpl-project-tracker`, the script will be at:

```
C:\Users\samuel.lee\Documents\Claude\Projects\CPLBrain\COG-second-brain\cpl-project-tracker\scripts\sync-vault-clones.ps1
```

(The first run requires a manual pull to land the script itself.)

### Step 2 — Test the script manually

Open PowerShell and run:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Documents\Claude\Projects\CPLBrain\COG-second-brain\cpl-project-tracker\scripts\sync-vault-clones.ps1"
```

Then check the log:

```powershell
Get-Content "$env:USERPROFILE\Documents\Claude\Projects\CPLBrain\COG-second-brain\.vault-sync.log" -Tail 10
```

You should see one timestamped line per repo (or nothing if already up-to-date).

### Step 3 — Create the scheduled task

Open **Task Scheduler** (`Win+R` → `taskschd.msc`).

1. **Action → Create Task** (NOT "Create Basic Task" — we want the full editor).
2. **General tab**:
   - **Name**: `CPL Vault Sync`
   - **Description**: Pulls cpl-project-tracker + cpl-knowledge-base from origin every N minutes so Obsidian picks up checkpoint commits automatically.
   - **Security options**: "Run only when user is logged on" (simplest; no password prompt). If you want it to run when locked, switch to "Run whether user is logged on or not" — you'll be asked for your password.
3. **Triggers tab → New**:
   - **Begin the task**: "At log on" (so it starts when you sign in) AND/OR "On a schedule" with "Daily / Repeat task every: 15 minutes / for a duration of: 1 day"
   - **Enabled**: ✓
4. **Actions tab → New**:
   - **Action**: Start a program
   - **Program/script**: `powershell.exe`
   - **Add arguments**: `-ExecutionPolicy Bypass -WindowStyle Hidden -File "%USERPROFILE%\Documents\Claude\Projects\CPLBrain\COG-second-brain\cpl-project-tracker\scripts\sync-vault-clones.ps1"`
5. **Conditions tab**:
   - **Power**: Uncheck "Start the task only if the computer is on AC power" (unless you want laptop-on-battery to skip)
   - **Network**: Check "Start only if the following network connection is available: Any connection"
6. **Settings tab**:
   - ✓ "Allow task to be run on demand"
   - ✓ "If the task fails, restart every: 5 minutes / Attempt to restart up to: 3 times"
   - ✓ "Stop the task if it runs longer than: 5 minutes"
   - "If the task is already running, then the following rule applies: Do not start a new instance"
7. **OK** — confirm with your Windows password if prompted.

### Step 4 — Verify the task fires

Right-click the task in Task Scheduler → **Run**. Wait a few seconds, then
check the log file. You should see a timestamped entry from the manual run.

## Cadence recommendations

| Cadence | When to use |
|---|---|
| **Every 5 minutes** | Active session — you want fresh content while a Claude Code session is open and merging PRs. |
| **Every 15 minutes** | Normal day — picks up the 10:17 UTC daily cron within 15 minutes, picks up ad-hoc merges fast enough. |
| **Every 60 minutes** | Quiet weeks — minimal background activity. |

You can also right-click the task and **Run** at any time for an immediate pull.

## Reading the log

`.vault-sync.log` at the vault root carries one line per repo per run:

```
2026-05-27 18:00:01  [cpl-project-tracker] pulled 3 commit(s) from origin/main
2026-05-27 18:00:02  [cpl-knowledge-base] up-to-date
```

Unusual entries to watch for:

- `SKIP — N uncommitted change(s)` — you have unsaved work in that vault
  clone. Either commit/push it (via the normal flow), or move the edits
  to your `Documents\GitHub\` clone.
- `DIVERGED — N ahead, M behind` — the vault clone has commits not on
  origin AND origin has commits not on the vault clone. Manual merge
  needed; the script doesn't touch this case.
- `ERROR — git fetch failed (network or auth)` — usually transient. If
  persistent, check the repo's git remote URL and your stored credentials.

The log is auto-trimmed when it exceeds ~500 KB.

## Disabling temporarily

Right-click the task in Task Scheduler → **Disable**. Re-enable when ready.
The script itself doesn't need editing — it just stops getting invoked.

## Extending to other repos

If you later add a third vault-side clone (a peer project, etc.), open the
script and add the folder name to the `$repos` array near the top. Re-running
the task picks it up. No Task Scheduler change needed.

## When the script encounters something it can't safely handle

Three scenarios get logged-and-skipped:
1. **Uncommitted local work** — finish or stash it; the script won't touch
   the repo until the working tree is clean.
2. **Diverged history** — manual merge needed. Open the vault clone in a
   terminal and resolve.
3. **Network or auth error** — the script logs and moves on; the next run
   tries again. If it persists, check `git remote -v` + your credential
   helper.

In all three cases, **the vault clone's content is preserved exactly as it
was**. The script's worst-case behavior is "do nothing, log a warning."

## See also

- `[[docs/kb-notes/adr-obsidian-vault-via-clone]]` — why the vault-side
  clone pattern exists at all.
- `[[CLAUDE]]` "Obsidian vault wiring" section — canonical paths + lane model.
- `scripts/sync-vault-clones.ps1` — the script itself.
