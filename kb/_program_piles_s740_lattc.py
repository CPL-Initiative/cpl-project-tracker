#!/usr/bin/env python3
"""S740, lane 2's cheap piles at Los Angeles Trade-Technical: four of the five records s739e held, one collected with a named gap.

S739's plan (kb/_program_piles_s739_lattc.py, s739e) held five. Two held on codes the catalog prints under a
misspelled subject. S740 filed those pairs as cited course renumbers (kb/program_requirements_reconcile.json,
college-page-read run 45837455365), the free reconcile 45844759766 rescored the two records with them read, and
reread 45849372771 posted both: 41150 passes and is no key here; 31089 is collectable, the record itself unchanged,
and its arithmetic still reads 37-38 against the printed 42. The other four are read again here, by key, from the
committed records and their notes. No catalog read, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (1, REVIEWED below):
  noted_figures_differ (40)  31089  Solar Thermal Installation & Maintenance A.S.: the summary row prints 38 for the
        required courses and 4 for electives, the printed 42, and the required courses listed by semester add to
        33-34; its note quotes the 33 and the 38. The record adds the courses (37-38 with the electives' 4) and
        states the 42. Its PDF page was also read for the certificate of the same title; its heading names the
        degree (own_heading).

HELD (3), s739e's reasons, read from its module: 31280 (not collectable: CRPNTRY 111C is still unplaced, and the
catalog's title for BLDGTCQ 014 is not the file's), 41011 (which course its L1 row names is the college's to say),
45285 (53 of 99 placed: a page pin and a reread).

    python3 kb/_program_piles_s740_lattc.py --dry-run
    python3 kb/_program_piles_s740_lattc.py --tag s740j

Guard: tests/program_piles_s740_lattc_test.py.
"""
from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739_gavilan as G  # noqa: E402
import _program_piles_s739_lattc as S739  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402

B, NG, S = B7.B, B7.NG, B7.S
COLLEGE = "Los Angeles Trade Technical College"
SLUG = "los_angeles_trade_technical"
TAG = "s740j"
HELD_BY = "kb/receipts/program_requirement_records_piles_s739_los_angeles_trade_technical_2026-11-26_s739e.json"
KEYS = ("31089", "31280", "41011", "45285")
# s739e's fifth hold: it passes since reread 45849372771 posted its reconciled record, so it is no key here.
PASSES_SINCE = ("41150",)
RECONCILE, REREAD = "45844759766", "45849372771"


def _first(text: str) -> float | None:
    m = re.search(r"\d+(?:\.\d+)?", text)
    return float(m.group(0)) if m else None


def list_short(filed: dict, e: dict) -> bool:
    """noted_figures_differ, where the two figures are one list's and its courses add short of it: the entry's note
    quotes the list's printed figure and what its courses add to (e["quotes"]); the list (e["block"], its place
    among the record's lists) prints that figure, its courses add to the quoted sum at their low end and stay below
    the figure at their high end; and the page's figures at their low end (G.printed_low, each list at its printed
    figure) are the stated total, which the record's own low end is not."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = B.pair(a.get("computed")), B.pair(a.get("stated"))
    note = next((n for n in B.notes(filed) if e["words"] in n), "")
    q = e["quotes"]
    bl = (filed.get("record") or {}).get("blocks") or []
    if e["gap"] != "noted_figures_differ" or q["figure"] not in note or q["sum"] not in note or comp is None \
            or st is None or e["block"] >= len(bl):
        return False
    fig = S._span(bl[e["block"]].get("stated"))
    adds = S.block_units_summed(bl[e["block"]], {}, S.measure(filed.get("record") or {}) == "hours")[0]
    low = G.printed_low(filed)
    if fig is None or adds is None or low is None:
        return False
    return abs(fig[0] - _first(q["figure"])) <= NG.FIG_EPS and abs(fig[1] - fig[0]) <= NG.FIG_EPS \
        and abs(adds[0] - _first(q["sum"])) <= NG.FIG_EPS and adds[1] + NG.FIG_EPS < fig[0] \
        and abs(low - st[0]) <= NG.FIG_EPS and comp[0] + NG.FIG_EPS < st[0]


REVIEWED = {
    "31089": {"gap": "noted_figures_differ", "computed": [37, 38], "stated": [42, 42],
              "words": "Required courses listed in the semester sequence sum to 33 units, not the stated 38",
              "shape": ["list_short"], "block": 0, "quotes": {"figure": "the stated 38", "sum": "sum to 33 units"},
              "own_heading": "SOLAR THERMAL INSTALLATION & MAINTENANCE ▌ Associate in Science Degree"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({cn: S739.HAND[cn] for cn in ("31280", "41011", "45285")})

W = B7.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Los Angeles Trade-Technical", prior=S739.W.prior, keys=KEYS,
            reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes={"list_short": list_short})


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
