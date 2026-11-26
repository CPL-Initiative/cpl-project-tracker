-- S739A lane 2's cheap piles at American River (5 rows: heading_not_in_text 2, option_lists_read_apart 2, unit_line_not_read 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_american_river_2026-11-26_s739a.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'American River College', '07207', 39047245752, 'c8442f4b7aa42313a461334c47cf0dfe', '5c9222670e1257a3f0aaa9ed33420bf4', '441452aca0d2acbf9b4848791d5c623f'),
  (2, 'American River College', '12191', 39047245752, '6aca1763dd188d6921f83819d39e30ac', '3e096e5d8483d0570dfc23bf65a968b0', '585754dabd72d745c8ebfa201980cfb7'),
  (3, 'American River College', '12238', 43212067552, '3fdb009fab22981f69d21723cafb5a86', '077c543235a78b9caa6fc4c1d7d724e9', '60a446653c149e0869e5e75029c8c675'),
  (4, 'American River College', '30595', 44535418752, '70ee04fdf2e5fb3251b12be1b98cba00', 'f5efa18d44bd2bf4e67bc370af368ca3', 'b581305919be1d9279a362d262d9b681'),
  (5, 'American River College', '39341', 39047245752, '8f5ad279d7b8c9413022f0193b3cf7f2', 'db490ca8012a7848af424ef80ddf2930', 'b6dadd805daa53b0a27695f0d9f7d8ca'))
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
