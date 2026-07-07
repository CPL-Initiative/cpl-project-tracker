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

# ── v2 STAGED lanes (Session 103) ────────────────────────────────────────────
print("staged lanes:")
rec = P.stage_journeyman("Journeyman Certificate- Apprenticeship Carpentry, Insulator, AS")
check("journeyman: award suffix stripped, Sam's family shape",
      rec["title"], "Journeyman Certificate- Apprenticeship Carpentry, Insulator")
check("journeyman: Southwest JATC issuer (DIR DAS occ 2180)",
      rec["issuer"], P.ISSUER_SW_JATC)
rec = P.stage_journeyman(
    "Journeyman Certificate-Apprenticeship Carpentry, Drywall/Lather (Interior Systems), AS (Active from Summer 2025)")
check("journeyman: no-space variant + active-note normalize to the family",
      rec["title"], "Journeyman Certificate- Apprenticeship Carpentry, Drywall/Lather (Interior Systems)")
check("journeyman: non-matching raw ignored", P.stage_journeyman("Carpentry Apprenticeship"), None)

rec = P.stage_carpenters_trade("Cabinetmaker Apprenticeship")
check("carpenters: house 'Carpenters Apprenticeship — <trade>' shape",
      rec["title"], "Carpenters Apprenticeship — Cabinetmaker")
check("carpenters: CTCNC issuer (Cabrillo = Northern CA)", rec["issuer"], P.ISSUER_CTCNC)
check("carpenters: non-carpenters trade NOT claimed",
      P.stage_carpenters_trade("Commercial Electrical Apprenticeship"), None)

rec = P.stage_ironworker("Reinforcing Apprenticeship 416: Period 3")
check("ironworker: house shape, PERIOD kept (Rule 8b analog)",
      rec["title"], "Ironworker Apprenticeship — Reinforcing, Period 3")
check("ironworker: issuer left blank (Sam's IW-* precedent)", rec["issuer"], "")

rec = P.stage_nccer("NCCER Commercial Electrician Level 2")
check("nccer: catalog naming kept verbatim", rec["title"], "NCCER Commercial Electrician Level 2")
check("nccer: issuer 'NCCER' (Sam's house family precedent)", rec["issuer"], P.ISSUER_NCCER)

fams = {P.normalize_key("Automotive Fuel Injection"): "Automotive Fuel Injection"}
rec = P.stage_cx("Credit by Exam MATH 021 Precalculus Algebra")
check("cx: mechanism + code stripped → course content", rec["title"], "Precalculus Algebra")
check("cx: issuer = California Community Colleges (Rule 5c.3)", rec["issuer"], P.ISSUER_CCC)
rec = P.stage_cx("AUTO 60E Automotive Fuel Injection Credit by Exam", fams)
check("cx: trailing-mechanism form + existing-family match",
      (rec["title"], rec["confidence"]), ("Automotive Fuel Injection", 0.85))
rec = P.stage_cx("Credit by ExamSPAN 031 Introduction to Translation and Interpreting")
check("cx: glued 'Credit by ExamSPAN' handled",
      rec["title"], "Introduction to Translation and Interpreting")
check("cx: code-only row NOT invented (residual/judgment single)",
      P.stage_cx("Credit by Exam - WATER 140"), None)
check("cx: non-Cx rows ignored", P.stage_cx("NCCER Welding Level 1"), None)

rec = P.stage_hs("BIOL-424: COLTON HIGH SCHOOL- Anatomy and Physiology (Honors)")
check("hs: school + Honors stripped → course content", rec["title"], "Anatomy and Physiology")
check("hs: issuer = CCC", rec["issuer"], P.ISSUER_CCC)
rec = P.stage_hs("EGTECH-10 SAN BERNARDINO HIGH SCHOOL- PLTW Intro to Engineering Design  IS414H/IS415H")
check("hs: IS-codes + PLTW token stripped", rec["title"], "Intro to Engineering Design")
rec = P.stage_hs("San Gorgonio High School - EGTECH-12: Principles of Engineering")
check("hs: leading-school form handled", rec["title"], "Principles of Engineering")
rec = P.stage_hs("MUSIC 265-2 - Recording Arts Workshop II")
check("hs: dashed sub-number consumed (distinct course preserved)",
      (rec["title"], rec["code"]), ("Recording Arts Workshop II", "MUSIC 265-2"))
check("hs: OSHA rows excluded (different issuer)", P.stage_hs("OSHA 10 and 1 yr Experience"), None)
check("hs: IC- rows excluded", P.stage_hs("IC- Welding Level I"), None)
rec = P.stage_hs("CIS 235 Unified Modeling Language")
check("hs: bare 'Unified' inside a course name is NEVER deleted (separator required)",
      rec["title"], "Unified Modeling Language")
rec = P.stage_hs("ESL 500 High School Equivalency Preparation")
check("hs: 'High School Equivalency' course content survives",
      rec["title"], "High School Equivalency Preparation")
rec = P.stage_cx("San Gorgonio High School - EGTECH-12: Principles of Engineering - Credit by Exam")
check("cx: leading school segment stripped before code extraction",
      rec["title"], "Principles of Engineering")

print("build_stage_plan:")
staged, residual = P.build_stage_plan(
    ["MUSIC 265-1 - Recording Arts Workshop I", "MUSIC 265-2 - Recording Arts Workshop II",
     "CJ-1 Introduction to the Criminal Justice System", "CJ-1: Fontana High - Law Enforcement",
     "NCCER Welding Level 1", "Some Unmatchable Row"],
    {P.normalize_key("Introduction to the Criminal Justice System"):
     "Introduction to the Criminal Justice System"},
    assigned_raws={"NCCER Welding Level 1"})
check("plan: distinct sub-numbered courses never converge",
      (staged["MUSIC 265-1 - Recording Arts Workshop I"]["title"],
       staged["MUSIC 265-2 - Recording Arts Workshop II"]["title"]),
      ("Recording Arts Workshop I", "Recording Arts Workshop II"))
check("plan: same-code variants converge (existing family outranks)",
      staged["CJ-1: Fontana High - Law Enforcement"]["title"],
      "Introduction to the Criminal Justice System")
check("plan: converged row confidence capped for review",
      staged["CJ-1: Fontana High - Law Enforcement"]["confidence"] <= 0.65, True)
check("plan: assigned raws never staged", "NCCER Welding Level 1" in staged, False)
check("plan: unmatchable rows land in residual", residual, ["Some Unmatchable Row"])
check("plan: STAGE-ONLY invariant — no lane writes to Supabase "
      "(apply_plan untouched by staged lanes)",
      "staged" in P.apply_plan.__code__.co_names, False)

# ── summary ──────────────────────────────────────────────────────────────────
fails = [c for c in CHECKS if not c[1]]
print(f"\n{len(CHECKS)} checks, {len(fails)} failed")
sys.exit(1 if fails else 0)
