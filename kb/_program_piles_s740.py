#!/usr/bin/env python3
"""S740, lane 2's cheap piles: the shared plan code, S739's (kb/_program_piles_s739.py) with one kind added.

Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record whose
figures do not reconcile is collected with its gap named and a lower score on the 0-100 bar, never dropped. A named
gap must be TRUE of its record: S739's reader rejected noted_figures_differ on a units sum inside its printed range,
where no two figures disagree (d-within-range-sums-hold-for-units-kind-s739, d-lists-gap-holds-range-sums-s703), and
seven records held for a kind of their own.

THE KIND. units_within_printed_range (kb/_program_named_gaps.py, score 50), the units twin of
hours_within_printed_range: the courses' units as read add to a figure the printed range of units holds, with its
low end above the range's low end, so today's scorer fails it. The sentence says only what the record's filed figures
show, so the words filed are the kind's own, written from the figures (NG.units_within_printed_range), as the hours
kind's are; a note of the record's that quotes the same two figures is filed beside them where the entry names one.

A REVIEWED LIST, NEVER A RULE. Statewide the figures name records other levers own (WITHIN_HELD below: a waiver the
page prints, a page that is not the program's own, a reread), so the kind is filed by key from each college's
reviewed list, under every standing guard of S739's Pile: scorer_passes, on_live_run, the record-rule guard,
collectable and the own-page guard. An entry of this kind reads:

    {"gap": "units_within_printed_range", "computed": [...], "stated": [...], "words_from": "figures",
     "shape": ["within"], "words": "<a note's words, where a note quotes the figures>"}

THE SELF-RECALL, two parts (tests/program_units_within_s740_test.py):
  * NG.units_within_recall: every passing units record the scorer reproduces, its printed total moved four ways, the
    scorer's own verdict the held answer;
  * within_held_recall below: the failing records statewide that the figures name, against the hand answers
    committed plans and handoff 740 hold for them (WITHIN_HELD). It counts what the figures alone get right and
    wrong, and what the reviewed lists get right and wrong.

Each college's plan: kb/_program_piles_s740_<college>.py; guards: tests/program_piles_s740_<college>_test.py.
"""
from __future__ import annotations

import collections
import copy
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s739 as B  # noqa: E402

NG, S = B.NG, B.S
ROOT = B.ROOT
PASSES = B.PASSES
WITHIN = "units_within_printed_range"
# The words a kind writes from the record's own figures (words_from "figures").
FIGURE_WORDS = {WITHIN: NG.units_within_printed_range}


def shape_within(filed: dict, e: dict) -> bool:
    """The kind's own check: its figures, on the record as filed (NG.units_within_printed_range)."""
    return e["gap"] == WITHIN and NG.units_within_printed_range(filed) is not None


class Pile(B.Pile):
    """S739's Pile with the figures' own words and the within shape."""

    def __init__(self, **kw):
        kw["shapes"] = dict({"within": shape_within}, **(kw.get("shapes") or {}))
        super().__init__(**kw)

    def words(self, filed: dict, e: dict) -> str | None:
        if e.get("words_from") != "figures":
            return super().words(filed, e)
        fn = FIGURE_WORDS.get(e["gap"])
        figures = fn(filed) if fn else None
        if not figures:
            return None
        if not e.get("words"):
            return figures
        note = super().words(filed, e)
        return None if note is None else figures + " | " + note

    def break_shape(self, g: dict, e: dict, sh: str) -> dict | None:
        if sh == "within":
            # The sum moved past the printed range: outside it, the kind names nothing.
            st = g["score"]["arithmetic"]["stated"]
            g["score"]["arithmetic"]["computed"] = [st[1] + 1, st[1] + 1]
            return g
        return super().break_shape(g, e, sh)

    def boundaries(self) -> dict:
        """S739's boundary readings, and the figures' own. An entry whose words are the figures alone has no note
        to take away, so S739's readings skip it and its readings are made here: the stated total one unit off,
        coverage failing, the within shape broken, its own section not shown. Every figures entry also reads: the
        program measured in hours (the hours kind's, never this one), and the sum's low end at the range's low end
        (the scorer's short-high reading, which passes)."""
        bare = {cn for cn, e in self.reviewed.items() if e.get("words_from") == "figures" and not e.get("words")}
        saved = self.reviewed
        self.reviewed = {cn: e for cn, e in saved.items() if cn not in bare}
        try:
            base = super().boundaries()
        finally:
            self.reviewed = saved
        out, wrong = collections.Counter(base["counts"]), list(base["wrong"])

        def tally(name, ok, cn):
            out["%s %s" % (name, "right" if ok else "wrong")] += 1
            if not ok:
                wrong.append([cn, name])

        for cn in self.keys:
            e = self.reviewed.get(cn)
            f = self.load(cn)
            if f is None or not e or e.get("words_from") != "figures" or not self.gap_noted(f):
                continue
            g = copy.deepcopy(f)
            g["record"]["program"]["measure"] = "hours"
            tally("the program measured in hours", self.gap_noted(g) is None and not self.kind_closes(g, e), cn)
            g = copy.deepcopy(f)
            a = g["score"]["arithmetic"]
            a["computed"] = [a["stated"][0], a["stated"][0]]
            tally("the sum at the range's low end", not self.kind_closes(g, e), cn)
            if cn not in bare:
                continue
            g = copy.deepcopy(f)
            a = g["score"]["arithmetic"]
            a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1]
            tally("the stated total one unit off", self.gap_noted(g) is None, cn)
            g = copy.deepcopy(f)
            g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
            tally("coverage failing", self.gap_noted(g) is None, cn)
            g = self.break_shape(copy.deepcopy(f), e, "within")
            tally("the within shape broken", not self.kind_closes(g, e), cn)
            if self.shared_with(cn):
                g = copy.deepcopy(f)
                g["record"]["notes"] = [n for n in B.notes(g) if not (e.get("own_section") and e["own_section"] in n)]
                g["record"]["program"]["section_heading"] = "another heading"
                g["score"]["coverage"] = dict(g["score"]["coverage"], share=0.0)
                tally("its own section not shown", self.own(g, e) is None, cn)
        return {"counts": dict(out), "wrong": wrong}

    def receipt_path(self, day: str, tag: str | None = None) -> str:
        return os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s740_%s_%s_%s.json"
                            % (self.slug, day, tag or self.tag))


# ── the statewide self-recall on held answers ──────────────────────────────
# The failing records the figures name whose answer a committed plan or handoff 740 holds, by (college, control
# number): the kind where S739 held the record for it, else the lever or the hold that owns the record, with where
# that answer is written. A key that leaves the figures' list (its lever passed it, a plan filed it) is counted as
# gone, never as wrong.
_S739 = "d-within-range-sums-hold-for-units-kind-s739 (handoff 740, Blocks)"
_WAIVER = "none: the waiver shape's (f-waiver-shape-misses-six-s731; handoff 740, Blocks)"
_WAIVED = "none: the waiver shape's statewide fire (kb/_program_piles_s730_saddleback.py STATEWIDE)"
WITHIN_HELD = {
    ("Gavilan College", "08460"): (WITHIN, _S739), ("Gavilan College", "19378"): (WITHIN, _S739),
    ("Gavilan College", "38787"): (WITHIN, _S739), ("Gavilan College", "41394"): (WITHIN, _S739),
    ("Orange Coast College", "41373"): (WITHIN, _S739), ("College of the Canyons", "36793"): (WITHIN, _S739),
    # S739 held 32162 for the kind too. S740's review under the own-page guard: its heading sits on the page before
    # the one the read held (its own section_heading and note say so), and 18094, read from the same page, holds 29
    # of its 32 courses in the same unit band, so none of the guard's three forms shows the section its own.
    ("Shasta College", "32162"): (None, "none: not shown to be the program's own (the own-page guard; "
                                        "kb/_program_piles_s740.py SHASTA_32162)"),
    ("Saddleback College", "42644"): (None, _WAIVER), ("Saddleback College", "19551"): (None, _WAIVER),
    ("Saddleback College", "22933"): (None, _WAIVER), ("Orange Coast College", "42331"): (None, _WAIVER),
    ("Madera Community College", "39862"): (None, _WAIVER), ("Reedley College", "18957"): (None, _WAIVER),
    ("Saddleback College", "04094"): (None, _WAIVED), ("Saddleback College", "04119"): (None, _WAIVED),
    ("Saddleback College", "09869"): (None, _WAIVED), ("Saddleback College", "22902"): (None, _WAIVED),
    ("Saddleback College", "22903"): (None, _WAIVED), ("Saddleback College", "22904"): (None, _WAIVED),
    ("Saddleback College", "44664"): (None, _WAIVED), ("Saddleback College", "44665"): (None, _WAIVED),
    ("Saddleback College", "44666"): (None, _WAIVED),
    ("San Bernardino Valley College", "22784"): (None, _WAIVED),
    ("Los Angeles City College", "02746"): (None, "none: prerequisites_counted's reading "
                                                  "(kb/_program_piles_s730_saddleback.py STATEWIDE_OUT)"),
    ("Modesto Junior College", "35127"): (None, "none: two learner paths, no kind fits (handoff 740, Blocks)"),
    ("Clovis Community College", "37227"): (None, "none: a reread, its note only suspects two courses are "
                                                  "alternatives (kb/_program_piles_s720_clovis.py HAND)"),
    ("Fullerton College", "35174"): (None, "none: not the program's own page (kb/_program_piles_s720_fullerton.py "
                                           "HAND)"),
    ("Fullerton College", "36798"): (None, "none: not the program's own page (kb/_program_piles_s720_fullerton.py "
                                           "HAND)"),
    # S720 held 41797 off catalog_figures_differ (its lists meet the printed 15 at the top) for a person or a page
    # read. S740's review: its 14-15 sits inside the printed 13-15, the shape this kind names, and its heading
    # shows its section its own (kb/_program_piles_s740_smc.py, s740f).
    ("Santa Monica College", "41797"): (WITHIN, "kb/_program_piles_s740_smc.py, over s720s's hold "
                                                "(kb/_program_piles_s720_smc.py HAND)"),
}
# The reviewed lists: each S740 plan's module, by its file name. A key filed there is the reviewed lists' answer.
PLAN_MODULES = ("_program_piles_s740_gavilan", "_program_piles_s740_canyons", "_program_piles_s740_orangecoast",
                "_program_piles_s740_smc")
# Shasta 32162, held (no plan): the reason, for the handoff's Blocks.
SHASTA_32162 = ("held: its 23-27 sits inside the printed 22-27 and units_within_printed_range is true of its figures, "
                "but its section is not shown to be its own: its heading sits on the page before the one the read "
                "held, and 18094 (University Studies - Physical Education), read from the same PDF page, holds 29 of "
                "its 32 courses in the same unit band. A read that holds page 99 with page 100 (a reread)")


def every_record() -> list[dict]:
    out = []
    for path in sorted(glob.glob(os.path.join(NG.COLLEGE_DIR, "*", "records", "*.json"))):
        try:
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        if isinstance(f, dict):
            out.append(f)
    return out


def reviewed_keys() -> set:
    """Every (college, control number) an S740 plan's reviewed list files under the kind."""
    import importlib
    out = set()
    for name in PLAN_MODULES:
        m = importlib.import_module(name)
        out |= {(m.COLLEGE, cn) for cn, e in m.REVIEWED.items() if e["gap"] == WITHIN}
    return out


def within_held_recall(every: list[dict], reviewed: set | None = None) -> dict:
    """The figures against the hand answers held for real records (WITHIN_HELD). named: the failing records the
    figures name statewide with no gap filed, plus the reviewed keys a plan has since filed (their committed record
    carries the kind). For each held key still named: figures_right where the held answer is the kind, figures_wrong
    where another lever or a hold owns it (the figures alone would file it); the reviewed lists are right where
    they file exactly the keys whose held answer is the kind."""
    reviewed = reviewed_keys() if reviewed is None else reviewed
    by_key = {(str(f.get("college")), str(f.get("control_number"))): f for f in every}
    named = set(NG.units_within_named(every))
    filed = {k for k in reviewed if any(g.get("gap") == WITHIN for g in (by_key.get(k) or {}).get("score", {})
                                        .get("gaps") or [])}
    out = {"named": len(named | filed), "filed_by_a_plan": len(filed), "held": 0, "figures_right": 0,
           "figures_wrong": 0, "reviewed_right": 0, "reviewed_wrong": 0, "gone": [], "figures_wrong_keys": [],
           "reviewed_wrong_keys": [], "not_held": len((named | filed) - set(WITHIN_HELD))}
    for key, (answer, _) in sorted(WITHIN_HELD.items()):
        if key not in named | filed:
            out["gone"].append(list(key))
            continue
        out["held"] += 1
        if answer == WITHIN:
            out["figures_right"] += 1
        else:
            out["figures_wrong"] += 1
            out["figures_wrong_keys"].append(list(key))
        if (key in reviewed) == (answer == WITHIN):
            out["reviewed_right"] += 1
        else:
            out["reviewed_wrong"] += 1
            out["reviewed_wrong_keys"].append(list(key))
    return out


if __name__ == "__main__":
    ev = every_record()
    rc = NG.units_within_recall(ev)
    print("units_within_recall: %s" % json.dumps({k: v for k, v in rc.items() if k != "wrong_keys"}))
    print("within_held_recall: %s" % json.dumps(within_held_recall(ev)))
    sys.exit(1 if rc["wrong"] else 0)
