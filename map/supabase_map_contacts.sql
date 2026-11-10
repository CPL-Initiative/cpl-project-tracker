-- ─────────────────────────────────────────────────────────────────────────
-- map_college_contacts — gated per-college contact roster for the MAP-Users
-- refresh NUDGE (StarMax, Session 87, 2026-06-30)
--
-- The MAP-Users tab's 📣 "nudge this college to refresh their users" action
-- opens a pre-filled mailto: to the college's key contacts (Sam's pick:
-- **Primary Contact** = the College Contact, **VPAA** = VP of Academic Affairs
-- (Instruction), **VPSS** = VP of Student Services). Those live in MAP
-- "College Contacts" (View_CollegeContacts_APIDataset, 121 rows = 1/college) —
-- a WIDE one-column-per-role table that also carries **Last Updated On**, the
-- per-college staleness signal the tab surfaces.
--
-- This is STAFF PII (names + emails), so — like map_college_users — it lives
-- ONLY here, gated: reviewer / team-phrase read, service-role write, NO anon
-- access (there's no public aggregate; contacts are a reviewer-only tool).
-- Synced server-side by map/sync_map_users.py.
--
-- Applied live via the Supabase MCP; this file is the schema of record.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.map_college_contacts (
  college                text primary key,
  primary_contact        text,
  primary_contact_email  text,
  vpaa                   text,   -- VP of Academic Affairs (Instruction)
  vpaa_email             text,
  vpss                   text,   -- VP of Student Services
  vpss_email             text,
  ceo                    text,   -- College CEO / President (added Session 87 follow-up)
  ceo_email              text,
  cpl_coordinator        text,   -- CPL Coordinator (added 2026-07-06) — feeds the
  cpl_coordinator_email  text,   -- funding tab's eligibility badge via the PII-free
                                 -- anon map_coordinator_summary() RPC (boolean only;
                                 -- name/email stay gated here like every contact)
  landing_page_url       text,   -- the college's MAP CPL dashboard URL (joined from
                                 -- chatbox_college_profiles in the sync) → the nudge
                                 -- links the college straight to their MAP page so
                                 -- they can log in + update their users
  last_updated_on        text,   -- MAP's "Last Updated On" (per-college staleness)
  synced_at              timestamptz not null default now()
);

alter table public.map_college_contacts enable row level security;

-- Reviewer / team-phrase read ONLY (no anon — these are PII contact emails).
drop policy if exists mcc_select on public.map_college_contacts;
create policy mcc_select on public.map_college_contacts for select
  using (is_allowed_reviewer() or team_pass_ok());
-- No anon/authenticated write policies → only the service-role sync mutates it.

-- Atomic full-refresh (service-role only) — mirrors map_users_replace; the
-- explicit `where true` clears the pg-safeupdate guard on the API roles.
create or replace function public.map_contacts_replace(p_rows jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.map_college_contacts where true;
  insert into public.map_college_contacts
        (college, primary_contact, primary_contact_email, vpaa, vpaa_email,
         vpss, vpss_email, ceo, ceo_email, cpl_coordinator, cpl_coordinator_email,
         landing_page_url, last_updated_on, synced_at)
  select r.college, r.primary_contact, r.primary_contact_email, r.vpaa, r.vpaa_email,
         r.vpss, r.vpss_email, r.ceo, r.ceo_email, r.cpl_coordinator, r.cpl_coordinator_email,
         r.landing_page_url, r.last_updated_on, now()
  from jsonb_to_recordset(p_rows) as r(
         college text, primary_contact text, primary_contact_email text,
         vpaa text, vpaa_email text, vpss text, vpss_email text,
         ceo text, ceo_email text, cpl_coordinator text, cpl_coordinator_email text,
         landing_page_url text, last_updated_on text)
  where coalesce(r.college, '') <> '';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.map_contacts_replace(jsonb) from public, anon, authenticated;
grant execute on function public.map_contacts_replace(jsonb) to service_role;

-- ── map_college_nudges — the "last nudged" log (Session 87 follow-up) ──────
-- One row per college, kept SEPARATE from map_college_contacts so the monthly
-- full-refresh sync never wipes it. The tab upserts it (Prefer:
-- resolution=merge-duplicates) when a reviewer opens a nudge; reviewer/
-- team-phrase read + write (it's an internal accountability log).
create table if not exists public.map_college_nudges (
  college        text primary key,
  last_nudged_at timestamptz not null default now(),
  last_nudged_by text
);
alter table public.map_college_nudges enable row level security;
drop policy if exists mcn_select on public.map_college_nudges;
create policy mcn_select on public.map_college_nudges for select
  using (is_allowed_reviewer() or team_pass_ok());
drop policy if exists mcn_insert on public.map_college_nudges;
create policy mcn_insert on public.map_college_nudges for insert
  with check (is_allowed_reviewer() or team_pass_ok());
drop policy if exists mcn_update on public.map_college_nudges;
create policy mcn_update on public.map_college_nudges for update
  using (is_allowed_reviewer() or team_pass_ok())
  with check (is_allowed_reviewer() or team_pass_ok());

-- ── map_coordinator_summary — PII-free public eligibility aggregate ────────
-- (added 2026-07-06, migration map_coordinator_summary_rpc) Per college, ONLY
-- whether a CPL Coordinator is on file (boolean) + the sync timestamp — the
-- Implementation Funding tab's baseline-eligibility badge ①. Mirrors the
-- map_users_summary() SECURITY DEFINER pattern; the coordinator's name/email
-- never leave the gated table via this path.
-- THE FIRST CONDITION HAS THREE PARTS (Sam, 2026-09-29, open-asks sheet 4 card 1:
-- "Check all three"): a CPL Coordinator, a primary CPL contact, and the college's
-- CPL landing page configured. The function adds one boolean per part, so the
-- public page and the reviewer's tab run the same check without either seeing a
-- name: the published mirror (map_college_contacts_pub) has no primary contact.
-- A person counts by name OR email, as the coordinator always has; the landing
-- page counts as an https URL (122 of 122 on file were https, 2026-09-29).
-- A SECOND WAY TO MEET IT (Sam, in session 2026-11-09, S621): "if there is a cpl coordinator role listed in map
-- users AND a cpl assistant email in map users, we can count them as satisfying the CPL coordinator condition
-- without having to do any manual checks." has_cpl_assistant answers the second half as a boolean, never the
-- address; the tab meets the condition on the three parts OR on coordinator plus assistant. Measured 2026-11-09:
-- 59 of 124 meet the three parts, 45 have coordinator plus assistant, 2 meet it only the new way.
-- THE NONCREDIT CPL LEAD ROLE IN MAP (Sam, in session 2026-11-09, S622): "itpi just added the nc cpl lead role to
-- the map users we pull ... we can start listing that role next to the priority requiring attestation of a nc cpl
-- lead and complete the attestation for them if the nc cpl lead role is in map." The role shows on a college's CPL
-- landing page (map_landing_contacts.contact_title), pulled daily. Two booleans, never a name:
--   has_nc_cpl_lead     a contact titled exactly "Noncredit CPL Lead" (any case). It stands in for the whole
--                       noncredit attestation, the strike-team condition included, with no form (Sam, in session
--                       2026-11-10: "Nc yes exact wor whole", then "Word").
--   nc_lead_title_near  a title that names noncredit and is not the role ("CPL Coordinator/Noncredit Lead",
--                       "Noncredit CPL Coordinator"): it meets nothing, and tells a CSM to ask for the role.
-- Measured 2026-11-09 (the 11-08 18:13Z pull): 2 colleges carry the role, 2 a near title; every one of the 105
-- landing pages' colleges matches map_college_contacts by name.
-- A return type cannot change under CREATE OR REPLACE, so the function is
-- dropped and recreated; the grant below restores what it held.
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
