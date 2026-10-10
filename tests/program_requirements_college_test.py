#!/usr/bin/env python3
"""Phase 2 of the program requirements harvest reads every program at one
college, and gives each program its own page.

WHY. Sam chose Cerritos for the first full-college read (2026-10-09, S353):
288 programs where the pilot read four. kb/_program_requirements_college.py
lists the catalog's program pages once and matches each program to the page
that names its listed courses. The ways that goes wrong are known in advance:

  * A sitemap lists every page a catalog has: course descriptions, policies,
    archives and PDFs beside the programs. Reading those wastes the colleges'
    patience and the runner's hour; dropping a program section loses programs.
  * An A.A. and the certificate inside it name the same courses, so both pages
    pass the pilot's coverage test for either program. The award named on the
    page, then its title words, must decide, or two programs read one page.
  * The state's Program Course File answers a thousand rows a request, and
    Cerritos lists 4,504: a read that stops at the first page loses programs
    silently.
  * The extraction runs in shards; a shard rule that skips or repeats a program
    spends money twice or drops a record.

Each is pinned below against the module's OWN functions, with no browser and no
network. Run from repo root: python3 tests/program_requirements_college_test.py
"""
import json
import os
import shutil
import tempfile
import urllib.parse
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_pilot as P  # noqa: E402

failures = []
checks = [0]


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


check(not {"playwright", "pypdf", "pdfminer"} & set(sys.modules),
      "importing the college pass pulled in a runner-only dependency")

# ── the sitemap: pages and nested sitemaps ──────────────────────────────────
SITEMAP = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 <url><loc>https://cerritos-public.courseleaf.com/</loc></url>
 <url><loc>https://cerritos-public.courseleaf.com/degrees-certificates-courses/degrees-certificates-programs-majors/field-ironworkers-aa/</loc></url>
 <url><loc>https://cerritos-public.courseleaf.com/degrees-certificates-courses/degrees-certificates-programs-majors/public-health-science-as-t/</loc></url>
 <url><loc>https://cerritos-public.courseleaf.com/degrees-certificates-courses/noncredit-career-development-college-preparation/energy-corps-certificate-completion/</loc></url>
 <url><loc>https://cerritos-public.courseleaf.com/degrees-certificates-courses/course-descriptions/iwap/</loc></url>
 <url><loc>https://cerritos-public.courseleaf.com/academic-policies/</loc></url>
 <url><loc>https://cerritos-public.courseleaf.com/archive/2024-2025/degrees-certificates-programs-majors/field-ironworkers-aa/</loc></url>
 <url><loc>https://cerritos-public.courseleaf.com/pdf/2026-2027-catalog.pdf</loc></url>
 <url><loc>https://elsewhere.example.edu/degrees/x-aa/</loc></url>
 <url><loc>https://cerritos-public.courseleaf.com/degrees-certificates-courses/degrees-certificates-programs-majors/field-ironworkers-aa/</loc></url>
</urlset>"""
pages, nested = C.sitemap_urls(SITEMAP)
check(len(pages) == 10 and nested == [], "a urlset lists its pages and no nested sitemap")
INDEX = """<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 <sitemap><loc>https://x.edu/sitemap-1.xml</loc></sitemap><sitemap><loc>https://x.edu/sitemap-2.xml</loc></sitemap>
</sitemapindex>"""
p2, n2 = C.sitemap_urls(INDEX)
check(p2 == [] and n2 == ["https://x.edu/sitemap-1.xml", "https://x.edu/sitemap-2.xml"],
      "a sitemap index lists nested sitemaps, which the reader follows one level")
check(C.sitemap_urls("<html>not a sitemap") == ([], []), "malformed XML reads as no pages, never an error")

start = "https://cerritos-public.courseleaf.com/"
cand = C.program_candidates(pages, start)
check(len(cand) == 3, "three program pages kept: %r" % cand)
check(not any("course-descriptions" in u or "archive" in u or u.endswith(".pdf") or "policies" in u for u in cand),
      "course descriptions, archives, policies and PDFs are never read as program pages")
check(not any("elsewhere.example.edu" in u for u in cand), "another host's page is never read")
check(len(set(cand)) == len(cand), "a page the sitemap lists twice is read once")

# ── a district catalog: one host, several colleges ───────────────────────────
DISTRICT = ["https://catalog.nocccd.edu/fullerton-college/programs/accounting-aa/",
            "https://catalog.nocccd.edu/cypress-college/programs/accounting-aa/",
            "https://catalog.nocccd.edu/noce/programs/esl-certificate-completion/"]
REG = ["https://catalog.nocccd.edu/fullerton-college/", "https://catalog.nocccd.edu/cypress-college/",
       "https://catalog.nocccd.edu/noce/", "https://cerritos-public.courseleaf.com/"]
ful = "https://catalog.nocccd.edu/fullerton-college/"
check(C.district_scope(ful, REG) == "/fullerton-college/",
      "a college on a shared district host reads under its own path")
check(C.program_candidates(DISTRICT, ful, C.district_scope(ful, REG)) == DISTRICT[:1],
      "Fullerton's read never offers Cypress's or NOCE's pages: %r"
      % C.program_candidates(DISTRICT, ful, C.district_scope(ful, REG)))
check(C.district_scope(start, REG) is None and C.program_candidates(pages, start, C.district_scope(start, REG)) == cand,
      "a host no other college shares keeps the whole host, as Cerritos read")
check(C.district_scope("https://catalog.nocccd.edu/", REG) is None,
      "an address at a shared host's root names no scope rather than guessing one")
check(C.in_scope("https://catalog.nocccd.edu/fullerton-college/x/", "/fullerton-college/")
      and not C.in_scope("https://catalog.nocccd.edu/cypress-college/x/", "/fullerton-college/")
      and C.in_scope("https://anything/", None),
      "the link search's page is kept only inside the college's scope")

# ── the state's file, a thousand rows at a time ─────────────────────────────
calls = []
real_get = C.P._get


def fake_get(path_qs):
    calls.append(path_qs)
    offset = int(path_qs.rsplit("offset=", 1)[1])
    n = 1000 if offset < 4000 else 504
    return [{"i": offset + k} for k in range(n)]


C.P._get = fake_get
rows = C.fetch_all("coci_program_courses?select=x&college=eq.Cerritos%20College")
C.P._get = real_get
check(len(rows) == 4504 and len(calls) == 5 and rows[-1]["i"] == 4503,
      "every row is read: 4,504 rows in five requests of up to a thousand")

# ── programs grouped with their closed lists ────────────────────────────────
progs = [{"control_number": "42158", "program_title": "Apprenticeship: Field Ironworkers", "award": "A.A. Degree", "status": "Active"},
         {"control_number": "41982", "program_title": "Community Health Worker",
          "award": "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units", "status": "Active"},
         {"control_number": "99999", "program_title": "No Courses Listed", "award": "A.S. Degree", "status": "Active - Teachout Only"},
         {"control_number": "45549", "program_title": "Public Health", "award": "A.S. T Degree", "status": "Active"},
         {"control_number": "36675", "program_title": "Energy Corps", "award": "Noncredit program", "status": "Active"}]
crs = [{"program_control_number": "42158", "course_control_number": "1", "course_code": "IWAP 40.1", "units": 3, "load_id": "L"},
       {"program_control_number": "42158", "course_control_number": "2", "course_code": "IWAP 40.2", "units": 3, "load_id": "L"},
       {"program_control_number": "41982", "course_control_number": "3", "course_code": "HED 100", "units": 3, "load_id": "L"}]
g = C.group_programs(progs, crs)
byc = {p["control_number"]: p for p in g}
check(len(g) == 5 and [c["code"] for c in byc["42158"]["closed_list"]] == ["IWAP 40.1", "IWAP 40.2"],
      "each program carries its own closed list, in the pilot's shape")
check(byc["99999"]["closed_list"] == [] and byc["99999"]["status"] == "Active - Teachout Only",
      "a program the state lists no course for is kept and marked, never dropped")
check([byc[k]["shape"] for k in ("42158", "41982", "45549", "36675")] == ["degree", "certificate", "adt", "noncredit"],
      "each program's shape comes from its award")

# ── the page each program is read from ──────────────────────────────────────
AA_TEXT = "Field Ironworkers, A.A. Required courses IWAP 40.10 Rigging IWAP 40.20 Welding Total 60 units"
CERT_TEXT = "Field Ironworkers Certificate of Achievement IWAP 40.10 IWAP 40.20 Total 30 units"
OTHER = "Public Health Science, A.S.-T HED 100 KIN 101"


def page(url, h1, text):
    return {"url": url, "h1": h1, "title": h1, "body": text, "content": text,
            "got": {"body": text, "content": text, "title": h1, "h1": h1}, "codes": C.page_codes(text)}


PAGES = [page(start + "degrees/field-ironworkers-certificate-achievement/", "Field Ironworkers, Certificate of Achievement", CERT_TEXT),
         page(start + "degrees/field-ironworkers-aa/", "Field Ironworkers, A.A.", AA_TEXT),
         page(start + "degrees/public-health-science-as-t/", "Public Health Science, A.S.-T", OTHER)]
check("IWAP401" in C.page_codes(AA_TEXT) and "HED100" in C.page_codes(OTHER),
      "the coarse net reads codes in the pilot's normal form")
aa = dict(byc["42158"])
best = C.choose_page(aa, PAGES)
check(best is not None and best["url"].endswith("field-ironworkers-aa/"),
      "the A.A. reads the A.A.'s page, though the certificate's page names the same courses")
cert = dict(aa, control_number="X", award="Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units")
best_c = C.choose_page(cert, PAGES)
check(best_c is not None and "certificate" in best_c["url"],
      "the certificate reads the certificate's page")
check(C.choose_page(byc["99999"], PAGES) is None, "a program with no listed course is given no page")
lone = dict(byc["41982"], closed_list=[{"code": "HED 100"}, {"code": "HED 200"}, {"code": "HED 300"}])
check(C.choose_page(lone, PAGES) is None, "a page naming a third of the listed courses is not the program's page")

# ── the award an address names (run 37961137169's misses) ───────────────────
check([C.slug_award(start + "x/" + slug + "/") for slug in
       ("anthropology-aa-t", "public-health-science-as-t", "natural-sciences-general-as", "field-ironworkers-aa",
        "medical-assistant-certifciate-achievement", "energy-corps-certificate-completion", "courses-in-ged-test-prep-english")]
      == ["adt", "adt", "as", "aa", "coa", "noncredit", None],
      "an address names its award as it stands, hyphens and the catalog's own spelling included")
aat = {"url": start + "x/anthropology-aa-t/", "h1": "Anthropology, A.A.-T", "title": "Anthropology"}
check(C.label_score(aat, {"award": "A.A. Degree", "title": "Anthropology"})[0] == 0 and
      C.label_score(aat, {"award": "A.A- T Degree", "title": "Anthropology"})[0] == 1,
      "an A.A. does not read an A.A.-T page as its own, though 'A.A.' appears in 'A.A.-T'")


def claim(award, title, cov=1.0):
    return {"label": {"award": award, "title": title}, "coverage": cov, "found": {}}


check(C.page_winners([("02260", claim(0, 1.0)), ("32355", claim(1, 1.0))]) == {"32355"},
      "the program whose award the page names keeps it (Anthropology A.A.-T over the A.A.)")
check(C.page_winners([("02267", claim(1, 0.5)), ("35220", claim(1, 1.0))]) == {"35220"},
      "between two programs of one award, the page goes to the title it names more fully (Culinary Arts Management)")
check(C.page_winners([("42020", claim(1, 1.0)), ("45549", claim(1, 1.0))]) == {"42020", "45549"},
      "two state records the page names equally share it (Public Health, Public Health Science)")
check(len(C.page_winners([("19163", claim(0, .75)), ("19170", claim(0, .6))])) == 1,
      "a page naming no claimant's award goes to one program only")

# assign(): a loser moves to its next page; one with none left reads no page
PG = [page(start + "degrees/x-aa-t/", "X, A.A.-T", "X AA-T ABC 101 ABC 102 ABC 103"),
      page(start + "degrees/x-aa/", "X, A.A.", "X A.A. ABC 101 ABC 102 ABC 103 ABC 104"),
      page(start + "degrees/y-aa-t/", "Y, A.A.-T", "Y AA-T DEF 101 DEF 102")]
progs3 = [{"control_number": "1", "title": "X", "award": "A.A- T Degree",
           "closed_list": [{"code": "ABC 101"}, {"code": "ABC 102"}, {"code": "ABC 103"}]},
          {"control_number": "2", "title": "X", "award": "A.A. Degree",
           "closed_list": [{"code": "ABC 101"}, {"code": "ABC 102"}, {"code": "ABC 103"}]},
          {"control_number": "3", "title": "Y", "award": "A.A. Degree",
           "closed_list": [{"code": "DEF 101"}, {"code": "DEF 102"}, {"code": "DEF 103"}]}]
got = C.assign(progs3, PG)
check(got["1"]["best"]["url"].endswith("x-aa-t/") and got["2"]["best"]["url"].endswith("x-aa/"),
      "each of two programs naming the same courses reads its own award's page")
check(got["3"]["best"] is None or not got["3"]["best"]["url"].endswith("y-aa-t/") or got["3"]["best"]["label"]["award"] == 0,
      "a program whose own page is missing is not handed a sibling's as its own award")
progs4 = progs3[:1] + [dict(progs3[1], control_number="4")]
got4 = C.assign(progs4, PG[:1])
check(got4["4"]["best"] is None and got4["4"]["lost"] == [PG[0]["url"]],
      "a program that loses its only page reads no page, and names the page it lost")
tiny = {"control_number": "5", "title": "Automotive Electrical", "award": "Certificate of Achievement",
        "closed_list": [{"code": "ABC 101"}]}
check(C.candidates(tiny, PG) == [], "a one-course list takes no page whose label does not name the program")

check({"COS60A1", "COS60B3", "BAK80", "THE30"} <= C.page_codes("COS-60A1 Cosmetology\nCOS-60B3\nBAK-80 THE-30"),
      "the code net reads a number ending in letters and digits (COS 60A1), as the exact test does")

# ── curriQunet: the catalog's own JSON (S357) ──────────────────────────────
print("curriQunet")
check(C.cq_catalog_id(["https://rccd.curriqunet.com/Content/x.css",
                       "https://rccd.curriqunet.com/Catalog/_getActiveCatalogById/124"]) == 124
      and C.cq_catalog_id(["https://x.curriqunet.com/Catalog/_getNavigation?id=88&navigationtypeId=1"]) == 88
      and C.cq_catalog_id(["https://x.edu/"]) is None,
      "the catalog id comes from the calls the start page's scripts made")
check(C.cq_base("https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5842/6111") ==
      ("https://rccd.curriqunet.com", "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/")
      and C.cq_base("https://irvine.curriqunet.com/Catalog/iq/48953")[1] == "https://irvine.curriqunet.com/Catalog/iq/",
      "a node's view address is the catalog's prefix and the node's aliaspath")
ACT = json.load(open(os.path.join(ROOT, "tests", "fixtures", "curriqunet_rcc_getpage_5878.json")))
ttl, txt = C.cq_page_text(ACT)
check(ttl.startswith("Acting - Associate of Arts Degree and Certificate of Achievement")
      and "Select one of the following:" in txt and "Complete 9 units from the following:" in txt
      and "Total : 18.00" in txt and "\nTHE-30\n" in txt,
      "a program page reads as its title, then the requirements line by line (the real Acting page, run 38076194967)")
check("<" not in txt and "&nbsp;" not in txt, "no tag or entity survives into the text")
ENTRY = {"id": 5878, "text": ttl, "aliaspath": "5852/6117/Acting", "haschildbodynavs": False}
check(C.cq_is_program(ENTRY) and not C.cq_is_program({"text": "Degrees and Certificates Explained"})
      and not C.cq_is_program({"text": "Degrees and Certificates Index", "haschildbodynavs": True}),
      "a program entry is a leaf naming an award after a dash")
NAV = {
    "top": {"navs": [{"id": 5842, "text": "Introduction to Riverside City College"},
                     {"id": 5852, "text": "Degrees and Certificates"},
                     {"id": 5900, "text": "Courses"}]},
    "page:5852": {"body": [{"navlist": [{"id": 6313}]}]},
    "nav:6313": {"navs": [{"id": 6283, "text": "Degrees and Certificates Explained"},
                          {"id": 6117, "text": "Degrees and Certificates Index", "haschildbodynavs": True},
                          {"id": 6118, "text": "Associate Degree for Transfer", "haschildbodynavs": True}]},
    "page:6117": {"body": [{"navlist": [{"id": 6323}]}]},
    "nav:6323": {"navs": [ENTRY, {"id": 5877, "text": "Accounting Basics for Small Business - Certificate of Completion - CC8009"}]},
    "page:6118": {"body": [{"navlist": [{"id": 6400}]}]},
    "nav:6400": {"navs": [ENTRY, {"id": 5990, "text": "Anthropology - Associate in Arts for Transfer Degree - AAT1234"}]},
}
asked = []


def fake_get(url):
    asked.append(url)
    q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
    if "navigationtypeId" in q:
        return NAV["top"]
    if "parentId" in q:
        return NAV.get("nav:" + q["parentId"][0])
    return NAV.get("page:" + q["id"][0])


ents, acct = C.cq_index(fake_get, 124, "https://rccd.curriqunet.com")
check([e["id"] for e in ents] == [5878, 5877, 5990] and acct["sections"] == ["Degrees and Certificates"],
      "the walk reads only degree and certificate sections and lists each entry once: %r" % [e["id"] for e in ents])
check(not any("id=5900" in a or "id=5842&" in a for a in asked) and acct["calls"] == len(asked),
      "the Courses and Introduction sections are never read, and every call is counted")
PGQ = C.cq_page(ENTRY, ACT, "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/")
check(PGQ["url"] == "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5852/6117/Acting"
      and {"THE30", "THE5", "THE39"} <= PGQ["codes"] and C.cq_page(ENTRY, None, "x") is None,
      "a program page carries its view address and its course codes")
ACT_LIST = [{"code": c} for c in ("THE-30", "THE-32", "THE-38", "THE-5", "THE-6", "THE-33", "THE-34")]
acting = [{"control_number": "A1", "title": "Acting", "award": "A.A. Degree", "closed_list": ACT_LIST},
          {"control_number": "A2", "title": "Acting", "award": "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units",
           "closed_list": ACT_LIST}]
gq = C.assign(acting, [PGQ])
check(all(gq[cn]["best"] and gq[cn]["best"]["url"] == PGQ["url"] for cn in ("A1", "A2")),
      "the A.A. and the certificate one curriQunet page names both read that page")

# an emphasis page names each subject once, then its numbers (S359, RCCD's
# seven Liberal Arts emphasis degrees: 21 programs found no page)
check(C.cq_subject_lists("Mathematics (MATH): C2210, C2210H, 5, 70A") ==
      "Mathematics (MATH): MATH C2210, MATH C2210H, MATH 5, MATH 70A"
      and C.cq_subject_lists("Astronomy (AST) 1A, 1AH") == "Astronomy (AST) AST 1A, AST 1AH",
      "each bare number after a subject's code reads with that code, with or without a colon")
check(C.cq_subject_lists("Psychology (PSYC): 2, 2H or 48") == "Psychology (PSYC): PSYC 2, PSYC 2H or PSYC 48",
      "the words between the numbers stay as printed")
check(C.cq_subject_lists("Kinesiology (KIN): 4, 6, A03, A31A, V01") ==
      "Kinesiology (KIN): KIN 4, KIN 6, KIN A03, KIN A31A, KIN V01",
      "a number leading with a letter (KIN A03, V01; DAN D10) reads too, so a list never stops at the first one")
check(C.cq_subject_lists("Accounting (ACC) 3 units") == "Accounting (ACC) 3 units"
      and C.cq_subject_lists("Course (CIS) CIS 5") == "Course (CIS) CIS 5"
      and C.cq_subject_lists("(Take one course in each) 1, 2") == "(Take one course in each) 1, 2",
      "a quantity, a code already written whole, and a parenthesis naming no code are left alone")
MS = json.load(open(os.path.join(ROOT, "tests", "fixtures", "curriqunet_rcc_getpage_6290.json")))
PMS = C.cq_page({"id": 6290, "text": "Math and Science - Associate of Science - AS493/AS493C",
                 "aliaspath": "5852/6117/6290"}, MS, "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/")
# A sample of Riverside City's Math & Sciences list in the Program Course File
# (control number 18114, 110 courses), each a bare number on the page.
MS_LIST = [{"code": c} for c in ("MATH 5", "MATH 9", "MATH 70A", "MATH C2210H", "STAT C1000", "PSYC 48",
                                 "AST 1A", "CHE 1A", "GEG 1L", "GEO 3", "OCE 1", "PHS 1", "PHY 2A",
                                 "BIO 1", "BIO 60H", "ANT 1H", "CIS 17A", "CSC 18C", "ELE 23", "ENE 35")]
gms = C.assign([{"control_number": "18114", "title": "Math & Sciences", "award": "A.S. Degree",
                 "closed_list": MS_LIST}], [PMS])["18114"]["best"]
check(gms and gms["url"].endswith("/5852/6117/6290") and gms["coverage"] == 1.0,
      "the real Math and Science page (run 38092480434) is the Math & Sciences emphasis's page: %r"
      % ((gms and (gms["url"], gms["coverage"])),))
raw = "\n".join(C.cq_text(b.get("text") or "") for b in MS["body"])
check(P.coverage(P.find_codes(raw, MS_LIST), MS_LIST) < 0.5,
      "read as printed, the page names under half the list: the failure the expansion fixes")

# what an extraction after a capture would pay for, against the filed read
_wx = tempfile.mkdtemp()
try:
    os.makedirs(os.path.join(_wx, "records"))
    json.dump([{"control_number": "1", "source": {"url": "u"}, "coverage": 1.0, "codes_found": ["A1"]},
               {"control_number": "2", "source": None, "coverage": 0.0, "codes_found": [], "method": "not_found"}],
              open(os.path.join(_wx, "sources.json"), "w"))
    open(os.path.join(_wx, "records", "1.json"), "w").write("{}")
    wx = C.would_extract("X", [
        {"control_number": "1", "source": {"url": "u"}, "coverage": 1.0, "codes_found": ["A1"], "text": "t"},
        {"control_number": "2", "source": {"url": "v"}, "coverage": 0.9, "codes_found": ["B1"], "text": "t"},
        {"control_number": "3", "source": None, "coverage": 0.0, "codes_found": [], "text": ""}], folder=_wx)
    check(wx["kept"] == 1 and wx["programs"] == 1 and wx["list"][0]["control_number"] == "2"
          and wx["list"][0]["was_method"] == "not_found",
          "a capture names the programs an extraction would send to the model, and keeps the rest: %r" % wx)
finally:
    shutil.rmtree(_wx, ignore_errors=True)

# a re-run keeps a record filed from the same page
prev = {"source": {"url": "u"}, "coverage": 1.0, "codes_found": ["A1"]}
check(C.unchanged(prev, {"source": {"url": "u"}, "coverage": 1.0, "codes_found": ["A1"]}) and
      not C.unchanged(prev, {"source": {"url": "v"}, "coverage": 1.0, "codes_found": ["A1"]}) and
      not C.unchanged(None, prev), "only a source from the same page, naming the same courses, keeps its record")

# ── the source a full college files keeps the pilot's shape ─────────────────
reg = {"catalog_url": start, "catalog_year": "2026-2027", "catalog_platform": "courseleaf", "catalog_format": "html_per_program"}
src = C.source_record("Cerritos College", aa, reg, best, "sitemap_page")
check(all(k in src for k in ("college", "control_number", "shape", "title", "award", "catalog_year",
                             "closed_list", "coverage", "codes_found", "text", "source")),
      "a source carries every field the pilot's extraction reads")
check(src["source"]["url"].endswith("field-ironworkers-aa/") and src["coverage"] == 1.0,
      "the source names its page and its coverage")
miss = C.source_record("Cerritos College", byc["99999"], reg, None, "no_closed_list")
check(miss["text"] == "" and miss["coverage"] == 0.0 and miss["method"] == "no_closed_list",
      "a program without a page files an empty source the extraction skips")

# ── filing: a capture-only run never replaces the read it did not redo ──────
import json as _json, tempfile as _tf
_root = _tf.mkdtemp()
_saved_dir = C.COLLEGE_DIR
C.COLLEGE_DIR = _root
_out = os.path.join(_root, "out")
os.makedirs(os.path.join(_out, "sources"))
open(os.path.join(_out, "capture.json"), "w").write(_json.dumps({"college": "Cerritos College"}))
_dest = os.path.join(_root, "cerritos")
os.makedirs(os.path.join(_dest, "records"))
open(os.path.join(_dest, "records", "OLD.json"), "w").write("{}")
C.file_run("Cerritos College", _out, "1")
check(os.path.exists(os.path.join(_dest, "capture_preview.json")) and os.path.exists(os.path.join(_dest, "records", "OLD.json")),
      "a capture-only run files a preview and leaves the filed records alone")
os.makedirs(os.path.join(_out, "records"))
open(os.path.join(_out, "records", "NEW.json"), "w").write(_json.dumps({"score": None}))
C.file_run("Cerritos College", _out, "2")
check(os.listdir(os.path.join(_dest, "records")) == ["NEW.json"] and not os.path.exists(os.path.join(_dest, "capture_preview.json")),
      "a run that extracted replaces the records whole, so a program that lost its page loses its record")
C.COLLEGE_DIR = _saved_dir

# ── shards ──────────────────────────────────────────────────────────────────
items = list(range(23))
parts = [C.shard_of(items, i, 6) for i in range(6)]
check(sorted(x for p in parts for x in p) == items and max(map(len, parts)) - min(map(len, parts)) <= 1,
      "six shards take every source exactly once, evenly")
check(C.slug_of("Cerritos College") == "cerritos" and C.slug_of("Mt. San Antonio College") == "mt_san_antonio",
      "a college files under a plain slug")

# ── the run's account ───────────────────────────────────────────────────────
recs = [{"score": {"pass": True, "coverage": {"pass": True}, "arithmetic": {"pass": True}}, "cost_usd": 0.05},
        {"score": {"pass": False, "coverage": {"pass": True}, "arithmetic": {"pass": False}}, "cost_usd": 0.07},
        {"score": None, "error": "HTTP 500", "cost_usd": None}]
sm = C.summarize(recs, {"college": "Cerritos College", "programs": 292, "with_closed_list": 288, "found": 270})
check(sm["passed_machine_checks"] == 1 and sm["failed"]["arithmetic"] == 1 and sm["errors"] == 1
      and sm["cost_usd"] == 0.12, "the account counts passes, each failed check, errors and cost")

# ── which statuses the harvest reads (Sam's go, 2026-10-10: Approved too) ──
check("status.like.Active*" in C.STATUS_FILTER and "status.eq.Approved" in C.STATUS_FILTER
      and C.STATUS_FILTER.startswith("or=("),
      "the read takes Active, Active - Teachout Only and Approved programs: a college may offer an Approved "
      "program, and 1,423 statewide had gone unread")

# ── the workflow: reads only when asked, spends only when asked ─────────────
wf = open(os.path.join(ROOT, ".github", "workflows", "program-requirements-college.yml")).read()
read_job = wf.split("\n  read:\n")[1].split("\n  load:\n")[0]
load_job = wf.split("\n  load:\n")[1].split("\n  display:\n")[0]
display_job = wf.split("\n  display:\n")[1]
check("CENSUS_DELAY_MS: '4000'" in wf, "the capture reads at the census's pace")
check("startsWith(github.event.head_commit.message, '[extract]')" in wf and "workflow_dispatch" in wf
      and "contains(github.event.head_commit.message" not in wf,
      "the extraction spends model calls only on a dispatch or a commit whose message STARTS with [extract]")
check("startsWith(github.event.head_commit.message, '[read]')" in read_job.split("runs-on:")[0]
      and "github.event.inputs.step != 'load'" in read_job.split("runs-on:")[0]
      and "github.event.inputs.step != 'display'" in read_job.split("runs-on:")[0],
      "a push reads the catalog only when its message starts with [read] or [extract]: an edit to the "
      "script never re-reads 360 pages of a college's catalog")
check("startsWith(github.event.head_commit.message, '[load]')" in load_job.split("runs-on:")[0]
      and "github.event.inputs.step == 'load'" in load_job.split("runs-on:")[0],
      "the load runs only on a dispatch with step=load or a commit whose message STARTS with [load]")
display_if = display_job.split("runs-on:")[0]
check("github.event.inputs.step == 'display'" in display_if and "github.event_name == 'workflow_dispatch'" in display_if
      and "head_commit" not in display_if,
      "the display write runs only on a dispatch with step=display, never on a push: it changes checked "
      "programs, which waits on Sam's go")
check(wf.count("contents: write") == 3 and wf.count('git push origin "HEAD:${{ github.ref_name }}"') == 3
      and wf.count("git push") == 3,
      "each job writes only to the branch that ran it")


def steps(job):
    return ["- name:" + x for x in job.split("- name:")[1:]]


key_line = "SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}"
holders = [st.splitlines()[0] for st in steps(read_job) + steps(load_job) + steps(display_job)
           if "SUPABASE_SERVICE_KEY" in st]
check(wf.count("SUPABASE_SERVICE_KEY") == 2 * wf.count(key_line) == 6
      and holders == ["- name: Extract and score", "- name: Load the committed records, unchecked",
                      "- name: Apply the display build the page carries"],
      "the service key reaches the extraction, load and display steps, and no other: %r" % holders)
check("if: env.EXTRACT == 'true'" in read_job, "the extraction step runs only when asked")
check(wf.count("github.actor != 'github-actions[bot]'") == 3, "the filing and receipt commits never run the workflow again")

# ── the load: unchecked, insert-only, and reversible from its receipt ───────
import json  # noqa: E402
import shutil  # noqa: E402
import tempfile  # noqa: E402

parent = tempfile.mkdtemp()
tmp = os.path.join(parent, C.slug_of("Cerritos College"))
try:
    os.makedirs(os.path.join(tmp, "records"))
    with open(os.path.join(tmp, "capture.json"), "w") as fh:
        json.dump({"college": "Cerritos College", "catalog_year": "2026-2027"}, fh)

    def rec(key, **kw):
        base = {"college": "Cerritos College", "control_number": key, "title": "T" + key, "award": "A.S. Degree",
                "source_url": "https://example.edu/" + key, "extracted_run": "37961137169", "error": None,
                "score": {"coverage": {"pass": True, "placed": 11, "listed": 12}, "invented": {"pass": True},
                          "arithmetic": {"status": "equal"}, "pass": True},
                "record": {"program": {"measure": "units", "total_units": {"min": 18, "max": 18.5}},
                           "blocks": [{"rule": "all", "courses": []}], "notes": "the model's working",
                           "missing_explained": []}}
        base.update(kw)
        with open(os.path.join(tmp, "records", key + ".json"), "w") as fh:
            json.dump(base, fh)

    rec("00001")
    rec("00002", extracted_run="37966828676")
    rec("00003", error="timeout", record=None)
    rec("00004", college="Mt. San Antonio College")
    rec("00005", record={"program": {"measure": "credits", "total_units": {}}, "blocks": []})
    rec("00006", record={"program": {"measure": "units", "total_units": {"min": "18"}}, "blocks": []})
    rec("00007", extracted_run=None)
    rows, skipped = C.load_rows("Cerritos College", folder=tmp)
    check([r["control_number"] for r in rows] == ["00001", "00002"]
          and [s["control_number"] for s in skipped] == ["00003", "00004", "00005", "00006", "00007"],
          "the load leaves out an errored record, another college's, an unknown measure, a total that is "
          "not a number and a record with no run, each with its reason: %r" % skipped)
    check(all(not {"checked", "checked_by", "checked_at"} & set(r) for r in rows),
          "a load row never carries checked: the function writes every row unchecked")
    check([r["extracted_run"] for r in rows] == ["37961137169", "37966828676"],
          "each row keeps the extraction run that read it, so a record kept from an earlier run says so")
    check(set(rows[0]["record"]) == {"program", "blocks"} and rows[0]["catalog_year"] == "2026-2027"
          and rows[0]["checks"] == {"coverage": True, "invented": True, "arithmetic": "equal", "placed": 11, "listed": 12},
          "a row carries the record as a reader renders it (no working notes), the year, the three checks, "
          "and the scorer's placed and listed counts for the Records view")

    posted = []

    def post(body):
        posted.append(body)
        if len(posted) == 2:
            raise RuntimeError("HTTP Error 500")
        return {"inserted_keys": [r["control_number"] for r in body["p_rows"]], "kept_keys": []}

    real = (C.COLLEGE_DIR, C.RECEIPTS)
    C.COLLEGE_DIR, C.RECEIPTS = parent, os.path.join(parent, "receipts")
    try:
        code = C.load("Cerritos College", "38000000001", batch=1, post=post)
        receipt = json.load(open(C.receipt_path("Cerritos College", "38000000001")))
        refused = C.load("Cerritos College", "not-a-run", post=post)
    finally:
        C.COLLEGE_DIR, C.RECEIPTS = real
    check(code == 1 and receipt["inserted_keys"] == ["00001"] and receipt["error"].startswith("batch 2")
          and receipt["posted"] == 2 and len(receipt["skipped"]) == 5,
          "a load that stops mid-way still files a receipt naming what it inserted and where it stopped")
    check(receipt["rollback"] and "checked = false" in receipt["rollback"] and "'00001'" in receipt["rollback"]
          and "'00002'" not in receipt["rollback"],
          "the rollback names only the keys this load inserted, and only while they are unchecked")
    check(refused == 2, "a load without a numeric run id refuses")
finally:
    shutil.rmtree(parent, ignore_errors=True)

sql = open(os.path.join(ROOT, "chatbox", "supabase_program_requirement_records_college_load.sql")).read()
body = sql.split("as $$")[1].split("$$;")[0]
check("on conflict (college, control_number) do nothing" in body and "update" not in body.lower()
      and "delete" not in body.lower(),
      "the load function only inserts, and never touches a row already there")
check("r->'record', r->'checks', false, null, null," in body,
      "the load function writes every row unchecked, with no checked_by or checked_at")
check("auth.role(), '') <> 'service_role'" in body
      and "from public, anon, authenticated;" in sql and "to service_role;" in sql.split("grant execute")[1],
      "only the service role may load: the body checks the caller's role, and the grant names service_role alone")

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements college pass (%d checks)" % checks[0])
