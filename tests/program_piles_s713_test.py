#!/usr/bin/env python3
"""S713, lane 2's cheap piles at Santa Rosa Junior and Santa Monica: the common number in parentheses, the named gap
section_cut_off, their self-recall and the plan (kb/_program_piles_s713.py).

WHY. COBIx's brief on #3358 (Nov 22): collect every record with its gaps named and confidence scores. Santa Rosa
Junior prints "PSYC 1000 (PSYC C1000)", which the scorer read as one course missing and another invented; twelve of
its records read a section that runs onto a page the read did not hold. p-self-recall-reads-rule-fields-s703: a
rule's held answer comes from apart from its own fields. Pinned here:

  * the scorer keys a code that prints its common number in parentheses by that number, only where the state's file
    lists the number and not the code as written; "(formerly X)" and a figure in parentheses stay as written;
  * rule 1's rescore from the filed score reproduces each committed passing record from its pre-rule score;
  * section_cut_off's matcher: the requirements continue on a page not held (the gap); a description or a heading
    on another page, a sum past the printed total, and a college outside CUT_OFF_COLLEGES (no gap);
  * the precision count against the hand reading of all 53 census records at the two colleges (right 53, wrong 0),
    the boundary readings (at the total, one past, one short; an unlisted common number) wrong 0, the claim check
    against the pages the read held (none falls), and kb/_program_named_gaps.py's recall wrong 0;
  * the plan: 15 rows (5 passing, 10 with the gap; 06566 and 32298 held on #3705's second read), all at Santa Rosa Junior, each a census member under the lever;
    the receipt and the three SQL files name exactly those rows; a second run plans none; no record at another
    college carries section_cut_off.

Run from repo root: python3 tests/program_piles_s713_test.py
"""
import copy
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s713_piles.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_2026-11-23_s713.json")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_requirements_score as S  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# ── the scorer's reading ──
listed = {"PSYCC1000": 3.0, "ECONC2001": 3.0, "BIO10": 4.0}
for code, want in (("PSYC 1000 (PSYC C1000)", "PSYCC1000"), ("ECON 2001 (ECON C2001)", "ECONC2001"),
                   ("STAT 1000 (STAT C1000)", "STAT1000(STATC1000)"), ("BIO 10 (formerly BIO 1)", "BIO10(FORMERLYBIO1)"),
                   ("MATH 4 (4)", "MATH4(4)"), ("BIO 10", "BIO10"), ("PSYC C1000", "PSYCC1000"),
                   ("MUSC 1 (MUSC 101)", "MUSC1(MUSC101)"), ("ARTH 1100 (ANTH C1100)", "ARTH1100(ANTHC1100)")):
    check(S._listed_key(code, listed) == want, "%r keys as %s (got %s)" % (code, want, S._listed_key(code, listed)))
check(S.common_number_in_parens("ARTH 1200(ARTH C1200)") == "ARTHC1200",
      "a common number printed with no space before its parenthesis")

# ── rule 1: each passing row's pre-rule score, rebuilt, rescores to the committed one ──
with open(RECEIPT, encoding="utf-8") as fh:
    receipt = json.load(fh)
rows = receipt["records"]
for r in rows:
    if r["moves_to"] != "passes":
        continue
    with open(os.path.join(ROOT, r["path"]), encoding="utf-8") as fh:
        filed = json.load(fh)
    sc = filed["score"]
    check(S.passes_live(sc) and sc.get("common_numbers"), "%s: passes with its common numbers named" % r["path"])
    before = copy.deepcopy(filed)
    b = before["score"]
    printed = [S.norm_code(x["printed"]) for x in sc["common_numbers"]]
    nums = [x["listed"] for x in sc["common_numbers"]]
    b.pop("common_numbers", None)
    b["coverage"]["missing"] = sorted(b["coverage"]["missing"] + nums)
    b["coverage"]["unexplained"] = sorted(b["coverage"]["unexplained"] + nums)
    b["coverage"]["placed"] -= len(nums)
    b["coverage"]["pass"] = False
    b["invented"]["codes"] = sorted(b["invented"]["codes"] + printed)
    b["invented"]["count"] = len(b["invented"]["codes"])
    b["invented"]["pass"] = False
    again = P.rescore_common_numbers(before)
    check(again and again["exact"], "%s: the pre-rule score rescores exactly" % r["path"])
    if again:
        for k in ("coverage", "invented"):
            check(again["score"][k] == sc[k], "%s: %s rescored as committed" % (r["path"], k))

# ── section_cut_off's matcher ──
def rec(notes, comp=(4.0, 4.0), st=(22.0, 22.0), status="unequal", college="Santa Rosa Junior College"):
    return {"college": college, "control_number": "99999", "award": "A.S. Degree",
            "record": {"notes": notes, "blocks": [{"name": "List B", "rule": "all", "courses": []}],
                       "program": {"section_heading": "Mathematics", "total_units": {"min": st[0], "max": st[1]}}},
            "score": {"coverage": {"pass": True, "share": 0.7}, "invented": {"pass": True},
                      "arithmetic": {"pass": False, "status": status, "computed": list(comp), "stated": list(st),
                                     "against": "program", "why": ["x"]}}}


CUT_NOTE = "The excerpt begins mid-section: the core calculus requirements are on the previous page and not in the text."
check(NG.section_cut_off(rec([CUT_NOTE])), "the requirements on the previous page, not in the text: the gap")
check(NG.section_cut_off(rec(["The course table appears cut off at the page break after APED 366."])),
      "a table cut off at the page break: the gap")
check(NG.section_cut_off(rec(["The text ends at MATH 74 under List C at a page break; List C's rule is likely on "
                              "the next page."])), "a list ending at a page break: the gap")
check(not NG.section_cut_off(rec(["The section's description (before page 176) is not in the text, so no careers "
                                  "were recorded."])), "a description on another page: no gap")
check(not NG.section_cut_off(rec(["No separate heading for the A.S. section appears in the extracted text (it likely "
                                  "sits on the preceding page)."])), "a heading on another page: no gap")
check(not NG.section_cut_off(rec([CUT_NOTE], comp=(28.0, 28.0))), "a sum past the printed total: no gap")
check(not NG.section_cut_off(rec([CUT_NOTE], comp=(22.0, 22.0), status="equal")), "a sum at the total: no gap")
check(not NG.section_cut_off(rec([CUT_NOTE], college="Santa Ana College")), "a college outside the gate: no gap")
check(NG.section_cut_off_ungated(rec([CUT_NOTE], college="Santa Ana College")), "the ungated rule reads it there")
check(NG.ARITH_SCORE["section_cut_off"] == 20 and "section_cut_off" in NG.GAPS, "the gap's name and score")
check(NG.confidence(rec([CUT_NOTE]), "section_cut_off")["course_list_match"] == 50,
      "course-list match is capped at 50 on a cut-off read")

# ── the self-recall ──
pr = P.precision(CENSUS_AT_PLAN)
check(pr["read"] == 53 and pr["right"] == 53 and pr["wrong"] == 0 and pr["not_hand_held"] == 0,
      "precision against the hand reading: read %(read)d, right %(right)d, wrong %(wrong)d" % pr)
check(pr["by_answer"] == {"none": 38, "passes": 5, "section_cut_off": 10}, "the hand answers: %r" % pr["by_answer"])
check(not NG.section_cut_off(rec([CUT_NOTE], comp=(20.0, 20.0), st=(None, None), status="incomplete")),
      "an incomplete read with no printed total: no gap (06566)")
check(not NG.section_cut_off(rec([CUT_NOTE], comp=(33.5, 34.0), st=(33.5, 33.5), status="incomplete")),
      "an incomplete read whose sum reaches the total: no gap (32298)")
bd = P.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and bd["counts"].get("one short right") == 10 and bd["counts"].get("at total right") == 10
      and bd["counts"].get("one past right") == 10, "the boundary readings: %r" % bd)
cc = P.claim_checks(CENSUS_AT_PLAN)
check(not cc["section_cut_off_falls"], "no cut-off sentence names only pages the read held in its middle")
check(receipt["claim_checks"]["common_numbers"].get("against", 0) == 0
      and receipt["claim_checks"]["common_numbers"].get("stands") == 10,
      "at the plan, the notes match 10 renamed courses to their common number and contradict none")
rc = P.recall_all()
check(rc["wrong"] == 0, "the named gaps' recall with section_cut_off: wrong %d" % rc["wrong"])

# ── the plan ──
members = P.census_members(CENSUS_AT_PLAN)
keys = {(r["college"], r["control_number"]) for r in rows}
check(len(rows) == 15 and receipt["by"] == {"passes": 5, "section_cut_off": 10}, "15 rows: 5 passing, 10 with the gap")
check(not keys & {("Santa Rosa Junior College", "06566"), ("Santa Rosa Junior College", "32298")},
      "06566 and 32298 are held")
for x in receipt["rescored_not_planned"]:
    with open(os.path.join(ROOT, "kb", "program_requirements_college", "santa_rosa_junior", "records",
                           x["control_number"] + ".json"), encoding="utf-8") as fh:
        f = json.load(fh)
    check(P.rescore_common_numbers(f) is None and not S.passes_live(f["score"]) and f["score"].get("common_numbers"),
          "%s: rescored on disk, still failing, no plan row" % x["control_number"])
check(sorted(x["control_number"] for x in receipt["rescored_not_planned"]) == ["32301", "35429"],
      "the receipt lists 32301 and 35429 as rescored and not planned")
with open(os.path.join(ROOT, "kb", "migrations", "2026-11-23_s713_prreq_piles_apply.sql"), encoding="utf-8") as fh:
    apply_sql = fh.read()
with open(os.path.join(ROOT, "kb", "migrations", "2026-11-23_s713_prreq_piles_preread.sql"), encoding="utf-8") as fh:
    pre_sql = fh.read()
check("when f.n > 0" in apply_sql and "program_record_fp(r.record)" in apply_sql and "from s, c, e, f;" in apply_sql,
      "the apply aborts on a row whose latest confirm verdict matches its fingerprint")
check("'confirm_matches'" in pre_sql and "program_record_verdicts" in pre_sql, "the pre-read counts those rows")
check("e(expect) as (values (15))" in apply_sql, "the apply expects 15 rows")
check({c for c, _ in keys} == {"Santa Rosa Junior College"}, "every row is at Santa Rosa Junior")
check(all(cn in members[c] for c, cn in keys), "every row is a census member under the lever")
for part in ("apply", "preread", "rollback"):
    with open(os.path.join(ROOT, "kb", "migrations", "2026-11-23_s713_prreq_piles_%s.sql" % part),
              encoding="utf-8") as fh:
        sql_keys = set(re.findall(r"^\s*\(\d+, '([^']+)', '(\d{5})', \d+,", fh.read(), re.M))
    check(sql_keys == keys, "the %s names exactly the plan's rows (%d of %d)" % (part, len(sql_keys), len(keys)))
for r in rows:
    with open(os.path.join(ROOT, r["path"]), encoding="utf-8") as fh:
        sc = json.load(fh)["score"]
    gaps = [g.get("gap") for g in sc.get("gaps") or []]
    check(gaps == (["section_cut_off"] if r["moves_to"] == "section_cut_off" else []),
          "%s: the record files %s" % (r["path"], r["moves_to"]))
    check(r["after_image"]["checks"]["coverage"] is True and r["after_image"]["checks"]["invented"] is True,
          "%s: the row's coverage and invented pass after" % r["path"])
check(not P.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"], "a second run plans no row")
for p in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "records", "*.json")):
    if "/santa_rosa_junior/" in p:
        continue
    with open(p, encoding="utf-8") as fh:
        sc = json.load(fh).get("score") or {}
    if "section_cut_off" in [g.get("gap") for g in sc.get("gaps") or [] if isinstance(g, dict)]:
        failures.append("%s carries section_cut_off" % os.path.relpath(p, ROOT))

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: S713 piles (common numbers, section_cut_off)" % (checks[0], checks[0]))
