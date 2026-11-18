#!/usr/bin/env python3
"""Store a large receipt in the private cpl-receipts bucket and name it in kb/receipts/index/.

WHY (S680, issue #3476 Part 4 step 1). Sam, 2026-11-17: "Let's move the bloated
data out first thing and make sure we don't allow to go beyond a limit." The
display receipts (kb/receipts/program_requirement_records_display_*.sql.gz, about
17 MB each) were 1,531 MB of a 2.0 GB depth-1 clone, and each display build added
another. From S680 git ignores them (.gitignore). The runner builds the receipt
from the branch's committed records, this module uploads it to the PRIVATE
Supabase Storage bucket `cpl-receipts` with the service key and reads it back,
and only then does the index gain its entry. The bucket follows the ccr-desc
pattern (scripts/publish_skyview_desc_shards.sh, Sam's Aug 24 call): the runner is
the only writer and the only reader. It is private because
program_requirement_records has a person column.

RULE 10 (a2). A receipt that lives in a bucket must stay retrievable by the runner
and be named, with its checksum, in a committed index. Each entry names the
object, its size in bytes, its sha256 and its row count; the display apply
(kb/_program_requirements_display_apply.py) refuses bytes whose sha256 differs.
A session cannot reach the bucket, so the runner gets a stored receipt back for it:
`fetch NAME` (the workflow's step=fetch, force=NAME) checks it against the index and
leaves it as a run artifact, and step=display with force=NAME re-applies it, which is
the display rollback (docs/reference/data_write_rollback.md).

THE INDEX IS ONE FILE AN ENTRY (kb/receipts/index/<name>.json), so two branches that
each store a receipt never touch the same file. Nothing appends to a shared list.

FAIL CLOSED. `store-display` exits non-zero, and the workflow's apply step never
runs, when the upload fails, the read-back fails, or the read-back's sha256 differs
from the file's. The entry is written last, after the read-back matches.

A NAME HELD BY OTHER BYTES (an object already under the name, or an entry naming
other bytes) is refused, and the refusal names the way out: --supersede (the
workflow's step=display with force=supersede). It never overwrites: it
stores the new bytes at display/<sha256 first 12>/<name> beside the old object,
reads them back, and the entry's `supersedes` lists every object and sha256 it
replaces, so the old bytes stay in the bucket and git keeps the old entry.

Usage (runner, from the repo root, with SUPABASE_SERVICE_KEY):
  python3 kb/_receipt_store.py store-display [--supersede]
      store the receipt of the build cpl_pathways_roep_data.js carries
  python3 kb/_receipt_store.py fetch NAME [--out DIR]
      write a stored receipt to DIR (default kb/receipts, which git ignores),
      refused unless its sha256 is the entry's
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
INDEX = os.path.join(RECEIPTS, "index")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
BUCKET = "cpl-receipts"
DISPLAY_KIND = "program_requirement_records_display"
# ---- The kinds a run may hand out as an artifact (COBIx on #3495, 2026-11-18). The repository is public, so
# anyone signed in to GitHub can download a run's artifact: a kind goes here only when its receipt holds nothing
# beyond what a public page already shows. The bucket stays private for every kind. One table; add a kind
# here, with its reason.
PUBLIC_SAFE = {
    DISPLAY_KIND: "sets program_requirement_records.display alone: the facts the public CPL Pathways page "
                  "shows, and no person column",
}
# ---- end of the public-safe kinds
# A display build's full receipt; a delta (…_delta.sql.gz) never stands for a build.
DISPLAY_NAME = re.compile(r"^program_requirement_records_display_(\d{4}-\d{2}-\d{2})_([0-9a-f]{12})\.sql(\.gz)?$")
FIELDS = ("name", "kind", "bucket", "object", "build", "built", "bytes", "sha256", "rows", "stored_at", "run")
OPTIONAL = ("supersedes",)
SHA = re.compile(r"^[0-9a-f]{64}$")
STAMP = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
TRIES = 4


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def object_name(kind: str, name: str, sha: str | None = None) -> str:
    """Where a receipt sits in the bucket: display receipts under display/. A superseding
    copy sits in a folder named by its sha256's first 12, beside the object it replaces."""
    return ("display/" if kind == DISPLAY_KIND else kind + "/") + (sha[:12] + "/" if sha else "") + name


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
    extra = [f for f in e if f not in FIELDS + OPTIONAL]
    if missing:
        out.append("missing " + ", ".join(missing))
    if extra:
        out.append("unknown " + ", ".join(extra))
    name = e.get("name") or ""
    kind = e.get("kind") or ""
    if not isinstance(name, str) or not name or "/" in name:
        out.append("name must be a bare file name")
    if e.get("bucket") != BUCKET:
        out.append("bucket must be %s" % BUCKET)
    sups = e.get("supersedes")
    if sups is None:
        if e.get("object") != object_name(kind, name):
            out.append("object must be %s" % object_name(kind, name))
    else:
        if e.get("object") != object_name(kind, name, str(e.get("sha256") or "")):
            out.append("a superseding entry's object must be %s" % object_name(kind, name, str(e.get("sha256") or "")))
        if not isinstance(sups, list) or not sups or not all(
                isinstance(s, dict) and set(s) == {"object", "sha256", "seen_in"} and SHA.match(str(s["sha256"]))
                and s["seen_in"] in ("bucket", "index") and s["sha256"] != e.get("sha256") for s in sups):
            out.append("supersedes lists each replaced object, its other sha256 and where it was seen")
    if not isinstance(e.get("bytes"), int) or e.get("bytes", 0) <= 0:
        out.append("bytes must be a positive integer")
    if not SHA.match(str(e.get("sha256") or "")):
        out.append("sha256 must be 64 hex characters")
    if not isinstance(e.get("rows"), int) or e.get("rows", -1) < 0:
        out.append("rows must be a whole number")
    if not STAMP.match(str(e.get("stored_at") or "")):
        out.append("stored_at must be a UTC stamp")
    if kind == DISPLAY_KIND:
        m = DISPLAY_NAME.match(name)
        if not m:
            out.append("a display entry names a build's full receipt")
        elif (m.group(1), m.group(2)) != (e.get("built"), e.get("build")):
            out.append("built and build must match the name")
    if kind == ROW_AUDIT_KIND:
        out.extend(row_audit_problems(e))
    return out


# ── Kind: row_audit (S680, #3476 Part 4 step 5) ─────────────────────────────────
# A dated row Trust-Card report, kb/row_audit/<date>.md, older than the newest 14.
# kb/_row_audit_prune.py stores it as row_audit_<date>.md (the prefix keeps its index
# file, kb/receipts/index/row_audit_<date>.md.json, apart from any other kind's dated
# name), at row_audit/row_audit_<date>.md in the bucket. `built` is the report's date,
# `build` is null, and `rows` is its line count.
ROW_AUDIT_KIND = "row_audit"
ROW_AUDIT_NAME = re.compile(r"^row_audit_(\d{4}-\d{2}-\d{2})\.md$")


def row_audit_problems(e: dict) -> list:
    m = ROW_AUDIT_NAME.match(str(e.get("name") or ""))
    if not m:
        return ["a row_audit entry names row_audit_<date>.md"]
    if e.get("built") != m.group(1) or e.get("build") is not None:
        return ["a row_audit entry's built is the name's date and its build is null"]
    return []


def entry_path(name: str, folder: str | None = None) -> str:
    return os.path.join(folder or INDEX, name + ".json")


def entry_text(e: dict) -> str:
    keys = FIELDS + tuple(k for k in OPTIONAL if k in e)
    return json.dumps({k: e.get(k) for k in keys}, ensure_ascii=False, indent=1) + "\n"


def read_entry(name: str, folder: str | None = None) -> dict | None:
    p = entry_path(name, folder)
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def load_index(folder: str | None = None) -> dict:
    """{"receipts": [entry, ...]} from one file an entry, sorted by name."""
    folder = folder or INDEX
    rows = []
    if os.path.isdir(folder):
        for fn in sorted(os.listdir(folder)):
            if fn.endswith(".json"):
                with open(os.path.join(folder, fn), encoding="utf-8") as fh:
                    rows.append(json.load(fh))
    return {"bucket": BUCKET, "receipts": rows}


def add_entry(entry: dict, folder: str | None = None) -> bool:
    """File `entry` as its own file. True when written; False when the same name and
    sha256 are already there. Refuses a malformed entry, and a name filed with other
    bytes unless the entry supersedes them (it lists that sha256 in `supersedes`)."""
    bad = entry_problems(entry)
    if bad:
        raise SystemExit("REFUSING an index entry for %s: %s" % (entry.get("name"), "; ".join(bad)))
    if os.path.basename(entry_path(entry["name"], folder)) != entry["name"] + ".json":
        raise SystemExit("REFUSING an index entry name with a path in it: %s" % entry["name"])
    was = read_entry(entry["name"], folder)
    if was is not None:
        if was["sha256"] == entry["sha256"] and was["object"] == entry["object"]:
            return False
        if was["sha256"] == entry["sha256"] and not entry.get("supersedes"):
            raise SystemExit("REFUSING: %s is indexed at %s; an entry at %s must list what it supersedes"
                             % (entry["name"], was["object"], entry["object"]))
        if was["sha256"] != entry["sha256"] and was["sha256"] not in {s["sha256"] for s in entry.get("supersedes") or []}:
            raise SystemExit("REFUSING: %s is already indexed with sha256 %s, not %s. Store it with --supersede "
                             "(the workflow's step=display with force=supersede): the new bytes go "
                             "beside the old object and the entry lists what it supersedes."
                             % (entry["name"], was["sha256"], entry["sha256"]))
    path = entry_path(entry["name"], folder)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write(entry_text(entry))
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


def _first(exc: BaseException) -> str:
    return (str(exc).splitlines() or [""])[0][:300] or type(exc).__name__


def _put_and_check(storage, obj: str, data: bytes, sha: str) -> tuple[str, str | None]:
    """Upload and read back. ('stored'|'exists', None) when the object holds `data`;
    ('other', its sha256) when an object already there holds other bytes."""
    try:
        how = storage.put(obj, data)
    except Exception as exc:
        raise SystemExit("REFUSING: the upload of %s/%s failed (%s); nothing is applied" % (BUCKET, obj, _first(exc)))
    try:
        back = storage.get(obj)
    except Exception as exc:
        raise SystemExit("REFUSING: %s/%s did not read back (%s); nothing is applied" % (BUCKET, obj, _first(exc)))
    got = sha256_bytes(back)
    if got == sha:
        return how, None
    if how == "exists":
        return "other", got
    raise SystemExit("REFUSING: %s/%s reads back with sha256 %s, the file's is %s; nothing is applied"
                     % (BUCKET, obj, got, sha))


def store_file(path: str, *, kind: str, build: str | None, built: str | None, rows: int, storage,
               run: str | None = None, index_path: str | None = None, supersede: bool = False, log=print) -> dict:
    """Upload one receipt, read it back, and file its entry only when the read-back's
    sha256 equals the file's. A name already held by other bytes (in the bucket or the
    index) is refused unless `supersede`, which stores these bytes at
    object_name(kind, name, sha) beside the old object and lists what they supersede.
    Returns the entry; raises SystemExit on any failure."""
    name = os.path.basename(path)
    with open(path, "rb") as fh:
        data = fh.read()
    sha = sha256_bytes(data)
    obj = object_name(kind, name)
    was = read_entry(name, index_path)
    replaced = []
    if was is not None and was["sha256"] != sha:
        replaced.append({"object": was["object"], "sha256": was["sha256"], "seen_in": "index"})
    how, other = _put_and_check(storage, obj, data, sha)
    if other:
        replaced.append({"object": obj, "sha256": other, "seen_in": "bucket"})
    if replaced and not supersede:
        raise SystemExit("REFUSING: %s is held by other bytes (%s); they are kept. To store these bytes "
                         "(sha256 %s) beside them, run with --supersede (the workflow's step=display with "
                         "force=supersede); the entry then lists what it supersedes."
                         % (name, "; ".join("%s in the %s, sha256 %s" % (r["object"], r["seen_in"], r["sha256"])
                                            for r in replaced), sha))
    if replaced:
        obj = object_name(kind, name, sha)
        how, other = _put_and_check(storage, obj, data, sha)
        if other:
            raise SystemExit("REFUSING: %s/%s holds other bytes (sha256 %s); nothing is applied" % (BUCKET, obj, other))
    entry = {"name": name, "kind": kind, "bucket": BUCKET, "object": obj, "build": build, "built": built,
             "bytes": len(data), "sha256": sha, "rows": rows, "stored_at": utc_now(), "run": run}
    if replaced:
        entry["supersedes"] = replaced
    added = add_entry(entry, index_path)
    log("%s %s/%s: %d bytes, sha256 %s, %d rows (%s%s)" % (
        "stored" if how == "stored" else "found", BUCKET, obj, len(data), sha, rows,
        "indexed" if added else "already indexed",
        "; supersedes " + ", ".join(r["object"] for r in replaced) if replaced else ""))
    return entry


def fetch(name: str, storage, *, out: str | None = None, index_path: str | None = None, log=print,
          for_artifact: bool = False) -> str:
    """Write the stored receipt NAME to `out` (a folder; kb/receipts by default, which git
    ignores) only when its bytes carry the entry's sha256. Returns the path."""
    entry = read_entry(name, index_path)
    if entry is None:
        raise SystemExit("REFUSING: the index names no stored receipt %s" % name)
    if for_artifact and entry.get("kind") not in PUBLIC_SAFE:
        raise SystemExit("REFUSING: %s is a %s receipt, which PUBLIC_SAFE does not declare safe to hand out as a "
                         "run artifact (the repository is public). Re-apply it through step=display with "
                         "force=%s, which needs no artifact." % (name, entry.get("kind"), name))
    try:
        data = storage.get(entry["object"])
    except Exception as exc:
        raise SystemExit("REFUSING: %s/%s did not read (%s)" % (BUCKET, entry["object"], _first(exc)))
    if sha256_bytes(data) != entry["sha256"]:
        raise SystemExit("REFUSING: %s/%s reads with sha256 %s, the index names %s"
                         % (BUCKET, entry["object"], sha256_bytes(data), entry["sha256"]))
    out = out or RECEIPTS
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, name)
    with open(path, "wb") as fh:
        fh.write(data)
    log("fetched %s/%s to %s: %d bytes, sha256 %s (the index's)" % (BUCKET, entry["object"],
                                                                   os.path.relpath(path, ROOT), len(data),
                                                                   entry["sha256"]))
    return path


def store_display(storage, *, folder: str | None = None, index_path: str | None = None,
                  run: str | None = None, page_src: str | None = None, supersede: bool = False, log=print) -> int:
    """Store the receipt of the build the page carries. 0 when the index names it and the
    bucket holds those bytes; 1 otherwise, with the reason printed. With `supersede`, an
    indexed build whose bucket copy no longer matches is stored again from the receipt on
    disk, beside the old object."""
    sys.path.insert(0, HERE)
    import _program_requirements_display_apply as A  # the one page_build, receipt_for and parse

    folder = folder or RECEIPTS
    try:
        build = A.page_build(page_src)
        entry = display_entry(build, load_index(index_path))
        if entry:
            try:
                got = sha256_bytes(storage.get(entry["object"]))
            except Exception as exc:
                got = "unreadable (%s)" % _first(exc)
            if got == entry["sha256"]:
                log("build %s is stored: %s/%s, sha256 %s" % (build, BUCKET, entry["object"], entry["sha256"]))
                return 0
            if not supersede:
                raise SystemExit("REFUSING: %s/%s reads %s, the index names %s. Rebuild and store it again with "
                                 "--supersede (the workflow's step=display with force=supersede)."
                                 % (BUCKET, entry["object"], got, entry["sha256"]))
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
        if entry and entry["name"] != name:
            raise SystemExit("REFUSING: the index names build %s as %s, the disk holds %s" % (build, entry["name"], name))
        store_file(path, kind=DISPLAY_KIND, build=m.group(2), built=m.group(1), rows=len(rows), storage=storage,
                   run=run, index_path=index_path, supersede=supersede, log=log)
        return 0
    except SystemExit as exc:
        log(str(exc))
        return 1
    except Exception as exc:
        log("REFUSING: %s" % _first(exc))
        return 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sd = sub.add_parser("store-display", help="store the receipt of the build the page carries")
    sd.add_argument("--supersede", action="store_true",
                    help="store bytes for a name already held by others beside them, never over them")
    fp = sub.add_parser("fetch", help="write a stored receipt to a folder, checked against its sha256")
    fp.add_argument("name", help="the receipt's file name, as its index entry names it")
    fp.add_argument("--out", help="the folder (default kb/receipts, which git ignores)")
    fp.add_argument("--for-artifact", action="store_true",
                    help="the file becomes a run artifact anyone signed in can download: refused unless its "
                         "kind is in PUBLIC_SAFE")
    sub.add_parser("check", help="check every index entry's shape")
    args = ap.parse_args(argv)
    if args.cmd == "check":
        idx = load_index()
        bad = [(e.get("name"), p) for e in idx.get("receipts", []) for p in entry_problems(e)]
        for fn in sorted(os.listdir(INDEX)) if os.path.isdir(INDEX) else []:
            if fn.endswith(".json") and json.load(open(os.path.join(INDEX, fn))).get("name") + ".json" != fn:
                bad.append((fn, "the file is not named by its entry"))
        for name, p in bad:
            print("  %s: %s" % (name, p))
        print("%d entries, %d problems" % (len(idx.get("receipts", [])), len(bad)))
        return 1 if bad else 0
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; only the runner reaches the bucket.")
        return 2
    if args.cmd == "fetch":
        try:
            fetch(args.name, Storage(key), out=args.out, for_artifact=args.for_artifact)
            return 0
        except SystemExit as exc:
            print(exc)
            return 1
    return store_display(Storage(key), run=os.environ.get("GITHUB_RUN_ID"), supersede=args.supersede)


if __name__ == "__main__":
    sys.exit(main())
