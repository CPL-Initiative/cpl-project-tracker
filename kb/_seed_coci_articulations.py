"""
One-shot generator for the articulation crosswalk (STAGING):
  kb/coci_articulations.json

WHAT / WHY
MAP records earned CPL articulations in View_ArticulatedMAPExhibits: a college
(Articulation College) earned credit for an exhibit/credential on one of its
courses (Course, e.g. "AUTO 063A"). Each is siloed at the earning college. By
resolving the course to a shared identity (a C-ID/CCN, else an M-ID) we connect
it to every college teaching a like course, so an earned articulation becomes
visibly ADOPTABLE elsewhere. That cross-college adoption leverage is the payoff.

⛔ FIREWALL: this is STAGING and additive. It does NOT modify, merge into, or
reconcile the curated kb/common_courses.json / kb/course_crosswalk.json (a
permanent hand-reviewed anchor), nor the minted M-IDs / unified clusters. There
is no "Stage 2 / merge into curated" — that is out of scope, permanently.

RESOLUTION (all identity layers):
  Course -> (subject, number; leading zeros stripped) -> identity:
    - CID Number present on the row  -> C-ID/CCN (titled via reference/coci_courses.json)
    - else (subject, number) -> M-ID via the membership index.
  DISAMBIGUATION: when a (subject, number) maps to >1 M-ID (code reused across
  colleges for different courses), recover the local Course Title from
  View_CollegeCourses (College, Subject, Course Number, Course Title) and pick
  the M-ID whose consolidated title agrees (canonical match). Never blind
  first-match: if title doesn't pin exactly one, the row goes to title-mismatch.

CREDENTIAL LINK: Exhibit Title -> unified_title via unified_titles.json, carrying
its quality_flag (incl. suspect_course_as_exhibit); issuer from credentials.json.

FLAG PROPAGATION: each record surfaces the identity's confidence, subject_spread,
over_merged (subject_spread >= 8), and credit/top/noncredit *_mixed flags, so an
adoption suggestion off a flagged over-merged cluster is never silent — a false
merge yields a wrong adoption rec, worse than a gap.

ADOPTION LEVERAGE: colleges_offering for an identity = distinct colleges teaching
any member course (View_CollegeCourses). adoption_leverage for an earned exhibit
= colleges_offering minus the colleges that already earned it.

UNMATCHED is logged by reason (routed-to-C-ID / GE-area / subject-not-minted /
title-mismatch / unmatched-other) with counts, so coverage is auditable.

AI-assisted DRAFT for review. Reads CustomReport_latest.json from the repo root.
Run from repo root:  python3 kb/_seed_coci_articulations.py
"""
import json
import os
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CUSTOMREPORT = os.path.join(ROOT, "CustomReport_latest.json")
OUT = os.path.join(HERE, "coci_articulations.json")

GENERATED_AT = "2026-05-21"
GENERATED_BY = "claude-opus-4-7 (articulation crosswalk draft)"
OVER_MERGE_SPREAD = 8  # subject_spread >= this == flagged possible over-merge (matches minting)
# Sandbox/demo college — excluded from everything (not a real college).
EXCLUDE_COLLEGES = {"CA MAP INITIATIVE COLLEGE"}

GE_RE = re.compile(r"GETC|IGETC|\bGE\b|GE AREA|GE GROUP|^CSU|^UC\b|^LOCAL GE|^LACCD GE|^CPL$")
FILLER = {"to", "of", "the", "a", "an", "and", "for", "in", "with", "on", "at"}


def norm_num(num):
    s = re.sub(r"\s+", "", str(num)).upper()
    m = re.match(r"^0*(\d+)([A-Z]*)$", s)
    return m.group(1) + m.group(2) if m else s


def jkey(subj, num):
    return (re.sub(r"\s+", " ", str(subj)).strip().upper(), norm_num(num))


def canon(title):
    # normalized (case/punctuation/word-order/filler insensitive) so the local
    # title can agree with a consolidated title without being byte-identical.
    t = re.sub(r"[^a-z0-9 ]", " ", str(title).lower())
    return " ".join(sorted(w for w in t.split() if w not in FILLER))


def parse_course(course):
    c = re.sub(r"\s+", " ", str(course)).strip()
    if " " in c:
        subj, num = c.rsplit(" ", 1)
    else:
        m = re.match(r"^([A-Za-z ]+?)(\d.*)$", c)
        subj, num = (m.group(1), m.group(2)) if m else (c, "")
    return subj.strip().upper(), jkey(subj, num)


def ntitle(s):
    return re.sub(r"\s+", " ", str(s)).strip().lower()


def main():
    # ---- identity layer: M-IDs (catalog + singletons) ------------------------
    cat = json.load(open(os.path.join(HERE, "coci_minted_courses.json")))["courses"]
    mem = json.load(open(os.path.join(HERE, "coci_minted_memberships.json")))["memberships"]
    sg = json.load(open(os.path.join(HERE, "coci_minted_singletons.json")))["courses"]
    rev = defaultdict(set)      # (subject,num) -> {M-ID}
    mid_keys = defaultdict(set)  # M-ID -> {(subject,num)}
    mid_meta = {}               # M-ID -> flag dict
    subj_minted = set()

    def meta_from(v, is_singleton):
        return {
            "identity_system": "M-ID",
            "title": v["common_title"],
            "discipline": v.get("discipline"),
            "confidence": v.get("confidence"),
            "subject_spread": v.get("subject_spread", 1),
            "over_merged": (v.get("subject_spread", 1) or 1) >= OVER_MERGE_SPREAD,
            "is_singleton": is_singleton,
            "credit_status": v.get("credit_status"),
            "credit_status_mixed": bool(v.get("credit_status_mixed")),
            "top_code_mixed": bool(v.get("top_code_mixed")),
            "noncredit_category_mixed": bool(v.get("noncredit_category_mixed")),
        }

    for mid, v in cat.items():
        mid_meta[mid] = meta_from(v, False)
        subj_minted.add(str(v["subject"]).strip().upper())
        for m in mem.get(mid, []):
            k = jkey(m["subject"], m["course_number"]); rev[k].add(mid); mid_keys[mid].add(k)
    for mid, v in sg.items():
        mid_meta[mid] = meta_from(v, True)
        subj_minted.add(str(v["subject"]).strip().upper())
        k = jkey(v["subject"], v["course_number"]); rev[k].add(mid); mid_keys[mid].add(k)

    # ---- C-ID/CCN reference --------------------------------------------------
    cid_ref = {k: v for k, v in json.load(open(os.path.join(HERE, "reference", "coci_courses.json"))).items()
               if isinstance(v, dict) and v.get("id_system")}

    # ---- credential layer ----------------------------------------------------
    ut = json.load(open(os.path.join(HERE, "unified_titles.json")))
    ut_exact = {k: v for k, v in ut.items()}
    ut_norm = {ntitle(k): v for k, v in ut.items()}
    creds = json.load(open(os.path.join(HERE, "credentials.json")))

    def link_credential(ex_title):
        rec = ut_exact.get(ex_title) or ut_norm.get(ntitle(ex_title))
        if not rec:
            return None, None, None
        unified = rec["unified_title"]
        qflag = rec.get("quality_flag")
        issuer = None
        crecs = creds.get(unified)
        if crecs:
            issuer = max(crecs, key=lambda r: r.get("confidence_issuer") or 0).get("issuing_agency")
        return unified, issuer, qflag

    # ---- CustomReport: articulations + college coverage ----------------------
    by_view = {d["viewName"]: d for d in json.load(open(CUSTOMREPORT))}
    art = by_view["View_ArticulatedMAPExhibits_APIDataset"]
    aci = {c: i for i, c in enumerate(art["columnName"])}
    cc = by_view["View_CollegeCourses_APIDataset"]
    cci = {c: i for i, c in enumerate(cc["columnName"])}

    key_colleges = defaultdict(set)   # (subject,num) -> {college}
    cid_colleges = defaultdict(set)   # CID -> {college}
    local_title = {}                  # (college,(subject,num)) -> Course Title
    local_titles_by_key = defaultdict(set)
    for r in cc["columnValue"]:
        coll = str(r[cci["College"]]).strip()
        if coll.upper() in EXCLUDE_COLLEGES:
            continue
        k = jkey(r[cci["Subject"]], r[cci["Course Number"]])
        t = str(r[cci["Course Title"]]).strip()
        key_colleges[k].add(coll)
        local_title[(coll, k)] = t
        if t:
            local_titles_by_key[k].add(t)
        cidn = str(r[cci["CID Number"]]).strip()
        if cidn:
            cid_colleges[cidn].add(coll)

    def recover_local_title(coll, key):
        t = local_title.get((coll, key))
        if t:
            return t
        s = local_titles_by_key.get(key)
        return next(iter(s)) if s and len(s) == 1 else None

    # ---- resolve each articulation -------------------------------------------
    identities = {}        # course_id -> meta (+ colleges_offering filled later)
    groups = {}            # (course_id, exhibit_id) -> record accumulator
    res = Counter()
    n_disamb = n_title_mismatch = n_ambiguous_total = 0

    def ensure_identity(cid_id, meta):
        if cid_id not in identities:
            identities[cid_id] = dict(meta)
        return identities[cid_id]

    for r in art["columnValue"]:
        course = r[aci["Course"]]
        subj, key = parse_course(course)
        acoll = str(r[aci["Articulation College"]]).strip()
        if acoll.upper() in EXCLUDE_COLLEGES:   # demo/sandbox articulation — drop
            res["excluded-sandbox-college"] += 1
            continue
        cidn = str(r[aci["CID Number"]]).strip()
        ex_id = str(r[aci["ExhibitID"]]).strip()
        ex_title = str(r[aci["Exhibit Title"]]).strip()
        local = recover_local_title(acoll, key)

        # --- resolve identity ---
        if cidn:
            ref = cid_ref.get(cidn) or {}
            cid_id = cidn
            meta = {"identity_system": ref.get("id_system", "C-ID"), "title": ref.get("common_title"),
                    "discipline": ref.get("discipline"), "confidence": ref.get("confidence"),
                    "subject_spread": None, "over_merged": False, "is_singleton": False,
                    "credit_status": None, "credit_status_mixed": False,
                    "top_code_mixed": False, "noncredit_category_mixed": False}
            res["routed-to-C-ID"] += 1
        elif key in rev:
            cands = sorted(rev[key])
            if len(cands) == 1:
                cid_id = cands[0]
            else:
                n_ambiguous_total += 1
                ct = canon(local) if local else None
                matches = [m for m in cands if ct and canon(mid_meta[m]["title"]) == ct]
                if len(matches) == 1:
                    cid_id = matches[0]; n_disamb += 1
                else:
                    n_title_mismatch += 1
                    res["title-mismatch (unresolved)"] += 1
                    continue
            meta = mid_meta[cid_id]
            res["resolved-singleton" if meta["is_singleton"] else "resolved-M-ID"] += 1
        else:
            res["GE-area (excluded)" if (GE_RE.search(subj) or not subj)
                else ("subject-not-minted" if subj not in subj_minted else "unmatched-other")] += 1
            continue

        ensure_identity(cid_id, meta)
        unified, issuer, qflag = link_credential(ex_title)
        g = groups.get((cid_id, ex_id))
        if g is None:
            g = groups[(cid_id, ex_id)] = {
                "course_id": cid_id, "identity_system": meta["identity_system"],
                "over_merged": meta["over_merged"], "identity_confidence": meta["confidence"],
                "exhibit_id": ex_id, "exhibit_title": ex_title,
                "unified_title": unified, "issuing_agency": issuer, "quality_flag": qflag,
                "collaborative_type": str(r[aci["Collaborative Type"]]).strip(),
                "cpl_type_description": str(r[aci["CPL Type Description"]]).strip(),
                "top_code": str(r[aci["TOP Code"]]).strip(),
                "credit_recommendations": set(), "earned_by_colleges": set(),
                "local_courses": {},
            }
        cr_ = str(r[aci["Credit Recommendation"]]).strip()
        if cr_:
            g["credit_recommendations"].add(cr_)
        if acoll:
            g["earned_by_colleges"].add(acoll)
        g["local_courses"][key] = {"subject": key[0], "number": key[1], "title": local}

    # ---- colleges_offering + adoption leverage -------------------------------
    for cid_id, meta in identities.items():
        if meta["identity_system"] == "M-ID":
            offering = set()
            for k in mid_keys.get(cid_id, ()):
                offering |= key_colleges.get(k, set())
        else:
            offering = set(cid_colleges.get(cid_id, set()))
        meta["colleges_offering"] = sorted(offering)
        meta["colleges_offering_count"] = len(offering)

    n_records = n_with_leverage = total_leverage = 0
    articulations = []
    for (cid_id, ex_id), g in sorted(groups.items()):
        offering = set(identities[cid_id]["colleges_offering"])
        earned = g["earned_by_colleges"]
        adoptable = sorted(offering - earned)
        g["earned_by_colleges"] = sorted(earned)
        g["credit_recommendations"] = sorted(g["credit_recommendations"])
        g["local_courses"] = list(g["local_courses"].values())
        g["adoption_leverage"] = adoptable
        g["adoption_leverage_count"] = len(adoptable)
        n_records += 1
        if adoptable:
            n_with_leverage += 1
        total_leverage += len(adoptable)
        articulations.append(g)

    n_resolved = res["resolved-M-ID"] + res["resolved-singleton"] + res["routed-to-C-ID"]
    n_cred = sum(1 for g in articulations if g["unified_title"]) + 0  # per (identity,exhibit)
    out = {
        "_source": ("CustomReport_latest.json: View_ArticulatedMAPExhibits (earned articulations) "
                    "+ View_CollegeCourses (local titles + college coverage), joined to minted "
                    "M-IDs / C-ID reference / credential layer."),
        "_status": ("STAGING — additive. Curated common_courses.json / course_crosswalk.json, the "
                    "minted M-IDs, and the unified clusters are all untouched. No merge into "
                    "curated (out of scope, permanently)."),
        "_method": ("Course->(subject,number; leading zeros stripped)->identity: C-ID/CCN when the "
                    "row has a CID Number, else M-ID; multi-M-ID codes disambiguated by the local "
                    "Course Title (canonical match, never blind first-match). Exhibit Title-> "
                    "unified credential (+ quality_flag) via unified_titles.json. Identity "
                    "confidence/over_merged/*_mixed flags surfaced on each record."),
        "_follow_ons": [
            "disambiguate the residual title-mismatch rows (need richer course context)",
            "route GE-area articulations (course->GE area) in a separate crosswalk",
        ],
        "_generated_by": "kb/_seed_coci_articulations.py",
        "_generated_at": GENERATED_AT,
        "_classified_by": GENERATED_BY,
        "articulation_rows_total": len(art["columnValue"]),
        "resolution_breakdown": dict(res),
        "ambiguous_code_rows": n_ambiguous_total,
        "disambiguated_by_local_title": n_disamb,
        "unresolved_title_mismatch": n_title_mismatch,
        "credential_link_records": n_cred,
        "identities_with_articulations": len(identities),
        "articulation_records": n_records,
        "records_with_nonempty_leverage": n_with_leverage,
        "total_adoption_leverage": total_leverage,
        "identities": dict(sorted(identities.items())),
        "articulations": articulations,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"wrote {OUT}")
    print(f"  articulation rows: {len(art['columnValue'])}")
    print(f"  resolution: {dict(res)}")
    print(f"  ambiguous code rows: {n_ambiguous_total} -> disambiguated by title: {n_disamb}, "
          f"title-mismatch: {n_title_mismatch}")
    print(f"  identities: {len(identities)} | articulation records (identity x exhibit): {n_records}")
    print(f"  records with non-empty adoption_leverage: {n_with_leverage}")
    print(f"  total adoption leverage: {total_leverage}")


if __name__ == "__main__":
    main()
