-- S714O: the 9 records at other colleges option_parts moves to passing (#3714's reach). Each row's checks
-- become the college load's image of its committed record (load_rows); the record itself is unchanged.
-- Receipt: kb/receipts/program_requirement_records_piles_optparts_2026-11-23_s714o.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Foothill College', '06047', 38675242638, 'bcf2433fc97a850e472d4f8f2d83f633', '25acd79e4a8f8b03f07e813a19f58414', '6b64dc27fff5fbb029deb527274429f2'),
  (2, 'Glendale Community College', '24042', 43415972509, 'eebbdbfa76e4d85274a3661c904437e1', 'c34a5582e6c0a6741c6da26def4a4775', 'a8f3887ec5d8170d8c248ce221c51573'),
  (3, 'Golden West College', '18423', 39688079435, '3101bbcc571e20ef2b5bf3089152e9ff', 'dd0e3718f0cc4fde4db70ac5ba05d7e1', '14f289d8d273f880bab16ec05582a833'),
  (4, 'MiraCosta College', '18345', 38748842603, 'fb706afabd7daab76da8d41f75a2e7a8', '7ac5cb2e725612f15f2560620a3266ac', 'caf00c72ba4f8eb7fd6594e3a1f15159'),
  (5, 'Monterey Peninsula College', '03653', 41276977991, 'b9aae293b46feffaa59c1003a9f58a6c', '3c81834a38a33a73170c8fc53655fda9', '279c9a68d28e4b814ce5679cf3fb61b5'),
  (6, 'Monterey Peninsula College', '22098', 41276977991, 'b742af1bff5c32209461b3c5bbd88cd5', '3c81834a38a33a73170c8fc53655fda9', '279c9a68d28e4b814ce5679cf3fb61b5'),
  (7, 'Reedley College', '01773', 39616074283, '89bf81ef036996fb3d044da9a9e1b6ca', 'a0b064d96be523a34ceed3ec24054f2f', '10832ff3698b3d773808ff3f550efca0'),
  (8, 'Reedley College', '18990', 39616074283, '4060176dd1dce7d069fa2439e7f336d1', 'a6167bd981d5703e38a22ea38e0e88e4', '387c8b277ab26486061b8517b7feca82'),
  (9, 'Reedley College', '46449', 39616074283, 'c6be931b95ccc2569252f4230c933345', '025f5967e09072e40425565d0b8c2cce', 'f0c8a700c3212e0431147df49206ae06'))
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
