#!/usr/bin/env python3
"""Apply a display build's receipt to program_requirement_records from a runner.

WHY. kb/_build_roep_display.py writes each harvested program's display facts
twice: into cpl_pathways_roep_data.js for the page, and into a receipt
(kb/receipts/program_requirement_records_display_<date>_<build>.sql) for the
table Sierra and the Records view read. Until S356 a session applied the
receipt through the Supabase connector's apply_migration, a batch of about
twenty statements a migration. That held for the pilot's 22 programs (185 KB).
A full college is a 2.2 MB receipt for Cerritos alone, and every college after
it adds another; pushed through a session, each one costs hundreds of thousands
of tokens and an afternoon of timeouts. So the receipt is applied where the
service key already lives: the college workflow's display job
(.github/workflows/program-requirements-college.yml, step=display).

WHAT IT APPLIES. The receipt of the build the page carries: the build stamp in
cpl_pathways_roep_data.js names it, so the table and the page agree by
construction, and a dispatch needs no input to get it right. Each statement's
display JSON is applied exactly as the receipt prints it (the receipt is the
reviewed artifact; nothing here rebuilds it), with one PATCH a program on its
key, writing display and nothing else. The verdict trigger
(program_requirement_records_follow_verdict) re-applies the latest verdict
from record and checks, which a display write leaves alone, so a person's
Confirm survives.

ROLLBACK (Rule 10 a2). Before writing, it reads each row's current build and
files it in the applied record beside the receipt
(<receipt>.applied_<run>.json): a row that held no display goes back to null,
and a row that held an older build goes back by re-applying that build's
receipt. A display write on a checked program waits on Sam's go (his sheet 42
card 2 practice); the dispatch is that go carried out, so the workflow never
runs this on a push.

Usage, from the repo root:
  python3 kb/_program_requirements_display_apply.py --dry-run
      name the build and receipt, parse every statement, write nothing
  python3 kb/_program_requirements_display_apply.py --apply [--run N]
      apply it with SUPABASE_SERVICE_KEY and file the applied record

Guard: tests/program_requirements_display_apply_test.py.
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RECEIPTS = os.path.join(HERE, "receipts")
PAGE = os.path.join(ROOT, "cpl_pathways_roep_data.js")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
TABLE = "program_requirement_records"
BUILD = re.compile(r'"build":\s*"([0-9a-f]{12})"')
HEAD = "insert into public.program_requirement_records "
JSON_AT = "r.checks, '"
KEY = re.compile(r"^::jsonb from public\.program_requirement_records r where r\.college = '((?:[^']|'')*)' "
                 r"and r\.control_number = '((?:[^']|'')*)' on conflict \(college, control_number\) "
                 r"do update set display = excluded\.display;\s*$")


def page_build(src: str | None = None) -> str:
    """The one build the page carries; refuses a page that mixes builds."""
    if src is None:
        with open(PAGE, encoding="utf-8") as fh:
            src = fh.read()
    builds = set(BUILD.findall(src))
    if len(builds) != 1:
        raise SystemExit("the page carries %d builds (%s); rebuild it before applying"
                         % (len(builds), ", ".join(sorted(builds)) or "none"))
    return builds.pop()


def receipt_for(build: str, folder: str = RECEIPTS) -> str:
    """The full receipt of a build. A delta receipt (its name ends _delta)
    writes only the rows that moved, so it never stands for the build."""
    hits = [p for p in glob.glob(os.path.join(folder, "program_requirement_records_display_*_%s.sql" % build))
            if not os.path.basename(p).endswith("_delta.sql")]
    if len(hits) != 1:
        raise SystemExit("%d full receipts name build %s in %s" % (len(hits), build, folder))
    return hits[0]


def _literal(line: str, start: int) -> tuple[str, int]:
    """The SQL string literal opening at line[start] (a quote), unescaped, and
    the index just past its closing quote. A doubled quote is a quote."""
    out, i = [], start + 1
    while i < len(line):
        ch = line[i]
        if ch == "'":
            if i + 1 < len(line) and line[i + 1] == "'":
                out.append("'")
                i += 2
                continue
            return "".join(out), i + 1
        out.append(ch)
        i += 1
    raise ValueError("an unterminated string literal")


def parse(text: str) -> list[dict]:
    """Every statement of a display receipt as {college, control_number,
    display}. A line that is neither a comment nor a statement of the receipt's
    one shape stops the parse: what applies is exactly what was reviewed."""
    rows = []
    for n, line in enumerate(text.splitlines(), 1):
        if not line.strip() or line.startswith("--"):
            continue
        if not line.startswith(HEAD):
            raise ValueError("line %d is not a display statement" % n)
        at = line.find(JSON_AT)
        if at < 0:
            raise ValueError("line %d carries no display literal" % n)
        raw, end = _literal(line, at + len(JSON_AT) - 1)
        m = KEY.match(line[end:])
        if not m:
            raise ValueError("line %d does not end on one program's key" % n)
        rows.append({"college": m.group(1).replace("''", "'"),
                     "control_number": m.group(2).replace("''", "'"),
                     "display": json.loads(raw)})
    return rows


def _request(method: str, path_qs: str, key: str, body: dict | None = None) -> list:
    req = urllib.request.Request(
        SUPABASE_URL + "/rest/v1/" + path_qs,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json",
                 "Prefer": "return=representation"},
        method=method)
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode() or "[]")


def _where(college: str, control_number: str) -> str:
    return "college=eq.%s&control_number=eq.%s" % (urllib.parse.quote(college, safe=""),
                                                   urllib.parse.quote(control_number, safe=""))


def apply(rows: list[dict], build: str, receipt: str, run: str | None, request=None) -> dict:
    """Read each row's build, then write its display. Returns the applied
    record; `request(method, path_qs, body)` is injectable for the test."""
    request = request or (lambda m, p, b=None: _request(m, p, os.environ["SUPABASE_SERVICE_KEY"], b))
    before, written, missing, errors = {}, [], [], []
    for r in rows:
        where = _where(r["college"], r["control_number"])
        k = "%s|%s" % (r["college"], r["control_number"])
        try:
            got = request("GET", "%s?select=build:display->>build&%s" % (TABLE, where))
            if len(got) != 1:
                missing.append(k)
                continue
            before[k] = got[0].get("build")
            back = request("PATCH", "%s?select=control_number&%s" % (TABLE, where), {"display": r["display"]})
            if len(back) == 1:
                written.append(k)
            else:
                errors.append({"key": k, "error": "the write matched %d rows" % len(back)})
        except Exception as exc:          # the record still files what was written before it
            errors.append({"key": k, "error": str(exc).splitlines()[0][:300]})
            break
    with open(receipt, "rb") as fh:
        md5 = hashlib.md5(fh.read()).hexdigest()
    held = sorted({b for b in before.values() if b})
    return {
        "build": build, "receipt": os.path.relpath(receipt, ROOT), "receipt_md5": md5, "run": run,
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "statements": len(rows), "written": len(written), "missing": missing, "errors": errors,
        "before": before,
        "rollback": {
            "to_null": [k for k, b in before.items() if b is None and k in written],
            "reapply": {b: [k for k, v in before.items() if v == b and k in written] for b in held},
            "how": "set display to null for to_null; for each build in reapply, re-apply that build's "
                   "full receipt (kb/receipts/program_requirement_records_display_*_<build>.sql) to those keys.",
        },
    }


def applied_path(receipt: str, run: str | None) -> str:
    return receipt[:-len(".sql")] + ".applied_%s.json" % (run or "local")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="parse the receipt; write nothing")
    mode.add_argument("--apply", action="store_true", help="write it with SUPABASE_SERVICE_KEY")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID"))
    args = ap.parse_args(argv)
    build = page_build()
    receipt = receipt_for(build)
    with open(receipt, encoding="utf-8") as fh:
        rows = parse(fh.read())
    stale = [r["control_number"] for r in rows if (r["display"] or {}).get("build") != build]
    if stale:
        print("REFUSING: %d statements carry another build than %s (first: %s)" % (len(stale), build, stale[0]))
        return 1
    print("build %s: %s, %d statements" % (build, os.path.relpath(receipt, ROOT), len(rows)))
    if args.dry_run:
        return 0
    if not os.environ.get("SUPABASE_SERVICE_KEY"):
        print("SUPABASE_SERVICE_KEY is not set; the display write takes the service role.")
        return 2
    rec = apply(rows, build, receipt, args.run)
    with open(applied_path(receipt, args.run), "w") as fh:
        json.dump(rec, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print("written %d of %d; missing %d; errors %d" % (rec["written"], len(rows), len(rec["missing"]),
                                                       len(rec["errors"])))
    return 1 if rec["errors"] or rec["missing"] else 0


if __name__ == "__main__":
    sys.exit(main())
