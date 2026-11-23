#!/usr/bin/env python3
"""kb/_subject_sources.py, the Subjects tab's colleges by source (S717). Guards:
  (1) every college in the colleges file is one row, with its codes counted from the state list's pairs, a mis-decoded
      name joined back to its college;
  (2) a college whose catalog the titles file reads is Read on the catalog way, and its other ways with no attempt are
      Not needed; a department list that titled a row is Read;
  (3) the catalog system way is No system unless the platform is curriQunet or eLumen;
  (4) the register's newest entry is a way's status, its history counted; a probe under way is the Next step;
  (5) Next for a read college names what is left of its untitled codes;
  (6) the committed file is what a build writes (--check). Pure stdlib.
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("ss", os.path.join(ROOT, "kb", "_subject_sources.py"))
ss = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ss)

fails = []
def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else f"  {detail}"))
    if not ok:
        fails.append(name)

colleges = {"colleges": [
    {"slug": "alpha", "name": "Alpha College", "platform": "courseleaf", "kind": "college"},
    {"slug": "canada", "name": "Cañada College", "platform": "curriqunet", "kind": "college"},
    {"slug": "gamma", "name": "Gamma College", "platform": "elumen", "kind": "college"},
    {"slug": "delta", "name": "Delta College", "platform": "pdf", "kind": "college"}]}
sw = {"codes": [{"code": "MATH", "colleges": [["Alpha College", 3], ["CaÃ±ada College", 2], ["Gamma College", 1]]},
                {"code": "ENGL", "colleges": [["Alpha College", 4], ["Delta College", 1]]}]}
titles = {"columns": ["code", "printed_name", "title_state", "title_source"], "colleges": [
    {"slug": "alpha", "college": "Alpha College", "named": 1, "codes": 2, "not_read": 0, "blocked": 0, "not_in_catalog": 1,
     "read_at": "2026-11-20T10:00:00Z", "catalog_year": "2026-2027",
     "rows": [["MATH", "Mathematics", "catalog", "the college's department list"], ["ENGL", None, "not_in_catalog", None]]}]}
attempts = {"colleges": {"gamma": {"system": [
    {"status": "blocked", "date": "2026-11-01", "note": "old"},
    {"status": "probing", "date": "2026-11-23", "note": "the courses view"}]}}}
doc = ss.build(colleges, sw, titles, attempts)
by = {r["slug"]: r for r in doc["colleges"]}
check("(1) every college is one row", sorted(by) == ["alpha", "canada", "delta", "gamma"], sorted(by))
check("(1) codes are the state list's pairs, a mis-decoded name joined back", by["alpha"]["codes"] == 2 and by["canada"]["codes"] == 1 and by["delta"]["codes"] == 1,
      {k: v["codes"] for k, v in by.items()})
a = by["alpha"]["ways"]
check("(2) a read catalog is Read, the department list that titled a row is Read, the rest Not needed",
      a["catalog"]["status"] == "read" and a["department"]["status"] == "read" and a["schedule"]["status"] == "not_needed", a)
check("(3) the catalog system way is No system unless curriQunet or eLumen",
      a["system"]["status"] == "no_system" and by["delta"]["ways"]["system"]["status"] == "no_system"
      and by["canada"]["ways"]["system"]["status"] == "to_try", [by[k]["ways"]["system"]["status"] for k in ("alpha", "delta", "canada")])
g = by["gamma"]["ways"]["system"]
check("(4) the register's newest entry is the status, its history counted", g["status"] == "probing" and g["attempts"] == 2 and g["date"] == "2026-11-23", g)
check("(4) a probe under way is the Next step, ahead of an untried catalog", "probe sent 2026-11-23" in by["gamma"]["next"], by["gamma"]["next"])
check("(4) an untried PDF catalog names its course section", by["delta"]["next"] == "Read the course section of the catalog PDF", by["delta"]["next"])
check("(5) Next for a read college names what is left", by["alpha"]["next"] == "1 code not in the catalog: a person's title", by["alpha"]["next"])
check("(5) the totals count each way's statuses", doc["totals"]["titled"] == 1 and doc["totals"]["titles_needed"] == 3
      and doc["totals"]["by_way"]["system"]["probing"] == 1, doc["totals"])
check("(6) the committed file is what a build writes", ss.main(["--check"]) == 0)
print(f"\n{len(fails)} FAILED" if fails else "\nall checks passed")
sys.exit(1 if fails else 0)
