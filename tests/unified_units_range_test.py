#!/usr/bin/env python3
"""Units never split an identity — the Unified Courses unit range (2026-09-29, S301).

Sam, 2026-09-27: a merge or a mint that joins records whose units differ keeps
one identity and shows the range it joins (*Orienteering (1–3 units)*), for
M-IDs and credit recommendations alike.

THE FAILURE MODE. The M-ID branch of the Units bake read the minted
memberships alone, which lack merged-in singletons and re-homed courses, while
the member table beside it lists every course the row displays (_row_ents). On
the data of 2026-09-28, 2,358 merge targets printed "—" or one figure over
members that differ, 578 printed too narrow a range, and 48 printed a figure no
displayed member carries (PHSC M1027: 4.0 over one 5-unit member). The table's
⚠ also called any spread over 2 "likely an over-merge… review/split", which the
rule retires.

A. _units_from_members on fixtures: the range comes from the displayed members,
   the memberships only when none are displayed; the scalar changes only where
   it is wrong, never when curated, and stays empty on a tie.
B. The bake feeds it the displayed members (_row_ents), and the tab's Units cell
   carries no over-merge alarm.

Run from the repo root:  python3 tests/unified_units_range_test.py
"""
import importlib.util
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "kb"))

spec = importlib.util.spec_from_file_location("gen", os.path.join(ROOT, "excel_to_dashboard.py"))
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)
f = gen._units_from_members

fails = []


def check(label, got, want):
    ok = got == want
    print(("  ok   " if ok else "  FAIL ") + label + ("" if ok else f"\n         got {got!r}\n         want {want!r}"))
    if not ok:
        fails.append(label)


print("A. _units_from_members")
# AGAS M1001: two displayed members at 2 and 3, memberships empty, scalar None.
check("displayed members that differ show their range; a tie leaves the scalar empty",
      f([2.0, 3.0], [], None, False), (2.0, 3.0, None))
# ENGL M1107: memberships said 3 alone; the displayed members run 3 to 4.
check("the range reads the displayed members, never the narrower memberships",
      f([3.0, 3.0, 4.0], [3.0], 3.0, False), (3.0, 4.0, 3.0))
check("the memberships stand in only when no member is displayed",
      f([], [1.0, 2.0], 1.0, False), (1.0, 2.0, 1.0))
check("a missing scalar takes the members' modal",
      f([2.0, 2.0, 3.0], [], None, False), (2.0, 3.0, 2.0))
# PHSC M1027: 4.0 over one displayed member at 5.
check("a scalar no displayed member carries takes their figure",
      f([5.0], [], 4.0, False), (None, None, 5.0))
check("a scalar some displayed member carries stays, though not the modal",
      f([2.0, 3.0, 3.0], [], 2.0, False), (2.0, 3.0, 2.0))
check("a curated scalar is never replaced",
      f([5.0], [], 4.0, True), (None, None, 4.0))
check("members that agree show one figure and no range",
      f([3.0, 3.0], [3.0], 3.0, False), (None, None, 3.0))
check("an int and a float of one figure are one figure",
      f([4, 4.0], [], 4.0, False), (None, None, 4.0))
check("no figures anywhere leaves the row alone",
      f([], [], None, False), (None, None, None))

print("B. the call site and the tab")
src = open(os.path.join(ROOT, "excel_to_dashboard.py"), encoding="utf-8").read()
bake = src[src.index("# ---- typical-units RANGE"):src.index("# Official-ID row stats")]
check("the M-ID bake reads the displayed members (_row_ents) and hands them over",
      bool(re.search(r"shown = \[e\[\"u\"\] for e in _row_ents\(r\) .*\n\s+lo, hi, u = _units_from_members\(\s*shown, mus,",
                     bake)), True)
uc = open(os.path.join(ROOT, "unified_courses.js"), encoding="utf-8").read()
check("the Units cell calls no spread an over-merge to split",
      [p for p in ("Unit spread > 2", "over-merge of different unit-load variants") if p in uc], [])

print(f"\n{'FAILED: ' + ', '.join(fails) if fails else 'all checks passed'}")
sys.exit(1 if fails else 0)
