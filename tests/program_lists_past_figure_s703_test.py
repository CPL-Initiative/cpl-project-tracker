#!/usr/bin/env python3
"""The lists_past_their_figure gap (S703, the catalog-wording lever): the catalog's figures, each list counted at the
figure it prints, add to its printed total, while a list's courses carry more units than that figure.

WHY. Sam, 2026-11-17 (relayed by COBIx on #3358): never drop a record for failing; collect it with gaps noted and
confidence scores. Santa Monica prints a figure over each list, its required core too (Psychology AA-T 36265:
"Required Core Course 9" over courses of 4, 3 and 3, three lists at 3 each, "18" printed; the courses add to 19).
S652's review rule: a new rule runs first against records whose answer is already held. Pinned here:

  * fixtures: the gap where the figures add to the total and a required or choose-courses list's courses pass its
    figure; none where the figures do not add to it, where the sum falls short, where a blank "or" alternative
    stands, or where a list prints no figure;
  * the self-recall on held answers: every passing record the scorer reproduces whose figures add to its total and
    one of whose lists its courses meet exactly; each such list's courses one unit more (the gap) and the total one
    more beside it (no gap), read by the scorer itself (wrong 0);
  * the plain recall on every failing record stays wrong 0;
  * the s703w plan names only programs the committed census lists as units_unequal, and its guarded UPDATE names
    exactly the plan's rows;
  * the six colleges lane 1 held on 2026-11-22 and the parked colleges are untouched.

Run from repo root: python3 tests/program_lists_past_figure_s703_test.py
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
GAP = "lists_past_their_figure"


def course(units, alts=()):
    return {"code": "X %s" % units, "units": units, "units_max": None,
            "alternatives": [{"code": "Y", "units": a} for a in alts]}


def psych(core=(4, 3, 3), core_figure=9, total=18, computed=None, alts=(), list_figure=3):
    blocks = [{"rule": "all", "name": "Required Core Course", "stated": {"min": core_figure, "max": core_figure},
               "courses": [course(u, alts if i == 0 else ()) for i, u in enumerate(core)]}]
    for name in ("LIST A", "LIST B", "LIST C"):
        blocks.append({"rule": "choose_courses", "name": name, "minimum": 1,
                       "stated": {"min": list_figure, "max": list_figure} if list_figure else None,
                       "courses": [course(3), course(4)]})
    comp = computed or [sum(core) + 9.0, sum(core) + 12.0]
    return {"college": "Example College", "control_number": "99999", "award": "A.A.-T Degree",
            "record": {"program": {"measure": "units"}, "blocks": blocks, "notes": []},
            "score": {"coverage": {"pass": True, "share": 1.0}, "invented": {"pass": True},
                      "arithmetic": {"pass": False, "status": "unequal", "computed": comp, "stated": [total, total],
                                     "against": "program",
                                     "why": ["the blocks sum to %s-%s; the catalog states %s-%s"
                                             % (comp[0], comp[1], total, total)]}}}


def named(f):
    return (NG.answer(f) or (None,))[0], NG.held_answer(f)


f = psych()
check(named(f) == (GAP, GAP), "Santa Monica's shape (9 + 3 + 3 + 3 printed, 18 total, courses 19) takes the gap")
check("Required Core Course" in NG.lists_past_their_figure(f) and "18" in NG.lists_past_their_figure(f),
      "the words name the list and the printed total")
check(NG.confidence(f, GAP)["unit_arithmetic"] == 60 and GAP in NG.GAPS, "unit arithmetic 60; the gap has its sentence")
check(named(psych(total=20))[0] != GAP and named(psych(total=20))[1] != GAP,
      "figures that do not add to the printed total take no gap")
check(named(psych(core=(3, 3, 2), computed=[17.0, 20.0]))[0] != GAP, "a sum short of the total takes no gap")
blank = psych()
blank["record"]["blocks"][0]["courses"][0]["alternatives"] = [{"code": "Y", "units": None}]
check(named(blank) == (None, None), "a blank 'or' alternative is units rule A4's, never this gap")
check(named(psych(list_figure=None))[0] != GAP, "a list that prints no figure takes no gap")

res = NG.run(write=False, gaps=(GAP,), skip=LANE_1_S703, census_causes=("units_unequal",))
lr = res["lists_recall"]
check(lr["held"] > 10000 and lr["right"] == lr["held"] and lr["wrong"] == 0
      and lr["by_kind"].get("all", 0) > 1000 and lr["by_kind"].get("choose_courses", 0) > 1000,
      "self-recall, a list's courses and the total moved: held %d, right %d, wrong %d, by kind %s (%s)"
      % (lr["held"], lr["right"], lr["wrong"], lr["by_kind"], lr["wrong_keys"][:3]))
rc = res["recall"]
check(rc["wrong"] == 0 and rc["by_answer"].get(GAP, 0) > 30,
      "the plain recall with the new rule: right %d, wrong %d" % (rc["right"], rc["wrong"]))

with open(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-22_s703w.json"),
          encoding="utf-8") as fh:
    plan = json.load(fh)
keys = {(r["college"], str(r["control_number"])) for r in plan["records"]}
census = NG.census_keys(("units_unequal",))
check(plan["only_gaps"] == [GAP] and plan["census_causes"] == ["units_unequal"], "one gap, at one census cause")
check(keys and keys <= census, "every plan row is a census units_unequal program (%d of %d)" % (len(keys & census),
                                                                                            len(keys)))
check(all(r["gap"] == GAP and r["after_image"]["checks"].get("gaps") == [GAP]
          and not (r["before_image"]["checks"] or {}).get("gaps") for r in plan["records"]),
      "each row takes the gap, and none filed a gap before")
check(not {c for c, _ in keys} & set(LANE_1_S703), "no plan row at a lane 1 college")
check(not {c for c, _ in keys} & set(G.PARKED), "no plan row at a parked college")
check(len(set(plan["held_colleges"])) == len(plan["held_colleges"]) and set(LANE_1_S703) <= set(plan["held_colleges"]),
      "the receipt names each held college once, the six lane 1 colleges among them")
with open(os.path.join(ROOT, "kb", "migrations", "2026-11-22_s703w_prreq_named_gaps_apply.sql"), encoding="utf-8") as fh:
    sql_keys = set(re.findall(r"^\s*\(\d+, '([^']+)', '(\d{5})', \d+,", fh.read(), re.M))
check(sql_keys == keys, "the guarded UPDATE names exactly the plan's rows (%d of %d)" % (len(sql_keys), len(keys)))
for college, cn in sorted(keys):
    with open(os.path.join(ROOT, "kb", "program_requirements_college", C.slug_of(college), "records", cn + ".json"),
              encoding="utf-8") as fh:
        filed = json.load(fh)
    check([g.get("gap") for g in filed["score"].get("gaps") or []] == [GAP], "%s %s: the record files the gap"
          % (college, cn))
for college in LANE_1_S703:
    for p in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", C.slug_of(college), "records", "*.json")):
        with open(p, encoding="utf-8") as fh:
            sc = json.load(fh).get("score") or {}
        check(GAP not in [g.get("gap") for g in sc.get("gaps") or [] if isinstance(g, dict)],
              "%s: a lane 1 college's record carries no %s" % (os.path.relpath(p, ROOT), GAP))

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: lists_past_their_figure (S703)" % (checks[0], checks[0]))
