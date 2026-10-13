-- Rollback for project_lifecycle_reviewer_only_2026_10_13_s385 (S385 SkyHazel).
-- Sam, Open Asks Sheet 77 card 2 ("Reviewer only on both tabs", 2026-10-13 22:25Z)
-- dropped the team phrase from the three write policies. These are the policies as
-- they stood before (read live 2026-10-13 ~22:40Z from pg_policies), so running this
-- file restores the phrase's write. The client (project_lifecycle.js) would also need
-- its pre-S385 version for a phrase holder to see the control again.
drop policy if exists plc_insert on public.project_lifecycle;
create policy plc_insert on public.project_lifecycle for insert
  with check (is_allowed_reviewer() or team_pass_ok());
drop policy if exists plc_update on public.project_lifecycle;
create policy plc_update on public.project_lifecycle for update
  using (is_allowed_reviewer() or team_pass_ok())
  with check (is_allowed_reviewer() or team_pass_ok());
drop policy if exists plc_delete on public.project_lifecycle;
create policy plc_delete on public.project_lifecycle for delete
  using (is_allowed_reviewer() or team_pass_ok());
