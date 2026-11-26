#!/usr/bin/env python3
"""S740, lane 1 at Norco: the census's 14 wording-rule records, 2 collected with a named gap and 12 held.

WHY. kb/_program_piles_s740_norco.py reads the census's reconcile_steps records at Norco College from the committed
records, their notes and today's capture. Two take lists_not_closed. Eleven are held for one cause, the flattened
table: the curriQunet page prints a figure over Required Courses that the rows under it do not add to as the capture's
text gives them, because the text does not say where a 'Select one' group ends (college-page-read run 45835049303
printed the pages as the capture reads them). The fix is a change to the capture, which S740 does not make, so the
plan holds them and names the change. One is not collectable. The shared checks are
tests/program_piles_s739_common.py's.

Pinned here beside them:
  * the page's own words, quoted from the read: Philosophy's 'Units: 9.00' over two groups of 3.00, and Drafting
    Technology's 'Units: 14.00-15.00' over four groups that add to 11-12, with the reading that would close each (the
    row after the group read as a required course of its own);
  * the held records fail their units by the amount such a row carries, and 44792's own note names the flattened
    table;
  * the two lists_not_closed rows: the named list prints no figure, and 30109 adds to its printed 18 without it.

Run from repo root: python3 tests/program_piles_s740_norco_test.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402

import _program_piles_s739 as B  # noqa: E402
import _program_piles_s740_norco as M  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"30107": "lists_not_closed", "30109": "lists_not_closed"}
FLAT = ("30091", "40079", "32830", "33751", "33854", "37311", "39998", "40064", "41680", "44792", "44961")
HELD = {cn: ["the flattened table", "A change to shared reader code is out of S740's scope"] for cn in FLAT}
HELD["30061"] = ["not collectable", "MAG-200", "a paid reread"]
SCORES = {"lists_not_closed": 30}
t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=9, prior_held=set(M.KEYS))
check = t.check

with open(os.path.join(B.ROOT, "kb", "status", "harvest_gap_census.json"), encoding="utf-8") as fh:
    import json
    census = json.load(fh)
lever = next(e for e in census["levers"] if e["lever"] == "reconcile_steps" and e["scope"] == M.COLLEGE)
# The run took its keys from the census's reconcile_steps members at Norco. Once its piles land, the census rebuilds and
# the keys the run resolved into rows (ROWS) leave the lever (S736, 2026-11-26: 30107 and 30109 left after #3892 and
# the census run 45870806616), so the census may only shrink by those keys and never gain one.
check(set(lever["members"]) <= set(M.KEYS) and set(M.KEYS) - set(lever["members"]) <= set(ROWS),
      "the census's reconcile_steps members at Norco are the run's keys, less the ones it resolved")

# ── the pages' own words (college-page-read run 45835049303, line for line) ─────────────────────────────────
PHILOSOPHY = """Program Requirements
Required Courses
Units: 9.00
COURSE
TITLE
UNITS
Choose one course
3.00
PHI-10
Introduction to Philosophy
3.00
PHI-10H
Honors Introduction to Philosophy
3.00
PHI-12
Introduction to Ethics
3.00
Choose one course
3.00
PHI-32
Introduction to Symbolic Logic
3.00
MATH-32
Introduction to Symbolic Logic
3.00
List A
Units: 6.00
"""
DRAFTING = ("Program Requirements|Required Courses|Units: 14.00-15.00|COURSE|TITLE|UNITS|Select one of the following:|3.00|"
            "DFT-21|Drafting|3.00|ENE-21|Drafting|3.00|Select one of the following:|3.00|DFT-27|Technical Communications|"
            "3.00|ENE-27|Technical Communications|3.00|Select one of the following:|3.00|DFT-30|Computer Aided Drafting "
            "(CAD)|3.00|ENE-30|Computer Aided Drafting (CAD)|3.00|Select one of the following:|2.00-3.00|DFT-51|Print "
            "Reading|2.00|ENE-51|Print Reading|2.00|CON-62|Print Reading for Construction|3.00|DFT-62|Basic Fusion 360|"
            "3.00|Elective Courses|Units: 6.00").replace("|", "\n")


def groups(text):
    """(the figure over Required Courses, each group's printed figure) as the flat text prints them."""
    head = re.search(r"Required Courses\nUnits: ([\d.]+)(?:-\s*([\d.]+))?", text)
    figs = re.findall(r"(?:Choose one course|Select one of the following:)\n([\d.]+)(?:-([\d.]+))?", text)
    lo = sum(float(a) for a, _b in figs)
    hi = sum(float(b or a) for a, b in figs)
    return (float(head.group(1)), float(head.group(2) or head.group(1))), (lo, hi)


over, add = groups(PHILOSOPHY)
check(over == (9.0, 9.0) and add == (6.0, 6.0), "Philosophy prints 'Units: 9.00' over two groups that add to 6 (%r %r)" % (over, add))
check(over[0] - add[0] == 3.0 and "PHI-12\nIntroduction to Ethics\n3.00" in PHILOSOPHY,
      "the 3 units short are one course's, and PHI-12 is the row that follows the first group's pair")
over, add = groups(DRAFTING)
check(over == (14.0, 15.0) and add == (11.0, 12.0),
      "Drafting Technology prints 'Units: 14.00-15.00' over four groups that add to 11-12 (%r %r)" % (over, add))
check("DFT-62\nBasic Fusion 360\n3.00" in DRAFTING and over[0] - add[0] == 3.0,
      "the 3 units short are one course's, and DFT-62 is the row that follows the last group")

# ── the held records fail by what such a row carries ───────────────────────
SHORT = {"32830": (3, 3), "30091": (3, 3), "40079": (3, 3), "41680": (3, 3), "44961": (3, 3), "37311": (1, 1),
         "44792": (6, 6)}
for cn, want in SHORT.items():
    a = W.load(cn)["score"]["arithmetic"]
    got = (a["stated"][0] - a["computed"][0], a["stated"][1] - a["computed"][1])
    check(got == want and a["status"] == "unequal", "%s adds %s short of its printed total (%r)" % (cn, want, got))
for cn in FLAT:
    f = W.load(cn)
    check(NG.collectable(f["score"]) and not B.scorer_passes(f) and not f["score"].get("gaps"),
          "%s is collectable, fails today's scorer and carries no gap: it is held, not gap-filed" % cn)
    check(W.outcome(f)[0] == "none", "%s: the plan names no gap for it" % cn)
check(any("The flattened table loses indentation" in n for n in B.notes(W.load("44792"))),
      "44792's own note names the flattened table")
check(any("a third required item may be missing from the text" in n for n in B.notes(W.load("32830"))),
      "32830's note says a third required item may be missing from the text")
f = W.load("30061")
check(not NG.collectable(f["score"]) and f["score"]["arithmetic"]["status"] == "equal"
      and f["score"]["coverage"]["pass"] and not f["score"]["invented"]["pass"]
      and any("MAG-200" in n and "should be catalog_addition true" in n for n in B.notes(f)),
      "30061: its units add up, and it fails only on MAG-200, which its own note says is a catalog addition")

# ── the two rows ───────────────────────────────────────────────────────────
f = W.load("30107")
check(B.shape_open(f, M.REVIEWED["30107"]) and f["score"]["arithmetic"]["why"]
      == ["'Elective Courses' chooses units but names no minimum"],
      "30107: the elective list prints no figure, the record's one arithmetic reason")
f = W.load("30109")
check(B.shape_open(f, M.REVIEWED["30109"]) and B.closes(f, B.apply_ops(f, M.REVIEWED["30109"]["ops"])),
      "30109: the studio list prints no figure, and without it the record adds to its printed 18")
sys.exit(t.done())
