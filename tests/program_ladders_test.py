#!/usr/bin/env python3
"""kb/_build_program_ladders.py: where a program leads and what it starts from (Sam, 2026-11-27).

Failure modes: a certificate linked to a degree that holds only some of its courses as if it held all; a certificate
of one or two courses linked to every degree that lists them; a degree at another college counted; an alternative's
code left out of a record's set; a bachelor's linked by TOP code (doctrine: TOP is a last-in-line signal) or by a
CIP that agrees only on its first 2 digits; a link written one way only; the curated Cerritos B.S. lost; a rerun that
writes other bytes; a committed file the build would rewrite.

Run from repo root: python3 tests/program_ladders_test.py
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_program_ladders as B  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


def prog(title, award, level, codes, units=None):
    return {"title": title, "award": award, "level": level, "codes": set(codes), "units": units}


TEN = ["WELD %d" % i for i in range(1, 11)]
RECORDS = {
    "alpha": {"college": "Alpha College", "programs": {
        "100": prog("Welding", "A.S. Degree", "associate", TEN + ["MATH 1"], [30, 32]),
        "200": prog("Welding Basics", "Certificate of Achievement", "certificate", TEN[:5]),
        "201": prog("Welding Plus", "Certificate of Achievement", "certificate", TEN[:8] + ["ART 1", "ART 2"]),
        "202": prog("Welding Mostly", "Certificate of Achievement", "certificate", TEN[:9] + ["ART 3"]),
        "203": prog("Two Courses", "Certificate of Achievement", "certificate", TEN[:2]),
        "300": prog("Nursing", "A.S. Degree", "associate", ["NURS 1"]),
        "301": prog("Nursing Topics", "A.A. Degree", "associate", ["NURS 2"]),
        "302": prog("Health Science", "A.S. Degree", "associate", ["HLTH 1"]),
    }},
    "beta": {"college": "Beta College", "programs": {
        "900": prog("Welding Elsewhere", "Certificate of Achievement", "certificate", TEN[:5]),
    }},
    "cerritos": {"college": "Cerritos College", "programs": {
        "42158": prog("Apprenticeship: Field Ironworkers", "A.S. Degree", "associate", ["IWAP 1", "IWAP 2", "IWAP 3"]),
    }},
}
EXPORT = [
    {"COLLEGE": "ALPHA", "CONTROL NUMBER": "300", "TOP CODE": "1230.10 Nursing", "CIP CODE": "51.3801 Nursing.",
     "AWARD": "A.S. Degree", "STATUS": "Active", "TITLE": "Nursing"},
    {"COLLEGE": "ALPHA", "CONTROL NUMBER": "301", "TOP CODE": "1230.10 Nursing", "CIP CODE": "51.0000 Health.",
     "AWARD": "A.A. Degree", "STATUS": "Active", "TITLE": "Nursing Topics"},
    {"COLLEGE": "ALPHA", "CONTROL NUMBER": "302", "TOP CODE": "1201.00 Health", "CIP CODE": "51.3899 Nursing, other.",
     "AWARD": "A.S. Degree", "STATUS": "Active", "TITLE": "Health Science"},
    {"COLLEGE": "ALPHA", "CONTROL NUMBER": "500", "TOP CODE": "1230.10 Nursing", "CIP CODE": "51.3818 Nursing Practice.",
     "AWARD": "Baccalaureate of Science (B.S.) Degree.", "STATUS": "Active", "TITLE": "Nursing"},
    {"COLLEGE": "ALPHA", "CONTROL NUMBER": "501", "TOP CODE": "1230.10 Nursing", "CIP CODE": "51.3801 Nursing.",
     "AWARD": "Baccalaureate of Science (B.S.) Degree.", "STATUS": "Inactive", "TITLE": "Old Nursing"},
]
docs, index, stats = B.build(ROOT, records=RECORDS, export=EXPORT, bacc_ids={("ALPHA", "500"): "1230-alpha-nursing"})
A = docs["alpha"]["programs"]


def to(ctl, target, side="leads_to"):
    return [e for e in A.get(ctl, {}).get(side, []) if e.get("control_number") == target]


check("a certificate whose every course is in a degree reads contains, with its counts",
      [(e["kind"], e["shared"], e["of"]) for e in to("200", "100")] == [("contains", 5, 5)])
check("the link is written both ways: the degree names the certificate under comes_from",
      [e["kind"] for e in to("100", "200", "comes_from")] == ["contains"])
check("at 80% or more, short of all, it reads mostly with shared and of",
      [(e["kind"], e["shared"], e["of"]) for e in to("201", "100")] == [("mostly", 8, 10)]
      and [(e["kind"], e["shared"]) for e in to("202", "100")] == [("mostly", 9)])
check("a certificate under 3 courses takes no link", "203" not in A)
check("a degree at another college is never counted", "900" not in docs["beta"]["programs"] if "beta" in docs else True)
check("an associate links to an active bachelor's whose program CIP agrees on 4 digits",
      [(e["kind"], e["cip"], e.get("pathway")) for e in to("300", "500")] == [("same_field", "51.38", "1230-alpha-nursing")])
check("TOP is never read: the same TOP with another CIP takes no link", not to("301", "500"))
check("TOP is never read: another TOP with a CIP that agrees takes the link", [e["kind"] for e in to("302", "500")] == ["same_field"])
check("an inactive bachelor's takes no link", not to("300", "501"))
check("the bachelor's names its associates under comes_from", sorted(e["control_number"] for e in A["500"]["comes_from"]) == ["300", "302"])
check("a bachelor's without a record says so (record false)", all(e["record"] is False for e in to("300", "500")))
check("units come from the record", to("200", "100")[0]["units"] == [30, 32])
C = docs["cerritos"]["programs"]["42158"]["leads_to"]
check("the curated Cerritos B.S. stands, with its pathway and note",
      [(e["kind"], e["pathway"], e["note"], e["control_number"]) for e in C]
      == [("curated", "cerritos-field-ironworker-bs", "First cohort Spring 2027", None)])
check("the index maps each college with a link to its slug", index["colleges"].get("Alpha College") == "alpha")
check("leads_to puts a degree before a bachelor's", [e["kind"] for e in A["200"]["leads_to"]][:1] == ["contains"])

rec = {"blocks": [{"courses": [{"code": "iwap  40.07", "alternatives": [{"code": "IWAP 40.08"}]}, {"code": "Accounting (ACCTG) 101"}]}]}
check("a record's set holds its alternatives' codes, upper case, spaces folded, through file_code",
      B.course_set(rec) == {"IWAP 40.07", "IWAP 40.08", "ACCTG 101"})
check("a degree whose award reads Baccalaureate is a bachelor's; an ADT an associate; noncredit none",
      B.level("degree", "Baccalaureate of Science") == "bachelor" and B.level("adt", "A.S. T Degree") == "associate"
      and B.level("noncredit", "Noncredit program") is None)
check("the build reads no TOP column", "TOP CODE" not in open(os.path.join(ROOT, "kb", "_build_program_ladders.py")).read()
      .split('"""', 2)[2].replace("TOP CODE is never read", ""))

again = B.build(ROOT, records=RECORDS, export=EXPORT, bacc_ids={("ALPHA", "500"): "1230-alpha-nursing"})
check("a rerun writes the same bytes", [B.dump(d) for d in again[0].values()] == [B.dump(d) for d in docs.values()])

# The live build: Cerritos's A.S. starts from both ironworker certificates and leads to the curated B.S.
real, _, _ = B.build(ROOT)
cer = real["cerritos"]["programs"]
check("live: Cerritos 42158 comes from 36002 and 36003, every course",
      sorted((e["control_number"], e["kind"], e["shared"], e["of"]) for e in cer["42158"]["comes_from"])
      == [("36002", "contains", 16, 16), ("36003", "contains", 16, 16)])
check("live: and leads to the curated B.S.", [e["kind"] for e in cer["42158"]["leads_to"]] == ["curated"])
check("live: the committed files are current",
      subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_program_ladders.py"), "--check"],
                     cwd=ROOT, capture_output=True).returncode == 0)

print("%d/%d passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
