-- Rollback for 2026-11-14_s649_cvma_three_rows.sql: puts the three rows back exactly as the person saved them on
-- 2026-07-09, reviewer and reviewed_at included (the forward run's receipt, `response`, holds each before-image).
-- The two veterinary rows return to the misspelled value only while they still hold the corrected value the forward
-- run wrote (a person's later save wins); the Water Treatment row is re-inserted on conflict do nothing (a row saved
-- in that slot since wins). One plain statement.
with put_back as (
  update public.kb_curation k
  set value = 'alifornia Veterinary Medical Association (CVMA)'
  where k.field = 'issuing_agency_additional_override'
    and k.value = 'California Veterinary Medical Association (CVMA)'
    and ((k.course_id = '_CREDENTIAL_REVIEW::Veterinary Assistance & Nursing: Emergency Procedures'
          and k.reviewed_at::timestamptz = '2026-07-09T00:37:39.286263+00:00'::timestamptz)
      or (k.course_id = '_CREDENTIAL_REVIEW::Veterinary Equipment, Operation, Instrumentation and Safety'
          and k.reviewed_at::timestamptz = '2026-07-09T00:37:42.376764+00:00'::timestamptz))
  returning k.course_id, k.value
),
reinserted as (
  insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at)
  values ('_CREDENTIAL_REVIEW::Water Treatment Facilities', 'issuing_agency_additional_override',
          'alifornia Veterinary Medical Association (CVMA)', 'map@rccd.edu', '2026-07-09T00:38:14.078346+00:00')
  on conflict (course_id, field) do nothing
  returning course_id, value
)
select jsonb_build_object('restored', (select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) from put_back p),
                          'reinserted', (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from reinserted r))
       as rolled_back;
-- Read back: expect 3 rows, each "alifornia Veterinary Medical Association (CVMA)".
--   select course_id, value, reviewed_at from public.kb_curation where field = 'issuing_agency_additional_override' and course_id in ('_CREDENTIAL_REVIEW::Veterinary Assistance & Nursing: Emergency Procedures', '_CREDENTIAL_REVIEW::Veterinary Equipment, Operation, Instrumentation and Safety', '_CREDENTIAL_REVIEW::Water Treatment Facilities') order by 1;
