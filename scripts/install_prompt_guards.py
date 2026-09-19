#!/usr/bin/env python3
"""Install the approval-prompt guards where a multi-repo session will load them.

    python3 scripts/install_prompt_guards.py            # show what it would do
    python3 scripts/install_prompt_guards.py --apply    # write it

WHY A SEPARATE INSTALLER
------------------------
`.claude/settings.json` in THIS repo does not load in a three-repo session —
Claude Code reads the session's PROJECT ROOT, which with all three repos
attached is their common parent (see `scripts/check_hooks_live.py`, and the
measurement in that file's header). So the guards have to be installed where
the session actually roots, and that is outside any repo.

⚠️ A SESSION CANNOT INSTALL THESE FOR ITSELF, AND SHOULD NOT BE ABLE TO. Auto
mode's classifier refuses any write to a `.claude/settings.json` as
`[Self-Modification]`, which is correct: these hooks return
`permissionDecision: "allow"`, so installing them is an agent granting itself
permission. That decision belongs to a person. Hence this script, which a
person runs.

⚠️ AND IT ONLY TAKES EFFECT AT THE NEXT SESSION START. Hooks bind when a
session begins. Running this mid-session changes nothing about the session
running it.

WHAT IT INSTALLS
----------------
Three PreToolUse guards, all of which default to `ask`:

  Bash                      scripts/bash_read_guard.py
  mcp__Supabase__execute_sql  scripts/supabase_sql_guard.py
  mcp__(github|Supabase)__*   scripts/allow_readonly_tool.py

Each keeps its own closed list; the matcher only routes. Nothing outward-facing
or mutating is on any of them — `create_pull_request`, `merge_pull_request`,
`push_files`, `apply_migration` and the rest keep their prompt, because those
publish, spend CI, or change a shared table.

It MERGES rather than overwrites: an existing settings file keeps everything it
has, and a matcher this script already installed is replaced rather than
duplicated.
"""
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Absolute paths on purpose: CLAUDE_PROJECT_DIR points at the session root,
# which in a multi-repo session is the PARENT of this repo, so a
# "$CLAUDE_PROJECT_DIR/scripts/..." command would resolve to nothing.
GUARDS = [
    ("Bash", "scripts/bash_read_guard.py"),
    ("mcp__Supabase__execute_sql", "scripts/supabase_sql_guard.py"),
    ("mcp__(github|Supabase)__.*", "scripts/allow_readonly_tool.py"),
]
MARK = "# cpl-prompt-guard"          # so a re-run replaces instead of duplicating


def blocks():
    out = []
    for matcher, rel in GUARDS:
        cmd = 'python3 "%s"  %s' % (os.path.join(REPO, rel), MARK)
        out.append({"matcher": matcher,
                    "hooks": [{"type": "command", "command": cmd}]})
    return out


def target_root():
    """Where the session roots. Prefer an explicit argument; else the parent."""
    for a in sys.argv[1:]:
        if not a.startswith("-"):
            return os.path.abspath(a)
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

    hooks = cfg.setdefault("hooks", {})
    pre = hooks.setdefault("PreToolUse", [])
    # Drop anything this script installed before, keep everything else.
    kept = [b for b in pre
            if not any(MARK in (h.get("command") or "") for h in (b.get("hooks") or []))]
    dropped = len(pre) - len(kept)
    hooks["PreToolUse"] = kept + blocks()

    print("session root:  %s" % root)
    print("settings file: %s%s" % (path, "" if os.path.exists(path) else "  (will be created)"))
    print("keeping %d existing PreToolUse block(s), replacing %d of ours, adding %d"
          % (len(kept), dropped, len(GUARDS)))
    for matcher, rel in GUARDS:
        print("   %-34s -> %s" % (matcher, rel))

    if not apply:
        print("\nDry run. Re-run with --apply to write it.")
        print("⚠️  Takes effect at the NEXT session start — hooks bind when a session begins.")
        return 0

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(cfg, fh, indent=2)
        fh.write("\n")
    print("\nwritten. ⚠️ Start a NEW session for it to take effect.")
    print("Then confirm with: python3 %s/scripts/check_hooks_live.py" % REPO)
    return 0


if __name__ == "__main__":
    sys.exit(main())
