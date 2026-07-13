#!/usr/bin/env python3
"""Unit tests for the subject_discipline_outlier audit rule (kb/_row_audit.py).

Guards the detector Sam's HVAC M10FR catch motivated: a minted M-ID whose
assigned discipline is a small minority of its LOCAL SUBJECT CODE cohort, with
the TOP code OR the curated subject→discipline lexicon corroborating the SAME
correction the cohort implies. Two independent signals must agree on the target
(the bar that separates a real mis-mint from an ambiguous-subject-code false
positive like OT = Office Technologies vs Occupational Therapy).

Run: python3 tests/row_audit_subject_outlier_test.py   (exit 0 = all pass)
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

# A DIESLTK/Diesel-dominant cohort (9 Diesel + 1 HVAC outlier = 10%, mirroring
# the real HVAC M10FR case of 3/29). The outlier must be ≤15% of the cohort.
DIST = {"DIESLTK": ra.Counter({"Diesel Mechanics": 9, "Air Conditioning, Refrigeration, Heating": 1})}
TOP = {"0947.00": "Diesel Mechanics", "0946.00": "Air Conditioning, Refrigeration, Heating"}
LEX = {"DIESLTK": "Diesel Mechanics"}

def rec(subject="DIESLTK", top="0947.00"):
    return {"subject": subject, "top_code": top}

# (1) Fires on the HVAC-in-Diesel-cohort outlier, TOP corroborates → Diesel.
check("fires: HVAC outlier in Diesel cohort, TOP agrees",
      ra._classify_subject_discipline_outlier(
          rec(), "Air Conditioning, Refrigeration, Heating", DIST, TOP, {}) == "Diesel Mechanics")

# (2) Fires via the lexicon alone (no usable TOP).
check("fires: corroborated by lexicon when TOP is blank",
      ra._classify_subject_discipline_outlier(
          rec(top=None), "Air Conditioning, Refrigeration, Heating", DIST, {}, LEX) == "Diesel Mechanics")

# (3) No fire: corroboration must AGREE with the cohort modal, not merely
#     disagree with the assigned discipline (the false-positive guard).
check("no fire: TOP disagrees with assigned but not the modal",
      ra._classify_subject_discipline_outlier(
          rec(top="0946.00"),  # TOP says HVAC = the ASSIGNED disc → no corroboration of Diesel
          "Electricity", DIST, TOP, {}) is None)

# (4) No fire: the assigned discipline IS the cohort modal.
check("no fire: assigned == cohort modal",
      ra._classify_subject_discipline_outlier(
          rec(), "Diesel Mechanics", DIST, TOP, LEX) is None)

# (5) No fire: cohort too small (<4 members).
check("no fire: cohort below the ≥4 floor",
      ra._classify_subject_discipline_outlier(
          rec(subject="TINY"), "Air Conditioning, Refrigeration, Heating",
          {"TINY": ra.Counter({"Diesel Mechanics": 2, "Air Conditioning, Refrigeration, Heating": 1})},
          TOP, LEX) is None)

# (6) No fire: assigned isn't a small-enough minority (dominant sibling <40%
#     / assigned share >15%).
check("no fire: assigned is a large minority (not an outlier)",
      ra._classify_subject_discipline_outlier(
          rec(subject="MIXED"), "Air Conditioning, Refrigeration, Heating",
          {"MIXED": ra.Counter({"Diesel Mechanics": 3, "Air Conditioning, Refrigeration, Heating": 3})},
          TOP, LEX) is None)

# (7) No fire: modal vs assigned are a SISTER_PAIRS synonym (suppressed noise).
sister = next(iter(ra.SISTER_PAIRS))
a, b = tuple(sister)
check("no fire: modal/assigned are a sister pair",
      ra._classify_subject_discipline_outlier(
          rec(subject="SIS", top=None),
          a, {"SIS": ra.Counter({b: 9, a: 1})}, {}, {"SIS": b}) is None)

# (8) _build_subject_disc_dist uses the EFFECTIVE (curated) discipline so a
#     just-corrected row can't skew its own cohort, and keeps only ≥4 cohorts.
courses = {f"DIES M100{i}": {"id_system": "M-ID", "subject": "DIESLTK",
                             "discipline": "Diesel Mechanics"} for i in range(4)}
singletons = {"HVAC M10FR": {"id_system": "M-ID", "subject": "DIESLTK",
                             "discipline": "Air Conditioning, Refrigeration, Heating"}}
curation = {"HVAC M10FR": {"discipline": "Diesel Mechanics"}}  # curator already fixed it
dist = ra._build_subject_disc_dist(courses, singletons, curation)
check("build: effective (curated) discipline counts toward the cohort",
      dist.get("DIESLTK", {}).get("Diesel Mechanics") == 5
      and dist["DIESLTK"].get("Air Conditioning, Refrigeration, Heating") is None)
check("build: sub-4 cohorts are dropped",
      "DIESLTK" in dist and all(sum(c.values()) >= 4 for c in dist.values()))

# (9) The rule + label + penalty are wired into the auditor's public surface.
check("wired: rule in TAG_PENALTY_ON_DISCIPLINE (0.20)",
      ra.TAG_PENALTY_ON_DISCIPLINE.get("subject_discipline_outlier") == 0.20)

failed = 0
for name, ok in results:
    print(("PASS " if ok else "FAIL ") + name)
    if not ok:
        failed += 1
print(f"\n{len(results) - failed}/{len(results)} passed")
sys.exit(1 if failed else 0)
