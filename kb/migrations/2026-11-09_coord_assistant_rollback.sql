-- Rollback of the 2026-11-09 has_cpl_assistant column on map_coordinator_summary() (S621; source
-- map/supabase_map_contacts.sql, applied by MCP as map_coordinator_summary_cpl_assistant). Restores the five-column
-- function as it stood before (read 2026-11-09 ~18:05Z) and its grant. The tab reads a missing has_cpl_assistant as
-- false, so the condition falls back to the three parts.
drop function if exists public.map_coordinator_summary();
create function public.map_coordinator_summary()
returns table (college text, has_coordinator boolean, has_primary_contact boolean,
               has_landing_page boolean, last_synced timestamptz)
language sql stable security definer set search_path = public as $$
  select college,
         (nullif(trim(coalesce(cpl_coordinator, '')), '') is not null
          or nullif(trim(coalesce(cpl_coordinator_email, '')), '') is not null) as has_coordinator,
         (nullif(trim(coalesce(primary_contact, '')), '') is not null
          or nullif(trim(coalesce(primary_contact_email, '')), '') is not null) as has_primary_contact,
         (coalesce(landing_page_url, '') ~* '^https://[^[:space:]]+$') as has_landing_page,
         synced_at as last_synced
  from public.map_college_contacts;
$$;
grant execute on function public.map_coordinator_summary() to anon, authenticated, service_role;
