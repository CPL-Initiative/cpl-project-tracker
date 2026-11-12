-- Rollback for 2026-11-12_library_funding_followup_guide.sql: remove the one record the cohort added, if untouched since.
delete from public.cpl_library where slug = 'funding-follow-up-dashboard-guide'
  and added_by = 'library-fundguide-2026-11-12@bot' and updated_by = 'library-fundguide-2026-11-12@bot';
