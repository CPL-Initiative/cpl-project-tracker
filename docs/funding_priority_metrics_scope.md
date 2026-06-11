---
title: Scope — MAP performance vs the three funding-priority metrics (funding tab v2)
created: 2026-06-11
updated: 2026-06-11
tags: [scope, funding, implementation-funding, priority-metrics, map]
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/adr-funding-priority-metrics-privacy]]"
  - "[[docs/kb-notes/reference-daily-dashboard-data-pipeline]]"
---

# Scope — actual MAP performance vs the three funding priorities

Goal: the Implementation Funding tab shows, per college and statewide,
**actual students meeting each priority metric vs the model's projection
target** (target = headcount × target %, which since rev2 is an explicit
no-dollar-effect column). Build is **gated on the privacy ADR + Sam's three
forks below** — this doc is the measure-first scope.

## Metric ↔ data lineage (recon 2026-06-11)

Source candidate: `View_StudentAggregatedValues` — already fetched daily,
**per-student grain, pseudonymous** (`MAP Internal StudentID`; identity
columns deliberately not requested), with per-student `Transcribed Credits`,
`Eligible Credits`, CPL type/MoL, `Potential Student` / `Test Student`
flags, per `College`.

| Priority | Workbook metric | Derivable? | Query shape (per college) |
|---|---|---|---|
| **P2** access | Documented enrollments with CPL, transcribed CPL units ≥6 in MAP | ✅ **today** | distinct students where `Transcribed Credits ≥ 6` (exclude `Test Student`; decide on `Potential Student`) |
| **P3** capacity | Total headcount with transcribed CPL in MAP **and MIS** | ◐ MAP half today | distinct students where `Transcribed Credits > 0`. The "and MIS" cross-check is NOT in our pipeline (MIS DataMart is a manual report — see the headcount-provenance note) — label the column "per MAP" until an MIS feed exists |
| **P1** completion | Documented **completion** with transcribed CPL units ≥6 in MAP | ❌ **data gap** | no completion/award field exists anywhere in the 9-category pull; completions live in **MIS** (student awards), not MAP |

**P1 — fork ② ANSWERED (Sam, 2026-06-11): deferred deliberately, kept as
an incentive.** Colleges don't record completions in MAP (duplicative with
their SIS — Banner/Colleague/PeopleSoft); DataMart aggregates can't yet tie
to MAP student records; MAP Student IDs are inconsistent (CCCApply
integration fixes identity later, forward-only); the probable operational
fix is a periodic SIS→MAP ingestion routine. Sam keeps the P1 metric to
incentivize closing the gap and to eventually demonstrate the CAEL-WICHE
completion effect with CA data. **Full anatomy + the strategy ladder
(identity-first P3 sub-indicator, maturity ladder, CO-level match-back
before 116 SIS integrations, decoupled research study, provenance stamps,
labeled dashboard state):**
[`kb-notes/reference-p1-completion-data-gap.md`](kb-notes/reference-p1-completion-data-gap.md).
Build consequence: ship P2/P3; render P1 as a labeled "awaiting completion
data (incentive metric)" state — never a blank.

## Build ladder (after the ADR is ratified)

1. **PR-1 producer**: `funding/_build_funding_performance.py`, invoked as a
   daily-workflow step after the CustomReport fetch → emits
   `cpl_funding_performance.js` (`window.CPL_FUNDING_PERF`: per-college
   `{p2, p3}` counts + statewide, suppressed per the ADR, with an
   `as_of` stamp). Workflow `git add` + §6 doc + pii_guard fold-in in the
   same PR. Lifecycle: **cron artifact** (unlike the static model data).
2. **PR-2 consumer**: the tab lazy-loads it; each priority card gains
   "actual: N students (X% of target)" + a per-college "vs target" column
   in the table (target = headcount × target%; actual from the artifact;
   "<5" rendered as-is). Sandbox target edits recompute the target side
   only — actuals are facts.
3. **PR-3 (P1)**: when a completion source lands, same shape.

Join key: college name — reuse `college_lookup.js`/`college_short_names`
normalization rather than a new map (DataMart "Alameda" vs MAP "College of
Alameda" drift is the known hazard).

## Sam's forks — ALL ANSWERED (2026-06-11, "Yes on forks")

1. **Privacy ADR defaults** — ✅ RATIFIED as written (aggregate-only, <5
   producer-side suppression).
2. **P1 path** — ✅ deferred deliberately, kept as an incentive; anatomy +
   strategy ladder in
   [`kb-notes/reference-p1-completion-data-gap.md`](kb-notes/reference-p1-completion-data-gap.md).
3. **`Potential Student` rows** — ✅ EXCLUDED ("documented" means actual
   records).

**Build status:** PR-1 producer + PR-2 consumer shipped together 2026-06-11
(`funding/_build_funding_performance.py` + workflow step/git-add +
pii_guard fold-in + `cpl_funding.js` actuals: priority-card actual-vs-target
lines, the per-college "CPL students†" column, drill-in vs-target, P1
labeled incentive state). The artifact publishes with the **first daily
cron after merge**; until then the tab shows its "arrives with the next
daily refresh" hints. First-cron follow-ups: check the artifact's
`unmatched` bucket (the college-name join audit) and that the committed-
artifact screens in `tests/cpl_funding_performance.test.js` go live.
