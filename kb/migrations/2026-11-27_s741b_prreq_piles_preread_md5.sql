-- S741B lane 2's cheap piles at Orange Coast (4 rows: noted_figures_differ 1, passes 3). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s741_orange_coast_2026-11-27_s741b.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Orange Coast College', '08628', 38843379313, '09847101172dccce74d22e7b063fb112', '6914789d7433515b115a28cf10b0d645', '2c8db1a46fbe242c75e7aee0e3c4dfff'),
  (2, 'Orange Coast College', '08664', 45858495107, '0323267972faad6d53014b2fbecf2cc7', 'ebd12c758ebab5aaeac4ca39249f2f79', '38668794711474e4a49528c1aef71921'),
  (3, 'Orange Coast College', '19473', 38670927724, 'b2dd545cb5601997cb717152265d2da7', '4fda625e79bb6947c750abfd135f9573', '0cd7b60aaa7473943434ea5064ba984c'),
  (4, 'Orange Coast College', '19474', 38670927724, '392d766359ac2ce57d33dc3c91decaa7', '699c8989263e6f5b8909783cf1c7d642', '4e3ebc0fda8804787e65da4f6b18be01'))
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
