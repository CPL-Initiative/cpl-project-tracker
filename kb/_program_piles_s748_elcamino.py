#!/usr/bin/env python3
"""S748, lane 1 (readers) at El Camino: the Architecture certificate 19857, collected with its gap named.

S741 and S742 held 19857 by key. Its record (run 44480396671) reads its own page (poid 3524) exactly: 'Required
Core: 30 units' over nine courses whose printed units add to 27, '6 units from:' and 'Total Units: 36'. The page's
own units add to 33 under a printed total of 36; with the heading's 30 its lists add to the total it prints. S741
held it because no filed kind named a list whose printed figure runs past its courses. S742 then filed that same
shape at the Photography certificate 19883 ('Required Core: 17-18 units' over rows that add to 16, 25 under a
printed 26-27) as total_differs, the kind for a page whose printed total its own printed units do not add to. 19857
is that page: no reread reads it better, so it is collected under Sam's ruling of 2026-11-17
(sam-collect-with-gaps-2026-11-17) instead of held for another night. A free page read of the page alone, as the
capture reads it (college-page-read run 46119948370, kb/college_reads/s748_readers_el_camino_architecture.json),
is the evidence kb/program_total_differs.json lists it on. No model call, no reconcile, no record changed, no new
kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below), total_differs (50):
  19857  Architecture certificate (poid 3524): 'Required Core: 30 units' over nine courses that add to 27, '6 units
         from:' and 'Total Units: 36'. The page's own units add to 33.

Its live run is proved by the conductor's live reads of 2026-11-27 (07:31Z and 12:46Z, both committed): 44480396671.
The record lists eight courses the state's file does not (the scorer's invented check passes them as the catalog's
additions) and places 8 of the state's 14; that is its coverage score, and no part of this gap. S742's other reason
(the capture hands 19857 the Architecture A.S. page on a tie) stands for any paid read: this plan sends none.

    python3 kb/_program_piles_s748_elcamino.py --dry-run
    python3 kb/_program_piles_s748_elcamino.py --tag s748r1

Guard: tests/program_piles_s748_elcamino_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s742 as B9  # noqa: E402

B, NG = B9.B, B9.NG
COLLEGE = "El Camino College"
SLUG = "el_camino"
TAG = "s748r1"
HELD_BY = "kb/receipts/program_requirement_records_piles_s741_el_camino_2026-11-27_s742r2.json"
KEYS = ("19857",)
PAGE_READ = "46119948370"
RUN = "44480396671"

REVIEWED = {
    "19857": {"gap": "total_differs", "computed": [33, 33], "stated": [36, 36], "rule": True},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

W = B9.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="El Camino", prior=B9.LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
