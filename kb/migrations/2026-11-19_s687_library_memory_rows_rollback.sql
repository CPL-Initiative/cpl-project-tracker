-- Rollback of kb/migrations/2026-11-19_s687_library_memory_rows.sql.
delete from public.cpl_memory where author='SkyPipit (S687)' and slug in ('d-library-check-per-version-key-s687','d-library-new-page-unlists-s687','d-library-internal-one-press-s687','d-library-3560-in-four-prs-s687');
