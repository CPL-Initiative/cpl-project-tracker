#!/usr/bin/env python3
"""The statewide catalog builder (fact-sheet/_build_statewide_catalog.py), without the pipeline.

Sierra quotes each exhibit's total units from this file and never adds them herself, so
the sum is the builder's to get right. This drives build() with small fixtures and the
REAL Fact Sheet recs builder (fact-sheet/_build_statewide_recs.py, pure stdlib), and a
dictionary in place of excel_to_dashboard's categorizer, so it needs no openpyxl:

  - a line's units read as the Fact Sheet prints them: "3", a span "6–7", or the
    figures inside a whole line ("3-4 hours in ...", "3 or 4 hours in ...");
  - an exhibit's total is the sum, a range when any line is one;
  - an exhibit with no published line carries units None and recs 0, never a zero total;
  - program areas come out in the Fact Sheet's order, and a count that disagrees with
    fact_sheet_metrics.json stops the build rather than publishing a mismatch;
  - only CCC Collaborative exhibits are listed.

Run: python3 tests/statewide_catalog_build_test.py  (tests/sierra_statewide_catalog.test.js
runs it too, so CI's suite carries it).
"""
import contextlib
import importlib.util
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


cat = load("swcat", "fact-sheet/_build_statewide_catalog.py")
recs = load("swrecs", "fact-sheet/_build_statewide_recs.py")

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))


# ── one line at a time ───────────────────────────────────────────────────────
check("a plain figure", cat.line_span({"t": "Criminal Law", "u": "3"}) == (3.0, 3.0))
check("a decimal figure", cat.line_span({"t": "x", "u": "0.5"}) == (0.5, 0.5))
check("the Fact Sheet's span", cat.line_span({"t": "EMT", "u": "6–7"}) == (6.0, 7.0))
check("a whole line with a hyphen range",
      cat.line_span({"t": "3-4 hours in Introduction to Welding", "u": ""}) == (3.0, 4.0))
check("a whole line with spaces around the hyphen",
      cat.line_span({"t": "3 - 4 hours in Introduction to FCAW", "u": ""}) == (3.0, 4.0))
check("a whole line with 'or'",
      cat.line_span({"t": "3 or 4 hours in Engine Performance", "u": ""}) == (3.0, 4.0))
check("a singular 'hour'",
      cat.line_span({"t": "2-4 hour in Electives/Work Experience", "u": ""}) == (2.0, 4.0))
check("a line with no figure states none", cat.line_span({"t": "Elective credit", "u": ""}) is None)

# ── an exhibit's total ───────────────────────────────────────────────────────
units, unstated = cat.total_units([
    {"t": "A", "u": "3"}, {"t": "B", "u": "6–7"},
    {"t": "3-4 hours in C", "u": ""}, {"t": "3 or 4 hours in D", "u": ""},
])
check("lines add up, ranges into a range", units == "15–18" and unstated == 0, units)
units, _ = cat.total_units([{"t": "A", "u": "3"}, {"t": "B", "u": "3.0"}])
check("a whole-number total prints without a decimal", units == "6", units)
units, _ = cat.total_units([{"t": "A", "u": "0.5"}, {"t": "B", "u": "1"}])
check("a fractional total keeps its decimal", units == "1.5", units)
units, unstated = cat.total_units([{"t": "A", "u": "3"}, {"t": "Elective credit", "u": ""}])
check("a line with no figure is counted apart, never as zero", units == "3" and unstated == 1)
units, unstated = cat.total_units([])
check("no lines at all is no total", units is None and unstated == 0)

# ── the whole build, with the real Fact Sheet recs builder ───────────────────
SW = {"generated_at": "2026-10-16T13:59:04", "exhibits": [
    {"unified_title": "POST Basic Academy", "collaborative_type": "CCC Collaborative",
     "authoritative_recs": [
         {"credit": "3 hours in Criminal Law", "cid": "AJ 120"},
         {"credit": "3.0 hours in Intro to Administration of Justice", "cid": "AJ 110"},
     ]},
    {"unified_title": "NCCER Welding Level 2", "collaborative_type": "CCC Collaborative",
     "authoritative_recs": [
         {"credit": "3-4 hours in Introduction to Welding", "cid": ""},
         {"credit": "2 hours in Thermal Cutting Processes", "cid": ""},
     ]},
    {"unified_title": "Defense Language Proficiency Test (DLPT) — Russian",
     "collaborative_type": "CCC Collaborative", "authoritative_recs": []},
    {"unified_title": "AWS D1.1 SMAW Qualified Welder", "collaborative_type": "CCC Collaborative",
     "authoritative_recs": [{"credit": "3 hours in Shielded Metal Arc Welding", "cid": ""}]},
    {"unified_title": "Some Local Thing", "collaborative_type": "Local",
     "authoritative_recs": [{"credit": "3 hours in X", "cid": ""}]},
]}
AREA = {
    "POST Basic Academy": "Administration of Justice",
    "NCCER Welding Level 2": "Welding",
    "AWS D1.1 SMAW Qualified Welder": "Welding",
    "Defense Language Proficiency Test (DLPT) — Russian": "World Languages",
}
METRICS = {"statewide_exhibits": {"total": "4", "program_areas": "3", "by_sector": [
    {"sector": "Welding", "exhibits": 2}, {"sector": "World Languages", "exhibits": 1},
    {"sector": "Administration of Justice", "exhibits": 1},
]}}

doc = cat.build(SW, METRICS, lambda t: AREA[t], recs)
check("only CCC Collaborative exhibits are listed", doc["exhibits"] == 4)
check("program areas follow the Fact Sheet's order",
      [s["sector"] for s in doc["sectors"]] == ["Welding", "World Languages", "Administration of Justice"])
weld = doc["sectors"][0]
check("titles sort the way the Fact Sheet's lists sort",
      [i["title"] for i in weld["items"]] == ["AWS D1.1 SMAW Qualified Welder", "NCCER Welding Level 2"])
nccer = weld["items"][1]
check("a whole-line range and a plain line total 5–6", nccer["units"] == "5–6", nccer["units"])
check("an exhibit's count is its published lines", nccer["recs"] == 2)
dlpt = doc["sectors"][1]["items"][0]
check("an exhibit with no published line has no total and no lines",
      dlpt["units"] is None and dlpt["recs"] == 0 and dlpt["lines"] == [])
check("the file counts the exhibits with no line", doc["exhibits_without_lines"] == 1)
post = doc["sectors"][2]["items"][0]
check("the Fact Sheet's lines ride along with their C-IDs",
      {(l["t"], l["u"], l["cid"]) for l in post["lines"]}
      == {("Criminal Law", "3", "AJ 120"), ("Intro to Administration of Justice", "3.0", "AJ 110")},
      post["lines"])
check("the Fact Sheet link and anchor are carried",
      doc["fact_sheet_url"].endswith("/fact-sheet/") and doc["fact_sheet_anchor"] == "#statewide-exhibits")
check("the build stamp is the input's, so --check is stable", doc["source_generated_at"] == "2026-10-16T13:59:04")
check("rendering is deterministic", cat.render(doc) == cat.render(cat.build(SW, METRICS, lambda t: AREA[t], recs)))


def refuses(metrics, label):
    said = io.StringIO()
    try:
        with contextlib.redirect_stderr(said):
            cat.build(SW, metrics, lambda t: AREA[t], recs)
    except SystemExit:
        check(label, "ERROR:" in said.getvalue(), "refused without saying why")
        return
    check(label, False, "built anyway")


bad = json.loads(json.dumps(METRICS))
bad["statewide_exhibits"]["by_sector"][0]["exhibits"] = 3
refuses(bad, "a program-area count that disagrees with the Fact Sheet stops the build")
bad = json.loads(json.dumps(METRICS))
bad["statewide_exhibits"]["total"] = "5"
refuses(bad, "a total that disagrees with the Fact Sheet stops the build")
refuses({}, "no Fact Sheet metrics stops the build")

failed = [r for r in results if not r[1]]
for name, ok, detail in results:
    print(("PASS  " if ok else "FAIL  ") + name + ("" if ok or not detail else " -- " + str(detail)[:200]))
print("\nstatewide_catalog_build_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
