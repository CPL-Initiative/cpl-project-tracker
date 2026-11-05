-- Rollback for 2026-11-05_library_cpl_initiative_overview.sql (SkyFlipFlop): remove the record this cohort added,
-- only while no one else has edited it.
delete from public.cpl_library where slug = 'cpl-initiative-overview' and added_by = 'library-skyflipflop@bot'
  and updated_by = 'library-skyflipflop@bot';
