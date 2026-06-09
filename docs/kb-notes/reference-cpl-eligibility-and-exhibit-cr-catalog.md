---
title: CPL eligibility — military vs non-military + the Exhibit CRs Catalog rollup
created: 2026-06-09
updated: 2026-06-09
tags: [reference, cpl, eligibility, military, ace, jst, exhibit, cer, map, data-pipeline]
kb-status: published
kb-type: reference
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[adr-cer-student-impact-counts-privacy]]"
  - "[[reference-daily-dashboard-data-pipeline]]"
artifacts:
  - fetch_custom_report.py
  - excel_to_dashboard.py (_rollup_exhibit_cr_catalog, export_credential_reference)
  - kb/_verify_exhibit_cr_eligible.py
  - tests/cer_eligible.test.js
---

# CPL eligibility — military vs non-military, and the Exhibit CRs Catalog rollup

> **One-sentence summary** — Non-military CPL eligibility is exhibit-deterministic;
> military eligibility is JST-driven (multiple ACE IDs at differing skill levels);
> MAP's new **Exhibit CRs Catalog** bakes both into per-(exhibit, skill, CR) credit
> totals, which we roll up to a per-credential **eligible-credit volume** for the CER.

## The eligibility model (Sam, 2026-06-09)

- **Non-military** — a student maps directly to one or more exhibits, **no skill
  levels**, so each exhibit's eligible/applied/transcribed unit counts are clean
  and deterministic.
- **Military** — eligibility is read from the service member's **JST** (Joint
  Services Transcript), not from the exhibit alone. A member typically holds
  **multiple ACE IDs at differing skill levels** (e.g. Navy rates AD3→AD2→AD1→
  ADC→ADCS→ADCM); *which* CRs they qualify for comes from parsing their JST. You
  **cannot** infer an individual's awards from the MOS exhibit in isolation.
- **Implication for us:** the per-CR student/credit totals in the Exhibit CRs
  Catalog are **MAP's already-JST-aggregated** view, so for *aggregate* CER counts
  we consume those totals directly — for military and non-military alike — and do
  **not** parse JSTs ourselves. JST-driven **individual** eligibility ("what does
  *this* member qualify for across their ACE IDs") is a separate, **deferred**
  student-portal feature. Use the MOS-based exhibits for now.

## The Exhibit CRs Catalog (`View_ExhibitCRsCatalog_Dataset`)

NEW MAP Custom-Reporting view (note the `_Dataset` suffix, **not** `_APIDataset`).
~268k rows / **33,050 exhibits** (the *full* ACE/exhibit universe — ~10× the
~3,451 articulated; the unarticulated remainder, mostly military, is a future
**CPL-opportunity** signal). Statewide (no `College` column → lower small-cell
risk). Carries `ExhibitID`, `SkillLevel`, `CreditRecommendation`, and the credit
funnel `Total{Eligible,Transcribed,Applied,CreditsInReview,Students}ForCR`.

**Grain (measured via the discovery probe):** rows are per **(ExhibitID,
SkillLevel, CreditRecommendation, …finer criteria/evidence…)**. The `Total…ForCR`
values **repeat** across the finer rows — only ~16% of (exhibit, skill, CR) groups
vary. So a naive per-exhibit `SUM` of the raw rows over-counts ~2.5×.

## The id-namespace gotcha (the bridge is TITLE, not ExhibitID)

**Two different ExhibitID namespaces.** The catalog keys exhibits by a **numeric
`ExhibitID`** (`7651`) and **includes military/ACE** exhibits;
`View_ArticulatedMAPExhibits` (what our `coci_articulations.json` crosswalk is
seeded from) keys by the **`MAP…` string id** (`MAPICA-ACDA-1-001`) and
**excludes military**. They do **not** join on id. The only shared field for the
overlapping (non-military) exhibits is the **exhibit Title** — the catalog's
`Title` matches the MAP canonical Exhibit Title our unified-title layer keys on.
So the rollup bridges **Title → unified_title** (`title_to_ut`, normalized), built
from the articulations' canonical `exhibit_title`. (Discovered post-cron, 2026-06-09:
a naive `ExhibitID` join baked 0 matches — `students_served`, which joins
`View_ArticulatedCollegeCourses.ExhibitID` (still `MAP…`), is a *separate*
preexisting issue.)

## The rollup rule (`_rollup_exhibit_cr_catalog`)

1. **De-dupe** to `(ExhibitID, SkillLevel, CreditRecommendation)` taking the **MAX**
   of each credit total (`ExhibitID` is still the precise de-dupe key; this
   collapses the finer-grain repetition; conservative-high on the ~16% that vary).
2. **Sum the credit UNITS** up to the credential via **Title → unified_title**
   (`eid → Title → ut`). Credits are **additive** across CRs and skill
   levels → a per-credential **credit volume** (a prioritization signal, like
   `students_served` — not a distinct accounting).
3. **Never sum the per-CR student headcount.** One member spans multiple CRs/skill
   levels, so summing `TotalStudentsForCR` over-counts distinct students. We
   surface credit **units** only. (A clean *distinct* per-exhibit headcount would
   need `ExhibitID`+`SkillLevel` added to `View_StudentAggregatedValues` — a
   pending MAP request; useful but **not** required for the aggregate CER.)

**Privacy:** credit units are not headcounts → no `<5` suppression on the eligible
column (unlike `students_served`). The standing PII guard still covers any student
count we ever surface. **Carry-forward:** like `students_served`, the column
carries the prior cron values when the (gitignored, PII-bearing) CustomReport is
absent, so it doesn't oscillate blank on a live-on-merge regen. It populates fresh
on the daily cron.

## CER surfaces

`export_credential_reference()` emits `eligible_credits` + the funnel
(`transcribed/applied/in_review_credits`) per credential;
`credential_reference.js` renders a sortable **"Eligible (units)"** column with a
hover funnel + **"credit waiting to be unlocked" = eligible − transcribed**.
Verified by `kb/_verify_exhibit_cr_eligible.py` (rollup logic) +
`tests/cer_eligible.test.js` (consumer).

## Open / deferred

- **ACE skill-level child-exhibits** — the catalog confirms 3,013 exhibits carry
  skill levels (2,428 multi-level) with genuinely different per-level CR sets, so
  decomposing a military exhibit into per-skill-level child identities is
  data-justified (non-military stays flat — empty `SkillLevel`). Scope as an
  identity change (its own scope doc) before building.
- **JST individual-eligibility planner** + the `View_StudentAggregatedValues`
  ExhibitID/SkillLevel join (distinct headcounts, per-college eligible-by-exhibit,
  the EACR "System" inequitable-access view) — deferred student-portal tier.
