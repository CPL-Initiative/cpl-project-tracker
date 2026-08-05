-- ─────────────────────────────────────────────────────────────────────────
-- map/supabase_map_contact_gaps.sql — the STUDENT-CONTACT gap worklist
-- Session 120 (SkyRoute, 2026-08-05). Schema of record; applied live via MCP.
--
-- WHY THIS EXISTS (Sam, 2026-08-05): "The big goal is to have all College
-- Landing Pages include contact so when students request CPL, it goes to a real
-- person who can respond. MAP is set up to send requests to the Primary Contact
-- using the PC email."
--
-- So the ONE field in the routing path is map_college_contacts.primary_contact_email.
-- 25 of 123 colleges have it empty — and 24 of those 25 have a live landing page,
-- which means a student's CPL request on those pages reaches nobody. This view is
-- the worklist for closing that, plus a DEFAULT PROPOSAL per college drawn from
-- contacts MAP already holds.
--
-- THE CASCADE (Sam's call — "operational cascade", leadership last):
--   1. a SHARED/ROLE INBOX already among the college's active MAP users
--      (cpl@…, articulation@…) — preferred because it survives staff turnover,
--      which is the reason most of these gaps exist in the first place;
--   2. CPL Coordinator (contacts);
--   3. active Articulation Officer (users);
--   4. active Initiator (users);
--   5. VPAA  — leadership, flagged so the nudge can say why;
--   6. CEO   — leadership, flagged;
--   7. nothing → needs_human.
--
-- READ-ONLY BY DESIGN. MAP is the system of record for contacts and exposes no
-- write API (docs/kb-notes/adr-surface-dont-edit-readonly-system-of-record.md),
-- so this view PROPOSES and the MAP team enters the value in MAP. Nothing here
-- writes back, and the proposal is computed — not stored — so it can never drift
-- from the source. When a value lands in MAP, the next sync drops that college
-- off the list on its own.
--
-- GATING: `security_invoker = true` makes the view run with the CALLER's rights,
-- so the RLS already on map_college_users / map_college_contacts
-- (is_allowed_reviewer() OR team_pass_ok()) does the gating. anon sees ZERO rows
-- without a single new policy to get wrong. Do NOT drop security_invoker — the
-- default (definer) semantics would publish every staff email to the anon key.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Non-college entities in the MAP roster ────────────────────────────────
-- The user roster carries test/sandbox colleges and the statewide team account
-- alongside the 120 real institutions. They were silently inflating the tab's
-- PUBLIC headline (2,769 users / 128 "colleges" → really 2,657 / 120). Classify
-- rather than delete: the rows are legitimate MAP data, they just aren't colleges.
create or replace function public.map_college_kind(p_college text)
returns text language sql immutable as $$
  select case
    when p_college is null then 'college'
    -- the statewide CPL Initiative team account (102 users) — real people, not a college
    when upper(trim(p_college)) = 'CA MAP INITIATIVE COLLEGE' then 'statewide'
    -- sandbox/QA entries seeded by the MAP team
    when trim(p_college) in (
      'CabTest College', 'MorTest City College', 'Nortest City College',
      'RivTest City College', 'SantTest Ana College', 'Testing College',
      'NORCO College - Syllabus Manager'
    ) then 'test'
    when p_college ~* '(^|[^a-z])test([^a-z]|$)' then 'test'
    else 'college'
  end;
$$;

-- ── Shared / role inbox detection ─────────────────────────────────────────
-- A role address (cpl@, articulation@, veterans@) is the durable answer to a
-- contact that keeps going stale. Matches the LOCAL PART only, and only when it
-- is entirely a role word — a person named "Curtis P. Long" at cpl.long@… must
-- not match, hence the anchored alternation rather than a substring search.
create or replace function public.map_is_shared_inbox(p_email text)
returns boolean language sql immutable as $$
  select coalesce(
    lower(split_part(p_email, '@', 1)) ~
      ('^(cpl|priorlearning|prior_learning|prior-learning|creditforpriorlearning'
       || '|articulation|artic|veteran|veterans|vet|vets|admissions|records'
       || '|registrar|evaluation|evaluations|counseling|transcript|transcripts'
       || '|info|welcome|onestop|one-stop|onestopshop)'
       || '([._-]?(office|team|dept|department|info|help|desk|center|centre|services))?$'),
    false);
$$;

-- ── The worklist ──────────────────────────────────────────────────────────
drop view if exists public.map_contact_gaps;
create view public.map_contact_gaps
with (security_invoker = true) as
with active_users as (
  select
    college, role_name, email,
    trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')) as full_name,
    row_number() over (
      partition by college, role_name
      -- deterministic pick: freshest MAP record first, then alphabetical, so the
      -- proposal is stable between runs instead of shuffling with row order
      order by nullif(last_updated_on, '') desc nulls last,
               coalesce(last_name, ''), coalesce(email, '')
    ) as rn
  from public.map_college_users
  where user_status = 'Active' and nullif(trim(coalesce(email, '')), '') is not null
),
-- the first shared inbox among a college's active users, whatever the role
shared_inbox as (
  select distinct on (college) college, email, full_name
  from active_users
  where public.map_is_shared_inbox(email)
  order by college, coalesce(full_name, ''), email
),
by_role as (
  select
    college,
    max(case when role_name = 'Articulation Officer' and rn = 1 then full_name end) as ao_name,
    max(case when role_name = 'Articulation Officer' and rn = 1 then email     end) as ao_email,
    max(case when role_name = 'Initiator'            and rn = 1 then full_name end) as init_name,
    max(case when role_name = 'Initiator'            and rn = 1 then email     end) as init_email
  from active_users
  group by college
),
counts as (
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
    nullif(trim(coalesce(c.primary_contact, '')), '')       as primary_contact,
    nullif(trim(coalesce(c.primary_contact_email, '')), '') as primary_contact_email,
    nullif(trim(coalesce(c.cpl_coordinator, '')), '')       as cpl_coordinator,
    nullif(trim(coalesce(c.cpl_coordinator_email, '')), '') as cpl_coordinator_email,
    nullif(trim(coalesce(c.vpaa, '')), '')       as vpaa,
    nullif(trim(coalesce(c.vpaa_email, '')), '') as vpaa_email,
    nullif(trim(coalesce(c.ceo, '')), '')        as ceo,
    nullif(trim(coalesce(c.ceo_email, '')), '')  as ceo_email,
    nullif(trim(coalesce(c.landing_page_url, '')), '') as landing_page_url,
    si.email as inbox_email, si.full_name as inbox_name,
    r.ao_name, r.ao_email, r.init_name, r.init_email,
    coalesce(n.total_users, 0)  as total_users,
    coalesce(n.active_users, 0) as active_users,
    c.synced_at
  from public.map_college_contacts c
  left join shared_inbox si on si.college = c.college
  left join by_role      r  on r.college  = c.college
  left join counts       n  on n.college  = c.college
)
select
  college,
  college_kind,
  primary_contact,
  primary_contact_email,
  (primary_contact_email is not null) as has_student_contact,
  cpl_coordinator,
  cpl_coordinator_email,
  (cpl_coordinator_email is not null) as has_coordinator,
  landing_page_url,
  total_users,
  active_users,
  synced_at,
  -- the cascade, in Sam's order
  case
    when inbox_email is not null           then 'Shared inbox'
    when cpl_coordinator_email is not null then 'CPL Coordinator'
    when ao_email   is not null            then 'Articulation Officer'
    when init_email is not null            then 'Initiator'
    when vpaa_email is not null            then 'VPAA'
    when ceo_email  is not null            then 'CEO'
  end as proposed_source,
  coalesce(inbox_name, nullif(coalesce(
    case when inbox_email is not null then inbox_name
         when cpl_coordinator_email is not null then cpl_coordinator
         when ao_email   is not null then ao_name
         when init_email is not null then init_name
         when vpaa_email is not null then vpaa
         when ceo_email  is not null then ceo
    end, ''), '')) as proposed_name,
  case
    when inbox_email is not null           then inbox_email
    when cpl_coordinator_email is not null then cpl_coordinator_email
    when ao_email   is not null            then ao_email
    when init_email is not null            then init_email
    when vpaa_email is not null            then vpaa_email
    when ceo_email  is not null            then ceo_email
  end as proposed_email,
  -- leadership got picked only because nobody operational was on file; the nudge
  -- says so out loud rather than quietly parking students in a VP's inbox
  (inbox_email is null and cpl_coordinator_email is null and ao_email is null
   and init_email is null and (vpaa_email is not null or ceo_email is not null)
  ) as proposed_is_leadership,
  (inbox_email is not null) as proposed_is_shared_inbox,
  -- nothing to propose. Today these are continuing-ed institutions carrying a
  -- contacts row but ZERO MAP users — an onboarding problem, not a contact one.
  (primary_contact_email is null and inbox_email is null and cpl_coordinator_email is null
   and ao_email is null and init_email is null and vpaa_email is null and ceo_email is null
  ) as needs_human
from base;

comment on view public.map_contact_gaps is
  'Student-contact worklist: which colleges have no Primary Contact email (the address MAP routes student CPL requests to) plus a computed default proposal. security_invoker=true — RLS on the base tables gates it; anon sees nothing.';

-- PostgREST exposure. The grant is not the gate — RLS on the base tables is (a
-- security_invoker view cannot see rows the caller can't). anon is granted so a
-- signed-in reviewer using the anon key + a JWT/team-phrase reaches it; without
-- those claims the underlying policies return zero rows.
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
