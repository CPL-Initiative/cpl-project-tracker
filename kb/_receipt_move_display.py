#!/usr/bin/env python3
"""Move the committed display receipts into cpl-receipts, once, and gate their removal.

WHY (S680, issue #3476 Part 4 step 4). Sam, 2026-11-17: "Let's move the bloated
data out first thing and make sure we don't allow to go beyond a limit." From S680
no display receipt is committed (kb/_receipt_store.py), but the 141 committed before
it hold 2.4 GB of the tree. They leave in one PR, in two halves, in order:

  1. The store (this script's --apply, run by .github/workflows/receipt-move.yml when
     a push changes kb/receipts/.move). The runner checks out the full tree and, for
     every tracked display receipt (the small *.applied_*.json records stay), checks
     that its bytes hash to the blob the tree names, gzips a plain .sql (up to 72.7 MB,
     over the bucket's 50 MB an object), stores it through store_file(), reads it back,
     and files its entry under kb/receipts/index/ with the stored object's sha256 and
     size and the repo file's sha256, size and blob id. It commits only those entries.
  2. The removal, a later commit that runs `git rm` on the stored files. The gate
     (gate(), run by tests/receipt_move_gate_test.py in CI) fails when a display
     receipt the base branch tracks is gone from the tree without an entry naming
     that path's blob, so a green `test` proves no file left the tree unstored.

Nothing leaves history: each file stays in the parent of the commit that removed it
(docs/reference/data_write_rollback.md), and in the bucket by its entry.

A re-run skips a file whose entry already names its blob, so a run that stopped
part way costs only what is left.

Usage, from the repo root:
  python3 kb/_receipt_move_display.py --dry-run           count what moves, by kind; no network
  python3 kb/_receipt_move_display.py --apply [--workers 4]   (runner, SUPABASE_SERVICE_KEY)

Guards: tests/receipt_move_gate_test.py, tests/display_receipt_store_test.py.
"""
from __future__ import annotations

import argparse
import gzip
import os
import re
import subprocess
import sys
import threading
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _receipt_store as S  # noqa: E402  (the one index, kinds and bucket)

DATED = re.compile(r"_(\d{4}-\d{2}-\d{2})(?:_([0-9a-f]{12}))?")


def tracked(listing: str) -> list[dict]:
    """The display receipts in `git ls-tree -r [-l] <tree> -- kb/receipts/` output:
    [{path, name, blob, kind, size}] (size with -l, else None). An applied record or any
    other receipt is left out."""
    out = []
    for line in listing.splitlines():
        if "\t" not in line:
            continue
        meta, path = line.split("\t", 1)
        parts = meta.split()
        if len(parts) < 3 or parts[1] != "blob":
            continue
        blob = parts[2]
        size = int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else None
        name = path.rsplit("/", 1)[-1]
        if not path.startswith("kb/receipts/") or "/" in path[len("kb/receipts/"):]:
            continue
        kind = S.kind_of(name)
        if kind:
            out.append({"path": path, "name": name, "blob": blob, "kind": kind, "size": size})
    return out


def build_of(name: str, kind: str) -> tuple[str | None, str | None]:
    """(build, built) a receipt's name carries; a date-only receipt names no build."""
    m = DATED.search(name)
    if not m:
        return None, None
    return (m.group(2) if kind != "program_requirement_records_display_dated" else None), m.group(1)


def statements(raw: bytes, name: str) -> int:
    """The statement lines of a receipt: every line that is neither blank nor a comment."""
    text = (gzip.decompress(raw) if name.endswith(".gz") else raw).decode("utf-8")
    return sum(1 for line in text.splitlines() if line.strip() and not line.startswith("--"))


def move(items: list[dict], storage, *, root: str = ROOT, index_path: str | None = None, run: str | None = None,
         workers: int = 4, log=print) -> Counter:
    """Store each item and file its entry. Counter of stored, already and failed."""
    tally, lock = Counter(), threading.Lock()

    def one(it):
        was = S.read_entry(it["name"], index_path)
        if was is not None and was.get("repo_blob") == it["blob"]:
            with lock:
                tally["already"] += 1
            return
        path = os.path.join(root, it["path"])
        try:
            with open(path, "rb") as fh:
                rows = statements(fh.read(), it["name"])
            build, built = build_of(it["name"], it["kind"])
            S.store_file(path, kind=it["kind"], build=build, built=built, rows=rows, storage=storage, run=run,
                         index_path=index_path, repo_blob=it["blob"], gzip_store=not it["name"].endswith(".gz"),
                         log=lambda m: None)
            with lock:
                tally["stored"] += 1
                if tally["stored"] % 10 == 0:
                    log("  stored %d of %d" % (tally["stored"], len(items)))
        except (SystemExit, Exception) as exc:
            with lock:
                tally["failed"] += 1
                log("FAILED %s: %s" % (it["name"], (str(exc).splitlines() or [type(exc).__name__])[0][:300]))

    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        list(pool.map(one, items))
    return tally


def gate(base: list[dict], head_paths: set, index_path: str | None = None, read_blob=None) -> list[str]:
    """Every display receipt `base` tracks that `head_paths` lacks must have an index entry for
    its name whose repo_blob is that path's blob (and, where `read_blob(blob)` returns the
    bytes, whose repo_sha256 is theirs). Returns the problems; empty means the removal is safe."""
    out = []
    for it in base:
        if it["path"] in head_paths:
            continue
        e = S.read_entry(it["name"], index_path)
        if e is None:
            out.append("%s left the tree with no index entry" % it["path"])
            continue
        bad = S.entry_problems(e)
        if bad:
            out.append("%s: its entry is malformed (%s)" % (it["path"], "; ".join(bad)))
        elif e.get("repo_blob") != it["blob"]:
            out.append("%s left the tree as blob %s; its entry names %s" % (it["path"], it["blob"], e.get("repo_blob")))
        elif read_blob is not None:
            data = read_blob(it["blob"])
            if data is not None and S.sha256_bytes(data) != e["repo_sha256"]:
                out.append("%s: its blob's sha256 is not the entry's repo_sha256" % it["path"])
    return out


def git(*args: str, root: str = ROOT) -> str:
    return subprocess.run(["git", *args], cwd=root, check=True, capture_output=True, text=True).stdout


def main(argv: list[str] | None = None, storage=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="count what moves; no network")
    mode.add_argument("--apply", action="store_true", help="store each one with SUPABASE_SERVICE_KEY")
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args(argv)
    items = tracked(git("ls-tree", "-r", "-l", "HEAD", "--", "kb/receipts/"))
    sizes, counts = Counter(), Counter(it["kind"] for it in items)
    for it in items:
        sizes[it["kind"]] += it["size"] or 0
    for kind in sorted(counts):
        print("%-46s %4d files %9.1f MB" % (kind, counts[kind], sizes[kind] / 1e6))
    print("%-46s %4d files %9.1f MB" % ("all", len(items), sum(sizes.values()) / 1e6))
    if args.dry_run:
        return 0
    if storage is None:
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not key:
            print("SUPABASE_SERVICE_KEY is not set; only the runner reaches the bucket.")
            return 2
        storage = S.Storage(key)
    missing = [it["path"] for it in items if not os.path.exists(os.path.join(ROOT, it["path"]))]
    if missing:
        print("REFUSING: %d tracked receipts are not on disk (a sparse checkout?), first %s" % (len(missing), missing[0]))
        return 1
    tally = move(items, storage, run=os.environ.get("GITHUB_RUN_ID"), workers=args.workers)
    print("stored %d, already indexed %d, failed %d, of %d" % (tally["stored"], tally["already"], tally["failed"],
                                                              len(items)))
    return 1 if tally["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
