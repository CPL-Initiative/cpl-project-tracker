#!/usr/bin/env python3
"""Phase 2 of the program requirements harvest: every program at one college.

Sam, 2026-10-09 (S353, as proposed): the first full-college read is Cerritos,
every active program that carries a state course list (288 of 292), by the
method that passed the pilot (20 of 20, all four checks). Records load
unchecked (Beta draft); the three machine checks run on each; Sam reads a
sample for the fourth. About $19 in model calls. Lane:
docs/reference/lanes/program-requirements-harvest.md.

The pilot found one program's page at a time by following links from the
catalog's front page (kb/_program_requirements_pilot.py, up to eight loads a
program), and a session filed each page from the job log by hand. Neither
scales to a college. So this pass turns the search around:

  capture    lists the college's active programs and their closed course lists
             (coci_college_programs, coci_program_courses, read with the anon
             key), lists the catalog's program pages ONCE (its sitemap.xml, else
             the program index the catalog's own front page links; for a
             curriQunet catalog, its own program index as JSON), reads each
             page once, and gives each program the page that names the largest
             share of its listed courses, the pilot's acceptance test, with the
             award and title words on the page breaking a tie (an A.A. and the
             certificate inside it name the same courses). A program no page
             accepts gets the pilot's own link search, from the shared cache.
             Writes OUT/sources/<control number>.json in the pilot's source shape
             and OUT/capture.json, the account of the run.
  extract    posts one shard of the sources to the program-requirements-extract
             Edge Function and scores each record (the pilot's extraction and
             scorer, unchanged), writing OUT/records/<control number>.json.
  file       copies the records and the run's account into the repository
             (kb/program_requirements_college/<slug>/), which the workflow
             commits to the branch that ran it: no session reads a job log.
  load       posts the committed records, unchecked, to
             program_requirement_records_college_load() with the service key,
             and writes the receipt (kb/receipts/program_requirement_records_
             college_<slug>_<run>.json) that names every key it inserted.
  reread     posts the records the newest extraction run filed to
             program_requirement_records_college_reread(), which replaces a
             row only while it is unchecked and from an earlier run (a
             person's reading no longer holds it, S392), and writes the receipt holding each replaced row's
             before-values (kb/receipts/program_requirement_records_college_
             reread_<slug>_<run>.json), which is the rollback.

The reads follow the census's rules, as the pilot's do (Sam's call 5 on sheet
23): robots.txt first for every host, CENSUS_DELAY_MS between loads, the census
user agent that names the CPL Initiative. A host on record as refused is never
retried under another name.

The pure functions are tested by tests/program_requirements_college_test.py
without a browser or a network.
"""
from __future__ import annotations

import argparse
import glob
import gzip
import hashlib
import io
import json
import os
import re
import sys
import time
import urllib.parse
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_pilot as P  # noqa: E402

PAGE_SIZE = 1000          # PostgREST answers at most this many rows a request
MAX_PAGES = 900           # program pages read at one college, at most
FALLBACK_LOADS = 4        # the pilot's link search, per program no page accepted
MAX_FALLBACKS = 40        # programs given that search in one run (160 loads at most)
SMALL_LIST = 3            # below this many listed courses, coverage alone cannot pick a page
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
HAND_FILED_DIR = os.path.join(HERE, "hand_filed_catalogs")
HAND_FILED_KEYS = ("college", "url", "fetched_by", "fetched_at", "sha256", "file", "copy_url")
# A copy a person posted where the session cannot fetch it but the runner can (the
# catalog-files release's attachments, S406): the read fetches it from there, and
# `pin` fixes its sha256 on the record the first time a runner reads it.
COPY_UA = "CPL Initiative program requirements harvest (a hand-filed copy; cpl-initiative.github.io)"

# A sitemap address names the program pages by their path. These words mark a
# catalog's program sections; these mark everything else it lists.
PROGRAM_PATH = re.compile(
    r"degree|certificate|program|major|pathway|noncredit|award|transfer|career|"
    r"academic-and-career|areas-of-study|aos|-a-?a|-a-?s|-ast?\b|-aat?\b", re.I)
NOT_PROGRAM_PATH = re.compile(
    r"course-?descriptions?|/courses?/|coursesaz|/archive|/previous|/policies|/policy|"
    r"/services|/student-services|/admission|/calendar|/faculty|/staff|/search|/pdf/|"
    r"\.pdf$|/general-information|/administration|/glossary|/index\.html?$|/addend", re.I)


# ── the college's programs, from the state's files ─────────────────────────
def fetch_all(path_qs: str) -> list[dict]:
    """Every row of a PostgREST read, a page at a time."""
    out, offset = [], 0
    while True:
        rows = P._get("%s&limit=%d&offset=%d" % (path_qs, PAGE_SIZE, offset))
        out.extend(rows)
        if len(rows) < PAGE_SIZE:
            return out
        offset += PAGE_SIZE


# Which COCI statuses the harvest reads. Active and Active - Teachout Only from the
# start; Approved since Sam's go on 2026-10-10 (S356, "go on call 2"): a college
# may offer an Approved program, and 1,423 statewide (33 at Cerritos, 84 at Mt.
# San Antonio) had gone unread. A re-read pays only for them, because extract
# keeps every record filed from the same page.
STATUS_FILTER = "or=(status.like.Active*,status.eq.Approved)"


def college_programs(college: str) -> list[dict]:
    """The college's programs the harvest reads (STATUS_FILTER: Active, Active -
    Teachout Only and Approved), each with its closed list, in control-number
    order. A program the state's file lists no course for is kept, marked, and
    never read."""
    progs = fetch_all("coci_college_programs?select=control_number,program_title,award,status,top_code"
                      "&college=eq.%s&%s&order=control_number" % (P.q(college), STATUS_FILTER))
    rows = fetch_all("coci_program_courses?select=program_control_number,course_control_number,"
                     "course_code,course_title,units,cid,course_college,load_id"
                     "&college=eq.%s&order=program_control_number,course_code" % P.q(college))
    import _program_requirements_reconcile as R
    return with_renumbers(group_programs(progs, rows), R.course_renumbers(college))


def with_renumbers(programs: list[dict], renumbers: dict) -> list[dict]:
    """Each listed course the college renumbered carries the code its catalog prints
    ("printed"), so the capture counts it on the page (kb/program_requirements_reconcile.json,
    course_renumbers; Merced, S423)."""
    for p in programs if renumbers else []:
        for c in p["closed_list"]:
            k = P.norm_code(c.get("code"))
            if k in renumbers:
                c["printed"] = renumbers[k]
    return programs


def net_hits(courses: list[dict], codes: set) -> int:
    """How many listed courses the page's code tokens name, a renumbered one by either code."""
    return sum(1 for c in courses if P.norm_code(c.get("code") or "") in codes
               or (c.get("printed") and c["printed"] in codes))


def group_programs(progs: list[dict], rows: list[dict]) -> list[dict]:
    by_cn: dict[str, list[dict]] = {}
    for r in rows:
        by_cn.setdefault(str(r.get("program_control_number")), []).append(r)
    out, seen = [], set()
    for p in progs:
        cn = str(p.get("control_number"))
        if cn in seen:
            continue
        seen.add(cn)
        mine = by_cn.get(cn, [])
        out.append({"control_number": cn, "title": p.get("program_title") or "", "award": p.get("award"),
                    "status": p.get("status"), "top_code": p.get("top_code"),
                    "shape": shape_of(p.get("award")),
                    "closed_list": P.closed_from_rows(mine),
                    "load_id": mine[0].get("load_id") if mine else None})
    return out


def shape_of(award: str | None) -> str:
    """The pilot's four shapes, named from the award alone: the extraction and
    the display read `shape`, and a full college has no hand-picked slot."""
    kind = P.award_kind(award)
    return {"adt": "adt", "as": "degree", "aa": "degree", "bs": "degree",
            "coa": "certificate", "noncredit": "noncredit"}.get(kind, "other")


# ── the catalog's program pages ────────────────────────────────────────────
def sitemap_urls(xml_text: str) -> tuple[list[str], list[str]]:
    """(page addresses, nested sitemap addresses) a sitemap or sitemap index
    lists. Malformed XML reads as none, never as an error."""
    try:
        root = ET.fromstring(xml_text.encode() if isinstance(xml_text, str) else xml_text)
    except ET.ParseError:
        return [], []
    pages, nested = [], []
    for el in root.iter():
        tag = el.tag.rsplit("}", 1)[-1]
        if tag != "loc" or not (el.text or "").strip():
            continue
        url = el.text.strip()
        parent_is_index = root.tag.rsplit("}", 1)[-1] == "sitemapindex"
        (nested if parent_is_index else pages).append(url)
    return pages, nested


def district_scope(start: str, registry_urls: list[str]) -> str | None:
    """The path a district catalog gives this college, when another college's
    catalog address is on the same host. Four districts publish one CourseLeaf
    host for several colleges (catalog.cccd.edu/orange-coast/, /golden-west/,
    /coastline/; catalog.nocccd.edu, catalog.gcccd.edu, catalog.vcccd.edu), and
    the host's sitemap lists every college's pages, so without it Fullerton's
    Accounting A.A. competes with Cypress's for one page. The scope is the first
    segment of this college's own address; a host no other college shares has
    none, and the read keeps the whole host as it did at Cerritos."""
    host = urllib.parse.urlparse(start).netloc.lower()
    others = [u for u in registry_urls
              if u and urllib.parse.urlparse(u).netloc.lower() == host and u.rstrip("/") != start.rstrip("/")]
    seg = [x for x in (urllib.parse.urlparse(start).path or "/").split("/") if x]
    return "/%s/" % seg[0] if others and seg else None


YEAR_SEGMENT = re.compile(r"^(current|\d{4}|(19|20)\d{2}-(19|20)?\d{2})$", re.I)


def year_scope(start: str, platform: str | None) -> str | None:
    """An own-HTML catalog's own path (/current/), so its sitemap's past years
    stay out. Skyline's sitemap lists 48,034 pages across every catalog year
    since 2017-18; the read stopped at MAX_PAGES and took 40 of its 62 picks
    from /1718/, /1819/ and /1920/ (run 39024299478, S404). The scope runs
    through the address's year segment (Coalinga: /catalog/2026-2027/); an
    address that names no year (a landing page) keeps the whole host."""
    if platform != "custom_html" or not start:
        return None
    seg = [x for x in (urllib.parse.urlparse(start).path or "/").split("/") if x]
    for i, x in enumerate(seg):
        if YEAR_SEGMENT.match(x):
            return "/%s/" % "/".join(seg[:i + 1])
    return None


def in_scope(url: str, scope: str | None) -> bool:
    return not scope or (urllib.parse.urlparse(url).path or "/").startswith(scope)


INDEX_FILE = re.compile(r"/index\.html?$", re.I)


def dir_form(url: str) -> str:
    """A CourseLeaf page's address as its directory: <dir>/index.html serves the
    same page as <dir>/. Coastline's catalog (catalog.cccd.edu, the Coast district)
    lists every program page as .../business-as/index.html, and NOT_PROGRAM_PATH,
    written to keep catalog index files out, dropped all of them: 109 of 159
    programs found no page (run 38406172949, S380)."""
    return INDEX_FILE.sub("/", (url or "").split("#")[0])


def link_page_ok(url: str, scope: str | None) -> bool:
    """A page the link search found may stand for a program only where a sitemap
    page could: inside this college's scope, and never a course list, policy,
    archive or PDF. Coastline's course listing for Real Estate
    (course-descriptions/credit-courses/re/) names every RE course, so it read as
    the program's page at coverage 1.0 and would have been extracted as one (run
    38406172949, S380: five programs on three course listings)."""
    url = dir_form(url)
    path = urllib.parse.urlparse(url or "").path or "/"
    return bool(url) and in_scope(url, scope) and not NOT_PROGRAM_PATH.search(path)


def child_pages(page_url: str, links: list[dict] | None, start: str, scope: str | None = None) -> list[str]:
    """The program pages a page links beneath its own address. Coastline's sitemap
    lists its subject pages (pathways/<area>/<subject>/) and few of the program
    pages each one links (.../business/marketing-applied-as/), so 114 of 159
    programs found no page and the link search reached ten of them (run
    38412902035, S381). A page's children pass the sitemap's own filter; a menu's
    links to other sections are not beneath the page and stay out."""
    base = dir_form(page_url)
    path = urllib.parse.urlparse(base).path or "/"
    if not path.endswith("/"):
        return []
    kids = []
    for ln in links or []:
        u = dir_form(ln.get("href") or "")
        p = urllib.parse.urlparse(u).path or "/"
        if p.startswith(path) and len(p) > len(path) and P.same_site(u, start):
            kids.append(u)
    return program_candidates(kids, start, scope)


def program_candidates(urls: list[str], start: str, scope: str | None = None) -> list[str]:
    """The sitemap's pages that sit in a program section of this catalog: the
    catalog's own host (and, on a district host, this college's own path), a
    path a program section uses, and nothing a course list, policy, archive or
    PDF uses. Deduplicated, in the sitemap's order."""
    out, seen = [], set()
    for u in urls:
        u = dir_form(u)
        if not P.same_site(u, start) or u in seen or not in_scope(u, scope):
            continue
        path = urllib.parse.urlparse(u).path or "/"
        if path.count("/") < 2 or NOT_PROGRAM_PATH.search(path) or not PROGRAM_PATH.search(path):
            continue
        seen.add(u)
        out.append(u)
    return out


# ── giving each program its page ───────────────────────────────────────────
# A number may end in letters and digits: Riverside City's Cosmetology Concepts
# lists COS 60A1 and COS 60B3, which the net read as no code at all, so the page
# never reached the exact test (S357, run 38077405309).
CODE_TOKEN = re.compile(r"\b([A-Z][A-Z&]{0,7})[\s\-]?(C?\d{1,4}(?:\.\d{1,2})?(?:[A-Z]{1,2}\d{0,2})?)\b")
CODE_TOKEN_2 = re.compile(r"\b([A-Z][A-Z&]{0,7}\s[A-Z&]{1,6})[\s\-]?(C?\d{1,4}(?:\.\d{1,2})?(?:[A-Z]{1,2}\d{0,2})?)\b")
# NOCCCD prints the campus letter as its own word, as the state's file stores it: HORT 001 F at
# Fullerton, C at Cypress. The net read HORT 001 and found none of Nursery Management's 14
# listed courses on its own page; 312 of 326 Fullerton programs went unfound (run 38670930336).
CODE_TOKEN_3 = re.compile(r"\b([A-Z][A-Z&]{0,7})[\s\-]?(C?\d{1,4}(?:\.\d{1,2})?[A-Z]{0,2})[ \u00a0]([A-Z])\b")
# A subject may carry a slash, as the state's file stores it: Crafton Hills' noncredit CNA/N 621
# and its Kinesiology KIN/D 130A. The net read N 621 and turned ten noncredit programs away from
# their own pages, each placing every listed course (capture-only run 39091435061, S413); the
# exact test already reads the slash (SUBJ_JOIN, Glendale's CS/IS, S408). The state's file
# sometimes drops the slash (Foundations in English Language's ESLN601, Home Health Aide's
# CNAN626, where the page prints ESL/N 601), so the net reads both forms.
CODE_TOKEN_4 = re.compile(r"\b([A-Z][A-Z&]{0,7}/[A-Z&]{1,6})[\s\-]?(C?\d{1,4}(?:\.\d{1,2})?(?:[A-Z]{1,2}\d{0,2})?)\b")


def page_codes(text: str) -> set[str]:
    """Every course-code-like token on a page, in the pilot's normal form, read
    with a one-word subject (HED 100) and a two-word one (REAL ES 7) both, since
    "A.S.-T HED 100" would otherwise read as subject "T HED". A coarse net: it
    only decides which programs are worth the exact test, so it may over-reach."""
    t = text or ""
    return ({P.norm_code(a + " " + b) for a, b in CODE_TOKEN.findall(t)} |
            {P.norm_code(a + " " + b) for a, b in CODE_TOKEN_2.findall(t)} |
            {P.norm_code(a + " " + b + c) for a, b, c in CODE_TOKEN_3.findall(t)} |
            {P.norm_code(a + " " + b) for a, b in CODE_TOKEN_4.findall(t)} |
            {P.norm_code(a.replace("/", "") + " " + b) for a, b in CODE_TOKEN_4.findall(t)})


def page_net(got: dict) -> set[str]:
    """The coarse net's codes for one loaded page: its visible text, its textContent, and
    its hidden tab panels read cell by cell. Coastline prints each program's courses only
    in a hidden Requirements tab, and textContent runs every code into the cell before it
    ("Units3BCI C100Introduction"), so the net read none of Building Codes Inspector A.S.'s
    ten listed courses on its own page and refused 98 of the 106 programs it found no page
    for (capture-only run 38438077425, S382). The link search has no net and read
    Information Technology A.S.'s page the same way at coverage 1.0, from the tab."""
    return page_codes("\n".join([got.get("body") or "", got.get("content") or "", P.hidden_tabs_text(got)]))


# A CourseLeaf address names the award in its last segment: field-ironworkers-aa,
# public-health-science-as-t, medical-assistant-certifciate-achievement (the
# catalog's own spelling), energy-corps-certificate-completion. Read from the
# address as it stands: the first cut read it with its hyphens turned to spaces,
# so "aa-t" read as no award at all and the Anthropology A.A. took the A.A.-T's
# page (run 37961137169).
SLUG_AWARD = [
    ("adt", re.compile(r"-a[as]-?t/?$")),
    ("as", re.compile(r"-as/?$")),
    ("aa", re.compile(r"-aa/?$")),
    ("bs", re.compile(r"-bs/?$|bachelor")),
    ("coa", re.compile(r"certif\w*-(?:of-)?achievement|-coa/?$")),
    ("noncredit", re.compile(r"certif\w*-(?:of-)?(?:completion|competency)|noncredit")),
    # Coastline spells some awards out: marketing-associate-science-degree,
    # business-administration-2.0-associate-science-degree-transfer,
    # project-management-essentials-certificate-specialization (S381). The transfer
    # form is tested first, as "-as-t" is above.
    ("adt", re.compile(r"associate-(?:in-|of-)?(?:science|arts)-degree-(?:for-)?transfer/?$")),
    ("as", re.compile(r"associate-(?:in-|of-)?science-degree/?$")),
    ("aa", re.compile(r"associate-(?:in-|of-)?arts-degree/?$")),
    ("other", re.compile(r"certif\w*-(?:of-)?specialization/?$")),
]


def slug_award(url: str) -> str | None:
    """The award an address names in its last segment, or None."""
    path = urllib.parse.unquote(urllib.parse.urlparse(url or "").path).lower()
    for kind, pat in SLUG_AWARD:
        if pat.search(path):
            return kind
    return None


def label_score(page: dict, program: dict) -> tuple[int, float]:
    """(1 when the page names the program's award, the share of the program's
    title words the page names) from its heading, title and address. An address
    that names an award decides the first: an A.A. program on an A.A.-T page
    scores 0 though "A.A." appears in "A.A.-T"."""
    words = " ".join([page.get("h1") or "", page.get("title") or "",
                      urllib.parse.unquote(urllib.parse.urlparse(page.get("url") or "").path).replace("-", " ")]).lower()
    kind = P.award_kind(program.get("award"))
    named = slug_award(page.get("url") or "")
    if named:
        award_hit = int(named == kind)
    else:
        award_hit = int(any(re.search(p, words) for p in P.AWARD_WORDS.get(kind, [])))
    tokens = P.title_tokens(program.get("title") or "")
    hits = sum(1 for w in tokens if re.search(r"\b" + re.escape(w) + r"\b", words))
    return award_hit, round(hits / len(tokens), 3) if tokens else 0.0


# The words an award adds to a heading ("Physical Sciences - Associate in Science"),
# set aside before a heading is matched to a program's title: "science" in an A.S.
# heading is the award, not the subject (S366).
HEADING_AWARD = re.compile(
    r"associate (?:in|of) (?:science|arts)(?: (?:for )?transfer(?: degree)?)?|"
    r"certificate of (?:achievement|accomplishment|completion|competency)|transfer degree|"
    r"\ba\.?\s?[as]\.?(?:\s*-\s*t)?\b|\bdegree\b|\bcertificate\b", re.I)
# Hartnell's PDF writes "Business Information Worker Level -1" (S411).
LEVEL = re.compile(r"\blevel\s*-?\s*(\d+|[ivx]+)\b", re.I)
# A page title ends in the site's name after a "|" or, in CourseLeaf's
# breadcrumb form, a "<" ("Aging Studies, Associate of Arts Degree < Coastline College").
TITLE_SPLIT = re.compile(r"\s*\|\s*|\s+<\s+")
BANNER_SHARE = 0.5     # an h1 on half the pages read, and on at least
BANNER_PAGES = 10      # this many, is the catalog's banner, not a page's heading


def drop_banner_h1(pages: list[dict]) -> str | None:
    """Blank an h1 the catalog prints on every page, so a page's heading is read
    from its title. Every Coastline page's h1 is "ACADEMIC CATALOGS" (run
    38412902035, S381), so no page reached through its hidden text could name its
    program, and the heading rule turned each one away. Returns the banner."""
    counts: dict[str, int] = {}
    for pg in pages:
        h = (pg.get("h1") or "").strip()
        if h:
            counts[h] = counts.get(h, 0) + 1
    if not counts:
        return None
    h, n = max(counts.items(), key=lambda kv: kv[1])
    if n < BANNER_PAGES or n < BANNER_SHARE * len(pages):
        return None
    for pg in pages:
        if (pg.get("h1") or "").strip() == h:
            pg["h1"] = ""
    return h


def heading_match(page: dict, program: dict) -> tuple[float, float]:
    """(the share of the program's title words its heading names, the share of the
    heading's own words the title names), award words set aside. The heading is the
    page's h1, else its title before a "|". A title word and a heading word match when
    equal, or when one begins the other and both run past three letters (Science,
    Sciences). Two different levels ("Level 2", "Level 1") score (0, 0)."""
    head = page.get("h1") or TITLE_SPLIT.split(page.get("title") or "")[0]
    title = program.get("title") or ""
    lt, lh = LEVEL.search(title), LEVEL.search(head)
    if lt and lh and lt.group(1).lower() != lh.group(1).lower():
        return 0.0, 0.0
    t = set(P.title_tokens(title))
    h = set(P.title_tokens(HEADING_AWARD.sub(" ", head)))
    if not t or not h:
        return 0.0, 0.0

    def named(words, others):
        return sum(1 for w in words if w in others or any(
            len(w) > 3 and len(x) > 3 and (x.startswith(w) or w.startswith(x)) for x in others))
    return round(named(t, h) / len(t), 3), round(named(h, t) / len(h), 3)


# A page reached only through its hidden text must name the program in its heading.
# Long Beach City hides an A-Z course index that names every course in its catalog,
# so every page held every program's codes in textContent and cleared the coverage
# net; Photography A.A.'s page went to seven programs (run 38152016534, S366).
# Measured on that run's 74 records that placed none: these two shares kept the 10
# programs read from their own page and turned away 58 of the rest.
HIDDEN_HEADING_TITLE = 0.5    # the heading names half the title's words
HIDDEN_HEADING_OWN = 0.6      # and the title names 60% of the heading's own words


def heading_names_program(page: dict, program: dict) -> bool:
    of_title, of_heading = heading_match(page, program)
    return of_title >= HIDDEN_HEADING_TITLE and of_heading >= HIDDEN_HEADING_OWN


def candidates(program: dict, pages: list[dict]) -> list[dict]:
    """Every page naming at least ACCEPT_SHARE of the program's listed courses,
    best first: the page naming its award, then the larger share of its title,
    then the higher coverage."""
    courses = program["closed_list"]
    if not courses:
        return []
    want = {P.norm_code(c.get("code") or "") for c in courses}
    out = []
    for pg in pages:
        if net_hits(courses, pg["codes"]) < P.ACCEPT_SHARE * len(want) * 0.8:   # the coarse net, with slack
            continue
        fb = P.find_codes(pg.get("body") or "", courses)
        fc = P.find_codes(pg.get("content") or "", courses)
        text, found, field = P.best_text(pg["got"], fb, fc, courses)
        cov = P.coverage(found, courses)
        if cov < P.ACCEPT_SHARE:
            continue
        if field == "textContent" and not heading_names_program(pg, program):
            continue   # hidden text alone is no evidence: an index names every course
        award_hit, title = label_score(pg, program)
        if len(want) < SMALL_LIST and title < 0.5:
            continue   # a list this short names its courses on many pages; the page must name the program too
        out.append({"url": pg["url"], "group": pg.get("group") or pg["url"], "coverage": cov, "found": found,
                    "text": text, "field": field,
                    "got": pg["got"], "label": {"award": award_hit, "title": title},
                    "key": (award_hit, title, round(cov, 3))})
    out.sort(key=lambda c: c["key"], reverse=True)
    return out


def near_miss(program: dict, pages: list[dict]) -> dict | None:
    """For a program no page was accepted for: the page read whose heading, title and
    address name it best, and which of candidates()'s gates turned that page away, so a
    not-found program says why instead of only that. Coastline's re-read (run 38429656959,
    S381) read Information Technology A.S.'s own page from the sitemap and still left the
    program to the link search, which took that page at coverage 1.0; nothing on file said
    which gate had refused it."""
    courses = program.get("closed_list") or []
    want = {P.norm_code(c.get("code") or "") for c in courses}
    if not want:
        return None
    best = None
    for pg in pages:
        key = label_score(pg, program)
        if key[1] >= 0.5 and (best is None or key > best[0]):
            best = (key, pg)
    if best is None:
        return {"why": "no page read names the program"}
    (award_hit, title), pg = best
    fb = P.find_codes(pg.get("body") or "", courses)
    fc = P.find_codes(pg.get("content") or "", courses)
    _, found, field = P.best_text(pg["got"], fb, fc, courses)
    cov, net = P.coverage(found, courses), net_hits(courses, pg["codes"])
    if net < P.ACCEPT_SHARE * len(want) * 0.8:
        why = "coarse net: the page's code tokens name %d of %d listed courses" % (net, len(want))
    elif cov < P.ACCEPT_SHARE:
        why = "coverage %.2f in %s, below %.2f" % (cov, field, P.ACCEPT_SHARE)
    elif field == "textContent" and not heading_names_program(pg, program):
        why = "hidden text only, and the heading does not name the program"
    elif len(want) < SMALL_LIST and title < 0.5:
        why = "a short list on a page whose label does not name the program"
    else:
        why = "a candidate, lost to a program the page names more fully"
    # What the capture itself held for the page (S382): a failed page script leaves the
    # Reader's 6,000-character innerText alone, and a page read prints only what it renders.
    got = pg.get("got") or {}
    return {"url": pg["url"], "label": {"award": award_hit, "title": title}, "field": field,
            "coverage": round(cov, 3), "body": round(P.coverage(fb, courses), 3),
            "content": round(P.coverage(fc, courses), 3), "net": net, "listed": len(want), "why": why,
            "error": got.get("error"),
            "chars": {"body": len(got.get("body") or ""), "content": len(got.get("content") or ""),
                      "tabs": len(P.hidden_tabs_text(got))},
            "tab_panels": [[(t.get("label") or t.get("id") or "")[:40], len(t.get("text") or "")]
                           for t in (got.get("tabPanels") or [])][:8]}


def choose_page(program: dict, pages: list[dict]) -> dict | None:
    """The program's best page, ignoring the other programs (assign() decides
    between them)."""
    c = candidates(program, pages)
    return c[0] if c else None


def page_winners(claims: list[tuple[str, dict]]) -> set[str]:
    """Which of the programs claiming one page keep it. Those whose award the
    page names, and among them the ones it names most fully: two state records
    of one catalog program (Public Health and Public Health Science, both A.S.-T,
    every title word named) share it; Culinary Arts: Professional Cooking A.S.
    loses the Culinary Arts Management A.S. page. When the page names no
    claimant's award, the one it names most fully keeps it, more listed courses
    breaking a tie."""
    named = [(cn, c) for cn, c in claims if c["label"]["award"]]
    if named:
        top = max(c["label"]["title"] for _, c in named)
        return {cn for cn, c in named if c["label"]["title"] == top}
    best = max(claims, key=lambda x: (x[1]["label"]["title"], x[1]["coverage"], len(x[1]["found"]), -int(x[0]) if x[0].isdigit() else 0))
    return {best[0]}


def assign(programs: list[dict], pages: list[dict]) -> dict[str, dict]:
    """Each program's page, a page going only to the programs page_winners()
    lets keep it. A program that loses moves to its next page and tries again;
    one with none left is read from no page, and says which page went to whom
    (method page_claimed), so a sibling's requirements never stand in for its own.
    Returns {control number: {"best": candidate or None, "claimed_by": [...]}}."""
    ranked = {p["control_number"]: candidates(p, pages) for p in programs if p["closed_list"]}
    pos = {cn: 0 for cn in ranked}
    lost: dict[str, list[str]] = {}
    for _ in range(12):
        by_page: dict[str, list[tuple[str, dict]]] = {}
        for cn, cands in ranked.items():
            if pos[cn] < len(cands):
                c = cands[pos[cn]]
                by_page.setdefault(c.get("group") or c["url"], []).append((cn, c))
        moved = False
        for claims in by_page.values():
            if len(claims) < 2:
                continue
            keep = page_winners(claims)
            for cn, c in claims:
                if cn not in keep:
                    lost.setdefault(cn, []).append(c["url"])
                    pos[cn] += 1
                    moved = True
        if not moved:
            break
    out = {}
    for cn, cands in ranked.items():
        best = cands[pos[cn]] if pos[cn] < len(cands) else None
        out[cn] = {"best": best, "lost": lost.get(cn, [])}
    return out


def source_record(college: str, program: dict, reg: dict, best: dict | None, method: str) -> dict:
    """The pilot's source shape, so its extraction, scorer and filer read a
    full college's sources unchanged."""
    rec = {"college": college, "control_number": program["control_number"], "shape": program["shape"],
           "title": program["title"], "award": program["award"], "status": program["status"],
           "catalog_url": reg.get("catalog_url"), "catalog_year": reg.get("catalog_year"),
           "platform": reg.get("catalog_platform"), "format": reg.get("catalog_format"),
           "closed_list": program["closed_list"], "load_id": program["load_id"]}
    if not best:
        rec.update(method=method, source=None, coverage=0.0, codes_found=[], text="")
        return rec
    got = best.get("got") or {}
    rec.update(method=method,
               source={"url": best["url"], "title": got.get("title"), "h1": got.get("h1"),
                       "text_from": best.get("field"), "label": best.get("label")},
               coverage=round(best["coverage"], 3),
               codes_found=sorted(best["found"]),
               text=P.with_outcome_tabs(P.text_window(best.get("text") or "", best["found"]),
                                        got.get("outcomeTabs")),
               courseleaf_lists=P.courseleaf_lists(got, program["closed_list"])
               if reg.get("catalog_platform") == "courseleaf" else [])
    return rec


def shard_of(items: list, shard: int, shards: int) -> list:
    """Every shards-th item from the shard-th: the shards share the work evenly
    and every item lands in exactly one."""
    return [x for i, x in enumerate(items) if i % shards == shard]


def slug_of(college: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", college.lower().replace(" college", "")).strip("_")


# ── the passes ─────────────────────────────────────────────────────────────
def host_registry_urls(start: str) -> list[str]:
    """Every registry catalog address on this college's catalog host."""
    host = urllib.parse.urlparse(start).netloc.lower()
    rows = P._get("program_source_registry?select=catalog_url&catalog_url=like.*%s*" % urllib.parse.quote(host))
    return [r.get("catalog_url") for r in rows if r.get("catalog_url")]


def read_sitemap(reader, start: str) -> dict:
    """The catalog's sitemap.xml, robots first and the census's delay before
    each request; a sitemap index is followed one level."""
    from _program_source_census import robots_allows, site_root
    root = site_root(start)
    out = {"url": root + "sitemap.xml", "pages": [], "nested": [], "status": None}
    todo, done = [out["url"]], set()
    while todo and len(done) < 12:
        url = todo.pop(0)
        if url in done:
            continue
        done.add(url)
        if not robots_allows(reader._robots_for(url), url):
            out.setdefault("refused", []).append(url)
            continue
        time.sleep(reader.delay)
        reader.loads += 1
        try:
            resp = reader.request.get(url, timeout=60000)
            if url == out["url"]:
                out["status"] = resp.status
            if not resp.ok:
                continue
            pages, nested = sitemap_urls(resp.text())
            out["pages"].extend(pages)
            out["nested"].extend(nested)
            todo.extend(nested)
        except Exception as exc:
            out.setdefault("errors", []).append("%s: %s" % (url, str(exc).splitlines()[0][:160]))
    return out


def child_base(page_url: str, platform: str | None) -> str:
    """The address a page's children sit beneath. SmartCatalog writes a page's
    address without a closing slash and its children beneath it: Crafton Hills'
    credit-programs, then credit-programs/accounting-acct, then
    accounting-acct/accounting-associate-of-arts-degree (page reads 39090262960
    and 39090533458, S411), and it has no sitemap. child_pages() reads beneath an
    address that ends in a slash, as CourseLeaf writes it."""
    if platform == "smartcatalog" and page_url and not urllib.parse.urlparse(page_url).path.endswith("/"):
        return page_url.split("#")[0].split("?")[0] + "/"
    return page_url


def index_links(reader, start: str, cache: dict) -> list[str]:
    """Without a sitemap: the catalog's front page, and each program index it
    links (the pilot's hub words), read once; every same-site link they hold."""
    front = P.load(reader, start, cache, False)
    hubs = [ln.get("href") for ln in front.get("links") or []
            if P.HUB_WORDS.search(ln.get("text") or "") and not P.NOT_HUB.search(ln.get("text") or "")
            and P.same_site(ln.get("href") or "", start)][:6]
    urls = [ln.get("href") for ln in front.get("links") or []]
    for h in hubs:
        got = P.load(reader, h, cache, False)
        urls.extend(ln.get("href") for ln in got.get("links") or [])
    return [u for u in urls if u]


# ── curriQunet: the catalog's own JSON ─────────────────────────────────────
# A curriQunet catalog draws every view from JSON its scripts fetch from its own
# host, and its menus carry no links (S357, runs 38075620248 and 38076194967 at
# Riverside City). _getNavigation?id=<catalog>&parentId=<node> lists the nodes a
# list holds; _getPage?catalogId=<catalog>&id=<node> returns one node's page,
# whose body carries the lists it shows and, on a program's page, curriculum
# blocks holding each award's requirements as HTML. Riverside City's Degrees and
# Certificates section (5852) shows a tab list (6313) whose Index (6117) shows a
# link list (6323) of 229 program entries, each titled with its awards and local
# codes: "Acting - Associate of Arts Degree and Certificate of Achievement -
# AA1050/AA1050C/CE1050". So the read is one navigation call per list and one
# page call per program, with no rendering and no PDF export.
#
# Chaffey (S369; reads 38202133197 and 38202752228) files the same way with three
# differences. Degrees and Certificates (19210) shows a tab list of an index and
# six schools. A program entry is titled "Business Administration 2.0 for
# Transfer - AS-T Degree", with no local codes, so the award words had to take
# "degree" and AS-T, and A.S. before a space (a dot then a space is no word
# boundary). And the entry holds a child, "Requirements" (19916), whose page
# carries the curriculum; the entry's own page carries only its title. So an
# entry may have children: the read takes each visible child's page as part of
# the entry's page, and a child that is itself a program becomes an entry. The
# first capture (run 38197183697) spent its 80 calls walking every program as a
# section and the Student Classifications and Programs section, and found none.
CQ_CATALOG_ID = re.compile(r"/catalog/(?:_getnavigation\?id=|_getactivecatalogbyid/|_getpage\?catalogid=)(\d+)", re.I)
CQ_SECTION = re.compile(r"degree|certificate|program|major|award", re.I)
CQ_SECTION_FIRST = re.compile(r"degree|certificate", re.I)
CQ_AWARD = re.compile(r"\b(?:associate|certificate|degree|bachelor|noncredit|non-credit)\b"
                      r"|\b(?:a\.\s?[as]\.|a[as]-t)(?!\w)", re.I)
# Navigation and section pages, before any program page. Santa Ana nests its programs under
# department pages (Instructional Programs > department > entry): its walk stopped at 400 calls
# with 27 of its 359 listed programs reached (run 38669940195, S394), where Fresno City listed
# 301 in 172 calls. At 1,200 it finished (837 calls, run 38674963853) and still found 27: its
# titles put the award after a colon, which cq_is_program now reads (S395). The cap bounds a
# walk gone wrong; each call still waits the census delay.
CQ_MAX_CALLS = 1200
CQ_MAX_CHILDREN = 4       # an entry's own child pages read (Chaffey's Requirements)
CQ_MAX_DEPTH = 4
CQ_BREAK = re.compile(r"<\s*(?:br|/p|/div|/tr|/li|/h[1-6]|/table)\b[^>]*>", re.I)


# Berkeley City and Butte (S399; read 38935112500, 38935116675, page read 38942920358):
# a start page's scripts first ask _getNavigation?id=0, an empty placeholder, and name
# the catalog (10327, 14) only in later calls. Id 0 is never a catalog.
def cq_catalog_id(urls: list[str]) -> int | None:
    """The catalog id the catalog's own scripts asked for while its start page loaded."""
    for u in urls:
        m = CQ_CATALOG_ID.search(u or "")
        if m and int(m.group(1)):
            return int(m.group(1))
    return None


# San Diego City (S369; reads 38203841691 and 38204183571): the registry's start
# page, a district alias view (catalog/alias/city26-27/iq/15489), draws an empty
# "Active Catalogs" shell in a headless browser and fetches nothing, so no
# catalog id is heard. The host's own list names it: _getCatalogs gives
# "City 2026-2027" 69, "Mesa 2026-2027" 70, "Miramar 2026-2027" 71. The catalog
# whose title's words all appear in the college's name, in the registry's year,
# is the one read.
CQ_YEAR = re.compile(r"\b(?:19|20)\d\d\s*[-/]\s*(?:(?:19|20)?\d\d)\b")
# Gavilan (S399, page read 38942920358): its alias start page lists the active
# catalogs and fetches nothing, and _getCatalogs titles the year's catalog "Gavilan
# College Catalog 2026-2027" beside two addenda. "Catalog" names the thing listed, not
# a college, so it is not one of the words a title must share with the college's name.
CQ_TITLE_GENERIC = {"catalog"}


def cq_catalog_from_list(catalogs, college: str, year: str | None) -> int | None:
    """The id of the one catalog in a host's _getCatalogs list that names this
    college (every word of its title, the year and the word "catalog" aside, is a
    word of the college's name) and, where the title carries a year, the
    registry's year. None when no catalog or more than one does."""
    words = set(re.findall(r"[a-z]+", (college or "").lower()))
    want = re.sub(r"\D", "", year or "")
    hits = []
    for c in catalogs if isinstance(catalogs, list) else []:
        title = c.get("Title") or ""
        y = CQ_YEAR.search(title)
        named = set(re.findall(r"[a-z]+", CQ_YEAR.sub(" ", title).lower())) - CQ_TITLE_GENERIC
        if not named or not named <= words or c.get("IsDeleted"):
            continue
        if y and want and re.sub(r"\D", "", y.group(0)) not in (want, want[:4] + want[-2:]):
            continue
        hits.append(c.get("Id"))
    return int(hits[0]) if len(hits) == 1 and hits[0] is not None else None


def cq_base(start: str) -> tuple[str, str]:
    """(the host root, the view prefix a node's aliaspath follows): Riverside City's
    https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5842/6111 gives
    https://rccd.curriqunet.com and .../catalog/alias/rcc-catalog/iq/."""
    u = urllib.parse.urlparse(start)
    root = "%s://%s" % (u.scheme or "https", u.netloc)
    path = u.path or "/"
    i = path.lower().find("/iq/")
    prefix = root + (path[:i] if i >= 0 else "/catalog") + "/iq/"
    return root, prefix


def cq_text(html_text: str) -> str:
    """A block's HTML as the lines a reader sees: a break at each paragraph, row,
    item and heading, tags dropped, entities read, blank lines removed."""
    import html as _html
    t = CQ_BREAK.sub("\n", html_text or "")
    t = re.sub(r"<[^>]+>", " ", t)
    t = _html.unescape(t).replace("\xa0", " ")
    lines = (re.sub(r"[ \t\r\f\v]+", " ", ln).strip() for ln in t.split("\n"))
    return "\n".join(ln for ln in lines if ln)


# RCCD's seven Liberal Arts emphasis degrees name each subject once and then
# its course numbers alone: "Mathematics (MATH): C2210, C2210H, 5, 9" and
# "Biology (BIO) 1, 1H, 4". Read as printed, the page names no listed course
# but the first of each line, so no emphasis found a page at any of the three
# colleges (21 programs, S358's reads; the Math and Science page, run
# 38092480434). Each number is read with its subject: "MATH C2210, MATH 5".
# A number followed by "units" or "hours" is a quantity, never a course. A
# number may lead with a letter: Kinesiology's activity courses are A03, V01,
# A31A and Dance's D10, so a list read only after a C stopped at the first of
# them, and Kinesiology, Health and Wellness still found no page (S359).
CQ_NUM = r"[A-Z]?\d{1,4}(?:\.\d{1,2})?[A-Z]{0,3}\d{0,2}\b"
CQ_SEP = r"(?:[ \t]*,[ \t]*(?:and[ \t]+|or[ \t]+)?|[ \t]+(?:and|or)[ \t]+)"
CQ_SUBJECT_LIST = re.compile(r"\(([A-Z][A-Z&]{1,7})\)([ \t]*:?[ \t]*)(%s(?:%s%s)*)(?![ \t]*(?i:units?|hours?|credits?)\b)"
                             % (CQ_NUM, CQ_SEP, CQ_NUM))


def cq_subject_lists(text: str) -> str:
    """Each bare course number after a subject's code in parentheses, read with
    that code. A line that already writes "CIS 5" is left as it stands."""
    def one(m):
        listed = re.sub(CQ_NUM, lambda n: "%s %s" % (m.group(1), n.group(0)), m.group(3))
        return "(%s)%s%s" % (m.group(1), m.group(2), listed)
    return CQ_SUBJECT_LIST.sub(one, text or "")


def cq_page_text(page: dict) -> tuple[str, str]:
    """(the node's title, its page's text): the title, then every block in order."""
    node = (page or {}).get("page") or {}
    title = (node.get("text") or "").strip()
    parts = [title]
    for b in (page or {}).get("body") or []:
        head = (b.get("catalogblockheader") or "").strip()
        body = cq_subject_lists(cq_text(b.get("text") or ""))
        if head and head not in parts:
            parts.append(head)
        if body:
            parts.append(body)
    return title, "\n".join(p for p in parts if p)


def cq_lists(page: dict) -> list[dict]:
    """The lists a node's page shows (a tab list, a link list)."""
    return [nl for b in (page or {}).get("body") or [] for nl in (b.get("navlist") or [])]


def cq_is_program(nav: dict) -> bool:
    """A program entry: its title names an award after a dash, as the index
    writes them, or after its last colon, as Santa Ana writes them ("Accounting:
    A.S. Degree" under the Accounting department; page read 38749570529, S395).
    "Degrees and Certificates Explained" names no award and has no dash, nor does
    the index; "Degrees and Certificates: Explained" names none after its colon.
    Riverside City's entries are leaves; Chaffey's each hold a Requirements
    child, which cq_pages reads as part of the entry."""
    text = nav.get("text") or ""
    if " - " in text and CQ_AWARD.search(text):
        return True
    if cq_name_award(text)[1]:
        return True
    head, colon, tail = text.rpartition(": ")
    return bool(colon and head.strip() and CQ_AWARD.search(tail))


# Butte (S401, page reads 38977301962 and 38977912351) titles one program two
# ways, once in each of its program sections: "AS Degree in Automotive
# Technology" under Programs by Subject, "Automotive Technology (AS Degree)" under
# Programs by Communities of Interest. Neither has a dash or a colon, so its walk
# read 542 nodes and took 18 entries (those that happened to carry one) for 168
# programs. The award leads before " in ", or closes the title in parentheses.
# The award words are singular: "Degrees and Certificates in Business" is a list.
CQ_AWARD_LEAD = re.compile(
    r"^((?:[A-Z]{2}(?:-T)?|A\.[AS]\.(?:-T)?|associate(?: of \w+)?|noncredit)?\s*"
    r"(?:degree|certificate)(?: of \w+)?(?: for transfer)?)\s+in\s+(\S.*)$", re.I)
CQ_AWARD_PAREN = re.compile(r"^(\S.*?)\s*\(([^()]*\b(?:degree|certificate)\b[^()]*)\)\s*$", re.I)
# Las Positas (S401, page read 38982439886) puts the award after the name's last
# comma: "Liberal Arts & Sciences: Mathematics and Science, Associate of Arts (AA)".
# Only the 20 whose names also carry a colon were taken (20 of 201 found, run
# 38979338956). A name holds commas too ("Film, Television & Electronic Media"),
# so the words after the last comma must open with an award.
CQ_AWARD_COMMA = re.compile(
    r"^(\S.*),\s+((?:associate|certificate|noncredit|bachelor)\b.*|(?-i:(?:A\.[AS]\.|A[AS])(?:-T)?)(?:\s.*)?)$", re.I)


def cq_name_award(text: str) -> tuple[str, str | None]:
    """(the program's name, its award) from a title that leads with its award
    before " in ", closes with it in parentheses, or names it after its last
    comma; else (the title, None)."""
    text = (text or "").strip()
    m = CQ_AWARD_LEAD.match(text)
    if m:
        return m.group(2).strip(), m.group(1).strip()
    m = CQ_AWARD_PAREN.match(text)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    m = CQ_AWARD_COMMA.match(text)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return text, None


def cq_hidden(nav: dict) -> bool:
    """A node the catalog keeps out of its web view (Chaffey's blank sibling of
    each Requirements node), or one with no title."""
    if not (nav.get("text") or "").strip():
        return True
    try:
        cfg = json.loads(nav.get("config") or "{}")
    except (TypeError, ValueError):
        return False
    return bool(((cfg or {}).get("nodeConfig") or {}).get("excludeFromWebView"))


def cq_index(get, catalog: int, root: str) -> tuple[list[dict], dict]:
    """Every program entry under the catalog's degree and certificate sections,
    by id, in the order found; and the account of the walk. `get(url)` returns
    the JSON at url, or None."""
    top = get("%s/Catalog/_getNavigation?id=%d&navigationtypeId=1" % (root, catalog)) or {}
    sections = [n for n in top.get("navs") or [] if CQ_SECTION.search(n.get("text") or "")]
    # Degrees and certificates first: Chaffey's Student Classifications and
    # Programs section comes before it and holds no program.
    sections.sort(key=lambda n: not CQ_SECTION_FIRST.search(n.get("text") or ""))
    entries: dict[int, dict] = {}
    seen: set = set()
    calls = 1
    queue = [(n, 0) for n in sections]
    while queue and calls < CQ_MAX_CALLS:
        node, depth = queue.pop(0)
        if node.get("id") in seen:
            continue
        seen.add(node.get("id"))
        page = get("%s/Catalog/_getPage?catalogId=%d&id=%s" % (root, catalog, node.get("id")))
        calls += 1
        for nl in cq_lists(page):
            if calls >= CQ_MAX_CALLS:
                break
            kids = get("%s/Catalog/_getNavigation?id=%d&parentId=%s" % (root, catalog, nl.get("id"))) or {}
            calls += 1
            for k in kids.get("navs") or []:
                if cq_is_program(k):
                    entries.setdefault(k.get("id"), k)
                elif k.get("haschildbodynavs") and depth + 1 < CQ_MAX_DEPTH:
                    queue.append((k, depth + 1))
    account = {"catalog": catalog, "sections": [n.get("text") for n in sections],
               "nodes_read": len(seen), "calls": calls, "entries": len(entries),
               "stopped_at_cap": calls >= CQ_MAX_CALLS}
    return list(entries.values()), account


# A curriQunet catalog can list one program under two index entries: Norco's
# Kinesiology, Health & Wellness A.A. is 5545 ("... - (AOE) NAA498/C") and 5552
# ("... (AOE) - NAA498/C"). Read as two pages, the A.A. took one and the
# Kinesiology A.A.-T took the other, an emphasis page with none of its
# requirements (S359, run 38095619629). Entries naming the same local award
# codes are one page when programs compete for it (assign() groups claims by
# it), so the program whose award the page names keeps it.
CQ_LOCAL_CODE = re.compile(r"\b[A-Z]{1,4}\d{2,5}[A-Z]?(?:/[A-Z0-9]{1,8})*\b")


def cq_group(title: str, url: str) -> str:
    """The local award codes an index title ends with, or the page's own address."""
    tail = (title or "").rsplit(" - ", 1)[-1]
    codes = sorted(set(CQ_LOCAL_CODE.findall(tail)))
    return "codes:" + "+".join(codes) if codes else url


def cq_title_key(nav: dict) -> str:
    """An entry's title as one key: case, spacing and dashes folded, and Butte's
    two forms of one program ("AS Degree in X", "X (AS Degree)") one key."""
    name, award = cq_name_award(nav.get("text") or "")
    text = "%s (%s)" % (name, award) if award else name
    return "title:" + re.sub(r"[\s\u2013\u2014-]+", " ", text.lower()).strip()


def cq_distinct(entries: list[dict]) -> tuple[list[dict], int]:
    """Each program entry once. Chaffey lists every program in its index and
    again under its school, under two ids with one title (401 entries for 202
    programs, 1,226 loads in run 38203335820); the first is read."""
    out, keys = [], set()
    for e in entries:
        k = cq_title_key(e)
        if k in keys:
            continue
        keys.add(k)
        out.append(e)
    return out, len(entries) - len(out)


# San Diego Mesa's special-admission programs (S374, reads 38320823942 and
# 38321027873) show six tabs: Summary, Accreditation, Directed Clinical Practice
# Requirement, Admission Criteria, Requirements, Courses. Read in order under the
# cap of four, the Requirements tab was never read and nine programs (Radiologic
# Technology, Dental Assisting and the rest) scored no course at all. A tab titled
# Requirements is read first.
CQ_REQ_TAB = re.compile(r"^\s*(?:program\s+)?requirements\s*$", re.I)


def cq_children(get, catalog: int, root: str, page: dict) -> tuple[list[dict], list[dict]]:
    """(the entry's own child pages, the program entries among its children):
    the visible nodes the entry's page lists, read once each, up to
    CQ_MAX_CHILDREN, a Requirements tab first. `get(url)` returns the JSON at
    url, or None."""
    own, more = [], []
    for nl in cq_lists(page):
        kids = get("%s/Catalog/_getNavigation?id=%d&parentId=%s" % (root, catalog, nl.get("id"))) or {}
        visible = []
        for k in kids.get("navs") or []:
            if cq_is_program(k):
                more.append(k)
            elif not cq_hidden(k):
                visible.append(k)
        visible.sort(key=lambda k: not CQ_REQ_TAB.match(k.get("text") or ""))
        for k in visible:
            if len(own) >= CQ_MAX_CHILDREN:
                break
            child = get("%s/Catalog/_getPage?catalogId=%d&id=%s" % (root, catalog, k.get("id")))
            if child:
                own.append(child)
    return own, more


def cq_page(entry: dict, page: dict | None, prefix: str, children: list | None = None) -> dict | None:
    """One program entry's page in the shape assign() reads, its own child
    pages (Chaffey's Requirements) read after it."""
    if not page:
        return None
    title, text = cq_page_text(page)
    for child in children or []:
        text = "\n".join(t for t in (text, cq_page_text(child)[1]) if t)
    title = title or (entry.get("text") or "")
    url = prefix + (entry.get("aliaspath") or str(entry.get("id")))
    got = {"final_url": url, "title": title, "h1": title, "body": text, "content": text,
           "status": 200, "access": "ok", "links": []}
    return {"url": url, "title": title, "h1": title, "body": text, "content": text, "got": got,
            "codes": page_codes(text), "node": entry.get("id"), "group": cq_group(entry.get("text") or title, url)}


# A dropped connection loses a whole branch of the walk: Las Positas's two
# ECONNRESETs mid-walk left 20 of 201 programs found (run 38935144431, S399), and
# Butte's three left nodes unread (run 38948140330). A reset is the host's
# moment, not its answer, so the call is made again after a longer wait, at
# most CQ_RETRIES times; an HTTP status or any other error is final.
CQ_RETRIES = 2
CQ_RETRY_WAIT = 4          # the census delay, times this, before a retry
CQ_DROPPED = re.compile(r"ECONNRESET|socket hang up|ECONNABORTED|EPIPE", re.I)


def cq_json(reader, url: str, errors: list) -> dict | None:
    """One JSON call through the census's rules: robots first, the delay, one
    load; a dropped connection is tried again, slower."""
    from _program_source_census import robots_allows
    if not robots_allows(reader._robots_for(url), url):
        errors.append("%s: robots disallows" % url)
        return None
    for attempt in range(CQ_RETRIES + 1):
        time.sleep(reader.delay * (CQ_RETRY_WAIT if attempt else 1))
        reader.loads += 1
        try:
            resp = reader.request.get(url, timeout=60000)
            if not resp.ok:
                errors.append("%s: HTTP %s" % (url, resp.status))
                return None
            return resp.json()
        except Exception as exc:
            msg = str(exc).splitlines()[0][:160]
            if CQ_DROPPED.search(msg) and attempt < CQ_RETRIES:
                errors.append("%s: %s (tried again)" % (url, msg))
                continue
            errors.append("%s: %s" % (url, msg))
            return None
    return None


def cq_pages(reader, start: str, report: dict) -> list[dict]:
    """The catalog's program pages, read as its own JSON: the start page loads
    once in the browser so the catalog's scripts name its id, then the index
    walk, then one page call per program entry."""
    heard: list = []

    def on_response(resp):
        heard.append(resp.url)
    reader.page.on("response", on_response)
    try:
        reader.load(start)
        reader.page.wait_for_timeout(3000)
    finally:
        reader.page.remove_listener("response", on_response)
    catalog = cq_catalog_id(heard)
    root, prefix = cq_base(start)
    errors: list = []
    report["curriqunet"] = {"catalog": catalog, "view_prefix": prefix, "errors": errors}
    if catalog is None:
        catalog = cq_catalog_from_list(cq_json(reader, root + "/catalog/_getCatalogs", errors),
                                       report.get("college"), report.get("catalog_year"))
        report["curriqunet"].update(catalog=catalog, catalog_from="_getCatalogs")
    if catalog is None:
        report["curriqunet"]["stopped"] = "the start page's scripts named no catalog id, nor did the host's catalog list"
        return []
    entries, account = cq_index(lambda u: cq_json(reader, u, errors), catalog, root)
    report["curriqunet"].update(account)
    pages = []
    get = lambda u: cq_json(reader, u, errors)  # noqa: E731
    entries, dropped = cq_distinct(entries)
    report["curriqunet"]["same_title_entries"] = dropped
    queue, seen, i = list(entries), {e.get("id") for e in entries} | {cq_title_key(e) for e in entries}, 0
    while i < len(queue) and i < MAX_PAGES:
        e = queue[i]
        i += 1
        page = get("%s/Catalog/_getPage?catalogId=%d&id=%s" % (root, catalog, e.get("id")))
        children = []
        if page and e.get("haschildbodynavs"):
            children, more = cq_children(get, catalog, root, page)
            for m in more:
                if m.get("id") not in seen and cq_title_key(m) not in seen:
                    seen.update((m.get("id"), cq_title_key(m)))
                    queue.append(m)
        pg = cq_page(e, page, prefix, children)
        if pg:
            pages.append(pg)
        if i % 50 == 0:
            print("  read %d of %d program pages" % (i, len(queue)), flush=True)
    report["curriqunet"]["entries_read"] = i
    del errors[40:]
    return pages


# ── eLumen: the catalog's side menu ────────────────────────────────────────
# An eLumen catalog is a single-page app: each view draws its content from one
# call to api-prod.elumenapp.com/catalog/sites/publish/<catalog>,<path...>
# ?tenant=<host> (S380, read 38392014238 at Bakersfield and Palo Verde). Every
# view carries the catalog's side menu, which links each program's page at
# /catalog/<catalog>/program/<slug>, the slug ending in the term it took effect
# ("Agricultural Education Associate of Science" -> .../program/agricultural-
# education-associate-of-science-fall-2026). There is no programs view
# (/programs answers "Catalog is not Published"). So the program index is the
# menu's links, from the start page and the "Programs of Study" page it links,
# and each program page is read rendered, as a CourseLeaf page is.
EL_PROGRAM_PATH = re.compile(r"^/catalog/([^/]+)/program/[^/]+/?$", re.I)
EL_MAX_HUBS = 3


def el_catalog(start: str) -> str | None:
    """The catalog's own slug: 2026-2027-Catalog in
    https://bakersfield.elumenapp.com/catalog/2026-2027-Catalog/about-bc."""
    m = re.match(r"^/catalog/([^/]+)", urllib.parse.urlparse(start or "").path or "", re.I)
    return m.group(1) if m else None


def el_program_urls(links: list, start: str) -> list[str]:
    """The program pages a view's links name, in this catalog only, each once, in
    the menu's order, with no query or fragment."""
    want = (el_catalog(start) or "").lower()
    out, seen = [], set()
    for ln in links or []:
        href = (ln.get("href") if isinstance(ln, dict) else ln) or ""
        u = urllib.parse.urlparse(href.split("#")[0])
        m = EL_PROGRAM_PATH.match(u.path or "")
        if not m or not want or m.group(1).lower() != want or not P.same_site(href, start):
            continue
        url = "%s://%s%s" % (u.scheme or "https", u.netloc, u.path.rstrip("/"))
        if url not in seen:
            seen.add(url)
            out.append(url)
    return out


def el_hubs(links: list, start: str) -> list[str]:
    """The program index pages a view links ("Programs of Study"), in this
    catalog, never a program page itself."""
    want = "/catalog/%s/" % (el_catalog(start) or "").lower()
    out = []
    for ln in links or []:
        href, text = (ln.get("href") or "").split("#")[0], ln.get("text") or ""
        path = (urllib.parse.urlparse(href).path or "").lower()
        if (P.HUB_WORDS.search(text) and not P.NOT_HUB.search(text) and P.same_site(href, start)
                and path.startswith(want) and not EL_PROGRAM_PATH.match(path) and href not in out):
            out.append(href)
    return out[:EL_MAX_HUBS]


def el_pages(reader, start: str, cache: dict, report: dict) -> list[str]:
    """The catalog's program pages: the start page's menu, then each program
    index page it links, read once, rendered."""
    front = P.load(reader, start, cache, True)
    urls = el_program_urls(front.get("links"), start)
    hubs = el_hubs(front.get("links"), start)
    for h in hubs:
        got = P.load(reader, h, cache, True)
        urls += [u for u in el_program_urls(got.get("links"), start) if u not in urls]
    report["elumen"] = {"catalog": el_catalog(start), "start_status": front.get("status"),
                        "from_start": len(el_program_urls(front.get("links"), start)),
                        "hubs": hubs, "program_pages": len(urls)}
    return urls[:MAX_PAGES]


# The rendered read is slow: every view loads the ~4.5 MB publish call (the
# catalog's styles, its whole side menu and the page) and then waits for the page
# to settle, and Bakersfield's first capture (run 38393763513) was still reading
# at 2.5 hours. Read 38413232841 showed the menu's own links load a page through a
# lighter call, publish/content/<catalog>,<path>?tenant=<host>, and that a
# program's requirements print in that page as rule-name / rule-credits blocks
# under Program Requirements. So the fast read makes the full publish call once,
# for the menu's program links, then one content call per program: the same
# calls the catalog's own scripts make, with no rendering.
EL_API = "https://api-prod.elumenapp.com"
EL_STRIP = re.compile(r"<(style|script|svg)\b[^>]*>.*?</\1\s*>", re.I | re.S)
EL_HEADING = re.compile(r"<h[1-3]\b[^>]*>(.*?)</h[1-3]\s*>", re.I | re.S)


def el_publish_url(start: str, parts: list[str], content: bool = False) -> str:
    """The publish call for a view of this catalog: the full one (styles, menu
    and page) or the content one (the page alone)."""
    u = urllib.parse.urlparse(start)
    url = "%s/catalog/sites/%s/%s?tenant=%s" % (
        EL_API, "publish/content" if content else "publish",
        ",".join([el_catalog(start) or ""] + list(parts)), u.netloc)
    return url if content else url + "&api=" + EL_API + ":443"


def el_start_parts(start: str) -> list[str]:
    """The start view's path after its catalog: ["about-bc"] for
    /catalog/2026-2027-Catalog/about-bc."""
    path = (urllib.parse.urlparse(start).path or "").strip("/").split("/")
    return [p for p in path[2:] if p] or ["home"]


def el_html(body: str | None) -> str:
    """A publish call's page: the html field of its JSON, or the body itself."""
    try:
        data = json.loads(body or "")
    except (TypeError, ValueError):
        return body or ""
    if isinstance(data, dict):
        return data.get("html") or data.get("content") or ""
    return data if isinstance(data, str) else ""


# Los Medanos (S402, page read 38997368468): the menu writes its links relative
# (href="26-27/courses"), but a page's own topic list writes them whole, with the
# host and a fragment: href="https://lmc.elumenapp.com/catalog/26-27/degrees#mainContent".
# The relative-only pattern never saw degrees, so the walk stopped at 7 of 97
# (run 38986123746). A link to this catalog may be relative, rooted at /catalog/, or
# whole on the catalog's own host, and may end in a query or a fragment.
EL_HREF_END = r'(?:[?#][^"]*)?"'


def el_href(catalog: str, host: str = "") -> str:
    """The start of an href into this catalog, as a pattern: href="26-27/,
    href="/catalog/26-27/ or href="https://<host>/catalog/26-27/."""
    whole = r"(?:https?://%s)?" % re.escape(host) if host else ""
    return r'href="(?:%s/catalog/)?%s/' % (whole, re.escape(catalog or ""))


def el_program_slugs(html_text: str, catalog: str, host: str = "") -> list[str]:
    """The program slugs a publish call's menu links, each once, in order. The
    menu writes them relative to /catalog/: href="2026-2027-Catalog/program/<slug>"."""
    pat = re.compile(el_href(catalog, host) + r'program/([^"/?#]+)' + EL_HREF_END, re.I)
    out = []
    for slug in pat.findall(html_text or ""):
        if slug not in out:
            out.append(slug)
    return out


def el_department_slugs(html_text: str, catalog: str, host: str = "") -> list[str]:
    """The department slugs a publish call's menu links, each once, in order.
    Cabrillo's menu links departments (href="2026-2027/department/accounting"), not
    programs; each department's content call links its programs at
    2026-2027/program/<slug> (reads 38433649784, 38437381277, S381)."""
    pat = re.compile(el_href(catalog, host) + r'department/([^"/?#]+)' + EL_HREF_END, re.I)
    out = []
    for slug in pat.findall(html_text or ""):
        if slug not in out:
            out.append(slug)
    return out


# A menu that names neither programs nor departments links hub pages one segment
# under the catalog, each listing programs at <catalog>/program/<slug>: Modesto's
# Programs A-Z and Programs by Type (2026-2027/programs, bytype), Palo Verde's award
# categories (2025-2026/adt, associate-of-arts-degrees, certificate-of-achievements,
# non-credit-certificates). Reads 38445240921, 38446053107 and S382's third read.
EL_HUB_SLUG = re.compile(
    r"^(?:programs?(?:-a-z|-by-type)?|bytype|majors?|adts?|associate-(?:of|in)-[a-z0-9-]+|"
    r"certificates?-(?:of|in)-[a-z0-9-]+|[a-z0-9-]*-(?:degrees?|certificates?)|"
    r"degrees?-(?:and-)?certificates?)$", re.I)
EL_MAX_MENU_HUBS = 12


def el_hub_slugs(html_text: str, catalog: str, host: str = "") -> list[str]:
    """The program and award hubs a publish call's menu links, one segment under
    the catalog, each once, in order, at most EL_MAX_MENU_HUBS."""
    pat = re.compile(el_href(catalog, host) + r'([^"/?#]+)' + EL_HREF_END, re.I)
    out = []
    for slug in pat.findall(html_text or ""):
        if EL_HUB_SLUG.match(slug) and slug not in out:
            out.append(slug)
    return out[:EL_MAX_MENU_HUBS]


def el_text(html_text: str) -> str:
    """A content call's page as the lines a reader sees, without styles, scripts
    or icons."""
    return cq_text(EL_STRIP.sub(" ", html_text or ""))


def el_page(start: str, slug: str, html_text: str) -> dict | None:
    """One program's page in the shape assign() reads."""
    text = el_text(html_text)
    if not text:
        return None
    m = EL_HEADING.search(EL_STRIP.sub(" ", html_text or ""))
    title = cq_text(m.group(1)).replace("\n", " ") if m else slug.replace("-", " ")
    u = urllib.parse.urlparse(start)
    url = "%s://%s/catalog/%s/program/%s" % (u.scheme or "https", u.netloc, el_catalog(start), slug)
    got = {"final_url": url, "title": title, "h1": title, "body": text, "content": text,
           "status": 200, "access": "ok", "links": []}
    return {"url": url, "title": title, "h1": title, "body": text, "content": text, "got": got,
            "codes": page_codes(text)}


def el_fetch(reader, url: str, errors: list) -> str | None:
    """One publish call through the census's rules: robots first, the delay, one load."""
    from _program_source_census import robots_allows
    if not robots_allows(reader._robots_for(url), url):
        errors.append("%s: robots disallows" % url)
        return None
    time.sleep(reader.delay)
    reader.loads += 1
    try:
        resp = reader.request.get(url, timeout=120000)
        if not resp.ok:
            errors.append("%s: HTTP %s" % (url, resp.status))
            return None
        return resp.text()
    except Exception as exc:
        errors.append("%s: %s" % (url, str(exc).splitlines()[0][:160]))
        return None


# Every source adds to the list. Lake Tahoe's menu links its 16 transfer degrees and,
# beside them, its departments (2026-2027/department/program-art); the read stopped at
# the menu's programs and found 16 of 83 (run 38978047103). Los Medanos's menu links
# neither: its departments are pages one segment under the catalog (26-27/art), listed
# on 26-27/degrees, and each links its programs; from the Art start page the read found
# Art's 7 of 97 (run 38978063188; page reads 38978810670, 38979564864, S401). So when
# the list still falls short of the programs the state file names, the read walks the
# menu's other pages one segment under the catalog and the pages they link, three steps
# deep (courses > degrees > art), taking every program each links, at most EL_WALK_CALLS
# content calls.
EL_WALK_SHORT = 0.8        # walk when fewer program pages than this share of the closed lists
EL_WALK_CALLS = 250
EL_WALK_DEPTH = 3          # menu page, its topic (26-27/degrees), the department it lists


# Los Medanos (S401, page reads 38979564864 and 38982992603): the walk read the
# start page's 11 menu pages and found nothing (run 38982485062). A publish call
# carries the menu opened around its own page, so the start page's menu holds the
# top level alone, and a content call holds no menu: "courses" lists its topics
# (Degrees, Certificates & Programs of Study, 26-27/degrees) only in its own full
# call. And degrees links its departments one segment down (26-27/art) or two
# (26-27/childdevelopment/earlychildhoodeducation). So a page whose address or link
# names programs (a course does not: Understanding Course Descriptions is no hub) is
# read through its full call when its content names nothing, the walk takes such
# pages first, and a page may sit two segments under the catalog.
EL_HUB_LIKE = re.compile(r"program|degree|certificate|major|department|discipline|area|pathway|award", re.I)
EL_NOT_PAGE = re.compile(r"^(?:program|course|department|search)(?:/|$)", re.I)


def el_page_links(html_text: str, catalog: str, host: str = "") -> list[tuple[str, str]]:
    """Every page a publish call links one or two segments under the catalog, as
    (path, link text), each once, in order: a subject (current/aj), a department
    listing (26-27/degrees), a department two down, a policy. A program, course or
    department page is never one."""
    pat = re.compile(r'<a\b[^>]*?' + el_href(catalog, host) + r'([^"/?#]+(?:/[^"/?#]+)?)' + EL_HREF_END +
                     r'[^>]*>(.*?)</a\s*>', re.I | re.S)
    out, seen = [], set()
    for path, text in pat.findall(html_text or ""):
        if path in seen or EL_NOT_PAGE.match(path):
            continue
        seen.add(path)
        out.append((path, re.sub(r"<[^>]+>|\s+", " ", text).strip()))
    return out


def el_hub_first(links: list[tuple[str, str]], depth: int) -> list[tuple[str, int]]:
    """The links as (path, depth), those whose path or text names programs first."""
    hub = [(p, depth) for p, t in links if EL_HUB_LIKE.search(p) or EL_HUB_LIKE.search(t)]
    return hub + [(p, depth) for p, t in links if (p, depth) not in hub]


def el_walk(reader, start: str, shell: str, catalog: str, slugs: list[str], skip: set,
            errors: list) -> dict:
    """Adds to slugs every program the menu's pages link, and the pages they link,
    EL_WALK_DEPTH steps deep, hub-like pages first; the account of the walk."""
    host = urllib.parse.urlparse(start).netloc
    links = el_page_links(shell, catalog, host)
    hubs = {p for p, t in links if EL_HUB_LIKE.search(p) or EL_HUB_LIKE.search(t)}
    queue = [(p, d) for p, d in el_hub_first(links, 1) if p not in skip]
    seen = skip | {p for p, _ in queue}
    calls, menus, before = 0, 0, len(slugs)
    while queue and calls < EL_WALK_CALLS:
        path, depth = queue.pop(0)
        page = el_html(el_fetch(reader, el_publish_url(start, path.split("/"), content=True), errors))
        calls += 1
        found = [p for p in el_program_slugs(page, catalog, host) if p not in slugs]
        slugs += found
        if depth >= EL_WALK_DEPTH:
            continue
        more = [(p, t) for p, t in el_page_links(page, catalog, host) if p not in seen]
        if not found and not more and path in hubs and calls < EL_WALK_CALLS:
            # The page's own full call: the menu opened around it (Los Medanos's courses).
            page = el_html(el_fetch(reader, el_publish_url(start, path.split("/")), errors))
            calls += 1
            menus += 1
            more = [(p, t) for p, t in el_page_links(page, catalog, host) if p not in seen]
        for p, t in more:
            if EL_HUB_LIKE.search(p) or EL_HUB_LIKE.search(t):
                hubs.add(p)
        add = el_hub_first(more, depth + 1)
        seen.update(p for p, _ in add)
        # Hub-like pages one step down go ahead of the plain pages still waiting.
        lead = [x for x in add if x[0] in hubs]
        queue = lead + queue + [x for x in add if x[0] not in hubs]
    return {"walk_pages": calls, "walk_menus": menus, "walk_programs": len(slugs) - before,
            "walk_stopped_at_cap": bool(queue)}


def el_pages_fast(reader, start: str, report: dict) -> list[dict]:
    """The catalog's program pages from its own publish calls: the full call
    once for the menu, then the content call per program. An empty list sends
    capture() to the rendered read."""
    errors: list = []
    catalog = el_catalog(start)
    shell = el_html(el_fetch(reader, el_publish_url(start, el_start_parts(start)), errors))
    host = urllib.parse.urlparse(start).netloc
    slugs = el_program_slugs(shell, catalog, host)
    report["elumen"] = {"catalog": catalog, "read": "publish/content", "menu_programs": len(slugs),
                        "errors": errors}
    # A menu of departments (Cabrillo): each department's content call lists its programs.
    depts = el_department_slugs(shell, catalog, host)
    for d in depts:
        page = el_html(el_fetch(reader, el_publish_url(start, ["department", d], content=True), errors))
        slugs += [s for s in el_program_slugs(page, catalog, host) if s not in slugs]
    report["elumen"].update(menu_departments=len(depts), department_programs=len(slugs))
    # A menu of program and award hubs (Modesto, Palo Verde): each hub's content call lists its programs.
    hubs = el_hub_slugs(shell, catalog, host)
    for h in hubs:
        page = el_html(el_fetch(reader, el_publish_url(start, [h], content=True), errors))
        slugs += [s for s in el_program_slugs(page, catalog, host) if s not in slugs]
    report["elumen"].update(menu_hubs=hubs, hub_programs=len(slugs))
    want = report.get("with_closed_list") or 0
    if want and len(slugs) < EL_WALK_SHORT * want:
        report["elumen"].update(el_walk(reader, start, shell, catalog, slugs,
                                        set(hubs) | set(el_start_parts(start)), errors))
    slugs = slugs[:MAX_PAGES]
    pages = []
    for i, slug in enumerate(slugs):
        html_text = el_html(el_fetch(reader, el_publish_url(start, ["program", slug], content=True), errors))
        pg = el_page(start, slug, html_text)
        if pg:
            pages.append(pg)
        if i % 50 == 49:
            print("  read %d of %d program pages" % (i + 1, len(slugs)), flush=True)
    report["elumen"]["program_pages"] = len(pages)
    del errors[40:]
    return pages


# ── Coursedog (S414): Merced ────────────────────────────────────────────────
# A Coursedog catalog on a college's own domain (catalog.mccd.edu) draws its
# program search from the vendor: the page POSTs app.coursedog.com/api/v1/cm/
# <school>/programs/search/$filters?catalogId=...&skip=0&limit=20 and prints 20
# of 191 programs. The reader rewrites that call's limit as the page makes it,
# so the page's own headers carry it. Each
# program's page opens on an overview tab (/programs/05000.AA/program-overview-
# aoYks); its Requisites tab prints the list with credits ("ACTG04A Financial
# Accounting (Total Credits 4.0 - 4.0)"; page read 39090533458, S411). The tab's
# suffix is the catalog's template, so the reader learns it from the first
# program and goes straight to it after, back to the overview when it misses.
CD_SEARCH = re.compile(r"/programs/search/", re.I)
CD_LIMIT = 250
CD_REQUISITES = re.compile(r"^\s*requisites\b", re.I)
# The award a program's name ends in, "Accounting (AA)", in the words the award
# matcher reads (P.AWARD_WORDS); a certificate's letters vary by college.
CD_AWARD_WORDS = {"AA": "associate in arts", "AS": "associate in science",
                  "AAT": "associate in arts for transfer", "AST": "associate in science for transfer",
                  "CT": "certificate of achievement", "CA": "certificate of achievement",
                  "CN": "certificate", "CM": "certificate", "CP": "certificate",
                  "NC": "noncredit certificate of completion"}
CD_AWARD = re.compile(r"\(([A-Z]{2,4})\)\s*$")


def cd_award_words(name: str) -> str:
    m = CD_AWARD.search(name or "")
    return CD_AWARD_WORDS.get(m.group(1), "") if m else ""


def cd_search_url(url: str, skip: int, limit: int) -> str:
    """The program search's address with its page moved; the rest as the page asked."""
    for key, val in (("skip", skip), ("limit", limit)):
        if re.search(r"[?&]%s=" % key, url):
            url = re.sub(r"([?&]%s=)[^&#]*" % key, lambda m: m.group(1) + str(val), url)
        else:
            url += ("&" if "?" in url else "?") + "%s=%d" % (key, val)
    return url


def cd_programs(data: dict) -> list[dict]:
    """[{code, name}] from one page of the search's answer, active programs only."""
    out = []
    for row in (data or {}).get("data") or []:
        code = (row.get("code") or row.get("programGroupId") or "").strip()
        if code and (row.get("status") or "Active") == "Active":
            out.append({"code": code, "name": (row.get("catalogDisplayName") or row.get("name") or "").strip()})
    return out


def cd_list(reader, start: str, report: dict) -> list[dict]:
    """Every program the catalog's search names. The page's own search call is
    asked for CD_LIMIT programs instead of 20 (a route rewrites its address), and
    its answer is read as it arrives: the vendor answered a second call made
    without the page's own headers 401 (run 39114886505). Past CD_LIMIT the call is
    made again with every header the page sent."""
    from _program_source_census import site_root
    root = site_root(start).rstrip("/")
    heard: list = []

    def on_route(route):
        req = route.request
        if req.method == "POST" and not heard:
            try:
                heard.append({"url": req.url, "body": req.post_data,
                              "headers": {k: v for k, v in req.all_headers().items()
                                          if not k.startswith(":") and k.lower() not in ("host", "content-length")}})
            except Exception:
                pass
            route.continue_(url=cd_search_url(req.url, 0, CD_LIMIT))
        else:
            route.continue_()
    answers: list = []

    def on_response(resp):
        if CD_SEARCH.search(resp.url) and resp.request.method == "POST" and not answers:
            try:
                answers.append(resp.json())
            except Exception as exc:
                answers.append({"error": str(exc).splitlines()[0][:160]})
    reader.page.route(CD_SEARCH, on_route)
    reader.page.on("response", on_response)
    try:
        reader.load(root + "/programs")
        reader.page.wait_for_timeout(2500)
    finally:
        reader.page.unroute(CD_SEARCH, on_route)
        reader.page.remove_listener("response", on_response)
    info = report.setdefault("coursedog", {"root": root})
    if not heard or not answers or "error" in answers[0]:
        info["error"] = ("the program search made no search call" if not heard
                         else "the search call's answer was not read: %s" % (answers[:1] or "none"))
        return []
    call, errors = heard[0], []
    info["search"] = cd_search_url(call["url"], 0, CD_LIMIT)
    data = answers[0]
    total = int(data.get("listLength") or 0)
    programs = cd_programs(data)
    # The vendor may answer fewer than asked: page on from the rows it gave.
    skip = len(data.get("data") or [])
    while 0 < skip < total:
        time.sleep(reader.delay)
        reader.loads += 1
        try:
            resp = reader.request.post(cd_search_url(call["url"], skip, CD_LIMIT), data=call["body"],
                                       headers=call["headers"], timeout=120000)
            if not resp.ok:
                errors.append("skip %d: HTTP %s" % (skip, resp.status))
                break
            data = resp.json()
        except Exception as exc:
            errors.append("skip %d: %s" % (skip, str(exc).splitlines()[0][:160]))
            break
        programs += [p for p in cd_programs(data) if p["code"] not in {q["code"] for q in programs}]
        if not data.get("data"):
            break
        skip += len(data["data"])
    info.update(listed=total, programs=len(programs), errors=errors)
    return programs


def cd_page(got: dict, prog: dict) -> dict:
    """One Requisites tab as a page capture() reads: the program's name and award
    words as its heading, since the page's title names only the code."""
    heading = " ".join(x for x in (prog["name"], cd_award_words(prog["name"])) if x)
    return {"url": got.get("final_url") or got.get("url"), "title": got.get("title"), "h1": heading,
            "body": got.get("body"), "content": got.get("content"), "got": got, "codes": page_net(got)}


def cd_pages(reader, start: str, report: dict, cache: dict) -> list[dict]:
    from _program_source_census import site_root
    root = site_root(start).rstrip("/")
    programs = cd_list(reader, start, report)[:MAX_PAGES]
    info = report.setdefault("coursedog", {})
    suffix, pages, direct, missed = None, [], 0, []
    for i, prog in enumerate(programs):
        base = "%s/programs/%s" % (root, urllib.parse.quote(prog["code"]))
        got = None
        if suffix:
            got = P.load(reader, base + "/" + suffix, cache, True)
            if got.get("access") == "ok" and (got.get("final_url") or "").rstrip("/").endswith(suffix) \
                    and "Total Credits" in (got.get("body") or ""):
                direct += 1
            else:
                got = None
        if got is None:
            over = P.load(reader, base, cache, True)
            link = next((l["href"] for l in over.get("links") or []
                         if CD_REQUISITES.search(l.get("text") or "") and "/programs/" in (l.get("href") or "")), None)
            if over.get("access") != "ok" or not link:
                missed.append(prog["code"])
                continue
            suffix = suffix or link.rstrip("/").rsplit("/", 1)[-1]
            got = P.load(reader, link, cache, True)
            if got.get("access") != "ok":
                missed.append(prog["code"])
                continue
        got["links"] = (got.get("links") or [])[:50]
        pages.append(cd_page(got, prog))
        if i % 25 == 24:
            print("  read %d of %d program pages" % (i + 1, len(programs)), flush=True)
    # The catalog's own list, kept in the account (S423): a state program read
    # from no page (page_claimed, not_found) is checked against the names the
    # catalog lists, so a program the catalog no longer offers reads as that.
    info.update(requisites_suffix=suffix, program_pages=len(pages), direct=direct, missed=missed[:60],
                catalog=[{"code": p["code"], "name": p["name"]} for p in programs])
    return pages


# ── Acalog (S389): Palo Verde 2026-27, El Camino, San Joaquin Delta ─────────
# An Acalog catalog (Modern Campus) serves every page from one host under a
# catalog id (catoid): content.php?catoid=N&navoid=M for a navigation page,
# preview_program.php?catoid=N&poid=P for a program, sitemap.php?catoid=N for a
# list of every page where the college keeps it on. The reader takes the
# catalog the start page's own links name most, lists its programs from the
# site map and, short of that, from the navigation pages whose names say
# programs, degrees or certificates, and reads each program's print-friendly
# view (the same page without the catalog's menus).
AC_PROGRAM = re.compile(r"preview_program\.php\?(?:[^#\s]*&)?poid=(\d+)", re.I)
AC_CATOID = re.compile(r"[?&]catoid=(\d+)", re.I)
AC_NAV = re.compile(r"content\.php\?(?:[^#\s]*&)?navoid=(\d+)", re.I)
AC_PROGRAM_NAV = re.compile(r"program|degree|certificate|areas? of (?:study|interest)|majors?|pathway", re.I)
AC_MAX_NAVS = 12          # navigation pages read for program links, at most
# Every Acalog page carries a catalog menu (a select naming each catalog the
# college keeps, current and archived). The option for the catoid being read
# names its year; San Joaquin Delta's registry row names none (S391).
AC_CATALOG_MENU_JS = r"""() => Array.from(document.querySelectorAll('select'))
  .filter(s => /catalog/i.test((s.name || '') + ' ' + (s.id || '')))
  .flatMap(s => Array.from(s.options).map(o => [o.value, (o.textContent || '').trim(), o.selected]))"""


# A catalog named by its terms: San Joaquin Delta's current one is "Summer 2026 -
# Summer 2027 College Catalog" (run 38615275825), which the census's pair reader
# does not take. Two years a word or two apart, the second the first plus one.
AC_TERM_SPAN = re.compile(r"(?<!\d)(20\d\d)\D{1,16}?(20\d\d)(?!\d)")


def ac_catalog_year(options: list, catoid: int | None, title: str = "") -> tuple[str | None, str | None]:
    """The year of the catalog being read, and where it came from: the menu's
    option for its catoid, else the option the menu has selected, else the page
    title. Only that one option counts, never the newest year the menu lists."""
    from _program_source_census import parse_catalog_year
    want = str(catoid) if catoid is not None else None
    picks = [o for o in options if want and str(o[0]).strip() == want] or [o for o in options if o[2]]
    for o in picks:
        y = parse_catalog_year(o[1], max_start=2100)
        if not y:
            m = AC_TERM_SPAN.search(o[1] or "")
            if m and int(m.group(2)) == int(m.group(1)) + 1:
                y = "%s-%s" % (m.group(1), m.group(2))
        if y:
            return y, "catalog menu"
    y = parse_catalog_year(title or "", max_start=2100)
    return (y, "page title") if y else (None, None)


def ac_base(start: str, links: list[dict] | None = None) -> str:
    """The catalog's own origin: the scheme its links to its own host use (El
    Camino serves http only, and an https load of its menus was unreachable,
    run 38565157199), else the start address's."""
    u = urllib.parse.urlparse(start)
    for ln in links or []:
        h = urllib.parse.urlparse(ln.get("href") or "")
        if h.netloc.lower() == u.netloc.lower() and h.scheme in ("http", "https"):
            return "%s://%s" % (h.scheme, u.netloc)
    return "%s://%s" % (u.scheme or "https", u.netloc)


def ac_catoid(links: list[dict], start: str) -> int | None:
    """The catalog the start page serves: the catoid its own host's links carry
    most (every menu link names the current catalog; an archived one appears
    once, in the catalog picker)."""
    host = urllib.parse.urlparse(start).netloc.lower()
    counts: dict[int, int] = {}
    for ln in links or []:
        href = ln.get("href") or ""
        if urllib.parse.urlparse(href).netloc.lower() not in ("", host):
            continue
        m = AC_CATOID.search(href)
        if m:
            counts[int(m.group(1))] = counts.get(int(m.group(1)), 0) + 1
    return max(counts, key=lambda c: (counts[c], c)) if counts else None


def ac_program_url(base: str, catoid: int, poid: str | int) -> str:
    return "%s/preview_program.php?catoid=%d&poid=%s&print" % (base, catoid, poid)


def ac_program_urls(links: list[dict], base: str, catoid: int) -> list[str]:
    """The catalog's program pages a page links, once each, in its order, as
    their print-friendly view. A link to another catalog's program is left."""
    out, seen = [], set()
    for ln in links or []:
        href = ln.get("href") or ""
        m = AC_PROGRAM.search(href)
        c = AC_CATOID.search(href)
        if not m or (c and int(c.group(1)) != catoid) or m.group(1) in seen:
            continue
        seen.add(m.group(1))
        out.append(ac_program_url(base, catoid, m.group(1)))
    return out


def ac_program_navs(links: list[dict], base: str, catoid: int) -> list[str]:
    """The navigation pages whose names say programs, degrees or certificates."""
    out = []
    for ln in links or []:
        href, text = ln.get("href") or "", ln.get("text") or ""
        m, c = AC_NAV.search(href), AC_CATOID.search(href)
        if m and (not c or int(c.group(1)) == catoid) and AC_PROGRAM_NAV.search(text):
            u = "%s/content.php?catoid=%d&navoid=%s" % (base, catoid, m.group(1))
            if u not in out:
                out.append(u)
    return out


def ac_urls(reader, start: str, cache: dict, report: dict) -> list[str]:
    """Every program page of the catalog the start page serves."""
    front = P.load(reader, start, cache, False)
    links = front.get("links") or []
    base = ac_base(start, links)
    catoid = ac_catoid(links, start)
    if catoid is None and not start.rstrip("/").endswith("index.php"):
        front = P.load(reader, base + "/index.php", cache, False)
        links = front.get("links") or []
        base = ac_base(start, links)
        catoid = ac_catoid(links, start)
    report["acalog"] = {"base": base, "start_status": front.get("status"), "catoid": catoid,
                        "start_links": len(links)}
    if catoid is None:
        report["acalog"]["stopped"] = "the start page's links name no catalog id"
        return []
    # Read while the reader still shows the start page, before the site map loads.
    options = []
    try:
        options = reader.page.evaluate(AC_CATALOG_MENU_JS) or []
    except Exception as exc:
        report["acalog"]["catalog_menu_error"] = str(exc).splitlines()[0][:200] if str(exc) else type(exc).__name__
    year, year_from = ac_catalog_year(options, catoid, front.get("title") or "")
    report["acalog"].update(catalog_menu=[[o[0], o[1][:60], o[2]] for o in options][:12],
                            catalog_year_read=year, catalog_year_from=year_from)
    report["acalog"]["start_menu"] =[[(ln.get("text") or "")[:60], ln.get("href")] for ln in links
                                      if AC_NAV.search(ln.get("href") or "")][:40]
    sm = P.load(reader, "%s/sitemap.php?catoid=%d" % (base, catoid), cache, False)
    urls = ac_program_urls(sm.get("links") or [], base, catoid) if sm.get("access") == "ok" else []
    report["acalog"].update(sitemap_status=sm.get("status"), sitemap_access=sm.get("access"),
                            sitemap_programs=len(urls))
    navs = ac_program_navs(links, base, catoid)
    read = []
    for nav in navs[:AC_MAX_NAVS]:
        if len(urls) >= 0.5 * report.get("with_closed_list", 0) and sm.get("access") == "ok":
            break
        got = P.load(reader, nav, cache, False)
        nl = got.get("links") or []
        # What each menu held, so a catalog that lists its programs elsewhere says where (S389).
        read.append({"url": nav, "access": got.get("access"), "title": (got.get("title") or "")[:80],
                     "links": len(nl), "sample": [[(ln.get("text") or "")[:50], ln.get("href")] for ln in nl
                                                  if re.search(r"poid|preview_|navoid|ent_oid", ln.get("href") or "")][:25]})
        urls += [u for u in ac_program_urls(nl, base, catoid) if u not in urls]
    report["acalog"].update(program_navs=navs[:AC_MAX_NAVS], navs_read=len(read), navs=read, program_pages=len(urls))
    return urls


# ── A whole-catalog PDF (S403) ─────────────────────────────────────────────
# Sixteen colleges publish the catalog as one PDF and nothing else (the
# registry's single_pdf rows). The pilot read West LA's one program at a time
# (pick_pdf_pages); a college is the same read with the file fetched once.
# A catalog's course descriptions name a subject's codes page after page, so a
# page counts toward a program only when it names the program's title words
# (outside a contents line) or prints its control number: the program's own
# page does, and the description pages of a one-subject program, which can
# name more of its codes, mostly do not. Two S403 sessions wrote a reader
# each; this one is #2189's with the East LA session's signals folded in.
PDF_HEADING_CHARS = 120   # a line this long or shorter can be a program's heading
PDF_HEADING_BONUS = 5     # codes a heading naming title and award is worth
PDF_RUN_PAGES = 3         # pages after the start a program's list may continue onto
PDF_CN_BONUS = 10         # codes the program's own control number printed on the page is worth
PDF_LEADER = re.compile(r"\.{4,}|(?:\. ){4,}")   # a table of contents' dot leader
PDF_WRAP_CHARS = 40       # a next line this short can be a heading's wrapped tail
# A catalog that heads a section with the award's letters before the title: Cañada's prints
# "AS Business Assistant", then "CA Business Assistant" with the same courses a few pages on
# (S419; San Mateo's district catalogs share the style). AWARD_WORDS reads "AA-T" and "AS-T",
# never a bare "CA", "AS" or "AA", so the certificate's own page scored no higher than the A.S.
# page naming the same courses and the earlier page won: 11 of Cañada's 73 extractions placed no
# listed course, each handed a sibling's section. The letters count only at the line's start and
# only before a capitalized word, so a sentence opening "As the student..." names no award.
PDF_AWARD_PREFIX = {
    "coa": re.compile(r"^(?:CA|COA|C\.A\.)\s+[A-Z(]"),
    "as": re.compile(r"^(?:AS|A\.S\.)\s+[A-Z(]"),
    "aa": re.compile(r"^(?:AA|A\.A\.)\s+[A-Z(]"),
    "adt": re.compile(r"^(?:AA-T|AS-T|A\.A\.-T|A\.S\.-T|ADT)\s+[A-Z(]"),
    "bs": re.compile(r"^(?:BS|B\.S\.|BA|B\.A\.)\s+[A-Z(]"),
    "noncredit": re.compile(r"^(?:NC|NCC|CC)\s+[A-Z(]"),
}


def pdf_heading(text: str, program: dict) -> tuple[float, bool, int]:
    """(share of the title's words, whether the award is named, offset) for the
    page line that names the title most fully, the award breaking a tie."""
    tokens = P.title_tokens(program.get("title") or "")
    kind = P.award_kind(program.get("award"))
    pats = P.AWARD_WORDS.get(kind, [])
    prefix = PDF_AWARD_PREFIX.get(kind)
    best, pos = (0.0, False, -1), 0
    lines = (text or "").split("\n")

    def share_of(low: str) -> float:
        return sum(1 for w in tokens if re.search(r"\b" + re.escape(w) + r"\b", low)) / len(tokens)
    for k, line in enumerate(lines):
        # pypdf runs a heading into the paragraph after it ("Medical Assistant, Associate in Science
        # Degree (Academic Plan E002456C) A medical assistant interacts..."), so a line's opening is read.
        raw = line.strip()[:PDF_HEADING_CHARS]
        low = raw.lower()
        # A contents line ("Architectural Design ....... 2") names a program it does not hold.
        if low and tokens and not PDF_LEADER.search(low):
            share = share_of(low)
            award = any(re.search(a, low) for a in pats) or bool(prefix and prefix.match(raw))
            # A long title wraps onto a short next line ("CA  Human Relations in the" / "Workplace",
            # Cañada p155; S419): the wrapped tail counts toward the title, the award stays the line's.
            if share < 1.0 and k + 1 < len(lines):
                tail = lines[k + 1].strip()
                if 0 < len(tail) <= PDF_WRAP_CHARS:
                    share = max(share, share_of(low + " " + tail.lower()))
            if (share, award) > best[:2]:
                best = (share, award, pos)
        pos += len(line) + 1
    return best


def pdf_control_number(text: str, cn: str | None) -> int:
    """Where the page prints the program's state control number, or -1. East LA
    heads each program "Basic Police Academy Preparation (Academic Plan E013343D)"
    for control number 13343, and no other page names that plan."""
    if not cn or not text:
        return -1
    m = re.search(r"(?:\b[A-Z]0*|plan\W{0,3}0*|control (?:number|no\.?)\W{0,3}0*)" + re.escape(cn.lstrip("0"))
                  + r"(?:[A-Z]\b|(?![0-9A-Za-z]))", text, re.I)
    return m.start() if m else -1


def _titled(text: str, pats: list) -> bool:
    """Every title word on the page, outside its contents lines."""
    low = "\n".join(ln for ln in (text or "").lower().split("\n") if not PDF_LEADER.search(ln))
    return all(pt.search(low) for pt in pats)


# A course description's entry line: code, a dash, its title, its units in parentheses
# ("OLAD 7320 - Art for People with Memory Loss (0.0)", "TH A 170C - Advanced Shakespeare for Actors (3.0)").
PDF_DESC_ENTRY = re.compile(r"^\s*[A-Z]{1,6}(?: [A-Z]{1,3})?\s?[A-Z]?\d{1,4}[A-Z]{0,3}\s+[-–—]\s+\S.{1,110}?"
                            r"\(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\)", re.M)
PDF_DESC_ENTRIES = 2      # a page printing this many entry lines is course descriptions


def _descriptions(text: str) -> bool:
    """A page of course descriptions: it prints two or more entry lines."""
    return len(PDF_DESC_ENTRY.findall(text or "")) >= PDF_DESC_ENTRIES


def _clean_heading(text: str, head: tuple, courses: list[dict]) -> bool:
    """A heading naming title and award on a line that names none of the listed
    codes. A transfer degree's award words include a bare "transfer", so a course
    description line ("PHYS 4A General Physics ... Transfer: CSU, UC") reads as
    its heading; the program's own heading names no course (S407)."""
    if not (head[0] == 1.0 and head[1] and head[2] >= 0):
        return False
    line = text[head[2]:].split("\n", 1)[0][:PDF_HEADING_CHARS]
    return not P.find_codes(line, courses)


# Coursedog's whole-catalog PDF heads each program with its title and its program
# code, the code's prefix naming the award ("Biology - AS.BIO", "Studio Arts for
# Transfer (AA-T) - AAT.SART", "Sociology for Transfer (AA-T) - AAT-SOC", "Music -
# CT.MUS"). In Hartnell's 427 pages (S411) the title-and-codes picker took 33 of 101
# programs to the course-set reference pages at the back, or to a program the PDF
# does not print, and 12 more to a sibling award's page: an A.A., its certificate and
# its A.A.-T name the same courses. Where the catalog heads its programs so, a program
# is read from the heading that names it, and from no page when none does.
PDF_CODE_HEADING = re.compile(r"[ \t]+-\s+((AAT|AST|AA|AS|CT|NCCT|BS)[.\-][A-Z0-9]{2,}(?:\.[A-Z0-9]{2,})*)\b")
PDF_CODE_AWARD = {"AA": "aa", "AS": "as", "AAT": "adt", "AST": "adt", "CT": "coa", "NCCT": "noncredit", "BS": "bs"}
PDF_CODE_TRANSFER = re.compile(r"\bfor transfer\b", re.I)   # the code's prefix names the award
PDF_CODE_SHARE = 0.5      # a catalog heading this share of its listed programs with a code heads them all


def pdf_code_headings(pages: list[str]) -> list[dict]:
    """Every "Title - CODE" heading: its page, code, award kind, where it starts,
    and its title read from its own line and from the line before as well
    ("Computer Science and Info Systems-Computer \\nScience Option - AS.CISCS").
    pypdf can run two headings into one line ("Basic Computer Literacy - NCCT.BCL
    Workforce and Academic Readiness - NCCT.WAR"): a title starts after the last code."""
    out = []
    for i, txt in enumerate(pages):
        end = 0
        for m in PDF_CODE_HEADING.finditer(txt or ""):
            line = max(txt.rfind("\n", 0, m.start()) + 1, end)
            prev = max(txt.rfind("\n", 0, line - 1) + 1, end) if line > end else line
            out.append({"page": i, "code": m.group(1).replace("-", ".", 1), "kind": PDF_CODE_AWARD[m.group(2)],
                        "at": prev, "titles": [txt[line:m.start()].strip(),
                                               re.sub(r"\s+", " ", txt[prev:m.start()]).strip()]})
            end = m.end()
    return out


def pdf_code_match(head: dict, program: dict) -> tuple[float, float]:
    """heading_match() of the heading's better title reading, its award words set
    aside: the code's prefix names the award, so only the kinds must agree."""
    if head["kind"] != P.award_kind(program.get("award")):
        return 0.0, 0.0
    return max(heading_match({"h1": PDF_CODE_TRANSFER.sub(" ", t)}, program) for t in head["titles"])


def pdf_code_assign(programs: list[dict], pages: list[str]) -> dict[str, dict | None] | None:
    """{control number: the heading the program is read from, or None} where the
    catalog heads its programs with codes; None where it does not. A code goes to
    the programs whose title it names most fully, as page_winners() gives a page:
    two state records of one catalog program (Communication Studies and
    Communication Studies 2.0, both A.A.-T) share it, and Public Health Science
    loses Public Health's. A program that loses moves to its next heading. A
    code printed twice (Photography, under Art and again under its own name) is
    read where its pages name the most listed courses."""
    heads = pdf_code_headings(pages)
    listed = [p for p in programs if p["closed_list"]]
    if not listed or len({h["code"] for h in heads}) < PDF_CODE_SHARE * len(listed):
        return None
    by_code: dict[str, list[dict]] = {}
    for h in heads:
        by_code.setdefault(h["code"], []).append(h)
    ranked = {}
    for p in listed:
        scored = []
        for code, hs in by_code.items():
            s = max(pdf_code_match(h, p) for h in hs)
            if s[0] >= HIDDEN_HEADING_TITLE and s[1] >= HIDDEN_HEADING_OWN:
                scored.append((s, code))
        ranked[p["control_number"]] = [c for _, c in sorted(scored, reverse=True)]
    pos = {cn: 0 for cn in ranked}
    for _ in range(12):
        claims: dict[str, list[str]] = {}
        for cn, codes in ranked.items():
            if pos[cn] < len(codes):
                claims.setdefault(codes[pos[cn]], []).append(cn)
        moved = False
        for code, cns in claims.items():
            if len(cns) < 2:
                continue
            share = {cn: max(pdf_code_match(h, next(p for p in listed if p["control_number"] == cn))[0]
                             for h in by_code[code]) for cn in cns}
            top = max(share.values())
            for cn in cns:
                if share[cn] < top:
                    pos[cn] += 1
                    moved = True
        if not moved:
            break
    out: dict[str, dict | None] = {}
    for p in listed:
        cn, codes = p["control_number"], ranked[p["control_number"]]
        if pos[cn] >= len(codes):
            out[cn] = None
            continue
        hs = by_code[codes[pos[cn]]]
        out[cn] = max(hs, key=lambda h: (len(P.find_codes("\n".join(pages[k] for k in _pdf_run(pages, h["page"],
                                                                                              p["closed_list"])),
                                                         p["closed_list"])), -h["page"]))
    return out


def _pdf_run(pages: list[str], best: int, courses: list[dict]) -> list[int]:
    """The page and those after it, up to PDF_RUN_PAGES, while they name listed codes."""
    run = [best]
    for j in range(best + 1, min(best + 1 + PDF_RUN_PAGES, len(pages))):
        if not P.find_codes(pages[j], courses):
            break
        run.append(j)
    return run


def _pdf_pick(pages: list[str], program: dict, courses: list[dict]) -> tuple[list[int], int, tuple, bool]:
    """(run of page indexes, where the first prints the control number, its
    heading, whether it passed the title gate) for the program, or an empty
    run. The highest-scoring page whose run covers the list wins; a page that
    scores high on a printed control number but names too few listed codes
    gives way. Pierce prints numbers away from the program's page, and the
    bonus alone took 80 of its 194 picks to pages that fail the share (S403).
    Among pages whose run covers the list, one whose clean heading names the
    title and award, or that prints the control number, comes first; then one
    that is not course descriptions; then the rest. A one-subject program's
    course descriptions name more of its codes than its own page does. At City
    College of San Francisco 53 of 55 picks placing no listed course had no
    heading, against 2 of 183 that had one, and most opened on description
    entries (S407)."""
    tokens = P.title_tokens(program.get("title") or "")
    pats = [re.compile(r"\b" + re.escape(w) + r"\b") for w in tokens]
    cn = program.get("control_number")
    cands = []
    for i, txt in enumerate(pages):
        at = pdf_control_number(txt, cn)
        titled = bool(pats) and _titled(txt, pats)
        if at < 0 and not titled:
            continue
        n = len(P.find_codes(txt, courses))
        head = pdf_heading(txt, program)
        if not n:
            # A section whose heading closes one page and whose list opens the next (Cañada's "AS-T
            # Mathematics 2.0" on p215, its courses on p216; "AA  Ethnic Studies" p183/184; S419): the
            # heading page leads when its clean heading names the program and the award and the page
            # after it names listed codes; the run and the coverage test then read both. Before this,
            # the picker took the course availability table that named the codes (p127, p95).
            if not (_clean_heading(txt, head, courses) and i + 1 < len(pages) and P.find_codes(pages[i + 1], courses)):
                continue
            n = len(P.find_codes("\n".join(pages[k] for k in _pdf_run(pages, i, courses)), courses))
        s = n + (PDF_HEADING_BONUS if head[0] == 1.0 and head[1] else 0) + (PDF_CN_BONUS if at >= 0 else 0)
        clean = _clean_heading(txt, head, courses) or at >= 0
        cands.append((s, -i, i, at, head, titled, 0 if clean else 1 if not _descriptions(txt) else 2))
    if not cands:
        return list(P.pick_pdf_pages(pages, program, courses) or []), -1, (0.0, False, -1), False
    cands.sort(reverse=True)

    def run_from(best: int) -> list[int]:
        return _pdf_run(pages, best, courses)
    for worst in (0, 1, 2):
        for _, _, i, at, head, titled, rank in cands:
            if rank > worst:
                continue
            run = run_from(i)
            if P.coverage(P.find_codes("\n".join(pages[k] for k in run), courses), courses) >= P.ACCEPT_SHARE:
                return run, at, head, titled
    _, _, i, at, head, titled, _ = cands[0]
    return run_from(i), at, head, titled


def pdf_program_pages(pages: list[str], program: dict, courses: list[dict]) -> list[int]:
    """The run of PDF pages holding the program: among the pages that carry
    every title word or print its control number, the one naming the most
    listed codes (a heading naming title and award, and the control number,
    count extra), then the pages after it while they still name listed codes
    (a table across pages). When no page qualifies, the pilot's picker."""
    return _pdf_pick(pages, program, courses)[0]


def pdf_best(url: str, pages: list[str], program: dict, courses: list[dict], extractor: str | None,
             heading: dict | None = None) -> dict | None:
    """The program's pages as a source the extraction reads, in the shape
    source_record() takes: None when no page names a listed course. The text
    opens on the program's heading, so an A.S. and the certificate printed
    after it each open on their own name. A code heading (pdf_code_assign())
    names the run's first page."""
    if heading:
        run, cn_at, head, titled = _pdf_run(pages, heading["page"], courses), -1, (1.0, True, heading["at"]), True
    else:
        run, cn_at, head, titled = _pdf_pick(pages, program, courses)
    if not run:
        return None
    parts = []
    for n, i in enumerate(run):
        txt = pages[i]
        cut = txt
        if n == 0 and cn_at >= 0:
            # From the start of the line that prints the control number: the heading.
            cut = txt[txt.rfind("\n", 0, cn_at) + 1:]
        elif n == 0 and head[0] == 1.0 and head[1] and head[2] > 0:
            cut = txt[head[2]:]
        # Only while the cut keeps every listed code the page names: Pierce prints the number
        # and the heading's words below the list, and the cut left 80 programs no codes (S403).
        if len(P.find_codes(cut, courses)) == len(P.find_codes(txt, courses)):
            txt = cut
        parts.append("[page %d]\n%s" % (i + 1, txt))
    text = "\n\n".join(parts)
    found = P.find_codes(text, courses)
    first = (text.split("\n", 2) + ["", ""])[1].strip()
    return {"url": "%s#page=%d" % (url, run[0] + 1), "field": "pdf_pages", "found": found,
            "coverage": P.coverage(found, courses), "text": text,
            "pages": [i + 1 for i in run], "extractor": extractor,
            "named": bool(head[0] == 1.0 and head[1]), "control_number_printed": cn_at >= 0, "titled": titled,
            "got": {"title": first[:PDF_HEADING_CHARS], "h1": first[:PDF_HEADING_CHARS]}}


PDF_CN_SHARE = 0.5        # a catalog printing this share of its programs' control numbers prints them all


def pdf_unproven(picks: list[dict]) -> set[str]:
    """The picks a catalog that prints control numbers does not vouch for. East LA
    prints the number in 116 of its 141 headings (run 39010864052); of the 25
    others, six went to its online-course, C-ID and admissions pages up front.
    Where the numbers are the catalog's habit, a page that prints neither the
    number nor all the title words (the pilot's picker chose it on codes alone)
    is no proof, and the program stays out. A title-gated page stays: at Los
    Angeles City the stricter test, title and award on one heading line, dropped
    28 of its 245 picks (run 39017360234)."""
    if not picks or sum(1 for p in picks if p["cn_printed"]) < PDF_CN_SHARE * len(picks):
        return set()
    return {p["control_number"] for p in picks
            if not p["cn_printed"] and not p.get("titled") and not p["named"]}


def pdf_start(reader, reg: dict, cache: dict, report: dict) -> tuple[str | None, int]:
    """The catalog PDF's address and how long to wait for it: the file its
    procedure record names, the link it says to follow, or the registry's."""
    step = P.procedure_catalog(reg.get("procedure"))
    if step and step.get("file"):
        # A step naming the file itself (a catalog whose scripts fetch it) loads no page.
        report["procedure_step"] = {"start": step["start"], "file": step["file"]}
        return step["file"], step["timeout_s"] * 1000
    if step and step["format"] == "pdf":
        got = P.load(reader, step["start"], cache, False)
        # A menu link can carry the same words as the file's ("2026 - 2027" at East LA): a PDF step follows a PDF.
        pdfs = [ln for ln in got.get("links") or [] if ".pdf" in (ln.get("href") or "").lower().split("?")[0]]
        href = P.follow_link(pdfs, step["follow"])
        report["procedure_step"] = {"start": step["start"], "follow": step["follow"], "href": href,
                                    "status": got.get("status"), "access": got.get("access")}
        if href:
            return href, step["timeout_s"] * 1000
    return reg.get("catalog_url"), P.CATALOG_PDF_WAIT_S * 1000


def is_pdf_catalog(reg: dict) -> bool:
    url = (reg.get("catalog_url") or "").lower().split("#")[0].split("?")[0]
    return reg.get("catalog_format") == "single_pdf" and url.endswith(".pdf")


def reads_as_pdf(reg: dict) -> bool:
    """A registry row naming one PDF file, or a procedure record whose catalog step is a PDF."""
    return is_pdf_catalog(reg) or (P.procedure_catalog(reg.get("procedure")) or {}).get("format") == "pdf"


def hand_filed_meta(college: str) -> tuple[str, dict] | None:
    meta_path = os.path.join(HAND_FILED_DIR, slug_of(college) + ".json")
    return (meta_path, json.load(open(meta_path))) if os.path.isfile(meta_path) else None


def fetch_copy(url: str) -> bytes:
    """A hand-filed copy from where the person posted it (a GitHub release
    attachment), never from the college's host."""
    import urllib.request
    req = urllib.request.Request(url, headers={"User-Agent": COPY_UA})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def copy_bytes(meta: dict) -> tuple[bytes | None, str | None]:
    """The file beside the record, or else the copy at its copy_url; gzip undone."""
    path = os.path.join(HAND_FILED_DIR, os.path.basename(meta.get("file") or "")) if meta.get("file") else None
    if path and os.path.isfile(path):
        data = open(path, "rb").read()
    elif meta.get("copy_url"):
        try:
            data = fetch_copy(meta["copy_url"])
        except Exception as exc:
            return None, "the copy at %s did not fetch: %s" % (meta["copy_url"], str(exc).splitlines()[0][:160])
    else:
        return None, "no file at " + (os.path.relpath(path, HERE) if path else "the record (neither file nor copy_url)")
    return (gzip.decompress(data) if data[:2] == b"\x1f\x8b" else data), None


def hand_filed(college: str) -> dict | None:
    """A catalog a person fetched by hand for the pipeline, where the college's host
    refuses the reader (Sam, 2026-10-17, ruling 2 on the blocked colleges: automated
    reads still name the CPL Initiative and respect blocks and robots.txt; a person
    may fetch a public file by hand). kb/hand_filed_catalogs/<slug>.json records who
    fetched it, when and from what address, and the file's sha256; the file sits
    beside it (.pdf, or .pdf.gz under GitHub's size limits) or at its copy_url. None
    when no record."""
    found = hand_filed_meta(college)
    if not found:
        return None
    meta = found[1]
    missing = [k for k in HAND_FILED_KEYS if k not in ("file", "copy_url") and not meta.get(k)]
    if not (meta.get("file") or meta.get("copy_url")):
        missing.append("file or copy_url")
    if missing:
        return {"meta": meta, "error": "the provenance record lacks " + ", ".join(missing)}
    data, err = copy_bytes(meta)
    if err:
        return {"meta": meta, "error": err}
    if hashlib.sha256(data).hexdigest() != meta["sha256"].lower():
        return {"meta": meta, "error": "the file's sha256 differs from its provenance record"}
    return {"meta": meta, "data": data}


def pin(college: str, run: str | None) -> int:
    """Fix the sha256 of a hand-filed copy, and of each addendum filed with it, the
    first time a runner fetches it (the session that files a release copy cannot
    fetch it). A pinned hash is never changed: a copy that differs later is refused."""
    found = hand_filed_meta(college)
    if not found:
        print("%s: no hand-filed record" % college)
        return 0
    meta_path, meta = found
    changed = False
    for entry in [meta] + list(meta.get("addenda") or []):
        if entry.get("sha256") or not entry.get("copy_url"):
            continue
        data, err = copy_bytes(entry)
        if err:
            print("::error::%s: %s" % (college, err))
            return 1
        entry.update(sha256=hashlib.sha256(data).hexdigest(), bytes=len(data), pinned_run=run)
        changed = True
        print("%s: pinned %s (%d bytes) %s" % (college, entry["copy_url"], len(data), entry["sha256"]))
    if changed:
        _write(meta_path, meta)
    return 0


def read_hand_filed(hf: dict) -> dict:
    """read_pdf's shape for a hand-filed file: no load, no robots, the same pypdf text."""
    out = {"url": hf["meta"]["url"], "status": None}
    if hf.get("error"):
        out.update(access="hand_filed_refused", error=hf["error"], pages=[])
        return out
    try:
        from pypdf import PdfReader
        pdf = PdfReader(io.BytesIO(hf["data"]))
        out.update(access="hand_filed", bytes=len(hf["data"]), data=hf["data"], extractor="pypdf",
                   pages=[(pg.extract_text() or "") for pg in pdf.pages])
    except Exception as exc:
        out.update(access="hand_filed_unreadable", error=str(exc).splitlines()[0][:200], pages=[])
    return out


def capture_pdf(college: str, out_dir: str, programs: list[dict], reg: dict, report: dict,
                hf: dict | None = None) -> list[dict]:
    """Every program at a college whose catalog is one PDF: the file read once
    (pypdf, then pdfminer when pypdf's text names few listed codes), each
    program given its run of pages. A hand-filed file (hf) is read in place of
    the download, and its provenance rides on the report and each record."""
    if hf:
        start, pdf = hf["meta"]["url"], read_hand_filed(hf)
        reader = type("NoReader", (), {"loads": 0})()
    else:
        delay = int(os.environ.get("CENSUS_DELAY_MS", "4000"))
        pw, browser, reader = P.open_reader(delay)
        try:
            start, wait = pdf_start(reader, reg, {}, report)
            pdf = (P.read_pdf(reader, start, {}, timeout_ms=wait) if start
                   else {"access": "no_address", "pages": []})
        finally:
            browser.close()
            pw.stop()
    pages, extractor = pdf.get("pages") or [], pdf.get("extractor")
    listed = [p for p in programs if p["closed_list"]]

    def accepted(pg: list[str]) -> int:
        return sum(1 for p in listed
                   if (lambda b: b and b["coverage"] >= P.ACCEPT_SHARE)(pdf_best(start, pg, p, p["closed_list"], None)))
    n = accepted(pages)
    report["pdf"] = {"url": start, "access": pdf.get("access"), "status": pdf.get("status"),
                     "bytes": pdf.get("bytes"), "pages_total": len(pages), "error": pdf.get("error"),
                     "chars_total": sum(len(t) for t in pages), "pypdf_accepted": n,
                     "sample": P.text_sample(pages)}
    if pdf.get("data") and n < 0.5 * len(listed):
        alt = P.pdfminer_pages(pdf)
        m = accepted(alt["pages"]) if alt["pages"] else 0
        report["pdf"].update(pdfminer_accepted=m, pdfminer_error=alt.get("error"))
        if m > n:
            pages, extractor = alt["pages"], alt["extractor"]
    report["pdf"]["extractor"] = extractor
    coded = pdf_code_assign(programs, pages)
    if coded is not None:
        report["pdf"]["code_headings"] = {"codes": len({h["code"] for h in pdf_code_headings(pages)}),
                                          "read_by_code": sum(1 for h in coded.values() if h),
                                          "named_by_none": sorted(cn for cn, h in coded.items() if not h)}
    if hf:
        report["pdf"]["hand_filed"] = {k: hf["meta"].get(k) for k in HAND_FILED_KEYS + ("note",)}
        # Addenda filed with the catalog keep their provenance; the reader does not read them.
        report["pdf"]["hand_filed"]["addenda"] = [{k: a.get(k) for k in ("title", "url", "sha256")}
                                                  for a in hf["meta"].get("addenda") or []]
    report["loads"] = reader.loads
    print("%s: %d programs (%d with a course list), PDF %s pages by %s, %s"
          % (college, len(programs), len(listed), len(pages), extractor, pdf.get("access")), flush=True)
    recs = []
    for prog in programs:
        if not prog["closed_list"]:
            rec = source_record(college, prog, reg, None, "no_closed_list")
        elif coded is not None and not coded.get(prog["control_number"]):
            rec = source_record(college, prog, reg, None, "not_found")
            rec["near_miss"] = {"why": "the catalog heads each program with its code, and no heading names this one"}
        else:
            best = pdf_best(start, pages, prog, prog["closed_list"], extractor,
                            (coded or {}).get(prog["control_number"]))
            if best and best["coverage"] >= P.ACCEPT_SHARE:
                rec = source_record(college, prog, reg, best, "pdf_pages")
                rec["source"].update(pages=best["pages"], extractor=extractor, heading_named=best["named"])
                if hf:
                    rec["source"]["hand_filed"] = {k: hf["meta"][k] for k in ("fetched_by", "fetched_at", "sha256")}
                # The pages are the program's own: keep their text whole, not a window around the codes.
                rec["text"] = best["text"][:P.TEXT_CAP]
                # A capture-only read files the preview alone: each pick's opening shows whether it is the program's page.
                report["pdf"].setdefault("picks", []).append(
                    {"control_number": prog["control_number"], "pages": best["pages"], "named": best["named"],
                     "code": ((coded or {}).get(prog["control_number"]) or {}).get("code"),
                     "cn_printed": best["control_number_printed"], "titled": best["titled"],
                     "coverage": round(best["coverage"], 3), "opens": re.sub(r"\s+", " ", best["text"][:220])})
            else:
                rec = source_record(college, prog, reg, None, "not_found")
                if best:
                    rec["near_miss"] = {"url": best["url"], "coverage": round(best["coverage"], 3)}
        recs.append(rec)
    picks = {p["control_number"]: p for p in report["pdf"].get("picks") or []}
    drop = pdf_unproven(list(picks.values()))
    report["pdf"]["unproven"] = sorted(drop)
    byc = {p["control_number"]: p for p in programs}
    for i, rec in enumerate(recs):
        cn = rec["control_number"]
        if cn in drop:
            recs[i] = rec = source_record(college, byc[cn], reg, None, "not_found")
            rec["near_miss"] = {"pages": picks[cn]["pages"], "coverage": picks[cn]["coverage"],
                                "why": "the page prints neither the control number nor the title and award"}
        _write(os.path.join(out_dir, "sources", cn + ".json"), rec)
        print("%-6s %-12s cov %-5s %s" % (cn, rec["method"][:12], rec["coverage"],
                                          (rec.get("source") or {}).get("url") or ""), flush=True)
    return recs


def capture(college: str, out_dir: str, limit: int = 0) -> int:
    t0 = time.time()
    programs = college_programs(college)
    if limit:
        programs = programs[:limit]
    reg = P.fetch_registry(college)
    start = reg.get("catalog_url")
    report = {"college": college, "catalog_url": start, "platform": reg.get("catalog_platform"),
              "catalog_year": reg.get("catalog_year"), "programs": len(programs),
              "with_closed_list": sum(1 for p in programs if p["closed_list"]),
              "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    os.makedirs(os.path.join(out_dir, "sources"), exist_ok=True)
    platform = reg.get("catalog_platform")
    hf = hand_filed(college)
    if hf:
        if hf["meta"].get("catalog_year"):
            # A refused host's row often names no year; the person who fetched the file names it.
            reg = dict(reg, catalog_year=hf["meta"]["catalog_year"])
            report["catalog_year"] = reg["catalog_year"]
        recs = capture_pdf(college, out_dir, programs, reg, report, hf)
        return finish_capture(college, out_dir, recs, report, t0)
    if reads_as_pdf(reg) and (start or reg.get("procedure")):
        year = (P.procedure_catalog(reg.get("procedure")) or {}).get("catalog_year")
        if year and not reg.get("catalog_year"):
            # A row naming the catalog's page names no year; the step that names its file does (S407).
            reg = dict(reg, catalog_year=year)
            report.update(catalog_year=year, catalog_year_from="the procedure record's catalog step")
        recs = capture_pdf(college, out_dir, programs, reg, report)
        return finish_capture(college, out_dir, recs, report, t0)
    # A college's own HTML catalog (custom_html, S404) takes CourseLeaf's road: its
    # sitemap, or its front page's program indexes, then each page's children.
    if not start or platform not in ("courseleaf", "curriqunet", "elumen", "acalog", "custom_html", "smartcatalog", "coursedog"):
        # Phase 2 opens on CourseLeaf (Cerritos), curriQunet (S357), eLumen (S380), Acalog (S389), SmartCatalog (S411,
        # the generic road through child_base()) and Coursedog (S414); another platform names its own enumeration first.
        report["stopped"] = ("this pass enumerates CourseLeaf, curriQunet, eLumen, Acalog, SmartCatalog and own-HTML catalogs; "
                             "%s reads %s" % (college, platform))
        _write(os.path.join(out_dir, "capture.json"), report)
        print(report["stopped"])
        return 1
    delay = int(os.environ.get("CENSUS_DELAY_MS", "4000"))
    pw, browser, reader = P.open_reader(delay)
    cache: dict = {}
    try:
        scope = None
        if platform == "curriqunet":
            urls = []
            pages = cq_pages(reader, start, report)
            print("%s: %d programs (%d with a course list), %d curriQunet program pages, %.1f s between loads"
                  % (college, len(programs), report["with_closed_list"], len(pages), delay / 1000), flush=True)
        elif platform == "elumen":
            urls, pages = [], el_pages_fast(reader, start, report)
            if not pages:
                # The publish calls gave no program: read the menu's pages rendered.
                urls = el_pages(reader, start, cache, report)
            print("%s: %d programs (%d with a course list), %d eLumen program pages (%s), %.1f s between loads"
                  % (college, len(programs), report["with_closed_list"], len(pages) or len(urls),
                     "publish/content" if pages else "rendered", delay / 1000), flush=True)
        elif platform == "coursedog":
            urls, pages = [], cd_pages(reader, start, report, cache)
            print("%s: %d programs (%d with a course list), %d Coursedog Requisites pages, %.1f s between loads"
                  % (college, len(programs), report["with_closed_list"], len(pages), delay / 1000), flush=True)
        elif platform == "acalog":
            urls, pages = ac_urls(reader, start, cache, report)[:MAX_PAGES], []
            read_year = report["acalog"].get("catalog_year_read")
            if read_year and not reg.get("catalog_year"):
                # Each record's source carries the registry's year, and the load stamps the report's.
                reg = dict(reg, catalog_year=read_year)
                report["catalog_year"] = read_year
                report["catalog_year_from"] = report["acalog"].get("catalog_year_from")
            elif read_year and read_year != reg.get("catalog_year"):
                report["catalog_year_page_differs"] = read_year
            print("%s: %d programs (%d with a course list), %d Acalog program pages (catalog %s), %.1f s between loads"
                  % (college, len(programs), report["with_closed_list"], len(urls),
                     report["acalog"].get("catoid"), delay / 1000), flush=True)
        else:
            scope = district_scope(start, host_registry_urls(start)) or year_scope(start, platform)
            report["scope"] = scope
            sm = read_sitemap(reader, start)
            urls = program_candidates(sm["pages"], start, scope)
            report["sitemap"] = {"url": sm["url"], "status": sm["status"], "listed": len(sm["pages"]),
                                 "nested": len(sm["nested"]), "program_pages": len(urls),
                                 "refused": sm.get("refused"), "errors": sm.get("errors")}
            if len(urls) < 0.3 * report["with_closed_list"]:
                urls = program_candidates(index_links(reader, start, cache), start, scope)
                report["index_fallback"] = len(urls)
            urls = urls[:MAX_PAGES]
            pages = []
            print("%s: %d programs (%d with a course list), %d candidate pages, %.1f s between loads"
                  % (college, len(programs), report["with_closed_list"], len(urls), delay / 1000), flush=True)
        # A page's own program pages beneath it are read too (child_pages()), once each.
        queue, seen, i = list(urls), set(urls), 0
        while i < len(queue):
            u = queue[i]
            i += 1
            got = P.load(reader, u, cache, platform == "elumen")   # an eLumen view fills in late
            if got.get("access") != "ok":
                continue
            if platform not in ("curriqunet", "elumen", "acalog"):
                for kid in child_pages(child_base(got.get("final_url") or u, platform), got.get("links"), start, scope):
                    if kid not in seen and len(queue) < MAX_PAGES:
                        seen.add(kid)
                        queue.append(kid)
            got["links"] = (got.get("links") or [])[:300]   # a program page's menus need not ride in memory
            pages.append({"url": got.get("final_url") or u, "title": got.get("title"), "h1": got.get("h1"),
                          "body": got.get("body"), "content": got.get("content"), "got": got,
                          "codes": page_net(got)})
            if i % 50 == 0:
                print("  read %d of %d pages" % (i, len(queue)), flush=True)
        report["pages_read"] = len(pages)
        if platform not in ("curriqunet", "elumen", "acalog"):
            report["child_pages"] = len(queue) - len(urls)
        report["banner_h1"] = drop_banner_h1(pages)
        recs, fallback = [], 0
        P.MAX_LOADS = FALLBACK_LOADS      # the link search, shorter here: most programs already have a page
        given = assign(programs, pages)
        for prog in programs:
            if not prog["closed_list"]:
                rec = source_record(college, prog, reg, None, "no_closed_list")
            else:
                g = given.get(prog["control_number"]) or {}
                best, method = g.get("best"), "sitemap_page"
                if best is None and g.get("lost"):
                    # Its pages went to programs they name more fully; the link
                    # search would only find one of them again.
                    rec = source_record(college, prog, reg, None, "page_claimed")
                    rec["lost_pages"] = g["lost"]
                    recs.append(rec)
                    _write(os.path.join(out_dir, "sources", prog["control_number"] + ".json"), rec)
                    print("%-6s page_claimed %s" % (prog["control_number"], g["lost"][0]), flush=True)
                    continue
                # A curriQunet catalog has no links to search: its index is the whole list.
                # An eLumen catalog's menu is the whole list too; its links would find it again,
                # and so would an Acalog catalog's site map or program pages.
                if best is None and fallback < MAX_FALLBACKS and platform not in ("curriqunet", "elumen", "acalog", "coursedog"):
                    fallback += 1
                    res = P.locate_html(reader, {"title": prog["title"], "award": prog["award"]},
                                        prog["closed_list"], start, cache, False)
                    b = res["best"] or {}
                    if b.get("coverage", 0.0) >= P.ACCEPT_SHARE and link_page_ok(b.get("url") or "", scope):
                        best, method = dict(b, label=None), "link_search"
                rec = source_record(college, prog, reg, best, method if best else "not_found")
                if not best:
                    rec["near_miss"] = near_miss(prog, pages)
            recs.append(rec)
            _write(os.path.join(out_dir, "sources", prog["control_number"] + ".json"), rec)
            print("%-6s %-12s cov %-5s %s" % (prog["control_number"], rec["method"][:12], rec["coverage"],
                                              (rec.get("source") or {}).get("url") or ""), flush=True)
    finally:
        browser.close()
        pw.stop()
    report["loads"] = reader.loads
    return finish_capture(college, out_dir, recs, report, t0)


def finish_capture(college: str, out_dir: str, recs: list[dict], report: dict, t0: float) -> int:
    """The run's account, written as capture.json, whichever reader found the pages."""
    urls_used: dict[str, list[str]] = {}
    for r in recs:
        if r.get("source"):
            urls_used.setdefault(r["source"]["url"], []).append(r["control_number"])
    report.update(
        seconds=round(time.time() - t0, 1),
        found=sum(1 for r in recs if r.get("source")),
        by_method={m: sum(1 for r in recs if r["method"] == m)
                   for m in sorted({r["method"] for r in recs})},
        shared_pages={u: cns for u, cns in urls_used.items() if len(cns) > 1},
        not_found=[{"control_number": r["control_number"], "title": r["title"], "award": r["award"],
                    "near_miss": r.get("near_miss")}
                   for r in recs if r["method"] == "not_found"],
        page_claimed=[{"control_number": r["control_number"], "title": r["title"], "award": r["award"],
                       "pages": r.get("lost_pages")} for r in recs if r["method"] == "page_claimed"],
        coverage_bands={band: sum(1 for r in recs if r.get("source") and lo <= r["coverage"] < hi)
                        for band, lo, hi in (("0.5-0.8", .5, .8), ("0.8-1.0", .8, 1.0), ("1.0", 1.0, 9))})
    report["would_extract"] = would_extract(college, recs)
    _write(os.path.join(out_dir, "capture.json"), report)
    print(json.dumps({k: v for k, v in report.items() if k not in ("not_found", "shared_pages")}, indent=1))
    return 0


def has_record(path: str) -> bool:
    """A filed record file that holds a record. A call that failed (ran past
    max_tokens, timed out) files its row with no record, and a later read asks
    the model again instead of keeping it (S361)."""
    try:
        with open(path) as fh:
            return isinstance(json.load(fh).get("record"), dict)
    except (OSError, ValueError, AttributeError):
        return False


def filed_from(path: str, src: dict) -> bool:
    """A filed record extracted from the page the source reads. A reconcile run
    files its fresh sources beside the records it did not move, so sources.json
    can name a page a record was never read from, and unchanged() then keeps it:
    127 filed records stood so (Los Angeles City 69, Pierce 43, Santa Rosa 11; S411)."""
    try:
        with open(path) as fh:
            rec = json.load(fh)
    except (OSError, ValueError):
        return False
    return isinstance(rec.get("record"), dict) and rec.get("source_url") == (src.get("source") or {}).get("url")


def unchanged(prev: dict | None, src: dict) -> bool:
    """A source read from the same page as the filed one, from the same text
    (visible or hidden), naming the same courses, so the filed record still
    stands and the model need not be asked again."""
    a, b = ((prev or {}).get("source") or {}), (src.get("source") or {})
    return bool(prev) and a.get("url") == b.get("url") and a.get("text_from") == b.get("text_from") \
        and prev.get("coverage") == src.get("coverage") and prev.get("codes_found") == src.get("codes_found")


def would_extract(college: str, recs: list[dict], folder: str | None = None) -> dict:
    """What an extraction after this capture would send to the model, against
    the read filed for the college: each source that reaches the extraction's
    bar and is new or moved (unchanged() is the test the extraction applies).
    A capture-only run files this in its preview, so Sam's go on an extraction
    names its programs and its cost before a model call is made."""
    folder = folder or os.path.join(COLLEGE_DIR, slug_of(college))
    prev: dict = {}
    if os.path.isfile(os.path.join(folder, "sources.json")):
        with open(os.path.join(folder, "sources.json")) as fh:
            prev = {x["control_number"]: x for x in json.load(fh)}
    from _program_requirements_extract import MIN_COVERAGE as bar
    out, kept = [], 0
    for r in recs:
        if (r.get("coverage") or 0) < bar or not r.get("text"):
            continue
        cn = r["control_number"]
        if filed_from(os.path.join(folder, "records", cn + ".json"), r) and unchanged(prev.get(cn), r):
            kept += 1
            continue
        was = prev.get(cn) or {}
        out.append({"control_number": cn, "title": r.get("title"), "award": r.get("award"),
                    "url": (r.get("source") or {}).get("url"), "coverage": r.get("coverage"),
                    "was_url": (was.get("source") or {}).get("url"), "was_coverage": was.get("coverage"),
                    "was_method": was.get("method")})
    return {"against": os.path.relpath(folder, os.path.dirname(HERE)) if prev else None,
            "kept": kept, "programs": len(out), "list": out}


def forced(folder: str, tokens: str) -> set[str]:
    """The control numbers a re-read extracts again though their page is
    unchanged: those it names, and with the word "incomplete" every filed record
    whose arithmetic is incomplete and that places some listed course (Sam, Open
    Asks Sheet 78 card 2: record shape 5 reads the degree total those pages
    print). A record placing none read another program's page; reading it again
    reads the same page."""
    from _program_requirements_score import places_none
    out = set()
    for t in (x.strip() for x in (tokens or "").split(",")):
        if t.lower() == "incomplete":
            for path in glob.glob(os.path.join(folder, "records", "*.json")):
                with open(path) as fh:
                    r = json.load(fh)
                sc = r.get("score") or {}
                if (sc.get("arithmetic") or {}).get("status") == "incomplete" and not places_none(sc):
                    out.add(r.get("control_number") or os.path.splitext(os.path.basename(path))[0])
        elif t:
            out.add(t)
    return out


def extract(out_dir: str, shard: int, shards: int, run_id: str | None, workers: int = 6,
            keep_from: str | None = None, force: set[str] | None = None) -> int:
    import _program_requirements_extract as X
    import _program_requirements_reconcile as R
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; the Edge Function takes only the service key.")
        return 2
    sources = []
    for path in sorted(glob.glob(os.path.join(out_dir, "sources", "*.json"))):
        with open(path) as fh:
            src = json.load(fh)
        if (src.get("coverage") or 0) >= X.MIN_COVERAGE and src.get("text"):
            sources.append(src)
    os.makedirs(os.path.join(out_dir, "records"), exist_ok=True)
    # A record filed from the same page stays: only a program whose page
    # changed, or that has no record, goes to the model again.
    kept = 0
    if keep_from and os.path.isfile(os.path.join(keep_from, "sources.json")):
        with open(os.path.join(keep_from, "sources.json")) as fh:
            prev = {x["control_number"]: x for x in json.load(fh)}
        fresh = []
        for src in sources:
            path = os.path.join(keep_from, "records", src["control_number"] + ".json")
            if (src["control_number"] not in (force or ())
                    and unchanged(prev.get(src["control_number"]), src) and filed_from(path, src)):
                with open(path) as fh:
                    _write(os.path.join(out_dir, "records", src["control_number"] + ".json"), json.load(fh))
                kept += 1
            else:
                fresh.append(src)
        sources = fresh
        print("kept %d records filed from the same page; %d to extract, %d of them forced"
              % (kept, len(fresh), sum(1 for x in fresh if x["control_number"] in (force or ()))), flush=True)
    mine = shard_of(sources, shard, shards)
    print("extraction, shard %d of %d: %d of %d sources, %d at a time"
          % (shard + 1, shards, len(mine), len(sources), workers), flush=True)

    def one(src: dict) -> None:
        t0 = time.time()
        got = X.call(src, key)
        rec = got.get("record")
        # The college's reconcile steps search the page again for a figure the reading left out
        # (Sam, 2026-10-14; kb/_program_requirements_reconcile.py).
        rec, notes = R.reconcile(rec, src["text"], src["college"], src.get("award"))
        if notes:
            got = dict(got, record=rec)
        try:
            sc = X.score(rec, src["closed_list"], src["text"], src.get("award"),
                         R.prefix_aliases(src["college"])) if isinstance(rec, dict) else None
        except Exception as exc:   # one record the scorer cannot read never stops the others
            sc, got = None, dict(got, error="score: " + str(exc).splitlines()[0][:200])
        row = {"college": src["college"], "control_number": src["control_number"], "shape": src["shape"],
               "title": src["title"], "award": src.get("award"),
               "source_url": (src.get("source") or {}).get("url"), "record_shape": X.RECORD_SHAPE,
               "model": got.get("model"), "stop_reason": got.get("stop_reason"), "usage": got.get("usage"),
               "cost_usd": X.cost(got.get("model"), got.get("usage")), "ms": got.get("ms"),
               "seconds": round(time.time() - t0, 1), "parts": got.get("parts"), "error": got.get("error"), "score": sc,
               "record": rec, "extracted_run": run_id}
        if notes:
            row["reconciled"] = notes
        _write(os.path.join(out_dir, "records", src["control_number"] + ".json"), row)
        print("%-6s %s cov %-5s arith %-10s $%s %s" % (
            src["control_number"], "PASS" if sc and sc["pass"] else "fail",
            sc and sc["coverage"]["share"], sc and sc["arithmetic"]["status"],
            row["cost_usd"], row["error"] or ""), flush=True)

    # Each call waits on the model for about 15 s; six at once keep a college
    # inside one job, and the function answers each call on its own.
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        list(pool.map(one, mine))
    return 0


def reconcile_filed(college: str, out_dir: str, run_id: str | None, keep_from: str) -> int:
    """A reconcile run (step=reconcile, no model call): every filed record goes to
    out/records, and each one whose page the capture read again is reconciled with
    the fresh text (kb/_program_requirements_reconcile.py) and rescored. A record
    that changed, or only scored differently, carries the run as its extracted_run, its notes as reconciled and
    the run it was read by as read_run, so step=reread posts it and only it."""
    import _program_requirements_reconcile as R
    import _program_requirements_score as S
    sources = {}
    for path in glob.glob(os.path.join(out_dir, "sources", "*.json")):
        with open(path) as fh:
            src = json.load(fh)
        if src.get("text"):
            sources[src["control_number"]] = src
    os.makedirs(os.path.join(out_dir, "records"), exist_ok=True)
    changed, unread, rescored, moved = [], 0, 0, 0
    for path in sorted(glob.glob(os.path.join(keep_from, "records", "*.json"))):
        with open(path) as fh:
            filed = json.load(fh)
        src = sources.get(filed.get("control_number"))
        rec = filed.get("record")
        if src and filed.get("source_url") and (src.get("source") or {}).get("url") \
                and (src.get("source") or {}).get("url") != filed.get("source_url"):
            # The capture took the program to another page than the one it was extracted
            # from: that text says nothing about this record. LA City and Pierce rescored 49
            # records on a moved PDF page before this guard (S403).
            src = None
            moved += 1
        if src and isinstance(rec, dict):
            new, notes = R.reconcile(rec, src["text"], college, filed.get("award") or src.get("award"))
            if notes:
                filed = dict(filed, record=new, reconciled=notes, read_run=filed.get("extracted_run"),
                             extracted_run=int(run_id) if str(run_id or "").isdigit() else run_id,
                             score=S.score(new, src["closed_list"], src["text"], filed.get("award") or src.get("award"),
                                           R.prefix_aliases(college)))
                changed.append(filed["control_number"])
                a = filed["score"]["arithmetic"]
                print("%-6s reconciled %s; arith %s" % (filed["control_number"],
                      ", ".join(n["field"] for n in notes), a.get("status")), flush=True)
            else:
                # The scorer may have learned a reading since (East LA's spaced hyphens, S403):
                # the fresh page rescores the record, and its requirements stay as read. A new
                # score carries the run too, or step=reread keeps the loaded row's old checks
                # (LA City and Pierce, rereads 39018310349 and 39018312320: 0 replaced).
                fresh = S.score(rec, src["closed_list"], src["text"], filed.get("award") or src.get("award"),
                                R.prefix_aliases(college))
                if fresh != filed.get("score"):
                    filed = dict(filed, score=fresh, read_run=filed.get("extracted_run"),
                                 extracted_run=int(run_id) if str(run_id or "").isdigit() else run_id)
                    rescored += 1
        elif not src:
            unread += 1
        _write(os.path.join(out_dir, "records", os.path.basename(path)), filed)
    print("reconcile: %d filed records changed, %d rescored, %d had no fresh page (%d of them on another page)"
          % (len(changed), rescored, unread, moved), flush=True)
    return 0


def summarize(records: list[dict], capture_report: dict) -> dict:
    """The run in numbers, for the session that reads the commit and for Sam."""
    passed = [r for r in records if r.get("score") and r["score"].get("pass")]
    def fails(check):
        return sum(1 for r in records if r.get("score") and not r["score"].get(check, {}).get("pass", True))
    total = sum(r.get("cost_usd") or 0 for r in records)
    return {"college": capture_report.get("college"), "programs": capture_report.get("programs"),
            "with_closed_list": capture_report.get("with_closed_list"), "found": capture_report.get("found"),
            "extracted": len(records), "errors": sum(1 for r in records if r.get("error")),
            "passed_machine_checks": len(passed),
            "failed": {c: fails(c) for c in ("coverage", "invented", "arithmetic", "repeated", "outcomes")},
            "cost_usd": round(total, 2), "cost_per_program": round(total / len(records), 4) if records else None,
            "not_found": capture_report.get("not_found")}


def file_run(college: str, out_dir: str, run_id: str | None) -> int:
    """Copy the run's records and account into the repository. A run that
    extracted replaces the records, sources and summary together, so the three
    always describe one read; a capture-only run files its account alone, as
    capture_preview.json, beside the read it has not replaced."""
    dest = os.path.join(COLLEGE_DIR, slug_of(college))
    with open(os.path.join(out_dir, "capture.json")) as fh:
        report = json.load(fh)
    report["run"] = run_id
    if not os.path.isdir(os.path.join(out_dir, "records")):
        os.makedirs(dest, exist_ok=True)
        _write(os.path.join(dest, "capture_preview.json"), report)
        print("capture only: filed capture_preview.json under %s" % os.path.relpath(dest, os.path.dirname(HERE)))
        return 0
    os.makedirs(os.path.join(dest, "records"), exist_ok=True)
    for old in glob.glob(os.path.join(dest, "records", "*.json")):
        os.remove(old)
    preview = os.path.join(dest, "capture_preview.json")
    if os.path.exists(preview):
        os.remove(preview)
    records = []
    for path in sorted(glob.glob(os.path.join(out_dir, "records", "*.json"))):
        with open(path) as fh:
            row = json.load(fh)
        records.append(row)
        _write(os.path.join(dest, "records", os.path.basename(path)), row)
    # Which page each program was read from, and how well it matched. The
    # catalog text itself stays in the run's artifact (the workflow keeps it 90
    # days): a college's worth of page text is megabytes, and a re-read is free.
    index = []
    for path in sorted(glob.glob(os.path.join(out_dir, "sources", "*.json"))):
        with open(path) as fh:
            src = json.load(fh)
        index.append(dict({k: src.get(k) for k in ("control_number", "title", "award", "shape", "method",
                                                   "coverage", "codes_found", "source")},
                          listed=len(src.get("closed_list") or []), text_chars=len(src.get("text") or "")))
    _write(os.path.join(dest, "sources.json"), index)
    _write(os.path.join(dest, "capture.json"), report)
    if records:
        _write(os.path.join(dest, "summary.json"), dict(summarize(records, report), run=run_id))
    print("filed %d records and %d sources under %s" % (len(records), len(index), os.path.relpath(dest, os.path.dirname(HERE))))
    return 0


# ── load: the filed records into program_requirement_records ───────────────
# Sam, 2026-10-09 (S353, as proposed): the records load UNCHECKED, and a person's
# Confirm on the Records view is the only way one becomes checked. The load reads
# the records committed under the college's folder, so what loads is what the
# branch shows, and posts them a batch at a time to the one function that may
# write them (chatbox/supabase_program_requirement_records_college_load.sql),
# which inserts and never touches a row already there.
LOAD_RPC = "rpc/program_requirement_records_college_load"
LOAD_FUNCTION = LOAD_RPC.split("/", 1)[1]
LOAD_BATCH = 25           # about 6 KB a record: a batch stays well under a request's limit
RECEIPTS = os.path.join(HERE, "receipts")


def load_rows(college: str, folder: str | None = None) -> tuple[list[dict], list[dict]]:
    """The rows a load posts, and the records it leaves out with the reason. A row
    carries the record as a reader renders it (the pilot's record_read), the three
    machine checks and its own extraction run; it never carries checked, which
    the function writes false."""
    from _program_requirements_load import record_read
    from _program_requirements_score import places_none
    dest = folder or os.path.join(COLLEGE_DIR, slug_of(college))
    with open(os.path.join(dest, "capture.json")) as fh:
        year = json.load(fh).get("catalog_year")
    rows, skipped = [], []
    for path in sorted(glob.glob(os.path.join(dest, "records", "*.json"))):
        with open(path) as fh:
            rec = json.load(fh)
        key = rec.get("control_number") or os.path.splitext(os.path.basename(path))[0]
        record = rec.get("record") if isinstance(rec.get("record"), dict) else None
        program = (record or {}).get("program")
        total = (program or {}).get("total_units") or {}
        run = str(rec.get("extracted_run") or "")
        why = None
        if rec.get("college") != college:
            why = "a record of %s" % rec.get("college")
        elif rec.get("error"):
            why = "extraction error: %s" % str(rec["error"])[:120]
        elif not isinstance(program, dict) or not isinstance(record.get("blocks"), list):
            why = "no record"
        elif (program.get("measure") or "units") not in ("units", "hours"):
            why = "measure %r" % program.get("measure")
        elif any(v is not None and (isinstance(v, bool) or not isinstance(v, (int, float)))
                 for v in (total.get("min"), total.get("max"))):
            why = "a total that is not a number"
        elif not run.isdigit():
            why = "no extraction run"
        elif places_none(rec.get("score")):
            why = "places none of its listed courses (another program's page)"
        if why:
            skipped.append({"control_number": key, "why": why})
            continue
        score = rec.get("score") or {}
        rows.append({
            "college": college, "control_number": key,
            "program_title": rec.get("title"), "award": rec.get("award"), "catalog_year": year,
            "source_url": rec.get("source_url"), "measure": program.get("measure") or "units",
            "total_min": total.get("min"), "total_max": total.get("max"),
            "record": record_read(record),
            # The scorer's counts ride with the three checks, so the Records view can say
            # "N of M placed" before a display build reaches the college (S354).
            "checks": {"coverage": (score.get("coverage") or {}).get("pass"),
                       "invented": (score.get("invented") or {}).get("pass"),
                       "arithmetic": (score.get("arithmetic") or {}).get("status"),
                       "placed": (score.get("coverage") or {}).get("placed"),
                       "listed": (score.get("coverage") or {}).get("listed")},
            "extracted_run": run})
    return rows, skipped


def receipt_path(college: str, run_id: str) -> str:
    return os.path.join(RECEIPTS, "program_requirement_records_college_%s_%s.json" % (slug_of(college), run_id))


def load_receipt(college: str, run_id: str, rows: list[dict], skipped: list[dict],
                 results: list[dict], error: str | None = None) -> dict:
    """What the load wrote, and how to take it back: the inserted keys, still
    unchecked, are the whole of it (Rule 10 a2)."""
    inserted = [k for r in results for k in (r.get("inserted_keys") or [])]
    kept = [k for r in results for k in (r.get("kept_keys") or [])]
    keys = ", ".join("'%s'" % k for k in inserted)
    return {
        "college": college, "load_run": run_id, "function": LOAD_FUNCTION,
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "records": len(rows) + len(skipped), "posted": len(rows), "batches": len(results),
        "inserted": len(inserted), "kept": len(kept), "skipped": skipped, "error": error,
        "extracted_runs": sorted({r["extracted_run"] for r in rows}),
        "machine_pass": sum(1 for r in rows if r["checks"]["coverage"] is True and r["checks"]["invented"] is True
                            and r["checks"]["arithmetic"] in ("equal", "unstated")),
        "inserted_keys": inserted, "kept_keys": kept,
        "rollback": ("delete from public.program_requirement_records where college = '%s' and checked = false "
                     "and control_number in (%s);" % (college.replace("'", "''"), keys)) if inserted else None,
    }


REREAD_RPC = "rpc/program_requirement_records_college_reread"
REREAD_FUNCTION = REREAD_RPC.split("/", 1)[1]


def reread_receipt_path(college: str, run_id: str) -> str:
    return os.path.join(RECEIPTS, "program_requirement_records_college_reread_%s_%s.json"
                        % (slug_of(college), run_id))


def reread_receipt(college: str, run_id: str, newest: str | None, rows: list[dict], skipped: list[dict],
                   results: list[dict], error: str | None = None) -> dict:
    """What the re-read replaced, and how to take it back: each replaced row's
    before-values, restored where the row still holds the re-read's run and is
    still unchecked or was checked by a confirm this run carried over (Sheet 82
    card 1), whose verdict rows the rollback deletes (Rule 10 a2)."""
    pick = lambda k: [x for r in results for x in (r.get(k) or [])]
    before = pick("before")
    carried = pick("carried_keys")
    q = lambda v: "'%s'" % str(v).replace("'", "''")
    held_by = ("(r.checked = false or r.control_number in (%s))" % ", ".join(q(k) for k in carried)
               if carried else "r.checked = false")
    return {
        "college": college, "reread_run": run_id, "function": REREAD_FUNCTION, "extracted_run": newest,
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "posted": len(rows), "batches": len(results), "skipped": skipped, "error": error,
        "replaced": len(pick("replaced_keys")), "absent": len(pick("absent_keys")),
        "held": len(pick("held_keys")), "kept": len(pick("kept_keys")), "carried": len(carried),
        "replaced_keys": pick("replaced_keys"), "absent_keys": pick("absent_keys"),
        "held_keys": pick("held_keys"), "kept_keys": pick("kept_keys"), "carried_keys": carried,
        "machine_pass": sum(1 for r in rows if r["checks"]["coverage"] is True and r["checks"]["invented"] is True
                            and r["checks"]["arithmetic"] in ("equal", "unstated")),
        "rollback": ("update public.program_requirement_records r set program_title = b.program_title, "
                     "award = b.award, catalog_year = b.catalog_year, source_url = b.source_url, "
                     "measure = b.measure, total_min = b.total_min, total_max = b.total_max, record = b.record, "
                     "checks = b.checks, extracted_run = b.extracted_run, checked = false, checked_by = null, "
                     "checked_at = null from jsonb_to_recordset(<before>) as "
                     "b(control_number text, program_title text, award text, catalog_year text, source_url text, "
                     "measure text, total_min numeric, total_max numeric, record jsonb, checks jsonb, "
                     "extracted_run bigint) where r.college = %s and r.control_number = b.control_number "
                     "and %s and r.extracted_run = %s;  -- <before> is this receipt's before, "
                     "as a jsonb literal" % (q(college), held_by, newest)
                     + ("\ndelete from public.program_record_verdicts where college = %s and control_number in (%s) "
                        "and verdict = 'confirm' and note like 'Carried over from verdict %% re-read run %s %%';"
                        % (q(college), ", ".join(q(k) for k in carried), run_id) if carried else "")) if before else None,
        "before": before,
    }


def reread(college: str, run_id: str | None, batch: int = LOAD_BATCH, post=None,
           extracted_run: str | None = None) -> int:
    """Post the records the newest extraction run filed to the re-read function.
    A record kept from an earlier run is not posted: its row already holds it.
    extracted_run names an earlier run to post instead (San Joaquin Delta, S422: two
    reconcile runs in a row, and the second left the first's 34 records stamped with
    the first run); the function's guards still decide each row."""
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key and post is None:
        print("SUPABASE_SERVICE_KEY is not set; the re-read function takes only the service role.")
        return 2
    if not (run_id and str(run_id).isdigit()):
        print("a numeric run id is required (--run, or GITHUB_RUN_ID)")
        return 2
    post = post or (lambda body: _rpc(REREAD_RPC, body, key))
    rows, skipped = load_rows(college)
    if extracted_run and not str(extracted_run).isdigit():
        print("extracted_run must be a numeric run id")
        return 2
    newest = str(extracted_run) if extracted_run else max((r["extracted_run"] for r in rows), key=int, default=None)
    rows = [r for r in rows if str(r["extracted_run"]) == str(newest)]
    results, error = [], None
    for i in range(0, len(rows), max(1, batch)):
        try:
            results.append(post({"p_college": college, "p_run": str(run_id), "p_rows": rows[i:i + batch]}))
        except Exception as exc:   # the receipt still files what was replaced before it
            error = "batch %d: %s" % (i // batch + 1, str(exc).splitlines()[0][:300])
            break
    receipt = reread_receipt(college, str(run_id), newest, rows, skipped, results, error)
    os.makedirs(RECEIPTS, exist_ok=True)
    _write(reread_receipt_path(college, str(run_id)), receipt)
    print("re-read of %s (extraction run %s): %d posted, %d replaced, %d absent, %d held, %d kept, %d confirms carried%s"
          % (college, newest, len(rows), receipt["replaced"], receipt["absent"], receipt["held"],
             receipt["kept"], receipt["carried"], "; STOPPED at " + error if error else ""))
    return 1 if error else 0


def _rpc(path: str, body: dict, key: str) -> dict:
    import urllib.request
    req = urllib.request.Request(
        P.SUPABASE_URL + "/rest/v1/" + path, data=json.dumps(body).encode(),
        headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json"},
        method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode() or "{}")


def load(college: str, run_id: str | None, batch: int = LOAD_BATCH, post=None) -> int:
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key and post is None:
        print("SUPABASE_SERVICE_KEY is not set; the load function takes only the service role.")
        return 2
    if not (run_id and str(run_id).isdigit()):
        print("a numeric run id is required (--run, or GITHUB_RUN_ID)")
        return 2
    post = post or (lambda body: _rpc(LOAD_RPC, body, key))
    rows, skipped = load_rows(college)
    results, error = [], None
    for i in range(0, len(rows), max(1, batch)):
        try:
            results.append(post({"p_college": college, "p_run": str(run_id), "p_rows": rows[i:i + batch]}))
        except Exception as exc:   # the receipt still files what loaded before it
            error = "batch %d: %s" % (i // batch + 1, str(exc).splitlines()[0][:300])
            break
    receipt = load_receipt(college, str(run_id), rows, skipped, results, error)
    os.makedirs(RECEIPTS, exist_ok=True)
    _write(receipt_path(college, str(run_id)), receipt)
    print("load of %s: %d posted, %d inserted, %d kept, %d skipped%s"
          % (college, len(rows), receipt["inserted"], receipt["kept"], len(skipped),
             "; STOPPED at " + error if error else ""))
    return 1 if error else 0


def _write(path: str, obj) -> None:
    with open(path, "w") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("step", choices=["pin", "capture", "extract", "reconcile", "file", "load", "reread"])
    ap.add_argument("--college", default="Cerritos College")
    ap.add_argument("--out", default="out")
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--shards", type=int, default=1)
    ap.add_argument("--workers", type=int, default=6, help="extraction calls at once")
    ap.add_argument("--fresh", action="store_true", help="extract every program, keeping no filed record")
    ap.add_argument("--limit", type=int, default=0, help="the first N programs only (a trial)")
    ap.add_argument("--force", default="", help="control numbers to extract again though their page is "
                                                "unchanged, comma-separated; 'incomplete' names every filed "
                                                "record whose arithmetic is incomplete")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID"))
    ap.add_argument("--extracted-run", default="", help="reread only: post this extraction run's records, not the newest's")
    args = ap.parse_args(argv)
    if args.step == "pin":
        return pin(args.college, args.run)
    if args.step == "capture":
        return capture(args.college, args.out, args.limit)
    if args.step == "load":
        return load(args.college, args.run)
    if args.step == "reread":
        return reread(args.college, args.run, extracted_run=args.extracted_run or None)
    if args.step == "reconcile":
        return reconcile_filed(args.college, args.out, args.run, os.path.join(COLLEGE_DIR, slug_of(args.college)))
    if args.step == "extract":
        keep = None if args.fresh else os.path.join(COLLEGE_DIR, slug_of(args.college))
        force = forced(keep, args.force) if keep and args.force else None
        return extract(args.out, args.shard, args.shards, args.run, args.workers, keep, force)
    return file_run(args.college, args.out, args.run)


if __name__ == "__main__":
    sys.exit(main())
