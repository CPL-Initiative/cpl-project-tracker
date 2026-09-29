-- Undo the ESL follow-up paste of 2026-09-27: remove the two merge rows it added. Nothing else was touched.
begin;
delete from kb_curation where reviewer_email = 'esl-vesl-s294@bot' and field = 'merge_into';
commit;
