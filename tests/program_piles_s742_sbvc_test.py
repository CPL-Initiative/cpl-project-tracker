#!/usr/bin/env python3
"""S742, lane 1 (keys) at San Bernardino Valley: two of s741k3's holds collected under lists_not_closed, two held (kb/_program_piles_s742_sbvc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the
gap named, and the gap must be true of its record. Audio Production A.A. 04873 and Nutrition and Dietetics A.S.-T
39483 each hold a choice list that prints no unit figure of its own, so their lists alone cannot add the program's
units: lists_not_closed's sentence. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the four keys are holds of s741k3's receipt; two are collected under lists_not_closed (score 30), two held;
  * 04873: 'Two courses from the following:' holds one course and 'Four courses from the following:' holds two, each
    course with its units and neither list with a figure; the scorer's own reasons name both lists; a short list
    filled to its count, or one that prints a figure, no longer shows the shape;
  * 39483: List A's heading prints 'One to two courses' and no figure, the record keeps the count at one, and the two
    biology sequences sit in one option group with no units beside their courses; read as the page prints it (one
    course or two of List A, a sequence among them) the lists run across the printed 27-30 without adding to it;
  * nothing else is wrong with either record: every listed course is placed or explained, none is invented, its
    page is its own, and no record rule names another kind for it;
  * the words filed are the record's own note; with the note gone the entry names nothing; each entry carries its
    page's words from the page read;
  * the holds: 17829 waits on the reread of this session's reconcile, 04894 on reconcile steps (the scorer change
    was measured and is not proposed);
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s742_sbvc_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s742_sbvc as M  # noqa: E402

W = M.W
B, NG, S = B7.B, B7.NG, B7.S
KIND = "lists_not_closed"
ROWS = {"04873": KIND, "39483": KIND}
HELD = {"17829": ["the reread", "ge_units_not_read"], "04894": ["no gap is true of the page", "22 pass to"]}

t = T.run(W, rows=ROWS, held=HELD, scores={KIND: 30}, day="2026-11-27", boundaries=8)
check = t.check

check(isinstance(W, B7.Pile) and W.receipt_path("2026-11-27").endswith(
    "piles_s740_san_bernardino_valley_2026-11-27_s742k2.json"), "the plan is s742k2, on S740's shared code")
check(all(not W.shared_with(cn) for cn in ROWS), "each row was read from a page no other record was read from")
for cn in ROWS:
    f, e = W.load(cn), M.REVIEWED[cn]
    a = f["score"]["arithmetic"]
    check(B.same(a["computed"], e["computed"]) and B.same(a["stated"], e["stated"]) and not a["pass"],
          "%s: the filed figures are the entry's, and the arithmetic fails" % cn)
    cov, inv = f["score"]["coverage"], f["score"]["invented"]
    check(cov["pass"] and not cov["unexplained"] and inv["pass"] and f["score"]["repeated"]["pass"],
          "%s: every listed course is placed or explained, none is invented and none repeats" % cn)
    gaps = f["score"]["gaps"]
    check(len(gaps) == 1 and gaps[0]["gap"] == KIND and e["words"] in gaps[0]["words"]
          and f["score"]["confidence"]["unit_arithmetic"] == 30,
          "%s: the gap files the record's own note, at unit arithmetic 30" % cn)
    bare = copy.deepcopy(f)
    bare["score"].pop("gaps")
    bare["score"].pop("confidence")
    check(W.gap_noted(bare) == (KIND, gaps[0]["words"]), "%s: the entry stands on the record as it was filed" % cn)
    g = copy.deepcopy(bare)
    g["record"]["notes"] = [x for x in B.notes(g) if e["words"] not in x]
    check(W.gap_noted(g) is None, "%s: with the note gone the entry names nothing" % cn)
    check(NG.answer(bare) is None, "%s: no record rule names a kind for it" % cn)
    check("45835049303" in e["page"] and "from the following:" in e["page"], "%s: its entry carries its page's words" % cn)

# 04873: the two short lists.
f, e = W.load("04873"), M.REVIEWED["04873"]
by = {b["name"]: b for b in f["record"]["blocks"]}
two, four = by["Two courses from the following:"], by["Four courses from the following:"]
check([two["minimum"], len(two["courses"])] == [2, 1] and [four["minimum"], len(four["courses"])] == [4, 2]
      and all(c["units"] == 3 for c in two["courses"] + four["courses"])
      and two["stated"] == four["stated"] == {"min": None, "max": None},
      "04873: 'Two courses' holds one course and 'Four courses' two, each at 3 units, neither list with a figure")
why = f["score"]["arithmetic"]["why"]
check(f["score"]["arithmetic"]["status"] == "incomplete" and len(why) == 2
      and "chooses 2 courses but 1 carry units" in why[0] and "chooses 4 courses but 2 carry units" in why[1],
      "04873: the scorer's own reasons name both short lists")
check(M.short_lists(f, e), "04873: the shape stands")
g = copy.deepcopy(f)
g["record"]["blocks"][1]["courses"].append(dict(two["courses"][0], code="FTVM 113"))
check(not M.short_lists(g, e), "04873: a list that holds what it asks for is not short")
g = copy.deepcopy(f)
g["record"]["blocks"][2]["stated"] = {"min": 12, "max": 12}
check(not M.short_lists(g, e), "04873: a list that prints its own figure is another gap")
g = copy.deepcopy(f)
g["record"]["blocks"][1]["courses"][0]["units"] = None
check(not M.short_lists(g, e), "04873: a course with no units is a missing figure, not a short list")
check(12 + 3 + 6 + 3 + 3 == 27 and 27 > f["score"]["arithmetic"]["stated"][1],
      "04873: even with every printed course taken the lists pass the printed 24-25 (27), and the counts ask more")

# 39483: List A's count range, the sequences inside it.
f, e = W.load("39483"), M.REVIEWED["39483"]
by = {b["name"]: b for b in f["record"]["blocks"]}
la = by[M._LIST_A]
seqs = [by[n] for n in e["inside"]]
check(la["rule"] == "choose_courses" and la["minimum"] == 1 and la["stated"] == {"min": None, "max": None}
      and [c["units"] for c in la["courses"]] == [5, 5, 4],
      "39483: List A prints 'One to two courses' over rows of 5, 5 and 4 and no figure; the record keeps one course")
check(len(seqs) == 2 and {b["option_group"] for b in seqs} == {"Biology sequence"}
      and all(c["units"] is None for b in seqs for c in b["courses"]) and all(len(b["courses"]) == 2 for b in seqs),
      "39483: the two biology sequences are one option group, with no units beside their courses")
check(M.count_range(f, e), "39483: the shape stands")
g = copy.deepcopy(f)
[b for b in g["record"]["blocks"] if b["name"] == M._LIST_A][0]["stated"] = {"min": 4, "max": 10}
check(not M.count_range(g, e), "39483: a List A that prints its own figure is another gap")
g = copy.deepcopy(f)
[b for b in g["record"]["blocks"] if b["name"] == M._LIST_A][0]["name"] = "List A - One course from the following:"
check(not M.count_range(dict(g), dict(e, open="List A - One course from the following:")),
      "39483: a heading that prints one count is no range")
g = copy.deepcopy(f)
for b in g["record"]["blocks"]:
    if b["name"] in e["inside"]:
        for c in b["courses"]:
            c["units"] = 4
check(not M.count_range(g, e), "39483: sequences that print their units can be added")
req = sum(c["units"] for c in by["Required Courses:"]["courses"])
lb = sorted(c["units"] for c in by["List B - One course from the following:"]["courses"])
check(req == 16 and (lb[0], lb[-1]) == (3, 5) and req + 4 + lb[0] == 23 and req + 10 + lb[-1] == 31
      and 23 < 27 and 31 > 30,
      "39483: with List A at one course (4) to two (10) the lists run from 23 to 31, across the printed 27-30")

# The holds.
for cn in HELD:
    f = W.load(cn)
    check(W.gap_noted(f) is None and cn not in M.REVIEWED, "%s: no entry, and nothing is filed on it" % cn)
f = W.load("04894")
check(B.scorer_passes(f), "04894: today's scorer passes the record with no state list")

sys.exit(t.done())
