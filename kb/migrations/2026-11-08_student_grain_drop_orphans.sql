-- Drop the two student-grain copies nothing reads (S604; Sam, 2026-11-08: "yes the ruling is mine ... yes to the
-- rest"; COBIx #2919, PR 2 of the summarize-then-delete plan). The ruling: COBI pulls student-level MAP data only
-- to analyze and summarize it and never acts on an individual record, so it keeps none.
--
-- Read live 2026-11-08 ~16:00Z, before this file:
--   map_student_credit_prev  220,588 rows; columns student_key, college_id, exhibit_id, course_type, catalog_year
--   stg_student_credit       543,579 rows; the MAP loader's columns (source_row_id ... cpl_status_plan)
--   Neither holds a hand-entered column (no reviewer, note or decision field). No view, materialized view,
--   function, trigger or foreign key depends on either (pg_depend, pg_proc, pg_trigger, pg_constraint), and no
--   file in the repo reads or writes either (git grep). The live loader writes stg_map_student_credit, and the
--   promotion writes map_student_credit; both stay until PR 4.
--
-- Rollback: kb/migrations/2026-11-08_student_grain_drop_orphans_rollback.sql recreates both tables EMPTY with the
-- grants and policy they held. The rows are not restorable from this repo by design (the ruling keeps none);
-- MAP is the system of record, and a Supabase backup, if one exists, holds them until it expires.
--
--   file=kb/migrations/2026-11-08_student_grain_drop_orphans.sql
--   name=student_grain_drop_orphans
drop table if exists public.map_student_credit_prev;
drop table if exists public.stg_student_credit;

-- Read back (expect 0 rows):
--   select relname from pg_class where relname in ('map_student_credit_prev','stg_student_credit');
