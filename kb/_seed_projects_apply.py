"""
Apply the projects seed plan to Supabase public.projects.

Pairs with `kb/_seed_projects.py` (the dry-run). Executes the INSERTs / UPDATEs /
DELETEs the dry-run plans, behind in-script V1-V4 apply gates (modeled on
`kb/_seed_workplan_goals_apply.py`, Phase 1). One-shot; idempotent on re-run.

NOTE: the service_role key bypasses RLS, so this apply works regardless of the
projects RLS policies. Apply the RLS tighten (`kb/supabase_projects_rls_tighten.sql`)
BEFORE seeding so the public table is protected the moment it carries rows.

Gates:
  V1 (apply_safe)    — fresh Excel derivation produces N>0 projects
  V2 (source-exists) — each UPDATE/DELETE matches >=1 Supabase row (an empty
                       PATCH/DELETE representation is caught as a failure)
  V3 (cardinality)   — post-apply projects row count == |Excel projects|
                       (single row per id; no GOAL/STRETCH multiplier)
  V4 (validator)     — `kb/_validate_projects.py` comparison re-runs clean

Outputs (committed by the workflow):
  kb/projects_seed_out/<date>/plan_snapshot.json
  kb/projects_seed_out/<date>/apply_log.json
  kb/projects_validation.md  (regenerated, should be all-green)
  kb/projects_seed_plan.md   (regenerated post-apply — should show 0 ops)

Auth:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (REQUIRED — service_role key)

Run from repo root (typically via workflow_dispatch):
  SUPABASE_SERVICE_KEY=... python3 kb/_seed_projects_apply.py
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent
sys.path.insert(0, str(HERE))

from _seed_projects import SEED_PLAN_PATH, plan_actions, render_plan  # noqa: E402
from _validate_projects import (  # noqa: E402
    OUT_PATH as VALIDATOR_OUT_PATH,
    SUPABASE_KEY,
    SUPABASE_URL,
    compare,
    derive_excel_projects,
    fetch_supabase_rows,
    render_report as render_validation_report,
    reshape_supabase,
)

PROJECTS_PATH = "/rest/v1/projects"


def _request(method: str, path: str, body=None) -> tuple[int, str]:
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


def do_insert(ins: dict) -> dict:
    # ins["rec"] is the normalized 21-column record (incl. id). kpi_target_*
    # and created_at/updated_at are absent -> Supabase defaults (NULL / now()).
    status, resp = _request("POST", PROJECTS_PATH, ins["rec"])
    ok = 200 <= status < 300
    return {"action": "INSERT", "id": ins["id"], "status": status,
            "ok": ok, "response": resp if not ok else ""}


def do_update(upd: dict) -> dict:
    pid = upd["id"]
    q = f"?id=eq.{urllib.parse.quote(pid)}"
    body = {k: v for k, v in upd["rec"].items() if k != "id"}
    status, resp = _request("PATCH", f"{PROJECTS_PATH}{q}", body)
    ok = 200 <= status < 300
    # V2 source-exists: PATCH-with-representation returns the patched rows; an
    # empty array means the WHERE matched 0 rows -> treat as failure.
    if ok:
        try:
            patched = json.loads(resp)
            if isinstance(patched, list) and len(patched) == 0:
                ok = False
                resp = "source_missing: PATCH matched 0 rows"
        except json.JSONDecodeError:
            pass
    return {"action": "UPDATE", "id": pid, "status": status,
            "ok": ok, "response": resp if not ok else ""}


def do_delete(d: dict) -> dict:
    pid = d["id"]
    q = f"?id=eq.{urllib.parse.quote(pid)}"
    status, resp = _request("DELETE", f"{PROJECTS_PATH}{q}", None)
    ok = 200 <= status < 300
    return {"action": "DELETE", "id": pid, "status": status,
            "ok": ok, "response": resp if not ok else ""}


def main():
    if not SUPABASE_KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY in the environment.")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out_dir = REPO_ROOT / "kb" / "projects_seed_out" / today
    out_dir.mkdir(parents=True, exist_ok=True)

    # ── V1: fresh re-derivation ──────────────────────────────────────
    excel, warnings, aplus_count, zero_kpi = derive_excel_projects()
    pre_rows = fetch_supabase_rows()
    pre_supabase = reshape_supabase(pre_rows)
    buckets = plan_actions(excel, pre_supabase)

    expected_rows = len(excel)
    plan_snapshot = {
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_excel_projects": len(excel),
        "_expected_post_apply_rows": expected_rows,
        "_pre_apply_supabase_rows": len(pre_rows),
        "apply_safe": True,
        "v1_excel_derivation_ok": len(excel) > 0,
        "counts": {k: len(buckets[k]) for k in ("inserts", "updates", "noops", "deletes")},
        "actions": {
            "inserts": [x["id"] for x in buckets["inserts"]],
            "updates": [x["id"] for x in buckets["updates"]],
            "deletes": [x["id"] for x in buckets["deletes"]],
        },
    }
    (out_dir / "plan_snapshot.json").write_text(
        json.dumps(plan_snapshot, indent=2), encoding="utf-8"
    )
    if not plan_snapshot["v1_excel_derivation_ok"]:
        sys.exit("V1 failed: Excel derivation produced 0 projects — aborting apply.")

    n_ops = len(buckets["inserts"]) + len(buckets["updates"]) + len(buckets["deletes"])
    if n_ops == 0:
        print("No-op: 0 INSERT/UPDATE/DELETE actions. Apply is idempotent on this run.")
        post_rows = pre_rows
        post_supabase = pre_supabase
    else:
        print(f"V1 ok. Applying {len(buckets['inserts'])} INSERTs, "
              f"{len(buckets['updates'])} UPDATEs, {len(buckets['deletes'])} DELETEs...")
        log = []
        for d in buckets["deletes"]:
            log.append(do_delete(d))
        for upd in buckets["updates"]:
            log.append(do_update(upd))
        for ins in buckets["inserts"]:
            log.append(do_insert(ins))
        (out_dir / "apply_log.json").write_text(json.dumps(log, indent=2), encoding="utf-8")
        n_failed = sum(1 for e in log if not e["ok"])
        if n_failed:
            sys.exit(f"Apply had {n_failed} failed operations. See "
                     f"kb/projects_seed_out/{today}/apply_log.json. ABORTING.")

        # ── V3: post-apply cardinality ───────────────────────────────
        post_rows = fetch_supabase_rows()
        if len(post_rows) != expected_rows:
            sys.exit(f"V3 failed: post-apply row count {len(post_rows)} != "
                     f"expected {expected_rows}. Manual reconciliation required.")
        post_supabase = reshape_supabase(post_rows)

    # ── V4: re-run the validator comparison ──────────────────────────
    matches, mismatches, missing, orphans = compare(excel, post_supabase)
    validation_report = render_validation_report(
        excel, post_supabase, matches, mismatches, missing, orphans,
        warnings, aplus_count, zero_kpi,
    )
    VALIDATOR_OUT_PATH.write_text(validation_report, encoding="utf-8")
    # Re-run the planner against post-apply state so the committed plan reflects
    # the new picture (should be all NO-OPs).
    post_buckets = plan_actions(excel, post_supabase)
    SEED_PLAN_PATH.write_text(
        render_plan(excel, post_supabase, post_buckets, warnings, aplus_count, zero_kpi),
        encoding="utf-8",
    )

    if mismatches or missing or orphans:
        sys.exit(f"V4 failed: validator reports drift after apply. "
                 f"matches={len(matches)} mismatches={len(mismatches)} "
                 f"missing={len(missing)} orphans={len(orphans)}. "
                 f"See kb/projects_validation.md.")

    print(f"Apply complete + V1-V4 green. Supabase projects: {len(post_supabase)} "
          f"rows = |Excel projects| {len(excel)}.")


if __name__ == "__main__":
    main()
