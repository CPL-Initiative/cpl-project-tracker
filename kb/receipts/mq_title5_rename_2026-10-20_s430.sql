-- Common Subjects Reference: nine MQ discipline names take the handbook's spellings (one re-key window).
-- Sam, Open Asks Sheet 99 card 6 (16:37Z, 2026-10-19, his own call): "Rename as the handbook spells them",
-- re-affirming his 2026-09-08 ruling. The file stores change in the same PR (kb/_mq_title5_rename.py);
-- this file re-keys the four live kb_curation rows that carry an old name, read live at 01:38Z 2026-10-20:
--
--   course_id                                                  field             value                                              reviewer_email               reviewed_at
--   _CANON_SUBJ4::English as a Second Language Noncredit 53412  canonical_subj4   ESLN                                               map@rccd.edu                 2026-06-12 12:56:20.510479+00
--   _CANON_SUBJ4::Interdisciplinary-Basic Skills: Noncredit 53412 canonical_subj4 BSKL                                               map@rccd.edu                 2026-06-12 12:57:06.375421+00
--   BSKL M9001                                                 discipline        Interdisciplinary-Basic Skills: Noncredit 53412    map@rccd.edu                 2026-05-21 19:22:55.870894+00
--   BSKL M9252                                                 discipline        Interdisciplinary-Basic Skills: Noncredit 53412    trailcrew-ccr3-s112@bot      2026-07-12 21:17:48.970211+00
--
-- Rule 10 (a2): a guarded UPDATE whose receipt carries the before-values. Each statement matches the row's
-- whole before-state (key, field, value and reviewer), so a row a person changed since the read is left
-- alone and the read-back shows it. The two picks are Sam's own rows: only their key moves, to the name he
-- ruled; the value, the reviewer and the time stay his. No row is keyed by a new name (read live, same time),
-- so no key collides. The daily sync then carries the keys into kb/discipline_canonical_subj4.json and
-- kb/coci_curation.json, which this PR already edits to match.
--
-- ROLLBACK (puts back exactly the before-state above):
--   update public.kb_curation set course_id = '_CANON_SUBJ4::English as a Second Language Noncredit 53412'
--    where course_id = '_CANON_SUBJ4::English as a Second Language (ESL): Noncredit' and field = 'canonical_subj4'
--      and value = 'ESLN' and reviewer_email = 'map@rccd.edu';
--   update public.kb_curation set course_id = '_CANON_SUBJ4::Interdisciplinary-Basic Skills: Noncredit 53412'
--    where course_id = '_CANON_SUBJ4::Interdisciplinary-Basic Skills: Noncredit' and field = 'canonical_subj4'
--      and value = 'BSKL' and reviewer_email = 'map@rccd.edu';
--   update public.kb_curation set value = 'Interdisciplinary-Basic Skills: Noncredit 53412'
--    where course_id in ('BSKL M9001', 'BSKL M9252') and field = 'discipline'
--      and value = 'Interdisciplinary-Basic Skills: Noncredit';

update public.kb_curation
   set course_id = '_CANON_SUBJ4::English as a Second Language (ESL): Noncredit'
 where course_id = '_CANON_SUBJ4::English as a Second Language Noncredit 53412'
   and field = 'canonical_subj4' and value = 'ESLN' and reviewer_email = 'map@rccd.edu';

update public.kb_curation
   set course_id = '_CANON_SUBJ4::Interdisciplinary-Basic Skills: Noncredit'
 where course_id = '_CANON_SUBJ4::Interdisciplinary-Basic Skills: Noncredit 53412'
   and field = 'canonical_subj4' and value = 'BSKL' and reviewer_email = 'map@rccd.edu';

update public.kb_curation
   set value = 'Interdisciplinary-Basic Skills: Noncredit'
 where course_id = 'BSKL M9001' and field = 'discipline'
   and value = 'Interdisciplinary-Basic Skills: Noncredit 53412' and reviewer_email = 'map@rccd.edu';

update public.kb_curation
   set value = 'Interdisciplinary-Basic Skills: Noncredit'
 where course_id = 'BSKL M9252' and field = 'discipline'
   and value = 'Interdisciplinary-Basic Skills: Noncredit 53412' and reviewer_email = 'trailcrew-ccr3-s112@bot';

-- Applied by supabase-migrate.yml run 39356049395 (2026-10-20 01:56Z). Read back live through the Supabase MCP
-- at ~02:05Z: the four rows under their new names (ESLN and BSKL picks under map@rccd.edu, reviewed_at unchanged;
-- BSKL M9001 and M9252 reading Interdisciplinary-Basic Skills: Noncredit), no row under an old name.
--
-- Read back: expect the four rows under their new names and no row left under an old one.
select course_id, field, left(value, 60) as value, reviewer_email, reviewed_at
  from public.kb_curation
 where course_id in ('_CANON_SUBJ4::English as a Second Language (ESL): Noncredit',
                     '_CANON_SUBJ4::Interdisciplinary-Basic Skills: Noncredit',
                     '_CANON_SUBJ4::English as a Second Language Noncredit 53412',
                     '_CANON_SUBJ4::Interdisciplinary-Basic Skills: Noncredit 53412')
    or (course_id in ('BSKL M9001', 'BSKL M9252') and field = 'discipline')
 order by course_id, field;
