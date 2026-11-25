#!/usr/bin/env python3
"""S730, lane 2's cheap piles at Los Angeles Trade-Technical: the census's 17 wording-rule records, 6 collected with gaps named.

The census on main (kb/status/harvest_gap_census.json, run 45586922147, written 2026-11-25 09:39Z) lists 17 Los
Angeles Trade-Technical College records under the reconcile_steps lever ("a team session writes correction rules from
the catalog's own wording, then rescores the saved record"), the same 17 the 07:13Z census listed. Sam's ruling
(2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps noted and
confidence scores, a gap noted instead of a reread. The college carries no reconcile steps
(kb/program_requirements_reconcile.json names no Los Angeles Trade-Technical entry), and its capture (run 44475507447)
keeps no page text, so no rule from the committed files passes one without changing its record: each record takes a
named gap where one is honest, or holds by key with its reason. None needs a scorer change, and none is restamped: no
reconcile runs here, and every other record of the college stays as main holds it.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes), with the standing guards: scorer_passes
(a record today's scorer passes is never gap-filed), on_live_run (the committed record's run is its live row's), the
record-rule guard (a row kb/_program_named_gaps.py's record rules name under another kind is refused), and the
own-page guard keyed on the pages the records were read from (sources.json's source.url and each record's source_url,
never capture.json's shared_pages; p-own-page-guard-reads-read-pages-s727): a record read from a PDF page another
program was read from stands only where a note of its own names its own section. The kinds, all existing:

  noted_figures_differ   (40) the notes quote the page's printed total and the printed units that do not add to it:
                         Carpentry - Construction Technologies 08479 (the degree) and 21849 (the certificate, which
                         takes the degree's lists), the required courses printed at 43 against the 40 the text states,
                         so 51 against the printed 48; Graphic Design 44344, the courses printed at 24 against 'Major
                         Units: 23' (VISCOM 100 at 3 units as printed, 2 on the state's file).
  noted_section_cut_off  (20) Fashion Design 02925: the text begins mid-section on page 179, and the A.A.'s heading and
                         any 'Major Units' line sit on page 178, which the read did not hold; Fashion Merchandising
                         21867: the certificate takes the degree's list, whose Semesters I and II sit on page 182, which
                         the read did not hold (21 against the printed 38). Course-list match is capped at 50.
  lists_not_closed       (30) Electrical Lineman 08482: the 'Elective(s)' list (ELECLNM 709, ELECLNM 175) prints no
                         number of courses or units, so the lists alone cannot add the program's units.

Held (11), each reason in HAND: 02911, 21855, 31090, 31280 and 41150 (today's scorer passes the arithmetic, and the
coverage and invented checks fail on a catalog misprint of a subject: PLUMBING 028, BLDGTCQ, DIGMD; a rename or prefix
alias is their lever); 31089 (coverage and invented fail on the same misprints before its arithmetic is read); 41011
(coverage fails on VOC ED 454 and 455 printed without CE and VOC ED 460 for the file's 463: a renumber is its lever);
45285 (coverage fails: its text holds only page 65, the Cal-GETC pattern's Areas 4 to 6; a page pin is its lever);
18857 (a cheaper lever passes it: the pooled reading reads its note's 'Complete 18 units' over the three lists once it
reads 'with a minimum of 3 units from each', and today's scorer then passes it at 18 = 18); 38737 (a cheaper lever
passes it: the page's table row for its own state code prints 11, which its note took as another program's line; a
fill from that row passes it at 11 = 11); 37706 (the own-page guard: page 200 is shared with Pre-Health Professions I,
38452, and no note names its own section).

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found, and a page a note says the read lacked is not among the capture's pages. THE
SELF-RECALL: HAND is the hand reading of the 17; precision runs the rules and the claim check over each; boundary
readings: the note's words gone, the stated total one unit off, coverage failing, the own-section words gone on a
shared page, a cut-off's sum at its stated total, and the open list read as required. ON_LEVER's readings are run on
each lever hold: the lever passes it, and today's scorer does not.

    python3 kb/_program_piles_s730_lattc.py --dry-run
    python3 kb/_program_piles_s730_lattc.py --tag s730a

Guard: tests/program_piles_s730_lattc_test.py.
"""
from __future__ import annotations

import argparse
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
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "Los Angeles Trade Technical College"
SLUG = "los_angeles_trade_technical"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()
TAG = "s730a"

_FIGS = {"gap": "noted_figures_differ"}
_CUT = {"gap": "noted_section_cut_off", "cut": True}
REVIEWED = {
    "08479": dict(_FIGS, computed=[51, 51], stated=[48, 48],
                  words="The required courses printed sum to 43 units (including CRPNTRY 401 at 9 units), while the "
                        "text says 40 units of Required Courses",
                  own_section="this record reads the A.A. section"),
    "21849": dict(_FIGS, computed=[51, 51], stated=[48, 48],
                  words="The required courses printed sum to 43 units (including CRPNTRY 401 at 9 units), not the "
                        "stated 40",
                  own_section="the blocks are read from that A.A. section"),
    "44344": dict(_FIGS, computed=[24, 24], stated=[23, 23],
                  words="Printed course units sum to 24, but the catalog states Major Units: 23",
                  courses=["VISCOM100"],
                  own_section="No careers are named in this program's section; the career fields on page 185 belong "
                              "to the Graphic Design Fundamentals program"),
    "02925": dict(_CUT, computed=[48, 48], stated=None,
                  words="The excerpt begins mid-section on page 179", not_page=178,
                  own_section="the A.A. text states 46 units of Required Courses plus 2 units of Major Electives"),
    "21867": dict(_CUT, computed=[21, 21], stated=[38, 38],
                  words="Semesters I and II of the degree list are on the previous page and not in the text",
                  not_page=182),
    "08482": {"gap": "lists_not_closed", "computed": [24, 24], "stated": [24, 24],
              "words": "the 'Elective(s)' list (ELECLNM 709, ELECLNM 175) gives no number of courses or units "
                       "required",
              "open": "Elective(s)"},
}
_ALIAS = ("held: today's scorer passes its arithmetic (scorer_passes), so it is never gap-filed; coverage and invented "
          "fail on %s: a rename or prefix alias that places those courses is its lever")
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "02911": _ALIAS % "'PLUMBING 028' printed for PLUMBNG 28, and PLUMBNG 145 and 246 not in the state's file",
    "21855": _ALIAS % ("'PLUMBING 028' printed for PLUMBNG 28 (the degree 02911's lists, page 144), and PLUMBNG 145 "
                       "and 246 not in the state's file"),
    "31090": _ALIAS % "'PLUMBING 028' printed for PLUMBNG 28; MATH 115 and BLDGCTQ 8 not in the state's file",
    "31280": _ALIAS % ("BLDGTCQ 014 printed for BLDGCTQ, 'Plumbing 028' for PLUMBNG 28, and REF A/C 100, 110 and 165 "
                       "not placed"),
    "41150": _ALIAS % ("DIGMD 100, 101 and 104 printed for the state file's DIGLMD (three courses of one number and "
                       "title under one misprinted subject)"),
    "31089": ("held: coverage and invented fail on BLDGTCQ 007, 008 and 009 printed for BLDGCTQ and PLUMBING 028 read "
              "as an alternative, so the record is not collectable; its arithmetic (37-38 against the printed 42, the "
              "note's required courses at 33 against the stated 38) waits on that rename"),
    "41011": ("held: a noncredit program whose arithmetic reads no total (unstated); coverage fails on VOC ED 454 and "
              "455 printed without the file's CE and VOC ED 460 printed for the file's 463: a course renumber is its "
              "lever"),
    "45285": ("held: coverage fails (53 of 99 placed): its text holds only page 65, the Cal-GETC pattern's Areas 4 to 6, "
              "and its note says the heading and Areas 1 to 3 are on earlier pages; a page pin with its section's own "
              "pages is its lever"),
    "18857": ("held: a cheaper lever passes it (p-gap-filing-leaves-census-lever-s721): the pooled reading "
              "(S.pooled_figures) reads its note's 'Complete 18 units' over the three lists once it reads 'with a "
              "minimum of 3 units from each' as pooled words, and today's scorer then passes it at 18 = 18; the "
              "pooled reading's next, never a named gap"),
    "38737": ("held: a cheaper lever passes it (p-gap-filing-leaves-census-lever-s721): its text opens on the page's "
              "table row for its own state code, 'T038737D C - 11 - 11', which its note took as the preceding "
              "program's tail; a Los Angeles Trade-Technical fill step reading that row's major figure fills its "
              "empty total, and today's scorer then passes it at 11 = 11"),
    "37706": ("held: the own-page guard: page 200 is shared with Pre-Health Professions I (38452), and no note names the "
              "record's own section; its heading's 18-19 and its table row's 16-19 ('T037706D C 16-19 - 16-19') "
              "differ, and the courses add to 16-17: a page read pins its section"),
})


# The lever holds: the one reading that passes each, run against today's scorer (the test runs them too).
@contextlib.contextmanager
def _pool_words_read():
    saved = S.POOL_WORDS
    S.POOL_WORDS = re.compile(saved.pattern + r"|\bwith\s+a\s+minimum\s+of\s+\d+\s+units\s+from\s+each\b", re.I)
    try:
        yield
    finally:
        S.POOL_WORDS = saved


def _with_total(lo: float, hi: float):
    def read(record: dict) -> dict:
        r = copy.deepcopy(record)
        r["program"]["total_units"] = {"min": lo, "max": hi}
        return r
    return read


ON_LEVER = {
    "18857": {"lever": "the pooled reading", "ctx": _pool_words_read, "record": lambda r: r,
              "words": "Complete 18 units with a minimum of 3 units from each of the following categories",
              "passes_at": [18.0, 18.0]},
    "38737": {"lever": "a fill from the table row", "ctx": contextlib.nullcontext, "record": _with_total(11, 11),
              "words": "T038737D C - 11 - 11", "passes_at": [11.0, 11.0]},
}


def lever_passes(cn: str) -> dict:
    """{"today": today's arithmetic status, "lever": the arithmetic with the lever's reading, "words": the words found
    on the record (a note or the capture's first line)}: the lever passes the record and today's scorer does not."""
    e = ON_LEVER[cn]
    f = _load(cn)
    today = S.score(f["record"], [], "", f.get("award"))["arithmetic"]
    with e["ctx"]():
        a = S.score(e["record"](f["record"]), [], "", f.get("award"))["arithmetic"]
    s = _sources().get(cn) or {}
    where = [str(n) for n in _notes(f)] + [str((s.get("source") or {}).get("title") or "")]
    return {"today": today.get("status"), "lever": a.get("status"), "computed": a.get("computed"),
            "stated": a.get("stated"), "words": any(e["words"] in w for w in where)}


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


def _blocks(filed: dict, name: str) -> list[dict]:
    return [b for b in (filed.get("record") or {}).get("blocks") or [] if b.get("name") == name]


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


_SOURCES = None


def _sources() -> dict:
    global _SOURCES
    if _SOURCES is None:
        with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
            _SOURCES = {str(x.get("control_number")): x for x in json.load(fh)}
    return _SOURCES


_READ_PAGES = None


def read_pages() -> dict:
    """{control number: {read page urls}}: the page each program was read from, sources.json's source.url and the
    record file's source_url (a PDF page's url carries its #page). capture.json's shared_pages is not read
    (p-own-page-guard-reads-read-pages-s727)."""
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
    """The other programs read from the record's own read page (reported in the receipt; a PDF page holds several
    sections, so a shared page holds a record only where no note names its own section)."""
    pages = read_pages()
    mine = pages.get(str(cn)) or set()
    return sorted(k for k, v in pages.items() if k != str(cn) and v & mine)


def _returned_rows(obj) -> bool:
    """The migrate response wrote rows: a guarded statement's 'returned' count above 0, or a non-empty 'inserted' or
    'deleted' list, at any depth of the response the runner filed (College of the Canyons's form)."""
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
    no filed receipt of its rollback did (an aborted or rolled-back apply posts nothing)."""
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


_POSTED = None


def posted_runs(skip: tuple = ()) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    (program_requirement_records_college_<slug>_<run>.json: inserted_keys under its one extracted run), a reread
    (..._college_reread_<slug>_<run>.json: replaced_keys and carried_keys under its extracted_run; kept_keys for a key
    no other receipt posts), every applied plan's records and a committed live read
    (program_requirements_reread_*_checked.json: live_runs at its read_at). skip names plan tags whose receipts are left
    out (the test reads the receipts as they stood before this plan's own apply, p-test-reads-own-apply-receipt-s721);
    a skip is never cached."""
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
            if tag in skip or not plan_applied(tag):
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
def cut_short(filed: dict) -> bool:
    """noted_section_cut_off's figures: the record adds short of its stated total at the low end, or states none."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    return st is None or (comp is not None and comp[0] + NG.FIG_EPS < st[0])


def list_open(filed: dict, e: dict) -> bool:
    """lists_not_closed's figures: the named list is one choice list that prints no figure (no minimum, no stated
    figure), and the record's other lists add to the stated total by themselves."""
    bs = _blocks(filed, e["open"])
    if len(bs) != 1 or bs[0].get("rule") not in ("choose_courses", "choose_units"):
        return False
    b = bs[0]
    if b.get("minimum") is not None or S._span(b.get("stated")) is not None:
        return False
    rest = [x for x in (filed.get("record") or {}).get("blocks") or [] if x is not b]
    if not rest or any(x.get("rule") != "all" for x in rest):
        return False
    units = [S._num(c.get("units")) for x in rest for c in x.get("courses") or []]
    st = _pair(((filed.get("score") or {}).get("arithmetic") or {}).get("stated"))
    return bool(units) and None not in units and st is not None and abs(sum(units) - st[0]) <= NG.FIG_EPS \
        and abs(sum(units) - st[1]) <= NG.FIG_EPS


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
    # The record-rule guard (the second reader of s727d): a row the record rules name under another kind is refused.
    bare = {k: v for k, v in sc.items() if k not in ("gaps", "confidence")}
    rr = NG.answer(dict(filed, score=bare))
    if rr and rr[0] != e["gap"]:
        return None
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None
    if scorer_passes(filed) or not on_live_run(filed, skip):
        return None
    if e.get("cut") and not cut_short(filed):
        return None
    if e.get("open") and not list_open(filed, e):
        return None
    return e["gap"], words


def claim(filed: dict, src: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn)
    s = (_sources() if src is None else src).get(cn)
    if not e or not s:
        return "no capture"
    if shared_with(cn) and not (e.get("own_section") and any(e["own_section"] in n for n in _notes(filed))):
        # The own-page guard, for PDF pages: a page another program was read from is the record's own only where a
        # note of its own names the record's own section (East Los Angeles's second reader, 38168).
        return "the page is shared and no note names the record's own section"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    if e.get("not_page") is not None and e["not_page"] in ((s.get("source") or {}).get("pages") or []):
        return "the capture holds the page the note says the read lacked"
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
            g = copy.deepcopy(f)
            a = g["score"]["arithmetic"]
            if a.get("stated") is not None:
                a["computed"] = list(a["stated"])
                e2 = dict(e, computed=a["stated"])
                tally("the sum at the stated total", gap_noted(g, {cn: e2}) is None, cn)
            if e.get("not_page") is not None:
                s2 = copy.deepcopy(src)
                s2[cn]["source"]["pages"] = sorted(set(s2[cn]["source"].get("pages") or []) | {e["not_page"]})
                tally("the capture holding the page the note says it lacked", claim(f, s2) != "stands", cn)
        if e.get("open"):
            g = copy.deepcopy(f)
            for b in g["record"]["blocks"]:
                if b.get("name") == e["open"]:
                    b["rule"] = "all"
            tally("the open list read as required", gap_noted(g) is None, cn)
            g = copy.deepcopy(f)
            for b in g["record"]["blocks"]:
                if b.get("name") == e["open"]:
                    b["minimum"] = 1
            tally("the open list printing a figure", gap_noted(g) is None, cn)
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
    pr, cc, bd = precision(), claim_checks(), boundaries()
    lv = {cn: lever_passes(cn) for cn in ON_LEVER}
    print("precision: %s" % json.dumps(pr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    print("levers: %s" % json.dumps(lv))
    bad_lever = [cn for cn, v in lv.items() if v["today"] == "equal" or v["lever"] != "equal" or not v["words"]]
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"] or bad_lever:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s730_lattc_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S730: Los Angeles Trade-Technical's 17 wording-rule records, collected with their "
                                "gaps named where one is honest (no reread, no reconcile)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "run": "45586922147", "levers": list(LEVERS),
                       "person": list(PERSON), "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "precision": pr, "claim_checks": cc, "boundaries": bd, "levers": lv, "held": res["held"],
            "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found, and a page a note says the read lacked not among the capture's pages. The "
                                  "capture keeps no page text, so a note's quoted figures are the reader's words, "
                                  "never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Los Angeles Trade-Technical (named gaps %d: %s). Each row's checks\n"
           "-- become the college load's image of its committed record (load_rows): checks.gaps and checks.confidence\n"
           "-- added; the record unchanged. Receipt: %s\n"
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
