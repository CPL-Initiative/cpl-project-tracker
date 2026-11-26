-- S739L lane 1's lever: two held records collected with named gaps (2 rows: noted_figures_differ 1, option_lists_read_apart 1). Each row's checks
-- become the college load's image of its committed record (load_rows): checks.gaps and
-- checks.confidence added; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_lever_2026-11-26_s739l.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Cosumnes River College', '33542', 39047009824, 'a6b659240566077c134101c17dde573f', '63bb1716563187017be2c4ba1619b459', '9e3e0eef4a56e5d1bc8efdfb6dfcbaac'),
  (2, 'East Los Angeles College', '33013', 43357061643, 'e60e92a0961d107d068ac31962a74cbc', '841d9b4ca1b4eaf2c4395d3fefcb8b7e', 'c0ebf250e952cf3c4cacc417d6b9cc9e'))
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
