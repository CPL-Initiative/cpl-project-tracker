-- S748B lane 2's cheap piles, one plan over Orange Coast, East Los Angeles (2 rows: figure_within_variable_units 1, total_differs 1). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added,
-- or checks.arithmetic to equal for a rescore; the record unchanged. Receipts (before_image per
-- row), one a college:
--   kb/receipts/program_requirement_records_piles_s748_orange_coast_2026-11-28_s748b.json
--   kb/receipts/program_requirement_records_piles_s748_east_los_angeles_2026-11-28_s748b.json
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Orange Coast College', '03993', 43136182950, 'ece3b4edea7b89b364152476fff69106', '7ac5cb2e725612f15f2560620a3266ac', '55b854232b7645d8182d350f4bd4157f'),
  (2, 'East Los Angeles College', '41231', 43357061643, '82ead54ab9ac268e1a21c783cb05d196', '9b1f1d670fff2ae1355332e88bab98c0', '26e27c5f8c906e17cb95dc13e5a64f75'))
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
