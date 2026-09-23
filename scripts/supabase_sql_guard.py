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
SQL with a small lexer and regexes, not a parser, and anyone deliberately trying
to get a write past it can. The accident it must still catch is an ordinary
one: a session's own comment with an apostrophe in it (see _lex). It stops the write a session did not mean to make.
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


_DOLLAR_OPEN = re.compile(r"\$([A-Za-z_][A-Za-z0-9_]*)?\$")


def _lex(sql):
    """Replace comments and string/identifier literals, in ONE left-to-right pass.

    Returns (clean, complete). `complete` is False when a string, identifier,
    dollar body or block comment never closes, and the caller asks.

    ⚠️ ONE PASS, BECAUSE TWO READINGS OF THE SAME TEXT DISAGREE (2026-09-23).
    This used to be four regex passes, literals first so a `--` inside a string
    stayed text. That ordering also made a quote inside a COMMENT open a
    literal: `-- the curator's list` paired its apostrophe with the next quote
    in the statement and swallowed everything between. Measured that day:
    `select 1; -- the curator's list` + newline + `delete from kb_curation ...;
    -- end'` came back `allow`, and three sessions' memory receipts, whose
    headers said "the repo's", reduced to their last clause and were refused.
    Postgres reads left to right and whichever construct opens first wins, so
    this does too.

    Block comments do not nest here, where Postgres nests them. Ending one
    early only shows the guard MORE of the statement than runs, which can cost
    a false deny and never hides a write.
    """
    out, i, n = [], 0, len(sql)
    while i < n:
        c = sql[i]
        nxt = sql[i + 1] if i + 1 < n else ""
        if c == "-" and nxt == "-":
            j = sql.find("\n", i)
            i = n if j < 0 else j
            out.append(" ")
            continue
        if c == "/" and nxt == "*":
            j = sql.find("*/", i + 2)
            if j < 0:
                return "".join(out), False
            out.append(" ")
            i = j + 2
            continue
        if c == "'":
            # E'...' honors backslash escapes, so E'it\'s' is ONE string.
            prev, prev2 = sql[i - 1] if i else "", sql[i - 2] if i > 1 else ""
            esc = prev in ("e", "E") and not (prev2.isalnum() or prev2 == "_")
            j = i + 1
            while True:
                if j >= n:
                    return "".join(out), False
                ch = sql[j]
                if esc and ch == "\\":
                    j += 2
                    continue
                if ch == "'":
                    if j + 1 < n and sql[j + 1] == "'":
                        j += 2
                        continue
                    break
                j += 1
            out.append(" lit ")
            i = j + 1
            continue
        if c == '"':
            j = i + 1
            while True:
                if j >= n:
                    return "".join(out), False
                if sql[j] == '"':
                    if j + 1 < n and sql[j + 1] == '"':
                        j += 2
                        continue
                    break
                j += 1
            out.append(" ident ")
            i = j + 1
            continue
        if c == "$" and not (i and (sql[i - 1].isalnum() or sql[i - 1] == "_")):
            m = _DOLLAR_OPEN.match(sql, i)   # `$1` is a parameter, never a quote
            if m:
                j = sql.find(m.group(0), m.end())
                if j < 0:
                    return "".join(out), False
                out.append(" lit ")
                i = j + len(m.group(0))
                continue
        out.append(c)
        i += 1
    return "".join(out), True


def strip_noise(sql):
    """Comments and literals removed; see _lex()."""
    return _lex(sql)[0]


# `INSERT ... ON CONFLICT (slug) DO NOTHING` is the INSERT-only, idempotent form
# Rule 10 asks for, and its `do` is a clause, not a DO block. Only DO NOTHING
# with a plain column list or a named constraint is read that way: DO UPDATE
# overwrites a row that may carry a human's verdict, and keeps the deny.
_ON_CONFLICT_NOTHING = re.compile(
    r"\bon\s+conflict\b(\s*\([^()]*\)|\s+on\s+constraint\s+[a-z_][a-z0-9_$]*)?\s+do\s+nothing\b")


def decide(sql):
    if not sql or not sql.strip():
        return "ask", "Empty query - nothing to classify."
    clean, complete = _lex(sql)
    if not complete:
        return "ask", "A string, identifier or comment never closes - confirm by hand."
    clean = _ON_CONFLICT_NOTHING.sub(" on conflict ", clean.lower())

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
