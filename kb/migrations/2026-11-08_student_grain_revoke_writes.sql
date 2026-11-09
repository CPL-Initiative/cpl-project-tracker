-- Student-grain tables: anon and authenticated lose every privilege but the reviewer-gated SELECT (S604, COBIx
-- #2919, PR 1 of the summarize-then-delete plan). Read live 2026-11-08 ~15:50Z (information_schema.role_table_grants):
-- anon and authenticated each held DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE and UPDATE on all three.
-- RLS gates SELECT/INSERT/UPDATE/DELETE (only a SELECT policy exists, is_allowed_reviewer()), and RLS does not
-- govern TRUNCATE, so these grants let any caller with a SQL path as anon empty the table. Same fix as
-- security step 3 on tmc_submissions (#2901).
--
-- Kept on purpose: SELECT, so the reviewer policy map_student_credit_select keeps working for any reviewer
-- read this inventory missed; postgres and service_role are untouched (both hold every privilege explicitly,
-- read the same day), so the loader, the promote and the rebuild_map_* functions (SECURITY DEFINER) are unaffected.
-- stg_student_credit has no policy, so its SELECT returns nothing; it and map_student_credit_prev have no reader
-- in the repo and are PR 2's (drop) to retire, on Sam's go.
--
-- Apply only on Sam's word (Sheet 167 card 4: each security item applied only on his word):
--   file=kb/migrations/2026-11-08_student_grain_revoke_writes.sql
--   name=student_grain_revoke_writes
-- Rollback: kb/migrations/2026-11-08_student_grain_revoke_writes_rollback.sql
revoke insert, update, delete, truncate, references, trigger
  on public.map_student_credit, public.map_student_credit_prev, public.stg_student_credit
  from anon, authenticated;

-- Read back (expect 0 rows):
--   select table_name, grantee, privilege_type from information_schema.role_table_grants
--   where table_schema = 'public'
--     and table_name in ('map_student_credit','map_student_credit_prev','stg_student_credit')
--     and grantee in ('anon','authenticated') and privilege_type <> 'SELECT';
