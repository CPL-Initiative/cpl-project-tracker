#!/usr/bin/env python3
"""S720, lane 2's cheap piles at El Camino: the census's 22 wording-rule records, collected with their gaps named where honest (kb/_program_piles_s720_elcamino.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 22 of 22 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 14 collected, 8 held;
  * the claim check holds a record whose named course the capture did not find; every boundary reading names no gap;
  * the plan: 14 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s720_elcamino_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s720_elcamino.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s720_elcamino_2026-11-24_s720m.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s720m_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s720_elcamino as W  # noqa: E402

COLLEGE = 'El Camino College'
ROWS = {'02495': 'noted_figures_differ', '02512': 'noted_figures_differ', '02524': 'noted_figures_differ', '02538': 'noted_figures_differ', '02544': 'noted_figures_differ', '19892': 'noted_figures_differ', '32238': 'noted_figures_differ', '38839': 'noted_figures_differ', '02513': 'pool_figure_not_read', '02515': 'pool_figure_not_read', '02517': 'pool_figure_not_read', '02528': 'pool_figure_not_read', '02519': 'prerequisites_counted', '43992': 'pair_read_as_alternatives'}
HELD = {'15251', '31319', '02520', '45290', '02518', '19857', '19883', '42541'}
SCORES = {'noted_figures_differ': 40, 'pool_figure_not_read': 40, 'prerequisites_counted': 70, 'pair_read_as_alternatives': 50}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")

# S739's free reconcile 45768189197 read El Camino's pages under the pooled reading (S731's): 02513, 02515 and 02517
# now pass whole, the lever plan s731p named for them, so the three left this plan's rows. Every count below is read
# in either state (p-test-asserts-other-pr-absent-recurs-s731): the three still collected with their gap, or passing.
MOVED_S739 = ("02513", "02515", "02517")
moved = {cn for cn in MOVED_S739 if W.S.passes_live((W._load(cn) or {}).get("score"))}
check(moved in (set(), set(MOVED_S739)), "S739's three moved together or not at all: %s" % sorted(moved))

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 22 and not set(W.PERSON) & set(members),
      "the fixture gives the 22 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 22 and pr["right"] == 22 - len(moved)
      and sorted(w[0] for w in pr["wrong"]) == sorted(moved) and all(w[2] == "none" for w in pr["wrong"]),
      "precision 22 of 22, less the three S739 passed: %s" % pr["wrong"])

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 14 - len(moved)} and not cc["not_standing"], "14 claims stand, less S739's three")
src = W._sources()
s2 = copy.deepcopy(src)
s2['43992']["codes_found"] = [c for c in s2['43992']["codes_found"] if c != 'ATEC26']
check(W.claim(W._load('43992'), s2) == "a named course not found", "a named course the capture lacks holds it")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 3 * (14 - len(moved)),
      "every boundary reading names no gap: %s" % bd)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 14, "the receipt names the 14 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 8")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 14" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (14))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    if r["control_number"] in moved:
        check(not img["checks"].get("gaps"), "%s: passing after S739, its image carries no gap" % r["control_number"])
    else:
        check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
        check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS if cn not in moved),
      "the scorer passes none of the rows (#3753's MAJOR)")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")
# S742: the Acalog road reads site_pages pins, and paid read 46007782666 moved Photography certificate 19883 to its
# own page (poid 3640), so 02512, the Photography A.S., is alone on its page since. Read in either state.
shared = W.shared_with("02512")
check(shared in (["19883"], []), "02512's page is shared with 19883, or since S742's read with no record (%s)" % shared)
e = dict(W.REVIEWED["02512"])
e.pop("own_section")
check(W.claim(W._load("02512")) == "stands", "02512 stands with its own-section words")
W.REVIEWED["02512"] = e
check(W.claim(W._load("02512")) == ("the page is shared and no note names the record's own section" if shared
                                    else "stands"),
      "without them its shared page holds it, while the page is shared")

# The second reader (S720): 02520's quoted 64.5 includes the 6.5-unit post-graduation block, so its figures agree.
c02520 = W._load("02520")
check("02520" not in W.REVIEWED and W.gap_noted(c02520) is None
      and any("64.5" in str(n) and "6.5 units" in str(n) for n in c02520["record"]["notes"]),
      "02520 holds: 64.5 less the noted 6.5 is the printed 58")
check(any(h["control_number"] == "02520" and "no figures differ" in h["why"] for h in rec["held"]),
      "the receipt holds 02520 with its reason")
check(W.REVIEWED["02528"]["gap"] == "pool_figure_not_read" and NG.ARITH_SCORE["pool_figure_not_read"] == 40,
      "02528's core and electives complement each other to 20: pool_figure_not_read, at 40")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
