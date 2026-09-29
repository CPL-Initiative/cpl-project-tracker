#!/usr/bin/env python3
"""kb/_zband_retire_dryrun.py — the allocator on a synthetic fixture.

Items 20 and 21 of the 2026-09-03 rulings, as rules the planner must keep:

  1. a Z id takes the lowest FREE M number in its (SUBJ4, band) bucket — a
     merged-away member's id is still taken (3,836 of 4,053 Z numbers collide
     with catalog M numbers; keeping the number is not an option)
  2. Z ids in one bucket are placed in Z-sequence order, deterministically
  3. the band digit stays (a noncredit Z9 identity becomes M9)
  4. a legacy anchor with two or more colleges takes digits; one college takes
     letters; the subject is the discipline's canonical code, and an umbrella
     anchor keeps its own language code
  5. a legacy anchor whose title + discipline already name a catalog identity
     is listed as a duplicate, not folded
  6. --after-recode: the recode's alias is applied first, so THEA Z1001 lands
     in THTR's bucket and a legacy Drama anchor takes THTR
  7. C-ID / CCN sequence reservations are skipped in a corroborated bucket
  8. capacity is reported per bucket, tightest first

Run from repo root: python3 tests/zband_retire_dryrun_test.py
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location(
    "zret", os.path.join(ROOT, "kb", "_zband_retire_dryrun.py"))
zret = importlib.util.module_from_spec(spec)
spec.loader.exec_module(zret)

failures = []


def check(label, cond):
    print(("PASS  " if cond else "FAIL  ") + label)
    if not cond:
        failures.append(label)


def rec(title, disc):
    return {"common_title": title, "discipline": disc}


courses = {
    "KINE M1001": rec("Weight Training", "Kinesiology"),
    "KINE M1002": rec("Aerobics", "Kinesiology"),          # merged away below, still taken
    "KINE M1004": rec("Swimming", "Kinesiology"),
    "THEA M1001": rec("Acting I", "Drama/Theater Arts"),
    "BUSI M1001": rec("Computerized Accounting", "Business"),
}
singletons = {
    "BUSI M10AA": rec("Payroll Accounting", "Business"),
}
curations = {
    "KINE Z1001": {"unified_title": "Weight cluster"},
    "KINE Z1002": {"unified_title": "Cardio cluster"},
    "KINE Z9001": {"unified_title": "Noncredit fitness"},
    "KINE M1002": {"merge_into": "KINE Z1001"},
    "KINE M1004": {"merge_into": "KINE Z1002"},
    "THEA Z1001": {"unified_title": "Acting cluster"},
    "THEA M1001": {"merge_into": "THEA Z1001"},
}
identities = {}
common = {
    "M-ID ACCT 100": {"common_title": "Computerized Accounting", "discipline": "Business",
                      "subject": "ACCT", "source_college_count": 1, "typical_units": 3.0},
    "M-ID BUS 120": {"common_title": "Business Law", "discipline": "Business",
                     "subject": "BUS", "source_college_count": 3, "typical_units": 3.0},
    "M-ID SPAN 100": {"common_title": "Spanish I", "discipline": "Foreign Languages",
                      "subject": "SPAN", "source_college_count": 2, "typical_units": 5.0},
    "M-ID THEA 100": {"common_title": "Theater Appreciation", "discipline": "Drama/Theater Arts",
                      "subject": "THEA", "source_college_count": 1, "typical_units": 3.0},
    "ACCT 110": {"common_title": "Financial Accounting", "discipline": "Business", "id_system": "C-ID"},
}
crosswalk = {
    "A :: ACCT 1 :: x": {"course_id": "M-ID ACCT 100"},
    "B :: BUS 18 :: y": {"course_id": "M-ID BUS 120"},
    "C :: BUS 18 :: y": {"course_id": "M-ID BUS 120"},
}
canon_doc = {"disciplines": {"Kinesiology": {"canonical_subj4": "KINE"}, "Business": {"canonical_subj4": "BUSI"},
                             "Drama/Theater Arts": {"canonical_subj4": "THEA"},
                             "Foreign Languages": {"canonical_subj4": "FLNG"}}}
fl_doc = {"languages": {"Spanish": {"subj4": "FLSP"}}, "residual_subj4": "FLNG"}
reservations = {("KINE", "1"): {3}}      # C-ID KIN 103 -> seq 3 reserved in KINE band 1

plan = zret.compute_plan(courses, singletons, curations, identities, common, crosswalk,
                         canon_doc, fl_doc, reservations)
A = plan["alias"]

check("1. a Z id takes the lowest free M number; the merged-away KINE M1002 is still taken",
      A.get("KINE Z1001") == "KINE M1005")
check("2. the next Z in the bucket follows in Z-sequence order", A.get("KINE Z1002") == "KINE M1006")
check("7. the reserved C-ID sequence (003) is skipped, not reused",
      "KINE M1003" not in A.values())
check("3. the band digit stays: KINE Z9001 -> KINE M9001", A.get("KINE Z9001") == "KINE M9001")
check("members are counted for the re-point", plan["moves"]["KINE Z1001"]["members"] == 1
      and plan["counts"]["z_members_repointed"] == 3)
check("4. a one-college legacy anchor takes letters under the canonical code",
      A.get("M-ID ACCT 100") == "BUSI M10AB")            # BUSI M10AA exists
check("4. a three-college legacy anchor takes digits", A.get("M-ID BUS 120") == "BUSI M1002")
check("4. an umbrella anchor keeps its own language code (FL file: FLSP; the anchor's SPAN is not a code yet)",
      A.get("M-ID SPAN 100") == "FLNG M1001")
check("5. the anchor twin of a catalog identity is listed as a duplicate, not folded",
      [d["old_id"] for d in plan["duplicates"]] == ["M-ID ACCT 100"]
      and plan["duplicates"][0]["catalog_twins"] == ["BUSI M1001"])
check("the crosswalk references are counted", plan["counts"]["crosswalk_refs"] == 3)
check("a C-ID anchor in common_courses is not touched", "ACCT 110" not in A)
check("8. capacity is reported tightest first",
      plan["capacity"][0]["bucket"] in ("KINE M1", "BUSI M1", "THEA M1", "KINE M9", "FLNG M1")
      and all(plan["capacity"][i]["free_after"] <= plan["capacity"][i + 1]["free_after"]
              for i in range(len(plan["capacity"]) - 1)))
v = plan["validation"]
check("every gate passes on the fixture", all(x["pass"] for x in v.values()))

# 6. composed with a recode alias map + seed edits
recode_alias = {"THEA Z1001": "THTR Z1001", "THEA M1001": "THTR M1001"}
recode_edits = {"canonical": {"Drama/Theater Arts": {"from": "THEA", "to": "THTR"}},
                "foreign_language_subj4": {"Spanish": {"from": "FLSP", "to": "SPAN"}},
                "umbrella": {"Foreign Languages": {"umbrella_codes": ["SPAN", "FLNG"], "canonical_subj4": "FLNG"}}}
plan2 = zret.compute_plan(courses, singletons, curations, identities, common, crosswalk,
                          canon_doc, fl_doc, reservations, recode_alias, recode_edits)
A2 = plan2["alias"]
check("6. after the recode the Z id is keyed THTR and lands in THTR's bucket (THTR M1001 is taken)",
      "THTR Z1001" in A2 and A2["THTR Z1001"] == "THTR M1002" and "THEA Z1001" not in A2)
check("6. a legacy Drama anchor takes the post-recode canonical THTR", A2.get("M-ID THEA 100") == "THTR M10AA")
check("6. a legacy Spanish anchor takes SPAN once the umbrella carries it", A2.get("M-ID SPAN 100") == "SPAN M1001")
check("6. the plan records that the recode was applied", plan2["recode_applied"] is True)

print(f"\n{len(failures)} failure(s)")
sys.exit(1 if failures else 0)
