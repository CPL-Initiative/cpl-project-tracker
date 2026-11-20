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
- Mt. San Antonio's SLO page prints a course's SLOs in a course results block, and trial 44687943107 filed the site's
  course listing (19 lines) as the SLOs of all 12 pages; 6 of them print the block empty.
Pure-stdlib python.
"""
import glob
import gzip
import importlib.util
import json
import os
import re
import sys
import tempfile

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


def filed_trial(run):
    """Each filed page of a trial folder, parsed with the reader as it stands."""
    folder = os.path.join(ROOT, "kb", "course_outcomes", "trial_%s" % run)
    out = []
    for row in json.load(open(os.path.join(folder, "read.json")))["rows"]:
        stem = re.sub(r"[^A-Za-z0-9]+", "_", row["code"])
        out.append(read.parse_page(gzip.open(os.path.join(folder, stem + ".html.gz"), "rt").read(),
                                   open(os.path.join(folder, stem + ".txt")).read(),
                                   read.page_system(row["report"]), row["report"]))
    return out


FRC_TRIAL = filed_trial("44534888428")


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
# GUARD: the trial each record names is filed in the tree, at least 12 of its pages are read, and none of them prints
# an objectives heading (the second reader on #3586: a guard that reads no page passes on nothing).
heads, read_pages = [], {}
for key, why in rec.items():
    for trial in re.findall(r"trial (\d+)", why):
        folder = os.path.join(ROOT, "kb", "course_outcomes", "trial_" + trial)
        d = json.load(open(os.path.join(folder, "read.json"))) if os.path.exists(folder) else {"rows": []}
        for row in d["rows"]:
            if read._OBJ_RECORD.report_key(row.get("report")) != key:
                continue
            txt = os.path.join(folder, re.sub(r"[^A-Za-z0-9]+", "_", row["code"]) + ".txt")
            if not os.path.exists(txt):
                continue
            read_pages[key] = read_pages.get(key, 0) + 1
            if any(read.OBJ_TITLE.match(ln) for ln in open(txt).read().split("\n")):
                heads.append((trial, row["code"]))
check("4 GUARD: each recorded report's named trial is filed, with at least 12 pages read",
      set(read_pages) == set(rec) and all(n >= 12 for n in read_pages.values()), read_pages)
check("4 GUARD: no filed trial page of a recorded report prints an objectives heading", not heads, heads[:4])
check("4 the filed Feather River trial reparses to 68 SLOs and no objectives, the header on none of its 12 pages",
      sum(len(g["outcomes"]) for g in FRC_TRIAL) == 68 and not any(g["objectives"] for g in FRC_TRIAL)
      and not any("Learning Outcomes" in g["outcomes"] for g in FRC_TRIAL) and len(FRC_TRIAL) == 12,
      [len(g["outcomes"]) for g in FRC_TRIAL])

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

# Mt. San Antonio, trial 44687943107: the course results block (BUSR 40 as filed, and ECON 17's empty block), beside
# the site's course listing its text prints under the page's own "Student Learning Outcomes" title.
LISTING = """Student Learning Outcomes
Search Program/Discipline
Search Course
Search Courses
Co-Occurring Disorders (AD 6)
Abnormal Psychology (PSYC 19)
Addiction: Prevention, Intervention, and Recovery (AD 3)
"""
WRAP = ('<html><body><div class="discip_container"><h1>Student Learning Outcomes</h1>%s<div class="show-for-small-only '
        'courseDsplyBtn" style="display:block;"><span class="button"><a href="#panel2">Start a new search</a></span>'
        '</div></div></body></html>')
BUSR_40 = WRAP % ('<a id="slo_course_results"></a><strong>Course Name:</strong> Landlord - Tenant Law<br><strong>Course '
                  'Number:</strong> BUSR 40<br><strong>Outcomes:</strong> <ul><li>Students completing PLGL 40 - Landlord '
                  '- Tenant Law will be able to identify and define what constitutes a habitable residential dwelling as '
                  'well as understanding the legal ramifications to the parties in a non-habitable tenancy situation.</li>'
                  '<li>Students completing PLGL 40 - Landlord - Tenant Law will be able to draft a residential tenancy '
                  'agreement.</li></ul>')
ECON_17 = WRAP % '<a id="slo_course_results"></a>'
got = read.parse_page(BUSR_40, LISTING, "other")
check("6 Mt. San Antonio: the SLOs are the list under Outcomes: in the course results block, each as printed",
      len(got["outcomes"]) == 2 and got["outcomes"][1] == "Students completing PLGL 40 - Landlord - Tenant Law will be "
      "able to draft a residential tenancy agreement." and got["parsed_from"] == "html", got["outcomes"])
got = read.parse_page(ECON_17, LISTING, "other")
check("6 Mt. San Antonio: an empty course results block files no SLOs, never the course listing (19 per page before)",
      got["outcomes"] == [] and got["shape"] == "none" and got["objectives"] == [], got["outcomes"][:2])
check("6 a page with no course results block goes to the readers it went to before",
      read.mtsac_outcomes_from_html("<html><body><h3>Student Learning Outcomes</h3></body></html>") is None)


# 7. Full read 44695707506 (S689): the Reader cut each Mt. San Antonio page's HTML at 400,000 characters, before its
# course results block at about 671,000, so the text reader filed the course listing as every page's SLOs.
class _CutPage:
    def __init__(self, whole):
        self.whole = whole

    def evaluate(self, js, arg=None):
        return LISTING

    def content(self):
        return self.whole


class _CutReader:
    def __init__(self, whole):
        self.page = _CutPage(whole)

    def load(self, url):
        return {"url": url, "final_url": url, "status": 200, "title": "Student Learning Outcomes",
                "body": LISTING, "html": self.page.whole[:read.READER_HTML_CAP], "links": []}


SLO_URL = read.MTSAC_SLO % "BUSR%2040"
whole = BUSR_40.replace("<html><body>", "<html><body>" + "<!-- padding -->" * 50000, 1)
row = read.read_one(_CutReader(whole), {"code": "BUSR 40", "report": SLO_URL})
check("7 a page whose HTML the Reader cut at 400,000 characters is parsed from the browser's whole page",
      len(whole) > read.READER_HTML_CAP and len(row["outcomes"]) == 2 and row["parsed_from"] == "html", row["outcomes"][:1])
got = read.parse_page("<html><body>" + "x" * 100 + "</body></html>", LISTING, "other", SLO_URL)
check("7 GUARD: a Mt. San Antonio SLO page with no course results block in its HTML files no SLOs, never the listing",
      got["outcomes"] == [] and got["shape"] == "none", got["outcomes"][:2])
check("7 another host's page with no block still goes to the text reader",
      read.parse_page("", ADMJ_102, "curriqunet", FRC % 1325)["outcomes"][0] == "Explain the process of adjudication.")

spec_l = importlib.util.spec_from_file_location("course_outcomes_load", os.path.join(ROOT, "kb", "_course_outcomes_load.py"))
load = importlib.util.module_from_spec(spec_l)
spec_l.loader.exec_module(load)
committed = json.load(open(os.path.join(ROOT, "kb", "course_outcomes", "queue.json"))).get("never_load") or {}
with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "mtsac"))
    for run in ("44695707506", "44695707507"):
        json.dump({"run": run, "slugs": "mt_san_antonio", "part": 1, "of": 5, "complete": True, "rows": []},
                  open(os.path.join(tmp, "mtsac", "read_%s_p1of5.json" % run), "w"))
    json.dump({"colleges": {}, "never_load": {"44695707506": "x", "44695707507": "x"}},
              open(os.path.join(tmp, "queue.json"), "w"))
    load.OUT_DIR = tmp
    none_left = load.read_files("mtsac")
    json.dump({"colleges": {}, "never_load": {"44695707506": "x"}}, open(os.path.join(tmp, "queue.json"), "w"))
    newer = load.read_files("mtsac")
check("7 GUARD: the load never takes a read queue.json's never_load names, and a newer read still loads",
      none_left == [] and [os.path.basename(x) for x in newer] == ["read_44695707507_p1of5.json"]
      and {"44695707506", "44535960153"} <= set(committed), (none_left, newer, sorted(committed)))

# 8. Golden West's CourseLeaf outline (S690; f-golden-west-474-header-rows-s689): read 41399075269 filed the list's
# "Course Outcomes" sub-heading, printed with no colon, as outcome 1 in 476 of 568 SLO rows, and 4 rows also carry an
# ILOs block above it. The course's outcomes are the items after the last sub-heading.
def gwc(items):
    lis = "".join("<li>%s</li>" % x for x in items)
    return ("<html><body><div><h3>Course Level Student Learning Outcome(s)</h3><ol>%s</ol>"
            "<h3>Course Objectives</h3></div></body></html>" % lis)


plain = read.cccd_outcomes_from_html(gwc(["Course Outcomes", "Prepare a budget.", "Read a ledger."]))
check("8 Golden West's 'Course Outcomes' with no colon is the lead, never outcome 1",
      plain["lead"] == "Course Outcomes" and plain["outcomes"] == ["Prepare a budget.", "Read a ledger."], plain)
ilos = read.cccd_outcomes_from_html(gwc(["ILOs", "iSLO 2. Broad Knowledge - Demonstrate an understanding",
                                         "Course Outcomes", "Perform jazz combinations.", "Move rhythmically."]))
check("8 an ILOs block above the sub-heading stays out of the course's outcomes (DANC G125)",
      ilos["outcomes"] == ["Perform jazz combinations.", "Move rhythmically."] and ilos["lead"] == "Course Outcomes",
      ilos)
twice = read.cccd_outcomes_from_html(gwc(["Course Outcomes", "Course Outcomes", "Prepare a profit and loss statement."]))
check("8 a sub-heading printed twice (ACCT G163) leaves one outcome, a paragraph",
      twice["outcomes"] == ["Prepare a profit and loss statement."] and twice["shape"] == "paragraph", twice)
typo = read.cccd_outcomes_from_html(gwc(["Couse Outcomes", "Apply the binomial theorem.", "Relate induction."]))
check("8 the misspelled 'Couse Outcomes' is the sub-heading too", typo["lead"] == "Couse Outcomes", typo)
colon = read.cccd_outcomes_from_html(gwc(["Course outcomes:", "Write a program.", "Test a program."]))
real = read.cccd_outcomes_from_html(gwc(["Perform a solo with course outcomes in mind:", "Play scales."]))
check("8 S665's 'Course outcomes:' still reads as the lead; an outcome that only mentions them stays an outcome",
      colon["lead"] == "Course outcomes:" and real["lead"] is None and len(real["outcomes"]) == 2, (colon, real))
gw = []
for p in sorted(glob.glob(os.path.join(ROOT, "kb", "course_outcomes", "cccd", "read_41399075269_p*of2.json"))):
    gw += json.load(open(p))["rows"]
after = [read.cccd_outcomes_from_html(gwc(r["outcomes"])) for r in gw if r.get("parsed_from") == "html" and r["outcomes"]]
check("8 replayed over read 41399075269's 568 HTML rows: no outcome left that is the sub-heading, none emptied",
      len(after) == 568 and all(a and not any(read.CCCD_SUBHEAD.match(x) for x in a["outcomes"]) for a in after),
      len(after))

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print("  %s %s%s" % ("ok  " if ok else "FAIL", name, "" if ok else "  -- %s" % (why,)))
print("\ncourse_outcomes_header_fix_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
