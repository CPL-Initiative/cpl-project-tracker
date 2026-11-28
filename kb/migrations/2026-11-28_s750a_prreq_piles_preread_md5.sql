-- S750A lane 2's cheap piles, one plan over Citrus, College of Marin, Foothill, Irvine Valley, Palomar (7 rows: passes 7). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.coverage to true and nothing else
-- (the unexplained course is explained by the capture: the page does not print it); no gap filed;
-- checks.invented, checks.arithmetic and the record unchanged. Receipts (before_image per
-- row), one a college:
--   kb/receipts/program_requirement_records_piles_s750_citrus_2026-11-28_s750a.json
--   kb/receipts/program_requirement_records_piles_s750_college_of_marin_2026-11-28_s750a.json
--   kb/receipts/program_requirement_records_piles_s750_foothill_2026-11-28_s750a.json
--   kb/receipts/program_requirement_records_piles_s750_irvine_valley_2026-11-28_s750a.json
--   kb/receipts/program_requirement_records_piles_s750_palomar_2026-11-28_s750a.json
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Citrus College', '02333', 38675245799, '155273f2ec0e73599db2332c56f9efe3', '83361826328535cbea8a31c81ef33804', 'c3a84d84649755197b790d9aa50f7391'),
  (2, 'College of Marin', '46242', 38984695817, '53c60b86771a0091e78ce3eb1d70ad18', '8ab7468642d8d04708cb0762524adbfe', '0f64d153f27e83e0d383623df5f0d1a2'),
  (3, 'Foothill College', '11827', 38675242638, '374c3ce191030e931c89a926222f8236', '005bb03e2ebe6156b839ec62cbef160c', '5eb15ca1835b239b4dd6c944a20edd02'),
  (4, 'Foothill College', '43194', 38675242638, 'e4d2577a68d4914aa099b7986139d688', '45fb112fa3bcaa617209743a1b48e6ab', '0fbb61a6bbd8f45ffbdaede5a84a0423'),
  (5, 'Irvine Valley College', '44922', 39539599944, '1d845393f357f119034be200a2e0ba1d', '5fcffca355356462795d87e59f7f40ad', '920df90d7dea1fc11cbfdbb3d56302bd'),
  (6, 'Palomar College', '08929', 38843467865, 'fe906fd2d2bea94ed03222933d2704a3', '969c876353a42e1ef250039d54fca353', 'de98a02790d141f8946da4d233ecc58f'),
  (7, 'Palomar College', '22528', 39746422049, 'c8ddf8ad99e7883983b8e6ffde3e0d70', '969c876353a42e1ef250039d54fca353', 'de98a02790d141f8946da4d233ecc58f'))
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
