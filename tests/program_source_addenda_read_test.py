#!/usr/bin/env python3
"""Guard the addenda reading agent's write (S388).

    python3 tests/program_source_addenda_read_test.py

kb/supabase_program_source_addenda_read.sql moves an addendum from listed to read and
files programs_changed. kb/addenda_reads/*.json is each filing it was called with.
The properties the write stands on:

  - service_role only: EXECUTE revoked from public, anon and authenticated;
  - a row a person corrected, or one already applied, gone or ruled out, is never touched;
  - every filing names each addendum once, carries a programs_changed array, and each
    change says its scope, its kind and what changed (a program by title and award,
    a course by its code), so a later reader can tell a program change from a course one.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL = open(os.path.join(ROOT, "kb", "supabase_program_source_addenda_read.sql")).read()
KINDS = {"new", "revised", "retitled", "discontinued", "corrected"}
fails = []


def check(ok, msg):
    if not ok:
        fails.append(msg)


body = re.sub(r"--[^\n]*", "", SQL)
check(re.search(r"revoke all on function public\.program_source_addenda_read\(text, jsonb\)\s+from public, anon, authenticated", body),
      "EXECUTE is not revoked from public, anon, authenticated")
check("to service_role" in body, "service_role holds no explicit grant")
check("corrected_by is null" in body, "the write does not skip a row a person corrected")
check(re.search(r"status in \('listed', 'read'\)", body), "the write may touch an applied, gone or ruled-out row")
check(not re.search(r"\b(delete|truncate|drop)\b", body, re.I), "the file names a destructive statement")

filings = sorted(glob.glob(os.path.join(ROOT, "kb", "addenda_reads", "read_*.json")))
check(filings, "no filing in kb/addenda_reads/")
for f in filings:
    d = json.load(open(f))
    name = os.path.basename(f)
    ids = [r["id"] for r in d["rows"]]
    check(len(ids) == len(set(ids)), "%s: an addendum is filed twice" % name)
    for r in d["rows"]:
        pc = r.get("programs_changed")
        check(isinstance(pc, list), "%s: addendum %s has no programs_changed array" % (name, r["id"]))
        for c in pc or []:
            where = "%s: addendum %s, %s" % (name, r["id"], c.get("title"))
            check(c.get("scope") in ("program", "course"), where + ": scope")
            check(c.get("change_kind") in KINDS, where + ": change_kind")
            check(c.get("change"), where + ": no change text")
            if c.get("scope") == "program":
                check(c.get("title") and c.get("award"), where + ": a program needs its title and award")
                cn = c.get("control_number")
                check(cn is None or re.fullmatch(r"\d{5}", cn), where + ": control number")
            else:
                check(c.get("course"), where + ": a course change needs the course code")

if fails:
    print("FAIL\n  " + "\n  ".join(fails))
    sys.exit(1)
print("ok: %d filing(s)" % len(filings))
