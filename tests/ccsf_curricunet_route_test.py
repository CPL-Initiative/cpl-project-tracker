#!/usr/bin/env python3
"""City College of San Francisco's route to its course outlines (S689; COBIx on #3533, comment 7015803401).

CCSF's www.ccsf.edu answered 403 behind Cloudflare (census run 38305389870: none_found), and its outlines sit on
Governet's older CurricUNET at ccsf.curricunet.com, whose search answers anonymous requests. The failure modes these
checks pin: the census never reaching that host, so its row reads none_found; route_of taking only .curriqunet.com, so
the queue skips the college; the index waiting on a NewSearch request the dashboard may never post, paging a JSON
body as if it were a form, building RCCD's report address, or choosing the report by a title nobody has seen.
Pure-stdlib python; nothing here reaches the network.
"""
import importlib.util
import json
import os
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import next_slo_colleges as M  # noqa: E402


def _mod(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


cor = _mod("course_outline_census", "kb/_course_outline_census.py")
idx = _mod("course_outline_index", "kb/_course_outline_index.py")

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


CCSF = "City College of San Francisco"
SAMPLE = "https://ccsf.curricunet.com/DynamicReports/AllFieldsReportByEntity/15634?entityType=Course&reportId=28"
# The headings COBIx read on AAPS 100's report 28, with an outcome under the SLO heading.
OUTLINE = ("GENERAL DESCRIPTION\nCourse Outline of Record\nUnits: 3\nLecture hours 54\nPrerequisite: none\n"
           "COURSE SPECIFICS\nCATALOG DESCRIPTION\n" + "x" * 7000 + "\nSTUDENT LEARNING OUTCOMES\n"
           "Upon completion of this course, a student will be able to:\n1. Describe the structure of an apprenticeship.\n"
           "CONTENTS\nCourse Content: ...\nINSTRUCTIONAL METHODOLOGY\nMethods of Evaluation: exams\nCLASSIFICATION\n")


class _Page:
    def __init__(self, reader):
        self.reader = reader

    def evaluate(self, js, arg=None):
        return self.reader.full.get(self.reader.loaded[-1], "")


class _CensusReader:
    """www.ccsf.edu answers 403, as census run 38305389870 recorded; the CurricUNET outline answers 200."""
    def __init__(self):
        self.loaded, self.full = [], {SAMPLE: OUTLINE}
        self.page = _Page(self)

    def load(self, url):
        self.loaded.append(url)
        if urllib.parse.urlparse(url).netloc == "www.ccsf.edu":
            return {"url": url, "final_url": url, "status": 403, "title": "Attention Required! | Cloudflare",
                    "body": "", "links": []}
        if url == SAMPLE:
            return {"url": url, "final_url": url, "status": 200, "title": "Course Outline", "body": OUTLINE[:6000],
                    "links": [], "html": ""}
        return {"url": url, "final_url": url, "status": 404, "body": "", "links": []}


# 1. The census reaches the CurricUNET host from its seed and records it.
seed = cor.COR_SEEDS.get(CCSF)
check("1 the census seeds CCSF with one public CurricUNET outline, its source named",
      seed and urllib.parse.urlparse(seed[0]).netloc == "ccsf.curricunet.com" and cor.system_of(seed[0]) == "curricunet"
      and "7015803401" in seed[1], seed)
reader = _CensusReader()
row = cor.cor_one(reader, {"college": CCSF, "homepage_url": "https://www.ccsf.edu/", "catalog_url": None})
check("1 the census row names ccsf.curricunet.com, public, an outline that prints SLOs (past the first 6,000 characters)",
      row["cor_system"] == "curricunet" and urllib.parse.urlparse(row["cor_url"]).netloc == "ccsf.curricunet.com"
      and row["cor_access"] == "public" and row["cor_outline"] == "outline_with_slos"
      and row["cor_outline_url"] == SAMPLE, {k: row.get(k) for k in ("cor_system", "cor_url", "cor_access", "cor_outline")})
other = cor.cor_one(_CensusReader(), {"college": "Another College", "homepage_url": "https://www.ccsf.edu/",
                                      "catalog_url": None})
check("1 a college with no seed reads as before (none_found behind a 403)", other["cor_system"] == "none_found", other)

# 2. route_of takes a public CurricUNET host as an index route; curriQunet as before; a refused host stays out.
folder = {"slug": "city_of_san_francisco", "catalog_host": "www.ccsf.edu", "elumen": None}
check("2 route_of reads ccsf.curricunet.com as an index route from that census row",
      M.route_of(CCSF, folder, {CCSF: row}) == ("index", "ccsf.curricunet.com"), M.route_of(CCSF, folder, {CCSF: row}))
cq = {"cor_system": "curriqunet", "cor_url": "https://rccd.curriqunet.com/", "cor_access": "public",
      "cor_outline": "outline_with_slos"}
check("2 a curriQunet dashboard routes as before, and the October none_found row still gives no route",
      M.route_of("R", {}, {"R": cq}) == ("index", "rccd.curriqunet.com")
      and M.route_of(CCSF, folder, {CCSF: {"cor_system": "none_found", "cor_url": None}})[0] is None)
check("2 a CurricUNET host the census found behind a sign-in gives no route",
      M.route_of(CCSF, folder, {CCSF: dict(row, cor_access="sign_in", cor_outline="sign_in")})[0] is None)

# 3. The index reads CCSF with the checked search body and report address.
rec = idx.known_search("https://ccsf.curricunet.com/")
opts = (rec or {}).get("body", {}).get("options", {})
check("3 the checked search names client 57 and course entity type 150, its source, and pages under the 250 cap",
      opts.get("clientIds") == [57] and opts.get("clientEntityTypeId") == 150 and "7015803401" in rec["source"]
      and idx.SEARCH_PAGE_SIZE <= 250, opts)
body = json.loads(idx.with_page(json.dumps(rec["body"]), idx.SEARCH_PAGE_SIZE, 3))
check("3 a JSON search body is paged in its options (page 0-based), every other option kept",
      body["options"]["page"] == 3 and body["options"]["pagesize"] == idx.SEARCH_PAGE_SIZE
      and body["options"]["clientIds"] == [57] and body["options"]["filters"] == {"sql": None}, body["options"])
check("3 a form body is paged as before",
      idx.with_page("options%5Bpagesize%5D=25&options%5Bpage%5D=0&x=1", 200, 2)
      == "options%5Bpagesize%5D=200&options%5Bpage%5D=2&x=1")

# CourseId and report lists as COBIx read them: AAPS 100 on report 28, INTI 310A on report 124 only, a Historical row.
ROWS = [{"CourseId": 15634, "SubjectCode": "AAPS", "CourseNumber": "100", "Title": "AAPS 100", "StatusTitle": "Active",
         "MetaReports": [{"Id": 28, "Title": "Course Outline", "IsPublicReport": True}]},
        {"CourseId": 11968, "SubjectCode": "ASAM", "CourseNumber": "20-H", "Title": "ASAM 20-H", "StatusTitle": "Active",
         "MetaReports": [{"Id": 28, "Title": "Course Outline"}, {"Id": 68, "Title": "Another"}]},
        {"CourseId": 6057, "SubjectCode": "INTI", "CourseNumber": "310A", "Title": "INTI 310A", "StatusTitle": "Active",
         "MetaReports": [{"Id": 124, "Title": "Course Outline (old)"}]},
        {"CourseId": 100, "SubjectCode": "AAPS", "CourseNumber": "100", "Title": "AAPS 100", "StatusTitle": "Historical",
         "MetaReports": [{"Id": 28, "Title": "Course Outline"}]}]


class _IndexPage:
    def __init__(self):
        self.posts, self.listeners = [], 0

    def on(self, ev, fn):
        self.listeners += 1  # the dashboard posts no NewSearch here

    def remove_listener(self, ev, fn):
        self.listeners -= 1

    def wait_for_timeout(self, ms):
        pass

    def evaluate(self, js, arg=None):
        if arg is None:
            return []
        url, post, headers = arg
        self.posts.append((url, json.loads(post), headers))
        page = json.loads(post)["options"]["page"]
        return {"status": 200, "text": json.dumps({"TotalRows": len(ROWS), "results": ROWS if page == 0 else []})}


class _IndexReader:
    def __init__(self):
        self.page = _IndexPage()

    def load(self, url):
        return {"status": 200, "title": "Dashboard"}

    def _robots_for(self, url):
        return None  # ccsf.curricunet.com/robots.txt is a 404


r = _IndexReader()
searched = idx.search_all(r, "https://ccsf.curricunet.com/", 0)
url0, post0, head0 = r.page.posts[0] if r.page.posts else (None, {}, {})
check("4 with no NewSearch request from the page, the index posts the checked body to the host's own search",
      "error" not in searched and searched["rows_read"] == len(ROWS) and url0 == "https://ccsf.curricunet.com/Search/NewSearch"
      and post0["options"]["clientIds"] == [57] and head0.get("content-type", "").startswith("application/json")
      and "7015803401" in searched.get("search_from", ""), {k: searched.get(k) for k in ("error", "rows_read")})
rec_form = rec["form"]
index = idx.build_index(ROWS, "https://ccsf.curricunet.com/", rec_form, idx.REPORT_TITLE, rec["report_ids"])
check("4 each Active course reads report 28 at the DynamicReports address; Historical rows and report 124 are not read",
      index["AAPS 100"] == [{"course_id": 15634, "title": "AAPS 100", "proposal_type": None, "reports": [SAMPLE]}]
      and index["INTI 310A"][0]["reports"] == [] and len(index["AAPS 100"]) == 1, index)
check("4 the report is chosen by its checked id, whatever its title",
      [t["id"] for t in idx.report_titles(ROWS, idx.REPORT_TITLE, rec["report_ids"]) if t["read"]] == [28]
      and idx.reads({"Id": 97, "Title": "Course Outline"}) and not idx.reads({"Id": 97, "Title": "Course Outline"}, ids=[28]))
check("4 a host with no checked record keeps the page's own request and RCCD's address form",
      idx.known_search("https://rccd.curriqunet.com/") is None and idx.known_request("https://rccd.curriqunet.com/") is None)

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok or not why else " — " + str(why)))
print("\nccsf_curricunet_route_test.py: %d/%d checks passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
