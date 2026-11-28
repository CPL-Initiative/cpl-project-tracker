-- S748K1 named gaps over College of the Canyons' re-read run 44886816990: no_hours_read 3 (38686, 44273 and
-- 45610, the rows load 44887749460 inserted). Receipt:
-- kb/receipts/program_requirement_records_named_gaps_2026-11-28_s748k1.json (before_image and after_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'College of the Canyons', '38686', 44886816990, 'ae025d42a01a743d5981f382cc9a3042', '0c5934c1eb7f9cfc19431ea49658eb24', '679683cd931ac5206a96fd33e5e24734'),
  (2, 'College of the Canyons', '44273', 44886816990, 'dd5c1f7c4ea06cb07f62168c6d2ee479', '1764792b6a0d11325ab143e17f066d82', '274c368c6f465cb209975c68432d1bcb'),
  (3, 'College of the Canyons', '45610', 44886816990, 'fb3f7b92e1d59f45f211b1e4d3e2d318', 'eaeecba98a269e444b59f4123fb3d9ff', 'a5b1107e4e5804558a91d9c3bdf82b2d'))
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
