---
title: Activity↔Project association — orphan-project linking plan
created: 2026-05-29
tags: [workplan, associations, activity-project, proposal]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/excel_to_supabase_lessons]]"
---

# Orphan-project association plan

Seven `public.projects` rows under Activity 5 have **no row** in
`public.workplan_activity_associations` (the N-to-N Activity↔Project table).
They were never backfilled because the PR-A backfill only ran for projects that
also have `workplan_goals` ladder rows, and these seven carry **no KPI ladder**
(they're tracked as projects, not as goal-bearing activities). Confirmed live
on `hvuwhnbuahrtptokpqfh` (read-only query, 2026-05-29):

| Project | Name | Lead | CPL Goal(s) | Current assoc |
|---|---|---|---|---|
| 5.2 | AI Certification-to-Course Matching | Terence Nelson | Goal 2 | — none — |
| 5.3 | AI Apprenticeship CPL Tools | Terence Nelson | Goal 1; Goal 2 | — none — |
| 5.4 | RP Group CPL Field Survey | RP Group | Goal 2 | — none — |
| 5.5 | VRC CPL Module Revision | Beth Kay / Crystal Nasio | Goal 3 | — none — |
| 5.6 | WestEd CPL Scope of Work | WestEd | Goal 2; Goal 3 | — none — |
| 5.7 | MIS Data Reconciliation | CO MIS / MAP Team | Goal 2 | — none — |
| 5.8 | CPL Legislative Advocacy (2026 Session) | Samuel Lee / James Todd | Goal 3 | — none — |

(For reference, 5.1 "AI-Ready California Demonstration" **is** associated, to
Activity 5.)

## Activity legend (Supabase `workplan_goals` kind='activity' rows)

- **Activity 1** — Build AI-Enhanced CPL Infrastructure
- **Activity 2** — Faculty Workgroups & Credit Recommendations
- **Activity 3** — Build CPL Data Infrastructure
- **Activity 4** — Sprints, Projects, Partnerships & Scale
- **Activity 5** — Strategic Initiatives & Special Projects

## Proposed primary association (NOT applied — for product-owner confirmation)

These are **proposals only**. No rows are written to Supabase by this work; the
human links them with the product owner's confirmation (via the association
editor once the projects render in the Workplan Goals tab, or directly in
Supabase). Confidence reflects how clearly the project's purpose maps to a
single Activity.

| Project | Proposed **primary** | Secondary candidate(s) | Confidence | Rationale |
|---|---|---|---|---|
| **5.7** MIS Data Reconciliation | **Activity 3** (Data Infrastructure) | — | **High** | Reconciling MIS data is squarely CPL data-infrastructure work. |
| **5.6** WestEd CPL Scope of Work | **Activity 4** (Sprints/Partnerships/Scale) | Activity 2 | Medium | External partner scope-of-work → partnership/scale lane. |
| **5.8** CPL Legislative Advocacy | **Activity 4** (Sprints/Partnerships/Scale) | Activity 5 | Medium | Advocacy/partnership-flavored; could also read as a strategic special project (A5). |
| **5.3** AI Apprenticeship CPL Tools | **Activity 1** (AI-Enhanced Infrastructure) | Activity 4 | Medium | "AI … CPL Tools" → AI-enhanced infrastructure primary; apprenticeship sprint angle (A4) is a strong secondary — a good N-to-N candidate. |
| **5.2** AI Cert-to-Course Matching | Activity 2 **or** Activity 1 | the other of {A1, A2} | Low / uncertain | Matching certs to courses touches faculty credit-rec work (A2) and AI infrastructure (A1); product owner should pick the lead. |
| **5.4** RP Group CPL Field Survey | Activity 3 **or** Activity 4 | the other of {A3, A4} | Low / uncertain | A field survey could be data-infrastructure (A3) or a partnership deliverable (A4). |
| **5.5** VRC CPL Module Revision | Activity 1 **or** Activity 5 | the other of {A1, A5} | Low / uncertain | Module revision could be infrastructure (A1) or a special project (A5). |

### N-to-N note

5.3 and 5.2 in particular look like genuine **multi-Activity** projects (an AI
tool that is both infrastructure and tied to a sprint/credit-rec effort). The
editor supports multiple associations with exactly one marked primary, so the
product owner can check more than one Activity and pick the lead.

## How to apply (human, after confirmation)

1. Apply the schema migration first if `is_primary` should be recorded:
   `kb/supabase_activity_associations_add_primary.sql` (via the Supabase MCP
   `apply_migration` or the dashboard SQL editor). The editor degrades
   gracefully without it (no primary, just the link).
2. Insert the confirmed associations, e.g.:
   ```sql
   insert into public.workplan_activity_associations
     (project_id, activity_id, is_primary)
   values ('5.7', '3', true);
   ```
   (Repeat per confirmed pair; set `is_primary=true` on exactly one row per
   project, the rest `false`.)
3. These seven projects do **not** currently render in the Workplan Goals tab
   tables (they have no `workplan_goals` ladder row), so they can't be reached
   from the in-tab association editor yet. The editor handles the
   **zero-association** case for any project that *does* render (it opens with
   nothing checked so the curator adds the first link). Surfacing the
   zero-KPI Activity-5 projects in the tab is a separate follow-up.
