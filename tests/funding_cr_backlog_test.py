#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CR backlog / disposition rate — generator-side verification.

Guards funding/_build_cr_backlog.py. The failure modes pinned here are the ones
that would quietly turn a fair measure into an unfair one:

  1. NOT APPLICABLE COUNTS AS WORK DONE. The disposition rate exists because
     "applied credits" alone punishes a college that reviewed every credit
     recommendation and correctly ruled most of them out — the right answer for
     an Orienteering hour that does not fit the student's education plan. Real
     data makes the stakes concrete: Cabrillo carries 844 Not Applicable against
     320 Applied, so an applied-only metric scores it 9% instead of 34% and
     drops it ~40 places. Anyone "simplifying" the rate to applied/total
     reintroduces exactly the objection a college would rightly raise.

  2. 'CREDIT IS NOT RECOMMENDED' IS CARVED OUT OF BOTH THE RATE AND THE BACKLOG.
     ACE states outright that no credit is available for these, so no college
     can ever act on one. Counting them inflates every backlog and depresses
     every rate. They are reported separately (not silently dropped) because the
     count is itself a finding and a free win.

  3. SMALL CELLS SUPPRESS, BUT THE RATE STILL COMPUTES. The rate is derived from
     the unsuppressed totals, never rebuilt from the hidden per-disposition
     cells — a summary must share the unit of its detail.

  4. NO STUDENT GRAIN REACHES THE ARTIFACT. The source is per-student; the
     output is institutional aggregates only.

  5. ABSENT INPUT NEVER BLANKS THE ARTIFACT (the standing daily-run contract).

Run:  python3 tests/funding_cr_backlog_test.py
"""
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
BUILDER = os.path.join(ROOT, "funding", "_build_cr_backlog.py")

COLLEGE = "Bakersfield College"        # resolves to funding name "Bakersfield"
FUNDING_NAME = "Bakersfield"

failures = []
checks = [0]


def check(label, cond, detail=""):
    checks[0] += 1
    if cond:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}" + (f"  — {detail}" if detail else ""))
        failures.append(label)


def row(status, cr="1 hour in First Aid", credits=1.0, review=0.0, exhibit="AR-2201-0399",
        college=COLLEGE):
    return {"Location": college, "CPLStatusPlan": status, "Credit Recommendation": cr,
            "ExhibitID": exhibit, "PotentialCredits": credits, "CreditsInReview": review,
            "AppliedCredits": 0.0, "TranscribedCredits": 0.0,
            # Student-grain fields the artifact must never echo:
            "StudentMAPID": 60581, "Last Name": "XXXXXXXXXX", "Program": "Dental Assisting",
            "Catalog Year": "2024-2025"}


def build(rows):
    with tempfile.TemporaryDirectory() as td:
        src = os.path.join(td, "detail.json")
        out = os.path.join(td, "out.js")
        with open(src, "w", encoding="utf-8") as f:
            json.dump(rows, f)
        p = subprocess.run([sys.executable, BUILDER, src, "--out", out],
                           capture_output=True, text=True, cwd=td)
        if p.returncode != 0:
            raise AssertionError(f"builder exited {p.returncode}\n{p.stderr}")
        text = open(out, encoding="utf-8").read()
    return json.loads(text[text.index("{"):text.rindex("};") + 1])


def main():
    print("── CR backlog / disposition rate ──")

    # 10 applied · 10 N/A · 5 in process · 25 needs action  → acted 25 of 50 = 50%
    # An applied-only metric would read 20%. That gap IS the fairness fix.
    rows = ([row("Applied to CPL Plan")] * 10 + [row("Not Applicable")] * 10 +
            [row("In Process")] * 5 + [row("Needs Action")] * 25)
    # ...plus unarticulable rows that must not touch either figure.
    rows += [row("Needs Action", cr="0 hours in Credit Is Not Recommended", credits=0.0)] * 12
    p = build(rows)
    c = (p.get("colleges") or {}).get(FUNDING_NAME)
    check("college resolves and carries a record", isinstance(c, dict), f"got {c!r}")
    if not c:
        print(f"\n{checks[0] - len(failures)}/{checks[0]} passed"); sys.exit(1)

    check("Not Applicable and In Process count as WORK DONE, not as backlog",
          c["acted"] == 25 and c["disposition_rate"] == 0.5,
          f"acted={c['acted']} rate={c['disposition_rate']}")
    check("...and the rate is NOT the applied-only ratio (which would read 0.20)",
          abs(c["disposition_rate"] - 0.20) > 1e-9)
    check("'Credit Is Not Recommended' is carved out of the RATE denominator",
          c["total"] == 50, f"total={c['total']} (12 unarticulable rows must be excluded)")
    check("...and out of the BACKLOG", c["backlog"] == 25, f"backlog={c['backlog']}")
    check("...but is REPORTED, not silently dropped",
          c["not_recommended_carved"] == 12, f"got {c.get('not_recommended_carved')!r}")
    check("statewide carries the carve-out too",
          p["statewide"]["not_recommended_carved"] == 12)
    check("backlog credits sum only the actionable rows",
          abs(c["backlog_credits"] - 25.0) < 1e-6, f"got {c['backlog_credits']}")

    # in-review rows are counted — a college whose articulations are sitting in
    # the faculty approval queue is mid-process, not idle
    p2 = build([row("Needs Action", review=3.0)] * 6 + [row("Applied to CPL Plan")] * 6)
    check("rows with credits in review are counted separately",
          p2["colleges"][FUNDING_NAME]["in_review_rows"] == 6,
          f"got {p2['colleges'][FUNDING_NAME].get('in_review_rows')!r}")

    # <5 suppression, with the rate still derived from the unsuppressed totals
    p3 = build([row("Applied to CPL Plan")] * 2 + [row("Needs Action")] * 8)
    c3 = p3["colleges"][FUNDING_NAME]
    check("a 2-row disposition cell suppresses to null + _suppressed",
          c3["Applied to CPL Plan"] is None and c3.get("Applied to CPL Plan_suppressed") is True,
          f"got {c3!r}")
    check("...but the rate still computes from the unsuppressed totals "
          "(a summary must share the unit of its detail)",
          c3["disposition_rate"] == 0.2 and c3["total"] == 10,
          f"rate={c3['disposition_rate']} total={c3['total']}")

    # no student grain anywhere in the artifact
    blob = json.dumps(p3)
    leaked = [k for k in ("StudentMAPID", "Last Name", "First Name", "StudentID",
                          "Catalog Year", "Program") if k in blob]
    check("no student-grain field reaches the artifact", not leaked, f"leaked {leaked}")
    check("no masked-name payload leaks either", "XXXXXXXXXX" not in blob)

    # absent input must not blank an existing artifact
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, "keep.js")
        with open(out, "w", encoding="utf-8") as f:
            f.write("window.CPL_FUNDING_CR_BACKLOG = {\"sentinel\": true};\n")
        r = subprocess.run([sys.executable, BUILDER, os.path.join(td, "nope.json"),
                            "--out", out], capture_output=True, text=True, cwd=td)
        kept = open(out, encoding="utf-8").read()
    check("absent input exits 0 and leaves the existing artifact untouched",
          r.returncode == 0 and "sentinel" in kept, f"rc={r.returncode}")

    passed = checks[0] - len(failures)
    print(f"\n{passed}/{checks[0]} passed")
    if failures:
        print("FAILED: " + "; ".join(failures))
        sys.exit(1)


if __name__ == "__main__":
    main()
