#!/usr/bin/env python3
"""S727, lane 2's cheap piles at American River: the census's 19 wording-rule records, collected with their gaps named where honest (kb/_program_piles_s727_arc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py, the new
    option_lists_read_apart (40) and noted_total_cut_off (40) among them;
  * precision 19 of 19 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 12 collected, 7 held (12191, 12238 and 07207's reason by the second reader's
    round 1); the new kind's shape check reads 19 of 19 right, and it fires on the 5 statewide records whose blocks
    tests/fixtures/option_lists_statewide_s727.json pins (never another college's live records);
  * the own-page guard keys on the pages the records were read from, never capture.json's re-paginated shared_pages;
  * 12191 holds because a cheaper lever passes it: the unit_line block its note quotes, added, passes today's scorer;
  * the claim check holds a record whose named course the capture did not find, and the own-page guard holds a
    shared page whose own-section words are gone; every boundary reading names no gap;
  * the plan: 12 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
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
CUT = ("07206", "12250", "31390", "31466", "32643", "33273", "37899", "43381")
ROWS = dict({cn: "noted_section_cut_off" for cn in CUT},
            **{"20130": "noted_total_cut_off",
               "30023": "pair_read_as_alternatives", "30024": "pair_read_as_alternatives",
               "12180": "option_lists_read_apart"})
HELD = {"07207", "12191", "12238", "30595", "39341", "39731", "39732"}
SHARED = {"07206", "12250", "20130", "30023", "37899", "43381"}
SCORES = {"noted_section_cut_off": 20, "noted_total_cut_off": 40, "pair_read_as_alternatives": 50,
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
check(W.fixture_fires() == W.STATEWIDE and len(W.STATEWIDE) == 5
      and ("Chabot College", "19286") in W.STATEWIDE, "option_lists fires on the 5 pinned statewide records")

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 12} and not cc["not_standing"], "12 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2["30024"]["codes_found"] = [c for c in s2["30024"]["codes_found"] if W.S.norm_code(c) != "DESGN303"]
check(W.claim(W._load("30024"), s2) == "a named course not found", "a named course the capture lacks holds it")
check({cn for cn in ROWS if W.shared_with(cn)} == SHARED, "six rows were read from a page another program was")
# The guard reads the pages the records were read from (sources.json, source_url): 12238 shares p.429 with 07206,
# and 07207's own p.431 holds no other program.
check(W.shared_with("12238") == ["07206"] and "12238" in W.shared_with("07206") and W.shared_with("07207") == [],
      "the read pages: 12238 with 07206 on p.429, 07207 alone on p.431")
for cn in SHARED:
    g = copy.deepcopy(W._load(cn))
    g["record"]["notes"] = [n.replace(W.REVIEWED[cn]["own_section"], "") for n in g["record"]["notes"]]
    check(W.claim(g, src) != "stands", "%s: without its own-section words the shared page holds it" % cn)

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 12 * 3 + 6 + 8 + 1 * 2 + 1 + 2,
      "every boundary reading names no gap: %s" % bd)

# The kinds' own checks, read on the record as the page prints it (the reader's notes).
f = W._load("12191")
check(any("'A minimum of 23 units from the following: 23'" in n for n in W._notes(f)), "12191's note quotes the line")
rec12191 = copy.deepcopy(f["record"])
rec12191["blocks"].append({"name": "A minimum of 23 units from the following", "rule": "choose_units", "minimum": 23,
                           "option_group": None, "stated": {"min": 23, "max": 23}, "courses": []})
a12191 = W.S.score(rec12191, [], "", f.get("award"))["arithmetic"]
check(not W.scorer_passes(f) and a12191["status"] == "equal" and a12191["computed"] == [60.0, 60.0],
      "12191: with the unit_line block its note quotes, today's scorer passes it at 60 = 60 (a cheaper lever)")
check("12191" not in W.REVIEWED and W.gap_noted(f) is None, "12191 takes no gap")
f = W._load("20130")
check(W.total_cut(f) and f["score"]["coverage"]["placed"] == f["score"]["coverage"]["listed"] == 4,
      "20130: all four courses placed, no total read")
check("total line" in NG.GAPS["noted_total_cut_off"] and "missing from the record" not in
      NG.GAPS["noted_total_cut_off"], "20130's label says only the total line is missing")
for cn in ("30023", "30024"):
    check(W.pair_closes(W._load(cn), W.REVIEWED[cn]), "%s: DESGN 303 and 304 add to DESGN 301's printed 4" % cn)
for cn in ("07207", "12180", "12238"):
    check(W.option_lists(W._load(cn)), "%s: concentrations of two lists in one option group" % cn)
check(not W.option_lists(W._load("30024")), "a record with no option group is not the shape")

# 07207 holds on its own note's words though it takes the shape; 12238 on the own-page guard.
check(any("does not explicitly say 'select one'" in n for n in W._notes(W._load("07207")))
      and "07207" not in W.REVIEWED and W.gap_noted(W._load("07207")) is None,
      "07207 takes no gap: its note says the text does not say the student completes one concentration")
check("12238" not in W.REVIEWED and W.gap_noted(W._load("12238")) is None, "12238 takes no gap")
check(not W._notes(W._load("30595")) and W.gap_noted(W._load("30595")) is None, "30595 has no note of its own")
# S741 pinned 39731 and 39732 to their own pages and read 45962123468 filed them there, so each of the three is read
# from p.211 with the other two (as s727e found them), or from a page no other of the three was read from.
for cn in ("39341", "39731", "39732"):
    check(len(W.shared_with(cn)) in (0, 2) and cn not in W.REVIEWED,
          "%s: the p.211 section is read for three, until S741's pins move Level I and Level II off it" % cn)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 12, "the receipt names the 12 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 7")
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
          "%s names exactly the 12" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (12))" in sql, "the apply guards a confirm")
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
check("select one" in why.get("07207", "") and "p.431" in why.get("07207", ""), "07207 holds on its own note")
check("07206" in why.get("12238", ""), "12238 holds: read from p.429 with 07206")
check("unit_line" in why.get("12191", "") and "60 = 60" in why.get("12191", ""), "12191 holds on the cheaper lever")
check("no note" in why.get("30595", ""), "30595 holds: no note of its own")
check(all("p.211" in why.get(cn, "") for cn in ("39341", "39731", "39732")), "the three apprenticeship awards hold")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
