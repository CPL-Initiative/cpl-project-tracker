#!/usr/bin/env python3
"""The program-source census reads a college's site the way a person would.

WHY. The census (kb/_program_source_census.py) fills one registry row per
college: the current catalog's address and year, the platform serving it, any
program-map source, and whether the site answered. Every later phase of the
program requirements harvest picks its extraction method from that row, so a
wrong row sends the harvest to the wrong reader. The ways it goes wrong are
known before any page is read:

  * a LIBRARY catalog link ("Search the catalog") taken for the course catalog;
  * last year's catalog, or an archive, outranking the current one;
  * a footer link to a vendor's curriculum system read as the catalog's
    platform, when the page's own assets name a different vendor;
  * a bot-challenge page ("Just a moment...") with HTTP 200 counted as a read;
  * a page robots.txt disallows loaded anyway (Sam's call 5 on sheet 23 is
    conditional on a polite read).

Each is pinned below against the module's OWN functions, with no browser and
no network. Run from repo root: python3 tests/program_source_census_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_source_census as C  # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


# ── The browser is a runner-only dependency ──────────────────────────────────
check("playwright" not in sys.modules,
      "importing the census pulled in playwright; the pure half must load without it")

# ── Who is reading: the request names the CPL Initiative ─────────────────────
check("CPL Initiative" in C.UA_SUFFIX and C.UA_TOKEN in C.UA_SUFFIX,
      "the user agent must name the CPL Initiative and carry the census token")
check("@" not in C.UA_SUFFIX, "no email address belongs in the user agent")

# ── Seeds: the CEO list reduced to site roots ────────────────────────────────
cols = C.load_colleges()
check(len(cols) == 118, "the CEO list seeds 118 colleges, got %d" % len(cols))
check(all(c["homepage_url"].startswith("https://") for c in cols),
      "every seed homepage is https")
hosts = {c["college"]: c["homepage_url"] for c in cols}
check(hosts.get("College of Marin") == "https://www.marin.edu/",
      "Marin's seed is its own root, not the president's profile host")
check(not any("president." in u or "omniweb" in u or "profiles." in u
              for u in hosts.values()),
      "no seed may sit on a president's or vendor's host")
check(hosts.get("Cerritos College") == "https://www.cerritos.edu/",
      "a plain CEO page reduces to its site root")

# ── Catalog links ────────────────────────────────────────────────────────────
CUR = 2026
links = [
    {"text": "Library Catalog", "href": "https://library.cerritos.edu/catalog"},
    {"text": "Search the catalog", "href": "https://cerritos.edu/library/search"},
    {"text": "Class Schedule", "href": "https://www.cerritos.edu/schedule/"},
    {"text": "2024-2025 Catalog (archive)",
     "href": "https://www.cerritos.edu/catalog/archive/2024-2025.pdf"},
    {"text": "College Catalog", "href": "https://catalog.cerritos.edu/"},
    {"text": "2026-2027 Catalog Addendum",
     "href": "https://www.cerritos.edu/catalog/addendum-2026-27.pdf"},
    {"text": "Apply", "href": "https://www.cerritos.edu/apply"},
    {"text": "Catalog", "href": "mailto:catalog@cerritos.edu"},
]
cands = C.pick_catalog_candidates(links, CUR)
check(cands and cands[0]["href"] == "https://catalog.cerritos.edu/",
      "the college catalog on catalog.<host> ranks first, got %r" % (cands[:1],))
check(not any("library" in c["href"] for c in cands),
      "a library catalog link is never a candidate")
check(not any(c["href"].startswith("mailto:") for c in cands),
      "a mailto link is never a candidate")
check(not any("archive/2024" in c["href"] for c in cands),
      "a two-year-old archived catalog is never a candidate")
s_cur = C.score_catalog_link("2026-2027 Catalog", "https://x.edu/catalog/2026-27.pdf", CUR)
s_old = C.score_catalog_link("2023-2024 Catalog", "https://x.edu/catalog/2023-24.pdf", CUR)
check(s_cur > s_old, "the current year's catalog outscores an older one")
check(C.score_catalog_link("Catalog", "/catalog", CUR) < 0,
      "a relative href is not resolved here and never scores")

# ── Academic years ───────────────────────────────────────────────────────────
check(C.parse_catalog_year("2026-2027 College Catalog") == "2026-2027", "four-digit pair")
check(C.parse_catalog_year("Catalog 2025–26") == "2025-2026", "en dash and two-digit end")
check(C.parse_catalog_year("catalog_2026_27.pdf") == "2026-2027", "underscore in a filename")
check(C.parse_catalog_year("Updated 2026-12-01") is None,
      "a date is not an academic year (12 does not follow 2026)")
check(C.parse_catalog_year("2026-2028 two-year plan") is None,
      "a two-year span is not an academic year")
check(C.parse_catalog_year("", "Archive: 2024-2025, 2025-2026") == "2025-2026",
      "the latest pair in the first text that names one")
check(C.parse_catalog_year("2031-2032", max_start=2027) is None,
      "a year past the horizon is not the current catalog")

# ── Platform fingerprints: the page's own assets outrank its text ───────────
p, tier = C.fingerprint_platform(
    "https://catalog.cerritos.edu/",
    ["https://catalog.cerritos.edu/courseleaf/courseleaf.css"],
    '<footer><a href="https://cerritos.curriqunet.com/">Curriculum</a></footer>')
check((p, tier) == ("courseleaf", "assets"),
      "assets naming CourseLeaf outrank a footer link to curriQunet, got %r" % ((p, tier),))
p, tier = C.fingerprint_platform(
    "https://cerritos.edu/catalog", [], "<html>Powered by Clean Catalog</html>")
check((p, tier) == ("cleancatalog", "html"), "a text-only hit is reported as tier html")
check(C.fingerprint_platform("https://x.smartcatalogiq.com/en/2026-2027/catalog", [], "")
      == ("smartcatalog", "url"), "a vendor host is a URL-tier hit")
check(C.fingerprint_platform("https://catalog.x.edu/content.php?catoid=12", [], "")[0]
      == "acalog", "Acalog's catoid query string")
check(C.fingerprint_platform("https://x.edu/academics/catalog", [], "<p>Our catalog</p>")
      == ("custom_html", "none"), "no vendor sign reads as custom HTML")

# ── Access ───────────────────────────────────────────────────────────────────
check(C.classify_access(200, "Just a moment...") == "blocked",
      "a challenge page served with 200 is blocked, not ok")
check(C.classify_access(403, "") == "blocked", "403 is blocked")
check(C.classify_access(404, "") == "not_found", "404 is not_found")
check(C.classify_access(None, "", "net::ERR_NAME_NOT_RESOLVED") == "unreachable",
      "a navigation error is unreachable")
check(C.classify_access(200, "2026-2027 Catalog") == "ok", "a plain 200 is ok")

# ── robots.txt is honored for our token and for everyone ─────────────────────
robots_all = "User-agent: *\nDisallow: /catalog/\n"
check(not C.robots_allows(robots_all, "https://x.edu/catalog/programs/"),
      "a path robots.txt disallows for * is never loaded")
check(C.robots_allows(robots_all, "https://x.edu/"), "the rest of the site stays open")
robots_us = "User-agent: %s\nDisallow: /\n\nUser-agent: *\nAllow: /\n" % C.UA_TOKEN
check(not C.robots_allows(robots_us, "https://x.edu/"),
      "a rule naming our token is honored")
check(C.robots_allows(None, "https://x.edu/catalog/"), "no robots.txt means no rule")

# ── Sequence and curriculum-system signals ───────────────────────────────────
check(C.sequence_signal([{"text": "Program Maps",
                          "href": "https://miramar.programmapper.com/"}])
      == ("ppm", "https://miramar.programmapper.com/"), "a Program Mapper host is PPM")
check(C.sequence_signal([{"text": "Degree Maps", "href": "https://x.edu/maps"}])
      == ("program_map_page", "https://x.edu/maps"), "a page named as maps")
check(C.sequence_signal([{"text": "Maps & Directions", "href": "https://x.edu/campus-map"}])
      == ("none_found", None), "a campus map is not a program map")
check(C.cms_signal([{"text": "Curriculum", "href": "https://x.curriqunet.com/"}])
      == "https://x.curriqunet.com/", "a curriQunet host is a CMS view")

# ── Method and format ────────────────────────────────────────────────────────
check(C.catalog_format("pdf", "https://x.edu/catalog.pdf", "", 0) == "single_pdf", "a PDF")
check(C.catalog_format("custom_html", "https://x.edu/catalog", "", 12) == "pdf_by_section",
      "a page linking many PDFs is a catalog by section")
check(C.best_method("courseleaf", "html_per_program") == "platform_reader", "vendor reader")
check(C.best_method("pdf", "single_pdf") == "pdf_extraction", "PDF extraction")
check(C.best_method("custom_html", "unknown") == "unknown",
      "custom HTML claims no method until a reader exists")

# ── Rows ─────────────────────────────────────────────────────────────────────
row = C.build_row("X College", "https://x.edu/",
                  {"access": "blocked", "status": 403, "title": "Access denied"},
                  None, ("unknown", None), None, {})
check(row["access_status"] == "blocked" and row["catalog_url"] is None,
      "a blocked homepage files blocked and claims no catalog")
row = C.build_row("X College", "https://x.edu/", {"access": "ok", "status": 200},
                  None, ("none_found", None), None, {})
check(row["catalog_platform"] == "unknown" and row["access_status"] == "ok"
      and "No catalog link" in row["access_notes"],
      "an open site with no catalog link says so")
row = C.build_row("X College", "https://x.edu/", {"access": "ok", "status": 200},
                  {"url": "https://catalog.x.edu/", "final_url": "https://catalog.x.edu/",
                   "access": "ok", "year": "2026-2027", "platform": "courseleaf",
                   "format": "html_per_program", "tier": "assets", "found_by": "homepage"},
                  ("ppm", "https://x.programmapper.com/"), None, {})
check(row["best_method"] == "platform_reader" and row["catalog_year"] == "2026-2027"
      and row["sequence_source"] == "ppm" and row["access_notes"] is None,
      "a clean CourseLeaf read files a full row with no notes")
for r in (row,):
    for col in ("catalog_platform", "catalog_format", "sequence_source", "best_method",
                "access_status"):
        check(r[col] is None or isinstance(r[col], str), "%s is text" % col)

if failures:
    print("FAIL: program source census (%d)" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("OK: program source census (pure half) holds")
