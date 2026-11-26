-- S739D lane 2's cheap piles at Santa Barbara City (3 rows: lists_not_closed 2, pair_read_as_alternatives 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_santa_barbara_city_2026-11-26_s739d.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Santa Barbara City College', '19012', 38670933359, '96559441e112f571cf1d731e75792a1b', 'df1f46dda28f904ad5c64f462c51773e', '6434bfe56c0f6e51af755d307dec125c'),
  (2, 'Santa Barbara City College', '45452', 39782741424, '0eb404319c960b6a904ef7df3b7fee7d', '39747decba62d1a4fc97e2e52cd92e81', 'e230e040c26516ab56d95507939b5641'),
  (3, 'Santa Barbara City College', '46520', 38670933359, '6552a345b0584c142ca8f13d8ff22e16', '373967db51ec6f7d68777f88776b6b17', 'ee4a74bddfe6294a87567422a958820c'))
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
