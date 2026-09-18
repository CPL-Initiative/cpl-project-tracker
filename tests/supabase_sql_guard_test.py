#!/usr/bin/env python3
"""Guard the guard: `scripts/supabase_sql_guard.py` must never allow a write.

    python3 tests/supabase_sql_guard_test.py

The hook returns `allow` for read-only SQL so auto mode stops prompting on every
query, and that convenience is only safe while the write cases stay `deny`. The
asymmetry is the whole point, so the cases below are weighted accordingly:

  * A FALSE ALLOW is the failure that matters — a write reaching a shared table
    with no prompt and no receipt, which is the exact thing CLAUDE.md Rule 10
    exists to prevent.
  * A FALSE DENY is an annoyance: the session says so and Sam runs the
    statement. The literal-stripping cases below exist because that annoyance
    would otherwise be constant — `where status = 'update'` and a column named
    `updated_at` appear throughout this repo's own queries.

Anything unparseable must land on `ask`, never `allow`. `ask` is today's
behavior, so an unrecognized statement costs a prompt rather than a surprise.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUARD = os.path.join(ROOT, "scripts", "supabase_sql_guard.py")

# (label, sql, expected decision)
CASES = [
    # ── reads this repo actually runs ────────────────────────────────────────
    ("rule-8 memory query",
     "select slug, title from cpl_memory where status <> 'superseded' "
     "and tags && array['auth'] order by event_date desc limit 40;", "allow"),
    ("cobi_nav audience roll-up",
     "select kind, audience, hidden, count(*) as n from cobi_nav "
     "group by kind, audience, hidden;", "allow"),
    ("CTE read",
     "with sel as (select t.oid from pg_class t) "
     "select gate, count(*) from sel group by 1;", "allow"),
    ("policy introspection",
     "select c.relname, p.polname from pg_policy p "
     "join pg_class c on c.oid=p.polrelid where c.relname in ('cobi_nav');",
     "allow"),
    ("explain", "explain analyze select 1;", "allow"),
    ("show", "show statement_timeout;", "allow"),

    # ── a write verb inside a LITERAL is not a write ─────────────────────────
    ("literal equals 'update'",
     "select * from map_data_loads where status = 'update';", "allow"),
    ("column named updated_at",
     "select updated_at from cobi_nav order by updated_at desc;", "allow"),
    ("ilike '%insert%'",
     "select slug from cpl_memory where summary ilike '%insert%';", "allow"),
    ("comment marker inside a LIKE pattern",
     "select polname from pg_policy where polname like '%--%';", "allow"),
    ("quoted identifier",
     'select "drop" from weird_table;', "allow"),

    # ── writes: every one of these must be denied ────────────────────────────
    ("insert", "insert into cpl_memory (slug) values ('x');", "deny"),
    ("update", "update cobi_nav set audience='everyone' where key='admin';", "deny"),
    ("delete", "delete from kb_curation where id = 5;", "deny"),
    ("CTE-wrapped insert",
     "with x as (select 1) insert into t select * from x;", "deny"),
    ("truncate", "truncate table stg_map_student_credit;", "deny"),
    ("drop", "drop table cobi_nav;", "deny"),
    ("alter", "alter table cobi_nav add column access text;", "deny"),
    ("grant", "grant select on cobi_nav to anon;", "deny"),
    ("revoke", "revoke execute on function f() from public;", "deny"),
    ("create", "create table foo (id int);", "deny"),
    ("write smuggled after a read",
     "select 1; drop table cobi_nav;", "deny"),
    ("do block hiding a delete",
     "do $$ begin delete from t; end $$;", "deny"),
    ("call", "call some_procedure();", "deny"),
    ("write inside a dollar-quoted body",
     "create function f() returns void as $body$ delete from t; $body$ "
     "language sql;", "deny"),

    # ── ambiguous: must fall through to the prompt, never to allow ───────────
    ("select into materializes a table",
     "select * into backup_tbl from cobi_nav;", "ask"),
    ("transaction control", "begin; select 1;", "ask"),
    ("empty", "", "ask"),
    ("whitespace only", "   \n  ", "ask"),
    ("unparseable", "frobnicate the widgets", "ask"),
]


def run(sql):
    payload = {"tool_name": "mcp__Supabase__execute_sql",
               "tool_input": {"query": sql}}
    p = subprocess.run([sys.executable, GUARD], input=json.dumps(payload),
                       capture_output=True, text=True)
    if p.returncode != 0:
        return "EXIT%d" % p.returncode
    try:
        return json.loads(p.stdout)["hookSpecificOutput"]["permissionDecision"]
    except Exception:
        return "UNPARSEABLE(%s)" % p.stdout[:60]


def main():
    failures = []
    for label, sql, want in CASES:
        got = run(sql)
        if got != want:
            failures.append("  %-42s expected %-5s got %s" % (label, want, got))

    # A hook fires on every tool call it is wired to; emitting a decision for a
    # tool it does not own would hand every Bash call to this classifier.
    p = subprocess.run(
        [sys.executable, GUARD],
        input=json.dumps({"tool_name": "Bash", "tool_input": {"command": "ls"}}),
        capture_output=True, text=True)
    if p.stdout.strip() or p.returncode != 0:
        failures.append("  %-42s expected silence, got %r (exit %d)"
                        % ("non-Supabase tool passes through", p.stdout[:60],
                           p.returncode))

    total = len(CASES) + 1
    if failures:
        print("FAIL - %d of %d guard cases wrong:\n%s"
              % (len(failures), total, "\n".join(failures)))
        return 1
    print("ok - %d/%d supabase_sql_guard cases" % (total, total))
    return 0


if __name__ == "__main__":
    sys.exit(main())
