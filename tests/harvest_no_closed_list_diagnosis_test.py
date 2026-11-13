#!/usr/bin/env python3
"""Guard for kb/_harvest_no_closed_list_diagnosis.py (S644).

Pins each reason to a fixture: a control number the Program Course File never names, one it names only
under another college's code, one whose only rows are a pending revision, one retired in the file, one
whose every listed course is retired (with and without a same-code course still kept), and the
join_dropped reason that would mean a bug in chatbox/build_program_courses.py. Then the bands the note
counts in: the award, the approval date's legacy placeholder, and the tallies summing to the members.
Pure stdlib; reads no committed data file.

Run: python3 tests/harvest_no_closed_list_diagnosis_test.py   (exit 0 = all pass)
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _harvest_no_closed_list_diagnosis as D  # noqa: E402

checks, failures = [0], []


def check(ok, what):
    checks[0] += 1
    if not ok:
        failures.append(what)


def row(code, cn, pst, ctl, cst, crs):
    return {"CollegeCode": code, "ProgramControlNumber": cn, "ProgramStatus": pst,
            "CourseControlNumber": ctl, "CourseStatus": cst, "CrsId": crs}


mem = [
    # Alpha (code 111): P2 lives only under Beta's code; P3 a pending revision; P4 retired;
    # P5 every course retired, its BUS10 kept under a new control; P6 retired with no successor;
    # P7 a kept row the build would keep (join_dropped).
    row("111", "A0", "Active", "C0", "Active", "ENG1"),
    row("222", "P2", "Active", "C1", "Active", "ART1"),
    row("222", "B0", "Active", "C9", "Active", "ART2"),
    row("111", "P3", "Submitted", "C2", "Active", "MATH1"),
    row("111", "P4", "Inactive", "C3", "Active", "HIST1"),
    row("111", "P5", "Active", "C4", "Inactive", "BUS 10"),
    row("111", "P5", "Active", "C5", "Deleted", "BUS11"),
    row("111", "N1", "Active", "C6", "Active", "BUS10"),
    row("111", "P6", "Active", "C7", "Inactive", "OLD1"),
    row("111", "P7", "Active", "C8", "Active", "NEW1"),
]
export = {("Alpha", cn): {"TITLE": "t" + cn, "AWARD": aw, "APPROVED DATE": ad, "MAJOR UNITS": mu,
                          "CERT UNITS": "", "STATUS": "Active"}
          for cn, aw, ad, mu in [("A0", "A.A. Degree", "2015-03-02", "18.00-18.00"),
                                 ("N1", "A.S. Degree", "", ""),
                                 ("P1", "A.S. Degree", "2004-01-01", "24.00-24.00"),
                                 ("P2", "A.A- T Degree", "2018-07-21", "60.00"),
                                 ("P3", "Noncredit program", "", ""),
                                 ("P4", "Certificate of Achievement requiring 8S/12Q to fewer than 16S/24Q units",
                                  "2026-01-07", "12.00"),
                                 ("P5", "Certificate of Achievement: 18  or greater semester(or 27  or greater quarter) units",
                                  "2008-05-01", "0.00-0.00"),
                                 ("P6", "", "2021-09-01", ""),
                                 ("P7", "A.A. Degree", "2012-01-01", "")]}
export[("Beta", "B0")] = {"TITLE": "b", "AWARD": "A.A. Degree", "APPROVED DATE": "", "STATUS": "Active"}
members = [("Alpha", cn) for cn in ("P1", "P2", "P3", "P4", "P5", "P6", "P7")]
captures = {("Alpha", "P1"): {"method": "no_closed_list", "source": None},
            ("Alpha", "P7"): {"method": "sitemap_page", "source": "https://x"}}
r = D.diagnose(members, export, mem, captures)
by = {p["control_number"]: p for p in r["programs"]}

want = {"P1": "cn_absent", "P2": "cn_other_college_only", "P3": "program_pending_only",
        "P4": "program_inactive", "P5": "courses_all_retired", "P6": "courses_all_retired",
        "P7": "join_dropped"}
for cn, reason in want.items():
    check(by[cn]["reason"] == reason, "%s takes %s, got %s" % (cn, reason, by[cn]["reason"]))
check(all(p["reason"] in D.REASONS for p in r["programs"]), "every reason is on the closed list")
check(by["P5"]["replaced"] == "some" and by["P5"]["same_code_kept"] == 1 and by["P5"]["listed"] == 2,
      "a retired course kept under a new control is matched by its code, spaces ignored")
check(by["P6"]["replaced"] == "none", "a retired course with no kept successor is none")
check(by["P1"]["page"] == "never looked for" and by["P7"]["page"] == "looked" and by["P2"]["page"] == "no capture entry",
      "the capture's no_closed_list entry with no source is a page never looked for")

check(by["P1"]["approved"] == "Jan 1 before 2010 (legacy placeholder)", "a Jan 1 date before 2010 is the placeholder")
check(by["P7"]["approved"] == "2010-2019", "a Jan 1 date from 2010 on is an ordinary date")
check(by["P3"]["approved"] == "no approval date" and by["P4"]["approved"] == "2026", "blank and 2026 bands")
check(by["P2"]["award"] == "transfer degree (ADT)" and by["P1"]["award"] == "local degree (A.A., A.S.)",
      "a transfer degree and a local degree")
check(by["P4"]["award"] == "certificate, 8 to under 16 units" and by["P5"]["award"] == "certificate, 18 units or more",
      "the certificate bands read the award's own words")
check(by["P3"]["credit"] == "noncredit" and by["P6"]["award"] == "award blank", "noncredit, and a blank award")
check(by["P1"]["units_stated"] and not by["P5"]["units_stated"], "zero units is no units stated")

check(r["members"] == len(members), "every member is diagnosed once")
for k in ("reason", "award", "approved", "credit", "page"):
    check(sum(r["tallies"][k].values()) == r["members"], "the %s tally sums to the members" % k)

b = D.baseline(export, mem)
check(sum(b["in_file"].values()) + sum(b["absent"].values()) == len(export), "the baseline counts every Active program")
check(b["absent"].get("Jan 1 before 2010 (legacy placeholder)") == 1, "the baseline's absent side holds P1's placeholder")

if failures:
    print("FAIL: harvest no closed list diagnosis (%d of %d)" % (len(failures), checks[0]))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("%d/%d checks passed: harvest no closed list diagnosis" % (checks[0], checks[0]))
