#!/usr/bin/env python3
"""Guards for kb/_esl_relevel_dryrun.py — Sam's ESL level bands and the reader.

Sam's ruling (2026-08-24, in session): "For ESL with Levels indicated: 0-2 = Beginning;
3-5 = Intermediate; 6-10 = Advanced", plus "Level 6 ESL can go in Advanced".

Extending the reader from single-digit 1-7 to 0-10 is what makes the ruling expressible,
and it misfires immediately without three guards. Every case below came out of live data:

  1. A LEVEL WORD BEATS A NUMBER — `ESOL M90WL` "Beginning Skills 9" files Advanced on its
     number while its own title says Beginning.
  2. A GRADE RANGE IS NOT A LEVEL — `ESOL M90DB` "ESL Parent Involvement in K-12" reads 12.
  3. ROMAN NUMERALS STOP AT VII — `ESOL M90WH` "Beginning Skills 2 X" reads the trailing X
     as roman 10.

Run:  python3 tests/esl_relevel_bands_test.py
"""
import importlib
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))), "kb"))
R = importlib.import_module("_esl_relevel_dryrun")

FAILURES = []


def check(name, got, want):
    if got != want:
        FAILURES.append(name)
        print(f"  FAIL  {name}: got {got!r}, want {want!r}")
    else:
        print(f"  ok    {name}")


print("1. Sam's bands, at every boundary")
for n, want in ((0, "Beginning"), (1, "Beginning"), (2, "Beginning"),
                (3, "Intermediate"), (4, "Intermediate"), (5, "Intermediate"),
                (6, "Advanced"), (9, "Advanced"), (10, "Advanced")):
    check(f"rung {n} -> {want}", R.band_for(n), want)
check("rung 11 is not a rung", R.band_for(11), None)
check("rung 12 is not a rung", R.band_for(12), None)
check("no number -> no band", R.band_for(None), None)

print("2. rung 5 is Intermediate and rung 6 is Advanced — the whole point of the ruling")
check("Level 5 title", R.classify("Integrated ESL Skills, Level 5")[0], "Intermediate")
check("Level 6 title", R.classify("Integrated ESL Skills, Level 6")[0], "Advanced")

print("3. guard 1 — a level WORD outranks a number")
check("'Beginning Skills 9' stays Beginning",
      R.classify("Beginning Skills 9"), ("Beginning", "word"))
check("'Advanced Low 9' stays Advanced",
      R.classify("Advanced Low 9"), ("Advanced", "word"))
check("'Intermediate High 8' stays Intermediate",
      R.classify("Intermediate High 8"), ("Intermediate", "word"))

print("4. guard 2 — a grade range is not a level")
check("'K-12' yields no rung", R.read_level("ESL Parent Involvement in K-12")[0], None)
check("'K-12' yields no band", R.classify("ESL Parent Involvement in K-12")[0], None)
check("'K-8' yields no rung", R.read_level("Family Literacy K-8")[0], None)
# ⚠️ the guard must not eat a REAL rung that happens to sit beside a grade range
check("a real rung beside a grade range still reads",
      R.read_level("ESL for K-12 Parents Level 3")[0], 3)

print("5. guard 3 — roman numerals stop at VII")
check("'2 X' does not read as roman 10", R.read_level("Beginning Skills 2 X")[0], None)
check("'2 X' keeps its level word", R.classify("Beginning Skills 2 X")[0], "Beginning")
check("roman VII still reads", R.read_level("ESL VII")[0], 7)
check("roman IV still reads", R.read_level("Reading IV")[0], 4)

print("6. the newly-visible rungs the old 1-7 reader could not see")
check("rung 0 reads", R.read_level("English as a Second Language - 0")[0], 0)
check("rung 0 is Beginning", R.classify("English as a Second Language - 0")[0], "Beginning")
check("rung 8 reads", R.read_level("Verb Review 8")[0], 8)
check("rung 8 is Advanced", R.classify("Verb Review 8")[0], "Advanced")

print("7. a course code is not a rung")
check("'ECE-124' yields no rung",
      R.read_level("Reading and Writing Skills for ECE-124")[0], None)
check("'ESL 836' yields no rung", R.read_level("English Pronunciation ESL 836")[0], None)

print("8. bands are contiguous and cover 0-10 exactly once")
seen = [R.band_for(n) for n in range(0, 11)]
check("every rung 0-10 has a band", all(b is not None for b in seen), True)
check("bands appear in ascending order",
      seen, ["Beginning"] * 3 + ["Intermediate"] * 3 + ["Advanced"] * 5)

print("9. the dry-run artifact, if built, honors the ruling")
art = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "kb", "esl_relevel_out", "2026-08-24", "plan.json")
if os.path.exists(art):
    import json
    p = json.load(open(art, encoding="utf-8"))
    check("read-only status", p["_status"].startswith("DRY-RUN"), True)
    ch = {c["id"]: c for c in p["changes"]}
    # Sam's explicit call: Level 6 stays Advanced, so it must NOT be re-leveled
    check("ESOL M1050 (Level 6) is NOT re-leveled", "ESOL M1050" in ch, False)
    # the six Level-5 over-claims must all drop to Intermediate
    for i in ("ESOL M1211", "ESOL M1217", "ESLN M9017",
              "ESOL M1220", "ESOL M1047", "ESOL M10EP"):
        check(f"{i} -> Intermediate", ch.get(i, {}).get("to"), "Intermediate")
    # ⚠️ a purpose carve-out must never be re-banded
    bad = [c["id"] for c in p["changes"]
           if c["from"] not in ("Beginning", "Intermediate", "Advanced")]
    check("no purpose carve-out was re-banded", bad, [])
    check("carve-outs were actually seen (the guard can fire)",
          p["counts"]["purpose_carve_outs_skipped"] > 0, True)
else:
    print("  skip  dry-run artifact not built")

print()
if FAILURES:
    print(f"FAILED {len(FAILURES)} check(s)")
    sys.exit(1)
print("all checks passed")
