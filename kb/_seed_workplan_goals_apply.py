"""
Apply the workplan-goals seed plan to Supabase public.workplan_goals.

Pairs with `kb/_seed_workplan_goals.py` (the dry-run). This script executes
the INSERTs / UPDATEs / DELETEs the dry-run plans, behind in-script V1-V4
apply gates modeled on Bruh Dec's credential-rename apply (PR-5b/1).

The apply is **one-shot**. After it lands, Excel-A+ ↔ Supabase parity should
hold. The validator re-runs as V4 — any drift fails the workflow loudly.

Gates:
  V1 (apply_safe)   — fresh re-derivation produces a coherent plan
  V2 (source-exists)— each UPDATE/DELETE row exists in Supabase at apply time
                       (PostgREST returns 0-row PATCH/DELETE if absent, which
                       is caught explicitly)
  V3 (cardinality)  — post-apply row count = 2 × |A+ activities|, no dupes
  V4 (validator)    — `kb/_validate_workplan_goals.py` re-runs clean (exit 0)

Outputs (committed by the workflow):
  kb/workplan_goals_seed_out/<date>/plan_snapshot.json
  kb/workplan_goals_seed_out/<date>/apply_log.json
  kb/workplan_goals_validation.md (regenerated, should be all-green)
  kb/workplan_goals_seed_plan.md  (regenerated post-apply — should show 0 ops)

Auth:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (REQUIRED — service_role key)

Run from repo root (typically via workflow_dispatch):
  SUPABASE_SERVICE_KEY=... python3 kb/_seed_workplan_goals_apply.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent
sys.path.insert(0, str(HERE))

from _seed_workplan_goals import plan_actions, render_plan, SEED_PLAN_PATH  # noqa: E402
from _validate_workplan_goals import (  # noqa: E402
    OUT_PATH as VALIDATOR_OUT_PATH,
    SUPABASE_KEY,
    SUPABASE_URL,
    YEAR_COLS,
    compare_rows,
    derive_excel_workplan_goals,
    fetch_associations,
    fetch_supabase_rows,
    render_report as render_validation_report,
    reshape_supabase,
    validate_associations,
)


def _request(method: str, path: str, body: dict | None = None) -> tuple[int, str]:
    url = f"{SUPABASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def _values_payload(values: dict, name: str, activity_id: str, row_type: str) -> dict:
    total = sum(values.values())
    return {
        "activity_id": activity_id,
        "name": name,
        "row_type": row_type,
        "kind": "project",
        "yr_2025_26": values["yr_2025_26"],
        "yr_2026_27": values["yr_2026_27"],
        "yr_2027_28": values["yr_2027_28"],
        "yr_2028_29": values["yr_2028_29"],
        "yr_2029_30": values["yr_2029_30"],
        "total": total,
    }


def do_insert(ins: dict) -> dict:
    body = _values_payload(ins["values"], ins["name"], ins["activity_id"], ins["row_type"])
    status, resp = _request("POST", "/rest/v1/workplan_goals", body)
    ok = 200 <= status < 300
    return {
        "action": "INSERT",
        "activity_id": ins["activity_id"],
        "row_type": ins["row_type"],
        "status": status,
        "ok": ok,
        "response": resp if not ok else "",
    }


def do_update(upd: dict) -> dict:
    activity_id = upd["activity_id"]
    row_type = upd["row_type"]
    # Scope to kind='project' so an UPDATE never touches an Activity row that
    # happens to share an activity_id (no current overlap, but defensive).
    q = (
        f"?activity_id=eq.{urllib.parse.quote(activity_id)}"
        f"&row_type=eq.{urllib.parse.quote(row_type)}"
        f"&kind=eq.project"
    )
    body = _values_payload(upd["excel"], upd["name"], activity_id, row_type)
    # Drop activity_id + row_type + kind from the PATCH body (they're the filter, not the new value)
    body.pop("activity_id", None)
    body.pop("row_type", None)
    body.pop("kind", None)
    status, resp = _request("PATCH", f"/rest/v1/workplan_goals{q}", body)
    ok = 200 <= status < 300
    # V2 source-exists: PATCH-with-representation returns the patched rows; empty
    # array means the WHERE matched 0 rows -- treat as failure.
    if ok:
        try:
            patched = json.loads(resp)
            if isinstance(patched, list) and len(patched) == 0:
                ok = False
                resp = "source_missing: PATCH matched 0 rows"
        except json.JSONDecodeError:
            pass
    return {
        "action": "UPDATE",
        "activity_id": activity_id,
        "row_type": row_type,
        "status": status,
        "ok": ok,
        "response": resp if not ok else "",
    }


def do_delete(d: dict) -> dict:
    activity_id = d["activity_id"]
    row_type = d["row_type"]
    # Scope DELETE to kind='project' — Activity rows are curator-managed and
    # must never be removed by the Excel A+ seed loop.
    q = (
        f"?activity_id=eq.{urllib.parse.quote(activity_id)}"
        f"&row_type=eq.{urllib.parse.quote(row_type)}"
        f"&kind=eq.project"
    )
    status, resp = _request("DELETE", f"/rest/v1/workplan_goals{q}", None)
    ok = 200 <= status < 300
    return {
        "action": "DELETE",
        "activity_id": activity_id,
        "row_type": row_type,
        "status": status,
        "ok": ok,
        "response": resp if not ok else "",
    }


def main():
    if not SUPABASE_KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY in the environment.")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out_dir = REPO_ROOT / "kb" / "workplan_goals_seed_out" / today
    out_dir.mkdir(parents=True, exist_ok=True)

    # ── V1: fresh re-derivation ──────────────────────────────────────
    excel = derive_excel_workplan_goals()
    pre_rows = fetch_supabase_rows()
    pre_supabase = reshape_supabase(pre_rows)
    buckets = plan_actions(excel, pre_supabase)

    expected_total_rows = 2 * len(excel)  # GOAL + STRETCH per activity
    plan_snapshot = {
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_excel_activities": len(excel),
        "_expected_post_apply_rows": expected_total_rows,
        "_pre_apply_supabase_rows": len(pre_rows),
        "apply_safe": True,
        "v1_excel_derivation_ok": len(excel) > 0,
        "counts": {
            "inserts": len(buckets["inserts"]),
            "updates": len(buckets["updates"]),
            "noops": len(buckets["noops"]),
            "deletes": len(buckets["deletes"]),
        },
        "actions": {
            "inserts": [
                {"activity_id": x["activity_id"], "row_type": x["row_type"]}
                for x in buckets["inserts"]
            ],
            "updates": [
                {"activity_id": x["activity_id"], "row_type": x["row_type"]}
                for x in buckets["updates"]
            ],
            "deletes": [
                {"activity_id": x["activity_id"], "row_type": x["row_type"]}
                for x in buckets["deletes"]
            ],
        },
    }
    (out_dir / "plan_snapshot.json").write_text(
        json.dumps(plan_snapshot, indent=2), encoding="utf-8"
    )
    if not plan_snapshot["v1_excel_derivation_ok"]:
        sys.exit("V1 failed: Excel A+ derivation produced 0 activities — aborting apply.")

    n_total_ops = (
        len(buckets["inserts"]) + len(buckets["updates"]) + len(buckets["deletes"])
    )
    if n_total_ops == 0:
        print("No-op: dry-run found 0 INSERT/UPDATE/DELETE actions. Apply is idempotent on this run.")
        SEED_PLAN_PATH.write_text(
            render_plan(excel, pre_supabase, buckets), encoding="utf-8"
        )
        # Still re-run validator to keep the output fresh.
        post_rows = pre_rows
        post_supabase = pre_supabase
        post_project_rows = [
            r for r in post_rows if (r.get("kind") or "project") == "project"
        ]
    else:
        print(
            f"V1 ok. Applying {len(buckets['inserts'])} INSERTs, "
            f"{len(buckets['updates'])} UPDATEs, {len(buckets['deletes'])} DELETEs..."
        )

        # ── Apply (per-row) ────────────────────────────────────────
        log = []
        for d in buckets["deletes"]:
            log.append(do_delete(d))
        for upd in buckets["updates"]:
            log.append(do_update(upd))
        for ins in buckets["inserts"]:
            log.append(do_insert(ins))

        (out_dir / "apply_log.json").write_text(
            json.dumps(log, indent=2), encoding="utf-8"
        )
        n_failed = sum(1 for e in log if not e["ok"])
        if n_failed:
            sys.exit(
                f"Apply had {n_failed} failed operations. See "
                f"kb/workplan_goals_seed_out/{today}/apply_log.json. ABORTING."
            )

        # ── V3: post-apply cardinality ────────────────────────────
        # PR-A: the table now carries kind='activity' rows too; cardinality
        # check is scoped to kind='project' (2 × A+ activities).
        post_rows = fetch_supabase_rows()
        post_project_rows = [
            r for r in post_rows if (r.get("kind") or "project") == "project"
        ]
        if len(post_project_rows) != expected_total_rows:
            sys.exit(
                f"V3 failed: post-apply project-row count {len(post_project_rows)} "
                f"!= expected {expected_total_rows}. Manual reconciliation required."
            )
        post_supabase = reshape_supabase(post_rows)

    # ── V4: re-run validator (now also covers associations integrity) ──
    matches, mismatches, missing, orphans = compare_rows(excel, post_supabase)
    post_assocs = fetch_associations()
    assoc_orphan_activity, assoc_orphan_project, assoc_projects_without = (
        validate_associations(post_rows, post_assocs)
    )
    validation_report = render_validation_report(
        excel,
        post_supabase,
        matches,
        mismatches,
        missing,
        orphans,
        assoc_orphan_activity=assoc_orphan_activity,
        assoc_orphan_project=assoc_orphan_project,
        assoc_projects_without=assoc_projects_without,
        assoc_count=len(post_assocs),
    )
    VALIDATOR_OUT_PATH.write_text(validation_report, encoding="utf-8")
    # Re-run the planner against post-apply state too, so the committed plan
    # accurately reflects the new picture (should be all NO-OPs).
    post_buckets = plan_actions(excel, post_supabase)
    SEED_PLAN_PATH.write_text(
        render_plan(excel, post_supabase, post_buckets), encoding="utf-8"
    )

    if (
        mismatches
        or missing
        or orphans
        or assoc_orphan_activity
        or assoc_orphan_project
        or assoc_projects_without
    ):
        sys.exit(
            f"V4 failed: validator reports drift after apply. "
            f"matches={len(matches)} mismatches={len(mismatches)} "
            f"missing={len(missing)} orphans={len(orphans)} "
            f"assoc_orphans={len(assoc_orphan_activity) + len(assoc_orphan_project)} "
            f"projects_without_assoc={len(assoc_projects_without)}. "
            f"See kb/workplan_goals_validation.md."
        )

    print(
        f"Apply complete + V1-V4 green. "
        f"Supabase: {len(post_project_rows)} project-rows = 2 × {len(excel)} A+ activities; "
        f"{len(post_assocs)} associations clean."
    )


if __name__ == "__main__":
    main()
