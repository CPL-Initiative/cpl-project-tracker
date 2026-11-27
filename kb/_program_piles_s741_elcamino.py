#!/usr/bin/env python3
"""S741, lane 2's cheap piles at El Camino: the four records s740e held, two collected with named gaps.

S740's plan (kb/_program_piles_s740_elcamino.py, s740e) held four: 31319 and 42541 because no kind's sentence was
true of them on their notes, 19883 as not the program's own, 19857 as on no proved live run. A free page read of each
program's page, as the capture reads it (college-page-read run 45953358884,
kb/college_reads/s741_piles_el_camino_pages.json), settles the first two. No model call, no reconcile, no record
changed, no new kind.

COLLECTED WITH A NAMED GAP (2, REVIEWED below), total_differs (50), each listed with both of its page's figures in
kb/program_total_differs.json, which is where the record rule reads it (NG.total_differs: the record must read both
figures exactly as the page prints them):
  31319  Commercial Music certificate: the page prints seven required courses, MUSI 101 (3), 180 (3), 181A (2), 181B
         (2), 182 (3), 284 (3) and 285 (3), 19 units, under 'Total Units: 20', and nothing else that carries units.
  42541  Business Administration 2.0 AS-T: the page prints 'Required Core: 28-30 units' over eight rows whose units
         add to 27 at the least (LAW 5 at 3, MATH 140 at 4, BUS 116 at 3) and 30 at the most, under 'Total Major
         Units: 28-30': the low end it prints is one unit above what its rows add to.

HELD (2), each reason in HAND:
  19883  Photography certificate: not the program's own, and the read found its own page: Programs of Study links
         'Photography Certificate of Achievement' (poid 3640), which prints 'Required Core: 17-18 units', '9 units
         from:' and 'Total Units: 26-27'. A site_pages pin and a paid read; it joins 19861, 19866, 38948 and 43993 on
         the Acalog road.
  19857  Architecture certificate: the page prints 'Required Core: 30 units' over nine courses that add to 27, '6
         units from:' and 'Total Units: 36', so its figures add to the printed total and its courses to 33. The
         record read the page exactly, and no filed kind names a list whose printed figure runs past its courses
         (lists_past_their_figure names the reverse). It is also on no proved live run.

    python3 kb/_program_piles_s741_elcamino.py --dry-run
    python3 kb/_program_piles_s741_elcamino.py --tag s741c

Guard: tests/program_piles_s741_elcamino_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s741 as B8  # noqa: E402

B, NG = B8.B, B8.NG
COLLEGE = "El Camino College"
SLUG = "el_camino"
TAG = "s741c"
HELD_BY = "kb/receipts/program_requirement_records_piles_s740_el_camino_2026-11-26_s740e.json"
KEYS = ("19857", "19883", "31319", "42541")
PAGE_READ = "45953358884"

REVIEWED = {
    "31319": {"gap": "total_differs", "computed": [19, 19], "stated": [20, 20], "rule": True},
    "42541": {"gap": "total_differs", "computed": [27, 30], "stated": [28, 30], "rule": True},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "19883": ("held: not the program's own: the certificate was read from the Photography A.S. page (poid 3639). Page "
              "read " + PAGE_READ + " found its own page, linked from Programs of Study as 'Photography Certificate "
              "of Achievement' (poid 3640), which prints 'Required Core: 17-18 units', '9 units from:' and 'Total "
              "Units: 26-27': a site_pages pin and a paid read, on the Acalog road with 19861, 19866, 38948 and 43993"),
    "19857": ("held: page read " + PAGE_READ + " shows the record read its page exactly: 'Required Core: 30 units' "
              "over nine courses that add to 27, '6 units from:' and 'Total Units: 36', so the page's figures add to "
              "its total and its courses to 33; no filed kind names a list whose printed figure runs past its courses. "
              "It is also on no proved live run (on_live_run)"),
})

W = B8.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="El Camino", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
