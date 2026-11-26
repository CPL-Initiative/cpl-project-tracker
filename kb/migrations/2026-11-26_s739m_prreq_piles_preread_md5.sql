-- S739M lane 2's cheap piles at Gavilan (5 rows: figure_within_variable_units 1, noted_figures_differ 4). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_gavilan_2026-11-26_s739m.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Gavilan College', '06128', 38948144064, '8d34a6239d727a5cfd1ef66a5dca4f97', '08b744cbd66844670ec1d1f0507d0a4f', '201b6dcccc8a7ac7726b7e178ae60564'),
  (2, 'Gavilan College', '06132', 38948144064, 'ddad3a41c0c7c4ec6fcde44b8a5278e2', '565698f6affa77ef6c1410d28f8c0923', '30f02bc0fdce1398dadb2ee1e4d54406'),
  (3, 'Gavilan College', '18541', 38948144064, '79dea45fa084b65f19aeb633298bb370', 'f1275b67c1691d1312d8a0f9272de9d0', '077d9561f737643b51a7e14460a7f264'),
  (4, 'Gavilan College', '24369', 38948144064, '51ed9c03276d8a5b549fd6ccfe5b7120', 'dfde00127a538f508c28565d7c2b6fb6', '81c2019c4bd6ac39f7e8db1199967ae3'),
  (5, 'Gavilan College', '37896', 38948144064, 'ce78ce52b1d46d96c9526d182128d268', '972ce3267c8b9670b117327200b82b48', 'b98eb11377ec5a89e15b2cf7ab558ea1'))
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
