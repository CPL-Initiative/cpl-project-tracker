#!/usr/bin/env python3
"""Fixture test for scripts/k10_disclosure_check.py (S602): each disclosure failure is
caught, and the shape that passes live today passes here. No network."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import k10_disclosure_check as k10  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


ok_rollup = [
    {"unified_title": "A", "students": 25, "students_suppressed": False, "potential_units": 75, "rows_total": 30},
    {"unified_title": "A", "students": None, "students_suppressed": True, "potential_units": None, "rows_total": None},
    {"unified_title": "A", "students": None, "students_suppressed": True, "potential_units": None, "rows_total": None},
    {"unified_title": "B", "students": 12, "students_suppressed": False, "potential_units": 36, "rows_total": 12},
]
ok_volume = [{"unified_title": "A", "students": 40, "potential_units": 120},
             {"unified_title": "B", "students": 12, "potential_units": 36}]

out = k10.evaluate(ok_rollup, ok_volume)
check("a suppressed pair under a published total passes", out["failures"] == [])

bad = k10.evaluate(ok_rollup + [{"unified_title": "C", "students": 4, "students_suppressed": False,
                                 "potential_units": 8, "rows_total": 4}], ok_volume)
check("a visible count of 4 fails", "rollup_visible_under_k" in bad["failures"])

bad = k10.evaluate(ok_rollup, ok_volume + [{"unified_title": "D", "students": 9, "potential_units": 9}])
check("a statewide count of 9 fails", "volume_visible_under_k" in bad["failures"])

check("a count of exactly 10 passes",
      k10.evaluate([{"unified_title": "E", "students": 10, "students_suppressed": False}], [])["failures"] == [])

bad = k10.evaluate([{"unified_title": "F", "students": None, "students_suppressed": True,
                     "potential_units": 3.0, "rows_total": None}], [])
check("units left on a suppressed row fail", "rollup_measure_on_suppressed" in bad["failures"])

lone = [{"unified_title": "G", "students": 30, "students_suppressed": False, "potential_units": 90, "rows_total": 30},
        {"unified_title": "G", "students": None, "students_suppressed": True, "potential_units": None, "rows_total": None}]
bad = k10.evaluate(lone, [{"unified_title": "G", "students": 35, "potential_units": 105}])
check("one suppressed cell under a published total fails (recoverable by subtraction)",
      "recoverable_by_subtraction" in bad["failures"])
check("the same cell passes when the total is withheld",
      k10.evaluate(lone, [{"unified_title": "G", "students": None, "potential_units": None}])["failures"] == [])

src = open(os.path.join(os.path.dirname(k10.__file__), "k10_disclosure_check.py"), encoding="utf-8").read()
check("the checker reads the key from cpl_funding.js, never a pasted copy", "eyJ" not in src)
check("the checker pages its reads", "Range" in src)

for name, ok in results:
    print(("  ok   " if ok else "  FAIL ") + name)
failed = [n for n, ok in results if not ok]
print("k10_disclosure_check_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
