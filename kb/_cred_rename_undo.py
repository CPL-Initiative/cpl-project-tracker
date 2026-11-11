#!/usr/bin/env python3
"""Reverse one credential rename apply from its receipt in kb/cred_rename_out/<fold>/.

Why it exists: #3110 agreed on "undo instead of a gate" for the fold apply, and an undo has to work
before anything triggers the apply on its own. kb/_cred_rename_apply.py writes undo.json beside its
receipt: every value it changed, before and after, in kb/credentials.json (by key), kb/unified_titles.json
(by raw title) and kb/coci_articulations.json (by course_id + exhibit_id). This script puts each back.

  python3 kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-11            # dry run: what would change
  python3 kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-11 --apply    # write the three files
  python3 kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-11 --supabase-plan
        # write undo_supabase.sql, for a person to run (Rule 10); with --apply, both

The fold's issuer decision lives in kb_curation as one issuer_resolution row per folded target (cohort
fold_issuer.COHORT, #3116). --apply also writes undone.json beside the receipt, naming the fold's id: the
nightly sync then ignores that fold's resolution rows at once, so the JSON undo stands even before a person
runs the SQL that deletes them. The nightly enforces a resolution on credentials.json; the undo counts a
value the enforcement produced from the apply's own "after" as unchanged, never as drift.

Safety: a value that changed since the apply is drift, and the undo refuses the whole run unless --force,
which skips each drifted fold group WHOLE (a target and every title renamed or merged onto it); the SQL
plan leaves out the same groups' row moves, so the two halves agree. Undo the newest apply first.

The SQL: every statement is guarded on the row the apply left (value, reviewer_email and reviewed_at for a
moved row; the cohort and fold id for a resolution row), and each runs in a block that raises when it
matches nothing, so a row a person changed since stops the plan loudly instead of being skipped in silence.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
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


def plan_undo(undo, creds, ut, arts, resolutions=None):
    """What the undo would do, without writing. Returns (changes, drift, skipped_groups)."""
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

    bad = {group(d) for d in drift}
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
    """One guarded statement that raises when it matches nothing: a row a person changed since the apply
    stops the plan, never a silent no-op (the transaction then rolls back whole)."""
    return ("do $$ declare n int; begin %s get diagnostics n = row_count; if n = 0 then raise exception "
            "'undo stopped: %s changed since the apply; nothing in this plan was written'; end if; end $$;"
            % (stmt, what.replace("'", "''").replace("%", "%%")))


def _insert(cid, field, before):
    return ("insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, "
            "validated_by) values (%s, %s, %s, %s, %s, %s, %s) on conflict do nothing;"
            % (_q(cid), _q(field), _q(before.get("value")), _q(before.get("reviewer_email")),
               _q(before.get("reviewed_at")), _q(before.get("validated_at")), _q(before.get("validated_by"))))


def supabase_plan(log_doc, skip_titles=(), resolution_logs=(), fold_id=None):
    """SQL reversing the row moves (supabase_log*.json payloads, oldest first) newest op first, then the
    fold's resolution rows. skip_titles: the fold groups --force skipped; their moves stay. Returns
    (sql, unreversible)."""
    docs = log_doc if isinstance(log_doc, list) else [log_doc]
    skip = set(skip_titles or ())
    out, cannot = [], []
    for doc in reversed(list(resolution_logs or [])):
        for e in reversed(doc.get("log") or []):
            if e.get("status") != "ok" or e.get("op") not in ("insert", "replace"):
                continue
            cid, field = e["course_id"], e["field"]
            if cid.split("::", 1)[-1] in skip:
                continue
            after = e.get("after_row") or {}
            if e["op"] == "insert":
                out.append(_loud("delete from kb_curation where course_id = %s and field = %s and %s and %s;"
                                 % (_q(cid), _q(field), _is("reviewer_email", fold_issuer.COHORT),
                                    _is("value", after.get("value"))), "the fold's resolution on " + cid))
            else:
                b = e.get("before_row") or {}
                out.append(_loud("update kb_curation set value = %s, reviewed_at = %s where course_id = %s and "
                                 "field = %s and %s and %s;"
                                 % (_q(b.get("value")), _q(b.get("reviewed_at")), _q(cid), _q(field),
                                    _is("reviewer_email", fold_issuer.COHORT), _is("value", after.get("value"))),
                                 "the fold's resolution on " + cid))
    for doc in reversed(docs):
        for e in reversed(doc.get("log") or []):
            if e.get("status") != "ok" or not e.get("rows_affected"):
                continue
            if (e.get("old_ut") in skip) or (e.get("new_ut") in skip):
                continue
            op = e.get("op")
            before = e.get("before_row")
            if op == "patch":
                if not before:
                    cannot.append(e)
                    continue
                out.append(_loud("update kb_curation set course_id = %s where course_id = %s and field = %s "
                                 "and %s and %s and %s;"
                                 % (_q(e["old_course_id"]), _q(e["new_course_id"]), _q(e["field"]),
                                    _is("value", before.get("value")),
                                    _is("reviewer_email", before.get("reviewer_email")),
                                    _is("reviewed_at", before.get("reviewed_at"))),
                                 "%s / %s" % (e["new_course_id"], e["field"])))
            elif op == "delete":
                if not before:
                    cannot.append(e)
                    continue
                out.append(_loud(_insert(e["course_id"], e["field"], before),
                                 "%s / %s (a row is there now)" % (e["course_id"], e["field"])))
    head = docs[0].get("alias_map_snapshot") if docs and docs[0] else "a credential rename apply"
    sql = ("-- Reverses %s (kb/_cred_rename_undo.py)%s. One transaction: any guard that matches nothing "
           "raises, and nothing is written.\nbegin;\n%s\ncommit;\n"
           % (head, (" fold " + fold_id) if fold_id else "", "\n".join(out)))
    return sql, cannot


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
    a = ap.parse_args(argv)
    up = os.path.join(a.receipt, "undo.json")
    if not os.path.isfile(up):
        sys.exit(f"No {up}: this apply predates the undo file (before #3110 build step 1); "
                 f"reverse it from git history.")
    undo = _load(up)
    snap_path = os.path.join(a.receipt, "alias_map.json")
    snapshot = _load(snap_path) if os.path.isfile(snap_path) else {}
    creds, ut, art_doc = _load(CREDENTIALS), _load(UNIFIED_TITLES), _load(ARTICULATIONS)
    arts = art_doc.get("articulations") or []
    changes, drift, skipped = plan_undo(undo, creds, ut, arts, resolutions_of(snapshot))
    for d in drift:
        print(f"  DRIFT {d['file']}: {d['key']} " + (d.get("held") or "changed since the apply"))
    if drift and not a.force:
        sys.exit(f"{len(drift)} value(s) changed since the apply or sit in a fold group that did; nothing "
                 f"written. --force skips those whole groups, in the files and in the SQL.")
    if skipped:
        print(f"  skipped fold groups, left folded in the files and in the SQL plan: {sorted(skipped)}")
    if a.supabase_plan:
        sql, cannot = supabase_plan(_logs(a.receipt, "supabase_log"), skipped,
                                    _logs(a.receipt, "resolution_log"), undo.get("fold_id"))
        with open(os.path.join(a.receipt, "undo_supabase.sql"), "w", encoding="utf-8") as f:
            f.write(sql)
        print(f"wrote {a.receipt}/undo_supabase.sql; {len(cannot)} op(s) not reversible (no before_row)")
    print(f"[cred_rename_undo] {len(changes)} value(s) to put back"
          + ("" if a.apply else " (dry run; --apply writes)"))
    if a.apply:
        if changes:
            apply_undo(changes, creds, ut, arts)
            _write(CREDENTIALS, creds)
            _write(UNIFIED_TITLES, ut)
            _write(ARTICULATIONS, art_doc)
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
