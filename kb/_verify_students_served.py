#!/usr/bin/env python3
"""Verify the CER students-served roll-up (path 1) end-to-end against a SYNTHETIC
CustomReport, since the real one (CustomReport_latest.json) is cron-only / not
committed. Proves: View_ArticulatedCollegeCourses.Students sums by exhibit_id →
unified_title; small-cell suppression below 5; test-college rows excluded.

Run from repo root: python3 kb/_verify_students_served.py
"""
import json, os, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as m

KB = os.path.join(os.path.dirname(os.path.abspath(__file__)))
art = json.load(open(os.path.join(KB, "coci_articulations.json")))["articulations"]

# Pick two exhibit_ids mapping to two DISTINCT unified_titles (CER rows).
seen, picks = set(), []
for a in art:
    ex, ut = a.get("exhibit_id"), a.get("unified_title")
    if ex and ut and ut not in seen:
        seen.add(ut); picks.append((ex, ut))
    if len(picks) == 2:
        break
(exA, utA), (exB, utB) = picks
print(f"exhibit A {exA!r} -> {utA!r}")
print(f"exhibit B {exB!r} -> {utB!r}")

TEST_COLLEGE = next(iter(m._TEST_COLLEGES))
cols = ["College", "ExhibitID", "Students"]
rows = [
    ["Real College One", exA, "3"],        # A: string int + float = 7 → exact (>=5);
    ["Real College Two", exA, 4.0],        #    proves the robust parse (old int() zeroed these)
    [TEST_COLLEGE,       exA, 999],         # test college → MUST be excluded
    ["Real College Three", exB, "2.0"],     # B: float-string 2 → suppressed (<5)
]
synth = [{"viewName": "View_ArticulatedCollegeCourses_APIDataset",
          "columnName": cols, "columnValue": rows, "dataCount": len(rows)}]

tmp = tempfile.mkdtemp(prefix="cer_verify_")
report_path = os.path.join(tmp, "CustomReport_synth.json")
json.dump(synth, open(report_path, "w"))

m.EXHIBIT_FILE = report_path          # point the producer at the synthetic report
os.environ["UC_OUT_DIR"] = tmp        # write the baked file to the temp dir
m.export_credential_reference()

baked = open(os.path.join(tmp, "credential_reference_data.js")).read()
baked = baked[baked.index("=") + 1:].strip().rstrip(";")
by = {r["ut"]: r for r in json.loads(baked)["unified_titles"]}

ok = True
def expect(name, cond):
    global ok
    print(("PASS  " if cond else "FAIL  ") + name); ok = ok and cond

rA, rB = by.get(utA, {}), by.get(utB, {})
expect(f"A summed to 7 (3+4, test college's 999 excluded)", rA.get("students_served") == 7)
expect(f"A not suppressed", rA.get("served_suppressed") is False)
expect(f"B suppressed (<5): students_served null", rB.get("students_served") is None)
expect(f"B served_suppressed True", rB.get("served_suppressed") is True)
expect(f"B's exact count (2) is NOT in the baked payload", '"students_served": 2' not in baked and '"students_served":2' not in baked)

# ── Carry-forward (2026-06-04): a session live-on-merge regen runs WITHOUT the
# CustomReport. The public Students column must NOT blank — it carries forward the
# last cron values from the existing baked file rather than nulling them. ──
m.EXHIBIT_FILE = None                  # simulate CustomReport absent (clean checkout / session regen)
m.export_credential_reference()        # re-bake into the SAME UC_OUT_DIR (out_js already populated above)
baked2 = open(os.path.join(tmp, "credential_reference_data.js")).read()
baked2 = baked2[baked2.index("=") + 1:].strip().rstrip(";")
by2 = {r["ut"]: r for r in json.loads(baked2)["unified_titles"]}
rA2, rB2 = by2.get(utA, {}), by2.get(utB, {})
expect("carry-forward: A still 7 after a no-CustomReport regen (not nulled)", rA2.get("students_served") == 7)
expect("carry-forward: A still not suppressed", rA2.get("served_suppressed") is False)
expect("carry-forward: B mask preserved (suppressed, exact null)",
       rB2.get("served_suppressed") is True and rB2.get("students_served") is None)
expect("carry-forward: B's exact count still absent from payload",
       '"students_served": 2' not in baked2 and '"students_served":2' not in baked2)

print("\nVERIFIED" if ok else "\nFAILED")
sys.exit(0 if ok else 1)
