#!/usr/bin/env python3
"""Build the cross-college course-title → TOP consensus for the CIP Codes tab.

TOP codes are faculty-entered per college with no data-entry gatekeeper (see the §7
TOP caveat), so any ONE college's TOP is an unreliable basis for a CIP recommendation.
But the CROWD is a rich corroborating signal: across all ~114 colleges, how do peers
teaching the *same course title* code it? If 60 of 69 colleges code "Human Biology"
under a Biology-General TOP and one college used Zoology, the consensus points cleanly
at the right field — the two-signals-agree gate applied to the TOP itself.

We do NOT use this to "correct" the (soon-abandoned) TOP; we harvest the agreement to
strengthen the CIP recommendation. The consumer maps the consensus TOP → its official
crosswalk CIP and offers it as a corroborated candidate, with an honest strength metric
("60 use, 9 differ" — which also surfaces small samples so a thin consensus reads as thin).

Output (fetched on demand by cip_crosswalk.js):
  course_top_consensus.json — { "_built_by", "_n_titles",
                                "colleges": ["<name>", ...], "subjects": ["<SUBJ>", ...],
                                "titles": { "<normalized title>": {n, t:[[top,[cIdx,...],[sIdx,...]],...]} } }
    n = distinct colleges offering the title; each t entry is [topCode, [collegeIdx...],
    [subjectIdx...]] with the two index lists PARALLEL (college i uses subject i) — into the
    interned `colleges` / `subjects` arrays. That lets the consumer both show WHO differs on
    hover AND compute a SUBJECT-SCOPED consensus (same-discipline peers only). The per-TOP
    college count is the list length. TOPs sorted desc by count, top 6 kept. Only titles
    offered by >= MIN_COLLEGES distinct colleges are kept.

Source: kb/reference/coci_course_list.xlsx (the COCI course inventory — same source as
_build_cip_fitcheck.py; uses ALL courses, not only those with a catalog description).
Rebuild: python kb/_build_course_top_consensus.py
"""
import json
import os
import re
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SRC = os.path.join(HERE, "reference", "coci_course_list.xlsx")
OUT = os.path.join(REPO, "course_top_consensus.json")

MIN_COLLEGES = 4   # a title needs >=4 distinct colleges before its consensus is worth showing
TOP_KEEP = 6       # keep the top-N TOP codes per title


def clean(v):
    return "" if v is None else str(v).strip()


def norm_title(t):
    """Normalize a course title for cross-college matching. MUST match the consumer's
    normalization (cip_crosswalk.js consensusKey): lowercase, drop non-alphanumerics
    (keep spaces), collapse whitespace."""
    t = (t or "").lower()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def main():
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    it = wb.active.iter_rows(values_only=True)
    hdr = {h: i for i, h in enumerate(next(it))}
    ci_col, ci_title, ci_top = hdr.get("College"), hdr.get("CourseTitle"), hdr.get("TopCode")
    ci_subj = hdr.get("Subject")

    # normTitle -> { top -> { college -> subject } }
    # We carry the local SUBJECT code (BIO / BIOL / HEED / …) per college so the consumer
    # can compute a SUBJECT-SCOPED consensus. A title-only consensus pools a course across
    # every department that happens to use the same words: "Health Science" is a HEALTH
    # course at most colleges (TOP Health Education) but a BIOLOGY course at a few (TOP Other
    # Bio Sci). The global modal (Health) then wrongly overrides a Biology college's coding.
    # Scoping to same-subject peers (BIO/BIOL/…) fixes that — the two-signals-agree gate
    # applied within the discipline, not across all of them.
    agg = {}
    rows = 0
    for r in it:
        col = clean(r[ci_col]) if ci_col is not None else ""
        title = clean(r[ci_title]) if ci_title is not None else ""
        top = clean(r[ci_top]).split(":", 1)[0].strip() if ci_top is not None else ""
        subj = clean(r[ci_subj]) if ci_subj is not None else ""
        if not col or not title or not re.match(r"^\d{4}\.\d{2}$", top):
            continue
        nt = norm_title(title)
        if not nt:
            continue
        # first (title, top, college) occurrence's subject wins — stable + rare to differ
        agg.setdefault(nt, {}).setdefault(top, {}).setdefault(col, subj)
        rows += 1

    # intern college names + subject codes so the per-TOP lists are compact integer indices
    col_ids, subj_ids = {}, {}

    def cid(name):
        return col_ids.setdefault(name, len(col_ids))

    def sid(subj):
        return subj_ids.setdefault(subj, len(subj_ids))

    titles = {}
    for nt, tops in agg.items():
        colleges = set()
        for coldict in tops.values():
            colleges |= set(coldict)
        n = len(colleges)
        if n < MIN_COLLEGES:
            continue
        ranked = sorted(tops.items(), key=lambda kv: (-len(kv[1]), kv[0]))[:TOP_KEEP]
        t = []
        for top, coldict in ranked:
            cols = sorted(coldict)  # deterministic order; college idx + subject idx run parallel
            t.append([top, [cid(c) for c in cols], [sid(coldict[c]) for c in cols]])
        titles[nt] = {"n": n, "t": t}

    college_names = [None] * len(col_ids)
    for name, i in col_ids.items():
        college_names[i] = name
    subject_codes = [None] * len(subj_ids)
    for s, i in subj_ids.items():
        subject_codes[i] = s

    out = {
        "_built_by": "kb/_build_course_top_consensus.py",
        "_source": "CCCCO COCI course inventory (coci_course_list.xlsx)",
        "_note": "Cross-college course-title -> TOP consensus. Each title's t entries are "
                 "[topCode, [collegeIdx...], [subjectIdx...]] with the two index lists PARALLEL "
                 "(college i uses subject i). Indices point into `colleges` / `subjects`. The "
                 "subject list lets the consumer scope the consensus to same-discipline peers.",
        "_rows": rows,
        "_n_titles": len(titles),
        "colleges": college_names,
        "subjects": subject_codes,
        "titles": titles,
    }
    with open(OUT, "w") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    print("courses scanned:", rows, "| titles kept (>=%d colleges):" % MIN_COLLEGES, len(titles))
    print("distinct colleges:", len(col_ids), "| distinct subjects:", len(subj_ids))
    print("wrote", OUT, "(%.1f KB)" % (os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    main()
