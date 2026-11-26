-- S740R2 lane 2's cheap piles at Santa Ana (8 rows: lists_not_closed 1, noted_figures_differ 5, pair_read_as_alternatives 1, required_list_outside_total 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_santa_ana_2026-11-26_s740r2.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Santa Ana College', '04230', 38843461766, '8445a070c137b725027d4bd75b260618', 'd2b6fcfb6953124b2f0584dbf2bd644b', '289257d3d18d732375b5303cda24fd4e'),
  (2, 'Santa Ana College', '04256', 45841675928, '080ca85c08c60a15641ba77253716cbb', 'b167e014df6b97bdebba96ca16afce51', '1704d8e783359e43b3731a6af7bb1db8'),
  (3, 'Santa Ana College', '08720', 38843461766, '817819e3decc60e8ec4aaab36edaf35e', '972ce3267c8b9670b117327200b82b48', '4d8be9d46ae27f2d91380ed2d4960541'),
  (4, 'Santa Ana College', '18780', 38843461766, '72a4cec07f3404e62d99dabc560a04ea', '565698f6affa77ef6c1410d28f8c0923', 'bbad296e929508f128619811abb431e5'),
  (5, 'Santa Ana College', '21748', 38843461766, '56c05323c62fb7e24e832f7670af6b42', '972ce3267c8b9670b117327200b82b48', 'e9fa5c488a27df9f47dba4cde2012b6f'),
  (6, 'Santa Ana College', '31859', 45841675928, '1cb8921fa6194f17ebe88ca3b3858412', '63bb1716563187017be2c4ba1619b459', '41dd94daa68060337cecd20ca30bc8f8'),
  (7, 'Santa Ana College', '31887', 45841675928, 'b25dae7a2bd302a5661a6952d089535d', '91bb1f5dc444e820cefd266546cffc57', '67d4824e26b8508bf3c07d979dee5a08'),
  (8, 'Santa Ana College', '32096', 38843461766, 'c3ba350cc945c1063a40385f4431b986', '300bbea3b35487832f659f65d7d9dfb5', '8ce9cafee8f99bca8d7f13e5b9374c26'))
select json_build_object(
  'listed', (select count(*) from v),
  'on_run', count(*) filter (where r.extracted_run = v.extracted_run),
  'record_is_before', count(*) filter (where r.extracted_run = v.extracted_run and md5(r.record::text) = v.rec_md5),
  'checks_is_before', count(*) filter (where r.extracted_run = v.extracted_run and md5(r.checks::text) = v.chk_md5),
  'already_after', count(*) filter (where md5(r.checks::text) = v.after_md5),
  'checked_now', count(*) filter (where r.checked),
  'confirm_matches', count(*) filter (where lv.verdict = 'confirm'
                                       and lv.requirements_fp = public.program_record_fp(r.record)))
  from v join public.program_requirement_records r
    on r.college = v.college and r.control_number = v.control_number
  left join lateral (select pv.verdict, pv.requirements_fp from public.program_record_verdicts pv
                      where pv.college = v.college and pv.control_number = v.control_number
                      order by pv.id desc limit 1) lv on true;
