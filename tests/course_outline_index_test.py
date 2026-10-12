#!/usr/bin/env python3
"""Guards for kb/_course_outline_index.py (S373; Sam, Open Asks Sheet 70 card 3,
"Every course in the loaded records", and "start the Riverside course index").

One spelling per course code, as the program records and the outline lists print
them, and the courses the loaded records name for the three RCCD colleges. Pure
stdlib; run from the repo root.
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("idx", os.path.join(ROOT, "kb", "_course_outline_index.py"))
idx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(idx)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


cases = {"ACC-1A": "ACC 1A", "ACC 1A": "ACC 1A", "acc 1a": "ACC 1A", "ACC 19L": "ACC 19L",
         "KIN-A11": "KIN A11", "COS-60A1": "COS 60A1", "ADJ-R1A2": "ADJ R1A2",
         "ACCT 116A": "ACCT 116A", "CHIL 291D": "CHIL 291D",
         "ADJ-B1B": "ADJ B1B", "ADJ B1B": "ADJ B1B", "ARTH C1100H": "ARTH C1100H",
         "Course Outline: ACC-1A Principles of Accounting I": "ACC 1A"}
got = {k: idx.norm_code(k) for k in cases}
check("1 one spelling per course: a hyphen or a space, either case; RCCD's letter-led and A1-suffixed numbers; "
      "a common course number (C1100) keeps its letter",
      got == cases, {k: v for k, v in got.items() if v != cases[k]})
check("1 text with no course code reads none", idx.norm_code("Dashboard") is None and idx.norm_code("") is None)

wanted = idx.record_codes(["riverside_city", "moreno_valley", "norco"])
union = set().union(*wanted.values())
check("2 the loaded RCCD records name over a thousand courses, each read to one spelling",
      all(len(v) > 500 for v in wanted.values()) and len(union) > 1000
      and all(idx.norm_code(c) == c for c in union), {k: len(v) for k, v in wanted.items()})
check("2 'ACC 1A' and 'ACC-1A' in the records are one course", "ACC 1A" in union and "ACC-1A" not in union)

src = open(os.path.join(ROOT, "kb", "_course_outline_index.py")).read()
check("3 the index reads pages only: no table write (no POST, PATCH or rpc)",
      "method=" not in src and "/rpc/" not in src and "PATCH" not in src and '"POST"' not in src)

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok or not why else " — " + str(why)))
print("\ncourse_outline_index_test.py: %d/%d checks passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
