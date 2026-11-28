#!/usr/bin/env python3
"""S748, lane 2's cheap piles: the shared plan code, S742's (kb/_program_piles_s742.py) under S748's names.

Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with its gap named
and a lower score on the 0-100 bar, never held for another night. COBIx's brief of 2026-11-28, as the S748 conductor
carries it: name the gap rather than paying for a third reread. S742 left its holds by key
(docs/program_requirements_harvest_lessons.md, S742, Holds by key; handoff 743's log at 14:43Z).

Nothing is added to S742's checks. The guard, the pre-read, the guarded UPDATE, the rollback and the receipt's images
are S742's own code (Pile, Batch); three names change:

  LiveRead  reads S748's committed live reads (kb/receipts/program_requirements_reread_s748_*_checked.json) beside
            S741's and S742's;
  Pile      files its receipt as kb/receipts/program_requirement_records_piles_s748_<college>_<day>_<tag>.json;
  Batch     names S748 and its brief in each receipt's rule.

Each college's plan: kb/_program_piles_s748_<college>.py; each batch: kb/_program_piles_s748<letter>.py; guards:
tests/program_piles_s748<letter>_test.py.
"""
from __future__ import annotations

import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s742 as B9  # noqa: E402

B, NG, S = B9.B, B9.NG, B9.S
P = B9.P
ROOT = B9.ROOT
PASSES = B9.PASSES
LIVE_READS = B9.LIVE_READS + ("program_requirements_reread_s748_*_checked.json",)
RULING_S748 = ("COBIx's brief of 2026-11-28, as the S748 conductor carries it: name the gap rather than paying for a "
               "third reread; a gap is named only where it is true on the page; plans batched a few colleges each")


class LiveRead(B9.LiveRead):
    """S742's LiveRead over S741's, S742's and S748's committed live reads."""

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


class Pile(B9.Pile):
    """S742's Pile under S748's receipt name."""

    def receipt_path(self, day: str, tag: str | None = None) -> str:
        return os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s748_%s_%s_%s.json"
                            % (self.slug, day, tag or self.tag))


class Batch(B9.Batch):
    """S742's Batch: one pre-read, one guarded UPDATE and one rollback over every pile's rows, under S748's name."""

    session = "S748"
    ruling = RULING_S748
