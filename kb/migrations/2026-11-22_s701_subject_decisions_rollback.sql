-- Rollback of kb/migrations/2026-11-22_s701_subject_decisions.sql (S701). Deletes only the cohort's subject_decision rows, so a row a person saved
-- under the same key (their own reviewer_email) stays. Per docs/reference/data_write_rollback.md, read live first
-- and hold out any row changed since the apply.
delete from public.kb_curation where reviewer_email = 'subjects-s701@bot' and course_id like 'SUBJ:%' and field = 'subject_decision';
