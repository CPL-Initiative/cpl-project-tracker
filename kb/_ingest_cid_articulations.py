#!/usr/bin/env python3
"""Normalize the c-id.net approved-courses extract into the articulation
reference (kb/reference/cid_articulations.json).

Input:  kb/reference/cid_articulations_raw.csv — the curator-supplied extract
        (columns: C-ID #, C-ID Descriptor, Institution, Institution type,
        Local Course Title(s), Local Dept. Name & Number, Approval date,
        COR effective term). "Approval date" is the EXPORT date (constant) —
        dropped; "COR effective term" is the real per-row term.
Output: kb/reference/cid_articulations.json (--write), replacing the Phase-0
        seed. Always prints the normalization analysis.

Format facts (measured 2026-06-11 on the 27,379-row extract):
  * 1,761 CSU rows — dropped (Institution type filter).
  * " + " zips PARALLEL lists across Institution / Dept&Number / Title(s):
    distinct colleges in one row = a district-shared approval (each college
    gets its own articulation row); the SAME college repeated in one row = a
    COURSE SEQUENCE (two+ local courses jointly satisfy the descriptor) —
    kept with `sequence: true`, which the joiner EXCLUDES from auto-routing
    (neither course alone IS the C-ID course; curation decides).
  * Intra-cell lists (", " / " & " / ";" / " AND ") on a single college are
    sequences too (e.g. "CHEM 101, 102").
  * Subjects may contain slashes/spaces ("CS/IS   101", "A/PHYSIO 34A") —
    the number is the LAST whitespace token; internal runs of spaces collapse.
  * Institution names differ from COCI College names for a handful of
    colleges (e.g. "Madera Community College" vs COCI "Madera College") —
    COLLEGE_ALIASES maps extract names to COCI names; the joiner's unmatched
    report is the source for new entries.

Usage (from repo root):
  python3 kb/_ingest_cid_articulations.py            # analysis only
  python3 kb/_ingest_cid_articulations.py --write    # write the reference
"""
import csv
import io
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "reference", "cid_articulations_raw.csv")
OUT = os.path.join(HERE, "reference", "cid_articulations.json")

# extract Institution name -> COCI College name (the joiner matches on an
# ASCII-alnum slug, so only genuinely different NAMES need entries; authored
# from the joiner's unmatched-college report — extend there, never guess.
# Post-ingest measured residue: ONLY Barstow (COCI says "Barstow Community
# College"; the extract says "Barstow College").
COLLEGE_ALIASES = {
    "Barstow College": "Barstow Community College",
    "Madera Community College": "Madera College",
    "Lassen Community College": "Lassen College",
    "Canada College": "Cañada College",
    "Copper Mountain Community College": "Copper Mountain College",
    "Folsom Lake College - El Dorado Center": "Folsom Lake College",
    "Sacramento City College - Davis Center": "Sacramento City College",
    "Sacramento City College - West Sacramento Center": "Sacramento City College",
    "Yuba Community College": "Yuba College",
    "Lake Tahoe Community College ": "Lake Tahoe Community College",
}

SEQ_INTRA = re.compile(r"(,| & |;| AND )", re.IGNORECASE)


def _clean(s):
    return re.sub(r"\s+", " ", str(s or "").strip())


def _split_dept_number(course):
    """'CS/IS   101' -> ('CS/IS', '101'); 'MATH 150HF' -> ('MATH', '150HF')."""
    c = _clean(course)
    if " " not in c:
        return c, ""
    dept, num = c.rsplit(" ", 1)
    return dept, num


def ingest():
    text = open(RAW, "rb").read().decode("utf-8-sig", errors="replace")
    rows = list(csv.DictReader(io.StringIO(text)))
    arts, stats = [], Counter()
    for r in rows:
        if r["Institution type"] != "California Community College":
            stats["dropped_non_ccc"] += 1
            continue
        insts = [_clean(x) for x in r["Institution"].split(" + ")]
        courses = [_clean(x) for x in r["Local Dept. Name & Number"].split(" + ")]
        titles = [_clean(x) for x in r["Local Course Title(s)"].split(" + ")]
        # zip semantics: equal lists pair positionally; ONE college with many
        # courses is a single-college sequence; ONE course with many colleges
        # is a district share written once. Anything else is malformed.
        if len(insts) == len(courses):
            pairs = list(zip(insts, courses))
        elif len(insts) == 1:
            pairs = [(insts[0], c) for c in courses]
        elif len(courses) == 1:
            pairs = [(i, courses[0]) for i in insts]
        else:
            stats["malformed_zip"] += 1
            continue
        seq_colleges = {c for c, n in Counter(i for i, _ in pairs).items() if n > 1}
        for i, (inst, course) in enumerate(pairs):
            college = COLLEGE_ALIASES.get(inst, inst)
            title = titles[i] if i < len(titles) else (titles[0] if titles else "")
            sequence = inst in seq_colleges or bool(SEQ_INTRA.search(course))
            dept, num = _split_dept_number(course)
            if not num:
                stats["no_number"] += 1
                continue
            arts.append({
                "cid": _clean(r["C-ID #"]),
                "cid_title": _clean(r["C-ID Descriptor"]),
                "college": college,
                "subject": dept,
                "number": num,
                "local_title": title,
                "effective_term": _clean(r["COR effective term"]),
                **({"sequence": True} if sequence else {}),
            })
            stats["articulations"] += 1
            if sequence:
                stats["sequence_flagged"] += 1
    return arts, stats


def main():
    write = "--write" in sys.argv
    arts, stats = ingest()
    print("normalization:", dict(stats))
    print(f"distinct descriptors: {len({a['cid'] for a in arts})}")
    print(f"distinct colleges:    {len({a['college'] for a in arts})}")
    math = [a for a in arts if a["cid"].startswith("MATH")]
    print(f"MATH articulations:   {len(math)} across {len({a['cid'] for a in math})} descriptors "
          f"({sum(1 for a in math if a.get('sequence'))} sequence-flagged)")
    if not write:
        print("\nANALYSIS ONLY — no files written. Re-run with --write.")
        return 0
    doc = {
        "_status": (f"FULL EXTRACT — {stats['articulations']} CCC articulations normalized from "
                    f"kb/reference/cid_articulations_raw.csv (c-id.net approved-courses export, "
                    f"supplied by Sam 2026-06-11; CSU rows dropped; ' + ' zips split; sequences "
                    f"flagged). Regenerate with kb/_ingest_cid_articulations.py --write."),
        "_source": "https://c-id.net approved-courses export (data-c-idsystem.org) — curator-supplied; the site 403s session containers.",
        "_schema": "articulations[]: {cid, cid_title, college, subject, number, local_title, effective_term, sequence?}. Join key is (college, subject, number) against the raw COCI list — EXACT match (leading-zero-normalized fallback is flagged); titles are NEVER used for joining. sequence:true rows (multi-course articulations) are EXCLUDED from auto-routing by the joiner.",
        "_semantics": "PRESENT-TENSE official authority at the (college, course) grain — same trust tier as COCI's CIDNumber column (and ~doubles it: colleges under-report in COCI). Not a receipt — no kinship gate. Unmatched entries surface for curation; never fuzzy-matched.",
        "_ingested_at": date.today().isoformat(),
        "count": len(arts),
        "articulations": arts,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    print(f"\nWROTE {OUT} ({len(arts)} articulations)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
