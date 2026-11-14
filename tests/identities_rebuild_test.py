#!/usr/bin/env python3
"""Fixture checks for kb/_identities_rebuild.py — the identities map of
kb/coci_articulations.json rebuilt from the current catalog by the 1b entry rule.

The failure this guards: the export's rollup (excel_to_dashboard.articulation_rollup)
builds a row's adopter and potential lists from `identities[member]`, so an
articulated member with no entry contributes nothing. When a curator merges that
member into a target, its earning colleges and the colleges that teach it never
reach the target's row (FIRE M1274 into FIRE 130 X, 2026-11-13: the lists stayed
5 and 6 after the merge).

Every check runs on a fixture, never on the committed map, which the daily run
rewrites. One check per failure: a merged-away member with no entry; a stale
offering kept; a stamp kept on an entry that now describes another course; a
C-ID/CCN entry rewritten or dropped; an orphan dropped without a ruling; a gate
removed; a plan applied that is not the plan reviewed; an apply that cannot be
undone byte for byte; a dry run that writes the map.

Run from repo root: python3 tests/identities_rebuild_test.py
"""
import copy
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _identities_rebuild as ib  # noqa: E402
from excel_to_dashboard import articulation_rollup  # noqa: E402  (the export's own rule)

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


def course(title, spread=1, **kw):
    r = {"common_title": title, "discipline": "Fire Technology", "confidence": 0.8,
         "subject_spread": spread, "credit_status": "Credit"}
    r.update(kw)
    return r


def rec(cid, earned, system="M-ID"):
    return {"course_id": cid, "identity_system": system, "earned_by_colleges": list(earned),
            "exhibit_id": "X-" + cid}


# The catalog. FIRE M1001 is merged away into the C-ID FIRE 130 X and has no
# entry (the FIRE M1274 shape). FIRE M1002 carries a stale offering and a
# re-key stamp. FIRE M1003 is a singleton with no entry. FIRE M1004's entry
# describes another course; FIRE M1005's differs only by a numeral. FIRE M1006
# sits at subject_spread 8 exactly. OLD M1009 is an entry no record names (a
# pre-fold key on a live id). MATH 110 is a C-ID entry no record names.
# AG-AB 108 108 is a C-ID record with no entry; NULL is the literal key.
cat = {"FIRE M1001": course("Building Construction", spread=9),
       "FIRE M1002": course("Fire Behavior"),
       "FIRE M1004": course("Fire Prevention"),
       "FIRE M1005": course("Firefighter II"),
       "FIRE M1006": course("Fire Hydraulics", spread=8),
       "OLD M1009": course("Pottery")}
sg = {"FIRE M1003": course("Wildland Fire", college="Gamma College")}
mem = {"FIRE M1001": [{"college": "Alpha College"}, {"college": "Beta College"}, {"college": "Delta College"}],
       "FIRE M1002": [{"college": "Alpha College"}, {"college": "Epsilon College"}],
       "FIRE M1004": [{"college": "Alpha College"}],
       "FIRE M1005": [{"college": "Beta College"}],
       "FIRE M1006": [{"college": "Beta College"}],
       "OLD M1009": [{"college": "Omega College"}]}
cid_entry = {"identity_system": "C-ID", "title": None, "colleges_offering": ["Kappa College", "Lambda College"],
             "colleges_offering_count": 2}
cid_unarticulated = {"identity_system": "C-ID", "title": None, "colleges_offering": ["Mu College"],
                     "colleges_offering_count": 1}
d = lambda cid, **kw: {**ib.derive_entry(cid, cat, sg, mem), **kw}
identities = {  # deliberately unsorted: the apply keeps this order
    "OLD M1009": d("OLD M1009", title="Something Else"),
    "FIRE 130 X": cid_entry,
    "MATH 110": cid_unarticulated,
    "FIRE M1002": d("FIRE M1002", colleges_offering=["Old College"], colleges_offering_count=1,
                    _identities_rekeyed_from="FIRE M0999"),
    "FIRE M1004": d("FIRE M1004", title="Ceramics", _identities_rekeyed_from="FIRE M0998"),
    "FIRE M1005": d("FIRE M1005", title="Firefighter 2", _identities_rekeyed_from="FIRE M0997"),
}
records = [rec("FIRE 130 X", ["Kappa College"], "C-ID"), rec("FIRE M1001", ["Alpha College", "Zeta College"]),
           rec("FIRE M1002", ["Alpha College"]), rec("FIRE M1003", ["Gamma College"]),
           rec("FIRE M1004", ["Alpha College"]), rec("FIRE M1005", ["Beta College"]),
           rec("FIRE M1006", ["Beta College"]), rec("ZZZ M1001", ["Q"]),
           rec("AG-AB 108 108", ["Q"], "C-ID"), rec("NULL", ["Q"], "C-ID")]
earned = {}
for r in records:
    earned.setdefault(r["course_id"], set()).update(r["earned_by_colleges"])

plan = ib.compute_plan(identities, records, cat, sg, mem)
check("an articulated M-ID with no entry is filled", set(plan["fill"]) == {"FIRE M1001", "FIRE M1003", "FIRE M1006"})
check("a filled entry's offering is the id's membership colleges",
      plan["fill"]["FIRE M1001"]["colleges_offering"] == ["Alpha College", "Beta College", "Delta College"])
check("a singleton's offering is its own college", plan["fill"]["FIRE M1003"]["colleges_offering"] == ["Gamma College"]
      and plan["fill"]["FIRE M1003"]["is_singleton"] is True)
check("over_merged is set at subject_spread 8 exactly", plan["fill"]["FIRE M1006"]["over_merged"] is True)
check("over_merged is not set below 8", plan["fill"]["FIRE M1003"]["over_merged"] is False)
check("stale entries are refreshed", set(plan["refresh"]) == {"FIRE M1002", "FIRE M1004", "FIRE M1005"})
check("refresh reasons separate substance from numerals",
      plan["refresh_why"] == {"FIRE M1002": "offering differs from the membership",
                              "FIRE M1004": "title differs in substance",
                              "FIRE M1005": "title differs only by numerals, case or punctuation"})
check("a C-ID/CCN entry is kept, never derived", plan["keep_cid"] == ["FIRE 130 X"])
check("a C-ID record id with no entry is its own class", plan["cid_no_entry"] == ["AG-AB 108 108"])
check("the literal NULL course_id is flagged apart", plan["null_key"] == ["NULL"])
check("an M-ID record id in no catalog is listed, not written", plan["no_record"] == ["ZZZ M1001"])
check("an M-ID entry no record names is an orphan; a C-ID one is not", plan["orphan"] == ["OLD M1009"]
      and plan["cid_unarticulated"] == ["MATH 110"])

# ── the guard: a merged-away member reaches its target, through the export's rollup ──
mids = ["FIRE 130 X", "FIRE M1001"]  # the target, then the member merged into it
check("before: the member with no entry adds nothing to its target (the bug)",
      articulation_rollup(identities, earned, mids) == (["Kappa College"], ["Lambda College"]))
check("before: the invariant names the member",
      ib.missing_entries(identities, records, cat, sg) == ["FIRE M1001", "FIRE M1003", "FIRE M1006"])
new = ib.apply_plan(identities, plan, now="2026-11-14T00:00:00Z")
after = articulation_rollup(new, earned, mids)
check("after: the target's adopters take the member's earning colleges",
      after[0] == ["Alpha College", "Kappa College", "Zeta College"])
check("after: the target's potential takes the member's teaching colleges, less its adopters",
      after[1] == ["Beta College", "Delta College", "Lambda College"])
check("after: no articulated live M-ID lacks an entry", ib.missing_entries(new, records, cat, sg) == [])
check("the builder's report uses the export's rollup, not a copy", ib.target_lists(new, earned, mids) == after)

check("the map's key order is kept; fills follow in sorted order",
      list(new) == list(identities) + ["FIRE M1001", "FIRE M1003", "FIRE M1006"])
check("refresh replaces the stale offering", new["FIRE M1002"]["colleges_offering"] == ["Alpha College", "Epsilon College"])
check("refresh keeps the re-key stamp when the title still names the course",
      new["FIRE M1002"].get("_identities_rekeyed_from") == "FIRE M0999"
      and new["FIRE M1005"].get("_identities_rekeyed_from") == "FIRE M0997")
check("a refresh that changes the course moves the stamp to _superseded_rekeyed_from",
      "_identities_rekeyed_from" not in new["FIRE M1004"]
      and new["FIRE M1004"].get("_superseded_rekeyed_from") == "FIRE M0998")
check("every rebuilt entry carries _identities_rebuilt_at; untouched ones do not",
      all(new[k].get("_identities_rebuilt_at") == "2026-11-14T00:00:00Z"
          for k in list(plan["fill"]) + list(plan["refresh"]))
      and "_identities_rebuilt_at" not in new["FIRE 130 X"])
check("the C-ID/CCN entries are the same objects", new["FIRE 130 X"] is cid_entry and new["MATH 110"] is cid_unarticulated)
check("an orphan is kept unless the drop is asked for", "OLD M1009" in new)
dropped = ib.apply_plan(identities, plan, drop_orphans=True)
check("an orphan is dropped when asked", "OLD M1009" not in dropped)
check("an unarticulated C-ID entry survives the drop", dropped.get("MATH 110") == cid_unarticulated)
again = ib.compute_plan(new, records, cat, sg, mem)
check("a second plan changes nothing", not again["fill"] and not again["refresh"])
check("the input map is not mutated", "FIRE M1001" not in identities
      and identities["FIRE M1002"]["colleges_offering"] == ["Old College"])

# ── each gate fails on a map that breaks it ──────────────────────────────────
G1, G2, G3 = ("G1 every articulated live M-ID has an entry", "G2 every C-ID/CCN entry untouched",
              "G3 a second plan changes nothing")
check("the gates pass on the planned map", all(ib.apply_gates(identities, new, records, cat, sg, mem).values()))
no_fill = {k: v for k, v in new.items() if k != "FIRE M1001"}
check("G1 fails when a fill is missing", ib.apply_gates(identities, no_fill, records, cat, sg, mem).get(G1) is False)
bad_cid = dict(new, **{"FIRE 130 X": dict(cid_entry, colleges_offering=["X"])})
check("G2 fails when a C-ID/CCN entry changes", ib.apply_gates(identities, bad_cid, records, cat, sg, mem).get(G2) is False)
stale = dict(new, **{"FIRE M1002": identities["FIRE M1002"]})
check("G3 fails when a refresh is left undone", ib.apply_gates(identities, stale, records, cat, sg, mem).get(G3) is False)

# ── the CLI on a fixture kb ──────────────────────────────────────────────────
with tempfile.TemporaryDirectory() as td:
    def dump(name, obj):
        p = os.path.join(td, name)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=2, ensure_ascii=False)
            f.write("\n")
    dump("coci_articulations.json", {"identities": identities, "articulations": records})
    dump("coci_minted_courses.json", {"courses": cat})
    dump("coci_minted_singletons.json", {"courses": sg})
    dump("coci_minted_memberships.json", {"memberships": mem})
    dump("coci_curation.json", {"curations": {"FIRE M1001": {"merge_into": "FIRE 130 X"}}})
    dump(os.path.join("reference", "coci_courses.json"), {"courses": {"FIRE 130 X": {}}})
    art_path = os.path.join(td, "coci_articulations.json")
    original = open(art_path, "rb").read()
    out = os.path.join(td, "out")
    env = dict(os.environ, IDENTITIES_REBUILD_KB=td, IDENTITIES_REBUILD_OUT=out)
    script = os.path.join(ROOT, "kb", "_identities_rebuild.py")
    run = lambda *a: subprocess.run([sys.executable, script, *a], env=env, capture_output=True, text=True)
    unchanged = lambda: open(art_path, "rb").read() == original

    check("--check fails while an articulated live M-ID has no entry", run("--check").returncode == 1)
    r = run("--out", os.path.join(out, "plan"))
    plan_path = os.path.join(out, "plan", "plan.json")
    check("the default dry run succeeds, writes its plan and leaves the map byte-identical",
          r.returncode == 0 and os.path.exists(plan_path) and unchanged())
    pj = json.load(open(plan_path, encoding="utf-8"))
    check("the plan names the fills, refreshes and orphans",
          sorted(pj["fill"]) == ["FIRE M1001", "FIRE M1003", "FIRE M1006"] and pj["orphan"] == ["OLD M1009"]
          and pj["merge_targets"]["FIRE 130 X"]["adopted"] == [1, 3])
    check("--apply without --expect-plan aborts", run("--apply").returncode != 0 and unchanged())
    check("--drop-orphans without --apply aborts", run("--drop-orphans", "--ruling", "x").returncode != 0)
    r = run("--apply", "--expect-plan", plan_path, "--drop-orphans", "--ruling", "   ")
    check("--drop-orphans with a blank ruling aborts and writes nothing", r.returncode != 0 and unchanged())
    tampered = os.path.join(td, "tampered.json")
    with open(tampered, "w", encoding="utf-8") as f:
        json.dump(dict(pj, fill=pj["fill"][:-1]), f)
    r = run("--apply", "--expect-plan", tampered)
    check("--apply aborts when the plan differs from the one named", r.returncode != 0 and unchanged())
    r = run("--apply", "--expect-plan", plan_path)
    doc = json.load(open(art_path, encoding="utf-8"))
    receipt_path = os.path.join(out, "plan", "apply_receipt.json")
    check("--apply writes the fills, keeps the orphan and stamps the era",
          r.returncode == 0 and "FIRE M1001" in doc["identities"] and "OLD M1009" in doc["identities"]
          and doc.get("_identities_rebuilt", [{}])[-1].get("fill") == 3)
    rc = json.load(open(receipt_path, encoding="utf-8")) if os.path.exists(receipt_path) else {}
    check("the receipt holds every key's before-value (null for a fill)",
          rc.get("entries", {}).get("FIRE M1001", {}).get("before", 0) is None
          and rc["entries"]["FIRE M1002"]["before"] == identities["FIRE M1002"]
          and set(rc["entries"]) == {"FIRE M1001", "FIRE M1003", "FIRE M1006", "FIRE M1002", "FIRE M1004", "FIRE M1005"})
    check("--check passes after the apply", run("--check").returncode == 0)
    check("a second --apply on the same plan is refused", run("--apply", "--expect-plan", plan_path).returncode != 0)
    r = run("--undo", receipt_path)
    check("--undo restores the map byte for byte", r.returncode == 0 and unchanged())
    check("a second --undo is refused", run("--undo", receipt_path).returncode != 0 and unchanged())

# ── the export calls the shared rule ─────────────────────────────────────────
src = open(os.path.join(ROOT, "excel_to_dashboard.py"), encoding="utf-8").read()
check("the export's nested rollup delegates to articulation_rollup",
      "return articulation_rollup(art_ident, earned, mids)" in src)

passed = sum(1 for _, ok in results if ok)
print("\n%d/%d assertions passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) and results else 1)
