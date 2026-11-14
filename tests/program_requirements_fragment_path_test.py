"""A fragment a catalog includes into its pages is never a page (S653).

Skyline's capture (branch claude/skyline-ncl-capture-s653 at e7a06e9c) read
programs/_program-headers/english.xml, a header fragment, as a second page naming English A.A. (05825) beside
english-aa.php, and the no-closed-list lookup filed it not_matched on the tie. program_candidates() now turns
away a folder whose name starts with an underscore and names headers, includes or partials (NOT_PROGRAM_PATH).

The measure, over every URL the committed captures name (capture.json, capture_preview.json, sources.json and
summary.json under kb/program_requirements_college/): which the rule removes, at how many colleges, and that
none is a page any program claimed. The other underscore folders those captures name hold the catalog PDFs and
feeds programs are read from, and stay. Pure stdlib."""
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
for gone in ("/programs/_program-headers/english.xml", "/x/_includes/nav.html", "/x/_partials/program/", "/_header/a.php"):
    check(bool(C.NOT_PROGRAM_PATH.search(gone)), "a fragment folder is turned away: %s" % gone)

# ── the measure over the committed captures ─────────────────────────────────
URL = re.compile(r"https?://[^\s\"'<>\\]+")
D = os.path.join(ROOT, "kb", "program_requirements_college")
removed, claimed, named = collections.defaultdict(set), set(), collections.Counter()
for path in sorted(glob.glob(os.path.join(D, "*", "*.json"))):
    slug = path.split(os.sep)[-2]
    with open(path) as fh:
        txt = fh.read()
    if path.endswith("sources.json"):
        for s in json.loads(txt):
            u = ((s.get("source") or {}).get("url") if isinstance(s, dict) else None)
            if u:
                claimed.add(u)
    for u in {x.rstrip(",.;:)") for x in URL.findall(txt)}:
        named[slug] += 1
        path_ = urllib.parse.urlparse(u).path
        if C.NOT_PROGRAM_PATH.search(path_) and re.search(r"/_[^/]*(?:header|include|partial|fragment|snippet)s?/",
                                                           path_, re.I):
            removed[slug].add(u)
n = sum(len(v) for v in removed.values())
print("measure: the fragment rule removes %d of %d URLs the committed captures name, at %d of %d colleges: %s"
      % (n, sum(named.values()), len(removed), len(named), {k: sorted(v) for k, v in removed.items()}))
check(not any(u in claimed for v in removed.values() for u in v),
      "no URL the rule removes is a page any program claimed")
check(set(removed) <= {"skyline"} and all("/_program-headers/" in u for v in removed.values() for u in v),
      "the committed captures' fragments are Skyline's program headers alone (%s)" % sorted(removed))

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
