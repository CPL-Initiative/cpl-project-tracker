#!/usr/bin/env python3
"""S742, lane 1 (keys) at San Diego City: 22352 and 38732 filed as the college's named gaps, with no record written
(kb/program_requirements_college/san_diego_city/named_gaps_s742.json).

WHY. Both programs sat on lane 1's holds by key. Each filed record (run 38252422845) places none of the state's
listed courses because the catalog holds no entry for the award: the capture of 2026-11-27 (run 45960365618, page
checks on) read the catalog's 228 entries and filed both under not_found, and the state's file lists both as Active -
Teachout Only. A paid read has no page to read, so each is named with what the catalog prints and left to the
college (S739's form at 22333). Pinned here:

  * the file names the two programs, each once, with a defined reason, a note, its title and award, the five
    confidence scores (0 to 100) and the filed record, which places none;
  * the capture the file rests on is the committed one: it read 228 entries, files both programs under not_found
    and under the state's status Active - Teachout Only, and names no page for 22352; 38732's one candidate is the
    Certificate of Performance entry, which the page checks refused;
  * each record's own notes say the text holds another award's section;
  * neither program is pinned, and no earlier named-gaps file of the college names either.

Run from repo root: python3 tests/program_named_gaps_s742_sdcity_test.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

DIR = os.path.join(NG.COLLEGE_DIR, "san_diego_city")
WANT = {"22352": "credit_not_in_catalog", "38732": "catalog_award_differs"}
n, failures = 0, []


def check(cond, msg):
    global n
    n += 1
    if not cond:
        failures.append(msg)


def load(*parts):
    with open(os.path.join(DIR, *parts), encoding="utf-8") as fh:
        return json.load(fh)


ng = load("named_gaps_s742.json")
got = {g["control_number"]: g for g in ng["programs"]}
check(len(ng["programs"]) == len(got) == 2 and {cn: g["reason"] for cn, g in got.items()} == WANT
      and all(g["reason"] in ng["reasons"] and g.get("note") and g.get("title") and g.get("award")
              for g in got.values()),
      "the named gaps are 22352 and 38732, each once with a defined reason and a note")
check(ng["college"] == "San Diego City College" and ng["capture"] == "45960365618"
      and re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", ng.get("written") or "") is not None,
      "the file names when it was written and the capture it rests on")

cap = load("capture.json")
check(str(cap["run"]) != ng["capture"] or cap["curriqunet"]["entries_read"] == 228,
      "the committed capture, while it is the file's, read the catalog's 228 entries")
nf = {p["control_number"]: p for p in cap["not_found"]}
for cn, g in sorted(got.items()):
    f = load("records", cn + ".json")
    cov = f["score"]["coverage"]
    # The record: checked only while it is the filed read the file names (a later read may move it on).
    filed = str(f.get("extracted_run")) == "38252422845"
    check(not filed or (S.places_none(f["score"]) and cov["placed"] == 0 == g["placed"] and cov["listed"] == g["listed"]
                        and not f["record"].get("blocks")),
          "%s: its filed record places none of its %s listed courses and holds no block" % (cn, g["listed"]))
    check(not filed or (g["title"] == f["title"] and g["award"] == f["award"]
                        and g["record"].endswith("san_diego_city/records/%s.json" % cn)),
          "%s: the entry names the record's own title and award" % cn)
    conf = g["confidence"]
    check(set(conf) == {"unit_arithmetic", "course_list_match", "ge_pattern", "catalog_year", "source"}
          and all(v is None or 0 <= v <= 100 for v in conf.values())
          and conf["unit_arithmetic"] == 0 and conf["course_list_match"] == 0
          and (not filed or conf == NG.confidence(f, None, None)),
          "%s: the five confidence scores, 0 to 100, as the scorer's own function gives them" % cn)
    check(not filed or any(re.search(r"Certificate of Performance", x) for x in f["record"]["notes"]),
          "%s: its own notes say the text holds a Certificate of Performance's section" % cn)
    # The capture: checked only while the committed capture is the one the file names.
    if str(cap["run"]) == ng["capture"]:
        check(cn in nf and nf[cn]["status"] == "Active - Teachout Only" and nf[cn]["near_miss"].get("page_checks"),
              "%s: the capture files it under not_found, the page checks on, the state's status Teachout Only" % cn)
    check(cn not in (R.load_steps().get(ng["college"]) or {}).get("site_pages", {})
          and cn not in ((R.load_steps().get(ng["college"]) or {}).get("pdf_pages") or {}),
          "%s: it is not pinned" % cn)
if str(cap["run"]) == ng["capture"]:
    check(nf["22352"]["near_miss"].get("why") == "no page read names the program" and not nf["22352"]["near_miss"].get("url"),
          "22352: no entry the capture read names the program")
    m = nf["38732"]["near_miss"]
    check(m.get("url", "").endswith("/15945/15760") and m["label"]["award"] == 1 and m["net"] == 3 and m["listed"] == 5,
          "38732: its one candidate is the entry 15945/15760, which names 3 of its 5 listed courses")
earlier = set()
for path in glob.glob(os.path.join(DIR, "named_gaps_s*.json")):
    if not path.endswith("named_gaps_s742.json"):
        with open(path, encoding="utf-8") as fh:
            earlier |= {g["control_number"] for g in json.load(fh).get("programs") or []}
check(not earlier & set(WANT), "no earlier named-gaps file of the college names either program")

print("%d checks, %d failures" % (n, len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
