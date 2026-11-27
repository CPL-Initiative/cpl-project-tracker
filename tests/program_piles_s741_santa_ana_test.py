#!/usr/bin/env python3
"""S741, lane 1 (keys) at Santa Ana: the two records s740r2 held for the units within-range kind, filed by key (kb/_program_piles_s741_santa_ana.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named, and the gap must be true of its record. units_within_printed_range files only by a
reviewed key list (f-units-within-range-by-key-only-s740): on 28 held answers the figures alone were right on 6 and
wrong on 22. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the two keys are holds of s740r2's receipt; both are collected under the kind (score 50), none held;
  * each row's sum sits inside its printed range with its low end above the range's, on the record's filed figures;
  * nothing else is wrong with either record: every listed course is placed, no course is invented, its page is its
    own (no other record was read from it), and no record rule names another kind for it;
  * 31859: List A's two printed rows carry 7-7.5 under the printed 6-7.5, and the other lists add to their printed
    figures, so the half unit to one unit above the range's low end is List A's alone;
  * 21789: the groups as the page prints them (2, 20, 0.5-1, 0.5-1, 1.5-5) add to the record's 24.5-29;
  * the words filed are the kind's own, from the figures, with the record's note; with the note gone the entry names
    nothing;
  * each entry carries its page's words, from the page read;
  * the kind's reviewed lists (kb/_program_piles_s740.py) name this plan's module and both keys;
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s741_santa_ana_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s741_santa_ana as M  # noqa: E402

W = M.W
B, NG, S = B7.B, B7.NG, B7.S
ROWS = {cn: B7.WITHIN for cn in ("21789", "31859")}
FIGURES = {"31859": ("19-19.5", "18-19.5"), "21789": ("24.5-29", "24-30")}

t = T.run(W, rows=ROWS, held={}, scores={B7.WITHIN: 50}, day="2026-11-27", boundaries=12)
check = t.check

check(isinstance(W, B7.Pile) and W.receipt_path("2026-11-27").endswith("piles_s740_santa_ana_2026-11-27_s741k1.json"),
      "the plan is s741k1, on S740's shared code")
check(all(not W.shared_with(cn) for cn in M.KEYS), "each record was read from a page no other record was read from")
for cn, (comp, st) in FIGURES.items():
    f, e = W.load(cn), M.REVIEWED[cn]
    a = f["score"]["arithmetic"]
    check(B.same(a["computed"], e["computed"]) and B.same(a["stated"], e["stated"])
          and e["stated"][0] < e["computed"][0] and e["computed"][1] <= e["stated"][1],
          "%s: its sum sits inside its printed range, above the range's low end" % cn)
    cov, inv = f["score"]["coverage"], f["score"]["invented"]
    check(cov["pass"] and cov["placed"] == cov["listed"] and not cov["missing"] and inv["pass"]
          and f["score"]["repeated"]["pass"],
          "%s: every listed course is placed, none is invented and none repeats" % cn)
    words = f["score"]["gaps"][0]["words"]
    check(f["score"]["gaps"][0]["gap"] == B7.WITHIN and len(f["score"]["gaps"]) == 1
          and words.startswith("the courses' units add to %s, within the printed %s units | " % (comp, st))
          and e["words"] in words,
          "%s: the gap files the kind's own words, from its figures, and the record's note" % cn)
    bare = copy.deepcopy(f)
    bare["score"].pop("gaps")
    bare["score"].pop("confidence")
    check(W.gap_noted(bare) == (B7.WITHIN, words), "%s: the entry stands on the record as it was filed" % cn)
    g = copy.deepcopy(bare)
    g["record"]["notes"] = [x for x in B.notes(g) if e["words"] not in x]
    check(W.gap_noted(g) is None, "%s: with the note gone the entry names nothing" % cn)
    check(NG.answer(bare) is None, "%s: no record rule names a kind for it" % cn)
    check("Program Control Number: %s" % cn in e["page"] and "Total : " in e["page"],
          "%s: its entry carries its own page's words" % cn)
check(M.PAGE_READ == "45835379921", "the page words are college page read 45835379921's")


def stated(b):
    return B.pair(b.get("stated"))


# 31859: the lists but List A add to their printed figures; List A's rows carry 7-7.5 under the printed 6-7.5.
f = W.load("31859")
by = {b["name"]: b for b in f["record"]["blocks"]}
core, la, lb = by["Required Core: Select 9 units"], by["List A (select 2)"], by["List B (select one)"]
check(core["rule"] == "choose_units" and core["minimum"] == 9 and stated(core) == [9.0, 9.0]
      and lb["minimum"] == 1 and stated(lb) == [3.0, 3.0]
      and all(c["units"] == 3 for c in core["courses"] + lb["courses"]),
      "31859: the core and List B add to their printed 9 and 3")
rows = sorted((c["units"], max([c["units"]] + [x["units"] for x in c.get("alternatives") or []]))
              for c in la["courses"])
check(la["rule"] == "choose_courses" and la["minimum"] == 2 and stated(la) == [6.0, 7.5] and rows == [(3, 3), (4, 4.5)],
      "31859: List A prints 6-7.5 over two rows that carry 3 and 4-4.5, so the record adds 7-7.5 for it")
check(9 + 7 + 3 == f["score"]["arithmetic"]["computed"][0] and 9 + 7.5 + 3 == f["score"]["arithmetic"]["computed"][1]
      and 9 + 6 + 3 == f["score"]["arithmetic"]["stated"][0],
      "31859: with List A at its printed 6 the lists add to the printed 18; as read they add to 19-19.5")

# 21789: the page's own group figures add to the record's sum.
f = W.load("21789")
by = {b["name"]: b for b in f["record"]["blocks"]}
req = by["Required Courses"]["courses"]
check(sorted(c["units"] for c in req) == [2, 2, 2, 3.5, 3.5, 4.5, 4.5] and sum(c["units"] for c in req) == 22,
      "21789: the seven required courses carry the printed 2.0 and the group printed 20.0")
labs = [b for n, b in by.items() if n.startswith("Skills Lab")]
ext = by["Externship"]
check(len(labs) == 2 and all(stated(b) == [0.5, 1.0] and b["minimum"] == 1 for b in labs) and stated(ext) == [1.5, 5.0]
      and sum(c["units"] for c in ext["courses"]) == 1.5 and sum(c["units_max"] for c in ext["courses"]) == 5.0
      and by["Recommended electives"]["rule"] == "recommended",
      "21789: the two lab choices print 0.5-1.0 each and the externship 1.5-5.0, as the record holds them")
a = f["score"]["arithmetic"]
check([22 + 0.5 + 0.5 + 1.5, 22 + 1 + 1 + 5] == a["computed"] and a["stated"] == [24.0, 30.0]
      and a["stated"][0] < a["computed"][0] and a["computed"][1] < a["stated"][1],
      "21789: the printed groups add to 24.5-29, inside the printed 24-30 and matching neither end")

# The kind's reviewed lists name this plan.
check("_program_piles_s741_santa_ana" in B7.PLAN_MODULES
      and all(B7.WITHIN_HELD.get((M.COLLEGE, cn), (None,))[0] == B7.WITHIN for cn in M.KEYS),
      "the kind's reviewed lists name this plan's module and both keys")

sys.exit(t.done())
