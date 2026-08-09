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

---

## 2026-08-09 — Sky: the vault was never slow, and four bugs only real hardware found

### What happened

Sam pasted an X post surveying ten "Claude + Obsidian memory" repos and asked
which were worth adopting. The answer was **one of ten** (kepano's skills), and
the more useful finding was that eight of the ten solve *retrieval* while this
corpus's actual problem is *accretion*. That produced `kb/_docs_audit.py` — the
docs lint pass, wired as step 0 of `/checkpoint` (#1071, #1076).

The thread then turned into a vault-performance investigation, and every
conclusion along the way needed correcting at least once.

### What's been learned

**1. The exclusion list was the wrong instrument, and the documentation lied.**
`CLAUDE.md` claimed `unified_courses_*.js` and `cip_fitcheck/` were excluded in
Obsidian; the live `app.json` excluded neither — 164 MB. Worse, exclusion is a
**relevance** filter: it drops paths from search, graph and link autocomplete
but never stops the file watcher, metadata cache, or Sync. We shipped the
exclusions anyway (CPLBrain#30, 11 -> 49 filters) and they were the wrong fix.

**2. The right fix was a docs-only sparse checkout.** 1,775 files / 1,037 MB ->
**455 files / 10.2 MB** on Sam's machine (`scripts/sparse-vault-clone.ps1`,
#1077). The counter-intuitive part: `kb/row_audit/` is **418 MB of MARKDOWN** —
80 daily auditor receipts at ~7.2 MB each — so a "materialise `**/*.md`" rule
would have kept 423 MB and looked like it worked. Scope by LANE, not extension.

**3. The vault was never slow. Graph view was blank.** Two weeks of it, never
reported as a problem. The file explorer always worked. So the entire
performance investigation was aimed at a symptom Sam did not have.

**4. And the graph fix was the SIZE, not the setting I blamed.** `graph.json`
carries `linkDistance: 250` against a default of 30, which at ~700 nodes
spreads the layout ~70x and puts the viewport in empty space. Plausible,
specific, and **wrong** — Sam never changed it, and the graph came back after
the sparse checkout alone. The real cause is almost certainly the metadata
cache: 418 MB of markdown parsed and held so graph view can build its link
index. ⚠️ `linkDistance: 250` is therefore still live and untested; it stays a
latent risk as the vault grows.

### The pattern this run kept repeating

Five diagnoses, each plausible, each wrong until checked against reality:

| I said | It was |
|---|---|
| 52 KB notes are malformed | 3 are; the rest use a valid sibling dialect |
| exclude `docs/` (heavy) | that hides the corpus the tool protects |
| receipts churn from a timestamp | also self-reference — the scan counted its own output |
| the DryRun is still running | it could not parse at all |
| `linkDistance` blanked the graph | the 418 MB metadata load did |

**Three of the five were found only by Sam running things on real hardware** —
the missing `/scripts/` pattern (which would have deleted the Task Scheduler's
own target and silently killed vault sync), the 60-second silent hang, and the
em dashes that made all three `.ps1` files unparseable under Windows
PowerShell 5.1.

### Current state

Sync runs hourly with **no console window** (S4U principal — `-WindowStyle
Hidden` never fixed that; the missing principal was the cause), smoke-tested
green on Sam's machine. Vault clone is sparse at 10.2 MB. Docs audit is clean
on `superseded_handoff`, `frontmatter_log_chain` and `kb_note_frontmatter`.
COG skills 22 -> 16 (8 retired as structurally unable to run). Obsidian skills
live in the repos rather than one laptop.

### Next concrete step

Lower `linkDistance` 250 -> 30 in the graph pane (gear -> Forces). It is the
one known-bad setting still in place, and it costs five seconds. Then, if the
graph stays healthy, commit the value to `CPLBrain/.obsidian/graph.json` so it
is version-controlled rather than machine-local.
