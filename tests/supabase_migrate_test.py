#!/usr/bin/env python3
"""The runner-applied migration (scripts/supabase_migrate.py) applies only a committed
.sql file under the repo's SQL folders, under a snake_case name, and records it in the
migrations ledger the way apply_migration does. Sam, 2026-10-13: "Build the runner with
or without my approvals". No network: the pure functions only.

Run from repo root: python3 tests/supabase_migrate_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import supabase_migrate as M  # noqa: E402

failures, n = [], [0]


def check(cond, msg):
    n[0] += 1
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        failures.append(msg)


t = M.parse_trigger("# a comment\nfile=chatbox/supabase_course_outcomes.sql\nname = course_outcomes_table\n")
check(t == {"file": "chatbox/supabase_course_outcomes.sql", "name": "course_outcomes_table"},
      "the trigger reads key=value lines, comments and spaces aside")
yes = lambda p: True  # noqa: E731
check(M.check_trigger(t, yes) is None, "a .sql under chatbox/ with a snake_case name may run")
check(M.check_trigger({"file": "../etc/x.sql", "name": "abc"}, yes)
      and M.check_trigger({"file": "/tmp/x.sql", "name": "abc"}, yes)
      and M.check_trigger({"file": "docs/x.sql", "name": "abc"}, yes)
      and M.check_trigger({"file": "chatbox/x.txt", "name": "abc"}, yes),
      "a path outside the SQL folders, climbing out, absolute, or not .sql is refused")
check(M.check_trigger({"file": "chatbox/x.sql", "name": "Bad Name"}, yes)
      and M.check_trigger({"file": "chatbox/x.sql", "name": "x"}, yes),
      "a name that is not snake_case is refused")
check(M.check_trigger({"file": "chatbox/missing.sql", "name": "abc"}, lambda p: False),
      "a file that is not committed is refused")
sql = "create table t (a text); -- it's a comment with $x$ in it"
led = M.ledger_sql("20261013150000", "course_outcomes_table", sql)
tag = led.split("array[$")[1].split("$")[0]
check(led.startswith("insert into supabase_migrations.schema_migrations (version, name, statements, created_by)")
      and "'20261013150000', 'course_outcomes_table'" in led and ("$%s$%s$%s$" % (tag, sql, tag)) in led
      and "on conflict (version) do nothing" in led,
      "the ledger row carries the version, the name and the file as its one statement, dollar-quoted")

if failures:
    print("FAIL: %d" % len(failures))
    sys.exit(1)
print("supabase_migrate_test.py: %d/%d checks passed" % (n[0], n[0]))
