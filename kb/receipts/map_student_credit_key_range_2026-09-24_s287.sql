-- S287 (SkyLane), 2026-09-24 19:17 UTC — applied live through apply_migration as
-- `widen_map_student_credit_key_range_to_250k` (version 20260924191738).
--
-- WHY. The nightly MAP Custom Report load (run 36037739222, scheduled, 18:01 UTC) was refused at the
-- promotion: SQLSTATE 23514, "new row for relation map_student_credit violates check constraint
-- map_student_credit_key_range_ck". The constraint was CHECK (student_key >= 1 AND student_key <= 50000),
-- created with the table (migration create_map_student_credit_v2, 2026-08-10) and recorded in no repo
-- file. The loader assigns a dense surrogate 1..N by sorted hash, and the 2026-09-24 pull carried 50,027
-- distinct students against 49,965 live, so 27 students (338 rows) took keys above the cap. The whole
-- transaction rolled back; live stayed at the 2026-09-23 pull (634,331 rows). The five rebuilt tables
-- and their grants were untouched (all three API roles read all five; counts 173/113/506/279/232).
--
-- WHAT THE BOUND IS FOR. It is the static half of G5's privacy tripwire: a MAP identifier reaching the
-- database instead of a counting surrogate reads in the millions, and a per-row keying of today's
-- 635,527 rows would also cross it. 250,000 is Vision 2030's Goal 1 student target, five times today's
-- count, and still far below both failure signatures. G5 keeps the density check (max = count distinct).
--
-- BEFORE: CHECK ((student_key >= 1) AND (student_key <= 50000))
-- AFTER:  CHECK ((student_key >= 1) AND (student_key <= 250000))
--
-- ROLLBACK (restores the old bound; only possible while live holds no key above 50,000):
--   alter table public.map_student_credit drop constraint map_student_credit_key_range_ck;
--   alter table public.map_student_credit add constraint map_student_credit_key_range_ck
--     check (student_key >= 1 and student_key <= 50000);
alter table public.map_student_credit drop constraint map_student_credit_key_range_ck;
alter table public.map_student_credit add constraint map_student_credit_key_range_ck
  check (student_key >= 1 and student_key <= 250000);
