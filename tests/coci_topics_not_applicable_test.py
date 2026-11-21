#!/usr/bin/env python3
"""Special and selected topics are not applicable on the Needs an M-ID pile (S695; session decision
d-topics-not-applicable-2026-11-20, his to revise): a topics course's content changes each term, so it is never one
common course. kb/_build_not_applicable.py flags it beside independent study, through the same file and builder.

Guards, on a fixture:
  1. a topics title on the pile is flagged with the topics reason;
  2. a topics course that holds an M-ID (sits on a card) is not flagged, and a card whose courses are all topics
     courses is no not-applicable card;
  3. a topics course that carries a C-ID or a CCN is left, and counted as left;
  4. a topics course someone curated (a CN: row in kb/coci_curation.json: an Assign or a re-home) is left;
  5. a near-miss title ("Topics in History", "Current Topics in Nursing") is a real gap;
  6. independent study flags as before, a C-ID notwithstanding, and wins over topics when a title says both;
  7. the topics note is plain words, and the committed file carries it.

Run from repo root: python3 tests/coci_topics_not_applicable_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_not_applicable as B  # noqa: E402
import _flags as F  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


COLLEGES = ["American River College", "Rio Hondo College"]
# rows: [college, ctrl, subj, num, title, units, credit, top, cid, ccn, mid]
ROWS = [
    [0, "CCC1", "BIOL", "98", "Special Topics in Biology", 3, "C", "", "", "", ""],
    [1, "CCC2", "FREN", "99", "SELECTED TOPICS IN FRENCH", 3, "C", "", "", "", ""],
    [0, "CCC3", "ART", "97", "Special Topics in Art", 3, "C", "", "", "", ""],          # on a card: holds an M-ID
    [1, "CCC4", "GEOG", "160", "Special Topics-Field Geography", 3, "C", "", "GEOG 160", "", ""],
    [0, "CCC5", "PSYC", "95", "Special Topics in Psychology", 3, "C", "", "", "PSYC C1000", ""],
    [1, "CCC6", "FIRE", "90", "Special Topics in Fire Science", 3, "C", "", "", "", ""],  # curated: CN: row
    [0, "CCC7", "HIST", "10", "Topics in History", 3, "C", "", "", "", ""],
    [1, "CCC8", "NURS", "20", "Current Topics in Nursing", 2, "C", "", "", "", ""],
    [0, "CCC9", "ART", "99", "Independent Study in Art", 1, "C", "", "ARTS 199", "", ""],
    [1, "CCC10", "BUS", "99", "Special Topics: Independent Study", 1, "C", "", "", "", ""],
    [0, "CCC11", "ARTH", "96", "Selected Topics in Art History", 3, "C", "", "", "", ""],  # on a topics-only card
    [1, "CCC12", "ARTH", "95", "Special Topics in Art History", 3, "C", "", "", "", ""],   # on the same card
]
COCI = {"colleges": COLLEGES, "rows": ROWS}
MEMBERS = {"colleges": COLLEGES, "members": {
    "ARTS M1001": [{"c": 0, "cn": "CCC3", "t": "Special Topics in Art"}],
    "ARTH M1002": [{"c": 0, "cn": "CCC11", "t": "Selected Topics in Art History"},
                   {"c": 1, "cn": "CCC12", "t": "Special Topics in Art History"}],
}}
CURATION = {"CN:CCC6": {"merge_into": "FIRE M1219", "reviewed_by": "curator@example.edu",
                        "reviewed_at": "2026-11-20T12:00:00+00:00"}}


def key(i):
    return F.course_key(COLLEGES[ROWS[i][0]], ROWS[i][1])


stats = {}
courses, cards, real_gaps = B.build(COCI, MEMBERS, CURATION, None, stats)

check("1. a special topics course on the pile is flagged topics", courses.get(key(0)) == ["topics", "Special Topics in Biology"])
check("1. a selected topics course in capitals is flagged topics", (courses.get(key(1)) or [None])[0] == "topics")
check("2. a topics course on a card (it holds an M-ID) is not flagged", key(2) not in courses)
check("2. a card whose courses are all topics courses is no not-applicable card", "ARTH M1002" not in cards and "ARTS M1001" not in cards)
check("3. a topics course with a C-ID is left", key(3) not in courses)
check("3. a topics course with a CCN is left", key(4) not in courses)
check("4. a topics course someone curated is left", key(5) not in courses)
check("3-4. the three left are counted as left", stats.get("topics_left") == 3)
check("5. 'Topics in History' is a real gap", key(6) not in courses)
check("5. 'Current Topics in Nursing' is a real gap", key(7) not in courses)
check("6. independent study flags as before, its C-ID notwithstanding", (courses.get(key(8)) or [None])[0] == "independent")
check("6. independent study wins when a title says both", (courses.get(key(9)) or [None])[0] == "independent")
# The pile courses: 1, 2, 4..10 minus the card rows (3, 11, 12) -> 9 rows off the List; 4 flagged, 5 real gaps.
check("the counts: 4 flagged, 5 real gaps", len(courses) == 4 and real_gaps == 5)

note = F.NA_COURSE_NOTES.get("topics") or ""
check("7. the topics note names the reason in plain words", note.startswith("Not applicable: special or selected topics."))
check("7. the note is in every note's list (the plain-words test reads it)", note in F.ALL_NOTES)
with open(os.path.join(ROOT, "kb", "coci_not_applicable.json"), encoding="utf-8") as f:
    committed = json.load(f)
check("7. the committed file carries the topics note", committed.get("_course_notes", {}).get("topics") == note)

passed = sum(1 for _, ok in results if ok)
for name, ok in results:
    print(("PASS  " if ok else "FAIL  ") + name)
print("\n%d/%d passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
