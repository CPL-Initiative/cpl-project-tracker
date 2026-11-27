#!/usr/bin/env python3
"""S741, lane 1 (keys) at Copper Mountain: four of s740r4's six holds collected with named gaps (kb/_program_piles_s741_copper_mountain.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named and a lower score, and the gap must be true of its record. Each record's own section was printed line for line
by college page read 45953233659. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the four keys are holds of s740r4's receipt; all four are collected, none held; the other two of its holds
    (43854, 14751) are no keys (a reconcile step reads their degree's floor);
  * total_differs, 14737 and 20094: each is listed in kb/program_total_differs.json with the page's two figures (56
    and 54.6), the record reads both exactly, its seven courses carry the units the page prints, and the record rule
    names the gap; with the listing gone the rule names nothing; the two records were read from one PDF page and each
    heading names its own award and not its sister's;
  * units_within_printed_range, 45594: its lists add to 36-49 inside the printed 32-49, each list as the page prints
    it (26, 4-8, 3, 3-12), every listed course placed, its degree passing; the words are the kind's own with the
    record's note; the kind's reviewed lists name the key;
  * lists_not_closed, 14710: the restricted electives' figure depends on the work experience units (the record's
    note, the page's sentence), the lists add short of the printed 42 at the low end, and both notes are filed; a
    record whose low end meets the total does not take the shape;
  * 43854's figures are not the units kind's (read against the degree, the printed 60 inside the sum);
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s741_copper_mountain_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s741_copper_mountain as M  # noqa: E402

W = M.W
B, NG, S = B7.B, B7.NG, B7.S
ROWS = {"14737": "total_differs", "20094": "total_differs", "45594": B7.WITHIN, "14710": "lists_not_closed"}
SCORES = {"total_differs": 50, B7.WITHIN: 50, "lists_not_closed": 30}
OWN = {"14737": "own_heading", "20094": "own_heading"}

t = T.run(W, rows=ROWS, held={}, scores=SCORES, day="2026-11-27", boundaries=16, own=OWN)
check = t.check


def bare(cn):
    f = copy.deepcopy(W.load(cn))
    f["score"].pop("gaps", None)
    f["score"].pop("confidence", None)
    return f


check(isinstance(W, B7.Pile)
      and W.receipt_path("2026-11-27").endswith("piles_s740_copper_mountain_2026-11-27_s741k2.json"),
      "the plan is s741k2, on S740's shared code")
check(set(M.KEYS) | set(M.BY_THE_RECONCILE) == {"14710", "14737", "14751", "20094", "43854", "45594"}
      and not set(M.KEYS) & set(M.BY_THE_RECONCILE), "the keys are s740r4's six holds less the reconcile's two")
check(all(e.get("page") for e in M.REVIEWED.values()) and M.PAGE_READ == "45953233659",
      "each entry carries its page's words, from the page read")
# The order: the degree-floor reconcile 45957316339 re-filed the three degrees first, and its reread posted them.
check(all(str(W.load(cn)["extracted_run"]) == run for cn, run in M.RUNS.items()) and set(M.RUNS) == set(M.KEYS),
      "each row is read at its live run: the three degrees at the reconcile's, the certificate at the read's")
check(all(W.load(cn)["record"]["program"].get("degree_total_minimum") is True
          and str(W.load(cn).get("read_run")) == M.READ for cn in ("14710", "14737", "45594"))
      and "degree_total_minimum" not in W.load("20094")["record"]["program"],
      "the three degrees carry the degree's floor from the reconcile, over the read's own record; the certificate none")
p78 = M.REVIEWED["14710"]["page"]
check("Select seventeen (17) units" in p78 and "e-business 11" in p78 and "Accounting 20" in p78
      and "Additional restricted electives as needed." in p78 and "dependent on the number of work experience units" in p78,
      "14710's entry cites the elective line, the concentrations' figures and 'Additional restricted electives as needed.'")

# total_differs: the listing, the record's figures, the rule.
listed = NG.total_differs_list()
VN = [("BIOL 022", 4), ("BIOL 023", 4), ("HS 065", 3), ("PSYC 003", 3), ("VN 010", 9), ("VN 020", 16),
      ("VN 030", 15.6)]
for cn, page in (("14737", 113), ("20094", 114)):
    e = listed.get((M.COLLEGE, cn)) or {}
    check(e.get("printed_total") == [56, 56] and e.get("printed_sum") == [54.6, 54.6] and e.get("page") == page
          and e.get("run") == M.PAGE_READ and "MINIMUM" in e.get("evidence", ""),
          "%s is listed with the page's two figures, from the page read" % cn)
    f = bare(cn)
    courses = [(c["code"], c["units"]) for b in f["record"]["blocks"] for c in b["courses"]]
    check(courses == VN and abs(sum(u for _, u in VN) - 54.6) < 1e-9,
          "%s: its seven courses carry the units the page prints, 54.6 in all" % cn)
    a = f["score"]["arithmetic"]
    check(a["status"] == "unequal" and a["against"] == "program" and a["computed"] == [54.6, 54.6]
          and a["stated"] == [56.0, 56.0], "%s: the record reads both figures exactly" % cn)
    rule = NG.answer(f)
    check(rule and rule[0] == "total_differs" and "56" in rule[1] and "54.6" in rule[1] and "PDF p.%d" % page in rule[1],
          "%s: the record rule names total_differs with both figures and the page" % cn)
    check(NG.total_differs(f, {}) is None, "%s: with the listing gone the rule names nothing" % cn)
    check(W.load(cn)["score"]["gaps"][0]["words"] == rule[1], "%s: the words filed are the rule's own" % cn)
f, g = W.load("14737"), W.load("20094")
check(W.shared_with("14737") == ["20094"] and W.shared_with("20094") == ["14737"]
      and f["source_url"] == g["source_url"], "the two records were read from one PDF page, and no third")
check(B.award_kind(f["award"]) == "science" and B.award_kind(g["award"]) == "certificate"
      and B.kinds_named(f["record"]["program"]["section_heading"]) == {"science"}
      and B.kinds_named(g["record"]["program"]["section_heading"]) == {"certificate"},
      "each heading names its own award and not its sister's")
swap = copy.deepcopy(bare("14737"))
swap["record"]["program"]["section_heading"] = g["record"]["program"]["section_heading"]
check(W.own(swap, dict(M.REVIEWED["14737"], own_heading=swap["record"]["program"]["section_heading"])) is None,
      "a degree record under the certificate's heading is not shown its own")

# units_within_printed_range: 45594.
f, e = W.load("45594"), M.REVIEWED["45594"]
a = f["score"]["arithmetic"]
check(a["computed"] == [36.0, 49.0] and a["stated"] == [32.0, 49.0] and a["against"] == "program"
      and (a.get("degree") or {}).get("pass") is True, "45594: 36-49 inside the printed 32-49, and its degree passes")
by = {b["name"]: b for b in f["record"]["blocks"]}
req = by["Required Courses"]["courses"]
check(len(req) == 9 and sum(c["units"] for c in req) == 26, "45594: the nine required rows add to 26")
la = [b for n, b in by.items() if n.startswith("List A")]
check(len(la) == 2 and {b["option_group"] for b in la} == {"List A"}
      and [c.get("units") for c in la[0]["courses"]] == [4] and B.pair(la[1]["stated"]) == [8.0, 8.0]
      and B.pair(by["List B - Select one (3 units)"]["stated"]) == [3.0, 3.0]
      and B.pair(by["List C - Up to 12 additional units from"]["stated"]) == [3.0, 12.0],
      "45594: List A is one of two options, List B prints 3 and List C 3-12, as the page prints them")
check(26 + 4 + 3 + 3 == a["computed"][0] and 26 + 8 + 3 + 12 == a["computed"][1],
      "45594: the page's own figures add to the record's 36-49")
cov = f["score"]["coverage"]
check(cov["pass"] and cov["placed"] == cov["listed"] == 18 and f["score"]["invented"]["pass"],
      "45594: every listed course is placed and none is invented")
words = f["score"]["gaps"][0]["words"]
check(words.startswith("the courses' units add to 36-49, within the printed 32-49 units | ") and e["words"] in words,
      "45594: the gap files the kind's own words and the record's note")
check(NG.answer(bare("45594")) is None, "45594: no record rule names a kind for it")
check(B7.WITHIN_HELD.get((M.COLLEGE, "45594"), (None,))[0] == B7.WITHIN
      and "_program_piles_s741_copper_mountain" in B7.PLAN_MODULES
      and (M.COLLEGE, "43854") not in B7.WITHIN_HELD, "the kind's reviewed lists name 45594, and never 43854")
h = W.load("43854")
check(h is not None and NG.units_within_printed_range({k: v for k, v in h.items()}) is None,
      "43854's figures are not the units kind's")

# lists_not_closed: 14710.
f, e = W.load("14710"), M.REVIEWED["14710"]
a = f["score"]["arithmetic"]
check(a["computed"] == [36.0, 45.0] and a["stated"] == [42.0, 42.0] and B.shape_depends(bare("14710"), e),
      "14710: its lists add to 36-45 against the printed 42, short at the low end")
words = f["score"]["gaps"][0]["words"]
check(e["words"] in words and e["also_words"] in words and " | " in words, "14710: both notes are filed")
blocks = B.blocks(f, e["depends"])
we = B.blocks(f, "Required Work Experience")
check(len(blocks) == 1 and blocks[0]["rule"] == "choose_units" and blocks[0]["minimum"] == 17
      and len(we) == 1 and we[0]["rule"] == "choose_units" and we[0]["minimum"] == 1
      and sorted(c["units"] for c in we[0]["courses"]) == [1, 1, 2, 3, 4],
      "14710: the restricted electives print 17 and the work experience runs from 1 to 4 units")
g = bare("14710")
g["score"]["arithmetic"] = dict(a, computed=[42.0, 45.0])
check(not B.shape_depends(g, e), "a record whose low end meets the printed total does not take the shape")
check(NG.answer(bare("14710")) is None, "14710: no record rule names a kind for it")

sys.exit(t.done())
