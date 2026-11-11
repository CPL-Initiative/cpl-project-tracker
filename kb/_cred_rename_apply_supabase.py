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

  Then the issuer carry (kb/fold_issuer.py, #3110 build step 1): for each fold
  group where a person's explicit issuer won, the target's
  issuing_agency_override is set to that value in the reference spelling,
  under that person's reviewer_email and reviewed_at. Without it a person's
  issuer on a merge source was dropped whenever the target already carried an
  override (Heating and Air Conditioning, 2026-11-11). Every logged op carries
  the row as it stood (before_row), so kb/_cred_rename_undo.py --supabase-plan
  can write the reversal.

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
import fold_issuer  # noqa: E402

OUT_ROOT = os.path.join(HERE, "cred_rename_out")
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


def _guard_qs(course_id, field, before):
    """PostgREST filters matching the exact row read: course_id and field, plus its value and stamp."""
    q = {"course_id": f"eq.{course_id}", "field": f"eq.{field}"}
    if before is not None:
        v = before.get("value")
        q["value"] = "is.null" if v is None else f"eq.{v}"
        if before.get("reviewed_at"):
            q["reviewed_at"] = f"eq.{before['reviewed_at']}"
    return urllib.parse.urlencode(q)


def read_row(course_id: str, field: str):
    """The one row as it is now (the write-time read, CLAUDE.md Rule 10), or None."""
    qs = urllib.parse.urlencode({"select": "course_id,field," + ",".join(ROW_COLS),
                                 "course_id": f"eq.{course_id}", "field": f"eq.{field}"})
    req = urllib.request.Request(f"{URL}/rest/v1/kb_curation?{qs}",
                                 headers={"apikey": KEY, "Authorization": f"Bearer {KEY}",
                                          "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.load(r) or []
    return rows[0] if rows else None


def guarded_write(op: str, course_id: str, field: str, before, body=None) -> dict:
    """One carry write, guarded on the row it read. op: "update" (PATCH body where the row still holds
    before's value and stamp), "delete" (the same guard), or "insert" (POST, nothing on conflict).
    rows_affected 0 means the row changed since the read: status "conflict", nothing written."""
    hdr = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Prefer": "return=representation"}
    if op == "insert":
        req = urllib.request.Request(
            f"{URL}/rest/v1/kb_curation", method="POST",
            headers=dict(hdr, **{"Content-Type": "application/json",
                                 "Prefer": "return=representation,resolution=ignore-duplicates"}),
            data=json.dumps({"course_id": course_id, "field": field, **(body or {})}).encode("utf-8"))
    else:
        req = urllib.request.Request(
            f"{URL}/rest/v1/kb_curation?{_guard_qs(course_id, field, before)}",
            method="PATCH" if op == "update" else "DELETE",
            headers=dict(hdr, **({"Content-Type": "application/json"} if op == "update" else {})),
            data=json.dumps(body).encode("utf-8") if op == "update" else None)
    out = {"course_id": course_id, "field": field, "op": "issuer_" + op}
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            got = json.load(r)
            n = len(got) if isinstance(got, list) else 0
    except Exception as e:
        return dict(out, status="fail", error=str(e)[:200])
    if not n:
        return dict(out, status="conflict", rows_affected=0,
                    reason="the row changed since it was read; left as it is")
    return dict(out, status="ok", rows_affected=n, after_row=body)


def _next_log_path(folder):
    """supabase_log.json, or supabase_log-<UTC>.json when a run already wrote one: a retry never
    overwrites the first run's before-rows, which are the undo's input."""
    first = os.path.join(folder, "supabase_log.json")
    if not os.path.exists(first):
        return first
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    return os.path.join(folder, f"supabase_log-{stamp}.json")


def _carry_write(log, counts, cid, field, before, op, body=None, **why):
    """Re-read the row, write only if it is still the row the decision was made on, and log it."""
    try:
        fresh = read_row(cid, field)
    except Exception as e:
        res = {"course_id": cid, "field": field, "op": "issuer_" + op, "status": "fail",
               "error": "write-time read failed: " + str(e)[:160]}
    else:
        if _before(fresh) != _before(before) if before is not None else fresh is not None:
            res = {"course_id": cid, "field": field, "op": "issuer_" + op, "status": "conflict",
                   "rows_affected": 0, "reason": "the row changed since the pre-fetch; left as it is",
                   "now_row": _before(fresh) if fresh else None}
        else:
            res = guarded_write(op, cid, field, before, body)
    res["before_row"] = _before(before) if before is not None else None
    res.update(why)
    log.append({"kind": "issuer", **res})
    counts[res["status"]] = counts.get(res["status"], 0) + 1
    return res


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
    log_path = _next_log_path(os.path.join(OUT_ROOT, date_stamp))

    log = []
    counts = {}
    no_op = 0

    def write_log(extra=None):
        payload = {
            "_applied_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "alias_map_snapshot": alias_path,
            "renames_processed": len(renames),
            "merges_processed": len(merges),
            "ok": counts.get("ok", 0),
            "fail": counts.get("fail", 0),
            "conflict": counts.get("conflict", 0),
            "no_op": no_op,
            "log": log,
        }
        payload.update(extra or {})
        with open(log_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
            f.write("\n")

    try:
        existing = fetch_credential_review_rows()
    except Exception as e:
        write_log({"fetch_failed": str(e)[:300]})
        sys.exit(f"kb_curation read failed, nothing written: {e}")
    print(f"  existing _CREDENTIAL_REVIEW::* course_ids in Supabase: {len(existing)}")

    # (kind, old, new): merges additionally drop the fulfilled merge-confirm
    # row and never PATCH into a field the target already carries.
    work = [("rename", o, n) for o, n in renames.items()] \
         + [("merge", o, t) for o, t in merges.items()]
    # LIVE per-target field claims. Seeded from the pre-fetch, updated as
    # PATCHes land — several sources folding into ONE target (fan-in) is
    # normal for confirmed merges, and the first source's PATCH creates the
    # target row the pre-fetch never saw. A static set 409'd every later
    # sibling (run #4, 2026-07-08: the 4-source ASE A6 fold, 8 fails).
    claimed = {cid: {r.get("field") for r in rows}
               for cid, rows in existing.items()}
    # LIVE rows by course_id and field, moved as PATCHes land (the issuer carry reads the target's),
    # and which target fields this run moved in: rules 2 and 2b act only on those, never on the
    # target's own pre-existing rows (which the JSON fold keeps too).
    live = {cid: {r.get("field"): dict(r) for r in rows} for cid, rows in existing.items()}
    moved = {}
    for kind, old_ut, new_ut in work:
        old_cid = f"{KEY_PREFIX}{old_ut}"
        new_cid = f"{KEY_PREFIX}{new_ut}"
        rows_for_old = existing.get(old_cid, [])
        if not rows_for_old:
            no_op += 1
            log.append({"old_ut": old_ut, "new_ut": new_ut, "kind": kind,
                        "op": "skip", "reason": "no_rows_in_supabase"})
            continue
        target_fields = claimed.setdefault(new_cid, set())
        for row in rows_for_old:
            field = row.get("field") or ""
            if field == "unified_title_override" or (
                    field == "unified_title_merge_confirm"
                    and (kind == "merge" or row.get("value") == new_ut)):
                # Decision fulfilled — drop it. A lead's own confirm naming the title it creates
                # (an all-confirmed group) is fulfilled too; moved, it would point at itself.
                res = delete_row(old_cid, field)
            elif kind == "merge" and field in target_fields:
                # The merge target already carries this field — its curator
                # data wins; a PATCH would violate the (course_id, field) PK.
                res = delete_row(old_cid, field)
                res["superseded_by_target"] = True
            else:
                # Migrate non-rename override to the new key (curator intent
                # on issuer/trainer/quality_flag/reviewed_marker travels with
                # the credential's identity).
                res = patch_row(old_cid, new_cid, field)
                if res.get("status") == "ok":
                    target_fields.add(field)
                elif kind == "merge" and "409" in str(res.get("error") or ""):
                    # Defensive backstop for live-claim drift (e.g. a curator
                    # save landing mid-run): the target row exists, so the
                    # source row is superseded — drop it instead of stranding
                    # an orphan under a dead key.
                    res = delete_row(old_cid, field)
                    res["superseded_by_target"] = True
                    res["via"] = "409_fallback"
                    target_fields.add(field)
            # The row as it stood, so kb/_cred_rename_undo.py --supabase-plan can put it back.
            res["before_row"] = _before(row)
            if res.get("op") == "patch" and res.get("status") == "ok":
                live.setdefault(new_cid, {})[field] = dict(row, course_id=new_cid)
                moved.setdefault(new_cid, set()).add(field)
            log.append({"old_ut": old_ut, "new_ut": new_ut, "kind": kind, **res})
            st = res.get("status") if res.get("status") == "ok" else "fail"
            counts[st] = counts.get(st, 0) + 1

    # ── Issuer precedence carry (kb/fold_issuer.py, #3110 build step 1) ──
    # The JSON apply froze each fold group's decision into the snapshot. Every
    # write below re-reads its row first and is guarded on the value and stamp
    # it read (Rule 10: a person's newer edit always wins); a row that changed
    # is left alone and logged as a conflict. Each write logs the before-row.
    for target, g in sorted((doc.get("issuer_resolution") or {}).items()):
        res_ = g.get("resolution") or {}
        rule = res_.get("rule")
        cid = f"{KEY_PREFIX}{target}"
        rows = live.get(cid) or {}
        mine = moved.get(cid) or set()
        if rule in ("cert-form", "standards"):
            # Rules 2 and 2b drop an issuer from the target. An override naming it that this fold moved
            # onto the target would put it back at the next sync, so it goes too.
            cur = rows.get("issuing_agency_override")
            if cur and "issuing_agency_override" in mine and fold_issuer.drop_issuer(res_, cur.get("value")):
                _carry_write(log, counts, cid, "issuing_agency_override", cur, "delete", dropped_by_rule=rule)
        if rule == "reviewer" and res_.get("winner"):
            win = res_.get("winner_from") or {}
            cur = rows.get("issuing_agency_override")
            if cur and cur.get("value") == res_["winner"]:
                log.append({"kind": "issuer", "course_id": cid, "op": "skip",
                            "reason": "target override already the winner"})
            elif (cur and fold_issuer.is_person(cur.get("reviewer_email"))
                  and fold_issuer.ts(cur.get("reviewed_at")) > fold_issuer.ts(win.get("at"))):
                log.append({"kind": "issuer", "course_id": cid, "op": "skip", "status": "conflict",
                            "reason": "a person saved this override after the winner; the newer edit wins",
                            "before_row": _before(cur)})
                counts["conflict"] = counts.get("conflict", 0) + 1
            else:
                body = {"value": res_["winner"], "reviewer_email": win.get("by"),
                        "reviewed_at": win.get("at")}
                _carry_write(log, counts, cid, "issuing_agency_override", cur,
                             "update" if cur else "insert", body, winner_from_title=win.get("title"))
        if rule in ("reviewer", "cert-form", "standards"):
            # The additional override carries issuers too, and the next sync appends every one of them:
            # keep only the parts the resolution keeps. Rules 2 and 2b touch only a row this fold moved.
            cur = rows.get("issuing_agency_additional_override")
            if cur and (rule == "reviewer" or "issuing_agency_additional_override" in mine):
                parts = [p.strip() for p in (cur.get("value") or "").split("|") if p.strip()]
                kept = [p for p in parts if fold_issuer.keep_part(res_, p)]
                if kept != parts:
                    if kept:
                        body = {"value": " | ".join(kept), "reviewer_email": cur.get("reviewer_email"),
                                "reviewed_at": cur.get("reviewed_at")}
                        _carry_write(log, counts, cid, "issuing_agency_additional_override", cur, "update",
                                     body, dropped_parts=[p for p in parts if p not in kept], rule=rule)
                    else:
                        _carry_write(log, counts, cid, "issuing_agency_additional_override", cur, "delete",
                                     dropped_parts=parts, rule=rule)

    write_log()
    ok, fail, conflict = counts.get("ok", 0), counts.get("fail", 0), counts.get("conflict", 0)
    print(f"  ok={ok}  fail={fail}  conflict={conflict}  no_op_aliases={no_op}")
    print(f"  log: {log_path}")
    if fail or conflict:
        sys.exit(f"{fail} row operation(s) failed and {conflict} left for a newer edit — inspect {log_path}. "
                 f"The kb files and kb_curation may disagree until a person settles them.")


if __name__ == "__main__":
    main()
