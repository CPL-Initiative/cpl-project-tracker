#!/usr/bin/env python3
"""S740, lane 1 at San Bernardino Valley: the census's 15 wording-rule records, 2 passed by the reconcile, 6 with named
gaps, 7 held.

WHY. kb/_program_piles_s740_sbvc.py reads the census's reconcile_steps records at San Bernardino Valley College. Two
pass on the free reconcile, which reads CDEV 160 and five SOCI courses as the file's CD and SOC rows
(tests/program_reconcile_s740_test.py); they are no keys of the plan. Of the other thirteen, six are collected with a
named gap and seven are held. The shared checks are tests/program_piles_s739_common.py's.

Pinned here beside them:
  * the lever's 15 are the two the reconcile passed and the plan's thirteen keys;
  * the pages' own words (college-page-read run 45835049303, line for line): Political Science prints 'Major Total
    Units 18-19' over lists that add to 21-22, and Music A.A.-T 'Major Total 21-22' over lists that add to 20-21; each
    is listed in kb/program_total_differs.json with those figures, and the record rule names the gap;
  * the placement waiver: the block's own heading says 'or place into', it prints 0-4 over the one 4-unit course, and
    read at 0-4 the record gives the printed range; a block without those words, or a course at another figure, is
    no waiver;
  * the two notes that quote both figures;
  * the holds: 04894 passes today's scorer without the state's list and fails with it; 35833's sum sits inside its
    printed range; 22784's run is posted by no committed receipt; 22821 was read from the department page; and the
    Audio Production page prints fewer courses than its lists ask for.

Run from repo root: python3 tests/program_piles_s740_sbvc_test.py
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
import _program_piles_s740_sbvc as M  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"32309": "total_differs", "35802": "total_differs", "22771": "waived_course_counted",
        "22776": "waived_course_counted", "22820": "noted_figures_differ", "12197": "noted_figures_differ"}
HELD = {"04873": ["one course under 'Two courses from the following'", "a new kind is shared code"],
        "04894": ["today's scorer passes its own arithmetic without the state's list", "MUS 241X2"],
        "17829": ["two gaps on one row"], "22784": ["45355976381", "waived_course_counted"],
        "22821": ["not the program's own page", "Total Units 20", "a paid read of 22821"],
        "35833": ["d-within-range-sums-hold-for-units-kind-s739"], "39483": ["the reader's own reading", "a paid reread"]}
SCORES = {"total_differs": 50, "waived_course_counted": 50, "noted_figures_differ": 40}
t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=18, prior_held=set(M.KEYS))
check = t.check

with open(os.path.join(B.ROOT, "kb", "status", "harvest_gap_census.json"), encoding="utf-8") as fh:
    census = json.load(fh)
# The run took its keys from the census's reconcile_steps lever. Once its piles land the census rebuilds and the
# records it resolved leave the lever, or the lever leaves the census when none is left (S736, 2026-11-26, after #3892
# and the census run 45870806616). So the lever may only shrink, never gain a record the run did not hold.
lever = next((e for e in census["levers"] if e["lever"] == "reconcile_steps" and e["scope"] == M.COLLEGE), {"members": []})
check(set(lever["members"]) <= set(M.LEVER) and set(M.LEVER) == set(M.KEYS) | set(M.PASSED_BY_RECONCILE)
      and not set(M.KEYS) & set(M.PASSED_BY_RECONCILE),
      "the lever's 15 are the two the reconcile passed and the plan's thirteen keys")
for cn in M.PASSED_BY_RECONCILE:
    f = W.load(cn)
    sc = S.score(f["record"], C.closed_list(M.COLLEGE, cn), None, f.get("award"), R.prefix_aliases(M.COLLEGE), False)
    check(S.passes_live(sc) and not (f["score"].get("gaps") or []),
          "%s passes as the live table counts it under the college's entry, and carries no gap" % cn)

# ── the pages' own words (college-page-read run 45835049303; a tab between a row's cells) ────────────────────
POLS = """Required Courses:
POLS C1000\tAmerican Government and Politics\t3
or POLS C1000H\tAmerican Government and Politics - Honors
POLS 110\tIntroduction to Political Theory\t3
or POLS 110H\tIntroduction to Political Theory - Honors
POLS 140\tIntroduction to Comparative Politics\t3
POLS 141\tIntroduction to World Politics\t3
or POLS 141H\tIntroduction to World Politics - Honors
List A - Two courses from the following:
POLS 170\tIntroduction to the Politics of Race and Gender\t3
POLS 173\tCalifornia Government\t3
POLS 138\tService Learning: Student Leadership\t3
or POLS 138H\tService Learning: Student Leadership - Honors
POLS 139\tService Learning: Community Leadership\t3
or POLS 139H\tService Learning: Community Leadership - Honors
ECON 208\tBusiness and Economic Statistics\t4
or STAT C1000\tIntroduction to Statistics
or STAT C1000H\tIntroduction to Statistics - Honors
or PSYC 105\tStatistics for the Behavioral Sciences
List B - One course from the following:
ANTH 102\tCultural Anthropology\t3
COMM 135\tMass Media and Society\t3
Major Total Units\t18-19
Total Double-Counted Units\t9
General Education (Cal-GETC) Units\t34
Elective Units\t16-17
Total Units\t60
"""
MUSIC = """Required Courses:
MUS 101\tMusic Theory I: Fundamentals\t3
MUS 101L\tMusicianship I\t1
MUS 102\tMusic Theory II: Scales and Modes\t3
MUS 102L\tMusicianship II\t1
MUS 201\tMusic Theory III: Basic Harmony\t3
MUS 201L\tMusicianship III\t1
Applied Music:
MUS 141X2
& MUS 241X2\tApplied Music I
and Applied Music II\t1
Large Ensemble:
Select four units from the following:\t4
MUS 150X4\tMixed Chorus\t1
List A - (3-4 units)
MUS 100\tMusic Appreciation\t3
Major Total\t21-22
Total Double-Counted Units\t3
"""


def units(section):
    return [float(x) for x in re.findall(r"^(?!or )[A-Z]+ [A-Z]?\d+[A-Z0-9]*\t[^\t]+\t(\d+(?:\.\d+)?)$", section, re.M)]


req, rest = POLS.split("List A - Two courses from the following:\n")
list_a, rest = rest.split("List B - One course from the following:\n")
a, b = sorted(units(list_a)), units(rest)
add = (sum(units(req)) + sum(a[:2]) + min(b), sum(units(req)) + sum(a[-2:]) + max(b))
check(add == (21.0, 22.0) and "Major Total Units\t18-19" in POLS,
      "Political Science prints 'Major Total Units 18-19' over lists that add to 21-22 (%r)" % (add,))
req = MUSIC.split("Applied Music:")[0]
add = (sum(units(req)) + 1 + 4 + 3, sum(units(req)) + 1 + 4 + 4)
check(add == (20.0, 21.0) and "and Applied Music II\t1" in MUSIC and "Select four units from the following:\t4" in MUSIC
      and "List A - (3-4 units)" in MUSIC and "Major Total\t21-22" in MUSIC,
      "Music A.A.-T prints 'Major Total 21-22' over lists that add to 20-21 (%r)" % (add,))
listed = NG.total_differs_list()
for cn, total, total_sum, words, page in (("32309", [18, 19], [21, 22], "Major Total Units 18-19", POLS),
                                          ("35802", [21, 22], [20, 21], "Major Total 21-22", MUSIC)):
    e = listed.get((M.COLLEGE, cn)) or {}
    check(e.get("printed_total") == total and e.get("printed_sum") == total_sum and e.get("run") == "45835049303"
          and e.get("words") == words and words.replace(" 1", "\t1").replace(" 2", "\t2") in page,
          "%s is listed with the page's two figures, its run and the total's own words" % cn)
    f = W.load(cn)
    bare = dict(f, score={k: v for k, v in f["score"].items() if k not in ("gaps", "confidence")})
    check(NG.answer(bare) == ("total_differs", NG.total_differs(bare)) and "45835049303" in NG.total_differs(bare),
          "%s: the record rule names total_differs, with its run" % cn)
    off = copy.deepcopy(bare)
    off["score"]["arithmetic"]["computed"] = [x + 1 for x in off["score"]["arithmetic"]["computed"]]
    check(NG.total_differs(off) is None, "%s: a record that reads another sum takes no total_differs" % cn)

# ── the placement waiver ───────────────────────────────────────────────────
for cn in ("22771", "22776"):
    f = W.load(cn)
    e = M.REVIEWED[cn]
    check(M.placement_waiver(f, e), "%s: the block says 'or place into', prints 0-4 over TECALC 087, and closes at 0-4" % cn)
    g = copy.deepcopy(f)
    for b_ in g["record"]["blocks"]:
        if b_["name"] == M._MATH:
            b_["name"] = "Complete the following:"
    check(not M.placement_waiver(g, dict(e, block="Complete the following:")),
          "%s: a block whose heading does not say 'or place into' is no waiver" % cn)
    g = copy.deepcopy(f)
    for b_ in g["record"]["blocks"]:
        if b_["name"] == M._MATH:
            b_["stated"] = {"min": 4, "max": 4}
    check(not M.placement_waiver(g, e), "%s: a block the page prints at 4 alone is no waiver" % cn)
    g = copy.deepcopy(f)
    for b_ in g["record"]["blocks"]:
        for c in b_["courses"]:
            if S.norm_code(c["code"]) == "TECALC87":
                c["units"] = 3
    check(not M.placement_waiver(g, e), "%s: the course at another figure does not close the range" % cn)

# ── the two notes ──────────────────────────────────────────────────────────
for cn in ("22820", "12197"):
    check(B.shape_note_quotes(W.load(cn), M.REVIEWED[cn]), "%s: its note quotes both figures" % cn)

# ── the holds ──────────────────────────────────────────────────────────────
f = W.load("04894")
check(B.scorer_passes(f) and B.arithmetic(f)["status"] == "unequal",
      "04894 passes today's scorer without the state's list and fails with it")
a = W.load("35833")["score"]["arithmetic"]
check(a["stated"][0] <= a["computed"][0] and a["computed"][1] <= a["stated"][1],
      "35833's 19-22 sits inside its printed 18.5-22")
f = W.load("22784")
check(str(f["extracted_run"]) == "45355976381" and not W.on_live_run(f), "22784's run is posted by no committed receipt")
f = W.load("22821")
check(f["source_url"].rstrip("/").endswith("/pharmacy-technology") and f["score"]["arithmetic"]["why"] == [NG.NO_TOTAL_WHY]
      and any("program overview page" in n for n in B.notes(f)),
      "22821 was read from the department page, and names no total")
AUDIO = """Two courses from the following:
FTVM 112\tFilm Audio Production\t3
Four courses from the following:
FTVM 213\tRadio and Podcast Operations\t3
THART 131\tSound for Stage and Screen\t3
Work Experience - Complete a minimum of three units from the following:
"""
two, four = AUDIO.split("Four courses from the following:\n")
check(len(units(two)) == 1 and len(units(four.split("Work Experience")[0])) == 2,
      "the Audio Production page prints one course under 'Two courses' and two under 'Four courses'")
for cn in HELD:
    check(W.outcome(W.load(cn))[0] == "none", "%s: the plan names no gap for it" % cn)
sys.exit(t.done())
