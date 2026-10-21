-- S443 for Sam, 2026-10-21. Sam: "Add a link to the draft funding guidance memo on
-- the funding table of contents. Don't refer to it as 'draft' since we'll finalize it
-- before publishing", then "we would want to store the memo in our new public library".
-- One Library record for the public memo page (funding-model/memo/), which builds the
-- tab's own memo from the published scenario. Listing it publicly is a reviewer's
-- call through cpl_library_set_public() (supabase_cpl_library_public.sql); this
-- record arrives unlisted and Sam lists it in the Library tab.
-- INSERT-only, idempotent on slug, cohort library-s443@bot.
-- Rollback: delete from cpl_library where slug = 'cpl-funding-guidance-memo' and added_by = 'library-s443@bot';
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, extent, file_type,
  status, home, url, made_by, rebuild_from, note, versions, added_by)
values ('cpl-funding-guidance-memo', 'CPL Implementation Funding Guidance Memo', 'document',
  '2026-2028 CPL Initiative Funding', '2026-10-21', null,
  'The Chancellor''s Office guidance memo on the 2026-27 CPL implementation funding under SB 135: the priority outcomes, allowable use, the allocation by district and institution, technical assistance and outcomes reporting. Built from the funding model''s published scenario, so its figures match the funding page.',
  'One memo', 'html', null, 'web',
  'https://cpl-initiative.github.io/cpl-project-tracker/funding-model/memo/',
  'S443, 2026-10-21',
  'cpl-project-tracker: funding-model/memo/index.html renders buildMemo("memo") from cpl_funding.js; the wording is the memo passages (MEMO_BLOCKS) curators edit in the Implementation Funding tab''s Report view.',
  'A live page: it rebuilds from the model on every visit, so no version is filed. The funding page''s Contents links it.',
  '[]'::jsonb, 'library-s443@bot')
on conflict (slug) do nothing;
