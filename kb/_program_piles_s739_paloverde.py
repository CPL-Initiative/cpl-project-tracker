#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Palo Verde: the five records s721a held, each collected with its gap named.

S721's plan (kb/_program_piles_s721_paloverde.py, s721a) collected 15 of the census's wording-rule records and held
five. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected with its gap named
and a lower score, never held, unless the record is not the program's own. The five are read again here, by key, from
the committed records, their notes and today's capture. Each was read from a catalog page of its own address
(preview_program.php?poid=...), which no other record was read from. No catalog read, no reconcile, no record
changed, no new kind. S721's two kinds keep S721's own checks, imported from its module, never copied.

COLLECTED WITH A NAMED GAP (5, REVIEWED below):
  degree_electives_not_printed (50)  17998 Liberal Arts, Arts and Humanities A.A.: the 18-unit emphasis and CalGETC's
        34-38 add to 52-56 against the printed 60-61, and the record holds no electives figure and no word that
        electives fill the degree (S721's degree_rest, the kind's own check). S721 held it because no note of its own
        says the page prints no electives; the record's own fields say it, and its notes name the three figures.
        Of those fields, electives_fill_degree false is the field's default (every Palo Verde certificate and
        noncredit record carries it; two degrees whose page says electives fill the rest carry true), so it says the
        reader reported no such sentence, never that the reader looked for one and found none. The kind's sentence
        ends 'and does not say they fill the rest': the row stands on that default and on the null electives figure
        (S739's reader, MINOR).
  figure_within_variable_units (60)  41242 Fire Science Technical Rescue: the required list's printed 17.25 falls
        inside the 9.25-21.5 its courses carry (FST 090 at 0.25-12, EMS 161 at 1-1.5), and its note says the 17.25
        and the electives' 12.75 are the printed 30 (S721's spans_figure, and the figures add to the stated total).
        S721 held it because no note names FST 090's range; the record's own course rows carry it.
  noted_figures_differ (40)          41227 Fire Science Hazardous Materials Specialist, two gaps on one row, both
        notes filed: its lists' printed 19.5 and 10.25 add to 29.75 against the header's 30 (its note quotes both),
        and the required 19.5 falls inside its variable-unit courses' range, which is why the record's own sum runs
        22.25-34.5 around both figures. The kind filed is the lower score of the two.
  pool_figure_not_read (40)          45359 Cal-GETC certificate: 'Physical and Biological Sciences - Total 7 Credits'
        is one figure over three sub-lists the record adds apart (7-15), which carries its high end to 43 against the
        printed 34-38. With the three read as one pool at 7 the areas' printed figures add to 35, inside the printed
        range and a unit past its low end: the pool is the gap its note names, and the receipt carries the note that
        gives the printed 34-38 beside it.
  lists_not_closed (30)              17999 Liberal Arts, Social and Behavioral Sciences A.A.: Lists A and B (3-4 and
        4 units) print after the 18-unit Area of Emphasis with no word on how they relate to it, and every course of
        both is also on the emphasis list, so the lists alone cannot add the major: 25-26 with them apart, the
        printed 18 with them inside. Its degree's 60-61 holds 59-64 only on the first reading; both notes are filed.

HELD: none.

    python3 kb/_program_piles_s739_paloverde.py --dry-run
    python3 kb/_program_piles_s739_paloverde.py --tag s739k

Guard: tests/program_piles_s739_paloverde_test.py.
"""
from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s721_paloverde as PV  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

NG, S = B.NG, B.S
COLLEGE = "Palo Verde College"
SLUG = "palo_verde"
TAG = "s739k"
HELD_BY = "kb/receipts/program_requirement_records_piles_s721_paloverde_2026-11-24_s721a.json"
KEYS = ("17998", "17999", "41227", "41242", "45359")
_SCIENCES = ["Physical Sciences", "Biological Sciences", "Lab"]
_EMPHASIS = "Area of Emphasis - Total 18 Minimum Credits is Required"
_LISTS = ["List A: Total 3-4 Credits", "List B: Total 4 Credits"]


def _figure(text: str) -> float | None:
    nums = re.findall(r"\d+(?:\.\d+)?", text)
    return float(nums[-1]) if nums else None


def degree_rest(filed: dict, e: dict) -> bool:
    """degree_electives_not_printed: S721's own check (the major passes, the general education units were read, the
    two add short of the printed degree total at both ends, and the record holds no electives figure and no word that
    electives fill the degree)."""
    return PV.degree_rest(filed)


def spans_total(filed: dict, e: dict) -> bool:
    """figure_within_variable_units: S721's own check (a required list's figure falls inside its variable-unit
    courses' range), and the lists' printed figures add to the stated total exactly."""
    st = ((filed.get("score") or {}).get("arithmetic") or {}).get("stated")
    return PV.spans_figure(filed) and st is not None and B.same(PV._figures(filed), st)


def figures_short(filed: dict, e: dict) -> bool:
    """noted_figures_differ, where the record's own sum is a range around both figures: the entry's note quotes the
    lists' figures' sum and the header's total (e["quotes"]); the lists' printed figures add to the first and the
    record states the second; the two differ; and a required list's figure falls inside its variable-unit courses'
    range (S721's spans_figure), so the record's sum holds both."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    note = next((n for n in B.notes(filed) if e["words"] in n), "")
    q = e["quotes"]
    figs, comp, st = PV._figures(filed), B.pair(a.get("computed")), B.pair(a.get("stated"))
    if q["sum"] not in note or q["stated"] not in note or figs is None or comp is None or st is None:
        return False
    return B.same(figs, [_figure(q["sum"])] * 2) and B.same(st, [_figure(q["stated"])] * 2) \
        and not B.same(figs, st) and PV.spans_figure(filed) \
        and comp[0] - NG.FIG_EPS <= figs[0] <= comp[1] + NG.FIG_EPS and comp[0] - NG.FIG_EPS <= st[0] <= comp[1] + NG.FIG_EPS


def pool_inside(filed: dict, e: dict) -> bool:
    """pool_figure_not_read, where the pool does not close the record: each named list prints no figure of its own,
    the entry's note quotes the one figure over them, the record's high end is past the printed top as filed, and
    with the lists read as one pool at that figure today's scorer reads a sum inside the printed range."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = B.pair(a.get("computed")), B.pair(a.get("stated"))
    bs = [B.blocks(filed, n) for n in e["pool"]]
    note = next((n for n in B.notes(filed) if e["words"] in n), "")
    if any(len(x) != 1 or S._span(x[0].get("stated")) is not None for x in bs) or comp is None or st is None \
            or "Total %g Credits" % e["figure"] not in note or comp[1] <= st[1] + NG.FIG_EPS:
        return False
    rec = B.apply_ops(filed, [("pool", e["pool"], e["figure"])])
    if rec is None:
        return False
    now = B.pair(B.C.fresh_score(dict(filed, record=rec))["arithmetic"].get("computed"))
    return now is not None and B.same(now, e["pooled"]) and st[0] - NG.FIG_EPS <= now[0] and now[1] <= st[1] + NG.FIG_EPS


def sublists(filed: dict, e: dict) -> bool:
    """lists_not_closed, where a choice list also takes the courses of the lists printed after it: every course of
    each named list (e["sublists"]) is on the named choice list (e["within"]), and the record adds past its stated
    total at the low end with the lists apart."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = B.pair(a.get("computed")), B.pair(a.get("stated"))
    whole = B.blocks(filed, e["within"])
    if len(whole) != 1 or whole[0].get("rule") != "choose_units" or comp is None or st is None:
        return False
    on = {S.norm_code(c.get("code")) for c in whole[0].get("courses") or []}
    for name in e["sublists"]:
        bs = B.blocks(filed, name)
        if len(bs) != 1 or not bs[0].get("courses") \
                or not {S.norm_code(c.get("code")) for c in bs[0]["courses"]} <= on:
            return False
    return comp[0] > st[1] + NG.FIG_EPS


REVIEWED = {
    "17998": {"gap": "degree_electives_not_printed", "computed": [52, 56], "stated": [60, 61],
              "words": "'Credits: 60.0 - 61.0' at the top of the page is recorded as degree_total; the 18-credit Area "
                       "of Emphasis total is recorded as total_units",
              "also_words": "CalGETC pattern printed at 34-38 credits",
              "shape": ["degree_rest"],
              "note": "electives_fill_degree false is the field's default, not a finding of the reader's: the row "
                      "stands on it and on the null electives figure (S739's reader, MINOR)"},
    "41242": {"gap": "figure_within_variable_units", "computed": [21.75, 34.0], "stated": [30, 30],
              "words": "The certificate total is 'Credits: 30.0' as printed, which matches 17.25 required plus 12.75 "
                       "elective credits",
              "shape": ["spans_total"], "courses": ["FST090"]},
    "41227": {"gap": "noted_figures_differ", "computed": [22.25, 34.5], "stated": [30, 30],
              "words": "Block totals printed are 19.5 (required) and 10.25 (electives), summing to 29.75, while the "
                       "certificate header states Credits: 30.0",
              "also_words": "Several courses print variable unit ranges (e.g., FST 090 0.25-12, FST 080 0.25-24, "
                            "FST 290 0.25-6)",
              "shape": ["figures_short"], "quotes": {"sum": "summing to 29.75", "stated": "Credits: 30.0"},
              "courses": ["FST090"]},
    "45359": {"gap": "pool_figure_not_read", "computed": [35, 43], "stated": [34, 38],
              "words": "Physical and Biological Sciences - Total 7 Credits: 'Courses must be in 2 different "
                       "disciplines, 1 must be a lab course'. Recorded as Physical Sciences, Biological Sciences and "
                       "Lab sub-lists each choose 1",
              "also_words": "total_units taken from 'Credits: 34.0-38.0'",
              "shape": ["pool_inside"], "pool": _SCIENCES, "figure": 7, "pooled": [35, 35]},
    "17999": {"gap": "lists_not_closed", "computed": [25, 26], "stated": [18, 18],
              "words": "The page prints List A (Total 3-4 Credits: STAT C1000, PSY 155) and List B (Total 4 Credits: "
                       "ANTH C1001, ANTH C1001L) after the 18-credit Area of Emphasis list, with no instruction on how "
                       "they relate to it",
              "also_words": "Credits: 60.0 - 61.0 recorded as degree_total; CalGETC 34-38 recorded as ge_units",
              "ops": [("drop", _LISTS[0]), ("drop", _LISTS[1])], "closes": "major",
              "shape": ["sublists"], "sublists": _LISTS, "within": _EMPHASIS},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
SHAPES = {"degree_rest": degree_rest, "spans_total": spans_total, "figures_short": figures_short,
          "pool_inside": pool_inside, "sublists": sublists}

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Palo Verde", prior=B.LiveRuns(COLLEGE, SLUG), keys=KEYS,
           reviewed=REVIEWED, hand=HAND, held_by=HELD_BY, shapes=SHAPES)


if __name__ == "__main__":
    sys.exit(W.main(doc=__doc__))
