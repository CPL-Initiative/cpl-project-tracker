#!/usr/bin/env python3
"""Guards for kb/_course_outline_index.py (S373; Sam, Open Asks Sheet 70 card 3,
"Every course in the loaded records", and "start the Riverside course index").

One spelling per course code, as the program records and the outline lists print
them, and the courses the loaded records name for the three RCCD colleges. Pure
stdlib; run from the repo root.
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("idx", os.path.join(ROOT, "kb", "_course_outline_index.py"))
idx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(idx)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


cases = {"ACC-1A": "ACC 1A", "ACC 1A": "ACC 1A", "acc 1a": "ACC 1A", "ACC 19L": "ACC 19L",
         "KIN-A11": "KIN A11", "COS-60A1": "COS 60A1", "ADJ-R1A2": "ADJ R1A2",
         "ACCT 116A": "ACCT 116A", "CHIL 291D": "CHIL 291D",
         "ADJ-B1B": "ADJ B1B", "ADJ B1B": "ADJ B1B", "ARTH C1100H": "ARTH C1100H",
         "Course Outline: ACC-1A Principles of Accounting I": "ACC 1A"}
got = {k: idx.norm_code(k) for k in cases}
check("1 one spelling per course: a hyphen or a space, either case; RCCD's letter-led and A1-suffixed numbers; "
      "a common course number (C1100) keeps its letter",
      got == cases, {k: v for k, v in got.items() if v != cases[k]})
check("1 text with no course code reads none", idx.norm_code("Dashboard") is None and idx.norm_code("") is None)

wanted = idx.record_codes(["riverside_city", "moreno_valley", "norco"])
union = set().union(*wanted.values())
check("2 the loaded RCCD records name over a thousand courses, each read to one spelling",
      all(len(v) > 500 for v in wanted.values()) and len(union) > 1000
      and all(idx.norm_code(c) == c for c in union), {k: len(v) for k, v in wanted.items()})
check("2 'ACC 1A' and 'ACC-1A' in the records are one course", "ACC 1A" in union and "ACC-1A" not in union)

# 4. The curriQunet index (discovery run 38312406074): the page's own search, replayed.
post = ("options%5Bpagesize%5D=25&options%5Bpage%5D=0&options%5BtitleFilter%5D=&options%5BentityTypeId%5D=1")
check("4 the captured search body takes this page's size and number, the rest kept",
      idx.with_page(post, 200, 3) == "options%5Bpagesize%5D=200&options%5Bpage%5D=3&options%5BtitleFilter%5D=&options%5BentityTypeId%5D=1"
      and idx.with_page("options[pagesize]=25&options[page]=0", 50, 1) == "options[pagesize]=50&options[page]=1")
rows = [
    {"CourseId": 1, "SubjectCode": "ACC", "CourseNumber": "1A", "Title": "Principles of Accounting I",
     "StatusTitle": "Historical", "ProposalTypeTitle": "New Course", "MetaReports": [{"Id": 97, "Title": "Course Outline"}]},
    {"CourseId": 3794, "SubjectCode": "ACC", "CourseNumber": "1A", "Title": "Principles of Accounting I",
     "StatusTitle": "Active", "ProposalTypeTitle": "Course Minor Modification",
     "MetaReports": [{"Id": 97, "Title": "Course Outline"}, {"Id": 12, "Title": "Impact Report"}]},
    {"CourseId": 3800, "SubjectCode": "ACC", "CourseNumber": "1ADE", "Title": "Principles of Accounting I",
     "StatusTitle": "Active", "ProposalTypeTitle": "Distance Education Proposal", "MetaReports": [{"Id": 97, "Title": "Course Outline"}]},
    {"CourseId": 9001, "SubjectCode": "KIN", "CourseNumber": "A11", "Title": "Yoga", "StatusTitle": "Active",
     "ProposalTypeTitle": "New Course", "MetaReports": []},
]
ix = idx.build_index(rows, "https://rccd.curriqunet.com/")
check("4 the index keeps active outlines only: a historical proposal and a distance education addendum are left out",
      list(ix) == ["ACC 1A", "KIN A11"] and [x["course_id"] for x in ix["ACC 1A"]] == [3794], ix)
check("4 a course's outline address is its CourseId with the report titled for the outline",
      ix["ACC 1A"][0]["reports"] == ["https://rccd.curriqunet.com/Report/Course/GetReport/3794?reportId=97"]
      and ix["KIN A11"][0]["reports"] == [])

# 5. The address form is the host's own (discovery run 38347883491, SDCCD).
sd = "https://sdccd.curriqunet.com/"
sd_rows = [{"CourseId": 18607, "SubjectCode": "AAPI", "CourseNumber": "103", "Title": "Introduction to Pacific Islander Studies",
            "StatusTitle": "Active", "ProposalTypeTitle": "New Credit Course",
            "MetaReports": [{"Id": 4, "Title": "All Fields"}, {"Id": 493, "Title": "Course Outline Report"}]}]
sd_links = [sd + "#", sd + "DynamicReports/AllFieldsReportByEntity/18607?entityType=Course&reportId=4",
            sd + "DynamicReports/AllFieldsReportByEntity/18607?entityType=Course&reportId=493"]
form = idx.report_form(sd_links, sd_rows, sd)
check("5 SDCCD's own outline link gives its address form, the course and report ids as slots",
      form == "DynamicReports/AllFieldsReportByEntity/{course_id}?entityType=Course&reportId={report_id}", form)
sd_ix = idx.build_index(sd_rows, sd, form)
check("5 an SDCCD outline address is the dynamic report, the All Fields report left out",
      sd_ix["AAPI 103"][0]["reports"] == [sd + "DynamicReports/AllFieldsReportByEntity/18607?entityType=Course&reportId=493"],
      sd_ix)
rev = dict(sd_rows[0], CourseId=20839, SubjectCode="AAPI", CourseNumber="124", MetaReports=[
    {"Id": 43, "Title": "Course Outline Comparison Report",
     "Url": '<a class="dropdown-item comparison-report-link" data-report-id="43" href="#">'},
    {"Id": 1, "Title": "All Fields Comparison Report"}, {"Id": 4, "Title": "All Fields"},
    {"Id": 493, "Title": "Course Outline Report"}])
check("5 a comparison report is no outline: a revision reads its Course Outline Report only",
      idx.outline_reports(rev, sd, form) == [sd + "DynamicReports/AllFieldsReportByEntity/20839?entityType=Course&reportId=493"]
      and idx.outline_reports(dict(rev, MetaReports=[{"Id": 43, "Title": "Outline", "Url": 'class="comparison-report-link"'}]),
                              sd, form) == [])
titles = {(t["id"], t["read"]) for t in idx.report_titles(sd_rows + [rev])}
check("5 the run lists every report by id and title, and which one it reads",
      (493, True) in titles and (43, False) in titles and (4, False) in titles, titles)
af = idx.build_index([rev], sd, form, r"^All Fields$")
check("5 a host whose outline prints objectives only reads the report its .run names (SDCCD: All Fields, 4)",
      af["AAPI 124"][0]["reports"] == [sd + "DynamicReports/AllFieldsReportByEntity/20839?entityType=Course&reportId=4"]
      and idx.REPORT_TITLE == "outline", af)
check("5 RCCD's own link gives RCCD's form, so its index is unchanged",
      idx.report_form(["https://rccd.curriqunet.com/Report/Course/GetReport/3794?reportId=97"], rows,
                      "https://rccd.curriqunet.com/") == idx.LEGACY_FORM)
check("5 a link counts only on this host and for a CourseId the search returned; none leaves RCCD's form",
      idx.report_form([sd + "DynamicReports/AllFieldsReportByEntity/99?entityType=Course&reportId=493",
                       "https://other.curriqunet.com/DynamicReports/AllFieldsReportByEntity/18607?entityType=Course&reportId=493"],
                      sd_rows, sd) is None and idx.report_form([], sd_rows, sd) is None)

# 6. A trigger file main already holds starts nothing (S376): a branch that merged main
# carried #2065's .run, and its next push re-ran the SDCCD index. Every workflow a
# kb/ dot-file starts must gate its work on that file differing from main's.
import glob
import re as _re
gated = {}
for wf in sorted(glob.glob(os.path.join(ROOT, ".github", "workflows", "*.yml"))):
    text = open(wf).read()
    m = _re.search(r"push:.*?paths:\s*\n\s*- '(kb/[^']*/\.[a-z_-]+)'", text, _re.S)
    if not m:
        continue
    trigger = m.group(1)
    jobs = text.split("\njobs:\n", 1)[1]
    names = _re.findall(r"^  ([a-z_-]+):\s*$", jobs, _re.M)
    others = [n for n in names if n != "gate"]
    gated[os.path.basename(wf)] = (
        "gate" in names
        and "git fetch -q --depth=1 origin main" in jobs
        and ("git diff --quiet FETCH_HEAD -- %s" % trigger) in jobs
        and all(_re.search(r"^  %s:\s*\n(?:    .*\n)*?    needs: \[?[^\n]*\bgate\b" % n, jobs, _re.M) for n in others)
        and jobs.count("needs.gate.outputs.go == '1'") >= 1)
check("6 every workflow a kb/ trigger file starts runs only when the pushed file differs from main's",
      {"course-outline-census.yml", "course-outline-index.yml"} <= set(gated) and all(gated.values()), gated)

src = open(os.path.join(ROOT, "kb", "_course_outline_index.py")).read()
check("3 the index reads public pages only and never addresses the database (no Supabase address, REST path, "
      "rpc or PATCH); its one POST is the college's own search, replayed from the page",
      "supabase" not in src.lower() and "/rest/v1" not in src and "/rpc/" not in src and "PATCH" not in src
      and src.count("method: 'POST'") == 1)

# 7. S691: a host whose current outlines carry another status word, one host holding two colleges, and a dashboard
# that posts no search until its Search button is pressed.
socccd = [
    {"CourseId": 16961, "SubjectCode": "ACCT", "CourseNumber": "1A", "StatusTitle": "Archive",
     "ProposalTypeTitle": "Saddleback - New Course", "MetaReports": [{"Id": 201, "Title": "Course Outline", "ClientId": 2}]},
    {"CourseId": 20001, "SubjectCode": "ACCT", "CourseNumber": "1A", "StatusTitle": "Approved",
     "ProposalTypeTitle": "Saddleback - Course Modification", "MetaReports": [{"Id": 201, "Title": "Course Outline", "ClientId": 2}]},
    {"CourseId": 30001, "SubjectCode": "ACCT", "CourseNumber": "1A", "StatusTitle": "Approved",
     "ProposalTypeTitle": "IVC - Course Modification",
     "MetaReports": [{"Id": 198, "Title": "Official Course Outline of Record", "ClientId": 3}]},
]
base_s = "https://saddleback.curriqunet.com/"
check("7 the default keeps Active rows only, so a host's Approved rows wait on its own status words",
      idx.build_index(socccd, base_s) == {})
both = idx.build_index(socccd, base_s, status="Approved|Active")
sb = idx.build_index(socccd, base_s, status="Approved|Active", client="^Saddleback$")
ivc = idx.build_index(socccd, base_s, status="Approved|Active", client="^IVC$")
check("7 status= keeps the host's words (whole word, any case); the Archive row stays out",
      [e["course_id"] for e in both["ACCT 1A"]] == [20001, 30001]
      and idx.keep_row({"StatusTitle": "approved"}, "Approved") and not idx.keep_row({"StatusTitle": "Not Approved"}, "Approved"),
      both)
check("7 client= keeps one college's rows where one host holds two: ACCT 1A is Saddleback's 20001 and IVC's 30001",
      [e["course_id"] for e in sb["ACCT 1A"]] == [20001] and [e["course_id"] for e in ivc["ACCT 1A"]] == [30001],
      (sb, ivc))
check("7 a row's client label: a client field first, then its proposal type's college prefix, then its reports' client id",
      idx.client_of({"ClientTitle": "Irvine Valley College", "ProposalTypeTitle": "Saddleback - New"}) == "Irvine Valley College"
      and idx.client_of(socccd[0]) == "Saddleback"
      and idx.client_of({"ProposalTypeTitle": "New Course", "MetaReports": [{"ClientId": 6}]}) == "client 6"
      and idx.client_of({}) == "")
seen = idx.row_census(socccd)
check("7 a run counts what the search returned: each status, each client, the two together, the field names",
      seen["status_titles"] == {"Approved": 2, "Archive": 1} and seen["client_labels"] == {"Saddleback": 2, "IVC": 1}
      and seen["client_status"]["Saddleback | Approved"] == 1 and "StatusTitle" in seen["row_fields"]
      and idx.row_census([])["row_fields"] == [], seen)


class _Page:
    """A dashboard that posts NewSearch only when its Search button is pressed (Rio Hondo, run 44508907581). It has
    `buttons` Search buttons, and only the one at `posts_at` (in the script's order) posts the search."""
    def __init__(self, posts_on_load=False, buttons=2, posts_at=1):
        self.handler, self.posts_on_load, self.buttons, self.posts_at = None, posts_on_load, buttons, posts_at
        self.pressed = []

    def on(self, _ev, fn):
        self.handler = fn

    def remove_listener(self, _ev, _fn):
        self.handler = None

    def wait_for_timeout(self, _ms):
        pass

    def _post(self, path="Search/NewSearch"):
        class R:
            url, method, post_data, headers = base_s + path, "POST", "options%5Bpagesize%5D=25&options%5Bpage%5D=0", {"accept": "*/*"}
        if self.handler:
            self.handler(R())

    def evaluate(self, js, arg=None):
        if js == idx.PRESS_SEARCH_JS:
            if (arg or 0) >= self.buttons:
                return None
            self.pressed.append(arg or 0)
            self._post("Search/NewSearch" if arg == self.posts_at else "Search/GetSearchFields")
            return {"n": arg or 0, "tag": "BUTTON", "beside_reset": arg == self.posts_at}
        if js == idx.OUTLINE_LINKS_JS:
            return []
        if js == idx.FETCH_JS:
            return {"status": 200, "text": '{"TotalRows": 1, "results": [{"CourseId": 1}]}'}
        return None


class _Reader:
    def __init__(self, page):
        self.page = page

    def load(self, _url):
        if self.page.posts_on_load:
            self.page._post()
        return {"status": 200, "title": "Dashboard"}

    def _robots_for(self, _url):
        return None


_orig = idx.census.robots_allows
idx.census.robots_allows = lambda _r, _u: True
try:
    quiet = _Page()
    got_q = idx.search_all(_Reader(quiet), base_s, 0)
    auto = _Page(posts_on_load=True)
    got_a = idx.search_all(_Reader(auto), base_s, 0)
    none_ = _Page(buttons=0)
    got_n = idx.search_all(_Reader(none_), base_s, 0)
    never = _Page(buttons=5, posts_at=9)
    got_v = idx.search_all(_Reader(never), base_s, 0)
finally:
    idx.census.robots_allows = _orig
check("7 a dashboard that posts no search on load gets its Search buttons pressed in turn until one posts it, and its "
      "own request is replayed; each press records the paths the page posted",
      quiet.pressed == [0, 1] and got_q.get("rows_read") == 1 and "error" not in got_q
      and [p["posted"] for p in got_q.get("pressed_search", [])] == [["/Search/GetSearchFields"], ["/Search/NewSearch"]],
      got_q)
check("7 a dashboard that searches on load is never pressed; one with no Search button keeps the no-NewSearch error",
      auto.pressed == [] and "pressed_search" not in got_a and got_a.get("rows_read") == 1
      and got_n.get("error") == "the page made no NewSearch request" and got_n.get("pressed_search") == [], (got_a, got_n))
check("7 the presses stop at PRESS_TRIES, and a page that never posts its search keeps the no-NewSearch error",
      never.pressed == list(range(idx.PRESS_TRIES)) and got_v.get("error") == "the page made no NewSearch request",
      (never.pressed, got_v))
check("7 the press fills no field and answers no check: the script clicks one button labeled Search and nothing else",
      idx.PRESS_SEARCH_JS.count(".click()") == 1 and "value =" not in idx.PRESS_SEARCH_JS
      and "turnstile" not in idx.PRESS_SEARCH_JS.lower() and "captcha" not in idx.PRESS_SEARCH_JS.lower())
rc = {"ACCT 1A": idx.row_code({"SubjectCode": "ACCT", "CourseNumber": "1", "Code": "ACCT 1A"}),
      "ACCT 1": idx.row_code({"SubjectCode": "ACCT", "CourseNumber": "1", "Code": "ACCT 12"}),
      "ACC 1A": idx.row_code({"SubjectCode": "ACC", "CourseNumber": "1A", "Code": "ACC-1A"}),
      "ACCT 1AH": idx.row_code({"SubjectCode": "ACCT", "CourseNumber": "01", "Code": "ACCT 1AH"}),
      "KIN A11": idx.row_code({"SubjectCode": "KIN", "CourseNumber": "A11", "Code": "BUS 1A"})}
check("7 a row keys by its own full code only where that is its subject and number with a letter suffix (Saddleback's "
      "ACCT 1A and 1B both return CourseNumber 1); another subject, another number or the same code keys as before",
      all(k == v for k, v in rc.items()), rc)
two = idx.build_index([{"CourseId": 1, "SubjectCode": "ACCT", "CourseNumber": "1", "Code": "ACCT 1A", "StatusTitle": "Active",
                        "MetaReports": []},
                       {"CourseId": 2, "SubjectCode": "ACCT", "CourseNumber": "1", "Code": "ACCT 1B", "StatusTitle": "Active",
                        "MetaReports": []}], base_s)
check("7 Saddleback's ACCT 1A and ACCT 1B are two index codes, never two courses under ACCT 1",
      sorted(two) == ["ACCT 1A", "ACCT 1B"], sorted(two))
wf = open(os.path.join(ROOT, ".github", "workflows", "course-outline-index.yml")).read()
check("7 the index workflow passes the .run's status= and client= lines to the index",
      "s/^status=//p" in wf and "--status" in wf and "s/^client=//p" in wf and "--client" in wf)

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok or not why else " — " + str(why)))
print("\ncourse_outline_index_test.py: %d/%d checks passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
