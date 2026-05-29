"""
Budget Phase 3 cutover sanity test — the regression guard for the Supabase
budget cutover. Unlike the projects PARITY test (which proved byte-identity with
the old Excel reader), this is a GOLDEN check of the NEW correct output: the
cutover deliberately CHANGES the rendered Budget tab (the old Excel path rendered
"$0 Total Allocation" — a live bug — because the Excel budget sheet is a zeroed
husk). So we assert the new render is correct, not that it matches the old one.

Runs offline against the committed snapshot (no SUPABASE_SERVICE_KEY needed):
load_budget_full() falls back to kb/budget_snapshot.json.

Run from repo root:  python3 kb/_test_budget_cutover.py
Exit 0 on pass, 1 on any failed assertion.
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "kb"))

import excel_to_dashboard as xl  # noqa: E402
from _load_budget import load_budget_full  # noqa: E402

EPS = 1.0
failures = []


def check(cond, msg):
    print(("  ok  " if cond else " FAIL ") + msg)
    if not cond:
        failures.append(msg)


def main():
    funding_rows, personnel_rows, fetched_at, source = load_budget_full()
    print(f"loaded: {len(funding_rows)} funding, {len(personnel_rows)} personnel "
          f"(source={source}, as of {fetched_at})\n")

    # Personnel deduped (live table double-seeds 13 → 26).
    check(len(personnel_rows) == 13, f"personnel deduped to 13 (got {len(personnel_rows)})")
    check(len(funding_rows) == 6, f"6 funding sources (got {len(funding_rows)})")

    budget = xl.build_budget_from_supabase(funding_rows, personnel_rows, {})

    # The headline regression: grand total must be the real ~$88.9M, NOT $0.
    gt = budget["grand_total"]
    check(gt > 80_000_000, f"grand_total is real money, not $0 (got {gt:,.2f})")
    check(abs(gt - 88_890_999.70) < EPS, f"grand_total == 88,890,999.70 (got {gt:,.2f})")
    check(abs(gt - sum(s["total"] for s in budget["funding_sources"])) < EPS,
          "grand_total == sum of funding source totals")

    # The year-column bug fix: budget_by_year carries the 5 ANNUAL budgets in
    # order. The $2M source (id 5) has 0 in 2025-26 then 2M in each out-year;
    # the buggy old reader would have put the 2025-26 EXPENSE in slot 1.
    src2m = next(s for s in budget["funding_sources"] if "$2M" in s["source_code"])
    check(src2m["budget_by_year"] == [0.0, 2_000_000.0, 2_000_000.0, 2_000_000.0, 2_000_000.0],
          f"$2M source budget_by_year correct (got {src2m['budget_by_year']})")
    check(len(src2m["budget_by_year"]) == 5, "budget_by_year has all 5 years (2029-30 not dropped)")

    # Personnel totals + held expenditures.
    pt = budget["personnel_totals"]["total_comp"]
    check(abs(pt - 2_057_335) < 5, f"personnel total_comp ≈ 2,057,335 (got {pt:,.2f})")
    check(budget["expenditures"] == [], "expenditures held empty")
    check(budget.get("_expenditures_held") is True, "_expenditures_held flag set")
    check(budget["expense_categories"] == [] and budget["expense_areas"] == [],
          "expense category/area rollups empty while held")

    # Rendered HTML golden checks.
    out = xl.render_budget_html(budget, data_source_stamp=fetched_at)
    check("$0 Total Allocation" not in out, "render does NOT show '$0 Total Allocation' (the live bug)")
    check("Total Allocation" in out and "$88.9M" in out, "render shows the $88.9M headline")
    check(f"Budget data as of {fetched_at}" in out, "render carries the 'data as of' stamp")
    check("being refreshed" in out, "render shows the expenditure 'pending' note")
    check("Personnel Plan" in out, "render includes the Personnel Plan section")

    print()
    if failures:
        print(f"FAILED ({len(failures)} assertion(s)):")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("All budget cutover checks passed.")


if __name__ == "__main__":
    main()
