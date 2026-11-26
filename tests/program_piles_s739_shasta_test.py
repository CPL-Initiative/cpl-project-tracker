#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Shasta: the 15 records s727c held, 12 collected with named gaps (kb/_program_piles_s739_shasta.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the 15 keys are s727c's holds; 12 collected (no new kind), 3 held (18625 another program's section, 18655 not
    collectable, 32162 a sum inside its printed range that no kind names);
  * the four pooled emphases close at the heading's 18 with their two lists read as one, and at no other figure;
  * 09501: at the row's 3 units the major closes and the degree does not (its second note is filed);
  * 31845 is read against today's arithmetic: its major passes and the degree runs past the printed 60 by no more
    than the starred courses' units;
  * 34005: the degree total is the printed major, the three general education courses and the nested award's line;
  * 18144's live run is proved by its record file's one commit, the load's; without that history it holds;
  * the own-page guard: 43618's heading goes beyond its page-mate's title, and the mate does not own it; 18659 by
    its own note; 18087 by its list.

Run from repo root: python3 tests/program_piles_s739_shasta_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_shasta as M  # noqa: E402

W = M.W
POOLED = ("18080", "18098", "18143", "18144")
ROWS = {cn: "pool_figure_not_read" for cn in POOLED}
ROWS.update({"09501": "noted_figures_differ", "35606": "noted_figures_differ", "18087": "heading_not_in_text",
             "18659": "heading_not_in_text", "18626": "option_lists_read_apart", "43618": "noted_total_cut_off",
             "31845": "double_count_noted", "34005": "nested_award_not_read"})
HELD = {"18625": ["not the program's own", "Emphasis in Coastal Science Technician"],
        "18655": ["not collectable", "SOC C1000"],
        "32162": ["22-27", "a scorer reading, not a reread"]}
SCORES = {"pool_figure_not_read": 40, "noted_figures_differ": 40, "heading_not_in_text": 20,
          "option_lists_read_apart": 40, "noted_total_cut_off": 40, "double_count_noted": 40,
          "nested_award_not_read": 30}
OWN = {cn: "own_heading" for cn in ("09501", "18080", "18098", "18143", "18144", "18626", "31845", "35606", "43618")}
OWN.update({"18087": "own_list", "18659": "own_section", "34005": "own_section"})

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=61, own=OWN)
check = t.check

# The pooled emphases: one pool at 18 closes each, and a pool at 17 does not.
for cn in POOLED:
    f = W.load(cn)
    names = M.REVIEWED[cn]["ops"][0][1]
    check(B.closes(f, B.apply_ops(f, [("pool", names, 18)])) and not B.closes(f, B.apply_ops(f, [("pool", names, 17)])),
          "%s: its two lists as one pool close at the heading's 18 alone" % cn)
    check("reconcile" in M.REVIEWED[cn]["lever"], "%s: its cheaper lever is named" % cn)

# 09501: the major closes at the row's 3; the whole record does not (the degree's double counting).
f = W.load("09501")
rec = B.apply_ops(f, M.REVIEWED["09501"]["ops"])
check(B.closes(f, rec, major=True) and not B.closes(f, rec), "09501: the reading closes the major, not the degree")
check(not B.closes(f, B.apply_ops(f, [("alt_units", "AGEH 48", "AGEH 94", 2)]), major=True),
      "09501: at 2 units the major does not close")

# 31845: read against today's arithmetic.
f = W.load("31845")
now = B.arithmetic(f)
check(now.get("against") == "degree" and now["major"]["pass"] and now["major"].get("short_high") is True,
      "31845: today's scorer passes the major (short_high) and reads the degree")
check(f["score"]["arithmetic"].get("computed") == [37.0, 37.0], "31845: the filed arithmetic stays as filed")
check(M.REVIEWED["31845"].get("today") is True and B.same(now["computed"], [65, 67]) and B.same(now["stated"], [60, 60]),
      "31845: its entry pins today's figures")

# 34005: the nested award's line.
f = W.load("34005")
e = M.REVIEWED["34005"]
check(M.nested_line(f, e) and not M.nested_line(f, dict(e, award_line=[66, 71]))
      and not M.nested_line(f, dict(e, outside_major=["HIMS 408", "ENGL 401"])),
      "34005: 45 + 9 + the 66-72 line is the printed 120-126, and nothing else is")

# 18144: its live run is the file history's proof.
f = W.load("18144")
check(W.history_live(f) and not W.prior.posted_runs(skip=(W.tag,)).get("18144"),
      "18144: no receipt names its run; its file's one commit is the load's")
saved = W.file_history
W.file_history = {}
check(not W.on_live_run(f, skip=(W.tag,)), "18144: without the file history its run is not proved")
W.file_history = saved

# The own-page guard.
check(W.own(W.load("30580"), M.REVIEWED["43618"]) is None, "30580 does not own the Communication Studies 2.0 section")
g = copy.deepcopy(W.load("18659"))
g["record"]["notes"] = [n for n in g["record"]["notes"] if "were not read" not in n]
check(W.own(g, M.REVIEWED["18659"]) is None, "18659: without its own note its section is not shown its own")
check(W.own(W.load("18625"), {"gap": "heading_not_in_text", "own_list": True}) is None,
      "18625: its list does not show it its own (5 of 16 placed)")
# 18655 as s739b read it: not collectable (SOC C1000 printed for SOCI C1000). S740 filed that pair as a cited course
# renumber and reconcile 45841957622 rescored the record with it read, so either state holds here: not collectable,
# or collectable at that run with its arithmetic still failing; and no entry of this plan names a gap for it.
f18655 = W.load("18655")
check(not B.NG.collectable(f18655["score"])
      or (str(f18655["extracted_run"]) == "45841957622" and not f18655["score"]["arithmetic"].get("pass")),
      "18655 is not collectable, or S740's reconcile made it collectable with its arithmetic still failing")
check("18655" not in M.REVIEWED and W.gap_noted(f18655) is None, "18655: no entry of this plan names a gap for it")

sys.exit(t.done())
