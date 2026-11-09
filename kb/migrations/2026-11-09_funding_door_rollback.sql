-- Rollback of 2026-11-09_funding_door.sql: the funding and CSM surfaces go back to is_allowed_reviewer(), then the
-- door's functions and tables leave. A door session keeps its Auth user but opens nothing. The Edge Function
-- funding-door then fails closed (its table is gone); delete it from the dashboard to remove it entirely.
do $$
declare p record; f text; d text;
begin
  for p in select tablename, policyname, qual, with_check from pg_policies
           where schemaname = 'public'
             and (coalesce(qual, '') like '%is_funding_reviewer()%' or coalesce(with_check, '') like '%is_funding_reviewer()%')
  loop
    execute format('alter policy %I on public.%I', p.policyname, p.tablename)
      || case when p.qual is not null then format(' using (%s)', replace(p.qual, 'is_funding_reviewer()', 'is_allowed_reviewer()')) else '' end
      || case when p.with_check is not null then format(' with check (%s)', replace(p.with_check, 'is_funding_reviewer()', 'is_allowed_reviewer()')) else '' end;
  end loop;
  foreach f in array array['cpl_funding_optin_review', 'cpl_funding_nc_attestation_review',
                           'cpl_funding_requester_context', 'map_landing_contacts_roster'] loop
    select pg_get_functiondef(pr.oid) into d from pg_proc pr join pg_namespace n on n.oid = pr.pronamespace
     where n.nspname = 'public' and pr.proname = f;
    if d is not null and d like '%is_funding_reviewer()%' then
      execute replace(d, 'is_funding_reviewer()', 'is_allowed_reviewer()');
    end if;
  end loop;
end $$;
drop function if exists public.funding_access_decide(uuid, text);
drop function if exists public.funding_access_pending();
drop function if exists public.funding_access_status(uuid, text);
drop function if exists public.funding_access_request(text, text);
drop function if exists public.is_funding_approver();
drop function if exists public.is_funding_reviewer();
drop table if exists public.funding_access;
drop table if exists public.funding_access_requests;
