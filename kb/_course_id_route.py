#!/usr/bin/env python3
"""The course-id route: a listed course matched by the Program Course File's own course id (S653).

WHY. Slice C of issue #3299 (#3301) gave 17 colleges' prefixes a hand-kept prefix_aliases pair, because the
closed list names a course as the COCI course list spells it (Riverside City's HIS 14) while the catalog prints
another prefix (HIST 14). Most of those pairs exist only because the two state files disagree: the Data Mart
Program Course File (kb/reference/coci_program_course_file.csv.gz) writes each program's course under its own
CrsId, and that id often already prints the catalog's prefix (HIST14 for the control number the course list
names HIS 14). The closed list carries each course's control number ("ccn", closed_from_rows in
kb/_program_requirements_pilot.py), so the course id ties a printed code straight to the listed course, with no
alias to keep by hand (lessons, S652: "take the prefix from the file's CrsId where the course list disagrees").

THE ROUTE. For each listed course whose control number the Program Course File names under exactly one course id
that differs from the listed code, that id is the course's second code. The scorer reads a placed code the list
lacks as the listed course whose id it is, when exactly one listed course carries that id
(with_course_ids in kb/_program_requirements_score.py), BEFORE the college's prefix_aliases, which stay as the
fallback; the capture looks for the id on the page as it looks for an alias's printed code (with_renumbers in
kb/_program_requirements_college.py). A code the list holds as printed is never renamed.

A MIS course id may carry the college's record id after the number (Los Rios's ENGL304-2507 is ENGL 304,
p-mis-codes-carry-record-id-suffix-s652); mis_code() sets it aside. The Program Course File writes none today,
and the route reads every id through mis_code() all the same.

Proof that a pair retires and the self-recall test: kb/_course_id_route_census.py.
"""
from __future__ import annotations

import collections
import csv
import functools
import gzip
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _program_requirements_pilot import norm_code  # noqa: E402

PCF = os.path.join(HERE, "reference", "coci_program_course_file.csv.gz")

# A MIS course id the college writes with its own record id after the course number: Los Rios's "ENGL304-2507"
# Introduction to Poetry and "ENG303-26954" (American River). Normalized whole, it reads ENGL3042507 and never
# meets ENGL 304. A number must stand before the hyphen: Southwestern's "NC-1001" is a subject and a number.
MIS_ID_SUFFIX = re.compile(r"^([A-Z&][A-Z&\s]*\d+[A-Z]*)-\d{4,5}$")


def mis_code(course_id: str | None) -> str:
    """A MIS or Program Course File course id as the course code it names, a trailing record id set aside."""
    s = (course_id or "").strip().upper()
    m = MIS_ID_SUFFIX.match(s)
    return norm_code(m.group(1) if m else s)


# A normalized code's subject and number, a common-course number's C kept with the number (MATHC2220 is MATH
# C2220) and a subject ending in C kept whole (CPSC17 is CPSC 17).
SPACED = re.compile(r"^([A-Z&]+?)(C\d{4}[A-Z]*|\d.*)$")


def spaced(code: str) -> str:
    """A normalized code with its subject spaced from its number, as the capture looks for it on the page: the
    space is load-bearing (course_renumbers in kb/_program_requirements_reconcile.py)."""
    m = SPACED.match(code or "")
    return "%s %s" % (m.group(1), m.group(2)) if m else code


@functools.lru_cache(maxsize=2)
def load_ids(path: str = PCF) -> dict:
    """{course control number: its course id} from the Program Course File, for each control number the file
    names under one id only: 117,442 of 117,472 (30 carry two, such as SPAN1 and SPAN1H, and are left out)."""
    seen = collections.defaultdict(set)
    with gzip.open(path, "rb") as fh:
        for r in csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig")):
            ctl = (r.get("CourseControlNumber") or "").strip()
            k = mis_code(r.get("CrsId"))
            if ctl and ctl.upper() != "NULL" and k:
                seen[ctl].add(k)
    return {ctl: next(iter(ids)) for ctl, ids in seen.items() if len(ids) == 1}


def course_id(entry: dict, ids: dict | None = None) -> str | None:
    """A closed-list course's id when it differs from its listed code: the entry's own "crsid" when it carries
    one, else the Program Course File's for its control number ("ccn"); None when the two agree or none is known."""
    if not isinstance(entry, dict):
        return None
    k = mis_code(entry.get("crsid")) if entry.get("crsid") else None
    if not k and entry.get("ccn"):
        k = (ids if ids is not None else load_ids()).get(str(entry["ccn"]).strip())
    code = norm_code(entry.get("code"))
    return k if k and code and k != code else None


def listed_ids(closed: list[dict], ids: dict | None = None) -> dict:
    """{course id: listed code} over a closed list, for each id that names one listed course only and is not
    itself a listed code (a code the list holds as printed is never renamed)."""
    listed = {norm_code(c.get("code")) for c in closed or [] if isinstance(c, dict) and c.get("code")}
    out = collections.defaultdict(set)
    for c in closed or []:
        k = course_id(c, ids)
        if k and k not in listed:
            out[k].add(norm_code(c.get("code")))
    return {k: next(iter(v)) for k, v in out.items() if len(v) == 1}
