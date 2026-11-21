-- Rollback for kb/migrations/2026-11-21_s700_cpl_memory_rows.sql: deletes the six rows that file inserted, by slug
-- and author, so a row a person has since taken over is left alone.
delete from public.cpl_memory where author = 'SkyGuillemot (S700)' and slug in (
 'd-subject-recommendation-levels-measured-s700','f-subject-recommendations-measured-s700','f-sams-30-cerritos-scored-s700',
 'f-missed-subject-pages-filed-s700','d-local-title-drops-code-parenthetical-s700','p-read-plan-under-5000-lines-s700');
