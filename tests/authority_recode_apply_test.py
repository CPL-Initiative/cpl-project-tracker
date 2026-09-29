#!/usr/bin/env python3
"""Fixture checks for kb/_authority_recode_apply.py — one per failure the apply
must never produce: a moved row without its stamp, an untouched row touched, a
ghost identities key not healed, a pointer left on the old key, a counter left
under the old prefix, the seed not carrying the ruled code, and a plan that
differs from the frozen receipt slipping through.

Run from repo root: python3 tests/authority_recode_apply_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _authority_recode_dryrun as dry  # noqa: E402
import _authority_recode_apply as app  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


class FLDry:
    """The FL classifier stub: no Foreign Languages rows in the fixture."""
    def classify_mid(self, mid, rec):
        return (None, "none")

    def classify_singleton(self, rec):
        return (None, "none")


def rec(disc, s4, title, subject=None):
    return {"course_id": None, "id_system": "M-ID", "common_title": title, "subject": subject or s4,
            "subject_4letter": s4, "discipline": disc, "typical_units": 3.0, "confidence": 0.9}


courses = {
    "THEA M1001": rec("Drama/Theater Arts", "THEA", "Acting I"),
    "THTR M1002": rec("Drama/Theater Arts", "THTR", "Stagecraft"),      # a stray already on the new code
    "FIMS M1001": rec("Film and Media Studies", "FIMS", "Film History"),
    "FIMP M1001": rec("Media Production", "FIMP", "Video Production"),  # fan-in: FTVE M1001 is Film's
    "MATH M1001": rec("Mathematics", "MATH", "Calculus I"),
}
for k, r in courses.items():
    r["course_id"] = k
singletons = {"CISC M10AA": dict(rec("Computer Science", "CISC", "Intro Programming"), course_id="CISC M10AA",
                                 college="A", control_number="CCC1")}
memberships = {k: [{"college": "A", "subject": k.split()[0], "course_number": "1", "units": 3.0,
                    "credit_status": "Credit", "top_code": "1000.00"}] for k in courses}
identities = {"THEA M1001": {"discipline": "Drama/Theater Arts", "lev": 7},
              "THTR M1001": {"discipline": "Drama/Theater Arts", "ghost": True},   # pre-fold ghost
              "MATH M1001": {"discipline": "Mathematics", "lev": 2}}
articulations = [{"course_id": "THEA M1001", "x": 1}, {"course_id": "MATH M1001", "x": 2},
                 {"course_id": "THEA M1001", "x": 3}]
curations = {"THEA M1001": {"discipline": "Drama/Theater Arts", "reviewed_by": "a@b", "reviewed_at": "2026-08-01T00:00:00+00:00"},
             "MATH M1001": {"merge_into": "THEA M1001", "reviewed_by": "a@b", "reviewed_at": "2026-08-02T00:00:00+00:00"},
             "THEA Z1001": {"unified_title": "Acting Lab", "reviewed_by": "bot", "reviewed_at": "2026-06-13T00:00:00+00:00"}}
canon = {"disciplines": {d: {"canonical_subj4": c} for d, c in [
    ("Drama/Theater Arts", "THEA"), ("Film and Media Studies", "FIMS"), ("Media Production", "FIMP"),
    ("Computer Science", "CISC"), ("Mathematics", "MATH"), ("Foreign Languages", "FLNG"),
    ("Agriculture", "AGRI"), ("Agricultural Production", "AGPR"),
    ("Child Development/Early Childhood Education", "ECED"), ("Computer Information Systems", "CSIS"),
    ("Office Technologies", "OTEC")]}}
fl = {"languages": {}, "residual_subj4": "FLNG"}
with open(os.path.join(ROOT, "kb", "csr_authority_codes_rulings_2026-09-03.json"), encoding="utf-8") as f:
    rulings = json.load(f)
zseq = {"counters": {"THEA|1": 1, "FIMP|1": 2, "FTVE|1": 1, "MATH|1": 4}}

plan = dry.compute_plan(copy.deepcopy(courses), copy.deepcopy(singletons), memberships,
                        copy.deepcopy(curations), copy.deepcopy(identities), canon, fl, rulings, {}, FLDry())
check("fixture plan: 7/7 validations, no rulings drift",
      all(v["pass"] for v in plan["validation"].values()) and not plan["problems"])
check("fixture plan: Theater keeps its number onto the ghost key, Media Production gap-fills after Film",
      plan["alias"].get("THEA M1001") == "THTR M1001" and plan["alias"].get("FIMS M1001") == "FTVE M1001"
      and plan["alias"].get("FIMP M1001") == "FTVE M1002" and plan["alias"].get("CISC M10AA") == "COMP M10AA"
      and plan["alias"].get("THEA Z1001") == "THTR Z1001" and "THTR M1002" not in plan["alias"])

docs = {"courses": {"courses": copy.deepcopy(courses)}, "singletons": {"courses": copy.deepcopy(singletons)},
        "memberships": {"memberships": copy.deepcopy(memberships)},
        "articulations": {"articulations": copy.deepcopy(articulations), "identities": copy.deepcopy(identities)},
        "curation": {"curations": copy.deepcopy(curations), "count": len(curations)},
        "canonical": copy.deepcopy(canon), "fl": copy.deepcopy(fl), "zseq": copy.deepcopy(zseq)}
orig = {"courses": copy.deepcopy(courses), "singletons": copy.deepcopy(singletons),
        "memberships": dict(memberships), "art_multiset": [a["course_id"] for a in articulations],
        "curation": dict(curations)}
edits = dry.seed_edits(plan, canon, fl)
NOW = "2026-09-03T23:00:00Z"
stats = app.apply_plan(docs, plan, edits, NOW)
gates = app.post_gates(orig, docs, plan)

check("every post-mutation gate passes on the fixture", all(gates.values()))
nc = docs["courses"]["courses"]
check("moved row: new key, course_id, subject_4letter and the stamp agree",
      "THEA M1001" not in nc and nc["THTR M1001"]["course_id"] == "THTR M1001"
      and nc["THTR M1001"]["subject_4letter"] == "THTR" and nc["THTR M1001"][app.STAMP] == "THEA M1001")
check("fan-in: Film holds FTVE M1001, Media Production FTVE M1002, disciplines unchanged",
      nc["FTVE M1001"]["discipline"] == "Film and Media Studies" and nc["FTVE M1002"]["discipline"] == "Media Production")
check("untouched stray THTR M1002 is byte-identical",
      json.dumps(nc["THTR M1002"], sort_keys=True) == json.dumps(courses["THTR M1002"], sort_keys=True))
check("singleton re-keyed with its stamp",
      docs["singletons"]["courses"]["COMP M10AA"][app.STAMP] == "CISC M10AA")
nm = docs["memberships"]["memberships"]
check("memberships keys follow the catalog", "THTR M1001" in nm and "FTVE M1002" in nm and "THEA M1001" not in nm)
arts = docs["articulations"]["articulations"]
check("articulations re-pointed, the rest untouched",
      [a["course_id"] for a in arts] == ["THTR M1001", "MATH M1001", "THTR M1001"])
ident = docs["articulations"]["identities"]
check("identities: the ghost key is healed by the moved entry (moved wins), count drops by one",
      ident["THTR M1001"].get("lev") == 7 and "ghost" not in ident["THTR M1001"]
      and len(ident) == len(identities) - 1 and stats["identities_ghosts_healed"] == 1)
cur = docs["curation"]["curations"]
check("curation: key moved, pointer re-pointed, Z self row moved with its namespace",
      "THTR M1001" in cur and cur["MATH M1001"]["merge_into"] == "THTR M1001" and "THTR Z1001" in cur
      and "THEA M1001" not in cur and "THEA Z1001" not in cur)
check("zseq counters move to the new prefix and merge-add on the fan-in",
      docs["zseq"]["counters"] == {"THTR|1": 1, "FTVE|1": 3, "MATH|1": 4})
sd = docs["canonical"]["disciplines"]
check("seed: ruled codes written with a dated note, needs_review cleared",
      sd["Drama/Theater Arts"]["canonical_subj4"] == "THTR" and "item 7" in sd["Drama/Theater Arts"]["_notes"]
      and sd["Computer Science"]["canonical_subj4"] == "COMP" and sd["Media Production"]["canonical_subj4"] == "FTVE"
      and sd["Drama/Theater Arts"]["needs_review"] is False)
check("seed: the fan-in pair is recorded on both disciplines, not as an alias fold",
      sd["Media Production"]["fan_in_with"] == ["Film and Media Studies"]
      and sd["Film and Media Studies"]["fan_in_with"] == ["Media Production"])
check("seed: the agriculture umbrellas carry the family codes plus their own residual",
      sd["Agriculture"]["is_umbrella"] is True and set(sd["Agriculture"]["umbrella_codes"]) == {"AGAB", "AGAS", "AGPS", "AGEH", "AGMA", "AGRI"}
      and set(sd["Agricultural Production"]["umbrella_codes"]) == {"AGAB", "AGAS", "AGPS", "AGEH", "AGMA", "AGPR"}
      and sd["Agriculture"]["umbrella_group"] == "agriculture")
check("seed: Foreign Languages is flagged as an umbrella on FLNG",
      sd["Foreign Languages"]["is_umbrella"] is True and "FLNG" in sd["Foreign Languages"]["umbrella_codes"])
check("stamps: the applied-at marker is on every mutated doc",
      all(docs[k].get(app.APPLIED) == NOW for k in ("courses", "singletons", "memberships", "articulations", "canonical", "fl")))

# P1 fidelity
frozen = {"aliases": {old: {"new_id": new} for old, new in plan["alias"].items()}}
check("P1: the recomputed plan equals its own frozen receipt", app.plan_fidelity(plan, frozen) == (True, []))
tampered = json.loads(json.dumps(frozen))
tampered["aliases"]["THEA M1001"]["new_id"] = "THTR M1003"
ok, drift = app.plan_fidelity(plan, tampered)
check("P1: one differing key is caught and named", not ok and drift == ["THEA M1001"])

# P3 freshness
fresh_ok = {"distinct_course_ids": 3, "newest_reviewed_at": "2026-08-02 00:00:00+00"}
fresh_stale = {"distinct_course_ids": 4, "newest_reviewed_at": "2026-08-02 00:00:00+00"}
check("P3: a fresh read with the same count and newest reviewed_at matches, whatever the timestamp format",
      app.fresh_read_matches(fresh_ok, curations) and not app.fresh_read_matches(fresh_stale, curations))
rows = [{"course_id": "THEA M1001", "field": "discipline", "value": "Drama/Theater Arts", "reviewer_email": "a@b", "reviewed_at": "2026-08-01T00:00:00+00:00"},
        {"course_id": "MATH M1001", "field": "merge_into", "value": "THEA M1001", "reviewer_email": "a@b", "reviewed_at": "2026-08-02T00:00:00+00:00"},
        {"course_id": "THEA Z1001", "field": "unified_title", "value": "Acting Lab", "reviewer_email": "bot", "reviewed_at": "2026-06-13T00:00:00+00:00"},
        {"course_id": "_CANON_SUBJ4::Mathematics", "field": "canonical_subj4", "value": "MATH", "reviewer_email": "a@b", "reviewed_at": "2026-05-23T00:00:00+00:00"}]
check("P3: an export rebuilds the committed overlay exactly (picks are not overlay rows)",
      app.rebuild_overlay(rows) == dict(sorted(curations.items())))

# picks
ops = app.pick_ops(edits, NOW)
check("picks: one guarded UPDATE per recoded discipline with the before-value in the WHERE, plus a notes row",
      any(o["field"] == "canonical_subj4" and o["from"] == "THEA" and o["to"] == "THTR"
          and "value = 'THEA'" in o["sql"] for o in ops)
      and sum(1 for o in ops if o["field"] == "canonical_subj4") == len(dry.PLAIN) + len(dry.FAN_IN)
      and sum(1 for o in ops if o["field"] == "canonical_subj4_notes") == len(dry.PLAIN) + len(dry.FAN_IN))
check("prefix moves: the whole-prefix moves name the plain items and the fan-in, never agriculture",
      app.prefix_moves(plan).get("THEA") == "THTR" and app.prefix_moves(plan).get("FIMP") == "FTVE"
      and "AGRI" not in app.prefix_moves(plan))

fails = [n for n, ok in results if not ok]
print(f"\n{len(fails)} failure(s)" + (": " + ", ".join(fails) if fails else ""))
sys.exit(1 if fails else 0)
