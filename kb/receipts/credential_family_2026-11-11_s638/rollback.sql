-- Rollback of plan.sql (kb/_family_tag_plan.py). Read live first (data_write_rollback.md).
-- Per title: restored whole, or skipped whole and listed when a person has saved on it since.
begin;
create temp table _family_skip (course_id text primary key, why text);

-- ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical')
on conflict (course_id, field) do nothing;

-- ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:54.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)')
on conflict (course_id, field) do nothing;

-- ASE A8 + L1 — Engine Performance and Advanced Engine Performance
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance')
on conflict (course_id, field) do nothing;

-- ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced')
on conflict (course_id, field) do nothing;

-- ASE Bundle — A1, A6, A8, L1
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1')
on conflict (course_id, field) do nothing;

-- ASE Bundle — A2, A3, A6
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6')
on conflict (course_id, field) do nothing;

-- ASE Bundle — A4, A5
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5')
on conflict (course_id, field) do nothing;

-- ASE Bundle — A4, A5, A6
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6')
on conflict (course_id, field) do nothing;

-- ASE Bundle — A6 or T6 + L3
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3')
on conflict (course_id, field) do nothing;

-- ASE Bundle — A6, A8, L1
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1')
on conflict (course_id, field) do nothing;

-- ASE Bundle — L2, T8, SP/2 HD
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T2, T5, T7, T8 + MACS/609
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T2, T6, T8 + Snap-on 604
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T2, T8
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T3, T4, T5, T8
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T3, T8, SP/2 HD
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T4, T8, SP/2 HD
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T5, T8
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T5, T8, SP/2 HD
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T6, T8 + Snap-on 604
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604')
on conflict (course_id, field) do nothing;

-- ASE Bundle — T7, T8 + MACS/609
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609')
on conflict (course_id, field) do nothing;

-- ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair')
on conflict (course_id, field) do nothing;

-- ASE G1 + ALI Lift It Right Bundle
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle')
on conflict (course_id, field) do nothing;

-- ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis', 'saved on since the plan ran'
 where exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis' and field in ('unified_title_override', 'unified_title_merge_confirm'))
    or not exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis' and field = 'credential_family'
                   and value = 'ASE Certificate Bundles' and reviewer_email = 'credential-family-s638@bot');
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis' and field = 'credential_family'
   and reviewer_email = 'credential-family-s638@bot' and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis');
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis', 'unified_title_merge_confirm', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis')
on conflict (course_id, field) do nothing;
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
select '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis', 'unified_title_override', 'ASE Certificate Bundles', 'slee@cccco.edu', '2026-11-11T15:26:55.029+00:00', null, null where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis')
on conflict (course_id, field) do nothing;

select course_id, why from _family_skip order by 1;
drop table _family_skip;
commit;
