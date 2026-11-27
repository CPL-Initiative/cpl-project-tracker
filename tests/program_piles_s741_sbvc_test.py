#!/usr/bin/env python3
"""S741, lane 1 (keys) at San Bernardino Valley: the seven records s740c3 held, 2 collected with named gaps, 5 held (kb/_program_piles_s741_sbvc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named and a lower score, and the gap must be true of its record. Each program's own page was read as the capture reads
it (college page reads 45953233659 and 45835049303). The shared checks are tests/program_piles_s739_common.py's.
Pinned here:

  * the seven keys are s740c3's holds; 2 collected, 5 held with their reasons;
  * units_within_printed_range, 35833: 19-22 inside the printed 18.5-22, the required rows at 18 and the one elective
    at 1-4 (GIS 098 and GIS 222 from 1 unit, as the page prints them), every listed course placed; the kind's
    reviewed lists name the key;
  * waived_course_counted, 22784: its placement block holds TECALC 087 alone at 4 units, the record's 20 is the
    printed 16-20's top, and read at 0-4 today's scorer gives the printed range; the wrong joins (a block without
    the placement words, a second course, a sum that is not the range's top) take no gap;
  * 22784's live run: load 45362852938 inserted it and held several runs; the record file's newest commit on main is
    the commit that filed that load's receipt, and no other receipt posts the key; without that history the row is
    not on a proved live run;
  * 17829 is held: the record rule names ge_units_not_read on today's arithmetic (the major passing by the
    short-high reading, the degree a pattern with no units) and none on the filed one, so a gap filed over the filed
    score would not survive a reconcile's rescore; a free reconcile brings its score to today's first;
  * the holds: 04894 passes today's scorer without the state's list; 04873's lists hold fewer courses than they
    ask for; 22821 was read from the department's page; 39483 holds the biology sequences as lists of their own;
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s741_sbvc_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402
import _program_piles_s741_sbvc as M  # noqa: E402

W = M.W
B, NG, S = B7.B, B7.NG, B7.S
ROWS = {"35833": B7.WITHIN, "22784": "waived_course_counted"}
SCORES = {B7.WITHIN: 50, "waived_course_counted": 50}
HELD = {"17829": ["older scorer's", "ge_units_not_read", "free reconcile"],
        "04873": ["Two courses from the following", "no filed kind names a list shorter than its count"],
        "04894": ["MUS 141X2 & MUS 241X2", "never gap-filed"],
        "22821": ["not the program's own page", "site_pages pin"],
        "39483": ["biology sequences", "not shown to close it"]}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-27", boundaries=9)
check = t.check


def bare(cn):
    f = copy.deepcopy(W.load(cn))
    f["score"].pop("gaps", None)
    f["score"].pop("confidence", None)
    return f


check(isinstance(W, B7.Pile)
      and W.receipt_path("2026-11-27").endswith("piles_s740_san_bernardino_valley_2026-11-27_s741k3.json"),
      "the plan is s741k3, on S740's shared code")
check(all(e.get("page") for e in M.REVIEWED.values()), "each entry carries its page's words, from the page read")
check(all(not W.shared_with(cn) for cn in ROWS), "each row was read from a page no other record was read from")

# units_within_printed_range: 35833.
f, e = W.load("35833"), M.REVIEWED["35833"]
a = f["score"]["arithmetic"]
by = {b["name"]: b for b in f["record"]["blocks"]}
req, el = by["Required Courses"], by["Elective Courses - One course from the following"]
check(a["computed"] == [19.0, 22.0] and a["stated"] == [18.5, 22.0] and a["against"] == "program",
      "35833: 19-22 inside the printed 18.5-22")
check(req["rule"] == "all" and [c["units"] for c in req["courses"]] == [3] * 6
      and el["rule"] == "choose_courses" and el["minimum"] == 1
      and sorted((c["units"], c.get("units_max") or c["units"]) for c in el["courses"])
      == [(1, 3), (1, 4), (3, 3), (3, 3), (4, 4)],
      "35833: six required rows at 3 and one elective of 1 to 4 units, as the page prints them")
cov = f["score"]["coverage"]
check(cov["pass"] and cov["placed"] == cov["listed"] == 14 and f["score"]["invented"]["pass"],
      "35833: every listed course is placed, and its additions are the recommended list's")
words = f["score"]["gaps"][0]["words"]
check(words.startswith("the courses' units add to 19-22, within the printed 18.5-22 units | ") and e["words"] in words,
      "35833: the gap files the kind's own words and the record's note")
check(NG.answer(bare("35833")) is None, "35833: no record rule names a kind for it")
check(B7.WITHIN_HELD.get((M.COLLEGE, "35833"), (None,))[0] == B7.WITHIN and "_program_piles_s741_sbvc" in B7.PLAN_MODULES
      and B7.WITHIN_HELD[(M.COLLEGE, "22784")][0] is None,
      "the kind's reviewed lists name 35833; 22784 stays the waiver's, never this kind's")

# waived_course_counted: 22784.
f, e = bare("22784"), M.REVIEWED["22784"]
a = f["score"]["arithmetic"]
blk = B.blocks(f, e["block"])
check(len(blk) == 1 and [c["code"] for c in blk[0]["courses"]] == ["TECALC 087"] and blk[0]["courses"][0]["units"] == 4
      and a["computed"] == [20.0, 20.0] and a["stated"] == [16.0, 20.0],
      "22784: its placement block holds TECALC 087 alone at 4 units, and its 20 is the printed 16-20's top")
check(M.placement_waiver(f, e) and M.SD.waiver_closes(f, e), "22784: read at 0 to 4 units the record gives the printed range")
check(W.load("22784")["score"]["gaps"][0]["words"].startswith("TECALC 087 can be waived by placing into"),
      "22784: the words filed are the record's own note")
g = copy.deepcopy(f)
B.blocks(g, e["block"])[0]["name"] = "Complete the following:"
check(not M.placement_waiver(g, dict(e, block="Complete the following:")), "a block without the placement words takes no gap")
g = copy.deepcopy(f)
B.blocks(g, e["block"])[0]["courses"].append({"code": "MATH 090", "units": 4})
check(not M.placement_waiver(g, e), "a placement block of two courses takes no gap")
g = copy.deepcopy(f)
g["score"]["arithmetic"] = dict(a, stated=[17.0, 21.0])
check(not M.placement_waiver(g, e), "a sum that is not the printed range's top takes no gap")

# 22784's live run.
f = W.load("22784")
import json  # noqa: E402
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_san_bernardino_valley_45362852938.json"),
          encoding="utf-8") as fh:
    load = json.load(fh)
check("22784" in [str(k) for k in load["inserted_keys"]] and len(load["extracted_runs"]) > 1
      and str(f["extracted_run"]) == "45355976381" in [str(r) for r in load["extracted_runs"]],
      "load 45362852938 inserted 22784 and held several runs, the record's among them")
check(M.FILE_HISTORY["22784"][0] == M.LOAD_COMMITS["45362852938"] and M.LIVE_READ["22784"] == str(f["extracted_run"]),
      "the record file's newest commit on main filed that load's receipt, and the live read shows the same run")
check(not W.prior.posted_runs(skip=(W.tag,)).get("22784"), "no other receipt posts 22784")
bare_pile = B7.Pile(college=M.COLLEGE, slug=M.SLUG, tag=M.TAG, name="San Bernardino Valley", prior=W.prior, keys=M.KEYS,
                    reviewed=M.REVIEWED, hand=M.HAND, held_by=M.HELD_BY,
                    shapes={"placement_waiver": M.placement_waiver})
check(not bare_pile.on_live_run(bare("22784"), skip=(W.tag,)) and W.on_live_run(bare("22784"), skip=(W.tag,)),
      "without the file's history the row is on no proved live run; with it, it is")

# 17829, held: the rule names its gap on today's arithmetic alone.
f = bare("17829")
filed, now = f["score"]["arithmetic"], B.arithmetic(f)
check(filed["against"] == "program" and filed["computed"] == [50.0, 60.0] and filed["stated"] == [50.0, 63.0]
      and not W.load("17829")["score"].get("gaps"),
      "17829: the filed arithmetic reads the major, 50-60 against the printed 50-63, and it carries no gap")
check(now["against"] == "degree" and now["status"] == "incomplete" and now["stated"] == [60.0, 60.0]
      and (now.get("major") or {}).get("pass") is True and (now["major"] or {}).get("short_high") is True
      and now.get("ge") is None,
      "17829: today's scorer passes the major by the short-high reading and reads a degree with no pattern units")
rule = W._rule(f, now)
check(NG.answer(f) is None and rule and rule[0] == "ge_units_not_read" and "50-63" in rule[1],
      "17829: the record rule names the gap on today's arithmetic and none on the filed one")

# The holds.
f = W.load("04894")
check(B.scorer_passes(f) and not f["score"].get("gaps") and f["score"]["arithmetic"]["computed"] == [26.5, 36.5],
      "04894: today's scorer passes it without the state's list, and it carries no gap")
f = W.load("04873")
two, four = B.blocks(f, "Two courses from the following:"), B.blocks(f, "Four courses from the following:")
check(len(two) == 1 and two[0]["minimum"] == 2 and len(two[0]["courses"]) == 1
      and len(four) == 1 and four[0]["minimum"] == 4 and len(four[0]["courses"]) == 2 and not f["score"].get("gaps"),
      "04873: its two lists hold fewer courses than they ask for, and it carries no gap")
f = W.load("22821")
check(f["source_url"].rstrip("/").endswith("/pharmacy-technology") and f["score"]["arithmetic"]["stated"] is None
      and not f["score"].get("gaps"), "22821: read from the department's page, with no total, and it carries no gap")
f = W.load("39483")
seq = [b for b in f["record"]["blocks"] if b.get("option_group") == "Biology sequence"]
check(len(seq) == 2 and all(c.get("units") is None for b in seq for c in b["courses"]) and not f["score"].get("gaps"),
      "39483: the biology sequences are lists of their own with no units, and it carries no gap")

sys.exit(t.done())
