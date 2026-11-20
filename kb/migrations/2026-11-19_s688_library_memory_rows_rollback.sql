-- Rollback of kb/migrations/2026-11-19_s688_library_memory_rows.sql.
delete from public.cpl_memory where author='SkyLinnet (S688)' and slug in ('d-library-check-binds-url-s688');
