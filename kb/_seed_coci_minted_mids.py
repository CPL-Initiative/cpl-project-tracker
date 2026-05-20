"""
One-shot generator for the Phase B M-ID consolidation seed (STAGING). Emits
THREE files:
  kb/coci_minted_courses.json      — catalog: one identity record per corroborated M-ID
  kb/coci_minted_memberships.json  — provenance/join: M-ID -> [{subject, course_number}]
  kb/coci_minted_singletons.json   — uncorroborated single-source M-IDs (own file)

The catalog/memberships split keeps the (large) per-college membership lists out
of the catalog so git revisions of the reviewable identity layer stay small. The
memberships file is the join table the later articulation phase resolves against
MAP data. Singletons live in their own file because they are bulky and
low-confidence; descriptions are omitted there (volume) and their single member
is embedded (1:1). M-ID numbers continue per-token across corroborated then
singleton minting, so the two never collide.

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
# Two-file split: a lean catalog (one record per M-ID, no inline members) and a
# separate membership index (M-ID -> [{subject, course_number}]). The catalog is
# the reviewable identity layer; the memberships file is the provenance record
# and the join table for the later articulation phase. Keeping the (large)
# membership lists out of the catalog keeps git revisions of the catalog small.
OUT_CATALOG = os.path.join(HERE, "coci_minted_courses.json")
OUT_MEMBERS = os.path.join(HERE, "coci_minted_memberships.json")
# Singletons: titles that occur exactly once (uncorroborated). Each still gets an
# M-ID so a future like-course / articulation can resolve to it. Kept in their own
# file because they are bulky and low-confidence; descriptions are intentionally
# omitted (60k+ rows) to keep the file from ballooning — re-derivable from source
# on the (subject, course_number) join key. Membership is 1:1, so the single
# member is embedded rather than split into a separate index.
OUT_SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
SINGLETON_CONF = 0.5  # uniformly low: single-source, uncorroborated (README rubric 0.40-0.59)

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

    courses = {}      # catalog: course_id -> identity record (no inline members)
    memberships = {}  # provenance/join: course_id -> [{subject, course_number}]
    max_num_by_token = {}  # for the numbering-overflow report
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
        max_num_by_token[subj_token] = next_num[subj_token]

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
            "_notes": "; ".join(notes) if notes else None,
        }
        # Lean membership index: subject + number only (the articulation-phase
        # join key). Title/description live once in the catalog, not repeated here.
        memberships[course_id] = [
            {"subject": m[0], "course_number": m[1]} for m in sorted(members)
        ]

    # Singletons: normalized titles that occur exactly once. Mint an M-ID for each,
    # continuing the SAME per-token numbering above the corroborated M-IDs so numbers
    # never collide. The single member is embedded (1:1 — no separate index needed).
    singleton_titles = {k: v for k, v in by_title.items() if len(v) == 1}
    singletons = {}
    for nt in sorted(singleton_titles):
        (subject, num, title, desc) = singleton_titles[nt][0]
        subj_token = re.sub(r"\s+", "", subject) or "MISC"
        next_num[subj_token] = next_num.get(subj_token, 98) + 2
        course_id = f"M-ID {subj_token} {next_num[subj_token]}"
        max_num_by_token[subj_token] = next_num[subj_token]

        disc = DISCIPLINE_MAP.get(subj_token) or DISCIPLINE_MAP.get(subject)
        # Lean record: ONLY the per-row variable fields. Every constant (id_system,
        # confidence 0.5, corroboration 1, null description/credit_status, provenance,
        # the shared note, etc.) lives once in the file's _record_defaults header —
        # otherwise 57k repetitions balloon the file. (subject, course_number) is the
        # member local course and the articulation join key. discipline is omitted
        # when unmapped (null).
        rec = {"common_title": title, "subject": subject, "course_number": num}
        if disc is not None:
            rec["discipline"] = disc
        singletons[course_id] = rec

    n_high_conf = sum(1 for v in courses.values() if v["confidence"] >= 0.85)
    n_flagged = sum(1 for v in courses.values() if v["_notes"])
    n_members_total = sum(len(v) for v in memberships.values())

    catalog = {
        "_source": SOURCE_DESC,
        "_status": "STAGING — not merged into curated common_courses.json/course_crosswalk.json.",
        "_method": ("Conservative first cut: exact (case/punctuation-normalized) title match; "
                    "corroborated clusters only (>=%d like courses); generic/admin and "
                    "code-only titles excluded; representative (modal) title/description. "
                    "Singletons (uncorroborated single-source courses) are minted "
                    "separately in coci_minted_singletons.json." % MIN_MEMBERS),
        "_follow_ons": [
            "variant-merging (fuzzy/synonym titles + subject-code canonicalization)",
            "title/description synthesis (vs representative member)",
            "discipline completion for unmapped subjects",
            "credit-status join (credit/noncredit/noncredit-enhanced) from forthcoming MAP table",
            "merge into curated common_courses.json + crosswalk MAP articulations (with college)",
        ],
        "_memberships_file": "coci_minted_memberships.json",
        "_singletons_file": "coci_minted_singletons.json",
        "_generated_by": "kb/_seed_coci_minted_mids.py",
        "_generated_at": GENERATED_AT,
        "count": len(courses),
        "count_high_confidence": n_high_conf,
        "count_flagged_for_review": n_flagged,
        "member_courses_consolidated": n_members_total,
        "courses": dict(sorted(courses.items())),
    }
    members_out = {
        "_source": SOURCE_DESC,
        "_status": "STAGING — provenance / join table for kb/coci_minted_courses.json.",
        "_about": ("M-ID -> list of member local courses ({subject, course_number}). "
                   "The (subject, course_number) pair is the join key against MAP "
                   "articulation data (CustomReport: college + course code). Canonical "
                   "identity (title/description/discipline) lives in the catalog file."),
        "_catalog_file": "coci_minted_courses.json",
        "_generated_by": "kb/_seed_coci_minted_mids.py",
        "_generated_at": GENERATED_AT,
        "count": len(memberships),
        "member_courses_total": n_members_total,
        "memberships": dict(sorted(memberships.items())),
    }

    n_singleton_no_disc = sum(1 for v in singletons.values() if "discipline" not in v)
    singletons_out = {
        "_source": SOURCE_DESC,
        "_status": "STAGING — uncorroborated single-source M-IDs; sibling of coci_minted_courses.json.",
        "_method": ("Each normalized title occurring exactly once (after the same generic/admin "
                    "and code-only exclusions as the corroborated catalog) is minted as its own "
                    "M-ID. Confidence is uniformly low (%.2f) — single-source, uncorroborated. "
                    "Descriptions omitted by design (volume); re-derivable from source on the "
                    "(subject, course_number) join key." % SINGLETON_CONF),
        "_record_schema": ("Each record carries ONLY variable fields: common_title, subject, "
                           "course_number, and discipline (omitted when unmapped/null). All "
                           "constant fields are in _record_defaults below — apply them to every "
                           "record to expand to the full catalog schema. (subject, course_number) "
                           "is the member local course and the articulation join key."),
        "_record_defaults": {
            "id_system": "M-ID",
            "ccn_id": None,
            "c_id": None,
            "description": None,
            "description_source": "deferred — single-source; re-derive from source on (subject, course_number)",
            "discipline": None,
            "discipline_provisional": "= record.subject",
            "credit_status": None,
            "typical_units": None,
            "confidence": SINGLETON_CONF,
            "corroboration_members": 1,
            "subject_spread": 1,
            "source_college_count": 1,
            "classified_at": GENERATED_AT,
            "classified_by": GENERATED_BY,
            "reviewed_at": None,
            "reviewed_by": None,
            "_note": ("single-source (uncorroborated); minted to receive future like-course "
                      "matches. credit_status to be joined from the forthcoming MAP table "
                      "(credit / noncredit / noncredit enhanced) on (subject, course_number); "
                      "singletons are expected to skew noncredit."),
        },
        "_catalog_file": "coci_minted_courses.json",
        "_generated_by": "kb/_seed_coci_minted_mids.py",
        "_generated_at": GENERATED_AT,
        "count": len(singletons),
        "count_unmapped_discipline": n_singleton_no_disc,
        "courses": dict(sorted(singletons.items())),
    }

    for path, payload in ((OUT_CATALOG, catalog), (OUT_MEMBERS, members_out),
                          (OUT_SINGLETONS, singletons_out)):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
            f.write("\n")

    overflow = [(t, n) for t, n in max_num_by_token.items() if n >= 100000]
    top_tokens = sorted(max_num_by_token.items(), key=lambda kv: kv[1], reverse=True)[:8]

    print(f"wrote {OUT_CATALOG}")
    print(f"wrote {OUT_MEMBERS}")
    print(f"wrote {OUT_SINGLETONS}")
    print(f"  source rows w/o C-ID/CCN: {n_rows}")
    print(f"  excluded — generic shells: {excluded_generic}, code-only titles: {excluded_code}")
    print(f"  corroborated M-IDs: {len(courses)} (high-confidence >=0.85: {n_high_conf}, flagged: {n_flagged})")
    print(f"  corroborated member courses: {n_members_total}")
    print(f"  singleton M-IDs: {len(singletons)} (unmapped discipline: {n_singleton_no_disc})")
    print(f"  highest M-ID number per token (incl. singletons, top 8): {top_tokens}")
    print(f"  tokens overflowing 6 digits (>=100000): {overflow or 'none'}")


if __name__ == "__main__":
    main()
