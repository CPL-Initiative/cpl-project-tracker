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
         vpss, vpss_email, ceo, ceo_email, last_updated_on, synced_at)
  select r.college, r.primary_contact, r.primary_contact_email, r.vpaa, r.vpaa_email,
         r.vpss, r.vpss_email, r.ceo, r.ceo_email, r.last_updated_on, now()
  from jsonb_to_recordset(p_rows) as r(
         college text, primary_contact text, primary_contact_email text,
         vpaa text, vpaa_email text, vpss text, vpss_email text,
         ceo text, ceo_email text, last_updated_on text)
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
