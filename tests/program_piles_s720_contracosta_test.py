#!/usr/bin/env python3
"""S720, lane 2's cheap piles at Contra Costa: the census's 22 wording-rule records, collected with their gaps named where honest (kb/_program_piles_s720_contracosta.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 22 of 22 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 16 collected, 6 held;
  * the claim check holds a record whose named course the capture did not find; every boundary reading names no gap;
  * the plan: 16 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s720_contracosta_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s720_contracosta.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s720_contracosta_2026-11-24_s720k.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s720k_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s720_contracosta as W  # noqa: E402

COLLEGE = 'Contra Costa College'
ROWS = {'01381': 'degree_summary_ge_none', '01384': 'degree_summary_ge_none', '01387': 'degree_summary_ge_none', '01393': 'degree_summary_ge_none', '01408': 'degree_summary_ge_none', '01437': 'degree_summary_ge_none', '01443': 'degree_summary_ge_none', '01447': 'degree_summary_ge_none', '01448': 'degree_summary_ge_none', '07602': 'degree_summary_ge_none', '07614': 'degree_summary_ge_none', '07616': 'degree_summary_ge_none', '11702': 'degree_summary_ge_none', '18984': 'degree_summary_ge_none', '36158': 'lists_not_closed', '42085': 'lists_not_closed'}
HELD = {'01400', '40761', '01415', '33660', '33370', '01417'}
SCORES = {'degree_summary_ge_none': 50, 'lists_not_closed': 30}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 22 and not set(W.PERSON) & set(members),
      "the fixture gives the 22 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 22 and pr["right"] == 22 and not pr["wrong"], "precision 22 of 22: %s" % pr["wrong"])

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 16} and not cc["not_standing"], "16 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2['42085']["codes_found"] = [c for c in s2['42085']["codes_found"] if c != 'AFRAM110']
check(W.claim(W._load('42085'), s2) == "a named course not found", "a named course the capture lacks holds it")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 48, "every boundary reading names no gap: %s" % bd)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 16, "the receipt names the 16 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 6")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 16" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (16))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS) and not W.on_live_run(W._load("01400")),
      "the rows are on their live runs; 01400's run reached no live row")
f = W._load("01443")
check(W.gap_noted(f) == ("degree_summary_ge_none", W.gap_noted(f)[1]), "01443 takes degree_summary_ge_none as filed")
g = copy.deepcopy(f)
g["score"]["arithmetic"]["major"] = dict(g["score"]["arithmetic"]["major"], status="unequal")
check(W.gap_noted(g) is None, "a degree whose major fails its own check takes no degree_summary_ge_none")
g = copy.deepcopy(f)
g["record"]["program"]["ge_pattern"] = "CSU GE Breadth"
check(W.gap_noted(g) is None, "a degree whose page names a GE pattern takes no degree_summary_ge_none")
g = copy.deepcopy(f)
g["score"]["arithmetic"]["against"] = "major"
check(W.gap_noted(g) is None, "a record checked against its major, not the degree, takes no degree_summary_ge_none")

# The GE cap lives in NG.confidence, so keep_named_gaps (#3756) keeps it when it recomputes a kept gap's scores.
check("degree_summary_ge_none" in NG.GE_NOT_PRINTED and NG.GE_NOT_PRINTED_CAP == 50, "the kind's GE score is capped")
check(NG.confidence(f, "degree_summary_ge_none")["ge_pattern"] == 50
      and NG.confidence(f, None)["ge_pattern"] == 100 and NG.confidence(f, "lists_not_closed")["ge_pattern"] == 100,
      "the cap is the gap's: 50 with degree_summary_ge_none, 100 without it on the same record")
check(all(r["confidence"]["ge_pattern"] == 50 and r["after_image"]["checks"]["confidence"]["ge_pattern"] == 50
          for r in rec["records"] if r["moves_to"] == "degree_summary_ge_none"),
      "every degree_summary_ge_none row posts ge_pattern 50")

# 33660: its notes print GE as None/N/A and say nothing of its electives, so the kind's sentence is not its own.
c33660 = W._load("33660")
check("33660" not in W.REVIEWED and W.gap_noted(c33660) is None
      and not any("elective" in str(n).lower() for n in c33660["record"]["notes"]),
      "33660 holds: no note of it names its electives")
check(any(h["control_number"] == "33660" and "electives" in h["why"] for h in rec["held"]),
      "the receipt holds 33660 with its reason")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
