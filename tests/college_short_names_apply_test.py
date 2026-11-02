#!/usr/bin/env python3
"""kb/_apply_college_short_names.py, the daily fold of public.college_short_names into the committed files (S545).

A name a join keys on is a key (S544): the funding roster and other builders reach a college by its prior short, so the
fold must never publish a set that drops a spelling, and must refuse a set where two colleges answer to one spelling.
Guards:
  (1) the table equal to the committed file writes nothing (no date-only churn in the daily commit);
  (2) a changed short lands in both files, the old short an alias, and the resolver reaches the college by either;
  (3) a committed spelling the table no longer carries is carried forward as an alias, and said;
  (4) refusals leave both files as they are: two colleges answering to one spelling, a committed college missing from
      the table, an empty short;
  (5) --check reports a change without writing;
  (6) the seed script refuses to overwrite the table's edits without --force-reseed;
  (7) the daily run folds the table before the builders and commits both files; no SUPABASE_SERVICE_KEY skips quietly.
Run: python3 tests/college_short_names_apply_test.py
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPLY = os.path.join(ROOT, "kb", "_apply_college_short_names.py")
SEED = os.path.join(ROOT, "kb", "_seed_college_short_names.py")
results = []


def check(name, ok, why=""):
    results.append((name, bool(ok), why))


def run(*args, env=None):
    e = dict(os.environ)
    e.pop("SUPABASE_SERVICE_KEY", None)
    e.update(env or {})
    p = subprocess.run([sys.executable, APPLY] + list(args), cwd=ROOT, capture_output=True, text=True, env=e)
    return p.returncode, p.stdout + p.stderr


def resolve(js_path, *names):
    code = ("global.window={}; require(%s); const w=global.window; console.log(JSON.stringify(%s.map(n => w.cplCollegeShort(n))));"
            % (json.dumps(js_path), json.dumps(list(names))))
    return json.loads(subprocess.run(["node", "-e", code], capture_output=True, text=True, check=True).stdout)


committed = json.load(open(os.path.join(ROOT, "kb", "college_short_names.json"), encoding="utf-8"))
tmp = tempfile.mkdtemp()


def fresh():
    j, s = os.path.join(tmp, "names.json"), os.path.join(tmp, "names.js")
    shutil.copy(os.path.join(ROOT, "kb", "college_short_names.json"), j)
    shutil.copy(os.path.join(ROOT, "college_short_names.js"), s)
    return j, s


def rows_file(rows):
    p = os.path.join(tmp, "rows.json")
    json.dump(rows, open(p, "w", encoding="utf-8"), ensure_ascii=False)
    return p


def table():
    return json.loads(json.dumps(committed["colleges"]))


def edit(rows, canonical, **kw):
    for r in rows:
        if r["canonical"] == canonical:
            r.update(kw)
    return rows


# (1)
j, s = fresh()
before = (open(j).read(), open(s).read())
code, out = run("--rows", rows_file(table()), "--json-out", j, "--js-out", s)
check("(1) ⭐ the table equal to the committed file writes nothing", code == 0 and "nothing changed" in out
      and (open(j).read(), open(s).read()) == before, out)

# (2)
j, s = fresh()
rows = edit(table(), "Butte College", short="Butte Glenn", short_caps="BUTTE GLENN", aliases=["Butte College", "Butte"])
code, out = run("--rows", rows_file(rows), "--json-out", j, "--js-out", s)
doc = json.load(open(j, encoding="utf-8"))
butte = [r for r in doc["colleges"] if r["canonical"] == "Butte College"][0]
check("(2) ⭐ a changed short lands in the JSON, the old short an alias", code == 0 and butte["short"] == "Butte Glenn"
      and "Butte" in butte["aliases"] and doc["_meta"]["count"] == len(committed["colleges"]), json.dumps(butte))
check("(2) the resolver reaches the college by the new short, the old one and the canonical",
      resolve(s, "Butte", "Butte Glenn", "Butte College") == ["Butte Glenn"] * 3, out)
check("(2) the JSON names the table as its source", doc["_meta"]["source"].startswith("public.college_short_names"))

# (3)
j, s = fresh()
# "San Francisco" folds to a key the canonical's does not ("city san francisco"), so only the alias reaches it.
rows = edit(table(), "City College Of San Francisco", aliases=["City College Of San Francisco"])
code, out = run("--rows", rows_file(rows), "--json-out", j, "--js-out", s)
sf = [r for r in json.load(open(j, encoding="utf-8"))["colleges"] if r["canonical"] == "City College Of San Francisco"][0]
check("(3) ⭐ a spelling the committed file reached a college by is carried forward, and said", code == 0
      and "San Francisco" in sf["aliases"] and 'City College Of San Francisco still answers to "San Francisco"' in out
      and resolve(s, "San Francisco") == ["City College San Francisco"], out)

# (4)
for label, rows, want in [
    ("two colleges answering to one spelling", edit(table(), "Butte College", short="Desert", short_caps="DESERT"), "two colleges answer to one spelling"),
    ("a committed college missing from the table", [r for r in table() if r["canonical"] != "Yuba College"], "missing from the table"),
    ("an empty short", edit(table(), "Yuba College", short="  "), "has an empty short name"),
]:
    j, s = fresh()
    before = (open(j).read(), open(s).read())
    code, out = run("--rows", rows_file(rows), "--json-out", j, "--js-out", s)
    check("(4) ⭐ refused, files kept: " + label, code == 3 and want in out and "::warning title=College short names refused::" in out
          and (open(j).read(), open(s).read()) == before, out)

# (5)
j, s = fresh()
before = open(j).read()
code, out = run("--rows", rows_file(edit(table(), "Butte College", short="Butte Glenn")), "--json-out", j, "--js-out", s, "--check")
check("(5) --check reports a change and writes nothing", code == 1 and open(j).read() == before, out)

# (6)
p = subprocess.run([sys.executable, SEED], cwd=ROOT, capture_output=True, text=True)
check("(6) ⭐ the seed script refuses without --force-reseed", p.returncode == 2 and "College Identity tab" in p.stdout, p.stdout)

# (7)
code, out = run()
check("(7) no SUPABASE_SERVICE_KEY skips and keeps the files", code == 0 and "not read" in out, out)
wf = open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8").read()
sync, pipe = wf.find("name: Sync curation overlay from Supabase"), wf.find("name: Run dashboard pipeline")
at = wf.find("python kb/_apply_college_short_names.py")
commit = wf[wf.find("name: Commit and push to main"):]
check("(7) ⭐ the daily run folds the table in the curation sync, before the builders", sync < at < pipe, (sync, at, pipe))
check("(7) the daily commit carries both files", "kb/college_short_names.json" in commit and "college_short_names.js" in commit)

shutil.rmtree(tmp, ignore_errors=True)
passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not why else "\n     " + str(why)[:400]))
print(f"\n{passed}/{len(results)} passed")
sys.exit(0 if passed == len(results) else 1)
