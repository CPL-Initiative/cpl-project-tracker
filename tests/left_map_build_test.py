#!/usr/bin/env python3
"""kb/_build_left_map.py and kb/_apply_left_map.py: the leftover-title decisions (S678, COBIx's item 2 on #3464).

Guards: Sam's two groups (graded = Credit By Exam + Portfolio Review; cert-based = the other four) and a mixed label;
a noncredit title never an industry title's twin; no address in the committed file; the committed file current; a Move
changes only that raw key's link (no other key, no retires file); a Remove keeps the raw key and its history; a move to
a canonical title not in the reference is refused; the bake leaves a removed title out.

Run from repo root: python3 tests/left_map_build_test.py
"""
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def mod(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, "kb", name + ".py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


B, A = mod("_build_left_map"), mod("_apply_left_map")
results = []


def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


check("graded and cert-based groups", B.group_of({"Credit By Exam", "Portfolio Review"}) == "graded" and B.group_of({"Industry Certification", "Military"}) == "cert"
      and B.group_of({"Credit By Exam", "Industry Certification"}) == "mixed" and B.group_of(set()) == "")
check("a mixed label lists its types", B.label({"Industry Certification", "Credit By Exam"}) == "Credit By Exam and Industry Certification (mixed)"
      and B.label(set()) == "CPL type not recorded")
check("a noncredit title is never an industry title's kind", B.kind("Noncredit for CNA") == "noncredit" and B.kind("Industry Training Evidence for CNA") == "industry")
text = open(os.path.join(ROOT, B.OUT), encoding="utf-8").read()
check("the committed file names no address", chr(64) not in text)
d = json.loads(text)
check("the committed file holds the auditor's 810 titles under 577 canonical titles", d["counts"]["titles"] == 810 and d["counts"]["credentials"] == 577, d["counts"])
check("the committed file is current", json.dumps(B.build(), indent=1, ensure_ascii=False) + "\n" == text)

ut = {"Old A": {"unified_title": "Brakes"}, "Old B": {"unified_title": "Brakes"}, "Live": {"unified_title": "Wheels"}}
rows = [{"course_id": "_LEFT_MAP::Old A", "value": "moved:Wheels", "reviewed_at": "2026-11-17T23:00:00Z"},
        {"course_id": "_LEFT_MAP::Old B", "value": "removed", "reviewed_at": "2026-11-17T23:00:00Z"},
        {"course_id": "_LEFT_MAP::Live", "value": "keep"},
        {"course_id": "_LEFT_MAP::Live", "value": "moved:Nowhere"}]
ch, sk = A.plan(ut, rows, {"Brakes", "Wheels"})
check("a Move and a Remove plan, a Keep changes nothing, an unknown target is refused",
      [c[1] for c in ch] == ["moved", "removed"] and len(sk) == 1 and "not in the reference" in sk[0][1], (ch, sk))
out = A.apply(json.loads(json.dumps(ut)), ch)
check("a Move re-points only that raw key", out["Old A"]["unified_title"] == "Wheels" and out["Old A"]["left_map"]["from"] == "Brakes" and out["Live"] == ut["Live"])
check("a Remove keeps the raw key, its link and its history, marked removed", out["Old B"]["unified_title"] == "Brakes" and out["Old B"]["left_map"]["decision"] == "removed")
check("applying twice changes nothing more", A.plan(out, rows, {"Brakes", "Wheels"})[0] == [])
body = open(os.path.join(ROOT, "kb", "_apply_left_map.py")).read().split('"""', 2)[2]
check("the apply never writes retires or articulations", "retires" not in body and "coci_articulations" not in body)
bake = open(os.path.join(ROOT, "excel_to_dashboard.py")).read()
check("the reference bake leaves a removed title out of its canonical's local titles", '(ent.get("left_map") or {}).get("decision") == "removed"' in bake)

print("\n%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
