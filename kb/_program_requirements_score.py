#!/usr/bin/env python3
"""Score a program requirements record against the state's closed course list.

The program requirements harvest (docs/reference/lanes/program-requirements-harvest.md)
tests every record before anything reads it. The plan (Sam's Claude Doc, section
"Testing against the catalog") names four checks; three run without a person,
because the Data Mart Program Course File (coci_program_courses) names every
course the program lists, and Sam's review added a structural one:

  coverage       the listed courses the record places in a block, out of all
                 of them. Bar: 100%, or each missing course explained, and at
                 least one placed (a record placing none read other text).
  invented       courses the record places that the list lacks. Bar: 0, or
                 each one flagged as a catalog addition.
  arithmetic     required units plus each block's minimum plus open electives,
                 against the catalog's stated total. Bar: equal.
  repeated       a course placed twice in one block. Bar: none. Sam's review of
                 the 20 pilot records (2026-10-04, card 5) ruled Mt. San Antonio
                 Fire's elective block, which listed FIRE 86 twice, a fix; a
                 repeat inflates a choose block's options and double-counts an
                 all-required block, so the scorer now refuses it.

  outcomes       every program and course outcome the record carries appears
                 in the catalog text word for word. Bar: none reworded. Sam's
                 sheet 33 card 4 (2026-10-04, as proposed): record shape
                 version 3 keeps outcomes exactly as printed, and the scorer
                 checks they are verbatim. A page that prints an outcomes
                 heading while the record carries none is reported
                 (heading_without_outcomes) but does not fail: Mt. San Antonio
                 prints the heading over a tab the capture never opens, so the
                 gap is the reading procedure's, not the record's.

The plan's fourth, agreement with a person, is Sam's reading of the same 20
programs: on 2026-10-04 he passed 18 as matching the catalog and ruled two fixes
(kb/program_requirements_pilot/review_2026-10-04.json).

THE RECORD, version 2 (one per program per catalog year; the extractor writes it):

    {"program": {"measure": "units" | "hours",
                 "total_units": 30.5 | {"min": 27, "max": 29} | null,
                 "open_elective_units": 0, ...},
     "blocks": [{"name": "Required Courses",
                 "rule": "all" | "choose_courses" | "choose_units" | "recommended",
                 "minimum": null | number,       # N courses or N units
                 "option_group": null | "Option",  # blocks sharing one are alternatives
                 "stated": {"min": 6, "max": 22},  # the block total the catalog prints
                 "courses": [{"code": "CUL 36", "units": 8.5, "units_max": null,
                              "alternatives": [{"code": "CUL 36H", "units": 8.5,
                                                "catalog_addition": false}],
                              "catalog_addition": false}]}]}

A course with alternatives (an honors pair, "MATH 1 or MATH 1H") counts as one
choice whose units run from its smallest option to its largest; a course
printed with a range ("MICR 1 4-5") runs from units to units_max. Units come
from the record first (the catalog's own number) and the closed list second.
Version 1 wrote alternatives as bare codes; the scorer still reads them, and a
bare code takes its parent's catalog_addition.

Extraction run 1 (37167619551, 7 of 16 passed) named what version 1 could not
hold, and version 2 adds one field for each:
  measure        a noncredit program states hours, not units (Cerritos Energy
                 Corps, Riverside Food Service). With hours, course "units"
                 hold hours and the closed list's 0 units are never used.
  option_group   the student completes one of several whole blocks (Cerritos
                 Ironworker: Reinforcing or Structural). The group runs from
                 its smallest block to its largest.
  stated         the block total the catalog prints ("6-22 units", List B
                 "6-7"). It stands for the block when a course's units are
                 missing or the rule picks units.
  units_max      the top of a range printed beside a course.

Version 3 (S334) adds the outcomes, which no check above reads:
  program.outcomes   each program or student learning outcome the catalog
                     prints for the award, as printed, one string each.
  course_outcomes    [{"code": "CUL 36", "outcomes": [...]}] for outcomes the
                     text prints under a single course.
Versions 1 and 2 carry neither, and their outcomes check passes with nothing
to read. requirements_md5() fingerprints everything but the outcomes, so a
person's reading follows the requirements it read
(kb/program_requirements_pilot/reviewed_readings.json).

Version 5 (S389; Sam, Open Asks Sheet 78 card 2, 2026-10-14, "Record both
figures") reads a page that prints the degree total with general education and
no total for the major (Palo Verde's Automotive Technology A.S.: Total 64 - 68 =
a 24-unit core, 6 units of electives and CalGETC 34 - 38; Cabrillo's
"Complete the following number of credits: 60"). Before it, 79 records at the
two colleges failed arithmetic as "incomplete" though their pages add up:
  program.degree_total   the total the page prints for the whole award with
                         general education in it, as printed, never computed.
  program.ge_units       the units the page prints for its general education
                         pattern (CalGETC 34 - 38, Cabrillo College General
                         Education 24).
  program.electives_fill_degree
                         true when the page says electives make up the rest of
                         the degree total and prints no figure for them
                         (Psychology AA-T: "Total 60" = a 19-21-unit major,
                         CalGETC 34-38 and transferable electives).
When the record carries no major total and does carry a degree total, the check
adds the blocks, the open electives and the general education units against
the degree total (arithmetic "against": "degree"). With electives filling the
rest, it passes when every end of that sum fits under the degree total, and
"fill" names the units the electives make up. A major total, when printed, is
still the one checked ("against": "program").

Sam's Open Asks Sheet 81 (2026-10-14, both his own call) counts two more such
records as adding up, each "equal" with a field that says how:
  card 1, "Count it"   the degree total sits inside the span the blocks, open
                       electives and general education allow (Cabrillo prints
                       general electives as a range that takes up the rest of
                       60; the record keeps them as one number, so the sum reads
                       57-60 against 60): "within": true.
  card 2, "adt"        an associate degree for transfer whose page prints its
                       total and no electives: 60 units by statute (Ed. Code
                       66746(a)), with transferable electives making up what the
                       major and general education leave, so every end of the
                       sum must fit under the total: "transfer": true and "fill".
degree_verdict() holds both, and kb/_program_requirements_rescore.py applies it
to the records already filed.

Sam's ruling of 2026-11-17 ("Pass short high ends the same way as over-high
ends", docs/reference/sam_rulings.md) is the mirror of Sheet 120 card 1: a
printed unit range whose low end the sum meets exactly, with the sum's high end
short of the range's top (the sum a range or a single figure, #3478), passes as "short_high" (program_verdict for a program
total, degree_verdict for a degree total). An hours record stays out: the ruling
names a unit range, and hours ranges have their own reading (hours_meets_top).

When the catalog prints no figure at all (Mt. San Antonio's Vocational Nursing
names no hours, no units and no total), there is nothing to add. Arithmetic is
then "unstated", and it passes only when all three hold: the record carries no
figure, the closed list stores no units (a noncredit program's 0s), and the
catalog text names no hours or units. A reader that drops printed hours still
fails, and so does a credit record with no total, because the state file holds
its units.

Pure: no network, no model. Tested by tests/program_requirements_pilot_test.py.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _program_requirements_pilot import norm_code  # noqa: E402
import _course_id_route as CI  # noqa: E402

TOL = 0.01


def _num(v) -> float | None:
    try:
        return None if v is None else float(v)
    except (TypeError, ValueError):
        return None


def _span(total) -> tuple[float, float] | None:
    if isinstance(total, dict):
        lo, hi = _num(total.get("min")), _num(total.get("max"))
        if lo is None and hi is None:
            return None
        return (lo if lo is not None else hi, hi if hi is not None else lo)
    v = _num(total)
    return None if v is None else (v, v)


# A figure of hours or units printed in catalog text ("136 Hours", "4.5-9 hours",
# "6 units"). Used only to confirm that a page states no figure at all.
FIGURE = re.compile(r"\b\d+(?:\.\d+)?(?:\s*[-\u2013]\s*\d+(?:\.\d+)?)?\s*(?:hours?|hrs?|units?)\b", re.I)


def alternatives(course: dict) -> list[dict]:
    """A course's alternatives as objects. Version 1 wrote bare codes; a bare
    code carries no units and takes its parent's catalog_addition."""
    out = []
    for a in course.get("alternatives") or []:
        if isinstance(a, dict):
            if a.get("code"):
                out.append(a)
        elif a:
            out.append({"code": a, "units": None,
                        "catalog_addition": bool(course.get("catalog_addition"))})
    return out


# An eLumen publish call's packed code (De Anza, S637-S638): a fixed-width subject that keeps its
# spaces and slash, a campus letter, four characters of number. A record read before the reader
# unpacked it carries it as printed (C DD010G, E SD001., F/TVD02AH); the scorer reads it as the
# listed course it names (C D 10G), and only when the state's file lists that course. Only at a
# college whose reconcile entry says packed_codes, and only on De Anza's campus letter D: elsewhere
# the same reading names another real course (Lemoore's ENGR025 is no ENG 25; review of #3109).
PACKED_CODE = re.compile(r"([A-Z&](?:[A-Z&/ ]{0,6}[A-Z&/])?)D(\d{2,3}[A-Z.]{0,2})")


def unpacked_code(code: str | None) -> str | None:
    """A packed eLumen code as the page's script shows it, or None."""
    m = PACKED_CODE.fullmatch((code or "").strip().upper())
    if not m:
        return None
    num = m.group(2)
    if len(num) != 4 and not (len(num) == 3 and num.isdigit()):
        return None
    return "%s %s" % (m.group(1), num.rstrip(".").lstrip("0") or "0")


def listed_key(code: str | None, listed: dict, packed: bool = False) -> str:
    """_listed_key, then, at a college that packs its codes, the listed course a packed code names."""
    k = _listed_key(code, listed)
    if k in listed or not packed:
        return k
    u = unpacked_code(code)
    if u:
        ku = _listed_key(u, listed)
        if ku in listed:
            return ku
    return k


# A course printed with its common course number in parentheses after the local one (Santa Rosa Junior's
# 2026-2027 PDF: "PSYC 1000 (PSYC C1000)", "ECON 2001 (ECON C2001)"; S713). The state's file lists the common
# number alone (PSYCC1000), so the code as written read as one course missing and another invented.
# The common number is the subject, a space, C and four digits, and its subject is the local code's own (#3705's
# second reader: "(MUSC 101)" is no common number, and the catalog's typo "ARTH 1100 (ANTH C1100)" names another
# subject, so either stays as written).
COMMON_NUMBER_IN_PARENS = re.compile(
    r"^\s*([A-Z&][A-Z&/]{0,7})\s*[0-9][0-9A-Z.]*\s*\(\s*([A-Z&][A-Z&/]{0,7})\s+(C\d{4}[A-Z]{0,2})\s*\)\s*$")


def common_number_in_parens(code: str | None) -> str | None:
    """The normal form of a common course number printed in parentheses after a code of the same subject, or None."""
    m = COMMON_NUMBER_IN_PARENS.match((code or "").upper())
    if not m or m.group(1) != m.group(2):
        return None
    return norm_code(m.group(2) + " " + m.group(3))


def _listed_key(code: str | None, listed: dict) -> str:
    """A placed code's key in the closed list: its normal form, or the listed code it
    names once a subject's slash is set aside. The state's file stores some slashed
    subjects without the slash (Crafton Hills' CNAN633, which its page prints CNA/N 633,
    S413), and the two would read as one course missing and another invented. Others
    it stores with the letters after the slash dropped (THART124X2 for the page's
    THART/S 124X2, S414); that reading is tried only when the first finds none. A code
    that prints its common course number in parentheses after the local one ("PSYC 1000
    (PSYC C1000)") is the listed common number, only where the list holds it and not the
    code as written (S713)."""
    k = norm_code(code)
    if k in listed:
        return k
    cn = common_number_in_parens(code)
    if cn and cn in listed:
        return cn
    if "/" not in k:
        return k
    bare = k.replace("/", "")
    for lk in listed:
        if lk.replace("/", "") == bare:
            return lk
    m = re.match(r"([A-Z&]+)/[A-Z]+(\d.*)$", k)
    if m and m.group(1) + m.group(2) in listed:
        return m.group(1) + m.group(2)
    return k


def with_course_ids(record: dict, listed: dict, ids: dict | None, aliases: dict | None = None) -> dict:
    """The record with each code the list lacks named as the listed course whose Program
    Course File id it is (S653, kb/_course_id_route.py): Riverside City's catalog prints
    HIST 14, the list names that control number HIS 14 and the file's CrsId says HIST14.
    ids maps a course id to its listed code (CI.listed_ids). It runs before the college's
    prefix_aliases, which stay as the fallback; a code the list holds is never renamed.
    A listed course the record already places under its own code is never named a second
    time: Laney's page prints COMM C1004 beside COMM 20, the file's id for COMM 20's control
    number is the common-course number, and renaming it would repeat COMM 20 in its block.
    aliases is the college's prefix_aliases that run after: a listed course the record
    places only through one (SPCH 20 for COMM 20) counts as placed, so the route never
    names it a second time (S653 review)."""
    if not ids:
        return record
    out = json.loads(json.dumps(record))
    seen = with_prefix_aliases(record, listed, aliases) if aliases else record
    have = {k for k, _, _ in placed_codes(seen) if k in listed}

    def rename(entry: dict) -> None:
        k = norm_code(entry.get("code"))
        if k and k not in listed and ids.get(k) in listed and ids[k] not in have:
            entry["code"], entry["printed_code"], entry["matched_by"] = ids[k], k, "course_id"

    for b in out.get("blocks") or []:
        for c in b.get("courses") or []:
            rename(c)
            for a in c.get("alternatives") or []:
                if isinstance(a, dict):
                    rename(a)
    return out


def with_prefix_aliases(record: dict, listed: dict, aliases: dict | None) -> dict:
    """The record with each code the state's file lists only under another subject prefix
    named by it (San Joaquin Delta, S422: the catalog prints ANTH 2L, ENGL 35, ARTH 2 and
    COMM 7 where the file keeps ANTHR 2L, ENG 35, ART 2 and COM ST 7, same number and title).
    aliases maps the page's prefix to the file's, one college's at a time
    (kb/program_requirements_reconcile.json, prefix_aliases); a code the file lists as
    printed is never renamed."""
    if not aliases:
        return record
    table = {norm_code(k): norm_code(v) for k, v in aliases.items()}
    # A key naming a whole course (it has a digit) is a renumbered course: Merced prints
    # MECH22A Diesel Engines 4 where the file lists AGMA 11 Diesel Engines 4 (S423).
    courses = {k: v for k, v in table.items() if re.search(r"\d", k)}

    def rename(entry: dict) -> None:
        k = norm_code(entry.get("code"))
        if not k or k in listed:
            return
        if k in courses and courses[k] in listed:
            entry["code"] = courses[k]
            entry["printed_code"] = k
            return
        m = re.match(r"([A-Z&]+)(\d.*)$", k)
        if m and m.group(1) in table and table[m.group(1)] + m.group(2) in listed:
            entry["code"] = table[m.group(1)] + m.group(2)
            entry["printed_code"] = k

    out = json.loads(json.dumps(record))
    for b in out.get("blocks") or []:
        for c in b.get("courses") or []:
            rename(c)
            for a in c.get("alternatives") or []:
                if isinstance(a, dict):
                    rename(a)
    return out


def placed_codes(record: dict) -> list[tuple[str, dict, dict]]:
    """(normalized code, the entry naming it, block) for every code the record
    places, alternatives included. The entry carries that code's own
    catalog_addition."""
    out = []
    for b in record.get("blocks") or []:
        for c in b.get("courses") or []:
            for entry in [c] + alternatives(c):
                if entry.get("code"):
                    out.append((norm_code(entry["code"]), entry, b))
    return out


def measure(record: dict) -> str:
    return (record.get("program") or {}).get("measure") or "units"


def lab_pairs(alts: list[dict], listed: dict | None = None, hours: bool = False) -> list[dict]:
    """The alternatives with each lecture and its own lab taken together (S713, Clovis): an alternative whose code is
    another alternative's with L added (BIOL C1001 and BIOL C1001L, BIOL 13 and BIOL 13L), where neither carries a
    together label, is one option with it. Clovis prints "BIOL C1000 or BIOL C1001 and BIOL C1001L"; the reading
    kept the pair as two alternatives, so the row's low end took the 1-unit lab alone. A member with no units of its
    own or on the state's list (listed; never in hours) pairs with nothing, so the pair never drops out of the row's
    options (#3708's second reader: "X (5) or BIO 11 (3) and BIO 11L" kept 5-5). Copies; the record is unchanged."""
    # The code as the page printed it: a course-id or alias rename (printed_code) must not split a pair the page
    # prints (Clovis's BIOL C1001 renamed to the file's BIOL 10 beside BIOL C1001L; course_id_route_test).
    keys = [norm_code(a.get("printed_code") or a.get("code")) for a in alts]
    out = [dict(a) for a in alts]

    def units(a):
        if _num(a.get("units")) is not None or _num(a.get("units_max")) is not None:
            return True
        return not hours and (listed or {}).get(listed_key(a.get("code"), listed or {})) is not None

    for i, k in enumerate(keys):
        if not k or out[i].get("together") or not units(out[i]):
            continue
        for j, kl in enumerate(keys):
            if j != i and kl == k + "L" and not out[j].get("together") and units(out[j]):
                out[i]["together"] = out[j]["together"] = "lab pair " + k
                break
    return out


def choice_units(course: dict, listed: dict, hours: bool = False) -> tuple[float, float] | None:
    """The units one choice carries: the record's own number (and the top of a
    printed range), else the closed list's; an alternatives group runs from its
    smallest option to its largest. In hours, the closed list is never read.

    A paired alternative (S681 second reader, A): alternatives sharing one "together" label are one option, taken
    together in place of the row (Coastline's SPAN C180A and C180B for SPAN C180). The option carries its members'
    own units added up, or, where a member has none, the group's "together_units" (and "together_units_max")."""
    vals = []
    groups: dict = {}
    alts = lab_pairs(alternatives(course), listed, hours)
    for entry in alts:
        if entry.get("together"):
            groups.setdefault(entry["together"], []).append(entry)
    for members in groups.values():
        g = [v for v in (_num(members[0].get("together_units")), _num(members[0].get("together_units_max")))
             if v is not None]
        lo = hi = 0.0
        for m in members:
            own = [v for v in (_num(m.get("units")), _num(m.get("units_max"))) if v is not None]
            if not own and not hours and not g:
                u = listed.get(listed_key(m.get("code"), listed))
                own = [u] if u is not None else []
            if not own:
                lo = None
                break
            lo, hi = lo + min(own), hi + max(own)
        if lo is not None:
            vals += [lo, hi]
        elif g:
            vals += [min(g), max(g)]
    for entry in [course] + [a for a in alts if not a.get("together")]:
        # A course the page says is taken more than once ("If MUS 11 is chosen, it must be taken
        # for 2 semesters", Hartnell's Music 43887, S497) carries times: its units count that often.
        times = _num(entry.get("times")) or 1
        own = [v * times for v in (_num(entry.get("units")), _num(entry.get("units_max"))) if v is not None]
        if _num(entry.get("units_total")) is not None:
            # The page prints the repeats' sum ("four times in CAT 69V for a total of 16 units", Delta 44197,
            # S498): that figure, never the course's range times the count.
            own = [_num(entry["units_total"])]
        if own:
            vals += own
        elif not hours:
            u = listed.get(listed_key(entry.get("code"), listed))
            if u is not None:
                vals.append(u * times)
    if not vals:
        return None
    return (min(vals), max(vals))


def block_units(block: dict, listed: dict, hours: bool = False
                ) -> tuple[tuple[float, float] | None, list[str]]:
    """The units a block contributes to the program, and why it could not be
    computed when it cannot. A choose-courses list's printed units are its floor,
    never its ceiling (Sam, Open Asks Sheet 144 card 2 "floor", 2026-10-30): each end
    is the larger of what the courses add to and what the list prints, and the
    printed figure stands alone where the courses cannot be added. Before it, a
    list printing "Select one course (5 units)" over a 3-unit course carried the
    program's low end under the page; with it in place of the courses, a list
    printing "Select two courses (6 units)" over courses of 6 to 7 dropped the top
    the program's own total carries (S529 read the 44 that reading unpassed)."""
    span, why = block_units_summed(block, listed, hours)
    stated = _span(block.get("stated"))
    if block.get("rule") == "choose_courses" and stated:
        return ((max(span[0], stated[0]), max(span[1], stated[1])) if span else stated), []
    return span, why


def block_units_summed(block: dict, listed: dict, hours: bool = False
                       ) -> tuple[tuple[float, float] | None, list[str]]:
    """block_units before the printed floor: what the block's courses add to. The
    block total the catalog prints stands in when a course's units are missing or
    the rule picks units. kb/_program_requirements_floor_rescore.py reads it to
    find the records the floor moves."""
    rule, minimum = block.get("rule"), _num(block.get("minimum"))
    # Courses the catalog recommends count toward nothing (Sam's rule 4, 2026-10-11:
    # "The recommended Electives should be added with blocks").
    if rule == "recommended":
        return (0.0, 0.0), []
    stated = _span(block.get("stated"))
    spans = [choice_units(c, listed, hours) for c in block.get("courses") or []]
    if rule == "all":
        if any(s is None for s in spans):
            if stated:
                return stated, []
            return None, ["a required course in '%s' has no units" % block.get("name")]
        return (sum(s[0] for s in spans), sum(s[1] for s in spans)), []
    if rule == "choose_units":
        if stated:
            return stated, []
        if minimum is None:
            return None, ["'%s' chooses units but names no minimum" % block.get("name")]
        return (minimum, minimum), []
    if rule == "choose_courses":
        if minimum is None:
            return None, ["'%s' chooses courses but names no minimum" % block.get("name")]
        known = [s for s in spans if s is not None]
        n = int(minimum)
        if len(known) < len(spans) and stated:
            return stated, []
        if len(known) < n:
            return None, ["'%s' chooses %d courses but %d carry units"
                          % (block.get("name"), n, len(known))]
        if block.get("repeats"):
            # n enrollments from a list a student may repeat ("2 semesters of any of the following
            # Courses", Music 43887, S497): the least course n times, the largest n times.
            if not known:
                return None, ["'%s' chooses %d courses but none carries units" % (block.get("name"), n)]
            return (min(s[0] for s in known) * n, max(s[1] for s in known) * n), []
        lows = sorted(s[0] for s in known)[:n]
        # A count printed as a range ("COMPLETE 3-4 COURSES FROM THE FOLLOWING", Los Angeles Valley's
        # French 02965, S534) keeps its top as maximum: the high end takes that many.
        top = max(n, int(_num(block.get("maximum")) or n))
        highs = sorted((s[1] for s in known), reverse=True)[:top]
        return (sum(lows), sum(highs)), []
    return None, ["'%s' has no rule the scorer knows (%r)" % (block.get("name"), rule)]


# A list the page names by a figure only in words or only in its heading (Glendale, S713). Its Liberal Arts: Science
# and Mathematics Emphasis 18639 heads its last list "CHOOSE ADDITIONAL UNITS TO COMPLETE A MINIMUM TOTAL OF EIGHTEEN",
# and its Interdisciplinary Humanities: Creativity 12503 "CHOOSE THREE COURSES FROM THREE DIFFERENT DISCIPLINES FOR A
# MINIMUM OF NINE UNITS"; the reading kept the heading and left the block's figure unset. heading_figure reads the
# figure from the heading of a block that carries none of its own. Equal to the program's printed total, the list
# fills the program to it (fills_to, as the reconcile's fill_to step writes it); any other figure is the list's own
# floor (Kinesiology 32854's "FOR A MINIMUM OF 3 UNITS", the reconcile's own guard). A "minimum total of" figure names
# the program's total, so it is read only as a fill, never as a list's floor; any other figure is read only with
# "units" after it ("FOR A MINIMUM OF TWO" may count courses; #3707's second reader). Only a figure in words: a figure
# in digits is the reconcile's fill_to step's, set per college with the words it read (Los Angeles Valley, S534), and
# a record read before that step keeps its own sum (program_requirements_pilot_test, Economics 02984).
WORD_NUMBERS = {w: float(i) for i, w in enumerate(
    "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen "
    "eighteen nineteen twenty".split())}
WORD_NUMBERS.update({"thirty": 30.0, "forty": 40.0, "fifty": 50.0, "sixty": 60.0})
_WORDS = "|".join(sorted(WORD_NUMBERS, key=len, reverse=True))
HEADING_FIGURE = re.compile(
    r"\b(?:for|to\s+(?:complete|reach))\s+a\s+minimum\s+(?:(?P<total>total)\s+of\s+(?P<n>%s)(?:\s+units?)?"
    r"|of\s+(?P<m>%s)\s+(?:total\s+)?units?)\s*\.?\s*$" % (_WORDS, _WORDS), re.I)


def heading_is_total(block: dict) -> bool:
    """Whether the block's heading figure is a "minimum total of" figure: the program's total, read only as a fill."""
    m = HEADING_FIGURE.search(str(block.get("name") or ""))
    return bool(m and m.group("total"))


def heading_figure(block: dict) -> float | None:
    """The figure a block's heading prints in words at its end ("... FOR A MINIMUM OF NINE UNITS", "... TO COMPLETE A
    MINIMUM TOTAL OF EIGHTEEN"), where the block carries no figure of its own; else None."""
    if _span(block.get("stated")) or _num(block.get("fills_to")) is not None:
        return None
    if block.get("rule") == "choose_units" and _num(block.get("minimum")) is not None:
        return None
    if block.get("rule") not in ("choose_units", "choose_courses"):
        return None
    m = HEADING_FIGURE.search(str(block.get("name") or ""))
    if not m:
        return None
    return WORD_NUMBERS[(m.group("n") or m.group("m")).lower()]


# A list the page says a student takes only in place of a required course (Glendale's language degrees and
# certificates, S713: "If 20 units have not been reached in the required core, select one course from the
# following", and Spanish A.A-T 32394's "LIST A - SELECT ONE OF THE FOLLOWING IF ANY REQUIRED COURSES WERE
# SUBSTITUTED"). The core prints four 5-unit courses and the page prints 18-20: a student completes the core as
# printed (20), or, placed past or substituted out of one core course, takes one course from the list in its place
# (15 + 3 = 18). The list adds nothing to the core as printed, and stands in for one of its courses.
SUBSTITUTE_HEADING = re.compile(
    r"\bif\s+(?:\d{1,2}|[a-z]+)\s+units\s+(?:have|has)\s+not\s+been\s+reached\s+in\s+the\s+required\s+core\b"
    r"|\bif\s+any\s+required\s+courses?\s+(?:were|was|are|is)\s+substituted\b", re.I)
# A heading that says the list is not for that student ("Do not select from this list if any required courses were
# substituted"; #3707's second reader) is no substitute list.
SUBSTITUTE_NEGATED = re.compile(r"\b(?:do\s+not|don[\'\u2019]t|never|not\s+to)\s+(?:select|take|choose|use)\b", re.I)


def substitute_core(record: dict, listed: dict, hours: bool = False) -> tuple[dict, list] | None:
    """(the substitute list, the core's course spans) where the record holds exactly one list a student takes only in
    place of a required course (SUBSTITUTE_HEADING, a choose_courses list outside any option group) and exactly one
    all-required block (the core) outside any option group whose every course carries units; else None."""
    blocks = record.get("blocks") or []
    subs = [b for b in blocks if b.get("rule") == "choose_courses" and not b.get("option_group")
            and SUBSTITUTE_HEADING.search(str(b.get("name") or ""))
            and not SUBSTITUTE_NEGATED.search(str(b.get("name") or ""))]
    cores = [b for b in blocks if b.get("rule") == "all" and not b.get("option_group")]
    if len(subs) != 1 or len(cores) != 1:
        return None
    spans = [choice_units(c, listed, hours) for c in cores[0].get("courses") or []]
    if not spans or any(s is None for s in spans):
        return None
    return subs[0], spans


# A list that also takes the courses an earlier list did not use (Clovis, S713): "List B: Select one course" over MATH 6
# and the row "Any course from List A not already used", which the reading kept in its note or in the list's name
# ("List C: Select one course or any course not selected from List A or List B"), never as courses. The list's least
# then runs over its own courses and the earlier list's courses that list left, and so does its most.
ALSO_FROM_NAME = re.compile(
    r"\bany\s+(?:course\s+)?(?:not\s+(?:selected|already\s+used)\s+)?from\s+List\s+([A-Z])\b(?:\s+or\s+(?:List\s+)?([A-Z])\b)?",
    re.I)
ALSO_FROM_NOTE = re.compile(
    r"\bList\s+([A-Z])\s+(?:also\s+)?allows\s+'?Any\s+(?:course\s+from\s+List\s+([A-Z])(?:\s+or\s+List\s+([A-Z]))?"
    r"|List\s+([A-Z])(?:\s+or\s+([A-Z]))?\s+course)\s+not\s+already\s+used", re.I)
LIST_LETTER = re.compile(r"^\s*List\s+([A-Z])\b", re.I)


def also_from(record: dict) -> dict:
    """{a list's index: [the earlier lists' indexes]} for each choose-courses list the reading names as also taking an
    earlier list's unused courses, from its name or the reader's note; only lists named "List X" once each, outside
    any option group, with a count, no printed figure and no repeats."""
    blocks = record.get("blocks") or []
    letter: dict = {}
    for i, b in enumerate(blocks):
        m = LIST_LETTER.match(str(b.get("name") or ""))
        if m:
            letter.setdefault(m.group(1).upper(), []).append(i)
    letter = {k: v[0] for k, v in letter.items() if len(v) == 1}

    def plain(i):
        b = blocks[i]
        return bool(b.get("rule") == "choose_courses" and _num(b.get("minimum")) and not b.get("option_group")
                    and not _span(b.get("stated")) and not b.get("repeats"))

    found: dict = {}
    for i, b in enumerate(blocks):
        m = ALSO_FROM_NAME.search(str(b.get("name") or ""))
        if m:
            found.setdefault(i, set()).update(x.upper() for x in m.groups() if x)
    for n in (record.get("notes") or []):
        for m in ALSO_FROM_NOTE.finditer(str(n)):
            t = letter.get(m.group(1).upper())
            if t is not None:
                found.setdefault(t, set()).update(x.upper() for x in m.groups()[1:] if x)
    out = {}
    for t, letters in found.items():
        srcs = sorted(letter[x] for x in letters if x in letter and letter[x] < t)
        if srcs and plain(t) and all(plain(j) for j in srcs):
            out[t] = srcs
    # A chain (C takes B's leftovers and B takes A's) would count a course twice, once in each pool (#3708's second
    # reader: A {3, 3}, B {5} and C {5} read 9 where the least is 11): a list whose source is itself a target takes
    # no reading.
    return {t: srcs for t, srcs in out.items() if not any(j in out for j in srcs)}


def also_from_span(blocks: list, t: int, srcs: list, listed: dict, hours: bool = False):
    """The list's units with the earlier lists' unused courses in its pool, or None where a course carries none."""
    def spans(b):
        out = [choice_units(c, listed, hours) for c in b.get("courses") or []]
        return None if any(x is None for x in out) else out
    own = spans(blocks[t])
    if own is None:
        return None
    lo_pool, hi_pool = [x[0] for x in own], [x[1] for x in own]
    for j in srcs:
        sp = spans(blocks[j])
        if sp is None:
            return None
        n = int(_num(blocks[j].get("minimum")))
        top = max(n, int(_num(blocks[j].get("maximum")) or n))
        lo_pool += sorted(x[0] for x in sp)[n:]
        hi_pool += sorted((x[1] for x in sp), reverse=True)[top:]
    n = int(_num(blocks[t].get("minimum")))
    top = max(n, int(_num(blocks[t].get("maximum")) or n))
    if len(lo_pool) < n:
        return None
    return (sum(sorted(lo_pool)[:n]), sum(sorted(hi_pool, reverse=True)[:top]))


# One option the reading split over several blocks of its option group (City College of San Francisco, S714). Data
# Science A.S. 42228 prints "Choose one of the following options Units 5.0-10.0": Option 1 (MATH 108) or Option 2
# (CS 110A and a statistics course, 9.0-10.0), read as three blocks of one group, "Option 1", "Option 2" and "Option 2:
# A statistics course", so the scorer took the statistics course as a third alternative. Chinese (Mandarin) 39727
# reads each of its two options as two blocks ("Option 1 (Chinese language learners) - Required: ..." and "Option 1
# (Chinese language learners) - Choose at least 11 units ..."). Blocks of one group whose names open with the same
# "Option N" are one option: their units add up, and the sum is one alternative of the group. Only where two or more
# blocks of the group open with the same option and every block of the group opens with one; a group of alternatives
# named otherwise reads as before. OPTION_PARTS_ON lets a rescore measure the scorer with the reading off.
OPTION_PART = re.compile(r"^\s*option\s+(\d{1,2}|[a-z])\b(?!\s*(?:,|or\b|and\b|-\s*\d|–\s*\d|through\b))", re.I)
OPTION_ALTERNATIVE_SUFFIX = re.compile(r"\s*\([^()]*\)\s*$")
OPTION_PARTS_ON = True


OPTION_NAME_FIGURE = re.compile(r"\b(\d+(?:\.\d+)?|%s)\s+(?:semester\s+)?units?\b" % "|".join(
    "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen "
    "seventeen eighteen nineteen twenty".split()), re.I)


def _same_figure(blocks: list) -> bool:
    """Whether every block's name prints one unit figure and the figures are all the same."""
    figs = []
    for b in blocks:
        found = OPTION_NAME_FIGURE.findall(str(b.get("name") or ""))
        if len(found) != 1:
            return False
        f = found[0].lower()
        figs.append(float(f) if f[0].isdigit() else float(
            "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen "
            "seventeen eighteen nineteen twenty".split().index(f)))
    return len(set(figs)) == 1


def option_parts(record: dict) -> dict:
    """{block index: (option group, option key)} for the blocks of a group the reading split one option over."""
    if not OPTION_PARTS_ON:
        return {}
    blocks = record.get("blocks") or []
    by: dict[str, dict[int, str | None]] = {}
    for i, b in enumerate(blocks):
        g = b.get("option_group")
        if g:
            m = OPTION_PART.match(str(b.get("name") or ""))
            by.setdefault(g, {})[i] = m.group(1).lower() if m else None
    out = {}
    for g, ix in by.items():
        keys = list(ix.values())
        if None in keys or len(set(keys)) < 2 or len(set(keys)) == len(keys):
            continue
        # Blocks of one option that carry the same name, apart from a closing parenthesis, are its alternatives, one
        # a language or a track (Mt. San Antonio's Language Core 35796: six "Option 1: Choose sixteen units of
        # sequential courses in one language. (Chinese)", "(French)" and on), never its parts.
        names = [(k, OPTION_ALTERNATIVE_SUFFIX.sub("", str(blocks[i].get("name") or "")).strip().lower())
                 for i, k in ix.items()]
        if len(set(names)) < len(names):
            continue
        # Blocks of one option that each print the same unit figure are its alternatives too ("Option 1: Chinese -
        # 16 units", "Option 1: French - 16 units"; #3714's second reader): a part names its own share, and two
        # parts printing the whole option's figure each would sum past it.
        if any(_same_figure([blocks[i] for i, kk in ix.items() if kk == k]) for k in set(keys)
               if keys.count(k) > 1):
            continue
        out.update({i: (g, k) for i, k in ix.items()})
    return out


# One figure the page prints over several lists or nested options together (S721; the kind S720 filed as the named gap
# pool_figure_not_read). Modesto Junior prints "AGRICULTURE SCIENCE BREADTH COURSES - COMPLETE 9 UNITS" over two lists
# of 6-9 and 0-3 units, which the reading keeps as two blocks and a note ("The Agriculture Science Breadth section
# requires 9 units total, split as 6-9 units ... and 0-3 units"); Ventura's Engineering prints one 9 over Lists B and C
# ("Lists B and C together require a total of 9 units"); El Camino's French prints "Additional courses from List A or
# List B must be completed to achieve 18 total units" over a core and two lists that print only their minimums. The
# scorer added the parts (6-12; 6-15; 12) where the page asks for the units chosen across them together to meet the
# one figure (9; 9; 18). The reading: where one sentence of the reader's notes prints the figure (FIGURE_OVER), says
# the parts are taken together (POOL_WORDS, or a figure the parts complete) and names the parts (lists or groups by
# letter, or a run of two or more adjacent blocks the reading split one heading into), the parts' units together
# meet the figure, and each part's own printed figure still binds (pool_span). A figure equal to the program's printed
# total names the whole program, so the program's sum meets it. Only parts outside any option group, substitute list,
# also-from pool, heading figure or fill, and never a pool whose parts cannot reach a fixed figure. POOLED_ON lets a
# rescore measure the scorer with the reading off.
POOLED_ON = True
_FIG = r"(?P<n>\d+(?:\.\d+)?)"
_FIG_TOP = r"(?:\s*[-\u2013]\s*(?P<m>\d+(?:\.\d+)?))?"
# The figure, in the shapes the readers wrote it: (pattern, a minimum (the parts may run past it), a figure the parts
# complete).
FIGURE_OVER = [(re.compile(p, re.I), least, fill) for p, least, fill in (
    (r"\b(?:a\s+)?(?:combined\s+)?total\s+of\s+" + _FIG + _FIG_TOP + r"\s+(?:[a-z]+\s+)?units?\b", False, False),
    (r"\bmust\s+total\s+" + _FIG + r"\s+units?\b", False, False),
    (r"\b" + _FIG + r"-unit\s+(?:combined\s+)?minimum\b", True, False),
    (r"\bCOMPLETE\s+" + _FIG + r"\s+UNITS\b", False, False),
    (r"\brequires?\s+" + _FIG + r"\s+units\b", False, False),
    (r"\brequires?\s+a\s+minimum\s+of\s+" + _FIG + r"\s+units\b", True, False),
    (r"\bSELECT\s+" + _FIG + r"\s+UNITS\s+MINIMUM\b", True, False),
    (r"\bto\s+(?:achieve|total|reach)\s+" + _FIG + r"\s+(?:total\s+)?units\b", False, True),
    (r"\bto\s+(?:achieve|total|reach)\s+(?:at\s+least|a\s+minimum\s+of)\s+" + _FIG + r"\s+(?:total\s+)?units\b",
     True, True),
    (r"\b(?:an\s+)?additional\s+" + _FIG + r"\s+units\s+(?:are|is)\s+required\b", False, False),
    (r"\brequires?\s+one\s+" + _FIG + r"-unit\s+course\b", False, False))]
POOL_WORDS = re.compile(
    r"\b(?:together|combined|across|spans?|container|split\s+(?:as|into)|sub-?(?:blocks?|lists?|groups?)|nested"
    r"|covers|parent|wrapper|overarching|either\s+list|applies\s+to)\b", re.I)
# A figure the program's own lists complete ("to achieve 18 total units", "to total at least 18 units") names the
# lists or areas it is taken from.
POOL_PARTS = re.compile(r"\b(?:lists?|areas?|groups?|categor(?:y|ies))\b", re.I)
POOL_LETTERS = re.compile(r"\b(?:Lists?|Groups?)\s+([A-Z])\b((?:\s*(?:,|and|or|\+|&|/)\s*(?:(?:List|Group)\s+)?[A-Z]\b)*)")
_POOL_MORE = re.compile(r"\b([A-Z])\b")
BLOCK_LETTER = re.compile(r"\b(?:List|Group)\s+([A-Z])(?=$|[\s:)\-–,.])", re.I)
_SENTENCE = re.compile(r"(?<=[.!?])\s+(?=[A-Z'\"(])")
_STEM_TAIL = re.compile(r"\s*(?:[-–]\s*COMPLETE\b.*|\bCONTINUED\b.*|\([^()]*\)\s*)$", re.I)


def _stem(name) -> str:
    s = re.sub(r"\s+", " ", str(name or "")).strip().upper()
    prev = None
    while s and s != prev:
        prev, s = s, _STEM_TAIL.sub("", s).strip(" -–:")
    return s


def _stem_keys(stem: str) -> list[str]:
    """The words a note may name a heading by: the heading, the heading less a closing COURSES, that less its first
    word, and a label's first two words where the second is a number or a letter ("AREA 1", "LIST A")."""
    w = stem.split()
    out = [stem]
    if w and w[-1] in ("COURSES", "COURSE"):
        w = w[:-1]
        out.append(" ".join(w))
    if len(w) >= 3:
        out.append(" ".join(w[1:]))
    if len(w) >= 3 and re.fullmatch(r"\d{1,2}|[A-Z]", w[1]):
        out.append(" ".join(w[:2]))
    return [k for k in out if k]


# #3764's second reader: a sentence that hedges, makes the list conditional or negates the pool is no reading of one
# (Reedley 33833 "not stated (likely from either list)", Cuesta 32562 "applies only to students who begin in SPAN
# 203", "Lists A and B are not combined"); nor is a sentence that gives each part its own figure (Ventura 36858
# "each list requires 3 units").
POOL_REFUSED = re.compile(
    r"\b(?:likely|appears?|apparently|possibly|perhaps|probably|unclear|uncertain|not\s+stated|reviewer|should\s+check"
    r"|conditional|applies\s+only|only\s+(?:applies|for|to|when|if|students)|if\s+(?:a|an|the|any|students?|they)"
    r"|not\s+(?:\w+\s+){0,2}(?:together|combined|pooled|shared)"
    r"|each\s+(?:list|group|area|block|sub-?list)\s+(?:requires?|needs?|carries|has|prints))", re.I)
# The program's printed total is read over its lists only where the sentence says the lists complete it together
# (the second reader's finding 2: Ohlone 41245 "covers the whole Major Field list", Yuba 36015 "continues across a page
# break" and Santa Ana 39840 restate the total).
POOL_COMPLETES = re.compile(
    r"\b(?:together|combined\s+(?:total|minimum)|(?:lists?|[A-Z])\s+combined|either\s+list|and/or|any\s+category"
    r"|additional\s+(?:units|courses)|remaining\s+\d+(?:\.\d+)?\s+units|across\s+both\s+lists|from\s+the\s+above\s+areas"
    r"|to\s+(?:total|achieve|reach))\b")
# A figure belongs to the letters or the heading it is printed beside: within this many characters of them.
POOL_NEAR = 60
POOL_NEAR_HEADING = 40


def _pool_figures(sentence: str) -> list[tuple]:
    """Every figure the sentence prints, as (start, end, lo, hi, minimum, fill, words), in order."""
    out = []
    for rx, least, fill in FIGURE_OVER:
        for m in rx.finditer(sentence):
            n = float(m.group("n"))
            top = _num(m.groupdict().get("m")) or n
            out.append((m.start(), m.end(), n, max(n, top), least, fill, m.group(0)))
    return sorted(out)


def _pool_figure(sentence: str):
    """(lo, hi, minimum, fill, words) for the first figure the sentence prints, else None."""
    figs = _pool_figures(sentence)
    return figs[0][2:] if figs else None


def _key_pattern(key: str):
    return re.compile(r"\b" + r"[^A-Za-z0-9]+".join(re.escape(w) for w in key.split()) + r"\b", re.I)


def _figure_after(sentence: str, keys: list[str], figs: list[tuple]):
    """The figure printed right after the heading's own words (the next figure, within POOL_NEAR_HEADING characters),
    from the last mention that has one; else None."""
    best = None
    for k in keys:
        for m in _key_pattern(k).finditer(sentence):
            nxt = next((f for f in figs if f[0] >= m.end()), None)
            if nxt and nxt[0] - m.end() <= POOL_NEAR_HEADING and (best is None or m.start() > best[0]):
                best = (m.start(), nxt)
    return best[1] if best else None


def pooled_figures(record: dict) -> list[dict]:
    """The figures the record's notes print over several of its blocks together: [{"blocks": [indexes] or "all",
    "figure": (lo, hi), "minimum": bool, "words": the sentence}], one per block set, none where two sentences give
    the same blocks different figures or two block sets overlap. Each figure is bound to the letters or the heading
    it is printed beside (#3764's second reader); a sentence that names two split headings, hedges or negates reads
    none."""
    if not POOLED_ON or window_cut(record):
        # A pool fills its parts to the figure, so a reader's note saying the requirements run outside the text read
        # refuses it, as it refuses an electives fill (Fullerton 18166: its Category C list is cut off; S720).
        return []
    blocks = record.get("blocks") or []
    prog = record.get("program") or {}
    total = _span(prog.get("total_units"))
    letter: dict = {}
    for i, b in enumerate(blocks):
        m = BLOCK_LETTER.search(str(b.get("name") or ""))
        if m:
            letter.setdefault(m.group(1).upper(), []).append(i)
    runs = []
    i = 0
    while i < len(blocks):
        j = i
        st = _stem(blocks[i].get("name"))
        while j + 1 < len(blocks) and st and _stem(blocks[j + 1].get("name")) == st:
            j += 1
        if j > i:
            runs.append((list(range(i, j + 1)), st))
        i = j + 1

    def is_total(f):
        return bool(total) and abs(total[0] - f[2]) <= TOL and abs(total[1] - f[3]) <= TOL

    found: dict = {}
    for note in record.get("notes") or []:
        for sent in _SENTENCE.split(str(note)):
            figs = _pool_figures(sent)
            if not figs or POOL_REFUSED.search(sent):
                continue
            pooled = bool(POOL_WORDS.search(sent))
            tot = next((f for f in figs if is_total(f)), None)
            if tot is not None:
                # The program's own total: the lists complete it, where the sentence names them and says so.
                if (pooled or tot[5]) and POOL_PARTS.search(sent) and POOL_COMPLETES.search(sent):
                    found.setdefault("all", set()).add(((tot[2], tot[3]), tot[4], sent))
                continue
            if not pooled or len({(f[2], f[3]) for f in figs}) > 1:
                # A sentence printing two different figures over its parts (two headings' figures, or a heading and
                # a total that disagree: Modesto 08018's "COMPLETE 12 UNITS prints Total 9") reads none (#3764's
                # second reader, finding 3).
                continue
            ix, fig = None, None
            lets, spans = set(), []
            for lm in POOL_LETTERS.finditer(sent):
                lets.add(lm.group(1))
                lets.update(_POOL_MORE.findall(lm.group(2) or ""))
                spans.append(lm.span())
            if len(lets) >= 2 and all(x in letter for x in lets):
                ix = sorted(k for x in lets for k in letter[x])
                # The figure nearest the letters, before or after them, within POOL_NEAR characters.
                lo_s, hi_s = min(x for x, _ in spans), max(y for _, y in spans)
                near = [(max(lo_s - f[1], f[0] - hi_s, 0), f) for f in figs]
                near = [x for x in near if x[0] <= POOL_NEAR]
                fig = min(near, key=lambda x: x[0])[1] if near else None
            else:
                named = [(r, st) for r, st in runs if any(_key_pattern(k).search(sent) for k in _stem_keys(st))]
                if len(named) == 1:
                    ix = named[0][0]
                    fig = _figure_after(sent, _stem_keys(named[0][1]), figs)
            if ix and len(ix) >= 2 and fig is not None:
                found.setdefault(tuple(ix), set()).add(((fig[2], fig[3]), fig[4], sent))
    out, used = [], set()
    for key, figs in found.items():
        if len({f for f, _, _ in figs}) != 1:
            continue
        fig, least, sent = sorted(figs, key=lambda x: x[2])[0]
        least = all(x[1] for x in figs)
        if key != "all":
            if used & set(key):
                return []
            used |= set(key)
        out.append({"blocks": "all" if key == "all" else list(key), "figure": fig, "minimum": least, "words": sent})
    return out


def pool_open(block: dict) -> bool:
    """Whether a part may run past its own figure: a choice list that prints no figure of its own."""
    return block.get("rule") in ("choose_units", "choose_courses") and not _span(block.get("stated"))


def pool_span(fig: tuple[float, float], minimum: bool, lo: float, hi: float, open_: bool):
    """The units the parts (lo-hi as added) carry under the one figure printed over them: each end at least the
    figure's low end and the parts' own floors; a fixed figure holds the high end to its top, where a minimum lets
    the parts' high end stand. None where parts that cannot run past their own figures fall short of it."""
    a, b = fig
    if not open_ and hi < a - TOL:
        return None
    plo = max(a, lo)
    if minimum:
        return plo, max(b, hi, plo)
    if open_:
        return plo, max(plo, b)
    return plo, max(plo, min(b, hi))


def pools_read(record: dict, sub, also: dict) -> list[dict]:
    """pooled_figures less any pool the scorer reads another way: a part in an option group, the substitute list, an
    also-from pool, a heading figure, a fill or a recommended list; a whole-program figure where a list already fills
    the program."""
    blocks = record.get("blocks") or []
    taken = set(also) | {j for js in also.values() for j in js}
    out = []
    for p in pooled_figures(record):
        if p["blocks"] == "all":
            if any(_num(b.get("fills_to")) is not None or heading_figure(b) is not None for b in blocks):
                continue
        elif any(blocks[i].get("option_group") or (sub and blocks[i] is sub[0]) or i in taken
                 or heading_figure(blocks[i]) is not None or _num(blocks[i].get("fills_to")) is not None
                 or blocks[i].get("rule") == "recommended" for i in p["blocks"]):
            continue
        out.append(p)
    return out


def program_units(record: dict, listed: dict) -> tuple[tuple[float, float], list[str]]:
    """Every block's units summed; the blocks of one option_group count once,
    from the group's smallest block to its largest. A figure printed over several lists together counts once
    (pooled_figures, pool_span)."""
    return _program_units(record, listed)


def pooled_moved(record: dict, listed: dict) -> list[dict]:
    """The pools that moved the program's sum, each with the parts' units as added ("parts") and as read ("read")."""
    report: list[dict] = []
    _program_units(record, listed, report)
    return report


def _program_units(record: dict, listed: dict, report: list | None = None
                   ) -> tuple[tuple[float, float], list[str]]:
    hours = measure(record) == "hours"
    lo = hi = 0.0
    reasons: list[str] = []
    groups: dict[str, list[tuple[float, float]]] = {}
    sub = substitute_core(record, listed, hours)
    total = _span((record.get("program") or {}).get("total_units"))
    heading_fills: list[float] = []
    also = also_from(record)
    blocks_all = record.get("blocks") or []
    parts = option_parts(record)
    part_spans: dict[tuple, list[float]] = {}
    pools = pools_read(record, sub, also)
    pool_of = {i: k for k, p in enumerate(pools) if p["blocks"] != "all" for i in p["blocks"]}
    pool_sum = {k: [0.0, 0.0] for k in set(pool_of.values())}
    for i, b in enumerate(blocks_all):
        if sub and b is sub[0]:
            # In place of one core course: the core as printed, or the core less one course plus the list.
            span, why = block_units(b, listed, hours)
            if span is None:
                reasons += why
                continue
            lo += min(0.0, span[0] - max(s[0] for s in sub[1]))
            hi += max(0.0, span[1] - min(s[1] for s in sub[1]))
            continue
        n = heading_figure(b)
        fill = n is not None and bool(total) and abs(total[0] - n) <= TOL
        if n is not None and heading_is_total(b) and not fill:
            n = None   # a "minimum total of" figure apart from the printed total: no reading
        if fill:
            # The list fills the program to its printed total. A units list with no figure of its own adds nothing
            # below it; any other list that cannot be added keeps its reasons (#3707's second reader: a choose-courses
            # list whose courses carry no units stays incomplete, as under fills_to).
            heading_fills.append(n)
            span, why = block_units(b, listed, hours)
            if span is None and b.get("rule") == "choose_units" and _num(b.get("minimum")) is None:
                span, why = (0.0, 0.0), []
        elif n is not None:
            span, why = block_units(dict(b, stated={"min": n, "max": n}), listed, hours)
        else:
            # A list taking an earlier list's unused courses (Clovis, S713), where no heading figure is read.
            span = also_from_span(blocks_all, i, also[i], listed, hours) if i in also else None
            span, why = (span, []) if span is not None else block_units(b, listed, hours)
        if span is None:
            reasons += why
            continue
        g = b.get("option_group")
        part = parts.get(i)
        if g and part is not None:
            # One option the reading split over several blocks (option_parts): its blocks add up, and the sum is
            # one alternative of the group.
            if part not in part_spans:
                part_spans[part] = [0.0, 0.0]
                groups.setdefault(g, []).append(part_spans[part])
            part_spans[part][0] += span[0]
            part_spans[part][1] += span[1]
        elif g:
            groups.setdefault(g, []).append(span)
        elif i in pool_of:
            # A part of a figure printed over several lists together (pooled_figures): counted with its pool.
            pool_sum[pool_of[i]][0] += span[0]
            pool_sum[pool_of[i]][1] += span[1]
        else:
            lo += span[0]
            hi += span[1]
    for spans in groups.values():
        lo += min(s[0] for s in spans)
        hi += max(s[1] for s in spans)
    for k, (plo, phi) in sorted(pool_sum.items()):
        p = pools[k]
        read = pool_span(p["figure"], p["minimum"], plo, phi, any(pool_open(blocks_all[i]) for i in p["blocks"]))
        if read is None:
            read = (plo, phi)
        if report is not None and (abs(read[0] - plo) > TOL or abs(read[1] - phi) > TOL):
            report.append(dict(p, blocks=[blocks_all[i].get("name") for i in p["blocks"]],
                               parts=[round(plo, 2), round(phi, 2)], read=[round(read[0], 2), round(read[1], 2)]))
        lo += read[0]
        hi += read[1]
    # A list the page says completes the program to a total ("3-5 UNITS CHOSEN FROM THE FOLLOWING FOR
    # A MINIMUM OF 18 UNITS", "COMPLETE 7-14 UNITS FROM THE FOLLOWING COURSES TO COMPLETE 36 TOTAL UNITS",
    # Los Angeles Valley, S534) carries fills_to: a student takes from it until the sum reaches that
    # figure, so neither end falls below it.
    fills = [_num(b.get("fills_to")) for b in record.get("blocks") or [] if _num(b.get("fills_to"))] + heading_fills
    if fills and not reasons:
        lo, hi = max(lo, max(fills)), max(hi, max(fills))
    whole = [p for p in pools if p["blocks"] == "all"]
    if len(whole) == 1 and not reasons:
        # The program's printed total over its lists ("to achieve 18 total units"): the program's sum meets it.
        p = whole[0]
        read = pool_span(p["figure"], p["minimum"], lo, hi, any(pool_open(b) for b in blocks_all))
        if read is not None and (abs(read[0] - lo) > TOL or abs(read[1] - hi) > TOL):
            if report is not None:
                report.append(dict(p, parts=[round(lo, 2), round(hi, 2)], read=[round(read[0], 2), round(read[1], 2)]))
            lo, hi = read
    return (lo, hi), reasons


def has_figure(record: dict) -> bool:
    """Whether the record carries any number to add: a total, a block total,
    or a course's units."""
    prog = record.get("program") or {}
    if (_span(prog.get("total_units")) or _num(prog.get("open_elective_units"))
            or _span(prog.get("degree_total")) or _span(prog.get("ge_units"))):
        return True
    for b in record.get("blocks") or []:
        if _span(b.get("stated")) or (b.get("rule") == "choose_units" and _num(b.get("minimum"))):
            return True
        for c in b.get("courses") or []:
            for entry in [c] + alternatives(c):
                if _num(entry.get("units")) or _num(entry.get("units_max")):
                    return True
    return False


def repeated(record: dict) -> list[str]:
    """Codes placed more than once inside one block, alternatives included.
    The same course in two blocks is legitimate (Miramar Entrepreneurship's
    BUSE 155 sits in the required list and both elective lists)."""
    out = []
    for b in record.get("blocks") or []:
        seen: dict[str, int] = {}
        for c in b.get("courses") or []:
            for entry in [c] + alternatives(c):
                # A code the aliases renamed counts as printed: a cross-listed course the page prints under each of
                # its prefixes (City College of San Francisco's LALS 9 and LGBT 9, both the file's LALS/LGBT 9; S714)
                # is one row of the file, printed twice, never one course placed twice.
                k = norm_code(entry.get("printed_code") or entry.get("code"))
                if k:
                    seen[k] = seen.get(k, 0) + 1
        out += ["%s in '%s'" % (k, b.get("name")) for k, n in seen.items() if n > 1]
    return out


# ── Outcomes (record shape v3) ───────────────────────────────────────────────
# A catalog's outcomes heading: "Program Learning Outcomes", "Program Student
# Learning Outcomes", "Student Learning Outcomes", "Program Outcomes", and
# Miramar's "Learning Outcome(s):" (the form S327's count of 13 of 20 missed).
OUTCOMES_HEADING = re.compile(
    r"\b(?:program\s+(?:student\s+)?learning|student\s+learning|program|learning)\s+outcome(?:s\b|\(s\)|\b)",
    re.I)

# Glyph forms a reader cannot see as a different word: curly and straight
# quotes, dashes, a soft hyphen. Folded on both sides before comparing; the
# words, spelling, capitals and punctuation marks themselves must match.
_FOLD = str.maketrans({"‘": "'", "’": "'", "“": '"', "”": '"',
                       "–": "-", "—": "-", " ": " ", "­": None})


_LIGATURES = {"Ɵ": "ti", "Ʃ": "tt", "Ō": "ft", "ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl"}
_LIGATURE = re.compile("[%s]" % "".join(_LIGATURES))
_UNSPACED = "\x00"   # marks the reading with no spaces
_SPACED_LETTERS = re.compile(r"(?:\b\w \b){5,}\w\b")   # "T h i s  d e g r e e"
_SPACED_PUNCT = re.compile(r"\w [;,:](?= |$)")         # "occupations ;"
_LINE_END_MARKER = re.compile(r"[ \t]+(?:\d{1,2}\.|[a-z]\))[ \t]*(?=\n|$)")


def _flat(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").translate(_FOLD)).strip()


def _readings(text: str) -> list[str]:
    """The catalog text flattened, plus the two ways a PDF's line-end hyphen
    reads ("self-\\nemployed" as "self-employed" and as "selfemployed"), so an
    outcome copied across a line break still matches."""
    flat = _flat(text)
    # East LA's PDF breaks a word with a hyphen spaced on both sides ("tech - nicians",
    # "profe - sional"); 82 of its 120 records failed the outcomes check on that (run 39011319511).
    readings = [flat, re.sub(r"(\w)- (\w)", r"\1-\2", flat), re.sub(r"(\w)- (\w)", r"\1\2", flat),
                re.sub(r"(\w) - (\w)", r"\1\2", flat)]
    # Solano's PDF prints its ligatures as stand-in glyphs with a space beside them ("IntroducƟ on",
    # "draŌ  landscape plan", "Iden Ɵ ﬁ caƟ on"); 135 of its 162 records failed the outcomes check on that
    # (run 39035226783; page read 39036135577). Which space is the word's own cannot be told ("draŌ  landscape",
    # "aŌ er"), so such text gets one more reading: the ligatures spelled out and every space dropped, which
    # outcomes_check compares with the outcome's own letters, spaces dropped too.
    # Glendale's PDF (S505) breaks a word after a ligature and at a line end in one sentence ("Fulﬁ ll
    # requirements for transfer to a col-\nlege"), spaces a line letter by letter ("b e  a b l e  t o"),
    # and spaces a semicolon from its word ("occupations ;"); 54 of its records failed the outcomes check.
    # The same no-space reading serves all three, and it is read once more with the line-end hyphens joined.
    if _LIGATURE.search(flat) or _SPACED_LETTERS.search(flat) or _SPACED_PUNCT.search(flat):
        spelled = _LIGATURE.sub(lambda m: _LIGATURES[m.group(0)], flat)
        readings.append(_UNSPACED + re.sub(r"\s", "", spelled))
        readings.append(_UNSPACED + re.sub(r"\s", "", re.sub(r"(\w)- (\w)", r"\1\2", spelled)))
    # Ohlone's PDF prints a numbered outcome's number at the end of its first line ("Demonstrate knowledge
    # of real estate listings, deposit receipts, escrows, 2.\nand financing."); 125 of its 146 records failed
    # the outcomes check on that (run 39061732843; page read 39062425296). One more reading drops a list
    # marker printed at a line's end.
    unmarked = _flat(_LINE_END_MARKER.sub("", text or ""))
    if unmarked != flat:
        readings.append(unmarked)
    return readings


def outcome_entries(record: dict) -> list[tuple[str | None, str]]:
    """(course code or None for the program, outcome) for every outcome the
    record carries. Versions 1 and 2 carry none."""
    out = [(None, o) for o in ((record.get("program") or {}).get("outcomes") or [])]
    for c in record.get("course_outcomes") or []:
        out += [(c.get("code"), o) for o in (c.get("outcomes") or [])]
    return out


def outcomes_check(record: dict, text: str | None) -> dict:
    entries = outcome_entries(record)
    heading = bool(OUTCOMES_HEADING.search(text or ""))
    if text is None:
        bad = [o for _, o in entries]
        why = ["no catalog text came to check the outcomes against"] if bad else []
    else:
        readings = _readings(text)
        bad, why = [], []
        for code, o in entries:
            f = _flat(o if isinstance(o, str) else "")
            if not f:
                bad.append(o)
                why.append("an empty outcome%s" % (" under %s" % code if code else ""))
            elif not any((re.sub(r"\s", "", f) if r.startswith(_UNSPACED) else f) in r for r in readings):
                bad.append(o)
                why.append("not in the catalog text as printed%s: %s"
                           % (" (%s)" % code if code else "", f[:80]))
    program_n = len((record.get("program") or {}).get("outcomes") or [])
    return {"program": program_n,
            "courses": len([c for c in record.get("course_outcomes") or [] if c.get("outcomes")]),
            "count": len(entries), "not_verbatim": bad, "why": why,
            "heading_printed": heading, "heading_without_outcomes": heading and not program_n,
            "pass": not bad}


def requirements_md5(record: dict) -> str:
    """A fingerprint of the requirements a person reads (the program's figures
    and every block), leaving out the outcomes and the careers, which the
    scorer checks word for word. A rerun that changes the requirements changes
    it; one that only adds outcomes or careers does not. The server's
    program_record_fp (chatbox/supabase_program_record_verdicts.sql) leaves out
    the same two."""
    program = {k: v for k, v in (record.get("program") or {}).items() if k not in ("outcomes", "careers")}
    body = {"program": program, "blocks": record.get("blocks") or []}
    return hashlib.md5(json.dumps(body, sort_keys=True, ensure_ascii=False,
                                  separators=(",", ":")).encode()).hexdigest()


def careers_check(record: dict, text: str | None) -> dict:
    """Each career the record keeps (record shape v4, Sam's rule 5) must appear in
    the catalog text as printed, as an outcome must. Reported beside the checks;
    it holds no record back."""
    careers = [c for c in ((record.get("program") or {}).get("careers") or [])]
    if text is None:
        return {"count": len(careers), "not_verbatim": list(careers), "pass": not careers}
    readings = [r.lower() for r in _readings(text)]
    bad = [c for c in careers if not _flat(c if isinstance(c, str) else "") or
           not any(_flat(c).lower() in r for r in readings)]
    return {"count": len(careers), "not_verbatim": bad, "pass": not bad}


def passes_live(score: dict | None) -> bool:
    """A record that passes as the live table counts it (program_requirement_records.checks):
    every listed course placed (coverage), none invented, and the arithmetic equal. score["pass"]
    asks more (repeats, outcomes, careers); the harvest's holds and its kept-passing guard judge a
    filed record by this one definition (S641 review, call 3)."""
    sc = score or {}
    return ((sc.get("coverage") or {}).get("pass") is True and (sc.get("invented") or {}).get("pass") is True
            and (sc.get("arithmetic") or {}).get("status") == "equal")


# The arithmetic statuses the tab counts passing: program_requirements.js machineFails and its
# headline's complete count (program_record_machine_pass on the server).
TAB_PASSING = ("equal", "unstated")


def counts_passing_on_tab(checks: dict | None) -> bool:
    """Whether the COBI tab counts a live row passing, from the row's flat checks
    (program_requirement_records.checks): coverage and invented true, arithmetic "equal" or
    "unstated". The load writes the arithmetic as the score's status alone, so a row reads
    "unstated" even where the scorer's own unstated test failed, and the tab counts it passing.
    This is the tab's count, for a headline that must equal it (the gap census, S644). It is not
    passes_live: the harvest's holds and its kept-passing guard keep equal-only (S641 review, call
    3), so an unstated read never replaces an equal record. tests/program_requirements_pilot_test.py
    pins TAB_PASSING to the tab's own expression."""
    c = checks or {}
    return c.get("coverage") is True and c.get("invented") is True and c.get("arithmetic") in TAB_PASSING


def places_none(score: dict | None) -> bool:
    """A scored record that places none of its program's listed courses: the model
    read another program's page or a course-description listing. Sam, Open Asks
    Sheet 62 card 1 (2026-10-11, "remove them"): such a record leaves the live
    table, and each program shows no record until its college's reading
    procedure finds its own page, so the load and the display build leave it out."""
    cov = (score or {}).get("coverage") or {}
    return bool(cov.get("listed")) and cov.get("placed") == 0


ELECTIVE = re.compile(r"\belectives?\b", re.I)
# A PDF's ligature stand-in glyph and the space the text prints after it ("elecƟ ves", Solano, S644).
_LIGATURE_SPACED = re.compile("([%s]) ?" % "".join(_LIGATURES))


def electives_named(prog: dict, text: str) -> bool:
    """Whether the catalog text says electives fill the total a record says they fill: the word
    itself, the word under a PDF's ligature stand-in ("elecƟ ves", as Solano's outcomes read it),
    or the catalog's own sentence a reconcile step filed as electives_fill_words, which says the
    same without the word (S644, the harvest's NEXT 5: Grossmont's 'Complete transferable units as
    needed to reach 60', East Los Angeles's 'COMPLETE ADDITIONAL CSU UNITS, IF NEEDED, TO REACH 60
    CSU TRANSFERABLE UNITS'). The sentence counts only where this text prints it, word for word
    (letter case, punctuation and line breaks aside), so a later read of a page that no longer
    prints it fails the guard again."""
    if ELECTIVE.search(text):
        return True
    if _LIGATURE.search(text) and ELECTIVE.search(_LIGATURE_SPACED.sub(lambda m: _LIGATURES[m.group(1)], text)):
        return True
    words = prog.get("electives_fill_words")
    if not isinstance(words, str) or not _words(words):
        return False
    # The sentence counts only from the record's own heading onward, and not at all where the text prints
    # no heading: a capture window can open on the program before it (East Los Angeles, review of #3193).
    # The files name no next program's heading, so the scope runs to the end of the text, except where the page
    # prints each program's plan line (East Los Angeles, S714): there it ends at the next program's plan line
    # (own_section_end), so a later program's sentence never counts. A heading the reader completed from the
    # description reads from the plan line the page prints under it (own_heading_end, S714).
    from _program_requirements_reconcile import own_heading_end, own_section_end
    start = own_heading_end(text, prog.get("section_heading"))
    if start is None:
        return False
    return " %s " % _words(words) in " %s " % _words(text[start:own_section_end(text, start)])


# ── A fill never closes a window the reader cut off (S720, f-elective-fill-passes-cut-off-windows-s714) ──
# A short sum has two causes the arithmetic cannot tell apart: units the catalog leaves to the student, and rows the
# reader never saw. The electives fills (the program total's here in score(), the degree total's in degree_check)
# claim the first, so each one first asks the record's own words whether the second is the case: a note saying the
# text opens mid-table, a note saying the requirements (a table, list, core, block, rows or courses) are cut off, on
# the previous page or not in the text, or a missing course's own reason placing it outside the window ("likely on
# page 428", "start of table not included"). S714's eight Los Rios records ("begins mid-table", "cut off", "not
# supplied") and S655's American River 07206 are the cases; methodology-a-fill-must-check-what-it-fills.
# The words say what was lost, so a lost heading, description, outcomes or career list, a course-description list or
# a summary table is not this, nor a note saying the requirements are complete, nor a note with no missing course
# behind it. Measured over every committed record at S720, after the second reader: 185 of 18,960 records match, and
# a hand read of 40 drawn at random found 38 saying requirement rows sit outside the text (the two others: another
# program's content not included, Mt. San Antonio 03081; a course named only in the cut-off descriptions, Long Beach
# City 20915); of the 15 passes the guard takes away, all 15 read so by hand.
_CUT_PAGE_AT = r"(?:\s+(?:on|at)\s+(?:the\s+top\s+of\s+)?page\s+\d{1,4})?"
# A requirements noun, never a tab's, a heading's, a label's or a text's name ("the Requirements tab", "'Program
# Requirements' heading"), nor the verb "lists".
_CUT_REQ = (r"\b(?:requirements?|required|core|tables?|rows?|blocks?|list"
            r"|lists(?!\s+(?:a|an|the|only|both|all|each|its|their)\b)|courses?)\b"
            r"(?!['’]?[-\s]+(?:(?:list|section)\s+)?(?:tab|text|heading|label|sequence|descriptions?|itself)\b)")
_CUT_REQ_RE = re.compile(_CUT_REQ, re.I)
# The text opening inside the requirements: "begins mid-table on page 221", "starts mid-list", "opens partway
# through a program's requirements"; not a list of prerequisites, outcomes, careers or other awards.
_CUT_OPENS = re.compile(
    r"\b(?:begins?|starts?|opens?|picks?\s+up)" + _CUT_PAGE_AT +
    r"\s+(?:mid[-\s]?(?:table|list|requirements?|block)\b"
    r"(?!\s+(?:of|with)\s+(?:\w+\s+){0,2}(?:admission|prerequisites?|outcomes?|careers?|other|awards?|GE|Cal-?GETC)\b)"
    r"|(?:partway|part[-\s]way|in\s+the\s+middle)\s+(?:through|of|into)\b[^.;]{0,40}?" + _CUT_REQ + r")", re.I)
_CUT_OPENS_OTHER = re.compile(r"\b(?:prerequisites?|outcomes?|careers?|descriptions?|Cal-?GETC|general\s+education|GE)\b",
                              re.I)
_CUT_NAMES_REQ = re.compile(r"\b(?:requirements?|required|core)\b", re.I)
# The loss, said after the requirements noun in the same clause.
_CUT_LOSS = re.compile(
    r"[^.;:]{0,80}?\b(?:cut[-\s]off|truncated"
    r"|not\s+(?:supplied|extracted|provided|included)(?!\s+in\s+(?:the\s+)?(?:\d|total|sum|count))"
    r"|(?:on|from)\s+(?:the\s+|an\s+)?(?:previous|preceding|prior|earlier)\s+page"
    r"|missing\s+from\s+the\s+(?:text|extraction|excerpt|page|window)"
    r"|(?:(?:may|might)\s+be|is|are)\s+missing(?!\s+from\s+the\s+catalog)"
    r"|not\s+(?:in|within)\s+the\s+(?:supplied\s+|provided\s+|extracted\s+|given\s+|visible\s+)?(?:text|excerpt|window))",
    re.I)
# A list or table of something else, just before the noun ("the Program Outcomes list", "the awards table").
_CUT_OTHER_LIST = re.compile(
    r"\b(?:outcomes?|PSLOs?|SLOs?|careers?|occupations?|jobs?|descriptions?|admission|summary|opportunities|employment"
    r"|headings?|associate\s+degree|awards?|titles?|honors|index|XML|columns?|header|application|prerequisites?"
    r"|general|generic|ADT|AA-T|AS-T|GE|Cal-?GETC|area\s+\d\w?)\b[^.;:,]{0,25}$|\bheading\s+of\s+(?:the|that|this|its)\s+$",
    re.I)
# A heading, title, cell, note, outcome, career or description between the noun and the loss: the loss is its.
_CUT_BETWEEN = re.compile(r"\b(?:headings?|titles?|cells?|notes?|outcomes?|careers?|descriptions?)\b", re.I)
# A sentence saying the loss leaves the requirements whole, or lies in another program or another list.
_CUT_NOT_REQ = re.compile(
    r"\bdoes\s+not\s+affect\b|\b(?:different|another|other|separate)\s+(?:program|degree|certificate|award)\b"
    r"|\bcourse\s+list\s+at\s+the\s+end\b|\bno\s+requirements?\s+(?:\w+\s+){0,3}lost\b|\bfootnotes?\b|\bcourse\s+index\b"
    r"|\bXML\b|\bcolumn\s+header|\bawards?\s+table\b|\bnavigation\b"
    r"|\bbelong(?:s|ing)?\s+to\s+(?:a|an|the)\s+(?:preceding|previous|different|other|another|separate)\b"
    r"|\b(?:appears?|is|are|itself)\s+(?:\w+\s+)?complete\b|\bnot\s+used\s+for\b|\bclosed[-\s]list\b"
    r"|\bstate(?:'s)?\s+(?:file|list)\b"
    # The reader saying nothing was lost ("no courses appear to be cut off", Folsom Lake 33791).
    r"|\bno\s+(?:\w+\s+){0,3}(?:appears?|seems?|is|are|was|were)\s+(?:to\s+be\s+)?(?:cut|missing|lost|truncated)\b",
    re.I)
_CUT_OTHER_SUBJECT = re.compile(r"\b(?:outcomes?|careers?|goals|objectives|awards?\s+table|program\s+table|other\s+awards)\b",
                                re.I)
_CUT_NAMES_COURSES = re.compile(r"\b(?:requirements?|required|core|courses?)\b(?!['’]?\s+(?:tab|text|heading)\b)", re.I)
# A missing course's own reason, placing it outside the text the record was read from.
_CUT_WHY = re.compile(
    r"\bstart\s+of\s+(?:the\s+)?(?:requirements\s+)?table\b|\btable\s+start\b|\bcut[-\s]off\b|\btruncat\w*"
    r"|\b(?:likely|possibly|probably|presumably)\b[^.;()]{0,40}?\bon\s+(?:the\s+)?"
    r"(?:page\s+\d{1,4}|(?:previous|prior|preceding|earlier)\s+page)"
    r"|\b(?:previous|prior|preceding|earlier)\s+page\b"
    r"|\bpage\s+\d{1,4}\b[^.;]{0,30}\bnot\s+(?:in\s+the\s+text|supplied|provided|included|extracted)\b"
    r"|\bnot\s+(?:supplied|extracted)\b", re.I)


def _cut_clause(clause: str) -> bool:
    """A requirements noun in the clause, not a list of something else, with the loss said of it."""
    for m in _CUT_REQ_RE.finditer(clause):
        if _CUT_OTHER_LIST.search(clause[max(0, m.start() - 40):m.start()]):
            continue
        hit = _CUT_LOSS.match(clause, m.end())
        if hit and not _CUT_BETWEEN.search(clause[m.end():hit.end()]):
            return True
    return False


def window_cut(record: dict) -> str | None:
    """The reader's words saying the record's requirements run outside the text it was read from, or None: a note's
    sentence, else a missing course's reason. A fill never closes such a window: the record fails with the gap named
    (fill_refused, which kb/_program_named_gaps.py files as section_cut_off).
    A cut counts only where the record explains a listed course as missing (missing_explained): a window that lost
    rows loses the state file's courses with them, and a note with no missing course behind it is a hedge ("a 4-unit
    course may be missing from the list", Cypress 37246; "a reviewer should check whether a required course is
    missing", Riverside 43896; S720's second reader). The sentence that says nothing was lost is read first, before
    the opening words ("the program section itself appears complete", Cerritos 20493)."""
    if not any(m.get("code") and m.get("why") for m in (record or {}).get("missing_explained") or []
               if isinstance(m, dict)):
        return None
    for n in (record or {}).get("notes") or []:
        for s in re.split(r"(?<=[a-z0-9)'\"][.!?])\s+(?=[A-Z])", str(n)):
            if not s:
                continue
            if _CUT_NOT_REQ.search(s):
                continue
            if _CUT_OPENS.search(s) and not (_CUT_OPENS_OTHER.search(s) and not _CUT_NAMES_REQ.search(s)):
                return s.strip()
            if _CUT_OTHER_SUBJECT.search(s) and not _CUT_NAMES_COURSES.search(s):
                continue
            if any(_cut_clause(c) for c in re.split(r";\s+|:\s+", s)):
                return s.strip()
    for m in (record or {}).get("missing_explained") or []:
        w = str(m.get("why") or "")
        if _CUT_WHY.search(w):
            return "%s: %s" % (m.get("code"), w.strip())
    return None


def refused_fill(words: str) -> dict:
    """The arithmetic's note that a fill was refused over a cut-off window."""
    return {"gap": "section_cut_off", "words": words[:300]}


def _words(s: str) -> str:
    """The words of a text in order, lower case, punctuation and spacing dropped."""
    return " ".join(re.findall(r"[a-z0-9]+", (s or "").lower()))


# An associate degree for transfer, by the state file's award ("A.A- T Degree",
# "A.S. T Degree") or the page's heading ("AA-T in Sociology for Transfer").
TRANSFER = re.compile(r"\bA\.?\s?[AS]\.?[-\s]*T\b|\bfor transfer\b", re.I)


# An associate degree by the state file's award ("A.S. Degree", "A.A- T Degree").
ASSOCIATE = re.compile(r"\bA\.?\s?[AS]\b\.?|\bassociate\b", re.I)


def degree_reading(record: dict, award: str | None) -> dict:
    """Whether an associate degree's record reads the degree or the major alone.
    Sam, 2026-10-14 (Cabrillo Biology 06328, Needs a fix): the record held the
    30-unit major, and the page prints the degree's 60, its general education 24
    and 6 units of electives. An associate degree carries at least 60 units
    (Title 5 section 55063), so a record naming no degree total and no general
    education units holds the major only; the display names it as the reading
    procedure's gap, with no person reading the record to find it."""
    if not ASSOCIATE.search(award or "") or re.search(r"baccalaureate|certificate", award or "", re.I):
        return {"status": "n/a"}
    prog = record.get("program") or {}
    if _span(prog.get("degree_total")) or _span(prog.get("ge_units")):
        return {"status": "read"}
    return {"status": "major only",
            "why": ["the record names no degree total and no general education units"]}


def transfer_degree(award: str | None, prog: dict) -> bool:
    return bool(TRANSFER.search(award or "") or TRANSFER.search(prog.get("section_heading") or ""))


def degree_verdict(prog: dict, degree: tuple[float, float], lo: float, hi: float,
                   award: str | None = None, cut: str | None = None) -> dict:
    """How a sum of the blocks, open electives and general education (lo-hi)
    meets the degree total the page prints: pass, status, and how it passed. cut is the
    reader's words saying the requirements run outside the text read (window_cut): a pass
    that fills units (electives, a transfer degree's 60, a printed floor) is refused over it
    (S720), and every other reading stands."""
    v = _degree_verdict(prog, degree, lo, hi, award)
    if cut and v.get("pass") and v.get("fill") and max(v["fill"]) > TOL:
        return {"pass": False, "status": "unequal", "fill_refused": refused_fill(cut),
                "why": ["the blocks and general education come to %s-%s against the %s-%s the catalog prints for "
                        "the degree; electives would fill the rest, but the reader's note says the requirements "
                        "run outside the text read" % (lo, hi, degree[0], degree[1])]}
    return v


def _degree_verdict(prog: dict, degree: tuple[float, float], lo: float, hi: float,
                    award: str | None = None) -> dict:
    dc = _span(prog.get("ge_overlap")) if isinstance(prog.get("ge_overlap"), dict) else None
    from _program_requirements_reconcile import awards_match
    # The cap is decided on the state file's award, never the heading (S714's second reader: TRANSFER matches a
    # heading's "Not for Transfer", so College of the Sequoias's "Fire Technology (Not for Transfer) A.S." would read
    # as a transfer degree and pass uncapped).
    if dc and awards_match("local", award):
        # A local degree whose page prints how many units may count toward the major and general education both
        # (College of the Sequoias, S714: courses marked as meeting general education, "3 units may double count
        # above in COS-GE"; the college's fill step files the figure as ge_overlap, a span, where Hartnell's and
        # ruling 1's flag is true). A student counts up to that many units twice, so the degree's units run from the
        # sum less the figure to the sum; the printed total is one of them (Sheet 81 card 1's within). A sum past the
        # total by more than the figure stays unequal, and no uncapped overlap reads it.
        if dc[1] > 0 and lo > degree[0] + TOL and lo - dc[1] <= degree[0] + TOL and degree[1] <= hi + TOL:
            return {"pass": True, "status": "equal", "double_count": dc[1], "why": []}
    elif (transfer_degree(award, prog) or prog.get("ge_overlap") is True) and lo > degree[0] + TOL \
            and hi > degree[1] + TOL:
        # Sheet 82 card 2 ("overlap", Sam, 2026-10-14): a course counts toward the major and
        # Cal-GETC both, so a transfer degree's sum runs past the total it prints. A local degree
        # whose page says the same ("Students can double-count required courses and courses for
        # General Education", Hartnell's nursing tabs, S486) carries ge_overlap from its reconcile step.
        return {"pass": True, "status": "equal", "overlap": True, "why": []}
    if prog.get("degree_total_minimum"):
        # The page prints the degree total as a floor (Cerritos: "Complete a minimum of 60 units to
        # include (1) the above major requirements, (2) the General Education requirements, and (3)
        # electives as needed"): electives make up a sum short of it, and a sum past it meets it.
        # A floor alone says as much (San Joaquin Delta, S415: "Minimum Degree Units Required: 60"
        # and no word for electives), so a short sum needs no electives_fill_degree beside it.
        short = [round(max(0.0, degree[0] - hi), 2), round(max(0.0, degree[0] - lo), 2)]
        return {"pass": True, "status": "equal", "minimum": True, "fill": short if short[1] > 0 else None, "why": []}
    fits = lo <= degree[0] + TOL and hi <= degree[1] + TOL
    fill = [round(max(0.0, degree[0] - hi), 2), round(max(0.0, degree[1] - lo), 2)]
    if prog.get("electives_fill_degree"):
        if not fits and abs(lo - degree[0]) <= TOL and hi > degree[1] + TOL:
            # S457 (Sheet 120 card 1 "narrow", Sam, 2026-10-23): the low end meets the total the
            # electives fill, and a choice or a variable-unit course carries the high end past it. A
            # student taking each choice at its least reaches the total; nothing is left to fill.
            return {"pass": True, "status": "equal", "meets": True, "fill": None, "why": []}
        return {"pass": fits, "status": "equal" if fits else "unequal", "fill": fill if fits else None,
                "why": [] if fits else ["the blocks and general education come to %s-%s, past the %s-%s the "
                                        "catalog prints for the degree" % (lo, hi, degree[0], degree[1])]}
    if abs(lo - degree[0]) <= TOL and abs(hi - degree[1]) <= TOL:
        return {"pass": True, "status": "equal", "why": []}
    if lo <= degree[0] + TOL and degree[1] <= hi + TOL:
        # Sheet 81 card 1: the printed total is one the requirements allow.
        return {"pass": True, "status": "equal", "within": True, "why": []}
    if fits and transfer_degree(award, prog) and not _num(prog.get("open_elective_units")):
        # Sheet 81 card 2: transferable electives make up a transfer degree's 60.
        return {"pass": True, "status": "equal", "transfer": True, "fill": fill, "why": []}
    if short_high(prog, degree, lo, hi):
        # Sam, 2026-11-17 ("Pass short high ends the same way as over-high ends"): the low end meets a
        # printed range's low end exactly and the high end falls short of its top.
        return {"pass": True, "status": "equal", "short_high": True, "why": []}
    return {"pass": False, "status": "unequal",
            "why": ["the blocks and general education sum to %s-%s; the catalog prints %s-%s "
                    "for the degree" % (lo, hi, degree[0], degree[1])]}


# The term-length ratio of an hours range (Victor Valley, S639): a 16-week term against an 18-week one.
TERM_RATIO = 8.0 / 9.0
# The catalog prints hours to one decimal place ("96.0 - 108.0", "28-31.5"), so a printed low end
# stands up to 0.05 from the exact eight ninths of its top. The 22 Victor Valley ranges that pass
# land on it exactly (96 of 108, 296 of 333, 28 of 31.5); 40910's 7.6 of 8.6 sits 0.044 off, the
# one-decimal printing of 7.644, and fails on its sum (7.3).
TERM_TOL = 0.05


def hours_meets_top(record: dict, stated: tuple[float, float], lo: float, hi: float) -> bool:
    """A noncredit program whose catalog prints each course's hours once and the certificate's
    total as a range whose low end is eight ninths of its top (Victor Valley, S639: "Total
    Certificate Hours: 96.0 - 108.0" over WKPR 011, 012 and 014, each description "Lecture
    Hours: 36.0"; college-page-read 43134526902). What rests on the catalog: the range and each
    course's hours, as printed. What is the session's reading (the lane conductor's call, S639):
    that a range in that ratio is one total across term lengths, 16 weeks against 18, so the top
    is the total the printed courses allow; no page says so, and no page prints a course's low
    end. This sits beside Sheet 120 card 1 (narrow) without reversing it: that reading still
    governs every units record and any sum short of the top. A range in another ratio is another
    cause and is left alone: a low end printed as a labeled minimum ("min 47 hours", Laney), or a
    range that runs from a course that "need not be taken" which the record holds as required (De
    Anza). Only a record measured in hours, a range whose low end is within TERM_TOL of eight
    ninths of its top, every course and alternative carrying one figure (no units_max, no
    repeats), every counted block a rule-all list or a choose-courses list with no printed
    figure (no choose_units, fills_to, repeats, floors or option group, no open electives), and
    a sum of one figure equal to the range's top."""
    if measure(record) != "hours" or not stated[1] - stated[0] > TOL:
        return False
    if abs(stated[0] - stated[1] * TERM_RATIO) > TERM_TOL:
        return False
    if abs(lo - hi) > TOL or abs(hi - stated[1]) > TOL:
        return False
    # The sum must be the courses' own: no open electives added to it, and no block whose printed
    # figure, fill, repeat or option group stands in for or moves the courses' sum (S639 review).
    if _num((record.get("program") or {}).get("open_elective_units")):
        return False
    for b in record.get("blocks") or []:
        if b.get("rule") == "recommended":
            continue
        if b.get("rule") not in ("all", "choose_courses") or b.get("option_group") or b.get("fills_to") \
                or b.get("repeats") or b.get("floors"):
            return False
        if b.get("rule") == "choose_courses" and (_span(b.get("stated")) or _num(b.get("minimum")) is None):
            return False
        for c in b.get("courses") or []:
            for entry in [c] + alternatives(c):
                u = _num(entry.get("units"))
                if (u is None or entry.get("times") is not None or entry.get("units_total") is not None
                        or _num(entry.get("units_max")) not in (None, u)):
                    return False
    return True


def short_high(prog: dict, stated: tuple[float, float], lo: float, hi: float) -> bool:
    """Sam's ruling of 2026-11-17, "Pass short high ends the same way as over-high ends": a printed unit range
    (its top past its low end) whose low end the sum meets exactly, the sum's high end short of the top. Units
    only: the ruling names a unit range, and an hours range reads by hours_meets_top. The range is the catalog's
    (COBIx on #3478, 6965840725, relaying #3461's "When the low end of a unit range matches but our high end is
    short"): the sum may be a range or a single figure, whose low and high ends are the same number, so Mt. San
    Jacinto 38847's 30 against 30-35 passes."""
    return (prog.get("measure") != "hours" and stated[1] > stated[0] + TOL
            and abs(lo - stated[0]) <= TOL and hi < stated[1] - TOL)


# The notes a check keeps beside its verdict (COBIx on #3478, 6965717631, accepted by the S679 conductor; Sam's Nov 17
# rule that records keep their gaps noted). A short high end can mean a missing option: where a required list's courses
# add up short of the list's own printed figure, the record passes under ruling 2 and says the list looks short. A local
# degree whose major matches the catalog and whose sum falls short of the degree total stays failing, and says why: a
# major course counted toward general education cannot close a short sum, and the electives are probably not listed.
LIST_SHORT_NOTE = ("a required list adds up short of its own printed figure (%s): the list looks short, and a course "
                   "line may be missing")
DEGREE_SHORT_NOTE = "major matches; degree total short of %s, electives probably not listed"


def short_required_lists(record: dict) -> list[str]:
    """The names of the required lists (rule "all") whose courses add up, at their high end, below the low end of the
    list's own printed figure. Read from the record alone (no closed list), so a filed record and a fresh score read
    the same: a course with no units of its own lets the printed figure stand, and the list is not counted short."""
    hours = measure(record) == "hours"
    out = []
    for b in record.get("blocks") or []:
        st = _span(b.get("stated"))
        if b.get("rule") != "all" or not st:
            continue
        span, _ = block_units_summed(b, {}, hours)
        if span is not None and span[1] < st[0] - TOL:
            out.append(b.get("name") or "")
    return out


def _fig(lo: float, hi: float) -> str:
    f = lambda n: str(int(n)) if float(n).is_integer() else str(round(float(n), 2))
    return f(lo) if abs(lo - hi) <= TOL else "%s-%s" % (f(lo), f(hi))


def arithmetic_note(record: dict, award: str | None, arith: dict) -> dict:
    """The note fields a check carries, or {}: "note" in plain words, and "lists_short" naming the lists that look
    short. kb/_program_requirements_rescore.py writes the same fields onto the filed records."""
    from _program_requirements_reconcile import awards_match, plain_equal
    a = arith or {}
    if a.get("pass") and (a.get("short_high") or (a.get("degree") or {}).get("short_high")
                          or (a.get("major") or {}).get("short_high")):
        names = short_required_lists(record)
        if names:
            return {"note": LIST_SHORT_NOTE % "; ".join("'%s'" % n for n in names), "lists_short": names}
        return {}
    comp, st = a.get("computed"), a.get("stated")
    prog = record.get("program") or {}
    if (not a.get("pass") and a.get("against") == "degree" and a.get("status") == "unequal" and comp and st
            and awards_match("local", award) and not transfer_degree(award, prog)
            and isinstance(a.get("major"), dict) and plain_equal(a["major"]) and comp[1] < st[0] - TOL):
        return {"note": DEGREE_SHORT_NOTE % _fig(float(st[0]), float(st[1]))}
    return {}


def program_verdict(prog: dict, stated: tuple[float, float], lo: float, hi: float,
                    record: dict | None = None) -> dict:
    """How the blocks' sum (lo-hi) meets the program total the page prints: pass,
    status and how. The rescorer reads it too (kb/_program_requirements_rescore.py),
    so it never re-adds the blocks. record, where the caller holds it, lets an hours
    record whose single-figure courses add to its printed range's top pass as
    meets_top (hours_meets_top); the rescorers pass none, so a filed score is not moved."""
    if abs(lo - stated[0]) <= TOL and abs(hi - stated[1]) <= TOL:
        return {"pass": True, "status": "equal"}
    # The page prints the program total as a floor (San Joaquin Delta, S422: "Minimum Units
    # Required: 24", "Minimum Major Units Required: 18"): a one-unit alternative, a block printed
    # as a range or a variable-unit course carries the sum's high end past it, and the low end
    # meets it. Only the low end meeting the floor passes; a low end past it is still a misread.
    if prog.get("total_units_minimum") and abs(lo - stated[0]) <= TOL and hi >= stated[1] - TOL:
        return {"pass": True, "status": "equal", "minimum": True}
    # S457 (Sheet 120 card 1 "narrow", Sam, 2026-10-23): a printed total the requirements' low end
    # meets exactly, a choice or a variable-unit course carrying the high end past it (Hartnell's
    # ABT 99 at 1-8 units), passes as meets: the printed total is one the requirements allow, as
    # Sheet 81 card 1 reads a degree's span, and a student taking each choice at its least reaches
    # it. A low end short of or past the total stays a misread. Measured 2026-10-23: 258 program
    # totals and 9 electives-filled degrees read so; any total inside the span would pass 738.
    if abs(lo - stated[0]) <= TOL and hi > stated[1] + TOL:
        return {"pass": True, "status": "equal", "meets": True}
    if short_high(prog, stated, lo, hi):
        # Sam, 2026-11-17 ("Pass short high ends the same way as over-high ends"; Sheet 120 card 1's mirror):
        # the low end meets the printed range's low end exactly and the high end falls short of its top (Citrus
        # Business - Accounting 42170: 37-38 against 37-40). A student taking each choice at its least reaches
        # the printed low end, as under meets.
        return {"pass": True, "status": "equal", "short_high": True}
    if record is not None and hours_meets_top(record, stated, lo, hi):
        return {"pass": True, "status": "equal", "meets_top": True}
    return {"pass": False, "status": "unequal"}


def degree_check(prog: dict, degree: tuple[float, float], lo: float, hi: float,
                 reasons: list[str], text: str | None, award: str | None = None, cut: str | None = None) -> dict:
    """The blocks, the open electives and the general education units against
    the degree total the page prints (record shape 5). A degree that names a
    general education pattern and no units for it cannot be added up."""
    ge = _span(prog.get("ge_units"))
    out = {"pass": False, "status": "incomplete", "computed": [round(lo, 2), round(hi, 2)],
           "stated": list(degree), "against": "degree", "ge": list(ge) if ge else None, "why": list(reasons)}
    if ge is None and prog.get("ge_pattern"):
        out["why"].append("the record names the degree total and the %s pattern, but no units for it"
                          % prog["ge_pattern"])
    if out["why"]:
        return out
    g = ge or (0.0, 0.0)
    lo, hi = round(lo + g[0], 2), round(hi + g[1], 2)
    out["computed"] = [lo, hi]
    if prog.get("electives_fill_degree") and text is not None and not electives_named(prog, text):
        out["why"] = ["the record says electives fill the degree total, but the catalog text names no electives"]
        return out
    out.update(degree_verdict(prog, degree, lo, hi, award, cut))
    return out


# "Total Contact Hours: 288", "Hours: 54": an hours figure printed after its label.
HOURS_LABEL = re.compile(r"\b(Total\s+(?:Contact\s+)?)?Hours?\s*:\s*(\d+(?:\.\d+)?)", re.I)


def hours_total_only(record: dict, stated: tuple[float, float] | None, text: str | None) -> bool:
    """A noncredit program whose page prints its total hours and no hours for any course
    (San Joaquin Delta, S422: "Total Contact Hours: 288" and "Units: 0" beside each course):
    there is nothing to add, as 'unstated' passes a page with no figure. The record must carry
    no course or block figure, and every hours figure on the page must be a total equal to the
    one the record states, so a reading that dropped printed course hours still fails."""
    if measure(record) != "hours" or stated is None or not text or FIGURE.search(text):
        return False
    for b in record.get("blocks") or []:
        if _span(b.get("stated")):
            return False
        for c in b.get("courses") or []:
            for entry in [c] + alternatives(c):
                if _num(entry.get("units")) or _num(entry.get("units_max")):
                    return False
    labels = list(HOURS_LABEL.finditer(text))
    if labels and all(m.group(1) and abs(float(m.group(2)) - stated[0]) <= TOL for m in labels):
        return True
    return total_hours_printed(text, stated, labels, record)


# "Total Hours 48-54", "Total Hours 48 to 54.", "Total Hours 216": the total printed after its label with no
# colon, one figure or a range, the figure on the label's line or the next one, and a sentence's period after it.
TOTAL_HOURS = re.compile(r"\bTotal\s+(?:Contact\s+)?Hours?\b[ \t]*:?[ \t]*(?:\n[ \t]*)?(\d+(?:\.\d+)?)"
                         r"(?:[ \t]*(?:[-–]|to\b)[ \t]*(\d+(?:\.\d+)?))?(?!\d)(?!\.\d)", re.I)
# A total that runs on past what the pattern took: a range it did not take, or an alternative ("48 or 54").
_RANGE_REST = re.compile(r"[ \t]*(?:[-–]|to\b|or\b)[ \t]*\d", re.I)
# An hours figure printed after its label ("Lecture Hours 54", "Lab Hours: 18", "Hours 72").
_HOURS_FIRST = re.compile(r"\bHours?\b[ \t]*:?[ \t]*(?:\n[ \t]*)?\d", re.I)
_HOURS_WORD = re.compile(r"\b(?:hours?|hrs?)\b", re.I)
_NUMBER = re.compile(r"\d+(?:\.\d+)?")
_NOTHING = re.compile(r"(?<![\w.])(?:0(?:\.0+)?|N/A)(?![\w.])", re.I)
_PER_COURSE = re.compile(r"\b(?:each|per)\s+course\b", re.I)
# The total's whole line: the label, an optional colon, a figure or a range, an optional final period.
_TOTAL_LINE = re.compile(r"[ \t]*Total\s+(?:Contact\s+)?Hours?[ \t]*:?[ \t]*(?:\n[ \t]*)?\d+(?:\.\d+)?"
                         r"(?:[ \t]*(?:[-\u2013]|to)[ \t]*\d+(?:\.\d+)?)?[ \t]*\.?[ \t]*", re.I)
# A course-code-shaped token: a capital subject and a course number that is not 0 ("VOCED 620", "ESL 501").
_CODE_SHAPE = re.compile(r"\b[A-Z][A-Z&/]{1,7}[ \t]*-?[ \t]*(?:[1-9]\d{0,3}|0\d{1,3})[A-Z]{0,2}\b")


def _code_pattern(code: str) -> re.Pattern | None:
    m = re.match(r"\s*([A-Za-z&/ ]*?[A-Za-z&/])\s*-?\s*(\d[\w.]*)\s*$", code or "")
    if not m:
        return None
    subj = r"\s*".join(re.escape(w) for w in m.group(1).split())
    return re.compile(r"\b%s\s*-?\s*%s\b" % (subj, re.escape(m.group(2))), re.I)


def total_hours_printed(text: str, stated: tuple[float, float], labels: list, record: dict) -> bool:
    """hours_total_only's second reading (S644, the harvest's NEXT 5), for a college whose procedure
    names it: its reconcile step sets program.hours_total_printed where the catalog prints a total as
    'Total Hours N' or 'N-M' with no colon over a course list of 0 or N/A (San Bernardino Valley:
    'Total Hours 48-54' over a UNITS column of 0; Coalinga: 'Total Hours 216' over 'N/A'). Read only
    where the first reading fails, so a page it passed still passes. It asks for positive evidence,
    all inside the record's own section, from its section_heading to the end of the text (no heading
    found fails; the files name no next heading, so a later program's figures count against it):
    exactly one total, after the last listed course, both ends the record's, never running on into a
    range or an alternative it did not take, and no 'each course' or 'per course' beside it; each
    listed course's row, from its code to the next listed code or the total, holds an explicit 0 or
    N/A and no other number (cells split one per line read as one row); no other number within three
    words before 'hours' or 'hrs'; no 'Hours N' or 'Hours: N' outside the total (the conductor's
    design after the review of #3193)."""
    prog = record.get("program") or {}
    if not prog.get("hours_total_printed") or any(not m.group(1) for m in labels):
        return False
    from _program_requirements_reconcile import _heading_end
    start = _heading_end(text, prog.get("section_heading"))
    if start is None:
        return False
    sec = text[start:]
    totals = list(TOTAL_HOURS.finditer(sec))
    if len(totals) != 1:
        return False
    t = totals[0]
    if _RANGE_REST.match(sec, t.end()):
        return False
    lo = float(t.group(1))
    hi = float(t.group(2)) if t.group(2) else lo
    if abs(lo - stated[0]) > TOL or abs(hi - stated[1]) > TOL:
        return False
    line_start = sec.rfind("\n", 0, t.start()) + 1
    if _PER_COURSE.search(sec[max(0, sec.rfind("\n", 0, max(0, line_start - 1)) + 1):t.end()]):
        return False
    # The total's line is the total and nothing else, and the line after it says nothing of each course
    # (the final read of #3193: 'Total Hours 48-54 per course', '(each course)', 'plus 18 lab').
    line_end = sec.find("\n", t.end())
    line_end = len(sec) if line_end < 0 else line_end
    if not _TOTAL_LINE.fullmatch(sec[line_start:line_end]):
        return False
    after = sec[line_end + 1:].split("\n", 1)[0] if line_end < len(sec) else ""
    if _PER_COURSE.search(after):
        return False
    for h in _HOURS_FIRST.finditer(sec):
        if not (t.start() <= h.start() and h.end() <= t.end()):
            return False
    for w in _HOURS_WORD.finditer(sec):
        if t.start() <= w.start() < t.end():
            continue
        if any(_NUMBER.search(tok) for tok in re.findall(r"\S+", sec[max(0, w.start() - 120):w.start()])[-3:]):
            return False
    pats = [p for p in (_code_pattern(e.get("code")) for b in record.get("blocks") or []
                        for c in b.get("courses") or [] for e in [c] + alternatives(c)) if p]
    if not pats:
        return False
    hits = sorted(((m.start(), m.end()) for p in pats for m in p.finditer(sec, 0, t.start())), key=lambda x: x[0])
    if any(not p.search(sec, 0, t.start()) for p in pats):
        return False
    # Between the heading and the total, every course-code-shaped token is a listed course (a later
    # program's rows cannot stand in for this record's), and no listed code comes back after the last
    # listed course's first row.
    for m in _CODE_SHAPE.finditer(sec, 0, t.start()):
        if not any(p.fullmatch(m.group(0)) for p in pats):
            return False
    firsts = [p.search(sec, 0, t.start()).start() for p in pats]
    seen_first = set(firsts)
    if any(a > max(firsts) and a not in seen_first for a, _ in hits):
        return False
    for k, (a, b) in enumerate(hits):
        row = sec[b:hits[k + 1][0] if k + 1 < len(hits) else t.start()]
        if not _NOTHING.search(row):
            return False
        if any(float(n) != 0 for n in _NUMBER.findall(_NOTHING.sub(" ", row))):
            return False
    # Below the total, a listed course's line printing a figure other than 0 is that course's hours.
    for p in pats:
        for m in p.finditer(sec, t.end()):
            ln_end = sec.find("\n", m.end())
            rest = sec[m.end():len(sec) if ln_end < 0 else ln_end]
            if any(float(n) != 0 for n in _NUMBER.findall(rest)):
                return False
    return True


def score(record: dict, closed: list[dict], text: str | None = None, award: str | None = None,
          aliases: dict | None = None, packed: bool = False, course_ids: dict | None = None) -> dict:
    """The automatic bars. text is the catalog text the record was read
    from; without it a record that states no figure cannot pass. award is the
    state file's award, which names an associate degree for transfer. aliases is the
    college's prefix_aliases (with_prefix_aliases). course_ids maps a Program Course
    File id to its listed code (with_course_ids); left None, it is read from the
    closed list's own control numbers (CI.listed_ids), and it runs before the aliases."""
    listed = {}
    for c in closed:
        k = norm_code(c.get("code"))
        if k:
            listed[k] = _num(c.get("units"))
    record = with_course_ids(record, listed, CI.listed_ids(closed) if course_ids is None else course_ids, aliases)
    # The matches the course-id route made, so a filed score names them and the display can pick them out
    # (S653 review: 806 of its 1,634 matches have no course name on file to confirm them).
    by_id = sorted({(e["printed_code"], e["code"]) for _, e, _ in placed_codes(record)
                    if e.get("matched_by") == "course_id"})
    record = with_prefix_aliases(record, listed, aliases)
    placed = [(listed_key(e.get("code"), listed, packed), e, b) for _, e, b in placed_codes(record)]
    placed_keys = {k for k, _, _ in placed}

    missing = sorted(k for k in listed if k not in placed_keys)
    explained = {norm_code(m.get("code")): m.get("why")
                 for m in record.get("missing_explained") or [] if m.get("code")}
    unexplained = [k for k in missing if not explained.get(k)]

    invented = sorted({k for k, c, _ in placed if k not in listed})
    flagged = sorted({k for k, c, _ in placed
                      if k not in listed and c.get("catalog_addition")})
    unflagged = [k for k in invented if k not in flagged]

    (lo, hi), reasons = program_units(record, listed)
    prog = record.get("program") or {}
    oe = _num(prog.get("open_elective_units")) or 0.0
    lo, hi = lo + oe, hi + oe
    stated = _span(prog.get("total_units"))
    degree = _span(prog.get("degree_total"))
    de = _span(prog.get("degree_elective_units")) or (0.0, 0.0)
    if stated is None and degree is not None:
        arith = degree_check(prog, degree, lo + de[0], hi + de[1], reasons, text, award, window_cut(record))
    elif stated is None and not has_figure(record) and not any(listed.values()):
        figures = [m.group(0) for m in FIGURE.finditer(text or "")]
        ok = text is not None and not figures
        arith = {"pass": ok, "status": "unstated", "computed": None, "stated": None, "against": None,
                 "why": ["the catalog prints no total, no hours and no units"] if ok else
                        ["the record states no figure, but the catalog text names %s"
                         % ", ".join(figures[:4])] if figures else
                        ["the record states no figure, and no catalog text came to check it against"]}
    elif stated is None:
        arith = {"pass": False, "status": "incomplete", "computed": [lo, hi], "stated": None,
                 "against": None, "why": reasons + ["the record names no total"]}
    elif reasons and hours_total_only(record, stated, text):
        arith = {"pass": True, "status": "equal", "total_only": True, "computed": None, "stated": list(stated),
                 "against": "program", "why": []}
    elif reasons:
        arith = {"pass": False, "status": "incomplete", "computed": [lo, hi],
                 "stated": list(stated), "against": "program", "why": reasons}
    else:
        pv = program_verdict(prog, stated, lo, hi, record)
        ok = pv["pass"]
        # A certificate whose printed total includes the general education units it names
        # (San Joaquin Delta 05630, S424: "Minimum Units Required: 51" over a 35-unit major and
        # "16 units of courses from the ... General Education Pattern areas", recorded in
        # ge_units): the record carries no degree total, so the degree check never adds them.
        ge = _span(prog.get("ge_units")) if degree is None else None
        ge_included = (not ok and ge is not None
                       and abs(lo + ge[0] - stated[0]) <= TOL and abs(hi + ge[1] - stated[1]) <= TOL)
        # A certificate whose page says electives make up its total (San Joaquin Delta 11970,
        # S424: "Complete elective units to meet the minimum 60 unit requirement for this
        # certificate", electives_fill_degree on a record with no degree total): a sum short of
        # the total passes with the fill named, as degree_verdict reads a degree's. The same
        # guard: a text naming no electives keeps the record failing.
        fill = refused = None
        if (not ok and not ge_included and degree is None and prog.get("electives_fill_degree")
                and hi <= stated[0] + TOL and (text is None or electives_named(prog, text))):
            # The fill claims the short sum is electives; the record's own words may say rows were cut off (S720).
            cut = window_cut(record)
            if cut:
                refused = refused_fill(cut)
            else:
                fill = [round(stated[0] - hi, 2), round(stated[1] - lo, 2)]
        ok = ok or ge_included or fill is not None
        arith = {"pass": ok, "status": "equal" if ok else "unequal",
                 "computed": [round(lo, 2), round(hi, 2)], "stated": list(stated), "against": "program",
                 "why": [] if ok else ["the blocks sum to %s-%s; the catalog states %s-%s"
                                       % (round(lo, 2), round(hi, 2), stated[0], stated[1])]}
        if refused:
            arith["fill_refused"] = refused
            arith["why"].append("electives would fill the rest, but the reader's note says the requirements run "
                                "outside the text read")
        if pv.get("minimum"):
            arith["minimum"] = True
        if pv.get("meets"):
            arith["meets"] = True
        if pv.get("short_high"):
            arith["short_high"] = True
        if pv.get("meets_top"):
            arith["meets_top"] = True
        if ge_included:
            arith["ge_included"] = list(ge)
            arith["computed"] = [round(lo + ge[0], 2), round(hi + ge[1], 2)]
        if fill is not None:
            arith["fill"] = fill
        if degree is not None:
            # Record shape 6: a page printing the major's total and the degree's checks both,
            # and the record names the one it misses (the major first).
            # A major that adds up to its printed total is complete, so electives filling the degree after it are
            # the fill's own case: the cut guard reads only a degree whose major does not add up (S720).
            deg = degree_check(prog, degree, lo + de[0], hi + de[1], [], text, award, None if ok else window_cut(record))
            arith = dict(arith, degree=deg) if not ok or deg["pass"] else dict(deg, major=arith)
    arith = dict(arith, **arithmetic_note(record, award, arith))
    # The readings program_units made from a heading (S713), named so a reader of the check sees them.
    sub = substitute_core(record, listed, measure(record) == "hours")
    if sub and arith.get("computed") is not None:
        arith["substitute_list"] = sub[0].get("name")
    tot = _span((record.get("program") or {}).get("total_units"))
    figs = [{"block": b.get("name"), "figure": heading_figure(b)} for b in record.get("blocks") or []
            if heading_figure(b) is not None
            and not (heading_is_total(b) and not (tot and abs(tot[0] - heading_figure(b)) <= TOL))]
    if figs and arith.get("computed") is not None:
        arith["heading_figures"] = figs
    # The figures program_units read over several lists together (S721), named with the sentence that prints each.
    pooled = pooled_moved(record, listed)
    if pooled and arith.get("computed") is not None:
        arith["pooled"] = [{"blocks": p["blocks"], "figure": list(p["figure"]), "minimum": p["minimum"],
                            "parts": p["parts"], "read": p["read"], "words": p["words"]} for p in pooled]
    # The reading program_units made from the reader's words (S713), named so a reader of the check sees it.
    bl = record.get("blocks") or []
    hrs = measure(record) == "hours"
    also = {t: js for t, js in also_from(record).items()
            if also_from_span(bl, t, js, listed, hrs) not in (None, block_units(bl[t], listed, hrs)[0])}
    if also and arith.get("computed") is not None:
        arith["also_from"] = [{"block": bl[t].get("name"), "from": [bl[j].get("name") for j in js]}
                              for t, js in sorted(also.items())]

    rep_codes = repeated(record)
    outs = outcomes_check(record, text)
    n = len(listed)
    # A record that places none of the listed courses read some other text:
    # explaining every course away is no reading of the program. Long Beach
    # City's capture gave the model a hidden course index, and 89 records with
    # no block passed on "appears only in the course index" (S362).
    none_placed = bool(n) and len(missing) == n
    cov_ok = not unexplained and not none_placed
    return {
        "measure": measure(record),
        "coverage": {"placed": n - len(missing), "listed": n,
                     "share": round((n - len(missing)) / n, 3) if n else None,
                     "missing": missing, "unexplained": unexplained,
                     "none_placed": none_placed,
                     **({"course_id": [{"printed": p, "listed": k, "matched_by": "course_id"} for p, k in by_id]}
                        if by_id else {}),
                     "pass": cov_ok},
        "invented": {"count": len(invented), "codes": invented, "flagged": flagged,
                     "pass": not unflagged},
        "arithmetic": arith,
        "repeated": {"codes": rep_codes, "pass": not rep_codes},
        "outcomes": outs,
        "careers": careers_check(record, text),
        "degree": degree_reading(record, award),
        "pass": (cov_ok and not unflagged and arith["pass"] and not rep_codes
                 and outs["pass"]),
    }


# ── The record's own heading names its program's award (S644; reported, not in the pass rule) ──
# Santiago Canyon's 2026-2027 catalog PDF prints "Control Number: N" AFTER each program, and the
# reader cut each page from that line on, so a local degree's record held the transfer degree printed
# next (COBIx, #3194 comment 6841001207: Economics AA 11943 and Sociology AA 11947 PASS holding their
# AA-T's requirements). Coverage, invented and the arithmetic all pass on such a record: the two
# degrees share most courses and each sums to its own total. The record's own section_heading names
# the award it read, so a heading that names another award type than the state file's is a reason of
# its own. heading_award_check() reports it beside the checks; passes_live and the tab's rule do not
# read it until the conductor decides (kb/_program_requirements_heading_agreement.py measures what it
# would fail, by college).
_HEADING_DASH = str.maketrans({"‐": "-", "‑": "-", "‒": "-", "–": "-", "—": "-"})
# A transfer degree as headings print it: "AS-T", "A.A.-T", "AA-T", "AAT", "ADT", "for Transfer",
# "for UC Transfer", "A.A.-Transfer", "Associate in Arts Transfer Degree", "A.S. T Degree". The bare
# letters never after a point: Hartnell's program codes "AS.AST" (Astronomy) and "AS.ADT" (Advanced
# Diesel Technology) are local degrees.
HEADING_TRANSFER = re.compile(
    r"\bA\.?\s?[AS]\.?\s?-\s?T\b\.?|(?<![.\w])A[AS]T\b|(?<![.\w])ADT\b|\b(?:for|uc)\s+(?:uc\s+)?transfer\b"
    r"|\b(?:arts|science)[\s-]+(?:uc\s+)?transfer\b|-\s*transfer\b|\btransfer\s+degree\b"
    r"|\bA\.?\s?[AS]\.?\s?T\.?\s+degree\b|\bA\.\s?[AS]\.\s?T\b\.?", re.I)   # "A.A.T" (round 2, finding 13)
HEADING_CERTIFICATE = re.compile(r"\bcertificates?\b|\bcert\b\.?", re.I)   # a bare "Cert" too (finding 14)
# A certificate's letters, standing alone ("Construction Inspection for Public Works, CA").
HEADING_CERTIFICATE_CODE = re.compile(r"(?:^|[\s,(:-])(?:CA|COA|CoA|CP|CC|CCL|NC)(?=\)|\s*$|\s*[,:(-])")
# "Associate Degree Requirements" alone names no type: it is the college's general education section.
HEADING_LOCAL = re.compile(r"\bA\.\s?[AS]\.(?!\s?-?\s?T\b)|\bassociates?\s+(?:in|of)\s+(?:arts|science)\b"
                           r"|\bA[AS]\s+degree\b", re.I)
# The bare letters, standing alone and not a transfer degree's ("General Marketing, AS").
HEADING_LOCAL_CODE = re.compile(r"(?:^|[\s,(:/-])(?:AA|AS)(?![-\s]?T\b)(?=\)|\s*$|\s*[,:(/-]|\s+(?:in|degree|and|or|&)\s)")
HEADING_BACHELOR = re.compile(r"\bbachelor|\bbaccalaureate|\bB\.\s?[AS]\.", re.I)
HEADING_ANY_DEGREE = re.compile(r"\bdegrees?\b", re.I)
# The model's own note that the program's heading is not in the text it read ("Not in the text (only
# the ... A.S. degree section appears)", "No Career Specialist section in the text").
HEADING_ABSENT = re.compile(r"\bnot (?:in|found in|printed in|present in|shown in) the (?:supplied |provided |given )?"
                            r"text\b|\bnot in text\b|\bnot found\b|\bno\s+(?:[\w.'’:&/-]+\s+){0,9}section\b"
                            r"|\bheading (?:is )?not\b|\bnot (?:printed|present|found)\b", re.I)
# The state file's award, as a heading type.
AWARD_TYPE = {"adt": "transfer", "as": "local_degree", "aa": "local_degree", "coa": "certificate",
              "noncredit": "certificate", "bs": "bachelor"}
DEGREE_TYPES = ("transfer", "local_degree", "bachelor")


def award_type(award: str | None) -> str | None:
    """The state file's award as one of transfer, local_degree, certificate (credit or noncredit)
    or bachelor; None when the award names none of them."""
    from _program_requirements_pilot import award_kind
    return AWARD_TYPE.get(award_kind(award))


# Words a heading prints that name no program: "Program Requirements", "Requirements for the Major",
# "Associate in Science Degree Major Requirements", "Plan of Study Grid", "Cal-GETC Areas and Units".
# A heading of these words alone says nothing about which program it heads.
HEADING_GENERIC = set("""
a aa aas aat adt ast as an and are area areas arts associate associates award awards b ba bs c ca cal catalog
certificate certificates certification coa completion competency complete core course courses csu curriculum d
degree degrees description education elective electives emphasis following for from general getc graduation grid i
id identification ii iii igetc in local major majors minimum maximum noncredit numbering of option options or plan
program programs proficiency recommended requirement requirements required science select sequence skills
specialization study system t the to total transfer uc unit units with achievement additional list page section
req reqs semester year first second third fourth fall spring summer pattern california ge breadth group
outcomes learning career careers information descriptions chapter support field time listing listings availability
per guide credit non after acceptance into active agreements exam is are be at on by this these other
code codes state academic number control
""".split())


def heading_content_words(text: str | None) -> list[str]:
    """The heading's words that could name a program: no generic word, no number or code ("W003304C")."""
    return [w for w in re.findall(r"[a-z0-9]+", (text or "").lower())
            if w not in HEADING_GENERIC and not re.search(r"\d", w) and len(w) > 1]


def _without_title(heading: str, title: str) -> str:
    """The heading with the program's own title taken out once, where the title alone names no award
    type: Irvine Valley 44477 is COCI "Chemistry for UC", an A.S., and its heading "Chemistry for UC
    Transfer - A.S. Degree" names no transfer degree (S645 review of #3201, finding 14). A title that
    names a type itself ("Mathematics 2.0 for Transfer") stays, so its type still counts."""
    words = re.findall(r"[A-Za-z0-9]+", title or "")
    if not words or heading_award_types(title):
        return heading
    pat = r"(?<![A-Za-z0-9])" + r"[\W_]+".join(re.escape(w) for w in words) + r"(?![A-Za-z0-9])"
    return re.sub(pat, " ", heading, count=1, flags=re.I)


def heading_award_types(heading: str | None, title: str | None = None) -> set[str]:
    """The award types a heading names. A transfer degree's words ("Associate in Arts in Sociology for
    Transfer") name no local degree; a local degree beside it needs its own letters ("AS and AS-T").
    A bare "Degrees" with no type names `degree` (any degree). Given the program's title, its words
    are read as the title, never as an award (_without_title)."""
    h = (heading or "").translate(_HEADING_DASH)
    if title:
        h = _without_title(h, title.translate(_HEADING_DASH))
    out: set[str] = set()
    transfer = bool(HEADING_TRANSFER.search(h))
    if transfer:
        out.add("transfer")
    if HEADING_CERTIFICATE.search(h) or HEADING_CERTIFICATE_CODE.search(h):
        out.add("certificate")
    rest = HEADING_TRANSFER.sub(" ", h)
    if transfer:
        if HEADING_LOCAL_CODE.search(rest):
            out.add("local_degree")
    elif HEADING_LOCAL.search(rest) or HEADING_LOCAL_CODE.search(rest):
        out.add("local_degree")
    if HEADING_BACHELOR.search(h):
        out.add("bachelor")
    if not out.intersection(DEGREE_TYPES) and HEADING_ANY_DEGREE.search(h):
        out.add("degree")
    return out


def heading_award_check(record: dict | None, award: str | None, control_number: str | None = None,
                        title: str | None = None) -> dict:
    """Whether the record's own section_heading names its program's award type. Fails only when the
    heading names award types and none is the program's (status names_other_award, with the kind:
    transfer_under_local_degree, local_degree_under_transfer, certificate_under_local_degree, ...).
    A heading that names no award, an award the state file does not type, and the model's note that
    the heading is not in its text (heading_absent) pass and are reported. A control number in the
    heading proves nothing: at Santiago Canyon the model copied "(Control Number: 19588)" into the
    heading of the certificate printed after the number, filed under the A.S. 19588 the number
    closes. control_number is kept for the caller's report. Not read by passes_live or score() (S644).
    Given the program's COCI title, its words are read as the title (heading_award_types), and a
    heading that names another award and none of the title's words passes in a bucket of its own,
    names_award_not_program. Pasadena prints one page for an A.S. and its certificate
    ("...-as-cert-achievement/", "Requirements for the Certificate of Achievement"; the A.S. is the
    certificate plus general education), so such a heading says which award's section the page opens
    on and nothing of which program the record holds (S645 review of #3201, finding 15)."""
    prog = (record or {}).get("program") or {}
    heading = (prog.get("section_heading") or "").strip()
    filed = award_type(award)
    base = {"heading": heading or None, "filed": filed, "control_number": control_number}
    if not heading:
        return dict(base, **{"pass": True, "status": "unstated", "names": [], "why": []})
    if HEADING_ABSENT.search(heading):
        return dict(base, **{"pass": True, "status": "heading_absent", "names": [], "why": []})
    names = heading_award_types(heading, title)
    if not names or filed is None:
        return dict(base, **{"pass": True, "status": "unstated", "names": sorted(names), "why": []})
    if filed in names or ("degree" in names and filed in DEGREE_TYPES):
        return dict(base, **{"pass": True, "status": "agrees", "names": sorted(names), "why": []})
    kind = "%s_under_%s" % ("_or_".join(sorted(names)), filed)
    from _program_requirements_pilot import title_tokens
    tokens = title_tokens(title or "")
    # Set aside only a heading that names no program at all (round 2, finding 12): one naming another
    # program's words is a crossing, and still fails.
    if tokens and not heading_content_words(heading):
        return dict(base, **{"pass": True, "status": "names_award_not_program", "names": sorted(names),
                             "kind": kind,
                             "why": ["the record's heading %r names a %s and none of the program's title words: "
                                     "a page printing one section for two awards heads both with it"
                                     % (heading[:120], " or ".join(sorted(names)).replace("_", " "))]})
    return dict(base, **{"pass": False, "status": "names_other_award", "names": sorted(names), "kind": kind,
                         "why": ["the record's heading %r names a %s; the program is a %s"
                                 % (heading[:120], " or ".join(sorted(names)).replace("_", " "),
                                    filed.replace("_", " "))]})
