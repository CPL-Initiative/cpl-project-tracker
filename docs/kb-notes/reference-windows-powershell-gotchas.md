---
title: Reference — Windows PowerShell scripting gotchas (PS 5.1 + Task Scheduler)
created: 2026-05-27
updated: 2026-05-27
tags: [reference, powershell, windows, task-scheduler, automation, obsidian-target]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/vault_sync_lessons]]"
  - "[[docs/kb-notes/playbook-vault-sync-setup]]"
artifacts:
  - scripts/sync-vault-clones.ps1
  - scripts/setup-task-scheduler.ps1
---

# Reference — Windows PowerShell scripting gotchas (PS 5.1 + Task Scheduler)

> **One-sentence summary** — Windows PowerShell 5.1 (the default on every
> Windows install) and the Task Scheduler XML serializer each have one
> sharp edge that catches you on the first run: PS 5.1 reads `.ps1` files
> as Windows-1252 (not UTF-8), and Task Scheduler rejects
> `[TimeSpan]::MaxValue` as a RepetitionDuration value.

## Context

Sessions writing Windows-targeted automation scripts (vault sync,
scheduled jobs, system tasks) need to know two non-obvious facts to
avoid burning 30+ minutes on cryptic error messages. Both bit Session 11
while building `scripts/sync-vault-clones.ps1` and
`scripts/setup-task-scheduler.ps1`.

## The claims

### Gotcha 1 — PowerShell 5.1 reads .ps1 files as Windows-1252, not UTF-8

**Symptom**:
```
At ...script.ps1:N char:M
+ Log "Some text -- some more text"  (em dash is U+2014)
                                  ~
  The string is missing the terminator: ".
```

The error message shows mojibake (e.g. `â€"`) instead of the actual
character that caused the trip.

**Root cause**: PowerShell 5.1 (the version shipped with every Windows
install through Windows Server 2025) defaults to **Windows-1252**
encoding when reading script files unless the file has a UTF-8 BOM.
Multi-byte UTF-8 sequences decode as multi-character mojibake; if any
of those characters happens to be a quote or escape, the parser loses
track of string boundaries.

Common offenders: em dash `—` (U+2014), en dash `–` (U+2013), curly
quotes `' '` (U+2018/2019), `" "` (U+201C/201D), ellipsis `…` (U+2026).

**Fixes** (pick one):
1. **Pure ASCII** (recommended for portable scripts). Replace `—` with
   `--`, `'` with `'`, etc. The script becomes encoding-agnostic.
2. **UTF-8 BOM**. Save the file with `Set-Content -Encoding UTF8` (which
   writes a BOM in PS 5.1). VS Code: bottom-right encoding picker →
   "Save with Encoding" → "UTF-8 with BOM".
3. **PowerShell 7+ (`pwsh.exe`)**. Defaults to UTF-8. But you can't
   guarantee every user has it installed; production scripts targeting
   "any Windows machine" should not assume `pwsh`.

For this repo: option 1. Pure ASCII in all `.ps1` files; mention this
expectation in the scripts/ README if one is added.

### Gotcha 2 — `[TimeSpan]::MaxValue` is invalid as Task Scheduler's RepetitionDuration

**Symptom**:
```
Register-ScheduledTask : The task XML contains a value which is
incorrectly formatted or out of range.
(14,42):Duration:P99999999DT23H59M59S
```

**Root cause**: `[TimeSpan]::MaxValue` is ~10.7 million days. When
serialized to ISO 8601 (xs:duration), it produces
`P99999999DT23H59M59S` (99,999,999 days + 23h59m59s). The Task Scheduler
XML schema accepts a maximum value well below this — empirically,
something under `P100000DT0H0M0S` works.

**The intuitive "run forever" idiom doesn't work.**

**Fix**: use a finite-but-very-large value:
```powershell
# WRONG:
-RepetitionDuration ([TimeSpan]::MaxValue)

# RIGHT (~27 years; pragmatic "forever"):
-RepetitionDuration (New-TimeSpan -Days 9999)
```

If the task outlives 9999 days, future-you will be delighted at the
durability problem you've created. Until then, this is "forever enough."

**Why this matters**: building Task Scheduler entries via PowerShell
cmdlets is the right move (faster + auditable + scriptable vs the GUI
walkthrough). But the cmdlets don't warn about MaxValue — they happily
build the trigger object, and you only hit the wall at
`Register-ScheduledTask` when XML serialization happens.

## How we got here

**Session 11 (Bruh El, 2026-05-27)** built `scripts/sync-vault-clones.ps1`
for Sam's Obsidian vault sync. The first version had em dashes in log
messages; Sam ran it and hit Gotcha 1. Hotfixed in PR #155 by replacing
all 11 em dashes with ASCII.

Same session, Session 11 wrote a one-paste PowerShell block to create
the Task Scheduler entry. The block used `[TimeSpan]::MaxValue` for
RepetitionDuration. Sam ran it and hit Gotcha 2. Fixed inline (just
swap to `-Days 9999`). Then PR #156 bundled
`scripts/setup-task-scheduler.ps1` companion that encodes the corrected
approach.

Both gotchas surfaced within ~10 minutes of each other on the same
Windows machine. Both have a "the cmdlet accepts it but the runtime
rejects it" shape — silent-build, late-fail. The cost is exactly one
failed run per gotcha, but only if you know to look for them.

## When this applies (and when it doesn't)

**Applies**:
- Any `.ps1` script targeting Windows machines where PowerShell version
  isn't pinned to 7+.
- Any `Register-ScheduledTask` / `Set-ScheduledTask` call with a repeating
  trigger.
- Generally: PowerShell scripts edited in modern editors (VS Code, Cursor,
  etc.) that default to no-BOM UTF-8 on save.

**Does NOT apply**:
- `pwsh` (PowerShell 7+) -only scripts — those default to UTF-8.
- Task Scheduler tasks built via the GUI (the GUI computes durations
  differently and the "indefinitely" radio button just works).
- Bash / zsh / Python scripts — encoding behavior differs.

## See also

- `[[docs/vault_sync_lessons]]` — the workstream where both gotchas
  surfaced.
- `[[docs/kb-notes/playbook-vault-sync-setup]]` — the playbook now
  documents both gotchas inline (Known gotcha section).
- `scripts/setup-task-scheduler.ps1` — concrete fix for Gotcha 2
  (uses `-Days 9999`).
- PR #155 — concrete fix for Gotcha 1 (ASCII-only).

---

*Authoring check: durable (these are properties of PS 5.1 and Task
Scheduler's XML schema, neither changing soon), reusable (every Windows
PowerShell automation effort hits these eventually), distilled (two
sharp edges, both with the same "silently-builds, late-fails" shape),
self-contained (symptoms + root cause + fix per gotcha, no further
reading required to act on them).*
