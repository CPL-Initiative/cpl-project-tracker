#!/usr/bin/env python3
"""S713, lane 2's cheap piles at Clovis: a lecture and its lab, an earlier list's unused courses, two courses
renumbered, their self-recall, the blast radius and the plan (kb/_program_piles_s713_clovis.py).

WHY. COBIx's brief on #3358 (Nov 22): the catalog-wording rules at Clovis, each with a claim check, boundary readings
and a precision count before its second read (p-self-recall-reads-rule-fields-s703). Pinned here:

  * the scorer takes an alternative whose code is another alternative's with L added as one option with it, never a
    lab with no lecture beside it, never a pair the reading already labels;
  * the scorer lets a "List X" take the courses an earlier list left, where the list's name or the reader's note says
    so ("List B also allows 'Any course from List A not already used'"), only between choose-courses lists with a
    count, no printed figure and no option group, and names the reading only where it moves a sum;
  * Clovis's course_renumbers name SOC 1B and ANTHRO 2 for the file's SOCI 1B and ANTH 2, cited; the prefixes stay
    unaliased;
  * every committed record's arithmetic is the scorer's; with the readings off each planned record reads the status
    its before-image holds; every record the readings move elsewhere is hand-read (10, right 10);
  * the precision count (17 right), the claim checks (none against), the boundary readings (wrong 0), the named gaps'
    recall (wrong 0); the plan's 6 rows, named exactly by the receipt and the SQL files, with the confirm guard.

Run from repo root: python3 tests/program_piles_s713_clovis_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s713_clovis.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_clovis_2026-11-23_s713c.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-23_s713c_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s713_clovis as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# ── reading 1: a lecture and its lab ──
def core(alts, total=20):
    return {"program": {"total_units": {"min": total, "max": total}, "measure": "units"},
            "blocks": [{"name": "Required Core Courses", "rule": "all",
                        "courses": [{"code": "BIOL C1000", "units": 4, "alternatives": alts},
                                    {"code": "SCI 1A", "units": 4}, {"code": "HIST C1001", "units": 12}]}]}


PAIR = [{"code": "BIOL C1001", "units": 3}, {"code": "BIOL C1001L", "units": 1}]
check(S.program_units(core(PAIR), {})[0] == (20.0, 20.0), "BIOL C1001 and BIOL C1001L are one option of 4")
check(S.program_units(core([{"code": "BIOL C1001L", "units": 1}]), {})[0] == (17.0, 20.0),
      "a lab with no lecture beside it stands alone")
check(S.program_units(core([{"code": "BIOL 13", "units": 3}, {"code": "BIOL 13L", "units": 1}]), {})[0]
      == (20.0, 20.0), "BIOL 13 and BIOL 13L pair too")
labelled = [dict(PAIR[0], together="x"), dict(PAIR[1])]
check(S.lab_pairs(labelled)[1].get("together") is None, "a lab whose lecture the reading already pairs keeps its own")
check(S.program_units(core([{"code": "CHEM 1A", "units": 5}, {"code": "CHEM 1B", "units": 5}]), {})[0]
      == (20.0, 21.0), "two courses that are no lecture and lab stay two options")
check(PAIR[1].get("together") is None, "the record's alternatives are not changed")

# #3708's second reader, finding 2: a pair member with no units anywhere pairs with nothing.
nounit = core([{"code": "BIO 11", "units": 3}, {"code": "BIO 11L", "units": None}])
nounit["blocks"][0]["courses"][0].update(code="X 1", units=5)
check(S.program_units(nounit, {})[0] == (19.0, 21.0) and not any(
    a.get("together") for a in S.lab_pairs(S.alternatives(nounit["blocks"][0]["courses"][0]))),
      "X (5) or BIO 11 (3) and BIO 11L with no units: no pair, BIO 11 stays an option")
check(any(a.get("together") for a in S.lab_pairs([{"code": "BIO 11", "units": 3}, {"code": "BIO 11L"}],
                                                 {"BIO11L": 1.0})), "a member the state's list prices pairs")

# ── reading 2: an earlier list's unused courses ──
def lists(note=None, b_name="List B: Select one course", total=21):
    return {"program": {"total_units": {"min": total, "max": 24}, "measure": "units"},
            "notes": [note] if note else [],
            "blocks": [{"name": "Required Core Courses", "rule": "all", "courses": [{"code": "ECON 1", "units": 15}]},
                       {"name": "List A: Select one course", "rule": "choose_courses", "minimum": 1,
                        "courses": [{"code": "BA 5", "units": 3}, {"code": "BA 39", "units": 3},
                                    {"code": "MATH 17", "units": 5}]},
                       {"name": b_name, "rule": "choose_courses", "minimum": 1,
                        "courses": [{"code": "MATH 6", "units": 5}]}]}


NOTE = "List B also allows 'Any course from List A not already used' (3-5 units)."
check(S.program_units(lists(), {})[0] == (23.0, 25.0), "without the note, List B is MATH 6 alone")
check(S.program_units(lists(NOTE), {})[0] == (21.0, 25.0), "with it, List B takes List A's leftovers: 21")
check(S.program_units(lists(b_name="List B: Select one course or any course not selected from List A"), {})[0]
      == (21.0, 25.0), "the list's own name says it too")
check(S.program_units(lists("List B also allows 'Any List A course not already used'."), {})[0] == (21.0, 25.0),
      "'Any List A course not already used' reads the same")
check(S.program_units(lists("List C also allows 'Any course from List A not already used'."), {})[0] == (23.0, 25.0),
      "a note naming a list the record does not hold reads nothing")
one = lists(NOTE)
one["blocks"][1]["courses"] = [{"code": "BA 5", "units": 3}]
check(S.program_units(one, {})[0] == (23.0, 23.0), "an earlier list with no course left adds nothing")
grouped = lists(NOTE)
grouped["blocks"][2]["option_group"] = "g"
check(not S.also_from(grouped), "a list inside an option group takes no reading")
stated = lists(NOTE)
stated["blocks"][2]["stated"] = {"min": 5, "max": 5}
check(not S.also_from(stated), "a list with its own printed figure keeps it")
# Finding 1: a chain (C takes A's or B's leftovers, B takes A's) would count a course twice: C takes no reading.
chain = {"program": {"total_units": {"min": 11, "max": 11}, "measure": "units"},
         "notes": ["List B also allows 'Any course from List A not already used'.",
                   "List C also allows 'Any course from List A or List B not already used'."],
         "blocks": [{"name": "List A: Select one course", "rule": "choose_courses", "minimum": 1,
                     "courses": [{"code": "A 1", "units": 3}, {"code": "A 2", "units": 3}]},
                    {"name": "List B: Select one course", "rule": "choose_courses", "minimum": 1,
                     "courses": [{"code": "B 1", "units": 5}]},
                    {"name": "List C: Select one course", "rule": "choose_courses", "minimum": 1,
                     "courses": [{"code": "C 1", "units": 5}]}]}
check(S.also_from(chain) == {1: [0]}, "a list whose source is itself a target takes no reading: %r" % S.also_from(chain))
check(S.program_units(chain, {})[0][0] == 11.0, "the chain reads its true least, 11, not 9: %r"
      % (S.program_units(chain, {}),))
a = S.score(lists(NOTE), [], None, "A.A-T Degree")["arithmetic"]
check(a.get("also_from") and a["pass"], "the check names the reading: %r" % a.get("also_from"))
same = lists("List B also allows 'Any course from List A not already used'.")
same["blocks"][1]["courses"] = [{"code": "BA 5", "units": 5}, {"code": "BA 39", "units": 5}]
check(not S.score(same, [], None, "A.A-T Degree")["arithmetic"].get("also_from"),
      "a reading that moves no sum is not named")

# ── reading 3: two courses renumbered ──
conf = R.load_steps()["Clovis Community College"]
check(conf.get("course_renumbers") == {"SOC1B": "SOCI 1B", "ANTHRO2": "ANTH 2"}, "Clovis's two renumbers")
check({c["printed"] for c in conf.get("course_renumbers_cited") or []} == {"SOC1B", "ANTHRO2"}
      and all(re.search(r"CCC000\d{6}", c["evidence"]) for c in conf["course_renumbers_cited"]),
      "each renumber cites its control number")
check(not conf.get("prefix_aliases"), "no prefix is aliased")

# ── the committed records and the blast radius ──
with open(RECEIPT, encoding="utf-8") as fh:
    receipt = json.load(fh)
rows = receipt["records"]
every = C.every_record()
ch = C.changes(every)
check(not ch["clovis"], "no Clovis record moves on a second rescore: %r" % ch["clovis"])
ep = C.elsewhere_precision(ch)
check(ep["read"] == 10 and ep["right"] == 10 and ep["wrong"] == 0,
      "every record the readings move elsewhere is hand-read: %r" % ep)
check(not any(x["college"] == "Clovis Community College" for x in ch["not_exact"]), "no Clovis record is not exact")
check(sorted(r["control_number"] for r in receipt["changes"]["clovis"]) == sorted(r["control_number"] for r in rows)
      and not receipt["rescored_not_planned"], "at the plan, the readings changed the 6 planned records alone")
check("12 records" in receipt["blast_radius"] and "lab_pairs alone" in receipt["blast_radius"],
      "the receipt names the 12 passes elsewhere and 33502's lab pair")
for r in rows:
    with open(os.path.join(ROOT, r["path"]), encoding="utf-8") as fh:
        filed = json.load(fh)
    before, after = C.arithmetic(filed)
    if r["readings"] == ["course_renumbers"]:
        check(before == after, "%s: the renumber leaves the arithmetic alone" % r["path"])
        check(filed["score"].get("course_renumbers"), "%s: the score names the renumber" % r["path"])
    else:
        check(after == filed["score"]["arithmetic"], "%s: the committed arithmetic is the scorer's" % r["path"])
        check(before["status"] == r["before_image"]["checks"]["arithmetic"],
              "%s: with the readings off, the arithmetic reads as the row held it" % r["path"])
    check(S.passes_live(filed["score"]) and r["after_image"]["checks"]["arithmetic"] == "equal"
          and r["after_image"]["checks"]["coverage"] is True and r["after_image"]["checks"]["invented"] is True
          and r["after_image"]["checks"] != r["before_image"]["checks"], "%s: passes after" % r["path"])

# ── the self-recall ──
pr = C.precision(CENSUS_AT_PLAN)
# S721's plan s721p passes 33489 under the pooled reading (kb/_program_pooled_s721.py); this hand reading held it for
# a reread, so the rule now reads it passing. The exception pins only the keys s721p moved; every other key
# stays pinned to this plan's hand reading.
check(pr["read"] == 17 and pr["right"] == 16 and pr["wrong"] == 1 and pr["not_hand_held"] == 0
      and [(k["control_number"], k["hand"], k["rule"]) for k in pr["wrong_keys"]] == [("33489", "none", "passes")]
      and pr["by_answer"] == {"passes": 6, "none": 11}, "precision against the hand reading: %r" % pr)
cc = C.claim_checks(CENSUS_AT_PLAN)
check(cc == {"lab_pairs": {"stands": 3}, "also_from": {"stands": 2}, "course_renumbers": {"stands": 2},
             "against_keys": []}, "the claim checks: %r" % cc)
bd = C.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and bd["counts"].get("total low one short right") == 4
      and bd["counts"].get("lab without its lecture right") == 3 and bd["counts"].get("file lists neither right") == 2,
      "the boundary readings: %r" % bd)
check(receipt["boundaries"] == bd and receipt["precision"]["wrong"] == 0 and receipt["recall"]["wrong"] == 0,
      "the receipt's self-recall reads no wrong answer")
rc = C.recall_all(every)
check(rc["wrong"] == 0, "the named gaps' recall: wrong %d" % rc["wrong"])

# ── the plan ──
keys = {r["control_number"] for r in rows}
members = set(C.census_members(CENSUS_AT_PLAN))
check(len(rows) == 6 and keys == {"33486", "33502", "35535", "42235", "45957", "33508"}, "6 rows: %s" % sorted(keys))
check(keys - members == {"33508"}, "every row is a census member but 33508, a hand-read Clovis record the pair passes")
check({h["control_number"] for h in receipt["held"]} == members - keys, "the receipt holds the other 11")
for part in ("apply", "preread", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        text = fh.read()
    sql_keys = set(re.findall(r"^\s*\(\d+, 'Clovis Community College', '(\d{5})', \d+,", text, re.M))
    check(sql_keys == keys, "the %s names exactly the plan's rows (%d of %d)" % (part, len(sql_keys), len(keys)))
    if part == "apply":
        check("when f.n > 0" in text and "program_record_fp(r.record)" in text and "from s, c, e, f;" in text
              and "e(expect) as (values (6))" in text, "the apply expects 6 rows and carries the confirm guard")
    if part == "preread":
        check("'confirm_matches'" in text, "the pre-read counts matching confirm verdicts")
check(not C.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"], "a second run plans no row")

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: S713 Clovis piles (lab pairs, earlier lists' courses, two renumbers)"
      % (checks[0], checks[0]))
