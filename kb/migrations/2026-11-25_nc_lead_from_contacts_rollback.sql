-- Rollback of 2026-11-25_nc_lead_from_contacts.sql: the two functions as they stood live before it (read
-- 2026-11-25 with pg_get_functiondef), then the two columns dropped. Data in them is MAP's and comes back on the
-- next sync once the forward file is applied again.

create or replace function public.map_contacts_replace(p_rows jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.map_college_contacts where true;
  insert into public.map_college_contacts
        (college, primary_contact, primary_contact_email, vpaa, vpaa_email,
         vpss, vpss_email, ceo, ceo_email, cpl_coordinator, cpl_coordinator_email,
         cpl_assistant_email, cpl_counselor, cpl_counselor_email,
         articulation_officer, articulation_officer_email,
         faculty_lead, faculty_lead_email, lead_initiator, lead_initiator_email,
         senate_president, senate_president_email,
         certifying_official, certifying_official_email,
         landing_page_url, last_updated_on, synced_at)
  select r.college, r.primary_contact, r.primary_contact_email, r.vpaa, r.vpaa_email,
         r.vpss, r.vpss_email, r.ceo, r.ceo_email, r.cpl_coordinator, r.cpl_coordinator_email,
         r.cpl_assistant_email, r.cpl_counselor, r.cpl_counselor_email,
         r.articulation_officer, r.articulation_officer_email,
         r.faculty_lead, r.faculty_lead_email, r.lead_initiator, r.lead_initiator_email,
         r.senate_president, r.senate_president_email,
         r.certifying_official, r.certifying_official_email,
         r.landing_page_url, r.last_updated_on, now()
  from jsonb_to_recordset(p_rows) as r(
         college text, primary_contact text, primary_contact_email text,
         vpaa text, vpaa_email text, vpss text, vpss_email text,
         ceo text, ceo_email text, cpl_coordinator text, cpl_coordinator_email text,
         cpl_assistant_email text, cpl_counselor text, cpl_counselor_email text,
         articulation_officer text, articulation_officer_email text,
         faculty_lead text, faculty_lead_email text,
         lead_initiator text, lead_initiator_email text,
         senate_president text, senate_president_email text,
         certifying_official text, certifying_official_email text,
         landing_page_url text, last_updated_on text)
  where coalesce(r.college, '') <> '';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.map_contacts_replace(jsonb) from public, anon, authenticated;
grant execute on function public.map_contacts_replace(jsonb) to service_role;

create or replace function public.map_coordinator_summary()
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
revoke all on function public.map_coordinator_summary() from public;
grant execute on function public.map_coordinator_summary() to anon, authenticated, service_role;

alter table public.map_college_contacts drop column if exists nc_cpl_lead;
alter table public.map_college_contacts drop column if exists nc_cpl_lead_email;
