-- Rollback of 2026-11-11_library_pictures.sql. A published picture's file stays in git (library/<slug>/img/), so
-- dropping the table loses only pictures not yet published. Count them first:
--   select library_id, count(*) from public.cpl_library_pictures group by 1;
drop trigger if exists cpl_library_pictures_guard on public.cpl_library_pictures;
drop function if exists public.cpl_library_pictures_guard();
drop table if exists public.cpl_library_pictures;
