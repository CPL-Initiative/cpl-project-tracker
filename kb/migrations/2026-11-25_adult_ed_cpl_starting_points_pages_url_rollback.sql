-- Rollback for 2026-11-25_adult_ed_cpl_starting_points_pages_url.sql: restore the before-values, if untouched since.
update public.cpl_library
   set url = 'https://claude.ai/artifact/8WrsvrvViQtxJWPfeVzdfP',
       versions = '[{"url":"https://claude.ai/artifact/8WrsvrvViQtxJWPfeVzdfP","date":"2026-11-25","label":"1","status":"Current"}]'::jsonb,
       updated_by = 'Sam'
 where slug = 'adult-ed-cpl-starting-points'
   and url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/adult-ed-cpl-starting-points/'
   and updated_by = 'library-adulted-2026-11-25@bot';
