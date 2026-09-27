---
title: Context-pressure hook — install and mechanics
date: 2026-08-29
tags: [reference, tooling, checkpoint, context]
artifacts:
  - kb/_context_budget.py
  - scripts/context-pressure-hook.sh
  - scripts/install-context-hook.ps1
  - scripts/install_prompt_guards.py
  - scripts/check_hooks_live.py
  - tests/context_budget_test.py
  - tests/install_prompt_guards_test.py
related:
  - docs/kb-notes/methodology-context-pressure-is-measurable.md
---

# Context-pressure hook — install and mechanics

PULL-side detail for **`CLAUDE.md` Rule 9a**. The rule carries what a session
cannot know to ask for (that the meter exists, the two thresholds, the emergency
list). This carries what you look up when you actually install it.

## Install

The route depends on where the session is rooted.

**A session rooted at this repo** loads the repo's own `.claude/settings.json`,
which carries the hook as a `PostToolUse` entry beside the two `SessionStart`
hooks:

```json
"PostToolUse": [ { "matcher": "*", "hooks": [
  { "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/kb/_context_budget.py\" --hook" }
] } ]
```

`tests/context_budget_test.py` fails if the entry leaves the file.

**A three-repo cloud session** roots at the parent of the clones and loads
nothing from that file (`scripts/check_hooks_live.py` records the measurement).
There `scripts/install_prompt_guards.py` writes the same hook into the session
root's settings, with an absolute path, beside the approval-prompt guards. The
environment's setup script runs it when the snapshot is built, and
`check_hooks_live.py --fix`, the first command of every session, adds the meter
alone (`--meter-only`) to a root that lacks it. The meter grants no permission,
so that repair leaves the guards and the allow list as it found them;
`tests/install_prompt_guards_test.py` pins both. The checker's LIVE line reads
`context meter: yes` once the hook is in place.

⚠️ **Why both.** On 2026-09-11 a 15-hour remote session (385 tool calls, about
1,200 tokens a turn, no single large read) compacted at 785,955 tokens with the
meter never having run once: nothing computed "tokens left" until it was run by
hand afterwards, and Rule 9's commit-count proxy read zero because the handoff
had just been touched inside a PR. The fallback ceiling was right to within 122
tokens; installed, the meter would have warned about ten turns early. Sam:
*"make it so."* The fix that day put the hook in the repo's settings, which
reach a session rooted at the repo and not the three-repo cloud session that
failed. The CLAUDE.md prompt audit found the gap (2026-09-27, finding F1), and
Sam's verdict on its sheet, card 1, added the root install.

**Per machine.** The routes below register the hook at user level on a local
machine. They are harmless beside the others: announce-once is keyed by
session, so two installs do not double-warn.

**Windows** (Sam's machine — Windows PowerShell **5.1**, not 7):

```powershell
cd $env:USERPROFILE\Documents\GitHub\cpl-project-tracker
git checkout main
git pull
powershell -ExecutionPolicy Bypass -File scripts\install-context-hook.ps1
```

Add `-RepoPath C:\path\to\cpl-project-tracker` if the clone is elsewhere. The
script is idempotent: it backs up `settings.json` with a timestamp, **merges**
into any existing `hooks` block, and verifies by running the meter.

**macOS/Linux:**

```bash
cp scripts/context-pressure-hook.sh ~/.claude/context-pressure-hook.sh
chmod +x ~/.claude/context-pressure-hook.sh
```

then add the following to **the CONTENTS of `~/.claude/settings.json`** —
⚠️ **a file to edit, NOT a command to paste into a shell.** Pasted into
PowerShell it errors with *"Unexpected token ':'"*, which is how Sam met it on
2026-08-29:

```json
{ "hooks": { "PostToolUse": [ { "matcher": "*", "hooks": [
    { "type": "command", "command": "~/.claude/context-pressure-hook.sh" }
] } ] } }
```

**Verify either route** with `python3 kb/_context_budget.py`. It should report
YOUR live context. An implausible number means the calibration is wrong, and a
wrong warning is worse than none.

## Why the logic is in Python, not the shell script

The first version did the work in bash with `jq`. Windows has neither, and Git
Bash only sometimes. Worse, **a hook that cannot parse its input fails silently**,
which is indistinguishable from a quiet session — the exact failure the tool
exists to prevent, reintroduced by its own installer.

So `kb/_context_budget.py --hook` holds the measurement, the announce-once state,
the warning text and the fail-soft guarantee. `scripts/context-pressure-hook.sh`
is a two-line wrapper that finds the repo and pipes stdin through; Windows skips
it entirely.

## PowerShell 5.1 traps the installer works around

⚠️ **PowerShell cannot be executed in the agent sandbox**, so the script is
reviewed, not run. Three bugs found by reading it, all 5.1-only:

| Trap | Consequence |
|---|---|
| `ConvertFrom-Json -AsHashtable` is PowerShell **6+** | parameter-binding error on 5.1 |
| `ConvertTo-Json` defaults to `-Depth 2` | silently flattens the nested hooks block to the literal string `System.Object[]` — a corrupted file that still parses as JSON |
| `Set-Content -Encoding UTF8` | emits a BOM, which can break a strict JSON reader |

Also: the pre-flight check must accept exit codes **0, 1, 3 and 4**. The meter
exits 3 at WARN and 4 at EMERGENCY, so rejecting anything `> 1` would refuse to
install for exactly the user who needs it most.

## Behavior

- **PostToolUse**, not UserPromptSubmit: the failure mode is a long agentic run
  with no human turn, which a per-prompt hook sleeps straight through.
- **Announce-once per threshold**, keyed by session id, escalating WARN →
  EMERGENCY. A hook that shouts on every tool call gets tuned out.
- **Fail soft, always** — missing transcript, garbage stdin, meter not found:
  every path exits 0. Exit **2** is what surfaces the message to the session.
- **Self-calibrating**: the ceiling comes from any `compact_boundary` the
  transcript has actually seen (`auto` triggers only — a manual `/compact` is not
  evidence of the automatic ceiling). `OBSERVED_COMPACT_AT` is only the fallback.
