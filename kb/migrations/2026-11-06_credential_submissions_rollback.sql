-- Rollback of 2026-11-06_credential_submissions.sql: drops the three functions and the table.
-- Export the rows first if any (select * from public.credential_submissions): each is a member of the public's word.
-- A single decision rolls back from the row instead: its history holds the prior status, merged_into and who decided.
drop function if exists public.credential_submissions_verified();
drop function if exists public.credential_submission_decide(uuid, text, text, text);
drop function if exists public.credential_submission_add(text, text, text, text, text, text, text);
drop table if exists public.credential_submissions;
