#!/usr/bin/env python3
"""Fixture checks for kb/_identities_rebuild.py — the identities map of
kb/coci_articulations.json rebuilt from the current catalog.

The failure this guards: the export's rollup (excel_to_dashboard.py,
export_unified_courses) builds a row's adopter and potential lists from
`identities[member]`, so an articulated member with no entry contributes
nothing. When a curator merges that member into a target, its earning colleges
and the colleges that teach it never reach the target's row (FIRE M1274 into
FIRE 130 X, 2026-11-13: the lists stayed 5 and 6 after the merge).

Every check runs on a fixture, never on the committed map, which the daily run
rewrites. One check per failure: a merged-away member with no entry; a stale
offering kept; a stamp lost on refresh; a C-ID/CCN entry rewritten; an orphan
dropped without a ruling; a second run that still changes something; the
export no longer reading the map the way this builder assumes.

Run from repo root: python3 tests/identities_rebuild_test.py
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _identities_rebuild as ib  # noqa: E402

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
# entry (the FIRE M1274 shape); FIRE M1002 carries a stale offering and a
# re-key stamp; FIRE M1003 is a singleton with no entry; OLD M1009 is an entry
# no record names (a pre-fold key on a live id); ZZZ 1 1 is in no catalog.
cat = {"FIRE M1001": course("Building Construction", spread=9),
       "FIRE M1002": course("Fire Behavior"),
       "OLD M1009": course("Pottery")}
sg = {"FIRE M1003": course("Wildland Fire", college="Gamma College")}
mem = {"FIRE M1001": [{"college": "Alpha College"}, {"college": "Beta College"}, {"college": "Delta College"}],
       "FIRE M1002": [{"college": "Alpha College"}, {"college": "Epsilon College"}],
       "OLD M1009": [{"college": "Omega College"}]}
cid_entry = {"identity_system": "C-ID", "title": None, "colleges_offering": ["Kappa College", "Lambda College"],
             "colleges_offering_count": 2}
identities = {
    "FIRE 130 X": cid_entry,
    "FIRE M1002": {**ib.derive_entry("FIRE M1002", cat, sg, mem),
                   "colleges_offering": ["Old College"], "colleges_offering_count": 1,
                   "_identities_rekeyed_from": "FIRE M0999"},
    "OLD M1009": {**ib.derive_entry("OLD M1009", cat, sg, mem), "title": "Something Else"},
}
records = [rec("FIRE 130 X", ["Kappa College"], "C-ID"), rec("FIRE M1001", ["Alpha College", "Zeta College"]),
           rec("FIRE M1002", ["Alpha College"]), rec("FIRE M1003", ["Gamma College"]), rec("ZZZ 1 1", ["Q"])]
earned = {}
for r in records:
    earned.setdefault(r["course_id"], set()).update(r["earned_by_colleges"])

plan = ib.compute_plan(identities, records, cat, sg, mem)
check("an articulated M-ID with no entry is filled", set(plan["fill"]) == {"FIRE M1001", "FIRE M1003"})
check("a filled entry's offering is the id's membership colleges",
      plan["fill"]["FIRE M1001"]["colleges_offering"] == ["Alpha College", "Beta College", "Delta College"])
check("a singleton's offering is its own college", plan["fill"]["FIRE M1003"]["colleges_offering"] == ["Gamma College"]
      and plan["fill"]["FIRE M1003"]["is_singleton"] is True)
check("over_merged comes from the catalog's subject spread (>= 8)", plan["fill"]["FIRE M1001"]["over_merged"] is True)
check("a stale offering is refreshed", set(plan["refresh"]) == {"FIRE M1002"})
check("a C-ID/CCN entry is kept, never derived", plan["keep_cid"] == ["FIRE 130 X"])
check("an M-ID entry no record names is an orphan", plan["orphan"] == ["OLD M1009"])
check("an articulated id in no catalog is listed, not written", plan["no_record"] == ["ZZZ 1 1"])

# ── the guard: a merged-away member reaches its target ──────────────────────
mids = ["FIRE 130 X", "FIRE M1001"]  # the target, then the member merged into it
before = ib.target_lists(identities, earned, mids)
check("before: the member with no entry adds nothing to its target (the bug)",
      before == (["Kappa College"], ["Lambda College"]))
check("before: the invariant names the member", ib.missing_entries(identities, records, cat, sg)
      == ["FIRE M1001", "FIRE M1003"])
new = ib.apply_plan(identities, plan)
after = ib.target_lists(new, earned, mids)
check("after: the target's adopters take the member's earning colleges",
      after[0] == ["Alpha College", "Kappa College", "Zeta College"])
check("after: the target's potential takes the member's teaching colleges, less its adopters",
      after[1] == ["Beta College", "Delta College", "Lambda College"])
check("after: no articulated live id lacks an entry", ib.missing_entries(new, records, cat, sg) == [])

check("refresh replaces the stale offering", new["FIRE M1002"]["colleges_offering"] == ["Alpha College", "Epsilon College"])
check("refresh keeps the re-key stamp", new["FIRE M1002"].get("_identities_rekeyed_from") == "FIRE M0999")
check("the C-ID/CCN entry is byte-identical", new["FIRE 130 X"] == cid_entry)
check("an orphan is kept unless the drop is asked for", "OLD M1009" in new)
check("an orphan is dropped when asked", "OLD M1009" not in ib.apply_plan(identities, plan, drop_orphans=True))
again = ib.compute_plan(new, records, cat, sg, mem)
check("a second plan changes nothing", not again["fill"] and not again["refresh"])
check("the input map is not mutated", "FIRE M1001" not in identities
      and identities["FIRE M1002"]["colleges_offering"] == ["Old College"])

# ── the CLI on a fixture kb: --check, the drop gate, --apply ─────────────────
with tempfile.TemporaryDirectory() as td:
    def dump(name, obj):
        with open(os.path.join(td, name), "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=2, ensure_ascii=False)
            f.write("\n")
    dump("coci_articulations.json", {"identities": identities, "articulations": records})
    dump("coci_minted_courses.json", {"courses": cat})
    dump("coci_minted_singletons.json", {"courses": sg})
    dump("coci_minted_memberships.json", {"memberships": mem})
    env = dict(os.environ, IDENTITIES_REBUILD_KB=td, IDENTITIES_REBUILD_OUT=os.path.join(td, "out"))
    script = os.path.join(ROOT, "kb", "_identities_rebuild.py")
    run = lambda *a: subprocess.run([sys.executable, script, *a], env=env, capture_output=True, text=True)
    check("--check fails while an articulated live id has no entry", run("--check").returncode == 1)
    r = run("--apply", "--drop-orphans")
    check("--drop-orphans without a ruling aborts and writes nothing",
          r.returncode != 0 and "FIRE M1001" not in json.load(open(os.path.join(td, "coci_articulations.json")))["identities"])
    r = run("--apply")
    doc = json.load(open(os.path.join(td, "coci_articulations.json"), encoding="utf-8"))
    check("--apply writes the fills, keeps the orphan and stamps the era",
          r.returncode == 0 and "FIRE M1001" in doc["identities"] and "OLD M1009" in doc["identities"]
          and doc.get("_identities_rebuilt", [{}])[-1].get("fill") == 2)
    check("--check passes after the apply", run("--check").returncode == 0)
    r = run("--apply")
    check("a second --apply is a no-op", r.returncode == 0 and "no change" in r.stdout)

# ── the export still reads the map the way this builder assumes ─────────────
src = open(os.path.join(ROOT, "excel_to_dashboard.py"), encoding="utf-8").read()
roll = src[src.index("    def rollup(mids):"):]
roll = roll[:roll.index("\n    def ", 10)]
check("the export's rollup reads identities[member] and its colleges_offering",
      "art_ident.get(m)" in roll and 'colleges_offering' in roll and "earned.get(m" in roll)

passed = sum(1 for _, ok in results if ok)
print("\n%d/%d assertions passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) and results else 1)
