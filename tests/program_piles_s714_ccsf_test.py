#!/usr/bin/env python3
"""S714, lane 2's cheap piles at City College of San Francisco: the cross-listed and misread renumbers, one option
over several blocks (option_parts), their self-recall and the plan (kb/_program_piles_s714_ccsf.py).

WHY. The S714 conductor's brief: turn the census's 28 reconcile_steps records at the college (and S713's six held for
a list or wording rule) into passing records or named gaps by free rule work, each rule with a claim check, boundary
readings and a precision count before its second read (p-self-recall-reads-rule-fields-s703). Pinned here:

  * the college's course_renumbers name LALS 9 and LGBT 9 for the file's cross-listed LALS/LGBT 9 and CNIT 133I for
    the file's 'CNIT 133l', each with its citation, and never where the file lists the printed code;
  * the scorer reads blocks of one option group whose names open with the same "Option N" as one option (their units
    add up), only where every block of the group opens with an option and two or more share one, and never where the
    blocks of one option carry the same name apart from a closing parenthesis (alternatives: Mt. San Antonio 35796);
  * every planned record's committed score is the scorer's own; with option_parts off 42228 reads as its row held it;
  * the precision count against the hand reading of all 29 records with a record file (right 29: 8 pass, 21 none),
    the claim checks on the reader's notes (none against), the boundary readings (wrong 0), the named gaps' recall
    (wrong 0), and the blast radius elsewhere (13 records, none moved from passing, none written);
  * the plan: 8 rows, each a census member, named exactly by the receipt and the three SQL files; the confirm guard;
    a second run plans none.

Run from repo root: python3 tests/program_piles_s714_ccsf_test.py
"""
import copy
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s714_ccsf.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_ccsf_2026-11-23_s714c.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-23_s714c_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

COLLEGE = "City College of San Francisco"
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# ── reading 2: one option over several blocks ──
def opt(names, units, total=(26, 32)):
    blocks = [{"name": "Required Units", "rule": "all", "courses": [{"code": "MATH 110A", "units": 5},
                                                                    {"code": "MATH 110B", "units": 5}]}]
    for n, u in zip(names, units):
        blocks.append({"name": n, "rule": "all", "option_group": "Option",
                       "courses": [{"code": "X %d" % i, "units": v} for i, v in enumerate(u)]})
    blocks.append({"name": "Choose one", "rule": "choose_courses", "minimum": 1,
                   "courses": [{"code": "MATH 120", "units": 3}, {"code": "MATH 130", "units": 5}]})
    blocks.append({"name": "CS", "rule": "all", "courses": [{"code": "CS 110B", "units": 4},
                                                            {"code": "CS 110C", "units": 4}]})
    return {"program": {"total_units": {"min": total[0], "max": total[1]}, "measure": "units"}, "blocks": blocks}


data_science = opt(["Option 1", "Option 2", "Option 2: A statistics course"], [[5], [4], [5]])
a = S.score(data_science, [], None, "A.S. Degree")["arithmetic"]
check(a["computed"] == [26.0, 32.0] and a["status"] == "equal", "Option 2's two blocks add up to one option (9): %r" % a)
check(S.option_parts(data_science) == {1: ("Option", "1"), 2: ("Option", "2"), 3: ("Option", "2")},
      "option_parts names each block's option")
saved = S.OPTION_PARTS_ON
S.OPTION_PARTS_ON = False
off = S.score(data_science, [], None, "A.S. Degree")["arithmetic"]
S.OPTION_PARTS_ON = saved
check(off["computed"] == [25.0, 28.0] and not off["pass"], "with the reading off: three alternatives (25-28)")
check(not S.option_parts(opt(["Option 1", "Option 2", "Option 3"], [[5], [4], [5]])),
      "three options, one block each: no reading")
check(not S.option_parts(opt(["Option 1", "Option 2", "Statistics"], [[5], [4], [5]])),
      "a block of the group that opens with no option: no reading")
check(not S.option_parts(opt(["Option 1: one language. (Chinese)", "Option 1: one language. (French)",
                              "Option 2: two languages"], [[16], [16], [16]])),
      "blocks of one option with the same name apart from a closing parenthesis are alternatives (Mt. SAC 35796)")
check(not S.option_parts(opt(["Option 1 or 2", "Option 1 or 2: list", "Option 3"], [[5], [4], [5]])),
      "'Option 1 or 2' names no one option")
check(S.option_parts(opt(["OPTION 1: GENERAL - Core", "OPTION 1: GENERAL - List", "OPTION 2: GENDER - Core"],
                         [[5], [4], [5]])) != {}, "upper case and a dash after the option's name read")

# ── reading 1: the renumbers ──
with open(os.path.join(ROOT, "kb", "program_requirements_reconcile.json"), encoding="utf-8") as fh:
    conf = json.load(fh)["colleges"][COLLEGE]
check(conf["course_renumbers"] == {"LALS 9": "LALS/LGBT 9", "LGBT 9": "LALS/LGBT 9", "CNIT 133I": "CNIT 133l"},
      "the college's three renumbers")
cited = {(c["printed"], c["file"]): c for c in conf.get("course_renumbers_cited") or []}
check(set(cited) == {("LALS 9", "LALS/LGBT 9"), ("LGBT 9", "LALS/LGBT 9"), ("CNIT 133I", "CNIT 133l")}
      and all(c["units"] == 3 and c["title"] and c["session"] == "S714" for c in cited.values()),
      "each renumber carries its citation (title, units, session)")
check(conf["prefix_aliases"] == {"COMM": "CMST"}, "the college's prefix aliases are unchanged")
listed = [{"code": "LALS/LGBT 9", "units": 3}, {"code": "CNIT 133l", "units": 3}]
rec = {"program": {"total_units": {"min": 6, "max": 6}},
       "blocks": [{"name": "R", "rule": "all", "courses": [{"code": "LGBT 9", "units": 3},
                                                           {"code": "CNIT 133I", "units": 3}]}]}
sc = S.score(rec, listed, None, "A.A. Degree", R.prefix_aliases(COLLEGE))
check(not sc["coverage"]["missing"] and not sc["invented"]["codes"],
      "the scorer reads LGBT 9 as LALS/LGBT 9 and CNIT 133I as CNIT 133l: %r" % [sc["coverage"], sc["invented"]])
sc = S.score(rec, listed + [{"code": "LGBT 9", "units": 3}], None, "A.A. Degree", R.prefix_aliases(COLLEGE))
check("LALS/LGBT9" in sc["coverage"]["missing"], "where the file lists LGBT 9 too, the code stays as printed")

# ── every committed record against the scorer ──
with open(RECEIPT, encoding="utf-8") as fh:
    receipt = json.load(fh)
rows = receipt["records"]
every = C.every_record()
ch = C.changes(every)
check(not [r for r in ch["here"] if r["moves"] != ["arithmetic"] or r["passes_after"]] and not
      [r for r in ch["not_exact"] if not r["passes_before"]],
      "no committed record at the college moves to passing on a second rescore: %r" % ch["here"])
check(not any(e["arith_before"][1] and not e["arith_after"][1] for e in receipt["changes"]["elsewhere"]),
      "option_parts moves no record elsewhere from passing")
check(len(receipt["changes"]["elsewhere"]) == 13
      and sum(1 for e in receipt["changes"]["elsewhere"] if e["arith_after"][1] and not e["arith_before"][1]) == 9,
      "at the plan, option_parts reached 13 records elsewhere, 9 to a passing arithmetic, none written")
check({r["control_number"] for r in receipt["rescored_not_planned"]} == {"33208", "39727"}
      and not any(r["passes_after"] for r in receipt["rescored_not_planned"]),
      "33208 and 39727 are rescored and still fail")
for r in rows:
    with open(os.path.join(ROOT, r["path"]), encoding="utf-8") as fh:
        filed = json.load(fh)
    before, after = C.arithmetic(filed)
    if r["readings"] == ["course_renumbers"]:
        check(before == after, "%s: the renumber leaves the arithmetic alone" % r["path"])
        check(all(x["listed"] in ("LALS/LGBT9", "CNIT133L") for x in filed["score"].get("course_renumbers") or [])
              and filed["score"].get("course_renumbers"), "%s: the score names the renumber" % r["path"])
    else:
        check(after == filed["score"]["arithmetic"], "%s: the committed arithmetic is the scorer's" % r["path"])
        check(before["status"] == r["before_image"]["checks"]["arithmetic"],
              "%s: with the reading off, the arithmetic reads as the row held it (%s)" % (r["path"], before["status"]))
    check(S.passes_live(filed["score"]) and r["after_image"]["checks"]["coverage"] is True
          and r["after_image"]["checks"]["invented"] is True, "%s: passes after" % r["path"])
    check(r["after_image"]["checks"] != r["before_image"]["checks"], "%s: the row's checks move" % r["path"])

# ── the self-recall ──
pr = C.precision(CENSUS_AT_PLAN)
check(pr["read"] == 29 and pr["right"] == 29 and pr["wrong"] == 0 and pr["no_record_file"] == 0
      and pr["not_hand_held"] == 0, "precision against the hand reading: %r" % pr)
check(pr["by_answer"] == {"passes": 8, "none": 21}, "the hand answers: %r" % pr["by_answer"])
for cn in C.HAND_HELD:
    reading = C.reading_of(cn)
    if reading:
        check(C.claim(C._load(cn), reading) == "stands", "%s: the reader's notes stand for the %s" % (cn, reading))
check(receipt["claim_checks"] == {"course_renumbers": {"stands": 7}, "option_parts": {"stands": 3},
                                  "against_keys": []}, "at the plan, every claim check stands: %r"
      % receipt["claim_checks"])
fake = {"record": {"notes": ["LGBT 9 is printed; it is a different course from the file's LALS/LGBT 9."]}}
check(C.claim(fake, "course_renumbers") == "against", "a note saying the code is another course reads against")
fake = {"record": {"notes": ["The CNIT 133I line is printed."]}}
check(C.claim(fake, "course_renumbers") == "silent", "a note naming the code and no match reads silent")
fake = {"record": {"notes": ["The statistics course reads as a third option."]}}
check(C.claim(fake, "option_parts") == "against", "a note saying the block is a third option reads against")
bd = C.boundaries(CENSUS_AT_PLAN)
check(sum(bd["counts"].values()) == 25 and not bd["wrong"], "25 boundary readings, none wrong: %r" % bd)
check(bd["counts"].get("printed code one letter off right") == 7
      and bd["counts"].get("split blocks given one name right") == 1, "both readings' edges: %r" % bd["counts"])
check(receipt["boundaries"]["wrong"] == [] and receipt["recall"]["wrong"] == 0 and receipt["precision"]["wrong"] == 0,
      "the receipt's self-recall reads no wrong answer")
rc = C.recall_all(every)
check(rc["wrong"] == 0, "the named gaps' recall: wrong %d" % rc["wrong"])

# ── the plan ──
members = C.members(CENSUS_AT_PLAN)
keys = {r["control_number"] for r in rows}
check(len(rows) == 8 and receipt["by"] == {"course_renumbers": 7, "option_parts": 1},
      "8 rows: 7 renumbers, 1 option over two blocks")
check(keys <= set(members) and "17954" not in keys, "every row is a census member; 17954 takes no row")
held = {h["control_number"] for h in receipt["held"]}
check(held == (set(members) - keys) | set(C.NO_RECORD), "the receipt holds every other member and S713's five")
check(not keys & set(C.NO_RECORD), "S713's five with no record take no row")
for part in ("apply", "preread", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        text = fh.read()
    sql_keys = set(re.findall(r"^\s*\(\d+, 'City College of San Francisco', '(\d{5})', \d+,", text, re.M))
    check(sql_keys == keys, "the %s names exactly the plan's rows (%d of %d)" % (part, len(sql_keys), len(keys)))
    if part == "apply":
        check("when f.n > 0" in text and "program_record_fp(r.record)" in text and "from s, c, e, f;" in text
              and "e(expect) as (values (8))" in text, "the apply expects 8 rows and carries the confirm guard")
    if part == "preread":
        check("'confirm_matches'" in text, "the pre-read counts matching confirm verdicts")
check(not C.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"], "a second run plans no row")
# A record the readings never touch keeps its filed score exactly.
f = C._load("05482")
check(C.rescore(copy.deepcopy(f)) is None, "05482: neither reading moves it")

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: S714 City College of San Francisco piles (renumbers, option_parts, the plan)"
      % (checks[0], checks[0]))
