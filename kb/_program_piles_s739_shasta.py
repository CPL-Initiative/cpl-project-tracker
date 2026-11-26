#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Shasta: the 15 records s727c held, 12 collected with their gaps named.

S727's plan (kb/_program_piles_s727_shasta.py, s727c) collected 4 of the census's 19 wording-rule records and held 15.
Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named and a
lower score, never held, unless the record is not the program's own. The 15 are read again here, by key, from the
committed records, their notes and today's capture. No catalog read, no reconcile, no record changed, no new kind.

COLLECTED (12), each entry in REVIEWED:
  pool_figure_not_read (40)     18080, 18098, 18143, 18144: University Studies and General Studies emphases whose
        heading prints '18 Unit Emphasis' over two lists, 'Choose 12 - 18 units' and 'Choose the remaining 0 - 6
        units' (10-18 and 0-8; 15-18 and 0-3), which the record adds apart; read as one pool at 18 each closes at the
        printed 18. S727 held them on the cheaper lever (a pooled wording rule on a reconcile passes them): the lever
        is named in the receipt, and a reconcile's rescore drops the gap when it passes.
  heading_not_in_text (20)      18087 (University Studies - Engineering): the excerpt begins mid-section at
        'Engineering.' on p.79 and the heading, where these emphases print their unit figure, is not in the text, so
        no total was read. 18659 (University Studies - Earth Science Teacher): the text begins mid-description on
        p.74 and its heading, program code and any unit total are not in it; its own note says the Earth Sciences
        section that follows was not read (own_section).
  option_lists_read_apart (40)  18626 (General Studies - Geosciences Technician): three emphases of two or three
        lists each in one option group, every list its own alternative; its note says the blocks with one
        emphasis's name are completed together. The record adds to 15-26 against the heading's 26-30.
  noted_figures_differ (40)     09501 (Agriculture - Horticulture and Landscaping A.S.): the 'AGEH 48 OR AGEH 94' row
        prints 3 units and nothing beside AGEH 94, which the Irrigation certificate lists at 1-2; the record's low
        end takes the lower figure, and at the row's 3 the major adds to the printed 36-37 (the degree then reads
        62-64 against the printed 60, which its second note names: electives that vary with double counting; two
        gaps on one row, both notes filed). 35606 (Agriculture Plant
        Science A.S.-T): List A is headed 'Select one option' and prints 11-12 units, against the 3 one option
        carries and against the printed 28-33, which fits one option; the record adds List A at its printed figure.
  noted_total_cut_off (40)      43618 (Communication Studies 2.0 A.A.-T): the section's closing total line is cut off
        at the page break; every course is placed. Its heading names Communication Studies 2.0, and the page-mate
        30580 (Communication Studies), whose record carries the same heading, has the title the heading goes beyond.
  double_count_noted (40)       31845 (Geographic Information Systems A.S.), read against today's arithmetic: its
        major passes (37 against the printed 37-39, short_high), and the degree reads 65-67 against the printed 60,
        since the page lets the starred courses also meet general education and prints its electives as a figure
        that 'varies depending on units that double count'.
  nested_award_not_read (30)    34005 (Health Information Management B.S.): the degree's 120-126 counts the Health
        Information Technology A.S. (66-72) as one line, and the major counts the 9 units of upper-division general
        education the printed 45 leaves out; the gap files both notes (two gaps on one row, the lower score filed).

HELD (3):
  18625  not the program's own: its blocks are the 'Emphasis in Coastal Science Technician' of the Geosciences
         Technician degree (18626's record prints the same lists), and its own note puts its heading on the page
         before, which the read did not hold. A page read that finds its own section.
  18655  not collectable: coverage and invented fail (SOCI C1000 printed as SOC C1000), so no gap collects it; a
         prefix alias and a free reconcile is its lever.
  32162  the catalog's own figures: List A prints 7-9 over two courses that carry 6 to 11, and the printed 22-27 is
         the courses' own sum; the record reads 23-27 with the list at its printed low end. No note names it and no
         kind's sentence is true of it (a units sum inside a printed range): a scorer reading, not a reread.

18144'S LIVE RUN (d-multi-run-load-history-proves-run-s731c). Load 44518684470 inserted it over two runs, so its
receipt names no run for the key. FILE_HISTORY holds the record file's commits on main, read through the hosting API's
commits by path at READ_AT: its one commit is the commit that filed the load's receipt, so the file's run is the row's.

    python3 kb/_program_piles_s739_shasta.py --dry-run
    python3 kb/_program_piles_s739_shasta.py --tag s739b

Guard: tests/program_piles_s739_shasta_test.py.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s727_shasta as PRIOR  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Shasta College"
SLUG = "shasta"
TAG = "s739b"
HELD_BY = "kb/receipts/program_requirement_records_piles_s727_shasta_2026-11-25_s727c.json"
KEYS = ("09501", "18080", "18087", "18098", "18143", "18144", "18625", "18626", "18655", "18659", "31845", "32162",
        "34005", "35606", "43618")

READ_AT = "2026-11-26T07:30Z"
LOAD_COMMITS = {"44518684470": "0529ca750c241c5385376f431be7bbef36c0dec3"}
FILE_HISTORY = {"18144": ["0529ca750c241c5385376f431be7bbef36c0dec3"]}

_POOL_LEVER = ("a pooled wording rule on a Shasta reconcile (the two lists read as one pool at the heading's 18) passes "
               "it (S727's reason); a reconcile's rescore drops the gap when it passes")
_EMPHASES = ["Emphasis in Geologic Technician", "Emphasis in Weather Technician",
             "Emphasis in Coastal Science Technician"]


def nested_line(filed: dict, e: dict) -> bool:
    """nested_award_not_read on 34005: with the general education courses the printed major leaves out uncounted the
    major is the printed 45, and the printed degree total is that major, those courses' units and the nested award's
    printed line (e["award_line"], quoted in the entry's note) and nothing else."""
    rec = B.apply_ops(filed, [("uncount", c) for c in e["outside_major"]])
    if rec is None:
        return False
    now = B.C.fresh_score(dict(filed, record=rec))["arithmetic"]
    major = now.get("major") or now
    units = sum(B.S._num(B.course_rows(filed, c)[0].get("units")) for c in e["outside_major"])
    tot = B.pair(((filed.get("record") or {}).get("program") or {}).get("total_units"))
    deg = B.pair(((filed.get("record") or {}).get("program") or {}).get("degree_total"))
    lo, hi = e["award_line"]
    return bool(major.get("pass")) and B.same(major.get("computed"), tot) and tot is not None and deg is not None \
        and B.same(deg, [tot[0] + units + lo, tot[1] + units + hi]) \
        and any("%d-%d" % (lo, hi) in n for n in B.notes(filed) if e["words"] in n)


REVIEWED = {
    "09501": {"gap": "noted_figures_differ", "computed": [34, 37], "stated": [36, 37],
              "words": "The AGEH 48 OR AGEH 94 row prints 3 units only; no units are printed beside AGEH 94 (the state "
                       "file stores 1 unit, and the Irrigation certificate lists it as 1-2), so its unit value is "
                       "unclear",
              # At the row's 3 the major closes at the printed 36-37; the degree then reads 62-64 against the printed
              # 60, which the second note names (electives that vary with double counting): two gaps, one row.
              "also_words": "'Aditional Electives 5-6*' (number varies with double-counting)",
              "ops": [("alt_units", "AGEH 48", "AGEH 94", 3)], "closes": "major", "courses": ["AGEH48", "AGEH94"],
              "own_heading": "Agriculture – Horticulture and Landscaping Associate in Science: SC Program: AS.1492"},
    "18080": {"gap": "pool_figure_not_read", "computed": [12, 24], "stated": [18, 18],
              "words": "total_units of 18 taken from the section heading 'University Studies – 18 Unit Emphasis'",
              "ops": [("pool", ["Choose 12 – 18 units (see a counselor to select the courses appropriate for your "
                                "transfer university)",
                                "Choose the remaining 0 – 6 units from the following courses"], 18)],
              "lever": _POOL_LEVER,
              "own_heading": "Agriculture Sciences University Studies – 18 Unit Emphasis"},
    "18098": {"gap": "pool_figure_not_read", "computed": [10, 26], "stated": [18, 18],
              "words": "the blocks state 10-18 plus 0-8 units",
              "ops": [("pool", ["Choose 10-18 units from the courses listed below",
                                "Select the remaining 0 – 8 units from"], 18)],
              "lever": _POOL_LEVER,
              "own_heading": "World Languages — University Studies – 18 Unit Emphasis (SC Program: AA.1514)"},
    "18143": {"gap": "pool_figure_not_read", "computed": [15, 21], "stated": [18, 18],
              "words": "The second block ('remaining 0-3 units') is recorded with minimum 0 since the student may "
                       "complete all 18 units from the first list",
              "ops": [("pool", ["Choose 15-18 units from the following",
                                "Choose the remaining 0-3 units from the following"], 18)],
              "lever": _POOL_LEVER,
              "own_heading": "Business – General Business General Studies – 18 Unit Emphasis"},
    "18144": {"gap": "pool_figure_not_read", "computed": [12, 24], "stated": [18, 18],
              "words": "the two blocks (12–18 units plus 0–6 additional units) together make the 18-unit emphasis",
              "ops": [("pool", ["Choose 12 – 18 units from the following areas", "Choose 0 – 6 additional units"], 18)],
              "lever": _POOL_LEVER,
              "own_heading": "Office and Computer Technologies General Studies – 18 Unit Emphasis"},
    "18087": {"gap": "heading_not_in_text", "computed": [27, 30], "stated": None,
              "words": "The excerpt begins mid-section at 'Engineering.'; the full heading (likely 'University Studies "
                       "- Engineering' under a University Studies A.A. page) is not printed in the provided text",
              "also_words": "No total for the major is printed",
              "shape": ["heading_gone", "no_total"], "own_list": True},
    "18659": {"gap": "heading_not_in_text", "computed": [25, 26], "stated": None,
              "words": "The excerpt begins mid-description on page 74; the section heading, program code and any "
                       "earlier text for this award (possibly including a unit total or GE pattern) are not in the "
                       "text",
              "shape": ["heading_gone", "no_total"],
              "own_section": "The Earth Sciences University Studies section and GIS/Geography sections that follow "
                             "belong to other programs and were not read"},
    "18626": {"gap": "option_lists_read_apart", "computed": [15, 26], "stated": [26, 30],
              "words": "Each emphasis spans two or three blocks; all emphasis blocks share option_group 'Degree "
                       "Emphasis' and the blocks with the same emphasis-name prefix are completed together",
              "shape": ["option_names"], "options": _EMPHASES,
              "own_heading": "Geosciences Technician — General Studies – 26-30 Unit Emphasis (SC Program: AS.1602)"},
    "35606": {"gap": "noted_figures_differ", "computed": [36, 41], "stated": [28, 33],
              "words": "List A is headed 'Select one option' with a printed total of 11-12 units, which conflicts with "
                       "a one-option reading (3-5 units) and with the printed Major total of 28-33",
              "shape": ["block_over"], "over": "LIST A (Select one option)", "one": 3,
              "own_heading": "Agriculture Plant Science Associate in Science for Transfer: SC Program: AS-T.2002"},
    "43618": {"gap": "noted_total_cut_off", "computed": [18, 18], "stated": None,
              "words": "The section's closing total line is cut off at the page break",
              "shape": ["total_cut"],
              "own_heading": "Communication Studies 2.0 Associate in Arts for Transfer: SC Program: AA-T.4005"},
    "31845": {"gap": "double_count_noted", "today": True, "computed": [65, 67], "stated": [60, 60],
              "words": "Additional Electives printed as 7-9 with a footnote that the number varies depending on units "
                       "that double count",
              "also_words": "may also fulfill General Education requirements",
              "shape": ["double_count"], "double_courses": ["GEOG 5", "CIS 2", "GEOG 1A", "GEOG 1B"],
              "courses": ["GEOG5", "CIS2", "GEOG1A", "GEOG1B"],
              "own_heading": "Geographic Information Systems Associate in Science: SC Program: AS.1520"},
    "34005": {"gap": "nested_award_not_read", "computed": [54, 54], "stated": [45, 45],
              "words": "The degree total of 120-126 is built from the Health Information Technology AS Degree (66-72",
              "also_words": "match the printed 'Upper Division General Education 9'",
              "shape": ["nested_line"], "award_line": [66, 72], "outside_major": ["HIMS 408", "ENGL 401", "PSYC 401"],
              "courses": ["HIMS408", "ENGL401", "PSYC401"],
              "own_section": "The text after the degree total belongs to the Health Information Technology A.S. "
                             "program and was not read for this award"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "18625": ("held: not the program's own: its blocks are the 'Emphasis in Coastal Science Technician' that 18626's "
              "record prints under the Geosciences Technician degree, it places 5 of its 16 listed courses, and its own "
              "note puts its heading on the preceding page, which the read did not hold: a page read that finds its "
              "own section"),
    "18655": ("held: not collectable: coverage and invented fail (SOCI C1000 printed as SOC C1000), so no gap collects "
              "it (collected_with_gaps, kb/_harvest_gap_census.py); a prefix alias and a free reconcile is its lever, "
              "and its emphases then read as 18626's do"),
    "32162": ("held: the catalog's own figures: List A prints 7-9 over two courses that carry 6 to 11, and the printed "
              "22-27 is the courses' own sum; the record reads 23-27 with the list at its printed low end. No note "
              "names it, and no kind's sentence is true of a units sum inside a printed range: a scorer reading, not "
              "a reread"),
})

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Shasta", prior=PRIOR, keys=KEYS, reviewed=REVIEWED, hand=HAND,
           held_by=HELD_BY, shapes={"nested_line": nested_line}, file_history=FILE_HISTORY, load_commits=LOAD_COMMITS,
           read_at=READ_AT)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
