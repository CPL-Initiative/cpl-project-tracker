#!/usr/bin/env python3
"""Reverse one credential rename apply from its receipt in kb/cred_rename_out/<date>/.

Why it exists: #3110 agreed on "undo instead of a gate" for the fold apply, and an undo has to work
before anything triggers the apply on its own. Before this script a rename was reversible only by hand
(swap the alias map and re-run) and a merge only from git history, because the fold dedupes records and
the receipt kept no before-values.

Since #3110 build step 1, kb/_cred_rename_apply.py writes undo.json beside its receipt: every value it
changed, before and after, in kb/credentials.json (by key), kb/unified_titles.json (by raw title) and
kb/coci_articulations.json (by course_id + exhibit_id). This script puts each one back.

  python3 kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-11            # dry run: what would change
  python3 kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-11 --apply    # write the three files
  python3 kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-11 --supabase-plan
        # write undo_supabase.sql from supabase_log.json, for a person to run (Rule 10)

Safety: a value that changed since the apply (its current value is not the apply's "after") is drift,
and the undo refuses the whole run unless --force, which then skips the drifted values and names them.
Undo the newest apply first: two applies that touched the same title undo in reverse order.

The kb_curation half is never written here. --supabase-plan turns the apply's supabase_log.json (each op
logs its before_row since build step 1) into SQL: a deleted row comes back by INSERT ... ON CONFLICT DO
NOTHING, a moved row moves back, an issuer update takes its before-value back. A log written before build
step 1 has no before_row, and the plan says which ops it cannot reverse.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
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


def plan_undo(undo, creds, ut, arts):
    """What the undo would do, without writing. Returns (changes, drift); each a list of dicts."""
    changes, drift = [], []
    for key, ba in sorted((undo.get("credentials") or {}).items()):
        cur = creds.get(key)
        if cur == ba.get("before"):
            continue  # already as it was
        if cur != ba.get("after"):
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
        changes.append({"file": "coci_articulations.json", "index": hit, "to": ch["before"]})
    # A fold group (a target and every title renamed or merged onto it) undoes as one unit: if any of
    # its values drifted, none of the group is put back, so --force never splits a fold (which left a
    # source's records under both the source and the target).
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

    for c in changes:
        if c["file"] == "coci_articulations.json":
            c["after"] = arts[c["index"]].get("unified_title")
    bad = {group(d) for d in drift}
    held = [c for c in changes if group(c) in bad]
    changes = [c for c in changes if group(c) not in bad]
    for c in held:
        drift.append({"file": c["file"], "key": c.get("key", c.get("index")), "after": c.get("after"),
                      "held": "its fold group drifted"})
    return changes, drift


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


def _insert(cid, field, before):
    return ("insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, "
            "validated_by) values (%s, %s, %s, %s, %s, %s, %s) on conflict do nothing;"
            % (_q(cid), _q(field), _q(before.get("value")), _q(before.get("reviewer_email")),
               _q(before.get("reviewed_at")), _q(before.get("validated_at")), _q(before.get("validated_by"))))


def _is(col, v):
    return "%s is null" % col if v is None else "%s = %s" % (col, _q(v))


def supabase_plan(log_doc):
    """SQL reversing one or more supabase_log*.json payloads (a dict, or a list oldest first), newest op
    first. Every statement is guarded on the row the apply left, so a row a person changed since is left
    alone. Returns (sql, unreversible)."""
    docs = log_doc if isinstance(log_doc, list) else [log_doc]
    out, cannot = [], []
    for doc in reversed(docs):
        for e in reversed(doc.get("log") or []):
            if e.get("status") != "ok" or not e.get("rows_affected"):
                continue
            op = e.get("op")
            before = e.get("before_row")
            if op == "patch":
                if not before:
                    cannot.append(e)
                    continue
                out.append("update kb_curation set course_id = %s where course_id = %s and field = %s and %s;"
                           % (_q(e["old_course_id"]), _q(e["new_course_id"]), _q(e["field"]),
                              _is("value", before.get("value"))))
            elif op in ("delete", "issuer_delete"):
                if not before:
                    cannot.append(e)
                    continue
                out.append(_insert(e["course_id"], e["field"], before))
            elif op == "issuer_update":
                if not before:
                    cannot.append(e)
                    continue
                after = e.get("after_row") or {}
                out.append("update kb_curation set value = %s, reviewer_email = %s, reviewed_at = %s, "
                           "validated_at = %s, validated_by = %s where course_id = %s and field = %s and %s "
                           "and %s;"
                           % (_q(before.get("value")), _q(before.get("reviewer_email")),
                              _q(before.get("reviewed_at")), _q(before.get("validated_at")),
                              _q(before.get("validated_by")), _q(e["course_id"]), _q(e["field"]),
                              _is("value", after.get("value")), _is("reviewer_email", after.get("reviewer_email"))))
            elif op == "issuer_insert":
                after = e.get("after_row") or {}
                out.append("delete from kb_curation where course_id = %s and field = %s and %s and %s;"
                           % (_q(e["course_id"]), _q(e["field"]), _is("value", after.get("value")),
                              _is("reviewer_email", after.get("reviewer_email"))))
    sql = "-- Reverses %s (kb/_cred_rename_undo.py). Run in one transaction.\nbegin;\n%s\ncommit;\n" % (
        docs[0].get("alias_map_snapshot") if docs else "a credential rename apply", "\n".join(out))
    return sql, cannot


def _logs(folder):
    """Every Supabase log of one apply, oldest first: supabase_log.json, then each retry's."""
    names = sorted(n for n in os.listdir(folder) if n.startswith("supabase_log") and n.endswith(".json"))
    names.sort(key=lambda n: (n != "supabase_log.json", n))
    return [_load(os.path.join(folder, n)) for n in names]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("receipt", help="kb/cred_rename_out/<date>/ of the apply to reverse")
    ap.add_argument("--apply", action="store_true", help="write the three kb files")
    ap.add_argument("--force", action="store_true",
                    help="skip drifted fold groups (whole groups) instead of refusing")
    ap.add_argument("--supabase-plan", action="store_true", help="write undo_supabase.sql from the logs")
    a = ap.parse_args(argv)
    if a.supabase_plan:
        logs = _logs(a.receipt) if os.path.isdir(a.receipt) else []
        if not logs:
            sys.exit(f"No supabase_log*.json in {a.receipt}: the Supabase step did not run for this apply.")
        sql, cannot = supabase_plan(logs)
        with open(os.path.join(a.receipt, "undo_supabase.sql"), "w", encoding="utf-8") as f:
            f.write(sql)
        print(f"wrote {a.receipt}/undo_supabase.sql from {len(logs)} log(s); {len(cannot)} op(s) not "
              f"reversible (no before_row)")
        return 0
    up = os.path.join(a.receipt, "undo.json")
    if not os.path.isfile(up):
        sys.exit(f"No {up}: this apply predates the undo file (before #3110 build step 1); "
                 f"reverse it from git history.")
    undo = _load(up)
    creds, ut, art_doc = _load(CREDENTIALS), _load(UNIFIED_TITLES), _load(ARTICULATIONS)
    arts = art_doc.get("articulations") or []
    changes, drift = plan_undo(undo, creds, ut, arts)
    for d in drift:
        print(f"  DRIFT {d['file']}: {d['key']} " + (d.get("held") or "changed since the apply"))
    if drift and not a.force:
        sys.exit(f"{len(drift)} value(s) changed since the apply or sit in a fold group that did; nothing "
                 f"written. --force skips those whole groups.")
    print(f"[cred_rename_undo] {len(changes)} value(s) to put back"
          + ("" if a.apply else " (dry run; --apply writes)"))
    if a.apply and changes:
        apply_undo(changes, creds, ut, arts)
        _write(CREDENTIALS, creds)
        _write(UNIFIED_TITLES, ut)
        _write(ARTICULATIONS, art_doc)
        print("  then rebuild what reads the credential keys, as the apply workflow does: "
              "python3 kb/_build_remint_blast_radius.py && python3 kb/_build_ccr_cpl.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
