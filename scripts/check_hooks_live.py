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
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETTINGS = os.path.join(REPO, ".claude", "settings.json")
MARK = "# cpl-prompt-guard"      # what install_prompt_guards.py stamps on its blocks
SQL_TOOL = "mcp__Supabase__execute_sql"


def root_report(root_dir=None):
    """What the SESSION ROOT's settings carry — the file that actually loads.

    ⚠️ MEASURED 2026-09-20 (S280): `<root>/.claude/settings.json`, written by
    the environment's setup script when the environment snapshot was built,
    DOES load in a three-repo cloud session — a `hook_success` transcript
    entry on every execute_sql call and on every Bash call the guard allowed.
    The setup script runs once per snapshot, so the file can predate a change
    to the installer's list by hours or days (it did, by 4 h 47 min, the day
    the execute_sql rule landed). This check used to look only at the repo's own file
    and said INERT while the guards were live from the root, which sent a
    session chasing the wrong question. So: report the root first.
    """
    root_dir = root_dir or os.path.dirname(REPO)
    path = os.path.join(root_dir, ".claude", "settings.json")
    if not os.path.exists(path):
        return {"path": path, "present": False}
    try:
        cfg = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        return {"path": path, "present": True, "error": str(e)}
    pre = (cfg.get("hooks") or {}).get("PreToolUse") or []
    hooked = sorted(str(b.get("matcher")) for b in pre
                    if any(MARK in (h.get("command") or "") for h in (b.get("hooks") or [])))
    allow = (cfg.get("permissions") or {}).get("allow") or []
    return {"path": path, "present": True, "hooked": hooked,
            "allow_n": len(allow), "sql_rule": SQL_TOOL in allow}


def project_roots():
    """The project roots Claude Code has state for.

    It stores per-project state under ~/.claude/projects/<path with / as ->,
    so the directory names decode back to the roots this machine has used.
    """
    base = os.path.join(os.path.expanduser("~"), ".claude", "projects")
    if not os.path.isdir(base):
        return []
    return ["/" + d.lstrip("-").replace("-", "/") for d in sorted(os.listdir(base))]


def healthy(root):
    return bool(root.get("present") and root.get("hooked") and root.get("sql_rule")
                and not root.get("error"))


def main():
    """`--fix` repairs the session at hand when the ROOT line is bad: it runs the
    installer for this root and reports again. It does nothing when the guards
    are live, so a list change still waits for the snapshot rebuild (the human
    gate). `--root DIR` points both at another root; tests use it. Sam,
    2026-09-20: "How am I going to remember this?" — the opening line runs
    this with --fix, so nobody has to."""
    args = sys.argv[1:]
    root_dir = None
    if "--root" in args:
        root_dir = os.path.abspath(args[args.index("--root") + 1])
    fix = "--fix" in args
    root = root_report(root_dir)
    fixed = False
    if fix and not healthy(root):
        cmd = [sys.executable, os.path.join(REPO, "scripts", "install_prompt_guards.py"),
               root_dir or os.path.dirname(REPO), "--apply"]
        run = subprocess.run(cmd, capture_output=True, text=True)
        print("FIXED —         ran the installer for this session (exit %d): %s"
              % (run.returncode, " ".join(cmd[1:])))
        if run.returncode != 0:
            print((run.stdout + run.stderr).strip()[-600:])
        root = root_report(root_dir)
        fixed = True
    print("session root:   %s" % root["path"])
    if root.get("error"):
        print("ROOT BROKEN:    will not parse (%s)" % root["error"])
    elif root["present"] and root.get("hooked"):
        print("LIVE (root) —   guards installed: %s · %d allow rule(s) · "
              "execute_sql allow rule: %s"
              % (", ".join(root["hooked"]), root["allow_n"],
                 "yes" if root["sql_rule"] else "NO"))
        if root["sql_rule"]:
            print("                execute_sql still asks once per call, by an upstream mark on")
            print("                that one tool (measured 2026-09-20); every other listed tool")
            print("                runs silently, and the guard refuses writes before Supabase.")
        else:
            print("                ⚠️ The execute_sql rule is absent here. (Even with it, that one")
            print("                tool asks once per call by an upstream mark, measured 2026-09-20;")
            print("                every other listed tool runs silently.)")
            print("                This container started from an environment snapshot built")
            print("                before the rule landed (the setup script runs once per")
            print("                snapshot). This session: python3 scripts/install_prompt_guards.py")
            print("                --apply. Every later session: edit the environment's setup")
            print("                script at claude.ai/code so the snapshot rebuilds.")
        print("                If a prompt reads 'Your organization requires approval for")
        print("                this tool', the org's connector control is set to ask and no")
        print("                local setting reaches it.")
        if fixed:
            print("                Repaired for THIS session only. Later sessions start from the")
            print("                environment snapshot: change the date on the setup script's")
            print("                comment line at claude.ai/code so it rebuilds.")
    elif root["present"]:
        print("ROOT PRESENT —  but carries none of our guard blocks (%s)" % MARK)
        print("                Something else wrote the root file, or the blocks were removed.")
        print("                This session: python3 %s/scripts/install_prompt_guards.py --apply" % REPO)
        print("                (settings reload live). Every later session: change the date on")
        print("                the setup script's comment line at claude.ai/code so the")
        print("                snapshot rebuilds.")
    else:
        print("NO ROOT FILE —  the setup script did not run, or wrote elsewhere")
        print("                (it never fails the session by design, so a failure is silent).")
        print("                This session: python3 %s/scripts/install_prompt_guards.py --apply" % REPO)
        print("                (settings reload live). Every later session: check the Setup")
        print("                script field at claude.ai/code still calls the installer, change")
        print("                the date on its comment line, and in the next new session expand")
        print("                'Initialized session' and look for 'prompt-guard install")
        print("                attempted' or a Python error.")
    print()

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
    print("INERT (repo file) — EXPECTED in every three-repo session; the ROOT line above")
    print("        is the verdict. No session is rooted at this repo, so nothing in the")
    print("        repo's own settings.json loads. This is the normal three-repo")
    print("        layout: the root is the parent directory and the repo is a")
    print("        subdirectory of it. What counts is the ROOT line above.")
    if not (root.get("present") and root.get("hooked")):
        print()
        print("        Consequences, both silent:")
        print("          * the approval prompts these guards suppress keep coming")
        print("          * Rule 10's write discipline is unenforced by the harness")
        print()
        print("        Fix: have the environment's setup script run")
        print("        python3 %s/scripts/install_prompt_guards.py --apply" % REPO)
        print("        so <root>/.claude/settings.json exists before the session starts")
        print("        (it runs once per environment snapshot; edit it to rebuild).")
    return 0


def patch_stop_hook():
    """Apply scripts/patch_stop_hook.py to this session's Stop hook.

    The tracker's own SessionStart hook runs that patch, and in a three-repo
    session the repo's settings never load (the INERT line), so the Stop hook's
    unpushed-commit false positive came back: S288, 2026-09-25, "There are 2
    unpushed commit(s)" on a branch level with main after a squash-merge
    deleted its remote. `--fix` is the first command of every session, so it
    applies the patch here. Idempotent, and silent when there is nothing to do."""
    run = subprocess.run([sys.executable, os.path.join(REPO, "scripts", "patch_stop_hook.py")],
                         capture_output=True, text=True)
    out = (run.stdout + run.stderr).strip()
    if out:
        print("STOP HOOK:      " + out)


if __name__ == "__main__":
    rc = main()
    if "--fix" in sys.argv[1:]:
        patch_stop_hook()
    sys.exit(rc)
