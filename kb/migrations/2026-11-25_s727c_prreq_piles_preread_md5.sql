-- S727C lane 2's cheap piles at Shasta (4 rows: lists_not_closed 2, noted_no_total 1, noted_section_cut_off 1). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added;
-- the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s727_shasta_2026-11-25_s727c.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Shasta College', '09113', 39006384701, '4e0fc9fe403159296b593e246b062632', 'a38eb70cb7ae3d1e0ec60d82a9723400', '5347c3b4b1995df6c28d6b82f92c32eb'),
  (2, 'Shasta College', '35607', 39006384701, '768288f44db8fb679adac4047c26ad09', '63bb1716563187017be2c4ba1619b459', '87814fa2bd3f74ab58f38bac4764accb'),
  (3, 'Shasta College', '37774', 39006384701, '744f42ba54d943b24d2ea1f1b1c127fe', '3e096e5d8483d0570dfc23bf65a968b0', '413bde22ba89286fc3574a18e9eb7703'),
  (4, 'Shasta College', '45360', 39006384701, '565711386d2e6b67c7a5c1e86661ef55', '42ce122bedf00f4a89ccfe2c26085ed3', 'eb55ee90bbd6ad2fc6d5f29f4032fef0'))
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
