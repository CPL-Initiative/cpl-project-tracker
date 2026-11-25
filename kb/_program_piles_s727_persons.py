#!/usr/bin/env python3
"""S727, lane 2: the records earlier sessions held "for a person", collected with each gap named (plan s727f).

Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores. Collection first (Sam, 2026-11-20, r-collection-first-sam-2026-11-20). COBIx's brief of
2026-11-25: a record held "for a person" is collected with its gap named and a lower confidence on the 0-100 bar; where
the hold needs a decision only the college can make, the gap says what the page leaves open.

THE NINETEEN KEYS (HAND below, each a hand reading of the record's own notes and its earlier hold), at twelve colleges:

  UPDATE, a live row's checks take the named gap (the guarded UPDATE of S721's plans; no record changes), 5 rows:
    De Anza 45499            unit_line_not_read (40): a 180-unit bachelor's; the record holds the 60 upper-division
                             units ('Major Required: 60 Credits'), and the page prints its lower division as lines of
                             units (90 meeting associate degree requirements, 30 more) with no course named:
                             60 + 90 + 30 is the printed 180.
    Santa Monica 10345       noted_no_total (40): "No major total or degree total is printed for this award".
    Santa Monica 43765       lists_not_closed (30): the Salon Experience list prints 'Any combination of Salon classes
                             is acceptable' and no figure; COSM 11C printed for COSM 64 stays in its note.
    Clovis 33501             lists_not_closed (30): 'List A and List B courses total a minimum of 6 units', and the
                             gap names its MATH 17 note too (with List B read it is 25 or 28 against 23, and closes
                             only with MATH 17 counted once).
    Contra Costa 01417       entry_path_range (new, 50; GE capped at 50 on the None/N/A summary): the page's 'Min/Max
                             Units - Major 24.3 / 48.9' spans two entry paths; the record holds the full path, which
                             matches the printed top. Which path a student takes is the college's admission.

  NAMED GAP, NO RECORD (kb/program_requirements_college/<slug>/named_gaps_s727.json; no row, no write),
  no_own_page_found: West Los Angeles 46261, Napa Valley 19126, 31158, 36528, Los Angeles Harbor 44947, Ventura 45355
  (S456's older_build_removed plan deleted its live row).

  ALREADY COLLECTED, no write: West Los Angeles 38677 (passes; its load inserted it).

  HELD (7): Santa Monica 03281 and Glendale 44488 (coverage or invented fails, so no gap collects them); Clovis 36326
  (the own-page guard); Clovis 39539 and East Los Angeles 33013 (their earlier reasons stand: the catalog's own
  figures); Los Angeles City 32832 (a failing live row with no record file); Cerritos 44984 (an unequal live row; both
  committed reads pass: a reload).

STANDING GUARDS: scorer_passes (a record today's scorer passes is never gap-filed); on_live_run (the committed record's
run is its live row's, by the committed receipts); the own-page guard keyed on the pages each record was read from
(sources.json and capture.json's shared_pages by source_url, never a capture page number); the claim check (each
course an entry names is among today's capture's codes, and a page a note says the read lacked is not among the
capture's pages). THE SELF-RECALL: HAND; boundaries: the note's words gone, the stated total one unit off, coverage
failing, each entry's own figures moved, and the new kinds' shapes broken.

    python3 kb/_program_piles_s727_persons.py --dry-run
    python3 kb/_program_piles_s727_persons.py --tag s727f

Guard: tests/program_piles_s727_persons_test.py.
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
TAG = "s727f"
COLLEGES = {
    "De Anza College": "de_anza", "Santa Monica College": "santa_monica",
    "Glendale Community College": "glendale_community", "Clovis Community College": "clovis_community",
    "East Los Angeles College": "east_los_angeles", "Cerritos College": "cerritos",
    "Contra Costa College": "contra_costa", "West Los Angeles College": "west_los_angeles",
    "Napa Valley College": "napa_valley", "Los Angeles Harbor College": "los_angeles_harbor",
    "Los Angeles City College": "los_angeles_city", "Ventura College": "ventura",
}
KEYS = (
    ("De Anza College", "45499"), ("Santa Monica College", "03281"), ("Santa Monica College", "10345"),
    ("Santa Monica College", "43765"), ("Glendale Community College", "44488"),
    ("Clovis Community College", "33501"), ("Clovis Community College", "36326"),
    ("Clovis Community College", "39539"), ("East Los Angeles College", "33013"), ("Cerritos College", "44984"),
    ("Contra Costa College", "01417"), ("West Los Angeles College", "46261"), ("West Los Angeles College", "38677"),
    ("Napa Valley College", "19126"), ("Napa Valley College", "31158"), ("Napa Valley College", "36528"),
    ("Los Angeles Harbor College", "44947"), ("Los Angeles City College", "32832"), ("Ventura College", "45355"),
)
HELD_DIR = "held_for_person"

REVIEWED = {
    ("De Anza College", "45499"): {
        "gap": "unit_line_not_read", "computed": [60, 60], "stated": [180, 180],
        "words": "General B.S. requirements also describe 60 upper-division units, 90 lower-division units meeting "
                 "associate degree requirements, and 30 additional lower-division units",
        "major": {"words": "The catalog prints 'Major Required: 60 Credits'", "units": 60, "upper": 60,
                  "lower": [90, 30]}},
    ("Santa Monica College", "10345"): {
        "gap": "noted_no_total", "computed": [39.5, 39.5], "stated": None,
        "words": "No major total or degree total is printed for this award",
        "own_section": "appears to belong to the preceding generic ADN section"},
    ("Santa Monica College", "43765"): {
        "gap": "lists_not_closed", "computed": [25.5, 25.5], "stated": [26.5, 26.5],
        "words": "Salon Experience Courses: the catalog says 'Any combination of Salon classes is acceptable' and "
                 "states no minimum units",
        "open": "Salon Experience Courses"},
    ("Clovis Community College", "33501"): {
        "gap": "lists_not_closed", "computed": [24, 24], "stated": [23, 23],
        "words": "List B minimum is a combined rule: List A and List B courses must total a minimum of 6 units",
        "open": "LIST B: Select additional courses/ units so that List A and List B courses total a minimum of 6 units.",
        # The second reader, round 1: with List B read the sum is still 25 or 28 against 23, and it closes only with
        # MATH 17 counted once; the gap names that note too.
        "also_words": "MATH 17 is printed both in Required Core Courses and as the only course in List A"},
    ("Clovis Community College", "36326"): {
        "gap": "lists_not_closed", "computed": [14, 20], "stated": [18, 21],
        "words": "List B also allows 'Any course from List A not already used' (3 units).",
        "also_takes": ["List B: Select two course (6 units)", "List A: Select two to three courses"]},
    ("Contra Costa College", "01417"): {
        "gap": "entry_path_range", "computed": [48.9, 48.9], "stated": [24.3, 48.9],
        "words": "LVN/LPN to RN transition students enter the second year and enroll in NURS-255 and NURS-256 only",
        "range": "This explains the major range of 24.3 / 48.9 units printed in the Unit Summary"},
}

# Programs with no live row whose record places none of its courses (or, for 32832, with no committed record): a named
# gap with no record, filed in named_gaps_s727.json. reason is a key of NAMED_REASONS; note states only what the
# committed files print.
NAMED_REASONS = {
    "no_own_page_found": ("The capture found no page that prints the program's own section: the page it read prints "
                          "a generic or another program's heading, and its read places none of the state's listed "
                          "courses. Which page holds the program, or whether the catalog prints it, is the college's "
                          "to say."),
}
NAMED = {
    ("West Los Angeles College", "46261"): {
        "reason": "no_own_page_found", "title": "Spanish for the Workplace Fundamentals", "award": "Noncredit program",
        "note": "The re-read 44883863572 took PDF p.266, whose heading is 'NONCREDIT PROGRAMS & COURSES', and placed "
                "0 of the 2 listed courses; no committed file shows p.266 is the program's own."},
    ("Napa Valley College", "19126"): {
        "reason": "no_own_page_found", "title": "Studio Arts-Painting and Drawing Emphasis", "award": "A.A. Degree",
        "note": "The re-read 44739981651 took the catalog's C-ID page (getting-your-degree/c-id/), whose heading "
                "names no program, and placed 0 of the 13 listed courses."},
    ("Napa Valley College", "31158"): {
        "reason": "no_own_page_found", "title": "911 Dispatcher",
        "award": "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units",
        "note": "The re-read 44739981651 took the Law Enforcement-Administration of Justice certificate's page, "
                "and placed 0 of the 5 listed courses."},
    ("Napa Valley College", "36528"): {
        "reason": "no_own_page_found", "title": "Dance", "award": "A.A. Degree",
        "note": "The re-read 44739981651 took the general education page (getting-your-degree/), whose heading is "
                "'2. HEALTH, WELLNESS AND SELF DEVLOPMENT', and placed 0 of the 15 listed courses."},
    ("Los Angeles Harbor College", "44947"): {
        "reason": "no_own_page_found",
        "title": "California General Education Transfer Curriculum (Cal-GETC)",
        "award": "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units",
        "note": "The re-read 44687664966 took PDF p.119, which prints no heading, and placed 0 of the 195 listed "
                "courses."},
    ("Ventura College", "45355"): {
        "reason": "no_own_page_found",
        "title": "California General Education Transfer Curriculum (Cal-GETC)",
        "award": "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units",
        "note": "The re-read 44514835321 took the catalog's C-ID page (transfer-information/c-id/), and placed 0 of "
                "the 240 listed courses. S456's older_build_removed plan deleted the live row the load 38842159685 "
                "had inserted at run 38756014587, so no live row holds it.",
        "deleted_by": "program_requirement_records_older_build_removed_2026-10-23_s456.sql"},
}

_HELD_CI = ("held: a gap collects only where coverage and invented pass (collected_with_gaps, "
            "kb/_harvest_gap_census.py); %s")
HAND = {k: e["gap"] for k, e in REVIEWED.items() if k != ("Clovis Community College", "36326")}
_RELOAD = "a reload of a passing committed read"
HAND.update({k: "named: " + e["reason"] for k, e in NAMED.items()})
HAND.update({
    ("Santa Monica College", "03281"): _HELD_CI % (
        "coverage places 12 of 27 and invented fails on the catalog's 'NURSING 6/6L/7/7L' misprints and "
        "NURSNG 19, and its note says the Registered Nursing section's start is on the preceding page; its lever is "
        "a misprint alias and a read of page 174"),
    ("Glendale Community College", "44488"): _HELD_CI % (
        "invented fails on ESL 156 (not in the state's file) and MATH 102+, the page's 'MATH 102/102+' row against "
        "the file's one MATH 102 row titled 'Trigonometry with Support'; which course that row names is the "
        "college's to say in COCI, and the arithmetic already passes"),
    ("Cerritos College", "44984"): ("held: the live row holds run 37961137169 and its arithmetic is unequal (the "
                                    "conductor's live read); both committed reads pass (records/ at 38064252862 "
                                    "and held_for_person/ at 44540824017), so no gap is honest: its lever is %s"
                                    % _RELOAD),
    ("Los Angeles City College", "32832"): ("held: a live row holds run 39006380342 and fails (incomplete, the "
                                            "conductor's live read); the reconcile 44511401763 dropped its record "
                                            "file and today's capture finds no page (method not_found), so no image "
                                            "of its record can be built here"),
    ("Clovis Community College", "39539"): ("held (S713c's reason): the prerequisite list adds to 22-23 against "
                                            "its printed 26-27 and Year 1 Fall to 12 against 11; with the "
                                            "prerequisites at 26-27 it still reads 70.5-71.5 against 69.5-70.5. "
                                            "Its note names a missing heading, not missing requirements, so no "
                                            "cut-off kind is honest: the catalog's own figures, for a reread"),
    ("East Los Angeles College", "33013"): ("held (S720e's reason): the page's figures (9-10, 3, 6, 3-4) add to "
                                            "21-23 under 'TOTAL UNITS FOR MAJOR: 22-24', and with the 9-10 pool on "
                                            "one block the record still reads 21-24 against 22-24, so neither the "
                                            "pool kind nor a figures kind's sentence holds"),
    ("West Los Angeles College", "38677"): ("collected: it passes, and the load 44545925357 inserted it (its two "
                                            "runs name none per key; the record's 44475503054 is the run that "
                                            "read it new)"),
    ("Clovis Community College", "36326"): ("held: the own-page guard: capture.json's shared_pages lists 44475 on "
                                            "the page it was read from, and no note names its own section; "
                                            "lists_not_closed (List B also takes 'Any course from List A not "
                                            "already used') stands once a read names it"),
})
ALREADY = {("West Los Angeles College", "38677")}


def _dir(college: str) -> str:
    return os.path.join(NG.COLLEGE_DIR, COLLEGES[college])


def _path(college: str, cn: str) -> str:
    return os.path.join(_dir(college), "records", cn + ".json")


def _held_path(college: str, cn: str) -> str:
    return os.path.join(_dir(college), HELD_DIR, cn + ".json")


def _load(college: str, cn: str) -> dict | None:
    for p in (_path(college, cn), _held_path(college, cn)):
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


def _units(b: dict) -> float | None:
    u = [S._num(c.get("units")) for c in b.get("courses") or []]
    return None if not u or any(x is None for x in u) else sum(u)


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text): such a record is
    rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


def list_open(filed: dict, e: dict) -> bool:
    """lists_not_closed's figures: the named list is one choose-units list that prints no figure of its own."""
    bs = _blocks(filed, e["open"])
    return len(bs) == 1 and bs[0].get("rule") == "choose_units" and S._span(bs[0].get("stated")) is None


def also_takes(filed: dict, e: dict) -> bool:
    """lists_not_closed's other form: the named list exists once, and the list it also takes from exists once."""
    return all(len(_blocks(filed, name)) == 1 for name in e["also_takes"])


def lower_lines_close(filed: dict, e: dict) -> bool:
    """unit_line_not_read's figures on a bachelor's degree: the blocks add to the printed major figure, which is the
    upper division's, and the upper division plus the lower division's printed lines (90 and 30) is the printed
    degree total (60 + 90 + 30 = 180)."""
    m = e["major"]
    rec = filed.get("record") or {}
    prog = rec.get("program") or {}
    if "bachelor" not in str(filed.get("award") or "").lower() and "baccalaureate" not in \
            str(filed.get("award") or "").lower():
        return False
    if not any(m["words"] in n for n in _notes(filed)):
        return False
    sums = [_units(b) for b in rec.get("blocks") or []]
    if not sums or any(s is None for s in sums) or abs(sum(sums) - m["units"]) > NG.FIG_EPS:
        return False
    dt = S._span(prog.get("degree_total"))
    return bool(dt) and abs(m["upper"] + sum(m["lower"]) - dt[0]) <= NG.FIG_EPS and dt[0] == dt[1]


def entry_path_range(filed: dict, e: dict) -> bool:
    """entry_path_range's figures: the record's sum is the printed range's top at both ends, the printed low end is
    below it, and a note says the range is the entry paths'."""
    comp, st = _pair(e["computed"]), _pair(e["stated"])
    return (abs(comp[0] - st[1]) <= NG.FIG_EPS and abs(comp[1] - st[1]) <= NG.FIG_EPS and st[0] < st[1] - NG.FIG_EPS
            and any(e["range"] in n for n in _notes(filed)))


def shared_with(college: str, cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the page the record was read from: keyed on the
    record's own source_url in sources.json, never on a capture page number."""
    src = _sources(college).get(cn) or {}
    url = (src.get("source") or {}).get("url")
    with open(os.path.join(_dir(college), "capture.json"), encoding="utf-8") as fh:
        sp = json.load(fh).get("shared_pages") or {}
    out = set()
    for page, members in sp.items():
        ms = [str(x) for x in members]
        if cn in ms and (url is None or page == url):
            out |= {m for m in ms if m != cn}
    return sorted(out)


_POSTED: dict = {}


def _returned_rows(obj) -> bool:
    """The migrate response wrote rows: a guarded statement's 'returned' count above 0 at any depth."""
    if isinstance(obj, list):
        return any(_returned_rows(x) for x in obj)
    if not isinstance(obj, dict):
        return False
    r = obj.get("returned")
    if isinstance(r, bool):
        return False
    if isinstance(r, (int, float)):
        return r > 0
    return any(_returned_rows(v) for v in obj.values() if isinstance(v, (dict, list)))


def plan_applied(tag: str) -> bool:
    """A plan's rows reached the live table: a migrate receipt of its apply answered 2xx with rows written, and no
    receipt of its rollback did."""
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


def posted_runs(college: str, skip: tuple = ()) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load,
    a reread, an applied guarded plan's records, and a committed live read (S727 at Canyons' reading)."""
    if not skip and college in _POSTED:
        return _POSTED[college]
    slug = COLLEGES[college]
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
        if name.startswith("program_requirement_records_college_reread_%s_" % slug):
            for k in (d.get("replaced_keys") or []) + (d.get("carried_keys") or []):
                out.setdefault(str(k), []).append((at, str(d.get("extracted_run"))))
        elif name.startswith("program_requirement_records_college_%s_" % slug) and \
                name[len("program_requirement_records_college_%s_" % slug):-5].isdigit():
            runs = [str(r) for r in d.get("extracted_runs") or []]
            for k in d.get("inserted_keys") or []:
                if len(runs) == 1:
                    out.setdefault(str(k), []).append((at, runs[0]))
        else:
            tag = name[:-len(".json")].rsplit("_", 1)[-1]
            if tag in skip or not plan_applied(tag):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == college and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    for path in glob.glob(os.path.join(NG.RECEIPTS, "program_requirements_reread_*_checked.json")):
        try:
            with open(path, encoding="utf-8") as fh:
                d = json.load(fh)
        except (OSError, ValueError):
            continue
        live = ((d.get("live_runs") or {}) if isinstance(d, dict) else {}).get(college) or {}
        at = str(d.get("read_at") or "")
        if at:
            for k, run in live.items():
                out.setdefault(str(k), []).append((at, str(run)))
    if not skip:
        _POSTED[college] = out
    return out


def on_live_run(filed: dict, skip: tuple = ()) -> bool:
    """The committed record's run is the run the latest committed receipt posted for the row."""
    rows = posted_runs(filed.get("college"), skip).get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


def gap_noted(filed: dict, reviewed: dict | None = None) -> tuple[str, str] | None:
    """(gap, words) where a reviewed entry stands on the record as it is filed; else None."""
    key = (filed.get("college"), str(filed.get("control_number")))
    e = (REVIEWED if reviewed is None else reviewed).get(key)
    if not e or filed.get("college") not in COLLEGES:
        return None
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    words = next((n for n in _notes(filed) if e["words"] in n), None)
    if not words or not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
        return None
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None
    if scorer_passes(filed) or not on_live_run(filed):
        return None
    if e.get("open") and not list_open(filed, e):
        return None
    if e.get("also_takes") and not also_takes(filed, e):
        return None
    if e.get("major") and not lower_lines_close(filed, e):
        return None
    if e.get("range") and not entry_path_range(filed, e):
        return None
    if e.get("also_words"):
        more = next((n for n in _notes(filed) if e["also_words"] in n), None)
        if not more:
            return None
        words = words + " " + more
    return e["gap"], words


def _sources(college: str) -> dict:
    with open(os.path.join(_dir(college), "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def claim(filed: dict, src: dict | None = None) -> str:
    college, cn = filed.get("college"), str(filed.get("control_number"))
    e = REVIEWED.get((college, cn))
    s = (_sources(college) if src is None else src).get(cn)
    if not e or not s:
        return "no capture"
    if shared_with(college, cn) and not any(e.get("own_section") and e["own_section"] in n for n in _notes(filed)):
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


def named_stands(college: str, cn: str) -> str:
    """A named gap with no record stands where no live row holds the key (a posted row a committed delete removed
    counts as none) and the committed record places none of its courses."""
    e = NAMED.get((college, cn))
    if not e:
        return "not named"
    f = _load(college, cn)
    if f is None:
        return "no record file"
    if os.path.isfile(_path(college, cn)):
        return "a record file in records/"
    if posted_runs(college).get(cn):
        d = e.get("deleted_by")
        if not d or not os.path.isfile(os.path.join(NG.RECEIPTS, d)):
            return "a live row is posted"
        with open(os.path.join(NG.RECEIPTS, d), encoding="utf-8") as fh:
            if "(%s, '%s'," % (_lit(college), cn) not in fh.read():
                return "a live row is posted"
    share = ((f.get("score") or {}).get("coverage") or {}).get("share")
    return "stands" if share in (0, 0.0) else "the record places courses"


def _lit(v: str) -> str:
    return "'" + str(v).replace("'", "''") + "'"


def precision() -> dict:
    out = {"read": 0, "right": 0, "wrong": [], "by_answer": collections.Counter()}
    for college, cn in KEYS:
        truth = HAND[(college, cn)]
        truth = "none" if truth.startswith(("held", "collected")) else truth
        out["read"] += 1
        out["by_answer"][truth] += 1
        if (college, cn) in NAMED:
            got = "named: " + NAMED[(college, cn)]["reason"] if named_stands(college, cn) == "stands" else "none"
        else:
            f = _load(college, cn)
            got = "none" if f is None else outcome(f)[0]
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"].append([college, cn, truth, got])
    out["by_answer"] = dict(out["by_answer"])
    return out


def _with(key, entry) -> dict:
    out = dict(REVIEWED)
    out[key] = entry
    return out


def boundaries() -> dict:
    out, wrong = collections.Counter(), []

    def tally(name, ok, key):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([key[0], key[1], name])

    for key, e in REVIEWED.items():
        f = _load(*key)
        if f is None or not gap_noted(f):
            continue
        g = copy.deepcopy(f)
        g["record"]["notes"] = [str(n).replace(e["words"], "") for n in g["record"].get("notes") or []]
        tally("the note's words gone", gap_noted(g) is None, key)
        g = copy.deepcopy(f)
        a = g["score"]["arithmetic"]
        a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1] if a.get("stated") is not None else [1.0, 1.0]
        tally("the stated total one unit off", gap_noted(g) is None, key)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        tally("coverage failing", gap_noted(g) is None, key)
        g = copy.deepcopy(f)
        g["college"] = "Another College"
        tally("another college", gap_noted(g) is None, key)
        if e.get("open"):
            g = copy.deepcopy(f)
            for b in g["record"]["blocks"]:
                if b.get("name") == e["open"]:
                    b["stated"] = {"min": 1, "max": 1}
            tally("the open list prints a figure", gap_noted(g) is None, key)
        if e.get("also_takes"):
            moved = dict(e, also_takes=[e["also_takes"][0], "List Z"])
            tally("the other list gone", gap_noted(f, _with(key, moved)) is None, key)
        if e.get("also_words"):
            g = copy.deepcopy(f)
            g["record"]["notes"] = [str(n).replace(e["also_words"], "") for n in g["record"].get("notes") or []]
            tally("the second note gone", gap_noted(g) is None, key)
        if e.get("major"):
            moved = dict(e, major=dict(e["major"], units=e["major"]["units"] + 1))
            tally("the major one unit off", gap_noted(f, _with(key, moved)) is None, key)
            moved = dict(e, major=dict(e["major"], lower=[90]))
            tally("the lower division short", gap_noted(f, _with(key, moved)) is None, key)
            g = copy.deepcopy(f)
            g["award"] = "A.S. Degree"
            tally("not a bachelor's", gap_noted(g) is None, key)
        if e.get("range"):
            moved = dict(e, computed=[e["stated"][0], e["stated"][1]])
            tally("the sum spans the range", gap_noted(f, _with(key, moved)) is None, key)
            moved = dict(e, range="the range is a misprint")
            tally("no note names the paths", gap_noted(f, _with(key, moved)) is None, key)
    for key in NAMED:
        f = _load(*key)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], share=0.5)
        real = _load
        globals()["_load"] = lambda c, n, g=g, key=key: g if (c, n) == key else real(c, n)
        try:
            tally("the record places a course", named_stands(*key) != "stands", key)
        finally:
            globals()["_load"] = real
    return {"counts": dict(out), "wrong": wrong}


def _image_keys(img: dict) -> dict:
    return {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url", "measure", "total_min",
                                "total_max", "record", "checks", "extracted_run")}


def plan(write: bool) -> dict:
    """UPDATE rows only: a live row's checks to the load's image of its committed record with the gap."""
    rows, held = [], []
    hits = []
    images = NG._load_images({c for c, _ in REVIEWED})
    for key in REVIEWED:
        college, cn = key
        f = _load(college, cn)
        if f is None or not os.path.isfile(_path(college, cn)):
            held.append({"college": college, "control_number": cn, "why": "no record file in records/"})
            continue
        if S.passes_live(f.get("score")) or (f.get("score") or {}).get("gaps"):
            continue
        src = _sources(college)
        gap, words, c = outcome(f, src)
        if gap == "none":
            held.append({"college": college, "control_number": cn, "why": HAND[key], "claim": c})
            continue
        img = images.get(key)
        if img is None or F.row_passes(img["checks"]):
            held.append({"college": college, "control_number": cn, "why": "the load leaves it out, or its image passes"})
            continue
        with open(os.path.join(_dir(college), "capture.json"), encoding="utf-8") as fh:
            year = json.load(fh).get("catalog_year")
        e = src.get(cn) or {}
        score = copy.deepcopy(f["score"])
        score["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": words}]
        score["confidence"] = NG.confidence(dict(f, score=score), gap, e.get("method"),
                                            (e.get("catalog_year") or year) == year)
        hits.append((key, f, score, gap, words, img))
    for key, f, score, gap, words, img in hits:
        college, cn = key
        row = {"college": college, "control_number": cn, "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": gap, "words": words,
               "confidence": score["confidence"], "path": os.path.relpath(_path(college, cn), ROOT),
               "write": "update"}
        if write:
            row["before_image"] = _image_keys(img)
            with open(_path(college, cn), "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=score), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    if write and rows:
        after = NG._load_images({r["college"] for r in rows})
        for r in rows:
            img = after.get((r["college"], r["control_number"]))
            if img is None or (img["checks"].get("gaps") or []) != [r["moves_to"]]:
                raise SystemExit("%s: the load leaves it out, or its image does not carry the gap" % r["control_number"])
            if img["record"] != r["before_image"]["record"]:
                raise SystemExit("%s: the record changed" % r["control_number"])
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def named_file(college: str, written: str) -> dict:
    slug = COLLEGES[college]
    progs = []
    for (c, cn), e in sorted(NAMED.items()):
        if c != college:
            continue
        progs.append({"control_number": cn, "title": e["title"], "award": e["award"], "reason": e["reason"],
                      "note": e["note"]})
    with open(os.path.join(_dir(college), "capture.json"), encoding="utf-8") as fh:
        cap = json.load(fh)
    reasons = sorted({p["reason"] for p in progs})
    return {"_readme": ("S727 (plan s727f, lane 2): %d program(s) of %s held for a person, collected as named gaps "
                        "with no record (COBIx's brief of 2026-11-25 on Sam's collect-with-gaps ruling). Each has no "
                        "live row and a record that places none of its courses, or no record at all, so no load "
                        "posts it; the reason names what the page leaves open. No model call, no Supabase write. "
                        "Built by kb/_program_piles_s727_persons.py." % (len(progs), college)),
            "college": college, "written": written, "capture": str(cap.get("run") or cap.get("capture_run") or ""),
            "page_reads": [], "reasons": {r: NAMED_REASONS[r] for r in reasons}, "programs": progs, "_slug": slug}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default=TAG)
    a = ap.parse_args(argv)
    pr, bd = precision(), boundaries()
    print("precision: %s" % json.dumps(pr))
    print("boundaries: %s" % json.dumps(bd))
    if pr["wrong"] or bd["wrong"]:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d; named %d" % (len(res["rows"]), by, len(res["held"]), len(NAMED)))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    at = time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp)
    named_paths = []
    for college in sorted({c for c, _ in NAMED}):
        body = named_file(college, at)
        body.pop("_slug")
        p = os.path.join(_dir(college), "named_gaps_s727.json")
        with open(p, "w", encoding="utf-8") as fh:
            json.dump(body, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        named_paths.append(os.path.relpath(p, ROOT))
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s727_persons_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S727: the records held for a person, collected with each gap named (COBIx's brief "
                                "of 2026-11-25)",
            "at": at, "colleges": sorted(COLLEGES), "keys": [list(k) for k in KEYS],
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by, "updates": len(rows),
            "inserts": 0, "precision": pr, "boundaries": bd, "held": res["held"], "records": rows,
            "hand": {"%s %s" % k: v for k, v in HAND.items()},
            "named": {"files": named_paths, "programs": {"%s %s" % k: v["reason"] for k, v in NAMED.items()}},
            "for_a_person": {
                "Contra Costa College 01417": "which entry path the record counts is the college's admission rule",
                "Santa Monica College 43765": "'COSM 11C, Salon Management (2)' in Level 4, likely COSM 64",
                "Clovis Community College 33501": "MATH 17 printed in the core and as List A's one course"},
            "representation": "UPDATE rows: checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2: the records held for a person, collected with each gap named (%d rows: %s). Each row's\n"
           "-- checks become the college load's image of its committed record: checks.gaps and checks.confidence\n"
           "-- added; the record unchanged. Receipt: %s (before_image and after_image per row).\n"
           % (a.tag.upper(), len(rows), ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    parts = {
        "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text\n"
                            "-- (the full before-values are in ..._preread.sql).\n" + body["pre_read_md5"]),
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE, one statement: only where the row holds the filed run, the before-image's\n"
                      "-- record and checks, and no person's check. It aborts, writing nothing, unless it matches the\n"
                      "-- plan's %d rows less those a person checked (listed as skipped_checked), or a row holds a\n"
                      "-- matching confirm.\n" % len(rows) + body["apply"]),
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


def md5_pre_read(rows: list[dict]) -> str:
    """F.md5_pre_read, its query sent to the local Postgres on stdin (as Palo Verde's and Canyons')."""
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


if __name__ == "__main__":
    sys.exit(main())
