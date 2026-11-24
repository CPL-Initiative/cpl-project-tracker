#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Palo Verde: the census's 20 wording-rule records, collected with their gaps named where honest (kb/_program_piles_s721_paloverde.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py, the two new
    ones (figure_within_variable_units 60, degree_electives_not_printed 50) among them;
  * precision 20 of 20 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 15 collected, 5 held (41227 and 41242 by the second reader's round 1);
    the new kinds' shape checks read 20 of 20 right, and spans_figure's statewide fires are the 19 pinned;
  * the claim check holds a record whose named course the capture did not find; every boundary reading names no gap;
  * the plan: 15 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s721_paloverde_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s721_paloverde.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s721_paloverde_2026-11-24_s721a.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s721a_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s721_paloverde as W  # noqa: E402

COLLEGE = "Palo Verde College"
FIRE = ("41189", "41208", "41221", "41222", "41223", "41224", "41225", "41226", "41241", "41243", "41250", "41260")
ROWS = dict({cn: "figure_within_variable_units" for cn in FIRE},
            **{"22484": "noted_figures_differ",
               "18000": "degree_electives_not_printed", "18045": "degree_electives_not_printed"})
HELD = {"17998", "17999", "41227", "41242", "45359"}
SCORES = {"figure_within_variable_units": 60, "degree_electives_not_printed": 50, "noted_figures_differ": 40}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 20 and not set(W.PERSON) & set(members),
      "the fixture gives the 20 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 20 and pr["right"] == 20 and not pr["wrong"], "precision 20 of 20: %s" % pr["wrong"])
sr = W.self_recall(CENSUS_AT_PLAN)
check(all(v["right"] == 20 and not v["wrong"] for v in sr.values()), "the shape checks read 20 of 20: %s" % sr)
check(W.SHAPE_HAND["figure_within_variable_units"] == frozenset(FIRE) | {"41242"},
      "the 13 Fire Science certificates take the shape, 41242 among them")
check(len(W.STATEWIDE) == 19 and sum(c == COLLEGE for c, _ in W.STATEWIDE) == 13
      and ("El Camino College", "43992") not in W.STATEWIDE, "spans_figure's statewide fires: 19, 13 at Palo Verde")
# An "or" alternative's units never make a course variable (El Camino 43992 before the fix).
alt = {"code": "X1", "units": 3, "units_max": None, "alternatives": [{"code": "X2", "units": 5}]}
check(not W._variable(alt) and W._variable({"code": "FST 090", "units": 0.25, "units_max": 12}),
      "a variable-unit course is one whose own units_max passes its units")

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 15} and not cc["not_standing"], "15 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2["41189"]["codes_found"] = [c for c in s2["41189"]["codes_found"] if c != "FST90"]
check(W.claim(W._load("41189"), s2) == "a named course not found", "a named course the capture lacks holds it")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 15 * 3 + 13 + 12 * 2 + 2 * 2,
      "every boundary reading names no gap: %s" % bd)

# The new kinds' shapes, read on the record: a required list whose courses add to its figure at their least is not
# figure_within_variable_units; a degree with an electives figure is not degree_electives_not_printed.
f = copy.deepcopy(W._load("41243"))
req = f["record"]["blocks"][0]
check(W.spans_figure(f), "41243's required figure 9 falls inside its courses' 1.25-13.5")
req["courses"] = [dict(c, units_max=None) for c in req["courses"]]
check(not W.spans_figure(f), "with fixed units its courses cannot reach 9: not the shape")
g = W._load("18045")
check(W.degree_rest(g), "18045: 18 and CalGETC's 34-38 add to 52-56, short of 60")
check(not W.degree_rest(dict(g, record=dict(g["record"], program=dict(g["record"]["program"],
                                                                      electives_fill_degree=True)))),
      "a degree whose electives fill it is not the shape")

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 15, "the receipt names the 15 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 5")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
check(not rec["shared_pages"], "no row sits on a shared page")
for r in rec["records"]:
    want = {"figure_within_variable_units": 60, "degree_electives_not_printed": 50, "noted_figures_differ": 40}
    check(r["confidence"]["unit_arithmetic"] == want[r["moves_to"]], "%s: its arithmetic score is its kind's"
          % r["control_number"])
    check(r["confidence"]["ge_pattern"] == (100 if r["moves_to"] == "degree_electives_not_printed" else None),
          "%s: general education scores only on the degrees" % r["control_number"])
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 15" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (15))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")

# The held five, each with its reason in the receipt.
why = {h["control_number"]: h["why"] for h in rec["held"]}
check("only the scorer's note" in why.get("17998", ""), "17998 holds: no note of its own says electives are unprinted")
check("Lists A and B" in why.get("17999", ""), "17999 holds: Lists A and B's relation to the 18 is unread")
check("past the printed 34" in why.get("45359", ""), "45359 holds: its low end passes 34 at the area figures")
check("not the two figures noted_figures_differ names" in why.get("41227", ""),
      "41227 holds: its sum is not the 29.75 its figures add to")
check("none of its own notes" in why.get("41242", ""), "41242 holds: no note of its own names FST 090's range")
check(all(W.gap_noted(W._load(cn)) is None and cn not in W.REVIEWED for cn in ("41227", "41242")),
      "41227 and 41242 take no gap")
check(W.gap_noted(W._load("17998")) is None and "17998" not in W.REVIEWED, "17998 takes no gap")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
