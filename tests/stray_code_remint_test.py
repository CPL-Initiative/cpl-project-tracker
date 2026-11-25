#!/usr/bin/env python3
"""Fixture checks for kb/_stray_code_remint.py (S733), one per failure the dry run must never produce: a Low or None
local subject taken into scope, an M-ID whose courses span an in-scope and an out-of-scope local subject retired
instead of held, a pointer left between a retired id and one that stays, a person's save retired over, and a dry run
that writes anywhere but its own out dir. The apply: it refuses each bad input (no receipt or fresh read, a drifted
pin, a receipt that is not the plan, a person's row or drift in the fresh read, a second run), apply then rollback is
byte-identical, a merged shell resolves through kb/alias_chain.resolve to its target, and a held id is untouched.

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


FIELDS = ["college", "local_subject", "local_subject_title", "proposed_common_subject", "discipline", "confidence", "basis",
          "filed_common", "filed_by", "courses", "stray_mids", "sample_course_titles", "rescored"]


def write_csv(path, rows):
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, FIELDS)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in FIELDS})


def fixture(curation=None, decisions=None, articulations=None):
    """Three colleges, one stray code STRY. M1001: one course at X (95). M1002: a course at X and one at Z (89)
    (mixed). M1003: a course at Y only (blank, out of scope). M1004 merges into M1001. M1005: one course at W (90)."""
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
    {"college": "X College", "local_subject": "STRY", "proposed_common_subject": "ARTS", "confidence": "95"},
    {"college": "W College", "local_subject": "WSTR", "proposed_common_subject": "ARTS", "confidence": "90"},
    {"college": "Z College", "local_subject": "STRY", "proposed_common_subject": "ARTS", "confidence": "89"},
    {"college": "Y College", "local_subject": "STRY", "proposed_common_subject": "", "confidence": ""}])
scope, all_rows = sr.read_scope(csv_path)

# 1. Only rows at or above the threshold (90 of 100) are in scope: 90 is in, 89 and a blank are out.
check("scope: 95 and 90 are in, 89 and a blank are out",
      set(scope) == {("X College", "STRY"), ("W College", "WSTR")} and len(all_rows) == 4)
real_scope, real_all = sr.read_scope(os.path.join(ROOT, sr.RESCORE))
check("scope: the committed rescore gives 66 local subjects, every one at 90 or more",
      len(real_scope) == 66 and all(int(r["confidence"]) >= sr.THRESHOLD for r in real_scope.values()))
check("scope: no committed row under 90 is taken, and the rescore carries no level column",
      len([r for r in real_all.values() if int(r["confidence"] or 0) < sr.THRESHOLD]) == 50
      and all("level" not in r for r in real_all.values()))

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
check("dry run: the receipt retires no id outside the subjects at 90 or more",
      all((c["college"], c["subject"]) in real_scope for v in receipt["retire"].values() for c in v["courses"]))

# 3b. The committed rescore and its picks list are what kb/_stray_code_rescore.py writes (no Low/Medium/High: a 0-100
# confidence; r-confidence-0-100-in-all-commons-procedures-sam-2026-11-25).
import subprocess  # noqa: E402
check("rescore: the committed CSV and picks list are current",
      subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_stray_code_rescore.py"), "--check"],
                     capture_output=True).returncode == 0)

# 4. The apply. A fixture with each fate: STRY M1001 retires (X College STRY is filed), STRY M1004 is merged into it
# and retires with it, STRY M1006 is a shell merged into ARTS M1001 (an M-ID that stays) and takes an alias, WSTR M1005
# sits on W College WSTR, at 90 but with only the rescore's proposal, so it is held (DECIDED_UNFILED).
def apply_fixture():
    inp = fixture()
    d = inp["docs"]
    inp["coci"]["rows"] += [[0, "F", "STRY", "7", "Ink"] + [0, "C", "", "", "", ""],
                            [0, "G", "ARTS", "8", "Art"] + [0, "C", "", "", "", ""]]
    d["singletons"]["courses"]["STRY M1006"] = {"course_id": "STRY M1006", "common_title": "Ink", "discipline": None,
                                                "college": "X College", "control_number": "F", "subject": "STRY",
                                                "course_number": "7", "typical_units": 3.0, "credit_status": "Credit",
                                                "top_code": "1002.00"}
    d["courses"]["courses"]["ARTS M1001"] = {"course_id": "ARTS M1001", "common_title": "Art", "discipline": "Art"}
    d["memberships"]["memberships"]["ARTS M1001"] = [{"college": "X College", "control_number": "G"}]
    d["curation"]["curations"]["STRY M1006"] = {"merge_into": "ARTS M1001", "reviewed_by": "automerge-v1@bot"}
    d["curation"]["curations"]["STRY M1001"] = {"unified_title": "Painting", "reviewed_by": "automerge-titlelane-v1@bot"}
    for name, mk in sr.DOC_MAPS:
        d[name] = dict({"_status": "fixture", "count": len(d[name][mk])}, **d[name])
    return inp


apply_csv = os.path.join(tmp, "rescore_apply.csv")
write_csv(apply_csv, [
    {"college": "X College", "local_subject": "STRY", "proposed_common_subject": "ARTS", "confidence": "95",
     "filed_common": "ARTS"},
    {"college": "W College", "local_subject": "WSTR", "proposed_common_subject": "ARTS", "confidence": "90"},
    {"college": "Z College", "local_subject": "STRY", "proposed_common_subject": "ARTS", "confidence": "89"},
    {"college": "Y College", "local_subject": "STRY", "proposed_common_subject": "", "confidence": ""}])
ascope, aall = sr.read_scope(apply_csv)


def apply_run(inp=None, receipt_edit=None, live_edit=None, pins_edit=None):
    inp = inp or apply_fixture()
    plan0 = sr.compute_plan(inp, ascope, aall, pins=None)
    pins = {k: (v["title"], v["target"]) for k, v in plan0["retire"].items()}
    if pins_edit:
        pins_edit(pins)
    p = sr.compute_plan(inp, ascope, aall, pins)
    rec = json.loads(json.dumps({"_scope": sr.SCOPE, "_status": "... DRY RUN, not applied",
                                 "retire": p["retire"], "held": p["held"]}))
    if receipt_edit:
        receipt_edit(rec)
    ids = set(rec["retire"]) | {k for k, v in rec["held"].items() if v["reason"].startswith("merged into")}
    live = sr.overlay_rows(inp["docs"]["curation"]["curations"], ids)
    if live_edit:
        live_edit(live)
    return inp, p, sr.apply_core(inp, ascope, p, rec, live)


inp_a, plan_a, res = apply_run()
check("apply: the fixture applies with every gate passing", res["ok"])
check("apply: the filed id and the id merged into it retire", res["retire"] == {"STRY M1001", "STRY M1004"})
check("apply: the merged shell takes an alias to its merge target", res["alias"] == {"STRY M1006": "ARTS M1001"})
check("held: an id on a local subject with only a proposal is held at the apply",
      "WSTR M1005" in res["held"] and "DECIDED_UNFILED" in res["held"]["WSTR M1005"])
new = res["docs"]
check("held: the held and the mixed ids are untouched in every document",
      all(new[n][mk].get(k) == inp_a["docs"][n][mk].get(k) for n, mk in sr.DOC_MAPS for k in ("WSTR M1005", "STRY M1002"))
      and "WSTR M1005" in new["courses"]["courses"] and "STRY M1002" in new["courses"]["courses"])
check("apply: the retired and aliased ids leave every document, and their rows leave the overlay",
      not any(k in new[n][mk] for n, mk in sr.DOC_MAPS for k in ("STRY M1001", "STRY M1004", "STRY M1006")))
check("apply: the shell's course joins its target's memberships",
      [m["control_number"] for m in new["memberships"]["memberships"]["ARTS M1001"]] == ["G", "F"])
check("apply: the headers' counts follow the documents",
      all(new[n]["count"] == len(new[n][mk]) for n, mk in sr.DOC_MAPS))
check("apply: the kb_curation delete lists the bot rows on the retired and aliased ids, and only those",
      {(r["course_id"], r["field"]) for r in sr.supabase_plan(res["live"], res["retire"] | set(res["alias"]), "d")[0]["rows"]}
      == {("STRY M1001", "unified_title"), ("STRY M1004", "merge_into"), ("STRY M1006", "merge_into")})

# The apply refuses each bad input.
refusals = [
    ("a drifted pin (V0)", {"pins_edit": lambda p: p.update({"STRY M1001": ("Painting", "PHOT")})}, "V0_pinned_set"),
    ("a receipt with another retire set (P1)", {"receipt_edit": lambda r: r["retire"].pop("STRY M1004")},
     "P1_matches_receipt"),
    ("a receipt that is not a dry run (P1)", {"receipt_edit": lambda r: r.update(_status="APPLIED")},
     "P1_matches_receipt"),
    ("a record changed since the dry run (P1)",
     {"receipt_edit": lambda r: r["retire"]["STRY M1001"]["record"].update(common_title="Paint")}, "P1_matches_receipt"),
    ("a person's row on a retiring id (P3)",
     {"live_edit": lambda rows: [x.update(reviewer_email="a.person@college.edu") for x in rows
                                 if x["course_id"] == "STRY M1001"]}, "P3_fresh_read"),
    ("a person's CN: row pointing at a retiring id (P3)",
     {"live_edit": lambda rows: rows.append({"course_id": "CN:Q", "field": "merge_into", "value": "STRY M1001",
                                             "reviewer_email": "map@rccd.edu"})}, "P3_fresh_read"),
    ("a live row the committed overlay lacks (P3 drift)",
     {"live_edit": lambda rows: rows.append({"course_id": "STRY M1004", "field": "description", "value": "x",
                                             "reviewer_email": "cobix-s700@bot"})}, "P3_fresh_read"),
]
for why, kw, gate in refusals:
    _, _, bad = apply_run(**kw)
    check("apply: refuses " + why, not bad["ok"] and not bad["gates"][gate]["pass"] and "docs" not in bad)

def refused(argv):
    try:
        with redirect_stdout(io.StringIO()):
            sr.main(argv)
        return False
    except SystemExit as e:
        return e.code not in (0, None)


rdir = os.path.join(tmp, "receipt")
os.makedirs(os.path.join(rdir, sr.APPLIED))
rpath, fpath = os.path.join(rdir, "retire.json"), os.path.join(rdir, "live.json")
sr.er.dump(rpath, {"_scope": sr.SCOPE, "_status": "DRY RUN", "retire": {}, "held": {}})
sr.er.dump(fpath, [])
check("apply: refuses without --receipt and --fresh-read", refused(["--apply"]))
check("apply: refuses without --fresh-read", refused(["--apply", "--receipt", rpath]))
check("apply: refuses a receipt that does not exist",
      refused(["--apply", "--receipt", os.path.join(tmp, "nope.json"), "--fresh-read", fpath]))
sr.er.dump(os.path.join(tmp, "bad_live.json"), {"rows": [{"id": 1}]})
check("apply: refuses a fresh read that is not kb_curation rows",
      refused(["--apply", "--receipt", rpath, "--fresh-read", os.path.join(tmp, "bad_live.json")]))
sr.er.dump(os.path.join(rdir, sr.APPLIED, "retire_applied.json"), {"_applied_at": "2026-11-25"})
check("apply: refuses a second apply (P0)", refused(["--apply", "--receipt", rpath, "--fresh-read", fpath]))
sr.er.dump(os.path.join(tmp, "w.json"), [{"rows": [{"course_id": "a", "field": "b"}]}])
check("read_live: unwraps the SQL runner's one-value result", len(sr.read_live(os.path.join(tmp, "w.json"))) == 1)

# Apply then rollback is byte-identical on the fixture, through the files and the CLI.
froot = os.path.join(tmp, "froot")
fkb = os.path.join(froot, "kb")
os.makedirs(fkb)
fx = apply_fixture()
for name, _ in sr.DOC_MAPS:
    sr.er.dump(os.path.join(fkb, sr.er.FILES[name]), fx["docs"][name])
shas = {sr.er.FILES[n]: {"before": sr.sha_file(os.path.join(fkb, sr.er.FILES[n]))} for n, _ in sr.DOC_MAPS}
_, _, fres = apply_run(inp=apply_fixture())
for f, s in sr.write_docs(fkb, fres["docs"]).items():
    shas[f]["after"] = s
check("apply: the fixture files changed", all(v["before"] != v["after"] for v in shas.values()))
frec = os.path.join(tmp, "fixture_applied.json")
sr.er.dump(frec, {"_status": "APPLIED", "_applied_at": "2026-11-25", "sha256": shas,
                  "rollback": json.loads(json.dumps(fres["rollback"]))})
try:
    with redirect_stdout(io.StringIO()):
        rc = sr.main(["--rollback", "--receipt", frec, "--root", froot])
except SystemExit as e:
    rc = e.code
check("rollback: restores every fixture file byte for byte",
      rc == 0 and all(sr.sha_file(os.path.join(fkb, f)) == v["before"] for f, v in shas.items()))
check("rollback: refuses a receipt already rolled back", refused(["--rollback", "--receipt", frec, "--root", froot]))
sr.er.dump(frec, {"_status": "APPLIED", "_applied_at": "2026-11-25", "sha256": shas, "rollback": fres["rollback"]})
check("rollback: refuses when a file changed since the apply", refused(["--rollback", "--receipt", frec, "--root", froot]))

# A merged shell resolves through kb/alias_chain.resolve to its target.
check("alias: a fixture shell resolves to its target through alias_chain.resolve",
      sr.ac.resolve("STRY M1006", [fres["alias"]])[0] == "ARTS M1001"
      and sr.ac.resolve("STRY M1001", [fres["alias"]])[0] == "STRY M1001")

# The committed apply: its alias map is registered, each shell resolves to its target through the whole chain, the
# held ids stay in the catalog, and its rollback restores the committed files' pre-apply bytes.
APPLIED_DIR = os.path.join(ROOT, "kb", "stray_code_remint_out", "2026-11-25", sr.APPLIED)
AMAP = "kb/stray_code_remint_out/2026-11-25/applied/alias_map.json"
if os.path.exists(os.path.join(APPLIED_DIR, "retire_applied.json")):
    with open(os.path.join(APPLIED_DIR, "retire_applied.json"), encoding="utf-8") as f:
        crec = json.load(f)
    maps = sr.ac.load_maps(sr.ac.ALIAS_MAPS)
    check("alias: the committed map is registered in ALIAS_MAPS", AMAP in sr.ac.ALIAS_MAPS)
    check("alias: every committed shell resolves to its merge target through the whole chain",
          crec["aliased"] and all(sr.ac.resolve(k, maps)[0] == t for k, t in crec["aliased"].items()))
    # Only this map's era: an older map can name the same string for the row that held the slot then.
    check("alias: no retired id is in the alias map (it has no successor), and today's ids pass through it",
          all(sr.ac.resolve(k, sr.ac.load_maps([AMAP]))[0] == k for k in crec["retired"]))
    docs = sr.er.load_docs(os.path.join(ROOT, "kb"))
    live_ids = set(docs["courses"]["courses"]) | set(docs["singletons"]["courses"])
    check("held: every id held at the apply is still in the catalog, and no retired or aliased id is",
          set(crec["held_at_apply"]) <= live_ids and not (set(crec["retired"]) | set(crec["aliased"])) & live_ids)
    applied_now = all(sr.sha_file(os.path.join(ROOT, "kb", f)) == v["after"] for f, v in crec["sha256"].items())
    if applied_now:
        back = sr.rollback_docs(docs, crec["rollback"])
        same = True
        for name, _ in sr.DOC_MAPS:
            p = os.path.join(tmp, "rb_" + name)
            sr.er.dump(p, back[name])
            same = same and sr.sha_file(p) == crec["sha256"][sr.er.FILES[name]]["before"]
        check("rollback: the committed receipt restores the committed files' pre-apply bytes", same)
    check("apply: the committed apply refuses to run again (P0)",
          refused(["--apply", "--receipt", os.path.join(os.path.dirname(APPLIED_DIR), "retire.json"), "--fresh-read",
                   os.path.join(os.path.dirname(APPLIED_DIR), "fresh_read_from_overlay.json")]))

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
