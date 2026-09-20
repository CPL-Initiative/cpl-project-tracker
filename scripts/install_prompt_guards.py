#!/usr/bin/env python3
"""Install the approval-prompt settings where a multi-repo session will load them.

    python3 scripts/install_prompt_guards.py                   # dry run, session root
    python3 scripts/install_prompt_guards.py --apply           # write it there
    python3 scripts/install_prompt_guards.py --user --apply    # LOCAL machine: persists
    python3 scripts/install_prompt_guards.py /some/root --apply

⚠️ WHICH TARGET SURVIVES WHAT:
  --user  ~/.claude/settings.json. On a LOCAL machine this is ordinary
          user-scope settings, read in every session and every project, living
          outside any repo or container — so it PERSISTS. Cloud sessions do not
          read it at all.
  default the session root (the parent of the clones in a multi-repo session).
          Correct for a cloud session, and gone when the container is
          reclaimed. For a durable cloud fix, run this from the environment's
          SETUP SCRIPT, which is configured outside the container and runs
          once, when the environment snapshot is built (see below).

WHY A SEPARATE INSTALLER
------------------------
`.claude/settings.json` in THIS repo does not load in a three-repo session.
Documented behavior, not a quirk of one runner
([Settings in cloud sessions](https://code.claude.com/docs/en/settings#settings-in-cloud-sessions)):

  "A session with several repositories starts above the clones, so from each
   repository's .claude/settings.json it loads only the plugins and
   marketplaces the file declares, not permission rules, hooks, env, or other
   keys."
  "User and project local settings (~/.claude/settings.json and
   .claude/settings.local.json): not read."

So the settings have to be installed where the session actually roots, which
is outside any repo — and `~/.claude/settings.json` is not a fallback, because
cloud sessions never read it. `scripts/check_hooks_live.py` reports which
world a session is in.

MEASURED 2026-09-20 (S280): the session-root file DOES load. Written by the
environment's setup script when the snapshot was built, it produced a
`hook_success` transcript entry on every execute_sql call and on every Bash
call the guard allowed (a guard writes nothing for a command off its list),
and the allow-listed MCP reads returned in under a second. The docs do not
mention the root file either way; the transcript does.

⚠️ A SESSION CANNOT INSTALL THESE FOR ITSELF, AND SHOULD NOT BE ABLE TO. Auto
mode's classifier refuses every write to a `.claude/settings.json` as
`[Self-Modification]` — correctly, since permission rules and `allow` hooks
are exactly that. A person runs this.

⚠️ SETTINGS ARE PICKED UP BY THE FILE WATCHER — hooks AND permission rules
(docs, Settings → When edits take effect: Claude Code "applies most edits to
the running session without a restart, including edits to permissions,
hooks"). So --apply counts in the session that runs it.

⚠️ THE SETUP SCRIPT RUNS ONCE PER ENVIRONMENT SNAPSHOT, NOT PER SESSION (docs,
Cloud environments → Environment caching; measured 2026-09-20: two containers
with identical clone and settings timestamps to the second, one of them
started 4 h 47 min after the commit its settings lacked). After ALLOW_TOOLS or
GUARDS change: merge, then edit the environment's setup script at
claude.ai/code (a dated comment line is enough) so the next new session
rebuilds the snapshot. Until then, --apply once per session.

WHAT IT INSTALLS, AND WHY IT IS MOSTLY PLAIN PERMISSION RULES
--------------------------------------------------------------
⚠️ THE EARLIER DIAGNOSIS IN THIS REPO WAS WRONG, and this file is the
correction. Handoff 278 held that `permissions.allow` cannot stop auto mode's
prompts because the classifier judges content instead. The classifier's
documented decision order says otherwise — step 1 is:

  "Actions matching your allow, ask, or deny rules resolve immediately"

Allow rules DO work in auto mode. Sam's allowlist never failed; it never
LOADED. One cause, not two. So the primary mechanism here is an ordinary
`permissions.allow` list, and a hook is used only where a rule cannot reach.

Auto mode drops a short list of allow rules on entry — blanket `Bash(*)` and
`PowerShell(*)`, wildcarded interpreters like `Bash(python*)`, package-manager
run commands, `Agent` and `Monitor` rules — while "narrow rules like
`Bash(npm test)` stay in effect" and MCP tool rules are not dropped at all.
That split decides the design:

  permissions.allow   the read-only MCP tools. Read-only by nature, nothing to
                      inspect per call, so a rule is the whole answer.
  Bash hook           arbitrary-argument reads (`git status`, `grep`, `sed -n`
                      with ANY arguments) cannot be enumerated as narrow rules,
                      and the blanket form is dropped. A hook can read the
                      command; a rule cannot.
  execute_sql         BOTH an allow rule AND the hook, and the pairing is the
                      design (measured 2026-09-20, S280). The hook alone was
                      not enough: on every execute_sql call that session the
                      guard ran, returned `allow` in under 0.1 s with exit 0,
                      and the call still waited on a prompt (5 min, 43 s,
                      21 min, 51 s) — while the allow-listed MCP reads returned
                      in 0.4–0.8 s. The docs put PreToolUse hooks BEFORE every
                      permission-mode check and let a hook tighten but never
                      loosen, so the rule resolves the reads immediately and
                      the hook's `deny` still fires first on any write outside
                      cpl_memory. #1617's mistake was the rule WITHOUT the
                      hook; this is the rule WITH it.
                      ⚠️ Neither reaches a tool an organization's connector
                      control has set to `ask` — that prompt says so in its
                      own text ("Your organization requires approval for this
                      tool") and only the org admin console changes it.
"""
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── plain permission rules: read-only MCP tools ────────────────────────────
# Spelled out rather than wildcarded. A pattern like `mcp__github__get_*`
# would sweep in tools added later that nobody checked, and the whole point of
# a rule here is that the TOOL is read-only by its nature.
#
# ⚠️ Nothing outward-facing or mutating belongs on this list, and none of it is
# here: create_pull_request, merge_pull_request, update_pull_request,
# add_issue_comment, push_files, create_or_update_file, delete_file,
# actions_run_trigger, apply_migration, deploy_edge_function. Those publish,
# spend CI, or change a shared table — a comment posted to a colleague's PR by
# accident cannot be recalled.
ALLOW_TOOLS = [
    "mcp__github__get_me",
    "mcp__github__get_commit",
    "mcp__github__get_file_contents",
    "mcp__github__get_check_run",
    "mcp__github__get_job_logs",
    "mcp__github__get_latest_release",
    "mcp__github__get_tag",
    "mcp__github__list_branches",
    "mcp__github__list_commits",
    "mcp__github__list_issues",
    "mcp__github__list_pull_requests",
    "mcp__github__list_releases",
    "mcp__github__list_tags",
    "mcp__github__pull_request_read",
    "mcp__github__issue_read",
    "mcp__github__actions_list",
    "mcp__github__actions_get",
    "mcp__github__search_code",
    "mcp__github__search_commits",
    "mcp__github__search_issues",
    "mcp__github__search_pull_requests",
    "mcp__github__search_repositories",
    "mcp__Supabase__list_tables",
    "mcp__Supabase__list_extensions",
    "mcp__Supabase__list_migrations",
    "mcp__Supabase__list_edge_functions",
    "mcp__Supabase__get_edge_function",
    "mcp__Supabase__get_project",
    "mcp__Supabase__get_project_url",
    "mcp__Supabase__get_advisors",
    "mcp__Supabase__query_logs",
    "mcp__Supabase__search_docs",
    # ⚠️ The one entry here that is NOT read-only by nature. It is safe only
    # because of the execute_sql hook in GUARDS: hooks fire before any
    # permission-mode check and a hook `deny` wins over an allow rule, so a
    # write outside cpl_memory is refused before this rule is consulted. The
    # rule exists because the hook's own `allow` was measured (2026-09-20) not
    # to stop the prompt, while a rule does. Never ship this line without the
    # hook — tests/install_prompt_guards_test.py pins the pairing.
    "mcp__Supabase__execute_sql",
]

# ── the two hooks a rule cannot replace ────────────────────────────────────
GUARDS = [
    ("Bash", "scripts/bash_read_guard.py"),
    ("mcp__Supabase__execute_sql", "scripts/supabase_sql_guard.py"),
]
MARK = "# cpl-prompt-guard"          # so a re-run replaces instead of duplicating


def blocks():
    out = []
    for matcher, rel in GUARDS:
        # Absolute on purpose: CLAUDE_PROJECT_DIR points at the session root,
        # which in a multi-repo session is the PARENT of this repo, so
        # "$CLAUDE_PROJECT_DIR/scripts/..." would resolve to nothing.
        cmd = 'python3 "%s"  %s' % (os.path.join(REPO, rel), MARK)
        out.append({"matcher": matcher,
                    "hooks": [{"type": "command", "command": cmd}]})
    return out


def target_root():
    """Where to install. An explicit path wins; then --user; else the parent.

    ⚠️ --user IS THE PERSISTENT ANSWER ON A LOCAL MACHINE AND IS NOT READ IN THE
    CLOUD. The two surfaces differ, and conflating them is how this lands in the
    wrong place:

      local (terminal / desktop)  ~/.claude/settings.json is ordinary user-scope
                                  settings, read in every session and every
                                  project. It lives outside any repo and outside
                                  any container, so it survives. Install here.
      cloud session               "User and project local settings
                                  (~/.claude/settings.json and
                                  .claude/settings.local.json): not read."
                                  The session root is the parent of the clones
                                  and dies with the container, so an install
                                  there lasts one session. The durable lever is
                                  the cloud environment's SETUP SCRIPT, which is
                                  configured outside the container and runs
                                  when the environment snapshot is built —
                                  point it at this script, and edit it after
                                  any change here so the snapshot rebuilds.
    """
    for a in sys.argv[1:]:
        if not a.startswith("-"):
            return os.path.abspath(a)
    if "--user" in sys.argv:
        return os.path.expanduser("~")
    return os.path.dirname(REPO)


def main():
    apply = "--apply" in sys.argv
    root = target_root()
    path = os.path.join(root, ".claude", "settings.json")

    missing = [r for _, r in GUARDS if not os.path.exists(os.path.join(REPO, r))]
    if missing:
        print("refusing: guard script(s) missing from this repo: %s" % ", ".join(missing))
        return 1

    cfg = {}
    if os.path.exists(path):
        try:
            cfg = json.load(open(path, encoding="utf-8"))
        except Exception as e:
            print("refusing: %s exists and will not parse (%s)" % (path, e))
            return 1

    # Permission rules: union, so a rule someone added by hand survives.
    perms = cfg.setdefault("permissions", {})
    existing = perms.setdefault("allow", [])
    added = [t for t in ALLOW_TOOLS if t not in existing]
    perms["allow"] = existing + added

    # Hooks: drop anything this script installed before, keep everything else.
    hooks = cfg.setdefault("hooks", {})
    pre = hooks.setdefault("PreToolUse", [])
    kept = [b for b in pre
            if not any(MARK in (h.get("command") or "") for h in (b.get("hooks") or []))]
    replaced = len(pre) - len(kept)
    hooks["PreToolUse"] = kept + blocks()

    print("session root:  %s" % root)
    print("settings file: %s%s" % (path, "" if os.path.exists(path) else "  (will be created)"))
    print()
    print("permissions.allow: %d read-only MCP tool(s) to add, %d already there"
          % (len(added), len(existing)))
    print("PreToolUse:        keeping %d existing block(s), replacing %d of ours, adding %d"
          % (len(kept), replaced, len(GUARDS)))
    for matcher, rel in GUARDS:
        print("   %-34s -> %s" % (matcher, rel))
    print()
    print("⚠️  execute_sql is BOTH an allow rule and a hook: the rule stops the prompt")
    print("    (a hook allow alone did not, measured 2026-09-20) and the hook's deny")
    print("    still fires first on any write outside cpl_memory (Rule 10).")

    if not apply:
        print("\nDry run. Re-run with --apply to write it.")
        print("⚠️  The file watcher picks up hooks AND permission rules, so --apply")
        print("    counts in this session. A NEW session starts from the environment")
        print("    SNAPSHOT: after any change here, edit the setup script at")
        print("    claude.ai/code so the snapshot rebuilds.")
        return 0

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(cfg, fh, indent=2)
        fh.write("\n")
    print("\nwritten. The file watcher picks up hooks AND permission rules, so this")
    print("counts in the running session. A NEW session starts from the environment")
    print("SNAPSHOT: after any change here, edit the setup script at claude.ai/code")
    print("so the snapshot rebuilds; until then, run --apply once per session.")
    print("Then confirm with: python3 %s/scripts/check_hooks_live.py" % REPO)
    return 0


if __name__ == "__main__":
    sys.exit(main())
