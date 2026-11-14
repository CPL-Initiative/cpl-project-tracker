-- CER: three rows a person saved on 2026-07-09 read "alifornia Veterinary Medical Association (CVMA)" (the C dropped).
-- Sam, Open Asks Sheet 195 card 4, 01:18Z 2026-11-14: "Fix both, remove the Water Treatment row"
-- (sam-sheet-195-answers-2026-11-14). His answer is the authority for exactly these three changes and nothing else:
--   UPDATE  _CREDENTIAL_REVIEW::Veterinary Assistance & Nursing: Emergency Procedures        value to the right spelling
--   UPDATE  _CREDENTIAL_REVIEW::Veterinary Equipment, Operation, Instrumentation and Safety  value to the right spelling
--   DELETE  _CREDENTIAL_REVIEW::Water Treatment Facilities  (the association does not issue it; the title's
--           issuing_agency_override, California State Water Resources Control Board (SWRCB), is a separate row and stays)
-- All three in field issuing_agency_additional_override. The two updates change the value alone: reviewer_email and
-- reviewed_at stay the person's, so the row still reads as their save (a fold's issuer rules read that stamp).
-- One plain statement: the writes hang on one guard CTE, and a failed guard raises, so nothing is written. The guard:
-- exactly these three rows in that field, each holding the misspelled value, each saved by a reviewer outside @bot,
-- each with the reviewed_at the committed overlay mirrors (kb/credential_review_overlay.json, synced 2026-11-14T00:56Z;
-- read live by the S649 conductor at 01:22Z), so a row re-saved since refuses. The result is each row's before-image
-- (to_jsonb), which the runner writes to kb/receipts/migration_s649_cvma_three_rows_<run>.json, its `response`.
-- Rollback: kb/migrations/2026-11-14_s649_cvma_three_rows_rollback.sql.

with expected (course_id, reviewed_at) as (
  values
    ('_CREDENTIAL_REVIEW::Veterinary Assistance & Nursing: Emergency Procedures', '2026-07-09T00:37:39.286263+00:00'),
    ('_CREDENTIAL_REVIEW::Veterinary Equipment, Operation, Instrumentation and Safety', '2026-07-09T00:37:42.376764+00:00'),
    ('_CREDENTIAL_REVIEW::Water Treatment Facilities', '2026-07-09T00:38:14.078346+00:00')
),
target as (
  select k.* from public.kb_curation k
  where k.field = 'issuing_agency_additional_override'
    and k.course_id in (select course_id from expected)
),
guard as (
  select (select count(*) from target) = 3
     and (select count(*) from target t join expected e on e.course_id = t.course_id
          where t.value = 'alifornia Veterinary Medical Association (CVMA)'
            and t.reviewer_email not like '%@bot'
            and t.reviewed_at::timestamptz = e.reviewed_at::timestamptz) = 3 as ok,
     (select count(*) from target) as target_rows
),
fixed as (
  update public.kb_curation k
  set value = 'California Veterinary Medical Association (CVMA)'
  from guard g, target t
  where g.ok and k.course_id = t.course_id and k.field = t.field
    and k.course_id in ('_CREDENTIAL_REVIEW::Veterinary Assistance & Nursing: Emergency Procedures',
                        '_CREDENTIAL_REVIEW::Veterinary Equipment, Operation, Instrumentation and Safety')
  returning jsonb_build_object('op', 'update', 'value_after', k.value, 'row_before', to_jsonb(t)) as image
),
gone as (
  delete from public.kb_curation k
  using guard g
  where g.ok and k.course_id = '_CREDENTIAL_REVIEW::Water Treatment Facilities'
    and k.field = 'issuing_agency_additional_override'
  returning jsonb_build_object('op', 'delete', 'row_before', to_jsonb(k)) as image
)
select case when g.ok and (select count(*) from fixed) = 2 and (select count(*) from gone) = 1
            then (select jsonb_agg(x.image) from (select image from fixed union all select image from gone) x)
            else ('refused by the guard: target rows ' || g.target_rows
                  || ', or a row differs from the plan (value, a bot reviewer, or re-saved since)')::int::text::jsonb
       end as changed
from guard g;

-- Read back: expect 2 rows, both the right spelling; the Water Treatment row gone.
--   select course_id, value from public.kb_curation where field = 'issuing_agency_additional_override' and course_id in ('_CREDENTIAL_REVIEW::Veterinary Assistance & Nursing: Emergency Procedures', '_CREDENTIAL_REVIEW::Veterinary Equipment, Operation, Instrumentation and Safety', '_CREDENTIAL_REVIEW::Water Treatment Facilities') order by 1;
