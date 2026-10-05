#!/usr/bin/env python3
"""Write a curator's ruled CER decisions into kb_curation: dry run, apply, or undo.

  python3 kb/_cer_decision_apply.py kb/cer_decisions_out/2026-10-02             # dry run: read, check, report
  python3 kb/_cer_decision_apply.py kb/cer_decisions_out/2026-10-02 --commit    # write; receipt applied_<ts>.json
  python3 kb/_cer_decision_apply.py kb/cer_decisions_out/2026-10-02 --rollback  # remove rows this cohort wrote

Sam's verdict, 2026-10-02 (open-asks sheet 19, card 1, "Write them for me"): twice a sheet came
back "Done" on a Credential Reference (CER) entry and nothing reached kb_curation, because the CER
was never opened. He had already ruled the substance (sheet 14). So a session writes the rows the
CER would have written, from a committed plan that names the ruling, and then runs
cred-rename-apply.yml, which reads them like any curator's.

Why a workflow carries it. The repo's Supabase guard denies a session's kb_curation INSERT, and
Sam ruled on 2026-09-27 that sessions run the writes rather than handing him SQL. So
.github/workflows/cer-decision-apply.yml runs this with the service key, as esl-sheet-apply.yml and
funding-config-edit-apply.yml carry theirs. Governance: workflow:cer-decision-apply.yml maps to
DR-07 (unified credential titles), kb/governance_surface_map.json.

Rule 10, enforced here rather than by recall:
  - only `_CREDENTIAL_REVIEW::` rows (title and agency fields) and `_UNCLASSIFIED::` rows (the
    issuer assignment), only under a `<lane>-s<N>@bot` cohort;
  - a fresh read at write time of every (course_id, field) the plan touches. A row already there
    with another value is a curator's newer word: it is HELD, and nothing is written;
  - a pending unified_title_merge_confirm that names a plan row's source title as its target
    holds that row (a rename whose key is a pending merge target fights the curator);
  - the INSERT ignores duplicates on (course_id, field), so a row a curator adds between the read
    and the write wins;
  - the receipt is written BEFORE the INSERT; --rollback deletes only rows still carrying this
    cohort's reviewer_email and the value it wrote. Once cred-rename-apply has consumed an
    override, the rename's own alias map is the record (kb/cred_rename_out/<date>/).
  - a REPLACE is a guarded UPDATE, and only where the plan says so (Rule 10a): a row carrying
    `replaces: {value, reviewer_email}` names the live row it supersedes, and the ruling that lets
    it. It changes only while that row still holds exactly that value from that reviewer; anything
    else holds the plan. The receipt keeps the before-value, reviewer and date, and --rollback
    puts them back on rows that still carry this cohort and the value it wrote (Rule 10a2).

S333 (Sam, open-asks sheet 39 card 2, "name"): the agency fields and the replace path, so OSHA's
one name as issuer can land on rows a curator wrote earlier. kb/_apply_credential_review.py and
kb/_fold_unclassified.py only ever ADD an issuer to kb/credentials.json, so a changed issuer also
needs the file itself edited in the same pull request; the rows keep the sync from adding the old
name back.

Env: SUPABASE_URL (default the project URL), SUPABASE_SERVICE_KEY (the workflow holds it).
"""
import argparse
import datetime
import glob
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

TABLE = "kb_curation"
PREFIX = "_CREDENTIAL_REVIEW::"
UNCLASSIFIED = "_UNCLASSIFIED::"
FIELDS_BY_PREFIX = {
    PREFIX: {"unified_title_override", "unified_title_merge_confirm",
             "issuing_agency_override", "training_agency_override"},
    UNCLASSIFIED: {"issuing_agency_assignment"},
}
TITLE_FIELDS = {"unified_title_override", "unified_title_merge_confirm"}
COHORT_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*-s\d+@bot$")
ATTEMPTS = 5
TRANSIENT_HTTP = {429, 500, 502, 503, 504}


class Rest:
    """The PostgREST calls this script makes, against kb_curation only."""

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

    def rows_for(self, course_id):
        return self._call("GET", {"select": "course_id,field,value,reviewer_email,reviewed_at",
                                  "course_id": "eq." + course_id})

    def merge_confirms(self):
        return self._call("GET", {"select": "course_id,field,value,reviewer_email,reviewed_at",
                                  "course_id": "like." + PREFIX + "*",
                                  "field": "eq.unified_title_merge_confirm"})

    def insert(self, rows):
        return self._call("POST", {"on_conflict": "course_id,field"}, rows,
                          prefer="resolution=ignore-duplicates,return=representation")

    def replace(self, course_id, field, old_value, old_email, body):
        """Guarded UPDATE: changes the row only while it still holds old_value from old_email."""
        return self._call("PATCH", {"course_id": "eq." + course_id, "field": "eq." + field,
                                    "value": "eq." + old_value, "reviewer_email": "eq." + old_email},
                          body, prefer="return=representation")

    def delete(self, row, cohort):
        return self._call("DELETE", {"course_id": "eq." + row["course_id"], "field": "eq." + row["field"],
                                     "value": "eq." + row["value"], "reviewer_email": "eq." + cohort},
                          prefer="return=representation")


def load_plan(plan_dir):
    with open(os.path.join(plan_dir, "plan.json"), encoding="utf-8") as fh:
        plan = json.load(fh)
    rows = plan.get("rows") or []
    if not plan.get("ruling") or not plan.get("cohort") or not rows:
        raise SystemExit("plan.json needs ruling, cohort and at least one row")
    if not COHORT_RE.match(plan["cohort"]):
        raise SystemExit("cohort must be <lane>-s<N>@bot, got %r" % plan["cohort"])
    seen = set()
    for r in rows:
        cid, field, value = r.get("course_id"), r.get("field"), r.get("value")
        pre = next((x for x in FIELDS_BY_PREFIX if isinstance(cid, str) and cid.startswith(x)
                    and len(cid) > len(x)), None)
        if pre is None:
            raise SystemExit("every course_id is a %s key: %r" % (" or ".join(FIELDS_BY_PREFIX), cid))
        if field not in FIELDS_BY_PREFIX[pre]:
            raise SystemExit("a %s field must be one of %s: %r" % (pre, sorted(FIELDS_BY_PREFIX[pre]), field))
        rp = r.get("replaces")
        if rp is not None and not (isinstance(rp, dict) and isinstance(rp.get("value"), str)
                                   and rp["value"].strip() and isinstance(rp.get("reviewer_email"), str)
                                   and rp["reviewer_email"].strip() and rp["value"] != value):
            raise SystemExit("replaces names the live row's value and reviewer_email, and differs "
                             "from the new value: %r" % r)
        if not (isinstance(value, str) and value.strip()):
            raise SystemExit("every row carries a non-empty value: %r" % r)
        if (cid, field) in seen:
            raise SystemExit("a (course_id, field) appears twice: %r" % ((cid, field),))
        seen.add((cid, field))
        if field == "unified_title_merge_confirm":
            override = [x for x in rows if x["course_id"] == cid and x["field"] == "unified_title_override"]
            if not override or override[0]["value"] != value:
                raise SystemExit("a merge confirm must name the same target as its title override: %r" % cid)
    return plan


def check(plan, rest):
    """Each plan row's state against a fresh read: write, written, or held (with why)."""
    live = {}
    for cid in sorted({r["course_id"] for r in plan["rows"]}):
        for x in rest.rows_for(cid) or []:
            live[(x["course_id"], x["field"])] = x
    confirms = rest.merge_confirms() or []
    out = []
    for r in plan["rows"]:
        now = live.get((r["course_id"], r["field"]))
        rp = r.get("replaces")
        source = r["course_id"][len(PREFIX):]
        fights = [c for c in confirms if c.get("value") == source and c.get("course_id") != r["course_id"]] \
            if r["field"] in TITLE_FIELDS else []
        if rp and now is not None and now.get("value") == rp["value"] \
                and now.get("reviewer_email") == rp["reviewer_email"]:
            state, why = "replace", "replaces %r (by %s), as the ruling says" % (rp["value"], rp["reviewer_email"])
        elif rp and now is None:
            state, why = "held", "the row it replaces (%r by %s) is gone" % (rp["value"], rp["reviewer_email"])
        elif now is None:
            state, why = ("held", "a pending merge confirm on %s names this source" % fights[0]["course_id"]) \
                if fights else ("write", "")
        elif now.get("value") == r["value"]:
            state, why = "written", "already holds this value (by %s)" % now.get("reviewer_email")
        else:
            state, why = "held", "holds %r (by %s); a curator's word wins" % (now.get("value"),
                                                                            now.get("reviewer_email"))
        out.append({"course_id": r["course_id"], "field": r["field"], "value": r["value"],
                    "state": state, "why": why,
                    "live": None if now is None else {k: now.get(k) for k in ("value", "reviewer_email",
                                                                              "reviewed_at")}})
    return out


def stamp():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")


def write_receipt(plan_dir, name, body):
    with open(os.path.join(plan_dir, name), "w", encoding="utf-8") as fh:
        json.dump(body, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def run(plan_dir, mode, rest, out=print):
    plan = load_plan(plan_dir)
    if mode == "rollback":
        receipts = sorted(glob.glob(os.path.join(plan_dir, "applied_*.json")))
        written, replaced = [], []
        for p in receipts:
            with open(p, encoding="utf-8") as fh:
                rec = json.load(fh)
            written.extend(rec.get("inserted") or [])
            replaced.extend(rec.get("replaced") or [])
        if not written and not replaced:
            out("nothing to roll back: no receipt records an insert or a replace")
            return 0
        ts = stamp()
        removed, gone, restored, moved = [], [], [], []
        for r in written:
            got = rest.delete(r, plan["cohort"])
            (removed if got else gone).append({k: r[k] for k in ("course_id", "field", "value")})
        for r in replaced:
            b = r["before"]
            got = rest.replace(r["course_id"], r["field"], r["value"], plan["cohort"],
                               {"value": b["value"], "reviewer_email": b["reviewer_email"],
                                "reviewed_at": b.get("reviewed_at")})
            (restored if got else moved).append({k: r[k] for k in ("course_id", "field", "value")})
        write_receipt(plan_dir, "rolled_back_%s.json" % ts,
                      {"table": TABLE, "mode": "rollback", "at": ts, "cohort": plan["cohort"],
                       "removed": removed, "already_gone": gone,
                       "restored": restored, "changed_since": moved})
        out("rollback: %d removed, %d already gone (consumed by the rename, or changed by a curator); "
            "%d restored to the curator's value, %d changed since"
            % (len(removed), len(gone), len(restored), len(moved)))
        return 0

    states = check(plan, rest)
    for s in states:
        out("  %-8s %s | %s = %r%s" % (s["state"], s["course_id"], s["field"], s["value"],
                                        (" -- " + s["why"]) if s["why"] else ""))
    held = [s for s in states if s["state"] == "held"]
    todo = [s for s in states if s["state"] == "write"]
    swaps = [s for s in states if s["state"] == "replace"]
    if mode == "dry-run":
        out("dry run: %d to write, %d to replace, %d already written, %d held; nothing written"
            % (len(todo), len(swaps), sum(s["state"] == "written" for s in states), len(held)))
        return 1 if held else 0

    if mode != "commit":
        raise SystemExit("mode must be dry-run, commit or rollback")
    if held:
        out("REFUSED: %d row(s) held; nothing written" % len(held))
        return 1
    if not todo and not swaps:
        out("nothing to write: every row already holds its value")
        return 0
    ts = stamp()
    name = "applied_%s.json" % ts
    rows = [{"course_id": s["course_id"], "field": s["field"], "value": s["value"],
             "reviewer_email": plan["cohort"]} for s in todo]
    planned_swaps = [{"course_id": s["course_id"], "field": s["field"], "value": s["value"],
                      "reviewer_email": plan["cohort"], "before": s["live"]} for s in swaps]
    receipt = {"table": TABLE, "mode": "commit", "at": ts, "ruling": plan["ruling"],
               "cohort": plan["cohort"], "read": states, "rows": rows, "replaces": planned_swaps,
               "result": "pending"}
    write_receipt(plan_dir, name, receipt)
    got = (rest.insert(rows) or []) if rows else []
    keys = {(g.get("course_id"), g.get("field")) for g in got}
    receipt["inserted"] = [r for r in rows if (r["course_id"], r["field"]) in keys]
    receipt["skipped_as_duplicate"] = [r for r in rows if (r["course_id"], r["field"]) not in keys]
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    receipt["replaced"], receipt["replace_missed"] = [], []
    for sw in planned_swaps:
        b = sw["before"]
        got = rest.replace(sw["course_id"], sw["field"], b["value"], b["reviewer_email"],
                           {"value": sw["value"], "reviewer_email": plan["cohort"], "reviewed_at": now_iso})
        (receipt["replaced"] if got else receipt["replace_missed"]).append(sw)
    after = check(plan, rest)
    ok = all(s["state"] == "written" for s in after)
    receipt["read_back"] = after
    receipt["result"] = "written" if ok else "written, but the read-back differs"
    write_receipt(plan_dir, name, receipt)
    out("%s: %d inserted, %d skipped as duplicate, %d replaced, %d replace missed; receipt %s"
        % (receipt["result"], len(receipt["inserted"]), len(receipt["skipped_as_duplicate"]),
           len(receipt["replaced"]), len(receipt["replace_missed"]), name))
    return 0 if ok else 1


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
