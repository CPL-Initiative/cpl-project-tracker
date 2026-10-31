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
  - no student figure reaches this public file (the student-detail ADR);
  - Worth a faculty review lists a Credential Engine top-50 credential only when its hand check says
    related or not_in_map, never one the check found in MAP, never one with no check yet, and drops
    one the day the reference gains a title of the same name; a related one names MAP's credential.

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
    def ce(rank, name, **kw):
        row = {"ctid": "ce-%d" % rank, "rank": rank, "name": name,
               "owned_by": [{"name": "Issuer %d" % rank}], "audience_level": [], "occupation_type": [], "industry_type": []}
        row.update(kw)
        return row
    write(root, "kb/reference/credential_engine_top50.json", {"credentials": [
        ce(2, "Logistics Tech", subject_webpage="https://issuer.example/clt",
           audience_level=["Beginner Level", "Secondary School or Equivalent", "Bachelors Degree Level"],
           occupation_type=[{"code": "13-1081.00", "name": "Logisticians"}, {"code": "13-1081.02", "name": "Logistics Analysts"},
                            {"code": "11-3071.00", "name": "Managers A"}, {"code": "11-3071.04", "name": "Managers B"},
                            {"code": "43-5011.00", "name": "Cargo Agents"}, {"code": "53-7065.00", "name": "Stockers"}],
           industry_type=[{"code": "48", "name": "Transportation"}, {"code": "49", "name": "Warehousing"}, {"code": "42", "name": "Wholesale"}]),
        ce(1, "Entry Welder", audience_level=["Intermediate Level"]),
        ce(3, "In MAP Already"),
        ce(4, "Nobody Checked"),
        ce(5, "Rule Stamped"),
    ]})
    write(root, "kb/reference/credential_engine_top50_map_check.json", {"checks": [
        {"ctid": "ce-1", "verdict": "related", "map_title": "Person Stamped"},
        {"ctid": "ce-2", "verdict": "not_in_map"},
        {"ctid": "ce-3", "verdict": "in_map", "map_title": "Rule Stamped"},
        {"ctid": "ce-5", "verdict": "not_in_map"},
    ]})
    write(root, "kb/it_ai_credential_catalog.json", {"credentials": [
        {"ctid": "ce-2", "map_status": "not in MAP", "cip": {"code": "52.0203", "title": "Logistics", "sector": "52", "sector_title": "Business"}},
        {"ctid": "ce-2", "map_status": "not in MAP", "cip": {"code": "99.9999", "title": "A second row", "sector": "99"}},
        {"ctid": "ce-3", "map_status": "not in MAP"},
        {"ctid": "ce-4", "map_status": "not in MAP"},
    ]})


with tempfile.TemporaryDirectory() as root:
    fixture(root)
    d = B.build(root)
    by = {c["t"]: c for c in d["credentials"]}
    names = [c[0] for c in d["colleges"]]

    check("a credential no stamped title names is held back", "Classifier Only" not in by)
    check("a person's stamp settles it", "Person Stamped" in by)
    check("a procedure cohort's stamp settles it", "Rule Stamped" in by)
    check("counts say how many were held", {k: d["counts"][k] for k in ("settled", "held", "in_reference")} == {"settled": 2, "held": 1, "in_reference": 3})
    rv = {r["t"]: r for r in d["review"]}
    check("review: a not_in_map and a related check are listed, most collections first", [r["t"] for r in d["review"]] == ["Entry Welder", "Logistics Tech"])
    check("review: a credential the check found in MAP is not listed", "In MAP Already" not in rv)
    check("review: a credential with no check waits, and is counted", "Nobody Checked" not in rv and d["counts"]["review_unchecked"] == 1)
    check("review: one the reference has gained since the check is dropped", "Rule Stamped" not in rv and d["counts"]["review_joined"] == 1)
    check("review: a related credential names MAP's", rv["Entry Welder"].get("r") == "Person Stamped")
    lt = rv["Logistics Tech"]
    check("review: occupations fold O*NET codes to SOC and name three", lt["o"] == ["Logisticians (13-1081)", "Managers A (11-3071)", "Cargo Agents (43-5011)"] and lt["on"] == 1)
    check("review: industries name two and count the rest", len(lt["n"]) == 2 and lt["nn"] == 1 and lt["n"][0] == "Transportation (NAICS 48)")
    check("review: the field is the catalog's first CIP row, with its sector", lt["f"] == "Logistics (CIP 52.0203)" and lt["s"] == "52")
    check("review: the level reads the schooling range, not the learner words", lt["l"] == "High school through bachelor's" and "l" not in rv["Entry Welder"])
    check("review: the issuer, its page and the CTID travel", lt["i"] == "Issuer 2" and lt["u"] == "https://issuer.example/clt" and lt["k"] == "ce-2")
    check("review: a review row's sector the adoption file lacks takes the catalog's title", d["sectors"].get("52") == "Business")
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
    check("only sectors in use are listed", set(d["sectors"]) == {"11", "51", "52"})
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
        ref_titles = set((B.load_json(ROOT, "kb/exhibits_adoption.json") or {}).get("credentials") or {})
        check("live: no review credential shares a name with a reference credential",
              not ({B.norm_title(r["t"]) for r in live["review"]} & {B.norm_title(t) for t in ref_titles}))
        check("live: every top-50 row the catalog marks not in MAP has a check", live["counts"]["review_unchecked"] == 0)
        check("live: no could-adopt college also articulates", all(
            not ({x[0] for x in c.get("c", [])} & {a[0] for a in c["a"]}) for c in live["credentials"]))

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
