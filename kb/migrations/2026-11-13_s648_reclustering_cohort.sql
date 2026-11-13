-- Re-clustering S648, case 2: 1 row (kb/reclustering_s648_out/2026-11-13/plan.md).
-- Sam, Open Asks Sheet 186 card 6, 13:16Z 2026-11-13: "All six as recommended"
-- (sam-sheet-186-six-cases-as-recommended-2026-11-13); the S648 conductor sent case 2 alone forward.
-- INSERT-only under the cohort reclustering-s648@bot (Rule 10a): a taken (course_id, field) slot is skipped,
-- never overwritten. Written by kb/_reclustering_s648_apply.py --sql.
-- Rollback: kb/migrations/2026-11-13_s648_reclustering_cohort_rollback.sql (deletes this row alone, by cohort, field and key; it
-- needs no before-values because nothing here overwrites). One plain statement; RETURNING puts the row
-- that landed into the runner's receipt (kb/receipts/migration_s648_reclustering_cohort_<run>.json,
-- its `response`), so a session that did not do the write can read what landed and roll it back.

insert into public.kb_curation (course_id, field, value, reviewer_email)
values
  ('FIRE M1274', 'merge_into', 'FIRE 130 X', 'reclustering-s648@bot')
on conflict (course_id, field) do nothing
returning course_id, field, value, reviewer_email;

-- Read back: expect 1 row under reclustering-s648@bot.
--   select course_id, field, value from public.kb_curation where reviewer_email = 'reclustering-s648@bot';
