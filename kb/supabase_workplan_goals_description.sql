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

-- Pending curator confirmation (NOT applied here): pruning the leftover
-- "Activity 5: Strategic Initiatives & Special Projects" residue. It is more
-- entangled than a bare label — 4 active projects (1.1/1.3/1.4/2.1) carry a
-- stale SECONDARY association to Activity 5, and 2 held-out ghost projects
-- (5.1 AI-Ready California, 5.5) have Activity 5 as their ONLY link + a 5.1
-- ladder in workplan_goals. The safe removal (label rows + the 4 secondary
-- associations, PRESERVING the held-out 5.1/5.5) runs once the curator OKs the
-- depth:
--   delete from public.workplan_goals
--     where activity_id = '5' and kind = 'activity';
--   delete from public.workplan_activity_associations
--     where activity_id = '5' and is_primary = false;   -- 1.1, 1.3, 1.4, 2.1
