-- Receipt (Rule 10 a2): the Library record for Sam's noncredit visual moved to Draft 1 (SkyLoop, 2026-11-06 15:47Z).
-- Record: cpl_library 5e29e1d3-b1fc-4340-a3d7-9378e2e4d8b9, slug noncredit-to-credit-how-noncredit-learning-can-result-in-cre-mw53clp5,
-- "Noncredit to Credit: How Noncredit Learning Can Result in Credit" (Sam's brief, Requested 2026-11-06 14:50:03Z).
-- Writes, through the Supabase MCP as one statement:
--   1. INSERT public.cpl_library_drafts: id 5b5f9e8a-1cf6-472d-a6f6-f33871b00b68, made_by library-skyloop@bot, made_at 2026-11-06 15:47:19Z,
--      html = the page (source CPLBrain/04-projects/cpl-initiative/noncredit-to-credit/20261106_Noncredit_to_Credit_1.html, header with linked logos),
--      request.mock = https://claude.ai/artifact/Wi6htw18rtQ9WCM6ajtmnM. Draft rows are kept by design (the table's guard); no rollback needed.
--   2. Guarded UPDATE public.cpl_library (where status = 'requested' and regen is null and updated_at = '2026-11-06T14:50:03.14489+00'):
--      before: status 'requested', made_by null, made_on null, rebuild_from null, regen null, updated_by null, updated_at '2026-11-06 14:50:03.14489+00'
--      after:  status 'draft', made_by 'SkyLoop (Claude), draft 1 from Sam''s brief', made_on 2026-11-06,
--              rebuild_from 'CPLBrain/04-projects/cpl-initiative/noncredit-to-credit/20261106_Noncredit_to_Credit_1.html (then scripts/library_page.py)',
--              regen {requested_at, requested_by Sam, ready_at 15:47:19Z, draft_id 5b5f9e8a-…, draft_url the mock, publish show, made_by library-skyloop@bot, note},
--              updated_by 'library-skyloop@bot', updated_at 2026-11-06 15:47:19.086932+00.
-- Sam's first reaction (15:49Z, in session): the student card names the college landing page as an alternative; applied to the source
-- and the mock; the next draft row (Draft 2) carries it once his reactions are in.
-- Rollback (restores the record as read; the draft row stays, as every draft does):
update public.cpl_library
   set status = 'requested', made_by = null, made_on = null, rebuild_from = null, regen = null, updated_by = null,
       updated_at = '2026-11-06T14:50:03.14489+00'
 where id = '5e29e1d3-b1fc-4340-a3d7-9378e2e4d8b9' and updated_by = 'library-skyloop@bot';

-- 2026-11-06 ~16:45Z (SkyLoop): Sam, in session, 16:10Z: "visual looks great! go with it", then his one correction (the
-- Chancellor's film is her address to the 7th Annual CPL Summit; the bridges line is from her Noncredit Summit presentation).
-- Published: library/noncredit-to-credit-how-noncredit-learning-can-result-in-cre-mw53clp5/index.html (scripts/library_page.py from
-- the vault source, with his four reactions). Guarded UPDATE public.cpl_library (where updated_at = '2026-11-06 15:47:19.086932+00'):
--   before: status 'draft', home 'not_filed', url null, version null, versions [], occasion null, summary null, seen_by 'team',
--           public_listed false, public_summary null, public_topics [], listed_by null, listed_at null,
--           regen {draft_id 5b5f9e8a-…, ready_at 15:47:19Z, …}, updated_by 'library-skyloop@bot'
--   after:  status 'approved', home 'web', url the Pages copy, version '1', versions [Version 1, Current], occasion and summary
--           set, seen_by 'public', public_listed true (cpl.library_public set for the statement, as cpl_library_set_public does),
--           public_summary and public_topics set, listed_by 'Sam (in session, 16:10Z; written by library-skyloop@bot)',
--           listed_at now(), regen null, updated_by 'library-skyloop@bot', updated_at now().
--   and cpl_library_drafts 5b5f9e8a-…: published_at now() (published_commit stamped by the PR's merge commit, if a session adds it).
-- Rollback of this step (to the Draft state as read):
update public.cpl_library
   set status = 'draft', home = 'not_filed', url = null, version = null, versions = '[]'::jsonb, occasion = null, summary = null,
       seen_by = 'team', public_summary = null, public_topics = '{}', listed_by = null, listed_at = null,
       regen = jsonb_build_object('requested_at','2026-11-06T14:50:03Z','requested_by','Sam','ready_at','2026-11-06T15:47:19.086932+00:00',
                                  'draft_id','5b5f9e8a-1cf6-472d-a6f6-f33871b00b68','draft_url','https://claude.ai/artifact/Wi6htw18rtQ9WCM6ajtmnM',
                                  'publish','show','made_by','library-skyloop@bot'),
       updated_by = 'library-skyloop@bot', updated_at = '2026-11-06T15:47:19.086932+00'
 where id = '5e29e1d3-b1fc-4340-a3d7-9378e2e4d8b9' and updated_by = 'library-skyloop@bot';
-- (public_listed back to false goes through cpl_library_set_public(slug, false) or the same set_config inside one transaction.)
