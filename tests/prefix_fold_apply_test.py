#!/usr/bin/env python3
"""Fixture checks for kb/_prefix_fold_apply.py — one per failure the apply must
never produce: a moved row without its stamp (or with an earlier stamp lost),
an untouched row touched, a materialized record's member list left on an old
id, a pointer left on an old id, a stale identities entry left describing the
wrong row, a receipt cut under another scope or ruling slipping through P1, a
second run against the same receipt, a TOP-only row moving without the ruling
on its evidence, and a leftover the gates would miss.

Run from repo root: python3 tests/prefix_fold_apply_test.py
"""
import copy
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _prefix_fold_dryrun as pf  # noqa: E402
import _prefix_fold_apply as app  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


def rec(cid, title, disc, origin=None, source=None, **extra):
    r = {"course_id": cid, "id_system": "M-ID", "common_title": title, "subject_4letter": cid.split(" ")[0],
         "discipline": disc, "typical_units": 3.0}
    if origin:
        r["origin"] = origin
    if source:
        r["discipline_source"] = source
    r.update(extra)
    return r


MC = "machine cluster"
courses = {k: rec(k, *a, **kw) for k, a, kw in [
    ("ITIS M1209", ("Web 2.0 Social Media Strategies", "Computer Science", MC),
     {"_zband_retired_from": "ITIS Z1001", app.MEMBERS_KEY: ["MEM1", "MEM2"]}),      # keeps 1209
    ("ITIS M1210", ("Linux 2", "Computer Science", MC), {app.MEMBERS_KEY: ["MEM5"]}),  # COMP M1210 taken -> gap-fill
    ("COMP M1210", ("Data Structures", "Computer Science"), {}),                        # on canonical: untouched
    ("COMP M1001", ("Intro to Programming", "Computer Science"), {}),                   # occupies the first gap
    ("CNSC M1004", ("Hand and Power Tool Application", "Carpentry", MC), {app.MEMBERS_KEY: ["MEM3", "MEM4"]}),  # TOP-only: held
    ("ATHL M1366", ("Off Season Sports Conditioning", "Kinesiology", MC), {}),          # KINE/ATHL span: no move
    ("HVAC M1079", ("Residential Construction Skills", "Construction Technology"), {}),  # legacy, overlay discipline
    ("HVAC M1080", ("Blueprint Reading", "Electricity", None, "top_code"), {}),        # legacy, TOP-only: held
    ("AUTD M1040", ("Transit HVAC", "Diesel Mechanics", MC), {app.MEMBERS_KEY: ["HVAC M1079", "MEM1"]}),  # lists a moving member
    ("MEM1", ("member a", "Computer Science"), {}), ("MEM2", ("member b", "Computer Science", None, "top_code"), {}),
    ("MEM3", ("member c", "Carpentry", None, "top_code"), {}), ("MEM4", ("member d", "Carpentry", None, "top_division"), {}),
    ("MEM5", ("member e", "Computer Science"), {}),
    ("ARTS M1521", ("Contemporary Art History", "Art History", MC), {}),                # no member points at it: held
    ("AAAA M1001", ("Chained: leaves AAAA", "Bbb Studies"), {}),                        # -> BBBB M1001, vacating AAAA M1001
    ("CCCC M1001", ("Chained: arrives on AAAA", "Aaa Studies"), {}),                    # -> AAAA M1001, the key just vacated
]}
singletons = {"HVAC M10BZ": rec("HVAC M10BZ", "Sheet Metal Layout", "Construction Technology",
                                college="A", control_number="CCC1")}
memberships = {k: [{"college": "A", "subject": k.split()[0], "course_number": "1", "units": 3.0}]
               for k in ("COMP M1210", "COMP M1001", "HVAC M1079")}
articulations = [{"course_id": "HVAC M1079", "x": 1}, {"course_id": "COMP M1001", "x": 2},
                 {"course_id": "ITIS M1209", "x": 3}]
identities = {"ITIS M1209": {"title": "Web 2.0 Social Media Strategies", "lev": 3},
              "COMP M1209": {"title": "a pre-fold occupant", "ghost": True},          # healed: the moved entry wins
              "CNST M1001": {"title": "a stale occupant", "over_merged": True},       # dropped: nothing arrives with an entry
              "MATH M1001": {"title": "unrelated"}}
curations = {
    "MEM1": {"merge_into": "ITIS M1209"}, "MEM2": {"merge_into": "ITIS M1209"}, "MEM5": {"merge_into": "ITIS M1210"},
    "MEM3": {"merge_into": "CNSC M1004"}, "MEM4": {"merge_into": "CNSC M1004"},
    "ITIS M1209": {"unified_title": "Web 2.0 Social Media Strategies", "reviewed_by": "bot",
                   "reviewed_at": "2026-06-13T00:00:00+00:00"},
    "HVAC M1079": {"discipline": "Construction Technology", "reviewed_by": "trailcrew-ccr3-s112@bot",
                   "reviewed_at": "2026-07-20T00:00:00+00:00"},
    "HVAC M10BZ": {"discipline": "Construction Technology", "reviewed_by": "mismint-s113@bot"},
    "CNST M1079": {"unified_title": "a curated key that already exists"},
    "MEM6": {"merge_into": "AAAA M1001"}, "MEM7": {"merge_into": "CCCC M1001"},
}
canon_doc = {"disciplines": {
    "Computer Science": {"canonical_subj4": "COMP"}, "Carpentry": {"canonical_subj4": "CARP"},
    "Kinesiology": {"canonical_subj4": "KINE"}, "Construction Technology": {"canonical_subj4": "CNST"},
    "Art History": {"canonical_subj4": "ARTH"}, "Electricity": {"canonical_subj4": "ELEC"},
    "Diesel Mechanics": {"canonical_subj4": "AUTD"},
    "Aaa Studies": {"canonical_subj4": "AAAA"}, "Bbb Studies": {"canonical_subj4": "BBBB"}}}
allowances = {"Kinesiology": {"KINE", "ATHL"}}
REL = "kb/prefix_fold_out/test"
NOW = "2026-09-04T12:00:00Z"


def fresh_docs():
    return {"courses": {"courses": copy.deepcopy(courses)}, "singletons": {"courses": copy.deepcopy(singletons)},
            "memberships": {"memberships": copy.deepcopy(memberships)},
            "articulations": {"articulations": copy.deepcopy(articulations), "identities": copy.deepcopy(identities)},
            "curation": {"curations": copy.deepcopy(curations), "count": len(curations)}}


def orig_of(docs):
    return {"courses": copy.deepcopy(docs["courses"]["courses"]), "singletons": copy.deepcopy(docs["singletons"]["courses"]),
            "memberships": dict(docs["memberships"]["memberships"]),
            "art_multiset": [a["course_id"] for a in docs["articulations"]["articulations"]],
            "identities": dict(docs["articulations"]["identities"]), "curation": dict(docs["curation"]["curations"])}


def plan_for(docs, **kw):
    return pf.compute_plan(copy.deepcopy(docs["courses"]["courses"]), copy.deepcopy(docs["singletons"]["courses"]),
                           copy.deepcopy(docs["curation"]["curations"]), copy.deepcopy(docs["articulations"]["identities"]),
                           canon_doc, allowances, {}, **kw)


# ── the plain receipt (scope all, nothing ruled) ─────────────────────────────
docs = fresh_docs()
plan = plan_for(docs)
alias = plan["alias"]
check("fixture plan: every allocator validation passes", all(v["pass"] for v in plan["validation"].values()))
check("fixture plan: the expected rows move and the expected rows are held",
      alias.get("ITIS M1209") == "COMP M1209" and alias.get("ITIS M1210") == "COMP M1002"
      and alias.get("HVAC M1079") == "CNST M1001" and alias.get("HVAC M10BZ") == "CNST M10BZ"
      and set(plan["held"]) == {"CNSC M1004", "HVAC M1080", "ARTS M1521"} and "AUTD M1040" not in alias)
check("the residual fold-verify must read after the land is the held count", app.expected_residual(plan) == 3)

orig = orig_of(docs)
stats = app.apply_plan(docs, plan, NOW, REL)
gates = app.post_gates(orig, docs, plan, stats)
check("every post-mutation gate passes on the fixture", all(gates.values()))
nc, ns = docs["courses"]["courses"], docs["singletons"]["courses"]
check("moved materialized record: new key, course_id, subject_4letter and the stamp agree",
      "ITIS M1209" not in nc and nc["COMP M1209"]["course_id"] == "COMP M1209"
      and nc["COMP M1209"]["subject_4letter"] == "COMP" and nc["COMP M1209"][app.STAMP] == "ITIS M1209")
check("an earlier receipt's stamp survives beside the new one",
      nc["COMP M1209"]["_zband_retired_from"] == "ITIS Z1001")
check("the gap-filled row carries its old id too", nc["COMP M1002"][app.STAMP] == "ITIS M1210")
check("a materialized record's member list follows a moving member; other lists are untouched",
      nc["AUTD M1040"][app.MEMBERS_KEY] == ["CNST M1001", "MEM1"] and nc["COMP M1209"][app.MEMBERS_KEY] == ["MEM1", "MEM2"]
      and stats["member_lists"] == 1 and stats["member_ids"] == 1)
check("the record whose list changed is otherwise untouched",
      {k: v for k, v in nc["AUTD M1040"].items() if k != app.MEMBERS_KEY}
      == {k: v for k, v in courses["AUTD M1040"].items() if k != app.MEMBERS_KEY})
check("held rows stay where they are, unstamped",
      all(k in nc and app.STAMP not in nc[k] for k in ("CNSC M1004", "HVAC M1080", "ARTS M1521")))
check("untouched row on its canonical code is byte-identical",
      json.dumps(nc["COMP M1210"], sort_keys=True) == json.dumps(courses["COMP M1210"], sort_keys=True))
check("stand-alone re-keyed with its stamp and its shape",
      ns["CNST M10BZ"][app.STAMP] == "HVAC M10BZ" and "HVAC M10BZ" not in ns)
nm = docs["memberships"]["memberships"]
check("memberships keys follow the catalog", "CNST M1001" in nm and "HVAC M1079" not in nm and "COMP M1210" in nm)
arts = docs["articulations"]["articulations"]
check("articulations re-pointed, the rest untouched",
      [a["course_id"] for a in arts] == ["CNST M1001", "COMP M1001", "COMP M1209"])
ident = docs["articulations"]["identities"]
check("identities: the moved entry wins its new key and heals the ghost there",
      ident["COMP M1209"].get("lev") == 3 and "ghost" not in ident["COMP M1209"] and "ITIS M1209" not in ident)
check("identities: a stale entry on a landing key nobody arrives with is dropped, not left describing the wrong row",
      "CNST M1001" not in ident and "MATH M1001" in ident
      and stats["identities_ghosts_healed"] == 1 and stats["identities_ghosts_dropped"] == 1 and len(ident) == 2)
cur = docs["curation"]["curations"]
check("curation: keys moved, pointers re-pointed, a pointer at a held row untouched",
      "COMP M1209" in cur and "ITIS M1209" not in cur and cur["MEM1"]["merge_into"] == "COMP M1209"
      and cur["MEM5"]["merge_into"] == "COMP M1002" and cur["MEM3"]["merge_into"] == "CNSC M1004"
      and "CNST M1001" in cur and "CNST M10BZ" in cur and cur["CNST M1079"] == curations["CNST M1079"])
check("a chained key is vacated and refilled in one plan, its pointers follow each row, and the sweep accepts it",
      alias.get("AAAA M1001") == "BBBB M1001" and alias.get("CCCC M1001") == "AAAA M1001"
      and nc["AAAA M1001"][app.STAMP] == "CCCC M1001" and nc["BBBB M1001"][app.STAMP] == "AAAA M1001"
      and cur["MEM6"]["merge_into"] == "BBBB M1001" and cur["MEM7"]["merge_into"] == "AAAA M1001"
      and plan["validation"]["V9_no_swap_cycles"]["chained_keys"] == 1)
check("the era list names the receipt on every mutated doc",
      all(docs[k].get(app.APPLIED) == [{"receipt": REL, "at": NOW}]
          for k in ("courses", "singletons", "memberships", "articulations", "curation")))

# post-state: the planner has nothing left to move except what it held
after = plan_for(docs)
check("after the apply the planner plans no move and holds the same rows",
      after["alias"] == {} and set(after["held"]) == {"CNSC M1004", "HVAC M1080", "ARTS M1521"})

# P0 — this receipt, once
frozen = {"scope": "all", "ruled_held": None,
          "aliases": {old: {"new_id": new} for old, new in plan["alias"].items()}}
check("P0: a pristine tree and an unstamped receipt are clean", app.already_applied(frozen, fresh_docs(), REL) is None)
check("P0: the era list refuses a second run of the same receipt", bool(app.already_applied(frozen, docs, REL)))
check("P0: a stamped receipt is refused on its own",
      bool(app.already_applied(dict(frozen, _applied_at=NOW), fresh_docs(), REL)))
check("P0: another receipt is not blocked by this one's era entry",
      app.already_applied(frozen, docs, "kb/prefix_fold_out/other") is None)

# P1 — scope, ruling, fidelity
check("P1: the receipt's scope and ruling must match the run's flags",
      app.receipt_matches(frozen, "all", None) == [] and app.receipt_matches(frozen, "legacy", None)
      and app.receipt_matches(frozen, "all", "Sam: fold them")
      and app.receipt_matches(dict(frozen, ruled_held="Sam: fold them"), "all", None))
check("P1: the recomputed plan equals its own frozen receipt", app.plan_fidelity(plan, frozen) == (True, []))
tampered = json.loads(json.dumps(frozen))
tampered["aliases"]["ITIS M1209"]["new_id"] = "COMP M1003"
ok, drift = app.plan_fidelity(plan, tampered)
check("P1: one differing key is caught and named", not ok and drift == ["ITIS M1209"])

# gates catch a leftover the mutation could have missed
broken = fresh_docs()
bstats = app.apply_plan(broken, plan_for(broken), NOW, REL)
broken["curation"]["curations"]["MEM1"]["merge_into"] = "ITIS M1209"
bg = app.post_gates(orig_of(fresh_docs()), broken, plan, bstats)
check("G13 fails on a pointer left on an old id", not bg["G13 no old id left on any keyed surface"])
broken2 = fresh_docs()
bstats2 = app.apply_plan(broken2, plan_for(broken2), NOW, REL)
broken2["courses"]["courses"]["AUTD M1040"][app.MEMBERS_KEY] = ["HVAC M1079", "MEM1"]
bg2 = app.post_gates(orig_of(fresh_docs()), broken2, plan, bstats2)
check("G11 fails on a member list left on an old id", not bg2["G11 member lists re-keyed exactly, none left on an old id"])

# the ruled-held receipt (item 3's override)
RULING = "Sam, 2026-09-05: 3 edit: fold them"
rdocs = fresh_docs()
rplan = plan_for(rdocs, ruled_held=RULING)
check("ruled-held: the TOP-only rows move, each carrying the ruling as its second signal",
      rplan["alias"].get("CNSC M1004") == "CARP M1004" and rplan["alias"].get("HVAC M1080") == "ELEC M1080"
      and rplan["moves"]["CNSC M1004"]["evidence"][-1] == f"ruled: {RULING}"
      and rplan["moves"]["CNSC M1004"]["ruled"] == RULING)
check("ruled-held: a record with no evidence at all stays held under any ruling",
      set(rplan["held"]) == {"ARTS M1521"} and rplan["ruled_held"] == RULING)
check("without the ruling the same rows are held and carry no ruling field",
      not any(m.get("ruled") for m in plan["moves"].values()))
rorig = orig_of(rdocs)
rstats = app.apply_plan(rdocs, rplan, NOW, REL)
rgates = app.post_gates(rorig, rdocs, rplan, rstats)
check("ruled-held: the apply passes every gate and stamps the ruled rows",
      all(rgates.values()) and rdocs["courses"]["courses"]["CARP M1004"][app.STAMP] == "CNSC M1004"
      and rdocs["curation"]["curations"]["MEM3"]["merge_into"] == "CARP M1004")
check("ruled-held: the residual after the land is one", app.expected_residual(rplan) == 1)

# --scope: the receipt reports what it left out, and the residual counts it
sdocs = fresh_docs()
splan = plan_for(sdocs, scope="materialized")
check("--scope materialized: legacy rows are outside the scope and counted in the residual",
      set(splan["alias"]) == {"ITIS M1209", "ITIS M1210"} and {"HVAC M1079", "HVAC M10BZ"} <= set(splan["out_of_scope"])
      and app.expected_residual(splan) == len(splan["held"]) + len(splan["out_of_scope"]))

# the receipt on disk
with tempfile.TemporaryDirectory() as td:
    pf.write_receipts(rplan, td)
    am = json.load(open(os.path.join(td, "alias_map.json")))
    check("the dry run's receipt records the ruling and names the ruled rows",
          am["ruled_held"] == RULING and am["ruled_rows"] == ["CNSC M1004", "HVAC M1080"]
          and am["aliases"]["CNSC M1004"]["ruled"] == RULING and "ruled" not in am["aliases"]["ITIS M1209"])
    app.write_receipt(td, am, rplan, rstats, rgates, "fresh read matches (fixture)", NOW, "Sam, 2026-09-05: 1-7 yes")
    am2 = json.load(open(os.path.join(td, "alias_map.json")))
    ops = json.load(open(os.path.join(td, "supabase_ops.json")))
    val = open(os.path.join(td, "validation.md"), encoding="utf-8").read()
    rep = open(os.path.join(td, "report.md"), encoding="utf-8").read()
    check("the apply restamps the receipt APPLIED with the ruling and the plan source",
          am2["_applied_at"] == NOW and am2["_ruling"] == "Sam, 2026-09-05: 1-7 yes"
          and am2["_status"].startswith("APPLIED") and "P1" in am2["_plan_source"])
    check("supabase_ops.json names the workflow, the pair count and no picks",
          ops["rekey"]["workflow"].endswith("supabase-rekey.yml") and ops["rekey"]["pairs"] == len(rplan["alias"])
          and ops["picks"] == [] and ops["rekey"]["alias_map_path"].endswith("alias_map.json"))
    check("validation.md states the residual fold-verify must read and the ripple",
          "`re_key` **1**" in val and "| minted |" in val and "G13" in val)
    check("report.md's status line flips to APPLIED", "status: APPLIED" in rep and "status: DRY-RUN" not in rep)
    check("P0 after the write: the stamped receipt is refused", bool(app.already_applied(am2, fresh_docs(), REL)))

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
