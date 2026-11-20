#!/usr/bin/env python3
"""The blocked-catalog hunt is one to-do in two places (S678, COBIx's item 8 on #3464), and it hunts only the courses
still taught (Sam's work order, 2026-11-20, relayed by COBIx on #3584).

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
check("⭐ the 12 still-taught courses are filed with the hunt, each under one of its colleges, each with a control number",
      isinstance(s["courses"], list) and len(s["courses"]) == 12 and s["still_taught_total"] == 12
      and {c["slug"] for c in s["courses"]} <= {r["slug"] for r in s["colleges"]}
      and all(str(c.get("control_number") or "").startswith("CCC") and c.get("course") and c.get("title") for c in s["courses"])
      and len({c["control_number"] for c in s["courses"]}) == 12)
check("⭐ only a college with a still-taught course is hunted: 4 on the to-do, 2 set aside, 12 courses open",
      s["hunted"] == 4 and s["set_aside"] == 2 and s["open"] == 4 and s["still_taught_open"] == 12
      and sorted(r["slug"] for r in s["colleges"] if not r["hunted"]) == ["el_camino", "fullerton"]
      and sum(len(r["still_taught"]) for r in s["colleges"]) == 12)
import csv  # noqa: E402
with open(os.path.join(ROOT, "kb", "reference", "cb_course_basic_fall2025.csv"), newline="", encoding="utf-8-sig", errors="replace") as f:
    FALL = {(r.get("CB_CONTROL_NUMBER") or "").strip() for r in csv.DictReader(f)}
check("still taught means reported in the Fall 2025 term file: all 12 control numbers are in it",
      all(c["control_number"] in FALL for c in s["courses"]), [c["course"] for c in s["courses"] if c["control_number"] not in FALL])
check("the Commons item counts the hunted colleges and their courses, in plain words",
      B.queue_issue(ROOT)["n"] == 4 and "12 still-taught courses" in B.queue_issue(ROOT)["words"])
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
    check("⭐ filing one college clears it in both places: 3 left on the page and on the Commons item, 11 courses",
          one["open"] == 3 and [r["slug"] for r in one["colleges"] if r["filed"]] == ["grossmont"] and B.queue_issue(t)["n"] == 3
          and CS.blocked_hunt_issues(t)[0]["n"] == 3 and one["local_courses_open"] == 273 and one["still_taught_open"] == 11)
    for slug in [r["slug"] for r in one["colleges"]]:
        open(os.path.join(t, B.FILED, slug + ".json"), "w").write("{}")
    check("⭐ every college filed: the item leaves the Commons list and the page block has nothing open", B.status(t)["open"] == 0 and B.queue_issue(t) is None and CS.blocked_hunt_issues(t) == [])

with tempfile.TemporaryDirectory() as t:
    os.makedirs(os.path.join(t, "kb", "reference"))
    cfg = json.load(open(os.path.join(ROOT, B.CONFIG)))
    cfg["courses"] = None
    json.dump(cfg, open(os.path.join(t, B.CONFIG), "w"))
    bare = B.status(t)
    check("a hunt file with no course list hunts every college, as S678 built it",
          bare["open"] == 6 and bare["hunted"] == 6 and bare["still_taught_open"] is None and all(r["still_taught"] is None for r in bare["colleges"])
          and "345 local courses, 12 still taught" in B.queue_issue(t)["words"])

d = json.load(open(os.path.join(ROOT, "kb", "status", "commons_data.json")))
check("the committed College Data Collection file carries the block from the same source", d.get("blocked_hunt") == B.status(ROOT))

print("\n%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
