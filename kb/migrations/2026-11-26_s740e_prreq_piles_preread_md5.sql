-- S740E lane 2's cheap piles at El Camino (4 rows: noted_figures_differ 2, noted_section_cut_off 1, required_list_outside_total 1). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s740_el_camino_2026-11-26_s740e.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'El Camino College', '02518', 45768189197, 'c32e5c1145d4599a175898d4797151b8', '35be8585361df8918ed6f88105424d99', '772d338ff15c33eb61d8c741f2693be2'),
  (2, 'El Camino College', '02520', 45768189197, 'edfcae331ab44307f85519c38e7a65bc', '3c81834a38a33a73170c8fc53655fda9', '72319ccae9f9086f8d8b7fa785c117ae'),
  (3, 'El Camino College', '15251', 45768189197, '3f21462ec4955039c9c5263e16559619', 'be095b039bb1c195485474eb04b82f58', '2b3ecdc86323008ad2598e5e07286d70'),
  (4, 'El Camino College', '45290', 45768189197, 'ffe9e6ddb76af0f860d72815420c46f4', '3bf93036a8e04f96059bdb618ab990d9', '15a76de2ae6d07680daf59111c11a267'))
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
