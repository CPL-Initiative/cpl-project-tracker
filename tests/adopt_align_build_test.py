#!/usr/bin/env python3
"""The Credential Catalog's analysis builder (kb/_build_adopt_align.py).

Sam, 2026-11-06: the request for an evaluation carries an analysis of the issuer's skills against harvested course
outcomes with a confidence score, for the faculty who look at it. Guarded here:
  - a skills record joins a catalog title by its folded name, or by the one title that contains it;
  - the courses behind a credential are its articulating colleges' course codes, columns only;
  - an outcome's lead-in line ("...should be able to:") is never scored; the newest read of a course wins;
  - covered counts a skill area with an outcome at the threshold or more; confidence is covered over the skill areas,
    and null when no outcomes were found;
  - the file labels its method illustrative and names the outcome cover;
  - without the key and without --outcomes the builder writes nothing and says so.

Run from the repo root: python3 tests/adopt_align_build_test.py
"""
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build_adopt_align", os.path.join(ROOT, "kb", "_build_adopt_align.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def write(root, rel, obj):
    path = os.path.join(root, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f)


root = tempfile.mkdtemp()
write(root, "library/adopt/adopt_data.json", {
    "colleges": [["Alpha College", "Alpha", "", "", ""], ["Gamma College", "Gamma", "", "", ""]],
    "credentials": [{"t": "CompTIA Security+", "a": [[0, 3, ""]]}, {"t": "Cisco Certified Network Associate (CCNA)", "a": [[1, 3, ""]]}],
})
write(root, "kb/exhibits_adoption.json", {
    "colleges": ["Alpha College", "Gamma College", "Omega University"],
    "credentials": {
        "CompTIA Security+": {"a": {"0": [3, [["CIS 75", "3 hours"]]], "2": [3, [["SEC 1", "3 hours"]]]}},
        "Cisco Certified Network Associate (CCNA)": {"a": {"1": [3, [["CNT 52", "3 hours"], ["Cal-GETC 1A", ""]]]}},
    },
})
write(root, "kb/reference/industry_credential_skills.json", {"credentials": [
    {"name": "CompTIA Security+", "skills_kind": "exam domains", "source_url": "https://x/sec",
     "skills": [{"domain": "Threats, Vulnerabilities, and Mitigations", "weight": 22}, {"domain": "Security Operations", "weight": 28}]},
    {"name": "CCNA", "skills_kind": "exam topics", "skills": [{"domain": "Network Fundamentals"}]},
    {"name": "Nothing Like It", "skills": [{"domain": "Whatever"}]},
]})
rows = [
    {"college": "Alpha College", "course_code": "CIS 75", "course_title": "Security", "read_run": 1,
     "outcomes": ["Upon completion of this course, the student should be able to:", "Classify threats and vulnerabilities and apply mitigations."]},
    {"college": "Alpha College", "course_code": "CIS 75", "course_title": "Security (older)", "read_run": 0,
     "outcomes": ["Describe security operations in a security operations center."]},
    {"college": "Omega University", "course_code": "SEC 1", "course_title": "Not a column", "read_run": 1, "outcomes": ["Security operations everywhere."]},
]
data = B.build(root, rows)
a = data["align"]
check("the exact name and the contained name both join; a stray name does not", sorted(a) == ["Cisco Certified Network Associate (CCNA)", "CompTIA Security+"])
sec = a["CompTIA Security+"]
check("columns only: Omega's course is not scored", [c["college"] for c in sec["courses"]] == ["Alpha College"])
check("the newest read wins and the lead-in line is dropped", [s["text"] for s in sec["courses"][0]["slos"]] == ["Classify threats and vulnerabilities and apply mitigations."])
check("the outcome scores against its best skill area", sec["courses"][0]["slos"][0]["skill"] == "Threats, Vulnerabilities, and Mitigations" and sec["courses"][0]["slos"][0]["score"] >= B.COVERED_AT)
check("covered and confidence", sec["covered"] == 1 and sec["of"] == 2 and sec["confidence"] == 0.5)
ccna = a["Cisco Certified Network Associate (CCNA)"]
check("no outcomes found: confidence is null and the GE area is never a course", ccna["confidence"] is None and ccna["courses"] == [])
check("the method is labeled illustrative and the cover is counted", data["method"].startswith("lexical") and "Illustrative" in data["_about"]
      and data["cover"] == {"colleges": 2, "courses": 2})
check("no key, no file", B.main(["--root", root, "--out", os.path.join(root, "x.json")]) == 2 and not os.path.exists(os.path.join(root, "x.json")))
rows_path = os.path.join(root, "rows.json")
write(root, "rows.json", rows)
check("--outcomes writes the file", B.main(["--root", root, "--outcomes", rows_path, "--out", os.path.join(root, "y.json"), "--quiet"]) == 0 and os.path.exists(os.path.join(root, "y.json")))

failed = [r for r in results if not r[1]]
for r in results:
    print(("PASS " if r[1] else "FAIL ") + r[0])
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
