-- ROLLBACK of kb/migrations/2026-11-08_student_grain_revoke_writes.sql (S604): restores the grants read live on
-- 2026-11-08 before it. SELECT was never revoked, so it is not re-granted here.
grant insert, update, delete, truncate, references, trigger
  on public.map_student_credit, public.map_student_credit_prev, public.stg_student_credit
  to anon, authenticated;
