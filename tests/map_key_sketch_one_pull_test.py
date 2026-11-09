#!/usr/bin/env python3
"""Guard the salt-rotation sketch: it reads past PostgREST's row cap and keeps ONE pull.

    python3 tests/map_key_sketch_one_pull_test.py

The failure this guards (measured live 2026-11-08, S611): `write_sketch` read
every stored pull with one `limit=200000` GET. PostgREST caps a response at
1,000 rows here, so the read saw only the newest pull's first 1,000 hashes, the
"keep two pulls" cleanup never saw an older date, and 74 pulls (148,000 hashes)
piled up between 2026-08-19 and 2026-11-08. Nothing errored.

Sam's ruling (2026-11-08, S604): COBI keeps no student-level rows. Plan step 3
on #2919 takes the sketch down to one pull at rest.

The fake below enforces a row cap like the real server, so the old code fails
every check here: it compares against half a pull and leaves the older pulls.
"""

from __future__ import annotations

import importlib.util
import json
import os
import sys
from urllib.parse import parse_qs, urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "sync_map", os.path.join(ROOT, "kb", "_sync_map_custom_reports.py"))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

failures: list[str] = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


class CappedSketchStore:
    """map_student_key_sketch behind a PostgREST that returns at most `cap` rows."""

    def __init__(self, rows, cap):
        self.rows = list(rows)
        self.cap = cap

    def _filter(self, q):
        out = self.rows
        for col in ("pull_date", "sample_hash"):
            for v in q.get(col, []):
                op, _, val = v.partition(".")
                if op == "eq":
                    out = [r for r in out if r[col] == val]
                elif op == "neq":
                    out = [r for r in out if r[col] != val]
                else:
                    raise AssertionError(f"unsupported filter {col}={v}")
        return out

    def request(self, method, path, key, body=None, timeout=180):
        u = urlsplit(path)
        if u.path != "map_student_key_sketch":
            raise AssertionError(f"unexpected table {u.path}")
        q = parse_qs(u.query)
        if method == "GET":
            out = self._filter(q)
            if "order" in q:
                col, _, direction = q["order"][0].partition(".")
                out = sorted(out, key=lambda r: r[col], reverse=direction == "desc")
            off = int(q.get("offset", ["0"])[0])
            lim = min(int(q.get("limit", [str(10 ** 9)])[0]), self.cap)
            out = out[off:off + lim]
            sel = q["select"][0].split(",")
            return 200, json.dumps([{c: r[c] for c in sel} for r in out]).encode()
        if method == "DELETE":
            gone = {id(r) for r in self._filter(q)}
            self.rows = [r for r in self.rows if id(r) not in gone]
            return 204, b""
        raise AssertionError(f"unexpected {method}")

    def insert(self, table, rows, key):
        self.rows.extend(dict(r) for r in rows)
        return len(rows)


def hashes(prefix, n):
    return [f"{prefix}{i:05d}" for i in range(n)]


N = sync.SKETCH_N
old_pulls = {"2026-11-05": hashes("a", N), "2026-11-06": hashes("b", N),
             "2026-11-07": hashes("c", N)}
store = CappedSketchStore(
    [{"pull_date": d, "sample_hash": h} for d, hs in old_pulls.items() for h in hs],
    cap=1000)

# Today's pull shares 1,500 of yesterday's 2,000 hashes, all of them past the
# first 1,000 in hash order, so a read cut off at the cap would find no overlap
# at all and call a stable salt ROTATED?.
today = hashes("c", N)[500:] + hashes("z", 500)

_real = (sync._request, sync.insert)
sync._request, sync.insert = store.request, store.insert
try:
    rep = sync.write_sketch(today, "k", "2026-11-08")
finally:
    sync._request, sync.insert = _real

check(rep["prev_date"] == "2026-11-07",
      f"the previous pull is the newest stored date before today; got {rep['prev_date']}")
check(abs(rep["overlap"] - 0.75) < 1e-9,
      f"overlap must be read over all {N} of yesterday's hashes (1,500/2,000 = 0.75), "
      f"past the 1,000-row cap; got {rep['overlap']}")
check(rep["verdict"] == "stable", f"a 75% overlap is stable; got {rep['verdict']}")
dates = sorted({r["pull_date"] for r in store.rows})
check(dates == ["2026-11-08"],
      f"exactly ONE pull stays at rest (Sam, 2026-11-08); got {dates}")
check(len(store.rows) == N, f"today's {N} hashes stay; got {len(store.rows)}")

# A server cap smaller than the page still reads every hash: paging stops on an
# empty page, never on a short one.
small = CappedSketchStore(
    [{"pull_date": "2026-11-07", "sample_hash": h} for h in hashes("c", N)], cap=300)
sync._request, sync.insert = small.request, small.insert
try:
    rep2 = sync.write_sketch(today, "k", "2026-11-08")
finally:
    sync._request, sync.insert = _real
check(abs(rep2["overlap"] - 0.75) < 1e-9,
      f"a 300-row cap must not shorten the read; got overlap {rep2['overlap']}")

# The first pull ever has nothing to compare and still leaves only itself.
empty = CappedSketchStore([], cap=1000)
sync._request, sync.insert = empty.request, empty.insert
try:
    rep3 = sync.write_sketch(today, "k", "2026-11-08")
finally:
    sync._request, sync.insert = _real
check(rep3["verdict"] == "first-pull" and len(empty.rows) == N,
      f"first pull: verdict {rep3['verdict']}, {len(empty.rows)} rows")

if failures:
    print(f"FAIL — {len(failures)} problem(s):")
    for f in failures:
        print(f"  ✗ {f}")
    sys.exit(1)
print("OK — the sketch reads past the row cap, compares against the whole previous "
      "pull, and keeps one pull at rest.")
