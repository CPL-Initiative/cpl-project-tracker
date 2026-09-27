#!/usr/bin/env python3
"""The execute_sql allow rule must never ship without the execute_sql hook.

    python3 tests/install_prompt_guards_test.py

`scripts/install_prompt_guards.py` writes the session-root settings a cloud
session actually loads. Since 2026-09-20 it puts `mcp__Supabase__execute_sql`
on `permissions.allow` — the only entry there that is not read-only by nature —
because a hook `allow` was measured not to stop the approval prompt while a
rule does. That rule is safe ONLY while the execute_sql hook is installed
beside it: PreToolUse hooks fire before any permission-mode check, and a hook
`deny` wins over an allow rule, so writes outside cpl_memory are refused before
the rule is consulted. Drop the hook and the rule auto-approves every write —
exactly what #1617 did. This test pins the pairing, and pins that nothing
mutating or outward-facing joins the allow list.

Since 2026-09-27 (CLAUDE.md Cleanup sheet, card 1) the installer also writes
Rule 9a's context meter as a PostToolUse block, and `check_hooks_live.py --fix`
adds the meter alone to a root whose guards are live. The meter grants nothing,
so that path must leave the permission rules and the guards exactly as found:
the checks below pin that a meter-only repair never widens the allow list.
"""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INSTALLER = os.path.join(ROOT, "scripts", "install_prompt_guards.py")
SQL_TOOL = "mcp__Supabase__execute_sql"
NEVER_ALLOW_PREFIXES = ("create_", "merge_", "update_", "delete_", "push_",
                        "apply_", "deploy_", "add_", "run_", "fork_", "pause_",
                        "restore_", "reset_", "rebase_")


def load_installer():
    spec = importlib.util.spec_from_file_location("install_prompt_guards", INSTALLER)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    ipg = load_installer()
    hooked = [m for m, _ in ipg.GUARDS]
    checks = [
        ("execute_sql is on the allow list (the rule is what stops the prompt)",
         SQL_TOOL in ipg.ALLOW_TOOLS),
        ("execute_sql hook is installed beside the rule (the rule is only safe with it)",
         SQL_TOOL in hooked),
        ("Bash hook is installed",
         "Bash" in hooked),
        ("every guard script named in GUARDS exists in this repo",
         all(os.path.exists(os.path.join(ROOT, rel)) for _, rel in ipg.GUARDS)),
        ("no mutating or outward-facing tool is on the allow list",
         not any(t.split("__")[-1].startswith(NEVER_ALLOW_PREFIXES) for t in ipg.ALLOW_TOOLS)
         and "mcp__github__actions_run_trigger" not in ipg.ALLOW_TOOLS),
        ("the allow list has no duplicates",
         len(ipg.ALLOW_TOOLS) == len(set(ipg.ALLOW_TOOLS))),
    ]

    # Install into a throwaway root and read back what a session would load.
    with tempfile.TemporaryDirectory() as tmp:
        out = subprocess.run([sys.executable, INSTALLER, tmp, "--apply"],
                             capture_output=True, text=True)
        written = os.path.join(tmp, ".claude", "settings.json")
        cfg = json.load(open(written, encoding="utf-8")) if os.path.exists(written) else {}
        allow = (cfg.get("permissions") or {}).get("allow") or []
        pre = (cfg.get("hooks") or {}).get("PreToolUse") or []
        marked = [b for b in pre
                  if any(ipg.MARK in (h.get("command") or "") for h in (b.get("hooks") or []))]
        cmds = [h.get("command") or "" for b in marked for h in (b.get("hooks") or [])]
        checks += [
            ("installer exits 0 against a temp root", out.returncode == 0),
            ("written allow list carries execute_sql", SQL_TOOL in allow),
            ("written hooks carry the execute_sql guard",
             any(b.get("matcher") == SQL_TOOL for b in marked)),
            ("written hook commands are absolute paths into this repo",
             bool(cmds) and all(os.path.join(ROOT, "scripts") in c for c in cmds)),
            ("a second --apply replaces its own blocks instead of duplicating them",
             subprocess.run([sys.executable, INSTALLER, tmp, "--apply"],
                            capture_output=True).returncode == 0
             and len([b for b in ((json.load(open(written)).get("hooks") or {})
                                  .get("PreToolUse") or [])
                      if any(ipg.MARK in (h.get("command") or "")
                             for h in (b.get("hooks") or []))]) == len(ipg.GUARDS)),
        ]
        post = ((json.load(open(written)).get("hooks") or {}).get("PostToolUse") or [])
        meter_cmds = [h.get("command") or "" for b in post if ipg.ours(b)
                      for h in (b.get("hooks") or [])]
        checks += [
            ("the written settings carry exactly one context-meter block after two --apply runs",
             len(meter_cmds) == 1),
            ("the meter command is an absolute path to kb/_context_budget.py --hook",
             bool(meter_cmds) and os.path.join(ROOT, "kb", "_context_budget.py") in meter_cmds[0]
             and "--hook" in meter_cmds[0]),
        ]

    # --meter-only: the meter goes in; the permission rules, the guards and any
    # block someone else wrote stay exactly as they were.
    with tempfile.TemporaryDirectory() as tmp:
        written = os.path.join(tmp, ".claude", "settings.json")
        os.makedirs(os.path.dirname(written))
        theirs_pre = {"matcher": "Read", "hooks": [{"type": "command", "command": "echo pre"}]}
        theirs_post = {"matcher": "Edit", "hooks": [{"type": "command", "command": "echo post"}]}
        before = {"permissions": {"allow": ["Bash(npm test)"]},
                  "hooks": {"PreToolUse": [theirs_pre], "PostToolUse": [theirs_post]}}
        json.dump(before, open(written, "w"))
        out = subprocess.run([sys.executable, INSTALLER, tmp, "--apply", "--meter-only"],
                             capture_output=True, text=True)
        cfg = json.load(open(written))
        post = (cfg.get("hooks") or {}).get("PostToolUse") or []
        checks += [
            ("--meter-only exits 0", out.returncode == 0),
            ("--meter-only leaves the allow list and the PreToolUse blocks untouched",
             cfg.get("permissions") == before["permissions"]
             and cfg["hooks"].get("PreToolUse") == [theirs_pre]),
            ("--meter-only keeps a PostToolUse block it did not write and adds the meter",
             theirs_post in post and sum(1 for b in post if ipg.ours(b)) == 1),
        ]

    checker = os.path.join(ROOT, "scripts", "check_hooks_live.py")
    with tempfile.TemporaryDirectory() as tmp:
        out = subprocess.run([sys.executable, checker, "--root", tmp, "--fix"],
                             capture_output=True, text=True)
        checks.append(("checker --fix on an empty root writes the settings and reports the rule and the meter",
                       out.returncode == 0 and "FIXED" in out.stdout
                       and "execute_sql allow rule: yes" in out.stdout
                       and "context meter: yes" in out.stdout
                       and os.path.exists(os.path.join(tmp, ".claude", "settings.json"))))
        out2 = subprocess.run([sys.executable, checker, "--root", tmp, "--fix"],
                              capture_output=True, text=True)
        checks.append(("checker --fix on a healthy root changes nothing",
                       out2.returncode == 0 and "FIXED" not in out2.stdout
                       and "execute_sql allow rule: yes" in out2.stdout
                       and "context meter: yes" in out2.stdout))

        # A root the setup script wrote before the meter existed: guards live, no
        # meter, and an allow list one entry short of the current one. --fix adds
        # the meter and must not widen the allow list (that waits for the snapshot).
        written = os.path.join(tmp, ".claude", "settings.json")
        cfg = json.load(open(written))
        cfg["hooks"].pop("PostToolUse", None)
        cfg["permissions"]["allow"] = [t for t in cfg["permissions"]["allow"]
                                       if t != "mcp__github__get_me"]
        json.dump(cfg, open(written, "w"))
        allow_before = list(cfg["permissions"]["allow"])
        pre_before = cfg["hooks"]["PreToolUse"]
        plain = subprocess.run([sys.executable, checker, "--root", tmp],
                               capture_output=True, text=True)
        checks.append(("checker without --fix says the meter is missing",
                       "context meter: NO" in plain.stdout))
        out3 = subprocess.run([sys.executable, checker, "--root", tmp, "--fix"],
                              capture_output=True, text=True)
        after = json.load(open(written))
        checks.append(("checker --fix on live guards without the meter installs the meter",
                       out3.returncode == 0 and "FIXED" in out3.stdout
                       and "context meter: yes" in out3.stdout))
        checks.append(("that repair leaves the allow list and the guards exactly as found",
                       after["permissions"]["allow"] == allow_before
                       and after["hooks"]["PreToolUse"] == pre_before))
    # The repo's SessionStart hook (which runs patch_stop_hook.py) never loads in a
    # three-repo session, so --fix, the first command of every session, applies it.
    src = open(checker, encoding="utf-8").read()
    main_block = src[src.index('if __name__ == "__main__":'):]
    checks.append(("checker --fix applies the stop-hook patch (three-repo sessions never load the repo's SessionStart hook)",
                   "patch_stop_hook.py" in src and "patch_stop_hook()" in main_block
                   and '"--fix"' in main_block))
    failed = [label for label, ok in checks if not ok]
    for label, ok in checks:
        print(("ok   " if ok else "FAIL ") + label)
    if failed:
        print("\n%d of %d checks failed" % (len(failed), len(checks)))
        return 1
    print("\nok - %d/%d install_prompt_guards cases" % (len(checks), len(checks)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
