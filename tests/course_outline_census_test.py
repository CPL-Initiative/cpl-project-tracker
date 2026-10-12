#!/usr/bin/env python3
"""Guards for kb/_course_outline_census.py (S372, Sam 2026-10-12: capture each
college's course outline of record system link, for SLOs).

The pass's judgments, on fixtures shaped like what the census's Reader returns:
which system an address points into, a sign-in page told from a public one, a
curriculum link kept to the college's own site, and the host it records when it
meets several. Pure stdlib; run from the repo root.
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("cor", os.path.join(ROOT, "kb", "_course_outline_census.py"))
cor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cor)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


# 1. The system an address points into.
check("1 curriQunet META, eLumen, Coursedog, Kuali and WebCMS hosts are named",
      cor.system_of("https://sdccd.curriqunet.com/catalog/alias/mesa26-27") == "curriqunet"
      and cor.system_of("https://avc.elumenapp.com/catalog") == "elumen"
      and cor.system_of("https://app.coursedog.com/#/login/cabrillo") == "coursedog"
      and cor.system_of("https://x.kuali.co/cm") == "kuali"
      and cor.system_of("https://webcms.example.edu/") == "webcms")
check("1 Governet's older CurricUNET is told from its META product",
      cor.system_of("http://www.curricunet.com/elcamino/") == "curricunet")
check("1 CourseLeaf's curriculum module is found by its path on the college's catalog host",
      cor.system_of("https://catalog.cerritos.edu/courseadmin/") == "courseleaf_cim"
      and cor.host_key("https://catalog.cerritos.edu/courseadmin/?key=1") == "catalog.cerritos.edu/courseadmin")
check("1 a college's own page and a CourseLeaf catalog page are no outline system",
      cor.system_of("https://www.cerritos.edu/curriculum/") is None
      and cor.system_of("https://catalog.cerritos.edu/programs/") is None)

# 2. Public, sign-in, refused, unreached.
login = {"url": "https://app.coursedog.com/#/login/x", "final_url": "https://app.coursedog.com/login",
         "status": 200, "title": "Sign In", "body": "Sign in with your college account", "html": "<form></form>"}
pw = {"url": "https://x.curriqunet.com/", "final_url": "https://x.curriqunet.com/", "status": 200,
      "title": "META", "body": "Log in to continue", "html": '<input type="password" name="p">'}
public = {"url": "https://x.curriqunet.com/", "final_url": "https://x.curriqunet.com/Search", "status": 200,
          "title": "Public Search", "body": "Search for courses and programs. Password resets: ask IT.",
          "html": "<input type='text'>"}
check("2 a sign-in address or a short page with a password field reads as sign_in",
      cor.access_of(login) == "sign_in" and cor.access_of(pw) == "sign_in")
check("2 a public search page that only mentions passwords stays public",
      cor.access_of(public) == "public")
check("2 robots, 401/403, no answer and a 404 read as refused, refused, unreached, unreached",
      cor.access_of({"access": "robots_disallow"}) == "refused"
      and cor.access_of({"status": 403, "url": "https://a"}) == "refused"
      and cor.access_of({"status": None}) == "unreached"
      and cor.access_of({"status": 404, "url": "https://a/x", "final_url": "https://a/x"}) == "unreached")

# 3. Curriculum links stay on the college's own site.
page = {"links": [
    {"text": "Curriculum Committee", "href": "https://www.cerritos.edu/curriculum/committee.htm"},
    {"text": "Course Outlines of Record", "href": "https://www.cerritos.edu/academic/cor.htm#top"},
    {"text": "Curriculum Committee", "href": "https://www.othercollege.edu/curriculum/"},
    {"text": "eLumen", "href": "https://cerritos.elumenapp.com/"},
    {"text": "Athletics", "href": "https://www.cerritos.edu/athletics/"}]}
links = cor.curriculum_links(page, "cerritos.edu")
check("3 the college's curriculum and outline pages are followed; another college's and a system host are not",
      links == ["https://www.cerritos.edu/curriculum/committee.htm", "https://www.cerritos.edu/academic/cor.htm"], links)

# 3b. The sitemap names the curriculum pages.
xml = "<urlset><url><loc>https://www.cerritos.edu/curriculum/</loc></url><url><loc>https://www.cerritos.edu/curriculum/minutes/2025-10.htm</loc></url>" \
      "<url><loc>https://www.cerritos.edu/academic-senate/course-outlines-of-record.htm</loc></url><url><loc>https://www.cerritos.edu/athletics/</loc></url>" \
      "<url><loc>https://www.cerritos.edu/curriculum/handbook.pdf</loc></url><url><loc>https://www.other.edu/curriculum/</loc></url></urlset>"
cu = cor.curriculum_urls(cor.sitemap_urls(xml), "cerritos.edu")
check("3b the sitemap's curriculum and outline pages are kept, shortest first; minutes, a PDF and another college's are not",
      cu == ["https://www.cerritos.edu/curriculum/", "https://www.cerritos.edu/academic-senate/course-outlines-of-record.htm"], cu)

# 4. The host recorded.
hosts = [{"system": "coursedog", "url": "a", "access": "sign_in", "status": 200},
         {"system": "curriqunet", "url": "b", "access": "public", "status": 200, "outline_words": True},
         {"system": "elumen", "url": "c", "access": "public", "status": 200}]
check("4 a public host that shows outlines wins over a public one and a sign-in one",
      cor.choose(hosts)["system"] == "curriqunet")
check("4 a sign-in host is recorded when it is the only one met",
      cor.choose(hosts[:1])["system"] == "coursedog")
none = cor.row_for("X College", [], [{"url": "https://x.edu/slo", "snippet": "Student Learning Outcomes"}], [])
check("4 no host met reads none_found and not_found, and an SLO page on the college's own site still counts",
      none["cor_system"] == "none_found" and none["cor_access"] == "not_found" and none["cor_prints_slos"] is True)
picked = cor.row_for("Y College", hosts, [], [])
check("4 the row carries the chosen system, its access and every host met",
      picked["cor_system"] == "curriqunet" and picked["cor_access"] == "public" and len(picked["hosts"]) == 3)

# 6. The probe (S373): one course's outline per system, not the catalog host.
dash = {"url": "https://cuesta.curriqunet.com/", "final_url": "https://cuesta.curriqunet.com/", "status": 200,
        "links": [{"href": "https://cuesta.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1234?entityType=Course&reportId=94",
                   "text": "Reports"},
                  {"href": "https://cuesta.curriqunet.com/Search/PublicSearch", "text": "Course Outline Search"},
                  {"href": "https://www.cuesta.edu/about/annual-report.html", "text": "Annual Report"},
                  {"href": "https://cuesta.curriqunet.com/Account/Login", "text": "Course reports (staff)"},
                  {"href": "https://cuesta.curriqunet.com/", "text": "Reports home"}]}
ol = cor.outline_links(dash, "cuesta.curriqunet.com")
check("6 a course's report link on the system host comes first; another site, a sign-in and the page itself are left out",
      [x["href"] for x in ol] == ["https://cuesta.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1234?entityType=Course&reportId=94",
                                  "https://cuesta.curriqunet.com/Search/PublicSearch"], ol)
check("6 a menu item or a proposal type naming SLOs is no SLO; a heading with outcomes under it is",
      cor.slo_snippet("Home | Student Learning Outcomes | Contact") is None
      and cor.slo_snippet("ABOD 252 WORK EXPERIENCE Student Learning Outcomes only Active Reports ABOD 570") is None
      and cor.slo_snippet("Student Learning Outcomes Upon completion of the course the student will be able to "
                          "diagnose and repair collision damage to unibody vehicles.") is not None)
outline_body = ("Course Outline of Record. Units: 3. Lecture hours 54. Prerequisite: none. Course Content: ... "
                "Methods of Evaluation: exams. Student Learning Outcomes: Upon completion students will be able to "
                "analyze the structure of a short story and write a thesis-driven essay.")
pg = cor.probe_page({"url": "u", "final_url": "u", "status": 200, "title": "COR", "body": outline_body, "html": ""})
check("6 an outline's fields and its SLOs are read from the page", pg["outline_fields"] >= 3 and pg["slo"])
lst = {"outline_fields": 1, "slo": None, "access": "public"}
check("6 the verdict is the best a college's pages reached",
      cor.probe_verdict(lst, [pg]) == "outline_with_slos"
      and cor.probe_verdict(lst, [dict(pg, slo=None)]) == "outline"
      and cor.probe_verdict(lst, []) == "list_only"
      and cor.probe_verdict({"outline_fields": 0, "slo": None, "access": "sign_in"}, []) == "sign_in"
      and cor.probe_verdict({"outline_fields": 0, "slo": None, "access": "unreached"}, []) == "unreached")
check("6 the probe names at least one college on each public system run 2 met",
      {s for _, s, _, _ in cor.PROBE} >= {"curriqunet", "elumen", "curricunet", "coursedog"})

# 5. Nothing writes.
src = open(os.path.join(ROOT, "kb", "_course_outline_census.py")).read()
check("5 the pass reads the registry and writes no table (no POST, PATCH or rpc)",
      "method=" not in src and "/rpc/" not in src and "PATCH" not in src and "POST" not in src)

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok or not why else " — " + str(why)))
print("\ncourse_outline_census_test.py: %d/%d checks passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
