#!/usr/bin/env python3
"""The compare gate after a paid read files on a branch (S646): every program whose record on the base
(main) passes and whose record on the branch is absent or fails, with the method the new read gave it.

Read-only. A person reads the list before any load and restores a record from main by name
(`git checkout origin/main -- kb/program_requirements_college/<slug>/records/<cn>.json`) where the
college still offers the program. The read carries a program forward in code only when its own page
answered a bot check (carry_refused in kb/_program_requirements_college.py); a program read as not found or
as having lost its page may be one the college dropped, so this list is the person's to judge.

  python3 kb/_program_requirements_compare.py --college "Glendale Community College" [--base origin/main] [--json]

Output: one line a program, `control_number  was PASS(grade)  now absent|fail  method  title (award)`, then
a count line. Exit 0 always: it is a list to read, not a check.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)


def grade(rec: dict | None) -> int:
    """pass_grade of a filed record's score: 2 passes in full, 1 passes as the live table counts it, 0 fails."""
    import _program_requirements_college as C
    if not isinstance(rec, dict) or not isinstance(rec.get("record"), dict):
        return 0
    return C.pass_grade(rec.get("score"))


def compare(base: dict[str, dict], branch: dict[str, dict], methods: dict[str, str]) -> list[dict]:
    """Each program passing on the base whose branch record is absent or fails, in control-number order."""
    out = []
    for cn in sorted(base):
        was = grade(base[cn])
        if not was:
            continue
        now_rec = branch.get(cn)
        now = grade(now_rec)
        if now_rec is not None and now:
            continue
        out.append({"control_number": cn, "title": base[cn].get("title"), "award": base[cn].get("award"),
                    "was": was, "now": "absent" if now_rec is None else "fail",
                    "method": methods.get(cn) or "not in the new read"})
    return out


def _git(*args: str) -> str:
    return subprocess.run(["git", "-C", REPO, *args], check=True, capture_output=True, text=True).stdout


def base_records(ref: str, rel: str) -> dict[str, dict]:
    out = {}
    for line in _git("ls-tree", "--name-only", "%s:%s" % (ref, rel)).split():
        if line.endswith(".json"):
            out[line[:-5]] = json.loads(_git("show", "%s:%s/%s" % (ref, rel, line)))
    return out


def branch_records(folder: str) -> dict[str, dict]:
    out = {}
    for name in sorted(os.listdir(folder)) if os.path.isdir(folder) else []:
        if name.endswith(".json"):
            with open(os.path.join(folder, name)) as fh:
                out[name[:-5]] = json.load(fh)
    return out


def main(argv=None) -> int:
    import _program_requirements_college as C
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--college", required=True)
    ap.add_argument("--base", default="origin/main", help="the ref whose filed records are compared against")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    rel = "kb/program_requirements_college/%s" % C.slug_of(args.college)
    base = base_records(args.base, rel + "/records")
    branch = branch_records(os.path.join(REPO, rel, "records"))
    methods = {}
    try:
        with open(os.path.join(REPO, rel, "sources.json")) as fh:
            methods = {x["control_number"]: x.get("method") for x in json.load(fh)}
    except (OSError, ValueError):
        pass
    rows = compare(base, branch, methods)
    if args.json:
        print(json.dumps(rows, indent=1))
        return 0
    for r in rows:
        print("%-6s was PASS(%d)  now %-6s  %-16s  %s (%s)" % (r["control_number"], r["was"], r["now"], r["method"],
                                                          r["title"], r["award"]))
    print("%d of %d passing records on %s are absent or fail on this branch" % (
        len(rows), sum(1 for x in base.values() if grade(x)), args.base))
    return 0


if __name__ == "__main__":
    sys.exit(main())
