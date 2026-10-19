#!/usr/bin/env python3
"""kb/_jev_agri_families.py: the Jev sitting over the Agriculture umbrella's residual code (Sam,
Open Asks Sheet 99 card 4, 2026-10-19: sitting) asks only about identities keyed under AGRI,
hands Jev the five families with the authority's own descriptor titles, bounds the description
it sends, carries the uncalibrated posture on every row, writes its file and re-keys nothing.
The workflow carries the input and uploads the file. Stdlib only; no network."""
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
spec = importlib.util.spec_from_file_location("_jev_agri_families", os.path.join(ROOT, "kb", "_jev_agri_families.py"))
J = importlib.util.module_from_spec(spec)
spec.loader.exec_module(J)

results = []


def check(name, cond):
    results.append((name, bool(cond)))


COURSES = {
    "AGRI M1001": {"course_id": "AGRI M1001", "common_title": "Beef Cattle Production", "description": "x" * 2000,
                   "discipline": "Agriculture", "top_code": "0102.00", "corroboration_members": 3},
    "AGRI M1002": {"course_id": "AGRI M1002", "common_title": "Introduction to Agriculture", "description": "A survey.",
                   "discipline": "Agriculture", "top_code": "0101.00", "corroboration_members": 2},
    "AGAB M1006": {"course_id": "AGAB M1006", "common_title": "Supervision and Management in Agriculture", "description": "",
                   "discipline": "Agricultural Business and Related Services", "top_code": "0112.00", "corroboration_members": 2},
}
SINGLETONS = {
    "AGRI M10AA": {"course_id": "AGRI M10AA", "common_title": "Landscape Irrigation", "college": "Test College", "top_code": "0109.00"},
    "AUTB M10EB": {"course_id": "AUTB M10EB", "common_title": "Body Panel Customizing", "college": "Cerritos College", "top_code": "0949.00"},
}
DESCRIPTORS = [
    {"descriptor": "AG-AB 104", "title": "Introduction to Agriculture Business"},
    {"descriptor": "AG-AS 108 L", "title": "Beef Cattle Science"},
    {"descriptor": "AG-EH 144 X", "title": "Landscape Irrigation"},
    {"descriptor": "AG-MA 108 L", "title": "Tractor Operation"},
    {"descriptor": "AG-PS 104 104", "title": "Introduction to Plant Science"},
    {"descriptor": "AGRI 999", "title": "Not a family descriptor"},
    {"descriptor": "ACCT 110", "title": "Financial Accounting"},
]

# ── the identities ──
every = J.residual_identities(COURSES, SINGLETONS)
check("only identities keyed under AGRI are asked about: %r" % [i["id"] for i in every],
      [i["id"] for i in every] == ["AGRI M1001", "AGRI M1002", "AGRI M10AA"])
check("a cluster's description is bounded", len(every[0]["description"]) == J.DESC_CHARS)
check("a stand-alone carries its college and counts one member", every[2]["colleges"] == ["Test College"] and every[2]["members"] == 1)

# ── the vocabulary ──
vocab = J.family_vocabulary(DESCRIPTORS)
check("five families, each with its C-ID subject and the authority's descriptor titles",
      sorted(vocab) == ["AGAB", "AGAS", "AGEH", "AGMA", "AGPS"] and vocab["AGAS"]["c_id_descriptors"] == ["Beef Cattle Science"]
      and vocab["AGEH"]["c_id_descriptors"] == ["Landscape Irrigation"] and vocab["AGAB"]["c_id_subject"] == "AG-AB")
check("a descriptor outside the five families is not a family's", all("Not a family descriptor" not in v["c_id_descriptors"] for v in vocab.values())
      and all("Financial Accounting" not in v["c_id_descriptors"] for v in vocab.values()))

# ── the state and the questions ──
st = J.state_for(every[0], vocab)
check("the state carries the identity, the families and what the residual means",
      st["identity"]["id"] == "AGRI M1001" and "families" in st and st["residual"]["code"] == "AGRI" and "TOP" in st["note"])
check("the state never carries the discipline field (the umbrella name would steer every answer)", "discipline" not in st["identity"])
qs = J.questions()
check("two questions: the family (a choice among the five and the residual) and whether it is plain",
      sorted(qs) == ["family", "plain"] and qs["family"]["type"] == "choice" and sorted(qs["family"]["criteria"]) == ["AGAB", "AGAS", "AGEH", "AGMA", "AGPS", "AGRI"]
      and qs["plain"]["type"] == "noul")

# ── the rows ──
row = J.answer_row(every[0], {"family": {"choice": "AGAS", "confidence": 0.93}, "plain": {"noul": True}})
check("a row carries the family, its confidence, plain, and the uncalibrated posture",
      row["family"] == "AGAS" and row["family_confidence"] == 0.93 and row["plain"] is True and row["residual"] is False and row["posture"] == "uncalibrated")
row2 = J.answer_row(every[1], {"family": {"choice": "AGRI", "confidence": 0.6}, "plain": {"noul": False}})
check("a residual answer is marked residual", row2["residual"] is True)
check("an empty answer leaves the family blank, never a guess", J.answer_row(every[2], {})["family"] is None)

# ── the run with a fake Jev ──
calls = []


def fake_call(state, questions, key):
    calls.append(state["identity"]["id"])
    fam = {"AGRI M1001": "AGAS", "AGRI M1002": "AGRI", "AGRI M10AA": "AGEH"}[state["identity"]["id"]]
    return {"answers": {"family": {"choice": fam, "confidence": 0.9}, "plain": {"noul": fam != "AGRI"}}}


tmp = tempfile.mkdtemp()
lines = []
res = J.run(call=fake_call, key="k", out_dir=tmp, inputs=(COURSES, SINGLETONS, DESCRIPTORS), out=lines.append)
check("every residual identity is asked once, in id order", calls == ["AGRI M1001", "AGRI M1002", "AGRI M10AA"])
doc = json.load(open(res["path"]))
check("the file tallies the families and names the posture and the ruling",
      doc["families"] == {"AGAS": 1, "AGRI": 1, "AGEH": 1} and doc["posture"] == "uncalibrated" and "Sheet 99 card 4" in doc["_doc"]
      and doc["identities_on_residual"] == 3 and doc["asked"] == 3 and doc["errors"] == 0)
check("the run says what it did", any("3 identities on AGRI" in ln for ln in lines) and any("wrote" in ln for ln in lines))
res2 = J.run(limit=1, call=fake_call, key="k", out_dir=tmp, inputs=(COURSES, SINGLETONS, DESCRIPTORS), out=lines.append)
check("a limit caps the tranche", res2["asked"] == 1)


def failing_call(state, questions, key):
    raise RuntimeError("boom")


res3 = J.run(call=failing_call, key="k", out_dir=tmp, inputs=(COURSES, SINGLETONS, DESCRIPTORS), out=lines.append)
check("one identity's failure never ends the sitting; the row carries the error", res3["errors"] == 3 and res3["asked"] == 3)
dry = []
J.run(dry_run=True, inputs=(COURSES, SINGLETONS, DESCRIPTORS), out=dry.append)
check("a dry run names the questions and calls nothing", any("dry run" in ln for ln in dry) and any("questions: family, plain" in ln for ln in dry))

# ── nothing is re-keyed by the sitting ──
src = open(os.path.join(ROOT, "kb", "_jev_agri_families.py"), encoding="utf-8").read()
check("the sitting writes only its own file (no alias map, no seed, no store)", "alias_map" not in src and "kb_curation" not in src
      and "discipline_canonical_subj4" not in src and "coci_minted_courses.json\"), \"w\"" not in src)

# ── the workflow carries the input and uploads the file ──
wf = open(os.path.join(ROOT, ".github", "workflows", "typesafe-smoke.yml"), encoding="utf-8").read()
check("typesafe-smoke.yml takes agri_families and agri_limit, runs the sitting with the key and uploads kb/jev_out/",
      "agri_families:" in wf and "agri_limit:" in wf and "_jev_agri_families.py" in wf and "jev-agri-families" in wf
      and wf.index("_jev_agri_families.py") < wf.index("jev-agri-families"))

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("ok   " if ok else "FAIL ") + n)
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
