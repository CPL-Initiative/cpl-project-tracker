-- Re-clustering S648, cases 2 and 6 (kb/reclustering_s648_out/2026-11-13/plan.md).
-- Sam, Open Asks Sheet 186 card 6, 13:16Z 2026-11-13: "All six as recommended"
-- (sam-sheet-186-six-cases-as-recommended-2026-11-13); the S648 conductor sent 2 and 6 forward (case 4 held).
-- INSERT-only under the cohort reclustering-s648@bot (Rule 10a); a row whose (course_id, field) slot is taken
-- is skipped, never overwritten. Written by kb/_reclustering_s648_apply.py --sql.
-- Case 6's target id must be in kb/coci_minted_courses.json in the same window
-- (kb/_reclustering_s648_apply.py --record).
-- Rollback: kb/migrations/2026-11-13_s648_reclustering_cohort_rollback.sql (delete by cohort; takes back only these rows, so it needs no
-- before-values: nothing here overwrites). One plain statement; RETURNING puts the rows that landed
-- into the runner's receipt (kb/receipts/migration_s648_reclustering_cohort_<run>.json, its `response`),
-- so a session that did not do the write can read what landed and roll it back from this header.

insert into public.kb_curation (course_id, field, value, reviewer_email)
values
  ('FIRE M1274', 'merge_into', 'FIRE 130 X', 'reclustering-s648@bot'),
  ('CN:CCC000609492', 'merge_into', 'BUSI M11TU', 'reclustering-s648@bot')
on conflict (course_id, field) do nothing
returning course_id, field, value, reviewer_email;

-- Read back: expect 2 rows, every one under reclustering-s648@bot.
--   select count(*) from public.kb_curation where reviewer_email = 'reclustering-s648@bot' and field = 'merge_into' and course_id in ('FIRE M1274', 'CN:CCC000609492');
