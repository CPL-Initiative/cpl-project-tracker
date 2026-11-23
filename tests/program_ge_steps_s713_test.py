#!/usr/bin/env python3
"""S713's three general education reconcile steps (kb/_program_ge_steps_s713.py; d-ge-steps-three-colleges-s713).

Pinned: the Las Positas pattern reads "Additional General Education and Elective Units" and "... and Electives" and
not "General Education and Electives" alone; the Antelope Valley fill reads the printed figure (a single figure and a
range) on a local degree and never on a transfer degree or a certificate; the College of Marin step sets 22 to 34;
and the measure on every committed record at the three colleges: precision against the hand reading wrong 0, the
boundary readings wrong 0, the records each step moves beyond its targets named.

Run from repo root: python3 tests/program_ge_steps_s713_test.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_ge_steps_s713 as G  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def rec(award):
    return {"program": {"degree_total": {"min": 60, "max": 60}, "ge_pattern": "GE", "ge_units": {"min": None, "max": None}},
            "blocks": []}


def ge(college, award, text):
    out, notes = R._college_steps(rec(award), text, college, award)[:2]
    return (out.get("program") or {}).get("ge_units")


LPC = "Las Positas College"
for t, want in (("Additional General Education and Elective Units 27.0", {"min": 22, "max": 22}),
                ("Additional General Education and Electives 25.0", {"min": 22, "max": 22}),
                ("General Education and Electives 25.0", {"min": None, "max": None})):
    check(ge(LPC, "A.S. Degree", t) == want, "Las Positas A.S. on %r: %r" % (t, ge(LPC, "A.S. Degree", t)))
check(ge(LPC, "A.A. Degree", "Additional General Education and Electives 35.0") == {"min": 28, "max": 28},
      "Las Positas A.A. takes LPC-GE's 28")
AVC = "Antelope Valley College"
line = "Completion of General Education requirements, plus electives as needed to reach 60 units. %s units"
check(ge(AVC, "A.A. Degree", line % "34") == {"min": 34.0, "max": 34.0}, "Antelope Valley reads a single figure")
check(ge(AVC, "A.A. Degree", "Completion of General Education requirements, plus electives (as needed to reach 60 "
         "units) 30-33") == {"min": 30.0, "max": 33.0}, "Antelope Valley reads a range")
check(ge(AVC, "A.A.-T Degree", line % "34") in (None, {"min": None, "max": None}), "never a transfer degree")
check(ge(AVC, "Certificate of Achievement", line % "34") in (None, {"min": None, "max": None}), "never a certificate")
MARIN = "College of Marin"
check(ge(MARIN, "A.A. Degree", "College of Marin GE (minimum 22 units) or Cal-GETC (minimum 34 units)")
      == {"min": 22, "max": 34}, "Marin sets 22 to 34")
check(ge(MARIN, "A.A. Degree", "College of Marin GE requirements apply") == {"min": None, "max": None},
      "Marin needs both minimums printed")

m = G.measure()
for c, r in m.items():
    check(r["precision"]["wrong"] == 0, "%s: precision wrong %r" % (c, r["precision"]["wrong_keys"]))
    check(r["boundaries"]["wrong"] == 0, "%s: boundaries wrong %r" % (c, r["boundaries"]["wrong_keys"]))
    check(set(G.TARGETS[c]) <= set(r["targets_quoted"]), "%s: every target quotes the step's words" % c)
check(m[LPC]["moves_beyond_targets"] == ["01032", "01037"], "Las Positas moves 01032 and 01037 beyond its targets")
check(m[AVC]["moves_beyond_targets"] == ["43686", "43722"], "Antelope Valley moves 43686 and 43722 beyond its targets")
check(m[MARIN]["would_pass"] == [], "Marin passes none: its pages name no electives filling the 60")

if failures:
    for x in failures:
        print("FAIL:", x)
    sys.exit(1)
print("%d/%d checks passed: S713 GE steps" % (checks[0], checks[0]))
