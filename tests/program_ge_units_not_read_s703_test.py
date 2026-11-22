#!/usr/bin/env python3
"""The ge_units_not_read gap (S703, census lever 2): a degree that names a general education pattern and reads no
units for it is collected with the gap named, and only where its major adds up to the printed major total.

WHY. Sam, 2026-11-17 (relayed by COBIx on #3358): never drop a record for failing; collect it with gaps noted and
confidence scores. The census's lever 2 (192 programs on 2026-11-21) is the degree whose one arithmetic reason is
the scorer's general education sentence. S652's review rule: a new rule runs first against records whose answer is
already held. Pinned here:

  * fixtures: the gap on a degree whose major passes and whose one reason is the pattern sentence, unit arithmetic
    50; none where the major fails, a second reason stands, coverage fails, or the record passes;
  * the self-recall on held answers: every passing degree whose units were read loses them, the scorer's own
    degree_check reads it again, and the rule names ge_units_not_read on each (right) and nothing else (wrong 0);
  * the plain recall on every failing record stays wrong 0 with the new rule in it;
  * the s703 plan names only programs the committed census lists as units_incomplete|ge_pattern_no_units, and its
    guarded UPDATE names exactly the plan's rows;
  * the six colleges lane 1 held on 2026-11-22 (City College of San Francisco, San Diego College of Continuing
    Education, Clovis, Cosumnes River, Glendale, Butte) and the parked colleges are untouched: no plan row, and no
    record file there carries the gap.

Run from repo root: python3 tests/program_ge_units_not_read_s703_test.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _harvest_gap_census as G  # noqa: E402
import _program_requirements_college as C  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


LANE_1_S703 = ("City College of San Francisco", "San Diego College of Continuing Education", "Clovis Community College",
               "Cosumnes River College", "Glendale Community College", "Butte College")
WHY = "the record names the degree total and the Cal-GETC pattern, but no units for it"


def degree(why=(WHY,), major_pass=True, coverage=True, ge_units=None, passes=False):
    major = {"pass": major_pass, "status": "equal" if major_pass else "unequal", "computed": [19.0, 19.0],
             "stated": [19.0, 19.0] if major_pass else [21.0, 21.0], "against": "program", "why": []}
    return {"college": "Mendocino College", "control_number": "30601", "award": "A.A.-T Degree",
            "record": {"program": {"ge_pattern": "Cal-GETC", "ge_units": ge_units or {"min": None, "max": None},
                                   "degree_total": {"min": 60, "max": 60}, "total_units": {"min": 19, "max": 19}},
                       "blocks": [], "notes": []},
            "score": {"coverage": {"pass": coverage, "share": 1.0}, "invented": {"pass": True},
                      "arithmetic": {"pass": passes, "status": "equal" if passes else "incomplete",
                                     "computed": [19.0, 19.0], "stated": [60.0, 60.0], "against": "degree",
                                     "ge": None, "why": list(why), "major": major}}}


f = degree()
check(NG.answer(f) and NG.answer(f)[0] == "ge_units_not_read" and NG.held_answer(f) == "ge_units_not_read",
      "a degree whose major passes and whose one reason is the pattern sentence takes ge_units_not_read")
words = NG.ge_units_not_read(f) or ""
check("Cal-GETC" in words and "19" in words, "the words name the pattern and the printed major total: %r" % words)
check(NG.confidence(f, "ge_units_not_read")["unit_arithmetic"] == 50
      and NG.confidence(f, "ge_units_not_read")["ge_pattern"] == 50, "unit arithmetic 50, GE pattern 50")
check(NG.ARITH_SCORE["ge_units_not_read"] == 50 and "ge_units_not_read" in NG.GAPS, "the gap has its sentence and score")
check(NG.ge_units_not_read(degree(major_pass=False)) is None and NG.held_answer(degree(major_pass=False)) is None,
      "a degree whose major fails its printed total takes no ge_units_not_read")
two = degree(why=(WHY, "a required course in 'Major' has no units"))
check(NG.ge_units_not_read(two) is None and NG.held_answer(two) != "ge_units_not_read",
      "a second reason keeps the record without the gap")
check(NG.ge_units_not_read(degree(coverage=False)) is None, "a record whose coverage fails takes no gap")
check(NG.ge_units_not_read(degree(passes=True, why=())) is None, "a passing record takes no gap")
no_major = degree()
del no_major["score"]["arithmetic"]["major"]
check(NG.ge_units_not_read(no_major) is None and NG.held_answer(no_major) is None,
      "a degree with no major check (no printed major total) takes no gap")

# The self-recall on held answers, and the plain recall, over every committed record.
res = NG.run(write=False, gaps=("ge_units_not_read",), skip=LANE_1_S703)
gr = res["ge_units_recall"]
check(gr["held"] > 1000 and gr["right"] == gr["held"] and gr["wrong"] == 0,
      "self-recall, units removed from passing degrees: held %d, right %d, wrong %d (%s)"
      % (gr["held"], gr["right"], gr["wrong"], gr["wrong_keys"][:3]))
rc = res["recall"]
check(rc["wrong"] == 0 and rc["by_answer"].get("ge_units_not_read", 0) > 100,
      "the plain recall with the new rule: right %d, wrong %d" % (rc["right"], rc["wrong"]))
check(not any(m["college"] in LANE_1_S703 for m in res["moved"]), "the dry run moves no record at a lane 1 college")

# The committed plan.
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-22_s703.json")
with open(RECEIPT, encoding="utf-8") as fh:
    plan = json.load(fh)
keys = {(r["college"], str(r["control_number"])) for r in plan["records"]}
census = NG.census_keys(("units_incomplete|ge_pattern_no_units",))
check(plan["only_gaps"] == ["ge_units_not_read"] and plan["census_causes"] == ["units_incomplete|ge_pattern_no_units"],
      "the plan moves one gap, at one census cause")
check(keys and keys <= census, "every plan row is a census lever 2 program (%d of %d)" % (len(keys & census), len(keys)))
check(all(r["gap"] == "ge_units_not_read" and r["after_image"]["checks"].get("gaps") == ["ge_units_not_read"]
          and not (r["before_image"]["checks"] or {}).get("gaps") for r in plan["records"]),
      "each row takes the gap, and none filed a gap before")
check(not {c for c, _ in keys} & set(LANE_1_S703), "no plan row at a lane 1 college")
check(not {c for c, _ in keys} & set(G.PARKED), "no plan row at a parked college")
check(set(LANE_1_S703) <= set(plan["held_colleges"]), "the receipt names the six held colleges")
with open(os.path.join(ROOT, "kb", "migrations", "2026-11-22_s703_prreq_named_gaps_apply.sql"), encoding="utf-8") as fh:
    sql_keys = set(re.findall(r"^\s*\(\d+, '([^']+)', '(\d{5})', \d+,", fh.read(), re.M))
check(sql_keys == keys, "the guarded UPDATE names exactly the plan's rows (%d of %d)" % (len(sql_keys), len(keys)))
for college, cn in sorted(keys):
    with open(os.path.join(ROOT, "kb", "program_requirements_college", C.slug_of(college), "records", cn + ".json"),
              encoding="utf-8") as fh:
        filed = json.load(fh)
    check([g.get("gap") for g in filed["score"].get("gaps") or []] == ["ge_units_not_read"],
          "%s %s: the record files the gap" % (college, cn))

# The lane 1 colleges' records carry no ge_units_not_read.
for college in LANE_1_S703:
    for p in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", C.slug_of(college), "records", "*.json")):
        with open(p, encoding="utf-8") as fh:
            sc = json.load(fh).get("score") or {}
        check("ge_units_not_read" not in [g.get("gap") for g in sc.get("gaps") or [] if isinstance(g, dict)],
              "%s: a lane 1 college's record carries no ge_units_not_read" % os.path.relpath(p, ROOT))

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: ge_units_not_read (S703)" % (checks[0], checks[0]))
