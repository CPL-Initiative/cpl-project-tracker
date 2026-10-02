-- Schema of record: public.coci_program_courses.
-- (coci_college_programs.control_number, the key that joins a program to this
-- table, lives in chatbox/supabase_search_college_programs.sql with its loader.)
--
-- Applied live via the Supabase MCP on 2026-10-02 (S318) as three migrations:
--   coci_program_courses_table · coci_program_courses_read_policy ·
--   coci_college_programs_control_number
--
-- ⚠️ ONE BLOCK IS NOT YET APPLIED: the REVOKE below. The MCP asks a person to
-- confirm any statement carrying drop, revoke or delete, and S318 had no one
-- to answer, so each such call timed out after 60 s and applied nothing (read
-- back each time). Until it runs, the table keeps Supabase's default grants;
-- RLS with only a read policy refuses every API write by anon and
-- authenticated, the posture of chatbox_college_courses beside it.
--
--
-- WHY THIS EXISTS
-- ------------------------------------------------------------------
-- Sam, 2026-10-02: "Goal is to be able to list the courses in particular
-- programs at a given college." Sierra could find a program and could read
-- every course, but listed a program's courses by TOP code: every course at the
-- college sharing the program's TOP. Measured over 19,883 active programs
-- against the CO's Program Course File, that proxy finds a median 33% of a
-- program's real courses, and a median 44% of what it returns is in the program.
-- Builder and the full measurement: chatbox/build_program_courses.py.
--
--
-- WHAT A ROW SAYS
-- ------------------------------------------------------------------
-- The program (college, program_control_number) LISTS the course. Never
-- "requires": COCI carries no required/elective flag, and a list holds honors
-- twins and alternatives side by side, so its units never sum to the program's.
-- course_college is set only when the course belongs to another college (the
-- Riverside district's three colleges share course records).
--
--
-- HOW IT LOADS: UPSERT, THEN PRUNE (never truncate first)
-- ------------------------------------------------------------------
-- chatbox/sync_program_courses.py upserts ~314k rows in chunks under one
-- load_id, counts that load's rows, and only on an exact count deletes the rows
-- an earlier load left behind, all through PostgREST on the service key (no
-- definer function). Truncating first, the pattern coci_programs_replace uses,
-- leaves the table part-loaded while it runs; a reader then sees a program with
-- half its list, and a half list reads as a complete one. Upsert-then-prune
-- never shows fewer rows than the last good load.

create table if not exists public.coci_program_courses (
  college                text not null,
  program_control_number text not null,
  course_control_number  text not null,
  course_code            text,
  course_title           text,
  units                  numeric,
  cid                    text,
  course_college         text,
  load_id                text not null,
  primary key (college, program_control_number, course_control_number)
);

-- The primary key serves the forward read (a college's program -> its courses).
-- This one serves the reverse: which programs list this course.
create index if not exists coci_program_courses_course_idx
  on public.coci_program_courses (course_control_number);

alter table public.coci_program_courses enable row level security;
drop policy if exists coci_program_courses_read on public.coci_program_courses;
create policy coci_program_courses_read on public.coci_program_courses
  for select to anon, authenticated using (true);

-- Public catalog data, read-only to the API roles; only the service key loads it.
-- The revoke clears the default grants (TRUNCATE among them, which RLS does not
-- govern) so the API roles hold exactly SELECT.
revoke all on public.coci_program_courses from public, anon, authenticated;
grant select on public.coci_program_courses to anon, authenticated;
grant select, insert, update, delete on public.coci_program_courses to service_role;
