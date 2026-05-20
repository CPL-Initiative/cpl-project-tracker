"""
One-shot generator for the Phase B M-ID consolidation seed (STAGING):
  kb/coci_minted_courses.json

WHAT THIS IS
Reads the statewide MAP/COCI course list and consolidates "like courses"
(courses that lack any C-ID/CCN) into synthetic common-course identities —
M-IDs — so an articulation earned on any member course can later scale to
every college teaching a like course. The college column is intentionally
absent from the source; the M-ID *is* the cross-college consolidation key.

This is a STAGING artifact. It is NOT merged into the hand-curated
kb/common_courses.json or kb/course_crosswalk.json. Those remain untouched.
Merging (and the join against MAP's actual articulations) is a later phase.

CONSERVATIVE FIRST CUT — deliberately narrow, so the output is reviewable:
  - exact title match only: titles are matched after light normalization
    (lowercase, punctuation -> space, whitespace collapse). NO fuzzy /
    synonym / stemming variant-merging — that is a named follow-on.
  - corroborated clusters only: a course is consolidated only when >=2 like
    courses share the normalized title. Singletons are deferred (follow-on).
  - representative (modal) title & description: the most-common local
    CourseTitle / CatalogDescription stands in for the cluster. NO synthesis
    of a new consolidated title/description — that is a follow-on.
  - administrative shells excluded: generic titles (independent study,
    internship, work experience, special projects, ...) and code-only titles
    are dropped — they are not consolidatable common courses.

EXPLICIT FOLLOW-ONS (not done here):
  1. Variant-merging — fuzzy/synonym title clustering (e.g. "Intro to
     Psychology" == "General Psychology") and subject-code canonicalization.
  2. Title/description synthesis — mint a clean consolidated title and
     description rather than borrowing a representative member's.
  3. Singletons — give every remaining course an identity (confidence-graded).
  4. Discipline completion — map every modal subject to an MQ discipline.
  5. Merge into curated kb/common_courses.json + crosswalk MAP articulations
     (CustomReport, which carries the college) through these M-IDs.

NUMBERING: M-IDs are numbered per modal subject continuing from the highest
existing number in kb/common_courses.json (step 2, matching the seed style),
so a future merge never collides with existing M-IDs.

This is an AI-assisted DRAFT for human review. Do NOT re-run over reviewer
edits; kept for provenance.

Source: 20260520 "Cousre List from MAP.xlsx", sheet "Sheet2"
(cols Subject, Course_Number, CourseTitle, CIDNumber, CommonCourseNumber,
CatalogDescription; no college column — by design).

Run from repo root:
  python3 kb/_seed_coci_minted_mids.py /path/to/MAP_course_list.xlsx
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "reference")
OUT = os.path.join(HERE, "coci_minted_courses.json")

GENERATED_AT = "2026-05-20"
GENERATED_BY = "claude-opus-4-7 (Phase B M-ID consolidation draft)"
SOURCE_DESC = ('MAP statewide course list "20260520 Cousre List from MAP.xlsx" '
               "sheet Sheet2, retrieved 2026-05-20; college column absent by design")
MIN_MEMBERS = 2

BLANKS = {"(blank)", "not applicable", "", "null", "blank", "n/a"}

# Generic / administrative title shells — not consolidatable common courses.
STOP_PATTERNS = [
    r"independent stud", r"directed stud", r"dir stud", r"special stud",
    r"special project", r"special topic", r"selected topic", r"special problem",
    r"work experience", r"cooperative (work )?(education|experience)", r"coop ",
    r"internship", r"\bintern\b", r"supervised tutoring",
    r"student instructional assistant", r"service learning", r"occupational work",
    r"tutoring", r"practicum", r"fieldwork", r"field work", r"field experience",
    r"field study", r"directed practice", r"clinical practice", r"cooperative work",
    r"work based learning", r"work-based", r"on the job", r"apprenticeship",
    r"seminar$", r"^seminar", r"special assignment", r"volunteer", r"community service",
]
STOP_RE = re.compile("|".join(STOP_PATTERNS))
CODE_RE = re.compile(r"^[a-z]{1,6} ?\d{1,4}[a-z]?$")  # title that is just a course code

# Modal-subject -> official MQ discipline (best-effort; unmapped -> null + flag).
# Reuses the Phase A C-ID/CCN prefixes plus common local subject codes.
DISCIPLINE_MAP = {
    "ACCT": "Business", "ACCTG": "Business", "ACCOUNT": "Business",
    "ADJ": "Administration of Justice", "AJ": "Administration of Justice",
    "CJ": "Administration of Justice", "ADMJ": "Administration of Justice",
    "ANTH": "Anthropology", "ANTHRO": "Anthropology",
    "ARTH": "Art History", "ARTHIST": "Art History",
    "ART": "Art", "ARTS": "Art",
    "ASTR": "Astronomy", "ASTRO": "Astronomy", "ASTRON": "Astronomy",
    "AUTO": "Automotive Technology", "AUT": "Automotive Technology",
    "BIOL": "Biological Sciences", "BIO": "Biological Sciences", "BIOSC": "Biological Sciences",
    "BIOT": "Biotechnology",
    "BUS": "Business", "BUSAD": "Business", "BUSN": "Business", "BADM": "Business",
    "CDEV": "Child Development/Early Childhood Education",
    "CHDEV": "Child Development/Early Childhood Education",
    "CD": "Child Development/Early Childhood Education",
    "ECE": "Child Development/Early Childhood Education",
    "CHEM": "Chemistry",
    "CHS": "Chicano Studies", "CHIC": "Chicano Studies",
    "COMM": "Communication Studies", "SPCH": "Communication Studies", "SPEECH": "Communication Studies",
    "COMP": "Computer Science", "CS": "Computer Science", "CSCI": "Computer Science",
    "CIS": "Computer Information Systems", "CIT": "Computer Information Systems",
    "ITIS": "Computer Information Systems", "CNIT": "Computer Information Systems",
    "DANC": "Dance", "DANCE": "Dance",
    "ECON": "Economics", "EC": "Economics",
    "EDUC": "Education", "EDU": "Education",
    "EET": "Electronic Technology", "ELEC": "Electronics", "ELECT": "Electronics",
    "EMS": "Emergency Medical Technologies", "EMT": "Emergency Medical Technologies",
    "ENGL": "English", "ENG": "English",
    "ENGR": "Engineering", "ENGIN": "Engineering",
    "ESL": "English as a Second Language",
    "ETHN": "Ethnic Studies", "ETHST": "Ethnic Studies", "ES": "Ethnic Studies",
    "FIRE": "Fire Technology", "FIRETEC": "Fire Technology", "FT": "Fire Technology",
    "GEOG": "Geography", "GEO": "Geography",
    "GEOL": "Earth Science",
    "HIST": "History", "HIS": "History",
    "HIT": "Health Information Technology",
    "JOUR": "Journalism", "JOURN": "Journalism",
    "KIN": "Kinesiology", "KINE": "Kinesiology", "PE": "Physical Education", "PHED": "Physical Education",
    "MATH": "Mathematics", "MTH": "Mathematics", "STAT": "Mathematics",
    "MUS": "Music", "MUSIC": "Music", "MUSI": "Music",
    "NURS": "Nursing", "NUR": "Nursing", "RN": "Nursing",
    "NUTR": "Dietetics/Nutritional Science", "NUTRI": "Dietetics/Nutritional Science",
    "PHIL": "Philosophy", "PHILO": "Philosophy",
    "PHYS": "Physics/Astronomy", "PHY": "Physics/Astronomy",
    "POLS": "Political Science", "POLI": "Political Science", "POL": "Political Science",
    "POLSC": "Political Science", "PLSC": "Political Science", "POSC": "Political Science",
    "PSYC": "Psychology", "PSY": "Psychology", "PSYCH": "Psychology",
    "RE": "Real Estate", "REAL": "Real Estate", "RLEST": "Real Estate",
    "SOC": "Sociology", "SOCI": "Sociology", "SOCIO": "Sociology",
    "SPAN": "Foreign Languages", "FREN": "Foreign Languages", "GERM": "Foreign Languages",
    "ITAL": "Foreign Languages", "CHIN": "Foreign Languages", "JAPN": "Foreign Languages",
    "PHOT": "Photography", "PHOTO": "Photography",
    "THTR": "Theater Arts", "THEA": "Theater Arts", "THEAT": "Theater Arts", "DRAM": "Drama/Theater Arts",
    "WELD": "Welding", "WLD": "Welding",
    "WMST": "Women’s Studies", "WS": "Women’s Studies",
}


def is_blank(v):
    return v is None or (str(v).strip().lower() in BLANKS)


def norm(v):
    if v is None:
        return ""
    return re.sub(r"\s+", " ", str(v)).strip()


def ntitle(t):
    t = norm(t).lower()
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def confidence(n_members, n_subjects):
    """Deterministic confidence for an exact-title corroborated cluster."""
    if n_members >= 3 and n_subjects <= 3:
        return 0.85
    if n_members >= 3:
        return 0.72
    return 0.68  # exactly 2 members


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: python3 kb/_seed_coci_minted_mids.py /path/to/MAP_course_list.xlsx")
    xlsx_path = sys.argv[1]

    mq_set = set(json.load(open(os.path.join(REF, "mq_disciplines.json")))["disciplines"])
    for s, disc in DISCIPLINE_MAP.items():
        if disc not in mq_set:
            sys.exit(f"BUG: discipline '{disc}' for subject '{s}' not in MQ list")

    # next M-ID number per subject, continuing from the curated catalog
    next_num = {}
    cc = json.load(open(os.path.join(HERE, "common_courses.json")))
    for k, v in cc.items():
        if v.get("id_system") == "M-ID":
            m = re.match(r"M-ID (\S+) (\d+)", k)
            if m:
                subj, n = m.group(1), int(m.group(2))
                next_num[subj] = max(next_num.get(subj, 98), n)

    import openpyxl
    wb = openpyxl.load_workbook(xlsx_path, read_only=True)
    ws = wb["Sheet2"]

    by_title = defaultdict(list)
    n_rows = excluded_generic = excluded_code = 0
    for s, num, title, c, cc_, desc in ws.iter_rows(min_row=2, values_only=True):
        if not is_blank(c) or not is_blank(cc_):
            continue  # identifier-bearing -> handled by coci_courses.json (Phase A)
        n_rows += 1
        nt = ntitle(title)
        if not nt or len(nt) < 4:
            continue
        if STOP_RE.search(nt):
            excluded_generic += 1
            continue
        if CODE_RE.match(nt):
            excluded_code += 1
            continue
        by_title[nt].append((norm(s), norm(num), norm(title),
                             norm(desc) if not is_blank(desc) else ""))

    clusters = {k: v for k, v in by_title.items() if len(v) >= MIN_MEMBERS}

    courses = {}
    for nt in sorted(clusters):
        members = clusters[nt]
        subj_counts = Counter(m[0] for m in members)
        modal_subject = subj_counts.most_common(1)[0][0]
        n_subjects = len(subj_counts)

        # ID token must be space-free so "M-ID <token> <n>" stays parseable;
        # the readable modal subject is kept in the `subject` field.
        subj_token = re.sub(r"\s+", "", modal_subject) or "MISC"
        next_num[subj_token] = next_num.get(subj_token, 98) + 2
        course_id = f"M-ID {subj_token} {next_num[subj_token]}"

        title_counts = Counter(m[2] for m in members)
        common_title = title_counts.most_common(1)[0][0]
        desc_counts = Counter(m[3] for m in members if m[3])
        description = desc_counts.most_common(1)[0][0] if desc_counts else None

        disc = DISCIPLINE_MAP.get(subj_token) or DISCIPLINE_MAP.get(modal_subject)
        conf = confidence(len(members), n_subjects)

        notes = []
        if disc is None:
            notes.append(f"modal subject '{modal_subject}' not in discipline map; needs review.")
        if n_subjects >= 8:
            notes.append(f"high subject spread ({n_subjects} subjects); possible over-merge — review.")

        courses[course_id] = {
            "course_id": course_id,
            "id_system": "M-ID",
            "ccn_id": None,
            "c_id": None,
            "common_title": common_title,
            "common_title_source": "local catalog (representative/modal)",
            "description": description,
            "description_source": "local catalog (representative/modal)" if description else None,
            "subject": modal_subject,
            "discipline": disc,
            "discipline_provisional": modal_subject,
            "typical_units": None,
            "confidence": conf,
            "corroboration_members": len(members),
            "subject_spread": n_subjects,
            "source_college_count": len(members),
            "classified_at": GENERATED_AT,
            "classified_by": GENERATED_BY,
            "reviewed_at": None,
            "reviewed_by": None,
            "members": [
                {"subject": m[0], "course_number": m[1], "local_title": m[2]}
                for m in sorted(members)
            ],
            "_notes": "; ".join(notes) if notes else None,
        }

    n_high_conf = sum(1 for v in courses.values() if v["confidence"] >= 0.85)
    n_flagged = sum(1 for v in courses.values() if v["_notes"])
    out = {
        "_source": SOURCE_DESC,
        "_status": "STAGING — not merged into curated common_courses.json/course_crosswalk.json.",
        "_method": ("Conservative first cut: exact (case/punctuation-normalized) title match; "
                    "corroborated clusters only (>=%d like courses); generic/admin and "
                    "code-only titles excluded; representative (modal) title/description; "
                    "singletons deferred." % MIN_MEMBERS),
        "_follow_ons": [
            "variant-merging (fuzzy/synonym titles + subject-code canonicalization)",
            "title/description synthesis (vs representative member)",
            "singleton minting (confidence-graded)",
            "discipline completion for unmapped subjects",
            "merge into curated common_courses.json + crosswalk MAP articulations (with college)",
        ],
        "_generated_by": "kb/_seed_coci_minted_mids.py",
        "_generated_at": GENERATED_AT,
        "count": len(courses),
        "count_high_confidence": n_high_conf,
        "count_flagged_for_review": n_flagged,
        "member_courses_consolidated": sum(len(v["members"]) for v in courses.values()),
        "courses": dict(sorted(courses.items())),
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"wrote {OUT}")
    print(f"  source rows w/o C-ID/CCN: {n_rows}")
    print(f"  excluded — generic shells: {excluded_generic}, code-only titles: {excluded_code}")
    print(f"  minted M-IDs: {len(courses)} (high-confidence >=0.85: {n_high_conf}, flagged: {n_flagged})")
    print(f"  member courses consolidated: {out['member_courses_consolidated']}")


if __name__ == "__main__":
    main()
