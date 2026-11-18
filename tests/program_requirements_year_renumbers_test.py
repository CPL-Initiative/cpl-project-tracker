#!/usr/bin/env python3
"""A prior-year record is scored against the course numbers of its own year (S663).

Riverside City's 2025-2026 catalog prints MAT-1C where the state's list for the same program names MATH 1C
(its 2026 renumbering), so a prior-year read failed coverage where the 2026-2027 record passed (#3384).
course_renumbers_by_year[<year>] in kb/program_requirements_reconcile.json maps a code that year printed to
the state's code. Guards: the year's map reaches the scorer's aliases and the capture's printed forms only
for a record of that year; a current-year record (or one with no year) never gets the old code; a note key
(leading _) is never a renumber.

Run from repo root: python3 tests/program_requirements_year_renumbers_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_college as C  # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


STEPS = {"X College": {"prefix_aliases": {"HIS": "HIST"}, "course_renumbers": {"OLD9": "NEW 9"},
                       "course_renumbers_by_year": {"2025-2026": {"_evidence": "catalog 71", "MAT 1C": "MATH 1C"}}}}

cur = R.prefix_aliases("X College", STEPS, year="2026-2027")
check(cur == {"HIS": "HIST", "OLD9": "NEW 9"}, "a current-year record gets no prior-year renumber: %r" % cur)
check(R.prefix_aliases("X College", STEPS) == cur, "a record with no year scores as the current year")
old = R.prefix_aliases("X College", STEPS, year="2025-2026")
check(old.get("MAT 1C") == "MATH 1C", "a 2025-2026 record reads MAT 1C as the listed MATH 1C: %r" % old)
check("_evidence" not in old, "a note key is never a renumber")
check(old.get("OLD9") == "NEW 9" and old.get("HIS") == "HIST", "the standing maps stay beside the year's")

cr = R.course_renumbers("X College", STEPS, year="2025-2026")
check(cr.get("MATH1C") == "MAT 1C", "the capture looks for MAT 1C in place of the listed MATH 1C: %r" % cr)
check("MATH1C" not in R.course_renumbers("X College", STEPS, year="2026-2027"),
      "the current-year capture keeps looking for MATH 1C")

progs = [{"control_number": "1", "closed_list": [{"code": "MATH 1C"}, {"code": "PHY 4A"}]}]
got = C.with_renumbers(progs, cr, STEPS["X College"]["prefix_aliases"])
check(got[0]["closed_list"][0].get("printed") == "MAT 1C", "the listed course carries the year's printed form")
check("printed" not in got[0]["closed_list"][1], "an unrenumbered course carries no printed form")

# Riverside City's entry, once filed, must be year-scoped: a plain course_renumbers entry would make every
# 2026-2027 record look for the old code.
real = R.load_steps().get("Riverside City College") or {}
check(not any(k.upper().startswith("MAT ") or k.upper().startswith("MAT-") for k in (real.get("course_renumbers") or {})),
      "Riverside City's MAT renumbers live under course_renumbers_by_year, never the standing map")

if failures:
    print("FAIL (%d):" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: year-scoped renumbers")
