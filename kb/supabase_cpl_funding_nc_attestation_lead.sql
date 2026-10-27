-- S491 (SkySalmonberry), 2026-10-26, at Sam's ask on the funding tab's noncredit attestation:
-- "Add check boxes for the employee type: Staff, FT Faculty, PT Faculty, Administrator. Tell us briefly about
-- the assignment ... How often does the NC Lead meet with credit CPL colleagues?" Three columns the form
-- writes; like the attestor's name and email they go to the Chancellor's Office alone: no column grant to
-- anon, so the published view never shows them, and the review RPC returns them to a reviewer or the team
-- phrase. The public insert keeps its policy (cna_insert_self); the columns are optional to the table and
-- required by the form. Rollback: drop the three columns and restore the review function from
-- kb/supabase_cpl_funding_nc_attestation.sql as of 2f0aaed1.
alter table public.cpl_funding_nc_attestation add column if not exists lead_types text[];
alter table public.cpl_funding_nc_attestation add column if not exists lead_assignment text;
alter table public.cpl_funding_nc_attestation add column if not exists lead_meets text;
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

-- The review RPC returns the three beside what it returned; its row type changes, so it is dropped first.
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
select column_name from information_schema.columns
 where table_name = 'cpl_funding_nc_attestation' and column_name like 'lead_%' order by 1;
