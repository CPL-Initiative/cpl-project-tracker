#!/usr/bin/env python3
"""The prior-year read (CAPTURE_PRIOR, S663): a plain program whose current catalog prints only its 2.0
successor's page is read from the year it was last printed in (Sam, d-both-versions-by-catalog-year-sam-2026-11-15).

Guards the failure modes: a prior read that names no programs reading the whole college from an old catalog; a
start page off the registry's host; a "prior" year that is the current one or later; a filing that replaces the
college's records with the four read (file_run's whole-folder replace, which would remove the other 264 at
Riverside City); a failed extraction overwriting a passing filed record; and the read's year lost on the way to
the record, which load_rows and the re-read write as the row's catalog_year.

Run from repo root: python3 tests/program_requirements_prior_read_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402

failures = []
checks = [0]


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


REG = {"catalog_platform": "curriqunet", "catalog_year": "2026-2027",
       "catalog_url": "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5842/6111"}
PROGS = [{"control_number": c, "closed_list": [{"course_code": "COM 1"}]} for c in ("30578", "32692", "32745", "33829", "42892")]
PROGS.append({"control_number": "50001", "closed_list": []})
START = "https://rccd.curriqunet.com/Catalog/archive/71/iq/4079/4130"

got, why = C.prior_read("", REG, PROGS)
check(got is None and why is None, "no CAPTURE_PRIOR is the current catalog, not a refusal")
got, why = C.prior_read("%s 2025-2026 30578,32692,32745,33829" % START, REG, PROGS)
check(why is None and got == {"start": START, "catalog_year": "2025-2026",
                              "only": ["30578", "32692", "32745", "33829"]}, "Riverside City's read: %r %r" % (got, why))
for spec, label in [
        ("%s 2025-2026" % START, "no control numbers"),
        ("%s 2025-2026 ,," % START, "an empty list"),
        ("https://www.rcc.edu/catalog.pdf 2025-2026 30578", "a start page off the registry's host"),
        ("%s 2026-2027 30578" % START, "the registry's own year"),
        ("%s 2027-2028 30578" % START, "a later year"),
        ("%s 2025-2027 30578" % START, "a year that is not one catalog year"),
        ("%s 2025-2026 99999" % START, "a program the harvest does not read here"),
        ("%s 2025-2026 30578,50001" % START, "a program with no closed list")]:
    got, why = C.prior_read(spec, REG, PROGS)
    check(got is None and why, "refuses %s: %r" % (label, why))
got, why = C.prior_read("%s 2025-2026 30578" % START, dict(REG, catalog_platform="courseleaf"), PROGS)
check(got is None and "curriqunet" in (why or ""), "opens on curriQunet catalogs only: %r" % why)


def write(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        json.dump(obj, fh)


def read(path):
    with open(path) as fh:
        return json.load(fh)


with tempfile.TemporaryDirectory() as tmp:
    dest, out = os.path.join(tmp, "college"), os.path.join(tmp, "out")
    # The college's filing: the 2026-2027 capture, two plain siblings read from their 2.0's page, and a third program.
    write(os.path.join(dest, "capture.json"), {"catalog_year": "2026-2027", "run": "1"})
    write(os.path.join(dest, "summary.json"), {"records": 3})
    for cn in ("30578", "32692", "50000"):
        write(os.path.join(dest, "records", cn + ".json"),
              {"control_number": cn, "record": {"blocks": []}, "extracted_run": "1", "catalog_year": "2026-2027",
               "source_url": "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5852/6117/5928"})
    write(os.path.join(dest, "sources.json"), [{"control_number": cn, "method": "page_claimed"} for cn in ("30578", "32692", "50000")])
    # The prior read: 30578 read from 2025-2026; 32692's extraction failed.
    report = {"catalog_year": "2025-2026", "run": "2",
              "prior": {"start": START, "catalog_year": "2025-2026", "only": ["30578", "32692", "50000"]}}
    write(os.path.join(out, "capture.json"), report)
    write(os.path.join(out, "records", "30578.json"),
          {"control_number": "30578", "record": {"blocks": [1]}, "extracted_run": "2",
           "source_url": "https://rccd.curriqunet.com/Catalog/archive/71/iq/4089/4136/Comm_Studies_ADT"})
    write(os.path.join(out, "records", "32692.json"), {"control_number": "32692", "error": "timeout", "catalog_year": "2025-2026"})
    # A record the extraction copied from the filing (its own run, its own year) is never the prior year's reading.
    write(os.path.join(out, "records", "50000.json"),
          {"control_number": "50000", "record": {"blocks": []}, "extracted_run": "1", "catalog_year": "2026-2027"})
    write(os.path.join(out, "sources", "30578.json"),
          {"control_number": "30578", "method": "sitemap_page", "closed_list": [1, 2], "text": "abc",
           "source": {"url": "https://rccd.curriqunet.com/Catalog/archive/71/iq/4089/4136/Comm_Studies_ADT"}})
    rc = C.file_prior(dest, out, report)
    check(rc == 0, "the prior read files")
    check(read(os.path.join(dest, "records", "30578.json"))["catalog_year"] == "2025-2026",
          "this run's extraction files as the 2025-2026 read, stamped with the year though its source carried none")
    check(read(os.path.join(dest, "records", "32692.json"))["extracted_run"] == "1",
          "a failed extraction keeps the filed record")
    check(read(os.path.join(dest, "records", "50000.json"))["extracted_run"] == "1"
          and read(os.path.join(dest, "records", "50000.json"))["catalog_year"] == "2026-2027",
          "a record copied from the filing is kept as filed, never relabeled 2025-2026")
    check(read(os.path.join(dest, "capture.json"))["catalog_year"] == "2026-2027"
          and read(os.path.join(dest, "summary.json")) == {"records": 3},
          "the college's capture and summary stay the current year's")
    idx = {x["control_number"]: x for x in read(os.path.join(dest, "sources.json"))}
    check(set(idx) == {"30578", "32692", "50000"} and idx["30578"]["method"] == "sitemap_page"
          and idx["30578"]["catalog_year"] == "2025-2026" and idx["32692"]["method"] == "page_claimed",
          "sources.json takes the read's entry for the filed program alone: %r" % idx)
    acct = read(os.path.join(dest, "prior_2025-2026.json"))
    check(acct["filed"] == ["30578"] and [k["control_number"] for k in acct["kept"]] == ["32692", "50000"],
          "prior_<year>.json names what it filed and what it kept: %r" % acct)
    # A capture-only prior read files a preview and leaves the filed account alone.
    pre = os.path.join(tmp, "out_preview")
    write(os.path.join(pre, "capture.json"), report)
    check(C.file_prior(dest, pre, report) == 0
          and os.path.isfile(os.path.join(dest, "prior_2025-2026_preview.json"))
          and read(os.path.join(dest, "prior_2025-2026.json"))["filed"] == ["30578"],
          "a capture-only prior read files prior_<year>_preview.json and keeps the account of the read that filed")
    # file_run sends a prior read to file_prior rather than replacing the folder.
    with open(os.path.join(ROOT, "kb", "_program_requirements_college.py"), encoding="utf-8") as fh:
        src = fh.read()
    body = src[src.index("def file_run("):]
    check(body.index('if report.get("prior")') < body.index('for old in glob.glob(os.path.join(dest, "records"'),
          "file_run routes a prior read before it clears the college's records")

check('force = set(force or ()) | set(_prior["only"])' in src
      and src.index('force = set(force or ()) | set(_prior["only"])') < src.index("held(path, prev.get(src[\"control_number\"]), src)"),
      "a prior read's extraction forces every named program past the coverage holds (run 43799222099)")
check('and not report.get("reread") and not report.get("prior")' in src,
      "a prior read never runs the no-closed-list lookup, which refuses archive pages")
wf = open(os.path.join(ROOT, ".github", "workflows", "program-requirements-college.yml"), encoding="utf-8").read()
check("CAPTURE_PRIOR: ${{ github.event.inputs.prior || '' }}" in wf, "the capture step passes the prior input")
check("prior reads the programs it names" in wf, "the workflow refuses prior beside sources_from, route or limit")

print("%d checks, %d failed" % (checks[0], len(failures)))
for f in failures:
    print("FAIL:", f)
sys.exit(1 if failures else 0)
