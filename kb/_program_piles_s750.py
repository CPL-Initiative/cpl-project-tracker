#!/usr/bin/env python3
"""S750, the cheap piles: the shared plan code, S748's (kb/_program_piles_s748.py) under S750's names.

Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with its gap named
and a lower score on the 0-100 bar, never held for another night. The S750 conductor's brief (2026-11-28) names the
piles: the records S748 left to assign under its reading state_course_not_on_page (handoff 749, NEXT (6)), then the
flags an existing kind covers, at Cerritos, Citrus, College of Marin, Foothill, Irvine Valley, Madera, Palomar and
College of the Canyons.

Nothing is added to S748's checks. The guard, the pre-read, the guarded UPDATE, the rollback and the receipt's images
are S742's own code (Pile, Batch); three names change:

  LiveRead  reads S750's committed live reads (kb/receipts/program_requirements_reread_s750_*_checked.json) beside
            S741's, S742's and S748's;
  Pile      files its receipt as kb/receipts/program_requirement_records_piles_s750_<college>_<day>_<tag>.json;
  Batch     names S750 and its brief in each receipt's rule.

Each batch: kb/_program_piles_s750<letter>.py; guards: tests/program_piles_s750<letter>_test.py.
"""
from __future__ import annotations

import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s748 as B10  # noqa: E402

B, NG, S = B10.B, B10.NG, B10.S
P = B10.P
ROOT = B10.ROOT
PASSES = B10.PASSES
LIVE_READS = B10.LIVE_READS + ("program_requirements_reread_s750_*_checked.json",)
RULING_S750 = ("the S750 conductor's brief (2026-11-28): the records S748 left to assign under its reading "
               "state_course_not_on_page, each checked against a free read of its own page; a row a person checked is "
               "skipped; a row that changed since the plan read it aborts the apply")


class LiveRead(B10.LiveRead):
    """S748's LiveRead over S741's, S742's, S748's and S750's committed live reads."""

    def live_read(self) -> dict:
        out: dict = {}
        for pattern in LIVE_READS:
            for path in sorted(glob.glob(os.path.join(NG.RECEIPTS, pattern))):
                try:
                    with open(path, encoding="utf-8") as fh:
                        d = json.load(fh)
                except (OSError, ValueError):
                    continue
                at = str(d.get("read_at") or "")
                for k, run in ((d.get("live_runs") or {}).get(self.college) or {}).items():
                    if run:
                        out.setdefault(str(k), []).append((at, str(run)))
        return out


def receipt_path(pile, day: str, tag: str | None = None) -> str:
    """S750's receipt name, for any Pile class a batch of S750's uses."""
    return os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s750_%s_%s_%s.json"
                        % (pile.slug, day, tag or pile.tag))


class Pile(B10.Pile):
    """S748's Pile under S750's receipt name."""

    receipt_path = receipt_path


class Batch(B10.Batch):
    """S742's Batch: one pre-read, one guarded UPDATE and one rollback over every pile's rows, under S750's name."""

    session = "S750"
    ruling = RULING_S750
