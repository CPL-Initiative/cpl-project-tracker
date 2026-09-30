#!/usr/bin/env python3
"""Write reviewed edits into the stored funding config: dry run, apply, or undo.

  python3 kb/_funding_config_edit_apply.py kb/funding_config_edits_out/2026-09-29             # dry run: read, check, report
  python3 kb/_funding_config_edit_apply.py kb/funding_config_edits_out/2026-09-29 --commit    # write; receipt applied_<ts>.json
  python3 kb/_funding_config_edit_apply.py kb/funding_config_edits_out/2026-09-29 --rollback  # restore every before-value still unchanged

Sam's verdict, 2026-09-29 (open-asks sheet 3, card 7, "Write both for me"): a session writes the
two saved texts that still carry words he has retired, in both scenarios, with a receipt of the
old text. Curators edit this config through the tab; a session writes it only where a reviewed
plan names the exact paths, and the plan's `ruling` names who said yes.

Why a workflow carries it. The repo's Supabase guard (scripts/supabase_sql_guard.py) denies a
session's UPDATE, and Sam ruled on 2026-09-27 that sessions run the writes rather than handing him
SQL. So .github/workflows/funding-config-edit-apply.yml runs this with the service key, the way
course-title-cleanup-apply.yml and esl-sheet-apply.yml carry theirs.

Rule 10, enforced here rather than by recall:
  - plan.json lists each edit as a path into `config`, the value the reviewed read found there
    (`before`) and the value to write (`after`). At write time the applier reads the row afresh
    and REFUSES to write anything unless every path still holds its `before`: a value that moved
    was never reviewed, and a curator's newer words always win.
  - The write is one PATCH of the whole `config`, rebuilt from that fresh read, filtered on the
    `updated_at` the read returned. A save by anyone between the read and the write matches no
    row, and nothing is written. The table's trigger stamps a new `updated_at`, so an open tab
    window refuses its next stale save and reloads (a window saves only over the version it read).
  - The receipt is written BEFORE the PATCH and carries every path's before-value and the row's
    `updated_at` and `updated_by` as read (docs/reference/data_write_rollback.md: a guarded
    UPDATE's receipt captures the before-values). --rollback restores a path only while it still
    holds the value this write left; a path a curator has touched since is held out and listed.

Env: SUPABASE_URL (default the project URL), SUPABASE_SERVICE_KEY (the workflow holds it).
"""
import argparse
import copy
import datetime
import glob
import hashlib
import http.client
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TABLE = "cpl_funding_config"
ATTEMPTS = 5
TRANSIENT_HTTP = {429, 500, 502, 503, 504}


class Rest:
    """The PostgREST calls this script makes, against cpl_funding_config only."""

    def __init__(self, url, key, sleep=time.sleep):
        self.base = url.rstrip("/") + "/rest/v1/" + TABLE
        self.key = key
        self.sleep = sleep

    def _call(self, method, params, body=None, prefer=None):
        for attempt in range(ATTEMPTS):
            try:
                return self._send(method, params, body, prefer)
            except urllib.error.HTTPError as e:
                if e.code not in TRANSIENT_HTTP or attempt == ATTEMPTS - 1:
                    raise
            except (urllib.error.URLError, http.client.HTTPException, ConnectionError,
                    socket.timeout, TimeoutError):
                if attempt == ATTEMPTS - 1:
                    raise
            self.sleep(2 ** attempt)

    def _send(self, method, params, body=None, prefer=None):
        qs = urllib.parse.urlencode(params, safe='(),."*', quote_via=urllib.parse.quote)
        headers = {"apikey": self.key, "Authorization": "Bearer " + self.key,
                   "Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer
        req = urllib.request.Request(self.base + "?" + qs, method=method, headers=headers,
                                     data=None if body is None else json.dumps(body).encode())
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
        return json.loads(raw) if raw else []

    def read(self, row_id):
        rows = self._call("GET", {"select": "id,config,updated_at,updated_by", "id": "eq." + row_id})
        return rows[0] if rows else None

    def write(self, row_id, updated_at, config, updated_by):
        """One PATCH, filtered on the updated_at the fresh read returned. Returns the rows written."""
        return self._call("PATCH", {"id": "eq." + row_id, "updated_at": "eq." + updated_at},
                          body={"config": config, "updated_by": updated_by},
                          prefer="return=representation")


MISSING = object()


def get_path(doc, path):
    cur = doc
    for step in path:
        if isinstance(step, int):
            if not isinstance(cur, list) or not -len(cur) <= step < len(cur):
                return MISSING
            cur = cur[step]
        else:
            if not isinstance(cur, dict) or step not in cur:
                return MISSING
            cur = cur[step]
    return cur


def set_path(doc, path, value, create=False):
    """Set an EXISTING path. A path that does not exist is a plan error, never a new key,
    unless the edit says `"create": true` (below): then only the LAST key may be new, its
    parent must already exist, and the reviewed before-value is null."""
    cur = doc
    for step in path[:-1]:
        cur = cur[step]
    last = path[-1]
    if isinstance(last, int):
        cur[last] = value
    else:
        if last not in cur and not create:
            raise KeyError(last)
        cur[last] = value


def del_path(doc, path):
    """Remove the last key of a path (a created key, on rollback)."""
    cur = doc
    for step in path[:-1]:
        cur = cur[step]
    del cur[path[-1]]


def fingerprint(config):
    return hashlib.sha256(json.dumps(config, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def load_plan(plan_dir):
    with open(os.path.join(plan_dir, "plan.json"), encoding="utf-8") as fh:
        plan = json.load(fh)
    edits = plan.get("edits") or []
    if not plan.get("row_id") or not plan.get("ruling") or not plan.get("cohort") or not edits:
        raise SystemExit("plan.json needs row_id, ruling, cohort and at least one edit")
    for e in edits:
        if not isinstance(e.get("path"), list) or "before" not in e or "after" not in e:
            raise SystemExit("every edit needs path (a list), before and after")
        if e["before"] == e["after"]:
            raise SystemExit("an edit whose before equals its after changes nothing: %s" % e["path"])
        # ⚠️ A NEW KEY IS DECLARED, NEVER INFERRED (sheet 4, card 7, 2026-09-30). A path
        # that does not exist stays a plan error, so a typo cannot add a key; a plan that
        # means to add one says `"create": true` and reviews `before` as null.
        if e.get("create") and (e["before"] is not None or isinstance(e["path"][-1], int)):
            raise SystemExit("a create edit reviews before as null and names a key, not an index: %s"
                             % e["path"])
    return plan


def check(plan, row):
    """Each edit's state against the fresh read: before, after, or moved."""
    out = []
    for e in plan["edits"]:
        now = get_path(row["config"], e["path"])
        if e.get("create"):
            # Absent is the reviewed state for a key the plan creates.
            state = ("before" if now is MISSING else "after" if now == e["after"] else "moved")
            out.append({"path": e["path"], "state": state, "live": None if now is MISSING else now})
            continue
        state = ("before" if now == e["before"] else
                 "after" if now == e["after"] else "moved")
        out.append({"path": e["path"], "state": state,
                    "live": None if now is MISSING else now})
    return out


def stamp():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")


def write_receipt(plan_dir, name, body):
    path = os.path.join(plan_dir, name)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    return path


def run(plan_dir, mode, rest, out=print):
    plan = load_plan(plan_dir)
    row = rest.read(plan["row_id"])
    if row is None:
        out("REFUSED: no %s row with id %r" % (TABLE, plan["row_id"]))
        return 1
    states = check(plan, row)
    out("%s, row %r, updated_at %s by %s" % (TABLE, row["id"], row["updated_at"], row.get("updated_by")))
    for s in states:
        out("  %-6s %s" % (s["state"], "/".join(str(p) for p in s["path"])))

    if mode == "dry-run":
        moved = [s for s in states if s["state"] == "moved"]
        out("dry run: %d at before, %d already at after, %d moved; nothing written"
            % (sum(s["state"] == "before" for s in states),
               sum(s["state"] == "after" for s in states), len(moved)))
        return 1 if moved else 0

    if mode == "commit":
        if any(s["state"] != "before" for s in states):
            out("REFUSED: every path must still hold its reviewed before-value; nothing written")
            return 1
        new = copy.deepcopy(row["config"])
        for e in plan["edits"]:
            set_path(new, e["path"], e["after"], create=bool(e.get("create")))
        ts = stamp()
        receipt = {
            "table": TABLE, "row_id": row["id"], "mode": "commit", "at": ts,
            "ruling": plan["ruling"], "cohort": plan["cohort"],
            "read": {"updated_at": row["updated_at"], "updated_by": row.get("updated_by"),
                     "config_sha256": fingerprint(row["config"])},
            "edits": [dict({"path": e["path"], "before": e["before"], "after": e["after"]},
                           **({"create": True} if e.get("create") else {}))
                      for e in plan["edits"]],
            "result": "pending",
        }
        name = "applied_%s.json" % ts
        write_receipt(plan_dir, name, receipt)
        written = rest.write(row["id"], row["updated_at"], new, plan["cohort"])
        if not written:
            receipt["result"] = "no row matched: the config was saved after the read; nothing written"
            write_receipt(plan_dir, name, receipt)
            out("REFUSED at write: " + receipt["result"])
            return 1
        after = rest.read(row["id"])
        states_after = check(plan, after)
        ok = all(s["state"] == "after" for s in states_after)
        receipt["result"] = "written" if ok else "written, but the read-back differs"
        receipt["written"] = {"updated_at": after["updated_at"], "updated_by": after.get("updated_by"),
                              "config_sha256": fingerprint(after["config"])}
        receipt["read_back"] = states_after
        write_receipt(plan_dir, name, receipt)
        out("%s: %d path(s); updated_at %s -> %s; receipt %s"
            % (receipt["result"], len(plan["edits"]), row["updated_at"], after["updated_at"], name))
        return 0 if ok else 1

    if mode == "rollback":
        receipts = sorted(glob.glob(os.path.join(plan_dir, "applied_*.json")))
        applied = []
        for p in receipts:
            with open(p, encoding="utf-8") as fh:
                r = json.load(fh)
            if r.get("result", "").startswith("written"):
                applied.extend(r["edits"])
        if not applied:
            out("nothing to roll back: no receipt records a write")
            return 0
        new = copy.deepcopy(row["config"])
        restored, held = [], []
        for e in applied:
            now = get_path(row["config"], e["path"])
            if now == e["after"]:
                if e.get("create"):
                    del_path(new, e["path"])       # a created key goes, rather than reading null
                else:
                    set_path(new, e["path"], e["before"])
                restored.append(e)
            else:
                held.append({"path": e["path"], "live": None if now is MISSING else now})
        ts = stamp()
        receipt = {"table": TABLE, "row_id": row["id"], "mode": "rollback", "at": ts,
                   "cohort": plan["cohort"].replace("@", "-rollback@", 1),
                   "read": {"updated_at": row["updated_at"], "updated_by": row.get("updated_by"),
                            "config_sha256": fingerprint(row["config"])},
                   "restored": restored, "held_out": held, "result": "pending"}
        name = "rolled_back_%s.json" % ts
        write_receipt(plan_dir, name, receipt)
        if restored:
            written = rest.write(row["id"], row["updated_at"], new, receipt["cohort"])
            receipt["result"] = ("restored" if written else
                                 "no row matched: the config was saved after the read; nothing written")
        else:
            receipt["result"] = "nothing restored: every path has moved since the write"
        write_receipt(plan_dir, name, receipt)
        out("rollback: %d restored, %d held out (a curator changed them); %s"
            % (len(restored), len(held), receipt["result"]))
        return 0 if receipt["result"] in ("restored", "nothing restored: every path has moved since the write") else 1

    raise SystemExit("mode must be dry-run, commit or rollback")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("plan_dir")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--commit", action="store_true")
    g.add_argument("--rollback", action="store_true")
    a = ap.parse_args()
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_KEY is not set (the workflow holds it)")
    rest = Rest(os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"), key)
    mode = "commit" if a.commit else "rollback" if a.rollback else "dry-run"
    return run(a.plan_dir, mode, rest)


if __name__ == "__main__":
    sys.exit(main())
