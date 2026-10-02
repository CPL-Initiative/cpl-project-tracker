#!/usr/bin/env python3
"""Build the PROGRAM -> COURSE membership Sierra reads (`coci_program_courses`).

WHY THIS EXISTS
---------------
Sam, 2026-10-02 (S318): "Goal is to be able to list the courses in particular
programs at a given college." Sierra could already FIND a program
(`coci_college_programs`, 22,335 rows) and could already read every course
(`chatbox_college_courses`, 141,696 rows), but nothing joined the two. So
whenever she listed a program's courses she listed every course at that college
sharing the program's TOP code — the membership proxy CLAUDE.md Rule 7 forbids
(TOP is never a membership determination).

Measured 2026-10-02 over 19,883 active programs, against the CO's own Program
Course File:

    the TOP proxy finds a median 33% of a program's real courses (mean 41%)
    a median 44% of what the proxy returns is really in the program (mean 48%)
    2,707 programs: the proxy finds no course at all
    12,739 programs: the proxy misses half the list or more
    236 programs: the proxy and the real list agree exactly

Mt. San Antonio's LVN-to-RN A.S. (control 08086) lists 27 courses; the proxy
finds 7 (the NURS core) and misses anatomy, physiology, microbiology, English,
communication and psychology, and adds 6 nursing courses the program does not
list.

THE SOURCE
----------
kb/reference/coci_program_course_file.csv.gz — the CCCCO Data Mart Program
Course File, full export committed 2026-07-16 (401,163 rows, 121 colleges).
One row per (program proposal, course). It carries NO required/elective flag:
COCI never collects that (docs/kb-notes/methodology-embedded-cert-required-
core-inference.md). So this table says which courses a program LISTS, and a
reader must never call the list "required" or sum its units: honors twins and
alternatives (ANAT 10A/10B or ANAT 35/36) sit side by side.

THE JOIN, AND WHY IT IS BUILT THIS WAY
--------------------------------------
* The file names a college by numeric MIS code (`CollegeCode`, e.g. 851), and
  130 program control numbers repeat across colleges, so the program key is
  (college, control) — never control alone.
* `CollegeCode` -> the college name `coci_college_programs` uses is derived
  from TWO independent signals that must agree: (1) the program export's college
  for the code's programs, through the same resolver build_coci_offerings.py
  uses, and (2) the course list's college for the code's courses. They agree
  on 118 of 121 codes; the three that differ are the known naming quirk where
  the course list spells a continuing-education college twice ("North Orange
  Continuing Education" and "... Credit"), plus code 001, ten stray rows with
  no program. Any OTHER disagreement stops the build — a misattributed college
  would put one college's courses under another's program.
* Course display fields (subject + number, title, units, C-ID) come from the
  course list by control number. Which college OWNS the course comes from the
  MIS Master Course File (CB_COLLEGE_ID), not the course list: the course list
  files College of the Desert's AUTO 10 (CCC000631388) under Citrus College,
  and MIS puts it at Desert (931), the college whose program lists it. A
  program may list a sister college's course (Riverside City College programs
  list Moreno Valley and Norco courses: one district, one course record), and
  `course_college` names that college when it differs. Where MIS does not
  carry the control (14% of rows), the course list's college stands.
* Kept: programs and courses whose status is Active, Approved, or Active -
  Teachout Only — the same three statuses build_coci_offerings.py keeps for
  programs. 19,698 rows inside kept programs list an Inactive course; a course
  COCI retired is not one a student can take, so it is dropped and counted.

Run from repo root:  python3 chatbox/build_program_courses.py
Writes: chatbox/coci_program_courses_payload.json (gitignored; built on the runner)
"""
from __future__ import annotations

import collections
import csv
import datetime
import glob
import gzip
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "chatbox"))
from build_coci_offerings import PROG_GLOB, XLSX, fix_moji, make_college_resolver  # noqa: E402

MEMBERSHIP = os.path.join(ROOT, "kb", "reference", "coci_program_course_file.csv.gz")
# The MIS Master Course File (CB elements, Fall 2025): the authority for which
# college a course control number belongs to.
CB_MASTER = os.path.join(ROOT, "kb", "reference", "cb_course_basic_fall2025.csv")
OUT = os.path.join(ROOT, "chatbox", "coci_program_courses_payload.json")
# The Data Mart export date. The file carries no date of its own.
SOURCE_AS_OF = "2026-07-16"

KEEP_STATUS = ("Active", "Approved", "Active - Teachout Only")
# The course list spells two continuing-education colleges twice. Both spellings
# name one institution, so they never count as a disagreement.
CREDIT_SUFFIX = " Credit"


def same_college(a: str, b: str) -> bool:
    """One institution under the course list's two spellings."""
    if not a or not b:
        return False
    strip = lambda s: s[: -len(CREDIT_SUFFIX)] if s.endswith(CREDIT_SUFFIX) else s
    return strip(a) == strip(b)


def clean(v) -> str:
    if v is None:
        return ""
    s = " ".join(str(v).split())
    return "" if s.lower() in ("none", "nan", "null", "n/a", "na") else s


def load_membership(path: str = MEMBERSHIP) -> list:
    with gzip.open(path, "rb") as fh:
        return list(csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig")))


def load_program_colleges(path: str, resolve) -> dict:
    """control -> set of resolved colleges, over every export row (any status),
    so a code's programs speak for it whatever their status."""
    out: dict = collections.defaultdict(set)
    with open(path, encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            c = resolve(r.get("COLLEGE", ""))
            if c:
                out[(r.get("CONTROL NUMBER") or "").strip()].add(c)
    return out


def college_crosswalk(mem: list, program_colleges: dict, course_colleges: dict):
    """CollegeCode -> college, from two signals that must agree.

    Signal 1: the export college of the code's programs (controls that name one
    college only). Signal 2: the course-list college of the code's courses.
    Returns (crosswalk, report). Raises SystemExit on a disagreement that is
    not the Credit-suffix spelling, because a wrong college here files one
    college's courses under another's program.
    """
    by_prog: dict = collections.defaultdict(collections.Counter)
    by_course: dict = collections.defaultdict(collections.Counter)
    for r in mem:
        code = r["CollegeCode"]
        s = program_colleges.get(r["ProgramControlNumber"])
        if s and len(s) == 1:
            by_prog[code][next(iter(s))] += 1
        for c in course_colleges.get(r["CourseControlNumber"], ()):
            by_course[code][c] += 1

    xwalk, report = {}, {"codes": 0, "no_program_signal": [], "credit_spelling": []}
    bad = []
    for code in sorted({r["CollegeCode"] for r in mem}):
        report["codes"] += 1
        if not by_prog.get(code):
            report["no_program_signal"].append(code)
            continue
        a = by_prog[code].most_common(1)[0][0]
        b = by_course[code].most_common(1)[0][0] if by_course.get(code) else ""
        if a != b:
            if same_college(a, b):
                report["credit_spelling"].append(code)
            else:
                bad.append(f"{code}: programs say {a!r}, courses say {b!r}")
                continue
        xwalk[code] = a
    if bad:
        raise SystemExit("FATAL: the two college signals disagree:\n  " + "\n  ".join(bad))
    return xwalk, report


def pick_course(cands: list, college: str, owner: str = ""):
    """The course-list row for a control number, preferring the owning college
    MIS names, then the program's own college (a control appears under both
    continuing-education spellings)."""
    if not cands:
        return None
    for want in (owner, college):
        for c in cands:
            if want and same_college(c["college"], want):
                return c
    return cands[0]


def assemble(mem: list, xwalk: dict, programs: set, courses: dict, mis_owner: dict | None = None):
    """The payload rows. `programs` is the set of (college, control) keys in
    coci_college_programs; a membership row whose program Sierra cannot find is
    counted, never loaded. `courses` maps control -> list of course-list rows;
    `mis_owner` maps control -> MIS college code."""
    mis_owner = mis_owner or {}
    stats = collections.Counter()
    seen, rows = set(), []
    for r in mem:
        stats["read"] += 1
        if r["ProgramControlNumber"] in ("", "NULL"):
            stats["skip_no_program_control"] += 1
            continue
        if r["ProgramStatus"] not in KEEP_STATUS:
            stats["skip_program_status"] += 1
            continue
        if r["CourseStatus"] not in KEEP_STATUS:
            stats["skip_course_status"] += 1
            continue
        college = xwalk.get(r["CollegeCode"])
        if not college:
            stats["skip_unmapped_college_code"] += 1
            continue
        pkey = (college, r["ProgramControlNumber"])
        if pkey not in programs:
            stats["skip_program_not_in_catalog"] += 1
            continue
        key = (college, r["ProgramControlNumber"], r["CourseControlNumber"])
        if key in seen:
            stats["skip_duplicate"] += 1
            continue
        seen.add(key)
        owner = xwalk.get(mis_owner.get(r["CourseControlNumber"], ""), "")
        c = pick_course(courses.get(r["CourseControlNumber"], []), college, owner)
        if c:
            stats["course_in_course_list"] += 1
            code, title, units, cid = c["code"], c["title"], c["units"], c["cid"]
            home = owner or c["college"]
            if owner and not same_college(owner, c["college"]):
                stats["course_list_college_overruled_by_mis"] += 1
            course_college = None if same_college(home, college) else home
        else:
            # The membership file carries its own code (no space) and title.
            stats["course_from_membership_only"] += 1
            code, title, units, cid = clean(r["CrsId"]), clean(fix_moji(r["Title"])), None, ""
            course_college = None if not owner or same_college(owner, college) else owner
        if course_college:
            stats["course_at_sister_college"] += 1
        rows.append({
            "college": college,
            "program_control_number": r["ProgramControlNumber"],
            "course_control_number": r["CourseControlNumber"],
            "course_code": code[:40],
            "course_title": title[:200],
            "units": units,
            "cid": cid or None,
            "course_college": course_college,
        })
    stats["rows"] = len(rows)
    stats["programs"] = len({(r["college"], r["program_control_number"]) for r in rows})
    stats["colleges"] = len({r["college"] for r in rows})
    return rows, dict(stats)


def load_courses() -> dict:
    import openpyxl

    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb.active
    it = ws.iter_rows(values_only=True)
    ix = {h: i for i, h in enumerate(next(it))}
    out: dict = collections.defaultdict(list)
    for r in it:
        ctl = clean(r[ix["CourseControlNumber"]])
        college = clean(fix_moji(r[ix["College"]]))
        if not ctl or not college:
            continue
        try:
            units = round(float(r[ix["UnitValue"]]), 2) if clean(r[ix["UnitValue"]]) else None
        except (TypeError, ValueError):
            units = None
        out[ctl].append({
            "college": college,
            "code": f"{clean(r[ix['Subject']])} {clean(r[ix['Course_Number']])}".strip(),
            "title": clean(fix_moji(r[ix["CourseTitle"]])),
            "units": units,
            "cid": clean(r[ix["CIDNumber"]]),
        })
    return out


def load_mis_owner(path: str = CB_MASTER) -> dict:
    """control -> MIS college code (zero-padded, as the membership file writes it)."""
    out = {}
    with open(path, encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            ctl = clean(r.get("CB_CONTROL_NUMBER"))
            if ctl:
                out[ctl] = clean(r.get("CB_COLLEGE_ID"))
    return out


def program_keys(resolve, path: str) -> set:
    """(college, control) for every program build_coci_offerings.py loads."""
    keys = set()
    with open(path, encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            if (r.get("STATUS") or "").strip() not in KEEP_STATUS:
                continue
            c = resolve(r.get("COLLEGE", ""))
            if c:
                keys.add((c, (r.get("CONTROL NUMBER") or "").strip()))
    return keys


def main() -> int:
    courses = load_courses()
    full_names = sorted({c["college"] for v in courses.values() for c in v})
    resolve = make_college_resolver(full_names)
    prog_path = sorted(glob.glob(PROG_GLOB))[-1]
    mem = load_membership()
    course_colleges = {k: {c["college"] for c in v} for k, v in courses.items()}
    xwalk, xreport = college_crosswalk(mem, load_program_colleges(prog_path, resolve), course_colleges)
    pkeys = program_keys(resolve, prog_path)
    rows, stats = assemble(mem, xwalk, pkeys, courses, load_mis_owner())
    # A program with no row here has no course list in the source, which is not
    # the same as a program with no courses. Sierra must say which it is.
    stats["catalog_programs"] = len(pkeys)
    stats["catalog_programs_without_course_list"] = len(pkeys) - stats["programs"]
    payload = {
        "_meta": {
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "source": os.path.basename(MEMBERSHIP),
            "source_as_of": SOURCE_AS_OF,
            "programs_source": os.path.basename(prog_path),
            "crosswalk": xreport,
            "stats": stats,
        },
        "program_courses": rows,
    }
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False)
    print(json.dumps(payload["_meta"], indent=2))
    print(f"\nwrote {OUT}  ({os.path.getsize(OUT) / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
