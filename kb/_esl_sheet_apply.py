#!/usr/bin/env python3
"""Carry an ESL decision sheet's data changes into kb_curation: dry run, apply, or undo.

  python3 kb/_esl_sheet_apply.py kb/esl_sheet_out/2026-09-26              # dry run: read, check, report
  python3 kb/_esl_sheet_apply.py kb/esl_sheet_out/2026-09-26 --commit     # write; receipt applied_<ts>.json
  python3 kb/_esl_sheet_apply.py kb/esl_sheet_out/2026-09-26 --rollback   # undo every applied_<ts>.json

Sam, 2026-09-27, on being handed these changes as SQL to run in the Supabase editor: "Why do I
need to run the apply.sql process in supabase? It's not feasible for me to run one-off procedures
like this..." His verdict on a decision sheet is the decision, and the session carries the write
through .github/workflows/esl-sheet-apply.yml, which holds the service key (the cred-rename-apply
pattern). The plan is the committed plan.json that kb/_esl_sheet_apply_build.py wrote beside the
SQL; the SQL files stay as the human-readable record of the same change.

Rule 10, enforced here rather than by recall:
  - a fresh read at write time of every row the plan touches, and of every pending
    unified_title_merge_confirm row naming a touched id or target; a pending confirm holds the id;
  - a curator's merge row (a reviewer_email not ending @bot) holds the id;
  - an UPDATE is guarded on the row's value AND cohort as the build read them, so a row moved
    since is left alone and reported held;
  - an INSERT ignores duplicates on the (course_id, field) key, so a row a curator added first wins;
  - the DELETE is guarded on value and cohort;
  - only merge_into rows, and only under an esl-<step>-s<N>@bot cohort;
  - each commit run writes its own receipt with every row's before-values, and --rollback restores
    from the receipts, newest first, touching only rows still as the apply left them.

Env: SUPABASE_URL (default the project URL), SUPABASE_SERVICE_KEY (commit and rollback; a dry run
reads with it too, since kb_curation is not public).
"""
import argparse
import datetime
import glob
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

FIELD = "merge_into"
COHORT_RE = re.compile(r"^esl-[a-z]+-s\d+@bot$")
PAGE = 1000


class Rest:
    """The four PostgREST calls this script makes, against kb_curation only."""

    def __init__(self, url, key):
        self.base = url.rstrip("/") + "/rest/v1/kb_curation"
        self.key = key

    def _call(self, method, params, body=None, prefer=None, rng=None):
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

    def select(self, params):
        """Range-paginated read in a stable order (Rule 10b)."""
        out, start = [], 0
        params = dict(params, order="course_id.asc,field.asc")
        while True:
            page = self._call("GET", params, rng=f"{start}-{start + PAGE - 1}")
            out.extend(page or [])
            if not page or len(page) < PAGE:
                return out
            start += PAGE

    def patch(self, params, body):
        return self._call("PATCH", params, body, prefer="return=representation")

    def insert(self, rows):
        return self._call("POST", {"on_conflict": "course_id,field"}, rows,
                          prefer="resolution=ignore-duplicates,return=representation")

    def delete(self, params):
        return self._call("DELETE", params, prefer="return=representation")


def in_list(values):
    return "in.(" + ",".join('"' + v.replace('"', '\\"') + '"' for v in sorted(set(values))) + ")"


def fresh_path(plan_dir, prefix, stamp):
    """A receipt name no earlier run used: a receipt is never overwritten, because a later run's
    before-values are the earlier run's after-values and would undo nothing."""
    base = os.path.join(plan_dir, f"{prefix}_{stamp.replace(':', '').replace('+0000', 'Z')}")
    path, n = base + ".json", 1
    while os.path.exists(path):
        n += 1
        path = f"{base}_{n}.json"
    return path


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def load_plan(plan_dir):
    plan = json.load(open(os.path.join(plan_dir, "plan.json"), encoding="utf-8"))
    ups, ins, dels = plan.get("updates") or [], plan.get("inserts") or [], plan.get("deletes") or []
    for u in ups + ins:
        if not COHORT_RE.match(u.get("cohort") or ""):
            sys.exit(f"REFUSED: {u.get('id')} names cohort {u.get('cohort')!r}; only esl-<step>-s<N>@bot writes here")
    for d in dels:
        if not str(d.get("reviewer") or "").endswith("@bot"):
            sys.exit(f"REFUSED: the delete on {d.get('id')} would remove a curator's row")
    return ups, ins, dels


def live_state(rest, ups, ins, dels):
    ids = {u["id"] for u in ups} | {i["id"] for i in ins} | {d["id"] for d in dels}
    targets = {u["to"] for u in ups} | {i["to"] for i in ins}
    rows = rest.select({"select": "course_id,field,value,reviewer_email,reviewed_at",
                        "course_id": in_list(ids), "field": "eq." + FIELD})
    merge = {r["course_id"]: r for r in rows}
    touched = in_list(ids | targets)
    pend = rest.select({"select": "course_id,field,value,reviewer_email,reviewed_at",
                        "field": "eq.unified_title_merge_confirm",
                        "or": f"(course_id.{touched},value.{touched})"})
    pending = {p["course_id"] for p in pend} | {p["value"] for p in pend}
    return merge, pending


def human(row):
    return bool(row) and not str(row.get("reviewer_email") or "").endswith("@bot")


def decide(ups, ins, dels, merge, pending):
    """Each planned row, with what the live state allows: go, already, or held."""
    acts = []
    for u in ups:
        cur = merge.get(u["id"])
        a = dict(op="update", item=u.get("item"), id=u["id"], frm=u["from"], to=u["to"],
                 cohort=u["cohort"], guard_reviewer=u["before_reviewer"], before=cur)
        if u["id"] in pending or u["to"] in pending:
            a.update(state="held", why="a pending unified_title_merge_confirm names it")
        elif cur and cur["value"] == u["to"] and cur["reviewer_email"] == u["cohort"]:
            a.update(state="already", why="already applied")
        elif human(cur):
            a.update(state="held", why="a curator's merge row sits on it: " + cur["reviewer_email"])
        elif not cur or cur["value"] != u["from"] or cur["reviewer_email"] != u["before_reviewer"]:
            a.update(state="held", why="moved since the build read (live: %s)" %
                     (cur and f"{cur['value']} by {cur['reviewer_email']}"))
        else:
            a.update(state="go")
        acts.append(a)
    for i in ins:
        cur = merge.get(i["id"])
        a = dict(op="insert", item=i.get("item"), id=i["id"], to=i["to"], cohort=i["cohort"], before=cur)
        if i["id"] in pending or i["to"] in pending:
            a.update(state="held", why="a pending unified_title_merge_confirm names it")
        elif cur and cur["value"] == i["to"] and cur["reviewer_email"] == i["cohort"]:
            a.update(state="already", why="already applied")
        elif cur:
            a.update(state="held", why=f"already carries a merge row: {cur['value']} by {cur['reviewer_email']}")
        else:
            a.update(state="go")
        acts.append(a)
    for d in dels:
        cur = merge.get(d["id"])
        a = dict(op="delete", item=d.get("item", 9), id=d["id"], frm=d["value"], guard_reviewer=d["reviewer"],
                 before=cur)
        if not cur:
            a.update(state="already", why="already gone")
        elif cur["value"] != d["value"] or cur["reviewer_email"] != d["reviewer"]:
            a.update(state="held", why=f"changed since the build read (live: {cur['value']} by {cur['reviewer_email']})")
        else:
            a.update(state="go")
        acts.append(a)
    return acts


def execute(rest, acts, stamp):
    for a in acts:
        if a["state"] != "go":
            continue
        try:
            if a["op"] == "update":
                got = rest.patch({"course_id": "eq." + a["id"], "field": "eq." + FIELD,
                                  "value": "eq." + a["frm"], "reviewer_email": "eq." + a["guard_reviewer"]},
                                 {"value": a["to"], "reviewer_email": a["cohort"], "reviewed_at": stamp})
            elif a["op"] == "insert":
                got = rest.insert([{"course_id": a["id"], "field": FIELD, "value": a["to"],
                                    "reviewer_email": a["cohort"], "reviewed_at": stamp}])
            else:
                got = rest.delete({"course_id": "eq." + a["id"], "field": "eq." + FIELD,
                                   "value": "eq." + a["frm"], "reviewer_email": "eq." + a["guard_reviewer"]})
            if len(got or []) == 1:
                a["state"] = "applied"
            else:
                a.update(state="held", why="the row changed between the read and the write; nothing written")
        except (urllib.error.URLError, OSError, ValueError) as e:
            a.update(state="failed", why=str(e)[:200])
    return acts


def cohort_counts(rest, cohorts):
    if not cohorts:
        return {}
    rows = rest.select({"select": "course_id,field,reviewer_email", "reviewer_email": in_list(cohorts)})
    out = {}
    for r in rows:
        out[r["reviewer_email"]] = out.get(r["reviewer_email"], 0) + 1
    return dict(sorted(out.items()))


def tally(acts):
    t = {}
    for a in acts:
        t.setdefault(a["state"], {}).setdefault(f"{a['op']} (item {a['item']})", 0)
        t[a["state"]][f"{a['op']} (item {a['item']})"] += 1
    return t


def rollback(rest, plan_dir, stamp):
    """Undo every commit receipt in the plan dir, newest first, touching only rows still as the
    apply left them; the reversal of a row a curator has since moved is held, never forced."""
    done = []
    for path in sorted(glob.glob(os.path.join(plan_dir, "applied_*.json")), key=os.path.getmtime, reverse=True):
        rec = json.load(open(path, encoding="utf-8"))
        for a in rec["rows"]:
            if a["state"] != "applied":
                continue
            b, r = a.get("before"), dict(op=a["op"], id=a["id"], receipt=os.path.basename(path))
            try:
                if a["op"] == "update":
                    got = rest.patch({"course_id": "eq." + a["id"], "field": "eq." + FIELD,
                                      "value": "eq." + a["to"], "reviewer_email": "eq." + a["cohort"]},
                                     {"value": b["value"], "reviewer_email": b["reviewer_email"],
                                      "reviewed_at": b["reviewed_at"]})
                elif a["op"] == "insert":
                    got = rest.delete({"course_id": "eq." + a["id"], "field": "eq." + FIELD,
                                       "value": "eq." + a["to"], "reviewer_email": "eq." + a["cohort"]})
                else:
                    got = rest.insert([{"course_id": b["course_id"], "field": FIELD, "value": b["value"],
                                        "reviewer_email": b["reviewer_email"], "reviewed_at": b["reviewed_at"]}])
                r["state"] = "restored" if len(got or []) == 1 else "held"
            except (urllib.error.URLError, OSError, ValueError) as e:
                r.update(state="failed", why=str(e)[:200])
            done.append(r)
    out = fresh_path(plan_dir, "rolledback", stamp)
    json.dump({"_about": "Rollback of this plan dir's commit receipts.", "at": stamp, "rows": done},
              open(out, "w", encoding="utf-8"), indent=1)
    return done, out


def main(argv=None, rest=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("plan_dir")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--commit", action="store_true")
    g.add_argument("--rollback", action="store_true")
    a = ap.parse_args(argv)
    if rest is None:
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not key:
            sys.exit("Set SUPABASE_SERVICE_KEY (the workflow holds it).")
        rest = Rest(os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"), key)
    stamp = now_iso()
    if a.rollback:
        done, out = rollback(rest, a.plan_dir, stamp)
        states = {}
        for r in done:
            states[r["state"]] = states.get(r["state"], 0) + 1
        print(json.dumps({"rollback": states, "receipt": out}))
        return 1 if states.get("failed") else 0
    ups, ins, dels = load_plan(a.plan_dir)
    merge, pending = live_state(rest, ups, ins, dels)
    acts = decide(ups, ins, dels, merge, pending)
    if a.commit:
        acts = execute(rest, acts, stamp)
    cohorts = sorted({x["cohort"] for x in acts if x.get("cohort")})
    summary = {"mode": "commit" if a.commit else "dry-run", "at": stamp, "plan_dir": a.plan_dir,
               "states": tally(acts), "cohort_counts": cohort_counts(rest, cohorts)}
    if a.commit:
        out = fresh_path(a.plan_dir, "applied", stamp)
        json.dump(dict(summary, _about="What this commit run wrote, with each row's before-values; "
                       "--rollback restores from it.", rows=acts),
                  open(out, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
        summary["receipt"] = out
    print(json.dumps(summary, indent=1))
    for x in acts:
        if x["state"] in ("held", "failed"):
            print(f"  {x['state']}: {x['op']} {x['id']} (item {x['item']}): {x.get('why')}")
    return 1 if any(x["state"] == "failed" for x in acts) else 0


if __name__ == "__main__":
    sys.exit(main())
