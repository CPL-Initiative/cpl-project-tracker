---
title: Vault Auto-sync — Workstream Lessons
date: 2026-05-27
session: 11 (Bruh El)
prs: [154, 155, 156]
tags: [vault-sync, obsidian-target, powershell, task-scheduler, windows, automation]
artifacts:
  - scripts/sync-vault-clones.ps1
  - scripts/setup-task-scheduler.ps1
  - docs/kb-notes/playbook-vault-sync-setup.md
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/adr-obsidian-vault-via-clone]]"
  - "[[docs/kb-notes/playbook-vault-sync-setup]]"
  - "[[docs/kb-notes/reference-windows-powershell-gotchas]]"
---

# Vault Auto-sync — Workstream Lessons

A workstream-scratchpad doc for the in-vault auto-pull automation. Began
Session 11 with the brief: "automate the pull vault clone and push
regularly -- no need for review. Just want this to flow as part of
checkpoint."

## 2026-05-27 — Session 11 (Bruh El)

### What shipped

**PR #154** — vault auto-sync + retire the candidate/review middle state
- `scripts/sync-vault-clones.ps1` — PowerShell script that runs on Sam's
  Windows machine via Task Scheduler. Fast-forward-pulls
  `cpl-project-tracker` + `cpl-knowledge-base` from origin every N min.
  Strictly safe: never auto-merges, skips repos with uncommitted local
  work or diverged history, auto-trims its log at ~500 KB.
- `docs/kb-notes/playbook-vault-sync-setup.md` — Windows Task Scheduler
  walkthrough.
- Lane field semantics: `kb-status: candidate` retired. Sessions now
  author KB notes at `published` quality directly. The candidate→promoted
  review queue was unnecessary friction Sam empowered me to skip.

**PR #155** — ASCII hotfix
- The script's em dashes (U+2014) got mangled by PowerShell 5.1's
  Windows-1252-default codepage. Replaced 11 em dashes with `--`.
  Pure ASCII now.

**PR #156** — Task Scheduler companion
- `scripts/setup-task-scheduler.ps1` — single-paste registration of the
  scheduled task. Idempotent, `-CadenceMinutes`/`-Remove` switches,
  elevation check. Playbook updated with Option A (script) + Option B
  (GUI walkthrough).
- Documents the `[TimeSpan]::MaxValue` Task Scheduler gotcha.

End state: Sam's vault auto-syncs every 15 min. Verified via
`Get-ScheduledTaskInfo` — `LastTaskResult: 0`, `NextRunTime` ticking.

### Lessons learned

**1. PowerShell 5.1 reads scripts as Windows-1252 by default, not UTF-8.**
This bit me with em dashes. The downstream codec failure manifests as
"The string is missing the terminator" because the garbage bytes consume
or duplicate quote characters. Two fixes:
  - Pure ASCII (safest, what we shipped)
  - UTF-8 BOM (works but invisible-to-readers)
Captured as a durable KB reference at
[`docs/kb-notes/reference-windows-powershell-gotchas.md`](kb-notes/reference-windows-powershell-gotchas.md).

**2. Task Scheduler's RepetitionDuration rejects `[TimeSpan]::MaxValue`.**
The cmdlet accepts it; the XML serializer produces `P99999999DT23H59M59S`;
Task Scheduler's parser rejects with `out of range`. The fix is a
finite-but-large value (`-Days 9999` = ~27 years). Same KB reference
captures this.

**3. The script's "quiet on success" design needs explaining.**
On first verification, Sam ran the script and saw nothing new in the log.
Looked like a failure but was correct behavior: both repos were already
up-to-date because he'd manually pulled moments before. The log only
grows when something happens. The script has a commented-out heartbeat
line for users who want to *see* it firing. Documented in the playbook;
mention it whenever someone first runs the script.

**4. Verification belongs on Task Scheduler's own state, not on the log.**
`Get-ScheduledTaskInfo` returns `LastRunTime`, `LastTaskResult`,
`NextRunTime` — the canonical "did the scheduler actually fire this?"
proof. The log only proves the script *did work* when there was work
to do. Don't conflate them.

**5. Two-mode setup docs: script (fast) + GUI (visual) — script lands
the better default.**
Initial playbook gave only the GUI walkthrough. Sam asked "is this the
most efficient way?" — and no, it wasn't. Shipped a companion script
that does the registration in one paste. GUI walkthrough stays as
Option B for users who want to see each setting as it's configured.
**Generalizable**: any "user does Windows config" task should lead
with the scripted version if one exists; the GUI is a fallback, not
the primary path.

**6. Idempotency on setup scripts pays off the first time you re-run them.**
`setup-task-scheduler.ps1` checks if the task exists and `Set-`s instead
of `Register-`s. Without that, re-running with a different cadence would
error. Common pattern; cheap to write; saves a half-hour of head-scratching
later.

### Strategic roadmap

| What's next | Status |
|---|---|
| Cadence-tuning UX — maybe a slash command "set vault-sync cadence to 5 min for this week" | parked unless Sam asks |
| Cross-platform sync (macOS / Linux equivalents — launchd, systemd timer) | YAGNI for now (no peer demand) |
| Push-back from vault clone (auto-commit + push of Sam's vault-side edits) | parked — riskier than read-only pulls; needs separate scoping |

### Next concrete step

Workstream is in a clean shipped state. Auto-sync runs every 15 min.
Sam can change the cadence with the companion script's `-CadenceMinutes`
switch when his needs change. No follow-up work pending.
