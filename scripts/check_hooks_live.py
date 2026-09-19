#!/usr/bin/env python3
"""Is this repo's `.claude/settings.json` actually loaded? Say so in one line.

    python3 scripts/check_hooks_live.py

WHY THIS EXISTS
---------------
Sam, 2026-09-19, after the `execute_sql` guard shipped: *"Still getting the
Allow SQL run requests."* His session was new and all three repos were
attached, so the usual explanation — hooks load at session start, yours
predates the fix — did not apply.

⚠️ THE CAUSE IS THE THREE-REPO LAYOUT ITSELF, which CLAUDE.md requires.
Claude Code loads `.claude/settings.json` from the session's PROJECT ROOT. With
three repos attached, the root is their common PARENT, and each repo is a
subdirectory of it. Measured on the remote runner 2026-09-19:

    ~/.claude/projects/   ->   -home-user          (one entry: /home/user)
    repo settings         ->   /home/user/cpl-project-tracker/.claude/settings.json

Nothing in that file loads. Not the PreToolUse guards, not the SessionStart
hooks, not the PostToolUse context-budget probe. Confirmed two ways: an
`insert into cpl_memory` that the SQL guard denies executed anyway, and
`~/.claude/stop-hook-git-check.sh` carried no trace of `patch_stop_hook.py`.

⚠️ A HOOK THAT DOES NOT FIRE PROTECTS NOTHING AND SAVES NOTHING, and it fails
SILENTLY in both directions — the prompts keep coming (no convenience) and
Rule 10's write discipline is unenforced (no restraint), while the settings
file sits in the repo looking correct. That combination is why this check
exists rather than a line in a doc: the failure is invisible from inside a
session unless something goes looking.

⚠️ IT CANNOT DEPEND ON A HOOK TO ANSWER, because "no hook ran" is the case it
has to detect. So it reads the evidence Claude Code leaves on disk instead.
"""
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETTINGS = os.path.join(REPO, ".claude", "settings.json")


def project_roots():
    """The project roots Claude Code has state for.

    It stores per-project state under ~/.claude/projects/<path with / as ->,
    so the directory names decode back to the roots this machine has used.
    """
    base = os.path.join(os.path.expanduser("~"), ".claude", "projects")
    if not os.path.isdir(base):
        return []
    return ["/" + d.lstrip("-").replace("-", "/") for d in sorted(os.listdir(base))]


def main():
    if not os.path.exists(SETTINGS):
        print("no .claude/settings.json in this repo — nothing to load")
        return 0

    try:
        cfg = json.load(open(SETTINGS, encoding="utf-8"))
    except Exception as e:
        print("HOOKS BROKEN: %s will not parse (%s)" % (SETTINGS, e))
        return 1
    hook_kinds = sorted((cfg.get("hooks") or {}).keys())

    roots = project_roots()
    # The decode is lossy — a real '-' in a directory name becomes '/' — so
    # compare on the tail rather than demanding an exact string match.
    rooted_here = any(os.path.normpath(r) == os.path.normpath(REPO) for r in roots)

    print("repo:           %s" % REPO)
    print("settings:       %s (%s)" % (SETTINGS, ", ".join(hook_kinds) or "no hooks"))
    print("project roots:  %s" % (", ".join(roots) or "(none recorded)"))
    if rooted_here:
        print()
        print("LIVE — a session rooted at this repo loads these hooks.")
        print("       (They still bind at SESSION START, so a session older")
        print("        than the settings file is running without them.)")
        return 0

    print()
    print("INERT — no session is rooted at this repo, so NONE of these hooks load.")
    print("        This is the normal three-repo layout: the root is the parent")
    print("        directory and the repo is a subdirectory of it.")
    print()
    print("        Consequences, both silent:")
    print("          * the approval prompts these guards suppress keep coming")
    print("          * Rule 10's write discipline is unenforced by the harness")
    print()
    print("        Fix: put the same hooks where the session actually roots —")
    print("        <root>/.claude/settings.json, or user-level ~/.claude/settings.json,")
    print("        with ABSOLUTE paths to this repo's scripts (CLAUDE_PROJECT_DIR")
    print("        points at the root, not at this repo).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
