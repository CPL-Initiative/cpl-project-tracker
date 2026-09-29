#!/usr/bin/env python3
"""Fixture checks for kb/_uc_cur_promote.py — the promote step that turns a
transient UC-CUR placeholder (a client mint on the CCR tab, or the auto-merge
bot's target) into a real M-ID record, built before the first one appears
(0 placeholders on 2026-09-04).

One check per failure the tool must never produce: a number already minted
handed out again (courses, singletons, curation keys, alias-map history, the
CCN/C-ID reservations); a placeholder promoted on a guessed discipline or band;
a single pointer minted as if it were a merge; an umbrella discipline collapsed
to its residual code; a full bucket overflowing instead of continuing into the
next band digit (Sam, 2026-09-03, card 11); a promoted record without its
stamp, title, discipline or members; a member's college course counted twice
(the record has no membership entry); a pointer left on the placeholder; a
receipt applied twice; a receipt cut under a different plan passing P1.

Run from repo root: python3 tests/uc_cur_promote_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _zband_retire_dryrun as zdry  # noqa: E402
import _uc_cur_promote as pro  # noqa: E402
from _authority_recode_apply import plan_fidelity  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


def rec(disc, s4, title, **kw):
    r = {"id_system": "M-ID", "common_title": title, "subject": s4, "subject_4letter": s4,
         "discipline": disc, "typical_units": 3.0, "credit_status": "Credit", "top_code": "0899.00",
         "confidence": 0.8, "description": None, "cte": False}
    r.update(kw)
    return r


courses = {
    "MATH M1001": rec("Mathematics", "MATH", "Calculus I"),
    "MATH M1002": rec("Mathematics", "MATH", "Calculus I Honors", description="Limits and derivatives."),
    "ESOL M9001": rec("English as a Second Language", "ESOL", "ESL Reading A", credit_status="Noncredit", typical_units=0.0),
    "ESOL M9002": rec("English as a Second Language", "ESOL", "ESL Reading B", credit_status="Noncredit", typical_units=0.0),
    "FLSP M1001": rec("Foreign Languages", "FLSP", "Spanish Conversation I"),
    "FLSP M1002": rec("Foreign Languages", "FLSP", "Conversational Spanish"),
    "WELD M1001": rec("Welding", "WELD", "Welding Fundamentals"),
    "WELD M1002": rec("Welding", "WELD", "Basic Welding"),
    "XXXX M1001": rec(None, "XXXX", "Mystery Course"),
    "XXXX M1002": rec(None, "XXXX", "Mystery Course Too"),
    "HIST M1001": rec("History", "HIST", "World History"),
}
# WELD's credit bucket is full: every number 001..999 is taken (Sam's card 11 case)
for n in range(3, 1000):
    courses[f"WELD M1{n:03d}"] = rec("Welding", "WELD", f"Welding Topic {n}")
for k, r in courses.items():
    r["course_id"] = k
singletons = {"MATH M10AB": dict(rec("Mathematics", "MATH", "Calculus Lab"), course_id="MATH M10AB",
                                 college="College C", control_number="CCC3")}
memberships = {k: [{"college": "College A", "subject": v["subject"], "course_number": "1", "control_number": "CCC1"}]
               for k, v in courses.items()}
memberships["MATH M1002"] = [{"college": "College B", "subject": "MATH", "course_number": "2", "control_number": "CCC2"},
                             {"college": "College A", "subject": "MTH", "course_number": "3", "control_number": "CCC4"}]
R = {"reviewed_by": "curator@rccd.edu", "reviewed_at": "2026-09-04T00:00:00+00:00"}
B = {"reviewed_by": "automerge-v1@bot", "reviewed_at": "2026-09-04T00:00:00+00:00"}
curations = {
    # a client mint: title + discipline on the self row, three pointers (one a CN: re-home)
    "UC-CUR-K3J9X1": dict(unified_title="Calculus Fundamentals", discipline="Mathematics", **R),
    "MATH M1001": dict(merge_into="UC-CUR-K3J9X1", **R),
    "MATH M1002": dict(merge_into="UC-CUR-K3J9X1", **R),
    "CN:CCC000000123": dict(merge_into="UC-CUR-K3J9X1", **R),
    # the bot: title only, discipline from the members, noncredit
    "UC-CUR-AUTO0AB1CD23": dict(unified_title="ESL Reading", **B),
    "ESOL M9001": dict(merge_into="UC-CUR-AUTO0AB1CD23", **B),
    "ESOL M9002": dict(merge_into="UC-CUR-AUTO0AB1CD23", **B),
    # an umbrella discipline keeps the members' split code
    "UC-CUR-FLX": dict(unified_title="Spanish Conversation", discipline="Foreign Languages", **R),
    "FLSP M1001": dict(merge_into="UC-CUR-FLX", **R),
    "FLSP M1002": dict(merge_into="UC-CUR-FLX", **R),
    # a full bucket continues into the next band digit
    "UC-CUR-WELDFULL": dict(unified_title="Welding Fundamentals", discipline="Welding", **R),
    "WELD M1001": dict(merge_into="UC-CUR-WELDFULL", **R),
    "WELD M1002": dict(merge_into="UC-CUR-WELDFULL", **R),
    # held: one pointer; held: no discipline anywhere; held: self row only
    "UC-CUR-ONE": dict(unified_title="Lonely", discipline="History", **R),
    "HIST M1001": dict(merge_into="UC-CUR-ONE", **R),
    "UC-CUR-NODISC": dict(unified_title="Mystery", **R),
    "XXXX M1001": dict(merge_into="UC-CUR-NODISC", **R),
    "XXXX M1002": dict(merge_into="UC-CUR-NODISC", **R),
    "UC-CUR-ORPHAN": dict(unified_title="Nobody points here", discipline="Mathematics", **R),
    # an unrelated row that must come through byte-identical
    "HIST M1001x": {"unified_title": "World History (curated)", **R},
}
canon_doc = {"disciplines": {"Mathematics": {"canonical_subj4": "MATH"},
                             "English as a Second Language": {"canonical_subj4": "ESOL"},
                             "Foreign Languages": {"canonical_subj4": "FLNG"},
                             "Kinesiology": {"canonical_subj4": "KINE"},
                             "Welding": {"canonical_subj4": "WELD"},
                             "History": {"canonical_subj4": "HIST"}},
             "_aliases": {"Mathematics": ["Math"]}}
fl_doc = {"languages": {"Spanish": {"subj4": "FLSP"}}, "residual_subj4": "FLNG"}
reservations = {("MATH", "1"): {3}}          # MATH C1003 exists → 003 is never an M number
extra_reserved = {"MATH M1004"}               # an alias map once named MATH M1004 → reserved forever

plan = pro.compute_plan(copy.deepcopy(courses), copy.deepcopy(singletons), copy.deepcopy(curations), {}, {},
                        canon_doc, fl_doc, reservations, extra_reserved)
A, H = plan["alias"], plan["held"]

check("the client mint is planned onto the discipline's canonical code, band 1, the lowest FREE number "
      "(001/002 taken, 003 reserved by CCN, 004 named by an alias map → 005)",
      A.get("UC-CUR-K3J9X1") == "MATH M1005")
check("the CN: re-home pointer counts as a member (3 members)", plan["rows"]["UC-CUR-K3J9X1"]["members"] == 3)
check("the client mint keeps its curator (reviewed_by / reviewed_at on the row)",
      plan["rows"]["UC-CUR-K3J9X1"]["reviewed_by"] == "curator@rccd.edu"
      and plan["rows"]["UC-CUR-K3J9X1"]["origin"] == "curator mint")
check("the bot's target takes the members' modal discipline and the NONCREDIT band → ESOL M9003",
      A.get("UC-CUR-AUTO0AB1CD23") == "ESOL M9003"
      and plan["rows"]["UC-CUR-AUTO0AB1CD23"]["discipline_source"] == "members' modal discipline"
      and plan["rows"]["UC-CUR-AUTO0AB1CD23"]["origin"] == "machine cluster")
check("an umbrella discipline keeps the members' split code (FLSP, not the residual FLNG)",
      A.get("UC-CUR-FLX") == "FLSP M1003")
check("a full credit bucket continues into the next band digit (WELD M2001), not an overflow",
      A.get("UC-CUR-WELDFULL") == "WELD M2001" and plan["rows"]["UC-CUR-WELDFULL"]["how"] == "continuation band"
      and plan["validation"]["V4_no_overflow"]["pass"])
check("a single pointer is HELD (a mint is a merge)", "UC-CUR-ONE" in H and "fewer than two" in H["UC-CUR-ONE"]["why"])
check("no discipline anywhere is HELD, never guessed", "UC-CUR-NODISC" in H and "no discipline" in H["UC-CUR-NODISC"]["why"])
check("a self row nobody points at is HELD and surfaced", "UC-CUR-ORPHAN" in H)
check("held placeholders are not in the alias map", not (set(H) & set(A)))
check("every validation passes on the fixture", all(v["pass"] for v in plan["validation"].values()))
check("new ids are unique, M-shaped, four-letter SUBJ4, disjoint from every existing key",
      len(set(A.values())) == len(A) and all(zdry.M_CORR_RE.match(v) for v in A.values())
      and not (set(A.values()) & (set(courses) | set(singletons) | set(curations) | extra_reserved)))
check("the discipline alias file resolves a spelling ('Math' → Mathematics) before the code lookup",
      pro.compute_plan(copy.deepcopy(courses), copy.deepcopy(singletons),
                       dict(copy.deepcopy(curations), **{"UC-CUR-K3J9X1": dict(unified_title="Calculus Fundamentals", discipline="Math", **R)}),
                       {}, {}, canon_doc, fl_doc, reservations, extra_reserved)["alias"].get("UC-CUR-K3J9X1") == "MATH M1005")

# ── the apply on deep copies ────────────────────────────────────────────────
docs = {"courses": {"count": len(courses), "courses": copy.deepcopy(courses)},
        "singletons": {"count": len(singletons), "courses": copy.deepcopy(singletons)},
        "memberships": {"memberships": copy.deepcopy(memberships)},
        "curation": {"curations": copy.deepcopy(curations)}}
orig = {"courses": copy.deepcopy(courses), "memberships": copy.deepcopy(memberships),
        "curation": copy.deepcopy(curations), "common": {}}
stats, materialized = pro.apply_plan(docs, plan, "2026-09-04T00:00:00Z", "2026-09-04")
gates = pro.post_gates(orig, docs, plan, materialized)
for gname, ok in gates.items():
    check("gate: " + gname, ok)
cur2 = docs["curation"]["curations"]
c2 = docs["courses"]["courses"]
check("the self row moved under the new key and the pointers follow it",
      "UC-CUR-K3J9X1" not in cur2 and cur2["MATH M1005"]["unified_title"] == "Calculus Fundamentals"
      and cur2["MATH M1001"]["merge_into"] == "MATH M1005" and cur2["CN:CCC000000123"]["merge_into"] == "MATH M1005")
check("held placeholders and their pointers are untouched",
      cur2["UC-CUR-ONE"] == curations["UC-CUR-ONE"] and cur2["HIST M1001"]["merge_into"] == "UC-CUR-ONE"
      and "UC-CUR-ORPHAN" in cur2)
r = c2["MATH M1005"]
check("the record: stamp, origin, curator, title, discipline, the members' aggregate, no membership entry",
      r["_promoted_from"] == "UC-CUR-K3J9X1" and r["origin"] == "curator mint" and r["reviewed_by"] == "curator@rccd.edu"
      and r["common_title"] == "Calculus Fundamentals" and r["discipline"] == "Mathematics"
      and r["corroboration_members"] == 3 and r["source_college_count"] == 2
      and "MATH M1005" not in docs["memberships"]["memberships"] and r["_machine_cluster_members"] == ["CN:CCC000000123", "MATH M1001", "MATH M1002"])
check("the bot's record carries origin machine cluster and no curator",
      c2["ESOL M9003"]["origin"] == "machine cluster" and c2["ESOL M9003"]["reviewed_by"] is None
      and c2["ESOL M9003"]["credit_status"] == "Noncredit")
check("ripple counts: 4 keys, 9 pointers, 4 materialized",
      stats["curation_keys"] == 4 and stats["curation_pointers"] == 9 and stats["materialized"] == 4)
check("the courses doc carries the era stamp", docs["courses"]["_uc_cur_promoted"] == ["2026-09-04T00:00:00Z"])

# P0: a second run sees the stamps
check("P0: the promoted placeholders are detected as already promoted",
      pro.already_promoted(c2, plan["alias"]) == sorted(plan["alias"]))
# P1: a receipt cut under a different plan is caught
frozen = {"aliases": {ph: {"new_id": nid} for ph, nid in plan["alias"].items()}}
ok, drift = plan_fidelity(plan, frozen)
check("P1: the frozen receipt of this plan passes", ok and not drift)
frozen["aliases"]["UC-CUR-FLX"]["new_id"] = "FLNG M1001"
ok, drift = plan_fidelity(plan, frozen)
check("P1: a receipt with a different new id is refused", not ok and drift == ["UC-CUR-FLX"])

# ── the committed files: nothing to promote today ───────────────────────────
def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)

real_cur = load("kb/coci_curation.json")["curations"]
found = pro.find_placeholders(real_cur)
check("committed files: 0 placeholders in the overlay today (the tool exits with nothing to promote)", not found)
check("committed files: the alias-map history is readable (reserved ids > 10,000)", len(pro.reserved_alias_ids()) > 10000)

passed = sum(1 for _, ok in results if ok)
print("\n%d/%d assertions passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) and results else 1)
