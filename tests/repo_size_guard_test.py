#!/usr/bin/env python3
"""The repo size guard (scripts/repo_size_guard.py, issue #3476) on a temporary git repo it builds itself.

Guards the failure mode: a file, a list entry or a week's growth that would let the repo bloat again passes.
Run: python3 tests/repo_size_guard_test.py
"""
import importlib.util
import os
import shutil
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("repo_size_guard", os.path.join(HERE, "..", "scripts", "repo_size_guard.py"))
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)
MB = guard.MB
results = []
ROOT = tempfile.mkdtemp(prefix="size_guard_")


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def run(repo, *args, env=None):
    e = dict(os.environ, GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@t", GIT_COMMITTER_NAME="t", GIT_COMMITTER_EMAIL="t@t")
    e.pop("GITHUB_ACTIONS", None)
    e.update(env or {})
    return subprocess.run(["git", *args], cwd=repo, env=e, check=True, capture_output=True).stdout.decode()


def write(repo, path, data):
    full = os.path.join(repo, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "wb") as f:
        f.write(data if isinstance(data, bytes) else data.encode())


def new_repo(exceptions=None):
    """A repo whose main holds a small file and, if given, the exceptions list; HEAD is a branch off it."""
    repo = tempfile.mkdtemp(dir=ROOT)
    run(repo, "init", "-q", "-b", "main")
    write(repo, "README.md", "hello\n")
    if exceptions is not None:
        write(repo, guard.EXCEPTIONS, exceptions)
    run(repo, "add", "-A")
    run(repo, "commit", "-qm", "base")
    run(repo, "checkout", "-qb", "pr")
    return repo


def commit(repo, msg="change"):
    run(repo, "add", "-A")
    run(repo, "commit", "-qm", msg)


def pr(repo):
    cwd = os.getcwd()
    os.chdir(repo)
    try:
        return guard.check_pr("main")
    finally:
        os.chdir(cwd)


SIX = os.urandom(6 * MB)

# 1. A 6 MB file fails.
r = new_repo("")
write(r, "data/big.bin", SIX)
commit(r)
f, w, n = pr(r)
check("a 6 MB file that is not on the list fails", any("data/big.bin" in x and "file limit" in x for x in f), f)

# 2. The same file on the list passes; a listed file may change but not past 1.5 times its size.
r = new_repo("%d data/big.bin\n" % len(SIX))
write(r, "data/big.bin", os.urandom(6 * MB))
commit(r)
write(r, "data/big.bin", b"\0" * (6 * MB))  # zeros, so only the per-file rule can fire
commit(r)
f, w, n = pr(r)
check("the same 6 MB file on the list passes", not f, f)
write(r, "data/big.bin", b"\0" * (10 * MB))
commit(r)
f, w, n = pr(r)
check("a listed file grown past 1.5 times its listed size fails", any("1.5 times" in x for x in f), f)

# 3. A pull request that adds a list entry, or raises one, fails; removing one passes.
r = new_repo("%d data/big.bin\n" % len(SIX))
write(r, guard.EXCEPTIONS, "%d data/big.bin\n%d data/other.bin\n" % (len(SIX), len(SIX)))
commit(r)
f, w, n = pr(r)
check("a pull request that adds a list entry fails", any("gains an entry" in x for x in f), f)
r = new_repo("%d data/big.bin\n" % len(SIX))
write(r, guard.EXCEPTIONS, "%d data/big.bin\n" % (len(SIX) + 1))
commit(r)
f, w, n = pr(r)
check("a pull request that raises a listed size fails", any("raises" in x for x in f), f)
r = new_repo("%d data/big.bin\n%d data/gone.bin\n" % (len(SIX), len(SIX)))
write(r, guard.EXCEPTIONS, "%d data/big.bin\n" % len(SIX))
commit(r)
f, w, n = pr(r)
check("a pull request that removes a list entry passes", not f, f)

# 4. 26 MB of incompressible bytes fails the compressed cap; 26 MB of zeros passes it.
r = new_repo("%d data/noise.bin\n%d data/zeros.bin\n" % (30 * MB, 30 * MB))
write(r, "data/noise.bin", os.urandom(26 * MB))
commit(r)
f, w, n = pr(r)
check("26 MB of incompressible bytes fails the compressed cap", any("compressed, over" in x for x in f), f)
r = new_repo("%d data/noise.bin\n%d data/zeros.bin\n" % (30 * MB, 30 * MB))
write(r, "data/zeros.bin", b"\0" * (26 * MB))
commit(r)
f, w, n = pr(r)
check("26 MB of zeros passes the compressed cap", not f, f)

# 5. The total cap fires with the constant lowered, and not at its real value.
r = new_repo("")
write(r, "data/a.bin", b"\0" * (3 * MB))
commit(r)
f, w, n = pr(r)
check("a 3 MB tree passes the real total cap", not f, f)
saved = guard.TOTAL_CAP_MB
guard.TOTAL_CAP_MB = 2
try:
    f, w, n = pr(r)
finally:
    guard.TOTAL_CAP_MB = saved
check("the total cap fires with the constant lowered", any("on disk, over the 2 MB limit" in x for x in f), f)

# 6. The word warnings never fail the run.
r = new_repo("")
write(r, "START_HERE.md", "word " * 700)
write(r, "CLAUDE.md", "word " * 2100)
commit(r)
f, w, n = pr(r)
check("START_HERE.md and CLAUDE.md over budget warn and do not fail",
      not f and len(w) == 2 and any("START_HERE.md" in x for x in w) and any("CLAUDE.md" in x for x in w), (f, w))
cwd = os.getcwd()
os.chdir(r)
try:
    code = guard.main(["--base", "main"])
finally:
    os.chdir(cwd)
check("the run exits 0 when only word warnings fire", code == 0, code)

# 7. A deleted file and a sparse checkout change nothing: sizes come from git objects.
r = new_repo("")
write(r, "data/a.bin", b"\0" * (6 * MB))
write(r, "keep.txt", "x")
run(r, "add", "-A")
run(r, "commit", "-qm", "seed")
run(r, "checkout", "-q", "main")
run(r, "merge", "-q", "--ff-only", "pr")
run(r, "checkout", "-qb", "pr2")
run(r, "rm", "-q", "data/a.bin")
commit(r)
f, w, n = pr(r)
check("deleting a big file passes", not f, f)
run(r, "sparse-checkout", "set", "--no-cone", "/keep.txt")
f2, w2, n2 = pr(r)
check("a sparse checkout gives the same answer", f == f2 and n == n2, (n, n2))

# 8. Weekly: growth past 50 MB in 7 days fails and names the path; older growth does not count.
r = tempfile.mkdtemp(dir=ROOT)
run(r, "init", "-q", "-b", "main")
old = "@%d +0000" % (int(time.time()) - 30 * 86400)
write(r, "old/history.bin", os.urandom(60 * MB))
run(r, "add", "-A")
run(r, "commit", "-qm", "old", env={"GIT_AUTHOR_DATE": old, "GIT_COMMITTER_DATE": old})
write(r, "small.txt", "x")
commit(r, "this week, small")
cwd = os.getcwd()
os.chdir(r)
try:
    f, n = guard.check_weekly()
    check("a quiet week passes, though older history is large", not f, (f, n))
    write(r, "new/week.bin", os.urandom(55 * MB))
    commit(r, "this week, large")
    f, n = guard.check_weekly()
finally:
    os.chdir(cwd)
check("a week that adds 55 MB fails", any("weekly limit" in x for x in f), f)
check("the weekly report names the path that grew most", any("new/week.bin" in x for x in n), n)

shutil.rmtree(ROOT, ignore_errors=True)
failed = [x for x in results if not x[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  -- %s" % (why,))[:400])
print("%d/%d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
