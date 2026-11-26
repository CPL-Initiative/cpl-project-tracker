-- S739J lane 2's cheap piles at Orange Coast (4 rows: lists_not_closed 2, noted_figures_differ 2). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_orange_coast_2026-11-26_s739j.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Orange Coast College', '32737', 39726645292, '0e2dce8feef73b001850cf2b38a712c1', 'ef4f7e314eb5593594b8d00f331d96d5', 'e61feeea8ad83d318849665dbf26c309'),
  (2, 'Orange Coast College', '36732', 39726645292, 'b531a8c9a6472fc59c128f5923a609e4', '5702b3c852565b01d547e83b9f2f7e40', 'd98458d8cb84ef818bbf520201c1f313'),
  (3, 'Orange Coast College', '41373', 38670927724, '7deec0fe2ae7bb500e75e4fcf8aba3df', '3c81834a38a33a73170c8fc53655fda9', '5417c33a6cd7a6ab1d5512f14ad0af80'),
  (4, 'Orange Coast College', '43362', 39726645292, '1c55808416343f32f136b5eab239dd3a', '3e096e5d8483d0570dfc23bf65a968b0', 'd851cd658151e8c7e278d358268a67c9'))
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
