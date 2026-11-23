#!/usr/bin/env python3
"""Parse the CCCCO Minimum Qualifications handbook's Disciplines Index into kb/reference/mq_handbook_20th.json (S717).

Sam, 2026-11-23: "make sure we have everything from MQs in our dataset" and designate "the 3 levels or types of MQs
and the exceptions for certain licenses and for apprenticeship courses and programs". The 19th-edition file
(kb/reference/mq_sections.json) keeps master's and not-master's apart but folds the specific-degree list into the
any-degree list; this file keeps all three, per CCR 53407(a)(2)-(4) and 53410(a)-(d):

  masters   - Disciplines Requiring a Master's Degree (53410(a)-(b));
  specific  - Master's not generally expected, a bachelor's or associate IN THE DISCIPLINE plus experience (53410(c));
  any       - Master's not generally expected, ANY bachelor's or associate plus experience (53410(d)).

The provisions (PROVISIONS below) are read by hand from the handbook's Title 5 pages, printed pages 56-67 (PDF page =
printed + 6): 53410.1 license alternatives, 53412 noncredit instructors, 53413 apprenticeship instructors, 53414 DSPS,
53415 learning assistance, 53416 work experience, 53417 licensed or certificated occupations.

The PDF stays out of the repo (repo size); its address and sha256 are recorded. Needs pdfplumber:
  python3 kb/_mq_handbook_parse.py --pdf PATH_TO_PDF
"""
import argparse
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "kb/reference/mq_handbook_20th.json"
URL = "https://www.cccco.edu/wp-content/uploads/2026/11/20th-edition-minimum-qualifications-final-a11y.pdf"
INDEX_PAGES = range(11, 23)   # zero-based: PDF pages 12-23, the Disciplines Index
TYPES = {"M": "masters", "S": "specific", "A": "any"}

# Disciplines the index leaves out but the handbook adds (2026 summary of changes, PDF page 9; the master's list).
NOT_IN_INDEX = {"Counseling: Mental Health": {"types": ["masters"], "code": "", "pages": "",
                "why": "New in 2026 (summary of changes, printed page 3) and printed in the master's list; the Disciplines Index omits it."}}

# A discipline the index prints with no list mark: the handbook's own section places it.
LIST_BY_SECTION = {"Citizenship: Noncredit": ["specific"]}

PROVISIONS = {
    "license_53410_1": {"section": "CCR 53410.1", "printed_page": 59, "words": "Professional license as an alternative: a bachelor's in the discipline plus a valid California license substitutes for the 53410 qualifications.",
                        "disciplines": {"Accounting": "Certified Public Accountant", "Counseling": "Marriage and Family Therapist", "Engineering": "Professional Engineer",
                                        "Nutritional Science/Dietetics": "Registered Dietitian"}},
    "credential_required": {"section": "Discipline text (2026 summary of changes)", "printed_page": 3, "words": "The discipline's own minimum qualification requires a license or certificate.",
                            "disciplines": {"Counseling: Mental Health": "License from the California Board of Psychology or Board of Behavioral Sciences (or their minimum qualifications)",
                                            "Uncrewed Aircraft System (UAS) Technology": "FAA Remote Pilot (Part 107) Certificate"}},
    "noncredit_53412": {"section": "CCR 53412", "printed_page": 60, "words": "Noncredit instructors: the credit discipline's qualifications, or the subsection named for the course's kind. A noncredit course with no subsection of its own (COCI's Workforce Preparation, for one) takes its credit discipline's qualifications.",
                        "disciplines": {"Interdisciplinary-Basic Skills: Noncredit": "53412(a)", "Mathematics-Basic Skills: Noncredit": "53412(b)",
                                        "Reading-Basic Skills: Noncredit": "53412(c)", "Writing-Basic Skills: Noncredit": "53412(c)", "Citizenship: Noncredit": "53412(d)",
                                        "English as a Second Language (ESL): Noncredit": "53412(e)", "Health and Safety: Noncredit": "53412(f)", "Home Economics: Noncredit": "53412(g)",
                                        "Older Adults: Noncredit": "53412(h)", "Parent Education: Noncredit": "53412(i)", "Vocational (short-term): Noncredit": "53412(j)"}},
    "apprenticeship_53413": {"section": "CCR 53413", "printed_page": 62, "words": "Apprenticeship instructors of credit and noncredit courses in a program the Division of Apprenticeship Standards approves. A course and program attribute, not a discipline. Credit: an associate degree and four years in the trade; or six years, a journeyman's certificate and twelve units; or six years and ten years as a DAS apprenticeship instructor; or a district's urgency policy. Noncredit: the credit qualifications, or a high school diploma, six years in the occupation (two at journey level) and sixty hours of instruction methods.",
                             "disciplines": {"Vocational (short-term): Noncredit": "53412(j)(4): for an occupation the district offers or has offered apprenticeship in, the noncredit apprenticeship qualifications"}},
    "dsps_53414": {"section": "CCR 53414", "printed_page": 63, "words": "Disabled Students Programs and Services: counselors, adapted physical education, speech and language, credit specialized instruction (a master's in the area and fifteen units), noncredit specialized instruction (53414(e), noncredit vocational courses under (e)(4)), and Learning Disabilities Specialists.",
                   "disciplines": {}},
    "learning_assistance_53415": {"section": "CCR 53415", "printed_page": 65, "words": "Learning assistance instructors: any master's discipline in which assistance is given at the college, or a master's in education or adult learning; none applies where no apportionment is claimed.",
                                  "disciplines": {"Learning Assistance or Learning Skills Coordinators or Instructors, and Tutoring Coordinators": "53415"}},
    "work_experience_53416": {"section": "CCR 53416", "printed_page": 65, "words": "Work experience instructors and coordinators: the qualifications of any discipline in which work experience may be given at the college.",
                              "disciplines": {"Work Experience Instructors or Coordinators": "53416"}},
    "licensed_occupations_53417": {"section": "CCR 53417", "printed_page": 66, "words": "Any credit or noncredit course: a current California license or certificate wherever program or course approval requires one, or local hiring judges it essential. Applies course by course, never to a discipline as a whole.",
                                   "disciplines": {}},
}


def parse(pdf_path):
    import pdfplumber  # noqa: E402
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for i in INDEX_PAGES:
            for t in pdf.pages[i].extract_tables():
                rows += t
    out = {}
    for r in rows:
        if not r or not r[0] or r[0].startswith("DISCIPLINE AND") or len(r) < 6:
            continue
        name = " ".join(r[0].split())
        types = [TYPES[k] for k, c in zip("MSA", r[1:4]) if (c or "").strip()]
        out[name] = {"types": types or LIST_BY_SECTION.get(name, []), "code": " ".join((r[4] or "").split()),
                     "pages": " ".join(str(r[5] or "").split())}
    for k, v in NOT_IN_INDEX.items():
        out.setdefault(k, dict(v, types=list(v["types"])))
    return out


def base_name(s):
    """The discipline without the areas the index prints after it in parentheses."""
    m = re.match(r"^(.*?)\s*\(([^)]*)\)\s*$", s)
    return (m.group(1), m.group(2)) if m and not s.startswith("Specialized Instruction") and "(ESL)" not in s and "(DSPS)" not in s and "(UAS)" not in s and "(short-term)" not in s and "(Adapted)" not in s else (s, "")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--out", default=os.path.join(ROOT, OUT))
    a = ap.parse_args(argv)
    with open(a.pdf, "rb") as f:
        sha = hashlib.sha256(f.read()).hexdigest()
    disc = parse(a.pdf)
    for name, d in disc.items():
        b, areas = base_name(name)
        d["name"], d["areas"] = b, areas
        d["provisions"] = sorted(k for k, p in PROVISIONS.items() if b in p["disciplines"] or name in p["disciplines"]
                                 or (k == "dsps_53414" and ("Disabled Student" in name or "DSPS" in name)))
        d["noncredit"] = name.endswith("Noncredit") or "Noncredit" in name
    doc = {"_what": "The 20th-edition Minimum Qualifications handbook's disciplines, each with its list type or types and the Title 5 provisions that bear on it. Written by kb/_mq_handbook_parse.py from the PDF; the provisions are read by hand from printed pages 56-67.",
           "_source": {"url": URL, "sha256": sha, "edition": 20, "index_pages_pdf": "12-23", "page_rule": "printed page = PDF page - 6"},
           "types": {"masters": "Disciplines requiring a master's degree (CCR 53410(a)-(b))",
                     "specific": "Master's not generally expected; a bachelor's or associate degree in the discipline plus experience (CCR 53410(c))",
                     "any": "Master's not generally expected; any bachelor's or associate degree plus experience (CCR 53410(d))"},
           "provisions": PROVISIONS, "count": len(disc), "disciplines": dict(sorted(disc.items()))}
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
    from collections import Counter
    print(f"[mq_handbook] {len(disc)} disciplines: " + ", ".join(f"{k} {v}" for k, v in Counter("+".join(d["types"]) for d in disc.values()).most_common()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
