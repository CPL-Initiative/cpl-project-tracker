"""
One-shot generator for the articulation crosswalk (STAGING):
  kb/coci_articulations.json

WHAT THIS IS / WHY
MAP records earned CPL articulations in View_ArticulatedMAPExhibits: a college
(Articulation College) earned credit for an exhibit/credential on one of its
courses (Course, e.g. "AUTO 063A"). Today that articulation is siloed at the
earning college. By resolving the course to a shared identity (an M-ID, or a
C-ID/CCN when the course has one) we connect it to EVERY college teaching a like
course — so an articulation one college earned becomes visibly adoptable at the
others. That propagation is the payoff of the whole course-identity layer.

This is a STAGING, additive artifact. It does NOT modify the minted M-IDs, the
unified clusters, or the curated common_courses.json / course_crosswalk.json.

RESOLUTION (all identity layers):
  - Course -> (subject, number); number normalized (strip leading zeros).
  - If the row carries a CID Number -> C-ID/CCN identity (titled from
    reference/coci_courses.json when catalogued).
  - else (subject, number) -> M-ID via the membership index. ~10% of course
    keys map to >1 M-ID (same code, different exact titles); since the row has
    no course title to disambiguate, the articulation is attached to ALL and
    flagged identity_ambiguous.
  - else unresolved: GE-area rows (Course is a GE designation like "CAL-GETC
    AREA", not a course) are counted separately and excluded; other unresolved
    are tallied.

CREDENTIAL LINK: Exhibit Title -> unified credential via unified_titles.json
(+ issuing_agency from credentials.json). ~99.8% of exhibit titles resolve.

ADOPTION LEVERAGE: the minting source had no college column, but
View_CollegeCourses (College, Subject, Course Number) does — so colleges_offering
for an identity = the distinct colleges teaching any member course, and an
exhibit's adoptable_by_count = colleges_offering minus the colleges that already
earned it.

This is an AI-assisted DRAFT for human review. Kept for provenance.

Reads CustomReport_latest.json from the repo root (committed daily artifact).
Run from repo root:
  python3 kb/_seed_coci_articulations.py
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

GE_RE = re.compile(r"GETC|IGETC|\bGE\b|GE AREA|GE GROUP|^CSU|^UC\b|^LOCAL GE|^LACCD GE|^CPL$")


def norm_num(num):
    s = re.sub(r"\s+", "", str(num)).upper()
    m = re.match(r"^0*(\d+)([A-Z]*)$", s)
    return m.group(1) + m.group(2) if m else s


def jkey(subj, num):
    return (re.sub(r"\s+", " ", str(subj)).strip().upper(), norm_num(num))


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
    # --- identity layers -------------------------------------------------------
    rev = defaultdict(set)          # (subject,num) -> {M-ID}
    mid_keys = defaultdict(set)     # M-ID -> {(subject,num)}
    mid_title = {}
    cat = json.load(open(os.path.join(HERE, "coci_minted_courses.json")))["courses"]
    mem = json.load(open(os.path.join(HERE, "coci_minted_memberships.json")))["memberships"]
    sg = json.load(open(os.path.join(HERE, "coci_minted_singletons.json")))["courses"]
    for mid, v in cat.items():
        mid_title[mid] = v["common_title"]
        for m in mem.get(mid, []):
            k = jkey(m["subject"], m["course_number"])
            rev[k].add(mid); mid_keys[mid].add(k)
    for mid, v in sg.items():
        mid_title[mid] = v["common_title"]
        k = jkey(v["subject"], v["course_number"])
        rev[k].add(mid); mid_keys[mid].add(k)

    cid_ref = json.load(open(os.path.join(HERE, "reference", "coci_courses.json")))
    cid_ref = {k: v for k, v in cid_ref.items() if isinstance(v, dict) and v.get("id_system")}

    # --- credential layer ------------------------------------------------------
    ut = json.load(open(os.path.join(HERE, "unified_titles.json")))
    ut_exact = {k: v["unified_title"] for k, v in ut.items()}
    ut_norm = {ntitle(k): v["unified_title"] for k, v in ut.items()}
    creds = json.load(open(os.path.join(HERE, "credentials.json")))

    def issuer_of(unified):
        recs = creds.get(unified)
        if not recs:
            return None
        best = max(recs, key=lambda r: r.get("confidence_issuer") or 0)
        return best.get("issuing_agency")

    # --- CustomReport ----------------------------------------------------------
    cr = json.load(open(CUSTOMREPORT))
    by_view = {d["viewName"]: d for d in cr}
    art = by_view["View_ArticulatedMAPExhibits_APIDataset"]
    aci = {c: i for i, c in enumerate(art["columnName"])}

    # college coverage from View_CollegeCourses
    cc = by_view["View_CollegeCourses_APIDataset"]
    cci = {c: i for i, c in enumerate(cc["columnName"])}
    key_colleges = defaultdict(set)   # (subject,num) -> {college}
    cid_colleges = defaultdict(set)   # CID Number -> {college}
    for r in cc["columnValue"]:
        coll = str(r[cci["College"]]).strip()
        key_colleges[jkey(r[cci["Subject"]], r[cci["Course Number"]])].add(coll)
        cidn = str(r[cci["CID Number"]]).strip()
        if cidn:
            cid_colleges[cidn].add(coll)

    # --- resolve each articulation --------------------------------------------
    # identity_id -> {meta, exhibits: {exhibit_id: {...}}}
    identities = {}
    n = 0
    res = Counter()
    n_cred_linked = 0
    ambiguous_rows = 0

    def ensure(identity_id, system, title, ambiguous):
        if identity_id not in identities:
            identities[identity_id] = {
                "identity_id": identity_id,
                "identity_system": system,
                "title": title,
                "identity_ambiguous": ambiguous,
                "colleges_offering": None,   # filled below
                "exhibits": {},
            }
        return identities[identity_id]

    for r in art["columnValue"]:
        n += 1
        course = r[aci["Course"]]
        subj, key = parse_course(course)
        cidn = str(r[aci["CID Number"]]).strip()
        acoll = str(r[aci["Articulation College"]]).strip()
        ex_id = str(r[aci["ExhibitID"]]).strip()
        ex_title = str(r[aci["Exhibit Title"]]).strip()

        # resolve identity / identities
        targets = []  # list of (identity_id, system, title, ambiguous)
        if cidn:
            ref = cid_ref.get(cidn)
            targets.append((cidn, (ref or {}).get("id_system", "C-ID"),
                            (ref or {}).get("common_title"), False))
        elif key in rev:
            mids = sorted(rev[key])
            amb = len(mids) > 1
            if amb:
                ambiguous_rows += 1
            for mid in mids:
                targets.append((mid, "M-ID", mid_title.get(mid), amb))
        else:
            res["GE-area (excluded)" if (GE_RE.search(subj) or not subj)
                else "unresolved-course"] += 1
            continue
        res["M-ID" if targets[0][1] == "M-ID" else "C-ID/CCN"] += 1

        # credential link
        unified = ut_exact.get(ex_title) or ut_norm.get(ntitle(ex_title))
        if unified:
            n_cred_linked += 1
        issuing = issuer_of(unified) if unified else None
        cred_rec = str(r[aci["Credit Recommendation"]]).strip()
        collab = str(r[aci["Collaborative Type"]]).strip()
        cpl_desc = str(r[aci["CPL Type Description"]]).strip()
        topc = str(r[aci["TOP Code"]]).strip()

        for identity_id, system, title, amb in targets:
            ent = ensure(identity_id, system, title, amb)
            ex = ent["exhibits"].setdefault(ex_id, {
                "exhibit_id": ex_id, "exhibit_title": ex_title,
                "unified_title": unified, "issuing_agency": issuing,
                "collaborative_type": collab, "cpl_type_description": cpl_desc,
                "top_code": topc, "credit_recommendations": set(),
                "earned_by_colleges": set(),
            })
            if cred_rec:
                ex["credit_recommendations"].add(cred_rec)
            if acoll:
                ex["earned_by_colleges"].add(acoll)

    # --- colleges_offering + adoption leverage --------------------------------
    total_leverage = 0
    for identity_id, ent in identities.items():
        if ent["identity_system"] == "M-ID":
            offering = set()
            for k in mid_keys.get(identity_id, ()):
                offering |= key_colleges.get(k, set())
        else:
            offering = set(cid_colleges.get(identity_id, set()))
        ent["colleges_offering"] = len(offering)
        for ex in ent["exhibits"].values():
            earned = ex["earned_by_colleges"]
            adoptable = offering - earned
            ex["adoptable_by_count"] = len(adoptable)
            total_leverage += len(adoptable)
            ex["credit_recommendations"] = sorted(ex["credit_recommendations"])
            ex["earned_by_colleges"] = sorted(earned)
        # exhibits dict -> sorted list
        ent["earned_exhibit_count"] = len(ent["exhibits"])
        ent["exhibits"] = sorted(ent["exhibits"].values(), key=lambda e: e["exhibit_id"])

    out = {
        "_source": ("Derived from CustomReport_latest.json (View_ArticulatedMAPExhibits + "
                    "View_CollegeCourses) joined to the minted M-IDs / C-ID reference / "
                    "credential layer."),
        "_status": ("STAGING — additive articulation crosswalk. Does not modify minted M-IDs, "
                    "unified clusters, or curated common_courses.json / course_crosswalk.json."),
        "_method": ("Course -> (subject, number; leading zeros stripped) -> identity: C-ID/CCN "
                    "when the row carries a CID Number, else M-ID via the membership index "
                    "(attached to ALL matching M-IDs + identity_ambiguous when a code maps to "
                    ">1). Exhibit Title -> unified credential via unified_titles.json. "
                    "colleges_offering / adoptable_by_count from View_CollegeCourses."),
        "_follow_ons": [
            "disambiguate identity_ambiguous rows (no course title in the articulation feed)",
            "route GE-area articulations (course -> GE area) in a separate crosswalk",
            "optional: promote vetted articulation-bearing M-IDs into curated common_courses.json",
        ],
        "_generated_by": "kb/_seed_coci_articulations.py",
        "_generated_at": GENERATED_AT,
        "_classified_by": GENERATED_BY,
        "articulation_rows_total": n,
        "resolution_breakdown": dict(res),
        "rows_identity_ambiguous": ambiguous_rows,
        "credential_link_rate": f"{n_cred_linked}/{res['M-ID'] + res['C-ID/CCN']}",
        "distinct_identities_with_articulations": len(identities),
        "total_adoption_leverage": total_leverage,
        "identities": dict(sorted(identities.items())),
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"wrote {OUT}")
    print(f"  articulation rows: {n}")
    print(f"  resolution: {dict(res)}")
    print(f"  identity-ambiguous rows: {ambiguous_rows}")
    print(f"  credential-linked: {n_cred_linked}")
    print(f"  identities with articulations: {len(identities)}")
    print(f"  total adoption leverage (sum adoptable-by across exhibits): {total_leverage}")


if __name__ == "__main__":
    main()
