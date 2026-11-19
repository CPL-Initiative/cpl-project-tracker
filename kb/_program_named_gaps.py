#!/usr/bin/env python3
"""Named gaps: a record that fails a check is collected with the gap named and confidence scores (Part B).

Sam, 2026-11-17 (relayed by COBIx on #3358, section 2): never drop a record for failing; collect it with gaps
noted and confidence scores (unit arithmetic, course-list match, GE pattern, catalog year, source). Commons
Clarity's ask, Part B (#3480, comment 6967374303), names the gaps. COBIx decided that a degree whose major
total differs from the catalog is still collected, flagged "major total differs from catalog", scored about 30.

THE REPRESENTATION. One new key pair inside existing JSON, no new column:
  * the filed record: score.gaps, a list of {"gap": name, "label": sentence, "words": why}, and score.confidence,
    five scores 0-100 ({"unit_arithmetic", "course_list_match", "ge_pattern", "catalog_year", "source"});
  * the live row (program_requirement_records.checks, jsonb): checks.gaps, the list of names, and
    checks.confidence, the same five scores.
A gap's name is a short stable key of GAPS ("no_units_read"); its sentence is GAPS[name], filed as "label" beside
the record's own "words". The load and the census read only the name, so a reworded sentence moves no row.
checks.arithmetic keeps its status: a named gap says why the units differ and leaves the check honest. The census
(kb/_harvest_gap_census.py) counts a row whose checks.gaps is not empty, with coverage and invented passing, as
collected, and reports it by gap name. The note #3478 wrote (score.arithmetic.note) stays where it is.

RECORD RULES (a filed record exists, so the program is collected with the gap):
  major_total_differs  a local degree the overlap ruling would pass but for a major whose own check fails against
                       the catalog's major total (local_overlap_hold in kb/_program_requirements_reconcile.py, and
                       the major's check not passing). Unit arithmetic scores 30. A major that passes on another
                       reading than plain equality is not this gap: its degree fails for another reason (S680
                       second reader: Alameda 01118 and Glendale 02587, whose general education is what fails).
  no_units_printed     the units cannot be added because a required course has no units, and the record's own
                       notes say the catalog prints it without units. Unit arithmetic scores 40.
  no_units_read        a required course carries no units as read, the only reason the units cannot be added, and
                       the record's notes do not say its requirements list or table is missing or cut off
                       (INCOMPLETE_READ: that record is an incomplete read, not this gap; S680 second reader: Butte
                       14583, West Los Angeles 42627). Unit arithmetic scores 20. (no_units_printed, the same where
                       the notes say the catalog prints none, scored 40, is off: its note matcher fails its
                       self-recall, matcher_recall.)
  no_hours_read        no_units_read on a program measured in hours (record.program.measure "hours"): its courses
                       carry hours, not units (COBIx's finding 1 on #3497). Unit arithmetic scores 20.

PLANNED GAPS (S681, from #3502's committed plan, kb/program_requirements_reread_plan_s680.json):
  catalog_figures_differ  every list matches its printed figure and the lists sum past the program's printed total
                       (Long Beach City 41220: 30 against a printed 29). Unit arithmetic scores 50.
  no_units_printed     the reader's note says the catalog prints no units for a required course. Scores 40.

LABELS (no record exists, so the program stays in its pile with a plain reason; kb/status/program_named_gaps.json):
  noncredit_names_only a noncredit program whose catalog page names it (the capture's near miss: the title
                       matches exactly) and prints none of its courses (coverage 0).

The labels that need a title lookup across a college's whole current catalog (D1's "the state still lists this
program as active, but the college's current catalog doesn't print it", D3's "Not in the college's current
catalog", "Not printed in this year's catalog") need page reads the committed files do not hold: a runner task.

THE COLLECTION LANE'S COLLEGES are left out: COLLECTION_LANE_S680 in kb/collection_lane.py.

    python3 kb/_program_named_gaps.py --dry-run     # counts and the self-check; writes nothing
    python3 kb/_program_named_gaps.py --tag s680    # rewrite the records, the label file and the receipt
    python3 kb/_program_named_gaps.py --receipt R --applied M   # after the apply: rebuild the rollback from the
                                                    # rows the migrate receipt M returned (no rescoring)
    python3 kb/_program_named_gaps.py --three-part --tag s681   # S681: one plan in three parts (A the S680 rows to
                                                    # the corrected values, B #3502's records, C units rule A5's five)
    python3 kb/_program_named_gaps.py --wave --college NAME ... --checked LIVE.json --tag s684
                                                    # S684: a re-read wave's records take their gap again (A the
                                                    # record rules, B #3502's plan), only at the wave's runs

Guard: tests/program_named_gaps_test.py.
"""
from __future__ import annotations

import argparse
import collections
import glob
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402
import collection_lane as CL  # noqa: E402
import _guarded_sql as GS  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
RECEIPTS = os.path.join(HERE, "receipts")
LABELS_OUT = os.path.join(HERE, "status", "program_named_gaps.json")
RULING = ("Sam, 2026-11-17, relayed by COBIx on #3358 section 2: collect with gaps noted and confidence scores; "
          "Commons Clarity's Part B (#3480, comment 6967374303); COBIx's D2 decision (major total differs, about 30)")

GAPS = {
    "major_total_differs": "major total differs from catalog",
    "no_units_printed": "The catalog prints no units for at least one required course.",
    "no_units_read": "A required course carries no units as read, so the program's units cannot be added.",
    # COBIx's finding 1 on #3497: a program measured in hours (program.measure "hours") carries hours, not units.
    "no_hours_read": "A required course carries no hours as read, so the program's hours cannot be added.",
    # #3502's plan (kb/program_requirements_reread_plan_s680.json, gap_catalog): every list matches its printed
    # figure and the lists sum past the program's printed total, so the catalog's own figures disagree.
    "catalog_figures_differ": ("The catalog's own figures do not add up: each list matches its printed figure, and "
                               "the lists sum past the program's printed total."),
    "noncredit_names_only": "Noncredit certificate: the catalog names it but prints no course list.",
}
ARITH_SCORE = {"major_total_differs": 30, "no_units_printed": 40, "no_units_read": 20, "no_hours_read": 20,
               "catalog_figures_differ": 50}
MAJOR_NOT_EXACT = "the major does not match the catalog's major total exactly"
NO_UNITS_WHY = re.compile(r"^a required course in '.*' has no units$")
PRINTED_NO_UNITS = re.compile(r"\b(?:no|without)\s+units\b|\bunits?\s+(?:are\s+|is\s+)?not\s+(?:printed|listed|given)\b"
                              r"|\bprints?\s+no\s+units?\b", re.I)
NONCREDIT = re.compile(r"\bnon-?credit\b|\bcertificate\s+of\s+(?:competency|completion)\b", re.I)
# A note sentence that says the record's requirements list or table is missing or cut off: the read is incomplete.
# The list or table is the subject and the loss is said of it, in one clause: a cut-off career list or title
# heading does not count, nor a page cut off elsewhere before "a requirements table may follow" (Taft 31290).
INCOMPLETE_READ = re.compile(
    r"\b(?:requirements?|required|course|courses)\b[^.;|]{0,40}\b(?:table|list)\b[^.;|]{0,80}?"
    r"(?:\bcut\s+off\b|\btruncat|\bnot\s+in\s+the\s+(?:provided|extracted|supplied|given)\s+(?:text|excerpt)\b"
    r"|\bmissing\b|\bnot\s+(?:provided|included)\b)", re.I)
# The S680 second reader's held answers: the two no-units records whose notes say the list is incomplete.
HELD_INCOMPLETE = frozenset({("Butte College", "14583"), ("West Los Angeles College", "42627")})
FOUND_SOURCE = {"sitemap_page": 100, "link_search": 100, "pdf_pages": 80}
UNKNOWN_SOURCE = 60
# The records whose own note says the requirements or course list may continue past the text read (COBIx's finding
# 3 on #3497), each reviewed by a person with the words of its note: course_list_match is capped at 50 on these
# three and on nothing else. A matcher has no held-answer test yet, so none decides it (the S681 second reader: a
# rough pattern missed Taft 44006, Santa Rosa 45477 and 32298, Santa Ana 46284 and Pierce 10726). The next step is a
# matcher with a held-answer test; until then a record joins this list by review.
MAY_CONTINUE_REVIEWED = {
    ("Fullerton College", "18166"): "The Category C (Health and Wellness) list is cut off after 'PE 144 F Volleyball' "
                                    "with no units printed; further PE courses (and possibly BUS 101 F or WELL 230 F) "
                                    "may follow on the full page.",
    ("Santa Ana College", "34014"): "The catalog text is cut off mid-sentence in the Summary (Plan 1 explanation); "
                                    "further requirements, outcomes or careers may follow on the page.",
    ("Taft College", "31290"): "The text is cut off partway through the Program Learning Outcomes ('Discern and a'); "
                               "the third outcome is incomplete and was not recorded, and any further outcomes and a "
                               "requirements table may follow in the full page.",
}
MAY_CONTINUE_MISSES = ("Taft College 44006", "Santa Rosa Junior College 45477", "Santa Rosa Junior College 32298",
                       "Santa Ana College 46284", "Pierce College 10726")
MAY_CONTINUE_NEXT = ("a matcher with a held-answer test is the next step; a rough pattern missed %s"
                     % ", ".join(MAY_CONTINUE_MISSES))
MAY_CONTINUE_CAP = 50


# ── confidence ─────────────────────────────────────────────────────────────
def may_continue(filed: dict) -> str | None:
    """The reviewed note saying the record's list may continue (MAY_CONTINUE_REVIEWED), only where the record still
    carries those words; None for every other record."""
    words = MAY_CONTINUE_REVIEWED.get((filed.get("college"), str(filed.get("control_number"))))
    notes = " ".join(str(n) for n in (filed.get("record") or {}).get("notes") or [])
    return words if words and words in notes else None


def confidence(filed: dict, gap: str | None, method: str | None = None, year_ok: bool | None = True) -> dict:
    """The five scores, 0-100, or None where a score does not apply. Unit arithmetic: 100 when the check passes,
    else the gap's score. Course-list match: the share of the closed list placed, None with no closed list, and at
    most 50 on a reviewed record whose note says its list may continue (MAY_CONTINUE_REVIEWED). GE pattern:
    None for a program with no degree total (general education does not apply: a certificate, a noncredit
    program), else 50 when it names a pattern with no units, else 100. Catalog year: 100 for the registry's current
    year, 60 for a prior year. Source: by how the page was found: a sitemap or link page 100, a PDF slice 80, and 60
    (UNKNOWN_SOURCE) when the sources file names another method or none."""
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    prog = (filed.get("record") or {}).get("program") or {}
    share = (sc.get("coverage") or {}).get("share")
    if S._span(prog.get("degree_total")) is None:
        ge = None
    else:
        ge = 50 if (prog.get("ge_pattern") and S._span(prog.get("ge_units")) is None) else 100
    clm = None if share is None else int(round(float(share) * 100))
    if clm is not None and may_continue(filed):
        clm = min(clm, MAY_CONTINUE_CAP)
    return {"unit_arithmetic": 100 if a.get("pass") else ARITH_SCORE.get(gap, 0),
            "course_list_match": clm,
            "ge_pattern": ge, "catalog_year": 100 if year_ok in (True, None) else 60,
            "source": FOUND_SOURCE.get(method or "", UNKNOWN_SOURCE)}




# ── the catalog_figures_differ sentence, checked on the record ──────────────
FIG_EPS = 0.01


def _pair(v):
    """A [lo, hi] list, as the scorer files computed and stated, or a figure S._span reads."""
    if isinstance(v, (list, tuple)) and len(v) == 2 and all(S._num(x) is not None for x in v):
        return (S._num(v[0]), S._num(v[1]))
    return S._span(v)


def figures_differ_fails(filed: dict) -> str | None:
    """Why a record does not meet catalog_figures_differ's own sentence ("each list matches its printed figure, and
    the lists sum past the program's printed total"), or None when it meets it. Every counting list must print its
    figure (block "stated") and carry units on each course as read; a required list's courses add to exactly its
    figure, a choose-courses list's courses can reach its figure, a choose-units list's courses hold at least its
    figure; and the record's sum is past the printed total at both ends. A recommended list counts toward nothing."""
    rec = filed.get("record") or {}
    hours = S.measure(rec) == "hours"
    for b in rec.get("blocks") or []:
        rule, name = b.get("rule"), (b.get("name") or "")[:60]
        if rule == "recommended":
            continue
        stated = S._span(b.get("stated"))
        if stated is None:
            return "the list '%s' prints no figure" % name
        spans = [S.choice_units(c, {}, hours) for c in b.get("courses") or []]
        if not spans or any(s is None for s in spans):
            return "a course in the list '%s' carries no units as read" % name
        if rule == "all":
            got = (sum(s[0] for s in spans), sum(s[1] for s in spans))
            if abs(got[0] - stated[0]) > FIG_EPS or abs(got[1] - stated[1]) > FIG_EPS:
                return "the list '%s' adds to %s against its printed %s" % (name, S._fig(*got), S._fig(*stated))
        elif rule == "choose_courses":
            got, _ = S.block_units_summed(b, {}, hours)
            if got is None or got[0] > stated[0] + FIG_EPS or got[1] + FIG_EPS < stated[1]:
                return "the list '%s' cannot reach its printed %s" % (name, S._fig(*stated))
        elif rule == "choose_units":
            if sum(s[1] for s in spans) + FIG_EPS < stated[0]:
                return "the list '%s' holds fewer units than its printed %s" % (name, S._fig(*stated))
        else:
            return "the list '%s' has a rule the check does not read (%r)" % (name, rule)
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    if comp is None or st is None or not (comp[0] > st[0] + FIG_EPS and comp[1] > st[1] + FIG_EPS):
        return "the lists do not sum past the program's printed total at both ends"
    return None



# ── the record rules ───────────────────────────────────────────────────────
def collectable(sc: dict) -> bool:
    """Coverage and invented pass: the record read the program's own page and its courses."""
    return bool((sc.get("coverage") or {}).get("pass") and (sc.get("invented") or {}).get("pass"))


def major_total_differs(filed: dict) -> str | None:
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if a.get("pass") or not collectable(sc):
        return None
    prog = (filed.get("record") or {}).get("program") or {}
    if R.local_overlap_hold(prog, filed.get("award"), a) != MAJOR_NOT_EXACT:
        return None
    m = a["major"]
    if m.get("pass") is not False:
        # The major passes on another reading than plain equality, so the degree fails for another reason.
        return None
    return ("the major sums to %s against the catalog's major total %s; the overlap ruling would pass the degree "
            "if the major matched" % (R._fig(m.get("computed")), R._fig(m.get("stated"))))


def _no_units_codes(filed: dict) -> list[str] | None:
    """The required courses with no units, when they are the only reason the units cannot be added."""
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if a.get("pass") or a.get("status") != "incomplete" or not collectable(sc):
        return None
    why = [w for w in a.get("why") or [] if w != "the record names no total"]
    if not why or not all(NO_UNITS_WHY.match(w) for w in why):
        return None
    codes = [c.get("code") or "" for b in (filed.get("record") or {}).get("blocks") or [] if b.get("rule") == "all"
             for c in b.get("courses") or []
             if all(S._num(c.get(k)) is None for k in ("units", "units_max", "units_total"))]
    return codes or None


def _listed(codes: list[str]) -> str:
    """Up to four codes, and how many more."""
    more = len(codes) - 4
    return ", ".join(codes[:4]) + (" and %d more" % more if more > 0 else "")


def incomplete_read(filed: dict) -> str | None:
    """The note sentence saying the record's requirements list or table is missing or cut off, or None."""
    for n in (filed.get("record") or {}).get("notes") or []:
        for s in re.split(r"(?<=[.!?])\s+", str(n)):
            if INCOMPLETE_READ.search(s):
                return s
    return None


def hours_measured(filed: dict) -> bool:
    """The program counts hours (record.program.measure "hours"): a noncredit certificate, for one."""
    return (((filed.get("record") or {}).get("program") or {}).get("measure") or "").lower() == "hours"


def no_units_read(filed: dict) -> str | None:
    codes = _no_units_codes(filed)
    if not codes or (NO_UNITS_PRINTED_ON and no_units_printed(filed)) or incomplete_read(filed):
        return None
    m = "hours" if hours_measured(filed) else "units"
    return "the record carries no %s for %s, so the program's %s cannot be added" % (m, _listed(codes), m)


def by_measure(name, filed: dict):
    """no_units_read names no_hours_read on a program measured in hours (COBIx's finding 1 on #3497)."""
    return "no_hours_read" if name == "no_units_read" and hours_measured(filed) else name


def no_units_printed(filed: dict) -> str | None:
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if a.get("pass") or a.get("status") != "incomplete" or not collectable(sc):
        return None
    why = a.get("why") or []
    if not why or not all(NO_UNITS_WHY.match(w) for w in why if w != "the record names no total"):
        return None
    rec = filed.get("record") or {}
    notes = " ".join(str(n) for n in (rec.get("notes") or []))
    codes = []
    for b in rec.get("blocks") or []:
        if b.get("rule") != "all":
            continue
        for c in b.get("courses") or []:
            if all(S._num(c.get(k)) is None for k in ("units", "units_max", "units_total")):
                codes.append(c.get("code") or "")
    said = [c for c in codes if c and re.search(r"%s[^.]{0,120}" % re.escape(c), notes)
            and PRINTED_NO_UNITS.search(re.search(r"%s[^.]{0,120}" % re.escape(c), notes).group(0))]
    if not codes or len(said) != len(codes):
        return None
    return "the catalog prints %s with no units, so the program's units cannot be added" % _listed(said)


# no_units_printed is off: its note matcher (PRINTED_NO_UNITS) claims "no units" beside 673 of 107,852 required
# courses whose units the record holds (matcher_recall), so it fails its own self-check. Its records take
# no_units_read, the gap that claims only what the record shows.
NO_UNITS_PRINTED_ON = False
RECORD_RULES = (("major_total_differs", major_total_differs),) + (
    (("no_units_printed", no_units_printed),) if NO_UNITS_PRINTED_ON else ()) + (("no_units_read", no_units_read),)


def answer(filed: dict) -> tuple[str, str] | None:
    """The first record rule that names a gap, whether or not the record already files one."""
    for name, fn in RECORD_RULES:
        words = fn(filed)
        if words:
            return by_measure(name, filed), words
    return None


def judge(filed: dict) -> tuple[str, str] | None:
    if (filed.get("score") or {}).get("gaps"):
        return None
    return answer(filed)


# ── the labels ─────────────────────────────────────────────────────────────
def labels(base: str = COLLEGE_DIR, skip: tuple = ()) -> list[dict]:
    out = []
    for sp in sorted(glob.glob(os.path.join(base, "*", "sources.json"))):
        d = os.path.dirname(sp)
        summ_p = os.path.join(d, "summary.json")
        if not os.path.isfile(summ_p):
            continue
        with open(summ_p, encoding="utf-8") as fh:
            summ = json.load(fh)
        college = summ.get("college")
        if CL.held(college, skip):
            continue
        with open(sp, encoding="utf-8") as fh:
            src = {str(e.get("control_number")): e for e in json.load(fh)}
        for nf in summ.get("not_found") or []:
            cn = str(nf.get("control_number"))
            e = src.get(cn) or {}
            nm = nf.get("near_miss") or {}
            lab = nm.get("label") or {}
            text = "%s %s" % (e.get("award") or nf.get("award") or "", e.get("title") or nf.get("title") or "")
            if (NONCREDIT.search(text) and (lab.get("title") or 0) >= 0.99 and nm.get("coverage") is not None
                    and float(nm["coverage"]) == 0.0 and not os.path.isfile(os.path.join(d, "records", cn + ".json"))):
                out.append({"college": college, "control_number": cn, "title": e.get("title") or nf.get("title"),
                            "gap": "noncredit_names_only", "words": GAPS["noncredit_names_only"],
                            "source_line": "the catalog page %s names the program and prints none of its courses"
                                           % nm.get("url")})
    return out


# ── the run ────────────────────────────────────────────────────────────────
def _sources(path: str) -> tuple[dict, str | None]:
    d = os.path.dirname(os.path.dirname(path))
    src, year = {}, None
    if os.path.isfile(os.path.join(d, "sources.json")):
        with open(os.path.join(d, "sources.json"), encoding="utf-8") as fh:
            src = {str(e.get("control_number")): e for e in json.load(fh)}
    if os.path.isfile(os.path.join(d, "capture.json")):
        with open(os.path.join(d, "capture.json"), encoding="utf-8") as fh:
            year = json.load(fh).get("catalog_year")
    return src, year


def held_answer(filed: dict) -> str | None:
    """The gap a failing, collectable record holds, read from the scorer's own verdict and the second reader's
    held cases, apart from the rules' code paths: major_total_differs where a local degree's major check itself
    fails; no_units_read where the arithmetic is incomplete, every reason it gives is a required course with no
    units, and the record is not one the reader held as an incomplete read (HELD_INCOMPLETE); otherwise none."""
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    m = a.get("major")
    if isinstance(m, dict) and m.get("pass") is False and R.awards_match("local", filed.get("award")):
        return "major_total_differs"
    why = [w for w in a.get("why") or [] if w != "the record names no total"]
    if (a.get("status") == "incomplete" and why and all(w.endswith(" has no units") for w in why)
            and (filed.get("college"), str(filed.get("control_number"))) not in HELD_INCOMPLETE):
        # The held answer reads the measure itself, apart from by_measure.
        prog = (filed.get("record") or {}).get("program") or {}
        return "no_hours_read" if str(prog.get("measure") or "").lower() == "hours" else "no_units_read"
    return None


def recall(every: list[dict]) -> dict:
    """The record rules against the held answer on every failing record that coverage and invented pass, at every
    college (the collection lane's and the parked ones too, read here and written nowhere): right when the rule
    names the held gap or, where none is held, names none."""
    out = {"held": 0, "right": 0, "wrong": 0, "by_answer": collections.Counter(), "wrong_keys": []}
    for f in every:
        sc = f.get("score") or {}
        if (sc.get("arithmetic") or {}).get("pass") or not collectable(sc):
            continue
        truth, got = held_answer(f), (answer(f) or (None,))[0]
        out["held"] += 1
        out["by_answer"][truth or "none"] += 1
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"] += 1
            out["wrong_keys"].append({"college": f.get("college"), "control_number": f.get("control_number"),
                                      "held": truth, "rule": got})
    out["by_answer"] = dict(out["by_answer"])
    return out


NONCREDIT_AWARD = re.compile(r"^\s*(?:noncredit\s+program|certificate\s+of\s+(?:competency|completion))", re.I)


def matcher_recall(files: list[dict], base: str = COLLEGE_DIR) -> dict:
    """Each new matcher against answers already held (the second reader's test on #3496):
    NONCREDIT on every committed program's award and title, against the state's own award (a noncredit program,
    a certificate of competency or completion is noncredit); PRINTED_NO_UNITS on every required course that carries
    its units, where a hit would claim the catalog prints none."""
    nc = {"held": 0, "right": 0, "wrong": 0, "missed": 0}
    for sp in sorted(glob.glob(os.path.join(base, "*", "sources.json"))):
        with open(sp, encoding="utf-8") as fh:
            for e in json.load(fh):
                award = e.get("award") or ""
                if not award:
                    continue
                truth = bool(NONCREDIT_AWARD.search(award))
                got = bool(NONCREDIT.search("%s %s" % (award, e.get("title") or "")))
                nc["held"] += 1
                if got == truth:
                    nc["right"] += 1
                elif got:
                    nc["wrong"] += 1
                else:
                    nc["missed"] += 1
    pu = {"held": 0, "right": 0, "wrong": 0}
    for f in files:
        rec = f.get("record") or {}
        notes = " ".join(str(n) for n in (rec.get("notes") or []))
        for b in rec.get("blocks") or []:
            if b.get("rule") != "all":
                continue
            for c in b.get("courses") or []:
                code = c.get("code") or ""
                if not code or S._num(c.get("units")) is None:
                    continue
                pu["held"] += 1
                m = re.search(r"%s[^.]{0,120}" % re.escape(code), notes)
                pu["wrong" if m and PRINTED_NO_UNITS.search(m.group(0)) else "right"] += 1
    return {"noncredit": nc, "printed_no_units": pu}


def _load_images(colleges: set) -> dict:
    """{(college, control_number): the row the college load would post}, built by the load's own code (load_rows in
    kb/_program_requirements_college.py, which carries checks.gaps and checks.confidence from the filed score)."""
    import _program_requirements_college as C
    out = {}
    for college in sorted(colleges):
        for r in C.load_rows(college)[0]:
            out[(college, str(r["control_number"]))] = r
    return out


def run(write: bool, skip: tuple = ()) -> dict:
    moved, files, hits, every = [], [], [], []
    # A college the harvest parks (the census's PARKED) takes no gap from this lane either.
    import _harvest_gap_census as G
    parked = set(G.PARKED)
    for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            filed = json.load(fh)
        if not isinstance(filed.get("score"), dict):
            continue
        every.append(filed)
        if CL.held(filed.get("college"), skip) or filed.get("college") in parked:
            continue
        files.append(filed)
        j = judge(filed)
        if j:
            hits.append((path, filed, j))
    # The load's image of each record before any rewrite (the guard), and after it (what the row takes).
    before = _load_images({f["college"] for _, f, _ in hits}) if write else {}
    for path, filed, (name, words) in hits:
        src, year = _sources(path)
        e = src.get(str(filed.get("control_number"))) or {}
        conf = confidence(filed, name, e.get("method"), (e.get("catalog_year") or year) == year)
        key = (filed["college"], str(filed["control_number"]))
        if write and key not in before:
            raise SystemExit("the load does not post %s %s" % key)
        moved.append({"college": filed["college"], "control_number": filed["control_number"],
                      "award": filed.get("award"), "extracted_run": filed.get("extracted_run"),
                      "gap": name, "words": words, "confidence": conf,
                      "path": os.path.relpath(path, ROOT)})
        if write:
            img = before[key]
            moved[-1]["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                             "measure", "total_min", "total_max", "record", "checks",
                                                             "extracted_run")}
            filed["score"]["gaps"] = [{"gap": name, "label": GAPS[name], "words": words}]
            filed["score"]["confidence"] = conf
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    if write:
        after = _load_images({m["college"] for m in moved})
        for m in moved:
            img = after[(m["college"], str(m["control_number"]))]
            if img["record"] != m["before_image"]["record"]:
                raise SystemExit("a named gap changed the record of %s %s" % (m["college"], m["control_number"]))
            m["after_image"] = {"checks": img["checks"]}
    for i, m in enumerate(moved, 1):
        m["i"] = i
    labs = labels(skip=skip)
    return {"moved": moved, "labels": labs, "recall": recall(every), "matcher_recall": matcher_recall(files),
            "by_gap": dict(collections.Counter(m["gap"] for m in moved)),
            "labels_by_gap": dict(collections.Counter(x["gap"] for x in labs))}


def _q(s) -> str:
    return "'%s'" % str(s).replace("'", "''")


def _jb(v) -> str:
    return "%s::jsonb" % _q(json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(",", ":")))


def _values(rows: list[dict]) -> str:
    return ",\n  ".join("(%d, %s, %s, %d, %s, %s, %s)" % (
        r["i"], _q(r["college"]), _q(r["control_number"]), int(r["extracted_run"]),
        _jb(r["before_image"]["record"]), _jb(r["before_image"]["checks"]), _jb(r["after_image"]["checks"]))
        for r in rows)


V = "with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values\n  %s)"
def pre_read_sql(rows: list[dict]) -> str:
    """One SELECT, one JSON value: the rows as they stand live, before the UPDATE."""
    return (V % _values(rows) + "\n"
            "select json_build_object(\n"
            "  'listed', (select count(*) from v),\n"
            "  'on_run', count(*) filter (where r.extracted_run = v.extracted_run),\n"
            "  'record_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record),\n"
            "  'checks_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.checks = v.before_checks),\n"
            "  'both_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record and r.checks = v.before_checks),\n"
            "  'already_after', count(*) filter (where r.checks = v.after_checks),\n"
            "  'checked_now', count(*) filter (where r.checked))\n"
            "  from v join public.program_requirement_records r\n"
            "    on r.college = v.college and r.control_number = v.control_number;")


def _update(to: str, frm: str) -> str:
    return ("update public.program_requirement_records r\n"
            "   set checks = v.%s_checks\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.checks = v.%s_checks%s"
            % (to, frm, " and r.record = v.before_record" if frm == "before" else ""))


def update_sql(rows: list[dict], tag: str = "s680 named-gaps") -> str:
    """The guarded UPDATE: each row's checks become the load's image of its committed record (checks.gaps and
    checks.confidence added, checks.arithmetic unchanged), only where the row holds the filed run, the load's image
    of main's record and checks (the before-image), and no person's check; it aborts unless it matches the plan
    less the rows a person checked (kb/_guarded_sql.py)."""
    return GS.guarded(V % _values(rows), _update("after", "before"), len(rows), tag)


def rollback_sql(rows: list[dict], tag: str = "s680 named-gaps rollback") -> str:
    """The before-image's checks back where the row still holds the after-image, skipping and listing a row a
    person checked; it aborts on fewer rows unless a person edits its expect line."""
    return GS.guarded(V % _values(rows), _update("before", "after"), len(rows), tag, rollback=True)


# ── the S681 plan: one plan, three parts ───────────────────────────────────
# The S681 conductor's held colleges for parts B and C: tonight's collection lane (five) and the seven released
# colleges; another worker plans those. Frozen here and in the plan's receipt ("held_colleges"), so a later change to
# kb/collection_lane.py never moves what this plan ran under. Part A takes every row the S680 apply wrote.
HELD_S681 = ("Lassen College", "Cosumnes River College", "Allan Hancock College", "Chabot College",
             "Santiago Canyon College",
             "Golden West College", "Coastline Community College", "Orange Coast College", "Los Medanos College",
             "Diablo Valley College", "College of the Redwoods", "Antelope Valley College")
REREAD_PLAN = os.path.join(HERE, "program_requirements_reread_plan_s680.json")
# #3502's two lanes and the gap each names: 38 whose catalog figures do not add up, 16 whose reader's note says the
# catalog prints no units for a required course.
PLAN_LANES = {"gap_catalog": "catalog_figures_differ", "gap_no_units": "no_units_printed"}
# Units rule A5's five rows stay applied and passing (cpl_memory d-a5-five-rows-stay-applied-s680): they take a
# unit-arithmetic score of 56 and its note, and no gap.
A5_FIVE = frozenset({("Chaffey College", "38854"), ("College of Marin", "36465"), ("Madera College", "44516"),
                     ("Merritt College", "33540"), ("Saddleback College", "40326")})
A5_SCORE = 56
A5_NOTE = "Passed by units rule A5, right on 69 of 123 held answers in its self-check."
S680_RECEIPT = os.path.join(RECEIPTS, "program_requirement_records_named_gaps_2026-11-18_s680.json")
# The S681 second reader: the 16 no_units_printed rows leave the plan (PRINTED_NO_UNITS matches none of their notes,
# five name a choose or elective list, and the rule is off), and so does any catalog_figures_differ row whose record
# does not meet the gap's own sentence (figures_differ_fails).
HOLD_NO_UNITS_PRINTED = ("the record does not show that the catalog prints no units; the page is read free before a "
                         "gap is named")
HOLD_FIGURES = "the record does not meet the gap's own sentence: %s"
PARTS = {"A": "the corrective write on the rows the S680 apply wrote: its image to the corrected names and scores",
         "B": "#3502's records collected with their named gap (kb/program_requirements_reread_plan_s680.json)",
         "C": "units rule A5's five rows: unit arithmetic 56 with its note, passing, no gap"}


def planned(path: str = REREAD_PLAN) -> dict:
    """{(college, control_number): (gap, words)} from #3502's committed plan."""
    with open(path, encoding="utf-8") as fh:
        lanes = json.load(fh)["lanes"]["units_unequal"]
    out = {}
    for lane, gap in PLAN_LANES.items():
        for c in lanes[lane]["colleges"]:
            for it in c["items"]:
                if gap == "catalog_figures_differ":
                    words = ("the printed list figures sum to %s, past the program's printed total %s"
                             % (it["sums_to"], it["catalog_prints"]))
                else:
                    words = re.sub(r"^the reader's note says ", "", it["cause"])
                out[(c["college"], str(it["control_number"]))] = (gap, words)
    return out


def plan_s681(write: bool, skip: tuple = (), plan_path: str = REREAD_PLAN) -> dict:
    """The three parts as one list of rows, each with its part, its gap (or none) and scores, and the load's image
    before and after the record file is rewritten. Part A takes every row the S680 apply wrote. A part B or C row at a
    held college (HELD_S681 and skip, never the moving kb/collection_lane.py) or a parked one is left out and listed."""
    import _harvest_gap_census as G
    parked = set(G.PARKED)
    held = set(HELD_S681) | set(skip)
    plan = planned(plan_path)
    rows, left_out, unchanged, held_out, seen_plan, seen_a5 = [], [], [], [], set(), set()
    for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            filed = json.load(fh)
        sc = filed.get("score")
        if not isinstance(sc, dict):
            continue
        key = (filed.get("college"), str(filed.get("control_number")))
        a5 = key if key in A5_FIVE else None
        ours = [g for g in sc.get("gaps") or [] if isinstance(g, dict) and g.get("gap") in GAPS]
        part = ("A" if ours and len(ours) == len(sc.get("gaps") or []) else
                "B" if key in plan else "C" if a5 else None)
        if part is None:
            continue
        if part == "B":
            seen_plan.add(key)
        if part == "C":
            seen_a5.add(a5)
        if part != "A" and (key[0] in held or key[0] in parked):
            left_out.append({"part": part, "college": key[0], "control_number": key[1],
                             "why": "held college" if key[0] in held else "parked college"})
            continue
        src, year = _sources(path)
        e = src.get(key[1]) or {}
        year_ok = (e.get("catalog_year") or year) == year
        new = dict(sc)
        if part == "A":
            bare = dict(filed, score={k: v for k, v in sc.items() if k not in ("gaps", "confidence")})
            got = answer(bare)
            if not got:
                left_out.append({"part": "A", "college": key[0], "control_number": key[1],
                                 "why": "the corrected rules name no gap"})
                continue
            name, words = got
            new["gaps"] = [{"gap": name, "label": GAPS[name], "words": words}]
            new["confidence"] = confidence(filed, name, e.get("method"), year_ok)
        elif part == "B":
            arith = sc.get("arithmetic") or {}
            if arith.get("pass") or not collectable(sc) or sc.get("gaps"):
                left_out.append({"part": "B", "college": key[0], "control_number": key[1],
                                 "why": "passes, fails coverage or invented, or already files a gap"})
                continue
            name, words = plan[key]
            why = (HOLD_NO_UNITS_PRINTED if name == "no_units_printed" else
                   (HOLD_FIGURES % figures_differ_fails(filed)) if figures_differ_fails(filed) else None)
            if why:
                held_out.append({"part": "B", "college": key[0], "control_number": key[1], "gap": name, "why": why})
                continue
            new["gaps"] = [{"gap": name, "label": GAPS[name], "words": words}]
            new["confidence"] = confidence(filed, name, e.get("method"), year_ok)
        else:
            if not (sc.get("arithmetic") or {}).get("pass") or sc.get("gaps"):
                left_out.append({"part": "C", "college": key[0], "control_number": key[1],
                                 "why": "its units check does not pass, or it files a gap"})
                continue
            name, words = None, None
            conf = confidence(filed, None, e.get("method"), year_ok)
            conf["unit_arithmetic"] = A5_SCORE
            new["confidence"] = conf
            new["confidence_notes"] = {"unit_arithmetic": A5_NOTE}
        if new == sc:
            unchanged.append({"part": part, "college": key[0], "control_number": key[1]})
            continue
        rows.append({"part": part, "college": key[0], "control_number": key[1], "award": filed.get("award"),
                     "extracted_run": filed.get("extracted_run"), "gap": name, "words": words,
                     "confidence": new["confidence"], "measure": ((filed.get("record") or {}).get("program")
                                                                   or {}).get("measure"),
                     "path": os.path.relpath(path, ROOT), "_filed": filed, "_score": new})
    missing_plan = sorted(set(plan) - seen_plan)
    missing_a5 = sorted(A5_FIVE - seen_a5)
    if write:
        before = _load_images({r["college"] for r in rows})
        for r in rows:
            img = before[(r["college"], str(r["control_number"]))]
            r["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                     "measure", "total_min", "total_max", "record", "checks",
                                                     "extracted_run")}
            r["_filed"]["score"] = r["_score"]
            with open(os.path.join(ROOT, r["path"]), "w", encoding="utf-8") as fh:
                json.dump(r["_filed"], fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        after = _load_images({r["college"] for r in rows})
        for r in rows:
            img = after[(r["college"], str(r["control_number"]))]
            if img["record"] != r["before_image"]["record"]:
                raise SystemExit("the plan changed the record of %s %s" % (r["college"], r["control_number"]))
            r["after_image"] = {"checks": img["checks"]}
    for r in rows:
        r.pop("_filed"), r.pop("_score")
    order = {"A": 0, "B": 1, "C": 2}
    rows.sort(key=lambda r: (order[r["part"]], r["college"], r["control_number"]))
    for i, r in enumerate(rows, 1):
        r["i"] = i
    s680_left = sorted((x["college"], x["control_number"]) for x in left_out + unchanged if x["part"] == "A")
    return {"rows": rows, "left_out": left_out, "unchanged": unchanged, "held_out": held_out,
            "missing_plan": missing_plan,
            "s680_left": s680_left,
            "missing_a5": missing_a5,
            "by_part": dict(collections.Counter(r["part"] for r in rows)),
            "by_gap": {p: dict(collections.Counter(r["gap"] or "none" for r in rows if r["part"] == p))
                       for p in PARTS}}


V3 = ("with v(i, part, college, control_number, extracted_run, before_record, before_checks, after_checks) as "
      "(values\n  %s)")


def _values3(rows: list[dict]) -> str:
    return ",\n  ".join("(%d, %s, %s, %s, %d, %s, %s, %s)" % (
        r["i"], _q(r["part"]), _q(r["college"]), _q(r["control_number"]), int(r["extracted_run"]),
        _jb(r["before_image"]["record"]), _jb(r["before_image"]["checks"]), _jb(r["after_image"]["checks"]))
        for r in rows)


def pre_read3_sql(rows: list[dict]) -> str:
    """One SELECT, one JSON value: per part, the rows as they stand live before the UPDATE."""
    parts = sorted({r["part"] for r in rows})
    per = ",\n".join(
        "  %s, json_build_object('listed', count(*) filter (where v.part = %s), "
        "'on_run', count(*) filter (where v.part = %s and r.extracted_run = v.extracted_run), "
        "'both_before', count(*) filter (where v.part = %s and r.extracted_run = v.extracted_run "
        "and r.record = v.before_record and r.checks = v.before_checks), "
        "'already_after', count(*) filter (where v.part = %s and r.checks = v.after_checks), "
        "'checked_now', count(*) filter (where v.part = %s and r.checked))" % ((_q(p),) * 6)
        for p in parts)
    return (V3 % _values3(rows) + "\n"
            "select json_build_object(\n"
            "  'listed', (select count(*) from v),\n"
            "  'matched', count(*),\n"
            "  'both_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record "
            "and r.checks = v.before_checks),\n"
            "  'checked_now', count(*) filter (where r.checked),\n" + per + ")\n"
            "  from v join public.program_requirement_records r\n"
            "    on r.college = v.college and r.control_number = v.control_number;")


def update3_sql(rows: list[dict], tag: str = "s681 named-gaps") -> str:
    return GS.guarded(V3 % _values3(rows), _update("after", "before"), len(rows), tag)


def rollback3_sql(rows: list[dict], tag: str = "s681 named-gaps rollback") -> str:
    return GS.guarded(V3 % _values3(rows), _update("before", "after"), len(rows), tag, rollback=True)


def write_s681(res: dict, receipt_path: str, day: str, tag: str) -> list[str]:
    rows = res["rows"]
    bp = res["by_part"]
    gaps = "; ".join("part %s %d (%s)" % (p, bp.get(p, 0), ", ".join("%s %d" % kv for kv in sorted(g.items())))
                     for p, g in res["by_gap"].items())
    hdr = ("-- %s named gaps, one plan in three parts: %s.\n"
           "-- A: %s. B: %s. C: %s.\n"
           "-- Receipt: %s (before_image and after_image per row). Parts B and C leave out the\n"
           "-- held colleges (HELD_S681 in kb/_program_named_gaps.py, frozen in the receipt) and the parked ones.\n"
           % (tag.upper(), gaps, PARTS["A"], PARTS["B"], PARTS["C"], receipt_path))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_named_gaps_" % (day, tag))
    parts = {
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value, per part.\n" + pre_read3_sql(rows),
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks\n"
                      "-- (for part A, the image the S680 apply wrote), and no person's check. It aborts, writing\n"
                      "-- nothing, unless it matches the plan's %d rows less those a person checked.\n"
                      % len(rows) + update3_sql(rows, tag + " named-gaps")),
        "rollback.sql": ("-- Rollback, NOT applied: each row's before-image checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked.\n"
                         "-- THE UNDO ORDER. This rollback runs first. Only then, to go further back:\n"
                         "--   kb/migrations/2026-11-18_s680_prreq_named_gaps_rollback.sql, part A's rows back to the\n"
                         "--     image before S680. It names all 75 S680 rows: the %d here and the %d this plan leaves on\n"
                         "--     the S680 image (%s); edit its expect line if another plan has moved one of those since;\n"
                         "--   kb/migrations/2026-11-18_s680_prreq_units_rules_rollback_rows.sql, the units rules' full-row\n"
                         "--     rows. It aborts on part C's five A5 rows until this rollback has run, since their checks\n"
                         "--     carry this plan's scores until then.\n"
                         "-- A rollback lasts only until the next load of that college: revert the record files too.\n"
                         % (sum(1 for r in rows if r["part"] == "A"), len(res["s680_left"]),
                            ", ".join("%s %s" % k for k in res["s680_left"]))
                         + rollback3_sql(rows, tag + " named-gaps rollback")),
    }
    out = []
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
        out.append(base + name)
    return out


# ── the S684 pass: a re-read wave's records take their gap again ───────────
# f-reread-replaces-labeled-rows-s683: step=reread replaced live rows the S680 and S681 applies had labeled, and the
# label went with the old record. The pass names each re-read record's gap again by the same two routes: the record
# rules (run, part A here) and #3502's plan with its sentence check (plan_s681's part B). Only a record whose
# extracted_run is one of the wave's runs (each college's reread_keep_better.json account) at a named college joins,
# never one at a held or parked college, and never a control number the conductor's live read lists as checked.
PARTS_WAVE = {"A": "a re-read record a record rule names a gap for (no_units_read, no_hours_read, major_total_differs)",
              "B": "a re-read record #3502's plan names, meeting its gap's own sentence "
                   "(kb/program_requirements_reread_plan_s680.json)"}


def wave_runs(colleges, base: str = COLLEGE_DIR) -> dict:
    """{college: {extracted runs}} from each named college's reread_keep_better.json account."""
    out = {}
    for path in sorted(glob.glob(os.path.join(base, "*", "reread_keep_better.json"))):
        with open(path, encoding="utf-8") as fh:
            acct = json.load(fh)
        if acct.get("college") in colleges:
            out.setdefault(acct["college"], set()).update(str(r) for r in (acct.get("runs") or {}))
    return out


def plan_wave(write: bool, colleges: tuple, skip: tuple = (), checked: frozenset = frozenset()) -> dict:
    """The wave's rows in plan_s681's row shape (part A the record rules, part B #3502's plan), with the load's image
    before and after each record file is rewritten. checked: {(college, control number)} a person checked live."""
    runs = wave_runs(set(colleges))
    missing = sorted(set(colleges) - set(runs))
    if missing:
        raise SystemExit("no reread_keep_better.json account names %s: the college name is not the records' own"
                         % ", ".join(missing))
    plain = run(write=False, skip=skip)
    if plain["recall"]["wrong"]:
        raise SystemExit("the recall is wrong on %d records: no plan is written" % plain["recall"]["wrong"])
    three = plan_s681(write=False, skip=skip)
    on_wave = lambda r: (r["college"] in runs and str(r["extracted_run"]) in runs[r["college"]])  # noqa: E731
    rows, left_out = [], []
    for m in plain["moved"]:
        x = {"part": "A", "college": m["college"], "control_number": str(m["control_number"]), "award": m["award"],
             "extracted_run": m["extracted_run"], "gap": m["gap"], "words": m["words"], "confidence": m["confidence"],
             "path": m["path"]}
        rows.append(x)
    for r in three["rows"]:
        if r["part"] == "B":
            rows.append(dict(r, control_number=str(r["control_number"])))
        elif r["college"] in runs:
            left_out.append({"part": r["part"], "college": r["college"], "control_number": r["control_number"],
                             "why": "plan_s681's part %s: not this pass" % r["part"]})
    kept = []
    for r in rows:
        why = ("not a named college" if r["college"] not in runs else
               "not a run of the wave" if not on_wave(r) else
               "a person checked the live row" if (r["college"], r["control_number"]) in checked else None)
        if why:
            left_out.append({"part": r["part"], "college": r["college"], "control_number": r["control_number"],
                             "why": why})
        else:
            kept.append(r)
    rows = kept
    if write:
        before = _load_images({r["college"] for r in rows})
        for r in rows:
            k = (r["college"], r["control_number"])
            if k not in before:
                raise SystemExit("the load does not post %s %s" % k)
            img = before[k]
            r["before_image"] = {k2: img[k2] for k2 in ("program_title", "award", "catalog_year", "source_url",
                                                        "measure", "total_min", "total_max", "record", "checks",
                                                        "extracted_run")}
            path = os.path.join(ROOT, r["path"])
            with open(path, encoding="utf-8") as fh:
                filed = json.load(fh)
            if filed["score"].get("gaps"):
                raise SystemExit("%s %s already files a gap" % k)
            filed["score"]["gaps"] = [{"gap": r["gap"], "label": GAPS[r["gap"]], "words": r["words"]}]
            filed["score"]["confidence"] = r["confidence"]
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        after = _load_images({r["college"] for r in rows})
        for r in rows:
            img = after[(r["college"], r["control_number"])]
            if img["record"] != r["before_image"]["record"]:
                raise SystemExit("the plan changed the record of %s %s" % (r["college"], r["control_number"]))
            r["after_image"] = {"checks": img["checks"]}
    rows.sort(key=lambda r: (r["part"], r["college"], r["control_number"]))
    for i, r in enumerate(rows, 1):
        r["i"] = i
    held_out = [x for x in three["held_out"] if x["college"] in runs]
    return {"rows": rows, "left_out": left_out, "held_out": held_out, "runs": {c: sorted(v) for c, v in runs.items()},
            "by_part": dict(collections.Counter(r["part"] for r in rows)),
            "by_gap": dict(collections.Counter(r["gap"] for r in rows)),
            "by_college": dict(sorted(collections.Counter(r["college"] for r in rows).items())),
            "recall": plain["recall"]}


def write_wave(res: dict, receipt_path: str, day: str, tag: str) -> list[str]:
    rows = res["rows"]
    hdr = ("-- %s named gaps over the S683 re-read wave: %s.\n"
           "-- A: %s. B: %s.\n"
           "-- Receipt: %s (before_image and after_image per row). Only records whose extracted_run is a run of\n"
           "-- the wave at the named colleges; never a held, parked or checked one.\n"
           % (tag.upper(), ", ".join("%s %d" % kv for kv in sorted(res["by_gap"].items())), PARTS_WAVE["A"],
              PARTS_WAVE["B"], receipt_path))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_named_gaps_" % (day, tag))
    parts = {
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value, per part.\n" + pre_read3_sql(rows),
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d rows less\n"
                      "-- those a person checked.\n" % len(rows) + update3_sql(rows, tag + " named-gaps")),
        "rollback.sql": ("-- Rollback, NOT applied: each row's before-image checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked. A rollback lasts only until the\n"
                         "-- next load of that college: revert the record files too (git revert of this plan's commit).\n"
                         + rollback3_sql(rows, tag + " named-gaps rollback")),
    }
    out = []
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
        out.append(base + name)
    return out


def read_checked_keys(path: str | None) -> frozenset:
    """{(college, control number)} from the conductor's live read ({"by_college": {college: [control numbers]}})."""
    if not path:
        raise SystemExit("--wave needs --checked: the live read of checked rows (by_college)")
    with open(path, encoding="utf-8") as fh:
        by = json.load(fh).get("by_college")
    if not isinstance(by, dict) or not all(isinstance(v, list) for v in by.values()):
        raise SystemExit("%s has no by_college object of lists" % path)
    return frozenset((c, str(n)) for c, v in by.items() for n in v)


def replan_applied(body: dict, migrate: dict, applied_from: str, tag: str = "s680") -> dict:
    """The receipt after the apply, in place, without rescoring (Rule 10 a2; the shape of #3496's replan): the rows
    the migrate receipt returned are marked applied and the rollback is rebuilt from those rows alone. The apply's
    guard matched each returned row on the filed run and the before-image's record and checks, so the before-image
    a returned row carries is the value the row held. Places i never change, so a returned key still names its row."""
    import _program_requirements_rescore as RS
    got = RS.returned_value(migrate)
    by_i = {r["i"]: r for r in body["records"]}
    keys = got["keys"]
    stray = [i for i in keys if i not in by_i]
    if stray:
        raise ValueError("returned places outside the plan: %s" % stray[:10])
    if len(set(keys)) != len(keys):
        raise ValueError("the response lists a place twice")
    rows = [by_i[i] for i in sorted(keys)]
    for r in rows:
        r["applied"] = {"from": applied_from}
    body["applied"] = {"from": applied_from, "returned": len(rows), "keys": [r["i"] for r in rows],
                       "skipped_checked": got.get("skipped_checked") or []}
    body["rollback"] = rollback_sql(rows, "%s named-gaps rollback" % tag)
    return body


def write_rollback(body: dict, receipt: str, day: str, tag: str) -> str:
    """The rollback alone as a committed file: the pre-read and the apply ran as committed (the migrate receipts
    hold their sha256) and stay as they ran."""
    ap_ = body["applied"]
    hdr = ("-- %s cheap piles, item 4: named gaps (%s). Each row's checks became the college load's image of its\n"
           "-- committed record (load_rows): checks.gaps and checks.confidence added, checks.arithmetic and the record\n"
           "-- unchanged. Receipt: %s (before_image per row).\n"
           "-- The collection lane's twelve colleges (kb/collection_lane.py) and the parked colleges are not in the list.\n"
           % (tag.upper(), ", ".join("%s %d" % kv for kv in sorted(body["by_gap"].items())), receipt))
    path = os.path.join(HERE, "migrations", "%s_%s_prreq_named_gaps_rollback.sql" % (day, tag))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(hdr + "-- Rollback, NOT applied: the %d rows the apply returned (%s), the before-image's checks\n"
                 "-- back where the row still holds the after-image, skipping and listing a row a person checked; it\n"
                 "-- aborts unless it matches those rows less the checked ones (edit expect for a partial rollback).\n"
                 "-- A rollback lasts only until the next load of that college: the load posts the committed\n"
                 "-- record files, which still carry score.gaps, so revert those files too (git revert of this\n"
                 "-- plan's commit) or the next load writes the gaps back.\n"
                 % (ap_["returned"], ap_["from"]) + body["rollback"] + "\n")
    return path


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s680")
    ap.add_argument("--skip-college", action="append", default=[])
    ap.add_argument("--three-part", action="store_true",
                    help="S681: write the one plan in three parts (A corrective, B #3502's records, C A5's five)")
    ap.add_argument("--receipt", help="replan this receipt after the apply (no rescoring); needs --applied")
    ap.add_argument("--applied", help="the apply's migrate receipt: mark its rows applied and rebuild the rollback "
                                      "from them")
    ap.add_argument("--wave", action="store_true",
                    help="S684: name the gaps again on the records a re-read wave filed, at the --college names")
    ap.add_argument("--college", action="append", default=[], help="with --wave: a college of the wave (repeat)")
    ap.add_argument("--checked", help="with --wave: the conductor's live read of checked rows (by_college)")
    a = ap.parse_args(argv)
    if a.wave:
        if not a.college:
            ap.error("--wave needs --college")
        checked = read_checked_keys(a.checked)
        res = plan_wave(write=not a.dry_run, colleges=tuple(a.college), skip=tuple(a.skip_college), checked=checked)
        print("wave plan: %d rows (%s); by gap %s; by college %s" % (
            len(res["rows"]), ", ".join("part %s %d" % kv for kv in sorted(res["by_part"].items())),
            ", ".join("%s %d" % kv for kv in sorted(res["by_gap"].items())),
            ", ".join("%s %d" % kv for kv in res["by_college"].items())))
        for x in res["left_out"]:
            print("  left out: part %(part)s %(college)s %(control_number)s (%(why)s)" % x)
        for x in res["held_out"]:
            print("  held out: %(college)s %(control_number)s %(gap)s (%(why)s)" % x)
        if a.dry_run or not res["rows"]:
            return 0
        day = time.strftime("%Y-%m-%d", time.gmtime())
        path = os.path.join(RECEIPTS, "program_requirement_records_named_gaps_%s_%s.json" % (day, a.tag))
        rows = res["rows"]
        body = {"rule": RULING, "gaps": GAPS, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "why": "f-reread-replaces-labeled-rows-s683: the wave's re-reads replaced labeled rows",
                "parts": PARTS_WAVE, "colleges": list(a.college), "held_colleges": list(a.skip_college),
                "wave_runs": res["runs"], "checked_excluded": sorted(list(k) for k in checked
                                                                    if k[0] in set(a.college)),
                "collected": len(rows), "by_part": res["by_part"], "by_gap": res["by_gap"],
                "by_college": res["by_college"], "held_out": res["held_out"], "left_out": res["left_out"],
                "recall": res["recall"], "records": rows,
                "pre_read": pre_read3_sql(rows), "apply": update3_sql(rows, a.tag + " named-gaps"),
                "rollback": rollback3_sql(rows, a.tag + " named-gaps rollback")}
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(body, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        for f in write_wave(res, os.path.relpath(path, ROOT), day, a.tag):
            print("wrote %s" % os.path.relpath(f, ROOT))
        print("receipt %s" % os.path.relpath(path, ROOT))
        return 0
    if a.three_part:
        res = plan_s681(write=not a.dry_run, skip=tuple(a.skip_college))
        print("plan: %s; held out %d; left out %d; unchanged %d; #3502 records not found %d; A5 rows not found %d" % (
            ", ".join("%s %d" % kv for kv in sorted(res["by_part"].items())), len(res["held_out"]), len(res["left_out"]),
            len(res["unchanged"]), len(res["missing_plan"]), len(res["missing_a5"])))
        for p, g in res["by_gap"].items():
            print("  part %s: %s" % (p, ", ".join("%s %d" % kv for kv in sorted(g.items()))))
        for x in res["left_out"]:
            print("  left out: part %(part)s %(college)s %(control_number)s (%(why)s)" % x)
        for x in res["held_out"]:
            print("  held out: %(college)s %(control_number)s %(gap)s (%(why)s)" % x)
        if a.dry_run or not res["rows"]:
            return 0
        day = time.strftime("%Y-%m-%d", time.gmtime())
        path = os.path.join(RECEIPTS, "program_requirement_records_named_gaps_%s_%s.json" % (day, a.tag))
        rows = res["rows"]
        body = {"rule": RULING, "gaps": GAPS, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "parts": PARTS, "held_colleges": list(HELD_S681) + list(a.skip_college),
                "held_applies_to": "parts B and C; part A takes every row the S680 apply wrote",
                "planned_from": os.path.relpath(REREAD_PLAN, ROOT), "a5_note": A5_NOTE, "a5_score": A5_SCORE,
                "collected": len(rows), "by_part": res["by_part"], "by_gap": res["by_gap"],
                "held_out": res["held_out"], "may_continue_reviewed": [list(k) + [w] for k, w in
                                                                      sorted(MAY_CONTINUE_REVIEWED.items())],
                "may_continue_next": MAY_CONTINUE_NEXT,
                "left_out": res["left_out"], "unchanged": res["unchanged"], "missing_plan": res["missing_plan"],
                "missing_a5": res["missing_a5"], "records": rows,
                "pre_read": pre_read3_sql(rows), "apply": update3_sql(rows, a.tag + " named-gaps"),
                "rollback": rollback3_sql(rows, a.tag + " named-gaps rollback")}
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(body, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        for f in write_s681(res, os.path.relpath(path, ROOT), day, a.tag):
            print("wrote %s" % os.path.relpath(f, ROOT))
        print("receipt %s" % os.path.relpath(path, ROOT))
        return 0
    if a.receipt or a.applied:
        if not (a.receipt and a.applied):
            ap.error("--receipt and --applied go together")
        with open(a.receipt, encoding="utf-8") as fh:
            body = json.load(fh)
        with open(a.applied, encoding="utf-8") as fh:
            mig = json.load(fh)
        rel = lambda p: os.path.relpath(os.path.abspath(p), ROOT)  # noqa: E731
        replan_applied(body, mig, rel(a.applied), a.tag)
        with open(a.receipt, "w", encoding="utf-8") as fh:
            json.dump(body, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        day = re.search(r"_(\d{4}-\d{2}-\d{2})_", os.path.basename(a.receipt)).group(1)
        out = write_rollback(body, rel(a.receipt), day, a.tag)
        print("replanned: %d rows applied (%s), rollback %s" % (body["applied"]["returned"], rel(a.applied), rel(out)))
        return 0
    r = run(write=not a.dry_run, skip=tuple(a.skip_college))
    print("records collected with a named gap: %d (%s)" % (len(r["moved"]), ", ".join(
        "%s %d" % kv for kv in sorted(r["by_gap"].items())) or "none"))
    print("labels on programs with no record: %d (%s)" % (len(r["labels"]), ", ".join(
        "%s %d" % kv for kv in sorted(r["labels_by_gap"].items())) or "none"))
    rc = r["recall"]
    print("recall on %d failing records whose answer is held: right %d, wrong %d (%s)" % (
        rc["held"], rc["right"], rc["wrong"], ", ".join("%s %d" % kv for kv in sorted(rc["by_answer"].items()))))
    for w in rc["wrong_keys"][:10]:
        print("  wrong: %(college)s %(control_number)s held %(held)s, rule %(rule)s" % w)
    for n, c in r["matcher_recall"].items():
        print("matcher recall %s: %s" % (n, ", ".join("%s %d" % kv for kv in c.items())))
    if rc["wrong"]:
        raise SystemExit("the recall is wrong on %d records: no plan is written" % rc["wrong"])
    if a.dry_run:
        return 0
    held = list(CL.COLLECTION_LANE_S680) + list(a.skip_college)
    with open(LABELS_OUT, "w", encoding="utf-8") as fh:
        json.dump({"rule": RULING, "gaps": GAPS, "held_colleges": held, "labeled": len(r["labels"]),
                   "by_gap": r["labels_by_gap"], "labels": r["labels"]}, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    if not r["moved"]:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(RECEIPTS, "program_requirement_records_named_gaps_%s_%s.json" % (day, a.tag))
    n = len(r["moved"])
    body = {"rule": RULING, "gaps": GAPS, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "held_colleges": held, "collected": n, "by_gap": r["by_gap"],
            "recall": r["recall"], "matcher_recall": r["matcher_recall"], "records": r["moved"],
            "decided": ("The %d records count as collected with the gap named (the S680 conductor, on Sam's rule of "
                        "2026-11-17: never drop a record for failing; collect it with gaps noted and scores)." % n),
            "representation": ("checks.gaps (a list of gap names, keys of gaps) and checks.confidence (five scores "
                               "0-100) added to program_requirement_records.checks; checks.arithmetic unchanged"),
            "pre_read": pre_read_sql(r["moved"]), "apply": update_sql(r["moved"]),
            "rollback": rollback_sql(r["moved"])}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    write_migrations(body, os.path.relpath(path, ROOT), day, a.tag)
    print("receipt %s" % os.path.relpath(path, ROOT))
    return 0


def write_migrations(body: dict, receipt: str, day: str, tag: str) -> None:
    """The pre-read, the apply and the rollback as committed files beside the receipt."""
    n = body["collected"]
    hdr = ("-- %s cheap piles, item 4: named gaps (%s). Each row's checks become the college load's image of its\n"
           "-- committed record (load_rows): checks.gaps and checks.confidence added, checks.arithmetic and the record\n"
           "-- unchanged. Receipt: %s (before_image per row).\n"
           "-- The collection lane's twelve colleges (kb/collection_lane.py) and the parked colleges are not in the list.\n"
           % (tag.upper(), ", ".join("%s %d" % kv for kv in sorted(body["by_gap"].items())), receipt))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_named_gaps_" % (day, tag))
    parts = {
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d rows less\n"
                      "-- those a person checked (listed as skipped_checked).\n" % n + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked.\n"
                         "-- A rollback lasts only until the next load of that college: the load posts the committed\n"
                         "-- record files, which still carry score.gaps, so revert those files too (git revert of this\n"
                         "-- plan's commit) or the next load writes the gaps back.\n" + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")


if __name__ == "__main__":
    sys.exit(main())
