#!/usr/bin/env python3
"""kb/_file_noncredit_catalogs.py: the three large noncredit catalogs filed (S700, 2026-11-22, #3655).

Failure modes: a navigation, contents or program line read as a course; a course filed twice; a subject heading taken
from the wrong line (a description's closing parenthetical, a course title that ends in an acronym, an alternate
title); an alternate-title list read as the next course's title; a credit course filed from Santa Ana's PDF; the
pages after a course list read as more courses; a code with no measure line filed with a guessed title.

Run from repo root: python3 tests/noncredit_catalogs_filing_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _file_noncredit_catalogs as F  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


def pdf_log(url, pages):
    out = ["noise", "##### PAGE 1 · answers: courses · read_at: 2026-11-22T01:00:00Z", "url: " + url, "status: 200",
           "kind: pdf", "--- 3 of 9 PDF pages (those naming a keyword) ---"]
    for n, lines in pages:
        out.append("[pdf page %d]" % n)
        out += lines
    out.append("=== COLLEGE PAGE READ JSON BEGIN ===")
    return "\n".join(out)


# ── SDCCE ───────────────────────────────────────────────────────────────────
SD = "https://x/CECatalog.pdf"
SD_PAGES = [
    (80, ["Skilled & Technical Trades", "Required Courses", "INDT 601 Shielded Metal Arc Welding 1"]),
    (82, ["82          San Diego College of Continuing eDuCation • 2026-2027", "Course", "Descriptions"]),
    (83, ["San Diego College of Continuing eDuCation • 2026-2027          83",
          "Older Adult (OA)", "Instruction is specially designed for adults age 55", "and older.",
          "Adult Basic Education (ABED)",
          "Arithmetic Review  ABED 414", "Non-Fee", "Review of basic arithmetic skills. (FT)",
          "Alternate Title(s): Consumer Computation Skills",
          "Basic Education, Language Arts,", "Beginning Level ABED 441", "Non-Fee",
          "This course introduces language arts. (FT)",
          "Alternate Title(s): Couture Tailoring; Machine Tailoring;",
          "Speed Tailoring; Tailoring for Working Women",
          "Supervised Tutoring ABED 445", "Non-Fee",
          "Advisory: Successful completion of Accounting 511,", "Accounting-Beginning or equivalent.",
          "A tutoring lab in the Amazon Web Services (AWS)", "platform. (FT)",
          "Computer and Information Sciences", "(COMP)",
          "Enterprise Networking, Security and", "Automation (ENSA)", "COMP 602    Non-Fee",
          "This course presents fundamentals in LAN. (FT)",
          "Effective Communications – Older Adults         SPEE", "520", "Non-Fee",
          "Interpersonal communication skills. (FT)"]),
    (84, ["84          San Diego College of Continuing eDuCation • 2026-2027",
          "Infant/Toddler Outdoor HMDV 590", "Enrichment", "Non-Fee", "Outdoor learning. (FT)",
          "Physical Education (PHYE)", "Tennis PHYE 561", "Fee", "Basic grips and strokes. (FT)",
          "Arithmetic Review  ABED 414", "Non-Fee", "A second printing. (FT)"]),
    (85, ["San Diego College of Continuing Education", "Contract Faculty", "Acierno, Elizabeth"]),
    (86, ["Arithmetic Review  ABED 999", "Non-Fee", "Never a course: after the faculty pages."]),
]
lines, span = F.sd_lines([("1", pdf_log(SD, SD_PAGES))])
check("SDCCE: the course pages run from the page after the divider to the page before Contract Faculty", span == (83, 84))
rows, info = F.parse_sdcce(lines)
codes = [r["code"] for r in rows]
check("SDCCE: a program page's course line and a line after the course pages are not courses",
      "INDT 601" not in codes and "ABED 999" not in codes)
check("SDCCE: a code printed twice is filed once", F.build_rows.__name__ and codes.count("ABED 414") == 2)
filed, finfo = F.build_rows("san_diego_of_continuing_education", [("1", pdf_log(SD, SD_PAGES))])
fcodes = [r["code"] for r in filed]
check("SDCCE: build_rows files each code once and names it printed twice",
      fcodes.count("ABED 414") == 1 and finfo["codes_printed_twice"] == ["ABED 414"])
by = {r["code"]: r for r in filed}
check("SDCCE: a title wrapped over two lines, after an alternate title", by["ABED 441"]["title"] ==
      "Basic Education, Language Arts, Beginning Level")
check("SDCCE: an alternate-title list is never the next course's title", by["ABED 445"]["title"] == "Supervised Tutoring")
check("SDCCE: a title that ends in an acronym, its code on the fee line", by["COMP 602"]["title"] ==
      "Enterprise Networking, Security and Automation (ENSA)")
check("SDCCE: a code split over two lines", by["SPEE 520"]["title"] == "Effective Communications – Older Adults")
check("SDCCE: a title's last word printed under its code", by["HMDV 590"]["title"] == "Infant/Toddler Outdoor Enrichment")
check("SDCCE: the subject heading is the line directly above the title, wrapped headings joined",
      by["ABED 414"]["subject_name"] == "Adult Basic Education" and by["COMP 602"]["subject_name"] ==
      "Computer and Information Sciences")
check("SDCCE: a description's closing parenthetical is no heading, and an intro line naming another code is none",
      info["headings"].get("AWS") is None and "OA" not in info["headings"])
check("SDCCE: a course with no heading of its own subject gets none", by["SPEE 520"]["subject_name"] is None and
      by["HMDV 590"]["subject_name"] is None)
check("SDCCE: the requisite runs to its period, the description is the rest",
      by["ABED 445"]["requisites"] == ["Advisory: Successful completion of Accounting 511, Accounting-Beginning or equivalent."]
      and by["ABED 445"]["description"].startswith("A tutoring lab"))
check("SDCCE: the heading's lines are not the last course's description", "Computer and Information" not in
      by["ABED 445"]["description"])
check("SDCCE: fee as printed, a fee class kept and marked", by["PHYE 561"]["fee"] == "Fee" and by["ABED 414"]["fee"] == "Non-Fee")

# ── Santa Ana ───────────────────────────────────────────────────────────────
SA = "https://x/SAC_Catalog.pdf"
SA_PAGES = [
    (401, ["Santa Ana College 2026-27 Catalog  – 395", "Theatre Arts (THEA)", "THEA 186", "Voice for the Actor",
           "Unit(s): 3 .000 Class Hours: 36 .000 Lecture total .", "An academic study ."]),
    (434, ["Santa Ana College 2026-27 Catalog  – 428", "Take two courses:  180.0",
           "VBUS 260  Introduction to Microsoft Word  60 .0"]),
    (435, ["Santa Ana College 2026-27 Catalog  – 429", "NONCREDIT COURSES", "Adult Basic Education (ABE)",
           "ABE 010", "Money Matters: Financial Literacy",
           "Credit(s): 0 .000 Class Hours: 36 .000-72 .000 Lecture total .",
           "Prepares the student for the adult world of financial management (CPR)", "Open Entry/Open Exit",
           "ABE 028", "Academic Vocabulary for Math", "Credit(s): 0 .000 Class Hours: 15 .000 Lecture total .",
           "Prerequisite: Completion with a grade of “C” or better or a Passing", "grade in:",
           "Instructs and familiarizes entry-level students .", "Open Entry/Open Exit",
           "ABE 030", "Open Entry/Open Exit",
           "Citizenship (CTZN)", "CTZN 020", "Citizenship",
           "Credit(s): 0 .000 Class Hours: 48 .000-96 .000 Lecture total .",
           "Corequisite: Completion of or concurrent enrollment in: VHLTH",
           "704 Introduction to Biotechnology or BIOL 190 Introduction to", "Biotechnology",
           "Provides basic knowledge for the Citizenship process .",
           "THEA 999", "Credit Course Printed Here", "Unit(s): 3 .000 Class Hours: 54 .000 Lecture total .",
           "Never noncredit ."]),
    (465, ["Santa Ana College 2026-27 Catalog  – 459", "Centennial Education Center Campus Map", "ABE 777",
           "Not A Course"]),
    (470, ["Santa Ana College 2026-27 Catalog  – 464", "ABE 778", "Not A Course Either",
           "Credit(s): 0 .000 Class Hours: 1 .000 Lecture total ."]),
]
salines, saspan = F.sa_lines([("2", pdf_log(SA, SA_PAGES))])
check("Santa Ana: the list opens on NONCREDIT COURSES and ends with the last page that prints a Credit(s) line",
      saspan == (435, 435))
sarows, sainfo = F.parse_santa_ana(salines)
sa = {r["code"]: r for r in sarows}
check("Santa Ana: a credit course is never filed, before the list or inside it", "THEA 186" not in sa and
      "THEA 999" not in sa and sainfo["credit_measures_skipped"] == 1)
check("Santa Ana: a program page's course line and the map page after the list are not courses",
      "VBUS 260" not in sa and "ABE 777" not in sa and "ABE 778" not in sa)
check("Santa Ana: a code with no Credit(s) line is counted, never filed", "ABE 030" not in sa and
      sainfo["codes_without_measure"] == 1)
check("Santa Ana: the heading above the code names the subject", sa["ABE 010"]["subject_name"] == "Adult Basic Education"
      and sa["CTZN 020"]["subject_name"] == "Citizenship")
check("Santa Ana: a description's closing parenthetical is no heading", "CPR" not in sainfo["headings"])
check("Santa Ana: hours as printed, pypdf's spacing folded", sa["ABE 010"]["hours"] == "36.000-72.000")
check("Santa Ana: a requisite that ends on a colon stops before the description",
      sa["ABE 028"]["requisites"] == ["Prerequisite: Completion with a grade of “C” or better or a Passing grade in:"]
      and sa["ABE 028"]["description"] == "Instructs and familiarizes entry-level students.")
check("Santa Ana: a requisite runs on over a bare code and a joining word",
      sa["CTZN 020"]["requisites"][0].endswith("BIOL 190 Introduction to Biotechnology")
      and sa["CTZN 020"]["description"].startswith("Provides basic knowledge"))
check("Santa Ana: the next heading and a code with no measure are not the last course's description",
      "Citizenship" not in sa["ABE 028"]["description"] and "ABE 030" not in sa["ABE 028"]["description"])
check("Santa Ana: Open Entry/Open Exit is the schedule", sa["ABE 010"].get("schedule") == "Open Entry/Open Exit")

# ── Mt. San Antonio ──────────────────────────────────────────────────────────
MT_URL = "https://catalog.mtsac.edu/programs/noncredit-programs/adult-continuing-coursesaz/accs/"
MT = ["Skip to Content AZ Index Catalog Home Institution Home", "Adult & Continuing Education", "Access (ACCS)",
      "Basic Skills (BS)", "Vocational (VOC)", "Access (ACCS)", "(blank)",
      "ACCS BMS  Basic Math Skills", "(blank)", "0 Units", "Lecture: 8-112", "(blank)",
      "Application of basic math skills.", "(blank)", "Course Schedule", "(blank)",
      "VOC ACCT  Not This Page's Subject", "0 Units", "Lecture: 54", "Belongs to the Vocational page.",
      "ACCS ESL25  Language Development for Deaf Students", "0 Units", "Lab: 108", "Prerequisite: ACCS BMS.",
      "Language development.", "Course Schedule", "ACCS ZZZ  No Units Line", "Text.", "Print Options", "ENROLL"]
name, code, mrows, mmissed = F.parse_mtsac_page(MT, "Access (ACCS) < Mt. San Antonio College")
mt = {r["code"]: r for r in mrows}
check("Mt. SAC: the heading is the page's own title, never the navigation list", name == "Access" and code == "ACCS" and
      all(r["subject_name"] == "Access" for r in mrows))
check("Mt. SAC: a course opens on its code line with a Units line under it", sorted(mt) == ["ACCS BMS", "ACCS ESL25"]
      and mt["ACCS BMS"]["title"] == "Basic Math Skills" and mt["ACCS BMS"]["units"] == "0")
check("Mt. SAC: another subject's code on the page is not this page's course; a code with no Units line is counted",
      "VOC ACCT" not in mt and "ACCS ZZZ" not in mt and mmissed == 1)
check("Mt. SAC: hours, requisites and description apart, the entry stopping at Course Schedule",
      mt["ACCS ESL25"]["hours"] == "Lab: 108" and mt["ACCS ESL25"]["requisites"] == ["Prerequisite: ACCS BMS."] and
      mt["ACCS ESL25"]["description"] == "Language development." and
      mt["ACCS BMS"]["description"] == "Application of basic math skills.")

# ── the file's bytes ─────────────────────────────────────────────────────────
doc, _ = F.write("santa_ana", [("2", pdf_log(SA, SA_PAGES))], F.header("santa_ana"), dry=True)
check("a header names the college, its runs, the heading rule and what it did not read",
      doc["college"] == "Santa Ana College" and doc["runs"] == ["2"] and "NONCREDIT COURSES" in doc["parsed_by"]
      and "credit courses" in doc["not_read"] and doc["missed_upper_bound"] == 1)
check("every row carries its source, read time and run", all(r["source_url"] == SA and r["run"] == "2" and r["read_at"]
                                                             for r in doc["rows"]))

print("\n%d of %d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
