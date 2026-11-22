-- Rollback for kb/migrations/2026-11-21_s700_cpl_memory_rows.sql: deletes the 13 rows that file inserted, by slug
-- and author, so a row a person has since taken over is left alone.
delete from public.cpl_memory where author = 'SkyGuillemot (S700)' and slug in (
 'd-subject-recommendation-levels-measured-s700','f-subject-recommendations-measured-s700','f-sams-30-cerritos-scored-s700',
 'f-missed-subject-pages-filed-s700','d-local-title-drops-code-parenthetical-s700','p-read-plan-under-5000-lines-s700',
 'r-dept-labels-help-edge-recommendations-sam-2026-11-21','f-subject-web-searches-filed-s700',
 'r-athletics-under-kine-sam-2026-11-22','r-subject-save-path-kb-curation-sam-2026-11-22',
 'r-noncredit-is-a-view-inside-subjects-sam-2026-11-22','f-noncredit-catalogs-filed-s700','f-subject-course-panel-s700');
