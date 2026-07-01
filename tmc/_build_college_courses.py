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
                                 or [[subj, num, title, units, cid, [xcid, ...]], ...]
                                 or [[subj, num, title, null, cid, [xcid, ...], 1], ...]
                                 or [[subj, num, title, units, cid, [xcid, ...], 0, [tcid, ...]], ...] }
  }
  - units: number or null
  - cid:   normalized PRIMARY C-ID (e.g. "ANTH 110") or null — byte-identical to
           the kb/reference/cid_descriptors.json descriptor key, so the client can
           auto-match a slot's C-ID to a college course with a plain ==.
  - xcid[]: OPTIONAL 6th element — ADDITIONAL C-IDs the same course carries beyond
           the primary (a course can be C-ID-approved for >1 descriptor). Present
           only when a course has 2+ C-IDs, so the common single-C-ID row stays a
           lean 5-tuple.  The client matches a slot against {cid} ∪ xcid ∪ tcid.
  - 7th element == 1: a SYNTHESIZED row — the college holds this C-ID approval per
           c-id.net, but the course has no row in our COCI extract (typically a
           CCN-transition inactivation window, e.g. legacy intro-sociology courses
           retired ahead of SOCI C1000). Units are unknown (null). The consumer
           badges these "per c-id.net — verify" so the right side lines up with
           the official approval without over-claiming COCI presence.
  - 8th element tcid[] (7th == 0): C-IDs attached by the UNIQUE-TITLE join lane —
           an INFERRED code-to-course mapping (the c-id.net approval names a
           retired/renamed local code; this current course uniquely bears the
           identical title). The consumer renders a tcid match "≈ verify", never
           COCI-grade "✓ aligned" — provenance is the product (CO triage).

C-ID SOURCES (unioned per course):
  1. COCI `CIDNumber` column (kb/reference/coci_course_list.xlsx) — the college's
     self-reported C-ID. Under-reported: ~1/4 of colleges record few/no C-IDs.
     A value may be COMMA-JOINED ("AJ 110, SOCI 160") — split into all C-IDs
     (the first listed stays the display primary).
  2. c-id.net approved-courses export (kb/reference/cid_articulations.json) — the
     OFFICIAL C-ID→local-course authority (same trust tier as COCI's CIDNumber).
     Joined to COCI rows through a precedence ladder; every approval lands exactly
     one way:
       a. (college, subject, number) EXACT;
       b. leading-zero-normalized number ("MATH 019" ↔ "MATH 19");
       c. SQUASHED full-code ("PHYS 223"+"F" ↔ "PHYS"+"223 F" → PHYS223F;
          "C DEV" ↔ "CDEV") — rescues subject/number split + spacing drift;
       d. UNIQUE-TITLE join at the same college — rescues subject renames
          (SPCH→CMST, CMST→COMM) where the course lives on in COCI under a new
          code; requires exactly ONE (subj, num) with that normalized title;
       e. SYNTHESIZED row (flagged, units unknown) — the approval is real but the
          course has no COCI row at all.
     `sequence:true` rows (multi-course articulations) are EXCLUDED everywhere —
     a single local course is not a standalone match for a sequence descriptor.
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


def split_cids(v):
    """COCI `CIDNumber` may be COMMA-JOINED ('AJ 110, SOCI 160' — 46 rows in the
    current extract, all plain 'CID, CID' lists). Return the normalized C-IDs in
    listed order (first = the college's display primary). Unsplit, the joined
    string is a garbage primary that can never match a slot. Each split part is
    re-checked against the NULL sentinels so a future 'MATH 110, N/A' can't emit
    a literal 'N/A' C-ID."""
    s = norm_cid(v)
    if not s:
        return []
    return [p.strip() for p in s.split(",") if p.strip() and p.strip() not in _NULLS]


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


def squash_code(subj, num):
    """Whitespace/hyphen-squashed, leading-zero-normalized FULL course code —
    the drift-tolerant join key. 'PHYS 223'+'F' and 'PHYS'+'223 F' both →
    'PHYS223F'; 'C DEV'+'103' and 'CDEV'+'103' both → 'CDEV103'. c-id.net's
    ingestion sometimes splits subject/number at a different space than COCI."""
    s = re.sub(r"[\s\-]+", "", (str(subj or "") + str(num or "")).upper())
    return re.sub(r"^([A-Z]+)0*(\d)", r"\1\2", s)


def norm_title(t):
    """STRICT-equality title key for the unique-title join: lowercase, alnum,
    whitespace-collapsed — NO word dropping. An earlier draft also stripped
    'honors'/articles, but the adversarial verify (2026-07-01) proved that
    stripping erases COURSE-LEVEL markers and captures siblings: 'Elementary
    Statistics A' (the 2-unit A-half) swallowed the 'Elementary Statistics,
    Honors' full-course approval; 'Honors United States History' (the B-half
    017BH) inherited the A-half's HIST 130. A stripped-only match now falls
    through to an honest synthesized row instead."""
    s = re.sub(r"[^a-z0-9 ]", " ", str(t or "").lower())
    return " ".join(s.split())


def load_cid_articulations():
    """Return (approvals, n_seq): approvals = c-id.net records MERGED by
    (college, subject, number) → {college, subj, num, cids:set, title}, keyed by
    the c-id.net college name (already reconciled to COCI at ingestion — matches
    the fix_mojibake()'d COCI college name here). `sequence:true` rows are
    excluded. Missing file -> ([], 0) (soft-fail)."""
    if not os.path.exists(SRC_CIDA):
        print(f"  (no {SRC_CIDA}; building on COCI CIDNumber alone)")
        return [], 0
    data = json.load(open(SRC_CIDA, encoding="utf-8"))
    n_seq = 0
    merged = {}
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
        rec = merged.setdefault((coll, subj, num), {
            "college": coll, "subj": subj, "num": num, "cids": set(), "title": "",
        })
        rec["cids"].add(cid)
        if not rec["title"] and a.get("local_title"):
            rec["title"] = str(a["local_title"]).strip()
    return list(merged.values()), n_seq


def main():
    if not os.path.exists(SRC):
        raise SystemExit(f"missing {SRC}")
    wb = openpyxl.load_workbook(SRC, read_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    header = list(next(rows))
    col = {h: i for i, h in enumerate(header)}
    ci = lambda name: col[name]

    by_college = {}          # name -> dict[(subj,num,title,units,cids_tuple)] (dedupe)
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
        coci_cids = tuple(split_cids(r[ci("CIDNumber")]))
        if not subj and not num and not title:
            continue
        key = (subj, num, title, units, coci_cids)
        by_college.setdefault(college, {})[key] = True

    wb.close()

    colleges = sorted(by_college.keys())
    idx_of = {name: i for i, name in enumerate(colleges)}

    # ---- materialize mutable per-college course dicts (joins attach into these)
    coursedicts = {}         # name -> [ {subj,num,title,units,coci:[...],extra:set,textra:set,synth:False} ]
    for name in colleges:
        lst = []
        for subj, num, title, units, coci_cids in by_college[name].keys():
            lst.append({"subj": subj, "num": num, "title": title, "units": units,
                        "coci": list(coci_cids), "extra": set(), "textra": set(),
                        "synth": False})
        coursedicts[name] = lst

    approvals, n_seq = load_cid_articulations()

    # ---- join ladder a/b/c: exact → zero-normalized → squashed full code ------
    # index the c-id.net approvals three ways; each COCI row consumes every
    # approval it matches (consumed approvals never fall through to title/synth).
    exact, znorm, squash = {}, {}, {}
    for rec in approvals:
        exact.setdefault((rec["college"], rec["subj"], rec["num"]), []).append(rec)
        znorm.setdefault((rec["college"], rec["subj"], num_norm(rec["num"])), []).append(rec)
        squash.setdefault((rec["college"], squash_code(rec["subj"], rec["num"])), []).append(rec)

    lane_counts = {"exact": 0, "zero_norm": 0, "squash": 0, "title": 0, "synth": 0}

    def consume(rec, lane):
        if "lane" not in rec:
            rec["lane"] = lane
            lane_counts[lane] += 1

    for name in colleges:
        for c in coursedicts[name]:
            subj_u = c["subj"].upper()
            hits = (
                [("exact", r) for r in exact.get((name, subj_u, c["num"]), ())]
                + [("zero_norm", r) for r in znorm.get((name, subj_u, num_norm(c["num"])), ())]
                + [("squash", r) for r in squash.get((name, squash_code(c["subj"], c["num"])), ())]
            )
            for lane, rec in hits:
                c["extra"] |= rec["cids"]
                consume(rec, lane)

    # ---- lane d: UNIQUE-TITLE join (subject renames — course lives on in COCI
    # under a new code). Only when exactly ONE (subj, num) at that college bears
    # the STRICT-equal normalized title; ambiguous or empty titles fall through
    # to synthesis. Title-lane C-IDs land in `textra` (emitted as the tcid[]
    # 8th element) so the consumer can render them "≈ verify" — an inferred
    # code-to-course mapping, never presented as COCI-grade alignment.
    title_idx = {}
    for name in colleges:
        d = {}
        for c in coursedicts[name]:
            t = norm_title(c["title"])
            if t:
                d.setdefault(t, []).append(c)
        title_idx[name] = d
    for rec in approvals:
        if "lane" in rec:
            continue
        cands = title_idx.get(rec["college"], {}).get(norm_title(rec["title"]), [])
        targets = {(c["subj"], c["num"]) for c in cands}
        if len(targets) == 1:
            for c in cands:
                c["textra"] |= rec["cids"]
            consume(rec, "title")

    # ---- lane e: SYNTHESIZE a flagged row for every approval still unattached —
    # the college holds the C-ID per c-id.net but our COCI extract has no course
    # row to hang it on (CCN-transition inactivations, extract staleness). Units
    # unknown → null; consumer badges "per c-id.net — verify".
    for rec in approvals:
        if "lane" in rec:
            continue
        consume(rec, "synth")
        if rec["college"] not in coursedicts:
            continue  # unreconciled college (none today; ingestion reconciles)
        coursedicts[rec["college"]].append({
            "subj": rec["subj"], "num": rec["num"], "title": rec["title"],
            "units": None, "coci": [], "extra": set(rec["cids"]), "textra": set(),
            "synth": True,
        })

    # ---- materialize the compact arrays ---------------------------------------
    def natkey(c):
        m = re.match(r"(\d+)", c["num"] or "")
        numv = int(m.group(1)) if m else 0
        return (c["subj"], numv, c["num"], c["title"])

    courses = {}
    cid_courses = 0          # COCI courses with ≥1 C-ID (union)
    total = 0                # COCI courses (synth rows counted separately)
    cidnet_only = 0          # COCI courses whose ONLY C-ID(s) came from c-id.net
    multi_cid = 0            # COCI courses carrying ≥2 C-IDs
    cidnet_added = 0         # COCI courses that gained ≥1 C-ID from c-id.net
    synth_rows = 0
    title_cid_rows = 0       # COCI courses carrying ≥1 title-lane (tcid) C-ID
    for name in colleges:
        arr = []
        for c in sorted(coursedicts[name], key=natkey):
            hard_cids = set(c["extra"]) | set(c["coci"])   # COCI + exact/zero/squash lanes
            tcids = sorted(set(c["textra"]) - hard_cids)   # title-lane only (verify tier)
            all_cids = hard_cids | set(tcids)
            if c["synth"]:
                primary = sorted(all_cids)[0]
                xcids = sorted(all_cids - {primary})
                arr.append([c["subj"], c["num"], c["title"], None, primary, xcids, 1])
                synth_rows += 1
                continue
            total += 1
            if not all_cids:
                arr.append([c["subj"], c["num"], c["title"], c["units"], None])
                continue
            # primary (display) C-ID: keep COCI's FIRST-LISTED when present (its
            # own report), else the lexically-first HARD c-id.net one; a course
            # whose only C-IDs are title-lane keeps a null primary (tcid[] is
            # its own verify tier — never promoted to the display slot)
            primary = (c["coci"][0] if c["coci"]
                       else (sorted(hard_cids)[0] if hard_cids else None))
            xcids = sorted(hard_cids - {primary}) if primary else []
            if tcids:
                row = [c["subj"], c["num"], c["title"], c["units"], primary, xcids, 0, tcids]
                title_cid_rows += 1
            elif xcids:
                row = [c["subj"], c["num"], c["title"], c["units"], primary, xcids]
            else:
                row = [c["subj"], c["num"], c["title"], c["units"], primary]
            arr.append(row)
            cid_courses += 1
            if not c["coci"]:
                cidnet_only += 1
            if len(all_cids) >= 2:
                multi_cid += 1
            if all_cids - set(c["coci"]):
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
                "(comma-joined values split) and the official c-id.net "
                "approved-courses authority (cid_articulations.json), joined via "
                "a ladder: exact (college,subject,number) → zero-normalized "
                "number → squashed full code → unique-title → SYNTHESIZED row "
                "(7th element 1: approval is real per c-id.net but the course "
                "has no COCI row; units unknown — consumer badges 'verify'). "
                "cid = primary/display C-ID (normalized to the "
                "kb/reference/cid_descriptors.json key); optional 6th element "
                "xcid[] carries ADDITIONAL C-IDs, so a course can auto-match >1 "
                "slot. STATIC artifact — rebuild only on a fresh COCI or "
                "c-id.net extract."
            ),
            "rows_read": n,
            "colleges": len(colleges),
            "courses": total,
            "courses_with_cid": cid_courses,
            "courses_cid_from_cidnet_only": cidnet_only,
            "courses_multi_cid": multi_cid,
            "courses_gained_cid_from_cidnet": cidnet_added,
            "cid_articulations_sequence_rows_skipped": n_seq,
            "cidnet_join_lanes": {
                "_note": ("c-id.net approvals (merged by college+subject+number) "
                          "by the join lane that landed them; 'title' lands as the "
                          "verify-tier tcid[] 8th element; 'synth' = flagged "
                          "synthesized rows (course absent from the COCI extract)."),
                **lane_counts,
            },
            "synth_rows": synth_rows,
            "title_cid_rows": title_cid_rows,
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
    print(f"  c-id.net lanes: {lane_counts} | synth_rows={synth_rows}")
    print(f"  gained_cid={cidnet_added} cidnet_only={cidnet_only} "
          f"multi_cid={multi_cid} seq_skipped={n_seq}")


if __name__ == "__main__":
    main()
