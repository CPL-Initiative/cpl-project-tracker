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
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402

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

# ── the workflow: reads on a push, spends only when asked ───────────────────
wf = open(os.path.join(ROOT, ".github", "workflows", "program-requirements-college.yml")).read()
check("CENSUS_DELAY_MS: '4000'" in wf, "the capture reads at the census's pace")
check("[extract]" in wf and "workflow_dispatch" in wf,
      "the extraction spends model calls only on a dispatch or a commit that asks for it")
check(wf.count("contents: write") == 1 and 'git push origin "HEAD:${{ github.ref_name }}"' in wf,
      "the run writes only to the branch that ran it")
check("if: env.EXTRACT == 'true'" in wf and "SUPABASE_SERVICE_KEY" in wf.split("name: Extract and score")[1].split("name: File the run")[0]
      and "SUPABASE_SERVICE_KEY" not in wf.split("name: Extract and score")[0],
      "the service key reaches the extraction step alone")
check("github.actor != 'github-actions[bot]'" in wf, "the filing commit never runs the workflow again")

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements college pass (%d checks)" % checks[0])
