"""A fragment a catalog includes into its pages is never a page (S653).

Skyline's capture (branch claude/skyline-ncl-capture-s653 at e7a06e9c) read
programs/_program-headers/english.xml, a header fragment, as a second page naming English A.A. (05825) beside
english-aa.php, and the no-closed-list lookup filed it not_matched on the tie. program_candidates() now turns
away a folder whose name starts with an underscore and names headers, includes or partials (FRAGMENT_PATH), and
so do link_page_ok() (the link search and child pages) and ncl_page() (the no-closed-list lookup), whatever code
the page carries (S654).

The measure, over every URL the committed captures name (capture.json, capture_preview.json, sources.json and
summary.json under kb/program_requirements_college/), prints which URLs the rule removes and at how many colleges.
The one check over the captures is that none is a page a filed record claims (sources.json's source url,
records/*.json's source_url), so a new capture that files a rightly refused fragment at another college never
fails it. The other underscore folders those captures name hold the catalog PDFs and feeds programs are read from,
and stay. Pure stdlib."""
import collections
import glob
import json
import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402

FAILS = []


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


SKY = "https://catalog.skylinecollege.edu/current/"
check(C.program_candidates([SKY + "programs/_program-headers/english.xml", SKY + "programs/english-aa.php",
                            SKY + "programs/biology-for-transfer-as-t.xml"], SKY)
      == [SKY + "programs/english-aa.php", SKY + "programs/biology-for-transfer-as-t.xml"],
      "Skyline's header fragment is no candidate; its program pages, .xml ones too, are")
for kept in ("https://catalog.skylinecollege.edu/current/_data/programs-SKYLINE.xml",
             "https://www.cerrocoso.edu/_resources/assets/documents/catalog.html",
             "https://collegeofthedesert.edu/_web-items/programs/accounting/",
             "https://bcc.curriqunet.com/Catalog/_getPage?catalogId=10327&id=39975"):
    check(not C.NOT_PROGRAM_PATH.search(urllib.parse.urlparse(kept).path),
          "an underscore folder that is no fragment stays: %s" % kept)
for gone in ("/programs/_program-headers/english.xml", "/x/_includes/nav.html", "/x/_partials/program/", "/_header/a.php",
             # the keyword before the end of the folder's name (COBIx 6888023433, S654)
             "/_header-files/a.php", "/_partials-v2/x/", "/_includes_old/n.html"):
    check(bool(C.FRAGMENT_PATH.search(gone)) and bool(C.NOT_PROGRAM_PATH.search(gone)),
          "a fragment folder is turned away: %s" % gone)

# Skyline's two header fragments, as its capture named them (capture_preview.json on claude/skyline-ncl-capture-s653
# at e7a06e9c): English A.A. 05825 tied english-aa.php with the first, and the second read as a page for Anesthesia
# Technology. Every path that reads a page as a program's refuses both.
SKY_FRAGMENTS = (SKY + "programs/_program-headers/english.xml",
                 SKY + "programs/_program-headers/anesthesia-technology.xml")
for frag in SKY_FRAGMENTS:
    check(bool(C.FRAGMENT_PATH.search(urllib.parse.urlparse(frag).path)), "Skyline's fragment is one: %s" % frag)
    check(not C.link_page_ok(frag, None) and not C.link_page_ok(frag, "/current/"),
          "the link search and child pages never take Skyline's fragment: %s" % frag)
check(C.link_page_ok(SKY + "programs/english-aa.php", "/current/"), "the link search still takes english-aa.php")
FRAG_PAGE = {"url": SKY_FRAGMENTS[0], "h1": "English", "title": "English | Skyline College Catalog"}
check(C.ncl_page(FRAG_PAGE)["program_page"] is False,
      "the no-closed-list lookup reads Skyline's fragment as no program page")
check(C.ncl_page(dict(FRAG_PAGE, code="ENGL-AA"))["program_page"] is False,
      "the no-closed-list lookup reads Skyline's fragment as no program page though it carries a program code")
check(C.ncl_page({"url": SKY + "programs/english-aa.php", "h1": "English", "title": "English"})["program_page"] is True,
      "the lookup still reads english-aa.php as a program page")

# ── the measure over the committed captures: a report, and one check that holds for any new capture ──
URL = re.compile(r"https?://[^\s\"'<>\\]+")
D = os.path.join(ROOT, "kb", "program_requirements_college")
removed, claimed, distinct, colleges, mentions = collections.defaultdict(set), set(), set(), set(), 0
for path in sorted(glob.glob(os.path.join(D, "*", "*.json"))):
    slug = path.split(os.sep)[-2]
    colleges.add(slug)
    with open(path) as fh:
        txt = fh.read()
    if path.endswith("sources.json"):
        for s in json.loads(txt):
            u = ((s.get("source") or {}).get("url") if isinstance(s, dict) else None)
            if u:
                claimed.add(u)
    urls = {x.rstrip(",.;:)") for x in URL.findall(txt)}
    mentions += len(urls)
    distinct |= urls
    for u in urls:
        if C.FRAGMENT_PATH.search(urllib.parse.urlparse(u).path):
            removed[slug].add(u)
for path in sorted(glob.glob(os.path.join(D, "*", "records", "*.json"))):
    with open(path) as fh:
        rec = json.load(fh)
    if isinstance(rec, dict) and rec.get("source_url"):
        claimed.add(rec["source_url"])
gone_urls = {u for v in removed.values() for u in v}
print("measure: the fragment rule removes %d of %d distinct URLs (%d URL mentions across files) the committed captures "
      "name, at %d of %d colleges; %d claimed pages checked: %s"
      % (len(gone_urls), len(distinct), mentions, len(removed), len(colleges), len(claimed),
         {k: sorted(v) for k, v in removed.items()}))
check(not gone_urls & claimed, "no URL the rule removes is a page a filed record claims (sources.json, records/*.json)")

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
