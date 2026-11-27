#!/usr/bin/env python3
"""S742, lane 1 (readers) at El Camino: two certificates read from their own pages tonight, each collected with a named gap.

The capture's Acalog road now reads site_pages pins (S742), so paid read 46007782666 read five certificates from
their own pages instead of their sister degrees'. Three pass (Marketing 19861, Journalism 19866, Hybrid, Electric,
and Alternative Fuels 43993). The other two read their pages exactly, and each page's own figures disagree, so
today's scorer fails them on the arithmetic alone. A free page read of each page, as the capture reads it, settles
both. No model call, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (2, REVIEWED below), total_differs (50), each listed with both of its page's figures in
kb/program_total_differs.json, which is where the record rule reads it (NG.total_differs: the record must read both
figures exactly as the page prints them):
  19883  Photography certificate (poid 3640, college-page-read run 46012119450): 'Required Core: 17-18 units' over
         five rows whose units add to 16 (PHOT 101 or PHOT 106 or JOUR 6 at 3, PHOT 102, 202 and 203 at 3, PHOT 223A
         at 4), '9 units from:' and 'Total Units: 26-27'. The page's own units add to 25; with the heading's 17-18
         its lists add to the total it prints.
  38948  Entrepreneurial Studies certificate (poid 3699, college-page-read run 45772822110): 'Required Core:' over
         seven courses that add to 19, two lists each printed '3-4 units from:', and 'Total Units: 19-20'. The
         page's own figures add to 25-27; the core alone adds to the low end of the total it prints.

HELD (1), its reason in HAND:
  19857  Architecture certificate: S741's reason stands (the page prints 'Required Core: 30 units' over nine courses
         that add to 27, and its record lists eight courses the state's file does not). Its live run is proved by
         the conductor's 12:46Z read. Tonight's capture hands it the Architecture A.S. page (poid 3523) on a tie,
         because the reader's label reads 'Certificate' in the catalog's page-type label on every page: it is kept
         out of every paid read until that label is read apart (a reader change, with its second reader).

    python3 kb/_program_piles_s742_elcamino.py --dry-run
    python3 kb/_program_piles_s742_elcamino.py --tag s742r2

Guard: tests/program_piles_s742_elcamino_test.py.
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
TAG = "s742r2"
HELD_BY = "kb/receipts/program_requirement_records_piles_s741_el_camino_2026-11-27_s741c.json"
KEYS = ("19857", "19883", "38948")
PAGE_READS = {"19883": "46012119450", "38948": "45772822110"}
PAID_READ = "46007782666"

REVIEWED = {
    "19883": {"gap": "total_differs", "computed": [25, 25], "stated": [26, 27], "rule": True},
    "38948": {"gap": "total_differs", "computed": [25, 27], "stated": [19, 20], "rule": True},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "19857": ("held: S741's reason stands: page read 45953358884 shows the record read its page exactly ('Required "
              "Core: 30 units' over nine courses that add to 27, '6 units from:' and 'Total Units: 36'), and no filed "
              "kind names a list whose printed figure runs past its courses; the record also lists eight courses the "
              "state's file does not. Tonight's capture (46003498776) hands it the Architecture A.S. page (poid 3523) "
              "on a tie, so no paid read names it until the reader's label reads the catalog's page-type label apart"),
})

W = B8.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="El Camino", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
