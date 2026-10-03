#!/usr/bin/env python3
"""The program-source census: where each college's program requirements live.

Phase 0 of the program requirements harvest
(docs/reference/lanes/program-requirements-harvest.md). For each college it
finds the current catalog's home and academic year, the vendor or format
serving it, any public curriculum-system view, any recommended-sequence source
(Program Pathways Mapper or a program-map page), and how the site answered a
real browser. One row per college; the harvest's later phases read the row to
pick an extraction method.

Sam's call 5 on sheet 23 (2026-10-03) approves reading college websites from
GitHub runners "on a slow schedule that names the CPL Initiative". So:

  * it runs on a runner (the session container cannot reach college sites);
  * one college at a time, one page at a time, CENSUS_DELAY_MS between loads
    (default 4 s), at most MAX_PAGES pages per college;
  * the browser's own user agent carries a CPLInitiativeCatalogCensus token
    and the dashboard URL, so a college's web team can see who read the page;
  * robots.txt is read first for every host, and a disallowed page is never
    loaded (its row says robots_disallow).

DRY RUN IS THE DEFAULT. It writes nothing: it prints one line per college and
a JSON block between markers, which a session reads from the job log.
--apply sends the rows to program_source_census_apply() with the service key
(kb/supabase_program_source_registry.sql). That function never overwrites a
row a person corrected, and the table's trigger files every prior row in
program_source_registry_history, so a run rolls back from its run id.

Input: the registry's own rows (program_source_registry, keyed by the
catalog-data college name) when the table exists. Until then a dry run reads
kb/reference/ccc_colleges_ceo_2026.json (the CEO list, 118 colleges), reduced
to each college's site root, with HOMEPAGE_FIXES for the rows whose CEO page
sits on a president's subdomain or a vendor host.

Run (on the runner):
    python3 kb/_program_source_census.py [--apply] [--limit N] [--only TEXT]
The pure functions below are tested by tests/program_source_census_test.py
without a browser.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.robotparser
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CEO_FILE = os.path.join(HERE, "reference", "ccc_colleges_ceo_2026.json")

UA_TOKEN = "CPLInitiativeCatalogCensus"
UA_SUFFIX = (UA_TOKEN + "/1.0 (California Community Colleges CPL Initiative; "
             "+https://cpl-initiative.github.io/cpl-project-tracker/)")
MAX_PAGES = 6
NAV_TIMEOUT_MS = 30000

# The CEO list cites a president's page; four of those pages sit off the
# college's own site root. The census follows redirects from whatever it is
# given and records where each lands, so a wrong seed shows in the evidence.
HOMEPAGE_FIXES = {
    "College of Marin": "https://www.marin.edu/",
    "Santa Rosa Junior College": "https://www.santarosa.edu/",
    "Solano Community College": "https://www.solano.edu/",
    "Lemoore College": "https://www.westhillscollege.com/lemoore/",
}

# ── Platform fingerprints ──────────────────────────────────────────────────
# Order matters: the first platform with a hit in the strongest tier wins.
# Tiers: the page's own URL, then its asset URLs (script src, stylesheet href,
# meta generator), then its HTML. An HTML-only hit is weak: a footer link to a
# vendor's curriculum system is not the catalog's platform.
PLATFORM_SIGNS = [
    ("coursedog", [r"coursedog"]),
    ("courseleaf", [r"courseleaf", r"leepfrog"]),
    ("acalog", [r"acalog", r"content\.php\?catoid=", r"preview_program\.php",
                r"modern campus catalog", r"catalog\.php\?catoid="]),
    ("smartcatalog", [r"smartcatalogiq"]),
    ("elumen", [r"elumenapp", r"\belumen\b"]),
    ("curriqunet", [r"curriqunet", r"metacatalog"]),
    ("cleancatalog", [r"clean ?catalog"]),
    ("kuali", [r"kuali\.co\b", r"catalog\.kuali"]),
    ("webcms", [r"webcms"]),
    ("flipbook", [r"issuu\.com", r"flippingbook", r"flipsnack", r"publuu",
                  r"yumpu\.com"]),
]
VENDOR_PLATFORMS = {"coursedog", "courseleaf", "acalog", "smartcatalog",
                    "elumen", "curriqunet", "cleancatalog", "kuali", "webcms"}

# Curriculum systems that sometimes publish programs openly.
CMS_HOST_SIGNS = [r"curriqunet\.com", r"elumenapp\.com", r"coursedog\.com",
                  r"kuali\.co", r"webcms", r"governet"]

BLOCK_TITLE = re.compile(
    r"just a moment|attention required|access denied|request rejected|"
    r"are you a (?:robot|human)|captcha|forbidden|security check|"
    r"pardon our interruption|bot verification", re.I)

# Digit lookarounds, not \b: in "catalog_2026_27.pdf" the underscore is a word
# character, so \b finds no edge before 2026.
YEAR_PAIR = re.compile(r"(?<!\d)(20\d{2})\s*(?:-|–|—|/|_|to)\s*(20)?(\d{2})(?!\d)")


def site_root(url: str) -> str:
    """https:// and the host of a URL, with a trailing slash. Three CEO-list
    pages are http://; every college site answers https, and a seed should
    never ask for the plain-text page first."""
    if "://" not in url:
        url = "https://" + url
    return "https://" + urllib.parse.urlparse(url).netloc.lower() + "/"


def registrable(host: str) -> str:
    """The last two labels of a host: arc.losrios.edu -> losrios.edu."""
    labels = host.lower().strip(".").split(".")
    return ".".join(labels[-2:]) if len(labels) >= 2 else host.lower()


def load_colleges(path: str = CEO_FILE) -> list[dict]:
    """One {college, homepage_url} per CEO-list row, sorted by name."""
    doc = json.load(open(path, encoding="utf-8"))
    out = []
    for c in doc["colleges"]:
        name = c["college_name"]
        url = HOMEPAGE_FIXES.get(name) or site_root(c.get("ceo_website") or "")
        out.append({"college": name, "homepage_url": url})
    return sorted(out, key=lambda r: r["college"])


def load_registry() -> list[dict] | None:
    """The registry's own rows (keyed by the catalog-data college name), or
    None when the table is not there yet. --apply requires them: a row keyed
    by a CEO-list name would land beside the college's row, not on it."""
    import urllib.error
    import urllib.request

    url = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        return None
    req = urllib.request.Request(
        url.rstrip("/") + "/rest/v1/program_source_registry"
        "?select=college,homepage_url," + ",".join(KEPT_FIELDS) + ",census_run_id"
        "&order=college",
        headers={"apikey": key, "Authorization": "Bearer " + key})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            rows = json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        raise
    return [{"college": r["college"], "homepage_url": r["homepage_url"],
             "prior": {k: r.get(k) for k in KEPT_FIELDS + ("census_run_id",)}}
            for r in rows]


# A read that finds no catalog never erases one the registry already holds.
# The S322 branch read (run 37156161286) lost Columbia's eLumen catalog to a
# 30-second homepage timeout and a catalog.* host that does not resolve; the
# apply writes the row as read, so a Sunday timeout would have emptied a good
# address for a week. The read itself still files: its access status, its
# evidence, and a note naming the run the address came from.
KEPT_FIELDS = ("catalog_url", "catalog_year", "catalog_platform", "catalog_format",
               "best_method")


def keep_known_address(row: dict, prior: dict | None) -> dict:
    """The row to send: as read, unless this read found no catalog address and
    the registry holds one, which then stays with a note saying so."""
    if row.get("catalog_url") or not prior or not prior.get("catalog_url"):
        return row
    out = dict(row)
    for k in KEPT_FIELDS:
        out[k] = prior.get(k)
    note = "This read found no catalog (%s); the address from %s is kept." % (
        row.get("access_status") or "none", prior.get("census_run_id") or "an earlier run")
    out["access_notes"] = ((row.get("access_notes") or "") + " " + note).strip()
    out["census_evidence"] = dict(row.get("census_evidence") or {},
                                  kept_from=prior.get("census_run_id"))
    return out


def parse_catalog_year(*texts: str, max_start: int | None = None) -> str | None:
    """The latest academic year ('2026-2027') named in the first text that
    names one. A pair counts only when its second year follows its first."""
    if max_start is None:
        max_start = datetime.now(timezone.utc).year + 1
    for text in texts:
        if not text:
            continue
        best = None
        for m in YEAR_PAIR.finditer(text):
            a = int(m.group(1))
            b = int((m.group(2) or str(a)[:2]) + m.group(3))
            if b == a + 1 and 2000 <= a <= max_start and (best is None or a > best):
                best = a
        if best is not None:
            return "%d-%d" % (best, best + 1)
    return None


# A vendor catalog's alias can carry the year in two digits on each side:
# San Diego's curriQunet aliases read city26-27 and city25-26, one alias a
# year. Read only in an /alias/ segment on a vendor host. An eLumen slug is
# no year: Mission's current catalog lives under /catalog/24-25/, and the same
# page titled itself 2026-2027 in one read and "Catalog 24-25" in the next.
SHORT_YEAR = re.compile(r"(?<![0-9])([1-9][0-9])-([0-9]{2})(?![0-9])")
ALIAS_SEGMENT = re.compile(r"/alias/([^/]+)")


def short_year_in_vendor_path(url: str) -> str | None:
    """'2026-2027' for a vendor alias like /alias/city26-27, else None."""
    u = urllib.parse.urlparse(url or "")
    if not any(re.search(p, u.netloc.lower()) for p in VENDOR_CATALOG_HOSTS):
        return None
    alias = ALIAS_SEGMENT.search(urllib.parse.unquote(u.path).lower())
    if not alias:
        return None
    best = None
    for m in SHORT_YEAR.finditer(alias.group(1)):
        a, b = int(m.group(1)), int(m.group(2))
        if b == a + 1 and (best is None or a > best):
            best = a
    return "%d-%d" % (2000 + best, 2001 + best) if best is not None else None


def year_of_link(text: str, href: str) -> int | None:
    y = parse_catalog_year(text, urllib.parse.unquote(href), max_start=2100) \
        or short_year_in_vendor_path(href)
    return int(y[:4]) if y else None


# Words every college shares, which name no one college. What is left names
# this college: San Diego Miramar College -> {diego, miramar}.
GENERIC_NAME_WORDS = {"college", "colleges", "community", "of", "the", "and", "at",
                      "de", "del", "la", "las", "los", "el", "san", "santa", "center"}


def college_tokens(college: str | None) -> set[str]:
    """The words of a college's name that can tell it from its siblings."""
    plain = unicodedata.normalize("NFKD", college or "").encode("ascii", "ignore").decode()
    return {w for w in re.findall(r"[a-z]+", plain.lower())
            if w not in GENERIC_NAME_WORDS and len(w) > 1}


def foreign_tokens(college: str | None, colleges=()) -> frozenset[str]:
    """Words that name some OTHER college and not this one: on a district
    page, a link naming city or miramar is a sibling's catalog."""
    own = college_tokens(college)
    out: set[str] = set()
    for other in colleges or ():
        if other != college:
            out |= college_tokens(other)
    return frozenset(out - own)


def sibling_link(text: str, href: str, tokens: set[str], foreign) -> bool:
    """A link that names another college's words at least as often as this
    college's own. San Diego Continuing Education has no link on the
    district's catalogs page, and each sibling's link names "diego" too."""
    theirs = names_college(text, href, foreign) if foreign else 0
    return theirs > 0 and theirs >= names_college(text, href, tokens)


def names_college(text: str, href: str, tokens: set[str]) -> int:
    """How many of the college's own words a link names, in its text or its
    URL (an alias like miramar26-27 counts). A district page lists every
    college's catalog; the link naming the most of this college's words is
    this college's."""
    blob = (text or "").lower() + " " + urllib.parse.unquote(href or "").lower()
    return sum(1 for t in tokens if re.search(r"(?<![a-z])%s(?![a-z])" % re.escape(t), blob))


def score_catalog_link(text: str, href: str, current_start: int) -> int:
    """How likely an anchor leads to the current catalog. >= 3 is a candidate."""
    t = " ".join((text or "").split()).lower()
    h = (href or "").lower()
    if not h.startswith(("http://", "https://")):
        return -99
    host = urllib.parse.urlparse(h).netloc
    path = urllib.parse.urlparse(h).path
    s = 0
    if re.search(r"\bcatalog(ue)?s?\b", t):
        s += 3
        if re.search(r"\b(college|academic|general|current|online)\s+catalog", t):
            s += 2
        if t in ("catalog", "catalogs", "college catalog", "catalogue"):
            s += 1
    if host.startswith("catalog."):
        s += 3
    elif re.search(r"/catalogs?(/|$|\.)", path) or "catalog" in path:
        s += 1
    if re.search(r"coursedog|smartcatalogiq|elumenapp|catoid=|curriqunet|cleancatalog", h):
        s += 2
    y = year_of_link(t, h)
    if y is not None:
        if y >= current_start:
            s += 2
        elif y == current_start - 1:
            s += 1
        else:
            s -= 2
    if "library" in t or "library" in host or "/library" in path or "worldcat" in h:
        s -= 6
    # A schedule link loses, unless it names the catalog too: Diablo Valley's
    # catalog page is "Class Schedule & Catalog" (run 37139324090).
    if re.search(r"\b(class|course) schedule\b|schedule of classes", t) \
            and not re.search(r"\bcatalog(ue)?s?\b", t):
        s -= 2
    if re.search(r"addend|supplement|errata|archive|previous|past catalog|change ?log",
                 t + " " + path):
        s -= 2
    if re.search(r"\b(order|purchase|request)\b", t):
        s -= 1
    return s


def pick_catalog_candidates(links: list[dict], current_start: int,
                            limit: int = 5) -> list[dict]:
    """The best-scoring distinct catalog links, highest first."""
    seen, out = set(), []
    for a in links:
        href = (a.get("href") or "").split("#")[0]
        if not href or href in seen:
            continue
        sc = score_catalog_link(a.get("text", ""), href, current_start)
        if sc >= 3:
            seen.add(href)
            out.append({"text": " ".join((a.get("text") or "").split())[:80],
                        "href": href, "score": sc})
    out.sort(key=lambda r: (-r["score"], len(r["href"])))
    return out[:limit]


def newer_year_first(cands: list[dict], college: str | None = None,
                     foreign=frozenset()) -> list[dict]:
    """Two candidates on one host that name different years: the newer goes
    first, whatever their words scored. San Diego City's homepage links
    city25-26 as "Course Catalog" and city26-27 as "City College Catolog";
    the misspelling cost the newer link its catalog word, and the first apply
    (run 37142060932) filed 2025-26. An addendum, an archive or a sibling's
    link never moves ahead."""
    tokens = college_tokens(college)

    def eligible(c):
        blob = (c.get("text", "") + " " + c.get("href", "")).lower()
        return not re.search(r"addend|supplement|errata|archive|previous|past catalog"
                             r"|change ?log", blob) \
            and not sibling_link(c.get("text", ""), c.get("href", ""), tokens, foreign)

    out = list(cands)
    i = 0
    while i < len(out):
        c = out[i]
        y = year_of_link(c.get("text", ""), c.get("href", ""))
        host = urllib.parse.urlparse(c.get("href", "")).netloc.lower()
        later = [j for j in range(i + 1, len(out))
                 if urllib.parse.urlparse(out[j].get("href", "")).netloc.lower() == host
                 and eligible(out[j])
                 and (year_of_link(out[j].get("text", ""), out[j].get("href", ""))
                      or 0) > (y or 9999)]
        if later:
            j = max(later, key=lambda k: year_of_link(out[k]["text"], out[k]["href"]))
            moved = dict(out.pop(j), ahead_of=c.get("href"))
            out.insert(i, moved)
            continue
        i += 1
    return out


# Hosts that serve a vendor's public catalog. A college's own "Catalogs" page
# often names the vendor only through a link like these; the first dry run on
# main (2026-10-03) stopped at that page for Bakersfield, Berkeley City and
# Butte while the catalog itself sat one link away.
VENDOR_CATALOG_HOSTS = [r"curriqunet\.com", r"elumenapp\.com", r"coursedog\.com",
                        r"smartcatalogiq\.com", r"cleancatalog", r"kuali\.co",
                        r"acalog"]


def vendor_catalog_link(links: list[dict], current_start: int,
                        college: str | None = None,
                        foreign=frozenset()) -> dict | None:
    """The link on a college's catalog page that opens the vendor's catalog:
    a vendor host (or a catalog.* host) whose path names a catalog, never a
    login page, a change log or a library. On a district page that lists
    every college's catalog, the link naming this college wins over a better
    year for a sibling: the first full read (run 37137334059) gave Miramar and
    San Diego Continuing Education City College's catalog. Among this
    college's links the current year wins."""
    tokens = college_tokens(college)
    best = None
    for a in links:
        raw = a.get("href") or ""
        full = raw.lower()
        if not full.startswith(("http://", "https://")):
            continue
        if re.search(r"login|signin|sign-in|/admin|library|worldcat|change-?log", full):
            continue
        u = urllib.parse.urlparse(raw.split("#")[0])
        host, path = u.netloc.lower(), u.path.lower()
        vendor = any(re.search(p, host) for p in VENDOR_CATALOG_HOSTS)
        catalog_host = host.startswith("catalog.") or ".catalog." in host
        if not ((vendor and ("catalog" in path or catalog_host)) or catalog_host):
            continue
        text = " ".join((a.get("text") or "").split())
        # An archive is never the current catalog: with its siblings' links
        # refused, San Diego Continuing Education took City's
        # Catalog/archive/13 (run 37140411314).
        if re.search(r"archive|previous|\bpast\b", text.lower() + " " + path):
            continue
        if sibling_link(text, raw, tokens, foreign):
            continue
        s = 3 + (2 if vendor else 0)
        y = year_of_link(text.lower(), full)
        if y is not None:
            s += 2 if y >= current_start else (1 if y == current_start - 1 else -3)
        # One word of this college's name outweighs the widest year swing (5).
        s += 6 * names_college(text, raw, tokens)
        cand = {"text": text[:80], "href": raw.split("#")[0], "score": s}
        if best is None or (s, -len(cand["href"])) > (best["score"], -len(best["href"])):
            best = cand
    return best


def hub_links(links: list[dict], limit: int = 2) -> list[str]:
    """Pages worth one more hop when the homepage names no catalog."""
    out = []
    for a in links:
        t = " ".join((a.get("text") or "").split()).lower()
        h = a.get("href") or ""
        if h.startswith("http") and re.fullmatch(
                r"(academics?|academic programs|programs( of study)?|"
                r"programs (and|&) degrees|degrees (and|&) certificates|"
                r"admissions? (and|&) records|class schedule|current students|students)",
                t) and h not in out:
            out.append(h)
        if len(out) >= limit:
            break
    return out


def sequence_signal(links: list[dict]) -> tuple[str, str | None]:
    """('ppm', url) for a Program Pathways Mapper link, ('program_map_page',
    url) for a page named as program maps, else ('none_found', None)."""
    page = None
    for a in links:
        h = (a.get("href") or "")
        t = " ".join((a.get("text") or "").split()).lower()
        if re.search(r"programmapper|program-mapper|programpathwaysmapper", h, re.I):
            return "ppm", h
        if page is None and re.search(
                r"program (pathways? )?maps?|degree maps?|academic maps?|"
                r"pathway maps?|program mapper|guided pathways? maps?", t):
            page = h
    return ("program_map_page", page) if page else ("none_found", None)


def cms_signal(links: list[dict]) -> str | None:
    """The first link into a curriculum management system, if any."""
    for a in links:
        h = a.get("href") or ""
        host = urllib.parse.urlparse(h).netloc.lower()
        if any(re.search(p, host) for p in CMS_HOST_SIGNS):
            return h
    return None


def fingerprint_platform(url: str, assets: list[str], html: str) -> tuple[str, str]:
    """(platform, tier) where tier is url, assets, html, or none."""
    tiers = [("url", (url or "").lower()),
             ("assets", " ".join(assets or []).lower()),
             ("html", (html or "").lower())]
    for tier, blob in tiers:
        if not blob:
            continue
        for platform, pats in PLATFORM_SIGNS:
            if any(re.search(p, blob) for p in pats):
                return platform, tier
    return "custom_html", "none"


def classify_access(status: int | None, title: str, error: str | None = None) -> str:
    if error or status is None:
        return "unreachable"
    if status in (404, 410):
        return "not_found"
    if status in (401, 403, 406, 429, 503) or BLOCK_TITLE.search(title or ""):
        return "blocked"
    if status >= 400:
        return "unreachable"
    return "ok"


def catalog_format(platform: str, url: str, content_type: str,
                   pdf_links: int) -> str:
    if platform == "pdf" or url.lower().split("?")[0].endswith(".pdf") \
            or "application/pdf" in (content_type or ""):
        return "single_pdf"
    if platform == "flipbook":
        return "flipbook"
    if platform in VENDOR_PLATFORMS:
        return "html_per_program"
    if pdf_links >= 5:
        return "pdf_by_section"
    return "unknown"


def best_method(platform: str | None, fmt: str | None) -> str:
    if platform in VENDOR_PLATFORMS:
        return "platform_reader"
    if fmt in ("single_pdf", "pdf_by_section", "flipbook"):
        return "pdf_extraction"
    return "unknown"


def robots_allows(robots_txt: str | None, url: str, ua: str = UA_TOKEN) -> bool:
    """True unless robots.txt disallows the URL for our token or for *."""
    if not robots_txt:
        return True
    rp = urllib.robotparser.RobotFileParser()
    rp.parse(robots_txt.splitlines())
    return rp.can_fetch(ua, url)


def build_row(college: str, homepage_url: str, home: dict, catalog: dict | None,
              seq: tuple[str, str | None], cms: str | None,
              evidence: dict) -> dict:
    """The registry row for one college, from what the browser saw."""
    if home.get("access") != "ok" and not catalog:
        access = home.get("access") or "unreachable"
        notes = "Homepage: %s (HTTP %s%s)." % (
            access, home.get("status"),
            ", " + home["title"][:80] if home.get("title") else "")
        return {"college": college, "homepage_url": homepage_url,
                "catalog_url": None, "catalog_year": None,
                "catalog_platform": None, "catalog_format": None,
                "cms_public_view": cms, "sequence_source": "unknown",
                "sequence_url": None, "best_method": "unknown",
                "access_status": access, "access_notes": notes,
                "census_evidence": evidence}
    if not catalog:
        return {"college": college, "homepage_url": homepage_url,
                "catalog_url": None, "catalog_year": None,
                "catalog_platform": "unknown", "catalog_format": "unknown",
                "cms_public_view": cms, "sequence_source": seq[0],
                "sequence_url": seq[1], "best_method": "unknown",
                "access_status": "ok",
                "access_notes": "No catalog link found on the homepage or one hop in.",
                "census_evidence": evidence}
    notes = []
    if home.get("access") != "ok":
        notes.append("Homepage: %s (HTTP %s)." % (home.get("access"), home.get("status")))
    if catalog.get("access") != "ok":
        notes.append("Catalog page: %s (HTTP %s)." % (catalog.get("access"),
                                                     catalog.get("status")))
    if catalog.get("tier") == "html":
        notes.append("Platform read from page text only.")
    if catalog.get("found_by") and catalog["found_by"] != "homepage":
        notes.append("Catalog found by %s." % catalog["found_by"])
    return {"college": college, "homepage_url": homepage_url,
            "catalog_url": catalog.get("final_url") or catalog.get("url"),
            "catalog_year": catalog.get("year"),
            "catalog_platform": catalog.get("platform"),
            "catalog_format": catalog.get("format"),
            "cms_public_view": cms, "sequence_source": seq[0],
            "sequence_url": seq[1],
            "best_method": best_method(catalog.get("platform"), catalog.get("format")),
            "access_status": catalog.get("access") or "ok",
            "access_notes": " ".join(notes) or None,
            "census_evidence": evidence}


# ── The browser half (runner only) ─────────────────────────────────────────
# innerText is empty for a link inside a menu hidden with visibility:hidden,
# the usual way a mega-menu waits for a hover; textContent still holds its
# words. Compton, Laney and Rio Hondo answered 200 with no catalog link found
# (run 37137334059).
LINKS_JS = """() => Array.from(document.querySelectorAll('a[href]')).slice(0, 1500)
  .map(a => ({text: (a.innerText || a.textContent || a.getAttribute('aria-label')
                     || a.title || '').trim(),
              href: a.href}))"""
ASSETS_JS = """() => [
  ...Array.from(document.querySelectorAll('script[src]')).map(s => s.src),
  ...Array.from(document.querySelectorAll('link[href]')).map(l => l.href),
  ...Array.from(document.querySelectorAll('meta[name=generator]')).map(m => 'generator:' + m.content)
].slice(0, 300)"""
HEADING_JS = """() => { const h = document.querySelector('h1'); return h ? h.innerText : ''; }"""
# The opening of the page's own words: a catalog often names its edition in a
# banner rather than its title or h1.
BODY_JS = """() => (document.body ? document.body.innerText : '').slice(0, 6000)"""


class Reader:
    """One polite browser: robots first, a delay before every load."""

    def __init__(self, page, request, delay_ms: int):
        self.page, self.request, self.delay = page, request, delay_ms / 1000.0
        self.robots: dict[str, str | None] = {}
        self.loads = 0

    def _robots_for(self, url: str) -> str | None:
        root = site_root(url)
        if root not in self.robots:
            try:
                r = self.request.get(root + "robots.txt", timeout=15000)
                self.robots[root] = r.text() if r.ok else None
            except Exception:
                self.robots[root] = None
        return self.robots[root]

    def load(self, url: str) -> dict:
        out = {"url": url}
        if not robots_allows(self._robots_for(url), url):
            out.update(access="robots_disallow", status=None)
            return out
        time.sleep(self.delay)
        self.loads += 1
        try:
            resp = self.page.goto(url, wait_until="domcontentloaded",
                                  timeout=NAV_TIMEOUT_MS)
            try:
                self.page.wait_for_load_state("networkidle", timeout=8000)
            except Exception:
                pass
            status = resp.status if resp else None
            ctype = (resp.headers.get("content-type", "") if resp else "")
            out.update(status=status, final_url=self.page.url, content_type=ctype)
            if "application/pdf" in ctype:
                out.update(title="", links=[], assets=[], html="", h1="")
            else:
                out["title"] = self.page.title() or ""
                out["links"] = self.page.evaluate(LINKS_JS)
                out["assets"] = self.page.evaluate(ASSETS_JS)
                out["h1"] = self.page.evaluate(HEADING_JS) or ""
                out["body"] = self.page.evaluate(BODY_JS) or ""
                out["html"] = self.page.content()[:400000]
            out["access"] = classify_access(status, out.get("title", ""))
        except Exception as exc:  # navigation error, timeout, download
            msg = str(exc).splitlines()[0][:200]
            if "Download is starting" in msg:
                out.update(status=200, final_url=url, content_type="application/pdf",
                           title="", links=[], assets=[], html="", h1="", access="ok")
            else:
                out.update(status=None, error=msg, access="unreachable")
        return out


# A vendor's catalog prints its edition in a banner near the top of the page:
# CourseLeaf "Cuyamaca College GCCCD 2026-2027 EDITION", curriQunet "Laney
# College Academic Catalog 2026-2027", eLumen "2025-2026 Catalog". The branch
# read of S322 (run 37154900912) found such a banner on 19 vendor pages whose
# title and h1 name no year: 17 had no year at all, Cuyamaca took 2025-26 from
# an older link on the college's own page, and Madera took 2025-26 from a page
# slug while its banner reads 2026-2027. Only a page the address or its assets
# place on a vendor counts: on a college's own page, an Acalog option list or a
# page that names a vendor only in its text, a year beside "catalog" is as
# often an archive, a calendar or a sibling's catalog (Cuesta's "past catalogs
# from 2004-2005", Delta's "[ARCHIVED CATALOG]", San Diego Continuing
# Education's "City College 2026-2027").
BANNER_PLATFORMS = {"courseleaf", "curriqunet", "elumen", "coursedog", "smartcatalog"}
BANNER_WORD = re.compile(r"\b(catalog|edition)\b", re.I)
BANNER_REFUSE = re.compile(r"archiv|previous|\bpast\b|\bprior\b", re.I)


def banner_year(text: str, max_start: int | None = None) -> str | None:
    return banner_match(text, max_start)[0]


def banner_match(text: str, max_start: int | None = None) -> tuple[str | None, str | None]:
    """The latest year the opening of a vendor catalog's own words names beside
    "catalog" or "edition". Refused: a year whose own phrase, between it and
    that word, names an archive or a previous catalog (Delta's "2025-2026 San
    Joaquin Delta College Catalog [ARCHIVED"), and one "coming soon" follows
    (Glendale's "2026-2027 Catalog Coming Soon"). The menu around a banner is
    not its phrase: CourseLeaf's "CATALOG ARCHIVE APPLY 2026-2027 CATALOG HOME"
    names the 2026-27 catalog. A FAFSA banner or an academic calendar names no
    catalog and never counts. There is no sibling check: the census has
    already chosen this college's catalog page, and the words of a college's
    name are menu words too (Crafton Hills' "Give to Crafton ... Mission" read
    as Mission College, run 37154900912)."""
    if max_start is None:
        max_start = datetime.now(timezone.utc).year + 1
    best, words = None, None
    for m in YEAR_PAIR.finditer(text or ""):
        a = int(m.group(1))
        b = int((m.group(2) or str(a)[:2]) + m.group(3))
        if b != a + 1 or not 2000 <= a <= max_start:
            continue
        before = text[max(0, m.start() - 25):m.start()]
        after = text[m.end():m.end() + 25]
        word_after = BANNER_WORD.search(after)
        words_before = list(BANNER_WORD.finditer(before))
        if word_after:
            phrase = after[:word_after.start()]
        elif words_before:
            phrase = before[words_before[-1].end():]
        else:
            continue
        if BANNER_REFUSE.search(phrase) or re.search(r"coming soon", after, re.I):
            continue
        if best is None or a > best:
            best = a
            words = " ".join((before + text[m.start():m.end()] + after).split())
    return ("%d-%d" % (best, best + 1), words) if best is not None else (None, None)


def catalog_year_from(page: dict, url: str, link_text: str, platform: str | None = None,
                      tier: str | None = None) -> tuple[str | None, str | None]:
    """The catalog's year and which text named it: the page's title, its h1,
    a vendor catalog's own banner, its address, the words of the link that led
    to it, or a vendor alias. The page's own words outrank a college's link to
    it: Cuyamaca read 2025-26 and Grossmont 2026-27 off one CourseLeaf host
    with the same yearless title (run 37142060932), and Cuyamaca's banner reads
    2026-2027 (run 37154900912). A banner never lowers a year the address or
    the link named: Crafton Hills' SmartCatalog address names 2026-2027 beside
    a menu of older catalogs."""
    for source, text in (("title", page.get("title", "")), ("h1", page.get("h1", ""))):
        y = parse_catalog_year(text)
        if y:
            return y, source
    other, other_from = None, None
    for source, text in (("address", urllib.parse.unquote(url)), ("link text", link_text)):
        other = parse_catalog_year(text)
        if other:
            other_from = source
            break
    if not other:
        other = short_year_in_vendor_path(url)
        other_from = "vendor alias" if other else None
    if platform in BANNER_PLATFORMS and tier in ("url", "assets"):
        y = banner_year(page.get("body", ""))
        if y and (other is None or y > other):
            return y, "banner"
    return other, other_from


def year_in_body(text: str) -> tuple[str | None, str | None]:
    """The latest academic year the opening of the page's own text names, and
    the words around it, whatever the page. Evidence for a person: the year
    itself comes from banner_year(), on a vendor's page only."""
    y = parse_catalog_year(text or "")
    if not y:
        return None, None
    for m in YEAR_PAIR.finditer(text):
        if int(m.group(1)) == int(y[:4]):
            words = " ".join(text[max(0, m.start() - 50):m.end() + 50].split())
            return y, words[:140]
    return y, None


def read_catalog(reader: Reader, cand: dict, current_start: int,
                 depth: int = 0, college: str | None = None,
                 foreign=frozenset()) -> dict:
    """Load a candidate and describe it; follow one hop to the vendor's
    catalog when the page names a vendor only in its text, or to the newest
    year when the page is an index of catalogs rather than a catalog."""
    page = reader.load(cand["href"])
    page["found_by"] = cand.get("found_by", "homepage")
    url = page.get("final_url") or cand["href"]
    is_pdf = "application/pdf" in (page.get("content_type") or "") \
        or url.lower().split("?")[0].endswith(".pdf")
    if is_pdf:
        platform, tier = "pdf", "url"
    else:
        platform, tier = fingerprint_platform(url, page.get("assets", []),
                                              page.get("html", ""))
    year, year_from = catalog_year_from(page, url, cand.get("text", ""), platform, tier)
    links = page.get("links") or []
    pdf_links = sum(1 for a in links
                    if (a.get("href") or "").lower().split("?")[0].endswith(".pdf"))
    # The college's page names a vendor only in its text, or names no year
    # and no vendor at all: the catalog is the vendor (or catalog.*) link on
    # it, one hop away. Merced's catalog page links catalog.mccd.edu beside
    # its yearly PDFs (run 37139324090).
    yearless_custom = platform == "custom_html" and year is None
    if (not is_pdf and (tier == "html" or yearless_custom) and depth == 0
            and page.get("access") == "ok" and reader.loads < MAX_PAGES):
        hop = vendor_catalog_link(links, current_start, college, foreign)
        if hop is not None:
            hop["found_by"] = "the vendor link on " + url
            inner = read_catalog(reader, hop, current_start, depth + 1, college,
                                 foreign)
            # A hop that lands on an older year than the page it left is a
            # wrong turn: Porterville's "2026-2027 CATALOG" page led to an
            # eLumen change log read as 2021-22 (run 37137334059).
            older = year and inner.get("year") and inner["year"] < year
            if inner.get("access") == "ok" and not older:
                inner["index_url"] = url
                return inner
    # An index of catalogs: no year of its own, several year-named catalog links.
    if (not is_pdf and platform == "custom_html" and year is None
            and depth == 0 and reader.loads < MAX_PAGES):
        tokens = college_tokens(college)
        listed = [c for c in pick_catalog_candidates(links, current_start, limit=12)
                  if year_of_link(c["text"], c["href"]) is not None]
        # Every year-named link says the page is an index; the choice is
        # never an addendum (Merced's index handed over a 2025-26 addendum)
        # or a sibling's catalog. Yuba's page lists its 2026-27 catalog and
        # its addendum, so the count comes before the filter (run 37140411314).
        yearly = [c for c in listed
                  if not re.search(r"addend|supplement|errata",
                                   (c["text"] + " " + c["href"]).lower())
                  and not sibling_link(c["text"], c["href"], tokens, foreign)]
        if len(listed) >= 2 and yearly:
            newest = max(yearly, key=lambda c: (names_college(c["text"], c["href"], tokens),
                                                year_of_link(c["text"], c["href"])))
            newest["found_by"] = "the catalog index"
            inner = read_catalog(reader, newest, current_start, depth + 1, college,
                                 foreign)
            inner["index_url"] = url
            return inner
    body_year, body_words = year_in_body(page.get("body", ""))
    banner_words = banner_match(page.get("body", ""))[1] if year_from == "banner" else None
    page.update(platform=platform, tier=tier, year=year, year_from=year_from,
                banner_words=banner_words,
                body_year=body_year, body_year_words=body_words,
                format=catalog_format(platform, url, page.get("content_type", ""),
                                      pdf_links),
                pdf_links=pdf_links)
    return page


def census_one(reader: Reader, college: str, homepage_url: str,
               current_start: int, others=()) -> dict:
    """One college's row. others: every college's name, so a district page's
    sibling links can be told from this college's own."""
    foreign = foreign_tokens(college, others)
    reader.loads = 0
    t0 = time.time()
    home = reader.load(homepage_url)
    links = list(home.get("links") or [])
    cands = pick_catalog_candidates(links, current_start)
    hubs_read = []
    if home.get("access") == "ok" and not cands:
        for hub in hub_links(links):
            if reader.loads >= MAX_PAGES - 2:
                break
            hp = reader.load(hub)
            hubs_read.append({"url": hub, "status": hp.get("status"),
                              "access": hp.get("access")})
            more = hp.get("links") or []
            links.extend(more)
            for c in pick_catalog_candidates(more, current_start):
                c["found_by"] = "one hop in (%s)" % hub
                cands.append(c)
        cands.sort(key=lambda r: -r["score"])
    cands = newer_year_first(cands, college, foreign)
    # Probe catalog.<domain> whenever nothing named a catalog, the homepage's
    # own failure included: the four Los Rios homepages answered 404 and De
    # Anza's and City College of San Francisco's served challenges (run
    # 37137334059), and a catalog host often sits apart from the homepage.
    if not cands:
        host = urllib.parse.urlparse(home.get("final_url") or homepage_url).netloc
        probe = "https://" + "catalog." + registrable(host) + "/"
        cands.append({"text": "", "href": probe, "score": 0,
                      "found_by": "probing " + probe})
    catalog, tried = None, []
    for cand in cands[:2]:
        if reader.loads >= MAX_PAGES:
            break
        page = read_catalog(reader, cand, current_start, college=college,
                            foreign=foreign)
        tried.append({k: page.get(k) for k in
                      ("url", "final_url", "status", "access", "title", "h1",
                       "platform", "tier", "year", "year_from", "banner_words", "body_year",
                       "body_year_words", "format", "found_by", "index_url",
                       "error")})
        if page.get("access") == "ok":
            catalog = page
            break
        # A blocked catalog is still the catalog's address; a blocked probe is
        # only a guess at one.
        if (catalog is None and page.get("access") in ("blocked", "robots_disallow")
                and not page.get("found_by", "").startswith("probing")):
            catalog = page
    if catalog:
        links.extend(catalog.get("links") or [])
    seq = sequence_signal(links)
    cms = cms_signal(links)
    # When no link scored, the links that still mention a catalog show a
    # person why: the first full read left three open homepages unexplained.
    catalog_like = [] if catalog else [
        {"text": " ".join((a.get("text") or "").split())[:60], "href": a.get("href"),
         "score": score_catalog_link(a.get("text", ""), a.get("href", ""), current_start)}
        for a in links if "catalog" in ((a.get("text") or "") + (a.get("href") or "")).lower()
    ][:5]
    evidence = {
        "homepage": {k: home.get(k) for k in
                     ("url", "final_url", "status", "access", "title", "error")},
        "candidates": cands[:5],
        "catalog_like_links": catalog_like,
        "hubs_read": hubs_read,
        "catalog_pages": tried,
        "pages_loaded": reader.loads,
        "seconds": round(time.time() - t0, 1),
    }
    if catalog and catalog.get("access") != "ok":
        catalog = dict(catalog, year=catalog.get("year"),
                       platform=catalog.get("platform") or "unknown",
                       format=catalog.get("format") or "unknown")
    return build_row(college, homepage_url, home, catalog, seq, cms, evidence)


def run(colleges: list[dict], delay_ms: int, all_names=()) -> list[dict]:
    from playwright.sync_api import sync_playwright  # runner only

    current_start = datetime.now(timezone.utc).year
    if datetime.now(timezone.utc).month < 7:
        current_start -= 1   # before July the current catalog began last year
    rows = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        probe = browser.new_page()
        ua = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
        probe.close()
        ctx = browser.new_context(user_agent=ua + " " + UA_SUFFIX,
                                  accept_downloads=False)
        page = ctx.new_page()
        reader = Reader(page, ctx.request, delay_ms)
        for i, c in enumerate(colleges, 1):
            try:
                row = census_one(reader, c["college"], c["homepage_url"], current_start,
                                 all_names)
            except Exception as exc:
                row = build_row(c["college"], c["homepage_url"],
                                {"access": "unreachable", "status": None, "title": ""},
                                None, ("unknown", None), None,
                                {"error": str(exc).splitlines()[0][:300]})
            rows.append(row)
            print("%3d/%d %-40s %-12s %-15s %-9s %-16s %s" % (
                i, len(colleges), c["college"][:40], row["access_status"] or "-",
                row["catalog_platform"] or "-", row["catalog_year"] or "-",
                row["sequence_source"] or "-", row["catalog_url"] or "-"), flush=True)
        browser.close()
    return rows


def shard_of(spec: str) -> tuple[int, int]:
    """'2/4' -> (2, 4). A pass split four ways loses one quarter, not the
    hour, when a runner dies: the first full dry run (run 37133680797) ended
    after 45 minutes with no log at all."""
    m = re.fullmatch(r"\s*(\d+)\s*/\s*(\d+)\s*", spec or "")
    if not m or not (1 <= int(m.group(1)) <= int(m.group(2))):
        raise SystemExit("--shard wants k/n with 1 <= k <= n, got %r" % spec)
    return int(m.group(1)), int(m.group(2))


def apply_rows(rows: list[dict], run_id: str) -> dict:
    import urllib.request

    url = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    req = urllib.request.Request(
        url.rstrip("/") + "/rest/v1/rpc/program_source_census_apply",
        data=json.dumps({"p_run_id": run_id, "p_rows": rows}).encode(),
        headers={"apikey": key, "Authorization": "Bearer " + key,
                 "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode() or "{}")


def summarize(rows: list[dict]) -> dict:
    def count(field):
        out: dict[str, int] = {}
        for r in rows:
            k = r.get(field) or "none"
            out[k] = out.get(k, 0) + 1
        return dict(sorted(out.items(), key=lambda kv: -kv[1]))
    return {"colleges": len(rows),
            "with_catalog_url": sum(1 for r in rows if r.get("catalog_url")),
            "with_year": sum(1 for r in rows if r.get("catalog_year")),
            "access_status": count("access_status"),
            "catalog_platform": count("catalog_platform"),
            "catalog_format": count("catalog_format"),
            "sequence_source": count("sequence_source"),
            "best_method": count("best_method"),
            "with_cms_view": sum(1 for r in rows if r.get("cms_public_view"))}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--apply", action="store_true",
                    help="send the rows to program_source_census_apply()")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="", help="colleges whose name contains this")
    ap.add_argument("--shard", default="", help="k/n: every n-th college from the k-th")
    args = ap.parse_args(argv)

    colleges = load_registry()
    source = "the registry"
    if colleges is None:
        if args.apply:
            print("program_source_registry is not there yet; --apply needs its rows.")
            return 2
        colleges, source = load_colleges(), "the CEO list (no registry yet)"
    all_names = [c["college"] for c in colleges]   # before any slice or filter
    if args.only:
        colleges = [c for c in colleges if args.only.lower() in c["college"].lower()]
    if args.limit:
        colleges = colleges[:args.limit]
    run_id = "census-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    if args.shard:
        k, n = shard_of(args.shard)
        colleges = [c for i, c in enumerate(colleges) if i % n == k - 1]
        run_id += "-s%dof%d" % (k, n)
    delay = int(os.environ.get("CENSUS_DELAY_MS", "4000"))
    print("program-source census %s: %d colleges from %s, %.1f s between loads, %s" % (
        run_id, len(colleges), source, delay / 1000,
        "APPLY" if args.apply else "dry run"))

    read = run(colleges, delay, all_names)
    prior = {c["college"]: c.get("prior") for c in colleges}
    rows = [keep_known_address(r, prior.get(r["college"])) for r in read]
    kept = [a["college"] for a, b in zip(read, rows) if a is not b]
    if kept:
        print("kept a known address for %d college(s) this read could not find: %s"
              % (len(kept), "; ".join(kept)))
    print("\n=== CENSUS SUMMARY ===")
    print(json.dumps(summarize(rows), indent=1))
    print("=== CENSUS ROWS JSON BEGIN ===")
    for r in rows:
        slim = dict(r)
        ev = slim.pop("census_evidence", {}) or {}
        slim["evidence"] = {"home": ev.get("homepage"),
                            "candidates": (ev.get("candidates") or [])[:3],
                            "hubs_read": ev.get("hubs_read"),
                            "catalog_like_links": ev.get("catalog_like_links"),
                            "catalog_pages": ev.get("catalog_pages"),
                            "pages": ev.get("pages_loaded"),
                            "seconds": ev.get("seconds")}
        print(json.dumps(slim, ensure_ascii=False))
    print("=== CENSUS ROWS JSON END ===")

    if args.apply:
        print("apply:", json.dumps(apply_rows(rows, run_id)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
