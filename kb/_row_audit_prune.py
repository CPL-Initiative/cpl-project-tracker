#!/usr/bin/env python3
"""Keep the newest 14 row Trust-Card reports in the repo; store the older ones in the private bucket.

WHY (S680, issue #3476 Part 4 step 5). kb/_row_audit.py writes kb/row_audit/<date>.md every
day, about 6.9 MB each: 179 reports were 1,081 MB on disk, and every search a session runs
crawled them. latest.json (the one file a page reads: the Pipeline and Unified Courses tabs,
coci_lookup.js, kb/_build_commons_status.py, overmerge-apply.yml and phase-1e-apply.yml) and
the newest KEEP dated reports stay. Each older report goes to the private bucket cpl-receipts
at row_audit/row_audit_<date>.md, through kb/_receipt_store.py (kind row_audit), and is named
with its size and sha256 in kb/receipts/index/row_audit_<date>.md.json. No code reads a dated
report; git history keeps every one, and `python3 kb/_receipt_store.py fetch
row_audit_<date>.md` on a runner gets one back from the bucket.

A REPORT LEAVES THE TREE ONLY AFTER ITS INDEX ENTRY EXISTS WITH THE FILE'S SHA256. The entry
is written by store_file() only after the upload reads back with that sha256. A report whose
entry already matches is removed with no upload (a second pass, or the daily run after the
one-time move). A report with no key, a failed upload or read-back, or an entry naming other
bytes stays where it is, and the log says why.

IT NEVER FAILS THE DAILY RUN. Without --strict it exits 0 whatever happens, and
scripts/daily_build.sh adds `|| echo` beside it. --strict exits 1 when any report that should
have gone stayed (the S680 one-time move ran it: run 44258551009 stored 165 reports; its
workflow is gone). A stray old report needs no command: the next daily run stores it.

THE BUDGET IS A BOUND. With --budget-seconds every bucket call gets one try, no backoff, and a
timeout of the smaller of CALL_TIMEOUT and the budget left; once the budget is spent no call
starts. The daily block also wraps the run in `timeout`, so a call that trickles bytes past its
socket timeout is stopped too. An entry is written whole (a temp file and a rename) or not at all,
and a report is removed only after its entry, so a stop at any point leaves the files sound.

Usage:
  python3 kb/_row_audit_prune.py [--keep 14] [--max-store N] [--budget-seconds S] [--strict]
      --max-store   upload at most N reports this run (the daily run passes 3: a normal day stores 1)
      --budget-seconds  start no new upload after S seconds
Guard: tests/row_audit_prune_test.py.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
import tempfile
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _receipt_store as RS  # noqa: E402

FOLDER = os.path.join(HERE, "row_audit")
KEEP = 14
REPORT = re.compile(r"^(\d{4}-\d{2}-\d{2})\.md$")
CALL_TIMEOUT = 60  # seconds a bucket call may take here (the store's own default is 300)
LOG_STAYED = 20  # reports named one by one in the log; the rest are counted


def store_name(report: str) -> str:
    return "row_audit_" + report


def old_reports(folder: str, keep: int = KEEP) -> list:
    """The dated reports past the newest `keep`, oldest first. latest.json and every other
    file are never in the list."""
    dated = sorted(n for n in os.listdir(folder) if REPORT.match(n) and os.path.isfile(os.path.join(folder, n)))
    return dated[:-keep] if keep > 0 else dated


def _indexed(report_path: str, index_path: str | None) -> tuple[bool, str]:
    """(True, '') when the index names this file's bytes under kind row_audit."""
    entry = RS.read_entry(store_name(os.path.basename(report_path)), index_path)
    if entry is None:
        return False, "no index entry"
    sha = RS.sha256_file(report_path)
    if entry.get("kind") != RS.ROW_AUDIT_KIND or entry.get("sha256") != sha:
        return False, "the index entry names other bytes (sha256 %s, the file's is %s)" % (entry.get("sha256"), sha)
    return True, ""


def prune(folder: str = FOLDER, *, storage=None, index_path: str | None = None, keep: int = KEEP,
          max_store: int | None = None, budget_seconds: float | None = None, run: str | None = None,
          log=print, clock=time.monotonic) -> dict:
    """Move the reports past the newest `keep` out of `folder`. Returns
    {"kept": [...], "removed": [...], "stayed": {name: reason}}. Never raises."""
    out = {"kept": [], "removed": [], "stayed": {}}
    try:
        dated = sorted(n for n in os.listdir(folder) if REPORT.match(n))
        old = old_reports(folder, keep)
        out["kept"] = [n for n in dated if n not in old]
    except Exception as exc:
        log("row audit prune: could not list %s (%s); nothing removed" % (folder, RS._first(exc)))
        return out
    t0, stored = clock(), 0
    tmp = tempfile.mkdtemp(prefix="row_audit_store_")
    try:
        for name in old:
            path = os.path.join(folder, name)
            try:
                ok, why = _indexed(path, index_path)
                if not ok and why == "no index entry":
                    if storage is None:
                        out["stayed"][name] = "no SUPABASE_SERVICE_KEY, so no upload"
                        continue
                    if max_store is not None and stored >= max_store:
                        out["stayed"][name] = "this run's upload limit (%d) is reached" % max_store
                        continue
                    if budget_seconds is not None and clock() - t0 > budget_seconds:
                        out["stayed"][name] = "this run's time budget (%ds) is spent" % budget_seconds
                        continue
                    copy = os.path.join(tmp, store_name(name))
                    shutil.copyfile(path, copy)
                    with open(copy, "rb") as fh:
                        lines = fh.read().count(b"\n")
                    stored += 1
                    try:
                        RS.store_file(copy, kind=RS.ROW_AUDIT_KIND, build=None, built=REPORT.match(name).group(1),
                                      rows=lines, storage=storage, run=run, index_path=index_path, log=log)
                    except SystemExit as exc:
                        out["stayed"][name] = str(exc)
                        continue
                    finally:
                        os.remove(copy)
                    ok, why = _indexed(path, index_path)
                if not ok:
                    out["stayed"][name] = why
                    continue
                os.remove(path)
                out["removed"].append(name)
            except Exception as exc:
                out["stayed"][name] = RS._first(exc)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    try:
        log("row audit prune: %d kept (the newest %d), %d removed (indexed with a matching sha256), %d stayed"
            % (len(out["kept"]), keep, len(out["removed"]), len(out["stayed"])))
        stayed = sorted(out["stayed"].items())
        for name, why in stayed[:LOG_STAYED]:
            log("  stays: %s: %s" % (name, why))
        if len(stayed) > LOG_STAYED:
            log("  and %d more stay, the last %s: %s" % (len(stayed) - LOG_STAYED, stayed[-1][0], stayed[-1][1]))
    except Exception:
        pass
    return out


def _opener(req, timeout=None):
    return urllib.request.urlopen(req, timeout=CALL_TIMEOUT)


class BoundedStorage(RS.Storage):
    """The store's bucket calls inside a deadline: one try a call, no backoff, and a timeout
    of the smaller of CALL_TIMEOUT and the seconds left. A call past the deadline never starts."""

    def __init__(self, key: str, deadline: float, *, clock=time.monotonic, opener=None, **kw):
        super().__init__(key, opener=opener or urllib.request.urlopen, **kw)
        self.deadline, self.clock = deadline, clock

    def _call(self, req):
        left = self.deadline - self.clock()
        if left < 1:
            raise TimeoutError("this run's time budget is spent")
        with self.opener(req, timeout=min(CALL_TIMEOUT, left)) as resp:
            return resp.read()


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--keep", type=int, default=KEEP)
    ap.add_argument("--max-store", type=int)
    ap.add_argument("--budget-seconds", type=float)
    ap.add_argument("--strict", action="store_true", help="exit 1 when a report that should have gone stayed")
    ap.add_argument("--folder", default=FOLDER)
    try:
        a = ap.parse_args(argv)
    except SystemExit:
        return 2 if "--strict" in (argv or sys.argv) else 0
    try:
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not key:
            storage = None
        elif a.budget_seconds is not None:
            storage = BoundedStorage(key, time.monotonic() + a.budget_seconds)
        else:
            storage = RS.Storage(key, opener=_opener)
        res = prune(a.folder, storage=storage, keep=max(a.keep, 1), max_store=a.max_store,
                    budget_seconds=a.budget_seconds, run=os.environ.get("GITHUB_RUN_ID"))
    except Exception as exc:  # belt and braces: prune() itself never raises
        print("row audit prune: %s; nothing more removed" % RS._first(exc))
        return 1 if a.strict else 0
    if res["stayed"] and a.strict:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
