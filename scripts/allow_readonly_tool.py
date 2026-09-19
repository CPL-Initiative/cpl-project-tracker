#!/usr/bin/env python3
"""PreToolUse guard: auto-approve a CLOSED LIST of read-only MCP tools.

WHY THIS EXISTS
---------------
Part of the answer to Sam's 2026-09-19 ask (*"the swarm of 'Allow Once'
approval requests... It's making the work unsustainable."*). The other two
guards cover SQL and Bash; this one covers what is left, which in a normal
session is the `mcp__github__` reads — `pull_request_read`, `get_check_run`,
`actions_list`, `get_job_logs`, `get_file_contents` — plus the Supabase read
tools beside `execute_sql`.

⚠️ THE LIST IS THE MECHANISM, NOT THE MATCHER. `.claude/settings.json` routes
tools here with a regex, and a regex is easy to widen by accident — one stray
`.*` and `merge_pull_request` is auto-approved. So this file re-checks the tool
name against an explicit set and stays SILENT for anything else, which leaves
the harness's own prompt in place. Two independent things would have to be
wrong for a write tool to pass.

⚠️ WHAT IS DELIBERATELY ABSENT, and must stay absent: everything OUTWARD-FACING
or mutating — `create_pull_request`, `merge_pull_request`, `update_pull_request`,
`add_issue_comment`, `add_comment_to_pending_review`, `push_files`,
`create_or_update_file`, `delete_file`, `actions_run_trigger`,
`apply_migration`, `deploy_edge_function`. The prompt on those is doing real
work: they publish, they spend CI, or they change a shared table. A comment
posted to a colleague's PR by accident cannot be recalled.

Tests: tests/allow_readonly_tool_test.py
"""
import json
import sys

# GitHub: reads only. Each name is spelled out — no prefix matching, because
# `get_`/`list_` prefixes would sweep in tools added later that nobody checked.
GITHUB_READS = {
    "mcp__github__get_me",
    "mcp__github__get_commit",
    "mcp__github__get_file_contents",
    "mcp__github__get_check_run",
    "mcp__github__get_job_logs",
    "mcp__github__get_label",
    "mcp__github__get_latest_release",
    "mcp__github__get_release_by_tag",
    "mcp__github__get_tag",
    "mcp__github__get_team_members",
    "mcp__github__get_teams",
    "mcp__github__list_branches",
    "mcp__github__list_commits",
    "mcp__github__list_issues",
    "mcp__github__list_issue_types",
    "mcp__github__list_issue_fields",
    "mcp__github__list_pull_requests",
    "mcp__github__list_releases",
    "mcp__github__list_repository_collaborators",
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
    "mcp__github__search_users",
}

# Supabase: the read tools beside execute_sql, which has its own guard because
# its safety depends on the STATEMENT rather than on the tool name.
SUPABASE_READS = {
    "mcp__Supabase__list_tables",
    "mcp__Supabase__list_extensions",
    "mcp__Supabase__list_migrations",
    "mcp__Supabase__list_edge_functions",
    "mcp__Supabase__get_edge_function",
    "mcp__Supabase__list_branches",
    "mcp__Supabase__list_projects",
    "mcp__Supabase__list_organizations",
    "mcp__Supabase__get_project",
    "mcp__Supabase__get_project_url",
    "mcp__Supabase__get_organization",
    "mcp__Supabase__get_advisors",
    "mcp__Supabase__query_logs",
    "mcp__Supabase__search_docs",
    "mcp__Supabase__generate_typescript_types",
}

ALLOWED = GITHUB_READS | SUPABASE_READS


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0                      # cannot read the payload: say nothing

    if payload.get("tool_name") not in ALLOWED:
        return 0                      # not ours: leave the prompt in place

    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",
        "permissionDecisionReason":
            "Read-only tool (auto-approved by the repo's read-only tool list).",
    }}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
