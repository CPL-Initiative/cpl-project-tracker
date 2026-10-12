#!/usr/bin/env python3
"""Course outline census: where each college's course outlines of record open.

Sam, 2026-10-12, in chat to S372 (cpl_memory sam-capture-cor-system-link-2026-10-12):
"I want to adjust our procedures to capture also the system link to the colleges'
course outlines of record (CORs). These are the curriculum management systems (CMS)
such as Elumen, CurriQunet, CourseDog, CourseLeaf, Web CMS... These will allow us to
harvest the course student learning outcomes (SLOs) which we can use to match skills
harvested for industry certs. It will also support the faculty assessment process of
CPL."

This pass reads pages only, makes no model call and writes nothing to the database.
For each college in program_source_registry it starts from the catalog address, the
census's cms_public_view link and the homepage; follows up to three pages whose link
names curriculum or course outlines; collects every link into a curriculum management
host; and opens each such host's page, recording which system it is, whether it opens
to the public or asks for a sign-in, and whether a page it reached prints student
learning outcomes. The registry's own cms_public_view is the census's first CMS link,
whatever it was (49 of 118 on 2026-10-12, a mix of catalogs, one outline and a sign-in
page), so this pass reads past it.

Output: kb/course_outline_census/census_<run>.json, one row per college with every
host it met and the evidence. Where it lands in the registry waits on Sam's Open Asks
Sheet 70 card 1. It uses the program source census's polite Reader (robots first, a
delay before every load).

Usage (runner): python3 kb/_course_outline_census.py [--limit N] [--only TEXT]
       python3 kb/_course_outline_census.py --probe [--only TEXT]   (probe_<run>.json)
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "course_outline_census")

_spec = importlib.util.spec_from_file_location(
    "program_source_census", os.path.join(HERE, "_program_source_census.py"))
census = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(census)

# A course outline system by its host or path. CourseLeaf keeps its curriculum
# module (CIM) on the college's own catalog host under /courseadmin/; Governet's
# older CurricUNET lives on curricunet.com, its META product on curriqunet.com.
COR_SYSTEMS = [
    ("curriqunet", re.compile(r"curriqunet\.com", re.I)),
    ("curricunet", re.compile(r"curricunet\.com|governet", re.I)),
    ("elumen", re.compile(r"elumenapp\.com", re.I)),
    ("coursedog", re.compile(r"coursedog\.com", re.I)),
    ("courseleaf_cim", re.compile(r"/courseadmin\b|/cim/", re.I)),
    ("kuali", re.compile(r"kuali\.co", re.I)),
    ("webcms", re.compile(r"webcms", re.I)),
]
CURRICULUM_LINK = re.compile(
    r"course outlines?|outlines? of record|\bCORs?\b|curriculum (committee|management|"
    r"inventory|office|database|resources)|curricunet|curriqunet|elumen|webcms|coursedog",
    re.I)
SIGN_IN_URL = re.compile(r"login|log-in|signin|sign-in|/sso|saml|adfs|okta|/auth\b|cas/login", re.I)
SIGN_IN_TEXT = re.compile(r"\b(sign in|log in|login|single sign-on|password)\b", re.I)
SLO_TEXT = re.compile(
    r"student learning outcomes?|course learning outcomes?|\bSLOs?\b|"
    r"upon (successful )?completion of (this|the) course", re.I)
OUTLINE_TEXT = re.compile(r"course outline|outline of record|search (for )?courses|course search", re.I)

CURRICULUM_PATH = re.compile(r"curricul|course-outline|outlines?-of-record|/cor(s)?(/|$|\.)", re.I)
LOC = re.compile(r"<loc>\s*([^<\s]+)\s*</loc>", re.I)

MAX_CURRICULUM_PAGES = 3
MAX_HOSTS = 3


def system_of(url: str) -> str | None:
    """The course outline system an address points into, if any."""
    for name, pat in COR_SYSTEMS:
        if pat.search(url or ""):
            return name
    return None


def host_key(url: str) -> str:
    """One entry per system host; CourseLeaf's CIM is keyed by host and path."""
    p = urllib.parse.urlparse(url or "")
    host = p.netloc.lower()
    if system_of(url) == "courseleaf_cim":
        return host + "/courseadmin"
    return host


def is_sign_in(page: dict) -> bool:
    """A page that asks for a sign-in: its address, or a short page naming one
    with a password field."""
    final = page.get("final_url") or page.get("url") or ""
    if SIGN_IN_URL.search(urllib.parse.urlparse(final).path + "?" + urllib.parse.urlparse(final).query):
        return True
    html = (page.get("html") or "").lower()
    has_password = 'type="password"' in html or "type='password'" in html
    body = page.get("body") or ""
    return has_password and bool(SIGN_IN_TEXT.search((page.get("title") or "") + " " + body[:1500]))


def access_of(page: dict) -> str:
    """public, sign_in, refused (robots or 401/403) or unreached."""
    if page.get("access") == "robots_disallow":
        return "refused"
    status = page.get("status")
    if status is None:
        return "unreached"
    if status in (401, 403):
        return "refused"
    if is_sign_in(page) and not any(STRONG_LINK.search(a.get("href") or "") for a in page.get("links") or []):
        # curriQunet's dashboard carries a sign-in form beside a public list of course
        # outline reports (probe run 38302465625: RCCD, SDCCD, Chaffey, Cuesta), so a
        # page that links one course's outline or report is public.
        return "sign_in"
    if status >= 400:
        return "unreached"
    return "public"


def curriculum_links(page: dict, site: str) -> list[str]:
    """Links whose words name curriculum or outlines, on the college's own site."""
    out = []
    for a in page.get("links") or []:
        href, text = a.get("href") or "", a.get("text") or ""
        if not href.startswith("http") or system_of(href):
            continue
        if census.registrable(urllib.parse.urlparse(href).netloc) != site:
            continue
        if CURRICULUM_LINK.search(text) or CURRICULUM_LINK.search(urllib.parse.urlparse(href).path):
            out.append(href.split("#")[0])
    return list(dict.fromkeys(out))


def sitemap_urls(text: str) -> list[str]:
    """Every <loc> in a sitemap or sitemap index."""
    return LOC.findall(text or "")


def curriculum_urls(urls: list[str], site: str) -> list[str]:
    """Sitemap entries on the college's own site whose path names curriculum or
    course outlines, shortest first (a committee's landing page before its minutes)."""
    keep = [u for u in urls if census.registrable(urllib.parse.urlparse(u).netloc) == site
            and CURRICULUM_PATH.search(urllib.parse.urlparse(u).path)
            and not re.search(r"\.(pdf|docx?|xlsx?)$|minutes|agenda", u, re.I)]
    return sorted(dict.fromkeys(keep), key=len)


def choose(hosts: list[dict]) -> dict | None:
    """The host to record: a public one that shows outlines or SLOs first, then any
    public one, then a sign-in one, then whatever was seen."""
    def rank(h):
        acc = h.get("access")
        return (acc == "public" and bool(h.get("outline_words") or h.get("slos")),
                acc == "public", acc == "sign_in", bool(h.get("status")))
    return max(hosts, key=rank) if hosts else None


def row_for(college: str, hosts: list[dict], slo_pages: list[dict], evidence: list[dict]) -> dict:
    pick = choose(hosts)
    if not pick:
        return {"college": college, "cor_system": "none_found", "cor_url": None,
                "cor_access": "not_found", "cor_prints_slos": bool(slo_pages),
                "slo_pages": slo_pages[:3], "hosts": [], "evidence": evidence}
    return {"college": college, "cor_system": pick["system"],
            "cor_url": pick.get("final_url") or pick["url"],
            "cor_access": pick.get("access") or "unreached",
            "cor_prints_slos": bool(pick.get("slos") or slo_pages),
            "slo_pages": slo_pages[:3], "hosts": hosts, "evidence": evidence}


def cor_one(reader, reg: dict) -> dict:
    college = reg["college"]
    home = reg.get("homepage_url") or ""
    site = census.registrable(urllib.parse.urlparse(home).netloc)
    found: dict[str, dict] = {}
    slo_pages: list[dict] = []
    evidence: list[dict] = []

    def take_links(page: dict, src: str):
        for a in page.get("links") or []:
            href = a.get("href") or ""
            sysname = system_of(href)
            if sysname and href.startswith("http"):
                found.setdefault(host_key(href), {"system": sysname, "url": href.split("#")[0],
                                                  "from": src, "text": (a.get("text") or "")[:80]})

    def note(page: dict, why: str):
        evidence.append({"why": why, "url": page.get("url"), "final_url": page.get("final_url"),
                         "status": page.get("status"), "title": (page.get("title") or "")[:120]})
        if SLO_TEXT.search(page.get("body") or ""):
            m = SLO_TEXT.search(page.get("body") or "")
            slo_pages.append({"url": page.get("final_url") or page.get("url"),
                              "snippet": (page.get("body") or "")[max(0, m.start() - 80): m.end() + 160]})

    for seed in (reg.get("catalog_url"), reg.get("cms_public_view")):
        if seed and system_of(seed):
            found.setdefault(host_key(seed), {"system": system_of(seed), "url": seed, "from": "registry"})

    queue = []
    for seed, why in ((home, "homepage"), (reg.get("catalog_url"), "catalog")):
        if not seed:
            continue
        page = reader.load(seed)
        note(page, why)
        take_links(page, why)
        if site:
            queue += curriculum_links(page, site)
    # Homepages seldom link the curriculum committee (S372 sample: 6 of 12 found
    # nothing), so the college's sitemap names the pages; an index's first two
    # child sitemaps are read too.
    if home and site:
        root = census.site_root(home)
        smap = reader.load(root + "sitemap.xml")
        locs = sitemap_urls(smap.get("html") or smap.get("body") or "")
        for child in [u for u in locs if u.lower().endswith(".xml")][:2]:
            locs += sitemap_urls((reader.load(child).get("html") or ""))
        queue = curriculum_urls(locs, site)[:2] + queue
    for url in list(dict.fromkeys(queue))[:MAX_CURRICULUM_PAGES]:
        page = reader.load(url)
        note(page, "curriculum page")
        take_links(page, url)

    hosts = []
    for key, info in list(found.items())[:MAX_HOSTS]:
        page = reader.load(info["url"])
        note(page, "system: " + info["system"])
        body = page.get("body") or ""
        hosts.append({**info, "host": key, "status": page.get("status"),
                      "final_url": page.get("final_url"), "title": (page.get("title") or "")[:120],
                      "access": access_of(page),
                      "outline_words": bool(OUTLINE_TEXT.search(body + " " + (page.get("title") or ""))),
                      "slos": bool(SLO_TEXT.search(body))})
    return row_for(college, hosts, slo_pages, evidence)


# ── the probe (S373) ────────────────────────────────────────────────────────────
# Run 2 (38290631928) recorded a course outline host at 59 colleges, 47 public, but
# the host it recorded is most often the college's catalog (curriQunet's catalog/iq,
# an eLumen catalog), and its SLO flag matched a menu item or "Cal Poly SLO". A
# catalog host is no proof that a course's outline opens. The probe takes a few
# colleges on each system, opens the system's own front door (curriQunet's
# dashboard at the host's root, eLumen's /public/ view, a college's outline page),
# follows the links that name a course, an outline or a report, and records whether
# a page it reaches prints an outline's fields and a learning outcomes heading with
# text after it. One question per system: does one course's outline open to the
# public, and does it print SLOs? Pages only; no model call, no table write.
PROBE = [
    # (college, system, start address, why this one)
    ("Riverside City College", "curriqunet", "https://rccd.curriqunet.com/",
     "loaded; RCCD's host serves three loaded colleges"),
    ("San Diego Mesa College", "curriqunet", "https://sdccd.curriqunet.com/",
     "loaded; SDCCD's host serves three loaded colleges"),
    ("Chaffey College", "curriqunet", "https://chaffey.curriqunet.com/", "loaded"),
    ("Cuesta College", "curriqunet", "https://cuesta.curriqunet.com/",
     "run 2 read a course list with Reports beside each course on its dashboard"),
    ("Solano Community College", "elumen", "https://solano.elumenapp.com/public/", "eLumen's public view"),
    ("West Valley College", "elumen", "https://westvalley.elumenapp.com/public/", "eLumen's public view"),
    ("Los Medanos College", "elumen", "https://lmc.elumenapp.com/catalog/26-27/art",
     "run 2: a catalog page naming outcomes"),
    ("San Jose City College", "curricunet",
     "https://sjcc.edu/students/academic-programs/curriculum-course-and-program-outlines.aspx",
     "the college's outline page links CurricUNET"),
    ("Hartnell College", "coursedog", "https://hartnell.catalog.prod.coursedog.com/", "Coursedog's public catalog"),
]
OUTLINE_LINK = re.compile(
    r"course outline|outline of record|\bCORs?\b|\breports?\b|/DynamicReports/|entityType=Course|"
    r"/public/(course|search)|/courses?/|course_outline|courses?_?id=", re.I)
STRONG_LINK = re.compile(r"/DynamicReports/|entityType=Course|course_outline|courses?_?id=|/public/course|"
                         r"/courses?/[^/?#]+", re.I)
# A heading starts its own line in the page's text; a nav item or a sentence that
# names SLOs in passing ("Courses, and Student Learning Outcomes", "mastery of
# student learning outcomes using methods of evaluation") does not (probe run
# 38302465625: Los Medanos's menu, Chaffey's evaluation methods).
SLO_HEADING = re.compile(
    r"^[ \t]*((student|course) learning outcomes?|upon (successful )?completion of (this|the) course)",
    re.I | re.M)
# The Reader keeps 6,000 characters of a page; an outline's outcomes often sit past
# that, so the probe reads the whole text of a page it opens.
FULL_BODY_JS = """() => (document.body ? document.body.innerText : '').slice(0, 80000)"""
OUTLINE_FIELDS = [re.compile(x, re.I) for x in (
    r"\bunits?\b", r"lecture hours|hours lecture|contact hours", r"prerequisite|advisory|corequisite",
    r"course content|content outline|course outline", r"methods? of (instruction|evaluation)",
    r"objectives", r"textbook|representative texts?|instructional materials", r"catalog description")]
PROBE_FOLLOW = 3


def outline_links(page: dict, start_host: str) -> list[dict]:
    """Links on the start's host or a known system host that name a course, an
    outline or a report; a link shaped like one course's page or report first."""
    here = (page.get("final_url") or page.get("url") or "").split("#")[0]
    out = {}
    for a in page.get("links") or []:
        href, text = (a.get("href") or "").split("#")[0], (a.get("text") or "").strip()
        if not href.startswith("http") or href == here:
            continue
        host = urllib.parse.urlparse(href).netloc.lower()
        if host != start_host and not system_of(href):
            continue
        p = urllib.parse.urlparse(href)
        if SIGN_IN_URL.search(p.path + "?" + p.query):
            continue
        if OUTLINE_LINK.search(text) or OUTLINE_LINK.search(p.path + "?" + p.query):
            out.setdefault(href, {"href": href, "text": text[:80], "strong": bool(STRONG_LINK.search(href))})
    return sorted(out.values(), key=lambda x: (not x["strong"], len(x["href"])))


def slo_snippet(body: str) -> str | None:
    """A learning outcomes heading with at least 60 characters of text after it, as
    printed; a menu item or a heading with nothing under it is no SLO."""
    for m in SLO_HEADING.finditer(body or ""):
        after = (body[m.end(): m.end() + 400]).strip()
        words = re.sub(r"\s+", " ", after)
        if len(words) >= 60 and not re.match(r"(assessment|coordinator|committee|only)\b", words, re.I):
            return re.sub(r"\s+", " ", body[max(0, m.start() - 40): m.end() + 300]).strip()
    return None


def load_full(reader, url: str) -> dict:
    """reader.load, then the page's whole text while the browser is still on it."""
    page = reader.load(url)
    if page.get("status") and "application/pdf" not in (page.get("content_type") or ""):
        try:
            page["body"] = reader.page.evaluate(FULL_BODY_JS) or page.get("body") or ""
        except Exception:
            pass
    return page


def outline_fields(body: str) -> int:
    return sum(1 for pat in OUTLINE_FIELDS if pat.search(body or ""))


def probe_page(page: dict) -> dict:
    body = page.get("body") or ""
    return {"url": page.get("url"), "final_url": page.get("final_url"), "status": page.get("status"),
            "access": access_of(page), "title": (page.get("title") or "")[:120],
            "outline_fields": outline_fields(body), "slo": slo_snippet(body)}


def probe_verdict(start: dict, pages: list[dict]) -> str:
    """outline_with_slos, outline (fields, no SLO heading), list_only, sign_in,
    refused or unreached: the best a college's pages reached."""
    seen = [start] + pages
    if any(p["outline_fields"] >= 3 and p["slo"] and p["access"] == "public" for p in seen):
        return "outline_with_slos"
    if any(p["outline_fields"] >= 3 and p["access"] == "public" for p in seen):
        return "outline"
    if any(p["access"] == "public" for p in seen):
        return "list_only"
    for acc in ("sign_in", "refused"):
        if any(p["access"] == acc for p in seen):
            return acc
    return "unreached"


def probe_one(reader, college: str, system: str, start_url: str, why: str) -> dict:
    start_host = urllib.parse.urlparse(start_url).netloc.lower()
    first = load_full(reader, start_url)
    start = probe_page(first)
    links = outline_links(first, start_host)
    pages, done = [], {start_url}
    for cand in links[:PROBE_FOLLOW]:
        if cand["href"] in done:
            continue
        done.add(cand["href"])
        page = load_full(reader, cand["href"])
        got = probe_page(page)
        got["via"] = cand["text"]
        pages.append(got)
        if got["outline_fields"] < 3 and got["access"] == "public":
            # a list or a search: one step further, to its first course or report
            for nxt in outline_links(page, start_host)[:1]:
                if nxt["href"] not in done:
                    done.add(nxt["href"])
                    deeper = probe_page(load_full(reader, nxt["href"]))
                    deeper["via"] = nxt["text"]
                    pages.append(deeper)
    return {"college": college, "system": system, "why": why, "start": start,
            "links": links[:12], "pages": pages, "verdict": probe_verdict(start, pages)}


def load_registry() -> list[dict]:
    url = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    if not key:
        sys.exit("SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY is required to read the registry")
    req = urllib.request.Request(
        url.rstrip("/") + "/rest/v1/program_source_registry"
        "?select=college,homepage_url,catalog_url,catalog_platform,cms_public_view&order=college",
        headers={"apikey": key, "Authorization": "Bearer " + key})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def summarize(rows: list[dict]) -> dict:
    count = lambda k: {v: sum(1 for r in rows if r[k] == v) for v in sorted({r[k] for r in rows})}
    return {"colleges": len(rows), "by_system": count("cor_system"), "by_access": count("cor_access"),
            "prints_slos": sum(1 for r in rows if r["cor_prints_slos"])}


def probe_main(a) -> int:
    from playwright.sync_api import sync_playwright  # runner only
    rows = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        probe = browser.new_page()
        ua = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
        probe.close()
        ctx = browser.new_context(user_agent=ua + " " + census.UA_SUFFIX, accept_downloads=False)
        reader = census.Reader(ctx.new_page(), ctx.request, a.delay)
        for college, system, start, why in PROBE:
            if a.only and a.only.lower() not in college.lower():
                continue
            try:
                row = probe_one(reader, college, system, start, why)
            except Exception as exc:  # one college's failure never stops the probe
                row = {"college": college, "system": system, "why": why, "verdict": "unreached",
                       "error": str(exc).splitlines()[0][:300]}
            rows.append(row)
            print("%-28s %-11s %-18s %s" % (college[:28], system, row["verdict"],
                  next((x.get("final_url") for x in row.get("pages") or [] if x.get("slo")), "-")), flush=True)
        browser.close()
    run = os.environ.get("GITHUB_RUN_ID", "local")
    os.makedirs(OUT_DIR, exist_ok=True)
    out = {"run": run, "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "loads": reader.loads,
           "verdicts": {v: sum(1 for r in rows if r["verdict"] == v) for v in sorted({r["verdict"] for r in rows})},
           "rows": rows}
    path = os.path.join(OUT_DIR, "probe_%s.json" % run)
    with open(path, "w") as f:
        json.dump(out, f, indent=1)
    print(json.dumps(out["verdicts"], indent=1))
    print("wrote", os.path.relpath(path, os.path.dirname(HERE)))
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="")
    ap.add_argument("--delay", type=int, default=int(os.environ.get("CENSUS_DELAY_MS", "3000")))
    ap.add_argument("--probe", action="store_true", help="open one course's outline per system (PROBE)")
    a = ap.parse_args(argv)
    if a.probe:
        return probe_main(a)
    regs = load_registry()
    if a.only:
        regs = [r for r in regs if a.only.lower() in r["college"].lower()]
    if a.limit:
        regs = regs[:a.limit]

    from playwright.sync_api import sync_playwright  # runner only
    rows = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        probe = browser.new_page()
        ua = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
        probe.close()
        ctx = browser.new_context(user_agent=ua + " " + census.UA_SUFFIX, accept_downloads=False)
        reader = census.Reader(ctx.new_page(), ctx.request, a.delay)
        for i, reg in enumerate(regs, 1):
            try:
                row = cor_one(reader, reg)
            except Exception as exc:  # one college's failure never stops the pass
                row = row_for(reg["college"], [], [], [{"why": "error", "error": str(exc).splitlines()[0][:300]}])
            rows.append(row)
            print("%3d/%d %-40s %-14s %-9s %-5s %s" % (i, len(regs), reg["college"][:40], row["cor_system"],
                  row["cor_access"], "SLO" if row["cor_prints_slos"] else "-", row["cor_url"] or "-"), flush=True)
        browser.close()

    run = os.environ.get("GITHUB_RUN_ID", "local")
    os.makedirs(OUT_DIR, exist_ok=True)
    out = {"run": run, "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "loads": reader.loads, "summary": summarize(rows), "rows": rows}
    path = os.path.join(OUT_DIR, "census_%s.json" % run)
    with open(path, "w") as f:
        json.dump(out, f, indent=1)
    print(json.dumps(out["summary"], indent=1))
    print("wrote", os.path.relpath(path, os.path.dirname(HERE)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
