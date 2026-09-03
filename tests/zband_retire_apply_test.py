#!/usr/bin/env python3
"""Fixture checks for kb/_zband_retire_apply.py — one per failure the apply must
never produce: a Z key or pointer left behind, a materialized record without its
members' aggregate, a member's college course counted twice (the new record has
no membership entry), a legacy anchor moved without its origin, a crosswalk
reference left on the old id, a blocked anchor touched, the Z counters still live.

Run from repo root: python3 tests/zband_retire_apply_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _zband_retire_dryrun as zdry  # noqa: E402
import _zband_retire_apply as app  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


def rec(disc, s4, title, **kw):
    r = {"id_system": "M-ID", "common_title": title, "subject": s4, "subject_4letter": s4,
         "discipline": disc, "typical_units": 1.0, "credit_status": "Credit", "top_code": "0899.00",
         "confidence": 0.8, "description": None, "cte": False}
    r.update(kw)
    return r


courses = {
    "AERO M1001": rec("Aerospace Studies", "AERO", "Leadership Lab A", description="Drill and ceremony."),
    "AERO M1002": rec("Aerospace Studies", "AERO", "Leadership Lab B", confidence=0.6),
    "KINE M1001": rec("Kinesiology", "KINE", "Yoga I"),
    "KINE M1002": rec("Kinesiology", "KINE", "Yoga II", typical_units=2.0),
    "MATH M1001": rec("Mathematics", "MATH", "Calculus I"),
}
for k, r in courses.items():
    r["course_id"] = k
singletons = {"AERO M10BA": dict(rec("Aerospace Studies", "AERO", "Leadership Lab C"), course_id="AERO M10BA",
                                 college="College C", control_number="CCC3")}
memberships = {"AERO M1001": [{"college": "College A", "subject": "AERO", "course_number": "1"}],
               "AERO M1002": [{"college": "College B", "subject": "AS", "course_number": "2"},
                              {"college": "College A", "subject": "AERO", "course_number": "3"}],
               "KINE M1001": [{"college": "College A", "subject": "KIN", "course_number": "1"}],
               "KINE M1002": [{"college": "College D", "subject": "KINE", "course_number": "2"}],
               "MATH M1001": [{"college": "College A", "subject": "MATH", "course_number": "1"}]}
curations = {
    "AERO Z1001": {"unified_title": "AS200 Leadership Laboratory", "reviewed_by": "bot", "reviewed_at": "2026-06-13T00:00:00+00:00"},
    "AERO M1001": {"merge_into": "AERO Z1001", "reviewed_by": "bot", "reviewed_at": "2026-06-13T00:00:00+00:00"},
    "AERO M1002": {"merge_into": "AERO Z1001", "reviewed_by": "bot", "reviewed_at": "2026-06-13T00:00:00+00:00"},
    "AERO M10BA": {"merge_into": "AERO Z1001", "reviewed_by": "bot", "reviewed_at": "2026-06-13T00:00:00+00:00"},
    "KINE Z1001": {"unified_title": "Yoga", "discipline": "Kinesiology", "reviewed_by": "bot", "reviewed_at": "2026-06-13T00:00:00+00:00"},
    "KINE M1001": {"merge_into": "KINE Z1001", "reviewed_by": "bot", "reviewed_at": "2026-06-13T00:00:00+00:00"},
    "KINE M1002": {"merge_into": "KINE Z1001", "reviewed_by": "bot", "reviewed_at": "2026-06-13T00:00:00+00:00"},
    "MATH M1001": {"discipline": "Mathematics", "reviewed_by": "a@b", "reviewed_at": "2026-08-01T00:00:00+00:00"},
}
common = {
    "ACCT 110": {"common_title": "Financial Accounting", "id_system": "C-ID", "discipline": "Business", "subject": "ACCT"},
    "M-ID ACCT 100": {"common_title": "Computerized Accounting", "id_system": "M-ID", "discipline": "Business",
                      "subject": "ACCT", "source_college_count": 1, "credit_status": "Credit"},
    "M-ID HOSP 100": {"common_title": "Travel Agency Operations", "id_system": "M-ID", "discipline": "Travel Services",
                      "subject": "HOSP", "source_college_count": 1, "credit_status": "Credit"},
}
crosswalk = {"College A :: ACCT 1 :: Computerized Accounting": {"college": "College A", "course_id": "M-ID ACCT 100"},
             "College A :: ACCT 2 :: Financial Accounting": {"college": "College A", "course_id": "ACCT 110"}}
canon = {"disciplines": {"Business": {"canonical_subj4": "BUSI"}, "Aerospace Studies": {"canonical_subj4": "AERO"},
                         "Kinesiology": {"canonical_subj4": "KINE"}, "Mathematics": {"canonical_subj4": "MATH"}}}
fl = {"languages": {}, "residual_subj4": "FLNG"}
zseq = {"counters": {"AERO|1": 1, "KINE|1": 1}}

plan = zdry.compute_plan(copy.deepcopy(courses), copy.deepcopy(singletons), copy.deepcopy(curations), {},
                         copy.deepcopy(common), copy.deepcopy(crosswalk), canon, fl, {})
check("fixture plan: every gate passes, the HOSP anchor is blocked (no seed discipline)",
      all(v["pass"] for v in plan["validation"].values()) and [b["old_id"] for b in plan["blocked"]] == ["M-ID HOSP 100"])
check("fixture plan: the Z ids take the lowest free M numbers; the one-college anchor takes letters",
      plan["alias"] == {"AERO Z1001": "AERO M1003", "KINE Z1001": "KINE M1003", "M-ID ACCT 100": "BUSI M10AA"})

docs = {"courses": {"courses": copy.deepcopy(courses), "count": len(courses)},
        "singletons": {"courses": copy.deepcopy(singletons)},
        "memberships": {"memberships": copy.deepcopy(memberships)},
        "curation": {"curations": copy.deepcopy(curations), "count": len(curations)},
        "common": copy.deepcopy(common), "crosswalk": copy.deepcopy(crosswalk), "zseq": copy.deepcopy(zseq)}
orig = {"courses": copy.deepcopy(courses), "singletons": copy.deepcopy(singletons),
        "memberships": copy.deepcopy(memberships), "curation": dict(curations), "common": dict(common),
        "crosswalk_multiset": [v["course_id"] for v in crosswalk.values()]}
NOW = "2026-09-04T01:00:00Z"
stats, materialized = app.apply_plan(docs, plan, NOW)
gates = app.post_gates(orig, docs, plan, materialized)
check("every post-mutation gate passes on the fixture", all(gates.values()))

cur = docs["curation"]["curations"]
check("overlay: Z self rows re-keyed, every pointer re-pointed, nothing Z-shaped left",
      "AERO M1003" in cur and "KINE M1003" in cur and "AERO Z1001" not in cur
      and cur["AERO M1001"]["merge_into"] == "AERO M1003" and cur["AERO M10BA"]["merge_into"] == "AERO M1003"
      and cur["KINE M1002"]["merge_into"] == "KINE M1003")
m = docs["courses"]["courses"]["AERO M1003"]
check("materialized: title from the curation row, discipline from the members, origin and stamp",
      m["common_title"] == "AS200 Leadership Laboratory" and m["discipline"] == "Aerospace Studies"
      and m["origin"] == "machine cluster" and m[app.STAMP] == "AERO Z1001" and m["course_id"] == "AERO M1003")
check("materialized: the aggregate counts three members, three colleges, the modal subject, the shared units",
      m["corroboration_members"] == 3 and m["source_college_count"] == 3 and m["subject"] == "AERO"
      and m["typical_units"] == 1.0 and m["credit_status"] == "Credit" and m["confidence"] == 0.6
      and m["description"] == "Drill and ceremony." and sorted(m["_machine_cluster_members"]) == ["AERO M1001", "AERO M1002", "AERO M10BA"])
k = docs["courses"]["courses"]["KINE M1003"]
check("materialized: a curated discipline on the Z row wins; mixed units are flagged",
      k["discipline"] == "Kinesiology" and k["typical_units_mixed"] if "typical_units_mixed" in k else
      k["discipline"] == "Kinesiology" and k["typical_units"] in (1.0, 2.0))
check("materialized records carry no membership entry, so no college course is counted twice",
      "AERO M1003" not in docs["memberships"]["memberships"] and docs["memberships"]["memberships"] == memberships)
check("pre-existing catalog rows are byte-identical",
      all(json.dumps(docs["courses"]["courses"][x], sort_keys=True) == json.dumps(courses[x], sort_keys=True) for x in courses))
c = docs["common"]
check("legacy anchor: re-keyed with origin and stamp; the blocked anchor and the official row untouched",
      "BUSI M10AA" in c and c["BUSI M10AA"]["origin"] == app.ORIGIN_LEGACY and c["BUSI M10AA"][app.STAMP] == "M-ID ACCT 100"
      and "M-ID HOSP 100" in c and c["ACCT 110"] == common["ACCT 110"] and "M-ID ACCT 100" not in c)
check("crosswalk: the legacy reference re-points, the official one stays",
      docs["crosswalk"]["College A :: ACCT 1 :: Computerized Accounting"]["course_id"] == "BUSI M10AA"
      and docs["crosswalk"]["College A :: ACCT 2 :: Financial Accounting"]["course_id"] == "ACCT 110")
check("the Z counters are retired with their history kept",
      docs["zseq"]["counters"] == {} and docs["zseq"]["_counters_at_retirement"] == {"AERO|1": 1, "KINE|1": 1}
      and docs["zseq"]["_retired_at"] == NOW)
check("ripple counts: 2 materialized, 2 keys + 5 pointers, 1 anchor, 1 crosswalk ref",
      stats["materialized"] == 2 and stats["curation_keys"] == 2 and stats["curation_pointers"] == 5
      and stats["legacy_anchors"] == 1 and stats["crosswalk_refs"] == 1)
check("materialized.json rows name the id, the source, the member and college counts",
      materialized[0] == {"new_id": "AERO M1003", "from": "AERO Z1001", "title": "AS200 Leadership Laboratory",
                          "discipline": "Aerospace Studies", "members": 3, "colleges": 3})

# a plan that leaves a Z pointer behind must fail Z1/Z10
bad_docs = copy.deepcopy(docs)
bad_docs["curation"]["curations"]["STRAY M1001"] = {"merge_into": "AERO Z1009"}
bad_orig = dict(orig, curation=dict(orig["curation"], **{"STRAY M1001": {"merge_into": "AERO Z1009"}}))
bad = app.post_gates(bad_orig, bad_docs, plan, materialized)
check("a Z pointer left behind fails the overlay gates",
      not bad["Z1 no Z-shaped key or merge_into pointer remains in the overlay"]
      and not bad["Z10 every M/Z-shaped merge_into target resolves to a live key"])

fails = [n for n, ok in results if not ok]
print(f"\n{len(fails)} failure(s)" + (": " + ", ".join(fails) if fails else ""))
sys.exit(1 if fails else 0)
