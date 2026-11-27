#!/usr/bin/env python3
"""S741, lane 1 at Norco after the group-end read's reread: five records s740c1 held, each with its gap named.

WHY. kb/_program_piles_s741_norco.py reads 32830, 37311, 44961, 39998 and 40064 again once reread 45969610504 posted
paid read 45964327019, the re-read S740's plan named (the capture's text now marks where a 'Select one' group ends).
Seven of the twelve re-read records pass. These five still fail on their units, each for a cause the page prints. The
shared checks are tests/program_piles_s739_common.py's; the keys are five of s740c1's holds, read from its committed
receipt.

Pinned here beside them:
  * each row is at the read's run, and the committed reread receipt posted that run for it;
  * 32830, 37311, 44961: the major adds to its printed total, the degree's units are incomplete, and the record rule
    names ge_units_not_read with the rule's own words, which the committed record files;
  * 39998 and 40064: the page's own rows (college-page-read 45954122786): 'Required courses · Units: 16.00' over a
    group headed 16.00 that holds APP-450 at 4.00, 'Elective Courses · Units: 14.00- 15.00', 'Total : 30.00- 31.00';
    each record adds APP-450 at 4 and reads 18-19, at 16 it adds to the printed 30-31, and each record's own note
    quotes both figures; the two share one page, and each note says which award the record reads.

Run from repo root: python3 tests/program_piles_s741_norco_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402

import _program_piles_s739 as B  # noqa: E402
import _program_piles_s741_norco as M  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"32830": "ge_units_not_read", "37311": "ge_units_not_read", "44961": "ge_units_not_read",
        "39998": "noted_figures_differ", "40064": "noted_figures_differ"}
SCORES = {"ge_units_not_read": 50, "noted_figures_differ": 40}
OWN = {"39998": "own_section", "40064": "own_section"}
t = T.run(W, rows=ROWS, held={}, scores=SCORES, day="2026-11-27", boundaries=16, own=OWN)
check = t.check

with open(os.path.join(B.ROOT, M.REREAD), encoding="utf-8") as fh:
    reread = json.load(fh)
posted = {str(k) for k in (reread.get("replaced_keys") or []) + (reread.get("carried_keys") or [])}
for cn in ROWS:
    f = W.load(cn)
    check(str(f["extracted_run"]) == M.READ == str(reread["extracted_run"]) and cn in posted,
          "%s is at the read's run, and the committed reread receipt posted it" % cn)

# ── the three transfer degrees: the rule's own answer ───────────────────────
MAJORS = {"32830": [18.0, 18.0], "37311": [41.0, 41.0], "44961": [32.0, 33.0]}
for cn, major in MAJORS.items():
    f = W.load(cn)
    bare = dict(f, score={k: v for k, v in f["score"].items() if k not in ("gaps", "confidence")})
    a = bare["score"]["arithmetic"]
    check(a["status"] == "incomplete" and a["major"]["status"] == "equal" and a["major"]["computed"] == major
          and a["major"]["stated"] == major and a["stated"] == [60.0, 60.0],
          "%s: the major adds to its printed %s and the degree's 60 is incomplete" % (cn, major))
    got = NG.answer(bare)
    check(got is not None and got[0] == "ge_units_not_read" and "Cal-GETC" in got[1] and "its major adds" in got[1],
          "%s: the record rule names ge_units_not_read, with its own words (%r)" % (cn, got))
    check(f["score"]["gaps"][0]["words"] == got[1] and f["score"]["confidence"]["unit_arithmetic"] == 50,
          "%s: the committed record files the rule's words and the kind's score" % cn)
check(any("no GE unit figure printed" in n for n in B.notes(W.load("32830"))),
      "32830's own note says no general education figure is printed")

# ── Manufacturing Technician 2: the page's own rows (college-page-read 45954122786) ─────────
PAGE_ROWS = """block 2 depth 1 row  Required courses · Units: 16.00 · COURSE
block 2 depth 4 GROUP of 1  16.00 · APP-450 · Apprenticeship Work Experience ( Active )
block 2 depth 7 row  APP-450 · Apprenticeship Work Experience ( Active ) · 4.00
block 2 depth 1 row  Elective Courses · Units: 14.00- 15.00 · COURSE
"""
check("Required courses · Units: 16.00" in PAGE_ROWS and "GROUP of 1  16.00 · APP-450" in PAGE_ROWS
      and "APP-450 · Apprenticeship Work Experience ( Active ) · 4.00" in PAGE_ROWS and 16 + 14 == 30 and 16 + 15 == 31,
      "the page prints 16.00 over one row, APP-450 at 4.00, and its 16 and 14-15 add to the printed 30-31")
for cn in ("39998", "40064"):
    f = W.load(cn)
    e = M.REVIEWED[cn]
    a = f["score"]["arithmetic"]
    check(a["status"] == "unequal" and a["computed"] == [18.0, 19.0] and a["stated"] == [30.0, 31.0],
          "%s reads 18-19 against the printed 30-31" % cn)
    rows = B.course_rows(f, "APP-450")
    check(len(rows) == 1 and rows[0]["units"] == 4, "%s: the record holds APP-450 once, at its printed 4 units" % cn)
    check(B.closes(f, B.apply_ops(f, e["ops"])) and not B.closes(f, copy.deepcopy(f["record"])),
          "%s: with APP-450 at the list's 16 the record adds to the printed 30-31; as read it does not" % cn)
    note = next((n for n in B.notes(f) if e["words"] in n), "")
    check("16.00" in note and "4.00" in note, "%s: its own note quotes both figures, 16.00 and 4.00" % cn)
    check(any(e["own_section"] in n and "both" in n for n in B.notes(f)),
          "%s: its own note says the section covers both awards and which one this record reads" % cn)
check(W.shared_with("39998") == ["40064"] and W.shared_with("40064") == ["39998"],
      "the two are each other's only page-mate")
sys.exit(t.done())
