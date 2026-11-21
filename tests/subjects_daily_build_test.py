#!/usr/bin/env python3
"""The Commons Subjects card's two files rebuilt in the daily build (S695).

WHAT THIS GUARDS (each a way the card would go stale or churn):
  (1) scripts/daily_build.sh runs kb/_build_local_subject_titles.py and then kb/_held_subject_codes.py, both with
      --if-changed, after the steps whose outputs they read (the pipeline, the course flags, the closest M-ID), and a
      failure warns and restores yesterday's file instead of stopping the publish;
  (2) the workflow's commit list stages both files;
  (3) each fingerprint ignores a daily stamp (the state list's _built_at, the plan's date) and changes when a deciding
      input changes;
  (4) a second run on the same inputs writes nothing, and a run after a deciding change writes;
  (5) the held builder stops, writing nothing, when the dry run's plan loses the held list's shape (PR #3626 edits the
      dry run), and it runs the dry run in memory, never writing under kb/pile_mint_out/.

Run from repo root: python3 tests/subjects_daily_build_test.py
"""
import copy
import gzip
import importlib.util
import json
import os
import re
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


lst = load("lst_daily", "kb/_build_local_subject_titles.py")
hsc = load("hsc_daily", "kb/_held_subject_codes.py")

FAILS = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        FAILS.append(name)


# ── (1) the build script ──────────────────────────────────────────────────
src = open(os.path.join(ROOT, "scripts", "daily_build.sh"), encoding="utf-8").read()
blocks = re.findall(r'^step "([^"]+)"[^\n]*<<\'STEP\'\n(.*?)^STEP$', src, re.M | re.S)
names = [n for n, _ in blocks]
body = dict(blocks)


def at(pred):
    return next((i for i, (n, b) in enumerate(blocks) if pred(n, b)), -1)


pipeline = at(lambda n, b: n == "Run dashboard pipeline")
flags = at(lambda n, b: "kb/_build_not_applicable.py" in b)
closest = at(lambda n, b: "kb/_closest_mid.py" in b)
titles = at(lambda n, b: "kb/_build_local_subject_titles.py" in b)
held = at(lambda n, b: "kb/_held_subject_codes.py" in b)
check("(1) both builders sit in the build script", titles >= 0 and held >= 0)
check("(1) local subject titles run after the pipeline, the course flags and the closest M-ID",
      min(pipeline, flags, closest) >= 0 and titles > max(pipeline, flags, closest))
check("(1) the held codes run after the local subject titles they join printed names from", held > titles)
check("(1) the held codes run before the Commons status and the copy to index.html",
      held < at(lambda n, b: n == "Build the Commons status") and held < at(lambda n, b: n == "Copy dashboard to index.html"))
for label, i, out in (("titles", titles, "kb/status/local_subject_titles.json"), ("held", held, "kb/status/held_subject_codes.json")):
    b = blocks[i][1] if i >= 0 else ""
    check(f"(1) {label}: --if-changed, a warning on failure and yesterday's file restored",
          "--if-changed" in b and "::warning" in b and f"git checkout -- {out}" in b and "||" in b)
    check(f"(1) {label}: takes no secret", (blocks[i][0] if i >= 0 else "") and
          re.search(r'^step "%s"\s*<<' % re.escape(blocks[i][0]), src, re.M) is not None)
check("(5) the daily step computes the plan in memory (no --plan, no dry run main)",
      held >= 0 and "--plan" not in blocks[held][1] and "_pile_mint_dryrun.py" not in blocks[held][1])

# ── (2) the commit list ───────────────────────────────────────────────────
wf = open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8").read()
for out in ("kb/status/local_subject_titles.json", "kb/status/held_subject_codes.json"):
    check(f"(2) the commit step stages {out}", re.search(r"git add [^\n]*" + re.escape(out), wf) is not None)

# ── (3, 4) the held codes: fingerprint and write ──────────────────────────
HELD = [{"college": "Alpha College", "control_number": "C1", "subject": "TUTR", "title": "Supervised Tutoring"},
        {"college": "Beta College", "control_number": "C2", "subject": "TUTR", "title": "Tutoring Practicum"}]
FLOORS = {"college_subject_code": {"support_min": 50, "share_min": 1.0},
          "statewide_subject_code": {"support_min": 100, "share_min": 1.0}}


def held_doc(held, plan_date="2026-11-21", identity="unified_courses_members.js generated_at 2026-11-21 02:01"):
    return hsc.build(held, FLOORS, {}, {}, {}, {}, sources={"plan_date": plan_date, "identity_file": identity})


a = held_doc(HELD)
check("(3) held: the fingerprint ignores the plan's date and the identity file's stamp",
      hsc.fingerprint(a) == hsc.fingerprint(held_doc(HELD, "2026-11-22", "unified_courses_members.js generated_at 2026-11-22 01:08")))
check("(3) held: the fingerprint changes when a held course changes",
      hsc.fingerprint(a) != hsc.fingerprint(held_doc(HELD[:1])))
moved = copy.deepcopy(HELD)
moved[1]["subject"] = "TUT"
check("(3) held: the fingerprint changes when a course's subject code changes", hsc.fingerprint(a) != hsc.fingerprint(held_doc(moved)))

tmp = tempfile.mkdtemp()
try:
    out = os.path.join(tmp, "held_subject_codes.json")
    check("(4) held: the first run writes", hsc.write_if_changed(held_doc(HELD), out, True) and os.path.exists(out))
    first = open(out, "rb").read()
    check("(4) held: the file carries its fingerprint", json.loads(first).get("fingerprint") == hsc.fingerprint(held_doc(HELD)))
    os.utime(out, (1_000_000_000, 1_000_000_000))
    wrote = hsc.write_if_changed(held_doc(HELD, "2026-11-22"), out, True)
    check("(4) held: a second run on the same list writes nothing, the next day's date included",
          not wrote and open(out, "rb").read() == first and os.stat(out).st_mtime == 1_000_000_000)
    # A file written before the field existed (the committed one at #3625) compares by its content.
    d = json.loads(first)
    d.pop("fingerprint")
    open(out, "w").write(hsc.dump(d))
    check("(4) held: a file without the field and the same content is left as it is",
          not hsc.write_if_changed(held_doc(HELD), out, True) and "fingerprint" not in json.load(open(out)))
    check("(4) held: a changed list writes", hsc.write_if_changed(held_doc(HELD[:1]), out, True)
          and json.load(open(out))["totals"]["held"] == 1)
    check("(4) held: without --if-changed the build always writes", hsc.write_if_changed(held_doc(HELD[:1]), out, False))
finally:
    shutil.rmtree(tmp)

# ── (5) the plan's shape ──────────────────────────────────────────────────
plan = {"held": {"no_route_gives_a_subj4": HELD}, "self_recall": {"thresholds": FLOORS}}
check("(5) held: a plan of the expected shape reads", hsc.held_of(plan) == (HELD, FLOORS))
for label, bad in (("no held list", {"self_recall": {"thresholds": FLOORS}}),
                   ("a renamed held key", {"held": {"no_subj4": HELD}, "self_recall": {"thresholds": FLOORS}}),
                   ("no floors", {"held": {"no_route_gives_a_subj4": HELD}}),
                   ("a row without its control number",
                    {"held": {"no_route_gives_a_subj4": [{"college": "A", "subject": "X", "title": "T"}]},
                     "self_recall": {"thresholds": FLOORS}})):
    try:
        hsc.held_of(bad)
        stopped = False
    except SystemExit:
        stopped = True
    check(f"(5) held: {label} stops the build", stopped)
hsrc = open(os.path.join(ROOT, "kb", "_held_subject_codes.py"), encoding="utf-8").read()
check("(5) held: the builder never calls the dry run's main, which writes kb/pile_mint_out/",
      "pm.main(" not in hsrc and "pile_mint_out" not in re.sub(r'""".*?"""', "", hsrc, flags=re.S))


# ── (3, 4) the local subject titles, end to end on a fixture tree ─────────
def gz(path, obj):
    with open(path, "wb") as f:
        f.write(gzip.compress(json.dumps(obj).encode("utf-8"), mtime=0))


def state(root, built_at, rows):
    open(os.path.join(root, "coci_lookup_data.js"), "w").write("window.CPL_COCI_LOOKUP = " + json.dumps(
        {"_built_at": built_at, "colleges": ["Alpha College"], "rows": rows}) + ";\n")


root = tempfile.mkdtemp()
was_root = lst.ROOT
try:
    cat = os.path.join(root, "kb", "hand_filed_catalogs", "courses")
    os.makedirs(cat)
    os.makedirs(os.path.join(root, "kb", "reference"))
    os.makedirs(os.path.join(root, "kb", "status"))
    json.dump({"colleges": [{"slug": "alpha", "file": "alpha.json.gz", "college": "Alpha College",
                             "catalog_year": "2026-2027", "read_at": "2026-11-20T10:00:00Z"}]}, open(os.path.join(cat, "index.json"), "w"))
    gz(os.path.join(cat, "alpha.json.gz"), {"rows": [{"college": "Alpha College", "subject": "ENGL", "subject_name": "English"}]})
    ROWS = [[0, "CCC1", "ENGL", "1", "Composition"], [0, "CCC2", "MATH", "1", "Algebra"]]
    state(root, "2026-07-09", ROWS)
    json.dump({"map": {"ENGL": "English"}}, open(os.path.join(root, "kb", "reference", "subject_discipline_map.json"), "w"))
    json.dump({"disciplines": {"English": {"canonical_subj4": "ENGL"}}}, open(os.path.join(root, "kb", "discipline_canonical_subj4.json"), "w"))
    lst.ROOT = root
    out = os.path.join(root, lst.OUT)
    d1 = lst.build(root)
    state(root, "2026-11-22", ROWS)
    d2 = lst.build(root)
    check("(3) titles: the fingerprint ignores the state list's _built_at",
          d1["_sources"]["state_list_built_at"] != d2["_sources"]["state_list_built_at"] and lst.fingerprint(d1) == lst.fingerprint(d2))
    state(root, "2026-07-09", ROWS)
    lst.main(["--if-changed"])
    check("(4) titles: the first run writes, with its fingerprint", os.path.exists(out) and json.load(open(out)).get("fingerprint"))
    first = open(out, "rb").read()
    os.utime(out, (1_000_000_000, 1_000_000_000))
    lst.main(["--if-changed"])
    check("(4) titles: a second run on the same inputs writes nothing",
          open(out, "rb").read() == first and os.stat(out).st_mtime == 1_000_000_000)
    state(root, "2026-11-22", ROWS)
    lst.main(["--if-changed"])
    check("(4) titles: a restamped state list with the same rows writes nothing",
          open(out, "rb").read() == first and os.stat(out).st_mtime == 1_000_000_000)
    check("(4) titles: --check reads the restamped tree as current", lst.main(["--check"]) == 0)
    gz(os.path.join(cat, "alpha.json.gz"), {"rows": [{"college": "Alpha College", "subject": "ENGL", "subject_name": "English Language"}]})
    check("(3) titles: a changed printed name changes the fingerprint", lst.fingerprint(lst.build(root)) != lst.fingerprint(d1))
    check("(4) titles: --check reads it as behind", lst.main(["--check"]) == 1)
    lst.main(["--if-changed"])
    rows = json.load(open(out))["colleges"][0]["rows"]
    check("(4) titles: a changed printed name writes", open(out, "rb").read() != first and rows[0][1] == "English Language")
finally:
    lst.ROOT = was_root
    shutil.rmtree(root)

print(("FAILED " + str(len(FAILS))) if FAILS else "all passed")
sys.exit(1 if FAILS else 0)
