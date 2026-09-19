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

## ⛔ The diagnosis this repo carried was wrong

Handoff 278 and #1623 held that `permissions.allow` **cannot** stop auto mode's
prompts, because the classifier judges each call on its content and an allow
rule has nothing to offer it. That is not what the classifier does. Its
[documented decision order](https://code.claude.com/docs/en/permission-modes)
begins:

> 1. **Actions matching your allow, ask, or deny rules resolve immediately**

**Allow rules work in auto mode.** Sam's allowlist never failed — it never
**loaded**. One cause, not two, and the elaborate mechanism built on the wrong
half was larger than the problem.

⚠️ **This is the second time in one session that an inherited claim was acted
on before being checked** (the other: a stale `origin/main` that made a working
gate look broken). Both cost real work. The rule earned twice over: **verify
the premise before building on it**, especially when it arrives from a handoff
written under context pressure.

### What auto mode DOES drop

On entering auto mode, a short list of allow rules is dropped — and the split
is what decides the design:

| Dropped | Kept |
|---|---|
| blanket `Bash(*)`, `PowerShell(*)` | narrow rules like `Bash(npm test)` |
| wildcarded interpreters (`Bash(python*)`) | **MCP tool rules** |
| package-manager run commands, `Agent`, `Monitor` | |

So an MCP read tool needs only a rule. Arbitrary-argument Bash needs a hook,
because the blanket form is dropped and the narrow form cannot enumerate
`git status` with any arguments.

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

## What gets installed: mostly rules, two hooks

| Mechanism | Covers | Why this one |
|---|---|---|
| `permissions.allow` | ~32 read-only `mcp__github__` and `mcp__Supabase__` tools | Read-only by nature, nothing to inspect per call, and MCP rules survive auto mode |
| `Bash` hook | `git` read subcommands, `grep`/`rg`, `sed -n`, `cat`/`head`/`tail`/`wc`/`ls`/`find`, `npm test`, `npm run sweep\|a11y`, `node tests/…`, `python3 kb/_docs_audit.py`, `kb/_build_*.py --check`, `bash scripts/check_generated.sh` | Blanket Bash rules are dropped; arbitrary arguments cannot be enumerated |
| `execute_sql` hook | read-only SQL, plus the `cpl_memory` carve-out | ⚠️ See below |

⚠️ **`execute_sql` IS DELIBERATELY NOT IN `permissions.allow`.** An allow rule
"resolves immediately", which would skip the guard and auto-approve **writes**
as well — exactly what #1617 did, and exactly what Rule 10 exists to prevent.
The hook can read the statement; a rule cannot.

⚠️ **A hook returning `allow` is a REAL grant — it removes the human check
rather than deferring it.** Both hooks default to `ask`: an unrecognized call,
an unparseable one, or a recognized one carrying an unknown flag falls through
to the prompt, never past it.

**Deliberately absent from the allow list, and must stay absent:**
`create_pull_request`, `merge_pull_request`, `update_pull_request`,
`add_issue_comment`, `push_files`, `create_or_update_file`, `delete_file`,
`actions_run_trigger`, `apply_migration`, `deploy_edge_function`. Those
publish, spend CI, or change a shared table — the prompt on them is doing real
work, and a comment posted to a colleague's PR by accident cannot be recalled.

⚠️ **AND THE MODE ITSELF IS NOT THE PROBLEM.** Auto mode is the lowest-prompt
mode there is ("everything, with background safety checks"). `acceptEdits`
auto-approves only reads, file edits and basic filesystem commands, so every
Bash and MCP call would prompt — *more* prompts, not fewer. `plan` cannot do
the work. Stay on auto; fix where the settings live.

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

## ⚠️ What the documentation says, and it settles this

Sam, 2026-09-19: *"I need a persistent solution rather than ephemeral."* The
installer above writes to the session root, which on the cloud runner is
`/home/user` — outside all three repos and reclaimed with the container. The
official docs
([Settings in cloud sessions](https://code.claude.com/docs/en/settings#settings-in-cloud-sessions))
say why, and rule out a second approach as well:

> **Shared project settings** (`.claude/settings.json`): read in a session with
> one repository… **A session with several repositories starts above the
> clones, so from each repository's `.claude/settings.json` it loads only the
> plugins and marketplaces the file declares, not permission rules, hooks,
> `env`, or other keys.**

> **User and project local settings** (`~/.claude/settings.json` and
> `.claude/settings.local.json`): **not read.**

So the measurement was not a quirk of this runner — it is documented behavior.
And `~/.claude/settings.json` is not a fallback: cloud sessions never read it.

⚠️ **THE THREE-REPO RULE AND HOOKS-FROM-THE-REPO ARE MUTUALLY EXCLUSIVE.**
CLAUDE.md requires all three attached; that requirement is what puts the
session root above the clones. Any fix has to accept one or change the other.

### The persistent options, with what is actually known about each

| | Where it lives | Persistent? | Confidence |
|---|---|---|---|
| **Server-managed settings** (claude.ai admin console) | the organization | yes, org-wide | **Documented to reach cloud sessions.** Owner-level change |
| **Cloud environment setup script** | the environment config | yes, runs at every container start | **Documented.** Writes the root settings before the session begins |
| **Environment variables** on the environment | the environment config | yes | Documented, but a narrower lever than hooks |
| **Package the guards as a PLUGIN** | committed in this repo | yes, git-tracked | ⚠️ **Promising, unverified** — see below |
| Single-repo session | n/a | n/a | Repo settings load fully, but it gives up the three-repo rule |

⭐ **THE PLUGIN ROUTE IS THE ELEGANT ONE AND IS NOT YET PROVEN.** Plugins may
carry hooks (`hooks/hooks.json`, the same shape as the `hooks` block here), a
marketplace source may be a **local path**, and plugins are precisely what a
multi-repo session still loads from a repo's settings — so guards committed to
this repo would survive every fresh clone. The doubt is one sentence in
[Discover plugins](https://code.claude.com/docs/en/discover-plugins#configure-team-marketplaces):
a plugin *"that comes from an external source such as a GitHub repository or
npm package doesn't load until the team member installs it."* Whether a
local path inside the clone counts as external decides whether this works
unattended. **Test it before relying on it.**

## Still open

- **`permissions.allow` is kept in the repo settings with a comment saying it
  does not work**, rather than deleted, so the next session does not re-add it
  expecting a different result.
- ⚠️ **Auto mode is the classifier.** Sam turned it on 2026-09-18 to reduce the
  prompts, and it is what produces the ones that cannot be suppressed by an
  allow rule. Turning it off restores ordinary prompting, where
  `permissions.allow` works — but only once the settings load at all, which is
  the same unsolved step. Whether to keep auto mode is a separate decision from
  where the settings live.
