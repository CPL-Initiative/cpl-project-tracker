#!/usr/bin/env python3
"""Veteran Sprint card — apply_veteran_jst() (Session 88; Vets label 2026-07-01).

The card's "JSTs Uploaded" line used the military-students count as a PROXY for
JSTs. With veteran_jst.json present we put the REAL uploaded JST + a separate
"Veterans (reported)" line + the 75% star rule. Guards:

  1. "JSTs Uploaded" becomes the real MilitaryStudents / 30,000 goal.
  2. "Veterans (reported)" is inserted right after, with EnrolledMilitaryStudents.
  3. The 75% star rule + the statewide ratio land in the card footnote.
  4. Idempotent — a second apply doesn't duplicate the Vets line or footnote.
  5. No-op when veteran_jst is absent (the proxy is retained).
  6. Migration — a card carrying the old "Service Members (MIL)" line is upgraded.

Run from the repo root:

    python3 tests/veteran_sprint_jst_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen

failures = []


def check(label, actual, expected):
    if actual == expected:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}: expected {expected!r}, got {actual!r}")
        failures.append(label)


def base_kpis():
    return {"veteran_sprint": {
        "value": "50", "label": "VETERAN SPRINT", "sub": "Star Colleges", "star": True,
        "breakdowns": [
            {"label": "JSTs Uploaded", "value": "24,875 / 30,000", "note": "uploaded / sprint goal"},
            {"label": "Basic Training Credit", "value": "50 Colleges"},
            {"label": "Eligible CPL", "value": "114,248 Units"},
        ],
    }}


# vets = EnrolledMilitaryStudents; jst = MilitaryStudents (the MAP Dash number).
VJ = {"statewide": {"vets": 34135, "jst": 24885, "star_colleges": 50}}


def _bd(card, label_prefix):
    return next((b for b in card["breakdowns"]
                 if b["label"].lower().startswith(label_prefix)), None)


# ── 1-3: applies the real numbers + the star rule ──
kpis = base_kpis()
gen.apply_veteran_jst(kpis, VJ)
card = kpis["veteran_sprint"]
jst_bd = _bd(card, "jsts uploaded")
vets_bd = _bd(card, "veterans (reported)")
check("JSTs Uploaded shows real JST / goal", jst_bd["value"], "24,885 / 30,000")
check("Veterans (reported) breakdown added", vets_bd is not None, True)
check("Veterans (reported) shows reported vets", vets_bd and vets_bd["value"], "34,135")
# Vets line sits immediately after the JSTs Uploaded line.
labels = [b["label"] for b in card["breakdowns"]]
check("Vets line is right after JSTs Uploaded",
      labels.index("Veterans (reported)"), labels.index("JSTs Uploaded") + 1)
fn = " ".join(card.get("footnote", []))
check("footnote carries the 75% star rule", "&ge;75%" in fn, True)
# round(24885 / 34135 * 100) = 73.
check("footnote carries the statewide ratio (73%)", "(73%)" in fn, True)
check("footnote uses the 'veterans' wording (not 'military students')",
      "military students" in fn, False)
check("card flagged live", card.get("live"), True)

# ── 4: idempotent ──
gen.apply_veteran_jst(kpis, VJ)
card = kpis["veteran_sprint"]
check("Vets line not duplicated on re-apply",
      sum(1 for b in card["breakdowns"] if b["label"] == "Veterans (reported)"), 1)
check("footnote rule not duplicated on re-apply",
      len(card.get("footnote", [])), 1)
check("JSTs Uploaded still the real value", _bd(card, "jsts uploaded")["value"], "24,885 / 30,000")

# ── 5: no-op without data (proxy retained) ──
k2 = base_kpis()
gen.apply_veteran_jst(k2, None)
check("None vj → JSTs Uploaded unchanged (proxy)",
      _bd(k2["veteran_sprint"], "jsts uploaded")["value"], "24,875 / 30,000")
check("None vj → no Veterans line", _bd(k2["veteran_sprint"], "veterans (reported)"), None)
gen.apply_veteran_jst(k2, {"statewide": {"vets": 0, "jst": 0}})
check("empty statewide → no-op", _bd(k2["veteran_sprint"], "veterans (reported)"), None)

# ── 6: migration — an old "Service Members (MIL)" card is upgraded in place ──
k3 = base_kpis()
k3["veteran_sprint"]["breakdowns"].insert(
    1, {"label": "Service Members (MIL)", "value": "34,135", "note": "reported by colleges"})
gen.apply_veteran_jst(k3, VJ)
c3 = k3["veteran_sprint"]
check("migration: old Service Members (MIL) line dropped",
      _bd(c3, "service members"), None)
check("migration: Veterans (reported) line present",
      _bd(c3, "veterans (reported)") is not None, True)

print()
if failures:
    print(f"{len(failures)} FAILED: {failures}")
    sys.exit(1)
print("All veteran-sprint-card checks passed.")
