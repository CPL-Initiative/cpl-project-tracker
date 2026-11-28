#!/usr/bin/env python3
"""S727, lane 2's cheap piles at College of the Canyons: the census's 20 wording-rule records and 43388.

Today's census (kb/status/harvest_gap_census.json, written 2026-11-25 01:39Z) lists 20 College of the Canyons
records under the reconcile_steps lever ("correction rules from the catalog's own wording, then rescores the saved
record"). Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. COBIx's brief of 2026-11-24: a record held "for
a person" is collected with its gap named and a lower confidence rather than held. So the plan also collects 43388
(Fundamentals of Public Communications), held for a person since S691 because its read's heading shares no word with
its title; it has no live row, so the plan inserts one.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes, the shape of S721's piles), with the
standing guards: scorer_passes (a record today's scorer passes is never gap-filed), on_live_run (the committed
record's run must be its live row's), and the own-section guard (a record whose page capture.json's shared_pages lists
another program on holds unless a note names its own section). The kinds, all existing but one:

  noted_figures_differ    (40) the page's total leaves out the work-experience minimum its own list requires, and the
                          note quotes both figures: 10312 (18 against 20), 40383 (36 against 37), 43549 (22.5 against
                          23). The record adds to one and states the other.
  noted_section_cut_off   (20) 16962's text begins on page 84, and its heading, total and the first part of its list
                          sit on page 83, which the capture did not hold. Course-list match is capped at 50.
  lists_not_closed        (30) 32896's third list takes three units after Option 1 and six after Option 2.
  pool_figure_not_read    (40) 37648 prints "Take six courses ... for a minimum of 18 units, at least one course from
                          each of the five areas"; the record reads the five areas' one course each.
  heading_not_in_text     (new, 20) 43388: page 328 prints a requirements list and not the program's own heading,
                          which the note places on page 327; the record takes the list as this program's by its title
                          alone. Unit arithmetic takes noted_section_cut_off's 20 (a required course carries no hours,
                          and no total was read), and the source takes the cap of 50 that the kinds read from another
                          award's page take (OTHER_PAGE_GAPS in kb/_program_named_gaps.py).

Held (14), each reason in HAND: 02277 and 15477 (a cheaper lever passes them, ON_LEVER below: today's scorer passes
02277 once the nine units go into its non-transfer list, 37-38 against 37-38, and 15477 once WE-186MEA is read at the
one unit its block prints, 29 against 29; p-gap-filing-leaves-census-lever-s721, the second reader's round 1); 41576 (repeat_read_once's shape, MUSIC-189 and MUSIC-190 at 1 unit taken four times
each, but the claim check holds it: today's capture did not find either code on its pages); 10302, 19386, 32723, 33814, 40090, 44260 and 44657 (coverage fails, and today's
scorer passes the arithmetic: a rename or prefix alias is their lever); 32815 (its page is shared with the Spanish
A.A. and no note names its section; its substitution list adds no units, a wording rule); 36793 (its 19-22 falls inside
the printed 18-22); 40384 and 45528 (the own-section guard).

ON_LIVE_RUN READS a committed live read too (program_requirements_reread_*_checked.json, live_runs): a load over two
runs names no run per key, and S691's live read at 08:54Z (migrate 44886984854) holds 15477 at 44769429877; the
pre-read's on_run count checks the live row itself.

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found, and a page a note says the read lacked is not among the capture's pages. THE
SELF-RECALL: HAND is the hand reading of the 21; precision runs the rules and the claim check over each; boundary
readings: the note's words gone, the stated total one unit off, coverage failing, and each entry's own figures moved.

    python3 kb/_program_piles_s727_canyons.py --dry-run
    python3 kb/_program_piles_s727_canyons.py --tag s727a

Guard: tests/program_piles_s727_canyons_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import glob
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
COLLEGE = "College of the Canyons"
SLUG = "college_of_the_canyons"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()
TAG = "s727a"
HELD_DIR = "held_for_person"
# Collected from held_for_person/ (no live row: the plan inserts one), beside the census's members.
FROM_HELD = ("43388",)

# Records a wording rule on the reconcile_steps lever passes, so neither is gap-filed: each entry's figures close the
# record's sum to its printed total at both ends (line_closes, takes_closes), which is today's scorer passing it once
# the rule rewrites the record (the second reader, S727 round 1).
ON_LEVER = {
    "02277": {"computed": [28, 38], "stated": [37, 38],
              "words": "Nine additional units from the above CMPSCI courses that have not already been taken",
              "line": {"block": "Plus 14 units from the following (for non-transfer students)", "adds": 9}},
    "15477": {"computed": [28.05, 32], "stated": [29, 29],
              "words": "Capstone block 'Required electives: Capstone (needs only one unit of WE-186MEA)'",
              "takes": {"block": "Required electives: Capstone (needs only one unit of WE-186MEA)",
                        "code": "WE-186MEA", "printed": [0.05, 4], "units": 1}},
}

REVIEWED = {
    "10312": {"gap": "noted_figures_differ", "computed": [20, 20], "stated": [18, 18],
              "words": "The page states 'Units Required: 18', but the seven required courses sum to 18 units and the "
                       "degree also requires a minimum of 2 units of WE-186HOSP, which would give 20 units"},
    "16962": {"gap": "noted_section_cut_off", "computed": [8, 8], "stated": None,
              "words": "The catalog text begins mid-section on page 84", "not_page": 83,
              "own_section": "the Automotive Technology A.S. Degree heading, description, outcomes, units required and "
                             "the first part of its course list are on page 83"},
    "32896": {"gap": "lists_not_closed", "computed": [16, 18], "stated": [18, 19],
              "words": "The third block's minimum depends on the option chosen",
              "open": "If Option 1 is selected above, plus three units / If Option 2 is selected above, plus six units "
                      "from the following",
              "own_section": "recorded the ones printed in the AA-T section"},
    "37648": {"gap": "pool_figure_not_read", "computed": [13, 15], "stated": [18, 18],
              "words": "Take six courses from the following for a minimum of 18 units, at least one course from each of "
                       "the five areas"},
    "40383": {"gap": "noted_figures_differ", "computed": [37, 37], "stated": [36, 36],
              "words": "The minimum of 1 unit of WE-186AUTO would bring the total to 37",
              "own_section": "The section covers both the A.S. Degree and the Certificate of Achievement in Advanced "
                             "Diagnosis and Performance"},
    "41576": {"gap": "repeat_read_once", "computed": [20, 20], "stated": [26, 26],
              "words": "MUSIC-189 and MUSIC-190 are printed at 1.0 unit each but must each be taken 4 times",
              "repeats": [["MUSIC-189", 1, 4], ["MUSIC-190", 1, 4]], "courses": ["MUSIC189", "MUSIC190"],
              "own_section": "Read only the 'Associate in Arts Degree: Music' section"},
    "43549": {"gap": "noted_figures_differ", "computed": [23, 23], "stated": [22.5, 22.5],
              "words": "Stated total is 22.5 units, but the required courses (19) plus the 3-unit option plus a minimum "
                       "1 unit of work experience sum to 23"},
    "43388": {"gap": "heading_not_in_text", "computed": [0, 0], "stated": None,
              "words": "The certificate's title, description and outcome were apparently printed on the preceding page "
                       "and are not in the text", "not_page": 327, "courses": ["NCCSKL14"],
              "own_section": "This record takes the first Program Requirements list as Fundamentals of Public "
                             "Communications"},
}
_COVERAGE = ("held: %s; today's scorer passes its arithmetic (scorer_passes), so it is "
             "never gap-filed: a rename or prefix alias that places those courses is its lever")
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "02277": "held: a cheaper lever passes it: with the non-transfer path's printed 'Nine additional units from the "
             "above CMPSCI courses' in its list (14 = MATH-211's 5 plus 9) today's scorer reads 37-38 against the "
             "printed 37-38; a wording rule on reconcile_steps, never a named gap",
    "15477": "held: a cheaper lever passes it: with WE-186MEA read at the one unit its capstone block prints ('needs "
             "only one unit'), today's scorer reads 29 against the printed 29; a wording rule on reconcile_steps, "
             "never a named gap",
    "41576": "held: the claim check: today's capture did not find MUSIC 189 or MUSIC 190 among the codes on its pages "
             "(22 of the file's 30), so the repeat its note names is not corroborated; repeat_read_once (20 plus the "
             "six repeats is the printed 26) waits on a page read",
    "10302": _COVERAGE % "coverage and invented fail: WWE 186ID printed as WE-186ID; ID-101B not in the state's file",
    "19386": _COVERAGE % "coverage and invented fail: WWE 186ID printed as WE-186ID; ID-101B not in the state's file",
    "33814": _COVERAGE % "coverage and invented fail: WWE 186ID printed as WE-186ID; ARCHT-250 not in the state's file",
    "44260": _COVERAGE % ("coverage and invented fail: WE ARCH486 printed as WE-486ARCH; CONST-105 and CONST-106 "
                          "not in the state's file"),
    "32723": _COVERAGE % ("coverage and invented fail: PSYCH 104 printed as PSYC-104, a prefix alias S691 filed "
                          "after this record's run; ten courses not in the state's file"),
    "40090": _COVERAGE % ("coverage and invented fail: the catalog's misprints PSCYH-104 and ATNHRO-105; four "
                          "courses not in the state's file"),
    "44657": _COVERAGE % "coverage fails (invented passes): the catalog's misprint ANTRHO-103 for ANTHRO 103 and 103H",
    "32815": "held: page 216 is shared with the Spanish A.A. (02290) and no note names the record's own section (the "
             "own-section guard); its last list is a substitution list that adds no units to the printed 23, so a "
             "wording rule that reads it so passes it (23 against 23): the reconcile lever",
    "36793": "held: its courses add to 19-22, inside the printed 18-22, so the figures do not disagree "
             "(d-lists-gap-holds-range-sums-s703), and no kind names a units sum inside a printed range "
             "(hours_within_printed_range is the hours form)",
    "40384": "held: page 84 is shared with five programs and no note of its own names its section (the own-section "
             "guard); 40383's note says one section serves both awards, a reading for a person or a rule",
    "45528": "held: page 66 is shared with the Administration of Justice certificate (20465) and no note names the "
             "record's own section (the own-section guard)",
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


def keys(path: str = CENSUS) -> list[str]:
    """The census's members and the records collected from held_for_person/."""
    return census_members(path) + [cn for cn in FROM_HELD if cn not in census_members(path)]


def _path(cn: str) -> str:
    return os.path.join(NG.COLLEGE_DIR, SLUG, "records", cn + ".json")


def _held_path(cn: str) -> str:
    return os.path.join(NG.COLLEGE_DIR, SLUG, HELD_DIR, cn + ".json")


def _load(cn: str) -> dict | None:
    for p in (_path(cn), _held_path(cn)):
        if os.path.isfile(p):
            with open(p, encoding="utf-8") as fh:
                return json.load(fh)
    return None


def _pair(v):
    return None if v is None else [float(v[0]), float(v[1])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def _notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


def _blocks(filed: dict, name: str) -> list[dict]:
    return [b for b in (filed.get("record") or {}).get("blocks") or [] if b.get("name") == name]


def _course(filed: dict, code: str) -> list[dict]:
    return [c for b in (filed.get("record") or {}).get("blocks") or [] for c in b.get("courses") or []
            if c.get("code") == code]


def line_closes(filed: dict, e: dict) -> bool:
    """unit_line_not_read's figures: the named block prints a figure its courses fall short of by the line's units,
    and with the line the sum closes to the stated total at both ends (the low end is that path's)."""
    bs = _blocks(filed, e["line"]["block"])
    if len(bs) != 1:
        return False
    st = S._span(bs[0].get("stated"))
    units = [S._num(c.get("units")) for c in bs[0].get("courses") or []]
    if st is None or not units or any(u is None for u in units):
        return False
    adds = e["line"]["adds"]
    if abs(sum(units) + adds - st[0]) > NG.FIG_EPS:
        return False
    comp, stated = _pair(e["computed"]), _pair(e["stated"])
    return abs(comp[0] + adds - stated[0]) <= NG.FIG_EPS and abs(comp[1] - stated[1]) <= NG.FIG_EPS


def takes_closes(filed: dict, e: dict) -> bool:
    """noted_unit_floor's figures, at a fixed amount: the variable-unit course appears once in the named block at its
    printed range, and taken at the units the page requires, the sum closes to the stated total at both ends."""
    t = e["takes"]
    bs = _blocks(filed, t["block"])
    if len(bs) != 1:
        return False
    rows = [c for c in bs[0].get("courses") or [] if c.get("code") == t["code"]]
    if len(rows) != 1 or len(_course(filed, t["code"])) != 1:
        return False
    lo, hi = S._num(rows[0].get("units")), S._num(rows[0].get("units_max"))
    if lo is None or hi is None or abs(lo - t["printed"][0]) > NG.FIG_EPS or abs(hi - t["printed"][1]) > NG.FIG_EPS:
        return False
    if not lo + NG.FIG_EPS < t["units"] <= hi + NG.FIG_EPS:
        return False
    comp, st = _pair(e["computed"]), _pair(e["stated"])
    return (abs(comp[0] + t["units"] - lo - st[0]) <= NG.FIG_EPS
            and abs(comp[1] - (hi - t["units"]) - st[1]) <= NG.FIG_EPS)


def repeats_close(filed: dict, e: dict) -> bool:
    """Each repeated course appears once in the record at its printed units, and the repeats (times - 1 at its units)
    close the sum to the stated total at both ends."""
    extra = 0.0
    for code, units, times in e["repeats"]:
        rows = _course(filed, code)
        if len(rows) != 1 or rows[0].get("units") != units:
            return False
        extra += units * (times - 1)
    comp, st = _pair(e["computed"]), _pair(e["stated"])
    return all(abs(c + extra - s) <= NG.FIG_EPS for c, s in zip(comp, st))


def list_open(filed: dict, e: dict) -> bool:
    """lists_not_closed's figures: the named list is one choose-units list (its figure depends on another choice)."""
    bs = _blocks(filed, e["open"])
    return len(bs) == 1 and bs[0].get("rule") == "choose_units"


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


def _returned_rows(obj) -> bool:
    """The migrate response wrote rows: a guarded statement's 'returned' count above 0, or a non-empty 'inserted' or
    'deleted' list, at any depth of the response the runner filed."""
    if isinstance(obj, list):
        return any(_returned_rows(x) for x in obj)
    if not isinstance(obj, dict):
        return False
    for k in ("inserted", "deleted"):
        if isinstance(obj.get(k), list) and obj[k]:
            return True
    r = obj.get("returned")
    if isinstance(r, bool):
        return False
    if isinstance(r, (int, float)):
        return r > 0
    return any(_returned_rows(v) for v in obj.values() if isinstance(v, (dict, list)))


def plan_applied(tag: str) -> bool:
    """A plan's rows reached the live table: a filed migrate receipt of its apply answered 2xx with rows written, and
    no filed receipt of its rollback did (the second reader, S727 round 1: an aborted or rolled-back apply posts
    nothing). A receipt whose file name names neither counts as an apply."""
    applied = rolled = False
    for path in glob.glob(os.path.join(NG.RECEIPTS, "migration_%s_prreq_*.json" % tag)):
        try:
            with open(path, encoding="utf-8") as fh:
                d = json.load(fh)
            resp = json.loads(d.get("response") or "null")
        except (OSError, ValueError, TypeError, AttributeError):
            continue
        if not str(d.get("status") or "").startswith("2") or not _returned_rows(resp):
            continue
        if "_rollback" in os.path.basename(path):
            rolled = True
        else:
            applied = True
    return applied and not rolled


def posted_runs(skip: tuple = ()) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    (program_requirement_records_college_<slug>_<run>.json: inserted_keys under its one extracted run), a reread
    (..._college_reread_<slug>_<run>.json: replaced_keys and carried_keys under its extracted_run), every guarded
    plan's records (each guarded on the row's live run, posted only once its migration receipt is filed) and a
    committed live read (program_requirements_reread_*_checked.json: live_runs at its read_at). skip names plan tags
    whose receipts are left out (the test reads the receipts as they stood before this plan's own apply); a skip is
    never cached."""
    global _POSTED
    if _POSTED is not None and not skip:
        return _POSTED
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
            tag = name[:-len(".json")].rsplit("_", 1)[-1]
            if tag in skip:
                continue
            if not plan_applied(tag):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == COLLEGE and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    for path in glob.glob(os.path.join(NG.RECEIPTS, "program_requirements_reread_*_checked.json")):
        try:
            with open(path, encoding="utf-8") as fh:
                d = json.load(fh)
        except (OSError, ValueError):
            continue
        live = ((d.get("live_runs") or {}) if isinstance(d, dict) else {}).get(COLLEGE) or {}
        at = str(d.get("read_at") or "")
        if not at:
            continue
        for k, run in live.items():
            out.setdefault(str(k), []).append((at, str(run)))
    if not skip:
        _POSTED = out
    return out


def on_live_run(filed: dict) -> bool:
    """The committed record's run is the run the latest committed receipt posted for the row (the pre-read class of
    East Los Angeles 02456: a reconcile rewrote the file, and its run never reached the live row). A record collected
    from held_for_person/ has no live row: no receipt but this plan's own posts it.

    Once the plan has applied, its own receipt posts the row it inserted, and a live read taken after that reads the
    row back (S748's six-college read of 2026-11-28 07:47Z posts 43388 at 44886816990, the run this plan inserted).
    Such a read is no earlier post: the record is on its live run where every other post is later than the plan's
    own and names the record's own run, and off it where one names another run. Before the plan applies, the rule is
    as it was: no other receipt posts the row."""
    cn = str(filed.get("control_number"))
    if cn in FROM_HELD:
        others = posted_runs(skip=(TAG,)).get(cn) or []
        own = [x for x in posted_runs().get(cn) or [] if x not in others]
        if not own:
            return not others
        first = min(own)[0]
        return all(at > first and run == str(filed.get("extracted_run")) for at, run in others)
    rows = posted_runs().get(cn) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


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
    if e.get("line") and not line_closes(filed, e):
        return None
    if e.get("takes") and not takes_closes(filed, e):
        return None
    if e.get("repeats") and not repeats_close(filed, e):
        return None
    if e.get("open") and not list_open(filed, e):
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
    if shared_with(cn) and not any(e.get("own_section") and e["own_section"] in n for n in _notes(filed)):
        # #3753's own_page guard, for PDF pages: a page shared_pages lists another program on is the record's own
        # only where a note names the record's own section (East Los Angeles's second reader, 38168).
        return "the page is shared and no note names the record's own section"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    if e.get("not_page") is not None and e["not_page"] in ((s.get("source") or {}).get("pages") or []):
        return "the capture holds the page the note says the read lacked"
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
    for cn in keys(census_path):
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
    for cn in keys(census_path):
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

    for cn in keys(census_path):
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
        if e.get("line"):
            moved = dict(e, line=dict(e["line"], adds=e["line"]["adds"] - 1))
            tally("the line one unit short", gap_noted(f, dict(REVIEWED, **{cn: moved})) is None, cn)
        if e.get("takes"):
            moved = dict(e, takes=dict(e["takes"], units=e["takes"]["units"] + 1))
            tally("the course taken one unit more", gap_noted(f, dict(REVIEWED, **{cn: moved})) is None, cn)
            moved = dict(e, takes=dict(e["takes"], units=e["takes"]["printed"][0]))
            tally("the course taken at its printed least", gap_noted(f, dict(REVIEWED, **{cn: moved})) is None, cn)
        if e.get("repeats"):
            short = dict(e, repeats=[[c, u, t - 1] for c, u, t in e["repeats"]])
            tally("a repeat one time short", gap_noted(f, dict(REVIEWED, **{cn: short})) is None, cn)
        if e.get("open"):
            g = copy.deepcopy(f)
            for b in g["record"]["blocks"]:
                if b.get("name") == e["open"]:
                    b["rule"] = "all"
            tally("the open list read as required", gap_noted(g) is None, cn)
        if cn in FROM_HELD:
            g = copy.deepcopy(f)
            g["control_number"] = "00000"
            tally("another key", gap_noted(g) is None, cn)
    return {"counts": dict(out), "wrong": wrong}


def _image_keys(img: dict) -> dict:
    return {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url", "measure", "total_min",
                                "total_max", "record", "checks", "extracted_run")}


def plan(write: bool, census_path: str = CENSUS) -> dict:
    """The rows: UPDATE rows (a live row's checks to the load's image) and INSERT rows (a held_for_person/ record
    moved to records/ with its gap; the load's image is the row inserted)."""
    rows, held, hits = [], [], []
    src = _sources()
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        year = json.load(fh).get("catalog_year")
    images = NG._load_images({COLLEGE})
    for cn in keys(census_path):
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
        insert = cn in FROM_HELD
        img = images.get((COLLEGE, cn))
        if insert:
            if img is not None or os.path.isfile(_path(cn)):
                held.append({"control_number": cn, "why": "a held record already has a file in records/"})
                continue
        elif img is None or F.row_passes(img["checks"]):
            held.append({"control_number": cn, "why": "the load leaves it out, or its image passes"})
            continue
        e = src.get(cn) or {}
        score = copy.deepcopy(f["score"])
        score["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": words}]
        score["confidence"] = NG.confidence(dict(f, score=score), gap, e.get("method"),
                                            (e.get("catalog_year") or year) == year)
        hits.append((cn, f, score, gap, words, img, insert))
    for cn, f, score, gap, words, img, insert in hits:
        row = {"college": COLLEGE, "control_number": cn, "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": gap, "words": words,
               "confidence": score["confidence"], "path": os.path.relpath(_path(cn), ROOT),
               "write": "insert" if insert else "update"}
        if insert:
            row["from"] = os.path.relpath(_held_path(cn), ROOT)
        if write:
            if not insert:
                row["before_image"] = _image_keys(img)
            with open(_path(cn), "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=score), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
            if insert:
                os.remove(_held_path(cn))
        rows.append(row)
    if write and rows:
        after = NG._load_images({COLLEGE})
        for r in rows:
            img = after.get((COLLEGE, r["control_number"]))
            if img is None or (img["checks"].get("gaps") or []) != [r["moves_to"]]:
                raise SystemExit("%s: the load leaves it out, or its image does not carry the gap" % r["control_number"])
            if r["write"] == "update":
                if img["record"] != r["before_image"]["record"]:
                    raise SystemExit("%s: the record changed" % r["control_number"])
                r["after_image"] = {"checks": img["checks"]}
            else:
                if str(img["extracted_run"]) != str(r["extracted_run"]):
                    raise SystemExit("%s: the image is not at the record's run" % r["control_number"])
                r["after_image"] = _image_keys(img)
    updates = [r for r in rows if r["write"] == "update"]
    inserts = [r for r in rows if r["write"] == "insert"]
    for i, r in enumerate(updates + inserts, 1):
        r["i"] = i
    return {"rows": updates + inserts, "updates": updates, "inserts": inserts, "held": held}


# ── the SQL: S713's guarded UPDATE and pre-reads, with the inserted rows spliced in as one statement ──────────────

def _lit(s: str) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def _num_sql(v) -> str:
    return "null" if v is None else repr(float(v)) if not float(v).is_integer() else str(int(v))


def _insert_values(rows: list[dict]) -> str:
    return ",\n".join("  (%s, %s, %s, %s, %s, %s, %s, %s, %s::numeric, %s::numeric, %s::jsonb, %s::jsonb, %s::bigint)" % (
        r["i"], _lit(r["college"]), _lit(r["control_number"]), _lit(r["after_image"]["program_title"]),
        _lit(r["after_image"]["award"]), _lit(r["after_image"]["catalog_year"]), _lit(r["after_image"]["source_url"]),
        _lit(r["after_image"]["measure"]), _num_sql(r["after_image"]["total_min"]),
        _num_sql(r["after_image"]["total_max"]),
        _lit(json.dumps(r["after_image"]["record"], ensure_ascii=False)),
        _lit(json.dumps(r["after_image"]["checks"], ensure_ascii=False)), r["extracted_run"]) for r in rows)


N_COLS = "i, college, control_number, program_title, award, catalog_year, source_url, measure, total_min, total_max, " \
         "record, checks, extracted_run"


def _splice(sql: str, old: str, new: str) -> str:
    if sql.count(old) != 1:
        raise SystemExit("the guarded SQL's shape moved: %r is not found once" % old[:60])
    return sql.replace(old, new)


def apply_sql(updates: list[dict], inserts: list[dict], tag: str) -> str:
    """P.confirm_guarded_apply over the UPDATE rows, with a guarded INSERT of the held records in the same statement:
    the insert takes only a key with no live row (on conflict do nothing), and the statement aborts, writing nothing,
    unless it inserts every one of them."""
    sql = P.confirm_guarded_apply(updates, tag)
    if not inserts:
        return sql
    ins = ("n(%s) as (values\n%s),\n"
           "ins as (\n"
           "insert into public.program_requirement_records (college, control_number, program_title, award, catalog_year,\n"
           "       source_url, measure, total_min, total_max, record, checks, checked, extracted_run)\n"
           "select college, control_number, program_title, award, catalog_year, source_url, measure, total_min, "
           "total_max,\n"
           "       record, checks, false, extracted_run from n\n"
           "on conflict (college, control_number) do nothing\n"
           "returning control_number),\n" % (N_COLS, _insert_values(inserts)))
    sql = _splice(sql, "s as (select count(*) as n", ins + "s as (select count(*) as n")
    sql = _splice(sql, "            when s.n = e.expect - c.n\n",
                  "            when (select count(*) from ins) <> %d\n"
                  "            then ('%s insert guard: the INSERT wrote ' || (select count(*) from ins) || ' rows, the "
                  "plan names %d')::int::text::json\n"
                  "            when s.n = e.expect - c.n\n" % (len(inserts), tag, len(inserts)))
    return _splice(sql, "json_build_object('returned', s.n, 'keys', s.keys,",
                   "json_build_object('returned', s.n, 'keys', s.keys, 'inserted', "
                   "(select coalesce(json_agg(control_number order by control_number), '[]'::json) from ins),")


def rollback_sql(updates: list[dict], inserts: list[dict], tag: str) -> str:
    """NG.rollback_sql over the UPDATE rows, with a guarded DELETE of the inserted rows in the same statement: only a
    row still at its inserted image that no person has touched. A row a person checked, or one carrying any verdict
    (program_record_verdicts references the row, so deleting it would fail the whole statement on the foreign key),
    is kept and listed as skipped_touched_inserts, and the UPDATE restores still run. The delete has its own expect
    line (de), so a rollback after a reread moved an inserted row can be told to delete fewer (the second reader, S727
    round 1)."""
    sql = NG.rollback_sql(updates, tag)
    if not inserts:
        return sql
    touched = ("exists (select 1 from public.program_record_verdicts pv\n"
               "                     where pv.college = n.college and pv.control_number = n.control_number)")
    dl = ("n(%s) as (values\n%s),\n"
          "-- A partial rollback of the inserted rows: set the delete's expect below to the smaller count you mean.\n"
          "de(expect) as (values (%d)),\n"
          "nc as (select coalesce(json_agg(n.control_number order by n.control_number), '[]'::json) as keys, "
          "count(*) as n\n"
          "        from n join public.program_requirement_records r\n"
          "          on r.college = n.college and r.control_number = n.control_number\n"
          "       where r.checked is true or %s),\n"
          "del as (\n"
          "delete from public.program_requirement_records r\n"
          " using n\n"
          " where r.college = n.college and r.control_number = n.control_number and r.extracted_run = n.extracted_run\n"
          "   and r.record = n.record and r.checks = n.checks and r.checked is not true\n"
          "   and not %s\n"
          "returning r.control_number),\n" % (N_COLS, _insert_values(inserts), len(inserts), touched, touched))
    sql = _splice(sql, "s as (select count(*) as n", dl + "s as (select count(*) as n")
    sql = _splice(sql, "select case when s.n = e.expect - c.n\n",
                  "select case when (select count(*) from del) <> de.expect - nc.n\n"
                  "            then ('%s delete guard: the DELETE matched ' || (select count(*) from del) || ' rows, the "
                  "plan names ' || (de.expect - nc.n))::int::text::json\n"
                  "            when s.n = e.expect - c.n\n" % tag)
    sql = _splice(sql, "json_build_object('returned', s.n, 'keys', s.keys,",
                  "json_build_object('returned', s.n, 'keys', s.keys, 'deleted', "
                  "(select coalesce(json_agg(control_number order by control_number), '[]'::json) from del), "
                  "'skipped_touched_inserts', nc.keys,")
    return _splice(sql, "  from s, c, e;", "  from s, c, e, nc, de;")


def _insert_counts(inserts: list[dict]) -> str:
    keys_ = ", ".join(_lit(r["control_number"]) for r in inserts)
    return ("  'insert_listed', %d,\n"
            "  'insert_present', (select count(*) from public.program_requirement_records r0\n"
            "                      where r0.college = %s and r0.control_number in (%s)),\n"
            "  'insert_verdicts', (select count(*) from public.program_record_verdicts pv0\n"
            "                       where pv0.college = %s and pv0.control_number in (%s)),\n"
            % (len(inserts), _lit(COLLEGE), keys_, _lit(COLLEGE), keys_))


def pre_read_sql(updates: list[dict], inserts: list[dict]) -> str:
    sql = P.confirm_pre_read(updates)
    if not inserts:
        return sql
    return _splice(sql, "  'listed', (select count(*) from v),\n",
                   "  'listed', (select count(*) from v),\n" + _insert_counts(inserts))


def md5_pre_read(updates: list[dict], inserts: list[dict]) -> str:
    """F.md5_pre_read, its query sent to the local Postgres on stdin (as Palo Verde's), with the inserted keys'
    absence counted in the same JSON value."""
    import subprocess
    real = F.subprocess.run

    def run(cmd, **kw):
        if "-c" in cmd:
            i = cmd.index("-c")
            return real(cmd[:i] + cmd[i + 2:], input=cmd[i + 1], **kw)
        return real(cmd, **kw)

    F.subprocess.run = run
    try:
        sql = F.md5_pre_read(updates)
    finally:
        F.subprocess.run = real
        assert subprocess.run is real
    if not inserts:
        return sql
    return _splice(sql, "  'listed', (select count(*) from v),\n",
                   "  'listed', (select count(*) from v),\n" + _insert_counts(inserts))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default=TAG)
    a = ap.parse_args(argv)
    pr, cc, bd = precision(), claim_checks(), boundaries()
    print("precision: %s" % json.dumps(pr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    # A claim that does not stand is a wrong answer unless the hand reading holds that record on it (41576).
    unheld = [x for x in cc["not_standing"] if not HAND.get(x[0], "").startswith("held: the claim check")]
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or unheld:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows (%d updates, %d inserts) %s; held %d" % (len(res["rows"]), len(res["updates"]),
                                                                  len(res["inserts"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows, ups, ins = res["rows"], res["updates"], res["inserts"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s727_canyons_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S727: College of the Canyons's 20 wording-rule records, collected with their gaps "
                                "named where one is honest (no reread), and 43388, held for a person since S691, "
                                "collected with its gap named (COBIx's brief of 2026-11-24)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "person": list(PERSON),
                       "members": census_members(), "from_held": list(FROM_HELD)},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "updates": len(ups), "inserts": len(ins),
            "precision": pr, "claim_checks": cc, "boundaries": bd, "held": res["held"], "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "UPDATE rows: checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged. INSERT rows: the "
                              "record moved from held_for_person/ to records/ with its gap, and the load's image of it "
                              "inserted as the load would (checked false), only where no live row holds the key",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found, and a page a note says the read lacked not among the capture's pages. The "
                                  "capture keeps no page text, so a note's quoted figures are the reader's words, "
                                  "never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": pre_read_sql(ups, ins), "pre_read_md5": md5_pre_read(ups, ins),
            "apply": apply_sql(ups, ins, a.tag + " piles"),
            "rollback": rollback_sql(ups, ins, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at College of the Canyons (%d rows: %s). An UPDATE row's checks become\n"
           "-- the college load's image of its committed record (load_rows): checks.gaps and checks.confidence added;\n"
           "-- the record unchanged. An INSERT row (%s) is the load's image of a record moved from held_for_person/\n"
           "-- to records/. Receipt: %s (before_image per UPDATE row,\n"
           "-- after_image per row).\n" % (a.tag.upper(), len(rows), ", ".join("%s %d" % kv for kv in sorted(by.items())),
                                           ", ".join(r["control_number"] for r in ins) or "none", rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    parts = {
        "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text\n"
                            "-- (the full before-values, the fallback where a hash does not match, are in "
                            "..._preread.sql). insert_present and\n-- insert_verdicts must read 0.\n"
                            + body["pre_read_md5"]),
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE and INSERT, one statement: an UPDATE only where the row holds the filed run, the\n"
                      "-- before-image's record and checks, and no person's check; an INSERT only where no row holds\n"
                      "-- the key. It aborts, writing nothing, unless it matches the plan's %d UPDATE rows less those\n"
                      "-- a person checked (listed as skipped_checked) and inserts its %d rows, or a row holds a\n"
                      "-- matching confirm.\n" % (len(ups), len(ins)) + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                         "-- after-image, and each inserted row deleted where it still holds its inserted image and no\n"
                         "-- person has checked it or left a verdict on it (such a row is kept and listed), skipping and\n"
                         "-- listing a row a person checked. A rollback lasts only until the next load of\n"
                         "-- that college: revert the record files too (git revert of this plan's commit).\n"
                         + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
