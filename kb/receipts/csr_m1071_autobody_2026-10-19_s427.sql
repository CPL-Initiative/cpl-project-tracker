-- Common Subjects Reference: AUTB M1071 Import Body Customizing returns to Auto Body Technology.
-- Sam, Open Asks Sheet 101 card 1 (22:38:25Z, 2026-10-19, his own call): "autobody". One discipline field,
-- no re-key: the identity keeps AUTB M1071, Auto Body's own code, and Agricultural Business and Related
-- Services carries AGAB M1006 alone. The row changed is his own 2026-07-13 discipline row (a human-sourced
-- row is never superseded by a session's inference, Rule 8; here he ruled), so it stays under his email with
-- reviewed_at set to the ruling. The cohort note on the AGAB pick (csr-s427@bot, the receipt of 2026-10-19)
-- said M1071 waits on his card; it now says how he ruled.
-- Rule 10 (a2): guarded UPDATEs, each pinned to the row's before-values; the receipt
-- kb/receipts/csr_m1071_autobody_2026-10-19_s427.json carries the identity file and overlay before/after.
--
-- BEFORE (read live 2026-10-19 ~22:45Z through the Supabase MCP):
--   AUTB M1071 | discipline | Agricultural Business and Related Services | map@rccd.edu | 2026-07-13 14:03:13.128905+00
--   _CANON_SUBJ4::Agricultural Business and Related Services | canonical_subj4_notes | csr-s427@bot |
--     'AGAB: Sam, Open Asks Sheet 99 card 3 (2026-10-19, agab): Agricultural Business and Related Services takes AGAB, the C-ID family code AG-AB; its identity AUTB M1006 Supervision and Management in Agriculture re-keyed to AGAB M1006 (kb/agab_remint_out/2026-10-19/). AUTB M1071 Import Body Customizing keeps Sam''s 2026-07-13 discipline row and waits on his card.'
--
-- ROLLBACK (re-applies the before-images; takes back only what this file wrote):
--   update public.kb_curation
--      set value = 'Agricultural Business and Related Services', reviewed_at = '2026-07-13 14:03:13.128905+00'
--    where course_id = 'AUTB M1071' and field = 'discipline' and reviewer_email = 'map@rccd.edu'
--      and value = 'Auto Body Technology';
--   update public.kb_curation
--      set value = 'AGAB: Sam, Open Asks Sheet 99 card 3 (2026-10-19, agab): Agricultural Business and Related Services takes AGAB, the C-ID family code AG-AB; its identity AUTB M1006 Supervision and Management in Agriculture re-keyed to AGAB M1006 (kb/agab_remint_out/2026-10-19/). AUTB M1071 Import Body Customizing keeps Sam''s 2026-07-13 discipline row and waits on his card.'
--    where course_id = '_CANON_SUBJ4::Agricultural Business and Related Services' and field = 'canonical_subj4_notes'
--      and reviewer_email = 'csr-s427@bot';

update public.kb_curation
   set value = 'Auto Body Technology',
       reviewed_at = '2026-10-19 22:38:25.197+00'
 where course_id = 'AUTB M1071'
   and field = 'discipline'
   and reviewer_email = 'map@rccd.edu'
   and value = 'Agricultural Business and Related Services'
   and reviewed_at = '2026-07-13 14:03:13.128905+00';

update public.kb_curation
   set value = 'AGAB: Sam, Open Asks Sheet 99 card 3 (2026-10-19, agab): Agricultural Business and Related Services takes AGAB, the C-ID family code AG-AB; its identity AUTB M1006 Supervision and Management in Agriculture re-keyed to AGAB M1006 (kb/agab_remint_out/2026-10-19/). AUTB M1071 Import Body Customizing returned to Auto Body Technology on his Open Asks Sheet 101 card 1 (2026-10-19 22:38Z, autobody): one discipline field, no re-key (kb/receipts/csr_m1071_autobody_2026-10-19_s427.sql).'
 where course_id = '_CANON_SUBJ4::Agricultural Business and Related Services'
   and field = 'canonical_subj4_notes'
   and reviewer_email = 'csr-s427@bot'
   and value = 'AGAB: Sam, Open Asks Sheet 99 card 3 (2026-10-19, agab): Agricultural Business and Related Services takes AGAB, the C-ID family code AG-AB; its identity AUTB M1006 Supervision and Management in Agriculture re-keyed to AGAB M1006 (kb/agab_remint_out/2026-10-19/). AUTB M1071 Import Body Customizing keeps Sam''s 2026-07-13 discipline row and waits on his card.';

-- Read back: expect AUTB M1071 discipline = Auto Body Technology under map@rccd.edu at 22:38:25Z, and the note
-- row under csr-s427@bot naming Sheet 101.
select course_id, field, left(value, 72) as value, reviewer_email, reviewed_at
  from public.kb_curation
 where (course_id = 'AUTB M1071' and field = 'discipline')
    or (course_id = '_CANON_SUBJ4::Agricultural Business and Related Services' and field = 'canonical_subj4_notes')
 order by course_id;
