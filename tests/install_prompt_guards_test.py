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
