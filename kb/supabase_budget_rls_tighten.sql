-- ============================================================================
-- Budget / Personnel RLS tighten — mirror public.projects / public.workplan_goals
-- Excel→Supabase Phase 3 (Budget editor) · §8 schema change · pre-approved
-- (Sam authorized via the Budget-editor AskUserQuestion, 2026-05-31)
-- ============================================================================
-- Applied via the Supabase MCP `apply_migration` (the established one-shot-DDL
-- path); committed here for provenance + rollback reference.
--
-- WHY: public.budget_funding, public.budget_expenditures, and public.personnel
-- each carried a LOOSE policy
--   "Allow auth write"  ALL  using(true) with check(true)
-- which lets ANY caller with the public anon key (i.e. ANY signed-in user, not
-- just allowed_reviewers) INSERT/UPDATE/DELETE rows. These are public
-- dashboard source-of-truth tables (budget read-path cut over in PR #189), so
-- a write-open policy is the same latent gap projects/workplan_goals had before
-- their tighten. This replaces the loose policy with is_allowed_reviewer()-gated
-- writes (the exact projects_* / wpg_* shape). Public SELECT is preserved.
--
-- The budget_funding tighten is the prerequisite for budget_editor.js (the
-- inline funding-plan editor). budget_expenditures (held empty) + personnel
-- (deduped 26→13, editor deferred) are tightened in the same pass to close the
-- gap consistently — defense-in-depth even ahead of their own editors.
--
-- PRECONDITIONS (true on hvuwhnbuahrtptokpqfh):
--   * RLS is ENABLED on all three tables
--   * public.is_allowed_reviewer() exists (SECURITY DEFINER; checks the
--     allowed_reviewers table against the JWT email)
-- ============================================================================

begin;

-- ── budget_funding ─────────────────────────────────────────────────────────
drop policy if exists "Allow auth write" on public.budget_funding;

drop policy if exists budget_funding_insert on public.budget_funding;
create policy budget_funding_insert on public.budget_funding
  for insert to public with check (is_allowed_reviewer());

drop policy if exists budget_funding_update on public.budget_funding;
create policy budget_funding_update on public.budget_funding
  for update to public using (is_allowed_reviewer()) with check (is_allowed_reviewer());

drop policy if exists budget_funding_delete on public.budget_funding;
create policy budget_funding_delete on public.budget_funding
  for delete to public using (is_allowed_reviewer());

drop policy if exists "Allow public read" on public.budget_funding;
create policy "Allow public read" on public.budget_funding
  for select to public using (true);

-- ── budget_expenditures ────────────────────────────────────────────────────
drop policy if exists "Allow auth write" on public.budget_expenditures;

drop policy if exists budget_expenditures_insert on public.budget_expenditures;
create policy budget_expenditures_insert on public.budget_expenditures
  for insert to public with check (is_allowed_reviewer());

drop policy if exists budget_expenditures_update on public.budget_expenditures;
create policy budget_expenditures_update on public.budget_expenditures
  for update to public using (is_allowed_reviewer()) with check (is_allowed_reviewer());

drop policy if exists budget_expenditures_delete on public.budget_expenditures;
create policy budget_expenditures_delete on public.budget_expenditures
  for delete to public using (is_allowed_reviewer());

drop policy if exists "Allow public read" on public.budget_expenditures;
create policy "Allow public read" on public.budget_expenditures
  for select to public using (true);

-- ── personnel ──────────────────────────────────────────────────────────────
drop policy if exists "Allow auth write" on public.personnel;

drop policy if exists personnel_insert on public.personnel;
create policy personnel_insert on public.personnel
  for insert to public with check (is_allowed_reviewer());

drop policy if exists personnel_update on public.personnel;
create policy personnel_update on public.personnel
  for update to public using (is_allowed_reviewer()) with check (is_allowed_reviewer());

drop policy if exists personnel_delete on public.personnel;
create policy personnel_delete on public.personnel
  for delete to public using (is_allowed_reviewer());

drop policy if exists "Allow public read" on public.personnel;
create policy "Allow public read" on public.personnel
  for select to public using (true);

commit;

-- Verify:
--   select tablename, policyname, cmd, qual, with_check from pg_policies
--   where schemaname='public'
--     and tablename in ('budget_funding','budget_expenditures','personnel')
--   order by tablename, cmd;
