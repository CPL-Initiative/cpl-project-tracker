#!/usr/bin/env python3
"""Rule A's self-recall on records whose answer is known: it finds a placing record's own page, and refuses its sisters'.

WHY. Rule A (kb/_reader_page_checks.py heading_line) is a new matcher, and a matcher tested only on hand-built fixtures
accepted the very pages it exists to refuse: an A.S. read an "Associate in Science ... for Transfer" heading, a
certificate read "Accounting: Bookkeeping - Certificate of Achievement", and a Fire Technology A.S. read "Wildland Fire
Technology AS" (S683 second reader, finding 1). This test runs rule A over the committed site-catalog records that
place courses, where the page each was read from is known to be its own, using only what the files keep of that page:
its h1, its title and its address (the committed files keep no page text).

  * recall: rule A finds the record's own page in at least RECALL_FLOOR of them, and in at least COA_FLOOR of the
    certificates (measured 2026-11-18: 10,046 of 13,243, 75.9%; certificates 4,392 of 5,489, 80.0%; the first matcher
    found 10,507 and 4,330);
  * sister pages: on a record's own page (one rule A accepts for it), rule A accepts another program of the same college
    at most SISTER_CEILING times. A pair whose titles differ only by a version ("Physics", "Physics 2.0") or not at
    all is one program filed twice, never a sister (measured 2026-11-18: 22 of 2,047,454 pairs, most of them a
    generic h1 beside a combined page's title; the first matcher accepted 1,433).

The floors sit a little under the measure, so a change that drops recall or lets sisters back in fails here.

Run from repo root: python3 tests/reader_page_checks_recall_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
os.environ.pop("CPL_READER_PAGE_CHECKS", None)
import _reader_page_checks as RC  # noqa: E402
from _program_requirements_score import places_none  # noqa: E402

BASE = os.path.join(ROOT, "kb", "program_requirements_college")
SITE_METHODS = ("sitemap_page", "link_search")
MIN_RECORDS = 10000
RECALL_FLOOR, COA_FLOOR = 0.75, 0.79
SISTER_CEILING = 30

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def norm_title(t):
    return re.sub(r"[^a-z0-9]+", " ", re.sub(r"\b\d+\.\d+\b", " ", (t or "").lower())).strip()


def site_records(folder):
    """The college's site-catalog records that place courses: (record, the page's lines) each."""
    path = os.path.join(folder, "sources.json")
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as fh:
        srcs = json.load(fh)
    out = []
    for s in srcs:
        src = s.get("source") or {}
        if s.get("method") not in SITE_METHODS or not (src.get("h1") or src.get("title")):
            continue
        rp = os.path.join(folder, "records", str(s.get("control_number")) + ".json")
        if not os.path.exists(rp):
            continue
        with open(rp, encoding="utf-8") as fh:
            rec = json.load(fh)
        score = rec.get("score")
        if places_none(score) or not ((score or {}).get("coverage") or {}).get("placed"):
            continue
        lines = [src.get("h1") or "", (src.get("title") or "").split("|")[0], RC._slug_words(src.get("url"))]
        out.append((s, lines))
    return out


total = hit = coa_total = coa_hit = pairs = sisters = 0
samples = []
for college in sorted(os.listdir(BASE)):
    recs = site_records(os.path.join(BASE, college))
    own_ok = []
    for s, lines in recs:
        ok = RC.heading_line(lines, s["title"], s["award"]) >= 0
        total += 1
        hit += ok
        if RC.P.award_kind(s["award"]) == "coa":
            coa_total += 1
            coa_hit += ok
        own_ok.append(ok)
    words = [RC.title_words(s["title"]) for s, _ in recs]
    for i, (s, lines) in enumerate(recs):
        if not own_ok[i]:
            continue
        low = "\n".join(lines).lower()
        for j, (o, _) in enumerate(recs):
            if j == i or (o.get("source") or {}).get("url") == (s.get("source") or {}).get("url"):
                continue
            if norm_title(o["title"]) == norm_title(s["title"]):
                continue      # one program filed twice, or two awards of one title: page_winners() parts those
            pairs += 1
            if not words[j] or not all(w in low for w in words[j]):
                continue
            if RC.heading_line(lines, o["title"], o["award"]) >= 0:
                sisters += 1
                if len(samples) < 8:
                    samples.append("%s %r (%s) on %r" % (college, o["title"], (o["award"] or "")[:24], lines[0][:70]))

print("rule A self-recall: %d of %d (%.3f); certificates %d of %d; sister accepts %d of %d pairs"
      % (hit, total, hit / max(total, 1), coa_hit, coa_total, sisters, pairs))
check(total >= MIN_RECORDS, "the committed records hold %d site records that place courses, under %d" % (total, MIN_RECORDS))
check(hit >= RECALL_FLOOR * total, "rule A finds the own page of %d of %d placing records, under %.2f" % (hit, total, RECALL_FLOOR))
check(coa_hit >= COA_FLOOR * coa_total,
      "rule A finds the own page of %d of %d certificates, under %.2f" % (coa_hit, coa_total, COA_FLOOR))
check(sisters <= SISTER_CEILING, "rule A accepts %d sister programs on a record's own page, over %d: %s"
      % (sisters, SISTER_CEILING, "; ".join(samples)))

# ── S741: the reach of rule B's change (an entry typed without its own descriptions child page) ───────────────
# The change can move a decision only where three things hold: the rules read the program (its filed record places
# none, or a filed read refused it: mark()), its catalog's reader joins an entry with its child pages (curriQunet
# alone sets RC.OWN_PARTS; tests/reader_page_checks_test.py pins that), and rule A accepts the entry for the program.
# The committed files keep no page text, so the count here is by each marked program's filed page, through its h1,
# title and address, as above. Measured 2026-11-27 at b896d6f4: 50 marked programs at the 27 curriQunet catalogs,
# 25 with a filed page, and rule A accepts 2 of the 25, both at San Diego City: Cosmetology 22367 and CPA Preparatory
# Program 38732. The other 23 sit on a sister's entry, which rule A refuses whatever rule B says.
#
# On held text: college-page-read 45954122786 read San Diego City's four marked programs' entries as the capture
# reads them. Typed whole, all four are descriptions (each entry's Courses tab), so the rule as it stood refuses
# all four. With the change, at the reader's own bar (ACCEPT_SHARE of the listed courses on the entry's other pages):
#   * 22367 reads its own entry (right): Requirements prints COSM 50L to 80L and "Total Units: 24.0".
#   * 38732 reads the catalog's one entry of its title, "Certified Public Accountant Preparatory Program -
#     Certificate of Performance: City", 6 units, 3 of its 5 listed courses, where the state lists a Certificate of
#     Achievement of 16 units or more: another award's page (wrong), by rule A's reading of "Certificate".
#   * 22352 and 22333 stay refused (right): each sits on a sister's entry.
# Admitted 2, right 1 and wrong 1. So the change asks for every listed course (RC.OWN_REST_SHARE): admitted 1
# (22367), right 1, wrong 0, and the other three refused as before. The ceiling sits above the measure: a jump in
# the programs the change can reach fails here, so its pages are read before a capture files them.
REACH_CEILING = 10
marked = with_page = by_heading = catalogs = 0
reach = []
for college in sorted(os.listdir(BASE)):
    folder = os.path.join(BASE, college)
    try:
        with open(os.path.join(folder, "capture.json"), encoding="utf-8") as fh:
            platform = (json.load(fh) or {}).get("platform")
        with open(os.path.join(folder, "sources.json"), encoding="utf-8") as fh:
            filed = {s.get("control_number"): s for s in json.load(fh)}
    except (OSError, ValueError):
        continue
    if platform != "curriqunet":
        continue
    catalogs += 1
    for cn in sorted(RC.places_none_filed(folder) | RC.refused_standing(folder)):
        marked += 1
        s = filed.get(cn) or {}
        src = s.get("source") or {}
        if not src:
            continue
        with_page += 1
        lines = [src.get("h1") or "", (src.get("title") or "").split("|")[0], RC._slug_words(src.get("url"))]
        if RC.heading_line(lines, s.get("title"), s.get("award")) >= 0:
            by_heading += 1
            reach.append("%s %s %r" % (college, cn, (src.get("h1") or "")[:60]))
print("rule B's change, its reach: %d marked programs at %d curriQunet catalogs, %d with a filed page, rule A "
      "accepts %d: %s" % (marked, catalogs, with_page, by_heading, "; ".join(reach) or "none"))
check(catalogs >= 20, "the committed captures hold %d curriQunet catalogs, under 20" % catalogs)
check(by_heading <= REACH_CEILING, "rule B's change can reach %d marked programs on their own entries, over %d: %s"
      % (by_heading, REACH_CEILING, "; ".join(reach)))

for f in failures:
    print("FAIL:", f)
print("%d/%d checks passed: reader page checks, self-recall" % (checks[0] - len(failures), checks[0]))
sys.exit(1 if failures else 0)
