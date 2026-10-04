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

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements pilot (%d checks)" % checks[0])
