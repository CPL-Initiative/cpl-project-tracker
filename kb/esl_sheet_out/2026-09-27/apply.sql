-- ESL follow-up sheet, item 2 (Sam, 2026-09-27 00:02 UTC, his own call "vesl"): the two Optical Technician
-- groups fold into Vocational ESL (ESOL M9023). Item 1 ("keep") writes nothing: ESOL M9309 stays apart with
-- transfer composition. Read 2026-09-27T00:21:51Z: neither identity carries a merge_into row, and ESOL M9023
-- carries none, so no chain can loop. INSERT-only, ON CONFLICT DO NOTHING: a row a curator adds first wins.
-- Run once; a second run changes nothing. Undo: rollback.sql beside this file.
begin;
insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at) values ('ESOL M9267', 'merge_into', 'ESOL M9023', 'esl-vesl-s294@bot', now()) on conflict do nothing;  -- follow-up item 2
insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at) values ('ESOL M9272', 'merge_into', 'ESOL M9023', 'esl-vesl-s294@bot', now()) on conflict do nothing;  -- follow-up item 2
commit;
select reviewer_email, count(*) from kb_curation where reviewer_email = 'esl-vesl-s294@bot' group by 1;
