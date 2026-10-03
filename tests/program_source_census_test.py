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
    conditional on a polite read);
  * and, from the first full read (run 37137334059): a district page's sibling
    catalog taken for this college's, a homepage failure that skipped the
    catalog.<domain> probe, a hop onto an older year or a change log, and link
    text lost inside a hidden menu;
  * and, from the second (run 37139324090): a sibling's catalog taken when the
    district page has none for this college, an eLumen slug read as a year, a
    "Class Schedule & Catalog" link scored as a schedule, and an addendum or a
    yearly PDF chosen over the catalog host on the same page.

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

# ── The vendor link one hop past a college's own catalog page ───────────────
# The first dry run on main (2026-10-03, run 37136549708) stopped at the
# college's own page for Berkeley City, Butte and Bakersfield while the catalog
# sat one vendor link away, and Cabrillo's only vendor link was a login page.
berkeley = [
    {"text": "Fall Schedule", "href": "https://www.berkeleycitycollege.edu/schedule"},
    {"text": "Course Catalog", "href": "https://bcc.curriqunet.com/catalog/view/"},
    {"text": "Library", "href": "https://library.berkeleycitycollege.edu/catalog"},
]
hop = C.vendor_catalog_link(berkeley, CUR)
check(hop and hop["href"] == "https://bcc.curriqunet.com/catalog/view/",
      "the curriQunet catalog link is the hop, got %r" % (hop,))
check(C.vendor_catalog_link(
    [{"text": "Curriculum (Coursedog)",
      "href": "https://app.coursedog.com/#/login/cabrillo_colleague_ethos"}], CUR) is None,
      "a vendor login page is never the catalog")
check(C.vendor_catalog_link(
    [{"text": "Catalog editor", "href": "https://x.elumenapp.com/catalog/login"}], CUR) is None,
      "a login path on a vendor catalog host is never the catalog")
check(C.vendor_catalog_link(
    [{"text": "Program Review", "href": "https://x.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1"}],
    CUR) is None, "a vendor link whose path names no catalog is not a hop")
bakersfield = [
    {"text": "2025-2026 Catalog", "href": "https://bakersfield.elumenapp.com/catalog/2025-2026-Catalog/about-bc"},
    {"text": "2026-2027 Catalog", "href": "https://bakersfield.elumenapp.com/catalog/2026-2027-Catalog/about-bc"},
]
hop = C.vendor_catalog_link(bakersfield, CUR)
check(hop and "2026-2027" in hop["href"], "the current year's vendor catalog wins, got %r" % (hop,))
check(C.vendor_catalog_link([{"text": "Catalog", "href": "https://catalog.x.edu/"}], CUR)["href"]
      == "https://catalog.x.edu/", "a catalog.* host is a hop without a vendor name")
check(C.vendor_catalog_link([{"text": "Catalog", "href": "/catalog"}], CUR) is None,
      "a relative href is never a hop")

# ── The first full read's gaps (run 37137334059, 2026-10-03) ────────────────
# A district page lists every college's catalog. Miramar and San Diego
# Continuing Education were both handed City College's 2026-27 catalog, and
# City's own alias city25-26 read no year at all.
check(C.short_year_in_vendor_path(
    "https://sdccd.curriqunet.com/catalog/alias/city26-27/iq/15489") == "2026-2027",
      "a two-digit year pair in a vendor alias is an academic year")
check(C.short_year_in_vendor_path("https://www.x.edu/news/10-11-open-house") is None,
      "off a vendor host a two-digit pair is not read")
check(C.short_year_in_vendor_path(
    "https://x.curriqunet.com/files/2026-04/catalog") is None,
      "a year-month folder is not an academic year")
check(C.year_of_link("Catalog", "https://sdccd.curriqunet.com/catalog/alias/city25-26") == 2025,
      "a link's short vendor year ranks it")
check(C.college_tokens("San Diego Miramar College") == {"diego", "miramar"},
      "generic words name no college, got %r" % (C.college_tokens("San Diego Miramar College"),))
check(C.college_tokens("Cañada College") == {"canada"}, "accents fold to plain letters")
sdccd = [
    {"text": "San Diego City College", "href": "https://sdccd.curriqunet.com/catalog/alias/city26-27"},
    {"text": "San Diego Mesa College", "href": "https://sdccd.curriqunet.com/catalog/alias/mesa26-27"},
    {"text": "San Diego Miramar College", "href": "https://sdccd.curriqunet.com/catalog/alias/miramar26-27"},
    {"text": "College of Continuing Education",
     "href": "https://sdccd.curriqunet.com/catalog/alias/cce26-27"},
]
for name, want in (("San Diego Miramar College", "miramar26-27"),
                   ("San Diego City College", "city26-27"),
                   ("San Diego Mesa College", "mesa26-27"),
                   ("San Diego College of Continuing Education", "cce26-27")):
    hop = C.vendor_catalog_link(sdccd, CUR, name)
    check(hop and hop["href"].endswith(want),
          "%s takes its own catalog from the district page, got %r" % (name, hop))
hop = C.vendor_catalog_link(
    [{"text": "Miramar College", "href": "https://sdccd.curriqunet.com/catalog/alias/miramar25-26"},
     {"text": "City College", "href": "https://sdccd.curriqunet.com/catalog/alias/city26-27"}],
    CUR, "San Diego Miramar College")
check(hop and "miramar25-26" in hop["href"],
      "the college's own catalog outranks a sibling's newer one, got %r" % (hop,))
check(C.vendor_catalog_link(
    [{"text": "Catalog Change Log",
      "href": "https://porterville.elumenapp.com/catalog/firstcatalog/changelog"}], CUR) is None,
      "a vendor change log is never the catalog")
check(C.score_catalog_link("Catalog Change Log", "https://x.edu/catalog/change-log", CUR) < 3,
      "a catalog change log is never a candidate")
check("textContent" in C.LINKS_JS,
      "link text falls back to textContent: innerText is empty inside a hidden menu")


class FakeReader:
    """Serves canned pages to census_one; a missing URL is unreachable."""

    def __init__(self, pages):
        self.pages, self.loads, self.seen = pages, 0, []

    def load(self, url):
        self.loads += 1
        self.seen.append(url)
        page = dict(self.pages.get(url) or {"status": None, "access": "unreachable",
                                            "error": "net::ERR_NAME_NOT_RESOLVED"})
        page.setdefault("final_url", url)
        page.setdefault("title", "")
        for k in ("links", "assets"):
            page.setdefault(k, [])
        page.setdefault("html", "")
        page.setdefault("h1", "")
        page["url"] = url
        return page


# A homepage that answers 404 still gets the catalog.<domain> probe.
fr = FakeReader({
    "https://arc.losrios.edu/": {"status": 404, "access": "not_found", "title": "404 Not Found"},
    "https://catalog.losrios.edu/": {"status": 200, "access": "ok",
                                     "title": "2026-2027 Catalog",
                                     "assets": ["https://catalog.losrios.edu/courseleaf/x.css"]},
})
row = C.census_one(fr, "American River College", "https://arc.losrios.edu/", CUR)
check(row["catalog_url"] == "https://catalog.losrios.edu/" and row["access_status"] == "ok"
      and row["catalog_platform"] == "courseleaf",
      "a failed homepage still probes catalog.<domain>, got %r" % (
          {k: row[k] for k in ("catalog_url", "access_status", "catalog_platform")},))
check("Homepage: not_found" in (row["access_notes"] or ""),
      "the row still says the homepage failed, got %r" % (row["access_notes"],))
# A probe that is itself blocked is no catalog address.
fr = FakeReader({
    "https://www.deanza.edu/": {"status": 403, "access": "blocked", "title": "Just a moment..."},
    "https://catalog.deanza.edu/": {"status": 403, "access": "blocked", "title": "Just a moment..."},
})
row = C.census_one(fr, "De Anza College", "https://www.deanza.edu/", CUR)
check(row["catalog_url"] is None and row["access_status"] == "blocked",
      "a blocked probe files no catalog address, got %r" % (row["catalog_url"],))
# A hop that lands on an older year than the page it left is refused.
fr = FakeReader({
    "https://www.portervillecollege.edu/": {
        "status": 200, "access": "ok", "title": "Porterville College",
        "links": [{"text": "2026-2027 CATALOG",
                   "href": "https://www.portervillecollege.edu/catalog.html"}]},
    "https://www.portervillecollege.edu/catalog.html": {
        "status": 200, "access": "ok", "title": "Catalog",
        "html": "<p>Our catalog is published in eLumen.</p>",
        "links": [{"text": "Catalog",
                   "href": "https://porterville.elumenapp.com/catalog/2021-2022/home"}]},
    "https://porterville.elumenapp.com/catalog/2021-2022/home": {
        "status": 200, "access": "ok", "title": "2021-2022 Catalog"},
})
row = C.census_one(fr, "Porterville College", "https://www.portervillecollege.edu/", CUR)
check(row["catalog_year"] == "2026-2027"
      and row["catalog_url"] == "https://www.portervillecollege.edu/catalog.html",
      "an older-year hop is refused, got %r" % (
          {k: row[k] for k in ("catalog_url", "catalog_year")},))
# Miramar end to end: the district page's vendor link that names Miramar.
fr = FakeReader({
    "https://sdmiramar.edu/": {
        "status": 200, "access": "ok", "title": "Miramar College",
        "links": [{"text": "Catalog",
                   "href": "https://www.sdccd.edu/students/college-catalogs/index.aspx"}]},
    "https://www.sdccd.edu/students/college-catalogs/index.aspx": {
        "status": 200, "access": "ok", "title": "College Catalogs",
        "html": "<p>Catalogs are published in CurriQunet.</p>", "links": sdccd},
    "https://sdccd.curriqunet.com/catalog/alias/miramar26-27": {
        "status": 200, "access": "ok", "title": "View - CurriQunet META"},
})
row = C.census_one(fr, "San Diego Miramar College", "https://sdmiramar.edu/", CUR)
check(row["catalog_url"] == "https://sdccd.curriqunet.com/catalog/alias/miramar26-27"
      and row["catalog_year"] == "2026-2027",
      "Miramar reads its own catalog and year, got %r" % (
          {k: row[k] for k in ("catalog_url", "catalog_year")},))

# A district index of PDF catalogs: this college's own, even a year older.
fr = FakeReader({
    "https://sdmiramar.edu/": {
        "status": 200, "access": "ok", "title": "Miramar College",
        "links": [{"text": "Catalog", "href": "https://www.sdccd.edu/catalogs/"}]},
    "https://www.sdccd.edu/catalogs/": {
        "status": 200, "access": "ok", "title": "Catalogs",
        "links": [{"text": "City College Catalog 2026-2027",
                   "href": "https://www.sdccd.edu/catalogs/city-2026-2027.pdf"},
                  {"text": "Miramar College Catalog 2025-2026",
                   "href": "https://www.sdccd.edu/catalogs/miramar-2025-2026.pdf"}]},
    "https://www.sdccd.edu/catalogs/miramar-2025-2026.pdf": {
        "status": 200, "access": "ok", "content_type": "application/pdf"},
    "https://www.sdccd.edu/catalogs/city-2026-2027.pdf": {
        "status": 200, "access": "ok", "content_type": "application/pdf"},
})
row = C.census_one(fr, "San Diego Miramar College", "https://sdmiramar.edu/", CUR)
check(row["catalog_url"] == "https://www.sdccd.edu/catalogs/miramar-2025-2026.pdf",
      "a district index of catalogs yields this college's own, got %r" % (row["catalog_url"],))

# ── The second full read (run 37139324090, 2026-10-03) ───────────────────────
# An eLumen slug is no year: Mission's current catalog lives under 24-25.
check(C.short_year_in_vendor_path("https://mission.elumenapp.com/catalog/24-25/cataloghome")
      is None, "an eLumen slug is not read as a year; only a curriQunet alias is")
# A combined schedule-and-catalog page is a catalog link (Diablo Valley).
check(C.score_catalog_link("Class Schedule & Catalog",
                           "https://www.dvc.edu/academics/class-schedule-catalog", CUR) >= 3,
      "a link naming the schedule AND the catalog is a candidate")
check(C.score_catalog_link("Class Schedule", "https://www.dvc.edu/schedule/", CUR) < 3,
      "a schedule link alone is never a candidate")
# A district page with no link for this college: every sibling's link names
# "diego" too, and none of them is San Diego Continuing Education's catalog.
SD = ["San Diego City College", "San Diego Mesa College", "San Diego Miramar College",
      "San Diego College of Continuing Education", "Long Beach City College"]
ce_foreign = C.foreign_tokens("San Diego College of Continuing Education", SD)
check({"city", "mesa", "miramar"} <= ce_foreign and "diego" not in ce_foreign,
      "foreign words are the siblings' own, got %r" % (sorted(ce_foreign),))
check(C.vendor_catalog_link(sdccd[:3], CUR, "San Diego College of Continuing Education",
                            ce_foreign) is None,
      "no sibling's catalog is taken when the page has none for this college")
hop = C.vendor_catalog_link(sdccd[:3], CUR, "San Diego Miramar College",
                            C.foreign_tokens("San Diego Miramar College", SD))
check(hop and "miramar26-27" in hop["href"], "Miramar still finds its own with siblings known")
fr = FakeReader({
    "https://sdcce.edu/": {
        "status": 200, "access": "ok", "title": "Continuing Education",
        "links": [{"text": "College Catalogs",
                   "href": "https://www.sdccd.edu/students/college-catalogs/index.aspx"}]},
    "https://www.sdccd.edu/students/college-catalogs/index.aspx": {
        "status": 200, "access": "ok", "title": "College Catalogs",
        "html": "<p>Catalogs are published in CurriQunet.</p>", "links": sdccd[:3]},
    "https://sdccd.curriqunet.com/catalog/alias/city26-27": {
        "status": 200, "access": "ok", "title": "View - CurriQunet META"},
})
row = C.census_one(fr, "San Diego College of Continuing Education", "https://sdcce.edu/",
                   CUR, SD)
check(row["catalog_url"] == "https://www.sdccd.edu/students/college-catalogs/index.aspx",
      "with no link of its own, the row stays on the district page, got %r" % (
          row["catalog_url"],))
# The same on a district index of PDFs: no sibling's catalog for this college.
fr = FakeReader({
    "https://sdcce.edu/": {
        "status": 200, "access": "ok", "title": "Continuing Education",
        "links": [{"text": "Catalog", "href": "https://www.sdccd.edu/catalogs/"}]},
    "https://www.sdccd.edu/catalogs/": {
        "status": 200, "access": "ok", "title": "Catalogs",
        "links": [{"text": "City College Catalog 2026-2027",
                   "href": "https://www.sdccd.edu/catalogs/city-2026-2027.pdf"},
                  {"text": "Mesa College Catalog 2026-2027",
                   "href": "https://www.sdccd.edu/catalogs/mesa-2026-2027.pdf"}]},
    "https://www.sdccd.edu/catalogs/city-2026-2027.pdf": {
        "status": 200, "access": "ok", "content_type": "application/pdf"},
})
row = C.census_one(fr, "San Diego College of Continuing Education", "https://sdcce.edu/",
                   CUR, SD)
check(row["catalog_url"] == "https://www.sdccd.edu/catalogs/",
      "a district index hands no sibling's PDF to this college, got %r" % (row["catalog_url"],))
# Every college's name reaches the reader, not just the slice's: a sibling
# read in another slice is still a sibling.
seen = {}
real_run, real_registry = C.run, C.load_registry
C.run = lambda colleges, delay, all_names=(): seen.update(n=len(colleges),
                                                         names=list(all_names)) or []
C.load_registry = lambda: None   # the CEO list; never the network
try:
    import contextlib
    import io
    with contextlib.redirect_stdout(io.StringIO()):
        C.main(["--shard", "1/4"])
finally:
    C.run, C.load_registry = real_run, real_registry
check(seen.get("n") in (29, 30) and len(seen.get("names") or []) == 118,
      "a slice reads its 30 colleges knowing all 118 names, got %r" % (
          (seen.get("n"), len(seen.get("names") or [])),))

# A yearless college page that links its catalog host beside yearly PDFs
# (Merced): the catalog host wins, and an addendum never wins an index.
merced_links = [
    {"text": "2026-2027 Catalog Addendum",
     "href": "https://www.mccd.edu/uploads/Catalog-PDF-2026-27-Addendum.pdf"},
    {"text": "2025-2026 Catalog", "href": "https://www.mccd.edu/uploads/Catalog-2025-26.pdf"},
    {"text": "2025-2026 Catalog (Spring update)",
     "href": "https://www.mccd.edu/uploads/Catalog-2025-26-spring.pdf"},
]
merced = {
    "https://www.mccd.edu/": {
        "status": 200, "access": "ok", "title": "Merced College",
        "links": [{"text": "Course Catalog", "href": "https://www.mccd.edu/course-catalog/"}]},
    "https://www.mccd.edu/course-catalog/": {
        "status": 200, "access": "ok", "title": "Course Catalog",
        "links": merced_links + [{"text": "Online Catalog", "href": "https://catalog.mccd.edu/"}]},
    "https://catalog.mccd.edu/": {
        "status": 200, "access": "ok", "title": "Merced College Catalog",
        "assets": ["https://static.coursedog.com/catalog.js"]},
    "https://www.mccd.edu/uploads/Catalog-PDF-2026-27-Addendum.pdf": {
        "status": 200, "access": "ok", "content_type": "application/pdf"},
    "https://www.mccd.edu/uploads/Catalog-2025-26.pdf": {
        "status": 200, "access": "ok", "content_type": "application/pdf"},
    "https://www.mccd.edu/uploads/Catalog-2025-26-spring.pdf": {
        "status": 200, "access": "ok", "content_type": "application/pdf"},
}
row = C.census_one(FakeReader(merced), "Merced College", "https://www.mccd.edu/", CUR)
check(row["catalog_url"] == "https://catalog.mccd.edu/" and row["catalog_platform"] == "coursedog",
      "a yearless page's catalog host wins over its yearly PDFs, got %r" % (
          {k: row[k] for k in ("catalog_url", "catalog_platform")},))
merced["https://www.mccd.edu/course-catalog/"]["links"] = merced_links
row = C.census_one(FakeReader(merced), "Merced College", "https://www.mccd.edu/", CUR)
check(row["catalog_url"] in ("https://www.mccd.edu/uploads/Catalog-2025-26.pdf",
                             "https://www.mccd.edu/uploads/Catalog-2025-26-spring.pdf"),
      "an index never hands over an addendum, even a newer one, got %r" % (row["catalog_url"],))

# ── The pass splits into slices ─────────────────────────────────────────────
check(C.shard_of("2/4") == (2, 4), "k/n parses")
for bad in ("0/4", "5/4", "4", "a/b", ""):
    try:
        C.shard_of(bad)
        check(False, "shard %r must be refused" % bad)
    except SystemExit:
        pass
names = ["c%03d" % i for i in range(118)]
slices = [[c for i, c in enumerate(names) if i % 4 == k - 1] for k in (1, 2, 3, 4)]
check(sorted(sum(slices, [])) == names and all(len(s) in (29, 30) for s in slices),
      "four slices cover every college exactly once")

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
