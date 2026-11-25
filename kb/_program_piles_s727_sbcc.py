#!/usr/bin/env python3
"""S727, lane 2's cheap piles at Santa Barbara City: the census's 18 wording-rule records, 7 passed, 6 with named gaps.

The committed census (kb/status/harvest_gap_census.json, written 2026-11-25 01:39Z from the live rows) lists 18 Santa
Barbara City College records under the reconcile_steps lever ("a team session writes correction rules from the
catalog's own wording, then rescores the saved record"). Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17):
never drop a record for failing; collect it with its gaps noted and confidence scores. The college carries no reconcile
steps (kb/program_requirements_reconcile.json) and its capture keeps no page text, so every reading here works from
the committed record, its notes and the state's course list. No record is changed; each score is.

THE RESCORE THAT PASSES SEVEN (PASSED below). Each record's arithmetic is re-added by main's scorer against its own
state list (kb/_program_piles_s714_ccsf.py fresh_score, as coci_program_courses is built), and a record moves only
where, with its one reading off, the scorer gives the filed arithmetic exactly (the S714 rescore's guard), so the
rescore re-judges nothing but that reading:
  floor          (six) Sam's Open Asks Sheet 144 card 2 "floor" (2026-10-30): a choose-courses list's printed units are
                 its floor (block_units). SBCC's lists print a figure and no units beside their courses; the filed
                 runs added the courses' state-list units below the printed figure (Engineering 10661's List A, one of
                 ENGR 115 or ENGR 117 & 117L at 4, read at 1-4). kb/_program_requirements_floor_rescore.py skips such a
                 record, since it re-adds blocks with no state list; this rescore uses the list the filed run used.
                 05913, 10661, 19099, 31338, 38595, 43539.
  option_parts   (one) #3714's reading of one option split over several blocks: Psychology 05934's Option B is two
                 lists taken together (6 and 3-5) against Option A's 9; 20-23 as printed. S714 held it on its claim
                 check (d-optparts-holds-05934-claim-check-s714): today's capture finds 31 of the option's 33 listed
                 courses, ENVS 112 and ENVS 115 not found. The record's notes say the page prints both as the first
                 code of a slash cross-listing (ENVS/HIST 112, ENVS/ERTH 115), and the capture's code finder
                 (find_codes in kb/_program_requirements_pilot.py) never reads that code: over every Santa Barbara
                 City record, 0 of the first codes of the slash listings its notes name are among the capture's codes
                 while the record holds them, and every second code the state lists is (SLASH_RECALL). The claim
                 check settles such a code only where its note prints the pair, find_codes does not find the code in
                 that printed form, and the pair's other code is found or is not on the state's list.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes), with the standing guards: scorer_passes
(a record today's scorer passes is never gap-filed), on_live_run (the committed record's run is its live row's), the
own-page guard (no record here sits on a page capture.json's shared_pages lists) and the rescore's exactness. The
kinds:
  repeat_read_once             (60) EH 290 (2-4 units) printed twice in the Required Core and read once, the notes
                               say: with it taken twice the courses add to the printed total at both ends. 05902,
                               10889, 10890, 10894.
  pool_figure_not_read         (40) Environmental Studies 08565: 'List A prints a single total of 3-5 units for the
                               whole list'; the reading keeps each combination as its own block of the option group.
                               With List A at its printed 3-5 the blocks add to the printed 54-62.
  required_list_outside_total  (new, 70) Nursing 05924: the page prints 'Other Course Requirements for Graduation' (COMM
                               C1000, PSYC C1000, SOC 101 or their alternatives) under both entry paths and 'Its units
                               are not included in either printed Total Units figure' (36 and 24.5, each its path's
                               courses exactly). The record counts the list; without it the blocks add to the printed
                               24.5-36. The state's course list for the program holds the ten NURS courses and none of
                               the list's. No existing kind fits: prerequisites_counted names prerequisites, and these
                               are graduation requirements. Its score is prerequisites_counted's 70, since in both the
                               printed total leaves out a list the record counts and the courses add to it without the
                               list.

Held (5): 19012 and 46520 (a substitution list read as a list to add: 'students may substitute two of the courses from
the list of electives' and 'Substitution Courses ... approved substitutions only for students who place out of a core
course'; a substitution-list reading passes both, 19-21 and 20 as printed, the lever Orange Coast 32737's list waits
on, so neither is gap-filed); 30746 (coverage fails: the state's list names PSY 200, which the record does not place
and no note explains); 43553 (the record adds to 32-37 against the printed 35-41, and no note says why); 45452 (two
gaps at once: BIOL 140 & 141 taken together, read as two alternatives to BIOL 100, and List A's printed 4-8 over its
combinations, read as the group's own blocks).

THE SELF-RECALL: HAND is the hand reading of the 18; precision runs the readings, the rules and the claim checks over
each; boundary readings: the note's words gone, the stated total one unit off, coverage failing; for a floor row the
lists' printed figures gone; for 05934 its Option B blocks renamed apart and its slash note gone; for a repeat one
time fewer; for the pool its figure a unit off; for the outside list a course of it on the state's list.

    python3 kb/_program_piles_s727_sbcc.py --dry-run
    python3 kb/_program_piles_s727_sbcc.py --tag s727d

Guard: tests/program_piles_s727_sbcc_test.py.
"""
from __future__ import annotations

import argparse
import ast
import collections
import contextlib
import copy
import glob
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_piles_s714_optparts as O  # noqa: E402
import _program_piles_s721_paloverde as W  # noqa: E402
import _program_requirements_pilot as PL  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "Santa Barbara City College"
SLUG = "santa_barbara_city"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()
PASSES = "passes"
OUTSIDE = "required_list_outside_total"

# The seven the rescore passes: the one reading that moves each, and the reader's note that says what the reading
# reads (the list prints a figure and no units beside its courses; the option's blocks go together).
PASSED = {
    "05913": {"reading": "floor",
              "words": "The catalog prints no units beside individual List A courses; only the block total 2.5-9 is "
                       "printed."},
    "10661": {"reading": "floor",
              "words": "List A and List B courses have no units printed beside them, so units are null."},
    "19099": {"reading": "floor",
              "words": "In Lists A-C no units are printed beside any course; only the list totals (7-10, 6-8, 6-10) "
                       "are printed."},
    "31338": {"reading": "floor",
              "words": "The catalog prints units only beside the Required Core courses and the List A/List B headers"},
    "38595": {"reading": "floor",
              "words": "Units are not printed beside the List A and List B courses or beside the 'or' alternatives; "
                       "those units are null. Block totals (8-10.3 and 3-5) are recorded in stated."},
    "43539": {"reading": "floor",
              "words": "List A prints no units beside individual courses; the block total 6-8 units is recorded as "
                       "stated."},
    "05934": {"reading": "option_parts",
              "words": "Option B consists of two blocks taken together (6 units Psychology Electives plus 3-5 units "
                       "Social/Behavioral Sciences/Sciences Electives)",
              "slash": "Cross-listed codes recorded as one entry with the other listing as an alternative: ENVS/HIST "
                       "112, ENVS/ERTH 115"},
}

_EH = {"gap": "repeat_read_once", "repeats": [["EH 290", 2]], "courses": ["EH290"]}
REVIEWED = {
    "05902": dict(_EH, computed=[26, 28], stated=[28, 32],
                  words="EH 290 (2-4 units) is printed twice in the Required Core, which matches the 28.00-32.00 total"),
    "10889": dict(_EH, computed=[38, 40], stated=[40, 44],
                  words="EH 290 (2-4 units) is printed twice in the Required Core; recorded once."),
    "10890": dict(_EH, computed=[40, 42], stated=[42, 46],
                  words="EH 290 (2-4 units) is printed twice in the Required Core, meaning it is completed twice"),
    "10894": dict(_EH, computed=[38, 40], stated=[40, 44],
                  words="EH 290 (2-4 units) is printed twice in the Required Core; recorded once."),
    "08565": {"gap": "pool_figure_not_read", "computed": [55, 62], "stated": [54, 62], "group": "List A",
              "figure": [3, 5],
              "words": "List A prints a single total of 3-5 units for the whole list ('Complete one combination from "
                       "the following')"},
    "05924": {"gap": OUTSIDE, "computed": [33.5, 47], "stated": [24.5, 36],
              "block": "Other Course Requirements for Graduation from the Nursing program RN, BSN",
              "outside_courses": ["COMMC1000", "PSYCC1000", "SOC101"],
              "words": "Its units are not included in either printed Total Units figure"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({cn: PASSES for cn in PASSED})
HAND.update({
    "19012": "held: 'students may substitute two of the courses from the list of electives below for two of these "
             "four' is a substitution list, read as a choose list with no minimum; without it the core and emphasis "
             "add to the printed 19-21, so a substitution-list reading passes it (the lever Orange Coast 32737 waits "
             "on), and it is not gap-filed",
    "46520": "held: 'Substitution Courses' lists approved substitutions for students who place out of a core course, "
             "read as a units list with no minimum; the core adds to the printed 20, so a substitution-list reading "
             "passes it, and it is not gap-filed",
    "30746": "held: coverage fails, the state's list names PSY 200, which the record does not place and no note "
             "explains (ANTH 110 is explained): a read",
    "43553": "held: the record adds to 32-37 against the printed 35-41, and no note names a figure or a course that "
             "closes the 3-4 units: a read",
    "45452": "held: two gaps at once, BIOL 140 & BIOL 141 (taken together) read as two alternatives to BIOL 100, and "
             "List A's printed 4-8 over its lecture and lab combinations read as the group's own blocks; with both "
             "read the courses add to the printed 35-40",
})


# ── the census and the files ─────────────────────────────────────────────
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


def _notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


def _pair(v):
    return None if v is None else [float(v[0]), float(v[1])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def _sources() -> dict:
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def _found(entry: dict | None) -> set:
    found = (entry or {}).get("codes_found") or []
    if isinstance(found, str):
        found = ast.literal_eval(found)
    return {S.norm_code(x) for x in found}


def shared_with(cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the record's page (#3753's own-page guard)."""
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        sp = json.load(fh).get("shared_pages") or {}
    return sorted({str(m) for v in sp.values() if str(cn) in [str(x) for x in v] for m in v if str(m) != str(cn)})


# ── the live-run guard (Porterville's, with the skip of p-test-reads-own-apply-receipt-s721) ──
_POSTED = None


def posted_runs(skip: tuple = ()) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    (inserted_keys under its one extracted run), a reread (replaced_keys and carried_keys under its run; kept_keys only
    where nothing else posts the key) and every applied plan's records (a plan posts only once its migration receipt is
    filed). skip names plan tags whose receipts are left out; a skip is never cached."""
    global _POSTED
    if _POSTED is not None and not skip:
        return _POSTED
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
    """The committed record's run is the run the latest committed receipt posted for the row."""
    rows = posted_runs(skip).get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


# ── the rescore ───────────────────────────────────────────────────────────
@contextlib.contextmanager
def readings_off(which: tuple = ("floor", "option_parts")):
    """The scorer with the named readings off: the floor (block_units as block_units_summed, the printed figure no
    floor) and option_parts."""
    saved_b, saved_p = S.block_units, S.OPTION_PARTS_ON
    if "floor" in which:
        S.block_units = S.block_units_summed
    if "option_parts" in which:
        S.OPTION_PARTS_ON = False
    try:
        yield
    finally:
        S.block_units, S.OPTION_PARTS_ON = saved_b, saved_p


def arithmetic(filed: dict, off: tuple = ()) -> dict:
    """The record's arithmetic against its own state list, with the named readings off."""
    with readings_off(off):
        return C.fresh_score(filed)["arithmetic"]


def todays(filed: dict) -> dict | None:
    """Today's arithmetic where the rescore is exact: the filed arithmetic is today's (as filed, this plan's own write
    among them) or is what the scorer gives with both readings off; else None (an older scorer's, not re-judged)."""
    filed_a = (filed.get("score") or {}).get("arithmetic")
    now = arithmetic(filed)
    if now == filed_a or arithmetic(filed, ("floor", "option_parts")) == filed_a:
        return now
    return None


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic, with no closed list and no text (#3753's MAJOR): such a
    record is rescored, never gap-filed."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


def reading_moves(filed: dict, reading: str) -> bool:
    """With that reading alone off the scorer fails the record's arithmetic, and with it on (the other on too) it
    passes: the reading, and no other, moves it."""
    return arithmetic(filed, (reading,)).get("status") != "equal" and arithmetic(filed).get("status") == "equal"


def passing_score(filed: dict) -> dict | None:
    """The filed score with today's arithmetic, where the rescore is exact and passes as the live table counts it."""
    now = todays(filed)
    if now is None:
        return None
    sc = copy.deepcopy(filed.get("score") or {})
    sc["arithmetic"] = now
    sc["pass"] = C._overall(sc)
    return sc if S.passes_live(sc) else None


# ── the slash cross-listings (05934's claim) ──────────────────────────────
SLASH = re.compile(r"\b([A-Z]{2,5})/([A-Z]{2,5}) (\d{1,3}[A-Z]{0,2})\b")


def slash_pairs(filed: dict) -> list[tuple[str, str, str]]:
    """(printed form, first code, second code) of every slash cross-listing the record's notes name."""
    out = []
    for n in _notes(filed):
        for m in SLASH.finditer(n):
            out.append((m.group(0), S.norm_code(m.group(1) + " " + m.group(3)), S.norm_code(m.group(2) + " " + m.group(3))))
    return out


def unseen_by_capture(printed: str, code: str) -> bool:
    """The capture's own code finder does not find the code in its printed slash form."""
    return S.norm_code(code) not in PL.find_codes(printed, [{"code": code}])


def slash_settles(filed: dict, code: str, found: set, listed: set) -> bool:
    """A listed course the capture did not find stands where a note prints it as the first code of a slash
    cross-listing, the capture's code finder does not find it in that form, and the pair's other code is found or is
    not on the state's list."""
    code = S.norm_code(code)
    return any(first == code and unseen_by_capture(printed, printed.split("/")[0] + " " + printed.rsplit(" ", 1)[1])
               and (second in found or second not in listed) for printed, first, second in slash_pairs(filed))


def slash_recall() -> dict:
    """Over every Santa Barbara City record: of the slash cross-listings its notes name whose code the record holds,
    how many first codes and second codes the capture found."""
    src = _sources()
    out = collections.Counter()
    for p in sorted(glob.glob(os.path.join(NG.COLLEGE_DIR, SLUG, "records", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            f = json.load(fh)
        e = src.get(str(f.get("control_number")))
        if not isinstance(f.get("record"), dict) or not e:
            continue
        found = _found(e)
        held = {S.norm_code(c.get("code")) for b in f["record"].get("blocks") or [] for c in b.get("courses") or []}
        for _, first, second in slash_pairs(f):
            for which, code in (("first", first), ("second", second)):
                if code in held:
                    out["%s %s" % (which, "found" if code in found else "not found")] += 1
    return dict(out)


# ── the named gaps ────────────────────────────────────────────────────────
def _course(filed: dict, code: str) -> list[dict]:
    return [c for b in (filed.get("record") or {}).get("blocks") or [] for c in b.get("courses") or []
            if S.norm_code(c.get("code")) == S.norm_code(code)]


def repeats_close(filed: dict, e: dict, arith: dict) -> bool:
    """Each repeated course appears once in the record with its printed units, and its repeats (times - 1 at its units
    and its units_max) close the sum to the stated total at both ends."""
    lo = hi = 0.0
    for code, times in e["repeats"]:
        rows = _course(filed, code)
        if len(rows) != 1 or S._num(rows[0].get("units")) is None:
            return False
        u = S._num(rows[0].get("units"))
        um = S._num(rows[0].get("units_max")) or u
        lo, hi = lo + u * (times - 1), hi + um * (times - 1)
    comp, st = _pair(arith.get("computed")), _pair(arith.get("stated"))
    return comp is not None and st is not None and abs(comp[0] + lo - st[0]) <= NG.FIG_EPS \
        and abs(comp[1] + hi - st[1]) <= NG.FIG_EPS


def _equal_without(filed: dict, keep, add: list[dict]) -> bool:
    """The record's blocks that keep() keeps, plus add, scored against its own state list: equal, and its sum is the
    stated total at both ends."""
    rec = copy.deepcopy(filed.get("record") or {})
    rec["blocks"] = [b for b in rec.get("blocks") or [] if keep(b)] + add
    a = C.fresh_score(dict(filed, record=rec))["arithmetic"]
    return a.get("status") == "equal" and _same(a.get("computed"), a.get("stated"))


def pool_closes(filed: dict, e: dict) -> bool:
    """With the option group's blocks read as one list at the note's printed figure, the blocks add to the stated
    total."""
    if not any(b.get("option_group") == e["group"] for b in (filed.get("record") or {}).get("blocks") or []):
        return False
    fig = {"name": e["group"], "rule": "choose_units", "stated": {"min": e["figure"][0], "max": e["figure"][1]},
           "minimum": e["figure"][0], "courses": [], "option_group": None}
    return _equal_without(filed, lambda b: b.get("option_group") != e["group"], [fig])


def outside_closes(filed: dict, e: dict) -> bool:
    """The named list is in the record, and without it the blocks add to the stated total."""
    if not any(b.get("name") == e["block"] for b in (filed.get("record") or {}).get("blocks") or []):
        return False
    return _equal_without(filed, lambda b: b.get("name") != e["block"], [])


def gap_noted(filed: dict, reviewed: dict | None = None) -> tuple[str, str] | None:
    """(gap, words) where a reviewed entry stands on the record as it is filed; else None."""
    e = (REVIEWED if reviewed is None else reviewed).get(str(filed.get("control_number")))
    if not e or filed.get("college") != COLLEGE:
        return None
    sc = filed.get("score") or {}
    words = next((n for n in _notes(filed) if e["words"] in n), None)
    if not words or not NG.collectable(sc):
        return None
    a = todays(filed)
    if a is None or a.get("pass") or a.get("status") == "equal" or S.passes_live(dict(sc, arithmetic=a)):
        return None
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None
    if scorer_passes(filed) or not on_live_run(filed):
        return None
    if e.get("repeats") and not repeats_close(filed, e, a):
        return None
    if e.get("group") and not pool_closes(filed, e):
        return None
    if e.get("block") and not outside_closes(filed, e):
        return None
    return e["gap"], words


def passes_noted(filed: dict, passed: dict | None = None) -> tuple[dict, str] | None:
    """(rescored score, words) where a PASSED entry stands on the record as it is filed; else None."""
    e = (PASSED if passed is None else passed).get(str(filed.get("control_number")))
    if not e or filed.get("college") != COLLEGE:
        return None
    words = next((n for n in _notes(filed) if e["words"] in n), None)
    if not words or not on_live_run(filed) or not reading_moves(filed, e["reading"]):
        return None
    sc = passing_score(filed)
    return (sc, words) if sc is not None else None


# ── the claim checks ──────────────────────────────────────────────────────
def claim(filed: dict, src: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn) or PASSED.get(cn)
    s = (_sources() if src is None else src).get(cn)
    if not e or not s:
        return "no capture"
    if shared_with(cn):
        return "the page is shared"
    found = _found(s)
    listed = {S.norm_code(c.get("code")) for c in C.closed_list(COLLEGE, cn)}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    if e.get("outside_courses") and any(S.norm_code(c) in listed for c in e["outside_courses"]):
        # The state's course list for the program leaves the outside list out too; a course of it on the list holds.
        return "a course of the outside list is on the state's list"
    if e.get("reading") == "option_parts":
        cc = O.capture_claim(filed)
        if cc.get("status") not in ("stands", "partial"):
            return "no capture"
        if not all(slash_settles(filed, code, found, listed) for code in cc.get("not_found") or []):
            return "a listed course of the option the capture did not find, unsettled"
        if O.notes_claim(filed) != "stands":
            return "the notes do not say the option's blocks go together"
    return "stands"


def outcome(filed: dict, src: dict | None = None) -> tuple[str, str | None, str, dict | None]:
    """(answer, words, claim, rescored score): answer is a gap's name, PASSES, or 'none'."""
    cn = str(filed.get("control_number"))
    if cn in PASSED:
        j = passes_noted(filed)
        if not j:
            return "none", None, "the rescore does not stand", None
        c = claim(filed, src)
        return (PASSES, j[1], c, j[0]) if c == "stands" else ("none", None, c, None)
    j = gap_noted(filed)
    if not j:
        return "none", None, "no entry stands", None
    c = claim(filed, src)
    return (j[0], j[1], c, None) if c == "stands" else ("none", None, c, None)


# ── the self-recall ───────────────────────────────────────────────────────
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
        if f is None or not (gap_noted(f) or passes_noted(f)):
            continue
        c = claim(f, src)
        out[c] += 1
        if c != "stands":
            not_standing.append([cn, c])
    return {"counts": dict(out), "not_standing": not_standing}


def _stated_off(f: dict, by: float = 1.0) -> dict:
    g = copy.deepcopy(f)
    t = g["record"]["program"]["total_units"]
    g["record"]["program"]["total_units"] = {"min": t["min"] + by, "max": t["max"] + by}
    return g


def boundaries(census_path: str = CENSUS) -> dict:
    out, wrong = collections.Counter(), []
    src = _sources()

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in census_members(census_path):
        f = _load(cn)
        if f is None:
            continue
        if cn in PASSED and passes_noted(f):
            e = PASSED[cn]
            g = copy.deepcopy(f)
            g["record"]["notes"] = [n.replace(e["words"], "") for n in _notes(g)]
            tally("the note's words gone", passes_noted(g) is None, cn)
            # The scorer itself refuses the moved record, not only the exactness guard.
            g = _stated_off(f)
            tally("the printed total one unit past", passes_noted(g) is None
                  and arithmetic(g).get("status") != "equal", cn)
            g = copy.deepcopy(f)
            g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
            tally("coverage failing", passes_noted(g) is None, cn)
            if e["reading"] == "floor":
                # The lists' printed figures gone: the courses' state-list units alone, as the filed run added them.
                g = copy.deepcopy(f)
                for b in g["record"]["blocks"]:
                    if b.get("rule") == "choose_courses":
                        b["stated"] = {"min": None, "max": None}
                tally("the lists' printed figures gone", passes_noted(g) is None
                      and arithmetic(g).get("status") != "equal", cn)
            else:
                g = copy.deepcopy(f)
                for i, b in enumerate(g["record"]["blocks"]):
                    if b.get("option_group"):
                        b["name"] = "Group %d" % i
                tally("the option's blocks renamed apart", passes_noted(g) is None
                      and arithmetic(g).get("status") != "equal", cn)
                g = copy.deepcopy(f)
                g["record"]["notes"] = [n for n in _notes(g) if e["slash"] not in n]
                tally("the slash note gone", claim(g, src) != "stands", cn)
            continue
        if cn not in REVIEWED or not gap_noted(f):
            continue
        e = REVIEWED[cn]
        g = copy.deepcopy(f)
        g["record"]["notes"] = [n.replace(e["words"], "") for n in _notes(g)]
        tally("the note's words gone", gap_noted(g) is None, cn)
        tally("the printed total one unit past", gap_noted(_stated_off(f)) is None, cn)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        tally("coverage failing", gap_noted(g) is None, cn)
        if e.get("repeats"):
            fewer = dict(e, repeats=[[c, t - 1] for c, t in e["repeats"]])
            tally("a repeat one time fewer", gap_noted(f, dict(REVIEWED, **{cn: fewer})) is None, cn)
        if e.get("group"):
            off = dict(e, figure=[e["figure"][0] + 1, e["figure"][1] + 1])
            tally("the pool's figure a unit off", gap_noted(f, dict(REVIEWED, **{cn: off})) is None, cn)
        if e.get("outside_courses"):
            g = copy.deepcopy(f)
            g["record"]["blocks"] = [b for b in g["record"]["blocks"] if b.get("name") != e["block"]]
            tally("the outside list not in the record", gap_noted(g) is None, cn)
            real = C.closed_list(COLLEGE, cn)
            extra = list(real) + [{"code": "SOC 101", "units": 3.0}]
            C._CLOSED[(COLLEGE, cn)] = extra
            try:
                tally("a course of the outside list on the state's list", claim(f, src) != "stands", cn)
            finally:
                C._CLOSED[(COLLEGE, cn)] = real
    return {"counts": dict(out), "wrong": wrong}


# ── the plan ──────────────────────────────────────────────────────────────
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
        gap, words, c, rescored = outcome(f, src)
        if gap == "none":
            held.append({"control_number": cn, "why": HAND.get(cn, "not hand-held"), "claim": c})
            continue
        img = images.get((COLLEGE, cn))
        if img is None or F.row_passes(img["checks"]):
            held.append({"control_number": cn, "why": "the load leaves it out, or its image passes"})
            continue
        if gap == PASSES:
            score = rescored
        else:
            e = src.get(cn) or {}
            score = copy.deepcopy(f["score"])
            score["arithmetic"] = todays(f)
            score["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": words}]
            score["confidence"] = NG.confidence(dict(f, score=score), gap, e.get("method"),
                                                (e.get("catalog_year") or year) == year)
        hits.append((cn, f, score, gap, words, img))
    for cn, f, score, gap, words, img in hits:
        row = {"college": COLLEGE, "control_number": cn, "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": gap, "words": words,
               "confidence": score.get("confidence"), "path": os.path.relpath(_path(cn), ROOT)}
        if gap == PASSES:
            row["reading"] = PASSED[cn]["reading"]
        if (f.get("score") or {}).get("arithmetic") != score.get("arithmetic"):
            row["arithmetic"] = {"filed": f["score"]["arithmetic"].get("computed"),
                                 "today": score["arithmetic"].get("computed")}
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
            want = [] if r["moves_to"] == PASSES else [r["moves_to"]]
            if img["record"] != r["before_image"]["record"] or (img["checks"].get("gaps") or []) != want:
                raise SystemExit("%s: the record changed, or its image does not carry the gap" % r["control_number"])
            if r["moves_to"] == PASSES and not F.row_passes(img["checks"]):
                raise SystemExit("%s: the rescored image does not pass" % r["control_number"])
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s727d")
    a = ap.parse_args(argv)
    pr, cc, bd, sl = precision(), claim_checks(), boundaries(), slash_recall()
    print("precision: %s" % json.dumps(pr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    print("slash recall: %s" % json.dumps(sl))
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"] or sl.get("first found"):
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s727_sbcc_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S727: Santa Barbara City's 18 wording-rule records, seven passed by a rescore under "
                                "a reading main's scorer already holds, the rest collected with their gaps named where "
                                "one is honest (no reread)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "person": list(PERSON),
                       "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by) if g != PASSES},
            "passed": {cn: {k: e[k] for k in ("reading", "words")} for cn, e in PASSED.items()},
            "moved": len(rows), "by": by,
            "precision": pr, "claim_checks": cc, "boundaries": bd, "slash_recall": sl,
            "held": res["held"], "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; checks."
                              "coverage, invented and the record unchanged. The passed rows' checks.arithmetic reads "
                              "equal from their rescored arithmetic; a gap row's arithmetic status is unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found; for 05934, each listed course of the option the capture did not find "
                                  "settled by a note printing it as the first code of a slash cross-listing that "
                                  "find_codes cannot read; for the outside list, none of its courses on the state's "
                                  "list. The capture keeps no page text, so a note's quoted figures are the reader's "
                                  "words, never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": W.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Santa Barbara City (%d rows: %s). Each row's checks become the\n"
           "-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or\n"
           "-- for a passed row the arithmetic equal; the record unchanged. Receipt: %s (before_image per row).\n"
           % (a.tag.upper(), len(rows), ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
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
