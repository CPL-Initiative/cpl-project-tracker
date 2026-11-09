-- 2026-11-09 (S622 SkyCartwheel): the Noncredit CPL Lead role in MAP, on map_coordinator_summary().
-- Sam, in session: "itpi just added the nc cpl lead role to the map users we pull ... we can start listing that
-- role next to the priority requiring attestation of a nc cpl lead and complete the attestation for them if the nc
-- cpl lead role is in map." His two calls (2026-11-09, "yes" to both recommendations): the role meets the Noncredit
-- CPL Lead condition alone; the exact title only, with a near title flagged for a CSM.
-- Source of truth: map/supabase_map_contacts.sql. Adds two booleans read from map_landing_contacts; no name, title
-- or address leaves the database. Read-only: no table, policy or write changes. Rollback beside it.
drop function if exists public.map_coordinator_summary();
create function public.map_coordinator_summary()
returns table (college text, has_coordinator boolean, has_primary_contact boolean,
               has_landing_page boolean, last_synced timestamptz, has_cpl_assistant boolean,
               has_nc_cpl_lead boolean, nc_lead_title_near boolean)
language sql stable security definer set search_path = public as $$
  select c.college,
         (nullif(trim(coalesce(c.cpl_coordinator, '')), '') is not null
          or nullif(trim(coalesce(c.cpl_coordinator_email, '')), '') is not null) as has_coordinator,
         (nullif(trim(coalesce(c.primary_contact, '')), '') is not null
          or nullif(trim(coalesce(c.primary_contact_email, '')), '') is not null) as has_primary_contact,
         (coalesce(c.landing_page_url, '') ~* '^https://[^[:space:]]+$') as has_landing_page,
         c.synced_at as last_synced,
         (nullif(trim(coalesce(c.cpl_assistant_email, '')), '') is not null) as has_cpl_assistant,
         exists (select 1 from public.map_landing_contacts l
                  where lower(trim(l.college)) = lower(trim(c.college))
                    and lower(trim(l.contact_title)) = 'noncredit cpl lead') as has_nc_cpl_lead,
         exists (select 1 from public.map_landing_contacts l
                  where lower(trim(l.college)) = lower(trim(c.college))
                    and l.contact_title ~* 'non-?credit'
                    and lower(trim(l.contact_title)) <> 'noncredit cpl lead') as nc_lead_title_near
  from public.map_college_contacts c;
$$;
-- PUBLIC holds EXECUTE from creation; the page and the tab read this as anon, by design (booleans alone).
revoke all on function public.map_coordinator_summary() from public;
grant execute on function public.map_coordinator_summary() to anon, authenticated, service_role;
