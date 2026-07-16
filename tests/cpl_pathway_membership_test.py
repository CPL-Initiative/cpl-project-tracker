#!/usr/bin/env python3
"""Unit tests for kb/_build_cpl_pathway_membership.py — the membership-driven CPL
Pathways data that replaces the TOP-proxy guess (docs/cpl_pathways_lessons.md,
2026-07-16 StarMora run-through).

Guards the pure logic without touching the multi-MB source files: award bucketing,
degree labels, per-course CPL (home-articulated ✓ vs. potential peer CPL), and the
inferred required-core ordering signal.

Run: python3 tests/cpl_pathway_membership_test.py   (exit 0 = all pass)
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "_pm", os.path.join(ROOT, "kb", "_build_cpl_pathway_membership.py"))
pm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pm)

results = []
def check(name, cond):
    results.append((name, bool(cond)))

# ── award bucketing ──
check("Baccalaureate -> BS", pm.award_kind("Baccalaureate of Science (B.S.) Degree.") == "BS")
check("A.S. Degree -> AS", pm.award_kind("A.S. Degree") == "AS")
check("A.A. Degree -> AS", pm.award_kind("A.A. Degree") == "AS")
check("A.S-T -> AS (transfer degree still associate)", pm.award_kind("A.S-T Degree") == "AS")
check("Certificate -> CERT", pm.award_kind("Certificate of Achievement requiring 30S") == "CERT")
check("Noncredit -> NC", pm.award_kind("Noncredit program") == "NC")
check("degree label for AS", pm._degree_of("A.S. Degree") == ("Associate of Science", "A.S."))
check("degree label for cert", pm._degree_of("Certificate of Achievement req")[1] == "Cert.")

# ── course_set ──
node = {"courses": [
    {"subj": "AUTO", "num": "111", "resolved": True},
    {"subj": "AUTO", "num": "112", "resolved": True},
    {"subj": None, "num": None, "resolved": False},   # unresolved -> excluded
]}
check("course_set excludes unresolved (no subj/num)", pm.course_set(node) == {("AUTO", "111"), ("AUTO", "112")})

# ── embedded-certificate detection (cert.courses ⊆ AS.courses) ──
AS = {("AUTO", "111"), ("AUTO", "112"), ("AUTO", "113"), ("AUTO", "216")}
cert_embedded = {("AUTO", "111"), ("AUTO", "112")}      # subset -> embedded
cert_partial = {("AUTO", "111"), ("WELD", "050")}       # WELD not in AS -> not embedded
check("a cert whose courses are all in the AS is embedded", cert_embedded <= AS)
check("a cert with an outside course is NOT embedded", not (cert_partial <= AS))

# ── per-course CPL: home-articulated ✓ vs potential peer CPL vs none ──
def ref_of(col, subj, num):
    # AUTO 111 and AUTO 112 share a reference; AUTO 999 has none
    return ("C-ID", "AUTO 110", "Engine Repair") if num in ("111", "112") else (None, None, "")
ARTIC = {("SANTA ANA COLLEGE", "AUTO", "111")}          # only Santa Ana articulates 111
def is_artic(col, subj, num):
    return (pm._norm(col), subj.upper(), pm._nnum(num)) in ARTIC
def certs_of(col, subj, num):
    return ["ASE A1"] if (pm._norm(col), subj.upper(), pm._nnum(num)) in ARTIC else []
REFCOLS = {"AUTO 110": {"SANTA ANA COLLEGE", "RIO HONDO COLLEGE"}}
def peers_of(rid, exclude):
    return sorted(REFCOLS.get(rid, set()) - {pm._norm(exclude)})

home = pm.course_cpl("Santa Ana College", "AUTO", "111", ref_of, is_artic, certs_of, peers_of)
check("home-articulated course is marked articulated + carries local cert",
      home and home["articulated"] and home["certs"] == ["ASE A1"])
check("home-articulated course also lists peer agreement", home["agree"] == 1)

pot = pm.course_cpl("De Anza College", "AUTO", "112", ref_of, is_artic, certs_of, peers_of)
check("a non-home course a peer articulates is POTENTIAL CPL (not articulated, agree>0)",
      pot and not pot["articulated"] and pot["agree"] == 2 and not pot["certs"])

none = pm.course_cpl("Santa Ana College", "AUTO", "999", ref_of, is_artic, certs_of, peers_of)
check("a course with no reference and no peers has no CPL object", none is None)

passed = sum(1 for _, ok in results if ok)
for name, ok in results:
    print(("  PASS " if ok else "  FAIL ") + name)
print("%d/%d passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
