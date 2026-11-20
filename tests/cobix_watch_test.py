#!/usr/bin/env python3
"""The COBIx watcher (scripts/cobix_watch.sh; Sam, 2026-11-18, relayed by COBIx on #3358) calls only GitHub search.

Guards the failure mode: a cloud session's `gh` may only run `gh api -X GET search/issues`, so a watcher that calls any
other endpoint (a comments list, an issue read, a POST) fails silently every poll and Sam is back to relaying. Also
checks that a restart resumes from the saved state and never prints the same change twice.
Run: python3 tests/cobix_watch_test.py
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "..", "scripts", "cobix_watch.sh")
results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


src = open(SCRIPT).read()
code_lines = [ln for ln in src.splitlines() if ln.strip() and not ln.lstrip().startswith("#")]
gh_lines = [ln for ln in code_lines if re.search(r"(^|[\s;|&(])gh\s", ln)]
check("the script calls gh", len(gh_lines) >= 1, str(gh_lines))
check("every gh call is gh api -X GET search/issues",
      all(re.search(r"(^|[\s;|&(])gh api -X GET search/issues\b", ln) for ln in gh_lines), str(gh_lines))
check("two searches: issues and pull requests", "for t in issue pull-request" in src)
check("the state dir is an argument", 'S="${1:-}"' in src)

tmp = tempfile.mkdtemp(prefix="cobix_watch_")
try:
    bindir = os.path.join(tmp, "bin")
    os.mkdir(bindir)
    log = os.path.join(tmp, "gh_calls.log")
    fake = os.path.join(bindir, "gh")
    with open(fake, "w") as f:
        f.write("#!/usr/bin/env bash\n"
                f"printf '%s\\n' \"$*\" >> '{log}'\n"
                "echo '3358 2026-11-18T21:20:00Z'\n")
    os.chmod(fake, 0o755)
    state = os.path.join(tmp, "state")
    env = dict(os.environ, PATH=bindir + os.pathsep + os.environ.get("PATH", ""), COBIX_WATCH_ONCE="1",
               COBIX_WATCH_SINCE="2026-11-18T21:00:00Z")

    def run():
        return subprocess.run(["bash", SCRIPT, state], env=env, capture_output=True, text=True, timeout=60)

    r1 = run()
    check("first poll exits 0", r1.returncode == 0, r1.stderr)
    check("first poll reports the changed thread", "COBIx-watch: #3358 changed at 2026-11-18T21:20:00Z" in r1.stdout,
          r1.stdout)
    calls = open(log).read().splitlines()
    check("one poll makes exactly two gh calls", len(calls) == 2, str(calls))
    check("every runtime gh call is api -X GET search/issues",
          all(c.startswith("api -X GET search/issues ") for c in calls), str(calls))
    check("the searches name cobi-cto and the since time",
          all("commenter:cobi-cto" in c and "updated:>=2026-11-18T21:00:00Z" in c for c in calls), str(calls))
    check("the searches cover issues and pull requests",
          any("is:issue" in c for c in calls) and any("is:pull-request" in c for c in calls), str(calls))
    since = open(os.path.join(state, "since")).read().strip()
    check("since moves forward after a poll", since != "2026-11-18T21:00:00Z" and re.match(r"\d{4}-\d\d-\d\dT", since),
          since)
    r2 = run()
    check("a restart resumes and does not repeat a seen change", "changed at" not in r2.stdout, r2.stdout)
    seen = open(os.path.join(state, "seen")).read().splitlines()
    check("seen holds the change once", seen == ["3358 2026-11-18T21:20:00Z"], str(seen))
finally:
    shutil.rmtree(tmp, ignore_errors=True)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else f"  ({why})"))
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
