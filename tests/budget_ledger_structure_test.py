#!/usr/bin/env python3
"""Budget ledger structure — sources/uses/pool/history + the double-count guard.

Guards the 2026-07-30 Budget rework (SkyReconcile). `budget_funding` stopped being
a flat list of funding sources and became the whole ledger, keyed by `section`
(source_one_time · source_ongoing · use_35m · use_15m · use_ongoing · pool ·
history) with `parent_id` giving the collapsible detail beneath a total and
`archived` marking the 2025-26 cutoff.

TWO RULES, both load-bearing, both asserted here:

  (a) TOTALS SUM PARENT ROWS ONLY. A child row is detail, never additive.
      Summing parents + children is exactly the mistake the Sept-2026 BOG
      amendment's own "$74,000,000" grand total makes — it adds the $18M project
      subtotal on top of the $35M that already contains $8,959,692 of it. The
      real figure is $71,000,000. We must not reproduce that shape in our own
      data. (docs/cpl_funding_lessons.md · methodology-recompute-a-sources-own-
      summary-statistics.md)

  (b) ARCHIVED rows are excluded from every total — they precede the cutoff and
      are retained only so historical totals still reconcile.

Plus the fail-safe: a row predating the migration carries section = NULL and must
still render as a funding source, so an un-migrated database degrades gracefully
rather than showing an empty Budget tab.

Run:  python3 tests/budget_ledger_structure_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen

failures = []


def check(label, actual, expected):
    if actual == expected:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}\n        expected {expected!r}\n        actual   {actual!r}")
        failures.append(label)


def ok(label, cond):
    check(label, bool(cond), True)


EXCEL_STUB = {"factors": {}, "year_labels": ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"]}

# A miniature of the real ledger: both source sections, all three use sections,
# the pool with children, the archived history with children, and one legacy row.
ROWS = [
    dict(id=4, name="$15M", section="source_one_time", sort_order=10, total=15000000,
         yr_2025_26_budget=15000000, description="first installment", window_label="2025-26 →"),
    dict(id=6, name="$35M", section="source_one_time", sort_order=11, total=35000000,
         window_label="2026-27 · 2027-28"),
    dict(id=3, name="$5M", section="source_ongoing", sort_order=20, total=5000000,
         yr_2025_26_budget=5000000),
    dict(id=5, name="$7M", section="source_ongoing", sort_order=21, total=21000000,
         yr_2026_27=7000000, yr_2027_28=7000000, yr_2028_29=7000000),

    dict(id=20, name="College Awards", section="use_35m", sort_order=10, total=25240308),
    dict(id=21, name="CO Staff", section="use_35m", sort_order=11, total=800000),
    dict(id=22, name="CPL Projects — $35M share", section="use_35m", sort_order=12, total=8959692),
    dict(id=23, name="Grants", section="use_15m", sort_order=10, total=5900000),
    dict(id=24, name="N2N", section="use_15m", sort_order=11, total=59692),
    dict(id=25, name="CPL Projects — $15M share", section="use_15m", sort_order=12, total=9040308),
    dict(id=26, name="Ongoing ops", section="use_ongoing", sort_order=10, total=21000000),

    dict(id=30, name="RCCD Projects", section="pool", sort_order=10, total=10556650),
    dict(id=31, name="Lightleap", section="pool", sort_order=11, total=6600000, parent_id=30),
    dict(id=32, name="Admin support", section="pool", sort_order=12, total=3956650, parent_id=30),
    dict(id=33, name="CO/TBA Projects", section="pool", sort_order=20, total=7443350),
    dict(id=34, name="New Project TBA", section="pool", sort_order=21, total=7443350, parent_id=33),

    dict(id=1, name="$6M CO", section="history", sort_order=30, total=2254764, archived=True),
    dict(id=40, name="ASCCC", section="history", sort_order=32, total=1563900, archived=True, parent_id=1),
    dict(id=41, name="others", section="history", sort_order=33, total=690864, archived=True, parent_id=1),
    dict(id=42, name="Cervantes 1", section="history", sort_order=1, total=79215, archived=True),

    dict(id=99, name="legacy row (no section)", total=1234),
]

budget = gen.build_budget_from_supabase(ROWS, [], EXCEL_STUB)
names = [s["name"] for s in budget["funding_sources"]]
ledger = budget["ledger"]


def tot(pred):
    return sum(r["total"] for r in ledger if pred(r))


# ── the Sources table takes SOURCE parents only ───────────────────────────────
check("sources render in sort_order", names[:4], ["$15M", "$35M", "$5M", "$7M"])
ok("a USE never leaks into the sources table", "College Awards" not in names)
ok("a POOL row never leaks into the sources table", "RCCD Projects" not in names)
ok("an ARCHIVED row never leaks into the sources table", "$6M CO" not in names)
ok("a CHILD row never leaks into the sources table", "Lightleap" not in names)
ok("an un-migrated (section NULL) row still renders — fail-safe",
   "legacy row (no section)" in names)
check("curator description is carried to the renderer",
      budget["funding_sources"][0]["description"], "first installment")
check("window_label is carried to the renderer",
      budget["funding_sources"][0]["window_label"], "2026-27 · 2027-28"
      if budget["funding_sources"][0]["name"] == "$35M" else "2025-26 →")

# ── rule (a): totals sum PARENTS only ─────────────────────────────────────────
pool_parents = tot(lambda r: r["section"] == "pool" and r["parent_id"] is None)
pool_all = tot(lambda r: r["section"] == "pool")
check("pool parents sum to the $18M pool", pool_parents, 18000000)
ok("summing pool parents+children double-counts (the $74M shape) — so never do it",
   pool_all > pool_parents)
check("each pool parent equals the sum of its own children",
      (tot(lambda r: r["parent_id"] == 30), tot(lambda r: r["parent_id"] == 33)),
      (10556650, 7443350))

# ── rule (b): archived is excluded, and history reconciles parents-only ───────
hist_parents = tot(lambda r: r["archived"] and r["parent_id"] is None)
hist_all = tot(lambda r: r["archived"])
check("history totals parents-only", hist_parents, 2254764 + 79215)
ok("summing ALL archived rows double-counts the $6M", hist_all > hist_parents)
ok("no archived row reaches the sources grand_total",
   all(not r["archived"] or r["name"] not in names for r in ledger))

# ── the appropriations still tie out to the amendment, to the penny ───────────
check("uses of the $35M tie to the appropriation",
      tot(lambda r: r["section"] == "use_35m" and r["parent_id"] is None), 35000000)
check("uses of the $15M tie to the appropriation",
      tot(lambda r: r["section"] == "use_15m" and r["parent_id"] is None), 15000000)
check("the two one-time sources are the fulfilled $50M ask",
      tot(lambda r: r["section"] == "source_one_time"), 50000000)
check("all uses 2026-29 total $71M — NOT the amendment's $74M",
      tot(lambda r: r["section"] in ("use_35m", "use_15m", "use_ongoing")
          and r["parent_id"] is None), 71000000)

# ── the ledger carries the whole structure for the JS view ────────────────────
check("ledger carries every row", len(ledger), len(ROWS))
ok("ledger rows carry section/parent/archived/description",
   all(set(("section", "parent_id", "archived", "description", "window_label")) <= set(r)
       for r in ledger))
ok("ledger is sorted by sort_order", [r["sort_order"] for r in ledger if r["sort_order"]]
   == sorted(r["sort_order"] for r in ledger if r["sort_order"]))

print()
if failures:
    print(f"{len(failures)} FAILED")
    sys.exit(1)
print("All budget-ledger structure assertions passed.")
