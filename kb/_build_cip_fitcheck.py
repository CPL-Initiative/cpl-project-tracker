#!/usr/bin/env python3
"""Build the per-college course data for the CIP Codes tab's "Check a course" flow.

The inline fit-check lets faculty pick their college + a local course (from COCI)
while viewing a CIP code; the tab then scores the course's catalog description
against that CIP's official definition. To keep the browser light, the course
data is split PER COLLEGE and lazy-fetched only for the selected college.

Outputs (served by GitHub Pages, fetched on demand by cip_crosswalk.js):
  cip_fitcheck/<slug>.json     — one per college: [[label, desc, top6, credit], ...]
                                 (courses WITH a catalog description, deduped by
                                  label keeping the longest description, label-sorted)
                                 credit = a compact credit/CDCP flag from COCI's
                                 CreditType, gating the CIP-count rule (COCI: a
                                 credit course takes 1 CIP; noncredit takes 1 unless
                                 it is CDCP — Career Development & College Preparation,
                                 the enhanced-funding "Special Populations" categories —
                                 which may take up to 2):
                                   "C" credit · "D" noncredit CDCP (enhanced funding)
                                   · "N" noncredit non-CDCP · "" unknown/blank
                                 CDCP is a COURSE-level property (independent of any
                                 program's CDCP tag): a course inside a CDCP program can
                                 itself be non-enhanced-funding.
  cip_fitcheck_colleges.json   — [{name, slug, n}]  (committed, tiny; fetched on tab open)

Source: kb/reference/coci_course_list.xlsx (the COCI course inventory).
Rebuild: python kb/_build_cip_fitcheck.py
"""
import json
import os
import re
import unicodedata
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SRC = os.path.join(HERE, "reference", "coci_course_list.xlsx")
OUT_DIR = os.path.join(REPO, "cip_fitcheck")
COLLEGES_OUT = os.path.join(REPO, "cip_fitcheck_colleges.json")
DESC_CAP = 400   # cap long catalog descriptions (median ~377; keeps most whole, trims outliers)


# Text that was UTF-8 but got decoded as Latin-1 somewhere upstream shows up as mojibake
# ("CaÃ±ada" for "Cañada"). Repair only strings carrying the tell-tale bytes, via a Latin-1 → UTF-8
# round-trip; a clean round-trip that removes the marker wins (idempotent on already-correct text).
_MOJIBAKE_RE = re.compile("[\u00c2\u00c3\u00e2][\u0080-\u00bf]")


def _demojibake(s):
    for _ in range(3):
        if not s or not _MOJIBAKE_RE.search(s):
            break
        try:
            fixed = s.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        if fixed == s:
            break
        s = fixed
    return s


def clean(v):
    return _demojibake("" if v is None else str(v).strip())


def credit_flag(ct):
    """COCI CreditType -> a compact credit/CDCP flag (see module docstring).

    CDCP (Career Development & College Preparation) noncredit courses receive
    *enhanced funding* (the "Special Populations" apportionment rate) and are the
    only courses permitted up to 2 CIP codes; every other course takes 1. The
    enhanced-funding designation IS the course-level CDCP marker — check
    "Non-Enhanced" BEFORE "Enhanced Funding" (the former contains the latter as a
    substring).
    """
    ct = clean(ct)
    if not ct:
        return ""
    if ct == "Credit Course":
        return "C"
    if "Non-Enhanced" in ct:
        return "N"          # noncredit, NOT CDCP
    if "Enhanced Funding" in ct:
        return "D"          # noncredit CDCP (Other Noncredit / Workforce Prep Enhanced Funding)
    return ""


def slugify(name):
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_").lower()
    return s or "college"


def main():
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    it = wb.active.iter_rows(values_only=True)
    hdr = {h: i for i, h in enumerate(next(it))}
    ci_col, ci_title = hdr.get("College"), hdr.get("CourseTitle")
    ci_desc, ci_top = hdr.get("CatalogDescription"), hdr.get("TopCode")
    ci_subj, ci_num = hdr.get("Subject"), hdr.get("Course_Number")
    ci_credit = hdr.get("CreditType")

    # college -> { norm_title -> [title, desc, top, credit] }  (dedupe by title, keep longest desc)
    colleges = {}
    for r in it:
        col = clean(r[ci_col])
        desc = clean(r[ci_desc]) if ci_desc is not None else ""
        title = clean(r[ci_title]) if ci_title is not None else ""
        if not col or not desc or not title:
            continue
        top = clean(r[ci_top]).split(":", 1)[0].strip() if ci_top is not None else ""
        cflag = credit_flag(r[ci_credit]) if ci_credit is not None else ""
        # prefix the subject+number so faculty recognise the course in the picker
        subj = clean(r[ci_subj]) if ci_subj is not None else ""
        num = clean(r[ci_num]) if ci_num is not None else ""
        label = ((subj + " " + num).strip() + " — " + title).strip(" —") if (subj or num) else title
        if len(desc) > DESC_CAP:
            desc = desc[:DESC_CAP].rsplit(" ", 1)[0] + "…"
        key = re.sub(r"\s+", " ", label).lower()
        bucket = colleges.setdefault(col, {})
        prev = bucket.get(key)
        if prev is None:
            bucket[key] = [label, desc, top, cflag]
        elif len(desc) > len(prev[1]):
            bucket[key] = [label, desc, top, cflag or prev[3]]   # keep a known flag when the new row's is blank
        elif not prev[3] and cflag:
            prev[3] = cflag   # shorter desc but fills in a missing credit flag

    if os.path.isdir(OUT_DIR):
        for f in os.listdir(OUT_DIR):
            if f.endswith(".json"):
                os.remove(os.path.join(OUT_DIR, f))
    os.makedirs(OUT_DIR, exist_ok=True)

    manifest, total_bytes, slugs = [], 0, {}
    from collections import Counter as _Counter
    flag_dist = _Counter()
    for name in sorted(colleges):
        courses = sorted(colleges[name].values(), key=lambda c: c[0].lower())
        for c in courses:
            flag_dist[c[3] or "(blank)"] += 1
        # drop a trailing blank credit flag so unknown-credit courses stay lean 3-tuples
        courses = [c[:3] if not c[3] else c for c in courses]
        slug = slugify(name)
        while slug in slugs and slugs[slug] != name:   # guard against slug collision
            slug += "_x"
        slugs[slug] = name
        body = json.dumps(courses, ensure_ascii=False, separators=(",", ":"))
        path = os.path.join(OUT_DIR, slug + ".json")
        with open(path, "w", encoding="utf-8") as f:
            f.write(body)
        total_bytes += len(body.encode("utf-8"))
        manifest.append({"name": name, "slug": slug, "n": len(courses)})

    with open(COLLEGES_OUT, "w", encoding="utf-8") as f:
        f.write(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")))

    print(f"colleges:        {len(manifest)}")
    print(f"total courses:   {sum(m['n'] for m in manifest)}")
    print(f"credit flags:    C(credit)={flag_dist['C']}  D(CDCP)={flag_dist['D']}  "
          f"N(noncredit)={flag_dist['N']}  blank={flag_dist['(blank)']}")
    print(f"per-college json total: {total_bytes/1024/1024:.1f} MB  ({len(manifest)} files)")
    print(f"largest file:    {max(os.path.getsize(os.path.join(OUT_DIR, m['slug']+'.json')) for m in manifest)/1024:.0f} KB")
    print(f"Wrote {OUT_DIR}/  + {COLLEGES_OUT}")


if __name__ == "__main__":
    main()
