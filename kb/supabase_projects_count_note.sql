-- Receipt: projects.count_note — how a sub-activity's annual goal numbers are counted.
--
-- Sam, 2026-10-12 (S372): "I think I need to be able to add Notes for annual goals
-- for each activity to define what the numbers will be counting. Some are tech
-- development improvements that are not readily countable by the system."
--
-- projects.kpi_unit already carries the SHORT label of what is counted (it prints
-- beside the number on the Activities cards, e.g. "Cumulative MAP features added
-- and significantly enhanced"); count_note carries the longer definition. Both are
-- edited on the Annual Workplan Goals tab, shown on the Activities tab cards, and
-- sent to the report generator.
--
-- Applied live to Supabase via the MCP apply_migration tool
-- (name: add_projects_count_note) on 2026-10-12. Nullable, no default, no backfill:
-- reversible by `alter table public.projects drop column count_note;`.
-- RLS unchanged: projects UPDATE is already gated to is_allowed_reviewer() OR
-- team_pass_ok() (kb/supabase_projects_rls_tighten.sql), which covers the new PATCH
-- from workplan_goals.js. Not a new writer to a shared table (Rule 10 a3).

alter table public.projects add column if not exists count_note text;
comment on column public.projects.count_note is 'How this sub-activity''s annual goal numbers are counted (Sam, 2026-10-12: notes that define what the numbers count, for tech-development items the system cannot count). Edited on the Annual Workplan Goals tab; shown on the Activities tab cards and in the report generator. kpi_unit stays the short label of what is counted.';
