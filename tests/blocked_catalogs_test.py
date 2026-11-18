#!/usr/bin/env python3
"""The blocked-catalog hunt is one to-do in two places (S678, COBIx's item 8 on #3464).

Sam, 2026-11-17: "Make sure those blocked catalogs and cors are on my cdc to do"; "To do should be on both cdc and
commons". Guards: the counts match the hunt list (6 colleges, 345 local courses, 12 still taught); the College Data
Collection block and the Commons' Waiting on a person item come from the one source; filing one college's outlines
clears it in both; filing all six takes the item off both; the committed data file carries the block.

Run from repo root: python3 tests/blocked_catalogs_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _blocked_catalogs as B  # noqa: E402
import _build_commons_status as CS  # noqa: E402

results = []


def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


s = B.status(ROOT)
check("the hunt list's counts: 6 colleges, 345 local courses, 12 still taught", s and len(s["colleges"]) == 6 and s["local_courses"] == 345 and s["still_taught_total"] == 12, s and (len(s["colleges"]), s["local_courses"]))
check("each college carries its committed catalog link", all(r["catalog_url"] for r in s["colleges"]), [r["slug"] for r in s["colleges"] if not r["catalog_url"]])
check("the Commons item is a person's (no_procedure), opens the College Data Collection page, and names where to file",
      B.queue_issue(ROOT)["carry"] == "no_procedure" and B.queue_issue(ROOT)["open"] == "#commons/data" and "hand_filed_catalogs/outlines" in B.queue_issue(ROOT)["owner"])
check("the Commons builder puts the same item on the Program Requirements row", CS.blocked_hunt_issues(ROOT) == [B.queue_issue(ROOT)])

with tempfile.TemporaryDirectory() as t:
    os.makedirs(os.path.join(t, "kb", "reference"))
    shutil.copy(os.path.join(ROOT, B.CONFIG), os.path.join(t, B.CONFIG))
    shutil.copy(os.path.join(ROOT, "kb", "_blocked_catalogs.py"), os.path.join(t, "kb", "_blocked_catalogs.py"))
    os.makedirs(os.path.join(t, B.FILED))
    with open(os.path.join(t, B.FILED, "grossmont.json"), "w") as f:
        json.dump({"college": "Grossmont College", "url": "https://example.org/outlines.pdf", "fetched_by": "a test"}, f)
    one = B.status(t)
    check("⭐ filing one college clears it in both places: 5 left on the page and on the Commons item",
          one["open"] == 5 and [r["slug"] for r in one["colleges"] if r["filed"]] == ["grossmont"] and B.queue_issue(t)["n"] == 5
          and CS.blocked_hunt_issues(t)[0]["n"] == 5 and one["local_courses_open"] == 303)
    for slug in [r["slug"] for r in one["colleges"]]:
        open(os.path.join(t, B.FILED, slug + ".json"), "w").write("{}")
    check("⭐ all six filed: the item leaves the Commons list and the page block has nothing open", B.status(t)["open"] == 0 and B.queue_issue(t) is None and CS.blocked_hunt_issues(t) == [])

d = json.load(open(os.path.join(ROOT, "kb", "status", "commons_data.json")))
check("the committed College Data Collection file carries the block from the same source", d.get("blocked_hunt") == B.status(ROOT))

print("\n%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
