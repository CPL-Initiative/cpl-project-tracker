-- map_colleges.variants: the funding roster's three spellings (S311, 2026-10-01)
--
-- WHY. cpl_funding_my_reports() (funding/supabase_cpl_funding_reports.sql)
-- resolves a report's college through map_colleges: the canonical name, or an
-- exact variant, trimmed. Reports carry the funding roster's short names. Read
-- 2026-10-01 with that same join over the roster's 115 names: 112 resolve, and
-- "LA Swest", "Mt San Antonio" and "MiraCosta" resolve to nothing, so those
-- colleges' staff see no reports on My College. The nearest variants differ in
-- case or a space ("LA SWEST", "MT SAN ANTONIO", "MIRA COSTA"), and the join
-- compares exactly, by design: it decides who sees a college's reports, so an
-- unknown spelling fails closed. Each spelling joins as a variant of its one
-- college; none matches any row today, so none can land on a second one.
--
-- BEFORE (read 2026-10-01 through execute_sql, select college_id, college_name,
-- variants from map_colleges where college_id in (73, 81, 86)):
--   73  Los Angeles Southwest College  {"LA Southwest","LA SWEST","Southwest","Southwest College"}
--   81  MiraCosta College              {"MIRA COSTA","Mira Costa","Miracosta College"}
--   86  Mt. San Antonio College        {"MT SAN ANTONIO","Mt San Antonio College","Mt. San Antonio"}
--
-- THE WRITE. Guarded and idempotent: each row is named by id AND canonical name,
-- and a spelling already present is not added twice. Applied as the migration
-- map_colleges_funding_roster_variants.

update public.map_colleges set variants = variants || array['LA Swest']
 where college_id = 73 and college_name = 'Los Angeles Southwest College' and not ('LA Swest' = any(variants));
update public.map_colleges set variants = variants || array['MiraCosta']
 where college_id = 81 and college_name = 'MiraCosta College' and not ('MiraCosta' = any(variants));
update public.map_colleges set variants = variants || array['Mt San Antonio']
 where college_id = 86 and college_name = 'Mt. San Antonio College' and not ('Mt San Antonio' = any(variants));

-- ROLLBACK (restores the before-values above exactly):
--   update public.map_colleges set variants = array_remove(variants, 'LA Swest') where college_id = 73;
--   update public.map_colleges set variants = array_remove(variants, 'MiraCosta') where college_id = 81;
--   update public.map_colleges set variants = array_remove(variants, 'Mt San Antonio') where college_id = 86;
--
-- AFTER: the roster-resolution read must return 115 of 115.
