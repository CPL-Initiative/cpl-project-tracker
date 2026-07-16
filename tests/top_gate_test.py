#!/usr/bin/env python3
"""Unit tests for kb/_top_gate.py — the TOP identity-gating predicate.

Guards the 2026-07-16 "gate identity, keep display" ruling: a discipline
sourced SOLELY from TOP (top_code / top_division) must NOT participate in an
identity decision (the canonical-SUBJ4 vote / fold), while every corroborated
source (curated, subject_map, title_keyword, description) may.
See docs/kb-notes/methodology-top-is-a-last-in-line-signal.md.

Run: python3 tests/top_gate_test.py   (exit 0 = all pass)
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("_top_gate", os.path.join(ROOT, "kb", "_top_gate.py"))
tg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tg)

results = []
def check(name, cond):
    results.append((name, bool(cond)))

def rec(source, discipline="Automotive Technology"):
    return {"discipline": discipline, "discipline_source": source}

# --- TOP-sourced rows are held out of identity ---
check("top_code is_top_sourced", tg.is_top_sourced(rec("top_code")))
check("top_division is_top_sourced", tg.is_top_sourced(rec("top_division")))
check("top_code NOT corroborated", not tg.discipline_is_corroborated(rec("top_code")))
check("top_division NOT corroborated", not tg.discipline_is_corroborated(rec("top_division")))

# --- corroborated sources may participate ---
check("subject_map corroborated", tg.discipline_is_corroborated(rec("subject_map")))
check("title_keyword corroborated", tg.discipline_is_corroborated(rec("title_keyword")))
check("description corroborated", tg.discipline_is_corroborated(rec("description")))
# curated / reviewed rows carry a discipline with no inference source label
check("curated (no source) corroborated", tg.discipline_is_corroborated(rec(None)))
check("subject_map NOT top_sourced", not tg.is_top_sourced(rec("subject_map")))

# --- a blank discipline never participates, regardless of source ---
check("blank discipline NOT corroborated",
      not tg.discipline_is_corroborated({"discipline": "", "discipline_source": "subject_map"}))
check("missing discipline key NOT corroborated",
      not tg.discipline_is_corroborated({"discipline_source": "subject_map"}))

# --- None / empty input is safe ---
check("None rec NOT corroborated", not tg.discipline_is_corroborated(None))
check("None rec NOT top_sourced", not tg.is_top_sourced(None))

passed = sum(1 for _, ok in results if ok)
for name, ok in results:
    print(("  PASS " if ok else "  FAIL ") + name)
print("%d/%d passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
