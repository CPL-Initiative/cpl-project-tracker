-- ─────────────────────────────────────────────────────────────────────────
-- cpl_funding_reports — the Reporting box's expenditure reports (2026-09-30,
-- S307, migration cpl_funding_reports).
--
-- Sam's calls (open-asks sheet 6, cards 2–4, 2026-09-30): a college reports
-- ONCE A YEAR, in ALL EIGHT NOVA expenditure categories (object codes 1000
-- through 7000 and indirect costs), and each college sees its own figures on
-- My College, to its signed-in staff. The REVIEWER half (S307): a signed-in
-- reviewer records what a college reports, in the institution's drill-in under
-- the CO Monitor's note. The COLLEGE half (S308, at the end of this file):
-- cpl_funding_my_reports() shows a college's reports, read only, to the people
-- MAP lists as its CPL coordinator or primary CPL contact. The table itself
-- stays reviewer-gated; the function is the only way a college reads it.
--
-- INSERT-ONLY. There is no UPDATE or DELETE policy, and the table-level
-- UPDATE/DELETE/TRUNCATE grants are revoked from the API roles. A correction
-- is a new report for the same college and fiscal year: the NEWEST one counts
-- and the history keeps both. A report entered in error is withdrawn the same
-- way, by a newer row with `withdrawn = true`, after which that year counts as
-- unreported. So every write a reviewer makes is reversible from the tab, and
-- nothing a reviewer does removes a row (CLAUDE.md Rule 10 a2).
--
-- `recorded_by` and `recorded_at` are set by the trigger from the caller's
-- session, never from the request body, so the history names the reviewer who
-- actually wrote the row.
--
-- Governance: DR-09, beside cpl_funding_notes (kb/governance_surface_map.json).
-- Privacy: each row is an institution's expended funding and carries no student
-- record, so the student-detail disclosure boundary does not reach it.
-- `reported_by` names a college employee in a professional capacity, which is
-- why SELECT is reviewer-gated like the notes.
--
-- Applied live via the Supabase MCP; this file is the schema of record.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.cpl_funding_reports (
  id          uuid primary key default gen_random_uuid(),
  college     text not null check (char_length(btrim(college)) between 1 and 120),
  fiscal_year text not null check (fiscal_year ~ '^[0-9]{4}-[0-9]{2}$'),
  withdrawn   boolean not null default false,
  reported_by text check (reported_by is null or char_length(reported_by) <= 160),
  reported_on date,
  c1000       numeric(12,2) not null default 0 check (c1000 between 0 and 10000000),
  c2000       numeric(12,2) not null default 0 check (c2000 between 0 and 10000000),
  c3000       numeric(12,2) not null default 0 check (c3000 between 0 and 10000000),
  c4000       numeric(12,2) not null default 0 check (c4000 between 0 and 10000000),
  c5000       numeric(12,2) not null default 0 check (c5000 between 0 and 10000000),
  c6000       numeric(12,2) not null default 0 check (c6000 between 0 and 10000000),
  c7000       numeric(12,2) not null default 0 check (c7000 between 0 and 10000000),
  c_indirect  numeric(12,2) not null default 0 check (c_indirect between 0 and 10000000),
  total       numeric(14,2) generated always as
                (c1000 + c2000 + c3000 + c4000 + c5000 + c6000 + c7000 + c_indirect) stored,
  note        text check (note is null or char_length(note) <= 2000),
  recorded_by text,
  recorded_at timestamptz not null default now(),
  -- A withdrawal carries no figures; a report names who at the college made it.
  constraint cfr_withdrawal_is_empty check (
    not withdrawn or (c1000 + c2000 + c3000 + c4000 + c5000 + c6000 + c7000 + c_indirect) = 0),
  constraint cfr_report_names_reporter check (
    withdrawn or (reported_by is not null and btrim(reported_by) <> ''))
);

create index if not exists cfr_college_year on public.cpl_funding_reports (college, fiscal_year, recorded_at desc);

create or replace function public.cfr_stamp() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.recorded_by := coalesce(nullif(auth.jwt() ->> 'email', ''), new.recorded_by);
  new.recorded_at := now();
  return new;
end $$;
drop trigger if exists cfr_stamp on public.cpl_funding_reports;
create trigger cfr_stamp before insert on public.cpl_funding_reports
  for each row execute function public.cfr_stamp();

alter table public.cpl_funding_reports enable row level security;

-- INSERT-only for the API roles: RLS carries the gate, and the grants make the
-- missing UPDATE/DELETE policies impossible to widen by accident.
revoke update, delete, truncate on public.cpl_funding_reports from anon, authenticated;
-- The table's own Data API grants (tests/supabase_table_grants_test.py): from
-- 2026-10-30 Supabase stops granting them on new tables, so the file states
-- them. Each matches a policy below; service_role reads for the publishers.
grant select, insert on public.cpl_funding_reports to anon, authenticated;
grant select on public.cpl_funding_reports to service_role;

drop policy if exists cfr_select on public.cpl_funding_reports;
create policy cfr_select on public.cpl_funding_reports for select
  to anon, authenticated
  using (is_allowed_reviewer());

drop policy if exists cfr_insert on public.cpl_funding_reports;
create policy cfr_insert on public.cpl_funding_reports for insert
  to anon, authenticated
  with check (is_allowed_reviewer());

-- ── The college half: cpl_funding_my_reports() (S308, 2026-09-30) ─────────
-- Sam, open-asks sheet 7 card 1 (2026-09-30 17:09Z): a person MAP lists as a
-- college's CPL coordinator or primary CPL contact signs in with the reviewer
-- email link and sees that college's reports on My College, read only, for
-- every college MAP lists the address under. The check reads
-- map_college_contacts, so MAP's next nightly sync carries any change in who
-- those people are; nothing here keeps a second list.
--
-- HOW A NAME BECOMES A COLLEGE. Reports carry the funding roster's short name
-- ("Chaffey"); map_college_contacts carries MAP's ("Chaffey College"). Both
-- resolve through map_colleges, the identity table, to one college_id: the
-- canonical name first, then a variant, trimmed on the way in (the identity
-- lane's rule: fix the JOIN, never the table, because the nightly rebuild puts
-- MAP's trailing spaces back). A name that resolves to nothing shows nothing,
-- so an unknown spelling fails closed. Measured 2026-09-30: 112 of the
-- roster's 115 names resolve; "LA Swest", "Mt San Antonio" and "MiraCosta" wait
-- on the identity crosswalk's variants, and those colleges' staff see no
-- reports until they land.
--
-- WHO COUNTS. Each contact field can hold a list ("a@x.edu,\nb@x.edu": 26 of
-- the 148 filled fields did on 2026-09-30), so each is split on commas,
-- semicolons and white space and every address in it counts. The caller's
-- address comes from the verified session (auth.jwt()), never from the request.
--
-- WHAT COMES BACK. For each college the caller is listed for, its report rows
-- oldest first, or one row with empty report fields when it has none yet, all
-- carrying the college_id My College matches on. So the page can tell "no
-- report yet" from "MAP does not list you here".
-- recorded_by (the reviewer's address) stays behind; reported_by is the
-- college's own person.
--
-- Grants (Rule 10 b2, and one step past it): Postgres grants EXECUTE to PUBLIC
-- at creation, AND this project's default privileges grant it to anon and
-- authenticated by name (pg_default_acl, read 2026-09-30). Revoking PUBLIC
-- alone left anon=X on this function (measured live, then closed by migration
-- cpl_funding_my_reports_revoke_anon), so the revoke names both. service_role
-- holds an explicit grant first, so the revoke cannot take it away.
-- Governance: DR-09 in kb/governance_surface_map.json.
create or replace function public.cpl_funding_my_reports()
returns table (
  college_id integer, college text, fiscal_year text, withdrawn boolean,
  reported_by text, reported_on date,
  c1000 numeric, c2000 numeric, c3000 numeric, c4000 numeric,
  c5000 numeric, c6000 numeric, c7000 numeric, c_indirect numeric,
  total numeric, note text, recorded_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select lower(btrim(coalesce(auth.jwt() ->> 'email', ''))) as email
  ),
  mine as (
    select distinct ids.college_id
    from public.map_college_contacts c
    cross join me
    cross join lateral (
      select m.college_id from public.map_colleges m
      where not coalesce(m.is_test, false)
        and (m.college_name = btrim(c.college) or btrim(c.college) = any(m.variants))
      order by (m.college_name = btrim(c.college)) desc, m.college_id
      limit 1
    ) ids
    where me.email <> ''
      and (me.email = any(regexp_split_to_array(lower(coalesce(c.cpl_coordinator_email, '')), '[,;[:space:]]+'))
        or me.email = any(regexp_split_to_array(lower(coalesce(c.primary_contact_email, '')), '[,;[:space:]]+')))
  )
  select mine.college_id, r.college, r.fiscal_year, r.withdrawn, r.reported_by, r.reported_on,
         r.c1000, r.c2000, r.c3000, r.c4000, r.c5000, r.c6000, r.c7000, r.c_indirect,
         r.total, r.note, r.recorded_at
  from mine
  left join lateral (
    select rr.* from public.cpl_funding_reports rr
    cross join lateral (
      select m.college_id from public.map_colleges m
      where not coalesce(m.is_test, false)
        and (m.college_name = btrim(rr.college) or btrim(rr.college) = any(m.variants))
      order by (m.college_name = btrim(rr.college)) desc, m.college_id
      limit 1
    ) ids
    where ids.college_id = mine.college_id
  ) r on true
  order by mine.college_id, r.fiscal_year nulls first, r.recorded_at;
$$;

grant execute on function public.cpl_funding_my_reports() to service_role;
revoke execute on function public.cpl_funding_my_reports() from public, anon;
grant execute on function public.cpl_funding_my_reports() to authenticated;
