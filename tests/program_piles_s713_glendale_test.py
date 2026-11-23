#!/usr/bin/env python3
"""S713, lane 2's cheap piles at Glendale: the substitute list, the figure in a heading, the PSYC 104 renumber, their
self-recall and the plan (kb/_program_piles_s713_glendale.py).

WHY. COBIx's brief on #3358 (Nov 22): the catalog-wording rules at Glendale, each with a claim check, boundary
readings and a precision count before its second read (p-self-recall-reads-rule-fields-s703). Pinned here:

  * the scorer reads a list headed "If 20 units have not been reached in the required core" or "IF ANY REQUIRED
    COURSES WERE SUBSTITUTED" as standing in for one core course (20 as printed, 15 + 3 = 18 with it), only beside
    exactly one all-required core whose courses carry units, never inside an option group;
  * the scorer reads "FOR A MINIMUM OF NINE UNITS" and "TO COMPLETE A MINIMUM TOTAL OF EIGHTEEN" (words only; digits
    are the reconcile's fill_to step's) on a list with no figure: a figure equal to the program's total fills the program to it, any other is the list's floor; a list
    with its own figure keeps it;
  * Glendale's course_renumbers name PSYC 104 for the file's PSYCH 104, with its citation, and the prefix stays
    unaliased;
  * every committed record's arithmetic is the scorer's own, and with the S713 readings off each planned record reads
    the arithmetic status its before-image holds; no record at another college changes;
  * the precision count against the hand reading of the 17 census records with a record file (right 17), the claim
    checks on the reader's notes (none against), the boundary readings (wrong 0) and the named gaps' recall (wrong 0);
  * the plan: 13 rows, each a census member, named exactly by the receipt and the three SQL files; the confirm
    guard; a second run plans none.

Run from repo root: python3 tests/program_piles_s713_glendale_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s713_glendale.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_glendale_2026-11-23_s713g.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-23_s713g_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s713_glendale as G  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# ── reading 1: the substitute list ──
def lang(heading, list_units=3, extra=None, group=None):
    blocks = [{"name": "REQUIRED COURSES", "rule": "all",
               "courses": [{"code": "FREN %d" % n, "units": 5} for n in (101, 102, 103, 104)]},
              {"name": heading, "rule": "choose_courses", "minimum": 1, "option_group": group,
               "courses": [{"code": "LING 101", "units": list_units}, {"code": "HIST 170", "units": list_units}]}]
    return {"program": {"total_units": {"min": 18, "max": 20}, "measure": "units"}, "blocks": blocks + (extra or [])}


IF20 = "If 20 units have not been reached in the required core, select one course from the following"
SUBST = "LIST A - SELECT ONE OF THE FOLLOWING IF ANY REQUIRED COURSES WERE SUBSTITUTED"
for h in (IF20, SUBST):
    a = S.score(lang(h), [], None, "A.A. Degree")["arithmetic"]
    check(a["computed"] == [18.0, 20.0] and a["pass"] and a.get("substitute_list") == h,
          "%r stands in for one core course: %r" % (h[:30], a))
check(S.score(lang("SELECT ONE OF THE FOLLOWING"), [], None, "A.A. Degree")["arithmetic"]["computed"] == [23.0, 23.0],
      "a list with no such heading adds to the core")
check(S.score(lang(IF20, list_units=4), [], None, "A.A. Degree")["arithmetic"]["computed"] == [19.0, 20.0],
      "a 4-unit list in place of a 5-unit course: 19")
check(S.score(lang(IF20, list_units=6), [], None, "A.A. Degree")["arithmetic"]["computed"] == [20.0, 21.0],
      "a list larger than the course it replaces carries the high end past the core")
two_cores = lang(IF20, extra=[{"name": "MORE REQUIRED", "rule": "all", "courses": [{"code": "X 1", "units": 3}]}])
check(S.substitute_core(two_cores, {}) is None, "two all-required blocks: no reading (which core is unknown)")
check(S.substitute_core(lang(IF20, group="Option A"), {}) is None, "a list inside an option group: no reading")
no_units = lang(IF20)
no_units["blocks"][0]["courses"][0]["units"] = None
check(S.substitute_core(no_units, {}) is None, "a core course with no units: no reading")

# ── reading 2: the figure in a heading ──
def fig(name, rule="choose_units", minimum=None, total=18, stated=None, extra_min=3):
    b = {"name": name, "rule": rule, "minimum": minimum, "courses": [{"code": "A 1", "units": 2},
                                                                    {"code": "A 2", "units": 3}]}
    if stated:
        b["stated"] = stated
    return {"program": {"total_units": {"min": total, "max": total}, "measure": "units"},
            "blocks": [{"name": "LIFE", "rule": "choose_units", "minimum": extra_min, "courses": []},
                       {"name": "PHYS", "rule": "choose_units", "minimum": extra_min, "courses": []},
                       {"name": "MATH", "rule": "choose_units", "minimum": extra_min, "courses": []}, b]}


EIGHTEEN = "CHOOSE ADDITIONAL UNITS TO COMPLETE A MINIMUM TOTAL OF EIGHTEEN"
check(S.heading_figure({"name": EIGHTEEN, "rule": "choose_units"}) == 18.0, "EIGHTEEN reads 18")
check(S.heading_figure({"name": "CHOOSE THREE COURSES FOR A MINIMUM OF NINE UNITS", "rule": "choose_courses",
                        "minimum": 3}) == 9.0, "NINE reads 9 on a choose-courses list")
check(S.heading_figure({"name": "COMPLETE 1 COURSE FOR A MINIMUM OF 18 UNITS", "rule": "choose_courses",
                        "minimum": 1}) is None, "a figure in digits is the reconcile's fill_to step's, never read here")
check(S.heading_figure({"name": EIGHTEEN, "rule": "choose_units", "minimum": 9}) is None,
      "a list with its own minimum keeps it")
check(S.heading_figure({"name": EIGHTEEN, "rule": "choose_units", "stated": {"min": 9, "max": 9}}) is None,
      "a list with its own printed figure keeps it")
check(S.heading_figure({"name": EIGHTEEN, "rule": "choose_units", "fills_to": 18}) is None,
      "a list the reconcile already fills keeps its fills_to")
check(S.heading_figure({"name": "REQUIRED FOR A MINIMUM OF NINE UNITS", "rule": "all"}) is None,
      "an all-required block takes no heading figure")
check(S.heading_figure({"name": "FOR A MINIMUM OF NINE UNITS, CHOSEN FROM TWO AREAS", "rule": "choose_units"})
      is None, "a figure inside the heading, not at its end, is not read")
a = S.score(fig(EIGHTEEN), [], None, "A.A. Degree")["arithmetic"]
check(a["computed"] == [18.0, 18.0] and a["pass"] and a.get("heading_figures"),
      "a heading figure equal to the program's total fills the program to it: %r" % a)
a = S.score(fig(EIGHTEEN, total=27), [], None, "A.A. Degree")["arithmetic"]
check(a["computed"] == [27.0, 27.0] and a["pass"], "a heading figure apart from the total is the list's floor: %r" % a)
a = S.score(fig("CHOOSE TWO FOR A MINIMUM OF FOUR UNITS", rule="choose_courses", minimum=2, total=14), [], None,
            "A.A. Degree")["arithmetic"]
check(a["computed"] == [14.0, 14.0], "a choose-courses list's heading floor: max(5, 4) on top of 9: %r" % a)
a = S.score(fig("CHOOSE TWO FOR A MINIMUM OF SIX UNITS", rule="choose_courses", minimum=2, total=15), [], None,
            "A.A. Degree")["arithmetic"]
check(a["computed"] == [15.0, 15.0], "the floor stands above the courses' sum: max(5, 6) on top of 9: %r" % a)

# ── reading 3: one course renumbered ──
conf = R.load_steps()["Glendale Community College"]
check(conf["course_renumbers"].get("PSYC104") == "PSYCH 104", "Glendale renumbers PSYC 104 to the file's PSYCH 104")
check(any(c["printed"] == "PSYC104" and c["file"] == "PSYCH 104" and c["title"] == "Social Psychology"
          for c in conf.get("course_renumbers_cited") or []), "the renumber carries its citation")
check("PSYC" not in conf["prefix_aliases"], "the PSYC prefix stays unaliased (three counterexample titles)")
listed = [{"code": "PSYCH 104", "units": 3}, {"code": "SOC 101", "units": 3}]
psy = {"program": {"total_units": {"min": 6, "max": 6}},
       "blocks": [{"name": "R", "rule": "all", "courses": [{"code": "PSYC 104", "units": 3},
                                                           {"code": "SOC 101", "units": 3}]}]}
sc = S.score(psy, listed, None, "A.A. Degree", R.prefix_aliases("Glendale Community College"))
check(not sc["coverage"]["missing"] and not sc["invented"]["codes"], "the scorer reads PSYC 104 as PSYCH 104")
sc = S.score(psy, listed + [{"code": "PSYC 104", "units": 3}], None, "A.A. Degree",
             R.prefix_aliases("Glendale Community College"))
check(sc["coverage"]["missing"] == ["PSYCH104"], "where the file lists PSYC 104 too, the code stays as printed")
check(R.course_renumbers("Glendale Community College").get("PSYCH104") == "PSYC 104",
      "the capture looks for PSYC 104 on the page for the listed PSYCH 104")

# ── every committed record against the scorer ──
with open(RECEIPT, encoding="utf-8") as fh:
    receipt = json.load(fh)
rows = receipt["records"]
every = G.every_record()
ch = G.changes(every)
check(not ch["glendale"] and not ch["elsewhere"] and not ch["not_exact"],
      "no committed record moves on a second rescore, at Glendale or elsewhere: %r" % ch)
check(sorted(r["control_number"] for r in receipt["changes"]["glendale"]) == sorted(
    [r["control_number"] for r in rows] + ["32462", "45068"]) and not receipt["changes"]["elsewhere"],
      "at the plan, the readings changed the 13 planned records and 32462 and 45068, and none elsewhere")
for r in rows:
    with open(os.path.join(ROOT, r["path"]), encoding="utf-8") as fh:
        filed = json.load(fh)
    before, after = G.arithmetic(filed)
    if r["readings"] == ["course_renumbers"]:
        check(before == after, "%s: the renumber leaves the arithmetic alone" % r["path"])
        check(filed["score"].get("course_renumbers") == [{"printed": "PSYC 104", "listed": "PSYCH104",
                                                          "block": filed["score"]["course_renumbers"][0]["block"]}],
              "%s: the score names the renumber" % r["path"])
        continue
    check(after == filed["score"]["arithmetic"], "%s: the committed arithmetic is the scorer's" % r["path"])
    check(before["status"] == r["before_image"]["checks"]["arithmetic"],
          "%s: with the readings off, the arithmetic reads as the row held it (%s)" % (r["path"], before["status"]))
    check(S.passes_live(filed["score"]) and r["after_image"]["checks"]["arithmetic"] == "equal"
          and r["after_image"]["checks"]["coverage"] is True and r["after_image"]["checks"]["invented"] is True,
          "%s: passes after" % r["path"])
    check(r["after_image"]["checks"] != r["before_image"]["checks"], "%s: the row's checks move" % r["path"])

# ── the self-recall ──
pr = G.precision(CENSUS_AT_PLAN)
check(pr["read"] == 17 and pr["right"] == 17 and pr["wrong"] == 0 and pr["no_record_file"] == 11
      and pr["not_hand_held"] == 0, "precision against the hand reading: %r" % pr)
check(pr["by_answer"] == {"passes": 13, "none": 4}, "the hand answers: %r" % pr["by_answer"])
for cn in G.HAND_HELD:
    reading = G.reading_of(cn)
    if reading:
        check(G.claim(G._load(cn), reading) == "stands", "%s: the reader's notes stand for the %s" % (cn, reading))
check(G.claim(G._load("45068"), "course_renumbers") == "stands", "45068's notes match PSYC 104 to PSYCH 104")
check(receipt["claim_checks"] == {"substitute": {"stands": 9}, "heading_figure": {"stands": 2},
                                  "course_renumbers": {"stands": 3}, "against_keys": []},
      "at the plan, every claim check stands: %r" % receipt["claim_checks"])
fake = {"record": {"notes": ["The list is conditional: taken in addition to the required core."]}}
check(G.claim(fake, "substitute") == "against", "a note saying the list adds to the core reads against")
bd = G.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and bd["counts"].get("total low one short right") == 11
      and bd["counts"].get("list one unit larger right") == 9 and bd["counts"].get("figure one less right") == 2,
      "the boundary readings: %r" % bd)
check(receipt["boundaries"]["wrong"] == [] and receipt["recall"]["wrong"] == 0 and receipt["precision"]["wrong"] == 0,
      "the receipt's self-recall reads no wrong answer")
rc = G.recall_all(every)
check(rc["wrong"] == 0, "the named gaps' recall: wrong %d" % rc["wrong"])

# ── the plan ──
members = G.census_members(CENSUS_AT_PLAN)
keys = {r["control_number"] for r in rows}
check(len(rows) == 13 and receipt["by"] == {"substitute": 9, "heading_figure": 2, "course_renumbers": 2},
      "13 rows: 9 substitute lists, 2 heading figures, 2 renumbers")
check(keys <= set(members) and not keys & set(G.FILED_AS_GAPS), "every row is a census member with a record file")
check(not keys & {"32607", "36416", "44488", "45068"}, "the four held records take no row")
check({h["control_number"] for h in receipt["held"]} == set(G.FILED_AS_GAPS) | {"32607", "36416", "44488", "45068"},
      "the receipt holds the 11 named gaps and the four held records")
for part in ("apply", "preread", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        text = fh.read()
    sql_keys = set(re.findall(r"^\s*\(\d+, 'Glendale Community College', '(\d{5})', \d+,", text, re.M))
    check(sql_keys == keys, "the %s names exactly the plan's rows (%d of %d)" % (part, len(sql_keys), len(keys)))
    if part == "apply":
        check("when f.n > 0" in text and "program_record_fp(r.record)" in text and "from s, c, e, f;" in text
              and "e(expect) as (values (13))" in text, "the apply expects 13 rows and carries the confirm guard")
    if part == "preread":
        check("'confirm_matches'" in text, "the pre-read counts matching confirm verdicts")
check(not G.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"], "a second run plans no row")

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: S713 Glendale piles (substitute list, heading figure, PSYC 104 renumber)"
      % (checks[0], checks[0]))
