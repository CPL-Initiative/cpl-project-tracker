"""
Cred-Ref PR-5b/1 — Supabase row migration for credential renames.

Consumes the frozen alias map at kb/cred_rename_out/<YYYY-MM-DD>/alias_map.json
(written by kb/_cred_rename_apply.py) and migrates the matching rows in
public.kb_curation:

  For each (old_unified_title → new_unified_title) rename:
    1. DELETE rows where course_id = '_CREDENTIAL_REVIEW::<OLD>' AND
       field = 'unified_title_override' (the override has been fulfilled —
       the rename has landed in the JSON files, so the Supabase row that
       triggered it is obsolete).
    2. PATCH the remaining rows (issuing_agency_override,
       training_agency_override, quality_flag_override, reviewed_marker)
       on '_CREDENTIAL_REVIEW::<OLD>' to course_id = '_CREDENTIAL_REVIEW::<NEW>'
       so curator intent on OTHER fields carries over to the new identity.

  For each (old_unified_title ⇒ target) confirmed MERGE (PR-5b/2, Session 107):
    1. DELETE the fulfilled decision rows on <OLD>: unified_title_override
       AND unified_title_merge_confirm.
    2. For every OTHER field on <OLD>: PATCH to '_CREDENTIAL_REVIEW::<TARGET>'
       — UNLESS the target already carries a row for the same field, in which
       case DELETE the old row instead (the target's own curator data wins;
       the composite PK (course_id, field) would reject the PATCH anyway, and
       the frozen alias_map snapshot preserves the superseded value). The
       target's field set is tracked LIVE across the run: fan-in (several
       sources folding into one target) means the first source's PATCH
       creates a target row the pre-fetch never saw — later siblings must
       DELETE, not PATCH (run #4's 8×409 lesson). A 409 on a merge PATCH
       falls back to the same supersede-DELETE.

  A saved fold into a declared family title (unified_title_override or
  unified_title_merge_confirm naming it; Sam's ruling C reads it as a family
  tag) is never this rename's decision: it is left in place, logged as op
  "keep", never moved or deleted (Sheet 181's ruled renames, kb/ruled_renames.py).

  This script never updates or deletes an issuer row for the fold's issuer
  decision (#3116 redesign): kb/_cred_fold_resolution_write.py writes one
  issuer_resolution row per folded target before this step, and every reader
  resolves the moved rows through kb/fold_issuer.py effective_issuer(). Every
  logged op carries the row as it stood (before_row, validated_* included),
  and a retry writes supabase_log-<UTC>.json beside the first log, so
  kb/_cred_rename_undo.py --supabase-plan can write the reversal.

Why DELETE + PATCH (not single PATCH-all):
  * The unified_title_override row's PURPOSE is fulfilled by the apply —
    keeping it under the new key would re-fire on the next dry-run as a
    self-pointer override ("rename X to X"), filling reports with noise.
  * Other overrides (issuer/trainer/quality_flag/reviewed_marker) are
    *attached to the credential* — they belong on whatever the credential's
    current identity key is, so they migrate to <NEW>.
  * The alias_map.json snapshot at kb/cred_rename_out/<date>/ is the canonical
    audit trail (the supersede-don't-mutate ADR makes the alias map
    load-bearing for history; Supabase doesn't need to also carry it).

Architectural invariant honored: raw college-authored titles in
kb/unified_titles.json dict KEYS are immutable; only the synthetic
unified_title layer (Supabase course_id, credentials.json keys, articulation
values) evolves through this script.

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required — service_role key bypasses RLS)

Output: kb/cred_rename_out/<YYYY-MM-DD>/supabase_log.json — per-alias
log + ok/fail counts.

Idempotent: re-running finds zero rows to delete + zero rows to patch
per alias (the old course_ids are gone from kb_curation) and logs
ok=0 rows-affected=0 for each.

Run from repo root:  SUPABASE_SERVICE_KEY=... python3 kb/_cred_rename_apply_supabase.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fold_issuer  # noqa: E402  (RESOLUTION_FIELD: a resolution row is never PATCHed onto another)
OUT_ROOT = os.path.join(HERE, "cred_rename_out")
FAMILIES = os.path.join(HERE, "reference", "credential_families.json")
KEY_PREFIX = "_CREDENTIAL_REVIEW::"

URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def _find_latest_snapshot():
    """Pick the most recent kb/cred_rename_out/<YYYY-MM-DD>/alias_map.json.
    Allows the workflow to dispatch this script independently of the JSON
    apply (e.g. retry after a transient Supabase error)."""
    if not os.path.isdir(OUT_ROOT):
        return None
    candidates = []
    for name in os.listdir(OUT_ROOT):
        path = os.path.join(OUT_ROOT, name, "alias_map.json")
        if os.path.isfile(path):
            try:   # a re-point-only receipt moves no credential row and renames nothing (kb/_cred_rename_apply.py)
                with open(path, encoding="utf-8") as f:
                    if json.load(f).get("_repoint_only"):
                        continue
            except (OSError, ValueError):
                pass
            candidates.append((name, path))
    if not candidates:
        return None
    # <date>, then <date>-2, -3 … -10: by date, then by the same-day number (a string sort put -10
    # before -9).
    def order(c):
        date_part, n = c[0][:10], c[0][11:]
        return (date_part, int(n) if n.isdigit() else 1)
    candidates.sort(key=order, reverse=True)
    return candidates[0]


def fetch_credential_review_rows() -> dict:
    """Pull every _CREDENTIAL_REVIEW::* row from kb_curation. Returned as
    {course_id: [{field, value, reviewer_email, reviewed_at}, ...]}.

    Pre-fetching lets us skip aliases whose source rows don't exist in
    Supabase at all (idempotency on re-runs) and detect the unified_title_override
    rows to DELETE vs. PATCH others. Range-paginated with a stable order so
    the slice can grow past PostgREST's 1,000-row unordered cap without
    silently truncating (the Session-105 lesson —
    docs/kb-notes/methodology-paginate-postgrest-reads.md; 138 rows today).
    """
    qs = urllib.parse.urlencode({
        # validated_at / validated_by too: a deleted row's before_row must restore it exactly.
        "select": "course_id,field,value,reviewer_email,reviewed_at,validated_at,validated_by",
        "course_id": f"like.{KEY_PREFIX}%",
        "order": "course_id.asc,field.asc",
    })
    page_size = 1000
    rows = []
    start = 0
    while True:
        req = urllib.request.Request(
            f"{URL}/rest/v1/kb_curation?{qs}",
            headers={
                "apikey": KEY,
                "Authorization": f"Bearer {KEY}",
                "Accept": "application/json",
                "Range-Unit": "items",
                "Range": f"{start}-{start + page_size - 1}",
            },
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            page = json.load(r)
        rows.extend(page or [])
        if not page or len(page) < page_size:
            break
        start += page_size
    grouped = {}
    for row in rows:
        cid = row.get("course_id") or ""
        if not cid.startswith(KEY_PREFIX):
            continue
        grouped.setdefault(cid, []).append(row)
    return grouped


def delete_row(course_id: str, field: str) -> dict:
    """DELETE kb_curation WHERE course_id = X AND field = Y."""
    qs = urllib.parse.urlencode({
        "course_id": f"eq.{course_id}",
        "field": f"eq.{field}",
    })
    req = urllib.request.Request(
        f"{URL}/rest/v1/kb_curation?{qs}",
        method="DELETE",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.load(r)
            n = len(body) if isinstance(body, list) else 0
        return {"course_id": course_id, "field": field, "op": "delete",
                "status": "ok", "rows_affected": n}
    except Exception as e:
        return {"course_id": course_id, "field": field, "op": "delete",
                "status": "fail", "error": str(e)[:200]}


def patch_row(old_course_id: str, new_course_id: str, field: str) -> dict:
    """PATCH kb_curation WHERE course_id = old AND field = X, setting
    course_id = new. Per-field rather than per-course_id because the
    primary key is (course_id, field) — if new::field already exists,
    a full PATCH would fail; per-field lets us log per-field outcomes."""
    qs = urllib.parse.urlencode({
        "course_id": f"eq.{old_course_id}",
        "field": f"eq.{field}",
    })
    req = urllib.request.Request(
        f"{URL}/rest/v1/kb_curation?{qs}",
        method="PATCH",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        data=json.dumps({"course_id": new_course_id}).encode("utf-8"),
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.load(r)
            n = len(body) if isinstance(body, list) else 0
        return {"old_course_id": old_course_id, "new_course_id": new_course_id,
                "field": field, "op": "patch", "status": "ok", "rows_affected": n}
    except Exception as e:
        return {"old_course_id": old_course_id, "new_course_id": new_course_id,
                "field": field, "op": "patch", "status": "fail",
                "error": str(e)[:200]}


ROW_COLS = ("value", "reviewer_email", "reviewed_at", "validated_at", "validated_by")


def _before(row):
    """The row as it stood, every column the undo needs to put it back exactly."""
    return {k: (row or {}).get(k) for k in ROW_COLS}


def _next_log_path(folder):
    """supabase_log.json, or supabase_log-<UTC>.json when a run already wrote one: a retry never
    overwrites the first run's before-rows, which are the undo's input."""
    first = os.path.join(folder, "supabase_log.json")
    if not os.path.exists(first):
        return first
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    return os.path.join(folder, f"supabase_log-{stamp}.json")


MATCH_COLS = ("value", "reviewer_email", "reviewed_at")


def _same(row, before):
    """True when a live row is the row as it stood (value, reviewer and save time)."""
    return row is not None and all((row or {}).get(k) == (before or {}).get(k) for k in MATCH_COLS)


def _live_index(grouped):
    return {(r.get("course_id"), r.get("field")): r for rows in grouped.values() for r in rows}


def file_op(op, live):
    """What a planned move did, read from the live rows, never from the write's echo (a request whose response was
    lost may have committed): "landed", "not_landed" (the row is still as it stood at its old key) or "changed" (a
    person or another run changed it since). A keep or a skip is filed as itself."""
    b = op.get("before_row") or {}
    if op.get("op") == "patch":
        at_old = _same(live.get((op["old_course_id"], op["field"])), b)
        at_new = _same(live.get((op["new_course_id"], op["field"])), b)
        return "landed" if at_new and not at_old else ("not_landed" if at_old else "changed")
    if op.get("op") == "delete":
        cur = live.get((op["course_id"], op["field"]))
        return "landed" if cur is None else ("not_landed" if _same(cur, b) else "changed")
    return op.get("op") or "skip"


def _settle(op, filed):
    """The log entry for a filed op: status ok when its move landed (or it was a keep or skip), fail otherwise."""
    op = dict(op, filed=filed)
    if op.get("op") in ("patch", "delete"):
        op["status"] = "ok" if filed == "landed" else "fail"
        op["rows_affected"] = 1 if filed == "landed" else 0
    return op


def plan_moves(renames, merges, existing, families):
    """Every row operation the move will make, decided from one read and nothing written: a list of log entries, each
    with the row as it stood (before_row). Fan-in is planned as it runs: the first source's move claims the target's
    field, so a later sibling's same field is a supersede-delete (run #4's 8x409 lesson)."""
    plan = []
    work = [("rename", o, n) for o, n in renames.items()] + [("merge", o, t) for o, t in merges.items()]
    claimed = {cid: {r.get("field") for r in rows} for cid, rows in existing.items()}
    for kind, old_ut, new_ut in work:
        old_cid, new_cid = f"{KEY_PREFIX}{old_ut}", f"{KEY_PREFIX}{new_ut}"
        rows_for_old = existing.get(old_cid, [])
        if not rows_for_old:
            plan.append({"old_ut": old_ut, "new_ut": new_ut, "kind": kind, "op": "skip",
                         "reason": "no_rows_in_supabase"})
            continue
        target_fields = claimed.setdefault(new_cid, set())
        for row in rows_for_old:
            field = row.get("field") or ""
            base = {"old_ut": old_ut, "new_ut": new_ut, "kind": kind, "field": field, "before_row": _before(row)}
            if field in fold_issuer.FOLD_FIELDS and row.get("value") in families and row.get("value") != new_ut:
                # A saved fold into a family title is a family tag (Sam's ruling C), never this rename's decision: a
                # ruled plan (kb/ruled_renames.py) renamed the title over it. It stays where it is, never moved or
                # deleted; on the old title, which holds no exhibit once the rename lands, readers ignore it.
                plan.append(dict(base, course_id=old_cid, op="keep", status="ok", rows_affected=0,
                                 reason="a fold into a family title: a family tag, left in place"))
            elif field == "unified_title_override" or (
                    field == "unified_title_merge_confirm" and (kind == "merge" or row.get("value") == new_ut)):
                # Decision fulfilled: drop it. A lead's own confirm naming the title it creates (an all-confirmed
                # group) is fulfilled too; moved, it would point at itself.
                plan.append(dict(base, course_id=old_cid, op="delete"))
            elif field in target_fields and (kind == "merge" or field == fold_issuer.RESOLUTION_FIELD):
                # The merge target already carries this field: its curator data wins; a PATCH would violate the
                # (course_id, field) PK.
                plan.append(dict(base, course_id=old_cid, op="delete", superseded_by_target=True))
            else:
                # Curator intent on other fields (issuer, trainer, quality flag, reviewed marker, the family tag)
                # travels with the credential's identity: the new title is the credential, so the row moves to it.
                plan.append(dict(base, old_course_id=old_cid, new_course_id=new_cid, op="patch"))
                target_fields.add(field)
    return plan


def _prior_logs(folder, this_path):
    out = []
    for n in sorted(os.listdir(folder)) if os.path.isdir(folder) else []:
        p = os.path.join(folder, n)
        if n.startswith("supabase_log") and n.endswith(".json") and p != this_path:
            try:
                with open(p, encoding="utf-8") as f:
                    out.append((n, json.load(f)))
            except (OSError, ValueError):
                continue
    return out


def _write_log(path, payload):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    snap = _find_latest_snapshot()
    if not snap:
        sys.exit("No alias_map snapshot found under kb/cred_rename_out/. "
                 "Run kb/_cred_rename_apply.py first.")
    date_stamp, alias_path = snap
    with open(alias_path, encoding="utf-8") as f:
        doc = json.load(f)
    renames = doc.get("renames") or {}
    merges = doc.get("merges") or {}
    if not renames and not merges:
        sys.exit(f"No renames or merges in {alias_path}.")

    print(f"[cred_rename_apply_supabase] {datetime.now(timezone.utc).isoformat()}")
    print(f"  snapshot: {date_stamp} ({len(renames)} renames, {len(merges)} merges)")
    folder = os.path.join(OUT_ROOT, date_stamp)
    log_path = _next_log_path(folder)

    existing = fetch_credential_review_rows()
    print(f"  existing _CREDENTIAL_REVIEW::* course_ids in Supabase: {len(existing)}")
    live = _live_index(existing)

    # A rerun after a partial run: every move an earlier log planned is filed again against this read, and the ones
    # that landed are carried into this log, so the newest log names every move this snapshot made. A move that did
    # not land is planned again below, from the row still at its old key.
    carried, seen = [], set()
    for name, prior in _prior_logs(folder, log_path):
        for e in prior.get("log") or []:
            if e.get("op") not in ("patch", "delete") or not e.get("before_row"):
                continue
            key = (e.get("op"), e.get("course_id") or e.get("old_course_id"), e.get("new_course_id"), e.get("field"))
            filed = file_op(e, live)
            if filed != "not_landed" and key not in seen:
                seen.add(key)
                carried.append(_settle(dict(e, carried_from=name), filed))

    planned = plan_moves(renames, merges, existing, fold_issuer.family_titles(FAMILIES))
    # The receipt before the first write: every planned move with its before_row, so the undo can reverse any of them
    # whatever this run's responses say, even if it dies part-way.
    base = {"alias_map_snapshot": alias_path, "renames_processed": len(renames), "merges_processed": len(merges)}
    _write_log(log_path, dict(base, _state="pending", _planned_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                              log=carried + [dict(o, status="planned") if o["op"] in ("patch", "delete") else o
                                             for o in planned]))

    for o in planned:
        if o["op"] == "delete":
            o["echo"] = delete_row(o["course_id"], o["field"])
        elif o["op"] == "patch":
            res = patch_row(o["old_course_id"], o["new_course_id"], o["field"])
            o["echo"] = res
            if (res.get("status") != "ok" and (o["kind"] == "merge" or o["field"] == fold_issuer.RESOLUTION_FIELD)
                    and "409" in str(res.get("error") or "")):
                # Defensive backstop for live-claim drift (a curator save landing mid-run): the target row exists,
                # so the source row is superseded; drop it instead of stranding an orphan under a dead key.
                o.update(op="delete", course_id=o.pop("old_course_id"), superseded_by_target=True, via="409_fallback")
                o.pop("new_course_id", None)
                o["echo"] = delete_row(o["course_id"], o["field"])

    # File what landed from a fresh read, never from the echoes.
    after = _live_index(fetch_credential_review_rows())
    log, ok, fail, no_op = list(carried), 0, 0, 0
    for o in planned:
        echo = o.pop("echo", None)
        entry = _settle(o, file_op(o, after)) if o["op"] in ("patch", "delete") else o
        if echo is not None:
            entry["echo_status"] = echo.get("status")
            if echo.get("error"):
                entry["echo_error"] = echo["error"]
        log.append(entry)
    for e in log:
        if e.get("op") == "skip":
            no_op += 1
        elif e.get("status") == "ok":
            ok += 1
        else:
            fail += 1

    # The issuer decision is NOT carried here (the #3116 redesign): the fold's one issuer_resolution
    # row per target was written by kb/_cred_fold_resolution_write.py before this step, and every
    # reader resolves the moved rows through fold_issuer.effective_issuer().
    _write_log(log_path, dict(base, _state="filed", _applied_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                              ok=ok, fail=fail, no_op=no_op, carried=len(carried), log=log))
    print(f"  ok={ok}  fail={fail}  no_op_aliases={no_op}  carried_from_earlier_logs={len(carried)}")
    print(f"  log: {log_path}")
    if fail:
        sys.exit(f"{fail} row operations did not land — inspect {log_path}.")


if __name__ == "__main__":
    main()
