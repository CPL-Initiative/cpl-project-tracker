---
title: Dashboard card metrics — consistency recommendations (Sam's recommend list)
date: 2026-06-29
session: 84 (SkyScribe)
status: item 2 BUILT (Session 84) · item 1 still recommended
tags: [cobi, dashboard, kpi, progress-bar, recommendation]
artifacts:
  - excel_to_dashboard.py
---

# Dashboard card metrics — consistency recommendations

Two items Sam flagged while testing (2026-06-29). Both share one root cause:
**project / activity cards display manually-entered values (`kpi_metric`,
`percent_complete`) that drift from the authoritative sources** (the live-scraped
headline KPIs + the `workplan_goals` Goal/Stretch ladder). Recommended fix family:
*derive the card's headline number + progress from those sources, not from a stale
manual field.*

## 1. Headline KPI ≠ the project/activity card metric

**Observed:** the headline "Cumulative CPL Students" card shows **48,148**, but
project 3.1's card shows **43,630** for the same metric.

**Root cause (verified):**
- The **headline KPI** = the **live scraped** value (`live_metrics.json` ← CCCCO
  API "STUDENTS SERVED" → `cumulative_students`), refreshed daily.
- The **project card 3.1** big number = the project's **manually-entered
  `kpi_metric`**, last updated **2026-04-08** ("as of 4/7/2026") — i.e. stale.
- `pid_to_kpi_key` (`excel_to_dashboard.py` ~L10578: `3.1→cumulative_students`,
  `3.2→eligible_units`, `2.1→credit_recommendations`, `3.3→active_colleges`,
  `4.1.1→veteran_sprint`) **exists but only drives KPI-card display ORDER — it does
  NOT sync values.** So nothing keeps the card and the headline in agreement.

**Recommendation:** for the 5 projects in `pid_to_kpi_key`, have the generator set
the card's displayed metric from the **merged live KPI value** (manual entry as
fallback), with a small `live · as of <scrape date>` badge, and keep the manual
`update` / Workplan Note as narrative. Then the card and headline agree by
construction. *Lighter alternative:* add a `live: 48,148 (as of today)` line beside
the historical manual value so the divergence is explained rather than looking
wrong. *Caveat:* only those 5 projects have a live headline equivalent; the rest
have project-specific metrics that stay manual.

## 2. Progress bar should reflect the goal/stretch ladder (+ dual blue/gold bars) — ✅ BUILT (Session 84)

**Shipped:** the Activity KPI cards now compute **Goal (blue/`--cobalt`) + Stretch
(gold/`--gold-accent`) bars** from `current value ÷ the current fiscal-year
cumulative target` (FY = Jul 1 boundary; `_current_fy_suffix` / `_compute_dual_progress`
/ `_dual_progress_html` in `excel_to_dashboard.py`). 1.1 now reads **Goal 200% ✓ /
Stretch 100% ✓** (actual 8 vs the 2025-26 goal 4 / stretch 8) — matching Sam's
expectation. ≥100% shows a ✓ + greens. **Decision taken:** current-fiscal-year
target (Sam's "on pace this year" read); swapping to cumulative-to-2030 is a
one-line denominator change. **Fallback (the "won't work" cases):** a card whose
value isn't numeric, or that has no positive ladder target, keeps the existing
manual `percent_complete` bar (no regression). **Left as-is on purpose:** the
project-GRID cards' bar (replacing it would remove the click-to-edit
`percent_complete` affordance) and the Activity-GROUP aggregate "% avg toward 2030"
bar (a separate average). Tests: `kb/_test_progress_bars.py` (19). *Original
recommendation below for reference.*

---



**Observed (project 1.1, "MAP Platform Development"):** 2030 Goal 25, Stretch 50,
current actual **8**; the 2025-26 STRETCH = 8 (met) — yet the **Progress bar shows a
flat 70%**. Sam: it "should be 100%" against the current-year stretch, and suggests
**a blue bar for goal progress + a gold bar for stretch progress**.

**Root cause (verified):** the card's progress % = the manually-entered
`percent_complete` Supabase field (`excel_to_dashboard.py` ~L1142 / L1951) — **not
computed from the ladder**. The Activity-card bar is the average of member projects'
manual `pct` (~L1750). So the bar can disagree with the actuals entirely.

**Recommendation:** compute progress from the **current actual ÷ ladder target** the
card already has, and render **two thin stacked bars — blue = goal progress, gold =
stretch progress** (matches the existing GOAL=navy / STRETCH=mustard ladder colors).
Focused change to `_render_single_project_card` (the progress block ~L1951) + the
activity-card average (~L1750); the ladder + current value are already on the card.

**Open product decision (only Sam can make):** progress against the **current fiscal
year** target (1.1: 8 ÷ 8 = 100% this year — matches Sam's read) **or** cumulative
toward **2030** (8 ÷ 25 = 32%)? Recommend showing **current-year** progress as the
bar (so "on pace this year" reads right) with 2030 as the stated goal — but confirm.
Decide how to treat **>100%** (cap at 100% "met", or show an "exceeded" state).

## Suggested sequencing

Tackle both as one **"card metrics = computed, not manual"** pass (they're the same
root cause). Small, generator-side, no schema change. Good next-session item.
