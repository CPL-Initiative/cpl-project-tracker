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
| `execute_sql` rule **and** hook | read-only SQL, plus the `cpl_memory` carve-out | ⚠️ See below — the pairing is the design (proposed 2026-09-20) |

⚠️ **`execute_sql` NEEDS BOTH THE ALLOW RULE AND THE HOOK (S280, 2026-09-20;
Sam's decision pending).** The hook alone did not stop the prompt — measured at
the end of this doc. PreToolUse hooks fire before any permission-mode check and
a hook `deny` wins over an allow rule, so the rule resolves the reads
immediately and the guard still refuses writes outside `cpl_memory` before the
rule is consulted. #1617's mistake was the rule WITHOUT the hook.

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

Hooks are picked up by the file watcher (docs: *"the file watcher normally
picks up hook changes automatically"*; S279 saw the guard fire mid-session).
A new session is still the safe assumption for the permission rules. Confirm:

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
| **Cloud environment setup script** | the environment config | yes: it runs once, and the filesystem snapshot it leaves is what every later session starts from (rebuilt when the script or the allowed hosts change, or after about seven days) | **Documented.** Writes the root settings into the snapshot |
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
  `permissions.allow` works — but only once the settings load at all, which
  the setup script now does (measured 2026-09-20, below). Whether to keep auto mode is a separate decision from
  where the settings live.

## 2026-09-20 (S280): the guards load, and for `execute_sql` the hook's `allow` is not enough

Sam, mid-session: *"Still getting the swarm of allow sql that we've been trying
to solve for the last 5 sessions."* Read off this session's own transcript
(`~/.claude/projects/-home-user/<session>.jsonl`), not inferred:

| Call | Guard ran? | Guard said | Waited |
|---|---|---|---|
| Rule 8 memory query | yes, 99 ms, exit 0 | allow | 298 s |
| schema query | yes, 35 ms | allow | 43 s |
| one JSON roll-up | yes, 102 ms | allow | 1,297 s |
| three `cpl_memory` inserts | yes | allow (the carve-out) | 15 s · 117 s · 51 s |
| `mcp__github__get_commit`, on the allow list | not hooked | rule | 0.8 s |
| `mcp__Supabase__get_project_url`, on the allow list | not hooked | rule | 0.4 s |

Three of the five sessions' premises are settled by that table:

1. **The session-root file loads.** `/home/user/.claude/settings.json`, written
   by the environment's setup script when the environment snapshot was built,
   produced a `hook_success` transcript entry on every `execute_sql` call
   (10 of 10 by session end) and on every Bash call the guard allowed (11 of
   111; a guard writes nothing for a command off its list, so those calls
   leave no entry and go to auto mode's classifier). The "not read" quotation
   above is about `~/.claude/settings.json` and the repo files; the root file
   is what the setup script targets, and it works. `check_hooks_live.py` said
   INERT this session while the guards were live, and sent the session after
   the wrong question; since #1641 it reports the root first.
2. **Allow rules resolve immediately, in auto mode, for MCP tools.** A GitHub
   read and a Supabase read on the list returned in under a second.
3. **A hook `allow` does not stop the `execute_sql` prompt.** The docs put
   hooks before every permission-mode check and let them tighten, never
   loosen: *"a hook returning `allow` doesn't bypass deny rules from settings,
   and it can't suppress the prompt for MCP tools marked
   `requiresUserInteraction` or for connector tools your organization set to
   `ask`"* (hooks guide). Whichever path applies here, the measurement is the
   same: the hook's allow was advisory and a rule is authoritative.

**The proposed change.** `execute_sql` carries the allow rule and the hook.
The rule resolves reads without a prompt; the hook, firing first, still
returns `deny` for any write outside `cpl_memory` and `ask` for anything it
cannot parse, and a hook deny wins over an allow rule. The trade: if the guard
script ever crashes, the rule approves the statement where a prompt used to
appear. The guard is stdlib-only and its 35 cases run in CI. ⚠️ A session may
not commit this on its own: the classifier refuses it as `[Self-Modification]`,
correctly, because the setup script turns the installer's allow list into the
next session's permissions. Sam decides.

**What could still prompt after the rule lands, and both are outside the repo:**

- An organization connector control that sets this one tool to `ask`. That
  prompt reads *"Your organization requires approval for this tool"*, appears
  in every mode, and only the claude.ai admin console changes it. The
  allow-listed Supabase read returned in 0.4 s, so the connector as a whole is
  not set to ask; the question is that one tool.
- The server marking the tool `anthropic/requiresUserInteraction`. Checked in
  the published `@supabase/mcp-server-supabase@0.13.0`, the version this
  session's connector reported: the annotation is absent. The server's own
  confirm step for destructive statements is an MCP elicitation, and it did
  not fire on these reads.

**What to do.** Land the rule, rebuild the environment snapshot so the setup
script runs the installer again (the section below says how; it does not
happen on its own at the next session), and read the prompt if one still
appears. Its wording decides between the two cases above. The `promptId`
field on a transcript's tool result is not a prompt indicator — the 0.4 s
call carried one too.

## 2026-09-20, later (S280): the rule landed and a fresh session still read 1 — the environment snapshot

Sam added the line on `main` at 19:50 UTC (c7382c94). A session he started at
20:05 still counted one `execute_sql` line in `/home/user/.claude/settings.json`
(the hook matcher, no rule). Its container and this one carry the same three
timestamps to the second — clone 15:03:17, checkout of `main` 15:03:27, root
settings written 15:03:31 — so they are one filesystem, and the docs say which
([Configure cloud environments → Environment caching](https://code.claude.com/docs/en/cloud-environments#environment-caching)):

> "The setup script runs the first time you start a session in an
> environment. After it completes, Anthropic snapshots the filesystem and
> reuses that snapshot as the starting point for later sessions. New sessions
> start with your dependencies, tools, and Docker images already on disk, and
> skip the setup script step."
>
> "The setup script runs again to rebuild the cache when you change the
> environment's setup script or allowed network hosts, and when the cache
> reaches its expiry after roughly seven days. Resuming an existing session
> never re-runs the setup script."

So the root settings are a **snapshot artifact**: the installer's allow list
as of the snapshot build, four hours and forty-seven minutes before the commit
that day. A new session fast-forwards the clone (the 20:05 HEAD move in that
session's reflog) and leaves the settings file as the snapshot had it. The
rows above that said the setup script runs at every container start are
corrected.

**The procedure, whenever `ALLOW_TOOLS` or the guards change:**

1. Merge the change.
2. Edit the environment's setup script at claude.ai/code (a dated comment line
   is enough) and save. The next new session rebuilds the snapshot, runs the
   installer from a clone that carries the change, and
   `python3 scripts/check_hooks_live.py` reads `execute_sql allow rule: yes`.
3. Any session started from the old snapshot gets the change for itself with
   `python3 scripts/install_prompt_guards.py --apply`. Claude Code watches
   settings files and *"applies most edits to the running session without a
   restart, including edits to `permissions`, `hooks`"*
   ([Settings → When edits take effect](https://code.claude.com/docs/en/settings#when-edits-take-effect)),
   so the rule counts in the session that ran it.

**Confirmed the same evening.** Sam added a dated comment line to the setup
script; the next session's root settings were written at 20:40:31 UTC with 33
allow rules, and `check_hooks_live.py` read `execute_sql allow rule: yes`. His
setup script loops over `/home/user/*/scripts/install_prompt_guards.py` and
runs the first it finds with `--apply`, so its text needed nothing beyond the
comment. The edit is also the human gate: a SessionStart hook that re-applied
the list would let a commit to `main` change a session's permissions
unattended, and that is the shape the classifier refuses for good reason.

**And the prompt survived the rule (about 21:00 UTC).** In that session, with
the rule loaded, `select 1` through the connector's `execute_sql` still raised
*Allow Claude to use Execute SQL (Supabase)?* with Deny and Allow once and no
"don't ask again"; the harmless `update kb_curation set value = value where
false` was refused by the guard before it reached Supabase, verbatim:
`PreToolUse:mcp__Supabase__execute_sql hook error: Blocked by the repo's
Supabase guard: this statement contains update.` So the guard half holds, and
the prompt half has one cause left. The docs list exactly two ways an MCP tool
prompts past a matching allow rule
([permission modes → how the classifier evaluates actions](https://code.claude.com/docs/en/permission-modes#how-the-classifier-evaluates-actions)):
a connector tool the organization set to `ask`, whose prompt carries the
reason *Your organization requires approval for this tool*, and a tool whose
server sets `_meta["anthropic/requiresUserInteraction"]` to `true`, for which
Claude Code *"shows that tool's permission prompt on every call, even in
acceptEdits, auto, and bypassPermissions permission modes, and doesn't offer a
'don't ask again' option for it. Allow rules that match the tool don't skip
the prompt either"*
([MCP → Require approval for a specific tool](https://code.claude.com/docs/en/mcp#require-approval-for-a-specific-tool)).
The prompt's wording excludes the first; the missing "don't ask again" is the
second's signature. ⚠️ **The mark is not in the public server source.** The
`supabase-community/supabase-mcp` repository at its tip (6c411e2, 2026-09-17,
package 0.13.0) contains no `requiresUserInteraction` anywhere, so if the
mark exists it is added upstream of that code: by Supabase's hosted build or
by the connector platform. The sandbox cannot read the connector's
`tools/list` (egress-blocked). The environment had restarted between Sam's
two pastes, so the resumed VM could have started without the rules; **Sam ran
the discriminating paste in that session (about 21:15 UTC): the checker read
`execute_sql allow rule: yes` with 33 rules, the allow-listed `list_tables`
went through with no prompt, and `execute_sql` alone had asked.** The rules
were loaded and honored for every other tool; the one exception is the mark,
upstream, and nothing in this repo, the session root, a hook or a mode
reaches it. Every other Supabase tool on the allow list ran silently in this
container too (0.4 s, measured).

**What is left is a design choice, and it is Sam's:** (1) keep the one prompt,
on `execute_sql` only, with every other read silent, which is where things
stand; (2) a read path that is not this tool, for example the npm server run
inside the sandbox in `--read-only` mode from the setup script, which carries
no such mark, at the price of a Supabase token among the environment's
variables and two hosts on its allowed list, with a security review before
any of it; (3) ask whether the connector offers a read-only configuration that
drops the mark. A session does not make this call. Recommended: (1) now, with
one question to Supabase support (does the hosted connector mark
`execute_sql` as requiring user interaction, and does read-only mode change
it), which costs nothing; (2) only as a decision-sheet item with its
security review, never as a session's own build. Five sessions of settings
work removed every prompt that could be removed; a session now batches its
Supabase writes into one call per checkpoint and keeps `execute_sql` reads to
as few calls as the work allows.

The confirmation, in a session that reads `yes`: a plain `select` through the
Supabase tool runs without a prompt, and the harmless denied write
(`update kb_curation set value = value where false`) is still refused with the
guard's reason. If that statement ever executes, the rule is short-circuiting
the hook and must come out.

**Two other routes, and why the edit is the default.** A SessionStart hook in
a repo's `.claude/settings.json` does not run in a three-repo session (the
same docs page, "Limitations in cloud sessions"). A SessionStart hook written
into the root file by the installer would re-apply the list at every start
and pick up later changes without an edit, at the cost of a script that
rewrites the session's permissions unattended; it still needs one rebuild to
get into the snapshot. Sam decides; until he does, the edit is the procedure.

**Also corrected here: the `hook_success` count.** A guard writes an entry
only when it emits a decision, so the entries measure the calls it allowed,
not the calls it saw: 10 of 10 `execute_sql` calls and 11 of 111 Bash calls
in this session, 4 of 21 in the 20:05 session. The Bash guard's low hit rate
is the compound-command shape of a working session; those calls go to auto
mode's classifier.
