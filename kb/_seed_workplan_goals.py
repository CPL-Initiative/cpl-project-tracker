"""
Compose the seed plan for migrating workplan-goals from Excel A+ derivation
into Supabase public.workplan_goals as source-of-truth.

This is the dry-run-only sibling of `kb/_validate_workplan_goals.py`. It produces
`kb/workplan_goals_seed_plan.md` — a human-reviewable INSERT/UPDATE/DELETE plan
that Sam eyeballs before any actual apply ships in a later PR. NO WRITES.

Auth + offline mode mirror the validator (SUPABASE_SERVICE_KEY env or
--supabase-json PATH).

Run from repo root:
  python3 kb/_seed_workplan_goals.py --supabase-json /tmp/wpg.json
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Reuse the validator's derivation + Supabase fetch.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _validate_workplan_goals import (  # noqa: E402
    EPS,
    OUT_PATH as VALIDATOR_OUT_PATH,
    REPO_ROOT,
    YEAR_COLS,
    derive_excel_workplan_goals,
    fetch_supabase_rows,
    fmt_num,
    parse_num,
    read_supabase_json,
    reshape_supabase,
)

SEED_PLAN_PATH = REPO_ROOT / "kb" / "workplan_goals_seed_plan.md"


def plan_actions(excel: dict, supabase: dict) -> dict[str, list]:
    """
    Bucket the per-(activity_id, row_type) actions:
      INSERT   — A+ has it, Supabase doesn't
      UPDATE   — both have it, at least one year cell differs
      NO-OP    — both have it, every year cell matches
      DELETE   — Supabase has it, A+ doesn't
    """
    inserts, updates, noops, deletes = [], [], [], []

    for pid, ex_data in excel.items():
        sb_data = supabase.get(pid, {})
        for row_type in ("GOAL", "STRETCH"):
            ex_row = ex_data[row_type]
            sb_row = sb_data.get(row_type)
            if sb_row is None:
                inserts.append(
                    {
                        "activity_id": pid,
                        "name": ex_data["name"],
                        "row_type": row_type,
                        "values": ex_row,
                        "total": sum(ex_row.values()),
                    }
                )
                continue
            diffs = []
            for yr_key, yr_label, *_ in YEAR_COLS:
                ev = ex_row.get(yr_key, 0.0)
                sv = sb_row.get(yr_key, 0.0)
                if abs(ev - sv) >= EPS:
                    diffs.append({"year": yr_label, "yr_key": yr_key, "from": sv, "to": ev})
            entry = {
                "activity_id": pid,
                "name": ex_data["name"],
                "supabase_name": sb_data.get("name", ""),
                "row_type": row_type,
                "excel": ex_row,
                "supabase": sb_row,
                "diffs": diffs,
                "name_drift": (
                    sb_data.get("name") and sb_data.get("name") != ex_data["name"]
                ),
            }
            if diffs or entry["name_drift"]:
                updates.append(entry)
            else:
                noops.append(entry)

    for aid, sb_data in supabase.items():
        if aid in excel:
            continue
        for row_type, sb_row in sb_data.items():
            if row_type == "name":
                continue
            deletes.append(
                {
                    "activity_id": aid,
                    "name": sb_data.get("name", ""),
                    "row_type": row_type,
                    "supabase": sb_row,
                }
            )

    return {
        "inserts": inserts,
        "updates": updates,
        "noops": noops,
        "deletes": deletes,
    }


def render_plan(excel: dict, supabase: dict, buckets: dict) -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    n_ins = len(buckets["inserts"])
    n_upd = len(buckets["updates"])
    n_noop = len(buckets["noops"])
    n_del = len(buckets["deletes"])

    L = []
    L += [
        "---",
        "title: Workplan Goals — Supabase Seed Plan (Dry-Run)",
        f"date: {today}",
        "tags: [workplan-goals, supabase, excel-migration, seed-plan, phase-1]",
        "related:",
        "  - kb/_seed_workplan_goals.py (this generator)",
        "  - kb/_validate_workplan_goals.py (the diff)",
        "  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)",
        "  - public.workplan_goals (Supabase target)",
        "---",
        "",
        "# Workplan Goals — Supabase Seed Plan",
        "",
        f"**Dry-run.** Generated {today}. No writes executed.",
        "",
        "Excel A+ derivation is the source-of-truth for this seed: every Project "
        "List row with at least one non-zero KPI cell, excluding `D.*` "
        "dashboard-metric rows. The plan below shows what `kb/_seed_workplan_goals.py "
        "--apply` (lands in a later PR) would do.",
        "",
        "## Summary",
        "",
        f"- A+-derived activities in Excel: **{len(excel)}**",
        f"- Existing rows in Supabase: **{sum(1 for d in supabase.values() for k in d if k != 'name')}**",
        f"- **INSERT**: {n_ins} new (activity_id, row_type) rows",
        f"- **UPDATE**: {n_upd} existing rows (Excel value(s) differ)",
        f"- **NO-OP**: {n_noop} existing rows already match A+",
        f"- **DELETE**: {n_del} Supabase rows whose activity_id is no longer in A+",
        "",
    ]

    if buckets["inserts"]:
        L += ["## INSERT — new rows", ""]
        L += ["| activity_id | name | row_type | 25-26 | 26-27 | 27-28 | 28-29 | 29-30 | total |"]
        L += ["|---|---|---|---:|---:|---:|---:|---:|---:|"]
        for ins in buckets["inserts"]:
            v = ins["values"]
            row = (
                f"| `{ins['activity_id']}` | {ins['name']} | {ins['row_type']} | "
                f"{fmt_num(v['yr_2025_26'])} | {fmt_num(v['yr_2026_27'])} | "
                f"{fmt_num(v['yr_2027_28'])} | {fmt_num(v['yr_2028_29'])} | "
                f"{fmt_num(v['yr_2029_30'])} | {fmt_num(ins['total'])} |"
            )
            L.append(row)
        L.append("")

    if buckets["updates"]:
        L += [
            "## UPDATE — value (and sometimes name) drift",
            "",
            "Per-row: Excel A+ values overwrite Supabase. Name updates also applied "
            "when the row name has drifted.",
            "",
        ]
        for upd in buckets["updates"]:
            heading_extra = ""
            if upd["name_drift"]:
                heading_extra = (
                    f" *(name change: \"{upd['supabase_name']}\" → \"{upd['name']}\")*"
                )
            L.append(f"### `{upd['activity_id']}` — {upd['name']} — {upd['row_type']}{heading_extra}")
            L.append("")
            if upd["diffs"]:
                L.append("| year | Supabase (now) | Excel A+ (after) | Δ |")
                L.append("|---|---:|---:|---:|")
                for yr_key, yr_label, *_ in YEAR_COLS:
                    ev = upd["excel"].get(yr_key, 0.0)
                    sv = upd["supabase"].get(yr_key, 0.0)
                    delta = ev - sv
                    marker = "" if abs(delta) < EPS else " ⚠"
                    L.append(
                        f"| {yr_label} | {fmt_num(sv)} | {fmt_num(ev)} | {fmt_num(delta)}{marker} |"
                    )
            else:
                L.append("_(value cells match; only name field updates)_")
            L.append("")

    if buckets["deletes"]:
        L += [
            "## DELETE — Supabase rows not in A+",
            "",
            "These activity_ids no longer appear in the Excel A+ derivation. They'll "
            "be removed from Supabase so the table reflects the canonical set.",
            "",
            "| activity_id | name | row_type | 25-26 | 26-27 | 27-28 | 28-29 | 29-30 |",
            "|---|---|---|---:|---:|---:|---:|---:|",
        ]
        for d in buckets["deletes"]:
            v = d["supabase"]
            L.append(
                f"| `{d['activity_id']}` | {d['name']} | {d['row_type']} | "
                f"{fmt_num(v['yr_2025_26'])} | {fmt_num(v['yr_2026_27'])} | "
                f"{fmt_num(v['yr_2027_28'])} | {fmt_num(v['yr_2028_29'])} | "
                f"{fmt_num(v['yr_2029_30'])} |"
            )
        L.append("")

    if buckets["noops"]:
        L += [
            "## NO-OP — already in sync",
            "",
            "These rows already match A+; the seed will leave them untouched.",
            "",
        ]
        for n in buckets["noops"]:
            L.append(f"- `{n['activity_id']}` {n['row_type']} — {n['name']}")
        L.append("")

    L += [
        "## How this applies",
        "",
        "When `kb/_seed_workplan_goals.py --apply` lands (next PR):",
        "",
        "1. Per-row INSERT for each row in the INSERT bucket.",
        "2. Per-row UPDATE for each row in the UPDATE bucket — value cells + name.",
        "3. Per-row DELETE for each row in the DELETE bucket.",
        "4. NO-OP rows are skipped.",
        "5. Re-run `kb/_validate_workplan_goals.py` post-apply — exit code 0 confirms parity.",
        "",
        f"Re-generate this plan: `python3 kb/_seed_workplan_goals.py`",
        "",
    ]

    return "\n".join(L)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--supabase-json",
        type=Path,
        default=None,
        help="Read Supabase rows from this JSON file instead of fetching via REST.",
    )
    args = parser.parse_args()

    rows = (
        read_supabase_json(args.supabase_json)
        if args.supabase_json
        else fetch_supabase_rows()
    )

    excel = derive_excel_workplan_goals()
    supabase = reshape_supabase(rows)
    buckets = plan_actions(excel, supabase)

    plan = render_plan(excel, supabase, buckets)
    SEED_PLAN_PATH.write_text(plan, encoding="utf-8")

    print(f"wrote {SEED_PLAN_PATH.relative_to(REPO_ROOT)}")
    print(
        f"  INSERT={len(buckets['inserts'])} "
        f"UPDATE={len(buckets['updates'])} "
        f"NO-OP={len(buckets['noops'])} "
        f"DELETE={len(buckets['deletes'])}"
    )


if __name__ == "__main__":
    main()
