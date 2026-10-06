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
]
for code, text in MATCH:
    check(P.code_pattern(code).search(text), "%r must be found in %r" % (code, text))
for code, text in REFUSE:
    check(not P.code_pattern(code).search(text), "%r must NOT be found in %r" % (code, text))

check(P.norm_code("IWAP 40.1") == P.norm_code("IWAP 40.10") == "IWAP401",
      "IWAP 40.1 and IWAP 40.10 are one course")
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
check(len(fixtures) >= 16, "the capture pass's 16 programs are filed (run 4)")
for path in fixtures:
    with open(path) as fh:
        fx = json.load(fh)
    again = sorted(P.find_codes(fx["text"], fx["closed_list"]))
    check(again == sorted(fx["codes_found"]),
          "%s: the matcher still finds on the filed text what it found on the runner "
          "(%d now, %d then)" % (os.path.basename(path), len(again), len(fx["codes_found"])))
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
check(X3.RECORD_SHAPE == 3, "the extraction pass stamps record shape 3 on what it files")

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
shape3 = [json.load(open(p)) for p in records]
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

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements pilot (%d checks)" % checks[0])
