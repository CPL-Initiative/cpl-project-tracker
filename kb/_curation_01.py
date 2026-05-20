"""
Curation pass 1 (2026-05-20) — human review of the Phase 2 Cx course-identity
seed. One-shot, applied to kb/common_courses.json + kb/course_crosswalk.json.
Reproduce from the committed seed:
    git checkout <seed> -- kb/common_courses.json kb/course_crosswalk.json
    python3 kb/_curation_01.py
Do NOT re-run after further hand-edits; kept for provenance.

Decisions (project-lead samueltlee, via review session):
  Fuzzy C-ID matches:
    - ITIS 160 confirmed; JOUR 170 confirmed (discipline -> Journalism).
    - SPAN levels split by local course number: SPAN 2 -> SPAN 110, SPAN 4 ->
      SPAN 210; SPAN 1/1B stay SPAN 100, SPAN 3 stays SPAN 200.
  Approximate / single-source disciplines:
    - Accounting -> Business; GIS -> Geography; Web -> Computer Information
      Systems; Hospitality mgmt -> Hotel and Motel Services; building
      inspection -> Building Codes and Regulations; culinary -> Culinary
      Arts/Food Technology; drafting -> Drafting/CADD; Investigative Reporting
      -> Journalism; Human Services -> Counseling.
    - Refined: Medical Terminology -> Health Information Technology; airline/
      travel -> Travel Services; A&P -> Biological Sciences.
  Cross-listing (new `cross_listing_group` field; CCCCO cross-listed courses):
    - "Introduction to Computer-aided Drafting" (Saddleback ARCH 50 / DR 50):
      split into M-ID ARCH 104 (Architecture) + M-ID DRFT 108 (Drafting/CADD),
      group XL-0001.
    - "Introduction to Photojournalism" (Las Positas JAMS 12 / PHTO 72):
      C-ID JOUR 160 (Journalism) + M-ID PHOT 106 (Photography), group XL-0002.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REVIEWED_AT = "2026-05-20"
REVIEWER = "samueltlee"


def load(name):
    return json.load(open(os.path.join(HERE, name)))


def save(name, obj):
    with open(os.path.join(HERE, name), "w") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def review(rec):
    rec["reviewed_at"] = REVIEWED_AT
    rec["reviewed_by"] = REVIEWER


def with_xl_after_cid(rec, group=None):
    """Return a copy with `cross_listing_group` inserted right after `c_id`."""
    out = {}
    for k, v in rec.items():
        if k == "cross_listing_group":
            continue
        out[k] = v
        if k == "c_id":
            out["cross_listing_group"] = group if group is not None else rec.get("cross_listing_group")
    out.setdefault("cross_listing_group", group if group is not None else rec.get("cross_listing_group"))
    return out


def main():
    cc = load("common_courses.json")
    xw = load("course_crosswalk.json")

    # 0) Schema: add cross_listing_group (null) to every entry, after c_id ----
    cc = {k: with_xl_after_cid(v) for k, v in cc.items()}

    # 1) Crosswalk reassignments (course_id changes) ------------------------
    for key, (cid_, sys) in {
        "Saddleback College :: SPAN 2 :: ELEMENTARY SPANISH": ("SPAN 110", "C-ID"),
        "Saddleback College :: SPAN 4 :: INTERMEDIATE SPANISH": ("SPAN 210", "C-ID"),
        "San Diego City College :: ENGN 130 :: Introduction to Engineering Design": ("ENGR 150", "C-ID"),
    }.items():
        xw[key]["course_id"] = cid_
        xw[key]["id_system"] = sys
        review(xw[key])

    # 2) New catalog entries for the split-out Spanish levels ---------------
    def cid_entry(title, code, units, notes):
        return with_xl_after_cid({
            "common_title": title, "id_system": "C-ID", "ccn_id": None, "c_id": code,
            "subject": "SPAN", "discipline": "Foreign Languages",
            "discipline_provisional": "Spanish", "typical_units": units,
            "confidence": 0.95, "source_college_count": 1,
            "classified_at": "2026-05-19", "classified_by": "claude-opus-4-7 (Cx common-course draft)",
            "reviewed_at": REVIEWED_AT, "reviewed_by": REVIEWER, "_notes": notes,
        })
    cc["SPAN 110"] = cid_entry("Elementary Spanish II", "SPAN 110", 5.0,
        "Split from SPAN 100 by local course number (Saddleback SPAN 2 = Elementary Spanish II). Curation pass 1.")
    cc["SPAN 210"] = cid_entry("Intermediate Spanish II", "SPAN 210", 5.0,
        "Split from SPAN 200 by local course number (Saddleback SPAN 4 = Intermediate Spanish II). Curation pass 1.")

    # 3) Remove now-empty ENGR 110 -----------------------------------------
    del cc["ENGR 110"]

    # 4) Recompute counts + clear fuzzy flags on affected matched entries ----
    cc["SPAN 100"].update(source_college_count=3, confidence=0.9,
        _notes="C-ID SPAN 100 (Elementary Spanish I); Elementary Spanish II split out to SPAN 110. Curation pass 1.")
    review(cc["SPAN 100"])
    cc["SPAN 200"].update(source_college_count=1, confidence=0.9,
        _notes="C-ID SPAN 200 (Intermediate Spanish I); Intermediate Spanish II split out to SPAN 210. Curation pass 1.")
    review(cc["SPAN 200"])
    cc["ENGR 150"].update(source_college_count=2, subject="ENGR", discipline="Engineering",
        _notes="C-ID ENGR 150 (Engineering Graphics); ENGN 130 'Introduction to Engineering Design' mapped here per curation decision 2026-05-20.")
    review(cc["ENGR 150"])
    cc["ITIS 160"]["_notes"] = "Confirmed: local 'Introduction Information Systems Security' = C-ID ITIS 160."
    review(cc["ITIS 160"])
    cc["JOUR 170"].update(subject="JOUR", discipline="Journalism",
        _notes="Confirmed C-ID JOUR 170 (Introduction to Visual Communications); discipline aligned to Journalism.")
    review(cc["JOUR 170"])

    # 5) Discipline confirmations (keep discipline, clear 'verify' flag) -----
    for cid_, note in {
        "ACCT 110": "Accounting is an area within MQ discipline 'Business' (no standalone MQ Accounting discipline). Confirmed curation pass 1.",
        "ACCT 120": "Accounting is an area within MQ discipline 'Business'. Confirmed curation pass 1.",
        "BSOT 127 X": "Accounting is an area within MQ discipline 'Business'. Confirmed curation pass 1.",
        "M-ID ACCT 100": "Accounting is an area within MQ discipline 'Business'. Confirmed curation pass 1.",
        "M-ID ACCT 102": "Accounting is an area within MQ discipline 'Business'. Confirmed curation pass 1.",
        "GEOG 155": "GIS falls under MQ discipline 'Geography'. Confirmed curation pass 1.",
        "M-ID WEB 100": "No MQ Web discipline; 'Computer Information Systems' is the home. Confirmed curation pass 1.",
        "M-ID WEB 102": "No MQ Web discipline; 'Computer Information Systems' is the home. Confirmed curation pass 1.",
        "M-ID WEB 104": "No MQ Web discipline; 'Computer Information Systems' is the home. Confirmed curation pass 1.",
        "M-ID WEB 106": "No MQ Web discipline; 'Computer Information Systems' is the home. Confirmed curation pass 1.",
        "HOSP 100": "MQ discipline 'Hotel and Motel Services' for hospitality management. Confirmed curation pass 1.",
        "M-ID HOSP 102": "MQ discipline 'Hotel and Motel Services' for hospitality/tourism intro. Confirmed curation pass 1.",
        "M-ID BCIT 100": "Building inspection/codes course → MQ 'Building Codes and Regulations'. Confirmed curation pass 1.",
        "M-ID BCIT 102": "Building inspection course → MQ 'Building Codes and Regulations'. Confirmed curation pass 1.",
        "M-ID BCIT 104": "Building inspection course → MQ 'Building Codes and Regulations'. Confirmed curation pass 1.",
        "M-ID BCIT 106": "Building inspection course → MQ 'Building Codes and Regulations'. Confirmed curation pass 1.",
        "M-ID BCIT 108": "Building inspection course → MQ 'Building Codes and Regulations'. Confirmed curation pass 1.",
        "M-ID BCIT 110": "Building codes course → MQ 'Building Codes and Regulations'. Confirmed curation pass 1.",
        "M-ID BCIT 112": "Building codes course → MQ 'Building Codes and Regulations'. Confirmed curation pass 1.",
        "M-ID CULN 102": "Culinary course → MQ 'Culinary Arts/Food Technology'. Confirmed curation pass 1.",
        "M-ID CULN 104": "Culinary course → MQ 'Culinary Arts/Food Technology'. Confirmed curation pass 1.",
        "M-ID CULN 110": "Culinary internship → MQ 'Culinary Arts/Food Technology'. Confirmed curation pass 1.",
        "M-ID CULN 112": "Culinary course → MQ 'Culinary Arts/Food Technology'. Confirmed curation pass 1.",
        "M-ID CULN 118": "Culinary course → MQ 'Culinary Arts/Food Technology'. Confirmed curation pass 1.",
        "M-ID DRFT 100": "CAD/drafting course → MQ 'Drafting/CADD'. Confirmed curation pass 1.",
        "M-ID DRFT 102": "Drafting/design-tech course → MQ 'Drafting/CADD'. Confirmed curation pass 1.",
        "M-ID DRFT 104": "Drafting/design course → MQ 'Drafting/CADD'. Confirmed curation pass 1.",
        "M-ID DRFT 106": "Drafting/design course → MQ 'Drafting/CADD'. Confirmed curation pass 1.",
        "M-ID JOUR 100": "Investigative Reporting → MQ 'Journalism' per curation decision 2026-05-20 (coded AJ 54 locally).",
    }.items():
        cc[cid_]["_notes"] = note
        review(cc[cid_])

    # 6) Discipline refinements --------------------------------------------
    cc["HIT 103 X"].update(subject="HIT", discipline="Health Information Technology",
        _notes="C-ID HIT 103 X; MQ discipline 'Health Information Technology'. Curation pass 1.")
    review(cc["HIT 103 X"])
    cc["M-ID HOSP 100"].update(discipline="Travel Services",
        _notes="Airline/travel course → MQ 'Travel Services'. Curation pass 1.")
    review(cc["M-ID HOSP 100"])
    cc["M-ID HOSP 104"].update(discipline="Travel Services",
        _notes="Travel & tourism course → MQ 'Travel Services'. Curation pass 1.")
    review(cc["M-ID HOSP 104"])
    cc["M-ID MEDA 100"].update(discipline="Biological Sciences",
        _notes="Anatomy & physiology → MQ discipline 'Biological Sciences' per curation decision 2026-05-20.")
    review(cc["M-ID MEDA 100"])

    # 7) Title-casing fix ---------------------------------------------------
    cc["M-ID BCIT 110"]["common_title"] = "Mechanical Code - Heating, AC, Refrigeration, and Ductwork"

    # 8) Mark Human Services -> Counseling entries reviewed (confirmed) -----
    for cid_ in ("M-ID HSER 100", "M-ID HSER 102", "M-ID HSER 104", "M-ID HSER 106", "M-ID HSER 108"):
        review(cc[cid_])

    # 9) Cross-listed course A — Intro to Computer-aided Drafting (XL-0001) --
    #    Saddleback lists it as ARCH 50 (Architecture) AND DR 50 (Drafting).
    XL_CAD = "XL-0001"
    cc["M-ID ARCH 104"].update(source_college_count=1, cross_listing_group=XL_CAD,
        _notes="Cross-listed with M-ID DRFT 108 (same course in Drafting/CADD). Architecture-side mirror. Curation pass 1.")
    review(cc["M-ID ARCH 104"])
    drft108 = dict(cc["M-ID ARCH 104"])
    drft108.update(subject="DRFT", discipline="Drafting/CADD",
        discipline_provisional="Drafting & Design Technology", cross_listing_group=XL_CAD,
        _notes="Cross-listed with M-ID ARCH 104 (same course in Architecture). Drafting/CADD-side mirror. Curation pass 1.")
    cc["M-ID DRFT 108"] = drft108
    k_dr = "Saddleback College :: DR 50 :: INTRODUCTION TO COMPUTER-AIDED DRAFTING"
    xw[k_dr]["course_id"] = "M-ID DRFT 108"
    xw[k_dr]["id_system"] = "M-ID"
    review(xw[k_dr])
    review(xw["Saddleback College :: ARCH 50 :: INTRODUCTION TO COMPUTER-AIDED DRAFTING"])

    # 10) Cross-listed course B — Intro to Photojournalism (XL-0002) --------
    #     Las Positas lists it as JAMS 12 (Journalism) AND PHTO 72 (Photography).
    XL_PJ = "XL-0002"
    cc["JOUR 160"].update(source_college_count=1, cross_listing_group=XL_PJ,
        _notes="Cross-listed with M-ID PHOT 106 (same course in Photography). Journalism-side (C-ID JOUR 160). Curation pass 1.")
    review(cc["JOUR 160"])
    cc["M-ID PHOT 106"] = with_xl_after_cid({
        "common_title": "Introduction to Photojournalism", "id_system": "M-ID", "ccn_id": None, "c_id": None,
        "subject": "PHOT", "discipline": "Photography", "discipline_provisional": "Photography",
        "typical_units": 3.0, "confidence": 0.85, "source_college_count": 1,
        "classified_at": "2026-05-19", "classified_by": "claude-opus-4-7 (Cx common-course draft)",
        "reviewed_at": REVIEWED_AT, "reviewed_by": REVIEWER,
        "_notes": "Cross-listed with C-ID JOUR 160 (same course in Journalism). Photography-side mirror. Curation pass 1.",
    }, group=XL_PJ)
    k_phto = "Las Positas College :: PHTO 72 :: Introduction to Photojournalism"
    xw[k_phto]["course_id"] = "M-ID PHOT 106"
    xw[k_phto]["id_system"] = "M-ID"
    review(xw[k_phto])
    review(xw["Las Positas College :: JAMS 12 :: Introduction to Photojournalism"])

    # Sort + save ----------------------------------------------------------
    cc = {k: cc[k] for k in sorted(cc)}
    xw = {k: xw[k] for k in sorted(xw)}
    save("common_courses.json", cc)
    save("course_crosswalk.json", xw)

    # Validate -------------------------------------------------------------
    ids = set(cc)
    orphans = {v["course_id"] for v in xw.values()} - ids
    assert not orphans, f"orphans: {orphans}"
    for v in xw.values():
        assert v["id_system"] == cc[v["course_id"]]["id_system"], v
    # cross-listing groups: each group has >= 2 members
    from collections import defaultdict
    groups = defaultdict(list)
    for k, v in cc.items():
        if v.get("cross_listing_group"):
            groups[v["cross_listing_group"]].append(k)
    for g, members in groups.items():
        assert len(members) >= 2, f"group {g} has <2 members: {members}"
    flagged = sum(1 for v in cc.values() if any(w in (v["_notes"] or "") for w in ("verify", "approximate", "fuzzy")))
    reviewed = sum(1 for v in cc.values() if v["reviewed_at"])
    print(f"common_courses: {len(cc)} | reviewed: {reviewed} | still-flagged: {flagged}")
    print(f"cross-listing groups: {dict(groups)}")
    print(f"crosswalk: {len(xw)} | orphans: none")


if __name__ == "__main__":
    main()
