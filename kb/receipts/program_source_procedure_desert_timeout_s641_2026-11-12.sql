-- Receipt: program_source_registry, College of the Desert, catalog.timeout_s 900 -> 2400.
-- Session 641 (second firing, the conductor), 2026-11-12, through the Supabase connector.
-- Why: the catalog is one 21 MB PDF; its fetch took 261 s once and ran past the 900 s limit twice
-- (run 43173033722 among them), so the college was never read by the PDF reader of #3135.
-- 2,400 s is the limit's maximum.
--
-- THE WRITE (the table's one write path, guarded on the procedure's md5 before the write):
select public.program_source_procedure_set(
  'College of the Desert',
  jsonb_set((select procedure from program_source_registry where college = 'College of the Desert'),
            '{catalog,timeout_s}', '2400'),
  'S641 conductor: the 900 s fetch limit was hit twice on a 21 MB catalog PDF',
  '5a5273a9256c261b32d2b355390409eb');
-- md5 before: 5a5273a9256c261b32d2b355390409eb (timeout_s 900). md5 after: bbf96cf25765ebfed75d8380f2f5cc3a (2400).
--
-- ROLLBACK (the same function; the registry's history table also keeps the version before):
-- select public.program_source_procedure_set(
--   'College of the Desert',
--   jsonb_set((select procedure from program_source_registry where college = 'College of the Desert'),
--             '{catalog,timeout_s}', '900'),
--   'rollback of the S641 timeout change', 'bbf96cf25765ebfed75d8380f2f5cc3a');
