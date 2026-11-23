#!/usr/bin/env python3
"""A catalog's subject headings are filed from the lines above each subject's first course, in Title Case
(S698, #3655; Sam, 2026-11-21: "make sure all titles are saved in Title case, not all caps").

Failure modes this file guards:
1. A TITLE SAVED IN CAPITALS, or a short form flattened (ESL read as Esl, HiSET as Hiset).
2. A LINE OF PROSE READ AS A HEADING. A note under the heading, a sentence of the course before, a page number
   and the catalog's running header are never a heading; a mixed-case line is one only when the code's letters
   run through it.
3. THE DEPARTMENT TAKEN AS THE SUBJECT at a college that prints both (Los Angeles Mission).
4. A HEADING INVENTED where the lines hold none: the code is filed with heading null and its lines.

Run from repo root: python3 tests/subject_headings_filer_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _file_subject_headings as F  # noqa: E402
from subject_title_case import title_case as T  # noqa: E402

results = []


def check(name, cond, detail=None):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name + ("" if cond or detail is None else "  [%s]" % (detail,)))


print("title case")
for printed, want in [("ADMINISTRATION OF JUSTICE", "Administration of Justice"), ("Anatomy And Physiology", "Anatomy and Physiology"),
                      ("ENGLISH AS A SECOND LANGUAGE - NONCREDIT", "English as a Second Language - Noncredit"),
                      ("ESL CIVICS", "ESL Civics"), ("HVAC AND REFRIGERATION", "HVAC and Refrigeration"),
                      ("GAME ART & DESIGN", "Game Art & Design"), ("WOMEN'S STUDIES", "Women's Studies"),
                      ("GED/HiSET Preparation", "GED/HiSET Preparation"), ("THE ART OF FILM", "The Art of Film"),
                      ("ANATOMY II", "Anatomy II"), ("English for Multilingual Students", "English for Multilingual Students"),
                      ("COMPUTER AIDED DESIGN/DRAFTING", "Computer Aided Design/Drafting")]:
    check("%s -> %s" % (printed, want), T(printed) == want, T(printed))
for printed, want in [("Work Experience Education (formerly COTR)", "Work Experience Education (formerly COTR)"),
                      ("ANTHROPOLOGY (ANTH, Formerly ANTHRO)", "Anthropology (ANTH, Formerly ANTHRO)"),
                      ("WORK EXPERIENCE (formerly (COTR) cooperative work)", "Work Experience (formerly (COTR) cooperative work)"),
                      ("ART (I) studio", "Art (I) Studio")]:
    check("a code in parentheses keeps its capitals (Sam, 2026-11-23): %s -> %s" % (printed, want), T(printed) == want, T(printed))
check("an empty title stays empty", T("") == "" and T(None) is None)
check("no title comes back in capitals", not any(T(s).isupper() for s in ["PHYSICAL EDUCATION", "ART", "MATHEMATICS"]))

print("take")
check("a name with its code beside it", F.take("ACCTG", ["170", "Course Descriptions", "Accounting (ACCTG)"])[:2] == ("Accounting", "named"))
check("two codes under one heading name both", F.take("STAT", ["Mathematics (MATH & STAT)"]) == ("Mathematics", "named", ["MATH", "STAT"]))
check("a code with an ampersand is one code", F.take("A&P", ["Anatomy And Physiology (A&P)"])[2] == ["A&P"], F.take("A&P", ["Anatomy And Physiology (A&P)"]))
check("another code's named heading is not taken", F.take("BIOL", ["Accounting (ACCTG)", "a sentence of prose here that ends."])[1] == "none")
check("capitals above the course, read through the note under them",
      F.take("WASTE", ["Students must be employed.", "in program.", "WASTEWATER TECHNOLOGY", "Note: There are no limitations (PCAH, 8th", "Edition)."])[:2] == ("WASTEWATER TECHNOLOGY", "caps"))
check("a heading wrapped over two lines is joined",
      F.take("ESL NC", ["ENGLISH AS A SECOND", "LANGUAGE - NONCREDIT"])[0] == "ENGLISH AS A SECOND LANGUAGE - NONCREDIT")
check("page furniture is never the heading", F.take("VISCOM", ["AND PROGRAMS OF STUDY", "341", "Course Descriptions - Credit Courses", "VISUAL COMMUNICATIONS"])[0] == "VISUAL COMMUNICATIONS")
M = {"department": True}
check("Mission: the subject ahead of the dash, the department left", F.take("ACCTG", ["niques for functions.", "ACCOUNTING – BUSINESS AND LAW"], M)[0] == "ACCOUNTING")
check("Mission: the subject on the first line, the department on the second", F.take("ADM JUS", ["ADMINISTRATION OF JUSTICE", "BUSINESS AND LAW"], M)[0] == "ADMINISTRATION OF JUSTICE")
check("Mission: a department wrapped over two lines is still left",
      F.take("ACAD PR", ["COURSE DESCRIPTIONS", "ACADEMIC PREPARATION – MATH, COMPUTER", "SCIENCE, AND ENGINEERING"], M)[0] == "ACADEMIC PREPARATION")
check("a mixed-case line the code runs through", F.take("ANAT", ["under the direction of a supervising instructor.", "Anatomy"])[:2] == ("Anatomy", "fits"))
check("a mixed-case line the code does not run through is no heading, and is kept as a candidate",
      F.take("ASL", ["robotics pathway.", "Sign Language/Interpreter Training"])[1] == "none"
      and F.candidate(["robotics pathway.", "Sign Language/Interpreter Training"]) == "Sign Language/Interpreter Training")
check("prose is never a heading", F.take("HIST", ["of Europe with emphasis upon the rise of the nation state.", "European imperialism is also examined."])[1] == "none"
      and F.candidate(["of Europe with emphasis upon the rise of the nation state.", "European imperialism is also examined."]) is None)
check("fits: the code's letters in order", F.fits("ACCTG", "ACCOUNTING") and F.fits("ADM JUS", "Administration of Justice") and not F.fits("PHYS SC", "PHYSICAL EDUCATION"))

check("capitals that carry a number or a colon are no heading (a C-ID line, a replaced-course notice)",
      F.take("THEATER", ["THEATER ARTS", "C-ID: THTR 111"])[0] == "THEATER ARTS" and not F.is_caps("THIS COURSE REPLACED CO SCI 834 IN"))

print("the log")
LOG = """college page read: Los Angeles Pierce College, 1 pages, 4.0 s between loads

##### PAGE 1 · answers: subject_headings
url: https://www.lapc.edu/catalog.pdf
--- subject context: the lines above each subject's first course (3 subjects) ---
[subject ACCTG · page 170]
  | Course Descriptions
  | Accounting (ACCTG)
  > ACCTG 001 Introductory Accounting I (5) UC:CSU
[subject CINEMA · page 190]
  | support systems.
  | Cinema
  > CINEMA 003 History of Motion Pictures (3)
[subject HIST · page 230]
  | is also examined.
  > HIST 001 Introduction to Western Civilization I (3)

=== COLLEGE PAGE READ JSON BEGIN ===
{"n": 1}
=== COLLEGE PAGE READ JSON END ===
"""
LOG += """college page read: Los Angeles Mission College, 1 pages, 4.0 s between loads
url: https://www.lamc.edu/catalog.pdf
--- subject context: the lines above each subject's first course (5 subjects) ---
[subject ENGLISH · page 120]
  | ENGLISH
  | ARTS, HUMANITIES, AND COMMUNICATION
  > ENGLISH 028 INTERMEDIATE READING AND COMPOSITION
[subject ENGL · page 121]
  | academic research.
  > ENGL C1000 ACADEMIC READING AND WRITING
[subject ARC · page 130]
  | ARCHITECTURE
  > ARC 110 INTRODUCTION TO ARCHITECTURE
[subject ART · page 131]
  | and model building.
  > ART 201 DRAWING I
[subject PHYS SC · page 140]
  | PHYSICAL EDUCATION
  > PHYS SC 001 PHYSICAL SCIENCE I
"""
files = F.build(LOG, 123)
m = {r["code"]: r for r in files["los_angeles_mission"]["rows"]}
check("a code that opens inside another subject's listing takes that listing's heading (ENGL among ENGLISH)",
      m["ENGL"]["heading"] == "English" and m["ENGL"]["rule"] == "section" and m["ENGLISH"]["heading"] == "English")
check("a short code is never read into the listing before it (ART is not Architecture)", m["ART"]["heading"] is None and m["ART"]["rule"] == "none")
check("capitals the code does not run through are a candidate, never the title",
      m["PHYS SC"]["heading"] is None and m["PHYS SC"]["candidate"] == "Physical Education")
files = {"los_angeles_pierce": files["los_angeles_pierce"]}
d = files.get("los_angeles_pierce") or {}
rows = {r["code"]: r for r in d.get("rows") or []}
check("one file per college, named by its slug, with its run and source", list(files) == ["los_angeles_pierce"] and d["run"] == "123" and d["source"] == ["https://www.lapc.edu/catalog.pdf"])
check("each subject is filed with its heading, rule and lines", rows["ACCTG"]["heading"] == "Accounting" and rows["ACCTG"]["rule"] == "named"
      and rows["ACCTG"]["above"] == ["Course Descriptions", "Accounting (ACCTG)"] and rows["ACCTG"]["page"] == 170)
check("a subject with no heading in its lines is filed with none, never a guess", rows["HIST"]["heading"] is None and rows["HIST"]["rule"] == "none" and d["with_heading"] == 2)
check("the printed words stay beside the Title Case title", all("heading_printed" in r for r in rows.values()))
check("the committed files pass their own check", F.check() == [], F.check())

print("%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
