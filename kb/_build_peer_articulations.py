#!/usr/bin/env python3
"""Build the PEER-ARTICULATION table — "how did other colleges articulate this?"

WHY THIS EXISTS
---------------
Sam, 2026-08-13:

    "If Sierra is answering for Cerritos College, I would want her to recommend
     the most aligned Cerritos welding courses to be articulated so the faculty
     don't have to guess, and have a link or access to the other college
     articulations for this same welding certificate."

Two deliverables, needing different data. This builder does the SECOND one, and
it is deliberately first because it is a **fact, not a proposal**: no matching,
no scoring, nothing to get subtly wrong. Sierra can already say "Barstow
articulated their `WELD 54B — Flux Cored Arc Welding (FCAW)` against the
Introduction-to-FCAW recommendation" the moment this table exists.

The alignment half (rank a college's OWN courses against a rec name) needs a
per-course title table and a scorer, and it must ship WITH this one, because
title similarity alone is systematically biased — Santa Ana articulated
`WELD 240 Structural Welding SMAW` against an **FCAW** recommendation, and no
lexical matcher will ever propose that. See
`docs/kb-notes/methodology-two-signals-for-a-judgment-proposal.md`.

TWO SOURCES, JOINED — because neither has both halves
-----------------------------------------------------
  kb/coci_articulations.json   has `credit_recommendations` (which rec a line
                               satisfies) but its `local_courses` carry NO
                               college attribution.
  credential_reference_data.js has per-course `local[].colleges` but no credit
                               recommendation.

Join key is (unified_title, identity) — CER's `cid` field holds the same value
as COCI's `course_id` (e.g. "SLNA M1017", "AJ 200").

⚠️ ATTRIBUTION IS NOT ALWAYS PER-COURSE — measured, not assumed.
Of 366 articulations carrying >1 local course, **208 (57%) list DIFFERING
college sets per course** (real attribution: `ASL 1 → Copper Mountain`,
`ASL V01 → Ventura`) while **158 (43%) repeat one IDENTICAL set onto every
course**. The identical case is the signature of a group-level list
denormalised down, and taking it literally would assert that five colleges each
teach five equivalent courses under five different subject prefixes.

So every row carries `attribution`:
    'per_course'  — this course's college list is its own (trustworthy)
    'group_wide'  — every course in the articulation shares one list, so we know
                    WHICH COLLEGES articulated and WHICH COURSES were used, but
                    not which college used which. Sierra must phrase it as a
                    group ("these colleges, using courses such as …").

A row that cannot say which college used which course is still worth far more
than no row — but it must not pretend. Sending a welding instructor to a peer
college that never taught that course is the same failure family as inventing an
articulation.

Run from repo root:  python3 kb/_build_peer_articulations.py
Writes: kb/peer_articulations_payload.json
"""
import json
import os
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COCI = os.path.join(ROOT, "kb", "coci_articulations.json")
CER = os.path.join(ROOT, "credential_reference_data.js")
OUT = os.path.join(ROOT, "kb", "peer_articulations_payload.json")


def load_cer(path=CER):
    """Parse the baked `window.CPL_CREDENTIAL_REFERENCE = {...};` payload."""
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("{", src.index("window.CPL_CREDENTIAL_REFERENCE"))
    return json.loads(src[i:].rstrip().rstrip(";"))


def build():
    with open(COCI, encoding="utf-8") as fh:
        coci = json.load(fh)
    cer = load_cer()

    # ── 1. recs per (unified_title, identity) from COCI ────────────────────────
    # Records repeat in this file (the FCAW credential carries each line twice),
    # so a set is the right accumulator, not a list.
    recs_by_key = defaultdict(set)
    meta_by_key = {}
    for r in coci.get("articulations") or []:
        ut = (r.get("unified_title") or "").strip()
        cid = (r.get("course_id") or "").strip()
        if not ut or not cid:
            continue
        key = (ut, cid)
        for cr in r.get("credit_recommendations") or []:
            if cr and cr.strip():
                recs_by_key[key].add(cr.strip())
        meta_by_key.setdefault(key, {
            "identity_system": r.get("identity_system") or "",
            "collaborative_type": r.get("collaborative_type") or "",
            "issuing_agency": r.get("issuing_agency") or "",
            "over_merged": bool(r.get("over_merged")),
        })

    # ── 2. per-course colleges from the CER, with the attribution verdict ──────
    rows = []
    stats = defaultdict(int)
    for rec in cer.get("unified_titles") or []:
        ut = (rec.get("ut") or "").strip()
        if not ut:
            continue
        for a in rec.get("articulations") or []:
            cid = (a.get("cid") or "").strip()
            locs = a.get("local") or []
            if not cid or not locs:
                continue
            key = (ut, cid)
            crs = sorted(recs_by_key.get(key) or [])
            if not crs:
                stats["articulations_with_no_rec"] += 1
                continue
            meta = meta_by_key.get(key, {})
            if meta.get("over_merged"):
                # Never surface a peer route off a conflated identity cluster —
                # the same guardrail the prescriptive layer applies (§6a).
                stats["skipped_over_merged"] += 1
                continue

            college_sets = {tuple(sorted(l.get("colleges") or [])) for l in locs}
            group_wide = len(locs) > 1 and len(college_sets) == 1
            attribution = "group_wide" if group_wide else "per_course"
            stats[f"articulations_{attribution}"] += 1

            for l in locs:
                subj = (l.get("subj") or "").strip()
                num = str(l.get("num") or "").strip()
                title = (l.get("t") or "").strip()
                for college in l.get("colleges") or []:
                    college = (college or "").strip()
                    if not college:
                        continue
                    for cr in crs:
                        rows.append({
                            "unified_title": ut,
                            "credit_rec": cr,
                            "college": college,
                            "subject": subj,
                            "course_number": num,
                            "course_title": title,
                            "course_id": cid,
                            "identity_system": meta.get("identity_system") or a.get("sys") or "",
                            "collaborative_type": meta.get("collaborative_type") or "",
                            "issuer": meta.get("issuing_agency") or "",
                            "attribution": attribution,
                        })

    # Dedupe — the same (credential, rec, college, course) can arrive from more
    # than one articulation line. Keep the STRONGER attribution when it happens:
    # a per_course assertion is evidence, a group_wide one is a hedge, and a row
    # that is per_course anywhere is per_course.
    best = {}
    RANK = {"per_course": 0, "group_wide": 1}
    for r in rows:
        k = (r["unified_title"], r["credit_rec"], r["college"],
             r["subject"], r["course_number"])
        prev = best.get(k)
        if prev is None or RANK[r["attribution"]] < RANK[prev["attribution"]]:
            best[k] = r
    out = sorted(best.values(), key=lambda r: (r["unified_title"], r["credit_rec"],
                                               r["college"], r["subject"], r["course_number"]))

    stats["rows_before_dedupe"] = len(rows)
    stats["rows"] = len(out)
    stats["credentials"] = len({r["unified_title"] for r in out})
    stats["colleges"] = len({r["college"] for r in out})
    stats["rows_per_course"] = sum(1 for r in out if r["attribution"] == "per_course")
    stats["rows_group_wide"] = sum(1 for r in out if r["attribution"] == "group_wide")
    return out, dict(stats)


def main():
    rows, stats = build()
    payload = {"_generated_by": "kb/_build_peer_articulations.py",
               "_stats": stats, "peer_articulations": rows}
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False)
    print(f"→ {OUT}")
    for k in sorted(stats):
        print(f"  {k:34} {stats[k]:,}")

    # Acceptance probe — Sam's own case. If this prints nothing, the join broke.
    TITLE = "ASME BPVC Section IX — FCAW Welder Qualification"
    hits = [r for r in rows if r["unified_title"] == TITLE]
    print(f"\nACCEPTANCE — {TITLE}: {len(hits)} row(s)")
    for r in hits:
        print(f"  {r['college']:<28} {r['subject']} {r['course_number']:<6} "
              f"{r['course_title'][:44]:<44} [{r['attribution']}]")
        print(f"      → {r['credit_rec']}")
    if not hits:
        print("  ⚠ NO ROWS — the (unified_title, cid) join did not land.")
        sys.exit(1)


if __name__ == "__main__":
    main()
