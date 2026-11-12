-- Rollback of 2026-11-12_first_light_marks.sql. A mark already applied lives on in git (the merged Apply pull
-- request's tools/first_light_selection.json and library/photos/hero_photos.json), so dropping the tables loses only
-- marks not yet applied and the request history. Read them first and keep the output with the rollback:
--   select item_set, item_key, mark, position, collection, marked_by, marked_at from public.first_light_marks order by id;
--   select id, status, requested_by, requested_at, pr_url from public.first_light_apply_requests order by id;
drop trigger if exists first_light_marks_stamp_trg on public.first_light_marks;
drop trigger if exists first_light_apply_requests_stamp_trg on public.first_light_apply_requests;
drop function if exists public.first_light_marks_stamp();
drop function if exists public.first_light_apply_requests_stamp();
drop table if exists public.first_light_apply_requests;
drop table if exists public.first_light_marks;
