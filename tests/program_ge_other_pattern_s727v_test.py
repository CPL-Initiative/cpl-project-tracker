#!/usr/bin/env python3
"""S727 plan s727v: Antelope Valley 43028 collected with its gap named (kb/_program_ge_other_pattern_s727v.py).

WHY. Sam's ruling (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps noted
and confidence scores. 43028 (Communication Studies 2.0 A.A.-T) names Cal-GETC, and its page prints general
education figures only for CSU GE and IGETC; S713 held it for a person. Pinned here, by the hand reading of the
record's own notes and never by the plan's receipt (p-test-reads-own-apply-receipt-s721), and holding both before
and after the plan's own apply:

  * the kind ge_figures_other_pattern has its sentence and ge_units_not_read's score, 50;
  * the shape fires on 43028 alone statewide; every guard stands (scorer_passes, on_live_run, its own page);
  * before the plan the entry stands and the plan names the one row; after it the committed record carries the gap,
    the load's image carries it with the record unchanged, and a second run plans none;
  * boundary readings: the note's words gone, the major's figure moved, another college: no gap;
  * the four SQL files name 43028 alone, and the apply guards a confirm.

Run from repo root: python3 tests/program_ge_other_pattern_s727v_test.py
"""
import copy
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_ge_other_pattern_s727v as W  # noqa: E402

COLLEGE, CN, GAP = "Antelope Valley College", "43028", "ge_figures_other_pattern"
HAND_WORDS = "CSU GE and IGETC rather than the Cal-GETC pattern"   # the hand reading of 43028's own note
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond:
        failures.append(msg)


check(GAP in NG.GAPS and NG.ARITH_SCORE.get(GAP) == 50 == NG.ARITH_SCORE["ge_units_not_read"],
      "the kind has its sentence and ge_units_not_read's score")
check(W.statewide_fires() == {(COLLEGE, CN)} == set(W.STATEWIDE), "the shape fires on 43028 alone statewide")

f = W._load(CN)
filed_gaps = [g.get("gap") for g in (f.get("score") or {}).get("gaps") or []]
applied = filed_gaps == [GAP]
check(applied or filed_gaps == [], "the record carries the gap or none (%s)" % filed_gaps)
bare = copy.deepcopy(f)
bare["score"].pop("gaps", None)
bare["score"].pop("confidence", None)
got = W.gap_noted(bare)
check(got is not None and got[0] == GAP and HAND_WORDS in got[1], "the entry stands on the record as filed: %s"
      % (got and got[0]))
check(not W.PV.scorer_passes(f) and W.on_live_run(f) and not W.shared_with(CN),
      "the guards stand: the scorer does not pass it, it is on its live run, and no program shares its page")
if applied:
    g = f["score"]["gaps"][0]
    check(HAND_WORDS in g["words"] and g["label"] == NG.GAPS[GAP], "the filed gap quotes the record's own note")
    conf = f["score"]["confidence"]
    check(conf["unit_arithmetic"] == 50 and conf["ge_pattern"] == 50 and conf["course_list_match"] == 100,
          "its confidence: arithmetic 50, general education 50, course list 100 (%s)" % conf)
    check(W.gap_noted(f) is None and W.plan(write=False)["rows"] == [], "after the apply, a second run plans none")
    img = NG._load_images({COLLEGE})[(COLLEGE, CN)]
    check(img["checks"].get("gaps") == [GAP] and img["checks"].get("confidence") == conf
          and img["extracted_run"] == f["extracted_run"],
          "the load's image carries the one gap and its confidence, on the record's own run")
else:
    rows = W.plan(write=False)["rows"]
    check([r["control_number"] for r in rows] == [CN] and rows[0]["moves_to"] == GAP, "the plan names the one row")

# Boundary readings: each takes the gap away.
nonote = copy.deepcopy(bare)
nonote["record"]["notes"] = [n for n in nonote["record"]["notes"] if "rather than" not in n]
moved = copy.deepcopy(bare)
moved["score"]["arithmetic"]["major"]["stated"] = [19.0, 19.0]
other = dict(copy.deepcopy(bare), college="College of the Redwoods")
check(W.gap_noted(nonote) is None and not W.shape(nonote), "the note's words gone: no gap")
check(W.gap_noted(moved) is None, "the major's printed figure moved one unit: no gap")
check(W.gap_noted(other) is None and not W.shape(other), "another college: no gap")

migs = sorted(glob.glob(os.path.join(ROOT, "kb", "migrations", "*_s727v_prreq_ge_other_pattern_*.sql")))
check(len(migs) == 4, "four SQL files (%d)" % len(migs))
for path in migs:
    with open(path, encoding="utf-8") as fh:
        sql = fh.read()
    check("'%s'" % CN in sql and sql.count("'Antelope Valley College', '") == 1,
          "%s names 43028 alone" % os.path.basename(path))
    if path.endswith("_apply.sql"):
        check("confirm guard" in sql and "e(expect) as (values (1))" in sql, "the apply guards a confirm")

print("%d checks, %d failures" % (checks[0], len(failures)))
sys.exit(1 if failures else 0)
