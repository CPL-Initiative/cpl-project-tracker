#!/usr/bin/env python3
"""The dependency map is rebuilt by one job on main, and a PR never fails on a stale map (Sam, 2026-11-18).

Sam's rule, relayed by COBIx on #3358 (rule 2): "No dependency-map rebuild inside PRs. kb/dependency_map.json and
docs/reference/dependency_map.md are rebuilt by one job on main after each merge. They cause most of today's
conflicts."

Failure modes this file guards:

1. THE JOB STOPS RUNNING ON MAIN, or runs twice at once. Pinned: dependency-map.yml runs on a push to main and on
   dispatch, ignores its own files (so its commit cannot start it again), holds its own concurrency group with
   cancel-in-progress false, and stays out of the daily-dashboard group.
2. THE JOB FORCES MAIN (Rule 5) or loses a push. Pinned: no force flag anywhere in it; the push retries in a
   five-attempt loop that rebases onto the new main and rebuilds from it. The commit step itself runs here in a
   scratch repo with stand-in builders: no change commits nothing; a change pushes one commit; a writer that lands
   first is rebased onto and the map is rebuilt from the tree it lands on; a writer that committed the map files
   too is taken as main stands, rebuilt from, and never overwritten by a side.
3. A PR FAILS ON A STALE MAP AGAIN. Pinned: scripts/check_generated.sh reports the map on a line that cannot set its
   failure flag, and its regenerate hint no longer names the map builder; js-tests.yml reports a stale map as a
   notice on a PR and runs no bare `--check` of the map under `bash -e`.

Run from repo root: python3 tests/dependency_map_on_main_test.py
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

import yaml

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WF = os.path.join(REPO, ".github", "workflows")
JOB = os.path.join(WF, "dependency-map.yml")
MAP_FILES = ["kb/dependency_map.json", "docs/reference/dependency_map.md"]

results = []


def check(name, cond, detail=None):
    results.append((name, bool(cond), detail))


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


# ── 1. The trigger and the group ─────────────────────────────────────────────
check("dependency-map.yml exists", os.path.exists(JOB))
doc = yaml.safe_load(read(JOB))
text = read(JOB)
on = doc.get("on", doc.get(True)) or {}
push = on.get("push") or {}
check("runs on a push to main", push.get("branches") == ["main"], push)
check("ignores its own map files, so its commit cannot start it again",
      all(p in (push.get("paths-ignore") or []) for p in MAP_FILES), push.get("paths-ignore"))
check("can be dispatched by hand", "workflow_dispatch" in on)
conc = doc.get("concurrency") or {}
check("holds a concurrency group of its own, runs queue (cancel-in-progress false)",
      conc.get("group") == "dependency-map" and conc.get("cancel-in-progress") is False, conc)
check("stays out of the daily-dashboard group", "daily-dashboard" not in str(conc.get("group")))
jobs = doc.get("jobs") or {}
check("one job, on main only, that may write contents",
      len(jobs) == 1 and all("refs/heads/main" in str(j.get("if", "")) and
                             (j.get("permissions") or {}).get("contents") == "write" for j in jobs.values()))
steps = [s for j in jobs.values() for s in j.get("steps") or []]
runs = "\n".join(str(s.get("run", "")) for s in steps)
check("the job runs the map builder, then the admin surface that projects from it",
      runs.find("python3 kb/_build_dependency_map.py") != -1 and
      runs.find("python3 kb/_build_dependency_map.py") < runs.find("python3 kb/_build_cobi_admin_surface.py"))

# ── 2. No force, and the retry loop ──────────────────────────────────────────
check("never forces main (Rule 5): no --force, -f, or +HEAD in any push",
      not re.search(r"git push[^\n]*(--force|\s-f\b|\s\+HEAD|--mirror)", text))
commit = next((s for s in steps if "git push" in str(s.get("run", ""))), {})
script = str(commit.get("run", ""))
check("pushes HEAD to main in a five-attempt loop", "for i in 1 2 3 4 5; do" in script and
      "git push origin HEAD:main && exit 0" in script)
check("a lost push rebases onto the new main (pull --rebase) and rebuilds there",
      "git pull --rebase origin main" in script and
      script.find("git pull --rebase") < script.rfind("python3 kb/_build_dependency_map.py"))
check("a conflicted rebase is aborted and main taken as it stands, never a side picked",
      "git rebase --abort" in script and "git reset --hard origin/main" in script and
      "--ours" not in script and "--theirs" not in script and "-X" not in script)
check("commits only when the files changed", "git diff --cached --quiet" in script)

STUB_MAP = '''import pathlib
r = pathlib.Path(__file__).resolve().parents[1]
src = "".join(p.read_text() for p in sorted((r / "src").glob("*.txt")))
(r / "kb" / "dependency_map.json").write_text("map of " + src)
(r / "docs" / "reference" / "dependency_map.md").write_text("md of " + src)
'''
STUB_ADMIN = '''import pathlib
r = pathlib.Path(__file__).resolve().parents[1]
(r / "cobi_admin_surface.js").write_text("admin of " + (r / "kb" / "dependency_map.json").read_text())
'''


def git(cwd, *args, check_rc=True):
    out = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)
    if check_rc and out.returncode != 0:
        raise RuntimeError("git %s: %s" % (" ".join(args), out.stderr))
    return out.stdout.strip()


def ident(cwd):
    git(cwd, "config", "user.name", "t")
    git(cwd, "config", "user.email", "t@example.invalid")


def scratch():
    d = tempfile.mkdtemp(prefix="depmap_job_")
    remote = os.path.join(d, "remote.git")
    git(d, "init", "-q", "--bare", "-b", "main", remote)
    seed = os.path.join(d, "seed")
    git(d, "clone", "-q", remote, seed)
    ident(seed)
    for rel, body in (("kb/_build_dependency_map.py", STUB_MAP), ("kb/_build_cobi_admin_surface.py", STUB_ADMIN),
                      ("src/a.txt", "a1\n")):
        os.makedirs(os.path.dirname(os.path.join(seed, rel)), exist_ok=True)
        with open(os.path.join(seed, rel), "w") as f:
            f.write(body)
    os.makedirs(os.path.join(seed, "docs", "reference"), exist_ok=True)
    subprocess.run([sys.executable, "kb/_build_dependency_map.py"], cwd=seed, check=True)
    subprocess.run([sys.executable, "kb/_build_cobi_admin_surface.py"], cwd=seed, check=True)
    git(seed, "add", "-A")
    git(seed, "commit", "-qm", "seed")
    git(seed, "push", "-q", "origin", "HEAD:main")
    runner = os.path.join(d, "runner")
    git(d, "clone", "-q", remote, runner)
    other = os.path.join(d, "other")
    git(d, "clone", "-q", remote, other)
    ident(other)
    return d, remote, runner, other


def land(clone, rel, body, msg):
    git(clone, "pull", "-q", "--rebase", "origin", "main")
    with open(os.path.join(clone, rel), "w") as f:
        f.write(body)
    git(clone, "add", "-A")
    git(clone, "commit", "-qm", msg)
    git(clone, "push", "-q", "origin", "HEAD:main")


def run_step(runner):
    body = script.replace("${{ github.run_id }}", "1")
    sh = "sleep() { :; }\npython3() { %s \"$@\"; }\n%s" % (sys.executable, body)
    subprocess.run([sys.executable, "kb/_build_dependency_map.py"], cwd=runner, check=True)
    subprocess.run([sys.executable, "kb/_build_cobi_admin_surface.py"], cwd=runner, check=True)
    return subprocess.run(["bash", "-c", sh], cwd=runner, capture_output=True, text=True)


def main_file(remote, rel):
    return subprocess.run(["git", "--git-dir", remote, "show", "main:" + rel], capture_output=True,
                          text=True).stdout


def count(remote):
    return int(git(remote, "rev-list", "--count", "main"))


if shutil.which("git") and script:
    # (a) the tree already matches the map: no commit, green
    d, remote, runner, _ = scratch()
    before = count(remote)
    r = run_step(runner)
    check("job (a): a current map commits nothing and ends green", r.returncode == 0 and count(remote) == before,
          r.stdout[-300:] + r.stderr[-300:])
    shutil.rmtree(d)

    # (b) a merge moved the tree: one commit with the three files
    d, remote, runner, other = scratch()
    land(other, "src/a.txt", "a2\n", "a merge")
    git(runner, "pull", "-q", "origin", "main")
    before = count(remote)
    r = run_step(runner)
    check("job (b): a moved tree pushes one commit with the rebuilt map and admin surface",
          r.returncode == 0 and count(remote) == before + 1 and main_file(remote, MAP_FILES[0]) == "map of a2\n"
          and main_file(remote, "cobi_admin_surface.js") == "admin of map of a2\n", r.stdout[-300:] + r.stderr[-300:])
    shutil.rmtree(d)

    # (c) another merge lands between the build and the push: rebase, rebuild from the new tree, push
    d, remote, runner, other = scratch()
    land(other, "src/a.txt", "a2\n", "first merge")
    git(runner, "pull", "-q", "origin", "main")
    subprocess.run([sys.executable, "kb/_build_dependency_map.py"], cwd=runner, check=True)
    land(other, "src/b.txt", "b1\n", "second merge, before the push")
    r = run_step(runner)
    check("job (c): a writer who lands first is rebased onto, and the map matches the tree it lands on",
          r.returncode == 0 and main_file(remote, MAP_FILES[0]) == "map of a2\nb1\n"
          and main_file(remote, "src/b.txt") == "b1\n", r.stdout[-400:] + r.stderr[-400:])
    shutil.rmtree(d)

    # (d) another writer committed the map files too (a conflict): take main, rebuild from it, no side picked
    d, remote, runner, other = scratch()
    land(other, "src/a.txt", "a2\n", "a merge")
    git(runner, "pull", "-q", "origin", "main")
    git(other, "pull", "-q", "--rebase", "origin", "main")
    with open(os.path.join(other, "src", "c.txt"), "w") as f:
        f.write("c1\n")
    with open(os.path.join(other, MAP_FILES[0]), "w") as f:
        f.write("a hand-edited map\n")
    git(other, "add", "-A")
    git(other, "commit", "-qm", "a PR that still committed the map")
    git(other, "push", "-q", "origin", "HEAD:main")
    r = run_step(runner)
    check("job (d): a conflicting map commit is rebuilt over from main's tree, never kept or forced",
          r.returncode == 0 and main_file(remote, MAP_FILES[0]) == "map of a2\nc1\n"
          and main_file(remote, "src/c.txt") == "c1\n", r.stdout[-400:] + r.stderr[-400:])
    shutil.rmtree(d)
else:
    check("git is on PATH and the commit step was found", False)

# ── 3. A PR never fails on a stale map ───────────────────────────────────────
gen = read(os.path.join(REPO, "scripts", "check_generated.sh"))
map_lines = [ln for ln in gen.splitlines() if "_build_dependency_map.py --check" in ln and not ln.lstrip().startswith("#")]
check("check_generated.sh checks the map on a report line only", map_lines and
      all(ln.lstrip().startswith("report ") for ln in map_lines), map_lines)
m = re.search(r"^report\(\) \{\n(.*?)^\}", gen, re.M | re.S)
check("its report() never sets the failure flag", m and "fail=" not in m.group(1))
hint = gen[gen.find("Regenerate, re-run this"):]
check("the regenerate hint no longer names the map builder", "_build_dependency_map.py" not in hint)

# Exercise report() itself: a failing command prints the notice, leaves fail at 0.
probe = "fail=0\n%s\nreport x false 'NOTICE'\nreport y true 'NOTICE'\necho \"fail=$fail\"" % m.group(0) if m else ""
out = subprocess.run(["bash", "-c", probe], capture_output=True, text=True).stdout if m else ""
check("report() on a failing check prints the notice and leaves fail at 0",
      "NOTICE" in out and out.strip().endswith("fail=0") and out.count("NOTICE") == 1, out)

js = yaml.safe_load(read(os.path.join(WF, "js-tests.yml")))
js_steps = [s for j in (js.get("jobs") or {}).values() for s in j.get("steps") or []]
bare = [s.get("name") for s in js_steps for ln in str(s.get("run", "")).splitlines()
        if ln.strip() == "python3 kb/_build_dependency_map.py --check"]
check("js-tests.yml runs no bare map --check under bash -e", not bare, bare)
step = next((s for s in js_steps if "dependency_map_on_main_test.py" in str(s.get("run", ""))), {})
body = str(step.get("run", ""))
check("js-tests.yml reports a stale map as a notice on a PR, a warning elsewhere",
      "::notice" in body and "::warning" in body and 'github.event_name }}" = "pull_request"' in body)
check("js-tests.yml rebuilds the map in the runner, runs its readers, and restores the committed files",
      "python3 tests/dependency_map_test.py" in body and "grep -l 'dependency_map\\.json'" in body and
      "git checkout -- kb/dependency_map.json docs/reference/dependency_map.md" in body)

failed = [r for r in results if not r[1]]
for name, ok, detail in results:
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok or detail is None else "  -> %s" % (detail,)))
print("dependency_map_on_main_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
