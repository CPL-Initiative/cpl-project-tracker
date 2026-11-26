#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Gavilan: the 11 records s721d held, five collected with named gaps (kb/_program_piles_s739_gavilan.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the 11 keys are s721d's holds; 5 collected (no new kind), 6 held;
  * the live runs: the one-run load 38954687546 inserted every row at run 38948144064, the run its record holds;
    08464's record holds run 44090922437 and reread 44118718575 replaced its row at 44112314553 afterward, so it is
    on no proved live run and holds;
  * the within-range holds (d-lists-gap-holds-range-sums-s703; S739's reader on this plan's first round): 08460,
    19378, 38787 and 41394 each add to a sum inside the printed range, so noted_figures_differ names no gap on them:
    no entry, no gap on the record, and block_differs refuses such a record even with an entry that quotes its note;
    no row of the plan sits inside its printed range;
  * the three block_differs rows: the note quotes the list's printed figure and what its courses carry, the list
    prints the one and adds to the other, and the page's figures at their low end are the stated total's low end; a
    list whose courses add to its figure, a figure the note does not quote, and figures that do not add name no gap;
    06132's sum reads its BIO pair as one; the two-gap rows file both notes;
  * 24369: the note's course figures are the record's own rows, against the printed 0; another printed total names
    no gap;
  * 06128: MUS 12 prints a range, the printed 21 falls inside 20-23, and at 2 units the major and the degree close; a
    fixed-unit MUS 12 names no gap;
  * 45357 holds: five of its lists hold no course, and its arithmetic is incomplete.

Run from repo root: python3 tests/program_piles_s739_gavilan_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_gavilan as M  # noqa: E402

W = M.W
NG = B.NG
BLOCK = ("06132", "37896", "18541")
ROWS = {cn: "noted_figures_differ" for cn in ("24369",) + BLOCK}
ROWS["06128"] = "figure_within_variable_units"
RANGE = ["inside its printed range", "d-lists-gap-holds-range-sums-s703", "a units within-range kind"]
HELD = {"08460": RANGE + ["36-36 in 30-36"], "19378": RANGE + ["24-24 in 14-24"], "38787": RANGE + ["53-60 in 48-60"],
        "41394": RANGE + ["27-27 in 26-27"],
        "08464": ["44090922437", "44118718575", "on_live_run"], "45357": ["a reread", "two parts"]}
SCORES = {"noted_figures_differ": 40, "figure_within_variable_units": 60}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=16)
check = t.check

# The live runs.
posted = W.prior.posted_runs(skip=(W.tag,))
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_gavilan_38954687546.json"),
          encoding="utf-8") as fh:
    load = json.load(fh)
check(load["extracted_runs"] == ["38948144064"] and all(
    cn in [str(k) for k in load["inserted_keys"]] and posted[cn] == [(load["at"], "38948144064")]
    and str(W.load(cn)["extracted_run"]) == "38948144064" for cn in ROWS),
      "the one-run load 38954687546 inserted every row at run 38948144064, the run its record holds")
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_gavilan_44118718575.json"),
          encoding="utf-8") as fh:
    reread = json.load(fh)
f = W.load("08464")
check("08464" in [str(k) for k in reread["replaced_keys"]] and str(reread["extracted_run"]) == "44112314553"
      and max(posted["08464"]) == (reread["at"], "44112314553") and str(f["extracted_run"]) == "44090922437"
      and not W.on_live_run(f, skip=(W.tag,)) and not B.notes(f),
      "08464 holds run 44090922437, its row was replaced at 44112314553 afterward, and it carries no notes")
check(all(not W.shared_with(cn) for cn in M.KEYS), "each record was read from a page no other record was read from")

# A sum inside the printed range is no disagreement: the four hold.
check(set(M.WITHIN) == {"08460", "19378", "38787", "41394"}, "the four within-range records are pinned")
for cn, (comp, st) in M.WITHIN.items():
    f = W.load(cn)
    a = f["score"]["arithmetic"]
    check(B.same(a["computed"], comp) and B.same(a["stated"], st) and M.within(a["computed"], a["stated"])
          and st[0] < st[1], "%s: its sum %s sits inside its printed range %s" % (cn, comp, st))
    check(not f["score"].get("gaps") and not f["score"].get("confidence") and not B.S.passes_live(f["score"]),
          "%s: its record carries no gap and does not pass" % cn)
check(not any(M.within(W.load(cn)["score"]["arithmetic"]["computed"], W.load(cn)["score"]["arithmetic"]["stated"])
              for cn in ROWS), "no row of the plan adds to a sum inside its printed range")
check(M.within([27, 27], [26, 27]) and M.within([53, 60], [48, 60]) and not M.within([65, 72], [64, 64])
      and not M.within([65.5, 77.5], [57.5, 72.5]) and not M.within([29, 29], None),
      "within reads a sum inside a printed range, and neither a sum past an end nor a record with no total")
for cn, block, quotes, words in (
        ("38787", 0, {"figure": "Units: 42- 48", "sum": "sum to 47-48 units"},
         "The Required Core prints 'Units: 42- 48', while the listed courses sum to 47-48 units"),
        ("41394", 2, {"figure": "block range 3-4", "sum": "listed at 4 units"},
         "STAT C1000 appears in place of closed-list MATH 5 (listed at 4 units, while the block range 3-4 suggests a "
         "3-unit option existed)")):
    f = W.load(cn)
    e = {"gap": "noted_figures_differ", "words": words, "block": block, "quotes": quotes, "shape": ["block_differs"]}
    check(any(words in n for n in B.notes(f)) and not M.block_differs(f, e),
          "%s: block_differs refuses a sum inside the printed range, though its note quotes both figures" % cn)

# One list's printed figure against what its courses carry.
for cn in BLOCK:
    f, e = W.load(cn), M.REVIEWED[cn]
    a = f["score"]["arithmetic"]
    check(M.block_differs(f, e) and abs(M.printed_low(f) - a["stated"][0]) < 0.01,
          "%s: its list prints one figure and adds to another, and the page's figures add to the stated low end" % cn)
    g = copy.deepcopy(f)
    b = g["record"]["blocks"][e["block"]]
    adds = B.S.block_units_summed(b, {}, False)[0]
    b["stated"] = {"min": adds[0], "max": adds[1]}
    check(not W.kind_closes(g, e), "%s: a list whose courses add to its printed figure names no gap" % cn)
    check(not M.block_differs(f, dict(e, quotes=dict(e["quotes"], figure="Units: 99"))),
          "%s: a figure its note does not quote names no gap" % cn)
    g = copy.deepcopy(f)
    g["record"]["blocks"].append({"name": "one more list", "rule": "all", "stated": {"min": 3, "max": 3},
                                  "option_group": None, "courses": []})
    check(not W.kind_closes(g, e), "%s: figures that do not add to the stated total name no gap" % cn)
    check(e["also_words"] in f["score"]["gaps"][0]["words"] and e["words"] in f["score"]["gaps"][0]["words"],
          "%s: the gap files both notes" % cn)
f, e = W.load("06132"), M.REVIEWED["06132"]
check(not M.block_differs(f, {k: v for k, v in e.items() if k != "pair"}),
      "06132: the note's 22-26 reads BIO 7 and BIO 9 together; with the pair read apart the sum is another")
f = W.load("37896")
check(f["record"]["blocks"][3]["option_group"] == "track" and abs(M.printed_low(f) - 64) < 0.01,
      "37896: its five tracks count once, and 22+3+3+10 with general education's 26 is the printed 64")

# The printed total is no sum of the course figures.
f, e = W.load("24369"), M.REVIEWED["24369"]
check(M.total_apart(f, e) and f["award"] == "Noncredit program", "24369: a printed 0 over course figures of 6 and 1-6")
check(not M.total_apart(f, dict(e, quotes=dict(e["quotes"], stated="Total: 7")))
      and not M.total_apart(f, dict(e, quotes=dict(e["quotes"], courses="(6 and 2-6)"))),
      "24369: another printed total, or course figures the record does not hold, name no gap")

# One figure over lists that hold a variable-unit course.
f, e = W.load("06128"), M.REVIEWED["06128"]
now = B.C.fresh_score(dict(f, record=B.apply_ops(f, e["ops"])))["arithmetic"]
check(M.variable_course(f, e) and now["status"] == "equal" and now["degree"]["status"] == "equal",
      "06128: MUS 12 prints 1-4, the printed 21 is inside 20-23, and at 2 units the major and the degree close")
g = copy.deepcopy(f)
for c in B.course_rows(g, "MUS 12"):
    c["units_max"] = None
check(not W.kind_closes(g, e), "06128: a fixed-unit MUS 12 names no gap")

f = W.load("45357")
check(sum(1 for b in f["record"]["blocks"] if not b.get("courses")) == 5
      and f["score"]["arithmetic"]["status"] == "incomplete" and any("Read in 2 parts" in n for n in B.notes(f)),
      "45357: read in two parts, five of its lists hold no course, and its arithmetic is incomplete")

sys.exit(t.done())
