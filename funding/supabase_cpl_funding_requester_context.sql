-- funding/supabase_cpl_funding_requester_context.sql
--
-- Who sent a funding request, read beside the request (Sam, 2026-10-31,
-- SkyCloudberry): "check to see if they are a map user and add their map role
-- next to their name ... check if they are listed on the college landing page
-- and give info on that as well--keep it all as simple and short as possible."
--
-- 1. public.map_landing_contacts — a mirror of the contacts each college's MAP
--    landing page lists (cpldashboardcccco.azurewebsites.net/<slug>, which
--    draws them from the public api/ui-settings/<slug>). map/sync_landing_contacts.py
--    writes it daily from the MAP users sync's runner through
--    map_landing_contacts_replace(). The page is public; the mirror is still
--    staff names and emails, so it is closed to every API role: RLS on, no
--    policy, and no grant. Only the service role and the definer functions
--    below read it.
-- 2. public.cpl_funding_requester_context() — for a signed-in reviewer (or the
--    team phrase, the gate the two review feeds use), one row per request:
--    the requester's MAP user rows and landing-page listings, and for a
--    noncredit attestation the named Lead's too. Anyone else gets no rows.
--    Matching: the email exactly (any case), else the name (first and last
--    word, "Last, First" turned round, parentheses and initials dropped) at
--    the same email domain for MAP users, and the name alone for the landing
--    page (most listings carry no email). The client names the college when a
--    listing is another college's.
--
-- Rollback: drop function public.cpl_funding_requester_context();
--           drop function public.map_landing_contacts_replace(jsonb);
--           drop function public.cpl_funding_name_key(text);
--           drop table public.map_landing_contacts;
-- No row a person wrote lives here; the table is rebuilt whole every run.

create table if not exists public.map_landing_contacts (
  id bigint generated always as identity primary key,
  slug text not null,
  map_college_id integer,
  college text not null,
  contact_title text,
  contact_name text not null,
  contact_email text,
  contact_order integer,
  synced_at timestamptz not null default now()
);
alter table public.map_landing_contacts enable row level security;
revoke all on public.map_landing_contacts from public, anon, authenticated;
-- New tables get no Data API grant by default (from 2026-10-30): the service
-- role, which the sync and the definer functions stand on, is granted here.
grant select, insert, update, delete on public.map_landing_contacts to service_role;

-- "Torres-Benavides, Cari M" and "Cari Torres-Benavides" both read
-- "cari torresbenavides"; "(Interim) Jon Endicott" reads "jon endicott";
-- "Dr. Brenda Estrada" reads "brenda estrada"; accents fold ("Elizarrarás").
-- A single word gives null: a first name alone matches nobody.
create or replace function public.cpl_funding_name_key(n text)
returns text
language sql
immutable
set search_path to ''
as $$
  with a as (
    select case when position(',' in coalesce(n, '')) > 0
                then split_part(n, ',', 2) || ' ' || split_part(n, ',', 1)
                else coalesce(n, '') end as s
  ), w as (
    select array_agg(t.w order by t.o) as w
    from a, regexp_split_to_table(
           regexp_replace(regexp_replace(
             translate(lower(a.s), 'áàâäãåéèêëíìîïóòôöõúùûüñç', 'aaaaaaeeeeiiiiooooouuuunc'),
             '\([^)]*\)', ' ', 'g'), '[^a-z ]', '', 'g'),
           '\s+') with ordinality as t(w, o)
    where length(t.w) > 1
      and t.w not in ('dr', 'mr', 'mrs', 'ms', 'mx', 'prof', 'jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'edd', 'md')
  )
  select case when coalesce(array_length(w.w, 1), 0) >= 2
              then w.w[1] || ' ' || w.w[array_length(w.w, 1)] end
  from w;
$$;
revoke all on function public.cpl_funding_name_key(text) from public, anon, authenticated;

-- The sync's one write: delete all, insert all, in one transaction.
create or replace function public.map_landing_contacts_replace(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare n integer;
begin
  -- Explicit WHERE: pg-safeupdate blocks an unqualified DELETE via the API roles.
  delete from public.map_landing_contacts where true;
  insert into public.map_landing_contacts
        (slug, map_college_id, college, contact_title, contact_name, contact_email, contact_order, synced_at)
  select r.slug, r.map_college_id, r.college, nullif(trim(r.contact_title), ''), trim(r.contact_name),
         nullif(trim(r.contact_email), ''), r.contact_order, now()
  from jsonb_to_recordset(p_rows) as r(slug text, map_college_id integer, college text,
         contact_title text, contact_name text, contact_email text, contact_order integer)
  where coalesce(trim(r.contact_name), '') <> '' and coalesce(r.college, '') <> '';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.map_landing_contacts_replace(jsonb) from public, anon, authenticated;
grant execute on function public.map_landing_contacts_replace(jsonb) to service_role;

create or replace function public.cpl_funding_requester_context()
returns table(kind text, college text, fiscal_year text, map_users jsonb, landing jsonb)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  -- Anyone else gets zero rows, never a name or an email.
  if not (public.is_allowed_reviewer() or public.team_pass_ok()) then
    return;
  end if;
  return query
  with req as (
    select 'part'::text as kind, p.college, null::text as fiscal_year,
           lower(trim(p.attestor_email)) as em, p.attestor_name as nm,
           split_part(lower(trim(p.attestor_email)), '@', 2) as dom
    from public.cpl_funding_participation p
    where p.source = 'self'
    union all
    select 'nc', a.college, a.fiscal_year, lower(trim(a.attestor_email)), a.attestor_name,
           split_part(lower(trim(a.attestor_email)), '@', 2)
    from public.cpl_funding_nc_attestation a
    union all
    -- The Lead the attestation names: no email, so the name at the attestor's domain.
    select 'lead', a.college, a.fiscal_year, null, a.coordinator_name,
           split_part(lower(trim(a.attestor_email)), '@', 2)
    from public.cpl_funding_nc_attestation a
  ), r as (
    select q.*, public.cpl_funding_name_key(q.nm) as nk from req q
  )
  select r.kind, r.college, r.fiscal_year,
    coalesce((select jsonb_agg(distinct jsonb_build_object('role', u.role_name, 'college', u.college,
                'status', u.user_status))
              from public.map_college_users u
              where (r.em is not null and r.em <> '' and lower(trim(u.email)) = r.em)
                 or (r.nk is not null and r.dom <> '' and split_part(lower(trim(u.email)), '@', 2) = r.dom
                     and public.cpl_funding_name_key(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) = r.nk)),
             '[]'::jsonb),
    coalesce((select jsonb_agg(distinct jsonb_build_object('title', l.contact_title, 'college', l.college))
              from public.map_landing_contacts l
              where (r.em is not null and r.em <> '' and lower(trim(l.contact_email)) = r.em)
                 or (r.nk is not null and public.cpl_funding_name_key(l.contact_name) = r.nk)),
             '[]'::jsonb)
  from r;
end $$;
-- The gate is inside: the team phrase arrives as anon, a reviewer as authenticated.
revoke all on function public.cpl_funding_requester_context() from public;
grant execute on function public.cpl_funding_requester_context() to anon, authenticated, service_role;
