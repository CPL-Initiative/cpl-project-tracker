-- S742A lane 2's cheap piles, one plan over Santa Monica, Butte, Cabrillo, Gavilan (4 rows: degree_electives_not_printed 1, lists_not_closed 2, total_differs 1). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added,
-- or checks.arithmetic to equal for a rescore; the record unchanged. Receipts (before_image per
-- row), one a college:
--   kb/receipts/program_requirement_records_piles_s742_santa_monica_2026-11-27_s742a.json
--   kb/receipts/program_requirement_records_piles_s742_butte_2026-11-27_s742a.json
--   kb/receipts/program_requirement_records_piles_s742_cabrillo_2026-11-27_s742a.json
--   kb/receipts/program_requirement_records_piles_s742_gavilan_2026-11-27_s742a.json
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Santa Monica College', '21026', 44739378155, 'c7f7a8bb342b02bf6ffebaa3431bf8ee', 'f61818b42c814e08375c21e81c36f31e', '46c0a47ef952fe78f7e47f03bec34a84'),
  (2, 'Butte College', '01312', 42973457189, 'df62afee50fd910970ca1326ebb3f7f6', '972ce3267c8b9670b117327200b82b48', 'a7bacbc308c053d81bea939fe09b47d6'),
  (3, 'Cabrillo College', '45306', 44090886950, '4bbb358bf90f6a89e861e4baba488d4b', '1fe736002e1d233c6440113f37203623', 'a42d2eba881fa5eea0ccb5f7fdf8c67d'),
  (4, 'Gavilan College', '08464', 44090922437, '17196e0630a07299dff58db39722d77b', '8926426dd47da7a3a6f8d8322e69adfc', 'a968db5bcc5dc6125034b4a76c46bb5e'))
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
