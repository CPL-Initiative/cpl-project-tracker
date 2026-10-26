-- ============================================================================
-- Implementation Funding: the noncredit attestation (Scenario 4)
-- Session S470 SkyBlueCurls, 2026-10-25. Applied through supabase-migrate.yml
-- (kb/migrations/.apply) to project hvuwhnbuahrtptokpqfh; this file is the SQL
-- of record. Idempotent: safe to re-run.
--
-- WHAT THIS DOES
--   Sam's Open Asks Sheets 113 and 114 (2026-10-22; cpl_memory
--   sam-sheet-113-rulings-2026-10-22, sam-sheet-114-rulings-2026-10-22) gate a
--   scenario's noncredit share on two conditions: a noncredit CPL coordinator
--   named and published on the college's landing page, and a strike-team
--   attestation renewed each year, taken in COBI until MAP carries the role
--   (card 5, cobi-then-map). The same attestation reports the count of former
--   noncredit students the college awarded CPL (funded by nothing), and carries
--   what the noncredit builder will read: the exhibits the strike team attests
--   (NC-1's fourth channel) and the control number of the CPL portfolio course
--   (NC-2, confirmed in COCI).
--
--   The shape is the participation opt-in's (kb/supabase_funding_optin.sql):
--   ATTEST-FIRST. A college's submission stands at once (status
--   'self_attested'); the CO acts only to reject one (Sam, 2026-09-28, the
--   participation lane's rule), can re-confirm a rejected one, and removes a
--   rejected row so the college can attest again. One row per college and
--   fiscal year (July to June, '2026-27'); a new year needs a new row, which is
--   the renewal.
--
-- GOVERNANCE (Rule 10 a3): folded into DR-09, the implementation funding
--   decision (kb/governance_register.json; kb/governance_surface_map.json maps
--   the table, the view and the RPC to it). The CO decides; a college attests.
--
-- PRIVACY (adr-funding-counts-mask-under-10-units-carry-the-money,
--   adr-student-detail-aggregate-disclosure-control):
--     * Published (anon, through cpl_funding_nc_attestation_pub): college,
--       fiscal year, status, the coordinator's name and title, and the dates.
--       The coordinator is a public-facing role the college publishes on its
--       landing page, as map_college_contacts_pub publishes the CPL coordinator.
--     * Never published: the attestor's name, title and email, the exhibits,
--       the course, and the award count. The coordinator's email is not
--       collected: the condition needs the name, and MAP's directory will
--       carry the role's contact (tests/cpl_funding_equity's PII guard). Column-level SELECT is
--       revoked from anon and authenticated and granted back on the published
--       columns alone; anon can WRITE a self-attestation it cannot read back
--       (the form posts with Prefer: return=minimal and re-reads the view).
--     * The award count is a per-college student count: the review RPC returns
--       it whole to a signed-in reviewer (is_allowed_reviewer(), the
--       student-detail ADR's gate) and, to the team phrase, masks 1 to 9 as
--       null (the funding ADR's floor of 10).
-- ============================================================================

-- 1. the fiscal year a date falls in, California's July-to-June year ------------
create or replace function public.cpl_funding_fy(d date)
returns text language sql immutable set search_path = ''
as $$
  select case when extract(month from d) >= 7
    then extract(year from d)::int::text || '-' || lpad(((extract(year from d)::int + 1) % 100)::text, 2, '0')
    else (extract(year from d)::int - 1)::text || '-' || lpad((extract(year from d)::int % 100)::text, 2, '0')
  end;
$$;
-- The view and the insert policy call it as the reader, so every role keeps EXECUTE.
grant execute on function public.cpl_funding_fy(date) to anon, authenticated, service_role;

-- 2. the table ------------------------------------------------------------------
create table if not exists public.cpl_funding_nc_attestation (
  id                 uuid primary key default gen_random_uuid(),
  college            text not null,
  fiscal_year        text not null,
  status             text not null default 'self_attested',
  source             text not null default 'self',
  coordinator_name   text,
  coordinator_title  text,
  attestor_name      text,
  attestor_title     text,
  attestor_email     text,
  nc_awarded_count   integer,
  attested_exhibits  text,
  portfolio_course   text,
  lead_types         text[],          -- S491: the Lead's employee type(s)
  lead_assignment    text,
  lead_meets         text,
  requested_at       timestamptz not null default now(),
  confirmed_at       timestamptz,
  confirmed_by       text,
  revoked_at         timestamptz,
  noted_by           text
);
alter table public.cpl_funding_nc_attestation enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cna_status_chk') then
    alter table public.cpl_funding_nc_attestation add constraint cna_status_chk
      check (status in ('self_attested', 'confirmed', 'rejected', 'revoked'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cna_source_chk') then
    alter table public.cpl_funding_nc_attestation add constraint cna_source_chk
      check (source in ('self', 'reviewer'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cna_fy_chk') then
    alter table public.cpl_funding_nc_attestation add constraint cna_fy_chk
      check (fiscal_year ~ '^20[0-9]{2}-[0-9]{2}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cna_len_chk') then
    alter table public.cpl_funding_nc_attestation add constraint cna_len_chk check (
      char_length(college) between 1 and 120
      and (coordinator_name  is null or char_length(coordinator_name)  <= 120)
      and (coordinator_title is null or char_length(coordinator_title) <= 80)
      and (attestor_name     is null or char_length(attestor_name)     <= 120)
      and (attestor_title    is null or char_length(attestor_title)    <= 60)
      and (attestor_email    is null or char_length(attestor_email)    <= 160)
      and (attested_exhibits is null or char_length(attested_exhibits) <= 2000)
      and (portfolio_course  is null or char_length(portfolio_course)  <= 60)
      and (confirmed_by      is null or char_length(confirmed_by)      <= 160)
      and (noted_by          is null or char_length(noted_by)          <= 160)
      and (nc_awarded_count  is null or nc_awarded_count between 0 and 100000)
    );
  end if;
end $$;
-- The Lead's details (S491; kb/supabase_cpl_funding_nc_attestation_lead.sql applied them live).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cna_lead_chk') then
    alter table public.cpl_funding_nc_attestation add constraint cna_lead_chk check (
      (lead_types is null or (cardinality(lead_types) between 1 and 4
        and lead_types <@ array['staff', 'ft_faculty', 'pt_faculty', 'administrator']::text[]))
      and (lead_assignment is null or char_length(lead_assignment) <= 300)
      and (lead_meets      is null or char_length(lead_meets)      <= 120)
    );
  end if;
end $$;
create unique index if not exists cna_college_fy_uq
  on public.cpl_funding_nc_attestation (college, fiscal_year);

-- 3. grants: RLS is the gate for writes; reads see the published columns alone --
revoke all on public.cpl_funding_nc_attestation from anon, authenticated;
grant select (college, fiscal_year, status, coordinator_name, coordinator_title,
              requested_at, confirmed_at, revoked_at)
  on public.cpl_funding_nc_attestation to anon, authenticated;
grant insert, update, delete on public.cpl_funding_nc_attestation to anon, authenticated;
grant all on public.cpl_funding_nc_attestation to service_role;

-- 4. policies -------------------------------------------------------------------
drop policy if exists cna_select on public.cpl_funding_nc_attestation;
create policy cna_select on public.cpl_funding_nc_attestation
  for select to anon, authenticated using (true);

-- A college's own attestation: the constrained public insert (the form).
drop policy if exists cna_insert_self on public.cpl_funding_nc_attestation;
create policy cna_insert_self on public.cpl_funding_nc_attestation
  for insert to anon, authenticated
  with check (
    status = 'self_attested' and source = 'self'
    and confirmed_at is null and confirmed_by is null and revoked_at is null and noted_by is null
    and fiscal_year in (public.cpl_funding_fy(current_date),
                        public.cpl_funding_fy((current_date + interval '1 year')::date))
    and char_length(btrim(college)) between 1 and 120
    and coordinator_name is not null and btrim(coordinator_name) <> ''
    and coordinator_title is not null and btrim(coordinator_title) <> ''
    and attestor_name is not null and btrim(attestor_name) <> ''
    and attestor_title in ('VPAA', 'VPSS', 'CEO', 'NCDEAN', 'Other')
    and attestor_email is not null
        and attestor_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );

-- The CO: record one on a college's behalf, reject, re-confirm, remove.
drop policy if exists cna_insert_reviewer on public.cpl_funding_nc_attestation;
create policy cna_insert_reviewer on public.cpl_funding_nc_attestation
  for insert to anon, authenticated with check (public.is_allowed_reviewer());
drop policy if exists cna_update on public.cpl_funding_nc_attestation;
create policy cna_update on public.cpl_funding_nc_attestation
  for update to anon, authenticated
  using (public.is_allowed_reviewer()) with check (public.is_allowed_reviewer());
drop policy if exists cna_delete on public.cpl_funding_nc_attestation;
create policy cna_delete on public.cpl_funding_nc_attestation
  for delete to anon, authenticated using (public.is_allowed_reviewer());

-- 5. the published view: this fiscal year's attestations and the next's ----------
-- A row from a year that has ended drops out on July 1, so the condition reads
-- not met until the college renews. security_invoker: the reader's own column
-- grants apply, so the view can never show a column the table hides.
create or replace view public.cpl_funding_nc_attestation_pub
  with (security_invoker = true) as
  select a.college, a.fiscal_year, a.status, a.coordinator_name, a.coordinator_title,
         a.requested_at, a.confirmed_at, a.revoked_at
  from public.cpl_funding_nc_attestation a
  where a.fiscal_year >= public.cpl_funding_fy(current_date);
grant select on public.cpl_funding_nc_attestation_pub to anon, authenticated, service_role;

-- 6. the CO's read: names, emails, the attested lists, the count ------------------
-- Its row type grew in S491 (the Lead's details), so a re-run drops it first.
drop function if exists public.cpl_funding_nc_attestation_review();
create or replace function public.cpl_funding_nc_attestation_review()
returns table (
  college text, fiscal_year text, status text, source text,
  coordinator_name text, coordinator_title text,
  attestor_name text, attestor_title text, attestor_email text,
  nc_awarded_count integer, attested_exhibits text, portfolio_course text,
  lead_types text[], lead_assignment text, lead_meets text,
  requested_at timestamptz, confirmed_at timestamptz, confirmed_by text, revoked_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare
  reviewer boolean := public.is_allowed_reviewer();
begin
  -- Anyone else gets zero rows, never a name or an email.
  if not (reviewer or public.team_pass_ok()) then
    return;
  end if;
  return query
    select a.college, a.fiscal_year, a.status, a.source,
           a.coordinator_name, a.coordinator_title,
           a.attestor_name, a.attestor_title, a.attestor_email,
           case when reviewer or a.nc_awarded_count is null or a.nc_awarded_count = 0
                     or a.nc_awarded_count >= 10
                then a.nc_awarded_count end,
           a.attested_exhibits, a.portfolio_course,
           a.lead_types, a.lead_assignment, a.lead_meets,
           a.requested_at, a.confirmed_at, a.confirmed_by, a.revoked_at
    from public.cpl_funding_nc_attestation a
    order by (a.status = 'self_attested') desc, a.requested_at desc;
end;
$$;
revoke all on function public.cpl_funding_nc_attestation_review() from public, anon, authenticated;
grant execute on function public.cpl_funding_nc_attestation_review() to anon, authenticated, service_role;
