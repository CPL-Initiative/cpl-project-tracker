-- A district's own email domain counts on the public funding forms (S506, 2026-10-28).
--
-- Sam, 2026-10-28, in session, answering whether North Orange Continuing Education staff writing from
-- the district's nocccd.edu may confirm participation and attest: "Yes on NOCE" (cpl_memory
-- sam-funding-noce-district-domain-2026-10-28).
--
-- The rule of 2026-10-27 (kb/migrations/2026-10-27_s500_funding_request_review.sql) counts a district
-- domain only when MAP holds an address on it for two or more of the district's colleges. Read S506:
-- MAP holds no nocccd.edu address for Cypress, Fullerton or NOCE, so that rule could never pass it.
-- This table names a district's own domain outright, and both domain functions read it beside the
-- addresses on file. Like every district domain, it counts for each college of that district.
-- It has no public reader or writer: the two SECURITY DEFINER functions read it, and a row is added
-- by a migration like this one.
--
-- Rollback: restore cpl_funding_email_domains from kb/migrations/2026-10-27_s500_funding_request_review.sql
-- (cpl_funding_email_domain_ok is unchanged and reads it), then
--   drop table public.cpl_funding_district_domains;

create table if not exists public.cpl_funding_district_domains (
  district text not null,
  domain   text not null check (domain = lower(domain) and domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'),
  source   text not null,
  added_at timestamptz not null default now(),
  primary key (district, domain)
);
alter table public.cpl_funding_district_domains enable row level security;
-- No policy: the functions read it as their owner. Default privileges grant anon and authenticated
-- every privilege, so take them back.
revoke all on public.cpl_funding_district_domains from public, anon, authenticated;
grant select, insert, update, delete on public.cpl_funding_district_domains to service_role;

insert into public.cpl_funding_district_domains (district, domain, source) values
  ('North Orange County Community College District', 'nocccd.edu', 'Sam, 2026-10-28 (S506): "Yes on NOCE"')
on conflict (district, domain) do nothing;

create or replace function public.cpl_funding_email_domains(p_key text)
returns text[]
language sql stable security definer set search_path = ''
as $fn$
  with me as (
    select m.map_college, m.district from public.cpl_funding_college_map m
    where m.key = p_key or m.map_college = p_key
  ),
  addr as (
    -- every address on file for a college, with that college's district
    select m.map_college, m.district,
           lower(split_part(btrim(x), '@', 2)) as domain
    from public.cpl_funding_college_map m
    join public.map_college_contacts c on c.college = m.map_college
    cross join lateral regexp_split_to_table(concat_ws(',',
        c.primary_contact_email, c.vpaa_email, c.vpss_email, c.ceo_email, c.cpl_coordinator_email,
        c.cpl_assistant_email, c.cpl_counselor_email, c.articulation_officer_email, c.faculty_lead_email,
        c.lead_initiator_email, c.senate_president_email, c.certifying_official_email), '[,;[:space:]]+') as x
    where btrim(x) ~* '^[^@[:space:]]+@[a-z0-9-]+(\.[a-z0-9-]+)+$'
  ),
  ok as (
    select distinct a.domain from addr a
    where a.domain not in ('gmail.com','yahoo.com','hotmail.com','outlook.com','live.com','msn.com',
                           'icloud.com','me.com','aol.com','comcast.net','att.net','sbcglobal.net',
                           'protonmail.com','proton.me','ymail.com')
      and (
        -- the institution's own domains
        a.map_college in (select map_college from me)
        -- or its district's: on file for two or more of the district's colleges
        or (a.district is not null and a.district in (select district from me where district is not null)
            and (select count(distinct a2.map_college) from addr a2
                 where a2.domain = a.domain and a2.district = a.district) >= 2)
      )
    union
    -- or its district's own domain, named outright (S506)
    select d.domain from public.cpl_funding_district_domains d
    where d.district in (select district from me where district is not null)
  )
  select coalesce(array_agg(domain order by domain), '{}') from ok;
$fn$;

revoke all on function public.cpl_funding_email_domains(text) from public;
grant execute on function public.cpl_funding_email_domains(text) to anon, authenticated, service_role;
