#!/usr/bin/env python3
"""Remove the stale mojibake twins from chatbox_college_courses: dry run, apply, or undo.

  python3 kb/_course_title_cleanup_apply.py kb/course_title_cleanup_out/2026-09-27              # dry run: read, check, report
  python3 kb/_course_title_cleanup_apply.py kb/course_title_cleanup_out/2026-09-27 --commit     # delete; receipt removed_<ts>.json
  python3 kb/_course_title_cleanup_apply.py kb/course_title_cleanup_out/2026-09-27 --rollback   # re-insert every receipt's rows

Sam's verdict, 2026-09-27 (card 7 of the open-asks sheet, "Clean the source"): clean the stored
titles once, under a receipt, and keep the loader repair as the belt.

Why the clean is a removal. kb/_sync_college_courses.py upserts on (college, subject,
course_number, course_title). The 2026-09-18 sync, the first with kb/_text_repair.fix_moji in the
builder, therefore inserted a repaired twin beside each garbled row and removed nothing. Measured
2026-09-27: 397 garbled rows, each with exactly one twin carrying the same words and the same value
in every other column. Repairing a stored title in place would collide with its twin on that key,
so the clean removes the garbled row and the twin stays. The repo's Supabase guard denies a
session's write to this table, so .github/workflows/course-title-cleanup-apply.yml carries it, the
way esl-sheet-apply.yml carries the ESL verdicts.

Rule 10, enforced here rather than by recall:
  - plan.json holds the reviewed set's fingerprint (count, id sum, bounds, and the sha256 of the
    sorted ids). The applier re-derives the set from a fresh read at write time and REFUSES to
    write when the fingerprint differs: a set that moved was never reviewed.
  - A row qualifies only while it still carries the loader's mojibake marks (kb/_text_repair's
    _MOJI_RE, imported, never copied), has exactly one sibling on (college, subject,
    course_number), and that sibling is clean, has the same words, and matches it on every other
    column.
  - Each removal is guarded on the row's id AND its title as read, so a row that changed since the
    read is left alone and reported.
  - The receipt carries FULL row images (docs/reference/data_write_rollback.md: a DELETE's receipt
    must) and is written before the first removal; --rollback re-inserts them, skipping any row
    whose id or key is already present.

Env: SUPABASE_URL (default the project URL), SUPABASE_SERVICE_KEY (the workflow holds it).
"""
import argparse
import datetime
import glob
import hashlib
import http.client
import json
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _text_repair import _MOJI_RE  # noqa: E402  the loader's own detector, one copy

TABLE = "chatbox_college_courses"
COLS = ("id", "college", "subject", "course_number", "course_title", "units", "credit_type",
        "top_code", "top_title", "cid", "control_number", "synced_at")
KEY = ("college", "subject", "course_number")
SAME = ("units", "credit_type", "top_code", "top_title", "cid", "control_number")
PAGE = 1000
INSERT_CHUNK = 100
# PostgREST `like` narrows the read to titles holding a lead mark; _MOJI_RE decides.
LEAD_MARKS = ("Ã", "Â", "â")
# A reset connection, a timeout, or a gateway 429/5xx is retried with backoff; anything else
# (a 4xx from PostgREST) fails at once. Measured 2026-09-27: the first commit run died on one
# "Connection reset by peer" among some 800 requests, before its first write.
ATTEMPTS = 5
TRANSIENT_HTTP = {429, 500, 502, 503, 504}


class Rest:
    """The PostgREST calls this script makes, against chatbox_college_courses only."""

    def __init__(self, url, key, sleep=time.sleep):
        self.base = url.rstrip("/") + "/rest/v1/" + TABLE
        self.key = key
        self.sleep = sleep
        self.retried = False

    def _call(self, method, params, body=None, prefer=None, rng=None):
        """_send, retried on a transient failure; `retried` says whether the last call was."""
        self.retried = False
        for attempt in range(ATTEMPTS):
            try:
                return self._send(method, params, body, prefer, rng)
            except urllib.error.HTTPError as e:
                if e.code not in TRANSIENT_HTTP or attempt == ATTEMPTS - 1:
                    raise
            except (urllib.error.URLError, http.client.HTTPException, ConnectionError,
                    socket.timeout, TimeoutError):
                if attempt == ATTEMPTS - 1:
                    raise
            self.retried = True
            self.sleep(2 ** attempt)

    def _send(self, method, params, body=None, prefer=None, rng=None):
        qs = urllib.parse.urlencode(params, safe='(),."*', quote_via=urllib.parse.quote)
        headers = {"apikey": self.key, "Authorization": "Bearer " + self.key,
                   "Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer
        if rng:
            headers["Range-Unit"], headers["Range"] = "items", rng
        req = urllib.request.Request(self.base + "?" + qs, method=method, headers=headers,
                                     data=None if body is None else json.dumps(body).encode())
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
        return json.loads(raw) if raw else []

    def candidates(self):
        """Every row whose title holds a lead mark, Range-paginated in id order (Rule 10b)."""
        marks = ",".join("course_title.like.*%s*" % m for m in LEAD_MARKS)
        params = {"select": ",".join(COLS), "or": "(" + marks + ")", "order": "id.asc"}
        out, start = [], 0
        while True:
            page = self._call("GET", params, rng=f"{start}-{start + PAGE - 1}")
            out.extend(page or [])
            if not page or len(page) < PAGE:
                return out
            start += PAGE

    def siblings(self, row):
        params = {"select": ",".join(COLS), "id": "neq.%d" % row["id"]}
        for c in KEY:
            params[c] = "is.null" if row.get(c) is None else "eq." + str(row[c])
        return self._call("GET", params)

    def remove(self, row):
        """Delete one row, guarded on its id and its title as read. Returns what was deleted."""
        got = self._call("DELETE", {"id": "eq.%d" % row["id"],
                                    "course_title": "eq." + row["course_title"]},
                         prefer="return=representation")
        if not got and self.retried:
            # A retried delete that finds nothing may mean the first attempt removed the row
            # and its response was lost. The row's absence by id is the evidence.
            if not self._call("GET", {"select": "id", "id": "eq.%d" % row["id"]}):
                return [dict(row)]
        return got

    def present(self, row):
        """Rows already holding this image's id, or its unique key."""
        by_id = self._call("GET", {"select": "id", "id": "eq.%d" % row["id"]})
        params = {"select": "id", "course_title": "eq." + row["course_title"]}
        for c in KEY:
            params[c] = "is.null" if row.get(c) is None else "eq." + str(row[c])
        return by_id + self._call("GET", params)

    def insert(self, rows):
        return self._call("POST", {}, rows, prefer="return=representation")


def words(title):
    """The title's letters and digits, in order. Mojibake and its repair differ only between them."""
    return " ".join(re.findall(r"[A-Za-z0-9]+", title or ""))


def garbled(title):
    return bool(_MOJI_RE.search(title or ""))


def judge(row, sibs):
    """(twin, None) when the row is a stale twin to remove, else (None, the reason it stays)."""
    if not garbled(row.get("course_title")):
        return None, "carries no mojibake marks"
    if len(sibs) != 1:
        return None, "%d siblings on (college, subject, course_number), not one" % len(sibs)
    twin = sibs[0]
    if garbled(twin.get("course_title")):
        return None, "its sibling %s is garbled too" % twin.get("id")
    if words(twin.get("course_title")) != words(row.get("course_title")):
        return None, "its sibling %s carries different words" % twin.get("id")
    diff = [c for c in SAME if row.get(c) != twin.get(c)]
    if diff:
        return None, "its sibling %s differs on %s" % (twin.get("id"), ", ".join(diff))
    return twin, None


def fingerprint(ids):
    """The same figures the plan records; the sha256 matches Postgres's
    encode(sha256(convert_to(string_agg(id::text, ',' order by id), 'UTF8')), 'hex')."""
    ids = sorted(int(i) for i in ids)
    return {"count": len(ids), "id_sum": sum(ids),
            "id_min": ids[0] if ids else None, "id_max": ids[-1] if ids else None,
            "ids_sha256": hashlib.sha256(",".join(map(str, ids)).encode("utf-8")).hexdigest()}


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def fresh_path(plan_dir, prefix, stamp):
    """A receipt name no earlier run used; a receipt is never overwritten by another run."""
    base = os.path.join(plan_dir, f"{prefix}_{stamp.replace(':', '').replace('+0000', 'Z')}")
    path, n = base + ".json", 1
    while os.path.exists(path):
        n += 1
        path = f"{base}_{n}.json"
    return path


def write_json(path, obj):
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, indent=1, ensure_ascii=False)
        fh.write("\n")


def load_plan(plan_dir):
    plan = json.load(open(os.path.join(plan_dir, "plan.json"), encoding="utf-8"))
    exp = plan.get("expected") or {}
    missing = [k for k in ("count", "id_sum", "id_min", "id_max", "ids_sha256") if k not in exp]
    if plan.get("table") != TABLE or missing:
        sys.exit("REFUSED: plan.json must name %s and carry the expected fingerprint (missing: %s)"
                 % (TABLE, ", ".join(missing) or "none"))
    return plan


def survey(rest):
    """Read, then sort every candidate into (removable pairs, held rows with reasons)."""
    keep, held = [], []
    for row in rest.candidates():
        if not garbled(row.get("course_title")):
            continue
        twin, why = judge(row, rest.siblings(row))
        if twin is not None:
            keep.append((row, twin))
        else:
            held.append((row, why))
    return keep, held


def commit(rest, plan_dir, keep, stamp, plan):
    """Write the receipt, then remove each row under its guard; the receipt records the outcome."""
    path = fresh_path(plan_dir, "removed", stamp)
    receipt = {
        "_about": "Full row images of every chatbox_college_courses row this run removed, written "
                  "before the first removal; --rollback re-inserts them.",
        "table": TABLE, "at": stamp, "verdict": plan.get("verdict"), "status": "intended",
        "rows": [dict({c: row.get(c) for c in COLS}, twin_id=twin.get("id")) for row, twin in keep],
    }
    write_json(path, receipt)
    removed, stayed = [], []
    for row, _twin in keep:
        got = rest.remove(row)
        if len(got) == 1 and got[0].get("id") == row["id"]:
            removed.append(row["id"])
        else:
            stayed.append(row["id"])
    receipt.update(status="applied", removed_ids=sorted(removed), not_removed_ids=sorted(stayed),
                   counts={"intended": len(keep), "removed": len(removed), "not_removed": len(stayed)})
    write_json(path, receipt)
    return path, removed, stayed


def rollback(rest, plan_dir, stamp):
    """Re-insert every receipt's removed rows that are not back already."""
    done = {"reinserted": 0, "already_present": 0}
    for path in sorted(glob.glob(os.path.join(plan_dir, "removed_*.json")), reverse=True):
        receipt = json.load(open(path, encoding="utf-8"))
        gone = set(receipt.get("removed_ids") or [r["id"] for r in receipt["rows"]])
        todo = []
        for img in receipt["rows"]:
            if img["id"] not in gone:
                continue
            row = {c: img.get(c) for c in COLS}
            if rest.present(row):
                done["already_present"] += 1
            else:
                todo.append(row)
        for i in range(0, len(todo), INSERT_CHUNK):
            done["reinserted"] += len(rest.insert(todo[i:i + INSERT_CHUNK]))
    out = fresh_path(plan_dir, "rolled_back", stamp)
    write_json(out, dict(done, table=TABLE, at=stamp))
    return done, out


def main(argv=None, rest=None, stamp=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("plan_dir")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--commit", action="store_true")
    g.add_argument("--rollback", action="store_true")
    a = ap.parse_args(argv)
    plan = load_plan(a.plan_dir)
    if rest is None:
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not key:
            sys.exit("Set SUPABASE_SERVICE_KEY (the workflow holds it).")
        rest = Rest(os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"), key)
    stamp = stamp or now_iso()
    if a.rollback:
        done, out = rollback(rest, a.plan_dir, stamp)
        print(json.dumps({"rollback": done, "receipt": out}))
        return 0
    keep, held = survey(rest)
    got = fingerprint(row["id"] for row, _ in keep)
    match = got == plan["expected"]
    summary = {"mode": "commit" if a.commit else "dry-run", "at": stamp, "plan_dir": a.plan_dir,
               "removable": len(keep), "held": len(held), "fingerprint": got,
               "matches_plan": match}
    print(json.dumps(summary, indent=1))
    for row, why in held:
        print("  held: %s %r: %s" % (row["id"], row.get("course_title"), why))
    if not match:
        print("REFUSED: the removable set differs from the reviewed plan (expected %s). Re-measure "
              "and review a new plan before any write." % json.dumps(plan["expected"]))
        return 2
    if not a.commit:
        return 0
    path, removed, stayed = commit(rest, a.plan_dir, keep, stamp, plan)
    print(json.dumps({"receipt": path, "removed": len(removed), "not_removed": stayed}))
    return 0 if not stayed else 1


if __name__ == "__main__":
    sys.exit(main())
