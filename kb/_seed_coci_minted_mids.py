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
  3. Singletons — DONE: minted to kb/coci_minted_singletons.json.
  4. Discipline completion — EXPANDED: disciplines now come from
     reference/subject_discipline_map.json (309 subject codes). A long tail of
     ambiguous / college-specific / generic-bucket subjects is deliberately
     left unmapped (see that file's _deliberately_unmapped) pending review.
  5. Merge into curated kb/common_courses.json + crosswalk MAP articulations
     (CustomReport, which carries the college) through these M-IDs.

NUMBERING: M-IDs are numbered per subject token continuing from the highest
existing number in kb/common_courses.json (step 2, matching the seed style),
so a future merge never collides with existing M-IDs.

CSR WIRING (2026-07-10, Sam-authorized — CSR pass CSR0066): the subject token
is now the discipline's CANONICAL SUBJ4 from kb/discipline_canonical_subj4.json
(Rule 7), so new mints can never re-introduce the local-subject variants the
2026-06-12 canonical fold eliminated. Umbrella disciplines (Foreign Languages,
Kinesiology — kb/_row_audit.py UMBRELLA_DISCIPLINES) keep the modal token:
their codes split per subject/language, never collapse to one. Unmapped
disciplines fall back to the modal token. Verifier:
kb/_verify_seeder_canonical.py.

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

# Modal-subject -> official MQ discipline lookup is loaded at runtime from
# reference/subject_discipline_map.json (built by _seed_subject_discipline_map.py).
# Keys there are normalized; normsubj() applies the same normalization here.
DISC_MAP_PATH = os.path.join(REF, "subject_discipline_map.json")
CANON_PATH = os.path.join(HERE, "discipline_canonical_subj4.json")
# Umbrella disciplines mint per-subject/per-language — never collapse to one
# code (kb/_row_audit.py UMBRELLA_DISCIPLINES; Sessions 37/50 scopes).
UMBRELLA_DISCIPLINES = {"Foreign Languages", "Kinesiology", "Agriculture", "Agricultural Production"}


def load_canonical_map():
    """discipline -> canonical SUBJ4, umbrellas and CS1-invalid picks excluded."""
    doc = json.load(open(CANON_PATH))
    out = {}
    for disc, e in (doc.get("disciplines") or {}).items():
        c = e.get("canonical_subj4")
        if disc in UMBRELLA_DISCIPLINES or e.get("is_umbrella"):
            continue
        if c and re.fullmatch(r"[A-Z]{4}", c):
            out[disc] = c
    return out


def canonical_subj_token(disc, modal_token, canon_map):
    """CSR wiring (Rule 7; CSR0066, Sam 2026-07-10): key new mints under the
    discipline's canonical SUBJ4 so they can't re-introduce folded variants.
    Umbrellas and unmapped disciplines keep the modal token."""
    if disc is None:
        return modal_token
    return canon_map.get(disc) or modal_token


# ⚠️ A SUBJECT CODE OF ONE OR TWO CHARACTERS NEVER DECIDES A DISCIPLINE ALONE
# (Sam's cross-list sheet, item 2, 2026-09-22). 25 mapped codes are this short
# and they are ambiguous by construction: `ES` maps to Ethnic Studies here and
# means Exercise Science at many colleges, which is how 31 physical-activity
# courses came to carry an ETHS prefix — Advanced Fencing, Swimming for
# Nonswimmers, Intercollegiate Track, Advanced Golf. Both senses are real in
# the data (Introduction to Racial and Ethnic Groups also carries `ES`), so the
# code cannot be resolved without reading the title.
#
# This is Rule 7's TOP posture applied to a second ambiguous signal: corroborate,
# never gate. A short modal code keeps its discipline only when a LONGER code in
# the same cluster maps to the SAME discipline. Disagreement, or no longer code
# at all, holds the discipline for review rather than substituting a different
# answer — a substitution would be a second guess dressed as a determination.
SHORT_CODE_MAX = 2


def discipline_for_modal(modal_subject, subj_counts, disc_map):
    """The cluster's discipline, and a note when a short modal code held it back.

    Returns (discipline_or_None, note_or_None). `subj_counts` is the Counter of
    every member's subject code, which is where corroboration comes from.
    """
    key = normsubj(modal_subject)
    mapped = disc_map.get(key)
    if len(key) > SHORT_CODE_MAX:
        return mapped, None

    longer = [(s, disc_map.get(normsubj(s))) for s, _ in subj_counts.most_common()
              if len(normsubj(s)) > SHORT_CODE_MAX]
    agreeing = [s for s, d in longer if d and mapped and d == mapped]
    if agreeing:
        return mapped, None
    disagreeing = [(s, d) for s, d in longer if d and d != mapped]
    if disagreeing:
        s, d = disagreeing[0]
        return None, (f"modal subject {modal_subject!r} is a {len(key)}-character code reading "
                      f"{mapped!r}, and {s!r} in the same cluster reads {d!r}; discipline held "
                      f"for review rather than gated on the short code.")
    return None, (f"modal subject {modal_subject!r} is a {len(key)}-character code and nothing "
                  f"longer in the cluster corroborates it; discipline held for review.")


def mint_token(modal_subject, subj_counts):
    """The fallback M-ID token when no discipline supplies a canonical SUBJ4.

    ⚠️ Prefer a code of three characters or more. Holding a short modal's
    discipline (above) would otherwise mint `M-ID ES 100`, and the M-ID shape is
    SUBJ4 — the gate must not buy a correct discipline with a broken identifier.

    A cluster whose every code is short keeps the short token, which is the
    convention already in force for an unmapped discipline. Measured 2026-09-22:
    21 of 15,937 minted M-IDs carry a prefix under four characters (`F M1002`,
    `LT M1001`, `NC M9009`, `TV M1001`, `ART M1235`, `ATC M1001`), so the gate
    follows the existing shape rather than introducing one. It will add a few:
    33 rows read Ethnic Studies on `ES` alone, and no longer code corroborates
    any of them.
    """
    if len(normsubj(modal_subject)) > SHORT_CODE_MAX:
        return re.sub(r"\s+", "", modal_subject) or "MISC"
    for s, _ in subj_counts.most_common():
        if len(normsubj(s)) > SHORT_CODE_MAX:
            return re.sub(r"\s+", "", s) or "MISC"
    return re.sub(r"\s+", "", modal_subject) or "MISC"


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


def normsubj(s):
    """Normalize a subject code to the key form used in subject_discipline_map.json."""
    return re.sub(r"[^A-Z0-9]", "", str(s).upper())


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
    DISCIPLINE_MAP = json.load(open(DISC_MAP_PATH))["map"]
    CANON_MAP = load_canonical_map()  # CSR wiring — Rule 7 / CSR0066
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

        disc, short_note = discipline_for_modal(modal_subject, subj_counts, DISCIPLINE_MAP)
        # ID token must be space-free so "M-ID <token> <n>" stays parseable;
        # the readable modal subject is kept in the `subject` field. The token
        # itself is the CANONICAL SUBJ4 when the discipline has one (CSR
        # wiring — Rule 7 / CSR0066); umbrellas/unmapped keep the modal.
        raw_token = mint_token(modal_subject, subj_counts)
        subj_token = canonical_subj_token(disc, raw_token, CANON_MAP)
        next_num[subj_token] = next_num.get(subj_token, 98) + 2
        course_id = f"M-ID {subj_token} {next_num[subj_token]}"
        max_num_by_token[subj_token] = next_num[subj_token]

        title_counts = Counter(m[2] for m in members)
        common_title = title_counts.most_common(1)[0][0]
        desc_counts = Counter(m[3] for m in members if m[3])
        description = desc_counts.most_common(1)[0][0] if desc_counts else None

        conf = confidence(len(members), n_subjects)

        notes = []
        if short_note:
            notes.append(short_note)
        elif disc is None:
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
        disc = DISCIPLINE_MAP.get(normsubj(subject))
        raw_token = re.sub(r"\s+", "", subject) or "MISC"
        subj_token = canonical_subj_token(disc, raw_token, CANON_MAP)  # CSR wiring
        next_num[subj_token] = next_num.get(subj_token, 98) + 2
        course_id = f"M-ID {subj_token} {next_num[subj_token]}"
        max_num_by_token[subj_token] = next_num[subj_token]
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
            "discipline completion for the remaining ambiguous/long-tail subjects",
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
