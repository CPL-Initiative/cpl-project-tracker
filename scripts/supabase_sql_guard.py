#!/usr/bin/env python3
"""PreToolUse guard for mcp__Supabase__execute_sql.

WHY THIS EXISTS
---------------
PR #1617 added `mcp__Supabase__execute_sql` to `permissions.allow` so the Sierra
lane could stop answering a prompt per query. Two things followed, and they pull
in opposite directions:

  1. The prompts did not stop. `permissions.allow` is the PERMISSION layer; auto
     mode runs a SEPARATE classifier that judges each call on its content, and
     arbitrary SQL against a production database is exactly what it escalates.
     The prompt offers no "Always allow" because the allow rule already exists —
     there is nothing left for that button to add. Sam, 2026-09-18: "nonstop
     requests to allow Execute SQL... no option to Always Allow... driving me
     nuts!"

  2. Rule 10's write discipline lost its only mechanism. The permission prompt
     WAS the enforcement; allowlisting the tool removed it and left every
     session to remember the doctrine
     (`cpl_memory` advice-execute-sql-allowlist-needs-a-pretooluse-hook-2026-09-18).

A PreToolUse hook answers both at once: it returns `allow` for a read, so the
classifier never sees it, and `deny` for a write, so Rule 10 is enforced by the
harness rather than by recall.

WARNING: THIS IS A GUARDRAIL AGAINST ACCIDENT, NOT A SECURITY BOUNDARY. It reads
SQL with a regex; SQL is not a regular language, and anyone deliberately trying
to get a write past it can. It stops the write a session did not mean to make.
The durable control is a Postgres role with no write grants — see
`docs/reference/lanes/org-phrase-scope-auth.md`.

DECISIONS
---------
Three outcomes, and the default is the SAFE one:
  allow  — the statement is a read, every token of it.
  deny   — a write verb is present. Named in the reason so the session can
           route to the documented path (apply_migration, a migration file, or
           the curation pipeline) instead of guessing.
  ask    — anything else, including anything this script could not parse. An
           unparseable statement falls through to the prompt, which is today's
           behavior; it never falls through to `allow`.

Tests: tests/supabase_sql_guard_test.py
"""
import json
import re
import sys

# Verbs that change data, schema, permissions or session state. `call` and `do`
# execute arbitrary bodies; `select ... into` materializes a table. Checked as
# whole words AFTER literals and comments are stripped, so a column named
# `updated_at` or a filter on the string 'insert' cannot trip them.
WRITE_VERBS = (
    "insert", "update", "delete", "truncate", "drop", "alter", "create",
    "grant", "revoke", "merge", "upsert", "replace", "copy", "call", "do",
    "vacuum", "reindex", "cluster", "comment", "security", "import", "lock",
)
# Statement-control verbs — harmless alone, but they are how a write is wrapped.
TXN_VERBS = ("begin", "commit", "rollback", "savepoint", "start", "end")

READ_STARTS = ("select", "with", "explain", "show", "table", "values")


def strip_noise(sql):
    """Remove comments and string/identifier literals.

    Order matters: literals go first, because a comment marker inside a string
    ('--' in a LIKE pattern) is not a comment, and a quote inside a comment is
    not a literal. Dollar-quoting is handled before single quotes because a
    $$...$$ body may contain unbalanced quotes.
    """
    sql = re.sub(r"\$([A-Za-z_]\w*)?\$.*?\$\1?\$", " lit ", sql, flags=re.S)
    sql = re.sub(r"'(?:[^']|'')*'", " lit ", sql, flags=re.S)
    sql = re.sub(r'"(?:[^"]|"")*"', " ident ", sql, flags=re.S)
    sql = re.sub(r"--[^\n]*", " ", sql)
    sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
    return sql


def decide(sql):
    if not sql or not sql.strip():
        return "ask", "Empty query - nothing to classify."
    clean = strip_noise(sql).lower()

    hits = [v for v in WRITE_VERBS if re.search(r"\b" + v + r"\b", clean)]
    if hits:
        return "deny", (
            "Blocked by the repo's Supabase guard: this statement contains "
            + ", ".join(sorted(set(hits)))
            + ". CLAUDE.md Rule 10 routes writes to a shared table through a "
            "reviewed path - apply_migration for DDL, an INSERT-only cohort "
            "under a <lane>-s<N>@bot reviewer_email with a committed receipt "
            "for data, or the curation pipeline. If this write IS the reviewed "
            "plan, say so and Sam can run it, or lift the guard for the run."
        )

    # `select ... into new_table` writes. The bare `into` of a PL/pgSQL block
    # does not reach here (a `do` body is caught above).
    if re.search(r"\binto\b", clean):
        return "ask", "Contains INTO - may materialize a table. Confirm by hand."

    if any(re.search(r"\b" + v + r"\b", clean) for v in TXN_VERBS):
        return "ask", "Contains transaction control - confirm by hand."

    first = re.match(r"\s*\(*\s*([a-z]+)", clean)
    if first and first.group(1) in READ_STARTS:
        return "allow", "Read-only SQL (auto-approved by the repo's guard)."
    return "ask", "Could not confirm this statement is read-only."


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        # A guard that cannot read its input must not be the thing that decides.
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason":
                "Supabase guard could not parse the hook payload.",
        }}))
        return 0

    if payload.get("tool_name") != "mcp__Supabase__execute_sql":
        return 0

    query = (payload.get("tool_input") or {}).get("query", "")
    decision, reason = decide(query)
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": reason,
    }}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
