-- Rollback of kb/migrations/2026-11-02_csm_log.sql (S555). Drops the CSM Workspace's communications log.
-- The rows go with it: export them first (select * from public.csm_log, under the service role) if any were kept.
drop trigger if exists csm_log_stamp on public.csm_log;
drop function if exists public.csm_log_stamp();
drop table if exists public.csm_log;
