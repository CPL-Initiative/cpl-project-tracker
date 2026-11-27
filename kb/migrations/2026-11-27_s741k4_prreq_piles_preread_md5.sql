-- S741K4 lane 2's cheap piles at Solano (3 rows: total_differs 3). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_solano_community_2026-11-27_s741k4.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Solano Community College', '30184', 39037377728, '40cf5ce30b3d7d293b46347d00ab091b', '608207fd06d305c892c32e21b82a6227', 'ecb326d5275f8b02ffc2873aa9d42f66'),
  (2, 'Solano Community College', '30185', 39037377728, '63e11fd5b3e0d2b0fea5efd9dbecc487', '608207fd06d305c892c32e21b82a6227', 'ecb326d5275f8b02ffc2873aa9d42f66'),
  (3, 'Solano Community College', '38591', 45840125172, '000f7a7f216734498309e63d55c92a0a', 'f2a219eaa2a3d9bc1bfeff8ab0688788', '63f36717532dcca9e4f005a822afa916'))
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
