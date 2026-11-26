-- S739I lane 2's cheap piles at Cosumnes River (11 rows: noted_figures_differ 1, noted_no_total 1, noted_section_cut_off 5, passes 4). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_cosumnes_river_2026-11-26_s739i.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Cosumnes River College', '04596', 39047009824, 'c9a440e9ad28189365c3086c49c7612d', 'ef88a1bbb7f26c387b8cd3fc16c8a90e', 'e56e4f55e2fd2e651d7274ecfc2d45b2'),
  (2, 'Cosumnes River College', '04616', 39047009824, '2e3cb97363686c27030fab3ad66c3595', '9d828dcd6d383355913f95b01f1d73ff', 'ebaa63ab3657ed5575005c0f23eacbb9'),
  (3, 'Cosumnes River College', '15249', 39047009824, 'a03d5d1896d88aa32154d6046d06c370', 'b5e9fe2a8ed8403fbdbe5ac904ebea50', '9a991745acaf92c769602b7300c8a6a3'),
  (4, 'Cosumnes River College', '15326', 39047009824, '9cbaba805fcf9b77a88de03d4734aa7b', '93c390efb1660380701685ea47f4e08d', 'f5584b101bb2bc9c5c62237975af84e0'),
  (5, 'Cosumnes River College', '20153', 39047009824, '1e90d6a5c734484c11d3bae7259b6c35', 'a922f35837c4dbc5156b466accafa1e6', 'd44d9711f22d1d396bfaa0da423b31ea'),
  (6, 'Cosumnes River College', '20197', 39047009824, '9c0c234b939fd3fe5aa4f3a07316b765', '5feab0238af4f1f9a7a0531801a292e2', 'f3356c4d1dd2246d1d5e8acf4175a162'),
  (7, 'Cosumnes River College', '31053', 39047009824, '401f67d14e5c5bd00fcb40d34b055ff9', '35be8585361df8918ed6f88105424d99', 'df81583b76826052db584593a5a884a3'),
  (8, 'Cosumnes River College', '35899', 39047009824, 'e0bfa5ff74f237e16584d009b519c1d2', '5feab0238af4f1f9a7a0531801a292e2', 'f3356c4d1dd2246d1d5e8acf4175a162'),
  (9, 'Cosumnes River College', '39139', 39047009824, '8c006ab0a29179d5e358c29dbf06d405', '5feab0238af4f1f9a7a0531801a292e2', 'f3356c4d1dd2246d1d5e8acf4175a162'),
  (10, 'Cosumnes River College', '39679', 39047009824, 'a457d8b5d03eddfa8ac69704a00fbd59', '13c866bd790d22b0b005822190c82098', 'c3fb8affceed3ba61266792d470851b7'),
  (11, 'Cosumnes River College', '45203', 39047009824, '75ca74f4d560de3b1cf16701ba895bd9', 'd46465eef48acb73397011ebbe03ceb9', '11e04cc636ead1bc2a56dad0326c4173'))
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
