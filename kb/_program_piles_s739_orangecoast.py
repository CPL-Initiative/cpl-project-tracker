#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Orange Coast: the 17 records s721b held, four collected with named gaps.

S721's plan (kb/_program_piles_s721_orangecoast.py, s721b) held 17 of the census's wording-rule records, and 08626
sits on the wrong page (f-occ-08626-wrong-page-s727). Sam's ruling, as kb/_program_piles_s739.py carries it: a record
held for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's
own. The 17 are read again here, by key, from the committed records, their notes and today's capture. Each was read
from a catalog page of its own address. No catalog read, no reconcile, no record changed, no new kind.

LIVE RUNS. S721 held 32737 and 36732 because no receipt posted their run: load 39731785153 inserted them over three
runs. Reread 44909976872 has since kept both at run 39726645292, and by S731's rule (the shared module's LiveRuns) a
reread's kept key posts the reread's run where no other receipt posts the key. 32790 is still on no proved run.

COLLECTED (4, REVIEWED below):
  lists_not_closed (30)      32737 Spanish A.A.-T: 'Required Core (Substitution Courses) 15 Units Maximum' is a
        substitution list with a cap and no minimum, so its arithmetic is incomplete; without it the courses add to
        the printed 23-25. S721 held it on the cheaper lever (a substitution-list reading); the lever is named.
        36732 Marine Science A.S., two gaps on one row, both notes filed: 'Related Fields' is a sub-list of the
        restricted electives with a cap and no figure of its own, and the table's 12 core plus 3-7 electives do not
        match its printed 18-19.
  noted_figures_differ (40)  43362 Food and Beverage Management, Advanced: the Program Sequence tab prints 40-41.5
        (the prerequisite certificate at its list's 22) against the stated 38.5-40 (at its heading's 20.5); its note
        quotes both. Its heading goes beyond the title of 08663, the page-mate that carries the same heading.
        41373 Business Administration 2.0 A.S.-T: 'Total Major Units 28-29' against required courses that add to 29;
        its heading goes beyond the title of its page-mate 32086 (Business Administration).

HELD (13), each reason in HAND: 03954, 08664 and 31217 (the Requirements tab is not in the text: a reread); 03993 (no
note supports a kind: a reread); 08628, 19473, 19474 and 43100 (not collectable); 08663 (another award's page); 32790
(cut off, and on no proved live run); 08670, 36032 and 42331 (a sum the printed range or minimum holds: a scorer
reading). 08626 is no key (NOTE_08626): it passes as filed, read from the wrong page.

41373, ROLLED BACK AFTER THE APPLY (NOTE_41373, ROLLBACK_41373 below). S739's reader on s739m, Gavilan's plan: a sum
inside its printed range is no disagreement (d-lists-gap-holds-range-sums-s703), and 41373's 29 sits inside the
printed 28-29, so noted_figures_differ's sentence is not true of it. s739j was applied with it. Its row goes back by
kb/migrations/2026-11-26_s739j_41373_rollback.sql, s739j's own rollback limited to that one row (pre-read:
..._rollback_preread_md5.sql), and the record holds for a units within-range kind, a units twin of
hours_within_printed_range, with Gavilan 08460, 19378, 38787 and 41394. The plan's receipt and its four SQL files
stay as applied: they are the record of what was written. Its entry left REVIEWED (ROLLED_BACK keeps it), it is a
hold in HAND, and its committed record is back at the receipt's before-image, so no later load posts the gap again.

    python3 kb/_program_piles_s739_orangecoast.py --dry-run
    python3 kb/_program_piles_s739_orangecoast.py --tag s739j
    python3 kb/_program_piles_s739_orangecoast.py --rollback-41373     (writes the two rollback files)

Guard: tests/program_piles_s739_orangecoast_test.py.
"""
from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Orange Coast College"
SLUG = "orange_coast"
TAG = "s739j"
HELD_BY = "kb/receipts/program_requirement_records_piles_s721_orangecoast_2026-11-24_s721b.json"
WRONG_PAGE = ("08626",)
KEYS = ("03954", "03993", "08628", "08663", "08664", "08670", "19473", "19474", "31217", "32737", "32790", "36032",
        "36732", "41373", "42331", "43100", "43362")

_SUBSTITUTION = "Required Core (Substitution Courses) 15 Units Maximum"
REVIEWED = {
    "32737": {"gap": "lists_not_closed", "computed": [23, 25], "stated": [23, 25],
              "words": "The 'Required Core (Substitution Courses) 15 Units Maximum' list is a substitution list",
              "ops": [("drop", _SUBSTITUTION)], "shape": ["open"], "open": _SUBSTITUTION,
              "lever": "a substitution-list reading on a reconcile passes it (S721's reason); a reconcile's rescore "
                       "drops the gap when it does"},
    "36732": {"gap": "lists_not_closed", "computed": [15, 19], "stated": [18, 19],
              "words": "Related Fields courses may fulfill up to three units of the 3-7 unit restricted elective "
                       "requirement; they are a sub-list of the Restricted Electives, not a separate minimum",
              "also_words": "12 core + 3-7 does not match 18-19",
              "shape": ["open"], "open": "Related Fields"},
    "43362": {"gap": "noted_figures_differ", "computed": [40, 41.5], "stated": [38.5, 40],
              "words": "Program Sequence tab prints Total Units 40-41.5 (using 22 for the prerequisite courses), "
                       "differing from the stated Total Certificate Units 38.5-40",
              "shape": ["note_quotes"], "quotes": {"stated": "38.5-40", "computed": "40-41.5"},
              "own_heading": "Food and Beverage Management, Advanced, Certificate of Achievement"},
    "41373": {"gap": "noted_figures_differ", "computed": [29, 29], "stated": [28, 29],
              "words": "Catalog prints 'Total Major Units 28-29', but the listed required courses sum to 29 units",
              "shape": ["note_quotes"], "quotes": {"stated": "Total Major Units 28-29", "computed": "sum to 29 units"},
              "own_heading": "Business Administration 2.0, Associate in Science Degree for Transfer (AS-T)"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
_TAB = "held: the Requirements tab is not in the text the reader saw (an incomplete read, never a gap): a reread"
_NOT = "held: not collectable (collected_with_gaps, kb/_harvest_gap_census.py): %s"
HAND.update({
    "03954": _TAB, "08664": _TAB, "31217": _TAB,
    "03993": ("held: its notes support no kind (18-21 against the printed 20; the core's 'or' alternatives carry no "
              "units): a reread"),
    "08628": _NOT % ("coverage and invented fail (CNST A196 and A197 unplaced; 11 catalog codes off the state's list), "
                     "and its heading names Building Construction, not Residential Construction Development"),
    "19473": _NOT % "coverage and invented fail (CNST A196 and A197 unplaced)",
    "19474": _NOT % "coverage and invented fail (CNST A196 and A197 unplaced)",
    "43100": _NOT % "coverage fails (PSYC A160 on the state's list, not placed)",
    "08663": ("held: not the program's own: its page is the Food and Beverage Management, Advanced certificate's "
              "(43362's, whose heading its record carries); 08663 is the Food and Beverage Management certificate: a "
              "page-finding step"),
    "32790": ("held: its text is cut off mid-Area 5A and it reads no total, and no committed receipt posts its "
              "committed run (44747523200) to its live row: load 44749916015 inserted it over five runs, and no "
              "reread has kept it since. A file-history proof of its run, then noted_section_cut_off"),
    "08670": ("held: its 62.5-63.5 sits inside the printed 60-63.5, whose low end the page prints as 'Minimum 60 units "
              "required for the degree'; no kind's sentence is true of a sum the printed range holds: a scorer reading "
              "(S721's degree_total_minimum rule), not a reread"),
    "36032": ("held: its major passes and the degree reads 55-64 around the printed 60, with electives the page prints "
              "as 'Varies' and says fill the rest, so degree_electives_not_printed's sentence is not true of it: a "
              "scorer reading, not a reread"),
    "42331": ("held: its 11.5-16 sits inside the printed 9.5-16 (CNST A190 or A189 at one printed range, and a "
              "requirement a CPR certification meets from zero); no kind's sentence is true of a sum the printed range "
              "holds: a scorer reading, not a reread"),
})
# 08626 is no key: it passes as filed, so no plan on its live row moves it. It was read from the wrong page
# (f-occ-08626-wrong-page-s727), and only a page pin and a reread settle which page is its own.
NOTE_08626 = ("it passes as filed, read from the wrong page (f-occ-08626-wrong-page-s727): a page pin and a reread, "
              "never a plan on its live row")

# 41373 after the apply: held, its row rolled back (the docstring's last section).
NOTE_41373 = ("held: its sum sits inside its printed range (29-29 in 28-29), so no two figures disagree and "
              "noted_figures_differ's sentence is not true of it (d-lists-gap-holds-range-sums-s703); s739j was applied "
              "with it, and its row goes back by kb/migrations/2026-11-26_s739j_41373_rollback.sql: it waits for a "
              "units within-range kind, a units twin of hours_within_printed_range, with its own self-recall")
# Its entry as s739j applied it, kept as the record of what was written; it is no entry of the plan now.
ROLLED_BACK = {"41373": REVIEWED.pop("41373")}
HAND["41373"] = NOTE_41373

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Orange Coast", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY)

ROLLBACK_41373 = {"control_number": "41373", "tag": "s739j 41373 rollback",
                  "sql": "kb/migrations/2026-11-26_s739j_41373_rollback.sql",
                  "preread_md5": "kb/migrations/2026-11-26_s739j_41373_rollback_preread_md5.sql"}


def rollback_41373_row() -> dict:
    """s739j's own receipt row for 41373: its run, before-image and after-image, as the apply wrote them."""
    with open(W.receipt_path("2026-11-26"), encoding="utf-8") as fh:
        rows = [r for r in json.load(fh)["records"] if r["control_number"] == ROLLBACK_41373["control_number"]]
    if len(rows) != 1:
        raise SystemExit("s739j's receipt names 41373 once")
    return rows[0]


def rollback_41373_files() -> dict:
    """{path: text} of the two files: s739j's rollback limited to 41373 (the before-image's checks back only where
    the row still holds s739j's after-image; it aborts unless it matches exactly that 1 row, less a row a person
    checked), and its md5 pre-read."""
    row = rollback_41373_row()
    hdr = ("-- S739J, Orange Coast 41373 alone: s739j's rollback limited to the one row (its values line is s739j's own,\n"
           "-- kb/migrations/2026-11-26_s739j_prreq_piles_rollback.sql row %d). Why: its 29 sits inside the printed 28-29,\n"
           "-- so noted_figures_differ's sentence is not true of it (d-lists-gap-holds-range-sums-s703; S739's reader).\n"
           "-- Receipt: kb/receipts/program_requirement_records_piles_s739_orange_coast_2026-11-26_s739j.json.\n"
           % row["i"])
    return {
        ROLLBACK_41373["sql"]: (
            hdr + "-- Rollback: the before-image's checks back where the row still holds s739j's after-image; it aborts,\n"
                  "-- writing nothing, unless it matches exactly 1 row (less a row a person checked, listed as\n"
                  "-- skipped_checked). The committed record's score goes back with it, or the next load posts the gap again.\n"
            + B.NG.rollback_sql([row], ROLLBACK_41373["tag"]) + "\n"),
        ROLLBACK_41373["preread_md5"]: (
            hdr + "-- Compact pre-read for the rollback, read-only: one SELECT, one JSON value; md5 of each image's jsonb text.\n"
                  "-- The rollback writes only where the row holds the after-image, so a clean reading is: listed 1, on_run 1,\n"
                  "-- record_is_before 1, checks_is_before 0, already_after 1, checked_now 0.\n"
            + B.md5_pre_read([row]) + "\n"),
    }


if __name__ == "__main__" and "--rollback-41373" in sys.argv:
    for rel, text in rollback_41373_files().items():
        with open(os.path.join(B.ROOT, rel), "w", encoding="utf-8") as fh:
            fh.write(text)
        print("wrote %s" % rel)
    sys.exit(0)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
