-- Library: the Title 5 tracked-changes record now links its Drive copies (Sam's calls 4-5, 2026-10-05).
-- The five .docx were uploaded to CPLLibrary through the Drive connector; each landed at its exact byte size.
-- Guarded on the row's before-state; the history trigger also files the prior row in cpl_library_history.
-- Rollback (before-values):
--   update public.cpl_library set home = 'public_repo',
--     url = 'https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/exports/20260826_T5_55050_Article9_Conformity_TrackedChanges_v5.docx',
--     versions = (select before->'versions' from public.cpl_library_history where library_id = 'ceab03d8-3b8f-463a-9287-a5034e379361' order by changed_at asc limit 1),
--     updated_by = 'library-drive-skyshelf@bot'
--   where id = 'ceab03d8-3b8f-463a-9287-a5034e379361';
update public.cpl_library set
  home = 'drive',
  url = 'https://drive.google.com/file/d/1k6FmC7Cqlw73qU_rfQgKoPPEcxiJkfQW/view',
  versions = '[{"label":"v5","date":"2026-08-26","size":"6 KB","status":"Latest","url":"https://drive.google.com/file/d/1k6FmC7Cqlw73qU_rfQgKoPPEcxiJkfQW/view"},{"label":"v4","date":"2026-08-26","size":"6 KB","status":"Replaced by v5","url":"https://drive.google.com/file/d/1BsV5aHNAHR7KV_UPzX0Fc9KqRYYaejfO/view"},{"label":"v3","date":"2026-08-26","size":"6 KB","status":"Replaced by v4","url":"https://drive.google.com/file/d/1da0SQhVn3LEhX3A9saUgB861vjqD5ivx/view"},{"label":"v2","date":"2026-08-26","size":"6 KB","status":"Replaced by v3","url":"https://drive.google.com/file/d/1GGPRRfzF5zUfxdLDb9rzlQELFNBeMr0W/view"},{"label":"v1","date":"2026-08-26","size":"5 KB","status":"Replaced by v2","url":"https://drive.google.com/file/d/1mdCxUt2xxca7QBnwankaXxYxY3kLMQIB/view"}]'::jsonb,
  updated_by = 'library-drive-skyshelf@bot'
where id = 'ceab03d8-3b8f-463a-9287-a5034e379361'
  and home = 'public_repo' and md5(versions::text) = '396577bec13bb9764792d2a1e96bfe67' and updated_by is null;
