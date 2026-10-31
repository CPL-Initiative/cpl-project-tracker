-- map/supabase_map_landing_contacts_roster.sql
--
-- The landing pages' contacts beside the MAP users (Sam, 2026-10-31,
-- SkyCloudberry): "add the college landing page college contacts and title
-- they list on their landing page to the MAP users table so the MAP team have
-- one stop shopping for all that? It will help in the funding procedure as
-- well. It will also help the MAP team know what user roles they need to add
-- to the MAP platform user table and keep it all aligned."
--
-- public.map_landing_contacts_roster() returns every contact each college's
-- MAP landing page lists (the mirror public.map_landing_contacts, rebuilt daily
-- by map/sync_landing_contacts.py; its SQL of record is
-- funding/supabase_cpl_funding_requester_context.sql), with the title the page
-- gives them and the MAP user rows that are the same person: the email (any
-- case), else the name (cpl_funding_name_key: first and last word) at the same
-- college or the same email domain. The MAP Users tab reads it for its Landing
-- page column and each roster's "On the landing page" table; an empty map_users
-- is a role the MAP team may add.
--
-- Gate: a signed-in reviewer or the team phrase, as map_college_users' own
-- select policy; anyone else gets no rows. The mirror stays closed to every
-- API role.
--
-- Rollback: drop function public.map_landing_contacts_roster();

create or replace function public.map_landing_contacts_roster()
returns table(college text, contact_title text, contact_name text, contact_email text,
              contact_order integer, synced_at timestamptz, map_users jsonb)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if not (public.is_allowed_reviewer() or public.team_pass_ok()) then
    return;
  end if;
  return query
  with u as (
    select m.role_name, m.user_status, m.college,
           lower(trim(coalesce(m.email, ''))) as em,
           split_part(lower(trim(coalesce(m.email, ''))), '@', 2) as dom,
           public.cpl_funding_name_key(coalesce(m.first_name, '') || ' ' || coalesce(m.last_name, '')) as nk
    from public.map_college_users m
  ), l as (
    select c.*, lower(trim(coalesce(c.contact_email, ''))) as em,
           split_part(lower(trim(coalesce(c.contact_email, ''))), '@', 2) as dom,
           public.cpl_funding_name_key(c.contact_name) as nk
    from public.map_landing_contacts c
  )
  select l.college, l.contact_title, l.contact_name, l.contact_email, l.contact_order, l.synced_at,
    coalesce((select jsonb_agg(distinct jsonb_build_object('role', u.role_name, 'status', u.user_status, 'college', u.college))
              from u
              where (l.em <> '' and u.em = l.em)
                 or (l.nk is not null and u.nk = l.nk
                     and (u.college = l.college or (l.dom <> '' and u.dom = l.dom)))),
             '[]'::jsonb)
  from l
  order by l.college, l.contact_order nulls last, l.contact_name;
end $$;
-- The gate is inside: the team phrase arrives as anon, a reviewer as authenticated.
revoke all on function public.map_landing_contacts_roster() from public;
grant execute on function public.map_landing_contacts_roster() to anon, authenticated, service_role;
