-- Rollback of 2026-11-09_nc_cpl_lead_in_map.sql (S622): restores the six-column map_coordinator_summary() as it
-- stood before (read 2026-11-09 ~21:20Z) and its grant. The tab reads a missing has_nc_cpl_lead as false, so the
-- Noncredit CPL Lead condition falls back to the attestation alone.
drop function if exists public.map_coordinator_summary();
create function public.map_coordinator_summary()
returns table (college text, has_coordinator boolean, has_primary_contact boolean,
               has_landing_page boolean, last_synced timestamptz, has_cpl_assistant boolean)
language sql stable security definer set search_path = public as $$
  select college,
         (nullif(trim(coalesce(cpl_coordinator, '')), '') is not null
          or nullif(trim(coalesce(cpl_coordinator_email, '')), '') is not null) as has_coordinator,
         (nullif(trim(coalesce(primary_contact, '')), '') is not null
          or nullif(trim(coalesce(primary_contact_email, '')), '') is not null) as has_primary_contact,
         (coalesce(landing_page_url, '') ~* '^https://[^[:space:]]+$') as has_landing_page,
         synced_at as last_synced,
         (nullif(trim(coalesce(cpl_assistant_email, '')), '') is not null) as has_cpl_assistant
  from public.map_college_contacts;
$$;
grant execute on function public.map_coordinator_summary() to anon, authenticated, service_role;
