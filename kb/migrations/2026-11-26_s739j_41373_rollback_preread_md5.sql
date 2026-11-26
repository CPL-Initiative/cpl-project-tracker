-- S739J, Orange Coast 41373 alone: s739j's rollback limited to the one row (its values line is s739j's own,
-- kb/migrations/2026-11-26_s739j_prreq_piles_rollback.sql row 3). Why: its 29 sits inside the printed 28-29,
-- so noted_figures_differ's sentence is not true of it (d-lists-gap-holds-range-sums-s703; S739's reader).
-- Receipt: kb/receipts/program_requirement_records_piles_s739_orange_coast_2026-11-26_s739j.json.
-- Compact pre-read for the rollback, read-only: one SELECT, one JSON value; md5 of each image's jsonb text.
-- The rollback writes only where the row holds the after-image, so a clean reading is: listed 1, on_run 1,
-- record_is_before 1, checks_is_before 0, already_after 1, checked_now 0.
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (3, 'Orange Coast College', '41373', 38670927724, '7deec0fe2ae7bb500e75e4fcf8aba3df', '3c81834a38a33a73170c8fc53655fda9', '5417c33a6cd7a6ab1d5512f14ad0af80'))
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
