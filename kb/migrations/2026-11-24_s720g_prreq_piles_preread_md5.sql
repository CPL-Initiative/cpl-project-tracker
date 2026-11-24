-- S720G lane 2's cheap piles at Glendale (named gaps 2). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s720_glendale_2026-11-24_s720g.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Glendale Community College', '32607', 44763682085, '62b99169b8a06b5be7ca7a79d58d170e', 'db490ca8012a7848af424ef80ddf2930', 'd79ffe98741521b5bc89b561857208b1'),
  (2, 'Glendale Community College', '36416', 43415972509, '4f0dfe101ffa29b453be771b1214dcdf', 'c59940d88ccdbd2a63fe18ec194066c9', '9350e4f3865df86a9e7f811b70b0b58f'))
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
