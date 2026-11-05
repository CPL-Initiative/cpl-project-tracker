-- Rollback of 2026-11-05_security_step2_phrase_lockout_orphans_team_members.sql:
-- the function bodies and policies as read live on 2026-11-05 before the migration.
begin;

drop policy if exists tm_select on public.team_members;
create policy tm_select on public.team_members for select to public using (true);

grant execute on function public.team_pass_check(text) to anon, authenticated;
grant execute on function public.gr_pass_check(text)   to anon, authenticated;
grant execute on function public.fin_pass_check(text)  to anon, authenticated;
grant execute on function public.cobi_nav_audit()     to anon, authenticated;
grant execute on function public.sierra_rules_audit() to anon, authenticated;
grant execute on function public.rls_auto_enable()    to anon, authenticated;

drop function if exists public.team_pass_verify(text);

create or replace function public.team_pass_check(p text)
returns boolean language sql stable security definer set search_path = 'public' as $$
  select exists (
    select 1 from public.team_access
    where id <> 'gr'          -- GR is a site phrase, not a shared-team phrase
      and secret = p
  );
$$;
create or replace function public.gr_pass_check(p text)
returns boolean language sql stable security definer set search_path = 'public' as $$
  select exists (select 1 from public.team_access where id = 'gr' and secret = p);
$$;
create or replace function public.fin_pass_check(p text)
returns boolean language sql stable security definer set search_path = 'public' as $$
  select exists (select 1 from public.team_access where id = 'fin' and secret = p);
$$;

drop function if exists public.team_pass_locked();
drop function if exists public.cpl_request_ip();
drop table if exists public.team_pass_attempts;

drop policy if exists kpi_snapshots_college_service on public.kpi_snapshots_college;
drop policy if exists kpi_snapshots_statewide_service on public.kpi_snapshots_statewide;
drop policy if exists update_log_service on public.update_log;
create policy "Service role full access" on public.kpi_snapshots_college for all to public using (true) with check (true);
create policy "Service role full access" on public.kpi_snapshots_statewide for all to public using (true) with check (true);
create policy "Allow auth write" on public.update_log for all to public using (true) with check (true);
create policy "Allow public read" on public.update_log for select to public using (true);
grant all on table public.kpi_snapshots_college to anon, authenticated;
grant all on table public.kpi_snapshots_statewide to anon, authenticated;
grant all on table public.update_log to anon, authenticated;

commit;
