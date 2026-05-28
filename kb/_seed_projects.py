"""
Compose the seed plan for migrating projects from Excel into Supabase
public.projects as source-of-truth. Dry-run-only sibling of
`kb/_validate_projects.py` — produces `kb/projects_seed_plan.md`, a
human-reviewable INSERT / UPDATE / NO-OP / DELETE plan Sam eyeballs before any
apply ships. NO WRITES. Mirrors `kb/_seed_workplan_goals.py` (Phase 1).

Projects-table unit (Sam's call 2026-05-28): every real project in the Project
List (every row minus `D.*`), INCLUDING the qualitative zero-KPI cards. The A+
(non-zero-KPI) count is reported for cross-reference only — that's the
workplan_goals unit, deliberately narrower.

Auth + offline mode mirror the validator (SUPABASE_SERVICE_KEY env or
--supabase-json PATH).

Run from repo root:
  python3 kb/_seed_projects.py --supabase-json archive/projects_supabase_<date>_pre-seed.json
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

# Reuse the validator's derivation + Supabase fetch + normalization (DRY).
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _validate_projects import (  # noqa: E402
    FIELD_MAP,
    REPO_ROOT,
    _eq,
    _read_snapshot_rows,
    derive_excel_projects,
    fetch_supabase_rows,
    fmt_val,
    reshape_supabase,
)

SEED_PLAN_PATH = REPO_ROOT / "kb" / "projects_seed_plan.md"


def plan_actions(excel: dict, supabase: dict) -> dict[str, list]:
    """
    Bucket per-project actions (projects are single-row-per-id; no GOAL/STRETCH
    split like workplan_goals):
      INSERT — Excel has the project, Supabase doesn't
      UPDATE — both have it, ≥1 mapped column differs
      NO-OP  — both have it, every mapped column matches
      DELETE — Supabase has it, Excel doesn't
    """
    inserts, updates, noops, deletes = [], [], [], []

    for pid, ex in excel.items():
        sb = supabase.get(pid)
        if sb is None:
            inserts.append({"id": pid, "name": ex.get("name", ""), "rec": ex})
            continue
        diffs = []
        for _ex_key, sb_col, kind in FIELD_MAP:
            ev, sv = ex.get(sb_col), sb.get(sb_col)
            if not _eq(ev, sv, kind):
                diffs.append({"field": sb_col, "from": sv, "to": ev})
        entry = {"id": pid, "name": ex.get("name", ""), "rec": ex,
                 "supabase": sb, "diffs": diffs}
        (updates if diffs else noops).append(entry)

    ex_ids = set(excel)
    for pid, sb in supabase.items():
        if pid not in ex_ids:
            deletes.append({"id": pid, "name": sb.get("name", ""), "supabase": sb})

    return {"inserts": inserts, "updates": updates, "noops": noops, "deletes": deletes}


def render_plan(excel, supabase, buckets, warnings, aplus_count, zero_kpi) -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    n_ins = len(buckets["inserts"])
    n_upd = len(buckets["updates"])
    n_noop = len(buckets["noops"])
    n_del = len(buckets["deletes"])

    L = []
    L += [
        "---",
        "title: Projects — Supabase Seed Plan (Dry-Run)",
        f"date: {today}",
        "tags: [projects, supabase, excel-migration, seed-plan, phase-2]",
        "related:",
        "  - kb/_seed_projects.py (this generator)",
        "  - kb/_validate_projects.py (the diff)",
        "  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)",
        "  - public.projects (Supabase target)",
        "  - docs/kb-notes/phase-2-projects-migration-scope.md",
        "---",
        "",
        "# Projects — Supabase Seed Plan",
        "",
        f"**Dry-run.** Generated {today}. No writes executed.",
        "",
        "The projects-table unit is every real project in the Project List "
        "(every row minus `D.*`), including the qualitative zero-KPI cards "
        "(Sam: keep them, 2026-05-28). The plan below is what "
        "`kb/_seed_projects_apply.py` (PR-3) would do.",
        "",
        "## Summary",
        "",
        f"- Excel real projects: **{len(excel)}** "
        f"(non-zero-KPI A+ cross-ref: {aplus_count}; zero-KPI kept: {len(zero_kpi)})",
        f"- Existing rows in Supabase `projects`: **{len(supabase)}**",
        f"- **INSERT**: {n_ins} new project rows",
        f"- **UPDATE**: {n_upd} existing rows (≥1 column differs)",
        f"- **NO-OP**: {n_noop} existing rows already match",
        f"- **DELETE**: {n_del} Supabase rows whose id is no longer an Excel project",
        f"- Unparseable dates seeded as NULL: {len(warnings)}",
        "",
    ]

    if buckets["inserts"]:
        L += ["## INSERT — new project rows", ""]
        L += ["| id | name | status | lead | start | end | budget | % |"]
        L += ["|---|---|---|---|---|---|---|---:|"]
        for ins in buckets["inserts"]:
            r = ins["rec"]
            L.append(
                f"| `{ins['id']}` | {ins['name']} | {fmt_val(r.get('status'))} | "
                f"{fmt_val(r.get('lead'))} | {fmt_val(r.get('start_date'))} | "
                f"{fmt_val(r.get('end_date'))} | {fmt_val(r.get('budget'))} | "
                f"{fmt_val(r.get('percent_complete'))} |"
            )
        L += [
            "",
            "> Each INSERT carries all 21 mapped columns (see "
            "`kb/_validate_projects.py` FIELD_MAP); the table shows a glance "
            "subset. `kpi_target_2026/2030` seed NULL (the ladder lives in "
            "`workplan_goals`, joined back at generator time in PR-4); "
            "`created_at/updated_at` default `now()`.",
            "",
        ]

    if buckets["updates"]:
        L += [
            "## UPDATE — column drift",
            "",
            "Excel wins per column at seed time.",
            "",
        ]
        for upd in buckets["updates"]:
            L.append(f"### `{upd['id']}` — {upd['name']}")
            L.append("")
            L.append("| column | Supabase (now) | Excel (after) |")
            L.append("|---|---|---|")
            for d in upd["diffs"]:
                L.append(f"| `{d['field']}` | {fmt_val(d['from'])} | {fmt_val(d['to'])} |")
            L.append("")

    if buckets["deletes"]:
        L += [
            "## DELETE — Supabase rows not in Excel",
            "",
            "These ids no longer appear as Excel projects; the seed removes them "
            "so the table reflects the canonical set.",
            "",
            "| id | name |",
            "|---|---|",
        ]
        for d in buckets["deletes"]:
            L.append(f"| `{d['id']}` | {d['name']} |")
        L.append("")

    if buckets["noops"]:
        L += ["## NO-OP — already in sync", ""]
        for n in buckets["noops"]:
            L.append(f"- `{n['id']}` — {n['name']}")
        L.append("")

    L += [
        "## How this applies",
        "",
        "When `kb/_seed_projects_apply.py` lands (PR-3, manual `workflow_dispatch`, "
        "with your §8 RLS sign-off):",
        "",
        "1. POST (INSERT) each row in the INSERT bucket.",
        "2. PATCH (UPDATE) each row in the UPDATE bucket — Excel wins per column.",
        "3. DELETE each row in the DELETE bucket.",
        "4. NO-OP rows skipped.",
        "5. V1-V4 gates, then re-run `kb/_validate_projects.py` — exit 0 confirms parity.",
        "",
        "Re-generate this plan: `python3 kb/_seed_projects.py --supabase-json <snapshot>`",
        "",
    ]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--supabase-json", type=Path, default=None,
        help="Read Supabase projects rows from this JSON file instead of REST.",
    )
    args = ap.parse_args()

    rows = (
        _read_snapshot_rows(args.supabase_json)
        if args.supabase_json
        else fetch_supabase_rows()
    )

    excel, warnings, aplus_count, zero_kpi = derive_excel_projects()
    supabase = reshape_supabase(rows)
    buckets = plan_actions(excel, supabase)

    plan = render_plan(excel, supabase, buckets, warnings, aplus_count, zero_kpi)
    SEED_PLAN_PATH.write_text(plan, encoding="utf-8")

    print(f"wrote {SEED_PLAN_PATH.relative_to(REPO_ROOT)}")
    print(f"  INSERT={len(buckets['inserts'])} UPDATE={len(buckets['updates'])} "
          f"NO-OP={len(buckets['noops'])} DELETE={len(buckets['deletes'])}")


if __name__ == "__main__":
    main()
