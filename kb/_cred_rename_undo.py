#!/usr/bin/env python3
"""Reverse one credential rename apply from its receipt in kb/cred_rename_out/<fold>/.

Why it exists: #3110 agreed on "undo instead of a gate" for the fold apply, and an undo has to work
before anything triggers the apply on its own. kb/_cred_rename_apply.py writes undo.json beside its
receipt: every value it changed, before and after, in kb/credentials.json (by key), kb/unified_titles.json
(by raw title) and kb/coci_articulations.json (by course_id + exhibit_id). This script puts each back, and with
them every saved value the apply re-pointed (repoint*.json, kb/_cred_rename_repoint.py) and the kb_curation rows
those copy (repoint_supabase_log*.json). A re-pointed value changed since is drift like any other.

  python3 kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-11            # dry run: what would change
  python3 kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-11 --apply    # kb_curation first, then the files
  python3 kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-11 --supabase-plan
        # write undo_supabase.sql, the same reversal as SQL for a person to run (Rule 10)

The fold's issuer decision lives in kb_curation as one issuer_resolution row per folded target (cohort
fold_issuer.COHORT, #3116). --apply (SUPABASE_SERVICE_KEY set) runs the kb_curation half FIRST: it deletes
the fold's resolution rows, so every reader, the browser's included, drops the fold at once, then moves
each moved row back, each guarded on the row the apply left. A row a person changed since is left as they
made it and reported (undo_supabase_log-<UTC>.json), never a stop; a network error stops before the
files. A rerun finishes a half-done undo: what is already back reads as "already". Then the files, and
undone.json beside the receipt, naming the fold's id, so the Python readers ignore the fold even if a
resolution row was left. Without the key, --apply refuses unless --json-only. The nightly enforces a resolution on credentials.json; the undo counts a
value the enforcement produced from the apply's own "after" as unchanged, never as drift.

Safety: a value that changed since the apply is drift, and the undo refuses the whole run unless --force,
which skips each drifted fold group WHOLE (a target and every title renamed or merged onto it); the SQL
plan leaves out the same groups' row moves, so the two halves agree. Undo the newest apply first.

The SQL plan: the same ops, each guarded on the row the apply left (value, reviewer_email and reviewed_at
for a moved row; the cohort and the written value for a resolution row), each in a block that raises a
notice when it matches nothing and lets the rest run.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _cred_rename_repoint as repoint  # noqa: E402
import fold_issuer  # noqa: E402

CREDENTIALS = os.path.join(HERE, "credentials.json")
UNIFIED_TITLES = os.path.join(HERE, "unified_titles.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _write(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


def resolutions_of(snapshot):
    """{target: resolution value} from the receipt's alias_map.json."""
    return {r["course_id"].split("::", 1)[1]: r["value"]
            for r in (snapshot or {}).get("resolution_rows") or [] if "::" in r.get("course_id", "")}


def _nightly_same(cur, after, resolution):
    """True when cur differs from the apply's after only by what the nightly's enforcement of this fold's
    resolution does: records naming the winner, a kept additional or a dropped issuer added, removed or
    respelled. Anything else (a person's edit, another issuer) is drift."""
    if not resolution or cur is None or after is None:
        return False
    n, c = fold_issuer.norm, fold_issuer.canonical_issuer
    touched = {n(c(x)) for x in (resolution.get("dropped") or []) + (resolution.get("kept_additional") or [])}
    if resolution.get("winner"):
        touched.add(n(c(resolution["winner"])))
    allowed = touched - {n(c(x)) for x in resolution.get("dropped") or []}

    def rest(recs):
        return sorted(json.dumps(r, sort_keys=True) for r in recs if n(c(r.get("issuing_agency"))) not in touched)
    if rest(cur) != rest(after):
        return False
    return all(n(c(r.get("issuing_agency"))) in allowed for r in cur if n(c(r.get("issuing_agency"))) in touched)


def plan_undo(undo, creds, ut, arts, resolutions=None, extra_drift_titles=()):
    """What the undo would do, without writing. Returns (changes, drift, skipped_groups). extra_drift_titles: titles
    whose fold group drifted elsewhere (a re-pointed saved value changed since the apply), so the group is held
    whole here too."""
    resolutions = resolutions or {}
    changes, drift = [], []
    for key, ba in sorted((undo.get("credentials") or {}).items()):
        cur = creds.get(key)
        if cur == ba.get("before"):
            continue  # already as it was
        after = ba.get("after")
        if cur != after and not _nightly_same(cur, after, resolutions.get(key)):
            drift.append({"file": "credentials.json", "key": key})
            continue
        changes.append({"file": "credentials.json", "key": key, "to": ba.get("before")})
    for raw, ba in sorted((undo.get("unified_titles") or {}).items()):
        cur = (ut.get(raw) or {}).get("unified_title")
        if cur == ba["before"]:
            continue
        if cur != ba["after"]:
            drift.append({"file": "unified_titles.json", "key": raw})
            continue
        changes.append({"file": "unified_titles.json", "key": raw, "to": ba["before"]})
    index = {}
    for i, r in enumerate(arts):
        index.setdefault((r.get("course_id"), r.get("exhibit_id"), r.get("exhibit_title")), []).append(i)
    used = set()
    for ch in undo.get("articulations") or []:
        k = (ch.get("course_id"), ch.get("exhibit_id"), ch.get("exhibit_title"))
        hit = next((i for i in index.get(k, []) if i not in used
                    and arts[i].get("unified_title") == ch["after"]), None)
        if hit is None:
            if any(arts[i].get("unified_title") == ch["before"] for i in index.get(k, [])):
                continue
            drift.append({"file": "coci_articulations.json", "key": "%s / %s" % k[:2], "after": ch["after"]})
            continue
        used.add(hit)
        changes.append({"file": "coci_articulations.json", "index": hit, "to": ch["before"], "after": ch["after"]})
    # A fold group undoes as one unit: if any of its values drifted, none of the group is put back, so
    # --force never splits a fold.
    group_of = {}
    for new, olds in (undo.get("groups") or {}).items():
        for t in [new] + list(olds):
            group_of[t] = new

    def group(c):
        if c["file"] == "credentials.json":
            return group_of.get(c["key"], c["key"])
        if c["file"] == "unified_titles.json":
            ba = (undo.get("unified_titles") or {}).get(c["key"]) or {}
            return group_of.get(ba.get("after"), ba.get("after"))
        return group_of.get(c.get("after"), c.get("after"))

    bad = {group(d) for d in drift} | {group_of.get(t, t) for t in extra_drift_titles or ()}
    held = [c for c in changes if group(c) in bad]
    changes = [c for c in changes if group(c) not in bad]
    for c in held:
        drift.append({"file": c["file"], "key": c.get("key", c.get("index")), "after": c.get("after"),
                      "held": "its fold group drifted"})
    skipped = {g for g in bad if g}
    members = {t for t, g in group_of.items() if g in skipped}
    return changes, drift, skipped | members


def apply_undo(changes, creds, ut, arts):
    for c in changes:
        if c["file"] == "credentials.json":
            if c["to"] is None:
                creds.pop(c["key"], None)
            else:
                creds[c["key"]] = c["to"]
        elif c["file"] == "unified_titles.json":
            ut[c["key"]]["unified_title"] = c["to"]
        else:
            arts[c["index"]]["unified_title"] = c["to"]


def _q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"


def _is(col, v):
    return "%s is null" % col if v is None else "%s = %s" % (col, _q(v))


def _loud(stmt, what):
    """One guarded statement that reports when it matches nothing: a row a person changed since the apply
    is left as they made it and named in a notice, and the rest of the plan still runs, so a rerun after a
    half-done undo finishes it instead of failing on the same row every time."""
    return ("do $$ declare n int; begin %s get diagnostics n = row_count; if n = 0 then raise notice "
            "'undo left alone: %s (already undone, or changed since the apply)'; end if; end $$;"
            % (stmt, what.replace("'", "''").replace("%", "%%")))


def _insert(cid, field, before):
    return ("insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, "
            "validated_by) values (%s, %s, %s, %s, %s, %s, %s) on conflict do nothing;"
            % (_q(cid), _q(field), _q(before.get("value")), _q(before.get("reviewer_email")),
               _q(before.get("reviewed_at")), _q(before.get("validated_at")), _q(before.get("validated_by"))))


def supabase_ops(log_doc, skip_titles=(), resolution_logs=()):
    """The kb_curation reversal as ops, in the order they run: the fold's resolution rows FIRST (so every
    reader, the browser's included, stops applying the fold at once), newest first, then the row moves
    (supabase_log*.json payloads, oldest first) newest op first. skip_titles: the fold groups --force
    skipped; their rows stay. Returns (ops, unreversible)."""
    docs = log_doc if isinstance(log_doc, list) else [log_doc]
    skip = set(skip_titles or ())
    ops, cannot = [], []
    for doc in reversed(list(resolution_logs or [])):
        for e in reversed(doc.get("log") or []):
            if e.get("status") != "ok" or e.get("op") not in ("insert", "replace"):
                continue
            cid, field = e["course_id"], e["field"]
            if cid.split("::", 1)[-1] in skip:
                continue
            after = (e.get("after_row") or {}).get("value")
            if e["op"] == "insert":
                ops.append({"op": "res_delete", "course_id": cid, "field": field, "after": after})
            else:
                ops.append({"op": "res_restore", "course_id": cid, "field": field, "after": after,
                            "before": e.get("before_row") or {}})
    # Every move a log PLANNED, never only the ones its write echoed: a request whose response was lost may have
    # committed, and logs as a failure. The ops below are each guarded on the row the move left (move_back on value,
    # reviewer and save time at the new key; reinsert ignoring duplicates), so a move that never landed reads as
    # "already" and is left. Only a move the row move itself filed as not landed, from its fresh read, is skipped. A
    # move named in two logs (a rerun carries what landed) is reversed once.
    seen = set()
    for doc in reversed(docs):
        for e in reversed((doc or {}).get("log") or []):
            if e.get("op") not in ("patch", "delete") or e.get("filed") == "not_landed":
                continue
            if "filed" not in e and e.get("status") not in ("ok", "planned") and not e.get("before_row"):
                continue
            if (e.get("old_ut") in skip) or (e.get("new_ut") in skip):
                continue
            key = (e.get("op"), e.get("course_id") or e.get("old_course_id"), e.get("new_course_id"), e.get("field"))
            if key in seen:
                continue
            seen.add(key)
            before = e.get("before_row")
            if not before:
                cannot.append(e)
                continue
            if e.get("op") == "patch":
                ops.append({"op": "move_back", "old_course_id": e["old_course_id"],
                            "new_course_id": e["new_course_id"], "field": e["field"], "before": before})
            elif e.get("op") == "delete":
                ops.append({"op": "reinsert", "course_id": e["course_id"], "field": e["field"], "before": before})
    return ops, cannot


def _op_sql(o):
    if o["op"] == "repoint_back":
        b = o["before"]
        return _loud("update kb_curation set value = %s where course_id = %s and field = %s and %s and %s and %s;"
                     % (_q(b.get("value")), _q(o["course_id"]), _q(o["field"]), _is("value", o["after"]),
                        _is("reviewer_email", b.get("reviewer_email")), _is("reviewed_at", b.get("reviewed_at"))),
                     "the re-pointed assignment " + o["course_id"])
    if o["op"] == "res_delete":
        return _loud("delete from kb_curation where course_id = %s and field = %s and %s and %s;"
                     % (_q(o["course_id"]), _q(o["field"]), _is("reviewer_email", fold_issuer.COHORT),
                        _is("value", o["after"])), "the fold's resolution on " + o["course_id"])
    if o["op"] == "res_restore":
        b = o["before"]
        return _loud("update kb_curation set value = %s, reviewed_at = %s where course_id = %s and field = %s "
                     "and %s and %s;" % (_q(b.get("value")), _q(b.get("reviewed_at")), _q(o["course_id"]),
                                         _q(o["field"]), _is("reviewer_email", fold_issuer.COHORT),
                                         _is("value", o["after"])), "the fold's resolution on " + o["course_id"])
    b = o["before"]
    if o["op"] == "move_back":
        return _loud("update kb_curation set course_id = %s where course_id = %s and field = %s and %s and %s "
                     "and %s;" % (_q(o["old_course_id"]), _q(o["new_course_id"]), _q(o["field"]),
                                  _is("value", b.get("value")), _is("reviewer_email", b.get("reviewer_email")),
                                  _is("reviewed_at", b.get("reviewed_at"))),
                     "%s / %s" % (o["new_course_id"], o["field"]))
    return _loud(_insert(o["course_id"], o["field"], b), "%s / %s (a row is there now)" % (o["course_id"], o["field"]))


def supabase_plan(log_doc, skip_titles=(), resolution_logs=(), fold_id=None, repoint_ops=()):
    """The same reversal as SQL, for a person to run under Rule 10 when the undo cannot reach Supabase
    itself. Returns (sql, unreversible). repoint_ops: the re-pointed assignments' reversal
    (kb/_cred_rename_repoint.py supabase_undo_ops), run first."""
    ops, cannot = supabase_ops(log_doc, skip_titles, resolution_logs)
    ops = list(repoint_ops or ()) + ops
    docs = log_doc if isinstance(log_doc, list) else [log_doc]
    head = docs[0].get("alias_map_snapshot") if docs and docs[0] else "a credential rename apply"
    sql = ("-- Reverses %s (kb/_cred_rename_undo.py)%s. Each statement is guarded on the row the apply "
           "left; one that matches nothing raises a notice and the rest still run, so a rerun finishes a "
           "half-done undo.\nbegin;\n%s\ncommit;\n"
           % (head, (" fold " + fold_id) if fold_id else "", "\n".join(_op_sql(o) for o in ops)))
    return sql, cannot


# ── Running the reversal itself (PostgREST, service_role) ───────────────────────────────────────────────
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def rest(method, path, body=None, prefer="return=representation"):
    """One PostgREST call; returns the rows (a list). Tests replace this."""
    import urllib.request
    req = urllib.request.Request(
        f"{URL}/rest/v1/{path}", method=method,
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json",
                 "Accept": "application/json", "Prefer": prefer},
        data=json.dumps(body).encode("utf-8") if body is not None else None)
    with urllib.request.urlopen(req, timeout=30) as r:
        got = json.load(r)
    return got if isinstance(got, list) else []


def _qs(**eq):
    import urllib.parse
    return urllib.parse.urlencode({k: ("is.null" if v is None else f"eq.{v}") for k, v in eq.items()})


def _current(cid, field):
    rows = rest("GET", "kb_curation?select=course_id,field,value,reviewer_email,reviewed_at&" + _qs(course_id=cid, field=field))
    return rows[0] if rows else None


def _op_state(o):
    """What a fresh read finds for one op: 'done' (the row is as the undo leaves it), 'from' (the row is as the apply
    left it, so the op may write) or 'other' (changed since: left as it is)."""
    b = o.get("before") or {}
    if o["op"] == "res_delete":
        cur = _current(o["course_id"], o["field"])
        if cur is None:
            return "done"
        return "from" if cur.get("reviewer_email") == fold_issuer.COHORT and cur.get("value") == o["after"] else "other"
    if o["op"] == "res_restore":
        cur = _current(o["course_id"], o["field"])
        if cur and cur.get("value") == b.get("value"):
            return "done"
        return "from" if cur and cur.get("reviewer_email") == fold_issuer.COHORT and cur.get("value") == o["after"] \
            else "other"
    same = lambda r: r is not None and all(r.get(k) == b.get(k) for k in ("value", "reviewer_email", "reviewed_at"))  # noqa: E731
    if o["op"] == "move_back":
        at_old, at_new = _current(o["old_course_id"], o["field"]), _current(o["new_course_id"], o["field"])
        if same(at_old) and not same(at_new):
            return "done"
        return "from" if same(at_new) and at_old is None else "other"
    cur = _current(o["course_id"], o["field"])  # reinsert
    if same(cur):
        return "done"
    return "from" if cur is None else "other"


def _op_write(o):
    b = o.get("before") or {}
    if o["op"] == "res_delete":
        rest("DELETE", "kb_curation?" + _qs(course_id=o["course_id"], field=o["field"],
                                            reviewer_email=fold_issuer.COHORT, value=o["after"]))
    elif o["op"] == "res_restore":
        rest("PATCH", "kb_curation?" + _qs(course_id=o["course_id"], field=o["field"],
                                           reviewer_email=fold_issuer.COHORT, value=o["after"]),
             {"value": b.get("value"), "reviewed_at": b.get("reviewed_at")})
    elif o["op"] == "move_back":
        rest("PATCH", "kb_curation?" + _qs(course_id=o["new_course_id"], field=o["field"], value=b.get("value"),
                                           reviewer_email=b.get("reviewer_email"), reviewed_at=b.get("reviewed_at")),
             {"course_id": o["old_course_id"]})
    else:
        row = {k: b.get(k) for k in ("value", "reviewer_email", "reviewed_at", "validated_at", "validated_by")}
        row.update(course_id=o["course_id"], field=o["field"])
        rest("POST", "kb_curation", row, "return=representation,resolution=ignore-duplicates")


def run_op(o):
    """Run one op: read the row, write only when it is as the apply left it, then read it back and file what it
    holds; the write's echo decides nothing. Returns {"status": "ok" | "already" | "left", ...}. A network error
    that leaves the write undone raises."""
    if o["op"] == "repoint_back":
        return repoint.repoint_back(o, lambda m, p, body=None: rest(m, p, body))
    pre = _op_state(o)
    if pre == "done":
        return {"status": "already"}
    if pre == "other":
        return {"status": "left", "why": "the row changed since the apply (a person or a later run): left as it is"}
    err = None
    try:
        _op_write(o)
    except Exception as e:
        err = e
    post = _op_state(o)
    if post == "done":
        return {"status": "ok", "filed": "read back"}
    if err is not None and not (o["op"] == "move_back" and "409" in str(err)):
        raise err
    return {"status": "left", "why": "the write did not take: the row reads as it stood (%s)" % post}


def run_supabase(ops):
    """Every op, in order. A row a person changed is left and reported, never a stop; a network error
    stops the run (the JSON half then does not run). Returns the log."""
    return [dict(o, **run_op(o)) for o in ops]


def _logs(folder, prefix):
    names = sorted(n for n in os.listdir(folder) if n.startswith(prefix) and n.endswith(".json"))
    names.sort(key=lambda n: (n != prefix + ".json", n))
    return [_load(os.path.join(folder, n)) for n in names]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("receipt", help="kb/cred_rename_out/<fold>/ of the apply to reverse")
    ap.add_argument("--apply", action="store_true", help="write the three kb files and undone.json")
    ap.add_argument("--force", action="store_true",
                    help="skip drifted fold groups (whole groups, in the files and the SQL) instead of refusing")
    ap.add_argument("--supabase-plan", action="store_true", help="write undo_supabase.sql")
    ap.add_argument("--json-only", action="store_true",
                    help="with --apply and no SUPABASE_SERVICE_KEY: write the files anyway and leave kb_curation "
                         "to undo_supabase.sql")
    a = ap.parse_args(argv)
    up = os.path.join(a.receipt, "undo.json")
    if not os.path.isfile(up):
        sys.exit(f"No {up}: this apply predates the undo file (before #3110 build step 1); "
                 f"reverse it from git history. A re-point filed beside it reverses on its own: "
                 f"python3 kb/_cred_rename_repoint.py --undo {a.receipt} --apply")
    undo = _load(up)
    snap_path = os.path.join(a.receipt, "alias_map.json")
    snapshot = _load(snap_path) if os.path.isfile(snap_path) else {}
    creds, ut, art_doc = _load(CREDENTIALS), _load(UNIFIED_TITLES), _load(ARTICULATIONS)
    arts = art_doc.get("articulations") or []
    # The saved values the apply re-pointed (kb/_cred_rename_repoint.py repoint*.json), read in this tree: one changed
    # since is drift, and holds its fold group whole like any other value.
    rp_root = repoint.root_of(CREDENTIALS)
    rp_todo, rp_drift, rp_absent = repoint.undo_plan(a.receipt, rp_root)
    changes, drift, skipped = plan_undo(undo, creds, ut, arts, resolutions_of(snapshot),
                                        {repoint.undo_title(c) for c in rp_drift})
    drift += [{"file": c["file"], "key": c["key"], "after": repoint.undo_title(c)} for c in rp_drift]
    rp_back = [repoint.reverse(c) for c in rp_todo if repoint.undo_title(c) not in skipped]
    for c in rp_absent:
        print(f"  not in this tree, left: {c['file']} {c['key']}")
    for d in drift:
        print(f"  DRIFT {d['file']}: {d['key']} " + (d.get("held") or "changed since the apply"))
    if drift and not a.force:
        sys.exit(f"{len(drift)} value(s) changed since the apply or sit in a fold group that did; nothing "
                 f"written. --force skips those whole groups, in the files and in the SQL.")
    if skipped:
        print(f"  skipped fold groups, left folded in the files and in the SQL plan: {sorted(skipped)}")
    slogs, rlogs = _logs(a.receipt, "supabase_log"), _logs(a.receipt, "resolution_log")
    if a.supabase_plan:
        sql, cannot = supabase_plan(slogs, skipped, rlogs, undo.get("fold_id"),
                                    repoint.supabase_undo_ops(a.receipt, skipped))
        with open(os.path.join(a.receipt, "undo_supabase.sql"), "w", encoding="utf-8") as f:
            f.write(sql)
        print(f"wrote {a.receipt}/undo_supabase.sql; {len(cannot)} op(s) not reversible (no before_row)")
    print(f"[cred_rename_undo] {len(changes) + len(rp_back)} value(s) to put back"
          + ("" if a.apply else " (dry run; --apply writes)"))
    if a.apply and not KEY and not a.json_only:
        sys.exit("--apply runs the kb_curation half first, so it needs SUPABASE_SERVICE_KEY. Without it the "
                 "moved rows keep reaching the nightly while the files are undone; --json-only accepts that "
                 "window (then run undo_supabase.sql from --supabase-plan).")
    if a.apply and KEY:
        # The kb_curation half runs FIRST: the resolution rows go (every reader, the browser's too, drops the
        # fold at once), then the moved rows go back, so no nightly sees the files undone and the rows folded.
        ops, cannot = supabase_ops(slogs, skipped, rlogs)
        ops = repoint.supabase_undo_ops(a.receipt, skipped) + ops
        from datetime import datetime, timezone
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        log_path = os.path.join(a.receipt, "undo_supabase_log-%s.json" % stamp)
        # The planned reversal is on disk before the first write; the filed log replaces it after.
        _write(log_path, {"_state": "pending", "log": ops, "not_reversible": cannot})
        try:
            log = run_supabase(ops)
        except Exception as e:
            sys.exit(f"kb_curation unreachable ({str(e)[:200]}); nothing in the files was written. Rerun: the "
                     f"rows already put back read as already undone.")
        _write(log_path, {"_state": "filed", "log": log, "not_reversible": cannot})
        left = [x for x in log if x["status"] == "left"]
        print(f"  kb_curation: {sum(x['status'] == 'ok' for x in log)} put back, "
              f"{sum(x['status'] == 'already' for x in log)} already, {len(left)} left as a person made them")
        for x in left:
            print(f"  LEFT {x.get('course_id') or x.get('new_course_id')} / {x['field']}: {x['why']}")
    if a.apply:
        if changes:
            apply_undo(changes, creds, ut, arts)
            _write(CREDENTIALS, creds)
            _write(UNIFIED_TITLES, ut)
            _write(ARTICULATIONS, art_doc)
        if rp_back:
            repoint.apply_changes(rp_back, rp_root)
            print(f"  put back {len(rp_back)} re-pointed saved value(s)")
        if repoint.mirror_changes(a.receipt):
            print("  then re-read kb/unclassified_assignments.json from kb_curation: "
                  "python3 kb/_apply_unclassified_triage.py (the copy follows the rows put back)")
        if undo.get("fold_id"):
            _write(os.path.join(a.receipt, "undone.json"),
                   {"fold_ids": [undo["fold_id"]], "skipped_groups": sorted(skipped),
                    "_about": "This fold was undone; the nightly ignores its issuer_resolution rows. Delete "
                              "them with undo_supabase.sql (kb/_cred_rename_undo.py --supabase-plan)."})
        print("  then rebuild what reads the credential keys, as the apply workflow does: "
              "python3 kb/_build_remint_blast_radius.py && python3 kb/_build_ccr_cpl.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
