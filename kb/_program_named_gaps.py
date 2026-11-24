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
  total_not_printed    a program kb/program_total_not_printed.json lists, read from its page: the catalog prints no
                       program total, the record's one arithmetic reason (S691). Unit arithmetic scores 40.
  total_differs        a program kb/program_total_differs.json lists with its page's two figures, the total it prints
                       and what its own printed units add to, which differ; the record must read both exactly (S697,
                       Clovis's Elementary Teacher Level 2: 19 against 16). Unit arithmetic scores 50.

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
    python3 kb/_program_named_gaps.py --gap total_not_printed --tag s697   # S697: one gap's records alone, the
                                                    # label file untouched
    python3 kb/_program_named_gaps.py --gap total_differs --tag s697p2    # S697 piles2: the same for total_differs
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
    # S691: the catalog's section prints its lists' figures and no program total, read from the page itself and
    # listed in kb/program_total_not_printed.json (Santa Monica's Pilates and Yoga certificates).
    "total_not_printed": "The catalog prints no total for this program, so its units cannot be checked against one.",
    # S697: the page prints a program total its own printed figures do not add to, read from the page itself and
    # listed with both figures in kb/program_total_differs.json (Clovis's Elementary Teacher Level 2: 19 against 16).
    "total_differs": "The catalog prints a total for this program that its own printed units do not add to.",
    # S703 (census lever 3, the noncredit hours total): a program measured in hours whose courses carry their hours.
    "hours_total_not_read": ("A program measured in hours: its courses carry their hours, and no program total was "
                             "read, so its hours cannot be checked against one."),
    "hours_within_printed_range": ("A program measured in hours: its courses' hours as read fall within the printed "
                                   "range of hours rather than matching it."),
    "hours_total_differs": ("A program measured in hours: its courses' hours as read add to a figure other than "
                            "the program's printed total."),
    # S703 (census lever 2): the degree names a general education pattern and no units for it were read; its major
    # adds up to the major total the page prints, so the general education units are all that is missing.
    "ge_units_not_read": ("The degree names a general education pattern, and no units for it were read, so the "
                          "degree's units cannot be added. Its major adds up to the printed major total."),
    # S703 (the catalog-wording lever at Santa Monica and Santa Rosa Junior): the catalog counts each choice list at
    # its printed figure, and its figures add to the printed total, while the list's own courses carry more.
    "lists_past_their_figure": ("The catalog's figures add up to its printed total, counting each list at its "
                                "printed figure; the courses in a list carry more units than that figure."),
    # S713 (lane 2's cheap piles at Santa Rosa Junior): the program's section runs onto a page the read did not hold,
    # so part of its requirements is missing from the record. Collected with the gap named, never reread (Sam,
    # 2026-11-17: gaps noted instead of rereads).
    "section_cut_off": ("The program's section runs onto a page the read did not hold, so part of its requirements "
                        "is missing from the record and its units cannot be checked against the printed total."),
}
ARITH_SCORE = {"major_total_differs": 30, "no_units_printed": 40, "no_units_read": 20, "no_hours_read": 20,
               "catalog_figures_differ": 50, "total_not_printed": 40, "total_differs": 50, "ge_units_not_read": 50,
               "hours_total_not_read": 40, "hours_within_printed_range": 50, "hours_total_differs": 30,
               "lists_past_their_figure": 60, "section_cut_off": 20}
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
    if clm is not None and (may_continue(filed) or gap == "section_cut_off"):
        # A record whose section runs past the read (S713) places the courses it read, not the program's list.
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
TOTAL_NOT_PRINTED = os.path.join(HERE, "program_total_not_printed.json")
NO_TOTAL_WHY = "the record names no total"


def total_not_printed_list(path: str = TOTAL_NOT_PRINTED) -> dict:
    """{(college, control number): entry} from the committed file: pages a session read, never a pattern."""
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError:
        return {}
    return {(college, str(cn)): e for college, rows in (data.get("colleges") or {}).items() for cn, e in rows.items()}


def total_not_printed(filed: dict, listed: dict | None = None) -> str | None:
    """A listed program whose only arithmetic reason is that it names no total: the catalog prints none (S691)."""
    listed = total_not_printed_list() if listed is None else listed
    e = listed.get((filed.get("college"), str(filed.get("control_number"))))
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if not e or a.get("pass") or a.get("status") != "incomplete" or a.get("why") != [NO_TOTAL_WHY] \
            or not collectable(sc):
        return None
    return "the catalog prints no program total (PDF p.%s; college-page-read run %s)" % (e.get("page"), e.get("run"))


# S697: a program whose page prints a total its own printed figures do not add to (Clovis's Elementary Teacher Level 2
# 42234: six courses printed at 3, 4, 3, 3, 3 and 3 units under "Total Units: 16"). A session reads the page and files
# both figures as the page prints them (kb/program_total_differs.json): printed_total, the program's own total, and
# printed_sum, what the page's own units add to. The held answer is the file's: a listed program whose two figures
# differ. The rule asks one thing more, that the record read both figures as the page prints them, so a record that
# misread a list keeps failing without a gap (and the self-recall counts it wrong).
TOTAL_DIFFERS = os.path.join(HERE, "program_total_differs.json")


def total_differs_list(path: str = TOTAL_DIFFERS) -> dict:
    """{(college, control number): entry} from the committed file: pages a session read, never a pattern."""
    return total_not_printed_list(path)


def _differs(e: dict) -> bool:
    pt, ps = _pair(e.get("printed_total")), _pair(e.get("printed_sum"))
    return bool(pt and ps and (abs(pt[0] - ps[0]) > FIG_EPS or abs(pt[1] - ps[1]) > FIG_EPS))


def total_differs(filed: dict, listed: dict | None = None) -> str | None:
    """A listed program whose page's own figures disagree, read by the record exactly as the page prints them."""
    listed = total_differs_list() if listed is None else listed
    e = listed.get((filed.get("college"), str(filed.get("control_number"))))
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if not e or not _differs(e) or a.get("pass") or a.get("status") != "unequal" or a.get("against") != "program" \
            or not collectable(sc):
        return None
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    pt, ps = _pair(e["printed_total"]), _pair(e["printed_sum"])
    if comp is None or st is None or any(abs(x - y) > FIG_EPS for x, y in zip(comp + st, ps + pt)):
        return None
    return "the catalog prints a total of %s, and its own figures add to %s (%s; college-page-read run %s)" % (
        S._fig(*pt), S._fig(*ps), e.get("where") or "PDF p.%s" % e.get("page"), e.get("run"))


# S703 (census lever 3, 100 programs on 2026-11-21): a program measured in hours (record.program.measure "hours")
# whose courses' hours as read add to more than zero. Three shapes, each the record's one arithmetic reason:
#   hours_total_not_read        the scorer's only reason is "the record names no total" (40): the courses carry
#                               hours, and no program total was read;
#   hours_within_printed_range  the hours add to a figure the printed range holds, neither end of it (50): Laney's
#                               ESOL pages print "172-245" hours over courses that add to a figure between;
#   hours_total_differs         the hours add to any other figure than the printed total (30, as COBIx's D2 scores a
#                               major total that differs from the catalog).
# A record whose hours add to zero, or whose printed total is zero, reads no hours: it takes none of these.
# The second reader's held-out records on #3679 (S703; decided d-hours-gaps-hold-misreads-s703). Each takes no hours
# gap: a reread or a reconcile step from the page's own wording passes eight of them, ten were read from text that
# lacks the program's own section, and one differs from its printed total by a rounding the scorer should settle.
HOURS_REREAD_WHY = "reread or reconcile wording passes it free"
HOURS_NO_SECTION_WHY = "text lacks the program section"
HOURS_ROUNDING_WHY = "235.5 against 235.4: a scorer rounding question, not a gap"
HELD_HOURS = {
    # (a) the reading its own heading or note names passes it.
    ("Laney College", "38970"): HOURS_REREAD_WHY, ("Laney College", "39365"): HOURS_REREAD_WHY,
    ("Laney College", "39366"): HOURS_REREAD_WHY, ("Laney College", "39368"): HOURS_REREAD_WHY,
    ("Laney College", "43451"): HOURS_REREAD_WHY,      # "min 47/172/158 hours" read as a list of rule all
    ("De Anza College", "41176"): HOURS_REREAD_WHY,    # ESL 400 "need not be taken"
    ("Mendocino College", "43158"): HOURS_REREAD_WHY,  # the second list is optional
    ("Coastline Community College", "42718"): HOURS_REREAD_WHY,  # "Subtotal 120-288" is the program total
    # (b) hours_total_not_read read from text without the program's own section.
    ("Los Angeles City College", "24099"): HOURS_NO_SECTION_WHY,
    ("West Los Angeles College", "30369"): HOURS_NO_SECTION_WHY,
    ("West Los Angeles College", "45311"): HOURS_NO_SECTION_WHY,
    ("Porterville College", "44805"): HOURS_NO_SECTION_WHY, ("Ventura College", "40179"): HOURS_NO_SECTION_WHY,
    **{("Pasadena City College", cn): HOURS_NO_SECTION_WHY for cn in ("33140", "33141", "33142", "33143", "33144")},
    ("Reedley College", "42457"): HOURS_ROUNDING_WHY,
}
# What a no-total hours record's notes say of the text it was read from (#3679 second reader, finding 2):
# "section_missing" where a note says the program's own section, heading or requirements are not in the text
# (it begins mid-section, is cut off before the requirements, or is a course listing), "says_no_total" where one
# says no program total is printed, else "silent". hours_total_not_read is held on section_missing.
HOURS_SECTION_MISSING = re.compile(
    r"\b(?:excerpt|text)\s+begins\s+mid-?(?:section|entry)|\bbegins\s+mid-?section\b"
    r"|\bcut\s+off\s+before\s+the\s+requirements|\bnot\s+a\s+program\s+requirements\s+(?:section|page)\b"
    r"|\bno\s+program\s+section\b"
    r"|\b(?:heading|total\s+hours)[^.;]{0,80}\b(?:on|at\s+the\s+bottom\s+of)\s+the\s+(?:preceding|previous)\s+page\b",
    re.I)
HOURS_SAYS_NO_TOTAL = re.compile(r"\bno\s+(?:program\s+)?total(?:\s+hours)?\s+(?:is|are)?\s*(?:printed|stated)\b"
                                 r"|\bno\s+total\s+hours\s+are\s+(?:printed|stated)\b", re.I)


def hours_claim(filed: dict) -> str:
    """section_missing, says_no_total or silent: what an hours record's notes say of its text."""
    notes = " ".join(n if isinstance(n, str) else json.dumps(n) for n in (filed.get("record") or {}).get("notes") or [])
    if HOURS_SECTION_MISSING.search(notes):
        return "section_missing"
    return "says_no_total" if HOURS_SAYS_NO_TOTAL.search(notes) else "silent"


def hours_held_out(filed: dict) -> str | None:
    """Why an hours record takes no hours gap: a held key, or (no total read) notes saying its section is missing."""
    why = HELD_HOURS.get((filed.get("college"), str(filed.get("control_number"))))
    if why:
        return why
    a = (filed.get("score") or {}).get("arithmetic") or {}
    if a.get("stated") is None and hours_claim(filed) == "section_missing":
        return HOURS_NO_SECTION_WHY
    return None


def _hours_figures(filed: dict):
    """(sum, printed) of an hours record the arithmetic reads against the program, each a positive (lo, hi), else
    None; printed is None where the record names no total. A held-out record (hours_held_out) reads None."""
    if not hours_measured(filed) or hours_held_out(filed):
        return None
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if a.get("pass") or not collectable(sc) or len(a.get("why") or []) != 1:
        return None
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    if comp is None or comp[1] <= 0 or (st is not None and st[1] <= 0):
        return None
    return comp, st


def hours_total_not_read(filed: dict) -> str | None:
    hf = _hours_figures(filed)
    a = (filed.get("score") or {}).get("arithmetic") or {}
    if not hf or hf[1] is not None or a.get("status") != "incomplete" or a.get("why") != [NO_TOTAL_WHY]:
        return None
    return "the courses carry %s hours as read, and no program total was read" % S._fig(*hf[0])


def _hours_unequal(filed: dict):
    hf = _hours_figures(filed)
    a = (filed.get("score") or {}).get("arithmetic") or {}
    if not hf or hf[1] is None or a.get("status") != "unequal" or a.get("against") != "program":
        return None
    return hf


def _within(comp, st) -> bool:
    return (st[0] + FIG_EPS < comp[0] or comp[1] + FIG_EPS < st[1]) and st[0] - FIG_EPS <= comp[0] \
        and comp[1] <= st[1] + FIG_EPS


def hours_within_printed_range(filed: dict) -> str | None:
    hf = _hours_unequal(filed)
    if not hf or not _within(*hf):
        return None
    return "the courses' hours add to %s, within the printed %s hours" % (S._fig(*hf[0]), S._fig(*hf[1]))


def hours_total_differs(filed: dict) -> str | None:
    hf = _hours_unequal(filed)
    if not hf or _within(*hf):
        return None
    return "the courses' hours add to %s against the printed %s hours" % (S._fig(*hf[0]), S._fig(*hf[1]))


# S703 (census lever 2, 192 programs): a degree whose only arithmetic reason is the scorer's general education
# sentence (degree_check in kb/_program_requirements_score.py: "the record names the degree total and the <pattern>
# pattern, but no units for it"), and whose major check passes, so the major's courses add up to the major total
# the page prints. The gap claims only what the record shows: a pattern named and no units read for it. A later set
# step or statewide Cal-GETC fill that gives the pattern its units rescores the record, which then passes or fails
# on its own figures.
GE_NO_UNITS_WHY = re.compile(r"^the record names the degree total and the (?P<pattern>.+) pattern, but no units for it$")


# The second reader's held-out records on #3678 (S703): each page prints a general education figure, so the free
# ge_units_steps lever (a college set step from the page's own words) passes it, and the gap would take it off that
# lever. Sixteen print one figure for general education and electives together, and the major plus that figure is
# the degree total; five print a figure of their own (Orange Coast 16634 "OCC AS General Education: 21 Units ...
# Total Units 60"; De Anza 45499's 54-unit minimum; Marin 19789 and 19791, 22 or 34; Antelope Valley 43028, 39 or 37).
GE_FIGURE_HELD_WHY = "page prints a GE figure; ge_units_steps passes it free"
HELD_GE_FIGURE = frozenset(
    [("Antelope Valley College", cn) for cn in ("36852", "39295", "40870", "43028")]
    + [("Berkeley City College", cn) for cn in ("31835", "41766", "41902", "42381", "42838")]
    + [("College of Alameda", cn) for cn in ("01129", "01132", "01141", "32765")]
    + [("Las Positas College", cn) for cn in ("09214", "09227", "36235", "38886")]
    + [("Orange Coast College", "16634"), ("De Anza College", "45499"), ("College of Marin", "19789"),
       ("College of Marin", "19791")])

# What the record says of the pattern's units, read from its notes, block names and section heading (#3678 second
# reader, finding 2; decided d-ge-gap-only-where-no-figure-s703): "prints_figure" where a sentence naming general
# education carries a unit figure other than the degree and major totals, "says_none" where one says no units are
# printed for it, else "silent". The gap applies to says_none and silent; a record printing a figure is held out.
# The committed files keep no page text, so the record's own words are what is read.
GE_WORD = re.compile(r"general\s+education|\bG\.?E\.?\b|Cal-?\s?GETC|IGETC|\bCSU\s*GE|LPC-GE|COSGE", re.I)
GE_NONE = re.compile(r"\b(?:no|not|without)\b[^.;]{0,60}?\bunits?\b[^.;]{0,40}?\b(?:printed|given|stated|listed|shown)\b"
                     r"|\bprints?\s+no\b[^.;]{0,40}?\bunits?\b|\bno\s+(?:GE|general\s+education|Cal-?GETC)\s+units?\b"
                     r"|\bunits?\s+(?:are|is)\s+not\s+(?:printed|given|stated|listed|shown)\b", re.I)
# A figure with its unit word, never one the sentence gives the major ("a minimum of 18 semester units in a major":
# Solano 31761).
GE_UNIT_FIGURE = re.compile(r"(?<![\d.])(\d{1,2}(?:\.\d+)?)(?:\s*(?:-|–|to|or)\s*(\d{1,2}(?:\.\d+)?))?\s*"
                            r"(?:semester\s+|quarter\s+)?(?:units?|credits?)\b(?!\s+(?:in|for)\s+(?:a|the)\s+major)", re.I)
# A figure after the pattern's label ("General Education (CalGETC) and Electives 30": Berkeley City 42838).
GE_LABEL_FIGURE = re.compile(r"(?:general\s+education|\bGE\b|Cal-?\s?GETC|IGETC)(?:\s+and\s+electives?)?[^.;\d]{0,30}?"
                             r"[:\s](\d{1,2}(?:\.\d+)?)(?![\d.])"
                             r"(?!\s*(?:semester\s+|quarter\s+)?units?\s+(?:in|for)\s+(?:a|the)\s+major)", re.I)
# A note that says the page prints a figure for a line ("The page prints 34 for 'Completion of General Education
# requirements ...'", "prints '30-33' for": Antelope Valley 36852 and 39295).
GE_PRINTS_FIGURE = re.compile(r"\bprints\s+'?(\d{1,2}(?:\.\d+)?)(?:\s*-\s*(\d{1,2}(?:\.\d+)?))?'?\s+(?:for|as)\b", re.I)
# A sentence that gives its figures to another program ("belong to the preceding program": Porterville 18526).
GE_OTHER_PROGRAM = re.compile(r"\bbelongs?\s+to\s+(?:the\s+)?(?:preceding|previous|next|following|another|other)\b", re.I)


def _ge_sentences(filed: dict) -> list[str]:
    rec = filed.get("record") or {}
    text = [n if isinstance(n, str) else json.dumps(n) for n in rec.get("notes") or []]
    text += [b.get("name") or "" for b in rec.get("blocks") or []]
    text.append(((rec.get("program") or {}).get("section_heading")) or "")
    return [x for t in text for x in re.split(r"(?<=[.!?;])\s+", t) if GE_WORD.search(x)]


def ge_claim(filed: dict) -> str:
    """prints_figure, says_none or silent: what the record's own words say of the general education units."""
    prog = (filed.get("record") or {}).get("program") or {}
    not_ge = {v for v in R._lo_hi(prog.get("degree_total")) if v is not None}
    sents = _ge_sentences(filed)
    for x in sents:
        if GE_OTHER_PROGRAM.search(x):
            continue
        figs = [float(g) for rx in (GE_UNIT_FIGURE, GE_LABEL_FIGURE, GE_PRINTS_FIGURE) for m in rx.finditer(x)
                for g in m.groups() if g]
        if any(6 <= v <= 70 and v not in not_ge for v in figs):
            return "prints_figure"
    return "says_none" if any(GE_NONE.search(x) for x in sents) else "silent"


def _ge_units_shape(filed: dict):
    """The scorer's shape of the gap: (the pattern, the major's printed total), or None."""
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if a.get("pass") or a.get("status") != "incomplete" or a.get("against") != "degree" or not collectable(sc):
        return None
    why = a.get("why") or []
    m = GE_NO_UNITS_WHY.match(why[0]) if len(why) == 1 else None
    major = a.get("major")
    if not m or not isinstance(major, dict) or major.get("pass") is not True:
        return None
    return m.group("pattern"), _pair(major.get("stated"))


def ge_units_held_out(filed: dict) -> str | None:
    """Why a record of the gap's shape is held out of it: a held key, or its own words printing a GE figure."""
    if (filed.get("college"), str(filed.get("control_number"))) in HELD_GE_FIGURE:
        return GE_FIGURE_HELD_WHY
    if ge_claim(filed) == "prints_figure":
        return "the record's own words print a general education figure (%s)" % GE_FIGURE_HELD_WHY
    return None


def ge_units_not_read(filed: dict) -> str | None:
    shape = _ge_units_shape(filed)
    if not shape or ge_units_held_out(filed):
        return None
    pattern, st = shape
    return ("the degree names the %s pattern and no units were read for it; its major adds to the printed %s"
            % (pattern[:120], S._fig(*st) if st else "total"))


# S703 (the catalog-wording lever; S691's "Santa Monica's 12 lists past their figure, 238 statewide"): a program
# whose required lists' courses and choice lists' printed figures add to its printed total exactly, while its sum as
# read passes that total because a choice list's courses carry more units than the list's printed figure (Santa
# Monica's Psychology AA-T 36265: 9 required, three lists printed at 3 each, "18" printed; a list's 4-unit course
# makes the sum 19). Santa Monica and Santa Rosa Junior print their totals this way. The record must carry units on
# every required course and on each of its "or" alternatives; a recommended list counts toward nothing.
def figures_total(filed: dict):
    """(the figures' sum (lo, hi), the lists whose courses pass their figure) or None: each list at its printed
    figure, and a required list that prints none at its courses' units. Santa Monica prints a figure over each list,
    its required core too (Psychology AA-T 36265: "Required Core Course 9" over courses of 4, 3 and 3)."""
    rec = filed.get("record") or {}
    hours = S.measure(rec) == "hours"
    lo = hi = 0.0
    past = []
    for b in rec.get("blocks") or []:
        rule = b.get("rule")
        if rule == "recommended":
            continue
        if rule == "all":
            spans = [S.choice_units(c, {}, hours) for c in b.get("courses") or []]
            if not spans or any(x is None for x in spans):
                return None
            # A blank "or" alternative is an incomplete reading (units rule A4's), never this gap (S703 self-recall:
            # College of the Desert 33012 and 45567, San Bernardino Valley 31886 and 43049).
            if any(S._num(x.get("units")) is None for c in b.get("courses") or [] for x in c.get("alternatives") or []):
                return None
            st = S._span(b.get("stated"))
            got = (sum(x[0] for x in spans), sum(x[1] for x in spans))
            if st is None:
                lo, hi = lo + got[0], hi + got[1]
                continue
            if got[0] > st[0] + FIG_EPS:
                past.append((b.get("name") or "")[:60])
            lo, hi = lo + st[0], hi + st[1]
            continue
        if rule not in ("choose_courses", "choose_units"):
            return None
        st = S._span(b.get("stated"))
        if st is None:
            return None
        got, _ = S.block_units_summed(b, {}, hours)
        if got is not None and got[0] > st[0] + FIG_EPS:
            past.append((b.get("name") or "")[:60])
        lo, hi = lo + st[0], hi + st[1]
    return (lo, hi), past


# The claim check (S703, before review; the #3678 and #3679 second readers' finding 1, applied to this gap): what the
# record's own words, its notes and block names, say of the gap's two claims. The committed files keep no page text.
#   lists_meet_figure    a list the page lets take courses from another list ("List B also allows any List A course
#                        not already used": Santa Monica 36265, Rio Hondo 36175) meets its figure once those
#                        courses count, and no list stays past its figure. A list whose allowance reaches courses
#                        outside the record ("any lower division CSU-transferable Economics elective": Taft 37366)
#                        is never past, since its courses are not all on the record.
#   prints_other_total   a note quotes a second total the page prints, and the courses as read meet it ("the table
#                        prints 'Total Units 34'": Cypress 03782; "'Units: 35.0'": Diablo Valley 18811; "If completed
#                        entirely at SMC, the Area of Emphasis requires 21 units": Santa Monica 33271). A reread of
#                        that figure passes the record free.
#   course_optional      a note says a course the list counts is optional, exempt, met another way or counts toward
#                        nothing ("ANTH C1001L is optional": San Mateo 33879; "exempt from DR 100": Saddleback 04069;
#                        "may instead be met by a typing certification": Madera 39862; "admission prerequisites that
#                        do not count toward the 27-unit major total": Siskiyous 17596). The courses then meet the
#                        figure.
#   note_names_difference
#                        a note names the course or list that makes up the difference ("suggest the core is ENGL C1000/H plus one of ...": El Camino 02524;
#                        "The 14 would fit if only one of the HIST C1002 or POLS C1000 rows were required": 02538;
#                        "may be listed in error": 02495; "ARTH 26 may actually belong to List A": Madera 39811;
#                        "without it the courses sum to 24, matching the printed total": East Los Angeles 45602).
#                        A reread on that reading passes the record free. Los Angeles Trade Technical 08479, which
#                        reads the A.A. section for an A.S. control number, is held by key in this class.
#   within_printed_range the courses as read fall inside a printed range, so the figures meet the total and no list
#                        carries past it (Gavilan 08460: 36 against 30-36; decided d-lists-gap-holds-range-sums-s703).
#   stands               none of these: the record's words leave both claims standing.
# A record reading any but stands is held out (lists_held_out), as d-ge-gap-only-where-no-figure-s703 and
# d-hours-gaps-hold-misreads-s703 hold theirs; lists_precision counts the four on the gap's shape.
LISTS_LABEL = re.compile(r"\b(?:list|group)\s+([A-Z]|\d{1,2}|[IVX]{1,4})\b|\b([A-Z]\.\d)\b|\b(core)\b", re.I)
LISTS_ALLOWS = re.compile(r"\balso\s+(?:allows?|includes?|accepts?)\b|\ballows?\s+any\b|\bnot\s+(?:already\s+)?"
                          r"(?:used|selected|chosen|taken)\b|\bmay\s+select\s+a\s+course\s+from\b|\bsubstitut", re.I)
# A source the record does not hold: courses named by a kind, never by a list.
LISTS_OPEN = re.compile(r"\b(?:elective|articulated|transferable|substitut|other\s+\w+(?:\s+\w+)?\s+courses)", re.I)
LISTS_OTHER_TOTAL = re.compile(r"'(?:Total(?:\s+Units)?|Units)\s*:?\s*(\d{1,3}(?:\.\d+)?)"
                               r"|\brequires\s+(\d{1,3}(?:\.\d+)?)\s+units\b", re.I)
# A note whose figure belongs elsewhere: another program, a sample plan ("The Suggested Course Sequence prints
# 'Total : 57.5- 64.0'; this is a sample-plan total": Allan Hancock 05841), text not read.
LISTS_NOT_THIS = re.compile(r"\bbelongs?\s+to\b|\banother\s+program\b|\bpreceding\s+program\b|\bsample\b"
                            r"|\bsuggested\b|\bwas\s+not\s+(?:used|read)\b", re.I)
# Said of a course of a list still past its figure (its code in the same note), never of a recommended list.
LISTS_OPTIONAL = re.compile(r"\bis\s+optional\b|\bnot\s+strictly\s+required\b|\bexempt\b|\bmay\s+instead\s+be\s+met\b"
                            r"|\bdo(?:es)?\s+not\s+count\s+toward\b", re.I)
# The hand-held answers: the S703 reading of each of the 46 records the rule named in the census's units_unequal
# programs at the colleges tonight's plan may touch, before the claim check was written (decided
# d-lists-gap-holds-claim-false-s703). Each takes no lists gap.
# A note naming the course, list or section that makes up the difference (note_names_difference). Wording that
# names only the state file's units ("8-9 would be consistent if ENGLISH 032 carries 2 units as in the state file":
# Los Angeles Harbor 44271; "With 3 units for BUS the sum would be 17": Los Angeles Trade Technical 45670) is not
# this class: the page prints the units the record holds.
LISTS_NAMES_DIFFERENCE = re.compile(
    r"\bwould\s+fit\s+if\b|\bsuggests?\s+the\s+(?:core|list)\s+is\b|\b(?:may\s+be\s+)?listed\s+in\s+error\b"
    # A course that may belong to another list, never a page or a figure that may belong elsewhere (53 notes).
    r"|\b[A-Z]{2,7}\s?C?\d{1,4}[A-Z]{0,2}\s+may\s+(?:actually\s+)?belong\s+to\s+(?:list|group)\b"
    r"|\bwithout\s+it\b[^.;]{0,60}\bmatching\b", re.I)
# A note that the record reads another award's section ("The requested award is an A.S. Degree, but ... this record
# reads the A.A. section": Los Angeles Trade Technical 08479) is held by key alone: 95 records carry the wording,
# passing ones among them (Antelope Valley 20179, Fresno City 37439), so it names a section, never the difference.
LISTS_CROSS_WHY = "a list takes courses from another list; with them, no list passes its figure"
LISTS_TOTAL_WHY = "the page prints a second total the courses meet; a reread passes it free"
LISTS_OPTIONAL_WHY = "a counted course is optional, exempt or met another way; the courses meet the figure"
LISTS_DIFFERENCE_WHY = "the note names the course or list that makes up the difference"
LISTS_RANGE_WHY = "the sum sits inside the printed range, so the label overstates"
HELD_LISTS = {
    ("Cuesta College", "33041"): LISTS_CROSS_WHY, ("Imperial Valley College", "35587"): LISTS_CROSS_WHY,
    ("Lake Tahoe Community College", "38760"): LISTS_CROSS_WHY, ("Madera College", "39520"): LISTS_CROSS_WHY,
    ("Reedley College", "35732"): LISTS_CROSS_WHY, ("Rio Hondo College", "36175"): LISTS_CROSS_WHY,
    ("Santa Ana College", "31859"): LISTS_CROSS_WHY, ("Taft College", "37366"): LISTS_CROSS_WHY,
    ("Cypress College", "03782"): LISTS_TOTAL_WHY, ("Diablo Valley College", "18811"): LISTS_TOTAL_WHY,
    ("Santa Monica College", "33271"): LISTS_TOTAL_WHY, ("Santa Monica College", "35284"): LISTS_TOTAL_WHY,
    ("College of San Mateo", "33879"): LISTS_OPTIONAL_WHY, ("Saddleback College", "04069"): LISTS_OPTIONAL_WHY,
    ("Saddleback College", "22874"): LISTS_OPTIONAL_WHY, ("Madera College", "39862"): LISTS_OPTIONAL_WHY,
    ("College of the Siskiyous", "17596"): LISTS_OPTIONAL_WHY,
    # The second reader's round one on 5d3851de (finding 1): each record's own note names a reading under which it
    # passes; the reader rescored five of them equal.
    ("El Camino College", "02524"): LISTS_DIFFERENCE_WHY, ("El Camino College", "02538"): LISTS_DIFFERENCE_WHY,
    ("El Camino College", "02495"): LISTS_DIFFERENCE_WHY, ("Madera College", "39811"): LISTS_DIFFERENCE_WHY,
    ("East Los Angeles College", "45602"): LISTS_DIFFERENCE_WHY,
    ("Los Angeles Trade Technical College", "08479"): LISTS_DIFFERENCE_WHY,
    # Finding 2 (decided d-lists-gap-holds-range-sums-s703).
    ("Gavilan College", "08460"): LISTS_RANGE_WHY, ("Gavilan College", "38787"): LISTS_RANGE_WHY,
    ("Gavilan College", "41394"): LISTS_RANGE_WHY, ("Irvine Valley College", "32865"): LISTS_RANGE_WHY,
    ("Palomar College", "33826"): LISTS_RANGE_WHY, ("West Valley College", "32022"): LISTS_RANGE_WHY,
}


def _lists_label(text: str) -> set:
    return {(g[0] or g[1] or g[2]).lower() for g in LISTS_LABEL.findall(text or "")}


def _lists_sources(filed: dict, i: int):
    """The blocks a list may also take courses from, by its name and the notes' sentences that name it first, as
    indices; None where the allowance reaches courses the record does not hold; () where it names none."""
    blocks = (filed.get("record") or {}).get("blocks") or []
    own = _lists_label(blocks[i].get("name"))
    said = []
    name = blocks[i].get("name") or ""
    m = LISTS_ALLOWS.search(name)
    if m:
        said.append(name[m.start():])
    for n in (filed.get("record") or {}).get("notes") or []:
        for x in re.split(r"(?<=[.!?;])\s+", n if isinstance(n, str) else json.dumps(n)):
            m = LISTS_ALLOWS.search(x)
            first = LISTS_LABEL.search(x)
            if m and first and own and _lists_label(first.group(0)) <= own and first.start() < m.start():
                said.append(x[m.start():])
    if not said:
        return ()
    out = set()
    for x in said:
        named = _lists_label(x) - own
        hits = {j for j, b in enumerate(blocks) if j != i and _lists_label(b.get("name")) & named}
        if re.search(r"\babove\b", x, re.I) and not named:
            hits |= set(range(i))
        if not hits or LISTS_OPEN.search(x):
            return None
        out |= hits
    return tuple(sorted(out))


def lists_still_past(filed: dict) -> list[str]:
    """The names of the lists _lists_still_past reads past their figure."""
    blocks = (filed.get("record") or {}).get("blocks") or []
    return [(blocks[i].get("name") or "")[:60] for i in _lists_still_past(filed)]


def _lists_still_past(filed: dict) -> list[int]:
    """The lists whose courses pass their printed figure once the courses a list may take from another list count
    (lists_meet_figure's reading), as indices: a required list by its courses' least; a choose-courses list by the
    cheapest of its own and its sources' courses, never past where its allowance reaches courses off the record."""
    rec = filed.get("record") or {}
    hours = S.measure(rec) == "hours"
    blocks = rec.get("blocks") or []
    past = []
    for i, b in enumerate(blocks):
        st = S._span(b.get("stated"))
        if st is None or b.get("rule") not in ("all", "choose_courses"):
            continue
        if b.get("rule") == "all":
            spans = [S.choice_units(c, {}, hours) for c in b.get("courses") or []]
            if spans and all(spans) and sum(x[0] for x in spans) > st[0] + FIG_EPS:
                past.append(i)
            continue
        got, _ = S.block_units_summed(b, {}, hours)
        if got is None or got[0] <= st[0] + FIG_EPS:
            continue
        src = _lists_sources(filed, i)
        if src is None:
            continue
        n = int(S._num(b.get("minimum")) or 1)
        pool = [x[0] for j in (i,) + src for x in (S.choice_units(c, {}, hours) for c in blocks[j].get("courses") or [])
                if x]
        if len(pool) >= n and sum(sorted(pool)[:n]) <= st[0] + FIG_EPS:
            continue
        past.append(i)
    return past


def lists_claim(filed: dict) -> str:
    """course_optional, note_names_difference, within_printed_range, prints_other_total, lists_meet_figure or
    stands: what the record's words and figures say of the claim."""
    rec = filed.get("record") or {}
    notes = [n if isinstance(n, str) else json.dumps(n) for n in rec.get("notes") or []]
    past = _lists_still_past(filed)
    # A course of a list still past its figure, or one of its "or" alternatives, named in the sentence.
    codes = {re.sub(r"\s+", "", str(x.get("code") or "")).upper() for i in past
             for c in (rec.get("blocks") or [])[i].get("courses") or [] for x in [c] + list(c.get("alternatives") or [])}
    codes.discard("")
    for n in notes:
        flat = re.sub(r"\s+", "", n).upper()
        # A note on a recommended course speaks of a list the scorer already counts toward nothing (Los Angeles
        # City 40592: THEATER 200 "does not count toward the total", recommended before THEATER 270).
        if LISTS_OPTIONAL.search(n) and not re.search(r"\brecommended\b", n, re.I) and any(c in flat for c in codes):
            return "course_optional"
    if any(LISTS_NAMES_DIFFERENCE.search(n) for n in notes):
        return "note_names_difference"
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    if comp and st:
        for n in notes:
            if LISTS_NOT_THIS.search(n):
                continue
            for m in LISTS_OTHER_TOTAL.finditer(n):
                v = float(m.group(1) or m.group(2))
                if comp[0] - FIG_EPS <= v <= comp[1] + FIG_EPS and all(abs(v - s) > FIG_EPS for s in st):
                    return "prints_other_total"
    if not past:
        return "lists_meet_figure"
    if comp and st and st[1] > st[0] + FIG_EPS and st[0] - FIG_EPS <= comp[0] and comp[1] <= st[1] + FIG_EPS:
        return "within_printed_range"
    return "stands"


def lists_held_out(filed: dict) -> str | None:
    """Why a record of the gap's shape takes no lists gap: a held key, or a claim its own words make false."""
    why = HELD_LISTS.get((filed.get("college"), str(filed.get("control_number"))))
    if why:
        return why
    claim = lists_claim(filed)
    return None if claim == "stands" else {"lists_meet_figure": LISTS_CROSS_WHY, "prints_other_total": LISTS_TOTAL_WHY,
                                           "course_optional": LISTS_OPTIONAL_WHY,
                                           "note_names_difference": LISTS_DIFFERENCE_WHY,
                                           "within_printed_range": LISTS_RANGE_WHY}[claim]


def _lists_shape(filed: dict):
    """The scorer's shape of the gap before the claim check: (computed, printed total, past lists), or None. An hours
    record keeps its hours gap (S703: the hours gaps landed first)."""
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if (hours_measured(filed) or a.get("pass") or a.get("status") != "unequal" or a.get("against") != "program"
            or not collectable(sc) or len(a.get("why") or []) != 1):
        return None
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    ft = figures_total(filed)
    if not comp or not st or not ft or not ft[1] or comp[0] <= st[0] + FIG_EPS:
        return None
    (flo, fhi), past = ft
    if abs(flo - st[0]) > FIG_EPS or abs(fhi - st[1]) > FIG_EPS:
        return None
    return comp, st, past


def lists_past_their_figure(filed: dict) -> str | None:
    shape = _lists_shape(filed)
    if not shape or lists_held_out(filed):
        return None
    comp, st, _ = shape
    past = lists_still_past(filed)
    return ("the figures add to the printed %s, counting %s at %s; the courses as read add to %s" % (
        S._fig(*st), _listed(["'%s'" % n for n in past]), "its printed figure" if len(past) == 1 else
        "their printed figures", S._fig(*comp)))


# ── section_cut_off (S713) ─────────────────────────────────────────────────
# The reader's own words that the program's requirements continue on a page the read did not hold: a sentence (of a
# note, a block's name or the section heading) whose subject is the requirements (a requirement, the core, a list, a
# table, the courses) and that says the rest sits on another page not in the text, or that the list or table is cut
# off at a page break. A description, a heading or a career list read short is not this gap: the requirements are.
CUT_SUBJECT = re.compile(r"\b(?:requirements?|core|lists?|tables?|courses?|prerequisites?|selection\s+rule)\b", re.I)
CUT_PAGE = r"(?:previous|preceding|prior|earlier|next|following)\s+page"
CUT_LOSS = re.compile(
    r"\b(?:on|from)\s+(?:the\s+|an\s+)?" + CUT_PAGE + r"\b[^.;]{0,120}?\b(?:not\s+(?:in\s+the\s+(?:supplied\s+|provided\s+)?"
    r"(?:text|excerpt)|provided|included|supplied)|which\s+(?:was|is)\s+not\s+(?:provided|included|in\s+the\s+text))"
    r"|\bon\s+page\s+\d+,\s+which\s+was\s+not\s+provided"
    r"|\bcut\s+off\s+(?:at\s+(?:the|a)\s+page\s+break|on\s+the\s+(?:previous|preceding|next)\s+page|before\s+page\s+\d+)"
    r"|\bcut\s+off\b[^.;]{0,40}\b" + CUT_PAGE +
    r"|\b(?:text|excerpt)\s+ends\s+at\b[^.;]{0,80}\bpage\s+break\b"
    r"|\bcontinued\s+from\s+(?:the\s+)?previous\s+page\b"
    r"|\b(?:likely|probably)\s+on\s+the\s+(?:next|following)\s+page\b", re.I)
CUT_PAGE_NUMBER = re.compile(r"\bpages?\s+(\d{1,4})\b", re.I)
# The colleges the rule names a gap at (S713, lane 2): Santa Rosa Junior and Santa Monica, every one of whose failing
# records is hand-held below. A college joins once its failing records are hand-held and its precision count reads
# no wrong call; kb/_program_piles_s713.py counts the records the ungated rule would name elsewhere, unwritten.
CUT_OFF_COLLEGES = ("Santa Rosa Junior College", "Santa Monica College")
# The S713 second read, by hand, of every failing record at the two colleges: the twelve whose section runs onto a
# page the read did not hold. Every other failing record there holds no such gap (06566 and 32298 lost no countable
# course: #3705's second reader).
HAND_HELD_CUT_OFF = frozenset(("Santa Rosa Junior College", cn) for cn in (
    "06602", "15461", "15463", "30750", "32300", "32330", "32357", "33166", "45477", "45558"))


def _claim_sentences(filed: dict) -> list[str]:
    """The reader's sentences a cut-off claim is read from: each note's sentences, each block's name, the heading."""
    rec = filed.get("record") or {}
    # A sentence ends after a lower-case letter, a digit or a closing mark, never inside "A.S." or "A.A-T".
    out = [s for n in rec.get("notes") or [] for s in re.split(r"(?<=[a-z0-9)'\"][.!?])\s+(?=[A-Z])", str(n))]
    out += [str(b.get("name") or "") for b in rec.get("blocks") or []]
    out.append(str(((rec.get("program") or {}).get("section_heading")) or ""))
    return [s for s in out if s]


def cut_off_claim(filed: dict) -> str | None:
    """The reader's sentence saying the requirements continue on a page the read did not hold, or None."""
    for s in _claim_sentences(filed):
        if CUT_SUBJECT.search(s) and CUT_LOSS.search(s):
            return s
    return None


def source_pages(filed: dict, src: dict | None) -> list[int]:
    """The pages the read held (sources.json), apart from the reader's words."""
    e = (src or {}).get(str(filed.get("control_number"))) or {}
    return [int(p) for p in ((e.get("source") or {}).get("pages") or []) if str(p).isdigit()]


def cut_off_claim_stands(filed: dict, src: dict | None) -> bool | None:
    """The claim checked against the pages the read held: False where every page the sentence names is a page the
    read held in its middle (the requirements it says are missing sat in the text); True where it names a page the
    read did not hold, or only the first or last page held (where the section runs off it); None where it names no
    page or the sources file lists none."""
    claim = cut_off_claim(filed)
    pages = source_pages(filed, src)
    if not claim or not pages:
        return None
    named = [int(m.group(1)) for m in CUT_PAGE_NUMBER.finditer(claim)]
    if not named:
        return None
    if any(p not in pages for p in named):
        return True
    return any(p in (min(pages), max(pages)) for p in named)


def _short_or_unread(filed: dict) -> bool:
    """The arithmetic fails with the sum read short of the printed total: a section the read lost courses from adds
    up to less, never more. "Incomplete" counts only where a partial sum and a printed total are both read and the
    sum falls short of it (#3705's second reader: Natural Resources 06566 prints its total in a table the reader
    left unset, and Elementary Teacher Education 32298 already reaches its 33.5; neither lost a countable course)."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    if a.get("pass") or a.get("status") not in ("incomplete", "unequal"):
        return False
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    return bool(comp and st and comp[0] < st[0] - FIG_EPS)


def section_cut_off_ungated(filed: dict) -> str | None:
    """section_cut_off at any college: collectable, the units short of the total or unread, and the reader's note
    saying the section continues past the pages read."""
    if not collectable(filed.get("score") or {}) or not _short_or_unread(filed):
        return None
    claim = cut_off_claim(filed)
    if not claim:
        return None
    return "the reader's note says the section continues past the pages read: \"%s\"" % claim.strip()[:300]


def section_cut_off(filed: dict) -> str | None:
    if filed.get("college") not in CUT_OFF_COLLEGES:
        return None
    return section_cut_off_ungated(filed)


RECORD_RULES = (("major_total_differs", major_total_differs), ("total_not_printed", total_not_printed),
                ("total_differs", total_differs), ("ge_units_not_read", ge_units_not_read),
                ("hours_total_not_read", hours_total_not_read),
                ("hours_within_printed_range", hours_within_printed_range),
                ("hours_total_differs", hours_total_differs),
                # After the hours gaps (S703): an hours record whose lists pass their figure keeps its hours gap.
                ("lists_past_their_figure", lists_past_their_figure),
                # S713: before no_units_read, so a cut-off read is named as one, never as a course with no units.
                ("section_cut_off", section_cut_off)) + (
    (("no_units_printed", no_units_printed),) if NO_UNITS_PRINTED_ON else ()) + (("no_units_read", no_units_read),)


# S720 at Santa Monica (kb/_program_piles_s720_smc.py): the gaps its reviewed list names from each record's own notes.
# lists_not_closed and noted_figures_differ are #3753's (S720 at Fullerton), pool_figure_not_read and
# pair_read_as_alternatives #3755's (S720 at City College of San Francisco), each with the same sentence and score;
# repeat_read_once is new here. setdefault keeps this block a no-op beside those PRs' lines once all have merged.
for _g, _s, _a in (
        ("lists_not_closed", "A choice list prints no unit figure of its own, one that depends on another choice, or "
                             "also takes courses from another list, so the lists alone cannot add the program's units.",
         30),
        ("noted_figures_differ", "The reader's notes quote two figures from the catalog page that disagree, and the "
                                 "record's units add to one and state the other; no page read has settled which the "
                                 "program requires.", 40),
        ("pool_figure_not_read", "The catalog prints one figure over several lists or nested options together, and the "
                                 "record adds the parts instead, so its units cannot be checked against that figure.",
         40),
        ("pair_read_as_alternatives", "The catalog prints two courses taken together as one option, and the record "
                                      "reads them as separate alternatives, so its low end falls short of the printed "
                                      "total.", 50),
        ("repeat_read_once", "The catalog prints a course the program takes more than once, and the record counts it "
                             "once, so its units fall short of the printed total by the repeats.", 60)):
    GAPS.setdefault(_g, _s)
    ARITH_SCORE.setdefault(_g, _a)
del _g, _s, _a


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


def _figures_past_held(filed: dict, comp, st) -> bool:
    """The held answer's own reading of lists_past_their_figure (S703), over the raw fields: each required course's
    units (units, units_max, and its alternatives'), each list's stated figure where it prints one, and a list's
    courses (a required list's least, a choose-courses list's cheapest by its count) past that figure."""
    if not comp or not st or comp[0] <= st[0] + FIG_EPS:
        return False
    lo = hi = 0.0
    past = False
    for b in (filed.get("record") or {}).get("blocks") or []:
        if b.get("rule") == "recommended":
            continue
        figure = b.get("stated") or {}
        f_lo, f_hi = S._num(figure.get("min")), S._num(figure.get("max"))
        if b.get("rule") == "all":
            c_lo = c_hi = 0.0
            for c in b.get("courses") or []:
                # A required course or any of its "or" alternatives: the least and the most of them.
                figs = []
                for x in [c] + list(c.get("alternatives") or []):
                    u, um = S._num(x.get("units")), S._num(x.get("units_max"))
                    if u is None:
                        return False
                    figs += [u, um if um is not None else u]
                c_lo, c_hi = c_lo + min(figs), c_hi + max(figs)
            if f_lo is None and f_hi is None:
                lo, hi = lo + c_lo, hi + c_hi
                continue
            f_lo = f_hi if f_lo is None else f_lo
            f_hi = f_lo if f_hi is None else f_hi
            past = past or c_lo > f_lo + FIG_EPS
            lo, hi = lo + f_lo, hi + f_hi
            continue
        if f_lo is None and f_hi is None:
            return False
        f_lo = f_hi if f_lo is None else f_lo
        f_hi = f_lo if f_hi is None else f_hi
        # Only a choose-courses list with a count can pass its figure: a choose-units list counts at its figure.
        units = [S._num(c.get("units")) for c in b.get("courses") or []]
        n = S._num(b.get("minimum"))
        least = None
        if (b.get("rule") == "choose_courses" and n and not b.get("repeats")
                and all(u is not None for u in units) and len(units) >= n):
            least = sum(sorted(units)[:int(n)])
        if least is not None and least > f_lo + FIG_EPS:
            past = True
        lo, hi = lo + f_lo, hi + f_hi
    return past and abs(lo - st[0]) <= FIG_EPS and abs(hi - st[1]) <= FIG_EPS


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
    if ((filed.get("college"), str(filed.get("control_number"))) in total_not_printed_list()
            and a.get("status") == "incomplete" and a.get("why") == [NO_TOTAL_WHY]):
        # The page itself, read and listed in kb/program_total_not_printed.json, is the held answer (S691).
        return "total_not_printed"
    e = total_differs_list().get((filed.get("college"), str(filed.get("control_number"))))
    if e and _differs(e) and a.get("status") == "unequal":
        # The page itself, read and listed in kb/program_total_differs.json with both of its figures, is the held
        # answer (S697); whether the record read those figures is the rule's question, not the answer's.
        return "total_differs"
    prog = (filed.get("record") or {}).get("program") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    if (str(prog.get("measure") or "").lower() == "hours" and len(a.get("why") or []) == 1 and comp
            and comp[1] > 0 and not hours_held_out(filed)):
        # S703: the held answer reads the score's own figures and status, apart from the rules' helpers.
        if a.get("status") == "incomplete" and a.get("stated") is None and a.get("against") is None:
            return "hours_total_not_read"
        if a.get("status") == "unequal" and a.get("against") == "program" and st and st[1] > 0:
            inside = st[0] - FIG_EPS <= comp[0] and comp[1] <= st[1] + FIG_EPS
            return "hours_within_printed_range" if inside else "hours_total_differs"
    if (a.get("status") == "incomplete" and a.get("against") == "degree" and a.get("ge") is None
            and len(a.get("why") or []) == 1 and prog.get("ge_pattern") and R._no_ge_units(prog.get("ge_units"))
            and isinstance(m, dict) and m.get("pass") is True and not ge_units_held_out(filed)):
        # The held answer reads the record and the score's own fields (no ge units read, a pattern named, the major
        # passing, one reason), apart from the rule's sentence matcher (S703). A record printing a GE figure is held
        # out of both by one reading (ge_units_held_out); ge_units_precision measures that reading.
        return "ge_units_not_read"
    if (a.get("status") == "unequal" and a.get("against") == "program" and len(a.get("why") or []) == 1
            and str(prog.get("measure") or "").lower() != "hours" and _figures_past_held(filed, comp, st)
            and not lists_held_out(filed)):
        # A record whose own words make the claim false is held out of both by one reading (lists_held_out);
        # lists_precision measures that reading against the hand-held answers.
        return "lists_past_their_figure"
    if filed.get("college") in CUT_OFF_COLLEGES and (filed.get("college"), str(filed.get("control_number"))) \
            in HAND_HELD_CUT_OFF:
        # S713: the second read by hand of every failing record at the gated colleges, apart from the rule's matcher.
        return "section_cut_off"
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


def hours_recall(every: list[dict]) -> dict:
    """The three hours gaps against answers already held (S703; S652's review rule): every passing record measured
    in hours whose courses' hours add to more than zero and match its printed total. The scorer itself (S.score on
    the filed record, no closed list and no page text, which reproduces each filed arithmetic) reads the record
    three ways, each with a held answer: its total removed (hours_total_not_read), its total moved past the sum
    (hours_total_differs) and widened around it (hours_within_printed_range). Right when the rule names the held
    gap; a record the scorer does not reproduce unchanged is counted apart (not_reproduced), and so is one held out
    (hours_held_out). Two boundary readings follow (#3679 second reader, finding 2): the sum at the top of a printed
    range and at its low end. Their held answer is the scorer's own verdict: no gap where it passes the sum (its
    meets and meets-top readings), else hours_within_printed_range; by_boundary counts each outcome."""
    out = {"held": 0, "right": 0, "wrong": 0, "not_reproduced": 0, "held_out": 0, "by_test": collections.Counter(),
           "by_boundary": collections.Counter(), "wrong_keys": []}
    for f in every:
        sc = f.get("score") or {}
        a = sc.get("arithmetic") or {}
        rec = f.get("record") or {}
        comp = _pair(a.get("computed"))
        if (not hours_measured(f) or not a.get("pass") or a.get("against") != "program" or not collectable(sc)
                or comp is None or comp[1] <= 0):
            continue
        if hours_held_out(dict(f, score=dict(sc, arithmetic=dict(a, stated=None)))):
            out["held_out"] += 1
            continue
        if S.score(rec, [], None, f.get("award"))["arithmetic"] != a:
            out["not_reproduced"] += 1
            continue
        lo, hi = comp
        for gap, total in (("hours_total_not_read", None),
                           ("hours_total_differs", {"min": round(hi * 2 + 10, 2), "max": round(hi * 2 + 10, 2)}),
                           ("hours_within_printed_range", {"min": round(lo / 2, 2), "max": round(hi * 2 + 10, 2)}),
                           ("boundary_top", {"min": round(lo / 2, 2), "max": hi}),
                           ("boundary_low", {"min": lo, "max": round(hi * 2 + 10, 2)})):
            prog = dict(rec.get("program") or {}, total_units=total)
            again = S.score(dict(rec, program=prog), [], None, f.get("award"))["arithmetic"]
            test = dict(f, record=dict(rec, program=prog), score=dict(sc, arithmetic=again))
            got = (answer(test) or (None,))[0]
            if gap.startswith("boundary"):
                expect = None if again.get("pass") else "hours_within_printed_range"
                out["by_boundary"]["%s %s" % (gap, "passes" if expect is None else "within")] += 1
                gap = expect
            out["held"] += 1
            out["by_test"][gap or "none"] += 1
            if got == gap and held_answer(test) == gap:
                out["right"] += 1
            else:
                out["wrong"] += 1
                out["wrong_keys"].append({"college": f.get("college"), "control_number": f.get("control_number"),
                                          "held": gap, "rule": got})
    out["by_test"] = dict(out["by_test"])
    out["by_boundary"] = dict(out["by_boundary"])
    return out


def hours_precision(files: list[dict], keys: frozenset | None = None) -> dict:
    """hours_total_not_read's claim, a program section read with no total printed, measured on the records of its
    shape (no total read, the courses' hours above zero, one reason; held keys counted too) with keys the census's
    records alone (#3679 second reader, finding 2): hours_claim's three counts; and hours_claim against the hand-held
    answers, the ten records the second reader found read from text without the program section."""
    counts = collections.Counter()
    for f in files:
        sc = f.get("score") or {}
        a = sc.get("arithmetic") or {}
        comp = _pair(a.get("computed"))
        if (not hours_measured(f) or a.get("pass") or not collectable(sc) or a.get("why") != [NO_TOTAL_WHY]
                or a.get("stated") is not None or comp is None or comp[1] <= 0):
            continue
        if keys is not None and (f.get("college"), str(f.get("control_number"))) not in keys:
            continue
        counts[hours_claim(f)] += 1
    by_key = {(f.get("college"), str(f.get("control_number"))): f for f in files}
    held = [by_key[k] for k, why in sorted(HELD_HOURS.items()) if why == HOURS_NO_SECTION_WHY and k in by_key]
    flagged = [f for f in held if hours_claim(f) == "section_missing"]
    return {"section_missing": counts["section_missing"], "says_no_total": counts["says_no_total"],
            "silent": counts["silent"], "hand_held_no_section": len(held),
            "hand_held_flagged_by_hours_claim": len(flagged),
            "hand_held_not_flagged": ["%s %s" % (f["college"], f["control_number"]) for f in held if f not in flagged]}


def ge_units_recall(every: list[dict]) -> dict:
    """The gap's scorer shape (_ge_units_shape) against answers already held (S703; S652's review rule): every
    passing degree whose major passes and whose general education units were read. The held answer is that the units
    were all the degree needed past its major, since with them it passes. Each record loses its units and is checked
    again by the scorer's own degree_check, and the shape must hold on it (right). A record whose pattern is not named
    cannot take the gap and is counted apart (no_pattern). This measures the shape alone: whether the page prints
    a figure is ge_units_precision's question (#3678 second reader, finding 2)."""
    out = {"held": 0, "right": 0, "wrong": 0, "no_pattern": 0, "wrong_keys": []}
    for f in every:
        sc = f.get("score") or {}
        a = sc.get("arithmetic") or {}
        deg = a.get("degree")
        prog = (f.get("record") or {}).get("program") or {}
        if (not sc.get("pass") or not a.get("pass") or a.get("against") != "program" or not isinstance(deg, dict)
                or not deg.get("pass") or deg.get("ge") is None or not collectable(sc)):
            continue
        if not prog.get("ge_pattern"):
            out["no_pattern"] += 1
            continue
        bare = dict(prog, ge_units={"min": None, "max": None})
        stated = _pair(deg.get("stated"))
        comp = _pair(deg.get("computed")) or (0.0, 0.0)
        again = S.degree_check(bare, stated, comp[0], comp[1], [], None, f.get("award"))
        major = {k: v for k, v in a.items() if k != "degree"}
        test = dict(f, record=dict(f.get("record") or {}, program=bare),
                    score=dict(sc, arithmetic=dict(again, major=major)))
        got = "ge_units_not_read" if _ge_units_shape(test) else (answer(test) or (None,))[0]
        out["held"] += 1
        if got == "ge_units_not_read":
            out["right"] += 1
        else:
            out["wrong"] += 1
            out["wrong_keys"].append({"college": f.get("college"), "control_number": f.get("control_number"),
                                      "rule": got})
    return out


def ge_units_precision(files: list[dict], keys: frozenset | None = None) -> dict:
    """The gap's own claim, that no units were printed for the pattern, measured on the records of its shape
    (#3678 second reader, finding 2): ge_claim's three counts (says_none, prints_figure, silent) on those records,
    with keys the census's records alone; and ge_claim against the hand-held answers, the second reader's 21 records
    whose pages print a GE figure (HELD_GE_FIGURE): flagged when ge_claim reads prints_figure. Every record
    printing a figure is held out by key or by ge_claim, so the gap's precision on the 21 is exact by construction;
    the flagged count is how far ge_claim alone reaches."""
    counts = collections.Counter()
    for f in files:
        if not _ge_units_shape(f):
            continue
        if keys is not None and (f.get("college"), str(f.get("control_number"))) not in keys:
            continue
        counts[ge_claim(f)] += 1
    by_key = {(f.get("college"), str(f.get("control_number"))): f for f in files}
    held = [by_key[k] for k in sorted(HELD_GE_FIGURE) if k in by_key]
    flagged = [f for f in held if ge_claim(f) == "prints_figure"]
    return {"says_none": counts["says_none"], "prints_figure": counts["prints_figure"], "silent": counts["silent"],
            "hand_held_prints_figure": len(held), "hand_held_flagged_by_ge_claim": len(flagged),
            "hand_held_not_flagged": ["%s %s" % (f["college"], f["control_number"]) for f in held
                                      if f not in flagged]}


def lists_recall(every: list[dict]) -> dict:
    """lists_past_their_figure against answers already held (S703; S652's review rule): every passing record the
    scorer reproduces (S.score, no closed list, no page text) with a list printed at a figure its courses meet
    exactly: a choose-courses list by its cheapest courses, and a required list with no "or" alternatives by all of
    them (by_kind). An hours record keeps its hours gap and is counted apart (hours), and so is a choose-courses list
    whose name or notes let it take another list's courses (allows_other). The scorer reads each such list
    in these ways, each with a held answer (by_test):
      gap            each course of that list one unit more: the figures still add to the printed total (the gap);
      none           beside it, the printed total one unit more: the figures no longer add to it (no gap);
    and the boundary readings (#3678 and #3679 second readers, finding 2; by_boundary):
      past_by_half   each course of that list half a unit more, the least step a catalog prints (the gap);
      total_by_half  each course one unit more and the total half a unit more (no gap: the figures miss it);
      top_only       a choose-courses list's dearest course one unit more, its cheapest left at the figure: a
                     record the scorer then fails holds no gap, since no list's least passes its figure;
      cross_list     the gap reading of a choose-courses list, beside a list (counted toward nothing) of the
                     list's own courses at their own units and a note that the list also allows that list's courses
                     (no gap: with them the list meets its figure). The picked list is renamed LIST Y for this reading.
    A reading whose sum the scorer reads inside a printed range holds no gap (d-lists-gap-holds-range-sums-s703;
    "<test> inside range"). Right when the rule names the held answer and held_answer agrees. A reading the scorer passes is counted apart
    ("<test> passes"). A gap reading the claim check holds out counts as wrong, since the claim check may not reach
    a record whose own words are the gap's."""
    out = {"held": 0, "right": 0, "wrong": 0, "not_reproduced": 0, "hours": 0, "allows_other": 0,
           "by_test": collections.Counter(),
           "by_kind": collections.Counter(), "by_boundary": collections.Counter(), "wrong_keys": []}
    for f in every:
        sc = f.get("score") or {}
        a = sc.get("arithmetic") or {}
        rec = f.get("record") or {}
        if not a.get("pass") or a.get("status") != "equal" or a.get("against") != "program" or not collectable(sc):
            continue
        blocks = rec.get("blocks") or []
        picks = {}
        for i, b in enumerate(blocks):
            n, st = S._num(b.get("minimum")), S._span(b.get("stated"))
            units = [S._num(c.get("units")) for c in b.get("courses") or []]
            if (not st or not units or any(u is None for u in units) or b.get("repeats")
                    or any(c.get("alternatives") or S._num(c.get("units_max")) is not None for c in b["courses"])):
                continue
            if (b.get("rule") == "choose_courses" and n and "choose_courses" not in picks
                    and abs(sum(sorted(units)[:int(n)]) - st[0]) <= FIG_EPS):
                picks["choose_courses"] = i
            elif (b.get("rule") == "all" and "all" not in picks and abs(sum(units) - st[0]) <= FIG_EPS
                  and abs(sum(units) - st[1]) <= FIG_EPS):
                picks["all"] = i
        ft, tot = figures_total(f), _pair(a.get("stated"))
        if not picks or ft is None or tot is None or any(abs(x - y) > FIG_EPS for x, y in zip(ft[0], tot)):
            # The held answer's premise: the figures add to the printed total at both ends.
            continue
        if hours_measured(f):
            out["hours"] += 1
            continue
        if S.score(rec, [], None, f.get("award"))["arithmetic"] != a:
            out["not_reproduced"] += 1
            continue
        for kind, pick in sorted(picks.items()):
            if kind == "choose_courses" and _lists_sources(f, pick) != ():
                # A list the page lets take another list's courses: moving its own courses leaves those at their
                # units, so the gap reading holds no answer there (lists_claim's lists_meet_figure is its question).
                out["allows_other"] += 1
                continue
            out["by_kind"][kind] += 1
            for reading in _lists_tests(blocks, pick, kind, bool(ft[1])):
                _lists_reading(f, rec, sc, pick, reading, tot, out)
    for k in ("by_test", "by_kind", "by_boundary"):
        out[k] = dict(out[k])
    return out


def _lists_tests(blocks, pick, kind, other_past: bool):
    """lists_recall's readings of one list: (name, held answer, the list's step, the total's step, the extra list).
    other_past: a list of the passing record already passes its figure (Merritt 01196's Area B, printed at 0), so
    the cross-list reading, which settles the picked list alone, holds no answer."""
    yield "gap", "lists_past_their_figure", 1.0, 0.0, None
    yield "none", None, 1.0, 1.0, None
    yield "past_by_half", "lists_past_their_figure", 0.5, 0.0, None
    yield "total_by_half", None, 1.0, 0.5, None
    if kind == "choose_courses":
        units = sorted(S._num(c["units"]) for c in blocks[pick]["courses"])
        n = int(S._num(blocks[pick].get("minimum")))
        if len(units) > n and units[-1] > units[n - 1] + FIG_EPS:
            # The dearest course lies outside the cheapest n, so the list's least stays at its figure.
            yield "top_only", None, "top", 0.0, None
        if not other_past:
            yield "cross_list", None, 1.0, 0.0, [dict(c) for c in blocks[pick]["courses"]]


def _lists_reading(f, rec, sc, pick, reading, tot, out):
    """One reading of lists_recall: the picked list moved by its step ("top": its dearest course alone, one unit)."""
    test, held, step, total_step, extra = reading
    blocks = rec.get("blocks") or []
    bumped = []
    for i, b in enumerate(blocks):
        if i != pick:
            bumped.append(b)
            continue
        cs = b["courses"]
        if step == "top":
            top = max(range(len(cs)), key=lambda j: S._num(cs[j]["units"]))
            cs = [dict(c, units=S._num(c["units"]) + 1) if j == top else c for j, c in enumerate(cs)]
        else:
            cs = [dict(c, units=S._num(c["units"]) + step) for c in cs]
        bumped.append(dict(b, courses=cs))
    notes = list(rec.get("notes") or [])
    if extra is not None:
        bumped[pick] = dict(bumped[pick], name="LIST Y")
        bumped.append({"rule": "recommended", "name": "LIST Z", "courses": extra, "stated": None})
        notes.append("LIST Y also allows any LIST Z course not already used.")
    prog = rec.get("program") or {}
    if total_step:
        prog = dict(prog, total_units={"min": tot[0] + total_step, "max": tot[1] + total_step})
    test_rec = dict(rec, blocks=bumped, program=prog, notes=notes)
    again = S.score(test_rec, [], None, f.get("award"))["arithmetic"]
    if again.get("pass"):
        out["by_test"]["%s passes" % test] += 1
        return
    filed = dict(f, record=test_rec, score=dict(sc, arithmetic=again))
    comp, st = _pair(again.get("computed")), _pair(again.get("stated"))
    if held and comp and st and st[1] > st[0] + FIG_EPS and st[0] - FIG_EPS <= comp[0] and comp[1] <= st[1] + FIG_EPS:
        # d-lists-gap-holds-range-sums-s703: a sum inside a printed range holds no gap, read from the score itself.
        held, test = None, test + " inside range"
    got = (answer(filed) or (None,))[0]
    got = got if got == "lists_past_their_figure" else None
    out["held"] += 1
    out["by_test"][test] += 1
    if test.split()[0] not in ("gap", "none"):
        out["by_boundary"][test] += 1
    if got == held and (held_answer(filed) == "lists_past_their_figure") == bool(held):
        out["right"] += 1
    else:
        out["wrong"] += 1
        out["wrong_keys"].append({"college": f.get("college"), "control_number": f.get("control_number"),
                                  "held": held, "rule": got, "test": test})


def lists_precision(files: list[dict], keys: frozenset | None = None) -> dict:
    """The gap's own claim, that the figures add to the printed total while a list's courses pass its figure,
    measured on the records of its shape (_lists_shape; #3678 and #3679 second readers, finding 2) with keys the
    census's records alone: lists_claim's six counts; and lists_claim against the hand-held answers (HELD_LISTS),
    the S703 reading of the 46 records the rule named before the claim check and the second reader's twelve on
    5d3851de: flagged when lists_claim reads other than stands. Every hand-held record is held out by key, so the gap's precision on them is exact by
    construction; the flagged count is how far lists_claim alone reaches."""
    counts = collections.Counter()
    for f in files:
        if not _lists_shape(f):
            continue
        if keys is not None and (f.get("college"), str(f.get("control_number"))) not in keys:
            continue
        counts[lists_claim(f)] += 1
    by_key = {(f.get("college"), str(f.get("control_number"))): f for f in files}
    held = [(k, by_key[k]) for k in sorted(HELD_LISTS) if k in by_key]
    flagged = [k for k, f in held if lists_claim(f) != "stands"]
    return {"stands": counts["stands"], "lists_meet_figure": counts["lists_meet_figure"],
            "prints_other_total": counts["prints_other_total"], "course_optional": counts["course_optional"],
            "note_names_difference": counts["note_names_difference"],
            "within_printed_range": counts["within_printed_range"], "hand_held": len(held),
            "hand_held_flagged_by_why": dict(collections.Counter(HELD_LISTS[k] for k in flagged)), "hand_held_flagged_by_lists_claim": len(flagged),
            "hand_held_by_why": dict(collections.Counter(HELD_LISTS[k] for k, _ in held)),
            "hand_held_not_flagged": ["%s %s" % k for k, _ in held if k not in flagged]}


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


CENSUS = os.path.join(HERE, "status", "harvest_gap_census.json")


def census_keys(causes: tuple, path: str = CENSUS) -> frozenset:
    """{(college, control number)} the committed census files under one of these exact causes (programs_by_college):
    the programs whose live row the census read failing for that reason (S703: the live row of a program outside
    them may hold another record, and the guarded UPDATE would abort on it)."""
    with open(path, encoding="utf-8") as fh:
        by = json.load(fh).get("programs_by_college") or {}
    return frozenset((c, cn) for c, m in by.items() for cn, v in m.items() if v in set(causes))


def run(write: bool, skip: tuple = (), gaps: tuple = (), census_causes: tuple = (), census_path: str = CENSUS) -> dict:
    """gaps: when given, only records whose gap is one of these move (S697: total_not_printed applied alone, so the
    pass writes no other lane's records); the recall still reads every record. census_causes: when given, only
    records the committed census lists under one of these causes move (S703)."""
    # census_path: a test pins the census its plan was built from (S703: a later census reads the planned programs
    # collected and would move the test).
    in_census = census_keys(census_causes, census_path) if census_causes else None
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
        if j and (not gaps or j[0] in gaps) and (in_census is None or
                                                  (filed.get("college"), str(filed.get("control_number"))) in in_census):
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
            "hours_recall": hours_recall(every),
            "hours_precision": hours_precision(files, in_census),
            "ge_units_recall": ge_units_recall(every),
            "ge_units_precision": ge_units_precision(files, in_census),
            "lists_recall": lists_recall(every),
            "lists_precision": lists_precision(files, in_census),
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


def held_run(x: dict, runs: dict, base: str = COLLEGE_DIR) -> dict:
    """A held-out row at a wave college with its filed run and whether the wave re-read it (S684 second reader: the
    held-out list is by college, and some of its rows were not re-read). A college holds one file a control number,
    so two matches mean its folder is filed under a second slug, and the run would depend on glob order: that stops
    the run (COBIx on #3548)."""
    found = []
    for path in sorted(glob.glob(os.path.join(base, "*", "records", "%s.json" % x["control_number"]))):
        with open(path, encoding="utf-8") as fh:
            d = json.load(fh)
        if d.get("college") == x["college"]:
            found.append((path, d.get("extracted_run")))
    if len(found) > 1:
        raise SystemExit("held_run: %s %s is filed %d times (%s): one college's folder sits under two slugs, so its "
                         "run is not one" % (x["college"], x["control_number"], len(found),
                                             ", ".join(os.path.relpath(p, base) for p, _ in found)))
    run_ = found[0][1] if found else None
    return dict(x, extracted_run=run_, wave_reread=str(run_) in runs.get(x["college"], set()))


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
    held_out = [held_run(x, runs) for x in three["held_out"] if x["college"] in runs]
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


RECEIPT_NAME = re.compile(r"^program_requirement_records_named_gaps_(\d{4}-\d{2}-\d{2})_([A-Za-z0-9]+)\.json$")


def receipt_day_tag(receipt: str) -> tuple[str | None, str | None]:
    """(day, tag) a named-gaps receipt's file name carries (program_requirement_records_named_gaps_<day>_<tag>.json,
    the name main() writes), or (None, None) for any other name."""
    m = RECEIPT_NAME.match(os.path.basename(receipt or ""))
    return (m.group(1), m.group(2)) if m else (None, None)


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
    ap.add_argument("--tag", default=None, help="the plan's tag (default s680); with --receipt, the receipt's own "
                                              "tag, read from its file name")
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
    ap.add_argument("--gap", action="append", default=[], choices=sorted(GAPS),
                    help="the plain pass: move only records taking this gap (repeat); the label file is left as is")
    ap.add_argument("--census-cause", action="append", default=[],
                    help="the plain pass: move only records the committed census lists under this exact cause "
                         "(programs_by_college, e.g. 'units_incomplete|ge_pattern_no_units'; repeat)")
    a = ap.parse_args(argv)
    if not (a.receipt or a.applied):
        a.tag = a.tag or "s680"
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
            print("  held out: %s %s %s, run %s, %s (%s)" % (
                x["college"], x["control_number"], x["gap"], x["extracted_run"],
                "a wave re-read" if x["wave_reread"] else "not a wave re-read", x["why"]))
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
        # The rollback is named after the receipt's own tag (S703 follow-up): with the default s680, a replan of
        # another night's receipt wrote its rollback under s680's name.
        day, tag = receipt_day_tag(a.receipt)
        if not tag:
            ap.error("the receipt's file name names no tag (program_requirement_records_named_gaps_<day>_<tag>.json)")
        if a.tag and a.tag != tag:
            ap.error("--tag %s differs from the receipt's own tag %s" % (a.tag, tag))
        with open(a.receipt, encoding="utf-8") as fh:
            body = json.load(fh)
        with open(a.applied, encoding="utf-8") as fh:
            mig = json.load(fh)
        rel = lambda p: os.path.relpath(os.path.abspath(p), ROOT)  # noqa: E731
        replan_applied(body, mig, rel(a.applied), tag)
        with open(a.receipt, "w", encoding="utf-8") as fh:
            json.dump(body, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        out = write_rollback(body, rel(a.receipt), day, tag)
        print("replanned: %d rows applied (%s), rollback %s" % (body["applied"]["returned"], rel(a.applied), rel(out)))
        return 0
    r = run(write=not a.dry_run, skip=tuple(a.skip_college), gaps=tuple(a.gap), census_causes=tuple(a.census_cause))
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
    hr = r["hours_recall"]
    print("hours gaps recall on passing hours records, read five ways: held %d, right %d, wrong %d (%s; not "
          "reproduced %d)" % (hr["held"], hr["right"], hr["wrong"],
                              ", ".join("%s %d" % kv for kv in sorted(hr["by_test"].items())), hr["not_reproduced"]))
    for w in hr["wrong_keys"][:10]:
        print("  wrong: %(college)s %(control_number)s held %(held)s, rule %(rule)s" % w)
    print("  boundaries: %s; held out %d" % (", ".join("%s %d" % kv for kv in sorted(hr["by_boundary"].items())),
                                            hr["held_out"]))
    hp = r["hours_precision"]
    print("hours_total_not_read precision, the records of its shape: section missing %d (held), says no total %d, "
          "silent %d; hand-held no-section records %d, hours_claim flags %d" % (
              hp["section_missing"], hp["says_no_total"], hp["silent"], hp["hand_held_no_section"],
              hp["hand_held_flagged_by_hours_claim"]))
    gr = r["ge_units_recall"]
    print("ge_units_not_read recall on %d passing degrees whose units were read, units removed: right %d, wrong %d "
          "(no pattern named %d)" % (gr["held"], gr["right"], gr["wrong"], gr["no_pattern"]))
    for w in gr["wrong_keys"][:10]:
        print("  wrong: %(college)s %(control_number)s, rule %(rule)s" % w)
    gp = r["ge_units_precision"]
    print("ge_units_not_read precision, the records of its shape: says none printed %d, prints a figure %d (held), "
          "silent %d; hand-held figure records %d, ge_claim flags %d" % (
              gp["says_none"], gp["prints_figure"], gp["silent"], gp["hand_held_prints_figure"],
              gp["hand_held_flagged_by_ge_claim"]))
    lr = r["lists_recall"]
    print("lists_past_their_figure recall on passing records, a list's courses and the total moved: held %d, right %d, "
          "wrong %d (%s; lists by kind %s; not reproduced %d)" % (
              lr["held"], lr["right"], lr["wrong"], ", ".join("%s %d" % kv for kv in sorted(lr["by_test"].items())),
              ", ".join("%s %d" % kv for kv in sorted(lr["by_kind"].items())), lr["not_reproduced"]))
    for w in lr["wrong_keys"][:10]:
        print("  wrong: %(college)s %(control_number)s held %(held)s, rule %(rule)s (%(test)s)" % w)
    print("  boundaries: %s; hours records apart %d" % (
        ", ".join("%s %d" % kv for kv in sorted(lr["by_boundary"].items())), lr["hours"]))
    lp = r["lists_precision"]
    print("lists_past_their_figure precision, the records of its shape: stands %d, lists meet their figure %d, "
          "prints another total %d, a course optional %d, a note names the difference %d, inside a printed range "
          "%d; hand-held records %d, lists_claim flags %d (%s)" % (
              lp["stands"], lp["lists_meet_figure"], lp["prints_other_total"], lp["course_optional"],
              lp["note_names_difference"], lp["within_printed_range"], lp["hand_held"],
              lp["hand_held_flagged_by_lists_claim"], lp["hand_held_flagged_by_why"]))
    if rc["wrong"] or hr["wrong"] or gr["wrong"] or lr["wrong"]:
        raise SystemExit("the recall is wrong on %d records: no plan is written" % (rc["wrong"] + hr["wrong"]
                                                                                    + gr["wrong"] + lr["wrong"]))
    if a.dry_run:
        return 0
    held = list(dict.fromkeys(list(CL.COLLECTION_LANE_S680) + list(a.skip_college)))
    if not a.gap:
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
            "held_colleges": held, "only_gaps": list(a.gap), "census_causes": list(a.census_cause), "collected": n, "by_gap": r["by_gap"],
            "recall": r["recall"], "matcher_recall": r["matcher_recall"],
            "ge_units_recall": {k: v for k, v in r["ge_units_recall"].items() if k != "wrong_keys"},
            "ge_units_precision": r["ge_units_precision"],
            "ge_units_held_out": {"why": GE_FIGURE_HELD_WHY, "decided": "d-ge-gap-only-where-no-figure-s703",
                                  "keys": sorted(list(k) for k in HELD_GE_FIGURE)},
            "hours_recall": {k: v for k, v in r["hours_recall"].items() if k != "wrong_keys"},
            "hours_precision": r["hours_precision"],
            "hours_held_out": {"decided": "d-hours-gaps-hold-misreads-s703",
                               "keys": sorted([k[0], k[1], why] for k, why in HELD_HOURS.items())},
            "lists_recall": {k: v for k, v in r["lists_recall"].items() if k != "wrong_keys"},
            "lists_precision": r["lists_precision"],
            "lists_held_out": {"decided": "d-lists-gap-holds-claim-false-s703",
                               "keys": sorted([k[0], k[1], why] for k, why in HELD_LISTS.items())},
            "records": r["moved"],
            "decided": ("The %d records count as collected with the gap named (the S680 conductor, on Sam's rule of "
                        "2026-11-17: never drop a record for failing; collect it with gaps noted and scores)." % n),
            "representation": ("checks.gaps (a list of gap names, keys of gaps) and checks.confidence (five scores "
                               "0-100) added to program_requirement_records.checks; checks.arithmetic unchanged"),
            "pre_read": pre_read_sql(r["moved"]), "apply": update_sql(r["moved"], a.tag + " named-gaps"),
            "rollback": rollback_sql(r["moved"], a.tag + " named-gaps rollback")}
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
           "-- The collection lane's %d held colleges (kb/collection_lane.py, the receipt's held_colleges) and the parked\n"
           "-- colleges are not in the list.\n"
           % (tag.upper(), ", ".join("%s %d" % kv for kv in sorted(body["by_gap"].items())), receipt,
              len(body.get("held_colleges") or ())))
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
