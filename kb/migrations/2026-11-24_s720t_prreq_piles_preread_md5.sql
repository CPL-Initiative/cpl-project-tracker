-- S720T lane 2's cheap piles at Ventura (named gaps 5). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s720_ventura_2026-11-24_s720t.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Ventura College', '06957', 38756014587, '92ca3f407fd7991d2ce7d1e6132a31fc', '39747decba62d1a4fc97e2e52cd92e81', 'd35baa903dd37a7c76e698c4d991853b'),
  (2, 'Ventura College', '20576', 38756014587, '2cc7e5378f748ce0c13dac3027190cd2', '39747decba62d1a4fc97e2e52cd92e81', 'dd3be177675d4331b44b8247ee2eb19e'),
  (3, 'Ventura College', '31455', 38756014587, '4a443e8712d936db12c06934de6e440c', '3e096e5d8483d0570dfc23bf65a968b0', 'dcb40d2ee02b6f84d56ffd06d3a4a163'),
  (4, 'Ventura College', '32054', 38756014587, '9fb535af65ec7ce9b6e9f83ebfd709c9', 'c59940d88ccdbd2a63fe18ec194066c9', '15a7f2dad7537a32a60a0768cfd0bf98'),
  (5, 'Ventura College', '45731', 38756014587, 'cf503bb86114461f70c3374d516becc9', '3e096e5d8483d0570dfc23bf65a968b0', 'c0dcfe17353884e11b9535558d89f1d4'))
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
