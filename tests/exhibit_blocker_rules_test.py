#!/usr/bin/env python3
"""exhibit_blocker_rules_test.py — the blocker round's rules 1 and 2 (COBIx, #3480 Source 19), pinned.

What this pins, each a way the rules could go wrong without an error:

  counts      on the committed records, Rule 1 re-points 95 of its 121 pairs and Rule 2 keeps 75 of its 95. COBIx
              measured 101 and 80. Each pair apart is pinned in EXPECTED_DIFFS with its reason: 4 scope pairs whose
              exhibit id is not on the local title here, 1 scope row repeating a pair, 1 title naming SFT levels
              (1A, 2C), 1 graded pair the Split already moves, and 4 titles the apply would read as another key.
  pairs       every scope pair's outcome equals COBIx's or is one of EXPECTED_DIFFS, so two errors cannot cancel.
  colleges    the 3-college tests in Source 19, as rule outcomes and as what the apply holds today: Modesto 78
              re-point and 8 stay, FTECH 317 (Firefighter 1) among the 8; Moorpark 4 re-point, all 4 held for exhibit
              grain; Cabrillo 3 re-point, 2 of them held; Pierce 32 keep and 3 stay; Chaffey 8 keep; Las Positas 10, 8.
  guard       0 graded pairs land in a cert-based group; every re-point is a cert-based pair going to a twin that
              holds no graded exhibit; 0 pairs get two different targets from two rules; crosses_groups equals
              exhibits.js crossesGroups on every input pair; no keep is the title that puts a second group on its
              canonical.
  never       no local title key changes, no canonical key disappears, a Sam-curated pair is never applied; the apply's
              undo puts every file back byte for byte.
  rules       small fixtures for each skip: a named credential, an outside issuer, AP typed cert-based, a twin that
              holds graded exhibits, Sam-curated; a listing on another canonical, low confidence, the guard both ways.
  committed   kb/exhibit_blocker_rules_list.json equals a rebuild.

The daily run rewrites some of the inputs. The list records their hashes, and the count, pair, college and
byte-for-byte checks run only while they match; otherwise the test prints a notice to rebuild before the apply. The
guard, never and fixture checks run on a fresh rebuild either way.

No network. Run from the repo root:  python3 tests/exhibit_blocker_rules_test.py
"""
import copy
import json
import os
import re
import subprocess
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


# (rule, MAP exhibit id, local title) -> how the pair differs from COBIx's snapshot and why (the reason's start).
EXPECTED_DIFFS = {
    ("cert_twin", "MAPICI-A2-I-1-001", "AGM 262\tHydraulics/Pneumatics - Industry Certification"):
        "a college course typed",  # same outcome; the twin follows the slash rule (Hydraulics and Pneumatics)
    ("cert_twin", "MAPICI-A6C-1-001", "AUTO 600 Completion "): "the same pair as an earlier scope row",
    ("cert_twin", "MAPICI-BCFF-1-001", "Building Construction for Fire Protection 1 or 1A or 2C Certification"):
        "the local title names a license or a specific credential",
    ("cert_twin", "MAPICI-CIAT-1-001", "CLDV-30 INFANT AND TODDLER DEVELOPMENT"): "the exhibit id is not on",
    ("cert_twin", "MAPICI-BCFF1-1-001", "FIRE 34 - Building Construction for Fire Protection"):
        "the exhibit id is not on",
    ("cert_twin", "MAPPRI-FBAC-1-001", "FIRE-31 Fire Behavior and Combustion"): "the exhibit id is not on",
    ("cert_twin", "MAPICO-IITA-1-001", "IC- Introduction to Automotive Technology"): "the exhibit id is not on",
    ("left_keep", "", "AP Exam Physics C: Electricity and Magnetism Score of 4 or 5"): "waits on the apply",
    ("left_keep", "MAPCXS-GA-1-001", "Automotive "): "another rule moves this pair",
    ("left_keep", "", "CAJON HIGH SCHOOL- Business Management and Entrepreneurship (BUS Mgmt & Entr IS266/IS267)"):
        "waits on the apply",
    ("left_keep", "", "Chaffey Joint Union - Rancho Cucamonga HS - Advanced Engineering Design II H 1&2"):
        "waits on the apply",
    ("left_keep", "", "Colton-Redlands-Yucaipa ROP Anatomy and Physiology Honors"): "waits on the apply",
}


def by_rule(doc, batch):
    return [r for r in doc["rows"] if r["batch"] == batch]


def test_committed_counts(doc):
    c = doc["counts"]
    r1, r2 = by_rule(doc, "cert_twin"), by_rule(doc, "left_keep")
    check(len(r1) == 121 and len(r2) == 95, "scope is not 121 + 95 pairs: %d + %d" % (len(r1), len(r2)))
    check(c["by_rule"]["cert_twin"] == {"person": 20, "repoint": 95, "skip": 6}, "Rule 1: %r" % c["by_rule"]["cert_twin"])
    check(c["by_rule"]["left_keep"] == {"confirm": 75, "person": 15, "skip": 5}, "Rule 2: %r" % c["by_rule"]["left_keep"])
    why1 = [r["reason"] for r in r1 if r["action"] not in ("repoint", "skip")]
    check(sum(w.startswith("the local title names") for w in why1) == 7
          and sum(w.startswith("names AP") for w in why1) == 3
          and sum(w.startswith("an outside licensing issuer") for w in why1) == 10,
          "Rule 1's 20 are not 7 named, 3 AP, 10 outside issuer")
    why2 = [r["reason"] for r in r2 if r["action"] == "person"]
    # COBIx's prose says 12 below 0.80; his own dry run (Source 24) lists 11, and 11 + 2 + 1 + 1 is his 15.
    check(sum("below 0.80" in w for w in why2) == 11 and sum(w.startswith("guard: no CPL type") for w in why2) == 2
          and sum(w.startswith("a course-credit listing") for w in why2) == 1
          and sum(w.startswith("guard: the Exhibits List") for w in why2) == 1,
          "Rule 2's 15 are not 11 low confidence, 2 untyped on a mixed canonical, 1 listing, 1 guard")
    check(c["twins"] == 76, "Rule 1's re-points do not share 76 twins: %d" % c["twins"])
    check((c["resolved_by_rules"], c["resolved_and_applies_now"], c["resolved_waiting_on_exhibit_grain"],
           c["not_a_pair_here"], c["waits_on_apply_key_fix"], c["moved_by_another_rule"], c["to_sam_after"])
          == (170, 163, 7, 6, 4, 1, 216), "the piles moved: %r" % {k: c[k] for k in (
              "resolved_by_rules", "resolved_and_applies_now", "not_a_pair_here", "waits_on_apply_key_fix",
              "to_sam_after")})
    check(c["held_at_apply"] == {"exhibit grain": 7}, "a resolved row is held for a reason other than exhibit grain: %r"
          % c["held_at_apply"])
    check(c["kept_on_already_mixed_canonical"] == 24, "keeps on an already-mixed canonical: %d"
          % c["kept_on_already_mixed_canonical"])


def test_pairs_against_snapshot(doc):
    """Pair by pair: the outcome equals COBIx's, or the pair is one of EXPECTED_DIFFS with its reason."""
    want = {"cert_twin": "repoint", "left_keep": "confirm"}
    seen = set()
    for r in doc["rows"]:
        mine = r["action"] == want[r["batch"]]
        snap = r["snapshot"].split(" ")[0]
        theirs = snap in ("repoint", "keep")
        target_ok = not mine or r["batch"] != "cert_twin" or r["snapshot"] == "repoint " + r["to"]
        k = (r["batch"], r["exhibit_id"], r["local_title"])
        if mine != theirs or not target_ok:
            seen.add(k)
            check(k in EXPECTED_DIFFS and r["reason"].startswith(EXPECTED_DIFFS[k]),
                  "a pair differs from COBIx's snapshot without a pinned reason: %r -> %s (%s)"
                  % (k, r["action"], r["reason"][:60]))
    check(seen == set(EXPECTED_DIFFS), "a pinned difference no longer differs: %r" % sorted(set(EXPECTED_DIFFS) - seen))
    check(len(doc["snapshot_differences"]) == len(EXPECTED_DIFFS), "snapshot_differences: %d"
          % len(doc["snapshot_differences"]))


def test_college_tests(doc):
    t = doc["college_tests"]
    # Rule outcomes, with held_at_apply beside them: Moorpark's 4 and 2 of Cabrillo's 3 re-points wait on exhibit
    # grain; Cabrillo's fourth is a pair not here (FIRE-31); Pierce's 33rd and 3 of Chaffey's 11 wait on the apply's key.
    want = {"Modesto Junior College": {"cert_twin": {"person": 8, "repoint": 78}},
            "Moorpark College": {"cert_twin": {"held_at_apply": 4, "repoint": 4}},
            "Cabrillo College": {"cert_twin": {"held_at_apply": 2, "repoint": 3, "skip": 1}},
            "Los Angeles Pierce College": {"left_keep": {"confirm": 32, "person": 3, "skip": 1}},
            "Chaffey College": {"left_keep": {"confirm": 8, "skip": 3}},
            "Las Positas College": {"left_keep": {"confirm": 10, "person": 8}}}
    for college, w in want.items():
        for b, counts in w.items():
            check(t[college].get(b) == counts, "%s %s: %r" % (college, b, t[college].get(b)))
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
    for r in doc["rows"]:
        if r["action"] == "confirm" and br.crosses_groups(r["title_group"].replace("unknown", ""),
                                                          r["canonical_group"].replace("unknown", "")):
            check(r.get("already_mixed"), "a keep that puts a second group on its canonical: %r" % r["local_title"])


def test_guard_matches_exhibits_js():
    """crosses_groups is exhibits.js crossesGroups: run the JS function itself on every pair of group words."""
    src = open(os.path.join(ROOT, "exhibits.js"), encoding="utf-8").read()
    m = re.search(r"function crossesGroups\(a, b\) \{.*?\n  \}", src, re.S)
    check(m is not None, "exhibits.js has no crossesGroups to compare against")
    if not m:
        return
    words = ["graded", "cert", "mixed", ""]
    cases = [[a, b] for a in words for b in words]
    js = m.group(0) + "\nconsole.log(JSON.stringify(%s.map(function (c) { return crossesGroups(c[0] ? {group: c[0]} : null, " \
        "c[1] ? {group: c[1]} : null); })));" % json.dumps(cases)
    try:
        out = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=30, check=True).stdout
    except (OSError, subprocess.SubprocessError) as e:
        check(False, "node could not run exhibits.js crossesGroups: %s" % e)
        return
    got = json.loads(out)
    for (a, b), j in zip(cases, got):
        check(br.crosses_groups(a, b) == j, "crosses_groups(%r, %r) = %r, exhibits.js says %r"
              % (a, b, br.crosses_groups(a, b), j))


def test_never(doc, idx):
    ut0, creds0, arts0 = copy.deepcopy(idx.ut), copy.deepcopy(idx.creds), copy.deepcopy(idx.arts)
    ut1, creds1, arts1, undo, rep = xr.apply_rows(doc["rows"], idx.ut, idx.creds, idx.arts, today="2026-11-18")
    check((idx.ut, idx.creds, idx.arts) == (ut0, creds0, arts0), "the dry run mutated its inputs")
    check(set(ut1) == set(ut0), "a local title key changed")
    check(set(creds0) <= set(creds1), "a canonical key disappeared (renamed)")
    applied = {(a["exhibit_id"], a["local_title"]) for a in rep["applied"]}
    for r in doc["rows"]:
        if r["action"] not in xr.APPLIED_ACTIONS and r["reason"] != br.DUPLICATE:  # a repeat's first row applies
            check((r["exhibit_id"], r["local_title"]) not in applied, "a %s row applied: %r" % (r["action"], r))
        if r["action"] in xr.APPLIED_ACTIONS:
            check(not br.pair_sam_curated(idx, r["local_title"], r["from"]), "a Sam-curated pair is applicable")
    check(rep["counts"]["applied"] == doc["counts"]["apply_dry_run"]["applied"], "the committed dry-run count drifted")
    ut2, creds2, arts2, skipped = xr.undo_pairs(undo, ut1, creds1, arts1)
    check(not skipped and (ut2, creds2, arts2) == (ut0, creds0, arts0), "the undo did not restore: %r" % skipped[:3])
    keep = doc["left_map_keep"]["rows"]
    check(all(x["value"] == "keep" and x["course_id"].startswith("_LEFT_MAP::") for x in keep),
          "a leftover keep row is not a keep")
    confirmed = {}
    for r in doc["rows"]:
        if r["batch"] == "left_keep":
            confirmed.setdefault(r["local_title"], set()).add(r["exhibit_id"] if r["action"] == "confirm" else None)
    for x in keep:
        t = x["course_id"][len("_LEFT_MAP::"):]
        check(None not in confirmed.get(t, {None}) and idx.ids_of.get(t, set()) <= confirmed[t],
              "a keep row settles an exhibit id the rule never confirmed: %r" % t)


def test_committed_shape(doc):
    """On the committed data: 71 title keeps, 2 left out because their titles carry an id outside scope."""
    check(len(doc["left_map_keep"]["rows"]) == 71, "the leftover keep rows are not 71: %d"
          % len(doc["left_map_keep"]["rows"]))
    check(doc["left_map_keep"]["not_written"] == ["AP Exam Calculus BC (Score 3-5)", "AP Exam Chemistry (Score 3-5)"],
          "the keeps left out moved: %r" % doc["left_map_keep"]["not_written"])


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
        "Old AP Chem": {"unified_title": "AP Chemistry", "confidence_title": 0.9, "source_exhibit_ids": ["MAPSAS-OC-1-001"]},
        "AP Chem exam": {"unified_title": "AP Chemistry", "confidence_title": 0.9, "source_exhibit_ids": ["MAPCXS-AC-1-001"]},
        "AP Chem SA": {"unified_title": "AP Chemistry", "confidence_title": 0.9, "source_exhibit_ids": ["MAPSAS-AC-1-001"]},
        # two keys of one wording: the trailing-space key comes first and carries the exhibit
        "AUTO 600 Completion ": {"unified_title": "Intro Auto", "confidence_title": 0.9,
                                 "source_exhibit_ids": ["MAPICI-A6C-1-001"]},
        "AUTO 600 Completion": {"unified_title": "Intro Auto", "confidence_title": 0.9},
        "Old shadow ": {"unified_title": "Shadow Cert", "confidence_title": 0.9, "source_exhibit_ids": ["MAPICI-OS-1-001"]},
        "Old shadow": {"unified_title": "Shadow Cert", "confidence_title": 0.9},
        "Fire Protection 1 or 1A or 2C Certification": {"unified_title": "Fire Protection", "confidence_title": 0.9,
                                                        "source_exhibit_ids": ["MAPICI-FP-1-001"]},
    }
    creds = {"Advanced Agricultural Welding": [{"issuing_agency": "California Community Colleges"}],
             "Firefighter Physical Training": [{"issuing_agency": "California State Fire Training (SFT)"}],
             "Real Estate Practice": [{"issuing_agency": "California Department of Real Estate (DRE)"}],
             "Business Statistics": [{"issuing_agency": "California Community Colleges"}],
             "Dairy Management": [{"issuing_agency": "California Community Colleges"}],
             "Dairy Management (Industry Certification)": [{"issuing_agency": "California Community Colleges"}],
             "Settled Welding": [{"issuing_agency": "California Community Colleges"}],
             "Intro Auto": [{"issuing_agency": "California Community Colleges"}],
             "Fire Protection": [{"issuing_agency": "California State Fire Training (SFT)"}]}
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
        s("MAPICI-SW-1-001", "Sam's welding"),
        s("MAPICI-A6C-1-001", "AUTO 600 Completion"), s("MAPICI-A6C-1-001", "AUTO 600 Completion "),
        s("MAPICI-ZZ-1-001", "AUTO 600 Completion"),
        s("MAPICI-FP-1-001", "Fire Protection 1 or 1A or 2C Certification")])
    got = [(r["action"], r.get("to"), r["reason"].split(" ")[0]) for r in rows]
    check(got[0][:2] == ("repoint", "Advanced Agricultural Welding (Industry Certification)"),
          "the welding twin: %r" % (got[0],))
    check(rows[0]["target_issuer"] == "California Community Colleges", "the twin's issuer is not the college")
    check(got[1][0] == "person" and "specific credential" in rows[1]["reason"], "Firefighter 1 re-pointed")
    check(got[2][0] == "person" and "outside licensing issuer" in rows[2]["reason"], "the DRE title re-pointed")
    check(got[3][0] == "person" and "AP, CLEP" in rows[3]["reason"], "the AP title re-pointed")
    check(got[4][0] == "person" and "graded" in rows[4]["reason"], "a twin holding graded exhibits took a re-point")
    check(got[5][0] == "tap_only", "a Sam-curated pair was not tap-only")
    check(rows[6]["action"] == "repoint" and rows[6]["local_title"] == "AUTO 600 Completion ",
          "the pair did not resolve to the same-wording key that carries its exhibit: %r" % rows[6]["local_title"])
    check(rows[7]["action"] == "skip" and rows[7]["reason"] == br.DUPLICATE, "a repeated scope pair was not skipped")
    check(rows[8]["action"] == "skip" and rows[8]["reason"] == br.NOT_ON_TITLE,
          "a pair whose exhibit id is not on the title was re-pointed")
    check(rows[9]["action"] == "person" and "specific credential" in rows[9]["reason"],
          "a title naming SFT levels 1A and 2C was re-pointed")
    for named in ("Firefighter 1A Certification", "Fire Fighter 1B", "Fire Fighter II"):
        check(br.NAMED.search(named), "%r does not read as a named credential" % named)
    check(not br.NAMED.search("ENGL 1A College Composition - Industry Certification".replace("Certification", "IC")),
          "a course number 1A with no certification word reads as a named credential")
    check(not br.NAMED.search("ENGL 1A College Composition meets certification requirements"),
          "a course number 1A followed later by the word certification reads as a named credential")
    for sft in ("Company Officer 2A-2E Certification", "FTECH 341\tFire Apparatus Driver/Operator 1A - Industry Certification",
                "Fire Fighting Tactics and Strategy Company Officer 2D and 2E Certifications"):
        check(br.NAMED.search(sft), "%r, an SFT level named as a certification, does not read as named" % sft)
    check(not br.NAMED.search("FTECH 321A Fire Service In-Service Training/EMS"),
          "an in-service module reads as a named credential")
    claimed = br.rule_cert_twin(idx, [s("MAPICI-A2AW-1-001", rows[0]["local_title"])],
                                claimed={("MAPICI-A2AW-1-001", rows[0]["local_title"])})
    check(claimed[0]["action"] == "skip", "a pair another rule moves was re-pointed again")

    # kb/exhibit_left_map.json's shape: the leftover titles with their group, and each canonical's group.
    left = {"titles": {"Old AP Biology": {"group": "cert"}, "Old calc": {"group": "cert"}, "Old low": {"group": "cert"},
                       "Old first aid": {"group": "cert"}, "Old physics": {"group": ""},
                       "Old AP Chem": {"group": "cert"}, "Old shadow": {"group": "cert"}},
            "canonicals": {"AP Biology": {"group": "cert"}, "AP Calculus AB": {"group": "cert"},
                           "Boatworks": {"group": "cert"}, "First Aid": {"group": "mixed"},
                           "AP Physics": {"group": "mixed"}, "AP Chemistry": {"group": "mixed"},
                           "Shadow Cert": {"group": "cert"}}}
    rows = br.rule_left_keep(idx, [s("MAPSAS-AB-1-001", "Old AP Biology"), s("MAPSAS-C-1-001", "Old calc"),
                                   s("MAPICI-BW-1-001", "Old low"), s("MAPICI-FA-1-001", "Old first aid"),
                                   s("", "Old physics"), s("MAPSAS-AB2-1-001", "AP - Biology"),
                                   s("MAPSAS-OC-1-001", "Old AP Chem"), s("", "Old shadow"),
                                   s("MAPSAS-AB-1-001", "Old AP Biology")], left)
    acts = [(r["action"], r["reason"].split(":")[0]) for r in rows]
    check(acts[0][0] == "confirm" and rows[0]["to"] == "AP Biology", "the agreeing leftover did not keep: %r" % (acts[0],))
    check(acts[1][0] == "person" and "different canonical" in rows[1]["reason"], "a listing on another canonical kept")
    check(acts[2][0] == "person" and "below 0.80" in rows[2]["reason"], "a low-confidence leftover kept")
    check(acts[3][0] == "person" and rows[3]["reason"].startswith("guard: the Exhibits List's guard"),
          "a cert-based leftover kept where it puts a second group on the canonical")
    check(acts[4][0] == "person" and rows[4]["reason"].startswith("guard: no CPL type"),
          "an untyped leftover kept on a mixed canonical")
    check(acts[5][0] == "skip", "a live title was treated as a leftover")
    check(acts[6][0] == "confirm" and rows[6].get("already_mixed"),
          "a cert-based keep on a canonical other titles already mix was not kept and flagged: %r" % (acts[6],))
    check(acts[7][0] == "skip" and rows[7]["reason"].startswith("waits on the apply"),
          "a title the apply would read as another key was confirmed")
    check(acts[8][0] == "skip" and rows[8]["reason"] == br.DUPLICATE, "a repeated scope pair was kept twice")
    left["titles"]["Old AP Biology"]["reviewed"] = True
    sam = br.rule_left_keep(idx, [s("MAPSAS-AB-1-001", "Old AP Biology")], left)
    check(sam[0]["action"] == "tap_only", "a Sam-reviewed leftover was not settled")


def test_committed_is_current(doc):
    with open(br.OUT, encoding="utf-8") as f:
        check(f.read() == br.dumps(doc), "kb/exhibit_blocker_rules_list.json is stale: run "
                                         "python3 kb/exhibit_blocker_rules.py")


def test_apply_refuses_a_stale_list(committed):
    """COBIx on #3515: the apply is the hard gate. A list whose input hashes no longer match is refused before any
    write; the apply's hash agrees with the builder's, so a current list is never refused."""
    import tempfile
    import _cred_rename_apply as cra
    current = committed.get("inputs") == br.input_hashes()
    check((cra.stale_list_inputs(committed) == []) == current,
          "the apply's stale check disagrees with the builder's input_hashes")
    check(cra.stale_list_inputs({"rows": []}) == [], "a list that records no inputs reads as stale")
    forged = copy.deepcopy(committed)
    forged["inputs"]["kb/unified_titles.json"] = "0" * 16
    check("kb/unified_titles.json" in [s[0] for s in cra.stale_list_inputs(forged)],
          "a forged input hash did not read as stale")
    writes = []
    real_write = cra._atomic_write_json
    cra._atomic_write_json = lambda path, obj: writes.append(path)
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "forged_list.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(forged, f)
        try:
            cra.pairs_main(["--pairs", path])
            check(False, "the apply ran a list whose inputs changed since it was built")
        except SystemExit as e:
            check("Rebuild it first" in str(e), "the apply's refusal does not say to rebuild: %r" % e)
        finally:
            cra._atomic_write_json = real_write
    check(writes == [], "the apply wrote %d file(s) before refusing a stale list" % len(writes))


def main():
    idx = br.load_index()
    doc = br.build(idx)
    with open(br.OUT, encoding="utf-8") as f:
        committed = json.load(f)
    if committed.get("inputs") == br.input_hashes():
        test_committed_is_current(doc)
        test_committed_counts(doc)
        test_pairs_against_snapshot(doc)
        test_college_tests(doc)
        test_committed_shape(doc)
    else:
        moved = sorted(k for k, v in br.input_hashes().items() if (committed.get("inputs") or {}).get(k) != v)
        print("NOTICE: the inputs moved since kb/exhibit_blocker_rules_list.json was built (%s). The count, pair, "
              "college and rebuild checks are skipped; rebuild with python3 kb/exhibit_blocker_rules.py before the "
              "apply." % ", ".join(moved))
    test_guard(doc, idx)
    test_never(doc, idx)
    test_guard_matches_exhibits_js()
    test_rule_fixtures()
    test_apply_refuses_a_stale_list(committed)
    if FAILS:
        sys.exit("%d check(s) failed" % len(FAILS))
    print("exhibit_blocker_rules_test: all checks passed")


if __name__ == "__main__":
    main()
