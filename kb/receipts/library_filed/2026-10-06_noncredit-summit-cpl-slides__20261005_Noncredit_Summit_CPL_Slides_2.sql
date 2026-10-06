-- cpl_library filing receipt for a file Sam dropped into Drive by hand (the filer had no sign-in in this session), built with scripts/library_file.py receipt_sql at 2026-10-06T18:46:36Z.
-- File: 20261005_Noncredit_Summit_CPL_Slides_2.pptx (2039321 bytes, md5 c911778d3cba57fe443bba50879490d0); Drive size matched.
-- Drive: 20261005_Noncredit_Summit_CPL_Slides_2.pptx in CPLLibrary/Drafts, https://drive.google.com/file/d/1AlOWrPrB6W8rxzcJCWk8LEBmg3S3AzJj/view
-- Sam dropped it in CPLLibrary at 18:43Z and moved it to CPLLibrary/Drafts at about 18:52Z; the Drive API showed Drafts at 18:53Z. A move keeps the file id and link.
-- Apply with the Supabase MCP: apply_migration, name cpl_library_file_2026_10_06_noncredit_summit_cpl_slides_20261005_noncredit_summit_cpl_slides_2.
-- Applied by Sam in the Supabase SQL editor, 2026-10-06 19:13:55Z (row updated_at): apply_migration timed out four times
-- from the session without writing, and the repo's execute_sql guard refuses UPDATE. Verified after: version v2, home drive,
-- the Drafts link, rebuild_from set, one version entry (CPLLibrary/Drafts, Draft).
-- Before (2026-10-06): version '1', home 'not_filed', url null, file_name '20261005_Noncredit_Summit_CPL_Slides_1', versions [], rebuild_from null; figures, refresh_note and note as seeded by library-seed-skyshelf@bot.
-- Rollback: cpl_library_history holds the row as it was (changed_by 'library-filer@bot'); restore from `before`.
update public.cpl_library set
  versions = '[{"label":"v2","date":"2026-10-05","size":"5 slides · 1.9 MB","status":"Draft","url":"https://drive.google.com/file/d/1AlOWrPrB6W8rxzcJCWk8LEBmg3S3AzJj/view","file_id":"1AlOWrPrB6W8rxzcJCWk8LEBmg3S3AzJj","file_name":"20261005_Noncredit_Summit_CPL_Slides_2.pptx","md5":"c911778d3cba57fe443bba50879490d0","filed_at":"2026-10-06T18:46:36Z","folder":"CPLLibrary/Drafts"}]'::jsonb || coalesce((select jsonb_agg(case when e->>'status' in ('Latest', 'Draft')
      and coalesce(e->>'file_name', regexp_replace(e->>'url', '^.*/', '')) ~* '^(\d{8})_Noncredit_Summit_CPL_Slides(?:_v?(\d+))?\.pptx$'
      then jsonb_set(e, '{status}', to_jsonb('Replaced by v2'::text)) else e end order by o)
    from jsonb_array_elements(versions) with ordinality t(e, o)), '[]'::jsonb),
  url = 'https://drive.google.com/file/d/1AlOWrPrB6W8rxzcJCWk8LEBmg3S3AzJj/view', home = 'drive', file_name = '20261005_Noncredit_Summit_CPL_Slides_2.pptx', version = 'v2',
  made_on = coalesce(made_on, '2026-10-05'::date), file_type = coalesce(file_type, 'pptx'),
  status = case when status = 'requested' then 'draft' else status end,
  updated_by = 'library-filer@bot'
where slug = 'noncredit-summit-cpl-slides' and retired_at is null and not (versions @> '[{"file_id":"1AlOWrPrB6W8rxzcJCWk8LEBmg3S3AzJj"}]'::jsonb);
-- expect: UPDATE 1 (0 means the slug is wrong, the record is retired, or this file is already recorded)

update public.cpl_library set
  rebuild_from = 'CPLBrain 04-projects/cpl-initiative/20261005_Noncredit_Summit_CPL_Slides_2_build.py (template: any earlier version of the deck; portraits in resources/20261005_noncredit_summit_personas/)',
  figures = '52,452 students served (live_metrics.json, scraped 2026-10-06T16:08:22Z); funding read from the model under config md5 764fd264: $25,240,308 to 118 institutions, $1,812,403 noncredit. The deck''s notes carry every figure and its source.',
  refresh_note = 'students served from live_metrics.json, and the funding figures if the config md5 is no longer 764fd264, if the summit is more than a week after Oct. 6',
  note = 'Draft 2 (2026-10-06): Mt. San Antonio College plans to document its ladder; the NOCE claim out; Nadia''s CompTIA A+, Network+ and Security+ bundle. Source merged in CPLBrain #247.',
  updated_by = 'library-filer@bot'
where slug = 'noncredit-summit-cpl-slides' and retired_at is null and rebuild_from is null;
-- expect: UPDATE 1 (0 once applied: guarded on rebuild_from is null)
