#!/usr/bin/env python3
"""The 50 course outlines to find by hand (kb/_outline_hunt.py, S711; Sam's ask of 2026-11-23).

WHAT THIS GUARDS (each a way the list would send a person after the wrong outline):
  (1) a C-ID or CCN identity, a non-CTE M-ID, a noncredit one, a shell title and an M-ID with few districts never
      appear;
  (2) an M-ID two districts already make comparable never appears, and one district's text counts once however many
      of its colleges print it;
  (3) a pick sits in a district with no outcome text for its M-ID, at a college whose outlines the reader holds where
      one exists, and an M-ID with no text at all gets two picks in two districts;
  (4) the rank is districts reached per outline needed, most first;
  (5) the committed file holds at most 50 courses, every one an M-ID, CTE in the catalog, and a rerun writes the same
      bytes.

Run from repo root: python3 tests/outline_hunt_test.py
"""
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location("oh", os.path.join(ROOT, "kb", "_outline_hunt.py"))
oh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oh)
FAILS = []


def check(name, cond, why=""):
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or not why else "  [%s]" % why))
    if not cond:
        FAILS.append(name)


# Each college its own district, except C1 and C2, which share one.
DIST = {"C1": "D12", "C2": "D12"}
voice = lambda c: DIST.get(c, c)  # noqa: E731
jac = lambda a, b: 1.0 if a == b else 0.1  # noqa: E731


def mem(n, title="Welding"):
    return [{"college": "C%d" % i, "code": "W %d" % i, "title": title if i % 2 else "Other", "units": 3} for i in range(1, n + 1)]


cat = {mid: {"cte": True, "credit_status": "Credit", "common_title": "Welding"} for mid in
       ("WELD M1001", "WELD M1002", "WELD M1003", "WELD M1004", "WELD M1005", "WELD M1006", "INTN M1001", "BIOL M1001")}
cat["BIOL M1001"]["cte"] = False
cat["WELD M1005"]["credit_status"] = "Noncredit"
cat["INTN M1001"]["common_title"] = "Welding Internship"
cat["WELD M1006"]["c_id"] = "MANF 110"
members = {"WELD M1001": mem(12), "WELD M1002": mem(8), "WELD M1003": mem(12), "WELD M1004": mem(3),
           "WELD M1005": mem(12), "WELD M1006": mem(12), "INTN M1001": mem(12), "BIOL M1001": mem(12),
           "MANF 110": mem(30)}
compare = {"date": "2026-11-22", "mids": {
    # one district's text, from two of its colleges: still needs one more district
    "WELD M1001": {"members_with_text": [["C1", "W 1", "Welding", 3, "0956.50", 1, 4], ["C2", "W 2", "Other", 3, "0956.50", 1, 4]]},
    # two districts already: comparable, off the list
    "WELD M1003": {"members_with_text": [["C3", "W 3", "Welding", 3, "x", 1, 4], ["C4", "W 4", "Other", 3, "x", 1, 4]]},
    # C1, C3, C4 and C7 are colleges the reader holds (they print text for another M-ID); C5, C6 and C8 are not read
    "WELD M1002": {"members_with_text": [["C9", "W 9", "Welding", 3, "x", 0, 1]]},
    "OTHR M1000": {"members_with_text": [["C7", "Z 1", "Z", 3, "x", 1, 4]]}}}
doc = oh.build(members, compare, cat, voice, jac)
mids = [r["mid"] for r in doc["courses"]]

# (1)
check("(1) no C-ID or CCN identity", "MANF 110" not in mids and "WELD M1006" not in mids, mids)
check("(1) no non-CTE, noncredit or shell M-ID", not {"BIOL M1001", "WELD M1005", "INTN M1001"} & set(mids), mids)
check("(1) no M-ID with fewer districts than the floor", "WELD M1004" not in mids, mids)
# (2)
check("(2) an M-ID two districts make comparable is off the list", "WELD M1003" not in mids, mids)
w1 = [r for r in doc["courses"] if r["mid"] == "WELD M1001"]
check("(2) one district's text counts once: one more outline needed", len(w1) == 1 and w1[0]["districts_with_text"] == 1, w1)
# (3)
check("(3) the pick sits outside the district with text", w1 and voice(w1[0]["college"]) != "D12", w1)
w2 = [r for r in doc["courses"] if r["mid"] == "WELD M1002"]
check("(3) an M-ID with no enough text gets two picks in two districts",
      len(w2) == 2 and len({voice(r["college"]) for r in w2}) == 2, w2)
check("(3) colleges the reader holds come before one it has not read", w2 and all(r["college_read"] for r in w2)
      and not any(r["college"] in ("C5", "C6", "C8") for r in w2), w2)
check("(3) a member whose outline already prints some text is not picked", all(r["college"] != "C9" for r in w2), w2)
# (4)
check("(4) one outline reaching 11 districts ranks before two reaching 8", mids and mids[0] == "WELD M1001", mids)
check("(4) ranks run 1 to n", [r["rank"] for r in doc["courses"]] == list(range(1, len(doc["courses"]) + 1)))

# (5)
p = os.path.join(ROOT, oh.OUT)
committed = json.load(open(p, encoding="utf-8"))
C = committed["courses"]
catalog = oh.load_catalog(ROOT)
check("(5) the committed file holds at most 50 courses", 0 < len(C) <= oh.LIMIT, len(C))
check("(5) every listed course is an M-ID, CTE and credit in the catalog",
      all(oh.MID_RE.match(r["mid"]) and catalog.get(r["mid"], {}).get("cte") is True
          and not catalog[r["mid"]].get("c_id") and not catalog[r["mid"]].get("ccn_id") for r in C),
      [r["mid"] for r in C if not (catalog.get(r["mid"], {}).get("cte") is True)][:5])
check("(5) no shell title", not any(oh.SHELL_RE.search(r["mid_title"] or "") for r in C))
comp = oh._compare_module()
mem_live, at = comp.load_members(ROOT)
dists, _ = comp.load_districts(ROOT)
path, cmp_doc = oh.newest_compare(ROOT)
again = oh.dump(oh.build(mem_live, cmp_doc, catalog, comp.voice_of(dists), comp.title_jaccard, at, path))
check("(5) a rerun on the committed inputs writes the same bytes", again == open(p, encoding="utf-8").read())
check("(5) the file names no email", not re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}", again))

print("\n%s" % ("all passed" if not FAILS else "%d FAILED: %s" % (len(FAILS), ", ".join(FAILS))))
sys.exit(1 if FAILS else 0)
