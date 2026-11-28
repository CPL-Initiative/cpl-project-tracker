#!/usr/bin/env python3
"""S748, lane 1 (readers) at El Camino: the Architecture certificate 19857, collected with its gap named (kb/_program_piles_s748_elcamino.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with its
gap named. S741 and S742 held 19857 by key: its record reads its own page exactly, the page's units add to 33 under
'Total Units: 36', and S741 knew no kind for a list whose printed figure runs past its courses. S742 filed that same
shape at the Photography certificate 19883 as total_differs. total_differs is filed only from a page a session read
(kb/program_total_differs.json); 19857's page was read alone, as the capture reads it, by college-page-read run
46119948370. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the key: 19857 is a hold of s742r2's receipt, and the one row of this plan, under total_differs (score 50);
  * its entry in the file names the page read, that read's plan file and the record's own page, and the record
    holds exactly the two figures the file lists; a sum or a total one unit off names no gap, and a record the file
    does not list never takes it;
  * the record: 'Required Core' prints 30 over nine courses that carry 1, 3, 3, 3, 3, 3, 3, 4 and 4, 27 in all;
    with '6 units from:' the page's units add to 33 under 'Total Units: 36';
  * the eight courses the state's file does not list are the catalog's additions (the scorer's invented check
    passes), and coverage passes: the arithmetic alone fails the record;
  * it was read from its own page (poid 3524), which no other record was read from, by run 44480396671, and it is
    live on that run (the conductor's committed live reads of 2026-11-27);
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s748_elcamino_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402
import _program_piles_s748_elcamino as M  # noqa: E402

W = M.W
B, NG = B9.B, B9.NG
ROOT = T.ROOT
PLAN = "s748_readers_el_camino_architecture.json"
CN = "19857"

with open(os.path.join(ROOT, M.HELD_BY), encoding="utf-8") as fh:
    s742r2 = {str(h["control_number"]) for h in json.load(fh)["held"]}
t = T.run(W, rows={CN: "total_differs"}, held={}, scores={"total_differs": 50}, day="2026-11-28", boundaries=2,
          prior_held=s742r2)
check = t.check
check(s742r2 == {CN} and M.KEYS == (CN,), "19857 is the one hold of s742r2's receipt, and the one key of this plan")

with open(os.path.join(ROOT, "kb", "program_total_differs.json"), encoding="utf-8") as fh:
    listed = json.load(fh)["colleges"][M.COLLEGE]
check(sorted(listed) == ["19857", "19883", "31319", "38948", "42541"],
      "the file lists El Camino's five programs and no other")
f, e, x = W.load(CN), M.REVIEWED[CN], listed[CN]
with open(os.path.join(ROOT, "kb", "college_reads", PLAN), encoding="utf-8") as fh:
    urls = [p["url"] for p in json.load(fh)["pages"]]
words = f["score"]["gaps"][0]["words"]
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
a = bare["score"]["arithmetic"]
check(x["run"] == M.PAGE_READ and M.PAGE_READ in x["evidence"] and PLAN in x["evidence"]
      and urls == [f["source_url"]] and f["source_url"] in x["where"],
      "the file's entry names the page read, its plan and the record's own page, the one page that read loads")
check(B.same(a["computed"], x["printed_sum"]) and B.same(a["stated"], x["printed_total"])
      and B.same(e["computed"], x["printed_sum"]) and B.same(e["stated"], x["printed_total"]),
      "the record holds the two figures the file lists")
check(NG.answer(bare) is not None and NG.answer(bare)[0] == "total_differs" and NG.total_differs(bare) == words
      and W.gap_noted(bare) == ("total_differs", words) and M.PAGE_READ in words,
      "the record rule names total_differs, and the gap files the rule's own words")
g = copy.deepcopy(bare)
g["score"]["arithmetic"]["computed"] = [a["computed"][0] + 1, a["computed"][1] + 1]
check(NG.total_differs(g) is None, "a sum one unit off the file's figure names no gap")
g = copy.deepcopy(bare)
g["score"]["arithmetic"]["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1]
check(NG.total_differs(g) is None, "a total one unit off the file's figure names no gap")
check(NG.total_differs(bare, {}) is None, "a record the file does not list never takes the gap")
check(not W.shared_with(CN), "no other record was read from its page")

core, pick = f["record"]["blocks"]
check(core["name"] == "Required Core" and core["rule"] == "all" and B.same(core["stated"], [30, 30])
      and [c["units"] for c in core["courses"]] == [1, 3, 3, 3, 3, 3, 3, 4, 4] and "poid=3524" in f["source_url"],
      "'Required Core' prints 30 over nine courses that carry 1, 3, 3, 3, 3, 3, 3, 4 and 4, 27 in all")
check(pick["rule"] == "choose_units" and pick["minimum"] == 6 and B.same(pick["stated"], [6, 6])
      and B.same(a["computed"], [27 + 6, 27 + 6]) and B.same(a["stated"], [36, 36])
      and B.same(f["record"]["program"]["total_units"], [36, 36]),
      "with '6 units from:' the page's units add to 33 under 'Total Units: 36'")
sc = f["score"]
check(sc["coverage"]["pass"] and sc["invented"]["pass"] and sc["invented"]["count"] == 8
      and all(k == "arithmetic" or v.get("pass", True) for k, v in sc.items() if isinstance(v, dict)
              and k not in ("degree", "confidence")),
      "coverage passes and the eight courses the state does not list are the catalog's additions: the arithmetic "
      "alone fails the record")
check(str(f["extracted_run"]) == M.RUN and W.on_live_run(f),
      "read by run %s, and live on that run by the conductor's committed live reads" % M.RUN)

sys.exit(t.done())
