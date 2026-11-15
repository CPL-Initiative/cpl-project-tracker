-- DRAFT. Rollback for 2026-11-14_s653_honors_of_field.sql (COBIx's review of #3304, item 2; #3315's reviews). The two
-- base titles take back the before-values committed in kb/honors_of_s653_out/2026-11-14/step1_restamp_before.json
-- (automerge-v1@bot, 2026-06-12T22:47:01.69179+00:00), and the cohort's honors_of rows go. One plain statement on one
-- guard, which raises and changes nothing unless:
--   * no removable step-2 row stands (cohort honors-rows-s653@bot, not validated by a person): the rollbacks run
--     last in, first out. A step-2 row a person validated is the step-2 rollback's kept_for_a_person; it is a
--     person's record and blocks nothing here (#3315's third review, finding 7; COBIx, 18:47Z);
--   * no kb_curation row is keyed on an H id: the step-4 mint has not landed, or its own rollback has run;
--   * both titles still read honors-s652@bot with the value step 1 left. A person's later edit refuses the rollback
--     rather than leaving one title restored and one not; a person decides that case;
--   * the cohort honors-s653@bot holds exactly two honors_of rows.
-- The delete keys on the cohort and the field, never on today's ids, so it finds both rows after a mint re-keys
-- HUMA M10ME and LIBR M10CJ to their H ids. It never deletes a row a person has validated (the Verify control stamps
-- every row of a course, honors_of included): such a row stays, and the result counts it as kept_for_a_person.
-- Run this BEFORE 2026-11-14_s652_honors_followups_rollback.sql.
with expected (course_id, value) as (
  values ('HUMA M1110', 'World Religions'), ('LIBR M1040', 'Media & Information Literacy')
),
target as (
  select k.* from public.kb_curation k join expected e on e.course_id = k.course_id
  where k.field = 'unified_title' and k.value = e.value and k.reviewer_email = 'honors-s652@bot'
),
cohort as (
  select k.*, (k.validated_by is null or k.validated_by like '%@bot') as removable
  from public.kb_curation k where k.reviewer_email = 'honors-s653@bot' and k.field = 'honors_of'
),
step2 as (
  select count(*) as n from public.kb_curation r
  where r.reviewer_email = 'honors-rows-s653@bot' and (r.validated_by is null or r.validated_by like '%@bot')
),
minted as (
  select count(*) as n from public.kb_curation h where h.course_id ~ '^[A-Z]{1,6} [MZ][0-9][A-Z0-9]{3}H$'
),
guard as (
  select (select count(*) from target) = 2 and (select n from step2) = 0 and (select n from minted) = 0
     and (select count(*) from cohort) = 2 as ok,
     (select count(*) from target) as titles,
     (select n from step2) as step2_rows,
     (select n from minted) as h_id_rows,
     (select count(*) from cohort) as cohort_rows,
     (select count(*) from cohort where not removable) as kept
),
restored as (
  update public.kb_curation k
  set reviewer_email = 'automerge-v1@bot', reviewed_at = '2026-06-12T22:47:01.69179+00:00'::timestamptz
  from guard g, target t
  where g.ok and k.course_id = t.course_id and k.field = 'unified_title' and k.reviewer_email = 'honors-s652@bot'
  returning jsonb_build_object('op', 'restamp_back', 'course_id', k.course_id) as image
),
removed as (
  delete from public.kb_curation k
  using guard g
  where g.ok and k.reviewer_email = 'honors-s653@bot' and k.field = 'honors_of'
    and (k.validated_by is null or k.validated_by like '%@bot')
  returning jsonb_build_object('op', 'delete', 'row', to_jsonb(k)) as image
)
select case when g.ok and (select count(*) from restored) = 2 and (select count(*) from removed) + g.kept = 2
            then jsonb_build_object('kept_for_a_person', g.kept,
                                    'changed', (select jsonb_agg(x.image)
                                                from (select image from restored union all select image from removed) x))
            else ('refused by the guard: titles under honors-s652@bot ' || g.titles || ' of 2, removable step-2 rows '
                  || g.step2_rows || ', rows keyed on an H id ' || g.h_id_rows || ', cohort honors_of rows '
                  || g.cohort_rows || ' of 2')::int::text::jsonb
       end as undone
from guard g;
-- Read back: expect the two titles under automerge-v1@bot, 2026-06-12, and no honors-s653@bot row except one a
-- person validated (kept_for_a_person in the result).
