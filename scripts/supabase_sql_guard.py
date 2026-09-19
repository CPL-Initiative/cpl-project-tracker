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

# ⚠️ THE ONE CARVE-OUT, AND IT EXISTS BECAUSE THIS GUARD BLOCKED RULE 8 ITSELF.
# Measured 2026-09-19: `insert into cpl_memory (slug) values (..)` -> deny, and
# `update cpl_memory set summary=...` -> deny. Rule 9 requires EVERY checkpoint
# to write cpl_memory, so wherever this hook fires the checkpoint could not
# complete — a guard that blocks the doctrine it was written to serve.
#
# The carve-out is deliberately the narrowest thing that unblocks it: a
# statement whose write verbs are ONLY insert/update and whose EVERY write
# targets cpl_memory. It fails closed by counting — if the statement contains
# three `insert` tokens and only two of them name cpl_memory, the count
# disagrees and the whole statement goes back to `deny`. A second table, a
# delete, a truncate, a drop, or a verb this file cannot place all keep the
# original answer.
#
# cpl_memory is the right table to carve out and the only one: it is the
# session's OWN memory, appended to by every checkpoint, keyed by slug, and it
# holds no student data and no curator decisions. kb_curation is exactly the
# table Rule 10 exists to protect and stays behind the prompt.
MEMORY_TABLE = "cpl_memory"


def _memory_only_write(clean, hits):
    """True when every write in this statement targets cpl_memory."""
    if set(hits) - {"insert", "update"}:
        return False
    inserts = re.findall(r"\binsert\b", clean)
    updates = re.findall(r"\bupdate\b", clean)
    ok_ins = re.findall(r"\binsert\s+into\s+(?:public\.)?" + MEMORY_TABLE + r"\b", clean)
    ok_upd = re.findall(r"\bupdate\s+(?:only\s+)?(?:public\.)?" + MEMORY_TABLE + r"\b", clean)
    if len(inserts) != len(ok_ins) or len(updates) != len(ok_upd):
        return False
    return bool(ok_ins or ok_upd)


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
    if hits and _memory_only_write(clean, hits):
        return "allow", (
            "Rule 8 memory write to cpl_memory (auto-approved by the repo's "
            "guard). Every write in this statement targets cpl_memory."
        )
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
