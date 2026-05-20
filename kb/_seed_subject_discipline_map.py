"""
One-shot generator for the subject -> MQ-discipline lookup (STAGING reference):
  kb/reference/subject_discipline_map.json

WHY
The M-ID consolidation generator (kb/_seed_coci_minted_mids.py) assigns each
minted course a discipline by mapping its modal subject code to an official MQ
Disciplines List title. Phase B shipped only ~130 subject mappings inline, so
~45k M-IDs (corroborated + singleton) had a null discipline. This pulls the
mapping out into a reusable reference file and expands it to cover the
high-reach unmapped subjects.

POLICY — conservative, because subject codes are NOT globally consistent across
the 115 colleges (e.g. "AT" is Automotive Technology at one college and Athletic
Training at another; "OT" is Office Technologies vs Occupational Therapy). A
single token->discipline map is therefore only safe for codes that are
unambiguous abbreviations of one discipline AND whose sampled course titles
corroborate it. We:
  - MAP recognizable, unambiguous subject codes to a valid MQ discipline.
  - DELIBERATELY LEAVE NULL: generic/noncredit buckets (NC, VOC*, basic-skills),
    genuinely mixed codes (sampled titles span unrelated disciplines), and
    short/ambiguous codes whose meaning varies by college. These stay flagged
    for review rather than risk systematic mislabeling.

This is an AI-assisted DRAFT for human review. Values are validated against
reference/mq_disciplines.json. Keys are normalized: uppercase, alphanumeric only
(spaces/slashes/dots stripped), so "VOC ED" -> "VOCED", "ES/A" -> "ESA",
"E.S.L." -> "ESL". The minted-courses generator normalizes the same way.

Run from repo root:
  python3 kb/_seed_subject_discipline_map.py
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "reference")
OUT = os.path.join(REF, "subject_discipline_map.json")

GENERATED_AT = "2026-05-20"
GENERATED_BY = "claude-opus-4-7 (subject->discipline draft)"


def normsubj(s):
    return re.sub(r"[^A-Z0-9]", "", str(s).upper())


# discipline (must be a valid MQ title) -> list of subject tokens.
# Grouped by discipline for review; inverted to token->discipline on write.
GROUPS = {
    "Business": ["ACCT", "ACCTG", "ACCOUNT", "ACC", "ACCTNG", "BUS", "BUSAD", "BUSN", "BADM"],
    "Management": ["MGMT", "MGT"],
    "Marketing": ["MKTG"],
    "Small Business Development": ["ENP"],
    "Office Technologies": ["BOT", "CAOT", "CABT", "CAT", "OFAD", "COSA"],
    "Real Estate": ["RE", "REAL", "RLEST", "REALES"],
    "Administration of Justice": ["ADJ", "AJ", "CJ", "ADMJ", "ADJU", "ADJUS", "ADMJUS",
                                  "AOJ", "CJA", "LE", "LEPD"],
    "Law": ["LAW"],
    "Legal Assisting": ["PARA"],
    "Court Reporting": ["CTRP"],
    "Anthropology": ["ANTH", "ANTHRO", "ANTHR"],
    "Archaeological Technology": [],
    "Art": ["ART", "ARTS"],
    "Art History": ["ARTH", "ARTHIST"],
    "Commercial Art": ["ARTD"],
    "Multimedia": ["ANIM", "DART", "DAID", "DM"],
    "Media Production": ["MEDIA"],
    "Astronomy": ["ASTR", "ASTRO", "ASTRON"],
    "Physics/Astronomy": ["PHYS", "PHY"],
    "Automotive Technology": ["AUTO", "AUT", "ATEC", "ACRT"],
    "Auto Body Technology": ["AB", "APPR"],
    "Aviation": ["AERO", "AMT"],
    "Biological Sciences": ["BIOL", "BIO", "BIOSC"],
    "Biotechnology": ["BIOT"],
    "Chemistry": ["CHEM"],
    "Child Development/Early Childhood Education": ["CDEV", "CHDEV", "CD", "ECE", "CHLD",
                                                   "CHDV", "CDE"],
    "Chicano Studies": ["CHS", "CHIC", "CHICANO"],
    "Ethnic Studies": ["ETHN", "ETHST", "ES", "ETHS", "AFRAM"],
    "Native American/American Indian Studies": ["AIS"],
    "Communication Studies": ["COMM", "SPCH", "SPEECH"],
    "Computer Science": ["COMP", "CS", "CSCI"],
    "Computer Information Systems": ["CIS", "CIT", "ITIS", "CNIT", "CISC", "CSIS", "CISP",
                                     "CISN", "CNET"],
    "Counseling": ["COUN", "COUNS", "COUNSELING"],
    "Cosmetology": ["COSM", "COS"],
    "Dance": ["DANC", "DANCE", "DNCE", "DAN", "DANCETQ"],
    "Drama/Theater Arts": ["DRAM", "DRAMA"],
    "Theater Arts": ["THTR", "THEA", "THEAT", "TA", "THEATER", "THEATRE", "THE", "TAP"],
    "Film and Media Studies": ["FILM", "CINE", "CINEMA", "RTVF", "FTV"],
    "Economics": ["ECON", "EC"],
    "Education": ["EDUC", "EDU"],
    "Electronic Technology": ["EET"],
    "Electronics": ["ELEC", "ELECT"],
    "Electricity": ["AED"],
    "Air Conditioning, Refrigeration, Heating": ["ACR", "HVACR"],
    "Engineering": ["ENGR", "ENGIN"],
    "Engineering Technology": ["ETEC", "ENGT"],
    "Emergency Medical Technologies": ["EMS", "EMT", "CALJA"],
    "English": ["ENGL", "ENG", "ENGLISH"],
    "English as a Second Language": ["ESL", "EMLS", "ESOL", "ESLN", "ESLA", "ESLV"],
    "English as a Second Language Noncredit 53412": ["ESLNC"],
    "Reading": ["READ"],
    "Fire Technology": ["FIRE", "FIRETEC", "FT", "FIRET", "FIR", "FOT", "FAC", "FFS", "FTEC"],
    "Geography": ["GEOG", "GEO"],
    "Earth Science": ["GEOL", "ESCI"],
    "Environmental Technologies": ["ENVS", "WATR"],
    "Forestry/Natural Resources": ["FOR"],
    "History": ["HIST", "HIS", "HISTORY"],
    "Health": ["HLTH", "HEALTH", "AH"],
    "Health Care Ancillaries": ["MA", "MEDA", "HTEC", "ALH"],
    "Health Information Technology": ["HIT"],
    "Humanities": ["HUM", "HUMAN", "HUMANITIES"],
    "Journalism": ["JOUR", "JOURN"],
    "Kinesiology": ["KIN", "KINE", "KINS", "KNES", "KINES", "KINF", "KINTM", "EXSC", "KINMAJ"],
    "Physical Education": ["PE", "PHED", "ATHL", "ATH", "SPORT", "ICA", "TEAM", "PACT",
                           "FITNS", "FITN", "KINA", "PEAC", "ESA", "ESI", "EST",
                           "KINATH", "KINPE"],
    "Mathematics": ["MATH", "MTH", "STAT", "MAT"],
    "Music": ["MUS", "MUSIC", "MUSI", "MUSC", "MUSA", "MUSP"],
    "Nursing": ["NURS", "NUR", "RN", "ADN", "NRN"],
    "Licensed Vocational Nursing": ["VN"],
    "Dietetics/Nutritional Science": ["NUTR", "NUTRI", "FN"],
    "Philosophy": ["PHIL", "PHILO", "PHILOS"],
    "Political Science": ["POLS", "POLI", "POL", "POLSC", "PLSC", "POSC"],
    "Psychology": ["PSYC", "PSY", "PSYCH"],
    "Sociology": ["SOC", "SOCI", "SOCIO"],
    "Foreign Languages": ["SPAN", "FREN", "GERM", "ITAL", "CHIN", "JAPN", "SPANISH", "SPA",
                          "JAPAN"],
    "Photography": ["PHOT", "PHOTO"],
    "Welding": ["WELD", "WLD"],
    "Women’s Studies": ["WMST", "WS"],
    "Architecture": ["ARCH", "ARC", "ARCHT", "ARCHITECTURE"],
    "Interior Design": ["ID"],
    "Fashion and Related Technologies": ["FASH", "FASHDSN", "FASHION"],
    "Ornamental Horticulture": ["HORT", "LANHT"],
    "Agriculture": ["AG", "AGNR", "ANSC", "ASCI", "AGAS"],
    "Culinary Arts/Food Technology": ["CUL", "CULIN", "CART"],
    "Construction Technology": ["CNST", "CONST", "CT", "ACT"],
    "Building Codes and Regulations": ["BIT"],
    "Plumbing": ["PLUMB"],
    "Machine Tool Technology": ["MACH", "MTT"],
    "Manufacturing Technology": ["MFGT", "DMT"],
    "Sign Language, American": ["ASL", "SIGN", "DEAF", "AMSL"],
    "Radiological Technology": ["RADT", "RAD"],
    "Diagnostic Medical Technology": ["DMS"],
    "Respiratory Technologies": ["RESP", "RSPT", "RC"],
    "Physical Therapy Assisting": ["PTA"],
    "Occupational Therapy Assisting": ["OTA"],
    "Dental Technology": ["DA", "DH"],
    "Library Science": ["LIB", "LIBR"],
    "Vocational": ["VOCED", "VOC", "VOCE"],
    "Parent Education: Noncredit": ["PARN"],
    "Public Safety": ["PUBSERV"],
    "Disabled Student Programs and": ["DSPS"],
}

# Notable subjects we deliberately leave unmapped (kept for reviewer context).
DELIBERATELY_UNMAPPED = {
    "NC": "generic noncredit bucket — not a discipline",
    "BA": "Business Admin code but sampled titles are MS-Office apps — ambiguous",
    "CA": "sampled titles span Windows Server admin AND baking — mixed",
    "AT": "Automotive at some colleges, Athletic Training at others — not globally unique",
    "OT": "Office Technologies vs Occupational Therapy — not globally unique",
    "IS": "Computer Info Systems vs Interdisciplinary Studies — ambiguous",
    "IT": "Info Tech vs Industrial Tech (sampled: hydraulic/mechanical systems) — ambiguous",
    "RT": "Radiologic vs Respiratory therapy — ambiguous",
    "HS": "Health Science vs adult-high-school — ambiguous",
    "NS": "Natural Science vs Nursing Science — ambiguous",
    "ELCT": "sampled titles span A+/OS and AC electrical — mixed",
    "ET": "sampled titles span wastewater and digital electronics — mixed",
    "FST": "sampled titles span Film Studies and fire Rescue Systems — mixed",
    "FS": "Film Festival Studies vs Fire crew — mixed",
    "BSICSKL": "21st-century employability/basic-skills bucket",
    "ABE": "Adult Basic Education bucket",
    "VOC ED is mapped (VOCED)": "note: VOCED/VOC/VOCE -> Vocational; bare 'NC' is not",
}


def main():
    mq = set(json.load(open(os.path.join(REF, "mq_disciplines.json")))["disciplines"])

    token_map = {}
    for disc, tokens in GROUPS.items():
        if disc not in mq:
            raise SystemExit(f"BUG: discipline '{disc}' not in MQ list")
        for t in tokens:
            nt = normsubj(t)
            if nt in token_map and token_map[nt] != disc:
                raise SystemExit(f"BUG: token '{nt}' maps to both "
                                 f"'{token_map[nt]}' and '{disc}'")
            token_map[nt] = disc

    out = {
        "_about": ("Subject-code -> official MQ discipline lookup for the M-ID consolidation "
                   "generator. Keys are normalized (uppercase, alphanumeric only). Values are "
                   "validated against reference/mq_disciplines.json."),
        "_policy": ("Conservative: subject codes are not globally consistent across colleges, so "
                    "only unambiguous codes (corroborated by sampled titles) are mapped. "
                    "Generic/noncredit buckets, mixed-title codes, and short ambiguous codes are "
                    "left unmapped (see _deliberately_unmapped) rather than risk mislabeling."),
        "_status": "STAGING — AI-assisted draft for human review.",
        "_generated_by": "kb/_seed_subject_discipline_map.py",
        "_generated_at": GENERATED_AT,
        "_classified_by": GENERATED_BY,
        "count": len(token_map),
        "map": dict(sorted(token_map.items())),
        "_deliberately_unmapped": DELIBERATELY_UNMAPPED,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {OUT}")
    print(f"  subject tokens mapped: {len(token_map)} -> {len(set(token_map.values()))} disciplines")


if __name__ == "__main__":
    main()
