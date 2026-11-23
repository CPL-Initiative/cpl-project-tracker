#!/usr/bin/env python3
"""S713's three general education reconcile steps (kb/_program_ge_steps_s713.py; d-ge-steps-three-colleges-s713).

Pinned: the Las Positas pattern reads "Additional General Education and Elective Units" and "... and Electives" and
not "General Education and Electives" alone; the Antelope Valley fill reads the printed figure (a single figure and a
range) on a local degree and never on a transfer degree or a certificate; the College of Marin step sets 22 to 34;
and the measure on every committed record at the three colleges: precision against the hand reading wrong 0, the
boundary readings wrong 0, the records each step moves beyond its targets named.

Run from repo root: python3 tests/program_ge_steps_s713_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_ge_steps_s713 as G  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def rec(award, total=(26, 26)):
    return {"program": {"degree_total": {"min": 60, "max": 60}, "ge_pattern": "GE", "ge_units": {"min": None, "max": None},
                        "total_units": {"min": total[0], "max": total[1]}},
            "blocks": []}


def ge(college, award, text, total=(26, 26)):
    out, notes = R._college_steps(rec(award, total), text, college, award)[:2]
    return (out.get("program") or {}).get("ge_units")


LPC = "Las Positas College"
for t, want in (("Additional General Education and Elective Units 27.0", {"min": 22, "max": 22}),
                ("Additional General Education and Electives 25.0", {"min": 22, "max": 22}),
                ("General Education and Electives 25.0", {"min": None, "max": None})):
    check(ge(LPC, "A.S. Degree", t) == want, "Las Positas A.S. on %r: %r" % (t, ge(LPC, "A.S. Degree", t)))
check(ge(LPC, "A.A. Degree", "Additional General Education and Electives 35.0") == {"min": 28, "max": 28},
      "Las Positas A.A. takes LPC-GE's 28")
AVC = "Antelope Valley College"
line = "Completion of General Education requirements, plus electives as needed to reach 60 units. %s units"
check(ge(AVC, "A.A. Degree", line % "34") == {"min": 34.0, "max": 34.0}, "Antelope Valley reads a single figure")
check(ge(AVC, "A.A. Degree", "Completion of General Education requirements, plus electives (as needed to reach 60 "
         "units) 30-33", total=(27, 30)) == {"min": 30.0, "max": 33.0}, "Antelope Valley reads a range")
# #3707's second reader fed Commercial Music 36852's record (major 26, degree 60) lines where the first digits after
# the words are no figure of the degree's rest: a list number, a footnote, a catalog year, and the words in the
# proposal text above the table. The fill takes only a figure that is 60 less the major's 26.
NONE = (None, {"min": None, "max": None})
GE_WORDS = "Completion of General Education requirements, plus electives as needed to reach 60 units"
for t in (GE_WORDS + "\n1. Select one course from List A",
          GE_WORDS + " 2 See the footnote below the table",
          GE_WORDS + " 2026-2027 Catalog",
          "The proposal adds " + GE_WORDS + " 15 to the program."):
    check(ge(AVC, "A.A. Degree", t) in NONE, "Antelope Valley takes no wrong figure from %r (%r)" % (
        t[-40:], ge(AVC, "A.A. Degree", t)))
check(ge(AVC, "A.A. Degree", "The proposal adds " + GE_WORDS + " 15 to the program.\n" + GE_WORDS + " 34 units")
      == {"min": 34.0, "max": 34.0}, "Antelope Valley skips the proposal text and reads the table's 34")
check(ge(AVC, "A.A. Degree", line % "35") in NONE, "a figure past 60 less the major is no fill (35 beside 26)")
check(ge(AVC, "A.A. Degree", line % "34", total=(None, None)) in NONE, "no major total, no fill")
check(ge(AVC, "A.A.-T Degree", line % "34") in (None, {"min": None, "max": None}), "never a transfer degree")
check(ge(AVC, "Certificate of Achievement", line % "34") in (None, {"min": None, "max": None}), "never a certificate")
MARIN = "College of Marin"
check(ge(MARIN, "A.A. Degree", "College of Marin GE (minimum 22 units) or Cal-GETC (minimum 34 units)")
      == {"min": 22, "max": 34}, "Marin sets 22 to 34")
check(ge(MARIN, "A.A. Degree", "College of Marin GE requirements apply") == {"min": None, "max": None},
      "Marin needs both minimums printed")

# The measure ran on the base commit's records, before the runs filled them in; the receipt keeps it.
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_ge_steps_2026-11-23_s713ge.json")
with open(RECEIPT, encoding="utf-8") as fh:
    receipt = json.load(fh)
m = receipt["measured_before_the_runs"]["measured"]
for c, r in m.items():
    check(r["precision"]["wrong"] == 0, "%s: precision wrong %r" % (c, r["precision"]["wrong_keys"]))
    check(r["boundaries"]["wrong"] == 0, "%s: boundaries wrong %r" % (c, r["boundaries"]["wrong_keys"]))
    check(set(G.TARGETS[c]) <= set(r["targets_quoted"]), "%s: every target quotes the step's words" % c)
check(m[LPC]["moves_beyond_targets"] == ["01032", "01037"], "Las Positas moves 01032 and 01037 beyond its targets")
check(m[AVC]["moves_beyond_targets"] == ["43686", "43722"], "Antelope Valley moves 43686 and 43722 beyond its targets")
check(m[MARIN]["would_pass"] == [], "Marin passes none: its pages name no electives filling the 60")

# The runs against the prediction, and the plan: one full-row row per record a step wrote.
rows = receipt["records"]
keys = {(r["college"], r["control_number"]) for r in rows}
predicted = {(c, cn): True for c, r in m.items() for cn in r["would_pass"]}
predicted.update({(c, cn): False for c, r in m.items() for cn in r["would_fail"]})
for r in rows:
    k = (r["college"], r["control_number"])
    check(k in predicted and predicted[k] == r["passes_after"], "%s %s: the run's verdict is the predicted one" % k)
    check(r["before_image"]["record"] != r["after_image"]["record"], "%s %s: a step wrote the record" % k)
    with open(os.path.join(ROOT, "kb", "program_requirements_college", G.COLLEGES[k[0]], "records",
                           k[1] + ".json"), encoding="utf-8") as fh:
        filed = json.load(fh)
    check(str(filed.get("extracted_run")) == str(r["after_image"]["extracted_run"])
          and filed["record"]["program"].get("ge_units", {}).get("min") is not None,
          "%s %s: the committed record carries the run and its units" % k)
check(len(rows) == 8 and all(r["passes_after"] and not r["passes_before"] for r in rows),
      "8 rows, each moving a failing record to passing")
held = {(c, cn) for c, cn, _ in receipt["decided_held"]}
check(held == {(LPC, "01037")}, "01037 is held: it passes only by double counting (d-ge-01037-held-double-count-s713)")
check({k for k, v in predicted.items() if v and k[0] != MARIN} - held == keys, "every other predicted pass has a row")
check([x[:2] for x in receipt["never_loaded_took_step"]] == [[LPC, "18813"]] and "18813" in receipt["run_notes"][LPC],
      "18813 took the step, was never loaded, and is listed")
for r in rows:
    if r["college"] == AVC:
        p = r["after_image"]["record"]["program"]
        check(p["ge_units"]["min"] == p["degree_total"]["min"] - p["total_units"]["max"]
              and p["ge_units"]["max"] == p["degree_total"]["max"] - p["total_units"]["min"],
              "%s: the filed figure is the degree less the major" % r["control_number"])
with open(os.path.join(ROOT, "kb", "program_requirements_college", "antelope_valley", "records", "17750.json"),
          encoding="utf-8") as fh:
    check(json.load(fh)["extracted_run"] != 45133183717, "17750 keeps main's record (its restamp is undone)")
check(sorted([c, cn] for c, cn, *_ in receipt["record_written_verdict_same_not_planned"])
      == [["Antelope Valley College", "39295"], ["Las Positas College", "09227"]],
      "09227 and 39295 took their units, still fail, and take no row (the plan writes only what changes a verdict)")
check(not any(c == MARIN for c, _ in keys), "Marin has no row: its run read no page of its own")
for part in ("apply", "preread", "rollback"):
    with open(os.path.join(ROOT, "kb", "migrations", "2026-11-23_s713ge_prreq_ge_steps_%s.sql" % part),
              encoding="utf-8") as fh:
        sql = fh.read()
    check(set(re.findall(r"^\s*\(\d+, '([^']+)', '(\d{5})', \d+,", sql, re.M)) == keys,
          "the %s names exactly the plan's rows" % part)
    if part == "apply":
        check("e(expect) as (values (8))" in sql and "when f.n > 0" in sql
              and "program_record_fp(v.after_record)" in sql, "the apply's count guard and confirm guard")
    if part == "preread":
        check("'confirm_matches_after'" in sql, "the pre-read counts confirms matching the new record")

if failures:
    for x in failures:
        print("FAIL:", x)
    sys.exit(1)
print("%d/%d checks passed: S713 GE steps" % (checks[0], checks[0]))
