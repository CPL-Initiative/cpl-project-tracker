#!/usr/bin/env python3
"""S720, lane 2's cheap piles at College of the Sequoias: the 9 records S714 held (#3721's receipt), collected with their gaps named (kb/_program_piles_s720_sequoias.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 9 of 9 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 7 collected, 2 held;
  * the claim check holds a record whose named course the capture did not find; every boundary reading names no gap;
  * the plan: 7 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s720_sequoias_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s720_sequoias.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s720_sequoias_2026-11-24_s720q.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s720q_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s720_sequoias as W  # noqa: E402

COLLEGE = 'College of the Sequoias'
ROWS = {'06764': 'lists_not_closed', '42254': 'lists_not_closed', '32710': 'lists_not_closed', '10045': 'noted_figures_differ', '35415': 'pool_figure_not_read', '36073': 'double_count_noted', '37744': 'prerequisites_counted'}
HELD = {'45030', '06770'}
SCORES = {'lists_not_closed': 30, 'noted_figures_differ': 40, 'pool_figure_not_read': 40, 'double_count_noted': 40, 'prerequisites_counted': 70}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 9 and not set(W.PERSON) & set(members),
      "the fixture gives the 9 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 9 and pr["right"] == 9 and not pr["wrong"], "precision 9 of 9: %s" % pr["wrong"])

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 7} and not cc["not_standing"], "7 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2['37744']["codes_found"] = [c for c in s2['37744']["codes_found"] if c != 'PT200']
check(W.claim(W._load('37744'), s2) == "a named course not found", "a named course the capture lacks holds it")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 21, "every boundary reading names no gap: %s" % bd)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 7, "the receipt names the 7 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 2")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 7" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (7))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows")
# The new kinds' arithmetic: the double count and the prerequisites, each one unit off, name no gap.
f = W._load("36073")
check(W.gap_noted(f, dict(W.REVIEWED, **{"36073": dict(W.REVIEWED["36073"], double=1)})) is None,
      "a double count that does not reach the total names no gap")
f = W._load("37744")
check(W.gap_noted(f, dict(W.REVIEWED, **{"37744": dict(W.REVIEWED["37744"], less=[2, 7])})) is None,
      "prerequisites that do not close the sum name no gap")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
