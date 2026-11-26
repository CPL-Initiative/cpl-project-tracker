-- S740A lane 2's cheap piles at Gavilan (4 rows: units_within_printed_range 4). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_gavilan_2026-11-26_s740a.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Gavilan College', '08460', 38948144064, '2a1cc9c266f0a54ea3dca569dcb4e7f4', 'dfde00127a538f508c28565d7c2b6fb6', 'bd400c36e98ae3ad32daa79dde4f5ae8'),
  (2, 'Gavilan College', '19378', 38948144064, '581109f49ac59cf42dc08225ff2dfabc', 'd2b6fcfb6953124b2f0584dbf2bd644b', '30365c13e67e7c0b7fa91d8d8fced135'),
  (3, 'Gavilan College', '38787', 38948144064, '667e7aeb86605a41cee6b4b2c09376fe', '5b2a25934293ef40413bd4910423a432', 'cfe01a5d9339c582c6efb94672c98c70'),
  (4, 'Gavilan College', '41394', 38948144064, 'cbe70e2d4fe1437661d4f15954a48314', '708adbf49bbb16e7b801ca65c014c5be', '90b86be56a5c72e375a8092687bd86f0'))
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
