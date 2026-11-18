#!/usr/bin/env python3
"""exhibit_blocker_rules_test.py — the blocker round's rules 1 and 2 (COBIx, #3480 Source 19), pinned.

What this pins, each a way the rules could go wrong without an error:

  counts      on the committed records, Rule 1 re-points 101 of its 121 pairs and Rule 2 keeps 79 of its 95. COBIx
              measured 80 for Rule 2; the one pair apart (MAPCXS-GA-1-001 "Automotive ") is a graded pair the
              re-point list's Split already moves, and a move beats a stay (Source 19, conflict check A).
  colleges    the 3-college tests in Source 19: Modesto 78 re-point and 8 stay, FTECH 317 (Firefighter 1) among the 8;
              Cabrillo 4 and Moorpark 4 re-point; Pierce 33 keep and 3 stay; Chaffey 11 keep; Las Positas 10 and 8.
  guard       0 graded pairs land in a cert-based group; every re-point is a cert-based pair going to a twin that
              holds no graded exhibit; 0 pairs get two different targets from two rules.
  never       no local title key changes, no canonical key disappears, a Sam-curated pair is never applied; the apply's
              undo puts every file back byte for byte.
  rules       small fixtures for each skip: a named credential, an outside issuer, AP typed cert-based, a twin that
              holds graded exhibits, Sam-curated; a listing on another canonical, low confidence, the guard both ways.
  committed   kb/exhibit_blocker_rules_list.json equals a rebuild.

No network. Run from the repo root:  python3 tests/exhibit_blocker_rules_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import exhibit_blocker_rules as br  # noqa: E402
import exhibit_repoint as xr  # noqa: E402

FAILS = []


def check(cond, msg):
    if not cond:
        FAILS.append(msg)
        print("FAIL:", msg)


def by_rule(doc, batch):
    return [r for r in doc["rows"] if r["batch"] == batch]


def test_committed_counts(doc):
    c = doc["counts"]
    r1, r2 = by_rule(doc, "cert_twin"), by_rule(doc, "left_keep")
    check(len(r1) == 121 and len(r2) == 95, "scope is not 121 + 95 pairs: %d + %d" % (len(r1), len(r2)))
    check(c["by_rule"]["cert_twin"] == {"person": 20, "repoint": 101}, "Rule 1: %r" % c["by_rule"]["cert_twin"])
    check(c["by_rule"]["left_keep"] == {"confirm": 79, "person": 15, "skip": 1}, "Rule 2: %r" % c["by_rule"]["left_keep"])
    skipped = [r for r in r2 if r["action"] == "skip"]
    check([(r["exhibit_id"], r["local_title"]) for r in skipped] == [("MAPCXS-GA-1-001", "Automotive ")]
          and skipped[0]["reason"].startswith("another rule"), "Rule 2's one difference from COBIx moved: %r" % skipped)
    why1 = [r["reason"] for r in r1 if r["action"] != "repoint"]
    check(sum(w.startswith("the local title names") for w in why1) == 6
          and sum(w.startswith("names AP") for w in why1) == 3
          and sum(w.startswith("an outside licensing issuer") for w in why1) == 11,
          "Rule 1's 20 are not 6 named, 3 AP, 11 outside issuer")
    why2 = [r["reason"] for r in r2 if r["action"] == "person"]
    # COBIx's prose says 12 below 0.80; his own dry run (Source 24) lists 11, and 11 + 2 + 1 + 1 is his 15.
    check(sum("below 0.80" in w for w in why2) == 11 and sum(w.startswith("guard: no CPL type") for w in why2) == 2
          and sum(w.startswith("a course-credit listing") for w in why2) == 1
          and sum(w.startswith("guard: this") for w in why2) == 1,
          "Rule 2's 15 are not 11 low confidence, 2 untyped on a mixed canonical, 1 listing, 1 guard")
    check(c["twins"] == 77, "Rule 1's re-points do not share 77 twins: %d" % c["twins"])
    check(c["to_sam_after"] == 216, "what still goes to Sam: %d" % c["to_sam_after"])


def test_college_tests(doc):
    t = doc["college_tests"]
    want = {"Modesto Junior College": {"cert_twin": {"person": 8, "repoint": 78}},
            "Moorpark College": {"cert_twin": {"repoint": 4}},
            "Los Angeles Pierce College": {"left_keep": {"confirm": 33, "person": 3}},
            "Chaffey College": {"left_keep": {"confirm": 11}},
            "Las Positas College": {"left_keep": {"confirm": 10, "person": 8}}}
    for college, w in want.items():
        for b, counts in w.items():
            check(t[college].get(b) == counts, "%s %s: %r" % (college, b, t[college].get(b)))
    check(t["Cabrillo College"]["cert_twin"] == {"repoint": 4}, "Cabrillo Rule 1: %r" % t["Cabrillo College"])
    ft = [r for r in doc["rows"] if "FTECH 317" in r["local_title"]]
    check(len(ft) == 1 and ft[0]["action"] == "person" and "specific credential" in ft[0]["reason"],
          "FTECH 317 Firefighter 1 did not stay with Sam: %r" % ft)
    pierce = [r for r in doc["rows"] if "AP Calculus BC/AB Subscore" in r["local_title"]]
    check(pierce and all(r["action"] == "person" and "different canonical" in r["reason"] for r in pierce),
          "the AP Calculus BC/AB subscore title did not stay with Sam")


def test_guard(doc, idx):
    c = doc["counts"]
    check(c["conflict_a"] == 0, "a pair gets two different targets: %d" % c["conflict_a"])
    check(c["conflict_b_graded_into_cert"] == 0, "graded into cert-based: %d" % c["conflict_b_graded_into_cert"])
    groups = br.canon_groups(idx)
    for r in doc["rows"]:
        if r["action"] == "repoint":
            check(br.pair_group(idx, r["exhibit_id"]) == "cert", "a re-point that is not cert-based: %r" % r["exhibit_id"])
            check(not groups.get(r["to"], {}).get("graded"), "a twin that holds graded exhibits: %r" % r["to"])
            check(r["to"] == "%s (%s)" % (r["from"], r["cpl_type"]), "a twin not named course title + type: %r" % r["to"])
            check(not r["target_exists"], "a twin that already exists as a canonical: %r" % r["to"])
        if r["action"] == "confirm":
            check(r["to"] == r["from"], "a keep that moves: %r" % r["local_title"])
    check(xr.group_of("Credit By Exam") == "graded" and xr.group_of("Portfolio Review") == "graded",
          "Credit By Exam and Portfolio Review do not both read graded")


def test_never(doc, idx):
    ut0, creds0, arts0 = copy.deepcopy(idx.ut), copy.deepcopy(idx.creds), copy.deepcopy(idx.arts)
    ut1, creds1, arts1, undo, rep = xr.apply_rows(doc["rows"], idx.ut, idx.creds, idx.arts, today="2026-11-18")
    check((idx.ut, idx.creds, idx.arts) == (ut0, creds0, arts0), "the dry run mutated its inputs")
    check(set(ut1) == set(ut0), "a local title key changed")
    check(set(creds0) <= set(creds1), "a canonical key disappeared (renamed)")
    applied = {(a["exhibit_id"], a["local_title"]) for a in rep["applied"]}
    for r in doc["rows"]:
        if r["action"] not in xr.APPLIED_ACTIONS:
            check((r["exhibit_id"], r["local_title"]) not in applied, "a %s row applied: %r" % (r["action"], r))
        if r["action"] in xr.APPLIED_ACTIONS:
            check(not br.pair_sam_curated(idx, r["local_title"], r["from"]), "a Sam-curated pair is applicable")
    check(rep["counts"]["applied"] == doc["counts"]["apply_dry_run"]["applied"], "the committed dry-run count drifted")
    ut2, creds2, arts2, skipped = xr.undo_pairs(undo, ut1, creds1, arts1)
    check(not skipped and (ut2, creds2, arts2) == (ut0, creds0, arts0), "the undo did not restore: %r" % skipped[:3])
    check(len(doc["left_map_keep"]["rows"]) == 77 and all(x["value"] == "keep" and x["course_id"].startswith(
        "_LEFT_MAP::") for x in doc["left_map_keep"]["rows"]), "the leftover keep rows are not 77 keeps")


# ── fixtures for each skip ────────────────────────────────────────────────────────────────────────────────────────

def _fixture():
    ut = {
        "AGM 211 Advanced Agricultural Welding - Industry Certification": {
            "unified_title": "Advanced Agricultural Welding", "confidence_title": 0.9,
            "source_exhibit_ids": ["MAPICI-A2AW-1-001"]},
        "AGM 211 Advanced Agricultural Welding - Credit by Exam": {
            "unified_title": "Advanced Agricultural Welding", "confidence_title": 0.9,
            "source_exhibit_ids": ["MAPCXS-A2AW-1-001"]},
        "FTECH 317 Firefighter 1 Academy Physical Training": {
            "unified_title": "Firefighter Physical Training", "confidence_title": 0.9,
            "source_exhibit_ids": ["MAPICI-F31A-1-001"]},
        "Real Estate Practice": {"unified_title": "Real Estate Practice", "confidence_title": 0.9,
                                 "source_exhibit_ids": ["MAPICI-REP-1-001"]},
        "AP Business Statistics": {"unified_title": "Business Statistics", "confidence_title": 0.9,
                                   "source_exhibit_ids": ["MAPICI-ABS-1-001"]},
        "Dairy Management IC": {"unified_title": "Dairy Management", "confidence_title": 0.9,
                                "source_exhibit_ids": ["MAPICI-DM-1-001"]},
        "Dairy Management (Industry Certification)": {"unified_title": "Dairy Management (Industry Certification)",
                                                       "confidence_title": 0.9,
                                                       "source_exhibit_ids": ["MAPCXS-DMX-1-001"]},
        "Sam's welding": {"unified_title": "Settled Welding", "confidence_title": 0.9, "reviewed_by": "samueltlee",
                          "source_exhibit_ids": ["MAPICI-SW-1-001"]},
        # leftovers
        "Old AP Biology": {"unified_title": "AP Biology", "confidence_title": 0.95,
                           "source_exhibit_ids": ["MAPSAS-AB-1-001"]},
        "AP - Biology": {"unified_title": "AP Biology", "confidence_title": 1.0, "source_exhibit_ids": ["MAPSAS-AB2-1-001"]},
        "Old calc": {"unified_title": "AP Calculus AB", "confidence_title": 0.9, "source_exhibit_ids": ["MAPSAS-C-1-001"]},
        "Old low": {"unified_title": "Boatworks", "confidence_title": 0.65, "source_exhibit_ids": ["MAPICI-BW-1-001"]},
        "Old first aid": {"unified_title": "First Aid", "confidence_title": 0.9, "source_exhibit_ids": ["MAPICI-FA-1-001"]},
        "First aid exam": {"unified_title": "First Aid", "confidence_title": 0.9, "source_exhibit_ids": ["MAPCXS-FA-1-001"]},
        "Old physics": {"unified_title": "AP Physics", "confidence_title": 0.9},
        "AP Physics exam": {"unified_title": "AP Physics", "confidence_title": 0.9, "source_exhibit_ids": ["MAPCXS-P-1-001"]},
        "AP Physics IC": {"unified_title": "AP Physics", "confidence_title": 0.9, "source_exhibit_ids": ["MAPSAS-P-1-001"]},
    }
    creds = {"Advanced Agricultural Welding": [{"issuing_agency": "California Community Colleges"}],
             "Firefighter Physical Training": [{"issuing_agency": "California State Fire Training (SFT)"}],
             "Real Estate Practice": [{"issuing_agency": "California Department of Real Estate (DRE)"}],
             "Business Statistics": [{"issuing_agency": "California Community Colleges"}],
             "Dairy Management": [{"issuing_agency": "California Community Colleges"}],
             "Dairy Management (Industry Certification)": [{"issuing_agency": "California Community Colleges"}],
             "Settled Welding": [{"issuing_agency": "California Community Colleges"}]}
    arts = [{"exhibit_id": "MAPICI-A2AW-1-001", "exhibit_title": "AGM 211 Advanced Agricultural Welding - Industry "
             "Certification", "unified_title": "Advanced Agricultural Welding", "cpl_type_description":
             "Industry Certification", "course_id": "WELD M10DB"},
            {"exhibit_id": "MAPSAS-C-1-001", "exhibit_title": "Old calc", "unified_title": "AP Calculus BC",
             "cpl_type_description": "Standardized Assessment", "course_id": "MATH 1"},
            {"exhibit_id": "MAPSAS-AB-1-001", "exhibit_title": "Old AP Biology", "unified_title": "AP Biology",
             "cpl_type_description": "Standardized Assessment", "course_id": "BIOL 3"}]
    return xr.Index(ut, creds, arts, {})


def test_rule_fixtures():
    idx = _fixture()
    s = lambda e, t: {"exhibit_id": e, "local_title": t, "college": "A College"}  # noqa: E731
    rows = br.rule_cert_twin(idx, [
        s("MAPICI-A2AW-1-001", "AGM 211 Advanced Agricultural Welding - Industry Certification"),
        s("MAPICI-F31A-1-001", "FTECH 317 Firefighter 1 Academy Physical Training"),
        s("MAPICI-REP-1-001", "Real Estate Practice"),
        s("MAPICI-ABS-1-001", "AP Business Statistics"),
        s("MAPICI-DM-1-001", "Dairy Management IC"),
        s("MAPICI-SW-1-001", "Sam's welding")])
    got = [(r["action"], r.get("to"), r["reason"].split(" ")[0]) for r in rows]
    check(got[0][:2] == ("repoint", "Advanced Agricultural Welding (Industry Certification)"),
          "the welding twin: %r" % (got[0],))
    check(rows[0]["target_issuer"] == "California Community Colleges", "the twin's issuer is not the college")
    check(got[1][0] == "person" and "specific credential" in rows[1]["reason"], "Firefighter 1 re-pointed")
    check(got[2][0] == "person" and "outside licensing issuer" in rows[2]["reason"], "the DRE title re-pointed")
    check(got[3][0] == "person" and "AP, CLEP" in rows[3]["reason"], "the AP title re-pointed")
    check(got[4][0] == "person" and "graded" in rows[4]["reason"], "a twin holding graded exhibits took a re-point")
    check(got[5][0] == "tap_only", "a Sam-curated pair was not tap-only")
    check(not br.NAMED.search("FTECH 321A Fire Service In-Service Training/EMS"),
          "an in-service module reads as a named credential")
    claimed = br.rule_cert_twin(idx, [s("MAPICI-A2AW-1-001", rows[0]["local_title"])],
                                claimed={("MAPICI-A2AW-1-001", rows[0]["local_title"])})
    check(claimed[0]["action"] == "skip", "a pair another rule moves was re-pointed again")

    left = {"Old AP Biology", "Old calc", "Old low", "Old first aid", "Old physics"}
    rows = br.rule_left_keep(idx, [s("MAPSAS-AB-1-001", "Old AP Biology"), s("MAPSAS-C-1-001", "Old calc"),
                                   s("MAPICI-BW-1-001", "Old low"), s("MAPICI-FA-1-001", "Old first aid"),
                                   s("", "Old physics"), s("MAPSAS-AB2-1-001", "AP - Biology")], left, set())
    acts = [(r["action"], r["reason"].split(":")[0]) for r in rows]
    check(acts[0][0] == "confirm" and rows[0]["to"] == "AP Biology", "the agreeing leftover did not keep: %r" % (acts[0],))
    check(acts[1][0] == "person" and "different canonical" in rows[1]["reason"], "a listing on another canonical kept")
    check(acts[2][0] == "person" and "below 0.80" in rows[2]["reason"], "a low-confidence leftover kept")
    check(acts[3][0] == "person" and rows[3]["reason"].startswith("guard: this cert"),
          "a cert-based leftover kept on a graded-only canonical")
    check(acts[4][0] == "person" and rows[4]["reason"].startswith("guard: no CPL type"),
          "an untyped leftover kept on a mixed canonical")
    check(acts[5][0] == "skip", "a live title was treated as a leftover")
    sam = br.rule_left_keep(idx, [s("MAPSAS-AB-1-001", "Old AP Biology")], left, {"Old AP Biology"})
    check(sam[0]["action"] == "tap_only", "a Sam-reviewed leftover was not settled")


def test_committed_is_current(doc):
    with open(br.OUT, encoding="utf-8") as f:
        check(f.read() == br.dumps(doc), "kb/exhibit_blocker_rules_list.json is stale: run "
                                         "python3 kb/exhibit_blocker_rules.py")


def main():
    idx = br.load_index()
    doc = br.build(idx)
    test_committed_is_current(doc)
    test_committed_counts(doc)
    test_college_tests(doc)
    test_guard(doc, idx)
    test_never(doc, idx)
    test_rule_fixtures()
    if FAILS:
        sys.exit("%d check(s) failed" % len(FAILS))
    print("exhibit_blocker_rules_test: all checks passed")


if __name__ == "__main__":
    main()
