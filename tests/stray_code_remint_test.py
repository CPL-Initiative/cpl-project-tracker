#!/usr/bin/env python3
"""Fixture checks for kb/_stray_code_remint.py (S733), one per failure the dry run must never produce: a Low or None
local subject taken into scope, an M-ID whose courses span an in-scope and an out-of-scope local subject retired
instead of held, a pointer left between a retired id and one that stays, a person's save retired over, and a dry run
that writes anywhere but its own out dir. Also: the apply refuses.

Run from repo root: python3 tests/stray_code_remint_test.py
"""
import csv
import hashlib
import io
import json
import os
import sys
import tempfile
from contextlib import redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _stray_code_remint as sr  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


FIELDS = ["college", "local_subject", "local_subject_title", "proposed_common_subject", "discipline", "level", "basis",
          "filed_common", "filed_by", "courses", "stray_mids", "sample_course_titles", "rescored"]


def write_csv(path, rows):
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, FIELDS)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in FIELDS})


def fixture(curation=None, decisions=None, articulations=None):
    """Three colleges, one stray code STRY. M1001: one course at High X. M1002: a course at High X and one at Low Z
    (mixed). M1003: a course at None Y only (out of scope). M1004 merges into M1001. M1005: one course at Medium W."""
    colleges = ["X College", "Y College", "Z College", "W College"]
    rows = [[0, "A", "STRY", "1", "Painting"], [0, "A2", "STRY", "2", "Drawing"], [2, "B", "STRY", "3", "Drawing"],
            [1, "C", "STRY", "4", "Sculpture"], [0, "D", "STRY", "5", "Etching"], [3, "E", "WSTR", "6", "Clay"]]
    rows = [r + [0, "C", "", "", "", ""] for r in rows]
    mem = {"STRY M1001": [{"c": 0, "cn": "A"}], "STRY M1002": [{"c": 0, "cn": "A2"}, {"c": 2, "cn": "B"}],
           "STRY M1003": [{"c": 1, "cn": "C"}], "WSTR M1005": [{"c": 3, "cn": "E"}]}
    course = lambda k, t: {"course_id": k, "common_title": t, "discipline": None}  # noqa: E731
    docs = {"courses": {"courses": {"STRY M1001": course("STRY M1001", "Painting"),
                                    "STRY M1002": course("STRY M1002", "Drawing"),
                                    "STRY M1003": course("STRY M1003", "Sculpture"),
                                    "WSTR M1005": course("WSTR M1005", "Clay")}},
            "singletons": {"courses": {"STRY M1004": dict(course("STRY M1004", "Etching"), college="X College",
                                                          control_number="D")}},
            "memberships": {"memberships": {"STRY M1001": [{"control_number": "A"}],
                                            "STRY M1002": [{"control_number": "A2"}, {"control_number": "B"}],
                                            "STRY M1003": [{"control_number": "C"}],
                                            "WSTR M1005": [{"control_number": "E"}]}},
            "articulations": {"articulations": articulations or []},
            "curation": {"curations": curation if curation is not None else
                         {"STRY M1004": {"merge_into": "STRY M1001", "reviewed_by": "automerge-v1@bot"}}}}
    inp = {"docs": docs, "members": {"colleges": colleges, "members": mem},
           "coci": {"colleges": colleges, "rows": rows}, "stray_codes": {"STRY", "WSTR"},
           "not_applicable": {}, "promotions": {"promotions": {}, "_rekeyed_through": list(sr.ac.ALIAS_MAPS)},
           "decisions": decisions or {"courses": []}}
    return inp


tmp = tempfile.mkdtemp(prefix="stray_remint_test_")
csv_path = os.path.join(tmp, "rescore.csv")
write_csv(csv_path, [
    {"college": "X College", "local_subject": "STRY", "proposed_common_subject": "ARTS", "level": "High"},
    {"college": "W College", "local_subject": "WSTR", "proposed_common_subject": "ARTS", "level": "Medium"},
    {"college": "Z College", "local_subject": "STRY", "proposed_common_subject": "ARTS", "level": "Low"},
    {"college": "Y College", "local_subject": "STRY", "proposed_common_subject": "", "level": "None"}])
scope, all_rows = sr.read_scope(csv_path)

# 1. Only High and Medium are in scope.
check("scope: High and Medium are in, Low and None are out",
      set(scope) == {("X College", "STRY"), ("W College", "WSTR")} and len(all_rows) == 4)
real_scope, real_all = sr.read_scope(os.path.join(ROOT, sr.RESCORE))
check("scope: the committed rescore gives 62 local subjects, every one High or Medium",
      len(real_scope) == 62 and {r["level"] for r in real_scope.values()} == {"High", "Medium"})
check("scope: no committed Low or None row is taken", all(r["level"] in ("High", "Medium") for r in real_scope.values())
      and len([r for r in real_all.values() if r["level"] in ("Low", "None")]) == 54)

plan = sr.compute_plan(fixture(), scope, all_rows, pins=None)
check("plan: the all-in-scope id retires", "STRY M1001" in plan["retire"] and "WSTR M1005" in plan["retire"])
check("plan: an id only on an out-of-scope subject is left alone", "STRY M1003" in plan["out_of_scope"]
      and "STRY M1003" not in plan["retire"] and "STRY M1003" not in plan["held"])

# 2. A mixed-scope id is held, never retired.
check("mixed: an id on an in-scope and an out-of-scope subject is held",
      "STRY M1002" in plan["held"] and plan["held"]["STRY M1002"]["reason"].startswith("mixed scope")
      and "STRY M1002" not in plan["retire"])
check("mixed: no retired id has an out-of-scope course",
      plan["validation"]["V3_no_retired_id_has_an_out_of_scope_course"]["pass"])

# A merge between two retiring ids retires both; one into an id that stays holds the source.
check("pointer: a shell merged into a retiring id retires with it", "STRY M1004" in plan["retire"])
p2 = sr.compute_plan(fixture(curation={"STRY M1004": {"merge_into": "STRY M1002", "reviewed_by": "x@bot"}}),
                     scope, all_rows, pins=None)
check("pointer: a shell merged into a held id is held", "STRY M1004" in p2["held"]
      and p2["held"]["STRY M1004"]["reason"].startswith("merged into STRY M1002"))
p3 = sr.compute_plan(fixture(curation={"STRY M1003": {"honors_of": ["STRY M1001"], "reviewed_by": "x@bot"}}),
                     scope, all_rows, pins=None)
check("pointer: an id another id that stays points at is held", "STRY M1001" in p3["held"])

# A person's save, a course move, an articulation each hold the id.
p4 = sr.compute_plan(fixture(curation={"STRY M1001": {"unified_title": "Paint", "reviewed_by": "a.person@college.edu"}}),
                     scope, all_rows, pins=None)
check("person: a person's kb_curation save holds the id", "STRY M1001" in p4["held"])
p5 = sr.compute_plan(fixture(decisions={"courses": [{"from_mid": "WSTR M1005"}]}), scope, all_rows, pins=None)
check("person: a course move off the id holds it", "WSTR M1005" in p5["held"])
p6 = sr.compute_plan(fixture(articulations=[{"course_id": "WSTR M1005"}]), scope, all_rows, pins=None)
check("articulation: an id MAP articulations name is held", "WSTR M1005" in p6["held"])

# Pins: V0 fails on drift.
pins = {k: (v["title"], v["target"]) for k, v in plan["retire"].items()}
check("pins: the frozen set passes V0", sr.compute_plan(fixture(), scope, all_rows, pins)["validation"]["V0_pinned_set"]["pass"])
pins["STRY M1001"] = ("Painting", "PHOT")
check("pins: a drifted target fails V0", not sr.compute_plan(fixture(), scope, all_rows, pins)["validation"]["V0_pinned_set"]["pass"])
check("pins: every committed pin is on a stray code and names a target",
      all(v[1] for v in sr.PINS.values()) and len(sr.PINS) > 0)

# 3. A dry run on the committed data writes nothing outside its out dir.
def snapshot():
    out = {}
    for d in (ROOT, os.path.join(ROOT, "kb"), os.path.join(ROOT, "kb", "status")):
        for n in os.listdir(d):
            p = os.path.join(d, n)
            if os.path.isfile(p):
                st = os.stat(p)
                out[p] = (st.st_size, st.st_mtime_ns)
    for rel in list(sr.INPUTS.values()) + ["kb/" + f for f in sr.er.FILES.values()]:
        with open(os.path.join(ROOT, rel), "rb") as f:
            out["sha:" + rel] = hashlib.sha256(f.read()).hexdigest()
    return out


out_dir = os.path.join(tmp, "out")
saved = sr.OUT_ROOT
sr.OUT_ROOT = out_dir
before = snapshot()
buf = io.StringIO()
try:
    with redirect_stdout(buf):
        sr.main([])
finally:
    sr.OUT_ROOT = saved
after = snapshot()
written = sorted(os.path.relpath(os.path.join(dp, f), out_dir) for dp, _, fs in os.walk(out_dir) for f in fs)
check("dry run: no file in the repo root, kb/ or kb/status/ changed, nor any input", before == after)
check("dry run: it wrote its report and retire list, and only those, into its out dir",
      len(written) == 2 and {os.path.basename(w) for w in written} == {"report.md", "retire.json"})
with open(os.path.join(out_dir, written[0].split(os.sep)[0], "retire.json"), encoding="utf-8") as f:
    receipt = json.load(f)
check("dry run: the receipt says DRY RUN and carries no applied stamp",
      "DRY RUN" in receipt["_status"] and "_applied_at" not in receipt)
check("dry run: the receipt retires no id outside the High and Medium subjects",
      all((c["college"], c["subject"]) in real_scope for v in receipt["retire"].values() for c in v["courses"]))

# 4. The apply refuses.
for argv, why in ((["--apply"], "without --receipt and --fresh-read"),
                  (["--apply", "--receipt", "r.json", "--fresh-read", "f.json"], "even with both (not built)")):
    try:
        sr.main(argv)
        refused = False
    except SystemExit as e:
        refused = e.code not in (0, None)
    check("apply: refuses " + why, refused)

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
