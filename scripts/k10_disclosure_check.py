#!/usr/bin/env python3
"""The k=10 disclosure check on the two public student rollups (COBIx item 7, S602).

map_credential_student_rollup and map_credential_volume are materialized views the anon
key reads (the public college briefing reads the rollup). RLS does not apply to a
materialized view, so the k=10 rule lives inside the view
(adr-student-detail-aggregate-disclosure-control; kb/supabase_credential_volume.sql).
That file states its standing assertions as comments, and nothing ran them. This runs
them, as anon sees the views, and exits 1 when any fails:

  1. no visible student count between 1 and 9, in either view;
  2. no published measure on a suppressed row (students, potential units, rows);
  3. no suppressed cell recoverable by subtraction: a credential whose statewide total
     is published may not have exactly one suppressed college cell.

Read-only, stdlib only. The URL and the public anon key come from cpl_funding.js, as
scripts/funding_sierra_note.js reads them, so there is no second copy of the key.

  python3 scripts/k10_disclosure_check.py           # live, as anon
  python3 scripts/k10_disclosure_check.py --json    # the counts as JSON
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = 10
PAGE = 1000


def endpoint():
    src = open(os.path.join(ROOT, "cpl_funding.js"), encoding="utf-8").read()
    url = re.search(r'var SUPABASE_URL = "([^"]+)"', src).group(1)
    anon = re.search(r'var SUPABASE_ANON = "([^"]+)"', src).group(1)
    return url, anon


def fetch_all(url, anon, view, select):
    """Every row of a view, paged with Range headers (PostgREST caps a response)."""
    rows, start = [], 0
    while True:
        req = urllib.request.Request(
            "%s/rest/v1/%s?select=%s" % (url, view, select),
            headers={"apikey": anon, "Authorization": "Bearer " + anon,
                     "Range-Unit": "items", "Range": "%d-%d" % (start, start + PAGE - 1),
                     "User-Agent": "cpl-k10-disclosure-check"})
        with urllib.request.urlopen(req, timeout=60) as r:
            page = json.loads(r.read().decode("utf-8"))
        rows.extend(page)
        if len(page) < PAGE:
            return rows
        start += PAGE


def evaluate(rollup, volume, k=K):
    """The counts of each failure; every one must be 0."""
    def small(v):
        return v is not None and 0 < v < k
    out = {
        "rollup_rows": len(rollup),
        "volume_rows": len(volume),
        "rollup_visible_under_k": sum(1 for r in rollup if small(r.get("students"))),
        "volume_visible_under_k": sum(1 for r in volume if small(r.get("students"))),
        "rollup_measure_on_suppressed": sum(
            1 for r in rollup if r.get("students_suppressed") and any(
                r.get(f) is not None for f in ("students", "potential_units", "rows_total"))),
    }
    suppressed = {}
    for r in rollup:
        if r.get("students_suppressed"):
            suppressed[r.get("unified_title")] = suppressed.get(r.get("unified_title"), 0) + 1
    out["recoverable_by_subtraction"] = sum(
        1 for v in volume
        if v.get("potential_units") is not None and suppressed.get(v.get("unified_title")) == 1)
    out["failures"] = [k_ for k_ in ("rollup_visible_under_k", "volume_visible_under_k",
                                     "rollup_measure_on_suppressed", "recoverable_by_subtraction")
                       if out[k_]]
    return out


def main(argv):
    url, anon = endpoint()
    rollup = fetch_all(url, anon, "map_credential_student_rollup",
                       "unified_title,college_id,students,students_suppressed,potential_units,rows_total")
    volume = fetch_all(url, anon, "map_credential_volume", "unified_title,students,potential_units")
    out = evaluate(rollup, volume)
    if "--json" in argv:
        print(json.dumps(out, indent=1))
    else:
        for k_, v in out.items():
            if k_ != "failures":
                print("%-30s %s" % (k_, v))
    if not out["rollup_rows"] or not out["volume_rows"]:
        print("FAIL: a view returned no rows to anon; the check read nothing.")
        return 1
    if out["failures"]:
        print("FAIL: k=%d disclosure broken: %s. Refresh order and suppression: "
              "kb/supabase_credential_volume.sql." % (K, ", ".join(out["failures"])))
        return 1
    print("ok: k=%d holds on both views as anon reads them." % K)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
