---
title: Answer "eligible students & credits by program area × statewide/local" from the Credential Reference data
created: 2026-07-20
updated: 2026-07-20
tags: [methodology, cpl, eligibility, credential-reference, statewide, data-query]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[reference-cpl-eligibility-and-exhibit-cr-catalog]]"
  - "[[fire_ems_eligibility_lessons]]"
  - "[[CLAUDE]]"
artifacts:
  - credential_reference_data.js
  - kb/statewide_exhibit_categories.json
  - excel_to_dashboard.py (export_credential_reference, _load_statewide_categories)
---

# Answer "eligible students & credits by program area × statewide/local" from the CER

> **One-sentence summary** — When someone asks "how many students have eligible
> CPL credit (and how many credits) in <program area>, statewide vs local,"
> join the curated statewide category map to `credential_reference_data.js` on
> the credential title, read `students_served` + `eligible_credits`, and use the
> CER `statewide` flag as the tier — but know that flag means "has a
> CCC-Collaborative articulation," which is NOT the same as "listed on the
> statewide CPL page."

## Context

The MAP Exhibit CRs Catalog student/credit totals are already rolled up per
credential into the committed CER dataset — so area-level eligibility questions
need **no live MAP fetch and no pipeline change**, just a filter + join over a
file already in the repo. This note is the reusable recipe (first used for the
Fire/EMS/Wildland/Paramedic ask, `[[fire_ems_eligibility_lessons]]`).

## The claim

**The recipe.** From `window.CPL_CREDENTIAL_REFERENCE.unified_titles` (in
`credential_reference_data.js`), each credential row (`ut`) carries:
- `students_served` — the catalog `TotalStudentsForCR` "Eligible students"
  rollup. **`<5`-masked** (`null` + `served_suppressed:true`); a conservative
  *volume* signal (MAX-per-exhibit summed across exhibits), **not** a distinct
  headcount.
- `eligible_credits` — the `TotalEligibleCreditsForCR` **unit-volume** total
  (summed across every CR and skill level), plus `transcribed_credits` (the
  portion already awarded — "credit waiting to be unlocked" = eligible −
  transcribed).
- `statewide` — a boolean tier flag.
- `disc_modal` — the predominant MQ discipline (use for area bucketing).

**Program area** comes from `kb/statewide_exhibit_categories.json` (title →
program-area category, per map.rccd.edu/statewidecpl/) and/or `disc_modal` +
title patterns. Bucket rows into the requested areas, split by `statewide`, sum
`eligible_credits`, and sum `students_served` over the non-null rows (count the
masked remainder separately — never treat masked as 0 in the headline).

**Exclude the false positives.** A naive `/fire/` title match pulls in
**firearms**, **firestop/fireproofing**, corrections firearms, and "PC 832
Arrest and **Firearms**." Anchor the classifier on `disc_modal` first and
exclude `/firearm|firestop|fireproof|pc 832|working drawings/i`.

## The gotcha — two definitions of "statewide" that diverge

- The CER **`statewide` flag** = `has_ccc`: the credential has ≥1
  **CCC-Collaborative articulation** (`excel_to_dashboard.py`
  `export_credential_reference()` ~L6890/6909, from the exhibit's `collab_types`
  containing "CCC").
- The **statewide CPL category page** (`statewide_exhibit_categories.json`) is a
  curated program-area list — membership there does **not** set the flag.

So a credential can be **on the statewide page yet flagged local** (real case:
**Paramedic License** — 18 students / 721.5 credits, the biggest paramedic line,
flagged local because its articulations carry no CCC collaborative type). Always
state which definition you used, and check the boundary rows both ways — the
answer to "how much is statewide" can hinge on a single high-volume credential.

## When this applies (and when it doesn't)

- **Applies** to any "eligible students/credits by area" question — reuse for
  the other statewide categories (AJ, Automotive, CIS, Construction, Corrections,
  Kinesiology/Health, Real Estate, Welding, World Languages).
- **Does NOT** give distinct student headcounts (a person eligible for two
  credentials counts in both), per-college eligibility, or individual JST-driven
  military eligibility — those need the deferred `View_StudentAggregatedValues`
  ExhibitID/SkillLevel join. See `[[reference-cpl-eligibility-and-exhibit-cr-catalog]]`.
- The numbers are **as-of the last daily pull** (`_generated_at`) — cite it.

## See also

- `[[reference-cpl-eligibility-and-exhibit-cr-catalog]]` — the rollup rules +
  the military/non-military eligibility model + the Title-bridge id gotcha.
- `[[fire_ems_eligibility_lessons]]` — the worked Fire/EMS/Wildland/Paramedic run.
- Filtered view: https://claude.ai/code/artifact/36e7fb36-10a7-44a3-a631-d0ec591ccc4c

---

*Authoring check: durable (the CER schema + the two-definitions divergence hold),
reusable (any area-eligibility question), distilled (one recipe + one gotcha),
self-contained.*
