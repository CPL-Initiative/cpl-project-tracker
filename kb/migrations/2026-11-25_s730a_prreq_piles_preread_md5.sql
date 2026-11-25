-- S730A lane 2's cheap piles at Los Angeles Trade-Technical (named gaps 6: lists_not_closed 1, noted_figures_differ 3, noted_section_cut_off 2). Each row's checks
-- become the college load's image of its committed record (load_rows): checks.gaps and checks.confidence
-- added; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s730_lattc_2026-11-25_s730a.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Los Angeles Trade Technical College', '02925', 39054673977, '47d5ed9825f51aa9d8d85f54ade30d7d', 'df1f46dda28f904ad5c64f462c51773e', '2d7a39538198c55e62ded3e5119f277a'),
  (2, 'Los Angeles Trade Technical College', '08479', 39054673977, 'a488693da8687a5a8188010d077f5ce4', '1fe736002e1d233c6440113f37203623', '8ab544d8cdaaa2e0fdd178ac7cd45339'),
  (3, 'Los Angeles Trade Technical College', '08482', 39054673977, '1601b04f133f50cba7e34bc23a1f3c58', '0c5934c1eb7f9cfc19431ea49658eb24', 'baf11d8fcc7110c47f31d617544f3b26'),
  (4, 'Los Angeles Trade Technical College', '21849', 39054673977, '082fdd2c745e2363a570c8bca6552169', '1fe736002e1d233c6440113f37203623', '8ab544d8cdaaa2e0fdd178ac7cd45339'),
  (5, 'Los Angeles Trade Technical College', '21867', 39054673977, '90f5b439968c266c4ed536b1b0fea2af', '207996a2183e53f2b214a6a691e2a012', '2d76578484c9e7225e3040b40524eb58'),
  (6, 'Los Angeles Trade Technical College', '44344', 39054673977, '6f0597f6238960b042e64b27d84b39ed', '88e2495efd06d1573c7fb0fe096e2788', '7416330c64d98f13e81585bc81a81116'))
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
