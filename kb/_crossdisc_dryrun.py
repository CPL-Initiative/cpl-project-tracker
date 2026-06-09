"""
DRY-RUN (read-only) — Cross-disciplinary shared-COR course classifier + impact.

Scopes the re-mint described in docs/research_workexp_crossdisc_remint_scope.md.
Mutates NOTHING live; writes a reviewable manifest to kb/crossdisc_dryrun/.

The "shared-COR" course types (Undergraduate Research Experience, Cooperative/
Occupational Work Experience, Independent Study, …) use ONE course outline of
record cross-listed under many subject codes at a college so a student earns
credit in their degree's discipline. kb/_seed_coci_minted_mids.py's STOP_PATTERNS
excludes most of them as "administrative shells", so they're invisible to the
identity layer. This measures what's really out there, per type:
  - raw COCI footprint (rows, colleges, subjects, TOP-division spread)
  - the intra-college cross-listing signal (same college+title, >=2 subjects)
  - which existing minted M-IDs/singletons would fold into a canonical identity
  - resolved articulations whose earning local course is a shared-COR shell
Run from repo root:  python3 kb/_crossdisc_dryrun.py
"""
import json, os, re
from collections import defaultdict, Counter
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "reference", "coci_course_list.xlsx")
OUT_DIR = os.path.join(HERE, "crossdisc_dryrun")

# Shell course types -> title regex. Research + Work Experience are Sam's primary
# targets; the rest are shown for context (fast-follows on the same engine).
SHELL_TYPES = {
    "research":            r"(undergraduate research|research experience|directed research|independent research|collaborative research)",
    "work_experience":     r"(work experience|cooperative (work )?(education|experience)|occupational work|work[- ]based learning|\bcwee\b)",
    "independent_study":   r"(independent study|directed study|directed studies|special projects?)",
    "internship":          r"(internship|\bintern\b)",
    "supervised_tutoring": r"(supervised tutoring)",
}
SHELL_RE = {k: re.compile(v, re.I) for k, v in SHELL_TYPES.items()}
PRIMARY = ("research", "work_experience")
norm = lambda s: re.sub(r"\s+", " ", str(s or "").strip().lower())


def classify(title):
    t = str(title or "")
    for k in SHELL_TYPES:                      # priority order = dict order
        if SHELL_RE[k].search(t):
            return k
    return None


def load_json(p):
    try:
        return json.load(open(p, encoding="utf-8"))
    except Exception:
        return None


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # ── 1. Stream raw COCI: footprint per shell-type + intra-college cross-listing
    wb = openpyxl.load_workbook(RAW, read_only=True, data_only=True)
    ws = wb.active
    it = ws.iter_rows(values_only=True)
    hdr = [str(h).strip() if h else "" for h in next(it)]
    ix = {h: i for i, h in enumerate(hdr)}
    def cell(r, name):
        i = ix.get(name)
        return r[i] if (i is not None and i < len(r)) else None

    per = {k: {"rows": 0, "colleges": set(), "subjects": Counter(),
               "top2": Counter(), "titles": Counter(),
               "xlist_college_instances": 0} for k in SHELL_TYPES}
    # (college, type, norm_title) -> set(subjects)  → the intra-college cross-list signal
    xlist = defaultdict(set)
    n = 0
    for r in it:
        n += 1
        title = cell(r, "CourseTitle")
        k = classify(title)
        if not k:
            continue
        col = str(cell(r, "College") or "").strip()
        subj = str(cell(r, "Subject") or "").strip()
        top = str(cell(r, "TopCode") or "").strip()
        per[k]["rows"] += 1
        if col: per[k]["colleges"].add(col)
        if subj: per[k]["subjects"][subj] += 1
        if top: per[k]["top2"][top[:2]] += 1
        per[k]["titles"][norm(title)] += 1
        if col and subj:
            xlist[(col, k, norm(title))].add(subj)
    wb.close()

    # count intra-college cross-list instances (a college lists one title under >=2 subjects)
    for (col, k, t), subs in xlist.items():
        if len(subs) >= 2:
            per[k]["xlist_college_instances"] += 1

    # ── 2. Existing minted fragments that would fold (the ones that DID mint)
    mc = (load_json(os.path.join(HERE, "coci_minted_courses.json")) or {}).get("courses", {})
    sg = (load_json(os.path.join(HERE, "coci_minted_singletons.json")) or {}).get("courses", {})
    frags = {k: {"corroborated": [], "singletons": []} for k in SHELL_TYPES}
    for cid, rec in mc.items():
        k = classify(rec.get("common_title"))
        if k: frags[k]["corroborated"].append((cid, rec.get("subject_4letter"), rec.get("subject_spread"), rec.get("common_title")))
    for cid, rec in sg.items():
        k = classify(rec.get("common_title") or rec.get("title"))
        if k: frags[k]["singletons"].append((cid, rec.get("subject_4letter"), rec.get("common_title") or rec.get("title")))

    # ── 3. Resolved articulations whose earning local course is a shell (impact proxy)
    art = load_json(os.path.join(HERE, "coci_articulations.json")) or {}
    art_hits = {k: 0 for k in SHELL_TYPES}
    art_records = art.get("articulations", []) if isinstance(art, dict) else []
    for g in art_records:
        for lc in (g.get("local_courses") or []):
            k = classify(lc.get("title"))
            if k:
                art_hits[k] += 1
                break

    # ── 4. Summary + manifest
    print(f"rows scanned: {n:,}\n")
    manifest = {"_status": "DRY-RUN (read-only) — no live mutation",
                "_scope_doc": "docs/research_workexp_crossdisc_remint_scope.md",
                "raw_rows_scanned": n, "types": {}}
    for k in SHELL_TYPES:
        p = per[k]; f = frags[k]
        tag = "PRIMARY" if k in PRIMARY else "context"
        print(f"── {k}  [{tag}] ──")
        print(f"   raw COCI rows: {p['rows']:,} | colleges: {len(p['colleges'])} | distinct subjects: {len(p['subjects'])}")
        print(f"   intra-college cross-list instances (>=2 subjects): {p['xlist_college_instances']}")
        print(f"   TOP-division spread (2-digit): {len(p['top2'])} divisions  top={dict(p['top2'].most_common(6))}")
        print(f"   top subjects: {dict(p['subjects'].most_common(8))}")
        print(f"   existing minted fragments to fold: {len(f['corroborated'])} corroborated + {len(f['singletons'])} singletons")
        for cid, s4, spread, t in f["corroborated"][:4]:
            print(f"       corroborated {cid} (SUBJ4 {s4}, spread {spread})  {str(t)[:42]}")
        print(f"   resolved articulations with a shell local course: {art_hits[k]}")
        print()
        manifest["types"][k] = {
            "tag": tag, "raw_rows": p["rows"], "colleges": len(p["colleges"]),
            "distinct_subjects": len(p["subjects"]),
            "intra_college_crosslist_instances": p["xlist_college_instances"],
            "top2_divisions": len(p["top2"]),
            "top_subjects": dict(p["subjects"].most_common(15)),
            "top_titles": dict(p["titles"].most_common(15)),
            "fragments_corroborated": [c for c, *_ in f["corroborated"]],
            "fragments_singletons": [c for c, *_ in f["singletons"]],
            "articulations_with_shell_local_course": art_hits[k],
        }
    prim_rows = sum(per[k]["rows"] for k in PRIMARY)
    prim_frag = sum(len(frags[k]["corroborated"]) + len(frags[k]["singletons"]) for k in PRIMARY)
    print(f"PRIMARY (research + work_experience): {prim_rows:,} raw rows, {prim_frag} existing fragments to fold.")
    out = os.path.join(OUT_DIR, "manifest.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False); fh.write("\n")
    print(f"\nwrote {out}")


if __name__ == "__main__":
    main()
