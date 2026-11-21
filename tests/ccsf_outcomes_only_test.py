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
import re
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
big = HTML.replace("<body>", "<body><script>" + "x" * read.READER_HTML_CAP + "</script>")
whole = read.read_one(_Reader(html=big), COURSE)
check("2 a page past the Reader's HTML cap is parsed from the whole page, so it is not cut (trial 44738175152)",
      whole["html_cut"] is False and whole["html_chars"] == len(big) and whole["outcomes"] == row["outcomes"],
      (whole["html_cut"], whole["html_chars"]))


class _NoContent(_Reader):
    def __init__(self, html):
        super().__init__(html=html)
        self.page.content = lambda: (_ for _ in ()).throw(RuntimeError("closed"))


cut = read.read_one(_NoContent(big), COURSE)
check("2 GUARD: when only the Reader's cut copy was parsed, the row says html_cut",
      cut["html_cut"] is True and cut["html_chars"] == read.READER_HTML_CAP, (cut["html_cut"], cut["html_chars"]))
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
    fp = read.parser_fingerprint()

    def trial(rows_, parser=fp):
        json.dump({"parser_fingerprint": parser, "rows": rows_}, open(os.path.join(folder, "read.json"), "w"))

    def counts(rows_, slo=2, src="the page's SLO section in trial 7's log, by eye"):
        eye_ = {"trial": "7", "pages": {r["code"]: {"slo": slo, "objective": 0, "by": "fixture", "from": src,
                                                    "at": "2026-11-20T13:00:00Z"} for r in rows_}}
        json.dump(eye_, open(path, "w"))
        return eye_

    path = os.path.join(tmp, "recall.json")
    trial(rows)
    eye = counts(rows)
    rc = read.rows_recall(path, tmp)
    check("5 the count matches each row's parsed outcomes and objectives", rc["right"] == 11 and rc["pages"] == 12,
          rc)
    check("5 GUARD: a row whose page reached a cap counts as wrong",
          [w[0] for w in rc["wrong"]] == ["BIO 1"] and rc["wrong"][0][2] == "page reached a cap", rc["wrong"])
    check("5 11 of 12 passes the 90% gate", rc["ok"])
    eye["pages"]["X 1"]["slo"] = 3
    json.dump(eye, open(path, "w"))
    check("5 GUARD: a page count that differs from the parse fails it (10 of 12)", not read.rows_recall(path, tmp)["ok"])
    check("5 no recall file: the count is 0 of 0 and fails", not read.rows_recall(os.path.join(tmp, "none.json"))["ok"])
    # The second reader's fake trials on #3601: each opened the first gate.
    empty = [{**row, "code": "E %d" % i, "outcomes": [], "shape": "none", "fingerprint": None} for i in range(12)]
    trial(empty)
    counts(empty, slo=0)
    rc = read.rows_recall(path, tmp)
    check("5 GUARD: a trial of 12 empty rows is refused, though every count matches", not rc["ok"]
          and "0 of 12 pages" in (rc["why"] or ""), rc["why"])
    refused = [{**row, "code": "R %d" % i, "status": 403, "outcomes": [], "shape": "none"} for i in range(12)]
    trial(refused)
    counts(refused, slo=0)
    rc = read.rows_recall(path, tmp)
    check("5 GUARD: a trial of 12 rows refused with 403 is refused, each row counted wrong", not rc["ok"]
          and rc["right"] == 0 and all(w[2] == "status 403" for w in rc["wrong"]), rc)
    good = [{**row, "code": "G %d" % i} for i in range(12)]
    trial(good, parser="an older parser")
    counts(good)
    rc = read.rows_recall(path, tmp)
    check("5 GUARD: a trial another parser filed is refused", not rc["ok"] and "filed by parser" in rc["why"], rc["why"])
    trial(good)
    check("5 the same trial under the current parser passes", read.rows_recall(path, tmp)["ok"])
    counts(good, src="row")
    rc = read.rows_recall(path, tmp)
    check("5 GUARD: counts read off the trial's own rows name no source and fail", not rc["ok"] and rc["right"] == 0, rc)
    keep = read.STOP
    read.STOP = re.compile(keep.pattern.replace("contents?", "content"), keep.flags)
    moved = read.parser_fingerprint()
    read.STOP = keep
    check("5 the fingerprint moves when a parser pattern moves, and is steady otherwise",
          moved != fp and read.parser_fingerprint() == fp)
    # #3601's second reader: _ws, READER_HTML_CAP and the census's SLO_HEADING each reach a parse.
    keep_cap, keep_head = read.READER_HTML_CAP, read.cor.SLO_HEADING
    read.READER_HTML_CAP = keep_cap + 1
    by_cap = read.parser_fingerprint()
    read.READER_HTML_CAP = keep_cap
    read.cor.SLO_HEADING = re.compile(keep_head.pattern + "|NEVER PRINTED", keep_head.flags)
    by_head = read.parser_fingerprint()
    read.cor.SLO_HEADING = keep_head
    check("5 the fingerprint moves with the Reader's HTML cap and the census's SLO heading, and names _ws",
          by_cap != fp and by_head != fp and read.parser_fingerprint() == fp and "_ws" in read.PARSER_PARTS)
    check("5 the Reader's cap is the census Reader's own number, imported",
          read.READER_HTML_CAP == read.cor.census.HTML_CAP)
    # #3601's second reader: the gate checks each counted row's host.
    trial(good)
    counts(good)
    check("5 with no host named a tmp recall file reads every row", read.rows_recall(path, tmp)["ok"])
    rc = read.rows_recall(path, tmp, host="rccd.curriqunet.com")
    check("5 GUARD: rows read from another host than the gate's count wrong", not rc["ok"] and rc["right"] == 0
          and all("read from ccsf.curricunet.com" in w[2] for w in rc["wrong"]), rc["wrong"][:1])
    check("5 the gate's own host passes", read.rows_recall(path, tmp, host="ccsf.curricunet.com")["ok"])


# 5b. A page parsed from the Reader's cut copy that finds nothing files "cut", never "none" (COBIx on #3586, point 1).
class _Page:
    def content(self):
        raise RuntimeError("the browser lost the page")


class _Reader:
    page = _Page()


keep_load = read.cor.load_full
long_html = "<html><body>" + "x" * read.READER_HTML_CAP + "</body></html>"
try:
    read.cor.load_full = lambda reader, url: {"status": 200, "final_url": url, "body": "Course Outline\nUnits: 3\n",
                                              "html": long_html[:read.READER_HTML_CAP], "title": "x"}
    other = "https://rccd.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=4"
    got = read.read_one(_Reader(), {"code": "ENG 1", "report": other})
    check("5b GUARD: a cut page that parses nothing files shape cut, with why", got["shape"] == "cut"
          and got["html_cut"] and "cap" in (got.get("why_none") or ""), {k: got.get(k) for k in ("shape", "why_none")})
    read.cor.load_full = lambda reader, url: {"status": 200, "final_url": url, "body": "Course Outline\nUnits: 3\n",
                                              "html": "<html><body>short</body></html>", "title": "x"}
    got = read.read_one(_Reader(), {"code": "ENG 1", "report": other})
    check("5b a page under the cap that parses nothing still files none", got["shape"] == "none"
          and not got["html_cut"], got["shape"])
finally:
    read.cor.load_full = keep_load

# 6. The excerpt a person counts from: the SLO section as printed, cut by its two headings, never the page.
ex = read.slo_excerpt(TEXT)
check("6 the excerpt is the section between STUDENT LEARNING OUTCOMES and CONTENTS",
      ex == ["Upon completion of this course, a student will be able to:",
             "1. Identify and evaluate academic and student support services.",
             "2. Analyze the behavior of diverse groups and individuals."], ex)
check("6 GUARD: the excerpt and its log lines carry no staff name",
      STAFF not in json.dumps(ex) and STAFF not in read.excerpt_log("AAPS 100", ex))
check("6 GUARD: with no CONTENTS heading in reach nothing is printed",
      read.slo_excerpt(TEXT.replace("CONTENTS\n", "")) is None
      and STAFF not in read.excerpt_log("AAPS 100", read.slo_excerpt(TEXT.replace("CONTENTS\n", ""))))
check("6 report 28 is recorded as printing no objectives", not read.prints_objectives(REPORT))

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

# 6. S691: Saddleback's and Irvine Valley's host and Rio Hondo's read outcomes only from their first trial, log no
# excerpt until a person records the host's heading pair, and a full read there refuses with no recall file.
for host in ("saddleback.curriqunet.com", "riohondo.curriqunet.com"):
    url = "https://%s/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=201" % host
    check("6 %s files parsed outcomes only, its trial no page file" % host,
          read.outcomes_only(url) and set(read.file_row({"code": "X 1", "report": url, "title_printed": STAFF,
                                                          "outcomes": ["a"]})) <= set(read.OUTCOMES_ONLY_KEYS))
    check("6 %s logs no excerpt until its heading pair is recorded, and the log names none of the page" % host,
          read.slo_excerpt(TEXT, host) is None and STAFF not in read.excerpt_log("X 1", read.slo_excerpt(TEXT, host), host))
    check("6 GUARD: %s has no recall file yet, so a full read is refused" % host,
          host not in read.RECALL_BY_HOST or os.path.exists(read.RECALL_BY_HOST[host]))
check("6 City College of San Francisco's excerpt is unchanged by the host argument",
      read.slo_excerpt(TEXT) == read.slo_excerpt(TEXT, "ccsf.curricunet.com") is not None)
RIO = ("Outline w/SLO\nI. Cover\nOriginator: " + STAFF + "\nV. Course Objectives\nThe Student Will Be Able To:\nRecord transactions.\n"
       "Prepare statements.\nVI. Methods of Instruction:\nLecture\nIX. Student Learning Outcome\n"
       "1. Prepare a balance sheet.\n2. Explain accrual accounting.\nX. Texts/Instructional Materials:\n" + STAFF + "\n")
rio = "riohondo.curriqunet.com"
check("6 Rio Hondo's excerpts: IX. Student Learning Outcome to X. Texts, V. Course Objectives to VI. Methods; no "
      "person's line in either",
      read.slo_excerpt(RIO, rio) == ["1. Prepare a balance sheet.", "2. Explain accrual accounting."]
      and read.objectives_excerpt(RIO, rio) == ["The Student Will Be Able To:", "Record transactions.", "Prepare statements."]
      and STAFF not in read.excerpt_log("X 1", read.slo_excerpt(RIO, rio), rio)
      and read.objectives_excerpt(RIO, "ccsf.curricunet.com") is None)
got_rio = read.parse_page("", RIO, read.page_system("https://%s/x" % rio), "https://%s/x?reportId=358" % rio)
check("6 the parser reads Rio Hondo's Roman-numbered sections: 2 SLOs and 2 objectives, the headings without numerals, "
      "and its lead-in 'The Student Will Be Able To:' is the lead, never an objective (trial 44884988614)",
      got_rio["outcomes"] == ["Prepare a balance sheet.", "Explain accrual accounting."]
      and got_rio["objectives"] == ["Record transactions.", "Prepare statements."]
      and got_rio["heading"] == "Student Learning Outcome" and got_rio["objectives_heading"] == "Course Objectives"
      and got_rio["objectives_lead"] == "The Student Will Be Able To:", got_rio)
EGSS = ("V. Course Objectives\nThe Student Will Be Able To:\nStudents will be able to analyze concepts of ethnic studies.\n"
        "Students will be able to apply theory to critical events.\nVI. Methods of Instruction:\n")
two_leads = ("Course Objectives\nAt the conclusion of this course, the student should be able to:\n"
             "Upon completion of the course, students will be able to:\nInterpret results.\nCourse Content\n")
check("6 after a lead-in, a line that opens 'Students will be able to' and states the objective is an objective "
      "(Rio Hondo EGSS 110, trial 44885957222); a second line that ends as a lead-in is still passed over (Santa Ana)",
      read.objectives_of(EGSS)["objectives"] == ["Students will be able to analyze concepts of ethnic studies.",
                                                 "Students will be able to apply theory to critical events."]
      and read.objectives_of(two_leads)["objectives"] == ["Interpret results."], read.objectives_of(EGSS))
rc_rio = read.rows_recall(read.RIO_HONDO_RECALL)
check("6 Rio Hondo's self-recall count passes: 12 of 12 pages, SLOs and objectives counted by eye from trial "
      "44886389239's log, bound to its parser", rc_rio["ok"] and rc_rio["right"] == 12 and rc_rio["pages"] == 12, rc_rio)
with tempfile.TemporaryDirectory() as tmp:
    want = json.load(open(read.RIO_HONDO_RECALL))
    bad = dict(want, pages=dict(want["pages"]))
    bad["pages"]["EGSS 110"] = dict(bad["pages"]["EGSS 110"], objective=0)
    bad["pages"]["ACCT 100"] = dict(bad["pages"]["ACCT 100"], **{"from": "row"})
    path = os.path.join(tmp, "r.json")
    json.dump(bad, open(path, "w"))
    rc_bad = read.rows_recall(path)
check("6 GUARD: a Rio Hondo count changed or sourced from the row fails the gate (2 wrong of 12)",
      not rc_bad["ok"] and rc_bad["right"] == 10 and len(rc_bad["wrong"]) == 2, rc_bad)
mix = [{"course_id": 29363, "title": "Introduction to Public Speaking", "reports": ["u1"]},
       {"course_id": 29364, "title": "Introduction to Public Speaking - Honors", "reports": ["u2"]}]
retitled = [{"course_id": 8474, "title": "Foundations of Two-Dimensional Design", "reports": ["u1"]},
            {"course_id": 11308, "title": "Two-Dimensional Design", "reports": ["u2"]}]
check("6 a code that holds a course and its honors or lab version is left unread (Saddleback COMM 1000); retitled "
      "versions of one course (Crafton Hills ART 120) and one course id are read",
      read.variant_mix(mix) and not read.variant_mix(retitled) and not read.variant_mix(mix[:1])
      and not read.variant_mix([dict(mix[0]), dict(mix[1], reports=[])]))
probe = read.probe_log("X 1", TEXT)
check("6 a host with no heading pair logs only the lines that name outcomes or objectives, never a person's line",
      STAFF not in probe and "STUDENT LEARNING OUTCOMES" in probe
      and all(read.PROBE.search(ln.split("| ", 1)[1]) for ln in probe.split("\n")[1:-1]), probe)
_saved = dict(read.EXCERPT_BY_HOST)
read.EXCERPT_BY_HOST["x.example"] = [("Course Outcomes", ("Content", "Textbooks")), ("STUDENT LEARNING OUTCOMES", "CONTENTS")]
try:
    two = read.slo_excerpt(TEXT, "x.example")
finally:
    read.EXCERPT_BY_HOST.clear()
    read.EXCERPT_BY_HOST.update(_saved)
check("6 a host may record several heading pairs; the first whose SLO heading the page prints decides",
      two == read.slo_excerpt(TEXT) and read.excerpt_pairs("nowhere.example") == [], two)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("ok   " if ok else "FAIL ") + name + ("" if ok else "  %s" % (why,)))
print("\nccsf_outcomes_only_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
raise SystemExit(1 if failed else 0)
