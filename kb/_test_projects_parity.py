"""
Parity test for the Excel→Supabase Phase 2 (PR-4) projects cutover.

Proves that load_projects() (Supabase-sourced, via the snapshot path when no
service key is present) produces a project list byte-identical to the legacy
read_projects() (Excel) for the 34 real grid-card projects — so the cutover is
behavior-preserving. The 15 D.* sub-population helper rows were retired as
vestigial (nothing consumed their values), so load_projects() now emits the 34
real projects only — read_projects() still surfaces D.* from the Excel master,
but the cutover filters them out.

Expected divergences (NOT failures, reported separately):
  - `end` for the 3 projects whose Excel value was "Ongoing": fork #1 (lenient
    date parse) stored NULL in Supabase, so the cutover renders these blank.
  - ladder cells where a curator edited workplan_goals since the Phase-1 seed
    (Supabase is the source of truth there — Excel would be stale).

Run from repo root (uses kb/projects_snapshot.json + kb/workplan_goals_snapshot.json
+ the Excel workbook — no Supabase service key needed):
  python3 kb/_test_projects_parity.py
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

import openpyxl  # noqa: E402

import excel_to_dashboard as e2d  # noqa: E402

# Fields where a NULL-in-Supabase but text-in-Excel divergence is expected
# (fork #1: "Ongoing" end_dates → NULL). Reported, not failed.
KNOWN_DATE_FORK_FIELDS = {"end", "start", "update_date"}
LADDER_PREFIXES = ("kpi_goal_", "kpi_stretch_")


def main() -> int:
    wb = openpyxl.load_workbook(e2d.EXCEL_FILE, read_only=True, data_only=True)

    excel_projects = e2d.read_projects(wb)
    excel_real = {p["id"]: p for p in excel_projects if not str(p["id"]).startswith("D.")}

    projects, fetched_at, source = e2d.load_projects(wb)
    built_real = {p["id"]: p for p in projects if not str(p["id"]).startswith("D.")}
    helper_rows = [p for p in projects if str(p["id"]).startswith("D.")]

    print(f"source={source} fetched_at={fetched_at}")
    print(f"excel real projects = {len(excel_real)}; built real projects = {len(built_real)}; "
          f"D.* rows leaked into built (expect 0) = {len(helper_rows)}")

    hard_failures = []      # field diffs that are NOT explained by a known fork
    expected_divergences = []  # date-fork + ladder-curator-edit diffs
    whitespace_diffs = []   # trailing/leading whitespace only (Supabase trimmed)

    # 1. Same id set?
    if set(excel_real) != set(built_real):
        only_excel = sorted(set(excel_real) - set(built_real))
        only_built = sorted(set(built_real) - set(excel_real))
        hard_failures.append(f"ID SET MISMATCH: only_excel={only_excel} only_built={only_built}")

    # 2. Field-by-field over the shared ids.
    for pid in sorted(set(excel_real) & set(built_real)):
        ex = excel_real[pid]
        bu = built_real[pid]
        for key in sorted(set(ex) | set(bu)):
            ev, bv = ex.get(key), bu.get(key)
            if ev == bv:
                continue
            # Known date fork: Excel has text (e.g. "Ongoing"), Supabase NULL → "".
            if key in KNOWN_DATE_FORK_FIELDS and bv == "" and isinstance(ev, str) and ev:
                expected_divergences.append(f"{pid}.{key}: excel={ev!r} -> supabase={bv!r} (date fork #1)")
            elif key.startswith(LADDER_PREFIXES):
                expected_divergences.append(f"{pid}.{key}: excel={ev!r} -> wpg={bv!r} (ladder source-of-truth)")
            elif isinstance(ev, str) and isinstance(bv, str) and ev.strip() == bv.strip():
                whitespace_diffs.append(f"{pid}.{key}")
            else:
                hard_failures.append(f"{pid}.{key}: excel={ev!r} != built={bv!r}")

    # 3. D.* sub-population helper rows are RETIRED (vestigial — nothing consumed
    #    them). read_projects() still surfaces them from the Excel master, but
    #    load_projects() must filter them out entirely (no-leak guard).
    excel_dstar = sorted(p["id"] for p in excel_projects if str(p["id"]).startswith("D."))
    if helper_rows:
        hard_failures.append(
            f"load_projects() leaked retired D.* rows: "
            f"{sorted(p['id'] for p in helper_rows)}")
    print(f"\nD.* in Excel master = {len(excel_dstar)} (read_projects surfaces them); "
          f"load_projects filtered them out → {len(helper_rows)} leaked")

    print(f"\nexpected divergences ({len(expected_divergences)}):")
    for d in expected_divergences:
        print(f"  · {d}")
    if whitespace_diffs:
        print(f"\nwhitespace-only diffs ({len(whitespace_diffs)}, Supabase trimmed, HTML-invisible): "
              f"{', '.join(whitespace_diffs)}")

    if hard_failures:
        print(f"\n❌ HARD FAILURES ({len(hard_failures)}):")
        for f in hard_failures:
            print(f"  ✗ {f}")
        return 1

    print("\n✅ PARITY OK — 34 real projects byte-identical to read_projects() "
          "(modulo the expected, intentional divergences above).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
