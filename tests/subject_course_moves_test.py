#!/usr/bin/env python3
"""A person's course moves reach the re-mint's gate (#3655, the commons lane's NEXT (4)).

The Subjects panel's Move (r-subjects-move-courses-sam-2026-11-22) saves one kb_curation row per course: field
course_subject_decision, course_id CRS:<college slug>|<local code>|<course number> (d-course-move-field-crs-key-s705).
kb/_sync_subject_decisions.py now reads them into kb/status/subject_decisions.json `courses`, kb/subject_decisions.py
honors them (for_course_move), and kb/_mid_readiness.py counts a moved course settled to the move's code, so the
re-mint dry run rereads the six electrical and six small-business titles after a person moves them
(f-category-save-moves-electrical-to-voce-s710).

WHAT THIS GUARDS (each a way a move would be lost, misapplied, or leak):
  (1) the sync reads a CRS: row into `courses` with its code, number and common code, and lists a row with no common
      code, a non-text field, or a key that does not read, never dropping it quietly;
  (2) no email reaches the file: a who that reads as one is written "a reviewer";
  (3) a definite read of 0 moves empties the section, and rows with no count never empty it;
  (4) the reader refuses a move whose common code is not canonical, and the nightly mint (for_course) never reads a
      move, since an M-ID moves only at a re-mint;
  (5) the gate settles the moved course to the move's code ahead of its code's own save, and only that course;
  (6) the page and the reader agree on the field and the key's prefix (commons_subjects.js MOVE_FIELD, MOVE_PREFIX),
      and the daily sync asks for the field.

Run from repo root: python3 tests/subject_course_moves_test.py
"""
import importlib.util
import json
import os
import re
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))


def load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


sd = load("sd_m", "kb/subject_decisions.py")
sync = load("sync_m", "kb/_sync_subject_decisions.py")
R = load("ready_m", "kb/_mid_readiness.py")
FAILS = []


def check(name, cond, why=""):
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or not why else "  [%s]" % why))
    if not cond:
        FAILS.append(name)


def move(key, common="ELEC", who="a reviewer", **extra):
    v = {"common_code": common, "from_mid": "VOCE M9100", "title": "Elec Theory", "band": "N"}
    v.update(extra)
    return {"course_id": key, "field": sd.COURSE_FIELD, "value": json.dumps(v), "reviewed_at": "2026-11-23T01:00:00Z",
            "reviewer_label": who}


SLUGS = sd.read_slugs(ROOT)
rows = [move("CRS:alpha|AED|90.10"), move("CRS:alpha|AED|90.11", common=""),
        move("CRS:alpha|AED|90.12", title=7), move("CRS:alpha|AED", common="ELEC"),
        move("CRS:alpha|AED|90.13", who="someone@college.edu"),
        move("CRS:alpha|AED|90.14", decided_by="person@college.edu")]
doc = sync.shape(rows, slugs=SLUGS)

# (1)
by = {c["key"]: c for c in doc["courses"]}
c = by.get("CRS:alpha|AED|90.10") or {}
check("(1) a move reads into courses", (c.get("college"), c.get("code"), c.get("number"), c.get("common_code"))
      == ("alpha", "AED", "90.10", "ELEC"), c)
bad = {u["key"]: u["why"] for u in doc["unreadable"]}
check("(1) a move with no common code is listed", "no common subject code" in bad.get("CRS:alpha|AED|90.11", ""), bad)
check("(1) a non-text field is listed", "not text" in bad.get("CRS:alpha|AED|90.12", ""), bad)
check("(1) a key with no course number is listed", "CRS:alpha|AED" in bad, bad)
check("(1) the totals count the moves", doc["totals"]["courses"] == len(doc["courses"]) == 3, doc["totals"])

# (2)
text = sync.dump(doc)
check("(2) no email in the file", not re.search(r"[A-Za-z0-9._%+-]+@(?!bot\b)[A-Za-z0-9-]+\.[A-Za-z]{2,}", text))
check("(2) an email-shaped who reads as a reviewer",
      by["CRS:alpha|AED|90.13"]["who"] == by["CRS:alpha|AED|90.14"]["who"] == "a reviewer")

# (3)
was = dict(doc)
empty = sync.shape([], slugs=SLUGS)
check("(3) rows with no count never empty the moves", bool(sync.empty_guard(empty, was, definite=("decisions", "statewide"))))
check("(3) a definite read of 0 empties them", sync.empty_guard(empty, was, definite=sync.PARTS) is None)
check("(3) the daily read asks for the course moves", (sd.COURSE_FIELD, sd.COURSE_PREFIX) in sync.READS)
with tempfile.TemporaryDirectory() as t:
    out, src = os.path.join(t, "d.json"), os.path.join(t, "rows.json")
    json.dump(rows, open(src, "w"))
    rc = sync.main(["--rows", src, "--out", out])
    check("(3) --rows writes the moves", rc == 0 and len(json.load(open(out))["courses"]) == 3)

# (4)
canon = json.load(open(os.path.join(ROOT, sd.CANONICAL), encoding="utf-8"))
mdoc = {"decisions": [{"key": "SUBJ:alpha|AED|nc:short-term-vocational", "common_code": "VOCE", "local_title": None,
                       "who": "t", "at": "x"},
                      {"key": "SUBJ:alpha|ELAP|credit", "common_code": "VOCE", "local_title": None, "who": "t", "at": "x"}],
        "statewide": [],
        "courses": [{"key": "CRS:alpha|AED|90.10", "common_code": "ELEC", "who": "a reviewer", "at": "x"},
                    {"key": "CRS:alpha|ELAP|90.20", "common_code": "ELEC", "who": "a reviewer", "at": "x"},
                    {"key": "CRS:alpha|AED|90.30", "common_code": "ZZZZ", "who": "a reviewer", "at": "x"}]}
D = sd.Decisions(mdoc, canon, SLUGS, sd.nc_codes_table())
check("(4) a canonical move is honored", (D.for_course_move("alpha", "aed", " 90.10 ") or {}).get("common_code") == "ELEC")
check("(4) a non-canonical move is refused and listed",
      D.for_course_move("alpha", "AED", "90.30") is None and any(r["key"] == "CRS:alpha|AED|90.30" for r in D.refused))
check("(4) the nightly mint never reads a move", (D.for_course("alpha", "ELAP", "C") or {}).get("common_code") == "VOCE")

# (5)
SLUG_OF = {sd.college_key("Alpha College"): "alpha"}
COURSES = {"alpha": {("AED", "90.10"): ("N", "Short-term Vocational"), ("AED", "90.11"): ("N", "Short-term Vocational"),
                     ("ELAP", "90.20"): ("C", sd.NO_CATEGORY)}}


def st(code):
    return R.member_status({"college": "Alpha College", "code": code}, SLUG_OF, COURSES, D, {}, sd.nc_codes_table())


s = st("AED 90.10")
check("(5) a moved course settles to the move's code ahead of its code's save",
      s[:2] == ("settled", "ELEC") and s[2].get("by") == "course move", s)
check("(5) the next course under the code keeps the code's save", st("AED 90.11")[:2] == ("settled", "VOCE"))
check("(5) a moved credit course settles to the move", st("ELAP 90.20")[:2] == ("settled", "ELEC"))

# (6)
js = open(os.path.join(ROOT, "commons_subjects.js"), encoding="utf-8").read()
m = re.search(r'MOVE_FIELD\s*=\s*"([^"]+)",\s*MOVE_PREFIX\s*=\s*"([^"]+)"', js)
check("(6) the page writes the field and prefix the reader reads",
      bool(m) and (m.group(1), m.group(2)) == (sd.COURSE_FIELD, sd.COURSE_PREFIX), m and m.groups())

print("\n%s" % ("all passed" if not FAILS else "%d FAILED: %s" % (len(FAILS), ", ".join(FAILS))))
sys.exit(1 if FAILS else 0)
