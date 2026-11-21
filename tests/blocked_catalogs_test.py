#!/usr/bin/env python3
"""The blocked-catalog hunt is one to-do in two places (S678, COBIx's item 8 on #3464), and it hunts only the courses
still taught (Sam's work order, 2026-11-20, relayed by COBIx on #3584).

Sam, 2026-11-17: "Make sure those blocked catalogs and cors are on my cdc to do"; "To do should be on both cdc and
commons". Guards: the counts match the hunt list (6 colleges, 345 local courses, 12 still taught); the College Data
Collection block and the Commons' Waiting on a person item come from the one source; filing one college's outlines
clears it in both; filing all six takes the item off both; the committed data file carries the block; and a course
a person answered leaves the to-do and stays listed as answered (S693). The rule checks run on a copy of the hunt file
with no course answered, so they hold whatever a person has answered since.

Run from repo root: python3 tests/blocked_catalogs_test.py
"""
import atexit
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


_ROOTS = []
atexit.register(lambda: [shutil.rmtree(p, ignore_errors=True) for p in _ROOTS])


def root_with(mutate=None, filed=()):
    """A throwaway root holding the hunt file with no course answered (the rule under test must not move when a
    person answers a real course), changed by `mutate`, and an outlines file for each slug in `filed`."""
    t = tempfile.mkdtemp()
    _ROOTS.append(t)
    os.makedirs(os.path.join(t, "kb", "reference"))
    cfg = json.load(open(os.path.join(ROOT, B.CONFIG)))
    for c in cfg["courses"]:
        c.pop("answered", None)
    if mutate:
        mutate(cfg)
    json.dump(cfg, open(os.path.join(t, B.CONFIG), "w"))
    shutil.copy(os.path.join(ROOT, "kb", "_blocked_catalogs.py"), os.path.join(t, "kb", "_blocked_catalogs.py"))
    os.makedirs(os.path.join(t, B.FILED))
    for slug in filed:
        open(os.path.join(t, B.FILED, slug + ".json"), "w").write("{}")
    return t


OPEN = root_with()
s0 = B.status(OPEN)
check("⭐ only a college with a still-taught course is hunted: 4 on the to-do, 2 set aside, 12 courses open",
      s0["hunted"] == 4 and s0["set_aside"] == 2 and s0["open"] == 4 and s0["still_taught_open"] == 12 and s0["still_taught_answered"] == 0
      and sorted(r["slug"] for r in s0["colleges"] if not r["hunted"]) == ["el_camino", "fullerton"]
      and sum(len(r["still_taught"]) for r in s0["colleges"]) == 12)
import csv  # noqa: E402
with open(os.path.join(ROOT, "kb", "reference", "cb_course_basic_fall2025.csv"), newline="", encoding="utf-8-sig", errors="replace") as f:
    FALL = {(r.get("CB_CONTROL_NUMBER") or "").strip() for r in csv.DictReader(f)}
check("still taught means reported in the Fall 2025 term file: all 12 control numbers are in it",
      all(c["control_number"] in FALL for c in s["courses"]), [c["course"] for c in s["courses"] if c["control_number"] not in FALL])
# The page tests read tests/fixtures/commons_hunt_open.json in place of the live block. It must be what the builder
# gives for the hunt file with no course answered (catalog links aside: a throwaway root holds no capture), or the
# page tests would pass on a shape the builder no longer writes (the second read of pull request 3613).
FIX = json.load(open(os.path.join(ROOT, "tests", "fixtures", "commons_hunt_open.json")))


def _shape(block):
    b = {k: v for k, v in block.items() if k not in ("_what",)}
    b["colleges"] = [{k: v for k, v in c.items() if k != "catalog_url"} for c in b["colleges"]]
    return b


check("⭐ the page tests' fixture is the builder's own output for the hunt file with no course answered",
      _shape(FIX) == _shape(s0), [k for k in set(_shape(FIX)) | set(_shape(s0)) if _shape(FIX).get(k) != _shape(s0).get(k)])
check("the Commons item counts the hunted colleges and their courses, in plain words",
      B.queue_issue(OPEN)["n"] == 4 and "12 still-taught courses" in B.queue_issue(OPEN)["words"])
check("each college carries its committed catalog link", all(r["catalog_url"] for r in s["colleges"]), [r["slug"] for r in s["colleges"] if not r["catalog_url"]])
check("the Commons item is a person's (no_procedure), opens the College Data Collection page, and names where to file",
      B.queue_issue(OPEN)["carry"] == "no_procedure" and B.queue_issue(OPEN)["open"] == "#commons/data" and "hand_filed_catalogs/outlines" in B.queue_issue(OPEN)["owner"])
check("the Commons builder puts the same item on the Program Requirements row", CS.blocked_hunt_issues(OPEN) == [B.queue_issue(OPEN)] and CS.blocked_hunt_issues(ROOT) == ([B.queue_issue(ROOT)] if B.queue_issue(ROOT) else []))

# S693: a course a person answered leaves the to-do (Sam, 2026-11-20, worked all 12: eight catalog descriptions pasted,
# four noted as not in the catalog). Asking again for what a person gave is the failure.
ANS = {"by": "A Person", "on": "2026-11-20", "how": "paste", "what": "Catalog description and units or hours filed"}


def answer(codes):
    def m(cfg):
        for c in cfg["courses"]:
            if c["course"] in codes:
                c["answered"] = dict(ANS)
    return m


part = B.status(root_with(answer({"HLTH 167", "OT 110"})))
noce = [r for r in part["colleges"] if r["slug"] == "north_orange_continuing_education"][0]
gro = [r for r in part["colleges"] if r["slug"] == "grossmont"][0]
check("⭐ an answered course leaves its college's to-do and is listed as answered, with who and when",
      [x["course"] for x in noce["still_taught"]] == ["PARN 170"] and [x["course"] for x in noce["answered"]] == ["HLTH 167"]
      and noce["answered"][0]["by"] == "A Person" and noce["answered"][0]["on"] == "2026-11-20" and noce["answered"][0]["what"] == ANS["what"] and noce["hunted"],
      noce)
check("⭐ a college whose courses are all answered is off the to-do and counted done, never set aside",
      gro["hunted"] is False and gro["still_taught"] == [] and len(gro["answered"]) == 1 and part["open"] == 3 and part["done"] == 1 and part["set_aside"] == 2
      and part["still_taught_open"] == 10 and part["still_taught_answered"] == 2 and part["still_taught_total"] == 12,
      {k: part[k] for k in ("open", "done", "set_aside", "still_taught_open", "still_taught_answered")})
check("the Commons item counts only what still waits", B.queue_issue(root_with(answer({"HLTH 167", "OT 110"})))["n"] == 3
      and "10 still-taught courses" in B.queue_issue(root_with(answer({"HLTH 167", "OT 110"})))["words"])
ALL = root_with(answer({c["course"] for c in s["courses"]}))
check("⭐ every course answered: nothing is open, the item leaves the Commons list, and all 12 stay listed as answered",
      B.status(ALL)["open"] == 0 and B.queue_issue(ALL) is None and CS.blocked_hunt_issues(ALL) == [] and B.status(ALL)["still_taught_answered"] == 12
      and B.status(ALL)["done"] == 4 and B.status(ALL)["set_aside"] == 2)
check("an answer with no words is no answer", B.status(root_with(lambda cfg: cfg["courses"][0].update(answered={"by": "A Person"})))["still_taught_open"] == 12)
# The committed hunt file: every answer names who, when and what, and the file it points to holds the course.
FILED_BY = {}
for c in s["courses"]:
    a = c.get("answered")
    if a:
        path = os.path.join(ROOT, a.get("filed") or "")
        if path not in FILED_BY:
            d = json.load(open(path)) if os.path.isfile(path) else {}
            FILED_BY[path] = {x.get("control_number") for x in (d.get("entries") or []) + (d.get("notes") or [])}
check("each committed answer names who, when and what, and the file it cites holds the course",
      all(a.get("by") and a.get("on") and a.get("what") and c["control_number"] in FILED_BY.get(os.path.join(ROOT, a.get("filed") or ""), set())
          for c in s["courses"] for a in [c.get("answered")] if a),
      [c["course"] for c in s["courses"] if c.get("answered") and c["control_number"] not in FILED_BY.get(os.path.join(ROOT, c["answered"].get("filed") or ""), set())])

if True:
    t = root_with(filed=("grossmont",))
    one = B.status(t)
    check("⭐ filing one college clears it in both places: 3 left on the page and on the Commons item, 11 courses",
          one["open"] == 3 and [r["slug"] for r in one["colleges"] if r["filed"]] == ["grossmont"] and B.queue_issue(t)["n"] == 3
          and CS.blocked_hunt_issues(t)[0]["n"] == 3 and one["local_courses_open"] == 273 and one["still_taught_open"] == 11)
    for slug in [r["slug"] for r in one["colleges"]]:
        open(os.path.join(t, B.FILED, slug + ".json"), "w").write("{}")
    check("⭐ every college filed: the item leaves the Commons list and the page block has nothing open", B.status(t)["open"] == 0 and B.queue_issue(t) is None and CS.blocked_hunt_issues(t) == [])

if True:
    t = root_with(lambda cfg: cfg.update(courses=None))
    bare = B.status(t)
    check("a hunt file with no course list hunts every college, as S678 built it",
          bare["open"] == 6 and bare["hunted"] == 6 and bare["still_taught_open"] is None and all(r["still_taught"] is None for r in bare["colleges"])
          and "345 local courses, 12 still taught" in B.queue_issue(t)["words"])

d = json.load(open(os.path.join(ROOT, "kb", "status", "commons_data.json")))
check("the committed College Data Collection file carries the block from the same source", d.get("blocked_hunt") == B.status(ROOT))

print("\n%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
