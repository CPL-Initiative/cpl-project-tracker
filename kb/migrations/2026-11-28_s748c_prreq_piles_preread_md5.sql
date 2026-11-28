-- S748C lane 2's cheap piles, one plan over Orange Coast, Fullerton (3 rows: passes 3). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.coverage to true and nothing else
-- (the unexplained course is explained by the capture: the page does not print it); no gap filed;
-- checks.invented, checks.arithmetic and the record unchanged. Receipts (before_image per
-- row), one a college:
--   kb/receipts/program_requirement_records_piles_s748_orange_coast_2026-11-28_s748c.json
--   kb/receipts/program_requirement_records_piles_s748_fullerton_2026-11-28_s748c.json
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Orange Coast College', '43100', 38670927724, '89fe2ed77d01d214eb964b1fec2f9c9a', '4f7be67bde43dcb1870a77b2f9e200c8', 'fe42d362d97db8c2d9ee4d2a0789a541'),
  (2, 'Fullerton College', '18749', 38675136988, '3842ace01d5117a6f6c1a395e97527e9', '4f7556740be0952a0eb5d1f59eca94c5', '37d01ebd1c493a4fcd3089d45a9c95cb'),
  (3, 'Fullerton College', '36863', 38675136988, 'a495c1722bbcd82b7185be4feae293e3', '66a2a452052b140c168ab9e1202fce5d', 'b62f467877785d3011a93dde7e2ca769'))
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
