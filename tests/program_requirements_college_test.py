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
import glob
import json
import os
import re
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
# A program printed under its department or discipline (S444, page read 39698876304):
# the page names no program in its path, and its Degrees tab holds the lists.
DEPTS = ["https://catalog.sierracollege.edu/departments/psychology/",
         "https://catalog.miracosta.edu/disciplines/gerontology/",
         "https://catalog.sierracollege.edu/departments/"]
check(C.program_candidates(DEPTS[:1], "https://catalog.sierracollege.edu/") == DEPTS[:1]
      and C.program_candidates(DEPTS[1:2], "https://catalog.miracosta.edu/") == DEPTS[1:2],
      "a department or discipline page is a program candidate")
check(C.program_candidates(DEPTS[2:], "https://catalog.sierracollege.edu/") == [],
      "the department index itself is not")

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
# A hand-filed catalog (Sam, 2026-10-17): read only with its provenance, and only when the bytes match it.
import gzip, hashlib  # noqa: E401,E402
_hf = tempfile.mkdtemp()
_was = C.HAND_FILED_DIR
C.HAND_FILED_DIR = _hf
try:
    check(C.hand_filed("De Anza College") is None, "no provenance record, no hand-filed read")
    body = b"%PDF-1.4 a catalog"
    with open(os.path.join(_hf, "de_anza.pdf.gz"), "wb") as fh:
        fh.write(gzip.compress(body))
    meta = {"college": "De Anza College", "url": "https://www.deanza.edu/catalog/x.pdf",
            "fetched_by": "Sam Lee", "fetched_at": "2026-10-17", "file": "de_anza.pdf.gz",
            "sha256": hashlib.sha256(body).hexdigest()}
    json.dump(meta, open(os.path.join(_hf, "de_anza.json"), "w"))
    got = C.hand_filed("De Anza College")
    check(got and got.get("data") == body and not got.get("error"), "a matching .pdf.gz reads, unzipped")
    json.dump(dict(meta, sha256="0" * 64), open(os.path.join(_hf, "de_anza.json"), "w"))
    got = C.hand_filed("De Anza College")
    check("sha256" in (got or {}).get("error", "") and "data" not in got, "a file that differs from its record is refused")
    check(C.read_hand_filed(got)["access"] == "hand_filed_refused" and C.read_hand_filed(got)["pages"] == [],
          "a refused hand-filed file reads as no pages")
    json.dump({k: v for k, v in meta.items() if k != "fetched_by"}, open(os.path.join(_hf, "de_anza.json"), "w"))
    check("fetched_by" in C.hand_filed("De Anza College").get("error", ""), "a record must say who fetched the file")
    # A release copy (S406): the session cannot fetch it, so the runner's first read pins its hash.
    os.remove(os.path.join(_hf, "de_anza.pdf.gz"))
    copies = {"https://github.com/user-attachments/files/1/dac.pdf": body,
              "https://github.com/user-attachments/files/2/add.pdf": b"%PDF-1.4 an addendum"}
    _fetch = C.fetch_copy
    C.fetch_copy = lambda u: copies[u]
    rel = {k: v for k, v in meta.items() if k not in ("file", "sha256")}
    rel.update(copy_url="https://github.com/user-attachments/files/1/dac.pdf",
               addenda=[{"title": "Spring 2026 addendum", "url": "https://www.deanza.edu/catalog/add.pdf",
                         "copy_url": "https://github.com/user-attachments/files/2/add.pdf"}])
    json.dump(rel, open(os.path.join(_hf, "de_anza.json"), "w"))
    check("sha256" in C.hand_filed("De Anza College").get("error", ""), "an unpinned copy is not read")
    check(C.pin("De Anza College", "123") == 0, "pin fetches the copy and its addenda")
    pinned = json.load(open(os.path.join(_hf, "de_anza.json")))
    check(pinned["sha256"] == hashlib.sha256(body).hexdigest() and pinned["pinned_run"] == "123"
          and pinned["addenda"][0]["sha256"] == hashlib.sha256(copies["https://github.com/user-attachments/files/2/add.pdf"]).hexdigest(),
          "the pin records each copy's sha256 and the run that fixed it")
    got = C.hand_filed("De Anza College")
    check(got and got.get("data") == body, "a pinned copy reads from its copy_url")
    copies["https://github.com/user-attachments/files/1/dac.pdf"] = b"%PDF-1.4 another file"
    check(C.pin("De Anza College", "124") == 0 and json.load(open(os.path.join(_hf, "de_anza.json")))["pinned_run"] == "123",
          "a pinned hash is never re-pinned")
    check("sha256" in C.hand_filed("De Anza College").get("error", ""), "a copy that changed after its pin is refused")
    C.fetch_copy = _fetch
    check(C.pin("Nowhere College", None) == 0, "pin is a no-op without a record")
finally:
    C.HAND_FILED_DIR = _was
    shutil.rmtree(_hf)
check("hf = hand_filed(college)" in open(os.path.join(ROOT, "kb", "_program_requirements_college.py")).read(),
      "the capture asks for a hand-filed catalog before any read")

# An own-HTML catalog keeps to its own year's path (Skyline, run 39024299478, S404).
sky = "https://catalog.skylinecollege.edu/current/"
SKY = [sky + "programs/biology-as/", "https://catalog.skylinecollege.edu/1718/programs/biology-as/"]
check(C.year_scope(sky, "custom_html") == "/current/"
      and C.program_candidates(SKY, sky, C.year_scope(sky, "custom_html")) == SKY[:1],
      "an own-HTML catalog's sitemap keeps to its own path")
check(C.year_scope(sky, "courseleaf") is None and C.year_scope("https://catalog.x.edu/", "custom_html") is None
      and C.year_scope("https://canadacollege.edu/catalogschedule/", "custom_html") is None,
      "the year scope is own-HTML only, and none where the address names no year")
check(C.year_scope("https://coalingacollege.edu/catalog/2026-2027/", "custom_html") == "/catalog/2026-2027/"
      and C.year_scope("https://catalog.skylinecollege.edu/1718/", "custom_html") == "/1718/",
      "the year scope runs through the year segment")
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

# A page whose label names no award but whose text heads a section for each sibling's
# award is shared (Foothill's Accounting A.A. and certificate, capture 38675242638, S443).
FH = "Accounting\nAssociate in Arts Degree in Accounting\nACTG 1A ACTG 1B\nCertificate of Achievement in Accounting\nACTG 1A ACTG 67"
check(C.section_award(FH, {"award": "A.A. Degree", "title": "Accounting"}) == "aa" and
      C.section_award(FH, {"award": "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units",
                           "title": "Accounting"}) == "coa",
      "a section heading names the award and the title together, on one line")
# Two adjacent lines head a section (page read 39704788066, S444): Sierra prints the title
# then "AS Degree"; MiraCosta "Certificate of Achievement" then the title.
SIERRA_IT = ("Certificates of Achievement\n• Information Technology—Cloud Computing (https://catalog.sierracollege.edu/"
             "departments/infotech/#cloudcoa)\nSkills Certificates\nInformation Technology - Cloud Computing\nAS Degree\n"
             + "Successful completion of the curriculum in Cloud Computing prepares students to advance their careers. " * 2)
check(C.section_award(SIERRA_IT, {"award": "A.S. Degree", "title": "Information Technology - Cloud Computing"}) == "as",
      "Sierra's title line then 'AS Degree' heads the A.S. section")
check(C.section_award(SIERRA_IT, {"award": "A.S. Degree", "title": "Information Technology - Cybersecurity"}) is None,
      "another program's title does not borrow that heading")
MC_HORT = ("Total Units 26-28 · Certificate of Achievement · Nursery/Horticulture Crop Production · Course Requirements · "
           "Total Units 25 · Certificate of Achievement · Pest Control Adviser")
coa = "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"
check(C.section_award(MC_HORT, {"award": coa, "title": "Pest Control Adviser"}) == "coa"
      and C.section_award(MC_HORT, {"award": coa, "title": "Nursery/Horticulture Crop Production"}) == "coa",
      "MiraCosta's 'Certificate of Achievement' then the title heads each certificate")
check(C.section_award(MC_HORT, {"award": "A.S. Degree", "title": "Pest Control Adviser"}) is None,
      "a certificate's heading is never an A.S. section")
check(C.section_award("Psychology courses meet requirements as degree electives", {"award": "A.S. Degree", "title": "Psychology"}) is None,
      "'as degree' inside a sentence is not Sierra's award line")
check(C.section_award("Associate in Arts in Anthropology for Transfer", {"award": "A.A. Degree", "title": "Anthropology"}) is None and
      C.section_award("Anthropology A.A.-T", {"award": "A.A. Degree", "title": "Anthropology"}) is None,
      "an A.A. does not read an A.A.-T section as its own")
check(C.section_award("Students who complete the Certificate of Achievement in Accounting may continue to the "
                      "Associate in Arts degree, which adds general education and electives totaling ninety units",
                      {"award": "A.A. Degree", "title": "Accounting"}) is None,
      "a paragraph that mentions the award is no section heading")

# Foothill's own shape (page read run 39657323731): a generic degree heading, the award named
# only in the Award Type(s) line, and the page read's " · " joins.
PH = ("Photography · On This Page · Program Description\nAward Type(s) · AA = Associate in Arts Degree · "
      "CA = Certificate of Achievement · Units Required\nAssociate Degree Requirements\nA minimum of 90 units\n"
      "Certificate Requirements · Certificate of Achievement in Photography · Units: 24\n"
      "Certificate of Achievement in Photography Criticism")
check(C.section_award(PH, {"award": "A.A. Degree", "title": "Photography"}, 1.0) == "aa" and
      C.section_award(PH, {"award": "Certificate of Achievement: 18 or greater", "title": "Photography"}, 1.0) == "coa",
      "Foothill's generic degree heading and award line, and its certificate heading, each head a section")
check(C.section_award(PH, {"award": "A.A. Degree", "title": "Photography"}, 0.5) is None and
      C.section_award(PH, {"award": "A.S. Degree", "title": "Photography"}, 1.0) is None,
      "the generic heading serves only a degree the award line names, on a page whose label names its title")
check(C.section_award("AA-T = Associate in Arts for Transfer\nAssociate Degree Requirements",
                      {"award": "A.A. Degree", "title": "Photography"}, 1.0) is None,
      "an award line naming the transfer degree serves no A.A.")


def sclaim(award, title, section, cov=1.0):
    c = claim(award, title, cov)
    c["label"]["section"] = section
    return c


check(C.page_winners([("06014", sclaim(0, 1.0, "aa")), ("19477", sclaim(0, 1.0, "coa"))]) == {"06014", "19477"},
      "a page heading a section for each claimant's award goes to both (Foothill's Accounting)")
check(C.page_winners([("06014", sclaim(0, 1.0, "aa")), ("19477", sclaim(0, 1.0, None))]) in ({"06014"}, {"19477"}),
      "one section heading alone does not share the page")
check(C.page_winners([("02260", sclaim(0, 1.0, "aa")), ("32355", sclaim(1, 1.0, "adt"))]) == {"32355"},
      "a page whose label names a claimant's award keeps the label's rule")
check(C.page_winners([("33205", sclaim(0, 1.0, "adt", .83)), ("18358", sclaim(0, 1.0, "aa", 1.0)),
                      ("35877", sclaim(0, 0.0, "as", .667))]) == {"33205", "18358"},
      "a hub that lists a degree it does not name, holding two thirds of its courses, is no section for it (Golden West's Physics)")
check(C.page_winners([("06027", sclaim(0, 1.0, "as")), ("20101", sclaim(0, 0.0, "coa", 1.0))]) == {"06027", "20101"},
      "a certificate the label does not name keeps its section when the page carries its courses (Foothill's Cloud Computing)")
check(C.page_winners([("1", sclaim(0, 1.0, "aa")), ("2", sclaim(0, 0.5, "aa")), ("3", sclaim(0, 1.0, "coa"))]) == {"1", "3"},
      "within one award, the title the page names more fully keeps its section")

# MiraCosta's Horticulture page as the capture reads it (capture view 39718674469, S445): the
# Degrees tab lists each degree by title and names no course; the Certificates tab heads each
# certificate "Certificate of Achievement" then the title. Grouped by award alone, the page went
# to the one A.A. whose title shares "Horticulture" with the page heading.
MC_DEG = ("[Tab: DEGREES]\nAssociate Degrees\nAssociate in Arts Degrees\nLandscape Architecture\n"
          "Sustainable Landscape and Turf Management\nNursery/Horticulture Crop Production\n"
          "Associate in Science Degrees\nPest Control Adviser\nSustainable Agriculture\nViticulture and Enology\n"
          "Students may earn one of the above-named associate degrees by completing a certificate of "
          "achievement and the general education courses required for MiraCosta College's Associate in "
          "Arts degree (see Associate Degrees).")
MC_CERT = ("[Tab: CERTIFICATES]\nCertificates\nCertificate of Achievement\nLandscape Architecture\n"
           "This certificate is designed to provide employable technical skill training in the field of "
           "professional residential landscape design development.\nRequired courses:\nHORT 127\tLandscape Design\t3\n"
           "HORT 230\tLandscape Architecture\t3\nTotal Units\t26-28\nCertificate of Achievement\n"
           "Nursery/Horticulture Crop Production\nThis certificate provides students with the practical, hands-on "
           "experience they need to pursue employment in the areas of plant production.\nHORT 144\tNursery Management "
           "and Production\t3\nTotal Units\t25\nCertificate of Achievement\nSustainable Landscape and Turf Management\n"
           "HORT 121\tSustainable Landscape and Turf Management\t3\nTotal Units\t24\nCertificate of Achievement\n"
           "Pest Control Adviser\nHORT 115\tSoil Science\t3")
MC_TEXT = "Horticulture\nOVERVIEW\nDEGREES\nCERTIFICATES\nCOURSES\n\n" + MC_DEG + "\n\n" + MC_CERT
coa16 = "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"
la, nur, slt = ("Landscape Architecture", "Nursery/Horticulture Crop Production",
                "Sustainable Landscape and Turf Management")
got = {t: C.section_match(MC_TEXT, {"award": coa16, "title": t}) for t in (la, nur, slt)}
check(all(k == "coa" and fit == 1.0 for k, _, fit in got.values()) and len({h for _, h, _ in got.values()}) == 3,
      "each MiraCosta certificate reads its own heading, the title naming every one of its words")
check(C.section_match(MC_TEXT, {"award": "A.A. Degree", "title": slt}) ==
      ("aa", "sustainable landscape and turf management", 1.0),
      "a degree the Degrees tab lists by title reads its certificate's section (certificate plus general education)")
check(C.section_match(MC_TEXT, {"award": "A.S. Degree", "title": "Sustainable Agriculture"})[0] is None,
      "a listed degree whose certificate the page does not head has no section here")
check(C.section_match(MC_TEXT.replace("by completing a certificate", "by completing the coursework"),
                      {"award": "A.A. Degree", "title": slt})[0] is None,
      "a degree list reads as the certificate's section only where the page says the degree is the certificate")
check(C.section_match("Certificate of Achievement\nSupply Chain Management\nBUS 101",
                      {"award": coa16, "title": "Supply Chain Management (SCM)"})[0] == "coa",
      "a title's parenthesized acronym may be missing from its heading")
SIERRA_TWO = ("Information Technology - Cloud Computing\nAS Degree\nCIS 1\nInformation Technology\nAS Degree\nCIS 2")
check(C.section_match(SIERRA_TWO, {"award": "A.S. Degree", "title": "Information Technology"})[1:] ==
      ("information technology as degree", 1.0),
      "of two headings naming every title word, the program reads the one that is its own")


def hclaim(title, section, line, fit, cov=1.0):
    c = sclaim(0, title, section, cov)
    c["label"].update(section_line=line, section_fit=fit)
    return c


check(C.page_winners([("07862", hclaim(.25, "coa", "certificate of achievement nursery/horticulture crop production", 1.0)),
                      ("21979", hclaim(0.0, "coa", "certificate of achievement landscape architecture", 1.0)),
                      ("21974", hclaim(0.0, "coa", "certificate of achievement sustainable landscape and turf management", 1.0)),
                      ("36418", claim(0, 0.0))]) == {"07862", "21979", "21974"},
      "a page heading a section per certificate goes to each certificate, and not to a claimant it heads none for")
check(C.page_winners([("1", hclaim(0.0, "as", "information technology - cloud computing as degree", .5)),
                      ("2", hclaim(0.0, "as", "information technology - cloud computing as degree", 1.0)),
                      ("3", hclaim(0.0, "coa", "certificate of achievement cloud computing", 1.0))]) == {"2", "3"},
      "two claimants reading one heading: the title naming more of the heading's words keeps it")
check(C.page_winners([("1", hclaim(0.0, "coa", "certificate of achievement a", 1.0)),
                      ("2", hclaim(0.0, "coa", "certificate of achievement b", 1.0), )]) == {"1", "2"} and
      len(C.page_winners([("1", hclaim(0.0, "coa", "certificate of achievement a", 1.0)),
                          ("2", claim(0, 0.0))])) == 1,
      "two headings share a page within one award; one heading alone still does not")
check(C.page_winners([("1", hclaim(0.0, "coa", "certificate of achievement a", 1.0, cov=.6)),
                      ("2", hclaim(0.0, "coa", "certificate of achievement b", 1.0, cov=.6))]) in ({"1"}, {"2"}),
      "a heading counts only for a claimant the page carries SECTION_COVERAGE of, or whose title the label names")

# MiraCosta's Computer Studies, Child Development and Psychology pages (page read 39732553097, S445).
CSIT = ("[Tab: DEGREES]\nAssociate Degrees\nAssociate in Science Degrees\nArtificial Intelligence\nCybersecurity\n"
        "Information Technology\nStudents may earn one of the above-named associate degrees by completing its respective "
        "certificate of achievement requirements and the general education courses required for MiraCosta College's "
        "Associate in Science degree (see Associate Degrees).\n\n[Tab: CERTIFICATES]\nCertificates\n"
        "Certificate of Achievement\nArtificial Intelligence\nCSIT 101\tIntro\t3\nTotal Units\t25\n"
        "Certificate of Achievement\nCybersecurity\nCSIT 145\tSecurity\t3\nTotal Units\t26\n"
        "Certificate of Achievement\nInformation Technology\nCSIT 110\tSupport\t3")
check(C.section_match(CSIT, {"award": coa16, "title": "Cyber Security"})[1:] == ("certificate of achievement cybersecurity", 1.0),
      "a certificate titled in two words reads the heading that runs them together")
check(C.section_match(CSIT, {"award": "A.S. Degree", "title": "Cyber Security"}) == ("as", "cybersecurity", 1.0)
      and C.section_match(CSIT, {"award": "A.S. Degree", "title": "Information Technology"})[1] == "information technology",
      "'by completing its respective certificate of achievement' makes each listed degree read its certificate's section")
CDEV = ("[Tab: DEGREES]\nAssociate Degrees\nAssociate in Arts Degrees\nChild Development Associate Teacher\n"
        "Child Development Master Teacher\nChild Development Teacher\nStudents may earn one of the above-named associate "
        "degrees by completing a certificate of achievement and the general education courses required for MiraCosta "
        "College's Associate in Arts degree (see Associate Degrees).\nAssociate in Arts Degree\n"
        "Child and Adolescent Development for Transfer\nStudents completing this associate degree will have completed "
        "lower-division major preparation requirements for a child and adolescent development degree.\n"
        "CDEV C1000\tChild Growth and Development\t3\n[Tab: CERTIFICATES]\nCertificate of Achievement\n"
        "Child Development Associate Teacher\nCDEV 106\tObservation\t3\nCertificate of Achievement\n"
        "Child Development Teacher\nCDEV 115\tCurriculum\t3")
cdt = C.section_match(CDEV, {"award": "A.A. Degree", "title": "Child Development Teacher"})
cdat = C.section_match(CDEV, {"award": "A.A. Degree", "title": "Child Development Associate Teacher"})
check(cdt == ("aa", "child development teacher", 1.0) and cdat[1] != cdt[1] and cdat[2] == 1.0,
      "a listed degree reads its own list line, never a neighbor's pair that holds all its words")
check(C.section_match(CDEV, {"award": "A.A- T Degree", "title": "Child and Adolescent Development"})[:1] == ("adt",),
      "'Associate in Arts Degree' then 'Child and Adolescent Development for Transfer' heads the transfer degree")
PSY = ("Associate in Arts Degree\nPsychology\nPSYC C1000\tIntro\t3\nTotal Units\t19-20\n"
       "Associate in Arts Degree\nPsychology for Transfer\nPSYC C1000\tIntro\t3")
check(C.section_match(PSY, {"award": "A.A. Degree", "title": "Psychology"})[1] == "associate in arts degree psychology"
      and C.section_match(PSY, {"award": "A.A- T Degree", "title": "Psychology"})[1] ==
      "associate in arts degree psychology for transfer",
      "the local A.A. and the transfer degree each read their own two-line heading")

pt = P.hidden_tabs_text({"tabPanels": [{"label": "DEGREES", "text": MC_DEG.split("\n", 1)[1]},
                                       {"label": "Search", "text": "Search the whole catalog by keyword or title"}]})
check(pt.startswith("[Tab: DEGREES]\nAssociate Degrees") and "Search the whole" not in pt,
      "a tab naming no course stays when it says its degrees are certificates plus general education")

# Palomar heads a page serving a degree and its certificate "... - A.S. Degree Major/Cert.
# Achievement": the certificate reads its award there too, and both keep the page (S445).
PAL = "https://palomar.curriqunet.com/catalog/alias/college/iq/CreditPrograms/Alphabetical/"
PAL_GC = page(PAL + "GraphicCommunications-AS-CA",
              "Graphic Communications - A.S. Degree Major/Cert. Achievement (18 units or more)",
              "GC 100 GC 101 GC 102 GC 103")
gc_list = [{"code": "GC %d" % i} for i in (100, 101, 102, 103)]
gc_as = {"control_number": "05195", "title": "Graphic Communications", "award": "A.S. Degree", "closed_list": gc_list}
gc_coa = dict(gc_as, control_number="22510",
              award="Certificate of Achievement: 18  or greater semester(or 27  or greater quarter) u")
gc_mgmt = dict(gc_coa, control_number="22521", title="Graphic Communications: Emphasis in Management")
check(C.label_score(PAL_GC, gc_coa)[0] == 1 and C.label_score(PAL_GC, gc_as)[0] == 1,
      "'Cert. Achievement' names the certificate, as 'A.S. Degree' names the degree")
gpal = C.assign([gc_as, gc_coa, gc_mgmt], [PAL_GC])
check(gpal["05195"]["best"] is not None and gpal["22510"]["best"] is not None and gpal["22521"]["best"] is None,
      "Palomar's degree and its certificate share their page; a longer title the heading does not name does not")

# Grossmont addresses a degree and its certificate on one page, law-enforcement-as-certificate-achievement:
# one major list, then the certificate as "only the courses required for the above major" (page read
# 39750446541, S446). The address names both awards, so each degree keeps its page beside its certificate.
GRO = "https://catalog.gcccd.edu/grossmont/associate-degree-programs-certificates/social-behavioral-sciences/"
AOJ = "AOJ-110 AOJ-200 AOJ-202 AOJ-204 AOJ-230 AOJ-240"
GRO_LE = page(GRO + "law-enforcement-as-certificate-achievement/",
              "Law Enforcement Associate in Science and Certificate of Achievement", AOJ + " AOJ-120 AOJ-122")
GRO_CO = page(GRO + "corrections-as-certificate-achievement/",
              "Corrections Associate in Science and Certificate of Achievement", AOJ + " AOJ-144 AOJ-208")
le_list = [{"code": c} for c in AOJ.split() + ["AOJ-120", "AOJ-122"]]
co_list = [{"code": c} for c in AOJ.split() + ["AOJ-144", "AOJ-208"]]
le_as = {"control_number": "05029", "title": "Law Enforcement", "award": "A.S. Degree", "closed_list": le_list}
le_coa = dict(le_as, control_number="21410", award="Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units")
co_as = dict(le_as, control_number="05030", title="Corrections", closed_list=co_list)
co_coa = dict(co_as, control_number="21407", award=le_coa["award"])
check(getattr(C, "slug_awards", lambda u: set())(GRO_LE["url"]) == {"as", "coa"}
      and C.slug_awards(GRO + "arabic-aa-certificate-achievement/") == {"aa", "coa"}
      and C.slug_awards(GRO + "pastry-cook-cert-achievement/") == set() and C.slug_awards(GRO + "x-certificate-achievement/") == {"coa"},
      "a degree-and-certificate address names both awards; a certificate's address names the certificate")
gro = C.assign([le_as, le_coa, co_as, co_coa], [GRO_LE, GRO_CO])
check(all(gro[cn]["best"] is not None for cn in ("05029", "21410", "05030", "21407"))
      and gro["05029"]["best"]["url"] == GRO_LE["url"] and gro["05030"]["best"]["url"] == GRO_CO["url"],
      "Grossmont's degree and its certificate share their page, and each degree reads its own")

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
# A loser's fallback must name it, carry most of its courses, or head its section (S445: Sierra's
# Mathematics A.S.-T lost eleven pages and ended on the Nursing page at coverage 0.50).
PGF = [page(start + "departments/mathematics/", "Mathematics", "Mathematics MATH 1 MATH 2 MATH 3 MATH 4"),
       page(start + "departments/nursing/", "Nursing", "Nursing NURS 1 MATH 1 MATH 2")]
mprog = {"control_number": "31226", "title": "Mathematics", "award": "A.S. Degree",
         "closed_list": [{"code": "MATH %d" % i} for i in (1, 2, 3, 4)]}
mrival = dict(mprog, control_number="45833", award="A.A. Degree")
gf = C.assign([mprog, mrival], PGF)
won = [cn for cn in gf if gf[cn]["best"]]
lose = [cn for cn in gf if not gf[cn]["best"]]
check(len(won) == 1 and gf[won[0]]["best"]["url"].endswith("mathematics/") and len(lose) == 1
      and gf[lose[0]]["lost"] == [PGF[0]["url"]],
      "a program that lost its page falls back to no page rather than one that neither names it nor carries most of its courses")
gs = C.assign([mprog], PGF[1:])
check(gs["31226"]["best"] is not None and gs["31226"]["best"]["url"].endswith("nursing/"),
      "a program that lost nothing still reads its only candidate (the guard is for fallbacks)")
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
check({"HORT1F", "HORT164F"} <= C.page_codes("HORT 001 F · Principles of Horticulture I\t4 · HORT 164 F\nPlant ID"),
      "the code net reads NOCCCD's campus letter written as its own word (HORT 001 F), as the state's file stores it")
check({P.norm_code(c) for c in ("CNA/N 621", "KIN/D 130A", "MATH/N 600")}
      <= C.page_codes("CNA/N 621 Nursing Assistant Theory\nKIN/D 130A Jazz Dance I\tMATH/N 600"),
      "the code net reads a subject with a slash (CNA/N 621), as the state's file stores it: %r"
      % sorted(C.page_codes("CNA/N 621 Nursing Assistant Theory")))
check({"ESLN601", "CNAN626"} <= C.page_codes("ESL/N 601 Beginning ESL\nCNA/N 626 Home Health Aide Clinical"),
      "the code net also reads the slash-free form the state's file sometimes stores (ESLN601 for ESL/N 601)")

# ── curriQunet: the catalog's own JSON (S357) ──────────────────────────────
print("curriQunet")
check(C.cq_catalog_id(["https://rccd.curriqunet.com/Content/x.css",
                       "https://rccd.curriqunet.com/Catalog/_getActiveCatalogById/124"]) == 124
      and C.cq_catalog_id(["https://x.curriqunet.com/Catalog/_getNavigation?id=88&navigationtypeId=1"]) == 88
      and C.cq_catalog_id(["https://x.edu/"]) is None,
      "the catalog id comes from the calls the start page's scripts made")
# Page read 38942920358 (S399): Berkeley City's and Butte's start pages ask
# _getNavigation?id=0 first, then name the catalog. Taking the 0 walked an empty catalog.
check(C.cq_catalog_id(["https://bcc.curriqunet.com/catalog/_getNavigation?id=0&navigationtypeId=1",
                       "https://bcc.curriqunet.com/catalog/_getCatalogs",
                       "https://bcc.curriqunet.com/catalog/_getNavigation?id=10327&navigationtypeId=1",
                       "https://bcc.curriqunet.com/catalog/_getPage?catalogId=10327&id=40258"]) == 10327
      and C.cq_catalog_id(["https://butte.curriqunet.com/Catalog/_getCatalogs",
                           "https://butte.curriqunet.com/Catalog/_getNavigation?id=0&navigationtypeId=1",
                           "https://butte.curriqunet.com/Catalog/_getNavigation?id=14&navigationtypeId=1"]) == 14
      and C.cq_catalog_id(["https://x.curriqunet.com/catalog/_getNavigation?id=0&navigationtypeId=1"]) is None,
      "an id of 0 is a placeholder the start page asks first, never the catalog (Berkeley City 10327, Butte 14)")
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
               {"control_number": "4", "source": {"url": "w"}, "coverage": 1.0, "codes_found": ["D1"]},
              {"control_number": "5", "source": {"url": "y#page=237"}, "coverage": 1.0, "codes_found": ["E1"]}],
              open(os.path.join(_wx, "sources.json"), "w"))
    open(os.path.join(_wx, "records", "1.json"), "w").write(json.dumps({"record": {"blocks": []}, "source_url": "u"}))
    # S411: a reconcile run filed the fresh sources (page 237) beside the record it did not move (page 236).
    open(os.path.join(_wx, "records", "5.json"), "w").write(
        json.dumps({"record": {"blocks": []}, "source_url": "y#page=236"}))
    # S361: a call that ran past max_tokens filed its row with no record; the next read asks again.
    open(os.path.join(_wx, "records", "4.json"), "w").write(
        json.dumps({"record": None, "error": "the record ran past max_tokens"}))
    wx = C.would_extract("X", [
        {"control_number": "1", "source": {"url": "u"}, "coverage": 1.0, "codes_found": ["A1"], "text": "t"},
        {"control_number": "2", "source": {"url": "v"}, "coverage": 0.9, "codes_found": ["B1"], "text": "t"},
        {"control_number": "3", "source": None, "coverage": 0.0, "codes_found": [], "text": ""},
        {"control_number": "4", "source": {"url": "w"}, "coverage": 1.0, "codes_found": ["D1"], "text": "t"},
        {"control_number": "5", "source": {"url": "y#page=237"}, "coverage": 1.0, "codes_found": ["E1"], "text": "t"}],
        folder=_wx)
    check(wx["kept"] == 1 and wx["programs"] == 3 and [x["control_number"] for x in wx["list"]] == ["2", "4", "5"]
          and wx["list"][0]["was_method"] == "not_found",
          "a capture names the programs an extraction would send to the model (an errored record among them, and "
          "one filed from another page than its source names), and keeps the rest: %r" % wx)
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
# Santa Ana writes the award after a colon (page read 38749570529, S395): its 27 of 359
# entries were the dashed titles; "Accounting: A.S. Degree" was walked as a department.
check(C.cq_is_program({"text": "Accounting: A.S. Degree", "haschildbodynavs": True})
      and C.cq_is_program({"text": "Certificate of Professional Accounting - Accounting Study & Ethics: Certificate of Achievement (Transcripted)"})
      and C.cq_is_program({"text": "Science Degree - Astronomy Emphasis: A.S. Degree"})
      and C.cq_is_program({"text": "Welding Technology: Certificate of Achievement"})
      and not C.cq_is_program({"text": "Accounting", "haschildbodynavs": True})
      and not C.cq_is_program({"text": "Degrees and Certificates: Explained"})
      and not C.cq_is_program({"text": ": A.S. Degree"}),
      "cq_is_program reads an award after the last colon (Santa Ana), never a department or an explainer")

# Butte (S401, page reads 38977301962 and 38977912351): the award leads before " in "
# under Programs by Subject and closes the title in parentheses under Programs by
# Communities of Interest; its walk took 18 entries for 168 programs.
BUTTE_ENTRIES = ["AS Degree in Automotive Technology", "Certificate of Achievement in Diesel Technology",
                 "Registered Nursing (AS Degree)", "Kinesiology (AA-T Degree)", "Para Education (Certificate)",
                 "Early Childhood Education (Noncredit Certificate of Completion)",
                 "Film, Television & Electronic Media (AS-T Degree)",
                 "Automotive Technology - Honda, Professional Automotive Career Training (PACT) (AS Degree)"]
BUTTE_NAV = ["AUT-Automotive Technology", "Programs by Subject", "Programs by Communities of Interest",
             "Health & Public Services", "Academic Program Types and Requirements", "General Studies",
             "Degrees and Certificates in Business", "Associate Degree for Transfer (ADT)", "(AS Degree)"]
check(all(C.cq_is_program({"text": t, "haschildbodynavs": True}) for t in BUTTE_ENTRIES)
      and not any(C.cq_is_program({"text": t, "haschildbodynavs": True}) for t in BUTTE_NAV),
      "cq_is_program reads an award before \" in \" or in closing parentheses (Butte), never a subject, "
      "a community, a plural list or a bare award: %r"
      % ([t for t in BUTTE_ENTRIES if not C.cq_is_program({"text": t})]
         + [t for t in BUTTE_NAV if C.cq_is_program({"text": t})]))
# Las Positas (S401, page read 38982439886): the award after the name's last comma;
# only the 20 whose names also carry a colon were taken (20 of 201, run 38979338956).
LPC_ENTRIES = ["Liberal Arts & Sciences: Mathematics and Science, Associate of Arts (AA)",
               "Biology, Associate in Science for Transfer (AS-T)", "Accounting Technician, Certificate of Achievement",
               "Welding Technology, AS", "Theatre Arts, AA-T", "Biology, A.S. Degree"]
LPC_NAV = ["Film, Television & Electronic Media", "Business, General", "Degrees, Certificates & Programs of Study",
           "Departments, Degrees & Certificates", "Programs of Study", "Art, Associated Students",
           "Electives, as approved", "Spanish, AAA"]
check(all(C.cq_is_program({"text": t}) for t in LPC_ENTRIES)
      and not any(C.cq_is_program({"text": t}) for t in LPC_NAV),
      "cq_is_program reads an award after the last comma (Las Positas), never a name's own comma or a plain word: %r"
      % ([t for t in LPC_ENTRIES if not C.cq_is_program({"text": t})] + [t for t in LPC_NAV if C.cq_is_program({"text": t})]))
check(C.cq_name_award("Liberal Arts & Sciences: Mathematics and Science, Associate of Arts (AA)")
      == ("Liberal Arts & Sciences: Mathematics and Science", "Associate of Arts (AA)"),
      "the comma form names the program and its award")
check(C.cq_name_award("Automotive Technology - Honda, Professional Automotive Career Training (PACT) (AS Degree)")
      == ("Automotive Technology - Honda, Professional Automotive Career Training (PACT)", "AS Degree")
      and C.cq_name_award("Certificate of Achievement in Automotive Technology")
      == ("Automotive Technology", "Certificate of Achievement"),
      "the name keeps its own parentheses; the award is the last pair or the words before \" in \"")
for a, b in (("AS Degree in Automotive Technology", "Automotive Technology (AS Degree)"),
             ("AS Degree in Automotive Technology - Honda, Professional Automotive Career Training (PACT)",
              "Automotive Technology - Honda, Professional Automotive Career Training (PACT) (AS Degree)"),
             ("Certificate of Achievement in Diesel Technology", "Diesel Technology (Certificate of Achievement)")):
    check(C.cq_title_key({"text": a}) == C.cq_title_key({"text": b}),
          "one program's two Butte titles are one key: %r / %r" % (a, b))
check(C.cq_title_key({"text": "AS Degree in Automotive Technology"})
      != C.cq_title_key({"text": "Certificate of Achievement in Automotive Technology"}),
      "a program's degree and certificate stay two keys")
BUTTE = {
    "top": {"navs": [{"id": 25391, "text": "Academic Program Types and Requirements"},
                     {"id": 25398, "text": "Programs by Subject", "haschildbodynavs": True},
                     {"id": 25399, "text": "Programs by Communities of Interest", "haschildbodynavs": True}]},
    "page:25391": {"body": []},
    "page:25398": {"body": [{"navlist": [{"id": 28408}]}]},
    "nav:28408": {"navs": [{"id": 28086, "text": "AUT-Automotive Technology", "haschildbodynavs": True}]},
    "page:28086": {"body": [{"navlist": [{"id": 28059}]}]},
    "nav:28059": {"navs": [{"id": 28225, "text": "AS Degree in Automotive Technology", "haschildbodynavs": True},
                           {"id": 28226, "text": "Certificate of Achievement in Automotive Technology",
                            "haschildbodynavs": True}]},
    "page:25399": {"body": [{"navlist": [{"id": 28409}]}]},
    "nav:28409": {"navs": [{"id": 28167, "text": "Industrial Technologies & Agriculture", "haschildbodynavs": True}]},
    "page:28167": {"body": [{"navlist": [{"id": 27290}]}]},
    "nav:27290": {"navs": [{"id": 28019, "text": "Automotive & Diesel", "haschildbodynavs": True}]},
    "page:28019": {"body": [{"navlist": [{"id": 27310}]}]},
    "nav:27310": {"navs": [{"id": 27919, "text": "Automotive Technology (AS Degree)", "haschildbodynavs": True},
                           {"id": 27923, "text": "Diesel Technology (AS Degree)", "haschildbodynavs": True}]},
}


def butte_get(url):
    q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
    if "navigationtypeId" in q:
        return BUTTE["top"]
    if "parentId" in q:
        return BUTTE.get("nav:" + q["parentId"][0])
    return BUTTE.get("page:" + q["id"][0])


bents, bacct = C.cq_index(butte_get, 14, "https://butte.curriqunet.com")
bdist, bdrop = C.cq_distinct(bents)
check(sorted(e["id"] for e in bents) == [27919, 27923, 28225, 28226] and bacct["nodes_read"] == 6
      and sorted(e["id"] for e in bdist) == [27923, 28225, 28226] and bdrop == 1,
      "Butte's walk takes the entries under both views and reads each program once, the subject view's "
      "title first: %r %r" % ([e["id"] for e in bents], [e["id"] for e in bdist]))
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
# Page read 38942920358 (S399): Gavilan's alias start page lists its active catalogs and
# fetches nothing; _getCatalogs names the year's catalog beside two addenda.
GAVILAN = [{"Id": 19173, "Title": "Fall 2025 Addendum"}, {"Id": 19330, "Title": "Spring 2026 Addendum"},
           {"Id": 19344, "Title": "Gavilan College Catalog 2026-2027"}]
check(C.cq_catalog_from_list(GAVILAN, "Gavilan College", "2026-2027") == 19344
      and C.cq_catalog_from_list([{"Id": 14, "Title": "2026-2027 Butte College Catalog"}], "Butte College", "2026-2027") == 14
      and C.cq_catalog_from_list(GAVILAN, "Gavilan College", "2025-2026") is None
      and C.cq_catalog_from_list([{"Id": 10327, "Title": "2026-27 Catalog"}], "Berkeley City College", "2026-2027") is None,
      "\"Catalog\" in a title is not a word the college's name must hold (Gavilan 19344); a title of the word alone names no college")
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
# S402: a push carries no college input, and the Cerritos fallback read Cerritos on Los Medanos's
# branch (run 38997845641); an [extract] push would have paid for it. Both jobs refuse a run naming none.
check(all("COLLEGE: ${{ github.event.inputs.college }}\n" in j and "|| 'Cerritos College'" not in j
          and j.index("The run names its college") < j.index("actions/checkout") for j in (read_job, load_job)),
      "the read and load jobs name their college from the dispatch alone, and stop first when none is named")
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
      and holders == ["- name: Extract and score",
                      "- name: Load the committed records, unchecked (or replace unchecked rows from the newest run)",
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

    # The re-read (S389; Sam, Open Asks Sheet 78 card 2): only the newest extraction run's records
    # are posted, and the receipt holds each replaced row's before-values, which is the rollback.
    # The failures this guards: posting records an earlier run read (their rows already hold them),
    # and a replace with no way back.
    reposted = []

    def repost(body):
        reposted.append(body)
        return {"replaced_keys": [r["control_number"] for r in body["p_rows"]], "absent_keys": [],
                "held_keys": [], "kept_keys": [],
                "before": [{"control_number": r["control_number"], "record": {"was": True}} for r in body["p_rows"]]}

    C.COLLEGE_DIR, C.RECEIPTS = parent, os.path.join(parent, "receipts")
    try:
        code = C.reread("Cerritos College", "38000000002", post=repost)
        rr = json.load(open(C.reread_receipt_path("Cerritos College", "38000000002")))
    finally:
        C.COLLEGE_DIR, C.RECEIPTS = real
    check(code == 0 and [r["control_number"] for b in reposted for r in b["p_rows"]] == ["00002"]
          and rr["extracted_run"] == "37966828676",
          "a re-read posts only the newest extraction run's records: %r" % rr.get("replaced_keys"))
    check(rr["replaced_keys"] == ["00002"] and rr["before"] == [{"control_number": "00002", "record": {"was": True}}]
          and "checked = false" in rr["rollback"] and "r.extracted_run = 37966828676" in rr["rollback"],
          "the re-read's receipt holds each replaced row's before-values and a rollback guarded by "
          "the re-read's run and checked = false")
    # S422: two reconcile runs in a row leave the first's records stamped with the first run, so
    # the re-read can name a run to post instead of the newest.
    older = sorted({json.load(open(f))["extracted_run"] for f in glob.glob(os.path.join(parent, "cerritos", "records", "*.json"))
                    if json.load(open(f)).get("extracted_run")}, key=int)
    reposted.clear()
    C.COLLEGE_DIR, C.RECEIPTS = parent, os.path.join(parent, "receipts")
    try:
        code_old = C.reread("Cerritos College", "38000000003", post=repost, extracted_run=str(older[0]))
        rr_old = json.load(open(C.reread_receipt_path("Cerritos College", "38000000003")))
        bad = C.reread("Cerritos College", "38000000004", post=repost, extracted_run="latest")
    finally:
        C.COLLEGE_DIR, C.RECEIPTS = real
    check(len(older) > 1 and code_old == 0 and rr_old["extracted_run"] == str(older[0])
          and reposted and all(r["control_number"] != "00002" for b in reposted for r in b["p_rows"]),
          "a re-read naming an earlier run posts that run's records, not the newest's: %r" % older)
    check(bad == 2, "a re-read naming a run that is not a number refuses")
    # Sheet 82 card 1: a confirm the re-read carried over checked its row, so the rollback restores
    # that row too, sets it unchecked, and deletes the carried verdict rows this run wrote.
    cr = C.reread_receipt("Cabrillo College", "38700000000", "38639316727", [], [],
                          [{"replaced_keys": ["06326", "06327"], "carried_keys": ["06326"],
                            "before": [{"control_number": "06326"}, {"control_number": "06327"}]}])
    check(cr["carried"] == 1 and cr["carried_keys"] == ["06326"]
          and "(r.checked = false or r.control_number in ('06326'))" in cr["rollback"]
          and "checked = false, checked_by = null, checked_at = null" in cr["rollback"]
          and "delete from public.program_record_verdicts where college = 'Cabrillo College' and control_number in ('06326')"
              in cr["rollback"] and "re-read run 38700000000 %" in cr["rollback"],
          "a carried confirm's rollback restores its row unchecked and deletes the carried verdict: %s" % cr["rollback"])

    # force=incomplete names the filed records whose arithmetic is incomplete and that place a course.
    rec("00009", score={"coverage": {"pass": True, "placed": 5, "listed": 6}, "invented": {"pass": True},
                        "arithmetic": {"status": "incomplete"}, "pass": False})
    rec("00010", score={"coverage": {"pass": True, "placed": 0, "listed": 6}, "invented": {"pass": True},
                        "arithmetic": {"status": "incomplete"}, "pass": False})
    check(C.forced(tmp, "incomplete, 00001") == {"00009", "00001"} and C.forced(tmp, "") == set(),
          "force=incomplete takes the incomplete records that place a course (never one that read another "
          "program's page), plus any control number named")
finally:
    shutil.rmtree(parent, ignore_errors=True)

# The re-read function (chatbox/supabase_program_requirement_records_college_reread.sql) replaces
# a row only while it is unchecked and from an earlier run (S392: a person's reading no longer holds it), never touches
# checked or display, returns the before-values, and answers the service role alone (Rule 10).
RR = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "chatbox",
                       "supabase_program_requirement_records_college_reread.sql")).read()
RR_BODY = RR.split("function public.program_requirement_records_college_reread(", 1)[1].split("as $$", 1)[1].split("$$;", 1)[0]
check("auth.role(), '') <> 'service_role'" in RR_BODY and "from public, anon, authenticated" in RR
      and "to service_role" in RR,
      "the re-read function answers the service role alone, in its body and in its grants")
check("elsif cur.checked then" in RR_BODY
      and "cur.extracted_run >= new_run" in RR_BODY and "and checked = false;" in RR_BODY,
      "the re-read holds a checked row only (S392: a rerun is the fix a reviewer's Needs a fix or confirm "
      "waits on), keeps a row from the same or a newer run, and its UPDATE is guarded by checked = false")
inserts = re.findall(r"insert into\s+([\w.]+)", RR_BODY, re.I)
check(inserts == ["public.program_record_verdicts"] and "delete from" not in RR_BODY.lower()
      and "display =" not in RR_BODY and "checked_by =" not in RR_BODY and "checked =" not in RR_BODY.replace("checked = false", ""),
      "the re-read never deletes or writes checked, checked_by or display, and its one insert is a carried "
      "confirm in program_record_verdicts: %r" % inserts)
# Sheet 82 card 1 ("carry", Sam, 2026-10-14): the confirm carries over only when it was given on the
# record being replaced and the posted record keeps every block and every other program field.
carry = RR_BODY.split("Sheet 82 card 1", 1)[1].split("update public.program_requirement_records", 1)[0]
check("v.verdict = 'confirm'" in carry and "v.requirements_fp = public.program_record_fp(cur.record)" in carry
      and "program_record_carry_basis(r->'record') = public.program_record_carry_basis(cur.record)" in carry
      and "'confirm'" in carry and "v.by_email" in carry and "program_record_machine_pass(r->'checks')" in carry
      and "carried := carried ||" in carry and "'carried_keys', to_jsonb(carried)" in RR_BODY,
      "the carry needs the latest verdict to be a confirm of the replaced record and an equal basis, "
      "writes the confirm in the reviewer's name with the new record's checks, and reports the carried keys")
BASIS = RR.split("function public.program_record_carry_basis", 1)[1].split("$$;", 1)[0]
check(all("- '%s'" % k in BASIS for k in ("outcomes", "careers", "total_units", "degree_total", "ge_units",
                                          "ge_pattern", "open_elective_units", "degree_elective_units",
                                          "electives_fill_degree", "degree_total_minimum",
                                          "total_units_minimum"))
      and BASIS.count("- '") == 11 and "'blocks',  coalesce(rec->'blocks'" in BASIS and "md5" not in BASIS
      and "program_record_carry_basis(jsonb) from public, anon, authenticated" in RR,
      "the carry basis leaves out exactly the totals, the degree's figures, outcomes and careers, keeps every "
      "block, compares as jsonb (3 and 3.0 alike), and is closed to the API roles")
steps_fields = {st["field"] for c in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb",
                "program_requirements_reconcile.json")))["colleges"].values() for st in c["steps"]}
check(all("- '%s'" % f in BASIS for f in steps_fields),
      "every field a college's reconcile steps fill or clear is one a confirm carries across: %s" % sorted(steps_fields))
VF = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "chatbox",
                       "supabase_program_record_verdicts.sql")).read()
check("- 'outcomes' - 'careers',\n    'blocks',  coalesce(rec->'blocks', '[]'::jsonb))::text);" in VF,
      "program_record_fp is unchanged, so every stored verdict keeps matching its record (Sheet 82 card 1)")
check("'before', before" in RR_BODY, "the re-read returns each replaced row's before-values")

# ── the reconcile step on filed records (S392; Sam, 2026-10-14) ───────────────
# A capture read the pages again; each filed record with fresh text is reconciled by the
# college's steps and rescored, and one that changed carries the run so step=reread posts it.
rcd = tempfile.mkdtemp()
try:
    keep, outd = os.path.join(rcd, "keep"), os.path.join(rcd, "out")
    os.makedirs(os.path.join(keep, "records")); os.makedirs(os.path.join(outd, "sources"))
    filed = {"college": "Cabrillo College", "control_number": "06326", "award": "A.S. Degree", "extracted_run": 38442109713,
             "record": {"program": {"total_units": {"min": 30, "max": 30}, "measure": "units"},
                        "blocks": [{"name": "Major", "rule": "all", "courses": [{"code": "ASTRO 3", "units": 30}]}]},
             "score": {"arithmetic": {"status": "equal", "against": "program"}}}
    other = dict(filed, control_number="06999")
    for f in (filed, other):
        json.dump(f, open(os.path.join(keep, "records", f["control_number"] + ".json"), "w"))
    json.dump({"control_number": "06326", "award": "A.S. Degree", "closed_list": [{"code": "ASTRO 3", "units": 30}],
               "text": "at least 30 units in the major.\nProgram Requirements\nAstronomy - Associate in Science (A.S.)\n"
                       "Complete the following number of credits: 60\nCabrillo College General Education 24\n"
                       "General electives: any transferable or degree applicable course. 6"},
              open(os.path.join(outd, "sources", "06326.json"), "w"))
    C.reconcile_filed("Cabrillo College", outd, "38700000000", keep)
    got = json.load(open(os.path.join(outd, "records", "06326.json")))
    kept_r = json.load(open(os.path.join(outd, "records", "06999.json")))
    check(got["extracted_run"] == 38700000000 and got["read_run"] == 38442109713
          and [n["field"] for n in got["reconciled"]] == ["degree_total", "ge_units", "total_units", "open_elective_units"]
          and got["score"]["arithmetic"]["against"] == "degree" and got["score"]["arithmetic"]["status"] == "equal",
          "reconcile: a filed record with fresh text is reconciled, rescored (30 + 6 + GE 24 = 60) and stamped with the run")
    check(kept_r["extracted_run"] == 38442109713 and "reconciled" not in kept_r,
          "reconcile: a filed record with no fresh page is filed again as it was")
    # A record the steps leave alone but the scorer now reads differently carries the run too,
    # or step=reread keeps the loaded row's old checks (LA City and Pierce, S403: 0 replaced).
    json.dump({"control_number": "06999", "award": "A.S. Degree", "closed_list": [{"code": "ASTRO 3", "units": 30}],
               "text": "Astronomy\nASTRO 3 Stars 30"}, open(os.path.join(outd, "sources", "06999.json"), "w"))
    C.reconcile_filed("Cabrillo College", outd, "38700000001", keep)
    rs = json.load(open(os.path.join(outd, "records", "06999.json")))
    check("reconciled" not in rs and rs["score"] != other["score"] and rs["extracted_run"] == 38700000001
          and rs["read_run"] == 38442109713,
          "reconcile: a record rescored with no reconcile step is stamped with the run, so step=reread posts it")
    # A fresh page other than the one the record was extracted from says nothing about it (S403).
    json.dump(dict(other, source_url="https://x.edu/c.pdf#page=4"),
              open(os.path.join(keep, "records", "06999.json"), "w"))
    json.dump({"control_number": "06999", "award": "A.S. Degree", "closed_list": [{"code": "ASTRO 3", "units": 30}],
               "source": {"url": "https://x.edu/c.pdf#page=9"}, "text": "Astronomy\nASTRO 3 Stars 30"},
              open(os.path.join(outd, "sources", "06999.json"), "w"))
    C.reconcile_filed("Cabrillo College", outd, "38700000002", keep)
    mv = json.load(open(os.path.join(outd, "records", "06999.json")))
    check(mv["score"] == other["score"] and mv["extracted_run"] == 38442109713,
          "reconcile: a record whose fresh page moved is filed again as it was, never rescored on the other page")
finally:
    shutil.rmtree(rcd, ignore_errors=True)

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

# Lake Tahoe (S401): the menu links 16 transfer degrees AND its departments; the read
# stopped at the menu's programs (16 of 83, run 38978047103). Every source adds now.
LT = "https://ltcc.elumenapp.com/catalog/2026-2027/about-this-catalog"
LT_MENU = ('<a href="2026-2027/program/sociology-aa-t-fall-2025">Sociology AA-T</a>'
           '<a href="2026-2027/department/program-art">Art</a><a href="2026-2027/department/program-business">Business</a>'
           '<a href="2026-2027/financial-aid">Financial Aid</a>')
LT_DEPT = {"program-art": '<a href="2026-2027/program/studio-arts-aa-t-fall-2025">AA-T</a>'
                          '<a href="2026-2027/program/art-aa-fall-2025">Art AA</a>',
           "program-business": '<a href="2026-2027/program/accounting-coa-fall-2025">Accounting</a>'}
asked = []


def lt_fetch(reader, url, errors):
    asked.append(url)
    if ",department," in url:
        return json.dumps({"html": LT_DEPT[url.split("department,")[1].split("?")[0]]})
    if ",program," in url:
        return json.dumps({"html": "<h1>x</h1><p>Program Requirements SOC 101</p>"})
    return json.dumps({"html": LT_MENU})


real_fetch, C.el_fetch = C.el_fetch, lt_fetch
try:
    rep = {"with_closed_list": 5}
    got_pages = C.el_pages_fast(None, LT, rep)
finally:
    C.el_fetch = real_fetch
check([g["url"].rsplit("/", 1)[1] for g in got_pages] == ["sociology-aa-t-fall-2025", "studio-arts-aa-t-fall-2025",
                                                          "art-aa-fall-2025", "accounting-coa-fall-2025"]
      and rep["elumen"]["menu_programs"] == 1 and rep["elumen"]["department_programs"] == 4
      and "walk_pages" not in rep["elumen"],
      "a menu's programs and its departments' programs both count, and 4 of 5 is no shortfall to walk: %s %s"
      % ([g["url"] for g in got_pages], rep.get("elumen")))

# Los Medanos (S401): departments are pages under the catalog (26-27/art, and two down,
# 26-27/childdevelopment/earlychildhoodeducation), listed on 26-27/degrees, which only
# courses's own full call names (its menu opened around it; its content call holds no
# link). From the Art start page the read found Art's 7 of 97 (run 38982485062).
LMC = "https://lmc.elumenapp.com/catalog/26-27/art"
LMC_SHELL = ('<a href="26-27/welcome">Welcome</a><a class="x" href="26-27/courses"><span>Program Requirements, '
             'Courses</span></a><a href="26-27/art">Art</a><a href="26-27/program/fine-arts-aa-fall-2026">Fine Arts AA</a>'
             '<a href="26-27/course/art003">ART 003</a>')
LMC_PAGES = {
    "welcome": "<p>Welcome to LMC</p>",
    "courses": "<p>Topics in this section</p>",
    "understanding": "<p>How to read a course</p>",
    "degrees": '<a href="26-27/art">Art</a><a href="26-27/biology">Biology</a>'
               '<a href="26-27/childdevelopment/earlychildhoodeducation">ECE</a><a href="26-27/welding">Welding</a>',
    "biology": '<a href="26-27/program/biology-as-t-fall-2026">AS-T</a><a href="/catalog/26-27/program/biology-as-fall-2026">AS</a>',
    "childdevelopment,earlychildhoodeducation": '<a href="26-27/program/ece-ca-fall-2026">CA</a>',
    "welding": '<a href="26-27/program/welding-coa-fall-2026">COA</a><a href="26-27/metals">deeper</a>',
}
LMC_COURSES_MENU = LMC_SHELL + ('<a href="26-27/understanding">Understanding Course Descriptions</a>'
                                '<a href="26-27/degrees">Degrees, Certificates &amp; Programs of Study</a>')
asked = []


def lmc_fetch(reader, url, errors):
    asked.append(url)
    if ",program," in url:
        return json.dumps({"html": "<h1>x</h1><p>Program Requirements BIOL 1</p>"})
    if "publish/content/26-27," in url:
        return json.dumps({"html": LMC_PAGES.get(url.split("26-27,", 1)[1].split("?")[0], "")})
    if "publish/26-27,courses?" in url:
        return json.dumps({"html": LMC_COURSES_MENU})
    return json.dumps({"html": LMC_SHELL})


real_fetch, C.el_fetch = C.el_fetch, lmc_fetch
try:
    rep = {"with_closed_list": 6}
    got_pages = C.el_pages_fast(None, LMC, rep)
finally:
    C.el_fetch = real_fetch
walked = [u.split("26-27,", 1)[1].split("?")[0] for u in asked if "publish/content/26-27," in u and ",program," not in u]
menus = [u.split("26-27,", 1)[1].split("?")[0] for u in asked if "/publish/26-27," in u and ",art?" not in u]
check(sorted(g["url"].rsplit("/", 1)[1] for g in got_pages) == sorted(["fine-arts-aa-fall-2026", "biology-as-t-fall-2026",
                                                                       "biology-as-fall-2026", "ece-ca-fall-2026",
                                                                       "welding-coa-fall-2026"])
      and rep["elumen"]["walk_programs"] == 4 and rep["elumen"]["walk_menus"] == 1 and not rep["elumen"]["walk_stopped_at_cap"],
      "short of the closed lists, the walk reads a hub's own menu and the departments its topic lists: %s %s"
      % ([g["url"] for g in got_pages], rep.get("elumen")))
check(walked == ["courses", "degrees", "welcome", "understanding", "biology", "childdevelopment,earlychildhoodeducation", "welding"]
      and menus == ["courses"],
      "hub-like pages go first, a hub that names nothing in its content is read once more through its full call, "
      "and a department two segments down is read: %r %r" % (walked, menus))
check("art" not in walked and "metals" not in walked and not any("course," in w or "course/" in w for w in walked),
      "the start page is never read again, a page four steps down is never read, nor a course: %r" % walked)
check(C.el_page_links('<a href="2026-2027/program/x">P</a><a href="2026-2027/course/y">C</a>'
                      '<a href="2026-2027/department/z">D</a><a href="2026-2027/a/b/c">Deep</a><a href="2026-2027/ok">Ok</a>',
                      "2026-2027") == [("ok", "Ok")],
      "a program, course or department page is never a page to walk, nor one three segments down")
# Los Medanos (S402, page read 38997368468): courses's own topic list writes its links whole,
# with the host and a fragment, so the relative-only pattern never saw degrees (7 of 97 found,
# run 38986123746). These are the raw links the full call printed.
LMC_PAGENAV = ('<pagenav>\n\t<ul>\n\t<li><a href="https://lmc.elumenapp.com/catalog/26-27/understanding#mainContent">'
               'Understanding Course Descriptions</a></li>\n\t<li><a href="https://lmc.elumenapp.com/catalog/26-27/'
               'guidelinesonunits#mainContent">Guidelines on Units of Credit</a></li>\n\n \n\n\t<li><a href="https://'
               'lmc.elumenapp.com/catalog/26-27/degrees#mainContent">Degrees, Certificates &amp; Programs of Study</a></li>'
               '<li><a href="https://lmc.elumenapp.com/catalog/26-27/childdevelopment/earlychildhoodeducation#mainContent">'
               '&gt; catalog</a></li><li><a href="https://other.elumenapp.com/catalog/26-27/degrees">Elsewhere</a></li>')
check(C.el_page_links(LMC_PAGENAV, "26-27", "lmc.elumenapp.com") ==
      [("understanding", "Understanding Course Descriptions"), ("guidelinesonunits", "Guidelines on Units of Credit"),
       ("degrees", "Degrees, Certificates &amp; Programs of Study"), ("childdevelopment/earlychildhoodeducation", "&gt; catalog")],
      "a link written whole on the catalog's own host, ending in a fragment, is a page to walk; "
      "another host's catalog never is: %r" % C.el_page_links(LMC_PAGENAV, "26-27", "lmc.elumenapp.com"))
check(C.el_page_links(LMC_PAGENAV, "26-27") == [],
      "with no host named, only relative and /catalog/ links count")
check(C.el_program_slugs('<a href="https://lmc.elumenapp.com/catalog/26-27/program/art-history-aa-t#mainContent">A</a>'
                         '<a href="26-27/program/studio-arts-aa-t?x=1">S</a><a href="/catalog/26-27/program/ceramics">C</a>'
                         '<a href="https://other.elumenapp.com/catalog/26-27/program/elsewhere">E</a>',
                         "26-27", "lmc.elumenapp.com") == ["art-history-aa-t", "studio-arts-aa-t", "ceramics"],
      "a program link may be relative, rooted or whole on the host, with a query or a fragment; another host's is not taken")
check(C.el_department_slugs('<a href="https://ccc.elumenapp.com/catalog/2026-2027/department/art#mainContent">Art</a>',
                            "2026-2027", "ccc.elumenapp.com") == ["art"]
      and C.el_hub_slugs('<a href="https://mjc.elumenapp.com/catalog/2026-2027/programs#mainContent">A-Z</a>',
                         "2026-2027", "mjc.elumenapp.com") == ["programs"],
      "department and hub links written whole on the host count as the relative ones do")

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

# ── Acalog (S389): the catalog the start page serves, its program pages, its program menus ──
# Palo Verde 2026-27, El Camino and San Joaquin Delta read Acalog (Modern Campus). The
# failures this guards: an archived catalog's id from the catalog picker taken for the
# current one, another catalog's program read as this one's, and a program read twice.
ELC = "http://catalog.elcamino.edu/"
ELC_LINKS = [{"text": "Programs", "href": "https://catalog.elcamino.edu/content.php?catoid=21&navoid=1001"},
             {"text": "Courses", "href": "https://catalog.elcamino.edu/content.php?catoid=21&navoid=1002"},
             {"text": "Degrees and Certificates", "href": "https://catalog.elcamino.edu/content.php?catoid=21&navoid=1003"},
             {"text": "Home", "href": "https://catalog.elcamino.edu/index.php?catoid=21"},
             {"text": "2025-2026 Catalog [ARCHIVED]", "href": "https://catalog.elcamino.edu/index.php?catoid=19"},
             {"text": "Financial Aid", "href": "https://www.elcamino.edu/aid?catoid=19"},
             {"text": "Accounting, A.S.", "href": "https://catalog.elcamino.edu/preview_program.php?catoid=21&poid=4410&returnto=1001"},
             {"text": "Accounting, A.S. (again)", "href": "https://catalog.elcamino.edu/preview_program.php?catoid=21&poid=4410&returnto=1003"},
             {"text": "Art History, AA-T", "href": "/preview_program.php?catoid=21&poid=4423"},
             {"text": "Last year's Accounting", "href": "https://catalog.elcamino.edu/preview_program.php?catoid=19&poid=3999"}]
check(C.ac_catoid(ELC_LINKS, ELC) == 21,
      "the catalog the start page serves is the id its own links carry most, never an archived one in the picker")
check(C.ac_catoid([], ELC) is None, "a page whose links name no catalog id names none")
check(C.ac_base(ELC, ELC_LINKS) == "https://catalog.elcamino.edu"
      and C.ac_base(ELC, [{"href": "http://catalog.elcamino.edu/content.php?catoid=13&navoid=886"}]) == "http://catalog.elcamino.edu"
      and C.ac_base("https://catalog.deltacollege.edu/") == "https://catalog.deltacollege.edu",
      "an Acalog host is read over the scheme its own links use (El Camino serves http only), else the start's")
check(C.ac_program_urls(ELC_LINKS, C.ac_base(ELC, ELC_LINKS), 21) ==
      ["https://catalog.elcamino.edu/preview_program.php?catoid=21&poid=4410&print",
       "https://catalog.elcamino.edu/preview_program.php?catoid=21&poid=4423&print"],
      "each of this catalog's programs is read once, as its print-friendly page, and another catalog's never")
check(C.ac_program_navs(ELC_LINKS, C.ac_base(ELC, ELC_LINKS), 21) ==
      ["https://catalog.elcamino.edu/content.php?catoid=21&navoid=1001",
       "https://catalog.elcamino.edu/content.php?catoid=21&navoid=1003"],
      "the navigation pages read for programs are those named programs, degrees or certificates")

asked_ac = []


def ac_load(reader, url, cache, spa):
    asked_ac.append(url)
    if "sitemap.php" in url:
        return {"access": "refused", "status": 404, "links": []}
    if "navoid=1001" in url:
        return {"access": "ok", "status": 200, "links": ELC_LINKS[6:9]}
    if "navoid=1003" in url:
        return {"access": "ok", "status": 200,
                "links": [{"text": "Biology, A.S.", "href": "https://catalog.elcamino.edu/preview_program.php?catoid=21&poid=4500"}]}
    return {"access": "ok", "status": 200, "links": ELC_LINKS}


real_load, C.P.load = C.P.load, ac_load
try:
    rep_ac = {"with_closed_list": 10}
    ac_got = C.ac_urls(None, ELC, {}, rep_ac)
finally:
    C.P.load = real_load
check([u.split("poid=")[1] for u in ac_got] == ["4410&print", "4423&print", "4500&print"]
      and rep_ac["acalog"]["catoid"] == 21 and rep_ac["acalog"]["sitemap_programs"] == 0
      and rep_ac["acalog"]["navs_read"] == 2 and [n["links"] for n in rep_ac["acalog"]["navs"]] == [3, 1],
      "with no site map, the program menus list the programs, each once: %s %s" % (ac_got, rep_ac.get("acalog")))
check(any("sitemap.php?catoid=21" in u for u in asked_ac) and not any("catoid=19" in u for u in asked_ac),
      "the site map is tried first, and only for the catalog the start page serves")
check(rep_ac["acalog"]["catalog_year_read"] is None and rep_ac["acalog"].get("catalog_menu_error"),
      "a reader that cannot run the menu script reads no year, and says why")

# The year of the catalog being read (S391): San Joaquin Delta's registry row names none.
MENU = [["22", "2026-2027 Catalog", False], ["21", "2025-2026 Catalog", True],
        ["19", "2024-2025 Catalog [ARCHIVED CATALOG]", False]]
check(C.ac_catalog_year(MENU, 21) == ("2025-2026", "catalog menu"),
      "the menu's option for the catoid read names the year, never the newest year the menu lists")
check(C.ac_catalog_year([[o[0], o[1], o[0] == "22"] for o in MENU], 99) == ("2026-2027", "catalog menu"),
      "a catoid the menu does not list takes the option the menu has selected")
check(C.ac_catalog_year([["14", "Summer 2026 - Summer 2027 College Catalog", True],
                         ["13", "2025-2026 San Joaquin Delta College Catalog [ARCHIVED CATALOG]", False]], 14)
      == ("2026-2027", "catalog menu")
      and C.ac_catalog_year([["14", "Fall 2026 - Spring 2028 Catalog", True]], 14) == (None, None),
      "a catalog named by its terms (San Joaquin Delta, run 38615275825) reads as its academic year; "
      "two years apart read as none")
check(C.ac_catalog_year([["21", "Current Catalog", True]], 21, "2025-2026 Catalog | Delta") == ("2025-2026", "page title")
      and C.ac_catalog_year([], 21, "San Joaquin Delta College") == (None, None),
      "with no year in the menu the page title is read, and a title naming none gives none")


class MenuPage:
    def __init__(self, options):
        self.options = options

    def evaluate(self, js):
        return self.options if "select" in js else None


class MenuReader:
    def __init__(self, options):
        self.page = MenuPage(options)


real_load, C.P.load = C.P.load, ac_load
try:
    rep_menu = {"with_closed_list": 10}
    C.ac_urls(MenuReader(MENU), ELC, {}, rep_menu)
finally:
    C.P.load = real_load
check(rep_menu["acalog"]["catalog_year_read"] == "2025-2026" and rep_menu["acalog"]["catalog_year_from"] == "catalog menu"
      and rep_menu["acalog"]["catalog_menu"][0] == ["22", "2026-2027 Catalog", False],
      "the capture report keeps the year read from the start page's catalog menu, and the menu itself: %s" % rep_menu["acalog"])
CS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb", "_program_requirements_college.py")).read()
check("reg = dict(reg, catalog_year=read_year)" in CS and 'report["catalog_year"] = read_year' in CS,
      "an Acalog year read from the page fills a registry row that names none, in the records and the report alike")
check('platform not in ("courseleaf", "curriqunet", "elumen", "acalog", "custom_html", "smartcatalog", "coursedog")' in CS
      and 'platform not in ("curriqunet", "elumen", "acalog")' in CS,
      "the capture reads Acalog, without the child-page walk or the link search its program list makes needless")
# S404: a college's own HTML catalog takes the sitemap road, with the child-page walk and the link search.
check('else:\n            scope = district_scope(start' in CS and '"custom_html"' in CS.split('def capture(')[1].split('delay = ')[0],
      "the capture reads an own-HTML catalog (custom_html) through the sitemap, its children and the link search")

# A dropped connection is tried again (S401: Las Positas's two ECONNRESETs left
# 20 of 201 found; Butte's three left nodes unread). A status is never retried.
class FlakyResp:
    def __init__(self, status, body):
        self.status, self.ok, self.body = status, 200 <= status < 300, body

    def json(self):
        return self.body


class FlakyRequest:
    def __init__(self, script):
        self.script, self.asked = list(script), 0

    def get(self, url, timeout=None):
        self.asked += 1
        step = self.script.pop(0)
        if isinstance(step, Exception):
            raise step
        return step


class FlakyReader:
    def __init__(self, script):
        self.request, self.delay, self.loads = FlakyRequest(script), 0, 0

    def _robots_for(self, url):
        return None


RESET = Exception("APIRequestContext.get: socket hang up (ECONNRESET)\nCall log: ...")
fr = FlakyReader([RESET, FlakyResp(200, {"navs": [{"id": 1}]})])
ferr = []
got = C.cq_json(fr, "https://x.curriqunet.com/Catalog/_getNavigation?id=14&parentId=26098", ferr)
check(got == {"navs": [{"id": 1}]} and fr.loads == 2 and len(ferr) == 1 and "tried again" in ferr[0],
      "a reset call is made again and its answer kept, the reset noted: %r %r" % (got, ferr))
fr = FlakyReader([RESET] * (C.CQ_RETRIES + 1))
ferr = []
check(C.cq_json(fr, "https://x.curriqunet.com/a", ferr) is None and fr.loads == C.CQ_RETRIES + 1
      and "tried again" not in ferr[-1],
      "a host that resets every time is asked CQ_RETRIES more times, then the error is final")
for final in (FlakyResp(404, None), Exception("Timeout 60000ms exceeded")):
    fr = FlakyReader([final, FlakyResp(200, {})])
    ferr = []
    check(C.cq_json(fr, "https://x.curriqunet.com/b", ferr) is None and fr.loads == 1,
          "an HTTP status or another error is final, never retried: %r" % ferr)

# ── a whole-catalog PDF (S403): the program's own page, not its course descriptions ──
# Sixteen colleges publish one PDF. A one-subject program's codes fill the
# course-description pages too, often more of them than the program page names;
# the page that carries the program's title words wins, and the pages after it
# join while they still name its codes.
PDF_COURSES = [{"code": "WELD 101"}, {"code": "WELD 102"}, {"code": "WELD 150"}, {"code": "WELD 201"}]
PDF_PAGES = [
    "Welcome to the college. Table of contents.",
    "Welding Technology\nCertificate of Achievement\nRequired courses WELD 101 Intro WELD 102 Gas",
    "WELD 150 Blueprint reading\nTotal units 18",
    "General education requirements",
    "Course descriptions\nWELD 101 Intro 3 units WELD 102 Gas 3 units WELD 150 Blueprint 2 units WELD 201 Pipe 3 units",
]
prog = {"title": "Welding Technology", "award": "Certificate of Achievement"}
check(C.pdf_program_pages(PDF_PAGES, prog, PDF_COURSES) == [1, 2],
      "the titled program page and the page its table runs onto, never the description page: %r"
      % C.pdf_program_pages(PDF_PAGES, prog, PDF_COURSES))
b = C.pdf_best("https://x.edu/catalog.pdf", PDF_PAGES, prog, PDF_COURSES, "pypdf")
check(b and b["url"] == "https://x.edu/catalog.pdf#page=2" and b["pages"] == [2, 3]
      and abs(b["coverage"] - 0.75) < 1e-9 and "[page 2]" in b["text"],
      "a PDF source names its first page in the address and every page it read: %r" % (b and b["url"]))
check(C.pdf_program_pages(PDF_PAGES, {"title": "Pipe Fitting", "award": None}, PDF_COURSES) == [4],
      "with no page carrying the title words, the pilot's picker reads the most codes")
check(C.pdf_best("https://x.edu/c.pdf", ["no codes here"], prog, PDF_COURSES, None) is None,
      "a PDF naming no listed course gives no source")
check(C.is_pdf_catalog({"catalog_format": "single_pdf", "catalog_url": "https://x.edu/Cat%202026.PDF"})
      and not C.is_pdf_catalog({"catalog_format": "single_pdf", "catalog_url": "https://www.ccsf.edu/catalog"})
      and not C.is_pdf_catalog({"catalog_format": "pdf_by_section", "catalog_url": "https://x.edu/a.pdf"}),
      "only a registry row naming one PDF file reads as a whole-catalog PDF")

# ── the East LA session's signals, folded into #2189's reader (S403) ──
# A catalog PDF prints each subject's course descriptions, which name an A.S.'s
# courses too, and prints the certificate after the A.S. with the same list. The
# heading that names the title and the award decides; the text opens on it.
AC_COURSES = [{"code": c} for c in ("ACCT 101", "ACCT 102", "ACCT 210", "BUS 120")]
AC_PAGES = [
    "Course Descriptions\nAccounting\nACCT 101 Financial Accounting 4 units\nACCT 102 Managerial "
    "Accounting 4 units\nACCT 210 Cost Accounting 3 units\nACCT 220 Tax 3 units",
    "Welcome to the college",
    "Business Administration, A.A.\nBUS 100 Intro 3\nBUS 120 Law 3",
    "Accounting, Associate in Science\nRequired courses\nACCT 101 Financial Accounting 4\n"
    "ACCT 102 Managerial Accounting 4\nACCT 210 Cost Accounting 3\nBUS 120 Business Law 3\nTotal 14",
    "Accounting Certificate of Achievement\nACCT 101 4\nACCT 102 4\nACCT 210 3\nBUS 120 3",
]
as_ = C.pdf_best("https://x.edu/c.pdf", AC_PAGES, {"title": "Accounting", "award": "A.S. Degree"}, AC_COURSES, "pypdf")
check(as_ and as_["pages"][0] == 4 and as_["named"] and as_["coverage"] == 1.0
      and as_["text"].startswith("[page 4]\nAccounting, Associate in Science"),
      "the A.S. opens on its own heading, not the course descriptions: %r" % (as_ and as_["pages"]))
check(C.pdf_program_pages(AC_PAGES, {"title": "Accounting", "award": "Certificate of Achievement"}, AC_COURSES) == [4],
      "the certificate printed after the A.S. takes its own page")
toc = ["Contents\nAccounting, Associate in Science ........ 4\nACCT 101 ACCT 102 ACCT 210 BUS 120"] + AC_PAGES[1:]
check(C.pdf_program_pages(toc, {"title": "Accounting", "award": "A.S. Degree"}, AC_COURSES)[0] == 3,
      "a contents line with a dot leader names no program")

# ── the award's letters before the title (S419): Cañada prints "AS Business Assistant", then
# "CA Business Assistant" with the same courses a few pages on. Without the letters read as the
# award, both pages scored alike and the earlier one won, so the certificate's extraction was
# handed the A.S. section and placed no listed course (11 of Cañada's 73 records).
CN_COURSES = [{"code": c} for c in ("ACTG 121", "BUS 100", "BUS 101", "BUS 103", "BUS 401", "CBOT 432", "CBOT 435")]
CN_PAGES = [
    "Business\nAS Business Assistant\nThe degree prepares students for office work.\nACTG 121 Financial Accounting 4\n"
    "BUS 100 Introduction to Business 3\nBUS 101 Human Relations 3\nBUS 103 Business Communication 3\n"
    "BUS 401 Business Law 3\nCBOT 432 Word Processing 3\nCBOT 435 Spreadsheets 3\nACTG 200 Managerial Accounting 4\nTotal 27",
    "As the student completes the Business Assistant courses, the sequence below applies.\nBUS 100 fall\nBUS 101 spring",
    "CA Business Assistant\nACTG 121 Financial Accounting 4\nBUS 100 Introduction to Business 3\nBUS 101 Human Relations 3\n"
    "BUS 103 Business Communication 3\nBUS 401 Business Law 3\nCBOT 432 Word Processing 3\nCBOT 435 Spreadsheets 3\nTotal 22",
]
cn_ca = {"title": "Business Assistant", "award": "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"}
cn_as = {"title": "Business Assistant", "award": "A.S. Degree"}
check(C.pdf_heading(CN_PAGES[2], cn_ca)[:2] == (1.0, True) and C.pdf_heading(CN_PAGES[0], cn_as)[:2] == (1.0, True)
      and C.pdf_heading(CN_PAGES[0], cn_ca)[:2] == (1.0, False),
      "the award's letters before the title name the award: CA for a certificate, AS for an A.S., not the other's")
check(C.pdf_heading(CN_PAGES[1], cn_as)[1] is False,
      "a sentence opening 'As the student' names no award: the letters count only before a capitalized word")
cn_pick = C.pdf_best("https://x.edu/c.pdf", CN_PAGES, cn_ca, CN_COURSES, "pypdf")
check(cn_pick and cn_pick["pages"] == [3] and cn_pick["named"] and cn_pick["coverage"] == 1.0
      and cn_pick["text"].startswith("[page 3]\nCA Business Assistant"),
      "the certificate is read from its own page, the one headed CA, not the earlier A.S. page naming the same courses: %r"
      % (cn_pick and cn_pick["pages"]))
check(C.pdf_program_pages(CN_PAGES, cn_as, CN_COURSES)[0] == 0,
      "the A.S. keeps its own page, headed AS")
for kind_line, prog in (("AA-T Political Science", {"title": "Political Science", "award": "A.A- T Degree"}),
                        ("AS-T Mathematics", {"title": "Mathematics", "award": "A.S. T Degree"}),
                        ("AA Ethnic Studies", {"title": "Ethnic Studies", "award": "A.A. Degree"})):
    check(C.pdf_heading(kind_line + "\nSome courses", prog)[:2] == (1.0, True),
          "the letters of every award kind are read: %r" % kind_line)
# A long title wraps onto a short next line (Cañada p155, verbatim): the tail counts toward the title.
hr = {"title": "Human Relations in the Workplace", "award": "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"}
HR_PAGE = ("Total Required Units: 21 - 22\nCA  Human Relations in the\nWorkplace\nThis certificate is an introduction to how to "
           "effectively\nmanage interpersonal workplace relationships.\nBUS. 100 Introduction to Business 3 units\nBUS. 101 Human Relations in the\n"
           "Workplace\n3 units\nBUS. 180 Marketing 3 units\nBUS. 401 Business Communications 3 units\nCOMM C1000 Public Speaking 3 units\n"
           "COMM C1004 Interpersonal Communication 3 units\nTotal Required Units: 18")
hr_head = C.pdf_heading(HR_PAGE, hr)
check(hr_head[:2] == (1.0, True) and HR_PAGE[hr_head[2]:].startswith("CA  Human Relations in the"),
      "a heading wrapped onto a short next line names the whole title, and the heading line, not the course line, is the one: %r" % (hr_head,))
check(C.pdf_heading("Human Relations in the\nThis long paragraph names the workplace among many other words that follow it here.", hr)[0] < 1.0,
      "a long next line is a paragraph, not a wrapped tail")
# A heading that closes a page, its list on the next (Cañada p215/216, p183/184): the heading page leads
# the run; before, the course availability table that named the codes won (p127, p95).
MT_COURSES = [{"code": c} for c in ("MATH 253", "MATH 270", "MATH 275", "MATH C2210", "MATH C2220")]
MT_PAGES = [
    "Course availability by term\nMATH 253 fall\nMATH 270 spring\nMATH 275 fall\nMATH C2210 fall\nMATH C2220 spring\nPHYS 250 fall",
    "MATHEMATICS\nAS-T  Associate in Science Degree for Transfer\nMathematics 2.0............................ 60 units\nAS-T  Mathematics 2.0\n"
    "The Mathematics 2.0 Transfer Degree provides the foundation for studying engineering.\nProgram Learning Outcomes\n1. Use symbolic representations.",
    "AS-T Degree Requirements: 60 units\nMATH 253 Calculus III 5 units\nMATH 270 Linear Algebra 3 units\nMATH 275 Differential Equations 3 units\n"
    "MATH C2210 Calculus I 5 units\nMATH C2220 Calculus II 5 units\nTotal Required Major Units: 21",
]
mt = {"title": "Mathematics", "award": "A.S. T Degree"}
mt_pick = C.pdf_best("https://x.edu/c.pdf", MT_PAGES, mt, MT_COURSES, "pypdf")
check(mt_pick and mt_pick["pages"] == [2, 3] and mt_pick["named"] and mt_pick["coverage"] == 1.0
      and mt_pick["text"].startswith("[page 2]\nAS-T  Mathematics 2.0"),
      "the heading page leads the run onto the page that prints the list, ahead of the availability table: %r" % (mt_pick and mt_pick["pages"]))
check(C.pdf_program_pages(MT_PAGES[:2] + ["General education\nENGL 100 4 units"], mt, MT_COURSES) == [0],
      "a heading page whose next page names no listed course leads nothing; the codes' page is read")

# East LA prints the control number in each heading, and lists every online course on pages up front.
EL = ["Online courses\nACCT 101 ACCT 102 ACCT 210 BUS 120 BUS 001 ENGLISH 101",
      "Business Department\nAccounting (Academic Plan E013343D) This certificate prepares students for work "
      "in an accounting office and runs well past the heading's length on one line as pypdf prints it.\n"
      "ACCT 101 4\nACCT 102 4\nACCT 210 3",
      "Accountancy (Academic Plan E013344D)\nACCT 101 4\nACCT 102 4\nACCT 210 3\nBUS 120 3"]
got = C.pdf_best("https://x.edu/c.pdf", EL, {"title": "Accounting", "award": "Certificate of Achievement",
                                              "control_number": "13343"}, AC_COURSES, "pypdf")
check(got and got["pages"][0] == 2 and got["control_number_printed"]
      and got["text"].startswith("[page 2]\nAccounting (Academic Plan E013343D)"),
      "the page printing the program's control number wins over a course list and a fuller page: %r"
      % ((got and (got["pages"], got["text"][:60])),))
check(C.pdf_control_number("Plan E013344D", "13343") == -1 and C.pdf_control_number("call 133430", "13343") == -1
      and C.pdf_control_number("(Academic Plan E013343D)", "13343") > 0,
      "a control number matches whole, never inside another number")
long_head = "Medical Assistant, Associate in Science Degree (Academic Plan X) A medical assistant interacts with " \
            "doctors, nurses and technicians in a long run-on line as pypdf prints it\nACCT 101 ACCT 102"
check(C.pdf_heading(long_head, {"title": "Medical Assistant", "award": "A.S. Degree"})[:2] == (1.0, True),
      "a heading run into its paragraph is read from the line's opening")

picks = [{"control_number": "1", "cn_printed": True, "named": False},
         {"control_number": "2", "cn_printed": True, "named": False},
         {"control_number": "3", "cn_printed": False, "named": True},
         {"control_number": "4", "cn_printed": False, "named": False}]
check(C.pdf_unproven(picks) == {"4"}, "where the catalog prints control numbers, an unnamed page is no proof")
check(C.pdf_unproven([dict(p, cn_printed=False) for p in picks]) == set(),
      "a catalog that prints no control numbers keeps its coverage picks")
check(C.pdf_unproven([dict(p, titled=True) for p in picks]) == set(),
      "a title-gated page is proof enough, named or not (Los Angeles City lost 28 picks to the heading test)")
# Pierce prints control numbers in a list away from the programs: a page with the number and one listed
# code gives way to the titled page whose run covers the list.
PI = ["Program list\nAccounting (Academic Plan E013343D) ACCT 101", "General education",
      "Accounting\nACCT 101 4\nACCT 102 4\nACCT 210 3\nBUS 120 3"]
check(C.pdf_program_pages(PI, {"title": "Accounting", "award": "Certificate of Achievement",
                               "control_number": "13343"}, AC_COURSES) == [2],
      "a control number on a page naming too few listed codes gives way to the page that covers the list")
below = C.pdf_best("https://x.edu/c.pdf", ["Accounting\nACCT 101 4\nACCT 102 4\nACCT 210 3\nBUS 120 3\n"
                                           "Accounting (Academic Plan E013343D)"],
                   {"title": "Accounting", "award": "Certificate of Achievement", "control_number": "13343"},
                   AC_COURSES, "pypdf")
check(below and below["coverage"] == 1.0 and below["text"].startswith("[page 1]\nAccounting\nACCT 101"),
      "a control number printed below the list never cuts the list away (Pierce)")
# City College of San Francisco (S407): a one-subject program's course descriptions name more of its codes than
# its own page, and a transfer degree's award words include a bare "transfer", which a course line prints.
PH_COURSES = [{"code": c} for c in ("PHYS 4A", "PHYS 4B", "PHYS 4C", "MATH 110A", "MATH 110B")]
PH = ["Physics – AS-T Degree\nProgram Summary\nRequired courses\nPHYS 4A 5.0\nPHYS 4B 5.0\nPHYS 4C 5.0\n"
      "MATH 110A 5.0\nTotal: 20.0",
      "Course Descriptions\nPHYS 4A - General Physics with Calculus I (5.0) Transfer: CSU, UC\nPHYS 4B - General "
      "Physics with Calculus II (5.0) Transfer: CSU, UC\nPHYS 4C - General Physics III (5.0)\nMATH 110A Calculus I "
      "MATH 110B Calculus II"]
ph = {"title": "Physics 2.0", "award": "A.S. T Degree"}
check(C.pdf_program_pages(PH, ph, PH_COURSES)[0] == 0,
      "a transfer degree takes its own heading's page over course descriptions naming more of its codes: %r"
      % C.pdf_program_pages(PH, ph, PH_COURSES))
check(not C._clean_heading(PH[1], C.pdf_heading(PH[1], ph), PH_COURSES)
      and C._clean_heading(PH[0], C.pdf_heading(PH[0], ph), PH_COURSES),
      "a course line naming the subject and 'Transfer' is no heading; the program's own heading is")
# With no heading anywhere, a program's page comes before course descriptions naming more of its codes.
PL_COURSES = [{"code": c} for c in ("LALS 10", "LALS 11", "LALS 12", "LALS 13")]
PL = ["Paralegal/Legal Studies program\nRequired Courses\nLALS 10 Introduction 3.0\nLALS 11 Legal Research 3.0\n"
      "LALS 12 Legal Writing 3.0\nTotal: 9.0",
      "CCSF Catalog - 2026/27\nLALS 10 - Introduction to Paralegal Studies (3.0)\nCredit (Degree Applicable)\n"
      "LALS 11 - Legal Research (3.0)\nLALS 12 - Legal Writing (3.0)\nLALS 13 - Torts for Legal Studies (3.0)"]
pl = {"title": "Paralegal/Legal Studies", "award": "Certificate of Achievement"}
check(C._descriptions(PL[1]) and not C._descriptions(PL[0]),
      "two entry lines (code, dash, title, units in parentheses) make a description page; a course list does not")
check(C.pdf_program_pages(PL, pl, PL_COURSES)[0] == 0,
      "the program's page comes before a description page naming more of its codes: %r"
      % C.pdf_program_pages(PL, pl, PL_COURSES))
check(C.pdf_program_pages(EL, {"title": "Accounting", "award": "Certificate of Achievement",
                               "control_number": "13343"}, AC_COURSES)[0] == 1,
      "a printed control number stays in the preferred class beside a clean heading (East LA)")
step = {"start": "https://x.edu/catalog", "follow": "2026-2027 Catalog.pdf", "format": "pdf"}
check(P.procedure_catalog({"catalog": dict(step, catalog_year="2026-2027")}).get("catalog_year") == "2026-2027"
      and "catalog_year" not in P.procedure_catalog({"catalog": dict(step, catalog_year="2026-2028")})
      and "catalog_year" not in P.procedure_catalog({"catalog": step}),
      "a catalog step carries its file's year (S407), and only a year that follows its first")
check(C.reads_as_pdf({"procedure": {"catalog": {"start": "https://x.edu/catalog", "follow": "2026", "format": "pdf"}}})
      and not C.reads_as_pdf({"catalog_format": "single_pdf", "catalog_url": "https://www.ccsf.edu/catalog"}),
      "a procedure record whose catalog step is a PDF reads as one")


class StepReader:
    pass


def _step_load(reader, url, cache, late):
    return {"status": 200, "access": "ok", "links": [
        {"text": "2026 - 2027", "href": "https://www.elac.edu/academic-resources/catalog/2026-2027"},
        {"text": "2026 - 2027", "href": "https://www.elac.edu/sites/elac.edu/files/2026-08/ELAC%20General%20Catalog%202026%202027.pdf"}]}


_real_load = P.load
P.load = _step_load
try:
    url, wait = C.pdf_start(StepReader(), {"procedure": {"catalog": {
        "start": "https://www.elac.edu/academic-resources/catalog", "follow": "2026 - 2027", "format": "pdf"}}}, {}, {})
finally:
    P.load = _real_load
check(url and url.endswith("2026%202027.pdf"),
      "a PDF step follows the PDF, not the menu link with the same words: %r" % url)

# Hartnell's Coursedog catalog page fetches its whole-catalog PDF by script and links none
# (page read 39077713662, S409): the step names the file, and the read loads no page for it.
HN_PDF = ("https://coursedog-pdfs-public-prod.s3.us-east-2.amazonaws.com/hartnell_colleague/catalog/"
          "6cd77c15-b59c-4c31-a31a-792bcda015b0-hartnell_colleague-catalog-1787336752847.pdf")
hn_step = {"start": "https://hartnell.catalog.prod.coursedog.com/", "file": HN_PDF, "format": "pdf",
           "catalog_year": "2026-2027"}
check((P.procedure_catalog({"catalog": hn_step}) or {}).get("file") == HN_PDF
      and P.procedure_catalog({"catalog": dict(hn_step, format="html")}) is None
      and P.procedure_catalog({"catalog": dict(hn_step, file="hartnell.pdf")}) is None
      and C.reads_as_pdf({"procedure": {"catalog": hn_step}}),
      "a PDF step may name its file in place of a link to follow, and only a PDF step")


def _no_load(*a, **k):
    raise AssertionError("a step naming its file loads no page")


P.load = _no_load
try:
    hn_report = {}
    url, wait = C.pdf_start(StepReader(), {"procedure": {"catalog": hn_step}}, {}, hn_report)
finally:
    P.load = _real_load
check(url == HN_PDF and hn_report["procedure_step"]["file"] == HN_PDF and wait == 600 * 1000,
      "the read takes the file the step names: %r" % url)

# Coursedog prints its list lines with the code unspaced ("• ABT90 - Soil Science", Hartnell's
# PDF, S409); MAP and COCI space them. Both the coarse net and the exact test read the PDF's form.
HN_LIST = ("Complete at least 3 of the following courses:\n• ABT90 - Soil Science\n"
           "• STATC1000 - Introduction to Statistics\n• ART12A - Drawing and Composition\n"
           "Total Required Credits · 60")
check(all(P.code_pattern(c) and P.code_pattern(c).search(HN_LIST) for c in ("ABT 90", "STAT C1000", "ART 12A"))
      and {P.norm_code(c) for c in ("ABT 90", "STAT C1000", "ART 12A")} <= C.page_codes(HN_LIST),
      "an unspaced code (ABT90, STATC1000, ART12A) reads as its spaced form: %r" % sorted(C.page_codes(HN_LIST)))

# Coursedog heads each program "Title - CODE", the prefix its award (Hartnell's PDF, S411). The title-and-
# codes picker sent 33 of 101 programs to the course-set pages at the back or to programs the PDF does not
# print, and 12 more to a sibling award's page. Where the catalog heads its programs so, the heading decides.
def _hn(code, title):
    return {"code": code, "title": title, "units": 3}


HN_PAGES = [
    "Biology - AS.BIO \nGeneral \nProgram Type \nA.S. Local Degree \n• BIO1 - Cells \n• BIO2 - Organisms \n"
    "• CHM1A - Chemistry \nTotal Required Credits \n60",
    "Biology for Transfer Degree (AS-T) - AST.BIO \nGeneral \n• BIO1 - Cells \n• BIO2 - Organisms \n• CHM1A - Chemistry",
    "Computer Science and Info Systems-Computer \nScience Option - AS.CISCS \nGeneral \n• CSS1 - Intro \n• CSS2A - OOP",
    "Sociology for Transfer (AA-T) - \nAAT-SOC \nGeneral \n• SOC1 - Intro \n• SOC2 - Problems",
    "Business Information Worker Level -1 - CT.BIW1 \nGeneral \n• BUS1 - Office \n• BUS2 - Files",
    "Business Information Worker Level -2 - CT.BIW2 \nGeneral \n• BUS1 - Office \n• BUS2 - Files \n• BUS3 - Data",
    "Public Health for Transfer Degree (AS-T) - AST.PH2 \nGeneral \n• HES1 - Health \n• HES2 - Justice",
    "Communication Studies 2.0 for Transfer Degree \n(AA-T) - AAT.COM2 \nGeneral \n• COM1 - Speech \n• COM2 - Groups",
    "Basic Computer Literacy - NCCT.BCL Workforce and Academic Readiness - NCCT.WAR \nGeneral \n• NCC1 - Basics",
    "Course Sets \nElectives (1-199) \n• BIO1 - Cells \n• BIO2 - Organisms \n• CHM1A - Chemistry \n• SOC1 - Intro \n"
    "• SOC2 - Problems \n• KIN1 - Movement \n• KIN2 - Fitness",
]
heads = C.pdf_code_headings(HN_PAGES)
byc = {h["code"]: h for h in heads}
check(set(byc) == {"AS.BIO", "AST.BIO", "AS.CISCS", "AAT.SOC", "CT.BIW1", "CT.BIW2", "AST.PH2", "AAT.COM2",
                   "NCCT.BCL", "NCCT.WAR"},
      "every Title - CODE heading is read, a hyphen code (AAT-SOC) as its dotted form: %r" % sorted(byc))
check(byc["AS.CISCS"]["titles"][1] == "Computer Science and Info Systems-Computer Science Option"
      and byc["AAT.SOC"]["titles"][0] == "Sociology for Transfer (AA-T)"
      and byc["NCCT.WAR"]["titles"][0] == "Workforce and Academic Readiness"
      and byc["AS.BIO"]["kind"] == "as" and byc["AAT.SOC"]["kind"] == "adt" and byc["CT.BIW1"]["kind"] == "coa",
      "a wrapped title reads with its line before, a code on the next line or after another heading reads: %r"
      % [byc[c]["titles"] for c in ("AS.CISCS", "AAT.SOC", "NCCT.WAR")])

HN_PROGS = [
    {"control_number": "03537", "title": "Biology", "award": "A.S. Degree",
     "closed_list": [_hn("BIO 1", "Cells"), _hn("BIO 2", "Organisms"), _hn("CHM 1A", "Chemistry")]},
    {"control_number": "35107", "title": "Biology", "award": "A.S. T Degree",
     "closed_list": [_hn("BIO 1", "Cells"), _hn("BIO 2", "Organisms"), _hn("CHM 1A", "Chemistry")]},
    {"control_number": "08871", "title": "Computer Science and Information Systems-Computer Science",
     "award": "A.S. Degree", "closed_list": [_hn("CSS 1", "Intro"), _hn("CSS 2A", "OOP")]},
    {"control_number": "32036", "title": "Sociology", "award": "A.A- T Degree",
     "closed_list": [_hn("SOC 1", "Intro"), _hn("SOC 2", "Problems")]},
    {"control_number": "38224", "title": "Business Information Worker Level 1",
     "award": "Certificate of Achievement requiring 8S/12Q to fewer than 16S/24Q units",
     "closed_list": [_hn("BUS 1", "Office"), _hn("BUS 2", "Files")]},
    {"control_number": "38232", "title": "Business Information Worker Level 2",
     "award": "Certificate of Achievement requiring 8S/12Q to fewer than 16S/24Q units",
     "closed_list": [_hn("BUS 1", "Office"), _hn("BUS 2", "Files"), _hn("BUS 3", "Data")]},
    {"control_number": "44729", "title": "Public Health", "award": "A.S. T Degree",
     "closed_list": [_hn("HES 1", "Health"), _hn("HES 2", "Justice")]},
    {"control_number": "35458", "title": "Public Health Science", "award": "A.S. T Degree",
     "closed_list": [_hn("HES 1", "Health"), _hn("HES 2", "Justice")]},
    {"control_number": "31146", "title": "Communication Studies", "award": "A.A- T Degree",
     "closed_list": [_hn("COM 1", "Speech"), _hn("COM 2", "Groups")]},
    {"control_number": "43620", "title": "Communication Studies 2.0", "award": "A.A- T Degree",
     "closed_list": [_hn("COM 1", "Speech"), _hn("COM 2", "Groups")]},
    {"control_number": "32981", "title": "Kinesiology", "award": "A.A- T Degree",
     "closed_list": [_hn("KIN 1", "Movement"), _hn("KIN 2", "Fitness")]},
    {"control_number": "18353", "title": "Sociology", "award": "A.A. Degree",
     "closed_list": [_hn("SOC 1", "Intro"), _hn("SOC 2", "Problems")]},
]
coded = C.pdf_code_assign(HN_PROGS, HN_PAGES)
got = {cn: (h or {}).get("code") for cn, h in coded.items()}
check(got["03537"] == "AS.BIO" and got["35107"] == "AST.BIO" and got["32036"] == "AAT.SOC"
      and got["08871"] == "AS.CISCS",
      "a program reads from the heading naming its title and award, never its sibling award's: %r" % got)
check(got["38224"] == "CT.BIW1" and got["38232"] == "CT.BIW2",
      "Level -1 and Level -2 are two levels: %r" % [got["38224"], got["38232"]])
check(got["44729"] == "AST.PH2" and got["35458"] is None and got["31146"] == got["43620"] == "AAT.COM2",
      "a heading goes to the programs it names most fully, ties sharing it: %r"
      % [got["44729"], got["35458"], got["31146"], got["43620"]])
check(got["32981"] is None and got["18353"] is None,
      "a program no heading names (Kinesiology, an A.A. the PDF prints only as an A.A.-T) reads from no page, "
      "never the course-set pages: %r" % [got["32981"], got["18353"]])
hn_bio = C.pdf_best("hn.pdf", HN_PAGES, HN_PROGS[1], HN_PROGS[1]["closed_list"], "pypdf", coded["35107"])
check(hn_bio["pages"][0] == 2 and hn_bio["named"] and hn_bio["coverage"] == 1.0
      and hn_bio["url"] == "hn.pdf#page=2",
      "the run opens on the heading's page: %r" % hn_bio["pages"])
check(C.pdf_code_assign(HN_PROGS * 3, HN_PAGES[:2]) is None,
      "a catalog that heads few programs with a code is read as before")

# SmartCatalog (Crafton Hills, Taft; page reads 39090262960 and 39090533458, S411): no sitemap, and each level of the
# catalog sits beneath the one above it with no closing slash: index, subject or group, program.
SC = "https://craftonhills.smartcatalogiq.com/en/2026-2027/catalog"
sc_kids = C.child_pages(C.child_base(SC + "/credit-programs", "smartcatalog"),
                        [{"href": SC + "/credit-programs/accounting-acct"}, {"href": SC + "/credit-courses/acct-accounting"},
                         {"href": SC + "/what-are-your-options"}, {"href": SC + "/credit-programs"}], SC)
sc_prog = C.child_pages(C.child_base(SC + "/credit-programs/accounting-acct", "smartcatalog"),
                        [{"href": SC + "/credit-programs/accounting-acct/accounting-associate-of-arts-degree"},
                         {"href": SC + "/credit-programs"}], SC)
check(sc_kids == [SC + "/credit-programs/accounting-acct"]
      and sc_prog == [SC + "/credit-programs/accounting-acct/accounting-associate-of-arts-degree"],
      "a SmartCatalog page's children are read beneath its address, never its course pages: %r" % [sc_kids, sc_prog])
check(C.child_pages(C.child_base(SC + "/credit-programs", None), [{"href": SC + "/credit-programs/accounting-acct"}], SC) == []
      and C.child_base(SC + "/credit-programs", "courseleaf") == SC + "/credit-programs",
      "another platform's page without a closing slash still reads no children")

# Coursedog (Merced; page reads 39089955502 and 39090533458, S411; reader S414): the program search's own
# call names 20 of 191 programs, so the reader asks the same address with its page moved, and reads each
# program's Requisites tab under a heading naming the program and its award in words.
CD_CALL = ("https://app.coursedog.com/api/v1/cm/merced_colleague_ethos/programs/search/%24filters"
           "?catalogId=QTM2GIg9kimBOfyC8Dbb&skip=0&limit=20&sortBy=catalogDisplayName%2Cname"
           "&columns=name%2Ccode")
moved = C.cd_search_url(CD_CALL, 100, 100)
check("skip=100" in moved and "limit=100" in moved and "limit=20" not in moved
      and "catalogId=QTM2GIg9kimBOfyC8Dbb" in moved and "sortBy=catalogDisplayName%2Cname" in moved
      and moved.startswith("https://app.coursedog.com/api/v1/cm/merced_colleague_ethos/programs/search/%24filters?"),
      "the search's page moves and the rest of its address stays as the page asked: %r" % moved)
cd_rows = C.cd_programs({"listLength": 3, "data": [
    {"code": "05000.AA", "name": "Accounting (AA)", "catalogDisplayName": "", "status": "Active"},
    {"code": "", "programGroupId": "13012.CT", "name": "Administration in Early Childhood Education (CT)"},
    {"code": "99999.AA", "name": "Retired (AA)", "status": "Inactive"}]})
check(cd_rows == [{"code": "05000.AA", "name": "Accounting (AA)"},
                  {"code": "13012.CT", "name": "Administration in Early Childhood Education (CT)"}],
      "the search's active programs by code and name: %r" % cd_rows)
CD_BODY = ("05000.AA - Accounting (AA) · Download as PDF · Accounting · Program Overview · Requisites · "
           "Accounting (AA) (Total Credits 30.0 - 30.0) · All of the following · Required\n"
           "ACTG04A Financial Accounting (Total Credits 4.0 - 4.0)\nACTG04B Managerial Accounting (Total Credits 4.0 - 4.0)\n"
           "AOM30 Introduction To Computer Applications (Total Credits 3.0 - 3.0)\nBUS18A Business Law (Total Credits 4.0 - 4.0)\n"
           "MATH-10 Elementary Statistics (Total Credits 3.0 - 3.0)")
cd_got = {"url": "https://catalog.mccd.edu/programs/05000.AA/requisites-ojrrt",
          "final_url": "https://catalog.mccd.edu/programs/05000.AA/requisites-ojrrt",
          "title": "05000.AA Program | Merced College Catalog", "body": CD_BODY, "content": CD_BODY}
cd_aa = C.cd_page(cd_got, {"code": "05000.AA", "name": "Accounting (AA)"})
cd_ct = C.cd_page(dict(cd_got, url=cd_got["url"].replace(".AA", ".CT"), final_url=cd_got["url"].replace(".AA", ".CT"),
                       body=CD_BODY.replace("(AA)", "(CT)"), content=CD_BODY.replace("(AA)", "(CT)")),
                  {"code": "05000.CT", "name": "Accounting (CT)"})
check({"ACTG4A", "ACTG4B", "AOM30", "BUS18A", "MATH10"} <= cd_aa["codes"],
      "the net reads Coursedog's run-together codes (ACTG04A, MATH-10): %r" % sorted(cd_aa["codes"]))
cd_courses = [{"code": c} for c in ("ACTG 4A", "ACTG 4B", "AOM 30", "BUS 18A", "MATH 10")]
cd_prog_aa = {"control_number": "1", "title": "Accounting", "award": "A.A. Degree", "closed_list": cd_courses}
cd_prog_ct = {"control_number": "2", "title": "Accounting", "award": "Certificate of Achievement 18 to < 30 semester units",
              "closed_list": cd_courses}
cd_given = C.assign([cd_prog_aa, cd_prog_ct], [cd_ct, cd_aa])
check((cd_given["1"]["best"] or {}).get("url", "").endswith("05000.AA/requisites-ojrrt")
      and (cd_given["2"]["best"] or {}).get("url", "").endswith("05000.CT/requisites-ojrrt"),
      "an A.A. and its certificate naming the same courses each read their own tab: %r"
      % [(cd_given[k]["best"] or {}).get("url") for k in ("1", "2")])
check(C.cd_award_words("Agriculture Business (AST)") == "associate in science for transfer"
      and C.cd_award_words("Adult Literacy (NC)").startswith("noncredit") and C.cd_award_words("Accounting") == "",
      "a program's letters name its award in words")

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements college pass (%d checks)" % checks[0])
