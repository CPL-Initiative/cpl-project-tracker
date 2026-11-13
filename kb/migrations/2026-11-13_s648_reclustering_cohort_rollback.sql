-- Rollback for 2026-11-13_s648_reclustering_cohort.sql: removes exactly the row it wrote.
delete from public.kb_curation where reviewer_email = 'reclustering-s648@bot' and field = 'merge_into' and course_id = 'FIRE M1274'
returning course_id, field, value, reviewer_email;
-- Read back: expect 0.  select count(*) from public.kb_curation where reviewer_email = 'reclustering-s648@bot' and field = 'merge_into' and course_id = 'FIRE M1274';
