#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Butte: the census's 17 wording-rule records, collected with gaps named.

The census on main (kb/status/harvest_gap_census.json, run 45384590964) lists 17 Butte College records under the
reconcile_steps lever ("correction rules from the catalog's own wording, then rescores the saved record"). Sam's
ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores, a gap noted instead of a reread. No rule passes one without changing its record (or the
scorer), so none passes here; each record takes a named gap where one is honest.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes and blocks, the shape of S720's El
Camino and Contra Costa piles and tonight's Gavilan), with the three guards: scorer_passes, on_live_run and the
own-section guard (14583's page is the one shared page). Each entry carries a check on the record's own figures:

  degree_within_map_range  (new, 50) four degrees (01305, 01358, 07258, 45652) whose major adds up to its printed
                           major total and whose record takes the degree total from the sample term map's range
                           ('Map (Butte GE)' or 'Map (Cal-GETC)': 'Units: 60.00- 64.00'), whose low end is the 60
                           units the page prints as needed to graduate; the degree's units as read (the major, the
                           general education pattern's units from the catalog's GE guide, and the map's elective
                           line where the reader kept it) fall inside that range and match neither end, and no
                           reading of the elective line as fill passes them. The scorer passes a sum that meets the range's low end (meets, short_high) or a
                           range that holds the printed figure (within); a sum strictly inside a printed range it
                           fails by design (program_verdict: "any total inside the span would pass 738"). No
                           existing kind fits: hours_within_printed_range names a program measured in hours, and
                           every other kind names a list or a figure these records read right. Its score is
                           hours_within_printed_range's 50 (the same reading for units). The "within" check: the
                           major's own check equal, the degree a printed range from 60, the record's computed inside
                           it and off both ends, the cited note quoting the map and the range, and the elective
                           line's fill reading failing. The filed words are the cited clause of the note (split at
                           '; '), so a clause the GE step made untrue ('so ge_units is null') stays out.
  pool_figure_not_read     (#3755) 31000: List B prints '(6.00 overall)' over 'Select one course from each group',
                           and the record adds its two groups at their printed 6.00 and 9.00. With List B at its
                           6.00 the page's figures (the core's two courses, 6; List A's two 'Select one' groups, 3
                           each) add to the printed 18 exactly (the "closes" check).

Held (12): the nine of THE NEXT LEVER (01362, 07269, 11136, 31042, 31941, 32469, 33199, 40923, 43453; the second
reader, S721 round 1, BLOCKER): each record counts the map's 'Only necessary if the 60 units needed to graduate have
not been completed' line at its printed figure, and read as electives that fill the degree each passes today's
scorer, so the page's 60 settles the total and the failure is the record's misread; they stay on the census's
reconcile_steps lever for a reconcile. 01312 (the major adds up, and the degree's 60-61 falls short of the map's 62-69; the map's 2-unit
Graduation Requirement line closes the low end only, and Butte's reconcile step keeps that line out by S636's call:
nearest #3762's degree_electives_not_printed, which is not on main); 14583 (an incomplete read whose page
shared_pages lists with 43185, and whose section heading names program code 43185: the own-section guard, and
_program_named_gaps's HELD_INCOMPLETE); 33579 (the requirements print AGS 20 / AGS 40 as their own 'Select one' and
the map lists them inside List A; read inside List A the figures add to the printed 23, read apart to the record's
26: a reread settles which).

THE NEXT LEVER (measured here, written nowhere): Butte's map prints its elective line as 'Only necessary if the 60
units needed to graduate have not been completed', and the reader kept that figure as degree_elective_units. A Butte reconcile step reading that line as electives that fill the degree (degree_elective_units null,
electives_fill_degree true) passes those nine on today's scorer (ELECTIVE_LINE_PASSES, checked by the test); it
changes the record, so it is a reconcile run's work, not this plan's.
S727 builds it: Butte's clear_conditional step and kb/_program_reconcile_s727_butte.py.

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found. THE SELF-RECALL: HAND is the hand reading of the 17; precision runs the rule and the
claim check over each; the "within" shape over every census member, right where it names the hand reading's 4 and
none else; boundary readings: the note's words gone, the stated total one unit off, coverage failing, and each
entry's own figure check moved one unit.

    python3 kb/_program_piles_s721_butte.py --dry-run
    python3 kb/_program_piles_s721_butte.py --tag s721e

Guard: tests/program_piles_s721_butte_test.py.
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
COLLEGE = "Butte College"
SLUG = "butte"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()
TAG = "s721e"
WITHIN = "degree_within_map_range"

# degree_within_map_range: "words" is the reader's note naming the map's range as the degree total.
_W = {
    "01305": "degree_total 60-64 is taken from the 'Map (Butte GE)' section ('Units: 60.00- 64.00'",
    "01358": "degree_total 60-62 is taken from the 'Map (Butte GE)' advising pathway ('Units: 60.00- 62.00'",
    "01362": "degree_total 60-66 is taken from the Map (Butte GE) sample plan, which prints 'Units: 60.00- 66.00'",
    "07258": "degree_total 60-64 is taken from the Map (Butte GE) section ('Units: 60.00- 64.00'",
    "07269": "degree_total 60-66 is taken from the 'Map (Butte GE)' sample term-by-term plan ('Units: 60.00- 66.00'",
    "11136": "degree_total 61-68 comes from the Butte GE map's 'Total : 61.00- 68.00'",
    "31042": "degree_total 60-69 is taken from the Cal-GETC degree map ('Units: 60.00- 69.00'",
    "31941": "degree_total 60-68 is taken from the 'Map (Cal-GETC)' suggested sequence ('Total : 60.00- 68.00')",
    "32469": "degree_total 60-71 is taken from the Cal-GETC map ('Units: 60.00- 71.00'",
    "33199": "degree_total 60-70 is taken from the 'Map (Cal-GETC)' suggested sequence ('Units: 60.00-70.00'",
    "40923": "degree_total 60-67 is taken from the Cal-GETC sample map ('Units: 60.00- 67.00'",
    "43453": "degree_total 60-68 is taken from the Cal-GETC Map (sample term plan), which prints 'Units: 60.00- 68.00'",
    "45652": "degree_total 60-64 is taken from the Cal-GETC term map ('Required Courses: Units: 60.00- 64.00'",
}
_C = {"01305": [63, 63], "01358": [61, 61], "01362": [61, 61], "07258": [63, 63], "07269": [61, 61],
      "11136": [65, 67], "31042": [61, 62], "31941": [64, 64], "32469": [61, 63.5], "33199": [64, 65],
      "40923": [64, 64], "43453": [64, 64], "45652": [62, 63]}
_ST = {"01305": [60, 64], "01358": [60, 62], "01362": [60, 66], "07258": [60, 64], "07269": [60, 66],
       "11136": [61, 68], "31042": [60, 69], "31941": [60, 68], "32469": [60, 71], "33199": [60, 70],
       "40923": [60, 67], "43453": [60, 68], "45652": [60, 64]}
# The nine (the second reader, S721, round 1): the record counts the map's conditional elective line at its printed
# figure, and read as electives that fill the degree each passes today's scorer, so the page's 60 settles the total
# and the failure is the record's misread. Held, left on the census's reconcile_steps lever for a reconcile.
ELECTIVE_LINE_PASSES = ("01362", "07269", "11136", "31042", "31941", "32469", "33199", "40923", "43453")
ELECTIVE_LINE_WORDS = "only necessary if the 60 units"
# The floor the page prints: the elective line's own words name the 60 units needed to graduate.
FLOOR, FLOOR_WORDS = 60.0, "60 units"
ELECTIVE_LINE_HELD = ("held: the record counts the map's 'Only necessary if the 60 units needed to graduate have not "
                      "been completed' line at its printed figure; read as electives that fill the degree it passes "
                      "today's scorer, so the page's 60 settles the total and the failure is the record's misread: it "
                      "stays on the census's reconcile_steps lever for a Butte reconcile step")
REVIEWED = {cn: {"gap": WITHIN, "computed": _C[cn], "stated": _ST[cn], "within": True, "words": w}
            for cn, w in _W.items() if cn not in ELECTIVE_LINE_PASSES}
REVIEWED["31000"] = {
    "gap": "pool_figure_not_read", "computed": [27, 27], "stated": [18, 18],
    # The page's figures, the pool once: the core's courses (block 0, no figure of its own), List A's two
    # 'Select one' groups at their printed 3.00, and List B's '(6.00 overall)' the note quotes.
    "closes": [["courses", 0], ["block", 1], ["block", 2], ["figure", [6, 6], "(6.00 overall)"]],
    "parts": [3, 4],
    "words": "List B says 'Select one course from each group' (6.00 overall), but Group 1 prints 6.00 and Group 2 "
             "prints 9.00"}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "01312": "held: the major adds up, and the degree's 60-61 falls short of the map's 62-69; the map's 2-unit "
             "Graduation Requirement line closes the low end only (62 against 62-69), and Butte's reconcile step "
             "keeps that line out by S636's call; the nearest kind is #3762's degree_electives_not_printed, which is "
             "not on main",
    "14583": "held: an incomplete read (the requirements table is not in the text read; HELD_INCOMPLETE), on a page "
             "shared_pages lists with 43185, whose section heading names program code 43185: the own-section guard",
    "33579": "held: the requirements print AGS 20 / AGS 40 as their own 'Select one', and the note says the map lists "
             "them inside List A; inside List A the figures add to the printed 23, apart to the record's 26: a "
             "reread settles which",
})
HAND.update({cn: ELECTIVE_LINE_HELD for cn in ELECTIVE_LINE_PASSES})


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
    if isinstance(v, dict):
        v = [v.get("min"), v.get("max")]
    if v is None or v[0] is None or v[1] is None:
        return None
    return [float(v[0]), float(v[1])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def _blocks(filed: dict) -> list[dict]:
    return (filed.get("record") or {}).get("blocks") or []


def _notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


def _fig(x: float) -> str:
    return ("%d" % x) if float(x).is_integer() else ("%g" % x)


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


def shared_with(cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the record's page (#3753's second reader, BLOCKER)."""
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        sp = json.load(fh).get("shared_pages") or {}
    return sorted({str(m) for v in sp.values() if str(cn) in [str(x) for x in v] for m in v if str(m) != str(cn)})


_POSTED = None


def posted_runs(skip: tuple = (), assume_applied: tuple = ()) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    (program_requirement_records_college_<slug>_<run>.json: inserted_keys under its extracted_runs), a reread
    (..._college_reread_<slug>_<run>.json: replaced_keys and carried_keys under its extracted_run, and kept_keys for a
    key no other receipt posts) and every applied guarded plan's records. skip names plan tags whose receipts are left
    out (the test reads the receipts as they stood before this plan's own apply); assume_applied names plan tags read
    as applied before their migration receipt lands (the test reads them as they will stand after it); neither is
    ever cached."""
    global _POSTED
    if _POSTED is not None and not skip and not assume_applied:
        return _POSTED
    import glob
    out: dict = {}
    kept = []
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
            kept += [(str(k), at, str(d.get("extracted_run"))) for k in d.get("kept_keys") or []]
        elif name.startswith("program_requirement_records_college_%s_" % SLUG):
            runs = [str(r) for r in d.get("extracted_runs") or []]
            for k in d.get("inserted_keys") or []:
                if len(runs) == 1:
                    out.setdefault(str(k), []).append((at, runs[0]))
        else:
            # A plan's rows reached the live table only when its migration receipt was filed (an unapplied plan,
            # this module's own receipt among them, posts nothing).
            tag = name[:-len(".json")].rsplit("_", 1)[-1]
            if tag in skip or (tag not in assume_applied
                               and not glob.glob(os.path.join(NG.RECEIPTS, "migration_%s_prreq_*.json" % tag))):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == COLLEGE and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    for k, at, run in kept:
        if k not in out:
            out[k] = [(at, run)]
    if not skip and not assume_applied:
        _POSTED = out
    return out


def on_live_run(filed: dict, posted: dict | None = None) -> bool:
    """The committed record's run is the run the latest committed receipt posted for the row (the pre-read class of
    East Los Angeles 02456: a reconcile rewrote the file, and its run never reached the live row)."""
    rows = (posted_runs() if posted is None else posted).get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


def within_map(filed: dict, e: dict | None = None) -> bool:
    """degree_within_map_range's figures, on the record itself: checked against the degree, the major's own check
    equal, the degree total a printed range, the record's computed inside it and off both ends, and a note quoting
    the map and the range's two ends as the degree total; the range's low end is the 60 units a note says the page
    prints as needed to graduate; and the record's conditional elective line, read as electives that fill the degree,
    does not pass it (the second reader's nine: there the page's 60 settles the total, and the record misread it)."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    major = a.get("major") or {}
    if a.get("against") != "degree" or major.get("status") != "equal" or not major.get("pass"):
        return False
    st, comp = _pair(a.get("stated")), _pair(a.get("computed"))
    dt = _pair(((filed.get("record") or {}).get("program") or {}).get("degree_total"))
    if st is None or comp is None or dt is None or not _same(st, dt) or st[1] <= st[0] + NG.FIG_EPS:
        return False
    if not (st[0] + NG.FIG_EPS < comp[0] and comp[1] < st[1] - NG.FIG_EPS):
        return False
    if abs(st[0] - FLOOR) > NG.FIG_EPS or not any(FLOOR_WORDS in n.lower() for n in _notes(filed)):
        return False
    if elective_line_passes(filed):
        return False
    rng = "%s-%s" % (_fig(st[0]), _fig(st[1]))
    notes = [n for n in _notes(filed) if (e is None or e["words"] in n)]
    return any("degree_total " + rng in n and "map" in n.lower() for n in notes)


def _clause(note: str, words: str) -> str:
    """The clause of the note (split at '; ') that holds the entry's words: the filed words keep the reader's quote
    of the figures and leave out a clause the reconcile has since made untrue ('so ge_units is null') or one that
    asks a reviewer to confirm."""
    return next((c for c in note.split("; ") if words in c), note).rstrip(".")


def pool_closes(filed: dict, e: dict) -> bool:
    """pool_figure_not_read's figures: the figures the page prints (a block's stated figure, an all-required block's
    courses where it prints none, a figure a note quotes), the pool counted once, add to the stated total at both
    ends; and the record adds the pool's parts at their printed figures instead (its computed)."""
    lo = hi = 0.0
    blocks = _blocks(filed)
    notes = " ".join(_notes(filed))
    for src in e["closes"]:
        if src[0] in ("block", "courses"):
            if src[1] >= len(blocks):
                return False
            b = blocks[src[1]]
            if src[0] == "block":
                v = _pair(b.get("stated"))
            else:
                us = [c.get("units") for c in b.get("courses") or []]
                v = None if b.get("rule") != "all" or not us or None in us else [sum(map(float, us))] * 2
        else:
            v = _pair(src[1]) if src[2] in notes else None
        if v is None:
            return False
        lo, hi = lo + v[0], hi + v[1]
    st, comp = _pair(e["stated"]), _pair(e["computed"])
    if abs(lo - st[0]) > NG.FIG_EPS or abs(hi - st[1]) > NG.FIG_EPS:
        return False
    # The record's own sum is the page's figures with the pool's parts in its place.
    pool = next(_pair(s[1]) for s in e["closes"] if s[0] == "figure")
    parts = [_pair(blocks[i].get("stated")) if i < len(blocks) else None for i in e["parts"]]
    if any(p is None for p in parts):
        return False
    return all(abs(x - pool[j] + sum(p[j] for p in parts) - comp[j]) <= NG.FIG_EPS for j, x in enumerate((lo, hi)))


def gap_noted(filed: dict, reviewed: dict | None = None) -> tuple[str, str] | None:
    """(gap, words) where a reviewed entry stands on the record as it is filed; else None."""
    e = (REVIEWED if reviewed is None else reviewed).get(str(filed.get("control_number")))
    if not e or filed.get("college") != COLLEGE:
        return None
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    words = next((n for n in _notes(filed) if e["words"] in n), None)
    if not words or not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
        return None
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None
    if scorer_passes(filed):
        return None
    if not on_live_run(filed):
        return None
    if e.get("within") and not within_map(filed, e):
        return None
    if e.get("closes") and not pool_closes(filed, e):
        return None
    return e["gap"], _clause(words, e["words"])


def _sources() -> dict:
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def claim(filed: dict, src: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn)
    s = (_sources() if src is None else src).get(cn)
    if not e or not s:
        return "no capture"
    if shared_with(cn) and not any(e.get("own_section") and e["own_section"] in n for n in _notes(filed)):
        # #3753's own_page guard: a page shared_pages lists another program on is the record's own only where a
        # note names the record's own section (East Los Angeles's second reader, 38168).
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


def within_recall(census_path: str = CENSUS) -> dict:
    """The new kind's shape (within_map, read with no entry's words) over every census member: right where it says
    what the hand reading says (the kind, or not), wrong otherwise."""
    out = {"read": 0, "right": 0, "wrong": []}
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None:
            continue
        out["read"] += 1
        if within_map(f) == (HAND.get(cn) == WITHIN):
            out["right"] += 1
        else:
            out["wrong"].append(cn)
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


def elective_line_passes(filed: dict) -> bool:
    """THE NEXT LEVER, measured: the map's conditional elective line read as electives that fill the degree passes
    the record on today's scorer (a reconcile step's work: it changes the record)."""
    prog = (filed.get("record") or {}).get("program") or {}
    if _pair(prog.get("degree_elective_units")) is None or not any(ELECTIVE_LINE_WORDS in n.lower() for n in _notes(filed)):
        return False
    rec = copy.deepcopy(filed["record"])
    rec["program"] = dict(prog, degree_elective_units={"min": None, "max": None}, electives_fill_degree=True)
    return (S.score(rec, [], None, filed.get("award")).get("arithmetic") or {}).get("pass") is True


def _moved(e: dict) -> dict:
    """The entry with its own figure check one unit off: the pool's figure, or the range the note must quote."""
    e = copy.deepcopy(e)
    if e.get("closes"):
        e["closes"] = [[s[0], [s[1][0] + 1, s[1][1] + 1], s[2]] if s[0] == "figure" else s for s in e["closes"]]
    return e


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
        if REVIEWED[cn].get("within"):
            # The sum moved to the range's low end: the scorer's own meets and short_high read that one, so no gap.
            g = copy.deepcopy(f)
            a = g["score"]["arithmetic"]
            a["computed"] = [a["stated"][0], a["stated"][0] + (a["computed"][1] - a["computed"][0])]
            tally("its own figure check moved", not within_map(g, REVIEWED[cn]), cn)
        else:
            tally("its own figure check moved", gap_noted(f, dict(REVIEWED, **{cn: _moved(REVIEWED[cn])})) is None, cn)
    return {"counts": dict(out), "wrong": wrong}


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


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default=TAG)
    a = ap.parse_args(argv)
    pr, wr, cc, bd = precision(), within_recall(), claim_checks(), boundaries()
    nxt = sorted(cn for cn in census_members() if _load(cn) and elective_line_passes(_load(cn)))
    print("precision: %s" % json.dumps(pr))
    print("within recall: %s" % json.dumps(wr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    print("next lever (elective line as fill) passes: %s" % nxt)
    if pr["wrong"] or pr["not_hand_held"] or wr["wrong"] or bd["wrong"] or cc["not_standing"]:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s721_butte_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S721: Butte's 17 wording-rule records, collected with their gaps named where one "
                                "is honest (no reread)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "person": list(PERSON),
                       "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "new_kind": {WITHIN: "no existing kind fits: hours_within_printed_range names a program measured in "
                                 "hours, and every other kind names a list or figure these records read right"},
            "precision": pr, "within_recall": wr, "claim_checks": cc, "boundaries": bd, "held": res["held"],
            "next_lever": {"what": "a Butte reconcile step reading the map's elective line ('Only necessary if the "
                                   "60 units needed to graduate have not been completed') as electives that fill "
                                   "the degree; it changes the record, so a reconcile run's work",
                           "passes_on_todays_scorer": nxt},
            "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found. The capture keeps no page text, so a note's quoted figures are the "
                                  "reader's words, never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": F.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Butte (named gaps %d). Each row's checks become the\n"
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
