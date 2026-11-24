#!/usr/bin/env python3
"""S720, lane 2's cheap piles at Santa Monica: the 23 records S713 held for Sky, collected with their gaps named
(kb/_program_piles_s720_smc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * the kinds reused from #3753 and #3755 and the new repeat_read_once carry a sentence and a unit-arithmetic score
    (the setdefault block in kb/_program_named_gaps.py, a no-op beside those PRs' lines once all have merged);
  * precision 23 of 23 against the hand reading of the census members pinned in the fixture, less the three left
    for a person (p-test-pins-census-members-s714): 22 collected, 41797 held (figures_differ_fails holds it off
    catalog_figures_differ, and no other kind is honest);
  * the claim check holds a record whose named course the capture did not find; every boundary reading names no
    gap, a repeat one time short included;
  * the plan: 22 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s720_smc_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s720_smc.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_smc_2026-11-24_s720s.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s720s_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s720_smc as W  # noqa: E402

COLLEGE = "Santa Monica College"
ROWS = {cn: "lists_not_closed" for cn in ("03256", "03272", "33339")}
ROWS.update({cn: "noted_figures_differ" for cn in ("03282", "03302", "21026", "33270", "33271", "35284", "37452")})
ROWS.update({cn: "pool_figure_not_read" for cn in ("03263", "08970", "21007", "32792", "39680")})
ROWS.update({cn: "pair_read_as_alternatives" for cn in ("39671", "44004", "46189")})
ROWS.update({cn: "repeat_read_once" for cn in ("43655", "43743", "44720")})
HELD = {"41797", "43767"}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in (("lists_not_closed", 30), ("noted_figures_differ", 40), ("pool_figure_not_read", 40),
                 ("pair_read_as_alternatives", 50), ("repeat_read_once", 60)):
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 23 and not set(W.PERSON) & set(members),
      "the fixture less the three for a person gives the 23")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 23 and pr["right"] == 23 and not pr["wrong"], "precision 23 of 23: %s" % pr["wrong"])
check(NG.figures_differ_fails(W._load("41797")) is not None and W.gap_noted(W._load("41797")) is None,
      "figures_differ_fails holds 41797 off catalog_figures_differ")

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 21} and not cc["not_standing"], "21 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2["43743"]["codes_found"] = [c for c in s2["43743"]["codes_found"] if c != "MUSIC64"]
check(W.claim(W._load("43743"), s2) == "a named course not found", "a named course the capture lacks holds it")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 21 * 3 + 3, "every boundary reading names no gap: %s" % bd)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 21, "the receipt names the 21 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds 41797 and 43767")
check(rec["census"]["members"] == members and rec["census"]["person"] == list(W.PERSON), "the receipt's keys")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 21" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (21))" in sql, "the apply guards a confirm, expects 22")
check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
check(W.shared_with("43767") == ["03302", "40812"], "43767's page is shared (#3753's BLOCKER class)")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
