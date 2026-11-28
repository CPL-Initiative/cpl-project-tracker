#!/usr/bin/env python3
"""S752: the no_state_course_list rule in kb/_program_named_gaps.py.

    python3 tests/program_named_gaps_no_list_s752_test.py

A program the state's Program Course File lists no course for is read from the page the catalog lookup found as its
own (S748). The scorer fails its coverage with the gap named (S.NO_LIST_GAP, S750). The lane (NEXT (3),
docs/reference/lanes/program-requirements-harvest.md) words the rule: the gap is filed where coverage.no_list is the
sole reason, the record is from its own page, places at least one course and adds to a printed total. This file builds
one record through the real scorer that meets all four, then breaks each condition alone, and checks:

  1. the record meets the rule and takes the gap with its words; RECORD_RULES and answer() name it.
  2. each condition broken alone, by the scorer where it can be (a listed course, an unflagged course, no course,
     no printed total, a total the courses miss) and by the source where it cannot (another method, another address,
     a lookup that did not find the page), returns no gap.
  3. no other record rule fires on it, and the rule fires on no filed record today (none is scored against an empty
     list), so filing it moves nothing.
  4. collected_no_list(), the census's half: a live row with the gap, coverage false, invented true and the units
     check equal is collected; each of those broken alone is not.

MUTATIONS (run 2026-11-28 on kb/_program_named_gaps.py, one at a time, each restored; each goes red):
  sole reason      no_list_sole_reason always true: 3. Its no_list and nothing-listed test dropped: 1. Its
                   invented test dropped: 1.
  own page         no_list_own_page always true: 8. Its address test dropped: 1. Its method and no-list source
                   test dropped: 2. Its test of the lookup's answer dropped: 1.
  one course       the at-least-one test dropped: 1.
  printed total    no_list_printed_total always true: 4. "unstated" admitted: 1. An hours total_only admitted: 1.
  the census half  collected_no_list ignores the units check: 2.
  the rule left out of RECORD_RULES: 2.
Pure stdlib.
"""
import copy
import glob
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_requirements_college as C  # noqa: E402
import _program_requirements_score as S  # noqa: E402

FAILS, N = [], [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


URL = "https://c.edu/programs/viticulture-as.php"
TEXT = ("Viticulture Associate in Science Degree Program\nRequired Core Courses\nVIT 101 Introduction to Vines 3\n"
        "VIT 102 Vineyard Practice 3\nTotal Required Units 6\n")


def record(courses=(("VIT 101", 3, True), ("VIT 102", 3, True)), total=6):
    return {"program": {"measure": "units", "total_units": {"min": total, "max": total} if total is not None else None,
                        "degree_total": {"min": None, "max": None}, "ge_units": {"min": None, "max": None},
                        "degree_elective_units": {"min": None, "max": None}, "open_elective_units": None},
            "blocks": [{"name": "Required Core Courses", "rule": "all",
                        "courses": [{"code": c, "units": u, "alternatives": [], "catalog_addition": f}
                                    for c, u, f in courses]}]}


def filed(rec=None, closed=(), text=TEXT, url=URL):
    rec = record() if rec is None else rec
    return {"college": "Fixture College", "control_number": "10001", "title": "Viticulture", "award": "A.S. Degree",
            "source_url": url, "record": rec, "score": S.score(rec, list(closed), text, "A.S. Degree")}


SRC = {"control_number": "10001", "method": C.NCL_FOUND_METHOD, "listed": 0,
       "source": {"url": URL, "no_closed_list": True},
       "catalog_lookup": {"result": "found", "page": {"url": URL, "h1": "Viticulture Associate in Science"}}}

# ── 1. the record that meets the rule ────────────────────────────────────────────────────────────
print("1. a record that meets all four conditions")
F = filed()
sc = F["score"]
check(sc["coverage"]["pass"] is False and sc["coverage"]["no_list"]["gap"] == NG.NO_LIST == "no_state_course_list"
      and sc["invented"]["pass"] and sc["arithmetic"]["pass"] and sc["arithmetic"]["status"] == "equal",
      "the scorer fails its coverage for the empty list alone; invented and the units check pass")
words = NG.no_state_course_list(F, SRC)
check(bool(words) and URL in words and "places 2 courses" in words and "printed total 6" in words,
      "it takes the gap with its words: %s" % words)
check(NG.NO_LIST in NG.GAPS and NG.RECORD_RULES[-1][0] == NG.NO_LIST
      and NG.RECORD_RULES[-1][1] is NG.no_state_course_list,
      "the gap has its sentence and is the last record rule")

# answer() reads the source from the college's folder: a temporary folders root stands in for the committed one.
REAL_DIR = NG.COLLEGE_DIR
with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, C.slug_of(F["college"])))
    with open(os.path.join(tmp, C.slug_of(F["college"]), "sources.json"), "w", encoding="utf-8") as fh:
        json.dump([SRC], fh)
    NG.COLLEGE_DIR = tmp
    try:
        ans = NG.answer(F)
        ans_other = NG.answer(dict(F, control_number="10002"))
    finally:
        NG.COLLEGE_DIR = REAL_DIR
check(ans is not None and ans[0] == NG.NO_LIST and ans[1] == words and ans_other is None,
      "answer() finds the record's source in its college's sources.json and names the gap; a program with no "
      "source entry takes none")
check(NG.no_state_course_list(F) is None,
      "with no sources.json for the college, nothing says the page is its own, so no gap")

# ── 2. each condition broken alone ───────────────────────────────────────────────────────────────
print("2. each condition broken alone")
listed = filed(closed=[{"code": "VIT 101", "units": 3}, {"code": "VIT 999", "units": 3}])
check(listed["score"]["coverage"]["pass"] is False and "no_list" not in listed["score"]["coverage"]
      and NG.no_state_course_list(listed, SRC) is None,
      "SOLE REASON: a listed program whose coverage fails on an unexplained course takes no gap")
other_reason = copy.deepcopy(F)
other_reason["score"]["coverage"] = {"pass": False, "listed": 2, "placed": 2, "missing": [], "unexplained": [],
                                     "none_placed": False}
check(NG.no_state_course_list(other_reason, SRC) is None,
      "SOLE REASON: a coverage failure that is not the empty list's (a listed program, no no_list named) takes no gap")
unflagged = filed(record(courses=(("VIT 101", 3, True), ("VIT 102", 3, False))))
check(unflagged["score"]["invented"]["pass"] is False and NG.no_state_course_list(unflagged, SRC) is None,
      "SOLE REASON: a course the record does not flag as a catalog addition fails invented, so no gap")
for name, src in (("another method", dict(SRC, method="sitemap_page")),
                  ("not the lookup's no-list source", dict(SRC, source={"url": URL})),
                  ("another address", dict(SRC, source=dict(SRC["source"], url=URL.replace(".php", ".xml")))),
                  ("the lookup did not find it", dict(SRC, catalog_lookup={"result": "not_matched"})),
                  ("the lookup found another page", dict(SRC, catalog_lookup={"result": "found",
                                                                              "page": {"url": URL + "?x"}}))):
    check(NG.no_state_course_list(F, src) is None, "OWN PAGE: %s, so no gap" % name)
check(NG.no_state_course_list(filed(url=URL + "?x"), SRC) is None,
      "OWN PAGE: the record read from another address than its source's, so no gap")
none_placed = copy.deepcopy(F)
none_placed["record"]["blocks"] = []
check(NG.no_state_course_list(none_placed, SRC) is None and NG.no_list_placed(F) == 2
      and NG.no_list_placed(none_placed) == 0,
      "AT LEAST ONE COURSE: a record that places none takes no gap, whatever its score says")
unstated = filed(record(total=None), text="Viticulture Associate in Science\nVIT 101 Introduction\nVIT 102 Practice\n")
check(NG.no_state_course_list(unstated, SRC) is None and unstated["score"]["arithmetic"]["status"] in (
      "unstated", "incomplete"),
      "PRINTED TOTAL: a record that names no total takes no gap (%s)" % unstated["score"]["arithmetic"]["status"])
forced = copy.deepcopy(F)
forced["score"]["arithmetic"] = {"pass": True, "status": "unstated", "computed": None, "stated": None}
check(NG.no_state_course_list(forced, SRC) is None,
      "PRINTED TOTAL: 'unstated', which passes a page that prints no figure, is no printed total")
short = filed(record(total=9))
check(short["score"]["arithmetic"]["pass"] is False and NG.no_state_course_list(short, SRC) is None,
      "PRINTED TOTAL: courses that add to 6 against a printed 9 take no gap")
total_only = copy.deepcopy(F)
total_only["score"]["arithmetic"] = dict(F["score"]["arithmetic"], computed=None, total_only=True)
check(NG.no_state_course_list(total_only, SRC) is None,
      "PRINTED TOTAL: an hours total read with no course's hours added is no sum")

# ── 3. no other rule, and no filed record today ─────────────────────────────────────────────────
print("3. the rule beside the others, and on the filed records")
others = [n for n, fn in NG.RECORD_RULES if n != NG.NO_LIST and fn(F)]
check(not others, "no other record rule fires on the record (%s)" % others)
fired, no_list, n = [], 0, 0
for path in sorted(glob.glob(os.path.join(NG.COLLEGE_DIR, "*", "records", "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    s = f.get("score") or {}
    n += 1
    no_list += bool((s.get("coverage") or {}).get("no_list"))
    if NG.no_list_sole_reason(s) and NG.no_list_printed_total(s) and NG.no_state_course_list(f):
        fired.append((f.get("college"), f.get("control_number")))
check(n > 15000 and no_list == 0 and not fired,
      "of %d filed records, %d are scored against an empty list and the rule fires on %d: it moves nothing today"
      % (n, no_list, len(fired)))

# ── 4. the census's half ─────────────────────────────────────────────────────────────────────────
print("4. collected_no_list, for the census")
LIVE = {"coverage": False, "invented": True, "arithmetic": "equal", "gaps": [NG.NO_LIST]}
check(NG.collected_no_list(LIVE), "a live row with the gap, coverage false for it, invented true and the units equal")
for name, row in (("no gap", dict(LIVE, gaps=[])), ("another gap", dict(LIVE, gaps=["no_units_read"])),
                  ("invented fails", dict(LIVE, invented=False)), ("units unequal", dict(LIVE, arithmetic="unequal")),
                  ("units unstated", dict(LIVE, arithmetic="unstated")), ("coverage unknown", dict(LIVE, coverage=None))):
    check(not NG.collected_no_list(row), "not collected: %s" % name)
check(not NG.collected_no_list(None) and not NG.collected_no_list({}), "no checks, not collected")

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
