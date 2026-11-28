#!/usr/bin/env python3
"""S748, lane 1 (readers) at Sierra: filed records that fail on the arithmetic alone, each collected with its gap named.

The census of 2026-11-28 00:44Z lists 99 Sierra programs with no passing record: 65 with no closed list in the
Program Course File, 20 whose page the capture did not hand them, and 14 with a filed record. Sierra prints each
department's programs on one page, and twelve of the fourteen were read from their own section there (two place
none of their courses and are named gaps already, kb/program_requirements_college/sierra/named_gaps_s739.json).
Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with its gap
named and a lower score, never held for another night. Each row below stands on the record's own note and on a
check of its figures; no catalog read by a model, no reconcile, no record changed, no new kind.

COLLECTED WITH A NAMED GAP (REVIEWED below):
  pair_read_as_alternatives (50)  the page prints 'CHEM 0001A ... 5-6' with 'or CHEM 0003A & CHEM 0003B' beneath it,
      the two halves of one course taken together; the record keeps them as two alternatives, so the low end takes
      one half alone and falls two units short of the printed total. With the pair read as one alternative at the
      row's 6 each major adds to its printed total exactly:
        33639  Biology A.S.-T                  29.5-38 against the printed 31.5-38
        33646  Nutrition and Dietetics A.S.-T  27-30 against the printed 29-30
      Both also read the degree's 60 with no Cal-GETC units; the second note each files says so.
  noted_no_total (40)
        36718  Allied Health - Pre-Nursing Option A.S.: its section prints no major total (40-46 as read)
  noted_section_cut_off (20)  the department page runs past the text the capture sends, and the note says where
        39209  UCTP: Chemistry: cut inside the Language Other Than English list

Each row's live run is the conductor's live read of 2026-11-28 07:38Z
(kb/receipts/program_requirements_reread_s748_sierra_checked.json), since no committed receipt posts Sierra's runs.

HELD, each with its reason in HAND: 40181 (the same pair, and today's scorer passes its own arithmetic: a reconcile
step, never a gap), 21525 (live on an older run than main files: a reread first), 45624 (two readings at once),
17979 (a page read first), 31922 and 31923 (no filed kind), 32007 and 38522 (coverage, not arithmetic).

    python3 kb/_program_piles_s748_sierra.py --dry-run
    python3 kb/_program_piles_s748_sierra.py --tag s748r2

Guard: tests/program_piles_s748_sierra_test.py.
"""
from __future__ import annotations

import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s742 as B9  # noqa: E402

B, NG = B9.B, B9.NG
COLLEGE = "Sierra College"
SLUG = "sierra"
TAG = "s748r2"
KEYS = ("17979", "21525", "31922", "31923", "32007", "33639", "33646", "36718", "38522", "39209", "40181", "45624")
LIVE_READS = ("program_requirements_reread_s748_*_checked.json",)


class LiveRead(B9.LiveRead):
    """S742's LiveRead over S748's committed live reads too (the same form: read_at, live_runs by college)."""

    def live_read(self) -> dict:
        out = super().live_read()
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


_CHEM = ("pair", "CHEM 0001A", ["CHEM 0003A", "CHEM 0003B"], 6)
_CHEM_COURSES = ["CHEM1A", "CHEM3A", "CHEM3B"]

REVIEWED = {
    "33639": {"gap": "pair_read_as_alternatives", "computed": [29.5, 38], "stated": [31.5, 38],
              "words": "CHEM 0001A row prints 5-6; alternative is CHEM 0003A & CHEM 0003B taken together",
              "also_words": "No Cal-GETC unit figure printed", "closes": "major",
              "ops": [_CHEM], "courses": _CHEM_COURSES,
              "own_heading": "Biology for Transfer AS-T Degree"},
    "33646": {"gap": "pair_read_as_alternatives", "computed": [27, 30], "stated": [29, 30],
              "words": "the alternative is the pair CHEM 0003A & CHEM 0003B taken together (both required)",
              "also_words": "No Cal-GETC unit figure is printed, so ge_units is null", "closes": "major",
              "ops": [_CHEM], "courses": _CHEM_COURSES,
              "own_heading": "Nutrition and Dietetics for Transfer AS-T Degree"},
    "36718": {"gap": "noted_no_total", "computed": [40, 46], "stated": None, "shape": ["no_total"],
              "words": "No major total is printed for the Pre-Nursing Option",
              "own_heading": "Allied Health - Pre-Nursing Option AS Degree"},
    "39209": {"gap": "noted_section_cut_off", "computed": [65, 77], "stated": None, "shape": ["cut"],
              "words": "The catalog text is cut off inside the Language Other Than English list",
              "own_section": "Read only the 'UC Transfer Pathway (UCTP): Chemistry' section"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "40181": ("held: the same pair (its note: 'CHEM 0001A is printed with 5-6 units, a range spanning the option of "
              "CHEM 0003A & CHEM 0003B'), 39-45 against the printed 41-45. Its halves carry no units, so today's "
              "scorer passes the record's own arithmetic and only the state file's 3 for one half fails it: such a "
              "record is rescored, never gap-filed (scorer_passes). A reconcile step that gives an alternative its "
              "row's printed units passes it free"),
    "21525": ("held: its live row holds run 38675248607 (the conductor's live read of 2026-11-28 07:38Z) while main "
              "files run 39726642315, whose note says its section is 'truncated after 'IT 0060'': keep-better and a "
              "reread of 39726642315 first, then noted_section_cut_off"),
    "45624": ("held: two readings at once. Its note says BIOL 0056 and BIOL 0056L are one alternative pair to BIOL "
              "0011, and that ESCI 0010 and 0010L print one combined 4 units; the record adds to 40-43 against the "
              "printed 42, and no one filed kind names both: a reconcile step for the joined lab, then the pair"),
    "17979": ("held: the record adds its two 9-unit lists to 18 under a printed 30, and its note only guesses that "
              "a further block was cut from the text ('may have been cut'): a free page read of the Liberal Arts "
              "page says what the section prints, then noted_section_cut_off or total_differs"),
    "31922": ("held: FASH 0028 prints 1 unit beside an alternative, FASH 0095, that the state lists at 0.5 to 4, so "
              "the low end reads 30.5 against the printed 31; no filed kind names an alternative read under the "
              "row's printed unit, and a reconcile step (the alternative takes its row's units) would pass it free"),
    "31923": ("held: the certificate prints the A.S.'s requirements, and its record is 31922's reading: the same "
              "half unit at FASH 0095"),
    "32007": ("held: its arithmetic is equal (27 against 27); it fails on coverage alone, 27 of 31 listed courses "
              "placed, which no arithmetic gap names"),
    "38522": ("held: its arithmetic is equal (18-20 against 18-20); it fails on coverage alone, 25 of 29 listed "
              "courses placed, which no arithmetic gap names"),
})

W = B9.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Sierra", prior=LiveRead(COLLEGE, SLUG), keys=KEYS,
            reviewed=REVIEWED, hand=HAND)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
