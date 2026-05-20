"""
One-shot generator for the Phase A COCI course-identifier reference:
  kb/reference/coci_courses.json

PHASE A SCOPE — authoritative, identifier-bearing slice ONLY.
This reads the statewide MAP/COCI course list and extracts every course that
carries an official AB 1111 Common Course Number (CCN) or a C-ID, deduped by
identifier into one canonical entry. It is a READ-ONLY reference authority,
the same tier as ccn_courses.json / cid_descriptors.json.

It does NOT mint M-IDs, does NOT touch courses lacking a CCN/C-ID, and does
NOT modify kb/common_courses.json or kb/course_crosswalk.json. Merging this
authority into the curated course-identity layer (and M-ID minting for the
remaining ~89% of courses) is a SEPARATE later phase.

Identifier precedence here is CCN-ID > C-ID (the M-ID tier is out of scope):
  - CCN-ID — AB 1111 Common Course Number (e.g. "ANTH C1000"). Wins when both
    a CCN and a C-ID are present on the source rows.
  - C-ID   — Course Identification Numbering System descriptor (e.g. "ACCT 110").

For each identifier, all local rows that resolve to it (the same C-ID/CCN
repeats across many colleges) roll up into one entry:
  - common_title  — official title from ccn_courses.json / cid_descriptors.json
    when the cleaned identifier matches; else the most-common local CourseTitle.
  - description   — most-common local CatalogDescription (the LOCAL catalog
    text, not the official C-ID descriptor), with description_variant_count.
  - discipline    — mapped to the official CCC MQ Disciplines List
    (mq_disciplines.json). Where no exact MQ discipline exists the nearest is
    used and flagged mq_approx in _notes; genuinely ambiguous prefixes are left
    null and flagged.
  - source_course_count — number of local source rows that rolled up.

Normalization quirks handled:
  - Blanks: "(blank)", "Not Applicable", "NULL", "" -> treated as empty.
  - Duplicated number tokens: "AG-AB 108 108" / "AG-EH 108 108 L" -> collapse
    consecutive identical tokens.
  - Trailing placeholder "000": "MUS 171 000" -> "MUS 171".
  - Comma-joined multi-C-ID cells: "BIOL 135 S, BIOL 140" -> split; the source
    row is credited to EACH listed identifier (a local course articulating to
    two C-IDs is two crosswalk links).
  - Whitespace in titles/descriptions collapsed.

This is an AI-assisted DRAFT reference for human review. Once reviewed and
committed, curate by editing the JSON directly — do NOT re-run this script
(it would overwrite reviewer edits). Kept for provenance.

Source: 20260520 "Cousre List from MAP.xlsx", sheet "Sheet2"; columns
Subject, Course_Number, CourseTitle, CIDNumber, CommonCourseNumber,
CatalogDescription (~137K rows, no college column).

Run from repo root:  python3 kb/_seed_coci_courses.py /path/to/MAP_course_list.xlsx
"""
import json
import os
import re
import sys
from collections import defaultdict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "reference")
OUT = os.path.join(REF, "coci_courses.json")

GENERATED_AT = "2026-05-20"
GENERATED_BY = "claude-opus-4-7 (Phase A COCI reference draft)"
SOURCE_DESC = ('MAP statewide course list "20260520 Cousre List from MAP.xlsx" '
               "sheet Sheet2 (cols Subject, Course_Number, CourseTitle, CIDNumber, "
               "CommonCourseNumber, CatalogDescription), retrieved 2026-05-20")

BLANKS = {"(blank)", "not applicable", "", "null", "blank", "n/a"}


def is_blank(v):
    return v is None or (str(v).strip().lower() in BLANKS)


def norm(v):
    if v is None:
        return ""
    return re.sub(r"\s+", " ", str(v)).strip()


def clean_id(v):
    """Normalize an identifier cell: collapse whitespace, drop consecutive
    duplicate tokens (the '108 108' artifact), strip a trailing '000'."""
    v = norm(v)
    if not v:
        return ""
    toks = v.split(" ")
    out = []
    for t in toks:
        if out and out[-1] == t:   # collapse consecutive duplicate tokens
            continue
        out.append(t)
    if len(out) > 1 and out[-1] == "000":   # trailing placeholder
        out = out[:-1]
    return " ".join(out)


def split_cids(cell):
    """A C-ID cell may list several comma-joined C-IDs."""
    return [clean_id(p) for p in norm(cell).split(",") if clean_id(p)]


# --- Discipline routing: identifier subject prefix -> official MQ discipline ---
# Value: (mq_discipline_or_None, mq_approx_note_or_None)
# mq_approx note set when no exact MQ discipline matches the field and the
# nearest is used; None discipline left for genuinely ambiguous prefixes.
DISCIPLINE_MAP = {
    "ACCT":  ("Business", "Accounting: no MQ 'Accounting' discipline; nearest is Business."),
    "ADS":   (None, "Addiction/Drug Studies: no matching MQ discipline; needs review."),
    "AG-AB": ("Agriculture", "Agribusiness: rolled up to the broad MQ 'Agriculture'."),
    "AG-AS": ("Agriculture", "Animal Science: rolled up to the broad MQ 'Agriculture'."),
    "AG-EH": ("Ornamental Horticulture", None),
    "AG-MA": ("Agriculture", "Agricultural Mechanics: rolled up to the broad MQ 'Agriculture'."),
    "AG-PS": ("Agriculture", "Plant Science: rolled up to the broad MQ 'Agriculture'."),
    "AJ":    ("Administration of Justice", None),
    "ALTF":  ("Automotive Technology", None),
    "ANTH":  ("Anthropology", None),
    "ARTH":  ("Art History", None),
    "ARTS":  ("Art", None),
    "ASTR":  ("Astronomy", None),
    "AUTO":  ("Automotive Technology", None),
    "BIOL":  ("Biological Sciences", None),
    "BIOT":  ("Biotechnology", None),
    "BSOT":  ("Office Technologies", None),
    "BUS":   ("Business", None),
    "CDEV":  ("Child Development/Early Childhood Education", None),
    "CHEM":  ("Chemistry", None),
    "CHS":   ("Chicano Studies", None),
    "CMUS":  ("Commercial Music", None),
    "COMM":  ("Communication Studies", None),
    "COMP":  ("Computer Science", None),
    "DENA":  ("Dental Technology", "Dental Assisting: nearest MQ is Dental Technology."),
    "DMGR":  ("Multimedia", "Digital Media (mixes graphic/social media design): nearest MQ is Multimedia."),
    "ECE":   ("Child Development/Early Childhood Education", None),
    "ECON":  ("Economics", None),
    "EDUC":  ("Education", None),
    "EET":   ("Electronic Technology", None),
    "EMS":   ("Emergency Medical Technologies", None),
    "ENGL":  ("English", None),
    "ENGR":  ("Engineering", None),
    "ENVS":  (None, "Environmental Science: spans MQ Ecology/Biological Sciences/Earth Science; needs review."),
    "FIRE":  ("Fire Technology", None),
    "FTVE":  ("Film and Media Studies", None),
    "GEOG":  ("Geography", None),
    "GEOL":  ("Earth Science", "Geology: no MQ 'Geology'; nearest is Earth Science."),
    "GLST":  (None, "Global Studies: interdisciplinary, no clean MQ match; needs review."),
    "HIST":  ("History", None),
    "HIT":   ("Health Information Technology", None),
    "HOSP":  (None, "Hospitality: spans MQ Hotel and Motel Services/Restaurant Management/Travel Services; needs review."),
    "ITIS":  ("Computer Information Systems", None),
    "JOUR":  ("Journalism", None),
    "KIN":   ("Kinesiology", None),
    "LPPS":  (None, "Law/Public Policy/Paralegal mix: no clean MQ match; needs review."),
    "MATH":  ("Mathematics", None),
    "MUS":   ("Music", None),
    "NUTR":  ("Dietetics/Nutritional Science", None),
    "PH":    ("Health", None),
    "PHIL":  ("Philosophy", None),
    "PHS":   ("Health", None),
    "PHYS":  ("Physics/Astronomy", None),
    "POLS":  ("Political Science", None),
    "PSY":   ("Psychology", None),
    "PSYC":  ("Psychology", None),
    "SJS":   (None, "Social Justice/Ethnic Studies: candidate MQ 'Ethnic Studies'; left null pending review."),
    "SOCI":  ("Sociology", None),
    "SPAN":  ("Foreign Languages", None),
    "STAT":  ("Mathematics", "Statistics: classified under MQ Mathematics."),
    "SWHS":  ("Counseling", "Human Services/Social Work: no MQ discipline; nearest is Counseling (per kb precedent)."),
    "THTR":  ("Theater Arts", None),
    "WELD":  ("Welding", None),
    "WWTR":  ("Environmental Technologies", "Water/Wastewater Treatment: nearest MQ is Environmental Technologies."),
}


def load_xlsx_rows(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True)
    ws = wb["Sheet2"]
    return ws.iter_rows(min_row=2, values_only=True)


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: python3 kb/_seed_coci_courses.py /path/to/MAP_course_list.xlsx")
    xlsx_path = sys.argv[1]

    ccn_ref = {c["ccn"]: c for c in
               json.load(open(os.path.join(REF, "ccn_courses.json")))["courses"]}
    cid_ref = {d["descriptor"]: d for d in
               json.load(open(os.path.join(REF, "cid_descriptors.json")))["descriptors"]}
    mq_set = set(json.load(open(os.path.join(REF, "mq_disciplines.json")))["disciplines"])

    # validate the discipline map points only at real MQ titles
    for pre, (disc, _note) in DISCIPLINE_MAP.items():
        if disc is not None and disc not in mq_set:
            sys.exit(f"BUG: discipline '{disc}' for prefix '{pre}' not in MQ list")

    # entry key = (course_id, id_system)
    agg = defaultdict(lambda: {
        "titles": Counter(), "descs": Counter(),
        "cids": Counter(), "ccns": Counter(), "count": 0,
    })

    for s, num, title, c, cc, desc in load_xlsx_rows(xlsx_path):
        has_ccn = not is_blank(cc)
        has_cid = not is_blank(c)
        if not (has_ccn or has_cid):
            continue
        ccn_clean = clean_id(cc) if has_ccn else ""
        cid_parts = split_cids(c) if has_cid else []

        if ccn_clean:
            targets = [(ccn_clean, "CCN-ID", ccn_clean, cid_parts[0] if cid_parts else "")]
        else:
            targets = [(p, "C-ID", "", p) for p in cid_parts]

        for course_id, id_system, ccn_val, cid_val in targets:
            if not course_id:
                continue
            e = agg[(course_id, id_system)]
            e["count"] += 1
            t = norm(title)
            if t:
                e["titles"][t] += 1
            d = norm(desc)
            if d and not is_blank(desc):
                e["descs"][d] += 1
            if ccn_val:
                e["ccns"][ccn_val] += 1
            if cid_val:
                e["cids"][cid_val] += 1

    courses = {}
    for (course_id, id_system), e in agg.items():
        subject = course_id.split(" ")[0]
        disc, mq_note = DISCIPLINE_MAP.get(subject, (None, None))
        notes = []

        # common_title: prefer official registry/descriptor title
        title_source = "local catalog (most common)"
        common_title = None
        if id_system == "CCN-ID" and course_id in ccn_ref:
            common_title = ccn_ref[course_id]["title"]
            title_source = "CCN registry"
        elif id_system == "C-ID" and course_id in cid_ref:
            common_title = cid_ref[course_id]["title"]
            title_source = "C-ID descriptor"
        if not common_title:
            common_title = e["titles"].most_common(1)[0][0] if e["titles"] else None
            if id_system == "C-ID" and course_id not in cid_ref:
                notes.append("C-ID not found in cid_descriptors.json reference (kept local title).")
            if id_system == "CCN-ID" and course_id not in ccn_ref:
                notes.append("CCN not found in ccn_courses.json reference (kept local title).")

        # description: most-common local catalog text
        description = e["descs"].most_common(1)[0][0] if e["descs"] else None
        desc_variants = len(e["descs"])

        # ccn_id / c_id raw values
        ccn_id = course_id if id_system == "CCN-ID" else None
        c_id = None
        if id_system == "C-ID":
            c_id = course_id
        elif e["cids"]:
            c_id = e["cids"].most_common(1)[0][0]
            if len(e["cids"]) > 1:
                others = [x for x, _ in e["cids"].most_common()][1:]
                notes.append("multiple underlying C-IDs across colleges: " + ", ".join(others))

        if subject not in DISCIPLINE_MAP:
            notes.append(f"subject prefix '{subject}' has no discipline mapping; needs review.")
        elif mq_note:
            notes.append(mq_note)

        courses[course_id] = {
            "course_id": course_id,
            "id_system": id_system,
            "ccn_id": ccn_id,
            "c_id": c_id,
            "common_title": common_title,
            "common_title_source": title_source,
            "description": description,
            "description_variant_count": desc_variants,
            "subject": subject,
            "discipline": disc,
            "source_course_count": e["count"],
            "classified_at": GENERATED_AT,
            "classified_by": GENERATED_BY,
            "reviewed_at": None,
            "reviewed_by": None,
            "_notes": "; ".join(notes) if notes else None,
        }

    courses = dict(sorted(courses.items()))
    n_ccn = sum(1 for v in courses.values() if v["id_system"] == "CCN-ID")
    n_cid = sum(1 for v in courses.values() if v["id_system"] == "C-ID")

    out = {
        "_source": SOURCE_DESC,
        "_note": ("Phase A COCI reference: authoritative, identifier-bearing slice "
                  "(CCN/C-ID only) of the statewide MAP course list, deduped by identifier. "
                  "AI-assisted draft for human review; M-ID minting and merge into "
                  "kb/common_courses.json are a later phase."),
        "_generated_by": "kb/_seed_coci_courses.py",
        "_generated_at": GENERATED_AT,
        "count": len(courses),
        "count_ccn_id": n_ccn,
        "count_c_id": n_cid,
        "courses": courses,
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"wrote {OUT}")
    print(f"  total entries: {len(courses)}  (CCN-ID: {n_ccn}, C-ID: {n_cid})")


if __name__ == "__main__":
    main()
