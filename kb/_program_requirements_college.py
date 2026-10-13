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
    return group_programs(progs, rows)


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


def page_codes(text: str) -> set[str]:
    """Every course-code-like token on a page, in the pilot's normal form, read
    with a one-word subject (HED 100) and a two-word one (REAL ES 7) both, since
    "A.S.-T HED 100" would otherwise read as subject "T HED". A coarse net: it
    only decides which programs are worth the exact test, so it may over-reach."""
    t = text or ""
    return ({P.norm_code(a + " " + b) for a, b in CODE_TOKEN.findall(t)} |
            {P.norm_code(a + " " + b) for a, b in CODE_TOKEN_2.findall(t)})


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
LEVEL = re.compile(r"\blevel\s*(\d+|[ivx]+)\b", re.I)
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
        if len(want & pg["codes"]) < P.ACCEPT_SHARE * len(want) * 0.8:   # the coarse net, with slack
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
    cov, net = P.coverage(found, courses), len(want & pg["codes"])
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
CQ_MAX_CALLS = 400        # navigation and section pages, before any program page
CQ_MAX_CHILDREN = 4       # an entry's own child pages read (Chaffey's Requirements)
CQ_MAX_DEPTH = 4
CQ_BREAK = re.compile(r"<\s*(?:br|/p|/div|/tr|/li|/h[1-6]|/table)\b[^>]*>", re.I)


def cq_catalog_id(urls: list[str]) -> int | None:
    """The catalog id the catalog's own scripts asked for while its start page loaded."""
    for u in urls:
        m = CQ_CATALOG_ID.search(u or "")
        if m:
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


def cq_catalog_from_list(catalogs, college: str, year: str | None) -> int | None:
    """The id of the one catalog in a host's _getCatalogs list that names this
    college (every word of its title, the year aside, is a word of the
    college's name) and, where the title carries a year, the registry's year.
    None when no catalog or more than one does."""
    words = set(re.findall(r"[a-z]+", (college or "").lower()))
    want = re.sub(r"\D", "", year or "")
    hits = []
    for c in catalogs if isinstance(catalogs, list) else []:
        title = c.get("Title") or ""
        y = CQ_YEAR.search(title)
        named = set(re.findall(r"[a-z]+", CQ_YEAR.sub(" ", title).lower()))
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
    writes them. "Degrees and Certificates Explained" names no award and has no
    dash, nor does the index. Riverside City's entries are leaves; Chaffey's
    each hold a Requirements child, which cq_pages reads as part of the entry."""
    text = nav.get("text") or ""
    return " - " in text and bool(CQ_AWARD.search(text))


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
    """An entry's title as one key: case, spacing and dashes folded."""
    return "title:" + re.sub(r"[\s\u2013\u2014-]+", " ", (nav.get("text") or "").lower()).strip()


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


def cq_json(reader, url: str, errors: list) -> dict | None:
    """One JSON call through the census's rules: robots first, the delay, one load."""
    from _program_source_census import robots_allows
    if not robots_allows(reader._robots_for(url), url):
        errors.append("%s: robots disallows" % url)
        return None
    time.sleep(reader.delay)
    reader.loads += 1
    try:
        resp = reader.request.get(url, timeout=60000)
        if not resp.ok:
            errors.append("%s: HTTP %s" % (url, resp.status))
            return None
        return resp.json()
    except Exception as exc:
        errors.append("%s: %s" % (url, str(exc).splitlines()[0][:160]))
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


def el_program_slugs(html_text: str, catalog: str) -> list[str]:
    """The program slugs a publish call's menu links, each once, in order. The
    menu writes them relative to /catalog/: href="2026-2027-Catalog/program/<slug>"."""
    pat = re.compile(r'href="(?:/catalog/)?%s/program/([^"/?#]+)"' % re.escape(catalog or ""), re.I)
    out = []
    for slug in pat.findall(html_text or ""):
        if slug not in out:
            out.append(slug)
    return out


def el_department_slugs(html_text: str, catalog: str) -> list[str]:
    """The department slugs a publish call's menu links, each once, in order.
    Cabrillo's menu links departments (href="2026-2027/department/accounting"), not
    programs; each department's content call links its programs at
    2026-2027/program/<slug> (reads 38433649784, 38437381277, S381)."""
    pat = re.compile(r'href="(?:/catalog/)?%s/department/([^"/?#]+)"' % re.escape(catalog or ""), re.I)
    out = []
    for slug in pat.findall(html_text or ""):
        if slug not in out:
            out.append(slug)
    return out


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


def el_pages_fast(reader, start: str, report: dict) -> list[dict]:
    """The catalog's program pages from its own publish calls: the full call
    once for the menu, then the content call per program. An empty list sends
    capture() to the rendered read."""
    errors: list = []
    catalog = el_catalog(start)
    shell = el_html(el_fetch(reader, el_publish_url(start, el_start_parts(start)), errors))
    slugs = el_program_slugs(shell, catalog)
    report["elumen"] = {"catalog": catalog, "read": "publish/content", "menu_programs": len(slugs),
                        "errors": errors}
    if not slugs:
        # A menu of departments (Cabrillo): each department's content call lists its programs.
        depts = el_department_slugs(shell, catalog)
        for d in depts:
            page = el_html(el_fetch(reader, el_publish_url(start, ["department", d], content=True), errors))
            slugs += [s for s in el_program_slugs(page, catalog) if s not in slugs]
        report["elumen"].update(menu_departments=len(depts), department_programs=len(slugs))
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
    if not start or platform not in ("courseleaf", "curriqunet", "elumen"):
        # Phase 2 opens on CourseLeaf (Cerritos), curriQunet (S357) and eLumen (S380); another platform names its own enumeration first.
        report["stopped"] = "this pass enumerates CourseLeaf, curriQunet and eLumen catalogs; %s reads %s" % (college, platform)
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
        else:
            scope = district_scope(start, host_registry_urls(start))
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
            if platform not in ("curriqunet", "elumen"):
                for kid in child_pages(got.get("final_url") or u, got.get("links"), start, scope):
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
        if platform not in ("curriqunet", "elumen"):
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
                # An eLumen catalog's menu is the whole list too; its links would find it again.
                if best is None and fallback < MAX_FALLBACKS and platform not in ("curriqunet", "elumen"):
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
    urls_used: dict[str, list[str]] = {}
    for r in recs:
        if r.get("source"):
            urls_used.setdefault(r["source"]["url"], []).append(r["control_number"])
    report.update(
        loads=reader.loads, seconds=round(time.time() - t0, 1),
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
        filed = has_record(os.path.join(folder, "records", cn + ".json"))
        if filed and unchanged(prev.get(cn), r):
            kept += 1
            continue
        was = prev.get(cn) or {}
        out.append({"control_number": cn, "title": r.get("title"), "award": r.get("award"),
                    "url": (r.get("source") or {}).get("url"), "coverage": r.get("coverage"),
                    "was_url": (was.get("source") or {}).get("url"), "was_coverage": was.get("coverage"),
                    "was_method": was.get("method")})
    return {"against": os.path.relpath(folder, os.path.dirname(HERE)) if prev else None,
            "kept": kept, "programs": len(out), "list": out}


def extract(out_dir: str, shard: int, shards: int, run_id: str | None, workers: int = 6,
            keep_from: str | None = None) -> int:
    import _program_requirements_extract as X
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
            if unchanged(prev.get(src["control_number"]), src) and has_record(path):
                with open(path) as fh:
                    _write(os.path.join(out_dir, "records", src["control_number"] + ".json"), json.load(fh))
                kept += 1
            else:
                fresh.append(src)
        sources = fresh
        print("kept %d records filed from the same page" % kept, flush=True)
    mine = shard_of(sources, shard, shards)
    print("extraction, shard %d of %d: %d of %d sources, %d at a time"
          % (shard + 1, shards, len(mine), len(sources), workers), flush=True)

    def one(src: dict) -> None:
        t0 = time.time()
        got = X.call(src, key)
        rec = got.get("record")
        try:
            sc = X.score(rec, src["closed_list"], src["text"]) if isinstance(rec, dict) else None
        except Exception as exc:   # one record the scorer cannot read never stops the others
            sc, got = None, dict(got, error="score: " + str(exc).splitlines()[0][:200])
        row = {"college": src["college"], "control_number": src["control_number"], "shape": src["shape"],
               "title": src["title"], "award": src.get("award"),
               "source_url": (src.get("source") or {}).get("url"), "record_shape": X.RECORD_SHAPE,
               "model": got.get("model"), "stop_reason": got.get("stop_reason"), "usage": got.get("usage"),
               "cost_usd": X.cost(got.get("model"), got.get("usage")), "ms": got.get("ms"),
               "seconds": round(time.time() - t0, 1), "parts": got.get("parts"), "error": got.get("error"), "score": sc,
               "record": rec, "extracted_run": run_id}
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
    ap.add_argument("step", choices=["capture", "extract", "file", "load"])
    ap.add_argument("--college", default="Cerritos College")
    ap.add_argument("--out", default="out")
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--shards", type=int, default=1)
    ap.add_argument("--workers", type=int, default=6, help="extraction calls at once")
    ap.add_argument("--fresh", action="store_true", help="extract every program, keeping no filed record")
    ap.add_argument("--limit", type=int, default=0, help="the first N programs only (a trial)")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID"))
    args = ap.parse_args(argv)
    if args.step == "capture":
        return capture(args.college, args.out, args.limit)
    if args.step == "load":
        return load(args.college, args.run)
    if args.step == "extract":
        keep = None if args.fresh else os.path.join(COLLEGE_DIR, slug_of(args.college))
        return extract(args.out, args.shard, args.shards, args.run, args.workers, keep)
    return file_run(args.college, args.out, args.run)


if __name__ == "__main__":
    sys.exit(main())
