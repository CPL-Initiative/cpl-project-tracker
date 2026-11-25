#!/usr/bin/env python3
"""S727, lane 2's cheap piles at American River: the census's 19 wording-rule records, collected with gaps named.

Today's census (kb/status/harvest_gap_census.json, written 2026-11-25 01:39Z) lists 19 American River records under
the reconcile_steps lever ("correction rules from the catalog's own wording, then rescores the saved record"). Sam's
ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores, a gap noted instead of a reread. American River carries no reconcile steps
(kb/program_requirements_reconcile.json: "steps": []), and the capture keeps no page text, so no rule from the
committed files passes one without changing its record; each record takes a named gap where one is honest. None
needs a scorer change. No reconcile runs here, so no record outside the plan is restamped
(d-rios-reconcile-keeps-only-targets-s720); every other American River record stays as main holds it.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes), with the standing guards:
scorer_passes, on_live_run (the committed record's run must be its live row's) and the own-section guard (a record on
a page capture.json's shared_pages lists with another program stands only where a note of its own names its own
section; the PDF form of #3753's guard, as at Palo Verde). The kinds:

  noted_section_cut_off      (CCSF's, 20) nine records whose note says the text begins mid-table or ends before the
                             total line, the rest of the section on a page the read did not hold: 07206, 12250, 20130,
                             31390, 31466, 32643, 33273, 37899, 43381. Each record adds short of its stated total at
                             the low end, or (20130) states none because the total line is the part cut off.
  unit_line_not_read         (East Los Angeles's, 40) 12191, the Site Supervisor certificate: 'A minimum of 23 units
                             from the following: 23' names no course (general education areas and any ECE course), the
                             record leaves the line out, and its note adds 37 + 23 = 60, the printed total.
  pair_read_as_alternatives  (CCSF's, 50) 30023 and 30024, Landscape Design Technology: DESGN 301 (3) or DESGN 303 (2)
                             and DESGN 304 (2) together, recorded as two alternatives of DESGN 301, so the low end
                             takes DESGN 303 alone and falls one unit short of the printed 31-32.
  option_lists_read_apart    (new, 40) 12180 and 12238, CIS concentrations of two lists each (a concentration's
                             required courses and its 'A minimum of N units' list) kept in one option group, every list
                             its own alternative; the notes say the choice is between the concentrations, not among the
                             lists. No existing kind fits (pair_read_as_alternatives names two courses,
                             pool_figure_not_read a sum of parts); its score is pool_figure_not_read's 40.

Held (5): 07207 (option_lists_read_apart's shape, but its page is shared with 12237, CIS: Database Management, and no
note of its own names its own section); 30595 (its record carries no note: its cut-off is said only in its section
heading and first block's name, and its page is shared with 15519); 39341, 39731 and 39732 (the three Refrigeration
Service Technician Apprenticeship awards read the same section text from p.211, a page shared_pages lists with all
three and the A.S. 39448; 39731 and 39732's notes say the printed 48 does not fit their award: a page read pins each
to its own section).

OPTION_LISTS' STATEWIDE SELF-RECALL (STATEWIDE below): the shape check fires on 5 filed records at every college, each
read by hand as the shape, an option group whose concentration names put two or more lists under one concentration:
American River 07207, 12180 and 12238; Chabot 19286 (Acting's four lists beside Technical Theater's one); Santa Rosa
Junior 44788 (three concentrations of four lists each, already filed as no_units_read): 5 right, 0 wrong. This plan
files American River's census members alone; Chabot's is another college's worker's to read from its own notes.

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found. THE SELF-RECALL: HAND is the hand reading of the 19; precision runs the rule and the
claim check over each; boundary readings: the note's words gone, the stated total one unit off, coverage failing, and
for each kind's own check its figure moved (the unit line's figure, the pair's units, the concentration names).

    python3 kb/_program_piles_s727_arc.py --dry-run
    python3 kb/_program_piles_s727_arc.py --tag s727b

Guard: tests/program_piles_s727_arc_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "American River College"
SLUG = "american_river"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()
TAG = "s727b"

_CUT = {"gap": "noted_section_cut_off", "cut": True}
_OPT = {"gap": "option_lists_read_apart", "computed": None, "stated": None, "option_lists": True}
REVIEWED = {
    "07206": dict(_CUT, computed=[20, 20], stated=[37, 37],
                  words="the first rows of the requirements table are on page 428, which is not included",
                  own_section="naming 'The CIS: Microcomputer Applications Associate in Arts (A.A.) degree'"),
    "12250": dict(_CUT, computed=[21, 21], stated=[35, 35],
                  words="the A.S. in Automotive Analysis heading, description and the first rows of its Degree "
                        "Requirements table are on page 361 and not in the text",
                  own_section="('The Automotive Analysis Associate in Science (A.S.) degree...')"),
    "20130": dict(_CUT, computed=[46, 46], stated=None,
                  words="so the certificate's total line (and any outcomes or career section that may follow on page "
                        "831) is cut off",
                  own_section="The certificate requirements table ends at the bottom of page 830"),
    "31390": dict(_CUT, computed=[9, 9], stated=[19, 19],
                  words="the program heading, core requirement, List A and the heading/start of List B are not in the "
                        "text"),
    "31466": dict(_CUT, computed=[0, 0], stated=[22, 22],
                  words="the list A/B choices, the rule for the movement-based courses, and the first part of the "
                        "Dance list are on the earlier page, which is not in the excerpt"),
    "32643": dict(_CUT, computed=[9, 9], stated=[18, 18],
                  words="its required core courses, and the start of the TAP course list fall on the page before 940 "
                        "and are not in the text"),
    "33273": dict(_CUT, computed=[15, 19], stated=[19, 19],
                  words="possibly its first course(s) (likely SPAN 411) are on the previous page and not in the text"),
    "37899": dict(_CUT, computed=[0, 0], stated=[21, 21],
                  words="the AA-T heading, core requirements and the rule governing the Economics/Geography/Humanities "
                        "lists are on page 644, which is not in the text",
                  own_section="'The Associate in Arts in Global Studies for Transfer (AA-T)'"),
    "43381": dict(_CUT, computed=[31, 31], stated=[49, 49],
                  words="the section heading and the first rows of the Green Vehicle Technology A.S. requirements "
                        "(likely on page 363) are missing",
                  own_section="the first rows of the Green Vehicle Technology A.S. requirements"),
    "12191": {"gap": "unit_line_not_read", "computed": [37, 37], "stated": [60, 60], "line": 23,
              "line_words": "'A minimum of 23 units from the following: 23'",
              "words": "Required core courses sum to 37 units; 37 + 23 = 60, matching the printed Total Units: 60."},
    "30023": {"gap": "pair_read_as_alternatives", "computed": [30, 32], "stated": [31, 32],
              "pair": {"parent": "DESGN 301", "codes": ["DESGN 303", "DESGN 304"]},
              "courses": ["DESGN303", "DESGN304"],
              "words": "DESGN 303 and DESGN 304 are recorded as alternatives of DESGN 301 but must both be completed",
              "own_section": "Read the Certificate of Achievement section 'Landscape Design Technology Certificate'"},
    "30024": {"gap": "pair_read_as_alternatives", "computed": [30, 32], "stated": [31, 32],
              "pair": {"parent": "DESGN 301", "codes": ["DESGN 303", "DESGN 304"]},
              "courses": ["DESGN303", "DESGN304"],
              "words": "both are recorded as alternatives of DESGN 301, but they must be taken together, not singly"},
    "12180": dict(_OPT, computed=[5, 20], stated=[18, 20],
                  words="the choice is between the two pairs, not among the four blocks"),
    "12238": dict(_OPT, computed=[17, 31], stated=None,
                  words="the student completes every block of a single concentration"),
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "07207": "held: option_lists_read_apart's shape (the Java concentration's two lists in one option group with C++'s "
             "list), but capture.json's shared_pages puts its page with 12237 (CIS: Database Management A.S.) and no "
             "note of its own names its own section: a page read pins it",
    "30595": "held: its record carries no note, so its cut-off (the section heading 'heading on the page before 852, "
             "not in the text', the block 'Required Program (continued from previous page)') is not in a note of its "
             "own, and shared_pages puts its page with 15519 (Psychology A.A.): a page read",
    "39341": "held: the three Refrigeration Service Technician Apprenticeship awards (39341, 39731, 39732) were read from "
             "the same section text beginning mid-table on p.211, a page shared_pages lists with all three and the "
             "A.S. 39448, and no note names its own section: a page read pins each award to its own section",
    "39731": "held: read from the same p.211 section text as 39341 and 39732 (shared_pages lists all three and 39448); "
             "its own note says the printed 48 does not fit its Level I award and the text may be the full "
             "certificate's: a page read",
    "39732": "held: read from the same p.211 section text as 39341 and 39731 (shared_pages lists all three and 39448); "
             "its own note says the printed 48 does not fit its award: a page read",
})


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


def _notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


def shared_with(cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the record's page (reported in the receipt; a PDF page
    holds several sections, so a shared page holds a record only where no note names its own section)."""
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        sp = json.load(fh).get("shared_pages") or {}
    return sorted({str(m) for v in sp.values() if str(cn) in [str(x) for x in v] for m in v if str(m) != str(cn)})


_POSTED = None


def posted_runs(skip: tuple = ()) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    (program_requirement_records_college_<slug>_<run>.json: inserted_keys under its extracted_runs), a reread
    (..._college_reread_<slug>_<run>.json: replaced_keys and carried_keys under its extracted_run; kept_keys for a key
    no other receipt posts) and every applied plan's records. skip names plan tags whose receipts are left out (the
    test reads the receipts as they stood before this plan's own apply, p-test-reads-own-apply-receipt-s721); a skip is
    never cached. Porterville's form (kb/_program_piles_s721_porterville.py)."""
    global _POSTED
    if _POSTED is not None and not skip:
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
            if tag in skip:
                continue
            if not glob.glob(os.path.join(NG.RECEIPTS, "migration_%s_prreq_*.json" % tag)):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == COLLEGE and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    for k, at, run in kept:
        if k not in out:
            out[k] = [(at, run)]
    if not skip:
        _POSTED = out
    return out


def on_live_run(filed: dict, skip: tuple = ()) -> bool:
    """The committed record's run is the run the latest committed receipt posted for the row (the pre-read class of
    East Los Angeles 02456: a reconcile rewrote the file, and its run never reached the live row)."""
    rows = posted_runs(skip).get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


# ── each kind's own check, on the record as filed ──────────────────────────
CONCENTRATION = re.compile(r"^\s*(.{1,60}?\bconcentration)\b", re.I)


def option_lists(filed: dict) -> bool:
    """option_lists_read_apart's shape: one option group whose every block's name opens with a concentration's name
    ("C++ concentration", "C++ concentration: A minimum of 1 unit from the following"), two or more concentrations,
    one of them holding two or more lists; and the scorer's option-parts reading (S.option_parts, 'Option 1' names)
    does not already pair them."""
    rec = filed.get("record") or {}
    if S.option_parts(rec):
        return False
    by = collections.defaultdict(list)
    for b in rec.get("blocks") or []:
        if b.get("option_group"):
            by[b["option_group"]].append(b)
    for bs in by.values():
        keys = [CONCENTRATION.match(str(b.get("name") or "")) for b in bs]
        if not all(keys):
            continue
        c = collections.Counter(m.group(1).lower() for m in keys)
        if len(c) >= 2 and max(c.values()) >= 2:
            return True
    return False


def _course(filed: dict, code: str) -> dict | None:
    for b in (filed.get("record") or {}).get("blocks") or []:
        for c in b.get("courses") or []:
            if S.norm_code(c.get("code") or "") == S.norm_code(code):
                return c
    return None


def pair_closes(filed: dict, e: dict) -> bool:
    """pair_read_as_alternatives' figures: the parent course carries the pair as two of its alternatives, the pair's
    units add to the parent's printed top (units_max), and the record's low end is short of the stated low end by
    exactly the parent's units less the pair's least, its top the stated top."""
    p = e.get("pair")
    c = _course(filed, p["parent"])
    if c is None:
        return False
    alts = {S.norm_code(x.get("code") or ""): S._num(x.get("units")) for x in c.get("alternatives") or []
            if isinstance(x, dict)}
    units = [alts.get(S.norm_code(k)) for k in p["codes"]]
    lo, hi = S._num(c.get("units")), S._num(c.get("units_max"))
    if any(u is None for u in units) or lo is None or hi is None or abs(sum(units) - hi) > NG.FIG_EPS:
        return False
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    return abs(st[0] - comp[0] - (lo - min(units))) <= NG.FIG_EPS and abs(st[1] - comp[1]) <= NG.FIG_EPS


def line_closes(filed: dict, e: dict) -> bool:
    """unit_line_not_read's figures: a note of the record's own quotes the units line, and the record's sum plus the
    line is the stated total at both ends."""
    if not any(e["line_words"] in n for n in _notes(filed)):
        return False
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    return all(abs(c + e["line"] - s) <= NG.FIG_EPS for c, s in zip(comp, st))


def cut_short(filed: dict) -> bool:
    """noted_section_cut_off's figures: the record adds short of its stated total at the low end, or states none."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    return st is None or (comp is not None and comp[0] + NG.FIG_EPS < st[0])


def gap_noted(filed: dict, reviewed: dict | None = None, skip: tuple = ()) -> tuple[str, str] | None:
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
    if scorer_passes(filed) or not on_live_run(filed, skip):
        return None
    if e.get("cut") and not cut_short(filed):
        return None
    if e.get("pair") and not pair_closes(filed, e):
        return None
    if e.get("line") is not None and not line_closes(filed, e):
        return None
    if e.get("option_lists") and not option_lists(filed):
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
    if shared_with(cn) and not (e.get("own_section") and any(e["own_section"] in n for n in _notes(filed))):
        # The own-page guard, for PDF pages: a page shared_pages lists another program on is the record's own only
        # where a note of its own names the record's own section (East Los Angeles's second reader, 38168).
        return "the page is shared and no note names the record's own section"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    return "stands"


def outcome(filed: dict, src: dict | None = None, skip: tuple = ()) -> tuple[str, str | None, str]:
    j = gap_noted(filed, skip=skip)
    if not j:
        return "none", None, "no entry stands"
    c = claim(filed, src)
    return (j[0], j[1], c) if c == "stands" else ("none", None, c)


def precision(census_path: str = CENSUS, skip: tuple = ()) -> dict:
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
            got = outcome(f, src, skip)[0]
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

    src = _sources()
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not gap_noted(f):
            continue
        e = REVIEWED[cn]
        g = copy.deepcopy(f)
        g["record"]["notes"] = [str(n).replace(e["words"], "") for n in g["record"].get("notes") or []]
        tally("the note's words gone", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        a = g["score"]["arithmetic"]
        a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1] if a.get("stated") is not None else [1.0, 1.0]
        tally("the stated total one unit off", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        tally("coverage failing", gap_noted(g) is None, cn)
        if e.get("own_section") and shared_with(cn):
            g = copy.deepcopy(f)
            g["record"]["notes"] = [str(n).replace(e["own_section"], "") for n in g["record"].get("notes") or []]
            tally("the own-section words gone on a shared page", claim(g, src) != "stands", cn)
        if e.get("cut"):
            # The record adding to its stated total (nothing cut short): not the cut-off's figures.
            g = copy.deepcopy(f)
            a = g["score"]["arithmetic"]
            if a.get("stated") is not None:
                a["computed"] = list(a["stated"])
                e2 = dict(e, computed=a["stated"])
                tally("the sum at the stated total", gap_noted(g, {cn: e2}) is None, cn)
        if e.get("line") is not None:
            g = copy.deepcopy(f)
            tally("the unit line one unit off", gap_noted(g, {cn: dict(e, line=e["line"] + 1)}) is None, cn)
            g["record"]["notes"] = [str(n).replace(e["line_words"], "") for n in g["record"].get("notes") or []]
            tally("the unit line's words gone", gap_noted(g) is None, cn)
        if e.get("pair"):
            g = copy.deepcopy(f)
            c = _course(g, e["pair"]["parent"])
            c["alternatives"] = [dict(x, units=3) if S.norm_code(x.get("code") or "") == S.norm_code(e["pair"]["codes"][0])
                                 else x for x in c["alternatives"]]
            tally("the pair's units past the parent's top", gap_noted(g) is None, cn)
        if e.get("option_lists"):
            # Every list its own concentration (no concentration takes two lists), then the names in the scorer's
            # 'Option' form: neither is option_lists_read_apart's shape.
            g = copy.deepcopy(f)
            for i, b in enumerate(g["record"]["blocks"]):
                if b.get("option_group"):
                    b["name"] = "List %d concentration" % i
            tally("each list its own concentration", gap_noted(g) is None, cn)
            g = copy.deepcopy(f)
            seen: dict = {}
            for b in g["record"]["blocks"]:
                if b.get("option_group"):
                    k = CONCENTRATION.match(b["name"]).group(1).lower()
                    seen.setdefault(k, str(len(seen) + 1))
                    b["name"] = "Option %s: %s" % (seen[k], b["name"])
            tally("the scorer's option parts pair them", gap_noted(g) is None, cn)
    return {"counts": dict(out), "wrong": wrong}


# The shape option_lists_read_apart's entries check, by hand, over the census's 19: the three CIS concentration
# records (07207 holds on the own-page guard).
SHAPE_HAND = {"option_lists_read_apart": frozenset({"07207", "12180", "12238"})}


def self_recall(census_path: str = CENSUS) -> dict:
    """The new kind's shape check against SHAPE_HAND over the census's members: right and wrong (the S652 review
    rule: a new matcher's self-recall count before it ships)."""
    out = {}
    members = census_members(census_path)
    for kind, fn in {"option_lists_read_apart": option_lists}.items():
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


# option_lists' statewide fires, by college and control number: the S727 run, each read by hand as the shape.
STATEWIDE = frozenset([(COLLEGE, "07207"), (COLLEGE, "12180"), (COLLEGE, "12238"), ("Chabot College", "19286"),
                       ("Santa Rosa Junior College", "44788")])


def statewide_fires(base: str = NG.COLLEGE_DIR) -> set:
    """Every filed record at every college on which option_lists_read_apart's shape check fires."""
    import glob
    out = set()
    for path in glob.glob(os.path.join(base, "*", "records", "*.json")):
        try:
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        if isinstance(f, dict) and option_lists(f):
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
    """F.md5_pre_read, its query sent to the local Postgres on stdin (images of many courses pass the kernel's
    argument limit as one -c argument). The SQL is F's own, never a copy; Palo Verde's form."""
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
    ap.add_argument("--tag", default=TAG)
    a = ap.parse_args(argv)
    pr, cc, bd, sr = precision(), claim_checks(), boundaries(), self_recall()
    sw = statewide_fires()
    print("precision: %s" % json.dumps(pr))
    print("self-recall: %s" % json.dumps(sr))
    print("statewide fires: %d (pinned %d, equal %s)" % (len(sw), len(STATEWIDE), sw == STATEWIDE))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"] or any(v["wrong"] for v in sr.values()) \
            or sw != STATEWIDE:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s727_arc_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S727: American River's 19 wording-rule records, collected with their gaps named "
                                "where one is honest (no reread, no reconcile)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "person": list(PERSON),
                       "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "precision": pr, "self_recall": sr, "statewide": sorted(list(x) for x in sw),
            "claim_checks": cc, "boundaries": bd, "held": res["held"], "records": rows,
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
    hdr = ("-- %s lane 2's cheap piles at American River (named gaps %d). Each row's checks become the\n"
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
