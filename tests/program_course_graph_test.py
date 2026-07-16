#!/usr/bin/env python3
"""Unit tests for kb/_build_program_course_graph.py — the program→course join
that replaces the TOP-proxy membership guess (see
docs/kb-notes/methodology-top-is-a-last-in-line-signal.md).

Guards: the join resolves course units/C-ID; unresolved (retired) courses still
land with their own title/TOP but no units; only live program+course statuses
count; the graph is keyed <NORMCOLLEGE>|<control> and sums resolved units.

Run: python3 tests/program_course_graph_test.py   (exit 0 = all pass)
"""
import importlib.util
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "_pcg", os.path.join(ROOT, "kb", "_build_program_course_graph.py"))
pcg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pcg)

results = []
def check(name, cond):
    results.append((name, bool(cond)))

# ── (1) pure assemble() semantics with inline fixtures ──
PC = [
    # Active program, two Active courses (one resolves, one doesn't) + one Inactive course (dropped)
    {"College": "Alameda", "Program Control Number": "01118", "Program Status": "Active",
     "Course Control Number": "CCC1", "Course Status": "Active", "Course Id": "ART53",
     "Course Title": "Advanced Painting", "Course TOP Code": "100210", "Course Classification Code": "Y"},
    {"College": "Alameda", "Program Control Number": "01118", "Program Status": "Active",
     "Course Control Number": "CCC_RETIRED", "Course Status": "Active", "Course Id": "ART99",
     "Course Title": "Old Painting", "Course TOP Code": "100210", "Course Classification Code": "Y"},
    {"College": "Alameda", "Program Control Number": "01118", "Program Status": "Active",
     "Course Control Number": "CCC_INACT", "Course Status": "Inactive", "Course Id": "ART00",
     "Course Title": "Dropped", "Course TOP Code": "100210", "Course Classification Code": "Y"},
    # Inactive PROGRAM — entirely dropped
    {"College": "Alameda", "Program Control Number": "09999", "Program Status": "Inactive",
     "Course Control Number": "CCC1", "Course Status": "Active", "Course Id": "X1",
     "Course Title": "x", "Course TOP Code": "0", "Course Classification Code": "Y"},
    # duplicate course in the same program — de-duped
    {"College": "Alameda", "Program Control Number": "01118", "Program Status": "Active",
     "Course Control Number": "CCC1", "Course Status": "Active", "Course Id": "ART53",
     "Course Title": "Advanced Painting", "Course TOP Code": "100210", "Course Classification Code": "Y"},
]
PROG = {("ALAMEDA", "01118"): {"title": "Art", "award": "A.A. Degree", "top": "1002.00", "cip": "50.0701", "status": "Active"}}
COURSE = {"CCC1": {"subj": "ART", "num": "53", "title": "Advanced Painting", "units": 3.0, "cid": "ARTS 200", "top": "1002.10"}}

g = pcg.assemble(PC, PROG, COURSE)

check("only the live program survives (Inactive program dropped)", list(g.keys()) == ["ALAMEDA|01118"])
node = g["ALAMEDA|01118"]
check("program metadata joined from the export", node["title"] == "Art" and node["award"] == "A.A. Degree")
check("Inactive COURSE dropped; duplicate de-duped → 2 courses", node["n_courses"] == 2)
check("one course resolves into the course list", node["n_resolved"] == 1)
resolved = [c for c in node["courses"] if c["resolved"]][0]
check("resolved course carries units + C-ID + clean subj/num", resolved["units"] == 3.0 and resolved["cid"] == "ARTS 200" and resolved["subj"] == "ART" and resolved["num"] == "53")
unresolved = [c for c in node["courses"] if not c["resolved"]][0]
check("unresolved course keeps its own title/TOP, no units", unresolved["title"] == "Old Painting" and unresolved["units"] is None and unresolved["top"] == "100210")
check("units_resolved sums only resolved courses", node["units_resolved"] == 3.0)
check("no _seen leaks into the payload", "_seen" not in node)

# ── (2) loader path against the committed real fixture ──
fx = os.path.join(ROOT, "tests", "fixtures", "program_course_sample.csv")
rows = pcg.load_pc_rows(fx)
check("fixture loads", rows and len(rows) >= 10)
# minimal inline meta so we don't need the 25MB xlsx in the test
course_meta = {r["Course Control Number"].strip(): {"subj": "ART", "num": "53", "title": r["Course Title"].strip(),
               "units": 3.0, "cid": "", "top": r["Course TOP Code"].strip()} for r in rows}
prog_meta = {("ALAMEDA", "01118"): {"title": "Art", "award": "A.A. Degree", "top": "1002.00", "cip": "", "status": "Active"}}
g2 = pcg.assemble(rows, prog_meta, course_meta)
check("fixture assembles the Art program", "ALAMEDA|01118" in g2 and g2["ALAMEDA|01118"]["title"] == "Art")
check("Art program has its painting courses", g2["ALAMEDA|01118"]["n_courses"] >= 5)

# ── (3) the FULL-export schema: compact headers + numeric CollegeCode ──
# (vs the single-college download's spaced headers + college name). Both must
# normalize onto the canonical keys, and zero-padded control numbers must survive.
fd, tmp = tempfile.mkstemp(suffix=".csv")
with os.fdopen(fd, "w", encoding="utf-8") as f:
    f.write("ProgramProposalId,CourseProposalId,CollegeCode,ProgramControlNumber,"
            "ProgramStatus,CourseControlNumber,CourseStatus,CrsId,Title,TopCode,"
            "CourseClassificationCode\n")
    f.write("1,2,073,07200,Active,CCC1,Active,PSMA401,Foundations,2199,Y\n")
rows3 = pcg.load_pc_rows(tmp, college_map={"073": "San Diego Miramar College"})
os.remove(tmp)
check("full-export compact headers normalize to canonical keys",
      bool(rows3) and rows3[0].get("Program Control Number") == "07200"
      and rows3[0].get("Course Id") == "PSMA401" and rows3[0].get("Course Title") == "Foundations")
check("numeric CollegeCode resolves to the college name",
      rows3[0]["College"] == "San Diego Miramar College")
check("leading zero on the control number is preserved (string, not int)",
      rows3[0]["Program Control Number"] == "07200")

passed = sum(1 for _, ok in results if ok)
for name, ok in results:
    print(("  PASS " if ok else "  FAIL ") + name)
print("%d/%d passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
