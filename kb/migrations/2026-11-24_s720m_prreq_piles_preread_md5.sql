-- S720M lane 2's cheap piles at El Camino (named gaps 14). Each row's checks become the
-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the
-- record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s720_elcamino_2026-11-24_s720m.json (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'El Camino College', '02495', 38631686677, '65d6095d7e32b0484e447857e2e0d3fd', '066c6dedca8b22220d8dc1fc5b6ce86b', '0f42f13960e322df793984aef8de8e3d'),
  (2, 'El Camino College', '02512', 38631686677, '98b405bb03f1243a0dba356d3dd56501', 'bf0b08614c48b26e005ce2a787175930', '5d51ebab9a8f8997bcec1575f1c3c5b4'),
  (3, 'El Camino College', '02513', 38631686677, '2bbb5d8bf4da76a3c6c84f4446b964c4', '83af01c930a939f9e492f3b21bf14c58', 'beea69e2f359de21bbafb3a5a342ee28'),
  (4, 'El Camino College', '02515', 38631686677, '8aa71ce1c21de0955cd3e0c8ac52d482', 'f962b0bbf921cbdb30c89613ec327677', '55a87978da757dbe1badd837659226bf'),
  (5, 'El Camino College', '02517', 38631686677, '706ea847c6fe92ea8ff65a5b4d12c82e', 'bea5ef4a59d1bdcbf732a9740c8411f7', 'deb0b71ca159c4631fee4eef68e1fb77'),
  (6, 'El Camino College', '02519', 38631686677, '063a6b8c5590a4e38d316221de921907', '788ee0293bdb78bb388760da1bbc39c5', '08c927804f67aec5ed5768bf49ac1477'),
  (7, 'El Camino College', '02524', 38631686677, '0c37a735a3a88ed17279a99cc0ccf722', '283ada5dfebf21dc24fe44ee33199470', '75431ca47fc07ead559987042959ef52'),
  (8, 'El Camino College', '02528', 38631686677, 'fd1ced62888585f2121389f6e5ecf86d', 'db490ca8012a7848af424ef80ddf2930', '32daf3bef96a5614d2081ddbdde333b9'),
  (9, 'El Camino College', '02538', 38631686677, 'c89cf6ec3924d485104b5a6bbcde00bd', '3c81834a38a33a73170c8fc53655fda9', '5417c33a6cd7a6ab1d5512f14ad0af80'),
  (10, 'El Camino College', '02544', 38631686677, '4d40ab211d8e04231ab667d5ab02a32d', 'f1275b67c1691d1312d8a0f9272de9d0', '077d9561f737643b51a7e14460a7f264'),
  (11, 'El Camino College', '19892', 38631686677, 'a94baf9d3385160a79c8a8c215176096', 'f1275b67c1691d1312d8a0f9272de9d0', '8ee7ebfff5106f5e8a5519a65661d883'),
  (12, 'El Camino College', '32238', 38631686677, 'b5877a231794214e383b2b1751a98de8', 'c34a5582e6c0a6741c6da26def4a4775', 'd950dec8df23fb125bbb9c90d71d45d0'),
  (13, 'El Camino College', '38839', 38631686677, 'a824416cf64ff0ba573bacc897bcbdb2', '972ce3267c8b9670b117327200b82b48', 'b98eb11377ec5a89e15b2cf7ab558ea1'),
  (14, 'El Camino College', '43992', 38631686677, 'dcdeda05002a0e1e8eb3055c1b5db58b', '63bb1716563187017be2c4ba1619b459', '2cc5720814e7fc5a254f86b010497170'))
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
