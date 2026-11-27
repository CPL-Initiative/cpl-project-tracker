-- S741K2 lane 2's cheap piles at Copper Mountain (4 rows: lists_not_closed 1, total_differs 2, units_within_printed_range 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_copper_mountain_2026-11-27_s741k2.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Copper Mountain College', '14710', 45957316339, 'f4c13c85f8c8f1fcc2674142e9bebe03', 'bd1b97cf81260cd984af03c1ca02d88e', 'a61f30381a047ba79f0e1752e5ec5d3b'),
  (2, 'Copper Mountain College', '14737', 45957316339, '4f72736bfd43456c80fc007c25066d56', 'f1275b67c1691d1312d8a0f9272de9d0', 'd9216ba330267d8731ccdeed1d87d09d'),
  (3, 'Copper Mountain College', '20094', 45855512160, '395901ce64f4e0485fba4b444ce7c067', 'f1275b67c1691d1312d8a0f9272de9d0', 'fd8181b87b52cada445ee8948f866b5d'),
  (4, 'Copper Mountain College', '45594', 45957316339, 'b4d9217de661ad44fab1ca77d8e755c3', 'ebd12c758ebab5aaeac4ca39249f2f79', 'c2df7e01acd6731d8882ecbf07de41b3'))
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
