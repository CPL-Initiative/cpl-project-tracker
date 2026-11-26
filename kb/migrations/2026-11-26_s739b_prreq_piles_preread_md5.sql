-- S739B lane 2's cheap piles at Shasta (12 rows: double_count_noted 1, heading_not_in_text 2, nested_award_not_read 1, noted_figures_differ 2, noted_total_cut_off 1, option_lists_read_apart 1, pool_figure_not_read 4). Each row's checks become the college
-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or
-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: kb/receipts/program_requirement_records_piles_s739_shasta_2026-11-26_s739b.json
-- (before_image per row).
-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text
-- (the full before-values, the fallback where a hash does not match, are in ..._preread.sql).
with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values
  (1, 'Shasta College', '09501', 39006384701, 'b874ae294a5680bd56290f98297cc32f', '788ee0293bdb78bb388760da1bbc39c5', '1ca1bd21d62b73834f866cd0cc07a707'),
  (2, 'Shasta College', '18080', 44513230805, 'e9a0c574bffaec682a4099f5752b9af0', '9ae35f340d5c6557650d0d609f177b66', '6419b8fbb2ca9ec16bcd75253d49069d'),
  (3, 'Shasta College', '18087', 39006384701, '9177d5d9d3c40a10c6721f70d3318d6b', '8fd0a9378506bd00405b5cf1ecb0628d', 'f9d154307659d8a1f2ac22f051ec58c3'),
  (4, 'Shasta College', '18098', 39006384701, '9b4f5841c30c3425ddb01992883ad321', 'f891cc586ee09794115d099526c5e94d', 'fe01e3c4bc385054dc5ef886980525bb'),
  (5, 'Shasta College', '18143', 44513230805, '53766b5a92c294a937dadeb9f1322a63', '2162fd293221ee16cb456fedc91fc3b1', '09ee3a2b8a5a29105a299865a863f31d'),
  (6, 'Shasta College', '18144', 44513230805, '4ab53039041ec9cf5798d8b15053cd11', 'a9208d50cf52baadfde251672e6dc3ec', '41edbeb2a7d1a2f3c2a9507ab7f68cb0'),
  (7, 'Shasta College', '18626', 44513230805, 'fd2a9371222a9f9dce5699ef6e6e8214', 'f4a5ab67bdd0ae9eff7b23f13172bc2e', '2da55e06efeb957fd6cf279bf07cb118'),
  (8, 'Shasta College', '18659', 44513230805, '4eb2dc22abef84b4bf66e080b958764a', '4d48c3ada2e021af9144eb8b295e3d85', '37e047a5c1f6435e5718a82548d4b074'),
  (9, 'Shasta College', '31845', 39006384701, 'd1aee0b8f14b387f58260c8ce82fbe6d', 'ebd12c758ebab5aaeac4ca39249f2f79', 'f94a4ca9b7675b6c0b89ca5193a413c9'),
  (10, 'Shasta College', '34005', 39006384701, 'ba7a282eb6e07fbce596d34f7f62a69a', '972ce3267c8b9670b117327200b82b48', 'e66db4e77d68e1838d9a649b558d17d8'),
  (11, 'Shasta College', '35606', 39006384701, '7b55834bb7a2c5fa5a79ad3573ef1fa0', '63bb1716563187017be2c4ba1619b459', 'a9309cdd837d651bcab359ed21b12f6f'),
  (12, 'Shasta College', '43618', 39006384701, 'b3e667e293ddf61b912c6d4e312a2f2d', 'b76acd785dbc59227502ae4e04690d0b', 'e8c5e0bdf4858419ddce5d2998d890d5'))
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
