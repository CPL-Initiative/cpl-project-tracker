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

The trigger is kb/migrations/.apply, two lines and an optional third:
    file=chatbox/supabase_course_outcomes.sql
    name=course_outcomes_table
    project=budget-support        (optional; default work-plan)
`project` names one of PROJECTS below and nothing else: the budget project's
apply_migration prompt timed out twice on 2026-11-07 (S603, COBIx item 10), and
Rule 10 (c) sends a timed-out migration here.
A file whose header names `-- requires-check-receipt: <path>` runs only beside a committed receipt that names
its sha256 and the payload it was checked on (check_receipt).
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
# The only projects a trigger may name. Work Plan is the default.
PROJECTS = {"work-plan": "hvuwhnbuahrtptokpqfh", "budget-support": "mdxutmbpoqjtdcwjscux"}
PROJECT_REF = PROJECTS["work-plan"]
API = "https://api.supabase.com/v1/projects/%s/database/query"
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
    if t.get("project", "work-plan") not in PROJECTS:
        return "project must be one of %s, got %r" % (", ".join(sorted(PROJECTS)), t.get("project"))
    return None


RECEIPT_LINE = re.compile(r"^-- requires-check-receipt: (\S+)$", re.M)
RECEIPT_NEAR = re.compile(r"requires?\W{0,3}checks?\W{0,3}receipts?|check\W{0,3}receipt\W{0,3}:", re.I)
# Files that must carry a check receipt whatever their header says: deleting the header line never skips the gate
# (#3315's anchors review). The Honors rows first.
REQUIRES_RECEIPT = ("kb/migrations/2026-11-14_s653_honors_of_rows.sql",)


def _inside(root: str, rel: str) -> str | None:
    """The real path of rel under root, or None when it leaves root (.., an absolute path, a symlink out)."""
    if not rel or rel.startswith("/") or ".." in rel.replace("\\", "/").split("/"):
        return None
    real, top = os.path.realpath(os.path.join(root, rel)), os.path.realpath(root)
    return real if real == top or real.startswith(top + os.sep) else None


def check_receipt(sql: str, root: str = ROOT, trigger_file: str | None = None,
                  main_head: str | None = None) -> str | None:
    """Why a file that names a check receipt may not run, or None. A migration whose header carries
    `-- requires-check-receipt: <path>` runs only when that receipt exists inside the repo, names this file (the
    trigger's file) and its sha256, names the sha256 of each payload file as the checkout holds it now, and was
    written at main's head as it stands at the apply (COBIx on #3315, 2026-11-14 18:47Z; #3315's fourth review: a cron
    that lands on main between the check and the apply refuses it). A near-miss spelling of the header line refuses
    rather than skipping the check. A file with no such line is not read this way."""
    sql = sql or ""
    m = RECEIPT_LINE.search(sql)
    near = [ln for ln in sql.splitlines() if RECEIPT_NEAR.search(ln)]
    if not m:
        if near:
            return ("the header names a check receipt in a form the runner does not read (%r): write "
                    "'-- requires-check-receipt: <path>' exactly" % near[0][:80])
        if trigger_file in REQUIRES_RECEIPT:
            return "%s must carry a check receipt, and its header names none" % trigger_file
        return None
    if len(near) != 1:
        return "the file names a check receipt %d times; it must name one" % len(near)
    rel = m.group(1)
    path = _inside(root, rel)
    if not path or not rel.endswith(".json"):
        return "the receipt path must be a .json inside the repo, got %r" % rel
    if not os.path.exists(path):
        return "the file requires its check receipt, and %s is not committed: run the check and commit it" % rel
    try:
        rec = json.load(open(path, encoding="utf-8"))
    except (OSError, ValueError) as e:
        return "the check receipt %s does not read: %s" % (rel, e)
    if trigger_file is not None and rec.get("sql") != trigger_file:
        return "the check receipt %s was written for %r, not the trigger's %r" % (rel, rec.get("sql"), trigger_file)
    if rec.get("sql_sha256") != hashlib.sha256(sql.encode()).hexdigest():
        return "the check receipt %s was written for another version of this file: run the check again" % rel
    if not main_head or rec.get("origin_main_head") != main_head:
        return ("the check receipt %s was written at main %s, and main is at %s now: merge main, run the check "
                "again" % (rel, (rec.get("origin_main_head") or "?")[:8], (main_head or "unreadable")[:12]))
    payload = rec.get("payload") or {}
    if not payload:
        return "the check receipt %s names no payload" % rel
    for p, digest in sorted(payload.items()):
        f = _inside(root, p)
        if not f or not os.path.exists(f) or hashlib.sha256(open(f, "rb").read()).hexdigest() != digest:
            return "%s has moved since the check receipt %s was written: run the check again" % (p, rel)
    return None


def main_head_now() -> str | None:
    """main's head on origin, as the apply runs (the runner's checkout has origin)."""
    import subprocess
    try:
        out = subprocess.run(["git", "-C", ROOT, "ls-remote", "origin", "refs/heads/main"], capture_output=True,
                             text=True, timeout=60).stdout.split()
        return out[0] if out else None
    except (OSError, ValueError, subprocess.SubprocessError):
        return None


def project_ref(t: dict) -> str:
    """The project ref a checked trigger names."""
    return PROJECTS[t.get("project", "work-plan")]


def ledger_sql(version: str, name: str, sql: str) -> str:
    """The schema_migrations row apply_migration would write, dollar-quoted."""
    tag = "m" + hashlib.md5(sql.encode()).hexdigest()[:12]
    return ("insert into supabase_migrations.schema_migrations (version, name, statements, created_by) "
            "values ('%s', '%s', array[$%s$%s$%s$], 'supabase-migrate.yml') "
            "on conflict (version) do nothing;" % (version, name, tag, sql, tag))


def post(query: str, token: str, ref: str = PROJECT_REF) -> tuple[int, str]:
    req = urllib.request.Request(API % ref, data=json.dumps({"query": query}).encode(), method="POST",
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
    needs = RECEIPT_NEAR.search(sql) or t["file"] in REQUIRES_RECEIPT
    why = check_receipt(sql, ROOT, t["file"], main_head_now() if needs else None)
    if why:
        print("refused: " + why)
        return 2
    version = time.strftime("%Y%m%d%H%M%S", time.gmtime())
    receipt = {"what": "supabase-migrate: one committed SQL file applied through the Management API",
               "file": t["file"], "name": t["name"], "version": version,
               "sha256": hashlib.sha256(sql.encode()).hexdigest(), "run": os.environ.get("GITHUB_RUN_ID"),
               "project": t.get("project", "work-plan"), "project_ref": project_ref(t)}
    if a.dry:
        print(json.dumps(receipt, indent=1))
        return 0
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not token.startswith("sbp_"):
        print("refused: SUPABASE_ACCESS_TOKEN is not a personal access token (sbp_)")
        return 2
    ref = project_ref(t)
    status, body = post(sql, token, ref)
    receipt.update(status=status, response=body[:4000])
    if status < 300:
        lstatus, lbody = post(ledger_sql(version, t["name"], sql), token, ref)
        receipt.update(ledger_status=lstatus, ledger_response=lbody[:1000])
    os.makedirs(RECEIPTS, exist_ok=True)
    path = os.path.join(RECEIPTS, "migration_%s_%s.json" % (t["name"], receipt["run"] or version))
    json.dump(receipt, open(path, "w"), indent=1)
    print(json.dumps({k: v for k, v in receipt.items() if k != "response"}, indent=1))
    print(body[:2000])
    return 0 if status < 300 else 1


if __name__ == "__main__":
    sys.exit(main())
