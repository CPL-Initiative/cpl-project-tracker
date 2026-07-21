---
title: COBI Activities Tab reorg — scope, crosswalk & migration plan
date: 2026-07-21
session: SkyPlan
status: SCOPED — taxonomy locked by Sam 2026-07-21; build in progress
tags: [cobi, dashboard, activities, projects, workplan-goals, supabase, remint, scope]
artifacts:
  - kb/activity_reorg_alias_map.json
  - excel_to_dashboard.py
  - project_add.js
  - project_lifecycle.js
  - raci.js
  - workplan_goals.js
  - CPL_Dashboard.html
  - index.html
related:
  - docs/annual_workplan_authoritative_scope.md
  - docs/reference/pipeline_reference.md
blueprint: https://claude.ai/code/artifact/c8b5eae3-2ccd-4724-9916-8dee1085138a
---

# COBI Activities Tab reorg

Realign the **Activities** tab (`#tab-activities-projects`) and the **Annual
Workplan Goals** tab (`#tab-workplan-goals`) to the authoritative
[CPL Workplan](https://map.rccd.edu/wp-content/uploads/2025/07/credit-for-prior-learning-workplan.pdf):
**4 Activities**, CPL Goals as cross-cutting tags, every project folded in as a
sub-activity, and **no separate "Projects" category**.

Machine-readable crosswalk: [`kb/activity_reorg_alias_map.json`](../kb/activity_reorg_alias_map.json).
Visual blueprint (approved): the artifact linked in the front-matter.

## Decisions (locked — Sam, 2026-07-21)

1. **Workplan model.** Keep today's Activity 1–4 as the top level; the 3 CPL
   Goals stay cross-cutting tags; projects fold in as sub-activities. The
   invented **"Activity 5: Strategic Initiatives & Special Projects"** (a
   generator-only fallback label; the data never held an "Activity 5") is
   dissolved.
2. **Blend + Sprint tag.** Duplicative sprint tracking blends into the Activity-3
   rows that own the numbers; a new cross-cutting **`sprint_tag`** preserves the
   campaign view as a filter. The **Veteran** and **Apprenticeship** Sprints stay
   as slim campaign **nodes** under Activity 4 (Veteran parents the 29 Palms
   demo); the **Statewide Adoption Sprint** folds into `3.3` (it's a participation
   metric, not a distinct campaign). The Veteran Sprint **headline KPI card is
   untouched**.
3. **Clean renumber.** PKs are re-keyed to sequential dotted ids; `item_raci` +
   `item_updates` history is carried across (merged onto the target for dissolves).

Verified before any live write by the `verify-activity-reorg-crosswalk` workflow
(live Supabase ground-truth + adversarial validation of the permutation) — it
caught the two coverage omissions (`3.1.2`/`3.3` are kept + are dissolve targets)
and that old `4.1` is **not empty** (1 RACI + 2 update rows re-home before drop).

## Target structure (32 active items across 4 activities)

- **Activity 1 — Build AI-Enhanced CPL Infrastructure** (Goals 2, 3): `1.1` MAP
  Platform Development → `1.1.1` AI Cert-to-Course Matching (←5.2), `1.1.2` AI
  Apprenticeship CPL Tools (←5.3, ◆Apprenticeship), `1.1.3` WestEd CPL Scope of
  Work (←5.6); `1.2` System Integration; `1.3` Student Portal; `1.4` Credential
  Registry.
- **Activity 2 — Faculty Workgroups & Credit Recommendations** (Goal 1): `2.1`–`2.4`
  unchanged.
- **Activity 3 — Scale CPL Access, Awards, and Procedures** (Goal 2; retitled from
  "CPL Data Infrastructure"): `3.1` All Populations → `3.1.1` Working Adults,
  `3.1.2` Veterans & Service Members (◆Veteran), `3.1.3` Apprentices and Journey
  Workers (←3.1.2a, renamed, ◆Apprenticeship), `3.1.4` **Other Populations (new)**;
  `3.2` Units Transcription; `3.3` **Statewide Adoption & Participation** (renamed
  ←Institutional Participation, ◆Statewide Adoption, absorbs 4.1.3); `3.4`–`3.6`
  unchanged; `3.7` RP Group CPL Field Survey (←5.4); `3.8` MIS Data Reconciliation
  (←5.7).
- **Activity 4 — Sprints, Projects & Partnerships** (Goals 1, 3): `4.1` **Veteran
  Sprint** (←4.1.1; tracking→3.1.2) → `4.1.1` 29 Palms Demo (←4.1.4); `4.2`
  **Apprenticeship Sprint** (←4.1.2; tracking→3.1.3); `4.3` Strategic Partnerships
  (←4.2); `4.4` Technical Assistance & Training (←4.3) → `4.4.1` VRC CPL Module
  Revision (←5.5); `4.5` Law & Regulation Review (←4.4); `4.6` Sustainable Funding
  (←4.5); `4.7` CPL Legislative Advocacy (←5.8).

**Retired (2):** `4.1` Sprints-and-Projects wrapper (deleted; its 2 updates
re-home to 4.1/4.2 by content); `4.1.3` Statewide Adoption Sprint (→ 3.3).
**Held out (1):** `5.1` AI-Ready California Demonstration — tabled, not renumbered.
**New (1):** `3.1.4` Other Populations.

## Migration plan (phased)

### Phase 1 — spec (THIS PR)
`kb/activity_reorg_alias_map.json` + this doc. No behavior change.

### Phase 2 — Supabase re-key (guarded, atomic)
Apply the alias-map `rekey` as a **two-phase permutation** (temp `TMP__` prefix →
final) inside one transaction, per Rule 9 (fresh live read at write-time; Sam
holds edits for the ~20-min window). Tables: `projects.id`, `item_raci.item_id`,
`item_updates.item_id`, `project_lifecycle.project_id`, and `workplan_goals`
associations. Add `projects.sprint_tag text` and populate from the map. Insert
`3.1.4`. Merge dissolve targets (union RACI; re-key updates). Preserve the
non-project header rows (`item_raci` 1–4; `item_updates` 1/3). Retitle Activity 3
across every Activity-3 row's `workplan_activity` string. Committed receipt.

### Phase 3 — generator + consumers + HTML
- `excel_to_dashboard.py`: delete the 3 "Activity 5" fallback dicts; stop
  rendering "Projects" as a separate category (`render_projects_grid_html`,
  `render_awg_projects_section_html`, the `activity_layer_ids` `5.`-carve-out) —
  regroup projects **under their Activity**; retitle Activity 3 label; emit
  `sprint_tag` onto cards + a filter chip; add the **📄 CPL Workplan ↗** anchor to
  the Activities tab header.
- Consumers: `project_add.js` mints `N.x` under a chosen Activity (not `5.N`);
  `project_lifecycle.js` + `raci.js` drop the `5.`-prefix carve-out; reconcile the
  drifted Activity-title dicts in `report_generator.js` / `master_report.js` /
  `generate_reports.js` / `annual_report.js`.
- HTML (both, Rule 4): drop the `data-sections` "Projects" sub-section + the
  standalone `Projects (N)` grid / AWG-Projects blocks; add the workplan link.
- Tests: update `raci.test.js`, `project_lifecycle.test.js`, `assoc_editor.test.js`,
  `master_report.test.js`; add a jsdom guard that no "Activity 5" renders and that
  `sprint_tag` filtering works.

### Phase 4 — regen + verify
Regenerate `CPL_Data.js`; run `npm test`; A/B the dashboard; parity-check every
headline KPI still resolves (the `PID_TO_KPI_KEY` ids `2.1`, `3.1`, `3.2`, `3.3`
are unchanged; `4.1.1`→`veteran_sprint` becomes **`4.1`** and
`PID_TO_KPI_BREAKDOWN` `3.1.2a`→`3.1.3` — both must be updated in lockstep).

## Open items
- **`3.1.4` lead** — assign an owner (currently TBD).
- **KPI-map lockstep** — `PID_TO_KPI_KEY` (`4.1.1`→`4.1`) + `PID_TO_KPI_BREAKDOWN`
  (`3.1.2a`→`3.1.3`) MUST move with the re-key or the Veteran-Sprint / apprentice
  breakdown cards mis-resolve.
- **Activity 3 Goal tag** — content is Goal 2; the retitle leans Access/Awards
  (Goal 1). Left as Goal 2 unless Sam re-tags.
