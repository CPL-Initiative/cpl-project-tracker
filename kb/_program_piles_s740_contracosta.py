#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Contra Costa: five of the six records s720k held, two collected with named gaps.

S720's plan (kb/_program_piles_s720_contracosta.py, s720k) collected 16 of the census's wording-rule records and held
six. One of the six, 01417, has since been collected (entry_path_range, S727's persons plan), so it is no key here.
Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named and a
lower score, never held, unless the record is not the program's own. A named gap must be true of its record. The
five are read again here, by key, from the committed records and their notes. Each was read from a catalog page of
its own address. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (2, REVIEWED below):
  degree_summary_ge_none (50)  01415  Spanish A.A.: the unit summary prints 'Total Program 60 / 60' with general
        education and electives as 'None', as it does for the 16 s720k collected, so the record holds the major
        alone. Its filed arithmetic is an older scorer's, read against the major (19 against 19-22); today's scorer
        reads the degree (19 against 60) and passes the major, so the gap is read against today's arithmetic
        ("today"). S720 held it for a reread of 'or both' pairs in the 9-unit choice, which bear on the range's top
        alone.
  noted_figures_differ (40)  33370  Music A.A.: the core heading prints MUSIC-190A/B and 191A/B at '.5 units each'
        beside printed ranges of 0.5-5.5, and the Major Instrument and Ensemble headings print totals of 2 and 4 over
        courses with ranges; the record adds the ranges (42.5-73.5 against 47). With each at its heading's figure the
        major adds to the printed 47 (the reading closes the major; the degree's 60 is read apart, with 3 units the
        summary counts twice, and that note is filed beside).

HELD (3), each reason in HAND:
  01400, 40761  on no proved live run (s720k's reason, unchanged).
  33660  Physical Education/Kinesiology A.S.: its notes print general education as None and N/A and say nothing of
         its electives, so degree_summary_ge_none's sentence is not its own (S720's second reader); no other kind
         is true of it.

    python3 kb/_program_piles_s740_contracosta.py --dry-run
    python3 kb/_program_piles_s740_contracosta.py --tag s740g

Guard: tests/program_piles_s740_contracosta_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s740 as B7  # noqa: E402

B, NG, S = B7.B, B7.NG, B7.S
COLLEGE = "Contra Costa College"
SLUG = "contra_costa"
TAG = "s740g"
HELD_BY = "kb/receipts/program_requirement_records_piles_s720_contracosta_2026-11-24_s720k.json"
KEYS = ("01400", "01415", "33370", "33660", "40761")
# s720k's sixth hold, collected since (entry_path_range): no key of this plan.
COLLECTED_SINCE = ("01417",)


def major_equal(filed: dict, e: dict) -> bool:
    """degree_summary_ge_none's own check, as s720k read it, on today's arithmetic: the record is read against the
    degree total, its major passes its own check, and the record names no general education pattern and no units
    for one (the summary prints them as None)."""
    now = B.arithmetic(filed)
    prog = (filed.get("record") or {}).get("program") or {}
    return e["gap"] == "degree_summary_ge_none" and now.get("against") == "degree" \
        and (now.get("major") or {}).get("status") == "equal" and not prog.get("ge_pattern") \
        and S._span(prog.get("ge_units")) is None


REVIEWED = {
    "01415": {"gap": "degree_summary_ge_none", "computed": [19, 19], "stated": [60, 60], "today": True,
              "shape": ["major_equal"],
              "words": "degree_total 60/60 taken from Unit Summary 'Total Program 60 / 60'; GE and electives rows "
                       "print 'None'"},
    "33370": {"gap": "noted_figures_differ", "computed": [42.5, 73.5], "stated": [47, 47],
              "ops": [("units", "MUSIC190A", 0.5), ("units", "MUSIC190B", 0.5), ("units", "MUSIC191A", 0.5),
                      ("units", "MUSIC191B", 0.5), ("units", "MUSIC109", 2), ("units", "MUSIC167", 4)],
              "words": "Core block heading states MUSIC-190A/B and 191A/B count .5 units each though ranges 0.5-5.5 "
                       "are printed beside them; Major Instrument (2 units) and Ensemble (4 units) totals come from "
                       "the block headings",
              "closes": "major",
              "also_words": "degree_total 60, ge_units 15-20 (General Education, Local) and electives 0-1 (needed to "
                            "reach 60 unit degree minimum) come from the Program Unit Summary table; it also lists 3 "
                            "units double counted",
              "courses": ["MUSIC190A", "MUSIC190B", "MUSIC191A", "MUSIC191B", "MUSIC109", "MUSIC167"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
_RUN = ("held: on no proved live run: no committed receipt posts its committed run (44687786167) to a live row "
        "(on_live_run); its live row's run is unknown here")
HAND.update({
    "01400": _RUN, "40761": _RUN,
    "33660": ("held: its notes print general education as None and N/A and say nothing of its electives, so "
              "degree_summary_ge_none's sentence (general education and electives as None or N/A) is not its own "
              "(the second reader, S720), and no other kind's sentence is true of it"),
})

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Contra Costa", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"major_equal": major_equal})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
