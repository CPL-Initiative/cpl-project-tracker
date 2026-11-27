-- S742K1 lane 2's cheap piles at Cuesta (2 rows: pair_read_as_alternatives 2). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_cuesta_2026-11-27_s742k1.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Cuesta College', '41744', 39063368678, 'b7536d5b40df0f3a6d4b74b60512909d', '87e5fe088d44991cdab6e95d09f28b7b', '6d5f2a98c84307be84a004d7e433a3e9'),
  (2, 'Cuesta College', '43053', 45787691549, '89150d06b3d884c8296f984906bd6f42', '88e2495efd06d1573c7fb0fe096e2788', 'ba22c86af89d3987662498954979e4e5'))
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
