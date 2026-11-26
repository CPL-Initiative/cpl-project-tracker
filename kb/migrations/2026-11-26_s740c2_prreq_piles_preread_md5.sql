-- S740C2 lane 2's cheap piles at Solano (3 rows: noted_figures_differ 1, pool_figure_not_read 1, total_not_printed 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_solano_community_2026-11-26_s740c2.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Solano Community College', '06559', 39037377728, 'c4df5c2b451cdcc83014244cd93732f3', 'dfde00127a538f508c28565d7c2b6fb6', '643d575ffd354c67a0cb3b8b7a0928ca'),
  (2, 'Solano Community College', '32917', 44514080886, 'cac7f5c739fbe5ab9ba3263ef8e5c9e2', '8dc221891dfaa4e8541ab15921095f8c', '787d5ee32a9df03e6c3f6a8c61d7c25e'),
  (3, 'Solano Community College', '37919', 39037377728, 'ba5ced16e1db1b0c744e1e4ecde18d74', 'ebd12c758ebab5aaeac4ca39249f2f79', '1c4d9dae110299df450dfc1df87d169a'))
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
