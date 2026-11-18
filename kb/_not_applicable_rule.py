#!/usr/bin/env python3
"""The not-applicable title rule: which local course titles name a course that is set up one student at a time
(independent or directed study, an internship or work experience), or that the state's course list carries with a
number and no title (a code-only listing). Such a course is never shared across colleges, so it never needs a shared
course card, and Sam's flag-and-hide rule (2026-11-17) keeps it on record and out of counts, piles and fetch plans.

Ported from the Courses bot's `na_title_rule.py` as its ask describes it (#3480 Source 13, item 4); the script itself
was not posted, so this file is rebuilt from the written rule and its listed checks.

    python3 kb/_not_applicable_rule.py     # runs the fixed checks below and prints PASS or the misses

The rule, in full:

  Independent or directed study ("independent"):
    flagged:     "independent", "directed" or "individual(ized)" right before study, studies, research, readings,
                 projects or problems; "dir study"; "directed (independent) study"; "special studies", "special
                 projects" and "special problems" (Cabrillo, Delta and Butte use the "special" forms).
    not flagged: "independent living", "self-directed", "directed clinical practice", "special topics".

  Internship or work experience ("internship"):
    flagged:     internship(s), intern(s), work experience, "work exp", work-based learning, cooperative (work)
                 education or experience, co-op.
    not flagged: "externship" (a required clinical placement in health programs), international, internet, internal.

  Code-only listing ("code_only"):
    the whole title is a course code in capitals ("AB 389", "PHOTO 171", "ACCTG211"); its letters are at most six,
    or they are a subject code COCI uses somewhere (so "PHYSICS 1" counts). Mixed case ("French 1") and capitalized
    words that are no subject code ("GEOMETRY 2") do not count.

`kind_of(title, subject_codes)` returns the kind or None. A card is not applicable only when every one of its local
courses is; a card's own title never decides it (ETHS M1171 is titled "Individual Study..." while its courses are
"Introduction to Chicano/Latino Studies").
"""
import re
import sys

RULE_VERSION = "2026-11-18.1"

KINDS = ("independent", "internship", "code_only")

_STUDY_OBJ = r"(?:stud(?:y|ies)|research|readings?|projects?|problems?)"
_INDEPENDENT = [
    re.compile(r"(?<![-\w])(?<!self )(?:independent|directed|individuali[sz]ed|individual)\s+" + _STUDY_OBJ + r"\b", re.I),
    re.compile(r"\bdir\.?\s+stud(?:y|ies)\b", re.I),
    re.compile(r"\bdirected\s*\(\s*independent\s*\)\s*stud(?:y|ies)\b", re.I),
    re.compile(r"\bindep\.?\s+stud(?:y|ies)\b", re.I),
    re.compile(r"\bspecial\s+(?:studies|projects?|problems?)\b", re.I),
]
_INTERNSHIP = [
    re.compile(r"\binterns?(?:hips?)?\b", re.I),
    re.compile(r"\bwork\s+exp(?:erience)?\b\.?", re.I),
    re.compile(r"\bwork[\s-]+based\s+learning\b", re.I),
    re.compile(r"\bcooperative\s+(?:work\s+)?(?:education|experience)\b", re.I),
    re.compile(r"\bco-?op\b", re.I),
]
# A course code and nothing else: letters (with an optional second letter group, "WLD T"), then a number with an
# optional letter suffix. Capitals only; the case test is done on the raw title.
_CODE_ONLY = re.compile(r"^\s*([A-Z]{1,8}(?:[ /&-]?[A-Z]{1,4})?)\s*[-.]?\s*(\d{1,4}[A-Z]{0,3}(?:\.\d{1,2})?)\s*$")


def _norm_code(s):
    return re.sub(r"[^A-Z0-9]", "", str(s or "").upper())


def kind_of(title, subject_codes=frozenset()):
    """The not-applicable kind of one local course title, or None for a course that may be shared.

    `subject_codes` is the set of COCI subject codes, normalized to capitals and digits ("PHYSICS", "WLDT")."""
    t = str(title or "").strip()
    if not t:
        return None
    if any(p.search(t) for p in _INDEPENDENT):
        return "independent"
    if any(p.search(t) for p in _INTERNSHIP):
        return "internship"
    m = _CODE_ONLY.match(t)
    if m and t == t.upper():
        letters = re.sub(r"[^A-Z]", "", m.group(1))
        if len(letters) <= 6 or _norm_code(m.group(1)) in subject_codes:
            return "code_only"
    return None


# The fixed checks: (title, the kind it must read as, or None). Twenty-four, as the ask lists them and the edges its
# false-positive read named.
CHECKS = [
    ("Independent Study in Biology", "independent"),
    ("Directed Study", "independent"),
    ("Individualized Projects in Art", "independent"),
    ("Dir Study Business", "independent"),
    ("Directed (Independent) Study", "independent"),
    ("Special Studies", "independent"),
    ("Special Projects in Welding", "independent"),
    ("Independent Living Skills", None),
    ("Self-Directed Study Skills", None),
    ("Directed Clinical Practice", None),
    ("Special Topics in Art", None),
    ("Internship in Music", "internship"),
    ("Work Experience: Occupational", "internship"),
    ("Work Exp Rest/Hospitality", "internship"),
    ("Cooperative Work Experience Education", "internship"),
    ("Medical Assisting Externship", None),
    ("Field Externship for the Paramedic", None),
    ("International Business", None),
    ("Internet Marketing", None),
    ("AB 389", "code_only"),
    ("ACCTG211", "code_only"),
    ("PHYSICS 1", "code_only"),
    ("GEOMETRY 2", None),
    ("French 1", None),
]
CHECK_SUBJECT_CODES = frozenset({"AB", "ACCTG", "PHYSICS", "PHOTO", "FREN", "MATH"})


def self_check():
    """The misses among CHECKS, as (title, expected, got); empty when the rule holds."""
    return [(t, want, kind_of(t, CHECK_SUBJECT_CODES)) for t, want in CHECKS
            if kind_of(t, CHECK_SUBJECT_CODES) != want]


if __name__ == "__main__":
    misses = self_check()
    for t, want, got in misses:
        print("MISS %r: expected %s, got %s" % (t, want, got))
    print("PASS: %d fixed checks" % len(CHECKS) if not misses else "FAIL: %d of %d" % (len(misses), len(CHECKS)))
    sys.exit(1 if misses else 0)
