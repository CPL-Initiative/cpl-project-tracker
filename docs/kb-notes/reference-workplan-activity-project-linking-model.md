---
title: The workplan Activity↔Project linking model — home field vs the N-to-N association table
created: 2026-07-27
updated: 2026-07-27
tags: [reference, workplan, activities-projects, associations, supabase, data-model]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/workplan_single_source_editor_lessons]]"
artifacts:
  - excel_to_dashboard.py
  - kb/_load_workplan_goals.py
  - assoc_editor.js
---

# The workplan Activity↔Project linking model — home field vs the N-to-N association table

> **One-sentence summary** — A workplan project is tied to Activities two independent ways:
> `projects.workplan_activity` (its single HOME Activity + grouping key) and
> `workplan_activity_associations` (its N-to-N "Contributes to" cross-links); everything
> DISPLAYS off the first, so the second can silently be incomplete.

## The two mechanisms

| Mechanism | Table/field | Role | Completeness |
|---|---|---|---|
| **Home Activity** | `projects.workplan_activity` (text, e.g. "Activity 4: …") | Determines which Activity a project renders under on the Activities tab + the Annual Workplan Goals section. **Every project has one.** | Always present |
| **Cross-links** | `workplan_activity_associations` (project_id, activity_id, is_primary) | The "Contributes to: Activity N" chips — a project can align to several Activities. | **Often partial** |

## Key facts (verified 2026-07-27)

- **Grouping is by NUMBER, not the full string.** `_activity_num_from_workplan()` parses just the
  digit out of `workplan_activity` (`^Activity\s*(\d+)`). So the *name-part* of
  `projects.workplan_activity` is cosmetically irrelevant and may drift from the authoritative
  `workplan_goals.name` (kind='activity') without affecting grouping or display. Don't bother
  re-syncing it; the displayed Activity label always comes from `workplan_goals.name`.
- **A project can display correctly yet have NO association row.** The generator backfills a
  display-only "Contributes to" chip from the id prefix (`assoc_backfilled`) when a project has
  no real association. So the Activities tab looks complete even when the association table is
  patchy. On 2026-07-27, 10 of 33 projects had zero association rows.
- **The 4 top-level Activities live in `workplan_goals` (kind='activity'), two rows each**
  (row_type GOAL + STRETCH) sharing the same `name`/`description`. Patch both by
  `activity_id=eq.N&kind=eq.activity`.
- **Legacy `5.x` ids don't imply an "Activity 5".** Their `workplan_activity` re-homes them to
  Activities 1–4; no phantom Activity 5 is manufactured from an id prefix. (An actual dissolved
  Activity 5 left residue in the *association* table + as tabled ghost projects — that's data
  rot, not the model.)

## Backfilling a real link

To give every project a real primary link to its home Activity (so nothing relies on the
display-only backfill), filtered to projects with no existing association:

```sql
insert into public.workplan_activity_associations (project_id, activity_id, is_primary)
select p.id, regexp_replace(p.workplan_activity,'^Activity\s*(\d+).*','\1'), true
from public.projects p
where p.workplan_activity ~ '^Activity\s*\d+'
  and not exists (select 1 from public.workplan_activity_associations a where a.project_id=p.id);
```

Cross-alignments (existing secondary links a curator set deliberately) are untouched — only the
home link is backfilled.

## Gotcha

"Delete Activity N" is never just its label rows. A dissolved Activity can hold: stale SECONDARY
association tags on still-active projects, PRIMARY-only ghost projects that live only in the
association table (no `projects` row), and tabled projects with a `workplan_goals` ladder +
`item_raci` + `item_updates` + `project_lifecycle` rows. Fresh-read all of these before deleting,
and preserve deliberately-tabled items unless the curator confirms disposal.
