-- Common Subjects Reference: Agricultural Business and Related Services takes AGAB.
-- Sam, Open Asks Sheet 99 card 3 (16:37Z, 2026-10-19, his own call): "agab". The pick is written as the
-- tab's own save would write it (canonical_subj4.js saveField: the _CANON_SUBJ4:: namespace, the
-- canonical_subj4 field), under the session cohort csr-s427@bot; the note row names the ruling.
-- The identity's re-key (AUTB M1006 -> AGAB M1006) is kb/agab_remint_out/2026-10-19/alias_map.json.
-- Rule 10: insert-only, a duplicate ignored (the key is course_id, field); the daily sync carries the
-- rows into kb/discipline_canonical_subj4.json, which this PR already edits to match.
--
-- ROLLBACK (takes back only what this file wrote):
--   delete from public.kb_curation
--    where reviewer_email = 'csr-s427@bot'
--      and course_id = '_CANON_SUBJ4::Agricultural Business and Related Services';

insert into public.kb_curation (course_id, field, value, reviewer_email)
values
  ('_CANON_SUBJ4::Agricultural Business and Related Services', 'canonical_subj4', 'AGAB', 'csr-s427@bot'),
  ('_CANON_SUBJ4::Agricultural Business and Related Services', 'canonical_subj4_notes',
   'AGAB: Sam, Open Asks Sheet 99 card 3 (2026-10-19, agab): Agricultural Business and Related Services takes AGAB, the C-ID family code AG-AB; its identity AUTB M1006 Supervision and Management in Agriculture re-keyed to AGAB M1006 (kb/agab_remint_out/2026-10-19/). AUTB M1071 Import Body Customizing keeps Sam''s 2026-07-13 discipline row and waits on his card.',
   'csr-s427@bot')
on conflict (course_id, field) do nothing;

-- Read back: expect the two rows under csr-s427@bot.
select course_id, field, left(value, 60) as value, reviewer_email, reviewed_at
  from public.kb_curation
 where course_id = '_CANON_SUBJ4::Agricultural Business and Related Services'
 order by field;
