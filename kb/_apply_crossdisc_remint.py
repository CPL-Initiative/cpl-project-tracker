"""
APPLY (preview) — Cross-disciplinary shared-COR course re-mint.

Implements docs/research_workexp_crossdisc_remint_scope.md for the two PRIMARY
types (research + work_experience). Writes PREVIEW files to kb/crossdisc_out/
(promoted to live in a second step after validation); mutates NOTHING live here.

Per the Rule-7 playbook (docs/coursecontrolnumber_remint.md): produces an
old->new alias map (the receipt + rollback inverse), re-keys the minted identity
layer, and validates. Member join is EXACT by control_number (excel_to_dashboard
line ~6264), so members are carried with their CourseControlNumber and NO title
filter applies. coci_articulations.json is untouched (research has 0 records;
work_experience is net-new) — verified by the dry-run.

  research          -> RSCH M1001  (folds MATH M1262 + 17 research singletons)
  work_experience   -> WKEX M1001  (net-new; 0 minted fragments today)

Each canonical identity is cross_disciplinary=true (auditor exempts it from the
over-merge / member_top_divergence flags) with discipline "Interdisciplinary
Studies" + a cross_listed_disciplines curation entry spanning the member
disciplines (the existing xdisc mechanism — generator line ~5945).

Run from repo root:  python3 kb/_apply_crossdisc_remint.py
"""
import json, os, re
from collections import Counter, defaultdict
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "reference", "coci_course_list.xlsx")
OUT_DIR = os.path.join(HERE, "crossdisc_out")
TODAY = "2026-06-09"
STAMP = "crossdisc-remint (session 36)"

# type -> (title regex, canonical id, canonical SUBJ4, common_title, description)
TYPES = {
    "research": {
        "re": re.compile(r"(undergraduate research|research experience|directed research|independent research|collaborative research)", re.I),
        "id": "RSCH M1001", "subj4": "RSCH",
        "title": "Undergraduate Research Experience",
        "desc": ("Under the supervision of discipline faculty, students design and complete a "
                 "research project: information retrieval, research methods, experimental design, "
                 "data collection and analysis, and written/oral presentation. Offered across "
                 "disciplines under one course outline of record; students earn credit under the "
                 "subject that applies to their degree pathway."),
    },
    "work_experience": {
        "re": re.compile(r"(work experience|cooperative (work )?(education|experience)|occupational work|work[- ]based learning|\bcwee\b)", re.I),
        "id": "WKEX M1001", "subj4": "WKEX",
        "title": "Work Experience Education",
        "desc": ("Supervised employment-based learning that extends classroom study into the "
                 "workplace (Title 5 Cooperative Work Experience Education). Offered across "
                 "disciplines under one course outline of record; students earn credit under the "
                 "subject that applies to their degree pathway."),
    },
}
norm = lambda s: re.sub(r"\s+", " ", str(s or "").strip().lower())


def classify(title):
    t = str(title or "")
    for k, v in TYPES.items():
        if v["re"].search(t):
            return k
    return None


def credit_status(creditype, units):
    c = str(creditype or "").strip().lower()
    if c == "credit course":
        return "Credit"
    if c in ("other noncredit enhanced funding", "workforce preparation enhanced funding"):
        return "Noncredit Enhanced"
    if c == "non-enhanced funding":
        return "Noncredit"
    try:
        return "Credit" if float(units or 0) > 0 else "Noncredit"
    except Exception:
        return "Noncredit"


def load(p):
    return json.load(open(p, encoding="utf-8"))


def modal(counter):
    return counter.most_common(1)[0][0] if counter else None


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    topdisc = load(os.path.join(HERE, "top_discipline_map.json"))
    topdisc = topdisc.get("map", topdisc) if isinstance(topdisc, dict) else {}
    subjdisc = load(os.path.join(HERE, "reference", "subject_discipline_map.json"))
    subjdisc = subjdisc.get("map", subjdisc) if isinstance(subjdisc, dict) else {}

    # ── collect members from the raw COCI list (exact control-number join) ──
    wb = openpyxl.load_workbook(RAW, read_only=True, data_only=True)
    ws = wb.active
    it = ws.iter_rows(values_only=True)
    hdr = [str(h).strip() if h else "" for h in next(it)]
    ix = {h: i for i, h in enumerate(hdr)}
    def C(r, name):
        i = ix.get(name)
        return r[i] if (i is not None and i < len(r)) else None

    members = {k: [] for k in TYPES}
    agg = {k: {"subjects": set(), "colleges": set(), "units": Counter(),
               "credit": Counter(), "top": Counter(), "disc": Counter(),
               "desc": None} for k in TYPES}
    seen_cn = {k: set() for k in TYPES}
    for r in it:
        k = classify(C(r, "CourseTitle"))
        if not k:
            continue
        cn = str(C(r, "CourseControlNumber") or "").strip()
        if not cn or cn in seen_cn[k]:
            continue
        seen_cn[k].add(cn)
        col = str(C(r, "College") or "").strip()
        subj = str(C(r, "Subject") or "").strip()
        num = str(C(r, "Course_Number") or "").strip()
        units = C(r, "UnitValue")
        cs = credit_status(C(r, "CreditType"), units)
        top = str(C(r, "TopCode") or "").strip()       # raw format is "CODE: Title"
        code = top.split(":")[0].strip()
        members[k].append({"college": col, "control_number": cn, "subject": subj,
                           "course_number": num, "units": units, "credit_status": cs,
                           "top_code": top})
        a = agg[k]
        if subj: a["subjects"].add(subj)
        if col: a["colleges"].add(col)
        if units is not None: a["units"][units] += 1
        a["credit"][cs] += 1
        if code:
            a["top"][code] += 1
            d = topdisc.get(code)
            if d: a["disc"][d] += 1
        sd = subjdisc.get(subj)            # union subject-based discipline (covers general-science codes the TOP map omits)
        if sd: a["disc"][sd] += 1
        desc = C(r, "CatalogDescription")
        if desc and (a["desc"] is None or len(str(desc)) > len(a["desc"])):
            a["desc"] = str(desc)[:1200]
    wb.close()

    # ── mint canonical identity records + memberships ──
    new_courses, new_members = {}, {}
    for k, spec in TYPES.items():
        a, mid = agg[k], spec["id"]
        units_modal = modal(a["units"])
        cs_modal = modal(a["credit"])
        top_modal = modal(a["top"])
        disciplines = sorted(a["disc"])
        new_courses[mid] = {
            "course_id": mid, "id_system": "M-ID", "ccn_id": None, "c_id": None,
            "common_title": spec["title"], "common_title_source": "crossdisc re-mint (canonical)",
            "description": spec["desc"], "description_source": "crossdisc re-mint (synthesized)",
            "subject": spec["subj4"], "subject_4letter": spec["subj4"],
            "discipline": "Interdisciplinary Studies", "discipline_provisional": None,
            "typical_units": units_modal, "confidence": 0.6,
            "corroboration_members": len(members[k]), "subject_spread": len(a["subjects"]),
            "source_college_count": len(a["colleges"]),
            "classified_at": TODAY, "classified_by": STAMP, "reviewed_at": None, "reviewed_by": None,
            "_notes": ("cross-disciplinary shared-COR course: one outline of record cross-listed "
                       "under many subjects so students earn credit in their degree's discipline. "
                       "Over-merge / TOP-divergence flags are EXPECTED here (auditor-exempt)."),
            "credit_status": cs_modal, "credit_status_mixed": len(a["credit"]) > 1,
            "top_code": top_modal, "noncredit_category": None,
            "top_code_mixed": len(a["top"]) > 1,
            "top_code_distribution": dict(a["top"].most_common(12)),
            "noncredit_category_mixed": False, "noncredit_category_distribution": None,
            "discipline_source": "crossdisc_remint", "discipline_confidence": 0.6,
            "discipline_inferred_at": TODAY, "_remint_from": None, "cte": None,
            "cross_disciplinary": True,
            # Carried on the minted record (NOT curation) so the daily cron — which
            # rebuilds coci_curation.json from Supabase via _apply_curation.py —
            # can't clobber it. The generator's xdisc_of() falls back to here.
            "cross_listed_disciplines": ", ".join(disciplines),
        }
        new_members[mid] = members[k]
        print(f"{mid}: {len(members[k])} members, {len(a['colleges'])} colleges, "
              f"{len(a['subjects'])} subjects, {len(disciplines)} disciplines, "
              f"units~{units_modal}, credit~{cs_modal}")

    # ── alias the research fragments (MATH M1262 + 17 research singletons) ──
    cc = load(os.path.join(HERE, "coci_minted_courses.json"))
    sg = load(os.path.join(HERE, "coci_minted_singletons.json"))
    courses, singles = cc["courses"], sg["courses"]
    RES = TYPES["research"]["re"]
    alias = {}
    # Idempotency guard: never treat a canonical identity (RSCH/WKEX) or any
    # already-cross_disciplinary record as a fragment to fold — else a re-run
    # would self-alias RSCH M1001 (its title matches the research regex).
    CANON = {t["id"] for t in TYPES.values()}
    def _is_frag(cid, r):
        return cid not in CANON and not r.get("cross_disciplinary")
    frag_corro = [cid for cid, r in courses.items()
                  if RES.search(str(r.get("common_title") or "")) and _is_frag(cid, r)]
    frag_sing = [cid for cid, r in singles.items()
                 if RES.search(str(r.get("common_title") or r.get("title") or "")) and _is_frag(cid, r)]
    for cid in frag_corro + frag_sing:
        alias[cid] = "RSCH M1001"

    print(f"\nalias (research fragments -> RSCH M1001): {len(alias)} "
          f"({len(frag_corro)} corroborated {frag_corro}, {len(frag_sing)} singletons)")

    # ── write PREVIEW mutated files ──
    out_courses = {c: r for c, r in courses.items() if c not in alias}
    out_courses.update(new_courses)
    cc_new = dict(cc); cc_new["courses"] = out_courses
    cc_new["count"] = len(out_courses)
    cc_new["_crossdisc_remint_at"] = TODAY

    mem = load(os.path.join(HERE, "coci_minted_memberships.json"))
    out_mem = {c: m for c, m in mem["memberships"].items() if c not in alias}
    out_mem.update(new_members)
    mem_new = dict(mem); mem_new["memberships"] = out_mem
    mem_new["count"] = len(out_mem)
    mem_new["member_courses_total"] = sum(len(v) for v in out_mem.values())
    mem_new["_crossdisc_remint_at"] = TODAY

    out_sing = {c: r for c, r in singles.items() if c not in alias}
    sg_new = dict(sg); sg_new["courses"] = out_sing
    sg_new["count"] = len(out_sing); sg_new["_crossdisc_remint_at"] = TODAY

    # NOTE: coci_curation.json is intentionally NOT touched — it's rebuilt from
    # Supabase by the daily _apply_curation.py, so any git-only edit here would be
    # clobbered. cross_listed_disciplines rides the minted record instead (above);
    # discipline "Interdisciplinary Studies" is also on the minted record (read as
    # the generator's `base`). The 18 aliased research fragments have 0 curation
    # refs today (verified) — if future fragments carry curation, re-key it in
    # Supabase per the playbook, not here.

    def dump(name, obj):
        # indent=2 + trailing newline reproduces the live files' exact format, so
        # landing the mutated files yields a minimal diff (only changed entries).
        with open(os.path.join(OUT_DIR, name), "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2); f.write("\n")

    dump("coci_minted_courses.json", cc_new)
    dump("coci_minted_memberships.json", mem_new)
    dump("coci_minted_singletons.json", sg_new)
    dump("alias_map.json", {"_status": "crossdisc re-mint old->new alias (receipt + rollback inverse)",
                            "_at": TODAY, "alias": alias})

    # ── validation gates ──
    print("\n── validation ──")
    v1 = all(len(new_members[t["id"]]) > 0 for t in TYPES.values())
    print(f"V1 every canonical identity has members: {v1}")
    collide = [m for m in new_courses if m in courses]
    print(f"V2 no id collision with existing courses: {not collide}  {collide}")
    leftover = [c for c in out_courses if RES.search(str(out_courses[c].get('common_title') or '')) and c != 'RSCH M1001']
    print(f"V3 no research fragment left in courses: {not leftover}  (leftover {len(leftover)})")
    leftover_s = [c for c in out_sing if RES.search(str(out_sing[c].get('common_title') or out_sing[c].get('title') or ''))]
    print(f"V3b no research singleton left: {not leftover_s}  (leftover {len(leftover_s)})")
    art = load(os.path.join(HERE, "coci_articulations.json"))
    touched = [g for g in art.get("articulations", []) if g.get("course_id") in alias]
    print(f"V4 articulation records pointing at aliased ids (expect 0): {len(touched)}")
    print(f"\ncourses {len(courses)} -> {len(out_courses)} | singletons {len(singles)} -> {len(out_sing)} "
          f"| memberships {len(mem['memberships'])} -> {len(out_mem)}")
    print(f"wrote preview to {OUT_DIR}/")


if __name__ == "__main__":
    main()
