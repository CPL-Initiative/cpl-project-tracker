-- cpl_memory rows for SkyAlbatross (S715), 2026-11-23. Applied with execute_sql.
-- ROLLBACK: delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where author = 'SkyAlbatross (S715)');
--           delete from public.cpl_memory where author = 'SkyAlbatross (S715)';
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('f-decision-releases-ordinary-titles-only-s715','fact','A subject decision releases only ordinary-title credit courses from the mint''s hold','S715: the pile mint''s route p places a held course under a saved common code only for a credit course with an ordinary title; a shell title stays held, and a statewide filing decides no M-ID. Shell titles are 1,337 of the 1,341 held courses, so decisions barely move the held count. #3717 corrected the Subjects line that said a decision releases every held course.',array['commons','subjects','pile-mint','held'],'proposed','PR #3717','SkyAlbatross (S715)',now(),'SkyAlbatross (S715)','2026-11-23'),
('d-subjects-figures-live-s715','decision','Every Subjects figure counts the rows with the live saves on top, by its list''s own test','S715, Sam''s to revise: the Subjects stamp, college counts, held codes, statewide levels and the Commons Subjects card count the rows plus live saves in commons_subjects.js (figures, levels, heldNow, liveFigures), by the test the opened list applies, so a save moves each at once. Held subtracts only saves the build has not carried. Guard tests/commons_subjects_live_figures.test.js (#3717, #3718).',array['commons','subjects','confidence','live-figures'],'proposed','PR #3717','SkyAlbatross (S715)',now(),'SkyAlbatross (S715)','2026-11-23')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyAlbatross (S715)', 'create', 'S715 (2026-11-23)', to_jsonb(m)
from public.cpl_memory m where m.author = 'SkyAlbatross (S715)'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
-- Applied 2026-11-23 14:42Z: d-subjects-figures-live-s715 (398 chars), f-decision-releases-ordinary-titles-only-s715 (365).
-- A first try failed cpl_memory_summary_check: a summary of about 600 characters is refused; keep it near 400.

-- Applied 2026-11-23 ~15:40Z, the same shape and rollback (by author):
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-clovis-index-hand-filed-former-codes-s715','decision','A catalog index a curator reads can be filed by hand; a former code takes its subject''s title','S715, Sam''s to revise: Clovis''s catalog contents (PDF page 3), pasted by Sam on 2026-11-23, filed as kb/hand_filed_catalogs/subjects/clovis_community.json naming him and the page. Rule former: a code the index names as former (ANTHRO, COTR) takes the subject''s heading and is not a printed catalog code. Clovis 55 to 65 titled. Title Case keeps a code in parentheses in capitals (COTR). PR #3720.',array['commons','subjects','clovis','title-case'],'proposed','PR #3720','SkyAlbatross (S715)',now(),'SkyAlbatross (S715)','2026-11-23')
on conflict (slug) do nothing;
-- (logged 'create' by SkyAlbatross (S715))

-- Applied 2026-11-23 ~15:58Z: d-subject-code-history-s715 (360 chars), and the row above superseded by it:
--   update public.cpl_memory set status='superseded' where slug='d-clovis-index-hand-filed-former-codes-s715';
--   (its status before: proposed; logged 'supersede' by SkyAlbatross (S715)). Rollback by author restores both.
-- The summary check refused a text of about 430 characters; the limit sits near 400.
