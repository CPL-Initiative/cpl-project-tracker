#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Long Beach City: the four records s731c held, one collected with its gap named (kb/_program_piles_s739_lbcc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the four keys are s731c's holds; 44848 collected (noted_section_cut_off, its course-list match capped at 50);
  * 43021 holds: its page-mate 02677 carries the same title and the same heading, so no form of the own-page guard
    shows the page to be its own, though today's scorer passes it;
  * 37213 holds on its own note (another award's page);
  * 42970 holds on d-lbcc-42970-no-units-read-or-hold-s731: no_units_printed is off and no_units_read refuses it.

Run from repo root: python3 tests/program_piles_s739_lbcc_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_lbcc as M  # noqa: E402

W = M.W
NG = B.NG
ROWS = {"44848": "noted_section_cut_off"}
HELD = {"43021": ["02677", "the inventory's call"], "37213": ["not the program's own", "page search"],
        "42970": ["d-lbcc-42970-no-units-read-or-hold-s731", NG.HOLD_NO_UNITS_PRINTED]}
SCORES = {"noted_section_cut_off": 20}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=4)
check = t.check

f = W.load("44848")
check(f["score"]["confidence"]["course_list_match"] == 50 and f["score"]["coverage"]["share"] > 0.5,
      "44848: its course-list match is capped at 50")
check(f["source_url"].endswith("/general-education-plans/plan-c/") and W.shared_with("44848") == [],
      "44848 was read from the catalog's own Cal-GETC page, which no other program was read from")

f, g = W.load("43021"), W.load("02677")
check(W.shared_with("43021") == ["02677"] and f["title"] == g["title"] and f["award"] == g["award"]
      and B.scorer_passes(f), "43021 shares its page with 02677, the same title and award, and today's scorer passes it")
for form in ({"own_heading": f["record"]["program"]["section_heading"]}, {"own_list": True, "gap": "heading_not_in_text"},
             {"own_section": "Registered Nursing"}):
    check(W.own(f, dict({"gap": "noted_figures_differ"}, **form)) is None,
          "43021: %s does not show the page its own" % sorted(form)[0])
check(any("not the CSU GE-Breadth certificate" in n for n in B.notes(W.load("37213"))), "37213: its note says the page "
      "is another award's")
f = W.load("42970")
check(NG.NO_UNITS_PRINTED_ON is False and NG.no_units_read(f) is None, "42970: no_units_printed stays off and "
      "no_units_read refuses it")

sys.exit(t.done())
