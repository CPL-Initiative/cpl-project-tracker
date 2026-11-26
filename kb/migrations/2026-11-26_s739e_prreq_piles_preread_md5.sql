-- S739E lane 2's cheap piles at Los Angeles Trade-Technical (6 rows: noted_figures_differ 1, noted_no_total 1, passes 3, pool_figure_not_read 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_los_angeles_trade_technical_2026-11-26_s739e.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Los Angeles Trade Technical College', '02911', 39054673977, '9038e0e6314b6af0dc0dd31d2415ae20', '2fac7f4cf7a6ba6567cb80b588101fc6', '41d4a1221c3e7818b092e31fa4d4b289'),
  (2, 'Los Angeles Trade Technical College', '21855', 39054673977, '9cd92ac09d0aaab49d15c4464a698a34', '2fac7f4cf7a6ba6567cb80b588101fc6', '41d4a1221c3e7818b092e31fa4d4b289'),
  (3, 'Los Angeles Trade Technical College', '31090', 39115770293, 'c28c9ea58bb8851c22838a46cc5f8bd4', '47da0209649c82cd95b3823123a7b1f9', '072e959a821c97284ee3eff595bae498'),
  (4, 'Los Angeles Trade Technical College', '18857', 39054673977, '30ddf27aad63106004ad93b0826d0abe', '580c87f6aaa9844d141e12a6e4ff739d', '35143cae07f338a8bfcd24032ae8ae5f'),
  (5, 'Los Angeles Trade Technical College', '38737', 39054673977, '52e7c863fa758676edc9982676d68e6c', '459dfeeb5c989cefc33fe2c631af6755', '31b7c31aabd6e242d97b5819b243d8e0'),
  (6, 'Los Angeles Trade Technical College', '37706', 39054673977, 'a9fc904dada2b182dd78adf146843860', '4e62525ffab7b40148e6f2aab9b3bd9f', 'b0f3c99dc33831e5b20e41722a99df38'))
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
