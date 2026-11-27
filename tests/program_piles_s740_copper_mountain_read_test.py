#!/usr/bin/env python3
"""S740, lane 1 (reads), Copper Mountain after the reissue's read: 1 record collected with a named gap, 6 held (kb/_program_piles_s740_copper_mountain_read.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own;
and a named gap must be true for its record. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the 7 keys are s740r3's holds that read 45855512160 filed again and left failing; 18519, which it passed, is no
    key;
  * the live-run reading (B.LiveRuns): reread 45855997214 replaced every key at the read's run;
  * 16657: without the two lists the page heads as taken before applying and before admission, the courses add to
    the printed 37; with either list kept they do not;
  * the holds, each on the record's own figures: the vocational nursing pair adds to 54.6 against 56; 43854's degree
    sum holds the printed 60 inside it; 14751 and 45594 read unequal.

Run from repo root: python3 tests/program_piles_s740_copper_mountain_read_test.py
"""
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s740_copper_mountain_read as M  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"16657": "prerequisites_counted"}
HELD = {"14737": ["54.6", "total_differs"], "20094": ["54.6", "total_differs"], "14751": ["42-48", "63-69"],
        "43854": ["units within-range kind"], "45594": ["36-49", "Up to 12 additional units"],
        "14710": ["work experience", "no one kind is true"]}
SCORES = {"prerequisites_counted": 70}

# Either state (p-older-pile-tests-pin-runs-later-plans-move-s739): S741's free reconcile 45957316339 re-filed this
# read's degree records with the catalog's degree floor (degree_total_minimum, kb/program_requirements_reconcile.json),
# each still read at this read's run; History 43854 and Fire Technology 14751 pass with it.
LATER = "45957316339"
FLOOR = {"degree_total_minimum": True}
t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=4, prior_held=set(M.KEYS),
          later_flags={"16657": FLOOR})
check = t.check


def at_the_read(f):
    """The record holds the read's run, or the later reconcile's over a read at the read's run."""
    return str(f["extracted_run"]) == M.READ or (str(f["extracted_run"]) == LATER and str(f.get("read_run")) == M.READ)


def passes_by_the_floor(f):
    return str(f["extracted_run"]) == LATER and f["record"]["program"].get("degree_total_minimum") is True \
        and S.passes_live(f["score"])

check(len(M.KEYS) == 7 and set(M.KEYS) == set(ROWS) | set(HELD) and M.PASSED_BY_THE_READ == ("18519",),
      "the 7 keys are the records the read left failing")
f = W.load("18519")
check(S.passes_live(f["score"]) and at_the_read(f), "18519 passes at the read's run, and is no key")

# The live-run reading.
rereads = []
for path in glob.glob(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_copper_mountain_*.json")):
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    if str(d.get("extracted_run")) == M.READ:
        rereads.append(d)
check(len(rereads) == 1 and set(M.KEYS) <= {str(k) for k in rereads[0].get("replaced_keys") or []},
      "the reread at the read's run replaced every key")
check(all(at_the_read(W.load(cn)) for cn in M.KEYS), "every key's record holds the read's run")
g = dict(W.load("16657"), extracted_run="1")
check(not W.on_live_run(g), "a record at another run is not on its live run")


def reads(cn, ops):
    f = W.load(cn)
    return B.closes(f, B.apply_ops(f, ops))


check(reads("16657", M.REVIEWED["16657"]["ops"]), "16657: without the two prerequisite lists the courses add to 37")
check(not reads("16657", [("drop", M._PRIOR)]) and not reads("16657", [("drop", M._BEFORE)]),
      "16657: with either list kept it does not close")
f = W.load("16657")
check(any(M.REVIEWED["16657"]["words"] in n for n in B.notes(f)), "16657: the words are its own note's")

# The holds.
for cn in ("14737", "20094"):
    a = B.arithmetic(W.load(cn))
    check(a["computed"] == [54.6, 54.6] and a["stated"] == [56.0, 56.0], "%s adds to 54.6 against the printed 56" % cn)
f = W.load("43854")
a = B.arithmetic(f)
p = f["record"]["program"]
check((a.get("against") == "degree" and a["computed"][0] < a["stated"][0] < a["computed"][1]) or passes_by_the_floor(f),
      "43854: the degree's sum holds the printed 60 inside it, or it passes by the degree's floor")
check(p["total_units"] == {"min": 24, "max": 24} and p["ge_units"] == {"min": 34, "max": 43}
      and p["degree_total"] == {"min": 60, "max": 60}, "43854: the record holds the page's 24, 34-43 and 60")
for cn in ("14751", "45594", "14710"):
    f = W.load(cn)
    check(B.arithmetic(f).get("status") == "unequal" or (cn == "14751" and passes_by_the_floor(f)),
          "%s reads unequal%s" % (cn, ", or passes by the degree's floor" if cn == "14751" else ""))

sys.exit(t.done())
