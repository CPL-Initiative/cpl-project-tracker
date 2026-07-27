-- Receipt: workplan_goals.description — the store for the top-level Activity
-- brief descriptions (single source of truth for the Annual Workplan Goals tab
-- editor + the Activities-tab one-liner + the report ACTIVITY_DESC titles).
--
-- Applied live to Supabase via the MCP apply_migration tool
-- (name: add_workplan_goals_description) on 2026-07-27. Committed here as the
-- audit receipt (Rule 9 — fresh-read at write time; the seed only fills empty
-- rows so it never clobbers a curator edit). RLS unchanged: workplan_goals
-- UPDATE is already gated to is_allowed_reviewer() OR team_pass_ok(), which
-- covers the new name/description PATCHes from workplan_goals.js.
--
-- Previously these 4 one-liners were hardcoded in THREE places that had already
-- drifted (excel_to_dashboard.py activity_goals, master_report.js /
-- generate_reports.js ACTIVITY_DESC). The generator now reads them here and
-- emits them into CPL_Data.js (activity_kpis[].activity_desc); consumers derive
-- from the snapshot so a curator edit flows everywhere on the next regen.

alter table public.workplan_goals add column if not exists description text;

update public.workplan_goals set description =
  'AI-enhanced MAP platform with student portal, integrations, and credential registry'
  where activity_id = '1' and kind = 'activity' and coalesce(description,'') = '';
update public.workplan_goals set description =
  '1,000 statewide credit recommendations from 25 faculty/industry workgroups'
  where activity_id = '2' and kind = 'activity' and coalesce(description,'') = '';
update public.workplan_goals set description =
  'Statewide CPL data infrastructure tracking 250K students across 116 colleges'
  where activity_id = '3' and kind = 'activity' and coalesce(description,'') = '';
update public.workplan_goals set description =
  'Scale CPL through sprints, partnerships, training, policy, and sustainable funding'
  where activity_id = '4' and kind = 'activity' and coalesce(description,'') = '';

-- ── Follow-on: workplan_association_cleanup (curator-confirmed 2026-07-27) ──
-- Applied live via MCP apply_migration (name: workplan_association_cleanup) after
-- a fresh-read. Sam confirmed all four: backfill links, purge Activity 5, delete
-- 5.1 (tabled AI-Ready California — re-addable later), retitle Activity 4.
--
-- (1) Backfill a REAL primary association for every project that had none, so the
--     10 display-only projects (1.1.1, 1.1.2, 1.1.3, 3.1.3, 3.1.4, 3.7, 3.8,
--     4.4.1, 4.6, 4.7) carry an actual link to their home Activity:
--   insert into public.workplan_activity_associations (project_id, activity_id, is_primary)
--   select p.id, regexp_replace(p.workplan_activity,'^Activity\s*(\d+).*','\1'), true
--   from public.projects p
--   where p.workplan_activity ~ '^Activity\s*\d+'
--     and not exists (select 1 from public.workplan_activity_associations a where a.project_id=p.id);
-- (4) Retitle Activity 4 (both GOAL+STRETCH) to the CPL Workplan title:
--   update public.workplan_goals set name =
--     'Activity 4: Coordinate CPL Sprints, Targeted Projects, Professional Learning, and Strategic Partnerships'
--     where activity_id='4' and kind='activity';
-- (3) Delete tabled 5.1 everywhere: item_raci, item_updates, project_lifecycle,
--     workplan_activity_associations, workplan_goals (kind='project'), projects.
-- (2) Purge the dissolved Activity 5: delete all workplan_activity_associations
--     where activity_id='5' (the 1.1/1.3/1.4/2.1 stale secondary tags + 5.1/5.5
--     ghost primaries) + workplan_goals where activity_id='5' and kind='activity'.
-- Post-state verified: 0 association gaps, 0 Activity-5 residue, 0 x 5.1 residue,
-- Activity 4 retitled; total associations 69 -> 73.
