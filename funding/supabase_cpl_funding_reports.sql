-- ─────────────────────────────────────────────────────────────────────────
-- cpl_funding_reports — the Reporting box's expenditure reports (2026-09-30,
-- S307, migration cpl_funding_reports).
--
-- Sam's calls (open-asks sheet 6, cards 2–4, 2026-09-30): a college reports
-- ONCE A YEAR, in ALL EIGHT NOVA expenditure categories (object codes 1000
-- through 7000 and indirect costs), and each college sees its own figures on
-- My College, to its signed-in staff. This file builds the REVIEWER half: a
-- signed-in reviewer records what a college reports, in the institution's
-- drill-in under the CO Monitor's note. How a college's staff sign in to see
-- theirs is an open design on the decision sheet; nothing here opens the table
-- to them.
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
