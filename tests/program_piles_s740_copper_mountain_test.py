#!/usr/bin/env python3
"""S740, lane 1 (reads), the cheap pile at Copper Mountain: 1 record collected with a named gap, 8 held (kb/_program_piles_s740_copper_mountain.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own;
and a named gap must be true for its record (d-within-range-sums-hold-for-units-kind-s739). The shared checks are
tests/program_piles_s739_common.py's. Pinned here:

  * the 9 keys are the census's reconcile_steps records at the college;
  * the live-run reading (B.LiveRuns): load 39035576595 held one run and inserted every key at the run its record
    holds;
  * 42178's note quotes both figures, 'Required Courses 32-33' and the 30 its courses add to;
  * the holds, each on the record's own figures: the three nursing records are not collectable while a renamed
    course is unplaced; 18519's arithmetic passes and its page is shared with 18520; 43854's degree sum holds the
    printed 60 inside it; 14751's filed arithmetic is an older scorer's; 45594 and 14710 close on no reading a note
    of theirs names;
  * why the holds wait on a read of the reissue and never on a reconcile: each filed record was read from the
    09.03.26 file, another address than the reissue the capture reads now.

Run from repo root: python3 tests/program_piles_s740_copper_mountain_test.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s740_copper_mountain as M  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"42178": "noted_figures_differ"}
HELD = {"14737": ["PSYC 003", "a read of the reissue first"], "20094": ["PSYC 003", "a read of the reissue first"],
        "16657": ["COMM 007", "prerequisites_counted"], "18519": ["18520", "a read of the reissue"],
        "14710": ["work experience", "no one kind is true"], "14751": ["an older scorer's", "a read of the reissue"],
        "43854": ["units within-range kind"], "45594": ["Up to 12 additional units", "CDEV C1000"]}
SCORES = {"noted_figures_differ": 40}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=4, prior_held=set(M.KEYS))
check = t.check

check(len(M.KEYS) == 9 and set(M.KEYS) == set(ROWS) | set(HELD), "the 9 keys are the census's pile at the college")

# The live-run reading.
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_copper_mountain_39035576595.json"),
          encoding="utf-8") as fh:
    load = json.load(fh)
check(load["extracted_runs"] == ["39035222722"] and set(M.KEYS) <= set(load["inserted_keys"]),
      "load 39035576595 held one run and inserted every key")
# 42178's record holds the run the load posted until a reconcile restamps it; the shared checks read its live run from
# the receipts in either state.
g = dict(W.load("42178"), extracted_run="1")
check(not W.on_live_run(g), "a record at another run is not on its live run")

f = W.load("42178")
check(B.shape_note_quotes(f, M.REVIEWED["42178"]), "42178: its note quotes 'Required Courses 32-33' and the 30")
a = B.arithmetic(f)
check(a["computed"] == [30.0, 30.0] and a["stated"] == [32.0, 33.0], "42178 adds to 30 against the printed 32-33")

# The holds, on each record's own figures.
for cn in ("14737", "20094", "16657"):
    f = W.load(cn)
    check(str(f["extracted_run"]) != "39035222722" or not NG.collectable(f["score"]),
          "%s is not collectable as loaded (a read of the reissue, with the pairs, files it again)" % cn)
f = W.load("18519")
check(W.shared_with("18519") == ["18520"] or S.passes_live(f["score"]),
      "18519's page is shared with 18520 (or a read of the reissue has passed it since)")
check(B.arithmetic(f).get("status") == "equal", "18519's arithmetic passes")
a = B.arithmetic(W.load("43854"))
check(a.get("against") == "degree" and a["computed"][0] < a["stated"][0] < a["computed"][1],
      "43854: the degree's sum holds the printed 60 inside it")
check(all(cn not in M.REVIEWED for cn in HELD), "no hold carries an entry")

# Why a read and no reconcile: each held record's source is the 09.03.26 file, and the capture now reads the reissue.
import _program_requirements_college as K  # noqa: E402
with open(os.path.join(B.ROOT, "kb", "program_requirements_college", "copper_mountain", "capture.json"),
          encoding="utf-8") as fh:
    cap = json.load(fh)
check("11.18.26r1" in cap["catalog_url"]
      and all("09.03.26r1" not in str(W.load(cn).get("source_url")) or not K.same_file(W.load(cn)["source_url"], cap["catalog_url"])
              for cn in HELD),
      "a held record read from the 09.03.26 file is on another address than the capture's reissue")

sys.exit(t.done())
