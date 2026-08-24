#!/usr/bin/env python3
"""Guards for kb/_build_esl_fold_spotcheck.py — the ESL fold spot-check.

Each case here is a failure mode that would have produced a CONFIDENT WRONG
proposal against live curation data, not a hypothetical:

  1. A prerequisite clause names the rung BELOW the course. Reading "Advisory:
     completion of Intermediate ESL" as an intermediate-level assertion inverts
     the finding on exactly the rows most worth getting right.
  2. "Basic Skills Level:" is a COCI FIELD NAME that appears verbatim inside the
     description blob (Cañada's ESL 836 carries it). Matching `basic` there
     would manufacture a Beginning confirmation out of catalog boilerplate.
  3. Enrichment / Civic / Vocational ESL are PURPOSE carve-outs, not level
     buckets. Re-pointing an Enrichment row at Advanced ESL strips the carve-out
     that put it there. 3 live rows hit this.
  4. Tier A (an explicit band phrase) must beat tier B (a strand adjective like
     "advanced writing", which can describe the topic rather than the cohort).
  5. A tie between two bands is a CONFLICT for a human, never a coin flip.

Run:  python3 tests/esl_fold_spotcheck_test.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))), "kb"))

import importlib

W = importlib.import_module("_build_esl_fold_spotcheck")

FAILURES = []


def check(name, got, want):
    if got != want:
        FAILURES.append(f"{name}: got {got!r}, want {want!r}")
        print(f"  FAIL  {name}: got {got!r}, want {want!r}")
    else:
        print(f"  ok    {name}")


def band_of(desc):
    """The tier-A band a single description asserts (None if it asserts none)."""
    return W.majority(W.assess(desc)["a"])


print("1. a prerequisite names the rung BELOW — never this course's level")
check("advisory naming Intermediate is not an Intermediate assertion",
      band_of("Advisory: completion of Intermediate ESL or equivalent. "
              "Students practice reading strategies."), None)
check("prerequisite naming Advanced is not an Advanced assertion",
      band_of("Prerequisite: Advanced ESL placement. Course covers grammar."),
      None)
check("the level is still reported as prerequisite evidence",
      W.assess("Advisory: completion of Intermediate ESL.")["prereq"],
      ["Intermediate"])
check("a body assertion still lands when a prerequisite is also present",
      band_of("Prerequisite: none. This course is for advanced ESL students."),
      "Advanced")

print("2. 'Basic Skills Level:' is catalog boilerplate, not a level claim")
# ⚠️ On today's corpus only 2 descriptions carry this field and both read
#    "Open Curriculum", which matches no pattern — so a test written against
#    the live value CANNOT FAIL and would guard nothing. The case below uses a
#    band-valued field value, which is what the strip actually exists to stop;
#    it fails the moment the strip is removed. Verified by perturbation.
check("a band-valued boilerplate field is not a level assertion",
      band_of("ENGLISH PRONUNCIATION Units 2; Basic Skills Level: Beginning "
              "ESL; Prerequisite(s): None."), None)
check("a real 'basic' assertion elsewhere still lands",
      band_of("Basic Skills Level: Open Curriculum. This is a very basic course "
              "for low-beginning non-native English speakers."), "Beginning")

print("3. tier A outranks tier B; tier B alone is only 'weak-contradicts'")
a_only = [("Advanced", "advanced ESL")]
b_only = [("Intermediate", "intermediate writing")]
check("tier A wins over a disagreeing tier B",
      W.categorize(a_only, b_only, []), ("contradicts", "Advanced"))
check("tier B alone is weak", W.categorize([], b_only, []),
      ("weak-contradicts", "Intermediate"))
check("tier A confirming Beginning suppresses a contradicting tier B",
      W.categorize([("Beginning", "beginning ESL")], b_only, []),
      ("confirms", None))

print("4. a tie between two bands is a CONFLICT, never a coin flip")
check("two tier-A bands, one each",
      W.categorize([("Advanced", "x"), ("Intermediate", "y")], [], []),
      ("conflict", None))
check("a clear majority is not a conflict",
      W.categorize([("Advanced", "x"), ("Advanced", "y"),
                    ("Intermediate", "z")], [], []),
      ("contradicts", "Advanced"))

print("5. prerequisite-only and no-signal are distinct outcomes")
check("prereq-only", W.categorize([], [], ["Intermediate"]),
      ("prereq-only", None))
check("no-signal", W.categorize([], [], []), ("no-signal", None))

print("6. PURPOSE buckets are not level buckets")
check("Beginning ESL is a level bucket", "Beginning ESL" in W.LEVEL_BUCKETS, True)
for purpose in ("Enrichment ESL", "Civic ESL", "Vocational ESL",
                "Vocational ESL — Healthcare"):
    check(f"{purpose} is NOT a level bucket", purpose in W.LEVEL_BUCKETS, False)

print("6b. a fold is checked against ITS OWN band, not always Beginning")
check("Advanced evidence CONFIRMS a row already folded to Advanced",
      W.categorize([("Advanced", "advanced ESL")], [], [],
                   current_band="Advanced"), ("confirms", None))
check("Beginning evidence CONTRADICTS a row folded to Advanced",
      W.categorize([("Beginning", "beginning ESL")], [], [],
                   current_band="Advanced"), ("contradicts", "Beginning"))
check("Intermediate evidence CONTRADICTS a row folded to Advanced",
      W.categorize([("Intermediate", "intermediate ESL")], [], [],
                   current_band="Advanced"), ("contradicts", "Intermediate"))
check("bucket->band map covers exactly the level buckets",
      sorted(W.BUCKET_BAND), sorted(W.LEVEL_BUCKETS))

print("7. survivor targets are the three level comprehensives")
check("survivor ids", sorted(W.SURVIVOR.values()),
      ["ESOL M1141", "ESOL M9168", "ESOL M9256"])

print("8. description hygiene")
check("_x000D_ is stripped", "_x000D_" in W.clean_desc("a_x000D_b"), False)
check("double-encoded text is repaired",
      W.clean_desc("CaÃ±ada"), "Cañada")
check("empty description is safe",
      W.assess(""), {"a": [], "b": [], "prereq": []})

print("9. the built artifact, if present, obeys the purpose-bucket rule")
art = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "kb", "esl_fold_spotcheck", "2026-08-24", "worklist.json")
if os.path.exists(art):
    import json
    w = json.load(open(art, encoding="utf-8"))
    bad = [r["id"] for r in w["rows"]
           if r["proposed_target"] and r["bucket"] not in W.LEVEL_BUCKETS]
    check("no proposal targets a row in a purpose bucket", bad, [])
    off = [r["id"] for r in w["rows"]
           if r["proposed_target"]
           and r["proposed_target"] not in W.SURVIVOR.values()]
    check("every proposal targets a known survivor", off, [])
    # ⚠️ the guard must be ABLE to fire — a zero from a list that cannot contain
    #    the thing being counted is not a clean bill of health.
    check("the artifact actually contains purpose-bucket rows to test",
          any(r["bucket"] not in W.LEVEL_BUCKETS for r in w["rows"]), True)
    # a proposal must never restate the band the row already has
    noop = [r["id"] for r in w["rows"]
            if r["proposed_band"] and r["proposed_band"] == r["current_band"]]
    check("no proposal restates the row's current band", noop, [])
    # ⚠️ calibration is keyed on signal AND confidence — `combo` carries both,
    #    so a signal-only key would mislabel the lane.
    check("calibration keys carry a confidence",
          all("/" in k for k in w["signal_calibration"]), True)
    check("calibration covers more than one confidence for combo",
          len([k for k in w["signal_calibration"] if k.startswith("combo/")]), 2)
    # the directional split must account for EVERY numeric proposal — a
    # direction tally that silently drops rows would understate the diagnosis
    d = w["numeric_ladder_direction"]
    check("direction keys are the two known directions", sorted(d),
          ["doctrine_over_claimed", "doctrine_under_claimed"])
    check("direction tally covers every numeric proposal",
          sum(d.values()),
          len([r for r in w["rows"]
               if r["fold_signal"] == "numeric" and r["proposed_band"]]))
else:
    print("  skip  worklist artifact not built")

print()
if FAILURES:
    print(f"FAILED {len(FAILURES)} check(s)")
    sys.exit(1)
print("all checks passed")
