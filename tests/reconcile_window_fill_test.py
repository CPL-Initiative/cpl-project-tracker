#!/usr/bin/env python3
"""An electives fill never passes a record over a window the reader cut off (S655; widened S720).

THE CASES. American River 07206 (CIS: Microcomputer Applications, A.A.) was read from page 429 of the 2026-2027
catalog PDF, a window that opens in the middle of the program's course table. Its record places 20 of 32 listed
courses; each of the 12 missing codes carries the reader's own note that the start of the table, on page 428, was
not in the text. The S655 course-id reconcile (run 43693265189) rescored it from the same page, and the electives
fill on the program total (fill 17 to 17) made the arithmetic equal: the held false pass of
p-degree-electives-fill-false-pass-s650 (second reader, #3352).
S714's three free Los Rios reconciles passed eight more the same way (f-elective-fill-passes-cut-off-windows-s714):
Sacramento City 04656, 07350 and 21418; Cosumnes River 04602 and 04614; Folsom Lake 15368, 39574 and 42612, each
record's notes saying its table opens mid-page with rows cut off. S655's guard read six colleges and a note pattern
("start of the table", "not included", "likely on page N") that matched none of them ("cut off", "begins
mid-table", "not supplied").

THE FIX (S720). The scorer reads the record's own words before either electives fill (the program total's in
score(), the degree total's in degree_verdict): S.window_cut returns the reader's sentence saying the requirements
run outside the text, and the fill is refused (arithmetic "unequal", fill_refused naming section_cut_off). A degree
whose major adds up to its printed major total keeps its degree fill: the electives there fill the degree after a
whole major, the case the fill was built for.

WHAT THIS PINS.
  1. 07206 by hand, on the committed record: 32 listed, 20 placed, the arithmetic unequal at 20 against 37.
  2. The class over pinned fixtures (tests/fixtures/reconcile_window_fill/, copies of the records as filed on main
     at 56c38abf, never the live census): with the guard off (main's scorer) each S714 and S655 record passes
     through a fill, so the fixture shows the class; with the guard on each fails with fill_refused. American River
     04544 is the one committed record that passes through the fill today (held for the guarded plan). The
     negatives keep passing: a whole major's degree fill (College of the Desert 30553), San Joaquin Delta 11970's
     certificate fill (S424) and Butte 01329.
  3. Boundary readings of window_cut: the words of a lost heading, outcomes list, course descriptions or careers
     are not a cut window; the words of a lost table, core or rows are.
  4. Every college, from an independent word list (mid-table, start of table, cut off, not supplied, truncated,
     previous page, partway, may be missing, likely on page N) over each record a rescore passes through a fill: the
     scorer refuses every one, apart from five read by hand whose words concern a heading or an outcome, or
     hedge with every listed course placed (Cypress 37246).
  5. Every college, filed: no record passes through a fill over a cut window, apart from American River 04544,
     which the guarded plan kb/receipts/program_requirement_records_cut_window_fill_s720.json moves.

    python3 tests/reconcile_window_fill_test.py
"""
from __future__ import annotations

import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_score as S  # noqa: E402

FAILS: list[str] = []


def check(ok: bool, what: str) -> None:
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


COLLEGE_DIR = os.path.join(ROOT, "kb", "program_requirements_college")
FIXTURES = os.path.join(ROOT, "tests", "fixtures", "reconcile_window_fill")
PLAN = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_cut_window_fill_s720.json")
REAL_CUT = getattr(S, "window_cut", None)
check(callable(REAL_CUT), "the scorer reads the record's own words for a cut window (S.window_cut)")


def tab(sc: dict) -> bool:
    return S.counts_passing_on_tab({"coverage": (sc.get("coverage") or {}).get("pass"),
                                    "invented": (sc.get("invented") or {}).get("pass"),
                                    "arithmetic": (sc.get("arithmetic") or {}).get("status")})


def fixture(name: str) -> dict:
    with open(os.path.join(FIXTURES, name), encoding="utf-8") as fh:
        return json.load(fh)


def arith(f: dict, guard: bool = True) -> dict:
    """The record's arithmetic rescored from the filed record alone (no closed list, no text), with the cut guard on
    or off (off: the scorer as main had it, which never read the record's words)."""
    if not guard and REAL_CUT is not None:
        S.window_cut = lambda r: None
    try:
        return S.score(f["record"], [], None, f.get("award"))["arithmetic"]
    finally:
        if REAL_CUT is not None:
            S.window_cut = REAL_CUT


def filled(a: dict) -> bool:
    """The arithmetic passes through an electives fill that adds units (the program total's, or the degree's where
    no major that adds up to its own printed total stands under it)."""
    if not a.get("pass") or (a.get("major") or {}).get("pass") is True:
        return False
    # The top-level check's own fill: a degree check riding under a passing program total fills after a whole major.
    return bool(a.get("fill") and max(a["fill"]) > S.TOL)


def refused(a: dict) -> dict:
    return a.get("fill_refused") or (a.get("degree") or {}).get("fill_refused") or {}


# ── 1. American River 07206, by hand ──────────────────────────────────────────────────────────────
with open(os.path.join(COLLEGE_DIR, "american_river", "records", "07206.json"), encoding="utf-8") as fh:
    r = json.load(fh)
sc = r["score"]
cov, a = sc["coverage"], sc["arithmetic"]
notes = {S.norm_code(m["code"]): m.get("why") or "" for m in r["record"].get("missing_explained") or []}
check(str(r.get("extracted_run")) == "39047245752" and "read_run" not in r,
      "07206 keeps run 39047245752 and carries no read_run, so step=reread never posts it")
check(cov["listed"] == 32 and cov["placed"] == 20 and len(cov["missing"]) == 12,
      "07206 places 20 of 32 listed courses, 12 missing (%s of %s, %d)" % (cov["placed"], cov["listed"], len(cov["missing"])))
check(all("428" in notes.get(k, "") or "start of table" in notes.get(k, "") for k in cov["missing"]),
      "each of 07206's 12 missing codes is noted as outside the window (page 428, the table's start)")
check(a.get("status") == "unequal" and a.get("computed") == [20.0, 20.0] and a.get("stated") == [37.0, 37.0]
      and "fill" not in a, "07206's blocks sum to 20 against 37, with no fill")
check(not sc.get("pass") and not tab(sc), "07206 fails, and the tab does not count it passing")

# ── 2. The class over pinned fixtures ─────────────────────────────────────────────────────────────
as_reconciled = fixture("american_river_07206_run_43693265189.json")
a = as_reconciled["score"]["arithmetic"]
check(str(as_reconciled.get("extracted_run")) == "43693265189" and a.get("fill") == [17.0, 17.0]
      and a.get("status") == "equal" and tab(as_reconciled["score"]),
      "the fixture is 07206 as S655's reconcile filed it (run 43693265189, fill 17 to 17, counted passing)")
new = arith(as_reconciled)
check(not new.get("pass") and refused(new).get("gap") == "section_cut_off",
      "07206 as the reconcile read it: the scorer now refuses the fill (section_cut_off)")

# The records S714's reconciles passed through the fill, pinned as main filed them (the read the reconcile rescored),
# and the two the S720 sweep found beside them: American River 04544 (passing today) and East Los Angeles 02430
# (the degree's fill: "The Skills Certificate course list falls on the previous page").
CLASS = (("sacramento_city_04656.json", "program", "begins mid-table on page 221"),
         ("sacramento_city_07350.json", "program", "start of the required course table are on the previous page"),
         ("folsom_lake_42612.json", "program", "begins mid-table on page 359"),
         ("cosumnes_river_04614.json", "program", "likely in the required core on page 169"),
         ("american_river_04544.json", "program", "begins on page 941 mid-table"),
         ("east_los_angeles_02430.json", "degree", "falls on the previous page"))
for name, against, words in CLASS:
    f = fixture(name)
    off, on = arith(f, guard=False), arith(f)
    check(filled(off) and off.get("against") == against,
          "%s %s: main's scorer passes it through the %s fill (%s)" % (f["college"], f["control_number"], against,
                                                                       (off.get("fill") or (off.get("degree") or {}).get("fill"))))
    check(not on.get("pass") and on.get("status") == "unequal" and refused(on).get("gap") == "section_cut_off"
          and words in refused(on).get("words", ""),
          "%s %s: the fill is refused over the reader's words \"%s\"" % (f["college"], f["control_number"], words))

# Negatives: the fill's own cases keep passing.
for name, why in (("college_of_the_desert_30553.json", "its major adds up to its printed 18-19, so the degree's "
                   "electives fill after a whole major, though a note says the GE table is cut off"),
                  ("san_joaquin_delta_11970.json", "S424's certificate whose page says electives make up its 60"),
                  ("butte_01329.json", "no note says a row is outside the text")):
    f = fixture(name)
    on = arith(f)
    check(on.get("pass") and not refused(on) and on == arith(f, guard=False),
          "%s %s keeps passing, unchanged: %s" % (f["college"], f["control_number"], why))
f = fixture("east_los_angeles_37924.json")
check(REAL_CUT is not None and REAL_CUT(f["record"]) is None,
      "East Los Angeles 37924's note (the excerpt begins mid-section, its heading not shown) names no cut window")
# The second reader's negatives (S720): a hedge with every listed course placed, and a note that says nothing was
# lost. Each names no cut, so the scorer reads each as main's did.
for name, why in (("cypress_37246.json", "\"a 4-unit course may be missing from the list\", every listed course placed"),
                  ("riverside_city_43896.json", "\"a reviewer should check whether a required course is missing\", "
                   "every listed course placed"),
                  ("folsom_lake_33791.json", "\"no courses appear to be cut off\""),
                  ("cerritos_20493.json", "\"the program section itself appears complete\"")):
    f = fixture(name)
    check(REAL_CUT is not None and REAL_CUT(f["record"]) is None and arith(f) == arith(f, guard=False),
          "%s %s names no cut window and scores as main scored it: %s" % (f["college"], f["control_number"], why))

# The guard's two other readers (S720 second reader, the surviving mutants): the rescore never passes a refused
# degree fill again, and the named gaps file section_cut_off for a refused fill at any college.
import _program_requirements_rescore as RS  # noqa: E402
import _program_named_gaps as NG  # noqa: E402
ela = fixture("east_los_angeles_02430.json")
refiled = dict(ela, score=dict(ela["score"], arithmetic=arith(ela)))
check(refused(refiled["score"]["arithmetic"]).get("gap") == "section_cut_off" and RS._verdict(refiled) is None,
      "East Los Angeles 02430 as the scorer now files it: the rescore's degree verdict keeps the fill refused")
s_ok = RS._verdict(dict(refiled, record=dict(ela["record"], notes=[], missing_explained=[])))
check(s_ok is not None and s_ok.get("pass"),
      "the same sum with no cut in its words: the rescore's verdict passes it through the fill (the guard is what holds)")
ar = fixture("american_river_04544.json")
ar_after = dict(ar, score=dict(ar["score"], arithmetic=arith(ar), **{"pass": False}))
check(ar["college"] not in NG.CUT_OFF_COLLEGES and (NG.section_cut_off(ar_after) or "").startswith(
      "an electives fill was refused") and (NG.answer(ar_after) or ("",))[0] == "section_cut_off"
      and NG.held_answer(ar_after) == "section_cut_off",
      "American River 04544 refiled: the named gaps give section_cut_off outside the two gated colleges")
check(NG.section_cut_off(ar) is None, "04544 as filed (its fill passing) takes no gap")

# ── 3. Boundary readings ──────────────────────────────────────────────────────────────────────────
CUT = ("The supplied text begins mid-table at the top of page 177.",
       "The excerpt begins mid-section on page 538; the start of the required course table is on the previous page.",
       "The required core (presumably CS 40, CS 41, CS 42) is cut off on the previous page.",
       "Part of the requirements table may be missing from the extraction.",
       "The text opens partway through a program's requirements and then begins 'AA Kinesiology'.")
WHOLE = ("The Program Outcomes list is cut off at outcome 4.",
         "The catalog text begins mid-sentence; the program heading is cut off.",
         "The course descriptions at the end of the text are cut off at ARTF 179A. This does not affect the "
         "requirements list, which is complete.",
         "The Career Opportunities list is cut off at 'Community Health N'.",
         "SOCI C1000 is matched to the closed-list entry 'SOCIC1000' (missing space in the state file).",
         "The catalog text begins mid-list of other awards (certificates), which were ignored.",
         "The page refers to the Requirements tab, which is not in the text.",
         # The second reader's (S720): a resolved note, read before the opening words.
         "The TAP elective table continues across a repeated table header within the page; no courses appear to "
         "be cut off.",
         "The text begins partway through a navigation list of program titles (cut off at the start); the program "
         "section itself appears complete.")
# A cut counts only beside a listed course the record explains as missing; each reading carries one.
MISSING = [{"code": "ANTH 300", "why": "not in the text"}]
for s in CUT:
    check(REAL_CUT is not None and REAL_CUT({"notes": [s], "missing_explained": MISSING}) == s, "a cut window: %r" % s[:70])
    check(REAL_CUT is not None and REAL_CUT({"notes": [s]}) is None,
          "the same words with no missing course behind them are a hedge, not a cut: %r" % s[:50])
for s in WHOLE:
    check(REAL_CUT is not None and REAL_CUT({"notes": [s], "missing_explained": MISSING}) is None,
          "not a cut window: %r" % s[:70])
check(REAL_CUT is not None and REAL_CUT({"missing_explained": [{"code": "CIS 300", "why":
      "not in the provided text; likely on page 428 (start of table not included)"}]}),
      "a missing course placed on another page names a cut window")
check(REAL_CUT is not None and REAL_CUT({"missing_explained": [{"code": "CIS 300", "why":
      "appears only in course descriptions"}]}) is None, "a missing course placed outside the program does not")

# ── 4. Every college, rescored, against an independent word list ─────────────────────────────────
INDEPENDENT = re.compile(
    r"\bmid[-\s]?(?:table|list|section|page)\b|\bstart\s+of\s+(?:the\s+)?(?:requirements\s+)?table\b|\bcut[-\s]off\b"
    r"|\bnot\s+supplied\b|\btruncat\w*|\b(?:previous|preceding|prior|earlier)\s+page\b|\bpartway\b"
    r"|\bmay\s+be\s+missing\b|\blikely\s+on\s+page\s+\d", re.I)
# Read by hand at S720: the words these records carry concern a heading or an outcome, or hedge with every listed
# course placed; none says a requirement row is outside the text.
WORDS_ELSEWHERE = {("East Los Angeles College", "33382"): "the printed program heading is cut off",
                   ("East Los Angeles College", "37924"): "the excerpt begins mid-section; its heading is not shown",
                   ("Palo Verde College", "32242"): "the first program outcome appears truncated",
                   ("Porterville College", "06773"): "the section heading is not printed (text begins mid-section)",
                   # The S720 second reader: a hedge, every listed course placed, so no row is missing behind it.
                   ("Cypress College", "37246"): "\"a 4-unit course may be missing from the list\", a hedge"}
seen = refused_n = 0
for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    rec = f.get("record")
    if not isinstance(rec, dict) or not isinstance(f.get("score"), dict):
        continue
    if not (rec.get("program") or {}).get("electives_fill_degree") and not (rec.get("program") or {}).get("degree_total"):
        continue
    off = arith(f, guard=False)
    if not filled(off):
        continue
    words = [str(n) for n in rec.get("notes") or []] + [str(m.get("why") or "") for m in rec.get("missing_explained") or []]
    if not any(INDEPENDENT.search(w) for w in words):
        continue
    seen += 1
    key = (f.get("college"), str(f.get("control_number")))
    on = arith(f)
    if refused(on) and not on.get("pass"):
        refused_n += 1
    elif key not in WORDS_ELSEWHERE:
        check(False, "%s %s: a rescore passes it through a fill while its notes name a cut (%s)"
              % (key + (next(w for w in words if INDEPENDENT.search(w))[:120],)))
check(seen >= 19 and refused_n == seen - len(WORDS_ELSEWHERE),
      "every college: of %d records a rescore passes through a fill whose words name a cut, the scorer refuses %d "
      "and the %d read by hand keep their pass" % (seen, refused_n, len(WORDS_ELSEWHERE)))

# ── 5. Every college, filed ───────────────────────────────────────────────────────────────────────
HELD_FOR_PLAN = {("American River College", "04544")}
found = set()
for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    sc = f.get("score")
    if not isinstance(sc, dict) or not isinstance(f.get("record"), dict) or not filled(sc.get("arithmetic") or {}):
        continue
    if REAL_CUT is not None and REAL_CUT(f["record"]) and tab(sc):
        found.add((f.get("college"), str(f.get("control_number"))))
check(found <= HELD_FOR_PLAN, "every college, filed: no record counts passing through a fill over a cut window but "
      "the one the plan moves (%s)" % sorted(found - HELD_FOR_PLAN))
plan = json.load(open(PLAN, encoding="utf-8")) if os.path.exists(PLAN) else {}
named = {(m.get("college"), str(m.get("control_number"))) for m in plan.get("moved") or []}
check(found - named == set(), "the guarded plan names every filed false pass still on disk (%s)" % sorted(found - named))

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
