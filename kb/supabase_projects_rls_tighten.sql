-- ============================================================================
-- Projects RLS tighten — mirror public.workplan_goals
-- Phase 2 PR-3 · fork #6 (pre-approved 2026-05-28) · §8 schema change
-- ============================================================================
-- NOT auto-applied. Run on Sam's go via the Supabase MCP `apply_migration`
-- (the established one-shot-DDL path, same as the Activity↔Project PR-A
-- migration) or the Supabase dashboard SQL editor.
--
-- WHY: public.projects currently carries a LOOSE policy
--   "Allow auth write"  ALL  using(true) with check(true)
-- which lets ANY caller with the public anon key INSERT/UPDATE/DELETE rows.
-- The table is empty today, but once seeded (PR-3 apply) + exposed on the
-- public dashboard, that's a write-open source-of-truth table. This replaces
-- the loose policy with is_allowed_reviewer()-gated writes, exactly mirroring
-- the workplan_goals shape (wpg_insert / wpg_update / wpg_delete). Public
-- SELECT is preserved.
--
-- PRECONDITIONS (already true on hvuwhnbuahrtptokpqfh as of 2026-05-28):
--   * RLS is ENABLED on public.projects (relrowsecurity = true)
--   * public.is_allowed_reviewer() exists (SECURITY DEFINER; checks the
--     allowed_reviewers table against the JWT email)
--
-- ORDER: apply this BEFORE the seed (kb/_seed_projects_apply.py via the
-- projects-seed-apply workflow) so seeded rows are protected immediately.
-- The service_role key used by the seed bypasses RLS, so the seed works
-- regardless — but the public table should never sit seeded + write-open.
-- ============================================================================

begin;

-- 1. Drop the loose write-all policy.
drop policy if exists "Allow auth write" on public.projects;

-- 2. Gated writes — mirror wpg_insert / wpg_update / wpg_delete.
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert to public
  with check (is_allowed_reviewer());

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update to public
  using (is_allowed_reviewer())
  with check (is_allowed_reviewer());

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects
  for delete to public
  using (is_allowed_reviewer());

-- 3. Public read stays open (recreate idempotently to a known-good state).
drop policy if exists "Allow public read" on public.projects;
create policy "Allow public read" on public.projects
  for select to public
  using (true);

commit;

-- Verify (optional):
--   select policyname, cmd, qual, with_check from pg_policies
--   where schemaname='public' and tablename='projects' order by cmd;
