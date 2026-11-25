-- The Noncredit CPL Lead from MAP's College Contacts report (Sam, in session 2026-11-25: "pedro added the nc lead
-- and nc lead email to the college contacts report so we can use it now to update the nc qualifying requirement").
-- The report's columns are "Noncredit CPL Lead" and "Noncredit CPL Lead Email" (value-signature probe, run
-- 45662551870: 25 of 124 colleges filled). Until now the funding page read the role only from a landing-page
-- contact titled exactly "Noncredit CPL Lead" (2 colleges on 2026-11-09).
--
-- 1. Two gated columns on map_college_contacts (reviewer / team-phrase read, service-role write, as every contact).
-- 2. map_contacts_replace carries them from the daily sync (map/sync_map_users.py).
-- 3. map_coordinator_summary's has_nc_cpl_lead reads the report's lead (a name or an email) OR the landing-page
--    title. Still a boolean, never a name. The signature is unchanged, so CREATE OR REPLACE keeps the grants.
-- Rollback: kb/migrations/2026-11-25_nc_lead_from_contacts_rollback.sql.

alter table public.map_college_contacts add column if not exists nc_cpl_lead text;
alter table public.map_college_contacts add column if not exists nc_cpl_lead_email text;

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
         nc_cpl_lead, nc_cpl_lead_email,
         landing_page_url, last_updated_on, synced_at)
  select r.college, r.primary_contact, r.primary_contact_email, r.vpaa, r.vpaa_email,
         r.vpss, r.vpss_email, r.ceo, r.ceo_email, r.cpl_coordinator, r.cpl_coordinator_email,
         r.cpl_assistant_email, r.cpl_counselor, r.cpl_counselor_email,
         r.articulation_officer, r.articulation_officer_email,
         r.faculty_lead, r.faculty_lead_email, r.lead_initiator, r.lead_initiator_email,
         r.senate_president, r.senate_president_email,
         r.certifying_official, r.certifying_official_email,
         r.nc_cpl_lead, r.nc_cpl_lead_email,
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
         nc_cpl_lead text, nc_cpl_lead_email text,
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
         (nullif(trim(coalesce(c.nc_cpl_lead, '')), '') is not null
          or nullif(trim(coalesce(c.nc_cpl_lead_email, '')), '') is not null
          or exists (select 1 from public.map_landing_contacts l
                      where lower(trim(l.college)) = lower(trim(c.college))
                        and lower(trim(l.contact_title)) = 'noncredit cpl lead')) as has_nc_cpl_lead,
         exists (select 1 from public.map_landing_contacts l
                  where lower(trim(l.college)) = lower(trim(c.college))
                    and l.contact_title ~* 'non-?credit'
                    and lower(trim(l.contact_title)) <> 'noncredit cpl lead') as nc_lead_title_near
  from public.map_college_contacts c;
$$;
revoke all on function public.map_coordinator_summary() from public;
grant execute on function public.map_coordinator_summary() to anon, authenticated, service_role;
