-- S739N lane 2's cheap piles at Ventura (7 rows: lists_not_closed 2, noted_no_total 2, pool_figure_not_read 1, prerequisites_counted 1, unit_line_not_read 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_ventura_2026-11-26_s739n.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Ventura College', '06973', 39622549965, '97100dac5268197097fe9eb3828c8304', '8a8a131b7a421d5bb4f8f0d8eb46c633', 'efcd93f46e63d4e6b23176034a0d445c'),
  (2, 'Ventura College', '20599', 38756014587, 'e0d175eb85a722a5733e3347c682c4f7', '28fe8359ce34d55f70db89736ab84e6a', 'f3a8ba33d8730dbfa79b6f3a797b6108'),
  (3, 'Ventura College', '32834', 39622549965, '2be6dd2cf9deb61ea6d07f79747b87c8', '3e096e5d8483d0570dfc23bf65a968b0', 'dcb40d2ee02b6f84d56ffd06d3a4a163'),
  (4, 'Ventura College', '39961', 39622549965, '4dcf3e4a2926b52cce59782913718ecf', '45ae831dcc33f804e8d358422e3f2514', 'bf5726831d55d444ffb0efa71ac62ef7'),
  (5, 'Ventura College', '39995', 39622549965, 'c14b10a19ab7ca2e8dcec2b3e3cec52f', '972ce3267c8b9670b117327200b82b48', '75d5a312c9523e2789ebde69c6aa1020'),
  (6, 'Ventura College', '42967', 38756014587, '2c2f2eb05697ffb7acb7b025ae41b4d8', '5c9222670e1257a3f0aaa9ed33420bf4', '0329c30c05f0a5a595bcf74eab4a97ba'),
  (7, 'Ventura College', '45427', 38756014587, '824de8f96b067572f812f79fe70afe5a', 'ff0824422e219dcfb156c2b1d7038ba8', 'f9b90dee23739d941c7888e457996765'))
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
