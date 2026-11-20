#!/usr/bin/env python3
"""Feather River's and Palomar's outline readers (S689; f-outline-readers-need-header-fixes-s685).

The failure modes these checks pin, each on the strings the filed reads printed:
- Feather River's report 485 prints a "Learning Outcomes" column header under its Student Learning Outcomes heading,
  and read 44535960153 filed it as 336 of its 2,072 SLOs, one per page.
- Dropping that header must not turn a first outcome that opens "Students will be able to ..." into the lead-in
  (PHSC 120, trial 44534888428).
- ENVR 241 prints "Student Learning Outcome Pre-test;" in its course content, above the section, and the read filed
  15 content lines as its SLOs.
- Report 485 prints no objectives section; ENVR 041's 167 "objectives" were its Lecture Topic Outline under a line
  reading Course Objectives. The record (REPORTS_WITHOUT_OBJECTIVES) names the report, and the reader files none.
- Palomar's report 99 prints "Specific Course Objectives" right after the SLOs, with "Outcome" and "Objective" column
  headers, and trial 44536105509 filed the objectives and both headers as SLOs on 12 of 12 pages (206 SLOs, 0
  objectives).
Pure-stdlib python.
"""
import glob
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("course_outcomes_read", os.path.join(ROOT, "kb", "_course_outcomes_read.py"))
read = importlib.util.module_from_spec(spec)
spec.loader.exec_module(read)

FRC = "https://frc.curriqunet.com/DynamicReports/AllFieldsReportByEntity/%d?entityType=Course&reportId=485"
PAL = "https://palomar.curriqunet.com/DynamicReports/AllFieldsReportByEntity/12899?entityType=Course&reportId=99"

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def parse(text, report):
    return read.parse_page("", text, read.page_system(report), report)


# Feather River ADMJ 102, trial 44534888428, lines 47-60 of its filed text.
ADMJ_102 = """Lab Topic Outline
N/A
Student Learning Outcomes
Learning Outcomes
Explain the process of adjudication.
Critically analyze and discuss issues of crime and justice from varying perspectives.
Describe theories of criminology used to explain crime and criminality.
Explain the definitions of crime.
Explain the methods, theories, and concepts associated with the sources of crime data, the emerging patterns of criminal activity, and the costs of crime.
Identify and describe special issues in the criminal justice system involving juvenile delinquency, drugs, and the future development.
Explain the history and function of corrections and law enforcement in the United States, including police, probation, parole, community corrections, prisons and jails.
Analyze crime data in the United States.
Apply theories of criminology to create informed positions on controversial issues in criminal justice.
Methods of Instruction
"""
got = parse(ADMJ_102, FRC % 1325)
check("1 Feather River: the 'Learning Outcomes' column header is never an SLO (read 44535960153: 336 of 2,072)",
      len(got["outcomes"]) == 9 and "Learning Outcomes" not in got["outcomes"]
      and got["outcomes"][0] == "Explain the process of adjudication.", got["outcomes"][:2])
check("1 Feather River: the heading as filed is Student Learning Outcomes, and no lead-in",
      got["heading"] == "Student Learning Outcomes" and got["lead"] is None, (got["heading"], got["lead"]))

# Feather River PHSC 120, trial 44534888428, lines 52-57.
PHSC_120 = """Student Learning Outcomes
Learning Outcomes
Students will be able to explain in general terms the evolution and life cycles of stars, galaxies and, more speculatively, our universe.
Students will be able to trace how the history of astronomical observations and ideas have influenced the history of humankind and our cognition of our place in the world and universe.
Students will demonstrate an understanding a number of different classes of objects visible in our cosmic landscape by explaining some of their properties, scales and how we have been able to use scientific models to explain what these objects are.
Methods of Instruction
"""
got = parse(PHSC_120, FRC % 1)
check("2 a first outcome that opens 'Students will be able to explain ...' stays an outcome, never the lead-in",
      len(got["outcomes"]) == 3 and got["lead"] is None and got["outcomes"][0].startswith("Students will be able to explain"),
      (got["lead"], len(got["outcomes"])))
lead = "Upon the completion of this course, the student should be able to:"
got = read.outcomes_of("Student Learning Outcomes\n%s\n1. Do a thing.\n2. Do another.\nMethods of Instruction\n" % lead)
check("2 a lead-in that ends at its colon is still the lead (Las Positas, S664)",
      got["lead"] == lead and got["outcomes"] == ["Do a thing.", "Do another."], got)

# Feather River ENVR 241, read 44535960153: the content line it filed as its heading and the first lines it filed as
# SLOs, then a section shaped like report 485's.
ENVR_241 = """Lecture Topic Outline
Student Learning Outcome Pre-test;
Animal Characteristics and Classification;
Using field guides;
Snow tracking;
Lab Topic Outline
N/A
Student Learning Outcomes
Learning Outcomes
Conduct a wildlife survey.
Methods of Instruction
"""
got = parse(ENVR_241, FRC % 1146)
check("3 a content line that opens with the SLO heading's words ('Student Learning Outcome Pre-test;') heads nothing",
      got["outcomes"] == ["Conduct a wildlife survey."] and got["heading"] == "Student Learning Outcomes", got["outcomes"])
check("3 a heading that goes on after a colon or with a lead-in still heads the section",
      read.outcomes_of("Student Learning Outcomes: Upon completion, students will be able to:\n1. Do a thing.\n")
      ["outcomes"] == ["Do a thing."]
      and read.outcomes_of("Student Learning Outcome(s)\n1. Do a thing.\n")["outcomes"] == ["Do a thing."])

# Feather River ENVR 041, read 44535960153: the first lines it filed as 167 objectives.
ENVR_041 = """Lecture Topic Outline
Course Objectives
Course Overview
Transition from Firefighter 2 to Firefighter 1
Unit 1 – Fireline Reference Materials
Student Learning Outcomes
Learning Outcomes
Demonstrate appropriate communication in wildland fire scenario
Methods of Evaluation
"""
got = parse(ENVR_041, FRC % 1826)
check("4 report 485 prints no objectives section, so a 'Course Objectives' line in its content files none",
      got["objectives"] == [] and got["objectives_heading"] is None
      and got["outcomes"] == ["Demonstrate appropriate communication in wildland fire scenario"], got["objectives"][:2])
check("4 the same lines from another report do file objectives, so the record is what holds them back",
      read.parse_page("", ENVR_041, "curriqunet", PAL)["objectives"][:1] == ["Course Overview"])
rec = read._OBJ_RECORD.REPORTS_WITHOUT_OBJECTIVES
check("4 the record keys a report by host and reportId, and each entry names its trial",
      read._OBJ_RECORD.report_key(FRC % 1826) == "frc.curriqunet.com/485" and read._OBJ_RECORD.report_key(None) is None
      and not read.prints_objectives(FRC % 1) and read.prints_objectives(PAL) and read.prints_objectives(None)
      and all(re.search(r"trial \d+", why) for why in rec.values()), sorted(rec))
# GUARD: where a recorded report's trial folder is filed, none of its pages prints an objectives heading.
heads = []
for folder in sorted(glob.glob(os.path.join(ROOT, "kb", "course_outcomes", "trial_*"))):
    d = json.load(open(os.path.join(folder, "read.json")))
    for row in d["rows"]:
        if read.prints_objectives(row.get("report")):
            continue
        txt = os.path.join(folder, re.sub(r"[^A-Za-z0-9]+", "_", row["code"]) + ".txt")
        if os.path.exists(txt) and any(read.OBJ_TITLE.match(ln) for ln in open(txt).read().split("\n")):
            heads.append((os.path.basename(folder), row["code"]))
check("4 GUARD: no filed trial page of a recorded report prints an objectives heading", not heads, heads[:4])

# Palomar ECON 100, trial 44536105509, lines 39-51.
ECON_100 = """Student Learning Outcomes
Outcome
The student will draw demand and supply curves, label them correctly and use the graphs to explain fluctuating prices of a commodity - for example gasoline.
The students will be able to explain the role of competition in the American economy.
Specific Course Objectives
Objective
Upon successful completion of the course, the student will be able to:
Illustrate understanding of the relevance of economics in their daily life by analyzing current events. They will clearly delineate the difference between fact and opinion and identify the assumptions upon which conclusions are based.
Identify the types of markets and illustrate how differences in the markets affect their production and consumption patterns.
Use economic theory to explore macroeconomic issues.
Evaluate the cost and benefits of global trade
Methods of Instruction
Methods of Instruction may include, but are not limited to, the following:
"""
got = parse(ECON_100, PAL)
check("5 Palomar: the SLOs end at 'Specific Course Objectives', and the 'Outcome' header is never an SLO",
      got["outcomes"] == ["The student will draw demand and supply curves, label them correctly and use the graphs to "
                          "explain fluctuating prices of a commodity - for example gasoline.",
                          "The students will be able to explain the role of competition in the American economy."],
      got["outcomes"])
check("5 Palomar: 'Specific Course Objectives' heads the objectives, the 'Objective' header and the lead-in are not items",
      got["objectives_heading"] == "Specific Course Objectives" and len(got["objectives"]) == 4
      and got["objectives_lead"] == "Upon successful completion of the course, the student will be able to:"
      and got["objectives"][-1] == "Evaluate the cost and benefits of global trade", got["objectives"])

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print("  %s %s%s" % ("ok  " if ok else "FAIL", name, "" if ok else "  -- %s" % (why,)))
print("\ncourse_outcomes_header_fix_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
