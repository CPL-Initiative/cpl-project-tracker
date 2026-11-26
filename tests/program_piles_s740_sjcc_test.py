#!/usr/bin/env python3
"""S740, lane 1 at San Jose City: the census's 15 wording-rule records, 9 passed by the reconcile, 4 with named gaps.

WHY. kb/_program_piles_s740_sjcc.py reads the census's reconcile_steps records at San Jose City College. Nine pass on
the free reconcile, which reads eleven courses the state's file lists under a cut-off name or number as the file's rows
and prices BIOL 020 (tests/program_reconcile_s740_test.py); they are no keys of the plan. Of the other six, four are
collected with a named gap and two wait for the reconcile's reread. The shared checks are
tests/program_piles_s739_common.py's.

Pinned here beside them:
  * the lever's 15 are the nine the reconcile passed and the plan's six keys, and each of the nine passes as the live
    table counts it under the college's entry, in either state of its record file;
  * the pages' own words (college-page-read run 45835049303): the Alcohol & Drug Studies certificate prints ADS 138 at
    1-6 under 'Total Units 41', and the other courses add to 37;
  * each row's own check: 22241 at ADS 138's 4 units and 33857 at THEAT 033's 3 add to their printed totals, and at
    any other whole figure they do not; 30403's elective list prints no figure; 37604's List A depends on the option
    and the record adds short of the printed low end;
  * the two holds: each is collectable only with the college's entry, and at the reconcile's run each is on its live
    run only once a committed reread receipt posts that run.

Run from repo root: python3 tests/program_piles_s740_sjcc_test.py
"""
import copy
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402

import _program_piles_s714_ccsf as C  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s740_sjcc as M  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"22241": "figure_within_variable_units", "33857": "noted_unit_floor", "30403": "lists_not_closed",
        "37604": "lists_not_closed"}
HELD = {"32078": ["until the reread of the reconcile posts its row", "required_list_outside_total"],
        "08859": ["until the reread of the reconcile posts its row", "total_differs", "Total Units 36"]}
SCORES = {"figure_within_variable_units": 60, "noted_unit_floor": 70, "lists_not_closed": 30}
t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=16, prior_held=set(M.KEYS))
check = t.check

with open(os.path.join(B.ROOT, "kb", "status", "harvest_gap_census.json"), encoding="utf-8") as fh:
    census = json.load(fh)
# The run took its keys from the census's reconcile_steps lever. Once its piles land the census rebuilds and the
# records it resolved leave the lever, or the lever leaves the census when none is left (S736, 2026-11-26, after #3892
# and the census run 45870806616). So the lever may only shrink, never gain a record the run did not hold.
lever = next((e for e in census["levers"] if e["lever"] == "reconcile_steps" and e["scope"] == M.COLLEGE), {"members": []})
check(set(lever["members"]) <= set(M.LEVER) and set(M.LEVER) == set(M.KEYS) | set(M.PASSED_BY_RECONCILE)
      and not set(M.KEYS) & set(M.PASSED_BY_RECONCILE),
      "the lever's 15 are the nine the reconcile passed and the plan's six keys")
STEPS = R.load_steps()


def entry_score(f):
    rec = R._college_steps(copy.deepcopy(f["record"]), " ", M.COLLEGE, f.get("award"), steps=STEPS)[0]
    return S.score(rec, C.closed_list(M.COLLEGE, f["control_number"]), None, f.get("award"),
                   R.prefix_aliases(M.COLLEGE, STEPS), False)


for cn in M.PASSED_BY_RECONCILE:
    f = W.load(cn)
    check(S.passes_live(entry_score(f)) and not (f["score"].get("gaps") or []),
          "%s passes as the live table counts it under San Jose City's entry, and carries no gap" % cn)
    check(W.outcome(f)[0] == "none", "%s: the plan names no gap for it" % cn)

# ── the page's own words (college-page-read run 45835049303, line for line; a tab between a row's cells) ─────
ADS = """Certificate Requirements
Course List
Course
Title
Credits
ADS 070\tIntroduction to Chemical Dependency\t3
ADS 071\tPharmacology/Physiology of Addiction\t3
ADS 072\tCodependency & Family Dynamics\t3
ADS 073\tCase Management\t3
ADS 074\tEthics, and Personal and Professional Growth\t3
ADS 075A\tCounseling Theories and Skills\t3
ADS 076\tLaw and Prevention: Community Response\t3
ADS 077A\tSupervised Practicum A\t2
ADS 077B\tSupervised Practicum B\t2
ADS 078\tIntegrated Behavioral Health\t3
ADS 079\tGroup Dynamics\t3
ADS 138\tWork Experience\t1-6
PSYC C1000\tIntroduction to Psychology\t3
or PSYC C1000H\tIntroduction to Psychology - Honors
SOC 010\tIntroduction to Sociology\t3
or SOC 010H\tHonors Introduction to Sociology
Total Units\t41
"""
fixed = [float(x) for x in re.findall(r"^(?!or )[A-Z]+ [A-Z]?\d+[A-Z]?\t[^\t]+\t(\d+(?:\.\d+)?)$", ADS, re.M)]
check(sum(fixed) == 37.0 and "ADS 138\tWork Experience\t1-6" in ADS and "Total Units\t41" in ADS,
      "the page prints ADS 138 at 1-6 under 'Total Units 41', and its other courses add to 37 (%r)" % sum(fixed))

# ── each row's own check ───────────────────────────────────────────────────
f = W.load("22241")
check(M.variable_course(f, M.REVIEWED["22241"]) and B.closes(f, B.apply_ops(f, [("units", "ADS 138", 4)])),
      "22241: ADS 138 prints a range, the printed 41 sits inside the record's 38-43, and at 4 units the courses add to it")
check(not any(B.closes(f, B.apply_ops(f, [("units", "ADS 138", n)])) for n in (1, 2, 3, 5, 6)),
      "22241: at any other whole figure ADS 138 does not give the printed 41")
g = copy.deepcopy(f)
for b in g["record"]["blocks"]:
    for c in b["courses"]:
        if S.norm_code(c["code"]) == "ADS138":
            c["units_max"] = None
check(not M.variable_course(g, M.REVIEWED["22241"]), "a course at one fixed figure is no variable course")
f = W.load("33857")
check(B.closes(f, B.apply_ops(f, [("units", "THEAT 033", 3)]))
      and not any(B.closes(f, B.apply_ops(f, [("units", "THEAT 033", n)])) for n in (1, 2)),
      "33857: at THEAT 033's required 3 units the courses add to the printed 23, and at 1 or 2 they do not")
row = B.course_rows(f, "THEAT 033")
check(len(row) == 1 and row[0]["units"] == 1 and row[0]["units_max"] == 3, "33857: the record prints THEAT 033 at 1-3")
f = W.load("30403")
check(B.shape_open(f, M.REVIEWED["30403"]) and f["score"]["arithmetic"]["why"]
      == ["'%s' chooses units but names no minimum" % M.ELECTIVES],
      "30403: the elective list prints no figure, the record's one arithmetic reason")
f = W.load("37604")
check(B.shape_depends(f, M.REVIEWED["37604"]) and len(B.blocks(f, M.LIST_A)) == 1,
      "37604: List A's count depends on the option, and the record adds short of the printed low end")

# ── the two holds ──────────────────────────────────────────────────────────
for cn in ("32078", "08859"):
    f = W.load(cn)
    sc = entry_score(f)
    check(NG.collectable(sc) and not S.passes_live(sc) and sc["arithmetic"]["status"] == "unequal",
          "%s: under the college's entry its course list is read and its units still fail" % cn)
    g = dict(f, extracted_run=1)
    check(not W.prior.on_live_run(g), "%s at a run no receipt posts is not on its live run" % cn)
    check(W.outcome(f)[0] == "none", "%s: the plan names no gap for it" % cn)
f = W.load("32078")
check(any("lies outside the 31-32 unit major total" in n and "also recorded in degree_elective_units" in n
          for n in B.notes(f)), "32078's note says its electives lie outside the major total and are counted twice")
f = W.load("08859")
check(f["score"]["arithmetic"]["computed"] == [24.0, 24.0] and f["score"]["arithmetic"]["stated"] == [36.0, 36.0],
      "08859 reads the page's two figures: 24 against the printed 36")
sys.exit(t.done())
