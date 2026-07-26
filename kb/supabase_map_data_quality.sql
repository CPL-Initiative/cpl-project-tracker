-- ============================================================================
-- map_data_quality — the MAP Data Quality register (COBI)
-- ----------------------------------------------------------------------------
-- A team-curated backlog of data-quality defects observed in the MAP platform's
-- data (esp. the Custom Report Generator's View_StudentAggregatedValues), with
-- status + follow-up so we can track them to resolution WITH the MAP dev team and
-- hand them an evidence-backed list. Rendered by map_data_quality.js (the
-- "MAP Data Quality" tab), team-phrase gated.
--
-- Reuses the shared is_allowed_reviewer() / team_pass_ok() predicates. Applies the
-- p8 lesson from the start: team_pass_ok() is on SELECT + INSERT + UPDATE (a
-- reviewer-only UPDATE is what caused the cpl_memory curate lockout, 2026-07-26).
-- Hard-DELETE stays reviewer-only.
-- ============================================================================

create table if not exists public.map_data_quality (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  title          text not null check (char_length(title) between 1 and 200),
  category       text not null default 'other'          -- the defect family
                   check (category in ('blank-fields','test-records','eligibility-inflation',
                                       'schema-gap','duplication','origin-attribution','other')),
  severity       text not null default 'medium' check (severity in ('low','medium','high')),
  description    text check (char_length(description) <= 4000),   -- what's wrong + why it matters
  expected       text check (char_length(expected) <= 2000),      -- expected (correct) behavior
  example_records text check (char_length(example_records) <= 4000), -- example IDs / rows for repro
  affected_count int,                                              -- how many rows/students affected
  college        text,                                             -- scoping college (or null = systemwide)
  source_report  text,                                             -- e.g. 'View_StudentAggregatedValues'

  status         text not null default 'open'
                   check (status in ('open','reported','in_progress','fixed','verified','wontfix')),
  reported_to    text,                                             -- MAP dev / contact
  reported_at    date,
  followup_on    date,
  resolution     text check (char_length(resolution) <= 2000),

  reviewer_email text                                              -- who logged/curated it (cohort bot or curator)
);

comment on table public.map_data_quality is
  'COBI MAP Data Quality register: tracked data-quality defects in MAP platform data, with status + follow-up. Team-phrase gated; see map_data_quality.js.';

alter table public.map_data_quality enable row level security;

-- SELECT — team or reviewer.
drop policy if exists "team reads map_data_quality" on public.map_data_quality;
create policy "team reads map_data_quality"
  on public.map_data_quality for select
  to anon, authenticated
  using (is_allowed_reviewer() or team_pass_ok());

-- INSERT — team or reviewer may log an issue.
drop policy if exists "team writes map_data_quality" on public.map_data_quality;
create policy "team writes map_data_quality"
  on public.map_data_quality for insert
  to anon, authenticated
  with check (is_allowed_reviewer() or team_pass_ok());

-- UPDATE — team or reviewer may curate (status/follow-up/resolution). p8 lesson:
-- team_pass_ok() MUST be here or every team-phrase update hits the RLS zero-row
-- trap and locks the curator out.
drop policy if exists "team curates map_data_quality" on public.map_data_quality;
create policy "team curates map_data_quality"
  on public.map_data_quality for update
  to anon, authenticated
  using (is_allowed_reviewer() or team_pass_ok())
  with check (is_allowed_reviewer() or team_pass_ok());

-- DELETE — reviewers only (prefer status='wontfix' over hard delete).
drop policy if exists "reviewer deletes map_data_quality" on public.map_data_quality;
create policy "reviewer deletes map_data_quality"
  on public.map_data_quality for delete
  to anon, authenticated
  using (is_allowed_reviewer());

create index if not exists map_data_quality_status_idx   on public.map_data_quality (status);
create index if not exists map_data_quality_category_idx on public.map_data_quality (category);
create index if not exists map_data_quality_updated_idx  on public.map_data_quality (updated_at desc);
