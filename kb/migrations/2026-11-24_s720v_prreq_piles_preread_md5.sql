-- S720V lane 2's cheap piles at Clovis (named gaps 3). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s720_clovis_2026-11-24_s720v.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Clovis Community College', '33489', 44522071814, 'bc61cedf5d1e3ad0816950d9978a4d00', '768b5ffa4426c74c74cd6406935caf7a', '53c4728538a961a906fd37300710b5cd'),
  (2, 'Clovis Community College', '36050', 44522071814, 'e3fcff07c5b7edd496b75923ef202d31', '87ed145c90d3bdd447b147d9c32f7f58', '806a709629975d277dc194df297f1221'),
  (3, 'Clovis Community College', '43015', 39006155986, 'da1aea2f550042a45d7cc12ff9477e50', 'ebd12c758ebab5aaeac4ca39249f2f79', 'f3353f9b852f632ec83d975d6b811f71'))
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
