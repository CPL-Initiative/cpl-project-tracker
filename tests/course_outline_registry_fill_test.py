#!/usr/bin/env python3
"""Guards for kb/_course_outline_registry_fill.py (S373; Sam, Open Asks Sheet 70).

The receipt that fills program_source_registry's cor_* fields from a course
outline census: what each census verdict records, that a sign-in system is
recorded with no request, that the SLO source is the page whose outcomes were
read, and that every UPDATE is guarded and the rollback empties only this run.
Pure stdlib; run from the repo root.
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("fill", os.path.join(ROOT, "kb", "_course_outline_registry_fill.py"))
fill = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fill)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


cq = {"college": "Riverside City College", "cor_system": "curriqunet",
      "cor_url": "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5842/6111", "cor_access": "public",
      "cor_outline": "outline_with_slos", "cor_outline_url": "https://rccd.curriqunet.com/Report/Course/GetReport/1?reportId=97",
      "cor_prints_slos": True, "cor_slo": "Student Learning Outcomes: ...",
      "hosts": [{"system": "curriqunet", "url": "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5842/6111",
                 "final_url": "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5842/6111",
                 "outline": {"verdict": "outline_with_slos", "start": "https://rccd.curriqunet.com/"}}]}
f = fill.fields(cq, "1")
check("1 a public outline that prints SLOs: the dashboard as cor_url, the outline as proof and SLO source",
      f["cor_url"] == "https://rccd.curriqunet.com/" and f["cor_access"] == "public"
      and f["cor_proof_url"].endswith("reportId=97") and f["cor_prints_slos"] is True
      and f["cor_slo_source_url"] == f["cor_proof_url"] and f["cor_checked_run"] == "course-outline-census run 1", f)

outline_only = dict(cq, college="Chaffey College", cor_outline="outline", cor_prints_slos=False, cor_slo=None)
f = fill.fields(outline_only, "1")
check("1 a public outline with no SLO heading: proof kept, prints_slos false, no SLO source",
      f["cor_access"] == "public" and f["cor_proof_url"] and f["cor_prints_slos"] is False
      and f["cor_slo_source_url"] is None and "no student learning outcomes" in f["cor_note"], f)

signin = {"college": "Citrus College", "cor_system": "courseleaf_cim", "cor_url": "https://login.example/saml2",
          "cor_access": "sign_in", "cor_outline": "sign_in", "cor_outline_url": None, "cor_prints_slos": False,
          "hosts": [{"system": "courseleaf_cim", "url": "https://login.example/saml2", "outline": {"verdict": "sign_in"}}]}
f = fill.fields(signin, "1")
check("2 a sign-in system is recorded as sign_in with no request to the college (card 2), no proof, SLOs unknown",
      f["cor_access"] == "sign_in" and f["cor_proof_url"] is None and "no request" in f["cor_note"]
      and f["cor_prints_slos"] is None, f)
f = fill.fields(dict(cq, cor_outline="list_only", cor_outline_url=None, cor_prints_slos=True), "1")
check("2 a host where no outline was reached leaves prints_slos unknown, whatever an older census flagged",
      f["cor_prints_slos"] is None and f["cor_proof_url"] is None, f)

elumen = {"college": "Los Medanos College", "cor_system": "elumen", "cor_url": "https://lmc.elumenapp.com/catalog/26-27/art",
          "cor_access": "public", "cor_outline": "slos", "cor_outline_url": "https://lmc.elumenapp.com/catalog/26-27/course/art003",
          "cor_prints_slos": True, "hosts": [{"system": "elumen", "url": "https://lmc.elumenapp.com/catalog/26-27/art",
                                              "outline": {"verdict": "slos", "start": "https://lmc.elumenapp.com/catalog/26-27/art"}}]}
f = fill.fields(elumen, "1")
check("2 a catalog course page that prints SLOs is the SLO source (Sam's other repositories)",
      f["cor_prints_slos"] is True and f["cor_slo_source_url"].endswith("/course/art003"), f)

none = {"college": "X College", "cor_system": "none_found", "cor_url": None, "cor_access": "not_found",
        "cor_outline": "none_found", "cor_prints_slos": False, "hosts": []}
f = fill.fields(none, "1")
check("3 no system found: none_found, not_found, prints_slos unknown (null)",
      f["cor_system"] == "none_found" and f["cor_access"] == "not_found" and f["cor_prints_slos"] is None, f)

sql = fill.receipt({"run": "1", "rows": [cq, none, {**signin, "college": "O'Neill College"}]}, 373, "2026-10-12")
updates = sql.count("update public.program_source_registry set\n")
check("4 one UPDATE a college, each guarded on cor_checked_run is null, quotes doubled",
      updates == 3 and sql.count("and cor_checked_run is null;") == 3 and "'O''Neill College'" in sql)
check("4 the rollback empties only this run's rows and stays commented out",
      "-- where cor_checked_run = 'course-outline-census run 1';" in sql
      and "\nupdate public.program_source_registry set cor_system = null" not in sql)

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok or not why else " — " + str(why)))
print("\ncourse_outline_registry_fill_test.py: %d/%d checks passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
