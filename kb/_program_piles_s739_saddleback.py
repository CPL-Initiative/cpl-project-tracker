#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Saddleback: the two records s730b still holds, both collected with their gaps named.

S730's plan (kb/_program_piles_s730_saddleback.py, s730b) collected 8 of the census's 17 wording-rule records and held
9; the seven on the repeat lever were read again and pass (reread 45632688186, S731), which leaves 04073 and 36625.
Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named and a
lower score, never held, unless the record is not the program's own. Both were read from their own catalog page. No
catalog read, no reconcile, no record changed, no new kind.

COLLECTED (2, REVIEWED below):
  waived_course_counted (50)  04073 Music A.A., two gaps on one row, both notes filed. The four piano 'Select one'
        requirements print 0.0-2.0 each, since the course or a proficiency exam meets them, and the record counts each
        course; and the ensemble list, 'Complete four semesters from the following (including repeated classes)', is
        read as four courses, where four semesters of a 1-unit ensemble are 4 units. With the piano requirements from
        zero and the ensemble at its printed 4-8 the courses add to the printed 20-34; neither reading alone gives
        it (S730 held the record for that). The kind filed is the lower score of the two (repeat_read_once is 60).
  pool_figure_not_read (40)   36625 Aging Studies Interdisciplinary certificate: the page asks 'Complete 3-5 units
        (1-2 courses) from one of the following pathways' and prints 3.0-5.0 once over the six pathways; the record
        states each pathway at the course sum printed beside its name (12, 19, 13, 8, 12, 18). With each pathway read
        at the 3-5 the courses add to the printed 12-14. S730 held it because no kind names a list's figure read as
        its course sum; the one figure over the six lists is the pool's, and the note says so.

    python3 kb/_program_piles_s739_saddleback.py --dry-run
    python3 kb/_program_piles_s739_saddleback.py --tag s739f

Guard: tests/program_piles_s739_saddleback_test.py.
"""
from __future__ import annotations

import copy
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s730_saddleback as PRIOR  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Saddleback College"
SLUG = "saddleback"
TAG = "s739f"
HELD_BY = "kb/receipts/program_requirement_records_piles_s730_saddleback_2026-11-25_s730b.json"
KEYS = ("04073", "36625")

_ENSEMBLE = "Ensemble Requirement: Complete four semesters from the following (including repeated classes)"
_PATHWAYS = ("Pathway 1: Business", "Pathway 2: Environmental Design", "Pathway 3: Nutrition and Culinary",
             "Pathway 4: Healthcare", "Pathway 5: Health and Wellness", "Pathway 6: Human Services")


def music_reading(filed: dict, waived: bool = True, semesters: bool = True) -> dict | None:
    """04073 re-added: each piano 'Select one' requirement at its printed 0-2 (waived), and the ensemble list at its
    printed 4-8 units, four semesters of an ensemble (semesters)."""
    rec = copy.deepcopy(filed.get("record") or {})
    piano = [b for b in rec.get("blocks") or [] if b.get("name") == "Select one"]
    ens = [b for b in rec.get("blocks") or [] if b.get("name") == _ENSEMBLE]
    if len(piano) != 4 or len(ens) != 1 or any(B.pair(b.get("stated")) != [0.0, 2.0] for b in piano) \
            or B.pair(ens[0].get("stated")) != [4.0, 8.0]:
        return None
    if waived:
        for b in piano:
            b["rule"], b["minimum"] = "choose_units", 0
    if semesters:
        ens[0]["rule"], ens[0]["minimum"] = "choose_units", 4
    return rec


def waived_and_semesters(filed: dict, e: dict) -> bool:
    """Both readings together give the printed total at both ends, and neither alone does."""
    return B.closes(filed, music_reading(filed)) and not B.closes(filed, music_reading(filed, semesters=False)) \
        and not B.closes(filed, music_reading(filed, waived=False))


REVIEWED = {
    "04073": {"gap": "waived_course_counted", "computed": [29, 34], "stated": [20, 34],
              "words": "The four piano 'Select one' blocks (each 0.0-2.0 units) can each be satisfied by the course OR "
                       "a proficiency exam",
              "also_words": "Ensemble requirement counts four semesters including repeated classes",
              "shape": ["waived_and_semesters"], "courses": ["MUS54A", "MUS54B", "MUS55A", "MUS55B"],
              "lever": "a repeat block_pattern step on the ensemble list (the reconcile lever S730 names) is the "
                       "second gap's; the waiver stays a named gap, since the figure closes only for a student who "
                       "passes the proficiency exams (d-waived-course-counted-keeps-50-s731)"},
    "36625": {"gap": "pool_figure_not_read", "computed": [17, 28], "stated": [12, 14],
              "words": "'Complete 3-5 units (1-2 courses) from one of the following pathways', printed total 3.0-5.0",
              "ops": [("stated", name, 3, 5) for name in _PATHWAYS],
              "lever": "a wording rule on a Saddleback reconcile that reads each pathway at the printed 3-5 passes it "
                       "(S730's reason); a reconcile's rescore drops the gap when it does"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Saddleback", prior=PRIOR, keys=KEYS, reviewed=REVIEWED,
           hand=HAND, held_by=HELD_BY, shapes={"waived_and_semesters": waived_and_semesters})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
