-- S740C4 lane 2's cheap piles at San Jose City (4 rows: figure_within_variable_units 1, lists_not_closed 2, noted_unit_floor 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_san_jose_city_2026-11-26_s740c4.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'San Jose City College', '22241', 43357106423, '5d64ac2ba0b6604fafa4797cc259d675', '88e2495efd06d1573c7fb0fe096e2788', '9390f46587e4c77f2bf02014185dc0e1'),
  (2, 'San Jose City College', '30403', 43357106423, 'fda3f6f52dc90f969093bd4b79ca341a', '8fd0a9378506bd00405b5cf1ecb0628d', '5e01ac6fe89132bd5a2c263996b643f3'),
  (3, 'San Jose City College', '33857', 43357106423, '76fa5bcf88fba5e49e670506be9f85bb', 'cbf5307c76c2a0516620ac747998024e', '2ea6c662b4462522071efd08cb219eff'),
  (4, 'San Jose City College', '37604', 43357106423, '4acf8cf2538b93256dc846776af8cfaf', 'dd0e3718f0cc4fde4db70ac5ba05d7e1', '68c3db79829c7fe2bd5b49a1d51b3d8c'))
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
