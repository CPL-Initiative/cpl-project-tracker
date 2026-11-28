-- S748R2 lane 2's cheap piles at Sierra (4 rows: noted_no_total 1, noted_section_cut_off 1, pair_read_as_alternatives 2). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s742_sierra_2026-11-28_s748r2.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Sierra College', '33639', 39709837031, '89ff486f92b11e32f55c96a077887d31', '972ce3267c8b9670b117327200b82b48', 'f976c1fac03205355fefb17aec6eeede'),
  (2, 'Sierra College', '33646', 39709837031, 'b4defbbd700549dffbb928a140190eb0', '88e2495efd06d1573c7fb0fe096e2788', '6dbb25ad7129c0a8e142193040d469f9'),
  (3, 'Sierra College', '36718', 39726642315, '5c5ff66fcffa4d17f6d45550f74c0b19', 'e6dc2db0903ea1bdee923dfafbc1258b', 'd1e72d6710f94cf70bdc2613a7f458eb'),
  (4, 'Sierra College', '39209', 39726642315, '39464c1c49cf03e288bf8a8ce039bb23', '879f0a7c64b3d6a14abe899e2924556d', '2405bab10276685e835e5dcfa853d147'))
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
