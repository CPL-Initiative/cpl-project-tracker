-- S490 (SkyGooseberry), 2026-10-26. Sam's Open Asks Sheet 131 card 2 (move, 14:56Z): the twelve college CPL Opportunity
-- visuals link the page's new home, library/cpl-opportunity/?college=. Applied only once Pages serves that page (the merge of
-- the move), so no public link points at an address not yet served; the old cpl-opportunity/ address forwards meanwhile.
-- Rule 10: guarded UPDATE on each row's url and updated_at as read live at ~15:05Z. rows_updated < 12 means someone edited
-- a row: re-read. Before-values (url, updated_at), all updated_by library-made-for-s459@bot except Riverside City (Sam):
--   cpl-opportunity-american-river-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=American%20River%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-bakersfield-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Bakersfield%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-cerritos-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Cerritos%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-foothill-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Foothill%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-moreno-valley-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Moreno%20Valley%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-norco-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Norco%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-rio-hondo-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Rio%20Hondo%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-riverside-city-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Riverside%20City%20College, 2026-10-24 13:44:24.758677+00
--   cpl-opportunity-san-bernardino-valley-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=San%20Bernardino%20Valley%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-san-joaquin-delta-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=San%20Joaquin%20Delta%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-santiago-canyon-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Santiago%20Canyon%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-sierra-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Sierra%20College, 2026-10-23 22:14:22.319777+00
-- ROLLBACK (cpl_library_history_trg files each prior row either way):
--   update public.cpl_library set url = replace(url, '/cpl-project-tracker/library/cpl-opportunity/', '/cpl-project-tracker/cpl-opportunity/')
--     where slug like 'cpl-opportunity-%-visual' and updated_by = 'S490 SkyGooseberry';
-- A good result: 12 rows read the new address.

update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=American%20River%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-american-river-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=American%20River%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Bakersfield%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-bakersfield-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Bakersfield%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Cerritos%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-cerritos-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Cerritos%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Foothill%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-foothill-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Foothill%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Moreno%20Valley%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-moreno-valley-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Moreno%20Valley%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Norco%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-norco-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Norco%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Rio%20Hondo%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-rio-hondo-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Rio%20Hondo%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Riverside%20City%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-riverside-city-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Riverside%20City%20College' and updated_at = '2026-10-24 13:44:24.758677+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=San%20Bernardino%20Valley%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-san-bernardino-valley-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=San%20Bernardino%20Valley%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=San%20Joaquin%20Delta%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-san-joaquin-delta-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=San%20Joaquin%20Delta%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Santiago%20Canyon%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-santiago-canyon-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Santiago%20Canyon%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Sierra%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-sierra-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Sierra%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
