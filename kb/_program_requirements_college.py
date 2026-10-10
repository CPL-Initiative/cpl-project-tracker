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


def program_candidates(urls: list[str], start: str, scope: str | None = None) -> list[str]:
    """The sitemap's pages that sit in a program section of this catalog: the
    catalog's own host (and, on a district host, this college's own path), a
    path a program section uses, and nothing a course list, policy, archive or
    PDF uses. Deduplicated, in the sitemap's order."""
    out, seen = [], set()
    for u in urls:
        u = u.split("#")[0]
        if not P.same_site(u, start) or u in seen or not in_scope(u, scope):
            continue
        path = urllib.parse.urlparse(u).path or "/"
        if path.count("/") < 2 or NOT_PROGRAM_PATH.search(path) or not PROGRAM_PATH.search(path):
            continue
        seen.add(u)
        out.append(u)
    return out


# ── giving each program its page ───────────────────────────────────────────
CODE_TOKEN = re.compile(r"\b([A-Z][A-Z&]{0,7})[\s\-]?(C?\d{1,4}(?:\.\d{1,2})?[A-Z]{0,2})\b")
CODE_TOKEN_2 = re.compile(r"\b([A-Z][A-Z&]{0,7}\s[A-Z&]{1,6})[\s\-]?(C?\d{1,4}(?:\.\d{1,2})?[A-Z]{0,2})\b")


def page_codes(text: str) -> set[str]:
    """Every course-code-like token on a page, in the pilot's normal form, read
    with a one-word subject (HED 100) and a two-word one (REAL ES 7) both, since
    "A.S.-T HED 100" would otherwise read as subject "T HED". A coarse net: it
    only decides which programs are worth the exact test, so it may over-reach."""
    t = text or ""
    return ({P.norm_code(a + " " + b) for a, b in CODE_TOKEN.findall(t)} |
            {P.norm_code(a + " " + b) for a, b in CODE_TOKEN_2.findall(t)})


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
        text, found, field = P.best_text(pg["got"], fb, fc)
        cov = P.coverage(found, courses)
        if cov < P.ACCEPT_SHARE:
            continue
        award_hit, title = label_score(pg, program)
        if len(want) < SMALL_LIST and title < 0.5:
            continue   # a list this short names its courses on many pages; the page must name the program too
        out.append({"url": pg["url"], "coverage": cov, "found": found, "text": text, "field": field,
                    "got": pg["got"], "label": {"award": award_hit, "title": title},
                    "key": (award_hit, title, round(cov, 3))})
    out.sort(key=lambda c: c["key"], reverse=True)
    return out


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
                by_page.setdefault(c["url"], []).append((cn, c))
        moved = False
        for url, claims in by_page.items():
            if len(claims) < 2:
                continue
            keep = page_winners(claims)
            for cn, _ in claims:
                if cn not in keep:
                    lost.setdefault(cn, []).append(url)
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
CQ_CATALOG_ID = re.compile(r"/catalog/(?:_getnavigation\?id=|_getactivecatalogbyid/|_getpage\?catalogid=)(\d+)", re.I)
CQ_SECTION = re.compile(r"degree|certificate|program|major|award", re.I)
CQ_AWARD = re.compile(r"\b(?:associate|certificate|a\.\s?a\.|a\.\s?s\.|bachelor|noncredit|non-credit)\b", re.I)
CQ_MAX_CALLS = 80         # navigation and section pages, before any program page
CQ_MAX_DEPTH = 4
CQ_BREAK = re.compile(r"<\s*(?:br|/p|/div|/tr|/li|/h[1-6]|/table)\b[^>]*>", re.I)


def cq_catalog_id(urls: list[str]) -> int | None:
    """The catalog id the catalog's own scripts asked for while its start page loaded."""
    for u in urls:
        m = CQ_CATALOG_ID.search(u or "")
        if m:
            return int(m.group(1))
    return None


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


def cq_page_text(page: dict) -> tuple[str, str]:
    """(the node's title, its page's text): the title, then every block in order."""
    node = (page or {}).get("page") or {}
    title = (node.get("text") or "").strip()
    parts = [title]
    for b in (page or {}).get("body") or []:
        head = (b.get("catalogblockheader") or "").strip()
        body = cq_text(b.get("text") or "")
        if head and head not in parts:
            parts.append(head)
        if body:
            parts.append(body)
    return title, "\n".join(p for p in parts if p)


def cq_lists(page: dict) -> list[dict]:
    """The lists a node's page shows (a tab list, a link list)."""
    return [nl for b in (page or {}).get("body") or [] for nl in (b.get("navlist") or [])]


def cq_is_program(nav: dict) -> bool:
    """A program entry: a leaf whose title names an award after a dash, as the
    index writes them. "Degrees and Certificates Explained" names no award and
    has no dash; the index itself has children."""
    text = nav.get("text") or ""
    return not nav.get("haschildbodynavs") and " - " in text and bool(CQ_AWARD.search(text))


def cq_index(get, catalog: int, root: str) -> tuple[list[dict], dict]:
    """Every program entry under the catalog's degree and certificate sections,
    by id, in the order found; and the account of the walk. `get(url)` returns
    the JSON at url, or None."""
    top = get("%s/Catalog/_getNavigation?id=%d&navigationtypeId=1" % (root, catalog)) or {}
    sections = [n for n in top.get("navs") or [] if CQ_SECTION.search(n.get("text") or "")]
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


def cq_page(entry: dict, page: dict | None, prefix: str) -> dict | None:
    """One program entry's page in the shape assign() reads."""
    if not page:
        return None
    title, text = cq_page_text(page)
    title = title or (entry.get("text") or "")
    url = prefix + (entry.get("aliaspath") or str(entry.get("id")))
    got = {"final_url": url, "title": title, "h1": title, "body": text, "content": text,
           "status": 200, "access": "ok", "links": []}
    return {"url": url, "title": title, "h1": title, "body": text, "content": text, "got": got,
            "codes": page_codes(text), "node": entry.get("id")}


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
        report["curriqunet"]["stopped"] = "the start page's scripts named no catalog id"
        return []
    entries, account = cq_index(lambda u: cq_json(reader, u, errors), catalog, root)
    report["curriqunet"].update(account)
    pages = []
    for i, e in enumerate(entries[:MAX_PAGES]):
        pg = cq_page(e, cq_json(reader, "%s/Catalog/_getPage?catalogId=%d&id=%s" % (root, catalog, e.get("id")),
                                errors), prefix)
        if pg:
            pages.append(pg)
        if i % 50 == 49:
            print("  read %d of %d program pages" % (i + 1, len(entries)), flush=True)
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
    if not start or platform not in ("courseleaf", "curriqunet"):
        # Phase 2 opens on CourseLeaf (Cerritos) and curriQunet (S357); another platform names its own enumeration first.
        report["stopped"] = "this pass enumerates CourseLeaf and curriQunet catalogs; %s reads %s" % (college, platform)
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
        for i, u in enumerate(urls):
            got = P.load(reader, u, cache, False)
            if got.get("access") != "ok":
                continue
            got["links"] = (got.get("links") or [])[:300]   # a program page's menus need not ride in memory
            pages.append({"url": got.get("final_url") or u, "title": got.get("title"), "h1": got.get("h1"),
                          "body": got.get("body"), "content": got.get("content"), "got": got,
                          "codes": page_codes((got.get("body") or "") + "\n" + (got.get("content") or ""))})
            if i % 50 == 49:
                print("  read %d of %d pages" % (i + 1, len(urls)), flush=True)
        report["pages_read"] = len(pages)
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
                if best is None and fallback < MAX_FALLBACKS and platform != "curriqunet":
                    fallback += 1
                    res = P.locate_html(reader, {"title": prog["title"], "award": prog["award"]},
                                        prog["closed_list"], start, cache, False)
                    b = res["best"] or {}
                    if b.get("coverage", 0.0) >= P.ACCEPT_SHARE and in_scope(b.get("url") or "", scope):
                        best, method = dict(b, label=None), "link_search"
                rec = source_record(college, prog, reg, best, method if best else "not_found")
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
        not_found=[{"control_number": r["control_number"], "title": r["title"], "award": r["award"]}
                   for r in recs if r["method"] == "not_found"],
        page_claimed=[{"control_number": r["control_number"], "title": r["title"], "award": r["award"],
                       "pages": r.get("lost_pages")} for r in recs if r["method"] == "page_claimed"],
        coverage_bands={band: sum(1 for r in recs if r.get("source") and lo <= r["coverage"] < hi)
                        for band, lo, hi in (("0.5-0.8", .5, .8), ("0.8-1.0", .8, 1.0), ("1.0", 1.0, 9))})
    _write(os.path.join(out_dir, "capture.json"), report)
    print(json.dumps({k: v for k, v in report.items() if k not in ("not_found", "shared_pages")}, indent=1))
    return 0


def unchanged(prev: dict | None, src: dict) -> bool:
    """A source read from the same page as the filed one, naming the same
    courses, so the filed record still stands and the model need not be asked
    again."""
    return bool(prev) and (prev.get("source") or {}).get("url") == (src.get("source") or {}).get("url") \
        and prev.get("coverage") == src.get("coverage") and prev.get("codes_found") == src.get("codes_found")


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
            if unchanged(prev.get(src["control_number"]), src) and os.path.isfile(path):
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
               "seconds": round(time.time() - t0, 1), "error": got.get("error"), "score": sc,
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
