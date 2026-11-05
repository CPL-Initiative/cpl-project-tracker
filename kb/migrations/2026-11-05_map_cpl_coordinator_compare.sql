-- map/supabase_map_cpl_coordinator_compare.sql
--
-- The CPL Coordinator, three places side by side (Sam and Jessica, 2026-11-05).
-- Jessica: "create a new table with the College, CPL Coordinator (from the table
-- you already gave me), CPL Landing Page CPL Assistant email, and the CPL
-- Coordinator information from the landing page. We want to know if there are
-- gaps and crossover from these fields. For example, Madera college has Lainey
-- Campos listed as their CPL coordinator on the landing page but is not tagged
-- as the CPL Coordinator in the platform." Sam: "please add this to the MAP
-- Users tab so Jessie can look it up there as well."
--
-- public.map_cpl_coordinator_compare() returns one row per college:
--   platform  the people in MAP College Contacts' CPL Coordinator and CPL
--             Coordinator Email fields (map_college_contacts, synced daily by
--             map/sync_map_users.py), split one person per name and email;
--   assistant the CPL Assistant Email field of the same record;
--   landing   the contacts the college's MAP landing page lists under a title
--             naming a CPL coordinator (map_landing_contacts, mirrored daily by
--             map/sync_landing_contacts.py);
-- each person carries the roles of the ACTIVE MAP users with the same email, and
-- `finding` says how the two lists compare:
--   match | same_person (a name agrees, the emails differ) | different |
--   landing_only | platform_only | neither.
-- `assistant_is_coordinator` marks the crossover: the CPL Assistant email is one
-- of the coordinators' own.
--
-- MAP has no CPL Coordinator user role; the Users module's College CPL Role(s)
-- field is not in the Custom Report the sync reads (Jessica, 2026-11-05), so it
-- is not compared here.
--
-- Gate: a signed-in reviewer or the team phrase, as map_college_users' own
-- select policy; anyone else gets no rows. Test and partner entries and the CSU
-- campus are left out.
--
-- Rollback: drop function public.map_cpl_coordinator_compare();

create or replace function public.map_cpl_coordinator_compare()
returns table(college text, platform jsonb, cpl_assistant_email text, landing jsonb,
              finding text, assistant_is_coordinator boolean, synced_at timestamptz)
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
  with u as materialized (
    select lower(trim(coalesce(m.email, ''))) as em,
           string_agg(distinct m.role_name, ', ' order by m.role_name) as roles
    from public.map_college_users m
    where m.user_status = 'Active' and coalesce(trim(m.email), '') <> ''
    group by 1
  ), c as materialized (
    select trim(cc.college) as college, cc.cpl_coordinator, cc.cpl_coordinator_email,
           nullif(trim(coalesce(cc.cpl_assistant_email, '')), '') as asst, cc.synced_at
    from public.map_college_contacts cc
    left join public.map_colleges k on lower(trim(k.college_name)) = lower(trim(cc.college))
    where coalesce(k.entity_kind, 'college') not in ('test', 'partner')
      and cc.college not ilike 'California State University%'
  ), pe as (   -- the emails, one per person, in the order typed
    select c.college, lower(trim(e.v)) as em, trim(e.v) as email, e.i
    from c, regexp_split_to_table(coalesce(c.cpl_coordinator_email, ''), '\s*[,;\n]\s*') with ordinality e(v, i)
    where trim(e.v) <> ''
  ), pn as (   -- the names, paired with the emails by position
    select c.college, trim(regexp_replace(n.v, '\s+', ' ', 'g')) as name, n.i
    from c, regexp_split_to_table(coalesce(c.cpl_coordinator, ''), '\s*[,;\n]\s*') with ordinality n(v, i)
  ), p as (    -- one row per email; a repeated email is one person
    select distinct on (pe.college, pe.em) pe.college, pe.em, pe.email, pe.i,
           nullif(pn.name, '') as name
    from pe left join pn on pn.college = pe.college and pn.i = pe.i
    order by pe.college, pe.em, pe.i
  ), l as (
    select trim(lc.college) as college, lc.contact_title, lc.contact_name, lc.contact_email,
           lower(trim(coalesce(lc.contact_email, ''))) as em, lc.contact_order, lc.synced_at
    from public.map_landing_contacts lc
    where lc.contact_title ~* 'coordinator' and lc.contact_title ~* '(cpl|prior learning)'
  ), lastw as (  -- a person's last name, for the name check
    select x.college, x.side, lower(regexp_replace(x.name, '^.*\s', '')) as last_name
    from (select p.college, 'p' as side, regexp_replace(coalesce(p.name, ''), '\s*\(.*\)\s*$', '') as name from p
          union all
          select l.college, 'l', regexp_replace(coalesce(l.contact_name, ''), '\s*\(.*\)\s*$', '') from l) x
    where x.name ~ '\s'
  ), r as (
    select c.college, c.asst, c.synced_at,
      coalesce((select jsonb_agg(jsonb_build_object('name', p.name, 'email', p.email, 'roles', u.roles) order by p.i)
                from p left join u on u.em = p.em where p.college = c.college), '[]'::jsonb) as platform,
      coalesce((select jsonb_agg(jsonb_build_object('title', l.contact_title, 'name', l.contact_name,
                                                    'email', l.contact_email, 'roles', u.roles)
                                 order by l.contact_order nulls last, l.contact_name)
                from l left join u on u.em = l.em and l.em <> '' where l.college = c.college), '[]'::jsonb) as landing,
      exists (select 1 from p where p.college = c.college) as has_p,
      exists (select 1 from l where l.college = c.college) as has_l,
      exists (select 1 from p join l on l.college = p.college and l.em = p.em and l.em <> ''
              where p.college = c.college) as em_match,
      exists (select 1 from lastw a join lastw b on b.college = a.college and b.side = 'l' and b.last_name = a.last_name
              where a.college = c.college and a.side = 'p') as name_match,
      (c.asst is not null and (exists (select 1 from p where p.college = c.college and p.em = lower(c.asst))
                               or exists (select 1 from l where l.college = c.college and l.em = lower(c.asst)))) as asst_cross
    from c
  )
  select r.college, r.platform, r.asst, r.landing,
    case when not r.has_p and not r.has_l then 'neither'
         when not r.has_p then 'landing_only'
         when not r.has_l then 'platform_only'
         when r.em_match then 'match'
         when r.name_match then 'same_person'
         else 'different' end,
    r.asst_cross, r.synced_at
  from r
  order by r.college;
end $$;
-- The gate is inside: the team phrase arrives as anon, a reviewer as authenticated.
revoke all on function public.map_cpl_coordinator_compare() from public;
grant execute on function public.map_cpl_coordinator_compare() to anon, authenticated, service_role;
