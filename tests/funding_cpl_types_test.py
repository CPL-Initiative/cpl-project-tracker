#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CPL-type split in cpl_funding_performance.js — generator-side verification.

Guards the failure modes of the `cpl_types` breakdown added to
funding/_build_funding_performance.py (2026-08-06). The breakdown exists to
answer two questions the undifferentiated pe/pa/p3 counts cannot:

  * Is a college's CPL practice still ONLY the military lane? Uploading a JST
    creates the Student CPL Plan and the DD-214/JST Basic Training rows
    auto-apply against an already-articulated exhibit, so a college can post
    applied credit without ever performing the per-CR articulation step that is
    the actual ask.

  * Is a transcribed figure real lifecycle work, or a BATCH? Batch Cx/AP/IB
    uploads arrive already-transcribed by construction (those students are in
    the college SIS and are merely being surfaced in MAP), so an
    undifferentiated transcribed count scores batch loading and real
    counselling identically.

The failure modes pinned here:

  1. NO PER-TYPE UNIT SUMS, EVER. Each source row carries the student's TOTAL
     credit figures, not that type's portion — the builder's own unit_crosscheck
     reads ~1.005 against MAP's published totals, i.e. the extra rows are
     redundant REPEATS, not partitions. A per-type unit sum would therefore
     attribute a student's whole total to every type they carry. This is the
     single most likely "improvement" a future session would add, so the test
     asserts the absence of `*_u` keys inside a type record.

  2. TYPES DO NOT SUM TO THE COLLEGE TOTAL. A student holding two CPL types
     counts once under EACH, by design (they did prior learning of both kinds).
     Anyone reconciling the two and "fixing" the discrepancy would break the
     measure. Asserted explicitly.

  3. OMIT, DON'T ZERO. When the pull lacks `CPL Type Description`, `cpl_types`
     must be ABSENT rather than an empty/zeroed map — the same rule `pa`
     follows. A zeroed breakdown reads as "measured: this college has no
     non-military CPL" on a column we never asked for.

  4. <5 SUPPRESSION applies per (college, type, metric), matching the ratified
     privacy ADR — the type split must not become a way to recover a small cell.

  5. ALL-ZERO TYPES ARE PRUNED. A Potential-Student row registers a type while
     hitting none of pe/pa/p3 (it routes to `pp`), which would otherwise emit an
     empty cell that reads as a measured zero.

Run:  python3 tests/funding_cpl_types_test.py
"""
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
BUILDER = os.path.join(ROOT, "funding", "_build_funding_performance.py")
VIEW = "View_StudentAggregatedValues_APIDataset"

COLLEGE = "Bakersfield College"          # resolves to the funding name "Bakersfield"
FUNDING_NAME = "Bakersfield"

COLUMNS = ["College", "Catalog Year", "Applied Credits", "Eligible Credits",
           "Transcribed Credits", "CPL Type Description",
           "MAP Internal StudentID", "Potential Student", "Test Student"]

failures = []
checks = [0]


def check(label, cond, detail=""):
    checks[0] += 1
    if cond:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}" + (f"  — {detail}" if detail else ""))
        failures.append(label)


def row(sid, ctype, ecr, acr, tcr, potential="", test=""):
    return [COLLEGE, "2025-2026", str(acr), str(ecr), str(tcr), ctype,
            sid, potential, test]


def fixture(with_type_column=True):
    """A synthetic pull exercising every branch of the type split.

    Military      m1..m12  (12) — eligible + applied, nothing transcribed
    Industry      m1,i20..i28 (10) — m1 is DELIBERATELY shared with Military
    Credit by Exam x1..x10 (10) — arrives already transcribed (the batch shape)
    Portfolio     s30,s31  (2) — under the floor of 10, must suppress
    (counts sit at 10/12 because the floor rose 5 -> 10 on 2026-09-03)
    Portal Only   s40      — Potential Student, routes to `pp`, must be pruned
    (test student s50 excluded outright)
    """
    rows = []
    for sid in [f"m{i}" for i in range(1, 13)]:
        rows.append(row(sid, "Military", ecr=30, acr=6, tcr=0))
    for sid in ["m1"] + [f"i{i}" for i in range(20, 29)]:
        rows.append(row(sid, "Industry Certification", ecr=12, acr=3, tcr=0))
    for sid in [f"x{i}" for i in range(1, 11)]:
        rows.append(row(sid, "Credit by Exam", ecr=3, acr=3, tcr=3))
    for sid in ["s30", "s31"]:
        rows.append(row(sid, "Portfolio", ecr=9, acr=9, tcr=0))
    rows.append(row("s40", "Portal Only", ecr=0, acr=0, tcr=3, potential="Yes"))
    rows.append(row("s50", "Military", ecr=99, acr=99, tcr=99, test="Yes"))
    # A repeated row for an existing student+type — must not double-count.
    rows.append(row("m2", "Military", ecr=30, acr=6, tcr=0))

    cols = list(COLUMNS)
    if not with_type_column:
        idx = cols.index("CPL Type Description")
        cols.pop(idx)
        rows = [r[:idx] + r[idx + 1:] for r in rows]
    return [{"viewName": VIEW, "generatedAt": "2026-08-06T00:00:00+00:00",
             "columnName": cols, "columnValue": rows}]


def run_builder(payload_json):
    """Run the builder on a fixture and return the parsed payload."""
    with tempfile.TemporaryDirectory() as td:
        src = os.path.join(td, "CustomReport_latest.json")
        out = os.path.join(td, "out.js")
        with open(src, "w", encoding="utf-8") as f:
            json.dump(payload_json, f)
        proc = subprocess.run([sys.executable, BUILDER, src, "--out", out],
                              capture_output=True, text=True, cwd=td)
        if proc.returncode != 0:
            raise AssertionError(f"builder exited {proc.returncode}\n{proc.stderr}")
        if not os.path.exists(out):
            raise AssertionError(f"builder wrote no artifact\n{proc.stdout}\n{proc.stderr}")
        text = open(out, encoding="utf-8").read()
    return json.loads(text[text.index("{"):text.rindex("};") + 1])


def main():
    print("── CPL-type split (funding performance builder) ──")
    p = run_builder(fixture(with_type_column=True))

    types = (p.get("cpl_types") or {}).get(FUNDING_NAME)
    check("college resolves and carries a cpl_types breakdown",
          isinstance(types, dict) and bool(types),
          f"got {types!r}; cpl_types keys={list((p.get('cpl_types') or {}).keys())}")
    if not types:
        print(f"\n{checks[0] - len(failures)}/{checks[0]} passed")
        sys.exit(1)

    # ── 1. the split itself ────────────────────────────────────────────
    check("Military counts 12 eligible / 12 applied (a repeated row does not double-count)",
          types.get("Military", {}).get("pe") == 12 and types["Military"].get("pa") == 12,
          f"got {types.get('Military')!r}")
    check("Industry Certification counts 10 (the shared student m1 counts here too)",
          types.get("Industry Certification", {}).get("pe") == 10,
          f"got {types.get('Industry Certification')!r}")

    # ── 2. the batch-vs-lifecycle signal (the whole point) ─────────────
    check("Military shows 0 transcribed",
          types.get("Military", {}).get("p3") == 0,
          f"got {types.get('Military')!r}")
    check("Credit by Exam carries ALL 10 transcribed — a batch is separable "
          "from lifecycle work",
          types.get("Credit by Exam", {}).get("p3") == 10
          and p["colleges"][FUNDING_NAME]["p3"] == 10,
          f"type={types.get('Credit by Exam')!r} college_p3="
          f"{p['colleges'][FUNDING_NAME].get('p3')!r}")

    # ── 3. NO per-type unit sums (repeats, not partitions) ─────────────
    stray = sorted({k for rec in types.values() for k in rec if k.endswith("_u")
                    or k.endswith("_u_suppressed")})
    check("no per-type unit sums — rows are repeats, not partitions, so a "
          "per-type unit sum would attribute the whole total to every type",
          not stray, f"found unit keys inside a type record: {stray}")

    # ── 4. types deliberately do NOT sum to the college total ──────────
    # Stated on the two types that share student s1 rather than on the whole
    # college: a suppressed cell elsewhere (Portfolio's 2 students bake as
    # null) would otherwise mask the over-count and make the assertion
    # accidentally pass or fail for the wrong reason.
    #   Military ∪ Industry = m1..m12, i20..i28 = 21 DISTINCT students
    #   Military + Industry =      12 +      10 = 22 counted
    mil_ind = types["Military"]["pe"] + types["Industry Certification"]["pe"]
    check("a two-type student counts under EACH type — Military+Industry (22) "
          "exceeds their 21 distinct students; do not 'reconcile' these",
          mil_ind == 22,
          f"Military+Industry={mil_ind}, expected 22 over 21 distinct students")

    # ── 5. suppression under the floor (10) per (college, type, metric) ─
    portfolio = types.get("Portfolio", {})
    check("a 2-student type suppresses to null + _suppressed",
          portfolio.get("pe") is None and portfolio.get("pe_suppressed") is True,
          f"got {portfolio!r}")

    # ── 5b. COMPLEMENTARY suppression (the subtraction threat) ─────────
    # Portfolio is the ONLY suppressed `pe` cell, so on its own it would be
    # recoverable by subtracting the visible types from the college count. The
    # builder therefore also hides the smallest visible `pe` — here Credit by
    # Exam (10, first alphabetically among the two 10s).
    cx = types.get("Credit by Exam", {})
    check("a lone suppressed cell drags the smallest visible one down with it, "
          "so the hidden count cannot be recovered by subtraction",
          cx.get("pe") is None and cx.get("pe_suppressed") is True,
          f"got Credit by Exam={cx!r}")
    check("complementary suppression is per-metric — p3 had no suppressed cell "
          "to protect, so it stays visible",
          cx.get("p3") == 10, f"got Credit by Exam={cx!r}")

    # ── 6. all-zero types pruned ───────────────────────────────────────
    check("a Potential-Student-only type is pruned, not emitted as a zeroed cell",
          "Portal Only" not in types, f"got {sorted(types)}")

    # ── 7. statewide rollup present and consistent ─────────────────────
    sw = p.get("cpl_types_statewide") or {}
    check("statewide type rollup is emitted",
          sw.get("Military", {}).get("pe") == 12, f"got {sw.get('Military')!r}")

    # ── 8. omit, don't zero, when the column is absent ─────────────────
    p2 = run_builder(fixture(with_type_column=False))
    check("cpl_types is ABSENT (not empty/zeroed) when the pull lacks the column",
          "cpl_types" not in p2 and "cpl_types_statewide" not in p2,
          f"cpl_types={p2.get('cpl_types')!r}")
    check("the undifferentiated counts still build without the type column",
          (p2.get("colleges") or {}).get(FUNDING_NAME, {}).get("pe") == 33,
          f"got {(p2.get('colleges') or {}).get(FUNDING_NAME)!r}")

    passed = checks[0] - len(failures)
    print(f"\n{passed}/{checks[0]} passed")
    if failures:
        print("FAILED: " + "; ".join(failures))
        sys.exit(1)


if __name__ == "__main__":
    main()
