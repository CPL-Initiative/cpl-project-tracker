#!/usr/bin/env python3
"""A reconcile from filed pages never turns a mid-table window passing through the program-total fill (S655).

THE CASE. American River 07206 (CIS: Microcomputer Applications, A.A.) was read from page 429 of the 2026-2027
catalog PDF, a window that opens in the middle of the program's course table. Its record places 20 of 32 listed
courses; each of the 12 missing codes carries the reader's own note that the start of the table, on page 428, was
not in the text. The blocks sum to 20 of the stated 37 units. The S655 course-id reconcile (run 43693265189)
rescored it from the same page, and the electives fill on the program total (fill 17 to 17) made the arithmetic
equal, so the loaded checks would have turned passing: the held false pass of p-degree-electives-fill-false-pass-s650
(second reader, #3352). The record was restored from main and keeps run 39047245752.

WHAT THIS PINS. The reader's code is not changed here (the gap is a lane NEXT), so the guard is on the committed
records:
  1. 07206 by hand: 32 listed, 20 placed, the 12 missing codes each noted as outside the window (page 428 or the
     start of the table), the arithmetic unequal at 20 against 37, and the record still on run 39047245752.
  1b. The class predicate against fixtures in tests/fixtures/reconcile_window_fill/: 07206 exactly as the reconcile
     filed it (caught), and two reconciled records passing on a fill that are not this class (not caught).
  2. The class, over every filed record at the colleges the S655 wave rescored: a record a reconcile run rescored
     (read_run set) whose missing courses are all explained as outside the window, and whose arithmetic passes only
     through a fill, does not count passing on the tab unless the record main filed before already did.

    python3 tests/reconcile_window_fill_test.py
"""
from __future__ import annotations

import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_score as S  # noqa: E402

FAILS: list[str] = []


def check(ok: bool, what: str) -> None:
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


COLLEGE_DIR = os.path.join(ROOT, "kb", "program_requirements_college")
# A note that puts the missing course outside the text the record was read from.
# The cut-window signal only: a generic "not in the text" says nothing about where the window began.
OUTSIDE = re.compile(r"start of (the )?table|table start|not included|(likely|possibly) on page \d+", re.I)


def tab(sc: dict) -> bool:
    return S.counts_passing_on_tab({"coverage": (sc.get("coverage") or {}).get("pass"),
                                    "invented": (sc.get("invented") or {}).get("pass"),
                                    "arithmetic": (sc.get("arithmetic") or {}).get("status")})


# ── 1. American River 07206, by hand ──────────────────────────────────────────────────────────────
with open(os.path.join(COLLEGE_DIR, "american_river", "records", "07206.json"), encoding="utf-8") as fh:
    r = json.load(fh)
sc = r["score"]
cov, arith = sc["coverage"], sc["arithmetic"]
notes = {S.norm_code(m["code"]): m.get("why") or "" for m in r["record"].get("missing_explained") or []}
check(str(r.get("extracted_run")) == "39047245752" and "read_run" not in r,
      "07206 keeps run 39047245752 and carries no read_run, so step=reread never posts it")
check(cov["listed"] == 32 and cov["placed"] == 20 and len(cov["missing"]) == 12,
      "07206 places 20 of 32 listed courses, 12 missing (%s of %s, %d)" % (cov["placed"], cov["listed"], len(cov["missing"])))
check(all("428" in notes.get(k, "") or "start of table" in notes.get(k, "") for k in cov["missing"]),
      "each of 07206's 12 missing codes is noted as outside the window (page 428, the table's start)")
check(arith.get("status") == "unequal" and arith.get("computed") == [20.0, 20.0] and arith.get("stated") == [37.0, 37.0]
      and "fill" not in arith, "07206's blocks sum to 20 against 37, with no fill")
check(not sc.get("pass") and not tab(sc), "07206 fails, and the tab does not count it passing")

# ── 2. The class, over the wave's colleges ────────────────────────────────────────────────────────
def fill_over_cut_window(f: dict) -> bool:
    """A record a reconcile rescored (read_run set) whose missing courses are all noted as outside the text, and
    whose arithmetic carries a fill."""
    sc = f.get("score") or {}
    a = sc.get("arithmetic") or {}
    missing = (sc.get("coverage") or {}).get("missing") or []
    if not f.get("read_run") or not missing or "fill" not in a or not isinstance(f.get("record"), dict):
        return False
    why = {S.norm_code(m.get("code")): m.get("why") or "" for m in f["record"].get("missing_explained") or []
           if m.get("code")}
    return all(OUTSIDE.search(why.get(k, "")) for k in missing)


FIXTURES = os.path.join(ROOT, "tests", "fixtures", "reconcile_window_fill")


def fixture(name: str) -> dict:
    with open(os.path.join(FIXTURES, name), encoding="utf-8") as fh:
        return json.load(fh)


# Self-recall: 07206 exactly as run 43693265189 filed it (the file at a8d21394, copied unedited) is in the class
# and counts passing, so the sweep below would have caught it. The values are the second reader's, by hand.
as_reconciled = fixture("american_river_07206_run_43693265189.json")
a = as_reconciled["score"]["arithmetic"]
check(str(as_reconciled.get("extracted_run")) == "43693265189" and as_reconciled.get("read_run") == "39047245752"
      and a.get("fill") == [17.0, 17.0] and a.get("status") == "equal",
      "the fixture is 07206 as the reconcile filed it (run 43693265189, fill 17 to 17)")
check(fill_over_cut_window(as_reconciled) and tab(as_reconciled["score"]),
      "self-recall: 07206 as the reconcile filed it is caught")
check(not fill_over_cut_window(r), "07206 as restored is outside the class (no read_run, no fill)")
# Negatives: a reconciled record passing on a fill whose missing courses the reader placed outside the program,
# never outside the text it was given (East Los Angeles 37924: "appears only in course descriptions"), and one
# with no missing course (Butte 01329, fill 0 to 15). Both are copies of the records as filed on 2026-11-15.
for name, why in (("east_los_angeles_37924.json", "its missing courses are noted as outside the program"),
                  ("butte_01329.json", "it misses no listed course")):
    f = fixture(name)
    check(f.get("read_run") and "fill" in f["score"]["arithmetic"] and tab(f["score"]) and not fill_over_cut_window(f),
          "%s %s passes on a fill after a reconcile and is outside the class: %s"
          % (f.get("college"), f.get("control_number"), why))

SLUGS = ("american_river", "barstow_community", "city_of_san_francisco", "diablo_valley", "riverside_city",
         "santiago_canyon")
seen = flagged = 0
for slug in SLUGS:
    for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, slug, "records", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            f = json.load(fh)
        if not fill_over_cut_window(f):
            continue
        sc, a = f["score"], f["score"]["arithmetic"]
        seen += 1
        if tab(sc):
            flagged += 1
            check(False, "%s %s: a reconcile turned a mid-table window passing through the fill %s"
                  % (slug, f.get("control_number"), a.get("fill")))
check(flagged == 0, "no reconciled record at the six colleges passes on a fill over a window that misses its "
      "table's start (%d such records read)" % seen)

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
