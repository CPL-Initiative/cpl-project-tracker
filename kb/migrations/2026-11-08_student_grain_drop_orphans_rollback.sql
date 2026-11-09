-- ROLLBACK of kb/migrations/2026-11-08_student_grain_drop_orphans.sql (S604): recreates both tables EMPTY with
-- the columns, RLS, policy and grants read live on 2026-11-08 before the drop. The rows are not restored (Sam's
-- ruling keeps none; MAP is the system of record). Grants follow PR 1: anon and authenticated keep SELECT only.
create table if not exists public.map_student_credit_prev (
  student_key integer not null, college_id integer not null, exhibit_id text not null,
  course_type text not null, catalog_year text not null);
alter table public.map_student_credit_prev enable row level security;
create policy map_student_credit_select on public.map_student_credit_prev for select using (public.is_allowed_reviewer());
grant select on public.map_student_credit_prev to anon, authenticated;
grant all on public.map_student_credit_prev to service_role;

create table if not exists public.stg_student_credit (
  student_key text, college_id text, exhibit_id text, source_row_id text, credit_rec text, course_type text,
  catalog_year text, potential_credits text, credits_in_review text, applied_credits text, transcribed_credits text,
  articulated_credits text, military_credits text, non_military_credits text, apprenticeship_credits text,
  cpl_status_plan text);
alter table public.stg_student_credit enable row level security;
grant select on public.stg_student_credit to anon, authenticated;
grant all on public.stg_student_credit to service_role;
