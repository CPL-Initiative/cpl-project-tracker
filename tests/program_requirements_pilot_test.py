#!/usr/bin/env python3
"""The program requirements pilot finds a program's page by its own courses,
and scores a record against the state's closed list.

WHY. Phase 1 of the program requirements harvest
(docs/reference/lanes/program-requirements-harvest.md) reads 20 programs at
five colleges and drafts, for each, which courses are required, which sit in a
choose-from-a-list block, and the open electives. Sam checks the same 20 by
hand. Before a model reads anything, two pure pieces decide whether a draft can
be trusted, and the ways each goes wrong are known in advance:

  * The page finder accepts a page when it names the program's listed courses.
    A course code reaches a page in many spellings: the Program Course File
    stores "REALES007" and "IWAP 40.1" where the catalog prints "REAL ES 7" and
    "IWAP 40.10". A matcher that misses those reads a right page as wrong; one
    that takes "ADJ 1H" for "ADJ 1", "KIN 251-1" for "KIN 251" or "FIRE 12" for
    "FIRE 1" reads a wrong page as right.
  * The scorer is the test every record must pass: coverage of the closed list,
    no invented courses, and unit arithmetic. An honors pair is one choice, not
    two required courses; a "choose 6 units" block adds 6, not the sum of its
    list (the CPL Pathways tab once showed 104.2 units for that reason).
  * The capture pass writes nothing and runs on no schedule: it is a read of
    public college pages under Sam's sheet-23 call 5, and its output is a job
    log.

Each is pinned below against the modules' OWN functions, with no browser and
no network. Run from repo root: python3 tests/program_requirements_pilot_test.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_pilot as P  # noqa: E402
import _program_requirements_score as S  # noqa: E402

failures = []
checks = [0]


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# ── The browser is a runner-only dependency ──────────────────────────────────
check(not {"playwright", "pypdf", "pdfminer"} & set(sys.modules),
      "importing the pilot pulled in playwright, pypdf or pdfminer; the pure half must load without them")

# ── Course codes: every spelling the state file and a catalog use ────────────
MATCH = [
    ("REALES007", "REAL ES 7 Real Estate Finance I"),
    ("REAL ES 1", "REAL ES 1 Real Estate Principles"),
    ("ADJ 1", "ADJ-1 Introduction to the Administration of Justice"),
    ("IWAP 40.1", "IWAP 40.10 Welding I - Reinforcing"),
    ("IWAP 40.05", "IWAP 40.05 Welding III"),
    ("IWAP 40.5", "IWAP 40.50 Mixed Base"),
    ("STATC1000", "STAT C1000 Introduction to Statistics"),
    ("KIN 251-1", "KIN 251-1 Yoga Skills I"),
    ("VOC ED 197CE", "VOC ED 197CE Supervisory/Trainee Real Estate Appraiser"),
    ("VOC HEP", "VOC HEP Healthcare Exam Preparation"),
    ("KIN4", "KIN 4 Nutrition"),
    ("A&P 150", "A&P 150 Introduction to Human Anatomy"),
    ("BUS005", "BUS 5 Business Law I"),
]
REFUSE = [
    ("REAL ES 1", "REAL ES 11 Escrow Principles"),
    ("ADJ 1", "ADJ 1H Honors Introduction"),
    ("ADJ 1", "ADJ 10 Something"),
    ("IWAP 40.1", "IWAP 40.11 Welding II"),
    ("IWAP 40.5", "IWAP 40.05 Welding III"),
    ("STAT C1000", "STAT C1000E Introduction to Statistics"),
    ("KIN 251", "KIN 251-1 Yoga Skills I"),
    ("KIN4", "KIN 40 Something"),
    ("CHLD 66", "CHLD 66L Observation Laboratory"),
    ("FIRE 1", "FIRE 12 Wildland Fire Control"),
    # NOCCCD's campus letter is part of the code (S394): HORT 001 F is not Fundamentals, nor HORT 001 C
    ("HORT 001 F", "HORT 001 Fundamentals of Horticulture"),
    ("HORT 001 F", "HORT 001 C Principles of Horticulture I"),
]
# NOCCCD writes the campus letter as its own word, in the state's file and on the page (S394)
MATCH += [("HORT 001 F", "HORT 001 F · Principles of Horticulture I"),
          ("HORT 001 F", "HORT 1F Principles of Horticulture I"),
          ("ACCT 101A F", "ACCT 101AF Financial Accounting")]
for code, text in MATCH:
    check(P.code_pattern(code).search(text), "%r must be found in %r" % (code, text))
for code, text in REFUSE:
    check(not P.code_pattern(code).search(text), "%r must NOT be found in %r" % (code, text))

check(P.norm_code("IWAP 40.1") == P.norm_code("IWAP 40.10") == "IWAP401",
      "IWAP 40.1 and IWAP 40.10 are one course")
# The state's file stores some slashed subjects without the slash (Crafton Hills' CNAN633,
# printed CNA/N 633): the scorer reads the two as one course, neither missing nor invented (S413).
_cna = S.score({"program": {"total_units": 128, "measure": "hours"}, "blocks": [{"rule": "all", "courses": [
    {"code": "CNA/N 621", "units": 40}, {"code": "CNA/N 622", "units": 40}, {"code": "CNA/N 633", "units": 48}]}]},
    [{"code": "CNA/N 621", "units": None}, {"code": "CNA/N 622", "units": None}, {"code": "CNAN633", "units": None}])
check(_cna["coverage"]["missing"] == [] and _cna["invented"]["codes"] == [],
      "a slashed code on the page is the slash-free code the state's file lists: %r %r"
      % (_cna["coverage"]["missing"], _cna["invented"]["codes"]))
check(S.listed_key("CNA/N 633", {"CNAN633": None}) == "CNAN633" and S.listed_key("KIN/D 130A", {}) == "KIN/D130A",
      "listed_key maps a slashed code to the listed slash-free one, and leaves an unlisted code in its own form")
check(S.listed_key("THART/S 124X2", {"THART124X2": None}) == "THART124X2"
      and S.listed_key("CNA/N 633", {"CNAN633": None, "CNA633": None}) == "CNAN633",
      "listed_key reads a slashed subject the state's file stores without its letters after the slash, "
      "only when the slash-free reading finds none")
check(P.norm_code("REALES007") == P.norm_code("REAL ES 7"),
      "REALES007 and REAL ES 7 are one course")
check(P.norm_code("IWAP 40.5") != P.norm_code("IWAP 40.05"),
      "IWAP 40.5 and IWAP 40.05 are two courses")

# ── The page finder: a page naming the program's courses is its page ─────────
CUL = [{"code": c, "units": u} for c, u in
       [("CUL 20", 2), ("CUL 36", 8.5), ("CUL 37", 8.5), ("CUL 38", 8.5),
        ("KIN4", None), ("MAG 56", 3)]]
page = ("Menu Home Programs " * 1000 + "Culinary Arts Certificate of Achievement "
        "Required courses CUL 36 Introduction 8.5 CUL 37 Intermediate 8.5 "
        "CUL 38 Advanced 8.5 CUL 20 Baking 2 MAG 56 HRM 3 KIN 4 Nutrition 3 "
        "Total 33.5 " + "Footer " * 2000)
found = P.find_codes(page, CUL)
check(P.coverage(found, CUL) == 1.0, "every listed culinary course is on the page")
win = P.text_window(page, found)
check("CUL 36" in win and "Total 33.5" in win and len(win) < len(page) / 2,
      "the window keeps the requirements and drops the site's menus")
export = ("FIRE TECHNOLOGY - CERTIFICATE OF ACHIEVEMENT: MIRAMAR Summary " + "Outcomes text. " * 300
          + "Prerequisite: CUL 36 " + "More outcomes. " * 300 + "Required: CUL 36 8.5 CUL 37 8.5")
ex_found = P.find_codes(export, CUL)
check(P.text_window(export, ex_found, from_start=True).startswith("FIRE TECHNOLOGY - CERTIFICATE")
      and not P.text_window(export, ex_found).startswith("FIRE TECHNOLOGY"),
      "a one-program export keeps its heading; a catalog page's window starts near its first code")
check(P.coverage(P.find_codes("Culinary Arts overview, no courses", CUL), CUL) == 0.0,
      "a title match with none of the courses is not the page")

# ── A run of numbers after one subject (Glendale's 2025-2026 PDF, S408) ───────
# "ACCTG 101, 102; BUSAD 101, 106, 120; CS/IS 100 or 101" lists eight courses with
# three subjects; kerning spaces a three-digit number's digits ("B IOL 1 42, 50").
GCC = [{"code": c} for c in ["ACCTG101", "ACCTG 102", "BUSAD 101", "BUSAD 106", "BUSAD 120",
                             "CS/IS 100", "CS/IS 101", "BUSAD 131", "BUSAD 162", "BUSAD 170",
                             "BIOL 142", "BIOL 50", "CHEM 110", "ENGL 101", "WELD 118"]]
gcc_page = ("Required  Courses : ACCTG 101, 102; BUSAD 101, 106, 120;\nCS/IS 100 or 101.\n"
            "Select one course from the following: BUSAD 131, 141, 144,\n162, 170 \u00b7 BUSINESS "
            "Required  C ourses : B IOL 1 42, 50; CHEM 1 1 0; ENGL 1 01 ;\n"
            "Prerequisite: WELD 121 or WELD 117 and 118. Transfer Credit: CSU")
gcc_found = P.find_codes(gcc_page, GCC)
check(P.coverage(gcc_found, GCC) == 1.0,
      "every course a run of numbers lists after its subject is found: missing %s"
      % sorted({P.norm_code(c["code"]) for c in GCC} - set(gcc_found)))
check(gcc_found["BUSAD162"] == [gcc_page.index("162, 170")],
      "a number in a run is found where it is printed")
for code, text in [("CHEM 3", "CHEM 101 and 3 units of electives"),
                   ("MATH 3", "MATH 100 or 3 years of high school mathematics"),
                   ("ART 13", "ART 1 3 Introduction"),
                   ("BUSAD 102", "ACCTG 101, 102; BUSAD 101"),
                   ("BUSAD 106", "BUSAD 101. Select 106 units")]:
    check(not P.find_codes(text, [{"code": code}]), "%r must NOT be found in %r" % (code, text))

prog = {"title": "Culinary Arts", "award": "Certificate of Achievement requiring 30S/45Q"}
s_prog = P.score_link("Culinary Arts, Certificate of Achievement", "https://x/cul", prog)
s_hub = P.score_link("Programs of Study", "https://x/programs", prog)
s_other = P.score_link("Accounting, A.S.", "https://x/acct", prog)
check(s_prog > s_hub > 0 and s_other <= 0,
      "the program's own link outranks a hub, and a hub outranks another program "
      "(%s, %s, %s)" % (s_prog, s_hub, s_other))
check(P.score_link("Culinary Arts (archived catalog)", "https://x/archive/cul", prog) < 0,
      "an archived catalog's link is refused")
check(P.award_kind("A.S. T Degree") == "adt" and P.award_kind("A.A- T Degree") == "adt"
      and P.award_kind("Noncredit program") == "noncredit"
      and P.award_kind("Certificate of Achievement: 18 or greater") == "coa",
      "award kinds read from the state file's award text")

pages = ["Table of contents Real Estate Salesperson ... 112",
         "REAL ESTATE BROKER REAL ES 1 REAL ES 3",
         "REAL ESTATE SALESPERSON Certificate of Achievement REAL ES 1 REAL ES 3",
         "Choose two: REAL ES 5 REAL ES 9 REAL ES 11",
         "ANTHROPOLOGY ANTHRO 101"]
RE = [{"code": c} for c in ("REAL ES 1", "REAL ES 3", "REAL ES 5", "REAL ES 9", "REAL ES 11")]
check(P.pick_pdf_pages(pages, {"title": "Real Estate Salesperson"}, RE) == [2, 3],
      "the PDF reader takes the program's page and the next page its list runs onto, "
      "not the table of contents: %s" % P.pick_pdf_pages(pages, {"title": "Real Estate Salesperson"}, RE))

# ── Run 2's lessons (37166104191): the wiring, the hubs, the host, the clicks ─
check(P.score_link("Degrees, Courses & Pathways", "https://c/degrees-certificates-courses/", prog) > 0
      and P.score_link("Programs & Services", "https://c/programs-and-services/", prog) <= 0,
      "Cerritos: 'Degrees, Courses & Pathways' is the program index; 'Programs & Services' "
      "is student services")
check(P.score_link("Degree Curricula and Certificate Programs", "", prog) > 0
      and P.score_link("Student Services", "", prog) <= 0,
      "Miramar's program hub counts and its Student Services does not")
check(P.same_site("https://rccd.curriqunet.com/catalog/x", "https://rccd.curriqunet.com/catalog/alias/rcc")
      and not P.same_site("https://www.rcc.edu/programs/culinary-arts.html",
                          "https://rccd.curriqunet.com/catalog/alias/rcc"),
      "the reader stays on the catalog's host")
biz = {"title": "Business Administration 2.0", "award": "A.S. T Degree"}
check(P.clickable_candidate("Business Administration 2.0 - Associate in Science for Transfer Degree: Miramar", biz)
      and not P.clickable_candidate("Describe common business functions and practices.", biz),
      "a program's navigation item is clicked; its learning outcome is not")


class _Page:
    def __init__(self, pages):
        self.pages, self.url = pages, ""

    def evaluate(self, js):
        return self.pages[self.url]

    def wait_for_timeout(self, ms):
        pass


class _Reader:
    """The census Reader's surface, with pages from a dict and no network."""
    def __init__(self, pages):
        self.page, self.loads, self.delay = _Page(pages), 0, 0

    def load(self, url):
        self.loads += 1
        self.page.url = url
        return {"url": url, "status": 200, "access": "ok", "final_url": url,
                "content_type": "text/html"}


HOME = "https://catalog.example.edu/"
CUL_PAGE = HOME + "programs/culinary-arts/"
pages = {
    HOME: {"title": "Catalog", "h1": "", "body": "Catalog home", "content": "",
           "links": [{"text": "Student Services", "href": HOME + "services/"},
                     {"text": "Culinary Arts, Certificate of Achievement", "href": CUL_PAGE},
                     {"text": "Culinary Arts at the college's own site",
                      "href": "https://www.example.edu/culinary/"}],
           "courselists": [], "clickables": []},
    CUL_PAGE: {"title": "Culinary Arts", "h1": "Culinary Arts", "links": [], "content": "",
               "body": "Required: CUL-36 8.5 CUL-37 8.5 CUL-38 8.5 CUL-20 2 MAG-56 3 KIN-4 3",
               "courselists": [], "clickables": []},
}
rows = [{"course_control_number": "CCC%d" % i, "course_code": c, "course_title": c, "units": u,
         "cid": None, "course_college": None, "load_id": "L1"}
        for i, (c, u) in enumerate([("CUL 20", 2), ("CUL 36", 8.5), ("CUL 37", 8.5),
                                    ("CUL 38", 8.5), ("KIN4", None), ("MAG 56", 3)])]
saved = (P.fetch_program, P.fetch_courses, P.fetch_registry)
P.fetch_program = lambda college, cn: {"program_title": "Culinary Arts",
                                       "award": "Certificate of Achievement requiring 30S/45Q",
                                       "status": "Active"}
P.fetch_courses = lambda college, cn: rows      # the PostgREST shape: course_code, not code
P.fetch_registry = lambda college: {"catalog_url": HOME, "catalog_platform": "courseleaf",
                                    "catalog_format": "html_per_program"}
try:
    rec = P.capture(_Reader(pages), {"college": "Riverside City College", "control_number": "22804",
                                     "shape": "cert_electives", "title": "Culinary Arts"}, {})
finally:
    P.fetch_program, P.fetch_courses, P.fetch_registry = saved
check(rec.get("coverage") == 1.0 and (rec.get("source") or {}).get("url") == CUL_PAGE,
      "capture() reads the closed list as Supabase returns it and finds the program's page "
      "(run 2 read every program at 0%%): %s %s" % (rec.get("coverage"), (rec.get("source") or {}).get("url")))
check([t["url"] for t in rec.get("trail") or []] == [HOME, CUL_PAGE],
      "capture() follows the program's link on the catalog's host, not Student Services "
      "or the college's own site: %s" % [t["url"] for t in rec.get("trail") or []])
check(rec.get("closed_list") and rec["closed_list"][0].get("code") == "CUL 20",
      "the record carries the closed list in the scorer's shape")

# ── A procedure record names the catalog's start page and the link to follow ─
# Santa Monica's online catalog links no page for its Barbering A.S. (run
# 37488858548); its procedure record (S339) says: open the front page, follow
# "Download the Full Catalog", read the PDF.
SMC_HOME = "https://catalog.example.edu/current/index.php"
SMC_PDF = "https://catalog.example.edu/mime/media/full-catalog.pdf"
STEP = {"catalog": {"start": SMC_HOME, "follow": "Download the Full Catalog", "format": "pdf"}}
check(P.procedure_catalog(STEP) == {"start": SMC_HOME, "follow": "Download the Full Catalog", "format": "pdf",
                                    "timeout_s": 600}
      and P.procedure_catalog({"catalog": dict(STEP["catalog"], timeout_s=900)})["timeout_s"] == 900
      and P.procedure_catalog({"catalog": dict(STEP["catalog"], timeout_s=5)})["timeout_s"] == 600
      and P.procedure_catalog(None) is None and P.procedure_catalog({"v": 1, "hosts": []}) is None
      and P.procedure_catalog({"catalog": {"start": "catalog.smc.edu", "follow": "x"}}) is None
      and P.procedure_catalog({"catalog": {"start": SMC_HOME, "follow": " "}}) is None
      and P.procedure_catalog({"catalog": {"start": SMC_HOME, "follow": "x", "format": "docx"}}) is None,
      "a procedure's catalog step is read only when it names an http start page, link text and pdf or html, "
      "and waits 600 s for a whole-catalog PDF unless the record names 30-1,500 s (run 37543985175 timed out at 180)")
LINKS = [{"text": "Download the Full Catalog (PDF archive 2019)", "href": SMC_HOME + "?old"},
         {"text": "  Download   the full catalog ", "href": SMC_PDF},
         {"text": "Catalog Home", "href": SMC_HOME}]
check(P.follow_link(LINKS, "Download the Full Catalog") == SMC_PDF
      and P.follow_link(LINKS[:1], "Download the Full Catalog") == SMC_HOME + "?old"
      and P.follow_link(LINKS, "Course Descriptions") is None
      and P.follow_link([{"text": "Download the Full Catalog", "href": "javascript:void(0)"}],
                        "Download the Full Catalog") is None,
      "the link is matched by its text, an exact match before a containing one, and only to an http address")
BARB = [{"course_control_number": "CCC%d" % i, "course_code": c, "course_title": c, "units": 3,
         "cid": None, "course_college": None, "load_id": "L2"}
        for i, c in enumerate(["COSM 10A", "COSM 10B", "COSM 11A", "COSM 11B"])]
smc_pages = {SMC_HOME: {"title": "Catalog", "h1": "", "body": "Santa Monica College catalog", "content": "",
                        "links": LINKS, "courselists": [], "clickables": []}}
pdf_pages = ["Front matter", "Index of programs", "Barbering, Associate in Science\nCOSM 10A 3\nCOSM 10B 3\n"
             "COSM 11A 3\nCOSM 11B 3\nTotal 12", "Biology"]
read = []


def _smc_pdf(reader, url, cache, timeout_ms=180000):
    read.append((url, timeout_ms))
    return {"url": url, "access": "ok", "status": 200, "bytes": 1000, "pages": pdf_pages, "extractor": "pypdf"}


saved = (P.fetch_program, P.fetch_courses, P.fetch_registry, P.read_pdf)
P.fetch_program = lambda college, cn: {"program_title": "Barbering", "award": "A.S. Degree", "status": "Active"}
P.fetch_courses = lambda college, cn: BARB
P.read_pdf = _smc_pdf
ENTRY = {"college": "Santa Monica College", "control_number": "43767", "shape": "map", "title": "Barbering"}
try:
    P.fetch_registry = lambda college: {"catalog_url": SMC_HOME, "catalog_platform": "custom_html",
                                        "catalog_format": "unknown", "procedure": STEP}
    rec_smc = P.capture(_Reader(smc_pages), ENTRY, {})
    P.fetch_registry = lambda college: {"catalog_url": SMC_HOME, "catalog_platform": "custom_html",
                                        "catalog_format": "unknown",
                                        "procedure": {"catalog": {"start": SMC_HOME, "follow": "Full Catalog 2027"}}}
    rec_miss = P.capture(_Reader(smc_pages), ENTRY, {})
finally:
    P.fetch_program, P.fetch_courses, P.fetch_registry, P.read_pdf = saved
check(rec_smc.get("method") == "pdf_pages" and (rec_smc.get("source") or {}).get("url") == SMC_PDF
      and read == [(SMC_PDF, 600000)] and rec_smc.get("coverage") == 1.0
      and (rec_smc.get("source") or {}).get("pages") == [3]
      and (rec_smc.get("procedure_step") or {}).get("href") == SMC_PDF,
      "the capture opens the procedure's start page, follows its link and reads that PDF with the catalog wait: %s %s"
      % (rec_smc.get("method"), (rec_smc.get("source") or {}).get("url")))
check(rec_miss.get("method") == "html_page" and (rec_miss.get("procedure_step") or {}).get("href") is None
      and (rec_miss.get("procedure_step") or {}).get("link_sample")
      and read == [(SMC_PDF, 600000)],
      "a link the start page does not carry is reported with the page's links, and the capture "
      "reads the registry's address instead of guessing")

OFFSITE = "https://www.example.edu/programs/culinary-arts-certificate.html"
pages2 = {
    HOME: {**pages[HOME], "links": [
        {"text": "Culinary Arts, Certificate of Achievement", "href": OFFSITE},  # scores highest
        {"text": "Culinary Arts", "href": CUL_PAGE}]},
    CUL_PAGE: pages[CUL_PAGE],
    OFFSITE: pages[CUL_PAGE],
}
res = P.locate_html(_Reader(pages2), {"title": "Culinary Arts", "award": "Certificate of Achievement"},
                    P.closed_from_rows(rows), HOME, {}, False)
check(OFFSITE not in [t["url"] for t in res["trail"]],
      "a better-worded link off the catalog's host is never loaded: %s" % [t["url"] for t in res["trail"]])

# ── Run 4's lessons (37166814546): CourseLeaf's tables, curriQunet's views ───
table = ('<table class="sc_courselist"><tr><td><a class="bubblelink code">CUL&nbsp;36</a></td>'
         '<td>Introduction</td><td>8.5</td></tr></table>')
kept = P.courseleaf_lists({"courselists": [{"heading": "Requirements", "html": table}]},
                          P.closed_from_rows(rows))
check(len(kept) == 1, "a CourseLeaf table writing CUL&nbsp;36 is kept (run 4 kept none)")
check(P.clickable_candidate("Program Requirements", biz)
      and not P.clickable_candidate("Graduation and Transfer Requirements", biz),
      "inside a program's view, its requirements item is clicked; the college's graduation rules are not")

# ── Miramar (run 4, 0 of 4): the program's view hides its list; its export does not ──
check(P.program_view("Business Administration 2.0 - Associate in Science for Transfer Degree: Miramar", biz)
      and not P.program_view("Degree Curricula and Certificate Programs", biz)
      and not P.program_view("Academic Requirements", biz)
      and not P.program_view("Business Information Technology - Certificate of Achievement: Miramar", biz),
      "the program's own item is its view; the hub, the requirements menu and a "
      "program sharing one title word are not")
VIEW_LINKS = [{"text": "Export Page as PDF",
               "href": "https://sdccd.curriqunet.com/Catalog/Export?id=71&outlineId=20004"},
              {"text": "Academic Requirements", "href": "javascript:void(0)"}]
check(P.export_link(VIEW_LINKS) == "https://sdccd.curriqunet.com/Catalog/Export?id=71&outlineId=20004"
      and P.export_link([{"text": "Academic Requirements", "href": "javascript:void(0)"}]) is None,
      "a view's PDF export is read from its own link")

MIR = "https://sdccd.curriqunet.com/catalog/alias/miramar26-27/iq/"
NAV = ["Academic Requirements", "Degree Curricula and Certificate Programs"]
BIZ_ITEM = "Business Administration 2.0 - Associate in Science for Transfer Degree: Miramar"
BIZ = [{"code": c} for c in ("ACCT 116A", "ACCT 116B", "BUSE 115", "ECON 120", "STATC1000")]
MIR_VIEWS = {   # what each click shows: run 4's trail, cut down
    None: (MIR + "20891", NAV, []),
    NAV[1]: (MIR + "20879/20988", NAV + [BIZ_ITEM],
             [{"text": "Export Page as PDF",
               "href": "https://sdccd.curriqunet.com/Catalog/Export?id=71&outlineId=20879"}]),
    BIZ_ITEM: (MIR + "20879/20988/20004/20338", NAV, VIEW_LINKS),
    NAV[0]: (MIR + "20879/20990", NAV, []),
}


class _ClickPage:
    """A curriQunet catalog: items that open a view when clicked; the view's
    page text names no listed course (Miramar, run 4)."""
    def __init__(self, views=None):
        self.views = views or MIR_VIEWS
        self.view, self.clicks = None, []

    @property
    def url(self):
        return self.views[self.view][0]

    def evaluate(self, js):
        url, items, links = self.views[self.view]
        if js == P.CLICKABLE_JS:
            return items
        return {"title": "View - CurriQunet META", "h1": "", "links": links,
                "body": "Search Export Page as PDF Catalog Navigation " + " ".join(items),
                "content": "", "courselists": [], "clickables": []}

    def get_by_text(self, text, exact=True):
        page = self

        class _Hit:
            class first:
                @staticmethod
                def click(timeout=None):
                    page.clicks.append(text)
                    page.view = text
        return _Hit

    def wait_for_load_state(self, *a, **k):
        pass

    def wait_for_timeout(self, ms):
        pass


EXPORT_TEXT = ("Business Administration 2.0 Associate in Science for Transfer Degree\n"
               "Courses Required for the Major: ACCT 116A Financial 4 ACCT 116B Managerial 4 "
               "ECON 120 Macro 3 STAT C1000 Statistics 4 BUSE 115 Law 3 Total 18")
exports = []


def _fake_pdf(reader, url, cache):
    exports.append(url)
    return {"url": url, "access": "ok", "status": 200, "bytes": 9000, "extractor": "pypdf",
            "pages": [EXPORT_TEXT]}


class _ClickReader:
    def __init__(self, views=None):
        self.page, self.loads, self.delay = _ClickPage(views), 0, 0


saved_pdf = P.read_pdf
P.read_pdf = _fake_pdf
try:
    trail = []
    cr = _ClickReader()
    got = P.click_through(cr, biz, BIZ, trail, cache={})
finally:
    P.read_pdf = saved_pdf
check(got and got["coverage"] == 1.0 and got["field"] == "export_pdf"
      and got["url"].endswith("outlineId=20004") and got["view"].endswith("20004/20338"),
      "Miramar: the program's view is reached and its export names every listed course: %s"
      % ({k: got.get(k) for k in ("coverage", "field", "url", "view")} if got else None))
check(exports == ["https://sdccd.curriqunet.com/Catalog/Export?id=71&outlineId=20004"],
      "only the program's own export is read, never the hub's: %s" % exports)
check(cr.page.clicks == [NAV[1], BIZ_ITEM],
      "the reader stops clicking at the program's view (run 4 went on to "
      "'Academic Requirements'): %s" % cr.page.clicks)

exports.clear()
P.read_pdf = lambda reader, url, cache: {"url": url, "access": "robots_disallow", "pages": []}
try:
    cr2 = _ClickReader()
    got2 = P.click_through(cr2, biz, BIZ, [], cache={})
finally:
    P.read_pdf = saved_pdf
check(got2["coverage"] == 0.0 and got2["field"] != "export_pdf" and cr2.page.clicks == [NAV[1], BIZ_ITEM],
      "an export robots.txt refuses is never read, and the reader still stops at the view")

# Run 7: two items name every title word ("Early Education Entrepreneurship"
# beside "Entrepreneurship"); a set's order picked the wrong one.
ent = {"title": "Entrepreneurship", "award": "A.S. Degree"}
EARLY = "Early Education Entrepreneurship - Associate of Science Degree: Miramar"
ENT = "Entrepreneurship - Associate of Science Degree: Miramar"
check(sorted([EARLY, ENT], key=lambda t: P.click_rank(t, ent))[0] == ENT
      and sorted([ENT, EARLY], key=lambda t: P.click_rank(t, ent))[0] == ENT,
      "among items naming every title word, the one that begins with the title is clicked first")


def _export(oid):
    return [{"text": "Export Page as PDF",
             "href": "https://sdccd.curriqunet.com/Catalog/Export?id=71&outlineId=%s" % oid}]


fire = {"title": "Fire Technology", "award": "A.S. Degree"}
FIRE_AS = "Fire Technology - Associate of Science Degree: Miramar"
FIRE_COA = "Fire Technology - Certificate of Achievement: Miramar"
FIRE_VIEWS = {
    None: (MIR + "20891", NAV, []),
    NAV[1]: (MIR + "20879/20988", NAV + [FIRE_COA, FIRE_AS], []),
    FIRE_AS: (MIR + "20879/20988/20043/20377", NAV + [FIRE_COA, FIRE_AS], _export(20043)),
    FIRE_COA: (MIR + "20879/20988/20044/20378", NAV + [FIRE_COA, FIRE_AS], _export(20044)),
    NAV[0]: (MIR + "20879/20990", NAV, []),
}
FIRE_LIST = [{"code": c} for c in ("FIPT 101", "FIPT 102", "FIPT 103", "EMGM 106")]
FIRE_PAGES = {"20043": "FIRE TECHNOLOGY - A.S. Summary only FIPT 101",
              "20044": "FIRE TECHNOLOGY - CERTIFICATE FIPT 101 3 FIPT 102 3 FIPT 103 3 EMGM 106 0.5"}
P.read_pdf = lambda reader, url, cache: {"url": url, "access": "ok", "status": 200,
                                         "pages": [FIRE_PAGES[url.rsplit("=", 1)[1]]]}
try:
    cr3 = _ClickReader(FIRE_VIEWS)
    got3 = P.click_through(cr3, fire, FIRE_LIST, [], cache={})
finally:
    P.read_pdf = saved_pdf
check(cr3.page.clicks == [NAV[1], FIRE_AS, FIRE_COA] and got3["url"].endswith("outlineId=20044")
      and got3["coverage"] == 1.0,
      "an export that names too few courses leaves only other program items to click, "
      "never 'Academic Requirements': %s" % cr3.page.clicks)

# ── The filed fixtures: real catalog text the matcher must keep reading ──────
fixtures = sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_pilot", "sources", "*.json")))
# Codes a later reading finds that the run did not: Mt. San Antonio prints "CHLD 67 & 67L", and a
# run of numbers after one subject counts toward it since S408.
FIXTURE_GAINS = {"mtsac_33876.json": {"CHLD67L"}}
check(len(fixtures) >= 16, "the capture pass's 16 programs are filed (run 4)")
for path in fixtures:
    with open(path) as fh:
        fx = json.load(fh)
    again = sorted(P.find_codes(fx["text"], fx["closed_list"]))
    gained = set(again) - set(fx["codes_found"])
    check(set(fx["codes_found"]) <= set(again) and gained == FIXTURE_GAINS.get(os.path.basename(path), set()),
          "%s: the matcher still finds on the filed text what it found on the runner, and only the "
          "gains named here (%d now, %d then, gained %s)" % (os.path.basename(path), len(again),
                                                          len(fx["codes_found"]), sorted(gained)))
    check(fx["coverage"] >= 0.5 and fx.get("captured_run"),
          "%s: only a page that named half the listed codes is filed, with its run" % os.path.basename(path))

# ── The filed records: today's scorer must agree with the run that filed them ─
records = sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_pilot", "records", "*.json")))
check(len(records) >= 16, "extraction run 2's 16 records are filed (37171952080)")
for path in records:
    with open(path) as fh:
        fr = json.load(fh)
    with open(os.path.join(ROOT, fr["source_file"])) as fh:
        fx = json.load(fh)
    again = S.score(fr["record"], fx["closed_list"], fx["text"])
    check(again["pass"] == fr["score"]["pass"]
          and again["arithmetic"]["status"] == fr["score"]["arithmetic"]["status"]
          and again["coverage"]["missing"] == fr["score"]["coverage"]["missing"]
          and again["invented"]["codes"] == fr["score"]["invented"]["codes"],
          "%s: today's scorer reads the filed record as the run did (%s %s now, %s %s then)"
          % (os.path.basename(path), again["pass"], again["arithmetic"]["status"],
             fr["score"]["pass"], fr["score"]["arithmetic"]["status"]))

# ── The extraction pass reads fixtures only and calls only the function ──────
import _program_requirements_extract as X  # noqa: E402
check(X.cost("claude-opus-5-5", {"input_tokens": 1_000_000, "output_tokens": 100_000}) == 6.0,
      "a call is priced from its usage at Opus 5.5's rates ($4 in, $20 out per million)")
check(X.cost("some-fallback-model", {"input_tokens": 10}) is None,
      "a model the table does not price reads None, never a wrong number")
check(len(X.load_sources()) == len(fixtures), "the extraction pass reads every filed fixture")
xsrc = open(os.path.join(ROOT, "kb", "_program_requirements_extract.py")).read()
check("/functions/v1/" in xsrc and "/rest/v1/" not in xsrc and "/rpc/" not in xsrc,
      "the extraction pass calls the Edge Function and touches no table")
with open(os.path.join(ROOT, ".github", "workflows", "program-requirements-extract.yml")) as fh:
    xwf = "\n".join(l for l in fh.read().splitlines() if not l.lstrip().startswith("#"))
check(not re.search(r"^\s*schedule:", xwf, re.M) and "sources" not in xwf,
      "the extraction pass runs by hand or when its own code changes, never on a schedule "
      "or because a fixture changed")
# S361: a merge from main carried the script into a branch, and the push ran the full pilot ($1.59).
# On a push, the guard compares the script with main's; the extraction and its setup wait on it.
_guard = re.search(r"id: guard\n\s+if: github\.event_name == 'push'\n(?:.*\n)*?\s+if git diff --quiet FETCH_HEAD -- "
                   r"kb/_program_requirements_extract\.py; then\n\s+echo \"run=no\"", xwf)
_extract = re.search(r"- name: Extract and score\n\s+if: steps\.guard\.outputs\.run != 'no'\n", xwf)
check(bool(_guard) and bool(_extract) and xwf.index("id: guard") < xwf.index("- name: Extract and score"),
      "a push whose extraction script matches main's makes no model calls (the guard runs first, "
      "and Extract and score waits on it); a dispatch always runs")
# S389: #2110 changed the script for record shape 5 and its first push ran the whole pilot ($1.6).
check(re.search(r"id: guard\n(?:.*\n)*?\s+MSG: \$\{\{ github\.event\.head_commit\.message \}\}\n(?:.*\n)*?"
                r"\s+case \"\$MSG\" in\n\s+\"\[extract\]\"\*\) ;;\n\s+\*\) echo \"run=no\"", xwf),
      "a push makes model calls only when its commit message starts with [extract], read through the "
      "environment, never pasted into the script")

# ── The scorer: the plan's three automatic bars ──────────────────────────────
rec = {"program": {"total_units": 33.5, "open_elective_units": 0},
       "blocks": [{"name": "Required", "rule": "all",
                   "courses": [{"code": "CUL 36"}, {"code": "CUL 37"}, {"code": "CUL 38"},
                               {"code": "CUL 20"}, {"code": "MAG 56"},
                               {"code": "KIN 4", "units": 3}]}]}
r = S.score(rec, CUL)
check(r["pass"] and r["coverage"]["share"] == 1.0 and r["arithmetic"]["computed"] == [33.5, 33.5],
      "a complete culinary record passes all three bars: %s" % json.dumps(r))

r = S.score({**rec, "blocks": [{**rec["blocks"][0], "courses": rec["blocks"][0]["courses"][:-1]}]}, CUL)
check(not r["coverage"]["pass"] and r["coverage"]["missing"] == ["KIN4"],
      "a listed course the record leaves out fails coverage")
r = S.score({**rec, "missing_explained": [{"code": "KIN4", "why": "an advisory, not a requirement"}],
             "blocks": [{**rec["blocks"][0], "courses": rec["blocks"][0]["courses"][:-1]}],
             "program": {"total_units": 30.5}}, CUL)
check(r["coverage"]["pass"], "a missing course with a stated reason passes coverage")

r = S.score({**rec, "blocks": [{**rec["blocks"][0],
             "courses": rec["blocks"][0]["courses"] + [{"code": "CUL 99", "units": 0}]}]}, CUL)
check(not r["invented"]["pass"] and r["invented"]["codes"] == ["CUL99"],
      "a course the state list lacks fails as invented")
r = S.score({**rec, "blocks": [{**rec["blocks"][0],
             "courses": rec["blocks"][0]["courses"] + [{"code": "CUL 99", "units": 0,
                                                        "catalog_addition": True}]}]}, CUL)
check(r["invented"]["pass"] and r["pass"], "a flagged catalog addition passes")

# An honors pair is one choice; a choose-units block adds its minimum.
ADJ = [{"code": c, "units": 3} for c in ("ADJ 1", "ADJ 1H", "ADJ 2", "ADJ 3", "ADJ 4", "ADJ 5")]
adj = {"program": {"total_units": 12},
       "blocks": [{"name": "Required Core", "rule": "all",
                   "courses": [{"code": "ADJ 1", "alternatives": ["ADJ 1H"]}, {"code": "ADJ 2"}]},
                  {"name": "List A: select 6 units", "rule": "choose_units", "minimum": 6,
                   "courses": [{"code": "ADJ 3"}, {"code": "ADJ 4"}, {"code": "ADJ 5"}]}]}
r = S.score(adj, ADJ)
check(r["pass"] and r["arithmetic"]["computed"] == [12.0, 12.0],
      "an honors pair counts once and a choose-6-units block adds 6: %s" % json.dumps(r["arithmetic"]))
adj_bad = json.loads(json.dumps(adj))
adj_bad["blocks"][1]["rule"] = "all"
r = S.score(adj_bad, ADJ)
check(not r["arithmetic"]["pass"] and r["arithmetic"]["computed"] == [15.0, 15.0],
      "a choose block misread as all-required overstates the total, and the arithmetic catches it")
adj_n = json.loads(json.dumps(adj))
adj_n["blocks"][1].update(rule="choose_courses", minimum=2)
check(S.score(adj_n, ADJ)["arithmetic"]["computed"] == [12.0, 12.0],
      "choose 2 courses of 3 units each adds 6")
r = S.score({**adj, "program": {"total_units": {"min": 12, "max": 12}}}, ADJ)
check(r["arithmetic"]["pass"], "a total given as a range is read as one")
r = S.score({"program": {}, "blocks": adj["blocks"]}, ADJ)
check(not r["arithmetic"]["pass"] and "names no total" in " ".join(r["arithmetic"]["why"]),
      "a record that names no total cannot pass the arithmetic")

# ── Record shape v2: what extraction run 1 (37167619551) could not hold ──────
# Each case is one of run 1's nine failures, cut to its smallest shape.
# Noncredit hours (Cerritos Energy Corps, "136 Hours"): course units hold hours,
# and the closed list's 0 units are never read in their place.
AED = [{"code": c, "units": 0} for c in ("AED 90.01", "AED 90.02", "AED 90.03", "AED 90.05")]
aed = {"program": {"measure": "hours", "total_units": {"min": 136, "max": 136}},
       "blocks": [{"name": "Required Courses", "rule": "all",
                   "courses": [{"code": c, "units": h} for c, h in
                               zip(("AED 90.01", "AED 90.02", "AED 90.03", "AED 90.05"), (40, 40, 40, 16))]}]}
r = S.score(aed, AED)
check(r["pass"] and r["measure"] == "hours" and r["arithmetic"]["computed"] == [136.0, 136.0],
      "a noncredit program's course hours add to its stated hours: %s" % json.dumps(r["arithmetic"]))
aed_blank = json.loads(json.dumps(aed))
for c in aed_blank["blocks"][0]["courses"]:
    c["units"] = None
r = S.score(aed_blank, AED)
check(not r["arithmetic"]["pass"] and r["arithmetic"]["status"] == "incomplete",
      "in hours, a course with no printed hours never borrows the state file's 0 units")

# One of several whole blocks (Cerritos Ironworker: Reinforcing 15 or Structural 19).
IW = [{"code": c, "units": u} for c, u in
      [("IWAP 40.07", 4), ("IWAP 40.12", 2), ("IWAP 41.03", 1), ("IWAP 40.21", 2.5), ("IWAP 41.06", 2)]]
iw = {"program": {"total_units": {"min": 7, "max": 8.5}},
      "blocks": [{"name": "Core", "rule": "all", "courses": [{"code": "IWAP 40.07"}]},
                 {"name": "Option 1", "rule": "all", "option_group": "Option",
                  "courses": [{"code": "IWAP 40.12"}, {"code": "IWAP 41.03"}]},
                 {"name": "Option 2", "rule": "all", "option_group": "Option",
                  "courses": [{"code": "IWAP 40.21"}, {"code": "IWAP 41.06"}]}]}
r = S.score(iw, IW)
check(r["pass"] and r["arithmetic"]["computed"] == [7.0, 8.5],
      "an option group runs from its smallest block to its largest: %s" % json.dumps(r["arithmetic"]))
iw_flat = json.loads(json.dumps(iw))
for b in iw_flat["blocks"]:
    b.pop("option_group", None)
check(not S.score(iw_flat, IW)["arithmetic"]["pass"],
      "two options read as two required blocks overstate the total, and the arithmetic catches it")

# A block total the catalog prints (Mt. San Antonio Fire "6-22 units"; Riverside List B "6-7").
FIRE = [{"code": "FIRE 1", "units": 3}, {"code": "FIRE 6", "units": 3}, {"code": "FIRE86", "units": None}]
fire = {"program": {"total_units": {"min": 9, "max": 25}},
        "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "FIRE 1"}]},
                   {"name": "Electives", "rule": "choose_courses", "minimum": 2,
                    "stated": {"min": 6, "max": 22},
                    "courses": [{"code": "FIRE 6"}, {"code": "FIRE 86"}]}]}
r = S.score(fire, FIRE)
check(r["pass"] and r["arithmetic"]["computed"] == [9.0, 25.0],
      "a choose block whose courses lack units counts its printed total: %s" % json.dumps(r["arithmetic"]))
adj_b = json.loads(json.dumps(adj))
adj_b["blocks"][1]["stated"] = {"min": 6, "max": 7}
check(S.score({**adj_b, "program": {"total_units": {"min": 12, "max": 13}}}, ADJ)["arithmetic"]["pass"],
      "a choose-units block counts the range the catalog prints for it")

# A range printed beside a course (Mt. San Antonio MICR 1 "4-5").
MICR = [{"code": "MICR1", "units": None}, {"code": "NURS 114", "units": 3}]
micr = {"program": {"total_units": {"min": 7, "max": 8}},
        "blocks": [{"name": "Required", "rule": "all",
                    "courses": [{"code": "MICR 1", "units": 4, "units_max": 5}, {"code": "NURS 114"}]}]}
check(S.score(micr, MICR)["arithmetic"]["computed"] == [7.0, 8.0],
      "a course printed '4-5' runs from units to units_max")

# Alternatives as objects carry their own flag (Riverside SOC-48 beside STAT C1000).
STAT = [{"code": "STAT C1000", "units": 4}]
stat = {"program": {"total_units": 4},
        "blocks": [{"name": "Statistics", "rule": "all",
                    "courses": [{"code": "STAT C1000", "catalog_addition": False,
                                 "alternatives": [{"code": "SOC-48", "units": 4,
                                                   "catalog_addition": True}]}]}]}
r = S.score(stat, STAT)
check(r["pass"] and r["invented"]["flagged"] == ["SOC48"],
      "an alternative flagged as a catalog addition passes: %s" % json.dumps(r["invented"]))
stat["blocks"][0]["courses"][0]["alternatives"][0]["catalog_addition"] = False
check(not S.score(stat, STAT)["invented"]["pass"],
      "an unflagged alternative the state list lacks fails as invented (run 1 let SOC-48 through)")
check(S.score({**adj, "blocks": [{**adj["blocks"][0]}, adj["blocks"][1]]}, ADJ)["pass"],
      "version 1's bare-code alternatives still score")

# A catalog that prints no figure at all (Mt. San Antonio Vocational Nursing).
VN = [{"code": c, "units": 0} for c in ("VOC VN100", "VOC VN101")]
vn = {"program": {"measure": "hours", "total_units": {"min": None, "max": None}},
      "blocks": [{"name": "Required Courses", "rule": "all",
                  "courses": [{"code": "VOC VN100", "units": None}, {"code": "VOC VN101", "units": None}]}]}
r = S.score(vn, VN, "Required Courses Course Prefix Course Name Units VOC VN100 VOC VN101")
check(r["pass"] and r["arithmetic"]["status"] == "unstated",
      "a page that prints no hours, units or total leaves nothing to add: %s" % json.dumps(r["arithmetic"]))
r = S.score(vn, VN, "VOC VN100 Anatomy (40 Hours) VOC VN101 Fundamentals (60 Hours)")
check(not r["pass"] and "40 Hours" in " ".join(r["arithmetic"]["why"]),
      "a record that drops hours the page prints fails, naming them")
check(not S.score(vn, VN)["pass"], "without the catalog text, a record that states no figure cannot pass")
r = S.score({"program": {}, "blocks": [{"name": "Core", "rule": "all",
                                         "courses": [{"code": "CUL 36"}]}]}, CUL, "CUL 36")
check(not r["arithmetic"]["pass"] and r["arithmetic"]["status"] == "incomplete",
      "a credit record with no total is never 'unstated': the state file holds its units")

# Record shape 5 (Sam, Open Asks Sheet 78 card 2, 2026-10-14, "Record both figures"): a page that
# prints the degree total with general education and no major total is checked against the degree.
AUT = [{"code": c, "units": u} for c, u in (("AUT 100", 24), ("AUT 120", 3), ("AUT 121", 3), ("AUT 122", 3))]
aut = {"program": {"total_units": {"min": None, "max": None}, "degree_total": {"min": 64, "max": 68},
                   "ge_units": {"min": 34, "max": 38}, "ge_pattern": "CalGETC", "electives_fill_degree": False},
       "blocks": [{"name": "Required Core", "rule": "all", "courses": [{"code": "AUT 100", "units": 24}]},
                  {"name": "Electives", "rule": "choose_units", "minimum": 6, "stated": {"min": 6, "max": 6},
                   "courses": [{"code": "AUT 120", "units": 3}, {"code": "AUT 121", "units": 3},
                               {"code": "AUT 122", "units": 3}]}]}
AUT_TEXT = "Required Core 24 units AUT 100 Electives 6 units AUT 120 AUT 121 AUT 122 CalGETC 34 - 38 Total 64 - 68"
r = S.score(aut, AUT, AUT_TEXT)
check(r["pass"] and r["arithmetic"]["against"] == "degree" and r["arithmetic"]["computed"] == [64.0, 68.0]
      and r["arithmetic"]["stated"] == [64.0, 68.0],
      "Palo Verde Automotive Technology A.S.: a 24-unit core, 6 units of electives and CalGETC 34-38 "
      "make the 64-68 the page prints for the degree: %s" % json.dumps(r["arithmetic"]))
r = S.score({**aut, "program": {**aut["program"], "degree_total": {"min": 60, "max": 60}}}, AUT, AUT_TEXT)
check(not r["pass"] and r["arithmetic"]["status"] == "unequal" and r["arithmetic"]["against"] == "degree",
      "blocks and general education that miss the printed degree total fail as unequal")
r = S.score({**aut, "program": {**aut["program"], "ge_units": {"min": None, "max": None}}}, AUT, AUT_TEXT)
check(not r["pass"] and r["arithmetic"]["status"] == "incomplete"
      and "no units for it" in " ".join(r["arithmetic"]["why"]),
      "a degree total with a general education pattern and no units for it cannot be added up")
r = S.score({**aut, "program": {**aut["program"], "total_units": {"min": 30, "max": 30}}}, AUT, AUT_TEXT)
check(r["pass"] and r["arithmetic"]["against"] == "program" and r["arithmetic"]["computed"] == [30.0, 30.0],
      "a major total, when the page prints one, is still the one checked")
check(S.has_figure({"program": {"degree_total": {"min": 60, "max": 60}}, "blocks": []}),
      "a degree total is a figure: such a record is never 'unstated'")

# Psychology AA-T: Total 60 = a 19-21-unit major, CalGETC 34-38 and transferable electives as needed.
PSY = [{"code": "PSYC C1000", "units": 3}, {"code": "STAT C1000", "units": 4},
       {"code": "PSY 107", "units": 3}, {"code": "PSY 108", "units": 3}, {"code": "BIO 101", "units": 5},
       {"code": "PSY 115", "units": 3}, {"code": "PSY 116", "units": 3}]
psy = {"program": {"total_units": {"min": None, "max": None}, "degree_total": {"min": 60, "max": 60},
                   "ge_units": {"min": 34, "max": 38}, "ge_pattern": "CalGETC", "electives_fill_degree": True},
       "blocks": [{"name": "Required Core", "rule": "all",
                   "courses": [{"code": "PSYC C1000", "units": 3}, {"code": "STAT C1000", "units": 4},
                               {"code": "PSY 107", "units": 3}]},
                  {"name": "List A", "rule": "choose_courses", "minimum": 1, "stated": {"min": 3, "max": 5},
                   "courses": [{"code": "PSY 108", "units": 3}, {"code": "BIO 101", "units": 5}]},
                  {"name": "List B", "rule": "choose_courses", "minimum": 2, "stated": {"min": 6, "max": 6},
                   "courses": [{"code": "PSY 115", "units": 3}, {"code": "PSY 116", "units": 3}]}]}
PSY_TEXT = "Psychology (Total 60) Required Core ... CalGETC 34 - 38 Transferable electives to reach 60 units"
r = S.score(psy, PSY, PSY_TEXT)
check(r["pass"] and r["arithmetic"]["status"] == "equal" and r["arithmetic"]["computed"] == [53.0, 59.0]
      and r["arithmetic"]["fill"] == [1.0, 7.0],
      "Psychology AA-T: a 19-21-unit major and CalGETC 34-38 fit the 60, and the electives make up "
      "1 to 7 units: %s" % json.dumps(r["arithmetic"]))
r = S.score(psy, PSY, PSY_TEXT.replace("Transferable electives", "Transferable courses"))
check(not r["pass"] and r["arithmetic"]["status"] == "incomplete",
      "electives that fill the degree must be named in the catalog text")
r = S.score({**psy, "program": {**psy["program"], "electives_fill_degree": False}}, PSY, PSY_TEXT)
check(not r["pass"] and r["arithmetic"]["status"] == "unequal",
      "without electives filling the rest, a major and general education short of the degree total fail")
r = S.score({**psy, "program": {**psy["program"], "degree_total": {"min": 55, "max": 55}}}, PSY, PSY_TEXT)
check(not r["pass"] and r["arithmetic"]["status"] == "unequal" and r["arithmetic"].get("fill") is None,
      "a major and general education past the degree total fail even when electives fill the rest")

# Sam, Open Asks Sheet 81 card 1 ("count", 2026-10-14): a degree total inside the span the
# requirements allow adds up (Cabrillo: 57-60 against a printed 60).
r = S.score({**aut, "program": {**aut["program"], "degree_total": {"min": 66, "max": 66}}}, AUT, AUT_TEXT)
check(r["pass"] and r["arithmetic"]["status"] == "equal" and r["arithmetic"].get("within") is True
      and r["arithmetic"]["computed"] == [64.0, 68.0],
      "a printed degree total of 66 inside the 64-68 the blocks and CalGETC allow adds up: %s"
      % json.dumps(r["arithmetic"]))
r = S.score({**aut, "program": {**aut["program"], "degree_total": {"min": 64, "max": 70}}}, AUT, AUT_TEXT)
check(not r["pass"] and r["arithmetic"]["status"] == "unequal" and not r["arithmetic"].get("within"),
      "a printed degree total reaching past the span (64-70 against 64-68) still fails")
r = S.score(aut, AUT, AUT_TEXT)
check(r["pass"] and not r["arithmetic"].get("within"), "an exact match is equal, not within")

# Card 2 ("adt"): a transfer degree printing Total 60, its major and CalGETC, and no electives line
# (Palo Verde's Sociology AA-T, 30710, read 53-57): transferable electives make up the 60.
adt = {**psy, "program": {**psy["program"], "electives_fill_degree": False}}
r = S.score(adt, PSY, PSY_TEXT, "A.A- T Degree")
check(r["pass"] and r["arithmetic"]["status"] == "equal" and r["arithmetic"].get("transfer") is True
      and r["arithmetic"]["fill"] == [1.0, 7.0],
      "an AA-T whose major and CalGETC fit under 60 is filled by transferable electives: %s"
      % json.dumps(r["arithmetic"]))
r = S.score({**adt, "program": {**adt["program"], "section_heading": "AS-T in Psychology for Transfer"}}, PSY, PSY_TEXT)
check(r["pass"] and r["arithmetic"].get("transfer") is True, "the page's heading names a transfer degree too")
r = S.score(adt, PSY, PSY_TEXT, "A.S. Degree")
check(not r["pass"] and r["arithmetic"]["status"] == "unequal",
      "an A.S. that is not for transfer and falls short of its degree total still fails")
r = S.score({**adt, "program": {**adt["program"], "open_elective_units": 0.5}}, PSY, PSY_TEXT, "A.S. T Degree")
check(not r["pass"] and r["arithmetic"]["status"] == "unequal",
      "a transfer degree whose page names its electives is checked against them, never filled")
# Sheet 82 card 2 ("overlap", Sam, 2026-10-14): a course counts toward the major and Cal-GETC both,
# so a transfer degree whose sum runs past its printed total adds up (Cabrillo Geology AS-T: 62 against 60).
r = S.score({**adt, "program": {**adt["program"], "degree_total": {"min": 52, "max": 52}}}, PSY, PSY_TEXT, "A.A- T Degree")
check(r["pass"] and r["arithmetic"]["status"] == "equal" and r["arithmetic"].get("overlap") is True
      and r["arithmetic"]["computed"] == [53.0, 59.0] and r["arithmetic"]["stated"] == [52.0, 52.0],
      "a transfer degree whose major and general education run past its total adds up and keeps both figures: %s"
      % json.dumps(r["arithmetic"]))
r = S.score({**psy, "program": {**psy["program"], "degree_total": {"min": 52, "max": 52}}}, PSY, PSY_TEXT, "A.S. T Degree")
check(r["pass"] and r["arithmetic"].get("overlap") is True,
      "the overlap holds where the record says electives fill the degree, too")
r = S.score({**adt, "program": {**adt["program"], "degree_total": {"min": 52, "max": 52}}}, PSY, PSY_TEXT, "A.S. Degree")
check(not r["pass"] and r["arithmetic"]["status"] == "unequal" and not r["arithmetic"].get("overlap"),
      "an A.S. that is not for transfer and runs past its degree total still fails")
r = S.score({**adt, "program": {**adt["program"], "degree_total": {"min": 55, "max": 58}}}, PSY, PSY_TEXT, "A.A- T Degree")
check(r["arithmetic"].get("within") and not r["arithmetic"].get("overlap"),
      "a transfer degree whose total sits inside the span is within, not overlap")
for award, want in (("A.A- T Degree", True), ("A.S. T Degree", True), ("A.S. Degree", False),
                    ("A.A. Degree", False), ("Associate in Science for Transfer", True), (None, False)):
    check(S.transfer_degree(award, {}) is want, "transfer_degree(%r) is %s" % (award, want))

# Record shape 6 (S392; Sam, 2026-10-14, Cabrillo Biology 06328 Needs a fix): a page printing the
# major's total and the degree's checks both. Cabrillo Astronomy, which Sam confirmed: GE 24, a
# 30-unit major and 6 units of major electives make the 60 the page prints.
AST = [{"code": "ASTRO %d" % i, "units": 3} for i in range(1, 13)]
ast = {"program": {"total_units": {"min": 30, "max": 30}, "degree_total": {"min": 60, "max": 60},
                   "ge_units": {"min": 24, "max": 24}, "ge_pattern": "Cabrillo College General Education",
                   "degree_elective_units": {"min": 6, "max": 6}, "electives_fill_degree": False},
       "blocks": [{"name": "Recommended Major Requirements", "rule": "all",
                   "courses": [{"code": "ASTRO %d" % i, "units": 3} for i in range(1, 11)]},
                  {"name": "Recommended Major Electives", "rule": "choose_units", "minimum": 6,
                   "stated": {"min": 6, "max": 6}, "optional": False,
                   "courses": [{"code": "ASTRO 11", "units": 3}, {"code": "ASTRO 12", "units": 3}]}]}
ast["blocks"][1]["name"] = "General electives"
ast_major = {**ast, "blocks": [ast["blocks"][0]]}
AST = AST[:10]
r = S.score(ast_major, AST, None, "A.S. Degree")
check(r["pass"] and r["arithmetic"]["against"] == "program" and r["arithmetic"]["degree"]["pass"]
      and r["arithmetic"]["degree"]["computed"] == [60.0, 60.0],
      "a 30-unit major, GE 24 and 6 degree electives check the major and the degree both: %s" % json.dumps(r["arithmetic"]))
r = S.score({**ast_major, "program": {**ast["program"], "degree_elective_units": {"min": None, "max": None}}},
            AST, None, "A.S. Degree")
check(not r["pass"] and r["arithmetic"]["against"] == "degree" and r["arithmetic"]["status"] == "unequal"
      and r["arithmetic"]["major"]["pass"] and r["arithmetic"]["computed"] == [54.0, 54.0],
      "a major that meets its total and a degree that misses its 60 names the degree: %s" % json.dumps(r["arithmetic"]))
r = S.score({**ast_major, "program": {**ast["program"], "total_units": {"min": 33, "max": 33}}}, AST, None, "A.S. Degree")
check(not r["pass"] and r["arithmetic"]["against"] == "program" and "degree" in r["arithmetic"],
      "a major that misses its own total is named first, with the degree's check beside it")
check(S.score(ast_major, AST, None, "A.S. Degree")["degree"]["status"] == "read"
      and S.score({**ast_major, "program": {"total_units": {"min": 30, "max": 30}}}, AST, None, "A.S. Degree")["degree"]["status"] == "major only"
      and S.score({**ast_major, "program": {"total_units": {"min": 30, "max": 30}}}, AST, None,
                  "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units")["degree"]["status"] == "n/a",
      "the degree reading: read, major only, or n/a for a certificate")

# The rescore (kb/_program_requirements_rescore.py) applies the same verdict to a filed record's sum.
import _program_requirements_rescore as RS  # noqa: E402
filed = {"award": "A.A. Degree", "record": {"program": {"electives_fill_degree": False}},
         "score": {"arithmetic": {"pass": False, "status": "unequal", "computed": [57.0, 60.0],
                                  "stated": [60.0, 60.0], "against": "degree", "why": ["..."]}}}
new = RS.rescore(filed)
check(new and new["pass"] and new["status"] == "equal" and new.get("within") and new["computed"] == [57.0, 60.0]
      and not new["why"], "the rescore passes a filed 57-60 against 60 as within: %s" % json.dumps(new))
check(RS.rescore({**filed, "score": {"arithmetic": {**filed["score"]["arithmetic"], "against": "program"}}}) is None,
      "the rescore leaves a record checked against its major total alone")
check(RS.rescore({**filed, "score": {"arithmetic": {**filed["score"]["arithmetic"], "computed": [50.0, 55.0]}}}) is None,
      "the rescore leaves a record that still falls short alone")
new = RS.rescore({**filed, "award": "A.S. T Degree",
                  "score": {"arithmetic": {**filed["score"]["arithmetic"], "computed": [62.0, 62.0]}}})
check(new and new["pass"] and new.get("overlap") and new["rescored"] == "Open Asks Sheet 82" and RS.how(new) == "overlap",
      "the rescore passes a filed AS-T at 62 against 60 as overlap (Sheet 82 card 2): %s" % json.dumps(new))
check(RS.rescore({**filed, "score": {"arithmetic": {**filed["score"]["arithmetic"], "computed": [62.0, 62.0]}}}) is None,
      "the rescore leaves an A.A. that is not for transfer and runs past its total alone")
stale = RS.run(write=False)
check(not stale, "every filed record's degree arithmetic is scored by the current rule (run "
      "kb/_program_requirements_rescore.py): %s" % [(c["college"], c["control_number"]) for c in stale][:6])

# Sam's review, card 5: a course listed twice in one block is refused; the same
# course in two blocks is not (Miramar Entrepreneurship's BUSE 155).
TWICE = [{"code": "FIRE 1", "units": 3}, {"code": "FIRE 6", "units": 3}, {"code": "FIRE86", "units": None}]
twice = {"program": {"total_units": {"min": 9, "max": 25}},
         "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "FIRE 1"}]},
                    {"name": "Electives", "rule": "choose_courses", "minimum": 2,
                     "stated": {"min": 6, "max": 22},
                     "courses": [{"code": "FIRE 6"}, {"code": "FIRE 86"}, {"code": "FIRE 86"}]}]}
r = S.score(twice, TWICE)
check(not r["pass"] and r["repeated"]["codes"] == ["FIRE86 in 'Electives'"] and r["arithmetic"]["pass"],
      "a course listed twice in one block fails, though every other bar passes: %s" % json.dumps(r["repeated"]))
twice["blocks"][1]["courses"].pop()
check(S.score(twice, TWICE)["pass"], "listed once, the same record passes")
both = {"program": {"total_units": 6},
        "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "FIRE 1"}]},
                   {"name": "Electives", "rule": "choose_courses", "minimum": 1,
                    "courses": [{"code": "FIRE 1"}, {"code": "FIRE 6"}]}]}
check(S.score(both, TWICE)["repeated"]["pass"], "the same course in two blocks is not a repeat")

# Sam's verdicts: every filed record carries one, and only a fix carries a reason.
with open(os.path.join(ROOT, "kb", "program_requirements_pilot", "review_2026-10-04.json")) as fh:
    review = json.load(fh)
filed = {os.path.splitext(os.path.basename(p))[0] for p in records}
# Records past Sam's checked 20 (the maps list, S337) carry no verdict: CPL
# Pathways marks them unchecked. These checks cover the 20 he read.
_pilot_keys = {(p["college"], p["control_number"]) for p in json.load(open(P.SAMPLE_FILE))["programs"]}
pilot_records = [p for p in records
                 if (lambda r: (r["college"], r["control_number"]) in _pilot_keys)(json.load(open(p)))]
filed = {os.path.splitext(os.path.basename(p))[0] for p in pilot_records}
check(set(review["verdicts"]) == filed and review["ruled"] == 20 and review["by"] == "Sam",
      "Sam's review covers exactly the 20 filed records: %s" % sorted(set(review["verdicts"]) ^ filed))
check(sorted(k for k, v in review["verdicts"].items() if v["v"] == "fix") == sorted(review["fixes"]),
      "a fix verdict and a fix reason travel together")

# The function writes what the scorer reads.
fn = open(os.path.join(ROOT, "chatbox", "supabase", "functions", "program-requirements-extract",
                       "index.ts")).read()
for field in ('"measure"', '"option_group"', '"stated"', '"units_max"'):
    check(re.search(r"required: \[[^\]]*%s" % field, fn),
          "the function's schema requires %s, the field the scorer reads" % field)
check("Write every code with its subject" in fn,
      "the prompt tells the model 'CHLD 67 & 67L' is CHLD 67 and CHLD 67L (run 1 wrote '67L')")

# ── Record shape v3: outcomes as printed (Sam, sheet 33 card 4) ─────────────
# The record keeps program and course outcomes exactly as printed, and the
# scorer checks each one appears in the catalog text word for word. A reworded
# outcome is the failure this guards: it reads well and is not the college's.
for field in ('"outcomes"', '"course_outcomes"'):
    check(re.search(r"required: \[[^\]]*%s" % field, fn),
          "the function's schema requires %s (record shape 3)" % field)
check("exactly as printed" in fn and "Never reword" in fn,
      "the prompt tells the model to copy each outcome as printed and never reword one")
import _program_requirements_extract as X3  # noqa: E402
check(X3.RECORD_SHAPE == 6, "the extraction pass stamps record shape 6 on what it files")
check("degree_elective_units" in fn and "at least 30 units in the major" in fn,
      "the prompt keeps a degree's own electives and never reads a major-minimum sentence as the major total")
# Record shape v5 (Sam, Open Asks Sheet 78 card 2): the degree total and the general education
# units as printed, never in total_units, and electives that fill the degree named, never computed.
for field in ('"degree_total"', '"ge_units"', '"electives_fill_degree"'):
    check(re.search(r"required: \[[^\]]*%s" % field, fn),
          "the function's schema requires %s (record shape 5)" % field)
check("never in total_units" in fn and "never compute their units" in fn,
      "the prompt keeps the degree total out of total_units and never computes the electives that fill it")

PLO_TEXT = ("Program Learning Outcomes\nUpon completion of this program, the student will be able to:\n"
            "1. Meet the educational requirements to qualify for the \nDRE Real Estate Broker license exam. \n"
            "2. Demonstrate knowledge of welding, cranes, and rigging in order to perform ironworker\u2019s "
            "job functions.\n3. Work as a self-\nemployed broker.\nRequired core courses 15-17")
plo = {**rec, "program": {**rec["program"], "outcomes": [
    "Meet the educational requirements to qualify for the DRE Real Estate Broker license exam.",
    "Demonstrate knowledge of welding, cranes, and rigging in order to perform ironworker's job functions.",
    "Work as a self-employed broker."]}}
o = S.outcomes_check(plo, PLO_TEXT)
check(o["pass"] and o["program"] == 3,
      "outcomes copied across a PDF line break, a line-end hyphen and a curly apostrophe are verbatim: %s"
      % o["why"])
spaced = {**plo, "program": {**plo["program"], "outcomes": [
    "Interact with doctors, nurses and technicians in a professional manner."]}}
check(S.outcomes_check(spaced, "Outcomes\nInteract with doctors, nurses and tech - nicians in a profes - sional manner.")["pass"],
      "an outcome broken by East LA's spaced hyphen ('tech - nicians') is verbatim (S403)")
lig = {**plo, "program": {**plo["program"], "outcomes": ["Design and draft landscape plan.",
                                                         "Estimate the cost of a landscape construction project."]}}
LIG_TEXT = "Program Outcomes\n1. Design and draŌ  landscape plan.\n3. EsƟ mate the cost of a landscape construcƟ on project."
check(S.outcomes_check(lig, LIG_TEXT)["pass"],
      "an outcome printed with Solano's stand-in ligature glyphs ('draŌ ', 'EsƟ mate') is verbatim (S405)")
MARK_TEXT = ("STUDENT LEARNING OUTCOMES\nDemonstrate knowledge of basic laws and principles of California real estate. 1.\n"
             "Demonstrate knowledge of real estate listings, deposit receipts, escrows, 2.\nand financing.\nMAJOR FIELD")
marked = {**plo, "program": {**plo["program"], "outcomes": [
    "Demonstrate knowledge of basic laws and principles of California real estate.",
    "Demonstrate knowledge of real estate listings, deposit receipts, escrows, and financing."]}}
check(S.outcomes_check(marked, MARK_TEXT)["pass"],
      "an outcome whose list number Ohlone's PDF prints at its first line's end ('escrows, 2.') is verbatim (S408)")
check(S.outcomes_check({**marked, "program": {**marked["program"], "outcomes": [
    "Demonstrate knowledge of real estate listings, deposit receipts, escrows, 2. and financing."]}}, MARK_TEXT)["pass"],
      "the marker reading adds a reading: the text as printed still reads")
check(not S.outcomes_check({**marked, "program": {**marked["program"], "outcomes": [
    "Demonstrate knowledge of real estate listings, escrows, and financing."]}}, MARK_TEXT)["pass"],
      "an outcome missing words is still reworded with the marker reading")
check(not S.outcomes_check({**lig, "program": {**lig["program"], "outcomes": ["Design and draft a landscape plan."]}},
                           LIG_TEXT)["pass"],
      "the ligature reading still refuses a word the text does not print")
reworded = {**plo, "program": {**plo["program"], "outcomes": [
    "Meet the education requirements for the DRE Real Estate Broker license exam."]}}
check(not S.outcomes_check(reworded, PLO_TEXT)["pass"],
      "a reworded outcome fails: the record must carry the college's words")
check(not S.score(reworded, CUL, PLO_TEXT)["pass"],
      "a reworded outcome fails the record, as an unflagged invented course does")
check(not S.outcomes_check({**plo, "program": {**plo["program"], "outcomes": [""]}}, PLO_TEXT)["pass"],
      "an empty outcome fails (an empty string is in every text)")
check(not S.outcomes_check({**plo, "program": {**plo["program"], "outcomes": [
    "meet the educational requirements to qualify for the DRE Real Estate Broker license exam."]}},
    PLO_TEXT)["pass"], "capitals are part of the outcome as printed")
check(not S.outcomes_check(plo, None)["pass"],
      "without the catalog text, outcomes cannot be checked and the record cannot pass")
co = {**rec, "course_outcomes": [{"code": "REAL ES 3", "outcomes": ["Work as a self-employed broker."]},
                                 {"code": "REAL ES 5", "outcomes": ["Sell houses."]}]}
o = S.outcomes_check(co, PLO_TEXT)
check(o["courses"] == 2 and not o["pass"] and len(o["not_verbatim"]) == 1,
      "course outcomes are checked the same way, each under its code")
head = S.outcomes_check(rec, "Program Learning Outcomes\nPrint Options\nENROLL")
check(head["pass"] and head["heading_without_outcomes"],
      "a heading with no outcomes under it (Mt. San Antonio's tab) is reported, never failed")
check(S.outcomes_check(rec, "Program Student Learning Outcomes")["heading_printed"]
      and S.outcomes_check(rec, "Student Learning Outcomes")["heading_printed"]
      and S.outcomes_check(rec, "Learning Outcome(s): Students who complete")["heading_printed"]
      and not S.outcomes_check(rec, "Outcome-based education")["heading_printed"],
      "the outcomes heading in each form the pilot pages print")
check(S.score(rec, CUL)["outcomes"]["pass"] and S.score(rec, CUL)["outcomes"]["count"] == 0,
      "a version 2 record carries no outcomes and its outcomes check passes with nothing to read")

# A person's verdict follows the requirements read, not the file name.
check(S.requirements_md5(plo) == S.requirements_md5(rec),
      "adding outcomes leaves the requirements fingerprint as it was")
check(S.requirements_md5(co) == S.requirements_md5(rec),
      "adding course outcomes leaves it as it was")
moved = {**rec, "blocks": [{**rec["blocks"][0], "courses": rec["blocks"][0]["courses"][:-1]}]}
check(S.requirements_md5(moved) != S.requirements_md5(rec), "a changed block changes it")
import _program_requirements_load as L  # noqa: E402
read_md5 = S.requirements_md5(rec)
check(L.verdict_holds("ok", 1, read_md5, plo), "Sam's ok holds on a rerun that only adds outcomes")
check(not L.verdict_holds("ok", 1, read_md5, moved),
      "Sam's ok does not carry to a rerun whose blocks differ from the ones he read")
check(not L.verdict_holds("ok", 1, None, rec), "a record with no reading on file is not read")
check(not L.verdict_holds("fix", L.FIXED_BY - 1, read_md5, rec)
      and L.verdict_holds("fix", L.FIXED_BY, read_md5, rec),
      "a fix holds only on the rerun that carried it out")
readings = json.load(open(L.READINGS))["readings"]
check(set(readings) == filed, "every filed record has the reading its verdict covers")
check(all(readings[k]["verdict"] == review["verdicts"][k]["v"] for k in readings),
      "the readings file names each verdict as Sam ruled it")
lr = L.rows()
check(sum(1 for r in lr if r["checked"]) == 20,
      "all 20 filed records are still the ones Sam's verdicts cover (%d checked)"
      % sum(1 for r in lr if r["checked"]))
check(all("missing_explained" not in r["record"] and "notes" not in r["record"] for r in lr),
      "the public read carries no working notes")

# The filer keeps what a person read and takes only the outcomes (S334).
import _program_requirements_file as FL  # noqa: E402
log = ("2026-10-05T17:10:59Z === PILOT RECORDS JSON BEGIN ===\n"
       '2026-10-05T17:10:59Z {"college": "X", "control_number": "1"}\n'
       "2026-10-05T17:10:59Z === PILOT RECORDS JSON END ===\n")
check(FL.rows_from_log(log) == [{"college": "X", "control_number": "1"}],
      "the filer reads the records between the job log's markers, timestamps stripped")
some = json.load(open(records[0]))
src0 = json.load(open(os.path.join(ROOT, some["source_file"])))
reworded_row = {"record": {**some["record"], "program": {**some["record"]["program"],
                                                         "outcomes": ["Not a sentence this catalog prints."]}}}
check(FL.graft(some, reworded_row, 1)[0] is None,
      "the filer refuses outcomes the catalog text does not print")
moved_row = {"record": {**some["record"], "blocks": some["record"]["blocks"][:-1],
                        "program": {**some["record"]["program"], "outcomes": []}}}
g, _ = FL.graft(some, moved_row, 1)
check(g is not None and g["record"]["blocks"] == some["record"]["blocks"],
      "a run whose blocks differ never replaces the blocks a person read")
shape3 = [json.load(open(p)) for p in pilot_records]
check(all(r.get("record_shape") == 3 and r.get("outcomes_run") in (37345734457, 37350789203) for r in shape3),
      "every filed record carries record shape 3 and the run its outcomes came from "
      "(Mt. San Antonio's four from 37350789203, after the capture read their outcomes tab)")
check(all(S.outcomes_check(r["record"], json.load(open(os.path.join(ROOT, r["source_file"]))) ["text"])["pass"]
          for r in shape3), "every filed outcome is in its catalog text word for word")
check(sum(1 for r in shape3 if r["record"]["program"].get("outcomes")) == 19,
      "19 of 20 pilot records carry outcomes; Mt. San Antonio's Early Childhood Education ADT's tab "
      "only links to an SLO page")

# The capture appends an outcomes tab the page hides, once (S334).
shown = "Program Learning Outcomes\nApply safety practices in the clinical setting.\nProgram Requirements"
check(P.with_outcome_tabs(shown, [{"id": "outcomestextcontainer",
                                   "text": "Apply safety practices in the clinical setting."}]) == shown,
      "an outcomes tab the page already shows is not added twice")
hidden = "Program Learning Outcomes\nPrint Options"
got_tab = P.with_outcome_tabs(hidden, [{"id": "outcomestextcontainer",
                                        "text": "Upon completion, students will be able to:\nAdminister medications safely."}])
check(got_tab.startswith(hidden) and "[the page's outcomes tab, #outcomestextcontainer]" in got_tab
      and "Administer medications safely." in got_tab,
      "a hidden outcomes tab is appended under a line naming where it came from")
check(P.with_outcome_tabs(hidden, None) == hidden and P.with_outcome_tabs(hidden, [{"id": "x", "text": " "}]) == hidden,
      "a page with no outcomes tab is filed exactly as before")
check("outcomeTabs" in P.PAGE_JS and '[id*="outcome" i]' in P.PAGE_JS,
      "the page reader collects any element whose id names outcomes")
# Capture run 9 (S334): a "\\n" written into PAGE_JS's Python source became a
# real newline inside a JavaScript regex, the page script threw on every page,
# and the run fell back to the reader's plain text. The script must parse.
check(not re.search(r"[\x00-\x09\x0b-\x1f]", P.PAGE_JS),
      "PAGE_JS carries no tab or control character a Python escape turned real")
import shutil, subprocess, tempfile  # noqa: E401,E402
if shutil.which("node"):
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as fh:
        fh.write("const pageJs = (" + P.PAGE_JS + ");\n")
    rc = subprocess.run(["node", "--check", fh.name], capture_output=True, text=True)
    os.unlink(fh.name)
    check(rc.returncode == 0, "PAGE_JS parses as JavaScript: %s" % (rc.stderr.strip().splitlines() or [""])[-1])
check("aria-controls" in P.PAGE_JS and "outcomeProbe" in P.PAGE_JS and "outcome_probe=" in open(P.__file__).read(),
      "and the panel a tab labeled Outcomes points at, logging what it found (Mt. San Antonio's id names neither)")

# ── The sample: five colleges, four shapes each, the fixed use cases in ──────
with open(P.SAMPLE_FILE) as fh:
    sample = json.load(fh)["programs"]
check(len(sample) == 20, "the pilot holds 20 programs (Sam checks the same 20)")
by_college = {}
for p in sample:
    by_college.setdefault(p["college"], []).append(p)
check(len(by_college) == 5 and all(len(v) == 4 for v in by_college.values()),
      "five colleges, four programs at each")
check(all(len({p["shape"] for p in v}) == 4 for v in by_college.values()),
      "each college's four programs are four different shapes")
check(len({(p["college"], p["control_number"]) for p in sample}) == 20, "no program twice")
check(any(p["college"] == "Riverside City College" and p["control_number"] == "22804"
          and p.get("fixed") for p in sample),
      "Sam's pick (sheet 25): Riverside City's Culinary Arts certificate, 22804")
check(all(p.get("why") for p in sample), "every pick says why it is in")

# ── The second list: programs whose map is already read (S337) ───────────────
with open(P.MAPS_FILE) as fh:
    maps = json.load(fh)["programs"]
check(maps and not ({(p["college"], p["control_number"]) for p in maps}
                    & {(p["college"], p["control_number"]) for p in sample}),
      "the maps list never repeats one of Sam's checked 20")
check(all(p.get("why") and os.path.exists(os.path.join(ROOT, p["sequence"])) for p in maps),
      "every program on the maps list names its read map, and the file is there")
check(set(P.SAMPLES) == {"pilot", "maps", "all"} and P.SAMPLES["pilot"] == [P.SAMPLE_FILE],
      "--sample pilot reads Sam's 20 alone")
check(P.score_link("Academic and Career Paths", "https://catalog.smc.edu/current/x.php",
                  {"title": "Barbering", "award": "A.S. Degree"}) > 0,
      "Santa Monica's catalog hub, Academic and Career Paths, is followed (S337 capture run 37487454632)")
import _program_requirements_file as F  # noqa: E402
slugs = F.college_slugs()
check(all(p["college"] in slugs for p in maps),
      "the filer has a file-name slug for every college on the maps list")

# ── The capture pass writes nothing and runs on no schedule ──────────────────
with open(os.path.join(ROOT, ".github", "workflows", "program-requirements-pilot.yml")) as fh:
    wf = fh.read()
active = "\n".join(l for l in wf.splitlines() if not l.lstrip().startswith("#"))
check(not re.search(r"^\s*schedule:", active, re.M), "the capture pass has no schedule")
check("secrets." not in active, "the capture pass needs no secret (anon reads only)")
check(re.search(r"^permissions:\s*\n\s+contents: read\s*$", active, re.M),
      "the capture pass reads the repo and nothing more")
src = open(os.path.join(ROOT, "kb", "_program_requirements_pilot.py")).read()
check(not re.search(r"method=\"(?:POST|PATCH|PUT|DELETE)\"|/rpc/", src),
      "the capture pass sends no write to Supabase")
check("SUPABASE_SERVICE_KEY" not in src, "the capture pass never reads the service key")

# ── The sequence pass: Miramar's Program Pathways Mapper (S325) ──────────────
# S324's four guessed mapper hosts answered 403 or did not resolve. The pass
# now enters from the college's own pages and follows the link that leads into
# the mapper, and accepts a page only when it names the program's courses AND
# at least two terms: a program's description names its courses and no term.
import _program_sequence_ppm as Q  # noqa: E402

check(Q.PPM_PROGRAMS == {("San Diego Miramar College", "05100")},
      "Sam's call 4 (sheet 23): the pilot sequences Miramar's Fire Technology A.S. alone")
check(all(any(p["college"] == c and p["control_number"] == cn for p in sample)
          for c, cn in Q.PPM_PROGRAMS), "the sequenced program is in the pilot sample")
check(all(u.startswith("https://") for us in Q.PPM_START.values() for u in us),
      "every mapper entry page is https")

check(Q.on_mapper("https://miramar.programmapper.ws/academics"), "a programmapper host is the mapper")
check(Q.on_mapper("https://programmap.cuesta.edu/academics"), "a programmap host is the mapper")
check(not Q.on_mapper("https://sdmiramar.edu/program-mapper"),
      "the college's page ABOUT the mapper is a step, not the mapper")
check(Q.on_mapper("https://pm.hartnell.edu/academics", {"pm.hartnell.edu"}),
      "a host a mapper link led to is the mapper")

here = "https://sdmiramar.edu/program-mapper"
check(Q.mapper_link("Program Mapper", "https://miramar.programmapper.ws/academics", here) == 9,
      "a link to a mapper host that names the mapper counts most")
check(Q.mapper_link("Explore Program Mapper", "https://sdmiramar.edu/program-mapper",
                    "https://sdmiramar.edu/programs/fire-protection-technology") == 3,
      "the college's own mapper page counts as a step")
check(Q.mapper_link("Apply Now", "https://sdmiramar.edu/apply", here) == 0,
      "an unrelated college link does not lead into the mapper")
check(Q.mapper_link("Program Mapper", here + "#top", here) == -1, "a page never links to itself")
check(Q.mapper_link("Login", "https://miramar.programmapper.ws/login", here) == -1,
      "a login link is refused, mapper host or not")

fire = {"title": "Fire Technology", "award": "A.S. Degree"}
ppm = "https://miramar.programmapper.ws/academics/interest-clusters/c1"
check(Q.program_link("Fire Technology, A.S.", ppm + "/programs/p9", fire) > 2,
      "inside the mapper, the program's own link scores by its title")
check(Q.program_link("Public Safety", ppm, fire) == 1,
      "a pathway page with none of the title's words is explored last")
check(Q.program_link("Program Map", ppm + "/programs/p9/map", fire) == 5,
      "the program's map link is followed")
check(Q.program_link("About", "https://miramar.programmapper.ws/about", fire) == 0,
      "a page outside the pathways is not followed")

check(Q.term_markers("Semester 1 FIPT 101 Semester 2 FIPT 102 semester 1") == ["Semester 1", "Semester 2"],
      "each term once, in page order")
check(len(Q.term_markers("Fall Semester ... Spring Semester")) == 2, "a season's semester is a term")
check(len(Q.term_markers("Year 1 ... Year 2")) == 2, "a numbered year is a term")
check(Q.term_markers("complete the program in 4 semesters") == [],
      "a count of semesters names no term")

fx = json.load(open(os.path.join(ROOT, "kb", "program_requirements_pilot", "sources", "miramar_05100.json")))
closed = fx["closed_list"]
seq = "Semester 1\nFIPT 101 Intro\nFIPT 102 Behavior\nEMGM 105A EMT\nSemester 2\nFIPT 103\nFIPT 104"
check(Q.accepts(P.find_codes(seq, closed), closed, seq),
      "a page naming five of the eight listed courses under two terms is the sequence")
flat = seq.replace("Semester 1\n", "").replace("Semester 2\n", "")
check(not Q.accepts(P.find_codes(flat, closed), closed, flat),
      "the same courses with no term is the program's description, not its sequence")
thin = "Semester 1\nFIPT 101\nSemester 2\nENGL 101"
check(not Q.accepts(P.find_codes(thin, closed), closed, thin),
      "terms with one listed course are a mapper's help text, not the sequence")
check(Q.map_items(["Overview", "Program Map", "Careers", "View Program Map", "map of campus"])
      == ["Program Map", "View Program Map"], "the items that open a program's map, and no other")

with open(os.path.join(ROOT, ".github", "workflows", "program-sequence-ppm.yml")) as fh:
    swf = fh.read()
sactive = "\n".join(l for l in swf.splitlines() if not l.lstrip().startswith("#"))
check(not re.search(r"^\s*schedule:", sactive, re.M), "the sequence pass has no schedule")
check("secrets." not in sactive, "the sequence pass needs no secret (anon reads only)")
check(re.search(r"^permissions:\s*\n\s+contents: read\s*$", sactive, re.M),
      "the sequence pass reads the repo and nothing more")
check("_program_requirements_pilot.py" not in sactive and "_program_sequence_ppm.py" not in active,
      "a change to one pass never reruns the other's college reads")
ssrc = open(os.path.join(ROOT, "kb", "_program_sequence_ppm.py")).read()
check(not re.search(r"method=\"(?:POST|PATCH|PUT|DELETE)\"|/rpc/", ssrc),
      "the sequence pass sends no write to Supabase")
check("SUPABASE_SERVICE_KEY" not in ssrc, "the sequence pass never reads the service key")
# Run 1 (37197332656): Miramar's mapper answered all seven requests 403. A push
# re-reads it only when a person asks; by default the pass probes the census's
# sequence sources, one load each.
check('os.environ.get("SEQUENCE_READ") == "1"' in ssrc,
      "the program read runs only on request; a push only probes")

# Sam, open-asks sheet 29 card 3 (2026-10-04): the refusal goes on the
# college's record, the reader knows it, and keeps looking elsewhere. The
# record is program_source_registry.sequence_host / sequence_access.
reg = [{"college": "San Diego Miramar College", "sequence_source": "none_found", "sequence_url": None,
        "sequence_host": "san-diego-miramar.programmapper.com", "sequence_access": "refused"},
       {"college": "Cañada College", "sequence_source": "ppm",
        "sequence_url": "https://canada.programmapper.ws/academics",
        "sequence_host": "canada.programmapper.ws", "sequence_access": "refused"},
       {"college": "Irvine Valley College", "sequence_source": "program_map_page",
        "sequence_url": "https://www.ivc.edu/node/3220", "sequence_host": "www.ivc.edu",
        "sequence_access": "open"}]
refused = Q.refused_hosts(reg, "San Diego Miramar College")
check(refused == {"san-diego-miramar.programmapper.com"},
      "the reader takes Miramar's refused host from the registry")
check(Q.refused_hosts(reg, "Irvine Valley College") == set(),
      "an open source is never treated as refused")
mm = "https://san-diego-miramar.programmapper.com/academics"
check(Q.alt_link("Program Mapper", mm, fire, refused) == -1,
      "a host on record as refused is never requested, whatever the link says")
check(Q.alt_link("Fire Technology Program Map", "https://sdmiramar.edu/docs/fire-tech-map.pdf", fire, refused) == 4,
      "the program's own map on the college's site is followed first")
check(Q.alt_link("Program Map", "https://sdmiramar.edu/docs/fipt-roadmap.pdf", fire, refused) == 3,
      "a PDF named for a map is followed next")
check(Q.alt_link("Apply Now", "https://sdmiramar.edu/apply", fire, refused) == 0,
      "an unrelated college link is not followed")
targets = {r["college"]: r["sequence_url"] for r in Q.probe_targets(reg)}
check(targets.get("San Diego Miramar College") == "https://san-diego-miramar.programmapper.com/",
      "where the census filed no address, the probe asks the recorded host's front page")
check(targets.get("Cañada College") == "https://canada.programmapper.ws/academics",
      "the census's own address is probed as it was")
check(Q.access_now(403, "blocked") == "refused" and Q.access_now(None, "unreachable") == "unreached"
      and Q.access_now(200, "ok") == "answered", "a probe's result reads in the registry's words")
check(Q.changed("refused", "answered") and Q.changed("unreached", "answered"),
      "a refused host that answers, or an unreached page that loads, is flagged for a session to file")
check(not Q.changed("refused", "refused") and not Q.changed("not_read", "answered")
      and not Q.changed("open", "answered") and not Q.changed(None, "answered"),
      "a refusal that persists, or a page already on record as answering, is no change")
check('out[-1]["changed"] = changed(' in ssrc and "CHANGED: file it" in ssrc,
      "the probe prints each change for a session to file")
check("if host(url) in refused:" in ssrc and "refused_hosts(registry, entry[\"college\"])" in ssrc,
      "the program read skips every host the registry records as refused")
check("SEQUENCE_READ: ${{ github.event.inputs.read }}" in sactive,
      "the workflow passes the request through; a push never sets it")

# Record shape 4 (S360): Sam's reading rules 4 and 5 from the Mt. San Antonio sample (Open Asks
# Sheet 61 card 1, "rules"): "The recommended Electives should be added with blocks", and "grab
# the career info". The failures this guards: a recommended course counted toward the award's
# total or its CPL figure, a recommended course left in missing_explained, a career the text
# does not print, and a verdict that goes stale when a rerun only adds careers.
fn4 = open(os.path.join(ROOT, "chatbox", "supabase", "functions", "program-requirements-extract", "index.ts")).read()
check('"recommended"]' in fn4 and "careers:" in fn4 and '"outcomes", "careers"]' in fn4,
      "the function's schema offers rule recommended and requires program.careers (record shape 4)")
check("A course from the closed list that the catalog lists only as recommended goes in this block, not in missing_explained" in fn4
      and '"listed as a recommended course"' not in fn4,
      "the prompt places a recommended course in its block, never in missing_explained")
check("Never write a career the text does not name" in fn4, "the prompt keeps careers to what the text names")
rec4 = {"program": {"measure": "units", "total_units": {"min": 6, "max": 6}, "outcomes": [], "careers": ["platform artist", "barber"]},
        "blocks": [{"name": "Required", "rule": "all", "minimum": None, "option_group": None, "stated": {"min": None, "max": None},
                    "courses": [{"code": "ART 1", "units": 3, "alternatives": []}, {"code": "ART 2", "units": 3, "alternatives": []}]},
                   {"name": "Recommended Electives", "rule": "recommended", "minimum": None, "option_group": None,
                    "stated": {"min": None, "max": None}, "courses": [{"code": "MUS 20", "units": 3, "alternatives": []}]}],
        "course_outcomes": [], "missing_explained": [], "notes": []}
closed4 = [{"code": "ART 1", "units": 3}, {"code": "ART 2", "units": 3}, {"code": "MUS 20", "units": 3}]
text4 = "Required ART 1 ART 2. Recommended Electives MUS 20. Careers such as: Platform artist, barber. Total 6 units"
sc4 = S.score(rec4, closed4, text4)
check(sc4["arithmetic"]["status"] == "equal" and sc4["arithmetic"]["computed"] == [6.0, 6.0],
      "a recommended block adds nothing to the units (got %s)" % sc4["arithmetic"])
check(sc4["coverage"]["pass"] and sc4["coverage"]["placed"] == 3,
      "a closed-list course placed as recommended counts as placed")
check(sc4["careers"] == {"count": 2, "not_verbatim": [], "pass": True},
      "careers named in the text pass, capitals aside (got %s)" % sc4["careers"])
bad4 = {**rec4, "program": {**rec4["program"], "careers": ["astronaut"]}}
check(not S.careers_check(bad4, text4)["pass"] and S.score(bad4, closed4, text4)["pass"] == sc4["pass"],
      "a career the text does not name is reported, and holds no record back")
no_careers = {**rec4, "program": {k: v for k, v in rec4["program"].items() if k != "careers"}}
check(S.requirements_md5(rec4) == S.requirements_md5(no_careers),
      "adding careers leaves the requirements fingerprint as it was")
chat = open(os.path.join(ROOT, "chatbox", "supabase", "functions", "cpl-chat", "index.ts"), encoding="utf-8").read()
check('if (b.rule === "recommended") return "recommended, not required' in chat and "Careers the catalog names for it" in chat,
      "Sierra reads a recommended block as not required (an unknown rule reads as all required) and names the careers")
dep = open(os.path.join(ROOT, ".github", "workflows", "cpl-chat-deploy.yml")).read()
check("- program-requirements-extract" in dep and 'supabase functions deploy "$FN"' in dep and "--no-verify-jwt" in dep,
      "the extraction function deploys from git through the deploy workflow's allowlist, verify_jwt off")
fp_sql = open(os.path.join(ROOT, "chatbox", "supabase_program_record_verdicts.sql")).read()
check("- 'outcomes' - 'careers'" in fp_sql,
      "the server's fingerprint leaves out the careers too, so a verdict pins to the requirements alone")

# ── A program read in parts (S361; Sam, 2026-10-11: "go with splitting the program into two calls") ──
import _program_requirements_extract as XP  # noqa: E402
PT = ("Required Courses: AAA 1 Intro 3, AAA 2 or AAA 2H Next 3, CAT 5 Lab 1. "
      "Electives (select 6 units): BBB 1 One 3, BBB 2 Two 3, AAA 1 Intro 3.")
PCL = [{"code": c, "units": 3} for c in ("BBB 2", "AAA 1", "ZZZ 9", "AAA 2", "BBB 1", "AAA 2H")]
sp = XP.split_codes(PCL, PT, 2)
check(sp == [["AAA 1", "AAA 2", "AAA 2H"], ["BBB 1", "BBB 2", "ZZZ 9"]],
      "split_codes orders the closed list by where the text first names each course, the ones it never "
      "names last, and halves it (%s)" % sp)
check(len(XP.split_codes([{"code": "Q %d" % i} for i in range(7)], PT, 2)) == 2,
      "a closed list the text never names still splits into the parts asked for")
check(XP.split_codes([{"code": "AAA 1"}], PT, 2) == [["AAA 1"]], "a single course makes a single part")

def _blk(name, rule, courses, minimum=None, stated=(None, None)):
    return {"name": name, "rule": rule, "minimum": minimum, "option_group": None,
            "stated": {"min": stated[0], "max": stated[1]}, "courses": courses}
def _c(code, alts=(), add=False):
    return {"code": code, "units": 3, "units_max": None, "catalog_addition": add,
            "alternatives": [{"code": a, "units": 3, "catalog_addition": False} for a in alts]}
part1 = {"program": {"section_heading": "X", "measure": "units", "total_units": {"min": 13, "max": 13},
                     "open_elective_units": None, "ge_pattern": None, "outcomes": [], "careers": []},
         "blocks": [_blk("Required Courses", "all", [_c("AAA 1"), _c("AAA 2", ["AAA 2H"]), _c("CAT 5", add=True)]),
                    _blk("Electives", "choose_units", [_c("AAA 1")], 6),
                    _blk("Recommended", "recommended", [])],
         "course_outcomes": [], "missing_explained": [{"code": "ZZZ 9", "why": "not in the text"},
                                                       {"code": "BBB 1", "why": "another part"}],
         "notes": ["one"]}
part2 = {"program": dict(part1["program"], careers=["technician"]),
         "blocks": [_blk("Required Courses", "all", [_c("AAA 2H")]),
                    _blk("Electives", "choose_units", [_c("BBB 1"), _c("BBB 2")], 6, (6, 6))],
         "course_outcomes": [{"code": "BBB 1", "outcomes": ["Do one."]}], "missing_explained": [],
         "notes": ["two"]}
mrec, mprob = XP.merge_parts([part1, part2], PT)
check([b["name"] for b in mrec["blocks"]] == ["Required Courses", "Electives", "Recommended"],
      "the merge keeps every block in the catalog's order, one a part left out included")
check([c["code"] for c in mrec["blocks"][0]["courses"]] == ["AAA 1", "AAA 2", "CAT 5"],
      "an entry whose first code the block already places (AAA 2H, an alternative of AAA 2) is dropped")
check([c["code"] for c in mrec["blocks"][1]["courses"]] == ["BBB 1", "BBB 2", "AAA 1"],
      "entries take the catalog's order within the block, a course printed in two blocks by where this block prints it")
check(mrec["blocks"][1]["stated"] == {"min": 6, "max": 6} and not mprob,
      "a block total one part read fills in, and parts that agree report no problem")
check([m["code"] for m in mrec["missing_explained"]] == ["ZZZ 9"],
      "missing_explained drops a course another part placed")
check(mrec["program"]["careers"] == ["technician"] and mrec["course_outcomes"][0]["code"] == "BBB 1",
      "careers and outcomes come from the part that read them")
check(mrec["notes"][0] == "one" and "Part 2: two" in mrec["notes"]
      and any("Read in 2 parts" in n for n in mrec["notes"]), "the notes keep each part's, and say it was read in parts")
msc = S.score(mrec, PCL, PT)
check(msc["repeated"]["pass"], "the merged record repeats no code inside a block")
part2b = dict(part2, blocks=[_blk("Required Courses", "all", []),
                             _blk("Electives", "choose_units", [_c("BBB 1")], 9)])
_, prob_b = XP.merge_parts([part1, part2b], PT)
check(any("different minimum" in p for p in prob_b), "two parts that read a block's minimum differently are flagged")

calls = []
def fake_post(body, key):
    calls.append(body)
    part = body.get("part")
    if part is None:
        return {"error": "the record ran past max_tokens", "stop_reason": "max_tokens", "model": "claude-opus-5-5",
                "usage": {"input_tokens": 1000, "output_tokens": 16000}, "ms": 110000}
    return {"error": None, "stop_reason": "end_turn", "model": "claude-opus-5-5", "ms": 60000,
            "usage": {"input_tokens": 1000, "output_tokens": 8000}, "record": [part1, part2][part["index"] - 1]}
src_small = {"college": "C", "title": "T", "award": "A", "text": PT, "closed_list": PCL}
_orig_post = XP._post
XP._post = fake_post
try:
    got = XP.call(src_small, "k")
finally:
    XP._post = _orig_post
check(len(calls) == 3 and calls[0].get("part") is None and [c["part"]["index"] for c in calls[1:]] == [1, 2]
      and all(c["part"]["of"] == 2 for c in calls[1:]) and calls[2]["part"]["codes"] == ["BBB 1", "BBB 2", "ZZZ 9"]
      and all(c["closed_list"] == PCL for c in calls),
      "a single call that runs past max_tokens is read again in two parts, each with the whole closed list")
check(got["parts"] == 2 and got["usage"] == {"input_tokens": 3000, "output_tokens": 32000}
      and got["error"] is None and got["record"]["blocks"][1]["courses"][0]["code"] == "BBB 1"
      and abs(XP.cost(got["model"], got["usage"]) - 0.652) < 1e-9,
      "the parts' usage includes the failed call, so the cost is what the program spent")
calls.clear()
big = {"college": "C", "title": "T", "award": "A", "text": PT,
       "closed_list": [{"code": "Q %d" % i} for i in range(XP.SPLIT_AT + 1)]}
XP._post = fake_post
try:
    calls.clear()
    XP.call(big, "k")
finally:
    XP._post = _orig_post
check(len(calls) == 2 and all(c.get("part") for c in calls),
      "a program over %d listed courses goes straight to parts, with no single call first" % XP.SPLIT_AT)
def failing_post(body, key):
    if (body.get("part") or {}).get("index") == 2:
        return {"error": "HTTP 504: IDLE_TIMEOUT", "usage": {"output_tokens": 0}}
    return fake_post(body, key)
gf = XP.call_in_parts(src_small, "k", {"text": PT}, post=failing_post)
check(gf["record"] is None and gf["error"].startswith("part 2 of 2: HTTP 504"),
      "a part that fails fails the record, named by part")
fn = open(os.path.join(ROOT, "chatbox", "supabase", "functions", "program-requirements-extract", "index.ts")).read()
check("function partRequest(part: Part)" in fn and "readPart(body.part, closed.length)" in fn
      and "userMessage(body, closed, text, part)" in fn and "].concat(part ? [\"\", partRequest(part)] : [])" in fn,
      "the function reads body.part and asks for that part only; a body without part reads as version 5 did")
import _program_requirements_college as PC  # noqa: E402
import tempfile as _tf  # noqa: E402
with _tf.TemporaryDirectory() as td:
    good, bad = os.path.join(td, "1.json"), os.path.join(td, "2.json")
    json.dump({"record": {"blocks": []}}, open(good, "w"))
    json.dump({"record": None, "error": "the record ran past max_tokens"}, open(bad, "w"))
    check(PC.has_record(good) and not PC.has_record(bad) and not PC.has_record(os.path.join(td, "3.json")),
          "a filed row with no record is not kept, so a later read asks the model again")

# S362: Long Beach City's pages hide a course index naming every course in the
# catalog. The visible text stands whenever it names half the program's
# courses; the hidden text is taken only when the visible text falls short.
LB = [{"code": c} for c in ["HORT 11A", "HORT 11B", "HORT 19", "HORT 21", "MKTG 47", "FLO 286A"]]
lb_body = "Horticulture A.S.\nRequired Courses\nHORT 11A\tIntro\t3\nHORT 19\tSoils\t3\nHORT 21\tPests\t3\nTotal Units 9"
lb_index = "FLO 286A - Floral Design II\nHORT 11A - Intro\nHORT 11B - Plants\nHORT 19 - Soils\nHORT 21 - Pests\nMKTG 47 - Sales\n"
lb_got = {"body": lb_body, "content": lb_index + lb_body.replace("\t", "")}
fb, fc = P.find_codes(lb_got["body"], LB), P.find_codes(lb_got["content"], LB)
check(len(fc) > len(fb), "the fixture's hidden index names more of the courses than the visible page")
t, f, field = P.best_text(lb_got, fb, fc, LB)
check(field == "innerText" and "Total Units 9" in t and "Floral" not in t,
      "a visible page naming half the program's courses keeps its own text over a hidden index")
check(P.best_text(lb_got, fb, fc)[2] == "textContent",
      "called without the courses, the old rule (whichever names more) stands")
tab_got = {"body": "Horticulture A.S.\nOverview\nRequirements", "content": lb_index}
# S366: a tab naming fewer than half the listed courses is still the page's requirements.
# Physical Sciences A.S. prints 13 of COCI's 35; the index in textContent names all 35.
few = [{"code": c} for c in ["CHEM 1A", "PHYS 2A"] + ["MATH %d" % n for n in range(27, 33)]]
few_got = {"body": "Physical Sciences, A.S. Overview", "content": "Overview CHEM 1A PHYS 2A " + " ".join("MATH %d" % n for n in range(27, 33)),
           "tabPanels": [{"label": "Program Requirements", "text": "REQUIRED COURSES CHEM 1A General Chemistry PHYS 2A General Physics; five units of any Mathematics course"}]}
check(P.best_text(few_got, P.find_codes(few_got["body"], few), P.find_codes(few_got["content"], few), few)[2] == "innerText+tabs",
      "a page with tabs is read from its tabs even when they name fewer than half the listed courses")
t, f, field = P.best_text(tab_got, P.find_codes(tab_got["body"], LB), P.find_codes(tab_got["content"], LB), LB)
check(field == "textContent", "a page whose requirements sit in a hidden tab still reads its hidden text")
# The Long Beach City page as Chromium read it through PAGE_JS (S362, a fixture
# built like its pages: minified, a hidden A-Z index naming every course, and
# Program Requirements in a hidden tab): the hidden page names all six courses
# through the index, the visible page one, the requirements tab four.
check("tabPanels" in P.PAGE_JS and "const cellText" in P.PAGE_JS and "!t.el.closest(MENU)" in P.PAGE_JS,
      "PAGE_JS reads each hidden tab panel cell by cell, outside the site's menus")
# The real pages keep their tab bar in <nav id="tabs"> (probe run 38146508042,
# S363): a rule dropping every link inside a nav dropped the Requirements tab,
# and the 12-program trial (run 38139252216) read textContent for all 12.
check("a.getAttribute('role') === 'tab' || a.closest(TAB_BAR) || !a.closest(MENU)" in P.PAGE_JS
      and "#tabs" in P.PAGE_JS.split("const TAB_BAR", 1)[1].split(";", 1)[0],
      "a tab of the page's own tab bar counts even inside a nav; other menu links do not")
dialog = {"tabPanels": [{"label": "Close this window", "id": "search-dialog",
                         "text": "Close this window\nSearch\nSearch catalog\nSubmit search\nSearch Catalog Only"},
                        {"label": "Program Requirements", "id": "programrequirementstextcontainer",
                         "text": "Program Requirements\nHORT 11A\tIntro to Horticulture\t3"}]}
check(P.hidden_tabs_text(dialog).count("[Tab:") == 1 and "search" not in P.hidden_tabs_text(dialog).lower(),
      "a hidden panel naming no course (the page's search dialog) is left out of the model's text")
lbt_req = "Program Requirements\nRequired Courses\nHORT 11A\tIntro to Horticulture\t3\nHORT 19\tSoils\t3\nHORT 21\tPests\t3\nMKTG 47\tSales\t3\nTotal Units\t12"
lbt_got = {"body": "Horticulture - Associate in Science\nOverview\nProgram Requirements\nStudents enrolling in HORT 11A learn plant care.",
           "content": lb_index + "Horticulture - Associate in ScienceStudents enrolling in HORT 11A learn plant care.HORT 19Soils3",
           "tabPanels": [{"label": "Program Requirements", "id": "programrequirementstextcontainer", "text": lbt_req}]}
fb, fc = P.find_codes(lbt_got["body"], LB), P.find_codes(lbt_got["content"], LB)
check(P.best_text(lbt_got, fb, fc)[2] == "textContent", "the old rule gave Long Beach City's page its hidden index")
t, f, field = P.best_text(lbt_got, fb, fc, LB)
check(field == "innerText+tabs" and "[Tab: Program Requirements]" in t and "MKTG 47\tSales" in t
      and sorted(f) == ["HORT11A", "HORT19", "HORT21", "MKTG47"],
      "a page keeping its requirements in a hidden tab reads the visible text with that tab, not the index: %s" % field)
check("Floral" not in P.text_window(t, f), "the window the model reads holds no course index")
idx_panel = {"tabPanels": [{"label": "Courses A-Z", "id": "az", "text": "\n".join(
    "S%s%s 1 - Course" % (chr(65 + i // 26), chr(65 + i % 26)) for i in range(60))}, {"label": "Requirements", "id": "r", "text": lbt_req}]}
check(P.hidden_tabs_text(idx_panel).count("[Tab:") == 1 and "Courses A-Z" not in P.hidden_tabs_text(idx_panel),
      "a tab panel naming courses in more than %d subjects reads as a course index and is left out" % P.INDEX_SUBJECTS)
none = S.score({"program": {"total_units": None}, "blocks": [],
                "missing_explained": [{"code": c["code"], "why": "only in the course index"} for c in LB]}, LB, lb_index)
check(not none["coverage"]["pass"] and none["coverage"]["none_placed"] and not none["pass"],
      "a record placing none of the listed courses fails coverage, every course explained or not")
some = S.score({"program": {"total_units": None}, "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "HORT 19"}]}],
                "missing_explained": [{"code": c["code"], "why": "not printed"} for c in LB if c["code"] != "HORT 19"]}, LB, lb_body)
check(some["coverage"]["pass"] and not some["coverage"]["none_placed"],
      "a record placing one listed course and explaining the rest still passes coverage")

check(S.places_none({"coverage": {"listed": 6, "placed": 0}}) and not S.places_none({"coverage": {"listed": 6, "placed": 1}})
      and not S.places_none({"coverage": {"listed": 0, "placed": 0}}) and not S.places_none(None),
      "places_none: a program with listed courses and none placed, and nothing else")


# ── the reconcile pass (S392; Sam, 2026-10-14: "a secondary search of the catalog text to see if we
# can reconcile after the initial PR harvest", each catalog's own steps) ──────────────────────────
# The pages as the runner read them (college-page-read 38633618089), in the harvest's line form.
import _program_requirements_reconcile as RC  # noqa: E402
BIO_TEXT = ("An Associate in Science degree requires 60 units appropriate to your educational goal, including general "
            "education and at least 30 units in the major.\nProgram Requirements\nBiology - Associate in Science (A.S.)\n"
            "Complete the following number of credits: 60\nCabrillo College General Education 24\nRecommended Major "
            "Requirements\nComplete the following number of credits: 15\nCHEM1A - General Chemistry I 5\n"
            "General electives: any transferable or degree applicable course. 6")
bio = {"program": {"total_units": {"min": 30, "max": None}, "open_elective_units": 6,
                   "ge_pattern": "Cabrillo College General Education"}, "blocks": []}
new, notes = RC.reconcile(bio, BIO_TEXT, "Cabrillo College", "A.S. Degree")
p = new["program"]
check(p["degree_total"] == {"min": 60, "max": 60} and p["ge_units"] == {"min": 24, "max": 24}
      and p["total_units"] == {"min": None, "max": None} and p["open_elective_units"] == 6
      and not p.get("degree_elective_units") and [n["field"] for n in notes] == ["degree_total", "ge_units", "total_units"],
      "Cabrillo Biology (Sam's Needs a fix): the degree's 60 and GE 24 are read, the 30 from 'at least 30 units in the "
      "major' is cleared, and the 6 electives the reading kept are not counted twice: %s" % json.dumps(notes))
check(all(n["words"] for n in notes) and notes[0]["words"].endswith("60") and bio["program"].get("degree_total") is None,
      "each change names the words it came from, and the record passed in is never altered")
dot = BIO_TEXT.replace("\n", " \u00b7 ")
check([n["field"] for n in RC.reconcile(bio, dot, "Cabrillo College", "A.S. Degree")[1]] == ["degree_total", "ge_units", "total_units"],
      "the same steps read a page whose pieces are joined by middle dots")
AST_TEXT = BIO_TEXT.replace("Biology", "Astronomy").replace(
    "General electives: any transferable or degree applicable course. 6", "Recommended Major Electives\nComplete the following number of credits: 6")
ast_r = {"program": {"total_units": {"min": 30, "max": 30}, "measure": "units"},
         "blocks": [{"name": "Recommended Major Requirements", "rule": "all",
                     "courses": [{"code": "ASTRO %d" % i, "units": 3} for i in range(1, 11)]},
                    {"name": "Recommended Major Electives", "rule": "choose_units", "minimum": 6, "stated": {"min": 6, "max": 6},
                     "courses": [{"code": "ASTRO 11", "units": 3}, {"code": "ASTRO 12", "units": 3}]}]}
new, notes = RC.reconcile(ast_r, AST_TEXT, "Cabrillo College", "A.S. Degree")
sc = S.score(new, [{"code": "ASTRO %d" % i, "units": 3} for i in range(1, 13)], AST_TEXT, "A.S. Degree")
check(sc["arithmetic"]["status"] == "equal" and sc["arithmetic"]["against"] == "degree"
      and sc["arithmetic"]["computed"] == [60.0, 60.0] and sc["degree"]["status"] == "read",
      "Cabrillo Astronomy (Sam confirmed it): reconciled, a 30-unit major, 6 units of major electives and GE 24 make "
      "the 60 the page prints: %s" % json.dumps(sc["arithmetic"]))
cert_text = AST_TEXT.replace("Astronomy - Associate in Science (A.S.)", "Accounting Certificate of Achievement")
check(RC.reconcile(ast_r, cert_text, "Cabrillo College", "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units")[1] == [],
      "a certificate's page prints its own total in the same words, and the degree steps leave it alone")
check(RC.reconcile(ast_r, AST_TEXT, "Long Beach City College", "A.S. Degree")[1] == [],
      "a college with no reconcile steps keeps its records as read")
read_already = {"program": {"total_units": {"min": None, "max": None}, "degree_total": {"min": 60, "max": 60},
                            "ge_units": {"min": 34, "max": 34}, "open_elective_units": 5}, "blocks": []}
check(RC.reconcile(read_already, BIO_TEXT, "Cabrillo College", "A.A- T Degree")[1] == [],
      "a step never overwrites a figure the reading holds")
both = {"program": {"total_units": {"min": 36, "max": 36}}, "blocks": []}
new, notes = RC.reconcile(both, BIO_TEXT.replace("at least 30 units", "at least 18 units"), "Cabrillo College", "A.S. Degree")
check(new["program"]["total_units"] == {"min": 36, "max": 36} and new["program"]["degree_elective_units"] == {"min": 6, "max": 6}
      and not new["program"].get("open_elective_units"),
      "a major total that is not the minimum sentence's stays, and the degree's electives go beside it")

# A set step (S393, Cerritos): a figure the catalog prints once for every degree, on its own page, set
# where the program page's words point to it, never over a figure the reading holds, citing both.
SET_STEPS = {"Test College": {"awards": "associate", "steps": [
    {"kind": "set", "field": "ge_units", "value": {"min": 21, "max": 21},
     "pattern": "\\(2\\) the General Education requirements",
     "source": "https://example.edu/cgec/", "source_words": "a minimum of 21 units"}]}}
SET_TEXT = ("Total Units 28 \u00b7 ASSOCIATE OF ARTS DEGREE REQUIREMENTS\nComplete a minimum of 60 units to include "
            "(1) the above major requirements, (2) the General Education requirements, and (3) electives as needed")
new, notes = RC.reconcile({"program": {"total_units": {"min": 28, "max": 28}}, "blocks": []}, SET_TEXT,
                          "Test College", "A.A. Degree", steps=SET_STEPS)
check(new["program"]["ge_units"] == {"min": 21, "max": 21} and len(notes) == 1
      and "(2) the General Education requirements" in notes[0]["words"] and "https://example.edu/cgec/" in notes[0]["words"]
      and "a minimum of 21 units" in notes[0]["words"],
      "a set step fills the GE units the catalog's GE page states, citing the program page's words and that page's: %s"
      % json.dumps(notes))
check(RC.reconcile({"program": {"ge_units": {"min": 34, "max": 34}}, "blocks": []}, SET_TEXT, "Test College",
                   "A.A. Degree", steps=SET_STEPS)[1] == []
      and RC.reconcile({"program": {}, "blocks": []}, "Total Units 28", "Test College", "A.A. Degree", steps=SET_STEPS)[1] == [],
      "a set step never overwrites the reading's figure, and needs the program page's words")

# Cerritos (S393): every degree page prints the major's total and "Complete a minimum of 60 units to include
# (1) the above major requirements, (2) the General Education requirements, and (3) electives as needed"
# (college-page-read 38654411937); the CGEC page states GE of 24-28 (read 38656043692). The 60 is a floor.
CER_BIO = ("Program Requirements \u00b7 Course List \u00b7 Code Number\tCourse Title\tUnits \u00b7 Required Courses\n"
           "BIOL 120\tIntroduction To Biological Science\t4.0\nBIOL 200\tPrinciples of Biology\t5.0 \u00b7 BIOL 201\tPrinciples of "
           "Biology\t5.0 \u00b7 CHEM 111\tGeneral Chemistry\t5.0 \u00b7 CHEM 112\tGeneral Chemistry\t5.0 \u00b7 Select one of the "
           "following two courses\nMATH 116\tCalculus for Managerial, Biological and Social Sciences\t4.0\nor MATH 170\tAnalytic "
           "Geometry and Calculus I \u00b7 Total Units\t28 \u00b7 ASSOCIATE OF ARTS DEGREE REQUIREMENTS\nComplete a minimum of 60 "
           "units to include (1) the above major requirements, (2) the General Education requirements, and (3) electives as needed")
CER_BIO_LIST = [{"code": c, "units": u} for c, u in (("BIOL 120", 4), ("BIOL 200", 5), ("BIOL 201", 5), ("CHEM 111", 5),
                                                      ("CHEM 112", 5), ("MATH 116", 4), ("MATH 170", 4))]
cer_bio = {"program": {"total_units": {"min": 28, "max": 28}, "measure": "units"},
           "blocks": [{"name": "Required Courses", "rule": "all", "courses": [{"code": c} for c in
                       ("BIOL 120", "BIOL 200", "BIOL 201", "CHEM 111", "CHEM 112")]},
                      {"name": "Select one", "rule": "choose_courses", "minimum": 1,
                       "courses": [{"code": "MATH 116"}, {"code": "MATH 170"}]}]}
check(S.score(cer_bio, CER_BIO_LIST, CER_BIO, "A.A. Degree")["degree"]["status"] == "major only",
      "Cerritos Biology as read: the major only")
new, notes = RC.reconcile(cer_bio, CER_BIO, "Cerritos College", "A.A. Degree")
sc = S.score(new, CER_BIO_LIST, CER_BIO, "A.A. Degree")
check([n["field"] for n in notes] == ["degree_total", "degree_total_minimum", "ge_units", "electives_fill_degree"]
      and new["program"]["total_units"] == {"min": 28, "max": 28} and new["program"]["ge_units"] == {"min": 24, "max": 28}
      and "cgec" in notes[2]["words"] and sc["degree"]["status"] == "read" and sc["pass"]
      and sc["arithmetic"]["against"] == "program" and sc["arithmetic"]["degree"]["pass"]
      and sc["arithmetic"]["degree"].get("minimum") and sc["arithmetic"]["degree"]["fill"] == [4.0, 8.0],
      "Cerritos Biology reconciled: the 28-unit major stays, the 60 is a minimum, GE 24-28 from the CGEC page, and "
      "electives make up 4 to 8: %s" % json.dumps(sc["arithmetic"]))
CER_AUTO = CER_BIO.replace("Total Units\t28", "Total Units\t42-43").replace("ARTS", "SCIENCE")
auto = {**cer_bio, "program": {"total_units": {"min": 42, "max": 43}, "measure": "units"},
        "blocks": [{"name": "Required Courses", "rule": "all", "courses": [{"code": "AUTO %d" % i} for i in range(1, 10)]}]}
AUTO_LIST = [{"code": "AUTO %d" % i, "units": 5 if i > 1 else None} for i in range(1, 10)]
new, notes = RC.reconcile(auto, CER_AUTO, "Cerritos College", "A.S. Degree")
deg = S.degree_check(new["program"], (60.0, 60.0), 42.0, 43.0, [], CER_AUTO, "A.S. Degree")
check(deg["pass"] and deg.get("minimum") and deg["computed"] == [66.0, 71.0] and deg.get("fill") is None,
      "Cerritos Automotive: a 42-43-unit major and GE 24-28 come to 66-71, past the minimum of 60, which they meet: %s"
      % json.dumps(deg))
check(not S.degree_verdict({"electives_fill_degree": True}, (60.0, 60.0), 66.0, 71.0, "A.S. Degree")["pass"],
      "without the minimum, a non-transfer degree past its printed total still fails")
check(RC.reconcile(cer_bio, CER_BIO.replace("(2) the General Education requirements", "(2) Cal-GETC"),
                   "Cerritos College", "A.A. Degree")[0]["program"].get("ge_units") is None,
      "the GE step needs the page's own words for the local pattern")

# Taft (S415): a transfer degree names Cal-GETC and prints no units for it; its own Cal-GETC page prints none
# (college-page-read 39122581817). The step sets the statewide 34; transferable electives make up the 60.
TAFT_ECE = ("ECEF 1601\tDiversity in Early Care, Education and Family Studies\n3.00 Credits(s) \u00b7 Total Credit Hours: 24 "
            "\u00b7 General Education Requirements: \u00b7 Option 1:\nCSU/UC - Completion of the California General Education "
            "Transfer Curriculum (Cal-GETC) is required.\nElectives:\nAdditional transferable elective units may be used to "
            "reach the required 60 units.\nTotal Credit Hours: 60 \u00b7 Transfer Degree Information")
taft = {"program": {"total_units": {"min": 24, "max": 24}, "degree_total": {"min": 60, "max": 60}, "ge_pattern": "Cal-GETC",
                    "ge_units": {"min": None, "max": None}, "electives_fill_degree": True}, "blocks": []}
check(S.degree_check(taft["program"], (60.0, 60.0), 24.0, 24.0, [], TAFT_ECE, "A.S. T Degree")["status"] == "incomplete",
      "Taft ECE AS-T as read: Cal-GETC named, no units")
new, notes = RC.reconcile(taft, TAFT_ECE, "Taft College", "A.S. T Degree")
deg = S.degree_check(new["program"], (60.0, 60.0), 24.0, 24.0, [], TAFT_ECE, "A.S. T Degree")
check([n["field"] for n in notes] == ["ge_units"] and new["program"]["ge_units"] == {"min": 34, "max": 34}
      and "catalog.mpc.edu" in notes[0]["words"] and deg["pass"] and deg["fill"] == [2.0, 2.0],
      "Taft ECE AS-T reconciled: Cal-GETC 34, electives make up 2: %s" % json.dumps(deg))
# San Joaquin Delta (S415): every degree page prints "Minimum Major Units Required: N", two GE patterns (27 and
# Cal-GETC 34), advises double-counting, then "Minimum Degree Units Required: 60" (college-page-read 39122473643).
SJD_DRAFT = ("Major Requirements - Restricted Electives \u00b7 Complete 3 units selected from: \u00b7 E TECH 80 Applied "
             "Surveying Units: 3.5 \u00b7 Minimum Major Units Required: 18\nGeneral Education\nComplete one of the following "
             "general education patterns:\nSan Joaquin Delta College Associate Degree General Education Pattern Units: 27\n"
             "California General Education Transfer Curriculum (Cal-GETC) Certificate of Achievement Units: 34\nStudents are "
             "advised to double-count courses in the major to also satisfy general education when possible.\n"
             "Minimum Degree Units Required: 60 \u00b7 For more information:")
sjd = {"program": {"total_units": {"min": 18, "max": 18}, "degree_total": {"min": 60, "max": 60},
                   "ge_units": {"min": 27, "max": 34}, "electives_fill_degree": False}, "blocks": []}
check(not S.degree_check(sjd["program"], (60.0, 60.0), 18.0, 18.0, [], SJD_DRAFT, "A.S. Degree")["pass"],
      "San Joaquin Delta Drafting as read: 18 and GE 27-34 against an exact 60 fails")
new, notes = RC.reconcile(sjd, SJD_DRAFT, "San Joaquin Delta College", "A.S. Degree")
deg = S.degree_check(new["program"], (60.0, 60.0), 18.0, 18.0, [], SJD_DRAFT, "A.S. Degree")
check([n["field"] for n in notes] == ["degree_total_minimum", "total_units_minimum"]
      and deg["pass"] and deg.get("minimum") and deg["fill"] == [8.0, 15.0],
      "San Joaquin Delta Drafting reconciled: the 60 is a minimum, courses the student chooses make up 8 to 15: %s"
      % json.dumps(deg))
check(S.degree_check(new["program"], (60.0, 60.0), 18.0, 18.0, [], SJD_DRAFT.replace("Restricted Electives", "Restricted"),
                     "A.S. Degree")["pass"],
      "a floor alone makes up a short sum, on a page that names no electives")
nurse = {"program": {"total_units": {"min": 59.5, "max": 59.5}, "degree_total": {"min": 77.5, "max": 77.5},
                     "ge_units": {"min": 27, "max": 34}}, "blocks": []}
new, _ = RC.reconcile(nurse, SJD_DRAFT.replace("Required: 60", "Required: 77.5"), "San Joaquin Delta College", "A.S. Degree")
check(S.degree_check(new["program"], (77.5, 77.5), 59.5, 59.5, [], SJD_DRAFT, "A.S. Degree")["pass"],
      "San Joaquin Delta Nursing: a 59.5-unit major and GE double-counted past the minimum of 77.5 meet it")
# San Joaquin Delta (S422): every program page prints its total as a floor ("Minimum Units Required: 24" on a
# certificate), and a one-unit alternative in an all-required block (ENGL C1000E 4 beside ENGL C1000 3) carries
# the sum's high end past it (kb/jev_harvest_verdicts/san_joaquin_delta.json: 29 of 35 unequal rows).
SJD_CERT = ("Required Courses \u00b7 ENGL C1000 Academic Reading and Writing Units: 3 \u00b7 or ENGL C1000E Academic "
            "Reading and Writing Units: 4 \u00b7 Minimum Units Required: 24 \u00b7 For more information:")
cert = {"program": {"total_units": {"min": 24, "max": 24}, "measure": "units"},
        "blocks": [{"name": "Required Courses", "rule": "all", "courses": [{"code": "ENGL C1000", "units": 3}]}]}
new, notes = RC.reconcile(cert, SJD_CERT, "San Joaquin Delta College", "Certificate of Achievement")
check([n["field"] for n in notes] == ["total_units_minimum"] and new["program"]["total_units_minimum"] is True,
      "San Joaquin Delta certificate: the program total is marked a floor on a certificate too: %s" % json.dumps(notes))
check(RC.reconcile(cert, SJD_CERT, "San Joaquin Delta College", "Certificate of Achievement")[0]["program"]
      .get("degree_total") is None, "the degree-total steps still read associate degrees only")
prog_lo_hi = lambda rec: S.score(rec, [], SJD_CERT, "Certificate of Achievement")["arithmetic"]
def floor_rec(lo, hi, m):
    # One all-required block: a course of lo - 3 units and ENGL C1000 3, its alternative carrying the sum to hi.
    alt = [{"code": "ENGL C1000E", "units": 3 + hi - lo}] if hi > lo else []
    return {"program": {"total_units": {"min": 24, "max": 24}, "total_units_minimum": m, "measure": "units"},
            "blocks": [{"name": "Required Courses", "rule": "all", "courses": [
                {"code": "ECE 21", "units": lo - 3}, {"code": "ENGL C1000", "units": 3, "alternatives": alt}]}]}
a = prog_lo_hi(floor_rec(24, 25, True))
check(a["pass"] and a.get("minimum") and a["computed"] == [24.0, 25.0],
      "a 24-25 sum meets a floor of 24: %s" % json.dumps(a))
check(not prog_lo_hi(floor_rec(24, 25, None))["pass"], "without the floor, a 24-25 sum against a printed 24 still fails")
check(not prog_lo_hi(floor_rec(26, 28, True))["pass"], "a low end past the floor is still a misread")
check(not prog_lo_hi(floor_rec(22, 25, True))["pass"], "a low end short of the floor fails")
e = prog_lo_hi(floor_rec(24, 24, True))
check(e["pass"] and not e.get("minimum"), "an exact sum passes as equal, without the floor note")

# Orange Coast (S396): the REQUIREMENTS tab's textContent, college page read 38752570705, Management and
# Leadership Studies A.S. (03961). The reading held the major and the 60 and no GE units.
OCC_MGMT = ("Restricted Electives3-4 ACCT A101Financial Accounting ACCT A102Managerial Accounting PHIL A120Ethics "
            "Total Major Units36 - 37 OCC AS General Education 1,2up to 21 Transferable electives as needed to satisfy "
            "unit requirementsvaries Total Minimum Degree Units - OCC AS GE60 1 Some program major units may also meet "
            "GE requirements. 2 Cal-GETC pattern (up to 34 units) may be substituted.")
occ = {"program": {"total_units": {"min": 36, "max": 37}, "degree_total": {"min": 60, "max": 60},
                   "ge_units": {"min": None, "max": None}, "ge_pattern": "OCC AS GE", "electives_fill_degree": True},
       "blocks": []}
check(S.degree_check(occ["program"], (60.0, 60.0), 36.0, 37.0, [], OCC_MGMT, "A.S. Degree")["status"] == "incomplete",
      "Orange Coast Management as read: the 60 and the OCC AS GE pattern, no GE units")
new, notes = RC.reconcile(occ, OCC_MGMT, "Orange Coast College", "A.S. Degree")
deg = S.degree_check(new["program"], (60.0, 60.0), 36.0, 37.0, [], OCC_MGMT, "A.S. Degree")
check([n["field"] for n in notes] == ["degree_total_minimum", "ge_units"]
      and new["program"]["ge_units"] == {"min": None, "max": 21} and notes[0]["words"].endswith("GE60")
      and deg["pass"] and deg.get("minimum") and deg["computed"] == [57.0, 58.0] and deg["fill"] == [2.0, 3.0],
      "Orange Coast Management reconciled: the 60 is a minimum, GE up to 21, electives make up 2 to 3: %s"
      % json.dumps(deg))
bare = {"program": {}, "blocks": []}
new, notes = RC.reconcile(bare, OCC_MGMT, "Orange Coast College", "A.S. Degree")
check([n["field"] for n in notes] == ["total_units", "degree_total", "degree_total_minimum", "ge_units",
                                      "electives_fill_degree"]
      and new["program"]["total_units"] == {"min": 36, "max": 37} and new["program"]["degree_total"] == {"min": 60, "max": 60},
      "Orange Coast, a record holding nothing: the major 36-37 and the 60 from the tab's totals")
check(RC.reconcile(bare, OCC_MGMT.replace("up to 21", "up to 24"), "Orange Coast College", "A.S. Degree")[0]["program"]
      .get("ge_units") is None,
      "the GE step sets 21 only where the page prints 21")
check(RC.reconcile(bare, OCC_MGMT, "Orange Coast College",
                   "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units")[1] == [],
      "Orange Coast's steps read associate degrees only")

# Monterey Peninsula (S396): a local degree names MPC GE or Cal-GETC (read 38749721270, Horticulture A.S. 03599),
# a transfer degree Cal-GETC (read 38843693844, Psychology AA-T); the GE page states 34 and eight 3-unit areas.
MPC_HORT = ("HORT 51 Introduction to Horticulture I 3 HORT 52 Introduction to Horticulture II 3 Additional Requirements "
            "39-42 Complete Competency Requirements, general education pattern (MPC General Education or Cal-GETC), and "
            "electives, if needed, for a total of 60 degree-applicable units.")
MPC_ADT = ("Minimum of 60 CSU-transferable semester units; Completion of a minimum of 18 semester units as detailed in the "
           "Major Requirements; Certified completion of the California General Education Transfer Curriculum (Cal-GETC) "
           "pattern. PSYC C1000 Introduction to Psychology 3")
hort = {"program": {"total_units": {"min": 18, "max": 21}, "degree_total": {"min": 60, "max": 60},
                    "ge_units": {"min": None, "max": None}, "ge_pattern": "MPC General Education or Cal-GETC",
                    "electives_fill_degree": True}, "blocks": []}
new, notes = RC.reconcile(hort, MPC_HORT, "Monterey Peninsula College", "A.S. Degree")
deg = S.degree_check(new["program"], (60.0, 60.0), 18.0, 21.0, [], MPC_HORT, "A.S. Degree")
check([n["field"] for n in notes] == ["ge_units"] and new["program"]["ge_units"] == {"min": 24, "max": 34}
      and "catalog.mpc.edu" in notes[0]["words"] and deg["pass"] and deg["computed"] == [42.0, 55.0]
      and deg["fill"] == [5.0, 18.0],
      "Monterey Peninsula Horticulture: MPC GE or Cal-GETC is 24-34, an 18-21 major comes to 42-55, electives "
      "make up the 60: %s" % json.dumps(deg))
adt = {"program": {"total_units": {"min": 18, "max": 20}, "degree_total": {"min": 60, "max": 60},
                   "ge_units": {"min": None, "max": None}, "ge_pattern": "Cal-GETC"}, "blocks": []}
new, notes = RC.reconcile(adt, MPC_ADT, "Monterey Peninsula College", "A.A.-T Degree")
check([n["field"] for n in notes] == ["ge_units"] and new["program"]["ge_units"] == {"min": 34, "max": 34},
      "Monterey Peninsula's transfer degree: Cal-GETC's 34")
check(RC.reconcile(hort, MPC_HORT + " " + MPC_ADT, "Monterey Peninsula College", "A.S. Degree")[0]["program"]["ge_units"]
      == {"min": 24, "max": 34},
      "a page naming both keeps the local pattern's span: the Cal-GETC step fills only an empty field")

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements pilot (%d checks)" % checks[0])
