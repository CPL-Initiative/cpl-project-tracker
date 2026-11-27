#!/usr/bin/env python3
"""S741, lane 2's cheap piles at East Los Angeles: the five records s720e still held, one collected with a named gap.

S720's plan (kb/_program_piles_s720_ela.py, s720e) held six; 33013 has been collected since (noted_figures_differ, a
person's key, no key of this plan). The five are read again here, by key, from the committed records, their notes and
a free page read. No model call, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  noted_figures_differ (40)  38168  Commercial Music: Instrumental/Vocal Performer certificate. s720e held it as
        unconfirmed: the catalog prints no section under the state's title, and the record read 'Commercial Music:
        Performance' on PDF p.288, a page also read for 38169 and 38206. College-page-read run 45953358884
        (kb/college_reads/s741_piles_east_los_angeles_music.json, pp.287-290 whole) prints that section's heading as
        'Commercial Music: Performance (Academic Plan E038168D)': East Los Angeles prints each award's Academic Plan
        code, E0 and the state's control number, so the section is 38168's own under the college's newer title
        (its page-mates' sections print E038169D and E038206D). The record's heading carries the same code and its
        note names the section (own_section). Its gap, on its own note: the last list's heading says 'COMPLETE FOUR
        UNITS' and its printed figure is '2-3'; the record adds the list at 2-3 (17-19), and with the heading's 4
        today's scorer gives the printed 19-20 at both ends.

HELD (4), each reason in HAND:
  02456  Medical Assistant A.S.: unit_line_not_read is true of it (its note: the Required Core's 48-50 includes
         'Completion of Intermediate Algebra or its equivalent or higher Math course 3-5', a line with no course; the
         45 with it is 48-50), and it is on no proved live run: its live row sits on an older extraction than the
         committed record (s720e's reason). A reread that posts the reconcile's record (force 45176404274), then
         the gap.
  31017  Kinesiology A.A.-T, 41231 Environmental Science A.S.-T: s720e's reasons, unchanged (a reread each).
  37510  Automotive Fundamentals (noncredit): s720e's reason, unchanged (no gap: 'unstated' passes once posted).

    python3 kb/_program_piles_s741_ela.py --dry-run
    python3 kb/_program_piles_s741_ela.py --tag s741d

Guard: tests/program_piles_s741_ela_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s720_ela as S720  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402

B, NG = B8.B, B8.NG
COLLEGE = "East Los Angeles College"
SLUG = "east_los_angeles"
TAG = "s741d"
HELD_BY = "kb/receipts/program_requirement_records_piles_s720_ela_2026-11-24_s720e.json"
KEYS = ("02456", "31017", "37510", "38168", "41231")
# s720e's sixth hold, collected since under a person's key: no key of this plan.
COLLECTED_SINCE = ("33013",)
PAGE_READ = "45953358884"
_LAST = "COMPLETE FOUR UNITS FROM THE FOLLOWING (DEPENDING ON THE AREA OF INTEREST)"


def plan_code(filed: dict, e: dict) -> bool:
    """The record's own heading carries its Academic Plan code, E0 and the state's control number: the section the
    record read is this program's, whatever title the college prints over it."""
    heading = str(((filed.get("record") or {}).get("program") or {}).get("section_heading") or "")
    return "Academic Plan E0%s" % filed.get("control_number") in heading


REVIEWED = {
    "38168": {"gap": "noted_figures_differ", "computed": [17, 19], "stated": [19, 20],
              "ops": [("stated", _LAST, 4)], "shape": ["plan_code"],
              "words": "The last block's heading says 'COMPLETE FOUR UNITS' but prints '2-3' as its block total; "
                       "minimum recorded as 4 from the heading, stated as printed 2-3",
              "own_section": "the 'Commercial Music: Performance' Certificate of Achievement (E038168D) was read as "
                             "the matching award"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({cn: S720.HAND[cn] for cn in ("31017", "37510", "41231")})
HAND.update({
    "02456": ("held: unit_line_not_read is true of it (its note: the Required Core's 48-50 includes 'Completion of "
              "Intermediate Algebra or its equivalent or higher Math course 3-5', a line with no course; with it the "
              "45 is the printed 48-50), and it is on no proved live run: its live row sits on an older extraction "
              "than the committed record, the free reconcile 45176404274's (on_live_run). A reread that posts that "
              "record, then the gap"),
})

W = B8.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="East Los Angeles", prior=B8.LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"plan_code": plan_code})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
