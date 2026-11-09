#!/usr/bin/env python3
"""_docket_rulings.py — read the Docket's rulings and say what each one runs (#2963 step 2).

A reviewer rules on a case in the Commons; the page saves the ruling to kb_curation as course_id
`_DOCKET::<case id>`, field `docket_ruling`, value JSON {case, choice, note}. This reads those rows against
kb/docket/cases.json and prints, for every open case that carries a ruling, the choice, who made it and when, and
the plan that choice names (the commands, each with its --expect count, or the words a session acts on).

It writes nothing. Carrying a ruling out is a session's step today and the processor's in step 3; either one sets
the case's `status` to `done` with `done` {choice, by, at, receipt} in the same commit as the receipt.

Where the rows come from:
  --rows FILE      a JSON list of kb_curation rows (course_id, value, reviewer_email, reviewed_at), as the Supabase
                   MCP returns them for the --sql query; how a session reads them, since the sandbox cannot reach
                   *.supabase.co (CLAUDE.md Rule 10 c)
  (no --rows)      the REST API with SUPABASE_URL and SUPABASE_SERVICE_KEY, as a workflow reads them

  python3 kb/_docket_rulings.py --sql                 the read query, to run through the Supabase MCP
  python3 kb/_docket_rulings.py --rows rows.json      what each ruling runs
  python3 kb/_docket_rulings.py --rows rows.json --json
"""
import argparse
import json
import os
import sys
import urllib.request

CASES = "kb/docket/cases.json"
PREFIX = "_DOCKET::"
FIELD = "docket_ruling"
SQL = ("select course_id, value, reviewer_email, reviewed_at from public.kb_curation "
       "where field = '%s' and course_id like '%s%%' order by reviewed_at;" % (FIELD, PREFIX.replace("_", "\\_")))


def load_cases(root):
    with open(os.path.join(root, CASES), encoding="utf-8") as f:
        return json.load(f).get("cases") or []


def fetch_rows():
    url = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        raise SystemExit("no --rows file and no SUPABASE_SERVICE_KEY: run --sql through the Supabase MCP and pass --rows")
    q = ("/rest/v1/kb_curation?select=course_id,value,reviewer_email,reviewed_at&field=eq.%s&course_id=like.%s*"
         "&order=reviewed_at.asc" % (FIELD, PREFIX))
    req = urllib.request.Request(url + q, headers={"apikey": key, "Authorization": "Bearer " + key,
                                                   "Range-Unit": "items", "Range": "0-999"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def parse(value):
    if isinstance(value, dict):
        return value
    try:
        v = json.loads(value or "")
    except ValueError:
        return None
    return v if isinstance(v, dict) else None


def read(cases, rows):
    """Each ruling against its case: `act` (an open case with a known choice), `done` (already carried out),
    and `refused` (no such case, or a choice the case does not offer), each with its reason."""
    by_id = {c.get("id"): c for c in cases}
    out = {"act": [], "done": [], "refused": [], "open_unruled": []}
    ruled = set()
    for row in rows or []:
        cid = str(row.get("course_id") or "")
        if not cid.startswith(PREFIX):
            continue
        case_id = cid[len(PREFIX):]
        v = parse(row.get("value"))
        item = {"case": case_id, "by": row.get("reviewer_email"), "at": row.get("reviewed_at"),
                "choice": v and v.get("choice"), "note": (v or {}).get("note") or ""}
        c = by_id.get(case_id)
        if c is None:
            out["refused"].append(dict(item, why="no case with this id in " + CASES))
            continue
        ruled.add(case_id)
        values = [ch.get("value") for ch in c.get("choices") or []]
        if item["choice"] not in values:
            out["refused"].append(dict(item, why="the case offers %s" % ", ".join(values)))
            continue
        if c.get("status") in ("done", "partial"):
            # partial: some commands ran and one failed; a session finishes it from the receipt, never a re-run
            out["done"].append(dict(item, status=c.get("status"), done=c.get("done")))
            continue
        plan = (c.get("plans") or {}).get(item["choice"]) or []
        words = (c.get("plan_words") or {}).get(item["choice"]) or ""
        out["act"].append(dict(item, decides=c.get("decides"), dr=c.get("dr"), plan=plan, plan_words=words))
    for c in cases:
        if c.get("status") not in ("done", "partial") and c.get("id") not in ruled:
            out["open_unruled"].append({"case": c.get("id"), "decides": c.get("decides"), "sheet": c.get("sheet")})
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=".")
    ap.add_argument("--rows", help="a JSON file of kb_curation rows (see --sql)")
    ap.add_argument("--sql", action="store_true", help="print the read query and stop")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    if a.sql:
        print(SQL)
        return 0
    cases = load_cases(a.root)
    if a.rows:
        with open(a.rows, encoding="utf-8") as f:
            rows = json.load(f)
    else:
        rows = fetch_rows()
    out = read(cases, rows)
    if a.json:
        json.dump(out, sys.stdout, indent=1, ensure_ascii=False)
        print()
        return 0
    for it in out["act"]:
        print("RULED  %s: %s (%s, %s)" % (it["case"], it["choice"], it["by"] or "a reviewer", str(it["at"])[:16]))
        if it["note"]:
            print("  note: %s" % it["note"])
        for cmd in it["plan"]:
            print("  run:  %s" % cmd)
        if it["plan_words"]:
            print("  then: %s" % it["plan_words"])
    for it in out["refused"]:
        print("REFUSED %s: %s (%s)" % (it["case"], it["choice"], it["why"]))
    for it in out["open_unruled"]:
        print("OPEN   %s: no ruling yet" % it["case"])
    if not any(out[k] for k in ("act", "refused", "open_unruled")):
        print("no open case")
    return 0


if __name__ == "__main__":
    sys.exit(main())
