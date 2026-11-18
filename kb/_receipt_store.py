#!/usr/bin/env python3
"""Store a large receipt in the private cpl-receipts bucket and name it in kb/receipts/index.json.

WHY (S680, issue #3476 Part 4 step 1). Sam, 2026-11-17: "Let's move the bloated
data out first thing and make sure we don't allow to go beyond a limit." The
display receipts (kb/receipts/program_requirement_records_display_*.sql.gz, about
17 MB each) were 1,531 MB of a 2.0 GB depth-1 clone, and each display build added
another. From S680 git ignores them (.gitignore). The runner builds the receipt
from the branch's committed records, this module uploads it to the PRIVATE
Supabase Storage bucket `cpl-receipts` with the service key and reads it back,
and only then does kb/receipts/index.json gain its entry. The bucket follows the
ccr-desc pattern (scripts/publish_skyview_desc_shards.sh, Sam's Aug 24 call):
the runner is the only writer and the only reader. It is private because
program_requirement_records has a person column.

RULE 10 (a2). A receipt that lives in a bucket must stay retrievable by the runner
and be named, with its checksum, in a committed index. Each entry names the
object, its size in bytes, its sha256 and its row count; the display apply
(kb/_program_requirements_display_apply.py) refuses bytes whose sha256 differs.

FAIL CLOSED. `store-display` exits non-zero, and the workflow's apply step never
runs, when the upload fails, the read-back fails, or the read-back's sha256 differs
from the file's. The index entry is written last, after the read-back matches.

The index is small and committed: {"_about", "bucket", "receipts": [entry, ...]},
one entry a line, sorted by name, so two branches' entries rarely touch.

Usage (runner, from the repo root, with SUPABASE_SERVICE_KEY):
  python3 kb/_receipt_store.py store-display
      store the receipt of the build cpl_pathways_roep_data.js carries
  python3 kb/_receipt_store.py check
      check every index entry's shape (no network)

The next worker (moving the existing receipts out) calls store_file() for each
committed receipt with kind, build and built from its name (DISPLAY_NAME), then
removes the file in a normal PR; the history keeps every copy.

Guard: tests/display_receipt_store_test.py.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RECEIPTS = os.path.join(HERE, "receipts")
INDEX = os.path.join(RECEIPTS, "index.json")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
BUCKET = "cpl-receipts"
DISPLAY_KIND = "program_requirement_records_display"
# A display build's full receipt; a delta (…_delta.sql.gz) never stands for a build.
DISPLAY_NAME = re.compile(r"^program_requirement_records_display_(\d{4}-\d{2}-\d{2})_([0-9a-f]{12})\.sql(\.gz)?$")
FIELDS = ("name", "kind", "bucket", "object", "build", "built", "bytes", "sha256", "rows", "stored_at", "run")
SHA = re.compile(r"^[0-9a-f]{64}$")
STAMP = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
TRIES = 4
ABOUT = ("Receipts kept in the private Supabase Storage bucket cpl-receipts instead of git (S680, #3476; "
         "Sam, 2026-11-17). Each entry names the object, its size, sha256 and row count. The runner writes "
         "an entry only after the upload reads back with the same sha256 (kb/_receipt_store.py), and the "
         "display apply refuses bytes whose sha256 differs (kb/_program_requirements_display_apply.py). "
         "Rule 10 (a2): this file is how a stored receipt is found and checked.")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def object_name(kind: str, name: str) -> str:
    """Where a receipt sits in the bucket: display receipts under display/."""
    return ("display/" if kind == DISPLAY_KIND else kind + "/") + name


def content_type(name: str) -> str:
    if name.endswith(".gz"):
        return "application/gzip"
    if name.endswith(".json"):
        return "application/json"
    if name.endswith(".sql"):
        return "application/sql"
    return "text/plain"


def entry_problems(e: dict) -> list:
    """Every way an index entry is malformed; empty when it is sound."""
    out = []
    if not isinstance(e, dict):
        return ["not an object"]
    missing = [f for f in FIELDS if f not in e]
    extra = [f for f in e if f not in FIELDS]
    if missing:
        out.append("missing " + ", ".join(missing))
    if extra:
        out.append("unknown " + ", ".join(extra))
    name = e.get("name") or ""
    if not isinstance(name, str) or not name or "/" in name:
        out.append("name must be a bare file name")
    if e.get("bucket") != BUCKET:
        out.append("bucket must be %s" % BUCKET)
    if e.get("object") != object_name(e.get("kind") or "", name):
        out.append("object must be %s" % object_name(e.get("kind") or "", name))
    if not isinstance(e.get("bytes"), int) or e.get("bytes", 0) <= 0:
        out.append("bytes must be a positive integer")
    if not SHA.match(str(e.get("sha256") or "")):
        out.append("sha256 must be 64 hex characters")
    if not isinstance(e.get("rows"), int) or e.get("rows", -1) < 0:
        out.append("rows must be a whole number")
    if not STAMP.match(str(e.get("stored_at") or "")):
        out.append("stored_at must be a UTC stamp")
    if e.get("kind") == DISPLAY_KIND:
        m = DISPLAY_NAME.match(name)
        if not m:
            out.append("a display entry names a build's full receipt")
        elif (m.group(1), m.group(2)) != (e.get("built"), e.get("build")):
            out.append("built and build must match the name")
    return out


def load_index(path: str | None = None) -> dict:
    path = path or INDEX
    if not os.path.exists(path):
        return {"_about": ABOUT, "bucket": BUCKET, "receipts": []}
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def index_text(idx: dict) -> str:
    """One entry a line, sorted by name, keys in FIELDS order: a small diff per store."""
    rows = sorted(idx.get("receipts", []), key=lambda e: e["name"])
    lines = ["{", ' "_about": %s,' % json.dumps(idx.get("_about", ABOUT)),
             ' "bucket": %s,' % json.dumps(idx.get("bucket", BUCKET)), ' "receipts": [']
    for i, e in enumerate(rows):
        lines.append("  " + json.dumps({f: e.get(f) for f in FIELDS}, ensure_ascii=False)
                     + ("," if i < len(rows) - 1 else ""))
    lines += [" ]", "}"]
    return "\n".join(lines) + "\n"


def add_entry(entry: dict, path: str | None = None) -> bool:
    """File `entry` in the index. True when added; False when the same name and sha256
    are already there. Refuses a malformed entry, and a name already filed with other bytes."""
    path = path or INDEX
    bad = entry_problems(entry)
    if bad:
        raise SystemExit("REFUSING an index entry for %s: %s" % (entry.get("name"), "; ".join(bad)))
    idx = load_index(path)
    for e in idx["receipts"]:
        if e["name"] == entry["name"]:
            if e["sha256"] == entry["sha256"]:
                return False
            raise SystemExit("REFUSING: %s is already indexed with sha256 %s, not %s"
                             % (entry["name"], e["sha256"], entry["sha256"]))
    idx["receipts"].append(entry)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write(index_text(idx))
    os.replace(tmp, path)
    return True


def display_entry(build: str, index: dict | None = None) -> dict | None:
    """The index entry of a display build's full receipt, or None; two is refused."""
    idx = index if index is not None else load_index()
    hits = [e for e in idx.get("receipts", []) if e.get("kind") == DISPLAY_KIND and e.get("build") == build]
    if len(hits) > 1:
        raise SystemExit("%d index entries name display build %s" % (len(hits), build))
    return hits[0] if hits else None


class Storage:
    """The private bucket through the Storage REST API, with the service key. `opener` is
    urllib.request.urlopen, injectable for the test."""

    def __init__(self, key: str, url: str = SUPABASE_URL, bucket: str = BUCKET, opener=None, sleep=time.sleep):
        self.key, self.url, self.bucket = key, url.rstrip("/"), bucket
        self.opener, self.sleep = opener or urllib.request.urlopen, sleep

    def _call(self, req):
        for i in range(TRIES):
            try:
                with self.opener(req, timeout=300) as resp:
                    return resp.read()
            except urllib.error.HTTPError as exc:
                if exc.code < 500 and exc.code not in (408, 429) or i == TRIES - 1:
                    raise
            except (urllib.error.URLError, TimeoutError, ConnectionError):
                if i == TRIES - 1:
                    raise
            self.sleep(2 ** i)

    def _path(self, obj: str, auth: bool = False) -> str:
        return "%s/storage/v1/object/%s%s/%s" % (self.url, "authenticated/" if auth else "", self.bucket,
                                                 urllib.parse.quote(obj))

    def _headers(self, extra: dict | None = None) -> dict:
        h = {"apikey": self.key, "Authorization": "Bearer " + self.key}
        h.update(extra or {})
        return h

    def put(self, obj: str, data: bytes) -> str:
        """Upload, never over an object already there. 'stored' or 'exists'."""
        req = urllib.request.Request(self._path(obj), data=data, method="POST", headers=self._headers(
            {"Content-Type": content_type(obj), "x-upsert": "false"}))
        try:
            self._call(req)
            return "stored"
        except urllib.error.HTTPError as exc:
            body = ""
            try:
                body = exc.read().decode("utf-8", "replace")
            except Exception:
                pass
            if exc.code == 409 or (exc.code == 400 and ("Duplicate" in body or "already exists" in body)):
                return "exists"
            raise

    def get(self, obj: str) -> bytes:
        return self._call(urllib.request.Request(self._path(obj, auth=True), method="GET", headers=self._headers()))


def utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def store_file(path: str, *, kind: str, build: str | None, built: str | None, rows: int, storage,
               run: str | None = None, index_path: str | None = None, log=print) -> dict:
    """Upload one receipt, read it back, and file its entry only when the read-back's
    sha256 equals the file's. An object already there under the name passes only when
    its bytes are the file's. Returns the entry; raises SystemExit on any failure."""
    name = os.path.basename(path)
    with open(path, "rb") as fh:
        data = fh.read()
    sha = sha256_bytes(data)
    obj = object_name(kind, name)
    try:
        how = storage.put(obj, data)
    except Exception as exc:
        raise SystemExit("REFUSING: the upload of %s to %s/%s failed (%s); nothing is applied"
                         % (name, BUCKET, obj, (str(exc).splitlines() or [""])[0][:300]))
    try:
        back = storage.get(obj)
    except Exception as exc:
        raise SystemExit("REFUSING: %s/%s did not read back (%s); nothing is applied"
                         % (BUCKET, obj, (str(exc).splitlines() or [""])[0][:300]))
    if sha256_bytes(back) != sha:
        raise SystemExit("REFUSING: %s/%s reads back with sha256 %s, the file's is %s; nothing is applied"
                         % (BUCKET, obj, sha256_bytes(back), sha))
    entry = {"name": name, "kind": kind, "bucket": BUCKET, "object": obj, "build": build, "built": built,
             "bytes": len(data), "sha256": sha, "rows": rows, "stored_at": utc_now(), "run": run}
    added = add_entry(entry, index_path)
    log("%s %s/%s: %d bytes, sha256 %s, %d rows (%s)" % ("stored" if how == "stored" else "found", BUCKET, obj,
                                                         len(data), sha, rows,
                                                         "indexed" if added else "already indexed"))
    return entry


def store_display(storage, *, folder: str | None = None, index_path: str | None = None,
                  run: str | None = None, page_src: str | None = None, log=print) -> int:
    """Store the receipt of the build the page carries. 0 when the index names it and the
    bucket holds those bytes; 1 otherwise, with the reason printed."""
    sys.path.insert(0, HERE)
    import _program_requirements_display_apply as A  # the one page_build, receipt_for and parse

    folder = folder or RECEIPTS
    try:
        build = A.page_build(page_src)
        entry = display_entry(build, load_index(index_path))
        if entry:
            back = storage.get(entry["object"])
            if sha256_bytes(back) != entry["sha256"]:
                raise SystemExit("REFUSING: %s/%s reads back with sha256 %s, the index names %s"
                                 % (BUCKET, entry["object"], sha256_bytes(back), entry["sha256"]))
            log("build %s is stored: %s/%s, sha256 %s" % (build, BUCKET, entry["object"], entry["sha256"]))
            return 0
        path = A.receipt_for(build, folder)
        name = os.path.basename(path)
        m = DISPLAY_NAME.match(name)
        if not m:
            raise SystemExit("REFUSING: %s is not named as a build's full receipt" % name)
        rows = A.parse(A.read_receipt(path))
        if not rows:
            raise SystemExit("REFUSING: %s holds no statement" % name)
        other = [r["control_number"] for r in rows if (r["display"] or {}).get("build") != build]
        if other:
            raise SystemExit("REFUSING: %d statements of %s carry another build than %s" % (len(other), name, build))
        store_file(path, kind=DISPLAY_KIND, build=m.group(2), built=m.group(1), rows=len(rows), storage=storage,
                   run=run, index_path=index_path, log=log)
        return 0
    except SystemExit as exc:
        log(str(exc))
        return 1
    except Exception as exc:
        log("REFUSING: %s" % ((str(exc).splitlines() or [type(exc).__name__])[0][:300]))
        return 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("store-display", help="store the receipt of the build the page carries")
    sub.add_parser("check", help="check every index entry's shape")
    args = ap.parse_args(argv)
    if args.cmd == "check":
        idx = load_index()
        bad = [(e.get("name"), p) for e in idx.get("receipts", []) for p in entry_problems(e)]
        names = [e.get("name") for e in idx.get("receipts", [])]
        if len(set(names)) != len(names):
            bad.append(("index", "a name appears twice"))
        for name, p in bad:
            print("  %s: %s" % (name, p))
        print("%d entries, %d problems" % (len(names), len(bad)))
        return 1 if bad else 0
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; only the runner stores a receipt.")
        return 2
    return store_display(Storage(key), run=os.environ.get("GITHUB_RUN_ID"))


if __name__ == "__main__":
    sys.exit(main())
