#!/usr/bin/env python3
"""UC-CUR → Z-scheme dry-run — allocator verification.

Guards the subtle branches of compute_plan() in kb/_uc_cur_zscheme_dryrun.py
against a tiny synthetic fixture (no file I/O):

  1. canonical_discipline — a disciplined target gets the canonical SUBJ4 of its
     members' MODAL discipline (new-mint convention), NOT the members' raw code.
  2. umbrella exception — a Foreign Languages target keeps the members' split
     code (FLSP), it must NOT collapse to the nominal canonical FLNG; same idea
     for Kinesiology (KINE/ATHL).
  3. band — credit_status drives the band digit (noncredit → 9, credit → 1);
     a target's members are band-pure and that band lands in the Z-id.
  4. seq — within a (SUBJ4, band) cohort, seq is assigned by normalized-title
     sort, deterministically (Z…001 = the title that sorts first).
  5. mixed-subject modal — a cross-subject title-lane merge picks the modal
     member discipline.
  6. gates — every validation gate passes on the fixture; Z-ids are unique,
     4-letter, collision-free, and the alias is invertible (rollback handle).
  7. resolver self-test (methodology-alias-map rule 7) — {old→new} resolves
     one step; no two olds map to one new.

Not wired into `npm test` (the JS runner only discovers *.test.js). Run from the
repo root:

    python3 tests/uc_cur_zscheme_dryrun_test.py
"""
import importlib.util
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location(
    "zdry", os.path.join(ROOT, "kb", "_uc_cur_zscheme_dryrun.py"))
zdry = importlib.util.module_from_spec(spec)
spec.loader.exec_module(zdry)

failures = []


def check(label, cond):
    if cond:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}")
        failures.append(label)


# ── synthetic fixture ──────────────────────────────────────────────────────
# member id -> identity record (mirrors coci_minted_courses.json shape)
member_idx = {
    # Art target: raw code ARCE, discipline Art → canonical ARTS
    "ARCE M1001": {"s4": "ARCE", "disc": "Art", "cs": "Credit Course"},
    "ARTS M1002": {"s4": "ARTS", "disc": "Art", "cs": "Credit Course"},
    # Foreign Languages (umbrella) — keep FLSP, do NOT collapse to FLNG
    "FLSP M1003": {"s4": "FLSP", "disc": "Foreign Languages", "cs": "Credit Course"},
    "FLSP M1004": {"s4": "FLSP", "disc": "Foreign Languages", "cs": "Credit Course"},
    # Noncredit ESL target → band 9, canonical ESOL (credit_status vocab is
    # Credit / Noncredit / Noncredit Enhanced — §9, NOT the raw CreditType)
    "ESL M9001": {"s4": "ESL",  "disc": "English as a Second Language",
                  "cs": "Noncredit"},
    "ESOL M9002": {"s4": "ESOL", "disc": "English as a Second Language",
                   "cs": "Noncredit Enhanced"},
    # Two more Art targets to exercise seq ordering within ARTS|1
    "ARTS M1005": {"s4": "ARTS", "disc": "Art", "cs": "Credit Course"},
    "ARTS M1006": {"s4": "ARTS", "disc": "Art", "cs": "Credit Course"},
    # Mixed-subject title-lane merge: modal discipline Aviation → AVIA
    "ATC M1007": {"s4": "ATC",  "disc": "Aviation", "cs": "Credit Course"},
    "AVIA M1008": {"s4": "AVIA", "disc": "Aviation", "cs": "Credit Course"},
    "AVIA M1009": {"s4": "AVIA", "disc": "Aviation", "cs": "Credit Course"},
}

curations = {
    # self-keyed unified_title rows (the UC-CUR targets)
    "UC-CUR-AUTOART1": {"unified_title": "Zebra Art Studio"},          # ARTS, sorts last
    "UC-CUR-AUTOART2": {"unified_title": "Aardvark Drawing"},          # ARTS, sorts first
    "UC-CUR-AUTOFL1":  {"unified_title": "Spanish Conversation"},      # FLSP (umbrella)
    "UC-CUR-AUTOESL1": {"unified_title": "ESL Pronunciation"},         # ESOL band 9
    "UC-CUR-AUTOAVI1": {"unified_title": "Airline Operations"},        # AVIA (mixed subj)
    # merge_into pointers
    "ARCE M1001": {"merge_into": "UC-CUR-AUTOART1"},
    "ARTS M1002": {"merge_into": "UC-CUR-AUTOART1"},
    "ARTS M1005": {"merge_into": "UC-CUR-AUTOART2"},
    "ARTS M1006": {"merge_into": "UC-CUR-AUTOART2"},
    "FLSP M1003": {"merge_into": "UC-CUR-AUTOFL1"},
    "FLSP M1004": {"merge_into": "UC-CUR-AUTOFL1"},
    "ESL M9001":  {"merge_into": "UC-CUR-AUTOESL1"},
    "ESOL M9002": {"merge_into": "UC-CUR-AUTOESL1"},
    "ATC M1007":  {"merge_into": "UC-CUR-AUTOAVI1"},
    "AVIA M1008": {"merge_into": "UC-CUR-AUTOAVI1"},
    "AVIA M1009": {"merge_into": "UC-CUR-AUTOAVI1"},
}

canon_doc = {"disciplines": {
    "Art": {"canonical_subj4": "ARTS"},
    "Foreign Languages": {"canonical_subj4": "FLNG"},   # nominal umbrella canonical
    "Kinesiology": {"canonical_subj4": "KINE"},
    "English as a Second Language": {"canonical_subj4": "ESOL"},
    "Aviation": {"canonical_subj4": "AVIA"},
}}

all_existing = set(member_idx)  # the member ids already exist in the catalog

plan = zdry.compute_plan(curations, member_idx, all_existing, canon_doc)
alias = plan["alias_map"]


def new_id(old):
    return alias.get(old, {}).get("new_id")


# 1. canonical_discipline: ARCE member's discipline Art → ARTS (not ARCE)
check("disciplined target → canonical SUBJ4 of modal discipline (ARTS not ARCE)",
      new_id("UC-CUR-AUTOART1").startswith("ARTS Z1"))
check("  ...subj4_source recorded as canonical_discipline",
      alias["UC-CUR-AUTOART1"]["subj4_source"] == "canonical_discipline")

# 2. umbrella exception: FL keeps FLSP, NOT FLNG
check("umbrella (Foreign Languages) keeps member split code FLSP, NOT FLNG",
      new_id("UC-CUR-AUTOFL1").startswith("FLSP Z1"))
check("  ...subj4_source recorded as umbrella_member_s4",
      alias["UC-CUR-AUTOFL1"]["subj4_source"] == "umbrella_member_s4")

# 3. band: noncredit ESL → band 9; credit Art → band 1
check("noncredit members → band 9 (ESOL Z9…)", new_id("UC-CUR-AUTOESL1") == "ESOL Z9001"
      or new_id("UC-CUR-AUTOESL1").startswith("ESOL Z9"))
check("credit members → band 1 (ARTS Z1…)", "Z1" in new_id("UC-CUR-AUTOART1"))

# 4. seq: within ARTS|1, "Aardvark…" sorts before "Zebra…"
check("seq is title-sorted within cohort (Aardvark Z1001 < Zebra Z1002)",
      alias["UC-CUR-AUTOART2"]["seq"] < alias["UC-CUR-AUTOART1"]["seq"])

# 5. mixed-subject modal: ATC+AVIA, modal discipline Aviation → AVIA
check("mixed-subject title merge → modal discipline canonical (AVIA)",
      new_id("UC-CUR-AUTOAVI1").startswith("AVIA Z1"))

# 6. gates: all validation passes; ids unique/4-letter/disjoint; invertible
check("all validation gates pass on fixture",
      all(v["pass"] for v in plan["validation"].values()))
zids = [a["new_id"] for a in alias.values()]
check("every Z-id is exactly 4-letter SUBJ + Z + band + 3 digits",
      all(re.fullmatch(r"[A-Z]{4} Z\d{4}", z) for z in zids))
check("Z-ids unique", len(zids) == len(set(zids)))
check("Z-ids disjoint from existing member ids", not (set(zids) & all_existing))

# 7. resolver self-test (methodology rule 7): one-step, injective
check("alias is injective (no two olds → one new) — rollback handle intact",
      len(set(zids)) == len(alias))
check("zseq_seed high-water == cohort size for ARTS|1 (=2)",
      plan["zseq_seed"].get("ARTS|1") == 2)

if failures:
    print(f"\n{len(failures)} FAILURE(S): {failures}")
    sys.exit(1)
print(f"\nAll {12} checks passed.")
