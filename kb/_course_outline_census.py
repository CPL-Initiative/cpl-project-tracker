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
    if is_sign_in(page):
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


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="")
    ap.add_argument("--delay", type=int, default=int(os.environ.get("CENSUS_DELAY_MS", "3000")))
    a = ap.parse_args(argv)
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
