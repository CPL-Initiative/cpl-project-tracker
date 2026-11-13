#!/usr/bin/env python3
"""The compare gate after a paid read files on a branch (S646): every program whose record on the base
(main) passes and whose record on the head passes less, fails or is absent, with the method the new read
gave it.

Read-only. A person reads the list before any load and restores a record from main by name
(`git checkout origin/main -- kb/program_requirements_college/<slug>/records/<cn>.json`) where the
college still offers the program. The read carries a program forward in code only when its own page
answered a bot check (carry_refused in kb/_program_requirements_college.py); a program read as not found or
as having lost its page may be one the college dropped, so this list is the person's to judge.

  python3 kb/_program_requirements_compare.py --college "Glendale Community College" \
      [--base origin/main] [--head HEAD] [--json]

Both sides are read from commits (`git show <ref>:<path>`), never the working tree, so the tool gives the
same answer from any checkout (S647 review). Fetch both refs first: a stale origin/main compares against an
old main.

Output: a first line naming both refs and the shas they resolve to (on stderr with --json, whose stdout is
{base, head, rows}); then one line a program,
`control_number  was PASS(grade)  now absent|error|fail|PASS(grade)  method  title (award)`, error being a
file a failed extraction call left; then a count line.
Exit 0 when it has a list to read (even an empty one); 2 when the two refs are one commit or the head holds no
record file for the college, since then there is nothing to compare.
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


def stub(rec: dict | None) -> bool:
    """A file a failed extraction call left (an error, no record): no read, which the list names as one."""
    return isinstance(rec, dict) and (bool(rec.get("error")) or not isinstance(rec.get("record"), dict))


def compare(base: dict[str, dict], branch: dict[str, dict], methods: dict[str, str]) -> list[dict]:
    """Each program passing on the base whose head record is absent or passes less (a fall from PASS(2)
    to PASS(1) included), in control-number order."""
    out = []
    for cn in sorted(base):
        was = grade(base[cn])
        if not was:
            continue
        now_rec = branch.get(cn)
        now = grade(now_rec)
        if now_rec is not None and now >= was:
            continue
        out.append({"control_number": cn, "title": base[cn].get("title"), "award": base[cn].get("award"),
                    "was": was, "now": "absent" if now_rec is None else ("PASS(%d)" % now if now else
                                                                          "error" if stub(now_rec) else "fail"),
                    "method": methods.get(cn) or "not in the new read"})
    return out


def _git(*args: str, repo: str = REPO) -> str:
    return subprocess.run(["git", "-C", repo, *args], check=True, capture_output=True, text=True).stdout


def resolve(ref: str, repo: str = REPO) -> str:
    """The commit a ref names."""
    return _git("rev-parse", "--verify", ref + "^{commit}", repo=repo).strip()


def records_at(ref: str, rel: str, repo: str = REPO) -> dict[str, dict]:
    """{control number: filed record} in the folder rel at the commit ref names; {} where it has none."""
    try:
        names = _git("ls-tree", "--name-only", "%s:%s" % (ref, rel), repo=repo).split()
    except subprocess.CalledProcessError:
        return {}
    return {n[:-5]: json.loads(_git("show", "%s:%s/%s" % (ref, rel, n), repo=repo))
            for n in names if n.endswith(".json")}


def base_records(ref: str, rel: str, repo: str = REPO) -> dict[str, dict]:
    return records_at(ref, rel, repo)


def branch_records(ref: str, rel: str, repo: str = REPO) -> dict[str, dict]:
    return records_at(ref, rel, repo)


def methods_at(ref: str, rel: str, repo: str = REPO) -> dict[str, str]:
    """{control number: method} from the college's sources.json at the ref; {} where it has none."""
    try:
        return {x["control_number"]: x.get("method") for x in json.loads(_git("show", "%s:%s/sources.json" % (ref, rel),
                                                                               repo=repo))}
    except (subprocess.CalledProcessError, ValueError, KeyError, TypeError):
        return {}


def main(argv=None, repo: str = REPO) -> int:
    import _program_requirements_college as C
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--college", required=True)
    ap.add_argument("--base", default="origin/main", help="the ref whose filed records are compared against")
    ap.add_argument("--head", default="HEAD", help="the ref holding the new read's records")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    rel = "kb/program_requirements_college/%s" % C.slug_of(args.college)
    base_sha, head_sha = resolve(args.base, repo), resolve(args.head, repo)
    # The first line names both commits (with --json, on stderr, so stdout stays one JSON value).
    print("base %s = %s  head %s = %s" % (args.base, base_sha, args.head, head_sha),
          file=sys.stderr if args.json else sys.stdout)
    if base_sha == head_sha:
        print("the two refs are one commit: nothing to compare (fetch the branch, or name it with --head)")
        return 2
    base = base_records(base_sha, rel + "/records", repo)
    branch = branch_records(head_sha, rel + "/records", repo)
    if not branch:
        print("the head holds no record file for %s under %s/records" % (args.college, rel))
        return 2
    rows = compare(base, branch, methods_at(head_sha, rel, repo))
    if args.json:
        print(json.dumps({"base": base_sha, "head": head_sha, "rows": rows}, indent=1))
        return 0
    for r in rows:
        print("%-6s was PASS(%d)  now %-7s  %-16s  %s (%s)" % (r["control_number"], r["was"], r["now"], r["method"],
                                                          r["title"], r["award"]))
    print("%d of %d passing records on %s pass less, fail or are absent on %s" % (
        len(rows), sum(1 for x in base.values() if grade(x)), args.base, args.head))
    return 0


if __name__ == "__main__":
    sys.exit(main())
