#!/usr/bin/env python3
"""The public adoption page's builder (kb/_build_adopt_page.py).

Sam, Open Asks Sheet 147 (2026-10-31): the public adoption page lists settled credentials only, a
person's or a rule's stamp (card 3), and takes EACR's college matrix and filters (card 1). The page
draws whatever this builder writes, so the contract guarded here is the file:
  - a credential no stamped local title names is held back, whoever classified it;
  - a person's stamp and a procedure cohort's stamp (...@bot) both settle it;
  - could adopt is only the prescriptive layer's `c` (the course the college already teaches), never
    the reference's TOP and C-ID overlap (`potential_colleges`; Sam, 2026-09-24; Rule 7);
  - a college articulating a credential is never also listed as one that could adopt it;
  - a name college_lookup.js does not hold takes no column;
  - the Request Quick Adopt IDs are MAP's verified ones, each with the college that built it;
  - no student figure reaches this public file (the student-detail ADR).

Run from the repo root: python3 tests/adopt_page_build_test.py
"""
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build_adopt_page", os.path.join(ROOT, "kb", "_build_adopt_page.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def write(root, rel, obj, js=None):
    path = os.path.join(root, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(js % json.dumps(obj) if js else json.dumps(obj))


def fixture(root):
    write(root, "kb/exhibits_adoption.json", {
        "written_at": "2026-10-31T03:57:45Z",
        "cip_sectors": {"11": "Computer Sciences", "51": "Health"},
        "colleges": ["Alpha College", "Beta College", "California State University Los Angeles", "Gamma College"],
        "credentials": {
            "Person Stamped": {"a": {"0": [3.0, [["CIS 1", "3 hours in Security"]]], "2": [3.0, [["X 1", "3 hours"]]]},
                               "c": {"1": [["CIS 75", "", 3.0]], "0": [["CIS 9", "", 3.0]]}, "s": "11", "p": 3.0, "w": 2},
            "Rule Stamped": {"a": {"1": [4.0, [["EMS 1", "4 hours in EMT"]]]}, "s": "51", "p": 4.0},
            "Classifier Only": {"a": {"3": [2.0, [["ABC 1", "2 hours"]]]}, "s": "11", "p": 2.0},
        },
    })
    write(root, "kb/unified_titles.json", {
        "raw a": {"unified_title": "Person Stamped", "reviewed_at": "2026-06-04", "reviewed_by": "map@rccd.edu"},
        "raw b": {"unified_title": "Rule Stamped", "reviewed_at": "2026-10-18", "reviewed_by": "cer-procedure-course-identity@bot"},
        "raw c": {"unified_title": "Classifier Only", "classified_by": "claude (batch classify)"},
        "raw d": {"unified_title": "Rule Stamped"},
    })
    write(root, "credential_reference_data.js", {"_generated_at": "2026-10-31T03:54:42+00:00", "unified_titles": [
        {"ut": "Person Stamped", "issuer": "CompTIA", "cpl_types": ["Industry Certification", "Credit By Exam"],
         "students_served": 25, "potential_colleges": ["Gamma College"]},
        {"ut": "Rule Stamped", "issuer": "NREMT", "cpl_types": ["Industry Certification"], "students_served": 12},
        {"ut": "Classifier Only", "issuer": "", "cpl_types": ["Other"]},
    ]}, js="window.CPL_CREDENTIAL_REFERENCE = %s;\n")
    write(root, "kb/reference/map_cpl_opportunities_verified.json", {
        "checked_at": "2026-10-26",
        "found": {"MAP-1": {"college": "Alpha College"}, "MAP-2": {"college": "Delta University"}},
        "by_title": {"Person Stamped": ["MAP-1", "MAP-2"]},
    })
    with open(os.path.join(root, "college_lookup.js"), "w", encoding="utf-8") as f:
        f.write('window.CCC_COLLEGE_LOOKUP = {\n'
                '  // a comment\n'
                '  "Alpha College": { district: "Alpha CCD", swRegion: "Bay Area (Region 3)", ascccArea: "B" },\n'
                '  "Beta College": { district: "Beta CCD", swRegion: "Inland Empire/Desert (Region 9)", ascccArea: "D" },\n'
                '  "Gamma College": { district: "Gamma CCD", swRegion: "Bay Area (Region 3)", ascccArea: "B" },\n'
                '};\n')
    write(root, "kb/college_short_names.json", {"colleges": [{"canonical": "Alpha College", "short": "Alpha", "aliases": []}]})


with tempfile.TemporaryDirectory() as root:
    fixture(root)
    d = B.build(root)
    by = {c["t"]: c for c in d["credentials"]}
    names = [c[0] for c in d["colleges"]]

    check("a credential no stamped title names is held back", "Classifier Only" not in by)
    check("a person's stamp settles it", "Person Stamped" in by)
    check("a procedure cohort's stamp settles it", "Rule Stamped" in by)
    check("counts say how many were held", d["counts"] == {"settled": 2, "held": 1, "in_reference": 3})
    check("a name college_lookup.js does not hold takes no column", "California State University Los Angeles" not in names)
    check("columns carry district, region and Area", d["colleges"][0] == ["Alpha College", "Alpha", "Alpha CCD", "Bay Area (Region 3)", "B"])
    ps = by["Person Stamped"]
    at = {n: i for i, n in enumerate(names)}
    check("the articulating college keeps its units and lines", ps["a"] == [[at["Alpha College"], 3.0, "CIS 1: 3 hours in Security"]])
    could = {names[c[0]] for c in ps.get("c", [])}
    check("could adopt is the prescriptive layer's course", could == {"Beta College"} and ps["c"][0][1] == "CIS 75")
    check("an articulating college is never also could-adopt", "Alpha College" not in could)
    check("could adopt never reads the reference's TOP and C-ID overlap", "Gamma College" not in could)
    check("issuer and types come from the reference", ps["i"] == "CompTIA" and [d["types"][i] for i in ps["y"]] == ["Credit By Exam", "Industry Certification"])
    check("the withheld count travels", ps.get("w") == 2)
    check("Request Quick Adopt IDs carry their builder", ps["m"] == [["MAP-1", at["Alpha College"], ""], ["MAP-2", -1, "Delta University"]])
    check("only sectors in use are listed", set(d["sectors"]) == {"11", "51"})
    text = json.dumps(d)
    check("no student figure reaches the public file", "students" not in text and "25" not in json.dumps(ps))
    out = os.path.join(root, "out.json")
    check("first write writes", B.write_if_changed(out, d) is True)
    d2 = B.build(root)
    d2["written_at"] = "2099-01-01T00:00:00Z"
    check("a stamp-only change leaves the file alone", B.write_if_changed(out, d2) is False)

    # The real files, when this checkout holds them: every listed credential is settled.
    if os.path.exists(os.path.join(ROOT, "kb", "exhibits_adoption.json")):
        live = B.build(ROOT)
        settled = B.settled_titles(B.load_json(ROOT, "kb/unified_titles.json", {}))
        check("live: every listed credential is settled", all(c["t"] in settled for c in live["credentials"]))
        check("live: no could-adopt college also articulates", all(
            not ({x[0] for x in c.get("c", [])} & {a[0] for a in c["a"]}) for c in live["credentials"]))

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
