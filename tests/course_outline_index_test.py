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
check("5 RCCD's own link gives RCCD's form, so its index is unchanged",
      idx.report_form(["https://rccd.curriqunet.com/Report/Course/GetReport/3794?reportId=97"], rows,
                      "https://rccd.curriqunet.com/") == idx.LEGACY_FORM)
check("5 a link counts only on this host and for a CourseId the search returned; none leaves RCCD's form",
      idx.report_form([sd + "DynamicReports/AllFieldsReportByEntity/99?entityType=Course&reportId=493",
                       "https://other.curriqunet.com/DynamicReports/AllFieldsReportByEntity/18607?entityType=Course&reportId=493"],
                      sd_rows, sd) is None and idx.report_form([], sd_rows, sd) is None)

src = open(os.path.join(ROOT, "kb", "_course_outline_index.py")).read()
check("3 the index reads public pages only and never addresses the database (no Supabase address, REST path, "
      "rpc or PATCH); its one POST is the college's own search, replayed from the page",
      "supabase" not in src.lower() and "/rest/v1" not in src and "/rpc/" not in src and "PATCH" not in src
      and src.count("method: 'POST'") == 1)

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok or not why else " — " + str(why)))
print("\ncourse_outline_index_test.py: %d/%d checks passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
