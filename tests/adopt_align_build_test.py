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

# Objectives share the table (kind objective, S584) and a reread gives them a newer read_run than the SLOs: they must
# never stand in for a course's SLOs (COBIx on #3263).
mixed = [{"college": "Alpha College", "course_code": "CIS 1", "kind": "slo", "read_run": 100,
          "outcomes": ["Configure a secure network for a small office."]},
         {"college": "Alpha College", "course_code": "CIS 1", "kind": "objective", "read_run": 200,
          "outcomes": ["Describe the layers of the OSI model in detail."]}]
idx = B.index_outcomes(mixed)
only = list(idx.values())
check("an objectives row with a newer read_run never replaces the SLO row",
      len(only) == 1 and only[0]["kind"] == "slo" and only[0]["_outs"] == ["Configure a secure network for a small office."])
check("a course with objectives and no SLOs has no outcomes row", B.index_outcomes(mixed[1:]) == {})
src = open(os.path.join(ROOT, "kb", "_build_adopt_align.py")).read()
check("the live read selects SLO rows only", "/rest/v1/course_outcomes?" in src and "&kind=eq.slo&" in src)

# Unreviewed credentials (#3405 next step): scored against every harvested course; a standout covers at least
# STANDOUT_MIN skill areas and at least half; the page shows nothing until a session turns chips_shown on.
oc = B.index_outcomes([
    {"college": "Alpha College", "course_code": "NET 10", "course_title": "Network Security", "kind": "slo", "read_run": 1,
     "outcomes": ["Configure firewall rules for network perimeter defense.", "Analyze intrusion detection alerts and logs.",
                  "Apply encryption protocols to secure data transmission."]},
    {"college": "Gamma College", "course_code": "NET 20", "course_title": "Firewalls Only", "kind": "slo", "read_run": 1,
     "outcomes": ["Configure firewall rules for network perimeter defense."]},
])
uj = {"Network Defender": {"skills": [{"domain": "Firewall rules and perimeter defense"}, {"domain": "Intrusion detection alerts"},
                                      {"domain": "Encryption protocols for data transmission"}, {"domain": "Cloud governance policy"}]},
      "Two Areas Only": {"skills": [{"domain": "Firewall rules"}, {"domain": "Intrusion detection"}]}}
u = B.score_unreviewed(uj, oc)
nd = u.get("Network Defender") or {}
check("unreviewed: a course covering 3 of 4 skill areas is a standout, named with its college",
      nd.get("of") == 4 and nd.get("need") == 3 and nd.get("top", [[None]])[0][:4] == ["Alpha College", "NET 10", "Network Security", 3])
check("unreviewed: a course covering one skill area is not a standout", nd.get("standouts") == 1)
check("unreviewed: fewer than STANDOUT_MIN skill areas takes no chip", "Two Areas Only" not in u)
check("unreviewed: the section is written with chips_shown false", data["unreviewed"]["chips_shown"] is False
      and "unreviewed_with_standout" in data["counts"])

# The first live run's failure (2026-11-16 22:04Z): common words carried absurd standouts. With a realistic corpus,
# a course that shares only common words with the skill areas is no standout, and a course whose title shares no
# distinctive word with the credential is none either.
pad = [{"college": "Pad College", "course_code": "PAD %d" % i, "course_title": "General Studies %d" % i, "kind": "slo", "read_run": 1,
        "outcomes": ["Develop planning and management of systems and processes for personal goals %d." % i]} for i in range(600)]
oc2 = B.index_outcomes(pad + [
    {"college": "Cuesta College", "course_code": "KINE 220", "course_title": "Personalized Fitness Planning", "kind": "slo", "read_run": 1,
     "outcomes": ["Apply planning and management of systems to fitness.", "Develop management processes for wellness.",
                  "Create planning systems for lifetime goals."]},
    {"college": "Alpha College", "course_code": "NET 10", "course_title": "Network Security", "kind": "slo", "read_run": 1,
     "outcomes": ["Configure firewall rules for network perimeter defense.", "Analyze intrusion detection alerts and logs.",
                  "Apply encryption protocols to secure data transmission."]},
    {"college": "Beta College", "course_code": "XYZ 1", "course_title": "Special Topics", "kind": "slo", "read_run": 1,
     "outcomes": ["Configure firewall rules for network perimeter defense.", "Analyze intrusion detection alerts and logs.",
                  "Apply encryption protocols to secure data transmission."]},
])
uj2 = {"Identity Administrator": {"skills": [{"domain": "Identity planning and management"}, {"domain": "Systems management processes"},
                                             {"domain": "Planning governance"}, {"domain": "Access management"}]},
       "Network Defender": uj["Network Defender"]}
u2 = B.score_unreviewed(uj2, oc2)
check("distinctive words: shared common words alone make no standout (the fitness course)", "Identity Administrator" not in u2)
check("distinctive words: the network course still stands out", [x[1] for x in (u2.get("Network Defender") or {}).get("top", [])] == ["NET 10"])
check("title gate: the same outcomes under a title with no shared distinctive word are no standout",
      all(x[1] != "XYZ 1" for x in (u2.get("Network Defender") or {}).get("top", [])))

failed = [r for r in results if not r[1]]
for r in results:
    print(("PASS " if r[1] else "FAIL ") + r[0])
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
