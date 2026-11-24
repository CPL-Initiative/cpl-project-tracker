#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Butte: the census's 17 wording-rule records (kb/_program_piles_s721_butte.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py, and the new
    degree_within_map_range is the one kind added;
  * precision 17 of 17 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 5 collected, 12 held; the "within" shape's self-recall 17 of 17;
  * each entry's own figure check: the 4 sums strictly inside the map's range from the printed 60 (a sum at the low
    end is the scorer's meets or short_high, never this gap; a record the elective line's fill reading passes is
    held, the second reader's nine), and 31000's List B at its '(6.00 overall)' closing the page's figures to 18;
  * the claim check holds a shared page without its own-section words and a named course the capture lacks; every
    boundary reading names no gap;
  * the filed words are the cited clause, never 'ge_units is null' or a reviewer's confirm;
  * the plan: 5 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, the record unchanged;
  * on_live_run means the same before this plan's own apply (skip) and after its migration receipt lands
    (assume_applied), so the test holds once the conductor applies (tonight's Porterville test failed that way).

Run from repo root: python3 tests/program_piles_s721_butte_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s721_butte.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s721_butte_2026-11-24_s721e.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s721e_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s721_butte as W  # noqa: E402
import _program_requirements_score as S  # noqa: E402

COLLEGE = "Butte College"
WITHIN = {"01305", "01358", "07258", "45652"}
NINE = {"01362", "07269", "11136", "31042", "31941", "32469", "33199", "40923", "43453"}
ROWS = dict({cn: "degree_within_map_range" for cn in WITHIN}, **{"31000": "pool_figure_not_read"})
HELD = {"01312", "14583", "33579"} | NINE
OTHER_LEVER = {"16226", "30774", "44891"}
SCORES = {"degree_within_map_range": 50, "pool_figure_not_read": 40}
RUN = "42973457189"
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")
check("hours" in NG.GAPS["hours_within_printed_range"] and "hours" not in NG.GAPS["degree_within_map_range"],
      "the new kind is the units reading hours_within_printed_range does not name")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 17 and not set(W.PERSON) & set(members),
      "the fixture gives the 17 keys")
check(not OTHER_LEVER & set(members), "the reader_page_search records are another lever")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 17 and pr["right"] == 17 and not pr["wrong"], "precision 17 of 17: %s" % pr["wrong"])
check(pr["by_answer"] == {"degree_within_map_range": 4, "pool_figure_not_read": 1, "none": 12}, "4, 1 and 12 held")
wr = W.within_recall(CENSUS_AT_PLAN)
check(wr == {"read": 17, "right": 17, "wrong": []}, "the within shape names the 4 and none else: %s" % wr)

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 5} and not cc["not_standing"], "5 claims stand: %s" % cc)
f = W._load("01305")
saved = W.REVIEWED["01305"]
W.REVIEWED["01305"] = dict(saved, courses=["AET99"])
check(W.claim(f) == "a named course not found", "a named course the capture lacks holds it")
W.REVIEWED["01305"] = saved
check(W.shared_with("14583") == ["43185"] and not any(W.shared_with(cn) for cn in ROWS), "only 14583's page is shared")
W.REVIEWED["14583"] = dict(W.REVIEWED["01305"])
check(W.claim(W._load("14583")) == "the page is shared and no note names the record's own section",
      "a shared page without its own-section words holds")
del W.REVIEWED["14583"]

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 5 * 4, "every boundary reading names no gap: %s" % bd)

# The within check on the record's own figures.
g = copy.deepcopy(f)
g["score"]["arithmetic"]["computed"] = [60.0, 60.0]
check(not W.within_map(g), "a sum at the range's low end is not inside it")
g = copy.deepcopy(f)
g["score"]["arithmetic"]["computed"] = [64.0, 64.0]
check(not W.within_map(g), "a sum at the range's top is not inside it")
g = copy.deepcopy(f)
g["score"]["arithmetic"]["major"] = dict(g["score"]["arithmetic"]["major"], status="unequal", **{"pass": False})
check(not W.within_map(g), "a degree whose major fails its own check takes no degree_within_map_range")
g = copy.deepcopy(f)
g["record"]["notes"] = [n.replace("Map (Butte GE)", "requirements") for n in g["record"]["notes"]]
check(not W.within_map(g), "a degree total no note says is the map's takes no degree_within_map_range")
g = copy.deepcopy(f)
g["record"]["program"]["degree_total"] = {"min": 60, "max": 60}
g["score"]["arithmetic"]["stated"] = [60.0, 60.0]
check(not W.within_map(g), "a single printed figure is no range")
# 31000: List B's '(6.00 overall)' with the core's 6 and List A's 3 and 3 is the printed 18; the record's 27 adds
# Group 1 and Group 2 at their printed 6.00 and 9.00.
f31 = W._load("31000")
e31 = W.REVIEWED["31000"]
check(W.pool_closes(f31, e31), "31000's figures close to 18 with List B at its 6.00")
check(not W.pool_closes(f31, dict(e31, closes=e31["closes"][:-1])), "without the pool's figure they do not")
check(not W.pool_closes(f31, dict(e31, parts=[3])), "the record's 27 is the pool's two parts, not one")

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 5, "the receipt names the 5 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 12")
check(all(h["why"].startswith("held:") for h in rec["held"]), "each held record carries its reason")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
check(sorted(rec["next_lever"]["passes_on_todays_scorer"]) == sorted(W.ELECTIVE_LINE_PASSES),
      "the next lever's nine are the receipt's")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | OTHER_LEVER),
          "%s names exactly the 5" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (5))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])
    check(str(r["before_image"]["extracted_run"]) == str(r["extracted_run"]) == RUN,
          "%s: the plan keeps its run" % r["control_number"])
    check(r["confidence"]["unit_arithmetic"] == SCORES[r["moves_to"]] and r["confidence"]["source"] == 100,
          "%s: its unit arithmetic is the gap's score" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
# The receipts as they stood before this plan's apply, and as they will stand once its migration receipt lands.
before = W.posted_runs(skip=("s721e",))
after = W.posted_runs(assume_applied=("s721e",))
check(all(W.on_live_run(W._load(cn), before) for cn in ROWS), "before the apply, every row is on its live run")
check(all(W.on_live_run(W._load(cn), after) for cn in ROWS), "after the apply, every row is on its live run")
check(all(max(after[cn])[1] == RUN for cn in ROWS), "the posted run is the plan's run, applied or not")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "as the receipts stand now, every row is on its live run")

# The next lever, measured and written nowhere: the map's conditional elective line read as electives that fill the
# degree passes nine on today's scorer, so they are held (the second reader's blocker); the four within rows and the
# other three held do not pass on it.
nxt = {cn for cn in members if W.elective_line_passes(W._load(cn))}
check(nxt == set(W.ELECTIVE_LINE_PASSES) == NINE, "the elective line passes the nine: %s" % sorted(nxt))
check(all(S._span(W._load(cn)["record"]["program"].get("degree_elective_units")) is not None for cn in nxt),
      "each of the nine holds the map's elective line as degree_elective_units")

check(all(h["why"] == W.ELECTIVE_LINE_HELD for h in rec["held"] if h["control_number"] in NINE)
      and "the page's 60 settles the total" in W.ELECTIVE_LINE_HELD and "reconcile_steps" in W.ELECTIVE_LINE_HELD,
      "the receipt names the nine's reason")
check(all(W.gap_noted(W._load(cn)) is None and not W.within_map(W._load(cn)) for cn in NINE),
      "none of the nine takes a gap")
# The kind's sentence and the filed words.
s = NG.GAPS["degree_within_map_range"]
check("the record takes the degree total from the sample map's range" in s.lower() and "60 units" in s
      and "confirm" not in s and "reviewer" not in s, "the sentence names the map's range and the printed 60")
for r in rec["records"]:
    check("ge_units is null" not in r["words"] and "confirm" not in r["words"] and "eviewer" not in r["words"],
          "%s: the filed words carry no untrue or reviewer clause" % r["control_number"])
    check(W._load(r["control_number"])["score"]["gaps"][0]["words"] == r["words"], "%s: the record files the receipt's "
          "words" % r["control_number"])
check(any("ge_units is null" in n for n in W._notes(f)) and f["record"]["program"]["ge_units"] == {"min": 21, "max": 21},
      "01305's note still says ge_units is null, which the GE step made untrue, so the clause stays out")
g = copy.deepcopy(f)
g["record"]["program"]["degree_total"] = {"min": 61, "max": 64}
g["score"]["arithmetic"]["stated"] = [61.0, 64.0]
check(not W.within_map(g), "a range whose low end is not the printed 60 takes no degree_within_map_range")

# The held three.
check(("Butte College", "14583") in NG.HELD_INCOMPLETE and W.gap_noted(W._load("14583")) is None,
      "14583 is an incomplete read and takes no gap")
f12 = W._load("01312")
a12 = f12["score"]["arithmetic"]
check(a12["computed"] == [60.0, 61.0] and a12["stated"] == [62.0, 69.0] and not W.within_map(f12),
      "01312's sum falls short of the map's range: not inside it")
check("01312" not in W.REVIEWED, "01312 holds for a later run under #3762's degree_electives_not_printed")
f79 = W._load("33579")
check(f79["score"]["arithmetic"]["computed"] == [26.0, 26.0] and "33579" not in W.REVIEWED
      and any("within List A" in n for n in W._notes(f79)), "33579 holds on the map's List A reading")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
