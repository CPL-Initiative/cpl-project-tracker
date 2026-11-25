#!/usr/bin/env python3
"""S731, lane 2's cheap piles at Long Beach City: the census's 16 wording-rule records, 3 passed, 9 with named gaps.

The census on main (kb/status/harvest_gap_census.json, run 45586922147, written 2026-11-25 09:39Z) lists 16 Long Beach
City College records under the reconcile_steps lever ("a team session writes correction rules from the catalog's own
wording, then rescores the saved record"), the same 16 the 07:13Z census listed. Sam's ruling (2026-11-17,
sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps noted and confidence
scores, a gap noted instead of a reread. The college carries no reconcile steps (kb/program_requirements_reconcile.json
names no Long Beach City entry), and its capture (run 39891611701) keeps no page text, so every reading here works
from the committed record, its notes and the state's course list. No record is changed; each score is.

THE RESCORE THAT PASSES THREE (PASSED below). The filed runs of 2026-10-11 scored these before two of today's scorer's
readings existed, and kb/_program_requirements_rescore.py skips them (their filed arithmetic names no "against"). Each
record's arithmetic is re-added by main's scorer against its own state list (kb/_program_piles_s714_ccsf.py
fresh_score), and a record moves only where, with its one reading off, the scorer gives the filed arithmetic exactly
(the S714 rescore's guard; today's adds only "against": "program"):
  short_high   Sam's ruling of 2026-11-17 ("Pass short high ends the same way as over-high ends"): the low end meets
               the printed range's low end exactly. Vocational Nursing A.S. 02678 and its certificate 20940, 47 against
               the printed 47-53.
  meets        Sam's Open Asks Sheet 120 card 1 "narrow" (2026-10-23): the low end meets the printed total, a variable
               row carrying the high end past it. Psychology A.A.-T 30650, 20-21 against the printed 20.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes), with the standing guards: scorer_passes
(a record today's scorer passes is never gap-filed), on_live_run (the committed record's run is its live row's), the
record-rule guard (a row kb/_program_named_gaps.py's record rules name under another kind, on the filed or today's
arithmetic, is refused), and the own-page guard keyed on the pages the records were read from (sources.json's
source.url and each record's source_url, never capture.json's shared_pages; p-own-page-guard-reads-read-pages-s727).
Every kind exists; each entry's own check re-adds the record with the one reading its note names and requires today's
scorer to give the printed total at both ends (or, for an open list, that the list prints no figure):
  option_lists_read_apart   (40) Biological Sciences A.S. 02618: the Health Science Emphasis is one option of two
                            lists (9-14 plus 6-9), which the record keeps as two alternatives in the emphasis group;
                            read as one option the record adds to the printed 26.5-35.
  prerequisites_counted     (70) Diagnostic Medical Imaging A.S. 02683 and its certificate 20937: the record counts the
                            10 prerequisite units (ANAT 41, AH 60, AH 61) the printed 71.5 leaves out; without them the
                            courses add to 71.5. The state's course list holds none of the three.
  unit_line_not_read        (40) LVN to RN Career Ladder A.S. 08834: the printed 64-65 includes 18 units of advanced
                            placement, no course; with that line the courses add to 64-65.
  repeat_read_once          (60) Music A.A.-T 32634: MUSIC 92AD is taken four semesters (2 units) and counted once at
                            0.5; with its repeats the courses add to the printed 26.
  lists_past_their_figure   (60) Cloud Computing A.S. 41220: the record rule names it on today's arithmetic: the choice
                            of CS 11, 21 or 31 printed at 4 units under a printed subtotal of 3, the figures adding to
                            the printed 29.
  noted_figures_differ      (40) Philosophy A.A.-T 33390: the Required Core prints 'Subtotal Units 12' over two 3-unit
                            courses; the record adds to 24 and states the printed 18, which the core at 6 gives.
  lists_not_closed          (30) Spanish A.A.-T 33302: Option 2 prints a list of courses with no selection rule, count or
                            units; Theatre Arts A.A.-T 35803: LIST A's 9 units must include the core course not taken
                            in the core, a figure that depends on another choice.

Held (4), each reason in HAND: 42970 (the second reader's round 1, d-lbcc-42970-no-units-read-or-hold-s731:
no_units_printed stays off statewide, since its matcher failed its own self-recall, and no_units_read's own check refuses
the row, since the scorer reads BCOM 15's 3 units from the state's list; S681's hold, the page read free first); 43021 (today's scorer passes it, short_high at 63 against 63-64, but its page is shared
with 02677, the same Registered Nursing A.S. the state's file lists twice, and no note names its own section); 37213
(CSU GE-Breadth read from the LBCC-GE Plan A page, which its own note says is not the program's page: a page search is
its lever); 44848 (the Cal-GETC certificate: its text is cut off mid-Area 4 and it reads no total, so its arithmetic is
incomplete; El Camino 45290's and Orange Coast 32790's hold).

ON_LIVE_RUN, AND A LOAD OVER SEVERAL RUNS (d-multi-run-load-history-proves-run-s731c). Long Beach City's loads
38168152744 and 38200167207 posted records from two and three runs, and their receipts name no run per key, so at
Orange Coast (S721) such a row held. The load writes each row with its record file's own extracted_run
(chatbox/supabase_program_requirement_records_college_load.sql) and keeps a row it finds, so the live run is the file's
run when the load commit wrote it. FILE_HISTORY holds each planned record file's commits on main, read through the
GitHub API (list_commits by path) at READ_AT: each file was last written by the commit that filed its inserting load's
receipt (LOAD_COMMITS), or after it only by a commit whose receipt names the key at the same run (33390: S529's floor
rescore). A key posts its file's run only where that run is among the load's runs and its history reads so. The md5
pre-read's on_run count is the check on the live row itself.

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found, and a course an entry says the printed total leaves out is not on the state's list.
THE SELF-RECALL: HAND is the hand reading of the 16; precision runs the rules and the claim check over each; boundary
readings: the note's words gone, the stated total one unit off, coverage failing; for a rescore its reading off.

    python3 kb/_program_piles_s731_lbcc.py --dry-run
    python3 kb/_program_piles_s731_lbcc.py --tag s731c

Guard: tests/program_piles_s731_lbcc_test.py.
"""
from __future__ import annotations

import argparse
import collections
import contextlib
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
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "Long Beach City College"
SLUG = "long_beach_city"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()
TAG = "s731c"
PASSES = "passes"

# The commits that filed each load's receipt, and each planned record file's commits on main, newest first, read
# through the GitHub API (list_commits with the file's path) at READ_AT.
READ_AT = "2026-11-25T11:40Z"
LOAD_COMMITS = {"38168152744": "11bd19ad3f8ebceb8c9dcda0305c91173ba506f4",
                "38200167207": "eb69348fc9ebc8f7983a2eb6bf44da3a82d24dd0"}
_L1, _L2 = LOAD_COMMITS["38168152744"], LOAD_COMMITS["38200167207"]
_S529 = "5689d97f33b4eb5de6f512123853fedf73886a0e"
FILE_HISTORY = {cn: [_L1] for cn in ("02618", "02678", "02683", "08834", "20937", "30650", "32634", "33302", "35803",
                                     "41220")}
FILE_HISTORY.update({"20940": [_L2, _L1], "33390": [_S529, _L2, _L1]})
# A commit after the load that rewrote the file and kept its run: its receipt names the key at that run.
KEEPS_RUN = {_S529: "kb/receipts/program_requirement_records_floor_rescore_2026-10-30_s529.json"}

PASSED = {
    "02678": {"reading": "short_high", "words": "the printed block subtotals (7 + 40) sum to 47"},
    "20940": {"reading": "short_high", "words": "the printed subtotals (7 + 40) sum to 47"},
    "30650": {"reading": "meets", "words": "The 4-5 unit range is printed beside the STAT C1000/C1000H row"},
}

_PRE = {"gap": "prerequisites_counted", "computed": [81.5, 81.5], "stated": [71.5, 71.5],
        "drop": "Prerequisite Courses", "outside": ["ANAT41", "AH60", "AH61"]}
REVIEWED = {
    "02618": {"gap": "option_lists_read_apart", "computed": [17.5, 33.5], "stated": [26.5, 35],
              "words": "together they form one option, not two",
              "merge": ["Health Science Emphasis: Complete NINE to FOURTEEN (9-14) units from the following",
                        "Health Science Emphasis: IN ADDITION, complete SIX to NINE (6-9) units from the following"]},
    "02683": dict(_PRE, words="they are recorded as their own block but are not included in the 71.5 Required "
                              "Subtotal used as total_units"),
    "20937": dict(_PRE, words="it excludes the 10 prerequisite units (ANAT 41, AH 60, AH 61)"),
    "08834": {"gap": "unit_line_not_read", "computed": [46, 47], "stated": [64, 65],
              "words": "The 64-65 subtotal includes 18 units of advanced placement", "line": 18},
    "32634": {"gap": "repeat_read_once", "computed": [24.5, 24.5], "stated": [26, 26],
              "words": "MUSIC 92AD is a single repeatable course required for FOUR semesters (2 units total)",
              "repeats": [["MUSIC 92AD", 4]], "courses": ["MUSIC92AD"]},
    "41220": {"gap": "lists_past_their_figure", "rule": True, "computed": [30, 30], "stated": [29, 29],
              "courses": ["CS11", "CS21", "CS31"]},
    "33390": {"gap": "noted_figures_differ", "computed": [24, 24], "stated": [18, 18],
              "words": "The Required Core prints 'Subtotal Units 12' although two 3-unit courses total 6",
              "at_courses": "REQUIRED CORE COURSES", "courses": ["PHIL6", "PHIL22"]},
    "33302": {"gap": "lists_not_closed", "computed": [23, 23], "stated": [21, 23],
              "words": "Option 2 under 'Select 1 of 2 Options' prints only a list of courses",
              "open": "REQUIRED CORE COURSES - Option 2"},
    "35803": {"gap": "lists_not_closed", "computed": [17.5, 19.5], "stated": [19, 20],
              "words": "The 9 unit requirement for LIST A must include the REQUIRED CORE COURSE not already used above",
              "depends": "LIST A"},
}
HAND = {cn: PASSES for cn in PASSED}
HAND.update({cn: e["gap"] for cn, e in REVIEWED.items()})
HAND.update({
    "42970": ("held: no_units_printed is off statewide (NG.NO_UNITS_PRINTED_ON: its matcher failed its own self-recall) "
              "and no_units_read's own check refuses it (the scorer reads BCOM 15's 3 units from the state's list): "
              "S681's reason, '%s' (d-lbcc-42970-no-units-read-or-hold-s731)" % NG.HOLD_NO_UNITS_PRINTED),
    "43021": ("held: the own-page guard: today's scorer passes it (short_high, 63 against the printed 63-64), but its "
              "page is the one 02677 was read from, the same Registered Nursing A.S. the state's file lists twice, and "
              "no note names the record's own section: which control number the page is is the inventory's call"),
    "37213": ("held: its page is another award's: CSU GE-Breadth read from the LBCC-GE Plan A page, which its own note "
              "says is 'not the CSU GE-Breadth certificate named in the request'; a page search is its lever"),
    "44848": ("held: the Cal-GETC certificate's text is cut off partway through the Area 4 list and it reads no total, "
              "so its arithmetic is incomplete (El Camino 45290's and Orange Coast 32790's hold); a wider text window "
              "is its lever"),
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
    if isinstance(v, dict):
        v = [v.get("min"), v.get("max")]
    return None if v is None or v[0] is None else [float(v[0]), float(v[1] if v[1] is not None else v[0])]


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
            if S.norm_code(c.get("code")) == S.norm_code(code)]


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


# ── the rescore ───────────────────────────────────────────────────────────
@contextlib.contextmanager
def reading_off(which: str | None):
    """The scorer with one of today's program-total readings off: short_high (Sam, 2026-11-17) or meets (Sheet 120
    card 1). program_verdict is read from the module at call time, so the wrapper reaches every caller."""
    saved = S.program_verdict

    def verdict(*a, **k):
        v = saved(*a, **k)
        return {"pass": False, "status": "unequal"} if which and v.get(which) else v
    S.program_verdict = verdict
    try:
        yield
    finally:
        S.program_verdict = saved


def arithmetic(filed: dict, off: str | None = None) -> dict:
    """The record's arithmetic against its own state list, with the named reading off."""
    with reading_off(off):
        return C.fresh_score(filed)["arithmetic"]


def _bare(a: dict) -> dict:
    return {k: v for k, v in (a or {}).items() if k != "against"}


def todays(filed: dict, off: str | None = None) -> dict | None:
    """Today's arithmetic where the rescore is exact: the filed arithmetic is today's (as filed, this plan's own write
    among them), or today's with the named reading off, "against" aside; else None (an older scorer's, not
    re-judged)."""
    filed_a = (filed.get("score") or {}).get("arithmetic") or {}
    now = arithmetic(filed)
    if now == filed_a or _bare(arithmetic(filed, off)) == _bare(filed_a):
        return now
    return None


def passing_score(filed: dict, skip: tuple = ()) -> tuple[dict, str] | None:
    """(the filed score with today's arithmetic, the note's words) where the PASSED entry stands: its words are the
    record's, the rescore is exact with its reading off, its reading and no other moves it, and the score passes as
    the live table counts it."""
    e = PASSED.get(str(filed.get("control_number")))
    if not e or filed.get("college") != COLLEGE:
        return None
    words = next((n for n in _notes(filed) if e["words"] in n), None)
    if not words or not on_live_run(filed, skip):
        return None
    # A score that passes already stands only as this plan's own write: today's arithmetic, filed.
    if S.passes_live(filed.get("score")) and (filed.get("score") or {}).get("arithmetic") != arithmetic(filed):
        return None
    now = todays(filed, e["reading"])
    if now is None or not now.get(e["reading"]) or arithmetic(filed, e["reading"]).get("status") == "equal":
        return None
    sc = copy.deepcopy(filed.get("score") or {})
    sc["arithmetic"] = now
    sc["pass"] = C._overall(sc)
    return (sc, words) if S.passes_live(sc) else None


# ── on the live run ───────────────────────────────────────────────────────
_SOURCES = None


def _sources() -> dict:
    global _SOURCES
    if _SOURCES is None:
        with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
            _SOURCES = {str(x.get("control_number")): x for x in json.load(fh)}
    return _SOURCES


_READ_PAGES = None


def read_pages() -> dict:
    """{control number: {read page urls}}: sources.json's source.url and the record file's source_url. capture.json's
    shared_pages is not read (p-own-page-guard-reads-read-pages-s727)."""
    global _READ_PAGES
    if _READ_PAGES is not None:
        return _READ_PAGES
    out: dict = collections.defaultdict(set)
    for cn, s in _sources().items():
        u = (s.get("source") or {}).get("url") if isinstance(s.get("source"), dict) else None
        if u:
            out[cn].add(u)
    for path in glob.glob(os.path.join(NG.COLLEGE_DIR, SLUG, "records", "*.json")):
        try:
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        if isinstance(f, dict) and f.get("source_url"):
            out[str(f.get("control_number"))].add(f["source_url"])
    _READ_PAGES = dict(out)
    return _READ_PAGES


def shared_with(cn: str) -> list[str]:
    pages = read_pages()
    mine = pages.get(str(cn)) or set()
    return sorted(k for k, v in pages.items() if k != str(cn) and v & mine)


def _returned_rows(obj) -> bool:
    """The migrate response wrote rows (College of the Canyons's form; the s730a module's)."""
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


def history_keeps_run(cn: str, load_run: str, run: str) -> bool:
    """The record file's history on main (FILE_HISTORY) holds the commit that filed the load's receipt, and after it
    only commits whose receipt names the key at the same run (KEEPS_RUN)."""
    hist = FILE_HISTORY.get(str(cn)) or []
    commit = LOAD_COMMITS.get(str(load_run))
    if not commit or commit not in hist:
        return False
    for sha in hist[:hist.index(commit)]:
        rel = KEEPS_RUN.get(sha)
        if not rel:
            return False
        try:
            with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
                d = json.load(fh)
        except (OSError, ValueError):
            return False
        if not any(isinstance(r, dict) and r.get("college") == COLLEGE and str(r.get("control_number")) == str(cn)
                   and str(r.get("extracted_run")) == str(run) for r in d.get("records") or []):
            return False
    return True


_POSTED = None


def posted_runs(skip: tuple = ()) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    with one run (its inserted_keys), a load over several runs where the key's record file history proves its run
    (history_keeps_run), a reread (replaced_keys and carried_keys under its extracted_run; kept_keys for a key no
    other receipt posts), and every applied plan's records. skip names plan tags whose receipts are left out (the test
    reads the receipts as they stood before this plan's own apply, p-test-reads-own-apply-receipt-s721)."""
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
                    continue
                f = _load(str(k))
                run = str((f or {}).get("extracted_run"))
                if run in runs and history_keeps_run(str(k), str(d.get("load_run")), run):
                    out.setdefault(str(k), []).append((at, run))
        else:
            tag = name[:-len(".json")].rsplit("_", 1)[-1]
            if tag in skip or not plan_applied(tag):
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
    rows = posted_runs(skip).get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


# ── each kind's own check: the record re-added with the one reading its note names ──
def _closes(filed: dict, record: dict) -> bool:
    """Today's scorer, against the record's own state list, gives the printed total at both ends."""
    a = C.fresh_score(dict(filed, record=record))["arithmetic"]
    return a.get("status") == "equal" and _same(a.get("computed"), a.get("stated"))


def kind_closes(filed: dict, e: dict) -> bool:
    rec = copy.deepcopy(filed.get("record") or {})
    blocks = rec.get("blocks") or []
    if e.get("merge"):
        parts = [b for b in blocks if b.get("name") in e["merge"]]
        if len(parts) != len(e["merge"]) or len({b.get("option_group") for b in parts}) != 1 \
                or parts[0].get("option_group") is None:
            return False
        lo = sum(_pair(b.get("stated"))[0] for b in parts)
        hi = sum(_pair(b.get("stated"))[1] for b in parts)
        one = {"name": " + ".join(e["merge"]), "rule": "choose_units", "minimum": lo, "stated": {"min": lo, "max": hi},
               "option_group": parts[0]["option_group"], "courses": [c for b in parts for c in b.get("courses") or []]}
        rec["blocks"] = [b for b in blocks if b not in parts[1:]]
        rec["blocks"][rec["blocks"].index(parts[0])] = one
        return _closes(filed, rec)
    if e.get("drop"):
        if len(_blocks(filed, e["drop"])) != 1:
            return False
        rec["blocks"] = [b for b in blocks if b.get("name") != e["drop"]]
        return _closes(filed, rec)
    if e.get("line"):
        rec["blocks"] = blocks + [{"name": "the unit line", "rule": "choose_units", "minimum": e["line"],
                                   "option_group": None, "stated": {"min": e["line"], "max": e["line"]},
                                   "courses": []}]
        return _closes(filed, rec)
    if e.get("repeats"):
        for code, times in e["repeats"]:
            rows = _course(filed, code)
            if len(rows) != 1 or S._num(rows[0].get("units")) is None:
                return False
            for b in rec["blocks"]:
                b["courses"] = [x for c in b.get("courses") or [] for x in
                                ([c] + [dict(c, code="%s (repeat %d)" % (c["code"], i)) for i in range(2, times + 1)]
                                 if S.norm_code(c.get("code")) == S.norm_code(code) else [c])]
        return _closes(filed, rec)
    if e.get("at_courses"):
        bs = [b for b in blocks if b.get("name") == e["at_courses"]]
        if len(bs) != 1:
            return False
        units = [S._num(c.get("units")) for c in bs[0].get("courses") or []]
        if None in units:
            return False
        bs[0]["stated"] = {"min": sum(units), "max": sum(units)}
        return _closes(filed, rec)
    if e.get("unprinted"):
        rows = _course(filed, e["unprinted"])
        if len(rows) != 1 or any(S._num(rows[0].get(k)) is not None for k in ("units", "units_max", "units_total")):
            return False
        for b in rec["blocks"]:
            b["courses"] = [c for c in b.get("courses") or [] if S.norm_code(c.get("code")) != S.norm_code(e["unprinted"])]
        return _closes(filed, rec)
    if e.get("open"):
        bs = _blocks(filed, e["open"])
        return len(bs) == 1 and bs[0].get("rule") in ("choose_courses", "choose_units") \
            and bs[0].get("minimum") is None and S._span(bs[0].get("stated")) is None
    if e.get("depends"):
        bs = _blocks(filed, e["depends"])
        a = (filed.get("score") or {}).get("arithmetic") or {}
        comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
        return len(bs) == 1 and bs[0].get("rule") in ("choose_courses", "choose_units") and comp is not None \
            and st is not None and comp[0] + NG.FIG_EPS < st[0]
    return bool(e.get("rule"))


def _rule(filed: dict, arith: dict) -> tuple | None:
    sc = {k: v for k, v in (filed.get("score") or {}).items() if k not in ("gaps", "confidence")}
    sc["arithmetic"] = arith
    return NG.answer(dict(filed, score=sc))


def gap_noted(filed: dict, reviewed: dict | None = None, skip: tuple = ()) -> tuple[str, str] | None:
    """(gap, words) where a reviewed entry stands on the record as it is filed; else None."""
    e = (REVIEWED if reviewed is None else reviewed).get(str(filed.get("control_number")))
    if not e or filed.get("college") != COLLEGE:
        return None
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
        return None
    now = arithmetic(filed)
    # The record-rule guard, on the filed arithmetic and on today's: a row the rules name under another kind is
    # refused, and a rule entry stands only where the rule names its kind (its words are the rule's own).
    for arith in (a, now):
        rr = _rule(filed, arith)
        if rr and rr[0] != e["gap"]:
            return None
    if e.get("rule"):
        rr = _rule(filed, now)
        if not rr or rr[0] != e["gap"]:
            return None
        words = rr[1]
    else:
        words = next((n for n in _notes(filed) if e["words"] in n), None)
        if not words:
            return None
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None
    if scorer_passes(filed) or not on_live_run(filed, skip):
        return None
    if not kind_closes(filed, e):
        return None
    return e["gap"], words


def claim(filed: dict, src: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn) or PASSED.get(cn)
    s = (_sources() if src is None else src).get(cn)
    if not e or not s:
        return "no capture"
    if shared_with(cn) and not (e.get("own_section") and any(e["own_section"] in n for n in _notes(filed))):
        return "the page is shared and no note names the record's own section"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    listed = {S.norm_code(c.get("code")) for c in C.closed_list(COLLEGE, cn)}
    if any(S.norm_code(c) in found | listed for c in e.get("outside") or []):
        return "a course the printed total leaves out is on the state's list"
    return "stands"


def outcome(filed: dict, src: dict | None = None, skip: tuple = ()) -> tuple[str, str | None, str, dict | None]:
    """(answer, words, claim, rescored score): answer is a gap's name, PASSES, or 'none'."""
    cn = str(filed.get("control_number"))
    if cn in PASSED:
        j = passing_score(filed, skip)
        if not j:
            return "none", None, "the rescore does not stand", None
        c = claim(filed, src)
        return (PASSES, j[1], c, j[0]) if c == "stands" else ("none", None, c, None)
    j = gap_noted(filed, skip=skip)
    if not j:
        return "none", None, "no entry stands", None
    c = claim(filed, src)
    return (j[0], j[1], c, None) if c == "stands" else ("none", None, c, None)


# ── the self-recall ───────────────────────────────────────────────────────
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
        if f is None or not (gap_noted(f) or (cn in PASSED and passing_score(f))):
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
        if f is None:
            continue
        if cn in PASSED and passing_score(f):
            e = PASSED[cn]
            g = copy.deepcopy(f)
            g["record"]["notes"] = [str(n).replace(e["words"], "") for n in g["record"].get("notes") or []]
            tally("the note's words gone", passing_score(g) is None, cn)
            with reading_off(e["reading"]):
                tally("its reading off", not S.passes_live(dict(f["score"], arithmetic=C.fresh_score(f)["arithmetic"])),
                      cn)
            g = copy.deepcopy(f)
            tp = g["record"]["program"]["total_units"]
            g["record"]["program"]["total_units"] = {"min": tp["min"] + 1, "max": tp["max"] + 1}
            tally("the printed total one unit off", passing_score(g) is None, cn)
            continue
        if not gap_noted(f):
            continue
        e = REVIEWED[cn]
        if not e.get("rule"):
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
        # The kind's own reading moved: the printed total one unit off on the page's record, so the reading no longer
        # closes it (an open list's figure printed instead).
        g = copy.deepcopy(f)
        if e.get("open"):
            for b in g["record"]["blocks"]:
                if b.get("name") == e["open"]:
                    b["minimum"] = 1
            tally("the open list printing a figure", not kind_closes(g, e), cn)
        elif e.get("depends"):
            g["score"]["arithmetic"]["computed"] = list(g["score"]["arithmetic"]["stated"])
            tally("the sum at the printed total", not kind_closes(g, e), cn)
        elif not e.get("rule"):
            tp = g["record"]["program"]["total_units"]
            g["record"]["program"]["total_units"] = {"min": tp["min"] + 1, "max": tp["max"] + 1}
            tally("the reading against a total one unit off", not kind_closes(g, e), cn)
    return {"counts": dict(out), "wrong": wrong}


def plan(write: bool, census_path: str = CENSUS) -> dict:
    rows, held, hits = [], [], []
    src = _sources()
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
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
            # Today's arithmetic where the rescore is exact; else the filed one (33390 keeps S529's floor rescore).
            score["arithmetic"] = todays(f) or f["score"]["arithmetic"]
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


def md5_pre_read(rows: list[dict]) -> str:
    """F.md5_pre_read, its query sent to the local Postgres on stdin (the s730a module's form)."""
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
    pr, cc, bd = precision(), claim_checks(), boundaries()
    print("precision: %s" % json.dumps(pr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"]:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s731_lbcc_%s_%s.json" % (day, a.tag))
    gaps = sorted(g for g in by if g != PASSES)
    body = {"rule": NG.RULING + "; S731: Long Beach City's 16 wording-rule records, passed by a rescore where today's "
                                "scorer's one reading moves them, else collected with their gaps named where one is "
                                "honest (no reread, no reconcile)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "run": "45586922147", "levers": list(LEVERS),
                       "person": list(PERSON), "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in gaps}, "moved": len(rows), "by": by,
            "precision": pr, "claim_checks": cc, "boundaries": bd, "held": res["held"],
            "live_run_proof": {"read_at": READ_AT, "how": "GitHub API list_commits by path on main",
                               "load_commits": LOAD_COMMITS, "file_history": FILE_HISTORY, "keeps_run": KEEPS_RUN},
            "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score (a passing "
                              "row: checks.arithmetic to equal); checks.coverage, invented and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found, and a course an entry says the printed total leaves out on neither it nor "
                                  "the state's list. The capture keeps no page text, so a note's quoted figures are "
                                  "the reader's words, never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Long Beach City (%d rows: %s). Each row's checks become the college\n"
           "-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or\n"
           "-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: %s\n"
           "-- (before_image per row).\n" % (a.tag.upper(), len(rows),
                                             ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
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
