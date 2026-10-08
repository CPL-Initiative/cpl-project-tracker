-- supabase_program_requirement_records.sql — a program's requirements as its
-- college's catalog prints them, for Sierra to read.
--
-- Sam, open-asks sheet 29 card 4 (2026-10-04, "yes"): where a program's record
-- passed all four checks, Sierra may say a course is required, name each choose
-- block and give the program total, citing the catalog and its year; every other
-- program keeps "lists". Lane: docs/reference/lanes/program-requirements-harvest.md.
--
-- WHAT A ROW IS: one program at one college, keyed (college, control_number) as
-- coci_college_programs keys it. `record` is the harvest's record exactly as
-- filed under kb/program_requirements_pilot/records/ ({program, blocks}); the
-- columns beside it are what a reader needs without opening it.
--
-- CHECKED: all four checks passed (coverage, no invented course, unit
-- arithmetic, and a person's reading of the record against the catalog). Sheet
-- 23's call: nothing public until a record passes all four, so the public read
-- shows checked rows only.
--
-- WHO WRITES: kb/_program_requirements_load.py builds an upsert from the repo's
-- record files, and a session applies it (the first load as migration
-- program_requirement_records_load_2026_10_04). The repo's files are the source
-- of truth; a row rolls back by loading the files of an earlier commit. No person
-- edits a row here: a fix goes through the record shape, the prompt or the
-- scorer, then a reload. One exception, ruled by Sam (Open Asks Sheet 51 card 1,
-- 2026-10-08): a reviewer's Confirm or Needs a fix in the Program records view
-- sets `checked` through program_record_verdict_add, and a trigger keeps that
-- reading across reloads while the requirements it read are unchanged
-- (chatbox/supabase_program_record_verdicts.sql). Reviewers also read the
-- unchecked rows (policy program_requirement_records_reviewer_read).
--
-- PRIVILEGES: row-level security with one SELECT policy (checked rows), so the
-- public roles write nothing. The default-privilege close rides the next paste
-- receipt (the Supabase connector holds any statement naming a privilege removal
-- for a confirmation a remote session cannot answer).

create table if not exists public.program_requirement_records (
  college          text not null,
  control_number   text not null,
  program_title    text not null,
  award            text,
  catalog_year     text,                 -- '2026-2027': the catalog the record was read from
  source_url       text,                 -- the page or export the capture read
  measure          text not null check (measure in ('units', 'hours')),
  total_min        numeric,
  total_max        numeric,
  record           jsonb not null,       -- {program, blocks}, as filed
  checks           jsonb not null,       -- {coverage, invented, arithmetic, reviewer}
  checked          boolean not null default false,
  checked_by       text,
  checked_at       timestamptz,
  extracted_run    bigint,
  loaded_at        timestamptz not null default now(),
  primary key (college, control_number)
);

alter table public.program_requirement_records enable row level security;

create policy program_requirement_records_read on public.program_requirement_records
  for select to anon, authenticated using (checked);

grant select on public.program_requirement_records to anon, authenticated;
grant select, insert, update on public.program_requirement_records to service_role;

-- DISPLAY (S327, 2026-10-04): the facts CPL Pathways shows and Sierra reads for a
-- program, written by kb/_build_roep_display.py: CPL in three kinds per course
-- (articulated here, could adopt, for consideration), the up-to figure, the gaps
-- (catalog and state file differ; the reading procedure's checks) and the map's
-- status. The page reads the same build from cpl_pathways_roep_data.js; both carry
-- one build stamp, and tests/roep_display_test.py holds them equal. Written by the
-- builder's receipt (kb/receipts/program_requirement_records_display_<date>.sql),
-- applied by a session like the load above; an added column, so the table's grants
-- and its one SELECT policy already cover it. Rollback: set display to null.
alter table public.program_requirement_records add column if not exists display jsonb;
