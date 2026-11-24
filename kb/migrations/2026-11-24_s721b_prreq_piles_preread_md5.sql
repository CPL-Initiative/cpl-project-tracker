-- S721B lane 2's cheap piles at Orange Coast (named gaps 3). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s721_orangecoast_2026-11-24_s721b.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Orange Coast College', '19547', 38670927724, 'e5d0fae56938403c8f6a5ca8f298b1b5', '77ca9f8d75dc2d265a73e519736e92ea', '4e04371fac7891f7908b6a44dff4a713'),
  (2, 'Orange Coast College', '32189', 44747523200, '6a20f08840fafa8f9cb993471c9d8432', '639e2f24726fec0b7145ccbb2fae568b', '8a758d51cc1ab167078bdb300a9b170d'),
  (3, 'Orange Coast College', '35182', 39726645292, '1581b5ba3f34bb3aca5a04e31bd86e6a', '788ee0293bdb78bb388760da1bbc39c5', '0a7d0d96c69af3680fff3c31b8049fb3'))
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
