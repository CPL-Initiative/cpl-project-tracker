#!/usr/bin/env python3
"""S742, lane 2's cheap piles, batch s742a: four records at four colleges, each collected with its gap named.

One plan over four piles (kb/_program_piles_s742.py Batch: each college's own self-recall and receipt, one pre-read,
one guarded UPDATE and one rollback over the four rows). Each row was held by S740's plans and is read again by key;
its live run is proved by the conductor's live read of 2026-11-27 07:31Z, and its gap by a free page read:

  Santa Monica 21026  total_differs (50)                 kb/_program_piles_s742_smc.py
  Butte 01312         degree_electives_not_printed (50)  kb/_program_piles_s742_butte.py
  Cabrillo 45306      lists_not_closed (30)              kb/_program_piles_s742_cabrillo.py
  Gavilan 08464       lists_not_closed (30)              kb/_program_piles_s742_gavilan.py

No catalog read by a model, no reconcile, no record changed, no new kind.

    python3 kb/_program_piles_s742a.py --dry-run
    python3 kb/_program_piles_s742a.py

Guard: tests/program_piles_s742a_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s742 as B9  # noqa: E402
import _program_piles_s742_butte as BUTTE  # noqa: E402
import _program_piles_s742_cabrillo as CABRILLO  # noqa: E402
import _program_piles_s742_gavilan as GAVILAN  # noqa: E402
import _program_piles_s742_smc as SMC  # noqa: E402

TAG = "s742a"
BATCH = B9.Batch(tag=TAG, piles=[SMC.W, BUTTE.W, CABRILLO.W, GAVILAN.W])


if __name__ == "__main__":
    sys.exit(BATCH.main(doc=__doc__))
