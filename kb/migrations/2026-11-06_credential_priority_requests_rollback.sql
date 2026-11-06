-- Rollback of 2026-11-06_credential_priority_requests.sql: drops the two functions and the table.
-- Export the rows first if any (select * from public.credential_priority_requests): each is a member of the public's ask.
drop function if exists public.credential_priority_counts();
drop function if exists public.credential_priority_request(text, text, text, text, text, text);
drop table if exists public.credential_priority_requests;
