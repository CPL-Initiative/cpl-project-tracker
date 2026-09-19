#!/usr/bin/env python3
"""Guard the guard: `scripts/allow_readonly_tool.py` auto-approves reads only.

    python3 tests/allow_readonly_tool_test.py

A hook returning `allow` is a REAL grant — it removes the human check rather
than deferring it. So the shape of this file matches the other two guards: the
write cases are exhaustive and the read cases cover what a session actually
runs.

⚠️ THE MUTATING CASES ARE THE POINT. `.claude/settings.json` routes tools here
with a REGEX, and one stray `.*` would hand `merge_pull_request` an automatic
yes. The script re-checks the name against an explicit set for exactly that
reason, and these cases prove the second check holds on its own.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
GUARD = os.path.join(os.path.dirname(HERE), "scripts", "allow_readonly_tool.py")

CASES = [
    # ── reads a session makes all day ────────────────────────────────────
    ("mcp__github__pull_request_read", "allow"),
    ("mcp__github__get_check_run", "allow"),
    ("mcp__github__get_job_logs", "allow"),
    ("mcp__github__actions_list", "allow"),
    ("mcp__github__get_file_contents", "allow"),
    ("mcp__github__list_commits", "allow"),
    ("mcp__github__search_code", "allow"),
    ("mcp__Supabase__list_tables", "allow"),
    ("mcp__Supabase__query_logs", "allow"),
    ("mcp__Supabase__get_advisors", "allow"),
    ("mcp__Supabase__list_edge_functions", "allow"),

    # ── ⚠️ outward-facing or mutating: the prompt must survive ───────────
    ("mcp__github__create_pull_request", "ask"),
    ("mcp__github__merge_pull_request", "ask"),
    ("mcp__github__update_pull_request", "ask"),
    ("mcp__github__add_issue_comment", "ask"),
    ("mcp__github__add_comment_to_pending_review", "ask"),
    ("mcp__github__pull_request_review_write", "ask"),
    ("mcp__github__push_files", "ask"),
    ("mcp__github__create_or_update_file", "ask"),
    ("mcp__github__delete_file", "ask"),
    ("mcp__github__actions_run_trigger", "ask"),
    ("mcp__github__issue_write", "ask"),
    ("mcp__github__create_branch", "ask"),
    ("mcp__github__fork_repository", "ask"),
    ("mcp__github__resolve_review_thread", "ask"),
    ("mcp__Supabase__apply_migration", "ask"),
    ("mcp__Supabase__deploy_edge_function", "ask"),
    ("mcp__Supabase__create_branch", "ask"),
    ("mcp__Supabase__merge_branch", "ask"),
    ("mcp__Supabase__reset_branch", "ask"),
    ("mcp__Supabase__pause_project", "ask"),
    ("mcp__Supabase__create_project", "ask"),

    # ── execute_sql has its OWN guard: safety depends on the statement, ──
    #    not the tool name, so this file must not speak for it at all.
    ("mcp__Supabase__execute_sql", "ask"),

    # ── other tools are none of this hook's business ─────────────────────
    ("Bash", "ask"),
    ("Write", "ask"),
    ("Edit", "ask"),
    ("mcp__Google_Drive__create_file", "ask"),
    ("", "ask"),
]


def run(tool_name):
    payload = json.dumps({"tool_name": tool_name, "tool_input": {}})
    out = subprocess.run([sys.executable, GUARD], input=payload,
                         capture_output=True, text=True).stdout.strip()
    if not out:
        return "ask"            # silence leaves the harness's own prompt in place
    try:
        return json.loads(out)["hookSpecificOutput"]["permissionDecision"]
    except Exception:
        return "unparseable:" + out[:60]


def main():
    failures = []
    for tool, expected in CASES:
        got = run(tool)
        if got != expected:
            failures.append("  %-48s expected %-5s got %s" % (tool or "(empty)", expected, got))

    # A near-miss must not pass: the check is set membership, never a prefix.
    for near in ("mcp__github__get_file_contents_and_write",
                 "mcp__github__pull_request_read_write",
                 "xmcp__Supabase__list_tables"):
        if run(near) != "ask":
            failures.append("  near-miss %r was allowed" % near)

    total = len(CASES) + 3
    if failures:
        print("FAIL - %d of %d readonly-tool cases wrong:\n%s"
              % (len(failures), total, "\n".join(failures)))
        return 1
    print("ok - %d/%d allow_readonly_tool cases" % (total, total))
    return 0


if __name__ == "__main__":
    sys.exit(main())
