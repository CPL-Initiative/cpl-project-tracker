#!/usr/bin/env python3
"""City College of San Francisco's outline reads file parsed outcomes only (S690; d-ccsf-outline-trial-no-staff-names-s689).

Report 28 on ccsf.curricunet.com names curriculum staff (second reader on #3586, S689). The failure modes these checks
pin: a CCSF trial filing each page's whole text and HTML, as every other host's trial does, so a staff name lands on
a branch; a row carrying the page's title or text beside its outcomes; the workflow keeping a page file that reached
a CCSF folder; CCSF's CONTENTS heading filed as the last outcome on every page; a full read run before anyone has
counted a trial's rows by eye; a trial that parsed a page the Reader's caps would cut in a full read
(p-reader-cap-hides-mtsac-results-s689). Pure-stdlib python; nothing here reaches the network.
"""
import gzip
import importlib.util
import json
import os
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("course_outcomes_read", os.path.join(ROOT, "kb", "_course_outcomes_read.py"))
read = importlib.util.module_from_spec(spec)
spec.loader.exec_module(read)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


REPORT = "https://ccsf.curricunet.com/DynamicReports/AllFieldsReportByEntity/15634?entityType=Course&reportId=28"
STAFF = "Pat Q. Staffperson"
# A report 28 page as COBIx read AAPS 100's (#3533), with a person named above and below the outcomes.
TEXT = ("GENERAL DESCRIPTION\nCourse Outline of Record\nOriginator: " + STAFF + "\nUnits: 3\nLecture hours 54\n"
        "COURSE SPECIFICS\nCATALOG DESCRIPTION\nAn orientation to academic success.\n"
        "STUDENT LEARNING OUTCOMES\nUpon completion of this course, a student will be able to:\n"
        "1. Identify and evaluate academic and student support services.\n"
        "2. Analyze the behavior of diverse groups and individuals.\n"
        "CONTENTS\nCourse Content: study skills\nINSTRUCTIONAL METHODOLOGY\nMethods of Evaluation: exams\n"
        "CLASSIFICATION\nDepartment Chair: " + STAFF + "\n")
HTML = "<html><head><title>Course Outline: " + STAFF + "</title></head><body><pre>" + TEXT + "</pre></body></html>"


class _Page:
    def __init__(self, text, html):
        self.text, self.html = text, html

    def evaluate(self, js, arg=None):
        return self.text

    def content(self):
        return self.html


class _Reader:
    def __init__(self, text=TEXT, html=HTML):
        self.page = _Page(text, html)

    def load(self, url):
        return {"url": url, "final_url": url, "status": 200, "title": "Course Outline: " + STAFF,
                "body": self.page.text[:6000], "html": self.page.html[:read.READER_HTML_CAP],
                "content_type": "text/html", "links": []}


COURSE = {"code": "AAPS 100", "title": "Achieving an Academic Attitude", "course_id": 15634, "report": REPORT,
          "named_by": ["city_of_san_francisco"]}

# 1. The host and the parse.
check("1 ccsf.curricunet.com is an outcomes-only host; another host is not",
      read.outcomes_only(REPORT) and not read.outcomes_only("https://www.mtsac.edu/slo/index.html?course=X"))
row = read.read_one(_Reader(), COURSE)
check("1 the two outcomes parse, CONTENTS is a heading and never an outcome",
      row["outcomes"] == ["Identify and evaluate academic and student support services.",
                          "Analyze the behavior of diverse groups and individuals."], row["outcomes"])
check("1 the lead-in is filed as the lead, never an outcome",
      (row.get("lead") or "").startswith("Upon completion"), row.get("lead"))
check("1 the section headings are filed as heading words only, in the page's order",
      row.get("section_heads") == ["COURSE OUTLINE", "UNITS", "CATALOG DESCRIPTION", "STUDENT LEARNING OUTCOMES",
                                   "CONTENTS", "COURSE CONTENT", "METHODS OF EVALUATION"], row.get("section_heads"))

# 2. No page text in a CCSF row.
check("2 GUARD: the row keeps only the outcomes-only fields",
      set(row) <= set(read.OUTCOMES_ONLY_KEYS), sorted(set(row) - set(read.OUTCOMES_ONLY_KEYS)))
check("2 GUARD: no staff name anywhere in the row (the page's title stays out)",
      STAFF not in json.dumps(row) and "Originator" not in json.dumps(row))
check("2 the row says whether either cap cut the page",
      row["text_cut"] is False and row["html_cut"] is False and row["html_chars"] == len(HTML))
other = read.read_one(_Reader(), {**COURSE, "report": "https://example.edu/outline/1"})
check("2 another host's row is unchanged: it keeps its page title", "title_printed" in other
      and "section_heads" not in other)

# 3. A CCSF trial files no page file; another host's trial does.
with tempfile.TemporaryDirectory() as tmp:
    check("3 GUARD: a CCSF trial page writes no file", read.file_trial_page(_Reader(), tmp, COURSE) == []
          and os.listdir(tmp) == [])
    wrote = read.file_trial_page(_Reader(), tmp, {**COURSE, "report": "https://example.edu/outline/1"})
    check("3 another host's trial still files the page's text and HTML", len(wrote) == 2
          and all(os.path.exists(p) for p in wrote))

# 4. The workflow's guard: page files in a CCSF read folder are removed, another host's kept.
with tempfile.TemporaryDirectory() as tmp:
    ccsf, rccd = os.path.join(tmp, "trial_9"), os.path.join(tmp, "trial_8")
    os.makedirs(ccsf)
    os.makedirs(rccd)
    json.dump({"host": "https://ccsf.curricunet.com/", "rows": [row]}, open(os.path.join(ccsf, "read.json"), "w"))
    json.dump({"host": "https://rccd.curriqunet.com/", "rows": [other]}, open(os.path.join(rccd, "read.json"), "w"))
    for folder in (ccsf, rccd):
        open(os.path.join(folder, "AAPS_100.txt"), "w").write(TEXT)
        with gzip.open(os.path.join(folder, "AAPS_100.html.gz"), "wt") as f:
            f.write(HTML)
    gone = read.strip_page_files(tmp)
    check("4 GUARD: the CCSF folder's page files are removed", sorted(os.listdir(ccsf)) == ["read.json"]
          and len(gone) == 2, os.listdir(ccsf))
    check("4 another host's page files stay", len(os.listdir(rccd)) == 3)
    leaked = [f for d, _, fs in os.walk(ccsf) for f in fs if STAFF in open(os.path.join(d, f), errors="ignore").read()]
    check("4 GUARD: nothing left in the CCSF folder names the staff member", leaked == [], leaked)

# 5. The self-recall count and the gate.
with tempfile.TemporaryDirectory() as tmp:
    folder = os.path.join(tmp, "trial_7")
    os.makedirs(folder)
    cut = {**row, "code": "BIO 1", "text_cut": True}
    rows = [row, cut] + [{**row, "code": "X %d" % i} for i in range(10)]
    json.dump({"rows": rows}, open(os.path.join(folder, "read.json"), "w"))
    eye = {"trial": "7", "pages": {r["code"]: {"slo": 2, "objective": 0, "by": "fixture"} for r in rows}}
    path = os.path.join(tmp, "recall.json")
    json.dump(eye, open(path, "w"))
    rc = read.rows_recall(path, tmp)
    check("5 the count matches each row's parsed outcomes and objectives", rc["right"] == 11 and rc["pages"] == 12,
          rc)
    check("5 GUARD: a row whose page reached a cap counts as wrong",
          [w[0] for w in rc["wrong"]] == ["BIO 1"] and rc["wrong"][0][2] == "page reached a cap", rc["wrong"])
    check("5 11 of 12 passes the 90% gate", rc["ok"])
    eye["pages"]["X 1"]["slo"] = 3
    json.dump(eye, open(path, "w"))
    check("5 10 of 12 fails it", not read.rows_recall(path, tmp)["ok"])
    check("5 no recall file: the count is 0 of 0 and fails", not read.rows_recall(os.path.join(tmp, "none.json"))["ok"])

index = os.path.join(ROOT, "kb", "course_outline_index", "index_44696736058.json")
rc = read.rows_recall(read.CCSF_RECALL)
if not rc["ok"]:
    try:
        read.main(["--index", index, "--slugs", "city_of_san_francisco", "--part", "1", "--of", "1"])
        refused = False
    except SystemExit as exc:
        refused = "self-recall" in str(exc)
    check("5 GUARD: with CCSF's count short, a full read refuses before it loads a page", refused)
else:
    check("5 CCSF's self-recall count passes, so a full read may run", rc["ok"], rc)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("ok   " if ok else "FAIL ") + name + ("" if ok else "  %s" % (why,)))
print("\nccsf_outcomes_only_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
raise SystemExit(1 if failed else 0)
