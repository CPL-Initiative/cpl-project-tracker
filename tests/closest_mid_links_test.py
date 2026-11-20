#!/usr/bin/env python3
"""kb/_closest_mid.py's exhibit links and its daily run (COBIx, relayed by Sam, 2026-11-20: "sort the pile by how many
exhibits each M-ID would unlock, so Group Communication, with 67 links, comes first").

WHAT THIS GUARDS (each a way the pile's order or the daily file could go wrong without an error):
  (1) the links join on a fixture: one per articulation record, on the M-ID the record names, only for M-IDs a row
      recommends, and none for an M-ID with no link;
  (2) a stored id from an older era resolves through kb/alias_chain.py (imported) before it is counted, and the count
      says how many records the chain moved;
  (3) a links file without its applied re-key markers is refused, never counted (resolving a current-era file again
      moves links onto unrelated cards; counting an old-era one directly under-reports);
  (4) --if-changed leaves the file untouched when no input changed, including a restamped identity file, and rebuilds
      when an input did;
  (5) two runs on the same inputs, under different hash seeds, write the same bytes.
Run from repo root: python3 tests/closest_mid_links_test.py
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _closest_mid as CM  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


MARKERS = {"_subj4_remint_applied_at": "2026-05-23", "_subj4_fold_applied_at": "2026-06-12",
           "_authority_recode_applied_at": "2026-09-03", "_prefix_fold_applied": [{"at": "2026-09-04"}],
           "_identities_rekeyed": [{"at": "2026-09-05"}]}
COLLEGES = ["Citrus College", "Hartnell College"]
MEMBERS = {"generated_at": "2026-11-20 06:20", "colleges": COLLEGES, "members": {
    "COMM M1037": [{"c": 0, "cn": "K1", "t": "Group Communication", "n": "COMM 140", "u": 3},
                   {"c": 1, "cn": "K2", "t": "Group Communication", "n": "SPCH 4", "u": 3}],
    "COMM M1040": [{"c": 0, "cn": "K3", "t": "Argumentation and Debate", "n": "COMM 120", "u": 3},
                   {"c": 1, "cn": "K4", "t": "Argumentation", "n": "SPCH 9", "u": 3}],
    "WELD M1109": [{"c": 0, "cn": "K5", "t": "Welding I", "n": "WELD 110", "u": 3},
                   {"c": 1, "cn": "K6", "t": "Welding I", "n": "WELD 1", "u": 3}]}}
LOOKUP = {"_built_at": "2026-07-09", "colleges": COLLEGES, "rows": [
    [0, "K1", "COMM", "140", "Group Communication", 3, "C", "", "", "", ""],
    [1, "K2", "SPCH", "4", "Group Communication", 3, "C", "", "", "", ""],
    [0, "K3", "COMM", "120", "Argumentation and Debate", 3, "C", "", "", "", ""],
    [1, "K4", "SPCH", "9", "Argumentation", 3, "C", "", "", "", ""],
    [0, "K5", "WELD", "110", "Welding I", 3, "C", "", "", "", ""],
    [1, "K6", "WELD", "1", "Welding I", 3, "C", "", "", "", ""],
    [1, "P1", "COMM", "6", "Group Communication", 3, "C", "", "", "", ""],
    [0, "P2", "WELD", "120", "Welding II", 3, "C", "", "", "", ""],
    [0, "P3", "COMM", "130", "Argumentation", 3, "C", "", "", "", ""]]}
ARTS = dict(MARKERS, articulations=[{"course_id": "COMM M1037", "exhibit_id": "E%d" % i} for i in range(3)]
            + [{"course_id": "COMM M1040", "exhibit_id": "E9"}, {"course_id": "ART M1001", "exhibit_id": "E10"},
               {"course_id": "", "exhibit_id": "E11"}])


def write_js(path, var, obj):
    with open(path, "w", encoding="utf-8") as f:
        f.write(var + " = " + json.dumps(obj) + ";\n")


def tree():
    d = tempfile.mkdtemp(prefix="closest_mid_test_")
    os.makedirs(os.path.join(d, "kb"))
    write_js(os.path.join(d, "unified_courses_members.js"), "window.CPL_UC_MEMBERS", MEMBERS)
    write_js(os.path.join(d, "coci_lookup_data.js"), "window.CPL_COCI_LOOKUP", LOOKUP)
    write_js(os.path.join(d, "coci_lookup_desc_A.js"), 'window.CPL_COCI_DESC["A"]', {"P1": "Small group communication."})
    for rel, obj in (("kb/coci_not_applicable.json", {"courses": {}}), ("kb/coci_articulations.json", ARTS)):
        with open(os.path.join(d, rel), "w", encoding="utf-8") as f:
            json.dump(obj, f)
    for rel in ("kb/alias_chain.py", "kb/_closest_mid.py"):  # the fingerprint covers the chain and the script
        shutil.copy(os.path.join(ROOT, rel), os.path.join(d, rel))
    return d


def build(d, *extra, seed="0"):
    env = dict(os.environ, PYTHONHASHSEED=seed)
    p = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_closest_mid.py"), "--root", d, "--sample", "6"] + list(extra),
                       capture_output=True, text=True, env=env)
    return p.returncode, p.stdout + p.stderr


d = tree()
try:
    out = os.path.join(d, "kb", "coci_closest_mid.json")
    rc, log = build(d)
    F = json.load(open(out, encoding="utf-8"))
    # (1) the join
    check("(1) the build runs on the fixture", rc == 0 and F["pile"] == 3, log[-400:])
    rec = {k: r[2][0][0] for k, r in F["rows"].items()}
    check("(1) the pile's Group Communication is recommended COMM M1037, and Argumentation COMM M1040",
          rec.get("P1") == "COMM M1037" and rec.get("P3") == "COMM M1040", rec)
    named = {x[0] for r in F["rows"].values() for x in r[2]}
    check("(1) links count one per record on the M-ID it names: COMM M1037 3, COMM M1040 1",
          F["links"].get("COMM M1037") == 3 and F["links"].get("COMM M1040") == 1, F["links"])
    check("(1) only M-IDs a row recommends, each with a link: a linked M-ID no row names (ART M1001) is left out, and so is WELD M1109 with none",
          set(F["links"]) <= named and "ART M1001" not in F["links"] and "WELD M1109" not in F["links"], F["links"])
    check("(1) the file documents the map in row_shape and _what, and counts the records on ids the identity file lacks",
          "links: M-ID: exhibit links" in F["row_shape"] and "exhibit links" in F["_what"] and F["links_on_ids_not_in_identity_file"] == 1,
          F["row_shape"])
    # (2) the alias chain
    maps = [{"OLD M9": "COMM M1037"}, {"COMM M1037": "COMM M1037"}]
    n, moved = CM.exhibit_links({"articulations": [{"course_id": "OLD M9"}, {"course_id": "COMM M1037"}, {"course_id": "X 1"}]}, maps)
    check("(2) a stored id from an older era resolves through the chain before it is counted, and the move is counted",
          n["COMM M1037"] == 2 and n["X 1"] == 1 and "OLD M9" not in n and moved == 1, (dict(n), moved))
    check("(2) the builder imports kb/alias_chain.py, and its pending maps for a current-era file are none",
          CM.alias_chain.__file__.endswith(os.path.join("kb", "alias_chain.py")) and CM.link_maps(ARTS) == []
          and F["links_moved_by_alias_chain"] == 0)
    # (3) the era guard
    try:
        CM.link_maps({"articulations": []})
        refused = False
    except SystemExit as e:
        refused = "applied markers" in str(e)
    check("(3) a links file without its applied re-key markers is refused", refused)
    # (4) --if-changed
    before = open(out, "rb").read()
    st = os.stat(out).st_mtime_ns
    rc2, log2 = build(d, "--if-changed")
    check("(4) unchanged inputs: --if-changed exits 0 and leaves the file untouched",
          rc2 == 0 and "inputs unchanged" in log2 and open(out, "rb").read() == before and os.stat(out).st_mtime_ns == st, log2[-300:])
    m2 = dict(MEMBERS, generated_at="2026-11-21 06:20")
    write_js(os.path.join(d, "unified_courses_members.js"), "window.CPL_UC_MEMBERS", m2)
    rc3, log3 = build(d, "--if-changed")
    check("(4) a restamped identity file alone changes nothing", rc3 == 0 and "inputs unchanged" in log3 and open(out, "rb").read() == before, log3[-300:])
    arts2 = dict(ARTS, articulations=ARTS["articulations"] + [{"course_id": "COMM M1040", "exhibit_id": "E12"}])
    with open(os.path.join(d, "kb", "coci_articulations.json"), "w", encoding="utf-8") as f:
        json.dump(arts2, f)
    rc4, log4 = build(d, "--if-changed")
    F4 = json.load(open(out, encoding="utf-8"))
    check("(4) a new exhibit link is an input change: the file rebuilds with the new count and a new fingerprint",
          rc4 == 0 and "inputs unchanged" not in log4 and F4["links"].get("COMM M1040") == 2 and F4["fingerprint"] != F["fingerprint"], log4[-300:])
    # (5) the same bytes
    b1 = open(out, "rb").read()
    rc5, _ = build(d, seed="4242")
    check("(5) a second run on the same inputs, under another hash seed, writes the same bytes", rc5 == 0 and open(out, "rb").read() == b1)
finally:
    shutil.rmtree(d, ignore_errors=True)

bad = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("  ok  " if ok else "  FAIL ") + name + ("" if ok or not why else "\n        " + str(why)[:400]))
print("\nclosest_mid_links: %d/%d checks passed" % (len(results) - len(bad), len(results)))
sys.exit(1 if bad else 0)
