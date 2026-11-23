#!/usr/bin/env python3
"""S714, lane 2's cheap piles at Fullerton: the campus letter's place in the file's codes, its self-recall and the
plan (kb/_program_piles_s714_fullerton.py).

WHY. The S714 conductor's brief: Fullerton's 24 reconcile_steps records into passing records or named gaps by free
rule work, each rule with a claim check (the notes and today's capture), boundary readings and a precision count.
Pinned here:

  * the college's eight course_renumbers ("HORT 2 F" for the file's "F HORT002", "CSTR 42 F" for "CSTR 42"), each with
    its citation; the scorer reads them, and never where the program's list carries the printed form;
  * the second reader's fixes: PE 248 F takes no renumber (the file lists it as printed, PE248F "Foundations of Sport
    and Exercise Psychology", beside F PE248 "Psychology of Sport"), so 18166 keeps main's score; CRTV 196 F's cite
    reads the printed 0.5-3 units;
  * precision 24 of 24 against the hand reading (11 pass, 13 held); the claim checks: no note against, and the
    printed form found on every program's page by today's capture or the S714 free page read; 33 boundary readings;
  * the plan: 11 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans none;
    the load's image of each committed record is its receipt's after-image (the rows applied by migrate 45191999745).

Run from repo root: python3 tests/program_piles_s714_fullerton_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s714_fullerton.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_fullerton_2026-11-23_s714f.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-23_s714f_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

COLLEGE = "Fullerton College"
PASS = {"03816", "03839", "08438", "11690", "18747", "21252", "21266", "21271", "36790", "45320", "45378"}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# ── the reading ──
with open(os.path.join(ROOT, "kb", "program_requirements_reconcile.json"), encoding="utf-8") as fh:
    conf = json.load(fh)["colleges"][COLLEGE]
check(len(conf["course_renumbers"]) == 8 and conf["course_renumbers"]["HORT 2 F"] == "F HORT002"
      and conf["course_renumbers"]["CSTR 42 F"] == "CSTR 42", "the eight renumbers")
check(len(conf["course_renumbers_cited"]) == 8 and all(c["title"] and c["units"] and c["session"] == "S714"
                                                       for c in conf["course_renumbers_cited"]), "each is cited")
check({c["printed"]: c["file"] for c in conf["course_renumbers_cited"]} == conf["course_renumbers"],
      "each citation names its renumber's pair, and no other")
# The second reader: the file lists PE248F "Foundations of Sport and Exercise Psychology" beside F PE248 "Psychology
# of Sport", and the printed PE 248 F is the first, so it takes no renumber and 18166 keeps main's score.
check("PE 248 F" not in conf["course_renumbers"], "PE 248 F takes no renumber")
f18166 = F._load("18166")
check(F.rescore(f18166) is None and "course_renumbers" not in f18166["score"]
      and "FPE248" in f18166["score"]["coverage"]["unexplained"] and F.outcome(f18166) == "none"
      and F.HAND_HELD["18166"].startswith("held"), "18166 keeps main's score: no renumber reaches it, and it is held")
crtv = next(c for c in conf["course_renumbers_cited"] if c["printed"] == "CRTV 196 F")
check(crtv["units"] == 0.5 and crtv["units_max"] == 3 and "at 0.5-3 units" in crtv["evidence"],
      "CRTV 196 F's cite reads the printed 0.5-3 units: %r" % crtv)
rec = {"program": {"total_units": {"min": 8, "max": 8}},
       "blocks": [{"name": "R", "rule": "all", "courses": [{"code": "HORT 002 F", "units": 4},
                                                           {"code": "CSTR 042 F", "units": 4}]}]}
listed = [{"code": "F HORT002", "units": 4}, {"code": "CSTR 42", "units": 4}]
sc = S.score(rec, listed, None, "A.A. Degree", R.prefix_aliases(COLLEGE))
check(not sc["coverage"]["missing"] and not sc["invented"]["codes"], "the scorer reads HORT 002 F and CSTR 042 F: %r"
      % [sc["coverage"]["missing"], sc["invented"]["codes"]])
sc = S.score(rec, listed + [{"code": "HORT 002 F", "units": 4}], None, "A.A. Degree", R.prefix_aliases(COLLEGE))
check("FHORT2" in sc["coverage"]["missing"], "where the list carries HORT 002 F too, the code stays as printed")

# ── the self-recall ──
pr = F.precision(CENSUS_AT_PLAN)
check(pr["read"] == 24 and pr["right"] == 24 and not pr["wrong"] and pr["by_answer"] == {"passes": 11, "none": 13},
      "precision: %r" % pr)
check({cn for cn, w in F.HAND_HELD.items() if w.startswith("passes")} == PASS, "the eleven passing answers")
with open(RECEIPT, encoding="utf-8") as fh:
    cc = json.load(fh)["claim_checks"]   # at the plan: the committed records now carry the renumbers
check(not cc["not_standing"] and "against" not in cc["notes"] and cc["capture"] == {"stands": 12},
      "the claim checks: %r" % cc)
for cn, printed, listed in (("03816", "HORT 002 F", "FHORT2"), ("21271", "CSTR 042 F", "CSTR42"),
                            ("36790", "JOUR 140 F", "FJOUR140")):
    check(F.capture_claim(F._load(cn), listed, printed) == "stands", "%s: the page read finds %s" % (cn, printed))
check(F.capture_claim(F._load("03816"), "FHORT2", "HORT 185 F") == "not found",
      "a course the page read did not find on that page is not found")
check(F.notes_claim({"record": {"notes": ["HORT 002 F is a different course from the file's row."]}}, "HORT 002 F")
      == "against", "a note saying the course is another reads against")
with open(RECEIPT, encoding="utf-8") as fh:
    at_plan = json.load(fh)
bd = at_plan["boundaries"]   # at the plan, on the records as filed before the renumbers
check(sum(bd["counts"].values()) == 33 and not bd["wrong"] and bd["counts"].get("printed code one letter off right")
      == 11, "33 boundary readings, none wrong: %r" % bd)
check(at_plan["precision"]["right"] == 24 and not at_plan["precision"]["wrong"] and at_plan["recall"]["wrong"] == 0,
      "the receipt's precision and the named gaps' recall")

# ── the plan ──
with open(RECEIPT, encoding="utf-8") as fh:
    receipt = json.load(fh)
rows = receipt["records"]
keys = {r["control_number"] for r in rows}
check(keys == PASS and len(rows) == 11, "11 rows: %r" % sorted(keys))
check({h["control_number"] for h in receipt["held"]} == set(F.HAND_HELD) - PASS, "the 13 others are held")
for r in rows:
    with open(os.path.join(ROOT, r["path"]), encoding="utf-8") as fh:
        filed = json.load(fh)
    check(S.passes_live(filed["score"]) and filed["score"].get("course_renumbers"), "%s passes, naming its renumber"
          % r["control_number"])
    check(r["after_image"]["checks"]["coverage"] is True and r["after_image"]["checks"]["invented"] is True
          and r["before_image"]["checks"] != r["after_image"]["checks"], "%s: the row's checks move" % r["control_number"])
# The applied rows stand (#3719): the load's image of each committed record is the receipt's after-image, so the next
# load of the college posts what the apply wrote. A change to load_rows, the renumbers or a record file fails here.
images = NG._load_images({COLLEGE})
for r in rows:
    img = images.get((COLLEGE, r["control_number"]))
    check(img is not None and img["checks"] == r["after_image"]["checks"] and img["record"] == r["before_image"]["record"]
          and str(img["extracted_run"]) == str(r["extracted_run"]),
          "%s: the load's image of the committed record is the receipt's after-image" % r["control_number"])
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        text = fh.read()
    sql_keys = set(re.findall(r"^\s*\(\d+, 'Fullerton College', '(\d{5})', \d+,", text, re.M))
    check(sql_keys == keys, "the %s names exactly the plan's rows (%d of %d)" % (part, len(sql_keys), len(keys)))
    if part == "apply":
        check("when f.n > 0" in text and "from s, c, e, f;" in text and "e(expect) as (values (11))" in text,
              "the apply expects 11 rows and carries the confirm guard")
    if part.startswith("preread"):
        check("'confirm_matches'" in text, "the %s counts matching confirm verdicts" % part)
check(not F.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"], "a second run plans no row")

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: S714 Fullerton piles (the campus letter's place, the plan)" % (checks[0], checks[0]))
