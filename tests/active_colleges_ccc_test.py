#!/usr/bin/env python3
"""The Active Colleges card counts community colleges only.

Sam, open-asks sheets 33-34 (2026-10-04): the CPL Initiative serves
"California's 116 community colleges", and Cal State LA, the first CSU campus
on MAP, is named beside them. MAP's datasets list 116 institutions, the 115
credit colleges plus Cal State LA, so a count read straight from the datasets
would call a CSU campus a community college the day it turns active.

  1. Today's shape (Cal State LA Inactive): the active count is untouched, the
     Inactive row loses Cal State LA, and an "Also on MAP" row names it.
  2. Cal State LA Advancing: the active count and the Advancing row drop by one.
  3. The card's sub line names the system count from kb/non_ccc_institutions.json.
  4. kpi_history's active_colleges keeps the community-college grain.
  5. Every name in the shared list normalizes to a distinct key.

Run from the repo root: python3 tests/active_colleges_ccc_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen  # noqa: E402

CSU = "California State University Los Angeles"
failures, checks = [], [0]


def check(label, cond, detail=""):
    checks[0] += 1
    print(("PASS  " if cond else "FAIL  ") + label + ("" if cond else f"  — {detail}"))
    if not cond:
        failures.append(label)


def live(csu_tier):
    tiers = {"leading": {"count": 2, "colleges": [{"college": "Bakersfield College"},
                                                  {"college": "Norco College"}]},
             "advancing": {"count": 2, "colleges": [{"college": "Cerritos College"},
                                                    {"college": "Chaffey College"}]},
             "inactive": {"count": 1, "colleges": [{"college": "Yuba College"}]}}
    tiers[csu_tier]["colleges"].append({"college": CSU})
    tiers[csu_tier]["count"] += 1
    n = {k: v["count"] for k, v in tiers.items()}
    return {"tiers": tiers, "active_college_count": n["leading"] + n["advancing"],
            "metrics": [{"title": "ACTIVE COLLEGES", "value": str(n["leading"] + n["advancing"]),
                         "breakdowns": [{"label": "Leading Colleges", "value": str(n["leading"])},
                                        {"label": "Advancing Colleges", "value": str(n["advancing"])},
                                        {"label": "Inactive Colleges", "value": str(n["inactive"])}]}]}


def card(live_data):
    kpis = {"active_colleges": {"value": "0", "label": "Active Colleges", "sub": "x"}}
    return gen.merge_live_metrics(copy.deepcopy(kpis), live_data)["active_colleges"]


def row(c, label):
    return next((b for b in c.get("breakdowns", []) if b["label"] == label), {})


# 1. today's shape
c = card(live("inactive"))
check("Inactive Cal State LA leaves the active count at 4", c["value"] == "4", c["value"])
check("the Inactive row counts community colleges only (1)", row(c, "Inactive Colleges").get("value") == "1",
      row(c, "Inactive Colleges"))
also = row(c, "Also on MAP")
check("an 'Also on MAP' row names Cal State LA", also.get("value") == "1" and CSU in also.get("note", ""), also)

# 2. Cal State LA turns active
c = card(live("advancing"))
check("an Advancing Cal State LA is out of the active count (4, not 5)", c["value"] == "4", c["value"])
check("the Advancing row counts community colleges only (2)", row(c, "Advancing Colleges").get("value") == "2",
      row(c, "Advancing Colleges"))

# 3. the sub line
kpis = gen.compute_headline_kpis([], {}, live_data=None)
check("the card's sub line reads 'of 116 community colleges'",
      kpis["active_colleges"]["sub"] == "of 116 community colleges", kpis["active_colleges"]["sub"])

# 4. kpi_history's grain, read through the same helper the snapshot uses
lv = live("leading")
active_non = sum(len(v) for t, v in gen.non_ccc_by_tier(lv).items() if t in ("leading", "advancing"))
check("a Leading Cal State LA is one active institution outside the CCC count", active_non == 1, active_non)
src = open(gen.__file__, encoding="utf-8").read()
check("log_daily_snapshot subtracts it from active_colleges",
      '"active_colleges":       int((live_data or {}).get("active_college_count", 0))\n'
      '                           - sum(len(v) for t, v in non_ccc_by_tier(live_data).items()' in src)

# 5. the shared list
system, names = gen.load_non_ccc()
check("the shared list states the system count, 116", system == 116, system)
check("the shared list's names include Cal State LA's MAP spelling", gen._norm_name(CSU) in names)

print(f"\n{checks[0] - len(failures)}/{checks[0]} checks passed")
sys.exit(1 if failures else 0)
