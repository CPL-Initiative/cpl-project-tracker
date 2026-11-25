#!/usr/bin/env python3
"""S727, lane 2's cheap piles at American River: the census's 19 wording-rule records, collected with their gaps named where honest (kb/_program_piles_s727_arc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py, the new
    option_lists_read_apart (40) among them;
  * precision 19 of 19 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 14 collected, 5 held; the new kind's shape check reads 19 of 19 right, and
    its statewide fires are the 5 pinned;
  * the claim check holds a record whose named course the capture did not find, and the own-page guard holds a
    shared page whose own-section words are gone; every boundary reading names no gap;
  * the plan: 14 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap;
  * every row is on its live run both as the receipts stood before this plan's own apply (posted_runs(skip=...)) and
    after it, so the test holds before and after the conductor's apply (p-test-reads-own-apply-receipt-s721).

Run from repo root: python3 tests/program_piles_s727_arc_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s727_arc.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s727_arc_2026-11-25_s727b.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-25_s727b_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s727_arc as W  # noqa: E402

COLLEGE = "American River College"
CUT = ("07206", "12250", "20130", "31390", "31466", "32643", "33273", "37899", "43381")
ROWS = dict({cn: "noted_section_cut_off" for cn in CUT},
            **{"12191": "unit_line_not_read",
               "30023": "pair_read_as_alternatives", "30024": "pair_read_as_alternatives",
               "12180": "option_lists_read_apart", "12238": "option_lists_read_apart"})
HELD = {"07207", "30595", "39341", "39731", "39732"}
SHARED = {"07206", "12250", "20130", "30023", "37899", "43381"}
SCORES = {"noted_section_cut_off": 20, "unit_line_not_read": 40, "pair_read_as_alternatives": 50,
          "option_lists_read_apart": 40}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) == set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 19 and not set(W.PERSON) & set(members),
      "the fixture gives the 19 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 19 and pr["right"] == 19 and not pr["wrong"], "precision 19 of 19: %s" % pr["wrong"])
sr = W.self_recall(CENSUS_AT_PLAN)
check(all(v["right"] == 19 and not v["wrong"] for v in sr.values()), "the shape check reads 19 of 19: %s" % sr)
check(W.statewide_fires() == W.STATEWIDE and len(W.STATEWIDE) == 5
      and ("Chabot College", "19286") in W.STATEWIDE, "option_lists' statewide fires: the 5 pinned")

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 14} and not cc["not_standing"], "14 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2["30024"]["codes_found"] = [c for c in s2["30024"]["codes_found"] if W.S.norm_code(c) != "DESGN303"]
check(W.claim(W._load("30024"), s2) == "a named course not found", "a named course the capture lacks holds it")
check({cn for cn in ROWS if W.shared_with(cn)} == SHARED, "six rows sit on a page shared_pages lists")
for cn in SHARED:
    g = copy.deepcopy(W._load(cn))
    g["record"]["notes"] = [n.replace(W.REVIEWED[cn]["own_section"], "") for n in g["record"]["notes"]]
    check(W.claim(g, src) != "stands", "%s: without its own-section words the shared page holds it" % cn)

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 14 * 3 + 6 + 8 + 2 * 2 + 2 + 2,
      "every boundary reading names no gap: %s" % bd)

# The kinds' own checks, read on the record as the page prints it (the reader's notes).
f = W._load("12191")
check(any("'A minimum of 23 units from the following: 23'" in n for n in W._notes(f)) and W.line_closes(
    f, W.REVIEWED["12191"]), "12191: the 23-unit line names no course, and 37 + 23 is the printed 60")
for cn in ("30023", "30024"):
    check(W.pair_closes(W._load(cn), W.REVIEWED[cn]), "%s: DESGN 303 and 304 add to DESGN 301's printed 4" % cn)
for cn in ("07207", "12180", "12238"):
    check(W.option_lists(W._load(cn)), "%s: concentrations of two lists in one option group" % cn)
check(not W.option_lists(W._load("30024")), "a record with no option group is not the shape")

# 07207 holds on the own-page guard though it takes the shape: its page is shared with Database Management.
check(W.shared_with("07207") == ["12237"] and "07207" not in W.REVIEWED and W.gap_noted(W._load("07207")) is None,
      "07207 takes no gap: its page is shared and no note names its own section")
check(not W._notes(W._load("30595")) and W.gap_noted(W._load("30595")) is None, "30595 has no note of its own")
for cn in ("39341", "39731", "39732"):
    check(set(W.shared_with(cn)) >= {"39448"} and cn not in W.REVIEWED, "%s: the p.211 section is shared" % cn)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 14, "the receipt names the 14 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 5")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
check(set(rec["shared_pages"]) == SHARED, "the receipt lists the six shared pages")
for r in rec["records"]:
    check(r["confidence"]["unit_arithmetic"] == SCORES[r["moves_to"]], "%s: its arithmetic score is its kind's"
          % r["control_number"])
    if r["moves_to"] == "noted_section_cut_off":
        check(r["confidence"]["course_list_match"] <= NG.MAY_CONTINUE_CAP, "%s: a cut-off caps the course list"
              % r["control_number"])
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
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
# On its live run as the receipts stood before this plan's own apply, and as they stand now.
check(all(W.on_live_run(W._load(cn), skip=(W.TAG,)) for cn in ROWS), "every row is on its live run before the apply")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")
check(W.precision(CENSUS_AT_PLAN, skip=(W.TAG,))["right"] == 19, "precision holds on the receipts before the apply")

why = {h["control_number"]: h["why"] for h in rec["held"]}
check("12237" in why.get("07207", ""), "07207 holds: its page is shared with 12237")
check("no note" in why.get("30595", ""), "30595 holds: no note of its own")
check(all("p.211" in why.get(cn, "") for cn in ("39341", "39731", "39732")), "the three apprenticeship awards hold")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
