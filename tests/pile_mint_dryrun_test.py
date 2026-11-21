#!/usr/bin/env python3
"""Fixture checks for kb/_pile_mint_dryrun.py, the dry-run plan that mints M-IDs for the Needs an M-ID pile.

One check per failure the plan must never produce: an id already minted (in the identity files, on either side of an
alias map, as a curation key or pointer, in the CCN/C-ID reservations) handed out again; a one- or two-character
subject code deciding a discipline alone; a course with no accepted route minted on a guess; a credit and a noncredit
course with one title folded into one record; a topics title or a Strong-match course let into the wave; a would-be
duplicate of an existing M-ID minted instead of held for Assign; a second run writing different bytes; the TOP code
moving any decision.

Run from repo root: python3 tests/pile_mint_dryrun_test.py
"""
import copy
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _pile_mint_dryrun as pm  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


COLLEGES = ["A College", "B College", "C College"]
A, B, C = 0, 1, 2


def row(ci, ctrl, subj, title, credit="C", units=3, top="1701.00: Mathematics, General"):
    return [ci, ctrl, subj, "100", title, units, credit, top, "", "", ""]


def fixture(top="1701.00: Mathematics, General"):
    rows = [
        row(A, "P1", "MATH", "Math Practicum", top=top),
        row(B, "P2", "MATH", "Math Practicum", units=4, top=top),
        row(C, "P3", "MATH", "Math Practicum", credit="N", units=0, top=top),   # noncredit twin of P1/P2
        row(C, "P4", "ES", "Ethnic Practicum", top=top),                        # short code, no college votes
        row(A, "P5", "MATH", "Special Topics in Math", top=top),                # topics: left out
        row(A, "P6", "MATH", "Strong Match Course", top=top),                   # Strong in closest: left out
        row(A, "P7", "MATH", "Calculus Tutoring", top=top),                     # twin of MATH M1001: held for Assign
        row(A, "P8", "ZZZ", "Mystery Practicum", top=top),                      # unmapped, no votes: held
        row(A, "P9", "MATH", "Twice Listed", top=top),
        row(B, "P9", "MATH", "Twice Listed", top=top),                          # one control number, two courses
        row(A, "P10", "MATH", "Re-homed Course", top=top),                      # a CN: row re-homes it
        row(A, "P11", "LRNC", "Learning Lab", top=top),                         # route (ii): college A's LRNC is EDUC
        row(A, "P12", "KIN", "Athletic Training Practicum", top=top),          # umbrella, no split code: held
    ]
    members = {}
    for i in range(60):
        rows.append(row(A, f"H{i}", "LRNC", f"Learning Skills {i}", top=top))
        members[f"EDUC M1{i + 1:03d}"] = [{"c": A, "n": "LRNC 1", "t": "x", "u": 1, "p": top[:7], "cn": f"H{i}"}]
        rows.append(row(A, f"E{i}", "ES", f"Ethnic Course {i}", top=top))
        members[f"ETHS M1{i + 1:03d}"] = [{"c": A, "n": "ES 1", "t": "x", "u": 3, "p": top[:7], "cn": f"E{i}"}]
    canon_doc = {"disciplines": {
        "Mathematics": {"canonical_subj4": "MATH"}, "Ethnic Studies": {"canonical_subj4": "ETHS"},
        "Education": {"canonical_subj4": "EDUC"}, "Nursing": {"canonical_subj4": "NRSR"},
        "Kinesiology": {"canonical_subj4": "KINE", "is_umbrella": True}}}
    L = {"colleges": COLLEGES, "rows": rows}
    return {
        "courses": pm.lookup_courses(L), "members": members, "descs": {"P1": "Short.", "P2": "A longer description."},
        "na": {}, "closest": {"measure": {"levels": [{"key": "strong", "bands": [5, 6]},
                                                     {"key": "possible", "bands": [3, 4]},
                                                     {"key": "none", "bands": [0, 1, 2]}]},
                              "rows": {"P6": [0.93, 5, [["MATH M1001", 0.9, 1, 2, None]]],
                                       "P8": [0.2, 1, [["MATH M1001", 0.3, 0, 2, None]]]}},
        "catalog": {"MATH M1001": {"common_title": "Calculus Tutoring", "credit_status": "Credit"}},
        "singletons": {},
        "curations": {"MATH M1003": {"unified_title": "x"}, "CN:P10": {"merge_into": "MATH M1001"},
                      "X": {"merge_into": "MATH M1005"}},
        "identities": {}, "common": {}, "membership_keys": [], "membership_cns": [], "singleton_cns": [],
        "disc_map": {"MATH": "Mathematics", "ES": "Ethnic Studies", "KIN": "Kinesiology"},
        "canon_map": {"Mathematics": "MATH", "Ethnic Studies": "ETHS", "Education": "EDUC", "Nursing": "NRSR"},
        "canon_doc": canon_doc, "disc_aliases": {},
        "fl_doc": {"languages": {"Spanish": {"subj4": "SPAN", "subjects": ["SPAN"]}}, "residual_subj4": "FLNG"},
        "reservations": {("MATH", "1"): {4}},
        "alias_ids": ["MATH M1002", "MATH M90AA"],
        "provenance": {"fixture": True},
    }


inp = fixture()
plan = pm.compute_plan(copy.deepcopy(inp), "2026-11-21")
rows = {r["control_numbers"][0]: r for r in plan["plan_rows"]}
by_cn = {}
for r in plan["plan_rows"]:
    for cn in r["control_numbers"]:
        by_cn[cn] = r
held = {h["control_number"]: k for k, v in plan["held"].items() for h in v}
left = {h["control_number"]: k for k, v in plan["left_out"].items() for h in v}

# ids already minted are never handed out
cat_id = by_cn["P1"]["id"]
check("a credit catalog id skips the catalog key, alias id, curation key, reservation and pointer (M1001-M1005)",
      cat_id == "MATH M1006")
check("a noncredit stand-alone id skips the alias map's MATH M90AA", by_cn["P3"]["id"] == "MATH M90AB")
check("every planned id is new", not (set(plan["planned"]["courses"]) | set(plan["planned"]["singletons"]))
      & ({"MATH M1001", "MATH M1002", "MATH M1003", "MATH M1005", "MATH M90AA"} | set(inp["members"])))

# credit and noncredit with one title are two records
check("P1 and P2 make one catalog record with a memberships entry",
      by_cn["P1"] is by_cn["P2"] and cat_id in plan["planned"]["memberships"]
      and len(plan["planned"]["memberships"][cat_id]) == 2)
check("the noncredit P3 is its own stand-alone record in band 9",
      by_cn["P3"]["kind"] == "stand-alone" and by_cn["P3"]["id"].startswith("MATH M9"))
check("units never split: P1 (3 units) and P2 (4 units) share the record, and the note names the range",
      "units 3 to 4" in (plan["planned"]["courses"][cat_id]["_notes"] or ""))
check("the description is the longest on file", plan["planned"]["courses"][cat_id]["description"] == "A longer description.")
check("a two-college record is not flagged one_college", plan["planned"]["courses"][cat_id]["one_college"] is False)

# a short subject code alone decides nothing; no accepted route -> held
check("ES alone (statewide votes ETHS, no college votes) is held, never minted", held.get("P4") == "no_route_gives_a_subj4")
check("an unmapped code with no votes is held", held.get("P8") == "no_route_gives_a_subj4")
check("an umbrella code that names no split code is held", held.get("P12") == "no_route_gives_a_subj4")

# route (ii), gated by the self-recall test
t = plan["self_recall"]["thresholds"]["college_subject_code"]
check("route (ii) is accepted only at floors right 98% of the time on the self-recall test",
      t is not None and t["accuracy"] >= 0.98)
check("the same college's LRNC courses give P11 its SUBJ4 (EDUC) and its discipline",
      by_cn["P11"]["id"].startswith("EDUC M1") and by_cn["P11"]["route"] == ["ii"]
      and plan["planned"]["singletons"][by_cn["P11"]["id"]]["discipline"] == "Education"
      and plan["planned"]["singletons"][by_cn["P11"]["id"]]["discipline_source"] == "college_subject_code")
check("route (ii) refuses a floor it cannot meet", pm.choose_thresholds([(5, 1.0, True, True)] * 90
                                                                         + [(5, 1.0, False, True)] * 10) is None)

# the left-outs
check("a topics title stays out of the wave", left.get("P5") == "b_special_or_selected_topics")
check("a Strong-match course stays out of the wave", left.get("P6") == "a_strong_or_possible_match")
check("a control number that names two courses stays out", left.get("P9") == "c_control_number_names_several_courses")
check("a course a CN: row re-homes stays out", left.get("P10") == "d_curation_re_homes_it")

# duplicate of an existing M-ID
check("a twin of MATH M1001 (same title, SUBJ4 and band) is held for Assign with that M-ID",
      held.get("P7") == "duplicate_of_an_existing_m_id_held_for_assign"
      and plan["held_for_assign"][0]["existing"] == ["MATH M1001"])

# validations and determinism
check("every validation passes on the fixture", all(v["pass"] for v in plan["validation"].values()))
again = pm.compute_plan(copy.deepcopy(inp), "2026-11-21")
check("two runs write identical bytes", pm.dump(plan) == pm.dump(again))

# the TOP code moves nothing
nursing = pm.compute_plan(fixture(top="1230.10: Registered Nursing"), "2026-11-21")
check("a TOP code pointing at Nursing changes no byte of the plan", pm.dump(nursing) == pm.dump(plan))
check("the discipline follows the subject map, not the TOP", plan["planned"]["courses"][cat_id]["discipline"] == "Mathematics"
      and plan["planned"]["courses"][cat_id]["top_code"] is None)

# every wave course lands once
check("V1: every wave course lands in one record or one held list", plan["validation"]["V1_every_wave_course_lands_once"]["pass"]
      and plan["measures"]["wave"] == 8)

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
