#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Gavilan: the 11 records s721d held, nine collected with named gaps.

S721's plan (kb/_program_piles_s721_gavilan.py, s721d) collected seven of the census's wording-rule records and held
11. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named
and a lower score, never held, unless the record is not the program's own. The 11 are read again here, by key, from
the committed records, their notes and today's capture. Each was read from a catalog page of its own address, which
no other record was read from. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (9, REVIEWED below):
  noted_figures_differ (40), a printed range whose top the courses add to, the note quoting both (s739j's reading of
        Orange Coast 41373, 'Total Major Units 28-29' against 29): 08460 Cosmetology A.S. ('Units: 30- 36' against
        three courses that total 36; 'The 30 lower bound is not explained by the text') and 19378 Child Development
        and Educational Studies ('Total: 14- 24' against two blocks that sum to 24). S721 held both because a sum
        inside the printed range is no disagreement of the scorer's; each note says the page's low end is not
        explained, and the gap files that note. A scorer reading that passes a sum at the top of a printed range
        would pass them (the lever, named in the receipt).
  noted_figures_differ (40), one list's printed figure against what its courses carry, the note quoting both, and
        the page's figures adding to the stated total with that list at its figure (block_differs below):
        38787 Elementary Teacher Education A.A.-T (the core's 'Units: 42- 48' over courses that sum to 47-48; its
              List C note, a trailing 'or' with no course after it, is filed beside it);
        41394 Business Administration 2.0 A.S.-T (a choose-one list's 3-4 over courses of 4 units each);
        06132 Licensed Vocational Nursing A.S., two gaps on one row (the prerequisites' 'Units: 46.5- 51.5' over
              courses that sum to 22-26, and the BIO 7 and BIO 9 pair read as alternatives: pair_read_as_alternatives
              is 50, so the lower score is filed with both notes);
        37896 Engineering A.S. (the core's 'Units: 22' over courses that sum to 23; the page's 22+3+3+10 and 26 of
              general education are the printed 64, and the record's high end carries general education's 26-32);
        18541 Accounting A.A., two gaps on one row (the additional requirements' 13.5-14.5 over courses that sum to
              15.5, and the core's 'Units: 9- 19' printed once over its nested choices: pool_figure_not_read is
              also 40; both notes are filed).
  noted_figures_differ (40)  24369 GED Preparation, noncredit: the page prints 'Total: 0' over course figures of 6
        and 1-6, which its notes say may be hours; the record adds to 7-12 and states 0.
  figure_within_variable_units (60)  06128 Music A.A.: 'Units: 21' over four requirement groups whose last takes one
        of eight courses, seven at 2 units and MUS 12 at a printed 1-4; the page does not say how many units MUS 12
        takes, and at 2 the record closes at the printed 21 and the degree at its printed 56-60. S721 held it because
        the kind was not on main.

HELD (2), each reason in HAND:
  08464  Liberal Arts (Multiple Subjects) A.A.: on no proved live run. Its committed record holds run 44090922437,
         and reread 44118718575 replaced its live row at run 44112314553 afterward; it carries no notes.
  45357  Cal-GETC certificate: a reread. It was read in two parts that left five blocks with no course beside their
         twins, so its arithmetic is incomplete on the read itself, and its notes say the section prints IGETC's
         older course list under the Cal-GETC heading.

    python3 kb/_program_piles_s739_gavilan.py --dry-run
    python3 kb/_program_piles_s739_gavilan.py --tag s739m

Guard: tests/program_piles_s739_gavilan_test.py.
"""
from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s721_paloverde as PV  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

NG, S = B.NG, B.S
COLLEGE = "Gavilan College"
SLUG = "gavilan"
TAG = "s739m"
HELD_BY = "kb/receipts/program_requirement_records_piles_s721_gavilan_2026-11-24_s721d.json"
KEYS = ("06128", "06132", "08460", "08464", "18541", "19378", "24369", "37896", "38787", "41394", "45357")
_TOP = ("a scorer reading that passes a sum at the top of a printed range passes it; a rescore drops the gap when it "
        "does")


def _figures(text: str) -> list[float] | None:
    nums = [float(x) for x in re.findall(r"\d+(?:\.\d+)?", text)]
    return [nums[0], nums[-1]] if nums else None


def printed_low(filed: dict) -> float | None:
    """The page's figures at their low end: each list at its printed figure (a list that prints none sits under
    another's figure and adds nothing; an option group counts once, at its least; a recommended list never counts),
    and the degree's general education where the record is checked against the degree's total."""
    rec = filed.get("record") or {}
    a = (filed.get("score") or {}).get("arithmetic") or {}
    lo, groups = 0.0, {}
    for b in rec.get("blocks") or []:
        st = S._span(b.get("stated"))
        if b.get("rule") == "recommended" or st is None:
            continue
        if b.get("option_group"):
            groups[b["option_group"]] = min(st[0], groups.get(b["option_group"], st[0]))
        else:
            lo += st[0]
    lo += sum(groups.values())
    if a.get("against") == "degree":
        ge = S._span((rec.get("program") or {}).get("ge_units"))
        if ge is None:
            return None
        lo += ge[0]
    return lo


def block_differs(filed: dict, e: dict) -> bool:
    """noted_figures_differ, where the two figures are one list's: the entry's note quotes the list's printed figure
    and what its courses carry (e["quotes"]); the list (e["block"], its place among the record's lists) prints that
    figure and its courses add to the other (with e["pair"], two alternatives the note says are taken together read
    as one); the two differ; and the page's figures at their low end (printed_low) are the stated total's low end,
    while the record's own low end is not: the record's sum and its stated total differ by that list."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = B.pair(a.get("computed")), B.pair(a.get("stated"))
    note = next((n for n in B.notes(filed) if e["words"] in n), "")
    q = e["quotes"]
    rec = B.apply_ops(filed, [("pair",) + tuple(e["pair"])]) if e.get("pair") else filed.get("record")
    bl = (rec or {}).get("blocks") or []
    if q["figure"] not in note or q["sum"] not in note or comp is None or st is None or e["block"] >= len(bl):
        return False
    fig = S._span(bl[e["block"]].get("stated"))
    adds = S.block_units_summed(bl[e["block"]], {}, S.measure(rec) == "hours")[0]
    low = printed_low(filed)
    if fig is None or adds is None or low is None:
        return False
    return B.same(fig, _figures(q["figure"])) and B.same(adds, _figures(q["sum"])) and not B.same(fig, adds) \
        and abs(low - st[0]) <= NG.FIG_EPS and abs(comp[0] - st[0]) > NG.FIG_EPS


def total_apart(filed: dict, e: dict) -> bool:
    """noted_figures_differ, where the printed total is not a sum of the course figures at all: the entry's note
    quotes the printed total, which the record states; a second note quotes the course figures (e["quotes"]), which
    are the record's own course rows, and they add to another figure at both ends."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = B.pair(a.get("computed")), B.pair(a.get("stated"))
    q = e["quotes"]
    first = next((n for n in B.notes(filed) if e["words"] in n), "")
    second = next((n for n in B.notes(filed) if e["also_words"] in n), "")
    rows = [c for b in (filed.get("record") or {}).get("blocks") or [] for c in b.get("courses") or []]
    printed = [x for c in rows for x in (S._num(c.get("units")), S._num(c.get("units_max"))) if x is not None]
    if q["stated"] not in first or q["courses"] not in second or comp is None or st is None:
        return False
    return B.same(st, _figures(q["stated"])) and printed == [float(x) for x in re.findall(r"\d+(?:\.\d+)?", q["courses"])] \
        and comp[0] > st[1] + NG.FIG_EPS


def variable_course(filed: dict, e: dict) -> bool:
    """figure_within_variable_units, where one figure is printed over the program's lists: the named course
    (e["variable"]) prints a range of units, and the printed total falls strictly inside the record's sum."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = B.pair(a.get("computed")), B.pair(a.get("stated"))
    rows = B.course_rows(filed, e["variable"])
    return len(rows) == 1 and PV._variable(rows[0]) and comp is not None and st is not None \
        and comp[0] + NG.FIG_EPS < st[0] and st[1] + NG.FIG_EPS < comp[1]


REVIEWED = {
    "08460": {"gap": "noted_figures_differ", "computed": [36, 36], "stated": [30, 36],
              "words": "The requirements block states 'Units: 30- 36', but the three listed courses total 36 units",
              "shape": ["note_quotes"], "quotes": {"stated": "Units: 30- 36", "computed": "total 36 units"},
              "lever": _TOP},
    "19378": {"gap": "noted_figures_differ", "computed": [24, 24], "stated": [14, 24],
              "words": "The printed total is 'Total: 14- 24', recorded as printed; the two blocks (14 + 10) sum to 24",
              "shape": ["note_quotes"], "quotes": {"stated": "Total: 14- 24", "computed": "sum to 24"},
              "lever": _TOP},
    "38787": {"gap": "noted_figures_differ", "computed": [53, 60], "stated": [48, 60],
              "words": "The Required Core prints 'Units: 42- 48', while the listed courses sum to 47-48 units",
              "also_words": "List C appears cut off: its last course is followed by a trailing 'or' with no further "
                            "course",
              "shape": ["block_differs"], "block": 0,
              "quotes": {"figure": "Units: 42- 48", "sum": "sum to 47-48 units"}},
    "41394": {"gap": "noted_figures_differ", "computed": [27, 27], "stated": [26, 27],
              "words": "STAT C1000 appears in place of closed-list MATH 5 (listed at 4 units, while the block range "
                       "3-4 suggests a 3-unit option existed)",
              "also_words": "total_units taken from 'Units Required for the Major: 26 - 27'",
              "shape": ["block_differs"], "block": 2,
              "quotes": {"figure": "block range 3-4", "sum": "listed at 4 units"}},
    "06132": {"gap": "noted_figures_differ", "computed": [93.5, 98.5], "stated": [119, 128],
              "words": "PREREQUISITES block prints 'Units: 46.5- 51.5', but its listed courses sum to 22-26 units",
              "also_words": "The BIO alternative is a pair: BIO 15 (5) or BIO 7 (4) and BIO 9 (5) together",
              "shape": ["block_differs"], "block": 0, "pair": ("BIO 15", ["BIO 7", "BIO 9"], 9),
              "quotes": {"figure": "Units: 46.5- 51.5", "sum": "sum to 22-26 units"}},
    "37896": {"gap": "noted_figures_differ", "computed": [65, 72], "stated": [64, 64],
              "words": "Core Major Courses prints 'Units: 22' but the listed courses sum to 23 units",
              "also_words": "'Total: 64' recorded as degree_total (major 22+3+3+10 = 38 plus 26 GE = 64)",
              "shape": ["block_differs"], "block": 0,
              "quotes": {"figure": "'Units: 22'", "sum": "sum to 23 units"}},
    "18541": {"gap": "noted_figures_differ", "computed": [65.5, 77.5], "stated": [57.5, 72.5],
              "words": "ADDITIONAL REQUIREMENTS courses sum to 15.5 units, but the catalog prints 13.5-14.5",
              "also_words": "The printed 'Units: 9- 19' applies to the whole BUSINESS CORE COURSES section",
              "shape": ["block_differs"], "block": 6,
              "quotes": {"figure": "prints 13.5-14.5", "sum": "sum to 15.5 units"}},
    "24369": {"gap": "noted_figures_differ", "computed": [7, 12], "stated": [0, 0],
              "words": "The catalog prints 'Total: 0', which is recorded as printed in total_units",
              "also_words": "The figures beside the courses (6 and 1-6) may be hours or another measure",
              "shape": ["total_apart"], "quotes": {"stated": "Total: 0", "courses": "(6 and 1-6)"}},
    "06128": {"gap": "figure_within_variable_units", "computed": [20, 23], "stated": [21, 21],
              "words": "MUS 12 is printed with a 1-4 unit range",
              "also_words": "'Units: 21' printed under Requirements is read as the major total covering all four "
                            "requirement groups (13 + 3 + 3 + 2 = 21 at minimum)",
              "ops": [("units", "MUS 12", 2)], "shape": ["variable_course"], "variable": "MUS 12",
              "courses": ["MUS12"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "08464": ("held: on no proved live run: its committed record holds run 44090922437, and reread 44118718575 "
              "replaced its live row at run 44112314553 afterward, so the committed record is not the live row's "
              "(on_live_run); it carries no notes. The committed record brought to its live row's read, then a "
              "reading"),
    "45357": ("held: a reread: it was read in two parts that left five blocks with no course beside their twins, so "
              "its arithmetic is incomplete on the read itself, and its own notes say the section prints IGETC's "
              "older course list under the Cal-GETC heading"),
})
SHAPES = {"block_differs": block_differs, "total_apart": total_apart, "variable_course": variable_course}

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Gavilan", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes=SHAPES)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
