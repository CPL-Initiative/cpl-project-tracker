-- Family tags for the saved folds into a declared family title (kb/_family_tag_plan.py).
-- Sam, 2026-11-11, in session: each ASE bundle stays its own title and carries the family (cpl_memory sam-bundle-family-is-a-field-2026-11-11); his saved folds are read as family tags.
-- Rule 10: insert-only under credential-family-s638@bot. Per title, all or nothing: a title whose rows changed since the read
-- (a fold row re-saved, added or removed, or a credential_family row already there) is skipped whole and
-- listed at the end. Rollback: rollback.sql beside this file (row images in receipt.json).
begin;
create temp table _family_skip (course_id text primary key, why text);

-- ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical');

-- ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined) -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 1
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)' and ((field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:54.029+00:00'::timestamptz))) <> 1
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)');

-- ASE A8 + L1 — Engine Performance and Advanced Engine Performance -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance');

-- ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced');

-- ASE Bundle — A1, A6, A8, L1 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1');

-- ASE Bundle — A2, A3, A6 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6');

-- ASE Bundle — A4, A5 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5');

-- ASE Bundle — A4, A5, A6 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6');

-- ASE Bundle — A6 or T6 + L3 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3');

-- ASE Bundle — A6, A8, L1 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1');

-- ASE Bundle — L2, T8, SP/2 HD -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD');

-- ASE Bundle — T2, T5, T7, T8 + MACS/609 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609');

-- ASE Bundle — T2, T6, T8 + Snap-on 604 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604');

-- ASE Bundle — T2, T8 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8');

-- ASE Bundle — T3, T4, T5, T8 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8');

-- ASE Bundle — T3, T8, SP/2 HD -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD');

-- ASE Bundle — T4, T8, SP/2 HD -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD');

-- ASE Bundle — T5, T8 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8');

-- ASE Bundle — T5, T8, SP/2 HD -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD');

-- ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD');

-- ASE Bundle — T6, T8 + Snap-on 604 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604');

-- ASE Bundle — T7, T8 + MACS/609 -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609');

-- ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair');

-- ASE G1 + ALI Lift It Right Bundle -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle');

-- ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis -> family ASE Certificate Bundles
insert into _family_skip (course_id, why) select '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis', 'rows changed since the read'
 where (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis' and field in ('unified_title_override', 'unified_title_merge_confirm')) <> 2
    or (select count(*) from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis' and ((field = 'unified_title_merge_confirm' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz) or (field = 'unified_title_override' and value = 'ASE Certificate Bundles' and reviewer_email = 'slee@cccco.edu' and reviewed_at = '2026-11-11T15:26:55.029+00:00'::timestamptz))) <> 2
    or exists (select 1 from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis' and field = 'credential_family');
insert into public.kb_curation (course_id, field, value, reviewer_email)
select '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis', 'credential_family', 'ASE Certificate Bundles', 'credential-family-s638@bot'
 where not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis')
on conflict (course_id, field) do nothing;
delete from public.kb_curation where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis' and field in ('unified_title_override', 'unified_title_merge_confirm')
   and not exists (select 1 from _family_skip where course_id = '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis');

-- Read back: expect 25 converted and none skipped; a skipped title is untouched.
select 'skipped' as outcome, course_id, why from _family_skip
union all
select 'converted', course_id, null from public.kb_curation
 where field = 'credential_family' and reviewer_email = 'credential-family-s638@bot' and course_id in ('_CREDENTIAL_REVIEW::ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical', '_CREDENTIAL_REVIEW::ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)', '_CREDENTIAL_REVIEW::ASE A8 + L1 — Engine Performance and Advanced Engine Performance', '_CREDENTIAL_REVIEW::ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced', '_CREDENTIAL_REVIEW::ASE Bundle — A1, A6, A8, L1', '_CREDENTIAL_REVIEW::ASE Bundle — A2, A3, A6', '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5', '_CREDENTIAL_REVIEW::ASE Bundle — A4, A5, A6', '_CREDENTIAL_REVIEW::ASE Bundle — A6 or T6 + L3', '_CREDENTIAL_REVIEW::ASE Bundle — A6, A8, L1', '_CREDENTIAL_REVIEW::ASE Bundle — L2, T8, SP/2 HD', '_CREDENTIAL_REVIEW::ASE Bundle — T2, T5, T7, T8 + MACS/609', '_CREDENTIAL_REVIEW::ASE Bundle — T2, T6, T8 + Snap-on 604', '_CREDENTIAL_REVIEW::ASE Bundle — T2, T8', '_CREDENTIAL_REVIEW::ASE Bundle — T3, T4, T5, T8', '_CREDENTIAL_REVIEW::ASE Bundle — T3, T8, SP/2 HD', '_CREDENTIAL_REVIEW::ASE Bundle — T4, T8, SP/2 HD', '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8', '_CREDENTIAL_REVIEW::ASE Bundle — T5, T8, SP/2 HD', '_CREDENTIAL_REVIEW::ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD', '_CREDENTIAL_REVIEW::ASE Bundle — T6, T8 + Snap-on 604', '_CREDENTIAL_REVIEW::ASE Bundle — T7, T8 + MACS/609', '_CREDENTIAL_REVIEW::ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair', '_CREDENTIAL_REVIEW::ASE G1 + ALI Lift It Right Bundle', '_CREDENTIAL_REVIEW::ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis')
 order by 1, 2;
drop table _family_skip;
commit;
