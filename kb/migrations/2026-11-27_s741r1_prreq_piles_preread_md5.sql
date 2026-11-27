-- S741R1 lane 2's cheap piles at Norco (5 rows: ge_units_not_read 3, noted_figures_differ 2). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_norco_2026-11-27_s741r1.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Norco College', '32830', 45964327019, '6d093daccaa5a802a8187b1603e46642', '5c0fc2afacf0e20b40c9d9cf6243a8cb', '48b5847653f30e082cfde15f62c99bc3'),
  (2, 'Norco College', '37311', 45964327019, 'a12bc962a4ece71d3a3374ececd9f336', 'e45cef76177bad42e9f8ebf85bb96c71', '6891e80ca51949a7ea291fac2af108bd'),
  (3, 'Norco College', '44961', 45964327019, '7736b4b6f1ea6634e5212bf6cc00b25c', '29acf0e1d36576f4566eec317ad5b059', 'ec098aff557389dc0bb75e6dd794019f'),
  (4, 'Norco College', '39998', 45964327019, '66beaa5a8e0bdc9e4a90fec6b6ce496f', '6670455651f81e1d04b6fdc803860ecc', '22e405c17a208085a2215898212ec00c'),
  (5, 'Norco College', '40064', 45964327019, 'bd451826158b9819f2dad392c22864f8', 'b167e014df6b97bdebba96ca16afce51', '1704d8e783359e43b3731a6af7bb1db8'))
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
