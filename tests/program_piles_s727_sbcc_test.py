#!/usr/bin/env python3
"""S727, lane 2's cheap piles at Santa Barbara City: the census's 18 wording-rule records, 7 passed by a rescore and 6
collected with named gaps (kb/_program_piles_s727_sbcc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores. A record today's scorer passes is rescored, never gap-filed. Pinned here:

  * the one new kind (required_list_outside_total, 70) and each kind filed carry a sentence and a unit-arithmetic
    score in kb/_program_named_gaps.py;
  * precision 18 of 18 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 7 passed, 6 with named gaps, 5 held;
  * the rescore moves a record only by its one reading: with that reading off the scorer fails it, with it on it
    passes (the floor on six, option_parts on 05934);
  * 05934's claim: the capture's code finder never reads the first code of a slash cross-listing, measured over every
    Santa Barbara City record; every boundary reading names no gap and passes none;
  * the plan: 13 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans none;
    the load's image of each committed record is its receipt's after-image.
Every answer comes from the hand reading or a live derivation, never from the receipt (p-test-reads-own-apply-receipt-
s721), so the test holds before and after the plan's own apply.

Run from repo root: python3 tests/program_piles_s727_sbcc_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s727_sbcc.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s727_sbcc_2026-11-25_s727d.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-25_s727d_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s727_sbcc as W  # noqa: E402
import _program_requirements_pilot as PL  # noqa: E402
import _program_requirements_score as S  # noqa: E402

COLLEGE = "Santa Barbara City College"
FLOOR = ("05913", "10661", "19099", "31338", "38595", "43539")
PASSED = dict({cn: "floor" for cn in FLOOR}, **{"05934": "option_parts"})
GAPPED = dict({cn: "repeat_read_once" for cn in ("05902", "10889", "10890", "10894")},
              **{"08565": "pool_figure_not_read", "05924": "required_list_outside_total"})
ROWS = dict({cn: "passes" for cn in PASSED}, **GAPPED)
HELD = {"19012", "46520", "30746", "43553", "45452"}
SCORES = {"repeat_read_once": 60, "pool_figure_not_read": 40, "required_list_outside_total": 70}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(GAPPED.values()) <= set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 18 and not set(W.PERSON) & set(members),
      "the fixture gives the 18 keys")
check({cn: e["reading"] for cn, e in W.PASSED.items()} == PASSED and set(W.REVIEWED) == set(GAPPED),
      "the module's lists are the hand reading's")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 18 and pr["right"] == 18 and not pr["wrong"], "precision 18 of 18: %s" % pr["wrong"])
cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 13} and not cc["not_standing"], "13 claims stand: %s" % cc)
bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 13 * 3 + 6 + 2 + 4 + 1 + 2,
      "every boundary reading names no gap and passes none: %s" % bd)

# The rescore: each passed record moves by its one reading, on its own state list.
for cn, reading in PASSED.items():
    f = W._load(cn)
    check(W.reading_moves(f, reading), "%s: with %s off the scorer fails it, on it passes" % (cn, reading))
    other = "option_parts" if reading == "floor" else "floor"
    check(W.arithmetic(f, (other,)).get("status") == "equal", "%s: %s alone does not move it" % (cn, other))
    check(S.passes_live(f["score"]) and f["score"]["arithmetic"] == W.arithmetic(f),
          "%s: the committed score passes, its arithmetic today's" % cn)
    check(not (f["score"].get("gaps")), "%s: a passed record carries no gap" % cn)

# 05934's claim: the capture's code finder reads the second code of a slash cross-listing, never the first.
check(PL.find_codes("ENVS/HIST 112", [{"code": "ENVS 112"}, {"code": "HIST 112"}]) == {"HIST112": [5]},
      "find_codes reads HIST 112 and not ENVS 112 in 'ENVS/HIST 112'")
sl = W.slash_recall()
check(not sl.get("first found") and sl.get("first not found", 0) >= 90 and not sl.get("second not found"),
      "over every Santa Barbara City record the capture finds no first code of a slash listing: %s" % sl)
f = W._load("05934")
src = W._sources()
check(W.claim(f, src) == "stands", "05934's claim stands with its slash note")
s2 = copy.deepcopy(src)
s2["05934"]["codes_found"] = [c for c in W._found(src["05934"]) if c != "HIST112"]
listed = {S.norm_code(c.get("code")) for c in W.C.closed_list(COLLEGE, "05934")}
check(not W.slash_settles(f, "ENVS 112", W._found(s2["05934"]), listed),
      "ENVS 112 stays unsettled where the capture misses HIST 112 too")
check(W.slash_settles(f, "ENVS 115", W._found(src["05934"]), listed) and "ERTH115" not in listed,
      "ENVS 115 settles: ERTH 115 is not on the state's list")

# The named gaps, on the record: the repeats close the sum, the pool and the outside list close it.
for cn in ("05902", "10889", "10890", "10894"):
    f = W._load(cn)
    check(len(W._course(f, "EH 290")) == 1 and "printed twice" in " ".join(W._notes(f)),
          "%s: EH 290 is read once and the notes say it prints twice" % cn)
f = W._load("08565")
check(W.pool_closes(f, W.REVIEWED["08565"]), "08565: List A at its printed 3-5 closes the sum to 54-62")
f = W._load("05924")
check(W.outside_closes(f, W.REVIEWED["05924"]), "05924: without the graduation list the paths add to 24.5-36")
check(not {"COMMC1000", "PSYCC1000", "SOC101"} & {S.norm_code(c.get("code"))
                                                    for c in W.C.closed_list(COLLEGE, "05924")},
      "05924: the state's course list holds none of the graduation list's courses")

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 13, "the receipt names the 13 rows and their answers")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 5")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
check(not rec["shared_pages"], "no row sits on a shared page")
for r in rec["records"]:
    if r["moves_to"] == "passes":
        check(r["confidence"] is None and r["reading"] == PASSED[r["control_number"]],
              "%s: a passed row carries its reading and no gap score" % r["control_number"])
    else:
        check(r["confidence"]["unit_arithmetic"] == SCORES[r["moves_to"]] and r["confidence"]["ge_pattern"] is None,
              "%s: its arithmetic score is its kind's" % r["control_number"])
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD),
          "%s names exactly the 13" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (13))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    want = [] if r["moves_to"] == "passes" else [r["moves_to"]]
    check((img["checks"].get("gaps") or []) == want, "%s: the image carries its gap or none" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])
    check((img["checks"].get("arithmetic") == "equal") == (r["moves_to"] == "passes"),
          "%s: only a passed row's arithmetic reads equal" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in GAPPED), "the scorer passes none of the gap rows (#3753's MAJOR)")
check(all(W.on_live_run(W._load(cn), skip=("s727d",)) for cn in ROWS),
      "every row is on its live run, read as the receipts stood before this plan's own apply")

why = {h["control_number"]: h["why"] for h in rec["held"]}
check(all("substitut" in why.get(cn, "") for cn in ("19012", "46520")), "19012 and 46520 hold on a substitution list")
check("PSY 200" in why.get("30746", ""), "30746 holds: coverage, PSY 200")
check("two gaps" in why.get("45452", ""), "45452 holds: two gaps at once")
check("no note" in why.get("43553", ""), "43553 holds: no note closes it")
check(all(W.gap_noted(W._load(cn)) is None and W.passes_noted(W._load(cn)) is None for cn in HELD),
      "the held five take no answer")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
