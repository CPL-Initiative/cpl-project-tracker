#!/usr/bin/env python3
"""S741, lane 2's cheap piles at El Camino: the four records s740e held, two collected under total_differs
(kb/_program_piles_s741_elcamino.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held. S740 held 31319 and 42541 because no kind's sentence was true of them on their notes. Their pages,
read free as the capture reads them (college-page-read run 45953358884,
kb/college_reads/s741_piles_el_camino_pages.json), print a total their own units do not add to, which is
total_differs: a program kb/program_total_differs.json lists with both figures, read by a session from the page. The
shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the four keys are s740e's holds; 2 collected, 2 held;
  * each row is the record rule's own answer (NG.total_differs) and its words are the rule's, naming both figures and
    the page read; the file lists each with the figures the record holds, and its evidence names the read's plan;
  * the rule asks the record to read both figures exactly: a sum or a total one unit off names no gap, and so does a
    record the file does not list (19857, whose courses add to 33 under a printed 36 that its list figures meet);
  * 31319's seven courses carry the units the evidence quotes; 42541's rows add to 27 at the least and 30 at the most;
  * the holds: 19883's reason names its own page (poid 3640); 19857's names the list figure that runs past its courses.

Run from repo root: python3 tests/program_piles_s741_elcamino_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402
import _program_piles_s741_elcamino as M  # noqa: E402

W = M.W
B, NG = B8.B, B8.NG
ROOT = T.ROOT
HELD = {"19883": ["not the program's own", "poid 3640", "a site_pages pin"],
        "19857": ["Required Core: 30 units", "add to 27", "on_live_run"]}

t = T.run(W, rows={"31319": "total_differs", "42541": "total_differs"}, held=HELD, scores={"total_differs": 50},
          day="2026-11-27", boundaries=4)
check = t.check

with open(os.path.join(ROOT, "kb", "program_total_differs.json"), encoding="utf-8") as fh:
    listed = json.load(fh)["colleges"][M.COLLEGE]
# S742 (plan s742r2) lists two more, each from its own page read: 19883 and 38948.
check({"31319", "42541"} <= set(listed) and set(listed) <= {"31319", "42541", "19883", "38948"},
      "the file lists El Camino's two programs, and since S742 the two s742r2 files (%s)" % sorted(listed))
with open(os.path.join(ROOT, "kb", "college_reads", "s741_piles_el_camino_pages.json"), encoding="utf-8") as fh:
    urls = [p["url"] for p in json.load(fh)["pages"]]
for cn in ("31319", "42541"):
    f, e, x = W.load(cn), M.REVIEWED[cn], listed[cn]
    words = f["score"]["gaps"][0]["words"]
    bare = copy.deepcopy(f)
    bare["score"].pop("gaps")
    bare["score"].pop("confidence")
    a = bare["score"]["arithmetic"]
    check(x["run"] == M.PAGE_READ and M.PAGE_READ in x["evidence"]
          and "s741_piles_el_camino_pages.json" in x["evidence"] and f["source_url"] in urls
          and f["source_url"] in x["where"],
          "%s: the file's entry names the page read, its plan and the record's own page" % cn)
    check(B.same(a["computed"], x["printed_sum"]) and B.same(a["stated"], x["printed_total"])
          and B.same(e["computed"], x["printed_sum"]) and B.same(e["stated"], x["printed_total"]),
          "%s: the record holds the two figures the file lists" % cn)
    check(NG.answer(bare) is not None and NG.answer(bare)[0] == "total_differs" and NG.total_differs(bare) == words
          and W.gap_noted(bare) == ("total_differs", words) and M.PAGE_READ in words,
          "%s: the record rule names total_differs, and the gap files the rule's own words" % cn)
    g = copy.deepcopy(bare)
    g["score"]["arithmetic"]["computed"] = [a["computed"][0] + 1, a["computed"][1] + 1]
    check(NG.total_differs(g) is None, "%s: a sum one unit off the file's figure names no gap" % cn)
    g = copy.deepcopy(bare)
    g["score"]["arithmetic"]["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1]
    check(NG.total_differs(g) is None, "%s: a total one unit off the file's figure names no gap" % cn)
    check(NG.total_differs(bare, {}) is None, "%s: a record the file does not list never takes the gap" % cn)
    check(not W.shared_with(cn), "%s: no other record was read from its page" % cn)

f = W.load("31319")
rows = {c["code"]: c["units"] for b in f["record"]["blocks"] for c in b["courses"]}
check(rows == {"MUSI 101": 3, "MUSI 180": 3, "MUSI 181A": 2, "MUSI 181B": 2, "MUSI 182": 3, "MUSI 284": 3,
               "MUSI 285": 3} and sum(rows.values()) == 19,
      "31319: its seven courses carry the units the page prints, 19 in all")
f = W.load("42541")
core = next(b for b in f["record"]["blocks"] if b["name"] == "Required Core")
check(B.same(core["stated"], [28, 30]) and len(core["courses"]) == 8
      and B.same(f["score"]["arithmetic"]["computed"], [27, 30]),
      "42541: 'Required Core' prints 28-30 over eight rows that add to 27-30")

f = W.load("19857")
check(not f["score"].get("gaps") and ("El Camino College", "19857") not in NG.total_differs_list()
      and B.same(f["score"]["arithmetic"]["computed"], [33, 33]) and B.same(f["score"]["arithmetic"]["stated"], [36, 36])
      and sum(c["units"] for c in f["record"]["blocks"][0]["courses"]) == 27
      and B.same(f["record"]["blocks"][0]["stated"], [30, 30]),
      "19857: its core prints 30 over courses that add to 27; the file does not list it, and it carries no gap")
# S742: paid read 46007782666 read 19883 from its own page (poid 3640) through its pin, and plan s742r2 files its
# gap; before it the record sat on the Photography A.S. page with no gap. Read in either state.
f = W.load("19883")
check((not f["score"].get("gaps") and "poid=3639" in f["source_url"])
      or ("poid=3640" in f["source_url"] and str(f["extracted_run"]) == "46007782666"),
      "19883: read from the Photography A.S. page (poid 3639) with no gap, or since S742 from its own page")

sys.exit(t.done())
