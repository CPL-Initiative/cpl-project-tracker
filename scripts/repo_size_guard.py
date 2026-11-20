#!/usr/bin/env python3
"""Repo size guard: the repo may not grow past a limit again (issue #3476, Part 4 step 2).

Sam, 2026-11-17, relayed by COBIx: "Let's move the bloated data out first thing and make sure we don't allow
to go beyond a limit." main's latest version was a 2.0 GB download and 4.85 GB on disk, growing 300 to 500 MB
a week.

Pull request mode (the default) fails when:
  1. an added or changed file is over FILE_CAP_MB, unless .github/repo_size_exceptions.txt lists it; a listed
     file may change but may not grow past GROWTH_FACTOR times its listed size;
  2. the exceptions list gains a path or raises a size (the list can only shrink);
  3. the latest version's total size passes TOTAL_CAP_MB;
  4. the pull request adds more than PR_GROWTH_CAP_MB compressed.
It warns, and never fails, when START_HERE.md passes 600 words or CLAUDE.md passes 2,000.

Weekly mode (--weekly) fails when main grew more than WEEKLY_CAP_MB compressed in the last 7 days, and names
the paths that grew most; and when main holds a file over FILE_CAP_MB the exceptions list does not name, or a
listed file past GROWTH_FACTOR times its listed size (the cron's direct pushes skip the pull request checks).
A red weekly run opens an issue through workflow-failure-watch.yml.

Every size comes from git objects (ls-tree, cat-file, diff-tree), never from the working tree, so a sparse
checkout gives the same answer as a full one. CI's sparse checkout is a blob:none partial clone, where each size
read of a blob not yet here fetches that one blob on its own round trip; over the whole tree that held a runner about
6 hours per pull request (COBIx, 2026-11-19). So the guard first lists the blobs it will read that are missing,
without fetching (rev-list --missing=print), and fetches them all in ONE fetch (prefetch_missing); a full clone
has none missing and fetches nothing. A megabyte here is 1,048,576 bytes, the unit COBIx measured in.

"Compressed", in pull request mode, is the zlib (level 6) size of each new blob version the pull request adds,
added or changed, with no credit for a delta against the old version: the most git stores for those objects,
and the same number on every machine whatever its packs hold. In weekly mode it is each new object's size in
the fetched pack (%(objectsize:disk)), deltas included: what main's history really grew by.

The comparison point: --base REF (origin/main locally, the pull request's base sha in CI). The guard compares
HEAD with `git merge-base REF HEAD`. In a shallow clone that finds no merge base (CI checks out the pull
request's merge commit at depth 1 and fetches the base at depth 1), it compares HEAD's tree with REF's tree
directly: for the merge commit, whose first parent is the base, that is exactly the pull request's change.

Run: python3 scripts/repo_size_guard.py --base origin/main
     python3 scripts/repo_size_guard.py --weekly
     python3 scripts/repo_size_guard.py --list-over-limit   (prints exceptions-list lines for HEAD)
Stdlib only. Tests: tests/repo_size_guard_test.py.
"""
import argparse
import os
import subprocess
import sys
import threading
import time
import zlib

MB = 1024 * 1024
FILE_CAP_MB = 5
# The tree is about 1,615 MB after #3476 Part 4 steps 1, 4 and 5 (#3498). The plan's 1,500 MB target follows once
# the spreadsheet export and the videos move out, and the PR that moves them lowers this again; 1,000 after Phase 3.
TOTAL_CAP_MB = 2000
PR_GROWTH_CAP_MB = 25
WEEKLY_CAP_MB = 50
GROWTH_FACTOR = 1.5
EXCEPTIONS = ".github/repo_size_exceptions.txt"
WORD_LIMITS = (("START_HERE.md", 600), ("CLAUDE.md", 2000))
TOP_PATHS = 15
HEAD = "HEAD"  # the change measured in pull request mode; --head REV measures another branch without a checkout


def git(args, cwd=None, input_bytes=None, check=True):
    p = subprocess.run(["git", *args], cwd=cwd, input=input_bytes, capture_output=True)
    if check and p.returncode != 0:
        raise RuntimeError("git %s failed: %s" % (" ".join(args), p.stderr.decode(errors="replace").strip()))
    return p


def mb(n):
    return "%.1f MB" % (n / MB)


def blob_sizes(shas, cwd, fmt="%(objectname) %(objectsize)"):
    """{sha: size} for the given object ids, in one cat-file call."""
    shas = sorted(set(shas))
    if not shas:
        return {}
    out = git(["cat-file", "--batch-check=" + fmt], cwd=cwd, input_bytes="\n".join(shas).encode() + b"\n").stdout
    sizes = {}
    for line in out.decode().splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[1] != "missing":
            sizes[parts[0]] = parts[1:]
    return sizes


def blob_contents(shas, cwd):
    """Yield each distinct blob's bytes, one at a time, through one `cat-file --batch`."""
    shas = sorted(set(shas))
    if not shas:
        return
    p = subprocess.Popen(["git", "cat-file", "--batch"], cwd=cwd, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    def feed():  # a thread, so a long id list never fills stdin while git waits on a full stdout
        p.stdin.write("\n".join(shas).encode() + b"\n")
        p.stdin.close()
    threading.Thread(target=feed, daemon=True).start()
    for _ in shas:
        header = p.stdout.readline().split()
        if len(header) < 3:
            continue
        data = p.stdout.read(int(header[2]))
        p.stdout.read(1)
        yield data
    p.wait()


def read_blob(rev_path, cwd):
    p = git(["cat-file", "blob", rev_path], cwd=cwd, check=False)
    return p.stdout.decode("utf-8", errors="replace") if p.returncode == 0 else None


def promisor_remote(cwd=None):
    """The remote a partial clone fetches missing objects from, or None in a full clone."""
    out = git(["config", "--get-regexp", r"^remote\..*\.promisor$"], cwd=cwd, check=False).stdout.decode()
    for line in out.splitlines():
        key, _, val = line.partition(" ")
        if val.strip().lower() in ("true", "1", "yes", "on"):
            return key[len("remote."):-len(".promisor")]
    return None


def missing_blobs(revs, cwd=None, walk=False):
    """Object ids the given revisions' trees name that are not here, listed without fetching any of them."""
    args = ["rev-list", "--objects", "--missing=print"] + ([] if walk else ["--no-walk"]) + list(revs)
    out = git(args, cwd=cwd).stdout.decode("utf-8", errors="replace")
    return {line[1:].split()[0] for line in out.splitlines() if line.startswith("?")}


def prefetch_missing(trees=(), ranges=(), paths=(), cwd=None):
    """In a partial clone, fetch every blob the guard is about to read in ONE fetch, so no size read falls back
    to git's lazy fetch, one blob per round trip. trees: revisions whose whole tree is read (ls-tree -l);
    ranges: rev-list ranges whose new objects are read (weekly); paths: single 'REV:PATH' blobs. Returns how
    many objects it fetched (0 in a full clone)."""
    remote = promisor_remote(cwd)
    if not remote:
        return 0
    want = set()
    if trees:
        want |= missing_blobs(trees, cwd)
    for rng in ranges:
        want |= missing_blobs([rng], cwd, walk=True)
    for spec in paths:
        rev, _, path = spec.partition(":")
        p = git(["rev-parse", "--verify", "-q", spec], cwd=cwd, check=False)
        oid = p.stdout.decode().strip()
        if p.returncode == 0 and oid and oid in missing_blobs([rev], cwd):
            want.add(oid)
    if not want:
        return 0
    git(["-c", "fetch.negotiationAlgorithm=noop", "fetch", "--no-tags", "--no-write-fetch-head",
         "--recurse-submodules=no", "--filter=blob:none", "--stdin", remote],
        cwd=cwd, input_bytes="\n".join(sorted(want)).encode() + b"\n")
    return len(want)


def parse_exceptions(text):
    """{path: bytes} from 'BYTES PATH' lines; '#' starts a comment."""
    entries = {}
    for raw in (text or "").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        size, _, path = line.partition(" ")
        entries[path.strip()] = int(size)
    return entries


def tree_total(rev, cwd):
    total = 0
    out = git(["ls-tree", "-r", "-l", "-z", rev], cwd=cwd).stdout
    for rec in out.split(b"\0"):
        if not rec:
            continue
        meta = rec.split(b"\t", 1)[0].split()
        if len(meta) == 4 and meta[1] == b"blob" and meta[3] != b"-":
            total += int(meta[3])
    return total


def comparison_point(base, cwd):
    p = git(["merge-base", base, HEAD], cwd=cwd, check=False)
    if p.returncode == 0 and p.stdout.strip():
        return p.stdout.decode().strip(), "merge base"
    return git(["rev-parse", base + "^{commit}"], cwd=cwd).stdout.decode().strip(), "base tree (no merge base in this shallow clone)"


def changed_blobs(old, cwd):
    """[(path, new_sha)] for every file added or changed from old to HEAD; deletions skipped, renames split."""
    out = git(["diff-tree", "-r", "-z", "--no-renames", "--raw", old, HEAD], cwd=cwd).stdout.split(b"\0")
    rows, i = [], 0
    while i < len(out) - 1:
        meta, path = out[i].decode(), out[i + 1].decode("utf-8", errors="replace")
        i += 2
        parts = meta.lstrip(":").split()
        if len(parts) < 5:
            continue
        new_mode, new_sha, status = parts[1], parts[3], parts[4]
        if status.startswith("D") or new_mode in ("160000", "000000"):
            continue
        rows.append((path, new_sha))
    return rows


def annotate(kind, msg):
    if os.environ.get("GITHUB_ACTIONS") == "true":
        print("::%s::%s" % (kind, msg))
    else:
        print("%s: %s" % (kind.upper(), msg))


def check_pr(base, cwd=None):
    """Return (failures, warnings, notes)."""
    fails, warns, notes = [], [], []
    old, how = comparison_point(base, cwd)
    notes.append("compared %s with %s %s" % (HEAD, how, old[:12]))
    fetched = prefetch_missing(trees=[HEAD], paths=[old + ":" + EXCEPTIONS], cwd=cwd)
    if fetched:
        notes.append("partial clone: fetched %d missing blobs in one fetch" % fetched)

    head_list = parse_exceptions(read_blob(HEAD + ":" + EXCEPTIONS, cwd))
    base_text = read_blob(old + ":" + EXCEPTIONS, cwd)
    if base_text is None:
        notes.append("%s is new in this change, so it is read as the starting list" % EXCEPTIONS)
    else:
        base_list = parse_exceptions(base_text)
        for path, size in sorted(head_list.items()):
            if path not in base_list:
                fails.append("%s gains an entry, %s; the list can only shrink" % (EXCEPTIONS, path))
            elif size > base_list[path]:
                fails.append("%s raises %s from %d to %d bytes; the list can only shrink"
                             % (EXCEPTIONS, path, base_list[path], size))

    rows = changed_blobs(old, cwd)
    sizes = blob_sizes([s for _, s in rows], cwd)
    cap = FILE_CAP_MB * MB
    for path, sha in rows:
        size = int(sizes.get(sha, ["0"])[0])
        listed = head_list.get(path)
        if listed is not None:
            if size > GROWTH_FACTOR * listed:
                fails.append("%s is %s, past %.1f times its listed %s" % (path, mb(size), GROWTH_FACTOR, mb(listed)))
        elif size > cap:
            fails.append("%s is %s, over the %d MB file limit; keep it out of the repo (#3476 Part 2 names where "
                         "large data lives)" % (path, mb(size), FILE_CAP_MB))

    added = sum(len(zlib.compress(data, 6)) for data in blob_contents([s for _, s in rows], cwd))
    notes.append("%d files added or changed, %s compressed" % (len(rows), mb(added)))
    if added > PR_GROWTH_CAP_MB * MB:
        fails.append("this change adds %s compressed, over the %d MB limit for one pull request"
                     % (mb(added), PR_GROWTH_CAP_MB))

    total = tree_total(HEAD, cwd)
    notes.append("latest version on disk: %s (limit %d MB)" % (mb(total), TOTAL_CAP_MB))
    if total > TOTAL_CAP_MB * MB:
        fails.append("the latest version is %s on disk, over the %d MB limit" % (mb(total), TOTAL_CAP_MB))

    for name, limit in WORD_LIMITS:
        text = read_blob(HEAD + ":" + name, cwd)
        if text is not None:
            words = len(text.split())
            if words > limit:
                warns.append("%s is %d words, over its %d-word budget" % (name, words, limit))

    for path, sha in rows:
        if path in head_list and int(sizes.get(sha, ["0"])[0]) <= cap:
            notes.append("%s is now under %d MB; its line in %s can go" % (path, FILE_CAP_MB, EXCEPTIONS))
    return fails, warns, notes


def check_weekly(days=7, cwd=None):
    """Return (failures, notes): main's growth in the last `days` days, in pack bytes."""
    fails, notes = [], []
    since = int(time.time()) - days * 86400
    old = git(["rev-list", "-1", "--first-parent", "--before=%d" % since, "HEAD"], cwd=cwd, check=False).stdout.decode().strip()
    if not old:
        roots = git(["rev-list", "--first-parent", "--max-parents=0", "HEAD"], cwd=cwd).stdout.decode().split()
        shallow = git(["rev-parse", "--is-shallow-repository"], cwd=cwd).stdout.decode().strip() == "true"
        old = roots[-1] if roots else ""
        notes.append("history here starts inside the window (%s); measured from the oldest commit present"
                     % ("shallow clone" if shallow else "young repo"))
    rng = [old + "..HEAD"] if old else ["HEAD"]
    fetched = prefetch_missing(trees=["HEAD"], ranges=rng, cwd=cwd)
    if fetched:
        notes.append("partial clone: fetched %d missing blobs in one fetch" % fetched)
    out = git(["rev-list", "--objects", *rng], cwd=cwd).stdout.decode("utf-8", errors="replace").splitlines()
    paths = {}
    for line in out:
        sha, _, path = line.partition(" ")
        if path:
            paths[sha] = path
    info = blob_sizes(list(paths), cwd, fmt="%(objectname) %(objecttype) %(objectsize:disk)")
    by_path, total = {}, 0
    for sha, path in paths.items():
        kind, disk = info.get(sha, ["", "0"])
        if kind != "blob":
            continue
        total += int(disk)
        by_path[path] = by_path.get(path, 0) + int(disk)
    notes.append("main grew %s compressed in %d days (limit %d MB)" % (mb(total), days, WEEKLY_CAP_MB))
    top = sorted(by_path.items(), key=lambda kv: -kv[1])[:TOP_PATHS]
    for path, size in top:
        notes.append("  %10s  %s" % (mb(size), path))
    if total > WEEKLY_CAP_MB * MB:
        fails.append("main grew %s compressed in the last %d days, over the %d MB weekly limit; the paths above "
                     "grew most" % (mb(total), days, WEEKLY_CAP_MB))
    fails.extend(check_listed_files(cwd))
    return fails, notes


def check_listed_files(cwd=None):
    """main's files over the cap against the exceptions list (COBIx on #3490): the cron's direct pushes skip the
    pull request checks, so its big files are checked here. A file over FILE_CAP_MB the list does not name, or a
    listed file past GROWTH_FACTOR times its listed size, fails."""
    listed = parse_exceptions(read_blob("HEAD:" + EXCEPTIONS, cwd))
    fails = []
    for line in list_over_limit(cwd):
        size, path = line.split(" ", 1)
        size = int(size)
        if path not in listed:
            fails.append("main holds %s, %s, over the %d MB file limit and not on %s" % (path, mb(size), FILE_CAP_MB,
                                                                                      EXCEPTIONS))
        elif size > GROWTH_FACTOR * listed[path]:
            fails.append("main's %s is %s, past %.1f times its listed %s" % (path, mb(size), GROWTH_FACTOR,
                                                                         mb(listed[path])))
    return fails


def list_over_limit(cwd=None):
    out = git(["ls-tree", "-r", "-l", "-z", "HEAD"], cwd=cwd).stdout
    lines = []
    for rec in out.split(b"\0"):
        if not rec:
            continue
        meta, path = rec.split(b"\t", 1)
        parts = meta.split()
        if parts[1] == b"blob" and parts[3] != b"-" and int(parts[3]) > FILE_CAP_MB * MB:
            lines.append("%d %s" % (int(parts[3]), path.decode()))
    return sorted(lines, key=lambda l: l.split(" ", 1)[1])


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--base", default="origin/main", help="the ref a pull request merges into")
    ap.add_argument("--head", default="HEAD", help="the commit to measure in pull request mode (default HEAD)")
    ap.add_argument("--weekly", action="store_true", help="measure main's growth over the last 7 days")
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--list-over-limit", action="store_true", help="print 'BYTES PATH' for HEAD's files over the cap")
    a = ap.parse_args(argv)
    t0 = time.time()
    global HEAD
    HEAD = a.head
    if a.list_over_limit:
        prefetch_missing(trees=["HEAD"])
        print("\n".join(list_over_limit()))
        return 0
    if a.weekly:
        fails, notes = check_weekly(a.days)
        warns = []
    else:
        fails, warns, notes = check_pr(a.base)
    for n in notes:
        print(n)
    for w in warns:
        annotate("warning", w)
    for f in fails:
        annotate("error", f)
    print("repo size guard: %s in %.1f s" % ("FAIL (%d)" % len(fails) if fails else "ok", time.time() - t0))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
