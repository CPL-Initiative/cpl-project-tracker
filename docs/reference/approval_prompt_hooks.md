---
title: "Approval-prompt guards — why the allowlist never worked, and where the hooks must live"
date: 2026-09-19
session: 278 (SkyWarden)
tags: [reference, hooks, permissions, settings, tooling]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/context_pressure_hook]]"
  - "[[docs/reference/lanes/org-phrase-scope-auth]]"
---

# The approval-prompt storm

Sam, 2026-09-19: *"the swarm of 'Allow Once' approval requests I am getting
yesterday and today. It's making the work unsustainable."* Then, after the
first fix shipped: *"Still getting the Allow SQL run requests--wish we could
set these to auto. Do I need to change Rule 8 to do this?"*

**No. Rule 8 is unrelated** — it governs the `cpl_memory` table (read before
you work, write at checkpoint). Nothing about it touches the prompts, and
changing it would not have helped.

## Two gates, and only one of them is reachable by config

| | what it is | does `permissions.allow` reach it? |
|---|---|---|
| Permission layer | the allow/deny/ask rules in `settings.json` | yes — that IS it |
| Auto-mode classifier | judges each call on its **content** | **no** |

⚠️ **The missing "Always allow" button was the tell all along.** The button has
nothing to offer when an allow rule already exists, so its absence says the
prompt is coming from the other gate. #1617 allowlisted five Supabase tools
and the prompts got **worse**.

**What does work:** a `PreToolUse` hook returning `permissionDecision: "allow"`
short-circuits the classifier entirely.

## ⛔ The reason it still did not work: the hooks never loaded

Claude Code reads `.claude/settings.json` from the session's **project root**.
CLAUDE.md requires all three repos attached, so the root is their common
**parent** and each repo is a subdirectory of it. Measured 2026-09-19 on a
fresh three-repo session:

```
~/.claude/projects/     ->  -home-user          (one entry: /home/user)
this repo's settings    ->  /home/user/cpl-project-tracker/.claude/settings.json
```

Nothing in that file loads. Not the `execute_sql` guard, not the SessionStart
hooks, not the PostToolUse context-budget probe. Confirmed two independent
ways:

1. An `insert into cpl_memory` that the SQL guard **denies** executed anyway.
2. `~/.claude/stop-hook-git-check.sh` carried **no trace** of
   `scripts/patch_stop_hook.py`, so SessionStart never ran either.

⚠️ **A hook that does not fire fails silently in BOTH directions** — the
prompts keep coming (no convenience) and Rule 10's write discipline is
unenforced by the harness (no restraint) — while the settings file sits in the
repo looking entirely correct. `scripts/check_hooks_live.py` reports which
world a session is in, and it cannot depend on a hook to answer, because "no
hook ran" is the case it exists to detect.

## The three guards

All default to **`ask`**. An unrecognized call, an unparseable one, or a
recognized one carrying an unknown flag falls through to the prompt, never
past it.

| Matcher | Script | Allows |
|---|---|---|
| `Bash` | `scripts/bash_read_guard.py` | `git` read subcommands, `grep`/`rg`, `sed -n`, `cat`/`head`/`tail`/`wc`/`ls`/`find`, `npm test`, `npm run sweep\|a11y`, `node tests/…`, `python3 kb/_docs_audit.py`, `kb/_build_*.py --check`, `bash scripts/check_generated.sh` |
| `mcp__Supabase__execute_sql` | `scripts/supabase_sql_guard.py` | read-only SQL, plus the one `cpl_memory` carve-out |
| `mcp__(github\|Supabase)__.*` | `scripts/allow_readonly_tool.py` | a closed list of read tools |

⚠️ **A hook returning `allow` is a REAL grant — it removes the human check
rather than deferring it.** So each guard keeps its own closed list and the
matcher only routes. Two independent things would have to be wrong for a write
to pass.

**Deliberately absent, and must stay absent:** `create_pull_request`,
`merge_pull_request`, `update_pull_request`, `add_issue_comment`,
`push_files`, `create_or_update_file`, `delete_file`, `actions_run_trigger`,
`apply_migration`, `deploy_edge_function`. Those publish, spend CI, or change a
shared table — the prompt on them is doing real work, and a comment posted to a
colleague's PR by accident cannot be recalled.

### What the Bash guard refuses, and why each case exists

The easy case is `git status`. What a token check gets wrong is everything
else, so each of these has a test:

- **the second segment of a compound command** — `git status && rm -rf /`
  splits on `&&`/`||`/`;`/`|` and every segment must pass on its own
- **redirection** — `cat a > b` writes; `>`, `>>`, `<` end the analysis
- **command substitution** — `$(…)` and backticks run something never inspected
- **a flag that flips a command's nature** — `sed -i`, `find -delete`,
  `find -exec`, `sort -o`, `git branch -D`
- **an assignment prefix** — `FOO=1 rm -rf /`, and `env` for the same reason

`git` gets a **closed list** of read subcommands, so `push`, `commit`,
`checkout`, `reset`, `restore` and `clean` are *absent* rather than denied — a
subcommand nobody thought about is asked about.

### The `cpl_memory` carve-out

The SQL guard denied **every** write verb with no exception, which blocked
Rule 8's own memory writes — measured: `insert into cpl_memory (…)` → `deny`,
`update cpl_memory set …` → `deny`. Rule 9 requires every checkpoint to write
`cpl_memory`, so wherever that hook fired the checkpoint could not complete.

The carve-out is the narrowest thing that unblocks it: a statement whose write
verbs are **only** `insert`/`update` and whose **every** write targets
`cpl_memory`. It fails closed by **counting** — three `insert` tokens with two
naming `cpl_memory` disagree, and the whole statement goes back to `deny`.
`kb_curation` is exactly what Rule 10 protects and stays behind the prompt.

## Installing them

⚠️ **A session cannot install these for itself, and should not be able to.**
The classifier refuses any write to a `.claude/settings.json` as
`[Self-Modification]` — correctly, since these hooks grant permission. That
decision belongs to a person.

```
python3 scripts/install_prompt_guards.py            # dry run, shows the plan
python3 scripts/install_prompt_guards.py --apply    # writes <root>/.claude/settings.json
```

It merges rather than overwrites, and a re-run replaces its own blocks instead
of duplicating them. Paths are written **absolute** on purpose:
`CLAUDE_PROJECT_DIR` points at the session root, which in a multi-repo session
is the parent of this repo, so `"$CLAUDE_PROJECT_DIR/scripts/…"` would resolve
to nothing.

⚠️ **Hooks bind at SESSION START.** Running the installer mid-session changes
nothing about the session that ran it. Start a new one, then confirm:

```
python3 scripts/check_hooks_live.py
```

## What is still not solved

- **The web runner is ephemeral.** Anything written outside the three repos is
  gone when the container is reclaimed, so the installer has to run again each
  time — or the root settings need to come from somewhere durable. A
  per-machine install (the pattern
  `scripts/install-three-repo-check.ps1` already uses) covers Sam's local
  machine but not a fresh cloud session.
- **`permissions.allow` is kept in the repo settings with a comment saying it
  does not work**, rather than deleted, so the next session does not re-add it
  expecting a different result.
