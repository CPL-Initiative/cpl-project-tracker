#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Palo Verde: the census's 20 wording-rule records, collected with gaps named.

Today's census (kb/status/harvest_gap_census.json, run 45371224551) lists 20 Palo Verde records under the
reconcile_steps lever ("correction rules from the catalog's own wording, then rescores the saved record"). Sam's
ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores, a gap noted instead of a reread. Palo Verde carries no reconcile steps
(kb/program_requirements_reconcile.json), and the capture keeps no page text, so no rule from the committed files
passes one without changing its record; each record takes a named gap where one is honest. None needs a scorer
change.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes, the shape of #3753 and #3755), with
three guards: scorer_passes, on_live_run (the committed record's run must be its live row's) and the own-section
guard (no record here sits on a page capture.json's shared_pages lists). The kinds:

  figure_within_variable_units  (new, 60) 12 Fire Science certificates of 30 units. Each page prints a required
                             list's figure (FST 090 Fire Science Academy at 0.25-12 credits, EMS 161 at 1-1.5) that
                             falls inside the range its courses carry, and an elective figure; the two figures add to
                             the printed 30. The page does not say how many units each variable course takes, so the
                             record adds the courses' range (22.25-34.5 for 41189) and the scorer finds it unequal.
                             No existing kind fits: lists_past_their_figure needs the courses past the figure at both
                             ends, noted_unit_floor a printed minimum, hours_within_printed_range hours. Its score is
                             lists_past_their_figure's 60, since in both the printed figures add to the printed total.
                             The entry checks each list's figure: a required list's courses span it, an elective
                             list holds at least it, and the figures add to the stated total exactly.
  degree_electives_not_printed  (new, 50) two Liberal Arts A.A. degrees (18000, 18045) whose 18-unit emphasis and
                             CalGETC's 34-38 add to 52-56 against the printed 60-61 (60), and whose page prints no
                             figure for electives and does not say they fill the rest (the record's own note says so).
                             No existing kind fits: ge_units_not_read needs the GE units unread, and
                             degree_summary_ge_none a summary printing GE as None. Its score is ge_units_not_read's 50:
                             in both a degree's major adds up and a part the page leaves unprinted is missing.
  noted_figures_differ       (#3753) 22484's block figures sum to 43 at the low end against the printed 42, and the
                             record adds to 43-44 against its stated 42-44.

Held (5): 17998 (the shape of 18000, but no note of its own says the page prints no electives: only the scorer's
note does); 17999 (Lists A and B follow the 18-unit Area of Emphasis with no word on whether they fall inside it, and
the degree check reads them as additional: a person or a reread); 45359 (the CalGETC certificate's low end, 35, is
past the printed 34 even at each area's printed figure; the 7-unit science area over three sub-lists explains only
the high end); 41227 (its list figures add to 29.75 against the header's 30, while the record adds to 22.25-34.5, so
neither noted_figures_differ nor figure_within_variable_units says its gap); 41242 (the Fire Science shape, but none
of its own notes says its 17.25 depends on FST 090's range: the own-notes standard that holds 17998). None of the
census's 20 sits on a shared page (the second reader's round 1, S721, held 41227 and 41242).

SPANS_FIGURE'S STATEWIDE SELF-RECALL (STATEWIDE below): a variable-unit course is one whose own units_max passes its
units, so an "or" alternative never counts (before that, the check fired on El Camino 43992). Run with the figures
adding to the stated total over every filed record at every college, it fires on 19: the 13 Palo Verde Fire Science
certificates and six elsewhere, each read by hand as the shape, a required list whose printed figure falls inside a
variable-unit course's own range (Redwoods 16505 ADCT42 0.5-14; Fullerton 42394 NUTR 295 F 2-4, already filed as
noted_unit_floor; Lake Tahoe 42054 CUL101 2.5-3; Laney 43451 ESOL 541A 50-96.25 hours; Merritt 41238 MEDAS 470F 1-4;
San Jose City 22241 ADS 138 1-6): 19 right, 0 wrong. This plan files Palo Verde's census members alone; the six are
another college's worker's to read from their own notes.

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found. THE SELF-RECALL: HAND is the hand reading of the 20; precision runs the rule and the
claim check over each; boundary readings: the note's words gone, the stated total one unit off, coverage failing,
and for the new kinds a required list's figure moved outside its courses' span, and an electives figure added.

    python3 kb/_program_piles_s721_paloverde.py --dry-run
    python3 kb/_program_piles_s721_paloverde.py --tag s721a

Guard: tests/program_piles_s721_paloverde_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "Palo Verde College"
SLUG = "palo_verde"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()

_FV = {"gap": "figure_within_variable_units", "computed": None, "stated": [30, 30], "spans_figure": True,
       "figures": [30, 30], "courses": ["FST090"]}
_DE = {"gap": "degree_electives_not_printed", "computed": [52, 56], "degree_rest": True}
REVIEWED = {
    "41189": dict(_FV, computed=[22.25, 34.5],
                  words="Required block states 'Total 11 Credits', but the printed course units sum to 3.25-15.5"),
    "41208": dict(_FV, computed=[20.25, 32.75],
                  words="Required Courses heading states Total 16.75 Credits, but the listed required courses sum to 7 "
                        "at the low end of their ranges"),
    "41221": dict(_FV, computed=[22.25, 34.5],
                  words="Required Courses heading states 20.75 credits, but EMS 161 (1-1.5) and FST 090 (0.25-12) "
                        "carry variable units"),
    "41222": dict(_FV, computed=[22.25, 34.5],
                  words="Required Courses block is stated as 13.25 credits, but the listed courses sum to 5.5 at their "
                        "minimum units"),
    "41223": dict(_FV, computed=[22.0, 34.75],
                  words="Required Courses block states 13.5 credits, but several required courses carry variable-unit "
                        "ranges"),
    "41224": dict(_FV, computed=[22.25, 34.5],
                  words="Required Courses block states 'Total 13 Credits' though its listed courses are variable-unit"),
    "41225": dict(_FV, computed=[22.25, 34.5],
                  words="Required block states 13.5 credits, but the printed course ranges (FST 090 0.25-12, EMS 161 "
                        "1-1.5) do not sum to a fixed 13.5"),
    "41226": dict(_FV, computed=[22.25, 34.5],
                  words="Required Courses block states 'Total 13.5 Credits' but the printed course units sum to 5.75-18"),
    "41241": dict(_FV, computed=[22.25, 34.5],
                  words="Required Courses are labeled 'Total 15 Credits', but the printed units of the five courses sum "
                        "to roughly 8-19.5"),
    "41243": dict(_FV, computed=[22.25, 34.5],
                  words="Required Courses block states 'Total 9 Credits' but its two courses print ranges"),
    "41250": dict(_FV, computed=[22.25, 35.0],
                  words="The Required Courses heading states 'Total 13 Credits', but the listed required courses add up "
                        "to far less at their low ends"),
    "41260": dict(_FV, computed=[22.25, 34.5],
                  words="Required Courses stated total 11.75 does not match a simple sum of the printed course credits"),
    "22484": {"gap": "noted_figures_differ", "computed": [43, 44], "stated": [42, 44], "figures": [43, 57],
              "words": "summing the minimum choices gives 43 (33+3+4+3), which does not match the printed minimum of 42"},
    "18000": dict(_DE, stated=[60, 61],
                  words="The page prints no figure for electives between the emphasis and CalGETC and the 60-61 degree "
                        "total"),
    "18045": dict(_DE, stated=[60, 60],
                  words="The page prints no units for electives to reach 60 and does not state that electives fill the "
                        "remainder"),
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "17998": "held: the shape of 18000 (an 18-unit emphasis and CalGETC's 34-38 against the printed 60-61), but no note "
             "of its own says the page prints no electives (only the scorer's note does), so "
             "degree_electives_not_printed's sentence is not its own",
    "17999": "held: Lists A and B follow the 18-unit Area of Emphasis with no word on whether they fall inside it or add "
             "to it, and the degree check reads them as additional (59-64 within 60-61): a person or a reread",
    "41227": "held: its list figures 19.5 and 10.25 add to 29.75 against the header's 30, but the record adds to "
             "22.25-34.5 and states 30, so its sum and stated total are not the two figures noted_figures_differ names, "
             "and figure_within_variable_units fails too (the figures add to 29.75, not 30) (the second reader, S721)",
    "41242": "held: the Fire Science shape (17.25 plus 12.75 is the printed 30, FST 090 at 0.25-12), but none of its own "
             "notes says its 17.25 depends on FST 090's range, so figure_within_variable_units' sentence is not its own "
             "(the own-notes standard that holds 17998; the second reader, S721)",
    "45359": "held: the CalGETC certificate's low end (35) is past the printed 34 even at each area's printed figure; "
             "the 7-unit Physical and Biological Sciences figure over three sub-lists explains only the high end, so "
             "no one kind names its gap",
})


def _figures(filed: dict):
    """The sum (lo, hi) of each counting list's printed figure, or None where a list prints none."""
    lo = hi = 0.0
    for b in (filed.get("record") or {}).get("blocks") or []:
        if b.get("rule") == "recommended":
            continue
        st = S._span(b.get("stated"))
        if st is None:
            return None
        lo, hi = lo + st[0], hi + st[1]
    return lo, hi


def _variable(course: dict) -> bool:
    """A variable-unit course: its own units_max passes its units (an "or" alternative's units never count)."""
    lo, hi = S._num(course.get("units")), S._num(course.get("units_max"))
    return lo is not None and hi is not None and hi > lo + NG.FIG_EPS


def spans_figure(filed: dict) -> bool:
    """figure_within_variable_units' first half: each required list's courses span its printed figure, at least one
    of them only through a variable-unit course (its courses' least is short of the figure), and each choose-units
    list's courses hold at least its figure. Any other rule fails it."""
    rec = filed.get("record") or {}
    hours = S.measure(rec) == "hours"
    inside = False
    for b in rec.get("blocks") or []:
        st = S._span(b.get("stated"))
        spans = [S.choice_units(c, {}, hours) for c in b.get("courses") or []]
        if st is None or not spans or any(x is None for x in spans):
            return False
        lo, hi = sum(x[0] for x in spans), sum(x[1] for x in spans)
        if b.get("rule") == "all":
            if not (lo - NG.FIG_EPS <= st[0] and st[1] <= hi + NG.FIG_EPS):
                return False
            if lo + NG.FIG_EPS < st[0] and any(_variable(c) for c in b.get("courses") or []):
                inside = True
        elif b.get("rule") == "choose_units":
            if hi + NG.FIG_EPS < st[0]:
                return False
        else:
            return False
    return inside


def degree_rest(filed: dict) -> bool:
    """degree_electives_not_printed's figures: the degree's major passes its own check, its general education units
    were read, the two add to less than the printed degree total at both ends, and the record holds no electives
    figure and no word that electives fill the degree."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    prog = (filed.get("record") or {}).get("program") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    if a.get("against") != "degree" or (a.get("major") or {}).get("status") != "equal" or a.get("ge") is None:
        return False
    if comp is None or st is None or comp[1] + NG.FIG_EPS >= st[0]:
        return False
    if prog.get("electives_fill_degree") or S._num(prog.get("open_elective_units")) \
            or S._span(prog.get("degree_elective_units")) is not None:
        return False
    return True


def census_members(path: str = CENSUS) -> list[str]:
    """The keys: the census's members under LEVERS at the college, less PERSON."""
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    out = []
    for lv in d.get("levers") or []:
        if lv.get("lever") in LEVERS and lv.get("scope") == COLLEGE:
            out += [m for m in lv.get("members") or [] if m not in out and m not in PERSON]
    return out


def _path(cn: str) -> str:
    return os.path.join(NG.COLLEGE_DIR, SLUG, "records", cn + ".json")


def _load(cn: str) -> dict | None:
    if not os.path.isfile(_path(cn)):
        return None
    with open(_path(cn), encoding="utf-8") as fh:
        return json.load(fh)


def _pair(v):
    return None if v is None else [float(v[0]), float(v[1])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


def shared_with(cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the record's page (#3753's second reader, BLOCKER:
    reported in the receipt; a PDF page holds several sections, so a shared page alone holds no record here)."""
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        sp = json.load(fh).get("shared_pages") or {}
    return sorted({str(m) for v in sp.values() if str(cn) in [str(x) for x in v] for m in v if str(m) != str(cn)})


_POSTED = None


def posted_runs() -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    (program_requirement_records_college_<slug>_<run>.json: inserted_keys under its extracted_runs), a reread
    (..._college_reread_<slug>_<run>.json: replaced_keys and carried_keys under its extracted_run) and every guarded
    plan's records (each guarded on the row's live run)."""
    global _POSTED
    if _POSTED is not None:
        return _POSTED
    import glob
    out: dict = {}
    for path in glob.glob(os.path.join(NG.RECEIPTS, "program_requirement_records_*.json")):
        name = os.path.basename(path)
        try:
            with open(path, encoding="utf-8") as fh:
                d = json.load(fh)
        except (OSError, ValueError):
            continue
        if not isinstance(d, dict):
            continue
        at = str(d.get("at") or "")
        if name.startswith("program_requirement_records_college_reread_%s_" % SLUG):
            for k in (d.get("replaced_keys") or []) + (d.get("carried_keys") or []):
                out.setdefault(str(k), []).append((at, str(d.get("extracted_run"))))
        elif name.startswith("program_requirement_records_college_%s_" % SLUG):
            runs = [str(r) for r in d.get("extracted_runs") or []]
            for k in d.get("inserted_keys") or []:
                if len(runs) == 1:
                    out.setdefault(str(k), []).append((at, runs[0]))
        else:
            # A plan's rows reached the live table only when its migration receipt was filed (an unapplied plan,
            # this module's own receipt among them, posts nothing).
            tag = name[:-len(".json")].rsplit("_", 1)[-1]
            if not glob.glob(os.path.join(NG.RECEIPTS, "migration_%s_prreq_*.json" % tag)):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == COLLEGE and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    _POSTED = out
    return out


def on_live_run(filed: dict) -> bool:
    """The committed record's run is the run the latest committed receipt posted for the row (the pre-read class of
    East Los Angeles 02456: a reconcile rewrote the file, and its run never reached the live row)."""
    rows = posted_runs().get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


def gap_noted(filed: dict, reviewed: dict | None = None) -> tuple[str, str] | None:
    """(gap, words) where a reviewed entry stands on the record as it is filed; else None."""
    e = (REVIEWED if reviewed is None else reviewed).get(str(filed.get("control_number")))
    if not e or filed.get("college") != COLLEGE:
        return None
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    words = next((str(n) for n in (filed.get("record") or {}).get("notes") or [] if e["words"] in str(n)), None)
    if not words or not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
        return None
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None
    if scorer_passes(filed):
        return None
    if not on_live_run(filed):
        return None
    if e.get("figures") is not None and not _same(_figures(filed), e["figures"]):
        # The lists' printed figures add to the entry's figure exactly (the stated total, for the new kind).
        return None
    if e.get("spans_figure") and not spans_figure(filed):
        return None
    if e.get("degree_rest") and not degree_rest(filed):
        return None
    return e["gap"], words


def _sources() -> dict:
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def claim(filed: dict, src: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn)
    s = (_sources() if src is None else src).get(cn)
    if not e or not s:
        return "no capture"
    if shared_with(cn) and not any(e.get("own_section") and e["own_section"] in str(n)
                                   for n in (filed.get("record") or {}).get("notes") or []):
        # #3753's own_page guard, for PDF pages: a page shared_pages lists another program on is the record's own
        # only where a note names the record's own section (East Los Angeles's second reader, 38168).
        return "the page is shared and no note names the record's own section"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    return "stands"


def outcome(filed: dict, src: dict | None = None) -> tuple[str, str | None, str]:
    j = gap_noted(filed)
    if not j:
        return "none", None, "no entry stands"
    c = claim(filed, src)
    return (j[0], j[1], c) if c == "stands" else ("none", None, c)


def precision(census_path: str = CENSUS) -> dict:
    out = {"read": 0, "right": 0, "wrong": [], "no_record_file": 0, "not_hand_held": 0,
           "by_answer": collections.Counter()}
    src = _sources()
    for cn in census_members(census_path):
        if cn not in HAND:
            out["not_hand_held"] += 1
            continue
        f = _load(cn)
        truth = "none" if HAND[cn].startswith("held") else HAND[cn]
        out["read"] += 1
        out["by_answer"][truth] += 1
        if f is None:
            out["no_record_file"] += 1
            got = "none"
        else:
            got = outcome(f, src)[0]
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"].append([cn, truth, got])
    out["by_answer"] = dict(out["by_answer"])
    return out


def claim_checks(census_path: str = CENSUS) -> dict:
    out, not_standing = collections.Counter(), []
    src = _sources()
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not gap_noted(f):
            continue
        c = claim(f, src)
        out[c] += 1
        if c != "stands":
            not_standing.append([cn, c])
    return {"counts": dict(out), "not_standing": not_standing}


def boundaries(census_path: str = CENSUS) -> dict:
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not gap_noted(f):
            continue
        g = copy.deepcopy(f)
        g["record"]["notes"] = [str(n).replace(REVIEWED[cn]["words"], "") for n in g["record"].get("notes") or []]
        tally("the note's words gone", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        a = g["score"]["arithmetic"]
        a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1] if a.get("stated") is not None else [1.0, 1.0]
        tally("the stated total one unit off", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        tally("coverage failing", gap_noted(g) is None, cn)
        e = REVIEWED[cn]
        if e.get("figures") is not None:
            # A list's printed figure a quarter unit off: the figures no longer add to the entry's figure.
            g = copy.deepcopy(f)
            st = g["record"]["blocks"][-1]["stated"]
            g["record"]["blocks"][-1]["stated"] = {"min": st["min"] + 0.25, "max": st["max"] + 0.25}
            tally("a list's figure a quarter unit off", gap_noted(g) is None, cn)
        if e.get("spans_figure"):
            # The required list's figure moved past its courses' most (the elective figure takes the difference, so
            # the figures still add to the total), then onto its courses' least (no variable unit needed).
            for name, at in (("the required figure past its courses' span", "past"),
                             ("the required figure at its courses' least", "least")):
                g = copy.deepcopy(f)
                blocks = g["record"]["blocks"]
                req = next(b for b in blocks if b.get("rule") == "all")
                el = next(b for b in blocks if b.get("rule") == "choose_units")
                spans = [S.choice_units(c, {}, False) for c in req["courses"]]
                to = sum(x[1] for x in spans) + 1 if at == "past" else sum(x[0] for x in spans)
                shift = to - req["stated"]["min"]
                req["stated"] = {"min": to, "max": to}
                el["stated"] = {"min": el["stated"]["min"] - shift, "max": el["stated"]["max"] - shift}
                el["minimum"] = el["stated"]["min"]
                tally(name, gap_noted(g) is None, cn)
        if e.get("degree_rest"):
            for name, field, value in (("an electives figure read", "degree_elective_units", {"min": 4, "max": 8}),
                                       ("electives said to fill the degree", "electives_fill_degree", True)):
                g = copy.deepcopy(f)
                g["record"]["program"][field] = value
                tally(name, gap_noted(g) is None, cn)
    return {"counts": dict(out), "wrong": wrong}


# The shapes the two new kinds' entries check, by hand, over the census's 20: the 13 Fire Science certificates take
# figure_within_variable_units' shape, 41242 among them though it holds on its notes' words (41227's figures add to
# 29.75, not its 30); the three Liberal Arts A.A.
# degrees take degree_electives_not_printed's (17998 then holds on its notes' words).
SHAPE_HAND = {"figure_within_variable_units": frozenset(cn for cn, e in REVIEWED.items() if e.get("spans_figure"))
              | {"41242"},
              "degree_electives_not_printed": frozenset({"17998", "18000", "18045"})}


def self_recall(census_path: str = CENSUS) -> dict:
    """The new kinds' shape checks against SHAPE_HAND over the census's members: right and wrong for each (the
    S652 review rule: a new matcher's self-recall count before it ships)."""
    out = {}
    members = census_members(census_path)
    checks = {"figure_within_variable_units":
              lambda f: spans_figure(f) and _same(_figures(f), ((f.get("score") or {}).get("arithmetic") or {}).get("stated")),
              "degree_electives_not_printed": degree_rest}
    for kind, fn in checks.items():
        right, wrong = 0, []
        for cn in members:
            f = _load(cn)
            got = bool(f and fn(f))
            if got == (cn in SHAPE_HAND[kind]):
                right += 1
            else:
                wrong.append(cn)
        out[kind] = {"right": right, "wrong": wrong, "shape": len(SHAPE_HAND[kind])}
    return out


# spans_figure's statewide fires (figures adding to the stated total), by college and control number: the S721 run.
STATEWIDE = frozenset([("Palo Verde College", cn) for cn in (
    "41189", "41208", "41221", "41222", "41223", "41224", "41225", "41226", "41241", "41242", "41243", "41250",
    "41260")] + [("College of the Redwoods", "16505"), ("Fullerton College", "42394"),
                 ("Lake Tahoe Community College", "42054"), ("Laney College", "43451"), ("Merritt College", "41238"),
                 ("San Jose City College", "22241")])


def statewide_fires(base: str = NG.COLLEGE_DIR) -> set:
    """Every filed record at every college on which figure_within_variable_units' shape check fires."""
    import glob
    out = set()
    for path in glob.glob(os.path.join(base, "*", "records", "*.json")):
        try:
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        a = (f.get("score") or {}).get("arithmetic") or {}
        if spans_figure(f) and _same(_figures(f), a.get("stated")):
            out.add((f.get("college"), str(f.get("control_number"))))
    return out


def plan(write: bool, census_path: str = CENSUS) -> dict:
    rows, held, hits = [], [], []
    src = _sources()
    year = None
    cap = os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json")
    if os.path.isfile(cap):
        with open(cap, encoding="utf-8") as fh:
            year = json.load(fh).get("catalog_year")
    images = NG._load_images({COLLEGE})
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None:
            held.append({"control_number": cn, "why": HAND.get(cn, "no record file")})
            continue
        if S.passes_live(f.get("score")) or (f.get("score") or {}).get("gaps"):
            continue
        gap, words, c = outcome(f, src)
        if gap == "none":
            held.append({"control_number": cn, "why": HAND.get(cn, "not hand-held"), "claim": c})
            continue
        img = images.get((COLLEGE, cn))
        if img is None or F.row_passes(img["checks"]):
            held.append({"control_number": cn, "why": "the load leaves it out, or its image passes"})
            continue
        e = src.get(cn) or {}
        score = copy.deepcopy(f["score"])
        score["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": words}]
        score["confidence"] = NG.confidence(dict(f, score=score), gap, e.get("method"),
                                            (e.get("catalog_year") or year) == year)
        hits.append((cn, f, score, gap, words, img))
    for cn, f, score, gap, words, img in hits:
        row = {"college": COLLEGE, "control_number": cn, "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": gap, "words": words,
               "confidence": score["confidence"], "path": os.path.relpath(_path(cn), ROOT)}
        if write:
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            with open(_path(cn), "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=score), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    if write and rows:
        after = NG._load_images({COLLEGE})
        for r in rows:
            img = after[(COLLEGE, r["control_number"])]
            if img["record"] != r["before_image"]["record"] or (img["checks"].get("gaps") or []) != [r["moves_to"]]:
                raise SystemExit("%s: the record changed, or its image does not carry the gap" % r["control_number"])
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def md5_pre_read(rows: list[dict]) -> str:
    """F.md5_pre_read, its query sent to the local Postgres on stdin: 17 images of 60-70 courses each pass the
    kernel's argument limit as one -c argument. The SQL is F's own, never a copy."""
    import subprocess
    real = F.subprocess.run

    def run(cmd, **kw):
        if "-c" in cmd:
            i = cmd.index("-c")
            return real(cmd[:i] + cmd[i + 2:], input=cmd[i + 1], **kw)
        return real(cmd, **kw)

    F.subprocess.run = run
    try:
        return F.md5_pre_read(rows)
    finally:
        F.subprocess.run = real
        assert subprocess.run is real


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s721a")
    a = ap.parse_args(argv)
    pr, cc, bd, sr = precision(), claim_checks(), boundaries(), self_recall()
    print("precision: %s" % json.dumps(pr))
    print("self-recall: %s" % json.dumps(sr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"] or any(v["wrong"] for v in sr.values()):
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s721_paloverde_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S721: Palo Verde's 20 wording-rule records, collected with their gaps named where one is honest (no reread)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "person": list(PERSON),
                       "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "precision": pr, "self_recall": sr, "claim_checks": cc, "boundaries": bd, "held": res["held"], "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found. The capture keeps no page text, so a note's quoted figures are the "
                                  "reader's words, never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Palo Verde (named gaps %d). Each row's checks become the\n"
           "-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the\n"
           "-- record unchanged. Receipt: %s (before_image per row).\n" % (a.tag.upper(), len(rows), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    parts = {
        "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text\n"
                            "-- (the full before-values, the fallback where a hash does not match, are in "
                            "..._preread.sql).\n" + body["pre_read_md5"]),
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d rows less\n"
                      "-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.\n"
                      % len(rows) + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked. A rollback lasts only until the\n"
                         "-- next load of that college: revert the record files too (git revert of this plan's commit).\n"
                         + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
