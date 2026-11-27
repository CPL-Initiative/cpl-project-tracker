#!/usr/bin/env python3
"""S742, lane 2's cheap piles at Gavilan: the two records s740a held, one collected with a named gap.

S740's plan (kb/_program_piles_s740_gavilan.py, s740a) held 08464 as on no proved live run and 45357 for a reread. The
conductor's live read of 2026-11-27 07:31Z (kb/receipts/program_requirements_reread_s741_piles_checked.json) holds
08464's live row at its committed run (44090922437). The record carries no note, so its gap stands on the page's own
sentence, read by free page read 46001469210 (kb/college_reads/s742_piles_gavilan_liberal_arts.json: the capture's own
calls for the entry, the address the record was read from) and committed in that plan file. No catalog read, no
reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  lists_not_closed (30)  08464  Liberal Arts: Multiple Subjects A.A. The page prints, over its five areas: 'Complete
        one course from each area. Any remaining units needed to reach a minimum of 19 units may be completed by
        selecting any course from areas 1-5.' The areas print 'Area 1 (3 units)', 'Area 2 (3-5 units)', 'Area 3 (3
        units)', 'Area 4 (3-5 units)' and 'AREA 5 (2 - 4 Units)': one course from each adds to 14-20, and the rest of
        the 19 comes from any of the five lists again. Each list also takes courses toward the remainder, so the
        lists alone do not add the program's units. The record reads each area as one course at its printed figure
        (14-20) and states the 19. The kind's own check is one_from_each below.

HELD (1), its reason in HAND:
  45357  Cal-GETC certificate: s740a's reason stands (read in two parts that left five lists with no course beside
         their twins; incomplete on the read itself: a reread).

    python3 kb/_program_piles_s742a.py --dry-run     # the batch this pile is in

Guard: tests/program_piles_s742a_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740_gavilan as S740  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402

B, NG, S = B9.B, B9.NG, B9.S
COLLEGE = "Gavilan College"
SLUG = "gavilan"
TAG = "s742a"
HELD_BY = "kb/receipts/program_requirement_records_piles_s740_gavilan_2026-11-26_s740a.json"
KEYS = ("08464", "45357")
PAGE_READ = "46001469210"
PLAN = "kb/college_reads/s742_piles_gavilan_liberal_arts.json"
RUN = "44090922437"
REMAINDER = ("Complete one course from each area. Any remaining units needed to reach a minimum of 19 units may be "
             "completed by selecting any course from areas 1-5.")


def one_from_each(filed: dict, e: dict) -> bool:
    """lists_not_closed, where the page takes one course from each list and the rest of its total from any of them:
    every list of the record is a choice of one course that prints a figure of its own; the lists' figures add to
    the record's own sum; that sum's low end is short of the stated total; and the stated total is one figure the
    page's sentence names as a minimum (the entry's words print it)."""
    bl = (filed.get("record") or {}).get("blocks") or []
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = B.pair(a.get("computed")), B.pair(a.get("stated"))
    spans = [S._span(b.get("stated")) for b in bl]
    if len(bl) < 2 or comp is None or st is None or any(s is None for s in spans):
        return False
    if any(b.get("rule") != "choose_courses" or b.get("minimum") != 1 or b.get("option_group") for b in bl):
        return False
    figs = [sum(s[0] for s in spans), sum(s[1] for s in spans)]
    return B.same(figs, comp) and comp[0] + NG.FIG_EPS < st[0] and st[0] == st[1] \
        and ("a minimum of %s units" % _figure(st[0])) in str(e.get("words") or "")


def _figure(v) -> str:
    v = float(v)
    return str(int(v)) if v == int(v) else str(v)


def _break_one_from_each(g: dict, e: dict) -> dict:
    """The sum at the stated total: no list is short of it, and the shape names nothing."""
    g["score"]["arithmetic"]["computed"] = list(g["score"]["arithmetic"]["stated"])
    return g


REVIEWED = {
    "08464": {"gap": "lists_not_closed", "computed": [14, 20], "stated": [19, 19],
              "words_at": "page_read", "words": REMAINDER,
              "page_read": {"plan": PLAN, "run": PAGE_READ, "line": "remainder"},
              "shape": ["one_from_each"],
              "page": "the entry's own text: 'Requirements:', 'Complete one course from each area. Any remaining units "
                      "needed to reach a minimum of 19 units may be completed by selecting any course from areas "
                      "1-5.', 'Courses listed under more than one discipline or area may be used to satisfy only one "
                      "area.'; 'Area 1 (3 units) English & Communication Skills:', 'Area 2 (3-5 units) Mathematics & "
                      "Natural Science:', 'Area 3 (3 units) Social Science:', 'Area 4 (3-5 units) Humanities & Fine "
                      "Arts:', 'AREA 5 (2 - 4 Units)'; 'General Education Requirements: Units: 35- 39'; 'Total: 54'"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({"45357": S740.HAND["45357"]})

W = B9.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Gavilan", prior=B9.LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"one_from_each": one_from_each},
            breaks={"one_from_each": _break_one_from_each})
