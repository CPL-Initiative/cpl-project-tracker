-- S730B lane 2's cheap piles at Saddleback (8 rows: option_lists_read_apart 4, waived_course_counted 4). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s730_saddleback_2026-11-25_s730b.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Saddleback College', '04069', 38843470509, '5df9dead8ef40a514846819769ae875d', '788ee0293bdb78bb388760da1bbc39c5', '1a3c48f2d2edef158bb6740a9a4ee635'),
  (2, 'Saddleback College', '22874', 38843470509, '8ec9fdb55fda0f42cd603676b3821077', '788ee0293bdb78bb388760da1bbc39c5', '1a3c48f2d2edef158bb6740a9a4ee635'),
  (3, 'Saddleback College', '30206', 38843470509, '7b939b572e3a7aa3f20d4de27cb7c0d3', '768b5ffa4426c74c74cd6406935caf7a', 'd56104a058c9534e4c6eece250f28c17'),
  (4, 'Saddleback College', '30207', 38843470509, '7283f324a116ef114ad0c07b37d66b66', '768b5ffa4426c74c74cd6406935caf7a', 'd56104a058c9534e4c6eece250f28c17'),
  (5, 'Saddleback College', '36628', 38843470509, '9dd927d9df03ab43fb77e3b992dfc28a', '897e9d98f5dff29a26f594ef0a136245', 'e7a6a2339fc376817c6c870fa95060df'),
  (6, 'Saddleback College', '40322', 38843470509, '1cef26e705a65329a5696553a2005447', 'd2b6fcfb6953124b2f0584dbf2bd644b', 'fc2bbb3545a8d6112bb14b8a46a31dc7'),
  (7, 'Saddleback College', '41673', 38843470509, 'cc19945dd52ce27aae13383876bc75ed', '6670455651f81e1d04b6fdc803860ecc', 'd6af6d62962a78058fc5c9b6299bbc8d'),
  (8, 'Saddleback College', '41674', 38843470509, 'c134ef6d3c302c17a34f466a84575182', '6670455651f81e1d04b6fdc803860ecc', 'd6af6d62962a78058fc5c9b6299bbc8d'))
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
