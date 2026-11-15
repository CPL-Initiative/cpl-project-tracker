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
check(M.check_trigger(dict(t, project="budget-support"), yes) is None
      and M.project_ref(dict(t, project="budget-support")) == "mdxutmbpoqjtdcwjscux"
      and M.project_ref(t) == "hvuwhnbuahrtptokpqfh",
      "project= names the budget project; with none the trigger runs on Work Plan")
check(M.check_trigger(dict(t, project="some-other-ref"), yes)
      and M.check_trigger(dict(t, project="hvuwhnbuahrtptokpqfh"), yes),
      "a project outside the allowlist, or a raw ref, is refused")
sql = "create table t (a text); -- it's a comment with $x$ in it"
led = M.ledger_sql("20261013150000", "course_outcomes_table", sql)
tag = led.split("array[$")[1].split("$")[0]
check(led.startswith("insert into supabase_migrations.schema_migrations (version, name, statements, created_by)")
      and "'20261013150000', 'course_outcomes_table'" in led and ("$%s$%s$%s$" % (tag, sql, tag)) in led
      and "on conflict (version) do nothing" in led,
      "the ledger row carries the version, the name and the file as its one statement, dollar-quoted")

# A file that names a check receipt runs only beside a receipt for this file and this payload (COBIx on #3315,
# 2026-11-14 18:47Z: "have --check write a small receipt ... and have the runner refuse the .apply line unless a
# receipt for the current head exists"). The Honors rows migration names one; every other file is untouched.
import hashlib  # noqa: E402
import json  # noqa: E402
import tempfile  # noqa: E402

check(M.check_receipt("insert into t values (1);", "/nonexistent") is None,
      "a file that names no check receipt is not read for one")
with tempfile.TemporaryDirectory() as td:
    os.makedirs(os.path.join(td, "kb", "out"))
    pay = os.path.join(td, "kb", "payload.json")
    open(pay, "w").write('{"a": 1}')
    body = "-- requires-check-receipt: kb/out/check_receipt.json\ninsert into t values (1);\n"
    rp = os.path.join(td, "kb", "out", "check_receipt.json")
    check(M.check_receipt(body, td) and "not committed" in M.check_receipt(body, td),
          "a file that names a receipt is refused while the receipt is missing")

    def write(sql_text, payload_text):
        json.dump({"sql_sha256": hashlib.sha256(sql_text.encode()).hexdigest(),
                   "payload": {"kb/payload.json": hashlib.sha256(payload_text.encode()).hexdigest()}},
                  open(rp, "w"))
    write(body, '{"a": 1}')
    check(M.check_receipt(body, td) is None, "a receipt naming this file and this payload lets it run")
    write(body + "-- edited\n", '{"a": 1}')
    check(M.check_receipt(body, td) and "another version" in M.check_receipt(body, td),
          "a receipt written for another version of the file is refused")
    write(body, '{"a": 2}')
    check(M.check_receipt(body, td) and "has moved" in M.check_receipt(body, td),
          "a receipt whose payload has moved since (a daily run, a merge of main) is refused")
    json.dump({"sql_sha256": hashlib.sha256(body.encode()).hexdigest()}, open(rp, "w"))
    check(M.check_receipt(body, td) and "names no payload" in M.check_receipt(body, td),
          "a receipt that names no payload is refused")
    check(M.check_receipt(body.replace("kb/out/", "../"), td), "a receipt path that climbs out is refused")
rows_sql = os.path.join(ROOT, "kb", "migrations", "2026-11-14_s653_honors_of_rows.sql")
if os.path.exists(rows_sql):
    check(M.RECEIPT_LINE.search(open(rows_sql, encoding="utf-8").read()),
          "the Honors rows migration names its check receipt")

if failures:
    print("FAIL: %d" % len(failures))
    sys.exit(1)
print("supabase_migrate_test.py: %d/%d checks passed" % (n[0], n[0]))
