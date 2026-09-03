#!/usr/bin/env python3
"""Fixture checks for kb/_prefix_fold_dryrun.py — one per way the fold could go
wrong: a row already on its canonical code moving, an umbrella span (KINE/ATHL)
moving, a number not kept when it is free, a taken number cascading instead of
gap-filling, a TOP-only discipline moving (Rule 7), a legacy row without a
reviewed discipline moving, a scope filter dropping rows silently, a swap
passing as a chain, and a receipt without the evidence that justified it.

Run from repo root: python3 tests/prefix_fold_dryrun_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _prefix_fold_dryrun as pf  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


def rec(title, disc, origin=None, source=None):
    r = {"common_title": title, "discipline": disc}
    if origin:
        r["origin"] = origin
    if source:
        r["discipline_source"] = source
    return r


courses = {
    "ITIS M1209": rec("Web 2.0 Social Media Strategies", "Computer Science", "machine cluster"),   # keep 1209
    "ITIS M1210": rec("Linux 2", "Computer Science", "machine cluster"),                            # COMP M1210 taken -> gap-fill
    "COMP M1210": rec("Data Structures", "Computer Science"),                                       # on canonical: untouched
    "COMP M1001": rec("Intro to Programming", "Computer Science"),                                  # occupies the first gap
    "CNSC M1004": rec("Hand and Power Tool Application", "Carpentry", "machine cluster"),           # TOP-only members: held
    "ATHL M1366": rec("Off Season Sports Conditioning", "Kinesiology", "machine cluster"),          # KINE/ATHL span: no move
    "HVAC M1079": rec("Residential Construction Skills", "Construction Technology"),                # legacy, overlay discipline
    "HVAC M1080": rec("Blueprint Reading", "Electricity", source="top_code"),                       # legacy, TOP-only: held
    "MEM1": rec("member a", "Computer Science"), "MEM2": rec("member b", "Computer Science", source="top_code"),
    "MEM3": rec("member c", "Carpentry", source="top_code"), "MEM4": rec("member d", "Carpentry", source="top_division"),
    "MEM5": rec("member e", "Computer Science"),
    "ARTS M1521": rec("Contemporary Art History", "Art History", "machine cluster"),                # no member points at it: held
}
singletons = {"HVAC M10BZ": rec("Sheet Metal Layout", "Construction Technology")}                  # legacy stand-alone shape
curations = {
    "MEM1": {"merge_into": "ITIS M1209"}, "MEM2": {"merge_into": "ITIS M1209"}, "MEM5": {"merge_into": "ITIS M1210"},
    "MEM3": {"merge_into": "CNSC M1004"}, "MEM4": {"merge_into": "CNSC M1004"},
    "HVAC M1079": {"discipline": "Construction Technology", "reviewed_by": "trailcrew-ccr3-s112@bot"},
    "HVAC M10BZ": {"discipline": "Construction Technology", "reviewed_by": "mismint-s113@bot"},
    "CNST M1079": {"unified_title": "a curated key that already exists"},                           # overlay key on the surface
}
canon_doc = {"disciplines": {
    "Computer Science": {"canonical_subj4": "COMP"}, "Carpentry": {"canonical_subj4": "CARP"},
    "Kinesiology": {"canonical_subj4": "KINE"}, "Construction Technology": {"canonical_subj4": "CNST"},
    "Art History": {"canonical_subj4": "ARTH"},
    "Electricity": {"canonical_subj4": "ELEC"}}}
allowances = {"Kinesiology": {"KINE", "ATHL"}}
identities = {"ITIS M1209": {}, "COMP M1209": {}}          # a ghost the fold heals

plan = pf.compute_plan(courses, singletons, curations, identities, canon_doc, allowances, {}, scope="all")
alias = plan["alias"]
check("a materialized record keeps its number when the canonical key is free", alias.get("ITIS M1209") == "COMP M1209")
check("a taken number gap-fills to the first free key instead of cascading", alias.get("ITIS M1210") == "COMP M1002")
check("the row already on COMP is untouched", "COMP M1210" not in alias and "COMP M1001" not in alias)
check("a KINE/ATHL span row is not a candidate", "ATHL M1366" not in alias and "ATHL M1366" not in plan["held"])
check("a materialized record whose members rest on TOP alone is held", "CNSC M1004" in plan["held"] and "CNSC M1004" not in alias)
check("a legacy row with a reviewed overlay discipline moves", alias.get("HVAC M1079") == "CNST M1080" or alias.get("HVAC M1079", "").startswith("CNST "))
check("the overlay key already on the surface is not reused", alias.get("HVAC M1079") != "CNST M1079")
check("a legacy row whose catalog discipline is TOP-only is held", "HVAC M1080" in plan["held"])
check("a stand-alone shape keeps its shape and its letters", alias.get("HVAC M10BZ") == "CNST M10BZ")
check("evidence is carried on every move", all(m.get("evidence") for m in plan["moves"].values()))
check("a materialized record with no member evidence is held, not moved",
      "ARTS M1521" in plan["held"] and "no evidence" in plan["held"]["ARTS M1521"]["why_held"])
check("the ghost identities key the fold lands on is reported healed", plan["identities_ghosts"]["healed_by_this_fold"] == ["COMP M1209"])
check("every validation gate passes on the fixture", all(v["pass"] for v in plan["validation"].values()))
check("fates count the span as no_change and the strays as re_key",
      plan["fates"].get("re_key") == 7 and plan["fates"].get("no_change") >= 3)

scoped = pf.compute_plan(courses, singletons, curations, identities, canon_doc, allowances, {}, scope="materialized")
check("--scope materialized moves only the materialized cohort", set(scoped["alias"]) == {"ITIS M1209", "ITIS M1210"})
check("the legacy rows outside the scope are reported, not dropped",
      {"HVAC M1079", "HVAC M10BZ"} <= set(scoped["out_of_scope"]) and "HVAC M1080" in scoped["held"])

# a swap is a cycle, never a chain
swap_courses = {"AAAA M1001": rec("x", "B disc"), "BBBB M1001": rec("y", "A disc")}
swap_canon = {"disciplines": {"A disc": {"canonical_subj4": "AAAA"}, "B disc": {"canonical_subj4": "BBBB"}}}
swap = pf.compute_plan(swap_courses, {}, {}, {}, swap_canon, {}, {}, scope="all")
check("a swap fails V9 as a cycle", not swap["validation"]["V9_no_swap_cycles"]["pass"])
check("a swap is not counted as a plain chain", swap["validation"]["V9_no_swap_cycles"]["cycles"] == ["AAAA M1001", "BBBB M1001"])

# receipts
with tempfile.TemporaryDirectory() as td:
    pf.write_receipts(plan, td)
    am = json.load(open(os.path.join(td, "alias_map.json")))
    held = json.load(open(os.path.join(td, "held.json")))
    check("the alias map carries kind, how and evidence per row",
          am["count"] == len(alias) and all(k in am["aliases"]["ITIS M1209"] for k in ("new_id", "kind", "how", "evidence", "discipline")))
    check("held.json names the TOP-only rows and why", "CNSC M1004" in held["held"] and "TOP alone" in held["held"]["CNSC M1004"]["why_held"])
    check("the SQL preview is marked DO NOT RUN", "DO NOT RUN" in open(os.path.join(td, "supabase_ops.sql")).read())
    check("the report renders the groups table", "| `ITIS` → `COMP` | Computer Science |" in open(os.path.join(td, "report.md")).read())

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
