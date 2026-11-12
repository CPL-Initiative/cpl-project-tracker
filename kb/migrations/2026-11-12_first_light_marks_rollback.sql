-- Rollback of 2026-11-12_first_light_marks.sql. A mark already applied lives on in git (the merged Apply pull
-- request's tools/first_light_selection.json and library/photos/hero_photos.json). The rows are copied to two
-- backup tables first, so the marks not yet applied and the request history survive the drop; the backups grant
-- nothing to the API roles and are dropped by hand once read. Dropping a table drops its triggers and policies.
create table public.first_light_marks_backup as table public.first_light_marks;
create table public.first_light_apply_requests_backup as table public.first_light_apply_requests;
alter table public.first_light_marks_backup enable row level security;
alter table public.first_light_apply_requests_backup enable row level security;
revoke all on public.first_light_marks_backup from anon, authenticated;
revoke all on public.first_light_apply_requests_backup from anon, authenticated;
grant select on public.first_light_marks_backup to service_role;
grant select on public.first_light_apply_requests_backup to service_role;
drop table public.first_light_apply_requests;
drop table public.first_light_marks;
drop function if exists public.first_light_marks_stamp();
drop function if exists public.first_light_apply_requests_stamp();
