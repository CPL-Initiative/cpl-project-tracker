#!/usr/bin/env python3
"""Unit tests for TOP-sourced discipline trust scoring in kb/_row_audit.py.

Guards the 2026-07-16 "TOP is a last-in-line signal" doctrine: a discipline
inferred from TOP (discipline_source top_code / top_division) must score
inferred-low (0.60), NOT inferred-high (0.80) — that high tier is reserved for
the curator-anchored subject_map. TOP is faculty-entered with no data-entry
gatekeeper, so it must never earn the same trust as the subject code.
See docs/kb-notes/methodology-top-is-a-last-in-line-signal.md.

Run: python3 tests/row_audit_top_source_score_test.py   (exit 0 = all pass)
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("_row_audit", os.path.join(ROOT, "kb", "_row_audit.py"))
ra = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ra)

results = []
def check(name, cond):
    results.append((name, bool(cond)))

def rec(source):
    return {"discipline": "Automotive Technology", "discipline_source": source,
            "discipline_confidence": 0.5}

# (1) TOP-code-sourced discipline → inferred-low, NOT inferred-high.
c = ra._classify_mid_discipline(rec("top_code"))
check("top_code classifies inferred-low", c["state"] == "inferred-low")
check("top_code is NOT inferred-high", c["state"] != "inferred-high")

# (2) TOP-division-sourced (coarsest) → inferred-low.
check("top_division classifies inferred-low",
      ra._classify_mid_discipline(rec("top_division"))["state"] == "inferred-low")

# (3) subject_map (curator-anchored) KEEPS the high tier — the split we protect.
check("subject_map stays inferred-high",
      ra._classify_mid_discipline(rec("subject_map"))["state"] == "inferred-high")

# (4) The trust score of a TOP-sourced discipline is strictly below subject_map's.
top_score = ra.STATE_SCORE[ra._classify_mid_discipline(rec("top_code"))["state"]]
subj_score = ra.STATE_SCORE[ra._classify_mid_discipline(rec("subject_map"))["state"]]
check("top_code trust score < subject_map trust score", top_score < subj_score)
check("top_code trust score == inferred-low (0.60)", top_score == 0.60)

# (5) title_keyword / description unchanged (still inferred-low).
check("title_keyword stays inferred-low",
      ra._classify_mid_discipline(rec("title_keyword"))["state"] == "inferred-low")

# (6) A blank discipline is still 'missing' (unrelated path intact).
check("blank discipline still missing",
      ra._classify_mid_discipline({"discipline": None})["state"] == "missing")

passed = sum(1 for _, ok in results if ok)
for name, ok in results:
    print(("  PASS " if ok else "  FAIL ") + name)
print("%d/%d passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
