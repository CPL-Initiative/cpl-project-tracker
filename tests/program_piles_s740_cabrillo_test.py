#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Cabrillo: the 13 records s720b held, seven collected with named gaps (kb/_program_piles_s740_cabrillo.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own;
and a named gap must be true of its record. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the 13 keys are s720b's holds; 7 collected (no new kind), 6 held;
  * the three catalog_figures_differ rows meet the kind's own check (NG.figures_differ_fails): each list matches its
    printed figure and the lists sum past the printed total at both ends; a list that does not match its figure, or
    a sum that meets the total, names no gap;
  * the four rows whose reading closes the record: with the one change its note names, today's scorer gives the
    printed total at both ends; one repeat short, the unit line one unit off, or one ensemble list left at 0 does
    not close it;
  * 06349 files both notes (two gaps on one row, the lower score filed);
  * the holds: the four 'Recommended' records hold only lists read as counting nothing; 45306's lists add to 14-18
    around the printed 16; 11293 is on no proved live run;
  * each record was read from a page no other record was read from.

Run from repo root: python3 tests/program_piles_s740_cabrillo_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s740_cabrillo as M  # noqa: E402

W = M.W
B, NG = B7.B, B7.NG
FIGURES = ("06328", "06341", "06385")
ROWS = {cn: "catalog_figures_differ" for cn in FIGURES}
ROWS.update({"41186": "unit_line_not_read", "06349": "pool_figure_not_read", "32291": "noted_figures_differ",
             "43556": "repeat_read_once"})
REC = ["Recommended", "counting nothing", "a reconcile wording rule"]
HELD = {"06352": REC, "06380": REC, "06381": REC, "44992": REC,
        "11293": ["44112287720", "44090886950", "on_live_run"], "45306": ["14-18", "the printed 16", "a reread"]}
SCORES = {"catalog_figures_differ": 50, "unit_line_not_read": 40, "pool_figure_not_read": 40,
          "noted_figures_differ": 40, "repeat_read_once": 60}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=22)
check = t.check


def bare(cn):
    f = copy.deepcopy(W.load(cn))
    f["score"].pop("gaps", None)
    f["score"].pop("confidence", None)
    return f


check(isinstance(W, B7.Pile) and all(not W.shared_with(cn) for cn in M.KEYS),
      "the plan runs on S740's shared code, and each record was read from a page no other record was read from")

# The catalog's own figures.
for cn in FIGURES:
    f, e = bare(cn), M.REVIEWED[cn]
    a = f["score"]["arithmetic"]
    check(NG.figures_differ_fails(f) is None and M.figures_differ(f, e) and a["against"] == "degree"
          and a["computed"][0] > a["stated"][0] and a["computed"][1] > a["stated"][1],
          "%s: each list matches its printed figure, and the lists sum past the printed degree total" % cn)
    g = copy.deepcopy(f)
    b = next(x for x in g["record"]["blocks"] if x.get("rule") == "all")
    b["stated"] = {"min": b["stated"]["min"] + 1, "max": b["stated"]["max"] + 1}
    check(NG.figures_differ_fails(g) is not None and not W.kind_closes(g, e),
          "%s: a list that does not match its printed figure names no gap" % cn)
    g = copy.deepcopy(f)
    g["score"]["arithmetic"]["computed"] = list(g["score"]["arithmetic"]["stated"])
    check(not W.kind_closes(g, e), "%s: a sum that meets the printed total names no gap" % cn)
    check(not M.figures_differ(f, dict(e, gap="noted_figures_differ")), "%s: the check is this kind's alone" % cn)
f = bare("06328")
check([B.pair(b["stated"]) for b in f["record"]["blocks"]] == [[15.0, 15.0]] * 3
      and all(b.get("option_group") is None for b in f["record"]["blocks"]),
      "06328: three lists of 15, none printed as an alternative of another")

# The readings that close a record.
for cn, short in (("41186", [("line", 2)]),
                  ("06349", [("stated", M._VOCAL, 4), ("stated", M._INSTRUMENTAL, 4), ("repeat", "MUS16", 3)]),
                  ("06349", [("stated", M._VOCAL, 4), ("repeat", "MUS16", 4)]),
                  ("32291", [("units", "MUS16", 2)]),
                  ("43556", [("repeat", "MUS40", 2), ("repeat", "MUS68", 2)]),
                  ("43556", [("repeat", "MUS68", 3)])):
    f, e = bare(cn), M.REVIEWED[cn]
    check(B.closes(f, B.apply_ops(f, e["ops"])), "%s: its reading closes the record at the printed total" % cn)
    check(not B.closes(f, B.apply_ops(f, short)), "%s: a reading one step short does not close it: %s" % (cn, short))
f = W.load("06349")
words = f["score"]["gaps"][0]["words"]
check(M.REVIEWED["06349"]["words"] in words and M.REVIEWED["06349"]["also_words"] in words
      and NG.ARITH_SCORE["pool_figure_not_read"] < NG.ARITH_SCORE["repeat_read_once"],
      "06349: two gaps on one row, the lower score filed with both notes")
f = bare("32291")
check(B.course_rows(f, "MUS16")[0]["units"] == 0.5
      and any(B.pair(b.get("stated")) == [4.0, 4.0] and [c["code"] for c in b["courses"]] == ["MUS16"]
              for b in f["record"]["blocks"]),
      "32291: a list prints 4 over MUS16 at 0.5 units")
f = bare("43556")
check(all(B.course_rows(f, c)[0]["units"] == 1 for c in ("MUS40", "MUS68", "MUS68CP")),
      "43556: MUS40, MUS68 and MUS68CP are each counted once, at 1 unit")

# The holds.
for cn in ("06352", "06380", "06381", "44992"):
    f = W.load(cn)
    # S742's reconcile step (recommended_counts) reads these lists as units to choose at their printed figures:
    # every list recommended as s740d left the record, or none of them once that reconcile files it.
    check(f["record"]["blocks"] and len({b.get("rule") == "recommended" for b in f["record"]["blocks"]}) == 1,
          "%s: every list is read as recommended, counting nothing, or a later reconcile counts them all" % cn)
    check(not f["score"].get("gaps") and W.gap_noted(f) is None, "%s: it carries no gap and no entry names one" % cn)
f = W.load("45306")
a = f["score"]["arithmetic"]
# S742's plan s742a files 45306 as lists_not_closed (its Electives figure depends on the other list's): it carries no
# gap as s740d left it, or that kind alone.
check(B.same(a["computed"], [14, 18]) and B.same(a["stated"], [16, 16])
      and [x["gap"] for x in f["score"].get("gaps") or []] in ([], ["lists_not_closed"])
      and NG.units_within_printed_range(f) is None and NG.figures_differ_fails(f) is not None,
      "45306: its lists add to 14-18 around the printed 16, and neither figures kind is true of it")
f = W.load("11293")
check(not W.on_live_run(f) and not f["score"].get("gaps"), "11293: on no proved live run, and it carries no gap")

sys.exit(t.done())
