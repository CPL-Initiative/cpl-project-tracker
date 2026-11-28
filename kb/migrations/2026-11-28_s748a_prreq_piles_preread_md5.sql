-- S748A lane 2's cheap piles, one plan over Butte, Santa Barbara City (2 rows: noted_section_cut_off 1, total_differs 1). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added,
-- or checks.arithmetic to equal for a rescore; the record unchanged. Receipts (before_image per
-- row), one a college:
--   kb/receipts/program_requirement_records_piles_s748_butte_2026-11-28_s748a.json
--   kb/receipts/program_requirement_records_piles_s748_santa_barbara_city_2026-11-28_s748a.json
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Butte College', '14583', 46012628995, '4e49ee3bacf066d7d63bbc565f401cbd', 'eaeecba98a269e444b59f4123fb3d9ff', '0f7e95524c1f7f30b0f1b004591eb1d5'),
  (2, 'Santa Barbara City College', '43553', 46010148668, '080a2c6ff4806079e914be3af49ba7e7', '0c06d3cfcafd18909178659c790b6588', 'e3c4e05f72f487a97f98c5678473de0b'))
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
