#!/usr/bin/env python3
"""kb/_held_subject_codes.py on a fixture shaped like the pile mint plan's held list (S695).

WHAT THIS GUARDS (each a way the ranked list would mislead the person deciding codes):
  (1) the held courses summed over the codes equal the held list's length: no course lost, none invented;
  (2) a code's count equals the courses listed under it, and each college's count equals its control numbers;
  (3) no course appears twice, under one code or across codes;
  (4) codes compare in the subject map's key form ("C D" and "CD" are one code) and rank by held courses, descending;
  (5) a vote that missed its floor is a suggestion with its votes and the floor it missed, never a decision, and a
      code of two characters or fewer gets no statewide vote;
  (6) the printed name joins from the Subjects card's file by college and code, and near entries come from the map;
  (7) the builder holds the same invariants on the committed plan's held list (kb/pile_mint_out/*/plan.json) and on
      the committed kb/status/held_subject_codes.json, and two runs write the same bytes.

Run from repo root: python3 tests/held_subject_codes_test.py
"""
import glob
import importlib.util
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location("hsc", os.path.join(ROOT, "kb", "_held_subject_codes.py"))
hsc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hsc)

FAILS = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        FAILS.append(name)


def invariants(doc, n_held, label):
    codes = doc["codes"]
    check(f"(1) {label}: held courses summed over the codes equal the held list ({n_held})",
          sum(c["held"] for c in codes) == n_held == doc["totals"]["held"])
    check(f"(2) {label}: each code's count equals its courses, each college's its control numbers",
          all(c["held"] == sum(len(x["control_numbers"]) for x in c["colleges"]) for c in codes)
          and all(x["held"] == len(x["control_numbers"]) for c in codes for x in c["colleges"]))
    cns = [cn for c in codes for x in c["colleges"] for cn in x["control_numbers"]]
    check(f"(3) {label}: no course twice", len(cns) == len(set(cns)))
    check(f"(4) {label}: ranked by held courses, descending",
          all(codes[i]["held"] >= codes[i + 1]["held"] for i in range(len(codes) - 1)))
    check(f"{label}: pairs and codes add up",
          doc["totals"]["codes"] == len(codes) and doc["totals"]["pairs"] == sum(len(c["colleges"]) for c in codes)
          and doc["totals"]["top_20_release"] == sum(c["held"] for c in codes[:20]))


def row(college, cn, subj, title, why="no route reaches its floor"):
    return {"college": college, "control_number": cn, "subject": subj, "title": title, "why": why}


HELD = [
    row("Alpha College", "C1", "TUTR", "Supervised Tutoring"),
    row("Alpha College", "C2", "TUTR", "Tutoring Theory"),
    row("Beta College", "C3", "TUTR", "Tutoring Practicum"),
    row("Beta College", "C4", "C D", "Child Development Practicum",
        "modal subject 'C D' is a 2-character code and nothing longer in the cluster corroborates it; discipline held for review."),
    row("Beta College", "C5", "CD", "Infant Care Practicum",
        "modal subject 'CD' is a 2-character code and nothing longer in the cluster corroborates it; discipline held for review."),
    row("Gamma College", "C6", "HUSV", "Human Services Practicum"),
]
FLOORS = {"college_subject_code": {"support_min": 50, "share_min": 1.0},
          "statewide_subject_code": {"support_min": 100, "share_min": 1.0}}
COL = {("Beta College", "TUTR"): Counter({"EDUC": 5, "IDST": 1}), ("Gamma College", "HUSV"): Counter({"COUN": 3, "HUSV": 3})}
STATE = {"TUTR": Counter({"EDUC": 7, "IDST": 2}), "HUSV": Counter({"COUN": 34, "HSER": 2})}
DMAP = {"CD": "Child Development", "CDEV": "Child Development", "TUT": "Education", "TUTOR": "Education", "HUS": "Human Services"}
TITLES = {"columns": ["code", "printed_name", "catalog_courses", "state_courses", "side", "common", "discipline"],
          "colleges": [{"college": "Alpha College", "rows": [["TUTR", "Tutoring", 2, 2, "both", None, None]]}]}

doc = hsc.build(HELD, FLOORS, COL, STATE, DMAP, TITLES)
invariants(doc, len(HELD), "fixture")
by = {c["key"]: c for c in doc["codes"]}
check("(4) 'C D' and 'CD' are one code", "CD" in by and by["CD"]["held"] == 2 and by["CD"]["spellings"] == ["C D", "CD"])
check("(4) TUTR ranks first with 3 held courses at 2 colleges",
      doc["codes"][0]["key"] == "TUTR" and doc["codes"][0]["held"] == 3 and doc["codes"][0]["pairs"] == 2)
t = by["TUTR"]
check("(5) the statewide winner is a suggestion with its votes and share",
      t["suggestion"] == {"subj4": "EDUC", "from": "statewide vote", "votes": 9, "share": round(7 / 9, 4)})
check("(5) the statewide vote says which floor it missed",
      t["statewide_vote"]["missed"] == "9 votes under the floor of 100, and a share under 1.00")
beta = [x for x in t["colleges"] if x["college"] == "Beta College"][0]
alpha = [x for x in t["colleges"] if x["college"] == "Alpha College"][0]
check("(5) a college vote under its floor says so", beta["college_vote"]["winner"] == "EDUC"
      and beta["college_vote"]["missed"] == "6 votes under the floor of 50, and a share under 1.00")
check("(5) a college with no identity-holding course under the code says so",
      alpha["college_vote"]["missed"] == "no identity-holding course under this code votes")
check("(5) a two-character code gets no statewide vote", by["CD"]["statewide_vote"]["winner"] is None
      and "two characters" in by["CD"]["statewide_vote"]["missed"] and by["CD"]["suggestion"] is None)
check("(5) a tie at the top is no suggestion", by["HUSV"]["statewide_vote"]["winner"] == "COUN"
      and hsc.vote(COL[("Gamma College", "HUSV")], FLOORS["college_subject_code"])["missed"] == "a tie at the top of the vote")
check("(5) the subject map's note travels with the code", any("2-character" in k for k in by["CD"]["subject_map"]["notes"])
      and by["CD"]["subject_map"]["reads"] == "Child Development")
check("(5) no field names a decided code", all("decided" not in json.dumps(c) and "subj4" not in c for c in doc["codes"]))
check("(6) the printed name joins by college and code", alpha["printed_name"] == "Tutoring" and t["printed_names"] == ["Tutoring"]
      and beta["printed_name"] is None)
check("(6) near entries come from the map, the code itself left out",
      [n["key"] for n in t["near_entries"]] == ["TUT", "TUTOR"] and [n["key"] for n in by["CD"]["near_entries"]] == ["CDEV"])
check("(6) up to five examples, each with its college", len(t["examples"]) == 3 and all(e["college"] for e in t["examples"]))
check("(7) two runs write the same bytes", hsc.dump(doc) == hsc.dump(hsc.build(HELD, FLOORS, COL, STATE, DMAP, TITLES)))

# (7) the committed plan's held list, through the same build (no vote tables: the shape alone)
plans = sorted(glob.glob(os.path.join(ROOT, "kb", "pile_mint_out", "*", "plan.json")))
if plans:
    with open(plans[-1], encoding="utf-8") as f:
        plan = json.load(f)
    held = plan["held"]["no_route_gives_a_subj4"]
    invariants(hsc.build(held, plan["self_recall"]["thresholds"], {}, {}, {}, {}), len(held), "committed plan")
    check("(7) the committed plan's held list matches its own measure",
          len(held) == plan["measures"]["held"]["no_route_gives_a_subj4"])
committed = os.path.join(ROOT, hsc.OUT)
if os.path.exists(committed):
    with open(committed, encoding="utf-8") as f:
        cdoc = json.load(f)
    invariants(cdoc, cdoc["totals"]["held"], "committed file")
    check("(7) the committed file writes no TOP code", "top_code" not in json.dumps(cdoc))

print(f"\n{'FAILED ' + str(len(FAILS)) if FAILS else 'all passed'}")
sys.exit(1 if FAILS else 0)
