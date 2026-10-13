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

# ── a page reached only through hidden text must name the program (S366) ──
# Long Beach City hides an A-Z course index naming every course, so every page held
# every program's codes in textContent: Photography A.A.'s page went to seven programs.
INDEX = " ".join("FD %d FILM %d FLOR %d" % (i, i, i) for i in range(1, 9))   # the hidden index


def hidden_page(url, h1, visible):
    content = visible + " " + INDEX
    return {"url": url, "h1": h1, "title": h1 + " | LBCC", "body": visible, "content": content,
            "got": {"body": visible, "content": content, "title": h1 + " | LBCC", "h1": h1},
            "codes": C.page_codes(content)}


fashion = {"control_number": "02686", "title": "Fashion Design", "award": "A.A. Degree",
           "closed_list": [{"code": "FD %d" % i} for i in range(1, 7)]}
photo = hidden_page(start + "degrees-certificates/digital-media-arts/photography-aa/",
                    "Photography - Associate in Arts", "Photography, A.A. Program Requirements")
own = hidden_page(start + "degrees-certificates/fashion/fashion-design-aa/",
                  "Fashion Design - Associate in Arts", "Fashion Design, A.A.")
check(C.candidates(fashion, [photo]) == [],
      "a page whose courses sit only in hidden text is not a program's page when its heading names another program")
check([c["url"] for c in C.candidates(fashion, [photo, own])] == [own["url"]],
      "the program's own page, its heading naming the program, is still read from its hidden text")
visible_photo = dict(photo, body="Photography " + " ".join("FD %d" % i for i in range(1, 7)),
                     got=dict(photo["got"], body="Photography " + " ".join("FD %d" % i for i in range(1, 7))))
check(len(C.candidates(fashion, [visible_photo])) == 1,
      "the heading rule binds hidden text only: courses printed on the page still make it a candidate")
# The pairs measured on the 74 (run 38152016534, sources.json): own pages kept, the rest turned away.
for title, h1, want in [
        ("Physical Sciences", "Physical Sciences - Associate in Science", True),
        ("Office Technologies-Microsoft Excel", "Microsoft Excel - Certificate of Completion", True),
        ("Office Technologies-Microsoft Word", "Microsoft Word for Windows - Certificate of Completion", True),
        ("Electrical Technology, CISCO Certified Network Installation Associate",
         "CISCO Certified Network Installation Associate - Certificate of Achievement", True),
        ("Computer Science", "Computer Aided Design - Mechanical - Associate in Science", False),
        ("Fashion Design", "Photography - Associate in Arts", False),
        ("History", "Art History - Associate in Arts Transfer Degree", False),
        ("Floral Design", "Architectural Design - Certificate of Achievement", False),
        ("Workplace Language Skills for ESL Level 2",
         "Workplace Language Skills for ESL – Level 1 - Certificate of Competency", False)]:
    check(C.heading_names_program({"h1": h1}, {"title": title}) is want,
          "%s on '%s': %s" % (title, h1, "its own page" if want else "another program's page"))

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
      "a program entry names an award after a dash")
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
KHW = json.load(open(os.path.join(ROOT, "tests", "fixtures", "curriqunet_rcc_getpage_6289.json")))
PKH = C.cq_page(KHW["page"], KHW, "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/")
KH_LIST = [{"code": c} for c in ("KIN 4", "KIN 39", "KIN A03", "KIN A31A", "KIN A90C", "KIN V01", "KIN V95",
                                 "KINA11", "KINV78", "HES 1", "BIO 50B", "GUI 48", "EAR 26", "PSYC 11")]
gkh = C.assign([{"control_number": "18112", "title": "Kinesiology, Health and Wellness", "award": "A.A. Degree",
                 "closed_list": KH_LIST}], [PKH])["18112"]["best"]
check(gkh and gkh["coverage"] == 1.0,
      "the real Kinesiology, Health and Wellness page (run 38094747667) names its activity and varsity courses: %r"
      % ((gkh and gkh["coverage"]),))
# one program under two index entries (Norco 5545 and 5552, run 38095619629):
# the entries are one page when programs compete, so the A.A.-T never reads
# the A.A.'s page through its second entry
E1 = {"id": 5545, "text": "Kinesiology, Health and Wellness - Associate of Arts Degree - (AOE) NAA498/C",
      "aliaspath": "5367/5467/5545"}
E2 = {"id": 5552, "text": "Kinesiology, Health & Wellness - Associate of Arts Degree (AOE) - NAA498/C",
      "aliaspath": "5367/5569/5552"}
NCP = "https://rccd.curriqunet.com/catalog/alias/nc-catalog/iq/"
P1, P2 = C.cq_page(E1, KHW, NCP), C.cq_page(E2, KHW, NCP)
check(P1["group"] == P2["group"] == "codes:NAA498/C" and P1["url"] != P2["url"]
      and C.cq_group("Degrees and Certificates Explained", "u") == "u",
      "two index entries naming the same local award codes are one page; a title naming none keeps its address")
gdup = C.assign([{"control_number": "30103", "title": "Kinesiology, Health & Wellness", "award": "A.A. Degree",
                  "closed_list": KH_LIST},
                 {"control_number": "37169", "title": "Kinesiology", "award": "A.A- T Degree",
                  "closed_list": KH_LIST[:8]}], [P1, P2])
check(gdup["30103"]["best"] and gdup["37169"]["best"] is None
      and gdup["37169"]["lost"] and gdup["37169"]["lost"][0] in (P1["url"], P2["url"]),
      "the A.A. keeps its page and the A.A.-T reads none, naming the page it lost: %r"
      % ({k: (v["best"] and v["best"]["url"], v["lost"]) for k, v in gdup.items()},))
raw = "\n".join(C.cq_text(b.get("text") or "") for b in MS["body"])
check(P.coverage(P.find_codes(raw, MS_LIST), MS_LIST) < 0.5,
      "read as printed, the page names under half the list: the failure the expansion fixes")

# what an extraction after a capture would pay for, against the filed read
_wx = tempfile.mkdtemp()
try:
    os.makedirs(os.path.join(_wx, "records"))
    json.dump([{"control_number": "1", "source": {"url": "u"}, "coverage": 1.0, "codes_found": ["A1"]},
               {"control_number": "2", "source": None, "coverage": 0.0, "codes_found": [], "method": "not_found"},
               {"control_number": "4", "source": {"url": "w"}, "coverage": 1.0, "codes_found": ["D1"]}],
              open(os.path.join(_wx, "sources.json"), "w"))
    open(os.path.join(_wx, "records", "1.json"), "w").write(json.dumps({"record": {"blocks": []}}))
    # S361: a call that ran past max_tokens filed its row with no record; the next read asks again.
    open(os.path.join(_wx, "records", "4.json"), "w").write(
        json.dumps({"record": None, "error": "the record ran past max_tokens"}))
    wx = C.would_extract("X", [
        {"control_number": "1", "source": {"url": "u"}, "coverage": 1.0, "codes_found": ["A1"], "text": "t"},
        {"control_number": "2", "source": {"url": "v"}, "coverage": 0.9, "codes_found": ["B1"], "text": "t"},
        {"control_number": "3", "source": None, "coverage": 0.0, "codes_found": [], "text": ""},
        {"control_number": "4", "source": {"url": "w"}, "coverage": 1.0, "codes_found": ["D1"], "text": "t"}], folder=_wx)
    check(wx["kept"] == 1 and wx["programs"] == 2 and [x["control_number"] for x in wx["list"]] == ["2", "4"]
          and wx["list"][0]["was_method"] == "not_found",
          "a capture names the programs an extraction would send to the model (an errored record among them), "
          "and keeps the rest: %r" % wx)
finally:
    shutil.rmtree(_wx, ignore_errors=True)

# a re-run keeps a record filed from the same page
prev = {"source": {"url": "u"}, "coverage": 1.0, "codes_found": ["A1"]}
check(C.unchanged(prev, {"source": {"url": "u"}, "coverage": 1.0, "codes_found": ["A1"]}) and
      not C.unchanged(prev, {"source": {"url": "v"}, "coverage": 1.0, "codes_found": ["A1"]}) and
      not C.unchanged(None, prev), "only a source from the same page, naming the same courses, keeps its record")
check(not C.unchanged({"source": {"url": "u", "text_from": "textContent"}, "coverage": 1.0, "codes_found": ["A1"]},
                      {"source": {"url": "u", "text_from": "innerText"}, "coverage": 1.0, "codes_found": ["A1"]}),
      "a source read from the visible text never keeps a record filed from the hidden text (Long Beach City, S362)")

# ── curriQunet, Chaffey's shape (S369) ──────────────────────────────────────
# Reads 38202133197 and 38202752228: Degrees and Certificates (19210) shows a tab
# list of an index and six schools; an entry is titled "... - AS-T Degree" with no
# local codes and holds a Requirements child, where the curriculum is; a blank
# sibling is kept out of the web view. The first capture (run 38197183697) walked
# every program as a section, ran out of calls and listed none.
check(C.cq_is_program({"text": "Business Administration 2.0 for Transfer - AS-T Degree", "haschildbodynavs": True})
      and C.cq_is_program({"text": "Physical Therapist Assistant - A.S. Degree"})
      and C.cq_is_program({"text": "California General Education Transfer Curriculum (Cal-GETC) - Certificate of Achievement"})
      and C.cq_is_program({"text": "Spanish - AA-T"})
      and not C.cq_is_program({"text": "Requirements"}) and not C.cq_is_program({"text": "Business, Technology & Hospitality"}),
      "Chaffey's entries name their award as AS-T Degree, A.S. Degree or a certificate, and hold children")
HIDE = json.dumps({"nodeConfig": {"excludeFromWebView": True}})
check(C.cq_hidden({"text": " ", "config": HIDE}) and C.cq_hidden({"text": "Notes", "config": HIDE})
      and not C.cq_hidden({"text": "Requirements", "config": json.dumps({"nodeConfig": {"excludeFromWebView": False}})})
      and not C.cq_hidden({"text": "Requirements", "config": "not json"}),
      "a node the catalog keeps out of its web view, or a blank one, is not read")
BUS = {"id": 19915, "text": "Business Administration 2.0 for Transfer - AS-T Degree", "aliaspath": "19210/bth/busadmin2",
       "haschildbodynavs": True}
ACC = {"id": 19950, "text": "Accounting", "aliaspath": "19210/program_index/accounting", "haschildbodynavs": True}
ACC_AS = {"id": 19951, "text": "Accounting - A.S. Degree", "aliaspath": "19210/program_index/accounting/19951",
          "haschildbodynavs": True}
REQ_HTML = ('<div class="program-summary-wrapper"><h3>Required Courses</h3><table><tr><td>ACCTG-1A</td>'
            '<td>Financial Accounting</td><td>4</td></tr><tr><td>BUS-10</td><td>Introduction to Business</td><td>3</td>'
            '</tr></table><p>Total Units: 27</p></div>')
CH = {
    "top": {"navs": [{"id": 19224, "text": "Student Classifications and Programs", "haschildbodynavs": True},
                     {"id": 19210, "text": "Degrees and Certificates", "haschildbodynavs": True},
                     {"id": 19209, "text": "Courses", "haschildbodynavs": True}]},
    "page:19210": {"page": {"id": 19210, "text": "Degrees and Certificates"}, "body": [{"navlist": [{"id": 20265}]}]},
    "nav:20265": {"navs": [{"id": 20266, "text": "Program Index", "haschildbodynavs": True},
                           {"id": 20268, "text": "Business, Technology & Hospitality", "haschildbodynavs": True}]},
    "page:20266": {"body": [{"navlist": [{"id": 20300}]}]},
    "nav:20300": {"navs": [ACC]},
    "page:19950": {"body": [{"navlist": [{"id": 20310}]}]},
    "nav:20310": {"navs": [ACC_AS]},
    "page:20268": {"body": [{"navlist": [{"id": 20301}]}]},
    "nav:20301": {"navs": [BUS]},
    "page:19224": {"body": [{"navlist": [{"id": 20400}]}]},
    "nav:20400": {"navs": [{"id": 20401, "text": "Honors Program"}]},
    "page:19915": {"page": {"id": 19915, "text": BUS["text"]}, "body": [{"navlist": [{"id": 20080}]}]},
    "nav:20080": {"navs": [{"id": 19916, "text": "Requirements", "config": json.dumps({"nodeConfig": {"excludeFromWebView": False}})},
                           {"id": 19917, "text": " ", "config": HIDE},
                           {"id": 19999, "text": "Business Administration - Certificate of Achievement"}]},
    "page:19916": {"page": {"id": 19916, "text": "Requirements"},
                   "body": [{"catalogblockheader": None, "text": REQ_HTML}]},
}
ch_asked = []


def chaffey_get(url):
    ch_asked.append(url)
    q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
    if "navigationtypeId" in q:
        return CH["top"]
    if "parentId" in q:
        return CH.get("nav:" + q["parentId"][0])
    return CH.get("page:" + q["id"][0])


cents, cacct = C.cq_index(chaffey_get, 718, "https://chaffey.curriqunet.com")
check(sorted(e["id"] for e in cents) == [19915, 19951] and cacct["sections"][0] == "Degrees and Certificates"
      and cacct["entries"] == 2 and not cacct["stopped_at_cap"],
      "Chaffey's walk reads Degrees and Certificates first and finds the entries under the index and the schools: %r"
      % [e["id"] for e in cents])
first_19224 = next(i for i, a in enumerate(ch_asked) if "id=19224" in a)
check(all(i < first_19224 for i, a in enumerate(ch_asked) if "id=19210" in a or "parentId=20265" in a),
      "Degrees and Certificates and its tab list are read before Student Classifications and Programs")
check(not any("id=19915" in a or "id=19951" in a for a in ch_asked),
      "the walk takes an entry with children as an entry and never reads it as a section")
ch_asked.clear()
bus_page = chaffey_get("https://chaffey.curriqunet.com/Catalog/_getPage?catalogId=718&id=19915")
own, more = C.cq_children(chaffey_get, 718, "https://chaffey.curriqunet.com", bus_page)
check([p["page"]["id"] for p in own] == [19916] and [m["id"] for m in more] == [19999]
      and not any("id=19917" in a for a in ch_asked),
      "an entry's visible child is read as its own page, a child program is an entry, the hidden sibling is never read")
PCH = C.cq_page(BUS, bus_page, "https://chaffey.curriqunet.com/catalog/iq/", own)
check(PCH["url"] == "https://chaffey.curriqunet.com/catalog/iq/19210/bth/busadmin2"
      and PCH["title"] == BUS["text"] and {"ACCTG1A", "BUS10"} <= PCH["codes"] and "Total Units: 27" in PCH["body"],
      "the entry's page carries the courses its Requirements child prints, under the entry's own address and title")
check(C.cq_page(BUS, bus_page, "x")["codes"] == set(),
      "without its Requirements child the entry's page names no course (the first capture's 0)")

# San Diego Mesa's special-admission programs (S374): six tabs, Requirements fifth.
RAD_TABS = [{"id": 18092, "text": "Summary"}, {"id": 19711, "text": "Accreditation"},
            {"id": 19671, "text": "Directed Clinical Practice Requirement"}, {"id": 19670, "text": "Admission Criteria"},
            {"id": 18284, "text": "Requirements"}, {"id": 18476, "text": "Courses"}]
RAD = {"page:17708": {"page": {"id": 17708, "text": "Radiologic Technology - Associate of Science Degree: Mesa"},
                      "body": [{"navlist": [{"id": 17900}]}]},
       "nav:17900": {"navs": RAD_TABS}}
for t in RAD_TABS:
    RAD["page:%d" % t["id"]] = {"page": {"id": t["id"], "text": t["text"]},
                                "body": [{"text": "<p>RADT 100 RADT 110</p>" if t["id"] == 18284 else "<p>%s</p>" % t["text"]}]}
rad_asked = []


def mesa_get(url):
    rad_asked.append(url)
    q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
    if "parentId" in q:
        return RAD.get("nav:" + q["parentId"][0])
    return RAD.get("page:" + q["id"][0])


rad_own, rad_more = C.cq_children(mesa_get, 70, "https://sdccd.curriqunet.com", RAD["page:17708"])
check(len(rad_own) == C.CQ_MAX_CHILDREN and rad_own[0]["page"]["id"] == 18284 and not rad_more
      and not any("id=18476" in a for a in rad_asked),
      "a Requirements tab is read first, under the cap, when it is the fifth of six tabs (Mesa's Radiologic Technology)")
RAD_PAGE = C.cq_page({"id": 17708, "text": RAD["page:17708"]["page"]["text"], "aliaspath": "17540/programs/17708"},
                     RAD["page:17708"], "x/", rad_own)
check({"RADT100", "RADT110"} <= RAD_PAGE["codes"], "the entry's page carries the courses its Requirements tab prints")

# ── curriQunet: San Diego City's catalog from the host's list, and each program once (S369) ──
# Reads 38203841691 and 38204183571: the alias start page draws an empty "Active
# Catalogs" shell and fetches nothing; _getCatalogs names City 2026-2027 as 69.
SDCCD = [{"Id": 69, "Title": "City 2026-2027"}, {"Id": 70, "Title": "Mesa 2026-2027"},
         {"Id": 71, "Title": "Miramar 2026-2027"}]
check(C.cq_catalog_from_list(SDCCD, "San Diego City College", "2026-2027") == 69
      and C.cq_catalog_from_list(SDCCD, "San Diego Mesa College", "2026-2027") == 70
      and C.cq_catalog_from_list(SDCCD, "San Diego Miramar College", "2026-2027") == 71,
      "the host's catalog list gives each college the catalog its title names")
check(C.cq_catalog_from_list(SDCCD, "San Diego City College", "2025-2026") is None
      and C.cq_catalog_from_list(SDCCD + [{"Id": 60, "Title": "City 2025-2026"}], "San Diego City College", "2026-2027") == 69
      and C.cq_catalog_from_list(SDCCD + [{"Id": 72, "Title": "City 2026-2027"}], "San Diego City College", "2026-2027") is None
      and C.cq_catalog_from_list(None, "San Diego City College", "2026-2027") is None
      and C.cq_catalog_from_list([{"Id": 5, "Title": "2026-2027 Catalog"}], "Chaffey College", "2026-2027") is None,
      "only the registry's year counts, two candidates are none, and a title naming no college word is none")
same, dropped = C.cq_distinct([BUS, dict(BUS, id=18990, aliaspath="19210/program_index/18990"),
                               {"id": 19951, "text": "Accounting - A.S. Degree"}])
check([e["id"] for e in same] == [19915, 19951] and dropped == 1,
      "a program the index and its school both list is read once, from the first entry")
check([e["id"] for e in C.cq_distinct([ENTRY, {"id": 5877, "text": "Accounting Basics for Small Business - Certificate of Completion - CC8009"}])[0]]
      == [5878, 5877], "Riverside City's entries, each titled once, are all kept")

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
    # Sam, Open Asks Sheet 62 card 1 ("remove them"): a record placing none of its courses read another page.
    rec("00008", score={"coverage": {"pass": True, "placed": 0, "listed": 6}, "invented": {"pass": True},
                        "arithmetic": {"status": "unstated"}, "pass": True})
    rows, skipped = C.load_rows("Cerritos College", folder=tmp)
    check([r["control_number"] for r in rows] == ["00001", "00002"]
          and [s["control_number"] for s in skipped] == ["00003", "00004", "00005", "00006", "00007", "00008"],
          "the load leaves out an errored record, another college's, an unknown measure, a total that is "
          "not a number, a record with no run and one placing none of its courses, each with its reason: %r" % skipped)
    check("another program's page" in skipped[-1]["why"],
          "a record placing none of its listed courses is never loaded, even one that passed as scored")
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
          and receipt["posted"] == 2 and len(receipt["skipped"]) == 6,
          "a load that stops mid-way still files a receipt naming what it inserted and where it stopped")
    check(receipt["rollback"] and "checked = false" in receipt["rollback"] and "'00001'" in receipt["rollback"]
          and "'00002'" not in receipt["rollback"],
          "the rollback names only the keys this load inserted, and only while they are unchecked")
    check(refused == 2, "a load without a numeric run id refuses")
finally:
    shutil.rmtree(parent, ignore_errors=True)

# ── the link search never takes a course listing for a program (S380) ───────
# Coastline run 38406172949: the link search accepted
# course-descriptions/credit-courses/re/ for Real Estate at coverage 1.0 (a course
# listing names every course in its subject) and three listings for five programs.
CL = "https://catalog.cccd.edu/coastline/"
check(not C.link_page_ok(CL + "course-descriptions/credit-courses/re/index.html", "/coastline/")
      and not C.link_page_ok(CL + "course-descriptions/credit-courses/emgt/", "/coastline/")
      and not C.link_page_ok("https://catalog.cccd.edu/golden-west/pathways/business/", "/coastline/")
      and not C.link_page_ok("", "/coastline/"),
      "a course listing, another college's path on a district host, or no address is never a program's page")
check(C.link_page_ok(CL + "pathways/behavior-culture-society/aging-studies/aging-studies-aa/", "/coastline/")
      and C.link_page_ok("https://catalog.mtsac.edu/programs/accounting/", None),
      "a program page in the college's own scope, or on a host with no scope, stands")

# ── a CourseLeaf program page listed as <dir>/index.html is read (S380) ──────
# Coastline's catalog lists each program page as .../business-as/index.html; the
# old filter dropped every address ending in /index.html, and 109 of 159 programs
# found no page (run 38406172949). Read in its directory form, once.
CLP = CL + "pathways/business-operations-management/business/"
cands = C.program_candidates([CLP + "business-as/index.html", CLP + "business-as/",
                              CLP + "marketing-certificate-achievement/index.html",
                              CL + "index.html", CL + "course-descriptions/credit-courses/bus/index.html",
                              "https://catalog.cccd.edu/golden-west/pathways/business/business-as/index.html"],
                             CL, "/coastline/")
check(cands == [CLP + "business-as/", CLP + "marketing-certificate-achievement/"],
      "an index.html program page is read as its directory, once; the catalog front page, a course listing and "
      "another college's path are not")
check(C.dir_form(CLP + "business-as/index.html#req") == CLP + "business-as/" and C.dir_form("") == "",
      "the directory form drops index.html and any fragment")
check(C.link_page_ok(CLP + "business-as/index.html", "/coastline/"),
      "the link search may take an index.html program page too")

# ── a subject page's own program pages are read (S381) ──────────────────────
# Coastline run 38412902035 (after the index.html fix) still found 24 of 159: its
# sitemap lists the subject pages and few of the program pages each one links, so
# Information Technology A.S. turned up only through the capped link search.
SUBJ = CLP   # pathways/business-operations-management/business/
links = [{"href": SUBJ + "business-as/index.html"}, {"href": SUBJ + "marketing-applied-as/"},
         {"href": SUBJ + "business-as/#requirementstext"},
         {"href": CL + "pathways/business-operations-management/accounting/"},     # a sibling, not beneath
         {"href": CL + "pathways/computer-cyber-sciences/"},                         # the menu
         {"href": CL + "course-descriptions/credit-courses/bus/index.html"},
         {"href": "https://catalog.cccd.edu/golden-west/pathways/business/business-as/"},
         {"href": SUBJ}]
check(C.child_pages(SUBJ, links, CL, "/coastline/") == [SUBJ + "business-as/", SUBJ + "marketing-applied-as/"],
      "a page's children are the program pages beneath its own address, once each, in directory form")
check(C.child_pages(SUBJ + "index.html", links, CL, "/coastline/") == [SUBJ + "business-as/", SUBJ + "marketing-applied-as/"]
      and C.child_pages(SUBJ + "page.html", links, CL, "/coastline/") == [],
      "an index.html page reads as its directory; a page that is a file has no children")

# Coastline spells some awards out in the address (the page read 38411214415's links).
check([C.slug_award(SUBJ + slug + "/") for slug in
       ("marketing-associate-science-degree", "business-administration-2.0-associate-science-degree-transfer",
        "economics-associate-arts-degree-transfer", "english-associate-arts-degree",
        "project-management-essentials-certificate-specialization", "marketing-certificate-achievement")]
      == ["as", "adt", "adt", "aa", "other", "coa"],
      "an address that spells its award out names it, the transfer form before the plain one")
adt_page = {"url": SUBJ + "business-administration-2.0-associate-science-degree-transfer/",
            "h1": "", "title": "Business Administration 2.0, Associate in Science Degree for Transfer < Coastline College"}
check(C.label_score(adt_page, {"award": "A.S. Degree", "title": "Business"})[0] == 0
      and C.label_score(adt_page, {"award": "A.S.- T Degree", "title": "Business Administration 2.0"})[0] == 1,
      "an A.S. does not read an A.S.-T page as its own because both say 'Associate in Science'")

# Every Coastline page's h1 is the catalog's banner, so the heading rule read
# "ACADEMIC CATALOGS" and turned every hidden-text page away.
ban = [{"url": SUBJ + "p%d/" % i, "h1": "ACADEMIC CATALOGS", "title": "P%d < Coastline College" % i} for i in range(12)]
aging = {"url": CL + "pathways/behavior-culture-society/aging-studies/aging-studies-aa/", "h1": "ACADEMIC CATALOGS",
         "title": "Aging Studies, Associate of Arts Degree < Coastline College"}
check(not C.heading_names_program(aging, {"title": "Aging Studies"}),
      "the banner as a heading names no program (the failure)")
check(C.drop_banner_h1(ban + [aging]) == "ACADEMIC CATALOGS" and aging["h1"] == ""
      and C.heading_names_program(aging, {"title": "Aging Studies"})
      and not C.heading_names_program(aging, {"title": "Gerontology Nursing"}),
      "an h1 on every page is the banner: the heading is read from the title, before its ' < ' site name")
few = [{"h1": "ACADEMIC CATALOGS"} for _ in range(4)] + [{"h1": "Art, A.A."}]
own_heads = [{"h1": "X%d, A.A." % i} for i in range(20)]
check(C.drop_banner_h1(few) is None and few[0]["h1"] == "ACADEMIC CATALOGS" and C.drop_banner_h1(own_heads) is None,
      "an h1 on a handful of pages, or a heading of each page's own, stays")

# ── eLumen: the program index is the catalog's side menu (S380) ─────────────
# Read 38392014238: Bakersfield's start page links each program at
# /catalog/2026-2027-Catalog/program/<slug>, beside its services, policies and
# course pages; /programs is no view. A link to another year's catalog, another
# host, or a course must never be read as a program page.
EL_START = "https://bakersfield.elumenapp.com/catalog/2026-2027-Catalog/about-bc"
EL_BASE = "https://bakersfield.elumenapp.com/catalog/2026-2027-Catalog/"
EL_LINKS = [
    {"text": "Programs of Study", "href": EL_BASE + "programs-of-study"},
    {"text": "Disabled Student Programs & Services (DSPS)", "href": EL_BASE + "dsps"},
    {"text": "Advanced Placement (AP) Program", "href": EL_BASE + "advanced-placement-ap-program"},
    {"text": "Agricultural Education Associate of Science",
     "href": EL_BASE + "program/agricultural-education-associate-of-science-fall-2026"},
    {"text": "Agriculture Business Certificate of Achievement",
     "href": EL_BASE + "program/agriculture-business-certificate-of-achievement-summer-2023#top"},
    {"text": "Agricultural Education Associate of Science",
     "href": EL_BASE + "program/agricultural-education-associate-of-science-fall-2026/"},
    {"text": "ASL B3", "href": EL_BASE + "course/aslb3"},
    {"text": "Old catalog", "href": "https://bakersfield.elumenapp.com/catalog/2025-2026-Catalog/program/old-aa-fall-2025"},
    {"text": "Elsewhere", "href": "https://pvc.elumenapp.com/catalog/2026-2027-Catalog/program/acc-aa"},
]
check(C.el_catalog(EL_START) == "2026-2027-Catalog" and C.el_catalog("https://x.edu/catalog.html") is None,
      "an eLumen start page names its catalog in the path after /catalog/")
check(C.el_program_urls(EL_LINKS, EL_START) == [
          EL_BASE + "program/agricultural-education-associate-of-science-fall-2026",
          EL_BASE + "program/agriculture-business-certificate-of-achievement-summer-2023"],
      "the menu's program pages, each once, in order: never a course, a service page, another year or another host")
check(C.el_hubs(EL_LINKS, EL_START) == [EL_BASE + "programs-of-study"],
      "an eLumen catalog's program index is its Programs of Study page, not DSPS or a program page")
check(C.el_program_urls([], EL_START) == [] and C.el_program_urls(EL_LINKS, "https://bakersfield.elumenapp.com/") == [],
      "no menu, or a start page that names no catalog, gives no program page")

# ── eLumen: the fast read from the catalog's own publish calls (S380) ───────
# Read 38413232841: the full publish call carries styles, the side menu (program
# links written relative to /catalog/) and the page; the menu loads a page through
# publish/content. A program's requirements print as rule-name / rule-credits.
check(C.el_publish_url(EL_START, C.el_start_parts(EL_START)) ==
      "https://api-prod.elumenapp.com/catalog/sites/publish/2026-2027-Catalog,about-bc"
      "?tenant=bakersfield.elumenapp.com&api=https://api-prod.elumenapp.com:443"
      and C.el_publish_url(EL_START, ["program", "ag-ed-as-fall-2026"], content=True) ==
      "https://api-prod.elumenapp.com/catalog/sites/publish/content/2026-2027-Catalog,program,ag-ed-as-fall-2026"
      "?tenant=bakersfield.elumenapp.com",
      "the publish calls are the ones the catalog's own scripts make, full for the menu, content for a page")
SHELL = ('<style scoped>.a{color:red}</style><nav>'
         '<a class="navitem" href="2026-2027-Catalog/program/ag-ed-as-fall-2026">Ag Ed AS</a>'
         '<a class="navitem" href="2026-2027-Catalog/course/agrib5">AGRI B5</a>'
         '<a href="2026-2027-Catalog/program/ag-ed-as-fall-2026">again</a>'
         '<a href="2025-2026-Catalog/program/old-as">old year</a>'
         '<a href="2026-2027-Catalog/program/culinary-coa-fall-2026">Culinary</a></nav>')
check(C.el_program_slugs(C.el_html(json.dumps({"html": SHELL})), "2026-2027-Catalog") ==
      ["ag-ed-as-fall-2026", "culinary-coa-fall-2026"]
      and C.el_program_slugs(SHELL, "2026-2027-Catalog") == ["ag-ed-as-fall-2026", "culinary-coa-fall-2026"]
      and C.el_html("not json <p>x</p>") == "not json <p>x</p>" and C.el_html(None) == "",
      "the menu's program slugs come once each, in this catalog only, from JSON or plain HTML")
CONTENT = ('<style>.x{}</style><script>var a=1;</script><h2>Agricultural Education Associate of Science</h2>'
           '<h4 class="accordionheader-x-text">Program Requirements</h4><h4>Agriculture Education AS (Total 30)</h4>'
           '<p>Complete all of the following</p><div class="new-rule"><span class="rule-name"><a href="x">AGRIB5 - '
           'Leadership in Agriculture</a></span><span class="rule-credits"> 3</span></div>'
           '<div class="new-rule"><span class="rule-name"><a href="y">ANSCB1 - Introduction to Animal Science</a>'
           '</span><span class="rule-credits"> 3</span></div>')
EPG = C.el_page(EL_START, "ag-ed-as-fall-2026", CONTENT)
check(EPG["url"] == EL_BASE + "program/ag-ed-as-fall-2026"
      and EPG["title"] == "Agricultural Education Associate of Science"
      and "var a" not in EPG["body"] and ".x{}" not in EPG["body"]
      and "Complete all of the following" in EPG["body"]
      and P.coverage(P.find_codes(EPG["body"], [{"code": "AGRI B5"}, {"code": "ANSC B1"}]),
                     [{"code": "AGRI B5"}, {"code": "ANSC B1"}]) == 1.0
      and C.el_page(EL_START, "x", "<style>a{}</style>") is None,
      "a content call reads as its program's page: its heading, its requirements without styles or scripts, "
      "and the spaceless codes Bakersfield prints (AGRIB5) count as the state's AGRI B5")

# ── eLumen: a menu of departments, each listing its programs (Cabrillo, S381) ──
# Capture 38432112848 read no program: Cabrillo's menu links departments
# (href="2026-2027/department/accounting", read 38433649784), and each department's
# content call links its programs at 2026-2027/program/<slug> (read 38437381277).
CAB = "https://cabrillo.elumenapp.com/catalog/2026-2027/welcome"
CAB_MENU = ('<a class="navitem small " href="2026-2027/department/accounting" onclick="x">Accounting</a>'
            '<a href="2026-2027/department/art">Art</a><a href="2026-2027/department/accounting">again</a>'
            '<a href="2025-2026/department/old">last year</a>')
CAB_DEPT = {"accounting": '<h2>Accounting</h2><a href="2026-2027/program/accounting-as-fall-2025">A.S.</a>'
                          '<a href="2026-2027/program/bookkeeping-coa-fall-2025">Bookkeeping</a>',
            "art": '<a href="/catalog/2026-2027/program/art-history-aat-fall-2024">AA-T</a>'
                   '<a href="2026-2027/program/accounting-as-fall-2025">shared</a>'}
check(C.el_department_slugs(CAB_MENU, "2026-2027") == ["accounting", "art"],
      "a menu's department links are read once each, in this catalog only")
asked = []


def cab_fetch(reader, url, errors):
    asked.append(url)
    if "publish/content/2026-2027,department," in url:
        return json.dumps({"html": CAB_DEPT[url.split("department,")[1].split("?")[0]]})
    if "publish/content/2026-2027,program," in url:
        slug = url.split("program,")[1].split("?")[0]
        return json.dumps({"html": "<h1>%s</h1><p>Program Requirements ACCT 1A ACCT 1B</p>" % slug})
    return json.dumps({"html": CAB_MENU})


real_fetch, C.el_fetch = C.el_fetch, cab_fetch
try:
    rep = {}
    got_pages = C.el_pages_fast(None, CAB, rep)
finally:
    C.el_fetch = real_fetch
check([g["url"].rsplit("/", 1)[1] for g in got_pages] == ["accounting-as-fall-2025", "bookkeeping-coa-fall-2025", "art-history-aat-fall-2024"]
      and rep["elumen"]["menu_programs"] == 0 and rep["elumen"]["menu_departments"] == 2 and rep["elumen"]["department_programs"] == 3,
      "with no program in the menu, each department's content call lists the programs, each read once: %s %s"
      % ([g["url"] for g in got_pages], rep.get("elumen")))
check(sum(1 for u in asked if ",department," in u) == 2 and sum(1 for u in asked if ",program," in u) == 3,
      "one call a department and one a program, nothing more")

# ── a program left without a page says why (S381) ──────────────────────────
# Coastline re-read 38429656959: Information Technology A.S.'s own page was read from the
# sitemap, refused, and taken by the link search at coverage 1.0; nothing said which gate.
it = {"control_number": "20378", "title": "Information Technology", "award": "A.S. Degree",
      "closed_list": [{"code": "CST C%d" % n} for n in range(101, 107)]}
own_thin = page(CL + "pathways/x/information-technology/information-technology-as/",
                "Information Technology, Associate of Science Degree", "Information Technology A.S. CST C101")
nm = C.near_miss(it, [own_thin, page(CL + "pathways/x/art/", "Art", "ART C100")])
check(nm and nm["url"].endswith("information-technology-as/") and nm["why"].startswith("coarse net") and nm["net"] == 1
      and nm["listed"] == 6 and nm["label"] == {"award": 1, "title": 1.0},
      "a program's own page that names too few of its courses is named, with the gate that refused it: %s" % nm)
# The address names the program (so the label does); the heading names another program.
other = hidden_page(CL + "pathways/x/information-technology/photography-aa/", "Photography, Associate of Arts", "Photography A.A.")
other["content"] = other["got"]["content"] = " ".join("CST C%d" % n for n in range(101, 107))
other["codes"] = C.page_codes(other["content"])
nm2 = C.near_miss(it, [other])
check(nm2 and nm2["why"].startswith("hidden text only"), "a page read from hidden text alone, its heading naming another program: %s" % nm2)
check(C.near_miss(it, [page(CL + "pathways/x/art/", "Art", "ART C100")]) == {"why": "no page read names the program"},
      "with no page naming the program, it says so")
check(C.near_miss(dict(it, closed_list=[]), [own_thin]) is None, "a program with no listed course has no near miss")

# ── the coarse net reads a hidden Requirements tab (S382) ───────────────────
# Capture-only run 38438077425: 98 of Coastline's 106 not-found programs were refused by
# the coarse net. Page read 38443044852: Building Codes Inspector A.S. shows its Overview
# alone (1,080 characters); its courses sit in a hidden Requirements tab, and textContent
# runs each code into the cell before it, so no code token has a word boundary.
bci = {"control_number": "20372", "title": "Building Codes Inspector", "award": "A.S. Degree",
       "closed_list": [{"code": "BCI C%d" % n} for n in (100, 101, 102, 103, 104, 105, 106, 107, 108, 111)]}
bci_req = "Requirements\nCourse\tTitle\tUnits\n" + "\n".join(
    "BCI C%d\tCode Course %d\t3" % (n, n) for n in (100, 101, 102, 103, 104, 105, 106, 107, 108, 111))
bci_glued = ("Building Codes Inspector, Associate of Science DegreeOVERVIEWREQUIREMENTSCoastline's Building Codes "
             "Inspector program (BCI) is a comprehensive building codes program.CourseTitleUnits"
             + "".join("BCI C%dCode Course %d3" % (n, n) for n in (100, 101, 102, 103, 104, 105, 106, 107, 108, 111)))
bci_got = {"title": "Building Codes Inspector, Associate of Science Degree < Coastline College",
           "h1": "Building Codes Inspector, Associate of Science Degree",
           "body": "Building Codes Inspector, Associate of Science Degree\nOVERVIEW\nREQUIREMENTS\n"
                   "Coastline's Building Codes Inspector program (BCI) is a comprehensive building codes program.",
           "content": bci_glued,
           "tabPanels": [{"label": "REQUIREMENTS", "id": "requirementstextcontainer", "text": bci_req}]}
bci_page = {"url": CL + "pathways/law-safety/building-codes-inspector/building-codes-inspector-as/",
            "title": bci_got["title"], "h1": bci_got["h1"], "body": bci_got["body"], "content": bci_got["content"],
            "got": bci_got}
check(not ({"BCIC100", "BCIC101"} & C.page_codes(bci_got["body"] + "\n" + bci_got["content"])),
      "textContent runs each code into the cell before it, so the old net read none of them")
check(C.page_net(bci_got) >= {P.norm_code(c["code"]) for c in bci["closed_list"]},
      "the net reads the hidden Requirements tab cell by cell and names all ten listed courses")
bci_page["codes"] = C.page_net(bci_got)
bc = C.choose_page(bci, [bci_page])
check(bc is not None and bc["field"] == "innerText+tabs" and bc["coverage"] == 1.0,
      "the program's own page is accepted from its visible text and its tab: %s" % ((bc["field"], bc["coverage"]) if bc else None,))
check(C.near_miss(bci, [dict(bci_page, codes=C.page_codes(bci_got["body"] + "\n" + bci_got["content"]))])["why"]
      .startswith("coarse net"), "with the old net the same page is refused at the coarse net (the run's near miss)")
cap_src = open(os.path.join(ROOT, "kb", "_program_requirements_college.py")).read()
check('"codes": page_net(got)' in cap_src, "the capture loop builds each page's net with page_net()")
nm3 = C.near_miss(bci, [dict(bci_page, codes=set(), got=dict(bci_got, error="Execution context was destroyed"))])
check(nm3["error"] == "Execution context was destroyed" and nm3["chars"]["content"] == len(bci_glued)
      and nm3["chars"]["tabs"] > 0 and nm3["tab_panels"] == [["REQUIREMENTS", len(bci_req)]],
      "a near miss files what the capture held for the page: its script error, its text sizes, its tab panels")

# ── eLumen: a menu of program and award hubs (Modesto, Palo Verde, S383) ──
# Reads 38445240921 and 38446053107 (S382): Modesto's menu links no program or department,
# only Programs A-Z (2026-2027/programs) and Programs by Type (bytype); Palo Verde's links
# award categories (2025-2026/adt, associate-of-arts-degrees, certificate-of-achievements,
# non-credit-certificates). Each hub links its programs at <catalog>/program/<slug>.
MJC = "https://mjc.elumenapp.com/catalog/2026-2027/mjc-ge"
MJC_MENU = ('<a href="2026-2027/mjc-ge">General Education</a><a href="2026-2027/programs">Programs A-Z</a>'
            '<a href="2026-2027/bytype">Programs by Type</a><a href="2026-2027/academic-calendar">Calendar</a>'
            '<a href="2026-2027/programs">again</a><a href="2025-2026/programs">last year</a>')
MJC_HUB = {"programs": '<a href="2026-2027/program/agriculture-as-fall-2026">Agriculture</a>'
                       '<a href="2026-2027/program/welding-coa-fall-2026">Welding</a>',
           "bytype": '<a href="/catalog/2026-2027/program/welding-coa-fall-2026">Welding</a>'
                     '<a href="2026-2027/program/nursing-adn-fall-2026">Nursing</a>'}
check(C.el_hub_slugs(MJC_MENU, "2026-2027") == ["programs", "bytype"],
      "a menu's hub links are read once each, in this catalog only, never an ordinary page")
check(C.el_hub_slugs('<a href="2025-2026/adt">ADT</a><a href="2025-2026/associate-of-arts-degrees">AA</a>'
                     '<a href="2025-2026/certificate-of-achievements">CA</a><a href="2025-2026/non-credit-certificates">NC</a>'
                     '<a href="2025-2026/presidents-welcome">Welcome</a>', "2025-2026")
      == ["adt", "associate-of-arts-degrees", "certificate-of-achievements", "non-credit-certificates"],
      "Palo Verde's award categories read as hubs; its welcome page does not")
check(C.el_hub_slugs(CAB_MENU, "2026-2027") == [] and C.el_hub_slugs(MJC_HUB["programs"], "2026-2027") == [],
      "a department link or a program link is never taken for a hub")
asked = []


def mjc_fetch(reader, url, errors):
    asked.append(url)
    for h in MJC_HUB:
        if "publish/content/2026-2027,%s?" % h in url:
            return json.dumps({"html": MJC_HUB[h]})
    if "publish/content/2026-2027,program," in url:
        slug = url.split("program,")[1].split("?")[0]
        return json.dumps({"html": "<h1>%s</h1><p>Program Requirements AG 101 WELD 1</p>" % slug})
    return json.dumps({"html": MJC_MENU})


real_fetch, C.el_fetch = C.el_fetch, mjc_fetch
try:
    rep = {}
    got_pages = C.el_pages_fast(None, MJC, rep)
finally:
    C.el_fetch = real_fetch
check([g["url"].rsplit("/", 1)[1] for g in got_pages] == ["agriculture-as-fall-2026", "welding-coa-fall-2026", "nursing-adn-fall-2026"]
      and rep["elumen"]["menu_programs"] == 0 and rep["elumen"]["menu_departments"] == 0
      and rep["elumen"]["menu_hubs"] == ["programs", "bytype"] and rep["elumen"]["hub_programs"] == 3,
      "with no program or department in the menu, each hub's content call lists the programs, each read once: %s %s"
      % ([g["url"] for g in got_pages], rep.get("elumen")))
check(sum(1 for u in asked if ",programs?" in u or ",bytype?" in u) == 2 and sum(1 for u in asked if ",program," in u) == 3,
      "one call a hub and one a program, nothing more")

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
