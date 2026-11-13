#!/usr/bin/env python3
"""Why 1,604 active programs have no closed list: a diagnosis of the gap census's largest cause (S644).

The harvest gap census (kb/_harvest_gap_census.py, S644) gives each active program without a passing
record one cause. Its largest is no_closed_list: the college reader (kb/_program_requirements_college.py,
college_programs) finds no row for the program in coci_program_courses and never reads it. This script
says why the state's file holds no list for each such program, with exactly one REASON per program,
and describes who the programs are. It decides nothing and writes no table.

THE CHAIN, as built today:
  kb/reference/coci_program_course_file.csv.gz   the Data Mart Program Course File (export 2026-07-16)
  tmc/source_data/coci_program_export_*.csv      the COCI program export (2026-06-17): coci_college_programs
  chatbox/build_program_courses.py               joins them on (college, control number), keeps a row when
                                                 the program AND the course are Active, Approved or Active -
                                                 Teachout Only, and writes the payload coci-offerings-sync.yml
                                                 loads into coci_program_courses
  kb/_program_requirements_college.py            reads coci_program_courses by college name

REASONS, in precedence order (each program takes the first that holds):
  cn_absent             the control number appears nowhere in the Program Course File, in any status,
                        under any college code
  cn_other_college_only the control number appears only under another college's code
  program_pending_only  the file's rows for it carry only a pending program status (Submitted, Review,
                        Draft, Revision): the Active version's course list is not in the file
  program_inactive      the file's rows carry only Inactive or Deleted: retired after the program export
  courses_all_retired   the program is kept, and every course it lists is Inactive, Deleted or pending
  join_dropped          the file holds a kept row for a kept course and the build still has no row:
                        a join bug (0 expected)

Reads only committed files. The census JSON gives the members (--census; the live run's JSON on a
runner, or a copy). Writes kb/status/harvest_no_closed_list.json and prints the tables.
Guard: tests/harvest_no_closed_list_diagnosis_test.py. Note: docs/harvest_no_closed_list_diagnosis_s644.md.
"""
from __future__ import annotations

import argparse
import collections
import csv
import glob
import gzip
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from _program_requirements_college import file_code  # noqa: E402  (the one rewrite of a stored code)

MEMBERSHIP = os.path.join(HERE, "reference", "coci_program_course_file.csv.gz")
PROG_GLOB = os.path.join(ROOT, "tmc", "source_data", "coci_program_export_*.csv")
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
CENSUS = os.path.join(HERE, "status", "harvest_gap_census.json")
OUT = os.path.join(HERE, "status", "harvest_no_closed_list.json")

KEEP = ("Active", "Approved", "Active - Teachout Only")   # build_program_courses.KEEP_STATUS
PENDING = ("Submitted", "Review", "Draft", "Revision")
RETIRED = ("Inactive", "Deleted")
REASONS = ("cn_absent", "cn_other_college_only", "program_pending_only", "program_inactive",
           "courses_all_retired", "join_dropped")


def norm_code(s: str) -> str:
    """A code as the catalog prints it, letters and digits only: San Jose City's file stores
    some courses as 'Air Conditioning (AIRC) 132' and others as 'AIRC 121' (file_code, S644)."""
    return re.sub(r"[^A-Z0-9]", "", (file_code(s) or "").upper())


def award_kind(award: str) -> str:
    """The award as the COCI export names it, in the bands the brief asks about."""
    a = (award or "").strip()
    if not a:
        return "award blank"
    if a.startswith("Noncredit"):
        return "noncredit program"
    if "T Degree" in a:
        return "transfer degree (ADT)"
    if a in ("A.A. Degree", "A.S. Degree"):
        return "local degree (A.A., A.S.)"
    if a.startswith("Baccalaureate"):
        return "baccalaureate"
    if "8S/12Q to fewer than 16S" in a:
        return "certificate, 8 to under 16 units"
    if "12 to fewer than 18" in a:
        return "certificate, 12 to under 18 units"
    if "16S/24Q to fewer than 30S" in a:
        return "certificate, 16 to under 30 units"
    if "18  or greater" in a or "18 or greater" in a:
        return "certificate, 18 units or more"
    if "30S/45Q" in a:
        return "certificate, 30 to under 60 units"
    return "other: " + a[:40]


def approval_band(date: str) -> str:
    """The export's APPROVED DATE in bands. A Jan 1 date before 2010 is the legacy load's placeholder."""
    d = (date or "").strip()
    if not d:
        return "no approval date"
    y = int(d[:4])
    if d.endswith("-01-01") and y < 2010:
        return "Jan 1 before 2010 (legacy placeholder)"
    if y < 2010:
        return "before 2010"
    if y < 2020:
        return "2010-2019"
    if y < 2026:
        return "2020-2025"
    return "2026"


def classify(college_code: str | None, cn: str, rows_by_cn: dict, active_codes: dict) -> tuple[str, dict]:
    """One program's reason, and for courses_all_retired whether a same-code kept course exists at
    the college (the course was replaced under a new control number)."""
    rows = rows_by_cn.get(cn, [])
    if not rows:
        return "cn_absent", {}
    mine = [r for r in rows if r["CollegeCode"] == college_code] if college_code else rows
    if not mine:
        return "cn_other_college_only", {}
    pstat = {r["ProgramStatus"] for r in mine}
    kept = [r for r in mine if r["ProgramStatus"] in KEEP]
    if not kept:
        if pstat <= set(RETIRED):
            return "program_inactive", {}
        if pstat & set(PENDING):
            return "program_pending_only", {}
        return "program_inactive", {}
    live = [r for r in kept if r["CourseStatus"] in KEEP]
    if not live:
        codes = {norm_code(r["CrsId"]) for r in kept}
        have = active_codes.get(college_code, set())
        hit = sum(1 for c in codes if c in have)
        return "courses_all_retired", {"listed": len(codes), "same_code_kept": hit,
                                       "replaced": "all" if hit == len(codes) else ("some" if hit else "none")}
    return "join_dropped", {}


def load_membership(path: str = MEMBERSHIP) -> list:
    opener = gzip.open if path.endswith(".gz") else open
    with opener(path, "rb") as fh:
        return list(csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig")))


def college_codes(mem: list, export_by_cn: dict) -> dict:
    """college name -> its MIS code in the file, voted by the code's control numbers that the export
    files under one college (the build's first signal, without the course list)."""
    vote = collections.defaultdict(collections.Counter)
    for r in mem:
        cs = export_by_cn.get(r["ProgramControlNumber"])
        if cs and len(cs) == 1:
            vote[next(iter(cs))][r["CollegeCode"]] += 1
    return {c: v.most_common(1)[0][0] for c, v in vote.items()}


def diagnose(members: list, export: dict, mem: list, captures: dict | None = None) -> dict:
    """members: [(college, cn)]; export: {(college, cn): export row}; mem: Program Course File rows;
    captures: {(college, cn): sources.json entry}."""
    rows_by_cn = collections.defaultdict(list)
    for r in mem:
        rows_by_cn[r["ProgramControlNumber"]].append(r)
    export_by_cn = collections.defaultdict(set)
    for (c, cn) in export:
        export_by_cn[cn].add(c)
    codes = college_codes(mem, export_by_cn)
    active_codes = collections.defaultdict(set)
    for r in mem:
        if r["CourseStatus"] in KEEP:
            active_codes[r["CollegeCode"]].add(norm_code(r["CrsId"]))
    progs, tallies = [], collections.defaultdict(collections.Counter)
    for college, cn in sorted(members):
        e = export.get((college, cn)) or {}
        reason, extra = classify(codes.get(college), cn, rows_by_cn, active_codes)
        cap = (captures or {}).get((college, cn))
        looked = "no capture entry" if cap is None else (
            "never looked for" if cap.get("method") == "no_closed_list" and not cap.get("source") else "looked")
        p = {"college": college, "control_number": cn, "title": e.get("TITLE", ""), "reason": reason,
             "award": award_kind(e.get("AWARD")), "approved": approval_band(e.get("APPROVED DATE")),
             "credit": "noncredit" if award_kind(e.get("AWARD")) == "noncredit program" else "credit",
             "units_stated": units_stated(e), "page": looked}
        p.update(extra)
        progs.append(p)
        for k in ("reason", "award", "approved", "credit", "units_stated", "page", "college"):
            tallies[k][str(p[k])] += 1
        if reason == "courses_all_retired":
            tallies["replaced"][extra["replaced"]] += 1
        tallies["reason_by_award"][reason + " | " + p["award"]] += 1
    return {"programs": progs, "members": len(progs),
            "tallies": {k: dict(v.most_common()) for k, v in tallies.items()}}


def units_stated(e: dict) -> bool:
    for k in ("MAJOR UNITS", "CERT UNITS"):
        m = re.match(r"\s*([\d.]+)", e.get(k) or "")
        if m and float(m.group(1)) > 0:
            return True
    return False


def baseline(export: dict, mem: list) -> dict:
    """Approval bands over every Active program, split by whether its control number is in the file:
    the legacy share among programs the file never lists, against the share among those it does."""
    cns = {r["ProgramControlNumber"] for r in mem}
    out = {"in_file": collections.Counter(), "absent": collections.Counter()}
    for (c, cn), e in export.items():
        if (e.get("STATUS") or "").strip() == "Active":
            out["in_file" if cn in cns else "absent"][approval_band(e.get("APPROVED DATE"))] += 1
    digits = [int(c) for c in cns if c.isdigit()]
    return {"in_file": dict(out["in_file"].most_common()), "absent": dict(out["absent"].most_common()),
            "max_cn_in_file": max(digits) if digits else None,
            "max_cn_in_export": max((int(cn) for (_, cn) in export if cn.isdigit()), default=None)}


def read_export(resolve) -> dict:
    path = sorted(glob.glob(PROG_GLOB))[-1]
    out = {}
    with open(path, encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            c = resolve(r.get("COLLEGE", ""))
            if c and (r.get("STATUS") or "").strip() in KEEP:
                out.setdefault((c, (r.get("CONTROL NUMBER") or "").strip()), r)
    return out


def read_captures() -> dict:
    out = {}
    for d in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "sources.json"))):
        summ = os.path.join(os.path.dirname(d), "summary.json")
        if not os.path.exists(summ):
            continue
        college = json.load(open(summ, encoding="utf-8")).get("college")
        src = json.load(open(d, encoding="utf-8"))
        for e in src if isinstance(src, list) else src.get("sources", []):
            out[(college, str(e.get("control_number")))] = e
    return out


def census_members(path: str) -> tuple[list, str]:
    d = json.load(open(path, encoding="utf-8"))
    m = [(c, cn) for c, ps in d["programs_by_college"].items() for cn, v in ps.items()
         if v.split("|")[0] == "no_closed_list"]
    return m, "%s, %s" % (d.get("basis"), d.get("written_at"))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--census", default=CENSUS, help="the gap census JSON whose no_closed_list programs to diagnose")
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--membership", default=MEMBERSHIP,
                    help="a Program Course File (.csv or .csv.gz), e.g. a fresh fetch's artifact, to compare")
    a = ap.parse_args(argv)
    sys.path.insert(0, os.path.join(ROOT, "chatbox"))
    from build_program_courses import load_courses, make_college_resolver  # noqa: E402
    courses = load_courses()
    resolve = make_college_resolver(sorted({c["college"] for v in courses.values() for c in v}))
    export = read_export(resolve)
    mem = load_membership(a.membership)
    members, basis = census_members(a.census)
    r = diagnose(members, export, mem, read_captures())
    r["census"] = basis
    r["baseline"] = baseline(export, mem)
    # Another closed universe: the college's own courses in the COCI course list Sierra reads.
    per_college = collections.Counter(c["college"] for v in courses.values() for c in v)
    r["tallies"]["college_course_list"] = dict(collections.Counter(
        "college has a course list" if per_college.get(p["college"]) else "no course list"
        for p in r["programs"]).most_common())
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as fh:
        json.dump(r, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    print("census %s: %d programs with no closed list" % (basis, r["members"]))
    for k in ("reason", "replaced", "award", "credit", "approved", "units_stated", "page", "college_course_list"):
        print("\n" + k)
        for v, n in r["tallies"].get(k, {}).items():
            print("  %5d  %s" % (n, v))
    print("\ncollege (top 15)")
    for v, n in list(r["tallies"]["college"].items())[:15]:
        print("  %5d  %s" % (n, v))
    print("\nbaseline, every Active program by approval band:", json.dumps(r["baseline"], indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
