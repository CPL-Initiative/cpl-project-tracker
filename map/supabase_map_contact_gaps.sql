-- ─────────────────────────────────────────────────────────────────────────
-- map/supabase_map_contact_gaps.sql — the STUDENT-CONTACT gap worklist
-- Session 120 (SkyMail, 2026-08-05). Schema of record; applied live via the
-- Supabase MCP as migrations map_contact_gaps_worklist,
-- map_contacts_six_more_roles_and_person_cascade, map_contact_gaps_person_cascade_v2.
--
-- WHY THIS EXISTS (Sam, 2026-08-05): "The big goal is to have all College
-- Landing Pages include contact so when students request CPL, it goes to a real
-- person who can respond. MAP is set up to send requests to the Primary Contact
-- using the PC email."
--
-- The one field in the routing path is map_college_contacts.primary_contact_email.
-- 25 of 123 colleges have it empty, and 24 of those have a live landing page —
-- so a student asking those colleges for CPL through MAP reaches nobody.
--
-- THE GOVERNING RULE (Sam, same day): colleges are LOCALLY GOVERNED, so we
-- cannot make determinations for them. That rules out adopting a shared-inbox
-- convention on their behalf (an earlier draft had one — removed), and it rules
-- out defaulting to leadership. What it leaves is the defensible core:
--
--     every proposal is a person the COLLEGE already designated in MAP.
--
-- We are not appointing anyone; we are routing their landing page to someone
-- they already named. The cascade, CPL-specific designations first:
--     CPL Coordinator > CPL Assistant > CPL Counselor
--   > Articulation Officer > Lead Initiator > Faculty Lead
-- Anything left over is flagged needs_ask with a reason — never defaulted.
-- VPAA/CEO are carried on the row for the ask email's recipient list, but are
-- deliberately NOT a proposal rung: routing student requests into a vice
-- president's inbox is the college's call to make, not ours.
--
-- READ-ONLY BY DESIGN. MAP is the system of record for contacts and exposes no
-- write API (docs/kb-notes/adr-surface-dont-edit-readonly-system-of-record.md),
-- so this view PROPOSES and the MAP team enters the value in MAP. The proposal
-- is computed, never stored, so it cannot drift from the source; when a value
-- lands in MAP the next sync drops that college off the list on its own.
--
-- GATING: `security_invoker = true` makes the view run with the CALLER's rights,
-- so the RLS already on map_college_users / map_college_contacts
-- (is_allowed_reviewer() OR team_pass_ok()) does the gating — anon sees ZERO
-- rows with no new policy to get wrong (verified: anon count = 0 on the view and
-- both base tables). Do NOT drop security_invoker; the default definer semantics
-- would publish every staff email to the public anon key.
-- ─────────────────────────────────────────────────────────────────────────

-- ── The six contact roles we were not syncing ─────────────────────────────
-- View_CollegeContacts_APIDataset carries 24 fields; the sync pulled 11. A
-- value-signature probe (map/probe_users_schema.py run #11) confirmed these,
-- with the fill rates shown. They are the raw material for the cascade above.
alter table public.map_college_contacts
  add column if not exists cpl_assistant_email        text,  -- 52/123
  add column if not exists cpl_counselor              text,  -- 65/123
  add column if not exists cpl_counselor_email        text,
  add column if not exists articulation_officer       text,  -- 87/123
  add column if not exists articulation_officer_email text,
  add column if not exists faculty_lead               text,  -- 84/123
  add column if not exists faculty_lead_email         text,
  add column if not exists lead_initiator             text,  -- 82/123
  add column if not exists lead_initiator_email       text,
  add column if not exists senate_president           text,  -- 67/123
  add column if not exists senate_president_email     text,
  add column if not exists certifying_official        text,  -- 101/123
  add column if not exists certifying_official_email  text;

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

-- ── Non-college entities in the MAP roster ────────────────────────────────
-- The user roster carries test/sandbox colleges and the statewide team account
-- alongside the 120 real institutions, and they were silently inflating the
-- tab's PUBLIC headline (2,769 users / 128 "colleges" → really 2,657 / 120).
-- Classify rather than delete: the rows are legitimate MAP data, just not colleges.
create or replace function public.map_college_kind(p_college text)
returns text language sql immutable as $$
  select case
    when p_college is null then 'college'
    -- the statewide CPL Initiative team account (102 users) — real people, not a college
    when upper(trim(p_college)) = 'CA MAP INITIATIVE COLLEGE' then 'statewide'
    when trim(p_college) in (
      'CabTest College', 'MorTest City College', 'Nortest City College',
      'RivTest City College', 'SantTest Ana College', 'Testing College',
      'NORCO College - Syllabus Manager'
    ) then 'test'
    when p_college ~* '(^|[^a-z])test([^a-z]|$)' then 'test'
    else 'college'
  end;
$$;

-- MAP contact-email cells sometimes hold SEVERAL addresses (Primary Contact
-- Email runs to 262 chars, Faculty Lead Email to 1,172) and sometimes hold junk
-- (single-character values). A proposal has to be one routable address, so take
-- the first thing that IS an address, and count the rest so the worklist can say
-- so rather than hiding the truncation.
create or replace function public.map_first_email(p text)
returns text language sql immutable as $$
  select (regexp_match(coalesce(p, ''), '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'))[1];
$$;
create or replace function public.map_count_emails(p text)
returns integer language sql immutable as $$
  select count(*)::int
  from unnest(regexp_split_to_array(coalesce(p, ''), '[;,|[:space:]]+')) x
  where x like '%@%';
$$;

-- ── The worklist ──────────────────────────────────────────────────────────
drop view if exists public.map_contact_gaps;
create view public.map_contact_gaps
with (security_invoker = true) as
with counts as (
  select college,
         count(*)::int as total_users,
         count(*) filter (where user_status = 'Active')::int as active_users
  from public.map_college_users
  group by college
),
base as (
  select
    c.college,
    public.map_college_kind(c.college) as college_kind,
    nullif(trim(coalesce(c.primary_contact, '')), '') as primary_contact,
    public.map_first_email(c.primary_contact_email)   as primary_contact_email,
    public.map_count_emails(c.primary_contact_email)  as primary_contact_email_count,
    nullif(trim(coalesce(c.cpl_coordinator, '')), '') as cpl_coordinator,
    public.map_first_email(c.cpl_coordinator_email)   as coord_email,
    public.map_first_email(c.cpl_assistant_email)     as asst_email,
    nullif(trim(coalesce(c.cpl_counselor, '')), '')   as cpl_counselor,
    public.map_first_email(c.cpl_counselor_email)     as couns_email,
    nullif(trim(coalesce(c.articulation_officer, '')), '') as articulation_officer,
    public.map_first_email(c.articulation_officer_email)   as ao_email,
    nullif(trim(coalesce(c.lead_initiator, '')), '')  as lead_initiator,
    public.map_first_email(c.lead_initiator_email)    as init_email,
    nullif(trim(coalesce(c.faculty_lead, '')), '')    as faculty_lead,
    public.map_first_email(c.faculty_lead_email)      as fac_email,
    nullif(trim(coalesce(c.vpaa, '')), '')            as vpaa,
    public.map_first_email(c.vpaa_email)              as vpaa_email,
    nullif(trim(coalesce(c.ceo, '')), '')             as ceo,
    public.map_first_email(c.ceo_email)               as ceo_email,
    nullif(trim(coalesce(c.landing_page_url, '')), '') as landing_page_url,
    coalesce(n.total_users, 0)  as total_users,
    coalesce(n.active_users, 0) as active_users,
    c.synced_at
  from public.map_college_contacts c
  left join counts n on n.college = c.college
)
select
  college, college_kind,
  primary_contact, primary_contact_email,
  (primary_contact_email_count > 1) as primary_contact_multi_email,
  (primary_contact_email is not null) as has_student_contact,
  cpl_coordinator, coord_email as cpl_coordinator_email,
  (coord_email is not null) as has_coordinator,
  asst_email as cpl_assistant_email,
  landing_page_url, total_users, active_users, synced_at,
  case
    when coord_email is not null then 'CPL Coordinator'
    when asst_email  is not null then 'CPL Assistant'
    when couns_email is not null then 'CPL Counselor'
    when ao_email    is not null then 'Articulation Officer'
    when init_email  is not null then 'Lead Initiator'
    when fac_email   is not null then 'Faculty Lead'
  end as proposed_source,
  case
    when coord_email is not null then cpl_coordinator
    when asst_email  is not null then null   -- MAP exposes no "CPL Assistant" NAME column
    when couns_email is not null then cpl_counselor
    when ao_email    is not null then articulation_officer
    when init_email  is not null then lead_initiator
    when fac_email   is not null then faculty_lead
  end as proposed_name,
  coalesce(coord_email, asst_email, couns_email, ao_email, init_email, fac_email)
    as proposed_email,
  (primary_contact_email is null
   and coalesce(coord_email, asst_email, couns_email, ao_email, init_email, fac_email) is null
  ) as needs_ask,
  case
    when primary_contact_email is not null
      or coalesce(coord_email, asst_email, couns_email, ao_email, init_email, fac_email) is not null
      then null
    when vpaa_email is not null or ceo_email is not null
      then 'leadership only'   -- a VPAA/CEO is on file but no CPL-side designation
    when total_users = 0
      then 'no MAP presence'   -- a contacts row but ZERO users: onboarding, not routing
    else 'no contacts on file'
  end as ask_reason,
  vpaa, vpaa_email, ceo, ceo_email
from base;

comment on view public.map_contact_gaps is
  'Student-contact worklist. Colleges with no Primary Contact email (the address MAP routes student CPL requests to), each with a proposed replacement drawn ONLY from contacts the college itself designated in MAP (CPL Coordinator > CPL Assistant > CPL Counselor > Articulation Officer > Lead Initiator > Faculty Lead). Anything else is flagged needs_ask rather than defaulted: colleges are locally governed, so we route to their people and never choose new ones. security_invoker=true.';

-- The grant is not the gate — RLS on the base tables is (a security_invoker view
-- cannot see rows the caller can't). anon is granted so a signed-in reviewer
-- using the anon key + a JWT / team-phrase header reaches it; without those
-- claims the underlying policies return zero rows.
grant select on public.map_contact_gaps to anon, authenticated, service_role;

-- ── Public summary: label the non-colleges (no PII) ───────────────────────
-- Adds college_kind so the tab can keep test/sandbox entries out of the public
-- headline. The function still returns every row — the consumer decides what to
-- show, so this stays a labelling change, not a hidden filter.
drop function if exists public.map_users_summary();
create or replace function public.map_users_summary()
returns table(college text, college_kind text, user_count bigint, active_count bigint,
              role_mix jsonb, last_synced timestamptz)
language sql stable security definer set search_path to 'public' as $function$
  with per_role as (
    select college,
           coalesce(nullif(role_name, ''), '(unspecified)') as role,
           count(*)::int as n,
           sum(case when user_status = 'Active' then 1 else 0 end)::int as act,
           max(synced_at) as synced
    from public.map_college_users
    group by college, coalesce(nullif(role_name, ''), '(unspecified)')
  )
  select college,
         public.map_college_kind(college) as college_kind,
         sum(n)::bigint            as user_count,
         sum(act)::bigint          as active_count,
         jsonb_object_agg(role, n) as role_mix,
         max(synced)               as last_synced
  from per_role
  group by college;
$function$;

revoke all on function public.map_users_summary() from public;
grant execute on function public.map_users_summary() to anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- governance_owners — the Governance tab's owner column, made curatable
-- (Session 120, migration governance_owners_curation).
--
-- The register (kb/governance_register.json) is COMMITTED and rebuilt by
-- sessions; owners are CURATED live by the team. Different lifecycles, so
-- different homes — the same split that keeps map_college_nudges out of
-- map_college_contacts, where the monthly full-refresh would wipe the curator's
-- work. This table overlays the register by row id (DR-01, CA-03, …), so a
-- session regenerating the register can never destroy an assignment.
--
-- NO delete policy, deliberately: clearing an owner is an UPDATE to null, so the
-- record of who assigned what survives. Governance decisions should be
-- revisable, not erasable.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.governance_owners (
  register_id text primary key,
  owner       text,
  note        text,
  set_by      text not null,
  set_at      timestamptz not null default now()
);
alter table public.governance_owners enable row level security;
drop policy if exists go_select on public.governance_owners;
create policy go_select on public.governance_owners for select
  using (is_allowed_reviewer() or team_pass_ok());
drop policy if exists go_insert on public.governance_owners;
create policy go_insert on public.governance_owners for insert
  with check (is_allowed_reviewer() or team_pass_ok());
drop policy if exists go_update on public.governance_owners;
create policy go_update on public.governance_owners for update
  using (is_allowed_reviewer() or team_pass_ok())
  with check (is_allowed_reviewer() or team_pass_ok());
