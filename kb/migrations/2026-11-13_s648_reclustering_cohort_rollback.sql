-- Rollback for 2026-11-13_s648_reclustering_cohort.sql: removes exactly the cohort's rows.
delete from public.kb_curation where reviewer_email = 'reclustering-s648@bot';
-- Read back: expect 0.  select count(*) from public.kb_curation where reviewer_email = 'reclustering-s648@bot';
