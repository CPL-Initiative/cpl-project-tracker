#!/usr/bin/env python3
"""Build tmc_college_courses.js — the per-college COCI course index that powers
the right-side "select your local course" dropdowns on the TMC Builder tab.

ONE-SHOT / STATIC builder (NOT a daily-cron artifact). Re-run only when a fresh
MAP COCI extract lands at kb/reference/coci_course_list.xlsx (the same 141,738-row
file the Common Course Reference member-join reads). Mirrors the shape of
funding/_build_funding_data.py: read the workbook once (read-only, streaming),
emit a compact committed JS artifact.

Output shape (window.CPL_TMC_COLLEGE_COURSES):
  {
    "_meta": {...},
    "colleges": ["Allan Hancock College", ...],         # index == position
    "courses": { "<collegeIdx>": [[subj, num, title, units, cid], ...]
                                 or [[subj, num, title, units, cid, [xcid, ...]], ...] }
  }
  - units: number or null
  - cid:   normalized PRIMARY C-ID (e.g. "ANTH 110") or null — byte-identical to
           the kb/reference/cid_descriptors.json descriptor key, so the client can
           auto-match a slot's C-ID to a college course with a plain ==.
  - xcid[]: OPTIONAL 6th element — ADDITIONAL C-IDs the same course carries beyond
           the primary (a course can be C-ID-approved for >1 descriptor). Present
           only when a course has 2+ C-IDs, so the common single-C-ID row stays a
           lean 5-tuple. The client matches a slot against {cid} ∪ xcid.

C-ID SOURCES (unioned per course):
  1. COCI `CIDNumber` column (kb/reference/coci_course_list.xlsx) — the college's
     self-reported C-ID. Under-reported: ~1/4 of colleges record few/no C-IDs.
  2. c-id.net approved-courses export (kb/reference/cid_articulations.json) — the
     OFFICIAL C-ID→local-course authority (same trust tier as COCI's CIDNumber;
     ~doubles coverage: 10.6k → 21.3k college×C-ID pairs). Joined on
     (college, subject, number) EXACT, with a leading-zero-normalized fallback.
     `sequence:true` rows (multi-course articulations) are EXCLUDED — a single
     local course is not a standalone match for a sequence descriptor.
  Soft-fails: if cid_articulations.json is absent, the build proceeds on COCI alone.

Run from repo root:  python3 tmc/_build_college_courses.py
"""
import json
import re
import os
from datetime import datetime, timezone

import openpyxl

SRC = "kb/reference/coci_course_list.xlsx"
SRC_CIDA = "kb/reference/cid_articulations.json"
OUT = "tmc_college_courses.js"

_NULLS = {"", "N/A", "NA", "NULL", "NONE", "NOT APPLICABLE"}


def fix_mojibake(s):
    """The MAP extract double-encodes a few names ('CaÃ±ada' -> 'Cañada').
    Repair guardedly: only when the tell-tale 'Ã'/'Â' bytes are present."""
    if not s or ("Ã" not in s and "Â" not in s):
        return s
    try:
        return s.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


def norm_cid(v):
    if v is None:
        return None
    s = re.sub(r"\s+", " ", str(v).strip()).upper()
    if s in _NULLS:
        return None
    return s


def clean_units(v):
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f != f:  # NaN
        return None
    return int(f) if f == int(f) else round(f, 2)


def num_norm(n):
    """Leading-zero-normalized course number for the c-id.net join fallback
    ('MATH 019' ↔ 'MATH 19'). Strips leading zeros on the leading numeric run,
    preserves any alpha suffix ('019A' -> '19A')."""
    s = str(n).strip().upper()
    m = re.match(r"^0*(\d+)(.*)$", s)
    return (m.group(1) + m.group(2)) if m else s


def load_cid_articulations():
    """Return two (college, subj, num) -> set(C-ID) lookups from the official
    c-id.net export: an EXACT-number map and a leading-zero-normalized map.
    Both keyed by the c-id.net college name (already reconciled to COCI at
    ingestion) — which matches the fix_mojibake()'d COCI college name here.
    `sequence:true` rows are excluded. Missing file -> empty (soft-fail)."""
    exact, norm = {}, {}
    if not os.path.exists(SRC_CIDA):
        print(f"  (no {SRC_CIDA}; building on COCI CIDNumber alone)")
        return exact, norm, 0
    data = json.load(open(SRC_CIDA, encoding="utf-8"))
    n_seq = 0
    for a in data.get("articulations", []):
        if a.get("sequence"):
            n_seq += 1
            continue
        cid = norm_cid(a.get("cid"))
        if not cid:
            continue
        coll = (a.get("college") or "").strip()
        subj = (a.get("subject") or "").strip().upper()
        num = str(a.get("number") or "").strip()
        if not (coll and (subj or num)):
            continue
        exact.setdefault((coll, subj, num), set()).add(cid)
        norm.setdefault((coll, subj, num_norm(num)), set()).add(cid)
    return exact, norm, n_seq


def main():
    if not os.path.exists(SRC):
        raise SystemExit(f"missing {SRC}")
    wb = openpyxl.load_workbook(SRC, read_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    header = list(next(rows))
    col = {h: i for i, h in enumerate(header)}
    ci = lambda name: col[name]

    by_college = {}          # name -> dict[(subj,num,title,units,cid)] (dedupe)
    n = 0
    for r in rows:
        n += 1
        college = fix_mojibake((r[ci("College")] or "").strip())
        if not college:
            continue
        subj = (str(r[ci("Subject")]).strip() if r[ci("Subject")] is not None else "")
        num = (str(r[ci("Course_Number")]).strip() if r[ci("Course_Number")] is not None else "")
        title = fix_mojibake((str(r[ci("CourseTitle")]).strip() if r[ci("CourseTitle")] is not None else ""))
        units = clean_units(r[ci("UnitValue")])
        cid = norm_cid(r[ci("CIDNumber")])
        if not subj and not num and not title:
            continue
        key = (subj, num, title, units, cid)
        by_college.setdefault(college, {})[key] = True

    wb.close()

    colleges = sorted(by_college.keys())
    idx_of = {name: i for i, name in enumerate(colleges)}

    def natkey(rec):
        subj, num, title, units, cid = rec
        m = re.match(r"(\d+)", num or "")
        numv = int(m.group(1)) if m else 0
        return (subj, numv, num, title)

    cida_exact, cida_norm, n_seq = load_cid_articulations()

    courses = {}
    cid_courses = 0          # courses with ≥1 C-ID (union)
    total = 0
    cidnet_only = 0          # courses whose ONLY C-ID(s) came from c-id.net (COCI blank)
    multi_cid = 0            # courses carrying ≥2 C-IDs
    cidnet_added = 0         # courses that gained ≥1 C-ID from c-id.net beyond COCI
    for name in colleges:
        recs = sorted(by_college[name].keys(), key=natkey)
        arr = []
        for subj, num, title, units, cid in recs:
            # union the COCI C-ID with the c-id.net authority (exact, then
            # leading-zero-normalized fallback) for this (college, subj, num)
            extra = set(cida_exact.get((name, subj.upper(), num), ()))
            extra |= set(cida_norm.get((name, subj.upper(), num_norm(num)), ()))
            all_cids = set(extra)
            if cid:
                all_cids.add(cid)
            if not all_cids:
                arr.append([subj, num, title, units, cid])  # cid is None
                total += 1
                continue
            # primary (display) C-ID: keep COCI's when present (its own report),
            # else the lexically-first c-id.net one — deterministic across runs
            primary = cid if cid else sorted(all_cids)[0]
            xcids = sorted(all_cids - {primary})
            row = [subj, num, title, units, primary]
            if xcids:
                row.append(xcids)
            arr.append(row)
            total += 1
            cid_courses += 1
            if not cid:
                cidnet_only += 1
            if len(all_cids) >= 2:
                multi_cid += 1
            if (all_cids - ({cid} if cid else set())):
                cidnet_added += 1
        courses[str(idx_of[name])] = arr

    payload = {
        "_meta": {
            "_generated_by": "tmc/_build_college_courses.py",
            "_generated_at": datetime.now(timezone.utc).isoformat(),
            "_source": SRC,
            "_source_cid_articulations": SRC_CIDA,
            "_note": (
                "Per-college course index for the TMC Builder right-side "
                "dropdowns. Each row's C-ID(s) are the UNION of COCI's CIDNumber "
                "and the official c-id.net approved-courses authority "
                "(cid_articulations.json), joined on (college, subject, number). "
                "cid = primary/display C-ID (normalized to the "
                "kb/reference/cid_descriptors.json key); an optional 6th element "
                "xcid[] carries ADDITIONAL C-IDs the same course holds, so a "
                "course can auto-match >1 slot. STATIC artifact — rebuild only on "
                "a fresh COCI or c-id.net extract."
            ),
            "rows_read": n,
            "colleges": len(colleges),
            "courses": total,
            "courses_with_cid": cid_courses,
            "courses_cid_from_cidnet_only": cidnet_only,
            "courses_multi_cid": multi_cid,
            "courses_gained_cid_from_cidnet": cidnet_added,
            "cid_articulations_sequence_rows_skipped": n_seq,
        },
        "colleges": colleges,
        "courses": courses,
    }

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// AUTO-GENERATED by tmc/_build_college_courses.py — DO NOT EDIT BY HAND.\n")
        f.write("// Per-college COCI offerings for the TMC Builder tab (right-side course pickers).\n")
        f.write("window.CPL_TMC_COLLEGE_COURSES = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    size_mb = os.path.getsize(OUT) / 1e6
    print(f"wrote {OUT}: {size_mb:.1f} MB")
    print(f"  colleges={len(colleges)} courses={total} with_cid={cid_courses} rows_read={n}")
    print(f"  c-id.net: gained_cid={cidnet_added} cidnet_only={cidnet_only} "
          f"multi_cid={multi_cid} seq_skipped={n_seq}")


if __name__ == "__main__":
    main()
