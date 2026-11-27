-- S741K3 lane 2's cheap piles at San Bernardino Valley (2 rows: units_within_printed_range 1, waived_course_counted 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_san_bernardino_valley_2026-11-27_s741k3.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'San Bernardino Valley College', '22784', 45355976381, 'ffd58e42306953323ee696f78fa03509', '88e2495efd06d1573c7fb0fe096e2788', 'd1e365f78b6314f0cfc12c5f47882d54'),
  (2, 'San Bernardino Valley College', '35833', 38748858322, '682a6aac8f700aa2ab8187ee35b737ad', '3e096e5d8483d0570dfc23bf65a968b0', 'e2d90ead82230b83cb68ea7c748eb03f'))
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
