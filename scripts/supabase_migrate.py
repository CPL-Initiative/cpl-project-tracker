#!/usr/bin/env python3
"""Apply one committed SQL file to the live database from a runner, with a receipt.

WHY. A session reaches Supabase only through the MCP connector, and its
apply_migration timed out on every try from 23:19Z on 2026-10-12 (nine times on
2026-10-13), with reads still working. Each structure change then went to Sam as
a paste. Sam, 2026-10-13: "Build the runner with or without my approvals". This
applies a committed file through the Supabase Management API
(POST /v1/projects/<ref>/database/query) with the SUPABASE_ACCESS_TOKEN secret the
chat deploy already uses, records it in supabase_migrations.schema_migrations the
way apply_migration does, and writes a receipt the workflow commits.

The trigger is kb/migrations/.apply, two lines:
    file=chatbox/supabase_course_outcomes.sql
    name=course_outcomes_table
The workflow (supabase-migrate.yml) runs the apply job in the GitHub environment
"database": with Sam as its required reviewer each apply waits for his approval;
with no protection rule it runs at once. The file is the receipt of what ran;
the receipt names its sha256, the response and the ledger row.

Usage (runner): python3 scripts/supabase_migrate.py --trigger kb/migrations/.apply
                python3 scripts/supabase_migrate.py --trigger kb/migrations/.apply --dry
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_REF = "hvuwhnbuahrtptokpqfh"
API = "https://api.supabase.com/v1/projects/%s/database/query" % PROJECT_REF
RECEIPTS = os.path.join(ROOT, "kb", "receipts")
SQL_DIRS = ("chatbox/", "kb/", "supabase/")
NAME = re.compile(r"^[a-z0-9][a-z0-9_]{2,80}$")


def parse_trigger(text: str) -> dict:
    """The trigger file's key=value lines."""
    out = {}
    for line in (text or "").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def check_trigger(t: dict, exists=os.path.exists) -> str | None:
    """Why this trigger may not run, or None."""
    f, name = t.get("file") or "", t.get("name") or ""
    if not f.endswith(".sql") or ".." in f or f.startswith("/") or not f.startswith(SQL_DIRS):
        return "file must be a .sql under %s, got %r" % (", ".join(SQL_DIRS), f)
    if not exists(os.path.join(ROOT, f)):
        return "no such file: %s" % f
    if not NAME.match(name):
        return "name must be snake_case (3-81 characters), got %r" % name
    return None


def ledger_sql(version: str, name: str, sql: str) -> str:
    """The schema_migrations row apply_migration would write, dollar-quoted."""
    tag = "m" + hashlib.md5(sql.encode()).hexdigest()[:12]
    return ("insert into supabase_migrations.schema_migrations (version, name, statements, created_by) "
            "values ('%s', '%s', array[$%s$%s$%s$], 'supabase-migrate.yml') "
            "on conflict (version) do nothing;" % (version, name, tag, sql, tag))


def post(query: str, token: str) -> tuple[int, str]:
    req = urllib.request.Request(API, data=json.dumps({"query": query}).encode(), method="POST",
                                 headers={"Authorization": "Bearer " + token,
                                          "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--trigger", required=True)
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args(argv)
    t = parse_trigger(open(os.path.join(ROOT, a.trigger)).read())
    why = check_trigger(t)
    if why:
        print("refused: " + why)
        return 2
    sql = open(os.path.join(ROOT, t["file"]), encoding="utf-8").read()
    version = time.strftime("%Y%m%d%H%M%S", time.gmtime())
    receipt = {"what": "supabase-migrate: one committed SQL file applied through the Management API",
               "file": t["file"], "name": t["name"], "version": version,
               "sha256": hashlib.sha256(sql.encode()).hexdigest(), "run": os.environ.get("GITHUB_RUN_ID")}
    if a.dry:
        print(json.dumps(receipt, indent=1))
        return 0
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not token.startswith("sbp_"):
        print("refused: SUPABASE_ACCESS_TOKEN is not a personal access token (sbp_)")
        return 2
    status, body = post(sql, token)
    receipt.update(status=status, response=body[:4000])
    if status < 300:
        lstatus, lbody = post(ledger_sql(version, t["name"], sql), token)
        receipt.update(ledger_status=lstatus, ledger_response=lbody[:1000])
    os.makedirs(RECEIPTS, exist_ok=True)
    path = os.path.join(RECEIPTS, "migration_%s_%s.json" % (t["name"], receipt["run"] or version))
    json.dump(receipt, open(path, "w"), indent=1)
    print(json.dumps({k: v for k, v in receipt.items() if k != "response"}, indent=1))
    print(body[:2000])
    return 0 if status < 300 else 1


if __name__ == "__main__":
    sys.exit(main())
