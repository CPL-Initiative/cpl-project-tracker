#!/usr/bin/env python3
"""S742, lane 1 (readers) at El Camino: two certificates read from their own pages tonight, each collected with a named gap (kb/_program_piles_s742_elcamino.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with its
gap named. Paid read 46007782666 read Photography 19883 and Entrepreneurial Studies 38948 from their own pages (the
site_pages pins the Acalog road reads since S742), and each page's own figures disagree. total_differs is filed
only from a page a session read (kb/program_total_differs.json). The shared checks are
tests/program_piles_s739_common.py's. Pinned here:

  * the keys: 19857 and 19883 are holds of s741c's receipt; 38948 had no plan, since its record placed none of its
    courses until tonight's read; two rows are collected under total_differs (score 50), 19857 is held;
  * each row's entry in the file names its page read, that read's plan file and the record's own page, and the
    record holds exactly the two figures the file lists; a sum or a total one unit off names no gap, and a record
    the file does not list never takes it;
  * 19883: the core's five rows carry the units the page prints, 16 in all, under a heading that prints 17-18; with
    the '9 units from:' list the page's units add to 25 under 'Total Units: 26-27';
  * 38948: the core's seven courses add to 19, and the two lists printed '3-4 units from:' bring the page's own
    figures to 25-27 under 'Total Units: 19-20';
  * both records come from paid read 46007782666, each from a page no other record was read from, and each is live
    on that run (the load's and the reread's committed receipts);
  * 19857 keeps S741's reason, carries no gap and is in no file;
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s742_elcamino_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402
import _program_piles_s742_elcamino as M  # noqa: E402

W = M.W
B, NG = B8.B, B8.NG
ROOT = T.ROOT
HELD = {"19857": ["Required Core: 30 units", "add to 27", "poid 3523"]}
PLANS = {"19883": "s742_readers_el_camino_photography.json", "38948": "el_camino_certificate_pages_s739.json"}

# s741c's receipt held 19857 and 19883; 38948 had no plan (its record placed none until read 46007782666).
with open(os.path.join(ROOT, M.HELD_BY), encoding="utf-8") as fh:
    s741c = {str(h["control_number"]) for h in json.load(fh)["held"]}
t = T.run(W, rows={"19883": "total_differs", "38948": "total_differs"}, held=HELD, scores={"total_differs": 50},
          day="2026-11-27", boundaries=4, prior_held=s741c | {"38948"})
check = t.check
check({"19857", "19883"} <= s741c and "38948" not in s741c,
      "19857 and 19883 are holds of s741c's receipt; 38948 is new to a plan")

with open(os.path.join(ROOT, "kb", "program_total_differs.json"), encoding="utf-8") as fh:
    listed = json.load(fh)["colleges"][M.COLLEGE]
# S748 (plan s748r1) lists 19857 too, from a read of its page alone (46119948370). Read in either state.
check(sorted(set(listed) - {"19857"}) == ["19883", "31319", "38948", "42541"],
      "the file lists El Camino's four programs, and since S748 19857, and no other")
for cn in ("19883", "38948"):
    f, e, x = W.load(cn), M.REVIEWED[cn], listed[cn]
    with open(os.path.join(ROOT, "kb", "college_reads", PLANS[cn]), encoding="utf-8") as fh:
        urls = [p["url"] for p in json.load(fh)["pages"]]
    words = f["score"]["gaps"][0]["words"]
    bare = copy.deepcopy(f)
    bare["score"].pop("gaps")
    bare["score"].pop("confidence")
    a = bare["score"]["arithmetic"]
    check(x["run"] == M.PAGE_READS[cn] and M.PAGE_READS[cn] in x["evidence"] and PLANS[cn] in x["evidence"]
          and f["source_url"] in urls and f["source_url"] in x["where"],
          "%s: the file's entry names the page read, its plan and the record's own page" % cn)
    check(B.same(a["computed"], x["printed_sum"]) and B.same(a["stated"], x["printed_total"])
          and B.same(e["computed"], x["printed_sum"]) and B.same(e["stated"], x["printed_total"]),
          "%s: the record holds the two figures the file lists" % cn)
    check(NG.answer(bare) is not None and NG.answer(bare)[0] == "total_differs" and NG.total_differs(bare) == words
          and W.gap_noted(bare) == ("total_differs", words) and M.PAGE_READS[cn] in words,
          "%s: the record rule names total_differs, and the gap files the rule's own words" % cn)
    g = copy.deepcopy(bare)
    g["score"]["arithmetic"]["computed"] = [a["computed"][0] + 1, a["computed"][1] + 1]
    check(NG.total_differs(g) is None, "%s: a sum one unit off the file's figure names no gap" % cn)
    g = copy.deepcopy(bare)
    g["score"]["arithmetic"]["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1]
    check(NG.total_differs(g) is None, "%s: a total one unit off the file's figure names no gap" % cn)
    check(NG.total_differs(bare, {}) is None, "%s: a record the file does not list never takes the gap" % cn)
    check(not W.shared_with(cn), "%s: no other record was read from its page" % cn)
    cov = f["score"]["coverage"]
    check(str(f["extracted_run"]) == M.PAID_READ and cov["pass"] and cov["placed"] == cov["listed"]
          and W.on_live_run(f),
          "%s: read by paid read %s, every listed course placed, and live on that run" % (cn, M.PAID_READ))

f = W.load("19883")
core, pick = f["record"]["blocks"]
check(core["name"] == "Required Core" and core["rule"] == "all" and B.same(core["stated"], [17, 18])
      and [c["units"] for c in core["courses"]] == [3, 3, 3, 3, 4] and "poid=3640" in f["source_url"],
      "19883: 'Required Core' prints 17-18 over five rows that carry 3, 3, 3, 3 and 4, 16 in all")
check(pick["rule"] == "choose_units" and pick["minimum"] == 9 and B.same(pick["stated"], [9, 9])
      and B.same(f["score"]["arithmetic"]["computed"], [16 + 9, 16 + 9])
      and B.same(f["score"]["arithmetic"]["stated"], [26, 27]),
      "19883: with '9 units from:' the page's units add to 25 under 'Total Units: 26-27'")

f = W.load("38948")
core, one, two = f["record"]["blocks"]
check(core["name"] == "Required Core" and core["rule"] == "all"
      and sum(c["units"] for c in core["courses"]) == 19 and len(core["courses"]) == 7,
      "38948: the core's seven courses add to 19")
check(all(b["rule"] == "choose_units" and b["minimum"] == 3 and B.same(b["stated"], [3, 4]) for b in (one, two))
      and [c["units"] for c in one["courses"]] == [3, 4] and [c["units"] for c in two["courses"]] == [3, 3]
      and B.same(f["score"]["arithmetic"]["computed"], [19 + 3 + 3, 19 + 4 + 4])
      and B.same(f["score"]["arithmetic"]["stated"], [19, 20]),
      "38948: two lists printed 3-4 bring the page's figures to 25-27 under 'Total Units: 19-20'")

f = W.load("19857")
# Either state: S748's plan s748r1 lists it in the file and files total_differs on it; before, neither.
s748 = ("El Camino College", "19857") in NG.total_differs_list()
check([g["gap"] for g in f["score"].get("gaps") or []] == (["total_differs"] if s748 else [])
      and B.same(f["score"]["arithmetic"]["computed"], [33, 33]) and B.same(f["score"]["arithmetic"]["stated"], [36, 36])
      and "poid=3524" in f["source_url"],
      "19857: held by this plan, on its own page (poid 3524) as filed; in no file and with no gap until S748 lists "
      "it, and total_differs alone after")

sys.exit(t.done())
