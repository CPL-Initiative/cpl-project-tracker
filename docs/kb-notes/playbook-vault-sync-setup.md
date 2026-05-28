---
title: Playbook — Auto-sync vault-side repo clones via Windows Task Scheduler
created: 2026-05-27
updated: 2026-05-28
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
`C:\Users\samuel.lee\Documents\GitHub\COG-second-brain\cpl-project-tracker\`
and `...\cpl-knowledge-base\` are what Obsidian indexes. New commits land on
`origin/main` whenever a session opens + merges PRs (and the daily cron
commits its regenerated artifacts at 10:17 UTC). Without a sync mechanism,
Sam has to remember `git pull` in two folders to see new content. With this
playbook, the pulls happen on a schedule, no human in the loop.

## 2026-05-28 — canonical vault root repointed

**The sync script was pulling into the wrong directory.**
`scripts/sync-vault-clones.ps1` hardcoded `$vaultRoot` to
`%USERPROFILE%\Documents\Claude\Projects\CPLBrain\COG-second-brain`, but Sam's
actual Obsidian vault is rooted at `%USERPROFILE%\Documents\GitHub\COG-second-brain`.
The script's fast-forward pulls succeeded — but landed where Obsidian was **not**
looking, so checkpoint commits and KB notes never appeared in the vault.

The canonical root is now **`%USERPROFILE%\Documents\GitHub\COG-second-brain`**.
The script + this playbook have been repointed. To complete the cutover on the
Windows machine, Sam must:

1. **Clone the repos into the new root** if they aren't already there:
   ```powershell
   cd "$env:USERPROFILE\Documents\GitHub\COG-second-brain"
   git clone https://github.com/CPL-Initiative/cpl-project-tracker.git
   git clone https://github.com/CPL-Initiative/cpl-knowledge-base.git
   ```
   (If `Documents\GitHub\COG-second-brain\` doesn't exist yet, `mkdir` it first.
   If the clones already live there, skip this step.)

2. **Re-point / re-register the scheduled task.** The "CPL Vault Sync" task may
   still invoke the sync script from its old location. Re-run the companion
   registration script from the **new** clone so the task points at the
   repointed script (open an elevated PowerShell):
   ```powershell
   powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Documents\GitHub\COG-second-brain\cpl-project-tracker\scripts\setup-task-scheduler.ps1"
   ```
   The script is idempotent — it updates the existing task in place. (The
   repointed `sync-vault-clones.ps1` derives `$vaultRoot` from `Documents\GitHub`,
   and `setup-task-scheduler.ps1` resolves the sync script from `$PSScriptRoot`,
   so running it from the new clone wires everything to the new root.)

3. **Archive or delete the orphan clones** under the old
   `%USERPROFILE%\Documents\Claude\Projects\CPLBrain\COG-second-brain\` root (and
   any other stale parallel locations) so there's **one** source of truth. The
   old clones are no longer pulled and will silently drift stale. Either delete
   them outright or move them somewhere clearly marked archived.

After this, the next scheduled run pulls into `Documents\GitHub\COG-second-brain`
and Obsidian sees fresh content.

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
C:\Users\samuel.lee\Documents\GitHub\COG-second-brain\cpl-project-tracker\scripts\sync-vault-clones.ps1
```

(The first run requires a manual pull to land the script itself.)

### Step 2 — Test the script manually

Open PowerShell and run:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Documents\GitHub\COG-second-brain\cpl-project-tracker\scripts\sync-vault-clones.ps1"
```

Then check the log:

```powershell
Get-Content "$env:USERPROFILE\Documents\GitHub\COG-second-brain\.vault-sync.log" -Tail 10
```

You should see one timestamped line per repo (or nothing if already up-to-date).

### Step 3 — Create the scheduled task

Two paths. Pick whichever fits your taste; both produce the same task.

#### Step 3 — Option A (fast, recommended): run the companion script

The repo ships a `setup-task-scheduler.ps1` companion that creates the
scheduled task in one shot. **Open an elevated PowerShell** (Right-click
PowerShell → "Run as Administrator") and run:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Documents\GitHub\COG-second-brain\cpl-project-tracker\scripts\setup-task-scheduler.ps1"
```

That's it. Defaults to a 15-minute cadence. To use a different cadence
(e.g. every 5 min during active-session days):

```powershell
powershell -ExecutionPolicy Bypass -File "...\scripts\setup-task-scheduler.ps1" -CadenceMinutes 5
```

The script is idempotent — re-running with a new cadence updates the
existing task. To remove the task entirely:

```powershell
powershell -ExecutionPolicy Bypass -File "...\scripts\setup-task-scheduler.ps1" -Remove
```

Skip to **Step 4 — Verify** below.

#### Step 3 — Option B (visual): Task Scheduler GUI

If you prefer to see each setting as it's configured, open **Task
Scheduler** (`Win+R` → `taskschd.msc`):

1. **Action → Create Task** (NOT "Create Basic Task" — we want the full editor).
2. **General tab**:
   - **Name**: `CPL Vault Sync`
   - **Description**: Pulls cpl-project-tracker + cpl-knowledge-base from origin every 15 minutes so Obsidian picks up checkpoint commits automatically.
   - **Security options**: "Run only when user is logged on" (simplest; no password prompt). If you want it to run when locked, switch to "Run whether user is logged on or not" — you'll be asked for your password.
3. **Triggers tab → New**:
   - **Begin the task**: "At log on" (so it starts when you sign in) AND/OR "On a schedule" with "Daily / Repeat task every: 15 minutes / for a duration of: 1 day"
   - **Enabled**: ✓
4. **Actions tab → New**:
   - **Action**: Start a program
   - **Program/script**: `powershell.exe`
   - **Add arguments**: `-ExecutionPolicy Bypass -WindowStyle Hidden -NoProfile -File "%USERPROFILE%\Documents\GitHub\COG-second-brain\cpl-project-tracker\scripts\sync-vault-clones.ps1"`
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

```powershell
Get-ScheduledTaskInfo -TaskName "CPL Vault Sync" | Format-List LastRunTime, LastTaskResult, NextRunTime
```

You're looking for:
- `LastTaskResult: 0` — Win32 exit code 0 = success.
- `NextRunTime` — the cadence interval from now (e.g. ~15 min).

Fire on demand to test:

```powershell
Start-ScheduledTask -TaskName "CPL Vault Sync"
Start-Sleep -Seconds 4
Get-Content "$env:USERPROFILE\Documents\GitHub\COG-second-brain\.vault-sync.log" -Tail 5
```

The log tail confirms it ran (or stays silent if everything was already up-to-date — that's the script's "quiet on success" design).

### Known gotcha: `[TimeSpan]::MaxValue` in RepetitionDuration

If you write your own `Register-ScheduledTask` block, **do NOT use
`[TimeSpan]::MaxValue` for `RepetitionDuration`** — it serializes to a
value Task Scheduler rejects (`The task XML contains a value which is
incorrectly formatted or out of range`). Use a finite-but-large value
like `(New-TimeSpan -Days 9999)`. The companion script handles this
correctly.

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
- `scripts/sync-vault-clones.ps1` — the pull script itself.
- `scripts/setup-task-scheduler.ps1` — companion that registers the
  scheduled task (Option A of Step 3 above).
