"""S718: a code the catalog index omits is read at its code's address, and filed only when the page names the code.

Guards the INST case (Cerritos, Sam 2026-11-23): the page "Interdisciplinary Studies (INST)" files INST; a page that
names another code (Cerritos /pol/ prints "Political Science (POLS)") files nothing for POL; a 404 files nothing."""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("probe", os.path.join(ROOT, "kb", "_subject_code_address_probe.py"))
P = importlib.util.module_from_spec(spec)
spec.loader.exec_module(P)

LOG = """2026-11-23T21:26:05.7416938Z ##### PAGE 1 · answers: code_inst
2026-11-23T21:26:05.7417425Z url: https://x.example/course-descriptions/inst/
2026-11-23T21:26:05.7418546Z status: 200
2026-11-23T21:26:05.7420578Z --- text (whole page) ---
2026-11-23T21:26:05.7421309Z Interdisciplinary Studies (INST) · INST Course Descriptions · INST 151 · 3.0 UNITS
2026-11-23T21:26:05.7416938Z ##### PAGE 2 · answers: code_pol
url: https://x.example/course-descriptions/pol/
status: 200
--- text (whole page) ---
Political Science (POLS) · POLS Course Descriptions
##### PAGE 3 · answers: code_esl
url: https://x.example/course-descriptions/esl/
status: 404
--- text (whole page) ---
Page not found
=== COLLEGE PAGE READ JSON BEGIN ===
"""
fails = []
def check(name, ok):
    print(("ok   " if ok else "FAIL ") + name)
    if not ok:
        fails.append(name)

pages = {p["url"].rsplit("/", 2)[-2]: p for p in P.parse_log(LOG)}
check("three pages parsed", set(pages) == {"inst", "pol", "esl"})
check("INST page names INST", P.heading_for(pages["inst"], "INST")[0] == "Interdisciplinary Studies")
check("POL is not filed from the POLS page", P.heading_for(pages["pol"], "POL")[0] is None)
check("the 404 keeps its status", pages["esl"]["status"] == "404")
check("two codes in one heading", P.heading_for({"text": ["Mathematics (MATH & STAT) · x"]}, "STAT")[0] == "Mathematics")
check("a breadcrumb ahead of the heading", P.heading_for({"text": ["Home\u203a \u00b7 Course Descriptions\u203a \u00b7 Creative Arts (CART) \u00b7 Print Options"]}, "CART")[0] == "Creative Arts")
check("a slash code reads as one address segment", P.slug_of_code("HVAC/R") == "hvacr")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _file_subject_headings as F  # noqa: E402
check("the filer's check knows the rule", "code_address" in open(os.path.join(ROOT, "kb", "_file_subject_headings.py")).read())
print("%d failed" % len(fails) if fails else "all checks passed")
sys.exit(1 if fails else 0)
