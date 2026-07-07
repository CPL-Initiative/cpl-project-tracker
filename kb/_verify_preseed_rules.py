"""
No-network verification harness for kb/_preseed_unclassified.py (the
_verify_cos_sync_lanes.py pattern — committed, run after ANY edit to the
pre-seed rules; every check is a fixture distilled from a real 2026-07-07
queue row or a hazard an earlier session documented).

Run from repo root:  python3 kb/_verify_preseed_rules.py
Exits non-zero on any failure.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _preseed_unclassified as P  # noqa: E402

CHECKS = []


def check(label, got, want):
    ok = got == want
    CHECKS.append((label, ok, got, want))
    print(f"  {'✓' if ok else '✗'} {label}" + ("" if ok else f"\n      got:  {got!r}\n      want: {want!r}"))


# ── cleanup ──────────────────────────────────────────────────────────────────
print("cleanup:")
c, notes, amb = P.cleanup("AP Biology (Score 3-5) (BIOSCI 101)")
check("score-band + local-course parentheticals stripped", c, "AP Biology")
check("local-course strip is receipted", any("local-course" in n for n in notes), True)
check("clean row is not ambiguous", amb, None)

c, _, _ = P.cleanup("AP Exam Art History (Score of 3, 4 or 5)")
check("'Score of 3, 4 or 5' parenthetical stripped", c, "AP Exam Art History")

c, _, _ = P.cleanup("CLEP French Level II (Score of \t59)")
check("tab inside score parenthetical", c, "CLEP French Level II")

c, _, _ = P.cleanup("CLEP English Literature (only if taken before F11)")
check("policy parenthetical stripped", c, "CLEP English Literature")

c, _, _ = P.cleanup("CLEP Spanish Level II (after FA15)")
check("semester policy '(after FA15)' stripped", c, "CLEP Spanish Level II")

c, _, _ = P.cleanup("CLEP French [1] Level II")
check("footnote bracket stripped", c, "CLEP French Level II")

c, _, _ = P.cleanup("CLEP German** Level II")
check("footnote stars stripped", c, "CLEP German Level II")

c, _, _ = P.cleanup("CLEP Analyzing and Interpreting\nLiterature")
check("newline collapsed", c, "CLEP Analyzing and Interpreting Literature")

c, _, _ = P.cleanup("CLEP French Language:\xa0 Level 1")
check("nbsp collapsed", c, "CLEP French Language: Level 1")

_, _, amb = P.cleanup("CLEP French Language (Levels 1 and 2) - Complete both")
check("multi-level parenthetical is AMBIGUOUS", bool(amb), True)

_, _, amb = P.cleanup("CLEP German Language - Complete both levels")
check("'Complete both' rider is AMBIGUOUS", bool(amb), True)

# ── normalize_key ────────────────────────────────────────────────────────────
print("normalize_key:")
check("2D/2-D fold", P.normalize_key("AP Studio Art - 2D Design"),
      P.normalize_key("AP Studio Art 2-D Design"))
check("US == U.S. == United States",
      P.normalize_key("AP U.S. Government and Politics"),
      P.normalize_key("AP United States Government and Politics"))
check("stopwords of/the/to dropped", P.normalize_key("CLEP History, U.S. I"),
      P.normalize_key("CLEP History of the United States I"))
check("intro == introductory == introduction",
      P.normalize_key("CLEP Intro to Sociology"),
      P.normalize_key("CLEP Introductory Sociology"))
check("abbrev periods (Princ. of Macroecon)",
      P.normalize_key("CLEP Princ. of Macroecon"),
      P.normalize_key("CLEP Principles of Macroeconomics"))
check("civ → civilization", P.normalize_key("CLEP Western Civ II"),
      P.normalize_key("CLEP Western Civilization II"))
check("split compound (Micro Economics)",
      P.normalize_key("CLEP Principles of Micro Economics"),
      P.normalize_key("CLEP Principles of Microeconomics"))
check("pre calculus → precalculus", P.normalize_key("CLEP Pre Calculus"),
      P.normalize_key("CLEP Precalculus"))
check("Level 2 == Level II", P.normalize_key("CLEP French Language, Level 2"),
      P.normalize_key("CLEP French Language Level II"))
check("lowercase-LL typo == II", P.normalize_key("CLEP Spanish with Writing ll"),
      P.normalize_key("CLEP Spanish with Writing Level II"))
check("bare trailing level after language (French Language: 2)",
      P.normalize_key("CLEP French Language: 2"),
      P.normalize_key("CLEP French Language Level II"))
check("glued footnote digit (German1 Level II)",
      P.normalize_key("CLEP German1 Level II"),
      P.normalize_key("CLEP German Level II"))
check("word-repeat collapse (Algebra/Algebra-Trigonometry)",
      P.normalize_key("CLEP College Algebra/Algebra-Trigonometry"),
      P.normalize_key("CLEP College Algebra-Trigonometry"))
check("'Exam' token dropped", P.normalize_key("AP Exam Biology"),
      P.normalize_key("AP Biology"))

print("ladder helpers:")
check("_with_language inserts after the language word",
      P._with_language("clep french level ii"), "clep french language level ii")
check("_with_language leaves 'language' titles alone",
      P._with_language("clep french language level ii"), None)
check("_truncate_after_roman drops the era subtitle",
      P._truncate_after_roman("clep western civilization ii 1648 present"),
      "clep western civilization ii")
check("_truncate_after_roman no-op without a subtitle",
      P._truncate_after_roman("clep western civilization ii"), None)

# ── build_plan integration (fixture families + queue) ────────────────────────
print("build_plan:")
weight = {
    "AP Biology": 5,
    "AP English Language and Composition": 4,
    "CLEP Spanish with Writing II": 2,
    "CLEP Spanish with Writing Level II": 2,
    "CLEP French Language Level II": 3,
    "CLEP Western Civilization II": 3,
    "Some Other Credential": 9,  # non-brand — must never be a target
}
queue = [
    "AP Biology (Score 3-5) (BIOSCI 101)",          # exact after cleanup
    "AP English Language (Score 3-5)",              # alias
    "CLEP Spanish with Writing Level II",           # exact → boosts its twin
    "CLEP Spanish with Writing: Level 2",           # key → must follow the boost
    "CLEP French Level II*",                        # with_language ladder
    "CLEP Western Civilization II: 1648 to Present",  # subtitle truncation
    "CLEP French Language (Levels 1 and 2) - Complete both",  # ambiguous
    "CLEP German Level III",                        # no family → no_match
    "Some Other Credential",                        # non-brand → ignored
    "AP Chemistry (Score 3-5)",                     # already assigned → skip
]
plan = P.build_plan(queue, weight, assigned_raws={"AP Chemistry (Score 3-5)"})
by_raw = {r["raw"]: r for r in plan["seeded"]}

check("exact tier", by_raw["AP Biology (Score 3-5) (BIOSCI 101)"]["target"], "AP Biology")
check("alias tier", by_raw["AP English Language (Score 3-5)"]["target"],
      "AP English Language and Composition")
check("twin boost keeps the run consistent",
      by_raw["CLEP Spanish with Writing: Level 2"]["target"],
      "CLEP Spanish with Writing Level II")
check("twin passed over is receipted",
      by_raw["CLEP Spanish with Writing: Level 2"].get("twins_passed_over"),
      ["CLEP Spanish with Writing II"])
check("language-insert ladder", by_raw["CLEP French Level II*"]["target"],
      "CLEP French Language Level II")
check("era-subtitle truncation",
      by_raw["CLEP Western Civilization II: 1648 to Present"]["target"],
      "CLEP Western Civilization II")
check("issuer stamped", by_raw["AP Biology (Score 3-5) (BIOSCI 101)"]["issuer"],
      "College Board")
check("ambiguous reported not seeded", len(plan["ambiguous"]), 1)
check("no-family row lands in no_match",
      [r["raw"] for r in plan["no_match"]], ["CLEP German Level III"])
check("already-assigned skipped",
      [r["raw"] for r in plan["skipped_assigned"]], ["AP Chemistry (Score 3-5)"])
check("non-brand rows never enter the plan",
      any("Some Other" in r.get("raw", "") for k in plan for r in plan[k]), False)
check("NEVER-INVENT: every target is an existing family",
      all(r["target"] in weight for r in plan["seeded"]), True)

# ── summary ──────────────────────────────────────────────────────────────────
fails = [c for c in CHECKS if not c[1]]
print(f"\n{len(CHECKS)} checks, {len(fails)} failed")
sys.exit(1 if fails else 0)
