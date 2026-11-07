-- ROLLBACK of kb/migrations/2026-11-07_tmc_submissions_owner_token.sql (S602): restores the policies and grants
-- read live on 2026-11-07 before it. Revert tmc_builder.js in the same window, since the old client reads select=*.
revoke select (id, college, tmc_id, tmc_discipline, degree_type, alignments, notes, contact_name, contact_email,
               status, total_major_units, filled_slots, total_slots, created_at, updated_at, review_note,
               reviewed_by, reviewed_at)
  on public.tmc_submissions from anon, authenticated;
grant select, truncate, trigger, references on public.tmc_submissions to anon, authenticated;

drop policy if exists tmc_submissions_owner_update on public.tmc_submissions;
create policy tmc_submissions_anon_update on public.tmc_submissions
  for update to anon
  using (true)
  with check (status = any (array['draft'::text, 'submitted'::text]));

drop policy if exists tmc_submissions_anon_insert on public.tmc_submissions;
create policy tmc_submissions_anon_insert on public.tmc_submissions
  for insert to anon
  with check (status = any (array['draft'::text, 'submitted'::text]));

drop function if exists public.tmc_request_token();
alter table public.tmc_submissions drop column if exists owner_token;
