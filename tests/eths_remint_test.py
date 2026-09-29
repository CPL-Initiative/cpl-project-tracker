#!/usr/bin/env python3
"""Fixture checks for kb/_eths_remint.py, one per failure the re-mint must never
produce: a row routed by its curated title instead of its members' title, an
adapted or intercollegiate course left on KINE, a row with one signal moved, a
drifted ruled set applied, a moved row left without its discipline or stamp, a
merge_into pointer or curation key left on an old id, a stale identities entry
kept on a landing key, a receipt or a fresh read that disagree slipping through,
and an unruled class applied.

Run from repo root: python3 tests/eths_remint_test.py
"""
import copy
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _eths_remint as er  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


WORDS = ("fitness", "swim", "fencing", "track", "exercise", "athletic")


def course(cid, title, top="0835.00", disc="Ethnic Studies"):
    return {"course_id": cid, "common_title": title, "subject_4letter": cid.split(" ")[0],
            "discipline": disc, "top_code": top}


def member(college, subj, top="0835.00: Physical Education"):
    return {"college": college, "subject": subj, "course_number": "1", "top_code": top}


def fixture():
    courses = {
        "ETHS M1001": course("ETHS M1001", "Beginning Swimming"),
        "ETHS M1002": course("ETHS M1002", "Intercollegiate Track"),
        "ETHS M1003": course("ETHS M1003", "Adapted Physical Exercise"),
        "ETHS M1004": course("ETHS M1004", "Beginning Indoor Cycling Fitness"),   # curated title says adapted
        "ETHS M1005": course("ETHS M1005", "Fitness Walking", top="2201.00"),     # one signal only
        "ETHS M1006": course("ETHS M1006", "Chicano History", top="2203.00"),     # a real Ethnic Studies course
        "KINE M1001": course("KINE M1001", "Beginning Yoga", disc="Kinesiology"),  # the kept number is taken
    }
    singletons = {"ETHS M10AA": course("ETHS M10AA", "Advanced Fencing")}
    memberships = {
        "ETHS M1001": [member("Grossmont College", "ES"), member("El Camino College", "PE")],
        "ETHS M1002": [member("Cuyamaca College", "ES", "0835.50: Intercollegiate Athletics")],
        "ETHS M1003": [member("Victor Valley College", "APE", "0835.80: Adapted Physical Education")],
        "ETHS M1004": [member("Grossmont College", "ES")],
        "ETHS M1005": [member("Grossmont College", "ES", "2201.00: Social Science")],
        "ETHS M1006": [member("Grossmont College", "ES", "2203.00: Ethnic Studies")],
    }
    curations = {
        "ETHS M1004": {"unified_title": "Adapted Indoor Cycling for Fitness"},
        "KINE M10XY": {"merge_into": "ETHS M1001"},
        "ETHS M10BB": {"merge_into": "ETHS M1002"},
        "ETHS M1001": {"unified_title": "Beginning Swimming"},
    }
    singletons["ETHS M10BB"] = course("ETHS M10BB", "Track and Field")
    singletons["KINE M10XY"] = course("KINE M10XY", "Swim Conditioning", disc="Kinesiology")
    identities = {"ETHS M1001": {"discipline": "Ethnic Studies"}, "KINE M1040": {"stale": True}}
    articulations = [{"course_id": "ETHS M1001"}, {"course_id": "KINE M1001"}]
    return courses, singletons, memberships, curations, identities, articulations


def plan_for(fx, ruled, scopes=("ruled",)):
    courses, singletons, memberships, curations, identities, _ = fx
    saved = er.RULED
    er.RULED = tuple(ruled)
    try:
        return er.compute_plan(courses, singletons, memberships, curations, identities, {}, WORDS, scopes)
    finally:
        er.RULED = saved


RULED_FX = ("ETHS M1001", "ETHS M1002", "ETHS M1003", "ETHS M1004", "ETHS M1005")
fx = fixture()
plan = plan_for(fx, RULED_FX)
mv = plan["moves"]

# ── routing ──────────────────────────────────────────────────────────────────
check("an intercollegiate title routes to ATHL", mv["ETHS M1002"]["route"] == "ATHL")
check("an adapted title routes to PEDS, with its own discipline",
      mv["ETHS M1003"]["route"] == "PEDS" and mv["ETHS M1003"]["discipline"] == "Physical Education Disabled Students")
check("everything else routes to KINE, discipline Kinesiology",
      mv["ETHS M1001"]["route"] == "KINE" and mv["ETHS M1001"]["discipline"] == "Kinesiology")
check("the members' title routes; a curated title that disagrees is reported, never followed",
      mv["ETHS M1004"]["route"] == "KINE" and "PEDS" in mv["ETHS M1004"].get("title_conflict", ""))
check("a real Ethnic Studies course is never selected", "ETHS M1006" not in plan["classes"] and
      "ETHS M1006" not in mv and "ETHS M1006" not in plan["held"])

# ── evidence ─────────────────────────────────────────────────────────────────
check("a row with no second signal is held, not moved (Rule 7)",
      "ETHS M1005" in plan["held"] and "ETHS M1005" not in mv)
check("ES never counts as the second signal; PE does",
      any("PE" in e for e in mv["ETHS M1001"]["evidence"]) and
      not any(" ES" in e or e.endswith("ES") for e in mv["ETHS M1001"]["evidence"]))

# ── scope ────────────────────────────────────────────────────────────────────
check("the ruled class moves; a stand-alone waits for its own ruling",
      "ETHS M10AA" not in mv and plan["not_in_scope"].get("ETHS M10AA", {}).get("scope") == "standalone")
check("an ETHS id merged into a ruled parent is its child, not a move",
      plan["not_in_scope"].get("ETHS M10BB", {}).get("scope") == "children")
check("V0 passes when the measured ruled set equals RULED", plan["validation"]["V0_ruled_set"]["pass"])
drift = plan_for(fx, RULED_FX + ("ETHS M1999",))
check("V0 refuses a drifted ruled set", not drift["validation"]["V0_ruled_set"]["pass"])

# ── allocation ───────────────────────────────────────────────────────────────
check("a free target keeps the number", mv["ETHS M1002"]["new_id"] == "ATHL M1002"
      and mv["ETHS M1002"]["how"] == "kept number")
check("a taken target gap-fills, and the new ids are unique and free",
      mv["ETHS M1001"]["how"] == "gap-filled" and mv["ETHS M1001"]["new_id"] != "KINE M1001"
      and plan["validation"]["V2_new_ids_unique_and_free"]["pass"])

# ── apply ────────────────────────────────────────────────────────────────────
courses, singletons, memberships, curations, identities, articulations = fx
docs = {"courses": {"courses": copy.deepcopy(courses)}, "singletons": {"courses": copy.deepcopy(singletons)},
        "memberships": {"memberships": copy.deepcopy(memberships)},
        "articulations": {"articulations": copy.deepcopy(articulations), "identities": copy.deepcopy(identities)},
        "curation": {"curations": copy.deepcopy(curations)}}
before = copy.deepcopy(docs)
pre_art = sum(1 for a in articulations if a["course_id"] in plan["alias"])
after, counts = er.apply_plan(copy.deepcopy(docs), plan)
new1 = plan["alias"]["ETHS M1001"]
moved = after["courses"]["courses"][new1]
check("a moved record carries its new key, prefix, discipline and the stamp",
      moved["course_id"] == new1 and moved["subject_4letter"] == "KINE" and moved["discipline"] == "Kinesiology"
      and moved.get(er.STAMP) == "ETHS M1001")
check("an untouched record is untouched", after["courses"]["courses"]["ETHS M1006"] == courses["ETHS M1006"]
      and after["courses"]["courses"]["KINE M1001"] == courses["KINE M1001"])
check("merge_into pointers follow the parent",
      after["curation"]["curations"]["KINE M10XY"]["merge_into"] == new1
      and after["curation"]["curations"]["ETHS M10BB"]["merge_into"] == plan["alias"]["ETHS M1002"])
check("curation keys and membership keys move", new1 in after["curation"]["curations"]
      and "ETHS M1001" not in after["curation"]["curations"] and new1 in after["memberships"]["memberships"])
check("the articulation follows, and the moved identities entry wins its key",
      after["articulations"]["articulations"][0]["course_id"] == new1
      and after["articulations"]["identities"].get(new1) == {"discipline": "Ethnic Studies"})
gates = er.post_gates(before, after, plan, pre_art)
check("the post gates pass on a correct apply", all(v["pass"] for v in gates.values()))
broken = copy.deepcopy(after)
broken["curation"]["curations"]["KINE M10XY"]["merge_into"] = "ETHS M1001"
check("V5 catches a pointer left on an old id",
      not er.post_gates(before, broken, plan, pre_art)["V5_nothing_left_on_an_old_id"]["pass"])
broken = copy.deepcopy(after)
broken["courses"]["courses"][new1]["discipline"] = "Ethnic Studies"
check("V3 catches a moved row whose discipline did not follow its route",
      not er.post_gates(before, broken, plan, pre_art)["V3_discipline_follows_route"]["pass"])

# ── P3: the fresh read ───────────────────────────────────────────────────────
live = [{"course_id": "ETHS M1001", "field": "unified_title", "value": "Beginning Swimming"},
        {"course_id": "ETHS M1004", "field": "unified_title", "value": "Adapted Indoor Cycling for Fitness"},
        {"course_id": "KINE M10XY", "field": "merge_into", "value": "ETHS M1001"},
        {"course_id": "ETHS M10BB", "field": "merge_into", "value": "ETHS M1002"}]
check("P3 passes when the live rows rebuild the overlay", er.fresh_read_check(live, curations, plan)["pass"])
drifted = live + [{"course_id": "KINE M10ZZ", "field": "merge_into", "value": "ETHS M1001"}]
check("P3 refuses a live row the overlay does not hold (a curator acted since the sync)",
      not er.fresh_read_check(drifted, curations, plan)["pass"])
edited = [dict(r, value="Swimming I") if r["course_id"] == "ETHS M1001" else r for r in live]
# A pointer child's own fields stay put, so the live read carries only its
# merge_into row: P3 compares that field alone (ATHL M1131, 2026-09-28).
titled = copy.deepcopy(curations)
titled["KINE M10XY"]["unified_title"] = "Swim Conditioning"
check("P3 compares a pointer child's merge_into alone, never its other fields",
      er.fresh_read_check(live, titled, plan)["pass"])
moved_extra = live + [{"course_id": "ETHS M1001", "field": "discipline", "value": "Kinesiology"}]
check("P3 refuses a moved id carrying a live field the overlay lacks",
      not er.fresh_read_check(moved_extra, curations, plan)["pass"])
check("P3 refuses a live value that differs from the overlay",
      not er.fresh_read_check(edited, curations, plan)["pass"])

# ── main(): the apply's own refusals ─────────────────────────────────────────
try:
    er.main(["--scope", "ruled,standalone", "--apply", "--ruling", "x", "--receipt", "x", "--fresh-read", "x"])
    refused = False
except SystemExit as e:
    refused = "ruled class only" in str(e)
check("--apply moves the ruled class only until Sam rules on the rest", refused)
try:
    er.main(["--apply"])
    refused = False
except SystemExit as e:
    refused = "--ruling" in str(e)
check("--apply without a ruling, a receipt and a fresh read refuses", refused)

# ── SkyView's hand-built layout: token-exact, idempotent ────────────────────
with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "prototype"))
    lay = os.path.join(tmp, "prototype", "ccr_universe.json")
    with open(lay, "w", encoding="utf-8") as f:
        f.write('{"p":[{"i":"ETHS M1001","x":1.5},{"i":"ETHS M10011x"},{"i":"XETHS M1001"}],"o":"ETHS M1001"}')
    done = er.rekey_skyview({"ETHS M1001": "KINE M2001"}, root=tmp)
    text = open(lay, encoding="utf-8").read()
    check("the SkyView re-key rewrites whole ids and keeps the coordinates",
          done.get("prototype/ccr_universe.json") == 2 and text.count("KINE M2001") == 2 and '"x":1.5' in text)
    check("the SkyView re-key never touches a longer token that contains an old id",
          "ETHS M10011x" in text and "XETHS M1001" in text)
    check("the SkyView re-key is idempotent", er.rekey_skyview({"ETHS M1001": "KINE M2001"}, root=tmp)
          .get("prototype/ccr_universe.json") == 0)

passed = sum(1 for _, ok in results if ok)
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
