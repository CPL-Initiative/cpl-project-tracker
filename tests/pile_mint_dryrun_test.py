#!/usr/bin/env python3
"""Fixture checks for kb/_pile_mint_dryrun.py (version 2), the dry-run plan that mints M-IDs for the Needs an M-ID pile.

One check per failure the plan must never produce: an id already minted, reserved, or named by a staged plan or a
rollback handed out again; route (i) deciding on a subject code below its measured floor; a shell title minted
without the identity file's convention, minted per local subject, or minted beside the one common course its
convention is; a convention one college holds accepted; titles that differ by punctuation kept apart, or titles a
numeral separates folded; a credit and a noncredit course folded; a topics title or a Strong-match course let into
the wave; a duplicate of an existing M-ID minted instead of held for Assign; a record without the pile_mint source; a
second run writing different bytes; the TOP code moving any decision. Then the readers: kb/_infer_disciplines.py
leaves a pile mint as written (the second reader's finding 2), and kb/_row_audit.py and kb/_ccr_confidence_score.py
read its source as a session mint (finding 3).

Run from repo root: python3 tests/pile_mint_dryrun_test.py
"""
import copy
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
sys.path.insert(0, os.path.join(ROOT, "tests"))
import _pile_mint_dryrun as pm  # noqa: E402
from pile_mint_fixture import fixture  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


inp = fixture()
plan = pm.compute_plan(copy.deepcopy(inp), "2026-11-21")
by_cn = {}
for r in plan["plan_rows"]:
    for cn in r["control_numbers"]:
        by_cn[cn] = r
held = {h["control_number"]: k for k, v in plan["held"].items() for h in v}
held_row = {h["control_number"]: h for v in plan["held"].values() for h in v}
left = {h["control_number"]: k for k, v in plan["left_out"].items() for h in v}
recs = dict(plan["planned"]["courses"], **plan["planned"]["singletons"])

# ── ids already minted, reserved, staged or returned are never handed out ──
cat_id = by_cn["P1"]["id"]
check("a credit catalog id skips the catalog key, alias id, curation key, reservation, pointer and staged id "
      "(M1001-M1006)", cat_id == "MATH M1007")
check("a stand-alone id skips the staged plan's MATH M10AA", by_cn["N2"]["id"] == "MATH M10AB")
check("a noncredit stand-alone id skips the alias map's MATH M90AA", by_cn["P3"]["id"] == "MATH M90AB")
check("a rolled-back id (kb/pile_mint_reserved.json, WEXP M10AA) is never handed out again",
      by_cn["S3"]["id"] == "WEXP M10AB")
check("no planned id equals a staged plan's new_id", not (set(recs) & set(inp["staged_ids"]))
      and plan["validation"]["V8_no_planned_id_a_staged_plan_names"]["pass"])
check("staged_plan_ids reads a new_id nested in an overmerge alias map", (lambda d: (
    os.makedirs(os.path.join(d, "overmerge_out", "2026-05-29")),
    open(os.path.join(d, "overmerge_out", "2026-05-29", "alias_map.json"), "w").write(json.dumps(
        {"aliases": {"AATA M1001": {"splits": [{"new_id": "AATA M10AC"}, {"new_id": "AATA M1002"}]}}})),
    pm.staged_plan_ids(d) == {"AATA M10AC", "AATA M1002"})[-1])(tempfile.mkdtemp()))

# ── route (i) decides only at its per-code floor ──
check("route (i) at its floor: MATH (12 holders, all right) places College Algebra",
      by_cn["P1"]["route"] == ["i"] and recs[cat_id]["pile_mint_route"] == "subject_map")
check("route (i) below its floor holds: BIOL reads half its holders wrong, so Ecology Basics is held",
      held.get("P20") == "route_i_below_its_floor" and held_row["P20"]["holders"] == 20)
check("the floor's measure is filed: MATH is at the floor, BIOL is not",
      plan["route_i_floor"]["subject_codes_at_floor"] == 1)
check("route (i)'s confidence is its measured share on the code", recs[cat_id]["discipline_confidence"] == 1.0)

# ── the shell conventions ──
conv = {(c["kind"], c["band"]): c for c in plan["shell_conventions"]}
check("internship's convention holds at other colleges (WEXP, 12 of 12) and is accepted",
      conv[("internship", "1")]["accepted"] and conv[("internship", "1")]["subj4"] == "WEXP")
check("a shell kind mints ONE common course per (title, band) statewide under its convention, never per local "
      "subject: Internship in Business under BUS and MKT is one WEXP record",
      by_cn["S1"] is by_cn["S2"] and by_cn["S1"]["id"] == "WEXP M1003" and by_cn["S1"]["route"] == ["s"]
      and recs["WEXP M1003"]["discipline"] == "Work Experience Instructors")
check("the record names its shell kind", recs["WEXP M1003"]["pile_mint_shell"] == "internship")
check("a kind with no convention is held and named: Math Practicum",
      held.get("S4") == "shell_title_no_convention" and held_row["S4"]["kind"] == "practicum")
check("a convention one college holds is refused (seminar: 12 courses, one college, right 0 at other colleges)",
      not conv[("seminar$", "1")]["accepted"] and conv[("seminar$", "1")]["colleges"] == 1
      and conv[("seminar$", "1")]["course_grain_right"] == 12 and held.get("S5") == "shell_title_no_convention")
check("a convention that is one common course holds the course for Assign with it (Work Experience, WEXP M1500)",
      held.get("S6") == "convention_is_one_common_course_held_for_assign"
      and held_row["S6"]["assign_to"] == "WEXP M1500")
check("no shell title reaches route (i), (ii) or (iii)", all(
    r["route"] == ["s"] for r in plan["plan_rows"] if r["shell"])
    and plan["validation"]["V9_a_shell_title_mints_only_under_its_convention"]["pass"])

# ── folds ──
check("a punctuation pair folds: Pre-Algebra and Prealgebra are one record", by_cn["F1"] is by_cn["F2"]
      and by_cn["F1"]["kind"] == "catalog")
check("a numeral pair does not fold: Algebra I and Algebra 1 are two records",
      by_cn["N1"] is not by_cn["N2"] and pm.fold_key("Algebra I") != pm.fold_key("Algebra 1"))
check("the plan lists the numeral pair", {"band": "1", "titles": ["Algebra 1", "Algebra I"]}
      in plan["folds"]["wave_numeral_pairs_kept_apart"])
check("a roman level never folds with the next (Practicum I / Practicum II)",
      pm.fold_key("Practicum I") != pm.fold_key("Practicum II")
      and pm.fold_key("Clinical Practicum I") != pm.fold_key("Clinical Practicum 1"))

# ── credit and noncredit, units, the record ──
check("College Algebra at A and B make one catalog record with a memberships entry",
      by_cn["P1"] is by_cn["P2"] and len(plan["planned"]["memberships"][cat_id]) == 2)
check("the noncredit P3 is its own stand-alone record in band 9",
      by_cn["P3"]["kind"] == "stand-alone" and by_cn["P3"]["id"].startswith("MATH M9"))
check("units never split: 3 and 4 units share the record, and the note names the range",
      "units 3 to 4" in (recs[cat_id]["_notes"] or ""))
check("the description is the longest on file", recs[cat_id]["description"] == "A longer description.")
check("every record carries discipline_source pile_mint and its route in a separate field",
      all(r["discipline_source"] == "pile_mint" and r["pile_mint_route"] for r in recs.values()))

# ── route (ii), held, left-outs, Assign ──
check("route (ii): college A's LRNC courses give Learning Lab EDUC", by_cn["P11"]["route"] == ["ii"]
      and recs[by_cn["P11"]["id"]]["discipline"] == "Education")
check("route (ii) refuses a floor it cannot meet", pm.choose_thresholds([(5, 1.0, True, True)] * 90
                                                                         + [(5, 1.0, False, True)] * 10) is None)
check("ES alone (a short code, no college votes) is held", held.get("P4") == "no_route_gives_a_subj4")
check("an unmapped code with no votes is held", held.get("P8") == "no_route_gives_a_subj4")
check("a topics title stays out of the wave", left.get("P5") == "b_special_or_selected_topics")
check("a Strong-match course stays out of the wave", left.get("P6") == "a_strong_or_possible_match")
check("a control number that names two courses stays out", left.get("P9") == "c_control_number_names_several_courses")
check("a course a CN: row re-homes stays out", left.get("P10") == "d_curation_re_homes_it")
check("a twin of MATH M1001 (TRIGONOMETRY folds with Trigonometry) is held for Assign with that M-ID",
      held.get("P7") == "duplicate_of_an_existing_m_id_held_for_assign"
      and plan["held_for_assign"][0]["existing"] == ["MATH M1001"])

# ── validations and determinism ──
check("every validation passes on the fixture", all(v["pass"] for v in plan["validation"].values()))
check("V1: every wave course lands once (18 in the wave)", plan["validation"]["V1_every_wave_course_lands_once"]["pass"]
      and plan["measures"]["wave"] == 18)
again = pm.compute_plan(copy.deepcopy(inp), "2026-11-21")
check("two runs write identical bytes", pm.dump(plan) == pm.dump(again))
nursing = pm.compute_plan(fixture(top="1230.10: Registered Nursing"), "2026-11-21")
check("a TOP code pointing at Nursing changes no byte of the plan", pm.dump(nursing) == pm.dump(plan))
check("the plan carries no TOP code", all(r["top_code"] is None for r in recs.values()))

# ── the Closest M-ID measure (design F) ──
cmz = pm.closest_measure(plan, inp)
check("the Closest measure ranks every held course before and after the planned records join",
      sum(cmz["before"]["tally"].values()) == cmz["held"] == sum(cmz["after"]["tally"].values()))
check("no held course sees a planned shell-title record as its Strong first recommendation",
      cmz["after"]["strong_on_a_shell_title"] == 0)

# ── the readers (findings 2 and 3) ──
spec = importlib.util.spec_from_file_location("_row_audit", os.path.join(ROOT, "kb", "_row_audit.py"))
ra = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ra)
pmrec = recs[cat_id]
st = ra._classify_mid_discipline(pmrec)
check("the auditor scores a pile mint as a session mint, never inferred-high or seed-untouched",
      st["state"] == "session-mint" and st["route"] == "subject_map")
check("a session mint scores below the subject map and the scorer's decisions, above the seed",
      ra.STATE_SCORE["seed-untouched"] < ra.STATE_SCORE["session-mint"] < ra.STATE_SCORE["inferred-high"])
shell_rec = dict(pmrec, common_title="Internship in Business Practice", pile_mint_shell="internship",
                 pile_mint_route="shell_convention", corroboration_members=2)
bag = ra._build_disc_bag({"X M1001": dict(pmrec, corroboration_members=2), "X M1002": shell_rec}, {})
check("the auditor's title bag reads a pile mint's ordinary title and never its shell title",
      "algebra" in bag.get("Mathematics", set()) and "internship" not in bag.get("Work Experience Instructors", set()))
spec = importlib.util.spec_from_file_location("_ccrs", os.path.join(ROOT, "kb", "_ccr_confidence_score.py"))
cs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cs)
check("the confidence scorer takes a pile mint's ordinary title as an anchor card, never its shell title",
      cs.pile_mint_anchor(pmrec) and not cs.pile_mint_anchor(shell_rec))
src = open(os.path.join(ROOT, "kb", "_ccr_confidence_score.py"), encoding="utf-8").read()
check("the scorer never makes a pile mint a trusted card (it sits after the trusted branches)",
      src.index('== "subject_map" and rec.get("discipline")') < src.index("elif pile_mint_anchor(rec):"))
check("the Courses List names the source in words", "pile_mint:" in open(os.path.join(ROOT, "coci_lookup.js"),
                                                                         encoding="utf-8").read())

# kb/_infer_disciplines.py on a fixture tree: a pile mint whose subject the lexicon maps elsewhere, and one it cannot
# map at all, are both left as written; a subject_map fill beside them still re-derives (the failing case was 485 of
# 572 blanked and 18 rewritten).
tree = tempfile.mkdtemp()
try:
    os.makedirs(os.path.join(tree, "reference"))
    shutil.copyfile(os.path.join(ROOT, "kb", "discipline_inference.json"), os.path.join(tree, "discipline_inference.json"))
    shutil.copyfile(os.path.join(ROOT, "kb", "reference", "mq_disciplines.json"),
                    os.path.join(tree, "reference", "mq_disciplines.json"))
    lex = json.load(open(os.path.join(tree, "discipline_inference.json")))
    mapped = next(k for k, v in lex["subject_map"].items() if isinstance(v, str) and v != "Mathematics")
    pm_mapped = {"course_id": "MATH M1901", "subject": mapped, "common_title": "College Algebra",
                 "discipline": "Mathematics", "discipline_source": "pile_mint", "pile_mint_route": "subject_map",
                 "discipline_confidence": 1.0, "reviewed_at": None}
    pm_blank = dict(pm_mapped, course_id="MATH M1902", subject="QQQZZ", common_title="Zzyzx")
    other = dict(pm_mapped, course_id="MATH M1903", discipline="Nonsense Field", discipline_source="subject_map")
    for name, body in (("coci_minted_courses.json", {"courses": {"MATH M1901": pm_mapped, "MATH M1902": pm_blank,
                                                                 "MATH M1903": other}}),
                       ("coci_minted_memberships.json", {"memberships": {}}),
                       ("coci_unified_courses.json", {"clusters": {}}),
                       ("coci_minted_singletons.json", {"courses": {}}),
                       ("coci_curation.json", {"curations": {}})):
        json.dump(body, open(os.path.join(tree, name), "w"))
    out = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_infer_disciplines.py")], capture_output=True,
                         text=True, env=dict(os.environ, UC_KB_DIR=tree), cwd=ROOT)
    got = json.load(open(os.path.join(tree, "coci_minted_courses.json")))["courses"]
    check("_infer_disciplines runs on the UC_KB_DIR fixture tree", out.returncode == 0)
    check("_infer_disciplines leaves a pile mint the lexicon maps elsewhere as written (no rewrite)",
          got["MATH M1901"] == pm_mapped)
    check("_infer_disciplines leaves a pile mint the lexicon cannot map as written (no retraction)",
          got["MATH M1902"] == pm_blank)
    check("a subject_map fill beside them still re-derives", got["MATH M1903"]["discipline"] != "Nonsense Field")
    check("the run counts the pile mints it left", "left as written (pile mint): 2" in out.stdout)
finally:
    shutil.rmtree(tree, ignore_errors=True)

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
